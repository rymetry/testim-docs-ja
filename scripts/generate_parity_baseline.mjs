#!/usr/bin/env node
/**
 * Generate parity-baseline.json from parity-check-status.json.
 *
 * Phase 6A の frozen baseline 機構の生成側。input は直前の `check:parity` 実行
 * 結果 (`parity-check-status.json`) と各 slug の現 EN snapshot fingerprint。
 * 出力は deterministic で、CI で bit-identical を検証する。デフォルトの
 * generatedAt / generatedFromRunId は parity-check-status.json の
 * summary.checkedAt から決定する。
 *
 * Modes:
 *   --regenerate              既存 parity-baseline.json を完全上書き
 *   --slug=<csv>              指定 slug のエントリのみ削除 → 再生成 → マージ
 *   --rationale=<text>        rationale フィールドを明示的に指定
 *   --review-after=<YYYY-MM-DD>  reviewAfter を明示的に指定（省略時は 6 ヶ月後）
 *
 * @module generate_parity_baseline
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ROOT_DIR } from './lib/project.mjs';
import {
  BASELINE_ELIGIBLE_TYPES,
  validateBaseline,
  loadBaselineFile,
} from './lib/source_parity_baseline.mjs';
import { computeSnapshotFingerprint } from './lib/source_parity_acknowledgements.mjs';

const STATUS_PATH = path.join(ROOT_DIR, 'parity-check-status.json');
const BASELINE_PATH = path.join(ROOT_DIR, 'parity-baseline.json');
const SNAPSHOTS_DIR = path.join(ROOT_DIR, 'snapshots', 'en', 'content');

const DEFAULT_REVIEW_MONTHS = 6;

/**
 * Compute the default reviewAfter date — `monthsAhead` months after `now`.
 * Plain UTC math, format strict YYYY-MM-DD.
 *
 * @param {Date} now
 * @param {number} [monthsAhead]
 * @returns {string}
 */
export function defaultReviewAfter(now, monthsAhead = DEFAULT_REVIEW_MONTHS) {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthsAhead, now.getUTCDate()),
  );
  const yyyy = d.getUTCFullYear().toString();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

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
 * Build a baseline from a parsed parity-check-status.json object.
 *
 * @param {object} status — parsed parity-check-status.json
 * @param {Map<string, string>} fingerprintMap — slug → sha256
 * @param {{ runId: string, generatedAt: string, reviewAfter: string, rationale: string }} meta
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
        reviewAfter: meta.reviewAfter,
        sectionPath: null,
        segmentKind: null,
        enSegmentIndex: null,
        jaSegmentIndex: null,
        enSourceFingerprint: null,
        jaSourceFingerprint: null,
        missingTokens: null,
        inconclusiveCategory: null,
        inconclusiveReason: null,
      };

      if (issue.type === 'segment-inconclusive') {
        entry.inconclusiveCategory = issue.inconclusiveCategory ?? null;
        entry.inconclusiveReason = issue.inconclusiveReason ?? null;
      } else if (issue.type === 'segment-extra' || issue.type === 'segment-untranslated') {
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
    schemaVersion: 1,
    generatedAt: meta.generatedAt,
    generatedFromRunId: meta.runId,
    rationale: meta.rationale,
    entries,
  };
}

export function buildGenerationMeta(status, args) {
  const checkedAt = getCheckedAt(status);
  const generatedAt = checkedAt;
  const defaultRationale = args.regenerate
    ? 'Phase 6A frozen baseline — regenerated'
    : `Phase 6A frozen baseline — partial regeneration for ${args.slugs.join(', ')}`;
  return {
    runId: `${checkedAt}#parity-check-status`,
    generatedAt,
    reviewAfter: args.reviewAfter ?? defaultReviewAfter(new Date(checkedAt)),
    rationale: args.rationale ?? defaultRationale,
  };
}

/**
 * Sort entries deterministically: slug → issueType → sectionPath → segmentKind → index.
 */
function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    if (a.slug !== b.slug) return a.slug < b.slug ? -1 : 1;
    if (a.issueType !== b.issueType) return a.issueType < b.issueType ? -1 : 1;
    const aSec = a.sectionPath ?? '';
    const bSec = b.sectionPath ?? '';
    if (aSec !== bSec) return aSec < bSec ? -1 : 1;
    const aKind = a.segmentKind ?? '';
    const bKind = b.segmentKind ?? '';
    if (aKind !== bKind) return aKind < bKind ? -1 : 1;
    if (a.issueType === 'segment-inconclusive') {
      const aCat = a.inconclusiveCategory ?? '';
      const bCat = b.inconclusiveCategory ?? '';
      if (aCat !== bCat) return aCat < bCat ? -1 : 1;
      return 0;
    }
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
    schemaVersion: 1,
    generatedAt: meta.generatedAt,
    generatedFromRunId: meta.generatedFromRunId,
    rationale: meta.rationale,
    entries: [...preserved, ...newEntries],
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const slugArg = argv.find((arg) => arg.startsWith('--slug='));
  const rationaleArg = argv.find((arg) => arg.startsWith('--rationale='));
  const reviewAfterArg = argv.find((arg) => arg.startsWith('--review-after='));
  return {
    regenerate: argv.includes('--regenerate'),
    slugs: slugArg ? slugArg.slice('--slug='.length).split(',').filter(Boolean) : null,
    rationale: rationaleArg ? rationaleArg.slice('--rationale='.length) : null,
    reviewAfter: reviewAfterArg ? reviewAfterArg.slice('--review-after='.length) : null,
  };
}

function printUsage() {
  console.error('Usage:');
  console.error(
    '  node scripts/generate_parity_baseline.mjs --regenerate [--rationale="..."] [--review-after=YYYY-MM-DD]',
  );
  console.error(
    '  node scripts/generate_parity_baseline.mjs --slug=overview/foo,overview/bar [--rationale="..."]',
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.regenerate && !args.slugs) {
    printUsage();
    return 1;
  }

  if (!fs.existsSync(STATUS_PATH)) {
    console.error(`❌ ${STATUS_PATH} not found. Run \`npm run check:parity\` first.`);
    return 1;
  }
  const status = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf8'));
  const fingerprintMap = buildFingerprintMap();

  const meta = buildGenerationMeta(status, args);

  let output;
  if (args.regenerate) {
    output = buildBaselineFromStatus(status, fingerprintMap, meta);
  } else {
    const filtered = {
      ...status,
      files: (status.files ?? []).filter((f) => args.slugs.includes(fileEntryToSlug(f.file))),
    };
    const newBaseline = buildBaselineFromStatus(filtered, fingerprintMap, meta);
    let existing = {
      schemaVersion: 1,
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
