"""baseline.py の unit test (schema v2)。

Frozen baseline mechanism の pure helper: schema validation、identity key
生成、page-level invalidation を pin する。``test_baseline_parity.py``
(conformance) が mjs との byte-identical parity を担当。ここでは Python 側
固有の edge case (priority / note / structure fingerprint / invalidation
branching) を網羅する。

Phase 5 gap-fill (source_parity_baseline.test.mjs port): mjs 側 87 個の
``it`` block から代表 60+ ケースを選抜。
"""

from __future__ import annotations

import pytest

from testim_parity.baseline import (
    BASELINE_ELIGIBLE_TYPES,
    NOTE_MAX_LENGTH,
    PRIORITY_VALUES,
    STRUCTURE_CATEGORIES,
    build_baseline_key,
    build_baseline_key_from_entry,
    compute_structure_fingerprint,
    tag_issues_with_baseline,
    validate_baseline,
)

# ---------------------------------------------------------------------------
# fixtures
# ---------------------------------------------------------------------------


VALID_FINGERPRINT = "sha256:" + "a" * 64
OTHER_FINGERPRINT = "sha256:" + "b" * 64
EN_SEGMENT_FP = "sha256:" + "c" * 64
JA_SEGMENT_FP = "sha256:" + "d" * 64
SHIFTED_JA_FP = "sha256:" + "e" * 64
PAGE_FP = "sha256:" + "f" * 64
STRUCTURE_FP = "sha256:" + "1" * 64


def _missing_entry(**overrides) -> dict:
    base = {
        "slug": "overview/example",
        "issueType": "segment-missing",
        "sectionPath": "Setup",
        "segmentKind": "paragraph",
        "enSegmentIndex": 2,
        "jaSegmentIndex": None,
        "enSourceFingerprint": EN_SEGMENT_FP,
        "jaSourceFingerprint": None,
        "missingTokens": None,
        "snapshotFingerprint": VALID_FINGERPRINT,
        "priority": "medium",
    }
    base.update(overrides)
    return base


def _extra_entry(**overrides) -> dict:
    base = {
        "slug": "overview/example",
        "issueType": "segment-extra",
        "sectionPath": "Setup",
        "segmentKind": "paragraph",
        "enSegmentIndex": None,
        "jaSegmentIndex": 3,
        "enSourceFingerprint": None,
        "jaSourceFingerprint": JA_SEGMENT_FP,
        "missingTokens": None,
        "snapshotFingerprint": VALID_FINGERPRINT,
        "priority": "medium",
    }
    base.update(overrides)
    return base


def _token_gap_entry(**overrides) -> dict:
    base = {
        "slug": "overview/example",
        "issueType": "segment-token-gap",
        "sectionPath": "CLI",
        "segmentKind": "paragraph",
        "enSegmentIndex": 1,
        "jaSegmentIndex": None,
        "enSourceFingerprint": EN_SEGMENT_FP,
        "jaSourceFingerprint": None,
        "missingTokens": ["--proxy"],
        "snapshotFingerprint": VALID_FINGERPRINT,
        "priority": "medium",
    }
    base.update(overrides)
    return base


def _structure_entry(**overrides) -> dict:
    base = {
        "slug": "running-tests/the-command-line-cli",
        "issueType": "section-structure-mismatch",
        "snapshotFingerprint": VALID_FINGERPRINT,
        "priority": "medium",
        "sectionIndex": 7,
        "sectionPath": "CLI Installation > Basic CLI command",
        "structureCategory": "kind-multiset",
        "structureFingerprint": STRUCTURE_FP,
    }
    base.update(overrides)
    return base


# ---------------------------------------------------------------------------
# BASELINE_ELIGIBLE_TYPES (v2 — JA-actionable 7 type)
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "type_",
    [
        "segment-missing",
        "segment-extra",
        "segment-shifted",
        "segment-untranslated",
        "segment-token-gap",
        "section-structure-mismatch",
        "segment-order-mismatch",
    ],
)
def test_eligible_types_contain_all_actionable_types(type_: str) -> None:
    assert type_ in BASELINE_ELIGIBLE_TYPES


