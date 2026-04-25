"""``scripts/lib/detection_reports.mjs`` の port (Phase 3 M7)。

3 つの detection 入力 (``snapshot-diff-status.json`` /
``parity-check-status.json`` / ``source-sync-status.json``) + optional な
``upstream-recovery-status.json`` を読み込み、4 つの issue family
(snapshotDiff / parityRegression / sourceSyncHealth / parityFollowup) に
集計する。markdown 本文生成 + audit manifest + source-side debt / upstream
recovery 可視化も含む。

mjs は 1 ファイル (1575 LOC) 構成のため、Python port も単一モジュールで
1:1 対応させる (800 LOC soft cap を意図的に超過)。split すると byte-parity
conformance の追跡 (mjs line N ↔ py line M) が崩れるため、単一ファイル維持を
優先する。将来 reviewer gate で split を要求される場合は
``detection_reports_render.py`` に markdown rendering helpers を寄せる。

mjs と byte-identical な出力契約 — 日本語本文 / JSON shape / エラー文言が
conformance harness で pin される。
"""

from __future__ import annotations

import datetime
import json
import re
import sys
from collections.abc import Callable, Mapping, Sequence
from pathlib import Path
from types import MappingProxyType
from typing import Any

from .issue_state import is_reportable_parity_issue
from .project import ROOT_DIR

__all__ = [
    "ACTIONABLE_REPORT_SCHEMA_VERSION",
    "FAMILY_KEYS",
    "PARITY_FOLLOWUP_ISSUE_TITLE",
    "PARITY_ISSUE_TITLE",
    "SNAPSHOT_ISSUE_TITLE",
    "SOURCE_SYNC_ISSUE_TITLE",
    "UPSTREAM_RECOVERY_STICKY_MARKER",
    "assign_review_groups",
    "build_actionable_report",
    "build_audit_manifest",
    "classify_snapshot_bucket",
    "load_detection_inputs",
    "render_summary_markdown",
    "render_upstream_recovery_sticky_comment",
    "validate_actionable_report",
    "validate_detection_inputs",
    "validate_parity_check_status",
    "validate_snapshot_diff_status",
    "validate_source_sync_status",
]


# ---------------------------------------------------------------------------
# Constants (mjs と byte 一致)
# ---------------------------------------------------------------------------

ACTIONABLE_REPORT_SCHEMA_VERSION: int = 1

SNAPSHOT_ISSUE_TITLE: str = "📸 コンテンツ差分: スナップショットで英語原文の変更を検知"
PARITY_ISSUE_TITLE: str = "🔍 パリティ後退: コンテンツの差分を検知"
SOURCE_SYNC_ISSUE_TITLE: str = "⚠️ ソース同期: 取得の劣化またはソース原文の既知問題を検知"
PARITY_FOLLOWUP_ISSUE_TITLE: str = "🗂️ パリティフォローアップ: ベースライン負債とアドバイザリキュー"


# HTML body comment と ``sync-detection-issues.cjs`` で共有する family key。
FAMILY_KEYS: Mapping[str, str] = MappingProxyType(
    {
        "SNAPSHOT_DIFF": "snapshot-diff",
        "PARITY_REGRESSION": "parity-regression",
        "SOURCE_SYNC_HEALTH": "source-sync-health",
        "PARITY_FOLLOWUP": "parity-followup",
    }
)


# mjs ``DOCS_PREFIX = path.join('src', 'content', 'docs') + path.sep``。
# Windows 上でも ``path.sep`` は ``/`` にならないため、Python 側は
# ``os.sep`` を使うと CI (Linux) と local (macOS) で値が同じになる。
# Python 側の consumer は POSIX path を前提にしているので ``/`` 固定で良い。
_DOCS_PREFIX: str = "src/content/docs/"


UPSTREAM_RECOVERY_STICKY_MARKER: str = "<!-- upstream-recovery: sticky -->"


# ---------------------------------------------------------------------------
# JSON I/O + schema validators
# ---------------------------------------------------------------------------


def _read_json(file_path: str | Path) -> Any:
    """mjs ``readJson`` と等価。ファイル不在 / 破損時は warn + ``{}`` で継続。

    ``loadDetectionInputs`` で ``strict`` モードが true の場合は後段の
    ``validate_detection_inputs`` で再検証する。ここでは raw ``SyntaxError``
    を表に出さず、pipeline を落とさない (CI や PR run の graceful degradation)。
    """
    path = Path(file_path)
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as err:
        # mjs は ``console.warn`` で stderr に書くので Python も sys.stderr へ。
        print(
            f"[detection_reports] failed to parse {file_path}: {err}. "
            "Treating as empty artifact (non-blocking).",
            file=sys.stderr,
        )
        return {}


def _typeof_js(value: Any) -> str:
    """mjs ``typeof value`` 相当。None→``object`` ではなく ``null`` を返す。"""
    if value is None:
        return "object"  # mjs と同じで object だが expectObject 側で null 検出
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, (int, float)):
        return "number"
    if isinstance(value, str):
        return "string"
    return "object"


def _expect_object(value: Any, label: str) -> None:
    """非 dict / None / list を rejection する (mjs ``expectObject`` 等価)。"""
    if value is None or not isinstance(value, dict) or isinstance(value, list):
        got = "null" if value is None else _typeof_js(value)
        raise ValueError(f"{label}: expected JSON object, got {got}")


def _js_json_stringify(value: Any) -> str:
    """mjs ``JSON.stringify(value)`` に byte 一致するダンプ。

    - ``undefined``: 出力できず ``undefined``。Python 側は ``None`` を null に
      変換するので、mjs ``JSON.stringify(undefined)`` (= ``undefined`` 文字列) と
      互換性を取るために特殊 case ``None → "undefined"`` を避ける。本 port では
      conformance harness 越しに渡ってくる値は JSON 化済みなので、undefined が
      発生する場所は存在しない。
    - dict / list の内部順序は Python 側 dict の挿入順に従う (mjs も同様)。
    - non-ASCII は ASCII escape せず生で出す (mjs default)。
    """
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def validate_snapshot_diff_status(parsed: Any) -> Any:
    """``snapshot-diff-status.json`` を validate (mjs 等価)。"""
    _expect_object(parsed, "snapshot-diff-status.json")
    if parsed.get("schemaVersion") != 1:
        raise ValueError(
            f"snapshot-diff-status.json: unsupported schemaVersion "
            f"{_js_json_stringify(parsed.get('schemaVersion'))} (expected 1)"
        )
    if not isinstance(parsed.get("checkedAt"), str):
        raise ValueError('snapshot-diff-status.json: missing string "checkedAt"')
    if not isinstance(parsed.get("runId"), str):
        raise ValueError("snapshot-diff-status.json: runId must be a string")
    source_sync_run_id = parsed.get("sourceSyncRunId")
    if source_sync_run_id is not None and not isinstance(source_sync_run_id, str):
        raise ValueError("snapshot-diff-status.json: sourceSyncRunId must be string|null")
    summary = parsed.get("summary")
    if not summary or not isinstance(summary, dict):
        raise ValueError('snapshot-diff-status.json: missing "summary" object')
    if not isinstance(parsed.get("changes"), list):
        raise ValueError('snapshot-diff-status.json: "changes" must be an array')
    run_scope = parsed.get("runScope")
    if not run_scope or not isinstance(run_scope, dict):
        raise ValueError('snapshot-diff-status.json: missing "runScope" object')
    if not isinstance(run_scope.get("isComplete"), bool):
        raise ValueError("snapshot-diff-status.json: runScope.isComplete must be boolean")
    return parsed


def validate_parity_check_status(parsed: Any) -> Any:
    """``parity-check-status.json`` を validate (mjs 等価)。"""
    _expect_object(parsed, "parity-check-status.json")
    if parsed.get("schemaVersion") != 1:
        raise ValueError(
            f"parity-check-status.json: unsupported schemaVersion "
            f"{_js_json_stringify(parsed.get('schemaVersion'))} (expected 1)"
        )
    summary = parsed.get("summary")
    if not summary or not isinstance(summary, dict):
        raise ValueError('parity-check-status.json: missing "summary" object')
    if not isinstance(summary.get("checkedAt"), str):
        raise ValueError("parity-check-status.json: summary.checkedAt must be a string")
    if not isinstance(parsed.get("files"), list):
        raise ValueError('parity-check-status.json: "files" must be an array')
    run_scope = summary.get("runScope")
    if not run_scope or not isinstance(run_scope, dict):
        raise ValueError("parity-check-status.json: summary.runScope is required")
    if not isinstance(run_scope.get("isComplete"), bool):
        raise ValueError("parity-check-status.json: summary.runScope.isComplete must be boolean")
    result = summary.get("result")
    if result not in ("pass", "fail", "inconclusive"):
        raise ValueError(
            f"parity-check-status.json: summary.result must be one of "
            f"pass|fail|inconclusive, got {_js_json_stringify(result)}"
        )
    return parsed


_VALID_DEBT_FETCH_STATUSES: frozenset[str] = frozenset(
    {"excluded-broken", "excluded-recovered", "excluded-fetch-error"}
)


