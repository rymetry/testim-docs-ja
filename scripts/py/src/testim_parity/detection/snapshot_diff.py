"""``scripts/detection/snapshot_diff.mjs`` の Python port。

committed HTML snapshot (``git HEAD``) と working tree snapshot を比較し
``snapshot-diff-status.json`` を書き出す。sidebar snapshot も slug set で比較。
classifier は heading / image / code / callout / content (default) の 5 カテ。
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from ..madcap_toc import extract_slug, extract_slugs_from_snapshot, match_all_tricentis_urls
from ..project import (
    DOCS_DIR,
    ROOT_DIR,
    file_path_to_slug,
    find_md_files,
    matches_section_filter,
    read_doc_file,
    resolve_slug,
)
from ..sync_health import build_run_scope

__all__ = [
    "CHANGE_CLASSIFIERS",
    "MARKER_404_RE",
    "SNAPSHOT_DIFF_SCHEMA_VERSION",
    "build_sidebar_url_map",
    "classify_changes",
    "fallback_source_url",
    "main",
    "parse_args",
]


SNAPSHOT_DIFF_SCHEMA_VERSION: int = 1

_SNAPSHOTS_DIR: Path = ROOT_DIR / "snapshots" / "en"
_CONTENT_DIR: Path = _SNAPSHOTS_DIR / "content"
_SIDEBAR_PATH: Path = _SNAPSHOTS_DIR / "sidebar.json"
_SIDEBAR_URLS_PATH: Path = ROOT_DIR / "docs" / "SIDEBAR_URLS.md"
_SOURCE_SYNC_STATUS_PATH: Path = ROOT_DIR / "source-sync-status.json"
_OUTPUT_PATH: Path = ROOT_DIR / "snapshot-diff-status.json"


MARKER_404_RE: re.Pattern[str] = re.compile(r"^<!-- 404:")


CHANGE_CLASSIFIERS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("heading", re.compile(r"^ {0,3}#{1,6}\s|</?h[1-6]\b", re.IGNORECASE)),
    ("image", re.compile(r"!\[|<Image\b|<img\b", re.IGNORECASE)),
    ("code", re.compile(r"^ {0,3}```|</?pre\b|</?code\b", re.IGNORECASE)),
    (
        "callout",
        re.compile(
            r"^ {0,3}>\s*(?:📘|📙|🚧|❗|✅|👍|⚠️)|^ {0,3}<Callout\b|<blockquote\b[^>]*theme=",
            re.IGNORECASE,
        ),
    ),
)


def _read_source_sync_payload() -> dict[str, Any] | None:
    """``source-sync-status.json`` を読み込む (不在 / 破損で None)。"""
    if not _SOURCE_SYNC_STATUS_PATH.exists():
        return None
    try:
        data = json.loads(_SOURCE_SYNC_STATUS_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) else None


def _build_snapshot_diff_run_id(
    checked_at: str,
    source_inventory_fingerprint: str | None,
    scope: Any,
) -> str:
    """run ごとに衝突しない runId を derive (mjs 等価)。"""
    filters = scope.get("filters") or {}
    seed = "|".join(
        [
            checked_at,
            source_inventory_fingerprint or "_no-inventory_",
            str(scope.get("type", "")),
            str(filters.get("slug") or ""),
            str(filters.get("section") or ""),
        ]
    )
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:12]
    return f"{checked_at}#snapshot-diff-{digest}"


def build_sidebar_url_map(sidebar_text: str | None) -> dict[str, str]:
    """SIDEBAR_URLS.md から slug → URL map を 1 回で構築 (mjs 等価)。"""
    out: dict[str, str] = {}
    if not sidebar_text:
        return out
    for match in match_all_tricentis_urls(sidebar_text):
        url = match.group(0)
        slug = extract_slug(url)
        if slug and slug not in out:
            out[slug] = url
    return out


def fallback_source_url(slug: str, sidebar_url_map: dict[str, str] | None) -> str | None:
    if not sidebar_url_map:
        return None
    return sidebar_url_map.get(slug)


def parse_args(argv: list[str] | None = None) -> dict[str, Any]:
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--section", default=None)
    parser.add_argument("--slug", default=None)
    parser.add_argument("--json", dest="json_mode", action="store_true")
    args, _ = parser.parse_known_args(argv)
    return {"section": args.section, "slug": args.slug, "json": args.json_mode}


def _get_head_content(relative_path: Path) -> str | None:
    """mjs ``git show HEAD:path`` 等価。HEAD に存在しない場合は None を返す。"""
    try:
        result = subprocess.run(
            ["git", "show", f"HEAD:{relative_path.as_posix()}"],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError:
        raise RuntimeError("git command not found on PATH") from None
    if result.returncode == 0:
        return result.stdout
    # exit 128 = file not found in HEAD (mjs と同じ semantics)
    if result.returncode == 128:
        return None
    raise RuntimeError(
        f"git show failed for {relative_path}: {result.stderr.strip() or result.stdout.strip()}"
    )


def classify_changes(head_content: str, current_content: str) -> dict[str, Any]:
    """行 diff を heading / image / code / callout / content の 5 カテに分類 (mjs 等価)。"""
    head_lines = head_content.split("\n")
    current_lines = current_content.split("\n")

    head_set = set(head_lines)
    current_set = set(current_lines)

    added = [line for line in current_lines if line not in head_set]
    removed = [line for line in head_lines if line not in current_set]

    categories: dict[str, dict[str, int]] = {
        "heading": {"added": 0, "removed": 0},
        "image": {"added": 0, "removed": 0},
        "code": {"added": 0, "removed": 0},
        "callout": {"added": 0, "removed": 0},
        "content": {"added": 0, "removed": 0},
    }

    def _bucket(line: str) -> str:
        for type_, pattern in CHANGE_CLASSIFIERS:
            if pattern.search(line):
                return type_
        return "content"

    for line in added:
        categories[_bucket(line)]["added"] += 1
    for line in removed:
        categories[_bucket(line)]["removed"] += 1

    return {"categories": categories, "diffLines": len(added) + len(removed)}


def _build_source_url_index(*, section: str | None) -> dict[str, str]:
    files = find_md_files(DOCS_DIR)
    index: dict[str, str] = {}
    for file_path in files:
        doc = read_doc_file(file_path)
        source_url = (doc.get("data") or {}).get("sourceUrl")
        if not source_url:
            continue
        if section and not matches_section_filter(
            doc.get("relativePath", ""), doc.get("data"), section
        ):
            continue
        slug = file_path_to_slug(file_path)
        index[slug] = source_url
    return index


def _diff_sidebar() -> dict[str, Any]:
    """sidebar.json を slug set で比較 (metadata の変更は無視、mjs 等価)。"""
    if not _SIDEBAR_PATH.exists():
        return {"changed": False, "addedPages": [], "removedPages": []}

    sidebar_rel = _SIDEBAR_PATH.relative_to(ROOT_DIR)
    current_content = _SIDEBAR_PATH.read_text(encoding="utf-8")
    head_content = _get_head_content(sidebar_rel)

    if head_content is None:
        try:
            snapshot = json.loads(current_content)
            pages = sorted(extract_slugs_from_snapshot(snapshot))
            return {"changed": True, "addedPages": pages, "removedPages": []}
        except json.JSONDecodeError as e:
            print(f"diff_sidebar: failed to parse new sidebar JSON: {e}", file=sys.stderr)
            return {
                "changed": True,
                "addedPages": [],
                "removedPages": [],
                "parseError": True,
            }

    try:
        head_snapshot = json.loads(head_content)
        current_snapshot = json.loads(current_content)
    except json.JSONDecodeError as e:
        print(f"diff_sidebar: failed to parse sidebar JSON for diff: {e}", file=sys.stderr)
        return {"changed": True, "addedPages": [], "removedPages": [], "parseError": True}

    head_pages = extract_slugs_from_snapshot(head_snapshot)
    current_pages = extract_slugs_from_snapshot(current_snapshot)
    added = sorted(p for p in current_pages if p not in head_pages)
    removed = sorted(p for p in head_pages if p not in current_pages)
    return {
        "changed": bool(added or removed),
        "addedPages": added,
        "removedPages": removed,
    }


def _find_html_files(root: Path) -> list[str]:
    return sorted(str(p.relative_to(root)) for p in root.rglob("*.html"))


def _empty_error_result() -> dict[str, Any]:
    return {
        "error": True,
        "summary": {
            "totalSnapshots": 0,
            "changed": 0,
            "added": 0,
            "removed": 0,
            "unchanged": 0,
        },
        "changes": [],
        "sidebar": {"changed": False, "addedPages": [], "removedPages": []},
    }


def main(argv: list[str] | None = None) -> int:
    """CLI エントリポイント (exit 0 / 1)。"""
    args = parse_args(argv)

    resolved_slug: str | None = None
    if args["slug"]:
        resolved_slug = resolve_slug(args["slug"])
        if not resolved_slug:
            print(
                f'❌ Unknown slug: "{args["slug"]}". No matching document found.',
                file=sys.stderr,
            )
            return 1

    source_urls = _build_source_url_index(section=args["section"])

    if not _CONTENT_DIR.exists():
        print("No snapshots found. Run check:snapshots:fetch first.")
        return 1

    sidebar_text = (
        _SIDEBAR_URLS_PATH.read_text(encoding="utf-8") if _SIDEBAR_URLS_PATH.exists() else ""
    )
    sidebar_url_map = build_sidebar_url_map(sidebar_text)

    snapshot_files = _find_html_files(_CONTENT_DIR)
    changes: list[dict[str, Any]] = []
    unchanged = 0

    for rel in snapshot_files:
        # rel は POSIX 区切りか OS 区切り。snapshot は常に POSIX-like で扱う。
        slug = rel[:-5].replace("\\", "/")
        if resolved_slug and slug != resolved_slug:
            continue
        if not resolved_slug and args["section"] and slug not in source_urls:
            continue

        snapshot_path = _CONTENT_DIR / rel
        current_content = snapshot_path.read_text(encoding="utf-8")
        rel_path = snapshot_path.relative_to(ROOT_DIR)
        try:
            head_content = _get_head_content(rel_path)
        except RuntimeError as err:
            print(f"{err}", file=sys.stderr)
            return 1
        source_url = source_urls.get(slug) or fallback_source_url(slug, sidebar_url_map)
        is_404 = bool(MARKER_404_RE.match(current_content))

        if head_content is None:
            if is_404:
                continue
            changes.append(
                {
                    "slug": slug,
                    "type": "page-added",
                    "sourceUrl": source_url,
                    "categories": None,
                    "diffLines": 0,
                }
            )
            continue

        if is_404 and not MARKER_404_RE.match(head_content):
            changes.append(
                {
                    "slug": slug,
                    "type": "page-removed",
                    "sourceUrl": source_url,
                    "categories": None,
                    "diffLines": 0,
                }
            )
            continue

        if head_content == current_content:
            unchanged += 1
            continue

        classification = classify_changes(head_content, current_content)
        changes.append(
            {
                "slug": slug,
                "type": "page-changed",
                "sourceUrl": source_url,
                "categories": classification["categories"],
                "diffLines": classification["diffLines"],
            }
        )

    sidebar = (
        {"changed": False, "addedPages": [], "removedPages": []}
        if resolved_slug
        else _diff_sidebar()
    )

    scoped_total = 1 if resolved_slug else len(snapshot_files)

    now = datetime.now(tz=UTC)
    checked_at = now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}Z"
    run_scope = build_run_scope(slug=resolved_slug, section=args["section"])
    source_sync_payload = _read_source_sync_payload()
    source_inventory_fp = None
    source_sync_run_id = None
    if source_sync_payload:
        fp = source_sync_payload.get("sourceInventoryFingerprint")
        source_inventory_fp = fp if isinstance(fp, str) else None
        run_id_candidate = source_sync_payload.get("runId")
        source_sync_run_id = run_id_candidate if isinstance(run_id_candidate, str) else None
    run_id = _build_snapshot_diff_run_id(checked_at, source_inventory_fp, run_scope)

    # diffLines 降順で sort (mjs ``(b - a)``)。None は 0 扱い。
    changes.sort(key=lambda c: -(c.get("diffLines") or 0))

    report: dict[str, Any] = {
        "schemaVersion": SNAPSHOT_DIFF_SCHEMA_VERSION,
        "runId": run_id,
        "sourceSyncRunId": source_sync_run_id,
        "sourceInventoryFingerprint": source_inventory_fp,
        "runScope": run_scope,
        "checkedAt": checked_at,
        "summary": {
            "totalSnapshots": scoped_total,
            "changed": sum(1 for c in changes if c["type"] == "page-changed"),
            "added": sum(1 for c in changes if c["type"] == "page-added"),
            "removed": sum(1 for c in changes if c["type"] == "page-removed"),
            "unchanged": unchanged,
            "runScope": run_scope,
        },
        "changes": changes,
        "sidebar": sidebar,
    }

    _OUTPUT_PATH.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    if not args["json"]:
        summary = report["summary"]
        print(
            f"Snapshot diff: {summary['changed']} changed, {summary['added']} added, "
            f"{summary['removed']} removed, {summary['unchanged']} unchanged"
        )
        if sidebar.get("changed"):
            if sidebar.get("parseError"):
                print("Sidebar: ⚠️ JSON parse error — could not compare sidebar (see warning above)")
            else:
                added_pages = sidebar.get("addedPages") or []
                removed_pages = sidebar.get("removedPages") or []
                added_n = len(added_pages) if isinstance(added_pages, list) else 0
                removed_n = len(removed_pages) if isinstance(removed_pages, list) else 0
                print(f"Sidebar: {added_n} page(s) added, {removed_n} page(s) removed")
        if changes:
            print()
            print("Changes:")
            for change in changes:
                if change["type"] == "page-changed":
                    cats = ", ".join(
                        f"{k}:+{v['added']}/-{v['removed']}"
                        for k, v in (change.get("categories") or {}).items()
                        if v.get("added", 0) > 0 or v.get("removed", 0) > 0
                    )
                    print(f"  CHANGED  {change['slug']} ({change['diffLines']} lines: {cats})")
                elif change["type"] == "page-added":
                    print(f"  ADDED    {change['slug']}")
                elif change["type"] == "page-removed":
                    print(f"  REMOVED  {change['slug']}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
