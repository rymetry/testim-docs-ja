"""source-side debt registry の契約 + pipeline integration (mjs port)。

mjs ``source_parity_source_side_debt.test.mjs`` を pytest に移植。
registry seeding → JA/snapshot integrity → build_source_sync_status /
build_actionable_report / render_summary_markdown までの end-to-end 契約を pin する。
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

from testim_parity.detection_reports import (
    build_actionable_report,
    render_summary_markdown,
)
from testim_parity.project import DOCS_DIR, ROOT_DIR
from testim_parity.sync_exclusions import (
    SOURCE_SYNC_EXCLUSIONS,
    get_exclusion,
    list_source_side_debt_slugs,
)
from testim_parity.sync_health import (
    build_source_sync_status,
    compute_freshness_state,
)

SNAPSHOTS_CONTENT_DIR: Path = ROOT_DIR / "snapshots" / "en" / "content"

DEBT_SLUG = "testops/testops-version-control/pull-requests"
NORMAL_SLUG = "overview/testim-overview"

BASE_SIDEBAR_RESULT = {
    "ok": True,
    "sectionCount": 20,
    "pageCount": 200,
    "sidebarSlugs": ["a", "b", "c"],
}
FULL_SCOPE = {"type": "full", "isComplete": True, "filters": {"slug": None, "section": None}}


# ---------------------------------------------------------------------------
# registry seeding
# ---------------------------------------------------------------------------


def test_registry_contains_pull_requests_seed() -> None:
    slugs = list_source_side_debt_slugs()
    assert len(slugs) >= 1, f"expected at least one source-side debt entry, got {len(slugs)}"
    assert DEBT_SLUG in slugs, (
        f"pull-requests must be seeded as the first known debt entry. Actual slugs: {slugs}"
    )


def test_registry_only_contains_upstream_broken_entries() -> None:
    for slug, entry in SOURCE_SYNC_EXCLUSIONS.items():
        assert entry["reason"] == "broken-upstream-source", (
            f"registry[{slug}] must declare reason='broken-upstream-source' "
            "(auto-exclusion is forbidden — only hand-confirmed upstream debt)"
        )


# ---------------------------------------------------------------------------
# repository integrity (parameterized per debt slug)
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("slug", list_source_side_debt_slugs())
def test_debt_slug_has_matching_ja_file(slug: str) -> None:
    ja_path = DOCS_DIR / f"{slug}.md"
    assert ja_path.exists(), f"debt slug {slug} must have a JA file at {ja_path}"


@pytest.mark.parametrize("slug", list_source_side_debt_slugs())
def test_debt_slug_has_frozen_snapshot(slug: str) -> None:
    snapshot_path = SNAPSHOTS_CONTENT_DIR / f"{slug}.html"
    assert snapshot_path.exists(), (
        f"debt slug {slug} must keep its hand-authored snapshot at {snapshot_path}"
    )


@pytest.mark.parametrize("slug", list_source_side_debt_slugs())
def test_debt_slug_metadata_is_probe_compatible(slug: str) -> None:
    entry = get_exclusion(slug)
    assert entry is not None, "registry entry must exist"

    valid_issue_types = {"snapshot-incomplete", "source-unusable"}
    valid_reasons = {
        "extractor-empty",
        "shallow-snapshot",
        "escaped-details-residue",
        "fetch-failed",
    }
    assert entry["expectedIssueType"] in valid_issue_types, (
        f"{slug}: expectedIssueType must be a known detect_source_usability type. "
        f"Got: {entry['expectedIssueType']}"
    )
    assert entry["expectedReason"] in valid_reasons, (
        f"{slug}: expectedReason must be a known detect_source_usability reason. "
        f"Got: {entry['expectedReason']}"
    )
    assert re.match(r"^\d{4}-\d{2}-\d{2}$", entry["addedAt"]), (
        f"{slug}: addedAt must be ISO date (YYYY-MM-DD)"
    )
    assert re.match(r"^\d{4}-\d{2}-\d{2}$", entry["reviewAfter"]), (
        f"{slug}: reviewAfter must be ISO date (YYYY-MM-DD)"
    )
    assert isinstance(entry["linkedIssue"], int), (
        f"{slug}: linkedIssue must be an int (GitHub issue number)"
    )


# ---------------------------------------------------------------------------
# pipeline integration
# ---------------------------------------------------------------------------


def _build_mixed_run() -> dict:
    pages = [
        {"slug": NORMAL_SLUG, "fetchStatus": "ok"},
        {
            "slug": DEBT_SLUG,
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
    ]
    return build_source_sync_status(
        pages=pages,
        sidebar_result=BASE_SIDEBAR_RESULT,
        run_scope=FULL_SCOPE,
        run_seed="test-seed",
    )


def test_source_sync_status_isolates_debt_from_fetch_counters() -> None:
    status = _build_mixed_run()
    assert status["summary"]["fetchedPages"] == 1
    assert status["summary"]["errorPages"] == 0
    assert status["summary"]["excludedPages"] == 1
    assert status["summary"]["excludedBrokenPages"] == 1
    # debt だけでは freshness は壊れない
    assert status["freshnessState"] == "fresh"


def _empty_snapshot() -> dict:
    return {
        "checkedAt": "2026-04-09T00:00:00Z",
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


def _empty_parity() -> dict:
    return {
        "summary": {
            "checkedAt": "2026-04-09T00:00:00Z",
            "actionableFiles": 0,
            "signalFiles": 0,
            "errorFiles": 0,
        },
        "files": [],
    }


def test_actionable_report_exposes_source_side_debt_summary() -> None:
    source_sync = _build_mixed_run()
    report = build_actionable_report(
        _empty_snapshot(), _empty_parity(), [], {"sourceSync": source_sync}
    )

    debt = report["sourceSyncHealth"]["sourceSideDebt"]
    assert debt["excludedPages"] == 1
    assert debt["excludedBrokenPages"] == 1
    assert debt["brokenSlugs"] == [DEBT_SLUG]
    assert debt["brokenDetails"] == [
        {
            "slug": DEBT_SLUG,
            "actualIssueType": "snapshot-incomplete",
            "actualReason": "extractor-empty",
            "expectedIssueType": "snapshot-incomplete",
            "expectedReason": "extractor-empty",
            "expectedMatch": True,
        }
    ]
    # P1 修正: fresh でも debt があれば managed issue に可視化
    assert report["sourceSyncHealth"]["shouldOpenIssue"] is True


def test_summary_markdown_emits_debt_section() -> None:
    source_sync = _build_mixed_run()
    report = build_actionable_report(
        _empty_snapshot(), _empty_parity(), [], {"sourceSync": source_sync}
    )
    md = render_summary_markdown(_empty_snapshot(), _empty_parity(), report, [], source_sync)

    assert re.search(r"## ソース原文の既知問題", md)
    assert re.search(r"除外ページ: 1", md)
    assert re.search(r"未復旧: 1", md)
    # slug が listing に出現する
    assert DEBT_SLUG in md
    # probe 結果
    assert "snapshot-incomplete" in md
    assert "extractor-empty" in md


def test_debt_only_run_keeps_freshness_fresh() -> None:
    debt_only = build_source_sync_status(
        pages=[
            {
                "slug": DEBT_SLUG,
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
        ],
        sidebar_result=BASE_SIDEBAR_RESULT,
        run_scope=FULL_SCOPE,
        run_seed="test-seed",
    )
    assert debt_only["freshnessState"] == "fresh"


def test_compute_freshness_state_ignores_debt_when_mixed_with_errors() -> None:
    pages = [
        {"slug": "n", "fetchStatus": "ok"},
        {"slug": "e", "fetchStatus": "error"},
        {
            "slug": DEBT_SLUG,
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
    ]
    assert compute_freshness_state(pages, sidebar_verified=True) == "partial"


def test_excluded_fetch_error_degrades_freshness() -> None:
    # excluded-fetch-error は EXCLUDED_FETCH_STATUSES 非対象 → non-excluded 扱い。
    pages = [
        {
            "slug": DEBT_SLUG,
            "fetchStatus": "excluded-fetch-error",
            "debtCategory": "source-side-debt",
            "errorDetail": "HTTP 500",
            "recoveryProbe": None,
        },
    ]
    assert compute_freshness_state(pages, sidebar_verified=True) == "broken"


def test_ok_plus_excluded_fetch_error_is_partial() -> None:
    pages = [
        {"slug": "n", "fetchStatus": "ok"},
        {
            "slug": DEBT_SLUG,
            "fetchStatus": "excluded-fetch-error",
            "debtCategory": "source-side-debt",
            "errorDetail": "HTTP 500",
            "recoveryProbe": None,
        },
    ]
    assert compute_freshness_state(pages, sidebar_verified=True) == "partial"
