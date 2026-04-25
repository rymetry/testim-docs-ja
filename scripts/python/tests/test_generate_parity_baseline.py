"""``testim_parity.detection.generate_parity_baseline`` unit tests (Phase 5)。

mjs ``scripts/__tests__/generate_parity_baseline.test.mjs`` の behavioral 等価。
Python-only cutover 後はこの file が pre-regen gate / baseline merge contract を
pin する。

Note: Python CLI の ``parse_args`` は private ``_parse_cli_args`` として隠蔽
されているため、直接 import して test する。
"""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

import pytest

from testim_parity.baseline import (
    compute_structure_fingerprint,
    validate_types_arg,
)
from testim_parity.detection.generate_parity_baseline import (
    _parse_cli_args,
    assert_full_parity_status,
    assert_pre_regen_gate,
    build_baseline_from_status,
    build_generation_meta,
    load_snapshot_diff_status,
    main,
    merge_partial_baseline,
    merge_partial_baseline_by_type,
    serialize_baseline,
)

VALID_FINGERPRINT = "sha256:" + "a" * 64
OTHER_FINGERPRINT = "sha256:" + "b" * 64
EN_SEGMENT_FINGERPRINT = "sha256:" + "c" * 64
JA_SEGMENT_FINGERPRINT = "sha256:" + "d" * 64
TOKEN_GAP_FINGERPRINT = "sha256:" + "e" * 64
VALID_SNAPSHOT_FP = "sha256:" + "f" * 64


def _sample_status() -> dict[str, Any]:
    return {
        "summary": {"checkedAt": "2026-04-06T03:00:00Z"},
        "files": [
            {
                "file": "src/content/docs/overview/example.md",
                "sourceUrl": "",
                "category": "",
                "issues": [
                    {
                        "type": "segment-missing",
                        "severity": "actionable",
                        "sectionPath": "Setup",
                        "segmentKind": "paragraph",
                        "enSegmentIndex": 2,
                        "jaSegmentIndex": None,
                        "enSourceFingerprint": EN_SEGMENT_FINGERPRINT,
                        "detail": "[Setup] EN paragraph not found",
                    },
                    {
                        "type": "segment-extra",
                        "severity": "actionable",
                        "sectionPath": "Setup",
                        "segmentKind": "paragraph",
                        "enSegmentIndex": None,
                        "jaSegmentIndex": 5,
                        "jaSourceFingerprint": JA_SEGMENT_FINGERPRINT,
                        "detail": "[Setup] JA paragraph has no EN counterpart",
                    },
                    {
                        "type": "segment-token-gap",
                        "severity": "actionable",
                        "sectionPath": "CLI",
                        "segmentKind": "paragraph",
                        "enSegmentIndex": 1,
                        "jaSegmentIndex": 1,
                        "enSourceFingerprint": TOKEN_GAP_FINGERPRINT,
                        "missingTokens": ["TESTIM_KEY", "--proxy"],
                        "detail": "JA paragraph drops EN invariant tokens",
                    },
                    {
                        "type": "segment-inconclusive",
                        "severity": "actionable",
                        "sectionPath": None,
                        "segmentKind": None,
                        "inconclusiveCategory": "heading-count-mismatch",
                        "inconclusiveReason": "Heading count mismatch: EN has 0, JA has 5",
                        "detail": "alignment inconclusive: heading count mismatch",
                    },
                    {
                        "type": "paragraph-count-mismatch",
                        "severity": "signal",
                        "detail": "段落数 EN=2 JA=3",
                    },
                ],
            }
        ],
    }


_FINGERPRINT_MAP = {"overview/example": VALID_FINGERPRINT}

_META = {
    "runId": "test-run",
    "generatedAt": "2026-04-06T03:00:00Z",
    "rationale": "test",
}


# ----------------------------------------------------------------------
# build_generation_meta
# ----------------------------------------------------------------------


def test_build_generation_meta_deterministic() -> None:
    first = build_generation_meta(
        _sample_status(), {"regenerate": True, "slugs": None, "rationale": None}
    )
    second = build_generation_meta(
        _sample_status(), {"regenerate": True, "slugs": None, "rationale": None}
    )
    assert first == second
    assert first["generatedAt"] == "2026-04-06T03:00:00Z"
    assert first["runId"] == "2026-04-06T03:00:00Z#parity-check-status"


