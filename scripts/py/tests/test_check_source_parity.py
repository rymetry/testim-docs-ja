"""``testim_parity.detection.check_source_parity`` の unit test (M2)。

mjs ``scripts/detection/check_source_parity.mjs`` full port の pure helper を
byte-parity に pin する。orchestration の end-to-end parity は M5 conformance
で mjs と cross-runtime 比較する。
"""

from __future__ import annotations

import io
import json
from pathlib import Path

import pytest

from testim_parity.detection.check_source_parity import (
    PARITY_CHECK_STATUS_SCHEMA_VERSION,
    check_source_parity,
    collect_snapshot_slugs,
    compute_exit_code,
    compute_parity_result,
    get_console_coverage_state,
    is_advisory_only_issue,
    is_non_blocking_issue,
    parse_args,
)

# ----------------------------------------------------------------------
# compute_exit_code — reportable + error counter のみ参照
# ----------------------------------------------------------------------


@pytest.mark.parametrize(
    ("summary", "fail_on", "expected"),
    [
        # non-dict / None → 0
        (None, None, 0),
        ("not-a-dict", "any", 0),
        # reportableActiveFiles + errors
        ({"reportableActiveFiles": 0, "activeErrorFiles": 0}, None, 0),
        ({"reportableActiveFiles": 1, "activeErrorFiles": 0}, None, 1),
        ({"reportableActiveFiles": 0, "activeErrorFiles": 2}, None, 1),
        ({"reportableActiveFiles": 5, "activeErrorFiles": 1}, "any", 1),
        # --fail-on=actionable: reportableActiveActionableFiles を参照
        (
            {
                "reportableActiveFiles": 1,
                "reportableActiveActionableFiles": 0,
                "activeErrorFiles": 0,
            },
            "actionable",
            0,
        ),
        (
            {
                "reportableActiveFiles": 0,
                "reportableActiveActionableFiles": 2,
                "activeErrorFiles": 0,
            },
            "actionable",
            1,
        ),
        # activeErrorFiles は fail_on=actionable でも fail 要因
        (
            {
                "reportableActiveFiles": 0,
                "reportableActiveActionableFiles": 0,
                "activeErrorFiles": 1,
            },
            "actionable",
            1,
        ),
    ],
)
def test_compute_exit_code(summary: object, fail_on: str | None, expected: int) -> None:
    assert compute_exit_code(summary, fail_on) == expected


# ----------------------------------------------------------------------
# compute_parity_result — pass / fail / inconclusive
# ----------------------------------------------------------------------


@pytest.mark.parametrize(
    ("summary", "freshness", "expected"),
    [
        (None, None, "inconclusive"),
        ("bad", "fresh", "inconclusive"),
        ({"reportableActiveFiles": 0, "activeErrorFiles": 0}, "fresh", "pass"),
        ({"reportableActiveFiles": 0, "activeErrorFiles": 0}, None, "pass"),
        ({"reportableActiveFiles": 1, "activeErrorFiles": 0}, "fresh", "fail"),
        ({"reportableActiveFiles": 0, "activeErrorFiles": 1}, "fresh", "fail"),
        # freshness が fresh 以外で reportable / errors 0 → inconclusive
        ({"reportableActiveFiles": 0, "activeErrorFiles": 0}, "stale", "inconclusive"),
        ({"reportableActiveFiles": 0, "activeErrorFiles": 0}, "partial", "inconclusive"),
        ({"reportableActiveFiles": 0, "activeErrorFiles": 0}, "broken", "inconclusive"),
        # freshness が fresh 以外でも reportable > 0 → fail
        ({"reportableActiveFiles": 1, "activeErrorFiles": 0}, "stale", "fail"),
        ({"reportableActiveFiles": 0, "activeErrorFiles": 2}, "broken", "fail"),
    ],
)
def test_compute_parity_result(summary: object, freshness: str | None, expected: str) -> None:
    assert compute_parity_result(summary, freshness) == expected


# ----------------------------------------------------------------------
# get_console_coverage_state — 4 状態分類
# ----------------------------------------------------------------------


