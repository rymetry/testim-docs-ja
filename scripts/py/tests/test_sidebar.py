"""sidebar のユニットテスト — SIDEBAR_URLS.md パース・セクション検索。"""

from __future__ import annotations

import pytest

from testim_parity.sidebar import (
    extract_japanese_label,
    find_sidebar_section,
    get_section_slug_set,
    parse_sidebar_sections,
)

SAMPLE = """\
# Title

## 翻訳ステータス

本文は省略。

## Overview （概要）

- ✅ https://docs.tricentis.com/testim/content/overview/testim-overview.htm
- ⏳ https://docs.tricentis.com/testim/content/overview/whats-new.htm

## Results （結果）

- ✅🔍 https://docs.tricentis.com/testim/content/results/dashboard.htm
"""


class TestParseSidebarSections:
    def test_skips_non_section_headings(self):
        sections = parse_sidebar_sections(SAMPLE)
        titles = [s["rawTitle"] for s in sections]
        assert titles == ["Overview （概要）", "Results （結果）"]

    def test_splits_bilingual_titles(self):
        sections = parse_sidebar_sections(SAMPLE)
        assert sections[0]["english"] == "Overview"
        assert sections[0]["japanese"] == "概要"

    def test_captures_status_url_and_slug(self):
        sections = parse_sidebar_sections(SAMPLE)
        items = sections[0]["items"]
        assert items[0] == {
            "status": "✅",
            "url": "https://docs.tricentis.com/testim/content/overview/testim-overview.htm",
            "slug": "overview/testim-overview",
        }
        assert items[1]["status"] == "⏳"
        assert sections[1]["items"][0]["status"] == "✅🔍"


class TestFindSidebarSection:
    def test_by_japanese_label(self):
        sections = parse_sidebar_sections(SAMPLE)
        section = find_sidebar_section(sections, "概要")
        assert section is not None
        assert section["english"] == "Overview"

    def test_by_english_label(self):
        sections = parse_sidebar_sections(SAMPLE)
        assert find_sidebar_section(sections, "overview")["japanese"] == "概要"

    def test_alias_fallback(self):
        sections = parse_sidebar_sections(SAMPLE)
        # "テスト結果" は "結果" の alias
        match = find_sidebar_section(sections, "テスト結果")
        assert match is not None
        assert match["english"] == "Results"

    def test_unknown_returns_none(self):
        sections = parse_sidebar_sections(SAMPLE)
        assert find_sidebar_section(sections, "unknown") is None


class TestGetSectionSlugSet:
    def test_returns_slug_set(self):
        sections = parse_sidebar_sections(SAMPLE)
        slugs = get_section_slug_set("Overview", sections)
        assert slugs == {"overview/testim-overview", "overview/whats-new"}

    def test_raises_on_unknown(self):
        sections = parse_sidebar_sections(SAMPLE)
        with pytest.raises(ValueError, match="Unknown section"):
            get_section_slug_set("does-not-exist", sections)


def test_extract_japanese_label():
    assert extract_japanese_label("Overview （概要）") == "概要"
    assert extract_japanese_label("プレーン") == "プレーン"
