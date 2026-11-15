"""``testim_parity.segments_ja`` のユニットテスト (segment level)。

JA Markdown は ``render_ja_markdown`` で HTML にしてから EN extractor で抽出する。
レンダリング単体の挙動は ``tests/test_ja_render.py`` が担保する。
"""

from __future__ import annotations

from testim_parity.segments_en import extract_segments_from_html
from testim_parity.segments_ja import extract_segments_from_markdown


def kinds(md: str) -> list[str]:
    return [s["segmentKind"] for s in extract_segments_from_markdown(md)]


def texts(md: str) -> list[str]:
    return [s["textNorm"] for s in extract_segments_from_markdown(md)]


def test_non_string_returns_empty():
    assert extract_segments_from_markdown(None) == []


def test_line_is_none():
    assert [s["line"] for s in extract_segments_from_markdown("a\n\nb\n")] == [None, None]


def test_callout_body_segment():
    assert kinds(":::note\nbody\n:::\n") == ["callout-body"]


def test_callout_marker_inside_fence_stays_code():
    assert kinds("```\n:::note\n```\n") == ["code-block"]


def test_details_with_markdown_body():
    assert kinds("<details>\n<summary>S</summary>\n\nbody\n\n</details>\n") == [
        "details-summary",
        "paragraph",
    ]


def test_heading_anchor_stripped():
    assert texts("## 見出し {#id}\n") == ["見出し"]


def test_image_only_list_item_matches_en():
    md = extract_segments_from_markdown("1. a\n2. ![x](y.png)\n3. b\n")
    en = extract_segments_from_html(
        "<ol><li>a</li><li><img src='y.png'/></li><li>b</li></ol>",
        slug="x",
        callout_allow_slugs=None,
    )
    assert [s["textNorm"] for s in md] == [s["textNorm"] for s in en]


def test_code_block_inside_list_does_not_break_headings():
    assert kinds("- ```\n  x\n  ```\n\n## h\n")[-1] == "heading"


def test_unclosed_callout_does_not_swallow_following_heading():
    assert "heading" in kinds(":::note\nbody\n\n## h\n")
    # heading の後ろの本文も callout に吸い込まれない
    assert kinds(":::note\nbody\n\n## h\n\npara\n") == ["callout-body", "heading", "paragraph"]


def test_unclosed_fence_is_reported_as_code_to_end():
    assert kinds("para\n\n```\nx\n\n## h\n") == ["paragraph", "code-block"]


def test_indented_callout_nests_inside_list_item_like_en():
    md = extract_segments_from_markdown("1. a\n\n   :::note\n   body\n   :::\n")
    # EN snapshot と同じく block 間に改行を置く (改行なしだと EN extractor は "abody")
    en = extract_segments_from_html(
        '<ol><li>a\n<div class="note"><p>body</p></div></li></ol>',
        slug="x",
        callout_allow_slugs=None,
    )
    assert [s["segmentKind"] for s in md] == ["ordered-list-item"]
    assert [(s["segmentKind"], s["textNorm"]) for s in md] == [
        (s["segmentKind"], s["textNorm"]) for s in en
    ]


def test_hard_break_continuation_differs_from_separated_paragraph():
    # 前 PR で corpus を変換した理由: 前者の b は list item 内、後者は独立 paragraph
    lazy = extract_segments_from_markdown("4. a\\\nb\n5. c\n")
    separated = extract_segments_from_markdown("4. a\n\nb\n\n5. c\n")
    assert [(s["segmentKind"], s["textNorm"]) for s in lazy] == [
        ("ordered-list-item", "a b"),
        ("ordered-list-item", "c"),
    ]
    assert [(s["segmentKind"], s["textNorm"]) for s in separated] == [
        ("ordered-list-item", "a"),
        ("paragraph", "b"),
        ("ordered-list-item", "c"),
    ]
