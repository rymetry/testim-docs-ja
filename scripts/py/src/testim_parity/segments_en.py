"""EN HTML canonical segment extractor — ``source_parity_segments_en.mjs`` の port。

MadCap Flare HTML から turndown を介さず **直接** canonical segment を抽出する。
turndown のバージョン変動の影響を受けないよう、segment 境界を extractor 側で
固定化する設計 (mjs と同一)。

## パイプライン (mjs と同一)

1. ``preprocess_en_html`` (turndown 由来、Phase 1.1 で port 済) —
   entity-encoded ``<details>`` と escaped callout を実 HTML に戻す
2. ``_preprocess_html`` — ``<a class="codeSnippetCopyButton">`` / anchor-only
   ``<a>`` / ``<thead>`` / HTML コメント / ``<script>`` / ``<style>`` / ``<col>``
   を DOM 上で除去。slug-scope の warning-like ``<blockquote>`` →
   ``<div class="callout-note">`` 書き換えも DOM 経由で適用
3. ``BeautifulSoup(html, "lxml")`` で tree 構築。mjs custom tokenizer が
   扱っていた malformed HTML も lxml の自動回復で吸収する
4. ``_walk_block_container`` → ``_walk_block`` が tree を走り、heading stack
   を更新しながら segment を emit

## BS4 採用の根拠

mjs は自前 tokenizer + lightweight DOM を使うが、Python port では BS4/lxml を
採用。根拠:

- ``<ol>`` + non-``<li>`` 兄弟 (433 件の MadCap fragmented list パターン) が
  lxml で reparent されず、mjs buildTree と同じ兄弟順が保持されることを実測で
  確認済み
- lxml の自動 malformed HTML 回復は mjs の「mismatched close tag で pop」
  ロジックより堅牢
- 自前 tokenizer を Python に持ち込むと保守負荷が増える

Phase 1 verification gate (288-page matrix) で segment 一致を hard 確認する。
"""

from __future__ import annotations

import re
from typing import Any

from bs4 import BeautifulSoup, Comment, NavigableString, Tag

from .preprocess_en import preprocess_en_html
from .segments_shared import build_section_path, create_segment, push_heading

__all__ = [
    "CALLOUT_NORMALIZATION_SLUGS",
    "decode_entities",
    "extract_segments_from_html",
]


# ---------------------------------------------------------------------------
# Slug-scoped callout normalization allow list
# ---------------------------------------------------------------------------

#: ``parity_glossary_mask.mjs`` CALLOUT_NORMALIZATION_SLUGS と **1:1** で同期。
#: allow list 内の slug で warning-like ``<blockquote>`` を
#: ``<div class="callout-note">`` に書き換え、JA 側 ``:::note`` と kind-level
#: parity を揃える (詳細は mjs 側 docstring 参照)。
CALLOUT_NORMALIZATION_SLUGS: frozenset[str] = frozenset({"administration/api-access"})


# ---------------------------------------------------------------------------
# HTML entity decoding — mjs が扱う subset を完全再現
# ---------------------------------------------------------------------------

_NAMED_ENTITIES: dict[str, str] = {
    "amp": "&",
    "lt": "<",
    "gt": ">",
    "quot": '"',
    "apos": "'",
    "nbsp": "\u00a0",
    "hellip": "\u2026",
    "rsquo": "\u2019",
    "lsquo": "\u2018",
    "rdquo": "\u201d",
    "ldquo": "\u201c",
    "ndash": "\u2013",
    "mdash": "\u2014",
    "copy": "\u00a9",
    "reg": "\u00ae",
    "trade": "\u2122",
}

_ENTITY_RE = re.compile(r"&(#x?[0-9a-f]+|[a-z][a-z0-9]*);", re.IGNORECASE)


def decode_entities(text: object) -> str:
    """mjs ``decodeEntities`` と同一挙動。未知 entity は原文を保持。"""
    if not isinstance(text, str):
        return ""

    def repl(match: re.Match[str]) -> str:
        inner = match.group(1)
        if inner.startswith("#"):
            try:
                code = int(inner[2:], 16) if inner[1:2] in ("x", "X") else int(inner[1:], 10)
                return chr(code)
            except (ValueError, OverflowError):
                return match.group(0)
        named = _NAMED_ENTITIES.get(inner.lower())
        return named if named is not None else match.group(0)

    return _ENTITY_RE.sub(repl, text)


