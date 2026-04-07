/**
 * Section-level canonical block sequence comparator (Issue #247 PR2).
 *
 * `compareSectionStructure(enSection, jaSection)` runs three staged checks
 * over a paired (EN, JA) section body and returns at most ONE section-level
 * parity diff. The staging is:
 *
 *   Stage A — kind-multiset (section-structure-mismatch)
 *     The block kind multisets disagree. Covers paragraph merge/split,
 *     list→paragraph collapse, callout→paragraph collapse, table→paragraph
 *     collapse, and ordered↔unordered list swaps.
 *
 *   Stage B — kind-sequence (segment-order-mismatch)
 *     The multisets match but the block kind sequence order differs
 *     (mixed-kind reorder such as [p, ul] vs [ul, p]).
 *
 *   Stage C — content-order (segment-order-mismatch)
 *     The block kind sequences are identical, but an all-pairs
 *     content-match bijection is non-monotonic. Covers pure same-kind
 *     swaps and cyclic rotations that carry stable invariant tokens.
 *     Tokenless prose-only swaps are intentionally NOT detected here
 *     (the comparator cannot distinguish them from an independent rewrite
 *     without semantic evidence; the existing LCS handles those).
 *
 * When none of the stages fires, the comparator returns an empty array
 * and the caller (`alignSegments`) falls through to the existing weighted
 * LCS. At most one diff per section is emitted — the first stage to fire
 * wins, later stages are short-circuited.
 *
 * Block-level vocabulary
 * ----------------------
 * The comparator operates on BLOCK kinds, not segment kinds. Consecutive
 * segments of a collapsible source kind fold into a single block before
 * comparison:
 *
 *   ordered-list-item × N   → 'ordered-list'
 *   unordered-list-item × N → 'unordered-list'
 *   table-cell × N          → 'table'
 *
 * `paragraph`, `callout-body`, and `details-summary` are 1:1 (each segment
 * is its own block). This separation is deliberate: within-block drift
 * (list item count, table cell count) is owned by other comparators —
 * the structure comparator is strictly about block sequence.
 *
 * Issue payload contract (PR5 baseline identity surface)
 * ------------------------------------------------------
 * See `STRUCTURE_DIFF_CONTRACT_FIELDS` and the unit test file for the
 * frozen shape. Do NOT rename, reorder, or remove fields without
 * coordinating a baseline schema bump in PR5.
 *
 * Pure functions only: inputs are never mutated.
 *
 * @module source_parity_structure
 */

import { scoreSegmentMatch } from './source_parity_align_scoring.mjs';

// ---------------------------------------------------------------------------
// Block kind vocabulary — FROZEN
// ---------------------------------------------------------------------------

/**
 * Block-level kind vocabulary used by the structure comparator in
 * `enKinds` / `jaKinds`. This set is PINNED by a regression test in
 * `source_parity_structure.test.mjs` because PR5 will hash
 * `enKinds.join('|')` / `jaKinds.join('|')` into baseline identity keys.
 * Adding, removing, or renaming an entry is a breaking change that must
 * be accompanied by a baseline schema bump.
 */
export const STRUCTURE_COMPARATOR_KINDS = Object.freeze([
  'paragraph',
  'ordered-list',
  'unordered-list',
  'callout-body',
  'table',
  'details-summary',
]);

const STRUCTURE_KIND_SET = new Set(STRUCTURE_COMPARATOR_KINDS);

/**
 * Map from segment kind (as emitted by the canonical extractors) to the
 * block kind the structure comparator uses. Kinds not in this map are
 * dropped during collapsing (e.g. image, code-block, image-caption).
 */
const SEGMENT_TO_BLOCK_KIND = Object.freeze({
  paragraph: 'paragraph',
  'ordered-list-item': 'ordered-list',
  'unordered-list-item': 'unordered-list',
  'callout-body': 'callout-body',
  'table-cell': 'table',
  'details-summary': 'details-summary',
});

/**
 * Collapsible source kinds — consecutive segments of these source kinds
 * fold into a single block. Non-collapsible source kinds (paragraph,
 * callout-body, details-summary) produce one block per segment.
 */
const COLLAPSIBLE_SOURCE_KINDS = new Set([
  'ordered-list-item',
  'unordered-list-item',
  'table-cell',
]);

// ---------------------------------------------------------------------------
// Score threshold for Stage C content bijection
// ---------------------------------------------------------------------------

