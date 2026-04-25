"""JA extractor の HTML / inline-markdown helpers。

``segments_ja.py`` の本体 (line-based state machine + list region flattening)
から **HTML まわりの pure な文字列処理** を切り出したモジュール。``segments_ja``
が 800 行 soft cap を超えたため、cohesive な粒度で分割している
(codex LOW: file-size refactor)。

ここに置くものの判定基準:

- ``<details>`` / ``<summary>`` / HTML table / entity / inline HTML の
  pure text transform (入力: str, 出力: str or list[str])
- main state machine と参照を共有しない (stateful な counter や emit 経路
  は持たない)
- mjs 側の対応 helper (``findTagEnd`` / ``tokenizeDetailsLine`` /
  ``decodeHtmlEntities`` / ``htmlInlineToMarkdownText`` / ``extractHtmlTableCells``
  / ``splitTableCells``) と 1:1 の挙動を保つ

ここに置かないもの:

- ``_IMAGE_RE`` / ``_FENCE_RE`` / ``_HEADING_RE`` / ``_CALLOUT_OPEN_RE`` 等、
  main loop の line dispatch で使う regex (``segments_ja.py`` に残す)
- ``_DETAILS_TOKEN_RE`` — main loop で 「この行に details/summary が含まれるか」
  を粗判定するために使う。tokenize 自体は本モジュールだが、判定の regex は
  呼び出し側に残る (``segments_ja.py`` に alias `_DETAILS_TERMINATOR_RE`
  として保持)
"""

from __future__ import annotations

import re
from typing import Any

# ---------------------------------------------------------------------------
# HTML tag prefix regex — ``<details>`` / ``<summary>`` token の識別
# ---------------------------------------------------------------------------

DETAILS_OPEN_PREFIX_RE = re.compile(r"^<details\b", re.IGNORECASE)
DETAILS_CLOSE_PREFIX_RE = re.compile(r"^<\/details\s*>", re.IGNORECASE)
SUMMARY_OPEN_PREFIX_RE = re.compile(r"^<summary\b", re.IGNORECASE)
SUMMARY_CLOSE_RE = re.compile(r"^<\/summary\s*>", re.IGNORECASE)


# ---------------------------------------------------------------------------
# HTML entity decode (mjs `decodeHtmlEntities` 相当 — 7 entity の case-insensitive 置換)
# ---------------------------------------------------------------------------

# mjs ``decodeHtmlEntities`` の case-insensitive 一括置換を再現するため compile 版
# regex を使う (mjs の ``gi`` フラグ等価)。
_ENTITY_NBSP_RE = re.compile(r"&nbsp;", re.IGNORECASE)
_ENTITY_AMP_RE = re.compile(r"&amp;", re.IGNORECASE)
_ENTITY_LT_RE = re.compile(r"&lt;", re.IGNORECASE)
_ENTITY_GT_RE = re.compile(r"&gt;", re.IGNORECASE)
_ENTITY_QUOT_RE = re.compile(r"&quot;", re.IGNORECASE)
_ENTITY_39_RE = re.compile(r"&#39;", re.IGNORECASE)
_ENTITY_APOS_RE = re.compile(r"&apos;", re.IGNORECASE)


def decode_html_entities(text: str) -> str:
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


# ---------------------------------------------------------------------------
# Inline HTML → markdown 変換 (invariant token を保持)
# ---------------------------------------------------------------------------

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


def html_inline_to_markdown_text(html: Any) -> str:
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
    text = decode_html_entities(text)
    text = _WHITESPACE_RUN_RE.sub(" ", text).strip()
    return text


# ---------------------------------------------------------------------------
# Markdown pipe table / HTML table cell 抽出
# ---------------------------------------------------------------------------


def split_table_cells(line: str) -> list[str]:
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


_TBODY_RE = re.compile(r"<tbody\b[^>]*>([\s\S]*?)<\/tbody>", re.IGNORECASE)
_THEAD_STRIP_RE = re.compile(r"<thead\b[\s\S]*?<\/thead>", re.IGNORECASE)
_TD_RE = re.compile(r"<td\b[^>]*>([\s\S]*?)<\/td>", re.IGNORECASE)
_TBODY_PROBE_RE = re.compile(r"<tbody\b", re.IGNORECASE)


