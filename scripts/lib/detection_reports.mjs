import fs from 'node:fs';
import path from 'node:path';

import {
  ROOT_DIR,
} from './project.mjs';

const SNAPSHOT_ISSUE_TITLE =
  '📸 Content Drift: English source changes detected via snapshot diff';
const PARITY_ISSUE_TITLE =
  '🔍 Parity Regression: content drift detected';
const SOURCE_SYNC_ISSUE_TITLE =
  '⚠️ Source Sync Health: fetch degradation detected';
const PARITY_FOLLOWUP_ISSUE_TITLE =
  '🗂️ Parity Followup: baseline debt and advisory queue';
const DOCS_PREFIX = path.join('src', 'content', 'docs') + path.sep;

/**
 * Family keys used in HTML body comments and by sync-detection-issues.cjs for
 * key-based issue matching.  Embed as `<!-- detection-family: KEY -->` in the
 * issue body so the sync script can find existing issues without relying on
 * the exact title string.
 */
export const FAMILY_KEYS = {
  SNAPSHOT_DIFF: 'snapshot-diff',
  PARITY_REGRESSION: 'parity-regression',
  SOURCE_SYNC_HEALTH: 'source-sync-health',
  PARITY_FOLLOWUP: 'parity-followup',
};

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fileToSlug(filePath) {
  if (typeof filePath !== 'string' || filePath.length === 0) return null;
  if (filePath.startsWith(DOCS_PREFIX)) {
    return filePath.slice(DOCS_PREFIX.length).replace(/\.md$/, '');
  }
  return path.basename(filePath, '.md');
}

function formatList(values) {
  if (!values.length) return '- なし';
  return values.map((value) => `- ${value}`).join('\n');
}

function bucketPriority(bucket) {
  if (bucket === 'page-lifecycle') return 0;
  if (bucket === 'structural-change') return 1;
  return 2; // content-only
}

export function classifySnapshotBucket(change) {
  if (change.type === 'page-added' || change.type === 'page-removed') {
    return 'page-lifecycle';
  }
  if (
    change.categories &&
    ['heading', 'image', 'code', 'callout'].some(
      (cat) =>
        (change.categories[cat]?.added ?? 0) +
          (change.categories[cat]?.removed ?? 0) >
        0,
    )
  ) {
    return 'structural-change';
  }
  return 'content-only';
}

export function assignReviewGroups(entries, groupCount = 6) {
  const groups = Array.from({ length: groupCount }, (_, index) => ({
    name: `review-group-${index + 1}`,
    count: 0,
  }));
  const sorted = [...entries].sort((left, right) => {
    const bucketDiff = bucketPriority(left.bucket) - bucketPriority(right.bucket);
    if (bucketDiff !== 0) return bucketDiff;
    const leftKey = left.slug ?? '';
    const rightKey = right.slug ?? '';
    return leftKey.localeCompare(rightKey);
  });

  return sorted.map((entry) => {
    groups.sort((left, right) => left.count - right.count);
    const selected = groups[0];
    selected.count += 1;
    return {
      ...entry,
      reviewGroup: selected.name,
    };
  });
}

export function buildAuditManifest(
  snapshot,
  parity,
  { groupCount = 6 } = {},
) {
  const changes = snapshot.changes ?? [];

  // Build parity index by slug (extract from file path)
  const parityBySlug = new Map();
  for (const file of parity?.files ?? []) {
    const slug = fileToSlug(file.file);
    parityBySlug.set(slug, file.issues ?? []);
  }

  const entries = changes.map((change) => {
    const signals = parityBySlug.get(change.slug) ?? [];
    const bucket = classifySnapshotBucket(change);

    return {
      slug: change.slug,
      type: change.type,
      sourceUrl: change.sourceUrl,
      diffLines: change.diffLines,
      categories: change.categories,
      signals: signals.map((signal) => ({
        type: signal.type,
        severity: signal.severity,
        detail: signal.detail ?? signal.text ?? '',
      })),
      bucket,
      verificationStatus: 'needs-human-review',
      reviewer: '',
      notes: '',
    };
  });

  return assignReviewGroups(entries, groupCount);
}

function sortSnapshotEntries(entries) {
  const typeOrder = { 'page-added': 0, 'page-removed': 1, 'page-changed': 2 };
  return [...entries].sort((left, right) => {
    const typeDiff = (typeOrder[left.type] ?? 2) - (typeOrder[right.type] ?? 2);
    if (typeDiff !== 0) return typeDiff;
    return (right.diffLines || 0) - (left.diffLines || 0);
  });
}

