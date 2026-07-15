"""EN snapshot fetch と diff を、失敗を短絡させずに順次実行する。"""

from __future__ import annotations

import argparse
import sys
from collections.abc import Callable, Mapping
from typing import Any

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
) -> int:
    """fetch と diff の両方を実行し、どちらかの劣化を終了コードへ集約する。"""
    parsed = _parse_args(sys.argv[1:] if argv is None else argv)
    fetch_args, diff_args = _build_stage_args(parsed)
    fetch_runner = fetch_main if fetch_main is not None else snapshot_update.main
    diff_runner = diff_main if diff_main is not None else snapshot_diff.main
    err = stderr if stderr is not None else sys.stderr

    fetch_exit = 0
    try:
        fetch_result = fetch_runner(fetch_args)
        fetch_exit = 1 if int(fetch_result.get("errors", 0)) > 0 else 0
    except Exception as exc:  # noqa: BLE001 — diff を必ず継続するため stage 境界で捕捉
        print(f"Snapshot fetch failed: {exc}", file=err)
        fetch_exit = 1

    diff_exit = 0
    try:
        diff_exit = int(diff_runner(diff_args))
    except Exception as exc:  # noqa: BLE001 — aggregate exit code に変換する
        print(f"Snapshot diff failed: {exc}", file=err)
        diff_exit = 1

    return 1 if fetch_exit != 0 or diff_exit != 0 else 0


if __name__ == "__main__":
    sys.exit(main())
