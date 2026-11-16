"""JA Markdown を HTML にレンダリングする (EN extractor 再利用のための比較用)。

frontmatter と title H1 を除去し、heading の ``{#id}`` を落とし、fence 外の
``:::kind`` / ``:::`` を ``<div class="callout-kind" data-line="N">`` に置換する。
``N`` は渡された body 内での開き ``:::`` 行の 1-based 行番号。
marker の行頭インデントは div にそのまま付けるので、list item 内の
``   :::note`` は ``<li>`` の中に入る。

閉じられていない callout は、次の column-0 ATX heading 行の直前で閉じる
(heading は callout 内に書けない前提)。入力末尾の未閉 div は HTML parser が閉じる。
未閉の indented callout はその list item / page の終わりまで続く (indented callout は
lint_docs が ``callout-in-list-item`` で拒否する)。callout が開いていない ``:::`` 行は
literal text のまま残す。
"""

from __future__ import annotations

import re

from markdown_it import MarkdownIt

__all__ = ["render_ja_markdown"]

_MD = MarkdownIt("commonmark", {"html": True}).enable("table").enable("strikethrough")
# shortcut: a 4-space indented code block outside a list is not detected, so a marker in it
# becomes literal <div> text in the code; upgrade if such a page appears in the corpus.
CALLOUT_OPEN_RE = re.compile(
    r"^([ \t]*)(:{3,})(note|warning|info|tip|caution|danger)(?:\{[^}]*\})?\s*$"
)
CALLOUT_CLOSE_RE = re.compile(r"^([ \t]*)(:{3,})\s*$")
ATX_HEADING_RE = re.compile(r"^#{1,6}\s")
_ANCHOR = re.compile(r"^(#{1,6}\s.*?)\s*\{#[^}]*\}\s*$")
_H1 = re.compile(r"^#\s")


def fenced_lines(body: str) -> set[int]:
    """Return zero-based lines covered by CommonMark code fences."""
    return {
        line
        for token in _MD.parse(body)
        if token.type == "fence" and token.map is not None
        for line in range(*token.map)
    }


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
    code_lines = fenced_lines("\n".join(lines[start:]))
    first_content = True
    open_callouts: list[int] = []
    for n in range(start, len(lines)):
        line = lines[n]
        if n - start in code_lines:
            out.append(line)
        elif (o := CALLOUT_OPEN_RE.match(line)) is not None:
            out += [f'{o[1]}<div class="callout-{o[3]}" data-line="{n + 1}">', ""]
            open_callouts.append(len(o[2]))
        elif (
            open_callouts
            and (c := CALLOUT_CLOSE_RE.match(line)) is not None
            and len(c[2]) >= open_callouts[-1]
        ):
            out += ["", f"{c[1]}</div>", ""]
            open_callouts.pop()
        elif first_content and _H1.match(line):
            pass  # title H1 は frontmatter 直後の最初の非空行のみ
        else:
            if open_callouts and ATX_HEADING_RE.match(line):
                out += ["", *["</div>"] * len(open_callouts), ""]
                open_callouts.clear()
            out.append(_ANCHOR.sub(r"\1", line))
        if line.strip():
            first_content = False
    return str(_MD.render("\n".join(out)))
