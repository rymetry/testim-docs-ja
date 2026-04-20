#!/usr/bin/env node
/**
 * Generate parity-baseline.json from parity-check-status.json (schema v2).
 *
 * frozen baseline 機構の生成側。input は直前の `check:parity` 実行
 * 結果 (`parity-check-status.json`) と各 slug の現 EN snapshot fingerprint。
 * 出力は deterministic で、CI で bit-identical を検証する。デフォルトの
 * generatedAt / generatedFromRunId は parity-check-status.json の
 * summary.checkedAt から決定する。
 *
 * Modes:
 *   --regenerate              既存 parity-baseline.json を完全上書き
 *   --slug=<csv>              指定 slug のエントリのみ削除 → 再生成 → マージ
 *   --types=<csv>             指定 issueType のエントリのみ再生成 (structure 系のみ許可)
 *   --rationale=<text>        rationale フィールドを明示的に指定
 *
 * v2 変更点:
 *   - `--review-after` option 廃止 (reviewAfter field 自体が v2 で削除)
 *   - 出力 schemaVersion=2
 *   - segment-inconclusive / snapshot-incomplete / source-unusable は
 *     baseline 対象外 (BASELINE_ELIGIBLE_TYPES に含まれない)
 *   - priority: 'medium' default を全 entry に付与
 *
 * @module generate_parity_baseline
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ROOT_DIR } from '../lib/project.mjs';
import {
  BASELINE_ELIGIBLE_TYPES,
  STRUCTURE_CATEGORIES,
  computeStructureFingerprint,
  validateBaseline,
  loadBaselineFile,
  validateTypesArg,
} from '../lib/source_parity_baseline.mjs';
import {
  STRUCTURE_MISMATCH_TYPES,
} from '../lib/source_parity_types.mjs';
import { computeSnapshotFingerprint } from '../lib/source_parity_acknowledgements.mjs';

const STATUS_PATH = path.join(ROOT_DIR, 'parity-check-status.json');
const BASELINE_PATH = path.join(ROOT_DIR, 'parity-baseline.json');
const SNAPSHOT_DIFF_PATH = path.join(ROOT_DIR, 'snapshot-diff-status.json');
const SNAPSHOTS_DIR = path.join(ROOT_DIR, 'snapshots', 'en', 'content');

/**
 * Convert a parity-check-status.json file path to a slug.
 */
