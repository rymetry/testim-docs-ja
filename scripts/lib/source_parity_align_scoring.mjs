/**
 * Shared content-aware pair scoring for the alignment + structure
 * comparators (Issue #247 PR2).
 *
 * `scoreSegmentMatch` is the pair-level equality oracle used by:
 *   - `source_parity_align.mjs` — weighted LCS inside each section body
 *   - `source_parity_structure.mjs` — content-order bijection for Stage C
 *
 * Extracted into its own module so both comparators share a single
 * scoring hierarchy (fingerprint > textNorm > token overlap > weak
 * position/length > kind floor) without a circular dependency between
 * align.mjs and structure.mjs.
 *
 * Pure functions only. No mutation, no I/O.
 *
 * @module source_parity_align_scoring
 */

// CJK-ish ranges that signal "JA side has been translated".
// Hiragana, katakana, CJK unified ideographs, half/full-width, and
// CJK compatibility — broad enough that a properly-translated JA
// paragraph is never mistaken for English residue.
export const CJK_RE =
  /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/;

// Score weights — must satisfy STRONG > MEDIUM > WEAK so the weighted
// LCS always prefers a strong anchor over weaker fallbacks. The exact
// magnitudes only matter relative to each other.
export const SCORE_FINGERPRINT_MATCH = 1000;
export const SCORE_TEXTNORM_MATCH = 500;
export const SCORE_TOKEN_OVERLAP_BASE = 100;
export const SCORE_TOKEN_OVERLAP_PER_TOKEN = 10;
export const SCORE_WEAK_POSITION_MAX = 10;
export const SCORE_WEAK_LENGTH_MAX = 5;
export const SCORE_KIND_FLOOR = 1;

/**
 * Score how close two segment positions are within their respective
 * section bodies. Returns 0 when fully misaligned (one at the start, the
 * other at the end) and `SCORE_WEAK_POSITION_MAX` when normalized
 * positions match exactly. Sections of length ≤ 1 fall back to a flat
 * mid-range score because there is no positional information to use.
 */
export function computeWeakPositionScore(i, j, n, m) {
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
export function computeWeakLengthScore(enText, jaText) {
  if (!enText || !jaText) return 0;
  const minLen = Math.min(enText.length, jaText.length);
  const maxLen = Math.max(enText.length, jaText.length);
  if (maxLen === 0) return 0;
  return Math.round(SCORE_WEAK_LENGTH_MAX * (minLen / maxLen));
}

/**
 * Compute a numeric match score for a candidate segment pair under the
 * weighted-LCS / content-bijection aligners. The hierarchy is:
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
 * tokens, ASCII-only with different text). The weighted LCS and the
 * structure comparator both treat 0 as a hard non-match.
 *
 * @param {import('./source_parity_segments_shared.mjs').Segment} en
 * @param {import('./source_parity_segments_shared.mjs').Segment} ja
 * @param {number} enLocalIndex
 * @param {number} jaLocalIndex
 * @param {number} enSectionLen
 * @param {number} jaSectionLen
 * @returns {number}
 */
export function scoreSegmentMatch(
  en,
  ja,
  enLocalIndex,
  jaLocalIndex,
  enSectionLen,
  jaSectionLen,
) {
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
