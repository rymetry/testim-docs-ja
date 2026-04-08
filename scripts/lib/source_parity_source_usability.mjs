/**
 * 比較前 source usability gate (Issue #247 PR3)。
 *
 * EN snapshot が比較不能なページ (shallow / collapsed / malformed) を
 * `alignSegments` の前に検出し、`snapshot-incomplete` または `source-unusable`
 * を 1 件だけ返す純粋関数を提供する。
 *
 * 比較可能なら null を返す。I/O は一切しない。
 *
 * 設計書: docs/superpowers/specs/2026-04-08-issue-247-pr3-source-usability-design.md
 */

import { preprocessEnHtml } from './turndown.mjs';

// ---------------------------------------------------------------------------
// 閾値定数 — detector 内部に閉じており外部から差し替えない。
// テストは fixture で実値を pin する (設計書 §4.1)。
// ---------------------------------------------------------------------------

/** extractor-empty で発火するための最小 JA body segment 数 */
const MIN_JA_BODY_FOR_EXTRACTOR_EMPTY = 3;

/** shallow-snapshot の EN body segment 数の上限 (含む) */
const MAX_EN_BODY_FOR_SHALLOW = 2;

/** shallow-snapshot で発火するための最小 JA body segment 数 */
const MIN_JA_BODY_FOR_SHALLOW = 5;

/**
 * shallow-snapshot の JA/EN body segment 比率の最小値。
 * max(enBodySegmentCount, 1) との比率で判定する。
 */
const MIN_JA_EN_RATIO_FOR_SHALLOW = 4;

/**
 * shallow-snapshot の thin source 独立証拠: rawEnHtml.length の上限 (含む)。
 * 実測値: salesforce-testing-overview=361 bytes (broken) vs
 *         debugging-overview=832 bytes (legitimate short overview)
 * の間に設定。OR で enHeadingSegmentCount===0 を追加しない (§4.6.3 参照)。
 */
const MAX_EN_RAW_HTML_FOR_SHALLOW = 800;

// ---------------------------------------------------------------------------
// 公開 API
// ---------------------------------------------------------------------------

/**
 * 比較前 usability gate。EN snapshot 起因で comparator が成立しない
 * ページを検出し、`alignSegments` / `compareSnapshotStructure` を走らせる前に
 * 1 件の issue を返す。比較可能なら null を返す。
 *
 * 純粋関数 — 入力を mutate しない。I/O は一切しない。
 *
 * 判定順序は Layer 2 (escaped-details-residue) → Layer 1 (extractor-empty)
 * → Layer 3 (shallow-snapshot)。Layer 2 が最優先な理由は設計書 §4.6.1 を参照。
 *
 * @param {object} input
 * @param {string} input.rawEnHtml          fs.readFileSync 直後の MadCap Flare HTML
 * @param {Array}  input.enSegments         extractSegmentsFromHtml の結果
 * @param {Array}  input.jaSegments         extractSegmentsFromMarkdown の結果
 * @param {Error|null} [input.extractError] extractSegmentsFromHtml が throw した場合に渡す。
 *   non-null のとき Layer 1 / Layer 3 (enSegments を読む) を skip し、
 *   rawEnHtml 単独で動く Layer 2 だけを評価する (設計書 §4.6.2)。
 * @returns {{ type: string, severity: 'actionable', scope: 'page', detail: string,
 *             usabilitySignals: object } | null}
 */