function fileEntryToSlug(filePath) {
  return filePath.replace(/^src\/content\/docs\//, '').replace(/\.md$/, '');
}

function getCheckedAt(status) {
  const checkedAt = status?.summary?.checkedAt;
  if (typeof checkedAt !== 'string' || Number.isNaN(Date.parse(checkedAt))) {
    throw new Error(
      'parity-check-status.json must include summary.checkedAt as a valid ISO timestamp',
    );
  }
  return checkedAt;
}

export function assertFullParityStatus(status) {
  const checkedFiles = status?.summary?.checkedFiles;
  const totalFiles = status?.summary?.totalFiles;
  if (
    typeof checkedFiles !== 'number' ||
    typeof totalFiles !== 'number' ||
    checkedFiles !== totalFiles
  ) {
    throw new Error(
      'parity-check-status.json is not a full-repo run. Run `npm run check:parity` before generating baseline.',
    );
  }
}

/**
 * Load `snapshot-diff-status.json` for the pre-regen fail-closed gate.
 *
 * Missing file or unparseable JSON is a gate failure, not a warning
 * (proposal I — Codex Round-3 approved).
 *
 * @returns {object} parsed snapshot-diff-status payload
 * @throws {Error} if file is missing or unparseable
 */
export function loadSnapshotDiffStatus(filePath = SNAPSHOT_DIFF_PATH) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `snapshot-diff-status.json not found at ${path.relative(ROOT_DIR, filePath)}. ` +
        'Run `npm run check:snapshots` before a full --regenerate.',
    );
  }
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    throw new Error(
      `snapshot-diff-status.json read failure: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `snapshot-diff-status.json parse failure: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Pre-regen fail-closed gate for full `--regenerate` mode.
 *
 * Enforces the invariants documented in
 *   `docs/SYSTEM_SPEC.md §システム不変量`
 *   "PR Z entry fail-closed invariants" (A'.4)
 * and
 *   `docs/SYSTEM_SPEC.md §システム不変量`
 *   "baseline 再生成 (pre-regen fail-closed gate, I)"
 *
 * A full regeneration from a run that fails any predicate is invalid —
 * the gate throws instead of writing an unsafe baseline. Partial regen
 * modes (`--slug`, `--types`) are intentionally out of scope.
 *
 * @param {object} status  — parsed parity-check-status.json
 * @param {object} snapshotDiff — parsed snapshot-diff-status.json
 * @throws {Error} on any failed predicate
 */
export function assertPreRegenGate(status, snapshotDiff) {
  const failures = [];
  const summary = status?.summary;
  if (!summary || typeof summary !== 'object') {
    throw new Error('parity-check-status.json: summary missing or not an object');
  }
  if (summary.runScope?.isComplete !== true) {
    failures.push(
      `summary.runScope.isComplete must be true (got ${JSON.stringify(summary.runScope?.isComplete)})`,
    );
  }
  if (summary.freshnessState !== 'fresh') {
    failures.push(
      `summary.freshnessState must be "fresh" (got ${JSON.stringify(summary.freshnessState)})`,
    );
  }
  if (summary.linkageState !== 'linked') {
    failures.push(
      `summary.linkageState must be "linked" (got ${JSON.stringify(summary.linkageState)})`,
    );
  }
  if (summary.result !== 'pass') {
    failures.push(`summary.result must be "pass" (got ${JSON.stringify(summary.result)})`);
  }
  if (summary.orphanBaselineEntries !== 0) {
    failures.push(
      `summary.orphanBaselineEntries must be 0 (got ${JSON.stringify(summary.orphanBaselineEntries)})`,
    );
  }
  const patchMismatches = status?.debug?.patchCoverage?.mismatches;
  if (!Array.isArray(patchMismatches)) {
    failures.push(
      `debug.patchCoverage.mismatches must be an array (got ${JSON.stringify(patchMismatches)})`,
    );
  } else if (patchMismatches.length !== 0) {
    failures.push(
      `debug.patchCoverage.mismatches.length must be 0 (got ${patchMismatches.length})`,
    );
  }
  const diffSummary = snapshotDiff?.summary;
  if (!diffSummary || typeof diffSummary !== 'object') {
    failures.push('snapshot-diff-status.json: summary missing or not an object');
  } else {
    for (const counter of ['changed', 'added', 'removed']) {
      if (diffSummary[counter] !== 0) {
        failures.push(
          `snapshotDiff.summary.${counter} must be 0 (got ${JSON.stringify(diffSummary[counter])})`,
        );
      }
    }
  }
  if (failures.length > 0) {
    throw new Error(
      'baseline-regen-gate: FAIL\n' +
        failures.map((f) => `  - ${f}`).join('\n') +
        '\nSee docs/SYSTEM_SPEC.md §システム不変量 (PR Z entry fail-closed invariants)',
    );
  }
}

/**
 * Build a fingerprint map from the snapshots directory: slug → sha256:....
 * Walks the snapshots tree once and computes computeSnapshotFingerprint per file.
 */
export function buildFingerprintMap(snapshotsDir = SNAPSHOTS_DIR) {
  const map = new Map();
  if (!fs.existsSync(snapshotsDir)) return map;
  const walk = (dir, prefix) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), prefix ? `${prefix}/${entry.name}` : entry.name);
      } else if (entry.name.endsWith('.html')) {
        const slug = prefix
          ? `${prefix}/${entry.name.replace(/\.html$/, '')}`
          : entry.name.replace(/\.html$/, '');
        const content = fs.readFileSync(path.join(dir, entry.name), 'utf8');
        map.set(slug, computeSnapshotFingerprint(content));
      }
    }
  };
  walk(snapshotsDir, '');
  return map;
}

/**
 * Build a baseline from a parsed parity-check-status.json object (schema v2).
 *
 * @param {object} status — parsed parity-check-status.json
 * @param {Map<string, string>} fingerprintMap — slug → sha256
 * @param {{ runId: string, generatedAt: string, rationale: string }} meta
 * @returns {object} baseline ready for serializeBaseline
 */
