"""288-page matrix conformance oracle JSONL emitter (Phase 6b cutover 版)。

Phase 6a 期間中は ``scripts/python/tools/emit_corpus_oracle.mjs`` が mjs authority
を呼び出して JSONL を生成していたが、Phase 6b atomic cutover で mjs harness
を削除したため、Python 実装に切替える。segments_en / turndown / align は
Python 側が mjs byte-identical を保証している (Phase 6a committed golden が
authoritative で、Python 実装はそれを pin している)。

Usage:
    uv run python -m testim_parity.tools.emit_corpus_oracle \
        --out tests/conformance/__oracle__/corpus_golden.jsonl \
        [--suite segments_en,turndown,align|all]

Output format (JSONL, 1 row per line)::

    {
      "schemaVersion": 1,
      "suite": "segments_en" | "turndown" | "align",
      "slug": "<relative path without extension>",
      "sha256": "<hex digest of canonical-JSON(expected)>",
      "expected": <suite-specific JSON value>
    }

``sha256`` は drift 検知用の fingerprint。``expected`` を canonical JSON
(``json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)``)
に serialize してから SHA-256 を取る。``summarize_corpus_oracle`` が同じ方式で
再計算して一致確認する。

``align`` suite は Phase 6b で 2-stage oracle (Python segments → mjs align) から
Python-only pure conformance (Python segments → Python align) に移行した。
mjs 削除後は Python が authority なので Python-only で正しい挙動になる。
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path
from typing import Any

from ..align import align_segments
from ..project import ROOT_DIR
from ..segments_en import CALLOUT_NORMALIZATION_SLUGS, extract_segments_from_html
from ..segments_ja import extract_segments_from_markdown
from ..turndown import convert_en_html_to_md

__all__ = ["main"]

_EN_SNAPSHOT_ROOT = ROOT_DIR / "snapshots" / "en" / "content"
_JA_DOCS_ROOT = ROOT_DIR / "src" / "content" / "docs"

_VALID_SUITES: frozenset[str] = frozenset({"segments_en", "turndown", "align"})


def _parse_args(argv: list[str] | None) -> tuple[Path, frozenset[str]]:
    parser = argparse.ArgumentParser(
        description="Emit 288-page matrix conformance oracle JSONL",
    )
    parser.add_argument("--out", required=True, help="output JSONL path (absolute or cwd-relative)")
    parser.add_argument(
        "--suite",
        default="segments_en,turndown,align",
        help="comma-separated suite names; ``all`` for everything (default: all 3 suites)",
    )
    args = parser.parse_args(argv)

    raw = args.suite
    if raw == "all":
        suites = frozenset(_VALID_SUITES)
    else:
        suites = frozenset(s.strip() for s in raw.split(",") if s.strip())
    invalid = suites - _VALID_SUITES
    if invalid:
        parser.error(
            f"Unknown suite(s): {','.join(sorted(invalid))}. "
            f"Valid: {','.join(sorted(_VALID_SUITES))}"
        )

    return Path(args.out), suites


def _canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _canonical_sha256(value: Any) -> str:
    return hashlib.sha256(_canonical_json(value).encode("utf-8")).hexdigest()


def _collect_en_snapshots() -> list[tuple[str, str]]:
    if not _EN_SNAPSHOT_ROOT.exists():
        return []
    # mjs ``emit_corpus_oracle.mjs`` は slug 文字列で sort する。Python の
    # ``Path.__lt__`` は parts (tuple) 比較で、``a.html`` と ``a/sub.html`` を
    # pathlib 的に sort すると subdirectory の children が先に来てしまうため、
    # ここでは **slug string** で sort して committed golden と並び順を揃える
    # (parent slug ``advanced-editing/data-driven-testing`` が child
    # ``advanced-editing/data-driven-testing/configuring-a`` より先に来る)。
    pairs: list[tuple[str, str]] = []
    for html_path in _EN_SNAPSHOT_ROOT.rglob("*.html"):
        slug = str(html_path.relative_to(_EN_SNAPSHOT_ROOT).with_suffix(""))
        # Windows 対策に posix separator で slug を統一する。
        slug = slug.replace(os.sep, "/")
        pairs.append((slug, html_path.read_bytes().decode("utf-8")))
    pairs.sort(key=lambda p: p[0])
    return pairs


def _load_ja_body_if_exists(slug: str) -> str | None:
    md_path = _JA_DOCS_ROOT / f"{slug}.md"
    if not md_path.exists():
        return None
    raw = md_path.read_text(encoding="utf-8")
    # frontmatter 剥がし (``--- ... ---`` の 1 回目 skip)。mjs の
    # ``extractSegmentsFromMarkdown`` は生 body を受け取る前提なので、
    # caller が frontmatter を trim して渡す契約に揃える。
    lines = raw.split("\n")
    if lines and lines[0].strip() == "---":
        for i in range(1, len(lines)):
            if lines[i].strip() == "---":
                return "\n".join(lines[i + 1 :]).strip()
    return raw.strip()


def _compute_segments_en(slug: str, html: str) -> list[dict[str, Any]]:
    return extract_segments_from_html(
        html, slug=slug, callout_allow_slugs=CALLOUT_NORMALIZATION_SLUGS
    )


def _compute_turndown(_slug: str, html: str) -> str:
    return convert_en_html_to_md(html)


def _compute_align(slug: str, html: str) -> dict[str, Any] | None:
    ja_body = _load_ja_body_if_exists(slug)
    if ja_body is None:
        return None
    try:
        en_segments = _compute_segments_en(slug, html)
        ja_segments = extract_segments_from_markdown(ja_body)
        return {"ok": True, "result": align_segments(en_segments, ja_segments, slug=slug)}
    except Exception as exc:  # noqa: BLE001 — top-level capture matches mjs behavior
        return {"ok": False, "error": str(exc)}


def main(argv: list[str] | None = None) -> int:
    out_path, suites = _parse_args(argv)

    snapshots = _collect_en_snapshots()
    if not snapshots:
        print(
            f"Error: no EN snapshots found under {_EN_SNAPSHOT_ROOT}. "
            "Run `npm run check:snapshots:fetch` first.",
            file=sys.stderr,
        )
        return 3

    rows: list[dict[str, Any]] = []
    failures: list[str] = []

    for slug, html in snapshots:
        if "segments_en" in suites:
            try:
                expected = _compute_segments_en(slug, html)
                rows.append(
                    {
                        "schemaVersion": 1,
                        "suite": "segments_en",
                        "slug": slug,
                        "sha256": _canonical_sha256(expected),
                        "expected": expected,
                    }
                )
            except Exception as exc:  # noqa: BLE001
                failures.append(f"segments_en/{slug}: {exc}")
        if "turndown" in suites:
            try:
                expected_md = _compute_turndown(slug, html)
                rows.append(
                    {
                        "schemaVersion": 1,
                        "suite": "turndown",
                        "slug": slug,
                        "sha256": _canonical_sha256(expected_md),
                        "expected": expected_md,
                    }
                )
            except Exception as exc:  # noqa: BLE001
                failures.append(f"turndown/{slug}: {exc}")
        if "align" in suites:
            try:
                align_result = _compute_align(slug, html)
                if align_result is not None:
                    rows.append(
                        {
                            "schemaVersion": 1,
                            "suite": "align",
                            "slug": slug,
                            "sha256": _canonical_sha256(align_result),
                            "expected": align_result,
                        }
                    )
            except Exception as exc:  # noqa: BLE001
                failures.append(f"align/{slug}: {exc}")

    if failures:
        print(f"emit_corpus_oracle: {len(failures)} slug/suite failed:", file=sys.stderr)
        for f in failures[:20]:
            print(f"  {f}", file=sys.stderr)
        if len(failures) > 20:
            print(f"  ... ({len(failures) - 20} more)", file=sys.stderr)
        return 1

    # JSONL 1 row per line。``ensure_ascii=False`` で UTF-8 のまま書く。
    # ``separators=(",", ":")`` で mjs の ``JSON.stringify`` と同じ compact 表現に
    # 揃える (committed golden が compact で書かれているため、``drift check`` が
    # byte-identical 比較できる)。改行で繋いで最後に trailing newline を付ける。
    body = "\n".join(json.dumps(r, separators=(",", ":"), ensure_ascii=False) for r in rows) + "\n"

    out_resolved = Path(os.getcwd()).joinpath(out_path).resolve()
    out_resolved.parent.mkdir(parents=True, exist_ok=True)
    tmp = out_resolved.with_suffix(out_resolved.suffix + f".tmp-{os.getpid()}")
    tmp.write_text(body, encoding="utf-8")
    tmp.replace(out_resolved)

    cwd = Path.cwd()
    rel = out_resolved.relative_to(cwd) if out_resolved.is_relative_to(cwd) else out_resolved
    print(
        f"emit_corpus_oracle: wrote {len(rows)} rows across {len(suites)} suite(s) → {rel}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
