"""acknowledgements の mjs byte 一致 conformance。"""

from __future__ import annotations

import pytest

from testim_parity.acknowledgements import (
    compute_snapshot_fingerprint,
    find_matching_acknowledgement,
    is_acknowledgement_expired,
    tag_issues_with_acknowledgements,
    validate_acknowledgements,
)

from ._harness import run_batch

FINGERPRINT_SAMPLES = ["", "hello", "\u65e5\u672c\u8a9e"]

VALID_ENTRY = {
    "slug": "a/b",
    "issueType": "segment-extra",
    "sourceFingerprint": "sha256:" + "0" * 64,
    "reason": "x",
    "owner": "eng",
    "reviewAfter": "2027-01-01",
    "detailIncludes": "match",
}


VALIDATE_SAMPLES: list = [
    None,
    [],
    {"schemaVersion": 2, "entries": []},
    {"schemaVersion": 1},
    {"schemaVersion": 1, "entries": [{**VALID_ENTRY, "issueType": "segment-missing"}]},
    {"schemaVersion": 1, "entries": [{**VALID_ENTRY, "issueType": "heading-mismatch"}]},
    {"schemaVersion": 1, "entries": [{**VALID_ENTRY, "issueType": "unknown-type"}]},
    {
        "schemaVersion": 1,
        "entries": [{**VALID_ENTRY, "detailIncludes": None, "detailRegex": "[unclosed"}],
    },
    {"schemaVersion": 1, "entries": [{**VALID_ENTRY, "sourceFingerprint": "bad"}]},
    {"schemaVersion": 1, "entries": [{**VALID_ENTRY, "reviewAfter": "2026-7-6"}]},
    {"schemaVersion": 1, "entries": [{**VALID_ENTRY, "reviewAfter": "2026-02-31"}]},
    {"schemaVersion": 1, "entries": [VALID_ENTRY]},  # valid
]


EXPIRE_SAMPLES: list = [
    (VALID_ENTRY, None, "2026-05-01"),
    (VALID_ENTRY, "sha256:" + "f" * 64, "2026-05-01"),
    ({**VALID_ENTRY, "reviewAfter": "2025-01-01"}, VALID_ENTRY["sourceFingerprint"], "2026-05-01"),
    (VALID_ENTRY, VALID_ENTRY["sourceFingerprint"], "2026-05-01"),
]


FIND_SAMPLES: list = [
    # (slug, issue, entries, currentFingerprint, today)
    (
        "a/b",
        {"type": "segment-extra", "detail": "match here"},
        [VALID_ENTRY],
        VALID_ENTRY["sourceFingerprint"],
        "2026-05-01",
    ),
    (
        "other",
        {"type": "segment-extra", "detail": "match"},
        [VALID_ENTRY],
        VALID_ENTRY["sourceFingerprint"],
        "2026-05-01",
    ),
    (
        "a/b",
        {"type": "segment-shifted", "detail": "match"},
        [VALID_ENTRY],
        VALID_ENTRY["sourceFingerprint"],
        "2026-05-01",
    ),
    (
        "a/b",
        {"type": "segment-extra", "detail": "nope"},
        [VALID_ENTRY],
        VALID_ENTRY["sourceFingerprint"],
        "2026-05-01",
    ),
    (
        "a/b",
        {"type": "segment-extra", "detail": "see token-42 here"},
        [{**VALID_ENTRY, "detailIncludes": None, "detailRegex": r"token-\d+"}],
        VALID_ENTRY["sourceFingerprint"],
        "2026-05-01",
    ),
]


TAG_SAMPLES: list = [
    (
        "a/b",
        [
            {"type": "segment-extra", "detail": "match payload"},
            {"type": "segment-shifted", "detail": "nope"},
        ],
        [VALID_ENTRY],
        VALID_ENTRY["sourceFingerprint"],
        "2026-05-01",
    ),
    (
        "a/b",
        [{"type": "segment-extra", "detail": "match payload"}],
        [{**VALID_ENTRY, "reviewAfter": "2025-01-01"}],
        VALID_ENTRY["sourceFingerprint"],
        "2026-05-01",
    ),
]


@pytest.fixture(scope="module")
def mjs_results(repo_root, node_available) -> dict:
    if not node_available:
        pytest.skip("node not available")
    calls: list = []
    calls.extend(
        {"function": "acknowledgements_fingerprint", "args": [sample]}
        for sample in FINGERPRINT_SAMPLES
    )
    calls.extend(
        {"function": "acknowledgements_validate", "args": [sample]} for sample in VALIDATE_SAMPLES
    )
    calls.extend(
        {"function": "acknowledgements_is_expired", "args": list(args)} for args in EXPIRE_SAMPLES
    )
    calls.extend(
        {"function": "acknowledgements_find_match", "args": list(args)} for args in FIND_SAMPLES
    )
    calls.extend(
        {"function": "acknowledgements_tag_issues", "args": list(args)} for args in TAG_SAMPLES
    )
    calls.append({"function": "acknowledgements_non_acknowledgeable_types", "args": []})
    results = run_batch(repo_root, calls, timeout=60.0)
    a = len(FINGERPRINT_SAMPLES)
    b = a + len(VALIDATE_SAMPLES)
    c = b + len(EXPIRE_SAMPLES)
    d = c + len(FIND_SAMPLES)
    e = d + len(TAG_SAMPLES)
    return {
        "fingerprint": results[0:a],
        "validate": results[a:b],
        "expire": results[b:c],
        "find": results[c:d],
        "tag": results[d:e],
        "non_ack_types": results[e],
    }


def test_fingerprint_matches_mjs(mjs_results):
    for sample, mjs in zip(FINGERPRINT_SAMPLES, mjs_results["fingerprint"], strict=True):
        assert compute_snapshot_fingerprint(sample) == mjs


def test_validate_matches_mjs(mjs_results):
    """mjs は throw、Python は raise — harness wrapper が ``{ok, error}`` に包む。"""

    for sample, mjs in zip(VALIDATE_SAMPLES, mjs_results["validate"], strict=True):
        try:
            validate_acknowledgements(sample)
            py = {"ok": True}
        except ValueError as e:
            py = {"ok": False, "error": str(e)}
        assert py == mjs, f"diverge for sample={sample!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_is_expired_matches_mjs(mjs_results):
    for args, mjs in zip(EXPIRE_SAMPLES, mjs_results["expire"], strict=True):
        py = is_acknowledgement_expired(*args)
        assert py == mjs


def test_find_match_matches_mjs(mjs_results):
    for args, mjs in zip(FIND_SAMPLES, mjs_results["find"], strict=True):
        py = find_matching_acknowledgement(*args)
        assert py == mjs


def test_tag_issues_matches_mjs(mjs_results):
    for args, mjs in zip(TAG_SAMPLES, mjs_results["tag"], strict=True):
        py = tag_issues_with_acknowledgements(*args)
        assert py == mjs


def test_non_ackable_types_matches_mjs(mjs_results):
    from testim_parity.acknowledgements import NON_ACKNOWLEDGEABLE_TYPES

    assert sorted(NON_ACKNOWLEDGEABLE_TYPES) == mjs_results["non_ack_types"]
