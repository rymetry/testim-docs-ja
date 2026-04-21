"""``generate_detection_reports`` の orchestration byte parity test。

Phase 4 verification gate-1 (plan L736-739: 「各 CLI が同一の JSON artifacts を
生成」) を満たすため、Python CLI entry (``generate_detection_reports``) が
mjs の 3 関数 (``buildAuditManifest`` / ``buildActionableReport`` /
``renderSummaryMarkdown``) と同じ順序・同じ引数で chain していることを確認
する e2e テスト。

mjs script (``scripts/detection/generate_detection_reports.mjs``) は ``ROOT_DIR``
固定で artifact を書くため、直接 subprocess 実行すると repo root を汚染する。
代わりに既存の conformance harness (``scripts/py/conformance/harness.mjs``) が
dispatch する 3 関数を tmp fixture 入力で呼び出し、Python 出力の 3 ファイル
(``docs-audit-manifest.json`` / ``docs-actionable-report.json`` minus
``generatedAt`` / ``docs-update-summary.md``) と byte 比較する。

既存の個別 conformance test (12 件) は各関数の byte parity を保証。本テスト
は orchestration (3 関数の chain 順 + options 受け渡し + I/O format) を
covering する。
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from testim_parity.detection.generate_detection_reports import generate_detection_reports

from ._harness import run_batch


def _write_json(path: Path, data: dict[str, Any]) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")


def _minimal_snapshot_status() -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "checkedAt": "2026-04-21T10:00:00Z",
        "runId": "run-e2e",
        "sourceSyncRunId": None,
        "summary": {
            "changed": 0,
            "added": 0,
            "removed": 0,
            "unchanged": 0,
            "totalSnapshots": 0,
        },
        "changes": [],
        "runScope": {"isComplete": True},
    }


def _minimal_parity_status() -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "summary": {
            "checkedAt": "2026-04-21T10:05:00Z",
            "result": "pass",
            "runScope": {"isComplete": True},
        },
        "files": [],
        "advisoryQueue": [],
        "advisoryQueueScope": {"isComplete": True, "type": "all", "filters": {}},
    }


def test_generate_detection_reports_orchestration_parity(
    tmp_path: Path, repo_root: Path, node_available: bool
) -> None:
    """Python CLI entry の 3 output が mjs harness の出力と byte 一致する。"""
    if not node_available:
        pytest.skip("node not available; cross-runtime parity requires node")

    snapshot = _minimal_snapshot_status()
    parity = _minimal_parity_status()
    # source-sync と upstream-recovery は不在でも graceful degradation する。
    _write_json(tmp_path / "snapshot-diff-status.json", snapshot)
    _write_json(tmp_path / "parity-check-status.json", parity)

    # --- Python 側: entry 呼び出しで 3 ファイルを書き出す ---
    generate_detection_reports(strict=False, root_dir=tmp_path)
    py_audit = json.loads((tmp_path / "docs-audit-manifest.json").read_text(encoding="utf-8"))
    py_report = json.loads((tmp_path / "docs-actionable-report.json").read_text(encoding="utf-8"))
    py_summary = (tmp_path / "docs-update-summary.md").read_text(encoding="utf-8")

    # --- mjs 側: harness で同じ 3 関数を同じ順序で呼ぶ ---
    # 1) buildAuditManifest(snapshot, parity)
    # 2) buildActionableReport(snapshot, parity, audit, {sourceSync, upstreamRecovery})
    # 3) renderSummaryMarkdown(snapshot, parity, report, audit, sourceSync)
    #
    # Python entry が実際に呼ぶ sourceSync / upstreamRecovery の default は ``{}``
    # (不在ファイル → ``_read_json`` が空 dict を返す)。mjs 側も同じ contract
    # なので harness 呼び出しでも ``{}`` を渡す。
    calls = [
        {
            "function": "detection_reports_build_audit_manifest",
            "args": [snapshot, parity],
        },
    ]
    results = run_batch(repo_root, calls)
    mjs_audit = results[0]

    calls = [
        {
            "function": "detection_reports_build_actionable",
            "args": [snapshot, parity, mjs_audit, {"sourceSync": {}, "upstreamRecovery": {}}],
        },
    ]
    results = run_batch(repo_root, calls)
    # harness は generatedAt を剥がして返す。Python 側も比較時に剥がす。
    mjs_report_no_generated_at = results[0]

    # renderSummaryMarkdown は report.generatedAt を本文に埋め込む。Python と
    # mjs で同じ timestamp を使うため、Python 側の generatedAt を mjs report
    # に inject してから mjs 側を render する。
    generated_at = py_report.get("generatedAt")
    assert isinstance(generated_at, str)
    mjs_report_with_generated_at = {**mjs_report_no_generated_at, "generatedAt": generated_at}
    calls = [
        {
            "function": "detection_reports_render_summary",
            "args": [snapshot, parity, mjs_report_with_generated_at, mjs_audit, {}],
        },
    ]
    results = run_batch(repo_root, calls)
    mjs_summary_body = results[0]

    # --- byte 比較 ---
    # audit manifest は timestamp を含まない (mjs 実装側でも静的)。
    assert py_audit == mjs_audit, "buildAuditManifest orchestration byte drift"

    # actionable report は generatedAt (Date.now() 依存) を剥がして比較。
    py_report_no_generated_at = {k: v for k, v in py_report.items() if k != "generatedAt"}
    assert py_report_no_generated_at == mjs_report_no_generated_at, (
        "buildActionableReport orchestration byte drift"
    )
    # generatedAt は Python 側に存在することだけ確認する。
    assert "generatedAt" in py_report

    # Python は末尾に改行 1 つを追加するので、mjs 本文 + "\n" と比較する。
    assert py_summary == mjs_summary_body + "\n", "renderSummaryMarkdown orchestration byte drift"
