"""``html_structure.compare_html_structure`` の issue 発火条件を確認する。

入力は EN (patched) HTML と ``render_ja_markdown`` 済みの JA HTML。
"""

from __future__ import annotations

from typing import Any

import pytest

from testim_parity.html_structure import compare_html_structure
from testim_parity.ja_render import render_ja_markdown


def issues(en: str, ja: str) -> list[dict[str, Any]]:
    return compare_html_structure(en, ja, slug="x")


def types(en: str, ja: str) -> list[str]:
    return [i["type"] for i in issues(en, ja)]


# --- brief Step 1 cases --------------------------------------------------------


def test_image_only_step_moved_out_of_list_is_detected():
    en = "<ol><li>a</li><li><img src='y.png'/></li></ol>"
    ja = "<ol><li>a</li></ol><p><img src='y.png'/></p>"
    assert types(en, ja) == ["step-count-mismatch"]


def test_code_block_replaced_by_inline_code_is_detected():
    en = "<ul><li><pre><code>x</code></pre></li></ul>"
    ja = "<ul><li><code>x</code></li></ul>"
    assert types(en, ja) == ["code-block-count-mismatch"]


def test_br_br_is_one_paragraph():
    assert types("<h2>A</h2><p>a<br/><br/>b</p>", "<h2>A</h2><p>ab</p>") == []
    assert "paragraph-count-mismatch" in types("<h2>A</h2><p>a</p><p>b</p>", "<h2>A</h2><p>ab</p>")


def test_br_in_table_cell_is_a_space_not_a_fusion():
    def table(cell: str) -> str:
        return f"<table><tr><td>{cell}</td></tr></table>"

    assert types(table("a<br>b"), table("a b")) == []
    # words split by <br> stay separate words, so the English-residual check still sees them
    words = "Press<br>this<br>button<br>to<br>begin<br>running"
    assert "table-cell-english-residual" in types(table("ボタン"), table(words))


def test_later_h1_counts_as_section():
    assert types("<h1>T</h1><h1>A</h1><p>x</p>", "<h2>A</h2><p>x</p>") == []


def test_file_path_span_matches_code_in_table_cell():
    en = '<table><tr><td><span class="FileOrFilePath">h=1.2.3.4</span></td></tr></table>'
    ja = "<table><tr><td><code>h=1.2.3.4</code></td></tr></table>"
    assert types(en, ja) == []


def test_callout_nesting_issue_keeps_ja_line():
    en = '<div class="note"><p>x</p></div>'
    ja = '<ol><li>a<div class="callout-note" data-line="12"><p>x</p></div></li></ol>'
    nesting = [i for i in issues(en, ja) if i["type"] == "callout-nesting-mismatch"]
    assert [i["line"] for i in nesting] == [12]
    assert nesting[0]["detail"] == "callout #1: EN=トップレベル → JA=ネスト"
    assert nesting[0]["severity"] == "actionable"


def test_block_boundary_in_cell_does_not_fuse_tokens():
    en = "<table><tr><td>run step.<br /><p>To learn</p></td></tr></table>"
    ja = "<table><tr><td>ステップ</td></tr></table>"
    assert "table-cell-token-mismatch" not in types(en, ja)


def test_block_boundary_without_br_in_cell_does_not_fuse_tokens():
    en = "<table><tr><td>run step.<p>To learn</p></td></tr></table>"
    ja = "<table><tr><td>ステップ</td></tr></table>"
    assert "table-cell-token-mismatch" not in types(en, ja)


def test_h1_after_content_is_a_section_not_the_title():
    en = "<p>intro</p><h1>T</h1><p>x</p>"
    assert types(en, "<p>intro</p><h2>T</h2><p>x</p>") == []
    assert "section-count-mismatch" in types(en, "<p>intro</p><p>x</p>")


def test_callout_nesting_depth_two_vs_one_is_not_reported():
    en = '<ol><li>a<ul><li>b<div class="note"><p>x</p></div></li></ul></li></ol>'
    ja = '<ol><li>a<div class="callout-note" data-line="3"><p>x</p></div></li></ol>'
    assert "callout-nesting-mismatch" not in types(en, ja)


def test_dropped_continuation_paragraph_in_step_is_detected():
    en = "<h2>A</h2><ol><li><p>a</p><p>b</p></li></ol>"
    assert "paragraph-count-mismatch" in types(en, render_ja_markdown("## A\n\n1. a\n"))
    assert types(en, render_ja_markdown("## A\n\n1. a\n\n   b\n")) == []


