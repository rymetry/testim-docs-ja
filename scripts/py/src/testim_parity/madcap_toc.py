"""MadCap Flare TOC データ取得・解析。

``scripts/lib/madcap_toc.mjs`` の port。WebHelp2 出力の TOC は ``Main.js`` の
tree と、chunk 単位の ``Main_ChunkN.js`` page detail で構成される。
ネットワーク取得パス (``fetch_toc_data``) は今は optional 扱い — 純粋関数部分
(パース系) は conformance harness でテストし、fetch パスは pipeline port 時に
integration test で拾う。
"""

from __future__ import annotations

import json
import re
from collections.abc import Iterable, Iterator
from typing import Any

DEFAULT_BASE_URL = "https://docs.tricentis.com/testim"
TOC_PATH = "Data/Tocs"
DEFAULT_USER_AGENT = "testim-docs-ja-snapshot/1.0"
FETCH_TIMEOUT_S = 30.0

# docs.tricentis.com の .htm content URL を検出する。``g`` フラグ相当は
# ``match_all_tricentis_urls`` 側で扱うため、ここには付けない。
TRICENTIS_URL_RE: re.Pattern[str] = re.compile(
    r"https://docs\.tricentis\.com/testim/content/[^\s]+\.htm"
)

# docs 本文ではなく site-level page に対応する slug (leaf promotion から除外)。
_NON_DOC_SLUGS: frozenset[str] = frozenset({"home"})


def match_all_tricentis_urls(text: str) -> Iterator[re.Match[str]]:
    """``text`` に含まれる Tricentis content URL を全て yield する。"""
    return TRICENTIS_URL_RE.finditer(text)


def parse_amd_module(js_text: str) -> Any:
    """``define({...})`` wrapper を剥がし、内部 object を JSON として解析する。

    MadCap の AMD module は unquoted key と single-quoted string を使うため、
    :func:`json.loads` 前に両方を JSON 互換形式へ書き換える。
    """
    # define(...) wrapper を剥がす
    inner = re.sub(r"^\s*define\s*\(\s*", "", js_text)
    inner = re.sub(r"\s*\)\s*;?\s*$", "", inner)

    # unquoted な property key を quote する
    inner = re.sub(r"([{,])\s*([a-zA-Z_]\w*)\s*:", r'\1"\2":', inner)

    # single-quoted string を double-quoted に寄せる (内側の double quote はエスケープ)
    def _sq_to_dq(match: re.Match[str]) -> str:
        content = match.group(1).replace('"', '\\"')
        return f'"{content}"'

    inner = re.sub(r"'((?:[^'\\]|\\.)*)'", _sq_to_dq, inner)

    try:
        return json.loads(inner)
    except json.JSONDecodeError as exc:
        preview = inner[:200]
        raise ValueError(
            f"parse_amd_module: failed to parse as JSON. Preview: {preview}... Original: {exc.msg}"
        ) from exc


def build_index_lookup(chunk_data_list: Iterable[dict[str, Any]]) -> dict[int, dict[str, str]]:
    """chunk data から ``index → {url, title}`` の逆引き表を構築する。

    section 専用見出しは ``i[]`` と ``t[]`` が複数要素の配列として入ってくるため、
    並行に展開して index 単位でフラット化する。
    """
    lookup: dict[int, dict[str, str]] = {}
    for chunk_data in chunk_data_list:
        for url_path, meta in chunk_data.items():
            if (
                not meta
                or not isinstance(meta.get("i"), list)
                or not isinstance(meta.get("t"), list)
            ):
                # mjs 側は console.warn する。Python では静かに continue (テスト
                # 出力を汚さない)。divergence は conformance harness が検出する。
                continue
            indices = meta["i"]
            titles = meta["t"]
            for k, idx in enumerate(indices):
                title = titles[k] if k < len(titles) else ""
                lookup[idx] = {"url": url_path, "title": title or ""}
    return lookup


def extract_slug(url_path: str) -> str | None:
    """MadCap Flare content URL path から path-based slug を抽出する。

    想定外の形状なら ``None`` を返す。
    """
    match = re.search(r"/content/(.+?)(?:/index)?\.htm$", url_path, flags=re.IGNORECASE)
    return match.group(1).lower() if match else None


