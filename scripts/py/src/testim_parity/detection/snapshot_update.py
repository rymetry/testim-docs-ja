"""``scripts/detection/snapshot_update.mjs`` の Python wrapper。

**重要**: 本 module は現在 mjs 実装に subprocess で delegate する thin wrapper
である。``snapshot_update`` は以下を束ねた heavy script で、Python 化すると
retry / recovery probe / concurrent fetch の byte parity 維持が非現実的:

- live EN HTML を fetch (httpx + retry + throttle)
- ``#mc-main-content`` DOM 抽出 (BS4 / BeautifulSoup)
- ``detect_source_usability`` で破損ページの recovery probe
- ``source_sync_exclusions`` / ``en_source_patches`` registry との照合
- ``source-sync-status.json`` 書き出し

これらの components は個別に Python 化済み (``segments_en`` / ``source_usability``
/ ``sync_exclusions`` / ``en_source_patches``) だが、配線を Python 側で 1 から
実装すると mjs の run ID / metadata / retry timing と drift が出る。Phase 5
移行で mjs 側を削除する際に Python 完全版に差し替える (Phase 4b follow-up)。
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from ..project import ROOT_DIR

__all__ = ["main"]


_SNAPSHOT_UPDATE_MJS: Path = ROOT_DIR / "scripts" / "detection" / "snapshot_update.mjs"


def main(argv: list[str] | None = None) -> int:
    """CLI エントリポイント。mjs 版に subprocess 移譲する。"""
    if argv is None:
        argv = sys.argv[1:]

    parser = argparse.ArgumentParser(
        description="Fetch EN snapshots + sidebar (Phase 4 wrapper for mjs)"
    )
    parser.add_argument("--section", default=None)
    parser.add_argument("--slug", default=None)
    parser.add_argument("--dry-run", dest="dry_run", action="store_true")
    args, extras = parser.parse_known_args(argv)

    forwarded: list[str] = []
    if args.section:
        forwarded.append(f"--section={args.section}")
    if args.slug:
        forwarded.append(f"--slug={args.slug}")
    if args.dry_run:
        forwarded.append("--dry-run")
    forwarded.extend(extras)

    if not _SNAPSHOT_UPDATE_MJS.exists():
        print(f"snapshot_update.mjs not found at {_SNAPSHOT_UPDATE_MJS}", file=sys.stderr)
        return 1

    try:
        completed = subprocess.run(
            ["node", str(_SNAPSHOT_UPDATE_MJS), *forwarded],
            cwd=str(ROOT_DIR),
            check=False,
        )
    except FileNotFoundError:
        print(
            "snapshot_update: node not found on PATH. Install Node.js to run "
            "the live EN fetch + DOM extraction step.",
            file=sys.stderr,
        )
        return 2
    return int(completed.returncode)


if __name__ == "__main__":
    sys.exit(main())
