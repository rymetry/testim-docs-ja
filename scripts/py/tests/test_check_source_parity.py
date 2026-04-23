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
    main,
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


# ----------------------------------------------------------------------
# Phase 5 gap-fill: mjs check_source_parity.test.mjs coverage-state /
# exit-code / run-scope / schema-version edge case を pytest に統合
# ----------------------------------------------------------------------


def test_parity_check_status_schema_version_is_1() -> None:
    assert PARITY_CHECK_STATUS_SCHEMA_VERSION == 1


def test_compute_exit_code_coarse_only_summary_returns_0() -> None:
    """coarse signal は activeFiles に出ても gate には載らない (reportable は 0)。"""
    summary = {"reportableActiveFiles": 0, "auditSignalFiles": 1, "activeFiles": 1}
    assert compute_exit_code(summary, None) == 0


def test_compute_exit_code_missing_fields_defaults_to_0() -> None:
    assert compute_exit_code({}, "actionable") == 0
    assert compute_exit_code({}, "any") == 0
    assert compute_exit_code({}, None) == 0


def test_compute_exit_code_coarse_with_expired_ack_returns_0() -> None:
    summary = {
        "reportableActiveFiles": 0,
        "reportableActiveActionableFiles": 0,
        "auditSignalFiles": 1,
        "auditSignalIssues": 1,
        "expiredAcknowledgements": 1,
    }
    assert compute_exit_code(summary, "actionable") == 0
    assert compute_exit_code(summary, "any") == 0
    assert compute_exit_code(summary, None) == 0


def test_compute_exit_code_baselined_coarse_returns_0() -> None:
    summary = {
        "reportableActiveFiles": 0,
        "reportableActiveActionableFiles": 0,
        "auditSignalFiles": 1,
        "baselinedIssues": 1,
    }
    assert compute_exit_code(summary, None) == 0


def test_compute_exit_code_snapshot_unusable_does_not_fail_gate() -> None:
    """source-unusable / snapshot-incomplete は gate に載らない (advisory)。"""
    summary = {
        "reportableActiveFiles": 0,
        "reportableActiveActionableFiles": 0,
        "activeErrorFiles": 0,
        "snapshotUnusableIssues": 1,
        "snapshotUnusableFiles": 1,
    }
    assert compute_exit_code(summary, None) == 0
    assert compute_exit_code(summary, "actionable") == 0
    assert compute_exit_code(summary, "any") == 0


def test_compute_parity_result_null_summary_is_inconclusive() -> None:
    assert compute_parity_result(None, "fresh") == "inconclusive"


def test_compute_parity_result_null_freshness_with_clean_counters_is_pass() -> None:
    """Legacy runs w/o source-sync-status.json should pass, not block."""
    summary = {"reportableActiveFiles": 0, "activeErrorFiles": 0}
    assert compute_parity_result(summary, None) == "pass"


def test_coverage_state_active_structure_mismatch_single_is_error() -> None:
    state = get_console_coverage_state(
        [{"type": "section-structure-mismatch", "severity": "actionable"}]
    )
    assert state == {"allAcked": False, "allCovered": False, "icon": "❌", "suffix": ""}


def test_coverage_state_structure_plus_source_unusable_mix_is_error() -> None:
    state = get_console_coverage_state(
        [
            {"type": "section-structure-mismatch", "severity": "actionable"},
            {"type": "snapshot-incomplete", "severity": "actionable"},
        ]
    )
    assert state["icon"] == "❌"
    assert state["suffix"] == ""


def test_coverage_state_snapshot_incomplete_single_is_source_unusable_suffix() -> None:
    state = get_console_coverage_state([{"type": "snapshot-incomplete", "severity": "actionable"}])
    assert state["icon"] == "⏸️"
    assert "source unusable" in state["suffix"]


def test_coverage_state_acked_source_unusable_suffix_is_all_acknowledged() -> None:
    """ack 経路は advisory suffix より優先される。"""
    state = get_console_coverage_state(
        [
            {
                "type": "source-unusable",
                "severity": "actionable",
                "acknowledged": True,
                "ackExpired": False,
            }
        ]
    )
    assert state == {
        "allAcked": True,
        "allCovered": True,
        "icon": "⏸️",
        "suffix": " (all acknowledged)",
    }


def test_coverage_state_expired_ack_blocks() -> None:
    state = get_console_coverage_state([{"acknowledged": True, "ackExpired": True}])
    assert state == {"allAcked": False, "allCovered": False, "icon": "❌", "suffix": ""}


def test_coverage_state_baseline_plus_ack_mix_covered_by_baseline_ack() -> None:
    state = get_console_coverage_state(
        [
            {"baselined": True},
            {"acknowledged": True, "ackExpired": False},
        ]
    )
    assert state == {
        "allAcked": False,
        "allCovered": True,
        "icon": "⏸️",
        "suffix": " (covered by baseline/ack)",
    }


