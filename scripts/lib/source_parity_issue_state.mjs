/**
 * gate / summary / reporting で共有する issue 状態判定述語。CLI 出力、
 * parityRegression フィルタ、summary 集計が同じ基準で動くようにここに集約する。
 */

import { COARSE_SIGNAL_TYPES } from './source_parity_types.mjs';

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
 */
export function isCoarseAuditSignal(issue) {
  if (!issue || typeof issue !== 'object') return false;
  if (typeof issue.type !== 'string') return false;
  return COARSE_SIGNAL_TYPES.has(issue.type);
}

export function isReportableParityIssue(issue) {
  // coarse signals (paragraph/bullet/step/section count, heading,
  // table-shape, table-cell-* heuristics) は audit-only で
  // parityRegression / gate には乗らない。ack / baseline 状態は無視する。
  if (isCoarseAuditSignal(issue)) return false;
  if (issue.severity !== 'actionable' && issue.severity !== 'signal') return false;
  if (isFrozenByBaseline(issue)) return false;
  return isActiveParityIssue(issue);
}

export function isNonBlockingParityIssue(issue) {
  return isFrozenByBaseline(issue) || isValidAcknowledgedIssue(issue);
}
