"""``scripts/detection/check_patch_review_cadence.mjs`` の Python port。

Registry review cadence monitor (non-blocking)。2 つの retreat registry
(``EN_SOURCE_PATCHES`` = segment-level / ``SOURCE_SYNC_EXCLUSIONS`` = page-level)
を走査し、``reviewAfter`` が過ぎている entry を stderr に warning 出力する。

Exit code は常に 0 — monitoring であって gate ではない。CI は warning を
surface できるが failed にしてはいけない。
"""

from __future__ import annotations

import sys
from collections.abc import Mapping, Sequence
from datetime import UTC, datetime
from typing import IO, Any

from ..en_source_patches import EN_SOURCE_PATCHES
from ..sync_exclusions import SOURCE_SYNC_EXCLUSIONS

__all__ = [
    "collect_overdue_patches",
    "collect_overdue_sync_exclusions",
    "evaluate_patch_review",
    "format_warning",
    "main",
]


def _now_ms() -> int:
    """現在時刻を UTC epoch ms で返す (mjs ``Date.now()`` 等価)。"""
    return int(datetime.now(tz=UTC).timestamp() * 1000)


def _iso_to_ms(date_str: str) -> float | None:
    """mjs ``new Date(str).getTime()`` 等価。invalid なら None。"""
    try:
        # YYYY-MM-DD は ISO 8601 として datetime.fromisoformat で parse 可能。
        # mjs ``new Date("2026-04-21")`` と同じく UTC midnight 扱い。
        dt = datetime.fromisoformat(date_str).replace(tzinfo=UTC)
    except ValueError:
        return None
    return dt.timestamp() * 1000


def evaluate_patch_review(
    patch: Mapping[str, Any] | None, now_ms: int | None = None
) -> dict[str, Any]:
    """patch の ``reviewAfter`` が過去なら overdue + days を返す (mjs 等価)。"""
    if now_ms is None:
        now_ms = _now_ms()
    review_after = (patch or {}).get("reviewAfter")
    if not isinstance(review_after, str) or len(review_after) == 0:
        return {"overdue": False, "daysOverdue": 0, "invalid": True}
    parsed_ms = _iso_to_ms(review_after)
    if parsed_ms is None:
        return {"overdue": False, "daysOverdue": 0, "invalid": True}
    if now_ms <= parsed_ms:
        return {"overdue": False, "daysOverdue": 0, "invalid": False}
    days_overdue = int((now_ms - parsed_ms) // (24 * 60 * 60 * 1000))
    return {"overdue": True, "daysOverdue": days_overdue, "invalid": False}


def collect_overdue_patches(
    registry: Sequence[Mapping[str, Any]] | None = None,
    now_ms: int | None = None,
) -> list[dict[str, Any]]:
    """``reviewAfter`` が過去の en_source_patches entry を集める (mjs 等価)。"""
    if registry is None:
        registry = EN_SOURCE_PATCHES
    if now_ms is None:
        now_ms = _now_ms()
    overdue: list[dict[str, Any]] = []
    for patch in registry:
        result = evaluate_patch_review(patch, now_ms)
        if result["overdue"]:
            overdue.append(
                {
                    "id": patch.get("id"),
                    "reviewAfter": patch.get("reviewAfter"),
                    "daysOverdue": result["daysOverdue"],
                }
            )
    return overdue


def collect_overdue_sync_exclusions(
    registry: Mapping[str, Mapping[str, Any]] | None = None,
    now_ms: int | None = None,
) -> list[dict[str, Any]]:
    """``reviewAfter`` が過去の source_sync_exclusions entry を集める (mjs 等価)。"""
    if registry is None:
        registry = SOURCE_SYNC_EXCLUSIONS
    if now_ms is None:
        now_ms = _now_ms()
    overdue: list[dict[str, Any]] = []
    for slug, entry in registry.items():
        result = evaluate_patch_review(entry, now_ms)
        if result["overdue"]:
            overdue.append(
                {
                    "slug": slug,
                    "reviewAfter": entry.get("reviewAfter"),
                    "daysOverdue": result["daysOverdue"],
                }
            )
    return overdue


def format_warning(entry: Mapping[str, Any]) -> str:
    """overdue entry の warning 文字列を生成 (mjs 等価、id > slug > unknown)。"""
    if entry.get("id"):
        return (
            f"[en_source_patches] reviewAfter overdue: patch={entry['id']} "
            f"reviewAfter={entry.get('reviewAfter')} daysOverdue={entry.get('daysOverdue')}"
        )
    if entry.get("slug"):
        return (
            f"[source_sync_exclusions] reviewAfter overdue: slug={entry['slug']} "
            f"reviewAfter={entry.get('reviewAfter')} daysOverdue={entry.get('daysOverdue')}"
        )
    return (
        f"[registry-review-cadence] reviewAfter overdue: entry=<unknown> "
        f"reviewAfter={entry.get('reviewAfter') or '<none>'} "
        f"daysOverdue={entry.get('daysOverdue') or 0}"
    )


def main(
    *,
    patch_registry: Sequence[Mapping[str, Any]] | None = None,
    exclusions_registry: Mapping[str, Mapping[str, Any]] | None = None,
    now_ms: int | None = None,
    stdout: IO[str] | None = None,
    stderr: IO[str] | None = None,
) -> dict[str, int]:
    """CLI エントリポイント (mjs 等価)。``{"overdueCount": int, "exitCode": 0}`` を返す。"""
    stdout = stdout or sys.stdout
    stderr = stderr or sys.stderr
    registry = patch_registry if patch_registry is not None else EN_SOURCE_PATCHES
    exclusions = exclusions_registry if exclusions_registry is not None else SOURCE_SYNC_EXCLUSIONS
    if now_ms is None:
        now_ms = _now_ms()

    overdue_patches = collect_overdue_patches(registry, now_ms)
    overdue_exclusions = collect_overdue_sync_exclusions(exclusions, now_ms)
    patch_total = len(registry)
    exclusion_total = len(exclusions)
    overdue_count = len(overdue_patches) + len(overdue_exclusions)

    if overdue_count == 0:
        print(
            f"[registry-review-cadence] OK — {patch_total} en_source_patches + "
            f"{exclusion_total} source_sync_exclusions, 0 overdue",
            file=stdout,
        )
        return {"overdueCount": 0, "exitCode": 0}
    print(
        f"[registry-review-cadence] {overdue_count} overdue entr(ies) "
        f"({len(overdue_patches)} patches / {len(overdue_exclusions)} exclusions, "
        f"warning only, non-blocking):",
        file=stdout,
    )
    for entry in overdue_patches:
        print(format_warning(entry), file=stderr)
    for entry in overdue_exclusions:
        print(format_warning(entry), file=stderr)
    return {"overdueCount": overdue_count, "exitCode": 0}


if __name__ == "__main__":
    result = main()
    sys.exit(int(result["exitCode"]))
