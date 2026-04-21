"""Tests for ``testim_parity.types`` — severity table and classification sets.

Verifies the severity values that drive the parity gate classification, the
explicit ``COARSE_SIGNAL_TYPES`` allowlist, and regex patterns used by the
reporter.
"""

from __future__ import annotations

from testim_parity.types import (
    COARSE_SIGNAL_TYPES,
    FENCE_LINE_RE,
    H1_IN_BODY_RE,
    ISSUE_SEVERITY,
    JSX_CALLOUT_RE,
    LEGACY_CALLOUT_RE,
    SOURCE_UNUSABLE_TYPES,
    STRUCTURE_MISMATCH_TYPES,
    UNTRANSLATED_PATTERNS,
)


class TestIssueSeverity:
    def test_segment_star_types_are_actionable(self):
        for t in (
            "segment-missing",
            "segment-extra",
            "segment-shifted",
            "segment-untranslated",
            "segment-token-gap",
            "segment-inconclusive",
        ):
            assert ISSUE_SEVERITY[t] == "actionable"

    def test_count_mismatches_are_signal(self):
        for t in (
            "paragraph-count-mismatch",
            "bullet-count-mismatch",
            "step-count-mismatch",
            "section-count-mismatch",
            "heading-mismatch",
        ):
            assert ISSUE_SEVERITY[t] == "signal"

    def test_source_fetch_error_severity(self):
        assert ISSUE_SEVERITY["source-fetch-error"] == "error"

    def test_missing_snapshot_is_signal_but_fresh_is_actionable(self):
        # Important contract: missing-fresh-snapshot must stay actionable so the
        # gate trips on newly missing pages. missing-snapshot is the paired
        # advisory signal.
        assert ISSUE_SEVERITY["missing-snapshot"] == "signal"
        assert ISSUE_SEVERITY["missing-fresh-snapshot"] == "actionable"

    def test_table_is_immutable(self):
        # MappingProxyType prevents mutation by contract.
        import pytest as _pytest

        with _pytest.raises(TypeError):
            ISSUE_SEVERITY["segment-missing"] = "signal"  # type: ignore[index]


class TestCoarseSignalTypes:
    def test_contains_only_count_and_shape_mismatches(self):
        assert "paragraph-count-mismatch" in COARSE_SIGNAL_TYPES
        assert "step-count-mismatch" in COARSE_SIGNAL_TYPES
        assert "table-shape-mismatch" in COARSE_SIGNAL_TYPES

    def test_missing_snapshot_NOT_in_coarse(self):
        # Regression guard: missing-snapshot must never be demoted to coarse
        # audit-only; it is the paired gate signal for missing-fresh-snapshot.
        assert "missing-snapshot" not in COARSE_SIGNAL_TYPES

    def test_segment_types_NOT_in_coarse(self):
        for t in ("segment-missing", "segment-extra", "segment-shifted"):
            assert t not in COARSE_SIGNAL_TYPES


class TestStructureMismatchTypes:
    def test_contains_expected_two_types(self):
        expected = frozenset({"section-structure-mismatch", "segment-order-mismatch"})
        assert STRUCTURE_MISMATCH_TYPES == expected


class TestSourceUnusableTypes:
    def test_contains_expected_two_types(self):
        expected = frozenset({"snapshot-incomplete", "source-unusable"})
        assert SOURCE_UNUSABLE_TYPES == expected


class TestUntranslatedPatterns:
    def test_matches_common_en_prefixes(self):
        samples = [
            "Hover over the menu",
            "1. Click on the button",
            "2. Click on **Submit**",
            "Select the file",
            "If you would like to customize",
            "In the settings panel",
            "From the dropdown",
            "From the drop-down",
        ]
        for sample in samples:
            assert any(p.search(sample) for p in UNTRANSLATED_PATTERNS), (
                f"no pattern matched: {sample!r}"
            )

    def test_does_not_match_japanese(self):
        samples = [
            "メニューにマウスを合わせます",
            "ボタンをクリックします",
            "ファイルを選択します",
        ]
        for sample in samples:
            assert not any(p.search(sample) for p in UNTRANSLATED_PATTERNS), (
                f"pattern wrongly matched: {sample!r}"
            )

    def test_word_boundary_is_ascii_to_match_js(self):
        # Regression: Python's default re makes \b Unicode-aware, JS /.../i
        # without the /u flag uses ASCII \b. "Hover over theé" must still
        # match "Hover over the\b" because é is a word character under
        # Unicode but not under ASCII rules — and JS matches.
        assert any(p.search("Hover over theé click to continue") for p in UNTRANSLATED_PATTERNS)
        # Negative control: the pattern still rejects a prefix that would
        # match without \b (i.e. the boundary is still enforced on ASCII).
        assert not any(p.match("Hover over theo") for p in UNTRANSLATED_PATTERNS)


class TestInlineRegexes:
    def test_legacy_callout_matches_emoji_blockquote(self):
        # Covers a sample of the emojis listed in the pattern.
        assert LEGACY_CALLOUT_RE.match("> 📘 Note text here")
        assert LEGACY_CALLOUT_RE.match("> ⚠️ Warning")
        assert LEGACY_CALLOUT_RE.match("> 💡 Tip")

    def test_legacy_callout_ignores_plain_blockquote(self):
        assert not LEGACY_CALLOUT_RE.match("> Regular quote")
        assert not LEGACY_CALLOUT_RE.match("Not a blockquote")

    def test_jsx_callout_matches_opening_tag(self):
        assert JSX_CALLOUT_RE.match("<Callout type='info'>")
        assert JSX_CALLOUT_RE.match("<callout>")  # case-insensitive
        assert not JSX_CALLOUT_RE.match("<div>Callout</div>")

    def test_h1_in_body_matches(self):
        assert H1_IN_BODY_RE.match("# Hello")
        assert not H1_IN_BODY_RE.match("## Sub")
        assert not H1_IN_BODY_RE.match("#not-a-heading")

    def test_fence_line_matches_fenced_and_list_fenced(self):
        assert FENCE_LINE_RE.match("```python")
        assert FENCE_LINE_RE.match("    ```bash")
        assert FENCE_LINE_RE.match("- ```")
        assert FENCE_LINE_RE.match("1. ```")
        assert not FENCE_LINE_RE.match("inline `code`")
