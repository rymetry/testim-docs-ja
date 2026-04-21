"""parity 比較用の markdown / HTML 構造抽出ヘルパー群。

``scripts/lib/source_parity_extract.mjs`` の port。Phase 0 で invariant-token
抽出のみ先行 port し、Phase 3 M3 で残り 13 関数 (image / callout / heading /
step / bullet / paragraph counts、markdown / HTML tables、untranslated cell
判定、EN artifact detection + 正規化、``classifyLine`` state machine) を追加。

mjs と byte-identical な出力契約 — conformance harness (``harness.mjs``) で
dispatch 越しに batch 比較する。
"""

from __future__ import annotations

import re
from typing import Any

from .madcap_toc import extract_slug as _extract_slug_from_url
from .project import build_basename_to_path_map, resolve_to_full_slug
from .types import FENCE_LINE_RE

# 2 segment の dotted path でも採用する known prefix。mjs allowlist と完全一致。
_KNOWN_DOT_PREFIX_RE = re.compile(
    r"^(params|test|config|step|suite|browser|element|window|document|process|module|exports)\."
)


def _normalize_url_token(url: str) -> str | None:
    """URL トークンを canonical 化して emit、または ``None`` で抑止する。

    ambiguous な basename (``build_basename_to_path_map`` が None を返す) の場合は
    emission を抑止する — JA 側が canonical path-based URL を使っているときに
    bare basename 由来の token-gap を立てないための意図的挙動。
    """
    # MadCap の ``\&amp;`` エスケープは entity decode 後に ``\&`` として残るため、
    # backslash を先に落としてから正規化する。
    cleaned = url.replace("\\", "")

    if re.match(r"^https?://docs\.tricentis\.com/testim/content/", cleaned):
        stripped = re.sub(r"[?#].*$", "", cleaned)
        slug = _extract_slug_from_url(stripped)
        if slug:
            full = resolve_to_full_slug(slug)
            basename = slug.split("/")[-1]
            # mjs は ``map.get(basename) === null`` で **明示的 null (ambiguous)**
            # のみ抑止する。key 欠如 (undefined) は emit する。Python の
            # ``dict.get()`` は missing / explicit None を区別できないので、
            # ``in`` で存在チェックを先行させる (Phase 1.3 verification で発覚)。
            basename_map = build_basename_to_path_map()
            if basename in basename_map and basename_map[basename] is None:
                return None
            return f"/docs/{full}"

    if re.search(r"\.htm(?:[?#]|$)", cleaned):
        # 相対 prefix (``../``, ``./``) と query/fragment を落とす
        stripped = re.sub(r"^(?:\.\./)+|^(?:\./)+", "", cleaned)
        stripped = re.sub(r"[?#].*$", "", stripped)
        content_path = stripped if stripped.startswith("/content/") else f"/content/{stripped}"
        slug = _extract_slug_from_url(content_path)
        if slug:
            full = resolve_to_full_slug(slug)
            basename = slug.split("/")[-1]
            basename_map = build_basename_to_path_map()
            if basename in basename_map and basename_map[basename] is None:
                return None
            return f"/docs/{full}"

    if cleaned.startswith("/docs/") and "#" in cleaned:
        return re.sub(r"#.*$", "", cleaned)

    return cleaned


