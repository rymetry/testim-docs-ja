"""acknowledgements の unit test。

mjs と byte 一致する conformance は test_acknowledgements_parity.py 側で担当。
こちらは Python 側の edge case (schema validation / expiration branching /
detailRegex matching) を個別確認する。
"""

from __future__ import annotations

import pytest

from testim_parity.acknowledgements import (
    NON_ACKNOWLEDGEABLE_TYPES,
    compute_snapshot_fingerprint,
    find_matching_acknowledgement,
    is_acknowledgement_expired,
    tag_issues_with_acknowledgements,
    validate_acknowledgements,
)


def test_snapshot_fingerprint_format():
    fp = compute_snapshot_fingerprint("hello")
    assert fp.startswith("sha256:")
    assert len(fp) == len("sha256:") + 64


def test_snapshot_fingerprint_is_deterministic():
    assert compute_snapshot_fingerprint("abc") == compute_snapshot_fingerprint("abc")
    assert compute_snapshot_fingerprint("abc") != compute_snapshot_fingerprint("xyz")


def test_non_acknowledgeable_types_includes_hard_gaps():
    assert "segment-missing" in NON_ACKNOWLEDGEABLE_TYPES
    assert "segment-untranslated" in NON_ACKNOWLEDGEABLE_TYPES
    assert "segment-token-gap" in NON_ACKNOWLEDGEABLE_TYPES


def _valid_entry(**overrides):
    base = {
        "slug": "a/b",
        "issueType": "segment-extra",  # ISSUE_SEVERITY に含まれ non-ackable でも coarse でもない
        "sourceFingerprint": "sha256:" + "0" * 64,
        "reason": "intentional",
        "owner": "eng",
        "reviewAfter": "2027-01-01",
        "detailIncludes": "some",
    }
    base.update(overrides)
    return base


def test_validate_rejects_non_dict():
    with pytest.raises(ValueError, match="JSON object"):
        validate_acknowledgements(None)
    with pytest.raises(ValueError, match="JSON object"):
        validate_acknowledgements([])


def test_validate_rejects_bad_schema_version():
    with pytest.raises(ValueError, match="Unsupported.*schemaVersion"):
        validate_acknowledgements({"schemaVersion": 2, "entries": []})


def test_validate_rejects_missing_entries_array():
    with pytest.raises(ValueError, match='"entries"'):
        validate_acknowledgements({"schemaVersion": 1})


def test_validate_rejects_non_acknowledgeable_type():
    entry = _valid_entry(issueType="segment-missing")
    with pytest.raises(ValueError, match="cannot be acknowledged"):
        validate_acknowledgements({"schemaVersion": 1, "entries": [entry]})


def test_validate_rejects_coarse_audit_signal_type():
    entry = _valid_entry(issueType="heading-mismatch")
    with pytest.raises(ValueError, match="audit-only coarse signal"):
        validate_acknowledgements({"schemaVersion": 1, "entries": [entry]})


def test_validate_rejects_unknown_type():
    entry = _valid_entry(issueType="no-such-type")
    with pytest.raises(ValueError, match="unknown issueType"):
        validate_acknowledgements({"schemaVersion": 1, "entries": [entry]})


def test_validate_rejects_missing_detail_fields():
    entry = _valid_entry()
    entry.pop("detailIncludes")
    with pytest.raises(ValueError, match="detailIncludes.*detailRegex"):
        validate_acknowledgements({"schemaVersion": 1, "entries": [entry]})


def test_validate_rejects_invalid_detail_regex():
    entry = _valid_entry(detailIncludes=None, detailRegex="[unclosed")
    with pytest.raises(ValueError, match="invalid detailRegex"):
        validate_acknowledgements({"schemaVersion": 1, "entries": [entry]})


def test_validate_rejects_invalid_fingerprint():
    entry = _valid_entry(sourceFingerprint="not-a-hash")
    with pytest.raises(ValueError, match="sourceFingerprint"):
        validate_acknowledgements({"schemaVersion": 1, "entries": [entry]})


