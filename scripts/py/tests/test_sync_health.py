"""sync_health の unit test。

conformance test (test_sync_health_parity.py) が mjs との byte 一致を担当。
ここでは Python 側の freshness branching / linkage branching / isoformat
normalization を確認する。
"""

from __future__ import annotations

import datetime

import pytest

from testim_parity.sync_health import (
    SOURCE_SYNC_STATUS_SCHEMA_VERSION,
    build_run_scope,
    build_source_sync_status,
    compute_freshness_state,
    fingerprint,
    validate_run_linkage,
)


def test_schema_version_is_2():
    assert SOURCE_SYNC_STATUS_SCHEMA_VERSION == 2


def test_fingerprint_is_sorted_sha256():
    assert fingerprint(["b", "a"]) == fingerprint(["a", "b"])
    assert fingerprint(["a"]).startswith("sha256:")


def test_build_run_scope_slug_wins():
    scope = build_run_scope(slug="x", section="y")
    assert scope["type"] == "slug"
    assert scope["isComplete"] is False


def test_build_run_scope_full():
    scope = build_run_scope()
    assert scope["type"] == "full"
    assert scope["isComplete"] is True


def test_compute_freshness_broken_when_sidebar_fails():
    pages = [{"slug": "a", "fetchStatus": "ok"}]
    assert compute_freshness_state(pages, sidebar_verified=False) == "broken"


def test_compute_freshness_broken_when_empty_pages():
    assert compute_freshness_state([], sidebar_verified=True) == "broken"


def test_compute_freshness_fresh_when_all_ok():
    pages = [{"fetchStatus": "ok"}, {"fetchStatus": "ok"}]
    assert compute_freshness_state(pages, sidebar_verified=True) == "fresh"


def test_compute_freshness_partial_when_some_fail():
    pages = [{"fetchStatus": "ok"}, {"fetchStatus": "error"}]
    assert compute_freshness_state(pages, sidebar_verified=True) == "partial"


def test_compute_freshness_broken_when_all_non_excluded_fail():
    pages = [{"fetchStatus": "error"}, {"fetchStatus": "error"}]
    assert compute_freshness_state(pages, sidebar_verified=True) == "broken"


def test_compute_freshness_excluded_only_is_fresh():
    pages = [{"fetchStatus": "excluded-broken"}, {"fetchStatus": "excluded-recovered"}]
    assert compute_freshness_state(pages, sidebar_verified=True) == "fresh"


def _linked_sources():
    return (
        {
            "sourceInventoryFingerprint": "sha256:abc",
            "runId": "run-1",
            "runScope": {
                "type": "full",
                "isComplete": True,
                "filters": {"slug": None, "section": None},
            },
        },
        {
            "sourceInventoryFingerprint": "sha256:abc",
            "sourceSyncRunId": "run-1",
            "runScope": {
                "type": "full",
                "isComplete": True,
                "filters": {"slug": None, "section": None},
            },
        },
        {
            "type": "full",
            "isComplete": True,
            "filters": {"slug": None, "section": None},
        },
    )


def test_validate_linkage_linked():
    src, diff, parity = _linked_sources()
    assert validate_run_linkage(src, diff, parity) == "linked"


def test_validate_linkage_missing_when_source_incomplete():
    _, diff, parity = _linked_sources()
    assert validate_run_linkage(None, diff, parity) == "missing"
    assert validate_run_linkage({"runId": "x"}, diff, parity) == "missing"


def test_validate_linkage_stale_when_fingerprint_differs():
    src, diff, parity = _linked_sources()
    diff_modified = {**diff, "sourceInventoryFingerprint": "sha256:different"}
    assert validate_run_linkage(src, diff_modified, parity) == "stale"


def test_validate_linkage_run_mismatch():
    src, diff, parity = _linked_sources()
    diff_modified = {**diff, "sourceSyncRunId": "other-run"}
    assert validate_run_linkage(src, diff_modified, parity) == "run-mismatch"


def test_validate_linkage_scope_mismatch():
    src, diff, parity = _linked_sources()
    src_modified = {
        **src,
        "runScope": {
            "type": "slug",
            "isComplete": False,
            "filters": {"slug": "x", "section": None},
        },
    }
    assert validate_run_linkage(src_modified, diff, parity) == "scope-mismatch"


def test_build_status_has_schema_version_and_runid():
    pages = [{"slug": "a", "fetchStatus": "ok"}]
    sidebar = {"ok": True, "sidebarSlugs": ["a"]}
    scope = build_run_scope()
    now = datetime.datetime(2026, 4, 21, 12, 0, 0, tzinfo=datetime.UTC)
    status = build_source_sync_status(
        pages=pages,
        sidebar_result=sidebar,
        run_scope=scope,
        now=now,
        run_seed="test-seed",
    )
    assert status["schemaVersion"] == 2
    assert status["checkedAt"] == "2026-04-21T12:00:00.000Z"
    assert status["freshnessState"] == "fresh"
    assert status["summary"]["fetchedPages"] == 1


def test_build_status_surfaces_debt_metadata():
    pages = [
        {
            "slug": "debt-slug",
            "fetchStatus": "excluded-broken",
            "debtCategory": "source-side-debt",
            "recoveryProbe": None,
        }
    ]
    sidebar = {"ok": True, "sidebarSlugs": ["debt-slug"]}
    status = build_source_sync_status(
        pages=pages,
        sidebar_result=sidebar,
        run_scope=build_run_scope(),
        now=datetime.datetime(2026, 4, 21, tzinfo=datetime.UTC),
        run_seed="s",
    )
    entry = status["pages"][0]
    assert entry["debtCategory"] == "source-side-debt"
    assert entry["recoveryProbe"] is None  # 明示的な None で "probed clean" を表現


def test_build_status_emits_sidebar_failure_error():
    pages = [{"slug": "a", "fetchStatus": "ok"}]
    sidebar = {"ok": False, "reason": "404"}
    status = build_source_sync_status(
        pages=pages,
        sidebar_result=sidebar,
        run_scope=build_run_scope(),
        now=datetime.datetime(2026, 4, 21, tzinfo=datetime.UTC),
        run_seed="s",
    )
    assert any(e["slug"] == "_sidebar" for e in status["errors"])
    assert status["freshnessState"] == "broken"


@pytest.mark.parametrize("naive", [True, False])
def test_build_status_normalizes_timezones(naive):
    """naive datetime は UTC 扱い、aware は UTC に変換される。"""
    if naive:
        now = datetime.datetime(2026, 4, 21, 12, 0, 0)
    else:
        now = datetime.datetime(
            2026, 4, 21, 21, 0, 0, tzinfo=datetime.timezone(datetime.timedelta(hours=9))
        )
    status = build_source_sync_status(
        pages=[],
        sidebar_result={"ok": True, "sectionCount": 0, "pageCount": 0},
        run_scope=build_run_scope(),
        now=now,
        run_seed="s",
    )
    assert status["checkedAt"] == "2026-04-21T12:00:00.000Z"
