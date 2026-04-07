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
 * Detect local JA pages that are NOT listed in the EN sidebar (orphans).
 * The local file exists but the EN side has either removed or never had
 * an entry for it — translation work that the EN sidebar does not cover.
 *
 * @param {Set<string>} localSlugs — slugs from local JA doc files
 * @param {Set<string>} sidebarSlugs — slugs from EN sidebar snapshot
 * @returns {Array<{type: string, detail: string, severity: string}>}
 */
export function checkLocalPageOrphan(localSlugs, sidebarSlugs) {
  const issues = [];
  if (!sidebarSlugs || sidebarSlugs.size === 0) return issues;
  for (const slug of localSlugs) {
    if (!sidebarSlugs.has(slug)) {
      issues.push(
        withSeverity({
          type: 'local-page-orphan',
          detail: `ローカルファイルが SIDEBAR_URLS.md に未掲載: ${slug}`,
        }),
      );
    }
  }
  return issues;
}

/**
 * Detect JA pages with sourceUrl but no EN snapshot (bulk check).
 * Emits one of two distinct issue types so ISSUE_SEVERITY is canonical:
 *   - "missing-fresh-snapshot" (actionable) when freshnessState === "fresh"
 *   - "missing-snapshot" (signal) otherwise
 *
 * @param {Map<string, string>} localSourceUrls — slug → sourceUrl for JA files
 * @param {Set<string>} snapshotSlugs — slugs with existing EN snapshot files
 * @param {string | null} freshnessState — from source-sync-status.json
 * @returns {Array<{type: string, detail: string, severity: string}>}
 */
export function checkMissingSnapshot(localSourceUrls, snapshotSlugs, freshnessState) {
  const issues = [];
  const isFresh = freshnessState === 'fresh';
  for (const [slug] of localSourceUrls) {
    if (snapshotSlugs.has(slug)) continue;
    issues.push(
      withSeverity({
        type: isFresh ? 'missing-fresh-snapshot' : 'missing-snapshot',
        detail: `sourceUrl があるが EN スナップショットが存在しない: ${slug}`,
      }),
    );
  }
  return issues;
}

/**
 * Per-file snapshot-missing check (for --slug single-page mode).
 *
 * @param {string} slug
 * @param {string} sourceUrl
 * @param {Set<string>} snapshotSlugs
 * @param {string | null} freshnessState
 * @returns {Array<{type: string, detail: string, severity: string}>}
 */
export function checkSinglePageSnapshot(slug, sourceUrl, snapshotSlugs, freshnessState) {
  if (!sourceUrl) return [];
  if (snapshotSlugs.has(slug)) return [];
  const isFresh = freshnessState === 'fresh';
  return [
    withSeverity({
      type: isFresh ? 'missing-fresh-snapshot' : 'missing-snapshot',
      detail: `sourceUrl があるが EN スナップショットが存在しない: ${slug}`,
    }),
  ];
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
    ...checkLocalPageOrphan(localSlugs, sidebarSlugs),
    ...checkMissingSnapshot(localSourceUrls, snapshotSlugs, freshnessState),
  ];
}
