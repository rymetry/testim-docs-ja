/**
 * Tests for the canonical block-sequence structure comparator
 * (Issue #247 PR2).
 *
 * `compareSectionStructure(enSection, jaSection)` runs three staged checks
 * over a single (EN, JA) section body pair and returns at most one
 * section-level parity diff:
 *
 *   Stage A — kind-multiset
 *     Body kind multisets differ (merge/split/collapse across kinds).
 *     Emits `section-structure-mismatch`.
 *
 *   Stage B — kind-sequence
 *     Multisets match but the kind sequence order differs
 *     (mixed-kind reorder).
 *     Emits `segment-order-mismatch`.
 *
 *   Stage C — content-order
 *     Kind sequence is identical but the best-effort content bijection
 *     is not monotonic (pure same-kind swap / rotation).
 *     Emits `segment-order-mismatch`.
 *
 * When none of the stages fires, the comparator returns an empty array
 * and the caller (alignSegments) falls through to the existing weighted
 * LCS. At most ONE diff per section is emitted — the first stage that
 * fires wins, later stages are short-circuited. This keeps the cascade
 * suppression contract predictable for PR4 gate cutover.
 *
 * Issue payload contract pinned here (PR5 baseline identity key will be
 * derived from these fields — do NOT remove or rename without updating
 * the baseline loader in the same PR):
 *
 *   sectionPath          — heading path of the affected section
 *   sectionIndex         — 0-based section index in document order
 *   scope                — always 'section' (distinguishes structure issues
 *                          from segment-level diffs — do NOT reuse the
 *                          existing `segmentKind` field, which carries
 *                          block kinds like 'paragraph' elsewhere and would
 *                          confuse matchers and baseline keys)
 *   structureCategory    — 'kind-multiset' | 'kind-sequence' | 'content-order'
 *   enKinds              — BLOCK-level kind sequence of EN section body.
 *                          VOCABULARY IS FROZEN — see STRUCTURE_COMPARATOR_KINDS
 *                          re-export from source_parity_structure.mjs.
 *                          The allowed set is:
 *                            paragraph | ordered-list | unordered-list |
 *                            callout-body | table | details-summary
 *                          Segment-level kinds (ordered-list-item,
 *                          unordered-list-item, table-cell) are COLLAPSED
 *                          to their block counterparts before comparison:
 *                          consecutive list items fold into one list
 *                          block, consecutive table cells fold into one
 *                          table block. Paragraph / callout-body /
 *                          details-summary are 1:1 with their segments.
 *                          Within-block shape drift (list item count,
 *                          table cell count) is intentionally owned by
 *                          other comparators — the structure comparator
 *                          is strictly about block sequence.
 *                          PR5 baseline identity keys will hash
 *                          enKinds.join('|'), so adding a new kind to
 *                          the vocabulary is a breaking change that must
 *                          bump the baseline schema.
 *   jaKinds              — gate-eligible kind sequence of JA section body
 *   enSegmentCount       — enKinds.length (frozen for baseline stability)
 *   jaSegmentCount       — jaKinds.length
 *   detail               — human-readable summary ONLY (free text, never
 *                          read by baseline/ack matchers)
 *   contentPermutation?  — only on content-order: Array<{enIndex, jaIndex, score}>.
 *                          `score` is DIAGNOSTIC-ONLY — threshold tweaks and
 *                          scoring algorithm changes are allowed to shift it.
 *                          PR5 baseline identity MUST NOT hash `score`; only
 *                          the (enIndex, jaIndex) permutation entries are
 *                          stable enough to key off.
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let compareSectionStructure;
let STRUCTURE_COMPARATOR_KINDS;
let createSegment;

before(async () => {
  ({ compareSectionStructure, STRUCTURE_COMPARATOR_KINDS } = await import(
    '../lib/source_parity_structure.mjs'
  ));
  ({ createSegment } = await import('../lib/source_parity_segments_shared.mjs'));
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSeg(sectionPath, kind, segmentIndex, rawText) {
  return createSegment({ sectionPath, kind, segmentIndex, rawText });
}

/**
 * Build a minimal Section record the way source_parity_align splits it.
 * Only the fields the structure comparator reads are populated.
 */