@pytest.mark.parametrize(
    "type_",
    [
        "segment-inconclusive",
        "snapshot-incomplete",
        "source-unusable",
        "source-page-missing-local",
        "paragraph-count-mismatch",
        "untranslated",
    ],
)
def test_eligible_types_exclude_advisory_and_repo_local_types(type_: str) -> None:
    assert type_ not in BASELINE_ELIGIBLE_TYPES


def test_eligible_types_has_exactly_7_entries() -> None:
    assert len(BASELINE_ELIGIBLE_TYPES) == 7


# ---------------------------------------------------------------------------
# PRIORITY_VALUES / STRUCTURE_CATEGORIES
# ---------------------------------------------------------------------------


def test_priority_values_in_order() -> None:
    assert list(PRIORITY_VALUES) == ["high", "medium", "low"]


def test_structure_categories_has_3_canonical_values() -> None:
    assert "kind-multiset" in STRUCTURE_CATEGORIES
    assert "kind-sequence" in STRUCTURE_CATEGORIES
    assert "content-order" in STRUCTURE_CATEGORIES
    assert len(STRUCTURE_CATEGORIES) == 3


def test_structure_categories_does_not_contain_typos() -> None:
    assert "" not in STRUCTURE_CATEGORIES
    assert "unknown" not in STRUCTURE_CATEGORIES
    assert "segment-missing" not in STRUCTURE_CATEGORIES


# ---------------------------------------------------------------------------
# validate_baseline — schema invariants
# ---------------------------------------------------------------------------


def test_validate_accepts_valid_mixed_baseline() -> None:
    parsed = {
        "schemaVersion": 2,
        "generatedAt": "2026-04-06T03:00:00Z",
        "entries": [_missing_entry(), _extra_entry(), _token_gap_entry()],
    }
    assert validate_baseline(parsed) is parsed


def test_validate_rejects_missing_schema_version() -> None:
    with pytest.raises(ValueError, match="schemaVersion"):
        validate_baseline({"entries": []})


def test_validate_rejects_v1_schema() -> None:
    with pytest.raises(ValueError, match="schemaVersion"):
        validate_baseline({"schemaVersion": 1, "entries": []})


def test_validate_rejects_missing_entries_array() -> None:
    with pytest.raises(ValueError, match="entries"):
        validate_baseline({"schemaVersion": 2})


@pytest.mark.parametrize(
    "bad_type",
    ["paragraph-count-mismatch", "segment-inconclusive", "snapshot-incomplete", "source-unusable"],
)
def test_validate_rejects_ineligible_issue_type(bad_type: str) -> None:
    entry = _missing_entry(issueType=bad_type)
    with pytest.raises(ValueError, match="issueType"):
        validate_baseline({"schemaVersion": 2, "entries": [entry]})


def test_validate_rejects_invalid_snapshot_fingerprint() -> None:
    entry = _missing_entry(snapshotFingerprint="not-a-hash")
    with pytest.raises(ValueError, match="snapshotFingerprint"):
        validate_baseline({"schemaVersion": 2, "entries": [entry]})


def test_validate_rejects_segment_missing_without_en_index() -> None:
    entry = _missing_entry(enSegmentIndex=None)
    with pytest.raises(ValueError, match="enSegmentIndex"):
        validate_baseline({"schemaVersion": 2, "entries": [entry]})


def test_validate_rejects_segment_missing_without_en_fingerprint() -> None:
    entry = _missing_entry(enSourceFingerprint=None)
    with pytest.raises(ValueError, match="enSourceFingerprint"):
        validate_baseline({"schemaVersion": 2, "entries": [entry]})


def test_validate_rejects_segment_extra_without_ja_index() -> None:
    entry = _extra_entry(jaSegmentIndex=None)
    with pytest.raises(ValueError, match="jaSegmentIndex"):
        validate_baseline({"schemaVersion": 2, "entries": [entry]})


def test_validate_rejects_segment_extra_without_ja_fingerprint() -> None:
    entry = _extra_entry(jaSourceFingerprint=None)
    with pytest.raises(ValueError, match="jaSourceFingerprint"):
        validate_baseline({"schemaVersion": 2, "entries": [entry]})


def test_validate_accepts_segment_untranslated_with_ja_only() -> None:
    entry = _missing_entry(
        issueType="segment-untranslated",
        enSegmentIndex=None,
        jaSegmentIndex=4,
        enSourceFingerprint=None,
        jaSourceFingerprint=JA_SEGMENT_FP,
    )
    assert validate_baseline({"schemaVersion": 2, "entries": [entry]})["entries"] == [entry]


