"""JA markdown canonical segment extractor — ``source_parity_segments_ja.mjs`` の port。

JA markdown body を走査し、exact-diff engine 用の flat な segment 列を emit する。
Kind を判定できない構造は skip することで gate-eligible segment を clean に保つ
保守的な設計 (mjs と同一)。

## Phase 2 の核: Issue #368 nested list flattening

mjs 実装は line-based regex で、ネストされた ``<li>`` (indented list item) を
各行 1 segment として emit する。一方 EN parser (HTML tree walker) は top-level
``<li>`` を 1 segment にフラット化する。結果、**同一意味の EN/JA ページが parity
check で 128 files / 823 issues を出す** のが Issue #368 の症状。

Python 側は以下の HYBRID アプローチで fix する:

1. **非リスト content**: mjs の line-based state machine を verbatim port。
   heading / callout / details / summary / code fence / HTML table / markdown
   table / image / horizontal rule / paragraph を 1:1 で処理する。
   conformance harness で mjs と byte 一致を guard する。
2. **リスト region**: line-based regex で region の範囲を特定したら、その
   range を ``markdown-it-py`` に渡して CommonMark AST を取得し、**top-level
   ``list_item`` だけ** を emit する。ネストされた ``list_item`` の inline
   content は親 item の textNorm にフラット化して混ぜ込む。これにより EN
   walker と同じ粒度で segment が揃い、Issue #368 が解消される。

mjs 側は当面 Phase 4 cutover まで既存の line-based 実装を保持するため、**nested
list を含むページは mjs と Python で意図的に divergent** (segment count が
Python < mjs)。conformance harness dispatch (``segments_ja_extract``) は
nest-free な sample だけで byte 一致を要求し、Issue #368 の fix 挙動は
dedicated Python unit test で記録する。

## 保存されている mjs 挙動 (byte-identical 想定)

- frontmatter 剥がし (``--- ... ---`` の 1 回目 skip)
- H1 を page title 扱い (emit しない, heading stack に push しない)
- heading anchor suffix ``{#id}`` 剥がし
- ``:::note{title="..."}`` / ``:::warning`` / ``:::info`` / ``:::tip`` /
  ``:::caution`` / ``:::danger`` callout open。``:::`` 単独で close。
  内部 paragraph は ``callout-body`` kind で emit
- ``<details>``/``<summary>``/``</details>`` multi-line 対応、nested ``<summary>``
  の depth tracking、condensed one-liner handling
- loose ``<summary>`` (``<details>`` に囲まれていない) は EN walker に委譲し、
  element children を full classifier で分類してから JA emitter に再 emit する
- HTML ``<table>`` block — ``<tbody>`` 内の ``<td>`` だけ cell として emit
- markdown table — separator row / header row 検出で skip、本体 row のみ cell emit
- code fence — backtick / tilde 両方、開閉 fence 間の body を ``code-block`` emit
- standalone image line (``![...](...)`` / ``<Image>`` / ``<img>``) → ``image``
- horizontal rule (``---`` / ``***`` / ``___``) は segment を emit しない

## 意図的な divergence (Issue #368 fix)

- ネストされた list item は top-level に flatten される (mjs は各行 1 segment)。
  具体的には ``markdown_it.MarkdownIt().parse(region)`` の token stream を walk
  し、``list_item_open`` で depth を +1、``list_item_close`` で -1 する。depth
  が 1 のときの ``inline.content`` を rawText として集め、``list_item_close``
  で depth が 1 → 0 に落ちる瞬間に flush する
- list region 境界は line-based で検出: list 行 / blank 行 / 先頭 whitespace 行
  を region に取り込み、heading / callout / details / code fence / HTML table /
  horizontal rule / image-only / non-indented non-list 行で terminate する
"""

from __future__ import annotations

import re
from typing import Any

from markdown_it import MarkdownIt

from .segments_en import extract_segments_from_html
from .segments_shared import build_section_path, create_segment, push_heading

