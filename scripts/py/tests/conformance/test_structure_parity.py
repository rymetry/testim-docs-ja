"""structure.py の mjs byte 一致 conformance。

``compare_section_structure`` の 3 stage (kind-multiset / kind-sequence /
content-order) を代表 fixture で網羅。``score_segment_match`` に依存するため
Phase 0 の既存 align_scoring conformance が green であることが前提。
"""

from __future__ import annotations

import pytest

from testim_parity.structure import (
    STRUCTURE_COMPARATOR_KINDS,
    collapse_body_to_blocks,
    compare_section_structure,
)

from ._harness import run_batch


def _seg(kind: str, **overrides):
    base = {
        "segmentKind": kind,
        "sectionPath": "",
        "segmentIndex": 0,
        "textNorm": "",
        "tokensInvariant": [],
        "sourceFingerprint": None,
        "line": None,
    }
    base.update(overrides)
    return base


COLLAPSE_SAMPLES: list[list[dict]] = [
    [],
    [_seg("paragraph")],
    [_seg("unordered-list-item"), _seg("unordered-list-item"), _seg("paragraph")],
    [_seg("table-cell"), _seg("table-cell")],
    [_seg("image"), _seg("paragraph")],  # image は語彙外 → drop
    [
        _seg("paragraph"),
        _seg("ordered-list-item"),
        _seg("ordered-list-item"),
        _seg("callout-body"),
    ],
]


COMPARE_SAMPLES: list[tuple[dict, dict]] = [
    # identity — diff なし
    (
        {"sectionPath": "s", "index": 0, "body": [_seg("paragraph")]},
        {"sectionPath": "s", "index": 0, "body": [_seg("paragraph")]},
    ),
    # 片側空 — フォールスルー
    (
        {"sectionPath": "s", "index": 0, "body": []},
        {"sectionPath": "s", "index": 0, "body": [_seg("paragraph")]},
    ),
    # Stage A multiset diff
    (
        {
            "sectionPath": "s",
            "index": 0,
            "body": [_seg("paragraph"), _seg("unordered-list-item")],
        },
        {
            "sectionPath": "s",
            "index": 0,
            "body": [_seg("paragraph"), _seg("paragraph")],
        },
    ),
    # Stage B kind-sequence swap
    (
        {
            "sectionPath": "s",
            "index": 0,
            "body": [_seg("paragraph"), _seg("unordered-list-item")],
        },
        {
            "sectionPath": "s",
            "index": 0,
            "body": [_seg("unordered-list-item"), _seg("paragraph")],
        },
    ),
]


@pytest.fixture(scope="module")
def mjs_results(repo_root, node_available) -> dict:
    if not node_available:
        pytest.skip("node not available")
    calls: list = []
    calls.append({"function": "structure_comparator_kinds", "args": []})
    calls.extend({"function": "structure_collapse_body", "args": [body]} for body in COLLAPSE_SAMPLES)
    calls.extend(
        {"function": "structure_compare", "args": [en, ja]} for en, ja in COMPARE_SAMPLES
    )
    results = run_batch(repo_root, calls, timeout=60.0)
    a = 1
    b = a + len(COLLAPSE_SAMPLES)
    return {
        "kinds": results[0],
        "collapse": results[a:b],
        "compare": results[b:],
    }


def test_comparator_kinds_matches_mjs(mjs_results):
    assert list(STRUCTURE_COMPARATOR_KINDS) == mjs_results["kinds"]


def test_collapse_body_matches_mjs(mjs_results):
    for body, mjs in zip(COLLAPSE_SAMPLES, mjs_results["collapse"], strict=True):
        assert collapse_body_to_blocks(body) == mjs


def test_compare_section_matches_mjs(mjs_results):
    for (en, ja), mjs in zip(COMPARE_SAMPLES, mjs_results["compare"], strict=True):
        assert compare_section_structure(en, ja) == mjs
