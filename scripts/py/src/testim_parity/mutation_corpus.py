"""diff=1 recall test 用の synthetic mutation corpus generator。

``scripts/lib/mutation_corpus.mjs`` の port。1 つの構造的変更だけを含む
最小 mutation を JA markdown に適用し、canonical segment extraction / exact
diff engine の 100% 検出を検証する (9/9 mutation type recall)。

10 種類の mutation function はいずれも以下の shape の ``MutationResult`` か
``None`` を返す:

    {
        "mutated": str,           # 適用後の markdown
        "metadata": {
            "type": str,          # mutation 種別 (MUTATION_TYPES の key)
            "lineIndex": int,     # 0-based 開始行
            "linesRemoved": int,  # 削除行数 (in-place は 0)
            "originalText": str,  # 元テキスト
            "description": str,   # 人間可読な説明 (日本語)
        },
    }

mjs と byte-identical な挙動契約 — metadata.description は日本語文言も完全一致。
"""

from __future__ import annotations

import re
from collections.abc import Sequence
from typing import Any

__all__ = [
    "MUTATION_TYPES",
    "classify_lines",
    "delete_bullet",
    "delete_callout_paragraph",
    "delete_html_table_cell",
    "delete_paragraph",
    "delete_step",
    "delete_table_cell",
    "drop_invariant_token",
    "generate_all_mutations",
    "generate_corpus",
    "insert_en_residual",
    "list_item_block_end",
    "move_segment",
    "paragraph_block_range",
    "swap_section_bodies",
]


_FENCE_LINE_RE = re.compile(r"^(`{3,}|~{3,})")
_CALLOUT_PREFIX_RE = re.compile(r"^:::")
_DETAILS_OPEN_RE = re.compile(r"^<details\b", re.IGNORECASE)
_DETAILS_CLOSE_RE = re.compile(r"^</details>", re.IGNORECASE)
_SUMMARY_OPEN_RE = re.compile(r"^<summary\b", re.IGNORECASE)
_HEADING_1_6_RE = re.compile(r"^#{1,6}\s")
_TABLE_LINE_RE = re.compile(r"^\|")
_IMAGE_MD_RE = re.compile(r"^!\[")
_IMAGE_HTML_IMAGE_RE = re.compile(r"^<Image\b")
_IMAGE_HTML_IMG_RE = re.compile(r"^<img\b", re.IGNORECASE)
_BULLET_RE = re.compile(r"^[-*+]\s")
_STEP_RE = re.compile(r"^\d+\.\s")

_TABLE_SEPARATOR_INLINE_RE = re.compile(r"^\|\s*:?-+:?\s*\|")
_TABLE_SEPARATOR_LINE_RE = re.compile(r"^\s*\|\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|\s*$")

_HEADING_ALL_RE = re.compile(r"^(#{1,6})\s+")
_FENCE_OPEN_CLOSE_RE = re.compile(r"^(`{3,}|~{3,})")

# EN 残留置換用の定型 (mjs と byte 一致)。
_EN_RESIDUAL_TEXT = (
    "Click on the Settings button and configure the required parameters for your test execution."
)


# ---------------------------------------------------------------------------
# Line classification
# ---------------------------------------------------------------------------


def _classify_content_line(trimmed: str, in_callout: bool) -> str:
    """1 行 (frontmatter / code 以外) の kind を返す (mjs ``classifyContentLine`` 等価)。"""
    if _CALLOUT_PREFIX_RE.match(trimmed):
        return "callout-close" if trimmed == ":::" else "callout-open"
    if _DETAILS_OPEN_RE.match(trimmed):
        return "details-open"
    if _DETAILS_CLOSE_RE.match(trimmed):
        return "details-close"
    if _SUMMARY_OPEN_RE.match(trimmed):
        return "summary"
    if trimmed == "":
        return "blank"
    if _HEADING_1_6_RE.match(trimmed):
        return "heading"
    if _TABLE_LINE_RE.match(trimmed):
        return "table"
    if (
        _IMAGE_MD_RE.match(trimmed)
        or _IMAGE_HTML_IMAGE_RE.match(trimmed)
        or _IMAGE_HTML_IMG_RE.match(trimmed)
    ):
        return "image"
    if _BULLET_RE.match(trimmed):
        return "callout-body" if in_callout else "bullet"
    if _STEP_RE.match(trimmed):
        return "callout-body" if in_callout else "step"
    if in_callout:
        return "callout-body"
    return "paragraph"


