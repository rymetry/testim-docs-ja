"""project のクロスランタイム conformance テスト。

純粋関数 (split_frontmatter, to_kebab, extract_source_content_path,
file_path_to_slug) とキャッシュベース関数 (basename map, resolve_to_full_slug)
の両方を照合する。
"""

from __future__ import annotations

import pytest

from testim_parity.project import (
    build_basename_to_path_map,
    extract_source_content_path,
    resolve_slug,
    resolve_to_full_slug,
    split_frontmatter,
    to_kebab,
)

from ._harness import run_batch

SOURCE_URLS = [
    "https://docs.tricentis.com/testim/content/overview/x.htm",
    "https://docs.tricentis.com/testim/content/overview/x/index.htm",
    "https://example.com",
    "",
]

SPLIT_FM_SAMPLES = [
    "---\ntitle: X\n---\n\nbody",
    "# Heading\nbody",
    "---\nonly\n",
]

KEBAB_SAMPLES = [
    "Hello World",
    "A & B",
    "---foo bar---",
    "ＡＢＣ",
]


def test_extract_source_content_path_matches(repo_root, node_available):
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "project_extract_source_content_path", "args": [u]} for u in SOURCE_URLS]
    mjs = run_batch(repo_root, calls)
    for url, m in zip(SOURCE_URLS, mjs, strict=True):
        assert extract_source_content_path(url) == m


def test_split_frontmatter_matches(repo_root, node_available):
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "project_split_frontmatter", "args": [s]} for s in SPLIT_FM_SAMPLES]
    mjs = run_batch(repo_root, calls)
    for sample, m in zip(SPLIT_FM_SAMPLES, mjs, strict=True):
        assert split_frontmatter(sample) == m


def test_to_kebab_matches(repo_root, node_available):
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "project_to_kebab", "args": [v]} for v in KEBAB_SAMPLES]
    mjs = run_batch(repo_root, calls)
    for value, m in zip(KEBAB_SAMPLES, mjs, strict=True):
        assert to_kebab(value) == m


def test_build_basename_to_path_map_matches(repo_root, node_available):
    """実リポの docs ツリーでキー集合が一致することを確認する。

    値が `None` と非 `None` の両方を持ちうるため、entry 単位で比較する。
    """
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "project_basename_to_path_map", "args": []}]
    (mjs,) = run_batch(repo_root, calls)
    py = build_basename_to_path_map()
    # 両方とも JS Object / Python dict として同一の key set を持つべき
    assert set(py.keys()) == set(mjs.keys())
    for key, py_val in py.items():
        mjs_val = mjs[key]
        # mjs 側は ambiguous を null として JSON 出力する
        if py_val is None:
            assert mjs_val is None, f"{key}: py=None mjs={mjs_val}"
        else:
            assert py_val == mjs_val, f"{key}: py={py_val} mjs={mjs_val}"


def test_resolve_to_full_slug_matches(repo_root, node_available):
    if not node_available:
        pytest.skip("node not available")
    # 実リポで basename-only で解決可能なはずのスラッグを 2 〜 3 件抽出
    bmap = build_basename_to_path_map()
    candidates = [bn for bn, v in bmap.items() if v is not None][:3]
    if not candidates:
        pytest.skip("no unique basenames in docs tree")
    calls = [{"function": "project_resolve_to_full_slug", "args": [bn]} for bn in candidates]
    mjs = run_batch(repo_root, calls)
    for bn, m in zip(candidates, mjs, strict=True):
        assert resolve_to_full_slug(bn) == m


def test_resolve_slug_path_match(repo_root, node_available):
    if not node_available:
        pytest.skip("node not available")
    bmap = build_basename_to_path_map()
    full_slugs = [v for v in bmap.values() if v is not None][:3]
    if not full_slugs:
        pytest.skip("no slugs in docs tree")
    calls = [{"function": "project_resolve_slug", "args": [slug]} for slug in full_slugs]
    mjs = run_batch(repo_root, calls)
    for slug, m in zip(full_slugs, mjs, strict=True):
        assert resolve_slug(slug) == m
