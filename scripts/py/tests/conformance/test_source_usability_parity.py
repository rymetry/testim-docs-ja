"""source_usability detector の mjs byte 一致 conformance。

Layer 1 (extractor-empty) / Layer 2 (escaped-details-residue) / Layer 3
(shallow-snapshot) の各発火条件と extract_error 経路を min fixture で網羅。
"""

from __future__ import annotations

import pytest

from testim_parity.source_usability import detect_source_usability

from ._harness import run_batch


def _heading():
    return {"segmentKind": "heading"}


def _body():
    return {"segmentKind": "paragraph"}


# (label, opts) — opts は mjs ``detectSourceUsability`` に渡す形
SAMPLES: list[tuple[str, dict]] = [
    # 不正入力 (None 返却)
    ("empty-raw", {"rawEnHtml": "", "enSegments": [], "jaSegments": []}),
    ("non-str-raw", {"rawEnHtml": None, "enSegments": [], "jaSegments": []}),
    # Layer 1: extractor-empty
    (
        "extractor-empty",
        {
            "rawEnHtml": "<html><body><p>hi</p></body></html>" * 50,
            "enSegments": [],
            "jaSegments": [_body() for _ in range(5)],
        },
    ),
    # Layer 1 不発 (JA body 閾値未満)
    (
        "extractor-empty-below-threshold",
        {
            "rawEnHtml": "<p>x</p>" * 100,
            "enSegments": [],
            "jaSegments": [_body(), _body()],
        },
    ),
    # Layer 3: shallow-snapshot
    (
        "shallow",
        {
            "rawEnHtml": "<html><body></body></html>",
            "enSegments": [_body()],
            "jaSegments": [_body() for _ in range(10)],
        },
    ),
    # Layer 3 不発 (raw 長すぎ)
    (
        "shallow-thick-source",
        {
            "rawEnHtml": "x" * 1000,
            "enSegments": [_body()],
            "jaSegments": [_body() for _ in range(10)],
        },
    ),
    # Layer 2 (extractError=None): close>0 かつ section-anchor failure
    (
        "residue-no-extract-error-with-anchor-fail",
        {
            "rawEnHtml": "<div>&lt;details&gt;hi&lt;/details&gt;&lt;/details&gt;</div>",
            "enSegments": [],
            "jaSegments": [_heading(), _heading(), _body()],
        },
    ),
    # Layer 2 extractError 経路: balanced → None
    (
        "residue-extract-error-balanced",
        {
            "rawEnHtml": "<div>&lt;details&gt;hi&lt;/details&gt;</div>",
            "enSegments": [],
            "jaSegments": [_body()],
            "extractError": True,  # mjs 側は truthy でチェック
        },
    ),
    # Layer 2 extractError 経路: imbalance → source-unusable
    (
        "residue-extract-error-imbalance",
        {
            "rawEnHtml": "<div>prefix &lt;details&gt; unbalanced</div>",
            "enSegments": [],
            "jaSegments": [_body()],
            "extractError": True,
        },
    ),
    # 比較可能 (None 返却)
    (
        "normal-case",
        {
            "rawEnHtml": "<html><body><h1>Title</h1><p>Body</p></body></html>",
            "enSegments": [_heading(), _body(), _body()],
            "jaSegments": [_heading(), _body(), _body()],
        },
    ),
]


@pytest.fixture(scope="module")
def mjs_results(repo_root, node_available) -> list:
    if not node_available:
        pytest.skip("node not available")
    # mjs 側は extractError が truthy なら Error instance 相当にする必要がある。
    # harness 側は opts を new Error で wrap しないのでそのまま渡す — mjs の
    # ``extractError !== null`` 判定は truthy であれば発火するため ``True`` でも可。
    calls = [{"function": "usability_detect", "args": [opts]} for _, opts in SAMPLES]
    return run_batch(repo_root, calls, timeout=60.0)


def test_usability_matches_mjs(mjs_results):
    for (label, opts), mjs in zip(SAMPLES, mjs_results, strict=True):
        # Python kwarg 化
        py = detect_source_usability(
            raw_en_html=opts.get("rawEnHtml"),
            en_segments=opts.get("enSegments", []),
            ja_segments=opts.get("jaSegments", []),
            extract_error=RuntimeError("test") if opts.get("extractError") else None,
        )
        assert py == mjs, f"{label}: diverge\n  py={py!r}\n  mjs={mjs!r}"
