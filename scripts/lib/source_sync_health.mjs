/**
 * Source Sync Health — builds source-sync-status.json from fetch results.
 *
 * Pure functions only. No filesystem I/O.
 * @module source_sync_health
 */

import { createHash } from 'node:crypto';

export const SOURCE_SYNC_STATUS_SCHEMA_VERSION = 1;

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
 * Note: `stale` is also a valid freshness state but is computed from
 * RUN LINKAGE rather than fetch results — see `validateRunLinkage`.
 * `buildSourceSyncStatus` never returns `stale` directly because it
 * doesn't know about snapshot_diff or downstream artifacts. The §3
 * cleanup decides `stale` in `check_source_parity` after both
 * artifacts are loaded.
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
 * Validate that the three live-source artifacts (source-sync-status,
 * snapshot-diff-status, and the parity gate's own scope) all describe
 * the same logical run. Returns one of:
 *
 *   "linked"      — sourceSync.runId matches snapshotDiff.sourceSyncRunId,
 *                   source inventory fingerprint matches, and all run scopes match
 *   "missing"     — one of the required linkage fields is missing
 *   "stale"       — fingerprints disagree (inventory drifted between runs)
 *   "run-mismatch" — snapshot_diff was built from a different source-sync run
 *   "scope-mismatch" — full parity run paired with partial snapshot_diff
 *                     (or any differing sourceSync / snapshotDiff / parity scope)
 *
 * Callers (check_source_parity) demote `parity-check-status.json.summary.result`
 * to `inconclusive` for any value other than `linked`, even when there
 * are no parity issues.
 *
 * @param {object} sourceSync — parsed source-sync-status.json
 * @param {object|null} snapshotDiff — parsed snapshot-diff-status.json
 * @param {{type: string, isComplete: boolean}} parityRunScope
 * @returns {"linked" | "missing" | "stale" | "run-mismatch" | "scope-mismatch"}
 */
export function validateRunLinkage(sourceSync, snapshotDiff, parityRunScope) {
  // No source-sync info → cannot prove linkage. Treat as "missing"; the
  // caller can downgrade to inconclusive based on its own policy.
  if (
    !sourceSync ||
    typeof sourceSync.sourceInventoryFingerprint !== 'string' ||
    typeof sourceSync.runId !== 'string' ||
    !sourceSync.runScope ||
    typeof sourceSync.runScope !== 'object'
  ) {
    return 'missing';
  }
  if (!snapshotDiff || typeof snapshotDiff !== 'object') {
    return 'missing';
  }
  if (
    typeof snapshotDiff.sourceInventoryFingerprint !== 'string' ||
    typeof snapshotDiff.sourceSyncRunId !== 'string' ||
    !snapshotDiff.runScope ||
    typeof snapshotDiff.runScope !== 'object'
  ) {
    return 'missing';
  }

  if (sourceSync.sourceInventoryFingerprint !== snapshotDiff.sourceInventoryFingerprint) {
    return 'stale';
  }

  if (sourceSync.runId !== snapshotDiff.sourceSyncRunId) {
    return 'run-mismatch';
  }

  const sameScope = (left, right) =>
    left?.type === right?.type &&
    left?.isComplete === right?.isComplete &&
    (left?.filters?.slug ?? null) === (right?.filters?.slug ?? null) &&
    (left?.filters?.section ?? null) === (right?.filters?.section ?? null);

  if (!sameScope(sourceSync.runScope, snapshotDiff.runScope)) {
    return 'scope-mismatch';
  }

  if (parityRunScope && !sameScope(sourceSync.runScope, parityRunScope)) {
    return 'scope-mismatch';
  }

  return 'linked';
}

/**
 * Build the full source-sync-status.json payload.
 *
 * @param {object} opts
 * @param {{ slug: string, fetchStatus: string, errorDetail?: string, snapshotFingerprint?: string }[]} opts.pages
 * @param {{ ok: boolean, sectionCount?: number, pageCount?: number, reason?: string, sidebarSlugs?: string[] }} opts.sidebarResult
 * @param {{ type: string, isComplete: boolean, filters: { slug: string|null, section: string|null } }} opts.runScope
 * @param {Date} [opts.now]  — override for deterministic tests
 * @param {string} [opts.runSeed] — override for deterministic runId in tests
 * @returns {object}
 */
export function buildSourceSyncStatus({ pages, sidebarResult, runScope, now, runSeed }) {
  const checkedAt = (now ?? new Date()).toISOString();
  const shortHash = runSeed
    ? createHash('sha256').update(runSeed).digest('hex').slice(0, 8)
    : createHash('sha256').update(checkedAt + Math.random()).digest('hex').slice(0, 8);
  const runId = `${checkedAt}#${shortHash}`;

  const slugs = pages.map((p) => p.slug);
  const sourceInventoryFingerprint = fingerprint(slugs);

  const sidebarFingerprint = sidebarResult.ok && sidebarResult.sidebarSlugs
    ? fingerprint(sidebarResult.sidebarSlugs)
    : fingerprint([`${sidebarResult.sectionCount ?? 0}:${sidebarResult.pageCount ?? 0}`]);

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
    schemaVersion: SOURCE_SYNC_STATUS_SCHEMA_VERSION,
    runId,
    checkedAt,
    sourceInventoryFingerprint,
    sidebarFingerprint,
    freshnessState,
    runScope,
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
