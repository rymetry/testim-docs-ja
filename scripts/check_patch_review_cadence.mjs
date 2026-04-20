#!/usr/bin/env node
// scripts/check_patch_review_cadence.mjs
/**
 * Registry review cadence monitor (non-blocking).
 *
 * Walks the two broken-EN retreat registries:
 *   - `EN_SOURCE_PATCHES` (segment-level)
 *   - `SOURCE_SYNC_EXCLUSIONS` (page-level, Phase A)
 *
 * Lists every entry whose `reviewAfter` date is in the past relative to `now`.
 * Warnings are printed to stderr (human consumable) and the process exits 0 —
 * this is monitoring, not a gate. CI may surface the warnings but must not
 * fail on them.
 *
 * Usage:
 *   node scripts/check_patch_review_cadence.mjs
 *   npm run check:patch-review
 *
 * Also re-exports the core logic (`collectOverduePatches`, `formatWarning`)
 * for reuse from inside `check_source_parity.mjs` (non-blocking warning
 * emission at run start) and from unit tests.
 *
 * Plan: docs/SYSTEM_SPEC.md §システム不変量
 */

import { EN_SOURCE_PATCHES } from './lib/en_source_patches.mjs';
import { SOURCE_SYNC_EXCLUSIONS } from './lib/source_sync_exclusions.mjs';

/**
 * Determine whether a patch's `reviewAfter` date has passed.
 *
 * @param {{reviewAfter: string}} patch
 * @param {number} nowMs - Current time in ms (injectable for tests).
 * @returns {{ overdue: boolean, daysOverdue: number, invalid: boolean }}
 */
export function evaluatePatchReview(patch, nowMs = Date.now()) {
  if (typeof patch?.reviewAfter !== 'string' || patch.reviewAfter.length === 0) {
    return { overdue: false, daysOverdue: 0, invalid: true };
  }
  const parsedMs = new Date(patch.reviewAfter).getTime();
  if (!Number.isFinite(parsedMs)) {
    return { overdue: false, daysOverdue: 0, invalid: true };
  }
  if (nowMs <= parsedMs) {
    return { overdue: false, daysOverdue: 0, invalid: false };
  }
  const daysOverdue = Math.floor((nowMs - parsedMs) / (24 * 60 * 60 * 1000));
  return { overdue: true, daysOverdue, invalid: false };
}

/**
 * Return every registry entry whose `reviewAfter` is in the past.
 *
 * @param {ReadonlyArray<object>} registry
 * @param {number} nowMs
 * @returns {Array<{ id: string, reviewAfter: string, daysOverdue: number }>}
 */
export function collectOverduePatches(registry = EN_SOURCE_PATCHES, nowMs = Date.now()) {
  const overdue = [];
  for (const patch of registry) {
    const result = evaluatePatchReview(patch, nowMs);
    if (result.overdue) {
      overdue.push({
        id: patch.id,
        reviewAfter: patch.reviewAfter,
        daysOverdue: result.daysOverdue,
      });
    }
  }
  return overdue;
}

/**
 * Same as `collectOverduePatches` but specialised for the page-level
 * `SOURCE_SYNC_EXCLUSIONS` registry (indexed by slug instead of id).
 *
 * @param {Record<string, object>} registry
 * @param {number} nowMs
 * @returns {Array<{ slug: string, reviewAfter: string, daysOverdue: number }>}
 */
export function collectOverdueSyncExclusions(
  registry = SOURCE_SYNC_EXCLUSIONS,
  nowMs = Date.now(),
) {
  const overdue = [];
  for (const [slug, entry] of Object.entries(registry)) {
    const result = evaluatePatchReview(entry, nowMs);
    if (result.overdue) {
      overdue.push({
        slug,
        reviewAfter: entry.reviewAfter,
        daysOverdue: result.daysOverdue,
      });
    }
  }
  return overdue;
}

/**
 * Render a single overdue-entry warning line.
 *
 * Accepts either an `en_source_patches` row (keyed by `id`) or a
 * `source_sync_exclusions` row (keyed by `slug`). The shape is detected
 * from which field is present.
 *
 * Precedence / validation:
 *   - `id` wins over `slug` (en_source_patches is the segment-level mechanism
 *     and its `id` uniquely names the patch; sync_exclusions has no `id`
 *     by construction, so the two shapes are disjoint in every current caller).
 *   - If neither `id` nor `slug` is set, an explicit "unknown-entry" label is
 *     emitted instead of silently stringifying `undefined`. This surfaces a
 *     programming error rather than hiding it in a log line.
 *
 * @param {{ id?: string, slug?: string, reviewAfter: string, daysOverdue: number }} entry
 * @returns {string}
 */
export function formatWarning(entry) {
  if (entry.id) {
    return `[en_source_patches] reviewAfter overdue: patch=${entry.id} reviewAfter=${entry.reviewAfter} daysOverdue=${entry.daysOverdue}`;
  }
  if (entry.slug) {
    return `[source_sync_exclusions] reviewAfter overdue: slug=${entry.slug} reviewAfter=${entry.reviewAfter} daysOverdue=${entry.daysOverdue}`;
  }
  return `[registry-review-cadence] reviewAfter overdue: entry=<unknown> reviewAfter=${entry.reviewAfter ?? '<none>'} daysOverdue=${entry.daysOverdue ?? 0}`;
}

/**
 * Main entry point used by CLI + npm script.
 *
 * @returns {{ overdueCount: number, exitCode: 0 }}
 */
export function main({
  patchRegistry = EN_SOURCE_PATCHES,
  exclusionsRegistry = SOURCE_SYNC_EXCLUSIONS,
  nowMs = Date.now(),
  stderr = console.warn,
  stdout = console.log,
} = {}) {
  const overduePatches = collectOverduePatches(patchRegistry, nowMs);
  const overdueExclusions = collectOverdueSyncExclusions(exclusionsRegistry, nowMs);
  const patchTotal = patchRegistry.length;
  const exclusionTotal = Object.keys(exclusionsRegistry).length;
  const overdueCount = overduePatches.length + overdueExclusions.length;

  if (overdueCount === 0) {
    stdout(
      `[registry-review-cadence] OK — ${patchTotal} en_source_patches + ` +
        `${exclusionTotal} source_sync_exclusions, 0 overdue`,
    );
    return { overdueCount: 0, exitCode: 0 };
  }
  stdout(
    `[registry-review-cadence] ${overdueCount} overdue entr(ies) ` +
      `(${overduePatches.length} patches / ${overdueExclusions.length} exclusions, ` +
      `warning only, non-blocking):`,
  );
  for (const entry of overduePatches) {
    stderr(formatWarning(entry));
  }
  for (const entry of overdueExclusions) {
    stderr(formatWarning(entry));
  }
  return { overdueCount, exitCode: 0 };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const { exitCode } = main();
  process.exit(exitCode);
}
