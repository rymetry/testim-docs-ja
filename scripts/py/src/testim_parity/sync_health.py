"""Source Sync Health — ``source-sync-status.json`` builder (``source_sync_health.mjs`` port)。

Pure functions のみ。filesystem I/O なし。

mjs と byte-identical な output を目指すが、runId の構築に ``Date.now()`` +
``Math.random()`` を使う経路が mjs に存在するため、``now`` / ``run_seed`` を
caller から明示的に渡すことで deterministic に揃える (conformance test も
同じく両引数を供給する)。
"""

from __future__ import annotations

import datetime
import hashlib
from collections.abc import Mapping, Sequence
from typing import Any, Literal, TypedDict

__all__ = [
    "SOURCE_SYNC_STATUS_SCHEMA_VERSION",
    "build_run_scope",
    "build_source_sync_status",
    "compute_freshness_state",
    "fingerprint",
    "validate_run_linkage",
]


SOURCE_SYNC_STATUS_SCHEMA_VERSION = 2


_EXCLUDED_FETCH_STATUSES: frozenset[str] = frozenset({"excluded-broken", "excluded-recovered"})


FreshnessState = Literal["fresh", "partial", "broken"]
LinkageResult = Literal["linked", "missing", "stale", "run-mismatch", "scope-mismatch"]


class RunScope(TypedDict):
    """``source-sync-status`` / ``snapshot-diff-status`` 両方で使う scope shape。"""

    type: Literal["full", "slug", "section"]
    isComplete: bool
    filters: dict[str, str | None]


def build_run_scope(*, slug: str | None = None, section: str | None = None) -> RunScope:
    """CLI ``--slug`` / ``--section`` から run scope を組み立てる (mjs 等価)。

    優先順: ``slug`` (非空 str) → ``section`` (非空 str) → ``full``。
    """
    slug_filter = slug if isinstance(slug, str) and slug else None
    section_filter = section if isinstance(section, str) and section else None
    if slug_filter:
        return {
            "type": "slug",
            "isComplete": False,
            "filters": {"slug": slug_filter, "section": section_filter},
        }
    if section_filter:
        return {
            "type": "section",
            "isComplete": False,
            "filters": {"slug": None, "section": section_filter},
        }
    return {
        "type": "full",
        "isComplete": True,
        "filters": {"slug": None, "section": None},
    }


def fingerprint(items: Sequence[str]) -> str:
    """``sha256:<hex>`` — sorted array join で hash (mjs 等価)。"""
    sorted_items = sorted(items)
    digest = hashlib.sha256("\n".join(sorted_items).encode("utf-8")).hexdigest()
    return f"sha256:{digest}"


def _is_excluded_page(page: Mapping[str, Any]) -> bool:
    return page.get("fetchStatus") in _EXCLUDED_FETCH_STATUSES


def compute_freshness_state(
    pages: Sequence[Mapping[str, Any]], sidebar_verified: bool
) -> FreshnessState:
    """fetch 結果から freshness state を判定する (mjs 等価)。

    - ``fresh``: 全 non-excluded が ok + sidebar verified
    - ``partial``: 一部 non-excluded が failed/404 だが 1 つ以上 ok
    - ``broken``: sidebar 失敗 / 空 / non-excluded が全 fail

    source-side debt (``excluded-broken`` / ``excluded-recovered``) は freshness
    計算から除外する。run が debt のみに触れた場合は sidebar が verified なら
    ``fresh`` 扱い。
    """
    if not sidebar_verified:
        return "broken"
    if len(pages) == 0:
        return "broken"

    non_excluded = [page for page in pages if not _is_excluded_page(page)]

    # debt ページのみに触れた run は fresh
    if len(non_excluded) == 0:
        return "fresh"

    ok_count = sum(1 for page in non_excluded if page.get("fetchStatus") == "ok")
    if ok_count == 0:
        return "broken"
    if ok_count == len(non_excluded):
        return "fresh"
    return "partial"


def _same_scope(left: Any, right: Any) -> bool:
    """run scope の等価比較 (mjs の object shape 等価判定)。"""
    if not isinstance(left, Mapping) or not isinstance(right, Mapping):
        return False
    if left.get("type") != right.get("type"):
        return False
    if left.get("isComplete") != right.get("isComplete"):
        return False
    left_filters_raw = left.get("filters")
    right_filters_raw = right.get("filters")
    left_filters: Mapping[str, Any] = (
        left_filters_raw if isinstance(left_filters_raw, Mapping) else {}
    )
    right_filters: Mapping[str, Any] = (
        right_filters_raw if isinstance(right_filters_raw, Mapping) else {}
    )
    if (left_filters.get("slug") or None) != (right_filters.get("slug") or None):
        return False
    return (left_filters.get("section") or None) == (right_filters.get("section") or None)


def validate_run_linkage(
    source_sync: Any,
    snapshot_diff: Any,
    parity_run_scope: Any,
) -> LinkageResult:
    """3 artifact が同じ logical run を指しているか検証する (mjs 等価)。

    戻り値: ``linked`` / ``missing`` / ``stale`` / ``run-mismatch`` / ``scope-mismatch``。
    """
    if not isinstance(source_sync, Mapping):
        return "missing"
    if not isinstance(source_sync.get("sourceInventoryFingerprint"), str):
        return "missing"
    if not isinstance(source_sync.get("runId"), str):
        return "missing"
    if not isinstance(source_sync.get("runScope"), Mapping):
        return "missing"

    if not isinstance(snapshot_diff, Mapping):
        return "missing"
    if not isinstance(snapshot_diff.get("sourceInventoryFingerprint"), str):
        return "missing"
    if not isinstance(snapshot_diff.get("sourceSyncRunId"), str):
        return "missing"
    if not isinstance(snapshot_diff.get("runScope"), Mapping):
        return "missing"

    if source_sync["sourceInventoryFingerprint"] != snapshot_diff["sourceInventoryFingerprint"]:
        return "stale"

    if source_sync["runId"] != snapshot_diff["sourceSyncRunId"]:
        return "run-mismatch"

    if not _same_scope(source_sync["runScope"], snapshot_diff["runScope"]):
        return "scope-mismatch"

    if parity_run_scope is not None and not _same_scope(source_sync["runScope"], parity_run_scope):
        return "scope-mismatch"

    return "linked"


