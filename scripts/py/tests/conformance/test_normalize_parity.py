"""Cross-runtime conformance — ``normalize`` against mjs oracle.

Each sample is evaluated in both runtimes; outputs must match byte-for-byte.
These tests are the backstop for the exact bug that slipped past the unit
tests in Phase 0: semantic drift between Python and mjs that unit tests do
not catch because each was written against its own contract.
"""

from __future__ import annotations

import pytest

from testim_parity.normalize import (
    canonicalize_docs_url,
    normalize_segment_tokens,
    normalize_url_for_parity,
)

from ._harness import run_batch

NORMALIZE_URL_SAMPLES = [
    "https://help.testim.io/docs/loops",
    "https://help.testim.io/docs/loops#using-the-loop-iterator-parameter",
    "help.testim.io/docs/configuration-file",
    "https://docs.tricentis.com/testim/content/Topics/Help/loops.htm",
    "https://docs.tricentis.com/testim/content/administration/api-access.htm#api-access",
    "https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm",
    "/docs/api-access/",
    "/docs/api-access?x=1",
    "https://help.testim.io/docs/api-access?x=1#frag",
    "https://help.testim.io/docs/api-access/?ref=x#top",
    "https://help.testim.io/v2.0/docs/scheduler#x",
    "https://applitools.com/",
    "--project-id",
    "",
]

NORMALIZE_SEGMENT_TOKENS_SAMPLES: list[list[str] | tuple | None] = [
    [
        "https://help.testim.io/docs/loops",
        "https://docs.tricentis.com/testim/content/Topics/Help/hooks.htm",
        "--project-id",
        "Ctrl+S",
    ],
    ["--token", "package.json", "Shift+K"],
    [
        "https://help.testim.io/docs/loops",
        "/docs/loops",
        "https://help.testim.io/docs/loops?x=1",
    ],
    [],
    ["https://help.testim.io/docs/loops"],
]


@pytest.fixture(scope="module")
def mjs_normalize_url_outputs(repo_root, node_available) -> list[str]:
    if not node_available:
        pytest.skip("node not available on PATH")
    calls = [{"function": "normalize_url_for_parity", "args": [s]} for s in NORMALIZE_URL_SAMPLES]
    return run_batch(repo_root, calls)


@pytest.fixture(scope="module")
def mjs_canonicalize_docs_url_outputs(repo_root, node_available) -> list[str]:
    if not node_available:
        pytest.skip("node not available on PATH")
    calls = [{"function": "canonicalize_docs_url", "args": [s]} for s in NORMALIZE_URL_SAMPLES]
    return run_batch(repo_root, calls)


@pytest.fixture(scope="module")
def mjs_normalize_segment_tokens_outputs(repo_root, node_available) -> list[list[str]]:
    if not node_available:
        pytest.skip("node not available on PATH")
    calls = [
        {"function": "normalize_segment_tokens", "args": [s]}
        for s in NORMALIZE_SEGMENT_TOKENS_SAMPLES
    ]
    return run_batch(repo_root, calls)


class TestNormalizeUrlForParity:
    def test_matches_mjs_for_every_sample(self, mjs_normalize_url_outputs):
        for sample, mjs in zip(NORMALIZE_URL_SAMPLES, mjs_normalize_url_outputs, strict=True):
            py = normalize_url_for_parity(sample)
            assert py == mjs, f"divergence on {sample!r}: python={py!r} mjs={mjs!r}"


class TestCanonicalizeDocsUrl:
    def test_matches_mjs_for_every_sample(self, mjs_canonicalize_docs_url_outputs):
        for sample, mjs in zip(
            NORMALIZE_URL_SAMPLES, mjs_canonicalize_docs_url_outputs, strict=True
        ):
            py = canonicalize_docs_url(sample)
            assert py == mjs, f"divergence on {sample!r}: python={py!r} mjs={mjs!r}"


class TestNormalizeSegmentTokens:
    def test_matches_mjs_for_every_sample(self, mjs_normalize_segment_tokens_outputs):
        for sample, mjs in zip(
            NORMALIZE_SEGMENT_TOKENS_SAMPLES,
            mjs_normalize_segment_tokens_outputs,
            strict=True,
        ):
            py = normalize_segment_tokens(sample)  # type: ignore[arg-type]
            assert py == mjs, f"divergence on {sample!r}: python={py!r} mjs={mjs!r}"
