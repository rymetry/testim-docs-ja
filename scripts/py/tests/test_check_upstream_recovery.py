"""``testim_parity.detection.check_upstream_recovery`` unit tests (Phase 5)。

mjs ``scripts/__tests__/check_upstream_recovery.test.mjs`` の behavioral 等価。
e2e parity は ``tests/conformance/test_check_upstream_recovery_e2e.py`` が扱う。
"""

from __future__ import annotations

import io
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pytest

from testim_parity.detection.check_upstream_recovery import (
    build_upstream_recovery_status,
    compute_en_patch_status,
    compute_sync_exclusion_status,
    days_since,
    days_until,
    is_review_overdue,
    run_check_upstream_recovery,
)
from testim_parity.en_source_patches import EN_SOURCE_PATCHES

_NOW_MS = int(datetime(2026, 5, 1, tzinfo=UTC).timestamp() * 1000)


# ----------------------------------------------------------------------
# days_since / days_until
# ----------------------------------------------------------------------


def test_days_since_positive_when_past() -> None:
    assert days_since("2026-04-01", _NOW_MS) == 30


def test_days_since_negative_when_future() -> None:
    assert days_since("2026-06-01", _NOW_MS) == -31


@pytest.mark.parametrize("invalid", [None, "", "not-a-date"])
def test_days_since_zero_for_missing_or_invalid(invalid: str | None) -> None:
    assert days_since(invalid, _NOW_MS) == 0


def test_days_until_mirrors_days_since_sign() -> None:
    assert days_until("2026-06-01", _NOW_MS) == 31
    assert days_until("2026-04-01", _NOW_MS) == -30


@pytest.mark.parametrize("invalid", [None, "not-a-date"])
def test_days_until_null_for_invalid(invalid: str | None) -> None:
    assert days_until(invalid, _NOW_MS) is None


# ----------------------------------------------------------------------
# is_review_overdue (same-day boundary)
# ----------------------------------------------------------------------


def test_is_review_overdue_midnight_inclusive() -> None:
    now_ms = int(datetime(2026, 4, 17, tzinfo=UTC).timestamp() * 1000)
    assert is_review_overdue("2026-04-17", now_ms) is False


def test_is_review_overdue_later_same_day_true() -> None:
    now_ms = int(datetime(2026, 4, 17, 12, 0, 0, tzinfo=UTC).timestamp() * 1000)
    assert is_review_overdue("2026-04-17", now_ms) is True


def test_is_review_overdue_day_after_true() -> None:
    now_ms = int(datetime(2026, 4, 18, tzinfo=UTC).timestamp() * 1000)
    assert is_review_overdue("2026-04-17", now_ms) is True


def test_is_review_overdue_future_false() -> None:
    assert is_review_overdue("2026-06-01", _NOW_MS) is False


@pytest.mark.parametrize("invalid", [None, "", "not-a-date"])
def test_is_review_overdue_fail_safe_for_invalid(invalid: str | None) -> None:
    assert is_review_overdue(invalid, _NOW_MS) is False


# ----------------------------------------------------------------------
# compute_en_patch_status — Axis A × Axis B
# ----------------------------------------------------------------------


_PATCH: dict[str, Any] = {
    "id": "TEST-PATCH",
    "slugs": ["fake/slug-a", "fake/slug-b"],
    "defectClass": "typo",
    "find": "<p>broken</p>",
    "replace": "<p>fixed</p>",
    "rationale": "test",
    "linkedDefect": "test",
    "addedAt": "2026-01-01",
    "reviewAfter": "2026-07-01",
}


def test_en_patch_status_stale_when_snapshot_present_but_no_hit(tmp_path: Path) -> None:
    (tmp_path / "fake-slug.html").write_text(
        "<html><p>already fixed upstream</p></html>", encoding="utf-8"
    )
    result = compute_en_patch_status(
        now_ms=_NOW_MS,
        snapshots_root=tmp_path,
        patches=[{**_PATCH, "slugs": ["fake-slug"]}],
    )
    # synthetic slug is readable but registry has no real patch for it → stale.
    assert result[0]["statusA"] == "stale"
    assert result[0]["hits"] == 0


