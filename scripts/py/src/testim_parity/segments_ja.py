"""JA markdown canonical segment extractor — ``source_parity_segments_ja.mjs`` の port。

JA markdown body を走査し、exact-diff engine 用の flat な segment 列を emit する。
Kind を判定できない構造は skip することで gate-eligible segment を clean に保つ
保守的な設計 (mjs と同一)。

## 挙動は mjs と byte-identical (Phase 6b cutover 後の契約)

Phase 2 では Issue #368 対策に ``markdown-it-py`` ベースの nested-list flattening
を入れていたが、288 corpus には ``<li>`` 内 nested / 複数 ``<p>`` が 0 件と判明
(Issue #368 本文 §1 参照)。JA content は mjs の line-based parser 前提で書かれて
いるため flatten すると 131 ページ / 843 issue の parity drift が発生し、Phase 6b
cutover gate を通らない。そこで Phase 6b で mjs と同じ line-based regex emit に
統一し、``<li>`` nested / multi-paragraph が corpus に入ったときは別 Issue で扱う
契約にした (pull-requests unfreeze 等で初登場したら対処)。

## 保存されている mjs 挙動 (byte-identical)

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
- ordered list / unordered list — 1 行 1 segment emit。``(\\s*)[-*+]`` /
  ``(\\s*)\\d+\\.`` が leading whitespace を許容するため nested marker も
  独立 segment になる。indented continuation は paragraph fall-through で
  別 ``paragraph`` segment として emit される
"""

from __future__ import annotations

import re
from typing import Any

from .segments_en import extract_segments_from_html
from .segments_ja_html import (
    extract_html_table_cells,
    html_inline_to_markdown_text,
    scan_for_matching_summary_close,
    split_table_cells,
    tokenize_details_line,
)
from .segments_shared import build_section_path, create_segment, push_heading

_FENCE_RE = re.compile(r"^(`{3,}|~{3,})")
_HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$")
_CALLOUT_OPEN_RE = re.compile(r"^:::(note|warning|info|tip|caution|danger)(?:\{[^}]*\})?\s*$")
_CALLOUT_CLOSE_RE = re.compile(r"^:::\s*$")
# ``<details>`` / ``<summary>`` token の粗検出用。行内に detailsまわりがあるかを
# O(1) で判定するためだけに残す。実際の tokenize は
# ``segments_ja_html.tokenize_details_line`` が担当する。
_DETAILS_TOKEN_RE = re.compile(r"<\/?details\b|<summary\b", re.IGNORECASE)
_IMAGE_RE = re.compile(r"^(?:!\[[^\]]*\]\([^)]+\)|<Image\b|<img\b)", re.IGNORECASE)
_UNORDERED_RE = re.compile(r"^(\s*)[-*+]\s+(.+)$")
_ORDERED_RE = re.compile(r"^(\s*)\d+\.\s+(.+)$")
_TABLE_ROW_RE = re.compile(r"^\|.+\|\s*$")
_TABLE_SEPARATOR_RE = re.compile(r"^\|\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)+\|\s*$")
_HTML_TABLE_OPEN_RE = re.compile(r"^<table\b", re.IGNORECASE)
_HTML_TABLE_CLOSE_RE = re.compile(r"<\/table>", re.IGNORECASE)
_HORIZONTAL_RULE_RE = re.compile(r"^(-{3,}|\*{3,}|_{3,})$")
_ANCHOR_SUFFIX_RE = re.compile(r"\s*\{#[^}]*\}\s*$")


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
# List handling — Phase 6b cutover に際して mjs line-based emit に統一
# ---------------------------------------------------------------------------
#
# Phase 2 では ``<li>`` 内 nested list / 複数 paragraph を CommonMark (markdown-it-py)
# で flatten する HYBRID 設計だったが、Issue #368 の survey で 288 corpus に
# ``<li>`` nested は 0 件と判明。JA content は mjs line-based parser 前提で
# 書かれているため、flatten すると 131 ページ / 843 issue の parity drift に
# なった (Phase 6b cutover gate blocker)。Phase 6b ではリスト行を mjs と同じ
# line-based regex で 1 行 1 segment emit する (``extract_segments_from_markdown``
# の main loop 内で直接 match)。nested marker は ``(\s*)[-*+]`` / ``(\s*)\d+\.``
# がそのまま拾う (mjs と同じ挙動)。continuation paragraph は paragraph
# fall-through で別 segment として emit される。


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
            summary_text = html_inline_to_markdown_text(joined)
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
            depth, close_pos, close_len = scan_for_matching_summary_close(
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
                cells = extract_html_table_cells(table_html)
                path = build_section_path(heading_stack)
                for cell in cells:
                    emitter.emit(path, "table-cell", cell, line_no)
                i = end_idx + 1
                continue
            # unterminated — fall through

        if _DETAILS_TOKEN_RE.search(line):
            flush_paragraph()
            events = tokenize_details_line(line)
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
                        summary_text = html_inline_to_markdown_text(ev["inner"])
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
            cells = split_table_cells(trimmed)
            path = build_section_path(heading_stack)
            for cell in cells:
                emitter.emit(path, "table-cell", cell, line_no)
            i += 1
            continue

        # Ordered / unordered list — mjs line-based emit (Phase 6b cutover).
        #
        # Phase 2 では ``_collect_list_region`` + ``_flatten_list_region``
        # (markdown-it-py) で top-level item のみ emit し continuation を
        # flatten する設計だったが、288 corpus には ``<li>`` 内に nested
        # list / 複数 paragraph を持つ EN ページは 0 件 (Issue #368 調査結果)。
        # 一方 JA content は mjs line-based parser 前提で書かれており、
        # hard-break continuation / nested list marker を独立 segment と
        # して emit することを期待する。Python が flatten すると 131 ページ /
        # 843 issue の parity drift になる (Phase 6b cutover gate blocker)。
        #
        # mjs ``UNORDERED_RE = /^(\s*)[-*+]\s+(.+)$/`` は leading whitespace を
        # 許容するため、``  - nested`` も独立 segment になる。
        # continuation paragraph は default (paragraph) fall-through で拾われる。
        ordered_match = _ORDERED_RE.match(line)
        if ordered_match:
            flush_paragraph()
            path = build_section_path(heading_stack)
            emitter.emit(path, "ordered-list-item", ordered_match.group(2), line_no)
            i += 1
            continue
        unordered_match = _UNORDERED_RE.match(line)
        if unordered_match:
            flush_paragraph()
            path = build_section_path(heading_stack)
            emitter.emit(path, "unordered-list-item", unordered_match.group(2), line_no)
            i += 1
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