def test_build_generation_meta_honors_rationale_override() -> None:
    meta = build_generation_meta(
        _sample_status(),
        {"regenerate": False, "slugs": ["overview/example"], "rationale": "custom rationale"},
    )
    assert meta["rationale"] == "custom rationale"


# ----------------------------------------------------------------------
# assert_full_parity_status
# ----------------------------------------------------------------------


def test_assert_full_parity_status_accepts_full() -> None:
    status = {
        "summary": {
            "checkedAt": "2026-04-06T03:00:00Z",
            "checkedFiles": 288,
            "totalFiles": 288,
        }
    }
    assert_full_parity_status(status)  # does not raise


def test_assert_full_parity_status_rejects_scoped() -> None:
    status = {
        "summary": {
            "checkedAt": "2026-04-06T03:00:00Z",
            "checkedFiles": 1,
            "totalFiles": 288,
        }
    }
    with pytest.raises(ValueError, match="full-repo run"):
        assert_full_parity_status(status)


# ----------------------------------------------------------------------
# build_baseline_from_status
# ----------------------------------------------------------------------


def test_build_baseline_extracts_eligible_types_only() -> None:
    baseline = build_baseline_from_status(_sample_status(), _FINGERPRINT_MAP, _META)
    assert len(baseline["entries"]) == 3
    types = sorted(e["issueType"] for e in baseline["entries"])
    assert types == ["segment-extra", "segment-missing", "segment-token-gap"]


def test_build_baseline_uses_jaSegmentIndex_for_segment_extra() -> None:
    baseline = build_baseline_from_status(_sample_status(), _FINGERPRINT_MAP, _META)
    extra = next(e for e in baseline["entries"] if e["issueType"] == "segment-extra")
    assert extra["jaSegmentIndex"] == 5
    assert extra["enSegmentIndex"] is None


def test_build_baseline_does_not_emit_segment_inconclusive() -> None:
    baseline = build_baseline_from_status(_sample_status(), _FINGERPRINT_MAP, _META)
    assert not any(e["issueType"] == "segment-inconclusive" for e in baseline["entries"])


def test_build_baseline_emits_schema_v2() -> None:
    baseline = build_baseline_from_status(_sample_status(), _FINGERPRINT_MAP, _META)
    assert baseline["schemaVersion"] == 2


def test_build_baseline_default_priority_medium() -> None:
    baseline = build_baseline_from_status(_sample_status(), _FINGERPRINT_MAP, _META)
    for entry in baseline["entries"]:
        assert entry["priority"] == "medium"


def test_build_baseline_v2_excludes_obsolete_fields() -> None:
    baseline = build_baseline_from_status(_sample_status(), _FINGERPRINT_MAP, _META)
    for entry in baseline["entries"]:
        assert "reviewAfter" not in entry
        assert "inconclusiveCategory" not in entry
        assert "usabilityReason" not in entry


def test_build_baseline_skips_files_without_fingerprint() -> None:
    baseline = build_baseline_from_status(_sample_status(), {}, _META)
    assert len(baseline["entries"]) == 0


def test_build_baseline_includes_already_baselined_issues() -> None:
    status = copy.deepcopy(_sample_status())
    status["files"][0]["issues"][0]["baselined"] = True
    baseline = build_baseline_from_status(status, _FINGERPRINT_MAP, _META)
    assert len(baseline["entries"]) == 3


def test_build_baseline_attaches_snapshot_fingerprint() -> None:
    baseline = build_baseline_from_status(_sample_status(), _FINGERPRINT_MAP, _META)
    for entry in baseline["entries"]:
        assert entry["snapshotFingerprint"] == VALID_FINGERPRINT


def test_build_baseline_copies_source_fingerprints_and_tokens() -> None:
    baseline = build_baseline_from_status(_sample_status(), _FINGERPRINT_MAP, _META)
    by_type = {e["issueType"]: e for e in baseline["entries"]}
    assert by_type["segment-missing"]["enSourceFingerprint"] == EN_SEGMENT_FINGERPRINT
    assert by_type["segment-extra"]["jaSourceFingerprint"] == JA_SEGMENT_FINGERPRINT
    assert by_type["segment-token-gap"]["missingTokens"] == ["--proxy", "TESTIM_KEY"]


# ----------------------------------------------------------------------
# serialize_baseline
# ----------------------------------------------------------------------