def _iso_utc(now: datetime.datetime | None) -> str:
    """mjs ``Date.toISOString()`` 等価 (UTC + ``Z`` 付き + millisecond)。"""
    if now is None:
        now = datetime.datetime.now(tz=datetime.UTC)
    now = now.replace(tzinfo=datetime.UTC) if now.tzinfo is None else now.astimezone(datetime.UTC)
    # 小数点 6 桁 (micro) から 3 桁 (milli) に切り詰め + Z 接尾。
    # Node ``Date().toISOString()`` は "YYYY-MM-DDTHH:MM:SS.sssZ"。
    return now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}Z"


def build_source_sync_status(
    *,
    pages: Sequence[Mapping[str, Any]],
    sidebar_result: Mapping[str, Any],
    run_scope: Mapping[str, Any],
    now: datetime.datetime | None = None,
    run_seed: str | None = None,
) -> dict[str, Any]:
    """``source-sync-status.json`` payload を組み立てる (mjs 等価)。

    ``now`` / ``run_seed`` は deterministic な conformance test 用に caller で
    供給する。runtime 本番では ``now=None`` で現在時刻、``run_seed=None`` で
    ``checkedAt + random`` からハッシュを作る (mjs と同一動作)。
    """
    checked_at = _iso_utc(now)
    if run_seed is not None:
        short_hash = hashlib.sha256(run_seed.encode("utf-8")).hexdigest()[:8]
    else:
        # mjs ``Math.random()`` 非決定的 path — production fallback。conformance
        # test では必ず run_seed を渡すため本 branch は通らない。
        import random

        short_hash = hashlib.sha256(
            (checked_at + str(random.random())).encode("utf-8")
        ).hexdigest()[:8]
    run_id = f"{checked_at}#{short_hash}"

    slugs = [page.get("slug", "") for page in pages]
    source_inventory_fingerprint = fingerprint(slugs)

    sidebar_ok = sidebar_result.get("ok")
    sidebar_slugs = sidebar_result.get("sidebarSlugs")
    if sidebar_ok and isinstance(sidebar_slugs, Sequence) and not isinstance(sidebar_slugs, str):
        sidebar_fingerprint = fingerprint(list(sidebar_slugs))
    else:
        section_count = sidebar_result.get("sectionCount") or 0
        page_count = sidebar_result.get("pageCount") or 0
        sidebar_fingerprint = fingerprint([f"{section_count}:{page_count}"])

    ok_count = sum(1 for p in pages if p.get("fetchStatus") == "ok")
    not_found_count = sum(1 for p in pages if p.get("fetchStatus") == "not-found")
    error_count = sum(1 for p in pages if p.get("fetchStatus") in ("error", "excluded-fetch-error"))
    excluded_broken_count = sum(1 for p in pages if p.get("fetchStatus") == "excluded-broken")
    excluded_recovered_count = sum(1 for p in pages if p.get("fetchStatus") == "excluded-recovered")
    excluded_count = excluded_broken_count + excluded_recovered_count

    freshness_state = compute_freshness_state(pages, bool(sidebar_ok))

    errors: list[dict[str, Any]] = []
    for page in pages:
        fetch_status = page.get("fetchStatus")
        error_detail = page.get("errorDetail")
        if fetch_status in ("error", "excluded-fetch-error") and error_detail:
            errors.append({"slug": page.get("slug"), "detail": error_detail})
    if not sidebar_ok:
        reason = sidebar_result.get("reason") or "unknown"
        errors.append({"slug": "_sidebar", "detail": f"Sidebar verification failed: {reason}"})

    built_pages: list[dict[str, Any]] = []
    for page in pages:
        entry: dict[str, Any] = {
            "slug": page.get("slug"),
            "fetchStatus": page.get("fetchStatus"),
        }
        if page.get("snapshotFingerprint"):
            entry["snapshotFingerprint"] = page["snapshotFingerprint"]
        # debt metadata: ``debtCategory`` + ``recoveryProbe`` は debt page のみ emit。
        # ``recoveryProbe=null`` vs field 省略は "probed clean" vs "never probed" を
        # 区別するため保持する (mjs と同一契約)。
        if page.get("debtCategory"):
            entry["debtCategory"] = page["debtCategory"]
            entry["recoveryProbe"] = page.get("recoveryProbe")  # None 明示許容
        if page.get("errorDetail"):
            entry["errorDetail"] = page["errorDetail"]
        built_pages.append(entry)

    return {
        "schemaVersion": SOURCE_SYNC_STATUS_SCHEMA_VERSION,
        "runId": run_id,
        "checkedAt": checked_at,
        "sourceInventoryFingerprint": source_inventory_fingerprint,
        "sidebarFingerprint": sidebar_fingerprint,
        "freshnessState": freshness_state,
        "runScope": dict(run_scope),
        "summary": {
            "targetPages": len(pages),
            "fetchedPages": ok_count,
            "notFoundPages": not_found_count,
            "errorPages": error_count,
            "excludedPages": excluded_count,
            "excludedBrokenPages": excluded_broken_count,
            "excludedRecoveredPages": excluded_recovered_count,
            "sidebarVerified": bool(sidebar_ok),
        },
        "pages": built_pages,
        "errors": errors,
    }
