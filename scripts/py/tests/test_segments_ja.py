"""``testim_parity.segments_ja`` のユニットテスト。

cross-runtime byte parity は ``tests/conformance/test_segments_ja_parity.py``
が担保する。こちらは node 不在環境でも動く素早い iteration 用と、mjs
line-based 挙動の regression guard。
"""

from __future__ import annotations

from testim_parity.segments_ja import extract_segments_from_markdown


class TestBasicClassification:
    def test_non_string_returns_empty(self):
        assert extract_segments_from_markdown(None) == []  # type: ignore[arg-type]
        assert extract_segments_from_markdown(123) == []  # type: ignore[arg-type]

    def test_empty_returns_empty(self):
        assert extract_segments_from_markdown("") == []
        assert extract_segments_from_markdown("   \n   \n") == []

    def test_h1_skipped_as_title(self):
        md = "# Title\n\n## Section\n\nBody.\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        # H1 は emit されない、H2 だけ heading
        assert kinds == ["heading", "paragraph"]
        assert segs[0]["textNorm"] == "section"

    def test_frontmatter_stripped(self):
        md = "---\ntitle: T\n---\n\nBody paragraph.\n"
        segs = extract_segments_from_markdown(md)
        assert len(segs) == 1
        assert segs[0]["segmentKind"] == "paragraph"
        assert segs[0]["textNorm"] == "body paragraph."

    def test_heading_anchor_suffix_stripped(self):
        md = "## Section Title {#anchor-id}\n\nBody.\n"
        segs = extract_segments_from_markdown(md)
        assert segs[0]["segmentKind"] == "heading"
        assert segs[0]["textNorm"] == "section title"


class TestListEmitNestedMarker:
    """Nested marker pattern (``markerIndent >= bodyIndent``) — Issue #368 flatten。

    PR #389 では既存 corpus の sibling list marker を content 側で top-level に
    outdent し、parser 側は Issue #368 原案の ``>=`` rule に戻した。これにより
    author が通常の Markdown nested list として書いた場合は EN ``collectInlineText``
    と対称に 1 list item segment へ flatten される。
    """

    def test_unordered_nested_flattens_into_outer(self):
        md = "- Outer\n  - Nested A\n  - Nested B\n- Sibling\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        # ``  -`` の leading_ws=2 == body_indent=2 → nested marker flatten
        assert kinds == ["unordered-list-item", "unordered-list-item"]
        assert segs[0]["textNorm"] == "outer nested a nested b"
        assert segs[1]["textNorm"] == "sibling"

    def test_ordered_with_nested_unordered_flattens(self):
        md = "1. Outer step\n   - sub A\n   - sub B\n2. Next step\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        # ``1.`` の body_indent=3、``   -`` の leading_ws=3 → nested marker flatten
        assert kinds == [
            "ordered-list-item",
            "ordered-list-item",
        ]
        assert segs[0]["textNorm"] == "outer step sub a sub b"
        assert segs[1]["textNorm"] == "next step"

    def test_flat_list_unchanged(self):
        md = "- alpha\n- beta\n- gamma\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["unordered-list-item"] * 3
        assert [s["textNorm"] for s in segs] == ["alpha", "beta", "gamma"]

    def test_list_segment_index_counter(self):
        md = "## S\n\n- a\n- b\n- c\n"
        segs = extract_segments_from_markdown(md)
        list_items = [s for s in segs if "list-item" in s["segmentKind"]]
        assert [s["segmentIndex"] for s in list_items] == [0, 1, 2]


