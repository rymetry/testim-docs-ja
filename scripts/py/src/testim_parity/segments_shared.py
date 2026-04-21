"""shared segment factory、テキスト正規化、fingerprint、section-path tracking。

``scripts/lib/source_parity_segments_shared.mjs`` の port。``Segment`` は exact-diff
エンジンが EN/JA 間で比較する最小単位。gate-eligible kind は missing/extra/shifted
gating に参加し、非 gate kind は参照用に emit されるものの gate 比較前に filter 除外
される。
"""

from __future__ import annotations

import hashlib
import re
from typing import Any

from .extract import extract_invariant_tokens

# 抽出器が emit する全 canonical segment kind。
SEGMENT_KINDS: tuple[str, ...] = (
    "heading",
    "paragraph",
    "ordered-list-item",
    "unordered-list-item",
    "callout-body",
    "table-cell",
    "details-summary",
    "image-caption",
    "code-block",
    "image",
)

_SEGMENT_KIND_SET: frozenset[str] = frozenset(SEGMENT_KINDS)

# exact-diff gate に参加する kind。code-block と raw image segment は参照用に
# emit されるだけで、実コンテンツは invariant-token 側が拾う。``image-caption``
# は将来拡張用の宣言で、現行 extractor はまだ emit しないため gate 集合からは
# 外しておく (boundary benchmark で phantom kind mismatch を起こさないため)。
GATE_ELIGIBLE_KINDS: tuple[str, ...] = (
    "heading",
    "paragraph",
    "ordered-list-item",
    "unordered-list-item",
    "callout-body",
    "table-cell",
    "details-summary",
)

_GATE_ELIGIBLE_SET: frozenset[str] = frozenset(GATE_ELIGIBLE_KINDS)


def is_gate_eligible(kind: str) -> bool:
    """``kind`` の segment が gate 比較に参加するかを返す。"""
    return kind in _GATE_ELIGIBLE_SET


_ZERO_WIDTH_RE = re.compile(r"[\u200B\u200C\u200D\uFEFF]")

# inline markdown 剥がし。mjs 原本と同じ順序で適用する。
_IMAGE_INLINE_RE = re.compile(r"!\[[^\]]*\]\([^)]*\)")
_LINK_INLINE_RE = re.compile(r"\[([^\]]*)\]\([^)]*\)")
_INLINE_CODE_RE = re.compile(r"`([^`]*)`")
_BOLD_RE = re.compile(r"\*\*([^*]*)\*\*")
# JS 原本は ``(?<!\*)\*([^*]+)\*(?!\*)`` で double-asterisk を避ける lookbehind。
# Python は固定幅 lookbehind と lookahead を native サポートしているため直訳可能。
_ITALIC_STAR_RE = re.compile(r"(?<!\*)\*([^*]+)\*(?!\*)")
_ITALIC_UNDERSCORE_RE = re.compile(r"(?<![a-zA-Z0-9])_([^_\n]+)_(?![a-zA-Z0-9])")
_STRIKETHROUGH_RE = re.compile(r"~~([^~]*)~~")
_WHITESPACE_RE = re.compile(r"\s+")


def normalize_segment_text(raw: str) -> str:
    """比較 / fingerprint 用に raw segment テキストを正規化する。

    inline markdown を中身を保ったまま剥がし、whitespace を畳み、zero-width 文字を
    除去し、ASCII 英字を小文字化する。こうすることで軽微な書式差が疑似 mismatch を
    生まないようにする。
    """
    if not isinstance(raw, str) or len(raw) == 0:
        return ""

    text = _ZERO_WIDTH_RE.sub("", raw)

    # ネストした markup が同じ順で解決されるよう、mjs と同じ順序で剥がす。
    text = _IMAGE_INLINE_RE.sub("", text)
    text = _LINK_INLINE_RE.sub(r"\1", text)
    text = _INLINE_CODE_RE.sub(r"\1", text)
    text = _BOLD_RE.sub(r"\1", text)
    text = _ITALIC_STAR_RE.sub(r"\1", text)
    text = _ITALIC_UNDERSCORE_RE.sub(r"\1", text)
    text = _STRIKETHROUGH_RE.sub(r"\1", text)

    text = _WHITESPACE_RE.sub(" ", text).strip()
    return text.lower()


def compute_segment_fingerprint(raw: str) -> str:
    """raw segment snippet に対する決定論的 ``sha256:<hex>`` fingerprint を返す。

    CRLF は LF に正規化してから hash する (cross-platform で同一 hash)。
    非文字列は空扱い。
    """
    text = raw.replace("\r\n", "\n") if isinstance(raw, str) else ""
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    return f"sha256:{digest}"


def push_heading(stack: list[dict[str, Any]], level: int, text: str) -> list[dict[str, Any]]:
    """heading を push した **新しい** stack を返す。

    より深いレベルは truncate し、同レベルの既存 entry は置換することで section path
    を heading 階層と同期させる。入力 stack は mutate しない。
    """
    trimmed = text.strip() if isinstance(text, str) else ""
    kept = [entry for entry in stack if entry["level"] < level]
    return [*kept, {"level": level, "text": trimmed}]


def build_section_path(stack: list[dict[str, Any]]) -> str:
    """heading stack から ``" > "`` 結合の section path を構築する。"""
    return " > ".join(entry["text"] for entry in stack if entry.get("text"))


def create_segment(
    *,
    section_path: str,
    kind: str,
    segment_index: int,
    raw_text: str,
    line: int | None = None,
) -> dict[str, Any]:
    """raw テキストから dict 形式の Segment レコードを組み立てる。

    正規化・invariant トークン抽出・fingerprint 計算を一箇所に集約し、両 extractor が
    同じ shape を返すようにする。key は mjs 出力と同じ camelCase を使い、artifact
    parity を守る。
    """
    if kind not in _SEGMENT_KIND_SET:
        raise ValueError(f'create_segment: unknown segment kind "{kind}"')
    raw = raw_text if isinstance(raw_text, str) else ""
    return {
        "sectionPath": section_path if section_path is not None else "",
        "segmentKind": kind,
        "segmentIndex": segment_index,
        "textNorm": normalize_segment_text(raw),
        "tokensInvariant": extract_invariant_tokens(raw),
        "sourceFingerprint": compute_segment_fingerprint(raw),
        "line": line,
    }


__all__ = [
    "SEGMENT_KINDS",
    "GATE_ELIGIBLE_KINDS",
    "is_gate_eligible",
    "normalize_segment_text",
    "compute_segment_fingerprint",
    "push_heading",
    "build_section_path",
    "create_segment",
]
