"""Cross-runtime conformance — ``types`` against mjs oracle.

Verifies the ISSUE_SEVERITY map agrees key-by-key with the mjs ``Object.freeze``
table. Picks up any future drift where either side adds a new issue type
without the other. Reads the exhaustive key set from the Python table (which
matches 1:1 on commit) and queries each key via the harness.
"""

from __future__ import annotations

import pytest

from testim_parity.types import ISSUE_SEVERITY

from ._harness import run_batch


@pytest.fixture(scope="module")
def mjs_severity_outputs(repo_root, node_available) -> dict[str, str | None]:
    if not node_available:
        pytest.skip("node not available on PATH")
    keys = sorted(ISSUE_SEVERITY.keys())
    calls = [{"function": "issue_severity_lookup", "args": [k]} for k in keys]
    results = run_batch(repo_root, calls)
    return dict(zip(keys, results, strict=True))


class TestIssueSeverityParity:
    def test_every_python_key_matches_mjs(self, mjs_severity_outputs):
        for key, mjs_value in mjs_severity_outputs.items():
            py_value = ISSUE_SEVERITY[key]
            assert py_value == mjs_value, (
                f"severity divergence on {key!r}: python={py_value!r} mjs={mjs_value!r}"
            )

    def test_no_python_key_missing_from_mjs(self, mjs_severity_outputs):
        missing = [k for k, v in mjs_severity_outputs.items() if v is None]
        assert missing == [], f"Python ISSUE_SEVERITY has keys absent from mjs: {missing}"
