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


class TestListEmit:
    """List handling — mjs line-based emit (Phase 6b cutover 契約)。

    Phase 2 の markdown-it-py flatten は 131 ページの parity drift を生むため
    撤回。mjs と同じ 1 行 1 segment emit に戻した (288 corpus に ``<li>`` nested は
    0 件のため flatten は不要、将来発生したら別 Issue で対応)。
    """

    def test_unordered_nested_emits_each_marker(self):
        md = "- Outer\n  - Nested A\n  - Nested B\n- Sibling\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        # mjs-style: 4 separate segments (nested markers emit individually)
        assert kinds == ["unordered-list-item"] * 4
        assert segs[0]["textNorm"] == "outer"
        assert segs[1]["textNorm"] == "nested a"
        assert segs[2]["textNorm"] == "nested b"
        assert segs[3]["textNorm"] == "sibling"

    def test_ordered_with_nested_unordered_emits_separately(self):
        md = "1. Outer step\n   - sub A\n   - sub B\n2. Next step\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        # ordered / unordered が混在しても kind は line-based で判定
        assert kinds == [
            "ordered-list-item",
            "unordered-list-item",
            "unordered-list-item",
            "ordered-list-item",
        ]
        assert segs[0]["textNorm"] == "outer step"
        assert segs[1]["textNorm"] == "sub a"
        assert segs[2]["textNorm"] == "sub b"
        assert segs[3]["textNorm"] == "next step"

    def test_loose_list_continuation_emits_as_paragraph(self):
        """blank line + indented paragraph は mjs では独立 paragraph segment。

        Python 側も paragraph fall-through で ``paragraph`` kind を emit する
        (Phase 6b: CommonMark flatten を撤回して mjs 挙動に合わせた)。
        """
        md = "1. First step.\n\n   Continuation paragraph.\n\n2. Second step.\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["ordered-list-item", "paragraph", "ordered-list-item"]
        assert segs[0]["textNorm"] == "first step."
        assert segs[1]["textNorm"] == "continuation paragraph."
        assert segs[2]["textNorm"] == "second step."

    def test_hard_break_continuation_emits_as_paragraph(self):
        """hard-break (``\\`` end + indented next line) も独立 paragraph。

        ``results/test-runs.md`` 等で使われる `-  bullet\\` + 2-space indent の
        pattern。Phase 2 の markdown-it-py は 1 item に merge していたが、
        mjs は 2 segment。Phase 6b で mjs 挙動に揃えた。
        """
        md = (
            "- 緑のバー - 合格\n"
            "- 赤のバー - 不合格\\\n"
            "  バーにカーソルを合わせると、その詳細が表示されます。\n\n"
        )
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["unordered-list-item", "unordered-list-item", "paragraph"]

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

        python-reviewer MEDIUM: ``paragraphKind`` state が ``callout-body`` に
        flip していても、list region handler は ``_flatten_list_region`` の
        markup から kind を決定するため、``callout-body`` が list item に漏れ
        込まない契約。Phase 3 alignment で list 粒度比較が壊れないよう、
        mjs と同じ挙動 (EN ``walkCalloutBody`` と等価) を明示的に test で pin。
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
    """``_collect_list_region`` が non-list content を誤吸収しないことを guard。

    architect review H1 / M2 指摘の edge case を記録する。``_LIST_REGION_TERMINATOR_RES``
    は heading / callout / code fence / HTML table / horizontal rule / details
    token / standalone image を terminator に含めるが、これらの組合せが
    list region 境界で正しく機能することを具体例で確認する。
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

        codex review P2 follow-up: ``- item\\n\\n x\\n`` のような 1-space indent
        paragraph は markdown-it-py が list 外の paragraph として parse する。
        以前の実装では region に含めていたが list-item だけ emit し paragraph
        を silent に drop していた。list_open.map で実際の list 範囲を特定し、
        残行を main loop に戻すことで paragraph を正しく emit する。
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
        """4-space indent された list marker は mjs fallback で list-item 化。

        codex review P2 follow-up: CommonMark は ``    - codeish`` を indented
        code block として扱い list_item token を emit しない。mjs line-based
        実装は ``_UNORDERED_RE.test(trimmed)`` で match して list-item emit
        するため、Python も silent drop せずに ``_emit_lines_as_mjs_fallback_list``
        で mjs と揃える。
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
        """4-space indent marker (CommonMark code) + real list (codex P2 follow-up).

        ``    - codeish\\n- real\\n`` ではmarkdown-it-py が前者を code_block、
        後者を list として parse する。prefix を mjs-style で emit してから、
        CommonMark 側の list を flatten 結果で emit し、全 3 lines を consume
        する契約。content を silent drop しない。
        """
        md = "    - codeish\n- real\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["unordered-list-item", "unordered-list-item"]
        assert [s["textNorm"] for s in segs] == ["codeish", "real"]

    def test_fallback_then_trailing_paragraph(self):
        """CommonMark が list を認識しないとき trailing content を drop しない。

        ``    - codeish\\n\\n x\\n`` は markdown-it-py が list を検出しない
        (code_block + paragraph)。現在行 ``    - codeish`` を mjs fallback で
        emit し、``i`` を 1 だけ進めることで次行以降を main loop に戻す。
        main loop は blank 行 + 1-space indent paragraph を正しく emit する
        (codex review P2 follow-up)。
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
        """``1. step\\`` + indented next line は mjs で 2 segment (bullet + paragraph)。

        Phase 2 の markdown-it-py は ``\\\\\\n`` を hardbreak として同じ item に
        merge していたが、mjs line-based では 2 行が独立 segment。Phase 6b で
        mjs 挙動に合わせる。
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
        """indent された markdown table は mjs line-based で table-cell emit される。

        mjs TABLE_ROW_RE は leading whitespace を許容せず ``^\\|`` で match する
        が、trimmed 行で match するため ``  | h1 | h2 |`` は match する。結果
        table-cell として emit される (separator row skip、header row は次行が
        separator のため skip)。Phase 2 では list item に吸収していたが Phase 6b
        で mjs に揃えた。
        """
        md = "## X\n\n- item with table\n\n  | h1 | h2 |\n  | - | - |\n  | a | b |\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        # heading + list item + 2 table-cell (data row のみ; header / separator は skip)
        assert kinds[0] == "heading"
        assert "unordered-list-item" in kinds
        assert kinds.count("table-cell") == 2

    def test_list_with_blank_and_indented_content_line(self):
        """4-space indent の "code-looking" 行は mjs で paragraph 扱い。

        mjs FENCE_RE は leading whitespace 非許容 + trimmed 使用のため、
        ``    indented-content-line`` は regex 非 match で paragraph_buf へ入り、
        blank 行で flush。Phase 2 の CommonMark 吸収を撤回して mjs に揃える。
        """
        md = "- item\n\n    indented-content-line\n\nAfter paragraph.\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        # mjs: list-item + paragraph (indented-content-line) + paragraph (After paragraph)
        assert kinds == ["unordered-list-item", "paragraph", "paragraph"]
        assert segs[0]["textNorm"] == "item"
        assert segs[1]["textNorm"] == "indented-content-line"
        assert segs[2]["textNorm"] == "after paragraph."


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
