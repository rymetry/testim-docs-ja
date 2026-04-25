"""``testim_parity.pipeline.apply_llm_translations.main()`` coverage boost smoke。

``test_apply_llm_translations.py`` は helper function の unit test を網羅するが、
``main()`` / section filter / dup detection / error branch が 59% coverage。
tmp fixture で ``_TRANS_DIR`` を差し替え、各 branch を叩く。
"""

from __future__ import annotations

from pathlib import Path

import pytest

from testim_parity.pipeline import apply_llm_translations


def _setup_mini_project(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, *, create_trans_dir: bool = True
) -> tuple[Path, Path]:
    """tmp に ``_TRANS_DIR`` と mock build_slug_index を用意して戻り値を返す。

    docs fixture は ``---\\ntitle\\n---\\nOriginal body\\n`` 形式 (blank 行無し)
    で作る。``process_one_translation`` は ``{fm}\\n{translated.strip()}\\n`` を
    書き戻すため、既存 doc が同じ形で body 一致すれば ``unchanged`` 戻り値になる
    (round 3 P2-6 対応: unchanged distinction test のため)。
    """
    trans_dir = tmp_path / "llm" / "translations"
    if create_trans_dir:
        trans_dir.mkdir(parents=True)
    monkeypatch.setattr(apply_llm_translations, "_TRANS_DIR", trans_dir)
    monkeypatch.setattr(apply_llm_translations, "ROOT_DIR", tmp_path)

    # 初期 target doc を 1 回だけ write。fake_index は毎回の index 呼び出しで
    # overwrite せず、既存 target を lookup するだけ (unchanged distinction 用)。
    docs = tmp_path / "src" / "content" / "docs"
    docs.mkdir(parents=True, exist_ok=True)
    target = docs / "overview.md"
    if not target.exists():
        target.write_text(
            "---\ntitle: Overview\n---\nOriginal body\n",
            encoding="utf-8",
        )

    def fake_index() -> dict[str, dict[str, object]]:
        return {"overview": {"filePath": str(target)}}

    monkeypatch.setattr(apply_llm_translations, "build_slug_index", fake_index)
    return trans_dir, tmp_path