/**
 * An issue is "active" if it is NOT validly acknowledged.
 * Expired acknowledgements count as active (source has changed or review date passed).
 */
function isActiveIssue(issue) {
  if (issue.acknowledged !== true) return true;
  if (issue.ackExpired === true) return true;
  return false;
}

/**
 * Reportable for the parityRegression gate: actionable/signal severity,
 * not validly acknowledged, AND not frozen by a non-expired baseline entry.
 * Expired baselines (baselineExpired: true) are re-activated and count as
 * regression.  Non-expired baselined issues are surfaced in parityFollowup
 * instead.
 */
function isReportableParityIssue(issue) {
  if (issue.severity !== 'actionable' && issue.severity !== 'signal') return false;
  if (issue.baselined === true && issue.baselineExpired !== true) return false;
  return isActiveIssue(issue);
}

function withFamilyMarker(body, key) {
  if (!body) return '';
  return `<!-- detection-family: ${key} -->\n${body}`;
}

function scoreParityEntry(entry) {
  return entry.issues.reduce((score, issue) => {
    if (!isActiveIssue(issue)) return score;
    if (issue.type === 'image-mismatch') return score + 3;
    if (issue.type === 'codeblock-mismatch') return score + 3;
    if (issue.severity === 'actionable') return score + 2;
    if (issue.severity === 'error') return score + 1;
    return score;
  }, 0);
}

function sortParityEntries(entries) {
  return [...entries].sort((left, right) => {
    const scoreDiff = scoreParityEntry(right) - scoreParityEntry(left);
    if (scoreDiff !== 0) return scoreDiff;
    return left.file.localeCompare(right.file);
  });
}

function buildParityEntries(files, issueFilter) {
  return files
    .map((file) => ({
      ...file,
      issues: (file.issues ?? []).filter(issueFilter),
    }))
    .filter((file) => file.issues.length > 0);
}

function summarizeIssueEntries(entries) {
  const issuesByType = {};
  const issuesBySeverity = {};

  for (const entry of entries) {
    for (const issue of entry.issues ?? []) {
      issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
      issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;
    }
  }

  return {
    issuesByType,
    issuesBySeverity,
  };
}

function formatSnapshotEntry(entry) {
  if (entry.type === 'page-added') return `\`${entry.slug}\` — NEW PAGE`;
  if (entry.type === 'page-removed') return `\`${entry.slug}\` — REMOVED`;
  const cats = Object.entries(entry.categories ?? {})
    .filter(([, v]) => v.added > 0 || v.removed > 0)
    .map(([k, v]) => `${k}:+${v.added}/-${v.removed}`)
    .join(', ');
  return `\`${entry.slug}\` (${entry.diffLines} lines: ${cats})`;
}

