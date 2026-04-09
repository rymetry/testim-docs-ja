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
 *     structure mismatch の独立 counter。ack / frozen baseline を除外し、
 *     active な構造差分だけを数える。
 *
 *   snapshotUnusableIssues / snapshotUnusableFiles / snapshotUnusableByType
 *     snapshot / source 起因で comparator が成立しないページ用の独立 counter。
 *     翻訳差分と混ぜずに別枠で集計し、gate には載せない。
 *
 *   baselinedIssues / baselinedFiles / baselinedByType /
 *   baselinedByInconclusiveCategory / expiredBaselineEntries
 *     Frozen drift accounting。parity-baseline.json が cutover 前の
 *     segment-* drift を active gate から除外する。期限切れ baseline は
 *     gate に refire する (isFrozenByBaseline / isReportableParityIssue 参照)。
 *
 * @param {object[]} results
 * @param {object} [orphanMeta] 呼び出し側で集計した orphan baseline entry の情報。
 * @param {number} [orphanMeta.orphanBaselineEntries]
 * @param {Record<string, number>} [orphanMeta.orphanBaselineByType]
 */
export function summarizeParityResults(results, orphanMeta = {}) {
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

      // coarse signal は audit channel にだけ載せる。
      if (isCoarseAuditSignal(issue)) {
        auditSignalIssues += 1;
        auditSignalsByType[issue.type] = (auditSignalsByType[issue.type] || 0) + 1;
        hasAuditSignal = true;
      }

      // structure mismatch / source unusable は専用 counter でも集計する。
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
    // audit / reportable counters
    reportableActiveFiles,
    reportableActiveActionableFiles,
    auditSignalIssues,
    auditSignalFiles,
    auditSignalsByType,
    // structure mismatch / source unusable の専用 counters
    structureMismatchIssues,
    structureMismatchFiles,
    structureMismatchByType,
    snapshotUnusableIssues,
    snapshotUnusableFiles,
    snapshotUnusableByType,
    // baseline orphan detection。情報表示用で、gate には影響しない。
    orphanBaselineEntries: orphanMeta.orphanBaselineEntries || 0,
    orphanBaselineByType:
      orphanMeta.orphanBaselineByType &&
      typeof orphanMeta.orphanBaselineByType === 'object'
        ? orphanMeta.orphanBaselineByType
        : {},
  };
}
