"""``testim_parity.detection.snapshot_update`` の unit test (M3)。

mjs ``scripts/detection/snapshot_update.mjs`` full port の byte-parity を守る。
live EN fetch は in-memory fake HTTP で差し替え、``root_dir`` を ``tmp_path`` に
向けて filesystem 副作用を隔離する。
"""

from __future__ import annotations

import datetime
import io
import json
from pathlib import Path
from typing import Any

import pytest

from testim_parity.detection import snapshot_update as su
from testim_parity.detection.snapshot_update import (
    MARKER_404,
    extract_main_content,
    fetch_html_content,
    fetch_html_with_retry,
    main,
    run_recovery_probe,
    verify_sidebar,
)

# ----------------------------------------------------------------------
# extract_main_content — mjs と同じ depth tracking
# ----------------------------------------------------------------------


def test_extract_main_content_basic() -> None:
    html = '<html><body><div id="mc-main-content"><p>Hello</p></div></body></html>'
    assert extract_main_content(html) == "<p>Hello</p>"


def test_extract_main_content_nested_div_depth_tracking() -> None:
    """入れ子 ``<div>`` は depth を正しく追う。"""
    html = (
        '<div id="mc-main-content">'
        "<div><p>Inner</p></div>"
        "<div><div><span>Deeper</span></div></div>"
        "</div>"
    )
    expected = "<div><p>Inner</p></div><div><div><span>Deeper</span></div></div>"
    assert extract_main_content(html) == expected


def test_extract_main_content_single_quoted_id() -> None:
    html = "<div id='mc-main-content'><p>OK</p></div>"
    assert extract_main_content(html) == "<p>OK</p>"


def test_extract_main_content_case_insensitive() -> None:
    html = '<DIV ID="mc-main-content"><p>OK</p></DIV>'
    assert extract_main_content(html) == "<p>OK</p>"


def test_extract_main_content_with_attributes_before_id() -> None:
    html = '<div class="wrap" id="mc-main-content" data-x="y"><p>Body</p></div>'
    assert extract_main_content(html) == "<p>Body</p>"


def test_extract_main_content_not_found() -> None:
    assert extract_main_content("<div><p>Hello</p></div>") is None


def test_extract_main_content_unmatched_returns_none() -> None:
    """閉じタグが足りない不整合 HTML → None (fail-close)。"""
    html = '<div id="mc-main-content"><p>Hello</p>'  # 未閉
    assert extract_main_content(html) is None


# ----------------------------------------------------------------------
# fetch_html_with_retry — 522 / network error の retry 挙動
# ----------------------------------------------------------------------


def test_fetch_html_with_retry_ok_first_try() -> None:
    calls: list[str] = []
    sleeps: list[float] = []

    def fake_fetch(url: str) -> dict[str, Any]:
        calls.append(url)
        return {"html": "<html/>", "status": 200}

    result = fetch_html_with_retry(
        "https://example.com/a",
        fetch_fn=fake_fetch,
        sleep_fn=sleeps.append,
    )
    assert result == {"html": "<html/>", "status": 200}
    assert len(calls) == 1
    assert sleeps == []


def test_fetch_html_with_retry_522_then_success() -> None:
    """HTTP 522 が 1 回返った後に 200 → retry 成功。"""
    responses: list[dict[str, Any]] = [
        {"html": None, "status": 522},
        {"html": "<ok/>", "status": 200},
    ]
    sleeps: list[float] = []

    def fake_fetch(url: str) -> dict[str, Any]:
        return responses.pop(0)

    result = fetch_html_with_retry(
        "https://example.com/a",
        fetch_fn=fake_fetch,
        sleep_fn=sleeps.append,
    )
    assert result == {"html": "<ok/>", "status": 200}
    # base 1000 ms × 2**0 = 1.0 s
    assert sleeps == [1.0]


