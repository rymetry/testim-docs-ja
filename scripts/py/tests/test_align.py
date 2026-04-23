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


# --- runtime facade (mjs source_parity_align_runtime port) -----------------


def test_facade_exports_segment_api() -> None:
    """``testim_parity`` top-level は segment 抽出 / alignment API を露出する。"""
    import testim_parity.align as align_mod
    import testim_parity.segments_en as en_mod
    import testim_parity.segments_ja as ja_mod

    assert callable(align_mod.align_segments)
    assert callable(align_mod.parity_diffs_to_issues)
    assert callable(en_mod.extract_segments_from_html)
    assert callable(ja_mod.extract_segments_from_markdown)


def test_parity_diffs_to_issues_emits_primary_gate_actionable() -> None:
    """segment-* は primary gate に流れる actionable issue を emit する (phase tag なし)。"""
    from testim_parity.segments_en import extract_segments_from_html
    from testim_parity.segments_ja import extract_segments_from_markdown

    en_html = "<h2>Setup</h2><p>Configure with <code>--proxy</code>.</p>"
    ja_md = "## セットアップ\n\nプロキシを設定します。\n"
    en_segs = extract_segments_from_html(en_html)
    ja_segs = extract_segments_from_markdown(ja_md)
    alignment = align_segments(en_segs, ja_segs, slug="test/fixture")
    issues = parity_diffs_to_issues(alignment["diffs"])
    assert len(issues) > 0, "expected at least one diff (token-gap on --proxy)"
    for issue in issues:
        # shadow phase tagging は廃止。segment-* は primary gate に流れる。
        assert "phase" not in issue or issue.get("phase") is None
        assert issue["severity"] == "actionable"
        assert issue["detail"].startswith("["), "detail must include section label prefix"
        assert isinstance(issue["sectionIndex"], int)
        assert isinstance(issue["segmentKind"], str)


def test_parity_diffs_forwards_missing_tokens_on_token_gap() -> None:
    from testim_parity.segments_en import extract_segments_from_html
    from testim_parity.segments_ja import extract_segments_from_markdown

    en_html = "<h2>CLI</h2><p>Use <code>--proxy</code> for HTTP proxy.</p>"
    ja_md = "## CLI\n\nHTTP プロキシを使うときに指定します。\n"
    en_segs = extract_segments_from_html(en_html)
    ja_segs = extract_segments_from_markdown(ja_md)
    alignment = align_segments(en_segs, ja_segs, slug="test/fixture")
    issues = parity_diffs_to_issues(alignment["diffs"])
    token_gaps = [i for i in issues if i["type"] == "segment-token-gap"]
    assert token_gaps, "expected a segment-token-gap diff"
    missing = token_gaps[0]["missingTokens"]
    assert isinstance(missing, list)
    assert "--proxy" in missing


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


# ---------------------------------------------------------------------------
# Phase 5 gap-fill: mjs source_parity_align.test.mjs の主要シナリオを
# realistic ``create_segment`` 経由で pytest に寄せる。diff kind ごとに
# 1 件ずつ規定し、section boundary の cascade non-leak を確認する。
# ---------------------------------------------------------------------------


def _make_seg(section_path: str, kind: str, index: int, raw_text: str) -> dict:
    from testim_parity.segments_shared import create_segment

    return create_segment(
        section_path=section_path,
        kind=kind,
        segment_index=index,
        raw_text=raw_text,
    )


def _make_heading(section_path: str, index: int, raw_text: str) -> dict:
    return _make_seg(section_path, "heading", index, raw_text)


def test_align_identical_kinds_emit_no_segment_diffs() -> None:
    en = [
        _make_heading("Setup", 0, "Setup"),
        _make_seg("Setup", "paragraph", 0, "EN intro paragraph."),
        _make_seg("Setup", "unordered-list-item", 0, "EN bullet one"),
        _make_seg("Setup", "unordered-list-item", 1, "EN bullet two"),
    ]
    ja = [
        _make_heading("セットアップ", 0, "セットアップ"),
        _make_seg("セットアップ", "paragraph", 0, "JA 紹介段落"),
        _make_seg("セットアップ", "unordered-list-item", 0, "JA 箇条書き 1"),
        _make_seg("セットアップ", "unordered-list-item", 1, "JA 箇条書き 2"),
    ]
    result = align_segments(en, ja, slug="test/fixture")
    segment_types = [d["type"] for d in result["diffs"] if d["type"].startswith("segment")]
    assert segment_types == []