# ---------------------------------------------------------------------------
# BS4 helpers — mjs node shape (``{tag, attrs, children}``) と差を吸収
# ---------------------------------------------------------------------------


def _get_class_string(node: Tag) -> str:
    """BS4 の class 属性 (list | str | None) を空白区切り文字列に正規化。"""
    cls = node.get("class")
    if cls is None:
        return ""
    if isinstance(cls, str):
        return cls
    # AttributeValueList (Sequence[str])
    return " ".join(cls)


_CODE_SNIPPET_CLASS_RE = re.compile(r"\bcodeSnippet(?:Body)?\b")
_CALLOUT_CLASS_RE = re.compile(r"\b(note|caution|warning|info|tip|danger)\b", re.IGNORECASE)


def _is_code_snippet_div(node: Tag) -> bool:
    if node.name != "div":
        return False
    return bool(_CODE_SNIPPET_CLASS_RE.search(_get_class_string(node)))


#: ``_has_class`` の hot path 用に pre-compile した pattern cache。呼び出し側が
#: 使う class 名は ``FileOrFilePath`` のみだが、API は一般化しているため引数ごとの
#: `re.compile` コストを ``functools.lru_cache`` ではなく明示的な dict で償却する。
_CLASS_PATTERN_CACHE: dict[str, re.Pattern[str]] = {}


def _class_pattern(class_name: str) -> re.Pattern[str]:
    cached = _CLASS_PATTERN_CACHE.get(class_name)
    if cached is not None:
        return cached
    compiled = re.compile(rf"(?:^|\s){re.escape(class_name)}(?:\s|$)")
    _CLASS_PATTERN_CACHE[class_name] = compiled
    return compiled


def _has_class(node: Tag | None, class_name: str) -> bool:
    """``class`` 属性に whitespace-delimited な ``class_name`` を含むか。

    tree walk の hot path で毎 node 呼ばれるため、pattern は
    ``_CLASS_PATTERN_CACHE`` で module-level に cache する。
    """
    if node is None:
        return False
    cls = _get_class_string(node)
    if not cls:
        return False
    return bool(_class_pattern(class_name).search(cls))


def _is_callout_div(node: Tag) -> bool:
    if node.name != "div":
        return False
    return bool(_CALLOUT_CLASS_RE.search(_get_class_string(node)))


def _iter_element_children(node: Tag) -> list[Any]:
    """``node.contents`` を返す (BS4 は ``PageElement`` 混在の list を返す)。

    呼び出し側は ``isinstance(child, NavigableString)`` → ``isinstance(child, Tag)``
    で振り分ける。mypy 上は BS4 の ``list[PageElement]`` を ``list[Any]`` として
    受ける (``PageElement`` は ``NavigableString`` と ``Tag`` の共通基底)。
    """
    return list(node.contents)


# ---------------------------------------------------------------------------
# Preprocessing — noise 除去 + slug-scope normalization
# ---------------------------------------------------------------------------

_COPY_BUTTON_CLASS = "codeSnippetCopyButton"
_MAX_CALLOUT_PARAGRAPHS = 3
_WARNING_LEAD_RE = re.compile(
    r"^\s*(?:<(?:strong|b)>\s*)?(note|warning|important|caution|tip|danger)\b",
    re.IGNORECASE,
)
_BLOCKQUOTE_P_RE = re.compile(r"<p\b[^>]*>([\s\S]*?)</p>", re.IGNORECASE)


def _is_warning_like_blockquote(inner_html: str) -> bool:
    """mjs ``isWarningLikeBlockquote`` と同一の 3 条件判定。"""
    paragraphs = [m.group(1) for m in _BLOCKQUOTE_P_RE.finditer(inner_html)]
    if not paragraphs:
        return False
    if len(paragraphs) > _MAX_CALLOUT_PARAGRAPHS:
        return False
    return bool(_WARNING_LEAD_RE.match(paragraphs[0]))