function makeSection({ index = 0, sectionPath = 'Overview', body = [] } = {}) {
  return {
    index,
    sectionPath,
    headingText: sectionPath.toLowerCase(),
    body,
  };
}

function singleDiff(result) {
  assert.equal(Array.isArray(result), true, 'comparator must return an array');
  assert.equal(result.length, 1, `expected exactly 1 diff, got ${result.length}`);
  return result[0];
}

// ---------------------------------------------------------------------------
// Stage A — kind-multiset (section-structure-mismatch)
// ---------------------------------------------------------------------------

describe('Stage A — kind-multiset (section-structure-mismatch)', () => {
  // Stage A is the home of CROSS-KIND drift: list→paragraph collapse,
  // callout→paragraph collapse, details-summary loss, ordered↔unordered
  // swaps. Pure same-single-kind count drift (N paragraphs → M
  // paragraphs, no other kinds) is intentionally handled by the
  // existing weighted LCS as segment-missing / segment-extra, so the
  // structure comparator does NOT double-count it. The first two tests
  // pin that contract explicitly.

  it('A1 same-single-kind count drift (3 EN paragraphs → 1 JA paragraph) is handled by LCS, not structure comparator', () => {
    const en = makeSection({
      sectionPath: 'Overview',
      body: [
        makeSeg('Overview', 'paragraph', 0, 'First English paragraph with `CLI` token.'),
        makeSeg('Overview', 'paragraph', 1, 'Second English paragraph about `network-logs`.'),
        makeSeg('Overview', 'paragraph', 2, 'Third paragraph referencing `flag`.'),
      ],
    });
    const ja = makeSection({
      sectionPath: 'Overview',
      body: [
        makeSeg('Overview', 'paragraph', 0, 'CLI と network-logs と flag を 1 段落にまとめた翻訳'),
      ],
    });
    // No structure diff — this is segment-missing territory, owned by
    // source_parity_align.mjs. The integration test in
    // source_parity_align.test.mjs asserts the segment-missing shape.
    assert.deepEqual(
      compareSectionStructure(en, ja),
      [],
      'pure same-single-kind count drift must fall through to LCS',
    );
  });

  it('A2 same-single-kind count drift (1 EN → 3 JA paragraphs) is also handled by LCS', () => {
    const en = makeSection({
      body: [makeSeg('Overview', 'paragraph', 0, 'EN single paragraph with `token-a`.')],
    });
    const ja = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, '分割された段落 1'),
        makeSeg('Overview', 'paragraph', 1, '分割された段落 2'),
        makeSeg('Overview', 'paragraph', 2, '分割された段落 3'),
      ],
    });
    assert.deepEqual(
      compareSectionStructure(en, ja),
      [],
      'same-single-kind split belongs to LCS segment-extra path',
    );
  });

  it('A3 detects list → paragraph collapse (3 EN list items → 1 JA paragraph)', () => {
    // Consecutive list items are collapsed into a single `unordered-list`
    // block before comparison. The structure comparator owns cross-kind
    // drift (list → paragraph); within-kind list item count drift stays
    // with the existing LCS-based segment-missing/extra path.
    const en = makeSection({
      body: [
        makeSeg('Overview', 'unordered-list-item', 0, '- EN bullet with `token-a`'),
        makeSeg('Overview', 'unordered-list-item', 1, '- EN bullet with `token-b`'),
        makeSeg('Overview', 'unordered-list-item', 2, '- EN bullet with `token-c`'),
      ],
    });
    const ja = makeSection({
      body: [makeSeg('Overview', 'paragraph', 0, 'リストを段落にまとめた翻訳: token-a, token-b, token-c')],
    });
    const diff = singleDiff(compareSectionStructure(en, ja));
    assert.equal(diff.type, 'section-structure-mismatch');
    assert.equal(diff.structureCategory, 'kind-multiset');
    assert.deepEqual(diff.enKinds, ['unordered-list']);
    assert.deepEqual(diff.jaKinds, ['paragraph']);
    assert.equal(diff.enSegmentCount, 1);
    assert.equal(diff.jaSegmentCount, 1);
  });

  it('A4 detects callout-body → paragraph collapse', () => {
    const en = makeSection({
      body: [makeSeg('Overview', 'callout-body', 0, 'EN callout warning with `WARN` token.')],
    });
    const ja = makeSection({
      body: [makeSeg('Overview', 'paragraph', 0, '注意喚起を段落として表記した翻訳 (WARN)')],
    });
    const diff = singleDiff(compareSectionStructure(en, ja));
    assert.equal(diff.type, 'section-structure-mismatch');
    assert.equal(diff.structureCategory, 'kind-multiset');
    assert.deepEqual(diff.enKinds, ['callout-body']);
    assert.deepEqual(diff.jaKinds, ['paragraph']);
  });

  it('A5 detects ordered → unordered list kind change', () => {
    const en = makeSection({
      body: [
        makeSeg('Overview', 'ordered-list-item', 0, '1. step one'),
        makeSeg('Overview', 'ordered-list-item', 1, '2. step two'),
      ],
    });
    const ja = makeSection({
      body: [
        makeSeg('Overview', 'unordered-list-item', 0, '- 手順 1'),
        makeSeg('Overview', 'unordered-list-item', 1, '- 手順 2'),
      ],
    });
    const diff = singleDiff(compareSectionStructure(en, ja));
    assert.equal(diff.type, 'section-structure-mismatch');
    assert.equal(diff.structureCategory, 'kind-multiset');
    assert.deepEqual(diff.enKinds, ['ordered-list']);
    assert.deepEqual(diff.jaKinds, ['unordered-list']);
  });

  it('A6 detects mixed-kind collapse (p + ul → p + p)', () => {
    const en = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, 'Intro with `token-a`.'),
        makeSeg('Overview', 'unordered-list-item', 0, '- item one `token-b`'),
        makeSeg('Overview', 'unordered-list-item', 1, '- item two `token-c`'),
      ],
    });
    const ja = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, '紹介段落 (token-a)'),
        makeSeg('Overview', 'paragraph', 1, '箇条書きを段落に畳んだ翻訳 (token-b, token-c)'),
      ],
    });
    const diff = singleDiff(compareSectionStructure(en, ja));
    assert.equal(diff.type, 'section-structure-mismatch');
    assert.equal(diff.structureCategory, 'kind-multiset');
    // EN collapses to [paragraph, unordered-list]; JA is [paragraph, paragraph].
    assert.deepEqual(diff.enKinds, ['paragraph', 'unordered-list']);
    assert.deepEqual(diff.jaKinds, ['paragraph', 'paragraph']);
  });

  it('A7 detects table → paragraph collapse (table cells collapsed into a single "table" block)', () => {
    // Table cells MUST collapse into a single `table` structure block so
    // the comparator tracks table-ness, not cell-level granularity. Cell
    // count drift within a present table is the table shape comparator's
    // responsibility.
    const en = makeSection({
      body: [
        makeSeg('Overview', 'table-cell', 0, 'Header `col-1`'),
        makeSeg('Overview', 'table-cell', 1, 'Header `col-2`'),
        makeSeg('Overview', 'table-cell', 2, 'Row1 `value-1`'),
        makeSeg('Overview', 'table-cell', 3, 'Row1 `value-2`'),
      ],
    });
    const ja = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, 'テーブルを段落にまとめた翻訳 (col-1, col-2, value-1, value-2)'),
      ],
    });
    const diff = singleDiff(compareSectionStructure(en, ja));
    assert.equal(diff.type, 'section-structure-mismatch');
    assert.equal(diff.structureCategory, 'kind-multiset');
    assert.deepEqual(diff.enKinds, ['table']);
    assert.deepEqual(diff.jaKinds, ['paragraph']);
  });

  it('A8 keeps non-adjacent list blocks separate (p between lists does NOT collapse)', () => {
    // `[ul-item, p, ul-item]` has a paragraph between two lists, so the
    // collapsing rule must produce two independent `unordered-list` blocks
    // with a `paragraph` between them — not a single fused list.
    const en = makeSection({
      body: [
        makeSeg('Overview', 'unordered-list-item', 0, '- first list'),
        makeSeg('Overview', 'paragraph', 0, 'Intermezzo `token-x`'),
        makeSeg('Overview', 'unordered-list-item', 0, '- second list'),
      ],
    });
    const ja = makeSection({
      body: [
        makeSeg('Overview', 'unordered-list-item', 0, '- 最初のリスト'),
        makeSeg('Overview', 'unordered-list-item', 0, '- 2 番目のリスト'),
      ],
    });
    const diff = singleDiff(compareSectionStructure(en, ja));
    assert.equal(diff.type, 'section-structure-mismatch');
    assert.equal(diff.structureCategory, 'kind-multiset');
    assert.deepEqual(diff.enKinds, ['unordered-list', 'paragraph', 'unordered-list']);
    assert.deepEqual(diff.jaKinds, ['unordered-list']);
  });

  it('A emits an exact-match payload contract (all required fields typed)', () => {
    // Cross-kind fixture: EN has a callout-body + paragraph, JA
    // collapsed the callout into plain prose. Kind sets differ
    // ({callout-body, paragraph} vs {paragraph}) so Stage A fires.
    const en = makeSection({
      sectionPath: 'Getting Started > Quickstart',
      index: 2,
      body: [
        makeSeg('Getting Started > Quickstart', 'callout-body', 0, 'Warning: requires `flag-a`.'),
        makeSeg('Getting Started > Quickstart', 'paragraph', 0, 'EN para with `flag-b`.'),
      ],
    });
    const ja = makeSection({
      sectionPath: 'Getting Started > Quickstart',
      index: 2,
      body: [
        makeSeg('Getting Started > Quickstart', 'paragraph', 0, '注意 (flag-a) と段落 (flag-b) を平文に畳んだ翻訳'),
        makeSeg('Getting Started > Quickstart', 'paragraph', 1, '補足段落'),
      ],
    });
    const diff = singleDiff(compareSectionStructure(en, ja));

    assert.equal(diff.type, 'section-structure-mismatch');
    assert.equal(diff.severity, 'actionable');
    assert.equal(diff.sectionPath, 'Getting Started > Quickstart');
    assert.equal(diff.sectionIndex, 2);
    assert.equal(diff.scope, 'section');
    assert.equal(
      diff.segmentKind,
      undefined,
      'structure diffs MUST NOT reuse segmentKind — use scope instead',
    );
    assert.equal(diff.structureCategory, 'kind-multiset');
    assert.ok(Array.isArray(diff.enKinds), 'enKinds must be an array');
    assert.ok(Array.isArray(diff.jaKinds), 'jaKinds must be an array');
    assert.equal(typeof diff.enSegmentCount, 'number');
    assert.equal(typeof diff.jaSegmentCount, 'number');
    assert.equal(typeof diff.detail, 'string');
    assert.ok(diff.detail.length > 0, 'detail must be a non-empty human summary');
    assert.equal(diff.contentPermutation, undefined, 'content-order field only on Stage C');
  });
});

