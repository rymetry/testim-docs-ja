/**
 * Phase 5 exact diff engine — diff=1 recall benchmark (Issue #225 Go gate).
 *
 * Runs every mutation type from `mutation_corpus` against every representative
 * page in the Phase 0 manifest, then verifies that the new alignment engine
 * (`source_parity_align.alignSegments`) catches the introduced mutation as a
 * NEW diff that did not exist in the baseline (EN ↔ unmodified JA) state.
 *
 * Detection model
 * ---------------
 * For each (page, mutation type) the test computes:
 *
 *   baseline = alignSegments(EN, JA original)
 *   mutated  = alignSegments(EN, JA after mutation)
 *
 * A diff is identified canonically by
 *   `(type | sectionIndex | segmentKind | enIndex | jaIndex | tokens)`.
 *
 * To avoid two well-known measurement artifacts:
 *
 *   1. Index shifts in unrelated sections inflating the "new diffs" count.
 *   2. Mutations that target a JA segment which was already flagged as
 *      `segment-extra` in baseline producing an empty `newDiffs` set
 *      (the engine *did* notice — it just removed the existing diff
 *      rather than adding a new one).
 *
 * the recall metric is **section-scoped**: we locate the JA segment at the
 * mutation line, take its `sectionPath`, and compare ONLY the diffs in that
 * section between baseline and mutated. The mutation is "detected" when the
 * affected section's diff set changed in any way (added, removed, or
 * shifted) under the canonical identity above.
 *
 * Go conditions
 * -------------
 * Per Issue #225 Phase 5:
 *
 *   - recall 100% on the diff=1 corpus
 *   - precision unchanged (baseline diffs per page bounded)
 *   - no cascade (single mutation produces a small bounded number of new diffs)
 *
 * The cross-language `segment-shifted` case is intentionally excluded from
 * the strict recall gate because it requires semantic alignment that this
 * PoC does not perform — its result is reported separately so the user can
 * make the No-Go decision (Track A vs audit-only) consciously.
 *
 * The benchmark also writes a deterministic recall-report.json fixture so
 * future drift is visible in code review (the file is committed alongside
 * segment-boundary-report.json).
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

let alignSegments;
let extractSegmentsFromHtml;
let extractSegmentsFromMarkdown;
let MUTATION_TYPES;

before(async () => {
  ({ alignSegments } = await import('../lib/source_parity_align.mjs'));
  ({ extractSegmentsFromHtml } = await import('../lib/source_parity_segments_en.mjs'));
  ({ extractSegmentsFromMarkdown } = await import('../lib/source_parity_segments_ja.mjs'));
  ({ MUTATION_TYPES } = await import('../lib/mutation_corpus.mjs'));
});

const ROOT = join(import.meta.dirname, '../../');
const FIXTURES = join(ROOT, 'scripts/__tests__/fixtures/source-parity-goldens');
const MANIFEST_PATH = join(FIXTURES, 'manifest.json');
const REPORT_PATH = join(FIXTURES, 'recall-report.json');

/**
 * Mutation types that the cross-language alignment is required to catch with
 * 100% recall. `segment-move` is intentionally NOT in this list — see the
 * module header for the rationale and the "Move detection" reporting block
 * below.
 */
const STRICT_RECALL_TYPES = Object.freeze([
  'paragraph-delete',
  'bullet-delete',
  'step-delete',
  'callout-paragraph-delete',
  'table-cell-delete',
  'html-table-cell-delete',
  'en-residual',
  'token-drop',
]);

/**
 * Maximum new diffs (canonical IDs in the mutated section that were not in
 * the baseline section) allowed for a single diff=1 mutation. The bar is
 * deliberately small — single deletions / replacements / token drops should
 * produce 1–3 new diffs at most. Anything larger means the mutation cascaded
 * across the section's LCS alignment.
 */
const MAX_CASCADE = 6;

/** Maximum baseline diffs allowed on any single representative page. */
const MAX_BASELINE_DIFFS_PER_PAGE = 60;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')).pages;
}

function readEnHtml(slug) {
  return readFileSync(join(ROOT, 'snapshots/en/content', `${slug}.html`), 'utf8');
}

function readJaMarkdown(slug) {
  return readFileSync(join(ROOT, 'src/content/docs', `${slug}.md`), 'utf8');
}

/**
 * Canonical diff identity for section-scoped set-diff comparison.
 *
 * Identity uses the content fingerprint of the side that *owns* the diff
 * property:
 *
 *   - segment-missing       → EN fingerprint (the EN segment is the gap)
 *   - segment-token-gap     → EN fingerprint (EN owns the missing token)
 *   - segment-extra         → JA fingerprint (the JA segment is the surplus)
 *   - segment-untranslated  → JA fingerprint (JA owns the untranslated text)
 *
 * Using a single side avoids the cascade artifact where a single deletion
 * causes LCS to repair around it: matched pairs shift, the *paired* JA
 * fingerprint changes, and stale baseline diffs that still represent the
 * same conceptual gap re-appear under a fresh ID. By keying off the
 * property-owning side, those re-pairings are invisible to the metric.
 *
 * The missingTokens signature is included so two token-gap diffs on the
 * same EN segment that drop different tokens are still distinguishable.
 */