def test_validate_rejects_segment_untranslated_without_ja_index() -> None:
    entry = _missing_entry(
        issueType="segment-untranslated",
        enSegmentIndex=None,
        jaSegmentIndex=None,
    )
    with pytest.raises(ValueError, match="jaSegmentIndex"):
        validate_baseline({"schemaVersion": 2, "entries": [entry]})


def test_validate_rejects_token_gap_without_missing_tokens() -> None:
    entry = _token_gap_entry(missingTokens=None)
    with pytest.raises(ValueError, match="missingTokens"):
        validate_baseline({"schemaVersion": 2, "entries": [entry]})


# --- v2 priority / note fields --------------------------------------------


def test_validate_rejects_missing_priority() -> None:
    entry = _missing_entry()
    del entry["priority"]
    with pytest.raises(ValueError, match="priority"):
        validate_baseline({"schemaVersion": 2, "entries": [entry]})


def test_validate_rejects_invalid_priority_value() -> None:
    entry = _missing_entry(priority="urgent")
    with pytest.raises(ValueError, match="priority"):
        validate_baseline({"schemaVersion": 2, "entries": [entry]})


@pytest.mark.parametrize("priority", ["high", "medium", "low"])
def test_validate_accepts_all_valid_priorities(priority: str) -> None:
    entry = _missing_entry(priority=priority)
    assert validate_baseline({"schemaVersion": 2, "entries": [entry]})["entries"] == [entry]


def test_validate_accepts_short_note() -> None:
    entry = _missing_entry(note="awaiting upstream fix")
    assert validate_baseline({"schemaVersion": 2, "entries": [entry]})["entries"] == [entry]


def test_validate_accepts_entry_without_note() -> None:
    """note は optional。"""
    entry = _missing_entry()
    assert "note" not in entry
    assert validate_baseline({"schemaVersion": 2, "entries": [entry]})["entries"] == [entry]


def test_validate_rejects_note_exceeding_max_length() -> None:
    entry = _missing_entry(note="x" * (NOTE_MAX_LENGTH + 1))
    with pytest.raises(ValueError, match="note"):
        validate_baseline({"schemaVersion": 2, "entries": [entry]})


def test_validate_rejects_non_string_note() -> None:
    entry = _missing_entry(note=123)
    with pytest.raises(ValueError, match="note"):
        validate_baseline({"schemaVersion": 2, "entries": [entry]})


# --- structure mismatch entry validation ----------------------------------


def test_validate_accepts_section_structure_mismatch_entry() -> None:
    entry = _structure_entry()
    assert validate_baseline({"schemaVersion": 2, "entries": [entry]})["entries"] == [entry]


def test_validate_accepts_segment_order_mismatch_content_order() -> None:
    entry = _structure_entry(issueType="segment-order-mismatch", structureCategory="content-order")
    assert validate_baseline({"schemaVersion": 2, "entries": [entry]})["entries"] == [entry]


def test_validate_accepts_structure_entry_with_empty_section_path() -> None:
    """preface セクションは sectionPath='' で識別されうる。"""
    entry = _structure_entry(sectionPath="")
    assert validate_baseline({"schemaVersion": 2, "entries": [entry]})["entries"] == [entry]


def test_validate_rejects_structure_missing_section_index() -> None:
    entry = _structure_entry()
    del entry["sectionIndex"]
    with pytest.raises(ValueError, match="sectionIndex"):
        validate_baseline({"schemaVersion": 2, "entries": [entry]})


@pytest.mark.parametrize("bad_index", [1.5, -1, "7", True])
def test_validate_rejects_non_integer_section_index(bad_index) -> None:
    entry = _structure_entry(sectionIndex=bad_index)
    with pytest.raises(ValueError, match="sectionIndex"):
        validate_baseline({"schemaVersion": 2, "entries": [entry]})


def test_validate_rejects_structure_missing_section_path() -> None:
    entry = _structure_entry()
    del entry["sectionPath"]
    with pytest.raises(ValueError, match="sectionPath"):
        validate_baseline({"schemaVersion": 2, "entries": [entry]})


