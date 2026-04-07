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
  // Issue #247 PR1 — section-anchored canonical block sequence comparator
  // の first-class issue type。count heuristic (paragraph/bullet/step/heading)
  // を主判定から降ろし、section ごとの block 列そのものを比較した結果を
  // ここに emit する。PR1 時点では taxonomy / contract のみ導入し、emission
  // は PR2 で追加する。どちらも reportable (actionable) で、coarse audit
  // signal には含めない。ack は可能 / baseline は PR1 時点では未対応
  // (STRUCTURE_MISMATCH_TYPES の docstring 参照)。
  'section-structure-mismatch': 'actionable',
  'segment-order-mismatch': 'actionable',
  // Issue #247 PR1 — snapshot / source 起因で comparator が成立しない
  // ページ用。shallow snapshot / collapsed article / malformed details などの
  // 既知 unusable パターンにマッチした場合、structure mismatch を suppress
  // してこちらに 1 件だけ畳む。PR3 で emission を追加する。reportable に
  // 含めるが、structure mismatch とは別 counter で集計する (translation
  // drift と source unusable を混ぜないため)。ack は可能 / baseline は
  // PR1 時点では未対応 (SOURCE_UNUSABLE_TYPES の docstring 参照)。
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
 * Issue #247 PR1: count heuristic は advisory に残す (structure mismatch を
 * 主判定にしつつ、並行 signal として deep-audit からは見えるようにする)。
 * 新しい `section-structure-mismatch` / `segment-order-mismatch` /
 * `snapshot-incomplete` / `source-unusable` は coarse 扱いにはしない (reportable
 * な一級 issue)。
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
 * Issue #247 PR1 — canonical block sequence comparator 由来の structure
 * mismatch の issue type allowlist。EN/JA の section path ごとの block 列差
 * として検出される「原文の全文構造を保っていない翻訳」を first-class に
 * 出すための集合。PR2 で `source_parity_align.mjs` から emit される。
 *
 * これらの type の PR2 時点での契約:
 * - coarse audit signal には**含めない**
 * - summary の `structureMismatchIssues` / `structureMismatchFiles` に
 *   独立 counter として集計される
 * - **`isReportableParityIssue()` からは PR2 では除外**。PR4 の gate cutover
 *   で `reportableActive*` に取り込むまで、gate exit code には寄与しない。
 *   (`BASELINE_ELIGIBLE_TYPES` が PR5 まで新 type を受け付けないため、PR2
 *   時点で gate に載せると既存 baseline 済みページが reportable に転落して
 *   ブロックされる。`isReportableParityIssue` で gate exclusion を入れる
 *   ことで「emission を入れる PR2」と「gate に載せる PR4」を綺麗に分ける。)
 * - **acknowledgement は可能** (NON_ACKNOWLEDGEABLE_TYPES に入れないため、
 *   意図的な差分を reviewer が ack で抑制できる)
 * - **baseline は PR1 時点では未対応**。`source_parity_baseline.mjs` の
 *   `BASELINE_ELIGIBLE_TYPES` は引き続き legacy `segment-*` ファミリだけを
 *   許容し、新 type は拒否される。新 type の baseline 同定キー
 *   (section path / block kind / canonical sequence hash など) は PR2/PR3
 *   で emitter が fix した後、PR5 の baseline migration で設計 + wiring する。
 */
export const STRUCTURE_MISMATCH_TYPES = Object.freeze(
  new Set([
    'section-structure-mismatch',
    'segment-order-mismatch',
  ]),
);

/**
 * Issue #247 PR1 — snapshot / source 起因で canonical comparator が成立しない
 * ページ用の issue type allowlist。shallow snapshot / collapsed article /
 * malformed details など known unusable パターンにマッチした場合に、
 * structure mismatch を suppress してこちらに 1 件だけ畳む。PR3 で
 * `source_parity_checks.mjs` から emit される。
 *
 * これらの type の PR2 時点での契約:
 * - coarse audit signal には**含めない**
 * - summary の `snapshotUnusableIssues` / `snapshotUnusableFiles` に
 *   独立 counter として集計される (translation drift とは別カウント)
 * - **`isReportableParityIssue()` からは PR2 では除外**。structure mismatch と
 *   同じ理由で gate cutover は PR4 に持ち越す。
 * - **acknowledgement は可能** (snapshot 側の known 崩れを ack で抑制できる)
 * - **baseline は PR1 時点では未対応**。`BASELINE_ELIGIBLE_TYPES` は
 *   これらを許容せず、`validateBaseline` は新 type を含む entry を reject
 *   する。page-level の freeze 粒度 (page slug? known-artifact id? source
 *   fingerprint?) は PR3 の emitter 設計と連動するため、PR5 の baseline
 *   migration で合わせて wiring する。
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
