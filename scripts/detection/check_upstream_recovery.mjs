#!/usr/bin/env node
// scripts/check_upstream_recovery.mjs
/**
 * Upstream recovery detection — standalone aggregator (Phase A).
 *
 * 既存 signals を読み取り、`upstream-recovery-status.json` を派生する:
 *   - `EN_SOURCE_PATCHES` + `preprocessEnHtml(patchCoverage)` → per-patch Axis A status
 *   - `source-sync-status.json.pages[].fetchStatus` → per-exclusion Axis A status
 *   - 各 entry の `reviewAfter` との cadence 比較 → per-entry Axis B status
 *
 * Non-blocking: process.exit(0) unconditionally. consumers (sticky PR comment /
 * detection_reports / sourceSyncHealth managed issue) が JSON を読んで判断する。
 *
 * Architecture invariants:
 *   - `check_source_parity.mjs` / `scripts/lib/parity_*.mjs` には触らない
 *     (parity gate の挙動を変更しない — baseline=0 regression 禁止)
 *   - 新 detector / issue type / workflow は追加しない (既存 infra の拡張のみ)
 *
 * Plan: docs/SYSTEM_SPEC.md §システム不変量
 * Spec: docs/SYSTEM_SPEC.md §システム不変量
 *
 * @module check_upstream_recovery
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ROOT_DIR } from '../lib/project.mjs';
import {
  EN_SOURCE_PATCHES,
  createEnSourcePatchCoverage,
} from '../lib/en_source_patches.mjs';
import { SOURCE_SYNC_EXCLUSIONS } from '../lib/source_sync_exclusions.mjs';
import { preprocessEnHtml } from '../lib/turndown.mjs';

const SNAPSHOTS_ROOT = path.join(ROOT_DIR, 'snapshots', 'en', 'content');
const SOURCE_SYNC_STATUS_PATH = path.join(ROOT_DIR, 'source-sync-status.json');
const OUTPUT_PATH = path.join(ROOT_DIR, 'upstream-recovery-status.json');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Days between `dateStr` (YYYY-MM-DD) and `now`.
 *
 * - Positive when `dateStr` is in the past (overdue).
 * - `0` on the same UTC day.
 * - Negative when `dateStr` is in the future (not yet due).
 * - `0` for invalid / missing dates (fail-safe — callers use `> 0` to mean overdue).
 *
 * `new Date('YYYY-MM-DD')` is parsed as UTC midnight per ES2015+, so the result
 * is timezone-independent.
 *
 * @param {string | null | undefined} dateStr
 * @param {number} nowMs
 */
export function daysSince(dateStr, nowMs = Date.now()) {
  if (typeof dateStr !== 'string' || dateStr.length === 0) return 0;
  const parsed = new Date(dateStr).getTime();
  if (!Number.isFinite(parsed)) return 0;
  return Math.floor((nowMs - parsed) / MS_PER_DAY);
}

/**
 * Days between `now` and `dateStr`. Positive when dateStr is in the future.
 * Mirror of `daysSince` for the opposite sign — used to show "days until review".
 *
 * @param {string | null | undefined} dateStr
 * @param {number} nowMs
 */
export function daysUntil(dateStr, nowMs = Date.now()) {
  if (typeof dateStr !== 'string' || dateStr.length === 0) return null;
  const parsed = new Date(dateStr).getTime();
  if (!Number.isFinite(parsed)) return null;
  return Math.floor((parsed - nowMs) / MS_PER_DAY);
}

/**
 * Overdue predicate with same-day semantics aligned to
 * `scripts/check_patch_review_cadence.mjs::evaluatePatchReview` (Codex C1):
 *
 *   - `reviewAfter` is a YYYY-MM-DD string, parsed as UTC midnight by
 *     `new Date(...)` per ES2015+.
 *   - Overdue when `nowMs > reviewAfterMs` **strictly** — the review day
 *     itself (nowMs === reviewAfterMs) is *not* overdue (inclusive boundary).
 *   - Invalid / missing dates fail-safe to `false`.
 *
 * Using this helper instead of `daysSince(...) > 0` keeps both detectors
 * aligned even when nowMs lands partway through the review day (e.g. 12:00
 * UTC on reviewAfter — cadence would flag overdue, the old daysSince check
 * would not).
 *
 * @param {string | null | undefined} dateStr
 * @param {number} nowMs
 * @returns {boolean}
 */
