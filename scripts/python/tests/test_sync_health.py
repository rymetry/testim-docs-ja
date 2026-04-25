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


# ---------------------------------------------------------------------------
# fingerprint — sort invariance + hex shape + distinguishability
# ---------------------------------------------------------------------------


def test_fingerprint_matches_sha256_hex_shape():
    """mjs と同じく ``sha256:<64-hex>`` prefix + hex digest。"""
    result = fingerprint(["a", "b", "c"])
    assert result.startswith("sha256:")
    assert len(result) == len("sha256:") + 64
    # hex digest
    assert all(c in "0123456789abcdef" for c in result[len("sha256:") :])


def test_fingerprint_empty_array_is_stable():
    """空 array でも deterministic な sha256 を返す (mjs 等価)。"""
    result = fingerprint([])
    assert result.startswith("sha256:")
    assert fingerprint([]) == result


def test_fingerprint_distinguishes_different_inputs():
    assert fingerprint(["a"]) != fingerprint(["b"])


# ---------------------------------------------------------------------------
# computeFreshnessState — partial-only / not-found / mixed with excluded
# ---------------------------------------------------------------------------


def test_compute_freshness_partial_when_some_not_found():
    pages = [{"fetchStatus": "ok"}, {"fetchStatus": "not-found"}]
    assert compute_freshness_state(pages, sidebar_verified=True) == "partial"


def test_compute_freshness_ignores_excluded_broken_in_fresh():
    pages = [{"fetchStatus": "ok"}, {"fetchStatus": "excluded-broken"}]
    assert compute_freshness_state(pages, sidebar_verified=True) == "fresh"


def test_compute_freshness_ignores_excluded_recovered_in_fresh():
    pages = [{"fetchStatus": "ok"}, {"fetchStatus": "excluded-recovered"}]
    assert compute_freshness_state(pages, sidebar_verified=True) == "fresh"


def test_compute_freshness_partial_with_excluded_noise():
    pages = [
        {"fetchStatus": "ok"},
        {"fetchStatus": "error"},
        {"fetchStatus": "excluded-broken"},
    ]
    assert compute_freshness_state(pages, sidebar_verified=True) == "partial"


def test_compute_freshness_broken_when_sidebar_fails_with_excluded_only():
    """sidebar 失敗は excluded でも最優先で broken。"""
    pages = [{"fetchStatus": "excluded-broken"}]
    assert compute_freshness_state(pages, sidebar_verified=False) == "broken"


# ---------------------------------------------------------------------------
# build_source_sync_status — runId shape, summary counters, pages emit
# ---------------------------------------------------------------------------


def _sidebar_ok():
    return {"ok": True, "sectionCount": 5, "pageCount": 100}


def _full_scope():
    return build_run_scope()


def test_build_status_runid_has_iso_hash_shape():
    """``runId`` = ``{checkedAt}#{8-hex}`` (mjs 等価 shape)。"""
    status = build_source_sync_status(
        pages=[{"slug": "a", "fetchStatus": "ok"}],
        sidebar_result=_sidebar_ok(),
        run_scope=_full_scope(),
        now=datetime.datetime(2026, 4, 6, 3, 0, 0, tzinfo=datetime.UTC),
        run_seed="test-seed",
    )
    import re

    assert re.match(r"^\d{4}-\d{2}-\d{2}T.+#[0-9a-f]{8}$", status["runId"]) is not None


def test_build_status_runid_deterministic_with_same_seed():
    """``run_seed`` が同じなら runId も同じ (conformance test の前提)。"""
    kwargs = dict(
        pages=[{"slug": "a", "fetchStatus": "ok"}],
        sidebar_result=_sidebar_ok(),
        run_scope=_full_scope(),
        now=datetime.datetime(2026, 4, 6, 3, 0, 0, tzinfo=datetime.UTC),
        run_seed="test-seed",
    )
    r1 = build_source_sync_status(**kwargs)
    r2 = build_source_sync_status(**kwargs)
    assert r1["runId"] == r2["runId"]


