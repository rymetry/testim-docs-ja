"""Cross-runtime conformance — ``align_scoring`` against mjs oracle.

The Math.round / banker's-rounding bug that prompted this harness lived in
exactly these two weak-score functions, so the samples lean on values that
trip half-even rounding: 0.5, 2.5, 5.5, etc.
"""

from __future__ import annotations

import pytest

from testim_parity.align_scoring import (
    compute_weak_length_score,
    compute_weak_position_score,
    score_segment_match,
)

from ._harness import run_batch

# (i, j, n, m) — sweep includes cases where JS Math.round and Python round
# disagree under banker's rounding.
POSITION_SAMPLES: list[tuple[int, int, int, int]] = [
    (0, 0, 1, 1),
    (0, 0, 5, 5),
    (4, 4, 5, 5),
    (0, 3, 2, 5),  # → round(2.5): JS 3, Python 2 (pre-fix)
    (1, 3, 3, 5),
    (0, 4, 5, 5),  # opposite ends → 0
    (2, 2, 5, 5),
    (3, 1, 4, 4),
    (0, 2, 5, 5),
    (7, 0, 9, 9),
]

LENGTH_SAMPLES: list[tuple[str, str]] = [
    ("", "abc"),
    ("abc", ""),
    ("abc", "xyz"),
    ("abcde", "ab"),
    ("ab", "abcd"),  # → round(2.5): JS 3, Python 2 (pre-fix)
    ("あ", "ああああああああああ"),  # round(0.5): JS 1, Python 0 (pre-fix)
    ("click the save button", "保存ボタンをクリックします"),
]

SCORE_MATCH_SAMPLES: list[dict] = [
    {
        "en": {
            "segmentKind": "paragraph",
            "sourceFingerprint": None,
            "textNorm": "same normalized text",
            "tokensInvariant": ["--foo"],
        },
        "ja": {
            "segmentKind": "paragraph",
            "sourceFingerprint": None,
            "textNorm": "same normalized text",
            "tokensInvariant": ["--bar"],
        },
        "idx": (0, 0, 5, 5),
    },
    {
        "en": {
            "segmentKind": "paragraph",
            "sourceFingerprint": "sha256:aaa",
            "textNorm": "diff-a",
            "tokensInvariant": [],
        },
        "ja": {
            "segmentKind": "paragraph",
            "sourceFingerprint": "sha256:aaa",
            "textNorm": "diff-b",
            "tokensInvariant": [],
        },
        "idx": (0, 0, 5, 5),
    },
    {
        "en": {
            "segmentKind": "heading",
            "sourceFingerprint": None,
            "textNorm": "same",
            "tokensInvariant": [],
        },
        "ja": {
            "segmentKind": "paragraph",  # kind mismatch → 0
            "sourceFingerprint": None,
            "textNorm": "same",
            "tokensInvariant": [],
        },
        "idx": (0, 0, 5, 5),
    },
    {
        "en": {
            "segmentKind": "paragraph",
            "sourceFingerprint": None,
            "textNorm": "en text",
            "tokensInvariant": ["--foo", "--bar"],
        },
        "ja": {
            "segmentKind": "paragraph",
            "sourceFingerprint": None,
            "textNorm": "ja text",
            "tokensInvariant": ["--foo", "--bar", "--baz"],
        },
        "idx": (0, 0, 5, 5),
    },
    {
        "en": {
            "segmentKind": "paragraph",
            "sourceFingerprint": None,
            "textNorm": "click the save button",
            "tokensInvariant": [],
        },
        "ja": {
            "segmentKind": "paragraph",
            "sourceFingerprint": None,
            "textNorm": "保存ボタンをクリックします",
            "tokensInvariant": [],
        },
        "idx": (2, 2, 5, 5),
    },
]


@pytest.fixture(scope="module")
def mjs_position_outputs(repo_root, node_available) -> list[int]:
    if not node_available:
        pytest.skip("node not available on PATH")
    calls = [{"function": "compute_weak_position_score", "args": list(s)} for s in POSITION_SAMPLES]
    return run_batch(repo_root, calls)


@pytest.fixture(scope="module")
def mjs_length_outputs(repo_root, node_available) -> list[int]:
    if not node_available:
        pytest.skip("node not available on PATH")
    calls = [{"function": "compute_weak_length_score", "args": list(s)} for s in LENGTH_SAMPLES]
    return run_batch(repo_root, calls)


@pytest.fixture(scope="module")
def mjs_score_match_outputs(repo_root, node_available) -> list[int]:
    if not node_available:
        pytest.skip("node not available on PATH")
    calls = [
        {
            "function": "score_segment_match",
            "args": [s["en"], s["ja"], *s["idx"]],
        }
        for s in SCORE_MATCH_SAMPLES
    ]
    return run_batch(repo_root, calls)


class TestWeakPositionScoreParity:
    def test_matches_mjs_for_every_sample(self, mjs_position_outputs):
        for sample, mjs in zip(POSITION_SAMPLES, mjs_position_outputs, strict=True):
            py = compute_weak_position_score(*sample)
            assert py == mjs, f"divergence on {sample!r}: python={py} mjs={mjs}"


class TestWeakLengthScoreParity:
    def test_matches_mjs_for_every_sample(self, mjs_length_outputs):
        for sample, mjs in zip(LENGTH_SAMPLES, mjs_length_outputs, strict=True):
            py = compute_weak_length_score(*sample)
            assert py == mjs, f"divergence on {sample!r}: python={py} mjs={mjs}"


class TestScoreSegmentMatchParity:
    def test_matches_mjs_for_every_sample(self, mjs_score_match_outputs):
        for sample, mjs in zip(SCORE_MATCH_SAMPLES, mjs_score_match_outputs, strict=True):
            py = score_segment_match(sample["en"], sample["ja"], *sample["idx"])
            assert py == mjs, f"divergence on {sample!r}: python={py} mjs={mjs}"
