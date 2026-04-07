/**
 * canonical block-sequence structure comparator (Issue #247 PR2) のテスト。
 *
 * `compareSectionStructure(enSection, jaSection)` は 1 組の (EN, JA) section
 * body に対して 3 段階のチェックを走らせ、section 単位の parity diff を
 * 最大 1 件返す:
 *
 *   Stage A — kind-multiset
 *     block kind 集合が EN/JA で違う (cross-kind の merge/split/collapse)。
 *     `section-structure-mismatch` を emit。
 *
 *   Stage B — kind-sequence
 *     multiset は一致するが並び順が違う (mixed-kind reorder)。
 *     `segment-order-mismatch` を emit。
 *
 *   Stage C — content-order
 *     kind 列は完全一致しているが content bijection が monotonic ではない
 *     (same-kind の pure swap / rotation)。
 *     `segment-order-mismatch` を emit。
 *
 * どの stage も発火しなければ comparator は空配列を返し、呼び出し元
 * (alignSegments) は既存の weighted LCS にフォールスルーする。section
 * あたり emit される diff は最大 1 件 — 先に発火した stage が勝ち、
 * 後続 stage は short-circuit でスキップされる。これは PR4 の gate cutover
 * で contract を予測可能にするため。
 *
 * ここで PIN している issue payload contract (PR5 baseline identity key
 * がこれらを参照する前提なので、同 PR で baseline loader を合わせて変える
 * までは rename / 削除してはならない):
 *
 *   sectionPath          — 対象 section の heading path
 *   sectionIndex         — 0 始まりの section index (document order)
 *   scope                — 必ず 'section'。structure issue と segment 単位
 *                          diff を区別するためのフィールド。**既存の
 *                          `segmentKind` フィールドを流用してはいけない** —
 *                          `segmentKind` は他所で 'paragraph' などの block
 *                          kind 値を持っており、ここに 'section' を入れると
 *                          matcher と baseline key が混乱する。
 *   structureCategory    — 'kind-multiset' | 'kind-sequence' | 'content-order'
 *   enKinds              — EN section body の **block 単位** kind 列。
 *                          語彙は FROZEN — source_parity_structure.mjs が
 *                          export する STRUCTURE_COMPARATOR_KINDS 参照。
 *                          許容セット:
 *                            paragraph | ordered-list | unordered-list |
 *                            callout-body | table | details-summary
 *                          segment 単位の kind (ordered-list-item /
 *                          unordered-list-item / table-cell) は比較前に
 *                          block 相当へ **畳まれる** — 連続 list item は 1
 *                          list block、連続 table cell は 1 table block に。
 *                          paragraph / callout-body / details-summary は
 *                          segment と 1:1。block 内部の drift (list item
 *                          数差、table cell 数差) は意図的に別 comparator の
 *                          責務にしており、structure comparator は block
 *                          列の差だけを見る。
 *                          PR5 baseline identity key は enKinds.join('|') を
 *                          hash する予定なので、語彙へのエントリ追加は
 *                          破壊的変更で baseline schema bump が必須。
 *   jaKinds              — JA section body の block 単位 kind 列
 *   enSegmentCount       — enKinds.length (baseline 安定のため frozen)
 *   jaSegmentCount       — jaKinds.length
 *   detail               — 人間向け要約のみ (free text)。baseline/ack
 *                          matcher は **絶対に読まない**。
 *   contentPermutation?  — content-order でのみ付与する
 *                          Array<{enIndex, jaIndex, score}>。`score` は
 *                          DIAGNOSTIC-ONLY — 閾値調整やスコアアルゴリズム
 *                          変更で揺れてよい。PR5 の baseline identity は
 *                          score を **絶対に hash してはならず**、安定鍵と
 *                          して使えるのは (enIndex, jaIndex) ペアだけ。
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
// ヘルパー
// ---------------------------------------------------------------------------

function makeSeg(sectionPath, kind, segmentIndex, rawText) {
  return createSegment({ sectionPath, kind, segmentIndex, rawText });
}

/**
 * source_parity_align が section を分割するのと同じ形状の、最小限の
 * Section レコードを組み立てる。structure comparator が参照する
 * フィールドだけを埋める。
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
  // Stage A は **CROSS-KIND** ドリフト担当: list→paragraph collapse、
  // callout→paragraph collapse、details-summary の消失、ordered↔unordered
  // list 入れ替えなど。同種 kind のみの count drift (段落 N 個 → M 個、
  // 他の kind は無し) は既存 weighted LCS の segment-missing /
  // segment-extra に任せる契約で、structure comparator は二重計上しない。
  // 下の 2 本のテストでこの契約を明示的に pin する。

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
    // structure diff は emit しない — ここは segment-missing の担当領域で
    // source_parity_align.mjs のほうが扱う。segment-missing 側の形状は
    // source_parity_align.test.mjs の統合テストで assert している。
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
    // 連続した list item は比較前に 1 `unordered-list` block に畳まれる。
    // structure comparator は cross-kind drift (list → paragraph) を担当し、
    // 同種 kind 内の list item 数差は既存 LCS の segment-missing/extra 経路に
    // 任せる。
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
    // EN は [paragraph, unordered-list] に畳まれる、JA は [paragraph, paragraph]。
    assert.deepEqual(diff.enKinds, ['paragraph', 'unordered-list']);
    assert.deepEqual(diff.jaKinds, ['paragraph', 'paragraph']);
  });

  it('A7 detects table → paragraph collapse (table cells collapsed into a single "table" block)', () => {
    // table cell は必ず 1 つの `table` structure block に畳まれる必要が
    // ある — comparator が追うのはあくまで「table が存在するかどうか」で
    // あり、cell 単位の粒度ではない。table 内部の cell 数差は別の table
    // shape comparator の責務。
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
    // `[ul-item, p, ul-item]` のように list の間に paragraph が挟まっている
    // 場合、畳み規則は 2 つの独立した `unordered-list` block + 間の
    // `paragraph` を生成しなければならない (1 つに融合してはいけない)。
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
    // Cross-kind fixture: EN は callout-body + paragraph、JA は callout を
    // 平文に畳んである。kind 集合が {callout-body, paragraph} vs
    // {paragraph} で違うので Stage A が fire する。
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
    // JA 側の token は必ずバッククォートで囲むこと — `extractInvariantTokens`
    // はバッククォートで囲まれた token しか拾わない。これは実際の翻訳と
    // 同じ形 (CLI フラグや識別子は常に code span のまま残す) に合わせている。
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
    // invariant token が両側ともゼロな純散文 — comparator は swap が
    // 起きたことを証明できないので、推測で content-order mismatch を
    // 出さずに LCS にフォールスルーする契約。
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
    // これは weighted LCS の担当。ここで structure mismatch を一括発火
    // させてしまうと、「どの EN segment が落ちたか」という reviewer が
    // 頼りにしている per-segment の情報が失われる。
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
    // Stage A ルールを kind SET 差分のみに狭めたので、この
    // 「kind 集合は同じ / 個数は違う / 順序も違う」ケースは Stage A
    // (set 一致なので fire しない) でも Stage B (multiset 一致が
    // 前提なので fire しない) でも拾われず、正しく weighted LCS に
    // フォールスルーして per-segment drill-down が生きる。Stage A と
    // Stage B は設計上 disjoint であり「どちらが勝つか」という
    // precedence ケースは存在しない — この contract をここで pin する。
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
    // 各 position で kind が完全一致するなら Stage C の担当だが、
    // mixed-kind の reorder は Stage B の担当で、content-level bijection
    // を見る前にここで勝たなければならない。
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
    // Stage A を発火させるための cross-kind fixture。
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
    // enKinds / jaKinds で使う kind 語彙はこの集合に PIN されている。
    // これらは **block** kind であって segment kind ではない — 連続する
    // list item は 1 つの `ordered-list` / `unordered-list` に、連続する
    // table cell は 1 つの `table` block に畳まれる。block comparator の
    // 責務は、block 内部の shape comparator (table shape / list
    // cardinality 等) と意図的に切り分けてある。
    //
    // kind を追加 / 削除するのは破壊的変更であり baseline schema bump
    // (PR5) を伴う必要がある。このテストは誤って drift させないための
    // 保険 — この assertion を書き換えようとした reviewer は downstream
    // 契約を必ず意識することになる。
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
    // segment 単位の kind は絶対に現れてはいけない — 現れていたら
    // 畳み処理がスキップされている証拠。
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
    // score フィールドはマッチの強さをデバッグ用に保持しているだけ。
    // baseline identity (PR5) は (enIndex, jaIndex) エントリだけを hash
    // しなければならない。このテストは、permutation エントリを enIndex で
    // sort した結果が score が揺れても安定キーになる、という契約を pin
    // する。
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

    // 各 entry は依然として score を持つが、呼び出し側は必ず
    // diagnostic として扱うこと。このテストは、`score` を identity key に
    // hash しようとした人が、まずこの assertion を消す必要があるように
    // するためのガードレール。
    for (const p of diff.contentPermutation) {
      assert.equal(typeof p.score, 'number');
    }
  });

  it('detail is a non-empty human string and never a structured object', () => {
    // Stage A を発火させるための cross-kind fixture。
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
    // detail は JSON エンコードされた blob になってはいけない — 人間向け
    // 専用に保つことで、PR5 の baseline/ack matcher が構造化フィールドを
    // 直接 key にできる契約を守る。
    assert.equal(diff.detail.trimStart().startsWith('{'), false);
  });
});
