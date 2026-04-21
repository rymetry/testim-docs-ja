"""parity 比較用の invariant-token 抽出。

``scripts/lib/source_parity_extract.mjs`` のトークン抽出部分の port。
コード span・URL・CLI flag・dotted path・version string・数値単位・絶対 path を
EN/JA セグメント alignment の安定アンカー集合として抽出する。mjs 側の残りの関数
(image sequence / callout positions / pipe-table / HTML table) は当面 Node のまま
で、後続 phase で port する。
"""

from __future__ import annotations

import re

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


__all__ = ["extract_invariant_tokens"]
