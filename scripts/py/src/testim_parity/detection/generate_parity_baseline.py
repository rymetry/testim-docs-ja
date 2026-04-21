"""``scripts/detection/generate_parity_baseline.mjs`` の Python port。

``parity-check-status.json`` から ``parity-baseline.json`` (schema v2) を生成。
3 モード (``--regenerate`` / ``--slug=<csv>`` / ``--types=<csv>``) を mutually
exclusive に受ける。deterministic output で CI が bit-identical を検証する。
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

from ..acknowledgements import compute_snapshot_fingerprint
from ..baseline import (
    BASELINE_ELIGIBLE_TYPES,
    STRUCTURE_CATEGORIES,
    compute_structure_fingerprint,
    load_baseline_file,
    validate_baseline,
    validate_types_arg,
)
from ..project import ROOT_DIR
from ..types import STRUCTURE_MISMATCH_TYPES

__all__ = [
    "assert_full_parity_status",
    "assert_pre_regen_gate",
    "build_baseline_from_status",
    "build_fingerprint_map",
    "build_generation_meta",
    "load_snapshot_diff_status",
    "main",
    "merge_partial_baseline",
    "merge_partial_baseline_by_type",
    "serialize_baseline",
]


_STATUS_PATH: Path = ROOT_DIR / "parity-check-status.json"
_BASELINE_PATH: Path = ROOT_DIR / "parity-baseline.json"
_SNAPSHOT_DIFF_PATH: Path = ROOT_DIR / "snapshot-diff-status.json"
_SNAPSHOTS_DIR: Path = ROOT_DIR / "snapshots" / "en" / "content"


def _file_entry_to_slug(file_path: str) -> str:
    return file_path.replace("src/content/docs/", "", 1).removesuffix(".md")


def _get_checked_at(status: dict[str, Any]) -> str:
    checked_at = (status.get("summary") or {}).get("checkedAt")
    if not isinstance(checked_at, str):
        raise ValueError(
            "parity-check-status.json must include summary.checkedAt as a valid ISO timestamp"
        )
    # ISO parse チェック (mjs ``Date.parse`` 相当)。
    try:
        datetime.fromisoformat(checked_at.replace("Z", "+00:00"))
    except ValueError as err:
        raise ValueError(
            "parity-check-status.json must include summary.checkedAt as a valid ISO timestamp"
        ) from err
    return checked_at


def assert_full_parity_status(status: dict[str, Any]) -> None:
    summary = status.get("summary") or {}
    checked_files = summary.get("checkedFiles")
    total_files = summary.get("totalFiles")
    if (
        not isinstance(checked_files, int)
        or not isinstance(total_files, int)
        or checked_files != total_files
    ):
        raise ValueError(
            "parity-check-status.json is not a full-repo run. "
            "Run `npm run check:parity` before generating baseline."
        )


def load_snapshot_diff_status(file_path: Path = _SNAPSHOT_DIFF_PATH) -> dict[str, Any]:
    """``snapshot-diff-status.json`` を読み込む。不在 / parse 失敗は ValueError (mjs 等価)。"""
    if not file_path.exists():
        try:
            rel = file_path.relative_to(ROOT_DIR)
        except ValueError:
            rel = file_path
        raise ValueError(
            f"snapshot-diff-status.json not found at {rel}. "
            "Run `npm run check:snapshots` before a full --regenerate."
        )
    try:
        raw = file_path.read_text(encoding="utf-8")
    except OSError as err:
        raise ValueError(f"snapshot-diff-status.json read failure: {err}") from err
    try:
        data: dict[str, Any] = json.loads(raw)
        return data
    except json.JSONDecodeError as err:
        raise ValueError(f"snapshot-diff-status.json parse failure: {err}") from err


def _js_json_stringify(value: Any) -> str:
    """mjs ``JSON.stringify`` と byte 一致の短いダンプ (エラー文言用)。"""
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def assert_pre_regen_gate(status: dict[str, Any], snapshot_diff: dict[str, Any]) -> None:
    """full ``--regenerate`` 前の fail-closed gate (mjs 等価)。"""
    failures: list[str] = []
    summary = status.get("summary")
    if not summary or not isinstance(summary, dict):
        raise ValueError("parity-check-status.json: summary missing or not an object")

    run_scope = summary.get("runScope") or {}
    if run_scope.get("isComplete") is not True:
        got = _js_json_stringify(run_scope.get("isComplete"))
        failures.append(f"summary.runScope.isComplete must be true (got {got})")
    if summary.get("freshnessState") != "fresh":
        got = _js_json_stringify(summary.get("freshnessState"))
        failures.append(f'summary.freshnessState must be "fresh" (got {got})')
    if summary.get("linkageState") != "linked":
        got = _js_json_stringify(summary.get("linkageState"))
        failures.append(f'summary.linkageState must be "linked" (got {got})')
    if summary.get("result") != "pass":
        got = _js_json_stringify(summary.get("result"))
        failures.append(f'summary.result must be "pass" (got {got})')
    if summary.get("orphanBaselineEntries") != 0:
        got = _js_json_stringify(summary.get("orphanBaselineEntries"))
        failures.append(f"summary.orphanBaselineEntries must be 0 (got {got})")
    patch_mismatches = ((status.get("debug") or {}).get("patchCoverage") or {}).get("mismatches")
    if not isinstance(patch_mismatches, list):
        got = _js_json_stringify(patch_mismatches)
        failures.append(f"debug.patchCoverage.mismatches must be an array (got {got})")
    elif len(patch_mismatches) != 0:
        failures.append(
            f"debug.patchCoverage.mismatches.length must be 0 (got {len(patch_mismatches)})"
        )
    diff_summary = snapshot_diff.get("summary")
    if not diff_summary or not isinstance(diff_summary, dict):
        failures.append("snapshot-diff-status.json: summary missing or not an object")
    else:
        for counter in ("changed", "added", "removed"):
            if diff_summary.get(counter) != 0:
                failures.append(
                    f"snapshotDiff.summary.{counter} must be 0 "
                    f"(got {_js_json_stringify(diff_summary.get(counter))})"
                )
    if failures:
        detail = "\n".join(f"  - {f}" for f in failures)
        raise ValueError(
            "baseline-regen-gate: FAIL\n"
            + detail
            + "\nSee docs/SYSTEM_SPEC.md §システム不変量 (PR Z entry fail-closed invariants)"
        )


def build_fingerprint_map(snapshots_dir: Path = _SNAPSHOTS_DIR) -> dict[str, str]:
    """snapshots tree を 1 回走査して slug → sha256 map を返す (mjs 等価)。"""
    out: dict[str, str] = {}
    if not snapshots_dir.exists():
        return out
    for html_path in sorted(snapshots_dir.rglob("*.html")):
        rel = html_path.relative_to(snapshots_dir).as_posix()
        slug = rel.removesuffix(".html")
        content = html_path.read_text(encoding="utf-8")
        out[slug] = compute_snapshot_fingerprint(content)
    return out


def build_baseline_from_status(
    status: dict[str, Any],
    fingerprint_map: dict[str, str],
    meta: dict[str, str],
) -> dict[str, Any]:
    """``parity-check-status.json`` から baseline dict を組み立てる (mjs 等価)。"""
    entries: list[dict[str, Any]] = []

    for file in status.get("files") or []:
        slug = _file_entry_to_slug(file.get("file", ""))
        fingerprint = fingerprint_map.get(slug)
        if not fingerprint:
            continue

        for issue in file.get("issues") or []:
            issue_type = issue.get("type")
            if issue_type not in BASELINE_ELIGIBLE_TYPES:
                continue

            entry: dict[str, Any] = {
                "slug": slug,
                "issueType": issue_type,
                "snapshotFingerprint": fingerprint,
                "priority": "medium",
                "sectionPath": None,
                "segmentKind": None,
                "enSegmentIndex": None,
                "jaSegmentIndex": None,
                "enSourceFingerprint": None,
                "jaSourceFingerprint": None,
                "missingTokens": None,
                "sectionIndex": None,
                "structureCategory": None,
                "structureFingerprint": None,
            }

            if issue_type in STRUCTURE_MISMATCH_TYPES:
                section_index = issue.get("sectionIndex")
                if (
                    not isinstance(section_index, int)
                    or isinstance(section_index, bool)
                    or section_index < 0
                    or not isinstance(issue.get("sectionPath"), str)
                    or issue.get("structureCategory") not in STRUCTURE_CATEGORIES
                    or not isinstance(issue.get("enKinds"), list)
                    or not isinstance(issue.get("jaKinds"), list)
                ):
                    continue
                entry["sectionIndex"] = section_index
                entry["sectionPath"] = issue["sectionPath"]
                entry["structureCategory"] = issue["structureCategory"]
                entry["structureFingerprint"] = compute_structure_fingerprint(
                    structureCategory=issue["structureCategory"],
                    enKinds=issue["enKinds"],
                    jaKinds=issue["jaKinds"],
                    contentPermutation=issue.get("contentPermutation"),
                )
                entries.append(entry)
                continue

            if issue_type in ("segment-extra", "segment-untranslated"):
                ja_idx = issue.get("jaSegmentIndex")
                if not isinstance(ja_idx, (int, float)) or isinstance(ja_idx, bool):
                    continue
                if not isinstance(issue.get("jaSourceFingerprint"), str):
                    continue
                entry["sectionPath"] = issue.get("sectionPath")
                entry["segmentKind"] = issue.get("segmentKind")
                entry["jaSegmentIndex"] = ja_idx
                entry["jaSourceFingerprint"] = issue["jaSourceFingerprint"]
            elif issue_type == "segment-shifted":
                en_idx = issue.get("enSegmentIndex")
                if not isinstance(en_idx, (int, float)) or isinstance(en_idx, bool):
                    continue
                if not isinstance(issue.get("enSourceFingerprint"), str):
                    continue
                if not isinstance(issue.get("jaSourceFingerprint"), str):
                    continue
                entry["sectionPath"] = issue.get("sectionPath")
                entry["segmentKind"] = issue.get("segmentKind")
                entry["enSegmentIndex"] = en_idx
                entry["enSourceFingerprint"] = issue["enSourceFingerprint"]
                entry["jaSourceFingerprint"] = issue["jaSourceFingerprint"]
            elif issue_type == "segment-token-gap":
                en_idx = issue.get("enSegmentIndex")
                if not isinstance(en_idx, (int, float)) or isinstance(en_idx, bool):
                    continue
                if not isinstance(issue.get("enSourceFingerprint"), str):
                    continue
                missing_tokens = issue.get("missingTokens")
                if not isinstance(missing_tokens, list) or len(missing_tokens) == 0:
                    continue
                entry["sectionPath"] = issue.get("sectionPath")
                entry["segmentKind"] = issue.get("segmentKind")
                entry["enSegmentIndex"] = en_idx
                entry["enSourceFingerprint"] = issue["enSourceFingerprint"]
                entry["missingTokens"] = sorted(set(missing_tokens))
            else:
                # EN-owned (segment-missing)
                en_idx = issue.get("enSegmentIndex")
                if not isinstance(en_idx, (int, float)) or isinstance(en_idx, bool):
                    continue
                if not isinstance(issue.get("enSourceFingerprint"), str):
                    continue
                entry["sectionPath"] = issue.get("sectionPath")
                entry["segmentKind"] = issue.get("segmentKind")
                entry["enSegmentIndex"] = en_idx
                entry["enSourceFingerprint"] = issue["enSourceFingerprint"]

            entries.append(entry)

    return {
        "schemaVersion": 2,
        "generatedAt": meta["generatedAt"],
        "generatedFromRunId": meta["runId"],
        "rationale": meta["rationale"],
        "entries": entries,
    }


def build_generation_meta(status: dict[str, Any], args: dict[str, Any]) -> dict[str, str]:
    """generation metadata を決める (mjs 等価)。"""
    checked_at = _get_checked_at(status)
    if args.get("regenerate"):
        default_rationale = "frozen baseline — regenerated (schema v2)"
    elif args.get("types"):
        default_rationale = (
            f"frozen baseline — partial regeneration by type: {', '.join(args['types'])}"
        )
    elif args.get("slugs"):
        default_rationale = f"frozen baseline — partial regeneration for {', '.join(args['slugs'])}"
    else:
        default_rationale = "frozen baseline"
    rationale_override = args.get("rationale")
    return {
        "runId": f"{checked_at}#parity-check-status",
        "generatedAt": checked_at,
        "rationale": rationale_override if rationale_override is not None else default_rationale,
    }


def _sort_key(entry: dict[str, Any]) -> tuple[Any, ...]:
    """mjs ``sortEntries`` と同等の multi-field key。"""
    issue_type = entry.get("issueType", "")
    slug = entry.get("slug", "")

    if issue_type in STRUCTURE_MISMATCH_TYPES:
        section_index = entry.get("sectionIndex")
        section_index_key = section_index if isinstance(section_index, int) else -1
        return (
            slug,
            issue_type,
            0,  # structure group marker
            section_index_key,
            entry.get("structureCategory") or "",
            entry.get("structureFingerprint") or "",
        )

    section_path = entry.get("sectionPath") or ""
    segment_kind = entry.get("segmentKind") or ""

    if issue_type in ("segment-extra", "segment-untranslated"):
        ja_idx = entry.get("jaSegmentIndex")
        ja_idx_key = ja_idx if isinstance(ja_idx, (int, float)) else -1
        return (
            slug,
            issue_type,
            1,
            section_path,
            segment_kind,
            ja_idx_key,
            entry.get("jaSourceFingerprint") or "",
        )
    if issue_type == "segment-token-gap":
        en_idx = entry.get("enSegmentIndex")
        en_idx_key = en_idx if isinstance(en_idx, (int, float)) else -1
        tokens = entry.get("missingTokens") or []
        tokens_key = ",".join(tokens) if isinstance(tokens, list) else ""
        return (
            slug,
            issue_type,
            1,
            section_path,
            segment_kind,
            en_idx_key,
            entry.get("enSourceFingerprint") or "",
            tokens_key,
        )
    if issue_type == "segment-shifted":
        en_idx = entry.get("enSegmentIndex")
        en_idx_key = en_idx if isinstance(en_idx, (int, float)) else -1
        return (
            slug,
            issue_type,
            1,
            section_path,
            segment_kind,
            en_idx_key,
            entry.get("enSourceFingerprint") or "",
            entry.get("jaSourceFingerprint") or "",
        )
    en_idx = entry.get("enSegmentIndex")
    en_idx_key = en_idx if isinstance(en_idx, (int, float)) else -1
    return (
        slug,
        issue_type,
        1,
        section_path,
        segment_kind,
        en_idx_key,
        entry.get("enSourceFingerprint") or "",
    )


def serialize_baseline(baseline: dict[str, Any]) -> str:
    """baseline dict を stable 2-space JSON + LF に serialize する (mjs 等価)。"""
    sorted_payload = {
        "schemaVersion": baseline["schemaVersion"],
        "generatedAt": baseline["generatedAt"],
        "generatedFromRunId": baseline["generatedFromRunId"],
        "rationale": baseline["rationale"],
        "entries": sorted(baseline.get("entries") or [], key=_sort_key),
    }
    return json.dumps(sorted_payload, ensure_ascii=False, indent=2) + "\n"


def merge_partial_baseline(
    existing: dict[str, Any],
    slugs_to_replace: list[str],
    new_entries: list[dict[str, Any]],
    meta: dict[str, str],
) -> dict[str, Any]:
    """指定 slug の entries を削除して new_entries でマージ (mjs 等価)。"""
    slug_set = set(slugs_to_replace)
    preserved = [e for e in existing.get("entries") or [] if e.get("slug") not in slug_set]
    return {
        "schemaVersion": 2,
        "generatedAt": meta["generatedAt"],
        "generatedFromRunId": meta["generatedFromRunId"],
        "rationale": meta["rationale"],
        "entries": preserved + new_entries,
    }


def merge_partial_baseline_by_type(
    existing: dict[str, Any],
    types_to_replace: list[str],
    new_entries: list[dict[str, Any]],
    meta: dict[str, str],
) -> dict[str, Any]:
    """``--types=<csv>`` 用の merger (mjs 等価)。"""
    type_set = set(types_to_replace)
    preserved = [e for e in existing.get("entries") or [] if e.get("issueType") not in type_set]
    filtered_new = [e for e in new_entries if e.get("issueType") in type_set]
    return {
        "schemaVersion": 2,
        "generatedAt": meta["generatedAt"],
        "generatedFromRunId": meta["generatedFromRunId"],
        "rationale": meta["rationale"],
        "entries": preserved + filtered_new,
    }


def _parse_cli_args(argv: list[str]) -> dict[str, Any]:
    """mjs ``parseArgs`` 等価 (手書き `--xxx=yyy` parser)。"""
    result: dict[str, Any] = {
        "regenerate": False,
        "slugs": None,
        "types": None,
        "rationale": None,
    }
    for arg in argv:
        if arg == "--regenerate":
            result["regenerate"] = True
        elif arg.startswith("--slug="):
            csv = arg[len("--slug=") :]
            result["slugs"] = [s for s in csv.split(",") if s]
        elif arg.startswith("--types="):
            csv = arg[len("--types=") :]
            result["types"] = [s for s in csv.split(",") if s]
        elif arg.startswith("--rationale="):
            result["rationale"] = arg[len("--rationale=") :]
    return result


def _print_usage() -> None:
    print("Usage:", file=sys.stderr)
    print(
        "  python -m testim_parity.detection.generate_parity_baseline "
        '--regenerate [--rationale="..."]',
        file=sys.stderr,
    )
    print(
        "  python -m testim_parity.detection.generate_parity_baseline "
        '--slug=overview/foo,overview/bar [--rationale="..."]',
        file=sys.stderr,
    )
    print(
        "  python -m testim_parity.detection.generate_parity_baseline "
        '--types=section-structure-mismatch,segment-order-mismatch [--rationale="..."]',
        file=sys.stderr,
    )
    print("", file=sys.stderr)
    print(
        "  --types is mutually exclusive with --regenerate and --slug. "
        "It re-generates only entries",
        file=sys.stderr,
    )
    print(
        "  for the specified issue types, leaving other entries untouched.",
        file=sys.stderr,
    )


def _run_main(args: dict[str, Any]) -> int:
    """``main`` の本体。戻り値は exit code。

    ここで発生する ValueError / OSError / json.JSONDecodeError は呼び出し元
    ``main`` の top-level ``except`` で一括 catch して mjs の
    ``.catch(err => { console.error('❌ generate_parity_baseline error:', err);
    process.exit(1); })`` と等価に扱う。
    """
    if not _STATUS_PATH.exists():
        print(
            f"❌ {_STATUS_PATH} not found. Run `npm run check:parity` first.",
            file=sys.stderr,
        )
        return 1
    status = json.loads(_STATUS_PATH.read_text(encoding="utf-8"))
    try:
        assert_full_parity_status(status)
    except ValueError as err:
        print(f"❌ {err}", file=sys.stderr)
        return 1

    if args["regenerate"]:
        try:
            # module-level ``_SNAPSHOT_DIFF_PATH`` は test で monkeypatch 差し替え
            # されうるので、関数 default に頼らず明示的に渡す (default は import
            # 時 bind で現在の値を捕まえてしまい、monkeypatch を見ない)。
            snapshot_diff = load_snapshot_diff_status(_SNAPSHOT_DIFF_PATH)
            assert_pre_regen_gate(status, snapshot_diff)
        except ValueError as err:
            print(f"❌ {err}", file=sys.stderr)
            return 1
        print("baseline-regen-gate: pass")

    # ``_SNAPSHOTS_DIR`` も同じ理由で明示的に渡す。
    fingerprint_map = build_fingerprint_map(_SNAPSHOTS_DIR)
    meta = build_generation_meta(status, args)

    if args["regenerate"]:
        output = build_baseline_from_status(status, fingerprint_map, meta)
    elif args["types"]:
        new_baseline = build_baseline_from_status(status, fingerprint_map, meta)
        existing: dict[str, Any] = {
            "schemaVersion": 2,
            "generatedAt": meta["generatedAt"],
            "generatedFromRunId": "",
            "rationale": "",
            "entries": [],
        }
        if _BASELINE_PATH.exists():
            existing = load_baseline_file(_BASELINE_PATH)
        output = merge_partial_baseline_by_type(
            existing,
            args["types"],
            new_baseline["entries"],
            {
                "generatedAt": meta["generatedAt"],
                "generatedFromRunId": meta["runId"],
                "rationale": meta["rationale"],
            },
        )
    else:
        filtered_status = {
            **status,
            "files": [
                f
                for f in (status.get("files") or [])
                if _file_entry_to_slug(f.get("file", "")) in set(args["slugs"])
            ],
        }
        new_baseline = build_baseline_from_status(filtered_status, fingerprint_map, meta)
        existing = {
            "schemaVersion": 2,
            "generatedAt": meta["generatedAt"],
            "generatedFromRunId": "",
            "rationale": "",
            "entries": [],
        }
        if _BASELINE_PATH.exists():
            existing = load_baseline_file(_BASELINE_PATH)
        output = merge_partial_baseline(
            existing,
            args["slugs"],
            new_baseline["entries"],
            {
                "generatedAt": meta["generatedAt"],
                "generatedFromRunId": meta["runId"],
                "rationale": meta["rationale"],
            },
        )

    validate_baseline(output)
    serialized = serialize_baseline(output)
    _BASELINE_PATH.write_text(serialized, encoding="utf-8")
    try:
        rel = _BASELINE_PATH.relative_to(ROOT_DIR)
    except ValueError:
        rel = _BASELINE_PATH
    print(f"✅ Wrote {len(output.get('entries') or [])} baseline entries to {rel}")
    return 0


def main(argv: list[str] | None = None) -> int:
    """CLI エントリポイント (mjs ``main`` + top-level ``.catch`` 等価)。"""
    if argv is None:
        argv = sys.argv[1:]

    obsolete = next((a for a in argv if a.startswith("--review-after")), None)
    if obsolete:
        print(
            f"❌ --review-after is removed in schema v2 ({obsolete}). "
            "Drop the flag — baseline entries no longer carry a reviewAfter field.",
            file=sys.stderr,
        )
        return 1

    args = _parse_cli_args(argv)

    # argparse は CLI `--slug` / `--types` を使わないが、help で確認できるよう下絵。
    parser = argparse.ArgumentParser(add_help=True)
    parser.add_argument("--regenerate", action="store_true")
    parser.add_argument("--slug")
    parser.add_argument("--types")
    parser.add_argument("--rationale")
    parser.parse_known_args(argv)

    if not args["regenerate"] and not args["slugs"] and not args["types"]:
        _print_usage()
        return 1

    mode_count = (
        (1 if args["regenerate"] else 0) + (1 if args["slugs"] else 0) + (1 if args["types"] else 0)
    )
    if mode_count > 1:
        print("❌ --regenerate / --slug / --types are mutually exclusive", file=sys.stderr)
        _print_usage()
        return 1

    validation = validate_types_arg(args["types"])
    if not validation.get("ok"):
        print(f"❌ {validation.get('error')}", file=sys.stderr)
        _print_usage()
        return 1

    # mjs の ``main().catch(err => { console.error(...); process.exit(1); })``
    # と等価。``_run_main`` で未 catch の JSON 破損 / schema 違反 / OSError を
    # traceback で escape させず clean な exit 1 に変換する。schema / gate の
    # 既知 ValueError は ``_run_main`` 内で個別 catch 済なので、ここは
    # unexpected failure を `❌ generate_parity_baseline error:` prefix 付きで
    # 表示する保険。
    try:
        return _run_main(args)
    except (ValueError, OSError, json.JSONDecodeError) as err:
        print(f"❌ generate_parity_baseline error: {err}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
