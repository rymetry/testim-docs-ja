"""比較前 source usability gate (``source_parity_source_usability.mjs`` port)。

EN snapshot が比較不能なページ (shallow / collapsed / malformed) を
``align_segments`` の前に検出し、``snapshot-incomplete`` または
``source-unusable`` を 1 件だけ返す純粋関数を提供する。比較可能なら ``None``。
I/O は一切しない。

判定順序は Layer 2 (escaped-details-residue) → Layer 1 (extractor-empty) →
Layer 3 (shallow-snapshot)。Layer 2 が最優先な理由は設計書 §4.6.1 参照。

mjs と byte-identical な issue payload (``type`` / ``severity`` / ``scope`` /
``detail`` / ``usabilitySignals``) を返す。``usabilitySignals`` の key 順序も
mjs の object literal 順と一致させる。
"""

from __future__ import annotations

import re
from collections.abc import Sequence
from typing import Any

from .preprocess_en import preprocess_en_html

__all__ = ["detect_source_usability"]


# 閾値定数 — detector 内部に閉じており外部から差し替えない (mjs と同値)。
_MIN_JA_BODY_FOR_EXTRACTOR_EMPTY = 3
_MAX_EN_BODY_FOR_SHALLOW = 2
_MIN_JA_BODY_FOR_SHALLOW = 5
_MIN_JA_EN_RATIO_FOR_SHALLOW = 4
_MAX_EN_RAW_HTML_FOR_SHALLOW = 800

# residual escaped details marker 検出用。mjs の /gi ``matchAll`` 等価。
_RESIDUAL_DETAILS_OPEN_RE = re.compile(r"&lt;details(\b[^>]*)?&gt;", re.IGNORECASE)
_RESIDUAL_DETAILS_CLOSE_RE = re.compile(r"&lt;/details&gt;", re.IGNORECASE)


def _is_heading_segment(segment: Any) -> bool:
    """segment が heading かどうか。dict または object のどちらも許容 (mjs 等価)。"""
    if isinstance(segment, dict):
        return segment.get("segmentKind") == "heading"
    return getattr(segment, "segmentKind", None) == "heading"


def _collect_signals(
    raw_en_html: str,
    en_segments: Sequence[Any],
    ja_segments: Sequence[Any],
) -> dict[str, Any]:
    """signals dict を組み立てる (mjs ``collectSignals`` 等価)。

    ``reason`` は ``None`` で初期化し ``_build_issue`` で埋める。mjs の
    object literal key 順を厳守 (conformance で key 順も byte 比較するため)。
    """
    en_body_count = sum(1 for s in en_segments if not _is_heading_segment(s))
    en_heading_count = len(en_segments) - en_body_count
    ja_body_count = sum(1 for s in ja_segments if not _is_heading_segment(s))
    ja_heading_count = len(ja_segments) - ja_body_count

    # preprocess_en_html は idempotent — 再呼び出しで residual を観測する
    preprocessed = preprocess_en_html(raw_en_html)
    residual_open = len(_RESIDUAL_DETAILS_OPEN_RE.findall(preprocessed))
    residual_close = len(_RESIDUAL_DETAILS_CLOSE_RE.findall(preprocessed))

    return {
        "enRawHtmlLength": len(raw_en_html),
        "enBodySegmentCount": en_body_count,
        "enHeadingSegmentCount": en_heading_count,
        "jaBodySegmentCount": ja_body_count,
        "jaHeadingSegmentCount": ja_heading_count,
        "residualEscapedDetailsOpen": residual_open,
        "residualEscapedDetailsClose": residual_close,
        "reason": None,
    }


def _describe_reason(issue_type: str, reason: str, signals: dict[str, Any]) -> str:
    """reviewer 向け 1 行 detail 文字列 (mjs ``describeReason`` 等価)。

    detail 末尾に ``[reason=<reason>]`` を埋め込み、``detailIncludes`` /
    ``detailRegex`` が安定して狙い撃てるようにする。
    """
    token_suffix = f" [reason={reason}]"

    if reason == "extractor-empty":
        return (
            f"EN snapshot extractor produced 0 body segments while JA has "
            f"{signals['jaBodySegmentCount']} body segments — "
            f"snapshot likely shallow / fetch incomplete{token_suffix}"
        )
    if reason == "escaped-details-residue":
        n = signals["residualEscapedDetailsOpen"] + signals["residualEscapedDetailsClose"]
        return (
            f"EN HTML still contains {n} escaped <details> markers after preprocessEnHtml "
            f"— widget tree is unbalanced and comparator cannot align sections"
            f"{token_suffix}"
        )
    if reason == "shallow-snapshot":
        en_body = signals["enBodySegmentCount"]
        ja_body = signals["jaBodySegmentCount"]
        # mjs は en_body=0 のとき ja_body をそのまま detail に埋める (数字のみ、
        # .toFixed(1) 経路に入らない)。非 0 のときだけ 1 decimal の ratio を出す。
        ratio = str(ja_body) if en_body == 0 else f"{ja_body / en_body:.1f}"
        return (
            f"EN body has {en_body} segments while JA body has "
            f"{ja_body} ({ratio}× larger) — snapshot likely missing main article body"
            f"{token_suffix}"
        )
    return f"{issue_type}: {reason}{token_suffix}"


