/**
 * Section-anchored exact diff engine for canonical segments (Issue #225 Phase 5).
 *
 * Compares an EN segment sequence to a JA segment sequence and emits exact
 * `parityDiff` records for each minimal divergence:
 *
 *   - segment-missing       EN has a body segment, JA does not
 *   - segment-extra         JA has a body segment, EN does not
 *   - segment-shifted       Matched section pair appears to have swapped
 *                           bodies and cross-section token evidence exists
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
 *      if both sides have invariant tokens, the current pair is disjoint, AND
 *      there is symmetric cross-section destination evidence, the bodies were
 *      probably swapped between sections — emit a `segment-shifted` diff and
 *      skip the within-section LCS for that pair (its results would be
 *      misleading).
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
 * Scope boundary:
 *   Tokenless cross-section body swaps are intentionally outside the Phase 5
 *   exact gate. With EN as the source of truth, this module hard-gates
 *   section-local structural drift plus token-anchored cross-section shifts.
 *   When adjacent tokenless prose-only sections are too ambiguous to
 *   distinguish from a body swap, the module returns `inconclusive` rather
 *   than silently green-lighting the page. Fully resolving those cases still
 *   requires semantic evidence (translation memory, embeddings, etc.).
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
// Local alignment — weighted LCS that prefers strong content matches
// ---------------------------------------------------------------------------

/**
 * Compute the maximum-weight monotonic alignment of two arrays under a
 * scalar score function, returning the matched index pairs in order.
 * Conceptually a weighted Longest Common Subsequence: each candidate pair
 * (a[i], b[j]) has a `score` (≥ 0 to be considered a match), and the DP
 * finds the matching that maximizes the sum of scores along a monotonic
 * (i++, j++) path.
 *
 * Why weighted instead of plain boolean LCS:
 *   - The boolean predicate forces ties to be resolved by traceback bias
 *     (always picking the rightmost or leftmost match), which collapses
 *     middle deletions onto enIndex=0 / enIndex=N-1.
 *   - With per-pair scores we can express "fingerprint match >> token
 *     overlap >> position similarity" so the DP naturally pairs strong
 *     anchors first and lets weak position-aware fallbacks fill the gaps.
 *
 * Time / space: O(n * m). Sections in practice carry ≤ 100 segments, so
 * this stays sub-millisecond per section.
 *
 * @template T
 * @param {readonly T[]} a
 * @param {readonly T[]} b
 * @param {(x: T, y: T, i: number, j: number, n: number, m: number) => number} score
 * @returns {Array<[number, number]>} matched (a-index, b-index) pairs
 */
function weightedLcs(a, b, score) {
  const n = a.length;
  const m = b.length;
  if (n === 0 || m === 0) return [];

  // Pre-compute the score table once so traceback can re-read scores
  // without invoking the score function a second time.
  const scores = new Array(n);
  for (let i = 0; i < n; i++) {
    const row = new Float64Array(m);
    for (let j = 0; j < m; j++) {
      row[j] = score(a[i], b[j], i, j, n, m);
    }
    scores[i] = row;
  }

  const width = m + 1;
  const dp = new Float64Array((n + 1) * width);

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const here = i * width + j;
      const s = scores[i - 1][j - 1];
      const matchPath = s > 0 ? dp[here - width - 1] + s : -Infinity;
      const upPath = dp[here - width];
      const leftPath = dp[here - 1];
      let best = matchPath;
      if (upPath > best) best = upPath;
      if (leftPath > best) best = leftPath;
      dp[here] = best;
    }
  }

  const matched = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    const here = i * width + j;
    const s = scores[i - 1][j - 1];
    if (s > 0 && dp[here] === dp[here - width - 1] + s) {
      matched.push([i - 1, j - 1]);
      i--;
      j--;
      continue;
    }
    const up = dp[here - width];
    const left = dp[here - 1];
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

