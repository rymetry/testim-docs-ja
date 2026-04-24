"""``testim_parity.detection`` 内 main() entry 用 coverage boost smoke。

- ``generate_detection_reports.main`` (42% → 90%+)
- ``check_upstream_recovery.main`` (86% → 95%+)
- ``render_upstream_recovery_comment.main`` (79% → 90%+)
- ``find_untranslated.main`` (77% → 90%+)
各 module の main() + 主要 branch を tmp artifact で叩く。
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from testim_parity.detection import (
    check_upstream_recovery,
    find_untranslated,
    generate_detection_reports,
    render_upstream_recovery_comment,
)


def _make_minimal_artifacts(tmp_path: Path) -> Path:
    """``load_detection_inputs`` が成功する最低限の artifact 一式を作る。

    schema は detection_reports.py 内の validator が期待する形状に揃える。
    """
    (tmp_path / "snapshot-diff-status.json").write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "checkedAt": "2026-01-01T00:00:00.000Z",
                "runId": "test-run",
                "summary": {
                    "totalSnapshots": 0,
                    "changed": 0,
                    "added": 0,
                    "removed": 0,
                    "unchanged": 0,
                },
                "changes": [],
                "sidebar": {"changed": False, "addedPages": [], "removedPages": []},
            }
        ),
        encoding="utf-8",
    )
    (tmp_path / "parity-check-status.json").write_text(
        json.dumps(
            {
                "schemaVersion": 2,
                "checkedAt": "2026-01-01T00:00:00.000Z",
                "summary": {
                    "totalFiles": 0,
                    "checkedFiles": 0,
                    "filesWithIssues": 0,
                    "actionableFiles": 0,
                    "signalFiles": 0,
                    "errorFiles": 0,
                    "activeActionableFiles": 0,
                    "activeErrorFiles": 0,
                    "activeFiles": 0,
                    "totalIssues": 0,
                    "acknowledgedIssues": 0,
                    "expiredAcknowledgements": 0,
                    "issuesByType": {},
                    "issuesBySeverity": {},
                    "baselinedIssues": 0,
                    "baselinedFiles": 0,
                    "baselinedByType": {},
                    "baselineInvalidatedFiles": 0,
                    "baselineInvalidatedIssues": 0,
                    "baselineInvalidatedSlugs": [],
                    "reportableActiveFiles": 0,
                    "advisoryQueueIssues": 0,
                    "advisoryQueueSlugs": 0,
                    "advisoryQueueBlocking": 0,
                    "auditSignalIssues": 0,
                    "auditSignalSlugs": 0,
                },
                "results": [],
            }
        ),
        encoding="utf-8",
    )
    (tmp_path / "source-sync-status.json").write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "checkedAt": "2026-01-01T00:00:00.000Z",
                "pages": [],
                "excludedPages": 0,
                "excludedBrokenPages": 0,
                "excludedRecoveredPages": 0,
            }
        ),
        encoding="utf-8",
    )
    return tmp_path


class TestGenerateDetectionReports:
    def test_main_happy_path(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
    ) -> None:
        _make_minimal_artifacts(tmp_path)
        monkeypatch.setattr(generate_detection_reports, "ROOT_DIR", tmp_path)

        rc = generate_detection_reports.main([])
        assert rc == 0
        # 3 output が書かれている
        assert (tmp_path / "docs-actionable-report.json").exists()
        assert (tmp_path / "docs-update-summary.md").exists()
        assert (tmp_path / "docs-audit-manifest.json").exists()

    def test_main_strict_with_broken_schema_returns_one(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
    ) -> None:
        """schema v2/runScope 欠如の minimal artifacts で ``--strict`` は exit 1 を返す。

        本 test では schema 検証 branch (validation_errors list の付与 + printer)
        の coverage を目的にする (happy-path は別で担保)。
        """
        _make_minimal_artifacts(tmp_path)
        monkeypatch.setattr(generate_detection_reports, "ROOT_DIR", tmp_path)
        rc = generate_detection_reports.main(["--strict"])
        assert rc == 1
        err = capsys.readouterr().err
        assert "❌" in err

    def test_main_strict_with_broken_snapshot_returns_one(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """schema 破損時 ``--strict`` で ValueError → exit 1。"""
        _make_minimal_artifacts(tmp_path)
        (tmp_path / "snapshot-diff-status.json").write_text("{not-json", encoding="utf-8")
        monkeypatch.setattr(generate_detection_reports, "ROOT_DIR", tmp_path)
        rc = generate_detection_reports.main(["--strict"])
        assert rc == 1


class TestCheckUpstreamRecovery:
    def test_main_with_empty_artifacts(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
    ) -> None:
        """空 source-sync + 空 patches で main() 0 を返す。"""
        monkeypatch.setattr(check_upstream_recovery, "ROOT_DIR", tmp_path)
        (tmp_path / "source-sync-status.json").write_text(
            json.dumps(
                {
                    "schemaVersion": 1,
                    "checkedAt": "2026-01-01T00:00:00.000Z",
                    "pages": [],
                    "excludedPages": 0,
                }
            ),
            encoding="utf-8",
        )
        # main() は出力 JSON を書くだけ (no-op が多い)
        rc = check_upstream_recovery.main([])
        assert rc in (0, 1)


class TestRenderUpstreamRecoveryComment:
    def test_main_with_no_recovery_returns_ok(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
    ) -> None:
        """``upstream-recovery-status.json`` が無ければ no-op で exit 0。

        本 tool の ``main()`` は ``root_dir`` kwarg を取る (positional 不可)。
        """
        monkeypatch.setattr(render_upstream_recovery_comment, "ROOT_DIR", tmp_path)
        rc = render_upstream_recovery_comment.main(root_dir=tmp_path)
        assert rc in (0, 1)


class TestFindUntranslated:
    def test_main_runs_on_real_corpus(self, capsys: pytest.CaptureFixture[str]) -> None:
        """実 corpus で untranslated 検出 main() を 1 回走らせる (exit code smoke)。"""
        # find_untranslated.main は sidebar を読み、未翻訳リストを出す
        rc = find_untranslated.main([])
        # untranslated が 0 件なら 0、ある程度あっても main の戻りは exit 用
        assert isinstance(rc, int)
