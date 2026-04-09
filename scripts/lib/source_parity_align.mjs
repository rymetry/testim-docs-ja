/**
 * Section 単位で canonical segment の exact diff を計算する。
 *
 * EN segment 列と JA segment 列を比較し、最小差分を `ParityDiff` として返す。
 *
 *   - `segment-missing`      EN にあり JA に無い body segment
 *   - `segment-extra`        JA にあり EN に無い body segment
 *   - `segment-shifted`      section body が別 section と入れ替わった強い証拠がある
 *   - `segment-untranslated` JA segment がまだ英語のまま残っている
 *   - `segment-token-gap`    対応する JA segment に EN の invariant token が欠ける
 *
 * 処理の流れ:
 *   1. gate 対象 kind と `heading` だけを残す。
 *   2. heading 境界で section に分割する。最初の section は preface。
 *   3. section 数が合わなければ cascade を避けるため `inconclusive` にする。
 *   4. 各 (en, ja) section で cross-section の token 証拠を見て、
 *      body swap の可能性が高ければ `segment-shifted` を 1 件だけ返す。
 *   5. それ以外は重み付き LCS で section 内の対応付けを作る。
 *   6. unmatched な EN body は `segment-missing`、
 *      unmatched な JA body は `segment-extra` または `segment-untranslated`。
 *   7. 対応付いた pair では invariant token の欠落を `segment-token-gap` として出す。
 *
 * heading 自体は個別 diff しない。section 境界としてだけ使い、
 * section 内 LCS を局所化して「1 箇所の変化が隣 section に波及しない」ことを優先する。
 *
 * token を持たない prose-only section 同士の入れ替わりは exact gate の対象外。
 * 判断材料が弱いときは green にせず `inconclusive` を返す。
 *
 * 純粋関数として実装し、入力配列は mutate しない。
 *
 * @module source_parity_align
 */

import { GATE_ELIGIBLE_KINDS } from './source_parity_segments_shared.mjs';
import {
  CJK_RE,
  scoreSegmentMatch,
  // 下で __scoreSegmentMatch として re-export している — align.mjs 経由で
  // import している既存テストを壊さないための後方互換。
} from './source_parity_align_scoring.mjs';
import { compareSectionStructure } from './source_parity_structure.mjs';

const GATE_KIND_SET = new Set(GATE_ELIGIBLE_KINDS);

// JA segment を untranslated と判定する最小 prose 長。
// `OK` や `URL:` のような短い断片で誤検知しないために使う。
const MIN_UNTRANSLATED_PROSE_LENGTH = 15;
const MIN_UNTRANSLATED_WORD_COUNT = 3;

// ---------------------------------------------------------------------------
// Section 分割
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
 * flat な segment 列を heading 境界ごとに section へ分割する。
 * 先頭 section は preface で、heading 前の segment を受け持つ。
 * heading 自体は body に含めず、境界としてだけ使う。
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
// align と structure comparator で同じスコア階層を共有する。

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
 * 現在の section body が、別 section へ移ってしまった証拠を探す。
 *
 * 判定は保守的にしており、「token overlap が 0」だけでは shift とみなさない。
 * 誤訳した CLI flag 1 個だけで structure shift 扱いになるのを防ぐため、
 * 次をすべて満たしたときだけ `segment-shifted` を出す。
 *
 *   - 現在の en/ja token 集合が完全に非交差
 *   - 別の EN section に、現在 JA token の有意な重なり先がある
 *   - 別の JA section に、現在 EN token の有意な重なり先がある
 *   - その行き先が両方向で一致し、2 位候補より明確に強い
 *
 * 条件を満たさなければ通常の LCS へ落とす。怪しく見えても、
 * 正しい答えが `segment-token-gap` / `segment-missing` / `segment-extra`
 * のことがあるため。
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
 * token を持たない隣接 section 同士は、exact diff が出ていなくても
 * 「本当に差分なし」と言い切れないことがある。
 *
 * 利用できる非意味的 signal は段落長の近さしかないため、現在の組み合わせと
 * swap 後の組み合わせが near tie なら曖昧扱いにし、green ではなく
 * `inconclusive` に落とす。
 */
