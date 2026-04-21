"""``scripts/detection/snapshot_update.mjs`` の Python full port (Phase 4b M3)。

live EN HTML を取得し、``snapshots/en/content/{slug}.html`` と sidebar 検証用
TOC data (``snapshots/en/sidebar.json``) を書き出す。``source-sync-status.json``
は dry-run でも metadata として常に更新される。

**Byte-identical contract**: mjs ``snapshot_update.mjs`` との byte parity を
維持するための注意点:

- HTTP retry は exponential backoff (1s / 2s / 4s)、HTTP 522 + network error の
  みリトライ対象。
- throttle 100 ms sleep を fetch 間で挟む (mjs の ``await sleep(THROTTLE_MS)``
  と同等)。
- ``extractMainContent`` regex は深さ優先の手動 depth tracking。BS4 parse では
  ``<div>`` 省略タグ補完の差異が出るため、mjs と同じ regex ベースで実装する。
- ``source-sync-status.json`` payload は ``build_source_sync_status`` に委譲。
  caller で ``now`` / ``run_seed`` を渡すと deterministic (conformance test 用)。

Usage::

    python -m testim_parity.detection.snapshot_update
    python -m testim_parity.detection.snapshot_update --section=Overview
    python -m testim_parity.detection.snapshot_update --slug=overview/testim-overview
    python -m testim_parity.detection.snapshot_update --dry-run
"""

from __future__ import annotations

import argparse
import datetime
import json
import re
import sys
import time
from collections.abc import Callable, Iterable, Mapping
from pathlib import Path
from typing import Any, TypedDict

import httpx

from ..madcap_toc import (
    DEFAULT_BASE_URL,
    build_sidebar_snapshot,
    extract_slugs_from_snapshot,
    fetch_toc_data,
)
from ..project import (
    DOCS_DIR,
    ROOT_DIR,
    file_path_to_slug,
    find_md_files,
    matches_section_filter,
    read_doc_file,
    resolve_slug,
)
from ..segments_en import extract_segments_from_html
from ..segments_ja import extract_segments_from_markdown
from ..source_usability import detect_source_usability
from ..sync_exclusions import get_exclusion, is_source_side_debt
from ..sync_health import build_run_scope, build_source_sync_status

__all__ = [
    "MAX_RETRIES",
    "RETRY_BASE_MS",
    "THROTTLE_MS",
    "FETCH_TIMEOUT_S",
    "MARKER_404",
    "DEFAULT_USER_AGENT",
    "extract_main_content",
    "fetch_html_with_retry",
    "fetch_html_content",
    "run_recovery_probe",
    "verify_sidebar",
    "main",
]


DEFAULT_USER_AGENT = "testim-docs-ja-snapshot/1.0"
THROTTLE_MS = 100
MAX_RETRIES = 3
RETRY_BASE_MS = 1000
FETCH_TIMEOUT_S = 30.0


def MARKER_404(url: str) -> str:  # noqa: N802 — mjs ``MARKER_404`` と同名
    """404 sentinel content (mjs と byte-identical)。"""
    return f"<!-- 404: page not found at {url} -->\n"


_SUPPORTED_RECOVERY_REASONS: frozenset[str] = frozenset(
    {"extractor-empty", "shallow-snapshot", "escaped-details-residue"}
)

_MC_MAIN_OPEN_RE = re.compile(r"""<div[^>]*\bid=["']mc-main-content["'][^>]*>""", re.IGNORECASE)
_DIV_OPEN_RE = re.compile(r"<div\b", re.IGNORECASE)
_DIV_CLOSE_RE = re.compile(r"</div>", re.IGNORECASE)


SNAPSHOTS_DIR: Path = ROOT_DIR / "snapshots" / "en"
CONTENT_DIR: Path = SNAPSHOTS_DIR / "content"
SIDEBAR_PATH: Path = SNAPSHOTS_DIR / "sidebar.json"
SOURCE_SYNC_STATUS_PATH: Path = ROOT_DIR / "source-sync-status.json"