export function isReviewOverdue(dateStr, nowMs = Date.now()) {
  if (typeof dateStr !== 'string' || dateStr.length === 0) return false;
  const parsed = new Date(dateStr).getTime();
  if (!Number.isFinite(parsed)) return false;
  return nowMs > parsed;
}

/**
 * Load existing source-sync-status.json (if present). Absent file is a legitimate
 * local-development state and must degrade gracefully — callers treat missing
 * data as `fetchStatus: 'unknown'`.
 *
 * @returns {{ pages: Array<{ slug: string, fetchStatus?: string }> } | null}
 */
function loadSourceSyncStatus(filePath = SOURCE_SYNC_STATUS_PATH) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.warn(
      `[upstream-recovery] failed to parse ${path.basename(filePath)}: ${err.message}`,
    );
    return null;
  }
}

/**
 * Collect unique slugs across all patches (slug-driven loop per plan Task 2).
 * `preprocessEnHtml` applies every applicable patch for the given slug in a
 * single pass, so iterating slugs (not patches) avoids duplicate work.
 */
function uniquePatchSlugs(patches = EN_SOURCE_PATCHES) {
  const set = new Set();
  for (const patch of patches) {
    for (const slug of patch.slugs) set.add(slug);
  }
  return set;
}

/**
 * Axis A — EN upstream 修正検知 (en_patches).
 *
 * Returns per-patch rows with `statusA` (active/stale/unknown), `statusB`
 * (current/overdue), hits count, and cadence metadata.
 *
 * **Note on the `patches` parameter (Codex C2):** this argument is used only
 * for the outer enumeration loop (slug collection + result shaping). The
 * actual hit detection happens inside `preprocessEnHtml`, which reads the
 * *live* `EN_SOURCE_PATCHES` constant — not the injected `patches`. Unit
 * tests therefore inject synthetic patches to exercise stale / unknown
 * branches only; the `active` branch requires real registered slugs and is
 * covered by `en_source_patches_integration.test.mjs`. Production callers
 * should omit `patches` to use the default (live registry) and stay
 * consistent with the hit-detection layer.
 *
 * @param {number} nowMs
 * @param {string} snapshotsRoot
 * @param {ReadonlyArray<object>} [patches] — override the enumeration list
 *   (tests only; does NOT change hit detection — see note above)
 */
export function computeEnPatchStatus({
  nowMs = Date.now(),
  snapshotsRoot = SNAPSHOTS_ROOT,
  patches = EN_SOURCE_PATCHES,
} = {}) {
  const coverage = createEnSourcePatchCoverage();
  const slugs = uniquePatchSlugs(patches);
  const snapshotSeen = new Set();
  for (const slug of slugs) {
    const snapshotPath = path.join(snapshotsRoot, `${slug}.html`);
    if (!existsSync(snapshotPath)) continue;
    const raw = readFileSync(snapshotPath, 'utf8');
    try {
      preprocessEnHtml(raw, { slug, patchCoverage: coverage });
      snapshotSeen.add(slug);
    } catch (err) {
      console.warn(
        `[upstream-recovery] preprocessEnHtml failed for slug=${slug}: ${err.message}`,
      );
    }
  }
  const snap = coverage.snapshot();
  return patches.map((patch) => {
    const status = snap.byPatchIdStatus[patch.id] ?? { matched: false, hits: 0 };
    // A patch is considered `unknown` when NONE of its registered slugs had a
    // readable snapshot in this run (can't tell stale vs active). Otherwise
    // matched=true → active, matched=false → stale (upstream likely fixed).
    const anySnapshotSeen = patch.slugs.some((s) => snapshotSeen.has(s));
    let statusA;
    if (!anySnapshotSeen) {
      statusA = 'unknown';
    } else {
      statusA = status.matched ? 'active' : 'stale';
    }
    // Use isReviewOverdue (not daysSince(...) > 0) so same-day semantics
    // match check_patch_review_cadence.mjs (Codex C1).
    const statusB = isReviewOverdue(patch.reviewAfter, nowMs) ? 'overdue' : 'current';
    return {
      id: patch.id,
      mechanism: 'en_source_patches',
      slugs: [...patch.slugs],
      statusA,
      statusB,
      hits: status.hits,
      addedAt: patch.addedAt ?? null,
      reviewAfter: patch.reviewAfter ?? null,
      daysUntilReview: daysUntil(patch.reviewAfter, nowMs),
    };
  });
}

