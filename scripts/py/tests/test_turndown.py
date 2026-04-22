"""``testim_parity.turndown`` の unit test。

conformance test は node 不在環境で skip するため、Python 単独での回帰検出用
に golden fixture を pin する。fixture は mjs ``turndown.turndown`` / ``convertEnHtmlToMd``
の実出力を 2026-04-22 時点でキャプチャしたもの (``test_turndown_parity.py`` の
conformance で mjs と自動比較される)。
"""

from __future__ import annotations

import pytest

from testim_parity.turndown import (
    convert_en_html_to_md,
    html_to_md,
)


@pytest.mark.parametrize(
    ("html", "expected"),
    [
        ("", ""),
        ("<p>Hello world.</p>", "Hello world."),
        ("<h1>Main</h1>", "# Main"),
        ("<h2>Sub</h2>", "## Sub"),
        ("<h3>Section</h3>", "### Section"),
        (
            "<p>This is <strong>bold</strong> text.</p>",
            "This is **bold** text.",
        ),
        (
            "<p>This is <em>italic</em> text.</p>",
            "This is _italic_ text.",
        ),
        (
            '<a href="https://example.com">Click</a>',
            "[Click](https://example.com)",
        ),
        (
            '<img src="/img.png" alt="Logo" />',
            "![Logo](/img.png)",
        ),
    ],
)
def test_html_to_md_basic(html: str, expected: str) -> None:
    assert html_to_md(html) == expected


def test_ul_uses_three_space_bullet() -> None:
    """turndown は ``*   `` (asterisk + 3 spaces) を list bullet に使う。"""
    assert html_to_md("<ul><li>A</li><li>B</li></ul>") == "*   A\n*   B"


def test_ol_no_value_uses_dash() -> None:
    """MadCap custom rule: value なしの ``<li>`` は ``- content``。"""
    assert html_to_md("<ol><li>First</li><li>Second</li></ol>") == "- First\n\n- Second"


def test_ol_with_value_uses_number() -> None:
    """``<li value="N">`` は ``N. content``。"""
    html = '<ol><li value="1">First</li><li value="2">Second</li></ol>'
    assert html_to_md(html) == "1. First\n\n2. Second"


def test_ol_with_non_li_siblings_keeps_block_order() -> None:
    """``<ol>`` 内の ``<img>`` や ``<p>`` は独立 block として保持される。"""
    html = (
        '<ol><li value="1">Step 1</li><img src="/fig.png" alt="fig"/><li value="2">Step 2</li></ol>'
    )
    assert html_to_md(html) == "1. Step 1\n\n![fig](/fig.png)\n\n2. Step 2"


def test_code_fence_with_language_class() -> None:
    """``<pre><code class="language-X">`` は ``\\`\\`\\`X`` を fence language に。"""
    html = '<pre><code class="language-js">const x = 1;</code></pre>'
    assert html_to_md(html) == "```js\nconst x = 1;\n```"


def test_pre_without_code_no_fence() -> None:
    """``<pre>`` に ``<code>`` 子要素が無ければ fence を付けない。"""
    # copy button も同時に strip されることを確認
    html = (
        '<div class="codeSnippet">'
        '<a class="codeSnippetCopyButton" href="javascript:void(0)">Copy</a>'
        "<pre>x=1</pre>"
        "</div>"
    )
    assert html_to_md(html) == "x=1"


@pytest.mark.parametrize(
    ("class_name", "directive"),
    [("note", "note"), ("caution", "caution")],
)
def test_madcap_callout_directive(class_name: str, directive: str) -> None:
    html = f'<div class="{class_name}"><p>Body text.</p></div>'
    assert html_to_md(html) == f":::{directive}\nBody text.\n:::"


def test_madcap_table_pipe_format() -> None:
    html = (
        '<table class="TableStyle-Table_new">'
        "<thead><tr><th>A</th><th>B</th></tr></thead>"
        "<tbody><tr><td>1</td><td>2</td></tr></tbody>"
        "</table>"
    )
    expected = "| A | B |\n| --- | --- |\n| 1 | 2 |"
    assert html_to_md(html) == expected


def test_html_details_summary_converts_to_h2() -> None:
    html = "<details><summary><b>Question?</b></summary><p>Answer.</p></details>"
    assert html_to_md(html) == "## **Question?**\n\nAnswer."


def test_convert_en_html_to_md_applies_preprocess() -> None:
    """escaped callout pattern が preprocess で ``<div class="note">`` に正規化される。"""
    html = "<p>&gt; Title &gt; &gt; Body text</p>"
    # preprocessEnHtml で <div class="note"><p>Body text</p></div> に rewrite、
    # その後 turndown で :::note directive に変換される
    assert convert_en_html_to_md(html) == ":::note\nBody text\n:::"


