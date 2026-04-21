"""``convert_en_html_to_md`` / ``html_to_md`` のクロスランタイム conformance。

mjs ``scripts/lib/turndown.mjs`` の ``convertEnHtmlToMd`` と Python port が
同じ入力に対して **byte-identical な Markdown 文字列** を返すことを保証する。

Phase 4b M1 の verification gate。Phase 4b M2/M4 (check_source_parity +
fetch_translate_images の full port) が本関数の出力に依存するため、ここで
divergence すると下流が連鎖的に壊れる。
"""

from __future__ import annotations

import pytest

from testim_parity.turndown import convert_en_html_to_md, html_to_md

from ._harness import run_batch

# 代表的な MadCap Flare HTML パターン。mjs turndown の default rules +
# 5 つの custom rule (madcap-callout / madcap-code-snippet-copy /
# madcap-ordered-list / madcap-table / html-details+summary) を網羅する。
#
# 新しい divergence を見つけたらまず samples に追加して test を落とし、
# 原因を修正する運用。
_SAMPLES_HTML_TO_MD: list[tuple[str, str]] = [
    # 空 / 平易
    ("empty", ""),
    ("plain_p", "<p>Hello world.</p>"),
    # heading (atx style)
    ("h1", "<h1>Main</h1>"),
    ("h2", "<h2>Sub</h2>"),
    ("h3", "<h3>Section</h3>"),
    # 強調
    ("strong", "<p>This is <strong>bold</strong> text.</p>"),
    ("em", "<p>This is <em>italic</em> text.</p>"),
    # link / image
    ("link", '<a href="https://example.com">Click</a>'),
    ("img", '<img src="/img.png" alt="Logo" />'),
    # ul (``*   `` 3-space bullet)
    ("ul_simple", "<ul><li>A</li><li>B</li></ul>"),
    # ol custom rule (dashes without value, numbers with value)
    ("ol_no_value", "<ol><li>First</li><li>Second</li></ol>"),
    (
        "ol_with_value",
        '<ol><li value="1">First</li><li value="2">Second</li></ol>',
    ),
    # ol with non-<li> siblings (img/p/div between steps)
    (
        "ol_with_img_sibling",
        '<ol><li value="1">Step 1</li><img src="/fig.png" alt="fig"/>'
        '<li value="2">Step 2</li></ol>',
    ),
    # code fence with language
    (
        "code_fence_lang",
        '<pre><code class="language-js">const x = 1;</code></pre>',
    ),
    # madcap-callout
    (
        "callout_note",
        '<div class="note"><p>Note body</p></div>',
    ),
    (
        "callout_caution",
        '<div class="caution"><p>Caution body</p></div>',
    ),
    # madcap-code-snippet-copy (copy button が strip される)
    (
        "code_snippet_copy",
        '<div class="codeSnippet">'
        '<a class="codeSnippetCopyButton" href="javascript:void(0)">Copy</a>'
        "<pre>x=1</pre>"
        "</div>",
    ),
    # madcap-table (pipe table)
    (
        "table_basic",
        '<table class="TableStyle-Table_new">'
        "<thead><tr><th>A</th><th>B</th></tr></thead>"
        "<tbody><tr><td>1</td><td>2</td></tr></tbody>"
        "</table>",
    ),
    # html-details + summary
    (
        "details_summary",
        "<details><summary><b>Question?</b></summary><p>Answer.</p></details>",
    ),
    # Review round-1 P1 regression pin: nested list と multi-paragraph list item
    # が turndown の 4-space indent rule で保持されること
    (
        "nested_ul",
        "<ul><li>A<ul><li>A1</li><li>A2</li></ul></li><li>B</li></ul>",
    ),
    (
        "li_multi_paragraph",
        "<ul><li><p>Para 1</p><p>Para 2</p></li><li>Next</li></ul>",
    ),
    (
        "li_with_nested_ul_and_text",
        "<ul><li>Item A<ul><li>Nested A1</li></ul></li></ul>",
    ),
    # Review round-1 P2 regression pin: table cell / heading 内の <img> が
    # alt text ではなく markdown image として保持されること
    (
        "table_cell_with_img",
        "<table><thead><tr><th>Name</th><th>Icon</th></tr></thead>"
        '<tbody><tr><td>Item</td><td><img src="/x.png" alt="icon"/></td></tr>'
        "</tbody></table>",
    ),
    (
        "heading_with_inline_img",
        '<h2>Title <img src="/i.png" alt="icon"/></h2>',
    ),
    # Review round-2 P1 regression pin: em/strong の flanking whitespace chomp。
    # turndown は content を trim して marker 外側に空白を出し、sibling 側が
    # 既に空白を持つなら二重空白を避ける。
    ("em_leading_space", "<p>A <em> text</em> B</p>"),
    ("em_both_spaces", "<p>A <em> text </em> B</p>"),
    ("em_only_whitespace", "<p>A <em>   </em> B</p>"),
    ("em_empty_element", "<p>A <em></em> B</p>"),
    ("strong_both_spaces", "<p>A <strong> text </strong> B</p>"),
    ("strong_empty_element", "<p>A <strong></strong> B</p>"),
    ("i_both_spaces", "<p>A <i> text </i> B</p>"),
    ("b_both_spaces", "<p>A <b> text </b> B</p>"),
    # Review round-2 P2 regression pin: empty <li> の short-circuit。
    ("empty_li_skipped", "<ul><li></li><li>A</li></ul>"),
    ("whitespace_only_li_skipped", "<ul><li>   </li><li>A</li></ul>"),
    ("all_empty_ul", "<ul><li></li></ul>"),
    # Review round-4 P1 regression pin: code fence 内の連続空行は preserve
    # する。mjs turndown は code content を byte for byte 保持するが、Python
    # の全体後処理 ``\n{3,}`` collapse が fence 内部まで踏み込んで破壊して
    # いた問題を、``_normalize_output`` の fence-aware split で解消する。
    (
        "code_fence_triple_blank",
        '<pre><code class="language-bash">line1\n\n\n\nline2</code></pre>',
    ),
    (
        "code_fence_surrounded_by_prose",
        '<p>Before</p><pre><code class="language-bash">line1\n\n\n\nline2</code></pre><p>After</p>',
    ),
    (
        "code_fence_multiple",
        "<p>A</p>"
        '<pre><code class="language-js">a\n\n\nb</code></pre>'
        "<p>B</p>"
        '<pre><code class="language-py">x\n\n\ny</code></pre>',
    ),
]

