"""project のユニットテスト — slug index・basename map・frontmatter split。"""

from __future__ import annotations

from pathlib import Path

from testim_parity.project import (
    build_basename_to_path_map,
    build_slug_index,
    extract_source_content_path,
    file_path_to_slug,
    reset_project_caches_for_test,
    resolve_slug,
    resolve_to_full_slug,
    split_frontmatter,
    to_kebab,
)


def _write_tree(tmp_path: Path, files: list[str]) -> Path:
    for rel in files:
        path = tmp_path / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("---\ntitle: dummy\n---\nbody", encoding="utf-8")
    return tmp_path


class TestFilePathToSlug:
    def test_strips_md_suffix_and_docs_prefix(self, tmp_path):
        docs = _write_tree(tmp_path, ["overview/testim-overview.md"])
        slug = file_path_to_slug(docs / "overview/testim-overview.md", docs)
        assert slug == "overview/testim-overview"


class TestBuildSlugIndex:
    def test_indexes_every_markdown_file(self, tmp_path):
        reset_project_caches_for_test()
        docs = _write_tree(
            tmp_path,
            ["overview/testim-overview.md", "overview/whats-new.md", "guides/intro.md"],
        )
        index = build_slug_index(docs)
        assert set(index.keys()) == {
            "overview/testim-overview",
            "overview/whats-new",
            "guides/intro",
        }
        assert index["guides/intro"]["categoryFolder"] == "guides"


class TestBasenameToPathMap:
    def test_ambiguous_basename_becomes_null(self, tmp_path):
        reset_project_caches_for_test()
        docs = _write_tree(tmp_path, ["a/overlap.md", "b/overlap.md", "a/unique.md"])
        result = build_basename_to_path_map(docs)
        assert result["overlap"] is None
        assert result["unique"] == "a/unique"


class TestResolveToFullSlug:
    def test_exact_match(self, tmp_path):
        reset_project_caches_for_test()
        docs = _write_tree(tmp_path, ["overview/x.md"])
        assert resolve_to_full_slug("overview/x", docs) == "overview/x"

    def test_basename_fallback(self, tmp_path):
        reset_project_caches_for_test()
        docs = _write_tree(tmp_path, ["overview/x.md"])
        assert resolve_to_full_slug("x", docs) == "overview/x"

    def test_unknown_returns_input(self, tmp_path):
        reset_project_caches_for_test()
        docs = _write_tree(tmp_path, ["overview/x.md"])
        assert resolve_to_full_slug("never/seen", docs) == "never/seen"


class TestResolveSlug:
    def test_path_based_match(self, tmp_path):
        reset_project_caches_for_test()
        docs = _write_tree(tmp_path, ["overview/x.md"])
        assert resolve_slug("overview/x", docs) == "overview/x"

    def test_basename_unique_fallback(self, tmp_path):
        reset_project_caches_for_test()
        docs = _write_tree(tmp_path, ["overview/x.md"])
        assert resolve_slug("x", docs) == "overview/x"

    def test_ambiguous_returns_none(self, tmp_path):
        reset_project_caches_for_test()
        docs = _write_tree(tmp_path, ["a/x.md", "b/x.md"])
        assert resolve_slug("x", docs) is None

    def test_empty_returns_none(self):
        assert resolve_slug("") is None
        assert resolve_slug(None) is None


class TestExtractSourceContentPath:
    def test_standard_url(self):
        assert (
            extract_source_content_path("https://docs.tricentis.com/testim/content/overview/x.htm")
            == "overview/x"
        )

    def test_index_htm_stripped(self):
        assert (
            extract_source_content_path(
                "https://docs.tricentis.com/testim/content/overview/x/index.htm"
            )
            == "overview/x"
        )

    def test_non_string_returns_none(self):
        assert extract_source_content_path(None) is None
        assert extract_source_content_path(42) is None  # type: ignore[arg-type]

    def test_non_matching_returns_none(self):
        assert extract_source_content_path("https://example.com") is None


class TestSplitFrontmatter:
    def test_standard_frontmatter(self):
        md = "---\ntitle: X\n---\n\nBody here\n"
        out = split_frontmatter(md)
        assert out["fm"].startswith("---\n")
        assert out["body"] == "Body here\n"

    def test_no_frontmatter(self):
        md = "# Heading\nBody"
        assert split_frontmatter(md) == {"fm": "", "body": md}

    def test_unterminated_frontmatter(self):
        md = "---\ntitle: X\nno close"
        assert split_frontmatter(md) == {"fm": "", "body": md}


class TestToKebab:
    def test_basic(self):
        assert to_kebab("Hello World") == "hello-world"

    def test_ampersand_becomes_space(self):
        assert to_kebab("A & B") == "a-b"

    def test_trims_leading_trailing_hyphens(self):
        assert to_kebab("---foo bar---") == "foo-bar"

    def test_nfkc_normalization(self):
        # 全角英字は半角化される
        assert to_kebab("ＡＢＣ") == "abc"


class TestFindMdFiles:
    def test_lists_markdown_files(self, tmp_path):
        from testim_parity.project import find_md_files

        (tmp_path / "a.md").write_text("x", encoding="utf-8")
        (tmp_path / "sub").mkdir()
        (tmp_path / "sub" / "b.md").write_text("y", encoding="utf-8")
        (tmp_path / "sub" / "c.txt").write_text("ignored", encoding="utf-8")
        files = find_md_files(tmp_path)
        names = {f.name for f in files}
        assert names == {"a.md", "b.md"}


