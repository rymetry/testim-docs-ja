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