def test_serialize_baseline_deterministic_output() -> None:
    baseline = build_baseline_from_status(_sample_status(), _FINGERPRINT_MAP, _META)
    a = serialize_baseline(baseline)
    b = serialize_baseline(baseline)
    assert a == b


def test_serialize_baseline_2_space_indent_and_lf() -> None:
    baseline = build_baseline_from_status(_sample_status(), _FINGERPRINT_MAP, _META)
    out = serialize_baseline(baseline)
    assert out.endswith("\n")
    assert '\n  "schemaVersion"' in out


def test_serialize_baseline_sorts_by_slug() -> None:
    baseline = {
        "schemaVersion": 2,
        "generatedAt": "2026-04-06T03:00:00Z",
        "generatedFromRunId": "test",
        "rationale": "test",
        "entries": [
            {
                "slug": "b/page",
                "issueType": "segment-missing",
                "sectionPath": "A",
                "segmentKind": "paragraph",
                "enSegmentIndex": 0,
                "jaSegmentIndex": None,
                "enSourceFingerprint": EN_SEGMENT_FINGERPRINT,
                "jaSourceFingerprint": None,
                "missingTokens": None,
                "snapshotFingerprint": VALID_FINGERPRINT,
                "priority": "medium",
            },
            {
                "slug": "a/page",
                "issueType": "segment-missing",
                "sectionPath": "A",
                "segmentKind": "paragraph",
                "enSegmentIndex": 0,
                "jaSegmentIndex": None,
                "enSourceFingerprint": OTHER_FINGERPRINT,
                "jaSourceFingerprint": None,
                "missingTokens": None,
                "snapshotFingerprint": VALID_FINGERPRINT,
                "priority": "medium",
            },
        ],
    }
    out = serialize_baseline(baseline)
    a_idx = out.index('"slug": "a/page"')
    b_idx = out.index('"slug": "b/page"')
    assert a_idx < b_idx


def test_serialize_bit_identical_across_independent_builds() -> None:
    out1 = serialize_baseline(build_baseline_from_status(_sample_status(), _FINGERPRINT_MAP, _META))
    out2 = serialize_baseline(build_baseline_from_status(_sample_status(), _FINGERPRINT_MAP, _META))
    assert out1 == out2


# ----------------------------------------------------------------------
# merge_partial_baseline
# ----------------------------------------------------------------------


def _existing() -> dict[str, Any]:
    return {
        "schemaVersion": 2,
        "generatedAt": "2026-04-01T00:00:00Z",
        "generatedFromRunId": "old-run",
        "rationale": "existing",
        "entries": [
            {
                "slug": "overview/example",
                "issueType": "segment-missing",
                "sectionPath": "Setup",
                "segmentKind": "paragraph",
                "enSegmentIndex": 0,
                "jaSegmentIndex": None,
                "enSourceFingerprint": EN_SEGMENT_FINGERPRINT,
                "jaSourceFingerprint": None,
                "missingTokens": None,
                "snapshotFingerprint": OTHER_FINGERPRINT,
                "priority": "medium",
            },
            {
                "slug": "other/page",
                "issueType": "segment-missing",
                "sectionPath": "Other",
                "segmentKind": "paragraph",
                "enSegmentIndex": 1,
                "jaSegmentIndex": None,
                "enSourceFingerprint": OTHER_FINGERPRINT,
                "jaSourceFingerprint": None,
                "missingTokens": None,
                "snapshotFingerprint": VALID_FINGERPRINT,
                "priority": "medium",
            },
        ],
    }


def test_merge_partial_removes_targeted_slug_entries_and_adds_new() -> None:
    new_entries = [
        {
            "slug": "overview/example",
            "issueType": "segment-missing",
            "sectionPath": "Setup",
            "segmentKind": "paragraph",
            "enSegmentIndex": 2,
            "jaSegmentIndex": None,
            "enSourceFingerprint": EN_SEGMENT_FINGERPRINT,
            "jaSourceFingerprint": None,
            "missingTokens": None,
            "snapshotFingerprint": VALID_FINGERPRINT,
            "priority": "medium",
        }
    ]
    merged = merge_partial_baseline(
        _existing(),
        ["overview/example"],
        new_entries,
        {
            "generatedAt": "2026-04-06T03:00:00Z",
            "generatedFromRunId": "new-run",
            "rationale": "partial",
        },
    )
    assert len(merged["entries"]) == 2
    assert any(e["slug"] == "other/page" for e in merged["entries"])
    overview = next(e for e in merged["entries"] if e["slug"] == "overview/example")
    assert overview["snapshotFingerprint"] == VALID_FINGERPRINT
    assert overview["enSegmentIndex"] == 2