def classify_lines(md: str) -> list[dict[str, Any]]:
    """markdown の全行を kind 付き dict list に分類する (mjs ``classifyLines`` 等価)。

    戻り値: ``[{"index": int, "kind": str, "text": str}, ...]``。
    frontmatter (``---`` ~ ``---``) 内は全て ``frontmatter``、code fence (
    `` ``` `` / ``~~~``) 間は ``code``、fence 自身は ``code-fence``。
    callout depth は ``:::note``..``:::`` で追跡する。
    """
    lines = md.split("\n")
    result: list[dict[str, Any]] = []
    in_frontmatter = False
    frontmatter_dashes = 0
    in_code_block = False
    callout_depth = 0

    for i, line in enumerate(lines):
        trimmed = line.lstrip()

        if i == 0 and trimmed == "---":
            in_frontmatter = True
            frontmatter_dashes = 1
            result.append({"index": i, "kind": "frontmatter", "text": line})
            continue
        if in_frontmatter:
            if trimmed == "---":
                frontmatter_dashes += 1
                if frontmatter_dashes >= 2:
                    in_frontmatter = False
            result.append({"index": i, "kind": "frontmatter", "text": line})
            continue

        if _FENCE_LINE_RE.match(trimmed):
            in_code_block = not in_code_block
            result.append({"index": i, "kind": "code-fence", "text": line})
            continue
        if in_code_block:
            result.append({"index": i, "kind": "code", "text": line})
            continue

        kind = _classify_content_line(trimmed, callout_depth > 0)
        if kind == "callout-open":
            callout_depth += 1
        if kind == "callout-close":
            callout_depth = max(0, callout_depth - 1)
        result.append({"index": i, "kind": kind, "text": line})

    return result


# ---------------------------------------------------------------------------
# Block-extent helpers
# ---------------------------------------------------------------------------


def _line_indent(line: str) -> int:
    """先頭 whitespace の長さ (mjs ``lineIndent`` 等価)。"""
    return len(line) - len(line.lstrip())


def list_item_block_end(lines: Sequence[str], start: int) -> int:
    """list item block の exclusive end index を返す (mjs ``listItemBlockEnd`` 等価)。

    continuation / child item / 中間 blank line を含む extent を返す。
    """
    base_indent = _line_indent(lines[start])
    end = start + 1
    while end < len(lines):
        line = lines[end]
        if line.strip() == "":
            # Blank line — 後続に深い indent content があれば含める
            next_content = end + 1
            while next_content < len(lines) and lines[next_content].strip() == "":
                next_content += 1
            if next_content < len(lines) and _line_indent(lines[next_content]) > base_indent:
                end = next_content
                continue
            break
        if _line_indent(line) <= base_indent:
            break
        end += 1
    return end


def paragraph_block_range(
    classified: Sequence[dict[str, Any]], target_classified_idx: int
) -> tuple[int, int]:
    """連続 paragraph block の [start, end) 行範囲を返す (mjs ``paragraphBlockRange`` 等価)。"""
    lo = target_classified_idx
    while (
        lo > 0
        and classified[lo - 1]["kind"] == "paragraph"
        and classified[lo - 1]["index"] == classified[lo]["index"] - 1
    ):
        lo -= 1
    hi = target_classified_idx
    while (
        hi < len(classified) - 1
        and classified[hi + 1]["kind"] == "paragraph"
        and classified[hi + 1]["index"] == classified[hi]["index"] + 1
    ):
        hi += 1
    return classified[lo]["index"], classified[hi]["index"] + 1


def _remove_line_range(lines: Sequence[str], start: int, end: int) -> list[str]:
    """``lines[start:end]`` を除いた新しい list を返す (mjs ``removeLineRange`` 等価)。"""
    return list(lines[:start]) + list(lines[end:])


# ---------------------------------------------------------------------------
# Mutation functions
# ---------------------------------------------------------------------------


