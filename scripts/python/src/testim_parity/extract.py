"""parity 比較用の invariant-token 抽出 / markdown decoration strip / HTML table 抽出。

``scripts/lib/source_parity_extract.mjs`` の port のうち、HTML 比較経路
(``html_structure`` / ``segments_shared`` / ``markdown_utils``) が依存する部分のみを保持する。
"""

from __future__ import annotations

import re
from typing import Any

from .madcap_toc import extract_slug as _extract_slug_from_url
from .project import build_basename_to_path_map, resolve_to_full_slug

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
# ``<name>`` placeholder (``https://<projectName>.testrail.io/``) は URL の一部として扱う。
# 先に placeholder を試し、それ以外の ``<`` は従来どおり 1 文字として URL に含める。
_URL_RE = re.compile(r"https?://(?:<[\w-]+>|[^\s)>\]])+")
_LINK_DEST_RE = re.compile(
    r"(?:\]\(|(?:^|\s)\[)"
    r"((?:/docs/[\w-]+(?:/[\w-]+)*(?:#[^\]\)\s]+)?"
    r"|https?://[^\s)\]]+"
    r"|[^\s)\]]*\.htm(?:#[^\]\)\s]*)?))"
    r"\]?\)?"
)
_FLAG_RE = re.compile(r"(?:^|\s)(--?[a-zA-Z][\w-]*)(?=\s|:|$)")
_DOT_RE = re.compile(r"\b([a-zA-Z_]\w*(?:\.\w+)+)\b")
_IPV4_CIDR_RE = re.compile(r"(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?:/\d{1,2})?(?![\w./])")
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

    ip_spans: list[tuple[int, int]] = []
    for match in _IPV4_CIDR_RE.finditer(rest):
        token_set.add(match.group(0))
        ip_spans.append((match.start(), match.end()))
    for start, end in reversed(ip_spans):
        rest = _blank_span(rest, start, end)

    for match in _VERSION_RE.finditer(rest):
        token_set.add(match.group(0))

    for match in _NUMBER_UNIT_RE.finditer(rest):
        token_set.add(re.sub(r"\s+", "", match.group(1)))

    for match in _PATH_RE.finditer(rest):
        token_set.add(match.group(1))

    return sorted(token_set)


# ---------------------------------------------------------------------------
# Markdown decoration strip / untranslated cell / HTML table 抽出
# ---------------------------------------------------------------------------

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


__all__ = [
    "extract_html_tables",
    "extract_invariant_tokens",
    "is_untranslated_cell",
    "strip_markdown",
]
