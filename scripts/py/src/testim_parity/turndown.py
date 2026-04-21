"""``scripts/lib/turndown.mjs`` の Python port。

``convertEnHtmlToMd(html)`` と ``preprocessEnHtml(html, options)`` を提供する。
mjs 版は ``turndown`` npm package + 5 つの custom rule (madcap-callout /
madcap-code-snippet-copy / madcap-ordered-list / madcap-table / html-details+summary)
で構成されている。

Python 版は ``markdownify.MarkdownConverter`` を subclass し、必要な
output format (``*   `` 3-space bullet / ``**bold**`` / ``_italic_`` / ATX heading /
fenced code with language) を replicate する。

**turndown default rule の Python port**: review round-1/2 P1/P2 対応で以下を
上書き実装:

- ``convert_li`` — leading ``\\n`` strip + trailing ``\\n+`` collapse +
  ``\\n`` → ``\\n    `` (4-space indent)。nested list / multi-paragraph
  list item を flatten せず turndown 互換で保持する。trimmed content が空
  なら bullet ごと省略 (round-2 P2)
- ``convert_ul`` — 親が ``<li>`` で last element child のときは ``\\n`` +
  content、さもなくば ``\\n\\n`` + content + ``\\n\\n``。turndown default
  の list rule 等価
- ``convert_em`` / ``convert_i`` / ``convert_strong`` / ``convert_b`` —
  turndown の ``flankingWhitespace`` を port (round-2 P1)。content を trim
  して marker 外側に whitespace を emit、sibling が既に whitespace を持つ
  場合は二重 space を避けるため省略する
- ``convert_img`` — ``![alt](src "title")`` を常に emit (markdownify default
  の ``_inline`` context alt-text fallback を無効化)。table cell / heading
  内の ``<img>`` を preserve する
- ``_strip_empty_inline_elements`` — raw HTML 段階で ``<em></em>`` /
  ``<em>   </em>`` 等の空 inline を除去。mjs turndown の DOM whitespace
  normalization を emulate し、``A <em></em> B`` → ``A B`` (単一 space) に
  collapse する
- ``_normalize_output`` は fence-aware split (``_FENCE_BLOCK_RE``) で code
  fence 内部の連続空行を preserve する。mjs turndown は code content を
  byte for byte 保持するため、global な ``\\n{3,}`` → ``\\n\\n`` collapse は
  fence 外側のみ適用する必要がある (round-4 P1 対応)

**byte-parity 戦略**: 39 代表 MadCap pattern (5 custom rule + nested list +
multi-paragraph li + table cell img + heading img + 8 emphasis flanking
whitespace / empty inline / empty li + 3 code fence blank-line preservation
+ 4 preprocess chain) を unit test で mjs turndown 出力と byte 比較。
288-page corpus 全体の byte-parity は M2/M3 integration 時に計測する
(``test_convert_en_html_to_md_288_matrix``)。

``preprocess_en_html`` は既存の ``preprocess_en`` module の re-export。
"""

from __future__ import annotations

import re
from typing import Any

from bs4 import NavigableString, Tag
from markdownify import MarkdownConverter

from .preprocess_en import preprocess_en_html

__all__ = ["convert_en_html_to_md", "html_to_md", "preprocess_en_html"]


_CALLOUT_CLASS_MAP: dict[str, str] = {
    "note": "note",
    "caution": "caution",
}

# ``convert_li`` / ``convert_ul`` の turndown 互換 transformation に使う正規表現。
# mjs turndown の JS 版: ``content.replace(/^\n+/, '')`` 等価。
_LEADING_NEWLINES_RE: re.Pattern[str] = re.compile(r"^\n+")
_TRAILING_NEWLINES_RE: re.Pattern[str] = re.compile(r"\n+$")

# ``_is_flanked_by_whitespace`` で使う sibling whitespace 検出 regex。
# emphasis / strong が多いページで毎回 ``re.compile`` を踏まないよう module
# 定数化 (review round-3 M1 対応)。
_LEFT_FLANK_RE: re.Pattern[str] = re.compile(r" $")
_RIGHT_FLANK_RE: re.Pattern[str] = re.compile(r"^ ")