# :func:`extract_invariant_tokens` をタイトに保つため、module load 時に全 regex を
# コンパイルする。mjs と同じ pattern を使っている。
_CODE_RE = re.compile(r"`([^`]+)`")
_URL_RE = re.compile(r"https?://[^\s)>\]]+")
_LINK_DEST_RE = re.compile(
    r"(?:\]\(|(?:^|\s)\[)"
    r"((?:/docs/[\w-]+(?:/[\w-]+)*(?:#[^\]\)\s]+)?"
    r"|https?://[^\s)\]]+"
    r"|[^\s)\]]*\.htm(?:#[^\]\)\s]*)?))"
    r"\]?\)?"
)
_FLAG_RE = re.compile(r"(?:^|\s)(--?[a-zA-Z][\w-]*)(?=\s|$)")
_DOT_RE = re.compile(r"\b([a-zA-Z_]\w*(?:\.\w+)+)\b")
_VERSION_RE = re.compile(r"\bv?\d+\.\d+\.\d+\b")
_NUMBER_UNIT_RE = re.compile(
    r"\b(\d+(?:\.\d+)?\s*(?:sec|ms|s|px|em|rem|%|MB|GB|KB|min|hr))\b",
    flags=re.IGNORECASE,
)
_PATH_RE = re.compile(r"(?:^|\s)(/[a-zA-Z][\w.-]+(?:/[\w.-]+)+)")
_INLINE_CODE_SPAN_RE = re.compile(r"`[^`]*`")


def _blank_span(text: str, start: int, end: int) -> str:
    """``text[start:end]`` を同じ長さの空白に置換する (span 消去)。"""
    return text[:start] + " " * (end - start) + text[end:]


def extract_invariant_tokens(cell: str) -> list[str]:
    """``cell`` に含まれる invariant トークンをソート済み重複排除リストで返す。

    mjs 実装と同じ順序で抽出するため、span blanking の挙動も一致させる。最終結果は
    set → sorted リスト。
    """
    token_set: set[str] = set()

    for match in _CODE_RE.finditer(cell):
        token_set.add(match.group(1))

    # mjs は ``cell.replace(/`[^`]*`/g, '')`` で backtick span 全体を **パディング
    # なし** に消去する。後続の URL / link span は位置安定性を保つため空白パディング
    # するが、backtick span は完全削除でよい。
    rest = _INLINE_CODE_SPAN_RE.sub("", cell)

    url_spans: list[tuple[int, int]] = []
    for match in _URL_RE.finditer(rest):
        token = _normalize_url_token(match.group(0))
        if token is not None:
            token_set.add(token)
        url_spans.append((match.start(), match.end()))
    for start, end in reversed(url_spans):
        rest = _blank_span(rest, start, end)

    link_spans: list[tuple[int, int]] = []
    for match in _LINK_DEST_RE.finditer(rest):
        token = _normalize_url_token(match.group(1))
        if token is not None:
            token_set.add(token)
        link_spans.append((match.start(), match.end()))
    for start, end in reversed(link_spans):
        rest = _blank_span(rest, start, end)

    for match in _FLAG_RE.finditer(rest):
        token_set.add(match.group(1))

    for match in _DOT_RE.finditer(rest):
        dot_path = match.group(1)
        segment_count = len(dot_path.split("."))
        if segment_count >= 3 or _KNOWN_DOT_PREFIX_RE.match(dot_path):
            token_set.add(dot_path)

    for match in _VERSION_RE.finditer(rest):
        token_set.add(match.group(0))

    for match in _NUMBER_UNIT_RE.finditer(rest):
        token_set.add(re.sub(r"\s+", "", match.group(1)))

    for match in _PATH_RE.finditer(rest):
        token_set.add(match.group(1))

    return sorted(token_set)


# ---------------------------------------------------------------------------
# Phase 3 M3 追加: markdown 構造抽出関数 (checks.py が依存)
# ---------------------------------------------------------------------------

# 画像検出 (markdown / <Image> / <img>)
_IMAGE_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"!\[[^\]]*\]\(([^)]+)\)"),
    re.compile(r"<Image\b[^>]*\bsrc\s*=\s*\"([^\"]+)\""),
    re.compile(r"<img\b[^>]*\bsrc\s*=\s*\"([^\"]+)\"", re.IGNORECASE),
)
_IMG_EXT_RE = re.compile(r"\.[^.]+$")


