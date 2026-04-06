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
 *
 * `section-body-swap` was added in response to a P1 review comment: heading
 * counts and kind sequences agree but the bodies of two sections are
 * exchanged. The section-content validation pass in source_parity_align.mjs
 * must catch this via `segment-shifted`.
 */
const STRICT_RECALL_TYPES = Object.freeze([
  'paragraph-delete',
  'bullet-delete',
  'step-delete',
  'callout-paragraph-delete',
  'table-cell-delete',
  'html-table-cell-delete',
  'section-body-swap',
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
 * Locate the JA segment that the mutation targets and return both its
 * positional section index and the segment record itself (for fingerprint
 * matching downstream).
 *
 * Two-pass implementation:
 *   1. Walk the JA segments and use heading positions alone to decide
 *      which section the mutation line falls into (`targetSectionIndex`).
 *      This is critical because mutations like `swapSectionBodies` set
 *      `lineIndex` to the line *immediately after* a heading, where no
 *      body segment exists yet — the previous single-pass logic wrongly
 *      attributed it to the preceding section's last body segment.
 *   2. Walk the segments again, tracking the current section index, and
 *      pick the body segment in `targetSectionIndex` whose `line` is
 *      closest to the mutation line. The closest segment may be on
 *      either side of the mutation line.
 *
 * Section indices are positional (0 = preface, 1 = first heading's
 * section, etc.) and match across EN and JA because Phase 4's boundary
 * test already enforces that EN and JA share the same heading count
 * per page.
 *
 * @param {Segment[]} jaSegments
 * @param {number} mutationLineIndex0  0-based line index from mutation_corpus
 * @returns {{sectionIndex:number, segment:Segment}|null}
 */
function findAffectedSegment(jaSegments, mutationLineIndex0) {
  const targetLine = mutationLineIndex0 + 1; // mutation_corpus is 0-based, segments 1-based

  // Pass 1 — heading-based section identification.
  let currentSection = 0;
  let targetSection = 0;
  for (const seg of jaSegments) {
    if (seg.segmentKind !== 'heading') continue;
    if (seg.line == null) continue;
    if (seg.line <= targetLine) {
      currentSection += 1;
      targetSection = currentSection;
    }
  }

  // Pass 2 — closest body segment in the target section.
  let walkSection = 0;
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const seg of jaSegments) {
    if (seg.segmentKind === 'heading') {
      walkSection += 1;
      continue;
    }
    if (seg.line == null) continue;
    if (walkSection !== targetSection) continue;
    const distance = Math.abs(seg.line - targetLine);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { sectionIndex: walkSection, segment: seg };
    }
  }
  return best;
}

/**
 * Map a mutation_corpus mutation type to the diff signature(s) we expect
 * the alignment engine to emit when the mutation lands. The "right diff"
 * check uses this to verify that the engine doesn't just notice *some*
 * change in the affected section — it must specifically surface a diff
 * whose type and kind match the mutation's intent.
 */
const EXPECTED_DIFF_SIGNATURES = Object.freeze({
  'paragraph-delete': [{ type: 'segment-missing', kind: 'paragraph' }],
  'bullet-delete': [
    { type: 'segment-missing', kind: 'unordered-list-item' },
    // Bullets inside callouts are also valid targets.
    { type: 'segment-missing', kind: 'callout-body' },
  ],
  'step-delete': [{ type: 'segment-missing', kind: 'ordered-list-item' }],
  'callout-paragraph-delete': [
    { type: 'segment-missing', kind: 'callout-body' },
    { type: 'segment-missing', kind: 'unordered-list-item' },
    { type: 'segment-missing', kind: 'ordered-list-item' },
  ],
  'table-cell-delete': [{ type: 'segment-missing', kind: 'table-cell' }],
  'html-table-cell-delete': [{ type: 'segment-missing', kind: 'table-cell' }],
  'en-residual': [
    { type: 'segment-untranslated', kind: 'paragraph' },
    { type: 'segment-untranslated', kind: 'callout-body' },
    { type: 'segment-token-gap', kind: 'paragraph' },
  ],
  'token-drop': [
    { type: 'segment-token-gap' },
  ],
  // Cross-language move detection is best-effort: token-gap (when paragraphs
  // had tokens that swap visibility) is the strongest signal we get.
  'segment-move': [
    { type: 'segment-token-gap' },
    { type: 'segment-missing', kind: 'paragraph' },
    { type: 'segment-extra', kind: 'paragraph' },
  ],
  // Section body swap — the section-content validation pass should emit
  // `segment-shifted` when the swap leaves token sets disjoint. The fallback
  // signature catches partial swaps where tokens still overlap.
  'section-body-swap': [
    { type: 'segment-shifted' },
    { type: 'segment-token-gap' },
    { type: 'segment-missing' },
    { type: 'segment-extra' },
  ],
});

