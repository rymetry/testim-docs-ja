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
 * 現行契約では、新しい `section-structure-mismatch` /
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
 * section-anchored canonical block sequence comparator 由来
 * の structure mismatch 判定。type のみで判定する純粋関数。ack / baseline /
 * severity は無視する (別の counter に畳み込むための純粋分類述語)。
 */
export function isStructureMismatchIssue(issue) {
  if (!issue || typeof issue !== 'object') return false;
  if (typeof issue.type !== 'string') return false;
  return STRUCTURE_MISMATCH_TYPES.has(issue.type);
}

/**
 * snapshot / source 起因で canonical comparator が成立しないページ用判定。
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

  // structure mismatch は reportable、source-unusable は advisory のまま扱う。
  if (isSourceUnusableIssue(issue)) return false;

  if (issue.severity !== 'actionable' && issue.severity !== 'signal') return false;
  if (isFrozenByBaseline(issue)) return false;
  return isActiveParityIssue(issue);
}

/**
 * source-unusable のうち、まだ ack / baseline で覆われて
 * いないものを「advisory only」として識別する純粋述語。
 *
 * scope を縮小した。structure mismatch は gate に昇格した
 * ため advisory ではなくなり、このラベルは source-unusable
 * (snapshot-incomplete / source-unusable) のみを指す。source-unusable は
 * 翻訳者責任外 (snapshot / source sync 側 debt) なので引き続き advisory
 * のまま扱う。
 *
 * advisory only な issue は:
 *   - gate には乗らない (`isReportableParityIssue` が false を返す)
 *   - だが ack / baseline で **覆われているわけではない** ので、CLI で
 *     "covered by baseline/ack" と表示するのは誤り
 *   - 専用の "(source unusable)" / "(advisory + baseline/ack)" suffix で
 *     表示する
 *
 * ack / baseline が付いている source-unusable はこの述語で false に
 * なる (ack / baseline 経路が優先で、advisory より具体的なカバレッジ
 * 情報を持っているため)。
 */
export function isAdvisoryOnlyParityIssue(issue) {
  if (!issue || typeof issue !== 'object') return false;
  if (!isSourceUnusableIssue(issue)) return false;
  // ack / baseline 経路が優先 — そちらが付いている場合は covered 扱いで
  // advisory ではない。
  if (isValidAcknowledgedIssue(issue)) return false;
  if (isFrozenByBaseline(issue)) return false;
  return true;
}

export function isNonBlockingParityIssue(issue) {
  // 「非ブロッキング」の元の意味 — ack または baseline で **明示的に** 覆わ
  // れている issue だけ。現在は structure mismatch も
  // 通常通り baseline / ack で覆える (覆われていれば非ブロッキング、
  // active なら gate に載る)。source-unusable は ack / baseline で
  // 覆われていない場合に「advisory only」として `isAdvisoryOnlyParityIssue`
  // 経路で識別される。CLI の "(covered by baseline/ack)" /
  // "(source unusable)" を区別するためにこの 2 経路を使い分ける。
  return isFrozenByBaseline(issue) || isValidAcknowledgedIssue(issue);
}
