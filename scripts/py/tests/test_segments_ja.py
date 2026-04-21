"""``testim_parity.segments_ja`` のユニットテスト。

cross-runtime byte parity は ``tests/conformance/test_segments_ja_parity.py``
が担保する。こちらは node 不在環境でも動く素早い iteration 用と、Issue #368
fix (nested list flattening) の explicit regression guard。
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


class TestIssue368NestedListFlattening:
    """Issue #368 の核心: nested list を top-level item 1 segment に flatten。"""

    def test_unordered_nested_flattens(self):
        md = "- Outer\n  - Nested A\n  - Nested B\n- Sibling\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        # 2 top-level items; nested 2 items are absorbed
        assert kinds == ["unordered-list-item", "unordered-list-item"]
        assert "outer" in segs[0]["textNorm"]
        assert "nested a" in segs[0]["textNorm"]
        assert "nested b" in segs[0]["textNorm"]
        assert segs[1]["textNorm"] == "sibling"

    def test_ordered_with_nested_unordered_flattens(self):
        md = "1. Outer step\n   - sub A\n   - sub B\n2. Next step\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["ordered-list-item", "ordered-list-item"]
        assert "outer step" in segs[0]["textNorm"]
        assert "sub a" in segs[0]["textNorm"]
        assert "sub b" in segs[0]["textNorm"]
        assert segs[1]["textNorm"] == "next step"

    def test_loose_list_multi_paragraph_merged(self):
        """loose list (blank line + indented paragraph) も 1 item に merge。

        これは ``administration/project-user-management.md`` 等 50+ ページで見られる
        パターン。mjs line-based 実装は continuation paragraph を別 segment として
        emit するため segment count が inflate する。
        """
        md = "1. First step.\n\n   Continuation paragraph.\n\n2. Second step.\n"
        segs = extract_segments_from_markdown(md)
        list_items = [s for s in segs if "list-item" in s["segmentKind"]]
        assert len(list_items) == 2
        assert "first step" in list_items[0]["textNorm"]
        assert "continuation paragraph" in list_items[0]["textNorm"]
        assert "second step" in list_items[1]["textNorm"]

    def test_flat_list_unchanged(self):
        """nest なしの list は従来通り 1 item = 1 segment。"""
        md = "- alpha\n- beta\n- gamma\n"
        segs = extract_segments_from_markdown(md)
        kinds = [s["segmentKind"] for s in segs]
        assert kinds == ["unordered-list-item"] * 3
        assert [s["textNorm"] for s in segs] == ["alpha", "beta", "gamma"]

    def test_list_segment_index_counter(self):
        """flatten 後も ``(sectionPath, kind)`` 毎の segmentIndex は連番。"""
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
