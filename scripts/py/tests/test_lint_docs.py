"""lint_docs の unit test — WRITING_GUIDE 準拠ルールを function 単位で exercise する。

Python 版 ``lint_content(content, file_path, *, all_slugs=None, headings_by_slug=None)`` と
``to_kebab(text)`` の契約を pin する。
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

from testim_parity.tools.lint_docs import lint_content, to_kebab

_TEST_PATH = Path("src/content/docs/test.md")


def _make_doc(*, fm: dict[str, Any] | None = None, body: str | None = None) -> str:
    """frontmatter + body の合成。``fm`` に ``None`` value を渡すとその key を落とす。"""
    base: dict[str, Any] = {
        "title": "Test Page",
        "description": "A description.",
        "category": "Overview",
        "updated": "2026-01-01",
        "sourceUrl": (
            "https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm"
        ),
    }
    if fm is not None:
        for key, value in fm.items():
            if value is None:
                base.pop(key, None)
            else:
                base[key] = value
    fm_lines = "\n".join(f"{k}: '{v}'" for k, v in base.items())
    body_str = "## Section\n\nSome content.\n" if body is None else body
    return f"---\n{fm_lines}\n---\n\n{body_str}"


def _rules(issues: list[dict[str, Any]], *names: str) -> list[dict[str, Any]]:
    """issues を rule name で filter。"""
    allowed = set(names)
    return [i for i in issues if i["rule"] in allowed]


# ---------------------------------------------------------------------------
# A. frontmatter: sourceUrl
# ---------------------------------------------------------------------------


class TestFrontmatterSourceUrl:
    def test_missing_sourceurl(self) -> None:
        issues = lint_content(_make_doc(fm={"sourceUrl": None}), _TEST_PATH)
        hit = next((i for i in issues if i["rule"] == "sourceUrl-required"), None)
        assert hit is not None
        assert hit["level"] == "error"

    def test_wrong_domain(self) -> None:
        issues = lint_content(
            _make_doc(fm={"sourceUrl": "https://example.com/docs/foo"}), _TEST_PATH
        )
        assert any(i["rule"] == "sourceUrl-format" for i in issues)

    def test_old_helpio_domain(self) -> None:
        issues = lint_content(
            _make_doc(fm={"sourceUrl": "https://help.testim.io/docs/testim-overview"}),
            _TEST_PATH,
        )
        assert any(i["rule"] == "sourceUrl-format" for i in issues)

    def test_valid_sourceurl_noop(self) -> None:
        issues = lint_content(_make_doc(), _TEST_PATH)
        assert _rules(issues, "sourceUrl-required", "sourceUrl-format") == []

    def test_valid_direct_htm_noop(self) -> None:
        issues = lint_content(
            _make_doc(
                fm={
                    "sourceUrl": (
                        "https://docs.tricentis.com/testim/content/"
                        "getting-started/setting-up-your-account.htm"
                    )
                }
            ),
            _TEST_PATH,
        )
        assert not any(i["rule"] == "sourceUrl-format" for i in issues)


# ---------------------------------------------------------------------------
# B. frontmatter: description placeholder
# ---------------------------------------------------------------------------


class TestDescriptionPlaceholder:
    def test_rejects_gensen_placeholder(self) -> None:
        issues = lint_content(
            _make_doc(
                fm={
                    "description": (
                        "原文: https://docs.tricentis.com/testim/content/overview/foo.htm"
                    )
                }
            ),
            _TEST_PATH,
        )
        hit = next((i for i in issues if i["rule"] == "description-placeholder"), None)
        assert hit is not None
        assert hit["level"] == "error"

    def test_rejects_todo_uppercase(self) -> None:
        issues = lint_content(_make_doc(fm={"description": "TODO: write description"}), _TEST_PATH)
        assert any(i["rule"] == "description-placeholder" for i in issues)

    def test_rejects_todo_lowercase(self) -> None:
        issues = lint_content(_make_doc(fm={"description": "todo: fill this in"}), _TEST_PATH)
        assert any(i["rule"] == "description-placeholder" for i in issues)

    def test_accepts_real_description(self) -> None:
        issues = lint_content(
            _make_doc(fm={"description": "Testim の概要を説明します。"}), _TEST_PATH
        )
        assert _rules(issues, "description-placeholder") == []


# ---------------------------------------------------------------------------
# C. frontmatter: required fields
# ---------------------------------------------------------------------------


class TestRequiredFields:
    @pytest.mark.parametrize("field", ["title", "category", "updated"])
    def test_missing_field(self, field: str) -> None:
        issues = lint_content(_make_doc(fm={field: None}), _TEST_PATH)
        assert any(i["rule"] == f"{field}-required" for i in issues)

    def test_all_present_clean(self) -> None:
        issues = lint_content(_make_doc(), _TEST_PATH)
        assert _rules(issues, "title-required", "category-required", "updated-required") == []


# ---------------------------------------------------------------------------
# D. Internal link format (no warning expected — path-based slugs)
# ---------------------------------------------------------------------------


class TestInternalLinkFormat:
    def test_path_based_link_no_warning(self) -> None:
        issues = lint_content(
            _make_doc(body="See [overview](/docs/overview/testim-overview).\n"), _TEST_PATH
        )
        assert _rules(issues, "internal-link-format") == []

    def test_basename_link_without_slugs_no_warning(self) -> None:
        issues = lint_content(
            _make_doc(body="See [overview](/docs/testim-overview).\n"), _TEST_PATH
        )
        assert _rules(issues, "internal-link-format") == []

    def test_external_link_no_warning(self) -> None:
        issues = lint_content(
            _make_doc(
                body=(
                    "See [Testim]"
                    "(https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm).\n"
                )
            ),
            _TEST_PATH,
        )
        assert _rules(issues, "internal-link-format") == []

    def test_html_a_path_based_no_warning(self) -> None:
        issues = lint_content(
            _make_doc(body='See <a href="/docs/overview/testim-overview">overview</a>.\n'),
            _TEST_PATH,
        )
        assert _rules(issues, "internal-link-format") == []


# ---------------------------------------------------------------------------
# E. Feature-name (Japanese → English)
# ---------------------------------------------------------------------------


class TestFeatureNamePreservation:
    def test_testim_extension_japanese(self) -> None:
        issues = lint_content(
            _make_doc(body="Testim拡張機能を使ってテストを記録します。\n"), _TEST_PATH
        )
        hit = next((i for i in issues if i["rule"] == "feature-name-japanese"), None)
        assert hit is not None
        assert hit["level"] == "error"

    def test_visual_editor_japanese(self) -> None:
        issues = lint_content(_make_doc(body="ビジュアルエディタで編集します。\n"), _TEST_PATH)
        assert any(i["rule"] == "feature-name-japanese" for i in issues)

    def test_ng_word_inside_fence_allowed(self) -> None:
        issues = lint_content(_make_doc(body="```\nTestim拡張機能\n```\n"), _TEST_PATH)
        assert _rules(issues, "feature-name-japanese") == []

    def test_ng_word_inline_code_allowed(self) -> None:
        issues = lint_content(_make_doc(body="`Testim拡張機能` と呼びます。\n"), _TEST_PATH)
        assert _rules(issues, "feature-name-japanese") == []

    def test_english_feature_names_clean(self) -> None:
        issues = lint_content(
            _make_doc(body="Use the Testim Extension to record tests.\n"), _TEST_PATH
        )
        assert _rules(issues, "feature-name-japanese") == []


# ---------------------------------------------------------------------------
# F. Code-block language specifier
# ---------------------------------------------------------------------------


class TestCodeBlockLanguage:
    def test_missing_language_warning(self) -> None:
        issues = lint_content(_make_doc(body="```\nsome code\n```\n"), _TEST_PATH)
        hit = next((i for i in issues if i["rule"] == "code-block-no-language"), None)
        assert hit is not None
        assert hit["level"] == "warning"

    def test_language_present_clean(self) -> None:
        issues = lint_content(_make_doc(body="```js\nconst x = 1;\n```\n"), _TEST_PATH)
        assert _rules(issues, "code-block-no-language") == []


# ---------------------------------------------------------------------------
# G. Callout directive
# ---------------------------------------------------------------------------


class TestCalloutDirective:
    def test_unknown_type_error(self) -> None:
        issues = lint_content(_make_doc(body="::: unknown-type\nContent\n:::\n"), _TEST_PATH)
        hit = next((i for i in issues if i["rule"] == "callout-unknown-type"), None)
        assert hit is not None
        assert hit["level"] == "error"

    @pytest.mark.parametrize(
        "callout_type", ["note", "caution", "warning", "tip", "danger", "info"]
    )
    def test_known_types_clean(self, callout_type: str) -> None:
        issues = lint_content(_make_doc(body=f"::: {callout_type}\nContent\n:::\n"), _TEST_PATH)
        assert _rules(issues, "callout-unknown-type") == []

    def test_four_colon_fence_with_title_clean(self) -> None:
        issues = lint_content(_make_doc(body='::::info{title="補足"}\nContent\n::::\n'), _TEST_PATH)
        assert _rules(issues, "callout-unknown-type") == []

    def test_list_nested_callout_is_error(self) -> None:
        """list item 内に ``:::callout`` を書くと error (plan Phase 2 反映)。"""
        body = "- item one\n  :::note\n  nested body\n  :::\n- item two\n"
        issues = lint_content(_make_doc(body=body), _TEST_PATH)
        hit = next((i for i in issues if i["rule"] == "callout-in-list-item"), None)
        assert hit is not None
        assert hit["level"] == "error"

    def test_list_nested_callout_with_ordered_list_is_error(self) -> None:
        body = "1. step\n   :::warning\n   nested\n   :::\n2. next\n"
        issues = lint_content(_make_doc(body=body), _TEST_PATH)
        assert any(i["rule"] == "callout-in-list-item" for i in issues)

    def test_top_level_callout_is_clean(self) -> None:
        body = ":::note\nBody\n:::\n"
        issues = lint_content(_make_doc(body=body), _TEST_PATH)
        assert _rules(issues, "callout-in-list-item") == []

    @pytest.mark.parametrize(
        "indent",
        [" ", "  ", "   ", "    ", "\t"],
    )
    def test_any_leading_whitespace_triggers_rule(self, indent: str) -> None:
        """leading whitespace を持つ callout line は全て禁止 (Python extractor
        が list context を追跡しない以上、flatten が ambiguous になる)。"""
        body = f"- item\n{indent}:::note\n{indent}body\n{indent}:::\n"
        issues = lint_content(_make_doc(body=body), _TEST_PATH)
        assert any(i["rule"] == "callout-in-list-item" for i in issues)

    def test_unknown_type_inside_code_fence_ignored(self) -> None:
        """code fence 内の ``:::bogus`` は meta-documentation とみなし lint しない。
        反例を示す技術解説が実 corpus に入ってきた際の false positive を防ぐ契約。
        """
        body = "Example of invalid callout:\n\n```md\n:::bogus-type\ncontent\n:::\n```\n"
        issues = lint_content(_make_doc(body=body), _TEST_PATH)
        assert _rules(issues, "callout-unknown-type") == []

    def test_unknown_type_inside_unlabelled_fence_ignored(self) -> None:
        """language 指定のない fence (``` alone) でも code block として skip する。"""
        body = "```\n:::bogus-type\n:::\n```\n"
        issues = lint_content(_make_doc(body=body), _TEST_PATH)
        assert _rules(issues, "callout-unknown-type") == []

    def test_nested_callout_inside_code_fence_ignored(self) -> None:
        """list-context example 内の indented callout も meta example なので skip。"""
        body = "```md\n- item\n  :::note\n  nested body\n  :::\n- other\n```\n"
        issues = lint_content(_make_doc(body=body), _TEST_PATH)
        assert _rules(issues, "callout-in-list-item") == []

    def test_valid_callout_after_code_fence_still_checked(self) -> None:
        """code fence を閉じた後に real な ``:::bogus`` があれば検出する (state recovery)。"""
        body = (
            "```md\n"
            ":::example-only\n"  # meta — should NOT error
            ":::\n"
            "```\n"
            "\n"
            ":::bogus\n"  # real — SHOULD error
            "body\n"
            ":::\n"
        )
        issues = lint_content(_make_doc(body=body), _TEST_PATH)
        hits = _rules(issues, "callout-unknown-type")
        assert len(hits) == 1
        assert "bogus" in hits[0]["message"]

    def test_nested_callout_outside_fence_still_errors_after_fence(self) -> None:
        """fence 後に本物の nested callout があれば検出する (state recovery)。"""
        body = (
            "```md\n"
            "- item\n"
            "  :::note\n"  # meta example
            "  :::\n"
            "```\n"
            "\n"
            "- real item\n"
            "  :::note\n"  # real nested — SHOULD error
            "  body\n"
            "  :::\n"
        )
        issues = lint_content(_make_doc(body=body), _TEST_PATH)
        assert any(i["rule"] == "callout-in-list-item" for i in issues)


