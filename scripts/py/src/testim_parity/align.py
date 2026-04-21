"""Section 単位で canonical segment の exact diff を計算する (``source_parity_align.mjs`` port)。

EN segment 列と JA segment 列を比較し、最小差分を ``ParityDiff`` として返す:

- ``segment-missing``      EN にあり JA に無い body segment
- ``segment-extra``        JA にあり EN に無い body segment
- ``segment-shifted``      section body が別 section と入れ替わった強い証拠
- ``segment-untranslated`` JA segment がまだ英語のまま残っている
- ``segment-token-gap``    対応する JA segment に EN invariant token が欠ける

処理の流れ:

1. gate 対象 kind と ``heading`` だけを残す
2. heading 境界で section に分割 (先頭は preface)
3. section 数が合わなければ cascade を避けるため ``inconclusive`` にする
4. 各 (en, ja) section で cross-section の token 証拠を見て body swap 判定
5. それ以外は重み付き LCS で section 内の対応付けを作る
6. unmatched EN body → ``segment-missing``、JA body → ``segment-extra`` /
   ``segment-untranslated``
7. 対応付いた pair は invariant token 欠落を ``segment-token-gap`` として出す

heading 自体は個別 diff せず section 境界としてだけ使う。純粋関数 —
入力を mutate しない。

mjs と byte-identical な diff payload を返す契約 — ``baseline.py`` の
identity hash で ``sectionIndex`` / ``segmentKind`` / ``enSegmentIndex`` 等を
使うため、key 順序と値型を揃えること。
"""

from __future__ import annotations

from collections.abc import Iterable, Sequence
from typing import Any

from .align_scoring import score_segment_match
from .artifact_registry import NOOP_COVERAGE, is_artifact_excluded
from .glossary_mask import classify_segment
from .normalize import normalize_segment_tokens
from .segments_shared import GATE_ELIGIBLE_KINDS
from .structure import compare_section_structure

__all__ = [
    "ALIGN_OUTPUT_SCHEMA_VERSION",
    "align_segments",
    "parity_diffs_to_issues",
]


# architect L2 指摘対応: ``align_segments`` の return shape を固定する schema
# version。``baseline.py`` (Phase 3 M5) が identity key に hash する field
# (``sectionIndex`` / ``structureCategory`` / ``enKinds`` / ``jaKinds`` /
# ``contentPermutation``) を破壊的変更する場合は bump し、baseline
# ``schemaVersion`` と同時に migration を組むこと。
ALIGN_OUTPUT_SCHEMA_VERSION = 1


_GATE_KIND_SET: frozenset[str] = frozenset(GATE_ELIGIBLE_KINDS)
_FREE_FORM_KINDS: frozenset[str] = frozenset({"paragraph", "callout-body"})


# ---------------------------------------------------------------------------
# セクション分割 + gate filter
# ---------------------------------------------------------------------------


def _get_attr(seg: Any, name: str, default: Any = None) -> Any:
    """dict / object どちらでも segment の属性を取り出す。

    **architect H3 指摘対応**: Pydantic ``Segment`` (``models.py``) は camelCase
    alias (``segmentKind`` / ``textNorm`` / ``tokensInvariant`` / ``sourceFingerprint``)
    を露出しているため ``getattr`` / ``dict.get`` の両方とも同じ key で動作する。

    **注意**: 将来 Pydantic を ``model_dump(by_alias=False)`` で snake_case 化した
    場合は本関数が silently default を返し segments を空扱いする。その回避策と
    して load-bearing field (``segmentKind``) が None を返したら downstream で
    segmentKind mismatch の alignment diff が出るため、検出はされるが根本原因
    が隠れる。Phase 5 の pipeline wiring で ``Segment.model_dump(by_alias=True)``
    を caller 側の contract にし、それ以外の呼び出しは本関数を通さずに dict 作る
    運用が望ましい。
    """
    if isinstance(seg, dict):
        return seg.get(name, default)
    return getattr(seg, name, default)


