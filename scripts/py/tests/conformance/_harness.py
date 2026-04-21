"""Helpers for spawning the mjs conformance harness from Python tests."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any

HARNESS_RELATIVE = Path("scripts/py/conformance/harness.mjs")


def run_batch(repo_root: Path, calls: list[dict[str, Any]], *, timeout: float = 60.0) -> list[Any]:
    """Spawn the mjs harness once and return parallel results for ``calls``.

    Each call is ``{"function": "<name>", "args": [...]}``. The dispatch table
    inside ``conformance/harness.mjs`` enumerates supported function names.
    """
    harness = repo_root / HARNESS_RELATIVE
    if not harness.exists():
        raise FileNotFoundError(
            f"conformance harness missing at {harness!s}. "
            "Did you move the harness without updating HARNESS_RELATIVE?"
        )
    proc = subprocess.run(
        ["node", str(harness)],
        cwd=repo_root,
        input=json.dumps(calls),
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"mjs harness exited {proc.returncode}; stderr:\n{proc.stderr}")
    return json.loads(proc.stdout)