def _normalize_callouts_dom(soup: BeautifulSoup, slug: str, allow_slugs: frozenset[str]) -> None:
    """slug-scope で warning-like ``<blockquote>`` → ``<div class="callout-note">``。

    mjs は regex-based で書き換えるが、Python 側は tree パース後の DOM で行う。
    inner_html 判定は mjs と同じ正規表現を利用し、判定境界を揃える。
    """
    if not slug or slug not in allow_slugs:
        return
    for bq in list(soup.find_all("blockquote")):
        inner_html = bq.decode_contents()
        if not _is_warning_like_blockquote(inner_html):
            continue
        new_div = soup.new_tag("div", attrs={"class": "callout-note"})
        # ``bq.contents`` は BS4 ``PageElement`` のみを含むので、どの child も
        # ``.extract()`` を持つ。mjs 契約では children の順序を保ったまま移す。
        for child in list(bq.contents):
            new_div.append(child.extract())
        bq.replace_with(new_div)


def _clean_soup(
    soup: BeautifulSoup,
    slug: str | None = None,
    callout_allow_slugs: frozenset[str] | None = None,
) -> BeautifulSoup:
    """MadCap noise を削ぎ落とした soup を返す (in-place 変更して返す)。

    mjs ``preprocessHtml`` (regex strip) と等価の DOM 操作を行う:

    - HTML コメント除去 (``Comment`` node を decompose)
    - ``<script>`` / ``<style>`` decompose
    - ``<a class="codeSnippetCopyButton">`` decompose
    - anchor-only ``<a name="...">`` decompose
    - ``<thead>`` decompose (header rows は non-gate)
    - ``<col>`` decompose
    - slug-scope callout normalization (``callout_allow_slugs`` が Set で
      渡され、かつ ``slug`` がその Set に含まれるときのみ)

    ``<div class="codeSnippet">`` は **意図的に残す** — nested codeSnippetBody を
    regex で切ると外側 tree が壊れるリスクがあるため、walk 側の
    ``_is_code_snippet_div`` で drop する契約 (mjs と同一)。

    ``callout_allow_slugs`` が ``None`` の場合は normalization を一切行わない
    (mjs ``normalizeCallouts`` の ``calloutAllowSlugs instanceof Set`` guard と
    同じ挙動。production caller は常に ``CALLOUT_NORMALIZATION_SLUGS`` を
    明示的に渡す契約。review H4 で mjs と揃える修正)。
    """
    # HTML コメントを除去 (``Comment`` は ``NavigableString`` のサブクラス)
    for comment in soup.find_all(string=lambda s: isinstance(s, Comment)):
        comment.extract()

    for tag_name in ("script", "style", "thead", "col"):
        for node in list(soup.find_all(tag_name)):
            node.decompose()

    for copy_btn in list(soup.select(f"a.{_COPY_BUTTON_CLASS}")):
        copy_btn.decompose()

    for anchor in list(soup.find_all("a")):
        if anchor.get("name") and not anchor.get_text(strip=True) and not anchor.find():
            anchor.decompose()

    if slug and callout_allow_slugs is not None:
        _normalize_callouts_dom(soup, slug, callout_allow_slugs)

    return soup


# ---------------------------------------------------------------------------
# Inline text rendering (mjs renderInlineText + collectInlineText の port)
# ---------------------------------------------------------------------------

_INLINE_JOIN_TAGS: frozenset[str] = frozenset(
    {
        "span",
        "strong",
        "em",
        "b",
        "i",
        "a",
        "code",
        "kbd",
        "sub",
        "sup",
        "mark",
        "small",
        "u",
        "s",
        "del",
        "ins",
        "cite",
        "q",
        "abbr",
        "dfn",
        "var",
        "samp",
    }
)


