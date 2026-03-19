#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import {
  DOCS_DIR,
  ROOT_DIR,
  findMdFiles,
  matchesSectionFilter,
  readDocFile,
} from './lib/project.mjs';
import { fetchSourcePageInfo, toIsoDate } from './lib/source_pages.mjs';
import {
  getDateException,
  loadDateExceptions,
} from './lib/date_exceptions.mjs';
import { isDirectRun as isDirectCliRun } from './lib/cli.mjs';

export function parseArgs(argv = process.argv.slice(2)) {
  const patternIndex = argv.indexOf('--pattern');
  const sectionArg = argv.find((arg) => arg.startsWith('--section='));

  return {
    apply: argv.includes('--apply'),
    pattern:
      patternIndex >= 0 && argv[patternIndex + 1] ? argv[patternIndex + 1] : null,
    section: sectionArg ? sectionArg.split('=').slice(1).join('=') : null,
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

export function updateFrontmatterDate(content, nextDate) {
  const updatedRegex = /^updated:\s*.*$/m;
  const newUpdatedLine = `updated: '${nextDate}'`;

  if (updatedRegex.test(content)) {
    return content.replace(updatedRegex, newUpdatedLine);
  }

  const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---/);
  if (!frontmatterMatch) {
    return content;
  }

  return content.replace(
    frontmatterMatch[0],
    frontmatterMatch[0].replace(/\n---$/, `\n${newUpdatedLine}\n---`),
  );
}

export async function updateDatesFromEnglish({
  apply = false,
  pattern = null,
  section = null,
  fetchImpl = fetch,
  now = new Date(),
} = {}) {
  console.log('📋 英語原文の更新日で日本語ファイルを更新\n');
  if (!apply) {
    console.log('🔍 ドライランモード: ファイルは変更されません\n');
  }

  const exceptions = loadDateExceptions();
  const filesToUpdate = findMdFiles(DOCS_DIR).filter((filePath) => {
    const doc = readDocFile(filePath);
    if (!doc.data.sourceUrl) return false;
    if (pattern && !filePath.includes(pattern)) return false;
    return matchesSectionFilter(doc.relativePath, doc.data, section);
  });

  console.log(`📄 ${filesToUpdate.length}個のファイルを処理中...\n`);

  let updatedCount = 0;
  let noChangeCount = 0;
  let errorCount = 0;
  let ignoredCount = 0;

  for (const filePath of filesToUpdate) {
    const doc = readDocFile(filePath);
    const localDate = toIsoDate(doc.data.updated);
    const exception = getDateException(exceptions, doc.relativePath);

    console.log(`🔍 ${doc.relativePath}`);
    const source = await fetchSourcePageInfo(doc.data.sourceUrl, {
      fetchImpl,
      now,
      exception,
    });

    if (source.fetchError || !source.resolvedSourceDate) {
      console.log('  ❌ 英語版の更新日を取得できませんでした\n');
      errorCount += 1;
      continue;
    }

    if (source.exceptionApplied) {
      console.log(
        `  ⏭️  例外適用のため更新しません: ${source.resolvedSourceDate}\n`,
      );
      ignoredCount += 1;
      continue;
    }

    if (localDate === source.resolvedSourceDate) {
      console.log(`  ✅ 既に最新です: ${source.resolvedSourceDate}\n`);
      noChangeCount += 1;
      continue;
    }

    console.log(`  🔄 更新: ${localDate || 'なし'} → ${source.resolvedSourceDate}`);
    if (source.sourceDateDivergence) {
      console.log(
        `  ⚠️  metadata=${source.metadataUpdatedAt} / display=${source.displayRelativeDate}`,
      );
    }

    if (apply) {
      const nextContent = updateFrontmatterDate(doc.content, source.resolvedSourceDate);
      fs.writeFileSync(filePath, nextContent, 'utf8');
      console.log('  ✅ ファイルを更新しました\n');
    } else {
      console.log('  💡 [ドライラン] ファイルは更新されません\n');
    }

    updatedCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`\n${'='.repeat(80)}\n📊 更新結果サマリー\n`);
  console.log(`✅ 更新完了: ${updatedCount}件`);
  console.log(`⏭️  変更なし: ${noChangeCount}件`);
  console.log(`⏭️  例外適用: ${ignoredCount}件`);
  console.log(`⚠️  エラー: ${errorCount}件`);
  console.log(`📝 処理対象: ${filesToUpdate.length}件\n`);

  if (!apply && updatedCount > 0) {
    console.log('💡 実際に更新するには --apply オプションを付けて実行してください\n');
  }
}

function printHelp() {
  console.log(`
使用方法:
  node scripts/update_dates_from_english.mjs [オプション]

オプション:
  --apply                   実際にファイルを更新（デフォルトはドライラン）
  --pattern <パターン>      特定のパターンに一致するファイルのみ処理
  --section=<セクション>     セクションまたはパス文字列で絞り込む
  --help, -h                このヘルプを表示
`);
}

async function main() {
  const args = parseArgs();
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  await updateDatesFromEnglish(args);
}

const isDirectRun = isDirectCliRun(import.meta.url);

if (isDirectRun) {
  main().catch((error) => {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  });
}
