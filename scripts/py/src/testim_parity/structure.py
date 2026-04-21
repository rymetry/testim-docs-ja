"""Section 単位の canonical block sequence comparator (``source_parity_structure.mjs`` port)。

3 段階で section body を比較し、最大 1 件の diff を返す:

- Stage A (kind-multiset): block kind の集合差 → ``section-structure-mismatch``
- Stage B (kind-sequence): multiset 一致 / 並び差 → ``segment-order-mismatch``
- Stage C (content-order): kind 列一致 / 内容再配列 → ``segment-order-mismatch``

どの stage も発火しなければ空 list を返し、呼び出し側は既存の weighted LCS
に流す。純粋関数のみ — 入力を決して mutate しない。

mjs と byte-identical な diff payload 契約 — ``STRUCTURE_COMPARATOR_KINDS``
/ ``enKinds`` / ``structureCategory`` / ``contentPermutation`` は
``baseline.py::compute_structure_fingerprint`` (Phase 3 M5) で identity key
に hash される。rename / reorder / 削除は破壊的変更で baseline match を
silently 壊すので schemaVersion bump とセットで行うこと。
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from .align_scoring import score_segment_match

__all__ = [
    "STRUCTURE_COMPARATOR_KINDS",
    "collapse_body_to_blocks",
    "compare_section_structure",
]


# FROZEN 語彙 — baseline identity hash に入るため変更禁止
STRUCTURE_COMPARATOR_KINDS: tuple[str, ...] = (
    "paragraph",
    "ordered-list",
    "unordered-list",
    "callout-body",
    "table",
    "details-summary",
)

_STRUCTURE_KIND_SET: frozenset[str] = frozenset(STRUCTURE_COMPARATOR_KINDS)

# canonical extractor の segment kind → structure comparator の block kind
_SEGMENT_TO_BLOCK_KIND: dict[str, str] = {
    "paragraph": "paragraph",
    "ordered-list-item": "ordered-list",
    "unordered-list-item": "unordered-list",
    "callout-body": "callout-body",
    "table-cell": "table",
    "details-summary": "details-summary",
}

# 畳み可能 (連続すれば 1 block に纏める) な source kind 集合
_COLLAPSIBLE_SOURCE_KINDS: frozenset[str] = frozenset(
    {"ordered-list-item", "unordered-list-item", "table-cell"}
)

# Stage C の content bijection 用スコア下限。tokenless weak-position レンジより
# 上に保つ必要がある (invariant token 根拠なしに swap を推測しない契約)。
_CONTENT_ORDER_MIN_SCORE = 100


def _get_segment_kind(segment: Any) -> str | None:
    """dict / object どちらでも ``segmentKind`` を取り出す。"""
    if isinstance(segment, dict):
        return segment.get("segmentKind")
    return getattr(segment, "segmentKind", None)


def collapse_body_to_blocks(body: Sequence[Any]) -> list[dict[str, Any]]:
    """section body を block 列に畳む (mjs ``collapseBodyToBlocks`` 等価)。

    同種の collapsible segment が連続していれば 1 block に纏める。畳み不可 segment
    は 1:1 で block になる。``_SEGMENT_TO_BLOCK_KIND`` に無い kind は structure
    語彙の対象外なのでここで落とす。

    返り値の各 block は ``{kind, segments}`` — mjs と同じ外向き API (``sourceKind``
    は内部判別用で返り値には出さない)。
    """
    if not isinstance(body, Sequence) or len(body) == 0:
        return []

    blocks: list[dict[str, Any]] = []
    for seg in body:
        seg_kind = _get_segment_kind(seg)
        if seg_kind is None:
            continue
        block_kind = _SEGMENT_TO_BLOCK_KIND.get(seg_kind)
        if block_kind is None:
            continue

        if seg_kind in _COLLAPSIBLE_SOURCE_KINDS:
            if (
                blocks
                and blocks[-1]["kind"] == block_kind
                and blocks[-1].get("_sourceKind") == seg_kind
            ):
                blocks[-1]["segments"].append(seg)
                continue
            blocks.append({"kind": block_kind, "_sourceKind": seg_kind, "segments": [seg]})
        else:
            blocks.append({"kind": block_kind, "_sourceKind": seg_kind, "segments": [seg]})

    # _sourceKind は内部判別用なので外向き API から落とす
    return [{"kind": block["kind"], "segments": block["segments"]} for block in blocks]


def _build_multiset(items: Sequence[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for item in items:
        counts[item] = counts.get(item, 0) + 1
    return counts


def _multisets_equal(a: dict[str, int], b: dict[str, int]) -> bool:
    if len(a) != len(b):
        return False
    return all(b.get(key) == count for key, count in a.items())


def _sequences_equal(a: Sequence[str], b: Sequence[str]) -> bool:
    if len(a) != len(b):
        return False
    return all(a[i] == b[i] for i in range(len(a)))


def _detect_content_order_permutation(
    en_blocks: Sequence[dict[str, Any]], ja_blocks: Sequence[dict[str, Any]]
) -> list[dict[str, Any]] | None:
    """block 代表 segment の全ペア score で greedy bijection を作る (mjs 等価)。

    呼び出し側が ``en_kinds == ja_kinds`` を保証している前提で動く。強い
    bijection が成立し identity 順列でない場合に permutation を返す。それ以外
    は ``None`` (LCS フォールスルー)。
    """
    n = len(en_blocks)
    if n < 2 or n != len(ja_blocks):
        return None

    en_reps = [block["segments"][0] if block["segments"] else None for block in en_blocks]
    ja_reps = [block["segments"][0] if block["segments"] else None for block in ja_blocks]
    if any(rep is None for rep in en_reps) or any(rep is None for rep in ja_reps):
        return None

    # 全ペアスコア表。score_segment_match は segmentKind 一致前提で、kind 列が
    # 同じなので同一 index ペアは自然に満たす。
    scores: list[list[float]] = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            scores[i][j] = score_segment_match(en_reps[i], ja_reps[j], i, j, n, n)

    candidates: list[dict[str, Any]] = []
    for i in range(n):
        for j in range(n):
            if scores[i][j] >= _CONTENT_ORDER_MIN_SCORE:
                candidates.append({"enIndex": i, "jaIndex": j, "score": scores[i][j]})

    candidates.sort(key=lambda c: c["score"], reverse=True)

    permutation: list[dict[str, Any]] = []
    used_en: set[int] = set()
    used_ja: set[int] = set()
    for cand in candidates:
        if cand["enIndex"] in used_en or cand["jaIndex"] in used_ja:
            continue
        permutation.append(cand)
        used_en.add(cand["enIndex"])
        used_ja.add(cand["jaIndex"])
        if len(permutation) == n:
            break

    if len(permutation) != n:
        return None

    permutation.sort(key=lambda p: p["enIndex"])
    is_identity = all(
        permutation[i]["enIndex"] == permutation[i]["jaIndex"] for i in range(len(permutation))
    )
    if is_identity:
        return None

    return permutation


def _describe_kind_sequence(kinds: Sequence[str]) -> str:
    if len(kinds) == 0:
        return "(empty)"
    return " → ".join(kinds)


def _build_base_diff(
    *,
    issue_type: str,
    section: dict[str, Any],
    en_kinds: list[str],
    ja_kinds: list[str],
    structure_category: str,
    detail: str,
) -> dict[str, Any]:
    """diff payload の共通 shape を組み立てる (mjs と field 順を揃える)。"""
    return {
        "type": issue_type,
        "severity": "actionable",
        "scope": "section",
        "sectionPath": section.get("sectionPath"),
        "sectionIndex": section.get("index"),
        "structureCategory": structure_category,
        "enKinds": en_kinds,
        "jaKinds": ja_kinds,
        "enSegmentCount": len(en_kinds),
        "jaSegmentCount": len(ja_kinds),
        "detail": detail,
    }


def _build_kind_multiset_diff(
    en_section: dict[str, Any], en_kinds: list[str], ja_kinds: list[str]
) -> dict[str, Any]:
    section_path = en_section.get("sectionPath") or "(preface)"
    detail = (
        f'Section "{section_path}" block structure differs: '
        f"EN=[{_describe_kind_sequence(en_kinds)}] vs JA=[{_describe_kind_sequence(ja_kinds)}]"
    )
    return _build_base_diff(
        issue_type="section-structure-mismatch",
        section=en_section,
        en_kinds=en_kinds,
        ja_kinds=ja_kinds,
        structure_category="kind-multiset",
        detail=detail,
    )


def _build_kind_sequence_diff(
    en_section: dict[str, Any], en_kinds: list[str], ja_kinds: list[str]
) -> dict[str, Any]:
    section_path = en_section.get("sectionPath") or "(preface)"
    detail = (
        f'Section "{section_path}" block kinds reordered: '
        f"EN=[{_describe_kind_sequence(en_kinds)}] vs JA=[{_describe_kind_sequence(ja_kinds)}]"
    )
    return _build_base_diff(
        issue_type="segment-order-mismatch",
        section=en_section,
        en_kinds=en_kinds,
        ja_kinds=ja_kinds,
        structure_category="kind-sequence",
        detail=detail,
    )


def _build_content_order_diff(
    en_section: dict[str, Any],
    en_kinds: list[str],
    ja_kinds: list[str],
    permutation: list[dict[str, Any]],
) -> dict[str, Any]:
    section_path = en_section.get("sectionPath") or "(preface)"
    perm_desc = ", ".join(
        f"{p['enIndex']}->{p['jaIndex']}" for p in sorted(permutation, key=lambda p: p["enIndex"])
    )
    detail = f'Section "{section_path}" blocks reordered by content: {perm_desc}'
    base = _build_base_diff(
        issue_type="segment-order-mismatch",
        section=en_section,
        en_kinds=en_kinds,
        ja_kinds=ja_kinds,
        structure_category="content-order",
        detail=detail,
    )
    base["contentPermutation"] = permutation
    return base


def compare_section_structure(
    en_section: dict[str, Any] | None, ja_section: dict[str, Any] | None
) -> list[dict[str, Any]]:
    """ペアになった EN/JA section body を比較して diff を最大 1 件返す (mjs 等価)。

    Stage A → Stage B → Stage C の順に評価し、先に発火した stage が勝つ。
    片側 body=0 のときは LCS にフォールスルー (segment-missing/extra で
    per-segment drill-down を保つ)。未知 block kind は ``ValueError`` を raise。
    """
    if en_section is None or ja_section is None:
        return []

    en_blocks = collapse_body_to_blocks(en_section.get("body") or [])
    ja_blocks = collapse_body_to_blocks(ja_section.get("body") or [])

    en_kinds = [block["kind"] for block in en_blocks]
    ja_kinds = [block["kind"] for block in ja_blocks]

    for kind in [*en_kinds, *ja_kinds]:
        if kind not in _STRUCTURE_KIND_SET:
            raise ValueError(
                f'compare_section_structure: unexpected block kind "{kind}" '
                "(must be one of STRUCTURE_COMPARATOR_KINDS)"
            )

    if len(en_blocks) == 0 or len(ja_blocks) == 0:
        return []

    en_multiset = _build_multiset(en_kinds)
    ja_multiset = _build_multiset(ja_kinds)
    if not _multisets_equal(en_multiset, ja_multiset):
        return [_build_kind_multiset_diff(en_section, en_kinds, ja_kinds)]

    if not _sequences_equal(en_kinds, ja_kinds):
        return [_build_kind_sequence_diff(en_section, en_kinds, ja_kinds)]

    permutation = _detect_content_order_permutation(en_blocks, ja_blocks)
    if permutation:
        return [_build_content_order_diff(en_section, en_kinds, ja_kinds, permutation)]

    return []