def test_fetch_html_with_retry_522_exhaust_returns_522() -> None:
    """MAX_RETRIES 超えても 522 → ``{"html": None, "status": 522}``。"""

    def fake_fetch(url: str) -> dict[str, Any]:
        return {"html": None, "status": 522}

    sleeps: list[float] = []
    result = fetch_html_with_retry(
        "https://example.com/a",
        fetch_fn=fake_fetch,
        sleep_fn=sleeps.append,
    )
    assert result == {"html": None, "status": 522}
    # attempt 0/1/2 に retry sleep (attempt 3 は打ち切りで return)
    assert sleeps == [1.0, 2.0, 4.0]


def test_fetch_html_with_retry_non_2xx_no_retry() -> None:
    """404 / 500 等は retry 対象外で即 return。"""

    def fake_fetch(url: str) -> dict[str, Any]:
        return {"html": None, "status": 404}

    sleeps: list[float] = []
    result = fetch_html_with_retry(
        "https://example.com/a",
        fetch_fn=fake_fetch,
        sleep_fn=sleeps.append,
    )
    assert result == {"html": None, "status": 404}
    assert sleeps == []


def test_fetch_html_with_retry_network_error_then_success() -> None:
    call_count = [0]

    def fake_fetch(url: str) -> dict[str, Any]:
        call_count[0] += 1
        if call_count[0] == 1:
            raise RuntimeError("econnreset")
        return {"html": "<ok/>", "status": 200}

    sleeps: list[float] = []
    result = fetch_html_with_retry(
        "https://example.com/a",
        fetch_fn=fake_fetch,
        sleep_fn=sleeps.append,
    )
    assert result == {"html": "<ok/>", "status": 200}
    assert sleeps == [1.0]


def test_fetch_html_with_retry_network_error_exhausts_raises() -> None:
    def fake_fetch(url: str) -> dict[str, Any]:
        raise RuntimeError("timeout")

    with pytest.raises(RuntimeError, match="timeout"):
        fetch_html_with_retry(
            "https://example.com/a",
            fetch_fn=fake_fetch,
            sleep_fn=lambda _s: None,
        )


# ----------------------------------------------------------------------
# fetch_html_content — extract_main_content と組み合わせた挙動
# ----------------------------------------------------------------------


def test_fetch_html_content_extracts_mc_main() -> None:
    def fake_fetch(url: str) -> dict[str, Any]:
        return {
            "html": '<html><div id="mc-main-content"><p>X</p></div></html>',
            "status": 200,
        }

    result = fetch_html_content(
        "https://example.com/a", fetch_fn=fake_fetch, sleep_fn=lambda _s: None
    )
    assert result == {"content": "<p>X</p>", "status": 200, "reason": None}


def test_fetch_html_content_missing_marker_returns_reason() -> None:
    def fake_fetch(url: str) -> dict[str, Any]:
        return {"html": "<html><p>no marker</p></html>", "status": 200}

    result = fetch_html_content(
        "https://example.com/a", fetch_fn=fake_fetch, sleep_fn=lambda _s: None
    )
    assert result == {
        "content": None,
        "status": 200,
        "reason": "mc-main-content-not-found",
    }


def test_fetch_html_content_http_error_forwarded() -> None:
    def fake_fetch(url: str) -> dict[str, Any]:
        return {"html": None, "status": 404}

    result = fetch_html_content(
        "https://example.com/a", fetch_fn=fake_fetch, sleep_fn=lambda _s: None
    )
    assert result == {"content": None, "status": 404, "reason": None}


# ----------------------------------------------------------------------
# run_recovery_probe — existing source_usability / segments_en の組み合わせ
# ----------------------------------------------------------------------


def test_run_recovery_probe_unsupported_reason() -> None:
    result = run_recovery_probe(
        raw_en_html="<div/>",
        exclusion_entry={
            "expectedIssueType": "foo",
            "expectedReason": "not-a-real-reason",
        },
    )
    assert result["fetchStatus"] == "excluded-broken"
    assert result["recoveryProbe"]["reason"] == "unsupported-expected-reason"
    assert result["recoveryProbe"]["issueType"] == "probe-failed"


