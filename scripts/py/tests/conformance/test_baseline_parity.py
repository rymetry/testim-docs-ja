"""baseline (schema v2) の mjs byte 一致 conformance。

``source_parity_baseline.mjs`` と ``baseline.py`` の以下 surface を pin する:

- constants: ``BASELINE_ELIGIBLE_TYPES`` / ``TYPES_ARG_ALLOWLIST`` /
  ``PRIORITY_VALUES`` / ``STRUCTURE_CATEGORIES`` / ``NOTE_MAX_LENGTH``
- ``validate_types_arg`` — CLI arg guard
- ``compute_structure_fingerprint`` — structure mismatch identity fingerprint
- ``validate_baseline`` — schema v2 全 branch エラー文言
- ``build_baseline_key`` / ``build_baseline_key_from_entry`` — 3 family
  (JA-owned / EN-owned / structure mismatch) の key 再現
- ``tag_issues_with_baseline`` — match / invalidation / pass-through
- ``compute_orphan_baseline_entries`` — matched_keys 差分計算

baseline identity key は ``align.py`` の ParityDiff output に直結するため、
byte-identical な一致を保つこと (drift があると cutover 時に同一 issue が
double-count される)。
"""

from __future__ import annotations

import pytest

from testim_parity.baseline import (
    BASELINE_ELIGIBLE_TYPES,
    NOTE_MAX_LENGTH,
    PRIORITY_VALUES,
    STRUCTURE_CATEGORIES,
    TYPES_ARG_ALLOWLIST,
    build_baseline_key,
    build_baseline_key_from_entry,
    compute_orphan_baseline_entries,
    compute_structure_fingerprint,
    tag_issues_with_baseline,
    validate_baseline,
    validate_types_arg,
)

from ._harness import run_batch

FP = "sha256:" + "0" * 64
FP2 = "sha256:" + "f" * 64

# ---------------------------------------------------------------------------
# sample 群 (args はそのまま mjs / Python 双方に渡す)
# ---------------------------------------------------------------------------

VALIDATE_TYPES_ARG_SAMPLES: list = [
    [None],
    [["section-structure-mismatch"]],
    [["section-structure-mismatch", "segment-order-mismatch"]],
    [[]],
    [["segment-missing"]],
    [["section-structure-mismatch", "segment-extra"]],
]


STRUCTURE_FP_SAMPLES: list = [
    [
        {
            "structureCategory": "kind-multiset",
            "enKinds": ["paragraph", "ordered-list-item"],
            "jaKinds": ["paragraph", "ordered-list-item"],
        }
    ],
    [
        {
            "structureCategory": "kind-sequence",
            "enKinds": ["paragraph", "ordered-list-item", "paragraph"],
            "jaKinds": ["paragraph", "paragraph", "ordered-list-item"],
        }
    ],
    [
        {
            "structureCategory": "content-order",
            "enKinds": ["paragraph", "ordered-list-item", "paragraph"],
            "jaKinds": ["paragraph", "ordered-list-item", "paragraph"],
            "contentPermutation": [
                {"enIndex": 0, "jaIndex": 1, "score": 0.9},
                {"enIndex": 1, "jaIndex": 2},
                {"enIndex": 2, "jaIndex": 0},
            ],
        }
    ],
    [
        {
            # ``contentPermutation`` を渡しても category が content-order 以外なら無視
            "structureCategory": "kind-multiset",
            "enKinds": ["paragraph"],
            "jaKinds": ["paragraph"],
            "contentPermutation": [{"enIndex": 0, "jaIndex": 0}],
        }
    ],
]