def extract_html_table_cells(table_html: str) -> list[str]:
    """HTML ``<table>`` block から cell text を抽出する。

    ``<tbody>`` がある場合はその内部だけ、ない場合は ``<thead>`` を除いた全体
    から ``<tr><td>...</td></tr>`` の ``<td>`` inner を markdown 化して返す。
    mjs ``extractHtmlTableCells`` 等価。
    """
    has_tbody = _TBODY_PROBE_RE.search(table_html) is not None
    if has_tbody:
        m = _TBODY_RE.search(table_html)
        body_html = m.group(1) if m else ""
    else:
        body_html = _THEAD_STRIP_RE.sub("", table_html)
    cells: list[str] = []
    for match in _TD_RE.finditer(body_html):
        text = html_inline_to_markdown_text(match.group(1))
        if len(text) > 0:
            cells.append(text)
    return cells


# ---------------------------------------------------------------------------
# ``<details>`` / ``<summary>`` tokenization helpers
# ---------------------------------------------------------------------------


def find_tag_end(text: str, start: int) -> int:
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


def scan_for_matching_summary_close(text: str, start_depth: int) -> tuple[int, int, int]:
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
        close_match = SUMMARY_CLOSE_RE.match(tail)
        if close_match:
            depth -= 1
            if depth == 0:
                return (depth, i, len(close_match.group(0)))
            i += len(close_match.group(0))
            continue
        # <summary> nested open
        if SUMMARY_OPEN_PREFIX_RE.match(tail):
            depth += 1
            tag_end = find_tag_end(text, i + 1)
            if tag_end == -1:
                return (depth, -1, 0)
            i = tag_end + 1
            continue
        # その他の tag — quote-aware に skip
        if tail.startswith("</") or (len(tail) >= 2 and tail[0] == "<" and tail[1].isalpha()):
            tag_end = find_tag_end(text, i + 1)
            if tag_end == -1:
                i += 1
                continue
            i = tag_end + 1
            continue
        # stray '<' — text として scan 継続
        i += 1
    return (depth, -1, 0)


def tokenize_details_line(line: str) -> list[dict[str, Any]]:
    """markdown 1 行を ``<details>`` / ``<summary>`` / ``</details>`` tokens +
    text span の event 列に分解する (mjs ``tokenizeDetailsLine`` 等価)。

    condensed 1-liner ``Lead <details><summary>Q</summary></details> tail`` を
    左→右で正しい順序で emit するために必要。quote-aware な ``find_tag_end``
    経由で ``data-x="1>0"`` 等の attribute value を安全に skip する。

    event の ``type`` とペイロード:

    - ``{"type": "text", "value": str}``
    - ``{"type": "details-open"}``
    - ``{"type": "details-close"}``
    - ``{"type": "summary", "inner": str}`` — 同じ行内で閉じた場合
    - ``{"type": "summary-open", "initialInner": str, "initialDepth": int}``
      — multi-line 状態に入る場合 (行の終わりまで閉じない)
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

        close_match = DETAILS_CLOSE_PREFIX_RE.match(tail)
        if close_match:
            _emit_pending_text(i)
            events.append({"type": "details-close"})
            i += len(close_match.group(0))
            cursor = i
            continue

        if DETAILS_OPEN_PREFIX_RE.match(tail):
            tag_end = find_tag_end(line, i + 1)
            if tag_end == -1:
                break
            _emit_pending_text(i)
            events.append({"type": "details-open"})
            i = tag_end + 1
            cursor = i
            continue

        if SUMMARY_OPEN_PREFIX_RE.match(tail):
            open_end = find_tag_end(line, i + 1)
            if open_end == -1:
                break
            after_open = line[open_end + 1 :]
            depth, close_pos, close_len = scan_for_matching_summary_close(after_open, 1)
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


__all__ = [
    "decode_html_entities",
    "extract_html_table_cells",
    "find_tag_end",
    "html_inline_to_markdown_text",
    "scan_for_matching_summary_close",
    "split_table_cells",
    "tokenize_details_line",
]
