"""structure.py の unit test。

Canonical block-sequence structure comparator の 3 stage 挙動を pin する。
conformance test (``test_structure_parity.py``) は mjs との byte-identical
parity を担当。こちらは Stage A/B/C の precedence、payload schema contract、
STRUCTURE_COMPARATOR_KINDS 語彙 freeze の regression guard を pytest 側で own する。

Phase 5 gap-fill (source_parity_structure.test.mjs port): mjs 側 29 個の
``it`` block から代表 22 ケースを選抜。
"""

from __future__ import annotations

from typing import Any

import pytest

from testim_parity.structure import (
    STRUCTURE_COMPARATOR_KINDS,
    collapse_body_to_blocks,
    compare_section_structure,
)

# ---------------------------------------------------------------------------
# ヘルパー
# ---------------------------------------------------------------------------


def _make_seg(section_path: str, kind: str, index: int, raw_text: str) -> dict:
    from testim_parity.segments_shared import create_segment

    return create_segment(
        section_path=section_path,
        kind=kind,
        segment_index=index,
        raw_text=raw_text,
    )


def _make_section(
    *,
    index: int = 0,
    section_path: str = "Overview",
    body: list[dict] | None = None,
) -> dict[str, Any]:
    return {
        "index": index,
        "sectionPath": section_path,
        "headingText": section_path.lower(),
        "body": body or [],
    }


def _single_diff(result: list[dict]) -> dict:
    assert isinstance(result, list)
    assert len(result) == 1, f"expected exactly 1 diff, got {len(result)}"
    return result[0]


# ---------------------------------------------------------------------------
# Stage A — kind-multiset (section-structure-mismatch)
# ---------------------------------------------------------------------------


def test_stage_a_paragraph_merge() -> None:
    """3 EN paragraphs → 1 JA paragraph → kind-multiset mismatch。"""
    en = _make_section(
        body=[
            _make_seg("Overview", "paragraph", 0, "First `CLI`."),
            _make_seg("Overview", "paragraph", 1, "Second `network-logs`."),
            _make_seg("Overview", "paragraph", 2, "Third `flag`."),
        ]
    )
    ja = _make_section(
        body=[_make_seg("Overview", "paragraph", 0, "CLI と network-logs と flag を 1 段落に")]
    )
    diff = _single_diff(compare_section_structure(en, ja))
    assert diff["type"] == "section-structure-mismatch"
    assert diff["structureCategory"] == "kind-multiset"
    assert diff["enKinds"] == ["paragraph", "paragraph", "paragraph"]
    assert diff["jaKinds"] == ["paragraph"]
    assert diff["enSegmentCount"] == 3
    assert diff["jaSegmentCount"] == 1


def test_stage_a_paragraph_split() -> None:
    en = _make_section(body=[_make_seg("Overview", "paragraph", 0, "EN `token-a`.")])
    ja = _make_section(
        body=[
            _make_seg("Overview", "paragraph", 0, "分割 1"),
            _make_seg("Overview", "paragraph", 1, "分割 2"),
            _make_seg("Overview", "paragraph", 2, "分割 3"),
        ]
    )
    diff = _single_diff(compare_section_structure(en, ja))
    assert diff["structureCategory"] == "kind-multiset"
    assert diff["enKinds"] == ["paragraph"]
    assert diff["jaKinds"] == ["paragraph", "paragraph", "paragraph"]


def test_stage_a_list_to_paragraph_collapse() -> None:
    """連続 list item は 1 unordered-list block に畳まれる (segment kind ではない)。"""
    en = _make_section(
        body=[
            _make_seg("Overview", "unordered-list-item", 0, "- `token-a`"),
            _make_seg("Overview", "unordered-list-item", 1, "- `token-b`"),
            _make_seg("Overview", "unordered-list-item", 2, "- `token-c`"),
        ]
    )
    ja = _make_section(body=[_make_seg("Overview", "paragraph", 0, "リストを段落に token-a/b/c")])
    diff = _single_diff(compare_section_structure(en, ja))
    assert diff["type"] == "section-structure-mismatch"
    assert diff["enKinds"] == ["unordered-list"]
    assert diff["jaKinds"] == ["paragraph"]