def test_tight_list_item_text_is_not_a_continuation_paragraph():
    en = "<h2>A</h2><ol><li><p>a</p></li><li>b</li></ol>"
    assert types(en, render_ja_markdown("## A\n\n1. a\n2. b\n")) == []


def test_continuation_paragraph_after_leading_text_counts():
    en = "<h2>A</h2><ul><li>a<p>b</p></li></ul>"
    ja = "<h2>A</h2><ul><li><p>a</p></li></ul>"
    assert types(en, ja) == ["paragraph-count-mismatch"]


# --- one test per issue type -----------------------------------------------------


def test_section_count_mismatch():
    en = "<h2>A</h2><p>t</p><h2>B</h2><p>t</p>"
    ja = "<h2>A</h2><p>t</p>"
    found = [i for i in issues(en, ja) if i["type"] == "section-count-mismatch"]
    assert [i["detail"] for i in found] == ["H2-H4 セクション数: EN=2, JA=1"]
    assert found[0]["severity"] == "signal"


def test_heading_level_mismatch():
    en = "<h2>A</h2><p>t</p><h3>B</h3><p>t</p>"
    ja = "<h2>A</h2><p>t</p><h4>B</h4><p>t</p>"
    found = [i for i in issues(en, ja) if i["type"] == "heading-mismatch"]
    assert [i["detail"] for i in found] == ["見出しレベル不一致 (1件): EN H3 'B' → JA H4"]


def test_step_count_mismatch_per_section():
    en = "<h2>A</h2><ol><li>a</li><li>b</li></ol>"
    ja = "<h2>A</h2><ol><li>a</li></ol>"
    details = [i["detail"] for i in issues(en, ja) if i["type"] == "step-count-mismatch"]
    assert details == [
        "番号付きステップ数が原文と異なります: EN=2, JA=1 (1 少ない)",
        'セクション #1 "A": ステップ数 EN=2, JA=1 (-1)',
    ]


def test_bullet_count_mismatch():
    en = "<h2>A</h2><ul><li>a</li><li>b</li></ul>"
    ja = "<h2>A</h2><ul><li>a</li></ul>"
    details = [i["detail"] for i in issues(en, ja) if i["type"] == "bullet-count-mismatch"]
    assert details == ['セクション #1 "A": 箇条書き数 EN=2, JA=1 (-1)']


def test_counts_without_headings_are_not_compared():
    # compare_snapshot_structure 契約: section 見出しが両側に無いページは
    # bullet / paragraph 数を比較しない (step 総数と code block 数のみ)。
    assert types("<ul><li>a</li><li>b</li></ul><p>x</p>", "<ul><li>a</li></ul>") == []


def test_nested_bullets_are_counted():
    en = "<h2>A</h2><ul><li>a<ul><li>b</li></ul></li></ul>"
    ja = "<h2>A</h2><ul><li>a</li></ul>"
    assert types(en, ja) == ["bullet-count-mismatch"]


def test_list_inside_table_cell_is_not_counted():
    en = "<h2>A</h2><table><tr><td><ul><li>a</li><li>b</li></ul></td></tr></table>"
    ja = "<h2>A</h2><table><tr><td>a<br/>b</td></tr></table>"
    assert types(en, ja) == []


def test_zero_width_only_paragraph_is_empty():
    en = "<h2>A</h2><p>x</p><p>\u200b \u200b<br/> \u200b</p>"
    ja = "<h2>A</h2><p>x</p>"
    assert types(en, ja) == []


def test_paragraph_count_mismatch():
    en = "<h2>A</h2><p>a</p><h2>B</h2><p>b</p>"
    ja = "<h2>A</h2><p>ab</p>"
    found = [i for i in issues(en, ja) if i["type"] == "paragraph-count-mismatch"]
    assert [i["detail"] for i in found] == ["段落数の総数が原文と異なります: EN=2, JA=1 (-1)"]


_EXCLUDED_CONTAINERS = {
    "li": "<ul><li>{}</li></ul>",
    "table": "<table><tr><td>{}</td></tr></table>",
    "blockquote": "<blockquote>{}</blockquote>",
    "details": "<details><summary>s</summary>{}</details>",
    "callout": '<div class="note">{}</div>',
}