export function buildBaselineFromStatus(status, fingerprintMap, meta) {
  const entries = [];
  for (const file of status.files ?? []) {
    const slug = fileEntryToSlug(file.file);
    const fingerprint = fingerprintMap.get(slug);
    if (!fingerprint) continue; // defensive: no snapshot, skip

    for (const issue of file.issues ?? []) {
      if (!BASELINE_ELIGIBLE_TYPES.has(issue.type)) continue;

      const entry = {
        slug,
        issueType: issue.type,
        snapshotFingerprint: fingerprint,
        priority: 'medium',
        sectionPath: null,
        segmentKind: null,
        enSegmentIndex: null,
        jaSegmentIndex: null,
        enSourceFingerprint: null,
        jaSourceFingerprint: null,
        missingTokens: null,
        // structure mismatch 用フィールド
        sectionIndex: null,
        structureCategory: null,
        structureFingerprint: null,
      };

      if (STRUCTURE_MISMATCH_TYPES.has(issue.type)) {
        // section 粒度の structure diff。
        // identity は sectionIndex (machine) + structureCategory +
        // structureFingerprint。sectionPath は reviewer 可読性のために
        // 保存するが identity には使わない。
        if (
          typeof issue.sectionIndex !== 'number' ||
          !Number.isInteger(issue.sectionIndex) ||
          issue.sectionIndex < 0 ||
          typeof issue.sectionPath !== 'string' ||
          !STRUCTURE_CATEGORIES.has(issue.structureCategory) ||
          !Array.isArray(issue.enKinds) ||
          !Array.isArray(issue.jaKinds)
        ) {
          continue;
        }
        entry.sectionIndex = issue.sectionIndex;
        entry.sectionPath = issue.sectionPath;
        entry.structureCategory = issue.structureCategory;
        entry.structureFingerprint = computeStructureFingerprint({
          structureCategory: issue.structureCategory,
          enKinds: issue.enKinds,
          jaKinds: issue.jaKinds,
          contentPermutation: issue.contentPermutation,
        });
        entries.push(entry);
        continue;
      }

      if (issue.type === 'segment-extra' || issue.type === 'segment-untranslated') {
        // JA-owned diffs — use jaSegmentIndex as the anchor.
        if (
          typeof issue.jaSegmentIndex !== 'number' ||
          typeof issue.jaSourceFingerprint !== 'string'
        ) {
          continue;
        }
        entry.sectionPath = issue.sectionPath ?? null;
        entry.segmentKind = issue.segmentKind ?? null;
        entry.jaSegmentIndex = issue.jaSegmentIndex;
        entry.jaSourceFingerprint = issue.jaSourceFingerprint;
      } else if (issue.type === 'segment-shifted') {
        if (
          typeof issue.enSegmentIndex !== 'number' ||
          typeof issue.enSourceFingerprint !== 'string' ||
          typeof issue.jaSourceFingerprint !== 'string'
        ) {
          continue;
        }
        entry.sectionPath = issue.sectionPath ?? null;
        entry.segmentKind = issue.segmentKind ?? null;
        entry.enSegmentIndex = issue.enSegmentIndex;
        entry.enSourceFingerprint = issue.enSourceFingerprint;
        entry.jaSourceFingerprint = issue.jaSourceFingerprint;
      } else if (issue.type === 'segment-token-gap') {
        if (
          typeof issue.enSegmentIndex !== 'number' ||
          typeof issue.enSourceFingerprint !== 'string' ||
          !Array.isArray(issue.missingTokens) ||
          issue.missingTokens.length === 0
        ) {
          continue;
        }
        entry.sectionPath = issue.sectionPath ?? null;
        entry.segmentKind = issue.segmentKind ?? null;
        entry.enSegmentIndex = issue.enSegmentIndex;
        entry.enSourceFingerprint = issue.enSourceFingerprint;
        entry.missingTokens = [...new Set(issue.missingTokens)].sort();
      } else {
        // EN-owned diffs (segment-missing).
        if (
          typeof issue.enSegmentIndex !== 'number' ||
          typeof issue.enSourceFingerprint !== 'string'
        ) {
          continue;
        }
        entry.sectionPath = issue.sectionPath ?? null;
        entry.segmentKind = issue.segmentKind ?? null;
        entry.enSegmentIndex = issue.enSegmentIndex;
        entry.enSourceFingerprint = issue.enSourceFingerprint;
      }
      entries.push(entry);
    }
  }

  return {
    schemaVersion: 2,
    generatedAt: meta.generatedAt,
    generatedFromRunId: meta.runId,
    rationale: meta.rationale,
    entries,
  };
}