def test_merge_partial_removes_slug_entirely_when_no_new_entries() -> None:
    merged = merge_partial_baseline(
        _existing(),
        ["overview/example"],
        [],
        {
            "generatedAt": "2026-04-06T03:00:00Z",
            "generatedFromRunId": "new-run",
            "rationale": "partial",
        },
    )
    assert len(merged["entries"]) == 1
    assert merged["entries"][0]["slug"] == "other/page"


def test_merge_partial_updates_meta_fields() -> None:
    merged = merge_partial_baseline(
        _existing(),
        ["overview/example"],
        [],
        {
            "generatedAt": "2026-04-06T03:00:00Z",
            "generatedFromRunId": "new-run",
            "rationale": "partial",
        },
    )
    assert merged["generatedAt"] == "2026-04-06T03:00:00Z"
    assert merged["generatedFromRunId"] == "new-run"
    assert merged["rationale"] == "partial"


# ----------------------------------------------------------------------
# buildBaselineFromStatus: structure mismatch
# ----------------------------------------------------------------------


_STRUCTURE_FP_MAP = {"running-tests/the-command-line-cli": VALID_SNAPSHOT_FP}
_STRUCTURE_META = {
    "runId": "baseline-run",
    "generatedAt": "2026-04-06T03:00:00Z",
    "rationale": "baseline",
}


def _status_with_structure_mismatch() -> dict[str, Any]:
    return {
        "summary": {
            "checkedAt": "2026-04-06T03:00:00Z",
            "checkedFiles": 1,
            "totalFiles": 1,
        },
        "files": [
            {
                "file": "src/content/docs/running-tests/the-command-line-cli.md",
                "issues": [
                    {
                        "type": "section-structure-mismatch",
                        "severity": "actionable",
                        "detail": "[CLI Installation > Basic CLI command] block kind multiset",
                        "sectionPath": "CLI Installation > Basic CLI command",
                        "sectionIndex": 7,
                        "structureCategory": "kind-multiset",
                        "enKinds": ["paragraph", "bullet-list", "paragraph"],
                        "jaKinds": ["paragraph", "paragraph"],
                    }
                ],
            }
        ],
    }


def test_structure_mismatch_entry_shape() -> None:
    baseline = build_baseline_from_status(
        _status_with_structure_mismatch(), _STRUCTURE_FP_MAP, _STRUCTURE_META
    )
    assert len(baseline["entries"]) == 1
    entry = baseline["entries"][0]
    assert entry["issueType"] == "section-structure-mismatch"
    assert entry["slug"] == "running-tests/the-command-line-cli"
    assert entry["sectionIndex"] == 7
    assert entry["sectionPath"] == "CLI Installation > Basic CLI command"
    assert entry["structureCategory"] == "kind-multiset"
    assert entry["structureFingerprint"].startswith("sha256:")
    assert entry["priority"] == "medium"


def test_structure_fingerprint_matches_helper() -> None:
    baseline = build_baseline_from_status(
        _status_with_structure_mismatch(), _STRUCTURE_FP_MAP, _STRUCTURE_META
    )
    entry = baseline["entries"][0]
    expected = compute_structure_fingerprint(
        structureCategory="kind-multiset",
        enKinds=["paragraph", "bullet-list", "paragraph"],
        jaKinds=["paragraph", "paragraph"],
    )
    assert entry["structureFingerprint"] == expected


def test_structure_mismatch_skipped_on_malformed_sectionIndex() -> None:
    status = {
        "summary": {
            "checkedAt": "2026-04-06T03:00:00Z",
            "checkedFiles": 1,
            "totalFiles": 1,
        },
        "files": [
            {
                "file": "src/content/docs/running-tests/the-command-line-cli.md",
                "issues": [
                    {
                        "type": "section-structure-mismatch",
                        "severity": "actionable",
                        "sectionPath": "CLI",
                        "sectionIndex": "not-a-number",
                        "structureCategory": "kind-multiset",
                        "enKinds": ["paragraph"],
                        "jaKinds": ["paragraph"],
                    }
                ],
            }
        ],
    }
    baseline = build_baseline_from_status(status, _STRUCTURE_FP_MAP, _STRUCTURE_META)
    assert len(baseline["entries"]) == 0


