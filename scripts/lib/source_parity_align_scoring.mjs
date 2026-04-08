/**
 * alignment / structure comparator が共有するペアスコアリング
 * (Issue #247 PR2)。
 *
 * `scoreSegmentMatch` は以下の 2 者が共通で使うペア単位の等価性オラクル:
 *   - `source_parity_align.mjs` — section body 内の weighted LCS
 *   - `source_parity_structure.mjs` — Stage C の content-order bijection
 *
 * このファイルに切り出した目的は、両 comparator が **同一の** スコア階層
 * (fingerprint > textNorm > token overlap > weak position/length > kind floor)
 * を見られるようにするため。align.mjs ↔ structure.mjs の循環 import を避ける
 * 抽出リファクタであり、挙動変更はゼロ。
 *
 * 純粋関数のみ。mutation / I/O は一切しない。
 *
 * @module source_parity_align_scoring
 */

// JA 側が翻訳済みかどうかを判定する CJK 系レンジ。
// ひらがな・カタカナ・CJK 統合漢字・半角/全角・CJK 互換をまとめて見る。
// ちゃんと翻訳された JA 段落が「英文残留」に誤判定されない幅を確保している。
export const CJK_RE =
  /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/;

// スコアの重み。weighted LCS が常に強いアンカーを優先するよう、
// STRONG > MEDIUM > WEAK の関係を保つこと。絶対値ではなく相対関係のみが重要。
export const SCORE_FINGERPRINT_MATCH = 1000;
export const SCORE_TEXTNORM_MATCH = 500;
export const SCORE_TOKEN_OVERLAP_BASE = 100;
export const SCORE_TOKEN_OVERLAP_PER_TOKEN = 10;
export const SCORE_WEAK_POSITION_MAX = 10;
export const SCORE_WEAK_LENGTH_MAX = 5;
export const SCORE_KIND_FLOOR = 1;

/**
 * 2 つの segment が各 section body 内のどれくらい近い相対位置にいるかを
 * スコア化する。完全にズレている (片方は先頭 / もう片方は末尾) なら 0、
 * 正規化位置が一致していれば `SCORE_WEAK_POSITION_MAX`。長さ ≤ 1 の
 * section は位置情報が取れないので中間値にフォールバックする。
 */
export function computeWeakPositionScore(i, j, n, m) {
  if (n <= 1 || m <= 1) return Math.floor(SCORE_WEAK_POSITION_MAX / 2);
  const enRatio = i / (n - 1);
  const jaRatio = j / (m - 1);
  const distance = Math.abs(enRatio - jaRatio);
  return Math.max(0, Math.round(SCORE_WEAK_POSITION_MAX * (1 - distance)));
}

/**
 * 2 つの segment のテキスト長がどれくらい近いかをスコア化する。JA は EN
 * より短くなりがちなので、強い予測力は無い弱いヒント扱い。両側空なら 0 を
 * 返す (ゼロ割り回避)。
 */
export function computeWeakLengthScore(enText, jaText) {
  if (!enText || !jaText) return 0;
  const minLen = Math.min(enText.length, jaText.length);
  const maxLen = Math.max(enText.length, jaText.length);
  if (maxLen === 0) return 0;
  return Math.round(SCORE_WEAK_LENGTH_MAX * (minLen / maxLen));
}

/**
 * 候補となる segment ペアに対して数値マッチスコアを計算する。weighted LCS
 * と Stage C content-order bijection の両方がこれを呼ぶ。階層は:
 *
 *   1. `sourceFingerprint` 完全一致 (1000) — raw text が同一。cross-language
 *      では稀だが、invariant が多い行や synthetic fixture でよく当たる。
 *   2. `textNorm` 完全一致 (500) — 正規化済み散文が同一。
 *   3. Invariant token overlap (100 + 10/token)。両側が token を持っている
 *      必要がある。token 集合が disjoint の場合は 0 を返す — これは強い
 *      否定エビデンスなので、絶対にマッチさせない契約。
 *   4. 同一言語ペナルティ (0) — 両側 ASCII のみで `textNorm` が違う。
 *      ほぼ間違いなく別コンテンツなので 0。
 *   5. Tokenless cross-language (1–15) — 正規化位置の近さと長さ比から作る
 *      ベストエフォートの弱スコア。これが「kind-only LCS で中央の削除が
 *      enIndex=0 に潰れる」regression を治した位置認識スコア。
 *   6. 床 (1) — kind は一致するが texual signal も位置情報も無いペア。
 *      マッチは可能だが最弱なので、他のマッチが必ず tie を割る。
 *
 * segment を絶対にマッチさせてはならないケース (kind 違い / token 集合
 * disjoint / ASCII のみで別テキスト) では 0 を返す。weighted LCS も
 * structure comparator も 0 を「ハード非マッチ」として扱う。
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
    return 0; // token 集合 disjoint — 強い非マッチ
  }

  // 同一言語ペナルティ: 両側 ASCII のみで textNorm が違う場合。
  if (en.textNorm && ja.textNorm && !CJK_RE.test(en.textNorm) && !CJK_RE.test(ja.textNorm)) {
    return 0;
  }

  // Tokenless cross-language: 位置と長さから作る弱スコア。
  const positionScore = computeWeakPositionScore(
    enLocalIndex,
    jaLocalIndex,
    enSectionLen,
    jaSectionLen,
  );
  const lengthScore = computeWeakLengthScore(en.textNorm, ja.textNorm);
  return Math.max(SCORE_KIND_FLOOR, positionScore + lengthScore);
}