_FENCE_RE = re.compile(r"^(`{3,}|~{3,})")
_HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$")
_CALLOUT_OPEN_RE = re.compile(r"^:::(note|warning|info|tip|caution|danger)(?:\{[^}]*\})?\s*$")
_CALLOUT_CLOSE_RE = re.compile(r"^:::\s*$")
_DETAILS_TOKEN_RE = re.compile(r"<\/?details\b|<summary\b", re.IGNORECASE)
_DETAILS_OPEN_PREFIX_RE = re.compile(r"^<details\b", re.IGNORECASE)
_DETAILS_CLOSE_PREFIX_RE = re.compile(r"^<\/details\s*>", re.IGNORECASE)
_SUMMARY_OPEN_PREFIX_RE = re.compile(r"^<summary\b", re.IGNORECASE)
_SUMMARY_CLOSE_RE = re.compile(r"^<\/summary\s*>", re.IGNORECASE)
_IMAGE_RE = re.compile(r"^(?:!\[[^\]]*\]\([^)]+\)|<Image\b|<img\b)", re.IGNORECASE)
_UNORDERED_RE = re.compile(r"^(\s*)[-*+]\s+(.+)$")
_ORDERED_RE = re.compile(r"^(\s*)\d+\.\s+(.+)$")
_TABLE_ROW_RE = re.compile(r"^\|.+\|\s*$")
_TABLE_SEPARATOR_RE = re.compile(r"^\|\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)+\|\s*$")
_HTML_TABLE_OPEN_RE = re.compile(r"^<table\b", re.IGNORECASE)
_HTML_TABLE_CLOSE_RE = re.compile(r"<\/table>", re.IGNORECASE)
_HORIZONTAL_RULE_RE = re.compile(r"^(-{3,}|\*{3,}|_{3,})$")
_ANCHOR_SUFFIX_RE = re.compile(r"\s*\{#[^}]*\}\s*$")

# list-region terminator: "このパターンに該当する行が現れたら list region を
# 閉じる" 契約の明示リスト (heading / callout / details token / code fence /
# HTML table / horizontal rule / image-only)。
_LIST_REGION_TERMINATOR_RES: tuple[re.Pattern[str], ...] = (
    _HEADING_RE,
    _CALLOUT_OPEN_RE,
    _CALLOUT_CLOSE_RE,
    _FENCE_RE,
    _HTML_TABLE_OPEN_RE,
    _HORIZONTAL_RULE_RE,
)

# details/summary token は別途検出する (行内に出現するため regex match ではなく
# substring test で拾う)
_DETAILS_TERMINATOR_RE = _DETAILS_TOKEN_RE


def _split_table_cells(line: str) -> list[str]:
    """pipe table 行を trimmed cell 列に分解する。

    cell 内の backslash-escape された pipe (``\\|``) は phantom column 分割を
    起こさないよう literal ``|`` として扱う (mjs 等価)。
    """
    trimmed = line.strip()
    if trimmed.startswith("|"):
        trimmed = trimmed[1:]
    if trimmed.endswith("|"):
        trimmed = trimmed[:-1].rstrip()
    cells: list[str] = []
    current: list[str] = []
    i = 0
    n = len(trimmed)
    while i < n:
        ch = trimmed[i]
        if ch == "\\" and i + 1 < n and trimmed[i + 1] == "|":
            current.append("|")
            i += 2
            continue
        if ch == "|":
            cells.append("".join(current).strip())
            current = []
            i += 1
            continue
        current.append(ch)
        i += 1
    cells.append("".join(current).strip())
    return cells


def _find_tag_end(text: str, start: int) -> int:
    """``start`` 以降で HTML tag の閉じ ``>`` 位置を返す。

    ``<details data-x="1>0">`` のような quoted attribute 内の ``>`` は skip する。
    見つからなければ ``-1``。mjs ``findTagEnd`` 等価。
    """
    quote: str | None = None
    n = len(text)
    i = start
    while i < n:
        ch = text[i]
        if quote is not None:
            if ch == quote:
                quote = None
            i += 1
            continue
        if ch in ('"', "'"):
            quote = ch
            i += 1
            continue
        if ch == ">":
            return i
        i += 1
    return -1