def test_validate_rejects_invalid_structure_category_enum() -> None:
    entry = _structure_entry(structureCategory="unknown")
    with pytest.raises(ValueError, match="structureCategory"):
        validate_baseline({"schemaVersion": 2, "entries": [entry]})


def test_validate_rejects_malformed_structure_fingerprint() -> None:
    entry = _structure_entry(structureFingerprint="not-a-hash")
    with pytest.raises(ValueError, match="structureFingerprint"):
        validate_baseline({"schemaVersion": 2, "entries": [entry]})


# ---------------------------------------------------------------------------
# build_baseline_key / build_baseline_key_from_entry
# ---------------------------------------------------------------------------


def test_key_symmetry_segment_missing() -> None:
    issue = {
        "type": "segment-missing",
        "sectionPath": "Setup",
        "segmentKind": "paragraph",
        "enSegmentIndex": 2,
        "jaSegmentIndex": None,
        "enSourceFingerprint": EN_SEGMENT_FP,
    }
    assert build_baseline_key("overview/example", issue) == build_baseline_key_from_entry(
        _missing_entry()
    )


def test_key_uses_ja_index_for_segment_extra() -> None:
    issue = {
        "type": "segment-extra",
        "sectionPath": "Setup",
        "segmentKind": "paragraph",
        "enSegmentIndex": None,
        "jaSegmentIndex": 3,
        "jaSourceFingerprint": JA_SEGMENT_FP,
    }
    key = build_baseline_key("overview/example", issue)
    assert key == build_baseline_key_from_entry(_extra_entry())
    assert "segment-extra" in key
    assert "|en|" not in key


def test_key_uses_ja_index_for_segment_untranslated() -> None:
    issue = {
        "type": "segment-untranslated",
        "sectionPath": "Setup",
        "segmentKind": "paragraph",
        "enSegmentIndex": None,
        "jaSegmentIndex": 4,
        "jaSourceFingerprint": JA_SEGMENT_FP,
    }
    entry = _missing_entry(
        issueType="segment-untranslated",
        enSegmentIndex=None,
        jaSegmentIndex=4,
        enSourceFingerprint=None,
        jaSourceFingerprint=JA_SEGMENT_FP,
    )
    key = build_baseline_key("overview/example", issue)
    assert key == build_baseline_key_from_entry(entry)
    assert "|ja|" in key
    assert "|en|" not in key


def test_key_uses_en_index_for_segment_shifted() -> None:
    """segment-shifted は EN が anchor → JA index 変化では key が変わらない。"""
    shifted_entry = _missing_entry(
        issueType="segment-shifted",
        enSegmentIndex=5,
        jaSegmentIndex=8,
        jaSourceFingerprint=SHIFTED_JA_FP,
    )
    issue = {
        "type": "segment-shifted",
        "sectionPath": "Setup",
        "segmentKind": "paragraph",
        "enSegmentIndex": 5,
        "jaSegmentIndex": 8,
        "enSourceFingerprint": EN_SEGMENT_FP,
        "jaSourceFingerprint": SHIFTED_JA_FP,
    }
    key_a = build_baseline_key("overview/example", issue)
    key_b = build_baseline_key_from_entry(shifted_entry)
    assert key_a == key_b
    # JA index 変化で key は変わらない
    issue_shifted_ja = {**issue, "jaSegmentIndex": 9}
    assert build_baseline_key("overview/example", issue_shifted_ja) == key_a


def test_key_differs_on_missing_tokens_for_token_gap() -> None:
    base = {
        "type": "segment-token-gap",
        "sectionPath": "CLI",
        "segmentKind": "paragraph",
        "enSegmentIndex": 1,
        "enSourceFingerprint": EN_SEGMENT_FP,
        "missingTokens": ["--proxy"],
    }
    variant = {**base, "missingTokens": ["TESTIM_KEY"]}
    assert build_baseline_key("overview/example", base) != build_baseline_key(
        "overview/example", variant
    )


# --- structure mismatch key symmetry --------------------------------------


def _structure_issue(**overrides) -> dict:
    base = {
        "type": "section-structure-mismatch",
        "sectionPath": "CLI Installation > Basic CLI command",
        "sectionIndex": 7,
        "structureCategory": "kind-multiset",
        "enKinds": ["paragraph", "bullet-list", "paragraph"],
        "jaKinds": ["paragraph", "paragraph"],
    }
    base.update(overrides)
    return base