def validate_source_sync_status(parsed: Any) -> Any:
    """``source-sync-status.json`` を validate (mjs 等価)。

    schema v1 / v2 両方に対応。v2 以降は ``excludedPages`` counter と debt page
    の ``recoveryProbe`` shape を要求する。
    """
    _expect_object(parsed, "source-sync-status.json")
    version = parsed.get("schemaVersion")
    if version != 1 and version != 2:
        raise ValueError(
            f"source-sync-status.json: unsupported schemaVersion "
            f"{_js_json_stringify(version)} (expected 1 or 2)"
        )
    if not isinstance(parsed.get("runId"), str):
        raise ValueError("source-sync-status.json: runId must be a string")
    if not isinstance(parsed.get("checkedAt"), str):
        raise ValueError("source-sync-status.json: checkedAt must be a string")
    if parsed.get("freshnessState") not in ("fresh", "partial", "broken", "stale"):
        raise ValueError(
            f"source-sync-status.json: freshnessState must be one of "
            f"fresh|partial|broken|stale, got "
            f"{_js_json_stringify(parsed.get('freshnessState'))}"
        )
    if not isinstance(parsed.get("sourceInventoryFingerprint"), str):
        raise ValueError("source-sync-status.json: sourceInventoryFingerprint must be a string")
    if not isinstance(parsed.get("sidebarFingerprint"), str):
        raise ValueError("source-sync-status.json: sidebarFingerprint must be a string")
    run_scope = parsed.get("runScope")
    if not run_scope or not isinstance(run_scope, dict):
        raise ValueError("source-sync-status.json: runScope is required")
    if not isinstance(run_scope.get("isComplete"), bool):
        raise ValueError("source-sync-status.json: runScope.isComplete must be boolean")
    summary = parsed.get("summary")
    if not summary or not isinstance(summary, dict):
        raise ValueError("source-sync-status.json: summary is required")
    if not isinstance(summary.get("sidebarVerified"), bool):
        raise ValueError("source-sync-status.json: summary.sidebarVerified must be boolean")
    # v2+ で excluded counter 必須
    if version >= 2:
        if not isinstance(summary.get("excludedPages"), (int, float)) or isinstance(
            summary.get("excludedPages"), bool
        ):
            raise ValueError("source-sync-status.json: summary.excludedPages must be a number")
        if not isinstance(summary.get("excludedBrokenPages"), (int, float)) or isinstance(
            summary.get("excludedBrokenPages"), bool
        ):
            raise ValueError(
                "source-sync-status.json: summary.excludedBrokenPages must be a number"
            )
        if not isinstance(summary.get("excludedRecoveredPages"), (int, float)) or isinstance(
            summary.get("excludedRecoveredPages"), bool
        ):
            raise ValueError(
                "source-sync-status.json: summary.excludedRecoveredPages must be a number"
            )
    pages = parsed.get("pages")
    if not isinstance(pages, list):
        raise ValueError("source-sync-status.json: pages must be an array")
    # debt page shape 検証は v2+ のみ
    if version >= 2:
        for page in pages:
            is_excluded_debt = page.get("fetchStatus") in _VALID_DEBT_FETCH_STATUSES
            if is_excluded_debt:
                slug = page.get("slug")
                if page.get("debtCategory") != "source-side-debt":
                    raise ValueError(
                        f'source-sync-status.json: excluded page "{slug}" must have '
                        f'debtCategory "source-side-debt", got '
                        f"{_js_json_stringify(page.get('debtCategory'))}"
                    )
                if "recoveryProbe" not in page:
                    raise ValueError(
                        f'source-sync-status.json: excluded page "{slug}" must have '
                        "recoveryProbe "
                        "(object for excluded-broken, null for excluded-recovered)"
                    )
                probe = page["recoveryProbe"]
                fetch_status = page.get("fetchStatus")
                if fetch_status == "excluded-broken":
                    if probe is None or not isinstance(probe, dict) or isinstance(probe, list):
                        raise ValueError(
                            f'source-sync-status.json: excluded page "{slug}" '
                            "recoveryProbe must be an object for excluded-broken"
                        )
                    if not isinstance(probe.get("issueType"), str):
                        raise ValueError(
                            f'source-sync-status.json: excluded page "{slug}" '
                            "recoveryProbe.issueType must be a string"
                        )
                    if not isinstance(probe.get("reason"), str):
                        raise ValueError(
                            f'source-sync-status.json: excluded page "{slug}" '
                            "recoveryProbe.reason must be a string"
                        )
                    if not isinstance(probe.get("expectedIssueType"), str):
                        raise ValueError(
                            f'source-sync-status.json: excluded page "{slug}" '
                            "recoveryProbe.expectedIssueType must be a string"
                        )
                    if not isinstance(probe.get("expectedReason"), str):
                        raise ValueError(
                            f'source-sync-status.json: excluded page "{slug}" '
                            "recoveryProbe.expectedReason must be a string"
                        )
                    if not isinstance(probe.get("expectedMatch"), bool):
                        raise ValueError(
                            f'source-sync-status.json: excluded page "{slug}" '
                            "recoveryProbe.expectedMatch must be a boolean"
                        )
                if fetch_status == "excluded-recovered" and probe is not None:
                    raise ValueError(
                        f'source-sync-status.json: excluded page "{slug}" '
                        "recoveryProbe must be null for excluded-recovered"
                    )
                if fetch_status == "excluded-fetch-error":
                    if probe is not None:
                        raise ValueError(
                            f'source-sync-status.json: excluded page "{slug}" '
                            "recoveryProbe must be null for excluded-fetch-error"
                        )
                    if not isinstance(page.get("errorDetail"), str):
                        raise ValueError(
                            f'source-sync-status.json: excluded page "{slug}" must '
                            "have errorDetail string for excluded-fetch-error"
                        )
                continue

            if "debtCategory" in page and page.get("debtCategory") is not None:
                raise ValueError(
                    f"source-sync-status.json: non-excluded page "
                    f'"{page.get("slug")}" must not have debtCategory'
                )
            if "recoveryProbe" in page:
                raise ValueError(
                    f"source-sync-status.json: non-excluded page "
                    f'"{page.get("slug")}" must not have recoveryProbe'
                )
    if version >= 2:
        excluded_broken_pages = sum(1 for p in pages if p.get("fetchStatus") == "excluded-broken")
        excluded_recovered_pages = sum(
            1 for p in pages if p.get("fetchStatus") == "excluded-recovered"
        )
        excluded_pages_total = excluded_broken_pages + excluded_recovered_pages
        if summary.get("excludedPages") != excluded_pages_total:
            raise ValueError(
                f"source-sync-status.json: summary.excludedPages must equal pages[] "
                f"excluded count ({excluded_pages_total}), got "
                f"{summary.get('excludedPages')}"
            )
        if summary.get("excludedBrokenPages") != excluded_broken_pages:
            raise ValueError(
                f"source-sync-status.json: summary.excludedBrokenPages must equal "
                f"pages[] excluded-broken count ({excluded_broken_pages}), got "
                f"{summary.get('excludedBrokenPages')}"
            )
        if summary.get("excludedRecoveredPages") != excluded_recovered_pages:
            raise ValueError(
                f"source-sync-status.json: summary.excludedRecoveredPages must equal "
                f"pages[] excluded-recovered count ({excluded_recovered_pages}), "
                f"got {summary.get('excludedRecoveredPages')}"
            )
    if not isinstance(parsed.get("errors"), list):
        raise ValueError("source-sync-status.json: errors must be an array")
    return parsed


def validate_actionable_report(parsed: Any) -> Any:
    """``docs-actionable-report.json`` を validate (mjs 等価)。"""
    _expect_object(parsed, "docs-actionable-report.json")
    if parsed.get("schemaVersion") != ACTIONABLE_REPORT_SCHEMA_VERSION:
        raise ValueError(
            f"docs-actionable-report.json: unsupported schemaVersion "
            f"{_js_json_stringify(parsed.get('schemaVersion'))} "
            f"(expected {ACTIONABLE_REPORT_SCHEMA_VERSION})"
        )
    for family in ("snapshotDiff", "parityRegression", "sourceSyncHealth", "parityFollowup"):
        value = parsed.get(family)
        if not value or not isinstance(value, dict):
            raise ValueError(f'docs-actionable-report.json: missing "{family}" family')
        if not isinstance(value.get("shouldOpenIssue"), bool):
            raise ValueError(
                f"docs-actionable-report.json: {family}.shouldOpenIssue must be boolean"
            )
    return parsed


