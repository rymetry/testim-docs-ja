/**
 * Aggregates per-file parity results into type/severity/acknowledgement
 * summary statistics.
 *
 * Phase 5 shadow issues (`issue.phase === 'segment-shadow'`) are counted
 * separately into `shadowIssues` / `shadowFiles` / `shadowIssuesByType`
 * and are NOT folded into the actionable / signal / activeFiles totals
 * that the runtime gate exit code reads. This is what lets Phase 5 wire
 * `alignSegments` into the runtime end-to-end without immediately
 * flipping ~241 baseline-drifted pages from green to red. Phase 6A PR2
 * will promote shadow issues into the primary gate.
 *
 * Phase 6A PR1 adds baseline accounting (`baselinedIssues`, `baselinedFiles`,
 * `baselinedByType`, `baselinedByInconclusiveCategory`) — counted regardless
 * of shadow phase so the same fields work both before and after PR2 cutover.
 * baseline-tagged issues are also excluded from active counts so PR2 can
 * flip the gate by simply removing the shadow phase tag.
 */
export function summarizeParityResults(results) {
  const issuesByType = {};
  const issuesBySeverity = {};
  const shadowIssuesByType = {};
  const baselinedByType = {};
  const baselinedByInconclusiveCategory = {};
  let actionableFiles = 0;
  let signalFiles = 0;
  let errorFiles = 0;
  let activeActionableFiles = 0;
  let activeErrorFiles = 0;
  let activeFiles = 0;
  let totalIssues = 0;
  let acknowledgedIssues = 0;
  let expiredAcknowledgements = 0;
  let shadowIssues = 0;
  let shadowFiles = 0;
  let baselinedIssues = 0;
  let baselinedFiles = 0;

  for (const result of results) {
    let hasActionable = false;
    let hasSignal = false;
    let hasError = false;
    let hasActiveActionable = false;
    let hasActiveError = false;
    let hasActiveIssue = false;
    let hasShadow = false;
    let hasBaselined = false;

    for (const issue of result.issues) {
      const isShadow = issue.phase === 'segment-shadow';
      const isBaselined = issue.baselined === true;

      if (isBaselined) {
        baselinedIssues += 1;
        baselinedByType[issue.type] = (baselinedByType[issue.type] || 0) + 1;
        if (
          issue.type === 'segment-inconclusive' &&
          typeof issue.inconclusiveCategory === 'string'
        ) {
          baselinedByInconclusiveCategory[issue.inconclusiveCategory] =
            (baselinedByInconclusiveCategory[issue.inconclusiveCategory] || 0) + 1;
        }
        hasBaselined = true;
      }

      if (isShadow) {
        shadowIssues += 1;
        shadowIssuesByType[issue.type] = (shadowIssuesByType[issue.type] || 0) + 1;
        hasShadow = true;
        // Shadow issues bypass actionable/signal/active accounting so the
        // runtime exit code stays unchanged until Phase 6A PR2 cutover.
        continue;
      }

      totalIssues += 1;
      issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
      issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;

      const isValidAck = issue.acknowledged === true && issue.ackExpired !== true;

      if (isValidAck) {
        acknowledgedIssues += 1;
      } else if (!isBaselined) {
        hasActiveIssue = true;
      }

      if (issue.acknowledged === true && issue.ackExpired === true) {
        expiredAcknowledgements += 1;
      }

      if (issue.severity === 'actionable') {
        hasActionable = true;
        if (!isValidAck && !isBaselined) hasActiveActionable = true;
      }
      if (issue.severity === 'signal') hasSignal = true;
      if (issue.severity === 'error') {
        hasError = true;
        if (!isValidAck && !isBaselined) hasActiveError = true;
      }
    }

    if (hasActionable) actionableFiles += 1;
    else if (hasError) errorFiles += 1;
    else if (hasSignal) signalFiles += 1;

    if (hasActiveActionable) activeActionableFiles += 1;
    if (hasActiveError) activeErrorFiles += 1;
    if (hasActiveIssue) activeFiles += 1;
    if (hasShadow) shadowFiles += 1;
    if (hasBaselined) baselinedFiles += 1;
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
    shadowIssues,
    shadowFiles,
    shadowIssuesByType,
    baselinedIssues,
    baselinedFiles,
    baselinedByType,
    baselinedByInconclusiveCategory,
  };
}