@pytest.mark.parametrize("container", _EXCLUDED_CONTAINERS)
def test_paragraph_in_excluded_container_is_not_counted(container):
    wrap = _EXCLUDED_CONTAINERS[container]
    ja = "<h2>A</h2>" + wrap.format("x").replace('class="note"', 'class="callout-note"')
    inside = "<h2>A</h2>" + wrap.format("<p>x</p>")
    assert "paragraph-count-mismatch" not in types(inside, ja)
    outside = "<h2>A</h2>" + wrap.format("x") + "<p>x</p>"
    assert "paragraph-count-mismatch" in types(outside, ja)


def test_empty_and_image_only_paragraphs_are_not_counted():
    en = '<h2>A</h2><p>a</p><p></p><p><img src="i.png"/></p>'
    assert "paragraph-count-mismatch" not in types(en, "<h2>A</h2><p>a</p>")


def test_code_block_count_mismatch_detail_and_severity():
    en = "<pre><code>x</code></pre><pre><code>y</code></pre>"
    ja = "<pre><code>x</code></pre>"
    found = [i for i in issues(en, ja) if i["type"] == "code-block-count-mismatch"]
    assert [i["detail"] for i in found] == [
        "コードブロック数の総数が原文と異なります: EN=2, JA=1 (-1)"
    ]
    assert found[0]["severity"] == "signal"


def test_code_block_count_per_section():
    en = "<h2>A</h2><pre>x</pre><h2>B</h2><p>t</p>"
    ja = "<h2>A</h2><p>x</p><h2>B</h2><pre>t</pre>"
    details = [i["detail"] for i in issues(en, ja) if i["type"] == "code-block-count-mismatch"]
    assert details == [
        'セクション #1 "A": コードブロック数 EN=1, JA=0 (-1)',
        'セクション #2 "B": コードブロック数 EN=0, JA=1 (+1)',
    ]


def test_pre_inside_table_is_not_a_code_block():
    en = "<table><tr><td><pre>x</pre></td></tr></table>"
    ja = "<table><tr><td>x</td></tr></table>"
    assert "code-block-count-mismatch" not in types(en, ja)


def test_table_shape_mismatch():
    en = "<table><tr><td>a</td><td>b</td></tr></table>"
    ja = "<table><tr><td>a</td></tr></table>"
    found = [i for i in issues(en, ja) if i["type"] == "table-shape-mismatch"]
    assert [i["detail"] for i in found] == ["テーブル #1: EN=1行×2列, JA=1行×1列"]


def test_table_count_mismatch():
    en = "<table><tr><td>a</td></tr></table>"
    ja = "<p>a</p>"
    found = [i for i in issues(en, ja) if i["type"] == "table-shape-mismatch"]
    assert [i["detail"] for i in found] == ["テーブル数: EN=1, JA=0"]


def test_table_header_rows_are_compared():
    en = "<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>x</td></tr></tbody></table>"
    ja = "<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>x</td></tr></tbody></table>"
    assert types(en, ja) == []


def test_table_cell_empty_mismatch():
    en = "<table><tr><td>a</td></tr></table>"
    ja = "<table><tr><td></td></tr></table>"
    assert types(en, ja) == ["table-cell-empty-mismatch"]


def test_table_cell_token_mismatch():
    en = "<table><tr><td><code>foo</code></td></tr></table>"
    ja = "<table><tr><td><code>bar</code></td></tr></table>"
    found = [i for i in issues(en, ja) if i["type"] == "table-cell-token-mismatch"]
    assert [i["detail"] for i in found] == ["テーブル #1 [1,1]: 欠落: foo; 追加: bar"]


def test_table_cell_english_residual():
    en = "<table><tr><td>Click the button to start the run now</td></tr></table>"
    ja = "<table><tr><td>Press the button to begin running the test</td></tr></table>"
    assert "table-cell-english-residual" in types(en, ja)


def test_table_cell_entities_are_decoded():
    en = "<table><tr><td>a &amp; b</td></tr></table>"
    ja = "<table><tr><td>Press this &amp; that button to begin running</td></tr></table>"
    found = [i for i in issues(en, ja) if i["type"] == "table-cell-english-residual"]
    assert found[0]["detail"] == 'テーブル #1 [1,1]: "Press this & that button to begin running"'


# --- ported from test_checks.py (compare_snapshot_structure) ---------------------


def test_clean_identical_body():
    body = "<h2>A</h2><p>paragraph content here</p>"
    assert issues(body, body) == []


def test_artifacts_propagate_for_details():
    en = "<details><summary>hi</summary></details><h2>Sec</h2><p>para</p><p>more</p>"
    ja = "<h2>Sec</h2><p>para</p>"
    found = issues(en, ja)
    assert found
    assert all(i.get("artifacts") == ["EN uses <details> blocks"] for i in found)


