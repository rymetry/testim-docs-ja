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
from typing import Any

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


# --- snapshot_diff refspec safety guard (reviewer CRITICAL-1) ---


def test_assert_safe_refspec_path_accepts_clean_relative_paths() -> None:
    """通常の relative path は as_posix() 文字列で返る。"""
    from testim_parity.detection.snapshot_diff import assert_safe_refspec_path

    assert assert_safe_refspec_path(Path("snapshots/en/content/a.html")) == (
        "snapshots/en/content/a.html"
    )
    assert assert_safe_refspec_path(Path("docs/sidebar.json")) == "docs/sidebar.json"


def test_assert_safe_refspec_path_rejects_absolute_path(tmp_path: Path) -> None:
    """絶対パスは ValueError (git refspec が予期しない blob を読みうる)。"""
    from testim_parity.detection.snapshot_diff import assert_safe_refspec_path

    with pytest.raises(ValueError, match="absolute path"):
        assert_safe_refspec_path(tmp_path / "foo.html")


def test_assert_safe_refspec_path_rejects_dotdot_traversal() -> None:
    """``..`` 混入を拒否する。"""
    from testim_parity.detection.snapshot_diff import assert_safe_refspec_path

    with pytest.raises(ValueError, match=r"\.\."):
        assert_safe_refspec_path(Path("snapshots/../../etc/passwd"))


def test_assert_safe_refspec_path_does_not_flag_inner_dots() -> None:
    """ファイル名内の ``..`` は segment 単位チェックで誤検出しない (``a..b.html``)。"""
    from testim_parity.detection.snapshot_diff import assert_safe_refspec_path

    assert assert_safe_refspec_path(Path("snapshots/a..b.html")) == "snapshots/a..b.html"


def test_get_head_content_wraps_valueerror_as_runtimeerror() -> None:
    """``_get_head_content`` は guard の ValueError を RuntimeError に wrap する。

    main loop / ``_diff_sidebar`` は ``except RuntimeError`` でのみ handling
    するため、guard の ValueError がそのまま escape すると CLI がトレース
    ダンプで落ちる。wrap して統一 (MEDIUM-NEW-1)。メッセージは guard の
    ``refuse to pass ...`` をそのまま引き継ぐ (double-prefix を避ける
    Round 3 M4)。
    """
    from testim_parity.detection.snapshot_diff import _get_head_content

    with pytest.raises(RuntimeError, match="refuse to pass absolute path"):
        _get_head_content(Path("/etc/passwd"))
    with pytest.raises(RuntimeError, match=r"refuse to pass '\.\.'"):
        _get_head_content(Path("snapshots/../../etc/passwd"))


# --- generate_parity_baseline 3-mode smoke tests (reviewer merge gate) ---


def _full_parity_status_pass(checked_at: str = "2026-04-22T10:00:00Z") -> dict[str, Any]:
    """pre-regen gate を pass する minimal full-run parity status を組み立てる。"""
    return {
        "schemaVersion": 1,
        "summary": {
            "checkedAt": checked_at,
            "result": "pass",
            "runScope": {"isComplete": True},
            "freshnessState": "fresh",
            "linkageState": "linked",
            "orphanBaselineEntries": 0,
            "checkedFiles": 0,
            "totalFiles": 0,
        },
        "debug": {"patchCoverage": {"mismatches": []}},
        "files": [],
        "advisoryQueue": [],
        "advisoryQueueScope": {"isComplete": True, "type": "all", "filters": {}},
    }


