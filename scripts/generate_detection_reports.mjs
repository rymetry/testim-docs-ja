#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import {
  ROOT_DIR,
} from './lib/project.mjs';
import {
  buildActionableReport,
  buildAuditManifest,
  loadDetectionInputs,
  renderSummaryMarkdown,
} from './lib/detection_reports.mjs';
import { isDirectRun as isDirectCliRun } from './lib/cli.mjs';

const OUTPUTS = {
  actionableReport: path.join(ROOT_DIR, 'docs-actionable-report.json'),
  summaryMarkdown: path.join(ROOT_DIR, 'docs-update-summary.md'),
  auditManifest: path.join(ROOT_DIR, 'docs-audit-manifest.json'),
};

export function generateDetectionReports({ strict = false } = {}) {
  const { snapshot, parity, sourceSync } = loadDetectionInputs({ strict });
  const auditManifest = buildAuditManifest(snapshot, parity);
  const actionableReport = buildActionableReport(snapshot, parity, auditManifest, { sourceSync });
  const summaryMarkdown = renderSummaryMarkdown(
    snapshot,
    parity,
    actionableReport,
    auditManifest,
    sourceSync,
  );

  fs.writeFileSync(
    OUTPUTS.actionableReport,
    JSON.stringify(actionableReport, null, 2),
  );
  fs.writeFileSync(OUTPUTS.summaryMarkdown, `${summaryMarkdown}\n`);
  fs.writeFileSync(OUTPUTS.auditManifest, JSON.stringify(auditManifest, null, 2));

  return {
    outputs: OUTPUTS,
    actionableReport,
  };
}

function parseArgs(argv = process.argv.slice(2)) {
  return {
    strict: argv.includes('--strict'),
  };
}

function main() {
  const args = parseArgs();
  try {
    const { actionableReport } = generateDetectionReports({ strict: args.strict });
    console.log('📄 検知サマリー生成完了');
    console.log(
      `  スナップショット差分の要対応: ${actionableReport.snapshotDiff.summary.actionableCount}`,
    );
    console.log(
      `  パリティ問題 (未解消): ${actionableReport.parityRegression.summary.issueCount}`,
    );
    console.log(`  パリティ結果: ${actionableReport.result ?? '不明'}`);
    const followup = actionableReport.parityFollowup;
    console.log(
      `  パリティフォローアップ: 期限切れ=${followup.summary.baselineDebt.expiredBaselineEntries} 30日以内期限切れ=${followup.summary.baselineDebt.expiringBaselineEntries30d ?? 0} 無効化=${followup.summary.baselineDebt.baselineInvalidatedSlugCount} ブロッキング=${followup.summary.advisoryQueue.blockingItems}`,
    );
    // source-side debt の件数も CLI 出力に含める
    const debt = actionableReport.sourceSyncHealth?.sourceSideDebt;
    if (debt && debt.excludedPages > 0) {
      console.log(
        `  ソース原文の既知問題: 除外=${debt.excludedPages} 未復旧=${debt.excludedBrokenPages} 復旧候補=${debt.excludedRecoveredPages}`,
      );
    }
  } catch (error) {
    console.error(`❌ ${error.message}`);
    if (error.validationErrors) {
      for (const v of error.validationErrors) console.error(`   - ${v}`);
    }
    process.exit(1);
  }
}

const isDirectRun = isDirectCliRun(import.meta.url);

if (isDirectRun) {
  main();
}
