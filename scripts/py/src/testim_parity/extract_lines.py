"""``extract.py`` の line-level state machine 部分を分離したモジュール。

``source_parity_extract.mjs`` 内の ``classifyLine`` state machine + section 別
``step / bullet / paragraph count`` 集計関数を保持する。``extract.py`` 本体が
800 行 soft cap を超えたため (code-reviewer MEDIUM 指摘)、以下の条件を満たす
line-level ``classify_line`` 関連のみこちらに切り出した:

- 入力: markdown ``body`` (str)
- 出力: section 別 count dict / classify 結果 dict
- 画像 / callout / heading / table 系 (markdown atom primitives) は ``extract.py``
  本体に残す (``extract_image_sequence`` 等と隣接配置)

``extract.py`` は末尾で ``from .extract_lines import *`` して backward-compatible
な import surface を維持する。新規 consumer も既存 consumer も
``from testim_parity.extract import classify_line, extract_step_counts, ...``
でそのまま使える。
"""

from __future__ import annotations

import re
from typing import Any

from .types import FENCE_LINE_RE

__all__ = [
    "classify_line",
    "extract_bullet_counts",
    "extract_paragraph_counts",
    "extract_step_counts",
]


# -- line-level primitives 共通 regex ------------------------------------------

_TABLE_ROW_PREFIX_RE = re.compile(r"^\\?\|")
_CALLOUT_OPEN_LINE_RE = re.compile(r"^:::(note|warning|info|tip|caution|danger)")
_ORDERED_LIST_LINE_RE = re.compile(r"^\d+(?:\\)?\.\s")
_UNORDERED_LIST_LINE_RE = re.compile(r"^[-*+]\s")
_INDENTED_UNORDERED_LINE_RE = re.compile(r"^\s+[-*+]\s")
_HEADING_H2_H4_RE = re.compile(r"^#{2,4}\s+(.+)")
_TRAILING_IMAGE_STRIP_RE = re.compile(r"^!\[[^\]]*\]\([^)\"]*(?:\s+\"[^\"]*\")?\)\s*")
_LEADING_MD_IMAGE_RE = re.compile(r"^!\[")


def _extract_trailing_after_leading_markdown_image(line: str) -> str | None:
    """``![...](...) 続き`` 行で image の後ろのテキストを取り出す (mjs 等価)。

    turndown が ``![](img)3. text`` のように image と list item を 1 行に
    連結するケースで、後続部分を分類対象にするためのヘルパー。
    """
    if not _LEADING_MD_IMAGE_RE.match(line):
        return None
    after = _TRAILING_IMAGE_STRIP_RE.sub("", line)
    if len(after) == 0 or _LEADING_MD_IMAGE_RE.match(after):
        return None
    return after


# -- step / bullet counts ------------------------------------------------------


def extract_step_counts(body: str) -> dict[str, int]:
    """section 見出し別に ordered-list step 数を集計する (mjs 等価)。

    table 行 (``|...`` / ``\\|...``) は step 計上対象外 (WRITING_GUIDE §5.3.9)。
    dict key 順は mjs ``Map`` の挿入順 = Python 3.7+ dict の挿入順で一致。
    """
    lines = body.split("\n")
    sections: dict[str, int] = {}
    current_section = "__top__"
    in_code_block = False
    in_callout = False

    for line in lines:
        if FENCE_LINE_RE.match(line):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            continue

        trimmed = line.strip()

        if _TABLE_ROW_PREFIX_RE.match(trimmed):
            continue

        if _CALLOUT_OPEN_LINE_RE.match(trimmed):
            in_callout = True
            continue
        if in_callout and trimmed == ":::":
            in_callout = False
            continue
        if trimmed.startswith(">"):
            continue

        heading = _HEADING_H2_H4_RE.match(line)
        if heading:
            in_callout = False
            current_section = heading.group(1).strip()
            sections.setdefault(current_section, 0)
            continue

        list_candidate = _extract_trailing_after_leading_markdown_image(trimmed) or line
        if not in_callout and _ORDERED_LIST_LINE_RE.match(list_candidate):
            sections[current_section] = sections.get(current_section, 0) + 1

    return sections


