"""snapshot_check の非短絡 orchestration 契約。"""

from __future__ import annotations

import datetime
import io
import json
from pathlib import Path
from typing import Any

import pytest

from testim_parity.detection import snapshot_check, snapshot_update
from testim_parity.detection_reports import (
    validate_snapshot_diff_status,
    validate_source_sync_status,
)
from testim_parity.sync_health import (
    build_run_scope,
    build_source_sync_status,
    validate_run_linkage,
)


def _fetch_result(*, errors: int = 0) -> dict[str, Any]:
    return {"errors": errors}


def _write_source_status(
    root: Path,
    *,
    partial: bool = False,
    run_scope: dict[str, Any] | None = None,
) -> None:
    pages: list[dict[str, Any]] = [{"slug": "page-ok", "fetchStatus": "ok"}]
    if partial:
        pages.append(
            {
                "slug": "page-error",
                "fetchStatus": "error",
                "errorDetail": "network down",
            }
        )
    payload = build_source_sync_status(
        pages=pages,
        sidebar_result={
            "ok": True,
            "sectionCount": 1,
            "pageCount": len(pages),
            "sidebarSlugs": [page["slug"] for page in pages],
        },
        run_scope=run_scope or build_run_scope(),
        now=datetime.datetime(2026, 7, 16, tzinfo=datetime.UTC),
        run_seed="snapshot-check-test",
    )
    (root / "source-sync-status.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def _write_clean_diff_status(root: Path) -> None:
    source = json.loads((root / "source-sync-status.json").read_text(encoding="utf-8"))
    run_scope = source["runScope"]
    payload = {
        "schemaVersion": 1,
        "runId": "2026-07-16T00:00:00.000Z#snapshot-diff-test",
        "sourceSyncRunId": source["runId"],
        "sourceInventoryFingerprint": source["sourceInventoryFingerprint"],
        "runScope": run_scope,
        "checkedAt": "2026-07-16T00:00:00.000Z",
        "summary": {
            "totalSnapshots": 0,
            "changed": 0,
            "added": 0,
            "removed": 0,
            "unchanged": 0,
            "runScope": run_scope,
        },
        "changes": [],
        "sidebar": {"changed": False, "addedPages": [], "removedPages": []},
    }
    (root / "snapshot-diff-status.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def _read_and_validate_artifacts(root: Path) -> tuple[dict[str, Any], dict[str, Any]]:
    source = json.loads((root / "source-sync-status.json").read_text(encoding="utf-8"))
    diff = json.loads((root / "snapshot-diff-status.json").read_text(encoding="utf-8"))
    validate_source_sync_status(source)
    validate_snapshot_diff_status(diff)
    assert validate_run_linkage(source, diff, source["runScope"]) == "linked"
    return source, diff


def test_main_runs_diff_after_successful_fetch() -> None:
    calls: list[tuple[str, list[str]]] = []

    def fetch(args: list[str]) -> dict[str, Any]:
        calls.append(("fetch", args))
        return _fetch_result()

    def diff(args: list[str]) -> int:
        calls.append(("diff", args))
        return 0

    assert snapshot_check.main([], fetch_main=fetch, diff_main=diff) == 0
    assert calls == [("fetch", []), ("diff", [])]


def test_main_runs_diff_after_partial_fetch_and_keeps_failure_exit() -> None:
    diff_called = False

    def diff(_args: list[str]) -> int:
        nonlocal diff_called
        diff_called = True
        return 0

    exit_code = snapshot_check.main(
        [],
        fetch_main=lambda _args: _fetch_result(errors=2),
        diff_main=diff,
    )

    assert diff_called is True
    assert exit_code == 1


def test_main_runs_diff_after_fetch_exception() -> None:
    stderr = io.StringIO()
    diff_called = False

    def fetch(_args: list[str]) -> dict[str, Any]:
        raise RuntimeError("network down")

    def diff(_args: list[str]) -> int:
        nonlocal diff_called
        diff_called = True
        return 0

    exit_code = snapshot_check.main(
        [],
        fetch_main=fetch,
        diff_main=diff,
        stderr=stderr,
    )

    assert diff_called is True
    assert exit_code == 1
    assert "Snapshot fetch failed: network down" in stderr.getvalue()


@pytest.mark.parametrize("diff_exit", [1, 2])
def test_main_propagates_diff_failure_as_nonzero(diff_exit: int) -> None:
    assert (
        snapshot_check.main(
            [],
            fetch_main=lambda _args: _fetch_result(),
            diff_main=lambda _args: diff_exit,
        )
        == 1
    )


def test_main_converts_diff_exception_to_nonzero() -> None:
    stderr = io.StringIO()

    def diff(_args: list[str]) -> int:
        raise RuntimeError("git failed")

    assert (
        snapshot_check.main(
            [],
            fetch_main=lambda _args: _fetch_result(),
            diff_main=diff,
            stderr=stderr,
        )
        == 1
    )
    assert "Snapshot diff failed: git failed" in stderr.getvalue()


def test_main_routes_union_options_to_supported_stage() -> None:
    calls: list[tuple[str, list[str]]] = []

    def fetch(args: list[str]) -> dict[str, Any]:
        calls.append(("fetch", args))
        return _fetch_result()

    def diff(args: list[str]) -> int:
        calls.append(("diff", args))
        return 0

    exit_code = snapshot_check.main(
        ["--section=Grid Management", "--slug=browserstack-integration", "--dry-run", "--json"],
        fetch_main=fetch,
        diff_main=diff,
    )

    assert exit_code == 0
    assert calls == [
        (
            "fetch",
            [
                "--section=Grid Management",
                "--slug=browserstack-integration",
                "--dry-run",
            ],
        ),
        (
            "diff",
            [
                "--section=Grid Management",
                "--slug=browserstack-integration",
                "--json",
            ],
        ),
    ]


def test_main_success_generates_linked_artifacts(tmp_path: Path) -> None:
    def fetch(_args: list[str]) -> dict[str, Any]:
        _write_source_status(tmp_path)
        return _fetch_result()

    def diff(_args: list[str]) -> int:
        _write_clean_diff_status(tmp_path)
        return 0

    assert (
        snapshot_check.main(
            [],
            fetch_main=fetch,
            diff_main=diff,
            root_dir=tmp_path,
        )
        == 0
    )
    source, diff_status = _read_and_validate_artifacts(tmp_path)
    assert source["freshnessState"] == "fresh"
    assert "error" not in diff_status


def test_main_partial_fetch_keeps_linked_artifacts_and_nonzero(tmp_path: Path) -> None:
    def fetch(_args: list[str]) -> dict[str, Any]:
        _write_source_status(tmp_path, partial=True)
        return _fetch_result(errors=1)

    def diff(_args: list[str]) -> int:
        _write_clean_diff_status(tmp_path)
        return 0

    assert (
        snapshot_check.main(
            [],
            fetch_main=fetch,
            diff_main=diff,
            root_dir=tmp_path,
        )
        == 1
    )
    source, _diff_status = _read_and_validate_artifacts(tmp_path)
    assert source["freshnessState"] == "partial"


def test_main_fetch_exception_replaces_stale_artifact_and_runs_diff(tmp_path: Path) -> None:
    (tmp_path / "source-sync-status.json").write_text('{"runId":"stale"}\n', encoding="utf-8")

    def fetch(_args: list[str]) -> dict[str, Any]:
        raise RuntimeError("network down")

    def diff(_args: list[str]) -> int:
        _write_clean_diff_status(tmp_path)
        return 0

    assert (
        snapshot_check.main(
            [],
            fetch_main=fetch,
            diff_main=diff,
            root_dir=tmp_path,
            stderr=io.StringIO(),
        )
        == 1
    )
    source, _diff_status = _read_and_validate_artifacts(tmp_path)
    assert source["freshnessState"] == "broken"
    assert source["runId"] != "stale"


def test_main_diff_failure_generates_linked_error_artifact(tmp_path: Path) -> None:
    (tmp_path / "snapshot-diff-status.json").write_text('{"runId":"stale"}\n', encoding="utf-8")

    def fetch(_args: list[str]) -> dict[str, Any]:
        _write_source_status(tmp_path)
        return _fetch_result()

    assert (
        snapshot_check.main(
            [],
            fetch_main=fetch,
            diff_main=lambda _args: 2,
            root_dir=tmp_path,
        )
        == 1
    )
    _source, diff_status = _read_and_validate_artifacts(tmp_path)
    assert diff_status["error"] is True
    assert diff_status["runId"] != "stale"


def test_main_diff_failure_uses_resolved_source_scope_for_linkage(tmp_path: Path) -> None:
    resolved_scope = build_run_scope(slug="integrations/grid-management/browserstack-integration")

    def fetch(_args: list[str]) -> dict[str, Any]:
        _write_source_status(tmp_path, run_scope=resolved_scope)
        return _fetch_result()

    assert (
        snapshot_check.main(
            ["--slug=browserstack-integration"],
            fetch_main=fetch,
            diff_main=lambda _args: 1,
            root_dir=tmp_path,
        )
        == 1
    )
    source, diff_status = _read_and_validate_artifacts(tmp_path)
    assert source["runScope"] == resolved_scope
    assert diff_status["runScope"] == resolved_scope


def test_main_section_without_targets_generates_artifacts_and_nonzero(tmp_path: Path) -> None:
    def fetch(args: list[str]) -> dict[str, Any]:
        return snapshot_update.main(
            args,
            root_dir=tmp_path,
            fetch_html_fn=lambda _url: {"html": None, "status": 500},
            fetch_toc_fn=lambda: {"sections": []},
            sleep_fn=lambda _seconds: None,
            stdout=io.StringIO(),
            stderr=io.StringIO(),
            now=datetime.datetime(2026, 7, 16, tzinfo=datetime.UTC),
            run_seed="section-miss",
        )

    def diff(_args: list[str]) -> int:
        _write_clean_diff_status(tmp_path)
        return 0

    assert (
        snapshot_check.main(
            ["--section=typo-section"],
            fetch_main=fetch,
            diff_main=diff,
            root_dir=tmp_path,
        )
        == 1
    )
    source, _diff_status = _read_and_validate_artifacts(tmp_path)
    assert source["freshnessState"] == "broken"
    assert source["runScope"]["filters"]["section"] == "typo-section"
