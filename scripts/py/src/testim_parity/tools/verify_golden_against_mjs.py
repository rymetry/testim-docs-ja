"""committed golden JSONL を pre-cutover mjs authority で再検証する tool。

## 背景

Phase 6b atomic cutover で ``scripts/lib/*.mjs`` / ``scripts/py/tools/
emit_corpus_oracle.mjs`` 等を削除した。committed golden
(``scripts/py/tests/conformance/__oracle__/corpus_golden.jsonl``) は
Python ``emit_corpus_oracle.py`` で regenerate した 864 行 (segments_en 288 +
turndown 288 + align 288) だが、Python 側で bug があると bug を「正解」として
pin してしまうリスクがあるため、pre-cutover の mjs authority で再現確認できる
仕組みが必要。

## 検証手順

1. pre-cutover commit (``b406dba7^``) から mjs file 一式を ``git archive`` で
   temp directory に復元
2. corpus と node_modules は現行 worktree から symlink で共有
3. ``node scripts/py/tools/emit_corpus_oracle.mjs --out <tmp> --suite all`` 実行
4. ``cmp`` で committed golden と byte-identical 比較
5. PASS なら temp directory を cleanup

## 使い方

```bash
uv run python -m testim_parity.tools.verify_golden_against_mjs
```

exit 0 = PASS (byte-identical), exit 1 = FAIL (drift) or tool error。

## なぜ committed に保持するか

Phase 6b round 2 review で「golden が Python 自己生成で正解化リスクがある」と
指摘された。この tool を commit しておけば、future PR で align / segments_en /
turndown / segments_ja の Python 実装を変更したとき、mjs authority との乖離を
one-shot で検出できる。

## 初回検証結果 (2026-04-24)

このtoolで mjs (``b406dba7^``) を走らせて生成した 864 行 golden は committed
golden と **byte-identical** であることを確認。これにより以下が pin される:

- Python ``extract_segments_from_html`` ≡ mjs ``extractSegmentsFromHtml``
- Python ``convert_en_html_to_md`` ≡ mjs ``convertEnHtmlToMd`` (turndown)
- Python ``extract_segments_from_markdown`` ≡ mjs ``extractSegmentsFromMarkdown``
- Python ``align_segments`` ≡ mjs ``alignSegments``

今後 Python 実装で behavior を変えたら、本 tool で drift 有無を即座に判定できる。
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from ..project import ROOT_DIR

__all__ = ["main"]

# pre-cutover commit で mjs file 一式と scripts/py/tools/emit_corpus_oracle.mjs が
# 揃っている最後の状態。Phase 6b atomic cutover の直前 commit。
_PRE_CUTOVER_REV = "b406dba7^"

_COMMITTED_GOLDEN = (
    ROOT_DIR / "scripts" / "py" / "tests" / "conformance" / "__oracle__" / "corpus_golden.jsonl"
)


def _run(cmd: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    """Run a subprocess command, capturing output."""
    return subprocess.run(
        cmd,
        cwd=cwd,
        check=False,
        capture_output=True,
        text=True,
    )


def _extract_mjs_tree(rev: str, dest: Path) -> None:
    """``git archive`` で ``scripts/`` subtree を ``rev`` から ``dest`` に展開。

    tar は binary stream なので ``capture_output + text=False`` (default) で
    bytes を受ける。``_run`` は ``text=True`` 固定なので使わない。
    """
    dest.mkdir(parents=True, exist_ok=True)
    archive = subprocess.run(
        ["git", "archive", "--format=tar", rev, "--", "scripts/"],
        cwd=ROOT_DIR,
        capture_output=True,
        check=False,
    )
    if archive.returncode != 0:
        raise RuntimeError(f"git archive failed: {archive.stderr.decode(errors='replace')}")
    untar = subprocess.run(
        ["tar", "x"],
        cwd=dest,
        input=archive.stdout,
        capture_output=True,
        check=False,
    )
    if untar.returncode != 0:
        raise RuntimeError(f"tar extract failed: {untar.stderr.decode(errors='replace')}")


def _link_shared_inputs(dest: Path) -> None:
    """現 worktree の corpus / node_modules / package.json を symlink で共有。"""
    for name in ("snapshots", "src", "docs", "node_modules", "package.json"):
        src = ROOT_DIR / name
        if not src.exists():
            continue
        link = dest / name
        if link.exists() or link.is_symlink():
            link.unlink()
        link.symlink_to(src)


def _parse_args(argv: list[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Verify committed golden JSONL against pre-cutover mjs authority",
    )
    parser.add_argument(
        "--rev",
        default=_PRE_CUTOVER_REV,
        help=f"git revision to restore mjs files from (default: {_PRE_CUTOVER_REV})",
    )
    parser.add_argument(
        "--golden",
        default=str(_COMMITTED_GOLDEN),
        help=f"path to committed golden JSONL (default: {_COMMITTED_GOLDEN})",
    )
    parser.add_argument(
        "--keep-temp",
        action="store_true",
        help="keep temp directory for debugging (default: cleanup on exit)",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    golden_path = Path(args.golden)
    if not golden_path.is_absolute():
        golden_path = (Path.cwd() / golden_path).resolve()
    if not golden_path.exists():
        print(f"Error: committed golden not found: {golden_path}", file=sys.stderr)
        return 2

    tmp_root = Path(tempfile.mkdtemp(prefix="mjs_verify_"))
    try:
        print(
            f"[verify_golden_against_mjs] restoring mjs files from {args.rev} → {tmp_root}",
            file=sys.stderr,
        )
        _extract_mjs_tree(args.rev, tmp_root)
        _link_shared_inputs(tmp_root)

        emit_tool = tmp_root / "scripts" / "py" / "tools" / "emit_corpus_oracle.mjs"
        if not emit_tool.exists():
            print(
                f"Error: emit_corpus_oracle.mjs not found at {emit_tool}. "
                f"Revision {args.rev} may be too recent (post-cutover).",
                file=sys.stderr,
            )
            return 3

        regen_path = tmp_root / "regen.jsonl"
        print("[verify_golden_against_mjs] running mjs emit_corpus_oracle.mjs", file=sys.stderr)
        result = _run(
            ["node", str(emit_tool), "--out", str(regen_path), "--suite", "all"],
            cwd=tmp_root,
        )
        if result.returncode != 0:
            print(
                f"Error: mjs emit_corpus_oracle.mjs failed (exit {result.returncode}):\n"
                f"  stdout: {result.stdout[:1000]}\n"
                f"  stderr: {result.stderr[:1000]}",
                file=sys.stderr,
            )
            return 4

        if not regen_path.exists():
            print(f"Error: regen output not produced: {regen_path}", file=sys.stderr)
            return 5

        # Byte-identical comparison
        cmp_result = _run(["cmp", str(regen_path), str(golden_path)])
        if cmp_result.returncode == 0:
            print(
                f"✅ VERIFIED: committed golden is byte-identical to mjs-regenerated oracle.\n"
                f"   - mjs rev: {args.rev}\n"
                f"   - committed: {golden_path}\n"
                f"   - rows: 864 (segments_en 288 + turndown 288 + align 288)",
                file=sys.stderr,
            )
            return 0

        print(
            f"❌ DRIFT DETECTED: committed golden diverges from mjs authority.\n"
            f"   - cmp output: {cmp_result.stdout.strip()}\n"
            f"   - diff summary (first 20 lines):",
            file=sys.stderr,
        )
        diff_result = _run(["diff", str(regen_path), str(golden_path)])
        print(diff_result.stdout[:4000], file=sys.stderr)
        return 1
    finally:
        if args.keep_temp:
            print(
                f"[verify_golden_against_mjs] keeping temp dir: {tmp_root}",
                file=sys.stderr,
            )
        else:
            shutil.rmtree(tmp_root, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
