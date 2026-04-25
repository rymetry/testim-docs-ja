"""``scripts/tools/fix_alt_all.mjs`` の Python port。

リポジトリ内 markdown の画像に alt テキストを付与する (MD045 対策)。code fence
外の ``![](...)`` だけを対象に、``.gif`` を含む場合は ``操作手順アニメーション``、
それ以外は ``スクリーンショット`` を alt として埋める。
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

from ..project import ROOT_DIR

__all__ = ["apply_alt_fix_outside_fences", "main"]


_IGNORE_DIR_NAMES: frozenset[str] = frozenset({"node_modules", ".git", "dist", ".astro"})
_FENCE_RE = re.compile(r"^(`{3,}|~{3,})")
_EMPTY_ALT_IMAGE_RE = re.compile(r"!\[\]\(([^)]+)\)")


def _list_markdown_files_recursively(dir_path: Path) -> list[Path]:
    """DFS で ``.md`` を走査 (mjs と同順 = dir entries の alphabetic 相当)。"""
    results: list[Path] = []
    try:
        entries = sorted(dir_path.iterdir(), key=lambda p: p.name)
    except OSError, PermissionError:
        return []
    for entry in entries:
        if entry.name.startswith(".DS_Store"):
            continue
        if entry.is_dir():
            if entry.name in _IGNORE_DIR_NAMES:
                continue
            results.extend(_list_markdown_files_recursively(entry))
            continue
        if entry.is_file() and entry.name.endswith(".md"):
            results.append(entry)
    return results


def _fence_info(line: str) -> tuple[str, int] | None:
    """fence 行を検出し ``(char, len)`` を返す (非 fence は None)。"""
    trimmed = line.lstrip()
    match = _FENCE_RE.match(trimmed)
    if not match:
        return None
    fence = match.group(1)
    return (fence[0], len(fence))


def apply_alt_fix_outside_fences(markdown: str) -> str:
    """code fence 外の ``![](...)`` に alt テキストを埋め込む (mjs 等価)。"""
    lines = markdown.split("\n")
    open_fence: tuple[str, int] | None = None
    out: list[str] = []

    for line in lines:
        fence = _fence_info(line)
        if fence is not None:
            if open_fence is None:
                open_fence = fence
            elif open_fence[0] == fence[0] and fence[1] >= open_fence[1]:
                open_fence = None
            out.append(line)
            continue

        if open_fence is not None:
            out.append(line)
            continue

        if "![](" not in line:
            out.append(line)
            continue

        def _replace(match: re.Match[str]) -> str:
            inside = match.group(1)
            alt = "操作手順アニメーション" if ".gif" in inside.lower() else "スクリーンショット"
            return f"![{alt}]({inside})"

        out.append(_EMPTY_ALT_IMAGE_RE.sub(_replace, line))

    return "\n".join(out)


def main(argv: list[str] | None = None) -> int:
    """CLI エントリポイント (exit 0)。mjs と同じく引数を取らない。"""
    _ = argv
    files = _list_markdown_files_recursively(ROOT_DIR)

    changed_count = 0
    changed_image_count = 0
    for file in files:
        try:
            original = file.read_text(encoding="utf-8")
        except OSError:
            continue
        if "![](" not in original:
            continue
        updated = apply_alt_fix_outside_fences(original)
        if updated == original:
            continue
        before = len(_EMPTY_ALT_IMAGE_RE.findall(original))
        after = len(_EMPTY_ALT_IMAGE_RE.findall(updated))
        fixed = max(0, before - after)
        file.write_text(updated, encoding="utf-8")
        changed_count += 1
        changed_image_count += fixed
        try:
            rel = file.relative_to(ROOT_DIR)
        except ValueError:
            rel = file
        print(f"更新: {rel} (images fixed: {fixed})")

    print(f"\n✅ altテキストを更新したファイル数: {changed_count} 件")
    print(f"✅ 修正した画像(空alt)数: {changed_image_count} 件")
    return 0


if __name__ == "__main__":
    sys.exit(main())
