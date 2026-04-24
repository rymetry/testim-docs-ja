"""page_coverage check functions の unit test。

conformance test (test_page_coverage_parity.py) が mjs との byte 一致を保証。
ここでは severity lookup / freshness branching / empty sidebar fallback を確認。

Phase 5 gap-fill (source_parity_page_coverage.test.mjs port): sidebar-missing /
local-orphan / missing-snapshot / freshness branching / aggregate coverage の
網羅 edge case を pytest 側に寄せる。
"""

from __future__ import annotations

import pytest

from testim_parity.page_coverage import (
    check_local_page_orphan,
    check_missing_snapshot,
    check_page_coverage,
    check_single_page_snapshot,
    check_source_page_missing_local,
)


def test_source_page_missing_local_emits_for_sidebar_only():
    issues = check_source_page_missing_local(["a", "b", "c"], ["a"])
    assert len(issues) == 2
    types = {issue["type"] for issue in issues}
    assert types == {"source-page-missing-local"}
    assert all(issue["severity"] == "actionable" for issue in issues)


def test_local_page_orphan_empty_sidebar_skips():
    """sidebar が空のときは local 全件を orphan 判定しない (mjs と同じ)。"""
    issues = check_local_page_orphan(["a", "b"], [])
    assert issues == []


def test_local_page_orphan_emits_only_local_not_in_sidebar():
    issues = check_local_page_orphan(["a", "b", "c"], ["a", "c"])
    assert len(issues) == 1
    assert issues[0]["type"] == "local-page-orphan"
    assert "b" in issues[0]["detail"]
    assert issues[0]["severity"] == "actionable"


def test_missing_snapshot_fresh_uses_actionable_type():
    issues = check_missing_snapshot({"a": "https://x", "b": "https://y"}, ["a"], "fresh")
    assert len(issues) == 1
    assert issues[0]["type"] == "missing-fresh-snapshot"
    assert issues[0]["severity"] == "actionable"


def test_missing_snapshot_stale_uses_signal_type():
    issues = check_missing_snapshot({"a": "https://x"}, [], "stale")
    assert len(issues) == 1
    assert issues[0]["type"] == "missing-snapshot"
    assert issues[0]["severity"] == "signal"


def test_missing_snapshot_none_freshness_uses_signal_type():
    issues = check_missing_snapshot({"a": "https://x"}, [], None)
    assert len(issues) == 1
    assert issues[0]["type"] == "missing-snapshot"


def test_single_page_snapshot_skips_without_source_url():
    assert check_single_page_snapshot("a", None, [], "fresh") == []
    assert check_single_page_snapshot("a", "", [], "fresh") == []


def test_single_page_snapshot_skips_when_snapshot_exists():
    assert check_single_page_snapshot("a", "https://x", ["a"], "fresh") == []


def test_single_page_snapshot_emits_when_missing():
    issues = check_single_page_snapshot("a", "https://x", [], "fresh")
    assert len(issues) == 1
    assert issues[0]["type"] == "missing-fresh-snapshot"


def test_check_page_coverage_concatenates_in_order():
    """sidebar-missing → orphan → snapshot の順で連結される (mjs 等価)。"""
    issues = check_page_coverage(
        sidebar_slugs=["a", "b"],
        local_slugs=["b", "c"],
        local_source_urls={"c": "https://x"},
        snapshot_slugs=[],
        freshness_state="fresh",
    )
    types = [issue["type"] for issue in issues]
    # a は sidebar にあるが local に無い (source-page-missing-local)
    assert "source-page-missing-local" in types
    # c は local にあるが sidebar に無い (local-page-orphan)
    assert "local-page-orphan" in types
    # c は sourceUrl あるが snapshot なし (missing-fresh-snapshot)
    assert "missing-fresh-snapshot" in types
    # 順序 guarantee
    order_map = {t: i for i, t in enumerate(types)}
    assert order_map["source-page-missing-local"] < order_map["local-page-orphan"]
    assert order_map["local-page-orphan"] < order_map["missing-fresh-snapshot"]


# ---------------------------------------------------------------------------
# source-page-missing-local edge cases (mjs gap-fill)
# ---------------------------------------------------------------------------


def test_source_page_missing_local_returns_empty_when_all_covered() -> None:
    assert check_source_page_missing_local(["a", "b"], ["a", "b"]) == []


def test_source_page_missing_local_empty_sidebar() -> None:
    assert check_source_page_missing_local([], ["a", "b"]) == []


