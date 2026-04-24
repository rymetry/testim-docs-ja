"""``testim_parity.detection.snapshot_diff`` unit tests (Phase 5)。

mjs ``scripts/__tests__/snapshot_diff.test.mjs`` の behavioral 等価。
e2e parity は ``tests/conformance/test_snapshot_diff_e2e.py`` が扱う。
"""

from __future__ import annotations

import pytest

from testim_parity.detection.snapshot_diff import (
    CHANGE_CLASSIFIERS,
    MARKER_404_RE,
    build_sidebar_url_map,
    classify_changes,
    fallback_source_url,
    parse_args,
)

# ----------------------------------------------------------------------
# classify_line helper (via CHANGE_CLASSIFIERS)
# ----------------------------------------------------------------------


def _classify_line(line: str) -> str:
    for type_, pattern in CHANGE_CLASSIFIERS:
        if pattern.search(line):
            return type_
    return "content"


@pytest.mark.parametrize(
    "line",
    [
        "## New Section",
        "### Sub heading",
        "# Title",
        "   ## Indented heading",
        "<h2>HTML Section</h2>",
        "  </h3>",
    ],
)
def test_classify_line_heading(line: str) -> None:
    assert _classify_line(line) == "heading"


@pytest.mark.parametrize(
    "line",
    [
        "![test](test.png)",
        '<Image align="center" src="test.png" />',
        '<img src="test.png" alt="test">',
    ],
)
def test_classify_line_image(line: str) -> None:
    assert _classify_line(line) == "image"


@pytest.mark.parametrize(
    "line",
    [
        "```javascript",
        "```",
        "  ```python",
        "<pre>",
        "  </pre>",
        "<code>inline</code>",
        "</code>",
    ],
)
def test_classify_line_code(line: str) -> None:
    assert _classify_line(line) == "code"


@pytest.mark.parametrize(
    "line",
    [
        "> 📘 Note title",
        "> 👍 Success",
        "> ⚠️ Warning message",
        '<Callout icon="📘" theme="info">',
        '  <Callout icon="💡" theme="default">',
        '  <blockquote theme="📘">',
    ],
)
def test_classify_line_callout(line: str) -> None:
    assert _classify_line(line) == "callout"


@pytest.mark.parametrize(
    "line",
    [
        "Some text here",
        "[Link](/docs/foo)",
        "> quoted text without emoji",
        "    ## Too much indent (4 spaces)",
    ],
)
def test_classify_line_content(line: str) -> None:
    assert _classify_line(line) == "content"


# ----------------------------------------------------------------------
# classify_changes
# ----------------------------------------------------------------------


def test_classify_changes_detects_heading_added() -> None:
    head = "## Section 1\n\nText"
    current = "## Section 1\n\n## Section 2\n\nText"
    result = classify_changes(head, current)
    assert result["categories"]["heading"]["added"] == 1
    assert result["categories"]["heading"]["removed"] == 0


def test_classify_changes_detects_image_removed() -> None:
    head = "![old](old.png)\n\nText"
    current = "Text"
    result = classify_changes(head, current)
    assert result["categories"]["image"]["removed"] == 1
    assert result["categories"]["image"]["added"] == 0


def test_classify_changes_detects_html_structure() -> None:
    head = '<img src="old.png" alt="old">\n<h2>Section 1</h2>\nText'
    current = '<Image align="center" src="new.png" />\n<h2>Section 2</h2>\nText'
    result = classify_changes(head, current)
    assert (
        result["categories"]["image"]["added"] > 0 or result["categories"]["image"]["removed"] > 0
    )
    assert (
        result["categories"]["heading"]["added"] > 0
        or result["categories"]["heading"]["removed"] > 0
    )


def test_classify_changes_detects_code_block_changes() -> None:
    head = "```\nold code\n```"
    current = "```\nnew code\n```"
    result = classify_changes(head, current)
    assert (
        result["categories"]["code"]["added"] > 0
        or result["categories"]["code"]["removed"] > 0
        or result["categories"]["content"]["added"] > 0
    )


