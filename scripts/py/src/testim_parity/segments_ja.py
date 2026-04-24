"""JA markdown canonical segment extractor — EN ``collectInlineText`` の対称実装。

JA markdown body を走査し、exact-diff engine 用の flat な segment 列を emit する。
Kind を判定できない構造は skip することで gate-eligible segment を clean に保つ
保守的な設計。

## Issue #368 対応 — list-item flatten

EN walker の ``collectInlineText`` は ``<li>`` 内の nested ``<ul>`` / 複数 ``<p>`` /
``<img>`` を 1 segment に flatten する。JA parser も対称化するため、activeListItem
state machine で以下を吸収する:

1. **Nested list marker** (``^(\\s*)[-*+]`` / ``^(\\s*)\\d+\\.`` で
   ``markerIndent > activeItem.bodyIndent``) → marker 剥がして text 部分のみ append
2. **Continuation paragraph** (任意テキスト行で ``leadingWs > activeItem.bodyIndent``) →
   行全体を append (whitespace-collapse で空白整形)
3. **Indented image** (``leadingWs > activeItem.bodyIndent`` の ``![...](...)`` /
   ``<Image>`` / ``<img>``) → 空白 1 個として append (EN ``<img>`` → space 処理と対称)
4. **Indented code fence** (``leadingWs > activeItem.bodyIndent`` の
   ``\\`\\`\\`...`` / ``~~~...``) → 開閉 fence 間の inner text のみ append

## Strict-``>`` rule の理由

EN walker との完全対称なら ``markerIndent >= activeItem.bodyIndent`` で nested
扱いすべきだが、288 corpus には JA author が EN sibling ``<ul>`` (walkBlock 経由で
非 ``<li>`` 直下の list を sibling として emit する MadCap fragment) の視覚的
ネスト再現のために ``1. outer\\n   - nested`` (``markerIndent == bodyIndent``)
pattern を使う 47 file / 263 line が存在する。これらは EN 側が sibling emit する
ため line-based emit で parity が通る。

そこで ``markerIndent > bodyIndent`` (strictly greater) のみ nested 扱いする:

- Tight sibling (``markerIndent == bodyIndent``): 独立 segment emit (line-based 互換)
- True nested (``markerIndent > bodyIndent``, +1 以上深い indent): flatten (EN 対称)

288 corpus の nested 行は全て ``markerIndent == bodyIndent`` (残りの strict-``>``
候補 8 行は ``` ``` ``` code fence 内で既に code-block として処理) のため parity は
byte-identical に維持される。将来 pull-requests unfreeze 等で EN ``<li>`` 直下 nested
``<ul>`` が入ったとき、JA 作成時に +1 indent で記述することで flatten が走る
(WRITING_GUIDE に author-facing rule を追記した)。

## mjs と byte-identical に維持される挙動

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
- tight sibling list (``markerIndent <= bodyIndent``) → 各行 1 segment emit
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
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
_WHITESPACE_COLLAPSE_RE = re.compile(r"\s+")


@dataclass
class _ActiveListItem:
    """Issue #368 flatten state — 活性 list item と、その ``bodyIndent`` に依存する
    deeper-indent content の吸収を担う。

    ``bodyIndent`` はリスト行中の ``(.+)`` capture 開始列 (``match.start(content_group)``)。
    これ以上深い ``leadingWs`` の content は current item に flatten される。
    """

    kind: str  # "ordered-list-item" | "unordered-list-item"
    body_indent: int
    text_parts: list[str] = field(default_factory=list)
    start_line: int = 0


class _Emitter:
    """``(sectionPath, kind)`` 毎に segment index をカウントしつつ segments を集める。

    counter key は ``(section_path, kind)`` の tuple を使う。mjs 側は
    ``section_path\x00kind`` の文字列結合だが、Python では tuple の方が
    idiomatic で ``section_path`` が仮に ``\x00`` を含んでも collision しない。
    両 runtime とも counter は内部状態で、emit 結果 (``segmentIndex``) の方が
    conformance 対象のため tuple 化しても byte parity は維持される。
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

    EN ``extractSegmentsFromMarkdown`` と同等の contract:

    - input が string でなければ ``[]``
    - frontmatter は内部で strip
    - ``paragraphKind`` state で paragraph buffer を ``paragraph`` / ``callout-body``
      のどちらで emit するかを切り替える。``:::note`` / ``:::caution`` 等の
      callout block 内だけ ``callout-body`` になり、list item / image / table
      は通常の classification path を通るため ``callout-body`` 以外の kind で emit
      される (EN ``walkCalloutBody`` と同じ挙動)
    - ``<details>`` 内の text block は ``paragraph`` で emit (EN walker と同等)
    - Issue #368 flatten: ``activeListItem`` で ``markerIndent > bodyIndent`` /
      ``leadingWs > bodyIndent`` の nested content を text に吸収
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

    active_list: _ActiveListItem | None = None

    def flush_paragraph() -> None:
        nonlocal paragraph_buf
        if not paragraph_buf:
            return
        path = build_section_path(heading_stack)
        emitter.emit(path, paragraph_kind, " ".join(paragraph_buf), paragraph_start_line)
        paragraph_buf = []

    def emit_active_list() -> None:
        """Issue #368: activeListItem を collapse して 1 segment として emit する。

        ``text_parts`` を single space で join し、連続空白を 1 個に collapse、
        前後 strip。EN ``collectInlineText`` の ``buffer.join('').replace(/\\s+/g, ' ').trim()``
        と等価 (``buffer`` は string list、``replace`` で whitespace collapse)。
        """
        nonlocal active_list
        if active_list is None:
            return
        raw = " ".join(active_list.text_parts)
        raw = _WHITESPACE_COLLAPSE_RE.sub(" ", raw).strip()
        if raw:
            path = build_section_path(heading_stack)
            emitter.emit(path, active_list.kind, raw, active_list.start_line)
        active_list = None

    def scan_indented_fence(start_idx: int, open_fence: str) -> tuple[int, str]:
        """``start_idx + 1`` から matching close fence を探して content を返す。

        Returns ``(next_idx, content_text)``。close fence が見つからなければ EOF
        まで全て content として返す (defensive)。mjs EN walker が ``<pre>`` 内を
        ``collectInlineText`` で flatten する挙動に対応。
        """
        j = start_idx + 1
        content: list[str] = []
        while j < n:
            jstripped = lines[j].strip()
            jmatch = _FENCE_RE.match(jstripped)
            # 同種 (backtick or tilde) かつ同等以上長さの fence が close
            if (
                jmatch
                and jmatch.group(1)[0] == open_fence[0]
                and len(jmatch.group(1)) >= len(open_fence)
            ):
                return j + 1, " ".join(content)
            content.append(jstripped)
            j += 1
        return j, " ".join(content)

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
        leading_ws = len(line) - len(line.lstrip())

        # ----- code fence (top-level or indented-inside-list) -----
        if _FENCE_RE.match(trimmed):
            if not in_code_fence:
                # Indented fence inside activeListItem → Issue #368 §3.2 #5:
                # fence 内 content を text として list item に吸収 (EN ``<li><pre>``
                # → ``collectInlineText`` 透過と対称)。
                if active_list is not None and leading_ws > active_list.body_indent:
                    fence_match = _FENCE_RE.match(trimmed)
                    assert fence_match is not None  # matched above
                    next_idx, content = scan_indented_fence(i, fence_match.group(1))
                    active_list.text_parts.append(content)
                    i = next_idx
                    continue
                # Top-level fence → flush active_list & enter fence mode
                emit_active_list()
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

        # ----- Blank line (with active_list peek-ahead for continuation) -----
        if trimmed == "":
            if active_list is not None:
                j = i + 1
                while j < n and lines[j].strip() == "":
                    j += 1
                if j < n:
                    next_ws = len(lines[j]) - len(lines[j].lstrip())
                    if next_ws > active_list.body_indent:
                        # blank 行 + deeper indent 継続 → active に留まる
                        i = j
                        continue
                emit_active_list()
            flush_paragraph()
            i += 1
            continue

        # ----- Indented absorption by active_list (Issue #368 flatten) -----
        if active_list is not None and leading_ws > active_list.body_indent:
            stripped = line.lstrip()
            # Image → space 1 個 (EN ``<img>`` と対称)
            if _IMAGE_RE.match(stripped):
                active_list.text_parts.append(" ")
                i += 1
                continue
            # Nested list marker → marker 剥がしで content のみ append
            nested_o = _ORDERED_RE.match(stripped)
            if nested_o:
                active_list.text_parts.append(nested_o.group(2))
                i += 1
                continue
            nested_u = _UNORDERED_RE.match(stripped)
            if nested_u:
                active_list.text_parts.append(nested_u.group(2))
                i += 1
                continue
            # Generic text → そのまま append
            active_list.text_parts.append(stripped)
            i += 1
            continue

        # ----- Less/equal indent → active_list 境界 -----
        # active_list は tight sibling pattern では line-based emit と同じ振る舞い
        # (次の top-level marker で flush)。ここで flush して以降の handler で
        # 通常処理する。
        if active_list is not None:
            emit_active_list()

        # ----- HTML table block -----
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

        # ----- <details> / <summary> tokens -----
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

        # ----- Callout :::note / :::warning / ... -----
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

        # ----- Heading -----
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

        # ----- Standalone image (top-level or within active_list boundary) -----
        if _IMAGE_RE.match(trimmed):
            flush_paragraph()
            path = build_section_path(heading_stack)
            emitter.emit(path, "image", trimmed, line_no)
            i += 1
            continue

        # ----- Markdown pipe table -----
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

        # ----- List markers (top-level = not absorbed by prior active_list) -----
        ordered_match = _ORDERED_RE.match(line)
        if ordered_match:
            flush_paragraph()
            content_start = ordered_match.start(2)
            active_list = _ActiveListItem(
                kind="ordered-list-item",
                body_indent=content_start,
                text_parts=[ordered_match.group(2)],
                start_line=line_no,
            )
            i += 1
            continue
        unordered_match = _UNORDERED_RE.match(line)
        if unordered_match:
            flush_paragraph()
            content_start = unordered_match.start(2)
            active_list = _ActiveListItem(
                kind="unordered-list-item",
                body_indent=content_start,
                text_parts=[unordered_match.group(2)],
                start_line=line_no,
            )
            i += 1
            continue

        # ----- Horizontal rule -----
        if _HORIZONTAL_RULE_RE.match(trimmed):
            flush_paragraph()
            i += 1
            continue

        # ----- Paragraph fall-through -----
        if not paragraph_buf:
            paragraph_start_line = line_no
        paragraph_buf.append(trimmed)
        i += 1

    # Trailing state flush
    if in_multiline_summary:
        flush_multiline_summary(n + line_offset)
    emit_active_list()
    if in_callout:
        flush_paragraph()
        paragraph_kind = "paragraph"
    else:
        flush_paragraph()

    return emitter.segments


__all__ = ["extract_segments_from_markdown"]