def extract_image_sequence(body: str) -> list[dict[str, Any]]:
    """markdown / HTML 画像の出現順列を ``[{file, line}]`` で返す (mjs 等価)。

    code fence 内は除外。``file`` は拡張子を落とした basename
    (mjs ``source.split('/').pop().replace(/\\.[^.]+$/, '')`` と一致)。
    """
    lines = body.split("\n")
    images: list[dict[str, Any]] = []
    in_code_block = False

    for index, line in enumerate(lines):
        if FENCE_LINE_RE.match(line):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            continue

        for pattern in _IMAGE_PATTERNS:
            for match in pattern.finditer(line):
                source = match.group(1)
                basename = source.rsplit("/", 1)[-1]
                file = _IMG_EXT_RE.sub("", basename)
                images.append({"file": file, "line": index + 1})
    return images


# Callout 位置検出 — :::directive と blockquote-emoji の 2 種類
_CALLOUT_DIRECTIVE_RE = re.compile(r"^(\s*):::(note|warning|info|tip|caution|danger)")
_CALLOUT_EMOJI_RE = re.compile(
    r"^>\s*(?:\U0001f4d8|\u2757\ufe0f?|\U0001f6a7|\U0001f44d|\u26a0\ufe0f|"
    r"\U0001f4dd|\u2705|\u274c|\U0001f4a1|\u2139\ufe0f|\u26d4|\U0001f525|"
    r"\U0001f4a5|\U0001f3af|\U0001f4cc|\U0001f3f7\ufe0f)\s"
)
_CALLOUT_EMOJI_TYPE_RE = re.compile(
    r"(\U0001f4d8|\U0001f6a7|\u2757\ufe0f?|\u26a0\ufe0f|\U0001f44d|"
    r"\U0001f4dd|\u2705|\u274c|\U0001f4a1|\u2139\ufe0f)"
)
_LEADING_WS_RE = re.compile(r"^(\s*)")


def extract_callout_positions(body: str) -> list[dict[str, Any]]:
    """:::directive / blockquote-emoji 形式の callout 位置を返す (mjs 等価)。

    インデント 2 以上を ``depth=1`` (nested)、未満を ``depth=0``。emoji 検出の
    正規表現は mjs と完全に揃えている (Tricentis docs で使われる絵文字列挙)。
    """
    lines = body.split("\n")
    callouts: list[dict[str, Any]] = []
    in_code_block = False

    for index, line in enumerate(lines):
        if FENCE_LINE_RE.match(line):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            continue

        directive = _CALLOUT_DIRECTIVE_RE.match(line)
        if directive:
            indent = len(directive.group(1))
            callouts.append(
                {
                    "type": directive.group(2),
                    "depth": 1 if indent >= 2 else 0,
                    "line": index + 1,
                }
            )
            continue

        trimmed_start = line.lstrip()
        if _CALLOUT_EMOJI_RE.match(trimmed_start):
            leading = _LEADING_WS_RE.match(line)
            indent = len(leading.group(1)) if leading else 0
            emoji_match = _CALLOUT_EMOJI_TYPE_RE.search(line)
            callouts.append(
                {
                    "type": emoji_match.group(1) if emoji_match else "unknown",
                    "depth": 1 if indent >= 2 else 0,
                    "line": index + 1,
                }
            )

    return callouts


# step / bullet / paragraph counts 共通の state machine primitive
_TABLE_ROW_PREFIX_RE = re.compile(r"^\\?\|")
_CALLOUT_OPEN_LINE_RE = re.compile(r"^:::(note|warning|info|tip|caution|danger)")
_ORDERED_LIST_LINE_RE = re.compile(r"^\d+(?:\\)?\.\s")
_UNORDERED_LIST_LINE_RE = re.compile(r"^[-*+]\s")
_INDENTED_UNORDERED_LINE_RE = re.compile(r"^\s+[-*+]\s")
_HEADING_H2_H4_RE = re.compile(r"^#{2,4}\s+(.+)")
_HEADING_H2_H6_RE = re.compile(r"^(#{2,6})\s+(.+)")
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


