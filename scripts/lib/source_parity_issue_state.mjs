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
  //
  // Issue #247 PR1: structure mismatch / source unusable は coarse に
  // 含まれないため、ここでは特別扱い不要。いずれも reportable として
  // 一般 actionable issue と同じ経路を通る。
  if (isCoarseAuditSignal(issue)) return false;
  if (issue.severity !== 'actionable' && issue.severity !== 'signal') return false;
  if (isFrozenByBaseline(issue)) return false;
  return isActiveParityIssue(issue);
}

export function isNonBlockingParityIssue(issue) {
  return isFrozenByBaseline(issue) || isValidAcknowledgedIssue(issue);
}
