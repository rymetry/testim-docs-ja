/**
 * Page Coverage Gate — detects page-level completeness issues.
 *
 * Pure functions only. No filesystem I/O.
 * Consumes sidebar slugs, local file slugs, snapshot existence,
 * and source freshness state from Phase 1's source-sync-status.json.
 *
 * @module source_parity_page_coverage
 */

import { ISSUE_SEVERITY } from './source_parity_types.mjs';

function withSeverity(issue) {
  return {
    ...issue,
    severity: ISSUE_SEVERITY[issue.type] ?? 'signal',
  };
}

/**
 * Detect EN pages in sidebar that have no local JA file.
 *
 * @param {Set<string>} sidebarSlugs — slugs from EN sidebar snapshot
 * @param {Set<string>} localSlugs — slugs from local JA doc files
 * @returns {Array<{type: string, detail: string, severity: string}>}
 */
export function checkSourcePageMissingLocal(sidebarSlugs, localSlugs) {
  const issues = [];
  for (const slug of sidebarSlugs) {
    if (!localSlugs.has(slug)) {
      issues.push(
        withSeverity({
          type: 'source-page-missing-local',
          detail: `EN ソースページがローカルに存在しない: ${slug}`,
        }),
      );
    }
  }
  return issues;
}