# classifyLine 用の追加 regex
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


def extract_heading_sequence(body: str) -> list[dict[str, Any]]:
    """H2-H6 見出しを ``[{level, text}]`` で抽出する (mjs 等価)。"""
    headings: list[dict[str, Any]] = []
    in_code_block = False

    for line in body.split("\n"):
        if FENCE_LINE_RE.match(line):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            continue

        match = _HEADING_H2_H6_RE.match(line)
        if match:
            headings.append({"level": len(match.group(1)), "text": match.group(2).strip()})

    return headings


# Markdown decoration strip + untranslated cell 判定
_STRIP_IMAGE_RE = re.compile(r"!\[[^\]]*\]\([^)]*\)")
_STRIP_LINK_RE = re.compile(r"\[([^\]]*)\]\([^)]*\)")
_STRIP_CODE_RE = re.compile(r"`[^`]*`")
_STRIP_BOLD_RE = re.compile(r"\*\*([^*]*)\*\*")
_STRIP_ITALIC_ASTERISK_RE = re.compile(r"\*([^*]*)\*")
_STRIP_ITALIC_UNDERSCORE_RE = re.compile(r"(?<![a-zA-Z0-9])_([^_]+)_(?![a-zA-Z0-9])")
_STRIP_STRIKE_RE = re.compile(r"~~([^~]*)~~")


def strip_markdown(text: str) -> str:
    """Markdown decoration を除去した平文を返す (mjs 等価)。"""
    text = _STRIP_IMAGE_RE.sub("", text)
    text = _STRIP_LINK_RE.sub(r"\1", text)
    text = _STRIP_CODE_RE.sub("", text)
    text = _STRIP_BOLD_RE.sub(r"\1", text)
    text = _STRIP_ITALIC_ASTERISK_RE.sub(r"\1", text)
    text = _STRIP_ITALIC_UNDERSCORE_RE.sub(r"\1", text)
    text = _STRIP_STRIKE_RE.sub(r"\1", text)
    return text.strip()


_CJK_RE = re.compile(r"[\u3000-\u9fff\uf900-\ufaff]")
_URL_LEADING_RE = re.compile(r"^https?://")
_CODE_LEADING_RE = re.compile(r"^[`']")
_NUMBER_CELL_RE = re.compile(r"^\d+(\.\d+)?%?$")
_LOWER_IDENT_RE = re.compile(r"^[a-z][a-zA-Z0-9]*$")
_UPPER_IDENT_RE = re.compile(r"^[A-Z][a-z][a-zA-Z0-9]*$")
_DOT_IDENT_RE = re.compile(r"^[a-zA-Z_]\w*(?:\.\w+)+$")
_KEY_COMBO_RE = re.compile(
    r"(?:^|[\s+,/])(?:Alt|Ctrl|Cmd|Shift|Enter|Tab|Esc|Space|Option|Command|"
    r"Control|Delete|Backspace|Return|Home|End|F\d{1,2}|[\u2325\u2318\u2303\u21e7])\b",
    re.IGNORECASE,
)
_KEY_COMBO_SEP_RE = re.compile(r"[+/,]")
_UNIT_ONLY_RE = re.compile(r"^\d+\s*(?:s|ms|px|em|rem|%|MB|GB|KB)$", re.IGNORECASE)
_WHITESPACE_SPLIT_RE = re.compile(r"\s+")
_LETTERS_RE = re.compile(r"[A-Za-z]")