def _render_inline_text(node: Tag | NavigableString | None, buffer: list[str]) -> None:
    """mjs ``renderInlineText`` の Python 版。invariant token を backtick /
    markdown-link で wrap して ``extractInvariantTokens`` が拾えるようにする。

    **entity 扱いの注意**: BS4/lxml が text 読み込み時に entity を auto-decode
    するため、ここで ``decode_entities`` を **再適用しない**。再適用すると
    ``&amp;#x73;`` → lxml で ``&#x73;`` になった後、さらに ``decode_entities``
    で ``s`` まで戻されて mjs (single-pass decode) と divergence する。
    mjs は custom tokenizer が raw entity を保持したまま text token を吐き、
    ``decodeEntities`` で 1 段だけ decode する前提。BS4 経路では lxml の 1 段が
    mjs の 1 段に対応する (Phase 1.3 verification で発覚)。
    """
    if node is None:
        return
    if isinstance(node, NavigableString):
        buffer.append(str(node))
        return
    if not isinstance(node, Tag):
        return

    tag = node.name

    if tag in {"br", "hr", "img"}:
        buffer.append(" ")
        return

    if tag == "code":
        inner: list[str] = []
        for child in _iter_element_children(node):
            _render_inline_text(child, inner)
        buffer.append("`")
        buffer.append("".join(inner).strip())
        buffer.append("`")
        return

    if tag == "a":
        inner_a: list[str] = []
        for child in _iter_element_children(node):
            _render_inline_text(child, inner_a)
        label = "".join(inner_a).strip()
        raw_href = node.get("href")
        if isinstance(raw_href, str):
            # BS4 が href を auto-decode 済みなので decode_entities は呼ばない
            # (text 側と同じ double-decode regression を回避)。
            href = raw_href
            if href and not href.startswith("#") and not href.startswith("javascript:"):
                buffer.append("[")
                buffer.append(label)
                buffer.append("](")
                buffer.append(href)
                buffer.append(")")
                return
        buffer.append(label)
        return

    if tag == "span" and _has_class(node, "FileOrFilePath"):
        inner_fp: list[str] = []
        for child in _iter_element_children(node):
            _render_inline_text(child, inner_fp)
        buffer.append("`")
        buffer.append("".join(inner_fp).strip())
        buffer.append("`")
        return

    if tag in _INLINE_JOIN_TAGS:
        for child in _iter_element_children(node):
            _render_inline_text(child, buffer)
        return

    # 未知 block-level inline context — transparently recurse
    for child in _iter_element_children(node):
        _render_inline_text(child, buffer)


_WHITESPACE_RUN_RE = re.compile(r"\s+")


def _collect_inline_text(node: Tag) -> str:
    buffer: list[str] = []
    for child in _iter_element_children(node):
        _render_inline_text(child, buffer)
    return _WHITESPACE_RUN_RE.sub(" ", "".join(buffer)).strip()


# ---------------------------------------------------------------------------
# Walker — emits segments with heading stack tracking
# ---------------------------------------------------------------------------


class _Emitter:
    """mjs ``makeEmitter`` の Python 等価。section+kind ごとに index を振る。"""

    __slots__ = ("segments", "_counters")

    def __init__(self) -> None:
        self.segments: list[dict[str, Any]] = []
        self._counters: dict[str, int] = {}

    def emit(self, section_path: str, kind: str, raw_text: str) -> None:
        if not raw_text or not raw_text.strip():
            return
        key = f"{section_path}\x00{kind}"
        index = self._counters.get(key, 0)
        self._counters[key] = index + 1
        self.segments.append(
            create_segment(
                section_path=section_path,
                kind=kind,
                segment_index=index,
                raw_text=raw_text,
            )
        )


class _WalkState:
    __slots__ = ("emitter", "heading_stack", "h1_consumed")

    def __init__(self) -> None:
        self.emitter = _Emitter()
        self.heading_stack: list[dict[str, Any]] = []
        self.h1_consumed = False


def _current_section_path(state: _WalkState) -> str:
    return build_section_path(state.heading_stack)