export function buildGenerationMeta(status, args) {
  const checkedAt = getCheckedAt(status);
  const generatedAt = checkedAt;
  let defaultRationale;
  if (args.regenerate) {
    defaultRationale = 'frozen baseline — regenerated (schema v2)';
  } else if (args.types) {
    defaultRationale =
      `frozen baseline — partial regeneration by type: ${args.types.join(', ')}`;
  } else if (args.slugs) {
    defaultRationale = `frozen baseline — partial regeneration for ${args.slugs.join(', ')}`;
  } else {
    defaultRationale = 'frozen baseline';
  }
  return {
    runId: `${checkedAt}#parity-check-status`,
    generatedAt,
    rationale: args.rationale ?? defaultRationale,
  };
}

/**
 * Sort entries deterministically: slug → issueType → sectionPath → segmentKind → index.
 *
 * structure mismatch 系は sectionIndex を sectionPath より先に使うことで、
 * 同一ページ内で sectionPath が衝突しても stable に並ぶ。
 */
function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    if (a.slug !== b.slug) return a.slug < b.slug ? -1 : 1;
    if (a.issueType !== b.issueType) return a.issueType < b.issueType ? -1 : 1;
    if (STRUCTURE_MISMATCH_TYPES.has(a.issueType)) {
      const aIdx = typeof a.sectionIndex === 'number' ? a.sectionIndex : -1;
      const bIdx = typeof b.sectionIndex === 'number' ? b.sectionIndex : -1;
      if (aIdx !== bIdx) return aIdx - bIdx;
      const aCat = a.structureCategory ?? '';
      const bCat = b.structureCategory ?? '';
      if (aCat !== bCat) return aCat < bCat ? -1 : 1;
      const aFp = a.structureFingerprint ?? '';
      const bFp = b.structureFingerprint ?? '';
      return aFp < bFp ? -1 : aFp > bFp ? 1 : 0;
    }
    const aSec = a.sectionPath ?? '';
    const bSec = b.sectionPath ?? '';
    if (aSec !== bSec) return aSec < bSec ? -1 : 1;
    const aKind = a.segmentKind ?? '';
    const bKind = b.segmentKind ?? '';
    if (aKind !== bKind) return aKind < bKind ? -1 : 1;
    if (a.issueType === 'segment-extra' || a.issueType === 'segment-untranslated') {
      const aIdx = a.jaSegmentIndex ?? -1;
      const bIdx = b.jaSegmentIndex ?? -1;
      if (aIdx !== bIdx) return aIdx - bIdx;
      const aFp = a.jaSourceFingerprint ?? '';
      const bFp = b.jaSourceFingerprint ?? '';
      return aFp < bFp ? -1 : aFp > bFp ? 1 : 0;
    }
    if (a.issueType === 'segment-token-gap') {
      const aIdx = a.enSegmentIndex ?? -1;
      const bIdx = b.enSegmentIndex ?? -1;
      if (aIdx !== bIdx) return aIdx - bIdx;
      const aFp = a.enSourceFingerprint ?? '';
      const bFp = b.enSourceFingerprint ?? '';
      if (aFp !== bFp) return aFp < bFp ? -1 : 1;
      const aTokens = Array.isArray(a.missingTokens) ? a.missingTokens.join(',') : '';
      const bTokens = Array.isArray(b.missingTokens) ? b.missingTokens.join(',') : '';
      return aTokens < bTokens ? -1 : aTokens > bTokens ? 1 : 0;
    }
    if (a.issueType === 'segment-shifted') {
      const aIdx = a.enSegmentIndex ?? -1;
      const bIdx = b.enSegmentIndex ?? -1;
      if (aIdx !== bIdx) return aIdx - bIdx;
      const aEnFp = a.enSourceFingerprint ?? '';
      const bEnFp = b.enSourceFingerprint ?? '';
      if (aEnFp !== bEnFp) return aEnFp < bEnFp ? -1 : 1;
      const aJaFp = a.jaSourceFingerprint ?? '';
      const bJaFp = b.jaSourceFingerprint ?? '';
      return aJaFp < bJaFp ? -1 : aJaFp > bJaFp ? 1 : 0;
    }
    const aIdx = a.enSegmentIndex ?? -1;
    const bIdx = b.enSegmentIndex ?? -1;
    if (aIdx !== bIdx) return aIdx - bIdx;
    const aFp = a.enSourceFingerprint ?? '';
    const bFp = b.enSourceFingerprint ?? '';
    return aFp < bFp ? -1 : aFp > bFp ? 1 : 0;
  });
}

