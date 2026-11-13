"""Artifacts the shared extractor absorbs instead of EN source patches."""

import pytest

from testim_parity.segments_en import extract_segments_from_html


@pytest.mark.parametrize("p", ["<p>​</p>", "<p>​ ​</p>", "<p>  </p>"])
def test_empty_paragraph_emits_no_segment(p):
    segments = extract_segments_from_html(
        f"<p>Before</p>{p}<p>After</p>", slug="x", callout_allow_slugs=None
    )
    assert [s["textNorm"] for s in segments] == ["before", "after"]


def test_image_only_paragraph_is_unchanged():
    html = '<p>Before</p><p><img src="a.png"/></p>'
    kinds = [
        s["segmentKind"]
        for s in extract_segments_from_html(html, slug="x", callout_allow_slugs=None)
    ]
    print(kinds)
    assert kinds == ["paragraph"]