def _entry_from_structure_issue(slug: str, issue: dict, **overrides) -> dict:
    base = {
        "slug": slug,
        "issueType": issue["type"],
        "snapshotFingerprint": PAGE_FP,
        "priority": "medium",
        "sectionIndex": issue["sectionIndex"],
        "sectionPath": issue["sectionPath"],
        "structureCategory": issue["structureCategory"],
        "structureFingerprint": compute_structure_fingerprint(
            structureCategory=issue["structureCategory"],
            enKinds=issue["enKinds"],
            jaKinds=issue["jaKinds"],
            contentPermutation=issue.get("contentPermutation"),
        ),
    }
    base.update(overrides)
    return base


def test_structure_key_symmetry_kind_multiset() -> None:
    slug = "running-tests/the-command-line-cli"
    issue = _structure_issue()
    entry = _entry_from_structure_issue(slug, issue)
    assert build_baseline_key(slug, issue) == build_baseline_key_from_entry(entry)


def test_structure_key_symmetry_content_order() -> None:
    slug = "running-tests/the-command-line-cli"
    issue = _structure_issue(
        type="segment-order-mismatch",
        structureCategory="content-order",
        enKinds=["paragraph", "bullet-list"],
        jaKinds=["bullet-list", "paragraph"],
        contentPermutation=[
            {"enIndex": 0, "jaIndex": 1, "score": 0.9},
            {"enIndex": 1, "jaIndex": 0, "score": 0.9},
        ],
    )
    entry = _entry_from_structure_issue(slug, issue)
    assert build_baseline_key(slug, issue) == build_baseline_key_from_entry(entry)


def test_structure_key_differs_by_section_index() -> None:
    slug = "some/page"
    a = build_baseline_key(slug, _structure_issue(sectionIndex=3))
    b = build_baseline_key(slug, _structure_issue(sectionIndex=7))
    assert a != b


def test_structure_key_differs_by_structure_category() -> None:
    slug = "some/page"
    a = build_baseline_key(slug, _structure_issue(structureCategory="kind-multiset"))
    b = build_baseline_key(slug, _structure_issue(structureCategory="kind-sequence"))
    assert a != b


def test_structure_key_differs_by_en_kinds() -> None:
    slug = "some/page"
    a = build_baseline_key(slug, _structure_issue(enKinds=["paragraph", "bullet-list"]))
    b = build_baseline_key(slug, _structure_issue(enKinds=["paragraph", "heading"]))
    assert a != b


# ---------------------------------------------------------------------------
# tag_issues_with_baseline — match + page-level invalidation
# ---------------------------------------------------------------------------


def _make_issue(**overrides) -> dict:
    base = {
        "type": "segment-missing",
        "severity": "actionable",
        "detail": "[Setup] EN paragraph not found",
        "sectionPath": "Setup",
        "segmentKind": "paragraph",
        "enSegmentIndex": 2,
        "jaSegmentIndex": None,
        "enSourceFingerprint": EN_SEGMENT_FP,
        "jaSourceFingerprint": None,
    }
    base.update(overrides)
    return base


def test_tag_matching_issue_sets_baselined_true() -> None:
    result = tag_issues_with_baseline(
        "overview/example", [_make_issue()], [_missing_entry()], VALID_FINGERPRINT
    )
    assert len(result["tagged"]) == 1
    assert result["tagged"][0]["baselined"] is True
    assert result["invalidated"] is False


def test_tag_fingerprint_mismatch_invalidates_page() -> None:
    result = tag_issues_with_baseline(
        "overview/example", [_make_issue()], [_missing_entry()], OTHER_FINGERPRINT
    )
    assert "baselined" not in result["tagged"][0] or result["tagged"][0].get("baselined") is None
    assert result["invalidated"] is True


def test_tag_invalidates_all_entries_on_page_when_fingerprint_differs() -> None:
    issues = [_make_issue(), _make_issue(enSegmentIndex=5)]
    entries = [_missing_entry(), _missing_entry(enSegmentIndex=5)]
    result = tag_issues_with_baseline("overview/example", issues, entries, OTHER_FINGERPRINT)
    assert result["invalidated"] is True
    for tagged in result["tagged"]:
        assert tagged.get("baselined") is not True


