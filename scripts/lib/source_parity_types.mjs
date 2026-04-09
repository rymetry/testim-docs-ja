/** source parity 判定で共有する severity と定数。 */

export const ISSUE_SEVERITY = Object.freeze({
  untranslated: 'actionable',
  'legacy-callout': 'actionable',
  'jsx-callout': 'actionable',
  'h1-in-body': 'actionable',
  'image-mismatch': 'actionable',
  'codeblock-mismatch': 'actionable',
  'image-order-mismatch': 'actionable',
  'callout-nesting-mismatch': 'actionable',
  'step-count-mismatch': 'signal',
  'bullet-count-mismatch': 'signal',
  'paragraph-count-mismatch': 'signal',
  'heading-mismatch': 'signal',
  'section-count-mismatch': 'signal',
  'table-shape-mismatch': 'signal',
  'table-cell-english-residual': 'signal',
  'table-cell-empty-mismatch': 'signal',
  'table-cell-token-mismatch': 'signal',
  'source-page-missing-local': 'actionable',
  'local-page-orphan': 'actionable',
  'missing-fresh-snapshot': 'actionable',
  'missing-snapshot': 'signal',
  'source-fetch-error': 'error',
  // section-anchored exact diff gate の issue type。source_parity_align.mjs
  // から emit される。5 種すべて gate-eligible (actionable)。うち 3 種
  // (segment-missing, segment-untranslated, segment-token-gap) は
  // NON_ACKNOWLEDGEABLE_TYPES にも入っており ack で抑制できない。
  // segment-extra と segment-shifted は ack 可能で、意図的な拡張や
  // 構造シフトを人間レビューに渡すための余地として残してある。
  'segment-missing': 'actionable',
  'segment-extra': 'actionable',
  'segment-shifted': 'actionable',
  'segment-untranslated': 'actionable',
  'segment-token-gap': 'actionable',
  'segment-inconclusive': 'actionable',
  // section 単位の構造差分。coarse signal には含めず、reportable issue として扱う。
  'section-structure-mismatch': 'actionable',
  'segment-order-mismatch': 'actionable',
  // snapshot / source 側の事情で比較自体が成立しないページ。別カウンタで集計する。
  'snapshot-incomplete': 'actionable',
  'source-unusable': 'actionable',
});

/**
 * coarse counting / shape signals の明示的 allowlist。audit-only 出力に
 * 降格された type を列挙する。これらは引き続き `parity-check-status.json`
 * に出力され deep-audit workflow からは見えるが、`parityRegression.shouldOpenIssue`、
 * gate exit code、active-file accounting には乗らない。
 *
 * 重要 — severity ベースのフィルタではなく**明示 allowlist**にしている。
 * severity-based ("any signal") にすると `missing-snapshot` まで誤って
 * 降格してしまう。`missing-snapshot` は新規 / 欠落ページの gate signal で
 * あり (`missing-fresh-snapshot` の actionable 版と対になる)、必ず reportable
 * に残す必要があるため。
 *
 * count heuristic は advisory に残し、構造差分や source unusable は
 * reportable issue として別枠で扱う。
 */
export const COARSE_SIGNAL_TYPES = Object.freeze(
  new Set([
    'paragraph-count-mismatch',
    'bullet-count-mismatch',
    'step-count-mismatch',
    'section-count-mismatch',
    'heading-mismatch',
    'table-shape-mismatch',
    'table-cell-english-residual',
    'table-cell-empty-mismatch',
    'table-cell-token-mismatch',
  ]),
);

/**
 * canonical block sequence comparator が出す structure mismatch の集合。
 *
 * 現行契約:
 * - coarse audit signal には**含めない**
 * - summary の `structureMismatchIssues` / `structureMismatchFiles` に
 *   独立 counter として集計される (gate counter とは並走)
 * - **`isReportableParityIssue()` で reportable** — ack / baseline で
 *   覆われていない active な structure mismatch は `reportableActive*`
 *   に流れ込み、gate exit code 1 を駆動する
 * - **acknowledgement は可能** (`NON_ACKNOWLEDGEABLE_TYPES` に入っていない)
 * - **baseline は対応済み** — `BASELINE_ELIGIBLE_TYPES` に含まれ、
 *   identity key は `sectionIndex + structureCategory + structureFingerprint`
 *   (`source_parity_baseline.mjs::buildBaselineKey` 参照)。期限切れ baseline
 *   は通常通り gate を refire する
 */
export const STRUCTURE_MISMATCH_TYPES = Object.freeze(
  new Set([
    'section-structure-mismatch',
    'segment-order-mismatch',
  ]),
);

/**
 * snapshot / source 起因で comparator が成立しないページ用の集合。
 *
 * 現行契約:
 * - coarse audit signal には**含めない**
 * - summary の `snapshotUnusableIssues` / `snapshotUnusableFiles` に
 *   独立 counter として集計される (translation drift とは別カウント)
 * - **`isReportableParityIssue()` からは引き続き除外** — 翻訳者責任外
 *   (snapshot / source sync 側 debt は翻訳 PR で直せない) のため、active
 *   な source unusable があっても gate exit code は 0 のまま。CLI は
 *   `(source unusable)` suffix で advisory として表示する
 * - **acknowledgement は可能** (snapshot 側の known 崩れを ack で抑制できる)
 * - **baseline は対応済み** — `BASELINE_ELIGIBLE_TYPES` に追加されており、
 *   identity key は `usabilityReason` 単独 (`source_parity_baseline.mjs::
 *   buildBaselineKey` 参照)。**特殊ルール**: 期限切れ baseline でも
 *   gate を refire しない (`isReportableParityIssue` が source unusable
 *   分岐で常に false を返すため)
 */
export const SOURCE_UNUSABLE_TYPES = Object.freeze(
  new Set([
    'snapshot-incomplete',
    'source-unusable',
  ]),
);

export const UNTRANSLATED_PATTERNS = Object.freeze([
  /^(?:\d+\.\s*)?Hover over the\b/i,
  /^(?:\d+\.\s*)?Click on the\b/i,
  /^(?:\d+\.\s*)?Click on \*\*/i,
  /^(?:\d+\.\s*)?Scroll down through the menu/i,
  /^(?:\d+\.\s*)?Select the\b/i,
  /^(?:\d+\.\s*)?If you would like to\b/i,
  /^(?:\d+\.\s*)?The file is uploaded/i,
  /^(?:\d+\.\s*)?In the\b.*\bpanel\b/i,
  /^(?:\d+\.\s*)?From the\b.*\bdrop-?down\b/i,
]);

export const LEGACY_CALLOUT_RE = /^>\s*(?:📘|❗️?|🚧|👍|⚠️|📝|✅|❌|💡|ℹ️|⛔|🔥|💥|🎯|📌|🏷️)\s/;
export const JSX_CALLOUT_RE = /^<Callout\b/i;
export const H1_IN_BODY_RE = /^#\s+\S/;
export const FENCE_LINE_RE = /^\s*(?:(?:[-*+]\s+|\d+\.\s+))?```/;
