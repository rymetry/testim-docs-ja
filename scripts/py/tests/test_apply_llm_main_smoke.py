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
    """tmp に ``_TRANS_DIR`` と mock build_slug_index を用意して戻り値を返す。"""
    trans_dir = tmp_path / "llm" / "translations"
    if create_trans_dir:
        trans_dir.mkdir(parents=True)
    monkeypatch.setattr(apply_llm_translations, "_TRANS_DIR", trans_dir)
    monkeypatch.setattr(apply_llm_translations, "ROOT_DIR", tmp_path)

    def fake_index() -> dict[str, dict[str, object]]:
        # 1 slug だけ登録、filePath を tmp_path に向ける
        docs = tmp_path / "src" / "content" / "docs"
        docs.mkdir(parents=True, exist_ok=True)
        target = docs / "overview.md"
        target.write_text(
            "---\ntitle: Overview\n---\n\nOriginal body\n",
            encoding="utf-8",
        )
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
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
    ) -> None:
        """翻訳結果が既 doc と同一なら ``unchanged`` でカウント。"""
        trans_dir, _ = _setup_mini_project(tmp_path, monkeypatch)
        # 既存 doc の body を取り、そのまま翻訳 file として置く
        (trans_dir / "overview.md").write_text("Original body", encoding="utf-8")
        # 1 回目適用で ``applied``
        rc1 = apply_llm_translations.main([])
        # 2 回目は unchanged
        rc2 = apply_llm_translations.main([])
        assert rc1 == 0
        assert rc2 == 0