# --- build_run_scope: pure helper (re-exported from sync_health) ----


def test_build_run_scope_full_when_both_null() -> None:
    from testim_parity.sync_health import build_run_scope

    assert build_run_scope(slug=None, section=None) == {
        "type": "full",
        "isComplete": True,
        "filters": {"slug": None, "section": None},
    }


def test_build_run_scope_slug_wins_over_section() -> None:
    """--slug が指定されているときは section よりも slug が勝つ (defensive)。"""
    from testim_parity.sync_health import build_run_scope

    result = build_run_scope(slug="overview/testim-overview", section="Overview")
    assert result["type"] == "slug"
    assert result["isComplete"] is False
    assert result["filters"]["slug"] == "overview/testim-overview"


def test_build_run_scope_section_only() -> None:
    from testim_parity.sync_health import build_run_scope

    assert build_run_scope(slug=None, section="Overview") == {
        "type": "section",
        "isComplete": False,
        "filters": {"slug": None, "section": "Overview"},
    }


def test_build_run_scope_empty_string_is_treated_as_null() -> None:
    """empty string は filter として使わない (mjs 等価)。"""
    from testim_parity.sync_health import build_run_scope

    assert build_run_scope(slug="", section="")["type"] == "full"


# --- parse_args / collect_snapshot_slugs gap-fill --------------------


def test_parse_args_slug_flag_alone() -> None:
    args = parse_args(["--slug=testim-overview"])
    assert args["slug"] == "testim-overview"
    assert args["includeAdvisory"] is False


def test_parse_args_combined_section_json_fail_on() -> None:
    args = parse_args(["--section=Overview", "--json", "--fail-on=actionable"])
    assert args["section"] == "Overview"
    assert args["json"] is True
    assert args["failOn"] == "actionable"


def test_collect_snapshot_slugs_ignores_non_html_files(tmp_path: Path) -> None:
    (tmp_path / "page.html").write_text("<div/>", encoding="utf-8")
    (tmp_path / "readme.md").write_text("# readme", encoding="utf-8")
    (tmp_path / "notes.txt").write_text("x", encoding="utf-8")
    result = collect_snapshot_slugs(tmp_path)
    assert result == {"page"}


# ----------------------------------------------------------------------
# reviewer P2#1: ``_page-coverage-gate`` の issue 順は deterministic
# (caller が sidebar/local 挿入順 list を渡す契約。Python ``set`` の
# hash randomization による run-to-run drift を防ぐ。)
# ----------------------------------------------------------------------


def test_page_coverage_gate_issue_order_is_deterministic(tmp_path: Path) -> None:
    """SIDEBAR_URLS.md 順 + filesystem walk 順で ``_page-coverage-gate`` issue 順を固定。

    reviewer P2#1: 以前 ``local_slugs = {...}`` / ``sidebar_slugs`` が Python
    ``set`` のまま ``check_page_coverage`` に渡されていたため、``PYTHONHASHSEED``
    によって run-to-run で順序が入れ替わった。``parity-check-status.json`` の
    ``_page-coverage-gate`` の ``issues`` 配列は downstream sync / detection
    レポートが byte 比較するため、順序が不安定だと diff が常時出る。

    この test は 3 件の sidebar entry + 2 件の local + 0 件 snapshot を用意し:
    - ``source-page-missing-local`` × 3 (sidebar 順: foo/a, foo/c, foo/b)
    - ``local-page-orphan`` × 1 (local 順: foo/only-local)
    - ``missing-*-snapshot`` — sourceUrl 無しなので発火しない
    の順で issue が emit されることを verify する。

    reviewer P2 round-4: ``check_source_parity`` は ``root_dir`` を
    ``read_doc_file`` / ``to_relative_doc_path`` まで thread するため、
    ``project.ROOT_DIR`` の monkeypatch は不要。DI surface だけで alternate
    root 実行が成立することを確認する。
    """
    root = _setup_empty_repo(tmp_path)

    # SIDEBAR_URLS.md — 意図的に alphabetical 順ではなく a/c/b の順で配置。
    # ``load_sidebar_slugs_ordered`` が regex 挿入順 = この並びを保つはず。
    (root / "docs" / "SIDEBAR_URLS.md").write_text(
        "- [A](https://docs.tricentis.com/testim/content/foo/a.htm)\n"
        "- [C](https://docs.tricentis.com/testim/content/foo/c.htm)\n"
        "- [B](https://docs.tricentis.com/testim/content/foo/b.htm)\n",
        encoding="utf-8",
    )

    # local docs — 意図的に alphabetical 順ではなく順序を混ぜる。
    docs = root / "src" / "content" / "docs" / "foo"
    docs.mkdir(parents=True)
    (docs / "only-local.md").write_text("---\ntitle: Only Local\n---\n\nbody\n", encoding="utf-8")
    (docs / "a.md").write_text("---\ntitle: A\n---\n\nbody\n", encoding="utf-8")

    output_path = root / "parity-check-status.json"
    exit_code = check_source_parity(
        root_dir=root,
        output_path=output_path,
        stdout=io.StringIO(),
        stderr=io.StringIO(),
        json_out=True,
    )
    assert exit_code == 1  # reportable coverage issue が出る

    payload = json.loads(output_path.read_text(encoding="utf-8"))
    gate_entry = next((f for f in payload["files"] if f["file"] == "_page-coverage-gate"), None)
    assert gate_entry is not None
    issues = gate_entry["issues"]

    # ``source-page-missing-local`` は sidebar 挿入順 (a, c, b) で emit される。
    missing = [i for i in issues if i["type"] == "source-page-missing-local"]
    missing_slugs = [i["detail"].rsplit(": ", 1)[-1] for i in missing]
    assert missing_slugs == ["foo/c", "foo/b"], (
        "sidebar iteration must preserve insertion order from "
        "load_sidebar_slugs_ordered (set iteration would drift across PYTHONHASHSEED)"
    )
    # ``local-page-orphan`` は local slug の filesystem walk 順で emit される。
    orphans = [i for i in issues if i["type"] == "local-page-orphan"]
    orphan_slugs = [i["detail"].rsplit(": ", 1)[-1] for i in orphans]
    assert orphan_slugs == ["foo/only-local"]


