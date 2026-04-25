"""``scripts/detection/find_untranslated.mjs`` の Python port。

baseline に ``segment-untranslated`` として列挙された slug (または
``--slug=<slug>``) の md を読み、段落 block 単位で ``classifySegment`` にかけ
fully-masked でない (= 未翻訳残留を含む) block を stderr / stdout に一覧する。

Exit codes:

- 0 — 正常終了 (0 件も含む)
- 2 — ``--slug`` 明示指定で対象 file 不在、または trust-boundary 違反
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from ..glossary_mask import classify_segment
from ..project import DOCS_DIR, ROOT_DIR

__all__ = [
    "find_untranslated_blocks",
    "main",
    "print_findings",
    "split_markdown_blocks",
]


_BASELINE_PATH: Path = ROOT_DIR / "parity-baseline.json"


def _resolve_safe_slug_path(slug: str) -> Path | None:
    """slug を ``DOCS_DIR`` 配下の md path に解決し、path-traversal を検出 (mjs 等価)。"""
    resolved = (DOCS_DIR / f"{slug}.md").resolve()
    docs_prefix = str(DOCS_DIR.resolve()) + "/"
    if not str(resolved).startswith(docs_prefix):
        return None
    return resolved


def split_markdown_blocks(markdown: str) -> list[dict[str, object]]:
    """本文を空行 / heading / image / fence / callout 境界で block に切る (mjs 等価)。"""
    lines = markdown.split("\n")
    body_start = 0
    if lines and lines[0].strip() == "---":
        try:
            fm_end = lines.index("---", 1)
        except ValueError:
            fm_end = -1
        if fm_end > 0:
            body_start = fm_end + 1

    blocks: list[dict[str, object]] = []
    current: list[str] = []
    start = body_start

    # mjs は ``i <= lines.length`` で末尾 sentinel を flush するので range を +1。
    for i in range(body_start, len(lines) + 1):
        line = lines[i] if i < len(lines) else ""
        trimmed = line.strip()
        is_boundary = (
            trimmed == ""
            or trimmed.startswith("#")
            or trimmed.startswith("![")
            or trimmed.startswith("```")
            or trimmed.startswith(":::")
            or i == len(lines)
        )
        if is_boundary:
            if current:
                blocks.append({"lineStart": start + 1, "lineEnd": i, "lines": list(current)})
            current = []
            start = i + 1
        else:
            if not current:
                start = i
            current.append(line)

    return blocks


def find_untranslated_blocks(
    blocks: list[dict[str, object]],
) -> list[dict[str, object]]:
    """各 block を ``classify_segment`` にかけ、fully_masked でないものを返す (mjs 等価)。"""
    findings: list[dict[str, object]] = []
    for block in blocks:
        lines = block.get("lines")
        assert isinstance(lines, list)
        text = " ".join(lines).strip()
        if len(text) == 0:
            continue
        cls = classify_segment(text)
        if not cls.get("isFullyMasked"):
            findings.append({**block, "residue": cls.get("residue", "")})
    return findings


def print_findings(slug: str, file_path: Path, findings: list[dict[str, object]]) -> None:
    """1 slug 分の findings を stdout に出力 (mjs 等価)。"""
    if not findings:
        return
    print(f"\n=== {slug} ({len(findings)} blocks) ===")
    print(f"    {file_path}")
    for f in findings:
        residue = str(f.get("residue", ""))[:80]
        print(f"  L{f['lineStart']}-{f['lineEnd']}: [residue: {residue}]")
        lines = f.get("lines")
        assert isinstance(lines, list)
        preview = "\n".join(lines[:2])
        print(f"    {preview[:120]}")


def main(argv: list[str] | None = None) -> int:
    """CLI エントリポイント (exit code は 0 or 2)。"""
    parser = argparse.ArgumentParser(description="Find untranslated English text in JA files")
    parser.add_argument("--slug", default=None, help="1 slug だけ走査する")
    parser.add_argument("--limit", type=int, default=0, help="処理するファイル数上限 (0=無制限)")
    args = parser.parse_args(argv)

    slug_filter = args.slug
    limit = args.limit or 0

    baseline = json.loads(_BASELINE_PATH.read_text(encoding="utf-8"))
    untranslated_slugs = {
        e["slug"]
        for e in baseline.get("entries", [])
        if e.get("issueType") == "segment-untranslated"
    }
    if not untranslated_slugs and not slug_filter:
        print(
            "WARN: baseline contains no segment-untranslated entries — nothing to scan.",
            file=sys.stderr,
        )

    slugs = [slug_filter] if slug_filter else sorted(untranslated_slugs)

    total_found = 0
    files_processed = 0

    for slug in slugs:
        file_path = _resolve_safe_slug_path(slug)
        if file_path is None:
            print(f'REJECT: "{slug}" outside docs dir (trust boundary)', file=sys.stderr)
            return 2
        if not file_path.exists():
            if slug_filter:
                print(
                    f"FAIL: {file_path} not found (--slug explicitly specified)",
                    file=sys.stderr,
                )
                return 2
            print(f"SKIP: {file_path} not found", file=sys.stderr)
            continue

        content = file_path.read_text(encoding="utf-8")
        blocks = split_markdown_blocks(content)
        findings = find_untranslated_blocks(blocks)
        if findings:
            files_processed += 1
            total_found += len(findings)
            print_findings(slug, file_path, findings)
        if limit > 0 and files_processed >= limit:
            break

    print(f"\n--- Total: {total_found} untranslated blocks in {files_processed} files ---")
    return 0


if __name__ == "__main__":
    sys.exit(main())
