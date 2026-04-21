"""EN HTML 前処理 — ``scripts/lib/turndown.mjs`` の ``preprocessEnHtml`` を port。

**設計: 文字列 → 文字列**。mjs と同じく regex ベースの preprocessor で、出力は
正規化済み HTML 文字列。BS4 パースは呼び出し側 (``segments_en.py`` の
extractor) で 1 回だけ行う。こうすることで:

- mjs と byte-identical な出力を得られ、conformance harness で直接比較できる
- BS4 パース回数を 1 回に抑えられる (preprocess + extract で 2 回パースしない)

処理順序 (冪等。mjs と同一):

1. ``_normalize_escaped_callouts`` — ``<p>&gt; Title &gt; &gt; Content</p>``
   を ``<div class="note"><p>Content</p></div>`` に書き換え
2. ``_normalize_escaped_faq_details`` — ``&lt;details&gt;...&lt;/details&gt;``
   の broken escaped tree を valid ``<h2>/<p>`` sibling block に再構成
3. ``_unescape_details`` — ``<p>&lt;details&gt;...&lt;/details&gt;</p>`` の
   legacy single-``<p>`` ケースを real ``<details>`` に復元
4. ``apply_en_source_patches`` — slug-scope literal find→replace (``slug`` 指定時)

``slug`` が未指定 / 空文字のときは step 4 を skip する (internal 再帰呼び出しや
usability 側は raw を観察する mjs 互換動作)。
"""

from __future__ import annotations

import re
from typing import Any

from .en_source_patches import apply_en_source_patches

__all__ = ["preprocess_en_html"]


# ``<p ...>...</p>`` を取り出す非貪欲パターン。mjs の regex をそのまま踏襲。
# JS flags ``gi`` = Python ``IGNORECASE`` + finditer/sub (global はデフォルト)。
# ``[\s\S]`` は Python では ``.`` + ``re.DOTALL`` と等価だが、mjs 式を崩さず
# そのまま使う方が eyeball で mjs と対応を取りやすい。
_P_BLOCK_RE = re.compile(r"<p\b[^>]*>([\s\S]*?)</p>", re.IGNORECASE)

# truncated attribute 検出。value 内の ``>`` で tag が切れたケースの guard
# (mjs ``hasTruncatedAttribute`` と同一)。
_TRUNCATED_ATTR_RE = re.compile(r'^[^<]*">')


def _has_truncated_attribute(inner_html: str) -> bool:
    return bool(_TRUNCATED_ATTR_RE.match(inner_html))


# --- 1. normalize_escaped_callouts ----------------------------------------

# Title の直後にある ``&gt; &gt;`` 区切り。mjs ``sepMatch`` と同じ意味。
_CALLOUT_SEP_RE = re.compile(r"&gt;\s*&gt;")


def _normalize_escaped_callouts(html: str) -> str:
    """``<p>&gt; Title &gt; &gt; Body</p>`` → ``<div class="note"><p>Body</p></div>``。

    MadCap 由来の escaped callout pattern。本文の ``>`` と誤認しないよう、
    ``&gt;`` が ``<p>`` の先頭 (空白のみ先行) にある時だけ書き換える。
    Title は JA 側 ``:::note`` が title を持たないため意図的に drop する。
    """

    def sub(match: re.Match[str]) -> str:
        full_match = match.group(0)
        inner = match.group(1)
        if _has_truncated_attribute(inner):
            return full_match
        first_gt = inner.find("&gt;")
        if first_gt == -1:
            return full_match
        # 先頭に substantive text があれば本物の callout ではない
        text_before = inner[:first_gt].strip()
        if text_before:
            return full_match
        after_opening = inner[first_gt + 4 :]
        sep_match = _CALLOUT_SEP_RE.search(after_opening)
        if not sep_match:
            return full_match
        sep_abs_index = first_gt + 4 + sep_match.start()
        body = inner[sep_abs_index + len(sep_match.group(0)) :].strip()
        if not body:
            return full_match
        return f'<div class="note"><p>{body}</p></div>'

    return _P_BLOCK_RE.sub(sub, html)


# --- 2. normalize_escaped_faq_details --------------------------------------

_DETAILS_OPEN_RE = re.compile(r"&lt;details(\b[^&]*)?&gt;", re.IGNORECASE)
_DETAILS_CLOSE_RE = re.compile(r"&lt;/details&gt;", re.IGNORECASE)
_ESCAPED_TAG_RE = re.compile(r"&lt;/?[a-z][^&]*&gt;", re.IGNORECASE)
_WHITESPACE_RUN_RE = re.compile(r"\s+")

# case A: ``<p>&lt;details&gt; ... &lt;summary&gt;Q&lt;/summary&gt;`` opener
_CASE_A_RE = re.compile(
    r"<p(\b[^>]*)>\s*&lt;details(?:\b[^&]*)?&gt;\s*&lt;summary&gt;\s*"
    r"(?:&lt;b(?:\b[^&]*)?&gt;)?\s*([\s\S]*?)\s*(?:&lt;/b&gt;)?\s*&lt;/summary&gt;\s*",
    re.IGNORECASE,
)

# case B: ``<p>&lt;/details&gt; &lt;details&gt; ... &lt;summary&gt;Q&lt;/summary&gt;``
_CASE_B_RE = re.compile(
    r"<p(\b[^>]*)>\s*&lt;/details&gt;\s*&lt;details(?:\b[^&]*)?&gt;\s*"
    r"&lt;summary&gt;\s*(?:&lt;b(?:\b[^&]*)?&gt;)?\s*([\s\S]*?)\s*"
    r"(?:&lt;/b&gt;)?\s*&lt;/summary&gt;\s*",
    re.IGNORECASE,
)