/**
 * Serialize a baseline object to canonical JSON string with stable ordering,
 * 2-space indent, and LF terminator. Bit-identical for the same input.
 */
export function serializeBaseline(baseline) {
  const sorted = {
    schemaVersion: baseline.schemaVersion,
    generatedAt: baseline.generatedAt,
    generatedFromRunId: baseline.generatedFromRunId,
    rationale: baseline.rationale,
    entries: sortEntries(baseline.entries),
  };
  return JSON.stringify(sorted, null, 2) + '\n';
}

/**
 * Merge new entries for a set of slugs into an existing baseline. Existing
 * entries for those slugs are removed first; entries for OTHER slugs are
 * preserved.
 */
export function mergePartialBaseline(existing, slugsToReplace, newEntries, meta) {
  const slugSet = new Set(slugsToReplace);
  const preserved = existing.entries.filter((e) => !slugSet.has(e.slug));
  return {
    schemaVersion: 2,
    generatedAt: meta.generatedAt,
    generatedFromRunId: meta.generatedFromRunId,
    rationale: meta.rationale,
    entries: [...preserved, ...newEntries],
  };
}

/**
 * `--types=<csv>` partial mode 用のマージヘルパー。
 *
 * 指定 issueType の既存エントリだけを削除し、新しい entries とマージする。
 * 指定外の issueType のエントリは bit-identical で保持する。
 *
 * @param {object} existing — loadBaselineFile の戻り値
 * @param {string[]} typesToReplace — 置換対象の issueType (例: ['section-structure-mismatch'])
 * @param {object[]} newEntries — buildBaselineFromStatus が生成した新エントリ
 * @param {{ generatedAt: string, generatedFromRunId: string, rationale: string }} meta
 */