# baseline entry の最小 valid 例群 (issueType ごと)。
_STRUCTURE_FP = (
    "sha256:" + "a" * 64
)  # ``compute_structure_fingerprint`` から derive される値は別途 test
VALID_ENTRIES: dict[str, dict] = {
    "segment-missing": {
        "slug": "a/b",
        "issueType": "segment-missing",
        "snapshotFingerprint": FP,
        "priority": "medium",
        "enSegmentIndex": 3,
        "enSourceFingerprint": FP2,
        "sectionPath": "Intro",
        "segmentKind": "paragraph",
    },
    "segment-extra": {
        "slug": "a/b",
        "issueType": "segment-extra",
        "snapshotFingerprint": FP,
        "priority": "low",
        "jaSegmentIndex": 4,
        "jaSourceFingerprint": FP2,
        "sectionPath": "Intro",
        "segmentKind": "paragraph",
    },
    "segment-shifted": {
        "slug": "a/b",
        "issueType": "segment-shifted",
        "snapshotFingerprint": FP,
        "priority": "high",
        "enSegmentIndex": 3,
        "enSourceFingerprint": FP2,
        "jaSourceFingerprint": FP,
        "sectionPath": "",
        "segmentKind": "section",
    },
    "segment-untranslated": {
        "slug": "a/b",
        "issueType": "segment-untranslated",
        "snapshotFingerprint": FP,
        "priority": "medium",
        "jaSegmentIndex": 0,
        "jaSourceFingerprint": FP2,
        "sectionPath": "Body",
        "segmentKind": "paragraph",
    },
    "segment-token-gap": {
        "slug": "a/b",
        "issueType": "segment-token-gap",
        "snapshotFingerprint": FP,
        "priority": "low",
        "enSegmentIndex": 2,
        "enSourceFingerprint": FP2,
        "missingTokens": ["token-a", "token-b", "token-a"],
        "sectionPath": "Body",
        "segmentKind": "paragraph",
    },
    "section-structure-mismatch": {
        "slug": "a/b",
        "issueType": "section-structure-mismatch",
        "snapshotFingerprint": FP,
        "priority": "medium",
        "sectionIndex": 2,
        "sectionPath": "Intro",
        "structureCategory": "kind-multiset",
        "structureFingerprint": _STRUCTURE_FP,
    },
    "segment-order-mismatch": {
        "slug": "a/b",
        "issueType": "segment-order-mismatch",
        "snapshotFingerprint": FP,
        "priority": "high",
        "sectionIndex": 0,
        "sectionPath": "",
        "structureCategory": "content-order",
        "structureFingerprint": _STRUCTURE_FP,
    },
}


VALIDATE_SAMPLES: list = [
    None,
    [],
    {"schemaVersion": 2, "entries": []},  # valid empty
    {"schemaVersion": 1},  # wrong version
    {"schemaVersion": 2, "entries": "not an array"},
    # valid all-types
    {"schemaVersion": 2, "entries": list(VALID_ENTRIES.values())},
    # missing slug
    {"schemaVersion": 2, "entries": [{**VALID_ENTRIES["segment-missing"], "slug": ""}]},
    # non-eligible type
    {
        "schemaVersion": 2,
        "entries": [{**VALID_ENTRIES["segment-missing"], "issueType": "source-unusable"}],
    },
    # bad fingerprint
    {
        "schemaVersion": 2,
        "entries": [{**VALID_ENTRIES["segment-missing"], "snapshotFingerprint": "not-sha"}],
    },
    # bad priority
    {
        "schemaVersion": 2,
        "entries": [{**VALID_ENTRIES["segment-missing"], "priority": "urgent"}],
    },
    # note too long
    {
        "schemaVersion": 2,
        "entries": [{**VALID_ENTRIES["segment-missing"], "note": "x" * 501}],
    },
    # structure missing sectionIndex
    {
        "schemaVersion": 2,
        "entries": [
            {
                k: v
                for k, v in VALID_ENTRIES["section-structure-mismatch"].items()
                if k != "sectionIndex"
            }
        ],
    },
    # segment-token-gap missing missingTokens
    {
        "schemaVersion": 2,
        "entries": [
            {k: v for k, v in VALID_ENTRIES["segment-token-gap"].items() if k != "missingTokens"}
        ],
    },
]


# ``build_baseline_key`` / ``build_baseline_key_from_entry`` sample 群。
# issue (``type``) と entry (``issueType``) の 2 形式で同一 key を得ることを検証。
KEY_ISSUE_SAMPLES: list = [
    [
        "a/b",
        {
            "type": "segment-missing",
            "sectionPath": "Intro",
            "segmentKind": "paragraph",
            "enSegmentIndex": 3,
            "enSourceFingerprint": FP2,
        },
    ],
    [
        "x/y",
        {
            "type": "segment-extra",
            "sectionPath": "",
            "segmentKind": "section",
            "jaSegmentIndex": 0,
            "jaSourceFingerprint": FP,
        },
    ],
    [
        "a/b",
        {
            "type": "segment-token-gap",
            "sectionPath": "Body",
            "segmentKind": "paragraph",
            "enSegmentIndex": 2,
            "enSourceFingerprint": FP2,
            "missingTokens": ["token-b", "token-a", "token-a"],
        },
    ],
    [
        "a/b",
        {
            "type": "segment-shifted",
            "sectionPath": "",
            "segmentKind": "section",
            "enSegmentIndex": 3,
            "enSourceFingerprint": FP2,
            "jaSourceFingerprint": FP,
        },
    ],
    [
        "a/b",
        {
            "type": "section-structure-mismatch",
            "sectionIndex": 2,
            "structureCategory": "kind-multiset",
            "enKinds": ["paragraph", "ordered-list-item"],
            "jaKinds": ["paragraph", "ordered-list-item"],
        },
    ],
    [
        "a/b",
        {
            "type": "segment-order-mismatch",
            "sectionIndex": 0,
            "structureCategory": "content-order",
            "enKinds": ["paragraph", "ordered-list-item"],
            "jaKinds": ["paragraph", "ordered-list-item"],
            "contentPermutation": [
                {"enIndex": 0, "jaIndex": 1},
                {"enIndex": 1, "jaIndex": 0},
            ],
        },
    ],
    # missing 値の ``_null_`` placeholder
    [
        "a/b",
        {
            "type": "segment-missing",
            "sectionPath": None,
            "segmentKind": None,
            "enSegmentIndex": None,
            "enSourceFingerprint": None,
        },
    ],
]


