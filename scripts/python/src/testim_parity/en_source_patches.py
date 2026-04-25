"""EN source-boundary patch registry + runtime coverage 集計器。

Route W (Plan v4, 2026-04-17) は ``preprocess_en_html`` 境界で壊れた EN snapshot を
修復し、extractor / alignSegments / turndown 相当が単一の canonical HTML を見るように
する。各 patch は pre-turndown HTML への literal ``find → replace`` で、slug allowlist
にスコープされる。

## Source of truth — ``_en_source_patches_data.json``

**``_en_source_patches_data.json`` が唯一の authoritative source** (Phase 6b cutover
以降)。mjs ``scripts/lib/en_source_patches.mjs`` は削除済で、以降 Python module と
JSON が 1:1 対応する。JSON を直接編集 (VSCode の JSON editor / 手書き) することで
patch を追加・更新する。700+ 行の HTML fragment を Python dict に inline 化すると
編集性が激しく落ちるため、JSON で保持する。

### Schema (``_en_source_patches_data.json``)

```jsonc
{
  "defectClasses": ["typo", "href-miswire", "madcap-artifact", "stale-reference"],
  "patches": [
    {
      "id": "UD-XXXN-slug-style-id",         // unique patch id (kebab-case)
      "slugs": ["category/slug-one", ...],   // target slug allowlist
      "defectClass": "typo",                 // defectClasses のいずれか
      "find": "<p>Verify -this action",      // literal HTML fragment
      "replace": "<p>Verify - this action",  // 置換後の literal
      "rationale": "MadCap authoring typo ...",  // 人間向け説明
      "linkedDefect": "docs/UPSTREAM_DEFECTS.md#UD-001",  // tracker link
      "addedAt": "2026-04-17",               // ISO date
      "reviewAfter": "2026-10-17"            // 6-month review due date
    }
  ]
}
```

### Validation

``testim_parity.tools.validate_en_source_patches`` を run することで JSON schema
+ business rule (``find`` が非空 / ``slugs`` が非空 list / ``addedAt`` が ISO8601 date /
``defectClass`` が allowlist 内) を検証できる。CI ``python-fast`` job の required step
に登録済。

### 契約

* Python からは registry は immutable (frozen dict の tuple、``MappingProxyType`` wrap)。
* :func:`apply_en_source_patches` は引数に副作用なし (``replace.join(split)`` で
  新 string を返す)。
* coverage のみ stateful (呼び出し側が ``create_en_source_patch_coverage`` を渡す)。
* :data:`DEFECT_CLASSES` は 4 種類の allowlist — それ以外は reviewer gate / machine
  check で reject する。

### 更新手順

1. ``_en_source_patches_data.json`` を編集 (新 patch 追加 / 既存 patch 修正)
2. ``uv run python -m testim_parity.tools.validate_en_source_patches`` で schema
   + business rule 検証
3. ``uv run pytest tests/test_en_source_patches.py`` で unit test regression check
4. ``docs/UPSTREAM_DEFECTS.md`` の ``linkedDefect`` 先に ``reviewAfter`` を追記
5. PR で reviewer gate (``defectClass`` allowlist + 6-month review rule を assert)
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from types import MappingProxyType
from typing import Any

_DATA_PATH = Path(__file__).with_name("_en_source_patches_data.json")
_log = logging.getLogger(__name__)


def _load_all() -> tuple[tuple[str, ...], tuple[MappingProxyType[str, Any], ...]]:
    """JSON ファイルを 1 回だけ読み、defect_classes と patch registry を同時に返す。"""
    with _DATA_PATH.open("r", encoding="utf-8") as fh:
        data = json.load(fh)

    defect_classes = tuple(data["defectClasses"])

    patches: list[MappingProxyType[str, Any]] = []
    for entry in data["patches"]:
        # ``slugs`` を tuple に、外側を MappingProxyType でラップして collection /
        # mapping の両方を read-only にする。
        patches.append(
            MappingProxyType(
                {
                    "id": entry["id"],
                    "slugs": tuple(entry["slugs"]),
                    "defectClass": entry["defectClass"],
                    "find": entry["find"],
                    "replace": entry["replace"],
                    "rationale": entry["rationale"],
                    "linkedDefect": entry["linkedDefect"],
                    "addedAt": entry["addedAt"],
                    "reviewAfter": entry["reviewAfter"],
                }
            )
        )
    return defect_classes, tuple(patches)


DEFECT_CLASSES, EN_SOURCE_PATCHES = _load_all()


def count_occurrences(haystack: str, needle: str) -> int:
    """``haystack`` 内の ``needle`` の非オーバーラップな literal 出現数を数える。

    regex メタ文字を使わない。mjs helper と同じく split で実装してあるので、
    overlap する pattern も同様に畳まれる。
    """
    if not isinstance(haystack, str) or not isinstance(needle, str) or len(needle) == 0:
        return 0
    return len(haystack.split(needle)) - 1


def registry_entries() -> tuple[MappingProxyType[str, Any], ...]:
    """registry 全体を tuple で返す (エントリ自体は frozen 済)。"""
    return EN_SOURCE_PATCHES


def _seed_by_patch_id_status() -> dict[str, dict[str, Any]]:
    return {patch["id"]: {"matched": False, "hits": 0} for patch in EN_SOURCE_PATCHES}


def apply_en_source_patches(html: str, slug: str, coverage: Any | None = None) -> str:
    """``html`` に対して ``slug`` が該当する patch を literal replace で全適用する。

    非該当 slug は no-op。``find`` が見つからない patch は ``coverage`` に mismatch を
    記録し (fail-open — raw HTML を返す)、human 向けに warning を出す。patch は
    idempotent かつ order-independent であることが契約。
    """
    if not isinstance(html, str):
        raise TypeError(f"apply_en_source_patches expected html str, got {type(html).__name__}")
    if not isinstance(slug, str) or len(slug) == 0:
        return html

    cov = coverage if coverage is not None else NOOP_PATCH_COVERAGE
    current = html
    for patch in EN_SOURCE_PATCHES:
        if slug not in patch["slugs"]:
            continue
        hits = count_occurrences(current, patch["find"])
        if hits == 0:
            cov["recordMismatch"](slug=slug, patchId=patch["id"], reason="find-not-found")
            _log.warning(
                "[en_source_patches] find-not-found for patch=%s slug=%s "
                "(upstream may have fixed the defect or HTML shape changed)",
                patch["id"],
                slug,
            )
            continue
        current = patch["replace"].join(current.split(patch["find"]))
        cov["recordHit"](slug=slug, patchId=patch["id"], hits=hits)
    return current


def create_en_source_patch_coverage() -> dict[str, Any]:
    """patch hit / mismatch を run 単位で集計する stateful aggregator。"""
    hits_list: list[dict[str, Any]] = []
    mismatches: list[dict[str, Any]] = []

    def _record_hit(*, slug: str, patchId: str, hits: int) -> None:  # noqa: N803 — mjs API 互換
        hits_list.append({"slug": slug, "patchId": patchId, "hits": hits})

    def _record_mismatch(*, slug: str, patchId: str, reason: str) -> None:  # noqa: N803
        mismatches.append({"slug": slug, "patchId": patchId, "reason": reason})

    def snapshot() -> dict[str, Any]:
        by_patch_id: dict[str, int] = {}
        by_patch_id_status: dict[str, dict[str, Any]] = _seed_by_patch_id_status()
        by_slug: dict[str, int] = {}
        matched_hits = 0
        for hit in hits_list:
            matched_hits += hit["hits"]
            by_patch_id[hit["patchId"]] = by_patch_id.get(hit["patchId"], 0) + hit["hits"]
            by_slug[hit["slug"]] = by_slug.get(hit["slug"], 0) + hit["hits"]
            status = by_patch_id_status.get(hit["patchId"])
            if status is None:
                # 防御的: 現行 registry に存在しない patchId への hit。byPatchIdStatus
                # に drift 可視化のために残す。
                by_patch_id_status[hit["patchId"]] = {"matched": True, "hits": hit["hits"]}
            else:
                status["matched"] = True
                status["hits"] += hit["hits"]
        return {
            "registryEntries": len(EN_SOURCE_PATCHES),
            "matchedHits": matched_hits,
            "byPatchId": dict(by_patch_id),
            "byPatchIdStatus": {k: dict(v) for k, v in by_patch_id_status.items()},
            "bySlug": dict(by_slug),
            "mismatches": [dict(m) for m in mismatches],
        }

    return {
        "recordHit": _record_hit,
        "recordMismatch": _record_mismatch,
        "snapshot": snapshot,
    }


def _noop_record_hit(*, slug: str, patchId: str, hits: int) -> None:  # noqa: N803 — mjs API 互換
    del slug, patchId, hits


def _noop_record_mismatch(*, slug: str, patchId: str, reason: str) -> None:  # noqa: N803
    del slug, patchId, reason


def _noop_snapshot() -> dict[str, Any]:
    return {
        "registryEntries": len(EN_SOURCE_PATCHES),
        "matchedHits": 0,
        "byPatchId": {},
        "byPatchIdStatus": _seed_by_patch_id_status(),
        "bySlug": {},
        "mismatches": [],
    }


NOOP_PATCH_COVERAGE: MappingProxyType[str, Any] = MappingProxyType(
    {
        "recordHit": _noop_record_hit,
        "recordMismatch": _noop_record_mismatch,
        "snapshot": _noop_snapshot,
    }
)


__all__ = [
    "DEFECT_CLASSES",
    "EN_SOURCE_PATCHES",
    "count_occurrences",
    "registry_entries",
    "apply_en_source_patches",
    "create_en_source_patch_coverage",
    "NOOP_PATCH_COVERAGE",
]