def _walk_block_container(node: Tag, state: _WalkState) -> None:
    """Block container (body / root / section) を walk。

    Loose text ノードと連続した inline element は **1 paragraph にマージ** して
    emit する。mjs と同じ loose-buffer pattern。
    """
    loose_buffer: list[str] = []

    def flush_loose() -> None:
        if not loose_buffer:
            return
        text = _WHITESPACE_RUN_RE.sub(" ", "".join(loose_buffer)).strip()
        loose_buffer.clear()
        if text:
            state.emitter.emit(_current_section_path(state), "paragraph", text)

    for child in _iter_element_children(node):
        if isinstance(child, NavigableString):
            # BS4 が text を auto-decode 済みなので decode_entities は呼ばない
            loose_buffer.append(str(child))
            continue
        if not isinstance(child, Tag):
            continue

        if child.name in _INLINE_JOIN_TAGS or child.name == "br":
            _render_inline_text(child, loose_buffer)
            continue

        flush_loose()
        _walk_block(child, state)

    flush_loose()


_HEADING_RE = re.compile(r"^h[1-6]$")


def _walk_block(node: Tag, state: _WalkState) -> None:
    tag = node.name

    # Headings
    if tag and _HEADING_RE.match(tag):
        level = int(tag[1:])
        text = _collect_inline_text(node)
        if level == 1 and not state.h1_consumed:
            state.h1_consumed = True
            return
        state.heading_stack = push_heading(state.heading_stack, level, text)
        state.emitter.emit(_current_section_path(state), "heading", text)
        return

    if _is_code_snippet_div(node):
        return

    if _is_callout_div(node):
        _walk_callout_body(node, state)
        return

    if tag in {"div", "section", "article", "main"}:
        _walk_block_container(node, state)
        return

    if tag == "p":
        text = _collect_inline_text(node)
        if text:
            state.emitter.emit(_current_section_path(state), "paragraph", text)
        return

    if tag == "ul":
        _walk_list_children(node, state, "unordered-list-item")
        return

    if tag == "ol":
        _walk_list_children(node, state, "ordered-list-item")
        return

    if tag == "table":
        _walk_table(node, state)
        return

    if tag == "details":
        _walk_details(node, state)
        return

    if tag == "img":
        raw_src = node.get("src", "")
        src = raw_src if isinstance(raw_src, str) else ""
        state.emitter.emit(_current_section_path(state), "image", src)
        return

    if tag == "pre":
        text = _collect_inline_text(node)
        if text:
            state.emitter.emit(_current_section_path(state), "code-block", text)
        return

    _walk_block_container(node, state)


def _walk_list_children(list_node: Tag, state: _WalkState, item_kind: str) -> None:
    for child in _iter_element_children(list_node):
        if isinstance(child, NavigableString):
            # Stray whitespace between list items — ignore
            continue
        if not isinstance(child, Tag):
            continue

        if child.name == "li":
            text = _collect_inline_text(child)
            if text:
                state.emitter.emit(_current_section_path(state), item_kind, text)
            continue

        # Non-li sibling (MadCap fragmented <ol>) — walk as normal block
        _walk_block(child, state)


def _walk_callout_body(node: Tag, state: _WalkState) -> None:
    for child in _iter_element_children(node):
        if isinstance(child, NavigableString):
            continue
        if not isinstance(child, Tag):
            continue

        if child.name == "p":
            text = _collect_inline_text(child)
            if text:
                state.emitter.emit(_current_section_path(state), "callout-body", text)
            continue
        _walk_block(child, state)


def _walk_table(node: Tag, state: _WalkState) -> None:
    for child in _iter_element_children(node):
        if not isinstance(child, Tag):
            continue
        if child.name in {"tbody", "tfoot"}:
            _walk_table_rows(child, state)
            continue
        if child.name == "tr":
            _walk_table_row(child, state)
            continue


def _walk_table_rows(container: Tag, state: _WalkState) -> None:
    for child in _iter_element_children(container):
        if not isinstance(child, Tag):
            continue
        if child.name == "tr":
            _walk_table_row(child, state)


def _walk_table_row(row: Tag, state: _WalkState) -> None:
    for cell in _iter_element_children(row):
        if not isinstance(cell, Tag):
            continue
        if cell.name not in {"td", "th"}:
            continue
        text = _collect_inline_text(cell)
        if text:
            state.emitter.emit(_current_section_path(state), "table-cell", text)


