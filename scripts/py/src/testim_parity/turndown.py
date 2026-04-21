"""``scripts/lib/turndown.mjs`` の Python port。

``convertEnHtmlToMd(html)`` と ``preprocessEnHtml(html, options)`` を提供する。
mjs 版は ``turndown`` npm package + 5 つの custom rule (madcap-callout /
madcap-code-snippet-copy / madcap-ordered-list / madcap-table / html-details+summary)
で構成されている。

Python 版は ``markdownify.MarkdownConverter`` を subclass し、必要な
output format (``*   `` 3-space bullet / ``**bold**`` / ``_italic_`` / ATX heading /
fenced code with language) を replicate する。

**byte-parity 戦略**: 主要 MadCap pattern を unit test で mjs turndown 出力と
byte 比較し、288-page corpus 全体の byte-parity は Phase 4b M1.2 で follow-up。
現状は unit test + conformance harness (主要 5 pattern) でカバーし、corpus-wide
drift は M2/M3 integration 時に計測する。

``preprocess_en_html`` は既存の ``preprocess_en`` module の re-export。
"""

from __future__ import annotations

import re
from re import Match
from typing import Any

from bs4 import Tag
from markdownify import MarkdownConverter

from .preprocess_en import preprocess_en_html

__all__ = ["convert_en_html_to_md", "html_to_md", "preprocess_en_html"]


_CALLOUT_CLASS_MAP: dict[str, str] = {
    "note": "note",
    "caution": "caution",
}


def _has_class(node: Tag, target: str) -> bool:
    cls_attr = node.get("class")
    if cls_attr is None:
        return False
    if isinstance(cls_attr, str):
        return target in cls_attr.split()
    return target in cls_attr


