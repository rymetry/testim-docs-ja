"""mutation_corpus.py の unit test。

conformance test (test_mutation_corpus_parity.py) が mjs との byte 一致を
担当するので、ここでは Python 側の挙動契約 (classify_lines / block extent
helper / 10 種類の mutation function / 9-type recall) の動作を確認する。

test scope:
- classify_lines: frontmatter / code / callout / heading / bullet / step /
  table / image / details/summary 分類
- list_item_block_end / paragraph_block_range: block 抽出 helper
- 10 mutation functions: delete_paragraph / delete_bullet / delete_step /
  delete_callout_paragraph / delete_table_cell / delete_html_table_cell /
  move_segment / insert_en_residual / drop_invariant_token / swap_section_bodies
- generate_all_mutations / generate_corpus: 統合
"""

from __future__ import annotations

from typing import Any

import pytest

from testim_parity.mutation_corpus import (
    MUTATION_TYPES,
    classify_lines,
    delete_bullet,
    delete_callout_paragraph,
    delete_html_table_cell,
    delete_paragraph,
    delete_step,
    delete_table_cell,
    drop_invariant_token,
    generate_all_mutations,
    generate_corpus,
    insert_en_residual,
    list_item_block_end,
    move_segment,
    paragraph_block_range,
    swap_section_bodies,
)

# ---------------------------------------------------------------------------
# classify_lines
# ---------------------------------------------------------------------------


def test_classify_frontmatter() -> None:
    md = "---\ntitle: Test\n---\n\nHello world"
    lines = classify_lines(md)
    assert lines[0]["kind"] == "frontmatter"
    assert lines[1]["kind"] == "frontmatter"
    assert lines[2]["kind"] == "frontmatter"
    assert lines[3]["kind"] == "blank"
    assert lines[4]["kind"] == "paragraph"


def test_classify_code_blocks() -> None:
    lines = classify_lines("```shell\nnpm run test\n```")
    assert lines[0]["kind"] == "code-fence"
    assert lines[1]["kind"] == "code"
    assert lines[2]["kind"] == "code-fence"


def test_classify_callouts() -> None:
    lines = classify_lines(':::note{title="Info"}\nSome note text\n:::')
    assert lines[0]["kind"] == "callout-open"
    assert lines[1]["kind"] == "callout-body"
    assert lines[2]["kind"] == "callout-close"


def test_classify_headings_bullets_steps_tables() -> None:
    lines = classify_lines("## Section\n\n- bullet\n1. step\n| col1 | col2 |")
    assert lines[0]["kind"] == "heading"
    assert lines[1]["kind"] == "blank"
    assert lines[2]["kind"] == "bullet"
    assert lines[3]["kind"] == "step"
    assert lines[4]["kind"] == "table"


def test_classify_images() -> None:
    lines = classify_lines('![alt](/path.png)\n<Image src="/path.png" />')
    assert lines[0]["kind"] == "image"
    assert lines[1]["kind"] == "image"


def test_classify_details_summary() -> None:
    lines = classify_lines("<details>\n<summary>Title</summary>\nContent\n</details>")
    assert lines[0]["kind"] == "details-open"
    assert lines[1]["kind"] == "summary"
    assert lines[2]["kind"] == "paragraph"
    assert lines[3]["kind"] == "details-close"


def test_bullets_inside_callouts_classified_as_callout_body() -> None:
    lines = classify_lines(":::note\n- item inside callout\n:::")
    assert lines[1]["kind"] == "callout-body"


def test_classify_html_img_case_insensitive() -> None:
    lines = classify_lines('<img src="/x.png" />\n<IMG src="/y.png" />')
    assert lines[0]["kind"] == "image"
    assert lines[1]["kind"] == "image"


# ---------------------------------------------------------------------------
# list_item_block_end / paragraph_block_range
# ---------------------------------------------------------------------------


def test_list_item_block_end_includes_continuation() -> None:
    lines = ["- item A", "  continuation", "- item B"]
    assert list_item_block_end(lines, 0) == 2


def test_list_item_block_end_includes_child_items() -> None:
    lines = ["- parent", "  - child", "    grandchild", "- sibling"]
    assert list_item_block_end(lines, 0) == 3


