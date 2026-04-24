"""boundary stability benchmark (mjs port)。

``source_parity_segments_boundary.test.mjs`` を pytest に移植。representative
manifest の全ページで EN/JA canonical segment extractor を走らせ、structural
invariant (heading / list / callout-body count 一致) と stability score を
pin する。
"""

from __future__ import annotations

import json
from functools import cache
from pathlib import Path

import pytest

from testim_parity.project import ROOT_DIR
from testim_parity.segments_en import extract_segments_from_html
from testim_parity.segments_ja import extract_segments_from_markdown
from testim_parity.segments_shared import GATE_ELIGIBLE_KINDS

# Full-repo structural boundary benchmark. Every test walks the manifest
# via ``_analyze_page``; running in ``python-fast`` would add minutes per
# PR. Excluded from default addopts, exercised nightly via
# ``python-quality-full`` (see .github/workflows/nightly-python-oracle.yml).
pytestmark = pytest.mark.boundary

MANIFEST_PATH: Path = Path(__file__).parent / "fixtures" / "source-parity-goldens" / "manifest.json"

# mjs 版は KNOWN_ORDERED_DRIFTS が空。Python 側も同じ空 dict。
KNOWN_ORDERED_DRIFTS: dict[str, dict] = {}

# Phase 6b cutover で解消済 (test_recall.py の note 参照)。
_PY_EXTRACTOR_DRIFT_SLUGS: frozenset[str] = frozenset()


def _load_manifest() -> list[dict]:
    all_pages = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))["pages"]
    return [p for p in all_pages if p["slug"] not in _PY_EXTRACTOR_DRIFT_SLUGS]