def test_convert_en_html_to_md_plain_passthrough() -> None:
    """preprocess 対象外の平易な HTML は turndown default と同じ結果。"""
    assert convert_en_html_to_md("<p>Plain text.</p>") == "Plain text."


def test_convert_en_html_to_md_rejects_non_str() -> None:
    with pytest.raises(TypeError, match="expected str"):
        convert_en_html_to_md(123)  # type: ignore[arg-type]


# ----------------------------------------------------------------------
# Review round-1 P1 regression pins: nested list + multi-paragraph <li>
# は turndown の 4-space indent rule で保持される (flatten しない)。
# ----------------------------------------------------------------------


def test_nested_ul_preserved_with_four_space_indent() -> None:
    """``<ul><li>A<ul><li>A1</li></ul></li>`` が 4-space indent で nested list。"""
    html = "<ul><li>A<ul><li>A1</li><li>A2</li></ul></li><li>B</li></ul>"
    assert html_to_md(html) == "*   A\n    *   A1\n    *   A2\n*   B"


def test_li_with_multi_paragraph_content_indents_continuation() -> None:
    """``<li>`` 内の複数 ``<p>`` は 4-space indent で continuation。"""
    html = "<ul><li><p>Para 1</p><p>Para 2</p></li><li>Next</li></ul>"
    assert html_to_md(html) == "*   Para 1\n    \n    Para 2\n    \n*   Next"


def test_li_with_nested_ul_and_prefix_text() -> None:
    """``<li>`` 冒頭 text + nested ``<ul>`` が turndown 互換 indent になる。"""
    html = "<ul><li>Item A<ul><li>Nested A1</li></ul></li></ul>"
    assert html_to_md(html) == "*   Item A\n    *   Nested A1"


# ----------------------------------------------------------------------
# Review round-1 P2 regression pins: markdownify の default は inline
# context で ``<img>`` を alt text 化するが、turndown は常に markdown image。
# ----------------------------------------------------------------------


def test_table_cell_inline_img_preserved_as_markdown_image() -> None:
    """table cell 内の ``<img>`` は markdown image を保持する (alt text 化しない)。"""
    html = (
        "<table><thead><tr><th>Name</th><th>Icon</th></tr></thead>"
        '<tbody><tr><td>Item</td><td><img src="/x.png" alt="icon"/></td></tr>'
        "</tbody></table>"
    )
    expected = "| Name | Icon |\n| --- | --- |\n| Item | ![icon](/x.png) |"
    assert html_to_md(html) == expected


def test_heading_inline_img_preserved_as_markdown_image() -> None:
    """heading 内の ``<img>`` は markdown image を保持する。"""
    html = '<h2>Title <img src="/i.png" alt="icon"/></h2>'
    assert html_to_md(html) == "## Title ![icon](/i.png)"


def test_img_with_title_attr() -> None:
    """``title`` 属性付き ``<img>`` は turndown の ``"..."`` syntax を使う。"""
    html = '<img src="/a.png" alt="a" title="A title"/>'
    assert html_to_md(html) == '![a](/a.png "A title")'


# ----------------------------------------------------------------------
# Review round-2 P1 regression pins: emphasis chomp + flanking whitespace。
# turndown は content を trim して marker 外側に whitespace を出す。sibling が
# 既に whitespace を持てば二重 space を避ける。empty / whitespace-only emphasis
# は marker ごと除去される (双方の sibling whitespace が 1 つに merge される)。
# ----------------------------------------------------------------------


@pytest.mark.parametrize(
    ("html", "expected"),
    [
        ("<p>A <em> text</em> B</p>", "A _text_ B"),
        ("<p>A <em>text </em> B</p>", "A _text_ B"),
        ("<p>A <em> text </em> B</p>", "A _text_ B"),
        ("<p>A <em>   </em> B</p>", "A B"),
        ("<p>A <em></em> B</p>", "A B"),
        ("<p>A <i> text </i> B</p>", "A _text_ B"),
        ("<p>A <strong> text </strong> B</p>", "A **text** B"),
        ("<p>A <strong></strong> B</p>", "A B"),
        ("<p>A <b> text </b> B</p>", "A **text** B"),
    ],
)
def test_emphasis_flanking_whitespace(html: str, expected: str) -> None:
    assert html_to_md(html) == expected


