"""checks.py の unit test。

conformance test (test_checks_parity.py) が mjs との byte 一致を担当。
ここでは is_english_only_line の edge case / local_check の line-number 配線 /
compare_snapshot_structure の issue 発火条件を確認する。
"""

from __future__ import annotations

from testim_parity.checks import (
    compare_snapshot_structure,
    image_parity_issues,
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


# --- image_parity_issues (EN 基準の画像枚数 / 重複 / 順序) -------------------


def test_image_parity_clean_identical():
    en_html = '<img src="images/aaa1111-foo.png" /><img src="images/bbb2222-bar.png" />'
    ja = "![foo](/images/x/aaa1111-foo.png)\n\n![bar](/images/x/bbb2222-bar.png)"
    assert image_parity_issues(en_html, ja) == []


def test_image_parity_en_side_duplicate_mirrored_ok():
    # EN が同一画像を 2 回使い、JA も 2 回 → EN 基準で一致 = 検知しない
    en_html = (
        '<img src="images/aaa1111-foo.png" />'
        '<img src="images/bbb2222-bar.png" />'
        '<img src="images/aaa1111-foo.png" />'
    )
    ja = (
        "![foo](/images/x/aaa1111-foo.png)\n\n"
        "![bar](/images/x/bbb2222-bar.png)\n\n"
        "![foo again](/images/x/aaa1111-foo.png)"
    )
    assert image_parity_issues(en_html, ja) == []


def test_image_parity_ja_extra_duplicate_flagged():
    # EN は foo を 1 回だが JA が 2 回 → image-mismatch (JA 余剰)
    en_html = '<img src="images/aaa1111-foo.png" /><img src="images/bbb2222-bar.png" />'
    ja = (
        "![foo](/images/x/aaa1111-foo.png)\n\n"
        "![bar](/images/x/bbb2222-bar.png)\n\n"
        "![foo dup](/images/x/aaa1111-foo.png)"
    )
    issues = image_parity_issues(en_html, ja)
    assert [i["type"] for i in issues] == ["image-mismatch"]
    assert issues[0]["severity"] == "actionable"
    assert "aaa1111-foo" in issues[0]["detail"]


def test_image_parity_ja_missing_image_flagged():
    # EN に bar があるが JA に無い → image-mismatch (JA 不足)
    en_html = '<img src="images/aaa1111-foo.png" /><img src="images/bbb2222-bar.png" />'
    ja = "![foo](/images/x/aaa1111-foo.png)"
    issues = image_parity_issues(en_html, ja)
    assert [i["type"] for i in issues] == ["image-mismatch"]
    assert "bbb2222-bar" in issues[0]["detail"]


def test_image_parity_reorder_flagged_as_order():
    # 同一 multiset・順序のみ EN と相違 → image-order-mismatch
    en_html = '<img src="images/aaa1111-foo.png" /><img src="images/bbb2222-bar.png" />'
    ja = "![bar](/images/x/bbb2222-bar.png)\n\n![foo](/images/x/aaa1111-foo.png)"
    issues = image_parity_issues(en_html, ja)
    assert [i["type"] for i in issues] == ["image-order-mismatch"]


def test_image_parity_case_and_hash_length_tolerant():
    # 大文字小文字差 + ハッシュ長差 (7桁 vs フル SHA) は同一画像として扱う
    en_html = '<img src="images/abc1234-Pic_One.png" />'
    ja = "![pic](/images/x/abc1234ef567890-pic_one.png)"
    assert image_parity_issues(en_html, ja) == []


def test_image_parity_en_href_image_counted():
    # EN が <a href> で画像を持つ (cloudinary 等) ケースも EN 側として数える
    en_html = '<a href="https://res.cloudinary.com/x/abc1234-diagram.png">図</a>'
    ja = "![diagram](/images/x/abc1234-diagram.png)"
    assert image_parity_issues(en_html, ja) == []


def test_image_parity_ja_code_fence_ignored():
    # JA のコードフェンス内 ![](...) は画像として数えない (誤検知防止)
    en_html = '<img src="images/aaa1111-foo.png" />'
    ja = "![foo](/images/x/aaa1111-foo.png)\n\n```\n![sample](example.png)\n```"
    assert image_parity_issues(en_html, ja) == []


def test_image_parity_ja_html_img_tag_counted():
    # JA が <img> タグで画像参照しても EN と一致すれば検知しない
    en_html = '<img src="images/aaa1111-foo.png" />'
    ja = '<img src="/images/x/aaa1111-foo.png" alt="foo" />'
    assert image_parity_issues(en_html, ja) == []


def test_image_parity_ja_astro_image_tag_counted():
    # JA が Astro <Image> コンポーネントで画像参照しても EN と一致すれば検知しない
    en_html = '<img src="images/aaa1111-foo.png" />'
    ja = '<Image src="/images/x/aaa1111-foo.png" alt="foo" />'
    assert image_parity_issues(en_html, ja) == []


def test_compare_snapshot_no_longer_emits_image_order():
    # 画像順 / 枚数の検出は image_parity_issues (EN 生 HTML 基準) に統合済み。
    # compare_snapshot_structure は image-order-mismatch を emit しない。
    en = "![a](/img/aaa1111-a.png)\n\n![b](/img/bbb2222-b.png)"
    ja = "![b](/img/bbb2222-b.png)\n\n![a](/img/aaa1111-a.png)"
    issues = compare_snapshot_structure(en, ja)
    assert all(issue["type"] != "image-order-mismatch" for issue in issues)
