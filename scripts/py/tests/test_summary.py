"""``summary.py`` の unit test (mjs 代表集計 / align runtime 由来)。

conformance test (``test_summary_parity.py``) が mjs との byte 一致を保証するため、
ここでは segment-* issue を summarize_parity_results が正しく primary gate
accounting に寄与させることを Python 側で pin する。
"""

from __future__ import annotations

from typing import Any

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


# ---------------------------------------------------------------------------
# Routing contract (PR #384 review P2-1):
#   structure-mismatch / source-unusable / coarse-audit の counter が相互に
#   漏れないことを pin する。mjs 側 ``source_parity.test.mjs`` の 14+ routing
#   ケースのうち、Python 実装が Phase 6 以降 mjs 無しで stand-alone に運用される
#   際に regression guard として必須な representative ケースを pin する。
# ---------------------------------------------------------------------------


def _result(*issues: dict[str, Any]) -> dict[str, Any]:
    """``issues`` を 1 file の parity result に包む helper。"""
    return {"file": "x.md", "sourceUrl": "", "category": "", "issues": list(issues)}


def test_structure_mismatch_flows_only_into_structure_channel() -> None:
    """``section-structure-mismatch`` は ``structureMismatch*`` にのみ流れ、
    ``auditSignal*`` / ``snapshotUnusable*`` には流れない (3 channel cross-check、
    COARSE_SIGNAL_TYPES / STRUCTURE_MISMATCH_TYPES / SOURCE_UNUSABLE_TYPES が
    disjoint な frozenset である契約の pin)。"""
    issue = {"type": "section-structure-mismatch", "severity": "actionable"}
    summary = summarize_parity_results([_result(issue)])
    # structureMismatch channel のみ populated
    assert summary["structureMismatchIssues"] == 1
    assert summary["structureMismatchByType"] == {"section-structure-mismatch": 1}
    assert summary["structureMismatchFiles"] == 1
    # audit / snapshotUnusable channel は 0 (cross-channel leak guard)
    assert summary["auditSignalIssues"] == 0
    assert summary["auditSignalsByType"] == {}
    assert summary["auditSignalFiles"] == 0
    assert summary["snapshotUnusableIssues"] == 0
    assert summary["snapshotUnusableByType"] == {}
    assert summary["snapshotUnusableFiles"] == 0


def test_source_unusable_flows_only_into_snapshot_channel() -> None:
    """``snapshot-incomplete`` / ``source-unusable`` は ``snapshotUnusable*``
    にのみ流れ、``auditSignal*`` / ``structureMismatch*`` には流れない
    (3 channel cross-check)。"""
    snapshot = {"type": "snapshot-incomplete", "severity": "actionable"}
    unusable = {"type": "source-unusable", "severity": "actionable"}
    summary = summarize_parity_results([_result(snapshot, unusable)])
    # snapshotUnusable channel のみ populated
    assert summary["snapshotUnusableIssues"] == 2
    assert summary["snapshotUnusableByType"] == {
        "snapshot-incomplete": 1,
        "source-unusable": 1,
    }
    assert summary["snapshotUnusableFiles"] == 1
    # audit / structureMismatch channel は 0 (cross-channel leak guard)
    assert summary["auditSignalIssues"] == 0
    assert summary["auditSignalsByType"] == {}
    assert summary["structureMismatchIssues"] == 0
    assert summary["structureMismatchByType"] == {}


def test_valid_ack_excludes_structure_mismatch_from_counter() -> None:
    """``acknowledged=True, ackExpired=False`` の ``section-structure-mismatch``
    は ``structureMismatchIssues`` に加算されない (gate の二重計上防止)。"""
    issue = {
        "type": "section-structure-mismatch",
        "severity": "actionable",
        "acknowledged": True,
        "ackExpired": False,
    }
    summary = summarize_parity_results([_result(issue)])
    assert summary["structureMismatchIssues"] == 0
    assert summary["structureMismatchByType"] == {}
    assert summary["structureMismatchFiles"] == 0
    # ack 済 issue は acknowledgedIssues に 1 計上される
    assert summary["acknowledgedIssues"] == 1


def test_expired_ack_keeps_structure_mismatch_in_counter() -> None:
    """``ackExpired=True`` は valid ack ではないため、``structureMismatchIssues``
    に加算される (ack 期限切れの明示 counter 維持)。"""
    issue = {
        "type": "section-structure-mismatch",
        "severity": "actionable",
        "acknowledged": True,
        "ackExpired": True,
    }
    summary = summarize_parity_results([_result(issue)])
    assert summary["structureMismatchIssues"] == 1
    assert summary["expiredAcknowledgements"] == 1


def test_baselined_excludes_structure_mismatch_from_counter() -> None:
    """``baselined=True`` の ``section-structure-mismatch`` は
    ``structureMismatchIssues`` に加算されない (frozen drift は active 対象外)。"""
    issue = {
        "type": "section-structure-mismatch",
        "severity": "actionable",
        "baselined": True,
    }
    summary = summarize_parity_results([_result(issue)])
    assert summary["structureMismatchIssues"] == 0
    # baselinedIssues には 1 入る
    assert summary["baselinedIssues"] == 1
    assert summary["baselinedByType"] == {"section-structure-mismatch": 1}


def test_valid_ack_excludes_source_unusable_from_counter() -> None:
    """``acknowledged=True, ackExpired=False`` の ``snapshot-incomplete`` は
    ``snapshotUnusableIssues`` に加算されない。"""
    issue = {
        "type": "snapshot-incomplete",
        "severity": "actionable",
        "acknowledged": True,
        "ackExpired": False,
    }
    summary = summarize_parity_results([_result(issue)])
    assert summary["snapshotUnusableIssues"] == 0
    assert summary["snapshotUnusableByType"] == {}


def test_coarse_signal_flows_only_into_audit_channel() -> None:
    """``paragraph-count-mismatch`` は ``auditSignal*`` にのみ流れる
    (``structureMismatch*`` や ``snapshotUnusable*`` には無関係)。3 channel
    cross-check で disjoint 契約を pin。"""
    issue = {"type": "paragraph-count-mismatch", "severity": "signal"}
    summary = summarize_parity_results([_result(issue)])
    # audit channel のみ populated
    assert summary["auditSignalIssues"] == 1
    assert summary["auditSignalsByType"] == {"paragraph-count-mismatch": 1}
    assert summary["auditSignalFiles"] == 1
    # structureMismatch / snapshotUnusable channel は 0 (cross-channel leak guard)
    assert summary["structureMismatchIssues"] == 0
    assert summary["structureMismatchByType"] == {}
    assert summary["structureMismatchFiles"] == 0
    assert summary["snapshotUnusableIssues"] == 0
    assert summary["snapshotUnusableByType"] == {}
    assert summary["snapshotUnusableFiles"] == 0