def test_list_item_block_end_includes_blank_between_continuations() -> None:
    lines = ["1. step one", "", "   continuation after blank", "2. step two"]
    assert list_item_block_end(lines, 0) == 3


def test_list_item_block_end_stops_at_same_indent_sibling() -> None:
    lines = ["- A", "- B"]
    assert list_item_block_end(lines, 0) == 1


def test_list_item_block_end_stops_at_blank_followed_by_same_indent() -> None:
    lines = ["- item", "", "paragraph at indent 0"]
    assert list_item_block_end(lines, 0) == 1


def test_list_item_block_end_numbered_with_backslash_continuations() -> None:
    lines = [
        "4. グリッドで選択します:\\",
        "   [仮想モバイルグリッド](/docs/link1)\\",
        "   [Device Cloud](/docs/link2)",
        "",
        "5. 次のステップ",
    ]
    assert list_item_block_end(lines, 0) == 3


def test_paragraph_block_range_single_line() -> None:
    classified = classify_lines("## H\n\nSingle paragraph\n\n## H2")
    para_idx = next(i for i, le in enumerate(classified) if le["kind"] == "paragraph")
    start, end = paragraph_block_range(classified, para_idx)
    assert start == 2
    assert end == 3


def test_paragraph_block_range_multi_line() -> None:
    classified = classify_lines("Line one\nLine two\nLine three\n\nSeparate")
    start, end = paragraph_block_range(classified, 0)
    assert start == 0
    assert end == 3


# ---------------------------------------------------------------------------
# delete_paragraph
# ---------------------------------------------------------------------------


def test_delete_paragraph_removes_single_line() -> None:
    md = "---\ntitle: T\n---\n\nFirst paragraph\n\nSecond paragraph\n\n## Section"
    result = delete_paragraph(md)
    assert result is not None
    assert result["metadata"]["type"] == "paragraph-delete"
    assert result["metadata"]["linesRemoved"] == 1


def test_delete_paragraph_removes_multi_line_block() -> None:
    md = "Line one of para\nLine two of para\n\nSeparate paragraph"
    result = delete_paragraph(md, 0)
    assert result is not None
    assert result["metadata"]["linesRemoved"] == 2
    assert "Line one" not in result["mutated"]
    assert "Line two" not in result["mutated"]
    assert "Separate paragraph" in result["mutated"]


def test_delete_paragraph_returns_none_when_no_paragraphs() -> None:
    assert delete_paragraph("---\ntitle: T\n---\n\n## Only heading") is None


def test_delete_paragraph_nth_selects_different_blocks() -> None:
    md = "Para A\n\nPara B\n\nPara C"
    r0 = delete_paragraph(md, 0)
    r1 = delete_paragraph(md, 1)
    assert r0 is not None
    assert r1 is not None
    assert r0["metadata"]["lineIndex"] != r1["metadata"]["lineIndex"]


# ---------------------------------------------------------------------------
# delete_bullet
# ---------------------------------------------------------------------------


def test_delete_bullet_simple() -> None:
    md = "- item 1\n- item 2\n- item 3"
    result = delete_bullet(md)
    assert result is not None
    assert result["metadata"]["type"] == "bullet-delete"
    assert result["metadata"]["linesRemoved"] == 1


def test_delete_bullet_with_continuation() -> None:
    md = "- parent item\n  continuation line\n  more continuation\n- sibling"
    result = delete_bullet(md, 0)
    assert result is not None
    assert result["metadata"]["linesRemoved"] == 3
    assert "parent item" not in result["mutated"]
    assert "continuation" not in result["mutated"]
    assert "sibling" in result["mutated"]


def test_delete_bullet_with_child_items() -> None:
    md = "- parent\n  - child A\n  - child B\n- next"
    result = delete_bullet(md, 0)
    assert result is not None
    assert result["metadata"]["linesRemoved"] == 3
    assert "next" in result["mutated"]


def test_delete_bullet_returns_none_when_no_bullets() -> None:
    assert delete_bullet("## Heading\n\nA paragraph") is None


def test_delete_bullet_does_not_target_callout_bullets() -> None:
    md = ":::note\n- callout bullet\n:::\n\n- regular bullet"
    result = delete_bullet(md)
    assert result is not None
    assert "regular bullet" in result["metadata"]["originalText"]


# ---------------------------------------------------------------------------
# delete_step
# ---------------------------------------------------------------------------


