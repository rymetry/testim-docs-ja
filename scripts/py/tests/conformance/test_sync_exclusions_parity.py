"""``sync_exclusions`` registry の mjs byte 一致 conformance。

registry content の dual-source-of-truth (mjs ``const`` と Python ``_REGISTRY``)
drift を検出するため、両 runtime から同じ dump を取って byte 比較する。
"""

from __future__ import annotations

import pytest

from testim_parity.sync_exclusions import (
    SOURCE_SYNC_EXCLUSIONS,
    get_exclusion,
    is_source_side_debt,
    list_source_side_debt_slugs,
)

from ._harness import run_batch

PROBE_SLUGS = [
    "testops/testops-version-control/pull-requests",
    "unknown/slug",
    "",
    None,  # type: ignore[list-item]
    42,  # type: ignore[list-item]
]


@pytest.fixture(scope="module")
def mjs_results(repo_root, node_available) -> dict:
    if not node_available:
        pytest.skip("node not available")
    calls: list = [
        {"function": "sync_exclusions_list_slugs", "args": []},
        {"function": "sync_exclusions_dump", "args": []},
    ]
    for slug in PROBE_SLUGS:
        calls.append({"function": "sync_exclusions_is_source_side_debt", "args": [slug]})
    for slug in PROBE_SLUGS:
        calls.append({"function": "sync_exclusions_get", "args": [slug]})
    results = run_batch(repo_root, calls)
    probe_count = len(PROBE_SLUGS)
    return {
        "list_slugs": results[0],
        "dump": results[1],
        "is_debt": results[2 : 2 + probe_count],
        "get": results[2 + probe_count : 2 + 2 * probe_count],
    }


def test_list_slugs_matches_mjs(mjs_results):
    assert list_source_side_debt_slugs() == mjs_results["list_slugs"]


def test_registry_dump_matches_mjs(mjs_results):
    """registry content の byte-level drift を検出する。"""
    py_dump = {slug: dict(entry) for slug, entry in SOURCE_SYNC_EXCLUSIONS.items()}
    assert py_dump == mjs_results["dump"]


def test_is_source_side_debt_matches_mjs(mjs_results):
    for slug, mjs in zip(PROBE_SLUGS, mjs_results["is_debt"], strict=True):
        assert is_source_side_debt(slug) == mjs


def test_get_exclusion_matches_mjs(mjs_results):
    for slug, mjs in zip(PROBE_SLUGS, mjs_results["get"], strict=True):
        assert get_exclusion(slug) == mjs