def is_untranslated_cell(cell: str) -> bool:
    """table cell が未翻訳 EN らしいか粗判定する (mjs 等価)。

    複数 fast-path reject (CJK / 数値 / identifier / key-combo / URL 等) を
    通った後、単語数と英字密度で最終判定。
    """
    stripped = strip_markdown(cell).strip()
    if len(stripped) < 20:
        return False
    if _URL_LEADING_RE.match(stripped):
        return False
    if _CODE_LEADING_RE.match(stripped):
        return False
    if _NUMBER_CELL_RE.match(stripped):
        return False
    if _CJK_RE.search(stripped):
        return False
    if _LOWER_IDENT_RE.match(stripped):
        return False
    if _UPPER_IDENT_RE.match(stripped):
        return False
    if _DOT_IDENT_RE.match(stripped):
        return False
    if _KEY_COMBO_RE.search(stripped) and _KEY_COMBO_SEP_RE.search(stripped):
        return False
    if _UNIT_ONLY_RE.match(stripped):
        return False

    words = _WHITESPACE_SPLIT_RE.split(stripped)
    if len(words) < 3:
        return False

    if len(stripped) == 0:
        return False
    letters = "".join(_LETTERS_RE.findall(stripped))
    return len(letters) / len(stripped) > 0.6


# Title H1 + numeric-period normalization + EN artifact strip
_H1_LINE_RE = re.compile(r"^# ")
_ORDERED_PERIOD_NON_DIGIT_RE = re.compile(r"^\d+\.\D")
_ORDERED_SUBSTEP_RE = re.compile(r"^\d+\.\d+\.")
_ORDERED_PERIOD_INSERT_RE = re.compile(r"^(\d+)\.(\S)")
_ZERO_WIDTH_RE = re.compile(r"[\u200b\u200c\u200d\ufeff]")
_WRAPPING_FENCE_RE = re.compile(r"^```\w*\n([\s\S]*)\n```\s*$")


def strip_title_h1(body: str) -> str:
    """最初の H1 を空行に、残りの H1 を H2 に降格する (mjs 等価)。"""
    first_h1_skipped = False
    out: list[str] = []
    for line in body.split("\n"):
        if not _H1_LINE_RE.match(line):
            out.append(line)
            continue
        if not first_h1_skipped:
            first_h1_skipped = True
            out.append("")
        else:
            out.append(_H1_LINE_RE.sub("## ", line, count=1))
    return "\n".join(out)


def normalize_numeric_period_spacing(body: Any) -> Any:
    """``1.foo`` → ``1. foo`` の 1 文字 space 挿入 (mjs 等価)。

    sub-step (``1.1.``) / decimal (``1.0``) は触らない。body が str でなければ
    そのまま返す (mjs ``typeof body !== 'string'`` 等価)。
    """
    if not isinstance(body, str):
        return body
    lines = body.split("\n")
    processed = [
        _ORDERED_PERIOD_INSERT_RE.sub(r"\1. \2", line)
        if _ORDERED_PERIOD_NON_DIGIT_RE.match(line) and not _ORDERED_SUBSTEP_RE.match(line)
        else line
        for line in lines
    ]
    return "\n".join(processed)


def normalize_en_artifacts(body: str) -> str:
    """EN MadCap artifact を除去する (mjs ``normalizeEnArtifacts`` 等価)。

    処理順:

    1. wrapping code fence が body 全体を囲んでいれば中身を取り出す
    2. 各行の zero-width 空白を除去
    3. ``1.foo`` に space を挿入 (``normalize_numeric_period_spacing`` と同等の
       pattern。EN 側のみ適用するため normalize 関数を share せず inline で書く)
    4. zero-width 除去後に空行化した行を drop
    5. 末尾 backslash を trim
    6. 末尾改行を 1 つ保証する
    """
    normalized = body
    wrapping = _WRAPPING_FENCE_RE.match(normalized.strip())
    if wrapping:
        normalized = wrapping.group(1)

    processed: list[str] = []
    for original_line in normalized.split("\n"):
        line = _ZERO_WIDTH_RE.sub("", original_line)

        if _ORDERED_PERIOD_NON_DIGIT_RE.match(line) and not _ORDERED_SUBSTEP_RE.match(line):
            line = _ORDERED_PERIOD_INSERT_RE.sub(r"\1. \2", line)

        if len(line.strip()) == 0 and original_line != line and len(original_line.strip()) > 0:
            continue

        if line.endswith("\\"):
            line = line[:-1].rstrip()

        processed.append(line)

    result = "\n".join(processed)
    return result if result.endswith("\n") else result + "\n"


