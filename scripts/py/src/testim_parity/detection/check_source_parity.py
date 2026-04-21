"""``scripts/detection/check_source_parity.mjs`` の Python wrapper。

**重要**: 915 LOC の主 orchestration script。ack / baseline / advisory / 5-counter
を同時に更新する parity gate entry point。Python 側は以下の構成要素を既に
個別 port 済みだが、 mjs との byte-identical な orchestration (特に run ID /
generatedAt timestamp / linkage fingerprint) を揃えるには turndown 依存も解決
する必要があるため、Phase 4 では ``node`` へ subprocess delegate する thin
wrapper に留める。

既存の Python 実装で再利用可能な部品:

- ``testim_parity.align`` / ``structure`` / ``checks`` — 比較エンジン
- ``testim_parity.summary.summarize_parity_results`` — 5-counter 集計
- ``testim_parity.acknowledgements`` — ack tag + snapshot fingerprint
- ``testim_parity.baseline`` — schema v2 tag / orphan
- ``testim_parity.advisory_queue`` — tokenless-near-tie queue
- ``testim_parity.source_usability`` — Layer 1/2/3 detector
- ``testim_parity.page_coverage`` — single-page snapshot coverage
- ``testim_parity.sync_health`` — run scope / linkage validator
- ``testim_parity.glossary_mask`` / ``artifact_registry`` / ``en_source_patches``

Phase 5 (pytest rewrite) + Phase 6 (atomic cutover) で turndown 等価実装を
入れた後、本 wrapper を削除して full Python orchestration に置き換える。
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from ..project import ROOT_DIR

__all__ = ["main"]


_CHECK_SOURCE_PARITY_MJS: Path = ROOT_DIR / "scripts" / "detection" / "check_source_parity.mjs"


def main(argv: list[str] | None = None) -> int:
    """CLI エントリポイント。mjs に subprocess 移譲する。"""
    if argv is None:
        argv = sys.argv[1:]

    parser = argparse.ArgumentParser(
        description="Run source parity check (Phase 4 wrapper for mjs)"
    )
    parser.add_argument("--slug", default=None)
    parser.add_argument("--section", default=None)
    args, extras = parser.parse_known_args(argv)

    forwarded: list[str] = []
    if args.slug:
        forwarded.append(f"--slug={args.slug}")
    if args.section:
        forwarded.append(f"--section={args.section}")
    forwarded.extend(extras)

    if not _CHECK_SOURCE_PARITY_MJS.exists():
        print(
            f"check_source_parity.mjs not found at {_CHECK_SOURCE_PARITY_MJS}",
            file=sys.stderr,
        )
        return 1

    try:
        completed = subprocess.run(
            ["node", str(_CHECK_SOURCE_PARITY_MJS), *forwarded],
            cwd=str(ROOT_DIR),
            check=False,
        )
    except FileNotFoundError:
        print(
            "check_source_parity: node not found on PATH. Install Node.js "
            "to run the main parity gate (turndown dependency blocks full "
            "Python port until Phase 5).",
            file=sys.stderr,
        )
        return 2
    return int(completed.returncode)


if __name__ == "__main__":
    sys.exit(main())