def _scan_for_matching_summary_close(text: str, start_depth: int) -> tuple[int, int, int]:
    """``text`` 内を走査して depth が 0 になる ``</summary>`` 位置を返す。

    戻り値は ``(depth, close_pos, close_len)``。matching close が見つからない
    場合は ``close_pos = -1``、``depth`` は scan 終了時点の depth (multi-line
    accumulator で carry-forward する)。mjs ``scanForMatchingSummaryClose`` 等価。
    """
    depth = start_depth
    n = len(text)
    i = 0
    while i < n:
        if text[i] != "<":
            i += 1
            continue
        tail = text[i:]
        # </summary> close 候補
        close_match = _SUMMARY_CLOSE_RE.match(tail)
        if close_match:
            depth -= 1
            if depth == 0:
                return (depth, i, len(close_match.group(0)))
            i += len(close_match.group(0))
            continue
        # <summary> nested open
        if _SUMMARY_OPEN_PREFIX_RE.match(tail):
            depth += 1
            tag_end = _find_tag_end(text, i + 1)
            if tag_end == -1:
                return (depth, -1, 0)
            i = tag_end + 1
            continue
        # その他の tag — quote-aware に skip
        if tail.startswith("</") or (len(tail) >= 2 and tail[0] == "<" and tail[1].isalpha()):
            tag_end = _find_tag_end(text, i + 1)
            if tag_end == -1:
                i += 1
                continue
            i = tag_end + 1
            continue
        # stray '<' — text として scan 継続
        i += 1
    return (depth, -1, 0)


def _tokenize_details_line(line: str) -> list[dict[str, Any]]:
    """markdown 1 行を ``<details>`` / ``<summary>`` / ``</details>`` tokens +
    text span の event 列に分解する (mjs ``tokenizeDetailsLine`` 等価)。

    condensed 1-liner ``Lead <details><summary>Q</summary></details> tail`` を
    左→右で正しい順序で emit するために必要。quote-aware な ``_find_tag_end``
    経由で ``data-x="1>0"`` 等の attribute value を安全に skip する。
    """
    events: list[dict[str, Any]] = []
    n = len(line)
    cursor = 0
    i = 0

    def _emit_pending_text(upto: int) -> None:
        if upto > cursor:
            events.append({"type": "text", "value": line[cursor:upto]})

    while i < n:
        if line[i] != "<":
            i += 1
            continue
        tail = line[i:]

        close_match = _DETAILS_CLOSE_PREFIX_RE.match(tail)
        if close_match:
            _emit_pending_text(i)
            events.append({"type": "details-close"})
            i += len(close_match.group(0))
            cursor = i
            continue

        if _DETAILS_OPEN_PREFIX_RE.match(tail):
            tag_end = _find_tag_end(line, i + 1)
            if tag_end == -1:
                break
            _emit_pending_text(i)
            events.append({"type": "details-open"})
            i = tag_end + 1
            cursor = i
            continue

        if _SUMMARY_OPEN_PREFIX_RE.match(tail):
            open_end = _find_tag_end(line, i + 1)
            if open_end == -1:
                break
            after_open = line[open_end + 1 :]
            depth, close_pos, close_len = _scan_for_matching_summary_close(after_open, 1)
            if close_pos == -1:
                # multi-line 状態へ遷移
                _emit_pending_text(i)
                events.append(
                    {
                        "type": "summary-open",
                        "initialInner": after_open,
                        "initialDepth": depth,
                    }
                )
                cursor = n
                i = n
                break
            _emit_pending_text(i)
            inner_text = after_open[:close_pos]
            events.append({"type": "summary", "inner": inner_text})
            i = open_end + 1 + close_pos + close_len
            cursor = i
            continue

        i += 1

    if cursor < n:
        events.append({"type": "text", "value": line[cursor:]})
    return events


# mjs ``decodeHtmlEntities`` の case-insensitive 一括置換を再現するため compile 版
# regex を使う (mjs の ``gi`` フラグ等価)。
_ENTITY_NBSP_RE = re.compile(r"&nbsp;", re.IGNORECASE)
_ENTITY_AMP_RE = re.compile(r"&amp;", re.IGNORECASE)
_ENTITY_LT_RE = re.compile(r"&lt;", re.IGNORECASE)
_ENTITY_GT_RE = re.compile(r"&gt;", re.IGNORECASE)
_ENTITY_QUOT_RE = re.compile(r"&quot;", re.IGNORECASE)
_ENTITY_39_RE = re.compile(r"&#39;", re.IGNORECASE)
_ENTITY_APOS_RE = re.compile(r"&apos;", re.IGNORECASE)