// Score weights — must satisfy STRONG > MEDIUM > WEAK so the weighted LCS
// always prefers a strong anchor over weaker fallbacks. The exact magnitudes
// only matter relative to each other.
const SCORE_FINGERPRINT_MATCH = 1000;
const SCORE_TEXTNORM_MATCH = 500;
const SCORE_TOKEN_OVERLAP_BASE = 100;
const SCORE_TOKEN_OVERLAP_PER_TOKEN = 10;
const SCORE_WEAK_POSITION_MAX = 10;
const SCORE_WEAK_LENGTH_MAX = 5;
const SCORE_KIND_FLOOR = 1;

/**
 * Compute a numeric match score for a candidate segment pair under the
 * weighted-LCS aligner. The hierarchy is:
 *
 *   1. `sourceFingerprint` equality (1000) — identical raw text. Rare
 *      cross-language but common for invariant-heavy lines and synthetic
 *      test fixtures.
 *   2. `textNorm` equality (500) — identical normalized prose.
 *   3. Invariant token overlap (100 + 10/token). Both sides must carry
 *      tokens. Disjoint token sets short-circuit to 0 — that is strong
 *      negative evidence and the pair must NOT be matched.
 *   4. Same-language penalty (0) — both sides ASCII-only with different
 *      `textNorm`. Almost certainly not the same content.
 *   5. Tokenless cross-language (1–15) — best-effort weak score from
 *      normalized position similarity AND length similarity. This is
 *      what fixes the kind-only LCS regression where a middle deletion
 *      collapsed onto enIndex=0: position-aware scoring naturally aligns
 *      EN[i] to JA[i] when the section has no other anchors.
 *   6. Floor of 1 (kind match with neither textual signals nor a useful
 *      position) — keeps the pair eligible but at the lowest possible
 *      weight so any other match wins ties.
 *
 * Returns 0 when segments must NOT be matched (different kinds, disjoint
 * tokens, ASCII-only with different text). The weighted LCS treats 0 as
 * a hard non-match.
 *
 * @param {Segment} en
 * @param {Segment} ja
 * @param {number} enLocalIndex   index of `en` within its section body
 * @param {number} jaLocalIndex   index of `ja` within its section body
 * @param {number} enSectionLen   total body length of the EN section
 * @param {number} jaSectionLen   total body length of the JA section
 * @returns {number}
 */
function scoreSegmentMatch(en, ja, enLocalIndex, jaLocalIndex, enSectionLen, jaSectionLen) {
  if (en.segmentKind !== ja.segmentKind) return 0;
  if (en.sourceFingerprint && en.sourceFingerprint === ja.sourceFingerprint) {
    return SCORE_FINGERPRINT_MATCH;
  }
  if (en.textNorm && en.textNorm === ja.textNorm) return SCORE_TEXTNORM_MATCH;

  const enTokens = en.tokensInvariant ?? [];
  const jaTokens = ja.tokensInvariant ?? [];
  if (enTokens.length > 0 && jaTokens.length > 0) {
    const jaSet = new Set(jaTokens);
    let overlap = 0;
    for (const token of enTokens) {
      if (jaSet.has(token)) overlap += 1;
    }
    if (overlap > 0) {
      return SCORE_TOKEN_OVERLAP_BASE + overlap * SCORE_TOKEN_OVERLAP_PER_TOKEN;
    }
    return 0; // disjoint tokens — strong non-match
  }

  // Same-language penalty: both sides ASCII-only with different text.
  if (en.textNorm && ja.textNorm && !CJK_RE.test(en.textNorm) && !CJK_RE.test(ja.textNorm)) {
    return 0;
  }

  // Tokenless cross-language: weak position + length similarity score.
  const positionScore = computeWeakPositionScore(
    enLocalIndex,
    jaLocalIndex,
    enSectionLen,
    jaSectionLen,
  );
  const lengthScore = computeWeakLengthScore(en.textNorm, ja.textNorm);
  return Math.max(SCORE_KIND_FLOOR, positionScore + lengthScore);
}

/**
 * Score how close two segment positions are within their respective
 * section bodies. Returns 0 when fully misaligned (one at the start, the
 * other at the end) and `SCORE_WEAK_POSITION_MAX` when normalized
 * positions match exactly. Sections of length ≤ 1 fall back to a flat
 * mid-range score because there is no positional information to use.
 */
