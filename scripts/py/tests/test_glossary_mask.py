"""glossary_mask のユニットテスト — 用語集 / invariant pattern マスキング。"""

from __future__ import annotations

from testim_parity.glossary_mask import (
    classify_segment,
    create_mask_coverage,
    load_glossary,
    load_invariant_patterns,
    mask_segment_text,
)


def test_load_glossary_returns_ordered_list():
    """挿入順を保った list を返す (JS `Set` の iteration order 互換)。"""
    terms = load_glossary()
    assert isinstance(terms, list)
    assert len(terms) > 0
    # 重複なしを確認 (挿入時に dedup している契約)
    assert len(terms) == len(set(terms))


def test_load_invariant_patterns_returns_compiled_regexes():
    patterns = load_invariant_patterns()
    assert isinstance(patterns, list)
    assert len(patterns) > 0
    first = patterns[0]
    assert "id" in first
    assert "regex" in first


class TestMaskSegmentText:
    def test_empty_returns_empty(self):
        out = mask_segment_text("")
        assert out["masks"] == []

    def test_non_string_returns_input(self):
        out = mask_segment_text(None)  # type: ignore[arg-type]
        assert out["masks"] == []

    def test_masks_glossary_term(self):
        # "Testim" は glossary に含まれているため placeholder に置き換えられる
        out = mask_segment_text("This is Testim.")
        assert "__GLOSSARY__" in out["maskedText"]
        assert any(m["source"] == "glossary" for m in out["masks"])

    def test_equal_length_tie_preserves_insertion_order(self):
        """同長タイが insertion order を保持することを保証する (codex Round 4 指摘)。

        ``iOS`` と ``ios`` は両方 3 文字だが glossary 上の登場順 (``iOS`` が先)
        に合わせて mask entry も ``iOS`` 先行で emit される。Python `set` を
        使っていた Round 3 以前は hash randomization で順序が swap し得た。
        """
        out = mask_segment_text("Use iOS in https://open.spotify.com on iOS")
        glossary_masks = [m for m in out["masks"] if m["source"] == "glossary"]
        # "iOS" マッチが存在し、entry は "iOS" (大文字) であることを確認。
        # mjs は glossary の登場順で sort stable なので、同じ "iOS" が emit される。
        ios_masks = [m for m in glossary_masks if m["entry"].lower() == "ios"]
        assert ios_masks, "iOS mask should be emitted"
        # 登場順 (挿入順) に従って "iOS" (大文字) を優先する
        assert all(m["entry"] == "iOS" for m in ios_masks), (
            f"tie-break order regressed: got {[m['entry'] for m in ios_masks]!r}"
        )


class TestClassifySegment:
    def test_empty_text(self):
        result = classify_segment("")
        assert result["isFullyMasked"] is True

    def test_no_ascii(self):
        result = classify_segment("日本語だけのテキスト")
        assert result["isFullyMasked"] is True

    def test_fully_masked_short_residue(self):
        # 短すぎる residue は fully-masked 判定
        result = classify_segment("Testim")
        assert result["isFullyMasked"] is True

    def test_untranslated_english_prose_detected(self):
        # 十分に長く (>= RESIDUE_MIN_LENGTH=15) かつ、glossary / invariant / URL
        # / code span のいずれにもマッチしないプレーン英文。
        text = "zebra quagga tapir okapi narwhal wombat aardvark pangolin"
        result = classify_segment(text)
        assert result["isFullyMasked"] is False
        assert result["residue"]
        # 明らかに翻訳済み日本語文は isFullyMasked=True になる
        ja_result = classify_segment("これは完全に日本語のみで構成されたテキストです。")
        assert ja_result["isFullyMasked"] is True


class TestCoverageAggregator:
    def test_record_and_aggregate(self):
        cov = create_mask_coverage()
        cov["record"](
            slug="x",
            segment_kind="paragraph",
            section_path="A",
            masks=[{"source": "glossary", "entry": "Testim", "span": {"start": 0, "end": 6}}],
        )
        snap = cov["toJSON"]()
        assert snap["summary"]["segmentsMasked"] == 1
        assert snap["summary"]["byGlossaryEntry"] == {"Testim": 1}

    def test_skip_on_empty_masks(self):
        cov = create_mask_coverage()
        cov["record"](slug="x", segment_kind="paragraph", section_path="A", masks=[])
        assert cov["toJSON"]()["summary"]["segmentsMasked"] == 0