def test_delete_step_simple() -> None:
    md = "1. First step\n2. Second step\n3. Third step"
    result = delete_step(md)
    assert result is not None
    assert result["metadata"]["type"] == "step-delete"
    assert result["metadata"]["linesRemoved"] == 1
    assert "First step" not in result["mutated"]


def test_delete_step_with_continuation() -> None:
    md = "\n".join(
        [
            "1. Step with details",
            "   Continuation line one",
            "   Continuation line two",
            "2. Next step",
        ]
    )
    result = delete_step(md, 0)
    assert result is not None
    assert result["metadata"]["linesRemoved"] == 3
    assert "Step with details" not in result["mutated"]
    assert "Continuation" not in result["mutated"]
    assert "Next step" in result["mutated"]


def test_delete_step_with_nested_bullets() -> None:
    md = "\n".join(["1. Setup:", "   - Sub-item A", "   - Sub-item B", "2. Execute"])
    result = delete_step(md, 0)
    assert result is not None
    assert result["metadata"]["linesRemoved"] == 3
    assert "Execute" in result["mutated"]


def test_delete_step_returns_none_when_no_steps() -> None:
    assert delete_step("- bullet\n- only") is None


def test_delete_step_nth_selects_different_steps() -> None:
    md = "1. A\n2. B\n3. C"
    r0 = delete_step(md, 0)
    r1 = delete_step(md, 1)
    assert r0 is not None
    assert r1 is not None
    assert r0["metadata"]["lineIndex"] != r1["metadata"]["lineIndex"]


# ---------------------------------------------------------------------------
# delete_callout_paragraph
# ---------------------------------------------------------------------------


def test_delete_callout_paragraph_plain_text() -> None:
    md = ":::note\nCallout paragraph text\n:::"
    result = delete_callout_paragraph(md)
    assert result is not None
    assert result["metadata"]["type"] == "callout-paragraph-delete"
    assert "Callout paragraph text" not in result["mutated"]


def test_delete_callout_paragraph_numbered_step_sibling_scope() -> None:
    md = "\n".join(
        [
            ":::warning",
            "手順が必要です:",
            "",
            "1. 最初のステップ",
            "2. 次のステップ",
            "3. 最後のステップ",
            ":::",
        ]
    )
    # candidate index 1 = "1. 最初のステップ"
    result = delete_callout_paragraph(md, 1)
    assert result is not None
    assert result["metadata"]["linesRemoved"] == 1
    assert "最初のステップ" not in result["mutated"]
    assert "次のステップ" in result["mutated"]
    assert "最後のステップ" in result["mutated"]


def test_delete_callout_paragraph_step_with_continuation() -> None:
    md = "\n".join(
        [
            ":::warning",
            "1. ステップ本文",
            "   continuation line",
            "2. 次のステップ",
            ":::",
        ]
    )
    result = delete_callout_paragraph(md, 0)
    assert result is not None
    assert result["metadata"]["linesRemoved"] == 2
    assert "ステップ本文" not in result["mutated"]
    assert "continuation" not in result["mutated"]
    assert "次のステップ" in result["mutated"]


def test_delete_callout_paragraph_bullet_block() -> None:
    md = "\n".join([":::note", "- bullet A", "  continuation", "- bullet B", ":::"])
    result = delete_callout_paragraph(md, 0)
    assert result is not None
    assert result["metadata"]["linesRemoved"] == 2
    assert "bullet B" in result["mutated"]


def test_delete_callout_paragraph_does_not_cross_boundary() -> None:
    md = "\n".join([":::note", "1. step inside", ":::", "", "1. step outside"])
    result = delete_callout_paragraph(md, 0)
    assert result is not None
    assert result["metadata"]["linesRemoved"] == 1
    assert "step outside" in result["mutated"]


def test_delete_callout_paragraph_returns_none_without_callout() -> None:
    assert delete_callout_paragraph("## Heading\n\nRegular text") is None


# ---------------------------------------------------------------------------
# delete_table_cell
# ---------------------------------------------------------------------------


def test_delete_table_cell_empties_data_row() -> None:
    md = "| H1 | H2 |\n| --- | --- |\n| data1 | data2 |"
    result = delete_table_cell(md)
    assert result is not None
    data_row = result["mutated"].split("\n")[2]
    assert "| |" in data_row or "|  |" in data_row