def _split_into_sections(segments: Sequence[Any]) -> list[dict[str, Any]]:
    """flat な segment 列を heading 境界で section に分割する (mjs 等価)。"""
    sections: list[dict[str, Any]] = []
    body: list[Any] = []
    section_path = ""
    heading_text = ""

    for seg in segments:
        if _get_attr(seg, "segmentKind") == "heading":
            sections.append(
                {
                    "index": len(sections),
                    "sectionPath": section_path,
                    "headingText": heading_text,
                    "body": body,
                }
            )
            section_path = _get_attr(seg, "sectionPath") or ""
            heading_text = _get_attr(seg, "textNorm") or ""
            body = []
            continue
        body.append(seg)
    sections.append(
        {
            "index": len(sections),
            "sectionPath": section_path,
            "headingText": heading_text,
            "body": body,
        }
    )
    return sections


def _filter_for_alignment(segments: Any) -> list[Any]:
    """gate 対象 kind と heading だけを残す (mjs 等価)。"""
    if not isinstance(segments, Sequence) or isinstance(segments, str):
        return []
    return [
        s
        for s in segments
        if s is not None
        and (
            _get_attr(s, "segmentKind") == "heading"
            or _get_attr(s, "segmentKind") in _GATE_KIND_SET
        )
    ]


# ---------------------------------------------------------------------------
# 重み付き LCS
# ---------------------------------------------------------------------------


def _weighted_lcs(
    a: Sequence[Any],
    b: Sequence[Any],
    score_fn: Any,
) -> list[tuple[int, int]]:
    """2 配列の最大重み単調 alignment を返す (mjs ``weightedLcs`` 等価)。

    概念的には weighted LCS。各候補 pair ``(a[i], b[j])`` の ``score`` に
    基づき、monotonic path 上で score 合計が最大になる対応を選ぶ。boolean
    LCS にせず score-weighted にすることで ``fingerprint > token overlap >
    weak position`` の anchor 階層を表現する。O(n*m)。
    """
    n = len(a)
    m = len(b)
    if n == 0 or m == 0:
        return []

    # score table を事前計算 (score 関数を 2 度呼ばない)
    scores: list[list[float]] = [[0.0] * m for _ in range(n)]
    for i in range(n):
        for j in range(m):
            scores[i][j] = score_fn(a[i], b[j], i, j, n, m)

    # DP table — flat list で mjs Float64Array と等価アクセス
    width = m + 1
    dp: list[float] = [0.0] * ((n + 1) * width)

    neg_inf = float("-inf")
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            here = i * width + j
            s = scores[i - 1][j - 1]
            match_path = dp[here - width - 1] + s if s > 0 else neg_inf
            up_path = dp[here - width]
            left_path = dp[here - 1]
            best = match_path
            if up_path > best:
                best = up_path
            if left_path > best:
                best = left_path
            dp[here] = best

    matched: list[tuple[int, int]] = []
    i, j = n, m
    while i > 0 and j > 0:
        here = i * width + j
        s = scores[i - 1][j - 1]
        if s > 0 and dp[here] == dp[here - width - 1] + s:
            matched.append((i - 1, j - 1))
            i -= 1
            j -= 1
            continue
        up = dp[here - width]
        left = dp[here - 1]
        # python-reviewer MEDIUM M5 指摘対応: mjs の traceback tie-break は
        # ``if (up >= left)`` (up 優先)。Python も同一記号で揃えてある。両 runtime
        # とも等値時に a 側 index を先に進める (= b を skip する) 挙動で、LCS の
        # 標準的な tie-break と一致。288-page corpus conformance で byte-identical
        # が確認済 (Phase 3 M4 test_align_288_matrix)。
        if up >= left:
            i -= 1
        else:
            j -= 1
    matched.reverse()
    return matched


# ---------------------------------------------------------------------------
# token / body 分析
# ---------------------------------------------------------------------------


def _collect_section_tokens(section: dict[str, Any]) -> set[str]:
    """section body の invariant token を union set で返す (mjs 等価)。"""
    tokens: set[str] = set()
    for seg in section["body"]:
        for token in _get_attr(seg, "tokensInvariant") or []:
            tokens.add(token)
    return tokens


