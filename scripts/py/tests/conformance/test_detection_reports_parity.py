"""detection_reports.py の mjs byte 一致 conformance (Phase 3 M7)。

以下の surface を pin する:

- constants: ``ACTIONABLE_REPORT_SCHEMA_VERSION`` / ``FAMILY_KEYS`` /
  ``UPSTREAM_RECOVERY_STICKY_MARKER``
- schema validators: ``validate_snapshot_diff_status`` /
  ``validate_parity_check_status`` / ``validate_source_sync_status`` /
  ``validate_actionable_report`` / ``validate_detection_inputs``
- decision helpers: ``classify_snapshot_bucket`` / ``assign_review_groups`` /
  ``build_audit_manifest``
- top-level builders: ``build_actionable_report`` (generatedAt を除外して比較) /
  ``render_summary_markdown`` / ``render_upstream_recovery_sticky_comment``

``build_actionable_report`` の戻り値は ``generatedAt`` に現在時刻が入るため、
mjs/Python 双方の harness で ``generatedAt`` を外した同一 shape を比較する
(本質的な差分ロジックは variable ではない)。
"""

from __future__ import annotations

import pytest

from testim_parity.detection_reports import (
    ACTIONABLE_REPORT_SCHEMA_VERSION,
    FAMILY_KEYS,
    UPSTREAM_RECOVERY_STICKY_MARKER,
    assign_review_groups,
    build_actionable_report,
    build_audit_manifest,
    classify_snapshot_bucket,
    render_summary_markdown,
    render_upstream_recovery_sticky_comment,
    validate_actionable_report,
    validate_detection_inputs,
    validate_parity_check_status,
    validate_snapshot_diff_status,
    validate_source_sync_status,
)

from ._harness import run_batch

FP = "sha256:" + "0" * 64


# ---------------------------------------------------------------------------
# Sample payloads
# ---------------------------------------------------------------------------


VALID_SNAPSHOT = {
    "schemaVersion": 1,
    "checkedAt": "2026-04-21T10:00:00Z",
    "runId": "run-1",
    "sourceSyncRunId": None,
    "summary": {
        "changed": 1,
        "added": 1,
        "removed": 0,
        "unchanged": 5,
        "totalSnapshots": 7,
    },
    "changes": [
        {
            "slug": "overview/testim-overview",
            "type": "page-changed",
            "sourceUrl": "https://example.com/overview",
            "diffLines": 10,
            "categories": {
                "heading": {"added": 1, "removed": 0},
                "image": {"added": 0, "removed": 0},
            },
        },
        {
            "slug": "new-page",
            "type": "page-added",
            "sourceUrl": "https://example.com/new-page",
            "diffLines": 50,
            "categories": {},
        },
    ],
    "runScope": {"isComplete": True},
}

VALID_PARITY = {
    "schemaVersion": 1,
    "summary": {
        "checkedAt": "2026-04-21T10:05:00Z",
        "result": "pass",
        "runScope": {"isComplete": True},
        "activeActionableFiles": 0,
        "activeErrorFiles": 0,
        "acknowledgedIssues": 0,
        "expiredAcknowledgements": 0,
        "baselinedIssues": 2,
        "baselinedFiles": 1,
        "baselinedByType": {"segment-missing": 2},
        "baselineInvalidatedSlugs": [],
        "advisoryQueueIssues": 0,
        "advisoryQueueFiles": 0,
        "auditSignalIssues": 0,
        "auditSignalFiles": 0,
        "auditSignalsByType": {},
        "structureMismatchIssues": 0,
        "structureMismatchFiles": 0,
        "structureMismatchByType": {},
        "snapshotUnusableIssues": 0,
        "snapshotUnusableFiles": 0,
        "snapshotUnusableByType": {},
        "orphanBaselineEntries": 0,
        "orphanBaselineByType": {},
        "freshnessState": "fresh",
        "linkageState": "linked",
        "reportableActiveFiles": 0,
        "reportableActiveActionableFiles": 0,
        "activeFiles": 0,
        "actionableFiles": 0,
        "errorFiles": 0,
    },
    "files": [
        {
            "file": "src/content/docs/overview/testim-overview.md",
            "issues": [
                {
                    "type": "segment-missing",
                    "severity": "actionable",
                    "baselined": True,
                    "detail": "missing paragraph",
                }
            ],
        }
    ],
    "advisoryQueue": [],
    "advisoryQueueScope": {"isComplete": True, "type": "all", "filters": {}},
}