class FetchResult(TypedDict, total=False):
    """``fetch_html_with_retry`` の戻り値 shape (mjs と揃える)。"""

    html: str | None
    status: int


class FetchContentResult(TypedDict, total=False):
    content: str | None
    status: int
    reason: str | None


HttpFetcher = Callable[[str], FetchResult]
"""``url -> {"html", "status"}`` の fetch 関数契約 (test 用 DI)。"""


# ---------------------------------------------------------------------------
# main content extraction (regex-based, mjs 等価)
# ---------------------------------------------------------------------------


def extract_main_content(html: str) -> str | None:
    """``<div id="mc-main-content">...</div>`` の中身だけを切り出す。

    BS4 で parse すると省略タグ補完や class 属性 normalize で byte drift が
    起きる。mjs と完全同一の正規表現 + depth tracking ロジックを port する。

    Args:
        html: full page HTML text

    Returns:
        inner HTML text (``<div>`` 直下の ``</div>`` まで) or ``None`` if
        marker が見つからない / 深さが合わない。
    """
    start_match = _MC_MAIN_OPEN_RE.search(html)
    if not start_match:
        return None

    depth = 1
    pos = start_match.end()
    last_close_index = -1

    while depth > 0 and pos < len(html):
        open_match = _DIV_OPEN_RE.search(html, pos)
        close_match = _DIV_CLOSE_RE.search(html, pos)

        if not close_match:
            break

        if open_match and open_match.start() < close_match.start():
            depth += 1
            pos = open_match.end()
        else:
            depth -= 1
            last_close_index = close_match.start()
            pos = close_match.end()

    if depth != 0 or last_close_index < 0:
        return None

    return html[start_match.end() : last_close_index]


# ---------------------------------------------------------------------------
# HTTP fetch with retry
# ---------------------------------------------------------------------------


def _default_fetch_html(url: str) -> FetchResult:
    """httpx ベースの default fetcher。mjs ``fetch`` + timeout 等価。"""
    try:
        response = httpx.get(
            url,
            headers={
                "User-Agent": DEFAULT_USER_AGENT,
                "Accept": ("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"),
            },
            timeout=FETCH_TIMEOUT_S,
            follow_redirects=True,
        )
        status = response.status_code
        if 200 <= status < 300:
            return {"html": response.text, "status": status}
        return {"html": None, "status": status}
    except httpx.TimeoutException as exc:
        raise TimeoutError(f"fetch timeout for {url}") from exc


def fetch_html_with_retry(
    url: str,
    *,
    fetch_fn: HttpFetcher | None = None,
    sleep_fn: Callable[[float], None] | None = None,
) -> FetchResult:
    """HTTP 522 + network error を exponential backoff で retry する。

    mjs ``fetchHtmlWithRetry`` と同じ振る舞い:

    - HTTP 522 (Cloudflare "origin unreachable") → retry
    - network exception (timeout 等) → retry
    - retry は ``MAX_RETRIES`` 回まで、base ``RETRY_BASE_MS`` × ``2**attempt``

    retry 打ち切り時:

    - 非 200 leftover ステータスは ``{"html": None, "status": <code>}``
    - ネットワーク例外を raise した場合は再 raise (mjs と同一)

    Args:
        url: absolute URL to fetch.
        fetch_fn: DI-able fetcher (tests use in-memory double). ``None`` →
            :func:`_default_fetch_html`。
        sleep_fn: DI-able sleeper for deterministic tests.
    """
    fetcher: HttpFetcher = fetch_fn if fetch_fn is not None else _default_fetch_html
    sleeper: Callable[[float], None] = sleep_fn if sleep_fn is not None else time.sleep

    last_error: BaseException | None = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            result = fetcher(url)
            status = int(result.get("status", 0))
            html = result.get("html")
            if status == 522 and attempt < MAX_RETRIES:
                sleeper((RETRY_BASE_MS * (2**attempt)) / 1000.0)
                continue
            if not (200 <= status < 300):
                return {"html": None, "status": status}
            return {"html": html, "status": status}
        except Exception as exc:  # noqa: BLE001 — 包括 retry (mjs と同等)
            last_error = exc
            if attempt < MAX_RETRIES:
                sleeper((RETRY_BASE_MS * (2**attempt)) / 1000.0)
                continue
            raise

    # 論理上到達不能 (for-loop 内で return / raise する)。safety net:
    if last_error is not None:
        raise last_error
    return {"html": None, "status": 522}