def test_artifacts_propagate_for_mostly_pre():
    en = "<h2>A</h2><p>a</p><pre><code>" + "x" * 50 + "</code></pre>"
    ja = "<h2>A</h2><p>a</p><p>b</p><pre><code>" + "x" * 50 + "</code></pre>"
    found = issues(en, ja)
    assert found
    assert all(i.get("artifacts") == ["EN body largely wrapped in code fence"] for i in found)


def test_no_image_order_issue():
    en = '<p><img src="/img/aaa1111-a.png"/></p><p><img src="/img/bbb2222-b.png"/></p>'
    ja = '<p><img src="/img/bbb2222-b.png"/></p><p><img src="/img/aaa1111-a.png"/></p>'
    assert issues(en, ja) == []


# --- MadCap shapes that hold paragraph text outside <p> -----------------------

_DROPDOWN_EN = (
    "<h2>Archive</h2>"
    '<div class="MCDropDown"><span class="MCDropDownHead dropDownHead">'
    '<a href="#" class="MCDropDownHotSpot">2024</a></span>'
    '<div class="MCDropDownBody"><h3>Item</h3><p>Added</p></div></div>'
)
_BARE_TEXT_EN = (
    "<h2>Filter</h2><p>Intro</p><ol><li><p>Step</p></li></ol>"
    '<img src="images/a.png" />The results are filtered.\r\n<p>Next</p>'
)


def test_dropdown_head_matches_bold_paragraph():
    ja = render_ja_markdown("## アーカイブ\n\n**2024**\n\n### 項目\n\n追加\n")
    assert types(_DROPDOWN_EN, ja) == []


def test_missing_dropdown_head_paragraph_is_detected():
    ja = render_ja_markdown("## アーカイブ\n\n### 項目\n\n追加\n")
    assert types(_DROPDOWN_EN, ja) == ["paragraph-count-mismatch"]


def test_bare_text_after_image_matches_paragraph():
    ja = render_ja_markdown(
        "## Filter\n\n導入\n\n1. 手順\n\n![a](/images/a.png)\n\n結果が絞り込まれます。\n\n次へ\n"
    )
    assert types(_BARE_TEXT_EN, ja) == []


def test_missing_bare_text_paragraph_is_detected():
    ja = render_ja_markdown("## Filter\n\n導入\n\n1. 手順\n\n![a](/images/a.png)\n\n次へ\n")
    assert types(_BARE_TEXT_EN, ja) == ["paragraph-count-mismatch"]


# --- guards on JA-only / count-mismatch inputs ---------------------------------


def test_html_comment_in_ja_is_ignored():
    en = "<h2>A</h2><p>x</p>"
    assert types(en, "<h2>A</h2><!-- note --><p>x</p>") == []
    assert types(en, "<!-- note --><h2>A</h2><p>x</p>") == []


def test_h1_after_image_is_a_section_not_the_title():
    en = '<p><img src="a.png"/></p><h1>T</h1><p>x</p>'
    assert types(en, '<p><img src="a.png"/></p><h2>T</h2><p>x</p>') == []
    assert "section-count-mismatch" in types(en, '<p><img src="a.png"/></p><p>x</p>')


def test_callout_count_mismatch_is_not_a_nesting_issue():
    en = '<div class="note"><p>x</p></div><div class="note"><p>y</p></div>'
    ja = '<div class="callout-note" data-line="1"><p>x</p></div>'
    assert "callout-nesting-mismatch" not in types(en, ja)


def test_callout_nesting_reverse_direction_is_detected():
    en = '<ol><li>a<div class="note"><p>x</p></div></li></ol>'
    ja = '<ol><li>a</li></ol><div class="callout-note" data-line="4"><p>x</p></div>'
    nesting = [i for i in issues(en, ja) if i["type"] == "callout-nesting-mismatch"]
    assert [i["detail"] for i in nesting] == ["callout #1: EN=ネスト → JA=トップレベル"]
    assert [i["line"] for i in nesting] == [4]


def test_callout_nesting_without_ja_line_has_no_line():
    en = '<div class="note"><p>x</p></div>'
    ja = '<ol><li>a<div class="callout-note"><p>x</p></div></li></ol>'
    nesting = [i for i in issues(en, ja) if i["type"] == "callout-nesting-mismatch"]
    assert [i["line"] for i in nesting] == [None]