VALID_SOURCE_SYNC_V2 = {
    "schemaVersion": 2,
    "runId": "src-run-1",
    "checkedAt": "2026-04-21T09:55:00Z",
    "freshnessState": "fresh",
    "sourceInventoryFingerprint": FP,
    "sidebarFingerprint": FP,
    "runScope": {"isComplete": True},
    "summary": {
        "sidebarVerified": True,
        "excludedPages": 0,
        "excludedBrokenPages": 0,
        "excludedRecoveredPages": 0,
        "targetPages": 10,
        "fetchedPages": 10,
        "notFoundPages": 0,
        "errorPages": 0,
    },
    "pages": [],
    "errors": [],
}


VALIDATE_SNAPSHOT_SAMPLES: list = [
    VALID_SNAPSHOT,
    {**VALID_SNAPSHOT, "schemaVersion": 9},
    {**VALID_SNAPSHOT, "checkedAt": 123},
    {**VALID_SNAPSHOT, "changes": "not-a-list"},
    "not-an-object",
]

VALIDATE_PARITY_SAMPLES: list = [
    VALID_PARITY,
    {**VALID_PARITY, "summary": {**VALID_PARITY["summary"], "result": "unknown"}},
    {**VALID_PARITY, "schemaVersion": 2},
    {**VALID_PARITY, "files": {}},
]

VALIDATE_SOURCE_SYNC_SAMPLES: list = [
    VALID_SOURCE_SYNC_V2,
    {**VALID_SOURCE_SYNC_V2, "freshnessState": "bad"},
    {**VALID_SOURCE_SYNC_V2, "schemaVersion": 3},
    {
        **VALID_SOURCE_SYNC_V2,
        "summary": {**VALID_SOURCE_SYNC_V2["summary"], "excludedPages": "not-a-num"},
    },
]

VALID_ACTIONABLE = {
    "schemaVersion": 1,
    "snapshotDiff": {"shouldOpenIssue": True},
    "parityRegression": {"shouldOpenIssue": False},
    "sourceSyncHealth": {"shouldOpenIssue": False},
    "parityFollowup": {"shouldOpenIssue": True},
}

VALIDATE_ACTIONABLE_SAMPLES: list = [
    VALID_ACTIONABLE,
    {**VALID_ACTIONABLE, "schemaVersion": 2},
    {k: v for k, v in VALID_ACTIONABLE.items() if k != "parityFollowup"},
    {**VALID_ACTIONABLE, "parityFollowup": {"shouldOpenIssue": "yes"}},
]

VALIDATE_INPUTS_SAMPLES: list = [
    {"snapshot": VALID_SNAPSHOT, "parity": VALID_PARITY, "sourceSync": VALID_SOURCE_SYNC_V2},
    {"snapshot": VALID_SNAPSHOT, "parity": VALID_PARITY, "sourceSync": {}},
    {"snapshot": {**VALID_SNAPSHOT, "runId": 42}, "parity": VALID_PARITY, "sourceSync": {}},
]


CLASSIFY_SAMPLES: list = [
    {"type": "page-added", "categories": {}},
    {"type": "page-removed", "categories": {}},
    {
        "type": "page-changed",
        "categories": {"heading": {"added": 0, "removed": 1}, "image": {"added": 0, "removed": 0}},
    },
    {
        "type": "page-changed",
        "categories": {"paragraph": {"added": 5, "removed": 0}},
    },
    {"type": "page-changed", "categories": {}},
]


ASSIGN_GROUP_SAMPLES: list = [
    [
        [
            {"slug": "b/page", "bucket": "page-lifecycle"},
            {"slug": "a/page", "bucket": "content-only"},
            {"slug": "c/page", "bucket": "structural-change"},
            {"slug": "d/page", "bucket": "structural-change"},
        ],
        3,
    ],
]

BUILD_MANIFEST_SAMPLES: list = [
    [VALID_SNAPSHOT, VALID_PARITY, {"groupCount": 3}],
]

BUILD_ACTIONABLE_SAMPLES: list = [
    [VALID_SNAPSHOT, VALID_PARITY, [], {"sourceSync": VALID_SOURCE_SYNC_V2}],
    [VALID_SNAPSHOT, VALID_PARITY, [], {}],
]