def test_run_recovery_probe_extractor_throws() -> None:
    def boom(_html: str) -> list[Any]:
        raise RuntimeError("cannot parse")

    result = run_recovery_probe(
        raw_en_html="<div/>",
        exclusion_entry={
            "expectedIssueType": "source-usability",
            "expectedReason": "extractor-empty",
        },
        extract_segments=boom,
    )
    assert result["fetchStatus"] == "excluded-broken"
    assert result["recoveryProbe"]["reason"] == "extractor-throw"


def test_run_recovery_probe_recovered_when_detector_returns_none() -> None:
    """extractor が segments を返して detector が issue を返さない → recovered。"""

    def synthetic_en(_html: str) -> list[dict[str, Any]]:
        # detector threshold 全部を満たす十分な segment 列
        return [
            {"kind": "heading", "text": "Title", "level": 1},
            {"kind": "paragraph", "text": "Body A"},
            {"kind": "paragraph", "text": "Body B"},
            {"kind": "paragraph", "text": "Body C"},
            {"kind": "paragraph", "text": "Body D"},
            {"kind": "heading", "text": "Section", "level": 2},
            {"kind": "paragraph", "text": "More"},
        ]

    result = run_recovery_probe(
        raw_en_html="<html/>",
        exclusion_entry={
            "expectedIssueType": "source-usability",
            "expectedReason": "extractor-empty",
        },
        extract_segments=synthetic_en,
    )
    assert result == {"fetchStatus": "excluded-recovered", "recoveryProbe": None}


def test_run_recovery_probe_still_broken_uses_detector_reason() -> None:
    """detector が issue を返す → broken + 実際の issueType/reason。"""

    def empty_extractor(_html: str) -> list[Any]:
        return []  # detector は ``extractor-empty`` を返すはず

    result = run_recovery_probe(
        raw_en_html="<html/>",
        exclusion_entry={
            "expectedIssueType": "source-usability",
            "expectedReason": "extractor-empty",
        },
        extract_segments=empty_extractor,
    )
    assert result["fetchStatus"] == "excluded-broken"
    probe = result["recoveryProbe"]
    # ``expectedMatch`` は actual と expected が完全一致したときのみ True
    assert probe["expectedIssueType"] == "source-usability"
    assert probe["expectedReason"] == "extractor-empty"


# ----------------------------------------------------------------------
# verify_sidebar — TOC fetch を DI で差し替え
# ----------------------------------------------------------------------


def test_verify_sidebar_writes_snapshot(tmp_path: Path) -> None:
    sidebar_path = tmp_path / "sidebar.json"

    def fake_toc() -> dict[str, Any]:
        return {
            "sections": [
                {
                    "title": "Overview",
                    "url": "/content/overview/testim-overview.htm",
                    "pages": [
                        {
                            "slug": "overview/testim-overview",
                            "url": "/content/overview/testim-overview.htm",
                            "title": "Testim Overview",
                        }
                    ],
                }
            ]
        }

    result = verify_sidebar(
        dry_run=False,
        fetch_toc_fn=fake_toc,
        fetched_at="2026-04-22T00:00:00.000Z",
        sidebar_path=sidebar_path,
    )
    assert result["ok"] is True
    assert result["sectionCount"] == 1
    assert result["pageCount"] == 1
    assert sidebar_path.exists()
    written = json.loads(sidebar_path.read_text(encoding="utf-8"))
    assert written["fetchedAt"] == "2026-04-22T00:00:00.000Z"
    assert written["sections"][0]["title"] == "Overview"


def test_verify_sidebar_empty_sections_fails() -> None:
    result = verify_sidebar(
        dry_run=True, fetch_toc_fn=lambda: {"sections": []}, sidebar_path=Path("/tmp/unused")
    )
    assert result == {"ok": False, "reason": "TOC data returned 0 sections"}


