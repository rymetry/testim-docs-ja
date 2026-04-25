"""``testim_parity.pipeline.apply_llm_translations`` の unit test (Phase 5 port)。

mjs ``scripts/__tests__/apply_llm_translations.test.mjs`` の behavioral 等価。
"""

from __future__ import annotations

import os
import stat
from pathlib import Path

import pytest

from testim_parity.pipeline.apply_llm_translations import (
    process_one_translation,
    resolve_translation_slug,
    validate_translation,
    write_file_atomic,
)

# ----------------------------------------------------------------------
# resolve_translation_slug
# ----------------------------------------------------------------------


def _make_index(slugs: list[str]) -> dict[str, dict[str, str]]:
    return {s: {"filePath": f"/docs/{s}.md"} for s in slugs}


def test_resolve_nested_path_exact_match() -> None:
    index = _make_index(["overview/testim-overview", "results/page"])
    assert (
        resolve_translation_slug("overview/testim-overview.md", index) == "overview/testim-overview"
    )


def test_resolve_nested_path_no_match_returns_none() -> None:
    index = _make_index(["overview/testim-overview"])
    assert resolve_translation_slug("wrong-folder/testim-overview.md", index) is None


def test_resolve_nested_no_basename_fallback() -> None:
    """nested mistyped path should not basename-fallback even if bn is unique."""
    index = _make_index(["results/page"])
    assert resolve_translation_slug("wrong/page.md", index) is None


def test_resolve_flat_file_exact_match() -> None:
    index = _make_index(["page"])
    assert resolve_translation_slug("page.md", index) == "page"


def test_resolve_flat_basename_unique_warns(capsys: pytest.CaptureFixture[str]) -> None:
    index = _make_index(["results/page"])
    result = resolve_translation_slug("page.md", index)
    captured = capsys.readouterr()
    assert result == "results/page"
    assert "Deprecated: basename" in captured.err
    assert '"page"' in captured.err


def test_resolve_ambiguous_flat_basename_returns_none(
    capsys: pytest.CaptureFixture[str],
) -> None:
    index = _make_index(["results/page", "overview/page"])
    result = resolve_translation_slug("page.md", index)
    captured = capsys.readouterr()
    assert result is None
    assert "Ambiguous basename" in captured.err


def test_resolve_nonexistent_flat_basename_returns_none() -> None:
    index = _make_index(["results/other"])
    assert resolve_translation_slug("nonexistent.md", index) is None


# ----------------------------------------------------------------------
# validate_translation
# ----------------------------------------------------------------------


def test_validate_ok_returns_none() -> None:
    assert validate_translation("---\ntitle: T\n---", "# Hello\n\nContent") is None


def test_validate_empty_frontmatter_rejected() -> None:
    reason = validate_translation("", "# Hello")
    assert reason is not None
    assert "frontmatter" in reason


def test_validate_empty_translation_rejected() -> None:
    reason = validate_translation("---\ntitle: T\n---", "")
    assert reason is not None
    assert "empty" in reason


def test_validate_whitespace_only_translation_rejected() -> None:
    reason = validate_translation("---\ntitle: T\n---", "   \n  \n  ")
    assert reason is not None
    assert "empty" in reason


def test_validate_rejects_prompt_file() -> None:
    prompt = (
        "# 翻訳タスク (overview/testim-overview)\n\n下記のMarkdown本文を日本語に翻訳してください。"
    )
    reason = validate_translation("---\ntitle: T\n---", prompt)
    assert reason is not None
    assert "prompt" in reason


def test_validate_rejects_double_frontmatter() -> None:
    doubled = "---\ntitle: Oops\n---\n# Content"
    reason = validate_translation("---\ntitle: T\n---", doubled)
    assert reason is not None
    assert "frontmatter" in reason


def test_validate_allows_thematic_break() -> None:
    """thematic break (---) without closing delimiter is valid markdown."""
    thematic_break = "---\n\n# Section Title\n\nContent here"
    assert validate_translation("---\ntitle: T\n---", thematic_break) is None


# ----------------------------------------------------------------------
# write_file_atomic
# ----------------------------------------------------------------------


def test_write_file_atomic_writes_content(tmp_path: Path) -> None:
    file_path = tmp_path / "test.md"
    file_path.write_text("original", encoding="utf-8")

    write_file_atomic(file_path, "updated")

    assert file_path.read_text(encoding="utf-8") == "updated"
    # No leftover tmp files in the directory.
    entries = list(tmp_path.iterdir())
    assert len(entries) == 1
    assert entries[0].name == "test.md"


