"""``render_upstream_recovery_comment`` CLI の end-to-end byte parity test.

Phase 4b M5: Python CLI (``testim_parity.detection.render_upstream_recovery_comment``)
と mjs CLI (``scripts/detection/render_upstream_recovery_comment.mjs``) が同じ
``upstream-recovery-status.json`` 入力に対して byte-identical の:

- stdout (``has_signals=true|false\\n``)
- ``upstream-recovery-comment.md`` (signal あり時のみ)
- comment 削除挙動 (signal 無しで既存 comment がある場合は delete)

を生成することを検証する。mjs 側は ``ROOT_DIR`` が script location から導出
されるため、driver ``.mjs`` script を tmp_path に書き出して
``renderUpstreamRecoveryStickyComment`` export を直接呼び、Python CLI と同じ
tmp_path に書き出す形で orchestration を揃える。
"""

from __future__ import annotations

import io
import json
import shutil
import subprocess
from pathlib import Path
from typing import Any

import pytest

from testim_parity.detection.render_upstream_recovery_comment import (
    main as render_upstream_main,
)

_DRIVER_SCRIPT = """\
import {{ readFileSync, writeFileSync, existsSync, unlinkSync }} from 'node:fs';
import {{ renderUpstreamRecoveryStickyComment }} from '{detection_reports_mjs}';

const ROOT = {root_json};
const STATUS_PATH = `${{ROOT}}/upstream-recovery-status.json`;
const COMMENT_PATH = `${{ROOT}}/upstream-recovery-comment.md`;

function emitSignal(flag) {{
  process.stdout.write(`has_signals=${{flag}}\\n`);
}}

function main() {{
  if (!existsSync(STATUS_PATH)) {{
    if (existsSync(COMMENT_PATH)) unlinkSync(COMMENT_PATH);
    emitSignal('false');
    return 0;
  }}
  let payload;
  try {{
    payload = JSON.parse(readFileSync(STATUS_PATH, 'utf8'));
  }} catch (err) {{
    console.error(
      '[render-upstream-recovery] failed to parse upstream-recovery-status.json: ' +
        `${{err.message}}. Treating as no-signals.`,
    );
    if (existsSync(COMMENT_PATH)) unlinkSync(COMMENT_PATH);
    emitSignal('false');
    return 0;
  }}
  const body = renderUpstreamRecoveryStickyComment(payload);
  if (body === null) {{
    if (existsSync(COMMENT_PATH)) unlinkSync(COMMENT_PATH);
    emitSignal('false');
    return 0;
  }}
  writeFileSync(COMMENT_PATH, body.endsWith('\\n') ? body : body + '\\n');
  emitSignal('true');
  return 0;
}}

try {{
  process.exit(main());
}} catch (err) {{
  console.error(`[render-upstream-recovery] unexpected failure: ${{err.message}}`);
  process.exit(0);
}}
"""


def _write_driver(tmp_path: Path, repo_root: Path) -> Path:
    """mjs driver script を tmp_path に書き出して絶対 path を返す。"""
    detection_reports_mjs = repo_root / "scripts" / "lib" / "detection_reports.mjs"
    driver_src = _DRIVER_SCRIPT.format(
        detection_reports_mjs=detection_reports_mjs.as_posix(),
        root_json=json.dumps(str(tmp_path)),
    )
    driver_path = tmp_path / "_driver.mjs"
    driver_path.write_text(driver_src, encoding="utf-8")
    return driver_path


def _run_mjs(driver: Path) -> tuple[int, str, str]:
    """driver ``.mjs`` を node で実行して (exit, stdout, stderr) を返す。"""
    proc = subprocess.run(
        ["node", str(driver)],
        capture_output=True,
        text=True,
        check=False,
        timeout=30,
    )
    return proc.returncode, proc.stdout, proc.stderr


def _run_py(tmp_path: Path) -> tuple[int, str]:
    """Python CLI を in-process で実行して (exit, stdout) を返す。"""
    stdout = io.StringIO()
    code = render_upstream_main(root_dir=tmp_path, stdout=stdout)
    return code, stdout.getvalue()


def _write_status(tmp_path: Path, payload: dict[str, Any]) -> None:
    (tmp_path / "upstream-recovery-status.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def _stale_patch_payload() -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "generatedAt": "2026-04-22T10:00:00.000Z",
        "summary": {
            "totalEntries": 1,
            "activeEntries": 0,
            "staleEntries": 1,
            "overdueEntries": 0,
            "unknownEntries": 0,
        },
        "mechanisms": {
            "en_source_patches": [
                {
                    "id": "UD-001",
                    "mechanism": "en_source_patches",
                    "slugs": ["overview/intro"],
                    "statusA": "stale",
                    "statusB": "current",
                    "hits": 0,
                    "addedAt": "2026-03-01",
                    "reviewAfter": "2026-05-01",
                    "daysUntilReview": 9,
                }
            ],
            "source_sync_exclusions": [],
        },
    }


def _no_signal_payload() -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "generatedAt": "2026-04-22T10:00:00.000Z",
        "summary": {
            "totalEntries": 1,
            "activeEntries": 1,
            "staleEntries": 0,
            "overdueEntries": 0,
            "unknownEntries": 0,
        },
        "mechanisms": {
            "en_source_patches": [
                {
                    "id": "UD-002",
                    "mechanism": "en_source_patches",
                    "slugs": ["overview/foo"],
                    "statusA": "active",
                    "statusB": "current",
                    "hits": 2,
                    "addedAt": "2026-03-01",
                    "reviewAfter": "2027-01-01",
                    "daysUntilReview": 254,
                }
            ],
            "source_sync_exclusions": [],
        },
    }


