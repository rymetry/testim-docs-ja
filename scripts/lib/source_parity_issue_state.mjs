/**
 * gate / summary / reporting で共有する issue 状態判定述語。CLI 出力、
 * parityRegression フィルタ、summary 集計が同じ基準で動くようにここに集約する。
 */

import {
  COARSE_SIGNAL_TYPES,
  SOURCE_UNUSABLE_TYPES,
  STRUCTURE_MISMATCH_TYPES,
} from './source_parity_types.mjs';

export function isValidAcknowledgedIssue(issue) {
  return issue.acknowledged === true && issue.ackExpired !== true;
}

export function isFrozenByBaseline(issue) {
  return issue.baselined === true && issue.baselineExpired !== true;
}

export function isActiveParityIssue(issue) {
  return !isValidAcknowledgedIssue(issue);
}

/**
 * coarse audit signal 判定。count / shape / table-cell heuristics 系の
 * 降格された issue かを type だけで判定する純粋関数。severity / ack /
 * baseline 状態は無視するため、期限切れ ack / baseline でも coarse signal は
 * coarse signal のままで `parityRegression` / gate を再点火しない契約。
 *
 * Issue #247 PR1 の契約上、新しい `section-structure-mismatch` /
 * `segment-order-mismatch` / `snapshot-incomplete` / `source-unusable` は
 * coarse audit signal には**含めない**。これらは reportable な一級 issue
 * として扱う。
 */
export function isCoarseAuditSignal(issue) {
  if (!issue || typeof issue !== 'object') return false;
  if (typeof issue.type !== 'string') return false;
  return COARSE_SIGNAL_TYPES.has(issue.type);
}

/**
 * Issue #247 PR1 — section-anchored canonical block sequence comparator 由来
 * の structure mismatch 判定。type のみで判定する純粋関数。ack / baseline /
 * severity は無視する (別の counter に畳み込むための純粋分類述語)。
 */
export function isStructureMismatchIssue(issue) {
  if (!issue || typeof issue !== 'object') return false;
  if (typeof issue.type !== 'string') return false;
  return STRUCTURE_MISMATCH_TYPES.has(issue.type);
}

/**
 * Issue #247 PR1 — snapshot / source 起因で canonical comparator が成立しない
 * ページ用 issue 判定。type のみで判定する純粋関数。structure mismatch と
 * 重なった場合の優先順位は emission 側 (PR3) で制御し、ここでは純粋分類に
 * 留める。
 */
export function isSourceUnusableIssue(issue) {
  if (!issue || typeof issue !== 'object') return false;
  if (typeof issue.type !== 'string') return false;
  return SOURCE_UNUSABLE_TYPES.has(issue.type);
}

export function isReportableParityIssue(issue) {
  // coarse signals (paragraph/bullet/step/section count, heading,
  // table-shape, table-cell-* heuristics) は audit-only で
  // parityRegression / gate には乗らない。ack / baseline 状態は無視する。
  if (isCoarseAuditSignal(issue)) return false;

  // Issue #247 PR2 — structure-mismatch / source-unusable は PR2 で
  // emission を入れた段階で、PR4 の gate cutover まで `reportableActive*`
  // (gate counter) には乗せない。専用の `structureMismatchIssues` /
  // `snapshotUnusableIssues` counter にだけ集計する。
  //
  // この exclusion を入れる理由:
  //   1. PR1 で `BASELINE_ELIGIBLE_TYPES` に新 type を入れていない (PR5 で
  //      wiring 予定)。今 reportable に乗せると、既存の segment-* drift で
  //      baseline されているページが PR2 から structure-mismatch を emit
  //      した瞬間に gate exit 1 でブロックされる (新 type は baseline で
  //      freeze できないため)。
  //   2. 段階的 cutover の意図 — PR2 は emitter / contract を pin する
  //      フェーズで、gate flip は PR4 の責務 (Issue #247 の PR 分割案
  //      参照)。
  //   3. PR4 でこの 2 行を削除するだけで cutover が完了する設計。
  //      それまでは structure-mismatch は構造化 advisory として
  //      `structureMismatch*` counter から見えるが、gate は再点火しない。
  if (isStructureMismatchIssue(issue) || isSourceUnusableIssue(issue)) return false;

  if (issue.severity !== 'actionable' && issue.severity !== 'signal') return false;
  if (isFrozenByBaseline(issue)) return false;
  return isActiveParityIssue(issue);
}

export function isNonBlockingParityIssue(issue) {
  // Issue #247 PR2 — structure-mismatch / source-unusable は PR2 時点で
  // gate cutover していないので (`isReportableParityIssue` も同じ理由で
  // false を返している)、ack / baseline と同じく **非ブロッキングの
  // advisory** として扱う。CLI の `getConsoleCoverageState` がこの述語を
  // 使ってファイルの ⏸️ / ❌ アイコンを決めるので、structure mismatch を
  // ここで非ブロッキングに含めないと、新 issue が emit された瞬間に
  // baseline 済みファイルが ❌ で表示されてしまう。
  //
  // PR4 cutover ではこの 2 行を削除し、structure mismatch を従来の ack /
  // baseline と同じ ブロッキング判定経路に乗せる。
  if (isStructureMismatchIssue(issue)) return true;
  if (isSourceUnusableIssue(issue)) return true;
  return isFrozenByBaseline(issue) || isValidAcknowledgedIssue(issue);
}
