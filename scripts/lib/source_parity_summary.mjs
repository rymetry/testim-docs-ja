/** Aggregates per-file parity results into type/severity/acknowledgement summary statistics. */
export function summarizeParityResults(results) {
  const issuesByType = {};
  const issuesBySeverity = {};
  let actionableFiles = 0;
  let signalFiles = 0;
  let errorFiles = 0;
  let activeActionableFiles = 0;
  let activeErrorFiles = 0;
  let activeFiles = 0;
  let totalIssues = 0;
  let acknowledgedIssues = 0;
  let expiredAcknowledgements = 0;

  for (const result of results) {
    let hasActionable = false;
    let hasSignal = false;
    let hasError = false;
    let hasActiveActionable = false;
    let hasActiveError = false;
    let hasActiveIssue = false;

    for (const issue of result.issues) {
      totalIssues += 1;
      issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
      issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;

      const isValidAck = issue.acknowledged === true && issue.ackExpired !== true;

      if (isValidAck) {
        acknowledgedIssues += 1;
      } else {
        hasActiveIssue = true;
      }

      if (issue.acknowledged === true && issue.ackExpired === true) {
        expiredAcknowledgements += 1;
      }

      if (issue.severity === 'actionable') {
        hasActionable = true;
        if (!isValidAck) hasActiveActionable = true;
      }
      if (issue.severity === 'signal') hasSignal = true;
      if (issue.severity === 'error') {
        hasError = true;
        if (!isValidAck) hasActiveError = true;
      }
    }

    if (hasActionable) actionableFiles += 1;
    else if (hasError) errorFiles += 1;
    else if (hasSignal) signalFiles += 1;

    if (hasActiveActionable) activeActionableFiles += 1;
    if (hasActiveError) activeErrorFiles += 1;
    if (hasActiveIssue) activeFiles += 1;
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
  };
}
