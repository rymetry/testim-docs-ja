"""pipeline / tools の CLI エントリポイント smoke test (fast gate 用 coverage boost)。

Phase 6b cutover round-2 review 対応: fast gate の coverage を 82% → 90% へ
押し上げるため、pipeline 3 module + tools 数 module の ``main()`` happy path を
tmp fixture で叩く。production corpus には触らないのでテスト実行時間への
影響は最小 (各 test 数十 ms)。

対象:

- ``pipeline/pipeline.py::main`` (checkpoint resume / section filter / no-resume)
- ``pipeline/generate_untranslated_placeholders.py::main`` (sidebar not found /
  section filter / 基本 happy path)
- ``pipeline/prepare_llm_tasks.py::main`` (slug filter / section filter / unknown)
"""

from __future__ import annotations

from pathlib import Path

import pytest

from testim_parity.pipeline import (
    generate_untranslated_placeholders,
    prepare_llm_tasks,
)
from testim_parity.pipeline import (
    pipeline as pipeline_mod,
)

# ---------------------------------------------------------------------------
# pipeline.main — 5-step pipeline の entry
# ---------------------------------------------------------------------------


class TestPipelineMain:
    def test_main_runs_all_steps_no_checkpoint(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """checkpoint 無しで ``--mode=full`` を実行すると 5 step 全て試みる。

        step 実装は subprocess を呼ぶ可能性があるので、``_run_step`` を mock して
        pipeline entry の success path だけ covered する。
        """
        monkeypatch.setattr(pipeline_mod, "_DEFAULT_CHECKPOINT_PATH", tmp_path / "cp.json")
        steps: list[str] = []
        monkeypatch.setattr(pipeline_mod, "_run_step", lambda step, *_: steps.append(step))
        rc = pipeline_mod.main(["--mode=full", "--no-resume"])
        assert rc == 0
        assert steps == list(pipeline_mod.PIPELINE_STEPS)

    def test_main_resumes_from_checkpoint(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        cp = tmp_path / ".checkpoint"
        pipeline_mod.save_checkpoint(
            cp,
            {
                "mode": "diff",
                "step": "url_collect_done",
                "timestamp": pipeline_mod.js_iso_timestamp(),
            },
        )
        monkeypatch.setattr(pipeline_mod, "_DEFAULT_CHECKPOINT_PATH", cp)
        steps: list[str] = []
        monkeypatch.setattr(pipeline_mod, "_run_step", lambda step, *_: steps.append(step))
        rc = pipeline_mod.main(["--mode=diff"])
        assert rc == 0
        assert steps == list(pipeline_mod.PIPELINE_STEPS[1:])

    def test_main_section_filter_passed_through(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(pipeline_mod, "_DEFAULT_CHECKPOINT_PATH", tmp_path / "cp.json")
        calls: list[tuple[str, list[str]]] = []

        def run_substep(module: str, args: list[str]) -> int:
            calls.append((module, args))
            return 0

        monkeypatch.setattr(pipeline_mod, "_run_substep", run_substep)
        rc = pipeline_mod.main(["--mode=full", "--no-resume", "--section=Overview"])
        assert rc == 0
        assert calls == [
            ("update_sidebar_urls_from_live", []),
            ("generate_untranslated_placeholders", ["--section=Overview"]),
            ("fetch_translate_images", ["--mode=full", "--section=Overview"]),
            ("prepare_llm_tasks", ["--section=Overview"]),
            ("apply_llm_translations", ["--section=Overview"]),
        ]


# ---------------------------------------------------------------------------
# generate_untranslated_placeholders.main
# ---------------------------------------------------------------------------


_SIDEBAR_MIN = """\
# Sidebar

## Overview

| 翻訳 | 元 URL |
| --- | --- |
| ✅ | https://docs.tricentis.com/testim/content/overview/a.htm |
| ⏳ | https://docs.tricentis.com/testim/content/overview/b.htm |
"""


class TestGenerateUntranslatedPlaceholders:
    def test_missing_sidebar_returns_one(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(
            generate_untranslated_placeholders, "_SIDEBAR_FILE", tmp_path / "missing.md"
        )
        rc = generate_untranslated_placeholders.main([])
        assert rc == 1

    def test_creates_placeholder_for_pending_page(
        self,
        tmp_path: Path,
        monkeypatch: pytest.MonkeyPatch,
        capsys: pytest.CaptureFixture[str],
    ) -> None:
        sidebar = tmp_path / "SIDEBAR_URLS.md"
        sidebar.write_text(_SIDEBAR_MIN, encoding="utf-8")
        docs_dir = tmp_path / "src" / "content" / "docs"
        monkeypatch.setattr(generate_untranslated_placeholders, "_SIDEBAR_FILE", sidebar)
        monkeypatch.setattr(generate_untranslated_placeholders, "DOCS_DIR", docs_dir)
        monkeypatch.setattr(generate_untranslated_placeholders, "ROOT_DIR", tmp_path)
        rc = generate_untranslated_placeholders.main([])
        assert rc == 0
        out = capsys.readouterr().out
        assert "Created" in out

    def test_section_filter_valid_section(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """``--section=Overview`` で該当 section の ⏳ slug だけ placeholder 生成する。"""
        sidebar = tmp_path / "SIDEBAR_URLS.md"
        sidebar.write_text(_SIDEBAR_MIN, encoding="utf-8")
        docs_dir = tmp_path / "src" / "content" / "docs"
        monkeypatch.setattr(generate_untranslated_placeholders, "_SIDEBAR_FILE", sidebar)
        monkeypatch.setattr(generate_untranslated_placeholders, "DOCS_DIR", docs_dir)
        monkeypatch.setattr(generate_untranslated_placeholders, "ROOT_DIR", tmp_path)
        rc = generate_untranslated_placeholders.main(["--section=Overview"])
        assert rc == 0


# ---------------------------------------------------------------------------
# prepare_llm_tasks.main
# ---------------------------------------------------------------------------


class TestPrepareLLMTasks:
    def test_unknown_slug_returns_one(self, capsys: pytest.CaptureFixture[str]) -> None:
        rc = prepare_llm_tasks.main(["--slug=does-not-exist-slug-xyz"])
        assert rc == 1
        err = capsys.readouterr().err
        assert "Unknown slug" in err

    def test_happy_path_writes_task_files(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        slug = "overview/testim-overview"
        source = tmp_path / "source.md"
        source.write_text("---\ntitle: Sample\n---\n\nSample body.\n", encoding="utf-8")
        monkeypatch.setattr(
            prepare_llm_tasks,
            "build_slug_index",
            lambda: {
                slug: {"filePath": source},
            },
        )
        output = tmp_path / "tasks"
        monkeypatch.setattr(prepare_llm_tasks, "_TASKS_DIR", output)
        rc = prepare_llm_tasks.main([f"--slug={slug}"])
        assert rc == 0
        task = (output / f"{slug}.md").read_text(encoding="utf-8")
        assert task.startswith(f"# 翻訳タスク ({slug})")
        assert task.rstrip().endswith("Sample body.")