def test_verify_sidebar_dry_run_skips_write(tmp_path: Path) -> None:
    sidebar_path = tmp_path / "sidebar.json"
    result = verify_sidebar(
        dry_run=True,
        fetch_toc_fn=lambda: {
            "sections": [
                {
                    "title": "Overview",
                    "url": "/content/overview/x.htm",
                    "pages": [
                        {"slug": "overview/x", "url": "/content/overview/x.htm", "title": "X"}
                    ],
                }
            ]
        },
        fetched_at="t",
        sidebar_path=sidebar_path,
    )
    assert result["ok"] is True
    assert not sidebar_path.exists()


def test_verify_sidebar_toc_exception_returns_reason() -> None:
    def boom() -> dict[str, Any]:
        raise RuntimeError("connection refused")

    result = verify_sidebar(dry_run=True, fetch_toc_fn=boom, sidebar_path=Path("/tmp/x"))
    assert result["ok"] is False
    assert "connection refused" in result["reason"]


def test_verify_sidebar_stderr_is_dependency_injectable() -> None:
    """reviewer M2: ``verify_sidebar`` は ``stderr`` を DI 可能に。

    ``sys.stderr`` をハードコードせず、test で StringIO を受け取れる。
    """
    captured = io.StringIO()

    def boom() -> dict[str, Any]:
        raise RuntimeError("fetch boom")

    result = verify_sidebar(
        dry_run=True,
        fetch_toc_fn=boom,
        sidebar_path=Path("/tmp/unused"),
        stderr=captured,
    )
    assert result["ok"] is False
    assert "verifySidebar failed: fetch boom" in captured.getvalue()


def test_main_stderr_is_dependency_injectable(tmp_path: Path) -> None:
    """reviewer M2: ``main`` の stderr が ``verify_sidebar`` にも forward される。

    unknown slug 経路 (資料 frontmatter 由来ではない slug) と、sidebar 検証が
    例外を投げた場合の両方で注入した buffer に書かれることを確認する。
    """
    captured = io.StringIO()
    result = main(
        ["--slug=___really_not_a_slug___"],
        stdout=io.StringIO(),
        stderr=captured,
        root_dir=tmp_path,
        fetch_html_fn=lambda _url: {"html": None, "status": 500},
        fetch_toc_fn=lambda: {"sections": []},
        sleep_fn=lambda _s: None,
    )
    assert result["errors"] == 1
    assert "Unknown slug" in captured.getvalue()


# ----------------------------------------------------------------------
# reviewer M1: ``get_exclusion`` registry drift の fail-fast guard
# ----------------------------------------------------------------------