class TestListEmitTrueNested:
    """Deeper nested pattern (``markerIndent > bodyIndent``) — Issue #368 flatten。

    EN walker の ``collectInlineText`` は ``<li>`` 直下の nested ``<ul>`` / 複数
    ``<p>`` / ``<img>`` を 1 segment に flatten する。JA parser もこれを対称化
    するため、active list item に対して deeper indent content を吸収する。

    契約: ``markerIndent >= bodyIndent`` のとき nested 扱い。ここではより深い
    indent の多段 case も同じく flatten されることを pin する。
    """

    def test_nested_unordered_flatten_into_outer(self):
        """``- outer\\n    - nested`` (4 spaces) は 1 item "outer nested" に flatten。"""
        md = "- outer\n    - nested\n"
        segs = extract_segments_from_markdown(md)
        assert len(segs) == 1
        assert segs[0]["segmentKind"] == "unordered-list-item"
        assert segs[0]["textNorm"] == "outer nested"

    def test_nested_ordered_flatten_into_outer(self):
        """``1. outer\\n    1. nested`` は 1 ordered item に flatten。

        ordered-inside-ordered でも同じく flatten される (EN ``<li><ol><li>``
        pattern に対応)。
        """
        md = "1. outer\n    1. nested A\n    2. nested B\n"
        segs = extract_segments_from_markdown(md)
        assert len(segs) == 1
        assert segs[0]["segmentKind"] == "ordered-list-item"
        assert segs[0]["textNorm"] == "outer nested a nested b"

    def test_multi_level_nested_flatten(self):
        """3 段 nested (``- a\\n    - b\\n        - c``) は "a b c" に flatten。

        EN ``collectInlineText`` は任意段 nested を再帰で flatten するため、
        JA 側も多段を 1 item に compact する。
        """
        md = "- a\n    - b\n        - c\n"
        segs = extract_segments_from_markdown(md)
        assert len(segs) == 1
        assert segs[0]["textNorm"] == "a b c"

    def test_continuation_paragraph_flatten(self):
        """``1. step\\n\\n    continuation`` は 1 item に flatten (blank 行越し)。

        EN ``<li><p>step</p><p>continuation</p></li>`` → ``collectInlineText`` で
        "step continuation" に flatten される挙動に対応 (Issue #368 §3.1 #1)。
        """
        md = "1. First step.\n\n    Continuation paragraph.\n\n2. Second step.\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["ordered-list-item", "ordered-list-item"]
        assert segs[0]["textNorm"] == "first step. continuation paragraph."
        assert segs[1]["textNorm"] == "second step."

    def test_indented_image_absorbed_as_space(self):
        """``- item\\n    ![alt](img)`` で image は absorb される。

        EN ``renderInlineText`` は ``<img>`` → space 1 個に縮退するため、JA の
        deeper-indented image も list item の text に空白として吸収される
        (Issue #368 §3.1 #3)。
        """
        md = "- Item with image\n    ![alt](/x.png)\n"
        segs = extract_segments_from_markdown(md)
        assert len(segs) == 1
        assert segs[0]["segmentKind"] == "unordered-list-item"
        assert segs[0]["textNorm"] == "item with image"

    def test_indented_code_fence_absorbed_as_text(self):
        """list 内 indented code fence は inner text だけ absorb される。

        EN ``<li><pre>code</pre></li>`` → ``collectInlineText`` で ``<pre>`` 透過
        して code の text を flatten するため、JA も fence marker を除いた inner
        を list item text に append する (Issue #368 §3.2 #5)。
        """
        md = "- step\n\n    ```js\n    var x = 1;\n    ```\n\n- after\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["unordered-list-item", "unordered-list-item"]
        # "step" + fence inner "var x = 1;" が concat される
        assert "var x = 1;" in segs[0]["textNorm"]
        assert segs[1]["textNorm"] == "after"

    def test_tight_sibling_not_flattened_across_top_level_marker(self):
        """``- a\\n    - nested\\n- sibling`` は [flatten, sibling] の 2 items。

        ``- sibling`` の leading_ws=0 < body_indent=2 → 新 top-level を開き、
        flatten 中の active_list を flush する。
        """
        md = "- outer\n    - nested\n- sibling\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["unordered-list-item", "unordered-list-item"]
        assert segs[0]["textNorm"] == "outer nested"
        assert segs[1]["textNorm"] == "sibling"

    def test_hard_break_continuation_remains_separate(self):
        """``-  bullet\\\\\\n  indent`` (leading_ws=2 == body_indent=2) は tight
        sibling扱いで 2 segment emit のまま。

        ``results/test-runs.md`` 等で使われる mjs 互換 pattern。flatten は
        ``leading_ws > body_indent`` の場合のみなので、ここでは発動しない。
        """
        md = (
            "- 緑のバー - 合格\n"
            "- 赤のバー - 不合格\\\n"
            "  バーにカーソルを合わせると、その詳細が表示されます。\n\n"
        )
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["unordered-list-item", "unordered-list-item", "paragraph"]