def _decode_html_entities(text: str) -> str:
    """MadCap Flare / JA inline HTML に現れる entity の限定 decode (mjs 等価)。

    EN walker の ``decode_entities`` で扱う tag vocabulary と揃えている。
    ``&nbsp;`` / ``&amp;`` / ``&lt;`` / ``&gt;`` / ``&quot;`` / ``&#39;`` /
    ``&apos;`` のみを case-insensitive に置換する。
    """
    text = _ENTITY_NBSP_RE.sub(" ", text)
    text = _ENTITY_AMP_RE.sub("&", text)
    text = _ENTITY_LT_RE.sub("<", text)
    text = _ENTITY_GT_RE.sub(">", text)
    text = _ENTITY_QUOT_RE.sub('"', text)
    text = _ENTITY_39_RE.sub("'", text)
    text = _ENTITY_APOS_RE.sub("'", text)
    return text


_CODE_TAG_RE = re.compile(r"<code\b[^>]*>([\s\S]*?)<\/code>", re.IGNORECASE)
# HTML tag ストリップ用 regex。``<code>`` inner と ``<a>`` inner 両方で使うため
# 汎用名にしている (python-reviewer LOW)。mjs 側も同一 regex を両箇所で再利用。
_HTML_TAG_STRIP_RE = re.compile(r"<[^>]+>")
_A_TAG_RE = re.compile(
    r"<a\b[^>]*\bhref\s*=\s*[\"']([^\"']*)[\"'][^>]*>([\s\S]*?)<\/a>",
    re.IGNORECASE,
)
_ANY_TAG_RE = re.compile(r"<[^>]+>")
_WHITESPACE_RUN_RE = re.compile(r"\s+")


def _html_inline_to_markdown_text(html: Any) -> str:
    """HTML inline fragment を invariant-token を保持する markdown 風 text に変換。

    ``<a href>`` / ``<code>`` は markdown 構文 (``[label](url)`` / `` `Y` ``) に
    書き換えて ``create_segment`` の invariant-token extractor で拾えるようにし、
    それ以外の tag は strip して inner text のみ残す。mjs ``htmlInlineToMarkdownText``
    等価で rewrite 順序 (``<code>`` 先、``<a>`` 後) も同一。
    """
    if not isinstance(html, str):
        return ""
    text = html

    def _code_sub(m: re.Match[str]) -> str:
        inner = _HTML_TAG_STRIP_RE.sub("", m.group(1)).strip()
        return f"`{inner}`"

    text = _CODE_TAG_RE.sub(_code_sub, text)

    def _a_sub(m: re.Match[str]) -> str:
        href = m.group(1)
        inner = m.group(2)
        label = _HTML_TAG_STRIP_RE.sub("", inner).strip()
        # mjs は <code> 書き換え後の backtick を残す実装。Python でも `_HTML_TAG_STRIP_RE`
        # は tag のみ削除し backtick は保持するので等価。
        if not href or href.startswith("#") or href.startswith("javascript:"):
            return label
        return f"[{label}]({href})"

    text = _A_TAG_RE.sub(_a_sub, text)
    text = _ANY_TAG_RE.sub(" ", text)
    text = _decode_html_entities(text)
    text = _WHITESPACE_RUN_RE.sub(" ", text).strip()
    return text


_TBODY_RE = re.compile(r"<tbody\b[^>]*>([\s\S]*?)<\/tbody>", re.IGNORECASE)
_THEAD_STRIP_RE = re.compile(r"<thead\b[\s\S]*?<\/thead>", re.IGNORECASE)
_TD_RE = re.compile(r"<td\b[^>]*>([\s\S]*?)<\/td>", re.IGNORECASE)


def _extract_html_table_cells(table_html: str) -> list[str]:
    """HTML ``<table>`` block から cell text を抽出する。

    ``<tbody>`` がある場合はその内部だけ、ない場合は ``<thead>`` を除いた全体
    から ``<tr><td>...</td></tr>`` の ``<td>`` inner を markdown 化して返す。
    mjs ``extractHtmlTableCells`` 等価。
    """
    has_tbody = re.search(r"<tbody\b", table_html, re.IGNORECASE) is not None
    if has_tbody:
        m = _TBODY_RE.search(table_html)
        body_html = m.group(1) if m else ""
    else:
        body_html = _THEAD_STRIP_RE.sub("", table_html)
    cells: list[str] = []
    for match in _TD_RE.finditer(body_html):
        text = _html_inline_to_markdown_text(match.group(1))
        if len(text) > 0:
            cells.append(text)
    return cells


