"""Tests for ``testim_parity.normalize`` — URL rewrite rules for parity comparison.

Mirrors the coverage of ``scripts/__tests__/parity_normalize.test.mjs`` so the
mjs test can be retired once the Python port is wired into the pipeline.
"""

from __future__ import annotations

import pytest

from testim_parity.normalize import (
    canonicalize_docs_url,
    normalize_segment_tokens,
    normalize_url_for_parity,
)


class TestHelpTestimIo:
    def test_rewrites_help_testim_io_docs(self):
        assert normalize_url_for_parity("https://help.testim.io/docs/loops") == "/docs/loops"

    def test_preserves_hash_fragment(self):
        assert (
            normalize_url_for_parity(
                "https://help.testim.io/docs/loops#using-the-loop-iterator-parameter"
            )
            == "/docs/loops#using-the-loop-iterator-parameter"
        )

    def test_handles_help_testim_io_without_protocol(self):
        assert (
            normalize_url_for_parity("help.testim.io/docs/configuration-file")
            == "/docs/configuration-file"
        )


class TestTricentisDocs:
    def test_rewrites_legacy_topics_help_literal_path(self):
        assert (
            canonicalize_docs_url("https://docs.tricentis.com/testim/content/Topics/Help/loops.htm")
            == "/docs/Topics/Help/loops"
        )

    def test_rewrites_nested_legacy_topics_help(self):
        assert (
            canonicalize_docs_url(
                "https://docs.tricentis.com/testim/content/Topics/Help/advanced-editing/loops.htm"
            )
            == "/docs/Topics/Help/advanced-editing/loops"
        )

    def test_rewrites_repo_canonical_category_form(self):
        assert (
            canonicalize_docs_url(
                "https://docs.tricentis.com/testim/content/administration/api-access.htm"
            )
            == "/docs/administration/api-access"
        )

    def test_rewrites_nested_category_path(self):
        assert canonicalize_docs_url(
            "https://docs.tricentis.com/testim/content/advanced-editing/"
            "data-driven-testing/configuring-data-driven-tests-using-the-config-file.htm"
        ) == (
            "/docs/advanced-editing/data-driven-testing/"
            "configuring-data-driven-tests-using-the-config-file"
        )

    def test_strips_index_htm_to_directory_root(self):
        assert (
            canonicalize_docs_url(
                "https://docs.tricentis.com/testim/content/advanced-editing/"
                "data-driven-testing/index.htm"
            )
            == "/docs/advanced-editing/data-driven-testing"
        )

    def test_strips_top_level_index_htm(self):
        assert (
            canonicalize_docs_url(
                "https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm"
            )
            == "/docs/overview/testim-overview"
        )

    def test_preserves_hash_after_canonical_conversion(self):
        assert (
            canonicalize_docs_url(
                "https://docs.tricentis.com/testim/content/administration/api-access.htm#api-access"
            )
            == "/docs/administration/api-access#api-access"
        )


class TestNormalizeSegmentTokens:
    def test_all_urls_normalized_preserving_order(self):
        # Order preservation is part of the contract: dedup by first-seen,
        # keep insertion order. Do NOT sort before asserting.
        tokens = [
            "https://help.testim.io/docs/loops",
            "https://docs.tricentis.com/testim/content/Topics/Help/hooks.htm",
            "--project-id",
            "Ctrl+S",
        ]
        assert normalize_segment_tokens(tokens) == [
            "/docs/loops",
            "/docs/Topics/Help/hooks",
            "--project-id",
            "Ctrl+S",
        ]

    def test_preserves_non_url_tokens_in_order(self):
        assert normalize_segment_tokens(["--token", "package.json", "Shift+K"]) == [
            "--token",
            "package.json",
            "Shift+K",
        ]

    def test_deduplicates_across_canonical_forms(self):
        assert normalize_segment_tokens(
            ["https://help.testim.io/docs/loops"]
        ) == normalize_segment_tokens(["/docs/loops"])

    def test_non_list_returns_empty_list(self):
        # Mirror JS Array.isArray: tuples, sets, generators, strings — all rejected.
        assert normalize_segment_tokens(None) == []
        assert normalize_segment_tokens("not-a-list") == []
        assert normalize_segment_tokens(("/docs/x", "/docs/y")) == []
        assert normalize_segment_tokens({"/docs/x"}) == []
        assert normalize_segment_tokens(iter(["/docs/x"])) == []


class TestPassthrough:
    def test_external_urls_unchanged(self):
        assert normalize_url_for_parity("https://applitools.com/") == "https://applitools.com/"

    def test_non_url_strings_unchanged(self):
        assert normalize_url_for_parity("--project-id") == "--project-id"


class TestSymmetry:
    def test_symmetric_with_fragment(self):
        assert normalize_url_for_parity(
            "https://help.testim.io/docs/api-access#api-access"
        ) == normalize_url_for_parity("/docs/api-access#api-access")

    def test_preserves_fragment_on_docs_path(self):
        assert (
            normalize_url_for_parity("https://help.testim.io/docs/index#top") == "/docs/index#top"
        )

    def test_drops_trailing_slash(self):
        assert normalize_url_for_parity(
            "https://help.testim.io/docs/api-access/"
        ) == normalize_url_for_parity("/docs/api-access")


class TestDocsCanonicalForm:
    def test_drops_trailing_slash_on_bare_docs_path(self):
        assert normalize_url_for_parity("/docs/api-access/") == "/docs/api-access"

    def test_drops_query_string_on_bare_docs_path(self):
        assert normalize_url_for_parity("/docs/api-access?x=1") == "/docs/api-access"

    def test_drops_query_string_on_help_testim_io(self):
        assert (
            normalize_url_for_parity("https://help.testim.io/docs/api-access?x=1")
            == "/docs/api-access"
        )

    def test_drops_query_while_preserving_fragment(self):
        assert (
            normalize_url_for_parity("https://help.testim.io/docs/api-access?x=1#frag")
            == "/docs/api-access#frag"
        )

    def test_help_testim_io_query_trailing_slash_symmetric(self):
        assert normalize_url_for_parity(
            "https://help.testim.io/docs/api-access/?ref=x#top"
        ) == normalize_url_for_parity("/docs/api-access#top")

    def test_passes_through_versioned_help_testim_io_paths(self):
        assert (
            normalize_url_for_parity("https://help.testim.io/v2.0/docs/scheduler#x")
            == "https://help.testim.io/v2.0/docs/scheduler#x"
        )


@pytest.mark.parametrize(
    "value",
    ["", None, 42],
)
def test_empty_or_non_string_passthrough(value):
    # Empty string returns unchanged per mjs contract; non-strings pass through.
    assert normalize_url_for_parity(value) == value