/**
 * Minimum match score required for a pair to be considered a "strong"
 * content anchor during Stage C content-order detection. This threshold
 * is chosen to require at least a token-overlap-level match — tokenless
 * weak-position scores (1–15) fall below this and a section of pure
 * prose therefore fails the bijection, forcing a fall-through to LCS.
 *
 * See `scoreSegmentMatch` in source_parity_align_scoring.mjs for the
 * score hierarchy. This threshold MUST stay above the tokenless weak
 * position score range to preserve the "we never guess a swap without
 * invariant-token evidence" contract.
 */
const CONTENT_ORDER_MIN_SCORE = 100;

// ---------------------------------------------------------------------------
// Block collapsing
// ---------------------------------------------------------------------------

/**
 * @typedef {import('./source_parity_segments_shared.mjs').Segment} Segment
 */

/**
 * @typedef {object} StructureBlock
 * @property {string} kind               a STRUCTURE_COMPARATOR_KINDS entry
 * @property {Segment[]} segments        source segments folded into this block
 */

/**
 * Walk a section body and fold consecutive same-kind collapsible segments
 * into one block. Non-collapsible segments become 1:1 blocks. Segments
 * whose kind is not in SEGMENT_TO_BLOCK_KIND are dropped (they are not
 * part of the structure vocabulary — e.g. image, code-block).
 *
 * Pure function — does not mutate `body`.
 *
 * @param {Segment[]} body
 * @returns {StructureBlock[]}
 */
function collapseBodyToBlocks(body) {
  if (!Array.isArray(body) || body.length === 0) return [];
  const blocks = [];
  for (const seg of body) {
    const blockKind = SEGMENT_TO_BLOCK_KIND[seg.segmentKind];
    if (!blockKind) continue;

    if (COLLAPSIBLE_SOURCE_KINDS.has(seg.segmentKind)) {
      const last = blocks[blocks.length - 1];
      if (last && last.kind === blockKind && last.sourceKind === seg.segmentKind) {
        last.segments.push(seg);
        continue;
      }
      blocks.push({ kind: blockKind, sourceKind: seg.segmentKind, segments: [seg] });
    } else {
      blocks.push({ kind: blockKind, sourceKind: seg.segmentKind, segments: [seg] });
    }
  }
  // Drop the internal sourceKind discriminator — consumers only see
  // { kind, segments }.
  return blocks.map(({ kind, segments }) => ({ kind, segments }));
}

// ---------------------------------------------------------------------------
// Multiset / sequence helpers
// ---------------------------------------------------------------------------

function buildMultiset(items) {
  const counts = new Map();
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return counts;
}

function multisetsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const [key, count] of a) {
    if (b.get(key) !== count) return false;
  }
  return true;
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const value of a) {
    if (!b.has(value)) return false;
  }
  return true;
}

function sequencesEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Stage C — content-order bijection
// ---------------------------------------------------------------------------

/**
 * Greedy all-pairs bijection from EN blocks to JA blocks using the
 * existing scoreSegmentMatch function as the match strength oracle.
 *
 * Only fires when the block kind sequences are identical (the caller
 * enforces this). Blocks that folded multiple segments use their FIRST
 * segment as the representative — within-block drift is handled by the
 * LCS, not this comparator.
 *
 * Returns a permutation `[{enIndex, jaIndex, score}]` when a strong
 * bijection exists and is non-identity; returns `null` otherwise so the
 * caller falls through to LCS.
 *
 * @param {StructureBlock[]} enBlocks
 * @param {StructureBlock[]} jaBlocks
 * @returns {Array<{enIndex: number, jaIndex: number, score: number}> | null}
 */