def _count_by_kind(segments: list[dict]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for segment in segments:
        kind = segment.get("segmentKind", "")
        counts[kind] = counts.get(kind, 0) + 1
    return counts


def _filter_gate_eligible(segments: list[dict], gate_set: frozenset[str]) -> list[dict]:
    return [s for s in segments if s.get("segmentKind") in gate_set]


def _stability_score(en_counts: dict[str, int], ja_counts: dict[str, int]) -> float:
    kinds = set(en_counts.keys()) | set(ja_counts.keys())
    total_en = 0
    total_ja = 0
    diff = 0
    for kind in kinds:
        e = en_counts.get(kind, 0)
        j = ja_counts.get(kind, 0)
        total_en += e
        total_ja += j
        diff += abs(e - j)
    max_total = max(total_en, total_ja)
    if max_total == 0:
        return 1.0
    return 1.0 - diff / (max_total * 2)


@cache
def _analyze_page(slug: str, gate_set: frozenset[str]) -> dict:
    # Memoised per (slug, gate_set). The boundary suite has 10+ tests that
    # all iterate the full manifest with the same ``GATE_ELIGIBLE_KINDS``
    # frozenset, so without a cache every manifest slug is re-extracted
    # 10+ times. ``frozenset`` is hashable and immutable, so it participates
    # in the cache key cleanly. Returned dict is read-only in every caller.
    html = (ROOT_DIR / "snapshots" / "en" / "content" / f"{slug}.html").read_text(encoding="utf-8")
    md = (ROOT_DIR / "src" / "content" / "docs" / f"{slug}.md").read_text(encoding="utf-8")
    en_segments = extract_segments_from_html(html)
    ja_segments = extract_segments_from_markdown(md)
    en_gate = _filter_gate_eligible(en_segments, gate_set)
    ja_gate = _filter_gate_eligible(ja_segments, gate_set)
    en_counts = _count_by_kind(en_gate)
    ja_counts = _count_by_kind(ja_gate)
    return {
        "slug": slug,
        "enTotal": len(en_gate),
        "jaTotal": len(ja_gate),
        "enCounts": en_counts,
        "jaCounts": ja_counts,
        "stabilityScore": _stability_score(en_counts, ja_counts),
    }


# ---------------------------------------------------------------------------
# Benchmark suite
# ---------------------------------------------------------------------------


def test_manifest_has_representative_pages() -> None:
    manifest = _load_manifest()
    assert len(manifest) >= 5, "manifest should contain representative pages"


def test_extractors_run_on_every_page_without_errors() -> None:
    gate_set = frozenset(GATE_ELIGIBLE_KINDS)
    manifest = _load_manifest()
    for page in manifest:
        analysis = _analyze_page(page["slug"], gate_set)
        assert analysis["enTotal"] > 0, f"{page['slug']}: EN segments should not be empty"
        assert analysis["jaTotal"] > 0, f"{page['slug']}: JA segments should not be empty"


def test_heading_counts_match_exactly() -> None:
    gate_set = frozenset(GATE_ELIGIBLE_KINDS)
    manifest = _load_manifest()
    for page in manifest:
        analysis = _analyze_page(page["slug"], gate_set)
        en = analysis["enCounts"].get("heading", 0)
        ja = analysis["jaCounts"].get("heading", 0)
        assert en == ja, f"{page['slug']}: heading count mismatch (EN={en}, JA={ja})"


def test_unordered_list_item_counts_match_exactly() -> None:
    gate_set = frozenset(GATE_ELIGIBLE_KINDS)
    manifest = _load_manifest()
    for page in manifest:
        analysis = _analyze_page(page["slug"], gate_set)
        en = analysis["enCounts"].get("unordered-list-item", 0)
        ja = analysis["jaCounts"].get("unordered-list-item", 0)
        assert en == ja, f"{page['slug']}: unordered-list-item count mismatch (EN={en}, JA={ja})"


def test_ordered_list_item_counts_match_except_documented_drifts() -> None:
    gate_set = frozenset(GATE_ELIGIBLE_KINDS)
    manifest = _load_manifest()
    for page in manifest:
        if page["slug"] in KNOWN_ORDERED_DRIFTS:
            continue
        analysis = _analyze_page(page["slug"], gate_set)
        en = analysis["enCounts"].get("ordered-list-item", 0)
        ja = analysis["jaCounts"].get("ordered-list-item", 0)
        assert en == ja, f"{page['slug']}: ordered-list-item count mismatch (EN={en}, JA={ja})"


def test_known_ordered_drifts_all_in_manifest() -> None:
    manifest = _load_manifest()
    manifest_slugs = {page["slug"] for page in manifest}
    for slug in KNOWN_ORDERED_DRIFTS:
        assert slug in manifest_slugs, (
            f"{slug}: not present in the representative corpus manifest. "
            "Remove the entry from KNOWN_ORDERED_DRIFTS."
        )


def test_known_ordered_drifts_produce_exact_documented_counts() -> None:
    gate_set = frozenset(GATE_ELIGIBLE_KINDS)
    for slug, entry in KNOWN_ORDERED_DRIFTS.items():
        analysis = _analyze_page(slug, gate_set)
        en = analysis["enCounts"].get("ordered-list-item", 0)
        ja = analysis["jaCounts"].get("ordered-list-item", 0)
        assert en == entry["expectedEn"], (
            f"{slug}: EN ordered-list-item count changed (expected {entry['expectedEn']}, got {en})"
        )
        assert ja == entry["expectedJa"], (
            f"{slug}: JA ordered-list-item count changed (expected {entry['expectedJa']}, got {ja})"
        )
        assert entry["expectedEn"] != entry["expectedJa"], (
            f"{slug}: KNOWN_ORDERED_DRIFTS entry has identical expected counts; remove it."
        )


def test_callout_body_counts_match_exactly() -> None:
    gate_set = frozenset(GATE_ELIGIBLE_KINDS)
    manifest = _load_manifest()
    for page in manifest:
        analysis = _analyze_page(page["slug"], gate_set)
        en = analysis["enCounts"].get("callout-body", 0)
        ja = analysis["jaCounts"].get("callout-body", 0)
        assert en == ja, f"{page['slug']}: callout-body count mismatch (EN={en}, JA={ja})"


def test_per_page_stability_score_at_least_0_85() -> None:
    gate_set = frozenset(GATE_ELIGIBLE_KINDS)
    manifest = _load_manifest()
    for page in manifest:
        analysis = _analyze_page(page["slug"], gate_set)
        assert analysis["stabilityScore"] >= 0.85, (
            f"{page['slug']}: stability score {analysis['stabilityScore']:.3f} < 0.85"
        )


def test_mean_stability_score_at_least_0_95() -> None:
    gate_set = frozenset(GATE_ELIGIBLE_KINDS)
    manifest = _load_manifest()
    scores = [_analyze_page(p["slug"], gate_set)["stabilityScore"] for p in manifest]
    mean = sum(scores) / len(scores)
    assert mean >= 0.95, f"mean stability score {mean:.3f} < 0.95"


def test_extractors_are_idempotent() -> None:
    manifest = _load_manifest()
    slug = manifest[0]["slug"]
    html = (ROOT_DIR / "snapshots" / "en" / "content" / f"{slug}.html").read_text(encoding="utf-8")
    md = (ROOT_DIR / "src" / "content" / "docs" / f"{slug}.md").read_text(encoding="utf-8")
    en_a = extract_segments_from_html(html)
    en_b = extract_segments_from_html(html)
    ja_a = extract_segments_from_markdown(md)
    ja_b = extract_segments_from_markdown(md)
    assert en_a == en_b
    assert ja_a == ja_b
    assert len(GATE_ELIGIBLE_KINDS) > 0


@pytest.fixture
def boundary_report_path(tmp_path: Path) -> Path:
    return tmp_path / "segment-boundary-report.json"


def test_writes_machine_readable_boundary_report(boundary_report_path: Path) -> None:
    gate_set = frozenset(GATE_ELIGIBLE_KINDS)
    manifest = _load_manifest()
    pages = [_analyze_page(page["slug"], gate_set) for page in manifest]
    mean_stability = sum(p["stabilityScore"] for p in pages) / len(pages)
    report = {
        "schemaVersion": 1,
        "meanStabilityScore": mean_stability,
        "pages": pages,
    }
    boundary_report_path.write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    assert mean_stability > 0