# ----------------------------------------------------------------------
# CLI orchestration: parse_args prefix-match + unknown args are no-ops
# (mjs argv contract をここで pin する)
# ----------------------------------------------------------------------


@pytest.mark.parametrize(
    "argv,expected_key,expected_value",
    [
        (["--json"], "json", True),
        (["--include-advisory"], "includeAdvisory", True),
        (["--include-audit-signals"], "includeAuditSignals", True),
        (["--section=Overview"], "section", "Overview"),
        (["--fail-on=actionable"], "failOn", "actionable"),
        (["--slug=overview/x"], "slug", "overview/x"),
    ],
)
def test_parse_args_each_flag_sets_expected_key(
    argv: list[str], expected_key: str, expected_value: object
) -> None:
    assert parse_args(argv)[expected_key] == expected_value


def test_parse_args_combination_sets_all_flags() -> None:
    args = parse_args(
        [
            "--json",
            "--include-advisory",
            "--fail-on=any",
            "--section=Overview",
            "--slug=foo/bar",
        ]
    )
    assert args["json"] is True
    assert args["includeAdvisory"] is True
    assert args["failOn"] == "any"
    assert args["section"] == "Overview"
    assert args["slug"] == "foo/bar"


def test_parse_args_unknown_is_ignored_not_error() -> None:
    args = parse_args(["--bogus", "--also-bogus=1", "--section=X"])
    assert args["section"] == "X"


def test_parse_args_from_sys_argv_when_argv_is_none(monkeypatch: pytest.MonkeyPatch) -> None:
    """``argv=None`` で呼ばれた時は ``sys.argv[1:]`` を読む (mjs ``argv.slice(2)`` 等価)。"""
    monkeypatch.setattr("sys.argv", ["prog", "--json", "--fail-on=any"])
    args = parse_args(None)
    assert args["json"] is True
    assert args["failOn"] == "any"


# ----------------------------------------------------------------------
# CLI orchestration: main() dispatches to check_source_parity with right args
# ----------------------------------------------------------------------


def test_main_passes_parse_args_and_returns_exit_code(tmp_path: Path) -> None:
    root = _setup_empty_repo(tmp_path)
    exit_code = main(
        ["--json"],
        output_path=root / "parity-check-status.json",
        root_dir=root,
        stdout=io.StringIO(),
        stderr=io.StringIO(),
    )
    assert exit_code == 0


def test_main_json_mode_writes_status_file(tmp_path: Path) -> None:
    root = _setup_empty_repo(tmp_path)
    output = root / "parity-check-status.json"
    out = io.StringIO()
    exit_code = main(
        ["--json"],
        output_path=output,
        root_dir=root,
        stdout=out,
        stderr=io.StringIO(),
    )
    assert exit_code == 0
    assert output.exists()
    payload = json.loads(output.read_text(encoding="utf-8"))
    assert payload["schemaVersion"] == PARITY_CHECK_STATUS_SCHEMA_VERSION
    # json mode: stdout に summary 表は出ない (empty or minimal)
    assert "📊" not in out.getvalue()


