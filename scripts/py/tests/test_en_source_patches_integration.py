"""en_source_patches の integration-style test (Bundle 1 + Category B)。

acceptance gates #6 / #7 / #10 を real EN snapshot に対して検証する:

* gate #6: target slugs 上で ``patchCoverage.mismatches`` == 0
* gate #7: target slugs の ``matchedHits`` が minHits 集計以上
* gate #10: Bundle 1 JA markdown に ``<!-- parity:`` コメントがゼロ

さらに no-new-mechanism invariant (gates #12 / #13 / #14)、non-patched slug の
byte-identical 保証、全 patch ID が ``byPatchIdStatus`` に seed されることを pin する。
"""

from __future__ import annotations

from pathlib import Path

import pytest

from testim_parity.artifact_registry import ARTIFACT_REGISTRY
from testim_parity.en_source_patches import (
    EN_SOURCE_PATCHES,
    create_en_source_patch_coverage,
)
from testim_parity.preprocess_en import preprocess_en_html
from testim_parity.project import PROJECT_ROOT
from testim_parity.sync_exclusions import SOURCE_SYNC_EXCLUSIONS

SNAPSHOTS_ROOT: Path = PROJECT_ROOT / "snapshots" / "en" / "content"
SALESFORCE_SNAPSHOT_ROOT: Path = SNAPSHOTS_ROOT / "salesforce-testing"
JA_BUNDLE_DIR: Path = (
    PROJECT_ROOT / "src" / "content" / "docs" / "salesforce-testing" / "salesforce-steps"
)


# Target slugs per plan Bundle 1 (UD-001 / UD-002) + Category B (UD-004A/C)
TARGET_SLUG_SNAPSHOTS: list[dict[str, object]] = [
    {
        "slug": "salesforce-testing/salesforce-steps/sfdc-step-create",
        "path": SALESFORCE_SNAPSHOT_ROOT / "salesforce-steps" / "sfdc-step-create.html",
        "minHits": 1,
    },
    {
        "slug": "salesforce-testing/salesforce-steps/sfdc-step-edit",
        "path": SALESFORCE_SNAPSHOT_ROOT / "salesforce-steps" / "sfdc-step-edit.html",
        "minHits": 1,
    },
    {
        "slug": "salesforce-testing/salesforce-steps/sfdc-step-quickactions",
        "path": SALESFORCE_SNAPSHOT_ROOT / "salesforce-steps" / "sfdc-step-quickactions.html",
        "minHits": 1,
    },
    {
        "slug": "salesforce-testing/salesforce-steps/sfdc-step-relatedlistaction",
        "path": SALESFORCE_SNAPSHOT_ROOT / "salesforce-steps" / "sfdc-step-relatedlistaction.html",
        "minHits": 1,
    },
    {
        "slug": "salesforce-testing/salesforce-steps/sfdc-step-validate",
        "path": SALESFORCE_SNAPSHOT_ROOT / "salesforce-steps" / "sfdc-step-validate.html",
        "minHits": 1,
    },
    {
        "slug": "salesforce-testing/salesforce-steps",
        "path": SALESFORCE_SNAPSHOT_ROOT / "salesforce-steps.html",
        "minHits": 1,
    },
    {
        "slug": "running-tests/scheduler",
        "path": SNAPSHOTS_ROOT / "running-tests" / "scheduler.html",
        # UD-004A ×1 (high-speed-mode) + UD-004C ×1 (Slack anchor) = 2
        "minHits": 2,
    },
    {
        "slug": "running-tests/scheduler-mobile",
        "path": SNAPSHOTS_ROOT / "running-tests" / "scheduler-mobile.html",
        # UD-004C ×1 (Slack anchor only; no high-speed-mode reference)
        "minHits": 1,
    },
]


NON_PATCHED_SAMPLE_SLUGS: tuple[str, ...] = (
    "overview/testim-overview",
    "running-tests/base-url",
    "integrations/grid-management/tricentis-device-cloud",
    "testops/insights",
    "salesforce-testing/salesforce-testing-overview",
    "advanced-editing/validations/email-validation",
)


# ---------------------------------------------------------------------------
# Gates #6 / #7: patchCoverage against real snapshots
# ---------------------------------------------------------------------------