def validate_detection_inputs(
    inputs: Mapping[str, Any],
) -> dict[str, Any]:
    """3 検出入力の aggregate validation (mjs ``validateDetectionInputs`` 等価)。

    入力: ``{"snapshot": ..., "parity": ..., "sourceSync": ...}``。
    1 つでも不正なら ``{"ok": False, "errors": [...]}``。エラー発生でも他の
    input も検証する (exit early せず一括で列挙する)。``upstreamRecovery`` は
    optional artifact で schema 検証対象外。
    """
    errors: list[str] = []

    def try_validate(label: str, runner: Callable[[], None]) -> None:
        try:
            runner()
        except Exception as e:
            errors.append(f"{label}: {e}")

    try_validate("snapshot", lambda: validate_snapshot_diff_status(inputs.get("snapshot")))
    try_validate("parity", lambda: validate_parity_check_status(inputs.get("parity")))
    source_sync = inputs.get("sourceSync")
    if source_sync and isinstance(source_sync, dict) and len(source_sync) > 0:
        try_validate("sourceSync", lambda: validate_source_sync_status(source_sync))
    return {"ok": True} if not errors else {"ok": False, "errors": errors}


# ---------------------------------------------------------------------------
# Decision helpers
# ---------------------------------------------------------------------------


def _file_to_slug(file_path: Any) -> str | None:
    """``src/content/docs/<slug>.md`` から slug を derive (mjs ``fileToSlug`` 等価)。"""
    if not isinstance(file_path, str) or len(file_path) == 0:
        return None
    if file_path.startswith(_DOCS_PREFIX):
        return re.sub(r"\.md$", "", file_path[len(_DOCS_PREFIX) :])
    # fallback: basename of path
    base = file_path.rsplit("/", 1)[-1]
    return re.sub(r"\.md$", "", base)


def _format_list(values: Sequence[str]) -> str:
    """markdown bullet list を組み立てる (mjs ``formatList`` 等価)。"""
    if not values:
        return "- なし"
    return "\n".join(f"- {v}" for v in values)


def _partition_source_side_debt_pages(pages: Any) -> dict[str, list[dict[str, Any]]]:
    """debt page を fetchStatus 別に分離 (mjs 等価)。"""
    safe_pages = pages if isinstance(pages, list) else []
    return {
        "brokenPages": [p for p in safe_pages if p.get("fetchStatus") == "excluded-broken"],
        "recoveredPages": [p for p in safe_pages if p.get("fetchStatus") == "excluded-recovered"],
        "fetchErrorPages": [
            p for p in safe_pages if p.get("fetchStatus") == "excluded-fetch-error"
        ],
    }


def _build_source_side_debt_summary(source_sync: Any) -> dict[str, Any]:
    """``source-sync-status.json`` から debt 要約を作る (mjs 等価)。"""
    pages = (source_sync or {}).get("pages", [])
    parts = _partition_source_side_debt_pages(pages)
    broken_pages = parts["brokenPages"]
    recovered_pages = parts["recoveredPages"]
    fetch_error_pages = parts["fetchErrorPages"]

    return {
        "excludedPages": len(broken_pages) + len(recovered_pages),
        "excludedBrokenPages": len(broken_pages),
        "excludedRecoveredPages": len(recovered_pages),
        "fetchErrorSlugs": sorted(p.get("slug", "") for p in fetch_error_pages),
        "fetchErrorDetails": sorted(
            (
                {
                    "slug": p.get("slug", ""),
                    "errorDetail": p.get("errorDetail") or "unknown",
                }
                for p in fetch_error_pages
            ),
            key=lambda d: d["slug"],
        ),
        "brokenSlugs": sorted(p.get("slug", "") for p in broken_pages),
        "recoveredSlugs": sorted(p.get("slug", "") for p in recovered_pages),
        "brokenDetails": sorted(
            (
                {
                    "slug": p.get("slug", ""),
                    "actualIssueType": (p.get("recoveryProbe") or {}).get("issueType"),
                    "actualReason": (p.get("recoveryProbe") or {}).get("reason"),
                    "expectedIssueType": (p.get("recoveryProbe") or {}).get("expectedIssueType"),
                    "expectedReason": (p.get("recoveryProbe") or {}).get("expectedReason"),
                    "expectedMatch": (p.get("recoveryProbe") or {}).get("expectedMatch"),
                }
                for p in broken_pages
            ),
            key=lambda d: d["slug"],
        ),
    }


def _render_source_side_debt_subsection(debt: Mapping[str, Any], _pages: Any) -> list[str]:
    """``## ソース原文の既知問題`` markdown セクションを生成 (mjs 等価)。"""
    lines = [
        "## ソース原文の既知問題",
        "",
        f"- 除外ページ: {debt['excludedPages']}",
        f"- 未復旧: {debt['excludedBrokenPages']}",
        f"- 復旧候補: {debt['excludedRecoveredPages']}",
        "",
        "英語原文が壊れておりパリティ比較の前提を満たさないページです。",
        "`scripts/python/src/testim_parity/sync_exclusions.py` の除外レジストリで管理され、",
        "スナップショット取得は実行するがファイルは上書きせず、手動作成した",
        "スナップショットを凍結参照として保持します。",
        "",
    ]

    if debt["excludedBrokenPages"] > 0:
        lines.extend(["### 未復旧", ""])
        for entry in debt["brokenDetails"]:
            actual_it = entry.get("actualIssueType")
            actual_r = entry.get("actualReason")
            if actual_it and actual_r:
                actual = f"{actual_it} / {actual_r}"
            else:
                actual = actual_it or actual_r or "判定なし"
            expected_it = entry.get("expectedIssueType")
            expected_r = entry.get("expectedReason")
            expected = f"{expected_it} / {expected_r}" if expected_it and expected_r else "不明"
            expected_match = entry.get("expectedMatch")
            if expected_match is True:
                match_label = "想定どおり"
            elif expected_match is False:
                match_label = "想定と不一致"
            else:
                match_label = "不明"
            lines.append(f"- `{entry['slug']}`")
            lines.append(f"  - 実際: {actual}")
            lines.append(f"  - 期待: {expected}")
            lines.append(f"  - 期待一致: {match_label}")
        lines.append("")

    fetch_error_slugs = debt.get("fetchErrorSlugs") or []
    if fetch_error_slugs:
        lines.extend(["### 観測失敗", ""])
        lines.extend(
            [
                "fetch に失敗したため live EN の状態を観測できませんでした。",
                "source-sync の劣化として errors に計上されています。",
                "",
            ]
        )
        for entry in debt["fetchErrorDetails"]:
            lines.append(f"- `{entry['slug']}`")
            lines.append(f"  - エラー: {entry['errorDetail']}")
        lines.append("")

    if debt["excludedRecoveredPages"] > 0:
        lines.extend(["### 復旧候補", ""])
        lines.extend(
            [
                "英語原文が復旧した可能性があります。人間が確認の上、",
                "`scripts/python/src/testim_parity/sync_exclusions.py` "
                "から該当 slug を除外解除してください。",
                "(自動解除はしません — 一時的な原文側の揺れで誤検知を作らないため)",
                "",
            ]
        )
        for slug in debt["recoveredSlugs"]:
            lines.append(f"- `{slug}`")
            lines.append("  - 状態: excluded-recovered")
            lines.append("  - 対応: 除外レジストリからの削除を検討")
        lines.append("")

    return lines


def _bucket_priority(bucket: str) -> int:
    """review group assignment で使う priority (mjs 等価)。"""
    if bucket == "page-lifecycle":
        return 0
    if bucket == "structural-change":
        return 1
    return 2  # content-only


def classify_snapshot_bucket(change: Mapping[str, Any]) -> str:
    """snapshot change を 3 bucket に分類 (mjs 等価)。

    bucket: ``page-lifecycle`` / ``structural-change`` / ``content-only``
    """
    type_ = change.get("type")
    if type_ == "page-added" or type_ == "page-removed":
        return "page-lifecycle"
    categories = change.get("categories")
    if categories and any(
        ((categories.get(cat) or {}).get("added") or 0)
        + ((categories.get(cat) or {}).get("removed") or 0)
        > 0
        for cat in ("heading", "image", "code", "callout")
    ):
        return "structural-change"
    return "content-only"


def assign_review_groups(
    entries: Sequence[Mapping[str, Any]], group_count: int = 6
) -> list[dict[str, Any]]:
    """entries を review group に round-robin (mjs 等価)。

    sorted order: bucket priority 昇順 → slug 昇順。各 entry は最も count が
    小さい group に assign される (greedy load balancing)。
    """
    groups: list[dict[str, Any]] = [
        {"name": f"review-group-{i + 1}", "count": 0} for i in range(group_count)
    ]
    # bucket priority → slug の 2 段階 sort (stable)。mjs ``Array.sort`` は v12+ stable。
    sorted_entries = sorted(
        entries,
        key=lambda e: (_bucket_priority(e.get("bucket", "")), e.get("slug") or ""),
    )
    result: list[dict[str, Any]] = []
    for entry in sorted_entries:
        # 最小 count の group を選ぶ。count が同じなら index 順 (stable)。
        groups.sort(key=lambda g: int(g["count"]))
        selected = groups[0]
        selected["count"] = int(selected["count"]) + 1
        result.append({**entry, "reviewGroup": selected["name"]})
    return result


