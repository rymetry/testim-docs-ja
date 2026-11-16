"""lint_docs の unit test — WRITING_GUIDE 準拠ルールを function 単位で exercise する。

Python 版 ``lint_content(content, file_path, *, all_slugs=None, headings_by_slug=None)`` と
``heading_slug(text)`` / ``heading_ids(body)`` の契約を pin する。
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

import pytest

from testim_parity.project import PROJECT_ROOT
from testim_parity.tools.lint_docs import heading_ids, heading_slug, lint_content

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

    def test_path_based_link_with_bad_fragment_error(self) -> None:
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
        assert hit["level"] == "error"

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

    @pytest.mark.parametrize(
        "body",
        [
            pytest.param("## Setup\n\nSee [below](#missing).\n", id="same-page-markdown"),
            pytest.param('## Setup\n\nSee <a href="#missing">below</a>.\n', id="same-page-html"),
            pytest.param(
                'See <a\n  href="/docs/overview/testim-overview#missing"\n>overview</a>.\n',
                id="html-href-on-later-line",
            ),
            pytest.param(
                "See [section](/docs/overview/testim-overview/#missing).\n",
                id="markdown-trailing-slash",
            ),
            pytest.param(
                'See <a href="/docs/overview/testim-overview/#missing">overview</a>.\n',
                id="html-trailing-slash",
            ),
            pytest.param("## Setup\n\nSee [below](#%E6%A6%82%E8%A6%81).\n", id="percent-encoded"),
        ],
    )
    def test_previously_skipped_link_with_bad_fragment_error(self, body: str) -> None:
        issues = lint_content(
            _make_doc(body=body), _TEST_PATH, all_slugs=_SLUGS, headings_by_slug=_HEADINGS
        )
        hits = _rules(issues, "link-fragment-missing")
        assert [hit["level"] for hit in hits] == ["error"]

    @pytest.mark.parametrize(
        "body",
        [
            pytest.param("## Setup\n\nSee [below](#setup).\n", id="same-page-markdown"),
            pytest.param('## Setup\n\nSee <a href="#setup">below</a>.\n', id="same-page-html"),
            pytest.param("## 概要\n\nSee [below](#%E6%A6%82%E8%A6%81).\n", id="percent-encoded"),
            pytest.param('## Setup\n\n<a href="#">top</a> [top](#)\n', id="empty-fragment"),
            pytest.param("## Setup\n\n[上へ](#top) [上へ](#TOP)\n", id="top-of-page"),
            pytest.param(
                "## Using `testim` CLI\n\nSee [below](#using-testim-cli).\n",
                id="heading-with-code-span",
            ),
            pytest.param("## Setup\n\nSee [below]( #setup ).\n", id="spaces-around-target"),
            pytest.param(
                'See <a\n  href="/docs/overview/testim-overview#features"\n>overview</a>.\n',
                id="html-href-on-later-line",
            ),
            pytest.param(
                "See [section](/docs/overview/testim-overview/#features).\n",
                id="markdown-trailing-slash",
            ),
            pytest.param(
                "See [section](/docs/overview/testim-overview#%66eatures).\n",
                id="cross-page-percent-encoded",
            ),
        ],
    )
    def test_previously_skipped_link_with_valid_fragment_clean(self, body: str) -> None:
        issues = lint_content(
            _make_doc(body=body), _TEST_PATH, all_slugs=_SLUGS, headings_by_slug=_HEADINGS
        )
        assert _rules(issues, "link-fragment-missing", "link-target-missing") == []

    def test_cross_page_fragment_skipped_without_heading_index(self) -> None:
        issues = lint_content(
            _make_doc(body="See [section](/docs/overview/testim-overview#missing).\n"),
            _TEST_PATH,
            all_slugs=_SLUGS,
        )
        assert _rules(issues, "link-fragment-missing", "link-target-missing") == []

    @pytest.mark.parametrize(
        "body",
        [
            pytest.param("See [page](/docs/overview/nonexistent#).\n", id="markdown"),
            pytest.param('See <a href="/docs/overview/nonexistent#">page</a>.\n', id="html"),
        ],
    )
    def test_empty_fragment_link_to_missing_page_is_error(self, body: str) -> None:
        issues = lint_content(
            _make_doc(body=body), _TEST_PATH, all_slugs=_SLUGS, headings_by_slug=_HEADINGS
        )
        assert len(_rules(issues, "link-target-missing")) == 1

    def test_issues_are_reported_in_document_order(self) -> None:
        body = '## Setup\n\n<a href="#first">x</a> [y](#second)\n\n[z](#third)\n'
        issues = _rules(lint_content(_make_doc(body=body), _TEST_PATH), "link-fragment-missing")
        assert [i["message"].split('"')[1] for i in issues] == ["#first", "#second", "#third"]

    def test_same_page_fragment_checked_without_slug_index(self) -> None:
        issues = lint_content(_make_doc(body="## Setup\n\nSee [below](#missing).\n"), _TEST_PATH)
        assert len(_rules(issues, "link-fragment-missing")) == 1

    def test_trailing_slash_link_to_missing_page_is_error(self) -> None:
        issues = lint_content(
            _make_doc(body="See [page](/docs/overview/nonexistent/).\n"),
            _TEST_PATH,
            all_slugs=_SLUGS,
            headings_by_slug=_HEADINGS,
        )
        assert len(_rules(issues, "link-target-missing")) == 1

    def test_multiline_html_link_reports_line_of_tag(self) -> None:
        body = 'line one\n\nSee <a\n  href="/docs/overview/testim-overview#missing"\n>x</a>.\n'
        doc = _make_doc(body=body)
        issues = lint_content(doc, _TEST_PATH, all_slugs=_SLUGS, headings_by_slug=_HEADINGS)
        (hit,) = _rules(issues, "link-fragment-missing")
        assert doc.split("\n")[hit["line"] - 1].startswith("See <a")

    @pytest.mark.parametrize(
        "body",
        [
            pytest.param("## Setup\n\n[s](#setup \"title\") [t](#setup 'title')\n", id="same-page"),
            pytest.param(
                'See [o](/docs/overview/testim-overview#features "title").\n', id="cross-page"
            ),
            pytest.param('See [o](/docs/overview/testim-overview "title").\n', id="no-fragment"),
        ],
    )
    def test_link_with_title_is_checked_without_the_title(self, body: str) -> None:
        issues = lint_content(
            _make_doc(body=body), _TEST_PATH, all_slugs=_SLUGS, headings_by_slug=_HEADINGS
        )
        assert _rules(issues, "link-fragment-missing", "link-target-missing") == []

    def test_link_with_title_and_bad_fragment_reports_the_fragment_only(self) -> None:
        issues = lint_content(_make_doc(body='## Setup\n\n[s](#missing "title")\n'), _TEST_PATH)
        (hit,) = _rules(issues, "link-fragment-missing")
        assert hit["message"] == 'Fragment "#missing" not found in this page'

    def test_other_attribute_ending_in_href_is_not_a_link(self) -> None:
        body = '## Setup\n\n<a href="#setup" data-href="#missing">x</a>\n'
        issues = lint_content(_make_doc(body=body), _TEST_PATH)
        assert _rules(issues, "link-fragment-missing") == []

    @pytest.mark.parametrize(
        "code",
        [
            pytest.param("```js\nconst a = 1;\nconst b = 2;\n```", id="fenced-block"),
            pytest.param("a `code\nspanning lines` b", id="multi-line-code-span"),
        ],
    )
    def test_link_after_code_reports_its_own_line(self, code: str) -> None:
        doc = _make_doc(body=f"## Setup\n\n{code}\n\nSee [below](#missing).\n")
        (hit,) = _rules(lint_content(doc, _TEST_PATH), "link-fragment-missing")
        assert doc.split("\n")[hit["line"] - 1] == "See [below](#missing)."

    @pytest.mark.parametrize(
        "unit",
        [
            pytest.param("<a ", id="unclosed-a"),
            pytest.param('<a href="#x" ', id="unclosed-a-with-href"),
            pytest.param('<a href="#x"\n', id="unclosed-a-with-href-per-line"),
            pytest.param("](#", id="unclosed-same-page-link"),
            pytest.param("](/docs/a#", id="unclosed-cross-page-link"),
            pytest.param('](#a "', id="unclosed-link-title"),
            pytest.param("[x](#setup)\n", id="many-valid-links"),
        ],
    )
    def test_repeated_link_like_input_stays_linear(self, unit: str) -> None:
        # body 全体に正規表現を当てるので、各開始位置から遠くまで走査する形は二次時間になる
        started = time.perf_counter()
        lint_content(_make_doc(body="## Setup\n\n" + unit * 100_000), _TEST_PATH, all_slugs=_SLUGS)
        assert time.perf_counter() - started < 5

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
# I. heading_slug / heading_ids
# ---------------------------------------------------------------------------


class TestHeadingSlug:
    @pytest.mark.parametrize(
        ("raw", "expected"),
        [
            ("Getting Started", "getting-started"),
            ("Step 1: Install", "step-1-install"),
            ("Using `testim` CLI", "using-testim-cli"),
            ("**Bold** and *italic*", "bold-and-italic"),
            ("See [Testim](https://example.com)", "see-testim"),
            ("ルールの説明", "ルールの説明"),
            # サイト (github-slugger) は全角括弧・全角記号を落とす
            ("要素の表示を待つ（web）", "要素の表示を待つweb"),
            ("TTM for Jira とは？", "ttm-for-jira-とは"),
            ("DOM で最も大きい要素を選ぶ", "dom-で最も大きい要素を選ぶ"),
            # 記号を消した跡の連続ハイフンは潰さない
            (
                "**Add custom validation** / **Add custom action** ステップの追加",
                "add-custom-validation--add-custom-action-ステップの追加",
            ),
            ("同期検証の成功/失敗例", "同期検証の成功失敗例"),
            ("snake_case と kebab-case", "snake_case-と-kebab-case"),
            # 全角スペースは区切りにならず消える (半角スペースだけが - になる)
            ("前\u3000後", "前後"),
        ],
    )
    def test_conversion(self, raw: str, expected: str) -> None:
        assert heading_slug(raw) == expected


# 同じ fixture をサイトの実パイプラインでも検証している
# (scripts/__tests__/remark_heading_ids.test.mjs)。
# linter の id 規則がサイトとずれると、どちらかのテストが落ちる。
_HEADING_ID_CASES: list[dict[str, Any]] = json.loads(
    (PROJECT_ROOT / "scripts/__tests__/fixtures/heading-ids.json").read_text(encoding="utf-8")
)


class TestHeadingIdsMatchSite:
    @pytest.mark.parametrize("case", _HEADING_ID_CASES, ids=lambda case: case["name"])
    def test_same_ids_as_site(self, case: dict[str, Any]) -> None:
        assert heading_ids(case["markdown"]) == set(case["ids"])

    def test_many_repeated_headings_stay_linear(self) -> None:
        # 連番を毎回 -1 から探し直すと二次時間になる (2 万見出しで 20 秒超)
        started = time.perf_counter()
        ids = heading_ids("## a\n" * 20_000)
        assert len(ids) == 20_000
        assert time.perf_counter() - started < 5

    def test_long_whitespace_run_stays_linear(self) -> None:
        # 明示 id の正規表現を \s* で始めると空白の連続で二次時間になる (100KB で 10 秒超)
        started = time.perf_counter()
        assert heading_ids("## a" + " " * 100_000 + "b\n") == {"a" + "-" * 100_000 + "b"}
        assert time.perf_counter() - started < 5


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