# ----------------------------------------------------------------------
# source-unusable / snapshot-incomplete are NOT baseline-able (v2)
# ----------------------------------------------------------------------


_FAQ_FP_MAP = {"salesforce-testing/faq": VALID_SNAPSHOT_FP}


def test_source_unusable_not_emitted() -> None:
    status = {
        "summary": {
            "checkedAt": "2026-04-06T03:00:00Z",
            "checkedFiles": 1,
            "totalFiles": 1,
        },
        "files": [
            {
                "file": "src/content/docs/salesforce-testing/faq.md",
                "issues": [
                    {
                        "type": "source-unusable",
                        "severity": "actionable",
                        "detail": "source snapshot is unusable",
                        "usabilitySignals": {"reason": "escaped-details-residue"},
                    }
                ],
            }
        ],
    }
    baseline = build_baseline_from_status(status, _FAQ_FP_MAP, _STRUCTURE_META)
    assert len(baseline["entries"]) == 0


def test_snapshot_incomplete_not_emitted() -> None:
    status = {
        "summary": {
            "checkedAt": "2026-04-06T03:00:00Z",
            "checkedFiles": 1,
            "totalFiles": 1,
        },
        "files": [
            {
                "file": "src/content/docs/salesforce-testing/faq.md",
                "issues": [
                    {
                        "type": "snapshot-incomplete",
                        "severity": "actionable",
                        "usabilitySignals": {"reason": "shallow-snapshot"},
                    }
                ],
            }
        ],
    }
    baseline = build_baseline_from_status(status, _FAQ_FP_MAP, _STRUCTURE_META)
    assert len(baseline["entries"]) == 0


# ----------------------------------------------------------------------
# sortEntries: structure entries by sectionIndex within slug
# ----------------------------------------------------------------------


def test_sort_structure_mismatch_by_sectionIndex() -> None:
    fp_map = {"some/page": VALID_SNAPSHOT_FP}
    status = {
        "summary": {
            "checkedAt": "2026-04-06T03:00:00Z",
            "checkedFiles": 1,
            "totalFiles": 1,
        },
        "files": [
            {
                "file": "src/content/docs/some/page.md",
                "issues": [
                    {
                        "type": "section-structure-mismatch",
                        "severity": "actionable",
                        "sectionPath": "A",
                        "sectionIndex": 5,
                        "structureCategory": "kind-multiset",
                        "enKinds": ["paragraph"],
                        "jaKinds": ["paragraph", "paragraph"],
                    },
                    {
                        "type": "section-structure-mismatch",
                        "severity": "actionable",
                        "sectionPath": "B",
                        "sectionIndex": 1,
                        "structureCategory": "kind-multiset",
                        "enKinds": ["paragraph"],
                        "jaKinds": ["paragraph", "paragraph"],
                    },
                ],
            }
        ],
    }
    baseline = build_baseline_from_status(status, fp_map, _STRUCTURE_META)
    out = serialize_baseline(baseline)
    idx1 = out.index('"sectionIndex": 1')
    idx5 = out.index('"sectionIndex": 5')
    assert idx1 < idx5


# ----------------------------------------------------------------------
# parseArgs (_parse_cli_args in Python)
# ----------------------------------------------------------------------


def test_parse_cli_args_types_csv() -> None:
    args = _parse_cli_args(["--types=section-structure-mismatch,segment-order-mismatch"])
    assert args["types"] == ["section-structure-mismatch", "segment-order-mismatch"]


def test_parse_cli_args_types_null_when_not_specified() -> None:
    args = _parse_cli_args(["--regenerate"])
    assert args["types"] is None


def test_parse_cli_args_types_and_regenerate_both_surfaced() -> None:
    args = _parse_cli_args(["--regenerate", "--types=section-structure-mismatch"])
    assert args["regenerate"] is True
    assert args["types"] == ["section-structure-mismatch"]


def test_parse_cli_args_slug_and_types_both_surfaced() -> None:
    args = _parse_cli_args(["--slug=overview/foo", "--types=section-structure-mismatch"])
    assert args["slugs"] == ["overview/foo"]
    assert args["types"] == ["section-structure-mismatch"]


# ----------------------------------------------------------------------
# merge_partial_baseline_by_type
# ----------------------------------------------------------------------