# ---------------------------------------------------------------------------
# H. Internal-link target existence (requires slug index)
# ---------------------------------------------------------------------------


_SLUGS: set[str] = {
    "overview/testim-overview",
    "getting-started/getting-started",
    "advanced-editing/advanced-features",
}
_HEADINGS: dict[str, set[str]] = {
    "overview/testim-overview": {"overview", "features", "getting-started-section"},
    "getting-started/getting-started": {"installation", "first-test"},
    "advanced-editing/advanced-features": {"custom-actions", "data-driven"},
}


class TestInternalLinkTargets:
    def test_markdown_link_to_nonexistent_basename(self) -> None:
        issues = lint_content(
            _make_doc(body="See [page](/docs/nonexistent-page) for details.\n"),
            _TEST_PATH,
            all_slugs=_SLUGS,
            headings_by_slug=_HEADINGS,
        )
        hit = next((i for i in issues if i["rule"] == "link-target-missing"), None)
        assert hit is not None
        assert hit["level"] == "error"
        assert "nonexistent-page" in hit["message"]

    def test_markdown_link_to_basename_only(self) -> None:
        issues = lint_content(
            _make_doc(body="See [overview](/docs/testim-overview) for details.\n"),
            _TEST_PATH,
            all_slugs=_SLUGS,
            headings_by_slug=_HEADINGS,
        )
        assert any(i["rule"] == "link-target-missing" for i in issues)

    def test_html_a_to_nonexistent(self) -> None:
        issues = lint_content(
            _make_doc(body='See <a href="/docs/nonexistent-page">page</a> for details.\n'),
            _TEST_PATH,
            all_slugs=_SLUGS,
            headings_by_slug=_HEADINGS,
        )
        hit = next((i for i in issues if i["rule"] == "link-target-missing"), None)
        assert hit is not None
        assert hit["level"] == "error"

    def test_html_a_to_basename_only(self) -> None:
        issues = lint_content(
            _make_doc(body='See <a href="/docs/getting-started">start</a> here.\n'),
            _TEST_PATH,
            all_slugs=_SLUGS,
            headings_by_slug=_HEADINGS,
        )
        assert any(i["rule"] == "link-target-missing" for i in issues)

    def test_basename_link_with_fragment_still_target_missing(self) -> None:
        issues = lint_content(
            _make_doc(body="See [section](/docs/testim-overview#nonexistent-section) here.\n"),
            _TEST_PATH,
            all_slugs=_SLUGS,
            headings_by_slug=_HEADINGS,
        )
        assert any(i["rule"] == "link-target-missing" for i in issues)
        assert _rules(issues, "link-fragment-missing") == []

    def test_basename_link_with_valid_fragment_still_target_missing(self) -> None:
        issues = lint_content(
            _make_doc(body="See [section](/docs/testim-overview#features) here.\n"),
            _TEST_PATH,
            all_slugs=_SLUGS,
            headings_by_slug=_HEADINGS,
        )
        assert any(i["rule"] == "link-target-missing" for i in issues)

    def test_html_basename_link_with_fragment(self) -> None:
        issues = lint_content(
            _make_doc(body='See <a href="/docs/getting-started#bad-section">link</a>.\n'),
            _TEST_PATH,
            all_slugs=_SLUGS,
            headings_by_slug=_HEADINGS,
        )
        assert any(i["rule"] == "link-target-missing" for i in issues)

    def test_no_slug_index_skips_check(self) -> None:
        issues = lint_content(
            _make_doc(body="See [page](/docs/nonexistent-page) for details.\n"), _TEST_PATH
        )
        assert _rules(issues, "link-target-missing") == []

    def test_links_in_code_block_skipped(self) -> None:
        issues = lint_content(
            _make_doc(body="```\nSee [page](/docs/nonexistent-page).\n```\n"),
            _TEST_PATH,
            all_slugs=_SLUGS,
            headings_by_slug=_HEADINGS,
        )
        assert _rules(issues, "link-target-missing") == []

    def test_links_in_inline_code_skipped(self) -> None:
        issues = lint_content(
            _make_doc(body="Use `[page](/docs/nonexistent-page)` syntax.\n"),
            _TEST_PATH,
            all_slugs=_SLUGS,
            headings_by_slug=_HEADINGS,
        )
        assert _rules(issues, "link-target-missing") == []

    def test_path_based_link_exists(self) -> None:
        issues = lint_content(
            _make_doc(body="See [overview](/docs/overview/testim-overview) for details.\n"),
            _TEST_PATH,
            all_slugs=_SLUGS,
            headings_by_slug=_HEADINGS,
        )
        assert _rules(issues, "link-target-missing") == []

    def test_path_based_link_missing(self) -> None:
        issues = lint_content(
            _make_doc(body="See [page](/docs/overview/nonexistent-page) for details.\n"),
            _TEST_PATH,
            all_slugs=_SLUGS,
            headings_by_slug=_HEADINGS,
        )
        hit = next((i for i in issues if i["rule"] == "link-target-missing"), None)
        assert hit is not None
        assert hit["level"] == "error"

    def test_path_based_link_with_bad_fragment_warning(self) -> None:
        issues = lint_content(
            _make_doc(
                body="See [section](/docs/overview/testim-overview#nonexistent-section) here.\n"
            ),
            _TEST_PATH,
            all_slugs=_SLUGS,
            headings_by_slug=_HEADINGS,
        )
        hit = next((i for i in issues if i["rule"] == "link-fragment-missing"), None)
        assert hit is not None
        assert hit["level"] == "warning"

    def test_path_based_link_with_valid_fragment_clean(self) -> None:
        issues = lint_content(
            _make_doc(body="See [section](/docs/overview/testim-overview#features) here.\n"),
            _TEST_PATH,
            all_slugs=_SLUGS,
            headings_by_slug=_HEADINGS,
        )
        assert _rules(issues, "link-fragment-missing") == []

    def test_path_based_html_link_exists(self) -> None:
        issues = lint_content(
            _make_doc(body='See <a href="/docs/overview/testim-overview">overview</a>.\n'),
            _TEST_PATH,
            all_slugs=_SLUGS,
            headings_by_slug=_HEADINGS,
        )
        assert _rules(issues, "link-target-missing") == []

    def test_ambiguous_basename(self) -> None:
        ambiguous = {"folder-a/shared-name", "folder-b/shared-name"}
        issues = lint_content(
            _make_doc(body="See [page](/docs/shared-name) for details.\n"),
            _TEST_PATH,
            all_slugs=ambiguous,
        )
        assert any(i["rule"] == "link-target-missing" for i in issues)

    def test_wrong_folder(self) -> None:
        issues = lint_content(
            _make_doc(body="See [page](/docs/wrong-folder/testim-overview) for details.\n"),
            _TEST_PATH,
            all_slugs=_SLUGS,
            headings_by_slug=_HEADINGS,
        )
        assert any(i["rule"] == "link-target-missing" for i in issues)