def build_audit_manifest(
    snapshot: Mapping[str, Any],
    parity: Mapping[str, Any],
    *,
    group_count: int = 6,
) -> list[dict[str, Any]]:
    """snapshot + parity から audit manifest を組み立てる (mjs 等価)。

    各 snapshot change に対して、対応する parity issue を signals として埋め込み、
    bucket 分類 + review group assignment を行う。
    """
    changes = snapshot.get("changes") or []

    parity_by_slug: dict[str | None, list[Any]] = {}
    for file in parity.get("files") or []:
        slug = _file_to_slug(file.get("file"))
        parity_by_slug[slug] = file.get("issues") or []

    entries = []
    for change in changes:
        signals_raw = parity_by_slug.get(change.get("slug")) or []
        bucket = classify_snapshot_bucket(change)
        entries.append(
            {
                "slug": change.get("slug"),
                "type": change.get("type"),
                "sourceUrl": change.get("sourceUrl"),
                "diffLines": change.get("diffLines"),
                "categories": change.get("categories"),
                "signals": [
                    {
                        "type": s.get("type"),
                        "severity": s.get("severity"),
                        "detail": s.get("detail") or s.get("text") or "",
                    }
                    for s in signals_raw
                ],
                "bucket": bucket,
                "verificationStatus": "needs-human-review",
                "reviewer": "",
                "notes": "",
            }
        )

    return assign_review_groups(entries, group_count)


def _sort_snapshot_entries(
    entries: Sequence[Mapping[str, Any]],
) -> list[Mapping[str, Any]]:
    """snapshot entries を type → diffLines 降順に sort (mjs 等価)。"""
    type_order = {"page-added": 0, "page-removed": 1, "page-changed": 2}
    return sorted(
        entries,
        key=lambda e: (type_order.get(e.get("type", ""), 2), -(e.get("diffLines") or 0)),
    )


def _with_family_marker(body: str, key: str) -> str:
    """family marker comment を先頭に付与 (mjs 等価)。"""
    if not body:
        return ""
    return f"<!-- detection-family: {key} -->\n{body}"


def _score_parity_entry(entry: Mapping[str, Any]) -> int:
    """parity entry の sort priority (mjs ``scoreParityEntry`` 等価)。

    image-mismatch / codeblock-mismatch は +3、actionable severity は +2、他は 0。
    reportable 判定に通らない issue は加算しない。
    """
    score = 0
    for issue in entry.get("issues") or []:
        if not is_reportable_parity_issue(issue):
            continue
        issue_type = issue.get("type")
        if issue_type in ("image-mismatch", "codeblock-mismatch"):
            score += 3
        elif issue.get("severity") == "actionable":
            score += 2
    return score


def _sort_parity_entries(
    entries: Sequence[Mapping[str, Any]],
) -> list[Mapping[str, Any]]:
    """parity entries を score 降順 → file 昇順 (mjs 等価)。"""
    return sorted(entries, key=lambda e: (-_score_parity_entry(e), e.get("file") or ""))


def _build_parity_entries(
    files: Sequence[Mapping[str, Any]],
    issue_filter: Callable[[Mapping[str, Any]], bool],
) -> list[dict[str, Any]]:
    """files を filter して issue 0 件の file を除外 (mjs 等価)。"""
    result = []
    for file in files:
        filtered = [i for i in (file.get("issues") or []) if issue_filter(i)]
        if filtered:
            result.append({**file, "issues": filtered})
    return result


def _summarize_issue_entries(
    entries: Sequence[Mapping[str, Any]],
) -> dict[str, dict[str, int]]:
    """entries を issueType / severity 別に集計 (mjs 等価)。"""
    issues_by_type: dict[str, int] = {}
    issues_by_severity: dict[str, int] = {}
    for entry in entries:
        for issue in entry.get("issues") or []:
            t = issue.get("type")
            s = issue.get("severity")
            if t is not None:
                issues_by_type[t] = issues_by_type.get(t, 0) + 1
            if s is not None:
                issues_by_severity[s] = issues_by_severity.get(s, 0) + 1
    return {"issuesByType": issues_by_type, "issuesBySeverity": issues_by_severity}


def _format_snapshot_entry(entry: Mapping[str, Any]) -> str:
    """snapshot entry の 1 行表示 (mjs 等価)。"""
    type_ = entry.get("type")
    slug = entry.get("slug", "")
    if type_ == "page-added":
        return f"`{slug}` — NEW PAGE"
    if type_ == "page-removed":
        return f"`{slug}` — REMOVED"
    categories = entry.get("categories") or {}
    cat_parts = [
        f"{k}:+{v.get('added', 0)}/-{v.get('removed', 0)}"
        for k, v in categories.items()
        if (v.get("added", 0) > 0 or v.get("removed", 0) > 0)
    ]
    return f"`{slug}` ({entry.get('diffLines')} lines: {', '.join(cat_parts)})"


def _build_top_baselined_pages(
    files: Sequence[Mapping[str, Any]], max_entries: int
) -> list[dict[str, Any]]:
    """baselined issue を多く持つ top N 件 (mjs 等価)。"""
    entries = []
    for file in files:
        baselined_issues = [i for i in (file.get("issues") or []) if i.get("baselined") is True]
        if not baselined_issues:
            continue
        entries.append(
            {
                "file": file.get("file"),
                "slug": _file_to_slug(file.get("file")),
                "issueCount": len(baselined_issues),
            }
        )

    def _sort_key(e: dict[str, Any]) -> tuple[int, str]:
        count = e.get("issueCount")
        neg_count = -count if isinstance(count, int) else 0
        file = e.get("file")
        return (neg_count, file if isinstance(file, str) else "")

    entries.sort(key=_sort_key)
    return entries[:max_entries]


def _build_tokenless_near_tie_examples(
    advisory_queue: Sequence[Mapping[str, Any]], max_entries: int
) -> list[dict[str, Any]]:
    """advisory queue から tokenless-near-tie の例を抽出 (mjs 等価)。"""
    result = []
    for entry in advisory_queue:
        example = next(
            (
                i
                for i in (entry.get("issues") or [])
                if i.get("inconclusiveCategory") == "tokenless-near-tie"
            ),
            None,
        )
        if not example:
            continue
        result.append(
            {
                "slug": entry.get("slug") or _file_to_slug(entry.get("file")),
                "file": entry.get("file"),
                "queueKey": example.get("queueKey"),
                "blocking": entry.get("blocking") is True,
                "detail": example.get("detail") or "",
                "leftSectionPath": example.get("leftSectionPath"),
                "rightSectionPath": example.get("rightSectionPath"),
                "currentScore": example.get("currentScore"),
                "swapScore": example.get("swapScore"),
            }
        )
    return result[:max_entries]


def _format_advisory_queue_scope(scope: Any) -> str:
    """advisory queue の scope を人間可読文言に変換 (mjs 等価)。"""
    if not scope or not isinstance(scope, dict):
        return "スコープ不明"
    if scope.get("isComplete") is True:
        return "リポジトリ全体"

    filters = scope.get("filters") or {}
    slug = filters.get("slug")
    if scope.get("type") == "slug" and slug:
        return f"部分スコープ: slug={slug}、リポジトリ全体ではない"

    section = filters.get("section")
    if scope.get("type") == "section" and section:
        return f"部分スコープ: section={section}、リポジトリ全体ではない"

    return "部分スコープ、リポジトリ全体ではない"


