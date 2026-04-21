"""en_source_patches のユニットテスト — literal patch 適用と coverage 集計。"""

from __future__ import annotations

import pytest

from testim_parity.en_source_patches import (
    DEFECT_CLASSES,
    EN_SOURCE_PATCHES,
    NOOP_PATCH_COVERAGE,
    apply_en_source_patches,
    count_occurrences,
    create_en_source_patch_coverage,
    registry_entries,
)


class TestDefectClasses:
    def test_four_enum_values(self):
        assert set(DEFECT_CLASSES) == {"typo", "href-miswire", "madcap-artifact", "stale-reference"}


class TestRegistry:
    def test_loaded_from_json(self):
        entries = registry_entries()
        assert len(entries) == len(EN_SOURCE_PATCHES)
        assert len(entries) > 0

    def test_every_entry_has_required_fields(self):
        for entry in EN_SOURCE_PATCHES:
            for key in ("id", "slugs", "defectClass", "find", "replace", "rationale"):
                assert key in entry
            assert entry["defectClass"] in DEFECT_CLASSES

    def test_entries_are_readonly(self):
        with pytest.raises(TypeError):
            EN_SOURCE_PATCHES[0]["find"] = "tampered"  # type: ignore[index]


class TestCountOccurrences:
    def test_counts_non_overlapping(self):
        assert count_occurrences("aaa", "a") == 3
        assert count_occurrences("abcabc", "abc") == 2

    def test_zero_on_empty_needle(self):
        assert count_occurrences("abc", "") == 0

    def test_zero_on_non_string(self):
        assert count_occurrences(None, "x") == 0  # type: ignore[arg-type]
        assert count_occurrences("x", None) == 0  # type: ignore[arg-type]


class TestApplyEnSourcePatches:
    def test_non_matching_slug_is_noop(self):
        html = "<p>hello</p>"
        out = apply_en_source_patches(html, "unrelated/slug")
        assert out == html

    def test_missing_slug_is_noop(self):
        assert apply_en_source_patches("<p>x</p>", "") == "<p>x</p>"

    def test_non_string_raises(self):
        with pytest.raises(TypeError):
            apply_en_source_patches(123, "some/slug")  # type: ignore[arg-type]

    def test_known_patch_applied(self):
        # UD-001A: Verify -this → Verify - this (missing space typo)
        # target: salesforce-testing/salesforce-steps/sfdc-step-create
        html = "<p>Verify -this action verifies the field</p>"
        out = apply_en_source_patches(html, "salesforce-testing/salesforce-steps/sfdc-step-create")
        assert "Verify - this action verifies" in out
        assert "Verify -this" not in out

    def test_idempotent(self):
        html = "<p>Verify -this action verifies</p>"
        slug = "salesforce-testing/salesforce-steps/sfdc-step-create"
        once = apply_en_source_patches(html, slug)
        twice = apply_en_source_patches(once, slug)
        assert once == twice


class TestCoverage:
    def test_hit_recorded(self):
        cov = create_en_source_patch_coverage()
        html = "<p>Verify -this action verifies</p>"
        apply_en_source_patches(html, "salesforce-testing/salesforce-steps/sfdc-step-create", cov)
        snap = cov["snapshot"]()
        assert snap["matchedHits"] > 0
        assert snap["bySlug"]["salesforce-testing/salesforce-steps/sfdc-step-create"] > 0

    def test_mismatch_recorded(self):
        cov = create_en_source_patch_coverage()
        # find が存在しない HTML でも、非該当 slug は no-op なので mismatch にならない。
        # 該当 slug を渡すために UD-001A の slug を使う。
        apply_en_source_patches(
            "<p>no target</p>", "salesforce-testing/salesforce-steps/sfdc-step-create", cov
        )
        snap = cov["snapshot"]()
        assert len(snap["mismatches"]) > 0

    def test_snapshot_includes_all_patch_ids(self):
        cov = create_en_source_patch_coverage()
        snap = cov["snapshot"]()
        # byPatchIdStatus には全 patch が seed されている
        assert len(snap["byPatchIdStatus"]) == len(EN_SOURCE_PATCHES)

    def test_noop_coverage(self):
        snap = NOOP_PATCH_COVERAGE["snapshot"]()
        assert snap["matchedHits"] == 0
        assert snap["byPatchId"] == {}