# GFM pipe table 抽出
_GFM_TABLE_SEPARATOR_RE = re.compile(r"^\|(?:\s*:?-{1,}:?\s*\|)+$")
_UNESCAPED_PIPE_SPLIT_RE = re.compile(r"(?<!\\)\|")
_UNESCAPED_PIPE_TAIL_RE = re.compile(r"(?<!\\)\|\s*$")


def _is_gfm_table_candidate_line(trimmed: str) -> bool:
    """GFM table row candidate (先頭 ``|`` + unescaped ``|`` 終端 + 非空内容)。"""
    if not trimmed.startswith("|"):
        return False
    if not _UNESCAPED_PIPE_TAIL_RE.search(trimmed):
        return False
    last_pipe = trimmed.rfind("|")
    inner = trimmed[1:last_pipe]
    return len(inner.strip()) > 0


def _split_gfm_table_cells(trimmed: str) -> list[str]:
    """GFM table row の cell 列を返す (unescape + trim)。"""
    last_pipe = trimmed.rfind("|")
    inner = trimmed[1:last_pipe]
    cells = _UNESCAPED_PIPE_SPLIT_RE.split(inner)
    return [cell.strip().replace("\\|", "|") for cell in cells]


def extract_markdown_tables(body: str) -> list[dict[str, Any]]:
    """GFM pipe table を ``[{rows, line}]`` で抽出する (mjs 等価)。

    separator 行 (``| --- |``) が無い candidate は table 扱いしない (GFM §tables
    extension の要件)。
    """
    lines = body.split("\n")
    tables: list[dict[str, Any]] = []
    in_code_block = False

    pending: dict[str, Any] | None = None
    confirmed: dict[str, Any] | None = None

    for index, line in enumerate(lines):
        if FENCE_LINE_RE.match(line):
            in_code_block = not in_code_block
            pending = None
            if confirmed is not None:
                tables.append(confirmed)
                confirmed = None
            continue
        if in_code_block:
            continue

        trimmed = line.strip()

        if _GFM_TABLE_SEPARATOR_RE.match(trimmed):
            if pending and len(pending["rows"]) >= 1:
                confirmed = {
                    "rows": list(pending["rows"]),
                    "line": pending["startIndex"] + 1,
                }
                pending = None
            else:
                pending = None
            continue

        if _is_gfm_table_candidate_line(trimmed):
            cells = _split_gfm_table_cells(trimmed)
            if confirmed is not None:
                # python-reviewer MEDIUM: ``confirmed`` は GFM table を累積する
                # accumulator。loop 内で rows を append するのは mjs state machine
                # と 1:1 対応した accumulator pattern。``confirmed`` は table が
                # close する (else 分岐 line 782) まで外部に露出しないため mutation
                # による aliasing は発生しない。
                confirmed["rows"].append(cells)
                continue
            if pending is None:
                pending = {"rows": [], "startIndex": index}
            pending["rows"].append(cells)
            continue

        pending = None
        if confirmed is not None:
            tables.append(confirmed)
            confirmed = None

    if confirmed is not None:
        tables.append(confirmed)

    return tables


# HTML table 抽出
_HTML_TABLE_RE = re.compile(r"<table\b[^>]*>([\s\S]*?)</table>", re.IGNORECASE)
_HTML_TR_RE = re.compile(r"<tr\b[^>]*>([\s\S]*?)</tr>", re.IGNORECASE)
_HTML_CELL_RE = re.compile(r"<(?:td|th)\b[^>]*>([\s\S]*?)</(?:td|th)>", re.IGNORECASE)
_HTML_TAG_STRIP_RE = re.compile(r"<[^>]*>")
_HTML_WHITESPACE_RUN_RE = re.compile(r"\s+")
_HTML_CODE_RE = re.compile(r"<code\b[^>]*>([\s\S]*?)</code>", re.IGNORECASE)
_HTML_A_RE = re.compile(r"<a\b[^>]*\bhref\s*=\s*\"([^\"]*)\"[^>]*>([\s\S]*?)</a>", re.IGNORECASE)