def fetch_html_content(
    url: str,
    *,
    fetch_fn: HttpFetcher | None = None,
    sleep_fn: Callable[[float], None] | None = None,
) -> FetchContentResult:
    """fetch + ``#mc-main-content`` 抽出を 1 段で行う (mjs 等価)。"""
    fetched = fetch_html_with_retry(url, fetch_fn=fetch_fn, sleep_fn=sleep_fn)
    html = fetched.get("html")
    status = int(fetched.get("status", 0))
    if not html:
        return {"content": None, "status": status, "reason": None}
    main_content = extract_main_content(html)
    if main_content is None:
        return {"content": None, "status": status, "reason": "mc-main-content-not-found"}
    return {"content": main_content, "status": status, "reason": None}


# ---------------------------------------------------------------------------
# recovery probe (existing source_usability を使って broken-upstream 判定)
# ---------------------------------------------------------------------------


def _build_probe_ja_segments() -> list[dict[str, Any]]:
    """synthetic JA segments (threshold 全てを同時に満たす shape)。"""
    return list(
        extract_segments_from_markdown(
            "# Probe\n\n## Section One\n\nA\n\nB\n\n## Section Two\n\nC\n\nD\n\nE"
        )
    )


def _build_broken_recovery_probe(
    *,
    actual_issue_type: str,
    actual_reason: str,
    exclusion_entry: Mapping[str, Any],
) -> dict[str, Any]:
    expected_issue = exclusion_entry.get("expectedIssueType")
    expected_reason = exclusion_entry.get("expectedReason")
    return {
        "fetchStatus": "excluded-broken",
        "recoveryProbe": {
            "issueType": actual_issue_type,
            "reason": actual_reason,
            "expectedIssueType": expected_issue,
            "expectedReason": expected_reason,
            "expectedMatch": (
                actual_issue_type == expected_issue and actual_reason == expected_reason
            ),
        },
    }


def run_recovery_probe(
    *,
    raw_en_html: str,
    exclusion_entry: Mapping[str, Any],
    extract_segments: Callable[[str], Iterable[Any]] | None = None,
) -> dict[str, Any]:
    """broken upstream page が復旧したかを判定する。

    mjs ``runRecoveryProbe`` と byte-identical な出力を返す:

    - extractor が例外 → ``probe-failed`` / ``extractor-throw``
    - registry の ``expectedReason`` が未対応 → ``probe-failed`` /
      ``unsupported-expected-reason``
    - detector が issue を返さない → ``excluded-recovered``
    - それ以外 → ``excluded-broken`` + 実際の issueType / reason
    """
    extractor: Callable[[str], Iterable[Any]] = (
        extract_segments if extract_segments is not None else extract_segments_from_html
    )

    expected_reason_raw = exclusion_entry.get("expectedReason")
    if expected_reason_raw not in _SUPPORTED_RECOVERY_REASONS:
        return _build_broken_recovery_probe(
            actual_issue_type="probe-failed",
            actual_reason="unsupported-expected-reason",
            exclusion_entry=exclusion_entry,
        )

    try:
        en_segments: list[Any] = list(extractor(raw_en_html))
    except Exception:  # noqa: BLE001 — mjs と同じく全例外を probe-failed に倒す
        return _build_broken_recovery_probe(
            actual_issue_type="probe-failed",
            actual_reason="extractor-throw",
            exclusion_entry=exclusion_entry,
        )

    ja_segments = _build_probe_ja_segments()
    issue = detect_source_usability(
        raw_en_html=raw_en_html,
        en_segments=en_segments,
        ja_segments=ja_segments,
        extract_error=None,
    )

    if not issue:
        return {"fetchStatus": "excluded-recovered", "recoveryProbe": None}

    signals = issue.get("usabilitySignals") or {}
    actual_reason = signals.get("reason", "unknown")
    return _build_broken_recovery_probe(
        actual_issue_type=issue.get("type", "unknown"),
        actual_reason=actual_reason,
        exclusion_entry=exclusion_entry,
    )


