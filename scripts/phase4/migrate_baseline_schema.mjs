#!/usr/bin/env node
/**
 * One-shot migration: parity-baseline.json schema v1 → v2.
 *
 * v1 → v2 changes:
 *   - Drop entry fields: reviewAfter / inconclusiveReason / inconclusiveCategory / usabilityReason
 *   - Drop entries with issueType: segment-inconclusive / snapshot-incomplete / source-unusable
 *     (moved out of baseline — these remain as runtime issues only)
 *   - Default priority: 'medium' (preserved if already set)
 *   - Root schemaVersion: 1 → 2
 *   - Rationale gets " / Phase 4 v2" suffix for provenance
 *
 * Pure functions (`migrateEntry`, `migrateBaseline`) are exported so tests
 * and downstream tools can exercise the migration without fs I/O. The CLI
 * wrapper reads `parity-baseline.json`, applies the migration, validates
 * against the v2 schema, and writes back.
 *
 * @module migrate_baseline_schema
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ROOT_DIR } from '../lib/project.mjs';
import { validateBaseline } from '../lib/source_parity_baseline.mjs';

const BASELINE_PATH = path.join(ROOT_DIR, 'parity-baseline.json');

/**
 * Fields removed from v2 baseline entries.
 * Runtime issues may still carry these (e.g. inconclusiveReason) but the
 * frozen baseline representation drops them.
 */
const DROP_FIELDS = new Set([
  'reviewAfter',
  'inconclusiveReason',
  'inconclusiveCategory',
  'usabilityReason',
]);

/**
 * Issue types removed from BASELINE_ELIGIBLE_TYPES in v2.
 * Entries of these types are dropped entirely (no longer baseline-able).
 */
const DROP_ISSUE_TYPES = new Set([
  'segment-inconclusive',
  'snapshot-incomplete',
  'source-unusable',
]);

/**
 * @param {object} entry — a v1 baseline entry
 * @returns {object|null} migrated v2 entry, or null if entry should be dropped
 */
export function migrateEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  if (DROP_ISSUE_TYPES.has(entry.issueType)) return null;
  const out = {};
  for (const [key, value] of Object.entries(entry)) {
    if (!DROP_FIELDS.has(key)) out[key] = value;
  }
  // v1 never emits `priority`. We only default the field if it is missing
  // (undefined) or null — other falsy values are preserved for `validateBaseline`
  // to reject so we never silently overwrite an explicit caller-supplied value.
  if (out.priority === undefined || out.priority === null) {
    out.priority = 'medium';
  }
  return out;
}

/**
 * @param {object} baseline — a v1 baseline payload
 * @returns {object} migrated v2 baseline payload
 */
export function migrateBaseline(baseline) {
  if (!baseline || typeof baseline !== 'object' || Array.isArray(baseline)) {
    throw new Error('migrateBaseline: input must be a baseline object');
  }
  // Fail-closed on malformed entries array (Codex C1 / R1):
  // silently coercing a non-array to [] would hide data corruption upstream
  // behind an empty but technically-valid v2 baseline.
  if (!Array.isArray(baseline.entries)) {
    throw new Error(
      `migrateBaseline: baseline.entries must be an array (got ${
        baseline.entries === null ? 'null' : typeof baseline.entries
      })`,
    );
  }
  const entries = baseline.entries.map(migrateEntry).filter((e) => e !== null);
  const existingRationale =
    typeof baseline.rationale === 'string' ? baseline.rationale : '';
  const rationale = existingRationale.includes('Phase 4 v2')
    ? existingRationale
    : `${existingRationale} / Phase 4 v2`.trim();
  return {
    ...baseline,
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    rationale,
    entries,
  };
}

async function main() {
  if (!fs.existsSync(BASELINE_PATH)) {
    console.error(`❌ ${BASELINE_PATH} not found — nothing to migrate.`);
    return 1;
  }
  const before = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  if (before.schemaVersion === 2) {
    console.log('ℹ parity-baseline.json is already schemaVersion=2 — no changes.');
    return 0;
  }
  const after = migrateBaseline(before);
  validateBaseline(after);
  const serialized = JSON.stringify(after, null, 2) + '\n';
  fs.writeFileSync(BASELINE_PATH, serialized);
  console.log(
    `✅ Migrated ${before.entries?.length ?? 0} v1 entries → ${after.entries.length} v2 entries ` +
      `(dropped: ${(before.entries?.length ?? 0) - after.entries.length})`,
  );
  return 0;
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error('❌ migrate_baseline_schema error:', err);
      process.exit(1);
    });
}
