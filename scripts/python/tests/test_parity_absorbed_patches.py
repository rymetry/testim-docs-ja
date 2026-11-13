"""Artifacts the shared extractor absorbs instead of EN source patches."""

import json
from pathlib import Path

import pytest

from testim_parity.preprocess_en import _rewrite_bare_index_links, preprocess_en_html
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
    assert kinds == ["paragraph"]


# --- bare index.htm links (UD-005E/F, UD-008, UD-013, UD-014) ---


_REPO = Path(__file__).resolve().parents[3]
_SNAPSHOTS = _REPO / "snapshots" / "en" / "content"
_PATCHES = Path(__file__).resolve().parents[1] / "src/testim_parity/_en_source_patches_data.json"


def test_bare_index_link_points_to_parent_folder():
    html = '<a href="index.htm">x</a>'
    assert (
        _rewrite_bare_index_links(html, "a/parameters/hidden")
        == '<a href="../parameters/index.htm">x</a>'
    )


def test_bare_index_link_keeps_fragment():
    out = _rewrite_bare_index_links('<a href="index.htm#s">x</a>', "a/b/c")
    assert 'href="../b/index.htm#s"' in out


def test_top_level_page_is_untouched():
    html = '<a href="index.htm">x</a>'
    assert _rewrite_bare_index_links(html, "top") == html


def test_non_bare_links_are_untouched():
    html = '<a href="../x/index.htm">x</a><a href="other.htm">y</a>'
    assert _rewrite_bare_index_links(html, "a/b/c") == html


def test_no_slug_skips_rewrite():
    html = '<a href="index.htm">x</a>'
    assert preprocess_en_html(html) == html


@pytest.mark.parametrize(
    "patch_prefix, slug",
    [
        ("UD-009", "integrations/grid-management/custom-grid"),
        (
            "UD-012",
            "advanced-editing/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor",
        ),
    ],
)
def test_patches_still_apply_before_link_rewrite(patch_prefix, slug):
    patch = next(
        p
        for p in json.loads(_PATCHES.read_text(encoding="utf-8"))["patches"]
        if p["id"].startswith(patch_prefix)
    )
    raw = (_SNAPSHOTS / f"{slug}.html").read_bytes().decode("utf-8")
    assert patch["replace"] in preprocess_en_html(raw, slug=slug)


@pytest.mark.real_repo
def test_no_category_index_snapshot_has_bare_index_link():
    slugs = {
        p.relative_to(_SNAPSHOTS).with_suffix("").as_posix() for p in _SNAPSHOTS.rglob("*.html")
    }
    dirs = {p.relative_to(_SNAPSHOTS).as_posix() for p in _SNAPSHOTS.rglob("*") if p.is_dir()}
    offenders = [
        s
        for s in slugs & dirs
        if 'href="index.htm' in (_SNAPSHOTS / f"{s}.html").read_text(encoding="utf-8")
    ]
    assert offenders == []
