"""page coverage gate — page-level completeness 検出 (pure functions)。

``scripts/lib/source_parity_page_coverage.mjs`` の port。filesystem I/O なし。
sidebar slugs / local file slugs / snapshot existence / source freshness を
入力として issue list を返す。

mjs と byte-identical な出力契約 — issue order は sidebar / local / snapshot の
iteration 順を維持する。``conformance/harness.mjs`` 側で set/map の iteration
順を明示的に sort して渡すことで byte-level に安定化させている。
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from typing import TypedDict

from .types import ISSUE_SEVERITY

__all__ = [
    "PageCoverageIssue",
    "check_local_page_orphan",
    "check_missing_snapshot",
    "check_page_coverage",
    "check_single_page_snapshot",
    "check_source_page_missing_local",
]


class PageCoverageIssue(TypedDict):
    """page coverage が emit する issue の shape。mjs と 1:1。"""

    type: str
    detail: str
    severity: str


def _with_severity(issue_type: str, detail: str) -> PageCoverageIssue:
    """mjs ``withSeverity`` 等価 — type から severity を lookup して付与する。"""
    severity = ISSUE_SEVERITY.get(issue_type, "signal")
    return {"type": issue_type, "detail": detail, "severity": severity}


def check_source_page_missing_local(
    sidebar_slugs: Iterable[str],
    local_slugs: Iterable[str],
) -> list[PageCoverageIssue]:
    """sidebar に載っているが local JA file が無い slug を検出する。

    mjs では ``Set`` の iteration 順 = 挿入順。Python ``set`` は順序保持しない
    ため、呼び出し側で順序を sort しておく契約にする (``check_page_coverage``
    同士の順序衝突を防ぐ)。
    """
    local_set = set(local_slugs)
    issues: list[PageCoverageIssue] = []
    for slug in sidebar_slugs:
        if slug not in local_set:
            issues.append(
                _with_severity(
                    "source-page-missing-local",
                    f"EN ソースページがローカルに存在しない: {slug}",
                )
            )
    return issues


def check_local_page_orphan(
    local_slugs: Iterable[str],
    sidebar_slugs: Iterable[str],
) -> list[PageCoverageIssue]:
    """local JA file はあるが EN sidebar に未掲載の slug を orphan として検出。

    mjs は ``sidebarSlugs.size === 0`` のとき fast path で空 list を返す。
    Python 側では ``Iterable`` のまま判定できないので、``set`` 化してから
    空判定する。mjs と同じく sidebar が空なら全 local を orphan にはしない
    (信頼できる sidebar snapshot が無い状態では false positive を出さない)。
    """
    sidebar_set = set(sidebar_slugs)
    if len(sidebar_set) == 0:
        return []
    issues: list[PageCoverageIssue] = []
    for slug in local_slugs:
        if slug not in sidebar_set:
            issues.append(
                _with_severity(
                    "local-page-orphan",
                    f"ローカルファイルが SIDEBAR_URLS.md に未掲載: {slug}",
                )
            )
    return issues


def check_missing_snapshot(
    local_source_urls: Mapping[str, str],
    snapshot_slugs: Iterable[str],
    freshness_state: str | None,
) -> list[PageCoverageIssue]:
    """``sourceUrl`` があるが EN snapshot が無い slug を bulk 検出する。

    severity gate (mjs と等価):

    - ``missing-fresh-snapshot`` (actionable) — freshness が ``fresh`` のとき
    - ``missing-snapshot`` (signal) — それ以外 (``stale`` 含む)

    freshness が fresh でない場合は snapshot 欠落は翻訳者責任外 debt として
    advisory 扱いに降格する (actionable にすると gate を誤爆する)。
    """
    snapshot_set = set(snapshot_slugs)
    is_fresh = freshness_state == "fresh"
    issue_type = "missing-fresh-snapshot" if is_fresh else "missing-snapshot"
    issues: list[PageCoverageIssue] = []
    # mjs は ``for (const [slug] of localSourceUrls)`` で key のみ iterate。
    # Map の iteration 順 = 挿入順。Python dict も 3.7+ で挿入順保証なので
    # 同じ iteration 順になる。
    for slug in local_source_urls:
        if slug in snapshot_set:
            continue
        issues.append(
            _with_severity(
                issue_type, f"sourceUrl があるが EN スナップショットが存在しない: {slug}"
            )
        )
    return issues


def check_single_page_snapshot(
    slug: str,
    source_url: str | None,
    snapshot_slugs: Iterable[str],
    freshness_state: str | None,
) -> list[PageCoverageIssue]:
    """``--slug`` single-page mode 用。1 ページの snapshot 有無を判定する。

    ``source_url`` が falsy なら空 list を返す (sourceUrl が無いページは
    snapshot-missing の対象外)。
    """
    if not source_url:
        return []
    snapshot_set = set(snapshot_slugs)
    if slug in snapshot_set:
        return []
    is_fresh = freshness_state == "fresh"
    issue_type = "missing-fresh-snapshot" if is_fresh else "missing-snapshot"
    return [
        _with_severity(issue_type, f"sourceUrl があるが EN スナップショットが存在しない: {slug}")
    ]


def check_page_coverage(
    *,
    sidebar_slugs: Iterable[str],
    local_slugs: Iterable[str],
    local_source_urls: Mapping[str, str],
    snapshot_slugs: Iterable[str],
    freshness_state: str | None,
) -> list[PageCoverageIssue]:
    """全 page coverage gate を実行して issue を連結して返す (mjs 等価)。"""
    return [
        *check_source_page_missing_local(sidebar_slugs, local_slugs),
        *check_local_page_orphan(local_slugs, sidebar_slugs),
        *check_missing_snapshot(local_source_urls, snapshot_slugs, freshness_state),
    ]