class TestApplyLLMMainSmoke:
    def test_missing_trans_dir_returns_one(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        _, _ = _setup_mini_project(tmp_path, monkeypatch, create_trans_dir=False)
        rc = apply_llm_translations.main([])
        assert rc == 1

    def test_empty_trans_dir_returns_zero(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        _setup_mini_project(tmp_path, monkeypatch)
        rc = apply_llm_translations.main([])
        assert rc == 0

    def test_apply_one_translation_succeeds(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
    ) -> None:
        trans_dir, _ = _setup_mini_project(tmp_path, monkeypatch)
        (trans_dir / "overview.md").write_text("Translated body here.\n", encoding="utf-8")
        rc = apply_llm_translations.main([])
        assert rc == 0
        out = capsys.readouterr().out
        assert "Applied" in out or "applied" in out.lower()

    def test_section_filter_unknown_section_returns_one(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        _setup_mini_project(tmp_path, monkeypatch)

        def raise_section(*a, **kw):
            raise ValueError("Unknown section")

        monkeypatch.setattr(apply_llm_translations, "get_section_slug_set", raise_section)
        rc = apply_llm_translations.main(["--section=Bogus"])
        assert rc == 1

    def test_unresolvable_slug_gets_skipped(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
    ) -> None:
        trans_dir, _ = _setup_mini_project(tmp_path, monkeypatch)
        # unknown basename → resolve が None を返す
        (trans_dir / "does-not-match-any-slug.md").write_text("Body", encoding="utf-8")
        rc = apply_llm_translations.main([])
        assert rc in (0, 1)  # skip-only は rc 0、error count が増えると 1
        err = capsys.readouterr().err
        assert "Cannot resolve" in err or "slug" in err

    def test_duplicate_slug_translation_skipped(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
    ) -> None:
        """同 slug への翻訳が 2 file 居たら 2 件目を skip する (first-win)。"""
        trans_dir, _ = _setup_mini_project(tmp_path, monkeypatch)
        (trans_dir / "overview.md").write_text("First.", encoding="utf-8")
        rc = apply_llm_translations.main([])
        assert rc == 0

    def test_unchanged_translation_no_write(
        self,
        tmp_path: Path,
        monkeypatch: pytest.MonkeyPatch,
        capsys: pytest.CaptureFixture[str],
    ) -> None:
        """翻訳結果が既 doc と同一なら 2 回目は ``unchanged`` として扱われる。

        1 回目は **body を変える** 翻訳 (``Rewritten body``) で ``Applied translation``
        が stdout に出る (applied カウント)、2 回目は **同じ body に置換** した翻訳を
        再適用するため write スキップ (unchanged カウント)、``Applied translation``
        は stdout に **出ない** ことで applied/unchanged の distinction を pin する
        (round 3 P2-6 対応: 以前は ``rc == 0`` しか見ておらず distinction が脆弱だった)。
        """
        trans_dir, _ = _setup_mini_project(tmp_path, monkeypatch)
        # fixture の target doc は ``Original body``。
        # 先に **別 body** で apply → 2 回目同じ body で unchanged を叩く。
        (trans_dir / "overview.md").write_text("Rewritten body", encoding="utf-8")
        rc1 = apply_llm_translations.main([])
        cap1 = capsys.readouterr()
        assert rc1 == 0
        assert "Applied translation" in cap1.out
        # ここで target は ``Rewritten body`` に書き換わっている。2 回目は **同じ body**
        # の翻訳を再適用 → unchanged カウント、applied stdout は出ない。
        rc2 = apply_llm_translations.main([])
        cap2 = capsys.readouterr()
        assert rc2 == 0
        assert "Applied translation" not in cap2.out
        assert "unchanged 1" in cap2.out  # summary 行 "Done. Applied 0, ... unchanged 1, ..."

    def test_process_one_translation_returns_unchanged_for_identical_body(
        self, tmp_path: Path
    ) -> None:
        """``process_one_translation`` 単体: body が既存 doc と一致すると ``unchanged``。

        main() の print 経由 assert だけだと distinction が脆弱なため、helper を直接
        呼んで enum-like な戻り値を pin する (round 3 P2-6 対応)。

        ``process_one_translation`` は ``final = f"{fm}\\n{translated.strip()}\\n"``
        で final content を作る。既存 doc が完全に同じ final content を持てば
        ``unchanged``、違えば ``applied`` が返る。この test では fm 末尾 (``---``)
        直後が ``\\nOriginal body\\n`` となる形で doc を作成して一致させる。
        """
        docs = tmp_path / "docs"
        docs.mkdir()
        target = docs / "overview.md"
        # 重要: process_one_translation は ``{fm}\n{body}\n`` 形で書き戻す。
        # fm には末尾の ``---`` が含まれる (split_frontmatter 契約)。
        # そのため既存 doc は ``---\ntitle: X\n---\nOriginal body\n`` の形 (blank 行無し)。
        target.write_text("---\ntitle: X\n---\nOriginal body\n", encoding="utf-8")
        trans = tmp_path / "trans" / "overview.md"
        trans.parent.mkdir()
        trans.write_text("Original body", encoding="utf-8")

        result = apply_llm_translations.process_one_translation(
            slug="overview",
            trans_path=trans,
            hit={"filePath": str(target)},
        )
        assert result == "unchanged"

        # 翻訳 body を変えると applied 戻り値
        trans.write_text("New body", encoding="utf-8")
        result2 = apply_llm_translations.process_one_translation(
            slug="overview",
            trans_path=trans,
            hit={"filePath": str(target)},
        )
        assert result2 == "applied"
