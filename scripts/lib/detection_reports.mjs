import fs from 'node:fs';
import path from 'node:path';

import {
  ROOT_DIR,
} from './project.mjs';
import {
  isReportableParityIssue,
} from './source_parity_issue_state.mjs';

/**
 * `docs-actionable-report.json` の schema version。
 * validator は不一致の report を読み込まない。
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
 * HTML body comment と sync-detection-issues.cjs で共有する family key。
 * issue body には `<!-- detection-family: KEY -->` を埋め込む。
 */
export const FAMILY_KEYS = {
  SNAPSHOT_DIFF: 'snapshot-diff',
  PARITY_REGRESSION: 'parity-regression',
  SOURCE_SYNC_HEALTH: 'source-sync-health',
  PARITY_FOLLOWUP: 'parity-followup',
};

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return {};
  // Graceful degradation: a partially-written artifact (e.g. aggregator killed
  // mid-write) must not propagate a raw SyntaxError through loadDetectionInputs.
  // `strict` mode downstream surfaces real schema issues via
  // validateDetectionInputs; here we just warn so the scheduled / PR run can
  // continue rather than crash with a cryptic JSON parse error.
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.warn(
      `[detection_reports] failed to parse ${filePath}: ${err.message}. ` +
        'Treating as empty artifact (non-blocking).',
    );
    return {};
  }
}