def extract_bullet_counts(body: str) -> dict[str, int]:
    """section 見出し別に unordered-list bullet 数を集計する (mjs 等価)。"""
    lines = body.split("\n")
    sections: dict[str, int] = {}
    current_section = "__top__"
    in_code_block = False
    in_callout = False

    for line in lines:
        if FENCE_LINE_RE.match(line):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            continue

        trimmed = line.strip()
        if _TABLE_ROW_PREFIX_RE.match(trimmed):
            continue

        if _CALLOUT_OPEN_LINE_RE.match(trimmed):
            in_callout = True
            continue
        if in_callout and trimmed == ":::":
            in_callout = False
            continue
        if trimmed.startswith(">"):
            continue

        heading = _HEADING_H2_H4_RE.match(line)
        if heading:
            in_callout = False
            current_section = heading.group(1).strip()
            sections.setdefault(current_section, 0)
            continue

        list_candidate = _extract_trailing_after_leading_markdown_image(trimmed) or trimmed
        if not in_callout and _UNORDERED_LIST_LINE_RE.match(list_candidate):
            sections[current_section] = sections.get(current_section, 0) + 1

    return sections


# -- classify_line + paragraph counts -----------------------------------------


_TABLE_OPEN_RE = re.compile(r"^<(?:Table|table)\b", re.IGNORECASE)
_TABLE_CLOSE_RE = re.compile(r"^</(?:Table|table)>", re.IGNORECASE)
_IMAGE_OR_HTMLIMG_RE = re.compile(r"^!\[|<img\b|<Image\b", re.IGNORECASE)
_HTML_STRUCTURE_RE = re.compile(r"^</?(?:br|hr|div|details|summary)\b", re.IGNORECASE)
_HTML_TABLE_STRUCTURE_RE = re.compile(r"^</?(?:thead|tbody|tfoot|tr|td|th)\b", re.IGNORECASE)
_HTML_COMMENT_CLOSE_RE = re.compile(r"-->")
_HTML_COMMENT_OPEN_RE = re.compile(r"^<!--")
_ZERO_WIDTH_ONLY_RE = re.compile(r"^[\u200b\u200c\u200d\ufeff]+$")


def _new_extract_state(overrides: dict[str, Any] | None = None) -> dict[str, Any]:
    """mjs ``createExtractState`` 等価の初期 state を返す。"""
    state = {
        "currentSection": "__top__",
        "inCallout": False,
        "inCodeBlock": False,
        "inHtmlComment": False,
        "inParagraph": False,
        "inTable": False,
    }
    if overrides:
        state.update(overrides)
    return state