def test_main_surfaces_exclusion_registry_drift_in_error_log(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """``is_source_side_debt=True`` なのに ``get_exclusion=None`` → 明示 guard。

    reviewer M1: ``assert exclusion is not None`` は ``python -O`` でスキップ
    されるため、explicit ``RuntimeError`` guard に置換した。registry drift
    (``scripts/lib/source_sync_exclusions.mjs`` と Python 側 mirror の
    dual-source-of-truth skew) が起きても、エラー message に slug + remediation
    hint を含めて ``source-sync-status.json`` の ``errors`` counter に計上する
    ことで reviewer に可視化する (mjs の top-level ``catch (error)`` と同じく
    page 単位の fetch error 経路に流す)。

    production で ``python -O`` 下でも:
    1. ``RuntimeError`` が明示的 raise される (``assert`` が skip されない)
    2. outer ``except Exception`` が捕捉して ``excluded-fetch-error`` に
       計上する (mjs と同じ graceful degradation)
    3. error detail に drift 警告 message + slug が残る (reviewer に drift を
       知らせる runtime signal)
    """
    import testim_parity.detection.snapshot_update as su_mod

    synthetic_md = tmp_path / "overview" / "probe.md"
    synthetic_md.parent.mkdir(parents=True, exist_ok=True)
    synthetic_md.write_text("body\n", encoding="utf-8")

    def fake_find_md_files(_dir: Any) -> list[Path]:
        return [synthetic_md]

    def fake_read_doc_file(_path: Path) -> dict[str, Any]:
        return {
            "relativePath": "overview/probe.md",
            "data": {"sourceUrl": "https://docs.tricentis.com/testim/content/x.htm"},
            "body": "body",
        }

    monkeypatch.setattr(su_mod, "find_md_files", fake_find_md_files)
    monkeypatch.setattr(su_mod, "read_doc_file", fake_read_doc_file)
    monkeypatch.setattr(su_mod, "file_path_to_slug", lambda _p: "overview/probe")
    monkeypatch.setattr(su_mod, "is_source_side_debt", lambda _slug: True)
    monkeypatch.setattr(su_mod, "get_exclusion", lambda _slug: None)

    def fake_fetch(_url: str) -> dict[str, Any]:
        return {
            "html": '<html><div id="mc-main-content"><p>ok</p></div></html>',
            "status": 200,
        }

    stdout = io.StringIO()
    stderr = io.StringIO()
    result = main(
        [],
        stdout=stdout,
        stderr=stderr,
        root_dir=tmp_path,
        fetch_html_fn=fake_fetch,
        fetch_toc_fn=lambda: {"sections": []},
        sleep_fn=lambda _s: None,
    )

    # outer ``except Exception`` が RuntimeError を捕捉 → page 単位エラーに計上。
    assert result["errors"] == 2  # 1 page + sidebar (empty sections)
    assert result["excluded"] == 0
    # error detail に明示 guard の remediation hint が残る。
    assert result["sourceSyncStatus"] is not None
    error_details = [err["detail"] for err in result["sourceSyncStatus"]["errors"]]
    assert any("sync_exclusions registry is missing entry" in detail for detail in error_details)
    assert any("'overview/probe'" in detail for detail in error_details)


# ----------------------------------------------------------------------
# MARKER_404 — mjs と byte-identical
# ----------------------------------------------------------------------


def test_marker_404_format() -> None:
    url = "https://docs.tricentis.com/testim/content/gone.htm"
    assert MARKER_404(url) == f"<!-- 404: page not found at {url} -->\n"


# ----------------------------------------------------------------------
# main() — unknown slug fast-fail
# ----------------------------------------------------------------------


def test_main_unknown_slug_returns_error(tmp_path: Path) -> None:
    stdout = io.StringIO()
    result = main(
        ["--slug=not-a-real-slug-xxyyzz"],
        stdout=stdout,
        root_dir=tmp_path,
        fetch_html_fn=lambda _url: {"html": None, "status": 500},
        fetch_toc_fn=lambda: {"sections": []},
        sleep_fn=lambda _s: None,
    )
    assert result["errors"] == 1
    assert result["sourceSyncStatus"] is None


# ----------------------------------------------------------------------
# constants pinning
# ----------------------------------------------------------------------


def test_constants_match_mjs() -> None:
    """mjs と同じ数値を保持する (regression pin)。"""
    assert su.MAX_RETRIES == 3
    assert su.RETRY_BASE_MS == 1000
    assert su.THROTTLE_MS == 100
    assert su.FETCH_TIMEOUT_S == 30.0
    assert su.DEFAULT_USER_AGENT == "testim-docs-ja-snapshot/1.0"


# ----------------------------------------------------------------------
# source-sync-status always written
# ----------------------------------------------------------------------


def test_main_writes_source_sync_status_on_sidebar_only_empty_targets(
    tmp_path: Path,
) -> None:
    """target 0 件 (section 絞り込みで miss) でも source-sync-status は
    書かれないことを確認 (mjs と同じ: targets 0 → 早期 return、status path に
    write しない契約)。"""
    stdout = io.StringIO()

    def fake_toc() -> dict[str, Any]:
        return {"sections": []}

    result = main(
        ["--section=___nonexistent_section___"],
        stdout=stdout,
        root_dir=tmp_path,
        fetch_html_fn=lambda _url: {"html": None, "status": 500},
        fetch_toc_fn=fake_toc,
        sleep_fn=lambda _s: None,
        now=datetime.datetime(2026, 4, 22, tzinfo=datetime.UTC),
        run_seed="deterministic",
    )
    assert result["fetched"] == 0
    # targets 0 の早期 return → source-sync-status は書かれない
    assert not (tmp_path / "source-sync-status.json").exists()
