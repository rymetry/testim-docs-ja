import fs from 'node:fs';
import path from 'node:path';

import {
  DOCS_DIR,
  ROOT_DIR,
  getDocSection,
} from './project.mjs';

const DATE_ISSUE_TITLE = '📅 Date Drift: translated docs lag English source';
const PARITY_ISSUE_TITLE =
  '🔍 Parity Regression: actionable content drift detected';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function formatList(values) {
  if (!values.length) return '- なし';
  return values.map((value) => `- ${value}`).join('\n');
}

export function isParserSensitiveContent(content) {
  return (
    /<Image\b/i.test(content) ||
    /<img\b/i.test(content) ||
    /(^|\n)(?: {2,}|\t)```/.test(content)
  );
}

function bucketPriority(bucket) {
  if (bucket === 'high-confidence drift') return 0;
  if (bucket === 'parser-sensitive') return 1;
  return 2;
}

export function classifyAuditBucket({ content, signals }) {
  if (isParserSensitiveContent(content)) {
    return 'parser-sensitive';
  }
  if (
    signals.some((signal) =>
      ['image-mismatch', 'codeblock-mismatch'].includes(signal.type),
    )
  ) {
    return 'high-confidence drift';
  }
  return 'date-only provisional';
}

export function assignReviewGroups(entries, groupCount = 6) {
  const groups = Array.from({ length: groupCount }, (_, index) => ({
    name: `review-group-${index + 1}`,
    count: 0,
  }));
  const sorted = [...entries].sort((left, right) => {
    const bucketDiff = bucketPriority(left.bucket) - bucketPriority(right.bucket);
    if (bucketDiff !== 0) return bucketDiff;
    if (left.section !== right.section) return left.section.localeCompare(right.section);
    return left.file.localeCompare(right.file);
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
  updates,
  parity,
  { rootDir = ROOT_DIR, groupCount = 6 } = {},
) {
  const parityByFile = new Map(
    (parity?.files ?? []).map((file) => [file.file, file.issues ?? []]),
  );

  const outdatedEntries = (updates.files ?? []).filter((file) => file.needsUpdate);
  const manifestEntries = outdatedEntries.map((file) => {
    const fullPath = path.join(rootDir, file.file);
    const content = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
    const signals = parityByFile.get(file.file) ?? [];
    const bucket = classifyAuditBucket({ content, signals });

    return {
      file: file.file,
      section: getDocSection(file.file),
      sourceDate: file.englishUpdated,
      localDate: file.japaneseUpdated,
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

  return assignReviewGroups(manifestEntries, groupCount);
}

function summarizeDateStatuses(updateFiles) {
  const statusCounts = {};
  const comparisonStatusCounts = {};
  for (const file of updateFiles) {
    statusCounts[file.status] = (statusCounts[file.status] || 0) + 1;
    if (file.comparisonStatus) {
      comparisonStatusCounts[file.comparisonStatus] =
        (comparisonStatusCounts[file.comparisonStatus] || 0) + 1;
    }
  }
  return { statusCounts, comparisonStatusCounts };
}

function sortDateEntries(entries) {
  return [...entries].sort((left, right) => {
    const leftDays = left.daysBehind ?? -1;
    const rightDays = right.daysBehind ?? -1;
    if (rightDays !== leftDays) return rightDays - leftDays;
    return left.file.localeCompare(right.file);
  });
}

function scoreParityEntry(entry) {
  return entry.issues.reduce((score, issue) => {
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

export function buildActionableReport(updates, parity, auditManifest, options = {}) {
  const maxEntries = options.maxEntries ?? 10;
  const updateFiles = updates.files ?? [];
  const parityFiles = parity.files ?? [];
  const dateEntries = updateFiles.filter((file) => file.needsUpdate);
  const dateSummary = summarizeDateStatuses(updateFiles);
  const parityActionableFiles = parityFiles.filter((file) =>
    (file.issues ?? []).some((issue) => issue.severity === 'actionable'),
  );

  const dateTopEntries = sortDateEntries(dateEntries).slice(0, maxEntries);
  const parityTopEntries = sortParityEntries(parityActionableFiles).slice(
    0,
    maxEntries,
  );

  const dateIssueBody = [
    '## Summary',
    '',
    `- Checked at: ${updates.checkedAt ?? 'unknown'}`,
    `- Actionable outdated files: ${dateEntries.length}`,
    `- Up to date: ${dateSummary.comparisonStatusCounts['up-to-date'] || 0}`,
    `- JA newer than source: ${dateSummary.comparisonStatusCounts.newer || 0}`,
    `- Ignored exceptions: ${dateSummary.statusCounts['ignored-exception'] || 0}`,
    `- Source date divergence: ${dateSummary.statusCounts['source-date-divergence'] || 0}`,
    `- Fetch errors: ${dateSummary.statusCounts['fetch-error'] || 0}`,
    '',
    '## Top Entries',
    '',
    formatList(
      dateTopEntries.map(
        (entry) =>
          `\`${entry.file}\` (${entry.japaneseUpdated} -> ${entry.englishUpdated}, ${entry.daysBehind} days behind)`,
      ),
    ),
    '',
    '## Artifacts',
    '',
    '- `docs-update-status.json`',
    '- `docs-update-summary.md`',
    '- `docs-audit-manifest.json`',
  ].join('\n');

  const parityIssueBody = [
    '## Summary',
    '',
    `- Checked at: ${parity.summary?.checkedAt ?? 'unknown'}`,
    `- Actionable files: ${parity.summary?.actionableFiles || 0}`,
    `- Signal-only files: ${parity.summary?.signalFiles || 0}`,
    `- Error files: ${parity.summary?.errorFiles || 0}`,
    '',
    '## Top Entries',
    '',
    formatList(
      parityTopEntries.map((entry) => {
        const issueLabels = entry.issues
          .filter((issue) => issue.severity === 'actionable')
          .map((issue) => `${issue.type}${issue.detail ? ` (${issue.detail})` : ''}`)
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

  return {
    generatedAt: new Date().toISOString(),
    dateDrift: {
      issueTitle: DATE_ISSUE_TITLE,
      shouldOpenIssue: dateEntries.length > 0,
      topEntries: dateTopEntries,
      body: dateIssueBody,
      summary: {
        actionableCount: dateEntries.length,
        statusCounts: dateSummary.statusCounts,
        comparisonStatusCounts: dateSummary.comparisonStatusCounts,
      },
    },
    parityRegression: {
      issueTitle: PARITY_ISSUE_TITLE,
      shouldOpenIssue: parityActionableFiles.length > 0,
      topEntries: parityTopEntries,
      body: parityIssueBody,
      summary: {
        actionableCount: parity.summary?.actionableFiles || 0,
        signalFiles: parity.summary?.signalFiles || 0,
        errorFiles: parity.summary?.errorFiles || 0,
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

export function renderSummaryMarkdown(updates, parity, actionableReport, auditManifest) {
  return [
    '# Docs Detection Summary',
    '',
    `Generated: ${actionableReport.generatedAt}`,
    '',
    '## Date Drift',
    '',
    `- Actionable outdated files: ${actionableReport.dateDrift.summary.actionableCount}`,
    `- Up to date: ${
      actionableReport.dateDrift.summary.comparisonStatusCounts['up-to-date'] || 0
    }`,
    `- JA newer than source: ${
      actionableReport.dateDrift.summary.comparisonStatusCounts.newer || 0
    }`,
    `- Ignored exceptions: ${
      actionableReport.dateDrift.summary.statusCounts['ignored-exception'] || 0
    }`,
    `- Source date divergence: ${
      actionableReport.dateDrift.summary.statusCounts['source-date-divergence'] || 0
    }`,
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
    `- High-confidence drift: ${actionableReport.auditManifest.bucketCounts['high-confidence drift'] || 0}`,
    `- Parser-sensitive: ${actionableReport.auditManifest.bucketCounts['parser-sensitive'] || 0}`,
    `- Date-only provisional: ${actionableReport.auditManifest.bucketCounts['date-only provisional'] || 0}`,
    '',
    '## Files',
    '',
    '- `docs-update-status.json`',
    '- `parity-check-status.json`',
    '- `docs-audit-manifest.json`',
    '- `docs-actionable-report.json`',
  ].join('\n');
}

export function loadDetectionInputs({
  updatesPath = path.join(ROOT_DIR, 'docs-update-status.json'),
  parityPath = path.join(ROOT_DIR, 'parity-check-status.json'),
} = {}) {
  return {
    updates: readJson(updatesPath),
    parity: readJson(parityPath),
  };
}

export { DATE_ISSUE_TITLE, PARITY_ISSUE_TITLE };

