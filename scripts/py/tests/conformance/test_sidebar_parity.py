"""sidebar のクロスランタイム conformance テスト — SIDEBAR_URLS.md パース。"""

from __future__ import annotations

import pytest

from testim_parity.sidebar import (
    find_sidebar_section,
    parse_sidebar_sections,
)

from ._harness import run_batch

SAMPLE = """\
## Overview （概要）

- ✅ https://docs.tricentis.com/testim/content/overview/testim-overview.htm
- ⏳ https://docs.tricentis.com/testim/content/overview/whats-new.htm

## Results （結果）

- ✅🔍 https://docs.tricentis.com/testim/content/results/dashboard.htm
"""


def test_parse_sidebar_sections_matches(repo_root, node_available):
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "sidebar_parse_sections", "args": [SAMPLE]}]
    (mjs,) = run_batch(repo_root, calls)
    py = parse_sidebar_sections(SAMPLE)
    assert py == mjs


def test_find_sidebar_section_matches(repo_root, node_available):
    if not node_available:
        pytest.skip("node not available")
    py_sections = parse_sidebar_sections(SAMPLE)
    calls = [{"function": "sidebar_find_section", "args": [py_sections, "概要"]}]
    (mjs,) = run_batch(repo_root, calls)
    py = find_sidebar_section(py_sections, "概要")
    assert py == mjs


def test_get_section_slug_set_matches(repo_root, node_available):
    """実リポの SIDEBAR_URLS.md を使ってキーの一致を確認。"""
    if not node_available:
        pytest.skip("node not available")
    # Overview section が実リポに存在することを期待
    calls = [{"function": "sidebar_get_section_slug_set", "args": ["Overview"]}]
    (mjs,) = run_batch(repo_root, calls)
    # mjs 側は [...set].sort() を返すので Python も sort して比較
    from testim_parity.sidebar import get_section_slug_set

    if isinstance(mjs, dict) and "__domain_error" in mjs:
        pytest.fail(
            f"mjs reported domain error for Overview section (expected to exist): "
            f"{mjs['__domain_error']}"
        )
    if isinstance(mjs, dict) and "__error" in mjs:
        pytest.fail(f"mjs harness dispatch error: {mjs['__error']}")
    py = sorted(get_section_slug_set("Overview"))
    assert py == mjs