# ``convert_pre`` で code content の末尾 ``\n`` を **1 個だけ** 削除するための
# regex。mjs turndown の ``code.replace(/\n$/, '')`` と等価。
# 重要: Python の ``$`` は default flag で end-of-string **と** 最終 ``\n`` 直前
# 両方にマッチするため、 ``r"\n$"`` では ``"line1\n\n\n"`` から 2 文字剥がされ
# ``"line1\n"`` になる。JS の ``/\n$/`` は末尾 1 個のみ剥がす挙動なので、
# Python では ``\Z`` (absolute end-of-string) を使う必要がある。
_TRAILING_SINGLE_NEWLINE_RE: re.Pattern[str] = re.compile(r"\n\Z")

# ``_convert_fragment`` の recursion depth guard。MadCap HTML では通常 5-10
# 階層程度だが、malformed HTML に対して RecursionError を未然に防ぐ。
_MAX_FRAGMENT_DEPTH: int = 40


def _has_class(node: Tag, target: str) -> bool:
    cls_attr = node.get("class")
    if cls_attr is None:
        return False
    if isinstance(cls_attr, str):
        return target in cls_attr.split()
    return target in cls_attr


def _has_next_li_sibling(el: Tag) -> bool:
    """``<li>`` の直後の兄弟に別の ``<li>`` があるか。

    turndown default の li rule が trailing ``\\n`` を出すか判定するのに使う
    (``node.nextSibling && !/\\n$/.test(content)`` の Python 等価)。
    """
    sibling = el.next_sibling
    while sibling is not None:
        if isinstance(sibling, Tag):
            # li 以外の Tag が挟まっていれば false (実用上起きないが安全側に)
            return sibling.name == "li"
        sibling = sibling.next_sibling
    return False


def _is_last_element_of_parent_li(el: Tag) -> bool:
    """``el`` が ``<li>`` の last element child か。

    turndown list rule: nested ``<ul>`` / ``<ol>`` が li の last child なら
    ``\\n`` + content、さもなくば ``\\n\\n`` で包む。この分岐に使う。
    """
    parent = el.parent
    if parent is None or parent.name != "li":
        return False
    last_elem: Tag | None = None
    for child in parent.children:
        if isinstance(child, Tag):
            last_elem = child
    return last_elem is el


def _sibling_text(sibling: Any) -> str:
    """直接 sibling (NavigableString または Tag) から text content を取り出す。"""
    if sibling is None:
        return ""
    if isinstance(sibling, NavigableString):
        return str(sibling)
    if isinstance(sibling, Tag):
        return sibling.get_text()
    return ""


def _is_flanked_by_whitespace(side: str, el: Tag) -> bool:
    """turndown ``isFlankedByWhitespace`` 等価。

    side=="left" なら ``el.previous_sibling`` の末尾 space を、"right" なら
    ``el.next_sibling`` の先頭 space を確認する。flanked なら自分 (el) は
    flanking whitespace を emit しない (double space を防ぐ)。
    """
    if side == "left":
        sibling = el.previous_sibling
        pattern = _LEFT_FLANK_RE
    else:
        sibling = el.next_sibling
        pattern = _RIGHT_FLANK_RE
    value = _sibling_text(sibling)
    return bool(value and pattern.search(value))


def _flanking_whitespace(el: Tag) -> tuple[str, str]:
    """turndown ``flankingWhitespace`` 等価。

    inline node (em/i/strong/b) が leading/trailing whitespace を持つ場合、
    そのぶんを marker の **外側** に emit する。ただし sibling 側が既に
    whitespace を持つなら二重 space を避けるため emit しない。
    """
    text = el.get_text()
    if not text:
        return "", ""
    has_leading = text[0].isspace()
    has_trailing = text[-1].isspace()
    blank_with_spaces = text.strip() == ""
    leading = ""
    trailing = ""
    if has_leading and not _is_flanked_by_whitespace("left", el):
        leading = " "
    if not blank_with_spaces and has_trailing and not _is_flanked_by_whitespace("right", el):
        trailing = " "
    return leading, trailing


