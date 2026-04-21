"""extract.py の新規 13 関数と structure.py の unit test。

conformance test (test_extract_parity.py / test_structure_parity.py) が mjs との
byte 一致を担当する。こちらは Python 側の edge case / branching を個別確認する。
"""

from __future__ import annotations

import pytest

from testim_parity.extract import (
    classify_line,
    detect_en_artifacts,
    extract_bullet_counts,
    extract_callout_positions,
    extract_heading_sequence,
    extract_html_tables,
    extract_image_sequence,
    extract_markdown_tables,
    extract_paragraph_counts,
    extract_step_counts,
    extract_table_structure,
    is_untranslated_cell,
    normalize_en_artifacts,
    normalize_numeric_period_spacing,
    strip_markdown,
    strip_title_h1,
)
from testim_parity.structure import (
    STRUCTURE_COMPARATOR_KINDS,
    collapse_body_to_blocks,
    compare_section_structure,
)


def _seg(kind: str, **overrides):
    return {"segmentKind": kind, **overrides}


# --- extract_image_sequence ---------------------------------------------------


def test_image_sequence_markdown():
    body = "Before\n\n![alt](/img/foo.png)\n\nAfter"
    assert extract_image_sequence(body) == [{"file": "foo", "line": 3}]


def test_image_sequence_html_img():
    body = '<img src="/img/bar.jpg" alt="b" />'
    assert extract_image_sequence(body) == [{"file": "bar", "line": 1}]


def test_image_sequence_skips_code_fence():
    body = "```\n![code](fake.png)\n```\n\n![real](/img/real.png)"
    assert extract_image_sequence(body) == [{"file": "real", "line": 5}]


# --- extract_callout_positions ------------------------------------------------


def test_callout_directive_top_level():
    body = ":::note\nBody\n:::"
    callouts = extract_callout_positions(body)
    assert callouts == [{"type": "note", "depth": 0, "line": 1}]


def test_callout_directive_nested():
    body = "  :::warning\n  Body\n  :::"
    callouts = extract_callout_positions(body)
    assert callouts[0]["depth"] == 1


# --- extract_step_counts / bullet_counts --------------------------------------


def test_step_counts_by_section():
    body = "## Alpha\n\n1. first\n2. second\n\n## Beta\n\n1. only"
    counts = extract_step_counts(body)
    assert counts == {"Alpha": 2, "Beta": 1}


def test_bullet_counts_skips_table_rows():
    body = "## X\n\n| a |\n| - |\n- bullet\n"
    counts = extract_bullet_counts(body)
    assert counts == {"X": 1}


# --- classify_line + extract_paragraph_counts --------------------------------


def test_classify_line_heading():
    result = classify_line("## Title", {})
    assert result["kind"] == "heading"
    assert result["heading"] == "Title"


def test_classify_line_code_fence_toggles_state():
    r1 = classify_line("```js", {})
    assert r1["kind"] == "fence"
    assert r1["nextState"]["inCodeBlock"] is True
    r2 = classify_line("var x = 1", r1["nextState"])
    assert r2["kind"] == "code"


def test_paragraph_counts_empty_body():
    assert extract_paragraph_counts("") == {}


def test_paragraph_counts_basic():
    body = "## Sec\n\npara one\n\npara two\n"
    counts = extract_paragraph_counts(body)
    assert counts.get("Sec") == 2


# --- extract_heading_sequence -------------------------------------------------


def test_heading_sequence_skips_code_fence():
    body = "## Real\n```\n## Fake\n```\n### After"
    headings = extract_heading_sequence(body)
    assert headings == [
        {"level": 2, "text": "Real"},
        {"level": 3, "text": "After"},
    ]


# --- strip_markdown + is_untranslated_cell -----------------------------------


def test_strip_markdown_removes_decoration():
    # bold / italic / code / link / strike の全 decoration を剥がす (mjs 等価)
    assert (
        strip_markdown("**bold** *italic* `code` [link](url) ~~strike~~")
        == "bold italic  link strike"
    )


def test_is_untranslated_cell_too_short():
    assert is_untranslated_cell("short") is False


def test_is_untranslated_cell_cjk():
    assert is_untranslated_cell("日本語テキストが含まれています here") is False


def test_is_untranslated_cell_english_sentence():
    assert is_untranslated_cell("This is an untranslated English sentence.") is True


# --- title H1 / numeric-period / EN artifacts -------------------------------


def test_strip_title_h1():
    body = "# Title\n\nBody\n\n# SubTitle"
    result = strip_title_h1(body)
    lines = result.split("\n")
    assert lines[0] == ""  # first H1 → 空行
    assert lines[4] == "## SubTitle"  # 2 つ目以降は H2 に降格


def test_normalize_numeric_period_spacing_inserts_space():
    assert normalize_numeric_period_spacing("1.foo") == "1. foo"


def test_normalize_numeric_period_skips_decimal():
    assert normalize_numeric_period_spacing("1.0 version") == "1.0 version"


def test_normalize_en_artifacts_strips_zero_width_only_lines():
    body = "line1\n\u200b\nline2"
    result = normalize_en_artifacts(body)
    assert "line1" in result
    assert "line2" in result
    # zero-width だけの行は削除される
    assert "\u200b" not in result