# ----------------------------------------------------------------------
# Review round-2 P2 regression pin: empty <li> は bullet 行を emit しない。
# ----------------------------------------------------------------------


def test_empty_li_does_not_emit_bullet() -> None:
    """``<ul><li></li><li>A</li></ul>`` は ``*   A`` のみ (空 bullet を出さない)。"""
    assert html_to_md("<ul><li></li><li>A</li></ul>") == "*   A"


def test_whitespace_only_li_does_not_emit_bullet() -> None:
    assert html_to_md("<ul><li>   </li><li>A</li></ul>") == "*   A"


def test_all_empty_list_emits_nothing() -> None:
    assert html_to_md("<ul><li></li></ul>") == ""


# ----------------------------------------------------------------------
# Review round-4 P1 regression pins: code fence 内の連続空行は preserve する。
# mjs turndown は code content を byte for byte 保持する。Python 全体の
# ``\n{3,}`` → ``\n\n`` collapse は fence 外だけに適用しなければならない。
# ----------------------------------------------------------------------


def test_code_fence_preserves_triple_blank_lines() -> None:
    """``<pre><code>line1\\n\\n\\n\\nline2</code></pre>`` の 3 連続空行を保持。"""
    html = '<pre><code class="language-bash">line1\n\n\n\nline2</code></pre>'
    assert html_to_md(html) == "```bash\nline1\n\n\n\nline2\n```"


def test_code_fence_preserves_double_blank_lines() -> None:
    html = '<pre><code class="language-bash">line1\n\n\nline2</code></pre>'
    assert html_to_md(html) == "```bash\nline1\n\n\nline2\n```"


def test_code_fence_surrounded_by_prose_preserves_content() -> None:
    """code fence が段落に挟まれた状況で内部の空行を preserve、
    fence 外の ``\\n{3,}`` は ``\\n\\n`` に collapse される。"""
    html = (
        '<p>Before</p><pre><code class="language-bash">line1\n\n\n\nline2</code></pre><p>After</p>'
    )
    expected = "Before\n\n```bash\nline1\n\n\n\nline2\n```\n\nAfter"
    assert html_to_md(html) == expected


def test_multiple_code_fences_each_preserved() -> None:
    """複数の code fence が並ぶケースでも、それぞれの内部を独立に preserve。"""
    html = (
        "<p>A</p>"
        '<pre><code class="language-js">a\n\n\nb</code></pre>'
        "<p>B</p>"
        '<pre><code class="language-py">x\n\n\ny</code></pre>'
    )
    expected = "A\n\n```js\na\n\n\nb\n```\n\nB\n\n```py\nx\n\n\ny\n```"
    assert html_to_md(html) == expected


# ----------------------------------------------------------------------
# Review round-5 P1 regression pins: ``convert_pre`` の boundary blank line
# 保持。mjs turndown は ``code.replace(/\n$/, '')`` で末尾 1 個のみ剥がす。
# Python の ``re.sub(r"\n$", ...)`` は default flag で末尾 2 文字剥がすため、
# ``r"\n\Z"`` (absolute end-of-string) で 1 文字だけ剥がす必要がある。
# ----------------------------------------------------------------------


def test_code_fence_leading_blank_line_preserved() -> None:
    """``<pre><code>\\nline1</code></pre>`` の先頭 blank は保持される。"""
    html = '<pre><code class="language-bash">\nline1</code></pre>'
    assert html_to_md(html) == "```bash\n\nline1\n```"


def test_code_fence_trailing_single_newline_normalized() -> None:
    """``<pre><code>line1\\n</code></pre>`` の末尾 1 個 ``\\n`` は fence separator
    に吸収されて ``\\n`` 1 個のみ (basic_fence と同じ出力)。"""
    html = '<pre><code class="language-bash">line1\n</code></pre>'
    assert html_to_md(html) == "```bash\nline1\n```"


def test_code_fence_multi_leading_blank_lines_preserved() -> None:
    """複数の先頭 blank line はそのまま保持される。"""
    html = '<pre><code class="language-bash">\n\n\nline1</code></pre>'
    assert html_to_md(html) == "```bash\n\n\n\nline1\n```"


def test_code_fence_multi_trailing_blank_lines_preserved() -> None:
    """末尾の複数 blank line は 1 個だけ剥がされ、残りは fence separator の
    前に保持される (turndown ``code.replace(/\\n$/, '')`` と同じ)。"""
    html = '<pre><code class="language-bash">line1\n\n\n</code></pre>'
    assert html_to_md(html) == "```bash\nline1\n\n\n```"


