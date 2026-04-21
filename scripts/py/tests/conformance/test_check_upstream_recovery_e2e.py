"""``check_upstream_recovery`` CLI の end-to-end byte parity test.

Phase 4b M5: Python CLI (``testim_parity.detection.check_upstream_recovery``)
と mjs CLI (``scripts/detection/check_upstream_recovery.mjs``) が同じ snapshot /
patch / exclusion / source-sync 入力に対して byte-identical の:

- ``upstream-recovery-status.json`` payload
- summary stdout (``→`` 以前の部分。path relative 化は ROOT_DIR 依存なので
  "→ path" suffix は normalize 対象)

を生成することを検証する。mjs 側は exported ``runCheckUpstreamRecovery`` が
``outputPath`` / ``snapshotsRoot`` / ``sourceSyncStatus`` / ``patches`` /
``exclusions`` / ``nowMs`` を parameter 化しているので、driver ``.mjs`` で直接
driver-level に呼ぶ。Python 側も同じ kwargs を受ける契約 (port 時に揃えた)。
"""

from __future__ import annotations

import io
import json
import re
import subprocess
from pathlib import Path
from typing import Any

import pytest

from testim_parity.detection.check_upstream_recovery import run_check_upstream_recovery

_DRIVER_SCRIPT = """\
import {{ writeFileSync, readFileSync, mkdirSync, existsSync }} from 'node:fs';
import {{ runCheckUpstreamRecovery }} from '{check_upstream_mjs}';

const ROOT = {root_json};
const NOW_MS = {now_ms};
const PATCHES = {patches_json};
const EXCLUSIONS = {exclusions_json};
const SOURCE_SYNC_STATUS = {source_sync_status_json};
const SNAPSHOTS_ROOT = `${{ROOT}}/snapshots/en/content`;
const OUTPUT_PATH = `${{ROOT}}/upstream-recovery-status.json`;

let captured = '';
const stdout = (line) => {{ captured += line + '\\n'; }};

runCheckUpstreamRecovery({{
  outputPath: OUTPUT_PATH,
  snapshotsRoot: SNAPSHOTS_ROOT,
  patches: PATCHES,
  exclusions: EXCLUSIONS,
  sourceSyncStatus: SOURCE_SYNC_STATUS,
  nowMs: NOW_MS,
  stdout,
}});

process.stdout.write(captured);
"""


def _write_driver(
    tmp_path: Path,
    repo_root: Path,
    *,
    now_ms: int,
    patches: list[dict[str, Any]],
    exclusions: dict[str, dict[str, Any]],
    source_sync_status: dict[str, Any] | None,
) -> Path:
    check_mjs = repo_root / "scripts" / "detection" / "check_upstream_recovery.mjs"
    driver_src = _DRIVER_SCRIPT.format(
        check_upstream_mjs=check_mjs.as_posix(),
        root_json=json.dumps(str(tmp_path)),
        now_ms=now_ms,
        patches_json=json.dumps(patches),
        exclusions_json=json.dumps(exclusions),
        source_sync_status_json=json.dumps(source_sync_status),
    )
    driver_path = tmp_path / "_driver.mjs"
    driver_path.write_text(driver_src, encoding="utf-8")
    return driver_path


def _run_mjs(driver: Path, repo_root: Path) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["node", str(driver)],
        capture_output=True,
        text=True,
        check=False,
        cwd=str(repo_root),
        timeout=60,
    )
    return proc.returncode, proc.stdout, proc.stderr


_STDOUT_TAIL_RE = re.compile(r" → [^\n]+$")


def _normalize_stdout(line: str) -> str:
    """末尾の ``→ <path>`` 部は mjs/Python で relativize 方針が違うので除去する。"""
    return _STDOUT_TAIL_RE.sub("", line.rstrip("\n"))


def _normalize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """``generatedAt`` は ``now_ms`` で固定するので残す。他に volatile field は無い。"""
    return payload


@pytest.mark.integration
def test_check_upstream_recovery_empty_inputs_parity(
    tmp_path: Path, repo_root: Path, node_available: bool
) -> None:
    """patches / exclusions 空 → summary counter 全 0 + mechanisms 空配列。"""
    if not node_available:
        pytest.skip("node not available; cross-runtime parity requires node")

    py_tmp = tmp_path / "py"
    mjs_tmp = tmp_path / "mjs"
    (py_tmp / "snapshots" / "en" / "content").mkdir(parents=True)
    (mjs_tmp / "snapshots" / "en" / "content").mkdir(parents=True)

    now_ms = 1_714_000_000_000  # 2024-04-24 fixed

    # --- Python 側 ---
    py_stdout = io.StringIO()
    py_payload = run_check_upstream_recovery(
        output_path=py_tmp / "upstream-recovery-status.json",
        stdout=py_stdout,
        now_ms=now_ms,
        snapshots_root=py_tmp / "snapshots" / "en" / "content",
        patches=[],
        exclusions={},
        source_sync_status=None,
    )

    # --- mjs 側 ---
    driver = _write_driver(
        mjs_tmp,
        repo_root,
        now_ms=now_ms,
        patches=[],
        exclusions={},
        source_sync_status=None,
    )
    mjs_code, mjs_stdout, mjs_stderr = _run_mjs(driver, repo_root)
    assert mjs_code == 0, f"mjs stderr: {mjs_stderr}"

    mjs_payload = json.loads(
        (mjs_tmp / "upstream-recovery-status.json").read_text(encoding="utf-8")
    )

    assert _normalize_payload(py_payload) == _normalize_payload(mjs_payload), (
        "upstream-recovery-status.json byte drift"
    )
    assert _normalize_stdout(py_stdout.getvalue()) == _normalize_stdout(mjs_stdout), (
        "summary stdout byte drift"
    )


