"""``scripts/detection/generate_detection_reports.mjs`` の Python port。

3 つの detection artifact (``snapshot-diff-status.json`` /
``parity-check-status.json`` / ``source-sync-status.json``) + optional な
``upstream-recovery-status.json`` を読み込み、以下 3 つを書き出す:

- ``docs-actionable-report.json`` — 4 issue family の集約結果
- ``docs-update-summary.md`` — 人間可読サマリー
- ``docs-audit-manifest.json`` — snapshot change の audit manifest

``--strict`` flag を付けると ``validate_detection_inputs`` で schema error を
raise する (CI / scheduled run 用途)。
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from ..detection_reports import (
    build_actionable_report,
    build_audit_manifest,
    load_detection_inputs,
    render_summary_markdown,
)
from ..project import ROOT_DIR

__all__ = ["generate_detection_reports", "main"]


def generate_detection_reports(
    *,
    strict: bool = False,
    root_dir: str | Path | None = None,
) -> dict[str, Any]:
    """3 artifact を読み、actionable report + summary + manifest を書き出す。

    mjs ``generateDetectionReports`` と等価。戻り値は ``{"outputs": {...},
    "actionableReport": {...}}``。

    ``root_dir`` 未指定時は ``ROOT_DIR`` を使う。mjs 実装も ``__dirname`` から
    repo root を固定解決しており、``cd scripts/python && uv run python -m ...``
    経由での呼び出しでも必ず repo root の artifact を読み書きする契約。
    """
    root = Path(root_dir) if root_dir is not None else ROOT_DIR
    outputs = {
        "actionableReport": root / "docs-actionable-report.json",
        "summaryMarkdown": root / "docs-update-summary.md",
        "auditManifest": root / "docs-audit-manifest.json",
    }

    inputs = load_detection_inputs(strict=strict, root_dir=root)
    snapshot = inputs["snapshot"]
    parity = inputs["parity"]
    source_sync = inputs["sourceSync"]
    upstream_recovery = inputs["upstreamRecovery"]

    audit_manifest = build_audit_manifest(snapshot, parity)
    actionable_report = build_actionable_report(
        snapshot,
        parity,
        audit_manifest,
        {"sourceSync": source_sync, "upstreamRecovery": upstream_recovery},
    )
    summary_markdown = render_summary_markdown(
        snapshot, parity, actionable_report, audit_manifest, source_sync
    )

    # JSON 2-space indent は mjs ``JSON.stringify(data, null, 2)`` と同じ。
    # non-ASCII (日本語) は生のまま出力する (mjs default と一致)。
    outputs["actionableReport"].write_text(
        json.dumps(actionable_report, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    outputs["summaryMarkdown"].write_text(f"{summary_markdown}\n", encoding="utf-8")
    outputs["auditManifest"].write_text(
        json.dumps(audit_manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    return {
        "outputs": {k: str(v) for k, v in outputs.items()},
        "actionableReport": actionable_report,
    }


def main(argv: list[str] | None = None) -> int:
    """CLI エントリポイント。exit code (成功時 0、schema error 時 1) を返す。"""
    parser = argparse.ArgumentParser(
        description="Generate docs-actionable-report.json + summary md + audit manifest"
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="validate_detection_inputs で schema error を fatal にする",
    )
    args = parser.parse_args(argv)

    try:
        result = generate_detection_reports(strict=args.strict)
    except ValueError as error:
        print(f"❌ {error}", file=sys.stderr)
        validation_errors = getattr(error, "validation_errors", None)
        if validation_errors:
            for v in validation_errors:
                print(f"   - {v}", file=sys.stderr)
        return 1

    report = result["actionableReport"]
    print("📄 検知サマリー生成完了")
    snapshot_diff = report.get("snapshotDiff") or {}
    parity_regression = report.get("parityRegression") or {}
    parity_followup = report.get("parityFollowup") or {}
    source_sync_health = report.get("sourceSyncHealth") or {}
    print(
        f"  スナップショット差分の要対応: "
        f"{(snapshot_diff.get('summary') or {}).get('actionableCount')}"
    )
    print(f"  パリティ問題 (未解消): {(parity_regression.get('summary') or {}).get('issueCount')}")
    print(f"  パリティ結果: {report.get('result') or '不明'}")

    followup_summary = parity_followup.get("summary") or {}
    baseline_debt = followup_summary.get("baselineDebt") or {}
    advisory_queue = followup_summary.get("advisoryQueue") or {}
    print(
        f"  パリティフォローアップ: "
        f"ベースライン={baseline_debt.get('baselinedIssues') or 0} "
        f"無効化={baseline_debt.get('baselineInvalidatedSlugCount') or 0} "
        f"ブロッキング={advisory_queue.get('blockingItems') or 0}"
    )

    debt = source_sync_health.get("sourceSideDebt")
    if debt and debt.get("excludedPages", 0) > 0:
        print(
            f"  ソース原文の既知問題: 除外={debt['excludedPages']} "
            f"未復旧={debt.get('excludedBrokenPages', 0)} "
            f"復旧候補={debt.get('excludedRecoveredPages', 0)}"
        )

    en_rec = source_sync_health.get("enPatchRecovery")
    sync_rec = source_sync_health.get("sourceSyncRecovery")
    if en_rec or sync_rec:
        en = en_rec or {"stalePatches": 0, "overduePatches": 0, "totalPatches": 0}
        sync = sync_rec or {"staleExclusions": 0, "overdueExclusions": 0, "totalExclusions": 0}
        print(
            f"  上流修正候補: "
            f"patches={en['stalePatches']}stale/{en['overduePatches']}overdue/{en['totalPatches']}total "  # noqa: E501
            f"exclusions={sync['staleExclusions']}stale/{sync['overdueExclusions']}overdue/{sync['totalExclusions']}total"  # noqa: E501
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