def _build_issue(issue_type: str, reason: str, signals: dict[str, Any]) -> dict[str, Any]:
    """issue payload を組み立てる。``usabilitySignals`` は signals を浅いコピー。"""
    # mjs ``{ ...signals, reason }`` 等価: signals を展開後に reason を上書き
    usability_signals = {**signals, "reason": reason}
    return {
        "type": issue_type,
        "severity": "actionable",
        "scope": "page",
        "detail": _describe_reason(issue_type, reason, signals),
        "usabilitySignals": usability_signals,
    }


def detect_source_usability(
    *,
    raw_en_html: Any,
    en_segments: Any,
    ja_segments: Any,
    extract_error: Any | None = None,
) -> dict[str, Any] | None:
    """比較前 usability gate (mjs ``detectSourceUsability`` 等価)。

    判定順序:

    - Layer 2 (escaped-details-residue): broken details tree の証拠
    - Layer 1 (extractor-empty): clean HTML なのに EN body=0
    - Layer 3 (shallow-snapshot): thin source (raw byte 閾値) + body 比率

    ``extract_error`` が non-None のときは Layer 1 / Layer 3 を skip し
    ``raw_en_html`` 単独で動く Layer 2 (imbalance のみ) だけを評価する
    (設計書 §4.6.2)。
    """
    if not isinstance(raw_en_html, str) or len(raw_en_html) == 0:
        return None
    if not isinstance(en_segments, Sequence) or not isinstance(ja_segments, Sequence):
        return None
    # str は Sequence だが segment list ではないので除外
    if isinstance(en_segments, str) or isinstance(ja_segments, str):
        return None

    signals = _collect_signals(raw_en_html, en_segments, ja_segments)

    has_broken_details_tree = (
        signals["residualEscapedDetailsClose"] > 0
        or signals["residualEscapedDetailsOpen"] != signals["residualEscapedDetailsClose"]
    )

    has_section_anchor_failure = (
        signals["enHeadingSegmentCount"] == 0 and signals["jaHeadingSegmentCount"] >= 2
    )

    if extract_error is not None:
        # extractError 経路: imbalance (open != close) のみで判定。balanced な
        # escaped examples は None に落として align-exception fallback に送る。
        has_imbalanced_details_tree = (
            signals["residualEscapedDetailsOpen"] != signals["residualEscapedDetailsClose"]
        )
        if has_imbalanced_details_tree:
            return _build_issue("source-unusable", "escaped-details-residue", signals)
        return None

    # extractError なし: broken tree かつ section anchor failure の両方を要求
    if has_broken_details_tree and has_section_anchor_failure:
        return _build_issue("source-unusable", "escaped-details-residue", signals)

    # Layer 1: extractor-empty
    if (
        signals["enBodySegmentCount"] == 0
        and signals["jaBodySegmentCount"] >= _MIN_JA_BODY_FOR_EXTRACTOR_EMPTY
    ):
        return _build_issue("snapshot-incomplete", "extractor-empty", signals)

    # Layer 3: shallow-snapshot — thin source + body ratio
    has_thin_source_evidence = signals["enRawHtmlLength"] <= _MAX_EN_RAW_HTML_FOR_SHALLOW

    if (
        has_thin_source_evidence
        and signals["enBodySegmentCount"] <= _MAX_EN_BODY_FOR_SHALLOW
        and signals["jaBodySegmentCount"] >= _MIN_JA_BODY_FOR_SHALLOW
        and signals["jaBodySegmentCount"]
        >= max(signals["enBodySegmentCount"], 1) * _MIN_JA_EN_RATIO_FOR_SHALLOW
    ):
        return _build_issue("snapshot-incomplete", "shallow-snapshot", signals)

    return None