/**
 * 3 つの detection 入力を fail-closed で検証する。欠損値は補完しない。
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
  // excluded counter は v2 以降で必須。v1 は後方互換のため 0 扱いを許容する。
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
  // debt page の形状検証は v2+ のみ。v1 には excluded-* page が無い。
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

    // 除外対象でない page に debt 専用 field を載せてはいけない。
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
 * 読み込み済みの detection 入力を検証する (strict mode 用)。
 * 成功時は `{ ok: true }`、1 つでも不正なら `{ ok: false, errors }` を返す。
 * ここでは throw せず、継続可否の判断は呼び出し側に委ねる。
 *
 * 注: `upstreamRecovery` (Phase B) は optional artifact で schema 検証対象外。
 * 不在時は `{}` で渡され、`buildUpstreamRecoverySections` が null を返す
 * graceful degradation に委ねる (strict mode で validation error にはしない)。
 * このため API は従来どおり 3 キー (`snapshot` / `parity` / `sourceSync`)
 * のみを受け取る。
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
  // sourceSync は payload 自体が無いことを許容する。
  // 空でない payload があるときだけ shape を検証する。
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
 * `source-sync-status.json` から source-side debt の要約を組み立てる。
 * downstream consumer が raw status を再解釈せずに描画できる形へ整える。
 *
 * 純粋関数。空の sourceSync でも安全に呼べる。
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
 * `## ソース原文の既知問題` セクションを Markdown 行へ変換する。
 * 表示有無の判断は呼び出し側が行う。
 *
 * 人間が読む section なので日本語で整え、slug や technical token だけ英語のまま残す。
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

  // file path から slug を引き、parity 結果を slug 単位で引ける index にする。
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

      return {
        file: file.file,
        slug: fileToSlug(file.file),
        issueCount: baselinedIssues.length,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      const issueDiff = right.issueCount - left.issueCount;
      if (issueDiff !== 0) return issueDiff;
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
  baselineInvalidatedSlugs,
  blockingAdvisoryItems,
  advisoryQueueIssues,
  advisoryQueueFiles,
  advisoryQueueScope,
  includeAdvisoryInBody,
  sourceUnusable,
  baselinedIssues = 0,
  baselinedFiles = 0,
  baselinedByType = {},
  topBaselinedPages = [],
}) {
  const lines = [
    '## サマリー',
    '',
    `- チェック日時: ${summary.checkedAt ?? '不明'}`,
    `- ベースライン済み: ${summary.baselinedIssues ?? 0} 件 (${summary.baselinedFiles ?? 0} ファイル)`,
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

  if (baselinedIssues > 0) {
    const sortedTypes = Object.keys(baselinedByType).sort();
    lines.push(
      '## ベースライン残債',
      '',
      `- 合計: ${baselinedIssues} 件 (${baselinedFiles} ファイル)`,
      '- EN 原文との既知の構造差分です。翻訳を修正して解消してください。',
    );
    if (sortedTypes.length > 0) {
      lines.push('- 種別別:');
      for (const type of sortedTypes) {
        lines.push(`  - ${type}: ${baselinedByType[type]}`);
      }
    }
    if (topBaselinedPages.length > 0) {
      lines.push('', '### 上位ファイル', '');
      lines.push(
        formatList(
          topBaselinedPages.map((p) => `\`${p.file}\` (${p.issueCount} 件)`),
        ),
      );
    }
    lines.push('');
  }

  // source-unusable は新規 issue を開く条件には含めず、本文だけに併記する。
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

  // orphan baseline entry は followup report に可視化する。
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

  const baselineInvalidatedSlugs = summary.baselineInvalidatedSlugs ?? [];
  const advisoryQueueIssues = summary.advisoryQueueIssues ?? 0;
  const advisoryQueueFiles = summary.advisoryQueueFiles ?? 0;
  const isComplete = advisoryQueueScope?.isComplete ?? null;

  // source-unusable は summary と body にだけ露出し、issue open 条件には入れない。
  const sourceUnusable = {
    snapshotUnusableIssues: summary.snapshotUnusableIssues ?? 0,
    snapshotUnusableFiles: summary.snapshotUnusableFiles ?? 0,
    snapshotUnusableByType: summary.snapshotUnusableByType ?? {},
  };

  const baselinedIssues = summary.baselinedIssues ?? 0;
  const baselinedFiles = summary.baselinedFiles ?? 0;
  const baselinedByType = summary.baselinedByType ?? {};

  const blockingAdvisoryItems = advisoryQueue.filter((e) => e.blocking);
  const hasBlockingAdvisory = isComplete === true && blockingAdvisoryItems.length > 0;

  const shouldOpenIssue =
    baselinedIssues > 0 ||
    baselineInvalidatedSlugs.length > 0 ||
    hasBlockingAdvisory;

  const reviewHints = {
    topBaselinedPages: buildTopBaselinedPages(files, maxEntries),
    tokenlessNearTieExamples: buildTokenlessNearTieExamples(advisoryQueue, maxEntries),
  };

  const topBaselinedPages = buildTopBaselinedPages(files, maxEntries);

  const body = shouldOpenIssue
    ? withFamilyMarker(
        buildParityFollowupBody({
          summary,
          baselineInvalidatedSlugs,
          blockingAdvisoryItems:
            isComplete === true ? blockingAdvisoryItems.slice(0, maxEntries) : [],
          advisoryQueueIssues,
          advisoryQueueFiles,
          advisoryQueueScope,
          includeAdvisoryInBody: isComplete === true,
          sourceUnusable,
          baselinedIssues,
          baselinedFiles,
          baselinedByType,
          topBaselinedPages,
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
      // source-unusable counter は JSON consumer 向けに残す。
      sourceUnusable,
    },
  };
}

/**
 * Build the `enPatchRecovery` / `sourceSyncRecovery` sections consumed by
 * `sourceSyncHealth` (Phase B, Task 4). The aggregator in
 * `scripts/check_upstream_recovery.mjs` emits `upstream-recovery-status.json`
 * with per-entry `statusA` (active/stale/unknown) and `statusB`
 * (current/overdue). Here we collapse that into family-level counters plus
 * small arrays of stale/overdue entries for inclusion in the issue body.
 *
 * Missing / empty input is legitimate (local dev, PR CI without the artifact);
 * both sections degrade to `null` and `shouldOpenIssue` is unchanged by this
 * family.
 *
 * @param {object|null|undefined} upstreamRecovery — parsed upstream-recovery-status.json
 * @param {number} [maxEntries] — cap on emitted stale/overdue lists
 * @returns {{ enPatchRecovery: object|null, sourceSyncRecovery: object|null }}
 */