def test_en_patch_status_preserves_crlf_find_strings(tmp_path: Path) -> None:
    patch = next(
        p
        for p in EN_SOURCE_PATCHES
        if p["id"] == "UD-016A-subscription-plans-host-localhost-cli-span"
    )
    snapshot = tmp_path / "administration" / "subscription-plans.html"
    snapshot.parent.mkdir(parents=True)
    snapshot.write_bytes(f"<html>{patch['find']}</html>".encode())
    result = compute_en_patch_status(now_ms=_NOW_MS, snapshots_root=tmp_path, patches=[patch])
    assert result[0]["statusA"] == "active"
    assert result[0]["hits"] == 1


def test_en_patch_status_unknown_when_no_snapshot(tmp_path: Path) -> None:
    result = compute_en_patch_status(
        now_ms=_NOW_MS,
        snapshots_root=tmp_path,
        patches=[{**_PATCH, "slugs": ["nonexistent/slug"]}],
    )
    assert result[0]["statusA"] == "unknown"


def test_en_patch_status_overdue_review(tmp_path: Path) -> None:
    (tmp_path / "fake-slug.html").write_text("<html><p>anything</p></html>", encoding="utf-8")
    overdue_patch = {**_PATCH, "slugs": ["fake-slug"], "reviewAfter": "2026-01-01"}
    result = compute_en_patch_status(
        now_ms=_NOW_MS, snapshots_root=tmp_path, patches=[overdue_patch]
    )
    assert result[0]["statusB"] == "overdue"
    assert result[0]["daysUntilReview"] < 0


# ----------------------------------------------------------------------
# compute_sync_exclusion_status — fetchStatus mapping
# ----------------------------------------------------------------------


_EXCLUSION: dict[str, dict[str, Any]] = {
    "test/slug": {
        "reason": "broken-upstream-source",
        "note": "",
        "expectedIssueType": "snapshot-incomplete",
        "expectedReason": "extractor-empty",
        "addedAt": "2026-01-01",
        "reviewAfter": "2026-07-01",
        "linkedIssue": 999,
    }
}


def test_sync_exclusion_status_excluded_broken_is_active() -> None:
    result = compute_sync_exclusion_status(
        now_ms=_NOW_MS,
        exclusions=_EXCLUSION,
        source_sync_status={"pages": [{"slug": "test/slug", "fetchStatus": "excluded-broken"}]},
    )
    assert result[0]["statusA"] == "active"
    assert result[0]["fetchStatus"] == "excluded-broken"


def test_sync_exclusion_status_excluded_recovered_is_stale() -> None:
    result = compute_sync_exclusion_status(
        now_ms=_NOW_MS,
        exclusions=_EXCLUSION,
        source_sync_status={"pages": [{"slug": "test/slug", "fetchStatus": "excluded-recovered"}]},
    )
    assert result[0]["statusA"] == "stale"


def test_sync_exclusion_status_missing_source_sync_unknown() -> None:
    result = compute_sync_exclusion_status(
        now_ms=_NOW_MS, exclusions=_EXCLUSION, source_sync_status=None
    )
    assert result[0]["statusA"] == "unknown"
    assert result[0]["fetchStatus"] == "unknown"


def test_sync_exclusion_status_missing_page_entry_unknown() -> None:
    result = compute_sync_exclusion_status(
        now_ms=_NOW_MS,
        exclusions=_EXCLUSION,
        source_sync_status={"pages": [{"slug": "other/slug", "fetchStatus": "excluded-broken"}]},
    )
    assert result[0]["statusA"] == "unknown"


