"""orphan baseline detection の unit test (mjs port)。

``source_parity_orphan_integration.test.mjs`` の E2E 契約を pytest に移植。
mjs 版は ``checkSourceParity`` に tmp baseline/status path を注入する E2E だが、
Python 版は ``compute_orphan_baseline_entries`` の unit test として pin する
(E2E path は既存 ``test_check_source_parity.py`` がカバー済)。

契約:
  - baseline に実 runtime が emit しない ``enSegmentIndex=9999`` の stale
    segment-missing を注入すると、matched_keys に含まれない entry が orphan
    として返る。
"""

from __future__ import annotations

from testim_parity.baseline import (
    build_baseline_key_from_entry,
    compute_orphan_baseline_entries,
)

TARGET_SLUG = "settings/cli-prerequisites"


def test_stale_baseline_entry_surfaces_as_orphan() -> None:
    stale_entry = {
        "slug": TARGET_SLUG,
        "issueType": "segment-missing",
        "sectionPath": "__synthetic_orphan__",
        "segmentKind": "paragraph",
        "enSegmentIndex": 9999,
        "jaSegmentIndex": None,
        "enSourceFingerprint": "sha256:" + "9" * 64,
        "jaSourceFingerprint": None,
        "missingTokens": None,
        "sectionIndex": None,
        "structureCategory": None,
        "structureFingerprint": None,
        "snapshotFingerprint": "sha256:" + "a" * 64,
        "priority": "medium",
    }
    live_entry = {
        "slug": TARGET_SLUG,
        "issueType": "segment-extra",
        "sectionPath": "Live Section",
        "segmentKind": "paragraph",
        "enSegmentIndex": None,
        "jaSegmentIndex": 3,
        "enSourceFingerprint": None,
        "jaSourceFingerprint": "sha256:" + "b" * 64,
        "missingTokens": None,
        "sectionIndex": 1,
        "structureCategory": None,
        "structureFingerprint": None,
        "snapshotFingerprint": "sha256:" + "a" * 64,
        "priority": "medium",
    }
    entries = [stale_entry, live_entry]

    # runtime は live_entry だけを matched keys として返す想定
    matched_keys = {build_baseline_key_from_entry(live_entry)}

    orphans = compute_orphan_baseline_entries(TARGET_SLUG, entries, matched_keys)

    assert len(orphans) >= 1, f"orphan counter should be >= 1 (actual: {len(orphans)})"
    orphan_types = [o["issueType"] for o in orphans]
    assert "segment-missing" in orphan_types, (
        f"segment-missing orphan should be present: {orphan_types}"
    )
    # live entry は orphan に含まれない
    assert "segment-extra" not in orphan_types


def test_no_orphans_when_all_entries_matched() -> None:
    entry = {
        "slug": TARGET_SLUG,
        "issueType": "segment-missing",
        "sectionPath": "Real Section",
        "segmentKind": "paragraph",
        "enSegmentIndex": 1,
        "jaSegmentIndex": None,
        "enSourceFingerprint": "sha256:" + "c" * 64,
        "jaSourceFingerprint": None,
        "missingTokens": None,
        "sectionIndex": 0,
        "structureCategory": None,
        "structureFingerprint": None,
        "snapshotFingerprint": "sha256:" + "a" * 64,
        "priority": "medium",
    }
    matched_keys = {build_baseline_key_from_entry(entry)}
    orphans = compute_orphan_baseline_entries(TARGET_SLUG, [entry], matched_keys)
    assert orphans == []


def test_other_slug_entries_are_ignored() -> None:
    entry_other_slug = {
        "slug": "other/page",
        "issueType": "segment-missing",
        "sectionPath": "Other",
        "segmentKind": "paragraph",
        "enSegmentIndex": 2,
        "jaSegmentIndex": None,
        "enSourceFingerprint": "sha256:" + "d" * 64,
        "jaSourceFingerprint": None,
        "missingTokens": None,
        "sectionIndex": 0,
        "structureCategory": None,
        "structureFingerprint": None,
        "snapshotFingerprint": "sha256:" + "a" * 64,
        "priority": "medium",
    }
    orphans = compute_orphan_baseline_entries(TARGET_SLUG, [entry_other_slug], set())
    assert orphans == [], "別 slug の entry は対象 slug の orphan に含めない"