def delete_paragraph(md: str, nth: int = 0) -> dict[str, Any] | None:
    """段落 block を 1 つ削除 (mjs ``deleteParagraph`` 等価)。"""
    classified = classify_lines(md)
    block_starts: list[int] = []
    for i, entry in enumerate(classified):
        if entry["kind"] != "paragraph" or entry["text"].strip() == "":
            continue
        is_block_start = (
            i == 0
            or classified[i - 1]["kind"] != "paragraph"
            or classified[i - 1]["index"] != classified[i]["index"] - 1
        )
        if is_block_start:
            block_starts.append(i)
    if not block_starts:
        return None
    target_classified_idx = block_starts[nth % len(block_starts)]
    start, end = paragraph_block_range(classified, target_classified_idx)
    lines = md.split("\n")
    removed_text = "\n".join(lines[start:end])
    return {
        "mutated": "\n".join(_remove_line_range(lines, start, end)),
        "metadata": {
            "type": "paragraph-delete",
            "lineIndex": start,
            "linesRemoved": end - start,
            "originalText": removed_text,
            "description": f"段落削除 (L{start + 1}-{end}, {end - start}行)",
        },
    }


def delete_bullet(md: str, nth: int = 0) -> dict[str, Any] | None:
    """bullet list item を 1 つ削除 (mjs ``deleteBullet`` 等価)。"""
    classified = classify_lines(md)
    bullets = [c for c in classified if c["kind"] == "bullet"]
    if not bullets:
        return None
    target = bullets[nth % len(bullets)]
    lines = md.split("\n")
    end = list_item_block_end(lines, target["index"])
    removed_text = "\n".join(lines[target["index"] : end])
    return {
        "mutated": "\n".join(_remove_line_range(lines, target["index"], end)),
        "metadata": {
            "type": "bullet-delete",
            "lineIndex": target["index"],
            "linesRemoved": end - target["index"],
            "originalText": removed_text,
            "description": (
                f"箇条書き削除 (L{target['index'] + 1}-{end}, {end - target['index']}行)"
            ),
        },
    }


def delete_step(md: str, nth: int = 0) -> dict[str, Any] | None:
    """numbered step を 1 つ削除 (mjs ``deleteStep`` 等価)。"""
    classified = classify_lines(md)
    steps = [c for c in classified if c["kind"] == "step"]
    if not steps:
        return None
    target = steps[nth % len(steps)]
    lines = md.split("\n")
    end = list_item_block_end(lines, target["index"])
    removed_text = "\n".join(lines[target["index"] : end])
    return {
        "mutated": "\n".join(_remove_line_range(lines, target["index"], end)),
        "metadata": {
            "type": "step-delete",
            "lineIndex": target["index"],
            "linesRemoved": end - target["index"],
            "originalText": removed_text,
            "description": (f"手順削除 (L{target['index'] + 1}-{end}, {end - target['index']}行)"),
        },
    }


def _callout_body_block_end(lines: Sequence[str], start: int, callout_close_idx: int) -> int:
    """callout-body 要素の exclusive end index (mjs ``calloutBodyBlockEnd`` 等価)。"""
    trimmed = lines[start].lstrip()
    # List item inside callout — indent-based block detection を流用
    if _BULLET_RE.match(trimmed) or _STEP_RE.match(trimmed):
        raw = list_item_block_end(lines, start)
        return min(raw, callout_close_idx)
    # Plain text — 連続する非空/非 list callout 行を延ばす
    end = start + 1
    while end < callout_close_idx:
        t = lines[end].lstrip()
        if t == "" or _BULLET_RE.match(t) or _STEP_RE.match(t) or _CALLOUT_PREFIX_RE.match(t):
            break
        end += 1
    return end