/**
 * Axis A — EN upstream 修正検知 (sync_exclusions).
 *
 * Reads existing `fetchStatus` signal from `source-sync-status.json`. Missing
 * file / missing entry degrades to `unknown` (local dev / PR CI without the
 * artifact). `excluded-recovered` → stale, `excluded-broken` → active.
 *
 * @param {number} nowMs
 */
export function computeSyncExclusionStatus({
  nowMs = Date.now(),
  exclusions = SOURCE_SYNC_EXCLUSIONS,
  // NOTE: the I/O-bearing default `loadSourceSyncStatus()` is evaluated once
  // per call-without-argument. All tests inject `sourceSyncStatus` directly
  // (no fs touches from unit tests); the default is reached only from the
  // CLI path (buildUpstreamRecoveryStatus → computeSyncExclusionStatus).
  sourceSyncStatus = loadSourceSyncStatus(),
} = {}) {
  const pages = Array.isArray(sourceSyncStatus?.pages) ? sourceSyncStatus.pages : [];
  const pageBySlug = new Map();
  for (const page of pages) {
    if (typeof page?.slug === 'string') pageBySlug.set(page.slug, page);
  }
  return Object.entries(exclusions).map(([slug, entry]) => {
    const page = pageBySlug.get(slug);
    const fetchStatus = page?.fetchStatus ?? 'unknown';
    let statusA;
    if (fetchStatus === 'excluded-recovered') {
      statusA = 'stale';
    } else if (fetchStatus === 'excluded-broken') {
      statusA = 'active';
    } else {
      statusA = 'unknown';
    }
    // isReviewOverdue matches check_patch_review_cadence.mjs same-day semantics
    // (Codex C1). Missing reviewAfter is treated as not-overdue (fail-safe).
    const statusB = isReviewOverdue(entry.reviewAfter, nowMs) ? 'overdue' : 'current';
    return {
      slug,
      mechanism: 'source_sync_exclusions',
      statusA,
      statusB,
      fetchStatus,
      addedAt: entry.addedAt ?? null,
      reviewAfter: entry.reviewAfter ?? null,
      daysUntilReview: entry.reviewAfter ? daysUntil(entry.reviewAfter, nowMs) : null,
    };
  });
}

/**
 * Build the full `upstream-recovery-status.json` payload in memory. Caller is
 * responsible for persistence. Exported for unit tests and downstream tools
 * (detection_reports, sticky PR comment in Phase B).
 *
 * @param {object} [options]
 */
export function buildUpstreamRecoveryStatus(options = {}) {
  const nowMs = options.nowMs ?? Date.now();
  const enPatches = computeEnPatchStatus({ ...options, nowMs });
  const syncExclusions = computeSyncExclusionStatus({ ...options, nowMs });
  const allEntries = [...enPatches, ...syncExclusions];
  const staleCount = allEntries.filter((e) => e.statusA === 'stale').length;
  const overdueCount = allEntries.filter((e) => e.statusB === 'overdue').length;
  const unknownCount = allEntries.filter((e) => e.statusA === 'unknown').length;
  const totalEntries = allEntries.length;
  const activeEntries = totalEntries - staleCount - unknownCount;
  return {
    schemaVersion: 1,
    generatedAt: new Date(nowMs).toISOString(),
    summary: {
      totalEntries,
      activeEntries,
      staleEntries: staleCount, // Axis A signal
      overdueEntries: overdueCount, // Axis B signal
      unknownEntries: unknownCount,
    },
    mechanisms: {
      en_source_patches: enPatches,
      source_sync_exclusions: syncExclusions,
    },
  };
}

export function runCheckUpstreamRecovery({
  outputPath = OUTPUT_PATH,
  stdout = console.log,
  ...options
} = {}) {
  const payload = buildUpstreamRecoveryStatus(options);
  writeFileSync(outputPath, JSON.stringify(payload, null, 2) + '\n');
  stdout(
    `[upstream-recovery] total=${payload.summary.totalEntries} ` +
      `active=${payload.summary.activeEntries} ` +
      `stale=${payload.summary.staleEntries} ` +
      `overdue=${payload.summary.overdueEntries} ` +
      `unknown=${payload.summary.unknownEntries} ` +
      `→ ${path.relative(ROOT_DIR, outputPath)}`,
  );
  return payload;
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  try {
    runCheckUpstreamRecovery();
    process.exit(0); // Non-blocking: consumers decide via JSON.
  } catch (err) {
    console.error(`[upstream-recovery] unexpected failure: ${err.message}`);
    process.exit(0); // Still non-blocking — don't break unrelated CI.
  }
}