function computeWeakPositionScore(i, j, n, m) {
  if (n <= 1 || m <= 1) return Math.floor(SCORE_WEAK_POSITION_MAX / 2);
  const enRatio = i / (n - 1);
  const jaRatio = j / (m - 1);
  const distance = Math.abs(enRatio - jaRatio);
  return Math.max(0, Math.round(SCORE_WEAK_POSITION_MAX * (1 - distance)));
}

/**
 * Score how similar the textual lengths of two segments are. JA tends to
 * be more concise than EN, so this is a soft hint rather than a strong
 * predictor. Returns 0 when both sides are empty (avoids divide-by-zero)
 * or when the ratio collapses to nothing.
 */
function computeWeakLengthScore(enText, jaText) {
  if (!enText || !jaText) return 0;
  const minLen = Math.min(enText.length, jaText.length);
  const maxLen = Math.max(enText.length, jaText.length);
  if (maxLen === 0) return 0;
  return Math.round(SCORE_WEAK_LENGTH_MAX * (minLen / maxLen));
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

const FREE_FORM_KINDS = Object.freeze(new Set(['paragraph', 'callout-body']));

function isAllFreeFormKinds(body) {
  if (body.length === 0) return false;
  for (const seg of body) {
    if (!FREE_FORM_KINDS.has(seg.segmentKind)) return false;
  }
  return true;
}

function isTokenlessBody(body) {
  if (body.length === 0) return false;
  for (const seg of body) {
    if ((seg.tokensInvariant ?? []).length > 0) return false;
  }
  return true;
}

function pairwiseLengthSimilaritySum(a, b) {
  const n = Math.min(a.length, b.length);
  let total = 0;
  for (let k = 0; k < n; k++) {
    const aLen = a[k].textNorm?.length ?? 0;
    const bLen = b[k].textNorm?.length ?? 0;
    if (aLen === 0 || bLen === 0) continue;
    total += Math.min(aLen, bLen) / Math.max(aLen, bLen);
  }
  return total;
}

const TOKENLESS_SWAP_AMBIGUITY_RELATIVE_MARGIN = 0.01;

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
    confidence: 'high',
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
 * Count how many tokens in `query` appear in `target`.
 *
 * @param {Set<string>} query
 * @param {Set<string>} target
 * @returns {number}
 */
function countTokenOverlap(query, target) {
  let overlap = 0;
  for (const token of query) {
    if (target.has(token)) overlap += 1;
  }
  return overlap;
}

function findBestCrossSectionMatch(queryTokens, candidateSets, currentIndex) {
  let bestIndex = -1;
  let bestOverlap = 0;
  let secondBestOverlap = 0;

  for (let k = 0; k < candidateSets.length; k++) {
    if (k === currentIndex) continue;
    const overlap = countTokenOverlap(queryTokens, candidateSets[k]);
    if (overlap > bestOverlap) {
      secondBestOverlap = bestOverlap;
      bestOverlap = overlap;
      bestIndex = k;
    } else if (overlap > secondBestOverlap) {
      secondBestOverlap = overlap;
    }
  }

  return { bestIndex, bestOverlap, secondBestOverlap };
}

/**
 * Look for evidence that this section's body was actually relocated to a
 * *different* section on the other side of the alignment. The check is
 * conservative on purpose: zero token overlap on its own is NOT enough
 * (a single mistranslated CLI flag would otherwise be flagged as a
 * structural shift). We require:
 *
 *   - The current section's en/ja token sets must be completely disjoint, AND
 *   - Some other EN section's tokens must overlap the current JA tokens at
 *     a meaningful threshold (≥ half of jaTokens, minimum 1 token), AND
 *   - Some other JA section's tokens must overlap the current EN tokens at
 *     the same threshold, AND
 *   - Both directions must identify the SAME destination section with a
 *     strictly better overlap than any second-best candidate.
 *
 * The uniqueness requirement is what lets a one-token section swap still be
 * classified as structural while suppressing common-token false positives.
 *
 * If all three hold, return the destination indices so the caller can
 * emit a single `segment-shifted` diff. Otherwise return `null` and the
 * caller should fall through to normal LCS — the section is suspect, but
 * the right answer is `segment-token-gap` / `segment-missing` /
 * `segment-extra`, not a structural shift.
 */
function findBodySwapEvidence({
  currentEnIndex,
  currentJaIndex,
  enSectionTokensList,
  jaSectionTokensList,
}) {
  const enTokens = enSectionTokensList[currentEnIndex];
  const jaTokens = jaSectionTokensList[currentJaIndex];
  if (enTokens.size === 0 || jaTokens.size === 0) return null;
  if (countTokenOverlap(enTokens, jaTokens) > 0) return null;

  const requireForJa = Math.max(1, Math.ceil(jaTokens.size * 0.5));
  const requireForEn = Math.max(1, Math.ceil(enTokens.size * 0.5));

  const bestEnDest = findBestCrossSectionMatch(jaTokens, enSectionTokensList, currentEnIndex);
  if (bestEnDest.bestOverlap < requireForJa) return null;
  if (bestEnDest.bestOverlap <= bestEnDest.secondBestOverlap) return null;

  const bestJaDest = findBestCrossSectionMatch(enTokens, jaSectionTokensList, currentJaIndex);
  if (bestJaDest.bestOverlap < requireForEn) return null;
  if (bestJaDest.bestOverlap <= bestJaDest.secondBestOverlap) return null;
  if (bestEnDest.bestIndex !== bestJaDest.bestIndex) return null;

  return {
    enDestIndex: bestEnDest.bestIndex,
    jaDestIndex: bestJaDest.bestIndex,
    enToOtherOverlap: bestJaDest.bestOverlap,
    jaToOtherOverlap: bestEnDest.bestOverlap,
  };
}

/**
 * When the page is otherwise clean, adjacent free-form tokenless sections may
 * still be too ambiguous to certify as "no drift". Only NEAR-TIE cases are
 * treated as ambiguous: if the current and swapped pairings are within a very
 * small relative margin under the only available non-semantic signal
 * (relative paragraph lengths), return an ambiguity record so the caller can
 * mark the page inconclusive instead of green.
 */
function detectAmbiguousAdjacentTokenlessSwap(enSections, jaSections, diffs) {
  if (diffs.length > 0) return null;

  for (let i = 0; i < enSections.length - 1; i++) {
    const j = i + 1;
    const enI = enSections[i].body;
    const jaI = jaSections[i].body;
    const enJ = enSections[j].body;
    const jaJ = jaSections[j].body;

    if (enI.length === 0 || jaI.length === 0 || enJ.length === 0 || jaJ.length === 0) continue;
    if (!isAllFreeFormKinds(enI) || !isAllFreeFormKinds(jaI)) continue;
    if (!isAllFreeFormKinds(enJ) || !isAllFreeFormKinds(jaJ)) continue;
    if (!isTokenlessBody(enI) || !isTokenlessBody(jaI)) continue;
    if (!isTokenlessBody(enJ) || !isTokenlessBody(jaJ)) continue;

    const currentScore =
      pairwiseLengthSimilaritySum(enI, jaI) + pairwiseLengthSimilaritySum(enJ, jaJ);
    const swapScore =
      pairwiseLengthSimilaritySum(enI, jaJ) + pairwiseLengthSimilaritySum(enJ, jaI);

    const relativeGap =
      currentScore > 0 ? Math.abs(swapScore - currentScore) / currentScore : 0;
    if (relativeGap <= TOKENLESS_SWAP_AMBIGUITY_RELATIVE_MARGIN) {
      return {
        leftSectionPath: enSections[i].sectionPath,
        rightSectionPath: enSections[j].sectionPath,
        currentScore,
        swapScore,
      };
    }
  }

  return null;
}

/**
 * Align two paired sections and return their diff list. Headings are NOT in
 * the body — section identity is implicit from positional pairing.
 *
 * Section-content validation runs first: when there is *symmetric* evidence
 * that the section bodies were swapped with another pair of sections (zero
 * overlap with the matched partner AND meaningful overlap with a different
 * partner on the other side), we emit a single `segment-shifted` diff and
 * skip the within-section LCS. Without that destination evidence we fall
 * through to LCS so a single mistranslated token surfaces as
 * `segment-token-gap` rather than a misleading `segment-shifted`.
 *
 * The body LCS itself is now a *weighted* alignment — see scoreSegmentMatch
 * for the score hierarchy. The previous boolean LCS collapsed middle
 * deletions onto enIndex=0 in tokenless sections; the position-aware
 * weighted scoring fixes that regression.
 *
 * @param {Section} enSection
 * @param {Section} jaSection
 * @param {{enSectionTokensList: Set<string>[], jaSectionTokensList: Set<string>[]}} crossSectionInfo
 * @returns {object[]}
 */
function alignSection(enSection, jaSection, crossSectionInfo) {
  const diffs = [];
  const enBody = enSection.body;
  const jaBody = jaSection.body;

  const swapEvidence = findBodySwapEvidence({
    currentEnIndex: enSection.index,
    currentJaIndex: jaSection.index,
    enSectionTokensList: crossSectionInfo.enSectionTokensList,
    jaSectionTokensList: crossSectionInfo.jaSectionTokensList,
  });
  if (swapEvidence) {
    const enTokens = crossSectionInfo.enSectionTokensList[enSection.index];
    const jaTokens = crossSectionInfo.jaSectionTokensList[jaSection.index];
    diffs.push(
      diffShifted(
        enSection,
        `EN section content best matches JA section #${swapEvidence.jaDestIndex} ` +
          `(${swapEvidence.enToOtherOverlap} token overlap), ` +
          `and JA section content best matches EN section #${swapEvidence.enDestIndex} ` +
          `(${swapEvidence.jaToOtherOverlap} token overlap) — likely body swap`,
        enTokens,
        jaTokens,
      ),
    );
    return diffs;
  }

  const matched = weightedLcs(enBody, jaBody, scoreSegmentMatch);

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
 * @property {string} [confidence]              only on segment-shifted: 'high' (destination evidence)
 * @property {string[]} [missingTokens]          only on segment-token-gap
 * @property {string[]} [enSectionTokens]        only on high-confidence segment-shifted
 * @property {string[]} [jaSectionTokens]        only on high-confidence segment-shifted
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

  // Pre-compute per-section invariant token sets so the section-content
  // validation pass in alignSection can run a cross-section best-match
  // check without re-walking sections O(n^2) times.
  const enSectionTokensList = enSections.map(collectSectionTokens);
  const jaSectionTokensList = jaSections.map(collectSectionTokens);
  const crossSectionInfo = { enSectionTokensList, jaSectionTokensList };

  const diffs = [];
  for (let i = 0; i < enSections.length; i++) {
    const sectionDiffs = alignSection(enSections[i], jaSections[i], crossSectionInfo);
    for (const diff of sectionDiffs) diffs.push(diff);
  }

  const ambiguousTokenlessSwap = detectAmbiguousAdjacentTokenlessSwap(
    enSections,
    jaSections,
    diffs,
  );
  if (ambiguousTokenlessSwap) {
    return {
      diffs: [],
      sectionsAligned: enSections.length,
      sectionsCompared: enSections.length,
      inconclusive: true,
      inconclusiveReason:
        `Tokenless adjacent sections "${buildSectionLabel(ambiguousTokenlessSwap.leftSectionPath)}" ` +
        `and "${buildSectionLabel(ambiguousTokenlessSwap.rightSectionPath)}" cannot rule out ` +
        `a body swap (current=${ambiguousTokenlessSwap.currentScore.toFixed(2)}, ` +
        `swap=${ambiguousTokenlessSwap.swapScore.toFixed(2)})`,
    };
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
    if (typeof diff.confidence === 'string') {
      issue.confidence = diff.confidence;
    }
    return issue;
  });
}

// Re-exports for tests / consumers that need direct access to the helpers.
export {
  weightedLcs as __weightedLcs,
  scoreSegmentMatch as __scoreSegmentMatch,
  looksUntranslated as __looksUntranslated,
  splitIntoSections as __splitIntoSections,
  findBodySwapEvidence as __findBodySwapEvidence,
};