def _is_all_free_form_kinds(body: Sequence[Any]) -> bool:
    """body が全て paragraph / callout-body なら True (mjs 等価)。"""
    if len(body) == 0:
        return False
    return all(_get_attr(seg, "segmentKind") in _FREE_FORM_KINDS for seg in body)


def _is_tokenless_body(body: Sequence[Any]) -> bool:
    """body の全 segment に invariant token が無ければ True (mjs 等価)。"""
    if len(body) == 0:
        return False
    return all(len(_get_attr(seg, "tokensInvariant") or []) == 0 for seg in body)


def _pairwise_length_similarity_sum(a: Sequence[Any], b: Sequence[Any]) -> float:
    """body pair の長さ類似度和 (mjs 等価)。

    ``min(len) / max(len)`` を先頭から min(n,m) 件まで加算。一方が空 text なら
    skip する。
    """
    n = min(len(a), len(b))
    total = 0.0
    for k in range(n):
        a_len = len(_get_attr(a[k], "textNorm") or "")
        b_len = len(_get_attr(b[k], "textNorm") or "")
        if a_len == 0 or b_len == 0:
            continue
        total += min(a_len, b_len) / max(a_len, b_len)
    return total


_TOKENLESS_SWAP_AMBIGUITY_RELATIVE_MARGIN = 0.01


# ---------------------------------------------------------------------------
# untranslated 判定
# ---------------------------------------------------------------------------


def _looks_untranslated(segment: Any) -> bool:
    """JA segment が未翻訳英語を含むかを glossary_mask 委譲で判定する (mjs 等価)。

    ``tokensInvariant`` (URL / CLI flag / backtick content) を textNorm から
    後付け除去してから classifier に渡す — invariant 内部の英語 prose が
    segment-untranslated を誤発火させないためのガード。
    """
    if segment is None:
        return False
    text = _get_attr(segment, "textNorm")
    if not isinstance(text, str):
        return False

    tokens = _get_attr(segment, "tokensInvariant") or []
    if not isinstance(tokens, list):
        tokens = []

    for token in tokens:
        if not isinstance(token, str) or len(token) == 0:
            continue
        needle = token.lower()
        if not needle or needle not in text:
            continue
        text = text.replace(needle, " ")

    cls = classify_segment(text)
    return not cls["isFullyMasked"]


# ---------------------------------------------------------------------------
# diff factory
# ---------------------------------------------------------------------------


def _section_label(section_path: Any) -> str:
    return section_path if section_path else "(preface)"


def _diff_missing(section: dict[str, Any], en_seg: Any, en_local_index: int) -> dict[str, Any]:
    return {
        "type": "segment-missing",
        "sectionPath": section["sectionPath"],
        "sectionIndex": section["index"],
        "segmentKind": _get_attr(en_seg, "segmentKind"),
        "enIndex": en_local_index,
        "jaIndex": None,
        "enSegmentIndex": _get_attr(en_seg, "segmentIndex"),
        "jaSegmentIndex": None,
        "enSourceFingerprint": _get_attr(en_seg, "sourceFingerprint"),
        "jaSourceFingerprint": None,
        "detail": (
            f"EN {_get_attr(en_seg, 'segmentKind')} not found in JA section "
            f'"{_section_label(section["sectionPath"])}"'
        ),
    }


def _diff_extra(section: dict[str, Any], ja_seg: Any, ja_local_index: int) -> dict[str, Any]:
    return {
        "type": "segment-extra",
        "sectionPath": section["sectionPath"],
        "sectionIndex": section["index"],
        "segmentKind": _get_attr(ja_seg, "segmentKind"),
        "enIndex": None,
        "jaIndex": ja_local_index,
        "enSegmentIndex": None,
        "jaSegmentIndex": _get_attr(ja_seg, "segmentIndex"),
        "enSourceFingerprint": None,
        "jaSourceFingerprint": _get_attr(ja_seg, "sourceFingerprint"),
        "detail": (
            f"JA {_get_attr(ja_seg, 'segmentKind')} has no EN counterpart in section "
            f'"{_section_label(section["sectionPath"])}"'
        ),
    }