def test_stage_a_ordered_to_unordered_list() -> None:
    en = _make_section(
        body=[
            _make_seg("Overview", "ordered-list-item", 0, "1. one"),
            _make_seg("Overview", "ordered-list-item", 1, "2. two"),
        ]
    )
    ja = _make_section(
        body=[
            _make_seg("Overview", "unordered-list-item", 0, "- 手順 1"),
            _make_seg("Overview", "unordered-list-item", 1, "- 手順 2"),
        ]
    )
    diff = _single_diff(compare_section_structure(en, ja))
    assert diff["structureCategory"] == "kind-multiset"
    assert diff["enKinds"] == ["ordered-list"]
    assert diff["jaKinds"] == ["unordered-list"]


def test_stage_a_table_to_paragraph_collapse() -> None:
    """table cell は必ず 1 ``table`` block に畳まれる (cell 単位の比較はしない)。"""
    en = _make_section(
        body=[
            _make_seg("Overview", "table-cell", 0, "Header `col-1`"),
            _make_seg("Overview", "table-cell", 1, "Header `col-2`"),
            _make_seg("Overview", "table-cell", 2, "Row1 `v-1`"),
        ]
    )
    ja = _make_section(
        body=[_make_seg("Overview", "paragraph", 0, "テーブルを段落に (col-1, col-2, v-1)")]
    )
    diff = _single_diff(compare_section_structure(en, ja))
    assert diff["structureCategory"] == "kind-multiset"
    assert diff["enKinds"] == ["table"]


def test_stage_a_non_adjacent_list_blocks_stay_separate() -> None:
    """list - paragraph - list は 3 block に畳まれる (融合しない)。"""
    en = _make_section(
        body=[
            _make_seg("Overview", "unordered-list-item", 0, "- first"),
            _make_seg("Overview", "paragraph", 0, "Intermezzo `token-x`"),
            _make_seg("Overview", "unordered-list-item", 0, "- second"),
        ]
    )
    ja = _make_section(
        body=[
            _make_seg("Overview", "unordered-list-item", 0, "- 最初"),
            _make_seg("Overview", "unordered-list-item", 0, "- 2 番目"),
        ]
    )
    diff = _single_diff(compare_section_structure(en, ja))
    assert diff["enKinds"] == ["unordered-list", "paragraph", "unordered-list"]
    assert diff["jaKinds"] == ["unordered-list"]


def test_stage_a_payload_contract_all_fields() -> None:
    """Stage A の全必須 field と FORBIDDEN segmentKind 非在を pin する。"""
    en = _make_section(
        section_path="Getting Started > Quickstart",
        index=2,
        body=[
            _make_seg("Getting Started > Quickstart", "callout-body", 0, "Warning `flag-a`."),
            _make_seg("Getting Started > Quickstart", "paragraph", 0, "EN `flag-b`."),
        ],
    )
    ja = _make_section(
        section_path="Getting Started > Quickstart",
        index=2,
        body=[
            _make_seg(
                "Getting Started > Quickstart", "paragraph", 0, "注意と段落 (flag-a, flag-b)"
            ),
            _make_seg("Getting Started > Quickstart", "paragraph", 1, "補足"),
        ],
    )
    diff = _single_diff(compare_section_structure(en, ja))
    assert diff["severity"] == "actionable"
    assert diff["scope"] == "section"
    assert diff["sectionPath"] == "Getting Started > Quickstart"
    assert diff["sectionIndex"] == 2
    assert "segmentKind" not in diff, "structure diff MUST NOT reuse segmentKind"
    assert isinstance(diff["enKinds"], list)
    assert isinstance(diff["jaKinds"], list)
    assert isinstance(diff["enSegmentCount"], int)
    assert isinstance(diff["jaSegmentCount"], int)
    assert isinstance(diff["detail"], str) and len(diff["detail"]) > 0
    assert "contentPermutation" not in diff, "content-order only — Stage A must not populate it"


