"""``testim_parity.detection.check_patch_review_cadence`` unit tests (Phase 5)。

mjs ``scripts/__tests__/check_patch_review_cadence.test.mjs`` の behavioral 等価。
"""

from __future__ import annotations

import io
from datetime import UTC, datetime
from typing import Any

from testim_parity.detection.check_patch_review_cadence import (
    collect_overdue_patches,
    collect_overdue_sync_exclusions,
    evaluate_patch_review,
    format_warning,
    main,
)

_NOW_MS = int(datetime(2026, 4, 17, tzinfo=UTC).timestamp() * 1000)


# ----------------------------------------------------------------------
# evaluate_patch_review
# ----------------------------------------------------------------------


def test_evaluate_flags_overdue_and_computes_days() -> None:
    result = evaluate_patch_review({"reviewAfter": "2026-04-10"}, _NOW_MS)
    assert result["overdue"] is True
    assert result["daysOverdue"] == 7
    assert result["invalid"] is False


def test_evaluate_future_not_overdue() -> None:
    result = evaluate_patch_review({"reviewAfter": "2026-10-17"}, _NOW_MS)
    assert result["overdue"] is False
    assert result["daysOverdue"] == 0
    assert result["invalid"] is False


def test_evaluate_today_inclusive_boundary() -> None:
    """today at UTC midnight — not yet overdue (inclusive)."""
    result = evaluate_patch_review({"reviewAfter": "2026-04-17"}, _NOW_MS)
    assert result["overdue"] is False


def test_evaluate_missing_reviewAfter_invalid() -> None:
    assert evaluate_patch_review({}, _NOW_MS)["invalid"] is True
    assert evaluate_patch_review({"reviewAfter": ""}, _NOW_MS)["invalid"] is True
    assert evaluate_patch_review(None, _NOW_MS)["invalid"] is True


def test_evaluate_non_parseable_reviewAfter_invalid() -> None:
    result = evaluate_patch_review({"reviewAfter": "not-a-date"}, _NOW_MS)
    assert result["invalid"] is True
    assert result["overdue"] is False


# ----------------------------------------------------------------------
# collect_overdue_patches
# ----------------------------------------------------------------------


_FIXTURE_REGISTRY: list[dict[str, Any]] = [
    {"id": "A-future", "reviewAfter": "2027-01-01"},
    {"id": "B-past", "reviewAfter": "2020-01-01"},
    {"id": "C-past", "reviewAfter": "2025-06-01"},
    {"id": "D-invalid", "reviewAfter": "whatever"},
]


def test_collect_overdue_patches_returns_only_overdue() -> None:
    overdue = collect_overdue_patches(_FIXTURE_REGISTRY, _NOW_MS)
    ids = sorted(e["id"] for e in overdue)
    assert ids == ["B-past", "C-past"]


def test_collect_overdue_patches_empty_when_all_future() -> None:
    early_ms = int(datetime(2020, 1, 1, tzinfo=UTC).timestamp() * 1000)
    assert collect_overdue_patches(_FIXTURE_REGISTRY, early_ms) == []


def test_live_en_source_patches_registry_not_overdue_today() -> None:
    """Live registry should remain not-overdue for the current session date."""
    from testim_parity.en_source_patches import EN_SOURCE_PATCHES

    overdue = collect_overdue_patches(EN_SOURCE_PATCHES, _NOW_MS)
    assert overdue == [], f"unexpected overdue entries: {[e['id'] for e in overdue]}"


# ----------------------------------------------------------------------
# format_warning
# ----------------------------------------------------------------------


def test_format_warning_en_source_patches_shape() -> None:
    line = format_warning({"id": "UD-XXX", "reviewAfter": "2020-01-01", "daysOverdue": 42})
    assert "UD-XXX" in line
    assert "2020-01-01" in line
    assert "daysOverdue=42" in line
    assert line.startswith("[en_source_patches]")


def test_format_warning_sync_exclusions_shape() -> None:
    line = format_warning({"slug": "some/slug", "reviewAfter": "2020-01-01", "daysOverdue": 42})
    assert "slug=some/slug" in line
    assert line.startswith("[source_sync_exclusions]")


def test_format_warning_prefers_id_over_slug() -> None:
    line = format_warning(
        {
            "id": "UD-Y",
            "slug": "should-not-appear",
            "reviewAfter": "2020-01-01",
            "daysOverdue": 1,
        }
    )
    assert line.startswith("[en_source_patches]")
    assert "patch=UD-Y" in line
    assert "should-not-appear" not in line


def test_format_warning_unknown_entry_label() -> None:
    line = format_warning({"reviewAfter": "2020-01-01", "daysOverdue": 7})
    assert line.startswith("[registry-review-cadence]")
    assert "entry=<unknown>" in line


# ----------------------------------------------------------------------
# collect_overdue_sync_exclusions
# ----------------------------------------------------------------------


_FIXTURE_EXCLUSIONS: dict[str, dict[str, Any]] = {
    "a/future": {"reviewAfter": "2099-01-01"},
    "b/past": {"reviewAfter": "2020-01-01"},
    "c/past": {"reviewAfter": "2025-06-01"},
    "d/invalid": {"reviewAfter": "whatever"},
}


def test_collect_overdue_sync_exclusions_returns_only_overdue() -> None:
    overdue = collect_overdue_sync_exclusions(_FIXTURE_EXCLUSIONS, _NOW_MS)
    slugs = sorted(e["slug"] for e in overdue)
    assert slugs == ["b/past", "c/past"]


def test_live_sync_exclusions_registry_not_overdue_today() -> None:
    from testim_parity.sync_exclusions import SOURCE_SYNC_EXCLUSIONS

    overdue = collect_overdue_sync_exclusions(SOURCE_SYNC_EXCLUSIONS, _NOW_MS)
    assert overdue == [], f"unexpected: {[e['slug'] for e in overdue]}"


# ----------------------------------------------------------------------
# main()
# ----------------------------------------------------------------------


def test_main_exits_0_with_no_overdue() -> None:
    stdout = io.StringIO()
    stderr = io.StringIO()
    result = main(
        patch_registry=[{"id": "ok", "reviewAfter": "2099-01-01"}],
        exclusions_registry={"ok/slug": {"reviewAfter": "2099-01-01"}},
        now_ms=_NOW_MS,
        stdout=stdout,
        stderr=stderr,
    )
    assert result["exitCode"] == 0
    assert result["overdueCount"] == 0
    assert stderr.getvalue() == ""
    out_lines = stdout.getvalue().strip().split("\n")
    assert len(out_lines) == 1
    assert "0 overdue" in out_lines[0]


def test_main_still_exits_0_when_overdue() -> None:
    stdout = io.StringIO()
    stderr = io.StringIO()
    result = main(
        patch_registry=[
            {"id": "overdue-patch", "reviewAfter": "2020-01-01"},
            {"id": "ok-1", "reviewAfter": "2099-01-01"},
        ],
        exclusions_registry={
            "overdue/exclusion": {"reviewAfter": "2020-01-01"},
            "ok/exclusion": {"reviewAfter": "2099-01-01"},
        },
        now_ms=_NOW_MS,
        stdout=stdout,
        stderr=stderr,
    )
    assert result["exitCode"] == 0
    assert result["overdueCount"] == 2
    err_lines = [line for line in stderr.getvalue().strip().split("\n") if line]
    assert len(err_lines) == 2
    assert any("overdue-patch" in line for line in err_lines)
    assert any("overdue/exclusion" in line for line in err_lines)