// ---------------------------------------------------------------------------
// Stage B — kind-sequence (segment-order-mismatch)
// ---------------------------------------------------------------------------

describe('Stage B — kind-sequence (segment-order-mismatch)', () => {
  it('B1 detects [p, ul] vs [ul, p] kind swap', () => {
    const en = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, 'Intro `token-a`'),
        makeSeg('Overview', 'unordered-list-item', 0, '- bullet `token-b`'),
      ],
    });
    const ja = makeSection({
      body: [
        makeSeg('Overview', 'unordered-list-item', 0, '- 箇条書き token-b'),
        makeSeg('Overview', 'paragraph', 0, '紹介段落 token-a'),
      ],
    });
    const diff = singleDiff(compareSectionStructure(en, ja));
    assert.equal(diff.type, 'segment-order-mismatch');
    assert.equal(diff.structureCategory, 'kind-sequence');
    assert.deepEqual(diff.enKinds, ['paragraph', 'unordered-list']);
    assert.deepEqual(diff.jaKinds, ['unordered-list', 'paragraph']);
  });

  it('B2 detects [p, p, ul] vs [ul, p, p] kind reorder', () => {
    const en = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, 'Para 1 `token-a`'),
        makeSeg('Overview', 'paragraph', 1, 'Para 2 `token-b`'),
        makeSeg('Overview', 'unordered-list-item', 0, '- bullet `token-c`'),
      ],
    });
    const ja = makeSection({
      body: [
        makeSeg('Overview', 'unordered-list-item', 0, '- 箇条書き token-c'),
        makeSeg('Overview', 'paragraph', 0, '段落 1 token-a'),
        makeSeg('Overview', 'paragraph', 1, '段落 2 token-b'),
      ],
    });
    const diff = singleDiff(compareSectionStructure(en, ja));
    assert.equal(diff.type, 'segment-order-mismatch');
    assert.equal(diff.structureCategory, 'kind-sequence');
  });

  it('B emits payload contract fields but NOT contentPermutation', () => {
    const en = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, 'p `token-a`'),
        makeSeg('Overview', 'callout-body', 0, 'callout `token-b`'),
      ],
    });
    const ja = makeSection({
      body: [
        makeSeg('Overview', 'callout-body', 0, 'コールアウト token-b'),
        makeSeg('Overview', 'paragraph', 0, '段落 token-a'),
      ],
    });
    const diff = singleDiff(compareSectionStructure(en, ja));
    assert.equal(diff.structureCategory, 'kind-sequence');
    assert.equal(diff.enSegmentCount, 2);
    assert.equal(diff.jaSegmentCount, 2);
    assert.equal(diff.contentPermutation, undefined, 'Stage B should not populate contentPermutation');
    assert.equal(typeof diff.detail, 'string');
  });
});