/**
 * Section-scoped + signature-aware detection.
 *
 * The mutation is "detected" if either of the following is true within
 * the affected section:
 *
 *   A. There is at least one NEW diff (under canonical identity) whose
 *      type and kind match the mutation's expected signature.
 *      → "the engine introduced a new diff in the right place".
 *
 *   B. There is at least one REMOVED baseline diff whose
 *      `jaSourceFingerprint` equals the affected JA segment's fingerprint.
 *      → "the engine had already flagged this segment as `segment-extra`,
 *        and the mutation made the surplus disappear". The deletion is
 *        still detected because the alignment correctly localized the
 *        affected segment in baseline.
 *
 * Either form proves the alignment knows about the change. The "right
 * fingerprint" requirement on (B) keeps the metric strict — a baseline
 * diff that disappears for unrelated LCS-shift reasons is not enough.
 *
 * Falls back to a global "any change" check when the mutation cannot be
 * localized to a specific JA segment (e.g. frontmatter mutation).
 */
function isMutationDetected(baselineDiffs, mutatedDiffs, affected, mutationType) {
  if (affected === null) {
    if (baselineDiffs.length !== mutatedDiffs.length) return true;
    const baselineSet = new Set(baselineDiffs.map(diffId));
    return mutatedDiffs.some((d) => !baselineSet.has(diffId(d)));
  }

  const sectionIndex = affected.sectionIndex;
  const affectedFingerprint = affected.segment.sourceFingerprint;

  const inSection = (d) => d.sectionIndex === sectionIndex;
  const baselineSection = baselineDiffs.filter(inSection);
  const mutatedSection = mutatedDiffs.filter(inSection);
  const baselineIds = new Set(baselineSection.map(diffId));
  const mutatedIds = new Set(mutatedSection.map(diffId));
  const newDiffs = mutatedSection.filter((d) => !baselineIds.has(diffId(d)));
  const removedDiffs = baselineSection.filter((d) => !mutatedIds.has(diffId(d)));

  // (A) — new diff matches expected signature
  const expected = EXPECTED_DIFF_SIGNATURES[mutationType];
  if (expected) {
    if (
      newDiffs.some((d) =>
        expected.some(
          (sig) => sig.type === d.type && (!sig.kind || sig.kind === d.segmentKind),
        ),
      )
    ) {
      return true;
    }
  } else if (newDiffs.length > 0) {
    return true;
  }

  // (B) — removed baseline diff fingerprints the affected segment
  if (removedDiffs.some((d) => d.jaSourceFingerprint === affectedFingerprint)) {
    return true;
  }

  return false;
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

    const affected = findAffectedSegment(
      jaSegmentsOriginal,
      mutation.metadata.lineIndex,
    );
    const affectedSectionIndex = affected ? affected.sectionIndex : null;

    const detected = isMutationDetected(
      baselineResult.diffs,
      mutatedResult.diffs,
      affected,
      type,
    );
    const cascade = cascadeSize(
      baselineResult.diffs,
      mutatedResult.diffs,
      affectedSectionIndex,
    );
    mutations[type] = {
      applicable: true,
      affectedSectionIndex: affectedSectionIndex ?? null,
      affectedSegmentKind: affected ? affected.segment.segmentKind : null,
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

/**
 * Mutations that legitimately span multiple segments (so the diff=1 cascade
 * limit does not apply). `section-body-swap` relocates an entire section's
 * worth of content and is expected to produce ~N diffs per swap.
 */
const MULTI_SEGMENT_MUTATION_TYPES = Object.freeze(new Set(['section-body-swap']));

function maxCascadeAcrossCorpus(pageRecords) {
  let max = 0;
  for (const page of pageRecords) {
    for (const [type, m] of Object.entries(page.mutations)) {
      if (!m.applicable) continue;
      if (MULTI_SEGMENT_MUTATION_TYPES.has(type)) continue;
      if (m.cascadeSize > max) max = m.cascadeSize;
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