class _Emitter:
    """``(sectionPath, kind)`` 毎に segment index をカウントしつつ segments を集める。

    counter key は ``(section_path, kind)`` の tuple を使う。mjs 側は
    ``section_path\x00kind`` の文字列結合だが、Python では tuple の方が
    idiomatic で ``section_path`` が仮に ``\x00`` を含んでも collision しない
    (python-reviewer MEDIUM #3)。両 runtime とも counter は内部状態で、
    emit 結果 (``segmentIndex``) の方が conformance 対象のため tuple 化しても
    byte parity は維持される。
    """

    def __init__(self) -> None:
        self._counters: dict[tuple[str, str], int] = {}
        self.segments: list[dict[str, Any]] = []

    def emit(self, section_path: str, kind: str, raw_text: Any, line: int | None) -> None:
        if not isinstance(raw_text, str) or raw_text.strip() == "":
            return
        key = (section_path, kind)
        index = self._counters.get(key, 0)
        self._counters[key] = index + 1
        self.segments.append(
            create_segment(
                section_path=section_path,
                kind=kind,
                segment_index=index,
                raw_text=raw_text,
                line=line,
            )
        )


# ---------------------------------------------------------------------------
# List region flattening (Issue #368 fix)
# ---------------------------------------------------------------------------

# markdown-it-py のデフォルト設定。list parsing 以外の feature (table, strikethrough)
# は使わないが、instance 生成コストを削るため module-level で 1 度だけ作る。
#
# Thread-safety: ``MarkdownIt.parse`` は現状 stateless だが、plugin を enable
# すると plugin 側で mutable state を持つ可能性がある (例: markdown-it-py の
# ``mdit_py_plugins.footnote`` は parser instance に counter を持つ)。
# ``extract_segments_from_markdown`` は本 parser instance を直接使うため、
# plugin を追加する場合は thread-local / per-call instance に切替える必要が
# ある。現行 pipeline は single-threaded (``check:parity`` が逐次実行) なので
# 問題ないが、architect review L1 として記録 (Phase 3 以降で並列実行を検討
# する際の確認事項)。
_MD_PARSER = MarkdownIt("commonmark")


def _is_list_region_terminator(line: str) -> bool:
    """list region を終了させるべき行なら True。

    heading / callout / code fence / HTML table / horizontal rule / details
    token / standalone image は list 外に出す。逆に blank 行 / 先頭 whitespace
    のある continuation 行は region に含める。
    """
    stripped = line.strip()
    if stripped == "":
        return False
    for pattern in _LIST_REGION_TERMINATOR_RES:
        if pattern.match(stripped):
            return True
    if _DETAILS_TERMINATOR_RE.search(line):
        return True
    # standalone image at indent 0
    return (
        not line.startswith(" ")
        and not line.startswith("\t")
        and _IMAGE_RE.match(stripped) is not None
    )


def _collect_list_region(lines: list[str], start: int) -> int:
    """``start`` を list region の先頭として、region の末尾 index (inclusive) を返す。

    region に含める行:
      - list marker を持つ行 (indent 不問)
      - blank 行
      - 先頭 whitespace を持つ行 (lazy continuation / nested block)

    stop 条件:
      - indent 0 かつ list marker を持たない非 blank 行
      - heading / callout / code fence / HTML table / horizontal rule / details
        token / standalone image

    返り値は **最後に region に含めた行の index**。trailing blank 行は region
    末尾に含めない。
    """
    n = len(lines)
    last_list_line = start
    i = start
    while i < n:
        line = lines[i]
        stripped = line.strip()
        if _is_list_region_terminator(line):
            break
        if stripped == "":
            # 先見: 次の非 blank 行が list-continuation かを確認
            j = i + 1
            while j < n and lines[j].strip() == "":
                j += 1
            if j >= n:
                break
            next_line = lines[j]
            if _is_list_region_terminator(next_line):
                break
            if (
                _ORDERED_RE.match(next_line)
                or _UNORDERED_RE.match(next_line)
                or next_line.startswith(" ")
                or next_line.startswith("\t")
            ):
                i = j
                continue
            break
        if _ORDERED_RE.match(line) or _UNORDERED_RE.match(line):
            last_list_line = i
            i += 1
            continue
        if line.startswith(" ") or line.startswith("\t"):
            last_list_line = i
            i += 1
            continue
        break
    return last_list_line