@pytest.mark.skipif(os.geteuid() == 0, reason="root bypasses chmod restrictions")
def test_write_file_atomic_preserves_original_on_failure(tmp_path: Path) -> None:
    subdir = tmp_path / "readonly"
    subdir.mkdir()
    file_path = subdir / "test.md"
    file_path.write_text("original", encoding="utf-8")

    subdir.chmod(stat.S_IRUSR | stat.S_IRGRP | stat.S_IROTH)
    try:
        with pytest.raises(OSError):
            write_file_atomic(file_path, "should-fail")
        subdir.chmod(stat.S_IRWXU)
        assert file_path.read_text(encoding="utf-8") == "original"
    finally:
        subdir.chmod(stat.S_IRWXU)


# ----------------------------------------------------------------------
# process_one_translation
# ----------------------------------------------------------------------


def _setup(
    tmp_path: Path,
    *,
    fm: str | None = None,
    body: str = "# Original content",
    translated: str = "# 翻訳されたコンテンツ\n\nこれはテストです。",
) -> tuple[Path, Path, dict[str, str]]:
    doc_dir = tmp_path / "doc"
    trans_dir = tmp_path / "trans"
    doc_dir.mkdir()
    trans_dir.mkdir()

    default_fm = "---\ntitle: Test\ncategory: Overview\n---"
    effective_fm = default_fm if fm is None else fm
    doc_content = f"{effective_fm}\n{body}\n" if effective_fm else body
    doc_path = doc_dir / "page.md"
    doc_path.write_text(doc_content, encoding="utf-8")

    trans_path = trans_dir / "page.md"
    trans_path.write_text(translated, encoding="utf-8")

    return doc_path, trans_path, {"filePath": str(doc_path)}


def test_process_applies_valid_translation(tmp_path: Path) -> None:
    doc_path, trans_path, hit = _setup(tmp_path)
    result = process_one_translation(slug="test/page", trans_path=trans_path, hit=hit)
    assert result == "applied"
    content = doc_path.read_text(encoding="utf-8")
    assert content.startswith("---\ntitle: Test")
    assert "翻訳されたコンテンツ" in content
    assert "Original content" not in content


def test_process_skips_missing_frontmatter(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    doc_path, trans_path, hit = _setup(tmp_path, fm="")
    original = doc_path.read_text(encoding="utf-8")

    result = process_one_translation(slug="test/page", trans_path=trans_path, hit=hit)

    assert result == "skipped"
    assert doc_path.read_text(encoding="utf-8") == original
    captured = capsys.readouterr()
    assert "Skipped test/page" in captured.err
    assert "frontmatter" in captured.err


def test_process_skips_empty_translation(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    doc_path, trans_path, hit = _setup(tmp_path, translated="")
    original = doc_path.read_text(encoding="utf-8")

    result = process_one_translation(slug="test/page", trans_path=trans_path, hit=hit)

    assert result == "skipped"
    assert doc_path.read_text(encoding="utf-8") == original
    captured = capsys.readouterr()
    assert "empty translation" in captured.err


def test_process_skips_prompt_file(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    prompt = (
        "# 翻訳タスク (test/page)\n\n"
        "下記のMarkdown本文を日本語に翻訳してください。\n\n"
        "--- 原文本文ここから ---\n\n"
        "# Original"
    )
    doc_path, trans_path, hit = _setup(tmp_path, translated=prompt)
    original = doc_path.read_text(encoding="utf-8")

    result = process_one_translation(slug="test/page", trans_path=trans_path, hit=hit)

    assert result == "skipped"
    assert doc_path.read_text(encoding="utf-8") == original
    captured = capsys.readouterr()
    assert "untranslated prompt" in captured.err


def test_process_skips_double_frontmatter(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    doubled = "---\ntitle: Oops\n---\n# Content"
    doc_path, trans_path, hit = _setup(tmp_path, translated=doubled)
    original = doc_path.read_text(encoding="utf-8")

    result = process_one_translation(slug="test/page", trans_path=trans_path, hit=hit)

    assert result == "skipped"
    assert doc_path.read_text(encoding="utf-8") == original
    captured = capsys.readouterr()
    assert "frontmatter block" in captured.err


def test_process_returns_unchanged_when_identical(tmp_path: Path) -> None:
    fm = "---\ntitle: Test\n---"
    body = "# Already translated"
    _, trans_path, hit = _setup(tmp_path, fm=fm, body=body, translated=body)
    result = process_one_translation(slug="test/page", trans_path=trans_path, hit=hit)
    assert result == "unchanged"