def delete_callout_paragraph(md: str, nth: int = 0) -> dict[str, Any] | None:
    """callout 内 paragraph/list block を 1 つ削除 (mjs ``deleteCalloutParagraph`` 等価)。"""
    classified = classify_lines(md)
    lines = md.split("\n")
    candidates: list[dict[str, int]] = []
    seen: set[int] = set()
    for ci, entry in enumerate(classified):
        if entry["kind"] != "callout-body" or entry["text"].strip() == "":
            continue
        if entry["index"] in seen:
            continue
        # Find the callout's closing :::
        close_idx = len(lines)
        for j in range(ci + 1, len(classified)):
            if classified[j]["kind"] == "callout-close":
                close_idx = classified[j]["index"]
                break
        block_end = _callout_body_block_end(lines, entry["index"], close_idx)
        for li in range(entry["index"], block_end):
            seen.add(li)
        candidates.append(
            {"lineIndex": entry["index"], "blockEnd": block_end, "closeIdx": close_idx}
        )
    if not candidates:
        return None
    target = candidates[nth % len(candidates)]
    removed_text = "\n".join(lines[target["lineIndex"] : target["blockEnd"]])
    lines_removed = target["blockEnd"] - target["lineIndex"]
    return {
        "mutated": "\n".join(_remove_line_range(lines, target["lineIndex"], target["blockEnd"])),
        "metadata": {
            "type": "callout-paragraph-delete",
            "lineIndex": target["lineIndex"],
            "linesRemoved": lines_removed,
            "originalText": removed_text,
            "description": (
                f"callout内削除 (L{target['lineIndex'] + 1}-{target['blockEnd']}, "
                f"{lines_removed}行)"
            ),
        },
    }


def delete_table_cell(md: str, nth: int = 0) -> dict[str, Any] | None:
    """markdown pipe table の data cell を 1 つ空にする (mjs ``deleteTableCell`` 等価)。"""
    classified = classify_lines(md)
    table_rows = [c for c in classified if c["kind"] == "table"]
    separator_indices = {
        r["index"] for r in table_rows if _TABLE_SEPARATOR_INLINE_RE.match(r["text"])
    }
    if not separator_indices:
        return None
    candidate_rows = [
        r
        for r in table_rows
        if r["index"] not in separator_indices and (r["index"] + 1) not in separator_indices
    ]
    if not candidate_rows:
        return None
    target_row = candidate_rows[nth % len(candidate_rows)]
    split = target_row["text"].split("|")
    # mjs: ``i > 0 && i < arr.length - 1`` で 0 と最後の要素を除外
    cells = [c for i, c in enumerate(split) if 0 < i < len(split) - 1]
    if not cells:
        return None
    cell_idx = nth % len(cells)
    original_cell = cells[cell_idx]
    new_cells = [" " if i == cell_idx else c for i, c in enumerate(cells)]
    new_row = "|" + "|".join(new_cells) + "|"
    lines = md.split("\n")
    new_lines = list(lines)
    new_lines[target_row["index"]] = new_row
    return {
        "mutated": "\n".join(new_lines),
        "metadata": {
            "type": "table-cell-delete",
            "lineIndex": target_row["index"],
            "linesRemoved": 0,
            "originalText": original_cell.strip(),
            "description": f"table cell削除 (L{target_row['index'] + 1}, col{cell_idx})",
        },
    }


# HTML table <td>...</td> マッチ (mjs ``tdPattern`` と同じく multi-line 許容)。
_TD_PATTERN = re.compile(r"<td\b[^>]*>([\s\S]*?)</td>", re.IGNORECASE)


def delete_html_table_cell(md: str, nth: int = 0) -> dict[str, Any] | None:
    """HTML table の ``<td>`` cell を 1 つ空にする (mjs ``deleteHtmlTableCell`` 等価)。"""
    candidates: list[dict[str, Any]] = []
    for match in _TD_PATTERN.finditer(md):
        content = match.group(1).strip()
        if len(content) == 0:
            continue  # 既に空
        candidates.append(
            {
                "fullMatch": match.group(0),
                "content": content,
                "matchIndex": match.start(),
                "matchLength": match.end() - match.start(),
            }
        )
    if not candidates:
        return None
    target = candidates[nth % len(candidates)]
    # ``<td>content</td>`` を ``<td>\n   </td>`` に置換、属性は保持
    open_tag_end = target["fullMatch"].index(">") + 1
    open_tag = target["fullMatch"][:open_tag_end]
    replacement = f"{open_tag}\n   </td>"
    before = md[: target["matchIndex"]]
    after = md[target["matchIndex"] + target["matchLength"] :]
    line_index = md[: target["matchIndex"]].count("\n")
    return {
        "mutated": before + replacement + after,
        "metadata": {
            "type": "html-table-cell-delete",
            "lineIndex": line_index,
            "linesRemoved": 0,
            "originalText": target["content"][:80],
            "description": f"HTML table cell削除 (offset {target['matchIndex']})",
        },
    }


