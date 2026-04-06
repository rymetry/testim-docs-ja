/**
 * Section-anchored exact diff engine for canonical segments (Issue #225 Phase 5).
 *
 * Compares an EN segment sequence to a JA segment sequence and emits exact
 * `parityDiff` records for each minimal divergence:
 *
 *   - segment-missing       EN has a body segment, JA does not
 *   - segment-extra         JA has a body segment, EN does not
 *   - segment-shifted       Matched section pair appears to have swapped
 *                           bodies (token sets are completely disjoint)
 *   - segment-untranslated  JA segment is still in English
 *   - segment-token-gap     Matched JA segment is missing an EN invariant token
 *
 * Algorithm
 * ---------
 *   1. Filter both sequences to gate-eligible kinds (plus `heading` itself,
 *      because headings are the section anchors).
 *   2. Split each filtered sequence into sections at every heading boundary.
 *      The first section is the "preface" — segments before any heading.
 *   3. If section counts disagree, return `inconclusive: true` so the caller
 *      can fall back to coarser signals instead of producing a cascade of
 *      bogus diffs across mis-aligned sections.
 *   4. For each (en, ja) section pair, run a section-content-validation pass:
 *      if both sides have invariant tokens but the token sets are completely
 *      disjoint, the bodies were probably swapped between sections — emit a
 *      `segment-shifted` diff and skip the within-section LCS for that pair
 *      (its results would be misleading).
 *   5. Otherwise, run a Hunt-Szymanski / classic LCS with a *content-aware*
 *      equality predicate (`segmentLikelyMatches`):
 *        a. Same kind is required.
 *        b. Identical sourceFingerprint OR identical textNorm → strong match
 *           (handles synthetic and rare exact-text-shared cross-language).
 *        c. Both sides have tokens that overlap → strong match.
 *        d. Both sides have tokens that DON'T overlap → strong non-match
 *           (these clearly aren't the same content).
 *        e. Otherwise (no distinguishing features) fall back to kind-only.
 *      The strong non-match rule is what stops the LCS from blindly pairing
 *      unrelated segments by kind alone — middle deletions in a section of
 *      distinguishable paragraphs now report the *correct* enIndex.
 *   6. Unmatched EN body segments → `segment-missing`. Unmatched JA body
 *      segments → `segment-extra` (or `segment-untranslated` when their
 *      text is still English-looking).
 *   7. For each LCS-matched pair, compare invariant tokens. EN tokens absent
 *      from JA are emitted as `segment-token-gap`. The JA side of the pair
 *      is additionally checked for `segment-untranslated` so a paragraph
 *      that kept the same kind but never got translated is still surfaced.
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
// Content-aware match predicate
// ---------------------------------------------------------------------------

/**
 * Decide whether two segments are likely the same canonical content. Used as
 * the LCS equality predicate. The hierarchy of evidence:
 *
 *   1. `sourceFingerprint` equality — identical raw text (rare cross-language
 *      but common in synthetic test fixtures and for invariant-heavy lines
 *      like CLI flag headers).
 *   2. `textNorm` equality — identical normalized prose (also rare cross-lang
 *      but happens when both sides keep an English brand name, error message,
 *      or feature-name verbatim).
 *   3. Invariant token overlap — the strongest cross-language signal we have.
 *      If both sides expose tokens AND they share at least one, the segments
 *      are very likely paired. If both sides expose tokens AND they share
 *      NONE, that is strong negative evidence: bail out with `false` so the
 *      LCS does not blindly pair them by kind alone.
 *   4. Same-language penalty: when neither side has CJK characters and
 *      neither side has any invariant tokens, both are presumably ASCII
 *      English. Differing `textNorm` is therefore meaningful and counts as
 *      a non-match. This is the rule that lets the LCS correctly identify
 *      *which* paragraph was deleted in a section of distinguishable
 *      English-only segments — without it, kind-only fallback would always
 *      pin the missing diff at enIndex=0.
 *   5. Otherwise (cross-language with no distinguishing features) fall
 *      back to kind equality. The result here is a best-effort guess, and
 *      consumers (including the recall benchmark) should treat per-segment
 *      positions in this regime as approximate.
 *
 * @param {Segment} en
 * @param {Segment} ja
 * @returns {boolean}
 */
function segmentLikelyMatches(en, ja) {
  if (en.segmentKind !== ja.segmentKind) return false;
  if (en.sourceFingerprint && en.sourceFingerprint === ja.sourceFingerprint) return true;
  if (en.textNorm && en.textNorm === ja.textNorm) return true;

  const enTokens = en.tokensInvariant ?? [];
  const jaTokens = ja.tokensInvariant ?? [];
  if (enTokens.length > 0 && jaTokens.length > 0) {
    const jaSet = new Set(jaTokens);
    for (const token of enTokens) {
      if (jaSet.has(token)) return true;
    }
    return false;
  }

  // Same-language penalty: both sides ASCII-only and textNorm differs.
  if (en.textNorm && ja.textNorm && !CJK_RE.test(en.textNorm) && !CJK_RE.test(ja.textNorm)) {
    return false;
  }

  return true;
}

/**
 * Aggregate the union of invariant tokens contributed by every body segment
 * in a section. Used by the section-content validation pass to detect body
 * swaps between sections that share heading levels and segment kind sequences.
 *
 * @param {Section} section
 * @returns {Set<string>}
 */
