"""Phase 4 CLI scripts の smoke tests (unit レベル)。

個別 script を直接 call して最低限の動作を確認する。byte-identical parity は
mjs output との cross-runtime で別途 integration test で扱う方針。

P2 regression suite (PR #374 review):
- ``test_parse_sidebar_list_full_width_delimiter`` — sidebar heading regex が
  全角 ``（...）`` を保持している
- ``test_generate_detection_reports_defaults_to_root_dir`` — root_dir 省略時
  ``ROOT_DIR`` が使われる
- ``test_render_upstream_recovery_defaults_to_root_dir`` — 同上
- ``test_js_iso_timestamp_format`` — mjs ``Date.toISOString()`` と同じ
  ``YYYY-MM-DDTHH:MM:SS.sssZ`` を返す
"""

from __future__ import annotations

import io
import json
import re
from datetime import UTC, datetime
from pathlib import Path

import pytest

from testim_parity.detection.generate_detection_reports import generate_detection_reports
from testim_parity.detection.render_upstream_recovery_comment import (
    main as render_upstream_main,
)
from testim_parity.pipeline.fetch_translate_images import (
    get_all_pages_list,
    parse_sidebar_list,
)
from testim_parity.pipeline.pipeline import js_iso_timestamp


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


# --- P2 regression tests (PR #374 review findings) ---


_SIDEBAR_FIXTURE = (
    "## Overview（概要）\n"
    "- ✅ https://docs.tricentis.com/testim/content/overview/intro.htm\n"
    "- ⏳ https://docs.tricentis.com/testim/content/overview/roadmap.htm\n"
    "\n"
    "## Guides\n"
    "- ✅🔍 https://docs.tricentis.com/testim/content/guides/setup.htm\n"
)


def test_parse_sidebar_list_full_width_delimiter() -> None:
    """全角 ``（...）`` 付き見出しから English / Japanese が正しく抽出される。

    過去の regex 退化: ``（`` と ``）`` を落とすと ``english='O'``,
    ``japanese='verview（概要）'`` のように 1 文字ずつに崩れていた。
    """
    rows = parse_sidebar_list(_SIDEBAR_FIXTURE, lambda _status: True)
    assert len(rows) == 3

    overview_rows = [r for r in rows if r["categoryEnglish"] == "Overview"]
    assert len(overview_rows) == 2, (
        f"expected 2 rows under 'Overview', got categoryEnglish values: "
        f"{[r['categoryEnglish'] for r in rows]}"
    )
    assert overview_rows[0]["categoryJapanese"] == "概要"

    # 全角区切りなしの見出しは english = japanese にフォールバックする (mjs 等価)。
    guides_row = next(r for r in rows if r["categoryEnglish"] == "Guides")
    assert guides_row["categoryJapanese"] == "Guides"


def test_get_all_pages_list_preserves_japanese_category() -> None:
    """``get_all_pages_list`` も category の Japanese を正しく保持する。"""
    rows = get_all_pages_list(_SIDEBAR_FIXTURE)
    first = rows[0]
    assert first["categoryEnglish"] == "Overview"
    assert first["categoryJapanese"] == "概要"


def test_generate_detection_reports_defaults_to_root_dir(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """``root_dir=None`` で module の ``ROOT_DIR`` が使われる (cwd に依存しない)。

    mjs は ``__dirname`` 基準で repo root を固定する。``cd scripts/py &&
    uv run python -m ...`` でも repo root の artifact を読み書きする契約。
    """
    # minimal valid artifacts を tmp に用意し、ROOT_DIR をそこへ差し替える。
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

    # ``ROOT_DIR`` を参照する 2 箇所 (generate_detection_reports 自身 +
    # load_detection_inputs 側) を両方差し替える。
    import testim_parity.detection.generate_detection_reports as gen_mod
    import testim_parity.detection_reports as det_mod

    monkeypatch.setattr(gen_mod, "ROOT_DIR", tmp_path)
    monkeypatch.setattr(det_mod, "ROOT_DIR", tmp_path)

    # cwd が tmp_path 以外 (= project root など) でも tmp_path の artifact を見る。
    monkeypatch.chdir(tmp_path.parent)

    result = generate_detection_reports(strict=False)

    assert Path(result["outputs"]["actionableReport"]).parent == tmp_path
    assert (tmp_path / "docs-actionable-report.json").exists()
    assert (tmp_path / "docs-update-summary.md").exists()
    assert (tmp_path / "docs-audit-manifest.json").exists()


def test_render_upstream_recovery_defaults_to_root_dir(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """``root_dir=None`` で module の ``ROOT_DIR`` が使われる。"""
    # status JSON 不在でも cwd ではなく ROOT_DIR 側を見ていることを確認する。
    import testim_parity.detection.render_upstream_recovery_comment as mod

    monkeypatch.setattr(mod, "ROOT_DIR", tmp_path)

    sentinel_cwd = tmp_path.parent / "decoy"
    sentinel_cwd.mkdir()
    # cwd 側にダミーの status を置いても読まれてはいけない。
    _write_json(
        sentinel_cwd / "upstream-recovery-status.json",
        {"mechanisms": {"en_source_patches": [{"id": "WRONG"}]}},
    )
    monkeypatch.chdir(sentinel_cwd)

    stdout = io.StringIO()
    exit_code = render_upstream_main(stdout=stdout)

    assert exit_code == 0
    # ROOT_DIR 側には artifact が無いので signals=false (cwd 側は無視される)。
    assert stdout.getvalue().strip() == "has_signals=false"
    assert not (tmp_path / "upstream-recovery-comment.md").exists()


@pytest.mark.parametrize(
    "fixed_time",
    [
        datetime(2026, 4, 22, 12, 34, 56, 789_000, tzinfo=UTC),
        datetime(2026, 1, 1, 0, 0, 0, 0, tzinfo=UTC),
        datetime(2026, 12, 31, 23, 59, 59, 999_000, tzinfo=UTC),
    ],
)
def test_js_iso_timestamp_format(fixed_time: datetime) -> None:
    """``js_iso_timestamp`` は mjs ``Date.toISOString()`` と同じ形式を返す。

    退化した実装 (``isoformat(timespec='milliseconds') + 'Z'``) は
    ``2026-04-22T12:34:56.789+00:00Z`` のような不正な文字列を返していた。
    """
    stamp = js_iso_timestamp(fixed_time)
    # mjs toISOString の厳密な形: YYYY-MM-DDTHH:MM:SS.sssZ
    assert re.match(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$", stamp), stamp
    assert "+00:00" not in stamp
    assert stamp.endswith("Z")
    # ms 部分が 3 桁であることも合わせて確認する。
    ms_part = stamp.split(".")[1][:3]
    assert ms_part.isdigit()


def test_js_iso_timestamp_default_uses_now() -> None:
    """引数省略時は ``datetime.now(tz=UTC)`` と同じ contract で返る。"""
    stamp = js_iso_timestamp()
    assert re.match(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$", stamp)
