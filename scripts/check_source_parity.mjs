#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import {
  DOCS_DIR,
  ROOT_DIR,
  SIDEBAR_PATH,
  findMdFiles,
  matchesSectionFilter,
  readDocFile,
} from './lib/project.mjs';
import {
  loadSidebarSlugs,
  localCheck,
  summarizeParityResults,
} from './lib/source_parity.mjs';
import { isDirectRun as isDirectCliRun } from './lib/cli.mjs';

const OUTPUT_PATH = path.join(ROOT_DIR, 'parity-check-status.json');

export function parseArgs(argv = process.argv.slice(2)) {
  const sectionArg = argv.find((arg) => arg.startsWith('--section='));
  return {
    json: argv.includes('--json'),
    section: sectionArg ? sectionArg.split('=').slice(1).join('=') : null,
  };
}

export async function checkSourceParity({
  json = false,
  section = null,
} = {}) {
  const sidebarText = fs.existsSync(SIDEBAR_PATH)
    ? fs.readFileSync(SIDEBAR_PATH, 'utf8')
    : '';
  const sidebarSlugs = loadSidebarSlugs(sidebarText);
  const allFiles = findMdFiles(DOCS_DIR);

  if (!json) {
    console.log('🔍 Source parity チェック開始\n');
    console.log(`📄 ${allFiles.length} ファイル対象`);
    if (section) console.log(`📂 セクション絞り込み: ${section}`);
    console.log('');
  }

  const results = [];
  let checkedCount = 0;

  for (const filePath of allFiles) {
    const doc = readDocFile(filePath);
    if (!matchesSectionFilter(doc.relativePath, doc.data, section)) {
      continue;
    }

    checkedCount += 1;
    const slug = path.basename(filePath, '.md');
    const issues = [
      ...localCheck({ body: doc.body, sidebarSlugs, slug }),
    ];

    if (issues.length === 0) {
      continue;
    }

    results.push({
      file: doc.relativePath,
      sourceUrl: doc.data.sourceUrl || '',
      category: doc.data.category || '',
      issues,
    });

    if (!json) {
      console.log(`❌ ${doc.relativePath}`);
      for (const issue of issues) {
        const location = issue.line ? `:${issue.line}` : '';
        const detail = issue.detail || issue.text || '';
        console.log(`   [${issue.type}/${issue.severity}]${location} ${detail}`);
      }
      console.log('');
    }
  }

  const summary = {
    checkedAt: new Date().toISOString(),
    mode: 'local',
    totalFiles: allFiles.length,
    checkedFiles: checkedCount,
    ...summarizeParityResults(results),
  };

  const payload = {
    summary,
    files: results,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));

  if (!json) {
    console.log(`${'='.repeat(60)}\n📊 チェック結果サマリー\n`);
    console.log(`チェック済み: ${checkedCount} / ${allFiles.length} ファイル`);
    console.log(`問題あり: ${summary.filesWithIssues} ファイル`);
    console.log(`actionable: ${summary.actionableFiles} ファイル`);
    console.log(`signal-only: ${summary.signalFiles} ファイル`);
    console.log(`errors: ${summary.errorFiles} ファイル\n`);
    console.log('問題種別:');
    for (const [type, count] of Object.entries(summary.issuesByType)) {
      console.log(`  ${type}: ${count} 件`);
    }
    console.log(`\n💾 詳細結果を ${path.relative(ROOT_DIR, OUTPUT_PATH)} に保存しました`);
  }

  return summary.filesWithIssues > 0 ? 1 : 0;
}

async function main() {
  const code = await checkSourceParity(parseArgs());
  process.exit(code);
}

const isDirectRun = isDirectCliRun(import.meta.url);

if (isDirectRun) {
  main().catch((error) => {
    console.error('❌ エラー:', error);
    process.exit(1);
  });
}
