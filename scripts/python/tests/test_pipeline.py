"""``testim_parity.pipeline.pipeline`` unit tests (Phase 5 port)。

mjs ``scripts/__tests__/pipeline.test.mjs`` の behavioral 等価。
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from testim_parity.pipeline.pipeline import (
    get_pending_steps,
    load_checkpoint,
    parse_args,
    save_checkpoint,
)

# ----------------------------------------------------------------------
# parse_args
# ----------------------------------------------------------------------


@pytest.mark.parametrize(
    "argv,expected_mode",
    [
        (["--mode=full"], "full"),
        (["--mode=diff"], "diff"),
        ([], "diff"),  # default
    ],
)
def test_parse_args_mode(argv: list[str], expected_mode: str) -> None:
    result = parse_args(argv)
    assert result["mode"] == expected_mode


def test_parse_args_section_and_resume() -> None:
    result = parse_args(["--mode=full", "--section=Overview", "--no-resume"])
    assert result["section"] == "Overview"
    assert result["resume"] is False


def test_parse_args_default_resume_is_true() -> None:
    result = parse_args([])
    assert result["resume"] is True


# ----------------------------------------------------------------------
# load_checkpoint / save_checkpoint
# ----------------------------------------------------------------------


def test_load_checkpoint_returns_none_when_missing(tmp_path: Path) -> None:
    assert load_checkpoint(tmp_path / "nonexistent.json") is None


def test_save_and_load_round_trip(tmp_path: Path) -> None:
    cp_path = tmp_path / ".checkpoint"
    data = {
        "completed_phase": "PR-0a",
        "completed_at": "2026-03-13T10:00:00Z",
        "next_phase": "PR-0b",
        "step": "fetch_done",
        "mode": "full",
    }
    save_checkpoint(cp_path, data)
    loaded = load_checkpoint(cp_path)
    assert loaded == data


def test_load_checkpoint_returns_none_for_invalid_json(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    cp_path = tmp_path / ".checkpoint-invalid"
    cp_path.write_text("{not-json", encoding="utf-8")
    assert load_checkpoint(cp_path) is None
    captured = capsys.readouterr()
    assert "Invalid checkpoint" in captured.err


def test_load_checkpoint_rethrows_oserror(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    cp_path = tmp_path / ".checkpoint"
    cp_path.write_text('{"step":"fetch_done"}', encoding="utf-8")

    original = Path.read_text

    def boom(self: Path, *args: object, **kwargs: object) -> str:
        if self == cp_path:
            raise PermissionError("permission denied")
        return original(self, *args, **kwargs)  # type: ignore[arg-type]

    monkeypatch.setattr(Path, "read_text", boom)
    with pytest.raises(PermissionError, match="permission denied"):
        load_checkpoint(cp_path)


def test_save_checkpoint_overwrites_existing(tmp_path: Path) -> None:
    cp_path = tmp_path / ".checkpoint-overwrite"
    save_checkpoint(cp_path, {"step": "url_collect_done"})
    save_checkpoint(cp_path, {"step": "fetch_done"})
    loaded = load_checkpoint(cp_path)
    assert loaded is not None
    assert loaded["step"] == "fetch_done"


def test_save_checkpoint_creates_parent_directories(tmp_path: Path) -> None:
    nested = tmp_path / "sub" / "dir" / ".checkpoint"
    save_checkpoint(nested, {"step": "init"})
    assert nested.exists()


def test_saved_file_is_valid_json(tmp_path: Path) -> None:
    cp_path = tmp_path / ".checkpoint-json"
    save_checkpoint(cp_path, {"completed_phase": "PR-0b", "mode": "diff"})
    raw = cp_path.read_text(encoding="utf-8")
    # json.loads must succeed (mjs: assert.doesNotThrow(JSON.parse))
    json.loads(raw)


def test_checkpoint_json_includes_all_fields(tmp_path: Path) -> None:
    cp_path = tmp_path / ".checkpoint-fields"
    data = {
        "completed_phase": "PR-0a",
        "completed_at": "2026-03-13T10:00:00Z",
        "next_phase": "PR-0b",
        "step": "apply_llm_done",
        "mode": "full",
    }
    save_checkpoint(cp_path, data)
    parsed = json.loads(cp_path.read_text(encoding="utf-8"))
    for k, v in data.items():
        assert parsed[k] == v


def test_checkpoint_step_update_preserves_other_fields(tmp_path: Path) -> None:
    cp_path = tmp_path / ".checkpoint-step"
    save_checkpoint(
        cp_path,
        {"completed_phase": "PR-0a", "mode": "full", "step": "url_collect_done"},
    )
    existing = load_checkpoint(cp_path)
    assert existing is not None
    save_checkpoint(cp_path, {**existing, "step": "fetch_done"})

    updated = load_checkpoint(cp_path)
    assert updated is not None
    assert updated["step"] == "fetch_done"
    assert updated["completed_phase"] == "PR-0a"
    assert updated["mode"] == "full"


# ----------------------------------------------------------------------
# get_pending_steps
# ----------------------------------------------------------------------


def test_pending_steps_all_when_resume_disabled() -> None:
    steps = get_pending_steps(
        {"step": "fetch_done", "mode": "diff"},
        resume=False,
        mode="diff",
    )
    assert steps == ["url_collect", "placeholders", "fetch", "prepare_llm", "apply_llm"]


def test_pending_steps_skips_completed_when_matching_mode_section() -> None:
    steps = get_pending_steps(
        {"step": "fetch_done", "mode": "diff", "section": "Overview"},
        resume=True,
        mode="diff",
        section="Overview",
    )
    assert steps == ["prepare_llm", "apply_llm"]


def test_pending_steps_full_list_on_mode_mismatch() -> None:
    steps = get_pending_steps(
        {"step": "fetch_done", "mode": "full"},
        resume=True,
        mode="diff",
    )
    assert steps == ["url_collect", "placeholders", "fetch", "prepare_llm", "apply_llm"]


def test_pending_steps_full_list_on_section_mismatch() -> None:
    steps = get_pending_steps(
        {"step": "fetch_done", "mode": "diff", "section": "Other"},
        resume=True,
        mode="diff",
        section="Overview",
    )
    assert steps == ["url_collect", "placeholders", "fetch", "prepare_llm", "apply_llm"]


def test_pending_steps_full_list_on_null_checkpoint() -> None:
    steps = get_pending_steps(None, resume=True, mode="diff")
    assert steps == ["url_collect", "placeholders", "fetch", "prepare_llm", "apply_llm"]
