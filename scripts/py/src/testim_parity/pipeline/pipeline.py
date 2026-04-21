"""``scripts/pipeline/pipeline.mjs`` の Python port。

翻訳 pipeline の entry point。``scripts/.checkpoint`` に resume 情報を保存し、
5 step (url_collect / placeholders / fetch / prepare_llm / apply_llm) を
順次実行する。``--mode=full`` で placeholder 生成も行う (default: diff)。
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from ..project import ROOT_DIR

__all__ = [
    "PIPELINE_STEPS",
    "get_pending_steps",
    "js_iso_timestamp",
    "load_checkpoint",
    "main",
    "parse_args",
    "save_checkpoint",
]


def js_iso_timestamp(now: datetime | None = None) -> str:
    """mjs ``new Date().toISOString()`` 等価 (``YYYY-MM-DDTHH:MM:SS.sssZ``)。

    ``datetime.isoformat(timespec='milliseconds')`` は tz-aware だと ``+00:00``
    が末尾に付いてしまい、さらに ``"Z"`` を concat すると ``+00:00Z`` という
    不正な ISO-8601 になる。mjs の仕様どおり ms 3 桁 + ``Z`` で揃える。
    """
    current = now or datetime.now(tz=UTC)
    return current.strftime("%Y-%m-%dT%H:%M:%S.") + f"{current.microsecond // 1000:03d}Z"


_DEFAULT_CHECKPOINT_PATH: Path = ROOT_DIR / "scripts" / ".checkpoint"

PIPELINE_STEPS: tuple[str, ...] = (
    "url_collect",
    "placeholders",
    "fetch",
    "prepare_llm",
    "apply_llm",
)


def parse_args(argv: list[str]) -> dict[str, Any]:
    """mjs ``parseArgs`` 等価 (``{mode, section, resume}`` を返す)。"""
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--mode", default="diff")
    parser.add_argument("--section", default=None)
    parser.add_argument("--no-resume", action="store_true")
    args, _ = parser.parse_known_args(argv)
    return {
        "mode": args.mode,
        "section": args.section,
        "resume": not args.no_resume,
    }


def load_checkpoint(checkpoint_path: Path) -> dict[str, Any] | None:
    """mjs ``loadCheckpoint`` 等価。JSON 破損時は warn して None を返す。"""
    if not checkpoint_path.exists():
        return None
    try:
        data: dict[str, Any] = json.loads(checkpoint_path.read_text(encoding="utf-8"))
        return data
    except json.JSONDecodeError as err:
        print(
            f"Invalid checkpoint at {checkpoint_path}; ignoring and restarting pipeline. {err}",
            file=sys.stderr,
        )
        return None


def save_checkpoint(checkpoint_path: Path, data: dict[str, Any]) -> None:
    """mjs ``saveCheckpoint`` 等価 (2-space JSON で overwrite)。"""
    checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
    checkpoint_path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def get_pending_steps(
    checkpoint: dict[str, Any] | None,
    *,
    resume: bool = True,
    mode: str = "diff",
    section: str | None = None,
) -> list[str]:
    """resume flag + checkpoint を元に残 steps を返す (mjs 等価)。"""
    if not resume or not checkpoint:
        return list(PIPELINE_STEPS)
    if (checkpoint.get("mode") or "diff") != mode:
        return list(PIPELINE_STEPS)
    if checkpoint.get("section") != section:
        return list(PIPELINE_STEPS)
    step = checkpoint.get("step")
    if not step:
        return list(PIPELINE_STEPS)
    step_name = step[:-5] if step.endswith("_done") else step
    if step_name not in PIPELINE_STEPS:
        return list(PIPELINE_STEPS)
    index = PIPELINE_STEPS.index(step_name)
    return list(PIPELINE_STEPS[index + 1 :])


def _run_step(name: str, fn: Any, checkpoint_path: Path) -> None:
    print(f"\n▶ Step: {name}")
    fn()
    existing = load_checkpoint(checkpoint_path) or {}
    save_checkpoint(checkpoint_path, {**existing, "step": f"{name}_done"})


def _run_substep(module_name: str, argv: list[str]) -> int:
    """子 step を inproc で呼び出す (mjs は spawn('node') だが Python は直接 import)。"""
    from importlib import import_module

    mod = import_module(f"testim_parity.pipeline.{module_name}")
    return int(mod.main(argv))


def main(argv: list[str] | None = None) -> int:
    """CLI エントリポイント (exit 0 or step exit code)。"""
    if argv is None:
        argv = sys.argv[1:]
    opts = parse_args(argv)
    mode = opts["mode"]
    section = opts["section"]
    resume = opts["resume"]

    checkpoint_path = _DEFAULT_CHECKPOINT_PATH
    checkpoint = load_checkpoint(checkpoint_path)
    pending_steps = get_pending_steps(checkpoint, resume=resume, mode=mode, section=section)

    save_checkpoint(checkpoint_path, {**(checkpoint or {}), "mode": mode, "section": section})

    section_args: list[str] = [f"--section={section}"] if section else []
    mode_args: list[str] = [f"--mode={mode}"]

    def _url_collect() -> None:
        code = _run_substep("update_sidebar_urls_from_live", [])
        if code != 0:
            print("url_collect step failed. Aborting pipeline.", file=sys.stderr)
            sys.exit(code)

    def _placeholders() -> None:
        if mode != "full":
            return
        code = _run_substep("generate_untranslated_placeholders", section_args)
        if code != 0:
            print("placeholders step failed. Aborting pipeline.", file=sys.stderr)
            sys.exit(code)

    def _fetch() -> None:
        code = _run_substep("fetch_translate_images", [*mode_args, *section_args])
        if code != 0:
            print("fetch step failed. Aborting pipeline.", file=sys.stderr)
            sys.exit(code)

    def _prepare_llm() -> None:
        code = _run_substep("prepare_llm_tasks", section_args)
        if code != 0:
            print("prepare_llm step failed. Aborting pipeline.", file=sys.stderr)
            sys.exit(code)

    def _apply_llm() -> None:
        code = _run_substep("apply_llm_translations", section_args)
        if code != 0:
            print("apply_llm step failed. Aborting pipeline.", file=sys.stderr)
            sys.exit(code)

    step_handlers = {
        "url_collect": _url_collect,
        "placeholders": _placeholders,
        "fetch": _fetch,
        "prepare_llm": _prepare_llm,
        "apply_llm": _apply_llm,
    }

    for step in pending_steps:
        _run_step(step, step_handlers[step], checkpoint_path)

    save_checkpoint(
        checkpoint_path,
        {
            "completed_phase": "PR-final",
            "completed_at": js_iso_timestamp(),
            "next_phase": None,
            "step": "apply_llm_done",
            "mode": mode,
            "section": section,
        },
    )
    print("\n✅ Pipeline complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
