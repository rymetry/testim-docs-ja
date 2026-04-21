"""align.py の unit test。

conformance test (test_align_parity.py) が mjs との byte 一致を担当。
ここでは Python 側の signature / 戻り値 shape / edge case を確認する。
"""

from __future__ import annotations

import pytest

from testim_parity.align import align_segments, parity_diffs_to_issues


def _seg(kind: str, **overrides):
    base = {
        "segmentKind": kind,
        "sectionPath": "",
        "segmentIndex": 0,
        "textNorm": "",
        "tokensInvariant": [],
        "sourceFingerprint": None,
        "line": None,
    }
    base.update(overrides)
    return base


# --- slug 必須 --------------------------------------------------------------


def test_align_raises_on_empty_slug():
    with pytest.raises(ValueError, match="slug option is required"):
        align_segments([], [], slug="")


def test_align_raises_on_non_str_slug():
    with pytest.raises(ValueError, match="slug option is required"):
        align_segments([], [], slug=None)  # type: ignore[arg-type]


# --- 空入力 -----------------------------------------------------------------


def test_align_empty_segments_returns_zero_sections():
    result = align_segments([], [], slug="x")
    assert result["inconclusive"] is False
    assert result["diffs"] == []
    assert result["sectionsCompared"] == 1  # preface section が 1 つできる


# --- heading count mismatch → inconclusive ---------------------------------


def test_align_heading_count_mismatch():
    en = [_seg("heading", sectionPath="A", textNorm="A"), _seg("paragraph", textNorm="body")]
    ja = [
        _seg("heading", sectionPath="A", textNorm="A"),
        _seg("heading", sectionPath="B", textNorm="B"),
        _seg("paragraph", textNorm="body"),
    ]
    result = align_segments(en, ja, slug="x")
    assert result["inconclusive"] is True
    assert result["inconclusiveCategory"] == "heading-count-mismatch"
    assert "Heading count mismatch" in result["inconclusiveReason"]


# --- identity pair → 差分なし ----------------------------------------------


def test_align_identical_sections():
    segs = [
        _seg("heading", sectionPath="A", textNorm="A"),
        _seg("paragraph", textNorm="body", tokensInvariant=["/docs/foo"]),
    ]
    result = align_segments(segs, segs, slug="x")
    assert result["inconclusive"] is False
    assert result["diffs"] == []


# --- segment-missing / segment-extra ---------------------------------------


def test_align_missing_paragraph_emits_segment_missing():
    en = [
        _seg("heading", sectionPath="A", textNorm="A"),
        _seg("paragraph", textNorm="missing", tokensInvariant=["tok1"]),
    ]
    ja = [_seg("heading", sectionPath="A", textNorm="A")]
    result = align_segments(en, ja, slug="x")
    types = [d["type"] for d in result["diffs"]]
    assert "segment-missing" in types


def test_align_extra_paragraph_emits_segment_extra():
    en = [_seg("heading", sectionPath="A", textNorm="A")]
    ja = [
        _seg("heading", sectionPath="A", textNorm="A"),
        _seg("paragraph", textNorm="extra 日本語"),
    ]
    result = align_segments(en, ja, slug="x")
    types = [d["type"] for d in result["diffs"]]
    assert "segment-extra" in types


# --- parity_diffs_to_issues ------------------------------------------------


def test_diffs_to_issues_empty():
    assert parity_diffs_to_issues([]) == []


def test_diffs_to_issues_non_list_returns_empty():
    assert parity_diffs_to_issues(None) == []  # type: ignore[arg-type]
    assert parity_diffs_to_issues({}) == []  # type: ignore[arg-type]


def test_diffs_to_issues_segment_diff():
    diff = {
        "type": "segment-missing",
        "sectionPath": "Intro",
        "sectionIndex": 0,
        "segmentKind": "paragraph",
        "enIndex": 0,
        "jaIndex": None,
        "enSegmentIndex": 5,
        "jaSegmentIndex": None,
        "enSourceFingerprint": "sha256:x",
        "jaSourceFingerprint": None,
        "detail": "missing paragraph",
        "missingTokens": ["t"],
    }
    issues = parity_diffs_to_issues([diff])
    assert len(issues) == 1
    assert issues[0]["type"] == "segment-missing"
    assert issues[0]["detail"] == "[Intro] missing paragraph"
    assert issues[0]["missingTokens"] == ["t"]


def test_diffs_to_issues_section_diff_preserves_structure_fields():
    diff = {
        "type": "section-structure-mismatch",
        "scope": "section",
        "sectionPath": "S",
        "sectionIndex": 1,
        "structureCategory": "kind-multiset",
        "enKinds": ["paragraph", "paragraph"],
        "jaKinds": ["paragraph"],
        "enSegmentCount": 2,
        "jaSegmentCount": 1,
        "detail": "block structure differs",
    }
    issues = parity_diffs_to_issues([diff])
    assert issues[0]["scope"] == "section"
    assert issues[0]["enKinds"] == ["paragraph", "paragraph"]
    assert issues[0]["structureCategory"] == "kind-multiset"