function buildUpstreamRecoverySections(upstreamRecovery, maxEntries = 10) {
  if (
    !upstreamRecovery ||
    typeof upstreamRecovery !== 'object' ||
    !upstreamRecovery.mechanisms
  ) {
    return { enPatchRecovery: null, sourceSyncRecovery: null };
  }
  // Codex C2 (MEDIUM): filter out non-object rows so a malformed
  // upstream-recovery-status.json (e.g. `[null]`, `[42]`) cannot crash the
  // downstream `.filter(e => e.statusA === ...)` calls. Rows that survive
  // are still shape-trusted only up to the field accessors below — each
  // projection also uses optional chaining / nullish-coalescing.
  const enPatchRows = Array.isArray(upstreamRecovery.mechanisms.en_source_patches)
    ? upstreamRecovery.mechanisms.en_source_patches.filter(
        (e) => e && typeof e === 'object' && !Array.isArray(e),
      )
    : [];
  const syncRows = Array.isArray(upstreamRecovery.mechanisms.source_sync_exclusions)
    ? upstreamRecovery.mechanisms.source_sync_exclusions.filter(
        (e) => e && typeof e === 'object' && !Array.isArray(e),
      )
    : [];

  const projectEnEntry = (e) => ({
    id: e.id,
    slugs: Array.isArray(e.slugs) ? [...e.slugs] : [],
    reviewAfter: e.reviewAfter ?? null,
    daysUntilReview: typeof e.daysUntilReview === 'number' ? e.daysUntilReview : null,
  });
  const projectSyncEntry = (e) => ({
    slug: e.slug,
    reviewAfter: e.reviewAfter ?? null,
    daysUntilReview: typeof e.daysUntilReview === 'number' ? e.daysUntilReview : null,
    fetchStatus: e.fetchStatus ?? 'unknown',
  });

  const enStale = enPatchRows.filter((e) => e.statusA === 'stale');
  const enOverdue = enPatchRows.filter((e) => e.statusB === 'overdue');
  const enUnknown = enPatchRows.filter((e) => e.statusA === 'unknown');

  const syncStale = syncRows.filter((e) => e.statusA === 'stale');
  const syncOverdue = syncRows.filter((e) => e.statusB === 'overdue');
  const syncUnknown = syncRows.filter((e) => e.statusA === 'unknown');

  return {
    enPatchRecovery: {
      totalPatches: enPatchRows.length,
      activePatches: enPatchRows.filter((e) => e.statusA === 'active').length,
      stalePatches: enStale.length,
      overduePatches: enOverdue.length,
      unknownPatches: enUnknown.length,
      stale: enStale.slice(0, maxEntries).map(projectEnEntry),
      overdue: enOverdue.slice(0, maxEntries).map(projectEnEntry),
    },
    sourceSyncRecovery: {
      totalExclusions: syncRows.length,
      activeExclusions: syncRows.filter((e) => e.statusA === 'active').length,
      staleExclusions: syncStale.length,
      overdueExclusions: syncOverdue.length,
      unknownExclusions: syncUnknown.length,
      stale: syncStale.slice(0, maxEntries).map(projectSyncEntry),
      overdue: syncOverdue.slice(0, maxEntries).map(projectSyncEntry),
    },
  };
}

/**
 * Defensive sanitiser for registry-derived strings that land in markdown
 * output (issue body / sticky PR comment). Registry values are developer-
 * authored and protected by review, but we strip characters that could
 * break the surrounding markdown structure or inject links/HTML:
 *   - `\r` / `\n` — break bullet / heading structure
 *   - `` ` `` — escape out of inline code spans
 *   - `|` — break table cells
 *   - `[` / `]` / `(` / `)` — craft markdown links (Codex C3)
 *   - `<` / `>` — raw HTML tags (Codex C3)
 *
 * Replaces matches with `_` so the field is visibly marked as sanitised
 * rather than silently removed. Defense-in-depth: registry review already
 * gates content, this is the last-line safety net.
 */
