"""parity issue の状態判定述語 (pure functions)。

``scripts/lib/source_parity_issue_state.mjs`` の port。gate / summary /
reporting が同じ基準で動くようにここに集約する。全関数は issue (dict ライク)
を受け取り bool を返す純粋述語。副作用なし。

mjs との byte-identical conformance contract は ``harness.mjs`` の
``issue_state_*`` dispatch でカバーする。
"""

from __future__ import annotations

from typing import Any

from .types import COARSE_SIGNAL_TYPES, SOURCE_UNUSABLE_TYPES, STRUCTURE_MISMATCH_TYPES

__all__ = [
    "is_active_parity_issue",
    "is_advisory_only_parity_issue",
    "is_coarse_audit_signal",
    "is_frozen_by_baseline",
    "is_non_blocking_parity_issue",
    "is_reportable_parity_issue",
    "is_source_unusable_issue",
    "is_structure_mismatch_issue",
    "is_valid_acknowledged_issue",
]


def _is_issue_mapping(issue: Any) -> bool:
    """mjs ``typeof issue === 'object' && issue !== null`` と等価 (dict のみ許容)。"""
    return isinstance(issue, dict)


def is_valid_acknowledged_issue(issue: Any) -> bool:
    """``acknowledged=True`` かつ ``ackExpired`` が true でない場合に限り true。"""
    if not _is_issue_mapping(issue):
        return False
    return issue.get("acknowledged") is True and issue.get("ackExpired") is not True


def is_frozen_by_baseline(issue: Any) -> bool:
    """``baselined=True`` (baseline schema v2 で覆われている) なら true。"""
    if not _is_issue_mapping(issue):
        return False
    return issue.get("baselined") is True


def is_active_parity_issue(issue: Any) -> bool:
    """ack で覆われていない = 現在 active な issue。baseline 状態は無視。

    非 dict 入力は ``is_valid_acknowledged_issue`` 側のガードで ``False`` に
    倒されるため、結果として ``True`` を返す (mjs 等価挙動)。
    """
    return not is_valid_acknowledged_issue(issue)


def is_coarse_audit_signal(issue: Any) -> bool:
    """coarse audit signal (count / shape / table-cell 系) を type のみで判定。

    severity / ack / baseline 状態は無視する純粋分類述語。期限切れ ack / baseline
    でも coarse signal は coarse signal のままで ``parityRegression`` / gate を
    再点火しない契約。
    """
    if not _is_issue_mapping(issue):
        return False
    type_ = issue.get("type")
    if not isinstance(type_, str):
        return False
    return type_ in COARSE_SIGNAL_TYPES


def is_structure_mismatch_issue(issue: Any) -> bool:
    """section-anchored canonical block sequence comparator 由来の structure mismatch。"""
    if not _is_issue_mapping(issue):
        return False
    type_ = issue.get("type")
    if not isinstance(type_, str):
        return False
    return type_ in STRUCTURE_MISMATCH_TYPES


def is_source_unusable_issue(issue: Any) -> bool:
    """snapshot / source 起因で canonical comparator が成立しないページ用判定。"""
    if not _is_issue_mapping(issue):
        return False
    type_ = issue.get("type")
    if not isinstance(type_, str):
        return False
    return type_ in SOURCE_UNUSABLE_TYPES


def is_reportable_parity_issue(issue: Any) -> bool:
    """gate / parityRegression に載るか判定する。

    - coarse audit signals は reportable でない (audit-only)
    - source-unusable は reportable でない (advisory 扱い、翻訳者責任外)
    - severity が ``actionable`` / ``signal`` 以外は reportable でない
    - baseline で覆われている場合は reportable でない
    - ack で覆われている場合は reportable でない (``is_active_parity_issue``)
    """
    if is_coarse_audit_signal(issue):
        return False
    if is_source_unusable_issue(issue):
        return False
    # coarse / source-unusable の両 predicate は defensive ガード済みで非 dict を
    # 早期 False で捌くため、ここに到達した時点で issue は dict か「dict ではない
    # が type が coarse/source_unusable にも該当しないもの」。mjs は非 dict で
    # ``.severity`` 読み取り時に throw するが、Python port は ``_is_issue_mapping``
    # で False を返す (improvement、意図的 divergence)。
    if not _is_issue_mapping(issue):
        return False
    severity = issue.get("severity")
    if severity != "actionable" and severity != "signal":
        return False
    if is_frozen_by_baseline(issue):
        return False
    return is_active_parity_issue(issue)


def is_advisory_only_parity_issue(issue: Any) -> bool:
    """ack / baseline で覆われていない source-unusable を advisory only として識別。

    - gate には乗らない (``is_reportable_parity_issue`` が false)
    - ack / baseline で覆われていないので ``"covered by baseline/ack"`` 表示は不適切
    - 専用の ``"(source unusable)"`` suffix で advisory 表示するために使う
    """
    if not is_source_unusable_issue(issue):
        return False
    if is_valid_acknowledged_issue(issue):
        return False
    return not is_frozen_by_baseline(issue)


def is_non_blocking_parity_issue(issue: Any) -> bool:
    """ack / baseline で明示的に覆われている issue (非ブロッキング)。

    covered by baseline or ack。source-unusable を覆っていない場合は
    ``is_advisory_only_parity_issue`` で別経路として識別する。

    非 dict 入力は delegate 先の predicate が両方とも ``False`` を返すため
    ``False`` を返す (mjs 等価挙動)。
    """
    return is_frozen_by_baseline(issue) or is_valid_acknowledged_issue(issue)
