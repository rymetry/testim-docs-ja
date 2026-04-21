"""Source-Side Debt Exclusion Registry (``source_sync_exclusions.mjs`` port)。

EN upstream 側が broken で parity comparator の前提を満たさない page を明示的に
管理する registry。自動除外は一切しない — 人間が upstream broken と確認した slug
だけ registry に追加する (false-negative 回避)。

registry に登録されたページは:

- ``snapshot_update`` は fetch するが snapshot file を上書きしない
- fetch 結果に対して EN-only recovery probe を実行する
- ``source-sync-status.json`` で ``fetchStatus: 'excluded-broken'`` /
  ``'excluded-recovered'`` として可視化される
- freshness 計算からは除外される (= debt だけ残っても fresh のまま)

復旧候補 (``excluded-recovered``) になっても自動で registry から削除しない。
人間が確認して registry entry を削除するのが運用。

新規 entry 追加の手順:

1. upstream が broken であることを人間が目視確認する
2. ``SOURCE_SYNC_EXCLUSIONS`` に entry を追加する
3. ``expectedIssueType`` / ``expectedReason`` は EN-only recovery probe の
   判定に使用される。detector が理解する reason
   (``extractor-empty`` / ``shallow-snapshot`` / ``escaped-details-residue``)
   のみ recovery 判定対象で、それ以外や extractor 例外は fail-close で
   ``excluded-broken`` に倒す

mjs 側と同じ dict shape を保持する。conformance harness 経由で byte-identical を
保証するため、key 順序と value 型は mjs と揃える。
"""

from __future__ import annotations

from types import MappingProxyType
from typing import Any

__all__ = [
    "SOURCE_SYNC_EXCLUSIONS",
    "get_exclusion",
    "is_source_side_debt",
    "list_source_side_debt_slugs",
]


# mjs ``SOURCE_SYNC_EXCLUSIONS`` と 1:1。新規追加時は両側を同じ PR で更新する。
# MappingProxyType で read-only 化 (mjs ``Object.freeze`` 相当)。value 側の dict は
# ``get_exclusion`` が shallow copy して返すため外部コードが mutate しても
# registry 本体は影響を受けない。
_REGISTRY: dict[str, dict[str, Any]] = {
    "testops/testops-version-control/pull-requests": {
        "reason": "broken-upstream-source",
        "note": (
            "EN live HTML collapses the full article body into a single <code> block "
            'inside <div class="codeSnippet">. The MadCap Flare extractor produces 0 '
            "body segments, so the parity comparator cannot align sections. A hand-authored "
            "snapshot can keep parity checks stable, but every snapshot fetch would overwrite "
            "that fix. Registered here so snapshot_update stops overwriting "
            "the frozen reference file."
        ),
        "expectedIssueType": "snapshot-incomplete",
        "expectedReason": "extractor-empty",
        "addedAt": "2026-04-09",
        "reviewAfter": "2026-10-09",
        "linkedIssue": 247,
    },
}

SOURCE_SYNC_EXCLUSIONS: MappingProxyType[str, dict[str, Any]] = MappingProxyType(_REGISTRY)


def is_source_side_debt(slug: Any) -> bool:
    """slug が registry に登録されていれば true。``str`` 非空のみ許容。"""
    if not isinstance(slug, str) or len(slug) == 0:
        return False
    return slug in _REGISTRY


def get_exclusion(slug: Any) -> dict[str, Any] | None:
    """slug の registry entry を shallow copy で返す。未登録なら ``None``。

    戻り値を mutate しても registry 本体は影響を受けない (mjs と同じ契約)。
    """
    if not isinstance(slug, str) or len(slug) == 0:
        return None
    entry = _REGISTRY.get(slug)
    if entry is None:
        return None
    return dict(entry)


def list_source_side_debt_slugs() -> list[str]:
    """登録済み slug を sort 済み list で返す (mjs ``Object.keys().sort()`` 等価)。"""
    return sorted(_REGISTRY.keys())
