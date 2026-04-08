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

/**
 * Issue #247 PR2 — structure-mismatch / source-unusable のうち、まだ
 * ack / baseline で覆われていないものを「advisory only」として識別する
 * 純粋述語。
 *
 * PR2 で emission を入れたが gate cutover は PR4 の責務、という方針
 * (`isReportableParityIssue` の docstring 参照) を CLI 表示と整合させる
 * ために独立した述語にしている。advisory only な issue は:
 *   - gate には乗らない (`isReportableParityIssue` が false を返す)
 *   - だが ack / baseline で **覆われているわけではない** ので、CLI で
 *     "covered by baseline/ack" と表示するのは誤り
 *   - 専用の "(advisory only)" / "(advisory + baseline/ack)" suffix で
 *     表示する
 *
 * ack / baseline が付いている structure mismatch はこの述語で false に
 * なる (ack / baseline 経路が優先で、advisory より具体的なカバレッジ
 * 情報を持っているため)。
 *
 * PR4 cutover ではこの述語と CLI 側の advisory 表示分岐を削除する。
 */
export function isAdvisoryOnlyParityIssue(issue) {
  if (!issue || typeof issue !== 'object') return false;
  if (!isStructureMismatchIssue(issue) && !isSourceUnusableIssue(issue)) return false;
  // ack / baseline 経路が優先 — そちらが付いている場合は covered 扱いで
  // advisory ではない。
  if (isValidAcknowledgedIssue(issue)) return false;
  if (isFrozenByBaseline(issue)) return false;
  return true;
}

export function isNonBlockingParityIssue(issue) {
  // 「非ブロッキング」の元の意味 — ack または baseline で **明示的に** 覆わ
  // れている issue だけ。Issue #247 PR2 で emission を入れた structure-
  // mismatch / source-unusable は、PR4 cutover まで gate には乗らないが、
  // それは ack / baseline で覆われているからではなく advisory として
  // 扱っているからなので、ここには含めない。CLI の "(covered by
  // baseline/ack)" / "(advisory only)" を区別するために
  // `isAdvisoryOnlyParityIssue` を別途用意してある。
  return isFrozenByBaseline(issue) || isValidAcknowledgedIssue(issue);
}