function detectContentOrderPermutation(enBlocks, jaBlocks) {
  const n = enBlocks.length;
  if (n < 2 || n !== jaBlocks.length) return null;

  // Representative segment for each block — take the first segment. This
  // is the stable choice: it matches the LCS's per-segment scoring
  // without having to combine tokens across multiple segments of a list
  // block (combining would blur the content signal).
  const enReps = enBlocks.map((b) => b.segments[0] ?? null);
  const jaReps = jaBlocks.map((b) => b.segments[0] ?? null);
  if (enReps.some((s) => s == null) || jaReps.some((s) => s == null)) return null;

  // Build all-pairs score matrix. scoreSegmentMatch requires matching
  // segmentKind — since we only run when kind sequences are identical,
  // same-index pairs always satisfy that constraint; cross-index pairs
  // depend on the section's own kind pattern (e.g. [p, p] lets any pair
  // match by kind; [p, ul] only lets same-index pairs match).
  const scores = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      scores[i][j] = scoreSegmentMatch(enReps[i], jaReps[j], i, j, n, n);
    }
  }

  // Collect all strong candidate pairs, sorted by score descending. Then
  // greedily assign. For the small section sizes we see in practice
  // (typically ≤ 10 blocks), greedy is optimal enough and avoids the
  // complexity of the Hungarian algorithm.
  const candidates = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (scores[i][j] >= CONTENT_ORDER_MIN_SCORE) {
        candidates.push({ enIndex: i, jaIndex: j, score: scores[i][j] });
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score);

  const permutation = [];
  const usedEn = new Set();
  const usedJa = new Set();
  for (const cand of candidates) {
    if (usedEn.has(cand.enIndex) || usedJa.has(cand.jaIndex)) continue;
    permutation.push(cand);
    usedEn.add(cand.enIndex);
    usedJa.add(cand.jaIndex);
    if (permutation.length === n) break;
  }

  if (permutation.length !== n) return null; // not a full bijection — fall through

  // Check for non-identity. If every enIndex equals its jaIndex the
  // permutation is monotonic and we should NOT emit a content-order diff.
  permutation.sort((a, b) => a.enIndex - b.enIndex);
  let isIdentity = true;
  for (let i = 0; i < permutation.length; i++) {
    if (permutation[i].enIndex !== permutation[i].jaIndex) {
      isIdentity = false;
      break;
    }
  }
  if (isIdentity) return null;

  return permutation;
}

// ---------------------------------------------------------------------------
// Diff factories
// ---------------------------------------------------------------------------

function buildBaseDiff({ type, section, enKinds, jaKinds, structureCategory, detail }) {
  return {
    type,
    severity: 'actionable',
    scope: 'section',
    sectionPath: section.sectionPath,
    sectionIndex: section.index,
    structureCategory,
    enKinds,
    jaKinds,
    enSegmentCount: enKinds.length,
    jaSegmentCount: jaKinds.length,
    detail,
  };
}

function describeKindSequence(kinds) {
  if (kinds.length === 0) return '(empty)';
  return kinds.join(' → ');
}

function buildKindMultisetDiff(enSection, jaSection, enKinds, jaKinds) {
  const detail =
    `Section "${enSection.sectionPath || '(preface)'}" block structure differs: ` +
    `EN=[${describeKindSequence(enKinds)}] vs JA=[${describeKindSequence(jaKinds)}]`;
  return buildBaseDiff({
    type: 'section-structure-mismatch',
    section: enSection,
    enKinds,
    jaKinds,
    structureCategory: 'kind-multiset',
    detail,
  });
}

function buildKindSequenceDiff(enSection, jaSection, enKinds, jaKinds) {
  const detail =
    `Section "${enSection.sectionPath || '(preface)'}" block kinds reordered: ` +
    `EN=[${describeKindSequence(enKinds)}] vs JA=[${describeKindSequence(jaKinds)}]`;
  return buildBaseDiff({
    type: 'segment-order-mismatch',
    section: enSection,
    enKinds,
    jaKinds,
    structureCategory: 'kind-sequence',
    detail,
  });
}