export function detectSourceUsability({
  rawEnHtml,
  enSegments,
  jaSegments,
  extractError = null,
}) {
  if (typeof rawEnHtml !== 'string' || rawEnHtml.length === 0) return null;
  if (!Array.isArray(enSegments) || !Array.isArray(jaSegments)) return null;

  const signals = collectSignals(rawEnHtml, enSegments, jaSegments);

  // -------------------------------------------------------------------------
  // Layer 2: escaped-details-residue — broken details tree の証拠がある場合
  //
  // 「escaped marker が残存する」だけでは条件が広すぎる。例として
  // `advanced-editing/coding-assistant` は `<details>` 利用例を本文中に
  // 含むため preprocessEnHtml 後も balanced な escaped marker が残るが、
  // extractor / comparator は正常に動作する。
  //
  // 2 つの条件を AND で要求する:
  //
  //   hasBrokenDetailsTree (通常経路):
  //     残存 close marker がある (orphan close) か open/close が不均衡。
  //     `faq` は orphan `&lt;/details&gt;` で close=1, open=0 → TRUE。
  //     `coding-assistant` は balanced (4==4) で close>0 だが open==close —
  //     ただし close>0 の OR が TRUE になるため、通常経路では
  //     hasSectionAnchorFailure を AND で必須にして誤発火を防ぐ。
  //
  //   hasSectionAnchorFailure (extractError===null のときだけ):
  //     extractor が heading を 1 つも作れず (EN section anchor が欠落)、
  //     かつ JA 側には見出しが 2 個以上ある。broken details tree が
  //     `<summary>` を section anchor として使えなくした symptom。
  //     `faq`: EN heading=0, JA heading=5 → TRUE。
  //     `coding-assistant`: EN heading=1 → FALSE。
  //
  //   extractError 経路:
  //     enSegments を信用できないため hasSectionAnchorFailure は使えない。
  //     rawEnHtml 由来のシグナルのみ使用するが、hasBrokenDetailsTree
  //     (close>0 OR imbalance) では balanced examples (coding-assistant:
  //     open=4, close=4) でも true になり extractor 回帰を source 起因と
  //     誤分類してしまう。そのため extractError 時はより狭い条件
  //     hasImbalancedDetailsTree (open !== close のみ) で判定する。
  //     balanced な tree は null に落として align-exception fallback へ送る。
  // -------------------------------------------------------------------------
  const hasBrokenDetailsTree =
    signals.residualEscapedDetailsClose > 0 ||
    signals.residualEscapedDetailsOpen !== signals.residualEscapedDetailsClose;

  const hasSectionAnchorFailure =
    signals.enHeadingSegmentCount === 0 &&
    signals.jaHeadingSegmentCount >= 2;

  // extractError 経路: imbalance (open !== close) のみで判定する。
  // balanced escaped examples は null に落として align-exception fallback へ送る。
  if (extractError !== null) {
    const hasImbalancedDetailsTree =
      signals.residualEscapedDetailsOpen !== signals.residualEscapedDetailsClose;
    if (hasImbalancedDetailsTree) {
      return buildIssue('source-unusable', 'escaped-details-residue', signals);
    }
    return null;
  }

  // extractError なし: broken tree かつ section anchor failure の両方を要求。
  if (hasBrokenDetailsTree && hasSectionAnchorFailure) {
    return buildIssue('source-unusable', 'escaped-details-residue', signals);
  }

  // -------------------------------------------------------------------------
  // Layer 1: extractor-empty
  //   Layer 2 を抜けた = clean HTML 前提。
  //   clean HTML から extractor が body=0 なら "snapshot 自体に本文がない" ほぼ確定。
  // -------------------------------------------------------------------------
  if (
    signals.enBodySegmentCount === 0 &&
    signals.jaBodySegmentCount >= MIN_JA_BODY_FOR_EXTRACTOR_EMPTY
  ) {
    return buildIssue('snapshot-incomplete', 'extractor-empty', signals);
  }

  // -------------------------------------------------------------------------
  // Layer 3: shallow-snapshot
  //   thin source 独立証拠 (raw byte size) を AND で必須にする (§4.6.3)。
  //   enHeadingSegmentCount===0 は OR で追加しない (debugging-overview の
  //   hypothetical drift で誤発火するため)。
  // -------------------------------------------------------------------------
  const hasThinSourceEvidence = signals.enRawHtmlLength <= MAX_EN_RAW_HTML_FOR_SHALLOW;

  if (
    hasThinSourceEvidence &&
    signals.enBodySegmentCount <= MAX_EN_BODY_FOR_SHALLOW &&
    signals.jaBodySegmentCount >= MIN_JA_BODY_FOR_SHALLOW &&
    signals.jaBodySegmentCount >=
      Math.max(signals.enBodySegmentCount, 1) * MIN_JA_EN_RATIO_FOR_SHALLOW
  ) {
    return buildIssue('snapshot-incomplete', 'shallow-snapshot', signals);
  }

  return null;
}

