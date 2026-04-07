/**
 * Shared issue-state predicates used by the gate, summaries, and reporting.
 * Keeping them in one place prevents subtle drift between CLI output,
 * parityRegression filtering, and summary accounting.
 */

export function isValidAcknowledgedIssue(issue) {
  return issue.acknowledged === true && issue.ackExpired !== true;
}

export function isFrozenByBaseline(issue) {
  return issue.baselined === true && issue.baselineExpired !== true;
}

export function isActiveParityIssue(issue) {
  return !isValidAcknowledgedIssue(issue);
}

export function isReportableParityIssue(issue) {
  if (issue.severity !== 'actionable' && issue.severity !== 'signal') return false;
  if (isFrozenByBaseline(issue)) return false;
  return isActiveParityIssue(issue);
}

export function isNonBlockingParityIssue(issue) {
  return isFrozenByBaseline(issue) || isValidAcknowledgedIssue(issue);
}
