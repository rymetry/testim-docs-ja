import fs from 'node:fs';
import path from 'node:path';

import {
  ROOT_DIR,
} from './project.mjs';
import {
  isReportableParityIssue,
} from './source_parity_issue_state.mjs';

/**
 * Schema version for `docs-actionable-report.json`. Validators MUST
 * refuse to load any report whose `schemaVersion` does not match.
 */
export const ACTIONABLE_REPORT_SCHEMA_VERSION = 1;

const SNAPSHOT_ISSUE_TITLE =
  '📸 コンテンツ差分: スナップショットで英語原文の変更を検知';
const PARITY_ISSUE_TITLE =
  '🔍 パリティ後退: コンテンツの差分を検知';
const SOURCE_SYNC_ISSUE_TITLE =
  '⚠️ ソース同期: 取得の劣化またはソース原文の既知問題を検知';
const PARITY_FOLLOWUP_ISSUE_TITLE =
  '🗂️ パリティフォローアップ: ベースライン負債とアドバイザリキュー';
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

/**
 * §1 cleanup: strict validators for the three detection inputs. Each
 * returns the parsed object (same reference) on success, or throws a
 * descriptive Error. We deliberately do NOT default-fill missing
 * fields — the §2 fail-closed pipeline relies on validation errors to
 * refuse to sync managed issues from a half-baked run.
 */

function expectObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label}: expected JSON object, got ${value === null ? 'null' : typeof value}`);
  }
}

export function validateSnapshotDiffStatus(parsed) {
  expectObject(parsed, 'snapshot-diff-status.json');
  if (parsed.schemaVersion !== 1) {
    throw new Error(
      `snapshot-diff-status.json: unsupported schemaVersion ${JSON.stringify(parsed.schemaVersion)} (expected 1)`,
    );
  }
  if (typeof parsed.checkedAt !== 'string') {
    throw new Error('snapshot-diff-status.json: missing string "checkedAt"');
  }
  if (typeof parsed.runId !== 'string') {
    throw new Error('snapshot-diff-status.json: runId must be a string');
  }
  if (parsed.sourceSyncRunId !== null && typeof parsed.sourceSyncRunId !== 'string') {
    throw new Error('snapshot-diff-status.json: sourceSyncRunId must be string|null');
  }
  if (!parsed.summary || typeof parsed.summary !== 'object') {
    throw new Error('snapshot-diff-status.json: missing "summary" object');
  }
  if (!Array.isArray(parsed.changes)) {
    throw new Error('snapshot-diff-status.json: "changes" must be an array');
  }
  if (!parsed.runScope || typeof parsed.runScope !== 'object') {
    throw new Error('snapshot-diff-status.json: missing "runScope" object');
  }
  if (typeof parsed.runScope.isComplete !== 'boolean') {
    throw new Error('snapshot-diff-status.json: runScope.isComplete must be boolean');
  }
  return parsed;
}

export function validateParityCheckStatus(parsed) {
  expectObject(parsed, 'parity-check-status.json');
  if (parsed.schemaVersion !== 1) {
    throw new Error(
      `parity-check-status.json: unsupported schemaVersion ${JSON.stringify(parsed.schemaVersion)} (expected 1)`,
    );
  }
  if (!parsed.summary || typeof parsed.summary !== 'object') {
    throw new Error('parity-check-status.json: missing "summary" object');
  }
  if (typeof parsed.summary.checkedAt !== 'string') {
    throw new Error('parity-check-status.json: summary.checkedAt must be a string');
  }
  if (!Array.isArray(parsed.files)) {
    throw new Error('parity-check-status.json: "files" must be an array');
  }
  if (!parsed.summary.runScope || typeof parsed.summary.runScope !== 'object') {
    throw new Error('parity-check-status.json: summary.runScope is required');
  }
  if (typeof parsed.summary.runScope.isComplete !== 'boolean') {
    throw new Error('parity-check-status.json: summary.runScope.isComplete must be boolean');
  }
  const result = parsed.summary.result;
  if (result !== 'pass' && result !== 'fail' && result !== 'inconclusive') {
    throw new Error(
      `parity-check-status.json: summary.result must be one of pass|fail|inconclusive, got ${JSON.stringify(result)}`,
    );
  }
  return parsed;
}

export function validateSourceSyncStatus(parsed) {
  expectObject(parsed, 'source-sync-status.json');
  const version = parsed.schemaVersion;
  if (version !== 1 && version !== 2) {
    throw new Error(
      `source-sync-status.json: unsupported schemaVersion ${JSON.stringify(version)} (expected 1 or 2)`,
    );
  }
  if (typeof parsed.runId !== 'string') {
    throw new Error('source-sync-status.json: runId must be a string');
  }
  if (typeof parsed.checkedAt !== 'string') {
    throw new Error('source-sync-status.json: checkedAt must be a string');
  }
  if (
    parsed.freshnessState !== 'fresh' &&
    parsed.freshnessState !== 'partial' &&
    parsed.freshnessState !== 'broken' &&
    parsed.freshnessState !== 'stale'
  ) {
    throw new Error(
      `source-sync-status.json: freshnessState must be one of fresh|partial|broken|stale, got ${JSON.stringify(parsed.freshnessState)}`,
    );
  }
  if (typeof parsed.sourceInventoryFingerprint !== 'string') {
    throw new Error('source-sync-status.json: sourceInventoryFingerprint must be a string');
  }
  if (typeof parsed.sidebarFingerprint !== 'string') {
    throw new Error('source-sync-status.json: sidebarFingerprint must be a string');
  }
  if (!parsed.runScope || typeof parsed.runScope !== 'object') {
    throw new Error('source-sync-status.json: runScope is required');
  }
  if (typeof parsed.runScope.isComplete !== 'boolean') {
    throw new Error('source-sync-status.json: runScope.isComplete must be boolean');
  }
  if (!parsed.summary || typeof parsed.summary !== 'object') {
    throw new Error('source-sync-status.json: summary is required');
  }
  if (typeof parsed.summary.sidebarVerified !== 'boolean') {
    throw new Error('source-sync-status.json: summary.sidebarVerified must be boolean');
  }
  // Issue #255 — excluded counter の strict validation。
  // v2 では必須。v1 (pre-#255) では欠損を許容し 0 扱い。
  if (version >= 2) {
    if (typeof parsed.summary.excludedPages !== 'number') {
      throw new Error('source-sync-status.json: summary.excludedPages must be a number');
    }
    if (typeof parsed.summary.excludedBrokenPages !== 'number') {
      throw new Error('source-sync-status.json: summary.excludedBrokenPages must be a number');
    }
    if (typeof parsed.summary.excludedRecoveredPages !== 'number') {
      throw new Error('source-sync-status.json: summary.excludedRecoveredPages must be a number');
    }
  }
  if (!Array.isArray(parsed.pages)) {
    throw new Error('source-sync-status.json: pages must be an array');
  }
  // Issue #255 — debt page の shape validation。debtCategory を持つ page は
  // fetchStatus が excluded-broken|excluded-recovered のいずれかで、
  // recoveryProbe が object|null であることを要求する。
  // Debt page shape validation is v2+ only. v1 artifacts have no
  // excluded-* pages and no debt fields.
  const VALID_DEBT_FETCH_STATUSES = new Set(['excluded-broken', 'excluded-recovered', 'excluded-fetch-error']);
  if (version >= 2) for (const page of parsed.pages) {
    const isExcludedDebt = VALID_DEBT_FETCH_STATUSES.has(page.fetchStatus);

    if (isExcludedDebt) {
      if (page.debtCategory !== 'source-side-debt') {
        throw new Error(
          `source-sync-status.json: excluded page "${page.slug}" must have debtCategory ` +
          `"source-side-debt", got ${JSON.stringify(page.debtCategory)}`,
        );
      }
      if (!('recoveryProbe' in page)) {
        throw new Error(
          `source-sync-status.json: excluded page "${page.slug}" must have recoveryProbe ` +
          `(object for excluded-broken, null for excluded-recovered)`,
        );
      }
      const probe = page.recoveryProbe;
      if (page.fetchStatus === 'excluded-broken') {
        if (probe === null || typeof probe !== 'object' || Array.isArray(probe)) {
          throw new Error(
            `source-sync-status.json: excluded page "${page.slug}" recoveryProbe must be an object for excluded-broken`,
          );
        }
        if (typeof probe.issueType !== 'string') {
          throw new Error(
            `source-sync-status.json: excluded page "${page.slug}" recoveryProbe.issueType must be a string`,
          );
        }
        if (typeof probe.reason !== 'string') {
          throw new Error(
            `source-sync-status.json: excluded page "${page.slug}" recoveryProbe.reason must be a string`,
          );
        }
        if (typeof probe.expectedIssueType !== 'string') {
          throw new Error(
            `source-sync-status.json: excluded page "${page.slug}" recoveryProbe.expectedIssueType must be a string`,
          );
        }
        if (typeof probe.expectedReason !== 'string') {
          throw new Error(
            `source-sync-status.json: excluded page "${page.slug}" recoveryProbe.expectedReason must be a string`,
          );
        }
        if (typeof probe.expectedMatch !== 'boolean') {
          throw new Error(
            `source-sync-status.json: excluded page "${page.slug}" recoveryProbe.expectedMatch must be a boolean`,
          );
        }
      }
      if (page.fetchStatus === 'excluded-recovered' && probe !== null) {
        throw new Error(
          `source-sync-status.json: excluded page "${page.slug}" recoveryProbe must be null for excluded-recovered`,
        );
      }
      if (page.fetchStatus === 'excluded-fetch-error') {
        if (probe !== null) {
          throw new Error(
            `source-sync-status.json: excluded page "${page.slug}" recoveryProbe must be null for excluded-fetch-error`,
          );
        }
        if (typeof page.errorDetail !== 'string') {
          throw new Error(
            `source-sync-status.json: excluded page "${page.slug}" must have errorDetail string for excluded-fetch-error`,
          );
        }
      }
      continue;
    }

    // Non-excluded pages must not carry debt fields.
    if ('debtCategory' in page && page.debtCategory != null) {
      throw new Error(
        `source-sync-status.json: non-excluded page "${page.slug}" must not have debtCategory`,
      );
    }
    if ('recoveryProbe' in page) {
      throw new Error(
        `source-sync-status.json: non-excluded page "${page.slug}" must not have recoveryProbe`,
      );
    }
  }
  if (version >= 2) {
    const excludedBrokenPages = parsed.pages.filter((p) => p.fetchStatus === 'excluded-broken').length;
    const excludedRecoveredPages = parsed.pages.filter(
      (p) => p.fetchStatus === 'excluded-recovered',
    ).length;
    const excludedPages = excludedBrokenPages + excludedRecoveredPages;
    if (parsed.summary.excludedPages !== excludedPages) {
      throw new Error(
        `source-sync-status.json: summary.excludedPages must equal pages[] excluded count ` +
        `(${excludedPages}), got ${parsed.summary.excludedPages}`,
      );
    }
    if (parsed.summary.excludedBrokenPages !== excludedBrokenPages) {
      throw new Error(
        `source-sync-status.json: summary.excludedBrokenPages must equal pages[] excluded-broken count ` +
        `(${excludedBrokenPages}), got ${parsed.summary.excludedBrokenPages}`,
      );
    }
    if (parsed.summary.excludedRecoveredPages !== excludedRecoveredPages) {
      throw new Error(
        `source-sync-status.json: summary.excludedRecoveredPages must equal pages[] excluded-recovered count ` +
        `(${excludedRecoveredPages}), got ${parsed.summary.excludedRecoveredPages}`,
      );
    }
  }
  if (!Array.isArray(parsed.errors)) {
    throw new Error('source-sync-status.json: errors must be an array');
  }
  return parsed;
}

export function validateActionableReport(parsed) {
  expectObject(parsed, 'docs-actionable-report.json');
  if (parsed.schemaVersion !== ACTIONABLE_REPORT_SCHEMA_VERSION) {
    throw new Error(
      `docs-actionable-report.json: unsupported schemaVersion ${JSON.stringify(parsed.schemaVersion)} (expected ${ACTIONABLE_REPORT_SCHEMA_VERSION})`,
    );
  }
  for (const family of ['snapshotDiff', 'parityRegression', 'sourceSyncHealth', 'parityFollowup']) {
    if (!parsed[family] || typeof parsed[family] !== 'object') {
      throw new Error(`docs-actionable-report.json: missing "${family}" family`);
    }
    if (typeof parsed[family].shouldOpenIssue !== 'boolean') {
      throw new Error(`docs-actionable-report.json: ${family}.shouldOpenIssue must be boolean`);
    }
  }
  return parsed;
}

/**
 * Validate the three detection inputs after they have been loaded.
 * Returns `{ ok: true }` on success, `{ ok: false, errors: string[] }`
 * when one or more inputs fail validation. The function never throws —
 * the caller (e.g. `loadDetectionInputs` in strict mode) is responsible
 * for deciding whether to continue.
 */
export function validateDetectionInputs({ snapshot, parity, sourceSync }) {
  const errors = [];
  const tryValidate = (label, runner) => {
    try {
      runner();
    } catch (error) {
      errors.push(`${label}: ${error.message}`);
    }
  };
  tryValidate('snapshot', () => validateSnapshotDiffStatus(snapshot));
  tryValidate('parity', () => validateParityCheckStatus(parity));
  // sourceSync is allowed to be missing entirely (legacy / pre-Phase-1
  // runs); only check the shape if a non-empty payload is present.
  if (sourceSync && Object.keys(sourceSync).length > 0) {
    tryValidate('sourceSync', () => validateSourceSyncStatus(sourceSync));
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
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

function partitionSourceSideDebtPages(pages) {
  const safePages = Array.isArray(pages) ? pages : [];
  return {
    brokenPages: safePages.filter((p) => p.fetchStatus === 'excluded-broken'),
    recoveredPages: safePages.filter((p) => p.fetchStatus === 'excluded-recovered'),
    fetchErrorPages: safePages.filter((p) => p.fetchStatus === 'excluded-fetch-error'),
  };
}

/**
 * Issue #255 — Build a structured summary of source-side debt from
 * `source-sync-status.json`. Returns counters plus broken / recovered
 * slug lists with their recovery-probe payloads so downstream consumers
 * (markdown renderer, issue body, dashboards) can render without
 * re-parsing the raw status file.
 *
 * Pure function. Safe to call with an empty/missing sourceSync object.
 *
 * @param {object | null | undefined} sourceSync — parsed source-sync-status.json
 * @returns {{
 *   excludedPages: number,
 *   excludedBrokenPages: number,
 *   excludedRecoveredPages: number,
 *   brokenSlugs: string[],
 *   recoveredSlugs: string[],
 *   brokenDetails: {
 *     slug: string,
 *     actualIssueType: string|null,
 *     actualReason: string|null,
 *     expectedIssueType: string|null,
 *     expectedReason: string|null,
 *     expectedMatch: boolean|null,
 *   }[],
 * }}
 */
function buildSourceSideDebtSummary(sourceSync) {
  const pages = sourceSync?.pages ?? [];
  const { brokenPages, recoveredPages, fetchErrorPages } = partitionSourceSideDebtPages(pages);

  return {
    excludedPages: brokenPages.length + recoveredPages.length,
    excludedBrokenPages: brokenPages.length,
    excludedRecoveredPages: recoveredPages.length,
    fetchErrorSlugs: fetchErrorPages.map((p) => p.slug).sort(),
    fetchErrorDetails: fetchErrorPages.map((p) => ({
      slug: p.slug,
      errorDetail: p.errorDetail ?? 'unknown',
    })).sort((a, b) => a.slug.localeCompare(b.slug)),
    brokenSlugs: brokenPages.map((p) => p.slug).sort(),
    recoveredSlugs: recoveredPages.map((p) => p.slug).sort(),
    brokenDetails: brokenPages
      .map((p) => {
        const probe = p.recoveryProbe;
        return {
          slug: p.slug,
          actualIssueType: probe?.issueType ?? null,
          actualReason: probe?.reason ?? null,
          expectedIssueType: probe?.expectedIssueType ?? null,
          expectedReason: probe?.expectedReason ?? null,
          expectedMatch: probe?.expectedMatch ?? null,
        };
      })
      .sort((left, right) => left.slug.localeCompare(right.slug)),
  };
}

/**
 * Issue #255 — Render the `## ソース原文の既知問題` section as Markdown lines.
 * Returns an array of strings ready to be joined with '\n'. The caller
 * is responsible for deciding when the section should appear at all
 * (usually: skip when `excludedPages === 0`).
 *
 * The section is fully Japanese on the theory that humans read it and
 * machines read the JSON fields instead. Slugs and technical tokens
 * (`snapshot-incomplete`, `extractor-empty`, file names) stay in English.
 *
 * @param {ReturnType<typeof buildSourceSideDebtSummary>} debt
 * @param {{ slug: string, fetchStatus: string, recoveryProbe?: any, debtCategory?: string }[]} _pages
 * @returns {string[]}
 */