class TestCallout:
    def test_note_callout_body_kind(self):
        md = ":::note\nInside note.\n:::\n"
        segs = extract_segments_from_markdown(md)
        assert len(segs) == 1
        assert segs[0]["segmentKind"] == "callout-body"
        assert segs[0]["textNorm"] == "inside note."

    def test_callout_with_title_attr(self):
        md = ':::note{title="重要"}\nBody here.\n:::\n'
        segs = extract_segments_from_markdown(md)
        callouts = [s for s in segs if s["segmentKind"] == "callout-body"]
        assert len(callouts) == 1
        assert callouts[0]["textNorm"] == "body here."

    def test_callout_close_restores_paragraph_kind(self):
        md = ":::warning\nWarn.\n:::\n\nAfter callout.\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["callout-body", "paragraph"]

    def test_all_callout_types_recognised(self):
        for callout_type in ("note", "warning", "info", "tip", "caution", "danger"):
            md = f":::{callout_type}\nBody.\n:::\n"
            segs = extract_segments_from_markdown(md)
            assert len(segs) == 1, f"{callout_type} not recognised"
            assert segs[0]["segmentKind"] == "callout-body"

    def test_list_inside_callout_keeps_list_kind(self):
        """``:::note`` 内の list item は ``unordered-list-item`` kind で emit される。

        ``paragraphKind`` state が ``callout-body`` に flip していても、list marker
        を検出したら ``_ORDERED_RE`` / ``_UNORDERED_RE`` match で list-item kind を
        emit する (``callout-body`` が list item に漏れ込まない契約)。EN
        ``walkCalloutBody`` と等価な挙動を pin する。
        """
        md = ":::note\nIntro paragraph.\n\n- item a\n- item b\n:::\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        # intro paragraph は callout-body、list items は unordered-list-item
        assert kinds == ["callout-body", "unordered-list-item", "unordered-list-item"]


class TestDetailsSummary:
    def test_single_line_details_summary(self):
        md = "<details><summary>Q</summary><p>body</p></details>\n"
        segs = extract_segments_from_markdown(md)
        summaries = [s for s in segs if s["segmentKind"] == "details-summary"]
        assert len(summaries) == 1
        assert summaries[0]["textNorm"] == "q"

    def test_loose_summary_delegates_to_en_walker(self):
        """``<summary>`` が ``<details>`` に囲まれていないとき EN walker に委譲する。"""
        md = "<summary>Loose summary</summary>\n"
        segs = extract_segments_from_markdown(md)
        # EN walker 経由で paragraph などに分類される
        assert len(segs) >= 1


class TestCodeFence:
    def test_backtick_fence_emits_code_block(self):
        md = "## X\n\n```js\nvar x = 1;\n```\n"
        segs = extract_segments_from_markdown(md)
        code_blocks = [s for s in segs if s["segmentKind"] == "code-block"]
        assert len(code_blocks) == 1
        assert "var x = 1;" in code_blocks[0]["textNorm"]

    def test_tilde_fence_emits_code_block(self):
        md = "## X\n\n~~~py\nprint(1)\n~~~\n"
        segs = extract_segments_from_markdown(md)
        code_blocks = [s for s in segs if s["segmentKind"] == "code-block"]
        assert len(code_blocks) == 1


