"""detection_reports.py の unit test。

conformance test (test_detection_reports_parity.py) が mjs との byte 一致を
担当するので、ここでは Python 側の挙動契約 (4 issue family / schema validator /
upstream-recovery sticky comment / summary markdown) の動作を確認する。

test scope:
- classify_snapshot_bucket / assign_review_groups / build_audit_manifest
- build_actionable_report (4 families: snapshotDiff / parityRegression /
  sourceSyncHealth / parityFollowup)
- render_summary_markdown / render_upstream_recovery_sticky_comment
- schema validators: validate_snapshot_diff_status /
  validate_parity_check_status / validate_source_sync_status /
  validate_actionable_report / validate_detection_inputs
- load_detection_inputs
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import pytest

from testim_parity.detection_reports import (
    ACTIONABLE_REPORT_SCHEMA_VERSION,
    FAMILY_KEYS,
    UPSTREAM_RECOVERY_STICKY_MARKER,
    assign_review_groups,
    build_actionable_report,
    build_audit_manifest,
    classify_snapshot_bucket,
    load_detection_inputs,
    render_summary_markdown,
    render_upstream_recovery_sticky_comment,
    validate_actionable_report,
    validate_detection_inputs,
    validate_parity_check_status,
    validate_snapshot_diff_status,
    validate_source_sync_status,
)

# ---------------------------------------------------------------------------
# Shared fixtures / helpers
# ---------------------------------------------------------------------------


# ``_empty_snapshot()`` / ``_empty_parity()`` は factory function として提供する
# (PR #384 review P2-4)。以前は module-level dict 定数で、``{**_empty_snapshot(),
# ...}`` の shallow copy パターンで参照されていたが、nested dict (``summary`` や
# ``sidebar``) は spread でも shared reference になるため、将来
# ``build_actionable_report`` が in-place 変更するケースで test 間汚染を招く
# 潜在リスクがあった。factory が毎回 fresh dict を返す契約に変更。
def _empty_snapshot() -> dict[str, Any]:
    return {
        "checkedAt": "2026-04-07T00:00:00Z",
        "summary": {
            "totalSnapshots": 100,
            "changed": 0,
            "added": 0,
            "removed": 0,
            "unchanged": 100,
        },
        "changes": [],
        "sidebar": {"changed": False, "addedPages": [], "removedPages": []},
    }


def _empty_parity() -> dict[str, Any]:
    return {
        "summary": {
            "checkedAt": "2026-04-07T00:00:00Z",
            "actionableFiles": 0,
            "signalFiles": 0,
            "errorFiles": 0,
        },
        "files": [],
    }


def _no_categories_change(slug: str, type_: str = "page-changed", **extras: Any) -> dict[str, Any]:
    base = {
        "slug": slug,
        "type": type_,
        "sourceUrl": f"https://docs.tricentis.com/testim/content/{slug}.htm",
        "categories": None,
        "diffLines": 0,
    }
    base.update(extras)
    return base


def _categorized_change(
    slug: str,
    *,
    heading: tuple[int, int] = (0, 0),
    image: tuple[int, int] = (0, 0),
    code: tuple[int, int] = (0, 0),
    callout: tuple[int, int] = (0, 0),
    content: tuple[int, int] = (0, 0),
    diff_lines: int = 1,
) -> dict[str, Any]:
    return {
        "slug": slug,
        "type": "page-changed",
        "sourceUrl": f"https://docs.tricentis.com/testim/content/{slug}.htm",
        "categories": {
            "heading": {"added": heading[0], "removed": heading[1]},
            "image": {"added": image[0], "removed": image[1]},
            "code": {"added": code[0], "removed": code[1]},
            "callout": {"added": callout[0], "removed": callout[1]},
            "content": {"added": content[0], "removed": content[1]},
        },
        "diffLines": diff_lines,
    }


# ---------------------------------------------------------------------------
# classify_snapshot_bucket
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("type_", "expected"),
    [
        ("page-added", "page-lifecycle"),
        ("page-removed", "page-lifecycle"),
    ],
)
def test_classify_snapshot_bucket_page_lifecycle(type_: str, expected: str) -> None:
    assert classify_snapshot_bucket({"type": type_, "categories": None}) == expected


@pytest.mark.parametrize(
    "kwargs",
    [
        {"heading": (1, 0), "content": (3, 2)},
        {"image": (0, 1)},
        {"code": (2, 0), "content": (1, 0)},
        {"callout": (0, 1)},
    ],
)
def test_classify_snapshot_bucket_structural_change(kwargs: dict[str, Any]) -> None:
    change = _categorized_change("a", **kwargs)
    assert classify_snapshot_bucket(change) == "structural-change"


def test_classify_snapshot_bucket_content_only() -> None:
    change = _categorized_change("a", content=(5, 3))
    assert classify_snapshot_bucket(change) == "content-only"


# ---------------------------------------------------------------------------
# assign_review_groups
# ---------------------------------------------------------------------------


def test_assign_review_groups_round_robin() -> None:
    entries = [
        {"slug": "a", "bucket": "content-only"},
        {"slug": "b", "bucket": "content-only"},
        {"slug": "c", "bucket": "content-only"},
    ]
    result = assign_review_groups(entries, 2)
    groups = {e["reviewGroup"] for e in result}
    assert len(groups) == 2
    assert all(e["reviewGroup"].startswith("review-group-") for e in result)


def test_assign_review_groups_bucket_priority_sort() -> None:
    entries = [
        {"slug": "text", "bucket": "content-only"},
        {"slug": "new", "bucket": "page-lifecycle"},
        {"slug": "heading", "bucket": "structural-change"},
    ]
    result = assign_review_groups(entries, 3)
    assert result[0]["slug"] == "new"
    assert result[1]["slug"] == "heading"
    assert result[2]["slug"] == "text"


def test_assign_review_groups_empty_input() -> None:
    assert assign_review_groups([], 3) == []


def test_assign_review_groups_alphabetical_within_bucket() -> None:
    entries = [
        {"slug": "zebra", "bucket": "content-only"},
        {"slug": "alpha", "bucket": "content-only"},
        {"slug": "middle", "bucket": "content-only"},
    ]
    result = assign_review_groups(entries, 6)
    assert [e["slug"] for e in result] == ["alpha", "middle", "zebra"]


# ---------------------------------------------------------------------------
# build_audit_manifest
# ---------------------------------------------------------------------------


def test_build_audit_manifest_empty() -> None:
    manifest = build_audit_manifest({"changes": []}, {"files": []})
    assert manifest == []


def test_build_audit_manifest_parity_with_no_matching_slug() -> None:
    snapshot = {
        "changes": [_categorized_change("overview/page-a", content=(1, 0), diff_lines=1)],
    }
    parity = {
        "files": [
            {
                "file": "src/content/docs/overview/unrelated.md",
                "issues": [{"type": "untranslated", "severity": "actionable", "detail": "text"}],
            }
        ],
    }
    manifest = build_audit_manifest(snapshot, parity)
    assert len(manifest) == 1
    assert manifest[0]["signals"] == []


def test_build_audit_manifest_buckets_each_entry() -> None:
    snapshot = {
        "changes": [
            _no_categories_change("overview/new-page", type_="page-added"),
            _categorized_change(
                "overview/changed-heading", heading=(1, 0), content=(2, 1), diff_lines=4
            ),
            _categorized_change("overview/text-tweak", content=(1, 1), diff_lines=2),
        ]
    }
    parity = {
        "files": [
            {
                "file": "src/content/docs/overview/changed-heading.md",
                "issues": [
                    {"type": "image-mismatch", "severity": "actionable", "detail": "EN=4 JA=1"}
                ],
            }
        ],
    }
    manifest = build_audit_manifest(snapshot, parity, group_count=2)
    by_slug = {e["slug"]: e for e in manifest}
    assert by_slug["overview/new-page"]["bucket"] == "page-lifecycle"
    assert by_slug["overview/changed-heading"]["bucket"] == "structural-change"
    assert by_slug["overview/text-tweak"]["bucket"] == "content-only"
    assert by_slug["overview/new-page"]["reviewGroup"].startswith("review-group-")
    assert by_slug["overview/new-page"]["verificationStatus"] == "needs-human-review"
    assert len(by_slug["overview/changed-heading"]["signals"]) == 1
    assert by_slug["overview/changed-heading"]["signals"][0]["type"] == "image-mismatch"
    assert by_slug["overview/text-tweak"]["signals"] == []


# ---------------------------------------------------------------------------
# build_actionable_report - snapshotDiff / parityRegression
# ---------------------------------------------------------------------------


def test_coarse_signal_only_does_not_open_parity_issue() -> None:
    parity = {
        "summary": {
            "checkedAt": "2026-03-19T00:00:00Z",
            "actionableFiles": 0,
            "signalFiles": 1,
            "errorFiles": 0,
            "issuesByType": {"heading-mismatch": 1},
            "issuesBySeverity": {"signal": 1},
        },
        "files": [
            {
                "file": "src/content/docs/example.md",
                "issues": [
                    {"type": "heading-mismatch", "severity": "signal", "detail": "h2: EN=10 JA=2"}
                ],
            }
        ],
    }
    report = build_actionable_report(_empty_snapshot(), parity, [])
    assert report["parityRegression"]["shouldOpenIssue"] is False
    assert report["parityRegression"]["summary"]["issueCount"] == 0
    assert report["parityRegression"]["topEntries"] == []


def test_snapshot_diff_opens_when_changes_exist() -> None:
    snapshot = {
        "checkedAt": "2026-03-19T00:00:00Z",
        "summary": {
            "totalSnapshots": 100,
            "changed": 2,
            "added": 1,
            "removed": 0,
            "unchanged": 97,
        },
        "changes": [
            _categorized_change("page-a", image=(1, 0), content=(3, 1), diff_lines=5),
            _categorized_change("page-b", content=(1, 1), diff_lines=2),
            _no_categories_change("new-page", type_="page-added"),
        ],
        "sidebar": {"changed": False, "addedPages": [], "removedPages": []},
    }
    parity = {
        "summary": {
            "checkedAt": "2026-03-19T00:00:00Z",
            "actionableFiles": 1,
            "signalFiles": 0,
            "errorFiles": 0,
            "issuesByType": {"image-mismatch": 1},
            "issuesBySeverity": {"actionable": 1},
        },
        "files": [
            {
                "file": "src/content/docs/example.md",
                "issues": [
                    {"type": "image-mismatch", "severity": "actionable", "detail": "EN=8 JA=2"}
                ],
            }
        ],
    }
    report = build_actionable_report(snapshot, parity, [])
    assert report["snapshotDiff"]["shouldOpenIssue"] is True
    assert report["snapshotDiff"]["summary"]["actionableCount"] == 3
    assert report["snapshotDiff"]["summary"]["changed"] == 2
    assert report["snapshotDiff"]["summary"]["added"] == 1
    assert report["parityRegression"]["shouldOpenIssue"] is True
    assert "page-a" in report["snapshotDiff"]["body"]
    assert "image-mismatch" in report["parityRegression"]["body"]


def test_snapshot_diff_stays_closed_when_no_changes() -> None:
    report = build_actionable_report(_empty_snapshot(), _empty_parity(), [])
    assert report["snapshotDiff"]["shouldOpenIssue"] is False
    assert report["snapshotDiff"]["summary"]["actionableCount"] == 0


def test_snapshot_diff_body_includes_sidebar_changes() -> None:
    snapshot = {
        **_empty_snapshot(),
        "sidebar": {"changed": True, "addedPages": ["new-feature"], "removedPages": []},
    }
    report = build_actionable_report(snapshot, _empty_parity(), [])
    assert "サイドバー変更" in report["snapshotDiff"]["body"]
    assert "追加ページ: 1" in report["snapshotDiff"]["body"]


def test_validly_acknowledged_issue_does_not_open_parity() -> None:
    parity = {
        "summary": {
            "checkedAt": "2026-03-19T00:00:00Z",
            "actionableFiles": 0,
            "signalFiles": 1,
            "errorFiles": 0,
            "activeActionableFiles": 0,
            "activeFiles": 0,
            "activeErrorFiles": 0,
            "acknowledgedIssues": 1,
            "issuesByType": {"paragraph-count-mismatch": 1},
            "issuesBySeverity": {"signal": 1},
        },
        "files": [
            {
                "file": "src/content/docs/example.md",
                "issues": [
                    {
                        "type": "paragraph-count-mismatch",
                        "severity": "signal",
                        "detail": "ack",
                        "acknowledged": True,
                        "ackExpired": False,
                        "ackReason": "Intentional JA diff",
                        "ackOwner": "rymetry",
                        "ackReviewAfter": "2026-07-06",
                    }
                ],
            }
        ],
    }
    report = build_actionable_report(_empty_snapshot(), parity, [])
    assert report["parityRegression"]["shouldOpenIssue"] is False
    assert report["parityRegression"]["summary"]["issueCount"] == 0
    # Legacy count fields must not leak into summary.
    assert "signalFiles" not in report["parityRegression"]["summary"]
    assert "errorFiles" not in report["parityRegression"]["summary"]


def test_expired_ack_on_non_coarse_opens_parity() -> None:
    parity = {
        "summary": {
            "checkedAt": "2026-03-19T00:00:00Z",
            "actionableFiles": 1,
            "activeActionableFiles": 1,
            "activeFiles": 1,
            "expiredAcknowledgements": 1,
            "issuesByType": {"image-mismatch": 1},
            "issuesBySeverity": {"actionable": 1},
        },
        "files": [
            {
                "file": "src/content/docs/example.md",
                "issues": [
                    {
                        "type": "image-mismatch",
                        "severity": "actionable",
                        "detail": "expired case",
                        "acknowledged": True,
                        "ackExpired": True,
                        "ackExpiryReason": "fingerprint-changed",
                    }
                ],
            }
        ],
    }
    report = build_actionable_report(_empty_snapshot(), parity, [])
    assert report["parityRegression"]["shouldOpenIssue"] is True
    assert report["parityRegression"]["summary"]["issueCount"] == 1


def test_expired_ack_on_coarse_signal_does_not_relight() -> None:
    parity = {
        "summary": {
            "checkedAt": "2026-03-19T00:00:00Z",
            "actionableFiles": 0,
            "signalFiles": 1,
            "activeFiles": 1,
            "expiredAcknowledgements": 1,
            "issuesByType": {"paragraph-count-mismatch": 1},
            "issuesBySeverity": {"signal": 1},
        },
        "files": [
            {
                "file": "src/content/docs/example.md",
                "issues": [
                    {
                        "type": "paragraph-count-mismatch",
                        "severity": "signal",
                        "detail": "expired coarse",
                        "acknowledged": True,
                        "ackExpired": True,
                        "ackExpiryReason": "fingerprint-changed",
                    }
                ],
            }
        ],
    }
    report = build_actionable_report(_empty_snapshot(), parity, [])
    assert report["parityRegression"]["shouldOpenIssue"] is False
    assert report["parityRegression"]["summary"]["issueCount"] == 0


def test_acked_issues_filtered_from_top_entries_but_active_kept() -> None:
    parity = {
        "summary": {
            "checkedAt": "2026-03-19T00:00:00Z",
            "actionableFiles": 1,
            "activeActionableFiles": 1,
            "activeFiles": 1,
            "acknowledgedIssues": 1,
            "issuesByType": {"image-mismatch": 1, "paragraph-count-mismatch": 1},
            "issuesBySeverity": {"actionable": 1, "signal": 1},
        },
        "files": [
            {
                "file": "src/content/docs/example.md",
                "issues": [
                    {"type": "image-mismatch", "severity": "actionable", "detail": "EN=3 JA=1"},
                    {
                        "type": "paragraph-count-mismatch",
                        "severity": "signal",
                        "detail": "acked noise",
                        "acknowledged": True,
                        "ackExpired": False,
                        "ackReason": "noise",
                        "ackOwner": "rymetry",
                        "ackReviewAfter": "2026-07-06",
                    },
                ],
            }
        ],
    }
    report = build_actionable_report(_empty_snapshot(), parity, [])
    assert report["parityRegression"]["shouldOpenIssue"] is True
    assert report["parityRegression"]["summary"]["issueCount"] == 1
    assert "image-mismatch" in report["parityRegression"]["body"]
    assert "acked noise" not in report["parityRegression"]["body"]


# ---------------------------------------------------------------------------
# render_summary_markdown
# ---------------------------------------------------------------------------


def test_render_summary_markdown_basic_sections() -> None:
    parity = {
        "summary": {
            "actionableFiles": 2,
            "signalFiles": 1,
            "errorFiles": 0,
            "activeActionableFiles": 2,
            "activeErrorFiles": 0,
            "activeFiles": 3,
            "acknowledgedIssues": 0,
        }
    }
    actionable = {
        "generatedAt": "2026-03-19T00:00:00Z",
        "snapshotDiff": {
            "summary": {
                "changed": 3,
                "added": 1,
                "removed": 0,
                "unchanged": 96,
                "totalSnapshots": 100,
            }
        },
        "parityRegression": {"summary": {"actionableCount": 2}},
        "auditManifest": {
            "total": 4,
            "bucketCounts": {
                "page-lifecycle": 1,
                "structural-change": 1,
                "content-only": 2,
            },
        },
    }
    md = render_summary_markdown({}, parity, actionable, [{}, {}, {}, {}], None)
    assert re.search(r"# ドキュメント検知サマリー", md)
    assert re.search(r"## スナップショット差分", md)
    assert re.search(r"変更ページ: 3", md)
    assert re.search(r"追加ページ: 1", md)
    assert re.search(r"## パリティ", md)
    assert re.search(r"要対応ファイル: 2", md)
    assert re.search(r"## 監査マニフェスト", md)
    assert re.search(r"ページライフサイクル: 1", md)
    assert re.search(r"構造変更: 1", md)
    assert re.search(r"本文のみ: 2", md)
    assert re.search(r"snapshot-diff-status\.json", md)


def test_render_summary_markdown_all_acked() -> None:
    parity = {
        "summary": {
            "actionableFiles": 0,
            "signalFiles": 22,
            "errorFiles": 0,
            "activeActionableFiles": 0,
            "activeErrorFiles": 0,
            "activeFiles": 0,
            "acknowledgedIssues": 41,
            "expiredAcknowledgements": 0,
        }
    }
    actionable = {
        "generatedAt": "2026-04-06T00:00:00Z",
        "snapshotDiff": {
            "summary": {
                "changed": 0,
                "added": 0,
                "removed": 0,
                "unchanged": 100,
                "totalSnapshots": 100,
            }
        },
        "parityRegression": {"summary": {"issueCount": 0}},
        "auditManifest": {"total": 0, "bucketCounts": {}},
    }
    md = render_summary_markdown({}, parity, actionable, [], None)
    assert re.search(r"要対応ファイル: 0", md)
    assert re.search(r"問題ファイル: 0", md)
    assert re.search(r"承認済み \(非ブロッキング\): 41", md)


def test_render_summary_markdown_surfaces_expired_ack_warning() -> None:
    parity = {
        "summary": {
            "actionableFiles": 0,
            "signalFiles": 1,
            "errorFiles": 0,
            "activeActionableFiles": 0,
            "activeErrorFiles": 0,
            "activeFiles": 1,
            "acknowledgedIssues": 0,
            "expiredAcknowledgements": 1,
        }
    }
    actionable = {
        "generatedAt": "2026-04-06T00:00:00Z",
        "snapshotDiff": {
            "summary": {
                "changed": 0,
                "added": 0,
                "removed": 0,
                "unchanged": 100,
                "totalSnapshots": 100,
            }
        },
        "parityRegression": {"summary": {"issueCount": 1}},
        "auditManifest": {"total": 0, "bucketCounts": {}},
    }
    md = render_summary_markdown({}, parity, actionable, [], None)
    assert re.search(r"期限切れ承認: 1", md)


def test_render_summary_markdown_partial_advisory_queue_scope() -> None:
    parity = {
        "summary": {
            "actionableFiles": 0,
            "signalFiles": 0,
            "errorFiles": 0,
            "activeActionableFiles": 0,
            "activeErrorFiles": 0,
            "activeFiles": 0,
            "acknowledgedIssues": 0,
        }
    }
    actionable = {
        "generatedAt": "2026-04-07T00:00:00Z",
        "snapshotDiff": {
            "summary": {
                "changed": 0,
                "added": 0,
                "removed": 0,
                "unchanged": 100,
                "totalSnapshots": 100,
            }
        },
        "parityRegression": {"summary": {"issueCount": 0}},
        "parityFollowup": {
            "summary": {
                "baselineDebt": {
                    "baselinedIssues": 1,
                    "baselinedFiles": 1,
                    "baselineInvalidatedSlugs": ["overview/page-a"],
                },
                "advisoryQueue": {
                    "issues": 2,
                    "files": 1,
                    "blockingItems": 1,
                    "advisoryQueueScope": {
                        "type": "slug",
                        "isComplete": False,
                        "filters": {"slug": "overview/page-a"},
                    },
                },
            }
        },
        "auditManifest": {"total": 0, "bucketCounts": {}},
    }
    md = render_summary_markdown({}, parity, actionable, [], None)
    assert re.search(r"部分スコープ: slug=overview/page-a", md)


# ---------------------------------------------------------------------------
# load_detection_inputs
# ---------------------------------------------------------------------------


def test_load_detection_inputs_returns_empty_for_missing_files(tmp_path: Path) -> None:
    result = load_detection_inputs(
        snapshot_path=tmp_path / "snapshot.json",
        parity_path=tmp_path / "parity.json",
        source_sync_path=tmp_path / "sync.json",
        upstream_recovery_path=tmp_path / "recovery.json",
    )
    assert result["snapshot"] == {}
    assert result["parity"] == {}
    assert result["sourceSync"] == {}
    assert result["upstreamRecovery"] == {}


def test_load_detection_inputs_reads_upstream_recovery(tmp_path: Path) -> None:
    payload = {
        "schemaVersion": 1,
        "generatedAt": "2026-04-20T00:00:00Z",
        "summary": {
            "totalEntries": 0,
            "activeEntries": 0,
            "staleEntries": 0,
            "overdueEntries": 0,
            "unknownEntries": 0,
        },
        "mechanisms": {"en_source_patches": [], "source_sync_exclusions": []},
    }
    recovery_path = tmp_path / "recovery.json"
    recovery_path.write_text(json.dumps(payload), encoding="utf-8")
    result = load_detection_inputs(
        snapshot_path=tmp_path / "missing-snapshot.json",
        parity_path=tmp_path / "missing-parity.json",
        source_sync_path=tmp_path / "missing-sync.json",
        upstream_recovery_path=recovery_path,
    )
    assert result["upstreamRecovery"] == payload


# ---------------------------------------------------------------------------
# sourceSyncHealth - upstream recovery integration (Phase B)
# ---------------------------------------------------------------------------


FRESH_SYNC: dict[str, Any] = {
    "schemaVersion": 1,
    "freshnessState": "fresh",
    "summary": {
        "targetPages": 100,
        "fetchedPages": 100,
        "notFoundPages": 0,
        "errorPages": 0,
        "sidebarVerified": True,
    },
    "errors": [],
}


def test_en_patch_recovery_null_when_upstream_recovery_absent() -> None:
    report = build_actionable_report(
        _empty_snapshot(), _empty_parity(), [], {"sourceSync": FRESH_SYNC}
    )
    assert report["sourceSyncHealth"]["enPatchRecovery"] is None
    assert report["sourceSyncHealth"]["sourceSyncRecovery"] is None
    assert report["sourceSyncHealth"]["shouldOpenIssue"] is False


def test_empty_upstream_recovery_does_not_open_issue() -> None:
    upstream_recovery = {
        "schemaVersion": 1,
        "generatedAt": "2026-04-20T00:00:00Z",
        "summary": {
            "totalEntries": 0,
            "activeEntries": 0,
            "staleEntries": 0,
            "overdueEntries": 0,
            "unknownEntries": 0,
        },
        "mechanisms": {"en_source_patches": [], "source_sync_exclusions": []},
    }
    report = build_actionable_report(
        _empty_snapshot(),
        _empty_parity(),
        [],
        {"sourceSync": FRESH_SYNC, "upstreamRecovery": upstream_recovery},
    )
    assert report["sourceSyncHealth"]["enPatchRecovery"]["totalPatches"] == 0
    assert report["sourceSyncHealth"]["sourceSyncRecovery"]["totalExclusions"] == 0
    assert report["sourceSyncHealth"]["shouldOpenIssue"] is False


def test_stale_en_patch_opens_source_sync_health() -> None:
    upstream_recovery = {
        "schemaVersion": 1,
        "generatedAt": "2026-04-20T00:00:00Z",
        "summary": {
            "totalEntries": 1,
            "activeEntries": 0,
            "staleEntries": 1,
            "overdueEntries": 0,
            "unknownEntries": 0,
        },
        "mechanisms": {
            "en_source_patches": [
                {
                    "id": "UD-STALE",
                    "mechanism": "en_source_patches",
                    "slugs": ["some/slug"],
                    "statusA": "stale",
                    "statusB": "current",
                    "hits": 0,
                    "addedAt": "2026-01-01",
                    "reviewAfter": "2026-07-01",
                    "daysUntilReview": 72,
                }
            ],
            "source_sync_exclusions": [],
        },
    }
    report = build_actionable_report(
        _empty_snapshot(),
        _empty_parity(),
        [],
        {"sourceSync": FRESH_SYNC, "upstreamRecovery": upstream_recovery},
    )
    assert report["sourceSyncHealth"]["shouldOpenIssue"] is True
    assert report["sourceSyncHealth"]["enPatchRecovery"]["stalePatches"] == 1
    assert [e["id"] for e in report["sourceSyncHealth"]["enPatchRecovery"]["stale"]] == ["UD-STALE"]
    assert "UD-STALE" in report["sourceSyncHealth"]["body"]
    assert "upstream recovery" in report["sourceSyncHealth"]["body"]


def test_overdue_exclusion_opens_source_sync_health() -> None:
    upstream_recovery = {
        "schemaVersion": 1,
        "generatedAt": "2026-04-20T00:00:00Z",
        "summary": {
            "totalEntries": 1,
            "activeEntries": 1,
            "staleEntries": 0,
            "overdueEntries": 1,
            "unknownEntries": 0,
        },
        "mechanisms": {
            "en_source_patches": [],
            "source_sync_exclusions": [
                {
                    "slug": "overdue/slug",
                    "mechanism": "source_sync_exclusions",
                    "statusA": "active",
                    "statusB": "overdue",
                    "fetchStatus": "excluded-broken",
                    "addedAt": "2025-01-01",
                    "reviewAfter": "2025-07-01",
                    "daysUntilReview": -300,
                }
            ],
        },
    }
    report = build_actionable_report(
        _empty_snapshot(),
        _empty_parity(),
        [],
        {"sourceSync": FRESH_SYNC, "upstreamRecovery": upstream_recovery},
    )
    assert report["sourceSyncHealth"]["shouldOpenIssue"] is True
    assert report["sourceSyncHealth"]["sourceSyncRecovery"]["overdueExclusions"] == 1
    assert "overdue/slug" in report["sourceSyncHealth"]["body"]


def test_unknown_only_upstream_entries_does_not_open() -> None:
    upstream_recovery = {
        "schemaVersion": 1,
        "generatedAt": "2026-04-20T00:00:00Z",
        "summary": {
            "totalEntries": 1,
            "activeEntries": 0,
            "staleEntries": 0,
            "overdueEntries": 0,
            "unknownEntries": 1,
        },
        "mechanisms": {
            "en_source_patches": [
                {
                    "id": "UD-UNK",
                    "mechanism": "en_source_patches",
                    "slugs": ["some/slug"],
                    "statusA": "unknown",
                    "statusB": "current",
                    "hits": 0,
                    "addedAt": "2026-01-01",
                    "reviewAfter": "2026-07-01",
                    "daysUntilReview": 72,
                }
            ],
            "source_sync_exclusions": [],
        },
    }
    report = build_actionable_report(
        _empty_snapshot(),
        _empty_parity(),
        [],
        {"sourceSync": FRESH_SYNC, "upstreamRecovery": upstream_recovery},
    )
    assert report["sourceSyncHealth"]["shouldOpenIssue"] is False
    assert report["sourceSyncHealth"]["enPatchRecovery"]["unknownPatches"] == 1
    assert report["sourceSyncHealth"]["enPatchRecovery"]["stalePatches"] == 0


# ---------------------------------------------------------------------------
# render_upstream_recovery_sticky_comment
# ---------------------------------------------------------------------------


def test_sticky_comment_returns_none_when_no_signals() -> None:
    body = render_upstream_recovery_sticky_comment(
        {
            "schemaVersion": 1,
            "summary": {
                "totalEntries": 0,
                "activeEntries": 0,
                "staleEntries": 0,
                "overdueEntries": 0,
                "unknownEntries": 0,
            },
            "mechanisms": {"en_source_patches": [], "source_sync_exclusions": []},
        }
    )
    assert body is None


def test_sticky_comment_emits_marker_and_heading() -> None:
    body = render_upstream_recovery_sticky_comment(
        {
            "schemaVersion": 1,
            "summary": {
                "totalEntries": 1,
                "activeEntries": 0,
                "staleEntries": 1,
                "overdueEntries": 0,
                "unknownEntries": 0,
            },
            "mechanisms": {
                "en_source_patches": [
                    {
                        "id": "UD-STICKY",
                        "mechanism": "en_source_patches",
                        "slugs": ["some/slug"],
                        "statusA": "stale",
                        "statusB": "current",
                        "hits": 0,
                        "addedAt": "2026-01-01",
                        "reviewAfter": "2026-07-01",
                        "daysUntilReview": 72,
                    }
                ],
                "source_sync_exclusions": [],
            },
        }
    )
    assert body is not None
    assert body.startswith(UPSTREAM_RECOVERY_STICKY_MARKER)
    assert re.search(r"## Upstream recovery: 1 entr\(ies\) need attention", body)
    assert "UD-STICKY" in body
    assert "Informational only" in body
    # No emoji per project convention.
    assert "🧹" not in body


def test_sticky_comment_sanitises_injection_chars() -> None:
    body = render_upstream_recovery_sticky_comment(
        {
            "schemaVersion": 1,
            "summary": {
                "totalEntries": 1,
                "activeEntries": 0,
                "staleEntries": 1,
                "overdueEntries": 0,
                "unknownEntries": 0,
            },
            "mechanisms": {
                "en_source_patches": [
                    {
                        "id": "UD-`inj`ect|pipe\nnewline",
                        "mechanism": "en_source_patches",
                        "slugs": ["slug\nbreak"],
                        "statusA": "stale",
                        "statusB": "current",
                        "hits": 0,
                        "addedAt": "2026-01-01",
                        "reviewAfter": "2026-07-01",
                        "daysUntilReview": 72,
                    }
                ],
                "source_sync_exclusions": [],
            },
        }
    )
    assert body is not None
    assert "UD-_inj_ect_pipe_newline" in body
    assert "slug_break" in body
    assert "\\n" not in body


def test_sticky_comment_strips_markdown_link_and_html() -> None:
    body = render_upstream_recovery_sticky_comment(
        {
            "schemaVersion": 1,
            "summary": {
                "totalEntries": 1,
                "activeEntries": 0,
                "staleEntries": 1,
                "overdueEntries": 0,
                "unknownEntries": 0,
            },
            "mechanisms": {
                "en_source_patches": [],
                "source_sync_exclusions": [
                    {
                        "slug": "malicious[link](http://evil.example)<script>",
                        "mechanism": "source_sync_exclusions",
                        "statusA": "stale",
                        "statusB": "current",
                        "fetchStatus": "excluded-recovered",
                        "addedAt": "2026-01-01",
                        "reviewAfter": "2026-07-01",
                        "daysUntilReview": 72,
                    }
                ],
            },
        }
    )
    assert body is not None
    assert "[link]" not in body
    assert "(http://evil" not in body
    assert "<script>" not in body
    assert "malicious_link__http" in body


def test_sticky_comment_tolerates_malformed_rows() -> None:
    """null / undefined / scalar rows should be filtered out defensively."""
    body = render_upstream_recovery_sticky_comment(
        {
            "schemaVersion": 1,
            "summary": {
                "totalEntries": 1,
                "activeEntries": 1,
                "staleEntries": 0,
                "overdueEntries": 0,
                "unknownEntries": 0,
            },
            "mechanisms": {
                "en_source_patches": [
                    None,
                    42,
                    "garbage",
                    [],
                    {
                        "id": "UD-REAL",
                        "mechanism": "en_source_patches",
                        "slugs": ["some/slug"],
                        "statusA": "active",
                        "statusB": "current",
                        "hits": 1,
                        "addedAt": "2026-01-01",
                        "reviewAfter": "2026-07-01",
                        "daysUntilReview": 72,
                    },
                ],
                "source_sync_exclusions": [
                    None,
                    {
                        "slug": "valid/slug",
                        "mechanism": "source_sync_exclusions",
                        "statusA": "active",
                        "statusB": "current",
                        "fetchStatus": "excluded-broken",
                        "addedAt": "2026-01-01",
                        "reviewAfter": "2026-07-01",
                        "daysUntilReview": 72,
                    },
                ],
            },
        }
    )
    # すべてのデータ行が active + current なので signal なし → None
    assert body is None


# ---------------------------------------------------------------------------
# sourceSyncHealth in buildActionableReport - freshness state
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "freshness",
    ["broken", "partial"],
)
def test_non_fresh_freshness_opens_source_sync(freshness: str) -> None:
    source_sync = {
        "schemaVersion": 1,
        "freshnessState": freshness,
        "summary": {
            "targetPages": 100,
            "fetchedPages": 0 if freshness == "broken" else 95,
            "notFoundPages": 0,
            "errorPages": 100 if freshness == "broken" else 3,
            "sidebarVerified": freshness != "broken",
        },
        "errors": [{"slug": "a", "detail": "fail"}],
    }
    report = build_actionable_report(
        _empty_snapshot(), _empty_parity(), [], {"sourceSync": source_sync}
    )
    assert report["sourceSyncHealth"]["shouldOpenIssue"] is True
    assert report["sourceSyncHealth"]["freshnessState"] == freshness


def test_fresh_does_not_open_source_sync() -> None:
    report = build_actionable_report(
        _empty_snapshot(), _empty_parity(), [], {"sourceSync": FRESH_SYNC}
    )
    assert report["sourceSyncHealth"]["shouldOpenIssue"] is False


def test_empty_source_sync_does_not_open() -> None:
    report = build_actionable_report(_empty_snapshot(), _empty_parity(), [], {"sourceSync": {}})
    assert report["sourceSyncHealth"]["shouldOpenIssue"] is False


def test_summary_markdown_includes_source_sync_health() -> None:
    source_sync = {
        "schemaVersion": 1,
        "freshnessState": "broken",
        "summary": {
            "targetPages": 100,
            "fetchedPages": 0,
            "notFoundPages": 0,
            "errorPages": 100,
            "sidebarVerified": False,
        },
        "errors": [],
    }
    report = build_actionable_report(
        _empty_snapshot(), _empty_parity(), [], {"sourceSync": source_sync}
    )
    md = render_summary_markdown(_empty_snapshot(), _empty_parity(), report, [], source_sync)
    assert re.search(r"## ソース同期状態", md)
    assert "broken" in md


# ---------------------------------------------------------------------------
# parityFollowup family
# ---------------------------------------------------------------------------


CLEAN_PARITY: dict[str, Any] = {
    "summary": {
        "checkedAt": "2026-04-07T00:00:00Z",
        "actionableFiles": 0,
        "signalFiles": 0,
        "errorFiles": 0,
        "baselinedIssues": 0,
        "baselinedFiles": 0,
        "baselineInvalidatedSlugs": [],
        "advisoryQueueIssues": 0,
        "advisoryQueueFiles": 0,
    },
    "files": [],
    "advisoryQueueScope": {
        "type": "full",
        "isComplete": True,
        "filters": {},
        "checkedFiles": 100,
        "totalFiles": 100,
    },
    "advisoryQueue": [],
}


def test_parity_followup_always_present() -> None:
    report = build_actionable_report(_empty_snapshot(), CLEAN_PARITY, [])
    followup = report["parityFollowup"]
    assert followup is not None
    assert isinstance(followup["shouldOpenIssue"], bool)
    assert isinstance(followup["body"], str)
    assert "baselineDebt" in followup["summary"]
    assert "advisoryQueue" in followup["summary"]
    assert "reviewHints" in followup["summary"]


def test_parity_followup_closed_when_clean() -> None:
    report = build_actionable_report(_empty_snapshot(), CLEAN_PARITY, [])
    assert report["parityFollowup"]["shouldOpenIssue"] is False
    assert report["parityFollowup"]["body"] == ""


def test_parity_followup_opens_with_baselined_issues() -> None:
    parity = {
        **CLEAN_PARITY,
        "summary": {**CLEAN_PARITY["summary"], "baselinedIssues": 3, "baselinedFiles": 1},
        "files": [
            {
                "file": "src/content/docs/overview/page-a.md",
                "issues": [
                    {
                        "type": "segment-missing",
                        "severity": "actionable",
                        "baselined": True,
                        "detail": "frozen1",
                    },
                    {
                        "type": "segment-extra",
                        "severity": "actionable",
                        "baselined": True,
                        "detail": "frozen2",
                    },
                    {
                        "type": "segment-shifted",
                        "severity": "actionable",
                        "baselined": True,
                        "detail": "frozen3",
                    },
                ],
            }
        ],
    }
    report = build_actionable_report(_empty_snapshot(), parity, [])
    assert report["parityFollowup"]["shouldOpenIssue"] is True
    assert report["parityFollowup"]["summary"]["baselineDebt"]["baselinedIssues"] == 3


def test_parity_followup_opens_with_invalidated_slugs() -> None:
    parity = {
        **CLEAN_PARITY,
        "summary": {**CLEAN_PARITY["summary"], "baselineInvalidatedSlugs": ["overview/page-a"]},
    }
    report = build_actionable_report(_empty_snapshot(), parity, [])
    assert report["parityFollowup"]["shouldOpenIssue"] is True
    assert report["parityFollowup"]["summary"]["baselineDebt"]["baselineInvalidatedSlugs"] == [
        "overview/page-a"
    ]
    assert report["parityFollowup"]["summary"]["baselineDebt"]["baselineInvalidatedSlugCount"] == 1


def test_parity_followup_opens_with_complete_advisory_queue_blocking() -> None:
    parity = {
        **CLEAN_PARITY,
        "summary": {
            **CLEAN_PARITY["summary"],
            "advisoryQueueIssues": 2,
            "advisoryQueueFiles": 1,
        },
        "advisoryQueueScope": {
            "type": "full",
            "isComplete": True,
            "filters": {},
            "checkedFiles": 100,
            "totalFiles": 100,
        },
        "advisoryQueue": [
            {
                "slug": "overview/page-a",
                "blocking": True,
                "issueCount": 2,
                "issues": [{"inconclusiveCategory": "tokenless-near-tie"}],
            }
        ],
    }
    report = build_actionable_report(_empty_snapshot(), parity, [])
    assert report["parityFollowup"]["shouldOpenIssue"] is True
    assert report["parityFollowup"]["summary"]["advisoryQueue"]["blockingItems"] == 1
    assert (
        report["parityFollowup"]["summary"]["reviewHints"]["tokenlessNearTieExamples"][0]["slug"]
        == "overview/page-a"
    )
    assert "スコープ: リポジトリ全体" in report["parityFollowup"]["body"]


def test_parity_followup_partial_scope_does_not_open_on_advisory_alone() -> None:
    parity = {
        **CLEAN_PARITY,
        "summary": {
            **CLEAN_PARITY["summary"],
            "advisoryQueueIssues": 2,
            "advisoryQueueFiles": 1,
        },
        "advisoryQueueScope": {
            "type": "slug",
            "isComplete": False,
            "filters": {"slug": "overview/page-a"},
            "checkedFiles": 1,
            "totalFiles": 100,
        },
        "advisoryQueue": [
            {"slug": "overview/page-a", "blocking": True, "issueCount": 2, "issues": []}
        ],
    }
    report = build_actionable_report(_empty_snapshot(), parity, [])
    assert report["parityFollowup"]["shouldOpenIssue"] is False


def test_parity_followup_invalidated_slugs_in_body() -> None:
    parity = {
        **CLEAN_PARITY,
        "summary": {
            **CLEAN_PARITY["summary"],
            "baselineInvalidatedSlugs": ["overview/page-a", "settings/config"],
        },
    }
    report = build_actionable_report(_empty_snapshot(), parity, [])
    assert report["parityFollowup"]["shouldOpenIssue"] is True
    assert "overview/page-a" in report["parityFollowup"]["body"]
    assert "settings/config" in report["parityFollowup"]["body"]


# ---------------------------------------------------------------------------
# structure mismatch exposure in parityRegression
# ---------------------------------------------------------------------------


def _structure_mismatch_parity() -> dict[str, Any]:
    return {
        "summary": {
            "checkedAt": "2026-04-08T00:00:00Z",
            "actionableFiles": 0,
            "signalFiles": 0,
            "errorFiles": 0,
            "activeActionableFiles": 0,
            "activeFiles": 0,
            "activeErrorFiles": 0,
            "reportableActiveFiles": 0,
            "reportableActiveActionableFiles": 0,
            "structureMismatchIssues": 5,
            "structureMismatchFiles": 3,
            "structureMismatchByType": {
                "section-structure-mismatch": 4,
                "segment-order-mismatch": 1,
            },
        },
        "files": [
            {
                "file": "src/content/docs/running-tests/the-command-line-cli.md",
                "issues": [
                    {
                        "type": "section-structure-mismatch",
                        "severity": "actionable",
                        "detail": "block diff",
                    }
                ],
            }
        ],
    }


def test_structure_mismatch_exposed_in_summary() -> None:
    parity = _structure_mismatch_parity()
    report = build_actionable_report(_empty_snapshot(), parity, [])
    assert report["parityRegression"]["summary"]["structureMismatchIssues"] == 5
    assert report["parityRegression"]["summary"]["structureMismatchFiles"] == 3
    assert report["parityRegression"]["summary"]["structureMismatchByType"] == {
        "section-structure-mismatch": 4,
        "segment-order-mismatch": 1,
    }


def test_structure_mismatch_defaults_when_absent() -> None:
    parity = {"summary": {"checkedAt": "2026-04-08T00:00:00Z"}, "files": []}
    report = build_actionable_report(_empty_snapshot(), parity, [])
    assert report["parityRegression"]["summary"]["structureMismatchIssues"] == 0
    assert report["parityRegression"]["summary"]["structureMismatchFiles"] == 0
    assert report["parityRegression"]["summary"]["structureMismatchByType"] == {}


def test_structure_mismatch_file_in_top_entries() -> None:
    parity = _structure_mismatch_parity()
    report = build_actionable_report(_empty_snapshot(), parity, [])
    assert len(report["parityRegression"]["topEntries"]) == 1
    assert (
        report["parityRegression"]["topEntries"][0]["file"]
        == "src/content/docs/running-tests/the-command-line-cli.md"
    )
    assert report["parityRegression"]["shouldOpenIssue"] is True
    assert report["parityRegression"]["summary"]["issueCount"] == 1


def test_parity_body_omits_structure_mismatch_advisory_section() -> None:
    parity = _structure_mismatch_parity()
    report = build_actionable_report(_empty_snapshot(), parity, [])
    assert "## Structure Mismatch" not in report["parityRegression"]["body"]


# ---------------------------------------------------------------------------
# parityFollowup sourceUnusable subsection
# ---------------------------------------------------------------------------


def test_source_unusable_counters_exposed() -> None:
    parity = {
        **CLEAN_PARITY,
        "summary": {
            **CLEAN_PARITY["summary"],
            "snapshotUnusableIssues": 3,
            "snapshotUnusableFiles": 2,
            "snapshotUnusableByType": {
                "snapshot-incomplete": 2,
                "source-unusable": 1,
            },
        },
    }
    report = build_actionable_report(_empty_snapshot(), parity, [])
    sub = report["parityFollowup"]["summary"]["sourceUnusable"]
    assert sub["snapshotUnusableIssues"] == 3
    assert sub["snapshotUnusableFiles"] == 2
    assert sub["snapshotUnusableByType"] == {
        "snapshot-incomplete": 2,
        "source-unusable": 1,
    }


def test_source_unusable_defaults_when_absent() -> None:
    report = build_actionable_report(_empty_snapshot(), CLEAN_PARITY, [])
    sub = report["parityFollowup"]["summary"]["sourceUnusable"]
    assert sub["snapshotUnusableIssues"] == 0
    assert sub["snapshotUnusableFiles"] == 0
    assert sub["snapshotUnusableByType"] == {}


def test_source_unusable_alone_does_not_open_followup() -> None:
    parity = {
        **CLEAN_PARITY,
        "summary": {
            **CLEAN_PARITY["summary"],
            "snapshotUnusableIssues": 5,
            "snapshotUnusableFiles": 3,
            "snapshotUnusableByType": {"snapshot-incomplete": 4, "source-unusable": 1},
        },
    }
    report = build_actionable_report(_empty_snapshot(), parity, [])
    assert report["parityFollowup"]["shouldOpenIssue"] is False
    assert report["parityFollowup"]["body"] == ""


def test_source_unusable_section_in_body_when_other_signal_opens() -> None:
    parity = {
        **CLEAN_PARITY,
        "summary": {
            **CLEAN_PARITY["summary"],
            "baselinedIssues": 1,
            "baselinedFiles": 1,
            "snapshotUnusableIssues": 4,
            "snapshotUnusableFiles": 2,
            "snapshotUnusableByType": {"snapshot-incomplete": 3, "source-unusable": 1},
        },
        "files": [
            {
                "file": "src/content/docs/overview/page-a.md",
                "issues": [
                    {
                        "type": "segment-missing",
                        "severity": "actionable",
                        "baselined": True,
                        "detail": "frozen",
                    }
                ],
            }
        ],
    }
    report = build_actionable_report(_empty_snapshot(), parity, [])
    body = report["parityFollowup"]["body"]
    assert report["parityFollowup"]["shouldOpenIssue"] is True
    assert re.search(r"## ソース使用不可 \(参考\)", body)
    assert "合計: 4 件" in body
    assert "snapshot-incomplete: 3" in body
    assert "source-unusable: 1" in body


# ---------------------------------------------------------------------------
# parityRegression baseline filter
# ---------------------------------------------------------------------------


def test_all_baselined_does_not_open_parity() -> None:
    parity = {
        "summary": {
            "checkedAt": "2026-04-07T00:00:00Z",
            "actionableFiles": 1,
            "signalFiles": 0,
            "errorFiles": 0,
            "baselinedIssues": 2,
            "baselinedFiles": 1,
            "activeActionableFiles": 0,
            "activeFiles": 0,
            "baselineInvalidatedSlugs": [],
        },
        "files": [
            {
                "file": "src/content/docs/overview/page-a.md",
                "issues": [
                    {
                        "type": "segment-missing",
                        "severity": "actionable",
                        "baselined": True,
                        "detail": "frozen",
                    },
                    {
                        "type": "segment-extra",
                        "severity": "actionable",
                        "baselined": True,
                        "detail": "frozen2",
                    },
                ],
            }
        ],
        "advisoryQueue": [],
        "advisoryQueueScope": None,
    }
    report = build_actionable_report(_empty_snapshot(), parity, [])
    assert report["parityRegression"]["shouldOpenIssue"] is False
    assert report["parityRegression"]["summary"]["issueCount"] == 0
    assert report["parityRegression"]["topEntries"] == []


def test_baselined_never_in_top_entries_but_active_kept() -> None:
    parity = {
        "summary": {
            "checkedAt": "2026-04-07T00:00:00Z",
            "actionableFiles": 1,
            "errorFiles": 0,
            "activeActionableFiles": 1,
            "baselineInvalidatedSlugs": [],
        },
        "files": [
            {
                "file": "src/content/docs/overview/page-a.md",
                "issues": [
                    {
                        "type": "segment-missing",
                        "severity": "actionable",
                        "baselined": True,
                        "detail": "frozen — must not appear",
                    },
                    {
                        "type": "segment-extra",
                        "severity": "actionable",
                        "detail": "active — must appear",
                    },
                ],
            }
        ],
        "advisoryQueue": [],
        "advisoryQueueScope": None,
    }
    report = build_actionable_report(_empty_snapshot(), parity, [])
    assert report["parityRegression"]["shouldOpenIssue"] is True
    assert "frozen — must not appear" not in report["parityRegression"]["body"]
    assert "segment-extra" in report["parityRegression"]["body"]


# ---------------------------------------------------------------------------
# detection-family HTML comment markers
# ---------------------------------------------------------------------------


def test_snapshot_diff_body_has_family_marker() -> None:
    snapshot = {
        **_empty_snapshot(),
        "summary": {"totalSnapshots": 100, "changed": 1, "added": 0, "removed": 0, "unchanged": 99},
        "changes": [_categorized_change("page-a", content=(1, 0), diff_lines=1)],
    }
    parity = {
        "summary": {
            "checkedAt": "2026-04-07T00:00:00Z",
            "actionableFiles": 1,
            "baselinedIssues": 0,
            "baselineInvalidatedSlugs": [],
        },
        "files": [
            {
                "file": "src/content/docs/page-a.md",
                "issues": [
                    {"type": "image-mismatch", "severity": "actionable", "detail": "EN=3 JA=1"}
                ],
            }
        ],
    }
    report = build_actionable_report(snapshot, parity, [])
    assert report["snapshotDiff"]["body"].startswith("<!-- detection-family: snapshot-diff -->")
    assert report["parityRegression"]["body"].startswith(
        "<!-- detection-family: parity-regression -->"
    )


def test_source_sync_marker_when_broken() -> None:
    sync = {
        "freshnessState": "broken",
        "summary": {
            "targetPages": 100,
            "fetchedPages": 0,
            "notFoundPages": 0,
            "errorPages": 100,
            "sidebarVerified": False,
        },
        "errors": [],
    }
    report = build_actionable_report(_empty_snapshot(), _empty_parity(), [], {"sourceSync": sync})
    assert report["sourceSyncHealth"]["body"].startswith(
        "<!-- detection-family: source-sync-health -->"
    )


def test_source_sync_empty_body_when_fresh() -> None:
    report = build_actionable_report(
        _empty_snapshot(), _empty_parity(), [], {"sourceSync": {"freshnessState": "fresh"}}
    )
    assert report["sourceSyncHealth"]["body"] == ""


def test_parity_followup_marker_when_should_open() -> None:
    parity = {
        "summary": {
            "checkedAt": "2026-04-07T00:00:00Z",
            "actionableFiles": 1,
            "baselineInvalidatedSlugs": ["page-a"],
            "baselinedIssues": 0,
        },
        "files": [],
    }
    report = build_actionable_report(_empty_snapshot(), parity, [])
    assert report["parityFollowup"]["body"].startswith("<!-- detection-family: parity-followup -->")


# ---------------------------------------------------------------------------
# family invariants
# ---------------------------------------------------------------------------


def test_actionable_report_exposes_four_families() -> None:
    parity = {
        "summary": {"checkedAt": "2026-04-07T00:00:00Z"},
        "files": [],
        "advisoryQueue": [],
        "advisoryQueueScope": None,
    }
    report = build_actionable_report(_empty_snapshot(), parity, [], {"sourceSync": {}})
    keys = {
        report["snapshotDiff"]["key"],
        report["parityRegression"]["key"],
        report["sourceSyncHealth"]["key"],
        report["parityFollowup"]["key"],
    }
    assert keys == {
        FAMILY_KEYS["SNAPSHOT_DIFF"],
        FAMILY_KEYS["PARITY_REGRESSION"],
        FAMILY_KEYS["SOURCE_SYNC_HEALTH"],
        FAMILY_KEYS["PARITY_FOLLOWUP"],
    }


def test_coarse_only_run_all_four_families_closed() -> None:
    parity = {
        "summary": {"checkedAt": "2026-04-07T00:00:00Z", "signalFiles": 1},
        "files": [
            {
                "file": "src/content/docs/coarse.md",
                "issues": [
                    {
                        "type": "paragraph-count-mismatch",
                        "severity": "signal",
                        "detail": "EN=4 JA=2",
                    }
                ],
            }
        ],
        "advisoryQueue": [],
        "advisoryQueueScope": None,
    }
    report = build_actionable_report(_empty_snapshot(), parity, [], {"sourceSync": {}})
    for family in ("snapshotDiff", "parityRegression", "sourceSyncHealth", "parityFollowup"):
        assert report[family] is not None
        assert report[family]["shouldOpenIssue"] is False


def test_parity_only_coarse_no_audit_manifest_entry() -> None:
    parity = {
        "summary": {"checkedAt": "2026-04-07T00:00:00Z", "signalFiles": 1},
        "files": [
            {
                "file": "src/content/docs/parity-only.md",
                "issues": [
                    {"type": "paragraph-count-mismatch", "severity": "signal", "detail": "noise"},
                    {"type": "heading-mismatch", "severity": "signal", "detail": "noise2"},
                ],
            }
        ],
    }
    assert build_audit_manifest(_empty_snapshot(), parity) == []


def test_run_scope_hoisted_to_report_top_level() -> None:
    parity = {
        "summary": {
            "checkedAt": "2026-04-07T00:00:00Z",
            "runScope": {
                "type": "slug",
                "isComplete": False,
                "filters": {"slug": "overview/page-a", "section": None},
            },
        },
        "files": [],
        "advisoryQueue": [],
        "advisoryQueueScope": None,
    }
    report = build_actionable_report(_empty_snapshot(), parity, [], {"sourceSync": {}})
    assert report["runScope"] == {
        "type": "slug",
        "isComplete": False,
        "filters": {"slug": "overview/page-a", "section": None},
    }


def test_run_scope_null_for_legacy_report() -> None:
    parity = {
        "summary": {"checkedAt": "2026-04-07T00:00:00Z"},
        "files": [],
        "advisoryQueue": [],
        "advisoryQueueScope": None,
    }
    report = build_actionable_report(_empty_snapshot(), parity, [], {"sourceSync": {}})
    assert report["runScope"] is None


# ---------------------------------------------------------------------------
# coarse signal filter
# ---------------------------------------------------------------------------


def test_actionable_opens_for_non_coarse_issue() -> None:
    parity = {
        "summary": {"checkedAt": "2026-04-07T00:00:00Z", "actionableFiles": 1},
        "files": [
            {
                "file": "src/content/docs/example.md",
                "issues": [
                    {"type": "image-mismatch", "severity": "actionable", "detail": "EN=3 JA=1"}
                ],
            }
        ],
        "advisoryQueue": [],
        "advisoryQueueScope": None,
    }
    report = build_actionable_report(_empty_snapshot(), parity, [])
    assert report["parityRegression"]["shouldOpenIssue"] is True
    assert report["parityRegression"]["summary"]["issueCount"] == 1
    assert "image-mismatch" in report["parityRegression"]["body"]


def test_mixed_file_filters_coarse_keeps_actionable() -> None:
    parity = {
        "summary": {"checkedAt": "2026-04-07T00:00:00Z", "actionableFiles": 1},
        "files": [
            {
                "file": "src/content/docs/example.md",
                "issues": [
                    {"type": "image-mismatch", "severity": "actionable", "detail": "real drift"},
                    {
                        "type": "paragraph-count-mismatch",
                        "severity": "signal",
                        "detail": "noisy coarse",
                    },
                    {"type": "heading-mismatch", "severity": "signal", "detail": "noisy coarse 2"},
                ],
            }
        ],
        "advisoryQueue": [],
        "advisoryQueueScope": None,
    }
    report = build_actionable_report(_empty_snapshot(), parity, [])
    body = report["parityRegression"]["body"]
    assert report["parityRegression"]["shouldOpenIssue"] is True
    assert "image-mismatch" in body
    assert "paragraph-count-mismatch" not in body
    assert "heading-mismatch" not in body


def test_top_entries_excludes_coarse_only_files() -> None:
    parity = {
        "summary": {"checkedAt": "2026-04-07T00:00:00Z", "actionableFiles": 1},
        "files": [
            {
                "file": "src/content/docs/coarse-only.md",
                "issues": [
                    {"type": "paragraph-count-mismatch", "severity": "signal", "detail": "noise"}
                ],
            },
            {
                "file": "src/content/docs/real.md",
                "issues": [{"type": "image-mismatch", "severity": "actionable", "detail": "drift"}],
            },
        ],
        "advisoryQueue": [],
        "advisoryQueueScope": None,
    }
    report = build_actionable_report(_empty_snapshot(), parity, [])
    files = [e["file"] for e in report["parityRegression"]["topEntries"]]
    assert files == ["src/content/docs/real.md"]


# ---------------------------------------------------------------------------
# audit signal section in summary markdown
# ---------------------------------------------------------------------------


def test_summary_markdown_audit_signals_section() -> None:
    parity = {
        "summary": {
            "actionableFiles": 0,
            "signalFiles": 1,
            "errorFiles": 0,
            "activeActionableFiles": 0,
            "activeErrorFiles": 0,
            "activeFiles": 1,
            "acknowledgedIssues": 0,
            "reportableActiveFiles": 0,
            "reportableActiveActionableFiles": 0,
            "auditSignalIssues": 3,
            "auditSignalFiles": 1,
            "auditSignalsByType": {
                "paragraph-count-mismatch": 2,
                "heading-mismatch": 1,
            },
        }
    }
    actionable = {
        "generatedAt": "2026-04-07T00:00:00Z",
        "snapshotDiff": {
            "summary": {
                "changed": 0,
                "added": 0,
                "removed": 0,
                "unchanged": 100,
                "totalSnapshots": 100,
            }
        },
        "parityRegression": {"summary": {"issueCount": 0}},
        "parityFollowup": {
            "summary": {
                "baselineDebt": {
                    "baselinedIssues": 0,
                    "baselinedFiles": 0,
                    "baselineInvalidatedSlugs": [],
                },
                "advisoryQueue": {
                    "issues": 0,
                    "files": 0,
                    "blockingItems": 0,
                    "advisoryQueueScope": None,
                },
            }
        },
        "auditManifest": {"total": 0, "bucketCounts": {}},
    }
    md = render_summary_markdown({}, parity, actionable, [], None)
    assert re.search(r"## パリティ", md)
    assert re.search(r"要対応ファイル: 0", md)
    assert re.search(r"## 監査シグナル", md)
    assert "paragraph-count-mismatch: 2" in md
    assert "heading-mismatch: 1" in md
    # Parity section should NOT contain the coarse type names (isolate the section).
    parity_section = re.search(r"## パリティ\n([\s\S]*?)(?:\n## |$)", md)
    assert parity_section is not None
    assert "paragraph-count-mismatch" not in parity_section.group(1)


# ---------------------------------------------------------------------------
# schema validators
# ---------------------------------------------------------------------------


FP = "sha256:" + "0" * 64


def valid_snapshot() -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "runId": "2026-04-07T00:00:00Z#snapshot-diff-deadbeef",
        "sourceSyncRunId": "2026-04-07T00:00:00Z#sync-deadbeef",
        "sourceInventoryFingerprint": None,
        "runScope": {
            "type": "full",
            "isComplete": True,
            "filters": {"slug": None, "section": None},
        },
        "checkedAt": "2026-04-07T00:00:00Z",
        "summary": {
            "totalSnapshots": 100,
            "changed": 0,
            "added": 0,
            "removed": 0,
            "unchanged": 100,
        },
        "changes": [],
        "sidebar": {"changed": False, "addedPages": [], "removedPages": []},
    }


def valid_parity_status() -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "summary": {
            "checkedAt": "2026-04-07T00:00:00Z",
            "runScope": {
                "type": "full",
                "isComplete": True,
                "filters": {"slug": None, "section": None},
            },
            "result": "pass",
        },
        "files": [],
    }


def valid_actionable_report_payload() -> dict[str, Any]:
    return {
        "schemaVersion": ACTIONABLE_REPORT_SCHEMA_VERSION,
        "snapshotDiff": {"shouldOpenIssue": False},
        "parityRegression": {"shouldOpenIssue": False},
        "sourceSyncHealth": {"shouldOpenIssue": False},
        "parityFollowup": {"shouldOpenIssue": False},
    }


def valid_source_sync_status() -> dict[str, Any]:
    return {
        "schemaVersion": 2,
        "runId": "2026-04-07T00:00:00Z#sync-deadbeef",
        "checkedAt": "2026-04-07T00:00:00Z",
        "sourceInventoryFingerprint": "sha256:" + "a" * 64,
        "sidebarFingerprint": "sha256:" + "b" * 64,
        "freshnessState": "fresh",
        "runScope": {
            "type": "full",
            "isComplete": True,
            "filters": {"slug": None, "section": None},
        },
        "summary": {
            "targetPages": 100,
            "fetchedPages": 100,
            "notFoundPages": 0,
            "errorPages": 0,
            "excludedPages": 0,
            "excludedBrokenPages": 0,
            "excludedRecoveredPages": 0,
            "sidebarVerified": True,
        },
        "pages": [],
        "errors": [],
    }


# --- validate_snapshot_diff_status ---


def test_validate_snapshot_diff_accepts_valid() -> None:
    validate_snapshot_diff_status(valid_snapshot())


def test_validate_snapshot_diff_missing_run_id() -> None:
    v = valid_snapshot()
    del v["runId"]
    with pytest.raises(ValueError, match="runId must be a string"):
        validate_snapshot_diff_status(v)


def test_validate_snapshot_diff_bad_source_sync_run_id_type() -> None:
    v = valid_snapshot()
    v["sourceSyncRunId"] = 123
    with pytest.raises(ValueError, match=r"sourceSyncRunId must be string\|null"):
        validate_snapshot_diff_status(v)


def test_validate_snapshot_diff_missing_schema_version() -> None:
    v = valid_snapshot()
    del v["schemaVersion"]
    with pytest.raises(ValueError, match="unsupported schemaVersion"):
        validate_snapshot_diff_status(v)


def test_validate_snapshot_diff_wrong_schema_version() -> None:
    v = valid_snapshot()
    v["schemaVersion"] = 2
    with pytest.raises(ValueError, match="unsupported schemaVersion"):
        validate_snapshot_diff_status(v)


def test_validate_snapshot_diff_missing_run_scope() -> None:
    v = valid_snapshot()
    del v["runScope"]
    with pytest.raises(ValueError, match='missing "runScope"'):
        validate_snapshot_diff_status(v)


def test_validate_snapshot_diff_non_array_changes() -> None:
    v = valid_snapshot()
    v["changes"] = None
    with pytest.raises(ValueError, match='"changes" must be an array'):
        validate_snapshot_diff_status(v)


# --- validate_parity_check_status ---


def test_validate_parity_accepts_valid() -> None:
    validate_parity_check_status(valid_parity_status())


def test_validate_parity_missing_result() -> None:
    v = valid_parity_status()
    del v["summary"]["result"]
    with pytest.raises(
        ValueError, match=r"summary\.result must be one of pass\|fail\|inconclusive"
    ):
        validate_parity_check_status(v)


def test_validate_parity_unknown_result() -> None:
    v = valid_parity_status()
    v["summary"]["result"] = "green"
    with pytest.raises(
        ValueError, match=r"summary\.result must be one of pass\|fail\|inconclusive"
    ):
        validate_parity_check_status(v)


def test_validate_parity_run_scope_is_complete_missing() -> None:
    v = valid_parity_status()
    del v["summary"]["runScope"]["isComplete"]
    with pytest.raises(ValueError, match=r"summary\.runScope\.isComplete must be boolean"):
        validate_parity_check_status(v)


def test_validate_parity_missing_schema_version() -> None:
    v = valid_parity_status()
    del v["schemaVersion"]
    with pytest.raises(ValueError, match="unsupported schemaVersion"):
        validate_parity_check_status(v)


def test_validate_parity_debug_artifact_coverage_passthrough() -> None:
    v = valid_parity_status()
    v["debug"] = {
        "artifactCoverage": {
            "registryEntries": 2,
            "matchedHits": 3,
            "bySlug": {"a/b": 2, "c/d": 1},
            "byToken": {"/docs/index": 2, "http://google.com": 1},
        },
    }
    validate_parity_check_status(v)
    assert v["debug"]["artifactCoverage"]["matchedHits"] == 3


# --- validate_actionable_report ---


def test_validate_actionable_accepts_valid() -> None:
    validate_actionable_report(valid_actionable_report_payload())


def test_validate_actionable_missing_family() -> None:
    v = valid_actionable_report_payload()
    del v["parityRegression"]
    with pytest.raises(ValueError, match='missing "parityRegression"'):
        validate_actionable_report(v)


def test_validate_actionable_non_boolean_should_open_issue() -> None:
    v = valid_actionable_report_payload()
    v["parityRegression"]["shouldOpenIssue"] = "no"
    with pytest.raises(ValueError, match=r"parityRegression\.shouldOpenIssue must be boolean"):
        validate_actionable_report(v)


def test_validate_actionable_wrong_schema_version() -> None:
    v = valid_actionable_report_payload()
    v["schemaVersion"] = 999
    with pytest.raises(ValueError, match="unsupported schemaVersion"):
        validate_actionable_report(v)


# --- validate_source_sync_status ---


def test_validate_source_sync_accepts_valid() -> None:
    validate_source_sync_status(valid_source_sync_status())


def test_validate_source_sync_bad_run_id_type() -> None:
    v = valid_source_sync_status()
    v["runId"] = 123
    with pytest.raises(ValueError, match="runId must be a string"):
        validate_source_sync_status(v)


def test_validate_source_sync_bad_checked_at_type() -> None:
    v = valid_source_sync_status()
    v["checkedAt"] = 123
    with pytest.raises(ValueError, match="checkedAt must be a string"):
        validate_source_sync_status(v)


def test_validate_source_sync_missing_schema_version() -> None:
    v = valid_source_sync_status()
    del v["schemaVersion"]
    with pytest.raises(ValueError, match="unsupported schemaVersion"):
        validate_source_sync_status(v)


def test_validate_source_sync_schema_v1_backcompat() -> None:
    v = {
        "schemaVersion": 1,
        "runId": "2026-04-07T00:00:00Z#old",
        "checkedAt": "2026-04-07T00:00:00Z",
        "sourceInventoryFingerprint": "sha256:" + "a" * 64,
        "sidebarFingerprint": "sha256:" + "b" * 64,
        "freshnessState": "fresh",
        "runScope": {
            "type": "full",
            "isComplete": True,
            "filters": {"slug": None, "section": None},
        },
        "summary": {
            "targetPages": 100,
            "fetchedPages": 100,
            "notFoundPages": 0,
            "errorPages": 0,
            "sidebarVerified": True,
        },
        "pages": [],
        "errors": [],
    }
    validate_source_sync_status(v)


def test_validate_source_sync_missing_run_scope() -> None:
    v = valid_source_sync_status()
    del v["runScope"]
    with pytest.raises(ValueError, match="runScope is required"):
        validate_source_sync_status(v)


def test_validate_source_sync_unknown_freshness() -> None:
    v = valid_source_sync_status()
    v["freshnessState"] = "green"
    with pytest.raises(
        ValueError, match=r"freshnessState must be one of fresh\|partial\|broken\|stale"
    ):
        validate_source_sync_status(v)


def test_validate_source_sync_bad_source_inventory_fingerprint() -> None:
    v = valid_source_sync_status()
    v["sourceInventoryFingerprint"] = 123
    with pytest.raises(ValueError, match="sourceInventoryFingerprint must be a string"):
        validate_source_sync_status(v)


def test_validate_source_sync_bad_sidebar_fingerprint() -> None:
    v = valid_source_sync_status()
    v["sidebarFingerprint"] = 123
    with pytest.raises(ValueError, match="sidebarFingerprint must be a string"):
        validate_source_sync_status(v)


def test_validate_source_sync_bad_sidebar_verified_type() -> None:
    v = valid_source_sync_status()
    v["summary"]["sidebarVerified"] = "yes"
    with pytest.raises(ValueError, match=r"summary\.sidebarVerified must be boolean"):
        validate_source_sync_status(v)


def test_validate_source_sync_bad_pages_type() -> None:
    v = valid_source_sync_status()
    v["pages"] = None
    with pytest.raises(ValueError, match="pages must be an array"):
        validate_source_sync_status(v)


def test_validate_source_sync_bad_errors_type() -> None:
    v = valid_source_sync_status()
    v["errors"] = None
    with pytest.raises(ValueError, match="errors must be an array"):
        validate_source_sync_status(v)


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("excludedPages", "one"),
        ("excludedBrokenPages", None),
        ("excludedRecoveredPages", None),  # None != number
    ],
)
def test_validate_source_sync_bad_excluded_counter_type(field: str, value: Any) -> None:
    v = valid_source_sync_status()
    v["summary"][field] = value
    with pytest.raises(ValueError, match=rf"summary\.{field} must be a number"):
        validate_source_sync_status(v)


def test_validate_source_sync_non_excluded_with_debt_category() -> None:
    v = valid_source_sync_status()
    v["pages"] = [{"slug": "a", "fetchStatus": "excluded-typo", "debtCategory": "source-side-debt"}]
    with pytest.raises(ValueError, match="non-excluded page.*must not have debtCategory"):
        validate_source_sync_status(v)


def test_validate_source_sync_debt_page_missing_recovery_probe() -> None:
    v = valid_source_sync_status()
    v["pages"] = [
        {"slug": "a", "fetchStatus": "excluded-broken", "debtCategory": "source-side-debt"}
    ]
    with pytest.raises(ValueError, match="recoveryProbe"):
        validate_source_sync_status(v)


def test_validate_source_sync_valid_debt_page_with_probe() -> None:
    v = valid_source_sync_status()
    v["summary"]["excludedPages"] = 1
    v["summary"]["excludedBrokenPages"] = 1
    v["pages"] = [
        {
            "slug": "a",
            "fetchStatus": "excluded-broken",
            "debtCategory": "source-side-debt",
            "recoveryProbe": {
                "issueType": "snapshot-incomplete",
                "reason": "extractor-empty",
                "expectedIssueType": "snapshot-incomplete",
                "expectedReason": "extractor-empty",
                "expectedMatch": True,
            },
        }
    ]
    validate_source_sync_status(v)


def test_validate_source_sync_valid_recovered_with_null_probe() -> None:
    v = valid_source_sync_status()
    v["summary"]["excludedPages"] = 1
    v["summary"]["excludedRecoveredPages"] = 1
    v["pages"] = [
        {
            "slug": "a",
            "fetchStatus": "excluded-recovered",
            "debtCategory": "source-side-debt",
            "recoveryProbe": None,
        }
    ]
    validate_source_sync_status(v)


def test_validate_source_sync_broken_with_null_probe_rejected() -> None:
    v = valid_source_sync_status()
    v["summary"]["excludedPages"] = 1
    v["summary"]["excludedBrokenPages"] = 1
    v["pages"] = [
        {
            "slug": "a",
            "fetchStatus": "excluded-broken",
            "debtCategory": "source-side-debt",
            "recoveryProbe": None,
        }
    ]
    with pytest.raises(ValueError, match="recoveryProbe must be an object for excluded-broken"):
        validate_source_sync_status(v)


def test_validate_source_sync_broken_expected_match_not_boolean() -> None:
    v = valid_source_sync_status()
    v["summary"]["excludedPages"] = 1
    v["summary"]["excludedBrokenPages"] = 1
    v["pages"] = [
        {
            "slug": "a",
            "fetchStatus": "excluded-broken",
            "debtCategory": "source-side-debt",
            "recoveryProbe": {
                "issueType": "snapshot-incomplete",
                "reason": "extractor-empty",
                "expectedIssueType": "snapshot-incomplete",
                "expectedReason": "extractor-empty",
                "expectedMatch": "yes",
            },
        }
    ]
    with pytest.raises(ValueError, match=r"recoveryProbe\.expectedMatch must be a boolean"):
        validate_source_sync_status(v)


def test_validate_source_sync_recovered_with_non_null_probe_rejected() -> None:
    v = valid_source_sync_status()
    v["summary"]["excludedPages"] = 1
    v["summary"]["excludedRecoveredPages"] = 1
    v["pages"] = [
        {
            "slug": "a",
            "fetchStatus": "excluded-recovered",
            "debtCategory": "source-side-debt",
            "recoveryProbe": {
                "issueType": "snapshot-incomplete",
                "reason": "extractor-empty",
                "expectedIssueType": "snapshot-incomplete",
                "expectedReason": "extractor-empty",
                "expectedMatch": True,
            },
        }
    ]
    with pytest.raises(ValueError, match="recoveryProbe must be null for excluded-recovered"):
        validate_source_sync_status(v)


def test_validate_source_sync_excluded_broken_missing_debt_category() -> None:
    v = valid_source_sync_status()
    v["summary"]["excludedPages"] = 1
    v["summary"]["excludedBrokenPages"] = 1
    v["pages"] = [
        {
            "slug": "a",
            "fetchStatus": "excluded-broken",
            "recoveryProbe": {
                "issueType": "snapshot-incomplete",
                "reason": "extractor-empty",
                "expectedIssueType": "snapshot-incomplete",
                "expectedReason": "extractor-empty",
                "expectedMatch": True,
            },
        }
    ]
    with pytest.raises(ValueError, match="excluded page.*must have debtCategory"):
        validate_source_sync_status(v)


def test_validate_source_sync_non_excluded_with_recovery_probe() -> None:
    v = valid_source_sync_status()
    v["pages"] = [{"slug": "a", "fetchStatus": "ok", "recoveryProbe": None}]
    with pytest.raises(ValueError, match="non-excluded page.*must not have recoveryProbe"):
        validate_source_sync_status(v)


def test_validate_source_sync_bad_debt_category_value() -> None:
    v = valid_source_sync_status()
    v["summary"]["excludedPages"] = 1
    v["summary"]["excludedBrokenPages"] = 1
    v["pages"] = [
        {
            "slug": "a",
            "fetchStatus": "excluded-broken",
            "debtCategory": "foo",
            "recoveryProbe": {
                "issueType": "snapshot-incomplete",
                "reason": "extractor-empty",
                "expectedIssueType": "snapshot-incomplete",
                "expectedReason": "extractor-empty",
                "expectedMatch": True,
            },
        }
    ]
    with pytest.raises(ValueError, match='must have debtCategory "source-side-debt"'):
        validate_source_sync_status(v)


def test_validate_source_sync_summary_excluded_count_mismatch() -> None:
    v = valid_source_sync_status()
    v["summary"]["excludedPages"] = 0
    v["summary"]["excludedBrokenPages"] = 0
    v["pages"] = [
        {
            "slug": "a",
            "fetchStatus": "excluded-broken",
            "debtCategory": "source-side-debt",
            "recoveryProbe": {
                "issueType": "snapshot-incomplete",
                "reason": "extractor-empty",
                "expectedIssueType": "snapshot-incomplete",
                "expectedReason": "extractor-empty",
                "expectedMatch": True,
            },
        }
    ]
    with pytest.raises(
        ValueError, match=r"summary\.excludedPages must equal pages\[\] excluded count"
    ):
        validate_source_sync_status(v)


# --- validate_detection_inputs ---


def test_validate_detection_inputs_all_valid() -> None:
    assert validate_detection_inputs(
        {
            "snapshot": valid_snapshot(),
            "parity": valid_parity_status(),
            "sourceSync": valid_source_sync_status(),
        }
    ) == {"ok": True}


def test_validate_detection_inputs_empty_source_sync_ok() -> None:
    """legacy run: sourceSync が空 dict のときは validation skip。"""
    assert validate_detection_inputs(
        {
            "snapshot": valid_snapshot(),
            "parity": valid_parity_status(),
            "sourceSync": {},
        }
    ) == {"ok": True}


def test_validate_detection_inputs_reports_parity_error() -> None:
    broken = valid_parity_status()
    del broken["summary"]["result"]
    result = validate_detection_inputs(
        {
            "snapshot": valid_snapshot(),
            "parity": broken,
            "sourceSync": valid_source_sync_status(),
        }
    )
    assert result["ok"] is False
    assert len(result["errors"]) >= 1
    assert result["errors"][0].startswith("parity:")


def test_validate_detection_inputs_reports_source_sync_error() -> None:
    result = validate_detection_inputs(
        {
            "snapshot": valid_snapshot(),
            "parity": valid_parity_status(),
            "sourceSync": {**valid_source_sync_status(), "schemaVersion": "bad"},
        }
    )
    assert result["ok"] is False
    assert any(e.startswith("sourceSync:") for e in result["errors"])


# ---------------------------------------------------------------------------
# source-side debt
# ---------------------------------------------------------------------------


def test_source_side_debt_section_emitted_when_excluded_pages_exist() -> None:
    source_sync = {
        "schemaVersion": 1,
        "freshnessState": "fresh",
        "summary": {
            "targetPages": 100,
            "fetchedPages": 99,
            "notFoundPages": 0,
            "errorPages": 0,
            "excludedPages": 1,
            "excludedBrokenPages": 1,
            "excludedRecoveredPages": 0,
            "sidebarVerified": True,
        },
        "pages": [
            {
                "slug": "testops/version-control/pr",
                "fetchStatus": "excluded-broken",
                "debtCategory": "source-side-debt",
                "recoveryProbe": {
                    "issueType": "snapshot-incomplete",
                    "reason": "extractor-empty",
                    "expectedIssueType": "snapshot-incomplete",
                    "expectedReason": "extractor-empty",
                    "expectedMatch": True,
                },
            }
        ],
        "errors": [],
    }
    report = build_actionable_report(
        _empty_snapshot(), _empty_parity(), [], {"sourceSync": source_sync}
    )
    md = render_summary_markdown(_empty_snapshot(), _empty_parity(), report, [], source_sync)
    assert re.search(r"## ソース原文の既知問題", md)
    assert "除外ページ: 1" in md
    assert "未復旧: 1" in md
    assert "復旧候補: 0" in md
    assert "testops/version-control/pr" in md


def test_source_side_debt_section_omitted_when_none() -> None:
    source_sync = {
        "schemaVersion": 1,
        "freshnessState": "fresh",
        "summary": {
            "targetPages": 100,
            "fetchedPages": 100,
            "notFoundPages": 0,
            "errorPages": 0,
            "excludedPages": 0,
            "excludedBrokenPages": 0,
            "excludedRecoveredPages": 0,
            "sidebarVerified": True,
        },
        "pages": [],
        "errors": [],
    }
    report = build_actionable_report(
        _empty_snapshot(), _empty_parity(), [], {"sourceSync": source_sync}
    )
    md = render_summary_markdown(_empty_snapshot(), _empty_parity(), report, [], source_sync)
    assert "## ソース原文の既知問題" not in md


def test_source_side_debt_counters_exposed_on_actionable_report() -> None:
    source_sync = {
        "schemaVersion": 1,
        "freshnessState": "fresh",
        "summary": {
            "targetPages": 100,
            "fetchedPages": 98,
            "notFoundPages": 0,
            "errorPages": 0,
            "excludedPages": 2,
            "excludedBrokenPages": 1,
            "excludedRecoveredPages": 1,
            "sidebarVerified": True,
        },
        "pages": [
            {
                "slug": "a",
                "fetchStatus": "excluded-broken",
                "debtCategory": "source-side-debt",
                "recoveryProbe": {
                    "issueType": "snapshot-incomplete",
                    "reason": "extractor-empty",
                    "expectedIssueType": "snapshot-incomplete",
                    "expectedReason": "extractor-empty",
                    "expectedMatch": True,
                },
            },
            {
                "slug": "b",
                "fetchStatus": "excluded-recovered",
                "debtCategory": "source-side-debt",
                "recoveryProbe": None,
            },
        ],
        "errors": [],
    }
    report = build_actionable_report(
        _empty_snapshot(), _empty_parity(), [], {"sourceSync": source_sync}
    )
    debt = report["sourceSyncHealth"]["sourceSideDebt"]
    assert debt["excludedPages"] == 2
    assert debt["excludedBrokenPages"] == 1
    assert debt["excludedRecoveredPages"] == 1
    assert debt["brokenSlugs"] == ["a"]
    assert debt["recoveredSlugs"] == ["b"]


def test_source_side_debt_fresh_with_debt_opens_issue() -> None:
    """P1 フィードバック: freshness=fresh でも excludedPages > 0 なら issue open。"""
    source_sync = {
        "schemaVersion": 1,
        "freshnessState": "fresh",
        "summary": {
            "targetPages": 100,
            "fetchedPages": 99,
            "notFoundPages": 0,
            "errorPages": 0,
            "excludedPages": 1,
            "excludedBrokenPages": 1,
            "excludedRecoveredPages": 0,
            "sidebarVerified": True,
        },
        "pages": [
            {
                "slug": "testops/version-control/pr",
                "fetchStatus": "excluded-broken",
                "debtCategory": "source-side-debt",
                "recoveryProbe": {
                    "issueType": "snapshot-incomplete",
                    "reason": "extractor-empty",
                    "expectedIssueType": "snapshot-incomplete",
                    "expectedReason": "extractor-empty",
                    "expectedMatch": True,
                },
            }
        ],
        "errors": [],
    }
    report = build_actionable_report(
        _empty_snapshot(), _empty_parity(), [], {"sourceSync": source_sync}
    )
    assert report["sourceSyncHealth"]["shouldOpenIssue"] is True
    assert "ソース原文の既知問題" in report["sourceSyncHealth"]["body"]


@pytest.mark.parametrize(
    ("expected_match", "label_pattern"),
    [
        (True, "想定どおり"),
        (False, "想定と不一致"),
    ],
)
def test_source_side_debt_expected_match_label(expected_match: bool, label_pattern: str) -> None:
    source_sync = {
        "schemaVersion": 1,
        "freshnessState": "fresh",
        "summary": {
            "targetPages": 100,
            "fetchedPages": 99,
            "notFoundPages": 0,
            "errorPages": 0,
            "excludedPages": 1,
            "excludedBrokenPages": 1,
            "excludedRecoveredPages": 0,
            "sidebarVerified": True,
        },
        "pages": [
            {
                "slug": "test/case",
                "fetchStatus": "excluded-broken",
                "debtCategory": "source-side-debt",
                "recoveryProbe": {
                    "issueType": "snapshot-incomplete",
                    "reason": "extractor-empty" if expected_match else "shallow-snapshot",
                    "expectedIssueType": "snapshot-incomplete",
                    "expectedReason": "extractor-empty",
                    "expectedMatch": expected_match,
                },
            }
        ],
        "errors": [],
    }
    report = build_actionable_report(
        _empty_snapshot(), _empty_parity(), [], {"sourceSync": source_sync}
    )
    md = render_summary_markdown(_empty_snapshot(), _empty_parity(), report, [], source_sync)
    assert label_pattern in md
