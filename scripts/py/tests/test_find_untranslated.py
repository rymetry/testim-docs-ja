"""``testim_parity.detection.find_untranslated`` の unit test (Phase 5 port)。

mjs ``scripts/__tests__/find_untranslated.test.mjs`` の behavioral 等価。
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from testim_parity.detection import find_untranslated as fu
from testim_parity.detection.find_untranslated import (
    find_untranslated_blocks,
    main,
    split_markdown_blocks,
)

# ----------------------------------------------------------------------
# split_markdown_blocks — frontmatter skip
# ----------------------------------------------------------------------


def test_split_skips_frontmatter() -> None:
    md = "---\ntitle: Test\nupdated: 2026-01-01\n---\n\nHello world.\n"
    blocks = split_markdown_blocks(md)
    texts = [" ".join(b["lines"]) for b in blocks]  # type: ignore[arg-type]
    assert not any("title:" in t or "updated:" in t for t in texts)
    assert any("Hello world." in t for t in texts)


def test_split_without_frontmatter() -> None:
    md = "Intro paragraph.\n\nSecond paragraph.\n"
    blocks = split_markdown_blocks(md)
    assert len(blocks) == 2


# ----------------------------------------------------------------------
# split_markdown_blocks — block boundaries
# ----------------------------------------------------------------------


def test_split_on_blank_line() -> None:
    md = "Para one.\n\nPara two.\n"
    blocks = split_markdown_blocks(md)
    assert len(blocks) == 2


def test_split_on_heading() -> None:
    md = "Before heading.\n# Heading\nAfter heading.\n"
    blocks = split_markdown_blocks(md)
    texts = [" ".join(b["lines"]) for b in blocks]  # type: ignore[arg-type]
    assert "Before heading." in texts
    assert "After heading." in texts
    assert not any("# Heading" in t for t in texts)


def test_split_on_code_fence() -> None:
    md = "Before fence.\n```js\nconsole.log(1);\n```\nAfter fence.\n"
    blocks = split_markdown_blocks(md)
    texts = [" ".join(b["lines"]) for b in blocks]  # type: ignore[arg-type]
    assert "Before fence." in texts
    assert "After fence." in texts


def test_split_on_callout() -> None:
    md = "Before.\n:::note\ncontent\n:::\nAfter.\n"
    blocks = split_markdown_blocks(md)
    texts = [" ".join(b["lines"]) for b in blocks]  # type: ignore[arg-type]
    assert "Before." in texts
    assert "After." in texts


def test_split_on_image() -> None:
    md = "Intro.\n![alt](image.png)\nOutro.\n"
    blocks = split_markdown_blocks(md)
    texts = [" ".join(b["lines"]) for b in blocks]  # type: ignore[arg-type]
    assert "Intro." in texts
    assert "Outro." in texts


# ----------------------------------------------------------------------
# find_untranslated_blocks — classify_segment integration
# ----------------------------------------------------------------------


def test_flags_english_only_block() -> None:
    blocks = split_markdown_blocks("This is a full English paragraph.\n")
    findings = find_untranslated_blocks(blocks)
    assert len(findings) >= 1


def test_does_not_flag_japanese_only_block() -> None:
    blocks = split_markdown_blocks("これは日本語のみの段落です。\n")
    findings = find_untranslated_blocks(blocks)
    assert len(findings) == 0


def test_does_not_flag_glossary_only_block() -> None:
    blocks = split_markdown_blocks("Visual Editor は Testim のコンポーネントです。\n")
    findings = find_untranslated_blocks(blocks)
    assert len(findings) == 0


# ----------------------------------------------------------------------
# CLI exit code contract (T8 P8 fail-fast)
# ----------------------------------------------------------------------


def _prepare_baseline(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Redirect ``_BASELINE_PATH`` to an empty baseline under ``tmp_path``."""
    baseline = tmp_path / "parity-baseline.json"
    baseline.write_text(json.dumps({"schemaVersion": 2, "entries": []}), encoding="utf-8")
    monkeypatch.setattr(fu, "_BASELINE_PATH", baseline)


def test_exits_2_when_slug_does_not_exist(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    _prepare_baseline(tmp_path, monkeypatch)
    # Redirect DOCS_DIR to an empty tmp subdir so no slug resolves to a real file.
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    monkeypatch.setattr(fu, "DOCS_DIR", docs_dir)

    exit_code = main(["--slug=__does_not_exist__/totally/fake"])
    assert exit_code == 2


def test_rejects_path_traversal_slug(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    _prepare_baseline(tmp_path, monkeypatch)
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    monkeypatch.setattr(fu, "DOCS_DIR", docs_dir)

    exit_code = main(["--slug=../../etc/passwd"])
    assert exit_code == 2
    captured = capsys.readouterr()
    assert "REJECT" in captured.err


def test_baseline_mode_does_not_exit_2_on_missing_files(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """When --slug is not set and baseline slugs don't exist → SKIP, exit 0."""
    baseline = tmp_path / "parity-baseline.json"
    baseline.write_text(
        json.dumps(
            {
                "schemaVersion": 2,
                "entries": [
                    {
                        "slug": "nonexistent/page",
                        "issueType": "segment-untranslated",
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(fu, "_BASELINE_PATH", baseline)
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    monkeypatch.setattr(fu, "DOCS_DIR", docs_dir)

    exit_code = main(["--limit=1"])
    assert exit_code != 2


def test_empty_baseline_warns_when_no_slug_filter(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    _prepare_baseline(tmp_path, monkeypatch)
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    monkeypatch.setattr(fu, "DOCS_DIR", docs_dir)

    exit_code = main([])
    assert exit_code == 0
    captured = capsys.readouterr()
    assert "WARN" in captured.err
    assert "no segment-untranslated" in captured.err