# ---------------------------------------------------------------------------
# I. to_kebab helper
# ---------------------------------------------------------------------------


class TestToKebab:
    @pytest.mark.parametrize(
        ("raw", "expected"),
        [
            ("Getting Started", "getting-started"),
            ("Step 1: Install", "step-1-install"),
            ("Using `testim` CLI", "using-testim-cli"),
            ("**Bold** and *italic*", "bold-and-italic"),
            ("See [Testim](https://example.com)", "see-testim"),
            ("ルールの説明", "ルールの説明"),
            ("要素の表示を待つ（web）", "要素の表示を待つ（web）"),
            ("DOM で最も大きい要素を選ぶ", "dom-で最も大きい要素を選ぶ"),
            (
                "Add Custom Validation / Add Custom Action ステップの追加",
                "add-custom-validation-add-custom-action-ステップの追加",
            ),
        ],
    )
    def test_conversion(self, raw: str, expected: str) -> None:
        assert to_kebab(raw) == expected


# ---------------------------------------------------------------------------
# J. Edge cases
# ---------------------------------------------------------------------------


class TestEdgeCases:
    def test_fully_valid_document_no_errors(self) -> None:
        content = _make_doc(
            body=(
                "## Section\n\n"
                "Some content with [link](/docs/overview/testim-overview).\n\n"
                "```js\nconst x = 1;\n```\n"
            )
        )
        issues = lint_content(content, _TEST_PATH)
        assert [i for i in issues if i["level"] == "error"] == []

    def test_no_frontmatter_reports_all_required(self) -> None:
        content = "## Just a body\n\nNo frontmatter here.\n"
        issues = lint_content(content, _TEST_PATH)
        for rule in (
            "title-required",
            "category-required",
            "updated-required",
            "sourceUrl-required",
        ):
            assert any(i["rule"] == rule for i in issues), rule


