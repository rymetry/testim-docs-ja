"""madcap_toc のユニットテスト — AMD module パーサ・スラッグ抽出・TOC ツリー走査。"""

from __future__ import annotations

import pytest

from testim_parity.madcap_toc import (
    TRICENTIS_URL_RE,
    build_index_lookup,
    build_sections,
    build_sidebar_snapshot,
    extract_slug,
    extract_slugs_from_snapshot,
    match_all_tricentis_urls,
    parse_amd_module,
    resolve_url,
)


class TestExtractSlug:
    def test_strips_content_prefix_and_htm_suffix(self):
        assert extract_slug("/content/overview/testim-overview.htm") == "overview/testim-overview"

    def test_strips_index_htm_suffix(self):
        assert extract_slug("/content/overview/index.htm") == "overview"

    def test_lowercases_path(self):
        assert extract_slug("/content/OverView/CamelCase.htm") == "overview/camelcase"

    def test_returns_none_for_non_matching(self):
        assert extract_slug("https://example.com/foo") is None
        assert extract_slug("") is None


class TestResolveUrl:
    def test_absolute_path(self):
        assert (
            resolve_url("/Data/Tocs/Main.js")
            == "https://docs.tricentis.com/testim/Data/Tocs/Main.js"
        )

    def test_relative_path(self):
        assert (
            resolve_url("Data/Tocs/Main.js")
            == "https://docs.tricentis.com/testim/Data/Tocs/Main.js"
        )

    def test_override_base(self):
        assert resolve_url("/x", base_url="https://example.com") == "https://example.com/x"


class TestParseAmdModule:
    def test_unquoted_keys(self):
        assert parse_amd_module("define({ a: 1, b: 2 });") == {"a": 1, "b": 2}

    def test_single_quoted_strings(self):
        assert parse_amd_module("define({ x: 'hello' })") == {"x": "hello"}

    def test_double_quotes_in_single_quoted_are_escaped(self):
        assert parse_amd_module("""define({ x: 'say "hi"' })""") == {"x": 'say "hi"'}

    def test_invalid_raises_value_error(self):
        with pytest.raises(ValueError, match="parse_amd_module"):
            parse_amd_module("not a module")


class TestBuildIndexLookup:
    def test_expands_parallel_arrays(self):
        chunk = {"/foo.htm": {"i": [1, 2], "t": ["A", "B"]}}
        lookup = build_index_lookup([chunk])
        assert lookup == {
            1: {"url": "/foo.htm", "title": "A"},
            2: {"url": "/foo.htm", "title": "B"},
        }

    def test_handles_missing_title(self):
        chunk = {"/foo.htm": {"i": [1, 2], "t": ["A"]}}
        lookup = build_index_lookup([chunk])
        assert lookup[2] == {"url": "/foo.htm", "title": ""}

    def test_skips_malformed_entries(self):
        # i と t が配列でない entry は skip される
        chunk = {"/bad.htm": {"i": "not-an-array"}}
        assert build_index_lookup([chunk]) == {}


class TestBuildSections:
    def test_flattens_tree_and_promotes_leaves(self):
        tree = {"n": [{"i": 1, "n": []}, {"i": 2, "n": [{"i": 3}]}]}
        lookup = {
            1: {"url": "/content/section-a.htm", "title": "Section A"},
            2: {"url": "/content/section-b.htm", "title": "Section B"},
            3: {"url": "/content/child.htm", "title": "Child"},
        }
        sections = build_sections(tree, lookup)
        assert [s["title"] for s in sections] == ["Section A", "Section B"]
        # Section A は leaf のため自己 promote
        assert sections[0]["pages"][0]["slug"] == "section-a"
        # Section B は子 child を持つ
        assert [p["slug"] for p in sections[1]["pages"]] == ["child"]

    def test_excludes_home_slug_from_promotion(self):
        tree = {"n": [{"i": 1}]}
        lookup = {1: {"url": "/content/home.htm", "title": "Home"}}
        sections = build_sections(tree, lookup)
        # home は NON_DOC_SLUGS に含まれるため promote されない
        assert sections[0]["pages"] == []


class TestSidebarSnapshot:
    def test_build_and_extract_slugs(self):
        sections = [
            {
                "title": "Cat",
                "url": "/content/cat.htm",
                "pages": [{"slug": "cat/one", "url": "cat/one.htm", "title": "One"}],
            }
        ]
        snap = build_sidebar_snapshot(sections, fetched_at="2026-01-01T00:00:00.000Z")
        assert snap["baseUrl"] == "https://docs.tricentis.com/testim"
        assert snap["sections"][0]["pages"][0]["url"].endswith("/cat/one.htm")
        assert extract_slugs_from_snapshot(snap) == {"cat/one"}

    def test_extract_slugs_from_empty(self):
        assert extract_slugs_from_snapshot(None) == set()
        assert extract_slugs_from_snapshot({"sections": []}) == set()


class TestTricentisUrlRe:
    def test_matches_content_url(self):
        text = "see https://docs.tricentis.com/testim/content/loops.htm for more"
        matches = list(match_all_tricentis_urls(text))
        assert len(matches) == 1
        assert matches[0].group(0) == "https://docs.tricentis.com/testim/content/loops.htm"

    def test_re_is_non_global(self):
        # non-global regex は matchAll を呼ばずに search するだけなら 1 件のみ返す想定
        assert TRICENTIS_URL_RE.search("no url here") is None