def _snapshot_diff_clean() -> dict[str, Any]:
    """regen gate 用の no-diff snapshot status。"""
    return {
        "schemaVersion": 1,
        "checkedAt": "2026-04-22T10:00:00Z",
        "runId": "snap-run-1",
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


def _parity_status_with_structure_issue(
    *, slug: str = "overview/intro", section_index: int = 0
) -> dict[str, Any]:
    """structure-mismatch issue を 1 件持つ full-run parity status。"""
    status = _full_parity_status_pass()
    status["summary"]["checkedFiles"] = 1
    status["summary"]["totalFiles"] = 1
    status["files"] = [
        {
            "file": f"src/content/docs/{slug}.md",
            "issues": [
                {
                    "type": "section-structure-mismatch",
                    "sectionPath": "intro",
                    "sectionIndex": section_index,
                    "structureCategory": "kind-multiset",
                    "enKinds": ["heading", "paragraph"],
                    "jaKinds": ["heading"],
                    "contentPermutation": None,
                }
            ],
        }
    ]
    return status


def _write_snapshot_html(snapshots_dir: Path, slug: str, content: str = "<p>x</p>") -> None:
    target = snapshots_dir / f"{slug}.html"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def _patch_baseline_paths(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> dict[str, Path]:
    """``generate_parity_baseline`` module の 4 path 定数を tmp_path に差し替える。

    ``ROOT_DIR`` は意図的に patch しない。module 内で ``ROOT_DIR`` が使われる
    唯一の箇所は ``main`` 末尾の ``_BASELINE_PATH.relative_to(ROOT_DIR)`` で、
    成功すれば相対 path、失敗すれば絶対 path を print するだけの cosmetic 処理。
    tmp_path は通常 ROOT_DIR の外にあるので ``ValueError`` の fallback を通り、
    結果として絶対 path が print される (test の assertion には影響しない)。
    """
    import testim_parity.detection.generate_parity_baseline as mod

    status_path = tmp_path / "parity-check-status.json"
    baseline_path = tmp_path / "parity-baseline.json"
    snapshot_diff_path = tmp_path / "snapshot-diff-status.json"
    snapshots_dir = tmp_path / "snapshots" / "en" / "content"
    snapshots_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(mod, "_STATUS_PATH", status_path)
    monkeypatch.setattr(mod, "_BASELINE_PATH", baseline_path)
    monkeypatch.setattr(mod, "_SNAPSHOT_DIFF_PATH", snapshot_diff_path)
    monkeypatch.setattr(mod, "_SNAPSHOTS_DIR", snapshots_dir)
    return {
        "status": status_path,
        "baseline": baseline_path,
        "snapshot_diff": snapshot_diff_path,
        "snapshots": snapshots_dir,
    }


def test_generate_parity_baseline_regenerate_mode(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """``--regenerate`` モード: pre-regen gate を pass して baseline を全再生する。"""
    from testim_parity.detection.generate_parity_baseline import main as baseline_main

    paths = _patch_baseline_paths(monkeypatch, tmp_path)
    slug = "overview/intro"
    status = _parity_status_with_structure_issue(slug=slug)
    _write_json(paths["status"], status)
    _write_json(paths["snapshot_diff"], _snapshot_diff_clean())
    _write_snapshot_html(paths["snapshots"], slug)

    exit_code = baseline_main(["--regenerate"])

    assert exit_code == 0, "--regenerate should succeed on a gated full-run status"
    assert paths["baseline"].exists()
    written = json.loads(paths["baseline"].read_text(encoding="utf-8"))
    assert written["schemaVersion"] == 2
    assert written["rationale"] == "frozen baseline — regenerated (schema v2)"
    assert len(written["entries"]) == 1
    entry = written["entries"][0]
    assert entry["slug"] == slug
    assert entry["issueType"] == "section-structure-mismatch"
    assert entry["structureCategory"] == "kind-multiset"


def test_generate_parity_baseline_slug_mode_merges_with_existing(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """``--slug=<csv>`` モード: 指定 slug の entries だけ差し替えて残りを保持する。"""
    from testim_parity.detection.generate_parity_baseline import main as baseline_main

    paths = _patch_baseline_paths(monkeypatch, tmp_path)

    # baseline validator は ``snapshotFingerprint`` / ``structureFingerprint`` を
    # ``sha256:<64 hex>`` で厳密に format check する。fixture は実在しそうな
    # 有効値を直接書く (= 実際の compute_*_fingerprint 出力と byte 等価)。
    fp_keep = "sha256:" + ("a" * 64)
    fp_stale = "sha256:" + ("b" * 64)
    sfp_keep = "sha256:" + ("c" * 64)
    sfp_stale = "sha256:" + ("d" * 64)

    # 既存 baseline には他 slug の entry を置き、対象 slug にも 1 件入れておく。
    existing_baseline = {
        "schemaVersion": 2,
        "generatedAt": "2026-04-20T00:00:00Z",
        "generatedFromRunId": "previous-run",
        "rationale": "prior",
        "entries": [
            {
                "slug": "overview/other",
                "issueType": "section-structure-mismatch",
                "snapshotFingerprint": fp_keep,
                "priority": "medium",
                "sectionPath": "intro",
                "segmentKind": None,
                "enSegmentIndex": None,
                "jaSegmentIndex": None,
                "enSourceFingerprint": None,
                "jaSourceFingerprint": None,
                "missingTokens": None,
                "sectionIndex": 0,
                "structureCategory": "kind-sequence",
                "structureFingerprint": sfp_keep,
            },
            # 同じ slug の古い entry (置換されるはず)。
            {
                "slug": "overview/intro",
                "issueType": "section-structure-mismatch",
                "snapshotFingerprint": fp_stale,
                "priority": "medium",
                "sectionPath": "old",
                "segmentKind": None,
                "enSegmentIndex": None,
                "jaSegmentIndex": None,
                "enSourceFingerprint": None,
                "jaSourceFingerprint": None,
                "missingTokens": None,
                "sectionIndex": 9,
                "structureCategory": "kind-sequence",
                "structureFingerprint": sfp_stale,
            },
        ],
    }
    paths["baseline"].write_text(
        json.dumps(existing_baseline, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    slug = "overview/intro"
    status = _parity_status_with_structure_issue(slug=slug)
    _write_json(paths["status"], status)
    _write_snapshot_html(paths["snapshots"], slug)

    exit_code = baseline_main([f"--slug={slug}"])

    assert exit_code == 0
    written = json.loads(paths["baseline"].read_text(encoding="utf-8"))
    slugs = [e["slug"] for e in written["entries"]]
    # 他 slug は保持、対象 slug の stale entry は置換される。
    assert "overview/other" in slugs
    intro_entries = [e for e in written["entries"] if e["slug"] == slug]
    assert len(intro_entries) == 1
    # stale fingerprint は消えて status 由来の値に置き換わる。
    assert intro_entries[0]["structureFingerprint"] != sfp_stale
    assert intro_entries[0]["structureCategory"] == "kind-multiset"


def test_generate_parity_baseline_types_mode_merges_by_type(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """``--types=<csv>`` モード: 指定 type の entry のみ差し替え。"""
    from testim_parity.detection.generate_parity_baseline import main as baseline_main

    paths = _patch_baseline_paths(monkeypatch, tmp_path)

    fp_keep = "sha256:" + ("1" * 64)
    fp_stale = "sha256:" + ("2" * 64)
    sfp_keep = "sha256:" + ("3" * 64)
    sfp_stale = "sha256:" + ("4" * 64)

    # 既存 baseline には 2 type 混在。--types でこのうち片方だけ差し替わる
    # ことを検証する。
    existing_baseline = {
        "schemaVersion": 2,
        "generatedAt": "2026-04-20T00:00:00Z",
        "generatedFromRunId": "previous-run",
        "rationale": "prior",
        "entries": [
            {
                "slug": "other/page",
                "issueType": "segment-order-mismatch",
                "snapshotFingerprint": fp_keep,
                "priority": "medium",
                "sectionPath": "body",
                "segmentKind": None,
                "enSegmentIndex": None,
                "jaSegmentIndex": None,
                "enSourceFingerprint": None,
                "jaSourceFingerprint": None,
                "missingTokens": None,
                "sectionIndex": 0,
                "structureCategory": "content-order",
                "structureFingerprint": sfp_keep,
            },
            {
                "slug": "other/page",
                "issueType": "section-structure-mismatch",
                "snapshotFingerprint": fp_stale,
                "priority": "medium",
                "sectionPath": "body",
                "segmentKind": None,
                "enSegmentIndex": None,
                "jaSegmentIndex": None,
                "enSourceFingerprint": None,
                "jaSourceFingerprint": None,
                "missingTokens": None,
                "sectionIndex": 0,
                "structureCategory": "kind-sequence",
                "structureFingerprint": sfp_stale,
            },
        ],
    }
    paths["baseline"].write_text(
        json.dumps(existing_baseline, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    slug = "overview/intro"
    status = _parity_status_with_structure_issue(slug=slug)
    _write_json(paths["status"], status)
    _write_snapshot_html(paths["snapshots"], slug)

    exit_code = baseline_main(["--types=section-structure-mismatch"])

    assert exit_code == 0
    written = json.loads(paths["baseline"].read_text(encoding="utf-8"))
    types = {e["issueType"] for e in written["entries"]}
    assert "segment-order-mismatch" in types, "segment-order-mismatch entry should be preserved"
    # 古い section-structure-mismatch は削除され、新しい slug の entry が入る。
    structure_entries = [
        e for e in written["entries"] if e["issueType"] == "section-structure-mismatch"
    ]
    assert len(structure_entries) == 1
    assert structure_entries[0]["slug"] == slug


def test_generate_parity_baseline_rejects_mutually_exclusive_modes(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """``--regenerate`` / ``--slug`` / ``--types`` 同時指定は exit 1 + usage 出力。"""
    from testim_parity.detection.generate_parity_baseline import main as baseline_main

    _patch_baseline_paths(monkeypatch, tmp_path)

    exit_code = baseline_main(["--regenerate", "--slug=overview/intro"])

    assert exit_code == 1
    captured = capsys.readouterr()
    assert "mutually exclusive" in captured.err


def test_generate_parity_baseline_regenerate_gate_failure(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """``--regenerate`` は pre-regen gate で fail したら exit 1 で止まる。"""
    from testim_parity.detection.generate_parity_baseline import main as baseline_main

    paths = _patch_baseline_paths(monkeypatch, tmp_path)
    # freshnessState を意図的に stale にして gate を fail させる。
    status = _full_parity_status_pass()
    status["summary"]["freshnessState"] = "stale"
    _write_json(paths["status"], status)
    _write_json(paths["snapshot_diff"], _snapshot_diff_clean())

    exit_code = baseline_main(["--regenerate"])

    assert exit_code == 1
    captured = capsys.readouterr()
    assert "baseline-regen-gate: FAIL" in captured.err
    # baseline は書き出されない。
    assert not paths["baseline"].exists()


def test_generate_parity_baseline_regenerate_emits_gate_pass_marker(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """``--regenerate`` success path は ``baseline-regen-gate: pass`` を stdout に出す。

    CI 側で pass signal を grep している場合の regression guard (Round 3 M1)。
    """
    from testim_parity.detection.generate_parity_baseline import main as baseline_main

    paths = _patch_baseline_paths(monkeypatch, tmp_path)
    slug = "overview/intro"
    _write_json(paths["status"], _parity_status_with_structure_issue(slug=slug))
    _write_json(paths["snapshot_diff"], _snapshot_diff_clean())
    _write_snapshot_html(paths["snapshots"], slug)

    exit_code = baseline_main(["--regenerate"])

    assert exit_code == 0
    captured = capsys.readouterr()
    assert "baseline-regen-gate: pass" in captured.out


def test_generate_parity_baseline_slug_mode_rejects_malformed_existing_baseline(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """既存 ``parity-baseline.json`` が schema 違反なら clean exit 1 で失敗する。

    以前は ``load_baseline_file`` が raw ``ValueError`` を上げて CLI が traceback
    で落ちていた (Round 3 P2)。``main`` の top-level catch で
    ``❌ generate_parity_baseline error:`` prefix 付きに変換される。
    """
    from testim_parity.detection.generate_parity_baseline import main as baseline_main

    paths = _patch_baseline_paths(monkeypatch, tmp_path)
    slug = "overview/intro"
    _write_json(paths["status"], _parity_status_with_structure_issue(slug=slug))
    _write_snapshot_html(paths["snapshots"], slug)
    # schema version が 2 でない baseline は ``validate_baseline`` が reject。
    _write_json(paths["baseline"], {"schemaVersion": 999, "entries": []})

    exit_code = baseline_main([f"--slug={slug}"])

    assert exit_code == 1, "malformed baseline must produce exit 1, not traceback"
    captured = capsys.readouterr()
    assert "generate_parity_baseline error" in captured.err


def test_generate_parity_baseline_types_mode_rejects_malformed_existing_baseline(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """``--types`` モードも同様の clean-exit 契約を満たす。"""
    from testim_parity.detection.generate_parity_baseline import main as baseline_main

    paths = _patch_baseline_paths(monkeypatch, tmp_path)
    slug = "overview/intro"
    _write_json(paths["status"], _parity_status_with_structure_issue(slug=slug))
    _write_snapshot_html(paths["snapshots"], slug)
    # 壊れた JSON を書いて ``json.loads`` を失敗させる。
    paths["baseline"].write_text("{ not valid json", encoding="utf-8")

    exit_code = baseline_main(["--types=section-structure-mismatch"])

    assert exit_code == 1
    captured = capsys.readouterr()
    assert "generate_parity_baseline error" in captured.err


def test_generate_parity_baseline_slug_mode_rejects_non_full_run(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """``--slug`` モードでも partial-run status なら exit 1 (Round 3 M3)。"""
    from testim_parity.detection.generate_parity_baseline import main as baseline_main

    paths = _patch_baseline_paths(monkeypatch, tmp_path)
    status = _full_parity_status_pass()
    # partial run を模す (checkedFiles != totalFiles)。
    status["summary"]["checkedFiles"] = 1
    status["summary"]["totalFiles"] = 2
    _write_json(paths["status"], status)

    exit_code = baseline_main(["--slug=overview/intro"])

    assert exit_code == 1
    captured = capsys.readouterr()
    assert "not a full-repo run" in captured.err
    assert not paths["baseline"].exists()


# --- snapshot_diff smoke tests (priority 9/10 artifact producer) ---


def test_snapshot_diff_classify_changes_categorizes_lines() -> None:
    """``classify_changes`` が heading / image / code / callout / content を分類する。"""
    from testim_parity.detection.snapshot_diff import classify_changes

    head = "# Old Heading\n![alt](old.png)\nsome text\n"
    current = "# New Heading\n![alt](new.png)\nsome text\n```js\nconsole.log\n```\n"
    result = classify_changes(head, current)

    cats = result["categories"]
    # heading / image は追加分 + 削除分両方ある。
    assert cats["heading"]["added"] >= 1
    assert cats["heading"]["removed"] >= 1
    assert cats["image"]["added"] >= 1
    assert cats["image"]["removed"] >= 1
    # code block は追加のみ。
    assert cats["code"]["added"] >= 1
    # "some text" は両者共通なので diff に出ない。
    assert result["diffLines"] >= 4


def test_snapshot_diff_404_marker_detection() -> None:
    """MARKER_404_RE は 404 snapshot を先頭行で検出する。"""
    from testim_parity.detection.snapshot_diff import MARKER_404_RE

    assert MARKER_404_RE.match("<!-- 404: removed 2026-04-22 -->\n<html></html>")
    assert not MARKER_404_RE.match("<!DOCTYPE html>\n<html></html>")


def test_snapshot_diff_build_sidebar_url_map_extracts_slugs() -> None:
    """sidebar_url_map は Tricentis URL から slug を抽出して map を構築する。"""
    from testim_parity.detection.snapshot_diff import build_sidebar_url_map

    sidebar_text = (
        "## Overview\n"
        "- https://docs.tricentis.com/testim/content/overview/intro.htm\n"
        "- https://docs.tricentis.com/testim/content/overview/roadmap.htm\n"
    )
    url_map = build_sidebar_url_map(sidebar_text)
    assert "overview/intro" in url_map
    assert url_map["overview/intro"] == (
        "https://docs.tricentis.com/testim/content/overview/intro.htm"
    )


def test_snapshot_diff_fallback_source_url() -> None:
    """fallback_source_url は url_map にある slug だけを返す。"""
    from testim_parity.detection.snapshot_diff import fallback_source_url

    url_map = {"overview/intro": "https://example.com/intro.htm"}
    assert fallback_source_url("overview/intro", url_map) == "https://example.com/intro.htm"
    assert fallback_source_url("overview/missing", url_map) is None
    assert fallback_source_url("overview/intro", None) is None


def test_snapshot_diff_sidebar_guards_runtimeerror(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """``_diff_sidebar`` は ``_get_head_content`` の RuntimeError を catch する。

    Round 3 P3: MEDIUM-NEW-1 の wrap は sidebar path にも届いていなかった。
    guard 発火 / git 不在 / git show 予期外 exit のいずれで RuntimeError が
    出ても、sidebar 単体の parse error result に graceful degrade する。
    """
    import testim_parity.detection.snapshot_diff as mod

    # sidebar ファイルを作って ``_diff_sidebar`` を通す。
    sidebar_path = tmp_path / "sidebar.json"
    sidebar_path.write_text("{}", encoding="utf-8")
    monkeypatch.setattr(mod, "_SIDEBAR_PATH", sidebar_path)
    monkeypatch.setattr(mod, "ROOT_DIR", tmp_path)

    def _boom(_path: Path) -> str | None:
        raise RuntimeError("simulated git lookup failure")

    monkeypatch.setattr(mod, "_get_head_content", _boom)

    result = mod._diff_sidebar()
    assert result == {
        "changed": True,
        "addedPages": [],
        "removedPages": [],
        "parseError": True,
    }


# --- check_upstream_recovery smoke tests (priority 9/10 artifact producer) ---


def test_check_upstream_recovery_writes_status_with_empty_inputs(tmp_path: Path) -> None:
    """patches / exclusions が空でも artifact が schema どおりに書き出される。"""
    from testim_parity.detection.check_upstream_recovery import run_check_upstream_recovery

    output = tmp_path / "upstream-recovery-status.json"
    snapshots_root = tmp_path / "snapshots"
    snapshots_root.mkdir()

    # 2026-04-22T10:00:00Z ちょうどの epoch ms を Python から計算する
    # (magic number で書くと 1年ズレを見逃すため)。
    fixed_now_ms = int(datetime(2026, 4, 22, 10, 0, 0, tzinfo=UTC).timestamp() * 1000)

    stdout = io.StringIO()
    payload = run_check_upstream_recovery(
        output_path=output,
        stdout=stdout,
        now_ms=fixed_now_ms,
        snapshots_root=snapshots_root,
        patches=[],
        exclusions={},
        source_sync_status=None,
    )

    assert output.exists()
    on_disk = json.loads(output.read_text(encoding="utf-8"))
    assert on_disk == payload
    assert payload["schemaVersion"] == 1
    # 入力なしなので summary は全 0。
    assert payload["summary"] == {
        "totalEntries": 0,
        "activeEntries": 0,
        "staleEntries": 0,
        "overdueEntries": 0,
        "unknownEntries": 0,
    }
    # generatedAt は固定 now_ms から再現性がある。
    assert payload["generatedAt"] == "2026-04-22T10:00:00.000Z"
    # stdout に summary が出ている。
    assert "total=0" in stdout.getvalue()


def test_check_upstream_recovery_days_helpers_edge_cases() -> None:
    """``days_since`` / ``days_until`` / ``is_review_overdue`` の境界挙動。"""
    from testim_parity.detection.check_upstream_recovery import (
        days_since,
        days_until,
        is_review_overdue,
    )

    now_ms = int(datetime(2026, 4, 22, 10, 0, 0, tzinfo=UTC).timestamp() * 1000)
    past = "2026-04-15"  # 7 日前 (Z 00:00:00)
    future = "2026-04-29"  # 7 日後 (Z 00:00:00)

    assert days_since(past, now_ms=now_ms) == 7
    # ``days_until`` は floor division なので ``(future_ms - now_ms) // MS_PER_DAY``
    # → now が 10:00Z / future が 00:00Z なので 6.58 日差 → floor して 6。
    assert days_until(future, now_ms=now_ms) == 6
    # ``days_until`` も同じ floor。past は負方向で ``-7.42 日`` → floor して -8。
    assert days_until(past, now_ms=now_ms) == -8

    assert is_review_overdue(past, now_ms=now_ms) is True
    assert is_review_overdue(future, now_ms=now_ms) is False
    # 不正入力は常に False (non-blocking 契約)。
    assert is_review_overdue(None, now_ms=now_ms) is False
    assert days_since(None, now_ms=now_ms) == 0
    assert days_until("not-a-date", now_ms=now_ms) is None