def resolve_url(url_path: str, base_url: str = DEFAULT_BASE_URL) -> str:
    """TOC 相対 path を絶対 URL へ変換する。"""
    if url_path.startswith("/"):
        return f"{base_url}{url_path}"
    return f"{base_url}/{url_path}"


def _collect_pages(
    children: list[dict[str, Any]], lookup: dict[int, dict[str, str]]
) -> list[dict[str, Any]]:
    """subtree から page を再帰的に収集する。"""
    pages: list[dict[str, Any]] = []
    for child in children:
        idx = child.get("i")
        if not isinstance(idx, int):
            continue
        info = lookup.get(idx)
        if not info:
            continue
        slug = extract_slug(info["url"])
        self_page = {"title": info["title"], "url": info["url"], "slug": slug}
        pages.append(self_page)
        grand = child.get("n")
        if grand:
            pages.extend(_collect_pages(grand, lookup))
    return pages


def build_sections(tree: dict[str, Any], lookup: dict[int, dict[str, str]]) -> list[dict[str, Any]]:
    """TOC tree を走査し、section ごとの page 一覧へ平坦化する。"""
    raw_sections: list[dict[str, Any]] = []
    child_slugs: set[str] = set()

    for node in tree.get("n", []):
        idx = node.get("i")
        if not isinstance(idx, int):
            continue
        section_info = lookup.get(idx)
        if not section_info:
            continue
        pages = _collect_pages(node.get("n") or [], lookup)
        for page in pages:
            if page.get("slug"):
                child_slugs.add(page["slug"])
        raw_sections.append({"sectionInfo": section_info, "pages": pages})

    promoted_slugs: set[str] = set()
    sections: list[dict[str, Any]] = []

    for raw in raw_sections:
        section_info = raw["sectionInfo"]
        pages = list(raw["pages"])
        # 子を持たない section は leaf promotion: その section page 自身を子扱いで
        # ぶら下げる。ただし home 等の非 docs slug・既に child として登場している
        # slug・他 section で既に promote 済みの slug は除外する。
        if not pages and section_info.get("url"):
            slug = extract_slug(section_info["url"])
            if (
                slug
                and slug not in _NON_DOC_SLUGS
                and slug not in child_slugs
                and slug not in promoted_slugs
            ):
                pages.append(
                    {"title": section_info["title"], "url": section_info["url"], "slug": slug}
                )
                promoted_slugs.add(slug)
        sections.append(
            {"title": section_info["title"], "url": section_info["url"], "pages": pages}
        )

    return sections


def extract_slugs_from_snapshot(sidebar_json: dict[str, Any] | None) -> set[str]:
    """sidebar snapshot JSON から全 page slug を回収する。"""
    slugs: set[str] = set()
    if not sidebar_json or not sidebar_json.get("sections"):
        return slugs
    for section in sidebar_json["sections"]:
        for page in section.get("pages") or []:
            if page.get("slug"):
                slugs.add(page["slug"])
    return slugs


def build_sidebar_snapshot(
    sections: list[dict[str, Any]],
    base_url: str = DEFAULT_BASE_URL,
    *,
    fetched_at: str | None = None,
) -> dict[str, Any]:
    """TOC section 一覧から sidebar JSON snapshot を serialize する。

    ``fetched_at`` は呼び出し側が制御する — mjs のデフォルトは
    ``new Date().toISOString()`` で、parity を取るなら Python 側は
    ``datetime.now(UTC).isoformat(timespec="milliseconds") + "Z"`` 相当を渡す。
    """
    return {
        "fetchedAt": fetched_at or "",
        "baseUrl": base_url,
        "sections": [
            {
                "title": section["title"],
                "pages": [
                    {
                        "slug": page["slug"],
                        "url": resolve_url(page["url"], base_url),
                        "title": page["title"],
                    }
                    for page in section["pages"]
                ],
            }
            for section in sections
        ],
    }


__all__ = [
    "DEFAULT_BASE_URL",
    "TOC_PATH",
    "DEFAULT_USER_AGENT",
    "FETCH_TIMEOUT_S",
    "TRICENTIS_URL_RE",
    "match_all_tricentis_urls",
    "parse_amd_module",
    "build_index_lookup",
    "extract_slug",
    "resolve_url",
    "build_sections",
    "extract_slugs_from_snapshot",
    "build_sidebar_snapshot",
]
