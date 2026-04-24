"""``testim_parity.tools.sync_frontmatter_from_sidebar`` coverage boost smoke。

54% → 85%+ を目標に ``parse_sidebar_ordering`` / ``_update_frontmatter_block`` /
``update_markdown_file`` / ``main()`` の各 branch を tmp で叩く。
"""

from __future__ import annotations

from pathlib import Path

import pytest

from testim_parity.tools import sync_frontmatter_from_sidebar as sfs

_SIDEBAR_MD = """# Sidebar

## Overview

- ✅ https://docs.tricentis.com/testim/content/overview/a.htm
- ✅ https://docs.tricentis.com/testim/content/overview/b.htm

## 翻訳ステータス

- ✅🔍 https://docs.tricentis.com/testim/content/overview/c.htm

## Advanced Editing / 高度な編集

- ⏳ https://docs.tricentis.com/testim/content/advanced-editing/hooks.htm
"""


class TestParseSidebarOrdering:
    def test_parses_sections_and_items(self) -> None:
        result = sfs.parse_sidebar_ordering(_SIDEBAR_MD)
        # overview/a / overview/b / advanced-editing/hooks が取れる
        assert "overview/a" in result
        assert "overview/b" in result
        assert "advanced-editing/hooks" in result
        # category / order が付与される
        a = result["overview/a"]
        assert a["category"] == "Overview"
        assert a["categoryIndex"] == 0

    def test_skips_non_section_headers(self) -> None:
        """`翻訳ステータス` は non-section header として skip される。"""
        result = sfs.parse_sidebar_ordering(_SIDEBAR_MD)
        # overview/c (翻訳ステータス 下) は skip される
        assert "overview/c" not in result

    def test_japanese_label_extracted(self) -> None:
        result = sfs.parse_sidebar_ordering(_SIDEBAR_MD)
        # `Advanced Editing / 高度な編集` は 日本語 label が優先される
        h = result["advanced-editing/hooks"]
        assert h["category"] in ("高度な編集", "Advanced Editing / 高度な編集")


class TestUpdateFrontmatterBlock:
    def test_updates_existing_category_and_order(self) -> None:
        fm = "title: X\ncategory: Old\norder: 100\n"
        updated = sfs._update_frontmatter_block(fm, {"category": "New", "order": 2001})
        assert "category: 'New'" in updated
        assert "order: 2001" in updated
        assert "title: X" in updated

    def test_inserts_missing_category_after_description(self) -> None:
        fm = "title: X\ndescription: d\n"
        updated = sfs._update_frontmatter_block(fm, {"category": "New", "order": 100})
        # description の直後に category が挿入される
        lines = updated.split("\n")
        desc_idx = next(i for i, line in enumerate(lines) if line.startswith("description:"))
        assert lines[desc_idx + 1].startswith("category:")

    def test_inserts_missing_order_after_category(self) -> None:
        fm = "title: X\ncategory: Old\n"
        updated = sfs._update_frontmatter_block(fm, {"category": "Old", "order": 500})
        lines = updated.split("\n")
        cat_idx = next(i for i, line in enumerate(lines) if line.startswith("category:"))
        assert lines[cat_idx + 1].startswith("order:")

    def test_escapes_single_quotes_in_category(self) -> None:
        fm = "title: X\n"
        updated = sfs._update_frontmatter_block(fm, {"category": "Can't stop", "order": 1})
        # single quote は '' にエスケープされる
        assert "'Can''t stop'" in updated


class TestUpdateMarkdownFile:
    def test_no_frontmatter_returns_unchanged(self, tmp_path: Path) -> None:
        p = tmp_path / "no-fm.md"
        p.write_text("just a body\n", encoding="utf-8")
        result = sfs.update_markdown_file(p, {"category": "X", "order": 1})
        assert result["changed"] is False
        assert result.get("reason") == "no-frontmatter"

    def test_writes_changes_when_different(self, tmp_path: Path) -> None:
        p = tmp_path / "with-fm.md"
        p.write_text(
            "---\ntitle: T\ncategory: Old\norder: 1\n---\n\nBody text\n",
            encoding="utf-8",
        )
        result = sfs.update_markdown_file(p, {"category": "New", "order": 42})
        assert result["changed"] is True
        after = p.read_text(encoding="utf-8")
        assert "category: 'New'" in after
        assert "order: 42" in after

    def test_no_write_when_unchanged(self, tmp_path: Path) -> None:
        p = tmp_path / "same.md"
        p.write_text(
            "---\ntitle: T\ncategory: 'Same'\norder: 1\n---\n\nBody\n",
            encoding="utf-8",
        )
        result = sfs.update_markdown_file(p, {"category": "Same", "order": 1})
        assert result["changed"] is False

    def test_broken_frontmatter_returns_unchanged(self, tmp_path: Path) -> None:
        """``---`` で始まっても閉じ ``---`` が無ければ parse 失敗を返す。"""
        p = tmp_path / "broken.md"
        p.write_text("---\ntitle: T\nno-close-marker\n", encoding="utf-8")
        result = sfs.update_markdown_file(p, {"category": "X", "order": 1})
        assert result["changed"] is False


class TestMain:
    def test_main_missing_sidebar_returns_one(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(sfs, "SIDEBAR_PATH", tmp_path / "no-sidebar.md")
        rc = sfs.main([])
        assert rc == 1

    def test_main_production_dry_run(self) -> None:
        """実 corpus で dry-run 実行 (no ``--apply``) は write せず 0 を返す。

        ``file_path_to_slug`` の ``docs_dir`` 引数が default binding のため、
        tmp fixture で path mock すると subpath error になる。production corpus
        なら SIDEBAR_URLS.md + DOCS_DIR がそのまま読めるので、dry-run smoke で
        main() loop / summary print / unmatched-list branch の coverage を稼ぐ。
        """
        rc = sfs.main([])
        assert rc == 0

    def test_main_list_unmatched_flag_on_production(
        self, capsys: pytest.CaptureFixture[str]
    ) -> None:
        rc = sfs.main(["--list-unmatched"])
        assert rc == 0