def _build_parity_followup_body(
    *,
    summary: Mapping[str, Any],
    baseline_invalidated_slugs: Sequence[str],
    blocking_advisory_items: Sequence[Mapping[str, Any]],
    advisory_queue_issues: int,
    advisory_queue_files: int,
    advisory_queue_scope: Any,
    include_advisory_in_body: bool,
    source_unusable: Mapping[str, Any],
    baselined_issues: int = 0,
    baselined_files: int = 0,
    baselined_by_type: Mapping[str, int] | None = None,
    top_baselined_pages: Sequence[Mapping[str, Any]] = (),
) -> str:
    """parityFollowup issue 本文を組み立てる (mjs 等価)。"""
    baselined_by_type = baselined_by_type or {}
    lines = [
        "## サマリー",
        "",
        f"- チェック日時: {summary.get('checkedAt') or '不明'}",
        (
            f"- ベースライン済み: {summary.get('baselinedIssues') or 0} 件 "
            f"({summary.get('baselinedFiles') or 0} ファイル)"
        ),
        f"- 無効化されたベースライン slug: {len(baseline_invalidated_slugs)}",
        "",
    ]

    if include_advisory_in_body:
        lines.extend(
            [
                f"- アドバイザリキュー: {advisory_queue_issues} 件 ({advisory_queue_files} ファイル)",  # noqa: E501
                f"  - スコープ: {_format_advisory_queue_scope(advisory_queue_scope)}",
                f"  - ブロッキング: {len(blocking_advisory_items)}",
                "",
            ]
        )

    if baselined_issues > 0:
        sorted_types = sorted(baselined_by_type.keys())
        lines.extend(
            [
                "## ベースライン残債",
                "",
                f"- 合計: {baselined_issues} 件 ({baselined_files} ファイル)",
                "- EN 原文との既知の構造差分です。翻訳を修正して解消してください。",
            ]
        )
        if sorted_types:
            lines.append("- 種別別:")
            for t in sorted_types:
                lines.append(f"  - {t}: {baselined_by_type[t]}")
        if top_baselined_pages:
            lines.extend(["", "### 上位ファイル", ""])
            lines.append(
                _format_list([f"`{p['file']}` ({p['issueCount']} 件)" for p in top_baselined_pages])
            )
        lines.append("")

    # source-unusable は informational のみで gate には入れない
    if source_unusable and source_unusable.get("snapshotUnusableIssues", 0) > 0:
        lines.extend(
            [
                "## ソース使用不可 (参考)",
                "",
                (
                    f"- 合計: {source_unusable['snapshotUnusableIssues']} 件 "
                    f"({source_unusable['snapshotUnusableFiles']} ファイル)"
                ),
                "- 翻訳の問題ではなくスナップショット / ソース同期側の既知問題です。翻訳 PR では修正できません。",  # noqa: E501
            ]
        )
        sorted_types = sorted((source_unusable.get("snapshotUnusableByType") or {}).keys())
        if sorted_types:
            lines.append("- 種別別:")
            for t in sorted_types:
                lines.append(f"  - {t}: {source_unusable['snapshotUnusableByType'][t]}")
        lines.append("")

    orphan_baseline_entries = summary.get("orphanBaselineEntries") or 0
    if orphan_baseline_entries > 0:
        lines.extend(
            [
                "## 🧹 孤立したベースラインエントリー",
                "",
                f"- 合計: {orphan_baseline_entries} 件 (実行時に一致する問題が無い — 掃除対象)",
            ]
        )
        by_type = summary.get("orphanBaselineByType") or {}
        sorted_types = sorted(by_type.keys())
        if sorted_types:
            lines.append("- 種別別:")
            for t in sorted_types:
                lines.append(f"  - {t}: {by_type[t]}")
        lines.extend(
            [
                "",
                "対応: `uv run python -m testim_parity.detection.generate_parity_baseline "
                "--slug=<slug>` で該当 slug を再生成すると孤立エントリーが削除されます。",
                "",
            ]
        )

    if baseline_invalidated_slugs:
        lines.extend(["## 無効化されたベースライン slug", ""])
        lines.append(
            _format_list(
                [f"`{s}` — 英語スナップショットが変更された" for s in baseline_invalidated_slugs]
            )
        )
        lines.append("")

    if blocking_advisory_items:
        lines.extend(["## アドバイザリキュー — ブロッキング項目", ""])

        def _fmt_blocking(e: Mapping[str, Any]) -> str:
            top_issue = (e.get("issues") or [{}])[0] if e.get("issues") else {}
            cat = top_issue.get("inconclusiveCategory") or "不明"
            return f"`{e.get('slug')}` — {cat} ({e.get('issueCount')} 件)"

        lines.append(_format_list([_fmt_blocking(e) for e in blocking_advisory_items]))
        lines.append("")

    lines.extend(["## アーティファクト", "", "- `parity-check-status.json`"])

    return "\n".join(lines)


def _build_parity_followup(
    parity: Mapping[str, Any], options: Mapping[str, Any] | None = None
) -> dict[str, Any]:
    """parityFollowup family payload を組み立てる (mjs 等価)。"""
    options = options or {}
    max_entries = options.get("maxEntries", 10)
    summary = parity.get("summary") or {}
    files = parity.get("files") or []
    advisory_queue = parity.get("advisoryQueue") or []
    advisory_queue_scope = parity.get("advisoryQueueScope")

    baseline_invalidated_slugs = summary.get("baselineInvalidatedSlugs") or []
    advisory_queue_issues = summary.get("advisoryQueueIssues") or 0
    advisory_queue_files = summary.get("advisoryQueueFiles") or 0
    is_complete = (advisory_queue_scope or {}).get("isComplete")

    source_unusable = {
        "snapshotUnusableIssues": summary.get("snapshotUnusableIssues") or 0,
        "snapshotUnusableFiles": summary.get("snapshotUnusableFiles") or 0,
        "snapshotUnusableByType": summary.get("snapshotUnusableByType") or {},
    }

    baselined_issues = summary.get("baselinedIssues") or 0
    baselined_files = summary.get("baselinedFiles") or 0
    baselined_by_type = summary.get("baselinedByType") or {}

    blocking_advisory_items = [e for e in advisory_queue if e.get("blocking")]
    has_blocking_advisory = is_complete is True and len(blocking_advisory_items) > 0

    should_open_issue = (
        baselined_issues > 0 or len(baseline_invalidated_slugs) > 0 or has_blocking_advisory
    )

    top_baselined_pages = _build_top_baselined_pages(files, max_entries)
    review_hints = {
        "topBaselinedPages": top_baselined_pages,
        "tokenlessNearTieExamples": _build_tokenless_near_tie_examples(advisory_queue, max_entries),
    }

    body = (
        _with_family_marker(
            _build_parity_followup_body(
                summary=summary,
                baseline_invalidated_slugs=baseline_invalidated_slugs,
                blocking_advisory_items=(
                    blocking_advisory_items[:max_entries] if is_complete is True else []
                ),
                advisory_queue_issues=advisory_queue_issues,
                advisory_queue_files=advisory_queue_files,
                advisory_queue_scope=advisory_queue_scope,
                include_advisory_in_body=is_complete is True,
                source_unusable=source_unusable,
                baselined_issues=baselined_issues,
                baselined_files=baselined_files,
                baselined_by_type=baselined_by_type,
                top_baselined_pages=top_baselined_pages,
            ),
            FAMILY_KEYS["PARITY_FOLLOWUP"],
        )
        if should_open_issue
        else ""
    )

    return {
        "key": FAMILY_KEYS["PARITY_FOLLOWUP"],
        "issueTitle": PARITY_FOLLOWUP_ISSUE_TITLE,
        "shouldOpenIssue": should_open_issue,
        "body": body,
        "summary": {
            "baselineDebt": {
                "baselinedIssues": summary.get("baselinedIssues") or 0,
                "baselinedFiles": summary.get("baselinedFiles") or 0,
                "baselineInvalidatedSlugs": baseline_invalidated_slugs,
                "baselineInvalidatedSlugCount": len(baseline_invalidated_slugs),
            },
            "advisoryQueue": {
                "issues": advisory_queue_issues,
                "files": advisory_queue_files,
                "blockingItems": len(blocking_advisory_items),
                "advisoryQueueScope": advisory_queue_scope,
                "advisoryQueue": advisory_queue,
                "includedInIssueBody": is_complete is True,
            },
            "reviewHints": review_hints,
            "sourceUnusable": source_unusable,
        },
    }


# ---------------------------------------------------------------------------
# Upstream recovery
# ---------------------------------------------------------------------------


_MD_SANITIZE_RE = re.compile(r"[\r\n`|\[\]()<>]")


def _sanitize_for_markdown(value: Any) -> str:
    """registry 由来の文字列を markdown 安全化 (mjs 等価)。

    ``\\r`` / ``\\n`` / `` ` `` / ``|`` / ``[`` / ``]`` / ``(`` / ``)`` /
    ``<`` / ``>`` を ``_`` に置換する。defense-in-depth: registry review が
    1 段目で、これが最後の安全網。
    """
    if value is None:
        return ""
    return _MD_SANITIZE_RE.sub("_", str(value))


def _build_upstream_recovery_sections(
    upstream_recovery: Any, max_entries: int = 10
) -> dict[str, Any]:
    """upstream-recovery-status.json から family-level counter を組み立てる (mjs 等価)。"""
    if (
        not upstream_recovery
        or not isinstance(upstream_recovery, dict)
        or not upstream_recovery.get("mechanisms")
    ):
        return {"enPatchRecovery": None, "sourceSyncRecovery": None}

    mechanisms = upstream_recovery.get("mechanisms") or {}

    def _safe_rows(raw: Any) -> list[dict[str, Any]]:
        if not isinstance(raw, list):
            return []
        return [e for e in raw if e and isinstance(e, dict) and not isinstance(e, list)]

    en_patch_rows = _safe_rows(mechanisms.get("en_source_patches"))
    sync_rows = _safe_rows(mechanisms.get("source_sync_exclusions"))

    def _project_en(e: Mapping[str, Any]) -> dict[str, Any]:
        slugs = e.get("slugs")
        days = e.get("daysUntilReview")
        return {
            "id": e.get("id"),
            "slugs": list(slugs) if isinstance(slugs, list) else [],
            "reviewAfter": e.get("reviewAfter"),
            "daysUntilReview": days
            if isinstance(days, (int, float)) and not isinstance(days, bool)
            else None,
        }

    def _project_sync(e: Mapping[str, Any]) -> dict[str, Any]:
        days = e.get("daysUntilReview")
        return {
            "slug": e.get("slug"),
            "reviewAfter": e.get("reviewAfter"),
            "daysUntilReview": days
            if isinstance(days, (int, float)) and not isinstance(days, bool)
            else None,
            "fetchStatus": e.get("fetchStatus") or "unknown",
        }

    en_stale = [e for e in en_patch_rows if e.get("statusA") == "stale"]
    en_overdue = [e for e in en_patch_rows if e.get("statusB") == "overdue"]
    en_unknown = [e for e in en_patch_rows if e.get("statusA") == "unknown"]

    sync_stale = [e for e in sync_rows if e.get("statusA") == "stale"]
    sync_overdue = [e for e in sync_rows if e.get("statusB") == "overdue"]
    sync_unknown = [e for e in sync_rows if e.get("statusA") == "unknown"]

    return {
        "enPatchRecovery": {
            "totalPatches": len(en_patch_rows),
            "activePatches": sum(1 for e in en_patch_rows if e.get("statusA") == "active"),
            "stalePatches": len(en_stale),
            "overduePatches": len(en_overdue),
            "unknownPatches": len(en_unknown),
            "stale": [_project_en(e) for e in en_stale[:max_entries]],
            "overdue": [_project_en(e) for e in en_overdue[:max_entries]],
        },
        "sourceSyncRecovery": {
            "totalExclusions": len(sync_rows),
            "activeExclusions": sum(1 for e in sync_rows if e.get("statusA") == "active"),
            "staleExclusions": len(sync_stale),
            "overdueExclusions": len(sync_overdue),
            "unknownExclusions": len(sync_unknown),
            "stale": [_project_sync(e) for e in sync_stale[:max_entries]],
            "overdue": [_project_sync(e) for e in sync_overdue[:max_entries]],
        },
    }