def test_source_page_missing_local_ignores_extra_local() -> None:
    """sidebar に無い local は sidebar-missing 対象外 (orphan 側で処理)。"""
    assert check_source_page_missing_local(["a"], ["a", "b", "c"]) == []


def test_source_page_missing_local_detail_mentions_slug() -> None:
    issues = check_source_page_missing_local(["overview/new-page"], [])
    assert "overview/new-page" in issues[0]["detail"]


# ---------------------------------------------------------------------------
# local-page-orphan edge cases
# ---------------------------------------------------------------------------


def test_local_page_orphan_returns_empty_when_all_in_sidebar() -> None:
    assert check_local_page_orphan(["a", "b"], ["a", "b", "c"]) == []


def test_local_page_orphan_detail_mentions_slug() -> None:
    issues = check_local_page_orphan(["overview/orphan"], ["overview/a"])
    assert len(issues) == 1
    assert "overview/orphan" in issues[0]["detail"]


# ---------------------------------------------------------------------------
# missing-snapshot freshness branching matrix
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("freshness", "expected_type", "expected_severity"),
    [
        ("fresh", "missing-fresh-snapshot", "actionable"),
        ("partial", "missing-snapshot", "signal"),
        ("stale", "missing-snapshot", "signal"),
        ("broken", "missing-snapshot", "signal"),
        (None, "missing-snapshot", "signal"),
    ],
)
def test_missing_snapshot_freshness_branches(
    freshness: str | None, expected_type: str, expected_severity: str
) -> None:
    issues = check_missing_snapshot({"a": "https://x"}, [], freshness)
    assert len(issues) == 1
    assert issues[0]["type"] == expected_type
    assert issues[0]["severity"] == expected_severity


def test_missing_snapshot_all_covered_returns_empty() -> None:
    assert check_missing_snapshot({"a": "https://x"}, ["a"], "fresh") == []


def test_missing_snapshot_empty_map() -> None:
    assert check_missing_snapshot({}, [], "fresh") == []


def test_missing_snapshot_multiple_missing() -> None:
    issues = check_missing_snapshot({"a": "https://x", "b": "https://y"}, [], "fresh")
    assert len(issues) == 2


def test_missing_snapshot_partial_coverage() -> None:
    issues = check_missing_snapshot({"a": "https://x", "b": "https://y"}, ["a"], "fresh")
    assert len(issues) == 1
    assert "b" in issues[0]["detail"]


# ---------------------------------------------------------------------------
# single-page snapshot check — fresh vs non-fresh branching
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("freshness", "expected_type", "expected_severity"),
    [
        ("fresh", "missing-fresh-snapshot", "actionable"),
        ("partial", "missing-snapshot", "signal"),
        ("broken", "missing-snapshot", "signal"),
        (None, "missing-snapshot", "signal"),
    ],
)
def test_single_page_snapshot_freshness_branches(
    freshness: str | None, expected_type: str, expected_severity: str
) -> None:
    issues = check_single_page_snapshot("a", "https://x", [], freshness)
    assert len(issues) == 1
    assert issues[0]["type"] == expected_type
    assert issues[0]["severity"] == expected_severity


# ---------------------------------------------------------------------------
# aggregate check_page_coverage scenarios
# ---------------------------------------------------------------------------


def test_check_page_coverage_all_covered_returns_empty() -> None:
    assert (
        check_page_coverage(
            sidebar_slugs=["a"],
            local_slugs=["a"],
            local_source_urls={"a": "https://x"},
            snapshot_slugs=["a"],
            freshness_state="fresh",
        )
        == []
    )


def test_check_page_coverage_empty_inputs_returns_empty() -> None:
    assert (
        check_page_coverage(
            sidebar_slugs=[],
            local_slugs=[],
            local_source_urls={},
            snapshot_slugs=[],
            freshness_state=None,
        )
        == []
    )


def test_check_page_coverage_non_fresh_downgrades_snapshot_gate() -> None:
    """non-fresh のとき missing-snapshot は signal (advisory)。"""
    issues = check_page_coverage(
        sidebar_slugs=["a"],
        local_slugs=["a"],
        local_source_urls={"a": "https://x"},
        snapshot_slugs=[],
        freshness_state="broken",
    )
    assert len(issues) == 1
    assert issues[0]["type"] == "missing-snapshot"
    assert issues[0]["severity"] == "signal"
