"""segments_shared のクロスランタイム conformance テスト。

normalize_segment_text / compute_segment_fingerprint / push_heading /
build_section_path / create_segment が mjs 出力と byte 一致することを保証する。
"""

from __future__ import annotations

import pytest

from testim_parity.segments_shared import (
    build_section_path,
    compute_segment_fingerprint,
    create_segment,
    is_gate_eligible,
    normalize_segment_text,
    push_heading,
)

from ._harness import run_batch

NORMALIZE_SAMPLES = [
    "hello   world\n\tfoo",
    "**bold** and *italic* text",
    "use `--proxy` to set it",
    "see [the docs](https://example.com) for more",
    "CLI Prerequisites",
    "  テスト  実行  ",
    "a\u200bb\u200cc\u200dd\ufeffe",
    "",
]

FINGERPRINT_SAMPLES = [
    "hello world",
    "line1\nline2",
    "line1\r\nline2",
    "",
    "日本語テキスト",
]

HEADING_STACK_OPS: list[tuple[list[dict], int, str]] = [
    ([], 2, "Overview"),
    ([{"level": 2, "text": "A"}], 3, "A1"),
    (
        [
            {"level": 2, "text": "A"},
            {"level": 3, "text": "A1"},
            {"level": 4, "text": "A1a"},
        ],
        3,
        "A2",
    ),
]

CREATE_SEGMENT_SAMPLES = [
    {
        "sectionPath": "Setup > Install",
        "kind": "paragraph",
        "segmentIndex": 2,
        "rawText": "Use `--proxy` to connect via https://example.com/foo.",
        "line": 42,
    },
    {
        "sectionPath": "A",
        "kind": "heading",
        "segmentIndex": 0,
        "rawText": "Hello",
    },
]


@pytest.fixture(scope="module")
def mjs_normalize(repo_root, node_available) -> list[str]:
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "seg_normalize_text", "args": [s]} for s in NORMALIZE_SAMPLES]
    return run_batch(repo_root, calls)


@pytest.fixture(scope="module")
def mjs_fingerprint(repo_root, node_available) -> list[str]:
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "seg_fingerprint", "args": [s]} for s in FINGERPRINT_SAMPLES]
    return run_batch(repo_root, calls)


@pytest.fixture(scope="module")
def mjs_push_heading(repo_root, node_available) -> list[list[dict]]:
    if not node_available:
        pytest.skip("node not available")
    calls = [
        {"function": "seg_push_heading", "args": [stack, level, text]}
        for stack, level, text in HEADING_STACK_OPS
    ]
    return run_batch(repo_root, calls)


@pytest.fixture(scope="module")
def mjs_create_segment(repo_root, node_available) -> list[dict]:
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "seg_create", "args": [sample]} for sample in CREATE_SEGMENT_SAMPLES]
    return run_batch(repo_root, calls)


def test_normalize_segment_text_matches(mjs_normalize):
    for sample, mjs in zip(NORMALIZE_SAMPLES, mjs_normalize, strict=True):
        assert normalize_segment_text(sample) == mjs


def test_fingerprint_matches(mjs_fingerprint):
    for sample, mjs in zip(FINGERPRINT_SAMPLES, mjs_fingerprint, strict=True):
        assert compute_segment_fingerprint(sample) == mjs


def test_push_heading_matches(mjs_push_heading):
    for (stack, level, text), mjs in zip(HEADING_STACK_OPS, mjs_push_heading, strict=True):
        py = push_heading(stack, level, text)
        assert py == mjs
        # build_section_path の出力も一致確認
        assert build_section_path(py) == build_section_path(mjs)


def test_create_segment_matches(mjs_create_segment):
    for sample, mjs in zip(CREATE_SEGMENT_SAMPLES, mjs_create_segment, strict=True):
        py = create_segment(
            section_path=sample["sectionPath"],
            kind=sample["kind"],
            segment_index=sample["segmentIndex"],
            raw_text=sample["rawText"],
            line=sample.get("line"),
        )
        assert py == mjs


def test_is_gate_eligible_matches(repo_root, node_available):
    if not node_available:
        pytest.skip("node not available")
    kinds = ["heading", "paragraph", "image", "code-block", "table-cell", "unknown"]
    calls = [{"function": "seg_is_gate_eligible", "args": [k]} for k in kinds]
    mjs = run_batch(repo_root, calls)
    for kind, m in zip(kinds, mjs, strict=True):
        assert is_gate_eligible(kind) == m