def _inline_replacement(el: Tag, text: str, marker: str) -> str:
    """turndown-style inline emphasis/strong replacement。

    content を trim してから marker で囲み、flanking whitespace は marker の
    **外側** に置く。trimmed content が空なら marker 無しで flanking のみ
    (mjs turndown と同じ)。
    """
    content = (text or "").strip()
    if not content:
        return ""
    leading, trailing = _flanking_whitespace(el)
    return f"{leading}{marker}{content}{marker}{trailing}"


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
    # <em>/<i>/<strong>/<b> — turndown default の ``flankingWhitespace`` +
    # chomp を port する (review round-2 P1 対応)。
    # - content を trim して marker で囲み、leading/trailing whitespace は
    #   marker の **外側** に emit
    # - sibling が既に whitespace を持つなら flanking を emit しない
    #   (``A <em> text </em> B`` → ``A _text_ B`` という double-space 無し)
    # - trimmed content が空なら marker ごと省略
    # ------------------------------------------------------------------
    def convert_em(self, el: Tag, text: str, parent_tags: Any) -> str:
        return _inline_replacement(el, text, "_")

    def convert_i(self, el: Tag, text: str, parent_tags: Any) -> str:
        return _inline_replacement(el, text, "_")

    def convert_strong(self, el: Tag, text: str, parent_tags: Any) -> str:
        return _inline_replacement(el, text, "**")

    def convert_b(self, el: Tag, text: str, parent_tags: Any) -> str:
        return _inline_replacement(el, text, "**")

    # ------------------------------------------------------------------
    # <li> — turndown rule:
    #   - strip leading ``\n``
    #   - trailing ``\n+`` を ``\n`` 1 個に collapse
    #   - 残った ``\n`` は全て ``\n    `` (4-space indent) に置換
    #   - prefix に ``*   `` (ul) または ``N.  `` (ol) を付与
    #   - 次の li 兄弟がある場合のみ trailing ``\n`` を追加
    # こうすることで nested list / multi-paragraph list item が turndown 互換
    # の indent で保持される。mjs は ``turndown`` npm の default rule、Python
    # はそれを忠実に再現する。
    # ------------------------------------------------------------------
    def convert_li(self, el: Tag, text: str, parent_tags: Any) -> str:
        # parent が <ol> の場合は MadCap custom rule (convert_ol) が担当する
        # (convert_ol で <li> を handle するので、ここでは <ul> 内の <li> のみ処理)
        parent = el.parent
        if parent is not None and parent.name == "ol":
            return text
        content = text or ""
        # Review round-2 P2 対応: trimmed content が空なら bullet ごと省略
        # (mjs turndown は ``<li></li>`` / ``<li>   </li>`` を empty 文字列化する)。
        # ``content.strip()`` は whitespace-only の list item も拾う。
        if not content.strip():
            return ""
        # leading newlines を削除
        content = _LEADING_NEWLINES_RE.sub("", content)
        # trailing newlines を ``\n`` 1 個に collapse
        content = _TRAILING_NEWLINES_RE.sub("\n", content)
        # 残る newline を 4-space indent
        content = content.replace("\n", "\n    ")
        # 兄弟に次の li があれば trailing ``\n`` を足す (turndown 互換)
        has_next_li = _has_next_li_sibling(el)
        suffix = "\n" if has_next_li and not content.endswith("\n") else ""
        return f"*   {content}{suffix}"

    # ------------------------------------------------------------------
    # <ul> — turndown rule: nested (親が <li>) なら ``\n`` + content、
    # さもなくば ``\n\n`` + content + ``\n\n``。 nested ul/ol が li の last
    # child として含まれる時に余計な blank line が入らない。
    # ------------------------------------------------------------------
    def convert_ul(self, el: Tag, text: str, parent_tags: Any) -> str:
        content = (text or "").rstrip("\n")
        if not content:
            return ""
        if _is_last_element_of_parent_li(el):
            return "\n" + content
        return "\n\n" + content + "\n\n"

    # ------------------------------------------------------------------
    # <ol> — MadCap custom rule
    #   - <li value="N"> → "N. content"
    #   - <li> (no value) → "- content"
    #   - non-<li> siblings (img/p/div) → block content between items
    #   - items separated by blank line (``\n\n``)
    # ------------------------------------------------------------------
    def convert_ol(self, el: Tag, text: str, parent_tags: Any) -> str:
        depth = getattr(self, "_fragment_depth", 0)
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
                inner_md = _convert_fragment(inner_html, self.options, _depth=depth + 1).strip()
                value = child.get("value")
                if value:
                    parts.append(f"{value}. {inner_md}")
                else:
                    parts.append(f"- {inner_md}")
            else:
                sibling_html = str(child)
                sibling_md = _convert_fragment(sibling_html, self.options, _depth=depth + 1).strip()
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
    # <img> — turndown は常に ``![alt](src)`` を出す。markdownify は inline
    # context (table cell / heading / span 等) で alt text にフォールバック
    # するため、不変で markdown image を emit するよう override する。
    # ``title`` 属性は mjs turndown と同じく ``"..."`` 形式で付与する。
    # ------------------------------------------------------------------
    def convert_img(self, el: Tag, text: str, parent_tags: Any) -> str:
        alt = el.attrs.get("alt") or ""
        src = el.attrs.get("src") or ""
        title = el.attrs.get("title") or ""
        if title:
            safe_title = title.replace('"', '\\"')
            return f'![{alt}]({src} "{safe_title}")'
        return f"![{alt}]({src})"

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
        depth = getattr(self, "_fragment_depth", 0)
        rows: list[list[str]] = []
        # <tr> は <thead>/<tbody>/<tfoot> どこにいても拾う
        for tr in el.find_all("tr"):
            cells: list[str] = []
            for cell in tr.find_all(["th", "td"], recursive=False):
                cell_md = _convert_fragment(
                    cell.decode_contents(), self.options, _depth=depth + 1
                ).strip()
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
    # markdownify default は language info を出さないので override。
    #
    # mjs turndown ``fencedCodeBlock`` rule:
    #   var code = node.firstChild.textContent;  // raw text from <code>
    #   return '\n\n``` ' + lang + '\n' + code.replace(/\n$/, '') + '\n```\n\n';
    #
    # 重要な挙動 (review round-5 P1 対応):
    #   - code content は ``<code>.textContent`` の raw 読み出し
    #     (markdownify の inline-code 変換を迂回して mjs と一致させる)
    #   - ``code.replace(/\n$/, '')`` は **末尾 1 個の ``\n`` のみ** 削除する
    #     (全部削除ではない。先頭/末尾の blank line を preserve するため)
    #   - ``convert_pre`` 内で ``text.strip("\n")`` や ``.strip()`` を使うと
    #     先頭 blank + 複数末尾 blank が落ちて byte-parity が崩れる
    # ------------------------------------------------------------------
    def convert_pre(self, el: Tag, text: str, parent_tags: Any) -> str:
        # mjs turndown default rule: ``<pre>`` は ``<code>`` 子要素が居るときだけ
        # fenced code block にする。``<code>`` が無い ``<pre>`` は default 挙動
        # (text 相当) に fallback して余計な fence を emit しない。
        if el is None:
            return ""
        code_tag = el.find("code")
        if not isinstance(code_tag, Tag):
            return text
        # mjs ``node.firstChild.textContent`` 等価。markdownify が ``<code>`` を
        # inline code ``\`...\``` として wrap するのを迂回し、code boundary の
        # leading/trailing ``\n`` を保持する。
        raw_code = code_tag.get_text()
        if not raw_code:
            return ""
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
        # mjs ``code.replace(/\n$/, '')`` — 末尾 ``\n`` を **1 個だけ** 削除。
        # ``strip("\n")`` や ``rstrip("\n")`` (= 全削除) とは明確に異なる。
        code = _TRAILING_SINGLE_NEWLINE_RE.sub("", raw_code)
        return f"\n\n```{language}\n{code}\n```\n\n"