class TestTable:
    def test_markdown_table_emits_tbody_cells(self):
        md = "| a | b |\n| - | - |\n| 1 | 2 |\n| 3 | 4 |\n"
        segs = extract_segments_from_markdown(md)
        cells = [s for s in segs if s["segmentKind"] == "table-cell"]
        # header row + separator 除外、data row 2 × 2 column = 4 cell
        assert [s["textNorm"] for s in cells] == ["1", "2", "3", "4"]

    def test_html_table_tbody_filter(self):
        md = (
            "<table>"
            "<thead><tr><th>H</th></tr></thead>"
            "<tbody><tr><td>Data1</td><td>Data2</td></tr></tbody>"
            "</table>\n"
        )
        segs = extract_segments_from_markdown(md)
        cells = [s for s in segs if s["segmentKind"] == "table-cell"]
        # thead は除外、tbody の td のみ
        assert [s["textNorm"] for s in cells] == ["data1", "data2"]

    def test_escaped_pipe_in_cell_preserved(self):
        md = "| a | b |\n| - | - |\n| pipe\\|here | normal |\n"
        segs = extract_segments_from_markdown(md)
        cells = [s for s in segs if s["segmentKind"] == "table-cell"]
        # backslash-escaped pipe は literal として残る
        assert any("pipe|here" == s["textNorm"] for s in cells)


class TestImage:
    def test_standalone_markdown_image_emits_image(self):
        md = "## X\n\n![alt text](/img.png)\n"
        segs = extract_segments_from_markdown(md)
        images = [s for s in segs if s["segmentKind"] == "image"]
        assert len(images) == 1

    def test_img_tag_emits_image(self):
        md = '## X\n\n<img src="/img.png" alt="A" />\n'
        segs = extract_segments_from_markdown(md)
        assert any(s["segmentKind"] == "image" for s in segs)


class TestHorizontalRule:
    def test_horizontal_rule_not_emitted(self):
        md = "## X\n\nBefore.\n\n---\n\nAfter.\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        # heading + 2 paragraphs、horizontal rule は emit されない
        assert kinds == ["heading", "paragraph", "paragraph"]