def test_delete_table_cell_skips_header_and_separator() -> None:
    md = "| H1 | H2 |\n| --- | --- |\n| data1 | data2 |"
    result = delete_table_cell(md)
    assert result is not None
    assert result["metadata"]["lineIndex"] == 2


def test_delete_table_cell_returns_none_without_pipe_tables() -> None:
    assert delete_table_cell("No tables here") is None


def test_delete_table_cell_returns_none_header_only() -> None:
    assert delete_table_cell("| col1 | col2 |") is None


# ---------------------------------------------------------------------------
# delete_html_table_cell
# ---------------------------------------------------------------------------


def test_delete_html_table_cell_empties_non_empty_td() -> None:
    md = "<table>\n<tr>\n<td>\nContent here\n</td>\n</tr>\n</table>"
    result = delete_html_table_cell(md)
    assert result is not None
    assert result["metadata"]["type"] == "html-table-cell-delete"
    assert "Content here" not in result["mutated"]
    assert "<td>" in result["mutated"]
    assert "</td>" in result["mutated"]


def test_delete_html_table_cell_skips_already_empty() -> None:
    md = "<table><tr><td></td><td>Real content</td></tr></table>"
    result = delete_html_table_cell(md)
    assert result is not None
    assert result["metadata"]["originalText"] == "Real content"


def test_delete_html_table_cell_handles_links() -> None:
    md = '<td>\n<a href="/docs/test">テスト</a>\n</td>'
    result = delete_html_table_cell(md)
    assert result is not None
    assert "テスト" in result["metadata"]["originalText"]


def test_delete_html_table_cell_returns_none_without_html() -> None:
    assert delete_html_table_cell("No HTML tables") is None


def test_delete_html_table_cell_nth_selects_different_cells() -> None:
    md = "<td>Cell A</td>\n<td>Cell B</td>"
    r0 = delete_html_table_cell(md, 0)
    r1 = delete_html_table_cell(md, 1)
    assert r0 is not None
    assert r1 is not None
    assert r0["metadata"]["originalText"] != r1["metadata"]["originalText"]


# ---------------------------------------------------------------------------
# move_segment
# ---------------------------------------------------------------------------


def test_move_segment_swaps_two_single_line_paragraphs() -> None:
    result = move_segment("Para A\n\nPara B")
    assert result is not None
    lines = result["mutated"].split("\n")
    assert lines[0] == "Para B"
    assert lines[2] == "Para A"


def test_move_segment_swaps_multi_line_blocks() -> None:
    md = "Line A1\nLine A2\n\nPara B"
    result = move_segment(md)
    assert result is not None
    lines = result["mutated"].split("\n")
    assert lines[0] == "Para B"
    assert lines[1] == ""
    assert lines[2] == "Line A1"
    assert lines[3] == "Line A2"


def test_move_segment_does_not_swap_within_same_block() -> None:
    # Only 1 paragraph block → no pair → None
    assert move_segment("Line one\nLine two") is None


@pytest.mark.parametrize(
    "md",
    [
        "Para A\n\n## Heading\n\nPara B",
        "Para A\n\n```\ncode\n```\n\nPara B",
        "Para A\n\n![alt](/img.png)\n\nPara B",
        "Para A\n\n| H |\n| - |\n| d |\n\nPara B",
    ],
)
def test_move_segment_rejects_cross_structure(md: str) -> None:
    assert move_segment(md) is None


def test_move_segment_returns_none_for_identical_blocks() -> None:
    assert move_segment("Same text\n\nSame text") is None


def test_move_segment_preserves_gap_lines() -> None:
    md = "Block A\n\n\n\nBlock B"
    result = move_segment(md)
    assert result is not None
    assert len(result["mutated"].split("\n")) == len(md.split("\n"))


# ---------------------------------------------------------------------------
# insert_en_residual
# ---------------------------------------------------------------------------


def test_insert_en_residual_replaces_ja_paragraph() -> None:
    result = insert_en_residual("テストの実行方法を学習してください\n\n別の段落")
    assert result is not None
    assert "Click on the Settings button" in result["mutated"]
    assert "テストの実行方法" not in result["mutated"]


def test_insert_en_residual_returns_none_when_no_cjk() -> None:
    assert insert_en_residual("Only English text here") is None