# ---------------------------------------------------------------------------
# Stage B — kind-sequence (segment-order-mismatch)
# ---------------------------------------------------------------------------


def test_stage_b_paragraph_ul_swap() -> None:
    """[p, ul] vs [ul, p] → kind-sequence mismatch。"""
    en = _make_section(
        body=[
            _make_seg("Overview", "paragraph", 0, "Intro `token-a`"),
            _make_seg("Overview", "unordered-list-item", 0, "- bullet `token-b`"),
        ]
    )
    ja = _make_section(
        body=[
            _make_seg("Overview", "unordered-list-item", 0, "- 箇条書き token-b"),
            _make_seg("Overview", "paragraph", 0, "紹介 token-a"),
        ]
    )
    diff = _single_diff(compare_section_structure(en, ja))
    assert diff["type"] == "segment-order-mismatch"
    assert diff["structureCategory"] == "kind-sequence"
    assert diff["enKinds"] == ["paragraph", "unordered-list"]
    assert diff["jaKinds"] == ["unordered-list", "paragraph"]


def test_stage_b_does_not_populate_content_permutation() -> None:
    en = _make_section(
        body=[
            _make_seg("Overview", "paragraph", 0, "p `token-a`"),
            _make_seg("Overview", "callout-body", 0, "callout `token-b`"),
        ]
    )
    ja = _make_section(
        body=[
            _make_seg("Overview", "callout-body", 0, "コールアウト token-b"),
            _make_seg("Overview", "paragraph", 0, "段落 token-a"),
        ]
    )
    diff = _single_diff(compare_section_structure(en, ja))
    assert diff["structureCategory"] == "kind-sequence"
    assert "contentPermutation" not in diff


# ---------------------------------------------------------------------------
# Stage C — content-order (segment-order-mismatch)
# ---------------------------------------------------------------------------


def test_stage_c_same_kind_pure_swap_with_strong_tokens() -> None:
    en = _make_section(
        body=[
            _make_seg("Overview", "paragraph", 0, "Paragraph about `alpha-tool` and `alpha-flag`."),
            _make_seg("Overview", "paragraph", 1, "Paragraph about `beta-tool` and `beta-flag`."),
        ]
    )
    ja = _make_section(
        body=[
            _make_seg("Overview", "paragraph", 0, "`beta-tool` と `beta-flag` の段落"),
            _make_seg("Overview", "paragraph", 1, "`alpha-tool` と `alpha-flag` の段落"),
        ]
    )
    diff = _single_diff(compare_section_structure(en, ja))
    assert diff["type"] == "segment-order-mismatch"
    assert diff["structureCategory"] == "content-order"
    perm = diff["contentPermutation"]
    assert len(perm) == 2
    by_en = {p["enIndex"]: p["jaIndex"] for p in perm}
    assert by_en[0] == 1
    assert by_en[1] == 0
    for p in perm:
        assert isinstance(p["score"], (int, float))
        assert p["score"] > 0


def test_stage_c_three_element_cyclic_rotation() -> None:
    en = _make_section(
        body=[
            _make_seg("Overview", "paragraph", 0, "Content `token-alpha`."),
            _make_seg("Overview", "paragraph", 1, "Content `token-beta`."),
            _make_seg("Overview", "paragraph", 2, "Content `token-gamma`."),
        ]
    )
    ja = _make_section(
        body=[
            _make_seg("Overview", "paragraph", 0, "内容 `token-gamma`"),
            _make_seg("Overview", "paragraph", 1, "内容 `token-alpha`"),
            _make_seg("Overview", "paragraph", 2, "内容 `token-beta`"),
        ]
    )
    diff = _single_diff(compare_section_structure(en, ja))
    assert diff["structureCategory"] == "content-order"
    by_en = {p["enIndex"]: p["jaIndex"] for p in diff["contentPermutation"]}
    assert by_en[0] == 1
    assert by_en[1] == 2
    assert by_en[2] == 0