function sanitizeForMarkdown(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[\r\n`|\[\]()<>]/g, '_');
}

/**
 * Sticky PR comment hidden marker. Shared between the scheduled managed issue
 * body and the PR-triggered sticky comment so upsert logic can locate the
 * existing comment across re-runs.
 */
export const UPSTREAM_RECOVERY_STICKY_MARKER = '<!-- upstream-recovery: sticky -->';

/**
 * Render the sticky PR comment body for the given upstream-recovery-status
 * payload. Returns `null` when there are no stale / overdue signals, so the
 * caller knows to delete any existing sticky comment. This is the **single
 * source of truth** for sticky-comment markdown — the CI workflow reads the
 * output of `scripts/render_upstream_recovery_comment.mjs` (which calls this)
 * rather than re-implementing the filtering inline (see PR #363 code review).
 *
 * @param {object|null|undefined} upstreamRecovery — parsed upstream-recovery-status.json
 * @param {object} [options]
 * @param {number} [options.maxEntries] — cap on emitted stale/overdue lists
 * @param {string} [options.marker] — hidden marker (default MARKER constant)
 * @returns {string|null} markdown body or `null` when no signals
 */
export function renderUpstreamRecoveryStickyComment(
  upstreamRecovery,
  { maxEntries = 10, marker = UPSTREAM_RECOVERY_STICKY_MARKER } = {},
) {
  const sections = buildUpstreamRecoverySections(upstreamRecovery, maxEntries);
  const entries = renderUpstreamRecoveryEntries(sections);
  if (entries.length === 0) return null;
  const enStale = sections.enPatchRecovery?.stalePatches ?? 0;
  const enOverdue = sections.enPatchRecovery?.overduePatches ?? 0;
  const syncStale = sections.sourceSyncRecovery?.staleExclusions ?? 0;
  const syncOverdue = sections.sourceSyncRecovery?.overdueExclusions ?? 0;
  const totalAxis = enStale + enOverdue + syncStale + syncOverdue;
  return [
    marker,
    '',
    `## Upstream recovery: ${totalAxis} entr(ies) need attention`,
    '',
    ...entries,
    '',
    '_Informational only — this comment is non-blocking. ' +
      'See `docs/PARITY_GUIDE.md §許容機構` and ' +
      '`docs/OPS_DESIGN.md §Weekly: Upstream recovery triage` ' +
      'for the removal workflow._',
  ].join('\n');
}

/**
 * Shared entry renderer for upstream-recovery sections. Emits ONLY the
 * per-mechanism bullet lists (no wrapping heading / quote). The two callers
 * wrap this output with their own heading:
 *   - `renderUpstreamRecoverySubsection` (managed issue body) → `## 上流修正候補`
 *   - `renderUpstreamRecoveryStickyComment` (PR sticky) → `## Upstream recovery: ...`
 * Extracting this avoids the logic-duplication maintenance hazard between
 * the CI workflow and detection_reports (PR #363 code review HIGH).
 */
