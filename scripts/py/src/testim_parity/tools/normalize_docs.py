"""``scripts/tools/normalize_docs.mjs`` の Python port。

JA translation の用語揺れを正規化する in-place 変換:

- Testim 関連英語用語の JA 訳 → 英語表記に統一 (``Testim拡張機能`` →
  ``Testim Extension`` 等)
- frontmatter 項目を固定順序に並べ直す (title / description / category /
  order / updated / sourceUrl / keywords / hero / その他)
- ``description`` が空または ``原文:`` prefix だけのときは本文から 120 字 fallback
- ``sourceUrl`` 不在ページは ``scripts/url_mapping.json`` から補完

``--section=<name>`` で sidebar section 単位のフィルタ可。
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

from ..markdown_utils import generate_description
from ..project import DOCS_DIR, ROOT_DIR, file_path_to_slug, find_md_files
from ..sidebar import get_section_slug_set

__all__ = ["main", "normalize_file", "normalize_value"]


# mjs と同順序で置換する (後方のパターンに先に match されないよう長い順)。
_REPLACEMENTS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"Tricentis Testim拡張機能"), "Tricentis Testim Extension"),
    (re.compile(r"Testim拡張機能"), "Testim Extension"),
    (re.compile(r"Testimビジュアルエディタ(?:ー)?"), "Testim Visual Editor"),
    (re.compile(r"Testim ビジュアルエディタ(?:ー)?"), "Testim Visual Editor"),
    (re.compile(r"ビジュアルエディタ(?:ー)?"), "Visual Editor"),
    (re.compile(r"エージェント型テスト自動化"), "Agentic Test Automation"),
]

_FRONTMATTER_ORDER: tuple[str, ...] = (
    "title",
    "description",
    "category",
    "order",
    "updated",
    "sourceUrl",
    "keywords",
    "hero",
)

_UNTRANSLATED_PREFIX_RE = re.compile(r"^原文:\s*", re.UNICODE)


def normalize_value(value: Any) -> Any:
    """string / list / dict を再帰的に REPLACEMENTS で正規化する。"""
    if isinstance(value, list):
        return [normalize_value(item) for item in value]
    if isinstance(value, dict):
        return {k: normalize_value(v) for k, v in value.items()}
    if not isinstance(value, str):
        return value
    result = value
    for pattern, replacement in _REPLACEMENTS:
        result = pattern.sub(replacement, result)
    return result


def _order_frontmatter(data: dict[str, Any]) -> dict[str, Any]:
    """固定順序 + 残りは insertion 順で frontmatter dict を組み直す。"""
    ordered: dict[str, Any] = {}
    for key in _FRONTMATTER_ORDER:
        if key in data and data[key] is not None:
            ordered[key] = data[key]
    for k, v in data.items():
        if k not in ordered:
            ordered[k] = v
    return ordered


def _parse_frontmatter(raw: str) -> tuple[dict[str, Any], str]:
    """``python-frontmatter`` 経由で gray-matter 等価の split。"""
    import frontmatter

    post = frontmatter.loads(raw)
    data = dict(post.metadata) if post.metadata else {}
    return data, post.content


def _stringify_frontmatter(data: dict[str, Any], content: str) -> str:
    """gray-matter stringify 等価。

    ``python-frontmatter.dumps(post, sort_keys=False)`` で insertion 順を保持
    した YAML を生成する。末尾 newline も dumps が付けるのでそのまま返す。
    """
    import frontmatter

    post = frontmatter.Post(content)
    post.metadata = data
    return str(frontmatter.dumps(post, sort_keys=False)) + "\n"


def normalize_file(file_path: Path, url_mappings: dict[str, Any]) -> bool:
    """1 file を正規化。書き換えが発生したら True。"""
    slug = file_path_to_slug(file_path, DOCS_DIR)
    raw = file_path.read_text(encoding="utf-8")
    data, content = _parse_frontmatter(raw)

    if not data.get("sourceUrl") and url_mappings.get(slug):
        data["sourceUrl"] = url_mappings[slug].get("new_url")

    title_value = data.get("title") or slug.replace("-", " ")
    data["title"] = normalize_value(title_value)

    description = data.get("description")
    if (
        isinstance(description, str)
        and description.strip()
        and not _UNTRANSLATED_PREFIX_RE.match(description)
    ):
        data["description"] = normalize_value(description.strip())
    else:
        data["description"] = generate_description(data["title"], content)

    data["category"] = normalize_value(data.get("category"))
    keywords = data.get("keywords")
    data["keywords"] = normalize_value(keywords) if isinstance(keywords, list) else []

    content = normalize_value(content)

    next_raw = _stringify_frontmatter(_order_frontmatter(data), content.rstrip() + "\n")
    if next_raw != raw:
        file_path.write_text(next_raw, encoding="utf-8")
        return True
    return False


def main(argv: list[str] | None = None) -> int:
    """CLI エントリポイント。exit code は常に 0 (非致命的)。"""
    parser = argparse.ArgumentParser(
        description="Normalize JA doc frontmatter + glossary term shifts"
    )
    parser.add_argument(
        "--section",
        default=None,
        help="sidebar section 単位で対象 slug を絞る (SIDEBAR_URLS.md)",
    )
    args = parser.parse_args(argv)

    slug_set = get_section_slug_set(args.section) if args.section else None
    files = [
        p
        for p in find_md_files(DOCS_DIR)
        if slug_set is None or file_path_to_slug(p, DOCS_DIR) in slug_set
    ]

    url_mappings: dict[str, Any] = {}
    mapping_path = ROOT_DIR / "scripts" / "url_mapping.json"
    if mapping_path.exists():
        try:
            payload = json.loads(mapping_path.read_text(encoding="utf-8"))
            url_mappings = payload.get("mappings") or {}
        except (OSError, json.JSONDecodeError) as err:
            print(f"normalize_docs: failed to load url_mapping.json: {err}", file=sys.stderr)
            print("URL-based normalization will be skipped for all files.", file=sys.stderr)

    changed = 0
    for file_path in files:
        if normalize_file(file_path, url_mappings):
            changed += 1
            try:
                rel = file_path.relative_to(ROOT_DIR)
            except ValueError:
                rel = file_path
            print(f"✓ Normalized {rel}")

    print(f"Normalized {changed} file(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
