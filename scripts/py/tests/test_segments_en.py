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

    def test_out_of_range_numeric_entity_preserved(self):
        """``chr()`` が OverflowError を投げるほど巨大な code point は原文保持。"""
        # Unicode 範囲外の巨大な整数は chr() で OverflowError。原文がそのまま返る。
        oversized = "&#9999999999999999999;"
        assert decode_entities(oversized) == oversized


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


class TestPreBlock:
    """``<pre>`` は code-block segment kind (codeSnippet drop 漏れ時の fallback)。"""

    def test_pre_block_emits_code_block(self):
        html = "<body><h2>X</h2><pre>var x = 1;</pre></body>"
        segs = extract_segments_from_html(html)
        code_blocks = [s for s in segs if s["segmentKind"] == "code-block"]
        assert len(code_blocks) == 1
        assert "var x" in code_blocks[0]["textNorm"]


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
        """allow list 内 slug では ``<blockquote>`` が callout-body に書き換わる。"""
        html = (
            "<body><h2>API</h2><blockquote><p><strong>Note</strong> body.</p></blockquote></body>"
        )
        segs = extract_segments_from_html(
            html,
            slug="administration/api-access",
            callout_allow_slugs=CALLOUT_NORMALIZATION_SLUGS,
        )
        assert any(s["segmentKind"] == "callout-body" for s in segs)

    def test_unrelated_slug_leaves_blockquote(self):
        """allow list 外 slug では書き換えなし (callout-body は emit されない)。"""
        html = (
            "<body><h2>Misc</h2><blockquote><p><strong>Note</strong> body.</p></blockquote></body>"
        )
        segs = extract_segments_from_html(
            html, slug="unrelated/page", callout_allow_slugs=CALLOUT_NORMALIZATION_SLUGS
        )
        assert not any(s["segmentKind"] == "callout-body" for s in segs)
        assert any(s["segmentKind"] == "paragraph" for s in segs)

    def test_callout_allow_slugs_none_disables_normalization(self):
        """review H4: ``callout_allow_slugs=None`` (default) で normalization 停止。

        mjs ``normalizeCallouts`` は ``calloutAllowSlugs instanceof Set`` を
        満たさないと即 return するため、Python 側も default で normalization を
        行わないのが正しい契約。production caller は ``CALLOUT_NORMALIZATION_SLUGS``
        を明示的に渡すが、library として単独で使われる場合はこの guard が効く。
        """
        html = (
            "<body><h2>API</h2><blockquote><p><strong>Note</strong> body.</p></blockquote></body>"
        )
        # slug だけ渡して callout_allow_slugs は省略 → mjs と同じく書き換えなし
        segs = extract_segments_from_html(html, slug="administration/api-access")
        assert not any(s["segmentKind"] == "callout-body" for s in segs)


class TestConstants:
    def test_callout_normalization_slugs_is_frozenset(self):
        assert isinstance(CALLOUT_NORMALIZATION_SLUGS, frozenset)
        assert "administration/api-access" in CALLOUT_NORMALIZATION_SLUGS


class TestHtml5libFallback:
    """``extract_segments_from_html`` の html5lib fallback 経路を guard。

    plan ``Fallback 戦略`` (``PYTHON_MIGRATION_PLAN.md``): lxml が segment 0 件
    を返し、かつ HTML が ``_HTML5LIB_FALLBACK_MIN_LEN`` 以上の場合、html5lib で
    再パースする契約。現行 288-page corpus では発動しないため、mock で分岐を
    明示的に exercise する (review M2 指摘)。
    """

    def test_fallback_invoked_when_lxml_returns_empty(self, monkeypatch):
        """lxml 側 walk が空 list を返すケースで html5lib 側 walk に再試行する。

        ``_walk_soup`` を monkey-patch して、BS4 parser 名 (``builder.NAME``)
        によって結果を切り替える。lxml 側で必ず空を返すようにし、html5lib 側
        で segment 1 件を返す fake を用意する。これにより fallback の call path
        と 2 段目 segment が下流に届くかを検証できる。
        """
        from testim_parity import segments_en

        calls: list[str] = []

        def fake_walk_soup(soup, slug, callout_allow_slugs):
            # bs4 ``BeautifulSoup.builder.NAME`` で parser を特定する
            parser_name = soup.builder.NAME if soup.builder else "unknown"
            calls.append(parser_name)
            if parser_name == "lxml":
                return []
            if parser_name == "html5lib":
                return [
                    {
                        "sectionPath": "",
                        "segmentKind": "paragraph",
                        "segmentIndex": 0,
                        "textNorm": "fallback-reached",
                        "tokensInvariant": [],
                        "sourceFingerprint": "sha256:test",
                        "line": None,
                    }
                ]
            return []

        monkeypatch.setattr(segments_en, "_walk_soup", fake_walk_soup)

        # ``_HTML5LIB_FALLBACK_MIN_LEN`` を超える長さの HTML を渡す
        html = "<body>" + "<p>x</p>" * 200 + "</body>"
        assert len(html) >= segments_en._HTML5LIB_FALLBACK_MIN_LEN

        segs = segments_en.extract_segments_from_html(html)
        assert calls == ["lxml", "html5lib"], f"parser order wrong: {calls!r}"
        assert len(segs) == 1
        assert segs[0]["textNorm"] == "fallback-reached"

    def test_fallback_skipped_for_short_html(self, monkeypatch):
        """HTML が閾値未満なら lxml が空でも html5lib は呼ばない。"""
        from testim_parity import segments_en

        calls: list[str] = []

        def fake_walk_soup(soup, slug, callout_allow_slugs):
            parser_name = soup.builder.NAME if soup.builder else "unknown"
            calls.append(parser_name)
            return []

        monkeypatch.setattr(segments_en, "_walk_soup", fake_walk_soup)

        # 閾値未満の短い HTML
        html = "<body><p>x</p></body>"
        assert len(html) < segments_en._HTML5LIB_FALLBACK_MIN_LEN

        segs = segments_en.extract_segments_from_html(html)
        assert calls == ["lxml"], f"html5lib should not be called: {calls!r}"
        assert segs == []

    def test_fallback_skipped_when_lxml_returns_segments(self, monkeypatch):
        """lxml が 1 件でも segment を返したら html5lib は呼ばない (冪等性)。"""
        from testim_parity import segments_en

        calls: list[str] = []

        def fake_walk_soup(soup, slug, callout_allow_slugs):
            parser_name = soup.builder.NAME if soup.builder else "unknown"
            calls.append(parser_name)
            return [
                {
                    "sectionPath": "",
                    "segmentKind": "paragraph",
                    "segmentIndex": 0,
                    "textNorm": "lxml-reached",
                    "tokensInvariant": [],
                    "sourceFingerprint": "sha256:lxml",
                    "line": None,
                }
            ]

        monkeypatch.setattr(segments_en, "_walk_soup", fake_walk_soup)

        # 閾値 <以上> だが lxml で既に segment が取れるので fallback 不要
        html = "<body>" + "<p>x</p>" * 200 + "</body>"
        assert len(html) >= segments_en._HTML5LIB_FALLBACK_MIN_LEN

        segs = segments_en.extract_segments_from_html(html)
        assert calls == ["lxml"], f"fallback invoked unnecessarily: {calls!r}"
        assert len(segs) == 1
        assert segs[0]["textNorm"] == "lxml-reached"
