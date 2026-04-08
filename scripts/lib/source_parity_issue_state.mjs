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

  // Issue #247 PR5 — gate cutover 済み。structure mismatch
  // (section-structure-mismatch / segment-order-mismatch) は reportable
  // に昇格し、ack / baseline で覆われていなければ `reportableActive*`
  // counter と gate exit code に寄与する。source-unusable
  // (snapshot-incomplete / source-unusable) は引き続き advisory のまま
  // (翻訳 PR で修正できない source 側 debt なので reviewer を誤誘導する
  // ことを避ける)。baseline / ack で人手管理する枠は提供するが、active
  // な source-unusable が 1 件あっても exit code は 0。
  if (isSourceUnusableIssue(issue)) return false;

  if (issue.severity !== 'actionable' && issue.severity !== 'signal') return false;
  if (isFrozenByBaseline(issue)) return false;
  return isActiveParityIssue(issue);
}

/**
 * Issue #247 PR5 — source-unusable のうち、まだ ack / baseline で覆われて
 * いないものを「advisory only」として識別する純粋述語。
 *
 * PR5 cutover で scope を縮小した。structure mismatch は gate に昇格した
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
  // れている issue だけ。Issue #247 PR5 cutover 後、structure mismatch も
  // 通常通り baseline / ack で覆える (覆われていれば非ブロッキング、
  // active なら gate に載る)。source-unusable は ack / baseline で
  // 覆われていない場合に「advisory only」として `isAdvisoryOnlyParityIssue`
  // 経路で識別される。CLI の "(covered by baseline/ack)" /
  // "(source unusable)" を区別するためにこの 2 経路を使い分ける。
  return isFrozenByBaseline(issue) || isValidAcknowledgedIssue(issue);
}
