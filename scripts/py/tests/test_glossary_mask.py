"""glossary_mask のユニットテスト — 用語集 / invariant pattern マスキング。"""

from __future__ import annotations

import pytest

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

    def test_masks_glossary_term_adjacent_to_cjk(self):
        """CJK 文字に隣接した英語 term も mask される (``\\b`` ASCII 境界)。

        Python default の ``\\b`` は Unicode 境界で、CJK 文字が ``\\w`` 扱いに
        なるため "Testimの設定" のような JA 隣接テキストで mask が発火しない
        regression があった。``re.ASCII`` flag で mjs と同一セマンティクスに
        固定する (post-merge review H1 指摘)。
        """
        for text in ("Testimの設定", "設定Testimを使う", "TestimとTestOpsを使う"):
            out = mask_segment_text(text)
            glossary_masks = [m for m in out["masks"] if m["source"] == "glossary"]
            assert glossary_masks, f"expected glossary mask for {text!r}, got none"

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
        cov.record(
            slug="x",
            segment_kind="paragraph",
            section_path="A",
            masks=[{"source": "glossary", "entry": "Testim", "span": {"start": 0, "end": 6}}],
        )
        snap = cov.to_json()
        assert snap["summary"]["segmentsMasked"] == 1
        assert snap["summary"]["byGlossaryEntry"] == {"Testim": 1}

    def test_skip_on_empty_masks(self):
        cov = create_mask_coverage()
        cov.record(slug="x", segment_kind="paragraph", section_path="A", masks=[])
        assert cov.to_json()["summary"]["segmentsMasked"] == 0

    def test_records_invariant_pattern_counter(self):
        cov = create_mask_coverage()
        cov.record(
            slug="test/slug",
            segment_kind="paragraph",
            section_path="Overview",
            masks=[
                {"source": "glossary", "entry": "Visual Editor", "span": {"start": 0, "end": 13}},
                {
                    "source": "invariant-pattern",
                    "pattern": "cli-flag",
                    "span": {"start": 20, "end": 32},
                },
            ],
        )
        json = cov.to_json()
        assert json["summary"]["segmentsMasked"] == 1
        assert json["summary"]["byGlossaryEntry"] == {"Visual Editor": 1}
        assert json["summary"]["byInvariantPattern"] == {"cli-flag": 1}
        assert len(json["maskedSegments"]) == 1

    def test_mask_coverage_object_is_typed_and_has_methods(self):
        """``create_mask_coverage()`` returns a ``MaskCoverage`` instance exposing
        ``record`` / ``to_json`` as methods (not a dict with callable values).

        Regression guard for the PR A refactor: the old dict-returning API
        (``cov["record"](...)``) silently tolerated camelCase kwargs when mask
        lists were empty, masking kwarg drift bugs (PR #384 round1). The typed
        class makes static analyzers catch that class of failure.
        """
        from testim_parity.glossary_mask import MaskCoverage

        cov = create_mask_coverage()
        assert isinstance(cov, MaskCoverage)
        assert callable(cov.record)
        assert callable(cov.to_json)


# ---------------------------------------------------------------------------
# Phase 5 gap-fill: mjs parity_glossary_mask.test.mjs の edge case 網羅
# ---------------------------------------------------------------------------