def move_segment(md: str, nth: int = 0) -> dict[str, Any] | None:
    """同一 section 内の隣接 paragraph block 2 つを入れ替え (mjs ``moveSegment`` 等価)。"""
    classified = classify_lines(md)
    blocks: list[dict[str, int]] = []
    for i, entry in enumerate(classified):
        if entry["kind"] != "paragraph" or entry["text"].strip() == "":
            continue
        is_start = (
            i == 0
            or classified[i - 1]["kind"] != "paragraph"
            or classified[i - 1]["index"] != classified[i]["index"] - 1
        )
        if is_start:
            b_start, b_end = paragraph_block_range(classified, i)
            blocks.append({"start": b_start, "end": b_end})
    pairs: list[dict[str, Any]] = []
    lines_src = md.split("\n")
    for i in range(len(blocks) - 1):
        a = blocks[i]
        b = blocks[i + 1]
        a_text = "\n".join(lines_src[a["start"] : a["end"]])
        b_text = "\n".join(lines_src[b["start"] : b["end"]])
        if a_text == b_text:
            continue
        # 間に構造要素 (code / table / image / heading 等) があれば reject
        between = [le for le in classified if a["end"] <= le["index"] < b["start"]]
        has_structure = any(le["kind"] != "blank" for le in between)
        if has_structure:
            continue
        pairs.append({"a": a, "b": b, "aText": a_text, "bText": b_text})
    if not pairs:
        return None
    pair = pairs[nth % len(pairs)]
    lines = md.split("\n")
    a_lines = lines[pair["a"]["start"] : pair["a"]["end"]]
    b_lines = lines[pair["b"]["start"] : pair["b"]["end"]]
    gap_lines = lines[pair["a"]["end"] : pair["b"]["start"]]
    new_lines = (
        list(lines[: pair["a"]["start"]])
        + list(b_lines)
        + list(gap_lines)
        + list(a_lines)
        + list(lines[pair["b"]["end"] :])
    )
    return {
        "mutated": "\n".join(new_lines),
        "metadata": {
            "type": "segment-move",
            "lineIndex": pair["a"]["start"],
            "linesRemoved": 0,
            "originalText": (
                f"[{pair['a']['start'] + 1}-{pair['a']['end']}] \u2194 "
                f"[{pair['b']['start'] + 1}-{pair['b']['end']}]"
            ),
            "description": (
                f"segment移動 (L{pair['a']['start'] + 1}-{pair['a']['end']} \u2194 "
                f"L{pair['b']['start'] + 1}-{pair['b']['end']})"
            ),
        },
    }


# CJK 検出 (mjs ``[\u3000-\u9fff\uf900-\ufaff]``)。JA 段落検出用。
_CJK_RE = re.compile(r"[\u3000-\u9fff\uf900-\ufaff]")


def insert_en_residual(md: str, nth: int = 0) -> dict[str, Any] | None:
    """JA 段落を EN 定型文で置換し、未翻訳残留を simulate (mjs ``insertEnResidual`` 等価)。"""
    classified = classify_lines(md)

    all_block_starts: list[int] = []
    for i, entry in enumerate(classified):
        if entry["kind"] != "paragraph":
            continue
        is_start = (
            i == 0
            or classified[i - 1]["kind"] != "paragraph"
            or classified[i - 1]["index"] != classified[i]["index"] - 1
        )
        if is_start:
            all_block_starts.append(i)
    # CJK を含む block のみを残す
    block_starts: list[int] = []
    for start_idx in all_block_starts:
        _, block_end = paragraph_block_range(classified, start_idx)
        has_cjk = False
        i = start_idx
        while i < len(classified) and classified[i]["index"] < block_end:
            if _CJK_RE.search(classified[i]["text"]):
                has_cjk = True
                break
            i += 1
        if has_cjk:
            block_starts.append(start_idx)
    if not block_starts:
        return None

    target_classified_idx = block_starts[nth % len(block_starts)]
    start, end = paragraph_block_range(classified, target_classified_idx)

    lines = md.split("\n")
    new_lines = list(lines)
    # mjs ``Array.prototype.splice(start, end - start, enText)`` 相当。
    new_lines[start:end] = [_EN_RESIDUAL_TEXT]
    lines_removed = end - start - 1
    range_suffix = f"-{end}" if end - start > 1 else ""
    return {
        "mutated": "\n".join(new_lines),
        "metadata": {
            "type": "en-residual",
            "lineIndex": start,
            "linesRemoved": lines_removed,
            "originalText": "\n".join(lines[start:end]),
            "description": f"EN残留 (L{start + 1}{range_suffix}): JA\u2192EN置換",
        },
    }


