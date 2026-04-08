/**
 * Section 単位の canonical block sequence comparator (Issue #247 PR2)。
 *
 * `compareSectionStructure(enSection, jaSection)` は 1 組の (EN, JA) section
 * body に対して 3 段階のチェックを走らせ、section 単位の parity diff を
 * 最大 1 件返す。段階は以下の通り:
 *
 *   Stage A — kind-multiset (section-structure-mismatch)
 *     block kind の **集合** が EN/JA で違うケース。list→paragraph
 *     collapse、callout→paragraph collapse、table→paragraph collapse、
 *     ordered↔unordered list swap、details-summary 消失などを捕捉する。
 *
 *   Stage B — kind-sequence (segment-order-mismatch)
 *     multiset は一致するが block kind の並び順だけが違うケース
 *     (例: [p, ul] と [ul, p] のような mixed-kind reorder)。
 *
 *   Stage C — content-order (segment-order-mismatch)
 *     block kind 列までは完全一致しているが、all-pairs content bijection
 *     が monotonic でないケース。same-kind pure swap や cyclic rotation を
 *     invariant token のアンカーを頼りに検出する。tokenless な純粋散文の
 *     swap は **意図的に検出しない**: semantic evidence なしには独立の
 *     rewrite と区別できないので、これは既存 LCS に委ねる契約。
 *
 * どの stage も発火しなければ空配列を返し、呼び出し側 (`alignSegments`) は
 * そのまま既存の weighted LCS に流す。section あたり高々 1 件の diff しか
 * emit しない — 先に発火した stage が勝ち、後続 stage は short-circuit で
 * 走らない。
 *
 * Block 単位の語彙
 * ----------------
 * comparator は **block** kind を扱い、segment kind は扱わない。比較前に
 * 同種の collapsible source kind が連続していれば 1 block に畳む:
 *
 *   ordered-list-item × N   → 'ordered-list'
 *   unordered-list-item × N → 'unordered-list'
 *   table-cell × N          → 'table'
 *
 * `paragraph` / `callout-body` / `details-summary` は畳まず 1:1 (segment 1
 * つがそのまま 1 block)。この切り分けは意図的: block 内部の drift
 * (list item 数差、table cell 数差) は別 comparator の責務であり、この
 * structure comparator は **block 列の差** だけを見る。
 *
 * Issue payload contract (PR5 baseline identity surface)
 * ------------------------------------------------------
 * 固定 schema は単体テスト (source_parity_structure.test.mjs) にも pin
 * してある。PR5 で baseline schema を bump せずにここのフィールドを
 * rename / reorder / 削除してはいけない。
 *
 * 純粋関数のみ: 入力は決して mutate しない。
 *
 * @module source_parity_structure
 */

import { scoreSegmentMatch } from './source_parity_align_scoring.mjs';

// ---------------------------------------------------------------------------
// Block kind 語彙 — FROZEN
// ---------------------------------------------------------------------------

/**
 * structure comparator が `enKinds` / `jaKinds` で使う block 単位の kind
 * 語彙。この集合は `source_parity_structure.test.mjs` の regression test
 * で PIN されている。PR5 では `enKinds.join('|')` / `jaKinds.join('|')` を
 * baseline identity key に hash する予定なので、エントリの追加・削除・
 * 改名は破壊的変更であり baseline schema の bump とセットにする必要がある。
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
 * canonical extractor が emit する segment kind から、structure comparator
 * が使う block kind への対応表。ここに無い kind (image / code-block /
 * image-caption 等) は畳み処理で落とされる (structure 語彙の対象外)。
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
 * 畳み可能な source kind の集合。ここに属する kind が連続していれば 1
 * block に折り畳まれる。paragraph / callout-body / details-summary は畳み
 * 不可で、segment 1 つがそのまま 1 block になる。
 */
const COLLAPSIBLE_SOURCE_KINDS = new Set([
  'ordered-list-item',
  'unordered-list-item',
  'table-cell',
]);

// ---------------------------------------------------------------------------
// Stage C の content bijection 用スコア閾値
// ---------------------------------------------------------------------------