def test_sync_exclusion_status_overdue_review() -> None:
    overdue = {"test/slug": {**_EXCLUSION["test/slug"], "reviewAfter": "2026-01-01"}}
    result = compute_sync_exclusion_status(
        now_ms=_NOW_MS,
        exclusions=overdue,
        source_sync_status={"pages": [{"slug": "test/slug", "fetchStatus": "excluded-broken"}]},
    )
    assert result[0]["statusB"] == "overdue"


# ----------------------------------------------------------------------
# run_check_upstream_recovery — I/O contract
# ----------------------------------------------------------------------


def test_run_writes_payload_and_logs_summary(tmp_path: Path) -> None:
    output_path = tmp_path / "upstream-recovery-status.json"
    stdout = io.StringIO()
    snap_root = tmp_path / "snap"
    snap_root.mkdir()

    payload = run_check_upstream_recovery(
        output_path=output_path,
        stdout=stdout,
        now_ms=_NOW_MS,
        snapshots_root=snap_root,
        patches=[
            {
                "id": "TEST",
                "slugs": ["absent/slug"],
                "defectClass": "typo",
                "find": "<p>x</p>",
                "replace": "<p>y</p>",
                "rationale": "",
                "linkedDefect": "",
                "addedAt": "2026-01-01",
                "reviewAfter": "2026-07-01",
            }
        ],
        exclusions={
            "test/slug": {
                "reason": "broken-upstream-source",
                "note": "",
                "expectedIssueType": "snapshot-incomplete",
                "expectedReason": "extractor-empty",
                "addedAt": "2026-01-01",
                "reviewAfter": "2026-07-01",
                "linkedIssue": 1,
            }
        },
        source_sync_status=None,
    )

    assert output_path.exists()
    raw = output_path.read_text(encoding="utf-8")
    assert raw.endswith("\n")
    written = json.loads(raw)
    assert written == payload
    assert written["schemaVersion"] == 1
    assert written["summary"]["totalEntries"] == 2

    log_out = stdout.getvalue()
    # Single summary line
    lines = [line for line in log_out.splitlines() if line]
    assert len(lines) == 1
    line = lines[0]
    assert "total=" in line
    assert "active=" in line
    assert "stale=" in line
    assert "overdue=" in line
    assert "unknown=" in line


# ----------------------------------------------------------------------
# build_upstream_recovery_status — aggregate shape
# ----------------------------------------------------------------------


def test_build_upstream_recovery_status_shape(tmp_path: Path) -> None:
    snap_root = tmp_path / "snap"
    snap_root.mkdir()

    payload = build_upstream_recovery_status(
        now_ms=_NOW_MS,
        snapshots_root=snap_root,
        patches=[
            {
                "id": "TEST",
                "slugs": ["absent/slug"],
                "defectClass": "typo",
                "find": "<p>broken</p>",
                "replace": "<p>fixed</p>",
                "rationale": "",
                "linkedDefect": "",
                "addedAt": "2026-01-01",
                "reviewAfter": "2026-07-01",
            }
        ],
        exclusions={
            "test/slug": {
                "reason": "broken-upstream-source",
                "note": "",
                "expectedIssueType": "snapshot-incomplete",
                "expectedReason": "extractor-empty",
                "addedAt": "2026-01-01",
                "reviewAfter": "2026-07-01",
                "linkedIssue": 1,
            }
        },
        source_sync_status=None,
    )

    assert payload["schemaVersion"] == 1
    assert payload["summary"]["totalEntries"] == 2
    # 1 unknown en_patch + 1 unknown exclusion
    assert payload["summary"]["unknownEntries"] == 2
    assert payload["summary"]["staleEntries"] == 0
    assert payload["summary"]["overdueEntries"] == 0
    assert isinstance(payload["mechanisms"]["en_source_patches"], list)
    assert isinstance(payload["mechanisms"]["source_sync_exclusions"], list)
    assert payload["generatedAt"].startswith("2026-")