class _TurndownConverter(MarkdownConverter):
    """mjs ``turndown`` + MadCap custom rule 相当の HTML→MD converter。

    markdownify default はいくつかの点で turndown と挙動が異なるため、
    以下を override して byte 近接を取る:

    - ``*   `` (asterisk + 3 spaces) 形式の unordered list bullet
    - ``<ol>`` は MadCap custom rule に delegate (sibling ``<img>``/``<p>``/``<div>``
      を独立 block として emit し、``<li value="N">`` は ``N. `` 番号付き)
    - ``<a class="codeSnippetCopyButton">`` は strip
    - ``<div class="note|caution">`` は ``:::note/caution`` directive
    - ``<table>`` は Markdown pipe table
    - ``<details>`` は content のみ、``<summary>`` は ``## heading``
    """

    # markdownify 1.x は ``DefaultOptions`` + ``Options`` の 2 層で option を
    # 組み立てる (``_todict(Options)`` で後者が上書き) ため、``DefaultOptions``
    # の override だけだと ``heading_style`` 等が上書きされてしまう。両方を
    # 揃えて mjs turndown 互換の default を確保する。
    class DefaultOptions(MarkdownConverter.DefaultOptions):
        heading_style = "atx"
        bullets = "*"
        strong_em_symbol = "*"
        newline_style = "spaces"
        escape_asterisks = False
        escape_underscores = False
        escape_misc = False

    class Options(MarkdownConverter.Options):
        heading_style = "atx"
        bullets = "*"
        strong_em_symbol = "*"
        newline_style = "spaces"
        escape_asterisks = False
        escape_underscores = False
        escape_misc = False

    # ------------------------------------------------------------------
    # <em> → _italic_ (turndown default)
    # markdownify default は ``*italic*``。turndown は ``_italic_`` なので override
    # ------------------------------------------------------------------
    def convert_em(self, el: Tag, text: str, parent_tags: Any) -> str:
        if not text.strip():
            return text
        return f"_{text}_"

    def convert_i(self, el: Tag, text: str, parent_tags: Any) -> str:
        return self.convert_em(el, text, parent_tags)

    # ------------------------------------------------------------------
    # <li> — turndown は bullet 後に 3 spaces、markdownify default は 1 space
    # ------------------------------------------------------------------
    def convert_li(self, el: Tag, text: str, parent_tags: Any) -> str:
        # parent が <ol> の場合は MadCap custom rule (convert_ol) が担当する
        # (convert_ol で <li> を handle するので、ここでは <ul> 内の <li> のみ処理)
        parent = el.parent
        if parent is not None and parent.name == "ol":
            # convert_ol が独自処理するので、text だけ返す
            return text
        text = (text or "").strip()
        # turndown は ``*   `` (3 spaces)
        return f"*   {text}\n"

    # ------------------------------------------------------------------
    # <ul> — items を single newline 区切りでまとめる (turndown 互換)
    # ------------------------------------------------------------------
    def convert_ul(self, el: Tag, text: str, parent_tags: Any) -> str:
        items = [line for line in (text or "").split("\n") if line]
        if not items:
            return ""
        return "\n\n" + "\n".join(items) + "\n\n"

    # ------------------------------------------------------------------
    # <ol> — MadCap custom rule
    #   - <li value="N"> → "N. content"
    #   - <li> (no value) → "- content"
    #   - non-<li> siblings (img/p/div) → block content between items
    #   - items separated by blank line (``\n\n``)
    # ------------------------------------------------------------------
    def convert_ol(self, el: Tag, text: str, parent_tags: Any) -> str:
        parts: list[str] = []
        for child in el.children:
            if isinstance(child, str):
                if child.strip():
                    md = child.strip()
                    if md:
                        parts.append(md)
                continue
            if not isinstance(child, Tag):
                continue
            if child.name == "li":
                inner_html = child.decode_contents()
                inner_md = _convert_fragment(inner_html, self.options).strip()
                value = child.get("value")
                if value:
                    parts.append(f"{value}. {inner_md}")
                else:
                    parts.append(f"- {inner_md}")
            else:
                sibling_html = str(child)
                sibling_md = _convert_fragment(sibling_html, self.options).strip()
                if sibling_md:
                    parts.append(sibling_md)
        if not parts:
            return ""
        return "\n\n" + "\n\n".join(parts) + "\n\n"

    # ------------------------------------------------------------------
    # <a class="codeSnippetCopyButton"> → strip
    # <a> default は ``[text](href)`` だが、codeSnippetCopyButton は noise
    # ------------------------------------------------------------------
    def convert_a(self, el: Tag, text: str, parent_tags: Any) -> str:
        if _has_class(el, "codeSnippetCopyButton"):
            return ""
        return super().convert_a(el, text, parent_tags)

    # ------------------------------------------------------------------
    # <div class="note|caution"> → :::note/caution directive
    # ------------------------------------------------------------------
    def convert_div(self, el: Tag, text: str, parent_tags: Any) -> str:
        cls_attr = el.get("class")
        cls_value: str | None = None
        if isinstance(cls_attr, str):
            cls_value = cls_attr.strip()
        elif isinstance(cls_attr, list) and cls_attr:
            cls_value = " ".join(cls_attr).strip()
        if cls_value and cls_value in _CALLOUT_CLASS_MAP:
            directive = _CALLOUT_CLASS_MAP[cls_value]
            body = (text or "").strip()
            return f"\n\n:::{directive}\n{body}\n:::\n\n"
        return text

    # ------------------------------------------------------------------
    # <table> → Markdown pipe table (MadCap custom rule)
    # ------------------------------------------------------------------
    def convert_table(self, el: Tag, text: str, parent_tags: Any) -> str:
        rows: list[list[str]] = []
        # <tr> は <thead>/<tbody>/<tfoot> どこにいても拾う
        for tr in el.find_all("tr"):
            cells: list[str] = []
            for cell in tr.find_all(["th", "td"], recursive=False):
                cell_md = _convert_fragment(cell.decode_contents(), self.options).strip()
                cell_md = re.sub(r"\n+", " ", cell_md).replace("|", "\\|")
                cells.append(cell_md)
            if cells:
                rows.append(cells)
        if not rows:
            return ""
        col_count = max(len(r) for r in rows)
        lines: list[str] = []
        for i, row in enumerate(rows):
            padded = row + [""] * (col_count - len(row))
            lines.append("| " + " | ".join(padded) + " |")
            if i == 0:
                lines.append("| " + " | ".join(["---"] * col_count) + " |")
        return "\n\n" + "\n".join(lines) + "\n\n"

    # ------------------------------------------------------------------
    # <details>/<summary>
    # ------------------------------------------------------------------
    def convert_details(self, el: Tag, text: str, parent_tags: Any) -> str:
        return "\n\n" + (text or "").strip() + "\n\n"

    def convert_summary(self, el: Tag, text: str, parent_tags: Any) -> str:
        return "\n\n## " + (text or "").strip() + "\n\n"

    # ------------------------------------------------------------------
    # <pre><code class="language-X"> → fenced code block with language info
    # markdownify default は language info を出さないので override
    # ------------------------------------------------------------------
    def convert_pre(self, el: Tag, text: str, parent_tags: Any) -> str:
        # mjs turndown default rule: ``<pre>`` は ``<code>`` 子要素が居るときだけ
        # fenced code block にする。``<code>`` が無い ``<pre>`` は default 挙動
        # (text 相当) に fallback して余計な fence を emit しない。
        if el is None or not text:
            return ""
        code_tag = el.find("code")
        if not isinstance(code_tag, Tag):
            return text
        language = ""
        cls = code_tag.get("class")
        if isinstance(cls, list):
            for token in cls:
                if isinstance(token, str) and token.startswith("language-"):
                    language = token[len("language-") :]
                    break
        elif isinstance(cls, str):
            for token in cls.split():
                if token.startswith("language-"):
                    language = token[len("language-") :]
                    break
        code = text.strip("\n")
        return f"\n\n```{language}\n{code}\n```\n\n"