def test_main_non_json_mode_prints_summary(tmp_path: Path) -> None:
    """non-json mode は stdout に絵文字サマリを出す (mjs と同じ表示契約)。"""
    root = _setup_empty_repo(tmp_path)
    out = io.StringIO()
    exit_code = main(
        [],  # json 無し
        output_path=root / "parity-check-status.json",
        root_dir=root,
        stdout=out,
        stderr=io.StringIO(),
    )
    assert exit_code == 0
    text = out.getvalue()
    assert "📊" in text  # "📊 チェック結果サマリー"
    assert "ファイル" in text


def test_main_slug_filter_prints_emoji_header(tmp_path: Path) -> None:
    root = _setup_empty_repo(tmp_path)
    docs = root / "src" / "content" / "docs" / "foo"
    docs.mkdir(parents=True)
    (docs / "page.md").write_text("---\ntitle: P\n---\n\nbody\n", encoding="utf-8")

    out = io.StringIO()
    exit_code = main(
        ["--slug=foo/page"],
        output_path=root / "parity-check-status.json",
        root_dir=root,
        stdout=out,
        stderr=io.StringIO(),
    )
    assert exit_code == 0
    assert "🔎 スラグ絞り込み: foo/page" in out.getvalue()


def test_main_unknown_slug_returns_1(tmp_path: Path) -> None:
    root = _setup_empty_repo(tmp_path)
    err = io.StringIO()
    exit_code = main(
        ["--slug=does/not/exist"],
        output_path=root / "parity-check-status.json",
        root_dir=root,
        stdout=io.StringIO(),
        stderr=err,
    )
    assert exit_code == 1
    assert "Unknown slug" in err.getvalue()


# ----------------------------------------------------------------------
# CLI orchestration: status json payload shape + pinned keys
# ----------------------------------------------------------------------


def test_status_json_schema_includes_required_top_level_keys(tmp_path: Path) -> None:
    root = _setup_empty_repo(tmp_path)
    output_path = root / "parity-check-status.json"
    exit_code = check_source_parity(
        root_dir=root,
        output_path=output_path,
        stdout=io.StringIO(),
        stderr=io.StringIO(),
        json_out=True,
    )
    assert exit_code == 0

    payload = json.loads(output_path.read_text(encoding="utf-8"))
    expected_keys = (
        "schemaVersion",
        "summary",
        "files",
        "advisoryQueueScope",
        "advisoryQueue",
        "debug",
    )
    for key in expected_keys:
        assert key in payload, f"payload missing required key {key!r}"


def test_status_json_summary_includes_required_counters(tmp_path: Path) -> None:
    root = _setup_empty_repo(tmp_path)
    output_path = root / "parity-check-status.json"
    check_source_parity(
        root_dir=root,
        output_path=output_path,
        stdout=io.StringIO(),
        stderr=io.StringIO(),
        json_out=True,
    )
    payload = json.loads(output_path.read_text(encoding="utf-8"))
    summary = payload["summary"]
    # 5-counter DoD (CLAUDE.md invariant):
    for key in (
        "reportableActiveFiles",
        "baselinedIssues",
        "advisoryQueueIssues",
        "auditSignalIssues",
    ):
        assert key in summary, f"summary missing 5-counter key {key!r}"
    # 追加の契約 key
    for key in (
        "result",
        "checkedAt",
        "mode",
        "totalFiles",
        "checkedFiles",
        "runScope",
        "linkageState",
    ):
        assert key in summary, f"summary missing {key!r}"


def test_status_json_summary_5_counters_all_zero_on_empty_repo(tmp_path: Path) -> None:
    """empty repo では 5-counter = 0 (`docs/SYSTEM_SPEC.md` 不変量)。"""
    root = _setup_empty_repo(tmp_path)
    output_path = root / "parity-check-status.json"
    check_source_parity(
        root_dir=root,
        output_path=output_path,
        stdout=io.StringIO(),
        stderr=io.StringIO(),
        json_out=True,
    )
    payload = json.loads(output_path.read_text(encoding="utf-8"))
    summary = payload["summary"]
    assert summary["reportableActiveFiles"] == 0
    assert summary["baselinedIssues"] == 0
    assert summary["advisoryQueueIssues"] == 0
    assert summary["auditSignalIssues"] == 0


def test_status_json_debug_includes_coverage_artifacts(tmp_path: Path) -> None:
    root = _setup_empty_repo(tmp_path)
    output_path = root / "parity-check-status.json"
    check_source_parity(
        root_dir=root,
        output_path=output_path,
        stdout=io.StringIO(),
        stderr=io.StringIO(),
        json_out=True,
    )
    payload = json.loads(output_path.read_text(encoding="utf-8"))
    debug = payload["debug"]
    assert "baselineSchemaVersion" in debug
    assert "maskCoverage" in debug
    assert "artifactCoverage" in debug
    assert "patchCoverage" in debug


