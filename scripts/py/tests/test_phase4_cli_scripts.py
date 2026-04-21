"""Phase 4 CLI scripts の smoke tests (unit レベル)。

個別 script を直接 call して最低限の動作を確認する。byte-identical parity は
mjs output との cross-runtime で別途 integration test で扱う方針。
"""

from __future__ import annotations

import io
import json
from pathlib import Path

from testim_parity.detection.generate_detection_reports import generate_detection_reports
from testim_parity.detection.render_upstream_recovery_comment import (
    main as render_upstream_main,
)


def _write_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")


def test_render_upstream_recovery_no_artifact(tmp_path: Path) -> None:
    """upstream-recovery-status.json が無い → has_signals=false + no comment file。"""
    stdout = io.StringIO()
    exit_code = render_upstream_main(root_dir=tmp_path, stdout=stdout)
    assert exit_code == 0
    assert stdout.getvalue().strip() == "has_signals=false"
    assert not (tmp_path / "upstream-recovery-comment.md").exists()


def test_render_upstream_recovery_empty_payload(tmp_path: Path) -> None:
    """mechanisms なし → render_upstream_recovery_sticky_comment が None → has_signals=false。"""
    _write_json(tmp_path / "upstream-recovery-status.json", {})
    stdout = io.StringIO()
    exit_code = render_upstream_main(root_dir=tmp_path, stdout=stdout)
    assert exit_code == 0
    assert stdout.getvalue().strip() == "has_signals=false"
    assert not (tmp_path / "upstream-recovery-comment.md").exists()


def test_render_upstream_recovery_with_signals(tmp_path: Path) -> None:
    """stale entry あり → has_signals=true + comment markdown が書かれる。"""
    _write_json(
        tmp_path / "upstream-recovery-status.json",
        {
            "mechanisms": {
                "en_source_patches": [
                    {
                        "id": "UD-001",
                        "slugs": ["page-a"],
                        "statusA": "stale",
                        "statusB": "current",
                        "reviewAfter": "2026-05-01",
                        "daysUntilReview": 10,
                    }
                ]
            }
        },
    )
    stdout = io.StringIO()
    exit_code = render_upstream_main(root_dir=tmp_path, stdout=stdout)
    assert exit_code == 0
    assert stdout.getvalue().strip() == "has_signals=true"
    comment = (tmp_path / "upstream-recovery-comment.md").read_text(encoding="utf-8")
    assert "Upstream recovery" in comment
    assert "UD-001" in comment


def test_render_upstream_recovery_removes_stale_comment(tmp_path: Path) -> None:
    """既存 comment 有り + signals 無し → comment 削除。"""
    (tmp_path / "upstream-recovery-comment.md").write_text("leftover\n", encoding="utf-8")
    stdout = io.StringIO()
    exit_code = render_upstream_main(root_dir=tmp_path, stdout=stdout)
    assert exit_code == 0
    assert not (tmp_path / "upstream-recovery-comment.md").exists()


def test_generate_detection_reports_minimal(tmp_path: Path) -> None:
    """全 artifact が minimal valid payload → 3 output ファイルが生成される。"""
    _write_json(
        tmp_path / "snapshot-diff-status.json",
        {
            "schemaVersion": 1,
            "checkedAt": "2026-04-21T10:00:00Z",
            "runId": "run-1",
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
        },
    )
    _write_json(
        tmp_path / "parity-check-status.json",
        {
            "schemaVersion": 1,
            "summary": {
                "checkedAt": "2026-04-21T10:05:00Z",
                "result": "pass",
                "runScope": {"isComplete": True},
            },
            "files": [],
            "advisoryQueue": [],
            "advisoryQueueScope": {"isComplete": True, "type": "all", "filters": {}},
        },
    )

    result = generate_detection_reports(strict=False, root_dir=tmp_path)
    assert "outputs" in result
    assert "actionableReport" in result
    # 3 output file が存在することを確認
    assert (tmp_path / "docs-actionable-report.json").exists()
    assert (tmp_path / "docs-update-summary.md").exists()
    assert (tmp_path / "docs-audit-manifest.json").exists()

    report = json.loads((tmp_path / "docs-actionable-report.json").read_text(encoding="utf-8"))
    assert report["schemaVersion"] == 1
    # generatedAt は timestamp なので値ではなく存在だけ確認
    assert "generatedAt" in report
    # snapshot は変化なしなので shouldOpenIssue=False
    assert report["snapshotDiff"]["shouldOpenIssue"] is False


def test_generate_detection_reports_strict_fails_on_invalid(tmp_path: Path) -> None:
    """schema violation で --strict → ValueError + validation_errors 添付。"""
    # 壊れた snapshot (schemaVersion 不正)
    _write_json(tmp_path / "snapshot-diff-status.json", {"schemaVersion": 99})
    # parity はダミー valid
    _write_json(
        tmp_path / "parity-check-status.json",
        {
            "schemaVersion": 1,
            "summary": {
                "checkedAt": "2026-04-21T10:05:00Z",
                "result": "pass",
                "runScope": {"isComplete": True},
            },
            "files": [],
        },
    )

    try:
        generate_detection_reports(strict=True, root_dir=tmp_path)
    except ValueError as err:
        assert "schemaVersion" in str(err)
        assert hasattr(err, "validation_errors")
    else:
        raise AssertionError("expected ValueError for strict mode with bad schema")
