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
  const { updates, parity } = loadDetectionInputs();
  const auditManifest = buildAuditManifest(updates, parity);
  const actionableReport = buildActionableReport(updates, parity, auditManifest);
  const summaryMarkdown = renderSummaryMarkdown(
    updates,
    parity,
    actionableReport,
    auditManifest,
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
    `  date drift actionable: ${actionableReport.dateDrift.summary.actionableCount}`,
  );
  console.log(
    `  parity actionable: ${actionableReport.parityRegression.summary.actionableCount}`,
  );
}

const isDirectRun = isDirectCliRun(import.meta.url);

if (isDirectRun) {
  main();
}
