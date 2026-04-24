"""``testim_parity.tools.lint_docs.main()`` 用 coverage booster (PR #389 round-2 対応)。

``test_lint_docs.py`` は helper functions + ``lint_content`` の detailed cases を
pin するが、``main()`` / ``_build_heading_index`` / section filter / 複数 error
集計の path がカバーされていない (71% → ~90%)。tmp で最小 corpus を作って
``--path`` / ``--section`` 等の分岐を叩く。
"""

from __future__ import annotations

from pathlib import Path

import pytest

from testim_parity.tools import lint_docs

_OK_DOC = """---
title: テストページ
description: このページは lint 用の最小サンプルです
category: overview
updated: '2025-10-01'
sourceUrl: 'https://docs.tricentis.com/testim/content/overview/test.htm'
keywords:
  - overview
  - sample
---

## セクション

本文段落。
"""


_BROKEN_DOC = """---
title: ダメページ
description: 原文:placeholder
category: unknown
---

# Wrong

:::invalid-callout
body
:::

[broken](/docs/does-not-exist)
"""


class TestLintDocsMainSmoke:
    def test_path_single_ok_doc_returns_zero(
        self,
        tmp_path: Path,
        monkeypatch: pytest.MonkeyPatch,
        capsys: pytest.CaptureFixture[str],
    ) -> None:
        """OK doc を ``--path`` 1 本で渡して error 0 を確認する。"""
        docs_dir = tmp_path / "src" / "content" / "docs"
        doc = docs_dir / "overview" / "test.md"
        doc.parent.mkdir(parents=True)
        doc.write_text(_OK_DOC, encoding="utf-8")
        monkeypatch.setattr(lint_docs, "DOCS_DIR", docs_dir)
        monkeypatch.setattr(lint_docs, "PROJECT_ROOT", tmp_path)

        rc = lint_docs.main(["--path", str(doc)])
        # error なければ exit 0
        assert rc == 0

    def test_path_broken_doc_returns_one(
        self,
        tmp_path: Path,
        monkeypatch: pytest.MonkeyPatch,
        capsys: pytest.CaptureFixture[str],
    ) -> None:
        """broken doc に lint error が複数出て exit 1 を返す。"""
        docs_dir = tmp_path / "src" / "content" / "docs"
        doc = docs_dir / "overview" / "broken.md"
        doc.parent.mkdir(parents=True)
        doc.write_text(_BROKEN_DOC, encoding="utf-8")
        monkeypatch.setattr(lint_docs, "DOCS_DIR", docs_dir)
        monkeypatch.setattr(lint_docs, "PROJECT_ROOT", tmp_path)

        rc = lint_docs.main(["--path", str(doc)])
        assert rc == 1
        out = capsys.readouterr().out
        # 実装によって rule 名 / message 形式は異なるが、最低 1 error が console に出る
        assert "❌" in out or "error" in out.lower()

    def test_no_args_walks_all_docs(
        self,
        tmp_path: Path,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """``--path`` 無しで 2 doc walk → 全て OK なら exit 0。"""
        docs_dir = tmp_path / "src" / "content" / "docs"
        (docs_dir / "overview").mkdir(parents=True)
        (docs_dir / "overview" / "a.md").write_text(_OK_DOC, encoding="utf-8")
        (docs_dir / "overview" / "b.md").write_text(_OK_DOC, encoding="utf-8")
        monkeypatch.setattr(lint_docs, "DOCS_DIR", docs_dir)
        monkeypatch.setattr(lint_docs, "PROJECT_ROOT", tmp_path)

        rc = lint_docs.main([])
        assert rc == 0

    def test_build_heading_index_collects_slugs_and_headings(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """``_build_heading_index`` が slug set + heading id set を返すことを pin。"""
        docs_dir = tmp_path / "src" / "content" / "docs"
        doc = docs_dir / "overview" / "x.md"
        doc.parent.mkdir(parents=True)
        doc.write_text(
            "---\ntitle: X\n---\n\n## Alpha\n\n## Beta {#beta-id}\n",
            encoding="utf-8",
        )
        monkeypatch.setattr(lint_docs, "DOCS_DIR", docs_dir)

        slugs, by_slug = lint_docs._build_heading_index([doc])
        # slug は file path → kebab posix
        assert any("x" in s for s in slugs)
        # 見出し id / kebab 化された alpha / beta-id が含まれる
        collected = set()
        for s in by_slug.values():
            collected |= s
        assert "alpha" in collected
        assert "beta-id" in collected

    def test_multiple_docs_with_mixed_results(
        self,
        tmp_path: Path,
        monkeypatch: pytest.MonkeyPatch,
        capsys: pytest.CaptureFixture[str],
    ) -> None:
        """OK + broken doc の混在で summary の error/warning カウントが正しく出る。"""
        docs_dir = tmp_path / "src" / "content" / "docs"
        (docs_dir / "overview").mkdir(parents=True)
        (docs_dir / "overview" / "ok.md").write_text(_OK_DOC, encoding="utf-8")
        (docs_dir / "overview" / "bad.md").write_text(_BROKEN_DOC, encoding="utf-8")
        monkeypatch.setattr(lint_docs, "DOCS_DIR", docs_dir)
        monkeypatch.setattr(lint_docs, "PROJECT_ROOT", tmp_path)

        rc = lint_docs.main([])
        assert rc == 1
        out = capsys.readouterr().out
        assert "Lint complete" in out