@pytest.mark.parametrize(
    "bad_date", ["2026-7-6", "2026-02-31", "2026/01/01", "2026-13-01", "2026-00-05"]
)
def test_validate_rejects_bad_review_after(bad_date):
    entry = _valid_entry(reviewAfter=bad_date)
    with pytest.raises(ValueError, match="reviewAfter"):
        validate_acknowledgements({"schemaVersion": 1, "entries": [entry]})


def test_validate_accepts_valid_entry():
    parsed = {"schemaVersion": 1, "entries": [_valid_entry()]}
    assert validate_acknowledgements(parsed) is parsed


def test_is_expired_no_snapshot():
    entry = _valid_entry()
    assert is_acknowledgement_expired(entry, None, "2026-05-01") == {
        "expired": True,
        "reason": "no-snapshot",
    }


def test_is_expired_fingerprint_changed():
    entry = _valid_entry()
    result = is_acknowledgement_expired(entry, "sha256:" + "f" * 64, "2026-05-01")
    assert result == {"expired": True, "reason": "fingerprint-changed"}


def test_is_expired_review_date_passed():
    entry = _valid_entry(reviewAfter="2025-01-01")
    result = is_acknowledgement_expired(entry, entry["sourceFingerprint"], "2026-05-01")
    assert result == {"expired": True, "reason": "review-date-passed"}


def test_is_expired_not_expired():
    entry = _valid_entry(reviewAfter="2027-01-01")
    result = is_acknowledgement_expired(entry, entry["sourceFingerprint"], "2026-05-01")
    assert result == {"expired": False}


def test_find_matches_with_detail_includes():
    entry = _valid_entry(detailIncludes="target-token")
    issue = {"type": "segment-extra", "detail": "blah target-token blah"}
    match = find_matching_acknowledgement(
        entry["slug"], issue, [entry], entry["sourceFingerprint"], "2026-05-01"
    )
    assert match is not None
    assert match["expired"] is False
    assert match["entry"] is entry


def test_find_matches_with_detail_regex():
    entry = _valid_entry(detailIncludes=None, detailRegex=r"token-\d+")
    issue = {"type": "segment-extra", "detail": "see token-42 here"}
    match = find_matching_acknowledgement(
        entry["slug"], issue, [entry], entry["sourceFingerprint"], "2026-05-01"
    )
    assert match is not None


def test_find_skips_on_slug_mismatch():
    entry = _valid_entry(slug="other")
    issue = {"type": "segment-extra", "detail": "some"}
    assert (
        find_matching_acknowledgement(
            "a/b", issue, [entry], entry["sourceFingerprint"], "2026-05-01"
        )
        is None
    )


def test_find_skips_on_type_mismatch():
    entry = _valid_entry()
    issue = {"type": "segment-shifted", "detail": "some"}
    assert (
        find_matching_acknowledgement(
            entry["slug"], issue, [entry], entry["sourceFingerprint"], "2026-05-01"
        )
        is None
    )


def test_tag_issues_preserves_unmatched_reference():
    entry = _valid_entry()
    unmatched = {"type": "segment-shifted", "detail": "x"}
    matched = {"type": "segment-extra", "detail": "some"}
    issues = [unmatched, matched]
    out = tag_issues_with_acknowledgements(
        entry["slug"], issues, [entry], entry["sourceFingerprint"], "2026-05-01"
    )
    assert out[0] is unmatched  # mjs と同じ reference を保持
    assert out[1] != matched  # tagged copy
    assert out[1]["acknowledged"] is True
    assert out[1]["ackReason"] == entry["reason"]


def test_tag_issues_marks_expired_with_reason():
    entry = _valid_entry(reviewAfter="2025-01-01")
    matched = {"type": "segment-extra", "detail": "some"}
    out = tag_issues_with_acknowledgements(
        entry["slug"], [matched], [entry], entry["sourceFingerprint"], "2026-05-01"
    )
    assert out[0]["ackExpired"] is True
    assert out[0]["ackExpiryReason"] == "review-date-passed"