# invariant token 検出用のパターン群 (mjs 等価、iteration 順を保持)。
_TOKEN_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"`--[\w-]+`"),
    re.compile(r"`[A-Z_]{2,}`"),
    re.compile(r"https?://[^\s)]+"),
    re.compile(r"--[\w-]+"),
)

_DROP_SKIP_KINDS: frozenset[str] = frozenset(
    {"frontmatter", "code", "code-fence", "blank", "image"}
)


def drop_invariant_token(md: str, nth: int = 0) -> dict[str, Any] | None:
    """1 つの invariant token (CLI flag / URL / code ref) を削除。

    mjs ``dropInvariantToken`` 等価。
    """
    classified = classify_lines(md)
    raw_candidates: list[dict[str, Any]] = []
    for line in classified:
        if line["kind"] in _DROP_SKIP_KINDS:
            continue
        # table separator 行は ``--[\w-]+`` に誤マッチして cascade を起こすため除外
        if _TABLE_SEPARATOR_LINE_RE.match(line["text"]):
            continue
        for pattern in _TOKEN_PATTERNS:
            for match in pattern.finditer(line["text"]):
                raw_candidates.append(
                    {
                        "lineIndex": line["index"],
                        "lineText": line["text"],
                        "token": match.group(0),
                        "matchIndex": match.start(),
                        "matchLength": match.end() - match.start(),
                    }
                )

    def _dominated(c: dict[str, Any]) -> bool:
        return any(
            other is not c
            and other["lineIndex"] == c["lineIndex"]
            and other["matchIndex"] <= c["matchIndex"]
            and other["matchIndex"] + other["matchLength"] >= c["matchIndex"] + c["matchLength"]
            and other["matchLength"] > c["matchLength"]
            for other in raw_candidates
        )

    candidates = [c for c in raw_candidates if not _dominated(c)]
    if not candidates:
        return None
    target = candidates[nth % len(candidates)]
    lines = md.split("\n")
    new_lines = list(lines)
    before = target["lineText"][: target["matchIndex"]]
    after = target["lineText"][target["matchIndex"] + target["matchLength"] :]
    new_lines[target["lineIndex"]] = before + after
    return {
        "mutated": "\n".join(new_lines),
        "metadata": {
            "type": "token-drop",
            "lineIndex": target["lineIndex"],
            "linesRemoved": 0,
            "originalText": target["token"],
            "description": (f'token欠落 (L{target["lineIndex"] + 1}): "{target["token"]}" を除去'),
        },
    }


