"""EN snapshot fetch と diff を、失敗を短絡させずに順次実行する。"""

from __future__ import annotations

import argparse
import sys
from collections.abc import Callable, Mapping
from pathlib import Path
from typing import Any

from ..sync_health import build_run_scope
from . import snapshot_diff, snapshot_update

FetchMain = Callable[[list[str]], Mapping[str, Any]]
DiffMain = Callable[[list[str]], int]


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch EN snapshots, then diff them even when fetch is partial."
    )
    parser.add_argument("--section", default=None)
    parser.add_argument("--slug", default=None)
    parser.add_argument("--dry-run", dest="dry_run", action="store_true")
    parser.add_argument("--json", dest="json_mode", action="store_true")
    return parser.parse_args(argv)


def _build_stage_args(args: argparse.Namespace) -> tuple[list[str], list[str]]:
    common: list[str] = []
    if args.section:
        common.append(f"--section={args.section}")
    if args.slug:
        common.append(f"--slug={args.slug}")

    fetch_args = [*common]
    diff_args = [*common]
    if args.dry_run:
        fetch_args.append("--dry-run")
    if args.json_mode:
        diff_args.append("--json")
    return fetch_args, diff_args


def main(
    argv: list[str] | None = None,
    *,
    fetch_main: FetchMain | None = None,
    diff_main: DiffMain | None = None,
    stderr: Any | None = None,
    root_dir: Path | None = None,
) -> int:
    """fetch と diff の両方を実行し、どちらかの劣化を終了コードへ集約する。"""
    parsed = _parse_args(sys.argv[1:] if argv is None else argv)
    fetch_args, diff_args = _build_stage_args(parsed)
    fetch_runner = fetch_main if fetch_main is not None else snapshot_update.main
    diff_runner = diff_main if diff_main is not None else snapshot_diff.main
    err = stderr if stderr is not None else sys.stderr
    enforce_artifacts = root_dir is not None or (fetch_main is None and diff_main is None)
    effective_root = root_dir if root_dir is not None else snapshot_update.ROOT_DIR
    source_status_path = effective_root / "source-sync-status.json"
    diff_status_path = effective_root / "snapshot-diff-status.json"
    run_scope = build_run_scope(slug=parsed.slug, section=parsed.section)

    if enforce_artifacts:
        # 前runのfresh artifactを障害runが再利用しないよう、stage開始前に無効化する。
        source_status_path.unlink(missing_ok=True)
        diff_status_path.unlink(missing_ok=True)

    fetch_exit = 0
    fetch_failure_detail: str | None = None
    try:
        fetch_result = fetch_runner(fetch_args)
        fetch_exit = 1 if int(fetch_result.get("errors", 0)) > 0 else 0
        if fetch_exit:
            fetch_failure_detail = (
                f"Snapshot fetch reported {int(fetch_result.get('errors', 0))} error(s)."
            )
    except Exception as exc:  # noqa: BLE001 — diff を必ず継続するため stage 境界で捕捉
        print(f"Snapshot fetch failed: {exc}", file=err)
        fetch_exit = 1
        fetch_failure_detail = f"Snapshot fetch failed: {exc}"

    if enforce_artifacts and not source_status_path.exists():
        if fetch_exit == 0:
            fetch_exit = 1
            fetch_failure_detail = "Snapshot fetch did not produce source-sync-status.json."
            print(fetch_failure_detail, file=err)
        snapshot_update.write_error_status(
            status_path=source_status_path,
            run_scope=run_scope,
            detail=fetch_failure_detail or "Snapshot fetch failed.",
            slug=parsed.slug,
        )

    diff_exit = 0
    diff_failure_detail: str | None = None
    try:
        diff_exit = int(diff_runner(diff_args))
        if diff_exit:
            diff_failure_detail = f"Snapshot diff exited with code {diff_exit}."
    except Exception as exc:  # noqa: BLE001 — aggregate exit code に変換する
        print(f"Snapshot diff failed: {exc}", file=err)
        diff_exit = 1
        diff_failure_detail = f"Snapshot diff failed: {exc}"

    if enforce_artifacts and not diff_status_path.exists():
        if diff_exit == 0:
            diff_exit = 1
            diff_failure_detail = "Snapshot diff did not produce snapshot-diff-status.json."
            print(diff_failure_detail, file=err)
        snapshot_diff.write_error_status(
            output_path=diff_status_path,
            source_status_path=source_status_path,
            run_scope=run_scope,
            detail=diff_failure_detail or "Snapshot diff failed.",
        )

    return 1 if fetch_exit != 0 or diff_exit != 0 else 0


if __name__ == "__main__":
    sys.exit(main())
