"""``page_coverage`` check functions の mjs byte 一致 conformance。

page-level completeness check は issue list を emit する pure function。
mjs ``Set`` / ``Map`` iteration 順 = 挿入順、Python ``set`` は順序保持しない
ので、harness 側で入力を sort 済み配列で渡し、output も同じ順序になる契約。
"""

from __future__ import annotations

import pytest

from testim_parity.page_coverage import (
    check_local_page_orphan,
    check_missing_snapshot,
    check_page_coverage,
    check_single_page_snapshot,
    check_source_page_missing_local,
)

from ._harness import run_batch

# --- source-page-missing-local -----------------------------------------------

SOURCE_MISSING_SAMPLES = [
    # (sidebar_slugs, local_slugs)
    ([], []),
    (["a", "b"], ["a", "b"]),  # 完全一致 → 0 件
    (["a", "b", "c"], ["a"]),
    (["a"], ["a", "b", "c"]),  # local が多い — source-page-missing-local は 0
]


# --- local-page-orphan --------------------------------------------------------

ORPHAN_SAMPLES = [
    # (local_slugs, sidebar_slugs)
    ([], []),
    (["a", "b"], []),  # sidebar 空 → 0 件 fallback (mjs size === 0)
    (["a", "b", "c"], ["a", "c"]),
    (["a"], ["a", "b", "c"]),
]


# --- missing-snapshot ---------------------------------------------------------

MISSING_SNAPSHOT_SAMPLES = [
    # (local_source_urls, snapshot_slugs, freshness_state)
    ({}, [], "fresh"),
    ({"a": "https://x"}, ["a"], "fresh"),  # 存在 → 0 件
    ({"a": "https://x", "b": "https://y"}, ["a"], "fresh"),  # fresh → actionable
    ({"a": "https://x"}, [], "stale"),  # stale → signal
    ({"a": "https://x"}, [], None),  # null → signal
]


# --- single-page-snapshot -----------------------------------------------------

SINGLE_SAMPLES = [
    # (slug, source_url, snapshot_slugs, freshness_state)
    ("a", None, [], "fresh"),  # source_url 無し → 0 件
    ("a", "", [], "fresh"),  # 空 string も falsy
    ("a", "https://x", ["a"], "fresh"),  # 存在 → 0 件
    ("a", "https://x", [], "fresh"),  # fresh → actionable
    ("a", "https://x", [], "stale"),  # stale → signal
]


# --- page_coverage (all) ------------------------------------------------------

ALL_SAMPLES = [
    {
        "sidebarSlugs": ["a", "b"],
        "localSlugs": ["b", "c"],
        "localSourceUrls": {"c": "https://x"},
        "snapshotSlugs": [],
        "freshnessState": "fresh",
    },
    {
        "sidebarSlugs": [],
        "localSlugs": [],
        "localSourceUrls": {},
        "snapshotSlugs": [],
        "freshnessState": None,
    },
    {
        "sidebarSlugs": ["a", "b", "c"],
        "localSlugs": ["a", "b", "c"],
        "localSourceUrls": {"a": "url", "b": "url", "c": "url"},
        "snapshotSlugs": ["a", "b", "c"],
        "freshnessState": "fresh",
    },
    # combined: 同じ slug が orphan + missing-snapshot を同時に triggers (python-reviewer L2)
    {
        "sidebarSlugs": ["a"],
        "localSlugs": ["a", "orphan-slug"],
        "localSourceUrls": {"orphan-slug": "https://x"},
        "snapshotSlugs": [],
        "freshnessState": "fresh",
    },
]


@pytest.fixture(scope="module")
def mjs_results(repo_root, node_available) -> dict:
    if not node_available:
        pytest.skip("node not available")
    calls: list = []
    calls.extend(
        {"function": "page_coverage_source_missing_local", "args": [sidebar, local]}
        for sidebar, local in SOURCE_MISSING_SAMPLES
    )
    calls.extend(
        {"function": "page_coverage_local_orphan", "args": [local, sidebar]}
        for local, sidebar in ORPHAN_SAMPLES
    )
    calls.extend(
        {"function": "page_coverage_missing_snapshot", "args": [urls, snap, fresh]}
        for urls, snap, fresh in MISSING_SNAPSHOT_SAMPLES
    )
    calls.extend(
        {
            "function": "page_coverage_single_page",
            "args": [slug, source_url, snap, fresh],
        }
        for slug, source_url, snap, fresh in SINGLE_SAMPLES
    )
    calls.extend({"function": "page_coverage_all", "args": [opts]} for opts in ALL_SAMPLES)
    results = run_batch(repo_root, calls)
    a = len(SOURCE_MISSING_SAMPLES)
    b = a + len(ORPHAN_SAMPLES)
    c = b + len(MISSING_SNAPSHOT_SAMPLES)
    d = c + len(SINGLE_SAMPLES)
    e = d + len(ALL_SAMPLES)
    return {
        "source_missing": results[0:a],
        "orphan": results[a:b],
        "missing_snapshot": results[b:c],
        "single": results[c:d],
        "all": results[d:e],
    }


def test_source_page_missing_local_matches_mjs(mjs_results):
    for (sidebar, local), mjs in zip(
        SOURCE_MISSING_SAMPLES, mjs_results["source_missing"], strict=True
    ):
        py = check_source_page_missing_local(sidebar, local)
        assert py == mjs, f"diverge for sidebar={sidebar!r} local={local!r}"


def test_local_page_orphan_matches_mjs(mjs_results):
    for (local, sidebar), mjs in zip(ORPHAN_SAMPLES, mjs_results["orphan"], strict=True):
        py = check_local_page_orphan(local, sidebar)
        assert py == mjs, f"diverge for local={local!r} sidebar={sidebar!r}"


def test_missing_snapshot_matches_mjs(mjs_results):
    for (urls, snap, fresh), mjs in zip(
        MISSING_SNAPSHOT_SAMPLES, mjs_results["missing_snapshot"], strict=True
    ):
        py = check_missing_snapshot(urls, snap, fresh)
        assert py == mjs, f"diverge for urls={urls!r} snap={snap!r} fresh={fresh!r}"


def test_single_page_snapshot_matches_mjs(mjs_results):
    for (slug, source_url, snap, fresh), mjs in zip(
        SINGLE_SAMPLES, mjs_results["single"], strict=True
    ):
        py = check_single_page_snapshot(slug, source_url, snap, fresh)
        assert py == mjs, f"diverge for slug={slug!r} source_url={source_url!r}"


def test_check_page_coverage_matches_mjs(mjs_results):
    for opts, mjs in zip(ALL_SAMPLES, mjs_results["all"], strict=True):
        py = check_page_coverage(
            sidebar_slugs=opts["sidebarSlugs"],
            local_slugs=opts["localSlugs"],
            local_source_urls=opts["localSourceUrls"],
            snapshot_slugs=opts["snapshotSlugs"],
            freshness_state=opts["freshnessState"],
        )
        assert py == mjs, f"diverge for opts={opts!r}"