# ---------------------------------------------------------------------------
# K. legacy-fa-icon
# ---------------------------------------------------------------------------


class TestLegacyFaIcon:
    def test_detects_fa_arrow_right(self) -> None:
        issues = lint_content(
            _make_doc(body=":fa-arrow-right: **テストを作成するには:**\n"), _TEST_PATH
        )
        hit = next((i for i in issues if i["rule"] == "legacy-fa-icon"), None)
        assert hit is not None
        assert hit["level"] == "error"

    def test_detects_fa_cog(self) -> None:
        issues = lint_content(_make_doc(body="**Properties**（:fa-cog:）をクリック\n"), _TEST_PATH)
        assert any(i["rule"] == "legacy-fa-icon" for i in issues)

    def test_detects_fa_check(self) -> None:
        issues = lint_content(_make_doc(body=":fa-check: は合格を示します。\n"), _TEST_PATH)
        assert any(i["rule"] == "legacy-fa-icon" for i in issues)

    def test_inside_code_block_ignored(self) -> None:
        issues = lint_content(_make_doc(body="```\n:fa-arrow-right: text\n```\n"), _TEST_PATH)
        assert _rules(issues, "legacy-fa-icon") == []

    def test_no_pattern_clean(self) -> None:
        issues = lint_content(_make_doc(body="**テストを作成するには:**\n"), _TEST_PATH)
        assert _rules(issues, "legacy-fa-icon") == []