def test_tag_ignores_entries_from_other_slugs() -> None:
    result = tag_issues_with_baseline(
        "overview/example",
        [_make_issue()],
        [_missing_entry(slug="other/page")],
        VALID_FINGERPRINT,
    )
    assert result["tagged"][0].get("baselined") is not True
    assert result["invalidated"] is False


def test_tag_preserves_all_original_fields() -> None:
    result = tag_issues_with_baseline(
        "overview/example",
        [_make_issue(extra="field", missingTokens=["--proxy"])],
        [_missing_entry()],
        VALID_FINGERPRINT,
    )
    assert result["tagged"][0]["extra"] == "field"
    assert result["tagged"][0]["missingTokens"] == ["--proxy"]
    assert result["tagged"][0]["baselined"] is True


def test_tag_v2_only_adds_baselined_no_expiry_fields() -> None:
    """v2: baselineReviewAfter / baselineExpired / baselineExpiringSoon は付与しない。"""
    result = tag_issues_with_baseline(
        "overview/example", [_make_issue()], [_missing_entry()], VALID_FINGERPRINT
    )
    tagged = result["tagged"][0]
    assert tagged["baselined"] is True
    assert "baselineReviewAfter" not in tagged
    assert "baselineExpired" not in tagged
    assert "baselineExpiringSoon" not in tagged


def test_tag_does_not_mutate_input() -> None:
    import copy

    issues = [_make_issue()]
    snapshot = copy.deepcopy(issues)
    tag_issues_with_baseline("overview/example", issues, [_missing_entry()], VALID_FINGERPRINT)
    assert issues == snapshot


def test_tag_returns_matched_keys_as_set() -> None:
    result = tag_issues_with_baseline(
        "overview/example", [_make_issue()], [_missing_entry()], VALID_FINGERPRINT
    )
    assert isinstance(result["matchedKeys"], set)
    assert len(result["matchedKeys"]) == 1


def test_tag_empty_issues_returns_empty() -> None:
    result = tag_issues_with_baseline("overview/example", [], [_missing_entry()], VALID_FINGERPRINT)
    assert result["tagged"] == []
    assert result["invalidated"] is False


def test_tag_slug_without_baseline_entries_no_op() -> None:
    result = tag_issues_with_baseline("overview/example", [_make_issue()], [], VALID_FINGERPRINT)
    assert result["tagged"][0].get("baselined") is not True
    assert result["invalidated"] is False


def test_tag_does_not_absorb_different_token_gap_mutation() -> None:
    """same anchor でも missingTokens が違えば match しない。"""
    issue = _make_issue(
        type="segment-token-gap",
        sectionPath="CLI",
        segmentKind="paragraph",
        enSegmentIndex=1,
        detail="[CLI] token gap",
        missingTokens=["TESTIM_KEY"],
    )
    result = tag_issues_with_baseline(
        "overview/example", [issue], [_token_gap_entry()], VALID_FINGERPRINT
    )
    assert result["tagged"][0].get("baselined") is not True


# --- structure mismatch tagging -------------------------------------------


def test_tag_structure_issue_with_matching_fingerprint() -> None:
    slug = "running-tests/the-command-line-cli"
    issue = _structure_issue()
    entry = _entry_from_structure_issue(slug, issue)
    result = tag_issues_with_baseline(slug, [issue], [entry], PAGE_FP)
    assert result["tagged"][0]["baselined"] is True
    assert result["invalidated"] is False


def test_tag_structure_issue_does_not_match_when_fingerprint_differs() -> None:
    """structureFingerprint が違う entry は match しない。"""
    slug = "running-tests/the-command-line-cli"
    issue = _structure_issue(enKinds=["paragraph", "heading"])
    other_issue = _structure_issue(enKinds=["paragraph", "table"])
    entry = _entry_from_structure_issue(slug, other_issue)
    result = tag_issues_with_baseline(slug, [issue], [entry], PAGE_FP)
    assert result["tagged"][0].get("baselined") is not True