def test_align_preface_is_aligned_as_section() -> None:
    en = [
        _make_seg("", "paragraph", 0, "Intro paragraph in preface."),
        _make_heading("Setup", 0, "Setup"),
        _make_seg("Setup", "paragraph", 0, "Body paragraph."),
    ]
    ja = [
        _make_heading("セットアップ", 0, "セットアップ"),
        _make_seg("セットアップ", "paragraph", 0, "本文段落"),
    ]
    result = align_segments(en, ja, slug="test/fixture")
    missing = [d for d in result["diffs"] if d["type"] == "segment-missing"]
    assert len(missing) >= 1


def test_align_detects_single_missing_bullet() -> None:
    en = [
        _make_heading("Setup", 0, "Setup"),
        _make_seg("Setup", "unordered-list-item", 0, "Bullet one"),
        _make_seg("Setup", "unordered-list-item", 1, "Bullet two"),
        _make_seg("Setup", "unordered-list-item", 2, "Bullet three"),
    ]
    ja = [
        _make_heading("セットアップ", 0, "セットアップ"),
        _make_seg("セットアップ", "unordered-list-item", 0, "箇条 1"),
        _make_seg("セットアップ", "unordered-list-item", 1, "箇条 3"),
    ]
    result = align_segments(en, ja, slug="test/fixture")
    missing = [d for d in result["diffs"] if d["type"] == "segment-missing"]
    assert len(missing) == 1
    assert missing[0]["segmentKind"] == "unordered-list-item"


def test_align_detects_single_missing_ordered_list_item() -> None:
    en = [
        _make_heading("Steps", 0, "Steps"),
        _make_seg("Steps", "ordered-list-item", 0, "Step 1"),
        _make_seg("Steps", "ordered-list-item", 1, "Step 2"),
        _make_seg("Steps", "ordered-list-item", 2, "Step 3"),
    ]
    ja = [
        _make_heading("手順", 0, "手順"),
        _make_seg("手順", "ordered-list-item", 0, "手順 1"),
        _make_seg("手順", "ordered-list-item", 1, "手順 3"),
    ]
    result = align_segments(en, ja, slug="test/fixture")
    missing = [d for d in result["diffs"] if d["type"] == "segment-missing"]
    assert len(missing) == 1
    assert missing[0]["segmentKind"] == "ordered-list-item"


def test_align_detects_single_extra_paragraph() -> None:
    en = [
        _make_heading("Setup", 0, "Setup"),
        _make_seg("Setup", "paragraph", 0, "Paragraph one."),
        _make_seg("Setup", "paragraph", 1, "Paragraph two."),
    ]
    ja = [
        _make_heading("セットアップ", 0, "セットアップ"),
        _make_seg("セットアップ", "paragraph", 0, "段落 1"),
        _make_seg("セットアップ", "paragraph", 1, "余分な段落"),
        _make_seg("セットアップ", "paragraph", 2, "段落 2"),
    ]
    result = align_segments(en, ja, slug="test/fixture")
    extra = [d for d in result["diffs"] if d["type"] == "segment-extra"]
    assert len(extra) == 1
    assert extra[0]["segmentKind"] == "paragraph"


def test_align_flags_untranslated_english_only_ja_paragraph() -> None:
    en = [
        _make_heading("Setup", 0, "Setup"),
        _make_seg("Setup", "paragraph", 0, "Click on the Settings button to begin."),
    ]
    ja = [
        _make_heading("セットアップ", 0, "セットアップ"),
        _make_seg("セットアップ", "paragraph", 0, "Click on the Settings button to begin."),
    ]
    result = align_segments(en, ja, slug="test/fixture")
    untranslated = [d for d in result["diffs"] if d["type"] == "segment-untranslated"]
    assert len(untranslated) == 1


def test_align_does_not_flag_properly_translated_paragraph() -> None:
    en = [
        _make_heading("Setup", 0, "Setup"),
        _make_seg("Setup", "paragraph", 0, "Click on the Settings button to begin."),
    ]
    ja = [
        _make_heading("セットアップ", 0, "セットアップ"),
        _make_seg("セットアップ", "paragraph", 0, "設定ボタンをクリックして開始します。"),
    ]
    result = align_segments(en, ja, slug="test/fixture")
    untranslated = [d for d in result["diffs"] if d["type"] == "segment-untranslated"]
    assert untranslated == []