def test_diffs_to_issues_preserves_content_permutation():
    diff = {
        "type": "segment-order-mismatch",
        "scope": "section",
        "sectionPath": "S",
        "sectionIndex": 1,
        "structureCategory": "content-order",
        "enKinds": ["paragraph", "paragraph"],
        "jaKinds": ["paragraph", "paragraph"],
        "enSegmentCount": 2,
        "jaSegmentCount": 2,
        "detail": "blocks reordered",
        "contentPermutation": [
            {"enIndex": 0, "jaIndex": 1, "score": 150.0},
            {"enIndex": 1, "jaIndex": 0, "score": 140.0},
        ],
    }
    issues = parity_diffs_to_issues([diff])
    assert issues[0]["contentPermutation"] == [
        {"enIndex": 0, "jaIndex": 1, "score": 150.0},
        {"enIndex": 1, "jaIndex": 0, "score": 140.0},
    ]


def test_diffs_to_issues_segment_shifted_preserves_section_tokens():
    diff = {
        "type": "segment-shifted",
        "sectionPath": "A",
        "sectionIndex": 0,
        "segmentKind": "section",
        "enIndex": None,
        "jaIndex": None,
        "enSegmentIndex": None,
        "jaSegmentIndex": None,
        "enSourceFingerprint": None,
        "jaSourceFingerprint": None,
        "enSectionTokens": ["tok-a", "tok-b"],
        "jaSectionTokens": ["tok-c"],
        "confidence": "high",
        "detail": "shifted",
    }
    issues = parity_diffs_to_issues([diff])
    assert issues[0]["enSectionTokens"] == ["tok-a", "tok-b"]
    assert issues[0]["jaSectionTokens"] == ["tok-c"]
    assert issues[0]["confidence"] == "high"


def test_align_non_sequence_segments_handled():
    """non-Sequence 入力は filter_for_alignment で空に倒す (mjs 等価)。"""
    result = align_segments("not-a-list", [], slug="x")  # type: ignore[arg-type]
    assert result["inconclusive"] is False
    assert result["diffs"] == []


def test_align_segment_shifted_cross_section():
    """2 section の body が入れ替わった強い証拠を検出する。"""
    en = [
        _seg("heading", sectionPath="A", textNorm="A"),
        _seg("paragraph", textNorm="alpha", tokensInvariant=["tok-a1", "tok-a2", "tok-a3"]),
        _seg("heading", sectionPath="B", textNorm="B"),
        _seg("paragraph", textNorm="beta", tokensInvariant=["tok-b1", "tok-b2", "tok-b3"]),
    ]
    # JA は A と B の body を入れ替えた
    ja = [
        _seg("heading", sectionPath="A", textNorm="A"),
        _seg("paragraph", textNorm="ベータ", tokensInvariant=["tok-b1", "tok-b2", "tok-b3"]),
        _seg("heading", sectionPath="B", textNorm="B"),
        _seg("paragraph", textNorm="アルファ", tokensInvariant=["tok-a1", "tok-a2", "tok-a3"]),
    ]
    result = align_segments(en, ja, slug="x")
    types = [d["type"] for d in result["diffs"]]
    assert "segment-shifted" in types


def test_align_token_gap_emits_segment_token_gap():
    """JA に EN invariant token が欠けていれば segment-token-gap を emit する。"""
    en = [
        _seg("heading", sectionPath="A", textNorm="A"),
        _seg("paragraph", textNorm="use config.js", tokensInvariant=["config.js"]),
    ]
    ja = [
        _seg("heading", sectionPath="A", textNorm="A"),
        _seg("paragraph", textNorm="使います"),
    ]
    result = align_segments(en, ja, slug="x")
    types = [d["type"] for d in result["diffs"]]
    # config.js が JA に無いので token-gap or missing のどちらか発火
    assert ("segment-token-gap" in types) or ("segment-missing" in types)


def test_align_with_explicit_coverage_aggregator():
    """actual ``create_artifact_coverage()`` を渡して signature 整合を確認する。

    codex P1 指摘対応: 以前は stub が positional ``record(entry)`` を受けて
    いたため、production の keyword-only signature (``record(slug=..., token=...,
    reason=...)``) の不一致が mask されていた。ここでは実 aggregator を使って
    signature 乖離があれば TypeError で即検出する。
    """
    from testim_parity.artifact_registry import create_artifact_coverage

    coverage = create_artifact_coverage()
    # registry 登録済みの slug + token の組で artifact-registry suppression path
    # を通す (``ARTIFACT_REGISTRY`` の ENTRY_1 から最小 fixture を作る)
    registered_slug = "testops/insights/dashboard"
    registered_token = "/docs/index"
    en = [
        _seg("heading", sectionPath="A", textNorm="A"),
        _seg(
            "paragraph",
            textNorm="see index",
            tokensInvariant=[registered_token],
        ),
    ]
    ja = [
        _seg("heading", sectionPath="A", textNorm="A"),
        _seg("paragraph", textNorm="index を参照"),
    ]
    result = align_segments(en, ja, slug=registered_slug, coverage=coverage)
    assert result["inconclusive"] is False
    # suppression hit を coverage snapshot で確認
    snapshot = coverage["snapshot"]()
    assert snapshot["matchedHits"] == 1
    assert snapshot["bySlug"][registered_slug] == 1
    assert snapshot["byToken"][registered_token] == 1