KEY_ENTRY_SAMPLES: list = [[e] for e in VALID_ENTRIES.values()]


TAG_SAMPLES: list = [
    # すべてマッチする
    [
        "a/b",
        [
            {
                "type": "segment-missing",
                "sectionPath": "Intro",
                "segmentKind": "paragraph",
                "enSegmentIndex": 3,
                "enSourceFingerprint": FP2,
            },
            {
                "type": "segment-extra",
                "sectionPath": "Intro",
                "segmentKind": "paragraph",
                "jaSegmentIndex": 4,
                "jaSourceFingerprint": FP2,
            },
        ],
        [VALID_ENTRIES["segment-missing"], VALID_ENTRIES["segment-extra"]],
        FP,
    ],
    # fingerprint 不一致 → 全 invalidate
    [
        "a/b",
        [
            {
                "type": "segment-missing",
                "sectionPath": "Intro",
                "segmentKind": "paragraph",
                "enSegmentIndex": 3,
                "enSourceFingerprint": FP2,
            }
        ],
        [VALID_ENTRIES["segment-missing"]],
        "sha256:" + "b" * 64,  # 入力と不一致
    ],
    # slug 一致しない entry は触らない
    [
        "other",
        [
            {
                "type": "segment-missing",
                "sectionPath": "Intro",
                "segmentKind": "paragraph",
                "enSegmentIndex": 3,
                "enSourceFingerprint": FP2,
            }
        ],
        [VALID_ENTRIES["segment-missing"]],
        FP,
    ],
    # baseline-eligible でない type は常に pass-through
    [
        "a/b",
        [{"type": "segment-inconclusive", "sectionPath": "x", "segmentKind": "paragraph"}],
        [VALID_ENTRIES["segment-missing"]],
        FP,
    ],
]


ORPHAN_SAMPLES: list = [
    # matched なし → 全 orphan
    ["a/b", [VALID_ENTRIES["segment-missing"], VALID_ENTRIES["segment-extra"]], []],
    # slug 違いの entry は除外
    ["other", [VALID_ENTRIES["segment-missing"]], []],
]


@pytest.fixture(scope="module")
def mjs_results(repo_root, node_available) -> dict:
    if not node_available:
        pytest.skip("node not available")
    calls: list = []
    calls.append({"function": "baseline_eligible_types", "args": []})
    calls.append({"function": "baseline_types_arg_allowlist", "args": []})
    calls.append({"function": "baseline_priority_values", "args": []})
    calls.append({"function": "baseline_structure_categories", "args": []})
    calls.append({"function": "baseline_note_max_length", "args": []})
    calls.extend(
        {"function": "baseline_validate_types_arg", "args": args}
        for args in VALIDATE_TYPES_ARG_SAMPLES
    )
    calls.extend(
        {"function": "baseline_compute_structure_fingerprint", "args": args}
        for args in STRUCTURE_FP_SAMPLES
    )
    calls.extend({"function": "baseline_validate", "args": [sample]} for sample in VALIDATE_SAMPLES)
    calls.extend({"function": "baseline_build_key", "args": args} for args in KEY_ISSUE_SAMPLES)
    calls.extend(
        {"function": "baseline_build_key_from_entry", "args": args} for args in KEY_ENTRY_SAMPLES
    )
    calls.extend({"function": "baseline_tag_issues", "args": args} for args in TAG_SAMPLES)
    # orphan は matched_keys を baseline_tag_issues の出力から引き継ぐ — ここでは
    # matched_keys = [] の場合のみ評価 (非 matched pattern)。
    calls.extend({"function": "baseline_orphan_entries", "args": args} for args in ORPHAN_SAMPLES)
    results = run_batch(repo_root, calls, timeout=60.0)

    cursor = 0

    def take(n: int) -> list:
        nonlocal cursor
        chunk = results[cursor : cursor + n]
        cursor += n
        return chunk

    return {
        "eligible_types": take(1)[0],
        "types_arg_allowlist": take(1)[0],
        "priority_values": take(1)[0],
        "structure_categories": take(1)[0],
        "note_max_length": take(1)[0],
        "validate_types_arg": take(len(VALIDATE_TYPES_ARG_SAMPLES)),
        "structure_fp": take(len(STRUCTURE_FP_SAMPLES)),
        "validate": take(len(VALIDATE_SAMPLES)),
        "build_key_issue": take(len(KEY_ISSUE_SAMPLES)),
        "build_key_entry": take(len(KEY_ENTRY_SAMPLES)),
        "tag": take(len(TAG_SAMPLES)),
        "orphan": take(len(ORPHAN_SAMPLES)),
    }