def _convert_fragment(
    html: str,
    options: dict[str, Any] | None = None,
    *,
    _depth: int = 0,
) -> str:
    """``_TurndownConverter`` を inner HTML fragment に再適用する helper。

    MadCap ``<ol>`` rule の sibling 処理 / table cell 内部処理から呼ばれる。
    parent converter と同じ options を使って nested consistency を保つ。

    ``_depth`` は `_MAX_FRAGMENT_DEPTH` までの再帰深度 guard。現実の MadCap
    HTML では 5-10 階層程度だが、malformed HTML に対して ``RecursionError``
    を未然に防ぐための defensive cap。超過時は raw HTML を返す。
    """
    if _depth >= _MAX_FRAGMENT_DEPTH:
        return html
    converter = _TurndownConverter(**(options or {}))
    converter._fragment_depth = _depth  # nested convert_ol/convert_table が depth+1 で使う
    return converter.convert(html)


_EMPTY_INLINE_RE: re.Pattern[str] = re.compile(
    r"<(em|i|strong|b)\b[^>]*>\s*</\1>",
    re.IGNORECASE,
)


def _strip_empty_inline_elements(html: str) -> str:
    """empty/whitespace-only ``<em>`` / ``<i>`` / ``<strong>`` / ``<b>`` を除去。

    mjs turndown は DOM レベルの whitespace 正規化で ``<p>A <em></em> B</p>`` を
    ``A B`` (単一 space) に collapse するが、Python / markdownify は raw text
    node を preserve するため ``A  B`` (double space) になる。事前に空 inline
    を raw HTML から剥がしておくと、 ``<p>A  B</p>`` と text node 1 つに
    merge されて parent converter が text 側の double-space を ``A B`` に
    collapse する (markdownify は text 内の whitespace run を single space に
    縮約する)。
    """
    return _EMPTY_INLINE_RE.sub("", html)


