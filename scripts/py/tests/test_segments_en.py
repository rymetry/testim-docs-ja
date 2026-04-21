"""``testim_parity.segments_en`` のユニットテスト。

node 不在環境でも動く素早い iteration 用。cross-runtime byte parity は
``tests/conformance/test_segments_en_parity.py`` が担保する。
"""

from __future__ import annotations

from testim_parity.segments_en import (
    CALLOUT_NORMALIZATION_SLUGS,
    decode_entities,
    extract_segments_from_html,
)


class TestDecodeEntities:
    def test_named_entities(self):
        assert decode_entities("&amp;&lt;&gt;") == "&<>"

    def test_numeric_entity(self):
        assert decode_entities("&#8217;") == "\u2019"

    def test_hex_entity(self):
        assert decode_entities("&#x2019;") == "\u2019"

    def test_unknown_entity_preserved(self):
        assert decode_entities("&unknown;") == "&unknown;"

    def test_non_string_returns_empty(self):
        assert decode_entities(None) == ""  # type: ignore[arg-type]
        assert decode_entities(123) == ""  # type: ignore[arg-type]


class TestExtractSegmentsBasic:
    def test_empty_returns_empty(self):
        assert extract_segments_from_html("") == []
        assert extract_segments_from_html("   ") == []

    def test_non_string_returns_empty(self):
        assert extract_segments_from_html(None) == []  # type: ignore[arg-type]

    def test_h1_not_emitted(self):
        """最初の h1 は title 扱いで emit されない (mjs 契約)。"""
        segs = extract_segments_from_html("<body><h1>Title</h1><h2>Sec</h2></body>")
        kinds = [s["segmentKind"] for s in segs]
        assert "heading" in kinds  # h2 は emit される
        # h1 text "Title" は heading として出ない
        assert not any(s["segmentKind"] == "heading" and "title" in s["textNorm"] for s in segs)

    def test_paragraph_segment(self):
        segs = extract_segments_from_html("<body><h2>X</h2><p>Hello world</p></body>")
        paragraphs = [s for s in segs if s["segmentKind"] == "paragraph"]
        assert len(paragraphs) == 1
        assert paragraphs[0]["textNorm"] == "hello world"


class TestIssueNestedList:
    """Issue #368 の核心: ネスト ``<li>`` を 1 segment にフラット化。"""

    def test_outer_li_flattens_inner_list(self):
        html = "<body><ul><li>Outer text <ul><li>Inner A</li><li>Inner B</li></ul></li></ul></body>"
        segs = extract_segments_from_html(html)
        list_segs = [s for s in segs if "list-item" in s["segmentKind"]]
        # 外側 <li> は 1 segment。内側 <ul>/<li> も flat に出る (mjs 挙動と同じ)
        assert any("outer text" in s["textNorm"] for s in list_segs)


class TestMadCapFragmentedOl:
    """MadCap fragmented ``<ol>``: non-``<li>`` sibling を正しく扱う。"""

    def test_paragraph_sibling_preserved(self):
        html = "<body><ol><li>first</li><p>mid para</p><li>second</li></ol></body>"
        segs = extract_segments_from_html(html)
        kinds = [s["segmentKind"] for s in segs]
        # li 2 + p 1 が emit されていること
        assert kinds.count("ordered-list-item") == 2
        assert kinds.count("paragraph") == 1


class TestCallout:
    def test_note_div_becomes_callout_body(self):
        html = '<body><div class="note"><p>A note.</p></div></body>'
        segs = extract_segments_from_html(html)
        assert any(s["segmentKind"] == "callout-body" for s in segs)

    def test_multi_paragraph_callout(self):
        html = '<body><div class="warning"><p>One.</p><p>Two.</p></div></body>'
        segs = extract_segments_from_html(html)
        callouts = [s for s in segs if s["segmentKind"] == "callout-body"]
        assert len(callouts) == 2


class TestCodeSnippetDrop:
    def test_code_snippet_div_dropped(self):
        html = '<body><h2>X</h2><div class="codeSnippet"><pre>code</pre></div><p>after</p></body>'
        segs = extract_segments_from_html(html)
        # code-block は emit されない (drop される)
        assert not any(s["segmentKind"] == "code-block" for s in segs)
        # ``<p>after</p>`` は通常通り emit される
        assert any(s["segmentKind"] == "paragraph" and "after" in s["textNorm"] for s in segs)


class TestInlineTokens:
    def test_code_produces_invariant_token(self):
        html = "<body><p>Use <code>npm install</code> now.</p></body>"
        segs = extract_segments_from_html(html)
        p = next(s for s in segs if s["segmentKind"] == "paragraph")
        assert "npm install" in p["tokensInvariant"]

    def test_link_produces_url_token(self):
        html = '<body><p>See <a href="https://example.com">docs</a>.</p></body>'
        segs = extract_segments_from_html(html)
        p = next(s for s in segs if s["segmentKind"] == "paragraph")
        assert any("example.com" in t for t in p["tokensInvariant"])


class TestDetailsSummary:
    def test_summary_emitted_as_details_summary(self):
        html = "<body><details><summary>Q</summary><p>body</p></details></body>"
        segs = extract_segments_from_html(html)
        kinds = [s["segmentKind"] for s in segs]
        assert "details-summary" in kinds
        assert "paragraph" in kinds


class TestTable:
    def test_td_cells_emitted(self):
        html = (
            "<body><table><tbody>"
            "<tr><td>a</td><td>b</td></tr>"
            "<tr><td>c</td></tr>"
            "</tbody></table></body>"
        )
        segs = extract_segments_from_html(html)
        cells = [s for s in segs if s["segmentKind"] == "table-cell"]
        assert len(cells) == 3
        assert [s["textNorm"] for s in cells] == ["a", "b", "c"]

    def test_thead_dropped(self):
        html = (
            "<body><table>"
            "<thead><tr><th>h1</th></tr></thead>"
            "<tbody><tr><td>v1</td></tr></tbody>"
            "</table></body>"
        )
        segs = extract_segments_from_html(html)
        cells = [s["segmentKind"] for s in segs if "cell" in s["segmentKind"]]
        # th は preprocessor で除去される (thead ごと decompose)
        assert cells == ["table-cell"]


class TestCalloutNormalization:
    def test_allow_list_rewrites_blockquote(self):
        html = (
            "<body><h2>API</h2><blockquote><p><strong>Note</strong> body.</p></blockquote></body>"
        )
        segs = extract_segments_from_html(html, slug="administration/api-access")
        # allow list 内なので callout-body として emit される
        assert any(s["segmentKind"] == "callout-body" for s in segs)

    def test_unrelated_slug_leaves_blockquote(self):
        html = (
            "<body><h2>Misc</h2><blockquote><p><strong>Note</strong> body.</p></blockquote></body>"
        )
        segs = extract_segments_from_html(html, slug="unrelated/page")
        # allow list 外なので通常の paragraph として emit される
        assert not any(s["segmentKind"] == "callout-body" for s in segs)
        assert any(s["segmentKind"] == "paragraph" for s in segs)


class TestConstants:
    def test_callout_normalization_slugs_is_frozenset(self):
        assert isinstance(CALLOUT_NORMALIZATION_SLUGS, frozenset)
        assert "administration/api-access" in CALLOUT_NORMALIZATION_SLUGS
