import {
  isCoarseAuditSignal,
  isFrozenByBaseline,
  isReportableParityIssue,
  isValidAcknowledgedIssue,
} from './source_parity_issue_state.mjs';

/**
 * Aggregates per-file parity results into type/severity/acknowledgement
 * summary statistics.
 *
 * Counter contract:
 *
 *   activeFiles / activeActionableFiles / activeErrorFiles
 *     Legacy gate counters. Count files with active (non-acked,
 *     non-frozen-baseline) issues. Coarse audit signals DO contribute
 *     here so downstream consumers that read these fields keep their
 *     pre-Phase-8 semantics.
 *
 *   reportableActiveFiles / reportableActiveActionableFiles
 *     Phase 8 gate counters. Count files with at least one
 *     isReportableParityIssue()-true issue. Coarse audit signals do NOT
 *     contribute here, even when their ack or baseline has expired —
 *     so the gate cannot re-light on a coarse signal. Read by
 *     check_source_parity.mjs::computeExitCode and
 *     detection_reports.mjs::buildActionableReport.
 *
 *   auditSignalIssues / auditSignalFiles / auditSignalsByType
 *     Phase 8 audit channel: coarse signal totals + per-type breakdown.
 *
 *   baselinedIssues / baselinedFiles / baselinedByType /
 *   baselinedByInconclusiveCategory / expiredBaselineEntries
 *     Frozen-drift accounting. parity-baseline.json keeps pre-cutover
 *     segment-* drift out of the active gate; expired baseline entries
 *     re-enter the gate per Phase 7 semantics.
 */
export function summarizeParityResults(results) {
  const issuesByType = {};
  const issuesBySeverity = {};
  const baselinedByType = {};
  const baselinedByInconclusiveCategory = {};
  const auditSignalsByType = {};
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

      // Phase 8: coarse signals are tracked on a separate audit channel
      // regardless of their ack/baseline state. They never count toward
      // the reportable counters that drive the gate.
      if (isCoarseAuditSignal(issue)) {
        auditSignalIssues += 1;
        auditSignalsByType[issue.type] = (auditSignalsByType[issue.type] || 0) + 1;
        hasAuditSignal = true;
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
    // Phase 8 — see header comment
    reportableActiveFiles,
    reportableActiveActionableFiles,
    auditSignalIssues,
    auditSignalFiles,
    auditSignalsByType,
  };
}
