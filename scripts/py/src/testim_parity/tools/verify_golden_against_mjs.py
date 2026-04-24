"""committed golden JSONL を pre-cutover mjs authority で再検証する tool。

## 背景

Phase 6b atomic cutover で ``scripts/lib/*.mjs`` / ``scripts/py/tools/
emit_corpus_oracle.mjs`` 等を削除した。committed golden
(``scripts/py/tests/conformance/__oracle__/corpus_golden.jsonl``) は
Python ``emit_corpus_oracle.py`` で regenerate した 864 行 (segments_en 288 +
turndown 288 + align 288) だが、Python 側で bug があると bug を「正解」として
pin してしまうリスクがあるため、pre-cutover の mjs authority で再現確認できる
仕組みが必要。

## 検証手順 (fresh 環境再現可能)

1. pre-cutover commit (``_PRE_CUTOVER_REV``) の **mjs 一式 + package.json +
   package-lock.json** を ``git archive`` で temp directory に復元
2. temp directory で ``npm ci`` を実行し、pre-cutover の npm 依存
   (``turndown`` / ``gray-matter`` 等) を tmp 専用に install
3. 現 worktree の入力 (``snapshots/`` / ``src/`` / ``docs/``) のみ symlink で共有
   (``node_modules`` / ``package.json`` は cutover 前の状態を使うため共有しない)
4. ``node scripts/py/tools/emit_corpus_oracle.mjs --out <tmp> --suite all`` 実行
5. ``cmp`` で committed golden と byte-identical 比較
6. PASS なら temp directory を cleanup (``--keep-temp`` で保持可)

## 使い方

```bash
uv run python -m testim_parity.tools.verify_golden_against_mjs
# オプション:
#   --rev <sha>        検証元 rev (default: cutover commit の 1 つ手前)
#   --keep-temp        tmp directory を残す (デバッグ用)
#   --skip-npm-ci      既存 tmp の node_modules を再利用 (再実行の高速化)
#   --npm-cache <path> npm cache directory を固定 (CI キャッシュ共有用)
```

exit code:

- ``0`` = PASS (byte-identical)
- ``1`` = FAIL (drift detected)
- ``2`` = committed golden 不在
- ``3`` = extracted tree に emit_corpus_oracle.mjs 不在 (post-cutover rev 指定)
- ``4`` = mjs emit_corpus_oracle.mjs 実行失敗
- ``5`` = regen 出力なし
- ``6`` = git/npm 依存解決失敗 (shallow repo / rev 不在 / npm ci 失敗)

## なぜ committed に保持するか

Phase 6b round 2 review で「golden が Python 自己生成で正解化リスクがある」と
指摘された。この tool を commit しておけば、future PR で align / segments_en /
turndown / segments_ja の Python 実装を変更したとき、mjs authority との乖離を
one-shot で検出できる。

## 初回検証結果 (2026-04-25)

このtoolで mjs (``b406dba7^``) を走らせて生成した 864 行 golden は committed
golden と **byte-identical** であることを確認。これにより以下が pin される:

- Python ``extract_segments_from_html`` ≡ mjs ``extractSegmentsFromHtml``
- Python ``convert_en_html_to_md`` ≡ mjs ``convertEnHtmlToMd`` (turndown)
- Python ``extract_segments_from_markdown`` ≡ mjs ``extractSegmentsFromMarkdown``
- Python ``align_segments`` ≡ mjs ``alignSegments``

今後 Python 実装で behavior を変えたら、本 tool で drift 有無を即座に判定できる。

## CI integration 注意

CI で本 tool を required step に入れる場合、以下を用意する:

- ``actions/checkout`` で ``fetch-depth: 0`` (shallow clone だと git archive が
  rev に到達できず ``_assert_repo_reachable`` で exit 6 になる)
- Node と npm が利用可能 (``npm ci`` で pre-cutover 依存を install するため)
- 依存は tmp directory 内で完結するので現行 worktree の ``node_modules`` /
  ``package.json`` は cutover 後 (turndown / gray-matter 不在) の状態でよい

初回検証は開発者が手動で 1 度走らせれば十分な設計で、CI routine は必須ではない。
将来 Python 実装を touch する PR で drift を疑うときに手動で re-run する。

## Retention policy — 6 ヶ月限定の検証 tool

本 tool は **Phase 6b cutover 後 6 ヶ月間** (2026-04-25 から 2026-10-25 まで) の
drift detection 用。以下の条件が発生した時点で **retire** (削除) する:

1. ``_PRE_CUTOVER_REV`` (現在 ``b406dba7^``) が git history から到達不可能になる
   - 例: ``git rebase`` / ``squash merge`` / history rewrite で commit ID が失効
   - 検知方法: ``_assert_repo_reachable`` が exit 6 を返すようになった時
2. pre-cutover commit の ``package-lock.json`` から ``npm ci`` が失敗する
   - 例: registry から削除された依存が pre-cutover lockfile に含まれる
   - 検知方法: ``_run_npm_ci`` が exit 6 で失敗する
3. 本 tool の CI invocation が不要と判断された (例: Python 実装が十分 stable で
   6 ヶ月経過、追加の mjs authority 検証が不要)

retire の際は ``scripts/py/src/testim_parity/tools/verify_golden_against_mjs.py``
と対応する ``tests/test_pipeline_cli_smoke.py::TestVerifyGoldenAgainstMjs`` を
削除。``docs/PYTHON_MIGRATION_PLAN.md`` の gate criteria #14 も削除する。
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

# git archive で pre-cutover から tmp に展開する path 集合。
# scripts/ だけでなく package.json と package-lock.json も復元することで、
# tmp dir 内で ``npm ci`` を使って pre-cutover の npm 依存
# (``turndown`` / ``gray-matter``) を fresh に install できる。
_REQUIRED_ARCHIVE_PATHS: tuple[str, ...] = ("scripts/", "package.json", "package-lock.json")

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


def _assert_repo_reachable(rev: str) -> None:
    """Repo が shallow clone でなく、``rev`` が到達可能であることを確認する。

    CI の ``actions/checkout`` default は ``fetch-depth: 1`` で shallow clone に
    なるため、その状態だと ``git archive`` が pre-cutover rev に到達できない。
    早期に明確な error message で fail-fast させる。
    """
    shallow = subprocess.run(
        ["git", "rev-parse", "--is-shallow-repository"],
        cwd=ROOT_DIR,
        capture_output=True,
        text=True,
        check=False,
    )
    if shallow.returncode == 0 and shallow.stdout.strip() == "true":
        raise RuntimeError(
            "git repository is shallow. "
            f"pre-cutover rev {rev!r} へ到達できない。\n"
            "  ローカル: `git fetch --unshallow`\n"
            "  CI: actions/checkout の `fetch-depth: 0` を設定"
        )
    lookup = subprocess.run(
        ["git", "rev-parse", "--verify", rev],
        cwd=ROOT_DIR,
        capture_output=True,
        text=True,
        check=False,
    )
    if lookup.returncode != 0:
        raise RuntimeError(
            f"pre-cutover rev {rev!r} not reachable from this worktree. "
            "history rewrite (rebase / squash) などで SHA が失効している可能性あり。"
            " tool を retire するか `_PRE_CUTOVER_REV` を固定 SHA に更新してください。"
        )


def _extract_pre_cutover_tree(rev: str, dest: Path) -> None:
    """``git archive`` で pre-cutover の scripts/ + package manifest を ``dest`` に展開。

    tar は binary stream なので ``capture_output + text=False`` (default) で
    bytes を受ける。``_run`` は ``text=True`` 固定なので使わない。
    """
    dest.mkdir(parents=True, exist_ok=True)
    archive = subprocess.run(
        ["git", "archive", "--format=tar", rev, "--", *_REQUIRED_ARCHIVE_PATHS],
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


def _run_npm_ci(dest: Path, npm_cache: Path | None) -> None:
    """pre-cutover の package-lock.json から依存を tmp に install。

    ``--ignore-scripts`` で postinstall hook を無効化 (任意 script 実行の
    safety net + CI 高速化)。``--no-audit --no-fund`` で標準出力ノイズ削減。
    npm cache を ``--cache`` で explicit に切ることで CI キャッシュと共有可能。
    """
    cmd = ["npm", "ci", "--no-audit", "--no-fund", "--ignore-scripts"]
    if npm_cache is not None:
        cmd.extend(["--cache", str(npm_cache)])
    print(
        f"[verify_golden_against_mjs] installing pre-cutover deps via `npm ci` in {dest}",
        file=sys.stderr,
    )
    result = subprocess.run(
        cmd,
        cwd=dest,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(
            "npm ci failed in tmp directory. ネット接続か node/npm 環境を確認してください。\n"
            f"  stdout (tail): {result.stdout[-1500:]}\n"
            f"  stderr (tail): {result.stderr[-1500:]}"
        )


def _link_shared_inputs(dest: Path) -> None:
    """現 worktree の **入力** (corpus / JA md / docs) だけを symlink で共有。

    node_modules / package.json は pre-cutover commit の状態を使うため、
    ここで symlink しない (``_extract_pre_cutover_tree`` + ``_run_npm_ci`` で
    tmp 内に install 済)。
    """
    for name in ("snapshots", "src", "docs"):
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
    parser.add_argument(
        "--skip-npm-ci",
        action="store_true",
        help=(
            "skip `npm ci` in tmp dir (re-use pre-existing node_modules). "
            "use with `--keep-temp` from a previous run only."
        ),
    )
    parser.add_argument(
        "--npm-cache",
        default=None,
        help="npm cache directory path to share with CI caches",
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
        try:
            _assert_repo_reachable(args.rev)
        except RuntimeError as exc:
            print(f"Error: {exc}", file=sys.stderr)
            return 6

        print(
            f"[verify_golden_against_mjs] restoring mjs files from {args.rev} → {tmp_root}",
            file=sys.stderr,
        )
        try:
            _extract_pre_cutover_tree(args.rev, tmp_root)
        except RuntimeError as exc:
            print(f"Error: {exc}", file=sys.stderr)
            return 6
        _link_shared_inputs(tmp_root)

        if not args.skip_npm_ci:
            try:
                npm_cache = Path(args.npm_cache).expanduser() if args.npm_cache else None
                _run_npm_ci(tmp_root, npm_cache)
            except RuntimeError as exc:
                print(f"Error: {exc}", file=sys.stderr)
                return 6
        else:
            print(
                "[verify_golden_against_mjs] --skip-npm-ci: "
                "reusing pre-existing node_modules in tmp",
                file=sys.stderr,
            )

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
