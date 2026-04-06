/**
 * Section-anchored exact diff engine for canonical segments (Issue #225 Phase 5).
 *
 * Compares an EN segment sequence to a JA segment sequence and emits exact
 * `parityDiff` records for each minimal divergence:
 *
 *   - segment-missing       EN has a body segment, JA does not
 *   - segment-extra         JA has a body segment, EN does not
 *   - segment-untranslated  JA segment is still in English
 *   - segment-token-gap     Matched JA segment is missing an EN invariant token
 *
 * The algorithm is intentionally conservative — its job is to surface diff=1
 * mutations introduced into the JA side without cascading. The high-level
 * pipeline is:
 *
 *   1. Filter both sequences to gate-eligible kinds (plus `heading` itself,
 *      because headings are the section anchors).
 *   2. Split each filtered sequence into sections at every heading boundary.
 *      The first section is the "preface" — segments before any heading.
 *   3. If the section counts disagree, return `inconclusive: true` so the
 *      caller can fall back to coarser signals instead of producing a
 *      cascade of bogus diffs across mis-aligned sections.
 *   4. For each (en, ja) section pair, run a Hunt-Szymanski / classic LCS over
 *      `segmentKind` to find the maximum matching. Unmatched EN body segments
 *      become `segment-missing`; unmatched JA body segments become
 *      `segment-extra` (or `segment-untranslated` when their text is still
 *      English-looking).
 *   5. For each LCS-matched pair, compare invariant tokens. EN tokens absent
 *      from JA are emitted as `segment-token-gap`. The JA side of the pair is
 *      additionally checked for `segment-untranslated` so a paragraph that
 *      kept the same kind but never got translated is still surfaced.
 *
 * Heading segments are NOT diffed individually — heading count parity is
 * already enforced by Phase 4's boundary tests, and the section split here is
 * what makes the within-section LCS local rather than global. The result is
 * "no cascade": a single mutation in one section produces ≤ a small constant
 * number of diffs and never bleeds into adjacent sections.
 *
 * Pure functions only: inputs are never mutated.
 *
 * @module source_parity_align
 */

import { GATE_ELIGIBLE_KINDS } from './source_parity_segments_shared.mjs';

const GATE_KIND_SET = new Set(GATE_ELIGIBLE_KINDS);

// CJK-ish ranges that signal "JA side has been translated".
// Hiragana, katakana, CJK unified ideographs, half/full-width, and
// CJK compatibility — broad enough that a properly-translated JA
// paragraph is never mistaken for English residue.
const CJK_RE = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/;

// Minimum prose length (after stripping invariant tokens and link refs)
// before a JA segment is allowed to be classified as untranslated. Short
// strings like `OK` or `URL:` would otherwise produce false positives.
const MIN_UNTRANSLATED_PROSE_LENGTH = 15;
const MIN_UNTRANSLATED_WORD_COUNT = 3;

// ---------------------------------------------------------------------------
// Section split
// ---------------------------------------------------------------------------

/**
 * @typedef {import('./source_parity_segments_shared.mjs').Segment} Segment
 */

/**
 * @typedef {object} Section
 * @property {number} index             0-based section index in document order
 * @property {string} sectionPath       sectionPath from the heading (or '' for preface)
 * @property {string} headingText       normalized heading text (or '' for preface)
 * @property {Segment[]} body           non-heading body segments under this section
 */

/**
 * Split a flat segment list into sections bounded by heading segments.
 * The first section is always the preface (segments before any heading);
 * its sectionPath / headingText are empty strings. Heading segments
 * themselves are NOT included in any section's body — they only define
 * section boundaries.
 *
 * @param {Segment[]} segments
 * @returns {Section[]}
 */
function splitIntoSections(segments) {
  const sections = [];
  let body = [];
  let sectionPath = '';
  let headingText = '';

  for (const seg of segments) {
    if (seg.segmentKind === 'heading') {
      sections.push({ index: sections.length, sectionPath, headingText, body });
      sectionPath = seg.sectionPath;
      headingText = seg.textNorm;
      body = [];
      continue;
    }
    body.push(seg);
  }
  sections.push({ index: sections.length, sectionPath, headingText, body });
  return sections;
}

/**
 * Filter to gate-eligible body kinds plus headings (the latter are needed as
 * section anchors). All other kinds — code-block, image, image-caption — are
 * dropped before alignment runs.
 *
 * @param {Segment[]} segments
 * @returns {Segment[]}
 */
function filterForAlignment(segments) {
  if (!Array.isArray(segments)) return [];
  return segments.filter(
    (s) => s && (s.segmentKind === 'heading' || GATE_KIND_SET.has(s.segmentKind)),
  );
}

// ---------------------------------------------------------------------------
// Local alignment — classic LCS over an arbitrary equality predicate
// ---------------------------------------------------------------------------

