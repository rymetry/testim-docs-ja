"""checks.py の unit test。

conformance test (test_checks_parity.py) が mjs との byte 一致を担当。
ここでは is_english_only_line の edge case / local_check の line-number 配線 /
compare_snapshot_structure の issue 発火条件を確認する。
"""

from __future__ import annotations

from testim_parity.checks import (
    compare_snapshot_structure,
    is_english_only_line,
    load_sidebar_slugs,
    local_check,
)

# --- is_english_only_line ---------------------------------------------------


def test_english_only_line_empty():
    assert is_english_only_line("") is False


def test_english_only_line_markdown_prefix_rejected():
    assert is_english_only_line("## Heading here") is False
    assert is_english_only_line("- bullet item here") is False


def test_english_only_line_cjk_rejected():
    assert is_english_only_line("Hover over the 設定") is False


def test_english_only_line_untranslated_pattern():
    # "Hover over the" は UNTRANSLATED_PATTERNS の先頭 pattern
    assert is_english_only_line("Hover over the menu to open") is True


def test_english_only_line_too_short():
    assert is_english_only_line("Click on the X") is False  # 15 文字未満 (prefix 後)


# --- load_sidebar_slugs -----------------------------------------------------


def test_load_sidebar_slugs_empty():
    assert load_sidebar_slugs("") == set()


def test_load_sidebar_slugs_extracts():
    sidebar = (
        "Some text\n"
        "- [Page A](https://docs.tricentis.com/testim/content/foo/bar.htm)\n"
        "- [Page B](https://docs.tricentis.com/testim/content/foo/baz.htm)\n"
    )
    slugs = load_sidebar_slugs(sidebar)
    assert "foo/bar" in slugs
    assert "foo/baz" in slugs


# --- local_check ------------------------------------------------------------


def test_local_check_detects_h1_in_body():
    doc = {"body": "## Intro\n\nBody\n\n# Title\n\nMore"}
    issues = local_check(doc)
    types = [i["type"] for i in issues]
    assert "h1-in-body" in types
    h1 = next(i for i in issues if i["type"] == "h1-in-body")
    assert h1["line"] == 5


def test_local_check_skips_code_fence():
    doc = {"body": "```\n# Fence title\n```\n# Real H1"}
    issues = local_check(doc)
    # H1 line は 4 (code fence 内は skip)
    h1 = next((i for i in issues if i["type"] == "h1-in-body"), None)
    assert h1 is not None
    assert h1["line"] == 4


def test_local_check_detects_jsx_callout():
    doc = {"body": "## Intro\n\n<Callout type='note'>body</Callout>"}
    issues = local_check(doc)
    assert any(i["type"] == "jsx-callout" for i in issues)


# --- compare_snapshot_structure --------------------------------------------


def test_compare_snapshot_section_count_mismatch():
    en = "## A\ntxt\n\n## B\ntxt"
    ja = "## A\ntxt"
    issues = compare_snapshot_structure(en, ja)
    assert any(i["type"] == "section-count-mismatch" for i in issues)


def test_compare_snapshot_clean():
    en = "## A\n\nparagraph content here\n"
    ja = "## A\n\nparagraph content here\n"
    issues = compare_snapshot_structure(en, ja)
    # 同一 body なので issue 無し (artifacts field も不要)
    assert issues == []


def test_compare_snapshot_table_shape_mismatch():
    en = "| a | b |\n| - | - |\n| 1 | 2 |"
    ja = "| a |\n| - |\n| 1 |"
    issues = compare_snapshot_structure(en, ja)
    assert any(i["type"] == "table-shape-mismatch" for i in issues)


def test_compare_snapshot_artifacts_propagate():
    en = "<details>hi</details>\n\n## Sec\npara"
    ja = "## Sec\npara"
    issues = compare_snapshot_structure(en, ja)
    # EN has <details> → artifacts field が全 issue に乗る
    if issues:
        for issue in issues:
            assert issue.get("artifacts") == ["EN uses <details> blocks"]
