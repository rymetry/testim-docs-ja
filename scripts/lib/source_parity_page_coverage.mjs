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

/**
 * Detect JA pages with sourceUrl but no EN snapshot.
 * Severity depends on source freshness:
 *   - "fresh" → actionable (source was fully fetched, snapshot should exist)
 *   - "partial" / "broken" / null → signal (can't confirm freshness)
 *
 * @param {Map<string, string>} localSourceUrls — slug → sourceUrl for JA files
 * @param {Set<string>} snapshotSlugs — slugs with existing EN snapshot files
 * @param {string | null} freshnessState — from source-sync-status.json
 * @returns {Array<{type: string, detail: string, severity: string}>}
 */
export function checkMissingFreshSnapshot(localSourceUrls, snapshotSlugs, freshnessState) {
  const issues = [];
  const isFresh = freshnessState === 'fresh';
  for (const [slug] of localSourceUrls) {
    if (snapshotSlugs.has(slug)) continue;
    issues.push({
      type: 'missing-fresh-snapshot',
      detail: `sourceUrl があるが${isFresh ? ' fresh' : ''} EN スナップショットが存在しない: ${slug}`,
      severity: isFresh ? 'actionable' : 'signal',
    });
  }
  return issues;
}

/**
 * Run all page coverage gate checks.
 *
 * @param {object} opts
 * @param {Set<string>} opts.sidebarSlugs — slugs from EN sidebar
 * @param {Set<string>} opts.localSlugs — slugs from local JA files
 * @param {Map<string, string>} opts.localSourceUrls — slug → sourceUrl
 * @param {Set<string>} opts.snapshotSlugs — slugs with existing snapshots
 * @param {string | null} opts.freshnessState — from source-sync-status.json
 * @returns {Array<{type: string, detail: string, severity: string}>}
 */
export function checkPageCoverage({
  sidebarSlugs,
  localSlugs,
  localSourceUrls,
  snapshotSlugs,
  freshnessState,
}) {
  return [
    ...checkSourcePageMissingLocal(sidebarSlugs, localSlugs),
    ...checkMissingFreshSnapshot(localSourceUrls, snapshotSlugs, freshnessState),
  ];
}
