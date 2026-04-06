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

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
  const docsPrefix = path.join('src', 'content', 'docs') + path.sep;
  const parityBySlug = new Map();
  for (const file of parity?.files ?? []) {
    const slug = file.file.startsWith(docsPrefix)
      ? file.file.slice(docsPrefix.length).replace(/\.md$/, '')
      : path.basename(file.file, '.md');
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

function isReportableParityIssue(issue) {
  if (issue.severity !== 'actionable' && issue.severity !== 'signal') return false;
  return isActiveIssue(issue);
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

function formatSnapshotEntry(entry) {
  if (entry.type === 'page-added') return `\`${entry.slug}\` — NEW PAGE`;
  if (entry.type === 'page-removed') return `\`${entry.slug}\` — REMOVED`;
  const cats = Object.entries(entry.categories ?? {})
    .filter(([, v]) => v.added > 0 || v.removed > 0)
    .map(([k, v]) => `${k}:+${v.added}/-${v.removed}`)
    .join(', ');
  return `\`${entry.slug}\` (${entry.diffLines} lines: ${cats})`;
}

export function buildActionableReport(snapshot, parity, auditManifest, options = {}) {
  const maxEntries = options.maxEntries ?? 10;
  const sourceSync = options.sourceSync ?? {};
  const snapshotChanges = snapshot.changes ?? [];
  const parityFiles = parity.files ?? [];
  // Only files with at least one ACTIVE (non-acknowledged or expired) actionable/signal
  // issue should drive parity-regression issue creation. Phase 3 acknowledgements are
  // explicitly non-blocking and must not trigger regression issues.
  const parityIssueFiles = parityFiles.filter((file) =>
    (file.issues ?? []).some(isReportableParityIssue),
  );

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
          .filter(isReportableParityIssue)
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
      issueTitle: SOURCE_SYNC_ISSUE_TITLE,
      shouldOpenIssue: syncShouldOpen,
      freshnessState,
      body: sourceSyncBody,
      summary: {
        targetPages: syncSummary.targetPages ?? 0,
        fetchedPages: syncSummary.fetchedPages ?? 0,
        notFoundPages: syncSummary.notFoundPages ?? 0,
        errorPages: syncSummary.errorPages ?? 0,
        sidebarVerified: syncSummary.sidebarVerified ?? false,
      },
    },
    snapshotDiff: {
      issueTitle: SNAPSHOT_ISSUE_TITLE,
      shouldOpenIssue: snapshotChanges.length > 0,
      topEntries: snapshotTopEntries,
      body: snapshotIssueBody,
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
      issueTitle: PARITY_ISSUE_TITLE,
      shouldOpenIssue: parityIssueFiles.length > 0,
      topEntries: parityTopEntries,
      body: parityIssueBody,
      summary: {
        // Phase 3: only count files with at least one ACTIVE reportable issue,
        // ignoring validly-acknowledged issues. Expired acknowledgements remain active.
        issueCount: parityIssueFiles.length,
        signalFiles: parity.summary?.signalFiles || 0,
        errorFiles: parity.summary?.errorFiles || 0,
        acknowledgedIssues: parity.summary?.acknowledgedIssues || 0,
        expiredAcknowledgements: parity.summary?.expiredAcknowledgements || 0,
        issuesByType: parity.summary?.issuesByType || {},
        issuesBySeverity: parity.summary?.issuesBySeverity || {},
      },
    },
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
    `- Actionable files: ${parity.summary?.actionableFiles || 0}`,
    `- Signal-only files: ${parity.summary?.signalFiles || 0}`,
    `- Error files: ${parity.summary?.errorFiles || 0}`,
    '',
    '## Audit Manifest',
    '',
    `- Total review entries: ${auditManifest.length}`,
    `- Page lifecycle: ${actionableReport.auditManifest.bucketCounts['page-lifecycle'] || 0}`,
    `- Structural change: ${actionableReport.auditManifest.bucketCounts['structural-change'] || 0}`,
    `- Content only: ${actionableReport.auditManifest.bucketCounts['content-only'] || 0}`,
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

export { SNAPSHOT_ISSUE_TITLE, PARITY_ISSUE_TITLE, SOURCE_SYNC_ISSUE_TITLE };
