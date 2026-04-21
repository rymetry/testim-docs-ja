"""``issue_state`` 9 predicates の mjs byte 一致 conformance。

ISSUE_SEVERITY / COARSE_SIGNAL_TYPES / STRUCTURE_MISMATCH_TYPES /
SOURCE_UNUSABLE_TYPES の全代表型 × ack/baseline/severity 状態の matrix を
サンプリングして branching を網羅する。

### non-dict input の扱い (意図的 divergence)

mjs ``isValidAcknowledgedIssue`` / ``isFrozenByBaseline`` / ``isReportableParityIssue`` /
``isNonBlockingParityIssue`` は defensive ガードを持たず ``null`` / 非 object で
``TypeError`` を throw する。Python port はこれらに ``_is_issue_mapping`` ガードを
追加し非 dict で False を返す (improvement)。実 caller は常に dict を渡すため
production path は影響を受けないが、conformance sample からは意図的に non-dict
を除外してある (mjs の harness 側で throw → ``{__error}`` envelope が返り byte
比較が破綻するため)。
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

from ._harness import run_batch

# 代表型 (ISSUE_SEVERITY + COARSE / STRUCTURE / SOURCE_UNUSABLE カテゴリを網羅)
REPRESENTATIVE_TYPES = [
    "segment-missing",  # actionable, gate-eligible
    "segment-untranslated",  # actionable, gate-eligible
    "heading-mismatch",  # coarse signal
    "paragraph-count-mismatch",  # coarse signal
    "table-cell-english-residual",  # coarse signal
    "section-structure-mismatch",  # structure mismatch
    "segment-order-mismatch",  # structure mismatch
    "snapshot-incomplete",  # source-unusable
    "source-unusable",  # source-unusable
    "source-fetch-error",  # severity error (reportable false)
    "unknown-type",  # 未知 type — fallback signal
]

# 各 type に対して ack/baseline/severity 変動を組合せる
STATE_MATRIX = [
    {},  # 素朴
    {"severity": "actionable"},
    {"severity": "signal"},
    {"severity": "error"},
    {"acknowledged": True},
    {"acknowledged": True, "ackExpired": True},
    {"baselined": True},
    {"acknowledged": True, "severity": "actionable"},
    {"baselined": True, "severity": "actionable"},
]


def _build_samples() -> list:
    """mjs と byte 一致が期待できる dict 入力だけで matrix を組む。

    non-dict (None/str/int/list) は意図的に除外 (module docstring 参照)。
    """
    samples: list = []
    for issue_type in REPRESENTATIVE_TYPES:
        for state in STATE_MATRIX:
            samples.append({"type": issue_type, **state})
    # type 欠落 dict — defensive 経路が両 runtime で一致することを確認
    samples.append({})
    samples.append({"severity": "actionable"})
    samples.append({"severity": "actionable", "acknowledged": True})
    return samples


PREDICATE_PAIRS = [
    ("issue_state_is_valid_acknowledged", is_valid_acknowledged_issue),
    ("issue_state_is_frozen_by_baseline", is_frozen_by_baseline),
    ("issue_state_is_active", is_active_parity_issue),
    ("issue_state_is_coarse_audit_signal", is_coarse_audit_signal),
    ("issue_state_is_structure_mismatch", is_structure_mismatch_issue),
    ("issue_state_is_source_unusable", is_source_unusable_issue),
    ("issue_state_is_reportable", is_reportable_parity_issue),
    ("issue_state_is_advisory_only", is_advisory_only_parity_issue),
    ("issue_state_is_non_blocking", is_non_blocking_parity_issue),
]


@pytest.fixture(scope="module")
def mjs_all_predicate_results(repo_root, node_available) -> dict:
    if not node_available:
        pytest.skip("node not available")
    samples = _build_samples()
    calls: list = []
    index: list[tuple[str, int]] = []
    for dispatch_name, _ in PREDICATE_PAIRS:
        for i, sample in enumerate(samples):
            calls.append({"function": dispatch_name, "args": [sample]})
            index.append((dispatch_name, i))
    results = run_batch(repo_root, calls, timeout=120.0)
    grouped: dict[str, list] = {name: [] for name, _ in PREDICATE_PAIRS}
    for (name, _), res in zip(index, results, strict=True):
        grouped[name].append(res)
    return grouped


@pytest.mark.parametrize("dispatch_name,predicate", PREDICATE_PAIRS)
def test_predicate_matches_mjs(mjs_all_predicate_results, dispatch_name, predicate):
    samples = _build_samples()
    mjs_list = mjs_all_predicate_results[dispatch_name]
    for sample, mjs in zip(samples, mjs_list, strict=True):
        py = predicate(sample)
        assert py == mjs, f"{dispatch_name} diverged for {sample!r}:\n  py={py!r} mjs={mjs!r}"
