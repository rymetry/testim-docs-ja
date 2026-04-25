"""frozen baseline が新しい mutation を吸収しないことを確認 (mjs port)。

``source_parity_baseline_recall.test.mjs`` を pytest に移植。各 representative
ページの現在 diff セットから synthetic baseline を生成し、全 diff=1 mutation を
適用した後、少なくとも 1 件の issue が un-baselined で残ることを pin する。
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from testim_parity.acknowledgements import compute_snapshot_fingerprint
from testim_parity.align import align_segments, parity_diffs_to_issues
from testim_parity.baseline import tag_issues_with_baseline
from testim_parity.mutation_corpus import MUTATION_TYPES
from testim_parity.project import ROOT_DIR
from testim_parity.segments_en import extract_segments_from_html
from testim_parity.segments_ja import extract_segments_from_markdown

# Full-repo baseline absorption benchmark. Same cost profile as
# ``test_recall.py`` (manifest × mutation fan-out) — kept out of the
# ``python-fast`` PR gate and exercised nightly (see pyproject.toml addopts
# and .github/workflows/nightly-python-oracle.yml ``python-quality-full``).
pytestmark = pytest.mark.recall

MANIFEST_PATH: Path = Path(__file__).parent / "fixtures" / "source-parity-goldens" / "manifest.json"

_BASELINE_ELIGIBLE: frozenset[str] = frozenset(
    {
        "segment-missing",
        "segment-extra",
        "segment-shifted",
        "segment-untranslated",
        "segment-token-gap",
        # v2: segment-inconclusive は baseline 対象外
    }
)

# Phase 6b cutover で解消済 (test_recall.py の note 参照)。
_PY_EXTRACTOR_DRIFT_SLUGS: frozenset[str] = frozenset()


def _load_manifest() -> list[dict]:
    pages = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))["pages"]
    return [p for p in pages if p["slug"] not in _PY_EXTRACTOR_DRIFT_SLUGS]


def _read_en_html(slug: str) -> str:
    return (ROOT_DIR / "snapshots" / "en" / "content" / f"{slug}.html").read_text(encoding="utf-8")


def _read_ja_markdown(slug: str) -> str:
    return (ROOT_DIR / "src" / "content" / "docs" / f"{slug}.md").read_text(encoding="utf-8")


def _build_baseline_entries(slug: str, issues: list[dict], snapshot_fingerprint: str) -> list[dict]:
    entries: list[dict] = []
    for issue in issues:
        if issue["type"] not in _BASELINE_ELIGIBLE:
            continue
        missing_tokens = issue.get("missingTokens")
        tokens_sorted = sorted(set(missing_tokens)) if isinstance(missing_tokens, list) else None
        entries.append(
            {
                "slug": slug,
                "issueType": issue["type"],
                "sectionPath": issue.get("sectionPath"),
                "segmentKind": issue.get("segmentKind"),
                "enSegmentIndex": issue.get("enSegmentIndex"),
                "jaSegmentIndex": issue.get("jaSegmentIndex"),
                "enSourceFingerprint": issue.get("enSourceFingerprint"),
                "jaSourceFingerprint": issue.get("jaSourceFingerprint"),
                "missingTokens": tokens_sorted,
                "snapshotFingerprint": snapshot_fingerprint,
                "priority": "medium",
            }
        )
    return entries


def _diff_id(diff: dict) -> str:
    tokens = diff.get("missingTokens")
    token_sig = ",".join(sorted(tokens)) if isinstance(tokens, list) else ""
    fingerprint = "_"
    t = diff.get("type")
    if t in ("segment-missing", "segment-token-gap"):
        fingerprint = diff.get("enSourceFingerprint") or "_"
    elif t in ("segment-extra", "segment-untranslated"):
        fingerprint = diff.get("jaSourceFingerprint") or "_"
    else:
        fingerprint = (
            (diff.get("enSourceFingerprint") or "_")
            + ":"
            + (diff.get("jaSourceFingerprint") or "_")
        )
    return "|".join(
        [
            str(diff.get("type")),
            str(diff.get("sectionIndex")),
            str(diff.get("segmentKind")),
            fingerprint,
            token_sig,
        ]
    )


def test_baseline_does_not_absorb_new_mutations() -> None:
    """全 diff=1 mutation が少なくとも 1 件の un-baselined issue を残す。"""
    manifest = _load_manifest()
    failures: list[str] = []

    for page in manifest:
        slug = page["slug"]
        html = _read_en_html(slug)
        snapshot_fingerprint = compute_snapshot_fingerprint(html)
        en_segments = extract_segments_from_html(html)
        ja_original = _read_ja_markdown(slug)
        ja_segments_original = extract_segments_from_markdown(ja_original)
        baseline_alignment = align_segments(en_segments, ja_segments_original, slug=slug)

        if baseline_alignment.get("inconclusive"):
            continue

        baseline_issues = parity_diffs_to_issues(baseline_alignment["diffs"])
        if not baseline_issues:
            continue
        baseline_entries = _build_baseline_entries(slug, baseline_issues, snapshot_fingerprint)
        baseline_ids = {_diff_id(i) for i in baseline_issues}

        for mutation_type, mutation_fn in MUTATION_TYPES.items():
            mutation = mutation_fn(ja_original, 0)
            if mutation is None:
                continue

            ja_segments_mutated = extract_segments_from_markdown(mutation["mutated"])
            mutated_alignment = align_segments(en_segments, ja_segments_mutated, slug=slug)
            if mutated_alignment.get("inconclusive"):
                continue

            mutated_issues = parity_diffs_to_issues(mutated_alignment["diffs"])
            if not mutated_issues:
                continue
            new_issues = [i for i in mutated_issues if _diff_id(i) not in baseline_ids]
            if not new_issues:
                continue

            tag_result = tag_issues_with_baseline(
                slug,
                new_issues,
                baseline_entries,
                snapshot_fingerprint,
            )
            active = [i for i in tag_result["tagged"] if i.get("baselined") is not True]

            if not active:
                failures.append(
                    f"{slug} :: {mutation_type} :: all {len(new_issues)} "
                    "new mutated issues were absorbed by baseline"
                )

    assert not failures, "baseline absorbed new mutations:\n  " + "\n  ".join(failures)
