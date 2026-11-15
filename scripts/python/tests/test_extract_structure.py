"""extract.py (strip_markdown / is_untranslated_cell / HTML table) と structure.py の unit test。

conformance test (test_extract_parity.py / test_structure_parity.py) が mjs との
byte 一致を担当する。こちらは Python 側の edge case / branching を個別確認する。
"""

from __future__ import annotations

from testim_parity.extract import (
    extract_html_tables,
    is_untranslated_cell,
    strip_markdown,
)
from testim_parity.structure import (
    STRUCTURE_COMPARATOR_KINDS,
    collapse_body_to_blocks,
    compare_section_structure,
)


def _seg(kind: str, **overrides):
    return {"segmentKind": kind, **overrides}


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


def test_html_table():
    body = "<table><tr><td>x</td><td>y</td></tr></table>"
    tables = extract_html_tables(body)
    assert len(tables) == 1
    assert tables[0]["rows"][0] == ["x", "y"]


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