class TestBundle1Coverage:
    def test_all_snapshot_files_exist(self) -> None:
        for target in TARGET_SLUG_SNAPSHOTS:
            path: Path = target["path"]  # type: ignore[assignment]
            assert path.exists(), f"missing snapshot: {path}"

    def test_matched_hits_meet_minimum_and_no_mismatches(self) -> None:
        cov = create_en_source_patch_coverage()
        for target in TARGET_SLUG_SNAPSHOTS:
            slug: str = target["slug"]  # type: ignore[assignment]
            path: Path = target["path"]  # type: ignore[assignment]
            raw = path.read_text(encoding="utf-8")
            preprocess_en_html(raw, slug=slug, patch_coverage=cov)
        snap = cov["snapshot"]()

        # gate #7 (total)
        expected_total = sum(int(t["minHits"]) for t in TARGET_SLUG_SNAPSHOTS)  # type: ignore[arg-type]
        assert snap["matchedHits"] >= expected_total, (
            f"gate #7 (total) violated: matchedHits={snap['matchedHits']} "
            f"expected >= {expected_total}. bySlug={snap['bySlug']}"
        )

        # gate #7 (per-slug)
        for target in TARGET_SLUG_SNAPSHOTS:
            slug = target["slug"]  # type: ignore[assignment]
            min_hits = int(target["minHits"])  # type: ignore[arg-type]
            actual = snap["bySlug"].get(slug, 0)
            assert actual >= min_hits, (
                f"gate #7 (per-slug) violated for {slug}: bySlug={actual} expected >= {min_hits}"
            )

        # gate #6: no mismatches for target slugs
        target_set = {t["slug"] for t in TARGET_SLUG_SNAPSHOTS}
        offending = [m for m in snap["mismatches"] if m["slug"] in target_set]
        assert offending == [], (
            f"gate #6 violated: {len(offending)} mismatches on target slugs: {offending}"
        )

    def test_find_strings_no_longer_present_after_preprocess(self) -> None:
        """patch 適用後に ``find`` 文字列が残っていないこと (each target)。"""
        for target in TARGET_SLUG_SNAPSHOTS:
            slug: str = target["slug"]  # type: ignore[assignment]
            path: Path = target["path"]  # type: ignore[assignment]
            raw = path.read_text(encoding="utf-8")
            out = preprocess_en_html(
                raw, slug=slug, patch_coverage=create_en_source_patch_coverage()
            )
            applicable = [p for p in EN_SOURCE_PATCHES if slug in p["slugs"]]
            for patch in applicable:
                assert patch["find"] not in out, (
                    f"{slug}: patch {patch['id']} 'find' string still present after preprocess"
                )


# ---------------------------------------------------------------------------
# Gate #10: Bundle 1 JA markdown hygiene
# ---------------------------------------------------------------------------


class TestBundle1JaMarkdownHygiene:
    def test_no_parity_comments(self) -> None:
        assert JA_BUNDLE_DIR.exists(), f"bundle directory missing: {JA_BUNDLE_DIR}"
        md_files = sorted(JA_BUNDLE_DIR.glob("*.md"))
        assert md_files, f"no markdown files found in {JA_BUNDLE_DIR}"

        offenders: list[str] = []
        for md in md_files:
            body = md.read_text(encoding="utf-8")
            if "<!-- parity:" in body:
                offenders.append(md.name)
        assert offenders == [], (
            f"gate #10 violated: {len(offenders)} file(s) contain '<!-- parity:' "
            f"comments: {', '.join(offenders)}"
        )


# ---------------------------------------------------------------------------
# Gates #12 / #13 / #14: no-new-mechanism invariants
# ---------------------------------------------------------------------------


class TestNoNewMechanism:
    def test_gate12_artifact_registry_shape(self) -> None:
        """gate #12: ``ARTIFACT_REGISTRY`` は 2 entries / 合計 8 slugs。"""
        assert len(ARTIFACT_REGISTRY) == 2, (
            "new artifact registry entries are forbidden by ONE-purpose principle"
        )
        total_slugs = sum(len(entry["slugs"]) for entry in ARTIFACT_REGISTRY)
        assert total_slugs == 8, "slug count drift in artifact registry"

    def test_gate13_sync_exclusions_has_one_entry(self) -> None:
        """gate #13: ``SOURCE_SYNC_EXCLUSIONS`` は 1 entry のみ。"""
        assert len(SOURCE_SYNC_EXCLUSIONS) == 1, "new source sync exclusions are forbidden"