/**
 * Stage C (content-order) で「強いアンカー」として採用するために必要な最小
 * マッチスコア。この閾値は最低でも token-overlap レベルのマッチを要求する
 * 値にしてある — tokenless な weak-position スコア (1–15) はここを下回る
 * ので、invariant token を持たない純散文 section は bijection が成立せず
 * 自動的に LCS にフォールスルーする。
 *
 * スコア階層 (fingerprint > textNorm > token overlap > weak position/length
 * > kind floor) は `source_parity_align_scoring.mjs::scoreSegmentMatch` を
 * 参照。この閾値は **invariant-token の根拠なしに swap を推測しない** と
 * いう契約を守るために、tokenless weak-position レンジより上に保たれて
 * いなければならない。
 */
const CONTENT_ORDER_MIN_SCORE = 100;

// ---------------------------------------------------------------------------
// Block 畳み処理
// ---------------------------------------------------------------------------

/**
 * @typedef {import('./source_parity_segments_shared.mjs').Segment} Segment
 */

/**
 * @typedef {object} StructureBlock
 * @property {string} kind               STRUCTURE_COMPARATOR_KINDS のいずれか
 * @property {Segment[]} segments        この block に畳まれた元 segment 列
 */

/**
 * section body を走査し、同種 collapsible segment が連続していれば 1 block
 * に折り畳む。畳み不可 segment は 1:1 で block になる。SEGMENT_TO_BLOCK_KIND
 * に無い kind (image / code-block など) は structure 語彙の対象外なので
 * ここで落とす。
 *
 * 純粋関数 — `body` を mutate しない。
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
  // 内部判別用の sourceKind は外部 API から見せない — consumer は
  // { kind, segments } だけを受け取る。
  return blocks.map(({ kind, segments }) => ({ kind, segments }));
}

// ---------------------------------------------------------------------------
// 集合 / 列の比較ヘルパー
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
 * EN blocks と JA blocks を `scoreSegmentMatch` のスコアを頼りに greedy で
 * 全ペア bijection する。
 *
 * 呼び出し元が block kind 列の完全一致を保証している前提で動く
 * (compareSectionStructure の Stage C 分岐)。複数 segment が畳まれた block
 * は **最初の segment** を代表として採用する。これが最も安定した選択:
 * list 内部で token を束ねると content signal がぼけるため、LCS の
 * per-segment scoring と同じ粒度で判定できるよう先頭を固定する。
 *
 * 強い bijection が見つかり、かつ identity 順列でない場合に
 * `[{enIndex, jaIndex, score}]` を返す。それ以外は `null` を返し、呼び出し
 * 側は LCS にフォールスルーする。
 *
 * @param {StructureBlock[]} enBlocks
 * @param {StructureBlock[]} jaBlocks
 * @returns {Array<{enIndex: number, jaIndex: number, score: number}> | null}
 */
function detectContentOrderPermutation(enBlocks, jaBlocks) {
  const n = enBlocks.length;
  if (n < 2 || n !== jaBlocks.length) return null;

  // 各 block の代表 segment を先頭固定にする理由はヘッダコメント参照。
  const enReps = enBlocks.map((b) => b.segments[0] ?? null);
  const jaReps = jaBlocks.map((b) => b.segments[0] ?? null);
  if (enReps.some((s) => s == null) || jaReps.some((s) => s == null)) return null;

  // 全ペアのスコア表を構築する。scoreSegmentMatch は segmentKind 一致を
  // 前提にする — block kind 列が同一なのでここで同一 index ペアはその制約を
  // 自然に満たす。非同一 index ペアは section 内の kind パターン次第
  // ([p, p] なら任意ペア、[p, ul] なら同一 index ペアのみ)。
  const scores = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      scores[i][j] = scoreSegmentMatch(enReps[i], jaReps[j], i, j, n, n);
    }
  }

  // 強い候補ペアを score 降順で集めてから greedy に割り当てる。実運用の
  // section サイズ (典型的に block 数 ≤ 10) では Hungarian までやる必要は
  // なく、greedy で十分最適に近い。
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

  if (permutation.length !== n) return null; // 全 block が強マッチしなかった — LCS に流す

  // identity チェック。全 enIndex が自分と同じ jaIndex を指しているなら
  // monotonic なので content-order diff は emit しない。
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
// Diff ファクトリ
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
 * ペアになった (EN, JA) section body を比較し、section 単位の structure
 * diff を最大 1 件返す。段階のルールはモジュールヘッダ参照。
 *
 * @param {{index: number, sectionPath: string, body: Segment[]}} enSection
 * @param {{index: number, sectionPath: string, body: Segment[]}} jaSection
 * @returns {StructureDiff[]}  空配列 = 構造 issue 無し、呼び出し側が LCS を走らせる
 */