def test_constants_match_mjs(mjs_results):
    assert sorted(BASELINE_ELIGIBLE_TYPES) == mjs_results["eligible_types"]
    assert sorted(TYPES_ARG_ALLOWLIST) == mjs_results["types_arg_allowlist"]
    assert list(PRIORITY_VALUES) == mjs_results["priority_values"]
    assert sorted(STRUCTURE_CATEGORIES) == mjs_results["structure_categories"]
    assert NOTE_MAX_LENGTH == mjs_results["note_max_length"]


def test_validate_types_arg_matches_mjs(mjs_results):
    for args, mjs in zip(
        VALIDATE_TYPES_ARG_SAMPLES, mjs_results["validate_types_arg"], strict=True
    ):
        py = validate_types_arg(*args)
        assert py == mjs, f"diverge for args={args!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_structure_fingerprint_matches_mjs(mjs_results):
    for args, mjs in zip(STRUCTURE_FP_SAMPLES, mjs_results["structure_fp"], strict=True):
        (payload,) = args
        py = compute_structure_fingerprint(**payload)
        assert py == mjs, f"diverge for payload={payload!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_validate_matches_mjs(mjs_results):
    for sample, mjs in zip(VALIDATE_SAMPLES, mjs_results["validate"], strict=True):
        try:
            validate_baseline(sample)
            py = {"ok": True}
        except ValueError as e:
            py = {"ok": False, "error": str(e)}
        assert py == mjs, f"diverge for sample={sample!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_build_key_issue_matches_mjs(mjs_results):
    for args, mjs in zip(KEY_ISSUE_SAMPLES, mjs_results["build_key_issue"], strict=True):
        slug, issue = args
        py = build_baseline_key(slug, issue)
        assert py == mjs, f"diverge for issue={issue!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_build_key_from_entry_matches_mjs(mjs_results):
    for args, mjs in zip(KEY_ENTRY_SAMPLES, mjs_results["build_key_entry"], strict=True):
        (entry,) = args
        py = build_baseline_key_from_entry(entry)
        assert py == mjs, f"diverge for entry={entry!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_tag_issues_matches_mjs(mjs_results):
    for args, mjs in zip(TAG_SAMPLES, mjs_results["tag"], strict=True):
        slug, issues, entries, fp = args
        result = tag_issues_with_baseline(slug, issues, entries, fp)
        py = {
            "tagged": result["tagged"],
            "invalidated": result["invalidated"],
            "matchedKeys": sorted(result["matchedKeys"]),
        }
        assert py == mjs, f"diverge for args={args!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_orphan_entries_matches_mjs(mjs_results):
    for args, mjs in zip(ORPHAN_SAMPLES, mjs_results["orphan"], strict=True):
        slug, entries, matched_keys_list = args
        py = compute_orphan_baseline_entries(slug, entries, set(matched_keys_list))
        assert py == mjs, f"diverge for args={args!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_tag_then_orphan_roundtrip(mjs_results):
    """tag 結果の ``matchedKeys`` で orphan を計算すると整合する (純 Python テスト)。"""
    slug = "a/b"
    issues = [
        {
            "type": "segment-missing",
            "sectionPath": "Intro",
            "segmentKind": "paragraph",
            "enSegmentIndex": 3,
            "enSourceFingerprint": FP2,
        }
    ]
    entries = [VALID_ENTRIES["segment-missing"], VALID_ENTRIES["segment-extra"]]
    result = tag_issues_with_baseline(slug, issues, entries, FP)
    assert result["invalidated"] is False
    assert len(result["matchedKeys"]) == 1

    orphans = compute_orphan_baseline_entries(slug, entries, result["matchedKeys"])
    assert len(orphans) == 1
    assert orphans[0]["issueType"] == "segment-extra"
