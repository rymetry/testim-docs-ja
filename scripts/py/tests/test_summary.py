"""``summary.py`` の unit test (mjs 代表集計 / align runtime 由来)。

conformance test (``test_summary_parity.py``) が mjs との byte 一致を保証するため、
ここでは segment-* issue を summarize_parity_results が正しく primary gate
accounting に寄与させることを Python 側で pin する。
"""

from __future__ import annotations

from testim_parity.summary import summarize_parity_results


def test_summary_counts_unbaselined_segment_star_as_primary_gate() -> None:
    """un-baselined segment-* issues は primary gate accounting に流れる。"""
    results = [
        {
            "file": "a.md",
            "sourceUrl": "",
            "category": "",
            "issues": [
                {"type": "segment-missing", "severity": "actionable", "detail": "x"},
                {"type": "segment-extra", "severity": "actionable", "detail": "y"},
                {"type": "segment-inconclusive", "severity": "actionable", "detail": "z"},
                {"type": "paragraph-count-mismatch", "severity": "signal", "detail": "count"},
            ],
        },
        {
            "file": "b.md",
            "sourceUrl": "",
            "category": "",
            "issues": [
                {"type": "segment-token-gap", "severity": "actionable", "detail": "w"},
            ],
        },
    ]
    summary = summarize_parity_results(results)
    # segment-* は primary totals に含まれる
    assert summary["totalIssues"] == 5
    assert summary["issuesByType"]["segment-missing"] == 1
    assert summary["issuesByType"]["segment-extra"] == 1
    assert summary["issuesByType"]["segment-inconclusive"] == 1
    assert summary["issuesByType"]["segment-token-gap"] == 1
    assert summary["issuesByType"]["paragraph-count-mismatch"] == 1
    # 両 file とも actionable segment issue を持つので actionableFiles=2
    assert summary["actionableFiles"] == 2
    # baseline 無しなので active も 2
    assert summary["activeActionableFiles"] == 2


def test_summary_excludes_baselined_segment_star_from_active_counts() -> None:
    results = [
        {
            "file": "a.md",
            "sourceUrl": "",
            "category": "",
            "issues": [
                {
                    "type": "segment-missing",
                    "severity": "actionable",
                    "baselined": True,
                    "detail": "x",
                },
                {
                    "type": "segment-inconclusive",
                    "severity": "actionable",
                    "baselined": True,
                    "inconclusiveCategory": "heading-count-mismatch",
                    "detail": "z",
                },
            ],
        },
    ]
    summary = summarize_parity_results(results)
    assert summary["actionableFiles"] == 1
    # baselined issue は active に数えない
    assert summary["activeActionableFiles"] == 0
    assert summary["activeFiles"] == 0
    assert summary["baselinedIssues"] == 2
    assert summary["baselinedFiles"] == 1


def test_summary_empty_results_returns_zero_counters() -> None:
    summary = summarize_parity_results([])
    assert summary["filesWithIssues"] == 0
    assert summary["totalIssues"] == 0
    assert summary["actionableFiles"] == 0
    assert summary["activeActionableFiles"] == 0
    assert summary["baselinedIssues"] == 0
    assert summary["issuesByType"] == {}


def test_summary_orphan_metadata_forwarded() -> None:
    orphan_meta = {
        "orphanBaselineEntries": 3,
        "orphanBaselineByType": {"segment-missing": 2, "segment-extra": 1},
    }
    summary = summarize_parity_results([], orphan_meta=orphan_meta)
    assert summary["orphanBaselineEntries"] == 3
    assert summary["orphanBaselineByType"] == {"segment-missing": 2, "segment-extra": 1}


def test_summary_orphan_metadata_defaults_to_zero() -> None:
    summary = summarize_parity_results([])
    assert summary["orphanBaselineEntries"] == 0
    assert summary["orphanBaselineByType"] == {}
