/**
 * Source Sync Health — builds source-sync-status.json from fetch results.
 *
 * Pure functions only. No filesystem I/O.
 * @module source_sync_health
 */

import { createHash } from 'node:crypto';

/**
 * SHA-256 fingerprint of a sorted array of strings.
 * @param {string[]} items
 * @returns {string} "sha256:<hex>"
 */
export function fingerprint(items) {
  const sorted = [...items].sort();
  const hash = createHash('sha256').update(sorted.join('\n')).digest('hex');
  return `sha256:${hash}`;
}

/**
 * Compute freshness state from per-page fetch results.
 *
 * - "fresh"   — all pages fetched ok, sidebar verified
 * - "partial" — some pages failed/404 but at least one ok, sidebar verified
 * - "broken"  — sidebar failed, no pages, or all pages failed
 *
 * @param {{ slug: string, fetchStatus: string }[]} pages
 * @param {boolean} sidebarVerified
 * @returns {"fresh" | "partial" | "broken"}
 */
export function computeFreshnessState(pages, sidebarVerified) {
  if (!sidebarVerified) return 'broken';
  if (pages.length === 0) return 'broken';

  const okCount = pages.filter((p) => p.fetchStatus === 'ok').length;
  if (okCount === 0) return 'broken';
  if (okCount === pages.length) return 'fresh';
  return 'partial';
}

/**
 * Build the full source-sync-status.json payload.
 *
 * @param {object} opts
 * @param {{ slug: string, fetchStatus: string, errorDetail?: string, snapshotFingerprint?: string }[]} opts.pages
 * @param {{ ok: boolean, sectionCount?: number, pageCount?: number, reason?: string }} opts.sidebarResult
 * @param {Date} [opts.now]  — override for deterministic tests
 * @param {string} [opts.runSeed] — override for deterministic runId in tests
 * @returns {object}
 */
export function buildSourceSyncStatus({ pages, sidebarResult, now, runSeed }) {
  const checkedAt = (now ?? new Date()).toISOString();
  const shortHash = runSeed
    ? createHash('sha256').update(runSeed).digest('hex').slice(0, 8)
    : createHash('sha256').update(checkedAt + Math.random()).digest('hex').slice(0, 8);
  const runId = `${checkedAt}#${shortHash}`;

  const slugs = pages.map((p) => p.slug);
  const sourceInventoryFingerprint = fingerprint(slugs);

  const sidebarKey = sidebarResult.ok
    ? `${sidebarResult.sectionCount}:${sidebarResult.pageCount}`
    : 'failed';
  const sidebarFingerprint = fingerprint([sidebarKey]);

  const okCount = pages.filter((p) => p.fetchStatus === 'ok').length;
  const notFoundCount = pages.filter((p) => p.fetchStatus === 'not-found').length;
  const errorCount = pages.filter((p) => p.fetchStatus === 'error').length;

  const freshnessState = computeFreshnessState(pages, sidebarResult.ok);

  const errors = [];
  for (const p of pages) {
    if (p.fetchStatus === 'error' && p.errorDetail) {
      errors.push({ slug: p.slug, detail: p.errorDetail });
    }
  }
  if (!sidebarResult.ok) {
    errors.push({
      slug: '_sidebar',
      detail: `Sidebar verification failed: ${sidebarResult.reason || 'unknown'}`,
    });
  }

  return {
    schemaVersion: 1,
    runId,
    checkedAt,
    sourceInventoryFingerprint,
    sidebarFingerprint,
    freshnessState,
    summary: {
      targetPages: pages.length,
      fetchedPages: okCount,
      notFoundPages: notFoundCount,
      errorPages: errorCount,
      sidebarVerified: sidebarResult.ok,
    },
    pages: pages.map((p) => ({
      slug: p.slug,
      fetchStatus: p.fetchStatus,
      ...(p.snapshotFingerprint ? { snapshotFingerprint: p.snapshotFingerprint } : {}),
    })),
    errors,
  };
}
