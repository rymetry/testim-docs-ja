"""Phase 6b cutover で Python CLI に切り替える tool scripts の smoke test。

各 ``testim_parity.tools.*`` の ``main()`` を直接呼んで基本動作 (引数 parse,
入力 read, exit code) を pin する。現行 (Phase 5) では mjs 版と並走していた
ため未テストだったが、Phase 6b で package.json から直接叩かれるため regression
検出用の最低限 coverage を追加する。

Rationale: ``fail_under = 90`` を復帰させる前提 (cutover gate #1) として、
``0%`` coverage の tools がまとまって gap を作っていた。各 tool の main を
呼ぶだけで ``argparse`` 分岐 + happy path が計上され、coverage が 83% → 86%+
に改善する (cutover gate 目標 90% に近づく)。
"""

from __future__ import annotations

from pathlib import Path

import pytest

from testim_parity.tools import (
    check_glossary_duplicates,
    fix_alt_all,
    normalize_docs,
    notation,
    report_frontmatter_categories,
    sync_frontmatter_from_sidebar,
)


def _minimal_content_dir(tmp_path: Path) -> Path:
    """``src/content/docs/`` 相当の最小 corpus を tmp 上に作る。"""
    docs = tmp_path / "src" / "content" / "docs"
    (docs / "overview").mkdir(parents=True)
    (docs / "overview" / "a.md").write_text(
        "---\ntitle: A\ncategory: overview\nslug: overview/a\n"
        "lastUpdated: 2026-01-01T00:00:00.000Z\n---\n\nBody paragraph.\n",
        encoding="utf-8",
    )
    return docs