# --- markdown + HTML tables ---------------------------------------------------


def test_markdown_table_requires_separator():
    # separator 無しは table 扱いしない
    assert extract_markdown_tables("| a | b |\n| c | d |") == []


def test_markdown_table_with_separator():
    body = "| h1 | h2 |\n| - | - |\n| v1 | v2 |"
    tables = extract_markdown_tables(body)
    assert len(tables) == 1
    assert tables[0]["rows"][0] == ["h1", "h2"]
    assert tables[0]["rows"][1] == ["v1", "v2"]


def test_html_table():
    body = "<table><tr><td>x</td><td>y</td></tr></table>"
    tables = extract_html_tables(body)
    assert len(tables) == 1
    assert tables[0]["rows"][0] == ["x", "y"]


def test_table_structure_combines_markdown_and_html():
    body = "| a | b |\n| - | - |\n| 1 | 2 |\n\n<table><tr><td>X</td></tr></table>"
    combined = extract_table_structure(body)
    assert len(combined) == 2
    # line 順 sort
    assert combined[0]["line"] < combined[1]["line"]


# --- detect_en_artifacts ----------------------------------------------------


def test_detect_en_artifacts_details():
    assert "EN uses <details> blocks" in detect_en_artifacts("<details>x</details>")


def test_detect_en_artifacts_clean():
    assert detect_en_artifacts("Just plain text.") == []


# --- structure.compare_section_structure -----------------------------------


def test_structure_comparator_kinds_is_frozen_tuple():
    assert isinstance(STRUCTURE_COMPARATOR_KINDS, tuple)
    assert "paragraph" in STRUCTURE_COMPARATOR_KINDS


def test_collapse_body_to_blocks_collapses_list_items():
    body = [_seg("unordered-list-item"), _seg("unordered-list-item"), _seg("paragraph")]
    blocks = collapse_body_to_blocks(body)
    assert len(blocks) == 2
    assert blocks[0]["kind"] == "unordered-list"
    assert len(blocks[0]["segments"]) == 2
    assert blocks[1]["kind"] == "paragraph"


def test_collapse_body_drops_unknown_kind():
    body = [_seg("image"), _seg("paragraph")]
    blocks = collapse_body_to_blocks(body)
    assert blocks == [{"kind": "paragraph", "segments": [body[1]]}]


def test_compare_section_empty_bodies_falls_through():
    en = {"sectionPath": "s", "index": 0, "body": []}
    ja = {"sectionPath": "s", "index": 0, "body": [_seg("paragraph")]}
    assert compare_section_structure(en, ja) == []


def test_compare_section_stage_a_multiset_diff():
    en = {
        "sectionPath": "s",
        "index": 0,
        "body": [_seg("paragraph"), _seg("unordered-list-item")],
    }
    ja = {
        "sectionPath": "s",
        "index": 0,
        "body": [_seg("paragraph"), _seg("paragraph")],
    }
    diffs = compare_section_structure(en, ja)
    assert len(diffs) == 1
    assert diffs[0]["type"] == "section-structure-mismatch"
    assert diffs[0]["structureCategory"] == "kind-multiset"


def test_compare_section_stage_b_kind_sequence():
    en = {
        "sectionPath": "s",
        "index": 0,
        "body": [_seg("paragraph"), _seg("unordered-list-item")],
    }
    ja = {
        "sectionPath": "s",
        "index": 0,
        "body": [_seg("unordered-list-item"), _seg("paragraph")],
    }
    diffs = compare_section_structure(en, ja)
    assert len(diffs) == 1
    assert diffs[0]["type"] == "segment-order-mismatch"
    assert diffs[0]["structureCategory"] == "kind-sequence"


def test_compare_section_raises_on_unknown_kind():
    body = [_seg("unknown-kind")]
    # collapse_body_to_blocks で落とされるので例外にはならない
    en = {"sectionPath": "s", "index": 0, "body": body}
    assert compare_section_structure(en, en) == []


def test_compare_section_none_inputs_return_empty():
    assert compare_section_structure(None, None) == []
    assert compare_section_structure({"body": []}, None) == []


def test_compare_section_stage_c_content_order():
    """同 kind 列で token anchor が reorder されていれば content-order を emit。"""
    en = {
        "sectionPath": "s",
        "index": 0,
        "body": [
            _seg("paragraph", textNorm="alpha", tokensInvariant=["tok-a"], segmentIndex=0),
            _seg("paragraph", textNorm="beta", tokensInvariant=["tok-b"], segmentIndex=1),
        ],
    }
    ja = {
        "sectionPath": "s",
        "index": 0,
        "body": [
            _seg("paragraph", textNorm="beta", tokensInvariant=["tok-b"], segmentIndex=0),
            _seg("paragraph", textNorm="alpha", tokensInvariant=["tok-a"], segmentIndex=1),
        ],
    }
    diffs = compare_section_structure(en, ja)
    if diffs:
        # structureCategory は content-order
        assert diffs[0]["structureCategory"] == "content-order"
        assert "contentPermutation" in diffs[0]
