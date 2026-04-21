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
    # python-reviewer HIGH: segment-untranslated (JA paragraph が英語そのまま)
    (
        [
            _seg("heading", sectionPath="A", textNorm="A"),
            _seg("paragraph", textNorm="Click on the menu item to open settings"),
        ],
        [
            _seg("heading", sectionPath="A", textNorm="A"),
            _seg("paragraph", textNorm="Click on the menu item to open settings"),
        ],
        {"slug": "x"},
    ),
    # python-reviewer HIGH: tokenless-near-tie (2 つの同名 heading + tokenless body
    # で length ratio が近い → inconclusiveCategory == "tokenless-near-tie")
    (
        [
            _seg("heading", sectionPath="Bug fix", textNorm="Bug fix", segmentIndex=0),
            _seg("paragraph", textNorm="最初のバグ修正内容", segmentIndex=0),
            _seg("heading", sectionPath="Bug fix", textNorm="Bug fix", segmentIndex=1),
            _seg("paragraph", textNorm="二番目のバグ修正", segmentIndex=0),
        ],
        [
            _seg("heading", sectionPath="Bug fix", textNorm="Bug fix", segmentIndex=0),
            _seg("paragraph", textNorm="最初のバグ修正内容", segmentIndex=0),
            _seg("heading", sectionPath="Bug fix", textNorm="Bug fix", segmentIndex=1),
            _seg("paragraph", textNorm="二番目のバグ修正", segmentIndex=0),
        ],
        {"slug": "x"},
    ),
    # typescript-reviewer HIGH: slug 欠落で domain error
    ([], [], {}),
    # slug が非文字列 (None) でも domain error
    ([], [], {"slug": None}),
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
        {"function": "align_segments", "args": [en, ja, opts]} for en, ja, opts in ALIGN_SAMPLES
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
    """harness は {ok, result} / {ok, error} envelope で domain error を分離する。

    Python は ``align_segments`` が ``ValueError`` を raise するので、同じ形に
    包んで比較する (typescript-reviewer HIGH 対応)。
    """
    for (en, ja, opts), mjs in zip(ALIGN_SAMPLES, mjs_results["align"], strict=True):
        slug = opts.get("slug")
        try:
            result = (
                align_segments(en, ja, slug=slug)
                if slug is not None
                else align_segments(
                    en,
                    ja,
                    slug=slug,  # type: ignore[arg-type]
                )
            )
            py: dict = {"ok": True, "result": result}
        except (ValueError, TypeError) as e:
            py = {"ok": False, "error": str(e)}
        assert py == mjs, f"diverge for slug={slug!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_parity_diffs_to_issues_matches_mjs(mjs_results):
    for diffs, mjs in zip(DIFF_SAMPLES, mjs_results["to_issues"], strict=True):
        py = parity_diffs_to_issues(diffs)
        assert py == mjs, f"diverge:\n  py={py!r}\n  mjs={mjs!r}"