def test_tag_structure_issue_page_invalidation() -> None:
    slug = "running-tests/the-command-line-cli"
    issue = _structure_issue()
    entry = _entry_from_structure_issue(slug, issue)
    # snapshotFingerprint が異なる → page-level invalidation
    result = tag_issues_with_baseline(slug, [issue], [entry], "sha256:" + "a" * 64)
    assert result["tagged"][0].get("baselined") is not True
    assert result["invalidated"] is True


def test_tag_two_sections_same_path_different_index() -> None:
    """同じ sectionPath でも sectionIndex 違いで独立 tag される。"""
    slug = "some/page"
    shared = {
        "sectionPath": "Shared heading",
        "enKinds": ["paragraph"],
        "jaKinds": ["paragraph", "paragraph"],
    }
    issue_a = _structure_issue(**shared, sectionIndex=3)
    issue_b = _structure_issue(**shared, sectionIndex=7)
    entry_a = _entry_from_structure_issue(slug, issue_a)
    result = tag_issues_with_baseline(slug, [issue_a, issue_b], [entry_a], PAGE_FP)
    assert result["tagged"][0]["baselined"] is True
    assert result["tagged"][1].get("baselined") is not True


# ---------------------------------------------------------------------------
# compute_structure_fingerprint
# ---------------------------------------------------------------------------


def test_structure_fingerprint_deterministic_sha256_format() -> None:
    import re

    fp = compute_structure_fingerprint(
        structureCategory="kind-multiset",
        enKinds=["paragraph", "bullet-list", "paragraph"],
        jaKinds=["paragraph", "paragraph"],
    )
    assert re.match(r"^sha256:[0-9a-f]{64}$", fp)
    # idempotent
    fp2 = compute_structure_fingerprint(
        structureCategory="kind-multiset",
        enKinds=["paragraph", "bullet-list", "paragraph"],
        jaKinds=["paragraph", "paragraph"],
    )
    assert fp == fp2


def test_structure_fingerprint_differs_on_en_kinds() -> None:
    a = compute_structure_fingerprint(
        structureCategory="kind-multiset",
        enKinds=["paragraph", "bullet-list"],
        jaKinds=["paragraph"],
    )
    b = compute_structure_fingerprint(
        structureCategory="kind-multiset",
        enKinds=["paragraph", "heading"],
        jaKinds=["paragraph"],
    )
    assert a != b


def test_structure_fingerprint_differs_on_category() -> None:
    a = compute_structure_fingerprint(
        structureCategory="kind-multiset", enKinds=["paragraph"], jaKinds=["paragraph"]
    )
    b = compute_structure_fingerprint(
        structureCategory="kind-sequence", enKinds=["paragraph"], jaKinds=["paragraph"]
    )
    assert a != b


def test_structure_fingerprint_content_order_uses_permutation() -> None:
    """content-order で contentPermutation 違いは fingerprint 違いに反映される。"""
    a = compute_structure_fingerprint(
        structureCategory="content-order",
        enKinds=["paragraph", "paragraph"],
        jaKinds=["paragraph", "paragraph"],
        contentPermutation=[
            {"enIndex": 0, "jaIndex": 1},
            {"enIndex": 1, "jaIndex": 0},
        ],
    )
    b = compute_structure_fingerprint(
        structureCategory="content-order",
        enKinds=["paragraph", "paragraph"],
        jaKinds=["paragraph", "paragraph"],
        contentPermutation=[
            {"enIndex": 0, "jaIndex": 0},
            {"enIndex": 1, "jaIndex": 1},
        ],
    )
    assert a != b


def test_structure_fingerprint_content_permutation_score_not_in_identity() -> None:
    """``score`` は identity hash に含めない (diagnostic-only)。"""
    a = compute_structure_fingerprint(
        structureCategory="content-order",
        enKinds=["paragraph", "paragraph"],
        jaKinds=["paragraph", "paragraph"],
        contentPermutation=[
            {"enIndex": 0, "jaIndex": 1, "score": 0.9},
            {"enIndex": 1, "jaIndex": 0, "score": 0.9},
        ],
    )
    b = compute_structure_fingerprint(
        structureCategory="content-order",
        enKinds=["paragraph", "paragraph"],
        jaKinds=["paragraph", "paragraph"],
        contentPermutation=[
            {"enIndex": 0, "jaIndex": 1, "score": 0.1},
            {"enIndex": 1, "jaIndex": 0, "score": 0.1},
        ],
    )
    assert a == b
