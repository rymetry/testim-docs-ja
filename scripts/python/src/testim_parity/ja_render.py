"""JA Markdown を HTML にレンダリングする (EN extractor 再利用のための比較用)。

frontmatter と title H1 を除去し、heading の ``{#id}`` を落とし、fence 外の
``:::kind`` / ``:::`` を ``<div class="callout-kind" data-line="N">`` に置換する。
``N`` は渡された body 内での開き ``:::`` 行の 1-based 行番号。
"""

from __future__ import annotations

import re

from markdown_it import MarkdownIt

__all__ = ["render_ja_markdown"]

_MD = MarkdownIt("commonmark", {"html": True}).enable("table").enable("strikethrough")
_OPEN = re.compile(r"^:::(note|warning|info|tip|caution|danger)(?:\{[^}]*\})?\s*$")
_CLOSE = re.compile(r"^:::\s*$")
# list marker の直後に始まる fence (``- ```) も fence として扱う。
_FENCE = re.compile(r"^\s*(?:[-*+]\s+|\d+\.\s+)?(`{3,}|~{3,})")
_ANCHOR = re.compile(r"^(#{1,6}\s.*?)\s*\{#[^}]*\}\s*$")
_H1 = re.compile(r"^#\s")


def render_ja_markdown(body: str) -> str:
    """JA Markdown body を比較用 HTML に変換する。"""
    lines = body.split("\n")
    start = 0
    if lines and lines[0].strip() == "---":
        for i in range(1, len(lines)):
            if lines[i].strip() == "---":
                start = i + 1
                break
    out: list[str] = []
    fence: str | None = None
    h1_seen = False
    for n in range(start, len(lines)):
        line = lines[n]
        m = _FENCE.match(line)
        if m:
            if fence is None:
                fence = m[1][0]
            elif m[1][0] == fence:
                fence = None
            out.append(line)
        elif fence is not None:
            out.append(line)
        elif (o := _OPEN.match(line)) is not None:
            out += [f'<div class="callout-{o[1]}" data-line="{n + 1}">', ""]
        elif _CLOSE.match(line):
            out += ["", "</div>"]
        elif not h1_seen and _H1.match(line):
            h1_seen = True
        else:
            out.append(_ANCHOR.sub(r"\1", line))
    return str(_MD.render("\n".join(out)))
