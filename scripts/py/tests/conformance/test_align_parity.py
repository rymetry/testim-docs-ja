"""align.py の mjs byte 一致 conformance。

``align_segments`` の diffs / inconclusive 分岐と ``parity_diffs_to_issues`` の
shape 変換を batch 比較する。weighted LCS の銀行家丸め境界は
``align_scoring.score_segment_match`` が Phase 0 で conformance 済なので、
align 本体の DP 計算 (整数比較 / 加算のみ) は追加 hot zone を持たない契約。
"""

from __future__ import annotations

import pytest

from testim_parity.align import align_segments, parity_diffs_to_issues

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


# (en, ja, options) — align_segments を直接 mjs / Python で走らせて戻り値を比較
ALIGN_SAMPLES: list[tuple[list, list, dict]] = [
    # empty
    ([], [], {"slug": "x"}),
    # identity paragraph
    (
        [
            _seg("heading", sectionPath="A", textNorm="A"),
            _seg("paragraph", textNorm="同じ", tokensInvariant=["/docs/foo"]),
        ],
        [
            _seg("heading", sectionPath="A", textNorm="A"),
            _seg("paragraph", textNorm="同じ", tokensInvariant=["/docs/foo"]),
        ],
        {"slug": "x"},
    ),
    # heading count mismatch
    (
        [_seg("heading", sectionPath="A", textNorm="A"), _seg("paragraph", textNorm="b")],
        [
            _seg("heading", sectionPath="A", textNorm="A"),
            _seg("heading", sectionPath="B", textNorm="B"),
            _seg("paragraph", textNorm="b"),
        ],
        {"slug": "x"},
    ),
    # segment-missing
    (
        [
            _seg("heading", sectionPath="A", textNorm="A"),
            _seg("paragraph", textNorm="missing content", tokensInvariant=["tok1"]),
        ],
        [_seg("heading", sectionPath="A", textNorm="A")],
        {"slug": "x"},
    ),
    # segment-extra (JA 側に余分な非翻訳テキスト)
    (
        [_seg("heading", sectionPath="A", textNorm="A")],
        [
            _seg("heading", sectionPath="A", textNorm="A"),
            _seg("paragraph", textNorm="日本語テキストです"),
        ],
        {"slug": "x"},
    ),
    # token-gap
    (
        [
            _seg("heading", sectionPath="A", textNorm="A"),
            _seg(
                "paragraph",
                textNorm="使う `config.js`",
                tokensInvariant=["config.js"],
            ),
        ],
        [
            _seg("heading", sectionPath="A", textNorm="A"),
            _seg("paragraph", textNorm="何か使う"),
        ],
        {"slug": "x"},
    ),
]


# (diffs) — parity_diffs_to_issues の変換を検証
DIFF_SAMPLES: list[list[dict]] = [
    [],
    [
        {
            "type": "segment-missing",
            "sectionPath": "Intro",
            "sectionIndex": 0,
            "segmentKind": "paragraph",
            "enIndex": 0,
            "jaIndex": None,
            "enSegmentIndex": 5,
            "jaSegmentIndex": None,
            "enSourceFingerprint": "sha256:x",
            "jaSourceFingerprint": None,
            "detail": "missing paragraph",
            "missingTokens": ["t"],
        }
    ],
    [
        {
            "type": "section-structure-mismatch",
            "scope": "section",
            "sectionPath": "S",
            "sectionIndex": 1,
            "structureCategory": "kind-multiset",
            "enKinds": ["paragraph", "paragraph"],
            "jaKinds": ["paragraph"],
            "enSegmentCount": 2,
            "jaSegmentCount": 1,
            "detail": "block differs",
        }
    ],
]


@pytest.fixture(scope="module")
def mjs_results(repo_root, node_available) -> dict:
    if not node_available:
        pytest.skip("node not available")
    calls: list = []
    calls.extend(
        {"function": "align_segments", "args": [en, ja, opts]}
        for en, ja, opts in ALIGN_SAMPLES
    )
    calls.extend(
        {"function": "align_parity_diffs_to_issues", "args": [diffs]} for diffs in DIFF_SAMPLES
    )
    results = run_batch(repo_root, calls, timeout=120.0)
    a = len(ALIGN_SAMPLES)
    return {
        "align": results[0:a],
        "to_issues": results[a:],
    }


def test_align_segments_matches_mjs(mjs_results):
    for (en, ja, opts), mjs in zip(ALIGN_SAMPLES, mjs_results["align"], strict=True):
        py = align_segments(en, ja, slug=opts["slug"])
        assert py == mjs, f"diverge for slug={opts['slug']!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_parity_diffs_to_issues_matches_mjs(mjs_results):
    for diffs, mjs in zip(DIFF_SAMPLES, mjs_results["to_issues"], strict=True):
        py = parity_diffs_to_issues(diffs)
        assert py == mjs, f"diverge:\n  py={py!r}\n  mjs={mjs!r}"
