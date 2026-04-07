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

export function generateDetectionReports() {
  const { snapshot, parity, sourceSync } = loadDetectionInputs();
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

function main() {
  const { actionableReport } = generateDetectionReports();
  console.log('📄 Detection summary generated');
  console.log(
    `  snapshot diff actionable: ${actionableReport.snapshotDiff.summary.actionableCount}`,
  );
  console.log(
    `  active parity issues: ${actionableReport.parityRegression.summary.issueCount}`,
  );
  const followup = actionableReport.parityFollowup;
  console.log(
    `  parity followup: expired=${followup.summary.baselineDebt.expiredBaselineEntries} invalidated=${followup.summary.baselineDebt.baselineInvalidatedSlugCount} advisory-blocking=${followup.summary.advisoryQueue.blockingItems}`,
  );
}

const isDirectRun = isDirectCliRun(import.meta.url);

if (isDirectRun) {
  main();
}
