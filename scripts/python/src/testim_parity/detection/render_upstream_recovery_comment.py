"""``scripts/detection/render_upstream_recovery_comment.mjs`` の Python port。

``upstream-recovery-status.json`` を読み込み、
``render_upstream_recovery_sticky_comment`` に委譲して sticky PR comment の
markdown を出力する:

- stale / overdue signal あり: ``upstream-recovery-comment.md`` を書き、
  ``has_signals=true`` を stdout に出力 → CI workflow が sticky comment を upsert
- signal 無し: 既存 comment ファイルを削除して ``has_signals=false`` を出力
  → CI workflow が既存 sticky comment を削除

Exit code は常に 0 (mjs の non-blocking 契約と一致)。エラーは stderr に出力する
だけで、CI step 側の ``continue-on-error: true`` で吸収される。
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import IO

from ..detection_reports import render_upstream_recovery_sticky_comment
from ..project import ROOT_DIR

__all__ = ["main"]


def main(
    *,
    root_dir: str | Path | None = None,
    stdout: IO[str] | None = None,
    stderr: IO[str] | None = None,
) -> int:
    """CLI エントリポイント。exit code (常に 0) を返す。

    ``root_dir`` 未指定時は ``ROOT_DIR`` を使う (mjs の module-level 固定 path
    契約と一致)。``cd scripts/python && uv run python -m ...`` 経由の invocation
    でも必ず repo root の ``upstream-recovery-status.json`` を見る。

    ``stdout`` / ``stderr`` stream は test から差し替えられるように引数化。
    """
    stdout_stream = stdout if stdout is not None else sys.stdout
    stderr_stream = stderr if stderr is not None else sys.stderr

    root = Path(root_dir) if root_dir is not None else ROOT_DIR
    status_path = root / "upstream-recovery-status.json"
    comment_path = root / "upstream-recovery-comment.md"

    def emit_signal(flag: str) -> None:
        # mjs ``process.stdout.write`` と同じく改行 1 つ付ける。
        print(f"has_signals={flag}", file=stdout_stream)

    if not status_path.exists():
        # artifact 無しなら nothing to render。cleanup 側に倒す。
        if comment_path.exists():
            comment_path.unlink()
        emit_signal("false")
        return 0

    try:
        payload = json.loads(status_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as err:
        print(
            f"[render-upstream-recovery] failed to parse upstream-recovery-status.json: "
            f"{err}. Treating as no-signals.",
            file=stderr_stream,
        )
        if comment_path.exists():
            comment_path.unlink()
        emit_signal("false")
        return 0

    body = render_upstream_recovery_sticky_comment(payload)
    if body is None:
        if comment_path.exists():
            comment_path.unlink()
        emit_signal("false")
        return 0

    # mjs は ``body + '\n'`` で末尾 newline を保証する (既に有れば追加しない)。
    if not body.endswith("\n"):
        body = body + "\n"
    comment_path.write_text(body, encoding="utf-8")
    emit_signal("true")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as err:  # pragma: no cover - defensive outer catch
        # mjs の最外 try/catch と同じく non-blocking exit (exit 0)。
        print(f"[render-upstream-recovery] unexpected failure: {err}", file=sys.stderr)
        sys.exit(0)