def swap_section_bodies(md: str, nth: int = 0) -> dict[str, Any] | None:
    """隣接 section の body を入れ替え、heading は据え置き (mjs ``swapSectionBodies`` 等価)。

    H1 (title) は skip、H2/H3/H4 のみ対象。section content validation pass
    (``align.py``) を走らせる目的の mutation。
    """
    raw_lines = md.split("\n")

    # Find body start (skip frontmatter)
    body_start = 0
    if raw_lines and raw_lines[0].strip() == "---":
        for i in range(1, len(raw_lines)):
            if raw_lines[i].strip() == "---":
                body_start = i + 1
                break

    headings: list[dict[str, int]] = []
    in_code = False
    for i in range(body_start, len(raw_lines)):
        trimmed = raw_lines[i].lstrip()
        if _FENCE_OPEN_CLOSE_RE.match(trimmed):
            in_code = not in_code
            continue
        if in_code:
            continue
        m = _HEADING_ALL_RE.match(trimmed)
        if m:
            headings.append({"level": len(m.group(1)), "lineIndex": i})

    sections: list[dict[str, int]] = []
    for h, heading in enumerate(headings):
        if heading["level"] < 2 or heading["level"] > 4:
            continue
        body_start_line = heading["lineIndex"] + 1
        body_end_line = headings[h + 1]["lineIndex"] if h + 1 < len(headings) else len(raw_lines)
        if body_start_line >= body_end_line:
            continue
        has_content = any(raw_lines[i].strip() != "" for i in range(body_start_line, body_end_line))
        if not has_content:
            continue
        sections.append(
            {
                "headingLine": heading["lineIndex"],
                "bodyStartLine": body_start_line,
                "bodyEndLine": body_end_line,
            }
        )

    pairs: list[tuple[dict[str, int], dict[str, int]]] = []
    for i in range(len(sections) - 1):
        if sections[i]["bodyEndLine"] == sections[i + 1]["headingLine"]:
            pairs.append((sections[i], sections[i + 1]))
    if not pairs:
        return None

    a, b = pairs[nth % len(pairs)]
    a_body = raw_lines[a["bodyStartLine"] : a["bodyEndLine"]]
    b_body = raw_lines[b["bodyStartLine"] : b["bodyEndLine"]]

    new_lines = (
        list(raw_lines[: a["bodyStartLine"]])
        + list(b_body)
        + [raw_lines[b["headingLine"]]]
        + list(a_body)
        + list(raw_lines[b["bodyEndLine"] :])
    )

    return {
        "mutated": "\n".join(new_lines),
        "metadata": {
            "type": "section-body-swap",
            "lineIndex": a["bodyStartLine"],
            "linesRemoved": 0,
            "originalText": (
                f"[L{a['bodyStartLine'] + 1}-{a['bodyEndLine']}] \u2194 "
                f"[L{b['bodyStartLine'] + 1}-{b['bodyEndLine']}]"
            ),
            "description": (
                f"セクション本文入れ替え (L{a['bodyStartLine'] + 1}-{a['bodyEndLine']} "
                f"\u2194 L{b['bodyStartLine'] + 1}-{b['bodyEndLine']})"
            ),
        },
    }


# ---------------------------------------------------------------------------
# Registry and generators
# ---------------------------------------------------------------------------


# 全 mutation function を type 名で index。挿入順は mjs ``MUTATION_TYPES`` と一致。
MUTATION_TYPES: dict[str, Any] = {
    "paragraph-delete": delete_paragraph,
    "bullet-delete": delete_bullet,
    "step-delete": delete_step,
    "callout-paragraph-delete": delete_callout_paragraph,
    "table-cell-delete": delete_table_cell,
    "html-table-cell-delete": delete_html_table_cell,
    "segment-move": move_segment,
    "section-body-swap": swap_section_bodies,
    "en-residual": insert_en_residual,
    "token-drop": drop_invariant_token,
}


def generate_all_mutations(md: str) -> dict[str, dict[str, Any]]:
    """適用可能な全 type の mutation を 1 件ずつ生成 (mjs ``generateAllMutations`` 等価)。

    mjs は ``Map<string, MutationResult>`` を返すが、Python 3.7+ dict は
    挿入順を保持するため dict で代用。conformance harness では
    ``Object.fromEntries(map)`` と同等の JSON 化で byte parity を取る。
    """
    results: dict[str, dict[str, Any]] = {}
    for type_name, fn in MUTATION_TYPES.items():
        result = fn(md, 0)
        if result is not None:
            results[type_name] = result
    return results


def generate_corpus(md: str, count: int = 3) -> dict[str, list[dict[str, Any]]]:
    """type ごとに複数 mutation を生成 (mjs ``generateCorpus`` 等価)。

    同じ ``(lineIndex, originalText)`` は重複として除外。``count`` 未満しか
    生成できない type はその数で止まる。type のキー順序は
    ``MUTATION_TYPES`` の挿入順に一致。
    """
    results: dict[str, list[dict[str, Any]]] = {}
    for type_name, fn in MUTATION_TYPES.items():
        mutations: list[dict[str, Any]] = []
        for i in range(count):
            result = fn(md, i)
            if result is None:
                continue
            is_duplicate = any(
                m["metadata"]["lineIndex"] == result["metadata"]["lineIndex"]
                and m["metadata"]["originalText"] == result["metadata"]["originalText"]
                for m in mutations
            )
            if not is_duplicate:
                mutations.append(result)
        if mutations:
            results[type_name] = mutations
    return results
