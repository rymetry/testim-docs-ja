"""detect_source_usability の fixture integration (mjs port)。

``source_parity_source_usability_fixtures.test.mjs`` を pytest に移植。実 snapshot
を読んで detector の返り値 (None / issue) を pin する。
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

from testim_parity.align import align_segments, parity_diffs_to_issues
from testim_parity.project import ROOT_DIR
from testim_parity.segments_en import extract_segments_from_html
from testim_parity.segments_ja import extract_segments_from_markdown
from testim_parity.source_usability import detect_source_usability

# Real-repo source-usability integration. Each test loads an actual EN
# snapshot + JA markdown pair and exercises ``detect_source_usability``
# end-to-end (CI 実測: one integration test ~38s on ubuntu-latest). Same
# ``python-fast`` exclusion / nightly escalation contract as
# ``test_structure_fixtures.py``.
pytestmark = pytest.mark.real_repo

SNAPSHOTS_DIR: Path = ROOT_DIR / "snapshots" / "en" / "content"
JA_CONTENT_DIR: Path = ROOT_DIR / "src" / "content" / "docs"


def _extract_ja_body(md_content: str) -> str:
    without_fm = re.sub(r"^---[\s\S]*?---\n", "", md_content, count=1, flags=re.MULTILINE)
    return without_fm.strip()


def _load_fixture(slug: str) -> tuple[str, list, list, Exception | None]:
    raw_en_html = (SNAPSHOTS_DIR / f"{slug}.html").read_text(encoding="utf-8")
    ja_md = (JA_CONTENT_DIR / f"{slug}.md").read_text(encoding="utf-8")
    ja_body = _extract_ja_body(ja_md)

    extract_error: Exception | None = None
    try:
        en_segments = extract_segments_from_html(raw_en_html)
    except Exception as exc:  # noqa: BLE001
        en_segments = []
        extract_error = exc
    ja_segments = extract_segments_from_markdown(ja_body)
    return raw_en_html, en_segments, ja_segments, extract_error


# ---------------------------------------------------------------------------
# salesforce-testing/salesforce-testing-overview
# ---------------------------------------------------------------------------


def test_salesforce_overview_is_usable() -> None:
    slug = "salesforce-testing/salesforce-testing-overview"
    raw_en_html, en_segments, ja_segments, extract_error = _load_fixture(slug)
    result = detect_source_usability(
        raw_en_html=raw_en_html,
        en_segments=en_segments,
        ja_segments=ja_segments,
        extract_error=extract_error,
    )
    assert result is None, (
        f"salesforce-testing-overview は post-resolution では usable。actual: {result}"
    )


# ---------------------------------------------------------------------------
# advanced-editing/coding-assistant (P1 regression)
# ---------------------------------------------------------------------------


def test_coding_assistant_returns_none() -> None:
    slug = "advanced-editing/coding-assistant"
    raw_en_html, en_segments, ja_segments, extract_error = _load_fixture(slug)
    result = detect_source_usability(
        raw_en_html=raw_en_html,
        en_segments=en_segments,
        ja_segments=ja_segments,
        extract_error=extract_error,
    )
    assert result is None, (
        f"coding-assistant は usability issue を返すべきでない。"
        f"enSegments={len(en_segments)}, jaSegments={len(ja_segments)}"
    )


def test_coding_assistant_has_heading_segments() -> None:
    slug = "advanced-editing/coding-assistant"
    raw_en_html = (SNAPSHOTS_DIR / f"{slug}.html").read_text(encoding="utf-8")
    en_segments = extract_segments_from_html(raw_en_html)
    heading_count = sum(1 for s in en_segments if s.get("segmentKind") == "heading")
    assert heading_count >= 1, (
        f"enHeadingSegmentCount={heading_count} は 1 以上であるべき "
        "(hasSectionAnchorFailure=False の前提)"
    )


def test_coding_assistant_forces_extract_error_returns_none() -> None:
    slug = "advanced-editing/coding-assistant"
    raw_en_html = (SNAPSHOTS_DIR / f"{slug}.html").read_text(encoding="utf-8")
    ja_md = (JA_CONTENT_DIR / f"{slug}.md").read_text(encoding="utf-8")
    ja_body = _extract_ja_body(ja_md)
    ja_segments = extract_segments_from_markdown(ja_body)

    simulated_error = RuntimeError("simulated extractor failure")
    result = detect_source_usability(
        raw_en_html=raw_en_html,
        en_segments=[],
        ja_segments=ja_segments,
        extract_error=simulated_error,
    )
    assert result is None, (
        "coding-assistant + extractError は None を返すべき "
        "(balanced open=close は source-unusable 非発火)"
    )


def test_coding_assistant_runtime_no_source_unusable() -> None:
    slug = "advanced-editing/coding-assistant"
    raw_en_html, en_segments, ja_segments, extract_error = _load_fixture(slug)
    usability_issue = detect_source_usability(
        raw_en_html=raw_en_html,
        en_segments=en_segments,
        ja_segments=ja_segments,
        extract_error=extract_error,
    )
    assert usability_issue is None, "gate は None を返すべき"

    if extract_error is not None:
        return
    alignment = align_segments(en_segments, ja_segments, slug=slug)
    issues = parity_diffs_to_issues(alignment["diffs"])
    source_unusable = [i for i in issues if i["type"] == "source-unusable"]
    assert len(source_unusable) == 0, "source-unusable は出るべきでない"
    assert alignment.get("inconclusive", False) is False, (
        "alignment は inconclusive に倒れるべきでない (gate bypass 後の正常実行)"
    )


# ---------------------------------------------------------------------------
# salesforce-testing/faq (Phase F.2.5 後)
# ---------------------------------------------------------------------------


def test_faq_returns_none_after_normalize() -> None:
    slug = "salesforce-testing/faq"
    raw_en_html, en_segments, ja_segments, extract_error = _load_fixture(slug)
    result = detect_source_usability(
        raw_en_html=raw_en_html,
        en_segments=en_segments,
        ja_segments=ja_segments,
        extract_error=extract_error,
    )
    reason = (
        (result or {}).get("usabilitySignals", {}).get("reason")
        if isinstance(result, dict)
        else None
    )
    assert result is None, (
        f"faq は Phase F.2.5 以降 usable と判定されるべき。"
        f"actual type={(result or {}).get('type')}, reason={reason}"
    )


def test_faq_extractor_emits_five_headings_and_zero_details() -> None:
    slug = "salesforce-testing/faq"
    raw_en_html = (SNAPSHOTS_DIR / f"{slug}.html").read_text(encoding="utf-8")
    en_segs = extract_segments_from_html(raw_en_html)
    headings = [s for s in en_segs if s.get("segmentKind") == "heading"]
    detail_summaries = [s for s in en_segs if s.get("segmentKind") == "details-summary"]
    assert len(headings) == 5, f"faq の heading 件数が 5 でない: {len(headings)}"
    assert len(detail_summaries) == 0, (
        f"faq に details-summary が残っている: {len(detail_summaries)}"
    )