function diffId(d) {
  const tokenSig = Array.isArray(d.missingTokens) ? d.missingTokens.join(',') : '';
  let fingerprint = '_';
  switch (d.type) {
    case 'segment-missing':
    case 'segment-token-gap':
      fingerprint = d.enSourceFingerprint ?? '_';
      break;
    case 'segment-extra':
    case 'segment-untranslated':
      fingerprint = d.jaSourceFingerprint ?? '_';
      break;
    default:
      fingerprint =
        (d.enSourceFingerprint ?? '_') + ':' + (d.jaSourceFingerprint ?? '_');
  }
  return [d.type, d.sectionIndex, d.segmentKind, fingerprint, tokenSig].join('|');
}

/**
 * Locate the *positional* section index of the JA segment that the mutation
 * targets. Section indices are positional (0 = preface, 1 = first heading's
 * section, etc.) and match across EN and JA because Phase 4's boundary test
 * already enforces that EN and JA share the same heading count per page.
 *
 * EN and JA segments use different `sectionPath` strings (one English, one
 * Japanese), so positional indices are the only safe cross-language link.
 *
 * @param {Segment[]} jaSegments
 * @param {number} mutationLineIndex0  0-based line index from mutation_corpus
 * @returns {number|null}  positional section index, or null if no segment
 *   sits at or before the mutation line (e.g. frontmatter mutation)
 */
function findAffectedSectionIndex(jaSegments, mutationLineIndex0) {
  const targetLine = mutationLineIndex0 + 1; // mutation_corpus is 0-based, segments 1-based
  let currentSectionIndex = 0; // preface
  let bestSectionIndex = null;
  let bestLine = -1;

  for (const seg of jaSegments) {
    if (seg.segmentKind === 'heading') {
      // A heading starts a new section. If the heading itself is past the
      // mutation line we are done — no later body segment can match.
      if (seg.line == null || seg.line > targetLine) break;
      currentSectionIndex += 1;
      continue;
    }
    if (seg.line == null) continue;
    if (seg.line > targetLine) continue;
    if (seg.line >= bestLine) {
      bestLine = seg.line;
      bestSectionIndex = currentSectionIndex;
    }
  }
  return bestSectionIndex;
}

/**
 * Section-scoped detection: returns true if the affected section's diff set
 * changed in any way (added, removed, or shifted) between baseline and
 * mutated under the canonical diff identity. Falls back to global comparison
 * when the mutation could not be located in a specific section.
 */
function isMutationDetected(baselineDiffs, mutatedDiffs, affectedSectionIndex) {
  if (affectedSectionIndex === null) {
    if (baselineDiffs.length !== mutatedDiffs.length) return true;
    const baselineSet = new Set(baselineDiffs.map(diffId));
    return mutatedDiffs.some((d) => !baselineSet.has(diffId(d)));
  }

  const inSection = (d) => d.sectionIndex === affectedSectionIndex;
  const baselineSection = baselineDiffs.filter(inSection);
  const mutatedSection = mutatedDiffs.filter(inSection);

  if (baselineSection.length !== mutatedSection.length) return true;
  const baselineIds = new Set(baselineSection.map(diffId));
  return mutatedSection.some((d) => !baselineIds.has(diffId(d)));
}

/**
 * Cascade size = number of canonical-id diffs that exist in the mutated
 * section but not in the baseline section. Always section-scoped so a
 * harmless index shift in another section never inflates the metric.
 */
function cascadeSize(baselineDiffs, mutatedDiffs, affectedSectionIndex) {
  if (affectedSectionIndex === null) return 0;
  const inSection = (d) => d.sectionIndex === affectedSectionIndex;
  const baselineIds = new Set(baselineDiffs.filter(inSection).map(diffId));
  let count = 0;
  for (const d of mutatedDiffs) {
    if (!inSection(d)) continue;
    if (!baselineIds.has(diffId(d))) count += 1;
  }
  return count;
}

/** Build a per-page record by running every mutation type against the page. */
function analyzePage(slug) {
  const html = readEnHtml(slug);
  const jaOriginal = readJaMarkdown(slug);

  const enSegments = extractSegmentsFromHtml(html);
  const jaSegmentsOriginal = extractSegmentsFromMarkdown(jaOriginal);

  const baselineResult = alignSegments(enSegments, jaSegmentsOriginal);

  const mutations = {};
  for (const [type, fn] of Object.entries(MUTATION_TYPES)) {
    const mutation = fn(jaOriginal, 0);
    if (mutation === null) {
      mutations[type] = { applicable: false };
      continue;
    }
    const jaSegmentsMutated = extractSegmentsFromMarkdown(mutation.mutated);
    const mutatedResult = alignSegments(enSegments, jaSegmentsMutated);

    const affectedSectionIndex = findAffectedSectionIndex(
      jaSegmentsOriginal,
      mutation.metadata.lineIndex,
    );

    const detected = isMutationDetected(
      baselineResult.diffs,
      mutatedResult.diffs,
      affectedSectionIndex,
    );
    const cascade = cascadeSize(
      baselineResult.diffs,
      mutatedResult.diffs,
      affectedSectionIndex,
    );
    mutations[type] = {
      applicable: true,
      affectedSectionIndex: affectedSectionIndex ?? null,
      baselineDiffCount: baselineResult.diffs.length,
      mutatedDiffCount: mutatedResult.diffs.length,
      cascadeSize: cascade,
      detected,
      inconclusive: mutatedResult.inconclusive,
    };
  }

  return {
    slug,
    baselineDiffCount: baselineResult.diffs.length,
    baselineInconclusive: baselineResult.inconclusive,
    mutations,
  };
}