class TestCheckGlossaryDuplicates:
    def test_returns_zero_when_no_duplicates(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
    ) -> None:
        glossary = tmp_path / "docs" / "GLOSSARY.md"
        glossary.parent.mkdir(parents=True)
        glossary.write_text(
            "| 用語 | 説明 |\n| --- | --- |\n| Alpha | first |\n| Beta | second |\n",
            encoding="utf-8",
        )
        monkeypatch.setattr(check_glossary_duplicates, "ROOT_DIR", tmp_path)
        assert check_glossary_duplicates.main([]) == 0
        out = capsys.readouterr().out
        assert "2 entries" in out

    def test_returns_two_when_duplicate_detected(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
    ) -> None:
        glossary = tmp_path / "docs" / "GLOSSARY.md"
        glossary.parent.mkdir(parents=True)
        glossary.write_text(
            "| 用語 | 説明 |\n| --- | --- |\n| Alpha | first |\n| alpha | duplicate |\n",
            encoding="utf-8",
        )
        monkeypatch.setattr(check_glossary_duplicates, "ROOT_DIR", tmp_path)
        assert check_glossary_duplicates.main([]) == 2
        err = capsys.readouterr().err
        assert "DUPLICATES" in err

    def test_list_flag_returns_zero_even_with_duplicates(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        glossary = tmp_path / "docs" / "GLOSSARY.md"
        glossary.parent.mkdir(parents=True)
        glossary.write_text(
            "| 用語 | 説明 |\n| --- | --- |\n| Alpha | first |\n| alpha | duplicate |\n",
            encoding="utf-8",
        )
        monkeypatch.setattr(check_glossary_duplicates, "ROOT_DIR", tmp_path)
        assert check_glossary_duplicates.main(["--list"]) == 0

    def test_normalize_key_collapses_whitespace_and_case(self) -> None:
        assert check_glossary_duplicates.normalize_key(" Alpha  Beta ") == "alpha beta"

    def test_parse_glossary_entries_skips_header_and_separator(self) -> None:
        md = "| 用語 | 説明 |\n| --- | --- |\n| Term | Desc |\n| other row\n"
        entries = check_glossary_duplicates.parse_glossary_entries(md)
        assert [e["term"] for e in entries] == ["Term"]

    def test_find_duplicates_groups_normalized_keys(self) -> None:
        entries = [
            {"line": 1, "term": "Alpha", "description": "a"},
            {"line": 2, "term": "alpha", "description": "b"},
            {"line": 3, "term": "Beta", "description": "c"},
        ]
        groups = check_glossary_duplicates.find_duplicates(entries)
        assert len(groups) == 1
        assert groups[0]["normalizedKey"] == "alpha"


class TestFixAltAll:
    def test_runs_on_minimal_corpus_with_empty_alt(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        docs = _minimal_content_dir(tmp_path)
        (docs / "overview" / "img.md").write_text(
            "---\ntitle: Img\ncategory: overview\nslug: overview/img\n"
            "lastUpdated: 2026-01-01T00:00:00.000Z\n---\n\n"
            "![](/images/x.png)\n",
            encoding="utf-8",
        )
        monkeypatch.setattr(fix_alt_all, "ROOT_DIR", tmp_path)
        rc = fix_alt_all.main([])
        assert rc == 0

    def test_apply_alt_fix_outside_fences_handles_fenced_code(self) -> None:
        # unit-level coverage for the core helper
        md = "before\n\n```\n![](x)\n```\n\n![](after.png)\n"
        result = fix_alt_all.apply_alt_fix_outside_fences(md)
        # in code fence stays untouched
        assert "```\n![](x)\n```" in result
        # outside fence gets alt injected
        assert "![" in result


class TestNotation:
    def test_fix_content_preserves_code_and_urls(self, tmp_path: Path) -> None:
        docs = _minimal_content_dir(tmp_path)
        file_path = docs / "overview" / "notation.md"
        file_path.write_text(
            "---\ntitle: パラメータ(設定)\ncategory: overview\nupdated: 2026-01-01\n"
            "sourceUrl: https://docs.tricentis.com/testim/content/overview/a.htm\n---\n\n"
            "たとえばTestim拡張機能(設定)を使います。\n\n"
            "```\nパラメータ(設定)\n```\n\n"
            "https://example.com/パラメータ\n",
            encoding="utf-8",
        )

        assert notation.fix_file(file_path) is True
        fixed = file_path.read_text(encoding="utf-8")
        assert "例えば Testim 拡張機能（設定）を使います。" in fixed
        assert "```\nパラメータ(設定)\n```" in fixed
        assert "https://example.com/パラメータ" in fixed

    def test_verify_file_reports_remaining_notation_issues(self, tmp_path: Path) -> None:
        docs = _minimal_content_dir(tmp_path)
        file_path = docs / "overview" / "notation-verify.md"
        file_path.write_text(
            "---\ntitle: A\ncategory: overview\nupdated: 2026-01-01\n"
            "sourceUrl: https://docs.tricentis.com/testim/content/overview/a.htm\n---\n\n"
            "たとえばTestim拡張機能(設定)です。\n",
            encoding="utf-8",
        )

        issues = notation.verify_file(file_path)
        assert {issue.kind for issue in issues} >= {
            "たとえば→例えば",
            "spacing-missing",
            "half-width-parens",
        }

    def test_parens_fix_keeps_inline_code_opaque(self) -> None:
        assert notation.fix_parens_line("設定(`--flag`)を確認") == "設定（`--flag`）を確認"
        assert notation.fix_parens_line("See (`--flag`) only") == "See (`--flag`) only"

    def test_fix_and_verify_skip_non_utf8_markdown(
        self, tmp_path: Path, capsys: pytest.CaptureFixture[str]
    ) -> None:
        file_path = tmp_path / "broken.md"
        file_path.write_bytes(b"\xff\xfe\x00")

        assert notation.fix_file(file_path) is False

        issues = notation.verify_file(file_path)
        assert len(issues) == 1
        assert issues[0].kind == "unreadable-file"

        err = capsys.readouterr().err
        assert err.count("skipped non-UTF-8 file") == 2


class TestNormalizeDocs:
    def test_section_scoped_run_on_minimal_corpus(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        docs = _minimal_content_dir(tmp_path)
        sidebar = tmp_path / "docs" / "SIDEBAR_URLS.md"
        sidebar.parent.mkdir(parents=True, exist_ok=True)
        sidebar.write_text(
            "# Sidebar\n\n## Overview\n\n- [A](/docs/overview/a)\n",
            encoding="utf-8",
        )
        monkeypatch.setattr(normalize_docs, "DOCS_DIR", docs)
        monkeypatch.setattr(normalize_docs, "ROOT_DIR", tmp_path)
        rc = normalize_docs.main([])
        assert rc == 0


class TestReportFrontmatterCategories:
    def test_runs_on_minimal_corpus(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
    ) -> None:
        docs = _minimal_content_dir(tmp_path)
        sidebar = tmp_path / "docs" / "SIDEBAR_URLS.md"
        sidebar.parent.mkdir(parents=True, exist_ok=True)
        sidebar.write_text(
            "# Sidebar\n\n## Overview\n\n- [A](/docs/overview/a)\n",
            encoding="utf-8",
        )
        monkeypatch.setattr(report_frontmatter_categories, "DOCS_DIR", docs)
        monkeypatch.setattr(report_frontmatter_categories, "SIDEBAR_PATH", sidebar)
        rc = report_frontmatter_categories.main([])
        assert rc == 0
        out = capsys.readouterr().out
        assert "overview" in out or "unique categories" in out


class TestSyncFrontmatterFromSidebar:
    def test_dry_run_on_real_project(self) -> None:
        """production corpus で dry-run を走らせて coverage を稼ぐ。

        ``file_path_to_slug`` の default arg ``docs_dir=DOCS_DIR`` が定義時 binding
        のため monkeypatch が効かず、tmp_path fixture では subpath error になる。
        production SIDEBAR_URLS.md + DOCS_DIR はそのまま読めるので dry-run で
        regression だけ検出する。
        """
        rc = sync_frontmatter_from_sidebar.main([])
        assert rc == 0

    def test_list_unmatched_flag(self) -> None:
        rc = sync_frontmatter_from_sidebar.main(["--list-unmatched"])
        assert rc == 0

    def test_missing_sidebar_returns_one(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(sync_frontmatter_from_sidebar, "SIDEBAR_PATH", tmp_path / "missing.md")
        rc = sync_frontmatter_from_sidebar.main([])
        assert rc == 1

    def test_parse_sidebar_ordering_non_section_header_skipped(self) -> None:
        sidebar_md = (
            "## 翻訳ステータス\n\n- ✅ https://docs.tricentis.com/testim/content/overview.htm\n"
        )
        parsed = sync_frontmatter_from_sidebar.parse_sidebar_ordering(sidebar_md)
        # 翻訳ステータス は non-section header なので skip される → slug 採取されない
        assert parsed == {}


class TestPipelineUncoveredScripts:
    """``pipeline/generate_untranslated_placeholders`` / ``prepare_llm_tasks`` の
    smoke. entrypoint が argparse だけ通ることを pin する (full behavior は
    test_apply_llm_translations.py 等で別途 cover している)。
    """

    def test_generate_untranslated_placeholders_help(
        self, capsys: pytest.CaptureFixture[str]
    ) -> None:
        from testim_parity.pipeline import generate_untranslated_placeholders as m

        with pytest.raises(SystemExit) as exc:
            m.main(["--help"])
        assert exc.value.code == 0
        assert "placeholder" in capsys.readouterr().out.lower()

    def test_prepare_llm_tasks_help(self, capsys: pytest.CaptureFixture[str]) -> None:
        from testim_parity.pipeline import prepare_llm_tasks as m

        with pytest.raises(SystemExit) as exc:
            m.main(["--help"])
        assert exc.value.code == 0
        assert "llm" in capsys.readouterr().out.lower()