// ---------------------------------------------------------------------------
// 内部ヘルパ
// ---------------------------------------------------------------------------

/**
 * signals オブジェクトを収集する。
 * reason フィールドは null で初期化し、buildIssue で発火した reason を上書きする。
 */
function collectSignals(rawEnHtml, enSegments, jaSegments) {
  const enBodySegmentCount = enSegments.filter(s => s.segmentKind !== 'heading').length;
  const enHeadingSegmentCount = enSegments.length - enBodySegmentCount;
  const jaBodySegmentCount = jaSegments.filter(s => s.segmentKind !== 'heading').length;
  const jaHeadingSegmentCount = jaSegments.length - jaBodySegmentCount;

  // preprocessEnHtml は idempotent — 再呼び出しして residual を検出する。
  const preprocessed = preprocessEnHtml(rawEnHtml);
  const residualEscapedDetailsOpen = countMatches(preprocessed, /&lt;details(\b[^>]*)?&gt;/gi);
  const residualEscapedDetailsClose = countMatches(preprocessed, /&lt;\/details&gt;/gi);

  return {
    enRawHtmlLength: rawEnHtml.length,
    enBodySegmentCount,
    enHeadingSegmentCount,
    jaBodySegmentCount,
    jaHeadingSegmentCount,
    residualEscapedDetailsOpen,
    residualEscapedDetailsClose,
    reason: null, // buildIssue で埋める
  };
}

/**
 * issue payload を組み立てる。
 * @param {'snapshot-incomplete' | 'source-unusable'} type      issue の type
 * @param {'shallow-snapshot' | 'escaped-details-residue' | 'extractor-empty'} reason  発火した layer の識別子
 * @param {object} signals  collectSignals の戻り値
 */
function buildIssue(type, reason, signals) {
  return {
    type,
    severity: 'actionable',
    scope: 'page',
    detail: describeReason(type, reason, signals),
    usabilitySignals: { ...signals, reason },
  };
}

/**
 * reviewer 向け 1 行サマリ文字列を返す。issue payload の `detail` フィールドに使う。
 */
function describeReason(type, reason, signals) {
  switch (reason) {
    case 'extractor-empty':
      return (
        `EN snapshot extractor produced 0 body segments while JA has ` +
        `${signals.jaBodySegmentCount} body segments — snapshot likely shallow / fetch incomplete`
      );
    case 'escaped-details-residue': {
      const n =
        signals.residualEscapedDetailsOpen + signals.residualEscapedDetailsClose;
      return (
        `EN HTML still contains ${n} escaped <details> markers after preprocessEnHtml ` +
        `— widget tree is unbalanced and comparator cannot align sections`
      );
    }
    case 'shallow-snapshot': {
      const ratio =
        signals.enBodySegmentCount === 0
          ? signals.jaBodySegmentCount
          : (signals.jaBodySegmentCount / signals.enBodySegmentCount).toFixed(1);
      return (
        `EN body has ${signals.enBodySegmentCount} segments while JA body has ` +
        `${signals.jaBodySegmentCount} (${ratio}× larger) — snapshot likely missing main article body`
      );
    }
    default:
      return `${type}: ${reason}`;
  }
}

/**
 * 文字列 str 中で pattern にマッチする件数を返す。
 * @param {string} str       検索対象の文字列
 * @param {RegExp} pattern   g フラグ付き正規表現
 */
function countMatches(str, pattern) {
  let count = 0;
  // eslint-disable-next-line no-unused-vars
  for (const _ of str.matchAll(pattern)) count++;
  return count;
}
