"""snapshot_check の非短絡 orchestration 契約。"""

from __future__ import annotations

import io
from typing import Any

import pytest

from testim_parity.detection import snapshot_check


def _fetch_result(*, errors: int = 0) -> dict[str, Any]:
    return {"errors": errors}


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