class TestReadDocFile:
    def test_parses_frontmatter_and_body(self):
        """実リポの docs ツリー内のファイルを対象に read_doc_file を exercise する。

        ``to_relative_doc_path`` が ``ROOT_DIR`` 相対に変換する契約のため、tmp_path
        では assertion が raise する。実リポ内のファイルを使う。
        """
        import pytest

        from testim_parity.project import DOCS_DIR, find_md_files, read_doc_file

        md_files = find_md_files(DOCS_DIR)
        if not md_files:
            pytest.skip("docs tree empty")
        result = read_doc_file(md_files[0])
        assert "content" in result
        assert "body" in result
        assert "data" in result
        assert result["relativePath"].endswith(".md")
        assert result["section"]  # non-empty section folder

    def test_accepts_explicit_root_dir_for_alternate_workspace(self, tmp_path):
        """reviewer P2 round-4: ``root_dir`` を渡せば module-level ``ROOT_DIR``
        の外にある MD でも ``ValueError`` を raise せず relativePath を返す。

        ``main(root_dir=...)`` を alternate workspace で実行する CLI が
        monkeypatch なしで動くことを保証する regression。
        """
        from testim_parity.project import read_doc_file

        # tmp_path は通常の ``ROOT_DIR`` の外側。module-level 版の
        # ``to_relative_doc_path`` だと ``relative_to`` が即 raise する。
        docs_dir = tmp_path / "src" / "content" / "docs" / "overview"
        docs_dir.mkdir(parents=True)
        md = docs_dir / "page.md"
        md.write_text(
            "---\ntitle: T\nsourceUrl: https://example.com/x.htm\n---\n\nbody\n",
            encoding="utf-8",
        )

        result = read_doc_file(md, root_dir=tmp_path)
        assert result["relativePath"] == "src/content/docs/overview/page.md"
        assert result["data"]["title"] == "T"
        assert result["body"].strip() == "body"


class TestBuildDocsIndex:
    def test_collects_source_content_path(self, tmp_path):
        from testim_parity.project import build_docs_index

        (tmp_path / "overview").mkdir()
        (tmp_path / "overview" / "x.md").write_text(
            "---\nsourceUrl: https://docs.tricentis.com/testim/content/overview/x.htm\n---\n",
            encoding="utf-8",
        )
        (tmp_path / "overview" / "y.md").write_text("---\ntitle: y\n---\n", encoding="utf-8")
        index = build_docs_index(tmp_path)
        assert index["overview/x"]["sourceContentPath"] == "overview/x"
        assert index["overview/y"]["sourceContentPath"] is None


class TestToRelativeDocPath:
    def test_is_relative_to_root(self):
        from testim_parity.project import ROOT_DIR, to_relative_doc_path

        candidate = ROOT_DIR / "docs" / "SYSTEM_SPEC.md"
        if not candidate.exists():
            import pytest

            pytest.skip("SYSTEM_SPEC.md is not present in this worktree")
        rel = to_relative_doc_path(candidate)
        assert rel.endswith("SYSTEM_SPEC.md")

    def test_accepts_explicit_root_dir(self, tmp_path):
        """reviewer P2 round-4: ``root_dir`` 引数で base を override できる。"""
        from testim_parity.project import to_relative_doc_path

        deep = tmp_path / "a" / "b" / "c.md"
        deep.parent.mkdir(parents=True)
        deep.touch()
        assert to_relative_doc_path(deep, root_dir=tmp_path) == "a/b/c.md"

    def test_raises_when_path_outside_root_dir(self, tmp_path):
        """``root_dir`` の外側の path は ``ValueError`` を raise する。"""
        import pytest

        from testim_parity.project import to_relative_doc_path

        outside = tmp_path.parent / "__outside__" / "x.md"
        with pytest.raises(ValueError):
            to_relative_doc_path(outside, root_dir=tmp_path)


class TestGetDocSection:
    def test_returns_section_folder(self):
        from testim_parity.project import get_doc_section

        assert get_doc_section("src/content/docs/overview/x.md") == "overview"

    def test_returns_empty_when_shallow(self):
        from testim_parity.project import get_doc_section

        assert get_doc_section("x.md") == ""


class TestMatchesSectionFilter:
    def test_empty_filter_accepts_all(self):
        from testim_parity.project import matches_section_filter

        assert matches_section_filter("src/content/docs/x.md", None, None) is True
        assert matches_section_filter("src/content/docs/x.md", None, "") is True

    def test_heuristic_fallback_when_sidebar_unknown(self, monkeypatch):
        """sidebar lookup が失敗したときのヒューリスティック path を exercise する。"""
        from testim_parity import sidebar as sidebar_mod
        from testim_parity.project import matches_section_filter

        def raise_unknown(name, sections=None):
            raise ValueError("Unknown section for test")

        monkeypatch.setattr(sidebar_mod, "get_section_slug_set", raise_unknown)
        # section_filter が relative_path に含まれるので heuristic で true
        assert (
            matches_section_filter("src/content/docs/overview/x.md", None, "unknown-section-xyz")
            is False
        )
        # section_filter が path に含まれるので heuristic で true
        assert matches_section_filter("src/content/docs/overview/x.md", None, "overview") is True


class TestResolveSlugDeprecatedWarning:
    def test_basename_warns_when_ambiguous(self, tmp_path, caplog):
        """ambiguous basename は warning を出して None を返す。"""
        import logging

        from testim_parity.project import reset_project_caches_for_test, resolve_slug

        reset_project_caches_for_test()
        (tmp_path / "a").mkdir()
        (tmp_path / "b").mkdir()
        (tmp_path / "a" / "dup.md").write_text("x", encoding="utf-8")
        (tmp_path / "b" / "dup.md").write_text("x", encoding="utf-8")
        with caplog.at_level(logging.WARNING):
            assert resolve_slug("dup", tmp_path) is None
        assert any("Ambiguous" in m for m in caplog.messages)