def _diff_untranslated(
    section: dict[str, Any],
    ja_seg: Any,
    ja_local_index: int,
    en_seg: Any = None,
    en_local_index: int | None = None,
) -> dict[str, Any]:
    return {
        "type": "segment-untranslated",
        "sectionPath": section["sectionPath"],
        "sectionIndex": section["index"],
        "segmentKind": _get_attr(ja_seg, "segmentKind"),
        "enIndex": en_local_index,
        "jaIndex": ja_local_index,
        "enSegmentIndex": _get_attr(en_seg, "segmentIndex") if en_seg is not None else None,
        "jaSegmentIndex": _get_attr(ja_seg, "segmentIndex"),
        "enSourceFingerprint": _get_attr(en_seg, "sourceFingerprint")
        if en_seg is not None
        else None,
        "jaSourceFingerprint": _get_attr(ja_seg, "sourceFingerprint"),
        "detail": f"JA {_get_attr(ja_seg, 'segmentKind')} appears to be untranslated English",
    }


def _diff_shifted(
    section: dict[str, Any],
    shared_reason: str,
    en_tokens: set[str],
    ja_tokens: set[str],
) -> dict[str, Any]:
    return {
        "type": "segment-shifted",
        "sectionPath": section["sectionPath"],
        "sectionIndex": section["index"],
        "segmentKind": "section",
        "enIndex": None,
        "jaIndex": None,
        "enSegmentIndex": None,
        "jaSegmentIndex": None,
        "enSourceFingerprint": None,
        "jaSourceFingerprint": None,
        "enSectionTokens": sorted(en_tokens),
        "jaSectionTokens": sorted(ja_tokens),
        "confidence": "high",
        "detail": (
            f'Section "{_section_label(section["sectionPath"])}" appears mis-aligned: '
            f"{shared_reason}"
        ),
    }


def _diff_token_gap(
    section: dict[str, Any],
    en_seg: Any,
    ja_seg: Any,
    en_local_index: int,
    ja_local_index: int,
    missing_tokens: list[str],
) -> dict[str, Any]:
    return {
        "type": "segment-token-gap",
        "sectionPath": section["sectionPath"],
        "sectionIndex": section["index"],
        "segmentKind": _get_attr(en_seg, "segmentKind"),
        "enIndex": en_local_index,
        "jaIndex": ja_local_index,
        "enSegmentIndex": _get_attr(en_seg, "segmentIndex"),
        "jaSegmentIndex": _get_attr(ja_seg, "segmentIndex"),
        "enSourceFingerprint": _get_attr(en_seg, "sourceFingerprint"),
        "jaSourceFingerprint": _get_attr(ja_seg, "sourceFingerprint"),
        "missingTokens": missing_tokens,
        "detail": (
            f"JA {_get_attr(en_seg, 'segmentKind')} is missing invariant tokens: "
            f"{', '.join(missing_tokens)}"
        ),
    }


# ---------------------------------------------------------------------------
# cross-section shift 判定
# ---------------------------------------------------------------------------


def _count_token_overlap(query: set[str], target: set[str]) -> int:
    return sum(1 for token in query if token in target)


def _find_best_cross_section_match(
    query_tokens: set[str],
    candidate_sets: Sequence[set[str]],
    current_index: int,
) -> dict[str, int]:
    best_index = -1
    best_overlap = 0
    second_best_overlap = 0

    for k, candidate in enumerate(candidate_sets):
        if k == current_index:
            continue
        overlap = _count_token_overlap(query_tokens, candidate)
        if overlap > best_overlap:
            second_best_overlap = best_overlap
            best_overlap = overlap
            best_index = k
        elif overlap > second_best_overlap:
            second_best_overlap = overlap

    return {
        "bestIndex": best_index,
        "bestOverlap": best_overlap,
        "secondBestOverlap": second_best_overlap,
    }


