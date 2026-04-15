#!/usr/bin/env node
// scripts/phase4/render_residual_inventory.mjs
// 入力: Task 4.1 で固定化した residual-inventory JSON (CLI arg 1)
// 出力: stdout に Japanese markdown
//
// 出力構成:
//   1. 概要 (合計 / byIssueType)
//   2. 5 bucket 別 entry 表 (先頭 N 件 + 総数)
//   3. summary counters
//   4. snapshotDiff

import { readFileSync } from 'node:fs';

const HEAD_ROWS = 50; // 各 bucket の先頭表示件数

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(formatToken).join(' \\| ');
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function formatToken(t) {
  if (t === null || t === undefined) return '';
  return String(t).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function renderBucketTable(name, entries) {
  const out = [];
  out.push(`### ${name} (${entries.length} 件)`);
  out.push('');
  if (entries.length === 0) {
    out.push('_該当なし_');
    out.push('');
    return out.join('\n');
  }
  const displayed = entries.slice(0, HEAD_ROWS);
  out.push('| slug | issueType | sectionPath | segmentKind | missingTokens | inconclusiveCategory | inconclusiveReason |');
  out.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const e of displayed) {
    out.push(
      `| ${escapeCell(e.slug)} | ${escapeCell(e.issueType)} | ${escapeCell(e.sectionPath)} | ${escapeCell(e.segmentKind)} | ${escapeCell(e.missingTokens)} | ${escapeCell(e.inconclusiveCategory)} | ${escapeCell(e.inconclusiveReason)} |`
    );
  }
  out.push('');
  if (entries.length > displayed.length) {
    out.push(`先頭 ${displayed.length} 件のみ表示。全 ${entries.length} 件は JSON を参照。`);
    out.push('');
  }
  return out.join('\n');
}

function renderByIssueType(byIssueType) {
  const keys = Object.keys(byIssueType).sort();
  const out = [];
  out.push('| issueType | count |');
  out.push('| --- | --- |');
  for (const k of keys) out.push(`| ${k} | ${byIssueType[k]} |`);
  return out.join('\n');
}

function renderSummary(summary) {
  const rows = [
    ['reportableActiveFiles', summary.reportableActiveFiles],
    ['baselinedIssues',       summary.baselinedIssues],
    ['advisoryQueueIssues',   summary.advisoryQueueIssues],
    ['auditSignalIssues',     summary.auditSignalIssues],
  ];
  const out = [];
  out.push('| counter | value |');
  out.push('| --- | --- |');
  for (const [k, v] of rows) out.push(`| ${k} | ${v === null || v === undefined ? 'n/a' : v} |`);
  return out.join('\n');
}

function renderSnapshotDiff(snap) {
  const rows = [
    ['changed', snap.changed],
    ['added',   snap.added],
    ['removed', snap.removed],
  ];
  const out = [];
  out.push('| metric | value |');
  out.push('| --- | --- |');
  for (const [k, v] of rows) out.push(`| ${k} | ${v === null || v === undefined ? 'n/a' : v} |`);
  return out.join('\n');
}

function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error('usage: render_residual_inventory.mjs <inventory.json>');
    process.exit(1);
  }
  const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const bucketOrder = [
    'actionable',
    'artifactCandidates',
    'normalizerCandidates',
    'intentionalDivergenceCandidates',
    'advisoryResidual',
  ];

  const out = [];
  out.push('# Parity Phase 4 Residual Inventory (5-bucket)');
  out.push('');
  out.push('Task 4.1 で `parity-baseline.json` を 5 bucket に分離した実測結果。');
  out.push('Task 4.2 (artifact registry) / Task 4.3 (URL normalizer) / Task 4.4 (HTML extractor allow list) / Task 4.5 (翻訳修正) への入力分配に用いる。');
  out.push('');
  out.push('本ファイルは機械生成 (`scripts/phase4/render_residual_inventory.mjs`)。末尾の「分配方針」節のみ手動追記。');
  out.push('');

  out.push('## 1. 概要');
  out.push('');
  out.push(`- baseline entries 合計: **${data.baseline.total}**`);
  out.push('');
  out.push('### issueType 別件数');
  out.push('');
  out.push(renderByIssueType(data.baseline.byIssueType));
  out.push('');

  out.push('### bucket 別件数');
  out.push('');
  out.push('| bucket | count |');
  out.push('| --- | --- |');
  for (const name of bucketOrder) {
    out.push(`| ${name} | ${data.buckets[name].length} |`);
  }
  out.push('');

  out.push('## 2. bucket 別 entry 一覧');
  out.push('');
  for (const name of bucketOrder) {
    out.push(renderBucketTable(name, data.buckets[name]));
  }

  out.push('## 3. summary counters');
  out.push('');
  out.push('`parity-check-status.json` から転記 (未生成の場合 `n/a`)。');
  out.push('');
  out.push(renderSummary(data.summary));
  out.push('');

  out.push('## 4. snapshotDiff');
  out.push('');
  out.push('`snapshot-diff-status.json` から転記 (未生成の場合 `n/a`)。');
  out.push('');
  out.push(renderSnapshotDiff(data.snapshotDiff));
  out.push('');

  process.stdout.write(out.join('\n'));
}
main();