def test_insert_en_residual_replaces_multi_line_block() -> None:
    md = "段落の1行目\n段落の2行目\n\n次の段落"
    result = insert_en_residual(md, 0)
    assert result is not None
    assert "段落の1行目" not in result["mutated"]
    assert "段落の2行目" not in result["mutated"]
    assert "次の段落" in result["mutated"]
    assert result["metadata"]["lineIndex"] == 0
    assert result["metadata"]["linesRemoved"] == 1


def test_insert_en_residual_nth_targets_blocks_not_lines() -> None:
    md = "段落A 1行目\n段落A 2行目\n\n段落B 単独行"
    r0 = insert_en_residual(md, 0)
    r1 = insert_en_residual(md, 1)
    assert r0 is not None
    assert r1 is not None
    assert r0["metadata"]["lineIndex"] == 0
    assert r1["metadata"]["lineIndex"] == 3


def test_insert_en_residual_handles_end_of_file() -> None:
    md = "# 見出し\n\n末尾の段落"
    result = insert_en_residual(md, 0)
    assert result is not None
    assert "Click on the Settings button" in result["mutated"]
    assert "末尾の段落" not in result["mutated"]
    assert result["metadata"]["linesRemoved"] == 0


def test_insert_en_residual_en_first_block_with_cjk() -> None:
    md = "Mobile Test Library\\\nテストライブラリの説明\n\n別の段落です"
    result = insert_en_residual(md, 0)
    assert result is not None
    assert "Mobile Test Library" not in result["mutated"]
    assert "テストライブラリの説明" not in result["mutated"]
    assert "別の段落" in result["mutated"]
    assert result["metadata"]["lineIndex"] == 0
    assert result["metadata"]["linesRemoved"] == 1


# ---------------------------------------------------------------------------
# drop_invariant_token
# ---------------------------------------------------------------------------


def test_drop_invariant_token_cli_flag() -> None:
    result = drop_invariant_token("CLI で _--turbo-mode_ を使用します。")
    assert result is not None
    assert "--turbo-mode" not in result["mutated"]


def test_drop_invariant_token_prefers_backtick_wrapped() -> None:
    result = drop_invariant_token("`--parallel` オプションを指定", 0)
    assert result is not None
    assert result["metadata"]["originalText"] == "`--parallel`"


def test_drop_invariant_token_url() -> None:
    result = drop_invariant_token("詳細は https://example.com/docs を参照")
    assert result is not None
    assert result["metadata"]["originalText"] == "https://example.com/docs"


def test_drop_invariant_token_skips_code_blocks() -> None:
    assert drop_invariant_token("```\n--token value\n```\n\nNormal text") is None


def test_drop_invariant_token_skips_image_lines() -> None:
    assert drop_invariant_token("![alt](https://example.com/img.png)\n\nテキスト") is None


# ---------------------------------------------------------------------------
# swap_section_bodies
# ---------------------------------------------------------------------------


def test_swap_section_bodies_two_adjacent_h2() -> None:
    md = "\n".join(
        [
            "## セクション A",
            "",
            "A の段落です。",
            "",
            "## セクション B",
            "",
            "B の段落です。",
        ]
    )
    result = swap_section_bodies(md, 0)
    assert result is not None
    assert result["metadata"]["type"] == "section-body-swap"
    lines = result["mutated"].split("\n")
    heading_lines = [le for le in lines if le.startswith("## ")]
    assert heading_lines == ["## セクション A", "## セクション B"]
    a_idx = lines.index("## セクション A")
    b_idx = lines.index("## セクション B")
    assert any(le == "B の段落です。" for le in lines[a_idx:b_idx])
    assert any(le == "A の段落です。" for le in lines[b_idx:])


def test_swap_section_bodies_returns_none_without_adjacent_pair() -> None:
    md = "## Only one section\n\nbody"
    assert swap_section_bodies(md, 0) is None


def test_swap_section_bodies_skips_h1() -> None:
    md = "\n".join(
        [
            "# Title",
            "",
            "preface body",
            "",
            "## Section A",
            "",
            "A body",
            "",
            "## Section B",
            "",
            "B body",
        ]
    )
    result = swap_section_bodies(md, 0)
    assert result is not None
    assert result["mutated"].startswith("# Title")


