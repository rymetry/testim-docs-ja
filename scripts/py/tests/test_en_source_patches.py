"""en_source_patches のユニットテスト — literal patch 適用と coverage 集計。"""

from __future__ import annotations

import logging
import re

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


# ---------------------------------------------------------------------------
# registry schema — mjs parity (required fields / linkedDefect / date formats)
# ---------------------------------------------------------------------------


class TestRegistrySchema:
    def test_every_entry_has_full_mjs_schema_fields(self):
        """mjs の完全 schema contract を Python 側でも pin する。"""
        required = (
            "id",
            "slugs",
            "defectClass",
            "find",
            "replace",
            "rationale",
            "linkedDefect",
            "addedAt",
            "reviewAfter",
        )
        for entry in EN_SOURCE_PATCHES:
            for key in required:
                assert key in entry, f"patch {entry['id']}: missing {key!r}"

    def test_ids_globally_unique(self):
        ids = [entry["id"] for entry in EN_SOURCE_PATCHES]
        assert len(set(ids)) == len(ids)

    def test_each_slugs_array_is_non_empty(self):
        for entry in EN_SOURCE_PATCHES:
            assert isinstance(entry["slugs"], tuple)
            assert len(entry["slugs"]) > 0
            for slug in entry["slugs"]:
                assert isinstance(slug, str) and len(slug) > 0

    def test_find_non_empty_replace_string(self):
        for entry in EN_SOURCE_PATCHES:
            assert isinstance(entry["find"], str) and len(entry["find"]) > 0
            assert isinstance(entry["replace"], str)

    def test_rationale_non_empty(self):
        for entry in EN_SOURCE_PATCHES:
            assert isinstance(entry["rationale"], str) and len(entry["rationale"]) > 0

    def test_linkedDefect_references_upstream_defects(self):
        for entry in EN_SOURCE_PATCHES:
            assert "UPSTREAM_DEFECTS.md#" in entry["linkedDefect"], (
                f"patch {entry['id']}: linkedDefect must reference UPSTREAM_DEFECTS.md#<anchor>"
            )

    def test_dates_are_iso_yyyy_mm_dd(self):
        date_re = re.compile(r"^\d{4}-\d{2}-\d{2}$")
        for entry in EN_SOURCE_PATCHES:
            assert date_re.match(entry["addedAt"]) is not None
            assert date_re.match(entry["reviewAfter"]) is not None

    def test_find_never_substring_of_replace(self):
        """``find ⊂ replace`` は idempotency を破壊する (mjs と同じ invariant)。"""
        for entry in EN_SOURCE_PATCHES:
            assert entry["find"] not in entry["replace"], (
                f"patch {entry['id']}: replace must not contain find"
            )


# ---------------------------------------------------------------------------
# count_occurrences — edge cases
# ---------------------------------------------------------------------------


class TestCountOccurrencesEdgeCases:
    def test_html_tags(self):
        assert count_occurrences("<p>x</p><p>y</p>", "<p>") == 2

    def test_no_match(self):
        assert count_occurrences("nothing-here", "missing") == 0

    def test_empty_haystack(self):
        assert count_occurrences("", "x") == 0

    def test_ab_overlap_counted_as_non_overlapping(self):
        # "abab" in "ababab" → 1 non-overlapping (then 2 remaining chars)
        assert count_occurrences("ababab", "abab") == 1


# ---------------------------------------------------------------------------
# apply_en_source_patches — representative UD-xxx cases
# ---------------------------------------------------------------------------