def _html_code_replace(match: re.Match[str]) -> str:
    content = match.group(1)
    stripped = _HTML_TAG_STRIP_RE.sub("", content)
    normalized = _HTML_WHITESPACE_RUN_RE.sub(" ", stripped).strip()
    return f"`{normalized}`"


def _html_a_replace(match: re.Match[str]) -> str:
    href = match.group(1)
    text = _HTML_TAG_STRIP_RE.sub("", match.group(2))
    return f"{text} [{href}]"


def extract_html_tables(body: str) -> list[dict[str, Any]]:
    """``<table>`` block を ``[{rows, line}]`` で抽出する (mjs 等価)。

    ``<code>`` は backtick、``<a href>`` は ``text [href]`` に置換してから
    tag strip する。行番号は body 先頭からの ``\\n`` 数 + 1。
    """
    tables: list[dict[str, Any]] = []

    for match in _HTML_TABLE_RE.finditer(body):
        table_html = match.group(1)
        line = body[: match.start()].count("\n") + 1
        rows: list[list[str]] = []

        for row_match in _HTML_TR_RE.finditer(table_html):
            cells: list[str] = []
            for cell_match in _HTML_CELL_RE.finditer(row_match.group(1)):
                cell_html = cell_match.group(1)
                cell_html = _HTML_CODE_RE.sub(_html_code_replace, cell_html)
                cell_html = _HTML_A_RE.sub(_html_a_replace, cell_html)
                cell_html = _HTML_TAG_STRIP_RE.sub("", cell_html).strip()
                cells.append(cell_html)
            if len(cells) > 0:
                rows.append(cells)

        if len(rows) > 0:
            tables.append({"rows": rows, "line": line})

    return tables


def extract_table_structure(body: str) -> list[dict[str, Any]]:
    """Markdown + HTML table を line 順で結合する (mjs 等価)。"""
    combined = [*extract_markdown_tables(body), *extract_html_tables(body)]
    combined.sort(key=lambda table: table["line"])
    return combined


# EN artifact 検出
_DETAILS_TAG_RE = re.compile(r"<details\b", re.IGNORECASE)
_FENCE_LINE_START_RE = re.compile(r"^```")


def detect_en_artifacts(en_body: str) -> list[str]:
    """EN MadCap 由来の artifact を検出する (mjs 等価)。

    現状は 2 種類の hint:

    - ``<details>`` タグの使用
    - body の 50% 超が code fence 内
    """
    artifacts: list[str] = []
    if _DETAILS_TAG_RE.search(en_body):
        artifacts.append("EN uses <details> blocks")

    lines = en_body.split("\n")
    fence_depth = 0
    fenced_lines = 0
    for line in lines:
        if _FENCE_LINE_START_RE.match(line.strip()):
            fence_depth = 1 if fence_depth == 0 else 0
        elif fence_depth > 0:
            fenced_lines += 1

    if fenced_lines > len(lines) * 0.5:
        artifacts.append("EN body largely wrapped in code fence")

    return artifacts


__all__ = [
    "classify_line",
    "detect_en_artifacts",
    "extract_bullet_counts",
    "extract_callout_positions",
    "extract_heading_sequence",
    "extract_html_tables",
    "extract_image_sequence",
    "extract_invariant_tokens",
    "extract_markdown_tables",
    "extract_paragraph_counts",
    "extract_step_counts",
    "extract_table_structure",
    "is_untranslated_cell",
    "normalize_en_artifacts",
    "normalize_numeric_period_spacing",
    "strip_markdown",
    "strip_title_h1",
]