def html_to_md(html: str) -> str:
    """Preprocess-skip 版。``turndown.turndown(html)`` 相当。

    ``preprocess_en_html`` を通さないので callout/details 等の MadCap
    artifact 正規化は caller 責務。通常は ``convert_en_html_to_md`` を使う。
    """
    # review round-2 P1 (empty/whitespace emphasis)対応: raw HTML 段階で空
    # inline 要素を除去し、markdownify の text-node whitespace collapse に任せる
    normalized_html = _strip_empty_inline_elements(html)
    converter = _TurndownConverter()
    return _normalize_output(converter.convert(normalized_html))


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

# Fenced code block segmentation pattern (review round-4 P1 対応)。
# ``\n{3,}`` collapse を適用する際、code fence 内部の改行数は preserve する
# 必要がある (mjs turndown は code content を byte for byte 保持する)。
# MadCap の code fence は常に ```<lang>\n...\n``` 形式 (``convert_pre`` の
# 出力 format) なので single-line language tag + body + closing fence の
# 非貪欲マッチで切り出す。nested fence は corpus に存在しない契約。
_FENCE_BLOCK_RE: re.Pattern[str] = re.compile(
    r"```[^\n]*\n[\s\S]*?\n```",
)


def _normalize_output(markdown: str) -> str:
    md = markdown or ""
    # code fence 内部は preserve する。split で fence 部 (capture group 付き)
    # と非 fence 部を交互に取り出し、非 fence 部だけに ``\n{3,}`` collapse を
    # 適用する。``re.split`` は capture group あり pattern では capture 部
    # も結果に混ぜるので、偶数 index = 非 fence、奇数 index = fence になる。
    parts = _FENCE_BLOCK_RE.split(md)
    fences = _FENCE_BLOCK_RE.findall(md)
    for i in range(len(parts)):
        parts[i] = _MULTI_BLANK_LINE_RE.sub("\n\n", parts[i])
    rebuilt: list[str] = []
    for i, part in enumerate(parts):
        rebuilt.append(part)
        if i < len(fences):
            rebuilt.append(fences[i])
    return "".join(rebuilt).strip()
