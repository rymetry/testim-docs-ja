"""source_usability の unit test。

conformance test (test_source_usability_parity.py) が mjs との byte 一致を担当。
ここでは Layer 1/2/3 の branching、extract_error 経路、threshold 境界を確認。

Phase 5 gap-fill (source_parity_source_usability.test.mjs port): 入力ガード、
usable 正常経路、Layer 2/1/3 発火条件、payload schema pin の重要 edge case。
"""

from __future__ import annotations

import pytest

from testim_parity.source_usability import detect_source_usability


def _heading(*, kind="heading"):
    return {"segmentKind": kind}


def _body():
    return {"segmentKind": "paragraph"}


def _body_segs(n: int) -> list[dict[str, str]]:
    return [_body() for _ in range(n)]


def _mixed_segs(headings: int, body: int) -> list[dict[str, str]]:
    return [_heading() for _ in range(headings)] + [_body() for _ in range(body)]


def _clean_html(length: int) -> str:
    base = "<html><body><p>content</p></body></html>"
    if len(base) >= length:
        return base[:length]
    return base + " " * (length - len(base))


def _html_with_escaped_details(length: int) -> str:
    escaped = "<html><body><p>text</p><p>&lt;/details&gt;</p></body></html>"
    if len(escaped) >= length:
        return escaped
    return escaped + " " * (length - len(escaped))


def test_returns_none_for_invalid_inputs():
    assert detect_source_usability(raw_en_html="", en_segments=[], ja_segments=[]) is None
    assert detect_source_usability(raw_en_html=None, en_segments=[], ja_segments=[]) is None  # type: ignore[arg-type]
    assert (
        detect_source_usability(raw_en_html="x", en_segments="not-a-list", ja_segments=[]) is None
    )  # type: ignore[arg-type]


def test_extractor_empty_layer_1():
    raw = "<html><body><p>hi</p></body></html>" * 50  # raw size 大きめ
    en_segments = []
    ja_segments = [_body() for _ in range(5)]
    result = detect_source_usability(
        raw_en_html=raw, en_segments=en_segments, ja_segments=ja_segments
    )
    assert result is not None
    assert result["type"] == "snapshot-incomplete"
    assert result["usabilitySignals"]["reason"] == "extractor-empty"
    assert "[reason=extractor-empty]" in result["detail"]


def test_extractor_empty_requires_min_ja_body():
    raw = "<p>x</p>" * 200
    result = detect_source_usability(
        raw_en_html=raw, en_segments=[], ja_segments=[_body(), _body()]
    )
    assert result is None  # JA body 2 < 3 threshold


def test_shallow_snapshot_layer_3():
    # 短い raw (< 800) + en body 少 + ja body 十分 + ratio 4x 以上
    raw = "<html><body></body></html>"
    en_segments = [_body()]  # 1 body segment
    ja_segments = [_body() for _ in range(10)]
    result = detect_source_usability(
        raw_en_html=raw, en_segments=en_segments, ja_segments=ja_segments
    )
    assert result is not None
    assert result["type"] == "snapshot-incomplete"
    assert result["usabilitySignals"]["reason"] == "shallow-snapshot"


def test_shallow_requires_thin_source_evidence():
    # raw が 800 より大きいと Layer 3 発動しない
    raw = "x" * 1000
    en_segments = [_body()]
    ja_segments = [_body() for _ in range(10)]
    result = detect_source_usability(
        raw_en_html=raw, en_segments=en_segments, ja_segments=ja_segments
    )
    assert result is None


def test_escaped_details_residue_extract_error_imbalance():
    """``<p>`` で囲まれていない escaped marker は preprocess で除去されないため残る。"""
    raw = "<div>prefix &lt;details&gt; no close marker here</div>"
    result = detect_source_usability(
        raw_en_html=raw,
        en_segments=[],
        ja_segments=[_body()],
        extract_error=RuntimeError("extractor failed"),
    )
    assert result is not None
    assert result["type"] == "source-unusable"
    assert result["usabilitySignals"]["reason"] == "escaped-details-residue"


def test_escaped_details_extract_error_balanced_falls_through():
    # balanced (open == close) かつ extract_error あり → Layer 2 発動しない
    raw = "<div>&lt;details&gt;example&lt;/details&gt;</div>"
    result = detect_source_usability(
        raw_en_html=raw,
        en_segments=[],
        ja_segments=[_body()],
        extract_error=RuntimeError("boom"),
    )
    # balanced なら None (align-exception fallback へ)
    assert result is None


