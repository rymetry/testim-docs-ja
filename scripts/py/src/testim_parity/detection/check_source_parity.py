"""``scripts/detection/check_source_parity.mjs`` の Python full port (Phase 4b M2)。

Source parity gate: JA docs と EN snapshot の segment-level 比較を走らせ、
``parity-check-status.json`` を書き出し、``compute_exit_code`` で ``0`` / ``1`` を
返す。mjs 版との byte-parity を守るため:

- ``parityRunScope`` / ``linkageState`` 等の shape は 1:1 に揃える
- ``summary`` フィールド順は mjs object literal と一致させる
- ``debug.*`` の coverage snapshot は既存 Python モジュールが既に byte-parity
  済 (``glossary_mask.create_mask_coverage`` / ``artifact_registry`` /
  ``en_source_patches``)

**サイド効果**:

- ``parity-check-status.json`` を ``output_path`` (default
  ``ROOT_DIR/parity-check-status.json``) に書き出す
- テストでは ``output_path`` / ``root_dir`` を ``tmp_path`` に差し替えて隔離

CLI usage::

    python -m testim_parity.detection.check_source_parity
    python -m testim_parity.detection.check_source_parity --slug=overview/testim-overview
    python -m testim_parity.detection.check_source_parity --section="Overview"
    python -m testim_parity.detection.check_source_parity --json
    python -m testim_parity.detection.check_source_parity --fail-on=actionable
"""

from __future__ import annotations

import datetime
import json
import sys
from pathlib import Path
from typing import Any, TextIO

from ..acknowledgements import (
    compute_snapshot_fingerprint,
    tag_issues_with_acknowledgements,
    validate_acknowledgements,
)
from ..advisory_queue import build_advisory_artifacts
from ..align import align_segments, parity_diffs_to_issues
from ..artifact_registry import create_artifact_coverage
from ..baseline import (
    compute_orphan_baseline_entries,
    load_baseline_file,
    tag_issues_with_baseline,
)
from ..checks import (
    compare_snapshot_structure,
    load_sidebar_slugs,
    load_sidebar_slugs_ordered,
    local_check,
)
from ..en_source_patches import create_en_source_patch_coverage
from ..glossary_mask import create_mask_coverage, mask_segment_text
from ..issue_state import (
    is_advisory_only_parity_issue,
    is_non_blocking_parity_issue,
    is_valid_acknowledged_issue,
)
from ..page_coverage import check_page_coverage, check_single_page_snapshot
from ..preprocess_en import preprocess_en_html
from ..project import (
    DOCS_DIR,
    ROOT_DIR,
    file_path_to_slug,
    find_md_files,
    matches_section_filter,
    read_doc_file,
    resolve_slug,
)
from ..segments_en import CALLOUT_NORMALIZATION_SLUGS, extract_segments_from_html
from ..segments_ja import extract_segments_from_markdown
from ..source_usability import detect_source_usability
from ..summary import summarize_parity_results
from ..summary_format import format_source_unusable_section
from ..sync_health import build_run_scope, validate_run_linkage
from ..turndown import convert_en_html_to_md
from ..types import ISSUE_SEVERITY
from .check_patch_review_cadence import (
    collect_overdue_patches,
)
from .check_patch_review_cadence import (
    format_warning as format_patch_review_warning,
)

__all__ = [
    "PARITY_CHECK_STATUS_SCHEMA_VERSION",
    "check_source_parity",
    "collect_snapshot_slugs",
    "compute_exit_code",
    "compute_parity_result",
    "get_console_coverage_state",
    "is_advisory_only_issue",
    "is_non_blocking_issue",
    "main",
    "parse_args",
]


PARITY_CHECK_STATUS_SCHEMA_VERSION = 1


# ---------------------------------------------------------------------------
# helpers: issue_state re-export + exit code / result computation
# ---------------------------------------------------------------------------


def is_non_blocking_issue(issue: Any) -> bool:
    return is_non_blocking_parity_issue(issue)


def is_advisory_only_issue(issue: Any) -> bool:
    return is_advisory_only_parity_issue(issue)


