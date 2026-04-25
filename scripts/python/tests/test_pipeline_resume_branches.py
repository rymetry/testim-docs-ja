"""``testim_parity.pipeline.pipeline`` の ``get_pending_steps`` + ``main()`` の
resume/checkpoint 分岐を網羅する coverage booster。

``test_pipeline.py`` は ``parse_args`` / ``load_checkpoint`` / ``save_checkpoint``
を covered しているが、``get_pending_steps`` の mode/section mismatch 分岐や
``main()`` の step handlers の dispatch branch は 70% のみ。本 test で mode
切替・section filter・resume flag・step dispatch 各 branch を叩く。
"""

from __future__ import annotations

from pathlib import Path

import pytest

from testim_parity.pipeline import pipeline as pipeline_mod


class TestGetPendingStepsBranches:
    def test_no_resume_returns_all_steps(self) -> None:
        steps = pipeline_mod.get_pending_steps({"step": "fetch_done"}, resume=False)
        assert steps == list(pipeline_mod.PIPELINE_STEPS)

    def test_no_checkpoint_returns_all_steps(self) -> None:
        steps = pipeline_mod.get_pending_steps(None, resume=True)
        assert steps == list(pipeline_mod.PIPELINE_STEPS)

    def test_mode_mismatch_returns_all_steps(self) -> None:
        steps = pipeline_mod.get_pending_steps(
            {"mode": "diff", "step": "fetch_done"}, resume=True, mode="full"
        )
        assert steps == list(pipeline_mod.PIPELINE_STEPS)

    def test_section_mismatch_returns_all_steps(self) -> None:
        steps = pipeline_mod.get_pending_steps(
            {"mode": "diff", "step": "fetch_done", "section": "A"},
            resume=True,
            mode="diff",
            section="B",
        )
        assert steps == list(pipeline_mod.PIPELINE_STEPS)

    def test_no_step_returns_all(self) -> None:
        steps = pipeline_mod.get_pending_steps({"mode": "diff"}, resume=True)
        assert steps == list(pipeline_mod.PIPELINE_STEPS)

    def test_unknown_step_returns_all(self) -> None:
        steps = pipeline_mod.get_pending_steps({"mode": "diff", "step": "bogus_done"}, resume=True)
        assert steps == list(pipeline_mod.PIPELINE_STEPS)

    def test_resume_skips_done_steps(self) -> None:
        steps = pipeline_mod.get_pending_steps(
            {"mode": "diff", "step": "placeholders_done"}, resume=True
        )
        # placeholders_done の次 step (fetch) 以降が残る
        assert "url_collect" not in steps
        assert "placeholders" not in steps
        assert "fetch" in steps

    def test_step_without_done_suffix_treated_as_completed(self) -> None:
        """``step`` に ``_done`` suffix が無くても step name として解釈される。"""
        steps = pipeline_mod.get_pending_steps({"mode": "diff", "step": "fetch"}, resume=True)
        # "fetch" が step_name になり、その index + 1 以降が残る
        assert "prepare_llm" in steps
        assert "url_collect" not in steps


class TestJsIsoTimestamp:
    def test_returns_millisecond_precision_z_suffix(self) -> None:
        ts = pipeline_mod.js_iso_timestamp()
        # "YYYY-MM-DDTHH:MM:SS.sssZ" 形式
        assert ts.endswith("Z")
        # "." の後に 3 桁が並ぶ
        assert len(ts.split(".")[-1].rstrip("Z")) == 3


class TestMainBranches:
    def test_main_full_mode_runs_all_steps(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        cp_path = tmp_path / ".checkpoint"
        monkeypatch.setattr(pipeline_mod, "_DEFAULT_CHECKPOINT_PATH", cp_path)

        calls: list[str] = []

        def fake_substep(module_name: str, argv: list[str]) -> int:
            calls.append(module_name)
            return 0

        monkeypatch.setattr(pipeline_mod, "_run_substep", fake_substep)
        rc = pipeline_mod.main(["--mode=full", "--no-resume"])
        assert rc == 0
        # 5 step handler が順次走る
        assert "update_sidebar_urls_from_live" in calls
        assert "generate_untranslated_placeholders" in calls
        assert "fetch_translate_images" in calls
        assert "prepare_llm_tasks" in calls
        assert "apply_llm_translations" in calls

    def test_main_diff_mode_skips_placeholders(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """``--mode=diff`` のとき placeholders step は no-op (mjs 等価)。"""
        cp_path = tmp_path / ".checkpoint"
        monkeypatch.setattr(pipeline_mod, "_DEFAULT_CHECKPOINT_PATH", cp_path)

        calls: list[str] = []

        def fake_substep(module_name: str, argv: list[str]) -> int:
            calls.append(module_name)
            return 0

        monkeypatch.setattr(pipeline_mod, "_run_substep", fake_substep)
        rc = pipeline_mod.main(["--mode=diff", "--no-resume"])
        assert rc == 0
        assert "generate_untranslated_placeholders" not in calls

    def test_main_substep_failure_exits(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """substep が non-zero returns したら ``sys.exit(code)`` で中断。"""
        cp_path = tmp_path / ".checkpoint"
        monkeypatch.setattr(pipeline_mod, "_DEFAULT_CHECKPOINT_PATH", cp_path)

        def failing_substep(module_name: str, argv: list[str]) -> int:
            return 7

        monkeypatch.setattr(pipeline_mod, "_run_substep", failing_substep)
        with pytest.raises(SystemExit) as exc:
            pipeline_mod.main(["--mode=full", "--no-resume"])
        assert exc.value.code == 7


class TestRunStep:
    def test_run_step_saves_done_checkpoint(
        self, tmp_path: Path, capsys: pytest.CaptureFixture[str]
    ) -> None:
        cp = tmp_path / "cp.json"

        def step_fn() -> None:
            pass

        pipeline_mod._run_step("url_collect", step_fn, cp)
        loaded = pipeline_mod.load_checkpoint(cp)
        assert loaded == {"step": "url_collect_done"}