def test_get_console_coverage_state_empty_returns_error_icon() -> None:
    result = get_console_coverage_state([])
    assert result["icon"] == "❌"
    assert result["allAcked"] is False
    assert result["allCovered"] is False


def test_get_console_coverage_state_not_a_list() -> None:
    result = get_console_coverage_state(None)
    assert result["icon"] == "❌"


def test_get_console_coverage_state_reportable_only() -> None:
    """ack/baseline なしの reportable issue → ❌。"""
    issues = [
        {
            "type": "paragraph-count",
            "severity": "actionable",
            "acknowledged": False,
            "baselined": False,
        }
    ]
    result = get_console_coverage_state(issues)
    assert result["icon"] == "❌"


def test_get_console_coverage_state_all_acknowledged() -> None:
    issues = [
        {
            "type": "paragraph-count",
            "severity": "actionable",
            "acknowledged": True,
            "ackExpired": False,
            "baselined": False,
        },
    ]
    result = get_console_coverage_state(issues)
    assert result["icon"] == "⏸️"
    assert result["suffix"] == " (all acknowledged)"
    assert result["allAcked"] is True


def test_get_console_coverage_state_all_baseline_or_ack() -> None:
    """全 ack/baseline、一部だけ ack → ``(covered by baseline/ack)``。"""
    issues = [
        {
            "type": "paragraph-count",
            "severity": "actionable",
            "acknowledged": True,
            "ackExpired": False,
        },
        {
            "type": "paragraph-count",
            "severity": "actionable",
            "acknowledged": False,
            "baselined": True,
        },
    ]
    result = get_console_coverage_state(issues)
    assert result["icon"] == "⏸️"
    assert result["suffix"] == " (covered by baseline/ack)"


def test_get_console_coverage_state_advisory_only() -> None:
    """source-unusable 系 advisory のみ → ``(source unusable)``。"""
    issues = [
        {
            "type": "source-unusable",
            "severity": "signal",
            "acknowledged": False,
            "baselined": False,
        },
    ]
    result = get_console_coverage_state(issues)
    assert result["icon"] == "⏸️"
    assert result["suffix"] == " (source unusable)"


# ----------------------------------------------------------------------
# parse_args — prefix match (``=`` separator)
# ----------------------------------------------------------------------


def test_parse_args_empty() -> None:
    args = parse_args([])
    assert args == {
        "json": False,
        "includeAdvisory": False,
        "includeAuditSignals": False,
        "section": None,
        "failOn": None,
        "slug": None,
    }


def test_parse_args_boolean_flags() -> None:
    args = parse_args(["--json", "--include-advisory", "--include-audit-signals"])
    assert args["json"] is True
    assert args["includeAdvisory"] is True
    assert args["includeAuditSignals"] is True


def test_parse_args_value_flags() -> None:
    args = parse_args(["--section=overview", "--fail-on=any", "--slug=overview/testim-overview"])
    assert args["section"] == "overview"
    assert args["failOn"] == "any"
    assert args["slug"] == "overview/testim-overview"


def test_parse_args_value_with_equals_in_value() -> None:
    """``--section=foo=bar`` → section は ``foo=bar`` (mjs と同じ ``=`` re-join)。"""
    args = parse_args(["--section=foo=bar"])
    assert args["section"] == "foo=bar"


def test_parse_args_ignores_unknown() -> None:
    args = parse_args(["--unknown-flag", "--section=overview"])
    assert args["section"] == "overview"


# ----------------------------------------------------------------------
# collect_snapshot_slugs — recursive .html walk
# ----------------------------------------------------------------------


def test_collect_snapshot_slugs_empty_dir_returns_empty(tmp_path: Path) -> None:
    assert collect_snapshot_slugs(tmp_path / "missing") == set()


def test_collect_snapshot_slugs_nested(tmp_path: Path) -> None:
    (tmp_path / "a").mkdir()
    (tmp_path / "a" / "b").mkdir()
    (tmp_path / "root.html").write_text("r", encoding="utf-8")
    (tmp_path / "a" / "page1.html").write_text("p1", encoding="utf-8")
    (tmp_path / "a" / "b" / "page2.html").write_text("p2", encoding="utf-8")
    (tmp_path / "a" / "not-html.txt").write_text("skip", encoding="utf-8")

    slugs = collect_snapshot_slugs(tmp_path)
    assert slugs == {"root", "a/page1", "a/b/page2"}