def test_escaped_details_no_extract_error_requires_section_anchor_failure():
    # close > 0 だが EN headings >= 1 なら section anchor failure なし → Layer 2 skip
    raw = "<div>&lt;details&gt;hi&lt;/details&gt;</div>"
    en_segments = [_heading()]  # 1 EN heading → no anchor failure
    ja_segments = [_heading(), _heading()]
    result = detect_source_usability(
        raw_en_html=raw, en_segments=en_segments, ja_segments=ja_segments
    )
    # Layer 2 trigger せず、Layer 1 (EN body = 0) も JA body = 0 なので skip
    assert result is None


# ---------------------------------------------------------------------------
# 入力ガード (非文字列 / 非リスト)
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("bad_raw", [None, 123, [], {}])
def test_rejects_non_string_raw(bad_raw) -> None:
    assert detect_source_usability(raw_en_html=bad_raw, en_segments=[], ja_segments=[]) is None


@pytest.mark.parametrize("bad_segs", [None, "not-a-list", 42])
def test_rejects_non_sequence_en_segments(bad_segs) -> None:
    assert (
        detect_source_usability(raw_en_html=_clean_html(500), en_segments=bad_segs, ja_segments=[])
        is None
    )


@pytest.mark.parametrize("bad_segs", [None, "not-a-list", 42])
def test_rejects_non_sequence_ja_segments(bad_segs) -> None:
    assert (
        detect_source_usability(raw_en_html=_clean_html(500), en_segments=[], ja_segments=bad_segs)
        is None
    )


# ---------------------------------------------------------------------------
# usable 正常経路 (Layer 1/2/3 いずれも発火しない)
# ---------------------------------------------------------------------------


def test_usable_normal_page() -> None:
    """正常ページ (raw=5000, en=10 body + 5 heading, ja=10 body + 5 heading)。"""
    result = detect_source_usability(
        raw_en_html=_clean_html(5000),
        en_segments=_mixed_segs(5, 10),
        ja_segments=_mixed_segs(5, 10),
    )
    assert result is None


def test_usable_short_stub_page_guards_against_false_positive() -> None:
    """両方短いページ stub (raw=300, en=1 body, ja=1 body) — 誤検知ガード。"""
    result = detect_source_usability(
        raw_en_html=_clean_html(300),
        en_segments=_mixed_segs(1, 1),
        ja_segments=_mixed_segs(1, 1),
    )
    assert result is None


def test_usable_en_body_above_shallow_threshold() -> None:
    """enBody=3 > MAX_EN_BODY_FOR_SHALLOW=2 → Layer 3 発火しない。"""
    result = detect_source_usability(
        raw_en_html=_clean_html(400),
        en_segments=_body_segs(3),
        ja_segments=_body_segs(8),
    )
    assert result is None


# ---------------------------------------------------------------------------
# Layer 1: extractor-empty の境界 / extract_error 経路
# ---------------------------------------------------------------------------


def test_layer1_extractor_empty_skipped_with_extract_error() -> None:
    """extractError があるとき Layer 1 は skip (§4.6.2)。"""
    result = detect_source_usability(
        raw_en_html=_clean_html(2000),
        en_segments=[],
        ja_segments=_body_segs(10),
        extract_error=RuntimeError("boom"),
    )
    assert result is None


def test_layer1_min_ja_body_boundary_ja_equals_3() -> None:
    """MIN_JA_BODY_FOR_EXTRACTOR_EMPTY=3 の境界: ja=3 で発火。"""
    result = detect_source_usability(
        raw_en_html=_clean_html(2000),
        en_segments=[],
        ja_segments=_body_segs(3),
    )
    assert result is not None
    assert result["type"] == "snapshot-incomplete"
    assert result["usabilitySignals"]["reason"] == "extractor-empty"


# ---------------------------------------------------------------------------
# Layer 2: escaped-details-residue の優先順位 / imbalance
# ---------------------------------------------------------------------------


def test_layer2_fires_before_layer1_when_imbalanced() -> None:
    """orphan close + body=0 + jaHeading≥2 → Layer 2 が優先され source-unusable。"""
    result = detect_source_usability(
        raw_en_html=_html_with_escaped_details(2000),
        en_segments=[],
        ja_segments=_mixed_segs(5, 10),
    )
    assert result is not None
    assert result["type"] == "source-unusable"
    assert result["usabilitySignals"]["reason"] == "escaped-details-residue"


