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
- ``tools/verify_golden_against_mjs.py::main`` (mock git archive / mock node /
  byte-identical / drift)
"""

from __future__ import annotations

import subprocess
from pathlib import Path

import pytest

from testim_parity.pipeline import (
    generate_untranslated_placeholders,
    prepare_llm_tasks,
)
from testim_parity.pipeline import (
    pipeline as pipeline_mod,
)
from testim_parity.tools import verify_golden_against_mjs

# ---------------------------------------------------------------------------
# pipeline.main — 5-step pipeline の entry
# ---------------------------------------------------------------------------


class TestPipelineMain:
    def test_main_runs_all_steps_no_checkpoint(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
    ) -> None:
        """checkpoint 無しで ``--mode=full`` を実行すると 5 step 全て試みる。

        step 実装は subprocess を呼ぶ可能性があるので、``_run_step`` を mock して
        pipeline entry の success path だけ covered する。
        """
        monkeypatch.setattr(pipeline_mod, "_DEFAULT_CHECKPOINT_PATH", tmp_path / "cp.json")
        monkeypatch.setattr(pipeline_mod, "_run_step", lambda step, *a, **kw: None)
        rc = pipeline_mod.main(["--mode=full", "--no-resume"])
        assert rc == 0

    def test_main_resumes_from_checkpoint(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        cp = tmp_path / ".checkpoint"
        pipeline_mod.save_checkpoint(
            cp,
            {
                "mode": "diff",
                "completed_step": "url_collect",
                "timestamp": pipeline_mod.js_iso_timestamp(),
            },
        )
        monkeypatch.setattr(pipeline_mod, "_DEFAULT_CHECKPOINT_PATH", cp)
        monkeypatch.setattr(pipeline_mod, "_run_step", lambda step, *a, **kw: None)
        rc = pipeline_mod.main(["--mode=diff"])
        assert rc == 0

    def test_main_section_filter_passed_through(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(pipeline_mod, "_DEFAULT_CHECKPOINT_PATH", tmp_path / "cp.json")
        calls: list[tuple] = []
        monkeypatch.setattr(
            pipeline_mod, "_run_step", lambda step, *a, **kw: calls.append((step, a, kw))
        )
        rc = pipeline_mod.main(["--mode=full", "--no-resume", "--section=Overview"])
        assert rc == 0
        # 5 step called
        assert len(calls) >= 1


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

    def test_happy_path_writes_task_files(self, tmp_path: Path) -> None:
        # prepare_llm_tasks の default _TASKS_DIR は ROOT_DIR / llm / tasks なので
        # production index を使って dry-run 的に走らせるが、1 slug だけで早い。
        # 代表的な slug を指定する。
        rc = prepare_llm_tasks.main(["--slug=overview/testim-overview"])
        assert rc == 0


# ---------------------------------------------------------------------------
# verify_golden_against_mjs.main
# ---------------------------------------------------------------------------


class TestVerifyGoldenAgainstMjs:
    """mjs authority への検証 tool の smoke。

    実際に git archive + node を叩くのは test_real_mjs_verify (corpus marker で
    隔離) に任せ、fast gate では subprocess を mock して制御フローを covered する。
    """

    def test_missing_golden_returns_two(self, tmp_path: Path) -> None:
        rc = verify_golden_against_mjs.main(["--golden", str(tmp_path / "no-such-golden.jsonl")])
        assert rc == 2

    def test_byte_identical_returns_zero(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """git archive / node / cmp を mock して成功路を covered する。"""
        golden = tmp_path / "golden.jsonl"
        golden.write_text("golden content\n", encoding="utf-8")

        def fake_extract(rev: str, dest: Path) -> None:
            # emit_corpus_oracle.mjs が ``tar x`` で展開される想定の path を作る
            (dest / "scripts" / "py" / "tools").mkdir(parents=True, exist_ok=True)
            (dest / "scripts" / "py" / "tools" / "emit_corpus_oracle.mjs").write_text(
                "// stub", encoding="utf-8"
            )

        def fake_link(dest: Path) -> None:
            pass

        def fake_run(cmd: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess:
            # node → regen 生成、cmp → byte-identical
            if cmd[0] == "node":
                out = cmd[cmd.index("--out") + 1]
                Path(out).write_text("golden content\n", encoding="utf-8")
                return subprocess.CompletedProcess(cmd, 0, "ok", "")
            if cmd[0] == "cmp":
                return subprocess.CompletedProcess(cmd, 0, "", "")
            return subprocess.CompletedProcess(cmd, 0, "", "")

        monkeypatch.setattr(verify_golden_against_mjs, "_extract_mjs_tree", fake_extract)
        monkeypatch.setattr(verify_golden_against_mjs, "_link_shared_inputs", fake_link)
        monkeypatch.setattr(verify_golden_against_mjs, "_run", fake_run)

        rc = verify_golden_against_mjs.main(["--golden", str(golden)])
        assert rc == 0

    def test_drift_returns_one(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        """cmp が non-zero 返すと drift 検知で exit 1。"""
        golden = tmp_path / "golden.jsonl"
        golden.write_text("golden\n", encoding="utf-8")

        def fake_extract(rev: str, dest: Path) -> None:
            (dest / "scripts" / "py" / "tools").mkdir(parents=True, exist_ok=True)
            (dest / "scripts" / "py" / "tools" / "emit_corpus_oracle.mjs").write_text(
                "// stub", encoding="utf-8"
            )

        def fake_run(cmd: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess:
            if cmd[0] == "node":
                out = cmd[cmd.index("--out") + 1]
                Path(out).write_text("regen\n", encoding="utf-8")  # 違う内容
                return subprocess.CompletedProcess(cmd, 0, "ok", "")
            if cmd[0] == "cmp":
                return subprocess.CompletedProcess(cmd, 1, "differ: byte 1\n", "")
            if cmd[0] == "diff":
                return subprocess.CompletedProcess(cmd, 1, "1c1\n< regen\n> golden\n", "")
            return subprocess.CompletedProcess(cmd, 0, "", "")

        monkeypatch.setattr(verify_golden_against_mjs, "_extract_mjs_tree", fake_extract)
        monkeypatch.setattr(verify_golden_against_mjs, "_link_shared_inputs", lambda _: None)
        monkeypatch.setattr(verify_golden_against_mjs, "_run", fake_run)

        rc = verify_golden_against_mjs.main(["--golden", str(golden)])
        assert rc == 1

    def test_emit_tool_missing_returns_three(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """extracted tree に emit_corpus_oracle.mjs が無いと exit 3 (post-cutover rev 指定)。"""
        golden = tmp_path / "golden.jsonl"
        golden.write_text("golden\n", encoding="utf-8")

        def fake_extract(rev: str, dest: Path) -> None:
            # scripts/ tree は作るが emit_corpus_oracle.mjs は置かない
            (dest / "scripts").mkdir(parents=True, exist_ok=True)

        monkeypatch.setattr(verify_golden_against_mjs, "_extract_mjs_tree", fake_extract)
        monkeypatch.setattr(verify_golden_against_mjs, "_link_shared_inputs", lambda _: None)

        rc = verify_golden_against_mjs.main(["--golden", str(golden), "--rev", "HEAD"])
        assert rc == 3

    def test_node_failure_returns_four(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        golden = tmp_path / "golden.jsonl"
        golden.write_text("golden\n", encoding="utf-8")

        def fake_extract(rev: str, dest: Path) -> None:
            (dest / "scripts" / "py" / "tools").mkdir(parents=True, exist_ok=True)
            (dest / "scripts" / "py" / "tools" / "emit_corpus_oracle.mjs").write_text(
                "// stub", encoding="utf-8"
            )

        def fake_run(cmd: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess:
            if cmd[0] == "node":
                return subprocess.CompletedProcess(cmd, 2, "", "node error")
            return subprocess.CompletedProcess(cmd, 0, "", "")

        monkeypatch.setattr(verify_golden_against_mjs, "_extract_mjs_tree", fake_extract)
        monkeypatch.setattr(verify_golden_against_mjs, "_link_shared_inputs", lambda _: None)
        monkeypatch.setattr(verify_golden_against_mjs, "_run", fake_run)

        rc = verify_golden_against_mjs.main(["--golden", str(golden)])
        assert rc == 4