def _build_segment_inconclusive_issue(
    reason: str, category: str | None, meta: dict[str, Any] | None = None
) -> dict[str, Any]:
    """mjs ``buildSegmentInconclusiveIssue`` 等価。"""
    inconclusive_meta = dict(meta) if isinstance(meta, dict) else None
    category_str = category if category else "align-exception"
    return {
        "type": "segment-inconclusive",
        "severity": ISSUE_SEVERITY["segment-inconclusive"],
        "inconclusiveCategory": category_str,
        "inconclusiveMeta": inconclusive_meta,
        "inconclusiveReason": reason,
        "detail": f"alignment inconclusive [{category_str}]: {reason}",
    }


def compute_exit_code(summary: Any, fail_on: str | None) -> int:
    """summary から CLI exit code を決める (mjs ``computeExitCode`` 等価)。

    gate は ``reportableActive*`` と ``activeErrorFiles`` のみを参照する。
    legacy の ``activeFiles`` / ``activeActionableFiles`` は summary には残すが
    gate からは除外する。
    """
    if not isinstance(summary, dict):
        return 0
    error_files = summary.get("activeErrorFiles", 0) or 0
    if fail_on == "actionable":
        reportable_actionable = summary.get("reportableActiveActionableFiles", 0) or 0
        return 1 if reportable_actionable > 0 or error_files > 0 else 0
    reportable = summary.get("reportableActiveFiles", 0) or 0
    return 1 if reportable > 0 or error_files > 0 else 0


def compute_parity_result(summary: Any, freshness_state: str | None = None) -> str:
    """``pass`` / ``fail`` / ``inconclusive`` を返す (mjs ``computeParityResult``)。"""
    if not isinstance(summary, dict):
        return "inconclusive"
    reportable = summary.get("reportableActiveFiles", 0) or 0
    errors = summary.get("activeErrorFiles", 0) or 0
    if freshness_state and freshness_state != "fresh":
        if reportable > 0 or errors > 0:
            return "fail"
        return "inconclusive"
    if reportable > 0 or errors > 0:
        return "fail"
    return "pass"


def get_console_coverage_state(issues: Any) -> dict[str, Any]:
    """issue 一覧を 4 状態 (ack / baseline / advisory / reportable) に分類する。

    mjs ``getConsoleCoverageState`` 等価。icon / suffix は CLI 表示用。
    """
    if not isinstance(issues, list) or len(issues) == 0:
        return {"allAcked": False, "allCovered": False, "icon": "❌", "suffix": ""}

    all_acked = all(is_valid_acknowledged_issue(issue) for issue in issues)
    all_baseline_or_ack = all(is_non_blocking_issue(issue) for issue in issues)
    all_covered_or_advisory = all(
        is_non_blocking_issue(issue) or is_advisory_only_issue(issue) for issue in issues
    )
    has_advisory = any(is_advisory_only_issue(issue) for issue in issues)
    has_baseline_or_ack = any(is_non_blocking_issue(issue) for issue in issues)

    if not all_covered_or_advisory:
        return {"allAcked": False, "allCovered": False, "icon": "❌", "suffix": ""}

    if all_acked:
        suffix = " (all acknowledged)"
    elif all_baseline_or_ack:
        suffix = " (covered by baseline/ack)"
    elif has_advisory and not has_baseline_or_ack:
        suffix = " (source unusable)"
    else:
        suffix = " (advisory + baseline/ack)"

    return {
        "allAcked": all_acked,
        "allCovered": all_baseline_or_ack,
        "icon": "⏸️",
        "suffix": suffix,
    }


# ---------------------------------------------------------------------------
# filesystem readers
# ---------------------------------------------------------------------------