# ---------------------------------------------------------------------------
# L. EN/JA structure signature
# ---------------------------------------------------------------------------


class TestStructureSignature:
    def test_matching_structure_passes(self, tmp_path: Path) -> None:
        snapshot = tmp_path / "test.html"
        snapshot.write_text(
            "<body><h2>Section</h2><ol><li><p>Step</p><p>Continuation</p></li></ol></body>",
            encoding="utf-8",
        )
        issues = lint_content(
            _make_doc(body="## Section\n\n1. Step\n\n   Continuation\n"),
            _TEST_PATH,
            en_snapshot_path=snapshot,
            slug="overview/test",
        )
        assert _rules(issues, "structure-signature-mismatch") == []

    def test_translated_heading_text_does_not_mismatch(self, tmp_path: Path) -> None:
        snapshot = tmp_path / "test.html"
        snapshot.write_text(
            "<body><h2>English heading</h2><p>Body</p></body>",
            encoding="utf-8",
        )
        issues = lint_content(
            _make_doc(body="## 日本語の見出し\n\n本文\n"),
            _TEST_PATH,
            en_snapshot_path=snapshot,
            slug="overview/test",
        )
        assert _rules(issues, "structure-signature-mismatch") == []

    def test_mismatch_reports_error(self, tmp_path: Path) -> None:
        snapshot = tmp_path / "test.html"
        snapshot.write_text(
            "<body><h2>Section</h2><ol><li><p>Step</p><p>Continuation</p></li></ol></body>",
            encoding="utf-8",
        )
        issues = lint_content(
            _make_doc(body="## Section\n\n1. Step\n\n x\n"),
            _TEST_PATH,
            en_snapshot_path=snapshot,
            slug="overview/test",
        )
        hit = next((i for i in issues if i["rule"] == "structure-signature-mismatch"), None)
        assert hit is not None
        assert hit["level"] == "error"

    def test_frontmatter_error_skips_structure_rule(self, tmp_path: Path) -> None:
        snapshot = tmp_path / "test.html"
        snapshot.write_text(
            "<body><h2>Section</h2><ol><li><p>Step</p><p>Continuation</p></li></ol></body>",
            encoding="utf-8",
        )
        issues = lint_content(
            _make_doc(
                fm={"sourceUrl": "https://example.com/docs/foo"},
                body="## Section\n\n1. Step\n\n x\n",
            ),
            _TEST_PATH,
            en_snapshot_path=snapshot,
            slug="overview/test",
        )
        assert any(i["rule"] == "sourceUrl-format" for i in issues)
        assert _rules(issues, "structure-signature-mismatch") == []