@pytest.mark.integration
def test_render_upstream_recovery_missing_status_parity(
    tmp_path: Path, repo_root: Path, node_available: bool
) -> None:
    """``upstream-recovery-status.json`` 不在時は mjs/Python 両方とも
    ``has_signals=false`` を出力し comment を書かない。"""
    if not node_available:
        pytest.skip("node not available; cross-runtime parity requires node")

    # Python 側は in-process で 1 回実行、mjs 側は独立 tmp_path で実行して衝突回避。
    py_tmp = tmp_path / "py"
    mjs_tmp = tmp_path / "mjs"
    py_tmp.mkdir()
    mjs_tmp.mkdir()

    py_code, py_stdout = _run_py(py_tmp)

    driver = _write_driver(mjs_tmp, repo_root)
    mjs_code, mjs_stdout, mjs_stderr = _run_mjs(driver)

    assert py_code == 0
    assert mjs_code == 0, f"mjs stderr: {mjs_stderr}"
    assert py_stdout == mjs_stdout == "has_signals=false\n"
    assert not (py_tmp / "upstream-recovery-comment.md").exists()
    assert not (mjs_tmp / "upstream-recovery-comment.md").exists()


@pytest.mark.integration
def test_render_upstream_recovery_with_stale_signal_parity(
    tmp_path: Path, repo_root: Path, node_available: bool
) -> None:
    """stale patch 1 件 → 両 CLI が ``has_signals=true`` と同一 comment を書く。"""
    if not node_available:
        pytest.skip("node not available; cross-runtime parity requires node")

    py_tmp = tmp_path / "py"
    mjs_tmp = tmp_path / "mjs"
    py_tmp.mkdir()
    mjs_tmp.mkdir()

    payload = _stale_patch_payload()
    _write_status(py_tmp, payload)
    _write_status(mjs_tmp, payload)

    py_code, py_stdout = _run_py(py_tmp)
    driver = _write_driver(mjs_tmp, repo_root)
    mjs_code, mjs_stdout, mjs_stderr = _run_mjs(driver)

    assert py_code == 0
    assert mjs_code == 0, f"mjs stderr: {mjs_stderr}"
    assert py_stdout == mjs_stdout == "has_signals=true\n"

    py_comment = (py_tmp / "upstream-recovery-comment.md").read_text(encoding="utf-8")
    mjs_comment = (mjs_tmp / "upstream-recovery-comment.md").read_text(encoding="utf-8")
    assert py_comment == mjs_comment, "sticky comment body byte drift"
    assert py_comment.endswith("\n")


@pytest.mark.integration
def test_render_upstream_recovery_no_signal_deletes_comment_parity(
    tmp_path: Path, repo_root: Path, node_available: bool
) -> None:
    """stale/overdue 無し + 既存 comment 有り → 両 CLI が同じ削除動作を行う。"""
    if not node_available:
        pytest.skip("node not available; cross-runtime parity requires node")

    py_tmp = tmp_path / "py"
    mjs_tmp = tmp_path / "mjs"
    py_tmp.mkdir()
    mjs_tmp.mkdir()

    payload = _no_signal_payload()
    _write_status(py_tmp, payload)
    _write_status(mjs_tmp, payload)
    (py_tmp / "upstream-recovery-comment.md").write_text("stale leftover\n", encoding="utf-8")
    (mjs_tmp / "upstream-recovery-comment.md").write_text("stale leftover\n", encoding="utf-8")

    py_code, py_stdout = _run_py(py_tmp)
    driver = _write_driver(mjs_tmp, repo_root)
    mjs_code, mjs_stdout, mjs_stderr = _run_mjs(driver)

    assert py_code == 0
    assert mjs_code == 0, f"mjs stderr: {mjs_stderr}"
    assert py_stdout == mjs_stdout == "has_signals=false\n"
    assert not (py_tmp / "upstream-recovery-comment.md").exists()
    assert not (mjs_tmp / "upstream-recovery-comment.md").exists()


@pytest.mark.integration
def test_render_upstream_recovery_malformed_status_parity(
    tmp_path: Path, repo_root: Path, node_available: bool
) -> None:
    """破損 JSON → 両 CLI とも stderr 出力 + ``has_signals=false`` で non-blocking 終了。"""
    if not node_available:
        pytest.skip("node not available; cross-runtime parity requires node")

    py_tmp = tmp_path / "py"
    mjs_tmp = tmp_path / "mjs"
    py_tmp.mkdir()
    mjs_tmp.mkdir()

    (py_tmp / "upstream-recovery-status.json").write_text("{not json", encoding="utf-8")
    shutil.copy(
        py_tmp / "upstream-recovery-status.json",
        mjs_tmp / "upstream-recovery-status.json",
    )

    py_code, py_stdout = _run_py(py_tmp)
    driver = _write_driver(mjs_tmp, repo_root)
    mjs_code, mjs_stdout, mjs_stderr = _run_mjs(driver)

    # 両方 exit 0 (non-blocking)、has_signals=false。
    assert py_code == 0
    assert mjs_code == 0
    assert py_stdout == mjs_stdout == "has_signals=false\n"
    assert not (py_tmp / "upstream-recovery-comment.md").exists()
    assert not (mjs_tmp / "upstream-recovery-comment.md").exists()
    # stderr は JSON parse error の具体文は ecosystem (python json / node JSON) で
    # 異なる。共通 prefix のみ検証する。
    assert "failed to parse upstream-recovery-status.json" in mjs_stderr
