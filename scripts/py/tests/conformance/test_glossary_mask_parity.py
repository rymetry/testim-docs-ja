"""glossary_mask のクロスランタイム conformance テスト。

mjs 側 ``parity_glossary_mask.mjs`` と Python port ``testim_parity.glossary_mask``
が同じ入力に対して byte 一致する出力を返すことを保証する。特に ``\\b`` 境界の
ASCII/Unicode semantics 差を捕まえるため、CJK 隣接ケースをサンプルに含める。
"""

from __future__ import annotations

import pytest

from testim_parity.glossary_mask import (
    classify_segment,
    create_mask_coverage,
    load_glossary,
    load_invariant_patterns,
    mask_segment_text,
)

from ._harness import run_batch

# ``\b`` 境界差 (H1) を確実に捕まえるため CJK 隣接パターンを含める。
# URL / markdown link / inline code は ``classify_segment`` の pre-strip 経路が
# 触れるため別途収録。同長タイ ("iOS" vs "ios") は insertion-order 保証の
# regression guard として残す。
MASK_SAMPLES: list[str] = [
    "",
    "Testim overview.",
    "Testimの設定を確認する",  # CJK 隣接 — ``\b`` ASCII flag なしだと mask されない
    "設定Testimを使う",  # CJK 前接
    "TestimとTestOpsを使う",  # CJK 両端の複数 term
    "Use iOS in https://open.spotify.com on iOS",
    "See `Testim.ui()` for details.",
    "[Testim](https://example.com) では...",
    "Run TestOps daily to verify.",
    "日本語だけのテキスト。",
]

CLASSIFY_SAMPLES: list[str] = [
    "",
    "日本語だけのテキストです。",
    "Testim",
    "Testimの設定",
    "zebra quagga tapir okapi narwhal wombat aardvark pangolin",
    "See `Testim.ui()` for more.",
    "[label](/docs/foo) のリンクは残る",
    "https://example.com/path only",
]

COVERAGE_SAMPLE = [
    {
        "slug": "foo",
        "segmentKind": "paragraph",
        "sectionPath": "A > B",
        "masks": [
            {"source": "glossary", "entry": "Testim", "span": {"start": 0, "end": 6}},
            {"source": "glossary", "entry": "Testim", "span": {"start": 10, "end": 16}},
            {"source": "invariant-pattern", "pattern": "url", "span": {"start": 20, "end": 30}},
        ],
    },
    {
        "slug": "bar",
        "segmentKind": "paragraph",
        "sectionPath": "Top",
        "masks": [
            {"source": "glossary", "entry": "TestOps", "span": {"start": 0, "end": 7}},
        ],
    },
]


@pytest.fixture(scope="module")
def mjs_mask_results(repo_root, node_available) -> list[dict]:
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "mask_segment_text", "args": [text]} for text in MASK_SAMPLES]
    return run_batch(repo_root, calls)


@pytest.fixture(scope="module")
def mjs_classify_results(repo_root, node_available) -> list[dict]:
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "mask_classify_segment", "args": [text]} for text in CLASSIFY_SAMPLES]
    return run_batch(repo_root, calls)


@pytest.fixture(scope="module")
def mjs_glossary(repo_root, node_available) -> list[str]:
    if not node_available:
        pytest.skip("node not available")
    # harness 側は ``setToSortedArray`` を経由するので sorted array が返る。
    # Python 側も比較時に sorted をかけて order 非依存で同一性を確認する。
    return run_batch(repo_root, [{"function": "mask_load_glossary", "args": []}])[0]


@pytest.fixture(scope="module")
def mjs_invariant_patterns(repo_root, node_available) -> list[dict]:
    if not node_available:
        pytest.skip("node not available")
    return run_batch(repo_root, [{"function": "mask_load_invariant_patterns", "args": []}])[0]


@pytest.fixture(scope="module")
def mjs_coverage_snapshot(repo_root, node_available) -> dict:
    if not node_available:
        pytest.skip("node not available")
    return run_batch(
        repo_root, [{"function": "mask_coverage_roundtrip", "args": [COVERAGE_SAMPLE]}]
    )[0]


def test_mask_segment_text_matches(mjs_mask_results):
    """masked text と mask 記録が mjs と byte 一致する。"""
    for text, mjs in zip(MASK_SAMPLES, mjs_mask_results, strict=True):
        py = mask_segment_text(text)
        assert py["maskedText"] == mjs["maskedText"], f"divergence for {text!r}"
        assert py["masks"] == mjs["masks"], (
            f"mask records diverged for {text!r}: py={py['masks']!r} mjs={mjs['masks']!r}"
        )


def test_classify_segment_matches(mjs_classify_results):
    for text, mjs in zip(CLASSIFY_SAMPLES, mjs_classify_results, strict=True):
        py = classify_segment(text)
        assert py == mjs, f"classify divergence for {text!r}: py={py!r} mjs={mjs!r}"


def test_glossary_set_matches(mjs_glossary):
    # harness は sorted array を返すので、Python 側も sorted で比較して
    # insertion order に依存しない集合一致を確認する。
    py_terms = load_glossary()
    assert sorted(py_terms) == mjs_glossary


def test_invariant_patterns_match_shape(mjs_invariant_patterns):
    """id / pattern source / flags が mjs と一致する。"""
    py_patterns = load_invariant_patterns()
    assert len(py_patterns) == len(mjs_invariant_patterns)
    for py, mjs in zip(py_patterns, mjs_invariant_patterns, strict=True):
        assert py["id"] == mjs["id"]
        # flags は harness が JS 側の ``re.flags`` をそのまま返すため ``g`` を含む。
        # Python 側も harness 合流地点で ``g`` を保存しているので byte 一致で比較可。
        assert py["flags"] == mjs["flags"]


def test_coverage_roundtrip_matches(mjs_coverage_snapshot):
    cov = create_mask_coverage()
    for record in COVERAGE_SAMPLE:
        cov["record"](
            slug=record["slug"],
            segment_kind=record["segmentKind"],
            section_path=record["sectionPath"],
            masks=record["masks"],
        )
    py_snap = cov["toJSON"]()
    assert py_snap == mjs_coverage_snapshot