class TestListRegionEdgeCases:
    """Issue #368 flatten 後の境界条件を pin する regression guard。

    ``_ActiveListItem`` state machine は ``markerIndent >= bodyIndent`` /
    ``leadingWs > bodyIndent`` のときだけ flatten し、それ以外は line-based emit 相当
    の boundary flush を行う。本 class は以下の境界条件が正しく機能することを
    具体例で確認する:

    - top-level code fence (leading_ws == 0) → active list flush
    - top-level heading / callout / HTML table / details / image / horizontal rule
      (leading_ws == 0) → active list flush
    - 1-space indent content (leading_ws < body_indent) → active list flush + paragraph emit
    - 4-space indent list marker (CommonMark code-block 相当) → line-based emit で拾う
    - hard-break (``\\\\`` 末尾 + text indent == body_indent) → paragraph として emit
    """

    def test_list_ends_at_code_fence_inside_region(self):
        """list 途中に code fence が来ると region は閉じて code-block が emit。"""
        md = "- alpha\n\n```js\nvar x = 1;\n```\n\n- beta\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["unordered-list-item", "code-block", "unordered-list-item"]

    def test_indented_non_list_paragraph_after_list_not_absorbed(self):
        """list の後 blank 行 + 非 indent paragraph は list に吸収されない。"""
        md = "- item\n\nNon-indented paragraph.\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["unordered-list-item", "paragraph"]

    def test_list_then_heading_terminates_region(self):
        md = "- item\n\n## Section\n\nBody.\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["unordered-list-item", "heading", "paragraph"]

    def test_list_then_callout_terminates_region(self):
        md = "- item\n\n:::note\nBody.\n:::\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["unordered-list-item", "callout-body"]

    def test_list_then_standalone_image_terminates_region(self):
        md = "- item\n\n![alt](/x.png)\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["unordered-list-item", "image"]

    def test_list_then_horizontal_rule_terminates_region(self):
        md = "- item\n\n---\n\nAfter.\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        # horizontal rule 自体は emit されず、後続 paragraph だけ emit
        assert kinds == ["unordered-list-item", "paragraph"]

    def test_indented_fence_inside_list_separate_segments(self):
        """indented code fence は mjs では paragraph / code-block emit。

        Phase 2 では CommonMark flatten で list item に吸収していたが、Phase 6b で
        mjs line-based に合わせた。indented ``\\`\\`\\`js`` は top-level fence
        regex に match しないので paragraph 扱いになる。2-space indent の
        continuation text も paragraph。mjs と同じ 1 行 1 segment emit。
        """
        md = (
            "1. step one\n\n"
            "   ```js\n"
            "   var x = 1;\n"
            "   ```\n\n"
            "   continuation paragraph\n\n"
            "2. step two\n"
        )
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        # mjs: step one (bullet) → paragraph ('```js var x = 1; ```' のテキスト) →
        # paragraph (continuation) → step two (bullet)
        assert "ordered-list-item" in kinds
        assert "paragraph" in kinds
        # step one と step two が独立 segment
        bullets = [s for s in segs if s["segmentKind"] == "ordered-list-item"]
        assert len(bullets) == 2
        assert bullets[0]["textNorm"] == "step one"
        assert bullets[1]["textNorm"] == "step two"

    def test_one_space_indent_after_list_emits_paragraph(self):
        """blank 行 + 1-space indent の行は list continuation にならない。

        ``- item`` の body_indent=2、`` x`` の leading_ws=1 < 2 → flatten されず、
        で flatten されず、active list を flush して paragraph emit する。
        """
        md = "- item\n\n x\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["unordered-list-item", "paragraph"]
        assert segs[0]["textNorm"] == "item"
        assert segs[1]["textNorm"] == "x"

    def test_one_space_indent_after_ordered_list_emits_paragraph(self):
        md = "1. item\n\n x\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["ordered-list-item", "paragraph"]

    def test_four_space_indent_list_marker_mjs_fallback(self):
        """4-space indent された list marker は line-based で list-item 化。

        CommonMark は ``    - codeish`` を indented code block として扱うが、
        ``_UNORDERED_RE = ^(\\s*)[-*+]\\s+(.+)$`` は任意の leading whitespace を
        許容するため line-based emit で list-item として拾う (mjs 互換)。
        """
        md = "    - codeish\n"
        segs = extract_segments_from_markdown(md)
        assert len(segs) == 1
        assert segs[0]["segmentKind"] == "unordered-list-item"
        assert segs[0]["textNorm"] == "codeish"

    def test_four_space_indent_ordered_marker_mjs_fallback(self):
        md = "    1. codeish\n"
        segs = extract_segments_from_markdown(md)
        assert len(segs) == 1
        assert segs[0]["segmentKind"] == "ordered-list-item"
        assert segs[0]["textNorm"] == "codeish"

    def test_fallback_prefix_then_real_list(self):
        """4-space indent marker + top-level list の混在で両方 emit される。

        ``    - codeish`` は active_list が無い状態で line-based regex が拾い、
        新 active (body_indent=6) を作る。続く ``- real`` (indent=0) は body_indent=6
        を下回るため active_list flush + 新 active emit の 2 segment になる。
        """
        md = "    - codeish\n- real\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["unordered-list-item", "unordered-list-item"]
        assert [s["textNorm"] for s in segs] == ["codeish", "real"]

    def test_fallback_then_trailing_paragraph(self):
        """4-space indent marker の後に blank + 1-space indent content は別 segment。

        ``    - codeish\\n\\n x\\n``: ``    - codeish`` が list-item emit を発火、
        続く blank 行 peek で次の `` x`` を判定。``x`` の leading_ws=1 < body_indent=6
        → active flush + paragraph emit の 2 segment。
        """
        md = "    - codeish\n\n x\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["unordered-list-item", "paragraph"]
        assert segs[0]["textNorm"] == "codeish"
        assert segs[1]["textNorm"] == "x"

    def test_multi_fallback_prefix_and_real_list(self):
        """prefix に multiple 4-space fallback markers + 本 list の組合せ。"""
        md = "    - codeish\n    - more\n- real\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["unordered-list-item"] * 3
        assert [s["textNorm"] for s in segs] == ["codeish", "more", "real"]

    def test_hard_break_splits_list_item_and_paragraph(self):
        """``1. step\\`` + indented next line (indent == body_indent) は paragraph emit。

        ordered の body_indent=3、続く ``   Next sentence.`` の leading_ws=3 は
        marker ではなく text 行なので flatten 対象外 → active flush + paragraph
        emit の 2 segment になる。
        """
        md = "1. Step one\\\n   Next sentence.\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["ordered-list-item", "paragraph"]
        assert segs[0]["textNorm"] == "step one\\"
        assert segs[1]["textNorm"] == "next sentence."

    def test_top_level_fence_still_terminates_list_region(self):
        """top-level (non-indented) fence は list region を終了させる。

        indented fence は吸収するが、indent 0 の fence は list の直後の独立
        code block として emit する (CommonMark でも tight list の後に separate
        code block として扱われるケース)。
        """
        md = "- alpha\n- beta\n\n```js\ncode\n```\n\n- gamma\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == [
            "unordered-list-item",
            "unordered-list-item",
            "code-block",
            "unordered-list-item",
        ]

    def test_indented_table_inside_list_mjs_behavior(self):
        """indent された markdown table は line-based で table-cell emit される。

        ``_TABLE_ROW_RE = ^\\|.+\\|\\s*$`` は trimmed 行で match するため
        ``  | h1 | h2 |`` は match する。結果 table-cell として emit される
        (separator row skip、header row は次行が separator のため skip)。
        """
        md = "## X\n\n- item with table\n\n  | h1 | h2 |\n  | - | - |\n  | a | b |\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        # heading + list item + 2 table-cell (data row のみ; header / separator は skip)
        assert kinds[0] == "heading"
        assert "unordered-list-item" in kinds
        assert kinds.count("table-cell") == 2

    def test_list_with_blank_and_indented_content_line(self):
        """blank 行 + 4-space indent 行 は Issue #368 flatten で吸収される。

        ``- item`` の body_indent=2、``    indented-content-line`` の leading_ws=4
        は strictly > 2 → active list item に flatten される (EN
        ``<li><p>item</p><p>indented-content-line</p></li>`` と対称)。
        blank 行は peek-ahead で continuation と判定されて skip。
        """
        md = "- item\n\n    indented-content-line\n\nAfter paragraph.\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        # list-item (flattened "item indented-content-line") + paragraph
        assert kinds == ["unordered-list-item", "paragraph"]
        assert segs[0]["textNorm"] == "item indented-content-line"
        assert segs[1]["textNorm"] == "after paragraph."


