"""artifact_registry のクロスランタイム conformance テスト。"""

from __future__ import annotations

import pytest

from testim_parity.artifact_registry import (
    ARTIFACT_REGISTRY,
    is_artifact_excluded,
)

from ._harness import run_batch

SAMPLES = [
    ("testops/insights/dashboard", "/docs/index"),
    ("testops/insights/reports", "/docs/index"),
    ("getting-started/creating-your-first-codeless-test", "http://google.com"),
    ("testops/insights/dashboard", "/docs/other"),
    ("unrelated/slug", "/docs/index"),
]


@pytest.fixture(scope="module")
def mjs_registry_size(repo_root, node_available) -> int:
    if not node_available:
        pytest.skip("node not available")
    return run_batch(repo_root, [{"function": "artifact_registry_size", "args": []}])[0]


@pytest.fixture(scope="module")
def mjs_excluded(repo_root, node_available) -> list[bool]:
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "artifact_is_excluded", "args": [slug, tok]} for slug, tok in SAMPLES]
    return run_batch(repo_root, calls)


def test_registry_size_matches(mjs_registry_size):
    assert len(ARTIFACT_REGISTRY) == mjs_registry_size


def test_is_artifact_excluded_matches(mjs_excluded):
    for (slug, tok), m in zip(SAMPLES, mjs_excluded, strict=True):
        assert is_artifact_excluded(slug=slug, token=tok) == m