def _load_source_sync_payload(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        loaded: Any = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None
    return loaded if isinstance(loaded, dict) else None


def _load_snapshot_diff_payload(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        loaded: Any = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None
    return loaded if isinstance(loaded, dict) else None


def collect_snapshot_slugs(snapshots_dir: Path) -> set[str]:
    """``snapshots/en/content/`` 配下の ``.html`` から slug set を作る。"""
    slugs: set[str] = set()
    if not snapshots_dir.exists():
        return slugs

    def _walk(dir_path: Path, prefix: str) -> None:
        for entry in sorted(dir_path.iterdir()):
            if entry.is_dir():
                _walk(entry, f"{prefix}/{entry.name}" if prefix else entry.name)
            elif entry.name.endswith(".html"):
                stem = entry.name[: -len(".html")]
                slugs.add(f"{prefix}/{stem}" if prefix else stem)

    _walk(snapshots_dir, "")
    return slugs


def _load_acknowledgements_file(file_path: Path) -> dict[str, Any]:
    if not file_path.exists():
        return {"schemaVersion": 1, "entries": []}
    raw = json.loads(file_path.read_text(encoding="utf-8"))
    validated: Any = validate_acknowledgements(raw)
    if not isinstance(validated, dict):
        raise ValueError("validate_acknowledgements must return a dict")
    return validated


def _load_baseline_file_safe(file_path: Path) -> dict[str, Any]:
    if not file_path.exists():
        return {"schemaVersion": 2, "entries": []}
    loaded: Any = load_baseline_file(file_path)
    if not isinstance(loaded, dict):
        raise ValueError("load_baseline_file must return a dict")
    return loaded


# ---------------------------------------------------------------------------
# CLI arg parsing (mjs parseArgs 等価、prefix 一致で抽出)
# ---------------------------------------------------------------------------


def parse_args(argv: list[str] | None = None) -> dict[str, Any]:
    """mjs ``parseArgs`` と同じ shape の dict を返す。

    argparse ではなく prefix match にしているのは mjs と same 解析 rule を
    保つため (``--section=foo=bar`` 等の ``=`` 再区切りも等価に解釈)。
    """
    if argv is None:
        argv = sys.argv[1:]
    args: dict[str, Any] = {
        "json": False,
        "includeAdvisory": False,
        "includeAuditSignals": False,
        "section": None,
        "failOn": None,
        "slug": None,
    }
    for arg in argv:
        if arg == "--json":
            args["json"] = True
        elif arg == "--include-advisory":
            args["includeAdvisory"] = True
        elif arg == "--include-audit-signals":
            args["includeAuditSignals"] = True
        elif arg.startswith("--section="):
            args["section"] = arg[len("--section=") :]
        elif arg.startswith("--fail-on="):
            args["failOn"] = arg[len("--fail-on=") :]
        elif arg.startswith("--slug="):
            args["slug"] = arg[len("--slug=") :]
    return args


# ---------------------------------------------------------------------------
# check_source_parity
# ---------------------------------------------------------------------------


def _js_iso_timestamp(now: datetime.datetime | None = None) -> str:
    """mjs ``Date().toISOString()`` 等価 (UTC + ``Z`` + millisecond)。"""
    if now is None:
        now = datetime.datetime.now(tz=datetime.UTC)
    elif now.tzinfo is None:
        now = now.replace(tzinfo=datetime.UTC)
    else:
        now = now.astimezone(datetime.UTC)
    return now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}Z"


def _resolve_docs_dir(root_dir: Path | None) -> Path:
    """``root_dir`` が None なら default ``DOCS_DIR`` を使う。"""
    if root_dir is None:
        return DOCS_DIR
    return root_dir / "src" / "content" / "docs"


def check_source_parity(
    *,
    json_out: bool = False,
    include_advisory: bool = False,
    include_audit_signals: bool = False,
    section: str | None = None,
    fail_on: str | None = None,
    slug: str | None = None,
    output_path: Path | None = None,
    root_dir: Path | None = None,
    stdout: TextIO | None = None,
    stderr: TextIO | None = None,
    now: datetime.datetime | None = None,
) -> int:
    """parity gate を実行して exit code (0/1) を返す。

    DI 可能な path / stdout / now を受け取る (byte-parity conformance test 用)。
    プロダクション実行では全 default で mjs 同一の副作用。
    """
    out = stdout if stdout is not None else sys.stdout
    err = stderr if stderr is not None else sys.stderr
    effective_root = root_dir if root_dir is not None else ROOT_DIR
    effective_output = (
        output_path if output_path is not None else effective_root / "parity-check-status.json"
    )
    effective_baseline = effective_root / "parity-baseline.json"
    ack_path = effective_root / "parity-acknowledgements.json"
    source_sync_status_path = effective_root / "source-sync-status.json"
    snapshot_diff_status_path = effective_root / "snapshot-diff-status.json"
    snapshots_dir = effective_root / "snapshots" / "en" / "content"
    sidebar_urls_path = effective_root / "docs" / "SIDEBAR_URLS.md"
    docs_dir = _resolve_docs_dir(root_dir)

    sidebar_text = (
        sidebar_urls_path.read_text(encoding="utf-8") if sidebar_urls_path.exists() else ""
    )
    sidebar_slugs = load_sidebar_slugs(sidebar_text)
    source_sync_payload = _load_source_sync_payload(source_sync_status_path)
    freshness_state = source_sync_payload.get("freshnessState") if source_sync_payload else None
    snapshot_diff_payload = _load_snapshot_diff_payload(snapshot_diff_status_path)
    snapshot_slugs = collect_snapshot_slugs(snapshots_dir)
    all_files = find_md_files(docs_dir)

    try:
        ack_data = _load_acknowledgements_file(ack_path)
    except ValueError as exc:
        print(f"❌ {exc}", file=err)
        return 1

    now_utc = now or datetime.datetime.now(tz=datetime.UTC)
    if now_utc.tzinfo is None:
        now_utc = now_utc.replace(tzinfo=datetime.UTC)
    else:
        now_utc = now_utc.astimezone(datetime.UTC)
    today = now_utc.strftime("%Y-%m-%d")

    try:
        baseline_data = _load_baseline_file_safe(effective_baseline)
    except (ValueError, json.JSONDecodeError) as exc:
        print(f"❌ {exc}", file=err)
        return 1
    baseline_invalidated_slugs: set[str] = set()

    resolved_slug = resolve_slug(slug, docs_dir=docs_dir) if slug else None
    if slug and not resolved_slug:
        print(f'❌ Unknown slug: "{slug}". No matching document found.', file=err)
        return 1

    if not json_out:
        print("🔍 Source parity チェック開始\n", file=out)
        print(f"📄 {len(all_files)} ファイル対象", file=out)
        if resolved_slug:
            print(f"🔎 スラグ絞り込み: {resolved_slug}", file=out)
        if section:
            print(f"📂 セクション絞り込み: {section}", file=out)
        if fail_on:
            print(f"🚦 --fail-on={fail_on}", file=out)
        if include_advisory:
            print("📝 tokenless-near-tie review queue 表示: ON", file=out)
        if include_audit_signals:
            print("🔍 audit signals 表示: ON", file=out)
        print("", file=out)

    overdue_patches = collect_overdue_patches()
    for entry in overdue_patches:
        print(format_patch_review_warning(entry), file=err)

    results: list[dict[str, Any]] = []
    orphan_baseline_entries: list[dict[str, Any]] = []
    checked_count = 0
    mask_coverage = create_mask_coverage()
    artifact_coverage = create_artifact_coverage()
    patch_coverage = create_en_source_patch_coverage()

    for file_path in all_files:
        file_slug = file_path_to_slug(file_path, docs_dir=docs_dir)
        if resolved_slug and file_slug != resolved_slug:
            continue
        doc = read_doc_file(file_path, root_dir=root_dir)
        if not resolved_slug and not matches_section_filter(
            doc["relativePath"], doc["data"], section
        ):
            continue

        checked_count += 1
        issues: list[dict[str, Any]] = list(local_check({"body": doc["body"]}))

        if resolved_slug:
            if sidebar_slugs and file_slug not in sidebar_slugs:
                issues.append(
                    {
                        "type": "local-page-orphan",
                        "severity": ISSUE_SEVERITY["local-page-orphan"],
                        "detail": f"ローカルファイルが SIDEBAR_URLS.md に未掲載: {file_slug}",
                    }
                )
            single_page_issues: list[Any] = list(
                check_single_page_snapshot(
                    file_slug,
                    doc["data"].get("sourceUrl") or "",
                    snapshot_slugs,
                    freshness_state,
                )
            )
            issues.extend(single_page_issues)

        snapshot_path = snapshots_dir / f"{file_slug}.html"
        snapshot_fingerprint: str | None = None

        if snapshot_path.exists():
            raw_en_html = snapshot_path.read_text(encoding="utf-8")
            snapshot_fingerprint = compute_snapshot_fingerprint(raw_en_html)

            en_body: str | None = None
            en_html: str | None = None
            try:
                en_html = preprocess_en_html(
                    raw_en_html, slug=file_slug, patch_coverage=patch_coverage
                )
            except Exception as exc:  # noqa: BLE001 — mjs と同じ top-level catch
                print(
                    f"preprocessEnHtml failed for {file_slug}: {exc}. "
                    "Skipping snapshot comparison.",
                    file=err,
                )
                issues.append(
                    {
                        "type": "source-fetch-error",
                        "detail": f"HTML前処理失敗: {exc}",
                        "severity": ISSUE_SEVERITY["source-fetch-error"],
                    }
                )

            if en_html is not None:
                try:
                    en_body = convert_en_html_to_md(en_html)
                except Exception as exc:  # noqa: BLE001
                    print(
                        f"turndown failed for {file_slug}: {exc}. Skipping snapshot comparison.",
                        file=err,
                    )
                    issues.append(
                        {
                            "type": "source-fetch-error",
                            "detail": f"HTML→Markdown 変換失敗: {exc}",
                            "severity": ISSUE_SEVERITY["source-fetch-error"],
                        }
                    )

            if en_body is not None and en_html is not None:
                en_segments: list[Any] = []
                ja_segments: list[Any] = []
                extract_error: Exception | None = None
                try:
                    en_segments = list(
                        extract_segments_from_html(
                            en_html,
                            slug=file_slug,
                            callout_allow_slugs=CALLOUT_NORMALIZATION_SLUGS,
                        )
                    )
                    ja_segments = list(extract_segments_from_markdown(doc["body"]))
                except Exception as exc:  # noqa: BLE001
                    extract_error = exc
                    print(
                        f"extractSegments failed for {file_slug}: {exc}. "
                        "Falling back to coarse parity.",
                        file=err,
                    )

                for seg in ja_segments:
                    text = seg.get("textNorm") or seg.get("rawText") or ""
                    mask_info = mask_segment_text(text)
                    mask_coverage["record"](
                        slug=file_slug,
                        segmentKind=seg.get("segmentKind"),
                        sectionPath=seg.get("sectionPath"),
                        masks=mask_info.get("masks"),
                    )

                usability_issue = detect_source_usability(
                    raw_en_html=raw_en_html,
                    en_segments=en_segments,
                    ja_segments=ja_segments,
                    extract_error=extract_error,
                )

                if usability_issue:
                    issues.append(usability_issue)
                elif extract_error is not None:
                    issues.append(
                        _build_segment_inconclusive_issue(
                            str(extract_error), "align-exception", None
                        )
                    )
                    issues.extend(compare_snapshot_structure(en_body, doc["body"]))
                else:
                    alignment: dict[str, Any] | None = None
                    try:
                        alignment = align_segments(
                            en_segments,
                            ja_segments,
                            slug=file_slug,
                            coverage=artifact_coverage,
                        )
                    except Exception as exc:  # noqa: BLE001
                        print(
                            f"alignSegments failed for {file_slug}: {exc}. "
                            "Falling back to coarse parity.",
                            file=err,
                        )
                        issues.append(
                            _build_segment_inconclusive_issue(str(exc), "align-exception", None)
                        )
                        issues.extend(compare_snapshot_structure(en_body, doc["body"]))

                    if alignment is not None:
                        segment_issues = parity_diffs_to_issues(alignment["diffs"])
                        if alignment.get("inconclusive"):
                            issues.extend(segment_issues)
                            issues.append(
                                _build_segment_inconclusive_issue(
                                    alignment.get("inconclusiveReason") or "unknown reason",
                                    alignment.get("inconclusiveCategory"),
                                    alignment.get("inconclusiveMeta"),
                                )
                            )
                            issues.extend(compare_snapshot_structure(en_body, doc["body"]))
                        else:
                            issues.extend(segment_issues)
                            issues.extend(compare_snapshot_structure(en_body, doc["body"]))

        issues = tag_issues_with_acknowledgements(
            file_slug, issues, ack_data["entries"], snapshot_fingerprint, today
        )

        baseline_result = tag_issues_with_baseline(
            file_slug, issues, baseline_data["entries"], snapshot_fingerprint
        )
        issues = baseline_result["tagged"]
        if baseline_result.get("invalidated"):
            baseline_invalidated_slugs.add(file_slug)
        else:
            orphans = compute_orphan_baseline_entries(
                file_slug, baseline_data["entries"], baseline_result["matchedKeys"]
            )
            orphan_baseline_entries.extend(orphans)

        if len(issues) == 0:
            continue

        results.append(
            {
                "file": doc["relativePath"],
                "sourceUrl": doc["data"].get("sourceUrl") or "",
                "category": doc["data"].get("category") or "",
                "issues": issues,
            }
        )

        if not json_out:
            coverage = get_console_coverage_state(issues)
            print(f"{coverage['icon']} {doc['relativePath']}{coverage['suffix']}", file=out)
            for issue in issues:
                line = issue.get("line")
                location = f":{line}" if line else ""
                detail = issue.get("detail") or issue.get("text") or ""
                artifacts = issue.get("artifacts") or []
                artifact_note = f" [{'; '.join(artifacts)}]" if artifacts else ""
                tags: list[str] = []
                if issue.get("acknowledged") and not issue.get("ackExpired"):
                    tags.append("⏸")
                if issue.get("acknowledged") and issue.get("ackExpired"):
                    tags.append("⚠expired")
                if issue.get("baselined"):
                    tags.append("🧊baseline")
                issue_tag = f" {' '.join(tags)}" if tags else ""
                print(
                    f"   [{issue['type']}/{issue.get('severity', '')}]"
                    f"{location}{issue_tag} {detail}{artifact_note}",
                    file=out,
                )
                if issue.get("acknowledged") and not issue.get("ackExpired"):
                    print(
                        f"     ↳ acknowledged: {issue.get('ackReason')} "
                        f"(owner: {issue.get('ackOwner')}, "
                        f"review: {issue.get('ackReviewAfter')})",
                        file=out,
                    )
                if issue.get("acknowledged") and issue.get("ackExpired"):
                    print(
                        f"     ↳ expired: {issue.get('ackExpiryReason')} "
                        f"(owner: {issue.get('ackOwner')})",
                        file=out,
                    )
                if issue.get("baselined"):
                    print("     ↳ baseline: frozen", file=out)
            print("", file=out)

    if not resolved_slug:
        # mjs ``new Set(allFiles.map(f => filePathToSlug(f)))`` は挿入順を保つ
        # JS ``Set`` を返す。Python ``set`` は挿入順を保存しないため、
        # ``dict.fromkeys`` で dedup + ``find_md_files`` の filesystem walk 順を
        # 明示的に保持した list を ``check_page_coverage`` に渡す (reviewer P2)。
        local_slugs: list[str] = list(
            dict.fromkeys(file_path_to_slug(f, docs_dir=docs_dir) for f in all_files)
        )
        local_source_urls: dict[str, str] = {}
        for file_path in all_files:
            doc = read_doc_file(file_path, root_dir=root_dir)
            if doc["data"].get("sourceUrl"):
                local_source_urls[file_path_to_slug(file_path, docs_dir=docs_dir)] = doc["data"][
                    "sourceUrl"
                ]

        # sidebar_slugs も同じ理由で insertion-order (regex match 順) 版に差し
        # 替える。page_coverage の ``source-page-missing-local`` issue 順が
        # mjs と byte-identical になる。既存の ``sidebar_slugs`` set は
        # single-page mode の ``in`` lookup でのみ使用する。
        sidebar_slugs_ordered = load_sidebar_slugs_ordered(sidebar_text)

        coverage_issues = list(
            check_page_coverage(
                sidebar_slugs=sidebar_slugs_ordered,
                local_slugs=local_slugs,
                local_source_urls=local_source_urls,
                snapshot_slugs=snapshot_slugs,
                freshness_state=freshness_state,
            )
        )
        if len(coverage_issues) > 0:
            results.append(
                {
                    "file": "_page-coverage-gate",
                    "sourceUrl": "",
                    "category": "",
                    "issues": coverage_issues,
                }
            )

    advisory = build_advisory_artifacts(
        results=results,
        total_files=len(all_files),
        checked_files=checked_count,
        slug=resolved_slug,
        section=section,
    )
    advisory_queue_scope = advisory["advisoryQueueScope"]
    advisory_queue = advisory["advisoryQueue"]
    advisory_queue_summary = advisory["advisoryQueueSummary"]
    advisory_queue_error = advisory["advisoryQueueError"]
    if advisory_queue_error:
        print(
            f"⚠ tokenless-near-tie review queue 構築失敗: {advisory_queue_error}",
            file=err,
        )

    parity_run_scope = build_run_scope(slug=resolved_slug, section=section)
    linkage_state = validate_run_linkage(
        source_sync_payload, snapshot_diff_payload, parity_run_scope
    )
    linkage_blocking = source_sync_payload is not None and linkage_state != "linked"
    effective_freshness_state = "stale" if linkage_state == "stale" else freshness_state

    orphan_baseline_by_type: dict[str, int] = {}
    for o in orphan_baseline_entries:
        issue_type = o.get("issueType", "")
        orphan_baseline_by_type[issue_type] = orphan_baseline_by_type.get(issue_type, 0) + 1

    summary_base: dict[str, Any] = {
        "checkedAt": _js_iso_timestamp(now),
        "mode": "local",
        "totalFiles": len(all_files),
        "checkedFiles": checked_count,
    }
    summary_base.update(
        summarize_parity_results(
            results,
            {
                "orphanBaselineEntries": len(orphan_baseline_entries),
                "orphanBaselineByType": orphan_baseline_by_type,
            },
        )
    )
    summary_base.update(advisory_queue_summary)
    summary_base["baselineInvalidatedSlugs"] = sorted(baseline_invalidated_slugs)
    summary_base["runScope"] = parity_run_scope
    summary_base["freshnessState"] = effective_freshness_state
    summary_base["linkageState"] = linkage_state
    summary_base["snapshotDiffRunId"] = (
        snapshot_diff_payload.get("runId") if isinstance(snapshot_diff_payload, dict) else None
    )
    summary_base["sourceSyncRunId"] = (
        source_sync_payload.get("runId") if isinstance(source_sync_payload, dict) else None
    )
    summary_base["sourceInventoryFingerprint"] = (
        source_sync_payload.get("sourceInventoryFingerprint")
        if isinstance(source_sync_payload, dict)
        else None
    )

    base_result = compute_parity_result(summary_base, effective_freshness_state)
    summary = dict(summary_base)
    summary["result"] = (
        "inconclusive" if (linkage_blocking and base_result == "pass") else base_result
    )

    payload = {
        "schemaVersion": PARITY_CHECK_STATUS_SCHEMA_VERSION,
        "summary": summary,
        "files": results,
        "advisoryQueueScope": advisory_queue_scope,
        "advisoryQueue": advisory_queue,
        "debug": {
            "baselineSchemaVersion": baseline_data["schemaVersion"],
            "maskCoverage": mask_coverage["toJSON"](),
            "artifactCoverage": artifact_coverage["snapshot"](),
            "patchCoverage": patch_coverage["snapshot"](),
        },
    }

    effective_output.parent.mkdir(parents=True, exist_ok=True)
    effective_output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    if not json_out:
        print(f"\n{'=' * 60}\n📊 チェック結果サマリー\n", file=out)
        print(f"チェック済み: {checked_count} / {len(all_files)} ファイル", file=out)
        covered_files = summary.get("filesWithIssues", 0) - summary.get("activeFiles", 0)
        print(
            f"問題あり: {summary.get('filesWithIssues', 0)} ファイル "
            f"(active: {summary.get('activeFiles', 0)}, "
            f"covered by baseline/ack: {covered_files})",
            file=out,
        )
        if (summary.get("orphanBaselineEntries") or 0) > 0:
            by_type = summary.get("orphanBaselineByType") or {}
            top_entries = sorted(by_type.items(), key=lambda kv: -kv[1])[:3]
            top = ", ".join(f"{t}×{c}" for t, c in top_entries)
            print(
                f"🧹 orphan baseline entries: {summary['orphanBaselineEntries']} 件 "
                f"({top}) — runtime で一致しないため掃除対象。--slug で再生成してください",
                file=out,
            )
        print(
            f"actionable: {summary.get('actionableFiles', 0)} ファイル "
            f"(active: {summary.get('activeActionableFiles', 0)})",
            file=out,
        )
        print(f"signal-only: {summary.get('signalFiles', 0)} ファイル", file=out)
        print(f"errors: {summary.get('errorFiles', 0)} ファイル", file=out)
        if summary.get("acknowledgedIssues", 0) > 0:
            print(f"acknowledged: {summary['acknowledgedIssues']} 件", file=out)
        if summary.get("expiredAcknowledgements", 0) > 0:
            print(
                f"expired acknowledgements: {summary['expiredAcknowledgements']} 件",
                file=out,
            )
        print("\n問題種別:", file=out)
        for issue_type, count in (summary.get("issuesByType") or {}).items():
            print(f"  {issue_type}: {count} 件", file=out)
        if (summary.get("baselinedIssues") or 0) > 0:
            print(
                f"\n[frozen baseline] 凍結 drift (gate から除外): "
                f"{summary['baselinedIssues']} 件 / "
                f"{summary.get('baselinedFiles', 0)} ファイル",
                file=out,
            )
            for issue_type, count in (summary.get("baselinedByType") or {}).items():
                print(f"  {issue_type}: {count} 件", file=out)
        if summary.get("baselineInvalidatedSlugs"):
            print(
                f"\n[frozen baseline] invalidated slugs "
                f"(snapshot 変更で baseline 失効): "
                f"{len(summary['baselineInvalidatedSlugs'])}",
                file=out,
            )
            for slug_entry in summary["baselineInvalidatedSlugs"]:
                print(f"  {slug_entry}", file=out)
        if (summary.get("auditSignalIssues") or 0) > 0 or include_audit_signals:
            print(
                f"\n[audit signals] coarse heuristics (gate から除外): "
                f"{summary.get('auditSignalIssues', 0)} 件 / "
                f"{summary.get('auditSignalFiles', 0)} ファイル",
                file=out,
            )
            print(
                "  parity-regression issue body には載せません。"
                "deep-audit workflow と --include-audit-signals でのみ詳細を確認できます",
                file=out,
            )
            if include_audit_signals:
                by_type_audit = summary.get("auditSignalsByType") or {}
                sorted_types = sorted(by_type_audit.keys())
                if not sorted_types:
                    print("  (no coarse signals in this run)", file=out)
                else:
                    for issue_type in sorted_types:
                        print(
                            f"    {issue_type}: {by_type_audit[issue_type]} 件",
                            file=out,
                        )
        source_unusable_section = format_source_unusable_section(summary)
        if source_unusable_section:
            print("", file=out)
            print(source_unusable_section, file=out)
        if include_advisory:
            if advisory_queue_scope.get("isComplete"):
                scope_label = "full-repo queue"
            elif advisory_queue_scope.get("type") == "slug":
                scope_label = f"partial scope: slug={advisory_queue_scope['filters']['slug']}"
            else:
                scope_label = f"partial scope: section={advisory_queue_scope['filters']['section']}"
            print(
                f"\n[review queue] tokenless-near-tie: "
                f"{summary.get('advisoryQueueIssues', 0)} 件 / "
                f"{summary.get('advisoryQueueFiles', 0)} ファイル ({scope_label})",
                file=out,
            )
            print(
                "  derived from existing segment-inconclusive issues only; "
                "no detector, no gate impact",
                file=out,
            )
            if advisory_queue_error:
                print(f"  queue unavailable: {advisory_queue_error}", file=out)
            if not advisory_queue_scope.get("isComplete"):
                print(
                    "  partial queue only; use a full-repo run before workflow "
                    "automation or queue-wide triage",
                    file=out,
                )
            for entry in advisory_queue:
                state = "blocking review" if entry.get("blocking") else "baselined review"
                file_or_slug = entry.get("slug") or entry.get("file")
                print(f"  {file_or_slug} ({state})", file=out)
                for issue in entry.get("issues", []):
                    left = issue.get("leftSectionPath")
                    right = issue.get("rightSectionPath")
                    pair = f' pair="{left}" <-> "{right}"' if left and right else ""
                    print(f"    - {issue.get('detail', '')}{pair}", file=out)
        try:
            rel_output = effective_output.relative_to(effective_root)
        except ValueError:
            rel_output = effective_output
        print(f"\n💾 詳細結果を {rel_output} に保存しました", file=out)

    return compute_exit_code(summary, fail_on)


# ---------------------------------------------------------------------------
# CLI entrypoint
# ---------------------------------------------------------------------------


def main(
    argv: list[str] | None = None,
    *,
    output_path: Path | None = None,
    root_dir: Path | None = None,
    stdout: TextIO | None = None,
    stderr: TextIO | None = None,
) -> int:
    args = parse_args(argv)
    return check_source_parity(
        json_out=args["json"],
        include_advisory=args["includeAdvisory"],
        include_audit_signals=args["includeAuditSignals"],
        section=args["section"],
        fail_on=args["failOn"],
        slug=args["slug"],
        output_path=output_path,
        root_dir=root_dir,
        stdout=stdout,
        stderr=stderr,
    )


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"❌ エラー: {exc}", file=sys.stderr)
        sys.exit(1)