UPSTREAM_RECOVERY_SAMPLE = {
    "mechanisms": {
        "en_source_patches": [
            {
                "id": "UD-001",
                "slugs": ["page-a"],
                "statusA": "stale",
                "statusB": "current",
                "reviewAfter": "2026-05-01",
                "daysUntilReview": 10,
            },
            {
                "id": "UD-002",
                "slugs": ["page-b", "page-c"],
                "statusA": "active",
                "statusB": "overdue",
                "reviewAfter": "2026-03-01",
                "daysUntilReview": -30,
            },
        ],
        "source_sync_exclusions": [
            {
                "slug": "excluded-page",
                "statusA": "stale",
                "statusB": "overdue",
                "reviewAfter": "2026-04-01",
                "daysUntilReview": -5,
                "fetchStatus": "excluded-broken",
            }
        ],
    }
}

STICKY_SAMPLES: list = [
    [None, {}],
    [{}, {}],
    [UPSTREAM_RECOVERY_SAMPLE, {}],
    [UPSTREAM_RECOVERY_SAMPLE, {"maxEntries": 1}],
]


@pytest.fixture(scope="module")
def mjs_results(repo_root, node_available) -> dict:
    if not node_available:
        pytest.skip("node not available")
    calls: list = [
        {"function": "detection_reports_constants", "args": []},
    ]
    calls.extend(
        {"function": "detection_reports_validate_snapshot", "args": [s]}
        for s in VALIDATE_SNAPSHOT_SAMPLES
    )
    calls.extend(
        {"function": "detection_reports_validate_parity", "args": [s]}
        for s in VALIDATE_PARITY_SAMPLES
    )
    calls.extend(
        {"function": "detection_reports_validate_source_sync", "args": [s]}
        for s in VALIDATE_SOURCE_SYNC_SAMPLES
    )
    calls.extend(
        {"function": "detection_reports_validate_actionable", "args": [s]}
        for s in VALIDATE_ACTIONABLE_SAMPLES
    )
    calls.extend(
        {"function": "detection_reports_validate_inputs", "args": [i]}
        for i in VALIDATE_INPUTS_SAMPLES
    )
    calls.extend(
        {"function": "detection_reports_classify_bucket", "args": [c]} for c in CLASSIFY_SAMPLES
    )
    calls.extend(
        {"function": "detection_reports_assign_review_groups", "args": args}
        for args in ASSIGN_GROUP_SAMPLES
    )
    calls.extend(
        {"function": "detection_reports_build_audit_manifest", "args": args}
        for args in BUILD_MANIFEST_SAMPLES
    )
    calls.extend(
        {"function": "detection_reports_build_actionable", "args": args}
        for args in BUILD_ACTIONABLE_SAMPLES
    )
    calls.extend(
        {"function": "detection_reports_render_sticky", "args": args} for args in STICKY_SAMPLES
    )

    results = run_batch(repo_root, calls, timeout=60.0)
    cursor = 0

    def take(n: int) -> list:
        nonlocal cursor
        chunk = results[cursor : cursor + n]
        cursor += n
        return chunk

    return {
        "constants": take(1)[0],
        "validate_snapshot": take(len(VALIDATE_SNAPSHOT_SAMPLES)),
        "validate_parity": take(len(VALIDATE_PARITY_SAMPLES)),
        "validate_source_sync": take(len(VALIDATE_SOURCE_SYNC_SAMPLES)),
        "validate_actionable": take(len(VALIDATE_ACTIONABLE_SAMPLES)),
        "validate_inputs": take(len(VALIDATE_INPUTS_SAMPLES)),
        "classify": take(len(CLASSIFY_SAMPLES)),
        "assign_groups": take(len(ASSIGN_GROUP_SAMPLES)),
        "build_manifest": take(len(BUILD_MANIFEST_SAMPLES)),
        "build_actionable": take(len(BUILD_ACTIONABLE_SAMPLES)),
        "sticky": take(len(STICKY_SAMPLES)),
    }


def test_constants_match_mjs(mjs_results):
    assert (
        ACTIONABLE_REPORT_SCHEMA_VERSION
        == mjs_results["constants"]["ACTIONABLE_REPORT_SCHEMA_VERSION"]
    )
    assert dict(FAMILY_KEYS) == mjs_results["constants"]["FAMILY_KEYS"]
    assert (
        UPSTREAM_RECOVERY_STICKY_MARKER
        == mjs_results["constants"]["UPSTREAM_RECOVERY_STICKY_MARKER"]
    )