# ----------------------------------------------------------------------
# CLI orchestration: section filter + run scope propagation
# ----------------------------------------------------------------------


def test_section_filter_propagates_into_runscope(tmp_path: Path) -> None:
    """``--section=X`` → summary.runScope.type == 'section'、filters.section == 'X'。"""
    root = _setup_empty_repo(tmp_path)
    output_path = root / "parity-check-status.json"
    check_source_parity(
        root_dir=root,
        output_path=output_path,
        stdout=io.StringIO(),
        stderr=io.StringIO(),
        section="Overview",
        json_out=True,
    )
    payload = json.loads(output_path.read_text(encoding="utf-8"))
    scope = payload["summary"]["runScope"]
    assert scope["type"] == "section"
    assert scope["filters"]["section"] == "Overview"
    assert scope["isComplete"] is False


def test_slug_filter_propagates_into_runscope(tmp_path: Path) -> None:
    root = _setup_empty_repo(tmp_path)
    docs = root / "src" / "content" / "docs" / "foo"
    docs.mkdir(parents=True)
    (docs / "page.md").write_text("---\ntitle: P\n---\n\nbody\n", encoding="utf-8")
    output_path = root / "parity-check-status.json"
    check_source_parity(
        root_dir=root,
        output_path=output_path,
        stdout=io.StringIO(),
        stderr=io.StringIO(),
        slug="foo/page",
        json_out=True,
    )
    payload = json.loads(output_path.read_text(encoding="utf-8"))
    scope = payload["summary"]["runScope"]
    assert scope["type"] == "slug"
    assert scope["filters"]["slug"] == "foo/page"


def test_full_run_scope_when_no_filter(tmp_path: Path) -> None:
    root = _setup_empty_repo(tmp_path)
    output_path = root / "parity-check-status.json"
    check_source_parity(
        root_dir=root,
        output_path=output_path,
        stdout=io.StringIO(),
        stderr=io.StringIO(),
        json_out=True,
    )
    payload = json.loads(output_path.read_text(encoding="utf-8"))
    scope = payload["summary"]["runScope"]
    assert scope["type"] == "full"
    assert scope["isComplete"] is True


# ----------------------------------------------------------------------
# CLI orchestration: linkage state (source-sync + snapshot-diff propagation)
# ----------------------------------------------------------------------


def test_linkage_state_missing_when_only_source_sync_present(tmp_path: Path) -> None:
    """source-sync-status.json はあるが snapshot-diff-status.json が無い → linkage = missing。"""
    root = _setup_empty_repo(tmp_path)
    (root / "source-sync-status.json").write_text(
        json.dumps(
            {
                "runId": "2026-04-22T00:00:00.000Z#abcd1234",
                "sourceInventoryFingerprint": "sha256:" + "a" * 64,
                "freshnessState": "fresh",
                "runScope": {
                    "type": "full",
                    "isComplete": True,
                    "filters": {"slug": None, "section": None},
                },
            }
        ),
        encoding="utf-8",
    )
    output_path = root / "parity-check-status.json"
    exit_code = check_source_parity(
        root_dir=root,
        output_path=output_path,
        stdout=io.StringIO(),
        stderr=io.StringIO(),
        json_out=True,
    )
    # linkage missing は clean run を inconclusive にする
    assert exit_code == 0
    payload = json.loads(output_path.read_text(encoding="utf-8"))
    assert payload["summary"]["linkageState"] == "missing"
    assert payload["summary"]["result"] == "inconclusive"


def test_linkage_state_linked_when_both_artifacts_agree(tmp_path: Path) -> None:
    """source-sync / snapshot-diff が同じ fingerprint + scope → linkage=linked + result=pass。"""
    root = _setup_empty_repo(tmp_path)
    fp = "sha256:" + "a" * 64
    run_id = "2026-04-22T00:00:00.000Z#abcd1234"
    scope = {"type": "full", "isComplete": True, "filters": {"slug": None, "section": None}}
    (root / "source-sync-status.json").write_text(
        json.dumps(
            {
                "runId": run_id,
                "sourceInventoryFingerprint": fp,
                "freshnessState": "fresh",
                "runScope": scope,
            }
        ),
        encoding="utf-8",
    )
    (root / "snapshot-diff-status.json").write_text(
        json.dumps(
            {
                "sourceSyncRunId": run_id,
                "sourceInventoryFingerprint": fp,
                "runScope": scope,
            }
        ),
        encoding="utf-8",
    )
    output_path = root / "parity-check-status.json"
    exit_code = check_source_parity(
        root_dir=root,
        output_path=output_path,
        stdout=io.StringIO(),
        stderr=io.StringIO(),
        json_out=True,
    )
    assert exit_code == 0
    payload = json.loads(output_path.read_text(encoding="utf-8"))
    assert payload["summary"]["linkageState"] == "linked"
    assert payload["summary"]["result"] == "pass"


