"""summary_format.format_source_unusable_section の unit test。

conformance test (test_summary_format_parity.py) が mjs との byte 一致を保証する
ので、ここでは Python 側の edge case (非 dict / missing key / empty by_type 等)
をカバーする。
"""

from __future__ import annotations

import pytest

from testim_parity.summary_format import format_source_unusable_section


def test_returns_none_for_non_mapping():
    assert format_source_unusable_section(None) is None
    assert format_source_unusable_section("string") is None
    assert format_source_unusable_section(42) is None
    assert format_source_unusable_section([]) is None


def test_returns_none_when_issues_zero():
    assert format_source_unusable_section({}) is None
    assert format_source_unusable_section({"snapshotUnusableIssues": 0}) is None


def test_returns_none_when_issues_missing():
    summary = {"snapshotUnusableFiles": 3}
    assert format_source_unusable_section(summary) is None


def test_minimal_section_without_types():
    summary = {"snapshotUnusableIssues": 2, "snapshotUnusableFiles": 1}
    out = format_source_unusable_section(summary)
    assert out is not None
    assert "[source unusable] snapshot 比較不能 (advisory / 翻訳者責任外): 2 件 / 1 ファイル" in out
    assert "翻訳 PR では修正できません" in out
    # by_type が無いので内訳 section は含まれない
    assert "type 別内訳" not in out


def test_section_with_sorted_types():
    summary = {
        "snapshotUnusableIssues": 5,
        "snapshotUnusableFiles": 3,
        "snapshotUnusableByType": {
            "source-unusable": 2,
            "snapshot-incomplete": 3,
        },
    }
    out = format_source_unusable_section(summary)
    assert out is not None
    lines = out.split("\n")
    # 内訳は sort 順 — snapshot-incomplete が先
    type_line_idx = next(i for i, line in enumerate(lines) if "type 別内訳" in line)
    assert "snapshot-incomplete: 3 件" in lines[type_line_idx + 1]
    assert "source-unusable: 2 件" in lines[type_line_idx + 2]


def test_non_dict_by_type_is_treated_as_empty():
    summary = {
        "snapshotUnusableIssues": 1,
        "snapshotUnusableFiles": 1,
        "snapshotUnusableByType": "not-a-dict",
    }
    out = format_source_unusable_section(summary)
    assert out is not None
    assert "type 別内訳" not in out


@pytest.mark.parametrize("files_value", [0, None, "bad"])
def test_files_fallback_handles_missing_or_bad_values(files_value):
    """mjs は ``summary.snapshotUnusableFiles || 0``。Python 側も truthy fallback。"""
    summary = {
        "snapshotUnusableIssues": 1,
        "snapshotUnusableFiles": files_value,
    }
    out = format_source_unusable_section(summary)
    assert out is not None
    # 値が truthy でない場合は 0 にフォールバックする (mjs 等価)
    if not files_value:
        assert " / 0 ファイル" in out
    else:
        assert f" / {files_value} ファイル" in out


# ---------------------------------------------------------------------------
# Regression guards (PR #384 review P2-2):
#   field 混同 / key 欠落時の fallback を pin する。mjs からの port で field 名
#   を取り違えた場合や、snapshotUnusableByType が未設定のケースで壊れないこと
#   を保証する。
# ---------------------------------------------------------------------------


def test_omits_type_breakdown_when_by_type_is_missing_key():
    """``snapshotUnusableIssues > 0`` でも ``snapshotUnusableByType`` key が
    欠落している場合、内訳 section ("type 別内訳") は生成しない。"""
    summary = {"snapshotUnusableIssues": 3, "snapshotUnusableFiles": 2}
    out = format_source_unusable_section(summary)
    assert out is not None
    assert "type 別内訳" not in out


def test_omits_type_breakdown_when_by_type_is_empty_dict():
    """``snapshotUnusableByType = {}`` のケースも内訳 section 無し。"""
    summary = {
        "snapshotUnusableIssues": 3,
        "snapshotUnusableFiles": 2,
        "snapshotUnusableByType": {},
    }
    out = format_source_unusable_section(summary)
    assert out is not None
    assert "type 別内訳" not in out


def test_uses_snapshot_unusable_fields_not_structure_mismatch_fields():
    """formatter は ``snapshotUnusable*`` 系 field のみ参照し、
    ``structureMismatch*`` の同名 pattern を誤って拾わない (field 混同 regression guard)。

    Phase 6 以降 mjs 無しで Python 実装が独り立ちした際、内部 refactor で field
    名を取り違えると silent bug を招く。この test は ``structureMismatch*`` 側
    を完全に埋めた summary を渡して、formatter が ``snapshotUnusableIssues`` を
    0/未設定 (＝None 返却) として扱うことを保証する。"""
    # structureMismatch* のみセット。snapshotUnusable* は未設定。
    summary = {
        "structureMismatchIssues": 99,
        "structureMismatchFiles": 42,
        "structureMismatchByType": {"section-structure-mismatch": 99},
        # snapshotUnusable* は敢えて未設定 (欠落ケース)
    }
    out = format_source_unusable_section(summary)
    # snapshotUnusable* が無いので None / 空を返す
    assert out is None, (
        f"formatter must NOT fall back to structureMismatch* fields; expected None, got: {out!r}"
    )
