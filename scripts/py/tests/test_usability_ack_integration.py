"""detect_source_usability → find_matching_acknowledgement round-trip (mjs port)。

``source_parity_usability_ack_integration.test.mjs`` を pytest に移植。実 file 依存を
避け、合成 HTML で detector を発火させ、ack matcher が detailIncludes で
issue を吸収できることを pin する。
"""

from __future__ import annotations

from typing import Any

from testim_parity.acknowledgements import (
    compute_snapshot_fingerprint,
    find_matching_acknowledgement,
)
from testim_parity.source_usability import detect_source_usability


def _ack_entry(
    *, slug: str, issue_type: str, detail_includes: str, fingerprint: str
) -> dict[str, Any]:
    return {
        "slug": slug,
        "issueType": issue_type,
        "sourceFingerprint": fingerprint,
        "reason": "known source-side debt, tracked in ops queue",
        "owner": "snapshot-ops",
        "reviewAfter": "2027-01-01",
        "detailIncludes": detail_includes,
    }


def test_escaped_details_residue_matched_by_detail_includes() -> None:
    """orphan ``&lt;/details&gt;`` close のみを持つ <p> — preprocess を回避して
    detector の Layer 2 が発火し、detailIncludes で ack 可能。"""
    raw_en_html = "<p>Some legacy body text &lt;/details&gt;</p>"
    en_segments: list = []
    ja_segments = [
        {"segmentKind": "heading", "sectionPath": "Top", "text": "トップ"},
        {"segmentKind": "heading", "sectionPath": "Q1", "text": "セクション 1"},
        {"segmentKind": "heading", "sectionPath": "Q2", "text": "セクション 2"},
        {"segmentKind": "paragraph", "sectionPath": "Q1", "text": "本文"},
    ]

    issue = detect_source_usability(
        raw_en_html=raw_en_html,
        en_segments=en_segments,
        ja_segments=ja_segments,
    )
    assert issue is not None, "detector は source-unusable issue を返すべき"
    assert issue["type"] == "source-unusable"
    assert issue["usabilitySignals"]["reason"] == "escaped-details-residue"

    fingerprint = compute_snapshot_fingerprint(raw_en_html)
    entry = _ack_entry(
        slug="synthetic/escaped-details-residue",
        issue_type="source-unusable",
        detail_includes="[reason=escaped-details-residue]",
        fingerprint=fingerprint,
    )

    match = find_matching_acknowledgement(
        "synthetic/escaped-details-residue",
        issue,
        [entry],
        fingerprint,
        "2026-04-09",
    )
    assert match is not None, (
        "[reason=escaped-details-residue] は detail 末尾に含まれるべき "
        f"(actual detail={issue['detail']!r})"
    )
    assert match["expired"] is False


def test_shallow_snapshot_matched_by_detail_includes() -> None:
    """shallow-snapshot も合成 HTML で発火させ detailIncludes で ack 可能。"""
    raw_en_html = "<h1>Stub</h1><p>single short paragraph.</p>"
    en_segments = [
        {"segmentKind": "heading", "sectionPath": "Top", "textNorm": "stub"},
        {
            "segmentKind": "paragraph",
            "sectionPath": "Top",
            "textNorm": "single short paragraph.",
        },
    ]
    # ja_segments を大きくして 5x ratio で Layer 3 を発火させる。
    ja_segments = [
        {
            "segmentKind": "paragraph",
            "sectionPath": f"セクション {i + 1}",
            "textNorm": f"日本語本文 {i + 1}",
        }
        for i in range(12)
    ]

    issue = detect_source_usability(
        raw_en_html=raw_en_html,
        en_segments=en_segments,
        ja_segments=ja_segments,
    )
    assert issue is not None, "detector は shallow-snapshot issue を返すべき"
    assert issue["type"] == "snapshot-incomplete"
    assert issue["usabilitySignals"]["reason"] == "shallow-snapshot"

    fingerprint = compute_snapshot_fingerprint(raw_en_html)
    entry = _ack_entry(
        slug="synthetic/shallow-snapshot",
        issue_type="snapshot-incomplete",
        detail_includes="[reason=shallow-snapshot]",
        fingerprint=fingerprint,
    )
    match = find_matching_acknowledgement(
        "synthetic/shallow-snapshot",
        issue,
        [entry],
        fingerprint,
        "2026-04-09",
    )
    assert match is not None, (
        "[reason=shallow-snapshot] は実 emitter 出力の detail 末尾に含まれるべき "
        f"(actual detail={issue['detail']!r})"
    )