// ---------------------------------------------------------------------------
// Stage C — content-order (segment-order-mismatch)
// ---------------------------------------------------------------------------

describe('Stage C — content-order (segment-order-mismatch)', () => {
  it('C1 detects same-kind pure swap [p_A, p_B] → [p_B, p_A] with strong tokens', () => {
    // JA tokens MUST be backticked to survive `extractInvariantTokens`
    // — this mirrors real translations, which always preserve CLI
    // flags and identifiers as code spans.
    const en = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, 'Paragraph about `alpha-tool` and `alpha-flag`.'),
        makeSeg('Overview', 'paragraph', 1, 'Paragraph about `beta-tool` and `beta-flag`.'),
      ],
    });
    const ja = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, '`beta-tool` と `beta-flag` に関する段落'),
        makeSeg('Overview', 'paragraph', 1, '`alpha-tool` と `alpha-flag` に関する段落'),
      ],
    });
    const diff = singleDiff(compareSectionStructure(en, ja));
    assert.equal(diff.type, 'segment-order-mismatch');
    assert.equal(diff.structureCategory, 'content-order');
    assert.deepEqual(diff.enKinds, ['paragraph', 'paragraph']);
    assert.deepEqual(diff.jaKinds, ['paragraph', 'paragraph']);
    assert.ok(Array.isArray(diff.contentPermutation), 'content-order must populate contentPermutation');
    assert.equal(diff.contentPermutation.length, 2);
    // EN[0] should map to JA[1] (alpha-tool content), EN[1] to JA[0] (beta-tool content)
    const mapByEn = Object.fromEntries(
      diff.contentPermutation.map((p) => [p.enIndex, p.jaIndex]),
    );
    assert.equal(mapByEn[0], 1, 'EN[0] (alpha) should map to JA[1] (alpha)');
    assert.equal(mapByEn[1], 0, 'EN[1] (beta) should map to JA[0] (beta)');
    for (const p of diff.contentPermutation) {
      assert.equal(typeof p.score, 'number');
      assert.ok(p.score > 0, 'permutation pairs must have a positive match score');
    }
  });

  it('C2 detects three-element cyclic rotation', () => {
    const en = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, 'Content `token-alpha`.'),
        makeSeg('Overview', 'paragraph', 1, 'Content `token-beta`.'),
        makeSeg('Overview', 'paragraph', 2, 'Content `token-gamma`.'),
      ],
    });
    const ja = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, '内容 `token-gamma`'),
        makeSeg('Overview', 'paragraph', 1, '内容 `token-alpha`'),
        makeSeg('Overview', 'paragraph', 2, '内容 `token-beta`'),
      ],
    });
    const diff = singleDiff(compareSectionStructure(en, ja));
    assert.equal(diff.type, 'segment-order-mismatch');
    assert.equal(diff.structureCategory, 'content-order');
    const mapByEn = Object.fromEntries(
      diff.contentPermutation.map((p) => [p.enIndex, p.jaIndex]),
    );
    // cyclic rotation: EN[0] → JA[1], EN[1] → JA[2], EN[2] → JA[0]
    assert.equal(mapByEn[0], 1);
    assert.equal(mapByEn[1], 2);
    assert.equal(mapByEn[2], 0);
  });

  it('C-negative returns empty when content is in monotonic order', () => {
    const en = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, 'Monotonic `alpha` paragraph.'),
        makeSeg('Overview', 'paragraph', 1, 'Monotonic `beta` paragraph.'),
      ],
    });
    const ja = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, '単調 `alpha` 段落'),
        makeSeg('Overview', 'paragraph', 1, '単調 `beta` 段落'),
      ],
    });
    const result = compareSectionStructure(en, ja);
    assert.deepEqual(result, [], 'monotonic content should not emit any structure diff');
  });

  it('C-negative returns empty when both sides are tokenless (cannot determine)', () => {
    // Pure prose with zero invariant tokens — the comparator cannot prove
    // a swap happened and must fall through to the LCS rather than
    // guess a content-order mismatch.
    const en = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, 'The first paragraph discusses overall goals.'),
        makeSeg('Overview', 'paragraph', 1, 'The second paragraph covers the approach.'),
      ],
    });
    const ja = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, '2 番目の段落: 方針を説明する文章'),
        makeSeg('Overview', 'paragraph', 1, '1 番目の段落: 全体のゴールを説明する文章'),
      ],
    });
    const result = compareSectionStructure(en, ja);
    assert.deepEqual(
      result,
      [],
      'tokenless swap cannot be distinguished from independent rewrite — must fall through to LCS',
    );
  });
});

