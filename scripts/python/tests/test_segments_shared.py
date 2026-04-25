"""segments_shared のユニットテスト — セグメント factory・正規化・fingerprint。"""

from __future__ import annotations

import pytest

from testim_parity.segments_shared import (
    GATE_ELIGIBLE_KINDS,
    SEGMENT_KINDS,
    build_section_path,
    compute_segment_fingerprint,
    create_segment,
    is_gate_eligible,
    normalize_segment_text,
    push_heading,
)


class TestSegmentKinds:
    def test_canonical_kinds_exposed(self):
        for kind in (
            "heading",
            "paragraph",
            "ordered-list-item",
            "unordered-list-item",
            "callout-body",
            "table-cell",
            "details-summary",
            "image-caption",
            "code-block",
            "image",
        ):
            assert kind in SEGMENT_KINDS

    def test_gate_eligible_excludes_code_block_and_image(self):
        assert "code-block" not in GATE_ELIGIBLE_KINDS
        assert "image" not in GATE_ELIGIBLE_KINDS
        assert "image-caption" not in GATE_ELIGIBLE_KINDS
        for kind in ("heading", "paragraph", "ordered-list-item", "callout-body", "table-cell"):
            assert kind in GATE_ELIGIBLE_KINDS

    def test_is_gate_eligible(self):
        assert is_gate_eligible("paragraph") is True
        assert is_gate_eligible("code-block") is False
        assert is_gate_eligible("unknown-kind") is False


class TestNormalizeSegmentText:
    def test_collapses_whitespace(self):
        assert normalize_segment_text("hello   world\n\tfoo") == "hello world foo"

    def test_strips_zero_width(self):
        assert normalize_segment_text("a\u200bb\u200cc\u200dd\ufeffe") == "abcde"

    def test_strips_bold_italic_but_keeps_text(self):
        assert normalize_segment_text("**bold** and *italic* text") == "bold and italic text"

    def test_strips_inline_code_keeps_text(self):
        assert normalize_segment_text("use `--proxy` to set it") == "use --proxy to set it"

    def test_strips_markdown_links_keeps_label(self):
        assert (
            normalize_segment_text("see [the docs](https://example.com) for more")
            == "see the docs for more"
        )

    def test_lowercases_ascii(self):
        assert normalize_segment_text("CLI Prerequisites") == "cli prerequisites"

    def test_preserves_japanese(self):
        assert normalize_segment_text("  テスト  実行  ") == "テスト 実行"

    def test_empty_returns_empty(self):
        assert normalize_segment_text("") == ""
        assert normalize_segment_text("   \n\t  ") == ""


class TestFingerprint:
    def test_format(self):
        fp = compute_segment_fingerprint("hello world")
        assert fp.startswith("sha256:")
        assert len(fp) == len("sha256:") + 64

    def test_deterministic(self):
        assert compute_segment_fingerprint("same") == compute_segment_fingerprint("same")

    def test_crlf_lf_equivalent(self):
        # JS 側の改行正規化契約 — 両プラットフォームで同じ hash を得る
        assert compute_segment_fingerprint("a\nb") == compute_segment_fingerprint("a\r\nb")

    def test_distinct_inputs_differ(self):
        assert compute_segment_fingerprint("foo") != compute_segment_fingerprint("bar")


class TestPushHeading:
    def test_empty_stack(self):
        assert build_section_path([]) == ""

    def test_single_heading(self):
        stack = push_heading([], 2, "Overview")
        assert build_section_path(stack) == "Overview"

    def test_nested(self):
        stack = push_heading([], 2, "Setup")
        stack = push_heading(stack, 3, "Install")
        stack = push_heading(stack, 4, "Windows")
        assert build_section_path(stack) == "Setup > Install > Windows"

    def test_truncates_deeper_levels(self):
        stack = push_heading([], 2, "A")
        stack = push_heading(stack, 3, "A1")
        stack = push_heading(stack, 4, "A1a")
        stack = push_heading(stack, 3, "A2")
        assert build_section_path(stack) == "A > A2"

    def test_same_level_replaces(self):
        stack = push_heading([], 2, "First")
        stack = push_heading(stack, 2, "Second")
        assert build_section_path(stack) == "Second"

    def test_does_not_mutate_input(self):
        stack = push_heading([], 2, "Root")
        next_stack = push_heading(stack, 3, "Child")
        assert build_section_path(stack) == "Root"
        assert build_section_path(next_stack) == "Root > Child"

    def test_trims_whitespace(self):
        stack = push_heading([], 2, "  Padded  ")
        assert build_section_path(stack) == "Padded"


class TestCreateSegment:
    def test_produces_full_record(self):
        seg = create_segment(
            section_path="Setup > Install",
            kind="paragraph",
            segment_index=2,
            raw_text="Use `--proxy` to connect via https://example.com/foo.",
            line=42,
        )
        assert seg["sectionPath"] == "Setup > Install"
        assert seg["segmentKind"] == "paragraph"
        assert seg["segmentIndex"] == 2
        assert seg["textNorm"] == "use --proxy to connect via https://example.com/foo."
        assert "--proxy" in seg["tokensInvariant"]
        assert seg["sourceFingerprint"].startswith("sha256:")
        assert seg["line"] == 42

    def test_line_defaults_to_none(self):
        seg = create_segment(section_path="A", kind="heading", segment_index=0, raw_text="Hello")
        assert seg["line"] is None

    def test_unknown_kind_raises(self):
        with pytest.raises(ValueError, match="unknown segment kind"):
            create_segment(section_path="A", kind="not-a-kind", segment_index=0, raw_text="x")

    def test_sorted_tokens(self):
        seg = create_segment(
            section_path="A",
            kind="paragraph",
            segment_index=0,
            raw_text="use `--zebra` and `--alpha` flags",
        )
        assert seg["tokensInvariant"] == sorted(seg["tokensInvariant"])