# ----------------------------------------------------------------------
# CLI orchestration: malformed artifact rejection
# ----------------------------------------------------------------------


def test_malformed_acknowledgements_rejects_with_stderr(tmp_path: Path) -> None:
    root = _setup_empty_repo(tmp_path)
    (root / "parity-acknowledgements.json").write_text("not-json", encoding="utf-8")

    err = io.StringIO()
    exit_code = check_source_parity(
        root_dir=root,
        output_path=root / "parity-check-status.json",
        stdout=io.StringIO(),
        stderr=err,
        json_out=True,
    )
    assert exit_code == 1
    assert err.getvalue() != ""


def test_malformed_baseline_rejects_with_stderr(tmp_path: Path) -> None:
    root = _setup_empty_repo(tmp_path)
    (root / "parity-baseline.json").write_text("[not json", encoding="utf-8")

    err = io.StringIO()
    exit_code = check_source_parity(
        root_dir=root,
        output_path=root / "parity-check-status.json",
        stdout=io.StringIO(),
        stderr=err,
        json_out=True,
    )
    assert exit_code == 1


# ----------------------------------------------------------------------
# CLI orchestration: fail-on=actionable allows reportable to pass
# ----------------------------------------------------------------------


def test_fail_on_actionable_ignores_signal_only_reportable() -> None:
    """``--fail-on=actionable`` では signal-only reportable は gate に寄与しない。

    ``reportableActiveFiles > 0`` でも ``reportableActiveActionableFiles == 0`` なら exit 0。
    """
    summary = {
        "reportableActiveFiles": 3,
        "reportableActiveActionableFiles": 0,
        "activeErrorFiles": 0,
    }
    assert compute_exit_code(summary, "actionable") == 0


def test_fail_on_any_fires_on_any_reportable() -> None:
    summary = {
        "reportableActiveFiles": 1,
        "reportableActiveActionableFiles": 0,
        "activeErrorFiles": 0,
    }
    assert compute_exit_code(summary, "any") == 1


def test_fail_on_none_defaults_to_any() -> None:
    """``fail_on=None`` は ``any`` と同じ扱い (mjs と同じ default)。"""
    summary = {
        "reportableActiveFiles": 1,
        "reportableActiveActionableFiles": 0,
        "activeErrorFiles": 0,
    }
    assert compute_exit_code(summary, None) == 1


def test_fail_on_actionable_still_fires_on_active_errors() -> None:
    """``fail_on=actionable`` でも active errors は gate を発火させる。"""
    summary = {
        "reportableActiveFiles": 0,
        "reportableActiveActionableFiles": 0,
        "activeErrorFiles": 1,
    }
    assert compute_exit_code(summary, "actionable") == 1


# ----------------------------------------------------------------------
# CLI orchestration: compute_parity_result branch on freshness + counters
# ----------------------------------------------------------------------


def test_parity_result_pass_requires_fresh_freshness_and_zero_counters() -> None:
    assert (
        compute_parity_result({"reportableActiveFiles": 0, "activeErrorFiles": 0}, "fresh")
        == "pass"
    )


def test_parity_result_inconclusive_when_stale_but_clean() -> None:
    assert (
        compute_parity_result({"reportableActiveFiles": 0, "activeErrorFiles": 0}, "stale")
        == "inconclusive"
    )


def test_parity_result_fail_overrides_freshness() -> None:
    """reportable > 0 なら freshness に関わらず fail。"""
    for freshness in ("fresh", "stale", "partial", "broken", None):
        assert (
            compute_parity_result({"reportableActiveFiles": 1, "activeErrorFiles": 0}, freshness)
            == "fail"
        )


# ----------------------------------------------------------------------
# CLI orchestration: single-page mode only checks matching slug
# ----------------------------------------------------------------------


def test_single_page_mode_checks_only_target_slug(tmp_path: Path) -> None:
    """``--slug=X`` では checkedFiles == 1 になり、他 file は skip される。"""
    root = _setup_empty_repo(tmp_path)
    docs = root / "src" / "content" / "docs" / "foo"
    docs.mkdir(parents=True)
    (docs / "a.md").write_text("---\ntitle: A\n---\n\nbody a\n", encoding="utf-8")
    (docs / "b.md").write_text("---\ntitle: B\n---\n\nbody b\n", encoding="utf-8")

    output_path = root / "parity-check-status.json"
    check_source_parity(
        root_dir=root,
        output_path=output_path,
        stdout=io.StringIO(),
        stderr=io.StringIO(),
        slug="foo/a",
        json_out=True,
    )
    payload = json.loads(output_path.read_text(encoding="utf-8"))
    summary = payload["summary"]
    # 2 ファイル存在するが slug filter で 1 だけ check される
    assert summary["totalFiles"] == 2
    assert summary["checkedFiles"] == 1