// ---------------------------------------------------------------------------
// Stage precedence / fall-through contract
// ---------------------------------------------------------------------------

describe('Stage precedence and fall-through contract', () => {
  it('returns empty array for identical sections (no structure issue)', () => {
    const en = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, 'EN paragraph `token-a`'),
        makeSeg('Overview', 'unordered-list-item', 0, '- EN bullet `token-b`'),
      ],
    });
    const ja = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, 'JA 段落 token-a'),
        makeSeg('Overview', 'unordered-list-item', 0, '- JA 箇条書き token-b'),
      ],
    });
    const result = compareSectionStructure(en, ja);
    assert.deepEqual(result, []);
  });

  it('returns empty for two empty bodies', () => {
    const en = makeSection({ body: [] });
    const ja = makeSection({ body: [] });
    assert.deepEqual(compareSectionStructure(en, ja), []);
  });

  it('empty JA body with a populated EN body falls through to LCS (segment-missing path)', () => {
    // Owned by the weighted LCS — the per-segment detail reviewers
    // rely on (which EN segment was dropped) would be lost if we
    // blanket-fired a structure mismatch instead.
    const en = makeSection({
      body: [
        makeSeg('Overview', 'callout-body', 0, 'EN callout `token`'),
        makeSeg('Overview', 'paragraph', 0, 'EN paragraph'),
      ],
    });
    const ja = makeSection({ body: [] });
    assert.deepEqual(compareSectionStructure(en, ja), []);
  });

  it('empty EN body with a populated JA body falls through to LCS (segment-extra path)', () => {
    const en = makeSection({ body: [] });
    const ja = makeSection({
      body: [makeSeg('Overview', 'paragraph', 0, 'JA extra paragraph')],
    });
    assert.deepEqual(compareSectionStructure(en, ja), []);
  });

  it('same-kind-set count drift with reordering falls through to LCS (no Stage A, no Stage B)', () => {
    // Under the narrowed Stage A rule (fires only when kind SETS
    // differ), this case — same kind set but different counts AND
    // reordered — does NOT fire either Stage A (sets equal) or
    // Stage B (multisets differ, Stage B requires multiset equality).
    // It correctly falls through to the weighted LCS so per-segment
    // drill-down survives. This pins the mutually-exclusive precedence
    // contract: Stage A and Stage B are disjoint by construction,
    // there is no "which wins" case.
    const en = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, 'p1'),
        makeSeg('Overview', 'paragraph', 1, 'p2'),
        makeSeg('Overview', 'unordered-list-item', 0, '- bullet'),
      ],
    });
    const ja = makeSection({
      body: [
        makeSeg('Overview', 'unordered-list-item', 0, '- bullet'),
        makeSeg('Overview', 'paragraph', 0, 'p'),
      ],
    });
    const result = compareSectionStructure(en, ja);
    assert.deepEqual(result, [], 'LCS owns count drift inside an existing kind set');
  });

  it('Stage B takes precedence over Stage C when multiset is same but kinds reorder', () => {
    // Identical kinds per-position would be Stage C; mixed-kind reorder
    // is Stage B and must win before we look at content-level bijection.
    const en = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, 'p `token-a`'),
        makeSeg('Overview', 'unordered-list-item', 0, '- bullet `token-b`'),
      ],
    });
    const ja = makeSection({
      body: [
        makeSeg('Overview', 'unordered-list-item', 0, '- bullet token-a'),
        makeSeg('Overview', 'paragraph', 0, 'p token-b'),
      ],
    });
    const diff = singleDiff(compareSectionStructure(en, ja));
    assert.equal(diff.type, 'segment-order-mismatch');
    assert.equal(diff.structureCategory, 'kind-sequence');
  });
});

