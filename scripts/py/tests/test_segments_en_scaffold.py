"""Phase 1.0 scaffold sanity tests — ``segments_en``。

scaffolding の import 解決と型境界が壊れていないことだけを確認する。実際の
segment 抽出ロジックは Phase 1.2 で追加され、そのタイミングで conformance
test (``tests/conformance/test_segments_en_parity.py``) が本格的なカバレッジを
担う。
"""

from __future__ import annotations

from testim_parity.segments_en import extract_segments_from_html


def test_extract_segments_scaffold_returns_empty():
    """Phase 1.0 scaffold は空 list を返す。Phase 1.2 で本体を実装して差し替える。"""
    segments = extract_segments_from_html("<p>hello</p>")
    assert segments == []


def test_extract_segments_scaffold_accepts_slug():
    """slug が callout normalization allowlist 判定に使われる (Phase 1.1+)。"""
    segments = extract_segments_from_html("<p>x</p>", slug="administration/api-access")
    assert segments == []