def test_full_run_checks_every_file(tmp_path: Path) -> None:
    root = _setup_empty_repo(tmp_path)
    docs = root / "src" / "content" / "docs" / "foo"
    docs.mkdir(parents=True)
    (docs / "a.md").write_text("---\ntitle: A\n---\n\nbody\n", encoding="utf-8")
    (docs / "b.md").write_text("---\ntitle: B\n---\n\nbody\n", encoding="utf-8")

    output_path = root / "parity-check-status.json"
    check_source_parity(
        root_dir=root,
        output_path=output_path,
        stdout=io.StringIO(),
        stderr=io.StringIO(),
        json_out=True,
    )
    payload = json.loads(output_path.read_text(encoding="utf-8"))
    assert payload["summary"]["checkedFiles"] == 2


# ----------------------------------------------------------------------
# CLI orchestration: output_path defaults + directory creation
# ----------------------------------------------------------------------


def test_output_path_creates_parent_directories(tmp_path: Path) -> None:
    """``output_path`` の親 directory が存在しなくても作成される。"""
    root = _setup_empty_repo(tmp_path)
    nested_output = root / "nested" / "subdir" / "parity-check-status.json"
    assert not nested_output.parent.exists()

    check_source_parity(
        root_dir=root,
        output_path=nested_output,
        stdout=io.StringIO(),
        stderr=io.StringIO(),
        json_out=True,
    )
    assert nested_output.exists()


# ----------------------------------------------------------------------
# Console coverage state — additional branches beyond base test
# ----------------------------------------------------------------------


def test_console_coverage_state_mixed_ack_and_reportable() -> None:
    """ack と reportable が混在 → ❌ (reportable が優先)。"""
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
            "baselined": False,
        },
    ]
    assert get_console_coverage_state(issues)["icon"] == "❌"


def test_console_coverage_state_expired_ack_is_reportable() -> None:
    """expired ack は reportable 扱い → ❌。"""
    issues = [
        {
            "type": "paragraph-count",
            "severity": "actionable",
            "acknowledged": True,
            "ackExpired": True,
        },
    ]
    assert get_console_coverage_state(issues)["icon"] == "❌"


# ----------------------------------------------------------------------
# collect_snapshot_slugs — glob-like walk
# ----------------------------------------------------------------------


def test_collect_snapshot_slugs_forward_slash_paths(tmp_path: Path) -> None:
    """POSIX ``/`` 区切り slug を返す (mjs と同一)。"""
    (tmp_path / "a").mkdir()
    (tmp_path / "a" / "b").mkdir()
    (tmp_path / "a" / "b" / "c.html").write_text("x", encoding="utf-8")
    slugs = collect_snapshot_slugs(tmp_path)
    assert "a/b/c" in slugs


# ----------------------------------------------------------------------
# check_source_parity exit code reflects reportableActiveFiles
# ----------------------------------------------------------------------


def test_check_source_parity_exit_code_1_when_local_page_orphan(tmp_path: Path) -> None:
    """local file が sidebar 外 → local-page-orphan reportable → exit 1。"""
    root = _setup_empty_repo(tmp_path)
    (root / "docs" / "SIDEBAR_URLS.md").write_text(
        "- [Known](https://docs.tricentis.com/testim/content/foo/known.htm)\n",
        encoding="utf-8",
    )
    docs = root / "src" / "content" / "docs" / "foo"
    docs.mkdir(parents=True)
    # orphan 出現用: sidebar に無い only-local
    (docs / "only-local.md").write_text("---\ntitle: Only Local\n---\n\nbody\n", encoding="utf-8")

    exit_code = check_source_parity(
        root_dir=root,
        output_path=root / "parity-check-status.json",
        stdout=io.StringIO(),
        stderr=io.StringIO(),
        json_out=True,
    )
    assert exit_code == 1


# ----------------------------------------------------------------------
# mask_coverage integration (PR #384 review P1-2):
#   check_source_parity.py:514-522 の mask_coverage.record() キーワード引数
#   契約 (snake_case segment_kind / section_path) を E2E で pin する。
#   snapshot + JA doc の両方が揃い、かつ JA 側に glossary 用語が含まれる
#   ケースで、debug.maskCoverage が non-empty になることを保証する。
# ----------------------------------------------------------------------