# case C: 同 ``<p>`` 内 mid-paragraph boundary
_CASE_C_RE = re.compile(
    r"&lt;/details&gt;\s*&lt;details(?:\b[^&]*)?&gt;\s*&lt;summary&gt;\s*"
    r"(?:&lt;b(?:\b[^&]*)?&gt;)?\s*([\s\S]*?)\s*(?:&lt;/b&gt;)?\s*&lt;/summary&gt;\s*",
    re.IGNORECASE,
)

# 残存 close marker 掃除用
_TRAILING_CLOSE_P_RE = re.compile(r"<p\b[^>]*>\s*&lt;/details&gt;\s*</p>", re.IGNORECASE)
_EMPTY_P_RE = re.compile(r"<p\b[^>]*>\s*</p>", re.IGNORECASE)


def _extract_heading(summary_inner: str) -> str:
    """summary inner から escaped HTML tag を除去し、空白を 1 文字に正規化。"""
    stripped = _ESCAPED_TAG_RE.sub("", summary_inner)
    return _WHITESPACE_RUN_RE.sub(" ", stripped).strip()


def _p_open(attrs: str) -> str:
    return f"<p{attrs or ''}>"


def _normalize_escaped_faq_details(html: str) -> str:
    """``faq`` の broken escaped details tree を valid ``<h2>/<p>`` block へ。

    discriminator (2 段階):

    1. ``&lt;details&gt;`` の open / close 件数が一致していること (不均衡な
       ページは source-unusable 経路に任せる)
    2. 先頭 trimmed が ``&lt;details&gt;`` で始まる ``<p>`` が存在し、かつ
       その ``<p>`` 内で balanced に閉じていない (= multi-paragraph broken
       tree) こと。legacy single-``<p>`` は後段 ``_unescape_details`` に任せる
    """
    open_count = len(_DETAILS_OPEN_RE.findall(html))
    close_count = len(_DETAILS_CLOSE_RE.findall(html))
    if open_count == 0 or open_count != close_count:
        return html

    first_faq_p: re.Match[str] | None = None
    for pm in _P_BLOCK_RE.finditer(html):
        inner = pm.group(1) or ""
        if inner.strip().startswith("&lt;details&gt;"):
            first_faq_p = pm
            break
    if first_faq_p is None:
        return html

    first_inner = first_faq_p.group(1) or ""
    first_opens = len(_DETAILS_OPEN_RE.findall(first_inner))
    first_closes = len(_DETAILS_CLOSE_RE.findall(first_inner))
    if first_opens == first_closes:
        return html

    out = html

    def case_ab(match: re.Match[str]) -> str:
        attrs, heading_inner = match.group(1), match.group(2)
        return f"<h2>{_extract_heading(heading_inner)}</h2>{_p_open(attrs)}"

    out = _CASE_A_RE.sub(case_ab, out)
    out = _CASE_B_RE.sub(case_ab, out)

    def case_c(match: re.Match[str]) -> str:
        heading_inner = match.group(1)
        return f"</p><h2>{_extract_heading(heading_inner)}</h2><p>"

    out = _CASE_C_RE.sub(case_c, out)
    out = _TRAILING_CLOSE_P_RE.sub("", out)
    out = _DETAILS_OPEN_RE.sub("", out)
    out = _DETAILS_CLOSE_RE.sub("", out)
    out = _EMPTY_P_RE.sub("", out)
    return out


# --- 3. unescape_details ---------------------------------------------------

_ESCAPED_DETAILS_OPEN_PREFIX = "&lt;details&gt;"
_ESCAPED_DETAILS_CLOSE_PREFIX = "&lt;/details&gt;"


def _unescape_details(html: str) -> str:
    """legacy single-``<p>`` の escaped ``<details>`` を real ``<details>`` に戻す。"""

    def sub(match: re.Match[str]) -> str:
        full_match = match.group(0)
        inner = match.group(1)
        if _has_truncated_attribute(inner):
            return full_match
        trimmed = inner.strip()
        starts_with_open = trimmed.startswith(_ESCAPED_DETAILS_OPEN_PREFIX)
        starts_with_close_and_open = (
            trimmed.startswith(_ESCAPED_DETAILS_CLOSE_PREFIX)
            and _ESCAPED_DETAILS_OPEN_PREFIX in trimmed
        )
        if not (starts_with_open or starts_with_close_and_open):
            return full_match
        # mjs の順序通り: &lt; → <、&gt; → >、&quot; → "、&amp; → & を順次展開
        return (
            trimmed.replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", '"')
            .replace("&amp;", "&")
        )

    return _P_BLOCK_RE.sub(sub, html)


# --- Public entry ---------------------------------------------------------


def preprocess_en_html(
    html: str,
    slug: str | None = None,
    patch_coverage: Any = None,
) -> str:
    """EN snapshot HTML を segment extractor 向けに正規化する。

    chain (idempotent):
        ``_normalize_escaped_callouts`` → ``_normalize_escaped_faq_details``
        → ``_unescape_details`` → ``apply_en_source_patches`` (slug 指定時のみ)

    mjs ``preprocessEnHtml(html, options)`` (turndown.mjs:413) と byte-for-byte
    一致する出力契約。conformance harness で直接比較する。
    """
    if not isinstance(html, str):
        raise TypeError(f"preprocess_en_html expected str, got {type(html).__name__}")
    normalized = _unescape_details(
        _normalize_escaped_faq_details(_normalize_escaped_callouts(html))
    )
    if not slug:
        return normalized
    return apply_en_source_patches(normalized, slug, patch_coverage)