def _flatten_list_region(region: str) -> list[tuple[str, str, int | None]]:
    """list region 文字列を markdown-it-py で parse して ``(kind, raw_text, line_offset)``
    のリストを返す。

    ``kind`` は ``"ordered-list-item"`` / ``"unordered-list-item"``。
    ``line_offset`` は region 内の 0-based 行番号 (top-level item の開始行)。
    ネストされた list item の inline content は親 item の ``raw_text`` にスペース
    区切りで連結される。
    """
    tokens = _MD_PARSER.parse(region)
    results: list[tuple[str, str, int | None]] = []
    list_depth = 0
    item_depth = 0
    current_parts: list[str] = []
    current_kind: str | None = None
    current_line: int | None = None

    for tok in tokens:
        if tok.type in ("bullet_list_open", "ordered_list_open"):
            list_depth += 1
            continue
        if tok.type in ("bullet_list_close", "ordered_list_close"):
            list_depth -= 1
            continue
        if tok.type == "list_item_open":
            item_depth += 1
            if item_depth == 1:
                current_parts = []
                # markup は '-' / '*' / '+' (unordered) or '.' (ordered) を含む
                markup = tok.markup or ""
                current_kind = (
                    "ordered-list-item" if markup.endswith(".") else "unordered-list-item"
                )
                current_line = tok.map[0] if tok.map else None
            continue
        if tok.type == "list_item_close":
            if item_depth == 1 and current_kind is not None:
                text = " ".join(p for p in current_parts if p).strip()
                if text:
                    results.append((current_kind, text, current_line))
                current_parts = []
                current_kind = None
                current_line = None
            item_depth -= 1
            continue
        if tok.type == "inline" and item_depth >= 1:
            content = tok.content or ""
            if content:
                current_parts.append(content)
    return results


# ---------------------------------------------------------------------------
# Main extractor
# ---------------------------------------------------------------------------


def _strip_frontmatter(lines: list[str]) -> list[str]:
    """``--- ... ---`` YAML frontmatter を剥がす。

    最初の非空行が ``---`` でなければ何もしない。mjs ``stripFrontmatter`` 等価。
    """
    if len(lines) == 0 or lines[0].strip() != "---":
        return lines
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            return lines[i + 1 :]
    return lines