export function compareSectionStructure(enSection, jaSection) {
  if (!enSection || !jaSection) return [];

  const enBlocks = collapseBodyToBlocks(enSection.body ?? []);
  const jaBlocks = collapseBodyToBlocks(jaSection.body ?? []);

  const enKinds = enBlocks.map((b) => b.kind);
  const jaKinds = jaBlocks.map((b) => b.kind);

  // Guard — 出力される kind は必ず frozen 語彙の中になければならない。
  for (const kind of [...enKinds, ...jaKinds]) {
    if (!STRUCTURE_KIND_SET.has(kind)) {
      throw new Error(
        `compareSectionStructure: unexpected block kind "${kind}" ` +
          `(must be one of STRUCTURE_COMPARATOR_KINDS)`,
      );
    }
  }

  // 空 body の short-circuit。片側の block が 0 個のときは構造情報そのもの
  // が存在しないので、差分は純粋な翻訳欠落 (または純粋な追加) — これは
  // weighted LCS が segment-missing / segment-extra として正確に表現する。
  // ここで structure mismatch を出してしまうと reviewer が頼りにする per-
  // segment の drill-down が消えるので、必ずフォールスルーする。
  if (enBlocks.length === 0 || jaBlocks.length === 0) {
    return [];
  }

  // Stage A — block kind multiset の不一致。
  //
  // 「全文構造保持」を保証するという PR2 の目的に忠実に従い、block kind
  // の **多重集合 (multiset)** が違えば section-structure-mismatch を
  // 1 件 emit する。これにより以下が headline signal として可視化される:
  //
  //   - paragraph merge (3p → 1p) / split (1p → 3p) のような同種 kind の
  //     count drift
  //   - list→paragraph collapse / callout→paragraph collapse /
  //     ordered↔unordered list swap / details-summary 消失のような
  //     cross-kind drift
  //   - mixed-kind の数違い (例: [p, p, ul] vs [p, ul])
  //
  // structure comparator は LCS と **並行** で動かす設計 (alignSegments
  // を参照) なので、Stage A が fire しても LCS の per-segment drill-down
  // (segment-missing / segment-extra / segment-token-gap) は通常通り出る。
  // section-level の structure-mismatch は headline、segment-level の
  // LCS diff は drill-down として共存する契約。
  //
  // 例外は cross-section body swap で、その場合は呼び出し側 (alignSegments)
  // が `segment-shifted` を先に emit して structure comparator 自体を
  // skip するので、ここでは考慮しなくてよい。
  const enMultiset = buildMultiset(enKinds);
  const jaMultiset = buildMultiset(jaKinds);
  if (!multisetsEqual(enMultiset, jaMultiset)) {
    return [buildKindMultisetDiff(enSection, jaSection, enKinds, jaKinds)];
  }

  // Stage B — kind sequence (multiset 一致 / 並び順のみ不一致)。
  //
  // ここに来た時点で multiset は一致しているので、kind 列が違えば必ず
  // 「mixed-kind reorder」(例: [p, ul] vs [ul, p]) のケース。
  if (!sequencesEqual(enKinds, jaKinds)) {
    return [buildKindSequenceDiff(enSection, jaSection, enKinds, jaKinds)];
  }

  // Stage C — content-order bijection。ここに来た時点で multiset と
  // kind 列の両方が完全一致している。block kind では区別できない same-kind
  // swap / rotation を、invariant token の content bijection で検出する。
  const permutation = detectContentOrderPermutation(enBlocks, jaBlocks);
  if (permutation) {
    return [buildContentOrderDiff(enSection, jaSection, enKinds, jaKinds, permutation)];
  }

  return [];
}

// テスト用の re-export。
export { collapseBodyToBlocks as __collapseBodyToBlocks };
