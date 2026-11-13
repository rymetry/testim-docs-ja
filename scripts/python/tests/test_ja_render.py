"""ja_render.render_ja_markdown の unit test。"""

from __future__ import annotations

from testim_parity.ja_render import render_ja_markdown
from testim_parity.segments_en import extract_segments_from_html


def _segs(md: str) -> list[dict]:
    return extract_segments_from_html(render_ja_markdown(md), slug="x", callout_allow_slugs=None)


def kinds(md: str) -> list[str]:
    return [s["segmentKind"] for s in _segs(md)]


def texts(md: str) -> list[str]:
    return [s["textNorm"] for s in _segs(md)]


def test_callout_body_segment():
    assert kinds(":::note\nbody\n:::\n") == ["callout-body"]


def test_callout_title_attribute_is_accepted():
    assert kinds(':::warning{title="T"}\nbody\n:::\n') == ["callout-body"]


def test_callout_data_line_is_body_line_of_opening_marker():
    html = render_ja_markdown("para\n\n:::note\nbody\n:::\n")
    assert '<div class="callout-note" data-line="3">' in html


def test_callout_marker_inside_fence_stays_code():
    assert kinds("```\n:::note\n```\n") == ["code-block"]


def test_details_with_markdown_body():
    assert kinds("<details>\n<summary>S</summary>\n\nbody\n\n</details>\n") == [
        "details-summary",
        "paragraph",
    ]


def test_heading_anchor_stripped():
    assert texts("## 見出し {#id}\n") == ["見出し"]


def test_frontmatter_and_title_h1_stripped():
    assert texts("---\ntitle: T\n---\n\n# タイトル\n\n## 見出し\n") == ["見出し"]


def test_lazy_continuation_stays_inside_list_item():
    html = render_ja_markdown("4. a\\\nb\n5. c\n")
    assert "<br" in html and html.count("<ol") == 1


def test_separated_paragraph_between_lists():
    html = render_ja_markdown("4. a\n\nb\n\n5. c\n")
    assert '<ol start="4">' in html and '<ol start="5">' in html and "<p>b</p>" in html


def test_table_and_strikethrough_enabled():
    html = render_ja_markdown("|a|b|\n|-|-|\n|1|~~2~~|\n")
    assert "<table>" in html and "<s>2</s>" in html