function collectSectionTokens(section) {
  const tokens = new Set();
  for (const seg of section.body) {
    for (const token of seg.tokensInvariant ?? []) tokens.add(token);
  }
  return tokens;
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

function diffShifted(section, sharedReason, enTokens, jaTokens) {
  return {
    type: 'segment-shifted',
    sectionPath: section.sectionPath,
    sectionIndex: section.index,
    segmentKind: 'section',
    enIndex: null,
    jaIndex: null,
    enSegmentIndex: null,
    jaSegmentIndex: null,
    enSourceFingerprint: null,
    jaSourceFingerprint: null,
    enSectionTokens: [...enTokens].sort(),
    jaSectionTokens: [...jaTokens].sort(),
    detail:
      `Section "${buildSectionLabel(section.sectionPath)}" appears mis-aligned: ` +
      sharedReason,
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
 * Section-content validation runs first: when both sections expose invariant
 * tokens but the two token sets are completely disjoint, the bodies have
 * almost certainly been swapped between sections (positional pairing failed
 * even though heading counts agree). In that case we emit a single
 * `segment-shifted` diff and skip the within-section LCS — the LCS would
 * happily pair every paragraph by kind alone and report 0 diffs, which is
 * the false negative this guard prevents.
 *
 * @param {Section} enSection
 * @param {Section} jaSection
 * @returns {object[]}
 */
function alignSection(enSection, jaSection) {
  const diffs = [];
  const enBody = enSection.body;
  const jaBody = jaSection.body;

  const enSectionTokens = collectSectionTokens(enSection);
  const jaSectionTokens = collectSectionTokens(jaSection);
  if (enSectionTokens.size > 0 && jaSectionTokens.size > 0) {
    let overlap = 0;
    for (const token of enSectionTokens) {
      if (jaSectionTokens.has(token)) {
        overlap += 1;
        break;
      }
    }
    if (overlap === 0) {
      diffs.push(
        diffShifted(
          enSection,
          'EN and JA invariant token sets have zero overlap (likely body swap)',
          enSectionTokens,
          jaSectionTokens,
        ),
      );
      return diffs;
    }
  }

  const matched = lcs(enBody, jaBody, segmentLikelyMatches);

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
 * @property {string} type                one of segment-missing | segment-extra | segment-shifted | segment-untranslated | segment-token-gap
 * @property {string} sectionPath         EN-side section path
 * @property {number} sectionIndex        0-based section index in document order
 * @property {string} segmentKind         canonical kind of the affected segment, or 'section' for segment-shifted
 * @property {number|null} enIndex        section-local EN body index
 * @property {number|null} jaIndex        section-local JA body index
 * @property {number|null} enSegmentIndex per-(section,kind) EN segment index from createSegment
 * @property {number|null} jaSegmentIndex per-(section,kind) JA segment index from createSegment
 * @property {string|null} enSourceFingerprint  sha256 fingerprint of the EN segment raw text
 * @property {string|null} jaSourceFingerprint  sha256 fingerprint of the JA segment raw text
 * @property {string} detail              human-readable summary
 * @property {string[]} [missingTokens]   only on segment-token-gap
 * @property {string[]} [enSectionTokens] only on segment-shifted
 * @property {string[]} [jaSectionTokens] only on segment-shifted
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

// ---------------------------------------------------------------------------
// Runtime adapter — convert ParityDiff records to the legacy issue shape
// ---------------------------------------------------------------------------

const SEGMENT_ISSUE_SEVERITY = Object.freeze({
  'segment-missing': 'actionable',
  'segment-extra': 'actionable',
  'segment-shifted': 'actionable',
  'segment-untranslated': 'actionable',
  'segment-token-gap': 'actionable',
});

/**
 * Convert ParityDiff records emitted by `alignSegments` into the legacy
 * `{ type, severity, detail, line? }` issue shape consumed by
 * `check_source_parity.mjs`, `tagIssuesWithAcknowledgements`, and
 * `summarizeParityResults`. Pure function — does not mutate inputs.
 *
 * Each diff is mapped 1:1 to one issue. The `detail` field carries the
 * section path (so the acknowledgement matcher's `detailIncludes` /
 * `detailRegex` can target specific sections), and any extra structured
 * metadata (`enSegmentIndex`, `jaSegmentIndex`, fingerprints, missingTokens)
 * is forwarded as-is so downstream reports can drill in.
 *
 * Each issue carries `phase: 'segment-shadow'` so the runtime gate can
 * distinguish Phase 5 shadow output from the legacy actionable signals.
 * Phase 6 will flip this to a primary gate. Phase 5's job is only to
 * prove the engine produces correct, verifiable output end-to-end.
 *
 * @param {ParityDiff[]} diffs
 * @returns {Array<object>}
 */
export function parityDiffsToIssues(diffs) {
  if (!Array.isArray(diffs)) return [];
  return diffs.map((diff) => {
    const sectionLabel = diff.sectionPath || '(preface)';
    const severity = SEGMENT_ISSUE_SEVERITY[diff.type] ?? 'actionable';
    const issue = {
      type: diff.type,
      severity,
      phase: 'segment-shadow',
      detail: `[${sectionLabel}] ${diff.detail}`,
      sectionPath: diff.sectionPath,
      sectionIndex: diff.sectionIndex,
      segmentKind: diff.segmentKind,
      enSegmentIndex: diff.enSegmentIndex ?? null,
      jaSegmentIndex: diff.jaSegmentIndex ?? null,
      enSourceFingerprint: diff.enSourceFingerprint ?? null,
      jaSourceFingerprint: diff.jaSourceFingerprint ?? null,
    };
    if (Array.isArray(diff.missingTokens)) {
      issue.missingTokens = [...diff.missingTokens];
    }
    if (Array.isArray(diff.enSectionTokens)) {
      issue.enSectionTokens = [...diff.enSectionTokens];
      issue.jaSectionTokens = [...(diff.jaSectionTokens ?? [])];
    }
    return issue;
  });
}

// Re-exports for tests / consumers that need direct access to the helpers.
export { lcs as __lcs, looksUntranslated as __looksUntranslated, splitIntoSections as __splitIntoSections };
