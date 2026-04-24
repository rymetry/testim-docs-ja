"""oracle JSONL の sha256 一覧を TSV で抽出する (mjs port)。

Phase 6a で committed golden に移行した際 ``.oracle_today.jsonl`` (MB 級) を
nightly artifact として毎日 upload すると retention cost が積もるため、
sha256 一覧 (KB 級) を別 artifact として分離する。Phase 6b で mjs ``summarize_corpus_oracle.mjs``
を Python 化する。drift check は PR CI / nightly で本 TSV を committed
``corpus_golden.sha256.tsv`` と diff して行う。

Usage:
    uv run python -m testim_parity.tools.summarize_corpus_oracle --in <jsonl> --out <tsv>

出力形式: 1 row = ``<suite>\\t<slug>\\t<sha256>\\n``、``(suite, slug)`` lexicographic sort。
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

__all__ = ["main"]


def _parse_args(argv: list[str] | None) -> tuple[Path, Path]:
    parser = argparse.ArgumentParser(
        description="Summarize oracle JSONL into SHA-256 TSV manifest"
    )
    parser.add_argument("--in", dest="input_path", required=True, help="input JSONL path")
    parser.add_argument("--out", required=True, help="output TSV path")
    args = parser.parse_args(argv)
    return Path(args.input_path), Path(args.out)


def main(argv: list[str] | None = None) -> int:
    input_path, output_path = _parse_args(argv)

    rows: list[dict[str, str]] = []
    for line in input_path.read_text(encoding="utf-8").split("\n"):
        line = line.strip()
        if not line:
            continue
        row = json.loads(line)
        rows.append(
            {
                "suite": str(row["suite"]),
                "slug": str(row["slug"]),
                "sha256": str(row["sha256"]),
            }
        )

    rows.sort(key=lambda r: (r["suite"], r["slug"]))

    tsv = "\n".join(f"{r['suite']}\t{r['slug']}\t{r['sha256']}" for r in rows) + "\n"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(tsv, encoding="utf-8")
    print(f"summarize_corpus_oracle: {len(rows)} rows → {output_path}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