def _render_upstream_recovery_entries(sections: Mapping[str, Any]) -> list[str]:
    """upstream-recovery entry 行を生成 (mjs 等価)。"""
    lines: list[str] = []
    en_patch_recovery = sections.get("enPatchRecovery")
    source_sync_recovery = sections.get("sourceSyncRecovery")

    if en_patch_recovery and (
        en_patch_recovery.get("stalePatches", 0) > 0
        or en_patch_recovery.get("overduePatches", 0) > 0
    ):
        lines.append(
            f"- **en_source_patches:** {en_patch_recovery['stalePatches']} stale / "
            f"{en_patch_recovery['overduePatches']} overdue / "
            f"{en_patch_recovery['totalPatches']} total"
        )
        if en_patch_recovery["stale"]:
            lines.append("  - stale:")
            for e in en_patch_recovery["stale"]:
                slugs = ", ".join(_sanitize_for_markdown(s) for s in (e.get("slugs") or []))
                lines.append(
                    f"    - `{_sanitize_for_markdown(e.get('id'))}` (slugs: {slugs}) — "
                    f"reviewAfter={_sanitize_for_markdown(e.get('reviewAfter'))}"
                )
        if en_patch_recovery["overdue"]:
            lines.append("  - overdue:")
            for e in en_patch_recovery["overdue"]:
                lines.append(
                    f"    - `{_sanitize_for_markdown(e.get('id'))}` "
                    f"reviewAfter={_sanitize_for_markdown(e.get('reviewAfter'))} "
                    f"daysUntilReview={e.get('daysUntilReview')}"
                )

    if source_sync_recovery and (
        source_sync_recovery.get("staleExclusions", 0) > 0
        or source_sync_recovery.get("overdueExclusions", 0) > 0
    ):
        lines.append(
            f"- **source_sync_exclusions:** {source_sync_recovery['staleExclusions']} stale / "
            f"{source_sync_recovery['overdueExclusions']} overdue / "
            f"{source_sync_recovery['totalExclusions']} total"
        )
        if source_sync_recovery["stale"]:
            lines.append("  - stale:")
            for e in source_sync_recovery["stale"]:
                lines.append(
                    f"    - `{_sanitize_for_markdown(e.get('slug'))}` "
                    f"fetchStatus={_sanitize_for_markdown(e.get('fetchStatus'))} "
                    f"reviewAfter={_sanitize_for_markdown(e.get('reviewAfter'))}"
                )
        if source_sync_recovery["overdue"]:
            lines.append("  - overdue:")
            for e in source_sync_recovery["overdue"]:
                lines.append(
                    f"    - `{_sanitize_for_markdown(e.get('slug'))}` "
                    f"reviewAfter={_sanitize_for_markdown(e.get('reviewAfter'))} "
                    f"daysUntilReview={e.get('daysUntilReview')}"
                )

    return lines


def _render_upstream_recovery_subsection(sections: Mapping[str, Any]) -> list[str]:
    """managed issue 本文に差し込む upstream recovery subsection (mjs 等価)。"""
    entries = _render_upstream_recovery_entries(sections)
    if not entries:
        return []
    return [
        "## 上流修正候補 (upstream recovery)",
        "",
        "> `upstream-recovery-status.json` で検知された stale/overdue エントリー。"
        "運用手順は `docs/PARITY_GUIDE.md §許容機構` と "
        "`docs/OPS_DESIGN.md §Weekly: Upstream recovery triage` を参照。",
        "",
        *entries,
        "",
    ]


def render_upstream_recovery_sticky_comment(
    upstream_recovery: Any,
    *,
    max_entries: int = 10,
    marker: str = UPSTREAM_RECOVERY_STICKY_MARKER,
) -> str | None:
    """PR sticky comment 本文を生成 (mjs 等価)。

    stale / overdue entry が 0 件なら ``None`` を返し、caller に既存 comment
    の削除を促す。
    """
    sections = _build_upstream_recovery_sections(upstream_recovery, max_entries)
    entries = _render_upstream_recovery_entries(sections)
    if not entries:
        return None
    en_stale = (sections.get("enPatchRecovery") or {}).get("stalePatches", 0)
    en_overdue = (sections.get("enPatchRecovery") or {}).get("overduePatches", 0)
    sync_stale = (sections.get("sourceSyncRecovery") or {}).get("staleExclusions", 0)
    sync_overdue = (sections.get("sourceSyncRecovery") or {}).get("overdueExclusions", 0)
    total_axis = en_stale + en_overdue + sync_stale + sync_overdue
    return "\n".join(
        [
            marker,
            "",
            f"## Upstream recovery: {total_axis} entr(ies) need attention",
            "",
            *entries,
            "",
            "_Informational only — this comment is non-blocking. "
            "See `docs/PARITY_GUIDE.md §許容機構` and "
            "`docs/OPS_DESIGN.md §Weekly: Upstream recovery triage` "
            "for the removal workflow._",
        ]
    )


# ---------------------------------------------------------------------------
# Top-level report builder
# ---------------------------------------------------------------------------


def _iso_utc_now() -> str:
    """mjs ``new Date().toISOString()`` 等価 (UTC, ms 精度 + ``Z`` suffix)。"""
    now = datetime.datetime.now(datetime.UTC)
    # mjs toISOString: ``2026-04-21T10:23:45.123Z`` (ms 精度、末尾 Z)。
    return now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}Z"


