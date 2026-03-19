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
import {
  compareIsoDates,
  fetchSourcePageInfo,
  toIsoDate,
} from './lib/source_pages.mjs';
import {
  getDateException,
  loadDateExceptions,
} from './lib/date_exceptions.mjs';
import { isDirectRun as isDirectCliRun } from './lib/cli.mjs';

const OUTPUT_PATH = path.join(ROOT_DIR, 'docs-dates-snapshot.json');

export function parseArgs(argv = process.argv.slice(2)) {
  const sectionArg = argv.find((arg) => arg.startsWith('--section='));
  return {
    section: sectionArg ? sectionArg.split('=').slice(1).join('=') : null,
  };
}

export async function fetchAllUpdatedDates({
  section = null,
  fetchImpl = fetch,
  now = new Date(),
} = {}) {
  console.log('📋 英語原文の更新日を一括取得\n');

  const exceptions = loadDateExceptions();
  const allFiles = findMdFiles(DOCS_DIR);
  const files = allFiles.filter((filePath) => {
    const doc = readDocFile(filePath);
    return (
      doc.data.sourceUrl &&
      matchesSectionFilter(doc.relativePath, doc.data, section)
    );
  });

  console.log(`📄 ${files.length}個のファイルを処理中...\n`);

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (const filePath of files) {
    const doc = readDocFile(filePath);
    process.stdout.write(`🔍 ${path.basename(filePath)}...`);

    const exception = getDateException(exceptions, doc.relativePath);
    const source = await fetchSourcePageInfo(doc.data.sourceUrl, {
      fetchImpl,
      now,
      exception,
    });
    const localDate = toIsoDate(doc.data.updated);

    if (source.fetchError || !source.resolvedSourceDate) {
      errorCount += 1;
      console.log(' ❌ 取得失敗');
      results.push({
        file: doc.relativePath,
        fileName: path.basename(filePath),
        sourceUrl: doc.data.sourceUrl,
        currentJapaneseDate: localDate ?? 'なし',
        fetchedEnglishDate: null,
        needsUpdate: false,
        status: source.fetchError ? 'fetch-error' : 'missing-source-date',
        sourceDateKind: source.sourceDateKind,
        metadataUpdatedAt: source.metadataUpdatedAt,
        displayRelativeDate: source.displayRelativeDate,
        exceptionApplied: source.exceptionApplied,
      });
      continue;
    }

    successCount += 1;
    const compare = compareIsoDates(source.resolvedSourceDate, localDate);
    const comparisonStatus =
      compare > 0 ? 'outdated' : compare < 0 ? 'newer' : 'up-to-date';
    const status = source.exceptionApplied
      ? 'ignored-exception'
      : source.sourceDateDivergence
        ? 'source-date-divergence'
        : comparisonStatus;
    const needsUpdate = compare > 0 && !source.exceptionApplied;
    const icon = needsUpdate ? '🔄' : status === 'ignored-exception' ? '⏭️' : '✅';

    console.log(` ${icon} ${source.resolvedSourceDate}`);
    results.push({
      file: doc.relativePath,
      fileName: path.basename(filePath),
      sourceUrl: doc.data.sourceUrl,
      currentJapaneseDate: localDate ?? 'なし',
      fetchedEnglishDate: source.resolvedSourceDate,
      needsUpdate,
      status,
      comparisonStatus,
      sourceDateKind: source.sourceDateKind,
      metadataUpdatedAt: source.metadataUpdatedAt,
      displayRelativeDate: source.displayRelativeDate,
      exceptionApplied: source.exceptionApplied,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`\n\n${'='.repeat(100)}\n📊 取得結果一覧\n`);
  console.log('状態 | ファイル名 | 日本語版 | 英語版');
  console.log('-----|-----------|---------|--------');
  for (const item of results) {
    const status =
      item.status === 'outdated'
        ? '🔄 要更新'
        : item.status === 'ignored-exception'
          ? '⏭️ 例外'
          : item.status === 'fetch-error' || item.status === 'missing-source-date'
            ? '❌ エラー'
            : item.comparisonStatus === 'newer'
              ? '⚠️ JA新'
              : '✅ 最新';
    console.log(
      `${status} | ${item.fileName} | ${item.currentJapaneseDate} | ${
        item.fetchedEnglishDate || 'N/A'
      }`,
    );
  }

  const payload = {
    fetchedAt: new Date().toISOString(),
    summary: {
      total: files.length,
      success: successCount,
      error: errorCount,
      needsUpdate: results.filter((item) => item.needsUpdate).length,
      newer: results.filter((item) => item.comparisonStatus === 'newer').length,
      ignoredExceptions: results.filter((item) => item.status === 'ignored-exception')
        .length,
    },
    files: results,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));
  console.log(`\n💾 結果を ${path.relative(ROOT_DIR, OUTPUT_PATH)} に保存しました\n`);
}

async function main() {
  await fetchAllUpdatedDates(parseArgs());
}

const isDirectRun = isDirectCliRun(import.meta.url);

if (isDirectRun) {
  main().catch((error) => {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  });
}
