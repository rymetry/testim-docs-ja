"""``scripts/tools/sync_frontmatter_from_sidebar.mjs`` の Python port。

``SIDEBAR_URLS.md`` の順序を権威として、各 markdown の frontmatter
``category`` / ``order`` を同期する。``--apply`` を付けると書き換える (省略時は
dry-run)。``--list-unmatched`` で sidebar に載っていない md を一覧。
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from ..madcap_toc import extract_slug
from ..project import DOCS_DIR, SIDEBAR_PATH, file_path_to_slug, find_md_files
from ..sidebar import extract_japanese_label

__all__ = ["main", "parse_sidebar_ordering", "update_markdown_file"]


_SECTION_RE = re.compile(r"^##\s+(.+?)\s*$")
# mjs: ``✅🔍 must precede ✅`` — alternation は順序依存。
_URL_LINE_RE = re.compile(
    r"^-\s+(?:✅🔍|✅|⏳)\s+(https://docs\.tricentis\.com/testim/content/[^\s]+\.htm)\s*$"
)

_NON_SECTION_HEADERS: frozenset[str] = frozenset(
    {"翻訳ステータス", "検証ステータス", "URL抽出方法"}
)


def parse_sidebar_ordering(text: str) -> dict[str, dict[str, object]]:
    """sidebar md を走査して slug → {category, categoryIndex, itemIndex, order} dict を返す。"""
    by_slug: dict[str, dict[str, object]] = {}
    current_category: str | None = None
    category_index = -1
    item_index = 0

    for line in re.split(r"\r?\n", text):
        sm = _SECTION_RE.match(line)
        if sm:
            raw = sm.group(1).strip()
            if raw in _NON_SECTION_HEADERS:
                current_category = None
                continue
            label = extract_japanese_label(raw)
            # コンテンツを持たないセクション (Home) は skip
            if label == "Home":
                current_category = None
                continue
            current_category = label
            category_index += 1
            item_index = 0
            continue

        um = _URL_LINE_RE.match(line)
        if um and current_category:
            slug = extract_slug(um.group(1))
            if not slug:
                print(
                    f"parse_sidebar_ordering: could not extract slug from URL: {um.group(1)}",
                    file=sys.stderr,
                )
                continue
            order = (category_index + 1) * 1000 + (item_index + 1)
            if slug not in by_slug:
                by_slug[slug] = {
                    "category": current_category,
                    "categoryIndex": category_index,
                    "itemIndex": item_index,
                    "order": order,
                }
            item_index += 1

    return by_slug


def _escape_single_quotes(s: str) -> str:
    return s.replace("'", "''")


def _update_frontmatter_block(fm: str, updates: dict[str, object]) -> str:
    """frontmatter 内の category / order を更新、なければ挿入。"""
    lines = re.split(r"\r?\n", fm)

    found_category = False
    found_order = False
    out: list[str] = []
    for line in lines:
        if re.match(r"^category:\s*", line):
            found_category = True
            out.append(f"category: '{_escape_single_quotes(str(updates['category']))}'")
            continue
        if re.match(r"^order:\s*", line):
            found_order = True
            out.append(f"order: {updates['order']}")
            continue
        out.append(line)

    if not found_category:
        desc_index = next((i for i, line in enumerate(out) if line.startswith("description:")), -1)
        title_index = next((i for i, line in enumerate(out) if line.startswith("title:")), -1)
        insert_at = (
            desc_index + 1 if desc_index >= 0 else (title_index + 1 if title_index >= 0 else 0)
        )
        out.insert(insert_at, f"category: '{_escape_single_quotes(str(updates['category']))}'")

    if not found_order:
        cat_index = next((i for i, line in enumerate(out) if line.startswith("category:")), -1)
        insert_at = cat_index + 1 if cat_index >= 0 else 0
        out.insert(insert_at, f"order: {updates['order']}")

    return "\n".join(out)


_FM_RE = re.compile(r"^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$")


def update_markdown_file(file_path: Path, updates: dict[str, object]) -> dict[str, object]:
    """1 file の frontmatter を更新。結果を ``{"changed": bool, "reason"?: str}`` で返す。"""
    raw = file_path.read_text(encoding="utf-8")
    if not raw.startswith("---"):
        return {"changed": False, "reason": "no-frontmatter"}
    match = _FM_RE.match(raw)
    if not match:
        return {"changed": False, "reason": "frontmatter-parse-failed"}

    fm = match.group(1)
    body = match.group(2)

    new_fm = _update_frontmatter_block(fm, updates)
    # 先頭の改行を消してから空行 1 行を強制 (mjs と同じ shape)。
    body_clean = re.sub(r"^\n+", "", body)
    out = f"---\n{new_fm}\n---\n\n{body_clean}"

    if out == raw:
        return {"changed": False}
    file_path.write_text(out, encoding="utf-8")
    return {"changed": True}


def main(argv: list[str] | None = None) -> int:
    """CLI エントリポイント (exit 0; sidebar 不在なら 1)。"""
    parser = argparse.ArgumentParser(
        description="Sync frontmatter category/order from SIDEBAR_URLS.md"
    )
    parser.add_argument("--apply", action="store_true", help="書き換えを実行 (省略時は dry-run)")
    parser.add_argument("--list-unmatched", action="store_true", help="sidebar 外の md を一覧")
    args = parser.parse_args(argv)

    if not SIDEBAR_PATH.exists():
        print(f"Not found: {SIDEBAR_PATH}", file=sys.stderr)
        return 1

    sidebar_text = SIDEBAR_PATH.read_text(encoding="utf-8")
    by_slug = parse_sidebar_ordering(sidebar_text)

    files = find_md_files(DOCS_DIR)

    matched = 0
    changed = 0
    unmatched: list[str] = []
    changed_examples: list[str] = []

    for file_path in files:
        slug = file_path_to_slug(file_path)
        entry = by_slug.get(slug)
        if not entry:
            try:
                unmatched.append(str(file_path.relative_to(DOCS_DIR)))
            except ValueError:
                unmatched.append(str(file_path))
            continue

        matched += 1
        if args.apply:
            res = update_markdown_file(
                file_path,
                {"category": entry["category"], "order": entry["order"]},
            )
            if res.get("changed"):
                changed += 1
                if len(changed_examples) < 20:
                    try:
                        changed_examples.append(str(file_path.relative_to(DOCS_DIR)))
                    except ValueError:
                        changed_examples.append(str(file_path))

    print(f"md files: {len(files)}")
    print(f"sidebar slugs: {len(by_slug)}")
    print(f"matched by slug: {matched}")

    if args.apply:
        print(f"changed files: {changed}")
        if changed_examples:
            print("changed examples:")
            for p in changed_examples:
                print(f"- {p}")
    else:
        print("dry-run only (use --apply to write changes)")

    print(f"unmatched markdown files (not in sidebar): {len(unmatched)}")
    if args.list_unmatched and unmatched:
        print("unmatched files:")
        for p in unmatched:
            print(f"- {p}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