def test_align_invariant_token_only_ascii_ja_paragraph_is_not_untranslated() -> None:
    """``--proxy`` 等の invariant token が JA に残るだけなら untranslated 扱いにしない。"""
    en = [
        _make_heading("CLI", 0, "CLI"),
        _make_seg("CLI", "paragraph", 0, "`--proxy` flag accepts a URL."),
    ]
    ja = [
        _make_heading("CLI", 0, "CLI"),
        _make_seg("CLI", "paragraph", 0, "`--proxy` フラグは URL を受け取ります。"),
    ]
    result = align_segments(en, ja, slug="test/fixture")
    untranslated = [d for d in result["diffs"] if d["type"] == "segment-untranslated"]
    assert untranslated == []


def test_align_section_boundaries_do_not_cascade() -> None:
    """1 セクションの欠落が次セクションへ cascade しない (mjs 等価)。"""
    en = [
        _make_heading("A", 0, "A"),
        _make_seg("A", "paragraph", 0, "A1 paragraph."),
        _make_seg("A", "paragraph", 1, "A2 paragraph."),
        _make_heading("B", 0, "B"),
        _make_seg("B", "paragraph", 0, "Use `--bflag` for B1."),
    ]
    ja = [
        _make_heading("Aセクション", 0, "Aセクション"),
        _make_seg("Aセクション", "paragraph", 0, "A1 段落です。"),
        # A2 missing
        _make_heading("Bセクション", 0, "Bセクション"),
        _make_seg("Bセクション", "paragraph", 0, "`--bflag` を B1 で使用します。"),
    ]
    result = align_segments(en, ja, slug="test/fixture")
    missing = [d for d in result["diffs"] if d["type"] == "segment-missing"]
    assert len(missing) == 1
    assert missing[0]["sectionPath"] == "A"


def test_align_groups_diffs_by_section_path() -> None:
    en = [
        _make_heading("Setup", 0, "Setup"),
        _make_seg("Setup", "paragraph", 0, "Setup paragraph one."),
        _make_seg("Setup", "paragraph", 1, "Setup paragraph two."),
        _make_heading("Run", 0, "Run"),
        _make_seg("Run", "paragraph", 0, "Run paragraph one."),
    ]
    ja = [
        _make_heading("セットアップ", 0, "セットアップ"),
        _make_seg("セットアップ", "paragraph", 0, "セットアップ段落 1"),
        # setup paragraph 2 missing
        _make_heading("実行", 0, "実行"),
        _make_seg("実行", "paragraph", 0, "実行段落 1"),
    ]
    result = align_segments(en, ja, slug="test/fixture")
    missing = [d for d in result["diffs"] if d["type"] == "segment-missing"]
    assert len(missing) == 1
    assert missing[0]["sectionPath"] == "Setup"


# ---------------------------------------------------------------------------
# Phase 5 follow-up (PR #384 review P1-3):
#   deleted ``source_parity_align_runtime.test.mjs`` の pin slug content-correctness
#   guard を Python 側に移植する。実 corpus の primary pin JA file が extractable
#   segment を ≥3 生成することを検証 (empty-fixture drift guard)。
# ---------------------------------------------------------------------------


def test_primary_pin_slug_ja_file_yields_extractable_segments() -> None:
    """primary pin slug (``advanced-editing/parameters/hidden-parameters``) の JA
    file が ``extract_segments_from_markdown`` で ≥ 3 segment を emit する。

    これは baseline 運用 (entries == 0 を維持) と独立に、**content-correctness**
    を pin する guard。pin file が空になったり section heading のみになると、
    segment-level gate が意味を失うので、fixture drift で silent degrade しない
    ように ≥ 3 の non-empty contract を定める。"""
    from pathlib import Path

    from testim_parity.project import PROJECT_ROOT
    from testim_parity.segments_ja import extract_segments_from_markdown

    pin_slug = "advanced-editing/parameters/hidden-parameters"
    ja_path: Path = PROJECT_ROOT / "src" / "content" / "docs" / f"{pin_slug}.md"
    assert ja_path.exists(), f"primary pin JA file must exist at {ja_path}"

    # frontmatter 除去後の body を渡す契約。簡略化のため frontmatter 境界を
    # 探索して body のみ読み取る (read_doc_file を使わず minimal 依存)。
    raw = ja_path.read_text(encoding="utf-8")
    if raw.startswith("---\n"):
        end = raw.find("\n---", 4)
        body = raw[end + 4 :].lstrip("\n") if end >= 0 else raw
    else:
        body = raw

    segments = list(extract_segments_from_markdown(body))
    assert len(segments) >= 3, (
        f"primary pin must yield ≥ 3 segments to guard against empty-fixture "
        f"drift (actual: {len(segments)})"
    )
