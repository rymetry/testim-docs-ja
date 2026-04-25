"""各 file の parity 結果を集計する純粋関数 (mjs ``source_parity_summary`` の port)。

``scripts/lib/source_parity_summary.mjs`` を 1:1 で移植した純粋関数。副作用なし、
入力は mutate しない。

**Counter 契約 (mjs と byte 一致)**:

- ``activeFiles`` / ``activeActionableFiles`` / ``activeErrorFiles``:
  Legacy gate counters。active (非 ack, 非 frozen-baseline) issue を持つ
  ファイル数。**coarse audit signals もここには寄与する**ため、audit demotion
  前の意味を読み続ける downstream 消費者と互換が保たれる。
- ``reportableActiveFiles`` / ``reportableActiveActionableFiles``: 現行 gate
  counters。少なくとも 1 件の ``is_reportable_parity_issue() == True`` な issue
  を持つファイル数。coarse audit signals は ack / baseline が期限切れでも
  ここには寄与しない (gate を再点火しない契約)。
- ``auditSignalIssues`` / ``auditSignalFiles`` / ``auditSignalsByType``: Audit
  channel。coarse signal の総数 + type 別内訳。
- ``structureMismatchIssues`` / ``structureMismatchFiles`` /
  ``structureMismatchByType``: structure mismatch の独立 counter。ack /
  frozen baseline を除外し、active な構造差分だけを数える。
- ``snapshotUnusableIssues`` / ``snapshotUnusableFiles`` /
  ``snapshotUnusableByType``: snapshot / source 起因で comparator が成立しない
  ページ用の独立 counter。翻訳差分と混ぜずに別枠で集計し、gate には載せない。
- ``baselinedIssues`` / ``baselinedFiles`` / ``baselinedByType``: Frozen drift
  accounting (schema v2)。``parity-baseline.json`` が cutover 前の segment-* /
  structure drift を active gate から除外する。v2 では期限概念を廃止し、
  ``is_frozen_by_baseline(issue) ≡ issue.baselined is True`` に縮約している。

mjs 出力 shape と byte-identical な dict を返す。conformance harness で full
summary を比較する。
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from .issue_state import (
    is_coarse_audit_signal,
    is_frozen_by_baseline,
    is_reportable_parity_issue,
    is_source_unusable_issue,
    is_structure_mismatch_issue,
    is_valid_acknowledged_issue,
)

__all__ = ["summarize_parity_results"]


def _inc(d: dict[str, int], key: Any) -> None:
    """mjs ``d[key] = (d[key] || 0) + 1`` 等価のカウント加算。

    mjs の key は常に string (``issue.type`` / ``issue.severity``) なので
    Python 側も str 化して dict に格納する (None などが来た時に ``"None"`` と
    なるが、本来入らないケースなので defensive)。
    """
    k = str(key)
    d[k] = d.get(k, 0) + 1


def summarize_parity_results(
    results: Sequence[dict[str, Any]],
    orphan_meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """結果 list を集計して summary dict を返す (mjs ``summarizeParityResults`` 等価)。

    ``orphan_meta`` は呼び出し側で集計した orphan baseline entry 情報:

    - ``orphanBaselineEntries``: int — orphan の総数
    - ``orphanBaselineByType``: dict[str, int] — type 別内訳

    返り値の key 順序は mjs ``return { ... }`` の object literal 順に一致させる。
    Python 3.7+ dict は挿入順を保持するため、mjs ``JSON.stringify`` 出力と
    byte-identical な dump が可能。
    """
    orphan_meta = orphan_meta or {}

    issues_by_type: dict[str, int] = {}
    issues_by_severity: dict[str, int] = {}
    baselined_by_type: dict[str, int] = {}
    audit_signals_by_type: dict[str, int] = {}
    structure_mismatch_by_type: dict[str, int] = {}
    snapshot_unusable_by_type: dict[str, int] = {}

    actionable_files = 0
    signal_files = 0
    error_files = 0
    active_actionable_files = 0
    active_error_files = 0
    active_files = 0
    total_issues = 0
    acknowledged_issues = 0
    expired_acknowledgements = 0
    baselined_issues = 0
    baselined_files = 0
    reportable_active_files = 0
    reportable_active_actionable_files = 0
    audit_signal_issues = 0
    audit_signal_files = 0
    structure_mismatch_issues = 0
    structure_mismatch_files = 0
    snapshot_unusable_issues = 0
    snapshot_unusable_files = 0

    for result in results:
        has_actionable = False
        has_signal = False
        has_error = False
        has_active_actionable = False
        has_active_error = False
        has_active_issue = False
        has_baselined = False
        has_reportable_active = False
        has_reportable_active_actionable = False
        has_audit_signal = False
        has_structure_mismatch = False
        has_snapshot_unusable = False

        for issue in result.get("issues", []):
            # mjs ``issue.baselined === true`` は strict equality。Python も
            # ``is True`` で同一挙動 (truthy な 1 や "yes" を除外するため)。
            is_baselined_flag = issue.get("baselined") is True
            is_frozen = is_frozen_by_baseline(issue)

            if is_baselined_flag:
                baselined_issues += 1
                _inc(baselined_by_type, issue.get("type"))
                has_baselined = True

            total_issues += 1
            _inc(issues_by_type, issue.get("type"))
            _inc(issues_by_severity, issue.get("severity"))

            # coarse signal は audit channel にだけ載せる。
            if is_coarse_audit_signal(issue):
                audit_signal_issues += 1
                _inc(audit_signals_by_type, issue.get("type"))
                has_audit_signal = True

            # structure mismatch / source unusable は専用 counter でも集計する。
            if (
                is_structure_mismatch_issue(issue)
                and not is_valid_acknowledged_issue(issue)
                and not is_frozen
            ):
                structure_mismatch_issues += 1
                _inc(structure_mismatch_by_type, issue.get("type"))
                has_structure_mismatch = True

            if (
                is_source_unusable_issue(issue)
                and not is_valid_acknowledged_issue(issue)
                and not is_frozen
            ):
                snapshot_unusable_issues += 1
                _inc(snapshot_unusable_by_type, issue.get("type"))
                has_snapshot_unusable = True

            if is_reportable_parity_issue(issue):
                has_reportable_active = True
                if issue.get("severity") == "actionable":
                    has_reportable_active_actionable = True

            is_valid_ack = is_valid_acknowledged_issue(issue)

            if is_valid_ack:
                acknowledged_issues += 1
            elif not is_frozen:
                has_active_issue = True

            if issue.get("acknowledged") is True and issue.get("ackExpired") is True:
                expired_acknowledgements += 1

            severity = issue.get("severity")
            if severity == "actionable":
                has_actionable = True
                if not is_valid_ack and not is_frozen:
                    has_active_actionable = True
            if severity == "signal":
                has_signal = True
            if severity == "error":
                has_error = True
                if not is_valid_ack and not is_frozen:
                    has_active_error = True

        if has_actionable:
            actionable_files += 1
        elif has_error:
            error_files += 1
        elif has_signal:
            signal_files += 1

        if has_active_actionable:
            active_actionable_files += 1
        if has_active_error:
            active_error_files += 1
        if has_active_issue:
            active_files += 1
        if has_baselined:
            baselined_files += 1
        if has_reportable_active:
            reportable_active_files += 1
        if has_reportable_active_actionable:
            reportable_active_actionable_files += 1
        if has_audit_signal:
            audit_signal_files += 1
        if has_structure_mismatch:
            structure_mismatch_files += 1
        if has_snapshot_unusable:
            snapshot_unusable_files += 1

    # orphan metadata: caller が外部 baseline entry 集計から計算した値を引き渡す。
    orphan_by_type = orphan_meta.get("orphanBaselineByType")
    if not isinstance(orphan_by_type, dict):
        orphan_by_type = {}
    orphan_entries = orphan_meta.get("orphanBaselineEntries") or 0

    # return shape は mjs `return { ... }` の object literal 順と完全一致させる。
    return {
        "filesWithIssues": len(results),
        "actionableFiles": actionable_files,
        "signalFiles": signal_files,
        "errorFiles": error_files,
        "activeActionableFiles": active_actionable_files,
        "activeErrorFiles": active_error_files,
        "activeFiles": active_files,
        "totalIssues": total_issues,
        "acknowledgedIssues": acknowledged_issues,
        "expiredAcknowledgements": expired_acknowledgements,
        "issuesByType": issues_by_type,
        "issuesBySeverity": issues_by_severity,
        "baselinedIssues": baselined_issues,
        "baselinedFiles": baselined_files,
        "baselinedByType": baselined_by_type,
        "reportableActiveFiles": reportable_active_files,
        "reportableActiveActionableFiles": reportable_active_actionable_files,
        "auditSignalIssues": audit_signal_issues,
        "auditSignalFiles": audit_signal_files,
        "auditSignalsByType": audit_signals_by_type,
        "structureMismatchIssues": structure_mismatch_issues,
        "structureMismatchFiles": structure_mismatch_files,
        "structureMismatchByType": structure_mismatch_by_type,
        "snapshotUnusableIssues": snapshot_unusable_issues,
        "snapshotUnusableFiles": snapshot_unusable_files,
        "snapshotUnusableByType": snapshot_unusable_by_type,
        "orphanBaselineEntries": orphan_entries,
        "orphanBaselineByType": orphan_by_type,
    }