// ---------------------------------------------------------------------------
// Payload contract regression — stable field set and types
// ---------------------------------------------------------------------------

describe('issue payload contract (PR5 baseline identity surface)', () => {
  const REQUIRED_FIELDS = [
    'type',
    'severity',
    'sectionPath',
    'sectionIndex',
    'scope',
    'structureCategory',
    'enKinds',
    'jaKinds',
    'enSegmentCount',
    'jaSegmentCount',
    'detail',
  ];

  const FORBIDDEN_FIELDS = ['segmentKind'];

  function assertContract(diff) {
    for (const field of REQUIRED_FIELDS) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(diff, field),
        `missing required field: ${field}`,
      );
    }
    for (const field of FORBIDDEN_FIELDS) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(diff, field),
        false,
        `structure diffs MUST NOT carry "${field}" — it collides with segment-level diffs`,
      );
    }
    assert.equal(diff.scope, 'section');
  }

  it('section-structure-mismatch carries all required fields', () => {
    // Cross-kind fixture so Stage A fires.
    const en = makeSection({
      body: [
        makeSeg('Overview', 'callout-body', 0, 'Callout `token-a`'),
        makeSeg('Overview', 'paragraph', 0, 'p `token-b`'),
      ],
    });
    const ja = makeSection({
      body: [makeSeg('Overview', 'paragraph', 0, 'コールアウトと段落を畳んだ翻訳 (token-a, token-b)')],
    });
    const diff = singleDiff(compareSectionStructure(en, ja));
    assertContract(diff);
  });

  it('segment-order-mismatch (kind-sequence) carries all required fields', () => {
    const en = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, 'p `token-a`'),
        makeSeg('Overview', 'unordered-list-item', 0, '- bullet `token-b`'),
      ],
    });
    const ja = makeSection({
      body: [
        makeSeg('Overview', 'unordered-list-item', 0, '- 箇条書き token-b'),
        makeSeg('Overview', 'paragraph', 0, '段落 token-a'),
      ],
    });
    const diff = singleDiff(compareSectionStructure(en, ja));
    assertContract(diff);
  });

  it('segment-order-mismatch (content-order) adds contentPermutation', () => {
    const en = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, 'Paragraph `alpha-token`.'),
        makeSeg('Overview', 'paragraph', 1, 'Paragraph `beta-token`.'),
      ],
    });
    const ja = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, '`beta-token` の段落'),
        makeSeg('Overview', 'paragraph', 1, '`alpha-token` の段落'),
      ],
    });
    const diff = singleDiff(compareSectionStructure(en, ja));
    assert.equal(diff.structureCategory, 'content-order');
    assert.ok(
      Array.isArray(diff.contentPermutation) && diff.contentPermutation.length === 2,
      'content-order must carry a 2-element permutation',
    );
    for (const entry of diff.contentPermutation) {
      assert.equal(typeof entry.enIndex, 'number');
      assert.equal(typeof entry.jaIndex, 'number');
      assert.equal(typeof entry.score, 'number');
    }
  });

  it('STRUCTURE_COMPARATOR_KINDS is frozen to the block-level vocabulary', () => {
    // The kind vocabulary used in enKinds / jaKinds is PINNED to this set.
    // These are BLOCK kinds, not segment kinds — consecutive list items
    // collapse to a single `ordered-list` / `unordered-list`, and
    // consecutive table cells collapse to a single `table` block. Block
    // comparator responsibility is intentionally separated from
    // within-block shape comparators (table shape, list cardinality).
    //
    // Adding or removing a kind is a breaking change that also requires a
    // baseline schema bump (see PR5). The test exists to make accidental
    // drift impossible — changing this assertion will force the reviewer
    // to think about the downstream contract.
    assert.ok(Array.isArray(STRUCTURE_COMPARATOR_KINDS));
    assert.deepEqual(
      [...STRUCTURE_COMPARATOR_KINDS].sort(),
      [
        'callout-body',
        'details-summary',
        'ordered-list',
        'paragraph',
        'table',
        'unordered-list',
      ],
    );
  });

  it('enKinds / jaKinds only contain kinds from STRUCTURE_COMPARATOR_KINDS', () => {
    const en = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, 'p `token-a`'),
        makeSeg('Overview', 'unordered-list-item', 0, '- bullet `token-b`'),
        makeSeg('Overview', 'table-cell', 0, 'cell `token-c`'),
      ],
    });
    const ja = makeSection({
      body: [makeSeg('Overview', 'paragraph', 0, '1 段落に畳んだ (token-a/b/c)')],
    });
    const diff = singleDiff(compareSectionStructure(en, ja));
    const allowed = new Set(STRUCTURE_COMPARATOR_KINDS);
    for (const kind of diff.enKinds) {
      assert.ok(allowed.has(kind), `EN kind "${kind}" not in STRUCTURE_COMPARATOR_KINDS`);
    }
    for (const kind of diff.jaKinds) {
      assert.ok(allowed.has(kind), `JA kind "${kind}" not in STRUCTURE_COMPARATOR_KINDS`);
    }
    // Segment-level kinds must NEVER appear — these would mean the
    // collapsing step was skipped.
    const segmentLevelKinds = ['ordered-list-item', 'unordered-list-item', 'table-cell'];
    for (const forbidden of segmentLevelKinds) {
      assert.equal(
        diff.enKinds.includes(forbidden),
        false,
        `enKinds MUST use block-level kind, not segment-level "${forbidden}"`,
      );
      assert.equal(
        diff.jaKinds.includes(forbidden),
        false,
        `jaKinds MUST use block-level kind, not segment-level "${forbidden}"`,
      );
    }
  });

  it('contentPermutation score is declared diagnostic-only (not part of identity)', () => {
    // The score field captures match strength for debugging. Baseline
    // identity (PR5) must hash only (enIndex, jaIndex) entries. This test
    // pins the contract by checking that the permutation entries sorted
    // by enIndex produce a stable key regardless of score mutation.
    const en = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, 'Paragraph `alpha-token`.'),
        makeSeg('Overview', 'paragraph', 1, 'Paragraph `beta-token`.'),
      ],
    });
    const ja = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, '`beta-token` の段落'),
        makeSeg('Overview', 'paragraph', 1, '`alpha-token` の段落'),
      ],
    });
    const diff = singleDiff(compareSectionStructure(en, ja));

    const identityKey = diff.contentPermutation
      .slice()
      .sort((a, b) => a.enIndex - b.enIndex)
      .map((p) => `${p.enIndex}->${p.jaIndex}`)
      .join(',');
    assert.equal(identityKey, '0->1,1->0');

    // Every entry must still carry a score, but callers must treat it as
    // diagnostic — this test exists so that anyone tempted to hash `score`
    // into an identity key will first have to delete this assertion.
    for (const p of diff.contentPermutation) {
      assert.equal(typeof p.score, 'number');
    }
  });

  it('detail is a non-empty human string and never a structured object', () => {
    // Cross-kind fixture so Stage A fires.
    const en = makeSection({
      body: [
        makeSeg('Overview', 'callout-body', 0, 'callout `token-a`'),
      ],
    });
    const ja = makeSection({
      body: [
        makeSeg('Overview', 'paragraph', 0, '段落 1 token-a'),
        makeSeg('Overview', 'paragraph', 1, '段落 2'),
      ],
    });
    const diff = singleDiff(compareSectionStructure(en, ja));
    assert.equal(typeof diff.detail, 'string');
    assert.ok(diff.detail.length > 0);
    // Detail must not be a JSON-encoded blob — keeping it human-only is the
    // contract that lets PR5 baseline/ack matchers key off structured fields.
    assert.equal(diff.detail.trimStart().startsWith('{'), false);
  });
});