def test_classify_changes_counts_total_lines() -> None:
    head = "Line 1\nLine 2"
    current = "Line 1\nLine 3\nLine 4"
    result = classify_changes(head, current)
    # Line 2 removed, Lines 3 and 4 added → 3 diff lines.
    assert result["diffLines"] == 3


def test_classify_changes_zero_for_identical() -> None:
    content = "# Title\n\nSame"
    result = classify_changes(content, content)
    assert result["diffLines"] == 0
    assert result["categories"]["heading"]["added"] == 0
    assert result["categories"]["content"]["added"] == 0


def test_classify_changes_empty_strings() -> None:
    result = classify_changes("", "")
    assert result["diffLines"] == 0
    assert result["categories"]["heading"]["added"] == 0


def test_classify_changes_set_based_limitation_dups() -> None:
    """Documented set-based limitation — identical dup lines collapse."""
    head = "- Item\n- Item\n- Item"
    current = "- Item"
    result = classify_changes(head, current)
    assert result["diffLines"] == 0


def test_classify_changes_callout_change() -> None:
    head = "Text"
    current = "> 📘 Note\n>\n> Note content\n\nText"
    result = classify_changes(head, current)
    assert result["categories"]["callout"]["added"] == 1


def test_classify_changes_legacy_html_callout() -> None:
    head = "Text"
    current = '<blockquote theme="📘">\n<p>Note</p>\n</blockquote>\nText'
    result = classify_changes(head, current)
    assert result["categories"]["callout"]["added"] == 1


# ----------------------------------------------------------------------
# MARKER_404_RE
# ----------------------------------------------------------------------


def test_marker_404_re_detects() -> None:
    assert MARKER_404_RE.match(
        "<!-- 404: page not found at https://docs.tricentis.com/testim/content/overview/foo.htm -->"
    )


def test_marker_404_re_does_not_match_normal_content() -> None:
    assert not MARKER_404_RE.match("# Title\n\nSome content")


# ----------------------------------------------------------------------
# parse_args
# ----------------------------------------------------------------------


def test_parse_args_slug() -> None:
    args = parse_args(["--slug=testim-overview"])
    assert args["slug"] == "testim-overview"


def test_parse_args_null_slug_when_not_specified() -> None:
    args = parse_args(["--json"])
    assert args["slug"] is None


def test_parse_args_section_slug_json() -> None:
    args = parse_args(["--section=Overview", "--slug=testim-overview", "--json"])
    assert args["section"] == "Overview"
    assert args["slug"] == "testim-overview"
    assert args["json"] is True


# ----------------------------------------------------------------------
# build_sidebar_url_map / fallback_source_url
# ----------------------------------------------------------------------


_SIDEBAR_TEXT = (
    "## Overview（概要）\n"
    "- ✅🔍 https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm\n"
    "- ✅ https://docs.tricentis.com/testim/content/getting-started/getting-started.htm\n"
)


def test_build_sidebar_url_map_maps_slug_to_url() -> None:
    m = build_sidebar_url_map(_SIDEBAR_TEXT)
    assert (
        m.get("overview/testim-overview")
        == "https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm"
    )
    assert (
        m.get("getting-started/getting-started")
        == "https://docs.tricentis.com/testim/content/getting-started/getting-started.htm"
    )


def test_build_sidebar_url_map_empty_text() -> None:
    assert len(build_sidebar_url_map("")) == 0
    assert len(build_sidebar_url_map(None)) == 0


def test_fallback_source_url_finds_known_slug() -> None:
    m = build_sidebar_url_map(_SIDEBAR_TEXT)
    assert (
        fallback_source_url("overview/testim-overview", m)
        == "https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm"
    )


def test_fallback_source_url_unknown_slug_returns_none() -> None:
    m = build_sidebar_url_map(_SIDEBAR_TEXT)
    assert fallback_source_url("nonexistent-page", m) is None


def test_fallback_source_url_null_map_returns_none() -> None:
    assert fallback_source_url("overview/testim-overview", None) is None