class TestSpecificUDPatches:
    def test_ud001a_plain_verify_typo_on_sfdc_create(self):
        html = "<p>Verify -this action verifies that the value matches.</p>"
        cov = create_en_source_patch_coverage()
        out = apply_en_source_patches(
            html,
            "salesforce-testing/salesforce-steps/sfdc-step-create",
            cov,
        )
        assert out == "<p>Verify - this action verifies that the value matches.</p>"
        snap = cov["snapshot"]()
        assert snap["matchedHits"] == 1
        assert snap["byPatchId"]["UD-001A-dash-this-typo-plain"] == 1

    def test_ud001b_strong_verify_typo_on_sfdc_edit(self):
        html = "<p><strong>Verify</strong> -this action verifies the value.</p>"
        cov = create_en_source_patch_coverage()
        out = apply_en_source_patches(
            html,
            "salesforce-testing/salesforce-steps/sfdc-step-edit",
            cov,
        )
        assert out == "<p><strong>Verify</strong> - this action verifies the value.</p>"
        assert cov["snapshot"]()["matchedHits"] == 1

    def test_ud002_logout_href(self):
        html = '<p><a href="sfdc-step-launchapp.htm">Log out</a> - Logs out of Salesforce.</p>'
        cov = create_en_source_patch_coverage()
        out = apply_en_source_patches(html, "salesforce-testing/salesforce-steps", cov)
        assert 'href="sfdc-step-logout.htm">Log out</a>' in out
        assert cov["snapshot"]()["matchedHits"] == 1

    def test_ud001a_does_not_apply_on_sfdc_edit_slug_mismatch(self):
        """UD-001A は sfdc-step-edit には attached されていない → no replace + mismatch 記録。"""
        html = "<p>Verify -this action verifies x</p>"
        cov = create_en_source_patch_coverage()
        out = apply_en_source_patches(
            html,
            "salesforce-testing/salesforce-steps/sfdc-step-edit",
            cov,
        )
        # UD-001A は slug が違うので実行されない / UD-001B は find が合わないので mismatch
        assert out == html
        snap = cov["snapshot"]()
        assert snap["matchedHits"] == 0
        assert any(
            m["patchId"] == "UD-001B-dash-this-typo-strong" and m["reason"] == "find-not-found"
            for m in snap["mismatches"]
        )


# ---------------------------------------------------------------------------
# idempotency — apply(apply(html)) == apply(html) for every registered patch
# ---------------------------------------------------------------------------


def test_every_patch_is_idempotent():
    for patch in EN_SOURCE_PATCHES:
        for slug in patch["slugs"]:
            html = f"<div>prefix {patch['find']} suffix</div>"
            once = apply_en_source_patches(html, slug, create_en_source_patch_coverage())
            twice = apply_en_source_patches(once, slug, create_en_source_patch_coverage())
            assert twice == once, f"{patch['id']} not idempotent on {slug}"


# ---------------------------------------------------------------------------
# order-independence invariants (find vs find / find vs replace, same slug)
# ---------------------------------------------------------------------------


def _group_patches_by_slug():
    slug_to_patches: dict[str, list[dict]] = {}
    for patch in EN_SOURCE_PATCHES:
        for slug in patch["slugs"]:
            slug_to_patches.setdefault(slug, []).append(patch)
    return slug_to_patches


def test_no_find_is_substring_of_another_find_on_same_slug():
    """``A.find ⊂ B.find`` は patch 順で出力が変わる → 禁止。"""
    for slug, patches in _group_patches_by_slug().items():
        if len(patches) < 2:
            continue
        for a in patches:
            for b in patches:
                if a is b:
                    continue
                assert b["find"] not in a["find"], (
                    f"{slug}: {a['id']}.find contains {b['id']}.find — breaks order-independence"
                )


def test_no_find_is_substring_of_another_replace_on_same_slug():
    """``A.find ⊂ B.replace`` で ``B`` 先行だと ``A.find`` が再導入される。"""
    for slug, patches in _group_patches_by_slug().items():
        if len(patches) < 2:
            continue
        for a in patches:
            for b in patches:
                if a is b:
                    continue
                assert a["find"] not in b["replace"], (
                    f"{slug}: {b['id']}.replace contains {a['id']}.find — breaks order-independence"
                )


# ---------------------------------------------------------------------------
# multi-occurrence find behavior — split/join replaces every occurrence
# ---------------------------------------------------------------------------


def test_multi_occurrence_replace_and_coverage():
    html = (
        "<ul>\n"
        "  <li><p>Verify -this action verifies thing A</p></li>\n"
        "  <li><p>Verify -this action verifies thing B</p></li>\n"
        "</ul>"
    )
    cov = create_en_source_patch_coverage()
    out = apply_en_source_patches(
        html,
        "salesforce-testing/salesforce-steps/sfdc-step-create",
        cov,
    )
    # every occurrence replaced
    assert len(re.findall("- this action verifies", out)) == 2
    assert "-this action verifies" not in out
    # coverage mirrors occurrence count
    snap = cov["snapshot"]()
    assert snap["matchedHits"] == 2
    assert snap["byPatchId"]["UD-001A-dash-this-typo-plain"] == 2
    assert snap["bySlug"]["salesforce-testing/salesforce-steps/sfdc-step-create"] == 2
    assert snap["mismatches"] == []


# ---------------------------------------------------------------------------
# coverage aggregator shape — byPatchId / bySlug / mismatches / byPatchIdStatus
# ---------------------------------------------------------------------------