# ---------------------------------------------------------------------------
# target collection + sidebar verification
# ---------------------------------------------------------------------------


def _collect_targets(*, section: str | None, resolved_slug: str | None) -> list[dict[str, Any]]:
    """``src/content/docs/`` の markdown から ``{slug, sourceUrl, relativePath}`` 列を作る。"""
    files = find_md_files(DOCS_DIR)
    targets: list[dict[str, Any]] = []

    for file_path in files:
        doc = read_doc_file(file_path)
        data: dict[str, Any] = doc["data"]
        source_url = data.get("sourceUrl")
        if not source_url:
            continue

        file_slug = file_path_to_slug(file_path)
        if resolved_slug and file_slug != resolved_slug:
            continue
        if section and not matches_section_filter(doc["relativePath"], data, section):
            continue

        targets.append(
            {
                "slug": file_slug,
                "sourceUrl": source_url,
                "relativePath": doc["relativePath"],
            }
        )
    return targets


def verify_sidebar(
    *,
    dry_run: bool = False,
    fetch_toc_fn: Callable[..., dict[str, Any]] | None = None,
    fetched_at: str | None = None,
    sidebar_path: Path | None = None,
    base_url: str = DEFAULT_BASE_URL,
) -> dict[str, Any]:
    """TOC data を取得して sidebar snapshot を検証 + (optional) 書き出す。

    mjs ``verifySidebar`` と同じ戻り値 keys を使う (``ok`` / ``sectionCount`` /
    ``pageCount`` / ``sidebarSlugs`` / ``reason``)。
    """
    output_path = sidebar_path if sidebar_path is not None else SIDEBAR_PATH
    try:
        toc = fetch_toc_fn() if fetch_toc_fn is not None else fetch_toc_data(base_url=base_url)
        sections = toc.get("sections", [])
        if len(sections) == 0:
            return {"ok": False, "reason": "TOC data returned 0 sections"}

        snapshot = build_sidebar_snapshot(sections, base_url=base_url, fetched_at=fetched_at)

        if not dry_run:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(
                json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )

        total_pages = sum(len(section.get("pages", [])) for section in sections)
        sidebar_slugs = sorted(extract_slugs_from_snapshot(snapshot))
        return {
            "ok": True,
            "sectionCount": len(sections),
            "pageCount": total_pages,
            "sidebarSlugs": sidebar_slugs,
        }
    except Exception as exc:  # noqa: BLE001 — mjs と同じく reason string で返す
        print(f"verifySidebar failed: {exc}", file=sys.stderr)
        return {"ok": False, "reason": str(exc)}


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch EN snapshots + sidebar (Python port of snapshot_update.mjs)."
    )
    parser.add_argument("--section", default=None)
    parser.add_argument("--slug", default=None)
    parser.add_argument("--dry-run", dest="dry_run", action="store_true")
    return parser.parse_args(argv)


