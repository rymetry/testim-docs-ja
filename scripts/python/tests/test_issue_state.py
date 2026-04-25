"""issue_state 述語の unit test。

conformance test (test_issue_state_parity.py) が mjs の branching を全網羅的に
覆うので、ここでは Python 側の type 分岐 (非 dict / type 欠落 / 期限切れ ack) の
edge case を確認する。
"""

from __future__ import annotations

import pytest

from testim_parity.issue_state import (
    is_active_parity_issue,
    is_advisory_only_parity_issue,
    is_coarse_audit_signal,
    is_frozen_by_baseline,
    is_non_blocking_parity_issue,
    is_reportable_parity_issue,
    is_source_unusable_issue,
    is_structure_mismatch_issue,
    is_valid_acknowledged_issue,
)


@pytest.mark.parametrize(
    "predicate",
    [
        is_valid_acknowledged_issue,
        is_frozen_by_baseline,
        is_coarse_audit_signal,
        is_structure_mismatch_issue,
        is_source_unusable_issue,
        is_advisory_only_parity_issue,
    ],
)
@pytest.mark.parametrize("value", [None, "string", 42, [], ()])
def test_predicates_reject_non_mapping(predicate, value):
    assert predicate(value) is False


@pytest.mark.parametrize(
    "predicate",
    [is_coarse_audit_signal, is_structure_mismatch_issue, is_source_unusable_issue],
)
@pytest.mark.parametrize("value", [{"type": None}, {"type": 42}, {"type": []}, {}])
def test_type_gated_predicates_reject_non_string_type(predicate, value):
    """dict 入力でも ``type`` が str でない場合は False (defensive ガード)。"""
    assert predicate(value) is False


@pytest.mark.parametrize("value", [None, "string", 42, [], ()])
def test_is_reportable_rejects_non_mapping(value):
    """is_reportable_parity_issue の非 dict ガードも明示的に確認する。"""
    assert is_reportable_parity_issue(value) is False


def test_valid_ack_requires_both_flags():
    assert is_valid_acknowledged_issue({"acknowledged": True}) is True
    assert is_valid_acknowledged_issue({"acknowledged": True, "ackExpired": False}) is True
    assert is_valid_acknowledged_issue({"acknowledged": True, "ackExpired": True}) is False
    assert is_valid_acknowledged_issue({"acknowledged": False}) is False
    assert is_valid_acknowledged_issue({}) is False


def test_active_is_inverse_of_valid_ack():
    assert is_active_parity_issue({"acknowledged": True}) is False
    assert is_active_parity_issue({"acknowledged": True, "ackExpired": True}) is True
    # 非 dict は is_valid_ack が False → is_active は True (mjs 等価)
    assert is_active_parity_issue(None) is True


def test_frozen_by_baseline():
    assert is_frozen_by_baseline({"baselined": True}) is True
    assert is_frozen_by_baseline({"baselined": False}) is False
    assert is_frozen_by_baseline({}) is False


def test_coarse_audit_signal_matches_type():
    # COARSE_SIGNAL_TYPES に含まれる型
    assert is_coarse_audit_signal({"type": "paragraph-count-mismatch"}) is True
    assert is_coarse_audit_signal({"type": "heading-mismatch"}) is True
    # 含まれない型
    assert is_coarse_audit_signal({"type": "segment-missing"}) is False
    assert is_coarse_audit_signal({"type": None}) is False
    assert is_coarse_audit_signal({}) is False


def test_structure_mismatch_matches_type():
    assert is_structure_mismatch_issue({"type": "section-structure-mismatch"}) is True
    assert is_structure_mismatch_issue({"type": "segment-order-mismatch"}) is True
    assert is_structure_mismatch_issue({"type": "heading-mismatch"}) is False


def test_source_unusable_matches_type():
    assert is_source_unusable_issue({"type": "snapshot-incomplete"}) is True
    assert is_source_unusable_issue({"type": "source-unusable"}) is True
    assert is_source_unusable_issue({"type": "segment-missing"}) is False


def test_reportable_gates_out_coarse_and_source_unusable():
    # coarse signal は reportable でない (audit-only)
    assert is_reportable_parity_issue({"type": "heading-mismatch", "severity": "signal"}) is False
    # source-unusable は reportable でない (advisory)
    assert (
        is_reportable_parity_issue({"type": "snapshot-incomplete", "severity": "actionable"})
        is False
    )


def test_reportable_requires_severity():
    base = {"type": "segment-missing"}
    assert is_reportable_parity_issue({**base, "severity": "actionable"}) is True
    assert is_reportable_parity_issue({**base, "severity": "signal"}) is True
    assert is_reportable_parity_issue({**base, "severity": "error"}) is False
    assert is_reportable_parity_issue({**base}) is False


def test_reportable_suppressed_by_baseline_and_ack():
    base = {"type": "segment-missing", "severity": "actionable"}
    assert is_reportable_parity_issue({**base, "baselined": True}) is False
    assert is_reportable_parity_issue({**base, "acknowledged": True}) is False
    # 期限切れ ack は reportable に戻る
    assert is_reportable_parity_issue({**base, "acknowledged": True, "ackExpired": True}) is True


def test_advisory_only_is_source_unusable_not_covered():
    # source-unusable かつ ack/baseline なし → advisory only
    assert is_advisory_only_parity_issue({"type": "snapshot-incomplete"}) is True
    # ack 付きなら advisory ではない (covered 扱い)
    assert (
        is_advisory_only_parity_issue({"type": "snapshot-incomplete", "acknowledged": True})
        is False
    )
    # baseline 付きなら advisory ではない
    assert (
        is_advisory_only_parity_issue({"type": "snapshot-incomplete", "baselined": True}) is False
    )
    # source-unusable でない型なら false
    assert is_advisory_only_parity_issue({"type": "segment-missing"}) is False


def test_non_blocking_covers_baseline_or_ack():
    assert is_non_blocking_parity_issue({"baselined": True}) is True
    assert is_non_blocking_parity_issue({"acknowledged": True}) is True
    assert is_non_blocking_parity_issue({"acknowledged": True, "ackExpired": True}) is False
    assert is_non_blocking_parity_issue({}) is False
