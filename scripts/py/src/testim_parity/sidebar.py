"""サイドバー section パーサ。

``scripts/lib/sidebar.mjs`` の port。``docs/SIDEBAR_URLS.md`` を section のリストに
パースし、各 section に順序付き page item (status indicator + canonical URL) を
持たせる。
"""

from __future__ import annotations

import re
import unicodedata
from pathlib import Path

from .madcap_toc import extract_slug

_ROOT_FROM_SRC = Path(__file__).resolve().parents[4]
SIDEBAR_URLS_PATH: Path = _ROOT_FROM_SRC / "docs" / "SIDEBAR_URLS.md"

# 旧 JP ラベル → 現行ラベル。rename された section を後方互換で解決するため。
_SECTION_ALIASES: dict[str, str] = {
    "テスト結果": "結果",
    "管理者機能": "管理",
}

_HEADING_RE = re.compile(r"^##\s+(.+?)\s*$")
_ITEM_RE = re.compile(
    r"^\-\s*(✅🔍|✅|⏳)\s+(https://docs\.tricentis\.com/testim/content/[^\s]+\.htm)\s*$"
)
_SPLIT_TITLE_RE = re.compile(r"^(.+?)(?:[（(]([^）)]+)[）)])?$")

_NON_SECTION_HEADINGS: frozenset[str] = frozenset(
    {"翻訳ステータス", "検証ステータス", "URL抽出方法"}
)


def _normalize_section_key(value: object) -> str:
    s = "" if value is None else str(value)
    s = unicodedata.normalize("NFKC", s)
    # mjs 契約: ``[()]`` の両方を全角開き括弧 ``（`` に畳む。続く ``[）]`` →
    # ``）`` 置換は mjs では自己置換の no-op。港の paren を左開きに合わせる
    # ことで ``"Section (label)"`` と ``"Section （label）"`` が同一正規形に揃う。
    s = s.replace("(", "（").replace(")", "（")
    s = re.sub(r"\s+", " ", s).strip().lower()
    return s


def _split_section_title(raw_title: str) -> tuple[str, str]:
    match = _SPLIT_TITLE_RE.match(raw_title)
    english = (match.group(1) if match else raw_title).strip()
    japanese = (match.group(2) if match and match.group(2) else "").strip()
    return english, japanese


def parse_sidebar_sections(sidebar_text: str) -> list[dict[str, object]]:
    """``docs/SIDEBAR_URLS.md`` の markdown 本文をパースする。"""
    sections: list[dict[str, object]] = []
    current: dict[str, object] | None = None

    # mjs は ``/\r?\n/`` で分割するため CRLF / LF 双方に対応する。
    for line in re.split(r"\r?\n", sidebar_text):
        heading_match = _HEADING_RE.match(line)
        if heading_match:
            raw_title = heading_match.group(1).strip()
            if raw_title in _NON_SECTION_HEADINGS:
                current = None
                continue
            english, japanese = _split_section_title(raw_title)
            current = {
                "rawTitle": raw_title,
                "english": english,
                "japanese": japanese,
                "items": [],
            }
            sections.append(current)
            continue

        item_match = _ITEM_RE.match(line)
        if item_match and current is not None:
            url = item_match.group(2)
            items: list[dict[str, object]] = current["items"]  # type: ignore[assignment]
            items.append(
                {
                    "status": item_match.group(1),
                    "url": url,
                    "slug": extract_slug(url),
                }
            )

    return sections


def load_sidebar_sections(sidebar_path: Path | str = SIDEBAR_URLS_PATH) -> list[dict[str, object]]:
    """sidebar markdown ファイルをディスクから読んでパースする。"""
    text = Path(sidebar_path).read_text(encoding="utf-8")
    return parse_sidebar_sections(text)


def find_sidebar_section(
    sections: list[dict[str, object]], section_name: str | None
) -> dict[str, object] | None:
    """English / Japanese / raw title で section を検索し、alias fallback も試みる。"""
    if not section_name:
        return None
    target = _normalize_section_key(section_name)
    for section in sections:
        candidates = [
            section.get("rawTitle"),
            section.get("english"),
            section.get("japanese"),
        ]
        if any(_normalize_section_key(c) == target for c in candidates if c):
            return section
    alias = _SECTION_ALIASES.get(section_name.strip())
    if alias:
        return find_sidebar_section(sections, alias)
    return None


def get_section_slug_set(
    section_name: str, sections: list[dict[str, object]] | None = None
) -> set[str]:
    """指定 section の slug 集合を返す。未登録 section は ``ValueError`` を送出する。"""
    secs = sections if sections is not None else load_sidebar_sections()
    section = find_sidebar_section(secs, section_name)
    if not section:
        known = ", ".join(str(s.get("rawTitle", "")) for s in secs)
        raise ValueError(f'Unknown section "{section_name}". Known sections: {known}')
    items: list[dict[str, object]] = section["items"]  # type: ignore[assignment]
    return {str(item["slug"]) for item in items if item.get("slug")}


def extract_japanese_label(section_title: str) -> str:
    """bilingual な section title から括弧内の日本語ラベルを抽出する。"""
    match = re.search(r"[（(]([^）)]+)[）)]", section_title)
    return (match.group(1) if match else section_title).strip()


def filter_items_by_section(
    items: list[dict[str, object]],
    section_name: str | None,
    sections: list[dict[str, object]] | None = None,
) -> list[dict[str, object]]:
    """フラットな item 一覧を ``section_name`` に属するものだけに絞り込む。"""
    if not section_name:
        return items
    slug_set = get_section_slug_set(section_name, sections)
    return [item for item in items if item.get("slug") in slug_set]


__all__ = [
    "SIDEBAR_URLS_PATH",
    "parse_sidebar_sections",
    "load_sidebar_sections",
    "find_sidebar_section",
    "get_section_slug_set",
    "extract_japanese_label",
    "filter_items_by_section",
]