def main(
    argv: list[str] | None = None,
    *,
    now: datetime.datetime | None = None,
    run_seed: str | None = None,
    fetch_html_fn: HttpFetcher | None = None,
    fetch_toc_fn: Callable[..., dict[str, Any]] | None = None,
    sleep_fn: Callable[[float], None] | None = None,
    root_dir: Path | None = None,
    stdout: Any | None = None,
) -> dict[str, Any]:
    """CLI エントリポイント。mjs ``main()`` と同じ戻り値 dict を返す。

    テスト容易性のため ``fetch_html_fn`` / ``fetch_toc_fn`` / ``sleep_fn`` /
    ``root_dir`` を DI できる (プロダクション実行では全て default)。
    """
    if argv is None:
        argv = sys.argv[1:]
    args = _parse_args(argv)

    resolved_slug = resolve_slug(args.slug) if args.slug else None
    if args.slug and not resolved_slug:
        print(
            f'❌ Unknown slug: "{args.slug}". No matching document found.',
            file=sys.stderr,
        )
        return {
            "fetched": 0,
            "notFound": 0,
            "errors": 1,
            "excluded": 0,
            "skipped": 0,
            "sidebarVerified": False,
            "sourceSyncStatus": None,
        }

    targets = _collect_targets(section=args.section, resolved_slug=resolved_slug)
    run_scope = build_run_scope(slug=resolved_slug, section=args.section)

    out = stdout if stdout is not None else sys.stdout
    effective_root = root_dir if root_dir is not None else ROOT_DIR
    content_dir = effective_root / "snapshots" / "en" / "content"
    sidebar_path = effective_root / "snapshots" / "en" / "sidebar.json"
    status_path = effective_root / "source-sync-status.json"

    if len(targets) == 0:
        print("No targets found.", file=out)
        return {
            "fetched": 0,
            "notFound": 0,
            "errors": 1 if args.slug else 0,
            "excluded": 0,
            "skipped": 0,
            "sidebarVerified": False,
            "sourceSyncStatus": None,
        }

    if not args.dry_run:
        content_dir.mkdir(parents=True, exist_ok=True)

    print(f"Fetching {len(targets)} page(s)...", file=out)

    fetched_count = 0
    not_found_count = 0
    error_count = 0
    excluded_count = 0
    page_results: list[dict[str, Any]] = []
    sleeper: Callable[[float], None] = sleep_fn if sleep_fn is not None else time.sleep

    for target in targets:
        excluded_slug = is_source_side_debt(target["slug"])

        try:
            fc = fetch_html_content(target["sourceUrl"], fetch_fn=fetch_html_fn, sleep_fn=sleeper)
            content = fc.get("content")
            status = int(fc.get("status", 0))
            reason = fc.get("reason")
            snapshot_path = content_dir / f"{target['slug']}.html"

            if excluded_slug:
                # source-side debt: snapshot file は絶対に上書きしない。
                if not content:
                    if status != 200:
                        detail = f"HTTP {status}"
                    elif reason == "mc-main-content-not-found":
                        detail = "#mc-main-content not found"
                    else:
                        detail = "fetch failed"
                    print(
                        f"  FERR {target['slug']} — source-side debt ({detail})",
                        file=out,
                    )
                    error_count += 1
                    page_results.append(
                        {
                            "slug": target["slug"],
                            "fetchStatus": "excluded-fetch-error",
                            "debtCategory": "source-side-debt",
                            "errorDetail": detail,
                            "recoveryProbe": None,
                        }
                    )
                else:
                    exclusion = get_exclusion(target["slug"])
                    # get_exclusion は None を返さない (``is_source_side_debt`` が
                    # True だったので registry に必ずある) が、type narrowing のため
                    # fallback を持たせる。
                    assert exclusion is not None
                    probe = run_recovery_probe(raw_en_html=content, exclusion_entry=exclusion)
                    label = "RECOV" if probe["fetchStatus"] == "excluded-recovered" else "DEBT "
                    print(
                        f"  {label} {target['slug']} — source-side debt (snapshot not written)",
                        file=out,
                    )
                    excluded_count += 1
                    page_results.append(
                        {
                            "slug": target["slug"],
                            "fetchStatus": probe["fetchStatus"],
                            "recoveryProbe": probe["recoveryProbe"],
                            "debtCategory": "source-side-debt",
                        }
                    )
            elif status == 404:
                if not args.dry_run:
                    snapshot_path.parent.mkdir(parents=True, exist_ok=True)
                    snapshot_path.write_text(MARKER_404(target["sourceUrl"]), encoding="utf-8")
                print(f"  404  {target['slug']}", file=out)
                not_found_count += 1
                page_results.append({"slug": target["slug"], "fetchStatus": "not-found"})
            elif not content:
                if reason == "mc-main-content-not-found":
                    detail = "#mc-main-content not found (page structure changed?)"
                else:
                    detail = f"HTTP {status}"
                print(f"  SKIP {target['slug']} — {detail}", file=out)
                error_count += 1
                page_results.append(
                    {
                        "slug": target["slug"],
                        "fetchStatus": "error",
                        "errorDetail": detail,
                    }
                )
            else:
                if not args.dry_run:
                    snapshot_path.parent.mkdir(parents=True, exist_ok=True)
                    snapshot_path.write_text(content, encoding="utf-8")
                print(f"  OK   {target['slug']}", file=out)
                fetched_count += 1
                page_results.append({"slug": target["slug"], "fetchStatus": "ok"})
        except Exception as exc:  # noqa: BLE001 — mjs と同じ top-level catch
            if excluded_slug:
                print(
                    f"  FERR {target['slug']} — source-side debt (fetch failed: {exc})",
                    file=out,
                )
                error_count += 1
                page_results.append(
                    {
                        "slug": target["slug"],
                        "fetchStatus": "excluded-fetch-error",
                        "debtCategory": "source-side-debt",
                        "errorDetail": str(exc),
                        "recoveryProbe": None,
                    }
                )
            else:
                print(f"  ERR  {target['slug']} — {exc}", file=out)
                error_count += 1
                page_results.append(
                    {
                        "slug": target["slug"],
                        "fetchStatus": "error",
                        "errorDetail": str(exc),
                    }
                )

        sleeper(THROTTLE_MS / 1000.0)

    # sidebar 検証は page fetch と独立。
    sidebar_result = verify_sidebar(
        dry_run=args.dry_run,
        fetch_toc_fn=fetch_toc_fn,
        sidebar_path=sidebar_path,
    )
    if sidebar_result["ok"]:
        mode = "dry-run" if args.dry_run else "saved"
        print(
            "  OK   sidebar "
            f"({mode}: {sidebar_result['sectionCount']} sections, "
            f"{sidebar_result['pageCount']} pages)",
            file=out,
        )
    else:
        print(f"  ERR  sidebar — {sidebar_result.get('reason', 'unknown')}", file=out)
        error_count += 1

    # ``source-sync-status.json`` は常に書き出す (metadata 扱い、dry-run でも)。
    source_sync_status = build_source_sync_status(
        pages=page_results,
        sidebar_result=sidebar_result,
        run_scope=run_scope,
        now=now,
        run_seed=run_seed,
    )
    status_path.write_text(
        json.dumps(source_sync_status, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(file=out)
    print(
        f"Done: {fetched_count} fetched, {not_found_count} not found, "
        f"{error_count} errors, {excluded_count} excluded (source-side debt)",
        file=out,
    )
    print(f"Freshness: {source_sync_status['freshnessState']}", file=out)
    if args.dry_run:
        print(
            "(dry-run — snapshots not written, source-sync-status.json updated)",
            file=out,
        )

    return {
        "fetched": fetched_count,
        "notFound": not_found_count,
        "errors": error_count,
        "excluded": excluded_count,
        "skipped": 0,
        "sidebarVerified": bool(sidebar_result["ok"]),
        "sourceSyncStatus": source_sync_status,
    }


if __name__ == "__main__":
    result = main()
    sys.exit(1 if result["errors"] > 0 else 0)