def _walk_details(node: Tag, state: _WalkState) -> None:
    for child in _iter_element_children(node):
        if not isinstance(child, Tag):
            continue
        if child.name == "summary":
            text = _collect_inline_text(child)
            if text:
                state.emitter.emit(_current_section_path(state), "details-summary", text)
            continue
        _walk_block(child, state)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


#: ``extract_segments_from_html`` の html5lib fallback を発動させる最小サイズ。
#: mjs 実装との契約は plan ``docs/PYTHON_MIGRATION_PLAN.md`` Phase 1 ``Fallback
#: 戦略`` 節に記載。288-page matrix では lxml だけで segment 0 件になる page は
#: 現状存在しないが、将来 malformed HTML が入ってきた時の safety net。
_HTML5LIB_FALLBACK_MIN_LEN = 800


def _walk_soup(
    soup: BeautifulSoup,
    slug: str | None,
    callout_allow_slugs: frozenset[str] | None,
) -> list[dict[str, Any]]:
    """``soup`` を in-place で ``_clean_soup`` してから walk し segment list を返す。"""
    cleaned = _clean_soup(soup, slug=slug, callout_allow_slugs=callout_allow_slugs)
    # lxml は ``<html><body>...</body></html>`` で包むので、存在すれば body を
    # root として walk する。なければ soup 自体を root 扱い。BS4 は
    # ``BeautifulSoup`` < ``Tag`` の継承関係にあるため、union 型にしておく。
    root: Tag | BeautifulSoup = cleaned.body if cleaned.body is not None else cleaned
    state = _WalkState()
    _walk_block_container(root, state)
    return state.emitter.segments


def extract_segments_from_html(
    html: str,
    slug: str | None = None,
    callout_allow_slugs: frozenset[str] | None = None,
) -> list[dict[str, Any]]:
    """MadCap Flare HTML から canonical segment list を抽出する。

    mjs ``extractSegmentsFromHtml`` (``source_parity_segments_en.mjs:696``) と
    同一 shape の segment 辞書を返す。``callout_allow_slugs`` が ``None`` の
    場合は callout normalization を **一切行わない** (mjs の
    ``calloutAllowSlugs instanceof Set`` guard と同じ挙動)。production caller は
    ``CALLOUT_NORMALIZATION_SLUGS`` を明示的に渡す契約。

    Phase 1 verification gate (288-page matrix) で mjs と segment count /
    segmentKind / sectionPath の一致を hard 確認する契約。

    **html5lib fallback**: lxml で 0 件しか取れず、かつ HTML が
    ``_HTML5LIB_FALLBACK_MIN_LEN`` バイト以上の場合のみ html5lib parser で
    再試行する (plan ``Fallback 戦略``)。mjs には対応する経路が無いが、Python
    の lxml が万一壊れた MadCap HTML で早期終了するシナリオを防ぐ defensive
    net。現行 288-page corpus ではこの経路に落ちることは無いことを確認済み。
    """
    if not isinstance(html, str):
        return []
    if not html.strip():
        return []

    # turndown 由来の preprocessor (Phase 1.1 実装) — entity-encoded <details> /
    # escaped callout を real HTML に戻す。slug は渡さない (mjs も内部再帰で
    # 渡さない契約)。slug-scope patch は呼び出し側 ``preprocess_en_html`` に
    # 任せる前提。
    normalized = preprocess_en_html(html)
    lxml_soup = BeautifulSoup(normalized, "lxml")
    segments = _walk_soup(lxml_soup, slug, callout_allow_slugs)

    if not segments and len(normalized) >= _HTML5LIB_FALLBACK_MIN_LEN:
        # lxml が壊れた malformed HTML で 0 件を返したとき、html5lib で
        # 再パースする。html5lib は WHATWG 準拠で lxml より寛容。
        html5lib_soup = BeautifulSoup(normalized, "html5lib")
        segments = _walk_soup(html5lib_soup, slug, callout_allow_slugs)
    return segments
