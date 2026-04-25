"""``scripts/tools/report_frontmatter_categories.mjs`` の Python port。

``src/content/docs/**/*.md`` の frontmatter ``category`` を集計し、
``docs/SIDEBAR_URLS.md`` の section 名と照合して ``Top categories`` や
``Missing category`` / ``Categories only in Markdown frontmatter`` /
``Categories only in SIDEBAR_URLS`` を stdout に出力する。

運用スクリプト — CI gate には使わないため、出力文字列の byte parity は
厳密には不要 (ただし mjs に揃えておくと human diff 時のノイズが減る)。
"""

from __future__ import annotations

import sys
from pathlib import Path

from ..project import DOCS_DIR, SIDEBAR_PATH, find_md_files, read_doc_file
from ..sidebar import extract_japanese_label, load_sidebar_sections

__all__ = ["main"]


def _read_sidebar_categories(sidebar_path: Path = SIDEBAR_PATH) -> set[str]:
    """``SIDEBAR_URLS.md`` から日本語 section 名の集合を返す (mjs 等価)。"""
    if not sidebar_path.exists():
        return set()
    sections = load_sidebar_sections(sidebar_path)
    out: set[str] = set()
    for section in sections:
        raw_title = section.get("rawTitle", "")
        if isinstance(raw_title, str):
            out.add(extract_japanese_label(raw_title))
    return out


def main(argv: list[str] | None = None) -> int:
    """CLI エントリポイント (exit code は常に 0)。"""
    _ = argv  # 引数なし、mjs も引数を取らない

    files = find_md_files(DOCS_DIR)
    category_counts: dict[str, int] = {}
    missing_category: list[str] = []

    for file_path in files:
        try:
            doc = read_doc_file(file_path)
        except Exception as err:  # pragma: no cover - defensive
            print(f"[report-frontmatter] skip {file_path}: {err}", file=sys.stderr)
            continue
        rel = doc.get("relativePath") or str(file_path)
        fm = doc.get("data") or {}
        category = fm.get("category") if isinstance(fm, dict) else None
        if not category or not isinstance(category, str):
            missing_category.append(rel)
            continue
        category_counts[category] = category_counts.get(category, 0) + 1

    print(f"md files: {len(files)}")
    print(f"unique categories: {len(category_counts)}")
    print(f"missing category: {len(missing_category)}")

    sidebar_categories = _read_sidebar_categories()
    print(f"sidebar categories (docs/SIDEBAR_URLS.md): {len(sidebar_categories)}")

    # count 降順。同じ count の場合は insertion order (mjs ``Array.sort`` stable)。
    sorted_counts = sorted(
        category_counts.items(), key=lambda kv: (-kv[1], list(category_counts.keys()).index(kv[0]))
    )

    print("\nTop categories (count, label):")
    for cat, count in sorted_counts[:50]:
        print(f"{count:>3} {cat}")

    if missing_category:
        print("\nMissing category examples:")
        for rel in missing_category[:30]:
            print(f"- {rel}")

    if sidebar_categories:
        md_cats = set(category_counts.keys())
        only_in_md = sorted(md_cats - sidebar_categories)
        only_in_sidebar = sorted(sidebar_categories - md_cats)

        print("\nCategories only in Markdown frontmatter:")
        for c in only_in_md:
            print(f"- {c}")

        print("\nCategories only in SIDEBAR_URLS:")
        for c in only_in_sidebar:
            print(f"- {c}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
