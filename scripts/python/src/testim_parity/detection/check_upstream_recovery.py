"""``scripts/detection/check_upstream_recovery.mjs`` の Python port。

既存 signal を aggregate して ``upstream-recovery-status.json`` を派生する:

- ``EN_SOURCE_PATCHES`` + ``preprocess_en_html(patch_coverage)`` → per-patch Axis A
- ``source-sync-status.json.pages[].fetchStatus`` → per-exclusion Axis A
- 各 entry の ``reviewAfter`` との cadence 比較 → per-entry Axis B

Non-blocking (exit 0 常時)。consumers (sticky PR comment / detection_reports /
sourceSyncHealth managed issue) が JSON を読んで判断する。
"""

from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Mapping, Sequence
from datetime import UTC, datetime
from pathlib import Path
from typing import IO, Any

from ..en_source_patches import EN_SOURCE_PATCHES, create_en_source_patch_coverage
from ..preprocess_en import preprocess_en_html
from ..project import ROOT_DIR
from ..sync_exclusions import SOURCE_SYNC_EXCLUSIONS

__all__ = [
    "build_upstream_recovery_status",
    "compute_en_patch_status",
    "compute_sync_exclusion_status",
    "days_since",
    "days_until",
    "is_review_overdue",
    "main",
    "run_check_upstream_recovery",
]


_SNAPSHOTS_ROOT: Path = ROOT_DIR / "snapshots" / "en" / "content"
_SOURCE_SYNC_STATUS_PATH: Path = ROOT_DIR / "source-sync-status.json"
_OUTPUT_PATH: Path = ROOT_DIR / "upstream-recovery-status.json"

_MS_PER_DAY: int = 24 * 60 * 60 * 1000


def _now_ms() -> int:
    return int(datetime.now(tz=UTC).timestamp() * 1000)


def _iso_to_ms(date_str: Any) -> float | None:
    if not isinstance(date_str, str) or not date_str:
        return None
    try:
        dt = datetime.fromisoformat(date_str).replace(tzinfo=UTC)
    except ValueError:
        return None
    return dt.timestamp() * 1000