function renderSourceSideDebtSubsection(debt, _pages) {
  const lines = [
    '## ソース原文の既知問題',
    '',
    `- 除外ページ: ${debt.excludedPages}`,
    `- 未復旧: ${debt.excludedBrokenPages}`,
    `- 復旧候補: ${debt.excludedRecoveredPages}`,
    '',
    '英語原文が壊れておりパリティ比較の前提を満たさないページです。',
    '`scripts/lib/source_sync_exclusions.mjs` の除外レジストリで管理され、',
    'スナップショット取得は実行するがファイルは上書きせず、手動作成した',
    'スナップショットを凍結参照として保持します。',
    '',
  ];

  if (debt.excludedBrokenPages > 0) {
    lines.push('### 未復旧', '');
    for (const entry of debt.brokenDetails) {
      const actual = entry.actualIssueType && entry.actualReason
        ? `${entry.actualIssueType} / ${entry.actualReason}`
        : entry.actualIssueType || entry.actualReason || '判定なし';
      const expected = entry.expectedIssueType && entry.expectedReason
        ? `${entry.expectedIssueType} / ${entry.expectedReason}`
        : '不明';
      const matchLabel = entry.expectedMatch === true
        ? '想定どおり'
        : entry.expectedMatch === false
          ? '想定と不一致'
          : '不明';
      lines.push(`- \`${entry.slug}\``);
      lines.push(`  - 実際: ${actual}`);
      lines.push(`  - 期待: ${expected}`);
      lines.push(`  - 期待一致: ${matchLabel}`);
    }
    lines.push('');
  }

  if (debt.fetchErrorSlugs && debt.fetchErrorSlugs.length > 0) {
    lines.push('### 観測失敗', '');
    lines.push(
      'fetch に失敗したため live EN の状態を観測できませんでした。',
      'source-sync の劣化として errors に計上されています。',
      '',
    );
    for (const entry of debt.fetchErrorDetails) {
      lines.push(`- \`${entry.slug}\``);
      lines.push(`  - エラー: ${entry.errorDetail}`);
    }
    lines.push('');
  }

  if (debt.excludedRecoveredPages > 0) {
    lines.push('### 復旧候補', '');
    lines.push(
      '英語原文が復旧した可能性があります。人間が確認の上、',
      '`scripts/lib/source_sync_exclusions.mjs` から該当 slug を除外解除してください。',
      '(自動解除はしません — 一時的な原文側の揺れで誤検知を作らないため)',
      '',
    );
    for (const slug of debt.recoveredSlugs) {
      lines.push(`- \`${slug}\``);
      lines.push(`  - 状態: excluded-recovered`);
      lines.push(`  - 対応: 除外レジストリからの削除を検討`);
    }
    lines.push('');
  }

  return lines;
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

function withFamilyMarker(body, key) {
  if (!body) return '';
  return `<!-- detection-family: ${key} -->\n${body}`;
}

function scoreParityEntry(entry) {
  return entry.issues.reduce((score, issue) => {
    if (!isReportableParityIssue(issue)) return score;
    if (issue.type === 'image-mismatch') return score + 3;
    if (issue.type === 'codeblock-mismatch') return score + 3;
    if (issue.severity === 'actionable') return score + 2;
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

function formatAdvisoryQueueScope(scope) {
  if (!scope || typeof scope !== 'object') return 'スコープ不明';
  if (scope.isComplete === true) return 'リポジトリ全体';

  const slug = scope.filters?.slug ?? null;
  if (scope.type === 'slug' && slug) {
    return `部分スコープ: slug=${slug}、リポジトリ全体ではない`;
  }

  const section = scope.filters?.section ?? null;
  if (scope.type === 'section' && section) {
    return `部分スコープ: section=${section}、リポジトリ全体ではない`;
  }

  return '部分スコープ、リポジトリ全体ではない';
}

function buildParityFollowupBody({
  summary,
  expiredBaselineFiles,
  expiringBaselineFiles,
  baselineInvalidatedSlugs,
  blockingAdvisoryItems,
  advisoryQueueIssues,
  advisoryQueueFiles,
  advisoryQueueScope,
  includeAdvisoryInBody,
  sourceUnusable,
}) {
  const lines = [
    '## サマリー',
    '',
    `- チェック日時: ${summary.checkedAt ?? '不明'}`,
    `- ベースライン済み: ${summary.baselinedIssues ?? 0} 件 (${summary.baselinedFiles ?? 0} ファイル)`,
    `- 期限切れベースライン: ${summary.expiredBaselineEntries ?? 0}`,
    `- 30 日以内期限切れ予定: ${summary.expiringBaselineEntries30d ?? 0}`,
    `- 無効化されたベースライン slug: ${baselineInvalidatedSlugs.length}`,
    '',
  ];

  if (includeAdvisoryInBody) {
    lines.push(
      `- アドバイザリキュー: ${advisoryQueueIssues} 件 (${advisoryQueueFiles} ファイル)`,
      `  - スコープ: ${formatAdvisoryQueueScope(advisoryQueueScope)}`,
      `  - ブロッキング: ${blockingAdvisoryItems.length}`,
      '',
    );
  }

  // Issue #247 PR4 — source-unusable サブセクション。`shouldOpenIssue` の
  // 条件には加えていない (翻訳者責任外なので新規 issue は open しない) が、
  // 既に別の signal で issue body が生成されているなら、source-unusable の
  // 件数も併記して reviewer に状況を見せる。0 件のときはセクション自体を
  // 省略する。
  if (sourceUnusable && sourceUnusable.snapshotUnusableIssues > 0) {
    lines.push(
      '## ソース使用不可 (参考)',
      '',
      `- 合計: ${sourceUnusable.snapshotUnusableIssues} 件 (${sourceUnusable.snapshotUnusableFiles} ファイル)`,
      '- 翻訳の問題ではなくスナップショット / ソース同期側の既知問題です。翻訳 PR では修正できません。',
    );
    const sortedTypes = Object.keys(sourceUnusable.snapshotUnusableByType ?? {}).sort();
    if (sortedTypes.length > 0) {
      lines.push('- 種別別:');
      for (const type of sortedTypes) {
        lines.push(`  - ${type}: ${sourceUnusable.snapshotUnusableByType[type]}`);
      }
    }
    lines.push('');
  }

  // Issue #247 post-merge — orphan baseline entries を followup report に
  // 可視化する。detector / emitter が仕様変更したときに legacy entry が
  // 取り残されるパターンを検知する (PR5 migration 後の segment-inconclusive
  // 3 件の事例が典型)。
  const orphanBaselineEntries = summary.orphanBaselineEntries || 0;
  if (orphanBaselineEntries > 0) {
    lines.push(
      '## 🧹 孤立したベースラインエントリー',
      '',
      `- 合計: ${orphanBaselineEntries} 件 (実行時に一致する問題が無い — 掃除対象)`,
    );
    const byType = summary.orphanBaselineByType || {};
    const sortedTypes = Object.keys(byType).sort();
    if (sortedTypes.length > 0) {
      lines.push('- 種別別:');
      for (const type of sortedTypes) {
        lines.push(`  - ${type}: ${byType[type]}`);
      }
    }
    lines.push(
      '',
      '対応: `node scripts/generate_parity_baseline.mjs --slug=<slug>` で該当 slug を再生成すると孤立エントリーが削除されます。',
      '',
    );
  }

  if (expiredBaselineFiles.length > 0) {
    lines.push('## 期限切れベースラインエントリー', '');
    lines.push(
      formatList(
        expiredBaselineFiles.map((f) => {
          const rv = f.reviewAfter ? ` — reviewAfter: ${f.reviewAfter}` : '';
          return `\`${f.file}\` (${f.count} 件${rv})`;
        }),
      ),
    );
    lines.push('');
  }

  if (expiringBaselineFiles && expiringBaselineFiles.length > 0) {
    lines.push('## 30 日以内に期限切れ', '');
    lines.push(
      '> `reviewAfter` を越えて gate に戻る前に返済 PR を計画してください。',
      '',
    );
    lines.push(
      formatList(
        expiringBaselineFiles.map((f) => {
          const rv = f.reviewAfter ? ` — reviewAfter: ${f.reviewAfter}` : '';
          return `\`${f.file}\` (${f.count} 件${rv})`;
        }),
      ),
    );
    lines.push('');
  }

  if (baselineInvalidatedSlugs.length > 0) {
    lines.push('## 無効化されたベースライン slug', '');
    lines.push(
      formatList(baselineInvalidatedSlugs.map((s) => `\`${s}\` — 英語スナップショットが変更された`)),
    );
    lines.push('');
  }

  if (blockingAdvisoryItems.length > 0) {
    lines.push('## アドバイザリキュー — ブロッキング項目', '');
    lines.push(
      formatList(
        blockingAdvisoryItems.map((e) => {
          const topIssue = (e.issues ?? [])[0];
          const cat = topIssue?.inconclusiveCategory ?? '不明';
          return `\`${e.slug}\` — ${cat} (${e.issueCount} 件)`;
        }),
      ),
    );
    lines.push('');
  }

  lines.push('## アーティファクト', '', '- `parity-check-status.json`');

  return lines.join('\n');
}

function buildParityFollowup(parity, options = {}) {
  const maxEntries = options.maxEntries ?? 10;
  const summary = parity.summary ?? {};
  const files = parity.files ?? [];
  const advisoryQueue = parity.advisoryQueue ?? [];
  const advisoryQueueScope = parity.advisoryQueueScope ?? null;

  const expiredBaselineEntries = summary.expiredBaselineEntries ?? 0;
  const expiringBaselineEntries30d = summary.expiringBaselineEntries30d ?? 0;
  const baselineInvalidatedSlugs = summary.baselineInvalidatedSlugs ?? [];
  const advisoryQueueIssues = summary.advisoryQueueIssues ?? 0;
  const advisoryQueueFiles = summary.advisoryQueueFiles ?? 0;
  const isComplete = advisoryQueueScope?.isComplete ?? null;

  // Issue #247 PR4 — source-unusable サブセクション。`shouldOpenIssue` の
  // 判定には加えない (翻訳者責任外、新規 issue を open しない契約)。summary
  // への露出と body サブセクションのみを担う。
  const sourceUnusable = {
    snapshotUnusableIssues: summary.snapshotUnusableIssues ?? 0,
    snapshotUnusableFiles: summary.snapshotUnusableFiles ?? 0,
    snapshotUnusableByType: summary.snapshotUnusableByType ?? {},
  };

  const blockingAdvisoryItems = advisoryQueue.filter((e) => e.blocking);
  const hasBlockingAdvisory = isComplete === true && blockingAdvisoryItems.length > 0;

  const shouldOpenIssue =
    expiredBaselineEntries > 0 ||
    expiringBaselineEntries30d > 0 ||
    baselineInvalidatedSlugs.length > 0 ||
    hasBlockingAdvisory;

  const expiredBaselineFiles = [];
  const expiringBaselineFiles = [];
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
    const expiring = (file.issues ?? []).filter(
      (i) => i.baselined === true && i.baselineExpiringSoon === true,
    );
    if (expiring.length > 0) {
      expiringBaselineFiles.push({
        file: file.file,
        count: expiring.length,
        reviewAfter:
          expiring.map((i) => i.baselineReviewAfter).filter(Boolean)[0] ?? null,
      });
    }
  }
  expiredBaselineFiles.sort((a, b) => b.count - a.count);
  expiringBaselineFiles.sort((a, b) => {
    // Earliest expiry first so reviewers see the cliff in order.
    if ((a.reviewAfter ?? '') !== (b.reviewAfter ?? '')) {
      return (a.reviewAfter ?? '') < (b.reviewAfter ?? '') ? -1 : 1;
    }
    return b.count - a.count;
  });
  const reviewHints = {
    topBaselinedPages: buildTopBaselinedPages(files, maxEntries),
    tokenlessNearTieExamples: buildTokenlessNearTieExamples(advisoryQueue, maxEntries),
  };

  const body = shouldOpenIssue
    ? withFamilyMarker(
        buildParityFollowupBody({
          summary,
          expiredBaselineFiles: expiredBaselineFiles.slice(0, maxEntries),
          expiringBaselineFiles: expiringBaselineFiles.slice(0, maxEntries),
          baselineInvalidatedSlugs,
          blockingAdvisoryItems:
            isComplete === true ? blockingAdvisoryItems.slice(0, maxEntries) : [],
          advisoryQueueIssues,
          advisoryQueueFiles,
          advisoryQueueScope,
          includeAdvisoryInBody: isComplete === true,
          sourceUnusable,
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
        expiringBaselineEntries30d,
        expiringBaselineFiles,
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
      // Issue #247 PR4 — source-unusable counter のサブセクション。
      // shouldOpenIssue には影響しないが、JSON consumer (人手レビュー /
      // ダッシュボード) が翻訳者責任外の snapshot debt を観測できる。
      sourceUnusable,
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

  // §1+§3 cleanup: hoist runScope/result/freshness/linkage to the top
  // of the function so the Source Sync Health and final-return blocks
  // can both consume them without TDZ ordering tricks.
  const runScope = parity.summary?.runScope ?? null;
  const result = parity.summary?.result ?? null;
  const parityFreshnessState =
    parity.summary?.freshnessState ?? sourceSync?.freshnessState ?? null;
  const linkageState = parity.summary?.linkageState ?? null;

  const snapshotTopEntries = sortSnapshotEntries(snapshotChanges).slice(0, maxEntries);
  const parityTopEntries = sortParityEntries(parityIssueFiles).slice(
    0,
    maxEntries,
  );

  const snapshotIssueBody = [
    '## サマリー',
    '',
    `- チェック日時: ${snapshot.checkedAt ?? '不明'}`,
    `- 変更ページ: ${snapshot.summary?.changed || 0}`,
    `- 追加ページ: ${snapshot.summary?.added || 0}`,
    `- 削除ページ: ${snapshot.summary?.removed || 0}`,
    `- 変更なし: ${snapshot.summary?.unchanged || 0}`,
    `- 総スナップショット数: ${snapshot.summary?.totalSnapshots || 0}`,
    '',
    '## 上位エントリー',
    '',
    formatList(snapshotTopEntries.map(formatSnapshotEntry)),
    '',
    ...(snapshot.sidebar?.changed
      ? [
          '## サイドバー変更',
          '',
          `- 追加ページ: ${snapshot.sidebar.addedPages?.length || 0}`,
          `- 削除ページ: ${snapshot.sidebar.removedPages?.length || 0}`,
          '',
        ]
      : []),
    '## アーティファクト',
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

  // Issue #247 PR5 — structure mismatch の補助 counter は summary に
  // 露出するだけで、独立 advisory section は持たない。reportable に
  // 昇格したため、件数は通常の Top Entries 経路で見えるようになった。
  const structureMismatchIssues = parity.summary?.structureMismatchIssues ?? 0;
  const structureMismatchFiles = parity.summary?.structureMismatchFiles ?? 0;
  const structureMismatchByType = parity.summary?.structureMismatchByType ?? {};

  const parityIssueBody = [
    '## サマリー',
    '',
    `- チェック日時: ${parity.summary?.checkedAt ?? '不明'}`,
    `- 要対応ファイル: ${activeActionableFiles}`,
    `- 問題ファイル: ${parityIssueFiles.length}`,
    `- エラーファイル: ${activeErrorFiles}`,
    `- 承認済み (非ブロッキング): ${acknowledgedIssues}`,
    ...(expiredAcknowledgements > 0
      ? [`- ⚠ 期限切れ承認: ${expiredAcknowledgements}`]
      : []),
    '',
    '## 上位エントリー',
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
    '## アーティファクト',
    '',
    '- `parity-check-status.json`',
    '- `docs-update-summary.md`',
    '- `docs-audit-manifest.json`',
  ].join('\n');

  // Source sync health
  const freshnessState = sourceSync.freshnessState ?? null;
  // §3 cleanup: linkage failure also opens the source-sync-health issue
  // so reviewers see "stale" / "scope-mismatch" runs in the same place
  // they see freshness degradation. linkageState='missing' is the
  // legacy / no-linkage case and is intentionally NOT escalated.
  const linkageBlocking =
    linkageState !== null && linkageState !== 'linked' && linkageState !== 'missing';
  const syncSummary = sourceSync.summary ?? {};
  const syncErrors = sourceSync.errors ?? [];

  // Issue #255 — source-side debt counters and slug lists. These come from
  // source-sync-status.json `summary.excluded*Pages` and `pages[]`.
  // Must be computed before syncShouldOpen because debt triggers issue open.
  const sourceSideDebtSummary = buildSourceSideDebtSummary(sourceSync);
  const hasSourceSideDebt = sourceSideDebtSummary.excludedPages > 0 ||
    (sourceSideDebtSummary.fetchErrorSlugs?.length ?? 0) > 0;
  const syncShouldOpen =
    freshnessState === 'broken' || freshnessState === 'partial' || linkageBlocking ||
    hasSourceSideDebt;

  const sourceSyncBody = syncShouldOpen
    ? [
        '## サマリー',
        '',
        `- 鮮度状態: **${freshnessState ?? '不明'}**`,
        `- 連結状態: **${linkageState ?? '不明'}**`,
        `- 対象ページ: ${syncSummary.targetPages ?? 0}`,
        `- 取得済みページ: ${syncSummary.fetchedPages ?? 0}`,
        `- 404 ページ: ${syncSummary.notFoundPages ?? 0}`,
        `- エラーページ: ${syncSummary.errorPages ?? 0}`,
        `- サイドバー検証: ${syncSummary.sidebarVerified ?? false}`,
        '',
        '## エラー',
        '',
        formatList(syncErrors.map((e) => `\`${e.slug}\` — ${e.detail}`)),
        '',
        // Issue #255 — 日本語 debt サブセクション (issue body 内)。
        // 件数 0 なら丸ごと省略する。
        ...(hasSourceSideDebt
          ? [...renderSourceSideDebtSubsection(sourceSideDebtSummary, sourceSync.pages ?? []), '']
          : []),
        '## アーティファクト',
        '',
        '- `source-sync-status.json`',
        '- `snapshot-diff-status.json`',
        '- `parity-check-status.json`',
      ].join('\n')
    : '';

  return {
    schemaVersion: ACTIONABLE_REPORT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    runScope,
    result,
    freshnessState: parityFreshnessState,
    linkageState,
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
      // Issue #255 — source-side debt counter / slug list を independently
      // expose する。JSON consumer (sync-detection-issues / dashboards /
      // 人手レビュー) が freshness counter と混ぜずに読めるようにする。
      sourceSideDebt: sourceSideDebtSummary,
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
        // Issue #247 PR5 — structure mismatch の独立 counter は cutover 後も
        // 並走で露出する。reportable に昇格したため `topEntries` / `issueCount`
        // にも流れるが、JSON consumer (sync-detection-issues / ダッシュボード /
        // 人手レビュー) が drift の type-別内訳を一発で読みたい場面のために
        // 補助フィールドとして残してある。
        structureMismatchIssues,
        structureMismatchFiles,
        structureMismatchByType,
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
  const syncState = sourceSync?.freshnessState ?? actionableReport?.sourceSyncHealth?.freshnessState ?? '不明';
  const syncSummary = sourceSync?.summary ?? actionableReport?.sourceSyncHealth?.summary ?? {};

  // Issue #255 — source-side debt を summary markdown に可視化する。
  // actionableReport にすでに sourceSideDebt が計算されていればそれを優先、
  // 無ければ sourceSync から組み立てる。
  const sourceSideDebt =
    actionableReport?.sourceSyncHealth?.sourceSideDebt ??
    buildSourceSideDebtSummary(sourceSync);
  const sourceSideDebtSection =
    sourceSideDebt.excludedPages > 0 || (sourceSideDebt.fetchErrorSlugs?.length ?? 0) > 0
      ? renderSourceSideDebtSubsection(sourceSideDebt, sourceSync?.pages ?? [])
      : [];

  // Parity section は coarse audit signals を除外した reportableActive*
  // counters を表示する。降格された coarse heuristics は別枠の "Audit
  // Signals" section に出して active parity drift と混同させない。
  const parityActiveActionable =
    parity.summary?.reportableActiveActionableFiles ??
    parity.summary?.activeActionableFiles ??
    parity.summary?.actionableFiles ??
    0;
  const parityActiveFiles =
    parity.summary?.reportableActiveFiles ??
    parity.summary?.activeFiles ??
    actionableReport?.parityRegression?.summary?.issueCount ??
    0;

  const auditSignalIssues = parity.summary?.auditSignalIssues ?? 0;
  const auditSignalFiles = parity.summary?.auditSignalFiles ?? 0;
  const auditSignalsByType = parity.summary?.auditSignalsByType ?? {};
  const auditSignalRows =
    Object.keys(auditSignalsByType).length > 0
      ? Object.entries(auditSignalsByType)
          .sort(([leftType], [rightType]) => leftType.localeCompare(rightType))
          .map(([type, count]) => `  - ${type}: ${count}`)
      : ['  - (なし)'];

  // Issue #247 PR5 — structure mismatch の独立 advisory section は削除した。
  // reportable に昇格したため、件数は `## パリティ` の `active issue files`
  // 経由で見える。source unusable は引き続き advisory なので独立 section
  // を持つ。
  const snapshotUnusableIssues = parity.summary?.snapshotUnusableIssues ?? 0;
  const snapshotUnusableFiles = parity.summary?.snapshotUnusableFiles ?? 0;
  const snapshotUnusableByType = parity.summary?.snapshotUnusableByType ?? {};
  const sourceUnusableSection =
    snapshotUnusableIssues > 0
      ? [
          '## ソース使用不可 (参考)',
          '',
          `- 合計: ${snapshotUnusableIssues} 件 (${snapshotUnusableFiles} ファイル)`,
          '- 翻訳の問題ではなくスナップショット / ソース同期側の既知問題です。翻訳 PR では修正できません。',
          ...(Object.keys(snapshotUnusableByType).length > 0
            ? [
                '- 種別別:',
                ...Object.keys(snapshotUnusableByType)
                  .sort()
                  .map((type) => `  - ${type}: ${snapshotUnusableByType[type]}`),
              ]
            : []),
          '',
        ]
      : [];

  return [
    '# ドキュメント検知サマリー',
    '',
    `生成日時: ${actionableReport.generatedAt}`,
    '',
    '## ソース同期状態',
    '',
    `- 鮮度状態: ${syncState}`,
    `- 取得: ${syncSummary.fetchedPages ?? 0} / ${syncSummary.targetPages ?? 0} ページ`,
    `- エラー: ${syncSummary.errorPages ?? 0}`,
    `- サイドバー検証: ${syncSummary.sidebarVerified ?? false}`,
    '',
    ...sourceSideDebtSection,
    '## スナップショット差分',
    '',
    `- 変更ページ: ${actionableReport.snapshotDiff.summary.changed}`,
    `- 追加ページ: ${actionableReport.snapshotDiff.summary.added}`,
    `- 削除ページ: ${actionableReport.snapshotDiff.summary.removed}`,
    `- 変更なし: ${actionableReport.snapshotDiff.summary.unchanged}`,
    `- 総スナップショット数: ${actionableReport.snapshotDiff.summary.totalSnapshots}`,
    '',
    '## パリティ',
    '',
    `- 要対応ファイル: ${parityActiveActionable}`,
    `- 問題ファイル: ${parityActiveFiles}`,
    `- エラーファイル: ${parity.summary?.activeErrorFiles ?? parity.summary?.errorFiles ?? 0}`,
    `- 承認済み (非ブロッキング): ${parity.summary?.acknowledgedIssues || 0}`,
    ...((parity.summary?.expiredAcknowledgements || 0) > 0
      ? [`- ⚠ 期限切れ承認: ${parity.summary.expiredAcknowledgements}`]
      : []),
    '',
    ...sourceUnusableSection,
    '## 監査シグナル',
    '',
    '- 監査専用: 粗いカウント / 形状 / テーブルセルのヒューリスティック',
    '- deep-audit で確認可能。パリティ後退の issue 本文には含めない',
    `- 合計: ${auditSignalIssues} 件 (${auditSignalFiles} ファイル)`,
    '- 種別別:',
    ...auditSignalRows,
    '',
    '## 監査マニフェスト',
    '',
    `- 総レビュー対象: ${auditManifest.length}`,
    `- ページライフサイクル: ${actionableReport.auditManifest.bucketCounts['page-lifecycle'] || 0}`,
    `- 構造変更: ${actionableReport.auditManifest.bucketCounts['structural-change'] || 0}`,
    `- 本文のみ: ${actionableReport.auditManifest.bucketCounts['content-only'] || 0}`,
    '',
    '## パリティフォローアップ',
    '',
    `- ベースライン済み: ${actionableReport.parityFollowup?.summary?.baselineDebt?.baselinedIssues ?? 0} 件 (${actionableReport.parityFollowup?.summary?.baselineDebt?.baselinedFiles ?? 0} ファイル)`,
    `- 期限切れベースライン: ${actionableReport.parityFollowup?.summary?.baselineDebt?.expiredBaselineEntries ?? 0}`,
    `- 無効化された slug: ${(actionableReport.parityFollowup?.summary?.baselineDebt?.baselineInvalidatedSlugs ?? []).length}`,
    `- アドバイザリキュー: ${actionableReport.parityFollowup?.summary?.advisoryQueue?.issues ?? 0} 件 (${actionableReport.parityFollowup?.summary?.advisoryQueue?.files ?? 0} ファイル, ${actionableReport.parityFollowup?.summary?.advisoryQueue?.blockingItems ?? 0} ブロッキング; ${formatAdvisoryQueueScope(actionableReport.parityFollowup?.summary?.advisoryQueue?.advisoryQueueScope ?? null)})`,
    '',
    '## アーティファクト',
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
  strict = false,
} = {}) {
  const inputs = {
    snapshot: readJson(snapshotPath),
    parity: readJson(parityPath),
    sourceSync: readJson(sourceSyncPath),
  };
  if (strict) {
    const validation = validateDetectionInputs(inputs);
    if (!validation.ok) {
      const error = new Error(
        `Detection input validation failed:\n  - ${validation.errors.join('\n  - ')}`,
      );
      error.validationErrors = validation.errors;
      throw error;
    }
  }
  return inputs;
}

export {
  SNAPSHOT_ISSUE_TITLE,
  PARITY_ISSUE_TITLE,
  SOURCE_SYNC_ISSUE_TITLE,
  PARITY_FOLLOWUP_ISSUE_TITLE,
};
