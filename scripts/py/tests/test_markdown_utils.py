"""markdown_utils のユニットテスト — strip_markdown と generate_description。"""

from __future__ import annotations

from testim_parity.markdown_utils import generate_description, strip_markdown


class TestStripMarkdown:
    def test_removes_image_syntax(self) -> None:
        assert strip_markdown("See ![alt](img.png) here") == "See here"

    def test_extracts_link_text(self) -> None:
        assert strip_markdown("Click [here](https://example.com) now") == "Click here now"

    def test_removes_inline_code_backticks(self) -> None:
        assert strip_markdown("Use `foo` function") == "Use foo function"

    def test_removes_emphasis_and_hyphens(self) -> None:
        assert strip_markdown("**bold** and *italic*") == "bold and italic"
        assert strip_markdown("a - b - c") == "a b c"

    def test_handles_none_input(self) -> None:
        assert strip_markdown(None) == ""

    def test_handles_empty_input(self) -> None:
        assert strip_markdown("") == ""

    def test_trims_and_collapses_whitespace(self) -> None:
        assert strip_markdown("  a   b   c  ") == "a b c"


class TestGenerateDescription:
    def test_returns_first_paragraph(self) -> None:
        content = "This is the first paragraph.\n\nThis is the second."
        assert generate_description("Title", content) == "This is the first paragraph."

    def test_skips_headings_and_callouts(self) -> None:
        content = "# Heading\n\n:::note\n:::\n\nActual paragraph."
        assert generate_description("Title", content) == "Actual paragraph."

    def test_skips_code_fence_and_image_lines(self) -> None:
        content = "```js\n```\n\n![img](foo.png)\n\nReal text here."
        assert generate_description("Title", content) == "Real text here."

    def test_skips_list_items(self) -> None:
        content = "- item one\n- item two\n\nParagraph text."
        assert generate_description("Title", content) == "Paragraph text."

    def test_truncates_at_120_chars(self) -> None:
        long_line = "A" * 200
        result = generate_description("Title", long_line)
        assert len(result) == 120

    def test_returns_fallback_when_no_paragraph(self) -> None:
        content = "# Only heading\n\n- list\n- items"
        result = generate_description("MyTitle", content)
        assert result == "MyTitle に関する日本語ドキュメントです。"