def days_since(date_str: Any, now_ms: int | None = None) -> int:
    """``date_str`` から now までの日数 (``> 0`` で overdue)。"""
    if now_ms is None:
        now_ms = _now_ms()
    parsed = _iso_to_ms(date_str)
    if parsed is None:
        return 0
    return int((now_ms - parsed) // _MS_PER_DAY)


def days_until(date_str: Any, now_ms: int | None = None) -> int | None:
    """now から ``date_str`` までの日数。invalid / 欠損で ``None``。"""
    if now_ms is None:
        now_ms = _now_ms()
    parsed = _iso_to_ms(date_str)
    if parsed is None:
        return None
    return int((parsed - now_ms) // _MS_PER_DAY)


def is_review_overdue(date_str: Any, now_ms: int | None = None) -> bool:
    """``check_patch_review_cadence`` と同じ strictly-greater セマンティクス。"""
    if now_ms is None:
        now_ms = _now_ms()
    parsed = _iso_to_ms(date_str)
    if parsed is None:
        return False
    return now_ms > parsed


def _load_source_sync_status(file_path: Path = _SOURCE_SYNC_STATUS_PATH) -> Any:
    """``source-sync-status.json`` を読む。不在 / 破損で None (mjs 等価)。"""
    if not file_path.exists():
        return None
    try:
        return json.loads(file_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as err:
        print(
            f"[upstream-recovery] failed to parse {file_path.name}: {err}",
            file=sys.stderr,
        )
        return None


def _unique_patch_slugs(patches: Sequence[Mapping[str, Any]]) -> set[str]:
    """全 patch の slug union (mjs 等価)。"""
    out: set[str] = set()
    for patch in patches:
        slugs = patch.get("slugs") or []
        for slug in slugs:
            out.add(slug)
    return out


def compute_en_patch_status(
    *,
    now_ms: int | None = None,
    snapshots_root: Path | str = _SNAPSHOTS_ROOT,
    patches: Sequence[Mapping[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """Axis A: en_source_patches (mjs 等価)。"""
    if now_ms is None:
        now_ms = _now_ms()
    patches_list: Sequence[Mapping[str, Any]] = (
        patches if patches is not None else EN_SOURCE_PATCHES
    )
    coverage = create_en_source_patch_coverage()
    slugs = _unique_patch_slugs(patches_list)
    snapshot_seen: set[str] = set()
    root = Path(snapshots_root)
    for slug in slugs:
        snapshot_path = root / f"{slug}.html"
        if not snapshot_path.exists():
            continue
        # ``en_source_patches`` find strings intentionally preserve MadCap CRLF
        # boundaries. ``Path.read_text`` normalizes newlines on some platforms and
        # can make an active patch look stale, so mirror check_source_parity.
        raw = snapshot_path.read_bytes().decode("utf-8")
        try:
            preprocess_en_html(raw, slug=slug, patch_coverage=coverage)
            snapshot_seen.add(slug)
        except Exception as err:
            print(
                f"[upstream-recovery] preprocess_en_html failed for slug={slug}: {err}",
                file=sys.stderr,
            )

    snap = coverage["snapshot"]()
    by_patch_id_status = snap.get("byPatchIdStatus", {})

    result: list[dict[str, Any]] = []
    for patch in patches_list:
        status = by_patch_id_status.get(patch.get("id")) or {"matched": False, "hits": 0}
        patch_slugs = list(patch.get("slugs") or [])
        any_snapshot_seen = any(s in snapshot_seen for s in patch_slugs)
        if not any_snapshot_seen:
            status_a = "unknown"
        else:
            status_a = "active" if status.get("matched") else "stale"
        status_b = "overdue" if is_review_overdue(patch.get("reviewAfter"), now_ms) else "current"
        result.append(
            {
                "id": patch.get("id"),
                "mechanism": "en_source_patches",
                "slugs": patch_slugs,
                "statusA": status_a,
                "statusB": status_b,
                "hits": status.get("hits", 0),
                "addedAt": patch.get("addedAt"),
                "reviewAfter": patch.get("reviewAfter"),
                "daysUntilReview": days_until(patch.get("reviewAfter"), now_ms),
            }
        )
    return result


def compute_sync_exclusion_status(
    *,
    now_ms: int | None = None,
    exclusions: Mapping[str, Mapping[str, Any]] | None = None,
    source_sync_status: Any = None,
) -> list[dict[str, Any]]:
    """Axis A: source_sync_exclusions (mjs 等価)。"""
    if now_ms is None:
        now_ms = _now_ms()
    if exclusions is None:
        exclusions = SOURCE_SYNC_EXCLUSIONS
    if source_sync_status is None:
        source_sync_status = _load_source_sync_status()
    pages = (source_sync_status or {}).get("pages") or []
    if not isinstance(pages, list):
        pages = []
    page_by_slug: dict[str, Mapping[str, Any]] = {}
    for page in pages:
        slug = (page or {}).get("slug")
        if isinstance(slug, str):
            page_by_slug[slug] = page

    result: list[dict[str, Any]] = []
    for slug, entry in exclusions.items():
        page = page_by_slug.get(slug)
        fetch_status = (page or {}).get("fetchStatus") or "unknown"
        if fetch_status == "excluded-recovered":
            status_a = "stale"
        elif fetch_status == "excluded-broken":
            status_a = "active"
        else:
            status_a = "unknown"
        status_b = "overdue" if is_review_overdue(entry.get("reviewAfter"), now_ms) else "current"
        result.append(
            {
                "slug": slug,
                "mechanism": "source_sync_exclusions",
                "statusA": status_a,
                "statusB": status_b,
                "fetchStatus": fetch_status,
                "addedAt": entry.get("addedAt"),
                "reviewAfter": entry.get("reviewAfter"),
                "daysUntilReview": (
                    days_until(entry.get("reviewAfter"), now_ms)
                    if entry.get("reviewAfter")
                    else None
                ),
            }
        )
    return result


def build_upstream_recovery_status(
    *,
    now_ms: int | None = None,
    snapshots_root: Path | str = _SNAPSHOTS_ROOT,
    patches: Sequence[Mapping[str, Any]] | None = None,
    exclusions: Mapping[str, Mapping[str, Any]] | None = None,
    source_sync_status: Any = None,
) -> dict[str, Any]:
    """``upstream-recovery-status.json`` payload を組み立てる (mjs 等価)。"""
    if now_ms is None:
        now_ms = _now_ms()

    en_patches = compute_en_patch_status(
        now_ms=now_ms, snapshots_root=snapshots_root, patches=patches
    )
    sync_exclusions = compute_sync_exclusion_status(
        now_ms=now_ms, exclusions=exclusions, source_sync_status=source_sync_status
    )
    all_entries = en_patches + sync_exclusions
    stale = sum(1 for e in all_entries if e.get("statusA") == "stale")
    overdue = sum(1 for e in all_entries if e.get("statusB") == "overdue")
    unknown = sum(1 for e in all_entries if e.get("statusA") == "unknown")
    total = len(all_entries)
    active = total - stale - unknown

    # mjs ``new Date(nowMs).toISOString()`` 等価。
    dt = datetime.fromtimestamp(now_ms / 1000, tz=UTC)
    generated_at = dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{dt.microsecond // 1000:03d}Z"

    return {
        "schemaVersion": 1,
        "generatedAt": generated_at,
        "summary": {
            "totalEntries": total,
            "activeEntries": active,
            "staleEntries": stale,
            "overdueEntries": overdue,
            "unknownEntries": unknown,
        },
        "mechanisms": {
            "en_source_patches": en_patches,
            "source_sync_exclusions": sync_exclusions,
        },
    }


def run_check_upstream_recovery(
    *,
    output_path: Path | str = _OUTPUT_PATH,
    stdout: IO[str] | None = None,
    now_ms: int | None = None,
    snapshots_root: Path | str = _SNAPSHOTS_ROOT,
    patches: Sequence[Mapping[str, Any]] | None = None,
    exclusions: Mapping[str, Mapping[str, Any]] | None = None,
    source_sync_status: Any = None,
) -> dict[str, Any]:
    """payload を書き出し summary line を stdout に出す (mjs 等価)。"""
    out_stream = stdout if stdout is not None else sys.stdout
    output = Path(output_path)

    payload = build_upstream_recovery_status(
        now_ms=now_ms,
        snapshots_root=snapshots_root,
        patches=patches,
        exclusions=exclusions,
        source_sync_status=source_sync_status,
    )
    output.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    summary = payload["summary"]
    try:
        rel = output.relative_to(ROOT_DIR)
    except ValueError:
        rel = output
    print(
        f"[upstream-recovery] total={summary['totalEntries']} "
        f"active={summary['activeEntries']} "
        f"stale={summary['staleEntries']} "
        f"overdue={summary['overdueEntries']} "
        f"unknown={summary['unknownEntries']} "
        f"→ {rel}",
        file=out_stream,
    )
    return payload


def main(argv: list[str] | None = None) -> int:
    """CLI エントリポイント (常に exit 0 = non-blocking)。"""
    parser = argparse.ArgumentParser(
        description="Derive upstream-recovery-status.json from existing signals"
    )
    _ = parser.parse_args(argv)
    try:
        run_check_upstream_recovery()
    except Exception as err:  # pragma: no cover - defensive
        print(f"[upstream-recovery] unexpected failure: {err}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