# ----------------------------------------------------------------------
# Phase 4b.1: turndown default rule port
#   - escape (13 rules)
#   - collapseWhitespace
#   - convert_p preserves <br> hard break
#   - autolinks disabled
# ----------------------------------------------------------------------


@pytest.mark.parametrize(
    ("html", "expected"),
    [
        # ``^-`` leading dash escape
        ("<p>- start</p>", "\\- start"),
        # ``^+ `` leading plus+space escape (``+ Teammate`` など)
        ("<p><strong>+ Teammate</strong></p>", "**\\+ Teammate**"),
        # ``^# `` leading ATX heading escape (callout 本文に ``### Note``)
        ("<p>### Note about this</p>", "\\### Note about this"),
        # ``` ` ``` backtick escape
        ("<p>code `abc` end</p>", "code \\`abc\\` end"),
        # ``_`` underscore escape (``execute_driver_script``)
        ("<p>execute_driver_script</p>", "execute\\_driver\\_script"),
        # ``[`` / ``]`` bracket escape
        ("<p>[tag]</p>", "\\[tag\\]"),
        # ``^>`` leading gt escape
        ("<p>&gt; quoted</p>", "\\> quoted"),
        # ``^~~~`` leading tilde escape
        ("<p>~~~fence</p>", "\\~~~fence"),
        # ``^(\d+)\. `` leading number-dot escape
        ("<p>1. item</p>", "1\\. item"),
        # ``^(=+)`` leading equals (setext heading) escape
        ("<p>=== header</p>", "\\=== header"),
    ],
)
def test_turndown_escape_rules(html: str, expected: str) -> None:
    assert html_to_md(html) == expected


def test_collapse_whitespace_leading_space_after_br() -> None:
    """``<br>`` 境界 後の leading space を削る (mjs collapseWhitespace)。"""
    assert html_to_md("<p>text1<br/> text2</p>") == "text1  \ntext2"


def test_collapse_whitespace_image_concat_preserves_space() -> None:
    """隣接 ``<img>`` 間の newline は single space に畳まれる (void element
    隣接 text は leading space を preserve する turndown の挙動)。"""
    html = '<div><img src="a.png"/>\n<img src="b.png"/></div>'
    assert html_to_md(html) == "![](a.png) ![](b.png)"


def test_convert_p_preserves_br_hard_break() -> None:
    """``<p>text<br/> next</p>`` → ``text  \\nnext`` で trailing ``  `` 保持。"""
    assert html_to_md("<p>text<br/> next</p>") == "text  \nnext"


def test_autolinks_disabled() -> None:
    """``<a href=URL>URL</a>`` は ``[URL](URL)`` で出す (``<URL>`` 縮約しない)。"""
    url = "https://example.com/foo"
    assert html_to_md(f'<p><a href="{url}">{url}</a></p>') == f"[{url}]({url})"


def test_pre_content_preserved_by_collapse_whitespace() -> None:
    """``<pre>`` 配下は collapseWhitespace の skip 対象で、code content の
    連続改行を byte for byte 保持する。"""
    html = '<pre><code class="language-bash">line1\n\n\nline2</code></pre>'
    assert html_to_md(html) == "```bash\nline1\n\n\nline2\n```"


def test_pre_uses_block_branch_in_collapse_whitespace() -> None:
    """``<pre>`` は mjs と同じく block 分岐を通り、直後の text node の
    leading space を strip する (reviewer P1 対応)。

    旧実装は ``<pre>`` を void 相当 (``keep_leading_ws=True``) で扱っていたため、
    ``<pre>...</pre> after`` の leading space が preserve されて mjs と
    divergence していた。mjs ``collapseWhitespace`` L492 は ``isBlock(PRE) ==
    true`` で最初の branch に分岐し ``keep_leading_ws=False`` に倒す。
    """
    # mjs: "before\n\n```\nx\n```\n\nafter" — leading space on " after" is
    # stripped by the block branch.
    html = "<div>before <pre><code>x</code></pre> after</div>"
    assert html_to_md(html) == "before\n\n```\nx\n```\n\nafter"


def test_pre_block_branch_rstrips_prev_text() -> None:
    """``<pre>`` の直前 text に trailing space があれば削る (block 分岐の
    ``prev_text = prev_text.replace(/ $/, '')`` 等価、reviewer P1 対応)。"""
    # mjs: "word\n\n```\nx\n```\n\nend" — trailing space on "word " is trimmed.
    html = "<div>word <pre><code>x</code></pre>end</div>"
    assert html_to_md(html) == "word\n\n```\nx\n```\n\nend"