def _find_body_swap_evidence(
    *,
    current_en_index: int,
    current_ja_index: int,
    en_section_tokens_list: Sequence[set[str]],
    ja_section_tokens_list: Sequence[set[str]],
) -> dict[str, int] | None:
    """現 section body が別 section へ swap した強証拠を探す (mjs 等価)。

    保守的な 4 条件:

    - 現 en/ja token 集合が完全に非交差
    - 別 EN section に JA token の有意な重なり先
    - 別 JA section に EN token の有意な重なり先
    - 両方向の行き先が一致し 2 位候補より明確に強い
    """
    en_tokens = en_section_tokens_list[current_en_index]
    ja_tokens = ja_section_tokens_list[current_ja_index]
    if len(en_tokens) == 0 or len(ja_tokens) == 0:
        return None
    if _count_token_overlap(en_tokens, ja_tokens) > 0:
        return None

    require_for_ja = max(1, -(-len(ja_tokens) // 2))  # ceil(len/2)
    require_for_en = max(1, -(-len(en_tokens) // 2))

    best_en_dest = _find_best_cross_section_match(
        ja_tokens, en_section_tokens_list, current_en_index
    )
    if best_en_dest["bestOverlap"] < require_for_ja:
        return None
    if best_en_dest["bestOverlap"] <= best_en_dest["secondBestOverlap"]:
        return None

    best_ja_dest = _find_best_cross_section_match(
        en_tokens, ja_section_tokens_list, current_ja_index
    )
    if best_ja_dest["bestOverlap"] < require_for_en:
        return None
    if best_ja_dest["bestOverlap"] <= best_ja_dest["secondBestOverlap"]:
        return None
    if best_en_dest["bestIndex"] != best_ja_dest["bestIndex"]:
        return None

    return {
        "enDestIndex": best_en_dest["bestIndex"],
        "jaDestIndex": best_ja_dest["bestIndex"],
        "enToOtherOverlap": best_ja_dest["bestOverlap"],
        "jaToOtherOverlap": best_en_dest["bestOverlap"],
    }


def _section_path_tail(section_path: Any) -> str:
    """sectionPath の最後の ``>`` 以降 (= section 自身の heading) を返す。"""
    if not isinstance(section_path, str) or len(section_path) == 0:
        return ""
    idx = section_path.rfind(" > ")
    return section_path[idx + 3 :] if idx >= 0 else section_path


def _detect_ambiguous_adjacent_tokenless_swap(
    en_sections: Sequence[dict[str, Any]],
    ja_sections: Sequence[dict[str, Any]],
    diffs: Sequence[dict[str, Any]],
) -> dict[str, Any] | None:
    """tokenless 隣接 section 同士の near-tie swap を検出する (mjs 等価)。

    source-first translation 規律を前提に、distinct な EN heading を持つ
    隣接 pair は positional anchoring で確信できるため length-similarity 判定
    を skip する。EN heading が同一な場合のみ、length-similarity が near-tie
    になれば swap hypothesis が解消できないため ``inconclusive`` に倒す。
    """
    section_has_diff: set[int] = set()
    for diff in diffs:
        section_index = diff.get("sectionIndex")
        if isinstance(section_index, int):
            section_has_diff.add(section_index)

    for i in range(len(en_sections) - 1):
        j = i + 1
        if i in section_has_diff or j in section_has_diff:
            continue

        en_i = en_sections[i]["body"]
        ja_i = ja_sections[i]["body"]
        en_j = en_sections[j]["body"]
        ja_j = ja_sections[j]["body"]

        if len(en_i) == 0 or len(ja_i) == 0 or len(en_j) == 0 or len(ja_j) == 0:
            continue
        if not _is_all_free_form_kinds(en_i) or not _is_all_free_form_kinds(ja_i):
            continue
        if not _is_all_free_form_kinds(en_j) or not _is_all_free_form_kinds(ja_j):
            continue
        if not _is_tokenless_body(en_i) or not _is_tokenless_body(ja_i):
            continue
        if not _is_tokenless_body(en_j) or not _is_tokenless_body(ja_j):
            continue

        en_heading_i = _section_path_tail(en_sections[i]["sectionPath"])
        en_heading_j = _section_path_tail(en_sections[j]["sectionPath"])
        if en_heading_i != en_heading_j:
            continue

        current_score = _pairwise_length_similarity_sum(
            en_i, ja_i
        ) + _pairwise_length_similarity_sum(en_j, ja_j)
        swap_score = _pairwise_length_similarity_sum(en_i, ja_j) + _pairwise_length_similarity_sum(
            en_j, ja_i
        )

        relative_gap = abs(swap_score - current_score) / current_score if current_score > 0 else 0
        if relative_gap <= _TOKENLESS_SWAP_AMBIGUITY_RELATIVE_MARGIN:
            return {
                "leftSectionPath": en_sections[i]["sectionPath"],
                "rightSectionPath": en_sections[j]["sectionPath"],
                "currentScore": current_score,
                "swapScore": swap_score,
            }

    return None


# ---------------------------------------------------------------------------
# section 単位 alignment
# ---------------------------------------------------------------------------


def _align_section(
    en_section: dict[str, Any],
    ja_section: dict[str, Any],
    cross_section_info: dict[str, list[set[str]]],
    artifact_ctx: dict[str, Any],
) -> list[dict[str, Any]]:
    """2 section の body を比較して section 内 diff を返す (mjs 等価)。

    cross-section body swap 証拠が十分なら ``segment-shifted`` を 1 件だけ返す。
    それ以外は weighted LCS で対応付けし、missing / extra / untranslated /
    token-gap を emit する。
    """
    diffs: list[dict[str, Any]] = []
    en_body = en_section["body"]
    ja_body = ja_section["body"]

    swap_evidence = _find_body_swap_evidence(
        current_en_index=en_section["index"],
        current_ja_index=ja_section["index"],
        en_section_tokens_list=cross_section_info["en"],
        ja_section_tokens_list=cross_section_info["ja"],
    )
    if swap_evidence:
        en_tokens = cross_section_info["en"][en_section["index"]]
        ja_tokens = cross_section_info["ja"][ja_section["index"]]
        reason = (
            f"EN section content best matches JA section #{swap_evidence['jaDestIndex']} "
            f"({swap_evidence['enToOtherOverlap']} token overlap), "
            f"and JA section content best matches EN section #{swap_evidence['enDestIndex']} "
            f"({swap_evidence['jaToOtherOverlap']} token overlap) — likely body swap"
        )
        diffs.append(_diff_shifted(en_section, reason, en_tokens, ja_tokens))
        return diffs

    matched = _weighted_lcs(en_body, ja_body, score_segment_match)

    en_matched: set[int] = set()
    ja_matched: set[int] = set()
    for e_idx, j_idx in matched:
        en_matched.add(e_idx)
        ja_matched.add(j_idx)

    for i, seg in enumerate(en_body):
        if i in en_matched:
            continue
        diffs.append(_diff_missing(en_section, seg, i))

    for j, seg in enumerate(ja_body):
        if j in ja_matched:
            continue
        if _looks_untranslated(seg):
            diffs.append(_diff_untranslated(en_section, seg, j))
        else:
            diffs.append(_diff_extra(en_section, seg, j))

    for en_idx, ja_idx in matched:
        en_seg = en_body[en_idx]
        ja_seg = ja_body[ja_idx]

        ja_token_set = set(normalize_segment_tokens(_get_attr(ja_seg, "tokensInvariant") or []))
        en_tokens = normalize_segment_tokens(_get_attr(en_seg, "tokensInvariant") or [])
        missing_tokens: list[str] = []
        for token in en_tokens:
            if token in ja_token_set:
                continue
            if is_artifact_excluded(slug=artifact_ctx["slug"], token=token):
                coverage = artifact_ctx.get("coverage")
                if coverage and "record" in coverage:
                    # codex P1 指摘対応: artifact_registry の ``record`` は
                    # keyword-only (mjs ``object literal`` 引数と semantic 1:1)。
                    # 以前は dict を positional で渡して TypeError を silent に
                    # 引き起こしていた (既存 unit test が stub で mask)。
                    coverage["record"](
                        slug=artifact_ctx["slug"],
                        token=token,
                        reason="artifact-registry",
                    )
                continue
            missing_tokens.append(token)

        if missing_tokens:
            diffs.append(
                _diff_token_gap(en_section, en_seg, ja_seg, en_idx, ja_idx, missing_tokens)
            )

        if _looks_untranslated(ja_seg):
            diffs.append(_diff_untranslated(en_section, ja_seg, ja_idx, en_seg, en_idx))

    return diffs


# ---------------------------------------------------------------------------
# 公開 API
# ---------------------------------------------------------------------------


def align_segments(
    en_segments: Sequence[Any],
    ja_segments: Sequence[Any],
    *,
    slug: str,
    coverage: Any = None,
) -> dict[str, Any]:
    """EN / JA canonical segments を整列し diff 一覧を返す (mjs ``alignSegments`` 等価)。

    ``slug`` は EN-side artifact の slug-scope 抑止判定に必須 (Phase 4)。
    未指定 / 空文字で ``ValueError``。

    返り値 shape:
    ``{diffs, sectionsAligned, sectionsCompared, inconclusive,
       inconclusiveCategory, inconclusiveMeta, inconclusiveReason}``。
    """
    if not isinstance(slug, str) or len(slug) == 0:
        # mjs との byte-identical な error message 契約。conformance harness の
        # {ok, error} envelope で string 比較されるため mjs の関数名 (camelCase)
        # を使用する。
        raise ValueError("alignSegments: slug option is required")

    # mjs ``coverage = NOOP_COVERAGE`` のデフォルト等価。NOOP_COVERAGE は
    # MappingProxyType で record / snapshot callable を持つ。
    coverage_ctx = coverage if coverage is not None else NOOP_COVERAGE

    en_filtered = _filter_for_alignment(en_segments)
    ja_filtered = _filter_for_alignment(ja_segments)

    en_sections = _split_into_sections(en_filtered)
    ja_sections = _split_into_sections(ja_filtered)

    if len(en_sections) != len(ja_sections):
        return {
            "diffs": [],
            "sectionsAligned": 0,
            "sectionsCompared": 0,
            "inconclusive": True,
            "inconclusiveCategory": "heading-count-mismatch",
            "inconclusiveMeta": None,
            "inconclusiveReason": (
                f"Heading count mismatch: EN has {len(en_sections) - 1} headings, "
                f"JA has {len(ja_sections) - 1}"
            ),
        }

    en_section_tokens_list = [_collect_section_tokens(s) for s in en_sections]
    ja_section_tokens_list = [_collect_section_tokens(s) for s in ja_sections]
    cross_section_info = {"en": en_section_tokens_list, "ja": ja_section_tokens_list}

    diffs: list[dict[str, Any]] = []
    for i in range(len(en_sections)):
        section_diffs = _align_section(
            en_sections[i],
            ja_sections[i],
            cross_section_info,
            {"slug": slug, "coverage": coverage_ctx},
        )
        has_shift = any(d["type"] == "segment-shifted" for d in section_diffs)

        if not has_shift:
            structure_diffs = compare_section_structure(en_sections[i], ja_sections[i])
            diffs.extend(structure_diffs)

        diffs.extend(section_diffs)

    ambiguous = _detect_ambiguous_adjacent_tokenless_swap(en_sections, ja_sections, diffs)
    if ambiguous:
        left_label = _section_label(ambiguous["leftSectionPath"])
        right_label = _section_label(ambiguous["rightSectionPath"])
        current_score = ambiguous["currentScore"]
        swap_score = ambiguous["swapScore"]
        return {
            "diffs": diffs,
            "sectionsAligned": len(en_sections),
            "sectionsCompared": len(en_sections),
            "inconclusive": True,
            "inconclusiveCategory": "tokenless-near-tie",
            "inconclusiveMeta": {
                "leftSectionPath": ambiguous["leftSectionPath"],
                "rightSectionPath": ambiguous["rightSectionPath"],
                "currentScore": current_score,
                "swapScore": swap_score,
            },
            "inconclusiveReason": (
                f'Tokenless adjacent sections "{left_label}" and "{right_label}" '
                f"cannot rule out a body swap "
                f"(current={current_score:.2f}, swap={swap_score:.2f})"
            ),
        }

    return {
        "diffs": diffs,
        "sectionsAligned": len(en_sections),
        "sectionsCompared": len(en_sections),
        "inconclusive": False,
        "inconclusiveCategory": None,
        "inconclusiveMeta": None,
        "inconclusiveReason": None,
    }


# ---------------------------------------------------------------------------
# diff → issue 変換
# ---------------------------------------------------------------------------

_SEGMENT_ISSUE_SEVERITY: dict[str, str] = {
    "segment-missing": "actionable",
    "segment-extra": "actionable",
    "segment-shifted": "actionable",
    "segment-untranslated": "actionable",
    "segment-token-gap": "actionable",
    "section-structure-mismatch": "actionable",
    "segment-order-mismatch": "actionable",
}


def parity_diffs_to_issues(diffs: Iterable[dict[str, Any]] | Any) -> list[dict[str, Any]]:
    """``align_segments`` の ParityDiff を下流 consumer 用 issue 形式に変換する (mjs 等価)。

    section 単位 structure diff はそのまま transport、segment-* 系は ``line`` 等の
    追加 metadata (``missingTokens`` / ``confidence`` / ``enSectionTokens``) を
    forward して drill-down できるようにする。純粋 — 入力を mutate しない。
    """
    if not isinstance(diffs, (list, tuple)):
        return []

    issues: list[dict[str, Any]] = []
    for diff in diffs:
        section_label = diff.get("sectionPath") or "(preface)"
        severity = _SEGMENT_ISSUE_SEVERITY.get(diff["type"], "actionable")

        if diff.get("scope") == "section":
            issue: dict[str, Any] = {
                "type": diff["type"],
                "severity": severity,
                "detail": f"[{section_label}] {diff['detail']}",
                "sectionPath": diff.get("sectionPath"),
                "sectionIndex": diff.get("sectionIndex"),
                "scope": "section",
                "structureCategory": diff.get("structureCategory"),
                "enKinds": list(diff.get("enKinds") or []),
                "jaKinds": list(diff.get("jaKinds") or []),
                "enSegmentCount": diff.get("enSegmentCount"),
                "jaSegmentCount": diff.get("jaSegmentCount"),
            }
            if isinstance(diff.get("contentPermutation"), list):
                issue["contentPermutation"] = [
                    {
                        "enIndex": entry["enIndex"],
                        "jaIndex": entry["jaIndex"],
                        "score": entry["score"],
                    }
                    for entry in diff["contentPermutation"]
                ]
            issues.append(issue)
            continue

        issue = {
            "type": diff["type"],
            "severity": severity,
            "detail": f"[{section_label}] {diff['detail']}",
            "sectionPath": diff.get("sectionPath"),
            "sectionIndex": diff.get("sectionIndex"),
            "segmentKind": diff.get("segmentKind"),
            "enSegmentIndex": diff.get("enSegmentIndex"),
            "jaSegmentIndex": diff.get("jaSegmentIndex"),
            "enSourceFingerprint": diff.get("enSourceFingerprint"),
            "jaSourceFingerprint": diff.get("jaSourceFingerprint"),
        }
        if isinstance(diff.get("missingTokens"), list):
            issue["missingTokens"] = list(diff["missingTokens"])
        if isinstance(diff.get("enSectionTokens"), list):
            issue["enSectionTokens"] = list(diff["enSectionTokens"])
            issue["jaSectionTokens"] = list(diff.get("jaSectionTokens") or [])
        if isinstance(diff.get("confidence"), str):
            issue["confidence"] = diff["confidence"]
        issues.append(issue)
    return issues