class TestGlossaryContract:
    """docs/GLOSSARY.md の canonical 用語 / 一般語除外 contract の regression guard。"""

    def test_canonical_terms_include_testim_and_visual_editor(self) -> None:
        glossary = load_glossary()
        assert "Testim" in glossary
        assert "Visual Editor" in glossary
        assert "Test Editor" in glossary

    def test_no_common_english_words_registered(self) -> None:
        """一般語 (Enter/Tab/Approve/Page Up/Page Down) を registering してはいけない。

        ``\\b`` word-boundary match で他文脈の短い英文を silently mask し、
        RESIDUE_MIN_WORDS=3 を bypass する false-negative を防ぐ。
        """
        glossary = set(load_glossary())
        for forbidden in ("Enter", "Tab", "Approve", "Page Up", "Page Down"):
            assert forbidden not in glossary, (
                f"GLOSSARY must not include generic word {forbidden!r}"
            )

    def test_no_compound_general_words(self) -> None:
        glossary = set(load_glossary())
        for forbidden in ("browser version", "major version", "Add action", "Add validation"):
            assert forbidden not in glossary

    @pytest.mark.parametrize(
        "text",
        ["Click Approve now", "Press Enter key", "Select Tab here"],
    )
    def test_three_word_all_english_segment_is_flagged(self, text: str) -> None:
        """一般語を含む 3 語全英文 segment は mask で bypass しない。"""
        assert classify_segment(text)["isFullyMasked"] is False

    @pytest.mark.parametrize(
        "text",
        [
            "Click Add action button",
            "Please Add validation now",
            "Select browser version carefully",
            "Choose major version now",
        ],
    )
    def test_compound_general_words_regression(self, text: str) -> None:
        assert classify_segment(text)["isFullyMasked"] is False


class TestInvariantPatterns:
    """INVARIANT_TOKENS.md に登録されるべき pattern id の regression guard。"""

    FROZEN_IDS = (
        "inline-js-throw-return",
        "table-header-pattern",
        "sfdc-ui-name-with-parens",
        "keyboard-shortcut-spaced",
        "common-it-loanword-device",
        "common-it-loanword-network",
        "common-it-loanword-ops",
        "technical-concept-repo",
        "technical-concept-auth",
        "technical-concept-validation",
    )

    def test_loaded_patterns_have_id_and_compiled_regex(self) -> None:
        patterns = load_invariant_patterns()
        for p in patterns:
            assert isinstance(p["id"], str)
            assert hasattr(p["regex"], "search")  # compiled re pattern

    def test_returns_superset_of_frozen_canonical_ids(self) -> None:
        ids = {p["id"] for p in load_invariant_patterns()}
        for frozen in self.FROZEN_IDS:
            assert frozen in ids, (
                f"frozen canonical pattern {frozen!r} must remain in INVARIANT_TOKENS.md"
            )

    def test_narrow_split_removed_old_wide_ids(self) -> None:
        """M4 T19 で削除された旧 wide pattern が再登場していないこと。"""
        ids = {p["id"] for p in load_invariant_patterns()}
        for removed in ("common-it-loanword", "technical-concept-term"):
            assert removed not in ids


class TestMaskRestoredPatterns:
    """PR #286-#291 で復元された主要 invariant pattern が動作することを pin する。"""

    def test_cli_flag_masks_project_id(self) -> None:
        result = mask_segment_text("Run with --project-id option.")
        patterns = [m.get("pattern") for m in result["masks"]]
        assert "cli-flag" in patterns

    def test_keyboard_shortcut_masks_ctrl_s(self) -> None:
        result = mask_segment_text("Press Ctrl+S to save.")
        patterns = [m.get("pattern") for m in result["masks"]]
        assert "keyboard-shortcut" in patterns

    def test_keyboard_shortcut_masks_lowercase_modifier(self) -> None:
        """textNorm が lower-case するため、``ctrl+shift+i`` でも match する。"""
        result = mask_segment_text("press ctrl+shift+i to open devtools")
        patterns = [m.get("pattern") for m in result["masks"]]
        assert "keyboard-shortcut" in patterns

    def test_js_exports_expression_masked(self) -> None:
        result = mask_segment_text("add exports.myvar to the scope")
        patterns = [m.get("pattern") for m in result["masks"]]
        assert "js-exports-expression" in patterns

    def test_sfdc_ui_name_with_parens_hit_vs_miss(self) -> None:
        hit = mask_segment_text("Use Filter (Where) to narrow the scope.")
        miss = mask_segment_text("Please filter the list carefully before submit.")
        assert "sfdc-ui-name-with-parens" in [m.get("pattern") for m in hit["masks"]]
        assert "sfdc-ui-name-with-parens" not in [m.get("pattern") for m in miss["masks"]]

    def test_inline_js_throw_return_hit_vs_miss(self) -> None:
        hit = mask_segment_text("The handler will throw new Error(msg) on failure.")
        miss = mask_segment_text("Review the error message before retry.")
        assert "inline-js-throw-return" in [m.get("pattern") for m in hit["masks"]]
        assert "inline-js-throw-return" not in [m.get("pattern") for m in miss["masks"]]


