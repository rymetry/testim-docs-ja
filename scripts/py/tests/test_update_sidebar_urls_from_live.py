"""``testim_parity.pipeline.update_sidebar_urls_from_live`` unit tests (Phase 5)。

mjs ``scripts/__tests__/update_sidebar_urls.test.mjs`` の behavioral 等価。
"""

from __future__ import annotations

from pathlib import Path

import pytest

from testim_parity.pipeline import update_sidebar_urls_from_live as mod
from testim_parity.pipeline.update_sidebar_urls_from_live import (
    build_output,
    extract_urls,
    fetch_sitemap,
    normalize_url,
    parse_existing_status_map,
)

# ----------------------------------------------------------------------
# normalize_url
# ----------------------------------------------------------------------


@pytest.mark.parametrize(
    "url",
    [
        "https://example.com/docs/foo",
        "https://help.testim.io/docs/testim-overview",
        None,
        "",
        "/docs/testim-overview",
    ],
)
def test_normalize_url_rejects_non_testim(url: str | None) -> None:
    assert normalize_url(url) is None


def test_normalize_url_accepts_tricentis() -> None:
    u = "https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm"
    assert normalize_url(u) == u


# ----------------------------------------------------------------------
# parse_existing_status_map
# ----------------------------------------------------------------------


def test_parse_check_lupe_status() -> None:
    text = "- ✅🔍 https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm\n"
    out = parse_existing_status_map(text)
    assert (
        out["https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm"]
        == "✅🔍"
    )


def test_parse_check_status() -> None:
    text = "- ✅ https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm\n"
    out = parse_existing_status_map(text)
    assert (
        out["https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm"] == "✅"
    )


def test_parse_ignores_non_matching() -> None:
    text = (
        "## Overview（概要）\n"
        "- ⏳ https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm\n"
    )
    assert len(parse_existing_status_map(text)) == 0


def test_parse_empty_string() -> None:
    assert len(parse_existing_status_map("")) == 0


# ----------------------------------------------------------------------
# extract_urls
# ----------------------------------------------------------------------


def test_extract_urls_basic() -> None:
    html = (
        '<section><a href="https://docs.tricentis.com/testim/content/overview/'
        'testim-overview/index.htm">OV</a></section>'
    )
    assert extract_urls(html) == [
        "https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm"
    ]


def test_extract_urls_dedup() -> None:
    html = (
        '<a href="https://docs.tricentis.com/testim/content/overview/foo.htm">1</a>'
        '<a href="https://docs.tricentis.com/testim/content/overview/foo.htm">2</a>'
    )
    assert len(extract_urls(html)) == 1


def test_extract_urls_ignores_non_docs() -> None:
    assert extract_urls('<a href="https://example.com/page">X</a>') == []


def test_extract_urls_ignores_old_domain() -> None:
    assert extract_urls('<a href="https://help.testim.io/docs/testim-overview">O</a>') == []


# ----------------------------------------------------------------------
# build_output
# ----------------------------------------------------------------------


_SECTIONS = [
    {
        "title": "Overview",
        "urls": ["https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm"],
    }
]


def test_build_output_includes_url() -> None:
    out = build_output(sections=_SECTIONS, status_by_url={}, existing_header="")
    assert "https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm" in out


def test_build_output_default_status_is_check_lupe() -> None:
    out = build_output(sections=_SECTIONS, status_by_url={}, existing_header="")
    expected = "✅🔍 https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm"
    assert expected in out


def test_build_output_preserves_existing_check_status() -> None:
    status = {"https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm": "✅"}
    out = build_output(sections=_SECTIONS, status_by_url=status, existing_header="")
    assert "✅ https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm" in out
    # The ✅🔍 variant must NOT be present for that URL.
    assert (
        "✅🔍 https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm"
        not in out
    )


def test_build_output_includes_section_heading() -> None:
    out = build_output(sections=_SECTIONS, status_by_url={}, existing_header="")
    assert "## Overview" in out


def test_build_output_global_dedup() -> None:
    dup = [
        {"title": "A", "urls": ["https://docs.tricentis.com/testim/content/overview/foo.htm"]},
        {"title": "B", "urls": ["https://docs.tricentis.com/testim/content/overview/foo.htm"]},
    ]
    out = build_output(sections=dup, status_by_url={}, existing_header="")
    count = out.count("https://docs.tricentis.com/testim/content/overview/foo.htm")
    assert count == 1