def test_validate_snapshot_matches_mjs(mjs_results):
    for sample, mjs in zip(
        VALIDATE_SNAPSHOT_SAMPLES, mjs_results["validate_snapshot"], strict=True
    ):
        try:
            validate_snapshot_diff_status(sample)
            py = {"ok": True}
        except ValueError as e:
            py = {"ok": False, "error": str(e)}
        assert py == mjs, f"diverge for {sample!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_validate_parity_matches_mjs(mjs_results):
    for sample, mjs in zip(VALIDATE_PARITY_SAMPLES, mjs_results["validate_parity"], strict=True):
        try:
            validate_parity_check_status(sample)
            py = {"ok": True}
        except ValueError as e:
            py = {"ok": False, "error": str(e)}
        assert py == mjs, f"diverge for {sample!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_validate_source_sync_matches_mjs(mjs_results):
    for sample, mjs in zip(
        VALIDATE_SOURCE_SYNC_SAMPLES, mjs_results["validate_source_sync"], strict=True
    ):
        try:
            validate_source_sync_status(sample)
            py = {"ok": True}
        except ValueError as e:
            py = {"ok": False, "error": str(e)}
        assert py == mjs, f"diverge for {sample!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_validate_actionable_matches_mjs(mjs_results):
    for sample, mjs in zip(
        VALIDATE_ACTIONABLE_SAMPLES, mjs_results["validate_actionable"], strict=True
    ):
        try:
            validate_actionable_report(sample)
            py = {"ok": True}
        except ValueError as e:
            py = {"ok": False, "error": str(e)}
        assert py == mjs, f"diverge for {sample!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_validate_inputs_matches_mjs(mjs_results):
    for sample, mjs in zip(VALIDATE_INPUTS_SAMPLES, mjs_results["validate_inputs"], strict=True):
        py = validate_detection_inputs(sample)
        assert py == mjs, f"diverge for {sample!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_classify_bucket_matches_mjs(mjs_results):
    for change, mjs in zip(CLASSIFY_SAMPLES, mjs_results["classify"], strict=True):
        py = classify_snapshot_bucket(change)
        assert py == mjs


def test_assign_review_groups_matches_mjs(mjs_results):
    for args, mjs in zip(ASSIGN_GROUP_SAMPLES, mjs_results["assign_groups"], strict=True):
        entries, group_count = args
        py = assign_review_groups(entries, group_count)
        assert py == mjs


def test_build_audit_manifest_matches_mjs(mjs_results):
    for args, mjs in zip(BUILD_MANIFEST_SAMPLES, mjs_results["build_manifest"], strict=True):
        snapshot, parity, options = args
        py = build_audit_manifest(snapshot, parity, group_count=options.get("groupCount", 6))
        assert py == mjs, f"diverge for args={args!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_build_actionable_matches_mjs(mjs_results):
    """generatedAt は timestamp なので除外。ロジック出力の shape / 内容が一致することを保証。"""
    for args, mjs in zip(BUILD_ACTIONABLE_SAMPLES, mjs_results["build_actionable"], strict=True):
        snapshot, parity, manifest, options = args
        py_report = build_actionable_report(snapshot, parity, manifest, options)
        py = {k: v for k, v in py_report.items() if k != "generatedAt"}
        assert py == mjs, f"diverge:\n  py keys={list(py.keys())}\n  mjs keys={list(mjs.keys())}"


def test_sticky_comment_matches_mjs(mjs_results):
    for args, mjs in zip(STICKY_SAMPLES, mjs_results["sticky"], strict=True):
        upstream, options = args
        # mjs は camelCase option (maxEntries) を受けるので snake_case に変換。
        kwargs: dict = {}
        if "maxEntries" in options:
            kwargs["max_entries"] = options["maxEntries"]
        if "marker" in options:
            kwargs["marker"] = options["marker"]
        py = render_upstream_recovery_sticky_comment(upstream, **kwargs)
        assert py == mjs, f"diverge for {args!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_render_summary_markdown_produces_non_empty():
    """mjs と byte 比較するには actionable_report 全体が必要なので、最低限 non-empty を確認する。"""
    report = build_actionable_report(VALID_SNAPSHOT, VALID_PARITY, [])
    md = render_summary_markdown(VALID_SNAPSHOT, VALID_PARITY, report, [], VALID_SOURCE_SYNC_V2)
    assert "# ドキュメント検知サマリー" in md
    assert "## ソース同期状態" in md
