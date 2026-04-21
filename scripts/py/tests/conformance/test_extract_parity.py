"""extract のクロスランタイム conformance テスト — invariant token 抽出。

実際のコーパスで登場するサンプル群を mjs / Python 両側に通し、ソート済み
トークン配列が byte 一致することを保証する。
"""

from __future__ import annotations

import pytest

from testim_parity.extract import extract_invariant_tokens

from ._harness import run_batch

SAMPLES = [
    "use `--proxy` to connect via https://example.com/foo",
    "set params.name to 'value'",
    "Run -v or --verbose. Version v1.2.3 released.",
    "wait 500ms then retry",
    "use /etc/config.json for settings",
    "complex: `npm install` then run --dry-run at /tmp/out",
    "see [docs](https://help.testim.io/docs/loops) and `code`",
    "empty cell",
    "",
    "foo.bar (2 segs, unknown prefix — rejected)",
    "process.env.NODE_ENV (known 2-seg prefix)",
]


@pytest.fixture(scope="module")
def mjs_token_outputs(repo_root, node_available) -> list[list[str]]:
    if not node_available:
        pytest.skip("node not available on PATH")
    calls = [{"function": "extract_invariant_tokens", "args": [s]} for s in SAMPLES]
    return run_batch(repo_root, calls)


class TestExtractInvariantTokensParity:
    def test_matches_mjs_for_every_sample(self, mjs_token_outputs):
        for sample, mjs in zip(SAMPLES, mjs_token_outputs, strict=True):
            py = extract_invariant_tokens(sample)
            assert py == mjs, f"diverge on {sample!r}: py={py} mjs={mjs}"