# convert_en_html_to_md は preprocess_en_html を通すので、preprocess の
# 3 normalize path (escaped callout / multi-paragraph FAQ details / legacy
# single-<p> details) と chaining する。
_SAMPLES_FULL: list[tuple[str, str]] = [
    # preprocess_en 経由でも plain HTML は同じ結果になる (冪等性)
    ("plain_after_preprocess", "<p>Hello world.</p>"),
    # escaped callout (preprocessEnHtml で <div class="note"> に正規化される)
    ("escaped_callout", "<p>&gt; Title &gt; &gt; Body text</p>"),
    # escaped details (legacy single-<p> path)
    (
        "escaped_details",
        "<p>&lt;details&gt;&lt;summary&gt;Q&lt;/summary&gt; body&lt;/details&gt;</p>",
    ),
    # FAQ multi-paragraph broken escaped details tree。``normalizeEscapedFaqDetails``
    # (60+ 行) の複雑な rewrite path を turndown 経由で end-to-end 検証する
    # (review round-1 MEDIUM M3 対応)。
    (
        "escaped_faq_multi_paragraph",
        "<p>&lt;details&gt; &lt;summary&gt;&lt;b&gt;Q1&lt;/b&gt;&lt;/summary&gt; Answer 1</p>"
        "<p>&lt;/details&gt; &lt;details&gt; &lt;summary&gt;&lt;b&gt;Q2&lt;/b&gt;"
        "&lt;/summary&gt; Answer 2&lt;/details&gt;</p>",
    ),
]


@pytest.fixture(scope="module")
def mjs_html_to_md_results(repo_root, node_available) -> list[str]:
    if not node_available:
        pytest.skip("node not available")
    calls = [
        {"function": "turndown_html_to_md", "args": [html]} for _name, html in _SAMPLES_HTML_TO_MD
    ]
    return run_batch(repo_root, calls)


@pytest.fixture(scope="module")
def mjs_convert_en_results(repo_root, node_available) -> list[str]:
    if not node_available:
        pytest.skip("node not available")
    calls = [
        {"function": "turndown_convert_en_html_to_md", "args": [html]}
        for _name, html in _SAMPLES_FULL
    ]
    return run_batch(repo_root, calls)


def test_html_to_md_matches_mjs(mjs_html_to_md_results):
    """html_to_md の全 sample で Python 出力が mjs turndown と byte 一致する。"""
    for (name, html), mjs in zip(_SAMPLES_HTML_TO_MD, mjs_html_to_md_results, strict=True):
        py = html_to_md(html)
        assert py == mjs, f"divergence [{name}] html={html!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_convert_en_html_to_md_matches_mjs(mjs_convert_en_results):
    """convert_en_html_to_md (preprocess + turndown) の byte-identical 検証。"""
    for (name, html), mjs in zip(_SAMPLES_FULL, mjs_convert_en_results, strict=True):
        py = convert_en_html_to_md(html)
        assert py == mjs, f"divergence [{name}] html={html!r}:\n  py={py!r}\n  mjs={mjs!r}"
