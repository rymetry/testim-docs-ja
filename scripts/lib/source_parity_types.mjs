/** Shared severity mappings and pattern constants for the source parity checking system. */

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
