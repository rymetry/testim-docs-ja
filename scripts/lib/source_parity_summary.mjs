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
 * The `shadowIssues` / `shadowFiles` / `shadowIssuesByType` fields are
 * retained as dual-emit zero values for backward compatibility through
 * Phase 7 (reporting 4-family refactor). At that point the shadow
 * accounting branch and these fields will be removed together with
 * `detection_reports.mjs` being rewritten. Callers that programmatically
 * set `issue.phase = 'segment-shadow'` for historical reasons are still
 * handled correctly (counted as shadow, excluded from active).
 *
 * Baseline accounting (`baselinedIssues` / `baselinedFiles` /
 * `baselinedByType` / `baselinedByInconclusiveCategory` /
 * `expiredBaselineEntries`) is the primary mechanism for excluding
 * known drift from the gate exit code.
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
  let expiredBaselineEntries = 0;

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

      if (isShadow) {
        // Phase 6A cutover: segment-* issues no longer carry
        // `phase: 'segment-shadow'`, so this branch is dead under normal
        // operation. It is retained as a compatibility shim in case a
        // caller programmatically constructs shadow-tagged issues (e.g.
        // legacy tests or manual fixtures). Shadow-tagged issues still
        // bypass active accounting. Phase 7 reporting refactor will
        // remove this branch along with the dual-emit fields below.
        shadowIssues += 1;
        shadowIssuesByType[issue.type] = (shadowIssuesByType[issue.type] || 0) + 1;
        hasShadow = true;
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
    expiredBaselineEntries,
  };
}