function renderUpstreamRecoveryEntries({ enPatchRecovery, sourceSyncRecovery }) {
  const lines = [];
  if (
    enPatchRecovery &&
    (enPatchRecovery.stalePatches > 0 || enPatchRecovery.overduePatches > 0)
  ) {
    lines.push(
      `- **en_source_patches:** ${enPatchRecovery.stalePatches} stale / ` +
        `${enPatchRecovery.overduePatches} overdue / ` +
        `${enPatchRecovery.totalPatches} total`,
    );
    if (enPatchRecovery.stale.length > 0) {
      lines.push('  - stale:');
      for (const e of enPatchRecovery.stale) {
        const slugs = (e.slugs || []).map(sanitizeForMarkdown).join(', ');
        lines.push(
          `    - \`${sanitizeForMarkdown(e.id)}\` (slugs: ${slugs}) — ` +
            `reviewAfter=${sanitizeForMarkdown(e.reviewAfter)}`,
        );
      }
    }
    if (enPatchRecovery.overdue.length > 0) {
      lines.push('  - overdue:');
      for (const e of enPatchRecovery.overdue) {
        lines.push(
          `    - \`${sanitizeForMarkdown(e.id)}\` ` +
            `reviewAfter=${sanitizeForMarkdown(e.reviewAfter)} ` +
            `daysUntilReview=${e.daysUntilReview}`,
        );
      }
    }
  }
  if (
    sourceSyncRecovery &&
    (sourceSyncRecovery.staleExclusions > 0 ||
      sourceSyncRecovery.overdueExclusions > 0)
  ) {
    lines.push(
      `- **source_sync_exclusions:** ${sourceSyncRecovery.staleExclusions} stale / ` +
        `${sourceSyncRecovery.overdueExclusions} overdue / ` +
        `${sourceSyncRecovery.totalExclusions} total`,
    );
    if (sourceSyncRecovery.stale.length > 0) {
      lines.push('  - stale:');
      for (const e of sourceSyncRecovery.stale) {
        lines.push(
          `    - \`${sanitizeForMarkdown(e.slug)}\` ` +
            `fetchStatus=${sanitizeForMarkdown(e.fetchStatus)} ` +
            `reviewAfter=${sanitizeForMarkdown(e.reviewAfter)}`,
        );
      }
    }
    if (sourceSyncRecovery.overdue.length > 0) {
      lines.push('  - overdue:');
      for (const e of sourceSyncRecovery.overdue) {
        lines.push(
          `    - \`${sanitizeForMarkdown(e.slug)}\` ` +
            `reviewAfter=${sanitizeForMarkdown(e.reviewAfter)} ` +
            `daysUntilReview=${e.daysUntilReview}`,
        );
      }
    }
  }
  return lines;
}

/**
 * Render the markdown fragment added to the sourceSyncHealth issue body when
 * `upstreamRecovery` has non-zero stale / overdue entries (Phase B Task 4).
 * Returns [] when both sections are clean so the caller can spread it safely.
 */
function renderUpstreamRecoverySubsection({ enPatchRecovery, sourceSyncRecovery }) {
  const entries = renderUpstreamRecoveryEntries({ enPatchRecovery, sourceSyncRecovery });
  if (entries.length === 0) return [];
  return [
    '## 上流修正候補 (upstream recovery)',
    '',
    '> `upstream-recovery-status.json` で検知された stale/overdue エントリー。' +
      '運用手順は `docs/PARITY_GUIDE.md §許容機構` と ' +
      '`docs/OPS_DESIGN.md §Weekly: Upstream recovery triage` を参照。',
    '',
    ...entries,
    '',
  ];
}

