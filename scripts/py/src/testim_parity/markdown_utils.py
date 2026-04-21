"""``scripts/lib/markdown_utils.mjs`` の Python port。

``strip_markdown`` は markdown 装飾を落としたプレーンテキストを返す。
``generate_description`` は frontmatter ``description`` が欠けているページ
向けに最初の段落 (120 文字まで) から fallback description を derive する。
"""

from __future__ import annotations

import re

__all__ = ["generate_description", "strip_markdown"]


_IMAGE_RE = re.compile(r"!\[[^\]]*]\([^)]+\)")
_LINK_RE = re.compile(r"\[([^\]]+)]\([^)]+\)")
_INLINE_CODE_RE = re.compile(r"`([^`]+)`")
_DECOR_RE = re.compile(r"[*_>#-]")
_WHITESPACE_RE = re.compile(r"\s+")

_HEADING_RE = re.compile(r"^#")
_CALLOUT_RE = re.compile(r"^:{3,}")
_FENCE_RE = re.compile(r"^```")
_MD_IMAGE_START_RE = re.compile(r"^!\[")
_HTML_TAG_RE = re.compile(r"^<[^>]+>")
_BULLET_RE = re.compile(r"^[-*+]\s")
_STEP_RE = re.compile(r"^\d+\.\s")


def strip_markdown(text: object) -> str:
    """markdown 装飾を落としたプレーンテキストを返す (mjs 等価)。"""
    if text is None:
        return ""
    s = str(text)
    s = _IMAGE_RE.sub(" ", s)
    s = _LINK_RE.sub(r"\1", s)
    s = _INLINE_CODE_RE.sub(r"\1", s)
    s = _DECOR_RE.sub(" ", s)
    s = _WHITESPACE_RE.sub(" ", s)
    return s.strip()


def generate_description(title: str, content: str) -> str:
    """最初の段落 (120 文字まで) から description を生成 (mjs 等価)。

    見出し / callout / code fence / image / html / list 行は skip。続く非空
    行を集めて 1 段落とみなし、blank line で一旦 flush する。fallback は
    ``{title} に関する日本語ドキュメントです。``。
    """
    lines = content.split("\n")
    paragraph: list[str] = []

    def flush() -> str:
        return strip_markdown(" ".join(paragraph))

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            candidate = flush()
            if candidate:
                return candidate[:120]
            paragraph = []
            continue
        if (
            _HEADING_RE.match(line)
            or _CALLOUT_RE.match(line)
            or _FENCE_RE.match(line)
            or _MD_IMAGE_START_RE.match(line)
            or _HTML_TAG_RE.match(line)
            or _BULLET_RE.match(line)
            or _STEP_RE.match(line)
        ):
            continue
        paragraph.append(line)

    fallback = flush()
    if fallback:
        return fallback[:120]
    return f"{title} に関する日本語ドキュメントです。"
