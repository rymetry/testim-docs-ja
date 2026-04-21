"""Tokenless near-tie review queue (provider-free advisory layer)。

``scripts/lib/source_parity_advisory_queue.mjs`` の port。既存の
``segment-inconclusive`` issue のうち ``inconclusiveCategory ==
'tokenless-near-tie'`` を手動 review queue に reshape する層。新 detector / 新
issue type は持たず、既に検出済みの不確実性を絞り込んだ review list に変形
するだけ。

mjs と byte-identical な queue entry / summary を返す契約。
"""

from __future__ import annotations

import re
from collections.abc import Iterable, Mapping, Sequence
from typing import Any

__all__ = [
    "build_advisory_artifacts",
    "build_advisory_queue_issue_key",
    "build_advisory_review_queue",
    "build_advisory_review_scope",
    "is_advisory_review_candidate",
    "is_blocking_advisory_review_issue",
    "is_valid_advisory_acknowledgement",
    "summarize_advisory_review_queue",
]


_DOCS_PREFIX = "src/content/docs/"
_MD_EXT_RE = re.compile(r"\.md$")


def is_advisory_review_candidate(issue: Any) -> bool:
    """``segment-inconclusive`` かつ ``inconclusiveCategory='tokenless-near-tie'`` なら True。"""
    if not isinstance(issue, Mapping):
        return False
    return (
        issue.get("type") == "segment-inconclusive"
        and issue.get("inconclusiveCategory") == "tokenless-near-tie"
    )


def is_valid_advisory_acknowledgement(issue: Any) -> bool:
    """acknowledged=True かつ ackExpired が True でなければ True (mjs 等価)。"""
    if not isinstance(issue, Mapping):
        return False
    return issue.get("acknowledged") is True and issue.get("ackExpired") is not True


def is_blocking_advisory_review_issue(issue: Any) -> bool:
    """baseline / ack で覆われていない advisory issue を blocking と判定。"""
    if not isinstance(issue, Mapping):
        return False
    return issue.get("baselined") is not True and not is_valid_advisory_acknowledgement(issue)


def _normalize_finite_number(value: Any) -> float | int | None:
    """``number`` かつ ``Number.isFinite`` が true な値だけ通す (mjs 等価)。

    mjs では ``NaN`` / ``Infinity`` を除外する。Python でも ``float('nan')`` /
    ``float('inf')`` を除外する必要がある。``bool`` は ``isinstance(x, int)``
    で True になるが mjs の ``typeof x === 'number'`` は true なので通す
    (bool も number サブクラスとして許容)。
    """
    if isinstance(value, bool):
        # mjs ``typeof true === 'boolean'`` なので number としては扱われない
        return None
    if isinstance(value, (int, float)):
        if isinstance(value, float) and (value != value or value in (float("inf"), float("-inf"))):
            return None
        return value
    return None


def _normalize_section_path(value: Any) -> str | None:
    """非空 str のみ通す (mjs ``value.length > 0`` 等価)。"""
    if isinstance(value, str) and len(value) > 0:
        return value
    return None


def _normalize_issue_meta(issue: Mapping[str, Any]) -> dict[str, Any] | None:
    """``inconclusiveMeta`` を normalize する。全 field が空なら ``None``。"""
    raw = issue.get("inconclusiveMeta")
    if not isinstance(raw, Mapping):
        return None

    left_section_path = _normalize_section_path(raw.get("leftSectionPath"))
    right_section_path = _normalize_section_path(raw.get("rightSectionPath"))
    current_score = _normalize_finite_number(raw.get("currentScore"))
    swap_score = _normalize_finite_number(raw.get("swapScore"))

    if (
        left_section_path is None
        and right_section_path is None
        and current_score is None
        and swap_score is None
    ):
        return None

    return {
        "leftSectionPath": left_section_path,
        "rightSectionPath": right_section_path,
        "currentScore": current_score,
        "swapScore": swap_score,
    }


def _file_to_slug(file: Any) -> str | None:
    """``file`` path から slug を導出する (mjs ``fileToSlug`` 等価)。"""
    if not isinstance(file, str) or len(file) == 0:
        return None
    if file.startswith(_DOCS_PREFIX):
        return _MD_EXT_RE.sub("", file[len(_DOCS_PREFIX) :])
    return _MD_EXT_RE.sub("", file)


def build_advisory_queue_issue_key(slug: str | None, issue: Mapping[str, Any] | None) -> str:
    """queue 内で issue を uniq 識別する key を組み立てる (mjs 等価)。

    key 形式: ``<slug>|<type>|category=<category>[|pair=<left>=><right>]``。
    """
    meta = _normalize_issue_meta(issue) if isinstance(issue, Mapping) else None
    parts: list[str] = [
        slug if slug is not None else "_unknown-slug_",
        (issue.get("type") if isinstance(issue, Mapping) else None) or "_unknown-type_",
        "category="
        + (
            (issue.get("inconclusiveCategory") if isinstance(issue, Mapping) else None)
            or "_unknown-category_"
        ),
    ]
    if meta and (meta.get("leftSectionPath") or meta.get("rightSectionPath")):
        left = meta.get("leftSectionPath") or "_null_"
        right = meta.get("rightSectionPath") or "_null_"
        parts.append(f"pair={left}=>{right}")
    return "|".join(parts)


def _coerce_scope_int(value: Any) -> int:
    """``Number.isInteger(v) && v >= 0`` 互換 (mjs 等価)。non-int / 負値は 0。"""
    if isinstance(value, bool):
        return 0
    if isinstance(value, int) and value >= 0:
        return value
    return 0