def build_actionable_report(
    snapshot: Mapping[str, Any],
    parity: Mapping[str, Any],
    audit_manifest: Sequence[Mapping[str, Any]],
    options: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """4 family に集約した actionable report を組み立てる (mjs ``buildActionableReport`` 等価)。

    戻り値は ``docs-actionable-report.json`` と同じ shape。
    """
    options = options or {}
    max_entries = options.get("maxEntries", 10)
    source_sync = options.get("sourceSync") or {}
    upstream_recovery = options.get("upstreamRecovery")
    snapshot_changes = snapshot.get("changes") or []
    parity_files = parity.get("files") or []
    parity_issue_files = _build_parity_entries(parity_files, is_reportable_parity_issue)
    parity_issue_summary = _summarize_issue_entries(parity_issue_files)

    run_scope = (parity.get("summary") or {}).get("runScope")
    result = (parity.get("summary") or {}).get("result")
    parity_freshness_state = (parity.get("summary") or {}).get("freshnessState") or (
        source_sync or {}
    ).get("freshnessState")
    linkage_state = (parity.get("summary") or {}).get("linkageState")

    snapshot_top_entries = _sort_snapshot_entries(snapshot_changes)[:max_entries]
    parity_top_entries = _sort_parity_entries(parity_issue_files)[:max_entries]

    snapshot_summary = snapshot.get("summary") or {}
    sidebar = snapshot.get("sidebar") or {}
    snapshot_body_lines = [
        "## サマリー",
        "",
        f"- チェック日時: {snapshot.get('checkedAt') or '不明'}",
        f"- 変更ページ: {snapshot_summary.get('changed') or 0}",
        f"- 追加ページ: {snapshot_summary.get('added') or 0}",
        f"- 削除ページ: {snapshot_summary.get('removed') or 0}",
        f"- 変更なし: {snapshot_summary.get('unchanged') or 0}",
        f"- 総スナップショット数: {snapshot_summary.get('totalSnapshots') or 0}",
        "",
        "## 上位エントリー",
        "",
        _format_list([_format_snapshot_entry(e) for e in snapshot_top_entries]),
        "",
    ]
    if sidebar.get("changed"):
        snapshot_body_lines.extend(
            [
                "## サイドバー変更",
                "",
                f"- 追加ページ: {len(sidebar.get('addedPages') or [])}",
                f"- 削除ページ: {len(sidebar.get('removedPages') or [])}",
                "",
            ]
        )
    snapshot_body_lines.extend(
        [
            "## アーティファクト",
            "",
            "- `snapshot-diff-status.json`",
            "- `docs-update-summary.md`",
            "- `docs-audit-manifest.json`",
        ]
    )
    snapshot_issue_body = "\n".join(snapshot_body_lines)

    parity_summary_obj = parity.get("summary") or {}
    active_actionable_files = (
        parity_summary_obj.get("activeActionableFiles")
        or parity_summary_obj.get("actionableFiles")
        or 0
    )
    active_error_files = (
        parity_summary_obj.get("activeErrorFiles") or parity_summary_obj.get("errorFiles") or 0
    )
    acknowledged_issues = parity_summary_obj.get("acknowledgedIssues") or 0
    expired_acknowledgements = parity_summary_obj.get("expiredAcknowledgements") or 0

    structure_mismatch_issues = parity_summary_obj.get("structureMismatchIssues") or 0
    structure_mismatch_files = parity_summary_obj.get("structureMismatchFiles") or 0
    structure_mismatch_by_type = parity_summary_obj.get("structureMismatchByType") or {}

    parity_body_lines = [
        "## サマリー",
        "",
        f"- チェック日時: {parity_summary_obj.get('checkedAt') or '不明'}",
        f"- 要対応ファイル: {active_actionable_files}",
        f"- 問題ファイル: {len(parity_issue_files)}",
        f"- エラーファイル: {active_error_files}",
        f"- 承認済み (非ブロッキング): {acknowledged_issues}",
    ]
    if expired_acknowledgements > 0:
        parity_body_lines.append(f"- ⚠ 期限切れ承認: {expired_acknowledgements}")
    parity_body_lines.extend(["", "## 上位エントリー", ""])

    def _fmt_parity_entry(entry: Mapping[str, Any]) -> str:
        labels = []
        for issue in entry.get("issues") or []:
            tag = "[signal] " if issue.get("severity") == "signal" else ""
            detail = issue.get("detail")
            suffix = f" ({detail})" if detail else ""
            labels.append(f"{tag}{issue.get('type')}{suffix}")
        return f"`{entry.get('file')}` - {', '.join(labels)}"

    parity_body_lines.append(_format_list([_fmt_parity_entry(e) for e in parity_top_entries]))
    parity_body_lines.extend(
        [
            "",
            "## アーティファクト",
            "",
            "- `parity-check-status.json`",
            "- `docs-update-summary.md`",
            "- `docs-audit-manifest.json`",
        ]
    )
    parity_issue_body = "\n".join(parity_body_lines)

    freshness_state = (source_sync or {}).get("freshnessState")
    linkage_blocking = (
        linkage_state is not None and linkage_state != "linked" and linkage_state != "missing"
    )
    sync_summary = (source_sync or {}).get("summary") or {}
    sync_errors = (source_sync or {}).get("errors") or []

    source_side_debt_summary = _build_source_side_debt_summary(source_sync)
    has_source_side_debt = (
        source_side_debt_summary["excludedPages"] > 0
        or len(source_side_debt_summary.get("fetchErrorSlugs") or []) > 0
    )

    upstream_recovery_sections = _build_upstream_recovery_sections(upstream_recovery, max_entries)
    has_upstream_recovery_signal = (
        (upstream_recovery_sections.get("enPatchRecovery") or {}).get("stalePatches", 0) > 0
        or (upstream_recovery_sections.get("enPatchRecovery") or {}).get("overduePatches", 0) > 0
        or (upstream_recovery_sections.get("sourceSyncRecovery") or {}).get("staleExclusions", 0)
        > 0
        or (upstream_recovery_sections.get("sourceSyncRecovery") or {}).get("overdueExclusions", 0)
        > 0
    )

    sync_should_open = (
        freshness_state in ("broken", "partial")
        or linkage_blocking
        or has_source_side_debt
        or has_upstream_recovery_signal
    )

    source_sync_body = ""
    if sync_should_open:
        sync_lines = [
            "## サマリー",
            "",
            f"- 鮮度状態: **{freshness_state or '不明'}**",
            f"- 連結状態: **{linkage_state or '不明'}**",
            f"- 対象ページ: {sync_summary.get('targetPages') or 0}",
            f"- 取得済みページ: {sync_summary.get('fetchedPages') or 0}",
            f"- 404 ページ: {sync_summary.get('notFoundPages') or 0}",
            f"- エラーページ: {sync_summary.get('errorPages') or 0}",
            f"- サイドバー検証: {str(sync_summary.get('sidebarVerified') or False).lower()}",
            "",
            "## エラー",
            "",
            _format_list([f"`{e.get('slug')}` — {e.get('detail')}" for e in sync_errors]),
            "",
        ]
        if has_source_side_debt:
            sync_lines.extend(
                _render_source_side_debt_subsection(
                    source_side_debt_summary, (source_sync or {}).get("pages") or []
                )
            )
            sync_lines.append("")
        if has_upstream_recovery_signal:
            sync_lines.extend(_render_upstream_recovery_subsection(upstream_recovery_sections))
            sync_lines.append("")
        sync_lines.extend(
            [
                "## アーティファクト",
                "",
                "- `source-sync-status.json`",
                "- `snapshot-diff-status.json`",
                "- `parity-check-status.json`",
            ]
        )
        if (
            upstream_recovery
            and isinstance(upstream_recovery, dict)
            and upstream_recovery.get("mechanisms")
        ):
            sync_lines.append("- `upstream-recovery-status.json`")
        source_sync_body = "\n".join(sync_lines)

    # auditManifest の bucketCounts 集計。挿入順を mjs と揃えるため reduce 風に回す。
    bucket_counts: dict[str, int] = {}
    for entry in audit_manifest:
        b = entry.get("bucket")
        if b is not None:
            bucket_counts[b] = bucket_counts.get(b, 0) + 1

    return {
        "schemaVersion": ACTIONABLE_REPORT_SCHEMA_VERSION,
        "generatedAt": _iso_utc_now(),
        "runScope": run_scope,
        "result": result,
        "freshnessState": parity_freshness_state,
        "linkageState": linkage_state,
        "sourceSyncHealth": {
            "key": FAMILY_KEYS["SOURCE_SYNC_HEALTH"],
            "issueTitle": SOURCE_SYNC_ISSUE_TITLE,
            "shouldOpenIssue": sync_should_open,
            "freshnessState": freshness_state,
            "body": _with_family_marker(source_sync_body, FAMILY_KEYS["SOURCE_SYNC_HEALTH"]),
            "summary": {
                "targetPages": sync_summary.get("targetPages") or 0,
                "fetchedPages": sync_summary.get("fetchedPages") or 0,
                "notFoundPages": sync_summary.get("notFoundPages") or 0,
                "errorPages": sync_summary.get("errorPages") or 0,
                "sidebarVerified": sync_summary.get("sidebarVerified") or False,
            },
            "sourceSideDebt": source_side_debt_summary,
            "enPatchRecovery": upstream_recovery_sections.get("enPatchRecovery"),
            "sourceSyncRecovery": upstream_recovery_sections.get("sourceSyncRecovery"),
        },
        "snapshotDiff": {
            "key": FAMILY_KEYS["SNAPSHOT_DIFF"],
            "issueTitle": SNAPSHOT_ISSUE_TITLE,
            "shouldOpenIssue": len(snapshot_changes) > 0,
            "topEntries": list(snapshot_top_entries),
            "body": _with_family_marker(snapshot_issue_body, FAMILY_KEYS["SNAPSHOT_DIFF"]),
            "summary": {
                "actionableCount": len(snapshot_changes),
                "totalSnapshots": snapshot_summary.get("totalSnapshots") or 0,
                "changed": snapshot_summary.get("changed") or 0,
                "added": snapshot_summary.get("added") or 0,
                "removed": snapshot_summary.get("removed") or 0,
                "unchanged": snapshot_summary.get("unchanged") or 0,
            },
        },
        "parityRegression": {
            "key": FAMILY_KEYS["PARITY_REGRESSION"],
            "issueTitle": PARITY_ISSUE_TITLE,
            "shouldOpenIssue": len(parity_issue_files) > 0,
            "topEntries": list(parity_top_entries),
            "body": _with_family_marker(parity_issue_body, FAMILY_KEYS["PARITY_REGRESSION"]),
            "summary": {
                "issueCount": len(parity_issue_files),
                "acknowledgedIssues": parity_summary_obj.get("acknowledgedIssues") or 0,
                "expiredAcknowledgements": parity_summary_obj.get("expiredAcknowledgements") or 0,
                "issuesByType": parity_issue_summary["issuesByType"],
                "issuesBySeverity": parity_issue_summary["issuesBySeverity"],
                "structureMismatchIssues": structure_mismatch_issues,
                "structureMismatchFiles": structure_mismatch_files,
                "structureMismatchByType": structure_mismatch_by_type,
            },
        },
        "parityFollowup": _build_parity_followup(parity, options),
        "auditManifest": {
            "total": len(audit_manifest),
            "bucketCounts": bucket_counts,
        },
    }


def render_summary_markdown(
    _snapshot: Any,
    parity: Mapping[str, Any],
    actionable_report: Mapping[str, Any],
    audit_manifest: Sequence[Any],
    source_sync: Any,
) -> str:
    """``docs-update-summary.md`` 全体の markdown を生成 (mjs 等価)。"""
    sync_state = (
        (source_sync or {}).get("freshnessState")
        or (actionable_report.get("sourceSyncHealth") or {}).get("freshnessState")
        or "不明"
    )
    sync_summary = (
        (source_sync or {}).get("summary")
        or (actionable_report.get("sourceSyncHealth") or {}).get("summary")
        or {}
    )

    source_side_debt = (actionable_report.get("sourceSyncHealth") or {}).get(
        "sourceSideDebt"
    ) or _build_source_side_debt_summary(source_sync)
    source_side_debt_section = (
        _render_source_side_debt_subsection(
            source_side_debt, (source_sync or {}).get("pages") or []
        )
        if (
            source_side_debt["excludedPages"] > 0
            or len(source_side_debt.get("fetchErrorSlugs") or []) > 0
        )
        else []
    )

    parity_summary_obj = parity.get("summary") or {}
    parity_active_actionable = (
        parity_summary_obj.get("reportableActiveActionableFiles")
        or parity_summary_obj.get("activeActionableFiles")
        or parity_summary_obj.get("actionableFiles")
        or 0
    )
    parity_active_files = (
        parity_summary_obj.get("reportableActiveFiles")
        or parity_summary_obj.get("activeFiles")
        or ((actionable_report.get("parityRegression") or {}).get("summary") or {}).get(
            "issueCount"
        )
        or 0
    )

    audit_signal_issues = parity_summary_obj.get("auditSignalIssues") or 0
    audit_signal_files = parity_summary_obj.get("auditSignalFiles") or 0
    audit_signals_by_type = parity_summary_obj.get("auditSignalsByType") or {}
    if audit_signals_by_type:
        audit_signal_rows = [f"  - {k}: {v}" for k, v in sorted(audit_signals_by_type.items())]
    else:
        audit_signal_rows = ["  - (なし)"]

    snapshot_unusable_issues = parity_summary_obj.get("snapshotUnusableIssues") or 0
    snapshot_unusable_files = parity_summary_obj.get("snapshotUnusableFiles") or 0
    snapshot_unusable_by_type = parity_summary_obj.get("snapshotUnusableByType") or {}
    source_unusable_section: list[str] = []
    if snapshot_unusable_issues > 0:
        source_unusable_section = [
            "## ソース使用不可 (参考)",
            "",
            f"- 合計: {snapshot_unusable_issues} 件 ({snapshot_unusable_files} ファイル)",
            "- 翻訳の問題ではなくスナップショット / ソース同期側の既知問題です。翻訳 PR では修正できません。",  # noqa: E501
        ]
        if snapshot_unusable_by_type:
            source_unusable_section.append("- 種別別:")
            for t in sorted(snapshot_unusable_by_type.keys()):
                source_unusable_section.append(f"  - {t}: {snapshot_unusable_by_type[t]}")
        source_unusable_section.append("")

    snapshot_diff = actionable_report.get("snapshotDiff") or {}
    snapshot_summary = snapshot_diff.get("summary") or {}
    audit_bucket_counts = (actionable_report.get("auditManifest") or {}).get("bucketCounts") or {}
    followup_summary = (actionable_report.get("parityFollowup") or {}).get("summary") or {}
    baseline_debt = followup_summary.get("baselineDebt") or {}
    advisory_queue = followup_summary.get("advisoryQueue") or {}
    expired_acks = parity_summary_obj.get("expiredAcknowledgements") or 0

    lines = [
        "# ドキュメント検知サマリー",
        "",
        f"生成日時: {actionable_report.get('generatedAt')}",
        "",
        "## ソース同期状態",
        "",
        f"- 鮮度状態: {sync_state}",
        f"- 取得: {sync_summary.get('fetchedPages') or 0} / {sync_summary.get('targetPages') or 0} ページ",  # noqa: E501
        f"- エラー: {sync_summary.get('errorPages') or 0}",
        f"- サイドバー検証: {str(sync_summary.get('sidebarVerified') or False).lower()}",
        "",
        *source_side_debt_section,
        "## スナップショット差分",
        "",
        f"- 変更ページ: {snapshot_summary.get('changed')}",
        f"- 追加ページ: {snapshot_summary.get('added')}",
        f"- 削除ページ: {snapshot_summary.get('removed')}",
        f"- 変更なし: {snapshot_summary.get('unchanged')}",
        f"- 総スナップショット数: {snapshot_summary.get('totalSnapshots')}",
        "",
        "## パリティ",
        "",
        f"- 要対応ファイル: {parity_active_actionable}",
        f"- 問題ファイル: {parity_active_files}",
        f"- エラーファイル: {parity_summary_obj.get('activeErrorFiles') or parity_summary_obj.get('errorFiles') or 0}",  # noqa: E501
        f"- 承認済み (非ブロッキング): {parity_summary_obj.get('acknowledgedIssues') or 0}",
    ]
    if expired_acks > 0:
        lines.append(f"- ⚠ 期限切れ承認: {expired_acks}")
    lines.append("")
    lines.extend(source_unusable_section)
    lines.extend(
        [
            "## 監査シグナル",
            "",
            "- 監査専用: 粗いカウント / 形状 / テーブルセルのヒューリスティック",
            "- deep-audit で確認可能。パリティ後退の issue 本文には含めない",
            f"- 合計: {audit_signal_issues} 件 ({audit_signal_files} ファイル)",
            "- 種別別:",
            *audit_signal_rows,
            "",
            "## 監査マニフェスト",
            "",
            f"- 総レビュー対象: {len(audit_manifest)}",
            f"- ページライフサイクル: {audit_bucket_counts.get('page-lifecycle') or 0}",
            f"- 構造変更: {audit_bucket_counts.get('structural-change') or 0}",
            f"- 本文のみ: {audit_bucket_counts.get('content-only') or 0}",
            "",
            "## パリティフォローアップ",
            "",
            (
                f"- ベースライン済み: {baseline_debt.get('baselinedIssues') or 0} 件 "
                f"({baseline_debt.get('baselinedFiles') or 0} ファイル)"
            ),
            f"- 無効化された slug: {len(baseline_debt.get('baselineInvalidatedSlugs') or [])}",
            (
                f"- アドバイザリキュー: {advisory_queue.get('issues') or 0} 件 "
                f"({advisory_queue.get('files') or 0} ファイル, "
                f"{advisory_queue.get('blockingItems') or 0} ブロッキング; "
                f"{_format_advisory_queue_scope(advisory_queue.get('advisoryQueueScope'))})"
            ),
            "",
            "## アーティファクト",
            "",
            "- `snapshot-diff-status.json`",
            "- `parity-check-status.json`",
            "- `docs-audit-manifest.json`",
            "- `docs-actionable-report.json`",
        ]
    )

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Entry point: load detection inputs
# ---------------------------------------------------------------------------


def load_detection_inputs(
    *,
    snapshot_path: str | Path | None = None,
    parity_path: str | Path | None = None,
    source_sync_path: str | Path | None = None,
    upstream_recovery_path: str | Path | None = None,
    strict: bool = False,
    root_dir: str | Path | None = None,
) -> dict[str, Any]:
    """4 artifact を読み込み、optional に strict validation を行う (mjs 等価)。

    ``strict=True`` で validation error が 1 件以上あれば ``ValueError`` を
    raise (mjs は ``Error`` に ``validationErrors`` を添える)。
    """
    # mjs は module-level ``ROOT_DIR`` で repo root を固定解決する。Python 側も
    # ``.project.ROOT_DIR`` を default にして、``cd scripts/python && uv run ...``
    # から呼ばれても repo root の artifact を読む契約を守る。
    # caller が明示的に ``root_dir`` を渡せば override 可能。
    root = Path(root_dir) if root_dir is not None else ROOT_DIR
    snapshot_path = Path(snapshot_path) if snapshot_path else root / "snapshot-diff-status.json"
    parity_path = Path(parity_path) if parity_path else root / "parity-check-status.json"
    source_sync_path = (
        Path(source_sync_path) if source_sync_path else root / "source-sync-status.json"
    )
    upstream_recovery_path = (
        Path(upstream_recovery_path)
        if upstream_recovery_path
        else root / "upstream-recovery-status.json"
    )

    inputs = {
        "snapshot": _read_json(snapshot_path),
        "parity": _read_json(parity_path),
        "sourceSync": _read_json(source_sync_path),
        # upstream-recovery は optional。不在時は ``{}`` で graceful degradation。
        "upstreamRecovery": _read_json(upstream_recovery_path),
    }
    if strict:
        validation = validate_detection_inputs(inputs)
        if not validation.get("ok"):
            err_msg = "Detection input validation failed:\n  - " + "\n  - ".join(
                validation["errors"]
            )
            error = ValueError(err_msg)
            # mjs parity: err.validationErrors 相当。Python では args[1] に入れる。
            error.validation_errors = validation["errors"]  # type: ignore[attr-defined]
            raise error
    return inputs
