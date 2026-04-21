"""``scripts/pipeline/generate_untranslated_placeholders.mjs`` の Python port。

``SIDEBAR_URLS.md`` の ``⏳`` マーク (未翻訳) page に対して、最小 placeholder
markdown を ``src/content/docs/<category>/<slug>.md`` に書き出す。既存 file は
上書きしない。
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path

from ..project import DOCS_DIR, ROOT_DIR, to_kebab
from ..sidebar import get_section_slug_set, parse_sidebar_sections

__all__ = ["main"]


_SIDEBAR_FILE: Path = ROOT_DIR / "docs" / "SIDEBAR_URLS.md"


def _title_case_from_slug(slug: str) -> str:
    return " ".join(w.capitalize() for w in slug.split("-") if w)


def main(argv: list[str] | None = None) -> int:
    """CLI エントリポイント (exit code: 0 成功 / 1 sidebar 不在)。"""
    parser = argparse.ArgumentParser(description="Generate untranslated page placeholders")
    parser.add_argument("--section", default=None, help="sidebar section で絞り込み")
    args = parser.parse_args(argv)

    if not _SIDEBAR_FILE.exists():
        print(f"Missing file: {_SIDEBAR_FILE}", file=sys.stderr)
        return 1

    raw = _SIDEBAR_FILE.read_text(encoding="utf-8")
    categories = parse_sidebar_sections(raw)
    section_slugs = get_section_slug_set(args.section, categories) if args.section else None

    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    today_str = datetime.now().strftime("%Y-%m-%d")

    created = 0
    created_paths: list[str] = []

    for cat in categories:
        items = cat.get("items")
        if not items or not isinstance(items, list):
            continue
        english = str(cat.get("english", ""))
        japanese = str(cat.get("japanese") or english)
        category_folder = to_kebab(english)
        category_dir = DOCS_DIR / category_folder
        category_dir.mkdir(parents=True, exist_ok=True)

        order = 0
        for item in items:
            order += 1
            if item.get("status") != "⏳":
                continue
            slug = str(item.get("slug", ""))
            if section_slugs is not None and slug not in section_slugs:
                continue

            basename_slug = slug.split("/")[-1] if "/" in slug else slug
            file_path = category_dir / f"{basename_slug}.md"
            if file_path.exists():
                continue

            title_text = f"【翻訳中】{_title_case_from_slug(basename_slug)}"
            description = (
                f"{_title_case_from_slug(basename_slug)} の日本語ドキュメントを準備しています。"
            )
            keywords = [basename_slug, to_kebab(english), "testim"]
            url = item.get("url", "")

            fm_lines = [
                "---",
                f"title: '{title_text}'",
                f"description: '{description}'",
                f"category: '{japanese}'",
                f"order: {order}",
                f"updated: '{today_str}'",
                f"sourceUrl: '{url}'",
                "keywords:",
                *[f"  - {k}" for k in keywords],
                "---",
                "",
            ]

            body_lines = [
                ':::note{title="翻訳ステータス"}',
                "このページの日本語翻訳は準備中です。原文をご参照ください。",
                "",
                f"[原文ページ]({url})",
                ":::",
                "",
                "## 概要",
                "本文の翻訳は今後追加されます。翻訳の優先度や疑問点があれば Issue でお知らせください。",  # noqa: E501
                "",
            ]

            file_path.write_text("\n".join(fm_lines) + "\n".join(body_lines), encoding="utf-8")
            created += 1
            try:
                created_paths.append(str(file_path.relative_to(ROOT_DIR)))
            except ValueError:
                created_paths.append(str(file_path))

    print(f"Created {created} placeholder files.")
    for p in created_paths[:30]:
        print(f"- {p}")
    if len(created_paths) > 30:
        print(f"...and {len(created_paths) - 30} more")
    return 0


if __name__ == "__main__":
    sys.exit(main())
