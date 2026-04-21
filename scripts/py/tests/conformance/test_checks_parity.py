"""checks.py の mjs byte 一致 conformance。

``local_check`` / ``compare_snapshot_structure`` を代表 fixture で網羅し、
``is_english_only_line`` / ``load_sidebar_slugs`` も同じ batch で検証する。
"""

from __future__ import annotations

import pytest

from testim_parity.checks import (
    compare_snapshot_structure,
    is_english_only_line,
    load_sidebar_slugs,
    local_check,
)

from ._harness import run_batch

ENGLISH_ONLY_SAMPLES = [
    "",
    "   ",
    "## Some heading",
    "- bullet item",
    "Hover over the main menu to see options",
    "Click on the export button to download",
    "日本語 + English mix",
    "plain English sentence here",
]


SIDEBAR_SAMPLES = [
    "",
    "- [Page](https://docs.tricentis.com/testim/content/foo/bar.htm)\n",
    (
        "- [A](https://docs.tricentis.com/testim/content/foo/bar.htm)\n"
        "- [B](https://docs.tricentis.com/testim/content/foo/baz.htm)\n"
    ),
]


LOCAL_CHECK_SAMPLES = [
    {"body": ""},
    {"body": "## Intro\n\npara\n"},
    {"body": "## Intro\n\nBody\n\n# Second H1\n"},
    {"body": "<Callout type='note'>body</Callout>\n"},
    {"body": "## Intro\n\n> 📘 classic callout text\n"},
    {"body": "## Intro\n\nHover over the main menu item to open\n"},
]


COMPARE_SAMPLES = [
    # (en_body, ja_body)
    ("", ""),
    ("## A\npara\n\n## B\npara\n", "## A\npara\n\n## B\npara\n"),
    ("## A\npara\n\n## B\npara\n", "## A\npara\n"),
    ("| a | b |\n| - | - |\n| 1 | 2 |\n", "| a |\n| - |\n| 1 |\n"),
    ("<details>hi</details>\n\n## S\npara\n", "## S\npara\n"),
    # python-reviewer MEDIUM: table cell token mismatch (同じ shape、cell content 差)
    (
        "| header |\n| - |\n| uses `config.js` |\n",
        "| header |\n| - |\n| uses `other.js` |\n",
    ),
    # python-reviewer MEDIUM: table cell english residual (JA 側に英文残留)
    (
        "| header |\n| - |\n| Testim scenario description here |\n",
        "| header |\n| - |\n| Testim scenario description here |\n",
    ),
]


@pytest.fixture(scope="module")
def mjs_results(repo_root, node_available) -> dict:
    if not node_available:
        pytest.skip("node not available")
    calls: list = []
    calls.extend(
        {"function": "checks_is_english_only_line", "args": [s]} for s in ENGLISH_ONLY_SAMPLES
    )
    calls.extend({"function": "checks_load_sidebar_slugs", "args": [s]} for s in SIDEBAR_SAMPLES)
    calls.extend({"function": "checks_local", "args": [s]} for s in LOCAL_CHECK_SAMPLES)
    calls.extend(
        {"function": "checks_compare_snapshot_structure", "args": [en, ja]}
        for en, ja in COMPARE_SAMPLES
    )
    results = run_batch(repo_root, calls, timeout=120.0)
    a = len(ENGLISH_ONLY_SAMPLES)
    b = a + len(SIDEBAR_SAMPLES)
    c = b + len(LOCAL_CHECK_SAMPLES)
    return {
        "english_only": results[0:a],
        "sidebar": results[a:b],
        "local": results[b:c],
        "compare": results[c:],
    }


def test_is_english_only_matches(mjs_results):
    for sample, mjs in zip(ENGLISH_ONLY_SAMPLES, mjs_results["english_only"], strict=True):
        assert is_english_only_line(sample) == mjs


def test_load_sidebar_slugs_matches(mjs_results):
    for sample, mjs in zip(SIDEBAR_SAMPLES, mjs_results["sidebar"], strict=True):
        assert sorted(load_sidebar_slugs(sample)) == mjs


def test_local_check_matches(mjs_results):
    for sample, mjs in zip(LOCAL_CHECK_SAMPLES, mjs_results["local"], strict=True):
        assert local_check(sample) == mjs


def test_compare_snapshot_structure_matches(mjs_results):
    for (en, ja), mjs in zip(COMPARE_SAMPLES, mjs_results["compare"], strict=True):
        assert compare_snapshot_structure(en, ja) == mjs