# ---------------------------------------------------------------------------
# generate_all_mutations / generate_corpus (integration)
# ---------------------------------------------------------------------------


def _rich_document() -> str:
    return "\n".join(
        [
            "---",
            "title: Test",
            "---",
            "",
            "テストの概要です。",
            "",
            "- bullet item 1",
            "- bullet item 2",
            "",
            "1. first step",
            "2. second step",
            "",
            ":::note",
            "callout の内容です。",
            ":::",
            "",
            "| H1 | H2 |",
            "| --- | --- |",
            "| data1 | data2 |",
            "",
            "<table><tr><td>HTML cell</td></tr></table>",
            "",
            "`--flag` を使います。",
        ]
    )


def test_generate_all_mutations_rich_document() -> None:
    md = _rich_document()
    mutations = generate_all_mutations(md)
    # 10 type 中 >=7 が生成される (rich document)
    assert len(mutations) >= 7
    for type_name, result in mutations.items():
        assert result["metadata"]["type"] == type_name
        assert result["mutated"] != md


def test_generate_corpus_multiple_unique_mutations() -> None:
    md = "\n".join(
        [
            "Para A です。",
            "",
            "Para B です。",
            "",
            "Para C です。",
            "",
            "- bullet 1",
            "- bullet 2",
            "- bullet 3",
        ]
    )
    corpus = generate_corpus(md, 3)
    paragraphs = corpus.get("paragraph-delete")
    assert paragraphs is not None
    assert len(paragraphs) >= 2
    indices = [m["metadata"]["lineIndex"] for m in paragraphs]
    assert len(indices) == len(set(indices))


def test_generate_corpus_respects_type_order() -> None:
    """MUTATION_TYPES 挿入順が corpus の key 順に一致する (dict 3.7+)。"""
    md = _rich_document()
    corpus = generate_corpus(md, 1)
    expected_order = list(MUTATION_TYPES.keys())
    actual_order = list(corpus.keys())
    # 発生した key subset の順序が insertion order に一致
    for i in range(len(actual_order) - 1):
        a_pos = expected_order.index(actual_order[i])
        b_pos = expected_order.index(actual_order[i + 1])
        assert a_pos < b_pos


def test_mutation_types_registry_has_ten_entries() -> None:
    """10 種類の mutation function が registered (9/9 recall + segment-move)。"""
    assert len(MUTATION_TYPES) == 10
    expected = {
        "paragraph-delete",
        "bullet-delete",
        "step-delete",
        "callout-paragraph-delete",
        "table-cell-delete",
        "html-table-cell-delete",
        "segment-move",
        "section-body-swap",
        "en-residual",
        "token-drop",
    }
    assert set(MUTATION_TYPES.keys()) == expected


@pytest.mark.parametrize("type_name", list(MUTATION_TYPES.keys()))
def test_each_mutation_function_returns_expected_shape(type_name: str) -> None:
    """10 種類の mutation function が rich document で valid shape を返す (または None)。"""
    md = _rich_document()
    fn = MUTATION_TYPES[type_name]
    result: Any = fn(md, 0)
    if result is None:
        return
    assert set(result.keys()) == {"mutated", "metadata"}
    metadata = result["metadata"]
    assert metadata["type"] == type_name
    assert isinstance(metadata["lineIndex"], int)
    assert isinstance(metadata["linesRemoved"], int)
    assert isinstance(metadata["originalText"], str)
    assert isinstance(metadata["description"], str)


def test_generate_all_mutations_integration_lines_removed_invariant() -> None:
    """各 mutation の linesRemoved が実際の line diff と一致する (in-place mutation を除く)。"""
    md = _rich_document()
    mutations = generate_all_mutations(md)
    in_place_types = {"segment-move", "table-cell-delete", "token-drop", "html-table-cell-delete"}
    for type_name, result in mutations.items():
        original_lines = len(md.split("\n"))
        mutated_lines = len(result["mutated"].split("\n"))
        lines_removed = result["metadata"]["linesRemoved"]
        if type_name in in_place_types:
            assert lines_removed == 0, f"{type_name}: in-place mutation"
        else:
            assert original_lines - mutated_lines == lines_removed, (
                f"{type_name}: linesRemoved={lines_removed} "
                f"vs actual diff={original_lines - mutated_lines}"
            )
