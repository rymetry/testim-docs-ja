"""EN 側 artifact registry (slug-scope, token) + runtime coverage 集計器。

``scripts/lib/parity_artifact_registry.mjs`` の port。EN ページ固有の artifact
(self-index link、demo placeholder link 等) で、JA 側で修復不可能なものを
``(slug, token)`` ペアで記録し、``segment-token-gap`` の検出を抑止するための静的
レジストリ。literal 照合のみ — glob / regex は使わない。

契約:

* registry は frozen (tuple of frozen dict)。
* :func:`is_artifact_excluded` は pure / 副作用なし。
* :func:`create_artifact_coverage` は ``record`` / ``snapshot`` を持つ dict を返し、
  mjs 集計器と同じ形状にする。:data:`NOOP_COVERAGE` は coverage 集計不要な呼び出し
  側のデフォルト。
"""

from __future__ import annotations

from types import MappingProxyType
from typing import Any

# 初期 entries — Task 4.1 inventory (2026-04-15)。``slugs`` frozenset と外側の
# MappingProxyType で、意図しない runtime mutation をエラーにする。
# ``slugs`` は **tuple** で保持する (mjs は Array、JSON serialize 可能にするため
# frozenset は避ける)。膜判定は ``slug in entry["slugs"]`` で O(n) だが、現行
# registry は 2 entry × 最大 7 slug なので実用上問題ない。
_ENTRY_1: MappingProxyType[str, Any] = MappingProxyType(
    {
        "slugs": (
            "editing-tests/conditions/advanced-conditions-settings",
            "integrations/visual-validation/visual_validation_index",
            "recording-tests/recording-a-mobile-test/recording-a-local-mobile-test",
            "salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce",
            "salesforce-testing/salesforce-steps/sfdc-step-login",
            "testops/insights/dashboard",
            "testops/insights/reports",
        ),
        "token": "/docs/index",
        "reason": "en-side-self-index-link-artifact",
        "note": "EN ページ内 self-link (/docs/index) の artifact",
        "expectedIssueType": "segment-token-gap",
        "addedAt": "2026-04-15",
        "linkedIssue": None,
    }
)

_ENTRY_2: MappingProxyType[str, Any] = MappingProxyType(
    {
        "slugs": ("getting-started/creating-your-first-codeless-test",),
        "token": "http://google.com",
        "reason": "en-side-demo-link-artifact",
        "note": 'EN 側 demo.testim.io の例示用 <a href="http://google.com">',
        "expectedIssueType": "segment-token-gap",
        "addedAt": "2026-04-15",
        "linkedIssue": None,
    }
)

ARTIFACT_REGISTRY: tuple[MappingProxyType[str, Any], ...] = (_ENTRY_1, _ENTRY_2)


def is_artifact_excluded(*, slug: str, token: str) -> bool:
    """``(slug, token)`` が registry の artifact エントリと一致するかを返す。"""
    for entry in ARTIFACT_REGISTRY:
        if slug not in entry["slugs"]:
            continue
        if entry["token"] == token:
            return True
    return False


def registry_entries() -> tuple[MappingProxyType[str, Any], ...]:
    """registry を tuple で返す (エントリ自体は既に frozen)。"""
    return ARTIFACT_REGISTRY


def create_artifact_coverage() -> dict[str, Any]:
    """runtime の抑止 hit を集計する stateful aggregator。"""
    hits: list[dict[str, Any]] = []

    def record(*, slug: str, token: str, reason: str | None = None) -> None:
        hits.append({"slug": slug, "token": token, "reason": reason})

    def snapshot() -> dict[str, Any]:
        by_slug: dict[str, int] = {}
        by_token: dict[str, int] = {}
        for hit in hits:
            by_slug[hit["slug"]] = by_slug.get(hit["slug"], 0) + 1
            by_token[hit["token"]] = by_token.get(hit["token"], 0) + 1
        return {
            "registryEntries": len(ARTIFACT_REGISTRY),
            "matchedHits": len(hits),
            "bySlug": by_slug,
            "byToken": by_token,
        }

    return {"record": record, "snapshot": snapshot}


def _noop_record(*, slug: str, token: str, reason: str | None = None) -> None:
    del slug, token, reason  # 未使用警告を抑止


def _noop_snapshot() -> dict[str, Any]:
    return {
        "registryEntries": len(ARTIFACT_REGISTRY),
        "matchedHits": 0,
        "bySlug": {},
        "byToken": {},
    }


NOOP_COVERAGE: MappingProxyType[str, Any] = MappingProxyType(
    {"record": _noop_record, "snapshot": _noop_snapshot}
)


__all__ = [
    "ARTIFACT_REGISTRY",
    "is_artifact_excluded",
    "registry_entries",
    "create_artifact_coverage",
    "NOOP_COVERAGE",
]