class TestMaskRecordShape:
    def test_mask_record_has_source_span_start_end(self) -> None:
        result = mask_segment_text("Use the Visual Editor to edit.")
        assert len(result["masks"]) > 0
        for m in result["masks"]:
            assert m["source"] in ("glossary", "invariant-pattern")
            assert isinstance(m["span"], dict)
            assert isinstance(m["span"]["start"], int)
            assert isinstance(m["span"]["end"], int)
            assert m["span"]["end"] > m["span"]["start"]


class TestClassifyUrlStripping:
    """URL-before-mask ordering (PR #293 / §5.3.6 / §5.3.7) の regression guard。"""

    @pytest.mark.parametrize(
        "text",
        [
            "サードパーティアプリは url ベースのスキームのみサポートする場合があります。"
            "例: https://byby.dev/ios-deep-linking 参照。",
            "spotify は次の種類の deep link のみサポートします: "
            "[https://open.spotify.com/artist/abc](https://open.spotify.com/artist/abc)",
            "サードパーティアプリは url ベースのスキームのみサポートする場合があります。"
            "例: <https://byby.dev/ios-deep-linking>",
            "例として `https://byby.dev/ios-deep-linking` を参照してください。",
            "詳細は [Conditions](/docs/editing-tests/conditions) を参照してください。",
            "詳細は https://example.com/docs/%E6%97%A5%E6%9C%AC%E8%AA%9E を参照してください。",
        ],
    )
    def test_urls_in_japanese_context_are_fully_masked(self, text: str) -> None:
        assert classify_segment(text)["isFullyMasked"] is True, text

    @pytest.mark.parametrize(
        "text",
        [
            "This is an untranslated description referring to "
            "https://byby.dev/ios-deep-linking for more details.",
            "The [documentation](https://example.com) describes advanced features in detail.",
            "This page mentions a malformed link https:/example.com that is broken.",
        ],
    )
    def test_untranslated_prose_with_url_is_flagged(self, text: str) -> None:
        assert classify_segment(text)["isFullyMasked"] is False

    def test_double_backtick_content_is_stripped(self) -> None:
        """GFM double-backtick pair の content が residue に残らない (§5.3.6)。"""
        result = classify_segment(
            "``code containing `backticks` here`` のような GFM double-backtick pattern"
        )
        assert result["isFullyMasked"] is True


class TestClassifyCjkHandling:
    """§5.3.7 CJK_RE /g フラグ fix の regression guard。"""

    def test_long_ja_with_embedded_english_prose_flagged(self) -> None:
        text = "これは長い段落です。途中で this is english が混入しています。最後にも日本語。"
        result = classify_segment(text)
        assert result["isFullyMasked"] is False
        # residue には CJK 文字が残らない
        import re

        assert not re.search(r"[\u3040-\u309f\u4e00-\u9faf]", result["residue"])

    def test_pure_english_segment_flagged(self) -> None:
        """CJK 0 文字の純 EN segment は必ず untranslated 扱い。"""
        assert classify_segment("Press Enter key now and confirm")["isFullyMasked"] is False

    def test_mixed_ja_en_genuine_untranslated_prose_flagged(self) -> None:
        text = (
            "設定画面で choose integrate any other application you don't find in the "
            "gallery を選択します。"
        )
        assert classify_segment(text)["isFullyMasked"] is False

    def test_residue_spec_invariant_5(self) -> None:
        """Spec Invariant 5: mixed JA/EN でも residue = バグとして検知。"""
        result = classify_segment("visual editor で click the save button")
        assert result["isFullyMasked"] is False
        assert len(result["residue"]) > 0

    def test_glossary_plus_cjk_with_no_english_residue_is_masked(self) -> None:
        assert classify_segment("test editor を開いて開始します。")["isFullyMasked"] is True