function buildTopBaselinedPages(files, maxEntries) {
  return files
    .map((file) => {
      const baselinedIssues = (file.issues ?? []).filter((issue) => issue.baselined === true);
      if (baselinedIssues.length === 0) return null;

      const expiredBaselineEntries = baselinedIssues.filter(
        (issue) => issue.baselineExpired === true,
      ).length;

      return {
        file: file.file,
        slug: fileToSlug(file.file),
        issueCount: baselinedIssues.length,
        expiredBaselineEntries,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      const issueDiff = right.issueCount - left.issueCount;
      if (issueDiff !== 0) return issueDiff;
      const expiredDiff = right.expiredBaselineEntries - left.expiredBaselineEntries;
      if (expiredDiff !== 0) return expiredDiff;
      return left.file.localeCompare(right.file);
    })
    .slice(0, maxEntries);
}

function buildTokenlessNearTieExamples(advisoryQueue, maxEntries) {
  return advisoryQueue
    .map((entry) => {
      const example = (entry.issues ?? []).find(
        (issue) => issue.inconclusiveCategory === 'tokenless-near-tie',
      );
      if (!example) return null;

      return {
        slug: entry.slug ?? fileToSlug(entry.file),
        file: entry.file,
        queueKey: example.queueKey ?? null,
        blocking: entry.blocking === true,
        detail: example.detail ?? '',
        leftSectionPath: example.leftSectionPath ?? null,
        rightSectionPath: example.rightSectionPath ?? null,
        currentScore: example.currentScore ?? null,
        swapScore: example.swapScore ?? null,
      };
    })
    .filter(Boolean)
    .slice(0, maxEntries);
}

function buildParityFollowupBody({
  summary,
  expiredBaselineFiles,
  baselineInvalidatedSlugs,
  blockingAdvisoryItems,
  advisoryQueueIssues,
  advisoryQueueFiles,
  advisoryQueueScope,
  includeAdvisoryInBody,
}) {
  const lines = [
    '## Summary',
    '',
    `- Checked at: ${summary.checkedAt ?? 'unknown'}`,
    `- Baselined issues: ${summary.baselinedIssues ?? 0} (${summary.baselinedFiles ?? 0} files)`,
    `- Expired baseline entries: ${summary.expiredBaselineEntries ?? 0}`,
    `- Baseline-invalidated slugs: ${baselineInvalidatedSlugs.length}`,
    '',
  ];

  if (includeAdvisoryInBody) {
    const scopeType = advisoryQueueScope?.type ?? 'unknown';
    lines.push(
      `- Advisory queue: ${advisoryQueueIssues} issues (${advisoryQueueFiles} files)`,
      `  - Scope: ${scopeType} (complete)`,
      `  - Blocking: ${blockingAdvisoryItems.length}`,
      '',
    );
  }

  if (expiredBaselineFiles.length > 0) {
    lines.push('## Expired Baseline Entries', '');
    lines.push(
      formatList(
        expiredBaselineFiles.map((f) => {
          const rv = f.reviewAfter ? ` — reviewAfter: ${f.reviewAfter}` : '';
          return `\`${f.file}\` (${f.count} entries${rv})`;
        }),
      ),
    );
    lines.push('');
  }

  if (baselineInvalidatedSlugs.length > 0) {
    lines.push('## Baseline-Invalidated Slugs', '');
    lines.push(
      formatList(baselineInvalidatedSlugs.map((s) => `\`${s}\` — EN snapshot changed`)),
    );
    lines.push('');
  }

  if (blockingAdvisoryItems.length > 0) {
    lines.push('## Advisory Queue — Blocking Items', '');
    lines.push(
      formatList(
        blockingAdvisoryItems.map((e) => {
          const topIssue = (e.issues ?? [])[0];
          const cat = topIssue?.inconclusiveCategory ?? 'unknown';
          return `\`${e.slug}\` — ${cat} (${e.issueCount} issues)`;
        }),
      ),
    );
    lines.push('');
  }

  lines.push('## Artifacts', '', '- `parity-check-status.json`');

  return lines.join('\n');
}

function buildParityFollowup(parity, options = {}) {
  const maxEntries = options.maxEntries ?? 10;
  const summary = parity.summary ?? {};
  const files = parity.files ?? [];
  const advisoryQueue = parity.advisoryQueue ?? [];
  const advisoryQueueScope = parity.advisoryQueueScope ?? null;

  const expiredBaselineEntries = summary.expiredBaselineEntries ?? 0;
  const baselineInvalidatedSlugs = summary.baselineInvalidatedSlugs ?? [];
  const advisoryQueueIssues = summary.advisoryQueueIssues ?? 0;
  const advisoryQueueFiles = summary.advisoryQueueFiles ?? 0;
  const isComplete = advisoryQueueScope?.isComplete ?? null;

  const blockingAdvisoryItems = advisoryQueue.filter((e) => e.blocking);
  const hasBlockingAdvisory = isComplete === true && blockingAdvisoryItems.length > 0;

  const shouldOpenIssue =
    expiredBaselineEntries > 0 ||
    baselineInvalidatedSlugs.length > 0 ||
    hasBlockingAdvisory;

  const expiredBaselineFiles = [];
  for (const file of files) {
    const expired = (file.issues ?? []).filter(
      (i) => i.baselined === true && i.baselineExpired === true,
    );
    if (expired.length > 0) {
      expiredBaselineFiles.push({
        file: file.file,
        count: expired.length,
        reviewAfter:
          expired.map((i) => i.baselineReviewAfter).filter(Boolean)[0] ?? null,
      });
    }
  }
  expiredBaselineFiles.sort((a, b) => b.count - a.count);
  const reviewHints = {
    topBaselinedPages: buildTopBaselinedPages(files, maxEntries),
    tokenlessNearTieExamples: buildTokenlessNearTieExamples(advisoryQueue, maxEntries),
  };

  const body = shouldOpenIssue
    ? withFamilyMarker(
        buildParityFollowupBody({
          summary,
          expiredBaselineFiles: expiredBaselineFiles.slice(0, maxEntries),
          baselineInvalidatedSlugs,
          blockingAdvisoryItems:
            isComplete === true ? blockingAdvisoryItems.slice(0, maxEntries) : [],
          advisoryQueueIssues,
          advisoryQueueFiles,
          advisoryQueueScope,
          includeAdvisoryInBody: isComplete === true,
        }),
        FAMILY_KEYS.PARITY_FOLLOWUP,
      )
    : '';

  return {
    key: FAMILY_KEYS.PARITY_FOLLOWUP,
    issueTitle: PARITY_FOLLOWUP_ISSUE_TITLE,
    shouldOpenIssue,
    body,
    summary: {
      baselineDebt: {
        baselinedIssues: summary.baselinedIssues ?? 0,
        baselinedFiles: summary.baselinedFiles ?? 0,
        expiredBaselineEntries,
        expiredBaselineFiles,
        baselineInvalidatedSlugs,
        baselineInvalidatedSlugCount: baselineInvalidatedSlugs.length,
      },
      advisoryQueue: {
        issues: advisoryQueueIssues,
        files: advisoryQueueFiles,
        blockingItems: blockingAdvisoryItems.length,
        advisoryQueueScope,
        advisoryQueue,
        includedInIssueBody: isComplete === true,
      },
      reviewHints,
    },
  };
}

export function buildActionableReport(snapshot, parity, auditManifest, options = {}) {
  const maxEntries = options.maxEntries ?? 10;
  const sourceSync = options.sourceSync ?? {};
  const snapshotChanges = snapshot.changes ?? [];
  const parityFiles = parity.files ?? [];
  const parityIssueFiles = buildParityEntries(parityFiles, isReportableParityIssue);
  const parityIssueSummary = summarizeIssueEntries(parityIssueFiles);

  const snapshotTopEntries = sortSnapshotEntries(snapshotChanges).slice(0, maxEntries);
  const parityTopEntries = sortParityEntries(parityIssueFiles).slice(
    0,
    maxEntries,
  );

  const snapshotIssueBody = [
    '## Summary',
    '',
    `- Checked at: ${snapshot.checkedAt ?? 'unknown'}`,
    `- Changed pages: ${snapshot.summary?.changed || 0}`,
    `- Added pages: ${snapshot.summary?.added || 0}`,
    `- Removed pages: ${snapshot.summary?.removed || 0}`,
    `- Unchanged: ${snapshot.summary?.unchanged || 0}`,
    `- Total snapshots: ${snapshot.summary?.totalSnapshots || 0}`,
    '',
    '## Top Entries',
    '',
    formatList(snapshotTopEntries.map(formatSnapshotEntry)),
    '',
    ...(snapshot.sidebar?.changed
      ? [
          '## Sidebar Changes',
          '',
          `- Pages added: ${snapshot.sidebar.addedPages?.length || 0}`,
          `- Pages removed: ${snapshot.sidebar.removedPages?.length || 0}`,
          '',
        ]
      : []),
    '## Artifacts',
    '',
    '- `snapshot-diff-status.json`',
    '- `docs-update-summary.md`',
    '- `docs-audit-manifest.json`',
  ].join('\n');

  const activeActionableFiles =
    parity.summary?.activeActionableFiles ?? parity.summary?.actionableFiles ?? 0;
  const activeErrorFiles =
    parity.summary?.activeErrorFiles ?? parity.summary?.errorFiles ?? 0;
  const acknowledgedIssues = parity.summary?.acknowledgedIssues || 0;
  const expiredAcknowledgements = parity.summary?.expiredAcknowledgements || 0;

  const parityIssueBody = [
    '## Summary',
    '',
    `- Checked at: ${parity.summary?.checkedAt ?? 'unknown'}`,
    `- Active actionable files: ${activeActionableFiles}`,
    `- Active issue files: ${parityIssueFiles.length}`,
    `- Error files: ${activeErrorFiles}`,
    `- Acknowledged (non-blocking): ${acknowledgedIssues}`,
    ...(expiredAcknowledgements > 0
      ? [`- ⚠ Expired acknowledgements: ${expiredAcknowledgements}`]
      : []),
    '',
    '## Top Entries',
    '',
    formatList(
      parityTopEntries.map((entry) => {
        const issueLabels = entry.issues
          .map((issue) => {
            const tag = issue.severity === 'signal' ? '[signal] ' : '';
            return `${tag}${issue.type}${issue.detail ? ` (${issue.detail})` : ''}`;
          })
          .join(', ');
        return `\`${entry.file}\` - ${issueLabels}`;
      }),
    ),
    '',
    '## Artifacts',
    '',
    '- `parity-check-status.json`',
    '- `docs-update-summary.md`',
    '- `docs-audit-manifest.json`',
  ].join('\n');

  // Source sync health
  const freshnessState = sourceSync.freshnessState ?? null;
  const syncShouldOpen = freshnessState === 'broken' || freshnessState === 'partial';
  const syncSummary = sourceSync.summary ?? {};
  const syncErrors = sourceSync.errors ?? [];

  const sourceSyncBody = syncShouldOpen
    ? [
        '## Summary',
        '',
        `- Freshness state: **${freshnessState}**`,
        `- Target pages: ${syncSummary.targetPages ?? 0}`,
        `- Fetched pages: ${syncSummary.fetchedPages ?? 0}`,
        `- Not found pages: ${syncSummary.notFoundPages ?? 0}`,
        `- Error pages: ${syncSummary.errorPages ?? 0}`,
        `- Sidebar verified: ${syncSummary.sidebarVerified ?? false}`,
        '',
        '## Errors',
        '',
        formatList(syncErrors.map((e) => `\`${e.slug}\` — ${e.detail}`)),
        '',
        '## Artifacts',
        '',
        '- `source-sync-status.json`',
      ].join('\n')
    : '';

  return {
    generatedAt: new Date().toISOString(),
    sourceSyncHealth: {
      key: FAMILY_KEYS.SOURCE_SYNC_HEALTH,
      issueTitle: SOURCE_SYNC_ISSUE_TITLE,
      shouldOpenIssue: syncShouldOpen,
      freshnessState,
      body: withFamilyMarker(sourceSyncBody, FAMILY_KEYS.SOURCE_SYNC_HEALTH),
      summary: {
        targetPages: syncSummary.targetPages ?? 0,
        fetchedPages: syncSummary.fetchedPages ?? 0,
        notFoundPages: syncSummary.notFoundPages ?? 0,
        errorPages: syncSummary.errorPages ?? 0,
        sidebarVerified: syncSummary.sidebarVerified ?? false,
      },
    },
    snapshotDiff: {
      key: FAMILY_KEYS.SNAPSHOT_DIFF,
      issueTitle: SNAPSHOT_ISSUE_TITLE,
      shouldOpenIssue: snapshotChanges.length > 0,
      topEntries: snapshotTopEntries,
      body: withFamilyMarker(snapshotIssueBody, FAMILY_KEYS.SNAPSHOT_DIFF),
      summary: {
        actionableCount: snapshotChanges.length,
        totalSnapshots: snapshot.summary?.totalSnapshots || 0,
        changed: snapshot.summary?.changed || 0,
        added: snapshot.summary?.added || 0,
        removed: snapshot.summary?.removed || 0,
        unchanged: snapshot.summary?.unchanged || 0,
      },
    },
    parityRegression: {
      key: FAMILY_KEYS.PARITY_REGRESSION,
      issueTitle: PARITY_ISSUE_TITLE,
      shouldOpenIssue: parityIssueFiles.length > 0,
      topEntries: parityTopEntries,
      body: withFamilyMarker(parityIssueBody, FAMILY_KEYS.PARITY_REGRESSION),
      summary: {
        // Only count files with at least one ACTIVE reportable issue.
        // Validly-acknowledged and non-expired baselined issues are excluded.
        issueCount: parityIssueFiles.length,
        acknowledgedIssues: parity.summary?.acknowledgedIssues || 0,
        expiredAcknowledgements: parity.summary?.expiredAcknowledgements || 0,
        issuesByType: parityIssueSummary.issuesByType,
        issuesBySeverity: parityIssueSummary.issuesBySeverity,
      },
    },
    parityFollowup: buildParityFollowup(parity, options),
    auditManifest: {
      total: auditManifest.length,
      bucketCounts: auditManifest.reduce((acc, entry) => {
        acc[entry.bucket] = (acc[entry.bucket] || 0) + 1;
        return acc;
      }, {}),
    },
  };
}

export function renderSummaryMarkdown(_snapshot, parity, actionableReport, auditManifest, sourceSync) {
  const syncState = sourceSync?.freshnessState ?? actionableReport?.sourceSyncHealth?.freshnessState ?? 'unknown';
  const syncSummary = sourceSync?.summary ?? actionableReport?.sourceSyncHealth?.summary ?? {};

  return [
    '# Docs Detection Summary',
    '',
    `Generated: ${actionableReport.generatedAt}`,
    '',
    '## Source Sync Health',
    '',
    `- Freshness state: ${syncState}`,
    `- Fetched: ${syncSummary.fetchedPages ?? 0} / ${syncSummary.targetPages ?? 0} pages`,
    `- Errors: ${syncSummary.errorPages ?? 0}`,
    `- Sidebar verified: ${syncSummary.sidebarVerified ?? false}`,
    '',
    '## Snapshot Diff',
    '',
    `- Changed pages: ${actionableReport.snapshotDiff.summary.changed}`,
    `- Added pages: ${actionableReport.snapshotDiff.summary.added}`,
    `- Removed pages: ${actionableReport.snapshotDiff.summary.removed}`,
    `- Unchanged: ${actionableReport.snapshotDiff.summary.unchanged}`,
    `- Total snapshots: ${actionableReport.snapshotDiff.summary.totalSnapshots}`,
    '',
    '## Parity',
    '',
    // Phase 3: report active (non-acknowledged) counts so the summary matches
    // actionableReport.parityRegression.shouldOpenIssue / issueCount.
    `- Active actionable files: ${
      parity.summary?.activeActionableFiles ?? parity.summary?.actionableFiles ?? 0
    }`,
    `- Active issue files: ${
      parity.summary?.activeFiles ?? actionableReport?.parityRegression?.summary?.issueCount ?? 0
    }`,
    `- Error files: ${parity.summary?.activeErrorFiles ?? parity.summary?.errorFiles ?? 0}`,
    `- Acknowledged (non-blocking): ${parity.summary?.acknowledgedIssues || 0}`,
    ...((parity.summary?.expiredAcknowledgements || 0) > 0
      ? [`- ⚠ Expired acknowledgements: ${parity.summary.expiredAcknowledgements}`]
      : []),
    '',
    '## Audit Manifest',
    '',
    `- Total review entries: ${auditManifest.length}`,
    `- Page lifecycle: ${actionableReport.auditManifest.bucketCounts['page-lifecycle'] || 0}`,
    `- Structural change: ${actionableReport.auditManifest.bucketCounts['structural-change'] || 0}`,
    `- Content only: ${actionableReport.auditManifest.bucketCounts['content-only'] || 0}`,
    '',
    '## Parity Followup',
    '',
    `- Baselined: ${actionableReport.parityFollowup?.summary?.baselineDebt?.baselinedIssues ?? 0} issues (${actionableReport.parityFollowup?.summary?.baselineDebt?.baselinedFiles ?? 0} files)`,
    `- Expired baseline entries: ${actionableReport.parityFollowup?.summary?.baselineDebt?.expiredBaselineEntries ?? 0}`,
    `- Invalidated slugs: ${(actionableReport.parityFollowup?.summary?.baselineDebt?.baselineInvalidatedSlugs ?? []).length}`,
    `- Advisory queue: ${actionableReport.parityFollowup?.summary?.advisoryQueue?.issues ?? 0} issues (${actionableReport.parityFollowup?.summary?.advisoryQueue?.files ?? 0} files, ${actionableReport.parityFollowup?.summary?.advisoryQueue?.blockingItems ?? 0} blocking)`,
    '',
    '## Files',
    '',
    '- `snapshot-diff-status.json`',
    '- `parity-check-status.json`',
    '- `docs-audit-manifest.json`',
    '- `docs-actionable-report.json`',
  ].join('\n');
}

export function loadDetectionInputs({
  snapshotPath = path.join(ROOT_DIR, 'snapshot-diff-status.json'),
  parityPath = path.join(ROOT_DIR, 'parity-check-status.json'),
  sourceSyncPath = path.join(ROOT_DIR, 'source-sync-status.json'),
} = {}) {
  return {
    snapshot: readJson(snapshotPath),
    parity: readJson(parityPath),
    sourceSync: readJson(sourceSyncPath),
  };
}

export {
  SNAPSHOT_ISSUE_TITLE,
  PARITY_ISSUE_TITLE,
  SOURCE_SYNC_ISSUE_TITLE,
  PARITY_FOLLOWUP_ISSUE_TITLE,
};