def _convert_fragment(html: str, options: dict[str, Any] | None = None) -> str:
    """``_TurndownConverter`` を inner HTML fragment に再適用する helper。

    MadCap ``<ol>`` rule の sibling 処理 / table cell 内部処理から呼ばれる。
    parent converter と同じ options を使って nested consistency を保つ。
    """
    converter = _TurndownConverter(**(options or {}))
    return converter.convert(html)


def html_to_md(html: str) -> str:
    """Preprocess-skip 版。``turndown.turndown(html)`` 相当。

    ``preprocess_en_html`` を通さないので callout/details 等の MadCap
    artifact 正規化は caller 責務。通常は ``convert_en_html_to_md`` を使う。
    """
    converter = _TurndownConverter()
    return _normalize_output(converter.convert(html))


def convert_en_html_to_md(html: str) -> str:
    """mjs ``convertEnHtmlToMd`` 相当。preprocess + turndown を 1 step で実行。

    ``preprocessEnHtml(html)`` を既存 Python port 経由で呼び (slug 未指定 =
    patches 適用なし、mjs default と一致)、その後 Turndown 等価 converter で
    Markdown へ変換する。
    """
    if not isinstance(html, str):
        raise TypeError(f"convert_en_html_to_md expected str, got {type(html).__name__}")
    preprocessed = preprocess_en_html(html)
    return html_to_md(preprocessed)


# ``convert`` 後の空行過多 / 末尾改行を turndown 出力形式に揃える。
# markdownify 側は output 末尾に複数の改行を残すケースがあるため、trim で
# byte-parity に寄せる。mjs turndown は基本的に leading/trailing blank line
# を 1 つまでしか残さない。
_MULTI_BLANK_LINE_RE: re.Pattern[str] = re.compile(r"\n{3,}")


def _normalize_output(markdown: str) -> str:
    md = markdown or ""

    def _collapse(match: Match[str]) -> str:
        return "\n\n"

    md = _MULTI_BLANK_LINE_RE.sub(_collapse, md)
    return md.strip()