export function mergePartialBaselineByType(existing, typesToReplace, newEntries, meta) {
  const typeSet = new Set(typesToReplace);
  const preserved = existing.entries.filter((e) => !typeSet.has(e.issueType));
  const filteredNew = newEntries.filter((e) => typeSet.has(e.issueType));
  return {
    schemaVersion: 2,
    generatedAt: meta.generatedAt,
    generatedFromRunId: meta.generatedFromRunId,
    rationale: meta.rationale,
    entries: [...preserved, ...filteredNew],
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

export function parseArgs(argv) {
  const slugArg = argv.find((arg) => arg.startsWith('--slug='));
  const rationaleArg = argv.find((arg) => arg.startsWith('--rationale='));
  const typesArg = argv.find((arg) => arg.startsWith('--types='));
  return {
    regenerate: argv.includes('--regenerate'),
    slugs: slugArg ? slugArg.slice('--slug='.length).split(',').filter(Boolean) : null,
    types: typesArg ? typesArg.slice('--types='.length).split(',').filter(Boolean) : null,
    rationale: rationaleArg ? rationaleArg.slice('--rationale='.length) : null,
  };
}

function printUsage() {
  console.error('Usage:');
  console.error(
    '  node scripts/detection/generate_parity_baseline.mjs --regenerate [--rationale="..."]',
  );
  console.error(
    '  node scripts/detection/generate_parity_baseline.mjs --slug=overview/foo,overview/bar [--rationale="..."]',
  );
  console.error(
    '  node scripts/detection/generate_parity_baseline.mjs --types=section-structure-mismatch,segment-order-mismatch [--rationale="..."]',
  );
  console.error('');
  console.error(
    '  --types is mutually exclusive with --regenerate and --slug. It re-generates only entries',
  );
  console.error(
    '  for the specified issue types, leaving other entries untouched.',
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  // v2: --review-after was removed entirely. Reject stale invocations to
  // force callers (scripts, docs) to drop the obsolete flag instead of
  // silently ignoring it.
  const obsoleteReviewAfter = process.argv.slice(2).find((a) => a.startsWith('--review-after'));
  if (obsoleteReviewAfter) {
    console.error(
      `❌ --review-after is removed in schema v2 (${obsoleteReviewAfter}). ` +
        'Drop the flag — baseline entries no longer carry a reviewAfter field.',
    );
    return 1;
  }
  if (!args.regenerate && !args.slugs && !args.types) {
    printUsage();
    return 1;
  }
  // --types は --regenerate / --slug と排他的。
  // 同時指定を許すと「partial mode なのに既存 segment-* も touch される」
  // 状態が起き得るので明示的に reject する。
  const modeCount =
    (args.regenerate ? 1 : 0) + (args.slugs ? 1 : 0) + (args.types ? 1 : 0);
  if (modeCount > 1) {
    console.error('❌ --regenerate / --slug / --types are mutually exclusive');
    printUsage();
    return 1;
  }
  // --types の allowlist / 空配列 / typo は純粋 helper
  // に委譲して fail-fast する (silent no-op 再発防止)。
  {
    const validation = validateTypesArg(args.types);
    if (!validation.ok) {
      console.error(`❌ ${validation.error}`);
      printUsage();
      return 1;
    }
  }

  if (!fs.existsSync(STATUS_PATH)) {
    console.error(`❌ ${STATUS_PATH} not found. Run \`npm run check:parity\` first.`);
    return 1;
  }
  const status = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf8'));
  assertFullParityStatus(status);

  // Full --regenerate triggers the pre-regen fail-closed gate (proposal I,
  // Codex Round-3 approved). Partial modes (--slug / --types) are out of
  // scope because they only re-generate a subset of entries and preserve
  // bit-identical existing records for the rest.
  if (args.regenerate) {
    const snapshotDiff = loadSnapshotDiffStatus();
    assertPreRegenGate(status, snapshotDiff);
    console.log('baseline-regen-gate: pass');
  }

  const fingerprintMap = buildFingerprintMap();

  const meta = buildGenerationMeta(status, args);

  let output;
  if (args.regenerate) {
    output = buildBaselineFromStatus(status, fingerprintMap, meta);
  } else if (args.types) {
    // partial-by-type mode。
    // 指定 issueType の issue だけから entry を生成し、既存 baseline と
    // mergePartialBaselineByType でマージする。指定外 (segment-*) は
    // bit-identical で残る。
    const newBaseline = buildBaselineFromStatus(status, fingerprintMap, meta);
    let existing = {
      schemaVersion: 2,
      generatedAt: meta.generatedAt,
      generatedFromRunId: '',
      rationale: '',
      entries: [],
    };
    if (fs.existsSync(BASELINE_PATH)) {
      existing = loadBaselineFile(BASELINE_PATH);
    }
    output = mergePartialBaselineByType(existing, args.types, newBaseline.entries, {
      generatedAt: meta.generatedAt,
      generatedFromRunId: meta.runId,
      rationale: meta.rationale,
    });
  } else {
    const filtered = {
      ...status,
      files: (status.files ?? []).filter((f) => args.slugs.includes(fileEntryToSlug(f.file))),
    };
    const newBaseline = buildBaselineFromStatus(filtered, fingerprintMap, meta);
    let existing = {
      schemaVersion: 2,
      generatedAt: meta.generatedAt,
      generatedFromRunId: '',
      rationale: '',
      entries: [],
    };
    if (fs.existsSync(BASELINE_PATH)) {
      existing = loadBaselineFile(BASELINE_PATH);
    }
    output = mergePartialBaseline(existing, args.slugs, newBaseline.entries, {
      generatedAt: meta.generatedAt,
      generatedFromRunId: meta.runId,
      rationale: meta.rationale,
    });
  }

  validateBaseline(output);
  const serialized = serializeBaseline(output);
  fs.writeFileSync(BASELINE_PATH, serialized);
  console.log(
    `✅ Wrote ${output.entries.length} baseline entries to ${path.relative(ROOT_DIR, BASELINE_PATH)}`,
  );
  return 0;
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error('❌ generate_parity_baseline error:', err);
      process.exit(1);
    });
}