class TestCoverageAggregator:
    def test_initial_snapshot_seeds_byPatchIdStatus_with_all_ids(self):
        cov = create_en_source_patch_coverage()
        snap = cov["snapshot"]()
        assert snap["registryEntries"] == len(EN_SOURCE_PATCHES)
        for patch in EN_SOURCE_PATCHES:
            assert snap["byPatchIdStatus"][patch["id"]] == {"matched": False, "hits": 0}

    def test_recordHit_accumulates_across_apply_calls(self):
        cov = create_en_source_patch_coverage()
        cov["recordHit"](slug="x/a", patchId="UD-001A-dash-this-typo-plain", hits=2)
        cov["recordHit"](slug="x/a", patchId="UD-001A-dash-this-typo-plain", hits=1)
        cov["recordHit"](slug="x/b", patchId="UD-002-logout-href-miswire", hits=1)
        snap = cov["snapshot"]()
        assert snap["matchedHits"] == 4
        assert snap["byPatchId"]["UD-001A-dash-this-typo-plain"] == 3
        assert snap["byPatchId"]["UD-002-logout-href-miswire"] == 1
        assert snap["bySlug"]["x/a"] == 3
        assert snap["bySlug"]["x/b"] == 1

    def test_recordHit_flips_byPatchIdStatus_to_matched(self):
        cov = create_en_source_patch_coverage()
        cov["recordHit"](slug="x", patchId="UD-001A-dash-this-typo-plain", hits=2)
        cov["recordHit"](slug="x", patchId="UD-001A-dash-this-typo-plain", hits=3)
        snap = cov["snapshot"]()
        assert snap["byPatchIdStatus"]["UD-001A-dash-this-typo-plain"] == {
            "matched": True,
            "hits": 5,
        }

    def test_recordMismatch_is_separate_from_hits(self):
        cov = create_en_source_patch_coverage()
        cov["recordMismatch"](
            slug="x/c", patchId="UD-001B-dash-this-typo-strong", reason="find-not-found"
        )
        snap = cov["snapshot"]()
        assert len(snap["mismatches"]) == 1
        assert snap["mismatches"][0]["reason"] == "find-not-found"
        assert snap["matchedHits"] == 0

    def test_noop_coverage_snapshot_also_seeds_byPatchIdStatus(self):
        snap = NOOP_PATCH_COVERAGE["snapshot"]()
        assert len(snap["byPatchIdStatus"]) == len(EN_SOURCE_PATCHES)
        for patch in EN_SOURCE_PATCHES:
            assert snap["byPatchIdStatus"][patch["id"]] == {"matched": False, "hits": 0}


# ---------------------------------------------------------------------------
# Warning emission on find-not-found (mjs prints via console.warn → Python logs)
# ---------------------------------------------------------------------------


def test_warning_emitted_on_find_not_found(caplog: pytest.LogCaptureFixture):
    cov = create_en_source_patch_coverage()
    with caplog.at_level(logging.WARNING, logger="testim_parity.en_source_patches"):
        apply_en_source_patches(
            "<p>completely unrelated HTML</p>",
            "salesforce-testing/salesforce-steps/sfdc-step-create",
            cov,
        )
    assert any("find-not-found" in rec.getMessage() for rec in caplog.records)
    assert any("UD-001A-dash-this-typo-plain" in rec.getMessage() for rec in caplog.records)


def test_no_warning_on_successful_apply(caplog: pytest.LogCaptureFixture):
    with caplog.at_level(logging.WARNING, logger="testim_parity.en_source_patches"):
        apply_en_source_patches(
            "<p>Verify -this action verifies x</p>",
            "salesforce-testing/salesforce-steps/sfdc-step-create",
        )
    assert all("find-not-found" not in rec.getMessage() for rec in caplog.records)


def test_no_warning_for_unregistered_slug(caplog: pytest.LogCaptureFixture):
    with caplog.at_level(logging.WARNING, logger="testim_parity.en_source_patches"):
        apply_en_source_patches(
            "<p>Verify -this action verifies x</p>",
            "totally/unregistered/slug",
        )
    assert all("find-not-found" not in rec.getMessage() for rec in caplog.records)


# ---------------------------------------------------------------------------
# registry_entries() — shallow independence
# ---------------------------------------------------------------------------


def test_registry_entries_matches_EN_SOURCE_PATCHES_length():
    entries = registry_entries()
    assert len(entries) == len(EN_SOURCE_PATCHES)