/**
 * Aggregate per-mutation-type recall across all pages where the mutation
 * was applicable.
 */
function aggregateRecall(pageRecords, allTypes) {
  const out = {};
  for (const type of allTypes) {
    let applicable = 0;
    let detected = 0;
    for (const page of pageRecords) {
      const m = page.mutations[type];
      if (!m.applicable) continue;
      applicable += 1;
      if (m.detected) detected += 1;
    }
    out[type] = {
      applicable,
      detected,
      recall: applicable > 0 ? detected / applicable : null,
    };
  }
  return out;
}

function maxCascadeAcrossCorpus(pageRecords) {
  let max = 0;
  for (const page of pageRecords) {
    for (const m of Object.values(page.mutations)) {
      if (m.applicable && m.cascadeSize > max) max = m.cascadeSize;
    }
  }
  return max;
}

function maxBaselineDiffsAcrossCorpus(pageRecords) {
  let max = 0;
  for (const page of pageRecords) {
    if (page.baselineDiffCount > max) max = page.baselineDiffCount;
  }
  return max;
}

// ---------------------------------------------------------------------------
// Benchmark suite
// ---------------------------------------------------------------------------

describe('Phase 5 — exact diff recall benchmark', () => {
  it('detects every diff=1 mutation in the strict-recall set with 100% recall', () => {
    const manifest = loadManifest();
    const pageRecords = manifest.map((p) => analyzePage(p.slug));

    const allTypes = Object.keys(MUTATION_TYPES);
    const recallByType = aggregateRecall(pageRecords, allTypes);
    const maxCascade = maxCascadeAcrossCorpus(pageRecords);
    const maxBaselineDiffs = maxBaselineDiffsAcrossCorpus(pageRecords);

    // Write the deterministic report fixture so drift is visible in PRs.
    const report = {
      schemaVersion: 1,
      summary: {
        recallByType,
        maxCascade,
        maxBaselineDiffsPerPage: maxBaselineDiffs,
        strictRecallTypes: STRICT_RECALL_TYPES,
        cascadeLimit: MAX_CASCADE,
        precisionBaselineLimit: MAX_BASELINE_DIFFS_PER_PAGE,
      },
      pages: pageRecords,
    };
    writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

    // Go condition 1 — recall 100% on the strict-recall set.
    const failures = [];
    for (const type of STRICT_RECALL_TYPES) {
      const r = recallByType[type];
      if (!r || r.applicable === 0) continue;
      if (r.recall < 1.0) {
        failures.push(
          `${type}: recall ${(r.recall * 100).toFixed(1)}% (${r.detected}/${r.applicable})`,
        );
      }
    }
    assert.equal(
      failures.length,
      0,
      `Phase 5 NO-GO — strict-recall mutations not detected:\n  ${failures.join('\n  ')}`,
    );

    // Every strict-recall type must be applicable on at least one page —
    // otherwise the corpus has drifted and recall is silently 0/0.
    for (const type of STRICT_RECALL_TYPES) {
      assert.ok(
        recallByType[type].applicable > 0,
        `corpus regression: mutation type "${type}" is no longer applicable to any representative page`,
      );
    }

    // Go condition 2 — no cascade.
    assert.ok(
      maxCascade <= MAX_CASCADE,
      `Phase 5 NO-GO — cascade detected: a single mutation produced ${maxCascade} new diffs (limit ${MAX_CASCADE})`,
    );

    // Go condition 3 — precision baseline bounded.
    assert.ok(
      maxBaselineDiffs <= MAX_BASELINE_DIFFS_PER_PAGE,
      `Phase 5 NO-GO — precision regression: max baseline diffs on a page is ${maxBaselineDiffs} (limit ${MAX_BASELINE_DIFFS_PER_PAGE})`,
    );
  });

  it('reports cross-language move detection as a separate metric (not part of the strict gate)', () => {
    const manifest = loadManifest();
    const pageRecords = manifest.map((p) => analyzePage(p.slug));
    const recallByType = aggregateRecall(pageRecords, ['segment-move']);
    const moveRecall = recallByType['segment-move'];

    // The move metric is informational only — we assert it exists in the
    // report but do NOT require 100% recall here. Cross-language move
    // detection requires semantic alignment that the PoC does not perform;
    // see the No-Go discussion in scripts/README.md.
    assert.ok(moveRecall, 'segment-move recall metric must be reported');
    assert.ok(moveRecall.applicable >= 0);
  });
});