# ----------------------------------------------------------------------
# fetch_sitemap
# ----------------------------------------------------------------------


def test_fetch_sitemap_parses_loc_entries() -> None:
    xml = (
        '<?xml version="1.0"?>\n'
        "<urlset>\n"
        "  <url><loc>https://docs.tricentis.com/testim/content/overview/"
        "testim-overview/index.htm</loc></url>\n"
        "  <url><loc>https://docs.tricentis.com/testim/content/getting-started/"
        "getting-started.htm</loc></url>\n"
        "  <url><loc>https://docs.tricentis.com/testim/</loc></url>\n"
        "</urlset>"
    )

    urls = fetch_sitemap(fetch_fn=lambda _url: xml)
    assert urls == [
        "https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm",
        "https://docs.tricentis.com/testim/content/getting-started/getting-started.htm",
    ]


def test_fetch_sitemap_returns_empty_on_fetch_failure(
    capsys: pytest.CaptureFixture[str],
) -> None:
    def boom(_url: str) -> str:
        raise RuntimeError("network error")

    urls = fetch_sitemap(fetch_fn=boom)
    assert urls == []
    captured = capsys.readouterr()
    assert "fetchSitemap: failed" in captured.err


def test_fetch_sitemap_ignores_non_content_urls() -> None:
    xml = "<urlset><url><loc>https://docs.tricentis.com/testim/changelog</loc></url></urlset>"
    assert fetch_sitemap(fetch_fn=lambda _url: xml) == []


# ----------------------------------------------------------------------
# CLI: main() exit behavior via injected fetch
# ----------------------------------------------------------------------


def test_main_exits_1_when_total_urls_is_zero(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    """TOC fetch → 0 sections; sitemap fallback → empty; exit 1 + error."""
    sidebar_path = tmp_path / "SIDEBAR_URLS.md"
    monkeypatch.setattr(mod, "_SIDEBAR_URLS_PATH", sidebar_path)

    # fetch_toc_data → empty sections
    monkeypatch.setattr(mod, "fetch_toc_data", lambda: {"sections": []})
    # fetch_sitemap uses the module-level function; monkeypatch to return empty.
    monkeypatch.setattr(mod, "fetch_sitemap", lambda: [])

    exit_code = mod.main([])
    assert exit_code == 1
    captured = capsys.readouterr()
    assert "Fatal: 0 URLs collected" in captured.err


def test_main_writes_output_from_toc(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    sidebar_path = tmp_path / "SIDEBAR_URLS.md"
    monkeypatch.setattr(mod, "_SIDEBAR_URLS_PATH", sidebar_path)

    def fake_toc() -> dict[str, list[dict[str, object]]]:
        return {
            "sections": [
                {
                    "title": "Overview",
                    "pages": [
                        {
                            "url": (
                                "https://docs.tricentis.com/testim/content/"
                                "overview/testim-overview/index.htm"
                            )
                        }
                    ],
                }
            ]
        }

    monkeypatch.setattr(mod, "fetch_toc_data", fake_toc)

    # resolve_url: pipeline may resolve each page url via madcap_toc.resolve_url.
    monkeypatch.setattr(mod, "resolve_url", lambda u: u)

    exit_code = mod.main([])
    assert exit_code == 0
    assert sidebar_path.exists()
    content = sidebar_path.read_text(encoding="utf-8")
    assert "testim-overview" in content
    assert "## Overview" in content


def test_main_falls_back_to_sitemap_when_toc_fails_and_no_existing_file(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    sidebar_path = tmp_path / "SIDEBAR_URLS.md"
    # Ensure it does not exist.
    monkeypatch.setattr(mod, "_SIDEBAR_URLS_PATH", sidebar_path)

    def toc_boom() -> dict[str, object]:
        raise RuntimeError("TOC unavailable")

    monkeypatch.setattr(mod, "fetch_toc_data", toc_boom)
    monkeypatch.setattr(
        mod,
        "fetch_sitemap",
        lambda: ["https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm"],
    )

    exit_code = mod.main([])
    assert exit_code == 0
    content = sidebar_path.read_text(encoding="utf-8")
    assert "testim-overview" in content
    captured = capsys.readouterr()
    assert "TOC fetch failed" in captured.err
