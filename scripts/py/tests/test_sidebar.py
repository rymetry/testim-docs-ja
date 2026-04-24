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


class TestExtractJapaneseLabel:
    """mjs ``extractJapaneseLabel`` と同一契約の追加カバレッジ。"""

    def test_fullwidth_parentheses(self) -> None:
        assert extract_japanese_label("Getting Started（はじめに）") == "はじめに"

    def test_halfwidth_parentheses(self) -> None:
        assert extract_japanese_label("Overview(概要)") == "概要"

    def test_no_parens_returns_full_trimmed(self) -> None:
        assert extract_japanese_label("概要") == "概要"

    def test_trims_outer_whitespace(self) -> None:
        assert extract_japanese_label("  Test（テスト）  ") == "テスト"

    def test_plain_title_trimmed(self) -> None:
        assert extract_japanese_label("  Plain Title  ") == "Plain Title"


class TestParseSidebarSectionsAdditional:
    """mjs ``parseSidebarSections`` が持つ追加の契約 — 旧ドメイン除外・underscore slug。"""

    def test_ignores_old_help_testim_io_domain(self) -> None:
        text = "## Overview（概要）\n\n- ✅ https://help.testim.io/docs/testim-overview\n"
        sections = parse_sidebar_sections(text)
        # old-domain URL は ITEM_RE が拾わないので items は空になる。
        items = sections[0]["items"]  # type: ignore[index]
        assert items == []

    def test_underscored_slug_is_preserved(self) -> None:
        text = (
            "## Integrations（統合）\n\n"
            "- ✅🔍 https://docs.tricentis.com/testim/content/integrations/"
            "visual-validation/lambdatest_integration.htm\n"
        )
        sections = parse_sidebar_sections(text)
        items = sections[0]["items"]  # type: ignore[index]
        assert items[0]["slug"] == ("integrations/visual-validation/lambdatest_integration")

    def test_skips_translation_status_meta_section(self) -> None:
        text = (
            "## 翻訳ステータス\n\n"
            "- ✅ https://docs.tricentis.com/testim/content/overview/foo.htm\n\n"
            "## Overview（概要）\n\n"
            "- ✅ https://docs.tricentis.com/testim/content/overview/bar.htm\n"
        )
        sections = parse_sidebar_sections(text)
        assert len(sections) == 1
        assert sections[0]["english"] == "Overview"


class TestFindSidebarSectionAliases:
    """mjs ``findSidebarSection`` の legacy alias 解決を Python でも pin する。"""

    _TEXT = (
        "## Results（結果）\n\n"
        "- ✅🔍 https://docs.tricentis.com/testim/content/results/results-overview.htm\n\n"
        "## Administration（管理）\n\n"
        "- ✅🔍 https://docs.tricentis.com/testim/content/administration/api-access.htm\n"
    )

    def test_alias_tesuto_kekka_to_kekka(self) -> None:
        sections = parse_sidebar_sections(self._TEXT)
        hit = find_sidebar_section(sections, "テスト結果")
        assert hit is not None
        assert hit["english"] == "Results"

    def test_alias_kanrisha_kinou_to_kanri(self) -> None:
        sections = parse_sidebar_sections(self._TEXT)
        hit = find_sidebar_section(sections, "管理者機能")
        assert hit is not None
        assert hit["english"] == "Administration"