function detectAmbiguousAdjacentTokenlessSwap(enSections, jaSections, diffs) {
  const sectionHasDiff = new Set();
  for (const diff of diffs) {
    if (typeof diff.sectionIndex === 'number') sectionHasDiff.add(diff.sectionIndex);
  }

  for (let i = 0; i < enSections.length - 1; i++) {
    const j = i + 1;
    if (sectionHasDiff.has(i) || sectionHasDiff.has(j)) continue;
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
 * 対応する 2 つの section を比較し、section 内 diff を返す。
 * heading は body に含めず、section の対応関係は位置で暗黙に決める。
 *
 * 先に body swap の証拠を確認し、十分なら `segment-shifted` を 1 件だけ返す。
 * 証拠が足りない場合は重み付き LCS に落として token-gap / missing / extra を
 * 素直に出す。
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

  // unmatched な EN body segment は `segment-missing`。
  for (let i = 0; i < enBody.length; i++) {
    if (enMatchedIndices.has(i)) continue;
    diffs.push(diffMissing(enSection, enBody[i], i));
  }

  // unmatched な JA body segment は `segment-extra` または `segment-untranslated`。
  for (let j = 0; j < jaBody.length; j++) {
    if (jaMatchedIndices.has(j)) continue;
    const seg = jaBody[j];
    if (looksUntranslated(seg.textNorm)) {
      diffs.push(diffUntranslated(enSection, seg, j));
    } else {
      diffs.push(diffExtra(enSection, seg, j));
    }
  }

  // 対応付いた pair では token-gap と inline untranslated を確認する。
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
// 公開 API
// ---------------------------------------------------------------------------

/**
 * @typedef {object} ParityDiff
 * @property {string} type                diff 種別
 * @property {string} sectionPath         EN 側 section path
 * @property {number} sectionIndex        文書順の 0-based section index
 * @property {string} segmentKind         対象 segment の canonical kind
 * @property {number|null} enIndex        section 内 EN body index
 * @property {number|null} jaIndex        section 内 JA body index
 * @property {number|null} enSegmentIndex section/kind 単位の EN segment index
 * @property {number|null} jaSegmentIndex section/kind 単位の JA segment index
 * @property {string|null} enSourceFingerprint  EN raw text の sha256 fingerprint
 * @property {string|null} jaSourceFingerprint  JA raw text の sha256 fingerprint
 * @property {string} detail              人間向け要約
 * @property {string} [confidence]        `segment-shifted` 時の確信度
 * @property {string[]} [missingTokens]   `segment-token-gap` の欠落 token
 * @property {string[]} [enSectionTokens] high-confidence shift 時の EN section token
 * @property {string[]} [jaSectionTokens] high-confidence shift 時の JA section token
 */

/**
 * @typedef {object} AlignResult
 * @property {ParityDiff[]} diffs
 * @property {number} sectionsAligned        alignment した section pair 数
 * @property {number} sectionsCompared       比較した section pair 数
 * @property {boolean} inconclusive          alignment を打ち切ったか
 * @property {string|null} inconclusiveReason
 * @property {'heading-count-mismatch'|'align-exception'|'tokenless-near-tie'|null} inconclusiveCategory
 * @property {{
 *   leftSectionPath?: string,
 *   rightSectionPath?: string,
 *   currentScore?: number,
 *   swapScore?: number,
 * } | null} inconclusiveMeta
 *   baseline lookup 用の構造化 enum。
 *   `inconclusiveReason` は表示用なので identity key に使わない。
 */

/**
 * EN canonical segments と JA canonical segments を整列し、diff 一覧を返す。
 * 詳細な契約は module header を参照。
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
      inconclusiveCategory: 'heading-count-mismatch',
      inconclusiveMeta: null,
      inconclusiveReason:
        `Heading count mismatch: EN has ${enSections.length - 1} headings, ` +
        `JA has ${jaSections.length - 1}`,
    };
  }

  // section ごとの invariant token 集合を先に作り、
  // cross-section best-match 判定で毎回 section を再走査しない。
  const enSectionTokensList = enSections.map(collectSectionTokens);
  const jaSectionTokensList = jaSections.map(collectSectionTokens);
  const crossSectionInfo = { enSectionTokensList, jaSectionTokensList };

  const diffs = [];
  for (let i = 0; i < enSections.length; i++) {
    // まず cross-section shift を判定する。
    // body swap が起きた section では `segment-shifted` を headline にし、
    // 同じ section の structure diff は重複報告になるため抑止する。
    // shift していない section は structure diff と segment diff を併記し、
    // section レベルの要約と drill-down を両方残す。
    const sectionDiffs = alignSection(enSections[i], jaSections[i], crossSectionInfo);
    const hasShift = sectionDiffs.some((d) => d.type === 'segment-shifted');

    if (!hasShift) {
      const structureDiffs = compareSectionStructure(enSections[i], jaSections[i]);
      for (const diff of structureDiffs) diffs.push(diff);
    }

    for (const diff of sectionDiffs) diffs.push(diff);
  }

  const ambiguousTokenlessSwap = detectAmbiguousAdjacentTokenlessSwap(
    enSections,
    jaSections,
    diffs,
  );
  if (ambiguousTokenlessSwap) {
    return {
      diffs,
      sectionsAligned: enSections.length,
      sectionsCompared: enSections.length,
      inconclusive: true,
      inconclusiveCategory: 'tokenless-near-tie',
      inconclusiveMeta: {
        leftSectionPath: ambiguousTokenlessSwap.leftSectionPath,
        rightSectionPath: ambiguousTokenlessSwap.rightSectionPath,
        currentScore: ambiguousTokenlessSwap.currentScore,
        swapScore: ambiguousTokenlessSwap.swapScore,
      },
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
    inconclusiveCategory: null,
    inconclusiveMeta: null,
    inconclusiveReason: null,
  };
}

// ---------------------------------------------------------------------------
// Runtime adapter: ParityDiff を旧 issue 形式へ変換する
// ---------------------------------------------------------------------------

const SEGMENT_ISSUE_SEVERITY = Object.freeze({
  'segment-missing': 'actionable',
  'segment-extra': 'actionable',
  'segment-shifted': 'actionable',
  'segment-untranslated': 'actionable',
  'segment-token-gap': 'actionable',
  // section 単位の structure diff も同じ adapter に流す。
  'section-structure-mismatch': 'actionable',
  'segment-order-mismatch': 'actionable',
});

/**
 * `alignSegments` が返した ParityDiff レコードを、`check_source_parity.mjs` /
 * `tagIssuesWithAcknowledgements` / `summarizeParityResults` が消費する
 * 旧来の `{ type, severity, detail, line? }` 形式に変換する。純粋関数 —
 * 入力を mutate しない。
 *
 * 各 diff は 1:1 で 1 issue になる。`detail` には section path を埋め込んで
 * おくことで、acknowledgement matcher の `detailIncludes` / `detailRegex` が
 * section 単位で狙えるようになる。その他の構造化メタデータ
 * (`enSegmentIndex` / `jaSegmentIndex` / fingerprint / missingTokens) は
 * そのまま forward して、downstream report が drill-down できるようにする。
 *
 * section 単位の structure diff は独自 payload を持つので、そのまま転送する。
 * `segmentKind` を補わず、section スコープの契約を維持する。
 *
 * segment-* 系 issue は通常の gate 集計にそのまま流す。
 *
 * @param {ParityDiff[]} diffs
 * @returns {Array<object>}
 */
export function parityDiffsToIssues(diffs) {
  if (!Array.isArray(diffs)) return [];
  return diffs.map((diff) => {
    const sectionLabel = diff.sectionPath || '(preface)';
    const severity = SEGMENT_ISSUE_SEVERITY[diff.type] ?? 'actionable';

    // section 単位 diff は segment 単位 diff と payload が異なる。
    if (diff.scope === 'section') {
      const issue = {
        type: diff.type,
        severity,
        detail: `[${sectionLabel}] ${diff.detail}`,
        sectionPath: diff.sectionPath,
        sectionIndex: diff.sectionIndex,
        scope: 'section',
        structureCategory: diff.structureCategory,
        enKinds: [...diff.enKinds],
        jaKinds: [...diff.jaKinds],
        enSegmentCount: diff.enSegmentCount,
        jaSegmentCount: diff.jaSegmentCount,
      };
      if (Array.isArray(diff.contentPermutation)) {
        issue.contentPermutation = diff.contentPermutation.map((entry) => ({
          enIndex: entry.enIndex,
          jaIndex: entry.jaIndex,
          score: entry.score,
        }));
      }
      return issue;
    }

    const issue = {
      type: diff.type,
      severity,
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

// helper へ直接アクセスしたい test / consumer 向けの re-export。
export {
  weightedLcs as __weightedLcs,
  scoreSegmentMatch as __scoreSegmentMatch,
  looksUntranslated as __looksUntranslated,
  splitIntoSections as __splitIntoSections,
  findBodySwapEvidence as __findBodySwapEvidence,
};