_SEG_FP = "sha256:" + "c" * 64


def _existing_for_types() -> dict[str, Any]:
    return {
        "schemaVersion": 2,
        "generatedAt": "2026-03-01T00:00:00Z",
        "generatedFromRunId": "old-run",
        "rationale": "existing baseline",
        "entries": [
            {
                "slug": "overview/example",
                "issueType": "segment-missing",
                "sectionPath": "Setup",
                "segmentKind": "paragraph",
                "enSegmentIndex": 0,
                "jaSegmentIndex": None,
                "enSourceFingerprint": _SEG_FP,
                "jaSourceFingerprint": None,
                "missingTokens": None,
                "snapshotFingerprint": VALID_SNAPSHOT_FP,
                "priority": "medium",
            }
        ],
    }


def test_merge_by_type_replaces_only_targeted_types() -> None:
    new_structure_entry = {
        "slug": "running-tests/the-command-line-cli",
        "issueType": "section-structure-mismatch",
        "snapshotFingerprint": VALID_SNAPSHOT_FP,
        "priority": "medium",
        "sectionIndex": 7,
        "sectionPath": "CLI Installation > Basic CLI command",
        "structureCategory": "kind-multiset",
        "structureFingerprint": "sha256:" + "1" * 64,
    }
    merged = merge_partial_baseline_by_type(
        _existing_for_types(),
        ["section-structure-mismatch", "segment-order-mismatch"],
        [new_structure_entry],
        {
            "generatedAt": "2026-04-06T03:00:00Z",
            "generatedFromRunId": "baseline-run",
            "rationale": "partial baseline",
        },
    )
    assert len(merged["entries"]) == 2
    seg = next(e for e in merged["entries"] if e["issueType"] == "segment-missing")
    assert seg["priority"] == "medium"
    struct = next(e for e in merged["entries"] if e["issueType"] == "section-structure-mismatch")
    assert struct["sectionIndex"] == 7


def test_merge_by_type_removes_existing_entries_when_no_new() -> None:
    existing = _existing_for_types()
    existing["entries"].append(
        {
            "slug": "running-tests/the-command-line-cli",
            "issueType": "section-structure-mismatch",
            "snapshotFingerprint": VALID_SNAPSHOT_FP,
            "priority": "medium",
            "sectionIndex": 7,
            "sectionPath": "CLI",
            "structureCategory": "kind-multiset",
            "structureFingerprint": "sha256:" + "1" * 64,
        }
    )
    merged = merge_partial_baseline_by_type(
        existing,
        ["section-structure-mismatch"],
        [],
        {
            "generatedAt": "2026-04-06T03:00:00Z",
            "generatedFromRunId": "baseline-run",
            "rationale": "partial baseline",
        },
    )
    assert len(merged["entries"]) == 1
    assert merged["entries"][0]["issueType"] == "segment-missing"


def test_merge_by_type_preserves_non_targeted_types() -> None:
    merged = merge_partial_baseline_by_type(
        _existing_for_types(),
        ["section-structure-mismatch"],
        [],
        {
            "generatedAt": "2026-04-06T03:00:00Z",
            "generatedFromRunId": "baseline-run",
            "rationale": "partial baseline",
        },
    )
    assert len(merged["entries"]) == 1
    assert merged["entries"][0]["issueType"] == "segment-missing"
    assert merged["entries"][0]["priority"] == "medium"


# ----------------------------------------------------------------------
# validate_types_arg
# ----------------------------------------------------------------------


def test_validate_types_ok_when_none() -> None:
    assert validate_types_arg(None) == {"ok": True}


def test_validate_types_rejects_empty_list() -> None:
    result = validate_types_arg([])
    assert result["ok"] is False
    assert "empty" in result["error"] or "空" in result["error"]


def test_validate_types_rejects_unknown() -> None:
    result = validate_types_arg(["section-structure-misatch"])
    assert result["ok"] is False
    assert (
        "unsupported" in result["error"]
        or "unknown" in result["error"]
        or "未知" in result["error"]
    )
    assert "section-structure-misatch" in result["error"]


def test_validate_types_rejects_mixed_input_if_any_unknown() -> None:
    result = validate_types_arg(["section-structure-mismatch", "foo-bar"])
    assert result["ok"] is False
    assert "foo-bar" in result["error"]


