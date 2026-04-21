"""madcap_toc のクロスランタイム conformance テスト。

extract_slug / resolve_url / parse_amd_module は全て純粋関数。build_sections と
buildIndexLookup は tree 走査 + set 演算が中身のため、mjs 出力と Python 出力が
完全一致することを保証する。
"""

from __future__ import annotations

import pytest

from testim_parity.madcap_toc import (
    build_index_lookup,
    build_sections,
    build_sidebar_snapshot,
    extract_slug,
    extract_slugs_from_snapshot,
    parse_amd_module,
    resolve_url,
)

from ._harness import run_batch

EXTRACT_SLUG_SAMPLES = [
    "/content/overview/testim-overview.htm",
    "/content/overview/index.htm",
    "/content/Admin/Settings.htm",
    "https://docs.tricentis.com/testim/content/loops.htm",
    "not a url",
    "",
]

RESOLVE_URL_SAMPLES = [
    ("/Data/Tocs/Main.js", "https://docs.tricentis.com/testim"),
    ("Data/Tocs/Main.js", "https://docs.tricentis.com/testim"),
    ("foo/bar.js", "https://example.com"),
]

PARSE_AMD_SAMPLES = [
    "define({ a: 1, b: 2 });",
    "define({ x: 'hello', y: 'world' })",
    "define({ items: [{ i: 1, t: ['A'] }] })",
]


@pytest.fixture(scope="module")
def mjs_extract_slug(repo_root, node_available) -> list[str | None]:
    if not node_available:
        pytest.skip("node not available on PATH")
    calls = [{"function": "madcap_extract_slug", "args": [s]} for s in EXTRACT_SLUG_SAMPLES]
    return run_batch(repo_root, calls)


@pytest.fixture(scope="module")
def mjs_resolve_url(repo_root, node_available) -> list[str]:
    if not node_available:
        pytest.skip("node not available on PATH")
    calls = [
        {"function": "madcap_resolve_url", "args": [url, base]} for url, base in RESOLVE_URL_SAMPLES
    ]
    return run_batch(repo_root, calls)


@pytest.fixture(scope="module")
def mjs_parse_amd(repo_root, node_available) -> list[object]:
    if not node_available:
        pytest.skip("node not available on PATH")
    calls = [{"function": "madcap_parse_amd_module", "args": [s]} for s in PARSE_AMD_SAMPLES]
    return run_batch(repo_root, calls)


def test_extract_slug_matches(mjs_extract_slug):
    for sample, mjs in zip(EXTRACT_SLUG_SAMPLES, mjs_extract_slug, strict=True):
        assert extract_slug(sample) == mjs, f"diverge on {sample!r}"


def test_resolve_url_matches(mjs_resolve_url):
    for (url, base), mjs in zip(RESOLVE_URL_SAMPLES, mjs_resolve_url, strict=True):
        assert resolve_url(url, base) == mjs


def test_parse_amd_module_matches(mjs_parse_amd):
    for sample, mjs in zip(PARSE_AMD_SAMPLES, mjs_parse_amd, strict=True):
        assert parse_amd_module(sample) == mjs


def test_build_index_lookup_matches(repo_root, node_available):
    if not node_available:
        pytest.skip("node not available on PATH")
    chunks = [
        {"/a.htm": {"i": [1, 2], "t": ["A1", "A2"]}},
        {"/b.htm": {"i": [3], "t": ["B"]}},
    ]
    calls = [{"function": "madcap_build_index_lookup", "args": [chunks]}]
    (mjs_result,) = run_batch(repo_root, calls)
    py_result = build_index_lookup(chunks)
    # mjs 側は Object.fromEntries(Map) で key を string 化するため、Python 側も同じ変換をかける
    assert {str(k): v for k, v in py_result.items()} == mjs_result


def test_build_sections_matches(repo_root, node_available):
    if not node_available:
        pytest.skip("node not available on PATH")
    tree = {"n": [{"i": 1, "n": [{"i": 2}]}]}
    lookup_entries = [
        [1, {"url": "/content/cat.htm", "title": "Cat"}],
        [2, {"url": "/content/cat/one.htm", "title": "One"}],
    ]
    calls = [{"function": "madcap_build_sections", "args": [tree, lookup_entries]}]
    (mjs_result,) = run_batch(repo_root, calls)
    py_lookup = {entry[0]: entry[1] for entry in lookup_entries}
    py_result = build_sections(tree, py_lookup)
    assert py_result == mjs_result


def test_build_sidebar_snapshot_matches(repo_root, node_available):
    if not node_available:
        pytest.skip("node not available on PATH")
    sections = [
        {
            "title": "Cat",
            "url": "/content/cat.htm",
            "pages": [{"slug": "cat/one", "url": "cat/one.htm", "title": "One"}],
        }
    ]
    calls = [
        {
            "function": "madcap_build_sidebar_snapshot",
            "args": [sections, "https://example.com", "2026-01-01T00:00:00.000Z"],
        }
    ]
    (mjs_result,) = run_batch(repo_root, calls)
    py_result = build_sidebar_snapshot(
        sections, "https://example.com", fetched_at="2026-01-01T00:00:00.000Z"
    )
    assert py_result == mjs_result


def test_extract_slugs_from_snapshot_matches(repo_root, node_available):
    if not node_available:
        pytest.skip("node not available on PATH")
    snapshot = {
        "sections": [
            {"pages": [{"slug": "a/x"}, {"slug": "a/y"}]},
            {"pages": [{"slug": "b/z"}]},
        ]
    }
    calls = [{"function": "madcap_extract_slugs_from_snapshot", "args": [snapshot]}]
    (mjs_result,) = run_batch(repo_root, calls)
    py_result = sorted(extract_slugs_from_snapshot(snapshot))
    assert py_result == mjs_result