class TestLooseSummaryENDelegation:
    """``<details>`` に囲まれていない ``<summary>`` を EN walker に委譲する契約。

    architect review M1: ``segments_ja`` → ``segments_en`` の cross-module
    依存を guard する。EN walker の return shape が変わった場合の silent
    regression を防ぐため、具体的な element children (paragraph + list +
    image) を loose ``<summary>`` inner に入れて、JA emitter 経由で適切な
    kind に分類されることを確認する。
    """

    def test_loose_summary_paragraph_inner(self):
        md = "<summary><p>Plain paragraph</p></summary>\n"
        segs = extract_segments_from_markdown(md)
        paragraphs = [s for s in segs if s["segmentKind"] == "paragraph"]
        assert len(paragraphs) == 1
        assert paragraphs[0]["textNorm"] == "plain paragraph"

    def test_loose_summary_mixed_inner(self):
        md = "<summary><p>Intro</p><ul><li>a</li><li>b</li></ul></summary>\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        # EN walker 経由で paragraph + 2 list-item が emit される
        assert "paragraph" in kinds
        assert kinds.count("unordered-list-item") == 2


class TestSectionPath:
    def test_nested_section_path(self):
        md = "## A\n\n### A1\n\npara1\n\n#### A1-1\n\npara2\n"
        segs = extract_segments_from_markdown(md)
        paragraphs = [s for s in segs if s["segmentKind"] == "paragraph"]
        assert paragraphs[0]["sectionPath"] == "A > A1"
        assert paragraphs[1]["sectionPath"] == "A > A1 > A1-1"

    def test_heading_stack_truncated_on_shallower_heading(self):
        md = "## A\n\n### A1\n\npara1\n\n## B\n\npara2\n"
        segs = extract_segments_from_markdown(md)
        paragraphs = [s for s in segs if s["segmentKind"] == "paragraph"]
        assert paragraphs[0]["sectionPath"] == "A > A1"
        assert paragraphs[1]["sectionPath"] == "B"
