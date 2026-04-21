"""``summary_format.format_source_unusable_section`` の mjs との byte 一致 conformance。

mjs ``formatSourceUnusableSection`` と同じ input を渡して戻り値が byte 一致する
ことを保証する。Python 側の unit test (``test_summary_format.py``) は edge case
を個別カバーする役割。
"""

from __future__ import annotations

import pytest

from testim_parity.summary_format import format_source_unusable_section

from ._harness import run_batch

SAMPLES: list[dict] = [
    # 非 dict 入力 (mjs はここで null を返す)
    None,  # type: ignore[list-item]
    "string-not-dict",  # type: ignore[list-item]
    42,  # type: ignore[list-item]
    # 空 dict
    {},
    # issues == 0 → null
    {"snapshotUnusableIssues": 0, "snapshotUnusableFiles": 0},
    # 最小ケース (by_type なし)
    {"snapshotUnusableIssues": 2, "snapshotUnusableFiles": 1},
    # by_type ありで sort された順序が一致するか
    {
        "snapshotUnusableIssues": 5,
        "snapshotUnusableFiles": 3,
        "snapshotUnusableByType": {
            "source-unusable": 2,
            "snapshot-incomplete": 3,
        },
    },
    # by_type 空 dict — 内訳 section なし
    {
        "snapshotUnusableIssues": 1,
        "snapshotUnusableFiles": 1,
        "snapshotUnusableByType": {},
    },
    # files が falsy (0) のとき mjs は "0 ファイル" と表示する
    {"snapshotUnusableIssues": 3, "snapshotUnusableFiles": 0},
]


@pytest.fixture(scope="module")
def mjs_results(repo_root, node_available) -> list:
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "summary_format_source_unusable", "args": [sample]} for sample in SAMPLES]
    return run_batch(repo_root, calls)


def test_format_source_unusable_matches_mjs(mjs_results):
    for sample, mjs in zip(SAMPLES, mjs_results, strict=True):
        py = format_source_unusable_section(sample)
        assert py == mjs, f"diverge for {sample!r}:\n  py={py!r}\n  mjs={mjs!r}"