/**
 * Compute the longest common subsequence of two arrays under a custom
 * equality predicate, returning the matched index pairs in order.
 *
 * Time / space: O(n * m). For canonical segment sections (max ~100 entries
 * per section in practice) this is well below 10k operations and runs in
 * sub-millisecond time per section.
 *
 * @template T
 * @param {readonly T[]} a
 * @param {readonly T[]} b
 * @param {(x: T, y: T) => boolean} eq
 * @returns {Array<[number, number]>} matched (a-index, b-index) pairs
 */
function lcs(a, b, eq) {
  const n = a.length;
  const m = b.length;
  if (n === 0 || m === 0) return [];

  const width = m + 1;
  const dp = new Int32Array((n + 1) * width);

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const here = i * width + j;
      if (eq(a[i - 1], b[j - 1])) {
        dp[here] = dp[here - width - 1] + 1;
      } else {
        const up = dp[here - width];
        const left = dp[here - 1];
        dp[here] = up >= left ? up : left;
      }
    }
  }

  const matched = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (eq(a[i - 1], b[j - 1])) {
      matched.push([i - 1, j - 1]);
      i--;
      j--;
      continue;
    }
    const up = dp[(i - 1) * width + j];
    const left = dp[i * width + (j - 1)];
    if (up >= left) {
      i--;
    } else {
      j--;
    }
  }
  matched.reverse();
  return matched;
}

// ---------------------------------------------------------------------------
// Untranslated heuristic
// ---------------------------------------------------------------------------

/**
 * Decide whether a JA segment's normalized text looks like untranslated
 * English. Backtick-quoted invariants and link destinations are stripped
 * first so a normally-translated paragraph that contains a CLI flag or URL
 * is not mistaken for residue. The remainder must contain ≥ 15 prose
 * characters AND ≥ 3 word-like ASCII tokens AND zero CJK characters before
 * we flag it.
 *
 * @param {string} text  JA-side normalized text from createSegment
 */
function looksUntranslated(text) {
  if (typeof text !== 'string' || text.length < MIN_UNTRANSLATED_PROSE_LENGTH) {
    return false;
  }
  if (CJK_RE.test(text)) return false;

  const stripped = text
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\/docs\/\S+/g, ' ')
    .trim();

  if (stripped.length < MIN_UNTRANSLATED_PROSE_LENGTH) return false;

  const words = stripped.split(/\s+/).filter((word) => /[a-z]/i.test(word));
  if (words.length < MIN_UNTRANSLATED_WORD_COUNT) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Diff factories — keep the schema in one place
// ---------------------------------------------------------------------------

function buildSectionLabel(sectionPath) {
  return sectionPath || '(preface)';
}

function diffMissing(section, enSeg, enLocalIndex) {
  return {
    type: 'segment-missing',
    sectionPath: section.sectionPath,
    sectionIndex: section.index,
    segmentKind: enSeg.segmentKind,
    enIndex: enLocalIndex,
    jaIndex: null,
    enSegmentIndex: enSeg.segmentIndex,
    jaSegmentIndex: null,
    enSourceFingerprint: enSeg.sourceFingerprint,
    jaSourceFingerprint: null,
    detail: `EN ${enSeg.segmentKind} not found in JA section "${buildSectionLabel(section.sectionPath)}"`,
  };
}

function diffExtra(section, jaSeg, jaLocalIndex) {
  return {
    type: 'segment-extra',
    sectionPath: section.sectionPath,
    sectionIndex: section.index,
    segmentKind: jaSeg.segmentKind,
    enIndex: null,
    jaIndex: jaLocalIndex,
    enSegmentIndex: null,
    jaSegmentIndex: jaSeg.segmentIndex,
    enSourceFingerprint: null,
    jaSourceFingerprint: jaSeg.sourceFingerprint,
    detail: `JA ${jaSeg.segmentKind} has no EN counterpart in section "${buildSectionLabel(section.sectionPath)}"`,
  };
}

function diffUntranslated(section, jaSeg, jaLocalIndex, enSeg = null, enLocalIndex = null) {
  return {
    type: 'segment-untranslated',
    sectionPath: section.sectionPath,
    sectionIndex: section.index,
    segmentKind: jaSeg.segmentKind,
    enIndex: enLocalIndex,
    jaIndex: jaLocalIndex,
    enSegmentIndex: enSeg ? enSeg.segmentIndex : null,
    jaSegmentIndex: jaSeg.segmentIndex,
    enSourceFingerprint: enSeg ? enSeg.sourceFingerprint : null,
    jaSourceFingerprint: jaSeg.sourceFingerprint,
    detail: `JA ${jaSeg.segmentKind} appears to be untranslated English`,
  };
}

function diffTokenGap(section, enSeg, jaSeg, enLocalIndex, jaLocalIndex, missingTokens) {
  return {
    type: 'segment-token-gap',
    sectionPath: section.sectionPath,
    sectionIndex: section.index,
    segmentKind: enSeg.segmentKind,
    enIndex: enLocalIndex,
    jaIndex: jaLocalIndex,
    enSegmentIndex: enSeg.segmentIndex,
    jaSegmentIndex: jaSeg.segmentIndex,
    enSourceFingerprint: enSeg.sourceFingerprint,
    jaSourceFingerprint: jaSeg.sourceFingerprint,
    missingTokens,
    detail: `JA ${enSeg.segmentKind} is missing invariant tokens: ${missingTokens.join(', ')}`,
  };
}