@pytest.mark.integration
def test_check_upstream_recovery_with_exclusion_signals_parity(
    tmp_path: Path, repo_root: Path, node_available: bool
) -> None:
    """source-sync-status の fetchStatus を 3 variant (recovered/broken/unknown) で流し、
    counter と per-entry shape が mjs/Python で byte-identical。"""
    if not node_available:
        pytest.skip("node not available; cross-runtime parity requires node")

    py_tmp = tmp_path / "py"
    mjs_tmp = tmp_path / "mjs"
    (py_tmp / "snapshots" / "en" / "content").mkdir(parents=True)
    (mjs_tmp / "snapshots" / "en" / "content").mkdir(parents=True)

    now_ms = 1_714_000_000_000

    exclusions = {
        "overview/recovered": {
            "addedAt": "2026-01-01",
            "reviewAfter": "2026-06-01",
            "reason": "fixture",
        },
        "overview/broken": {
            "addedAt": "2026-02-01",
            "reviewAfter": "2026-03-01",  # overdue vs now_ms=2024 だが、2024 でも overdue
            "reason": "fixture",
        },
        "overview/unknown": {
            "addedAt": "2026-03-01",
            "reviewAfter": None,
            "reason": "fixture",
        },
    }

    source_sync_status: dict[str, Any] = {
        "pages": [
            {"slug": "overview/recovered", "fetchStatus": "excluded-recovered"},
            {"slug": "overview/broken", "fetchStatus": "excluded-broken"},
            # overview/unknown is deliberately omitted → fetchStatus = 'unknown'
        ]
    }

    # --- Python 側 ---
    py_stdout = io.StringIO()
    py_payload = run_check_upstream_recovery(
        output_path=py_tmp / "upstream-recovery-status.json",
        stdout=py_stdout,
        now_ms=now_ms,
        snapshots_root=py_tmp / "snapshots" / "en" / "content",
        patches=[],
        exclusions=exclusions,
        source_sync_status=source_sync_status,
    )

    driver = _write_driver(
        mjs_tmp,
        repo_root,
        now_ms=now_ms,
        patches=[],
        exclusions=exclusions,
        source_sync_status=source_sync_status,
    )
    mjs_code, mjs_stdout, mjs_stderr = _run_mjs(driver, repo_root)
    assert mjs_code == 0, f"mjs stderr: {mjs_stderr}"

    mjs_payload = json.loads(
        (mjs_tmp / "upstream-recovery-status.json").read_text(encoding="utf-8")
    )

    assert py_payload == mjs_payload, "upstream-recovery-status.json byte drift"
    # mechanism counter が期待どおり (sanity check)。
    assert py_payload["summary"]["totalEntries"] == 3
    assert py_payload["summary"]["staleEntries"] == 1
    assert py_payload["summary"]["unknownEntries"] == 1
    assert py_payload["summary"]["activeEntries"] == 1

    assert _normalize_stdout(py_stdout.getvalue()) == _normalize_stdout(mjs_stdout), (
        "summary stdout byte drift"
    )


@pytest.mark.integration
def test_check_upstream_recovery_with_unknown_patch_parity(
    tmp_path: Path, repo_root: Path, node_available: bool
) -> None:
    """patch 登録あり + snapshot 不在 → statusA = 'unknown' (両 CLI 同一)。"""
    if not node_available:
        pytest.skip("node not available; cross-runtime parity requires node")

    py_tmp = tmp_path / "py"
    mjs_tmp = tmp_path / "mjs"
    (py_tmp / "snapshots" / "en" / "content").mkdir(parents=True)
    (mjs_tmp / "snapshots" / "en" / "content").mkdir(parents=True)

    now_ms = 1_714_000_000_000

    # NOTE: patches argument は mjs 側 enumeration loop 用のみ (hit detection は
    # live ``EN_SOURCE_PATCHES`` を使う)。snapshot 不在なので hit 0 / statusA =
    # 'unknown' になる経路を両 CLI で検証する。
    patches = [
        {
            "id": "SYNTH-1",
            "slugs": ["overview/nonexistent"],
            "defectClass": "synthetic",
            "find": "<p>x</p>",
            "replace": "<p>y</p>",
            "rationale": "fixture",
            "linkedDefect": None,
            "addedAt": "2026-01-01",
            "reviewAfter": "2026-06-01",
        }
    ]

    py_stdout = io.StringIO()
    py_payload = run_check_upstream_recovery(
        output_path=py_tmp / "upstream-recovery-status.json",
        stdout=py_stdout,
        now_ms=now_ms,
        snapshots_root=py_tmp / "snapshots" / "en" / "content",
        patches=patches,
        exclusions={},
        source_sync_status=None,
    )

    driver = _write_driver(
        mjs_tmp,
        repo_root,
        now_ms=now_ms,
        patches=patches,
        exclusions={},
        source_sync_status=None,
    )
    mjs_code, mjs_stdout, mjs_stderr = _run_mjs(driver, repo_root)
    assert mjs_code == 0, f"mjs stderr: {mjs_stderr}"

    mjs_payload = json.loads(
        (mjs_tmp / "upstream-recovery-status.json").read_text(encoding="utf-8")
    )

    assert py_payload == mjs_payload, "upstream-recovery-status.json byte drift"
    [entry] = py_payload["mechanisms"]["en_source_patches"]
    assert entry["statusA"] == "unknown"
    assert entry["hits"] == 0

    assert _normalize_stdout(py_stdout.getvalue()) == _normalize_stdout(mjs_stdout), (
        "summary stdout byte drift"
    )
