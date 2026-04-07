/**
 * Shared issue-state predicates used by the gate, summaries, and reporting.
 * Keeping them in one place prevents subtle drift between CLI output,
 * parityRegression filtering, and summary accounting.
 */

import { COARSE_SIGNAL_TYPES } from './source_parity_types.mjs';

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
 * Phase 8: classifies whether an issue is one of the demoted "coarse" audit
 * signals (count / shape / table-cell heuristics). The check is type-only —
 * severity, acknowledgement state, and baseline state are all ignored, so
 * even an expired-ack or expired-baseline coarse signal is still considered
 * a coarse signal and never re-lights `parityRegression` or the gate.
 *
 * See: docs/superpowers/specs/2026-04-07-issue-225-phase-8-design.md §3.3
 */
export function isCoarseAuditSignal(issue) {
  if (!issue || typeof issue !== 'object') return false;
  if (typeof issue.type !== 'string') return false;
  return COARSE_SIGNAL_TYPES.has(issue.type);
}

export function isReportableParityIssue(issue) {
  if (issue.severity !== 'actionable' && issue.severity !== 'signal') return false;
  if (isFrozenByBaseline(issue)) return false;
  return isActiveParityIssue(issue);
}

export function isNonBlockingParityIssue(issue) {
  return isFrozenByBaseline(issue) || isValidAcknowledgedIssue(issue);
}