def test_stage_c_monotonic_order_returns_empty() -> None:
    en = _make_section(
        body=[
            _make_seg("Overview", "paragraph", 0, "Monotonic `alpha` paragraph."),
            _make_seg("Overview", "paragraph", 1, "Monotonic `beta` paragraph."),
        ]
    )
    ja = _make_section(
        body=[
            _make_seg("Overview", "paragraph", 0, "単調 `alpha` 段落"),
            _make_seg("Overview", "paragraph", 1, "単調 `beta` 段落"),
        ]
    )
    assert compare_section_structure(en, ja) == []


def test_stage_c_tokenless_swap_falls_through_to_lcs() -> None:
    """両側 invariant token 0 の純散文 swap は comparator が証明できない → 空。"""
    en = _make_section(
        body=[
            _make_seg("Overview", "paragraph", 0, "The first paragraph discusses overall goals."),
            _make_seg("Overview", "paragraph", 1, "The second paragraph covers the approach."),
        ]
    )
    ja = _make_section(
        body=[
            _make_seg("Overview", "paragraph", 0, "2 番目の段落: 方針を説明する文章"),
            _make_seg("Overview", "paragraph", 1, "1 番目の段落: 全体のゴールを説明する文章"),
        ]
    )
    assert compare_section_structure(en, ja) == []


# ---------------------------------------------------------------------------
# Stage precedence / fall-through
# ---------------------------------------------------------------------------


def test_identical_sections_return_empty() -> None:
    en = _make_section(
        body=[
            _make_seg("Overview", "paragraph", 0, "EN paragraph `token-a`"),
            _make_seg("Overview", "unordered-list-item", 0, "- EN bullet `token-b`"),
        ]
    )
    ja = _make_section(
        body=[
            _make_seg("Overview", "paragraph", 0, "JA 段落 token-a"),
            _make_seg("Overview", "unordered-list-item", 0, "- JA 箇条書き token-b"),
        ]
    )
    assert compare_section_structure(en, ja) == []


def test_empty_bodies_return_empty() -> None:
    en = _make_section(body=[])
    ja = _make_section(body=[])
    assert compare_section_structure(en, ja) == []


def test_one_sided_empty_body_falls_through_to_lcs() -> None:
    """片側 body=0 のときは LCS にフォールスルー (per-segment drill-down を保つ)。"""
    en = _make_section(
        body=[
            _make_seg("Overview", "callout-body", 0, "EN callout"),
            _make_seg("Overview", "paragraph", 0, "EN paragraph"),
        ]
    )
    ja = _make_section(body=[])
    assert compare_section_structure(en, ja) == []

    en2 = _make_section(body=[])
    ja2 = _make_section(body=[_make_seg("Overview", "paragraph", 0, "JA extra")])
    assert compare_section_structure(en2, ja2) == []


def test_stage_a_takes_precedence_over_stage_b() -> None:
    """multiset 不一致のときは Stage A が kind sequence より先に fire する。"""
    en = _make_section(
        body=[
            _make_seg("Overview", "paragraph", 0, "p1"),
            _make_seg("Overview", "paragraph", 1, "p2"),
            _make_seg("Overview", "unordered-list-item", 0, "- bullet"),
        ]
    )
    ja = _make_section(
        body=[
            _make_seg("Overview", "unordered-list-item", 0, "- bullet"),
            _make_seg("Overview", "paragraph", 0, "p"),
        ]
    )
    diff = _single_diff(compare_section_structure(en, ja))
    assert diff["type"] == "section-structure-mismatch"
    assert diff["structureCategory"] == "kind-multiset"


def test_stage_b_takes_precedence_over_stage_c() -> None:
    """multiset 一致 + kind 列違いなら Stage B が content-level bijection 前に勝つ。"""
    en = _make_section(
        body=[
            _make_seg("Overview", "paragraph", 0, "p `token-a`"),
            _make_seg("Overview", "unordered-list-item", 0, "- bullet `token-b`"),
        ]
    )
    ja = _make_section(
        body=[
            _make_seg("Overview", "unordered-list-item", 0, "- bullet token-a"),
            _make_seg("Overview", "paragraph", 0, "p token-b"),
        ]
    )
    diff = _single_diff(compare_section_structure(en, ja))
    assert diff["type"] == "segment-order-mismatch"
    assert diff["structureCategory"] == "kind-sequence"


