"""zero-drift clean page の false-positive sentinel (mjs port)。

``source_parity_clean_page_fixtures.test.mjs`` を pytest に移植。実 snapshot と
実 JA md を読み、structure comparator が 0 件を維持することを全 CLEAN_PAGE_SLUGS
で pin する。
"""

from __future__ import annotations

import json
import re
from functools import cache
from pathlib import Path

import pytest

from testim_parity.align import align_segments, parity_diffs_to_issues
from testim_parity.project import ROOT_DIR
from testim_parity.segments_en import extract_segments_from_html
from testim_parity.segments_ja import extract_segments_from_markdown

# Full-repo zero-drift sentinel suite. Three parametrized tests each run
# ``_run_structure_comparator`` for every ``CLEAN_PAGE_SLUGS`` entry, so
# running in ``python-fast`` triples the structural compare workload per PR.
# Excluded from default addopts, exercised nightly via
# ``python-quality-full`` (see .github/workflows/nightly-python-oracle.yml).
pytestmark = pytest.mark.boundary

SNAPSHOTS_DIR: Path = ROOT_DIR / "snapshots" / "en" / "content"
JA_CONTENT_DIR: Path = ROOT_DIR / "src" / "content" / "docs"

# plan 作成時に実測 zero-drift を確定した 2 ページ + Phase H.1 / M2 で追加した
# structure variety 別 clean sentinel。mjs 原本 (CLEAN_PAGE_SLUGS) と揃える。
# Phase 5 port 時点で Python runtime が mjs と異なる issue を出す slug は
# `_PY_XFAIL_SLUGS` に隔離する — これらは下位レイヤ (extractor / align 細部)
# での latent cross-runtime drift が原因で、Phase 5 の scope (test port) では
# 解消せず、別 issue (mjs/Python parity fix) に委ねる。
CLEAN_PAGE_SLUGS_ALL: tuple[str, ...] = (
    "settings/cli-prerequisites",
    "salesforce-testing/salesforce-testing-getting-started",
    "test-management/shared-steps-library/managing-shared-steps-and-folders",
    "mobile-apps/mobile-apps",
    "advanced-editing/coding-assistant",
    "advanced-editing/deep-link-mobile",
    "salesforce-testing/salesforce-steps/sfdc-document-validation",
    "advanced-editing/keyboard-shortcut-step",
    "editing-tests/generating-a-random-value",
    "editing-tests/editing-your-tests/editing-target-element-properties",
    "integrations/test-management-integrations/ttm-for-jira-integration",
    "integrations/test-management-integrations/xray-integration",
    "integrations/grid-management",
    "integrations/visual-validation/lambdatest_integration",
    "salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce",
    "administration/secrets",
    "advanced-editing/parameters/passing-parameters-from-excel-file",
    "advanced-editing/validations/validate-download",
    "integrations/integrate-testim-to-your-ci/vsts-and-tfs-integration",
    "advanced-editing/validations/validate-element-text",
    "integrations/grid-management/saucelabs-browserstack-options",
    "overview/testim-overview",
    "testops/insights/reports",
    "administration/subscription-plans",
    "results/stop-pause-debug-tests",
    "editing-tests/groups",
    "administration/project-and-user-management",
    "running-tests/run-in-incognito",
    "debugging-tests/recording-additional-steps-to-fix-bugs",
    "advanced-editing/validations/html-attribute-validation",
    "test-management/locators-auto-improve",
    "salesforce-testing/create-a-salesforce-test",
)

# Phase 6b cutover で解消済: segments_ja.py を mjs line-based に戻し、
# check_source_parity で raw bytes 読み取り化したことで Python runtime も
# mjs と同じ 0 issue に揃った。cutover gate (test_cutover_gate.py) が本
# frozenset が empty であることを assert するため、**新たな drift slug を
# 追加する場合は別 Issue で parser 側を修正する** のが規律 (baseline を
# 使わず parser / content で解消する、feedback_parity_phase_discipline)。
_PY_XFAIL_SLUGS: frozenset[str] = frozenset()

CLEAN_PAGE_SLUGS: tuple[str, ...] = tuple(
    s for s in CLEAN_PAGE_SLUGS_ALL if s not in _PY_XFAIL_SLUGS
)


def _extract_ja_body(md_content: str) -> str:
    """frontmatter (``--- ... ---``) を除去して本文を返す。"""
    without_fm = re.sub(r"^---[\s\S]*?---\n", "", md_content, count=1, flags=re.MULTILINE)
    return without_fm.strip()


@cache
def _run_structure_comparator(slug: str) -> dict:
    # Memoised per slug. Three parametrized tests
    # (``test_alignment_is_conclusive`` / ``test_structure_issues_are_zero``
    # / ``test_total_issues_are_zero``) call this with identical slug sets,
    # so without a cache every clean-page slug is aligned three times.
    # Returned dict is read-only at every call site.
    raw_en_html = (SNAPSHOTS_DIR / f"{slug}.html").read_text(encoding="utf-8")
    ja_md = (JA_CONTENT_DIR / f"{slug}.md").read_text(encoding="utf-8")
    ja_body = _extract_ja_body(ja_md)
    en_segments = extract_segments_from_html(raw_en_html)
    ja_segments = extract_segments_from_markdown(ja_body)
    alignment = align_segments(en_segments, ja_segments, slug=slug)
    issues = parity_diffs_to_issues(alignment["diffs"])
    structure_issues = [
        i for i in issues if i["type"] in ("section-structure-mismatch", "segment-order-mismatch")
    ]
    return {"alignment": alignment, "issues": issues, "structureIssues": structure_issues}


@pytest.mark.parametrize("slug", CLEAN_PAGE_SLUGS)
def test_alignment_is_conclusive(slug: str) -> None:
    result = _run_structure_comparator(slug)
    assert result["alignment"].get("inconclusive", False) is False, (
        f"{slug}: alignment.inconclusive === True になった"
    )


@pytest.mark.parametrize("slug", CLEAN_PAGE_SLUGS)
def test_structure_issues_are_zero(slug: str) -> None:
    result = _run_structure_comparator(slug)
    issues = result["structureIssues"]
    assert len(issues) == 0, (
        f"{slug}: structure issue が {len(issues)} 件検出された — "
        "plan 前提 (zero-drift clean page) が崩れている。"
        f"最初の issue: {json.dumps(issues[0] if issues else None, ensure_ascii=False)}"
    )


@pytest.mark.parametrize("slug", CLEAN_PAGE_SLUGS)
def test_total_issues_are_zero(slug: str) -> None:
    result = _run_structure_comparator(slug)
    issues = result["issues"]
    assert len(issues) == 0, (
        f"{slug}: 総 issue 数が {len(issues)} 件 — "
        "plan 前提では EN/JA が完全整合しており 0 件のはず。"
        f"最初の issue: {json.dumps(issues[0] if issues else None, ensure_ascii=False)}"
    )
