import {
  isCoarseAuditSignal,
  isFrozenByBaseline,
  isReportableParityIssue,
  isSourceUnusableIssue,
  isStructureMismatchIssue,
  isValidAcknowledgedIssue,
} from './source_parity_issue_state.mjs';

/**
 * 各 file の parity 結果を type / severity / acknowledgement の summary
 * 統計に集計する純粋関数。
 *
 * Counter 契約:
 *
 *   activeFiles / activeActionableFiles / activeErrorFiles
 *     Legacy gate counters。active (非 ack, 非 frozen-baseline) issue を
 *     持つファイル数。**coarse audit signals もここには寄与する**ため、
 *     audit demotion 前の意味を読み続ける downstream 消費者と互換が保たれる。
 *
 *   reportableActiveFiles / reportableActiveActionableFiles
 *     現行 gate counters。少なくとも 1 件の isReportableParityIssue() == true
 *     な issue を持つファイル数。coarse audit signals は ack / baseline が
 *     期限切れでもここには寄与しない (gate を再点火しない契約)。
 *     check_source_parity.mjs::computeExitCode と
 *     detection_reports.mjs::buildActionableReport が読む。
 *
 *   auditSignalIssues / auditSignalFiles / auditSignalsByType
 *     Audit channel: coarse signal の総数 + type 別内訳。
 *
 *   structureMismatchIssues / structureMismatchFiles / structureMismatchByType
 *     Issue #247 PR1 — canonical block sequence comparator 由来の structure
 *     mismatch (section-structure-mismatch / segment-order-mismatch) の
 *     独立 counter。ack (valid) と frozen baseline は除外し、gate に載せる
 *     予定の active な structure violation のみカウントする。PR2 で emitter
 *     を追加するまでは常にゼロ。PR4 で `reportableActive*` と揃えて gate
 *     cutover する。
 *
 *     PR1 時点の注意: 新 type は `BASELINE_ELIGIBLE_TYPES` にまだ含まれない
 *     ため、現実運用で baseline が付くことは無い (loader が reject する)。
 *     ここで `!isFrozen` を見ているのは将来の baseline wiring (PR5) を
 *     見越した契約であって、PR1 段階では純粋に ack だけが除外経路になる。
 *
 *   snapshotUnusableIssues / snapshotUnusableFiles / snapshotUnusableByType
 *     Issue #247 PR1 — snapshot / source 起因で comparator が成立しない
 *     ページ用の独立 counter。`snapshot-incomplete` / `source-unusable` を
 *     translation drift と混ぜないために別枠で集計する。PR3 で emitter を
 *     追加するまでは常にゼロ。baseline eligibility は structureMismatch と
 *     同じで、PR1 時点では未対応 (PR5 で wiring)。
 *
 *   baselinedIssues / baselinedFiles / baselinedByType /
 *   baselinedByInconclusiveCategory / expiredBaselineEntries
 *     Frozen drift accounting。parity-baseline.json が cutover 前の
 *     segment-* drift を active gate から除外する。期限切れ baseline は
 *     gate に refire する (isFrozenByBaseline / isReportableParityIssue 参照)。
 */