def test_build_status_summary_counts_fetched_and_errors():
    """fetchedPages / errorPages / notFoundPages が正しく cog される。"""
    pages = [
        {"slug": "a", "fetchStatus": "ok"},
        {"slug": "b", "fetchStatus": "error", "errorDetail": "HTTP 500"},
        {"slug": "c", "fetchStatus": "not-found"},
    ]
    status = build_source_sync_status(
        pages=pages,
        sidebar_result=_sidebar_ok(),
        run_scope=_full_scope(),
        now=datetime.datetime(2026, 4, 6, tzinfo=datetime.UTC),
        run_seed="s",
    )
    assert status["summary"]["targetPages"] == 3
    assert status["summary"]["fetchedPages"] == 1
    assert status["summary"]["errorPages"] == 1
    assert status["summary"]["notFoundPages"] == 1
    assert status["freshnessState"] == "partial"
    assert any(e["slug"] == "b" and e["detail"] == "HTTP 500" for e in status["errors"])


def test_build_status_excluded_counters_match_pages():
    """``excludedBroken`` / ``excludedRecovered`` / ``excludedPages`` の数値整合。"""
    pages = [
        {
            "slug": "x",
            "fetchStatus": "excluded-broken",
            "debtCategory": "source-side-debt",
            "recoveryProbe": None,
        },
        {
            "slug": "y",
            "fetchStatus": "excluded-recovered",
            "debtCategory": "source-side-debt",
            "recoveryProbe": None,
        },
    ]
    status = build_source_sync_status(
        pages=pages,
        sidebar_result=_sidebar_ok(),
        run_scope=_full_scope(),
        now=datetime.datetime(2026, 4, 6, tzinfo=datetime.UTC),
        run_seed="s",
    )
    assert status["summary"]["excludedPages"] == 2
    assert status["summary"]["excludedBrokenPages"] == 1
    assert status["summary"]["excludedRecoveredPages"] == 1
    # debt はルート errors に出ない
    assert status["errors"] == []


def test_build_status_default_excluded_counters_zero():
    pages = [{"slug": "a", "fetchStatus": "ok"}]
    status = build_source_sync_status(
        pages=pages,
        sidebar_result=_sidebar_ok(),
        run_scope=_full_scope(),
        now=datetime.datetime(2026, 4, 6, tzinfo=datetime.UTC),
        run_seed="s",
    )
    assert status["summary"]["excludedPages"] == 0
    assert status["summary"]["excludedBrokenPages"] == 0
    assert status["summary"]["excludedRecoveredPages"] == 0


def test_build_status_pages_omit_snapshotFingerprint_when_absent():
    """``snapshotFingerprint`` 欠落時は page entry に key を出さない (mjs と同じ)。"""
    pages = [{"slug": "a", "fetchStatus": "ok"}]
    status = build_source_sync_status(
        pages=pages,
        sidebar_result=_sidebar_ok(),
        run_scope=_full_scope(),
        now=datetime.datetime(2026, 4, 6, tzinfo=datetime.UTC),
        run_seed="s",
    )
    assert "snapshotFingerprint" not in status["pages"][0]


def test_build_status_pages_keep_snapshotFingerprint_when_provided():
    pages = [{"slug": "a", "fetchStatus": "ok", "snapshotFingerprint": "sha256:abc123"}]
    status = build_source_sync_status(
        pages=pages,
        sidebar_result=_sidebar_ok(),
        run_scope=_full_scope(),
        now=datetime.datetime(2026, 4, 6, tzinfo=datetime.UTC),
        run_seed="s",
    )
    assert status["pages"][0]["snapshotFingerprint"] == "sha256:abc123"


def test_build_status_sidebar_fingerprint_reorder_invariant():
    pages = [{"slug": "a", "fetchStatus": "ok"}]
    r1 = build_source_sync_status(
        pages=pages,
        sidebar_result={"ok": True, "sectionCount": 2, "pageCount": 3, "sidebarSlugs": ["x", "y"]},
        run_scope=_full_scope(),
        now=datetime.datetime(2026, 4, 6, tzinfo=datetime.UTC),
        run_seed="s",
    )
    r2 = build_source_sync_status(
        pages=pages,
        sidebar_result={"ok": True, "sectionCount": 2, "pageCount": 3, "sidebarSlugs": ["y", "x"]},
        run_scope=_full_scope(),
        now=datetime.datetime(2026, 4, 6, tzinfo=datetime.UTC),
        run_seed="s",
    )
    assert r1["sidebarFingerprint"] == r2["sidebarFingerprint"]