# ---------------------------------------------------------------------------
# Payload contract — frozen vocabulary / required fields
# ---------------------------------------------------------------------------


def test_structure_comparator_kinds_frozen() -> None:
    """STRUCTURE_COMPARATOR_KINDS は block 語彙に完全固定 (segment kind を含まない)。"""
    assert sorted(STRUCTURE_COMPARATOR_KINDS) == [
        "callout-body",
        "details-summary",
        "ordered-list",
        "paragraph",
        "table",
        "unordered-list",
    ]


def test_en_ja_kinds_contain_only_frozen_block_kinds() -> None:
    """畳み処理が skip された場合 segment kind が漏れる — ここで検出する。"""
    en = _make_section(
        body=[
            _make_seg("Overview", "paragraph", 0, "p `token-a`"),
            _make_seg("Overview", "unordered-list-item", 0, "- bullet `token-b`"),
            _make_seg("Overview", "table-cell", 0, "cell `token-c`"),
        ]
    )
    ja = _make_section(body=[_make_seg("Overview", "paragraph", 0, "1 段落に (token-a/b/c)")])
    diff = _single_diff(compare_section_structure(en, ja))
    allowed = set(STRUCTURE_COMPARATOR_KINDS)
    for kind in diff["enKinds"]:
        assert kind in allowed
    for forbidden in ("ordered-list-item", "unordered-list-item", "table-cell"):
        assert forbidden not in diff["enKinds"]
        assert forbidden not in diff["jaKinds"]


def test_content_order_score_is_diagnostic_only() -> None:
    """score は diagnostic 扱い。identity key は (enIndex, jaIndex) ペアだけ。"""
    en = _make_section(
        body=[
            _make_seg("Overview", "paragraph", 0, "Paragraph `alpha-token`."),
            _make_seg("Overview", "paragraph", 1, "Paragraph `beta-token`."),
        ]
    )
    ja = _make_section(
        body=[
            _make_seg("Overview", "paragraph", 0, "`beta-token` の段落"),
            _make_seg("Overview", "paragraph", 1, "`alpha-token` の段落"),
        ]
    )
    diff = _single_diff(compare_section_structure(en, ja))
    identity = ",".join(
        f"{p['enIndex']}->{p['jaIndex']}"
        for p in sorted(diff["contentPermutation"], key=lambda p: p["enIndex"])
    )
    assert identity == "0->1,1->0"
    for p in diff["contentPermutation"]:
        assert isinstance(p["score"], (int, float))


# ---------------------------------------------------------------------------
# Defensive: None section handling
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("en", "ja"),
    [
        (None, _make_section(body=[])),
        (_make_section(body=[]), None),
        (None, None),
    ],
)
def test_none_section_returns_empty(en: Any, ja: Any) -> None:
    """None を渡しても例外を投げず空 list を返す。"""
    assert compare_section_structure(en, ja) == []


# ---------------------------------------------------------------------------
# collapse_body_to_blocks helper
# ---------------------------------------------------------------------------


def test_collapse_body_groups_consecutive_list_items() -> None:
    body = [
        _make_seg("S", "unordered-list-item", 0, "- a"),
        _make_seg("S", "unordered-list-item", 1, "- b"),
        _make_seg("S", "paragraph", 0, "p"),
    ]
    blocks = collapse_body_to_blocks(body)
    # list 2 items → 1 unordered-list block、paragraph は独立
    assert [b["kind"] for b in blocks] == ["unordered-list", "paragraph"]
    assert len(blocks[0]["segments"]) == 2


def test_collapse_body_empty_returns_empty_list() -> None:
    assert collapse_body_to_blocks([]) == []