# ----------------------------------------------------------------------
# is_non_blocking_issue / is_advisory_only_issue — re-export が同じ振る舞い
# ----------------------------------------------------------------------


def test_issue_state_re_exports() -> None:
    """issue_state の re-export が元関数と同じ結果を返す。"""
    acked_issue = {
        "type": "paragraph-count",
        "acknowledged": True,
        "ackExpired": False,
    }
    assert is_non_blocking_issue(acked_issue) is True
    assert is_non_blocking_issue({}) is False

    source_unusable = {
        "type": "source-unusable",
        "acknowledged": False,
        "baselined": False,
    }
    assert is_advisory_only_issue(source_unusable) is True


# ----------------------------------------------------------------------
# check_source_parity smoke — empty repo で clean pass になる
# ----------------------------------------------------------------------


def _setup_empty_repo(tmp_path: Path) -> Path:
    """最小 repo layout を作って ``root_dir`` として返す。"""
    (tmp_path / "src" / "content" / "docs").mkdir(parents=True)
    (tmp_path / "snapshots" / "en" / "content").mkdir(parents=True)
    (tmp_path / "docs").mkdir()
    (tmp_path / "docs" / "SIDEBAR_URLS.md").write_text(
        "# Sidebar\n\nNo sections yet.\n", encoding="utf-8"
    )
    return tmp_path


def test_check_source_parity_empty_repo_passes(tmp_path: Path) -> None:
    root = _setup_empty_repo(tmp_path)
    out = io.StringIO()
    err = io.StringIO()
    output_path = root / "parity-check-status.json"

    exit_code = check_source_parity(
        root_dir=root,
        output_path=output_path,
        stdout=out,
        stderr=err,
        json_out=True,
    )

    assert exit_code == 0
    assert output_path.exists()
    payload = json.loads(output_path.read_text(encoding="utf-8"))
    assert payload["schemaVersion"] == PARITY_CHECK_STATUS_SCHEMA_VERSION
    assert payload["summary"]["totalFiles"] == 0
    assert payload["summary"]["checkedFiles"] == 0
    assert payload["summary"]["result"] == "pass"
    assert payload["files"] == []


def test_check_source_parity_unknown_slug_returns_error(tmp_path: Path) -> None:
    root = _setup_empty_repo(tmp_path)
    out = io.StringIO()
    err = io.StringIO()
    exit_code = check_source_parity(
        root_dir=root,
        output_path=root / "parity-check-status.json",
        stdout=out,
        stderr=err,
        slug="does/not/exist",
    )
    assert exit_code == 1
    assert "Unknown slug" in err.getvalue()


def test_check_source_parity_stale_freshness_downgrades_clean_run(tmp_path: Path) -> None:
    """``source-sync-status.freshnessState = stale`` → clean run でも
    inconclusive に落ちる (linkage も missing 扱い)。"""
    root = _setup_empty_repo(tmp_path)
    (root / "source-sync-status.json").write_text(
        json.dumps({"freshnessState": "stale"}),
        encoding="utf-8",
    )

    out = io.StringIO()
    err = io.StringIO()
    output_path = root / "parity-check-status.json"
    exit_code = check_source_parity(
        root_dir=root,
        output_path=output_path,
        stdout=out,
        stderr=err,
        json_out=True,
    )
    assert exit_code == 0  # inconclusive は gate 通過
    payload = json.loads(output_path.read_text(encoding="utf-8"))
    assert payload["summary"]["result"] == "inconclusive"


def test_check_source_parity_malformed_baseline_rejects(tmp_path: Path) -> None:
    root = _setup_empty_repo(tmp_path)
    (root / "parity-baseline.json").write_text("not-json", encoding="utf-8")

    exit_code = check_source_parity(
        root_dir=root,
        output_path=root / "parity-check-status.json",
        stdout=io.StringIO(),
        stderr=io.StringIO(),
        json_out=True,
    )
    assert exit_code == 1
