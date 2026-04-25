"""``scripts/pipeline/apply_llm_translations.mjs`` の Python port。

``llm/translations/<slug>.md`` の翻訳結果を対応する doc に atomic 適用する。
frontmatter は元 doc のものを保持、本文だけ差し替える。同じ slug が
nested + flat 両方に存在する場合は nested を優先。
"""

from __future__ import annotations

import argparse
import contextlib
import os
import sys
import time
from pathlib import Path
from typing import Any, Literal

from ..project import ROOT_DIR, build_slug_index, split_frontmatter
from ..sidebar import get_section_slug_set

__all__ = [
    "main",
    "process_one_translation",
    "resolve_translation_slug",
    "validate_translation",
    "write_file_atomic",
]


_TRANS_DIR: Path = ROOT_DIR / "llm" / "translations"


def resolve_translation_slug(rel_path: str, index: dict[str, Any]) -> str | None:
    """翻訳 file の相対パスを path-based slug に解決 (mjs 等価)。"""
    path_candidate = rel_path
    if path_candidate.endswith(".md"):
        path_candidate = path_candidate[:-3]
    is_nested = "/" in path_candidate

    if path_candidate in index:
        return path_candidate

    # nested path は完全一致のみ。
    if is_nested:
        return None

    # flat file は index 内で basename lookup。
    bn = Path(rel_path).stem
    matches = [s for s in index if s.split("/")[-1] == bn]
    if len(matches) == 1:
        print(
            f'⚠️  Deprecated: basename "{bn}" resolved to "{matches[0]}". '
            "Use path-based layout in llm/translations/.",
            file=sys.stderr,
        )
        return matches[0]
    if len(matches) > 1:
        print(
            f'⚠️  Ambiguous basename "{bn}" matches: {", ".join(matches)}. Use path-based layout.',
            file=sys.stderr,
        )
    return None


def validate_translation(fm: str, translated: str) -> str | None:
    """翻訳 body を書き込む前に検証。正常なら None、skip 理由を str で返す。"""
    if not fm:
        return "missing frontmatter in source doc"
    body = translated.strip()
    if not body:
        return "empty translation file"
    if body.startswith("# 翻訳タスク"):
        return "untranslated prompt file (contains task header)"
    # thematic break ではなく、実際の YAML frontmatter block だけを弾く。
    if body.startswith("---\n") and body.find("\n---", 4) != -1:
        return "translated body contains frontmatter block (double frontmatter risk)"
    return None


def write_file_atomic(file_path: Path, content: str) -> None:
    """tmp 書き込み後に rename して atomic に保存 (mjs 等価)。"""
    dir_path = file_path.parent
    tmp_path = dir_path / f".{file_path.name}.{int(time.time() * 1000)}.tmp"
    renamed = False
    try:
        tmp_path.write_text(content, encoding="utf-8")
        os.replace(tmp_path, file_path)
        renamed = True
    finally:
        if not renamed and tmp_path.exists():
            with contextlib.suppress(OSError):
                tmp_path.unlink()


def process_one_translation(
    *,
    slug: str,
    trans_path: Path,
    hit: dict[str, Any],
) -> Literal["applied", "skipped", "unchanged"]:
    """翻訳 file 1 件を検証して対象 doc に反映 (mjs 等価)。"""
    translated = trans_path.read_text(encoding="utf-8")
    target_path = Path(hit["filePath"])
    cur = target_path.read_text(encoding="utf-8")
    split = split_frontmatter(cur)
    fm = split.get("fm", "") or ""

    skip_reason = validate_translation(fm, translated)
    if skip_reason:
        print(f"⚠️  Skipped {slug}: {skip_reason}", file=sys.stderr)
        return "skipped"

    final = f"{fm}\n{translated.strip()}\n"
    if final == cur:
        return "unchanged"

    write_file_atomic(target_path, final)
    try:
        rel = target_path.relative_to(ROOT_DIR)
    except ValueError:
        rel = target_path
    print(f"✓ Applied translation: {rel}")
    return "applied"


def main(argv: list[str] | None = None) -> int:
    """CLI エントリポイント (exit code: 0 全件成功 / 1 skip か error あり)。"""
    parser = argparse.ArgumentParser(description="Apply LLM translations to docs")
    parser.add_argument("--section", default=None, help="sidebar section で絞り込み")
    args = parser.parse_args(argv)

    if not _TRANS_DIR.exists():
        print(f"Missing dir: {_TRANS_DIR}", file=sys.stderr)
        return 1

    section_slugs: set[str] | None = None
    if args.section:
        try:
            section_slugs = get_section_slug_set(args.section)
        except Exception as e:
            print(f'❌ Unknown section "{args.section}": {e}', file=sys.stderr)
            return 1

    index = build_slug_index()

    # 翻訳 file を集める。
    files: list[str] = []
    for p in _TRANS_DIR.rglob("*.md"):
        files.append(str(p.relative_to(_TRANS_DIR)))

    # nested (/ を含む) を優先、同一 depth 内では alphabetic。
    files.sort(key=lambda f: (0 if "/" in f else 1, f))

    counts = {"applied": 0, "skipped": 0, "unchanged": 0, "errors": 0}
    processed_slugs: set[str] = set()

    for f in files:
        slug = resolve_translation_slug(f, index)
        if not slug:
            if section_slugs is None:
                print(f"⚠️  Cannot resolve slug for translation file: {f}", file=sys.stderr)
                counts["skipped"] += 1
            continue
        if section_slugs is not None and slug not in section_slugs:
            continue

        if slug in processed_slugs:
            print(
                f'⚠️  Duplicate translation for slug "{slug}" (file: {f}) — skipping, '
                "earlier file already applied",
                file=sys.stderr,
            )
            continue
        processed_slugs.add(slug)

        hit = index.get(slug)
        if not hit:
            print(f"⚠️  No doc found for slug: {slug}", file=sys.stderr)
            counts["skipped"] += 1
            continue

        try:
            result = process_one_translation(slug=slug, trans_path=_TRANS_DIR / f, hit=hit)
            counts[result] += 1
        except Exception as e:
            print(f"❌ Error processing {slug}: {e}", file=sys.stderr)
            counts["errors"] += 1

    print(
        f"Done. Applied {counts['applied']}, skipped {counts['skipped']}, "
        f"unchanged {counts['unchanged']}, errors {counts['errors']}."
    )
    return 1 if counts["errors"] > 0 or counts["skipped"] > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
