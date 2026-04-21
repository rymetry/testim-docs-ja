"""sync_health の mjs byte 一致 conformance。"""

from __future__ import annotations

import datetime

import pytest

from testim_parity.sync_health import (
    build_run_scope,
    build_source_sync_status,
    compute_freshness_state,
    fingerprint,
    validate_run_linkage,
)

from ._harness import run_batch

FINGERPRINT_SAMPLES = [
    [],
    ["a"],
    ["b", "a", "c"],
]


SCOPE_SAMPLES = [
    {},
    {"slug": "x"},
    {"section": "sec"},
    {"slug": "a", "section": "b"},
]


FRESHNESS_SAMPLES = [
    # (pages, sidebarVerified)
    ([], True),
    ([{"fetchStatus": "ok"}], False),
    ([{"fetchStatus": "ok"}, {"fetchStatus": "ok"}], True),
    ([{"fetchStatus": "ok"}, {"fetchStatus": "error"}], True),
    ([{"fetchStatus": "error"}, {"fetchStatus": "error"}], True),
    ([{"fetchStatus": "excluded-broken"}, {"fetchStatus": "excluded-recovered"}], True),
]


LINKED_SRC = {
    "sourceInventoryFingerprint": "sha256:abc",
    "runId": "run-1",
    "runScope": {"type": "full", "isComplete": True, "filters": {"slug": None, "section": None}},
}
LINKED_DIFF = {
    "sourceInventoryFingerprint": "sha256:abc",
    "sourceSyncRunId": "run-1",
    "runScope": {"type": "full", "isComplete": True, "filters": {"slug": None, "section": None}},
}
LINKED_PARITY = {"type": "full", "isComplete": True, "filters": {"slug": None, "section": None}}

LINKAGE_SAMPLES = [
    (LINKED_SRC, LINKED_DIFF, LINKED_PARITY),
    (None, LINKED_DIFF, LINKED_PARITY),
    ({"runId": "x"}, LINKED_DIFF, LINKED_PARITY),
    (LINKED_SRC, {**LINKED_DIFF, "sourceInventoryFingerprint": "sha256:other"}, LINKED_PARITY),
    (LINKED_SRC, {**LINKED_DIFF, "sourceSyncRunId": "different"}, LINKED_PARITY),
    (
        {
            **LINKED_SRC,
            "runScope": {
                "type": "slug",
                "isComplete": False,
                "filters": {"slug": "x", "section": None},
            },
        },
        LINKED_DIFF,
        LINKED_PARITY,
    ),
]


STATUS_SAMPLES = [
    {
        "pages": [
            {"slug": "a", "fetchStatus": "ok"},
            {"slug": "b", "fetchStatus": "error", "errorDetail": "boom"},
        ],
        "sidebarResult": {"ok": True, "sidebarSlugs": ["a", "b"]},
        "runScope": {
            "type": "full",
            "isComplete": True,
            "filters": {"slug": None, "section": None},
        },
        "now": "2026-04-21T12:00:00.000Z",
        "runSeed": "det-seed-1",
    },
    {
        "pages": [
            {
                "slug": "debt-slug",
                "fetchStatus": "excluded-broken",
                "debtCategory": "source-side-debt",
                "recoveryProbe": None,
            }
        ],
        "sidebarResult": {"ok": True, "sidebarSlugs": ["debt-slug"]},
        "runScope": {
            "type": "full",
            "isComplete": True,
            "filters": {"slug": None, "section": None},
        },
        "now": "2026-04-21T12:00:00.000Z",
        "runSeed": "det-seed-2",
    },
    {
        "pages": [],
        "sidebarResult": {"ok": False, "reason": "404"},
        "runScope": {
            "type": "full",
            "isComplete": True,
            "filters": {"slug": None, "section": None},
        },
        "now": "2026-04-21T12:00:00.000Z",
        "runSeed": "det-seed-3",
    },
]


def _iso_to_datetime(iso: str) -> datetime.datetime:
    # "2026-04-21T12:00:00.000Z" → aware datetime
    return datetime.datetime.strptime(iso, "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=datetime.UTC)


@pytest.fixture(scope="module")
def mjs_results(repo_root, node_available) -> dict:
    if not node_available:
        pytest.skip("node not available")
    calls: list = []
    calls.extend(
        {"function": "sync_health_fingerprint", "args": [items]} for items in FINGERPRINT_SAMPLES
    )
    calls.extend(
        {"function": "sync_health_build_run_scope", "args": [opts]} for opts in SCOPE_SAMPLES
    )
    calls.extend(
        {"function": "sync_health_compute_freshness", "args": [pages, verified]}
        for pages, verified in FRESHNESS_SAMPLES
    )
    calls.extend(
        {"function": "sync_health_validate_linkage", "args": list(args)} for args in LINKAGE_SAMPLES
    )
    calls.extend(
        {"function": "sync_health_build_status", "args": [opts]} for opts in STATUS_SAMPLES
    )
    calls.append({"function": "sync_health_schema_version", "args": []})
    results = run_batch(repo_root, calls, timeout=60.0)
    a = len(FINGERPRINT_SAMPLES)
    b = a + len(SCOPE_SAMPLES)
    c = b + len(FRESHNESS_SAMPLES)
    d = c + len(LINKAGE_SAMPLES)
    e = d + len(STATUS_SAMPLES)
    return {
        "fingerprint": results[0:a],
        "scope": results[a:b],
        "freshness": results[b:c],
        "linkage": results[c:d],
        "status": results[d:e],
        "schema_version": results[e],
    }


def test_schema_version_matches(mjs_results):
    assert mjs_results["schema_version"] == 2


def test_fingerprint_matches_mjs(mjs_results):
    for items, mjs in zip(FINGERPRINT_SAMPLES, mjs_results["fingerprint"], strict=True):
        assert fingerprint(items) == mjs


def test_run_scope_matches_mjs(mjs_results):
    for opts, mjs in zip(SCOPE_SAMPLES, mjs_results["scope"], strict=True):
        py = build_run_scope(**opts)
        assert py == mjs


def test_freshness_matches_mjs(mjs_results):
    for (pages, verified), mjs in zip(FRESHNESS_SAMPLES, mjs_results["freshness"], strict=True):
        assert compute_freshness_state(pages, verified) == mjs


def test_linkage_matches_mjs(mjs_results):
    for args, mjs in zip(LINKAGE_SAMPLES, mjs_results["linkage"], strict=True):
        assert validate_run_linkage(*args) == mjs


def test_build_status_matches_mjs(mjs_results):
    for opts, mjs in zip(STATUS_SAMPLES, mjs_results["status"], strict=True):
        py = build_source_sync_status(
            pages=opts["pages"],
            sidebar_result=opts["sidebarResult"],
            run_scope=opts["runScope"],
            now=_iso_to_datetime(opts["now"]),
            run_seed=opts["runSeed"],
        )
        assert py == mjs, f"diverge for opts={opts!r}:\n  py={py!r}\n  mjs={mjs!r}"