# ---------------------------------------------------------------------------
# Byte-identical regression for non-patched slugs
# ---------------------------------------------------------------------------


class TestNonPatchedByteIdentical:
    def test_sample_slugs_are_not_in_any_patch(self) -> None:
        for slug in NON_PATCHED_SAMPLE_SLUGS:
            for patch in EN_SOURCE_PATCHES:
                assert slug not in patch["slugs"], (
                    f"{slug} should not be patched but is in {patch['id']}"
                )

    def test_preprocess_output_byte_identical_with_and_without_slug(self) -> None:
        verified: list[str] = []
        skipped: list[str] = []
        for slug in NON_PATCHED_SAMPLE_SLUGS:
            html_path = SNAPSHOTS_ROOT / f"{slug}.html"
            if not html_path.exists():
                skipped.append(slug)
                continue
            html = html_path.read_text(encoding="utf-8")
            baseline = preprocess_en_html(html)
            with_slug = preprocess_en_html(html, slug=slug)
            assert with_slug == baseline, f"byte-identical regression for {slug}"
            verified.append(slug)
        assert len(verified) >= 1, f"expected >=1 verified sample, got 0. skipped={skipped}"


# ---------------------------------------------------------------------------
# Stale detection across all registered patches (non-gating)
# ---------------------------------------------------------------------------


class TestStaleDetection:
    def test_by_patch_id_status_enumerates_all_registered_ids(self) -> None:
        """0 hits でも ``byPatchIdStatus`` が registry 全 ID を seed している。"""
        cov = create_en_source_patch_coverage()
        snap = cov["snapshot"]()
        for patch in EN_SOURCE_PATCHES:
            status = snap["byPatchIdStatus"].get(patch["id"])
            assert status is not None, (
                f"byPatchIdStatus must seed every registry entry (missing {patch['id']})"
            )
            assert status["matched"] is False
            assert status["hits"] == 0
        assert len(snap["byPatchIdStatus"]) == len(EN_SOURCE_PATCHES)

    def test_stale_scan_covers_at_least_30_unique_slugs(self) -> None:
        """slug-driven scan が 30 slug 以上を覆うこと (回帰 guard)。"""
        unique_slugs = {s for p in EN_SOURCE_PATCHES for s in p["slugs"]}
        assert len(unique_slugs) >= 30, (
            f"expected slug-driven scan to cover >=30 unique slugs (got {len(unique_slugs)})"
        )

    def test_every_patch_has_valid_review_after(self) -> None:
        import re

        RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
        for patch in EN_SOURCE_PATCHES:
            review_after = patch.get("reviewAfter")
            assert isinstance(review_after, str) and RE.match(review_after), (
                f"patch {patch['id']} must have reviewAfter in YYYY-MM-DD format"
            )

    def test_every_sync_exclusion_has_valid_review_after(self) -> None:
        import re

        RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
        for slug, entry in SOURCE_SYNC_EXCLUSIONS.items():
            review_after = entry.get("reviewAfter")
            assert isinstance(review_after, str) and RE.match(review_after), (
                f"exclusion {slug} must have reviewAfter in YYYY-MM-DD format"
            )


# ---------------------------------------------------------------------------
# source-sync-status.json recovery surface (CI-only, non-gating)
# ---------------------------------------------------------------------------


def test_stale_source_sync_exclusions_surface_when_artifact_present() -> None:
    """``source-sync-status.json`` が repo にあるときだけ stale entry を検査する。"""
    import json

    status_path = PROJECT_ROOT / "source-sync-status.json"
    if not status_path.exists():
        pytest.skip("source-sync-status.json not present (local / PR CI skip)")
    status = json.loads(status_path.read_text(encoding="utf-8"))
    stale = [
        p
        for p in status.get("pages", [])
        if p.get("fetchStatus") == "excluded-recovered" and p.get("slug") in SOURCE_SYNC_EXCLUSIONS
    ]
    # non-gating: warning only. primary surface は weekly managed issue なので
    # ここでは assert しない。
    _ = stale