def extract_segments_from_markdown(body: object) -> list[dict[str, Any]]:
    """JA markdown document body から canonical segment 列を抽出する。

    mjs ``extractSegmentsFromMarkdown`` と同じ API 契約:

    - input が string でなければ ``[]``
    - frontmatter は内部で strip
    - ``paragraphKind`` state で paragraph buffer を ``paragraph`` / ``callout-body``
      のどちらで emit するかを切り替える。``:::note`` / ``:::caution`` 等の
      callout block 内だけ ``callout-body`` になり、list item / image / table
      は通常の classification path を通るため ``callout-body`` 以外の kind で emit
      される (EN ``walkCalloutBody`` と同じ挙動)
    - ``<details>`` 内の text block は ``paragraph`` で emit (EN walker と同等)。
      ``<details>`` 出入りで ``paragraphKind`` を save/restore するため、
      ``:::note`` 内の ``<details>`` でも内側の paragraph は ``paragraph`` kind
    """
    if not isinstance(body, str):
        return []

    raw_lines = body.split("\n")
    lines = _strip_frontmatter(raw_lines)
    line_offset = len(raw_lines) - len(lines)

    emitter = _Emitter()
    heading_stack: list[dict[str, Any]] = []
    first_h1_consumed = False

    paragraph_buf: list[str] = []
    paragraph_start_line = 0
    paragraph_kind = "paragraph"

    in_callout = False

    details_depth = 0
    details_kind_stack: list[str] = []

    in_multiline_summary = False
    multiline_summary_buf: list[str] = []
    multiline_summary_start_line = 0
    multiline_summary_depth = 1

    in_code_fence = False
    code_fence_start_line = 0
    code_fence_buf: list[str] = []

    def flush_paragraph() -> None:
        nonlocal paragraph_buf
        if not paragraph_buf:
            return
        path = build_section_path(heading_stack)
        emitter.emit(path, paragraph_kind, " ".join(paragraph_buf), paragraph_start_line)
        paragraph_buf = []

    def emit_loose_summary_inner(inner_html: str, start_line_no: int) -> None:
        """loose ``<summary>`` の inner fragment を EN walker に委譲して再 emit。

        mjs ``emitLooseSummaryInner`` 等価。EN walker が element children を
        proper kind (img / ul / table / …) に分類してから、JA emitter 経由で
        現在の sectionPath / kind-index counter を継承する。
        """
        en_segments = extract_segments_from_html(inner_html)
        path_at_line = build_section_path(heading_stack)
        for seg in en_segments:
            emitter.emit(path_at_line, seg["segmentKind"], seg["textNorm"], start_line_no)

    def flush_multiline_summary(closing_line_no: int) -> None:
        nonlocal in_multiline_summary, multiline_summary_buf
        nonlocal multiline_summary_start_line, multiline_summary_depth
        joined = " ".join(multiline_summary_buf)
        # multiline_summary_start_line の初期値は 0。entry 時に ``line_no`` を
        # 書き込むが、frontmatter 無しの 1 行目から multi-line summary が始まる
        # 場合の正当な値は ``1 + line_offset``  (最小 1) なので ``or`` で fall-
        # through するケースは 現行 corpus では発生しない。ただし将来的に
        # 0-based line を持ち込むと footgun (python-reviewer Phase 3 risk) に
        # なるため、``if ... else`` で explicit に書く。
        start_line = (
            multiline_summary_start_line if multiline_summary_start_line > 0 else closing_line_no
        )
        if details_depth > 0:
            summary_text = _html_inline_to_markdown_text(joined)
            if len(summary_text) > 0:
                path_at_close = build_section_path(heading_stack)
                emitter.emit(path_at_close, "details-summary", summary_text, start_line)
        else:
            emit_loose_summary_inner(joined, start_line)
        in_multiline_summary = False
        multiline_summary_buf = []
        multiline_summary_start_line = 0
        multiline_summary_depth = 1

    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        trimmed = line.strip()
        line_no = i + 1 + line_offset

        if _FENCE_RE.match(trimmed):
            if not in_code_fence:
                flush_paragraph()
                in_code_fence = True
                code_fence_start_line = line_no
                code_fence_buf = []
            else:
                in_code_fence = False
                path = build_section_path(heading_stack)
                emitter.emit(path, "code-block", "\n".join(code_fence_buf), code_fence_start_line)
                code_fence_buf = []
            i += 1
            continue
        if in_code_fence:
            code_fence_buf.append(line)
            i += 1
            continue

        if in_multiline_summary:
            depth, close_pos, close_len = _scan_for_matching_summary_close(
                line, multiline_summary_depth
            )
            if close_pos == -1:
                multiline_summary_buf.append(line)
                multiline_summary_depth = depth
                i += 1
                continue
            multiline_summary_buf.append(line[:close_pos])
            flush_multiline_summary(line_no)
            remainder = line[close_pos + close_len :]
            if remainder.strip():
                lines[i] = remainder
                # 再処理するため i は進めない
                continue
            i += 1
            continue

        if _HTML_TABLE_OPEN_RE.match(trimmed):
            flush_paragraph()
            end_idx = -1
            for j in range(i, n):
                if _HTML_TABLE_CLOSE_RE.search(lines[j]):
                    end_idx = j
                    break
            if end_idx != -1:
                table_html = "\n".join(lines[i : end_idx + 1])
                cells = _extract_html_table_cells(table_html)
                path = build_section_path(heading_stack)
                for cell in cells:
                    emitter.emit(path, "table-cell", cell, line_no)
                i = end_idx + 1
                continue
            # unterminated — fall through

        if _DETAILS_TOKEN_RE.search(line):
            flush_paragraph()
            events = _tokenize_details_line(line)
            path_at_line = build_section_path(heading_stack)
            for ev in events:
                etype = ev["type"]
                if etype == "text":
                    text_span = str(ev["value"]).strip()
                    if text_span:
                        emitter.emit(
                            build_section_path(heading_stack), paragraph_kind, text_span, line_no
                        )
                    continue
                if etype == "details-open":
                    details_kind_stack.append(paragraph_kind)
                    paragraph_kind = "paragraph"
                    details_depth += 1
                    continue
                if etype == "summary":
                    if details_depth > 0:
                        summary_text = _html_inline_to_markdown_text(ev["inner"])
                        if summary_text:
                            emitter.emit(path_at_line, "details-summary", summary_text, line_no)
                    else:
                        emit_loose_summary_inner(ev["inner"], line_no)
                    continue
                if etype == "summary-open":
                    in_multiline_summary = True
                    multiline_summary_buf = [str(ev["initialInner"])]
                    multiline_summary_start_line = line_no
                    multiline_summary_depth = int(ev.get("initialDepth", 1))
                    continue
                if etype == "details-close":
                    if details_depth > 0:
                        details_depth -= 1
                        paragraph_kind = (
                            details_kind_stack.pop() if details_kind_stack else "paragraph"
                        )
                    continue
            i += 1
            continue

        if not in_callout and _CALLOUT_OPEN_RE.match(trimmed):
            flush_paragraph()
            in_callout = True
            paragraph_kind = "callout-body"
            i += 1
            continue
        if in_callout and _CALLOUT_CLOSE_RE.match(trimmed):
            flush_paragraph()
            in_callout = False
            paragraph_kind = "paragraph"
            i += 1
            continue

        heading_match = _HEADING_RE.match(line)
        if heading_match:
            flush_paragraph()
            level = len(heading_match.group(1))
            text = _ANCHOR_SUFFIX_RE.sub("", heading_match.group(2)).strip()
            if level == 1 and not first_h1_consumed:
                first_h1_consumed = True
                i += 1
                continue
            heading_stack = push_heading(heading_stack, level, text)
            path = build_section_path(heading_stack)
            emitter.emit(path, "heading", text, line_no)
            i += 1
            continue

        if _IMAGE_RE.match(trimmed):
            flush_paragraph()
            path = build_section_path(heading_stack)
            emitter.emit(path, "image", trimmed, line_no)
            i += 1
            continue

        if _TABLE_ROW_RE.match(trimmed):
            flush_paragraph()
            if _TABLE_SEPARATOR_RE.match(trimmed):
                i += 1
                continue
            next_line = lines[i + 1].strip() if i + 1 < n else ""
            if _TABLE_SEPARATOR_RE.match(next_line):
                i += 1
                continue
            cells = _split_table_cells(trimmed)
            path = build_section_path(heading_stack)
            for cell in cells:
                emitter.emit(path, "table-cell", cell, line_no)
            i += 1
            continue

        # Ordered / unordered list — Issue #368 fix:
        # 単行 match ではなく **list region 全体** を収集して markdown-it-py に
        # 渡し、top-level item だけ 1 segment で emit する。
        if _ORDERED_RE.match(line) or _UNORDERED_RE.match(line):
            flush_paragraph()
            end_idx = _collect_list_region(lines, i)
            region = "\n".join(lines[i : end_idx + 1])
            flattened = _flatten_list_region(region)
            path = build_section_path(heading_stack)
            for kind, raw_text, row_offset in flattened:
                resolved_line = line_no + (row_offset or 0)
                emitter.emit(path, kind, raw_text, resolved_line)
            i = end_idx + 1
            continue

        if _HORIZONTAL_RULE_RE.match(trimmed):
            flush_paragraph()
            i += 1
            continue

        if trimmed == "":
            flush_paragraph()
            i += 1
            continue

        if not paragraph_buf:
            paragraph_start_line = line_no
        paragraph_buf.append(trimmed)
        i += 1

    # Trailing state flush
    if in_multiline_summary:
        flush_multiline_summary(n + line_offset)
    if in_callout:
        flush_paragraph()
        paragraph_kind = "paragraph"
    else:
        flush_paragraph()

    return emitter.segments


__all__ = ["extract_segments_from_markdown"]
