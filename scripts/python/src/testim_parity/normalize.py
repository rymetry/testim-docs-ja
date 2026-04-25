"""parity 比較のための URL 書き換えルール。

``scripts/lib/parity_normalize.mjs`` の port。EN/JA 間の localized link の差分が
false な segment-token-gap を生まないよう、URL トークンを決定論的に正規化する。
"""

from __future__ import annotations

import re

_HELP_TESTIM_PREFIX_RE = re.compile(r"^(?:https?://)?help\.testim\.io")
# /docs/... path の canonical 形:
#   group 1: path (trailing slash / query / fragment を含まない)
#   group 2: 任意の ?query (canonicalize 時に破棄、保持しない)
#   group 3: 任意の #fragment (保持)
_DOCS_PATH_RE = re.compile(r"^(/docs/[^\s)?#]+?)/?(\?[^\s)#]*)?(#[^\s)]*)?$")
# docs.tricentis.com/testim/content/{category}/{slug}.htm — canonical repo URL 形式。
# legacy な /Topics/Help/ URL もここで match し、literal path へ変換される。
_TRICENTIS_DOCS_RE = re.compile(
    r"^https?://docs\.tricentis\.com/testim/content/(.+?)\.htm(#[^\s)]*)?$"
)


def normalize_url_for_parity(url: str) -> str:
    """``url`` を parity 比較用の正規形へ変換する。

    冪等性 (2 回適用しても 1 回と同じ結果)。mjs 挙動互換のため非文字列はそのまま返す。
    """
    if not isinstance(url, str) or len(url) == 0:
        return url

    tricentis_match = _TRICENTIS_DOCS_RE.match(url)
    if tricentis_match:
        # 末尾 /index は落として /foo/index.htm → /docs/foo (directory root) とする
        path = re.sub(r"/index$", "", tricentis_match.group(1))
        fragment = tricentis_match.group(2) or ""
        return f"/docs/{path}{fragment}"

    stripped = _HELP_TESTIM_PREFIX_RE.sub("", url)
    docs_match = _DOCS_PATH_RE.match(stripped)
    if docs_match:
        path = docs_match.group(1)
        fragment = docs_match.group(3) or ""
        return f"{path}{fragment}"

    return url


def canonicalize_docs_url(url: str) -> str:
    """:func:`normalize_url_for_parity` のエイリアス。mjs API 互換のため残している。"""
    return normalize_url_for_parity(url)


def normalize_segment_tokens(tokens: list[str] | None) -> list[str]:
    """各トークンに :func:`normalize_url_for_parity` を適用し、順序保持で dedup する。

    JS ``Array.isArray`` の挙動に合わせ、:class:`list` 以外 (tuple / set /
    generator / str) は拒否して ``[]`` を返す。
    """
    if not isinstance(tokens, list):
        return []
    seen: set[str] = set()
    out: list[str] = []
    for token in tokens:
        normalized = normalize_url_for_parity(token)
        if normalized not in seen:
            seen.add(normalized)
            out.append(normalized)
    return out