@pytest.mark.parametrize("t", ["section-structure-mismatch", "segment-order-mismatch"])
def test_validate_types_allowlist(t: str) -> None:
    assert validate_types_arg([t]) == {"ok": True}


def test_validate_types_combination_allowlist() -> None:
    assert validate_types_arg(["section-structure-mismatch", "segment-order-mismatch"]) == {
        "ok": True
    }


@pytest.mark.parametrize("t", ["snapshot-incomplete", "source-unusable"])
def test_validate_types_rejects_non_v2_types(t: str) -> None:
    result = validate_types_arg([t])
    assert result["ok"] is False


@pytest.mark.parametrize(
    "t",
    [
        "segment-missing",
        "segment-extra",
        "segment-shifted",
        "segment-untranslated",
        "segment-token-gap",
        "segment-inconclusive",
    ],
)
def test_validate_types_rejects_segment_types(t: str) -> None:
    result = validate_types_arg([t])
    assert result["ok"] is False


def test_validate_types_rejects_non_list() -> None:
    result = validate_types_arg("section-structure-mismatch")
    assert result["ok"] is False


# ----------------------------------------------------------------------
# parse + validate integration
# ----------------------------------------------------------------------


def test_parse_then_validate_empty_rejected() -> None:
    args = _parse_cli_args(["--types="])
    # filter-empty → []
    assert args["types"] == []
    assert validate_types_arg(args["types"])["ok"] is False


def test_parse_then_validate_typo_rejected() -> None:
    args = _parse_cli_args(["--types=section-structure-misatch"])
    assert args["types"] == ["section-structure-misatch"]
    result = validate_types_arg(args["types"])
    assert result["ok"] is False
    assert "section-structure-misatch" in result["error"]


def test_parse_then_validate_allowed_round_trip() -> None:
    args = _parse_cli_args(["--types=section-structure-mismatch"])
    assert args["types"] == ["section-structure-mismatch"]
    assert validate_types_arg(args["types"])["ok"] is True


# ----------------------------------------------------------------------
# CLI: --review-after is rejected in v2
# ----------------------------------------------------------------------


def test_main_rejects_review_after(capsys: pytest.CaptureFixture[str]) -> None:
    exit_code = main(["--regenerate", "--review-after=2026-12-31"])
    assert exit_code != 0
    captured = capsys.readouterr()
    combined = captured.err + captured.out
    assert "--review-after" in combined
    # "removed" / "撤去" / "v2"
    assert "removed" in combined or "撤去" in combined or "v2" in combined


def test_main_rejects_review_after_with_slug(
    capsys: pytest.CaptureFixture[str],
) -> None:
    exit_code = main(["--slug=overview/example", "--review-after=2026-12-31"])
    assert exit_code != 0
    captured = capsys.readouterr()
    combined = captured.err + captured.out
    assert "--review-after" in combined


# ----------------------------------------------------------------------
# assert_pre_regen_gate
# ----------------------------------------------------------------------


def _passing_status() -> dict[str, Any]:
    return {
        "summary": {
            "runScope": {"isComplete": True},
            "freshnessState": "fresh",
            "linkageState": "linked",
            "result": "pass",
            "orphanBaselineEntries": 0,
            "checkedFiles": 288,
            "totalFiles": 288,
            "checkedAt": "2026-04-20T00:00:00.000Z",
        },
        "debug": {"patchCoverage": {"mismatches": []}},
        "files": [],
    }


def _passing_snapshot_diff() -> dict[str, Any]:
    return {
        "summary": {
            "changed": 0,
            "added": 0,
            "removed": 0,
            "unchanged": 288,
            "totalSnapshots": 288,
        }
    }


def test_gate_passes_when_all_invariants_hold() -> None:
    assert_pre_regen_gate(_passing_status(), _passing_snapshot_diff())


def test_gate_fails_runScope_not_complete() -> None:
    s = _passing_status()
    s["summary"]["runScope"] = {"isComplete": False}
    with pytest.raises(ValueError, match=r"runScope\.isComplete"):
        assert_pre_regen_gate(s, _passing_snapshot_diff())


def test_gate_fails_freshnessState_not_fresh() -> None:
    s = _passing_status()
    s["summary"]["freshnessState"] = "stale"
    with pytest.raises(ValueError, match="freshnessState"):
        assert_pre_regen_gate(s, _passing_snapshot_diff())