function buildContentOrderDiff(enSection, jaSection, enKinds, jaKinds, permutation) {
  const permDesc = permutation
    .slice()
    .sort((a, b) => a.enIndex - b.enIndex)
    .map((p) => `${p.enIndex}->${p.jaIndex}`)
    .join(', ');
  const detail =
    `Section "${enSection.sectionPath || '(preface)'}" blocks reordered by content: ${permDesc}`;
  const base = buildBaseDiff({
    type: 'segment-order-mismatch',
    section: enSection,
    enKinds,
    jaKinds,
    structureCategory: 'content-order',
    detail,
  });
  base.contentPermutation = permutation;
  return base;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * @typedef {object} StructureDiff
 * @property {'section-structure-mismatch' | 'segment-order-mismatch'} type
 * @property {'actionable'} severity
 * @property {'section'} scope
 * @property {string} sectionPath
 * @property {number} sectionIndex
 * @property {'kind-multiset' | 'kind-sequence' | 'content-order'} structureCategory
 * @property {string[]} enKinds
 * @property {string[]} jaKinds
 * @property {number} enSegmentCount
 * @property {number} jaSegmentCount
 * @property {string} detail
 * @property {Array<{enIndex: number, jaIndex: number, score: number}>} [contentPermutation]
 */

/**
 * Compare a paired (EN, JA) section body and return at most one
 * section-level structure diff. See module header for the staging rules.
 *
 * @param {{index: number, sectionPath: string, body: Segment[]}} enSection
 * @param {{index: number, sectionPath: string, body: Segment[]}} jaSection
 * @returns {StructureDiff[]}  empty = no structure issue, caller runs LCS
 */
export function compareSectionStructure(enSection, jaSection) {
  if (!enSection || !jaSection) return [];

  const enBlocks = collapseBodyToBlocks(enSection.body ?? []);
  const jaBlocks = collapseBodyToBlocks(jaSection.body ?? []);

  const enKinds = enBlocks.map((b) => b.kind);
  const jaKinds = jaBlocks.map((b) => b.kind);

  // Guard — every emitted kind must be in the frozen vocabulary.
  for (const kind of [...enKinds, ...jaKinds]) {
    if (!STRUCTURE_KIND_SET.has(kind)) {
      throw new Error(
        `compareSectionStructure: unexpected block kind "${kind}" ` +
          `(must be one of STRUCTURE_COMPARATOR_KINDS)`,
      );
    }
  }

  // Empty-body short circuit. When one side has zero blocks, there is
  // no structural information on that side to compare against — the
  // drift is a pure translation gap (or a pure addition) that the
  // weighted LCS expresses precisely as segment-missing /
  // segment-extra. Firing a structure mismatch here would strip the
  // per-segment detail reviewers rely on. Fall through instead.
  if (enBlocks.length === 0 || jaBlocks.length === 0) {
    return [];
  }

  // Stage A — CROSS-KIND structural drift.
  //
  // Stage A is the home of drift that changes WHICH kinds are present:
  // list→paragraph collapse, callout→paragraph collapse,
  // details-summary loss, ordered↔unordered list swap. Count-only drift
  // within the same set of kinds (e.g. "one paragraph was deleted from
  // a section that still has paragraphs + list items + callouts on
  // both sides") is INTENTIONALLY OUT OF SCOPE and stays with the
  // weighted LCS, because:
  //   1. LCS emits per-segment drill-down (which EN paragraph was
  //      dropped) that reviewers and the recall test suite depend on,
  //      and a section-level structure mismatch would erase it.
  //   2. Recall fixtures for paragraph-delete / bullet-delete /
  //      step-delete / callout-paragraph-delete / html-table-cell-delete
  //      are exactly this "single-item deletion inside a multi-kind
  //      section" shape and must remain segment-missing.
  //
  // Therefore Stage A fires exclusively when the kind SET differs. If
  // both sides have the same set of distinct kinds, the drift is a
  // count change inside an existing kind vocabulary and belongs to LCS.
  const enKindSet = new Set(enKinds);
  const jaKindSet = new Set(jaKinds);
  if (!setsEqual(enKindSet, jaKindSet)) {
    return [buildKindMultisetDiff(enSection, jaSection, enKinds, jaKinds)];
  }

  // Stage B — kind sequence (same multiset, different order).
  //
  // Stage B only runs when the multisets already match — otherwise a
  // length mismatch would masquerade as a "reorder". Count drift that
  // fell through Stage A (same kind set, different counts) must keep
  // falling through to LCS, not be caught here.
  const enMultiset = buildMultiset(enKinds);
  const jaMultiset = buildMultiset(jaKinds);
  if (multisetsEqual(enMultiset, jaMultiset) && !sequencesEqual(enKinds, jaKinds)) {
    return [buildKindSequenceDiff(enSection, jaSection, enKinds, jaKinds)];
  }

  // Stage C — content-order bijection. Kind sequences must be
  // identical here (otherwise Stage B would have fired, or multisets
  // differ and we're falling through to LCS).
  if (sequencesEqual(enKinds, jaKinds)) {
    const permutation = detectContentOrderPermutation(enBlocks, jaBlocks);
    if (permutation) {
      return [buildContentOrderDiff(enSection, jaSection, enKinds, jaKinds, permutation)];
    }
  }

  return [];
}

// Re-exports for tests.
export { collapseBodyToBlocks as __collapseBodyToBlocks };