def test_build_status_sidebar_fingerprint_detects_reorder_with_same_counts():
    pages = [{"slug": "a", "fetchStatus": "ok"}]
    r1 = build_source_sync_status(
        pages=pages,
        sidebar_result={
            "ok": True,
            "sectionCount": 2,
            "pageCount": 3,
            "sidebarSlugs": ["a", "b", "c"],
        },
        run_scope=_full_scope(),
        now=datetime.datetime(2026, 4, 6, tzinfo=datetime.UTC),
        run_seed="s",
    )
    r2 = build_source_sync_status(
        pages=pages,
        sidebar_result={
            "ok": True,
            "sectionCount": 2,
            "pageCount": 3,
            "sidebarSlugs": ["a", "b", "d"],
        },
        run_scope=_full_scope(),
        now=datetime.datetime(2026, 4, 6, tzinfo=datetime.UTC),
        run_seed="s",
    )
    assert r1["sidebarFingerprint"] != r2["sidebarFingerprint"]


# ---------------------------------------------------------------------------
# validate_run_linkage — scope matrix
# ---------------------------------------------------------------------------


_FP_A = "sha256:" + "a" * 64
_FP_B = "sha256:" + "b" * 64
_RUN_A = "2026-04-07T00:00:00Z#run-a"
_RUN_B = "2026-04-07T00:05:00Z#run-b"


def _scope(slug=None, section=None):
    return build_run_scope(slug=slug, section=section)


def test_validate_linkage_missing_when_snapshot_diff_null():
    src = {"runId": _RUN_A, "sourceInventoryFingerprint": _FP_A, "runScope": _scope()}
    assert validate_run_linkage(src, None, _scope()) == "missing"


def test_validate_linkage_missing_when_snapshot_diff_has_no_fingerprint():
    src = {"runId": _RUN_A, "sourceInventoryFingerprint": _FP_A, "runScope": _scope()}
    assert validate_run_linkage(src, {"runScope": _scope()}, _scope()) == "missing"


def test_validate_linkage_run_mismatch_detected():
    src = {"runId": _RUN_A, "sourceInventoryFingerprint": _FP_A, "runScope": _scope()}
    diff = {
        "sourceSyncRunId": _RUN_B,
        "sourceInventoryFingerprint": _FP_A,
        "runScope": _scope(),
    }
    assert validate_run_linkage(src, diff, _scope()) == "run-mismatch"


def test_validate_linkage_stale_when_inventory_fingerprints_differ():
    src = {"runId": _RUN_A, "sourceInventoryFingerprint": _FP_A, "runScope": _scope()}
    diff = {
        "sourceSyncRunId": _RUN_A,
        "sourceInventoryFingerprint": _FP_B,
        "runScope": _scope(),
    }
    assert validate_run_linkage(src, diff, _scope()) == "stale"


def test_validate_linkage_scope_mismatch_full_vs_slug():
    full = _scope()
    slug = _scope(slug="overview/x")
    src = {"runId": _RUN_A, "sourceInventoryFingerprint": _FP_A, "runScope": full}
    diff = {"sourceSyncRunId": _RUN_A, "sourceInventoryFingerprint": _FP_A, "runScope": slug}
    assert validate_run_linkage(src, diff, full) == "scope-mismatch"


def test_validate_linkage_linked_on_matching_slug_scope():
    slug = _scope(slug="overview/x")
    src = {"runId": _RUN_A, "sourceInventoryFingerprint": _FP_A, "runScope": slug}
    diff = {"sourceSyncRunId": _RUN_A, "sourceInventoryFingerprint": _FP_A, "runScope": slug}
    assert validate_run_linkage(src, diff, slug) == "linked"


def test_validate_linkage_scope_mismatch_different_partials():
    """slug scope vs section scope は run-to-run で別物 → scope-mismatch。"""
    slug = _scope(slug="overview/x")
    section = _scope(section="Overview")
    src = {"runId": _RUN_A, "sourceInventoryFingerprint": _FP_A, "runScope": slug}
    diff = {"sourceSyncRunId": _RUN_A, "sourceInventoryFingerprint": _FP_A, "runScope": slug}
    assert validate_run_linkage(src, diff, section) == "scope-mismatch"