def test_gate_fails_linkageState_not_linked() -> None:
    s = _passing_status()
    s["summary"]["linkageState"] = "missing"
    with pytest.raises(ValueError, match="linkageState"):
        assert_pre_regen_gate(s, _passing_snapshot_diff())


def test_gate_fails_result_not_pass() -> None:
    s = _passing_status()
    s["summary"]["result"] = "inconclusive"
    with pytest.raises(ValueError, match=r"summary\.result"):
        assert_pre_regen_gate(s, _passing_snapshot_diff())


def test_gate_fails_orphan_baseline_non_zero() -> None:
    s = _passing_status()
    s["summary"]["orphanBaselineEntries"] = 3
    with pytest.raises(ValueError, match="orphanBaselineEntries"):
        assert_pre_regen_gate(s, _passing_snapshot_diff())


def test_gate_fails_patch_coverage_mismatches_non_empty() -> None:
    s = _passing_status()
    s["debug"]["patchCoverage"]["mismatches"] = [{"patchId": "UD-001A", "slug": "x/y"}]
    with pytest.raises(ValueError, match=r"patchCoverage\.mismatches"):
        assert_pre_regen_gate(s, _passing_snapshot_diff())


def test_gate_fails_patch_coverage_missing() -> None:
    s = _passing_status()
    s["debug"] = {}
    with pytest.raises(ValueError, match=r"patchCoverage\.mismatches"):
        assert_pre_regen_gate(s, _passing_snapshot_diff())


def test_gate_fails_snapshot_diff_changed_non_zero() -> None:
    d = _passing_snapshot_diff()
    d["summary"]["changed"] = 1
    with pytest.raises(ValueError, match=r"snapshotDiff\.summary\.changed"):
        assert_pre_regen_gate(_passing_status(), d)


def test_gate_fails_snapshot_diff_added_non_zero() -> None:
    d = _passing_snapshot_diff()
    d["summary"]["added"] = 2
    with pytest.raises(ValueError, match=r"snapshotDiff\.summary\.added"):
        assert_pre_regen_gate(_passing_status(), d)


def test_gate_fails_snapshot_diff_removed_non_zero() -> None:
    d = _passing_snapshot_diff()
    d["summary"]["removed"] = 4
    with pytest.raises(ValueError, match=r"snapshotDiff\.summary\.removed"):
        assert_pre_regen_gate(_passing_status(), d)


def test_gate_fails_snapshot_diff_summary_missing() -> None:
    with pytest.raises(ValueError, match="snapshot-diff-status.json: summary"):
        assert_pre_regen_gate(_passing_status(), {})


def test_gate_fails_status_summary_missing() -> None:
    with pytest.raises(ValueError, match="summary missing or not an object"):
        assert_pre_regen_gate({}, _passing_snapshot_diff())


def test_gate_aggregates_multiple_failures() -> None:
    s = _passing_status()
    s["summary"]["freshnessState"] = "stale"
    s["summary"]["linkageState"] = "missing"
    s["summary"]["result"] = "inconclusive"
    d = _passing_snapshot_diff()
    d["summary"]["changed"] = 2
    with pytest.raises(ValueError) as exc_info:
        assert_pre_regen_gate(s, d)
    msg = str(exc_info.value)
    assert "freshnessState" in msg
    assert "linkageState" in msg
    assert "summary.result" in msg
    assert "snapshotDiff.summary.changed" in msg


# ----------------------------------------------------------------------
# load_snapshot_diff_status
# ----------------------------------------------------------------------


def test_load_snapshot_diff_missing_raises(tmp_path: Path) -> None:
    missing = tmp_path / "does-not-exist.json"
    with pytest.raises(ValueError, match="not found"):
        load_snapshot_diff_status(missing)


def test_load_snapshot_diff_invalid_json_raises(tmp_path: Path) -> None:
    bad = tmp_path / "bad.json"
    bad.write_text("{not json}", encoding="utf-8")
    with pytest.raises(ValueError, match="parse failure"):
        load_snapshot_diff_status(bad)


def test_load_snapshot_diff_returns_parsed_when_valid(tmp_path: Path) -> None:
    good = tmp_path / "ok.json"
    good.write_text(json.dumps({"summary": {"changed": 0}}), encoding="utf-8")
    parsed = load_snapshot_diff_status(good)
    assert parsed == {"summary": {"changed": 0}}
