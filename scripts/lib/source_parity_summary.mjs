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
 * Phase 6A cutover (2026-04-06): `parityDiffsToIssues` no longer tags
 * segment-* issues with `phase: 'segment-shadow'`. segment-* issues now
 * flow through the primary actionable/active accounting. Pre-cutover
 * drift is frozen by `parity-baseline.json` and excluded from active
 * counts via `isBaselined`.
 *
 * Phase 7 (reporting 4-family refactor): the shadow accounting branch and
 * the `shadowIssues` / `shadowFiles` / `shadowIssuesByType` dual-emit fields
 * have been removed. Baseline accounting (`baselinedIssues` / `baselinedFiles`
 * / `baselinedByType` / `baselinedByInconclusiveCategory` /
 * `expiredBaselineEntries`) is the primary mechanism for excluding known drift
 * from the gate exit code.
 *
 * Phase 8 (audit demotion): adds `reportableActive*` and `auditSignal*`
 * counters in PARALLEL to the existing `activeFiles` / `activeActionableFiles`
 * counters. The legacy counters keep their pre-Phase-8 semantics so that
 * downstream consumers and tests are not silently rerouted; only the gate
 * exit code (`check_source_parity.mjs`) and `parityRegression` filtering
 * (`detection_reports.mjs`) switch to the new counters in later commits.
 *
 * The contract for the new counters:
 *
 *   reportableActiveFiles            = files with at least one
 *                                       isReportableParityIssue()-true issue
 *   reportableActiveActionableFiles  = same, restricted to severity=actionable
 *   auditSignalIssues                = total coarse signal issue count
 *   auditSignalFiles                 = files with at least one coarse signal
 *   auditSignalsByType               = coarse signal counts grouped by type
 *
 * Coarse signals are NEVER counted as reportable, even when their
 * acknowledgement or baseline has expired (so the gate cannot re-light on
 * them).
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
    // Phase 8 — see header comment
    reportableActiveFiles,
    reportableActiveActionableFiles,
    auditSignalIssues,
    auditSignalFiles,
    auditSignalsByType,
  };
}