// ---------------------------------------------------------------------------
// Per-section alignment
// ---------------------------------------------------------------------------

/**
 * Align two paired sections and return their diff list. Headings are NOT in
 * the body — section identity is implicit from positional pairing.
 *
 * @param {Section} enSection
 * @param {Section} jaSection
 * @returns {object[]}
 */
function alignSection(enSection, jaSection) {
  const diffs = [];
  const enBody = enSection.body;
  const jaBody = jaSection.body;

  const matched = lcs(enBody, jaBody, (a, b) => a.segmentKind === b.segmentKind);

  const enMatchedIndices = new Set();
  const jaMatchedIndices = new Set();
  for (const [eIdx, jIdx] of matched) {
    enMatchedIndices.add(eIdx);
    jaMatchedIndices.add(jIdx);
  }

  // Unmatched EN body segments → segment-missing.
  for (let i = 0; i < enBody.length; i++) {
    if (enMatchedIndices.has(i)) continue;
    diffs.push(diffMissing(enSection, enBody[i], i));
  }

  // Unmatched JA body segments → segment-extra OR segment-untranslated.
  for (let j = 0; j < jaBody.length; j++) {
    if (jaMatchedIndices.has(j)) continue;
    const seg = jaBody[j];
    if (looksUntranslated(seg.textNorm)) {
      diffs.push(diffUntranslated(enSection, seg, j));
    } else {
      diffs.push(diffExtra(enSection, seg, j));
    }
  }

  // Matched pairs — token-gap and inline untranslated.
  for (const [enIdx, jaIdx] of matched) {
    const enSeg = enBody[enIdx];
    const jaSeg = jaBody[jaIdx];

    const jaTokenSet = new Set(jaSeg.tokensInvariant ?? []);
    const enTokens = enSeg.tokensInvariant ?? [];
    const missingTokens = [];
    for (const token of enTokens) {
      if (!jaTokenSet.has(token)) missingTokens.push(token);
    }
    if (missingTokens.length > 0) {
      diffs.push(diffTokenGap(enSection, enSeg, jaSeg, enIdx, jaIdx, missingTokens));
    }

    if (looksUntranslated(jaSeg.textNorm)) {
      diffs.push(diffUntranslated(enSection, jaSeg, jaIdx, enSeg, enIdx));
    }
  }

  return diffs;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * @typedef {object} ParityDiff
 * @property {string} type            one of segment-missing | segment-extra | segment-untranslated | segment-token-gap
 * @property {string} sectionPath     EN-side section path
 * @property {number} sectionIndex    0-based section index in document order
 * @property {string} segmentKind     canonical kind of the affected segment
 * @property {number|null} enIndex    section-local EN body index
 * @property {number|null} jaIndex    section-local JA body index
 * @property {string} detail          human-readable summary
 * @property {string[]} [missingTokens] only on segment-token-gap
 */

/**
 * @typedef {object} AlignResult
 * @property {ParityDiff[]} diffs
 * @property {number} sectionsAligned        number of section pairs aligned
 * @property {number} sectionsCompared       number of section pairs compared (== aligned in current impl)
 * @property {boolean} inconclusive          true when alignment had to bail out
 * @property {string|null} inconclusiveReason
 */

/**
 * Align EN canonical segments to JA canonical segments and return the
 * resulting diff list. See module header for the algorithm.
 *
 * @param {Segment[]} enSegments
 * @param {Segment[]} jaSegments
 * @returns {AlignResult}
 */
export function alignSegments(enSegments, jaSegments) {
  const enFiltered = filterForAlignment(enSegments);
  const jaFiltered = filterForAlignment(jaSegments);

  const enSections = splitIntoSections(enFiltered);
  const jaSections = splitIntoSections(jaFiltered);

  if (enSections.length !== jaSections.length) {
    return {
      diffs: [],
      sectionsAligned: 0,
      sectionsCompared: 0,
      inconclusive: true,
      inconclusiveReason:
        `Heading count mismatch: EN has ${enSections.length - 1} headings, ` +
        `JA has ${jaSections.length - 1}`,
    };
  }

  const diffs = [];
  for (let i = 0; i < enSections.length; i++) {
    const sectionDiffs = alignSection(enSections[i], jaSections[i]);
    for (const diff of sectionDiffs) diffs.push(diff);
  }

  return {
    diffs,
    sectionsAligned: enSections.length,
    sectionsCompared: enSections.length,
    inconclusive: false,
    inconclusiveReason: null,
  };
}

// Re-exports for tests / consumers that need direct access to the helpers.
export { lcs as __lcs, looksUntranslated as __looksUntranslated, splitIntoSections as __splitIntoSections };
