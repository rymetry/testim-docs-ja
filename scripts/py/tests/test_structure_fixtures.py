"""structure regression guard fixture (mjs port)。

``source_parity_structure_fixtures.test.mjs`` を pytest に移植。実 snapshot と
実 JA md を読み、canonical structure comparator (section-structure-mismatch /
segment-order-mismatch) が 0 件を維持することを pin する。
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

from testim_parity.align import align_segments, parity_diffs_to_issues
from testim_parity.project import ROOT_DIR
from testim_parity.segments_en import extract_segments_from_html
from testim_parity.segments_ja import extract_segments_from_markdown

# Real-repo structure regression guard. Each parametrized slug runs the full
# align + structure comparator stack on an actual EN snapshot + JA markdown
# pair (CI 実測: single slug ~80s on ubuntu-latest). Excluded from the
# ``python-fast`` PR gate and exercised by the ``python-quality-full`` nightly
# job (see .github/workflows/nightly-python-oracle.yml). Phase 6b cutover PR
# will escalate ``real_repo`` to required alongside ``recall`` / ``boundary``.
pytestmark = pytest.mark.real_repo

SNAPSHOTS_DIR: Path = ROOT_DIR / "snapshots" / "en" / "content"
JA_CONTENT_DIR: Path = ROOT_DIR / "src" / "content" / "docs"

SLUGS_ALL: tuple[str, ...] = (
    "running-tests/the-command-line-cli",
    "results/test-results/network-logs",
    "advanced-editing/validations/email-validation",
    # artifact regression fixtures (mjs 原本 L106-117)
    "advanced-editing/custom-action-step-mobile",
    "results/test-runs",
)

# Phase 6b cutover で解消済 (test_clean_page_fixtures.py の note 参照)。
_PY_XFAIL_SLUGS: frozenset[str] = frozenset()

SLUGS: tuple[str, ...] = tuple(s for s in SLUGS_ALL if s not in _PY_XFAIL_SLUGS)


def _extract_ja_body(md_content: str) -> str:
    without_fm = re.sub(r"^---[\s\S]*?---\n", "", md_content, count=1, flags=re.MULTILINE)
    return without_fm.strip()


def _run_structure_comparator(slug: str) -> list[dict]:
    raw_en_html = (SNAPSHOTS_DIR / f"{slug}.html").read_text(encoding="utf-8")
    ja_md = (JA_CONTENT_DIR / f"{slug}.md").read_text(encoding="utf-8")
    ja_body = _extract_ja_body(ja_md)
    en_segments = extract_segments_from_html(raw_en_html)
    ja_segments = extract_segments_from_markdown(ja_body)
    alignment = align_segments(en_segments, ja_segments, slug=slug)
    issues = parity_diffs_to_issues(alignment["diffs"])
    return [
        i for i in issues if i["type"] in ("section-structure-mismatch", "segment-order-mismatch")
    ]


@pytest.mark.parametrize("slug", SLUGS)
def test_structure_issues_zero(slug: str) -> None:
    structure_issues = _run_structure_comparator(slug)
    first = json.dumps(structure_issues[0], ensure_ascii=False) if structure_issues else "None"
    assert len(structure_issues) == 0, (
        f"{slug}: clean page だが structure issue が {len(structure_issues)} 件検出された。"
        f"最初の issue: {first}"
    )
