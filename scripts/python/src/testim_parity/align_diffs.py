"""``align.py`` の ParityDiff factory + schema version 定数。

``source_parity_align.mjs`` の port を責務分離した補助モジュール。``align.py``
本体が 800 行 soft cap を超えたため (code-reviewer MEDIUM 指摘)、以下の条件を
満たす pure な diff factory 群をこちらに切り出した:

- 入力: ``section`` / ``segment`` の dict + ローカル index
- 出力: mjs と byte-identical な ``ParityDiff`` dict
- main align loop (``align_segments``) と状態を共有しない

``align.py`` は本モジュールを import して使用する。mjs 側は 1 ファイル構成の
ため conformance harness で import path を変更する必要はない (mjs function は
``source_parity_align.mjs`` のまま変わらず)。
"""

from __future__ import annotations

from typing import Any

__all__ = [
    "ALIGN_OUTPUT_SCHEMA_VERSION",
    "build_diff_extra",
    "build_diff_missing",
    "build_diff_shifted",
    "build_diff_token_gap",
    "build_diff_untranslated",
    "section_label",
]


# architect L2 指摘対応: ``align_segments`` の return shape を固定する schema
# version。``baseline.py`` (Phase 3 M5) が identity key に hash する field
# (``sectionIndex`` / ``structureCategory`` / ``enKinds`` / ``jaKinds`` /
# ``contentPermutation``) を破壊的変更する場合は bump し、baseline
# ``schemaVersion`` と同時に migration を組むこと。
ALIGN_OUTPUT_SCHEMA_VERSION = 1


def _get_attr(seg: Any, name: str, default: Any = None) -> Any:
    """dict / object どちらでも segment 属性を取り出す (``align.py`` と同一 helper)。"""
    if isinstance(seg, dict):
        return seg.get(name, default)
    return getattr(seg, name, default)


def section_label(section_path: Any) -> str:
    """``sectionPath`` が空なら ``(preface)`` を返す (mjs ``buildSectionLabel`` 等価)。"""
    return section_path if section_path else "(preface)"


def build_diff_missing(section: dict[str, Any], en_seg: Any, en_local_index: int) -> dict[str, Any]:
    """EN にあり JA に無い body segment (mjs ``diffMissing`` 等価)。"""
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
            f'"{section_label(section["sectionPath"])}"'
        ),
    }


def build_diff_extra(section: dict[str, Any], ja_seg: Any, ja_local_index: int) -> dict[str, Any]:
    """JA にあり EN に無い body segment (mjs ``diffExtra`` 等価)。"""
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
            f'"{section_label(section["sectionPath"])}"'
        ),
    }


def build_diff_untranslated(
    section: dict[str, Any],
    ja_seg: Any,
    ja_local_index: int,
    en_seg: Any = None,
    en_local_index: int | None = None,
) -> dict[str, Any]:
    """JA segment が未翻訳 (mjs ``diffUntranslated`` 等価)。"""
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


def build_diff_shifted(
    section: dict[str, Any],
    shared_reason: str,
    en_tokens: set[str],
    ja_tokens: set[str],
) -> dict[str, Any]:
    """section body が別 section と入れ替わった高確信 shift (mjs ``diffShifted`` 等価)。"""
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
            f'Section "{section_label(section["sectionPath"])}" appears mis-aligned: '
            f"{shared_reason}"
        ),
    }


def build_diff_token_gap(
    section: dict[str, Any],
    en_seg: Any,
    ja_seg: Any,
    en_local_index: int,
    ja_local_index: int,
    missing_tokens: list[str],
) -> dict[str, Any]:
    """JA segment に EN invariant token が欠けている (mjs ``diffTokenGap`` 等価)。"""
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