def build_advisory_review_scope(
    *,
    total_files: int = 0,
    checked_files: int = 0,
    slug: str | None = None,
    section: str | None = None,
) -> dict[str, Any]:
    """advisory review の scope を組み立てる (mjs 等価)。

    ``slug`` が優先 (非空 str) → ``section`` (非空 str) → ``full`` の順に
    分類する。``filters`` は両方をそのまま保持する。
    """
    resolved_slug = slug if isinstance(slug, str) and len(slug) > 0 else None
    resolved_section = section if isinstance(section, str) and len(section) > 0 else None
    scope_type = "slug" if resolved_slug else ("section" if resolved_section else "full")
    return {
        "type": scope_type,
        "isComplete": resolved_slug is None and resolved_section is None,
        "filters": {"slug": resolved_slug, "section": resolved_section},
        "checkedFiles": _coerce_scope_int(checked_files),
        "totalFiles": _coerce_scope_int(total_files),
    }


def build_advisory_review_queue(results: Iterable[Mapping[str, Any]]) -> list[dict[str, Any]]:
    """``check_source_parity`` per-file results から advisory queue を build (mjs 等価)。

    返り値は ``file`` lexicographic (``localeCompare``) sort 済 list。
    Python の ``sorted(..., key=lambda x: x["file"])`` は ASCII byte 比較なので
    mjs ``localeCompare`` と non-ASCII でずれる可能性があるが、現状 file path は
    ASCII only のため byte 一致する。
    """
    queue: list[dict[str, Any]] = []
    for result in results:
        if not isinstance(result, Mapping):
            continue
        slug = _file_to_slug(result.get("file"))
        issues = result.get("issues") or []
        advisory_source = [issue for issue in issues if is_advisory_review_candidate(issue)]
        advisory_issues: list[dict[str, Any]] = []
        for issue in advisory_source:
            meta = _normalize_issue_meta(issue)
            advisory_issues.append(
                {
                    "queueKey": build_advisory_queue_issue_key(slug, issue),
                    "type": issue["type"],
                    "severity": issue.get("severity"),
                    "inconclusiveCategory": issue.get("inconclusiveCategory"),
                    "inconclusiveReason": issue.get("inconclusiveReason"),
                    "detail": issue.get("detail") or issue.get("text") or "",
                    "leftSectionPath": meta.get("leftSectionPath") if meta else None,
                    "rightSectionPath": meta.get("rightSectionPath") if meta else None,
                    "currentScore": meta.get("currentScore") if meta else None,
                    "swapScore": meta.get("swapScore") if meta else None,
                    "baselined": issue.get("baselined") is True,
                    "acknowledged": issue.get("acknowledged") is True,
                    "ackExpired": issue.get("ackExpired") is True,
                }
            )

        if not advisory_issues:
            continue

        queue.append(
            {
                "slug": slug,
                "file": result.get("file"),
                "sourceUrl": result.get("sourceUrl") or "",
                "category": result.get("category") or "",
                "blocking": any(
                    is_blocking_advisory_review_issue(issue) for issue in advisory_source
                ),
                "issueCount": len(advisory_issues),
                "issues": advisory_issues,
            }
        )

    # mjs ``localeCompare`` — ASCII only path のため byte 比較と等価
    queue.sort(key=lambda entry: entry["file"] or "")
    return queue


def summarize_advisory_review_queue(
    queue: Sequence[Mapping[str, Any]],
    scope: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """queue から summary counter を集計する (mjs 等価)。"""
    advisory_queue_by_category: dict[str, int] = {}
    advisory_queue_issues = 0
    for entry in queue:
        for issue in entry.get("issues") or []:
            advisory_queue_issues += 1
            key = issue.get("inconclusiveCategory") or "_unknown_"
            advisory_queue_by_category[key] = advisory_queue_by_category.get(key, 0) + 1

    summary: dict[str, Any] = {
        "advisoryQueueIssues": advisory_queue_issues,
        "advisoryQueueFiles": len(queue),
        "advisoryQueueByCategory": advisory_queue_by_category,
        "advisoryQueueComplete": None,
        "advisoryQueueScopeType": None,
    }
    if isinstance(scope, Mapping):
        summary["advisoryQueueComplete"] = scope.get("isComplete") is True
        summary["advisoryQueueScopeType"] = scope.get("type")
    return summary


def build_advisory_artifacts(
    *,
    results: Sequence[Mapping[str, Any]] = (),
    total_files: int = 0,
    checked_files: int = 0,
    slug: str | None = None,
    section: str | None = None,
    build_queue: Any = None,
) -> dict[str, Any]:
    """scope + queue + summary + error を一括で build (mjs 等価)。

    ``build_queue`` を差し替え可能にして mjs ``buildQueue`` injection と同じ
    dependency injection hook を提供する (test 容易性)。内部で raise した場合は
    error 文字列を ``advisoryQueueError`` に格納し、queue は空に倒す。
    """
    queue_builder = build_queue or build_advisory_review_queue
    advisory_queue_scope = build_advisory_review_scope(
        total_files=total_files,
        checked_files=checked_files,
        slug=slug,
        section=section,
    )
    try:
        advisory_queue = queue_builder(results)
        return {
            "advisoryQueueScope": advisory_queue_scope,
            "advisoryQueue": advisory_queue,
            "advisoryQueueSummary": summarize_advisory_review_queue(
                advisory_queue, advisory_queue_scope
            ),
            "advisoryQueueError": None,
        }
    except Exception as exc:  # mjs の try/catch 相当
        return {
            "advisoryQueueScope": advisory_queue_scope,
            "advisoryQueue": [],
            "advisoryQueueSummary": summarize_advisory_review_queue([], advisory_queue_scope),
            "advisoryQueueError": str(exc),
        }