export function buildActionableReport(snapshot, parity, auditManifest, options = {}) {
  const maxEntries = options.maxEntries ?? 10;
  const sourceSync = options.sourceSync ?? {};
  const upstreamRecovery = options.upstreamRecovery ?? null;
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

  // structure mismatch の補助 counter は summary にだけ露出する。
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

  // source sync health
  const freshnessState = sourceSync.freshnessState ?? null;
  // linkage failure も source-sync-health issue を開く対象に含める。
  // reviewer が freshness 劣化と stale / scope-mismatch run を同じ場所で見られるようにする。
  // linkageState='missing' は legacy / no-linkage ケースなので意図的に昇格しない。
  const linkageBlocking =
    linkageState !== null && linkageState !== 'linked' && linkageState !== 'missing';
  const syncSummary = sourceSync.summary ?? {};
  const syncErrors = sourceSync.errors ?? [];

  // source-side debt counters/slugs は source-sync-status.json から組み立てる。
  const sourceSideDebtSummary = buildSourceSideDebtSummary(sourceSync);
  const hasSourceSideDebt = sourceSideDebtSummary.excludedPages > 0 ||
    (sourceSideDebtSummary.fetchErrorSlugs?.length ?? 0) > 0;

  // Phase B (Task 4): upstream recovery signals are surfaced as subsections
  // inside the existing sourceSyncHealth family — no new detection family,
  // no new workflow. `buildUpstreamRecoverySections` returns {null,null} when
  // upstreamRecovery is absent / empty, keeping the family body untouched.
  const upstreamRecoverySections = buildUpstreamRecoverySections(
    upstreamRecovery,
    maxEntries,
  );
  const hasUpstreamRecoverySignal =
    (upstreamRecoverySections.enPatchRecovery?.stalePatches ?? 0) > 0 ||
    (upstreamRecoverySections.enPatchRecovery?.overduePatches ?? 0) > 0 ||
    (upstreamRecoverySections.sourceSyncRecovery?.staleExclusions ?? 0) > 0 ||
    (upstreamRecoverySections.sourceSyncRecovery?.overdueExclusions ?? 0) > 0;

  const syncShouldOpen =
    freshnessState === 'broken' || freshnessState === 'partial' || linkageBlocking ||
    hasSourceSideDebt || hasUpstreamRecoverySignal;

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
        // debt サブセクションは件数 0 なら省略する。
        ...(hasSourceSideDebt
          ? [...renderSourceSideDebtSubsection(sourceSideDebtSummary, sourceSync.pages ?? []), '']
          : []),
        // Phase B: upstream recovery subsection is also omitted when clean.
        ...(hasUpstreamRecoverySignal
          ? [...renderUpstreamRecoverySubsection(upstreamRecoverySections), '']
          : []),
        '## アーティファクト',
        '',
        '- `source-sync-status.json`',
        '- `snapshot-diff-status.json`',
        '- `parity-check-status.json`',
        ...(upstreamRecovery && typeof upstreamRecovery === 'object' &&
            upstreamRecovery.mechanisms
          ? ['- `upstream-recovery-status.json`']
          : []),
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
      // source-side debt counter / slug list は独立フィールドで返す。
      sourceSideDebt: sourceSideDebtSummary,
      // Phase B: upstream-recovery aggregator output (en_patches +
      // sync_exclusions stale/overdue breakdown). `null` when
      // upstream-recovery-status.json is absent.
      enPatchRecovery: upstreamRecoverySections.enPatchRecovery,
      sourceSyncRecovery: upstreamRecoverySections.sourceSyncRecovery,
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
        // active な reportable issue を 1 件以上持つ file だけを数える。
        // 有効な ack と未期限切れ baseline はここに含めない。
        issueCount: parityIssueFiles.length,
        acknowledgedIssues: parity.summary?.acknowledgedIssues || 0,
        expiredAcknowledgements: parity.summary?.expiredAcknowledgements || 0,
        issuesByType: parityIssueSummary.issuesByType,
        issuesBySeverity: parityIssueSummary.issuesBySeverity,
        // structure mismatch の type 別内訳は補助フィールドとして残す。
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

  // source-side debt は summary markdown にも出す。
  const sourceSideDebt =
    actionableReport?.sourceSyncHealth?.sourceSideDebt ??
    buildSourceSideDebtSummary(sourceSync);
  const sourceSideDebtSection =
    sourceSideDebt.excludedPages > 0 || (sourceSideDebt.fetchErrorSlugs?.length ?? 0) > 0
      ? renderSourceSideDebtSubsection(sourceSideDebt, sourceSync?.pages ?? [])
      : [];

  // parity section では、coarse audit signal を除いた reportableActive*
  // counter を表示する。降格済みの coarse heuristic は別枠の audit
  // signals section に出し、active parity drift と混同させない。
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

  // structure mismatch は独立 advisory section を持たず、source unusable だけを分離表示する。
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
  upstreamRecoveryPath = path.join(ROOT_DIR, 'upstream-recovery-status.json'),
  strict = false,
} = {}) {
  const inputs = {
    snapshot: readJson(snapshotPath),
    parity: readJson(parityPath),
    sourceSync: readJson(sourceSyncPath),
    // Phase B: upstream-recovery-status.json is optional. Absent file is a
    // legitimate state (local dev, PR CI without the artifact). readJson()
    // returns {} for missing files, which downstream consumers treat as
    // "no signal" (graceful degradation).
    upstreamRecovery: readJson(upstreamRecoveryPath),
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