def test_mask_coverage_records_non_empty_masks_from_ja_body(tmp_path: Path) -> None:
    """JA body に glossary 用語 (Testim / Visual Editor) が含まれる場合、
    EN HTML snapshot が存在する run で debug.maskCoverage.summary.segmentsMasked
    が 1 以上になる。これは PR #384 で修正された kwarg name bug
    (segmentKind → segment_kind) の regression guard。"""
    root = _setup_empty_repo(tmp_path)

    # JA doc: glossary 用語を含む paragraph を少なくとも 1 つ emit する
    docs = root / "src" / "content" / "docs" / "mask"
    docs.mkdir(parents=True)
    (docs / "page.md").write_text(
        "---\n"
        "title: Mask Coverage Test\n"
        "description: Testim と Visual Editor を使う。\n"
        "category: Overview\n"
        "updated: '2026-01-01'\n"
        "sourceUrl: https://docs.tricentis.com/testim/content/mask/page.htm\n"
        "---\n"
        "\n"
        "## 概要\n"
        "\n"
        "Testim と Visual Editor を使ってテストを作成します。\n",
        encoding="utf-8",
    )

    # EN HTML snapshot: preprocess + turndown + extract の全段階で例外を出さず、
    # extract_segments_from_html が 1 つ以上 segment を emit する最小構造。
    snapshots = root / "snapshots" / "en" / "content" / "mask"
    snapshots.mkdir(parents=True)
    (snapshots / "page.html").write_text(
        "<h2>Overview</h2>\n<p>Use the Testim extension with Visual Editor to create tests.</p>\n",
        encoding="utf-8",
    )

    output_path = root / "parity-check-status.json"
    check_source_parity(
        root_dir=root,
        output_path=output_path,
        stdout=io.StringIO(),
        stderr=io.StringIO(),
        slug="mask/page",
        json_out=True,
    )

    payload = json.loads(output_path.read_text(encoding="utf-8"))
    mask_coverage = payload["debug"]["maskCoverage"]

    # JA body に "Testim" / "Visual Editor" を含む paragraph が 1 つ以上あるので、
    # mask_coverage.record() が non-empty masks で少なくとも 1 回呼ばれる
    assert mask_coverage["summary"]["segmentsMasked"] >= 1, (
        "mask_coverage must capture at least one JA segment that contains "
        "glossary terms; non-empty segmentsMasked proves that record() was "
        "called with valid snake_case kwargs (regression guard for PR #384)."
    )
    # Glossary counter が "Testim" または "Visual Editor" を含む
    by_glossary = mask_coverage["summary"]["byGlossaryEntry"]
    assert any(term in by_glossary for term in ("Testim", "Visual Editor")), (
        f"byGlossaryEntry must include Testim or Visual Editor, got {by_glossary}"
    )
    # masked_segments entries の shape pin: slug / segmentKind / sectionPath /
    # masks の camelCase key が揃う (artifact parity の契約)
    masked_segments = mask_coverage["maskedSegments"]
    assert len(masked_segments) >= 1
    for entry in masked_segments:
        assert entry["slug"] == "mask/page"
        assert "segmentKind" in entry
        assert "sectionPath" in entry
        assert isinstance(entry["masks"], list)
        assert len(entry["masks"]) >= 1


def test_mask_coverage_stays_empty_when_ja_body_has_no_glossary_terms(
    tmp_path: Path,
) -> None:
    """JA body が glossary 用語を含まない場合、mask は空で record() は early-return。
    segmentsMasked は 0 のまま、byGlossaryEntry も空。早期 return 経路の契約 pin。"""
    root = _setup_empty_repo(tmp_path)
    docs = root / "src" / "content" / "docs" / "nomatch"
    docs.mkdir(parents=True)
    (docs / "page.md").write_text(
        "---\n"
        "title: No Match\n"
        "description: 日本語のみの説明です。\n"
        "category: Overview\n"
        "updated: '2026-01-01'\n"
        "sourceUrl: https://docs.tricentis.com/testim/content/nomatch/page.htm\n"
        "---\n"
        "\n"
        "## 概要\n"
        "\n"
        "日本語のみの段落です。専門用語は含まれていません。\n",
        encoding="utf-8",
    )
    snapshots = root / "snapshots" / "en" / "content" / "nomatch"
    snapshots.mkdir(parents=True)
    (snapshots / "page.html").write_text(
        "<h2>Overview</h2>\n<p>Japanese-only content, no glossary terms.</p>\n",
        encoding="utf-8",
    )

    output_path = root / "parity-check-status.json"
    check_source_parity(
        root_dir=root,
        output_path=output_path,
        stdout=io.StringIO(),
        stderr=io.StringIO(),
        slug="nomatch/page",
        json_out=True,
    )

    payload = json.loads(output_path.read_text(encoding="utf-8"))
    mask_coverage = payload["debug"]["maskCoverage"]
    assert mask_coverage["summary"]["segmentsMasked"] == 0
    assert mask_coverage["summary"]["byGlossaryEntry"] == {}
    assert mask_coverage["maskedSegments"] == []
