"""source_usability の unit test。

conformance test (test_source_usability_parity.py) が mjs との byte 一致を担当。
ここでは Layer 1/2/3 の branching、extract_error 経路、threshold 境界を確認。
"""

from __future__ import annotations

from testim_parity.source_usability import detect_source_usability


def _heading(*, kind="heading"):
    return {"segmentKind": kind}


def _body():
    return {"segmentKind": "paragraph"}


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
