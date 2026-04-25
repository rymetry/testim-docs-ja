"""``scripts/tools/check_glossary_duplicates.mjs`` の Python port。

``docs/GLOSSARY.md`` の重複エントリ (exact / case-variant / whitespace-variant)
を検出する lint gate。

Exit codes:

- 0 — 重複なし
- 2 — 重複あり (``--list`` 指定時は 0)

Duplicate policy (normalize_key で lower + whitespace-collapse してから比較):

- (a) Exact duplicate (byte-identical key) — hard error
- (b) Case-variant duplicate (same key modulo case) — hard error
- (c) Whitespace-normalized duplicate — hard error
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from ..project import ROOT_DIR

__all__ = [
    "find_duplicates",
    "main",
    "normalize_key",
    "parse_glossary_entries",
]


_GLOSSARY_REL = Path("docs/GLOSSARY.md")
_ROW_RE = re.compile(r"^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$")


def parse_glossary_entries(markdown: str) -> list[dict[str, object]]:
    """glossary markdown から entries を抽出する (mjs 等価)。"""
    lines = markdown.split("\n")
    entries: list[dict[str, object]] = []
    for i, line in enumerate(lines):
        if not line.startswith("| "):
            continue
        if line.startswith("| --- ") or line.startswith("| 用語 "):
            continue
        match = _ROW_RE.match(line)
        if not match:
            continue
        term = match.group(1).strip()
        if term in ("用語", "term"):
            continue
        entries.append({"line": i + 1, "term": term, "description": match.group(2).strip()})
    return entries


def normalize_key(term: str) -> str:
    """lowercase + whitespace collapse (mjs 等価)。"""
    return re.sub(r"\s+", " ", term.lower()).strip()


def find_duplicates(entries: list[dict[str, object]]) -> list[dict[str, object]]:
    """normalize_key 後に同一キーを持つ entry group のみ残す (mjs 等価)。"""
    by_normalized: dict[str, list[dict[str, object]]] = {}
    for entry in entries:
        key = normalize_key(str(entry["term"]))
        by_normalized.setdefault(key, []).append(entry)
    return [
        {"normalizedKey": key, "entries": group}
        for key, group in by_normalized.items()
        if len(group) > 1
    ]


def main(argv: list[str] | None = None) -> int:
    """CLI エントリポイント。exit code (0 or 2) を返す。"""
    parser = argparse.ArgumentParser(description="Detect duplicate entries in docs/GLOSSARY.md")
    parser.add_argument(
        "--list",
        action="store_true",
        help="重複を表示するが exit 0 を返す (CI で fail させない用)",
    )
    args = parser.parse_args(argv)

    glossary_path = ROOT_DIR / _GLOSSARY_REL
    md = glossary_path.read_text(encoding="utf-8")
    entries = parse_glossary_entries(md)
    duplicates = find_duplicates(entries)

    if not duplicates:
        print(f"OK: {len(entries)} entries, no duplicates detected.")
        return 0

    print(
        f"DUPLICATES: {len(duplicates)} duplicate groups detected in {glossary_path}",
        file=sys.stderr,
    )
    for dup in duplicates:
        key = dup["normalizedKey"]
        group = dup["entries"]
        assert isinstance(group, list)
        print(f'\n  "{key}" ({len(group)} occurrences):', file=sys.stderr)
        for e in group:
            print(
                f"    L{e['line']}: | {e['term']} | {e['description']} |",
                file=sys.stderr,
            )
    print(
        "\nResolution: merge duplicates into 1 entry "
        "(pick the most precise description and delete the rest).",
        file=sys.stderr,
    )
    return 0 if args.list else 2


if __name__ == "__main__":
    sys.exit(main())