def test_layer2_fires_with_extract_error_if_imbalanced() -> None:
    """extractError でも imbalance のみで Layer 2 が発火する (anchor 検査なし)。"""
    result = detect_source_usability(
        raw_en_html=_html_with_escaped_details(2000),
        en_segments=[],
        ja_segments=_body_segs(10),
        extract_error=RuntimeError("boom"),
    )
    assert result is not None
    assert result["type"] == "source-unusable"
    assert result["usabilitySignals"]["reason"] == "escaped-details-residue"


def test_layer2_not_fired_when_en_heading_exists() -> None:
    """orphan close でも enHeading≥1 なら section anchor は機能 → Layer 2 skip。"""
    result = detect_source_usability(
        raw_en_html=_html_with_escaped_details(2000),
        en_segments=_mixed_segs(2, 10),
        ja_segments=_mixed_segs(5, 10),
    )
    assert result is None


# ---------------------------------------------------------------------------
# Layer 3: shallow-snapshot の境界 / ratio / extract_error
# ---------------------------------------------------------------------------


def test_layer3_boundary_raw_equals_800_fires() -> None:
    """境界 raw=800 (包含側) → shallow-snapshot。"""
    result = detect_source_usability(
        raw_en_html=_clean_html(800),
        en_segments=_body_segs(2),
        ja_segments=_body_segs(8),
    )
    assert result is not None
    assert result["type"] == "snapshot-incomplete"
    assert result["usabilitySignals"]["reason"] == "shallow-snapshot"


def test_layer3_boundary_raw_801_does_not_fire() -> None:
    """raw=801 で thin source 不成立 → Layer 3 skip。"""
    result = detect_source_usability(
        raw_en_html=_clean_html(801),
        en_segments=_body_segs(2),
        ja_segments=_body_segs(8),
    )
    assert result is None


def test_layer3_ratio_below_4_does_not_fire() -> None:
    """ratio = 7/2 = 3.5 < 4 → Layer 3 skip。"""
    result = detect_source_usability(
        raw_en_html=_clean_html(400),
        en_segments=_body_segs(2),
        ja_segments=_body_segs(7),
    )
    assert result is None


def test_layer3_min_ja_body_below_5_does_not_fire() -> None:
    """ja=4 < MIN_JA_BODY_FOR_SHALLOW=5 → Layer 3 skip。"""
    result = detect_source_usability(
        raw_en_html=_clean_html(400),
        en_segments=_body_segs(1),
        ja_segments=_body_segs(4),
    )
    assert result is None


def test_layer3_skipped_with_extract_error() -> None:
    """extractError があるとき Layer 3 は skip (§4.6.2)。"""
    result = detect_source_usability(
        raw_en_html=_clean_html(400),
        en_segments=[],
        ja_segments=_body_segs(10),
        extract_error=RuntimeError("boom"),
    )
    assert result is None


# ---------------------------------------------------------------------------
# payload schema pin (§4.4 frozen contract)
# ---------------------------------------------------------------------------


def test_payload_schema_shallow_snapshot_keys() -> None:
    result = detect_source_usability(
        raw_en_html=_clean_html(361),
        en_segments=_body_segs(1),
        ja_segments=_body_segs(12),
    )
    assert result is not None
    # top-level fields
    for key in ("type", "severity", "scope", "detail", "usabilitySignals"):
        assert key in result, f"missing top-level key {key}"
    assert result["severity"] == "actionable"
    assert result["scope"] == "page"
    assert isinstance(result["detail"], str) and len(result["detail"]) > 0
    # usabilitySignals keys
    signals = result["usabilitySignals"]
    for key in (
        "enRawHtmlLength",
        "enBodySegmentCount",
        "enHeadingSegmentCount",
        "jaBodySegmentCount",
        "jaHeadingSegmentCount",
        "residualEscapedDetailsOpen",
        "residualEscapedDetailsClose",
        "reason",
    ):
        assert key in signals, f"missing usabilitySignals key {key}"


def test_payload_signals_numeric_fields_match_inputs() -> None:
    result = detect_source_usability(
        raw_en_html=_clean_html(361),
        en_segments=_body_segs(1),
        ja_segments=[*_body_segs(12), _heading()],
    )
    assert result is not None
    s = result["usabilitySignals"]
    assert s["enRawHtmlLength"] == 361
    assert s["enBodySegmentCount"] == 1
    assert s["enHeadingSegmentCount"] == 0
    assert s["jaBodySegmentCount"] == 12
    assert s["jaHeadingSegmentCount"] == 1
    assert s["residualEscapedDetailsOpen"] == 0
    assert s["residualEscapedDetailsClose"] == 0
    assert s["reason"] == "shallow-snapshot"