def classify_line(line: str, state: dict[str, Any] | None = None) -> dict[str, Any]:
    """1 行の kind 分類と次の state を返す (mjs ``classifyLine`` 等価)。

    戻り値: ``{"kind": <kind>, "nextState": <dict>, "heading"?: <str>}``。
    ``kind`` の取り得る値: ``fence`` / ``code`` / ``table-open`` / ``table-close``
    / ``table`` / ``callout-open`` / ``callout-close`` / ``callout`` /
    ``blockquote`` / ``heading`` / ``ordered-list`` / ``unordered-list`` /
    ``image`` / ``markdown-table`` / ``html-structure`` /
    ``html-table-structure`` / ``html-comment`` / ``html-comment-start`` /
    ``blank`` / ``paragraph-start`` / ``paragraph``。
    """
    next_state = _new_extract_state(state)
    trimmed = line.strip()

    if FENCE_LINE_RE.match(line):
        next_state["inCodeBlock"] = not next_state["inCodeBlock"]
        next_state["inParagraph"] = False
        return {"kind": "fence", "nextState": next_state}

    if next_state["inCodeBlock"]:
        next_state["inParagraph"] = False
        return {"kind": "code", "nextState": next_state}

    if _TABLE_OPEN_RE.match(trimmed):
        next_state["inTable"] = True
        next_state["inParagraph"] = False
        return {"kind": "table-open", "nextState": next_state}
    if next_state["inTable"] and _TABLE_CLOSE_RE.match(trimmed):
        next_state["inTable"] = False
        return {"kind": "table-close", "nextState": next_state}
    if next_state["inTable"]:
        next_state["inParagraph"] = False
        return {"kind": "table", "nextState": next_state}

    if _CALLOUT_OPEN_LINE_RE.match(trimmed):
        next_state["inCallout"] = True
        next_state["inParagraph"] = False
        return {"kind": "callout-open", "nextState": next_state}
    if next_state["inCallout"] and trimmed == ":::":
        next_state["inCallout"] = False
        next_state["inParagraph"] = False
        return {"kind": "callout-close", "nextState": next_state}
    if next_state["inCallout"]:
        return {"kind": "callout", "nextState": next_state}

    if trimmed.startswith(">"):
        next_state["inParagraph"] = False
        return {"kind": "blockquote", "nextState": next_state}

    heading = _HEADING_H2_H4_RE.match(line)
    if heading:
        next_state["currentSection"] = heading.group(1).strip()
        next_state["inCallout"] = False
        next_state["inParagraph"] = False
        return {
            "kind": "heading",
            "heading": next_state["currentSection"],
            "nextState": next_state,
        }

    if _ORDERED_LIST_LINE_RE.match(line):
        next_state["inParagraph"] = False
        return {"kind": "ordered-list", "nextState": next_state}

    if _UNORDERED_LIST_LINE_RE.match(trimmed) or _INDENTED_UNORDERED_LINE_RE.match(line):
        next_state["inParagraph"] = False
        return {"kind": "unordered-list", "nextState": next_state}

    if _IMAGE_OR_HTMLIMG_RE.match(trimmed):
        if _LEADING_MD_IMAGE_RE.match(trimmed):
            after_image = _extract_trailing_after_leading_markdown_image(trimmed)
            if after_image:
                if _ORDERED_LIST_LINE_RE.match(after_image):
                    next_state["inParagraph"] = False
                    return {"kind": "ordered-list", "nextState": next_state}
                if _UNORDERED_LIST_LINE_RE.match(after_image):
                    next_state["inParagraph"] = False
                    return {"kind": "unordered-list", "nextState": next_state}
                next_state["inParagraph"] = True
                return {"kind": "paragraph-start", "nextState": next_state}
        next_state["inParagraph"] = False
        return {"kind": "image", "nextState": next_state}

    if _TABLE_ROW_PREFIX_RE.match(trimmed):
        next_state["inParagraph"] = False
        return {"kind": "markdown-table", "nextState": next_state}

    if _HTML_STRUCTURE_RE.match(trimmed):
        next_state["inParagraph"] = False
        return {"kind": "html-structure", "nextState": next_state}

    if _HTML_TABLE_STRUCTURE_RE.match(trimmed):
        next_state["inParagraph"] = False
        return {"kind": "html-table-structure", "nextState": next_state}

    if next_state["inHtmlComment"]:
        if _HTML_COMMENT_CLOSE_RE.search(trimmed):
            next_state["inHtmlComment"] = False
        next_state["inParagraph"] = False
        return {"kind": "html-comment", "nextState": next_state}

    if _HTML_COMMENT_OPEN_RE.match(trimmed):
        if not _HTML_COMMENT_CLOSE_RE.search(trimmed):
            next_state["inHtmlComment"] = True
        next_state["inParagraph"] = False
        return {"kind": "html-comment-start", "nextState": next_state}

    if not trimmed or _ZERO_WIDTH_ONLY_RE.match(trimmed):
        next_state["inParagraph"] = False
        return {"kind": "blank", "nextState": next_state}

    if not next_state["inParagraph"]:
        next_state["inParagraph"] = True
        return {"kind": "paragraph-start", "nextState": next_state}

    return {"kind": "paragraph", "nextState": next_state}


def extract_paragraph_counts(body: str) -> dict[str, int]:
    """section 別に paragraph-start 発生数を集計する (mjs 等価)。"""
    sections: dict[str, int] = {}
    state = _new_extract_state()

    for line in body.split("\n"):
        result = classify_line(line, state)
        state = result["nextState"]

        if result["kind"] == "heading":
            sections.setdefault(result["heading"], 0)
            continue

        if result["kind"] == "paragraph-start":
            sections[state["currentSection"]] = sections.get(state["currentSection"], 0) + 1

    return sections