export function summarizeParityResults(results) {
  const issuesByType = {};
  const issuesBySeverity = {};
  const baselinedByType = {};
  const baselinedByInconclusiveCategory = {};
  const auditSignalsByType = {};
  const structureMismatchByType = {};
  const snapshotUnusableByType = {};
  let actionableFiles = 0;
  let signalFiles = 0;
  let errorFiles = 0;
  let activeActionableFiles = 0;
  let activeErrorFiles = 0;
  let activeFiles = 0;
  let totalIssues = 0;
  let acknowledgedIssues = 0;
  let expiredAcknowledgements = 0;
  let baselinedIssues = 0;
  let baselinedFiles = 0;
  let expiredBaselineEntries = 0;
  let expiringBaselineEntries30d = 0;
  let reportableActiveFiles = 0;
  let reportableActiveActionableFiles = 0;
  let auditSignalIssues = 0;
  let auditSignalFiles = 0;
  let structureMismatchIssues = 0;
  let structureMismatchFiles = 0;
  let snapshotUnusableIssues = 0;
  let snapshotUnusableFiles = 0;

  for (const result of results) {
    let hasActionable = false;
    let hasSignal = false;
    let hasError = false;
    let hasActiveActionable = false;
    let hasActiveError = false;
    let hasActiveIssue = false;
    let hasBaselined = false;
    let hasReportableActive = false;
    let hasReportableActiveActionable = false;
    let hasAuditSignal = false;
    let hasStructureMismatch = false;
    let hasSnapshotUnusable = false;

    for (const issue of result.issues) {
      const isBaselined = issue.baselined === true;
      const isFrozen = isFrozenByBaseline(issue);

      if (isBaselined) {
        baselinedIssues += 1;
        baselinedByType[issue.type] = (baselinedByType[issue.type] || 0) + 1;
        if (issue.baselineExpired === true) {
          expiredBaselineEntries += 1;
        } else if (issue.baselineExpiringSoon === true) {
          expiringBaselineEntries30d += 1;
        }
        if (
          issue.type === 'segment-inconclusive' &&
          typeof issue.inconclusiveCategory === 'string'
        ) {
          baselinedByInconclusiveCategory[issue.inconclusiveCategory] =
            (baselinedByInconclusiveCategory[issue.inconclusiveCategory] || 0) + 1;
        }
        hasBaselined = true;
      }

      totalIssues += 1;
      issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
      issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;

      // coarse signals は ack / baseline 状態に関わらず audit channel で
      // 別管理する。gate を駆動する reportable counters には絶対に寄与しない契約。
      if (isCoarseAuditSignal(issue)) {
        auditSignalIssues += 1;
        auditSignalsByType[issue.type] = (auditSignalsByType[issue.type] || 0) + 1;
        hasAuditSignal = true;
      }

      // Issue #247 PR1 — structure mismatch / source unusable の専用 counter。
      // ack / frozen baseline を除外して active な drift のみカウントする。
      // PR1 時点では emitter 未実装のため実運用では常にゼロ。PR2/PR3 で
      // emission を追加する。
      if (isStructureMismatchIssue(issue) && !isValidAcknowledgedIssue(issue) && !isFrozen) {
        structureMismatchIssues += 1;
        structureMismatchByType[issue.type] =
          (structureMismatchByType[issue.type] || 0) + 1;
        hasStructureMismatch = true;
      }

      if (isSourceUnusableIssue(issue) && !isValidAcknowledgedIssue(issue) && !isFrozen) {
        snapshotUnusableIssues += 1;
        snapshotUnusableByType[issue.type] =
          (snapshotUnusableByType[issue.type] || 0) + 1;
        hasSnapshotUnusable = true;
      }

      if (isReportableParityIssue(issue)) {
        hasReportableActive = true;
        if (issue.severity === 'actionable') {
          hasReportableActiveActionable = true;
        }
      }

      const isValidAck = isValidAcknowledgedIssue(issue);

      if (isValidAck) {
        acknowledgedIssues += 1;
      } else if (!isFrozen) {
        hasActiveIssue = true;
      }

      if (issue.acknowledged === true && issue.ackExpired === true) {
        expiredAcknowledgements += 1;
      }

      if (issue.severity === 'actionable') {
        hasActionable = true;
        if (!isValidAck && !isFrozen) hasActiveActionable = true;
      }
      if (issue.severity === 'signal') hasSignal = true;
      if (issue.severity === 'error') {
        hasError = true;
        if (!isValidAck && !isFrozen) hasActiveError = true;
      }
    }

    if (hasActionable) actionableFiles += 1;
    else if (hasError) errorFiles += 1;
    else if (hasSignal) signalFiles += 1;

    if (hasActiveActionable) activeActionableFiles += 1;
    if (hasActiveError) activeErrorFiles += 1;
    if (hasActiveIssue) activeFiles += 1;
    if (hasBaselined) baselinedFiles += 1;
    if (hasReportableActive) reportableActiveFiles += 1;
    if (hasReportableActiveActionable) reportableActiveActionableFiles += 1;
    if (hasAuditSignal) auditSignalFiles += 1;
    if (hasStructureMismatch) structureMismatchFiles += 1;
    if (hasSnapshotUnusable) snapshotUnusableFiles += 1;
  }

  return {
    filesWithIssues: results.length,
    actionableFiles,
    signalFiles,
    errorFiles,
    activeActionableFiles,
    activeErrorFiles,
    activeFiles,
    totalIssues,
    acknowledgedIssues,
    expiredAcknowledgements,
    issuesByType,
    issuesBySeverity,
    baselinedIssues,
    baselinedFiles,
    baselinedByType,
    baselinedByInconclusiveCategory,
    expiredBaselineEntries,
    expiringBaselineEntries30d,
    // audit / reportable counters — header コメント参照
    reportableActiveFiles,
    reportableActiveActionableFiles,
    auditSignalIssues,
    auditSignalFiles,
    auditSignalsByType,
    // Issue #247 PR1 — structure mismatch / source unusable counters。
    // PR2/PR3 で emitter を追加するまでは常にゼロだが、downstream
    // (detection_reports / CLI / schema validation) が受け入れる枠を
    // 先に確保する。
    structureMismatchIssues,
    structureMismatchFiles,
    structureMismatchByType,
    snapshotUnusableIssues,
    snapshotUnusableFiles,
    snapshotUnusableByType,
  };
}
