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
import { compareIsoDates, diffDays, fetchSourcePageInfo, toIsoDate } from './lib/source_pages.mjs';
import { getDateException, loadDateExceptions } from './lib/date_exceptions.mjs';
import { isDirectRun as isDirectCliRun } from './lib/cli.mjs';

const OUTPUT_PATH = path.join(ROOT_DIR, 'docs-update-status.json');

export function parseArgs(argv = process.argv.slice(2)) {
  const sectionArg = argv.find((arg) => arg.startsWith('--section='));
  return {
    section: sectionArg ? sectionArg.split('=').slice(1).join('=') : null,
  };
}

export function classifyDateStatus({ localDate, source }) {
  const sourceDate = source.comparisonSourceDate ?? source.resolvedSourceDate;

  if (!localDate) {
    return {
      status: 'missing-date',
      comparisonStatus: null,
      needsUpdate: false,
      daysBehind: null,
    };
  }

  if (source.fetchError) {
    return {
      status: 'fetch-error',
      comparisonStatus: null,
      needsUpdate: false,
      daysBehind: null,
    };
  }

  if (!sourceDate) {
    return {
      status: 'missing-source-date',
      comparisonStatus: null,
      needsUpdate: false,
      daysBehind: null,
    };
  }

  const compare = compareIsoDates(sourceDate, localDate);
  const comparisonStatus = compare > 0 ? 'outdated' : compare < 0 ? 'newer' : 'up-to-date';
  const needsUpdate = compare > 0 && !source.exceptionApplied;
  const daysBehind = compare > 0 ? diffDays(sourceDate, localDate) : null;

  if (source.exceptionApplied) {
    return {
      status: 'ignored-exception',
      comparisonStatus,
      needsUpdate,
      daysBehind,
    };
  }

  if (source.sourceDateDivergence) {
    return {
      status: 'source-date-divergence',
      comparisonStatus,
      needsUpdate,
      daysBehind,
    };
  }

  return {
    status: comparisonStatus,
    comparisonStatus,
    needsUpdate,
    daysBehind,
  };
}

export async function checkOutdatedDocs({
  section = null,
  fetchImpl = fetch,
  now = new Date(),
} = {}) {
  console.log('📋 ドキュメント更新状況チェック開始\n');

  const exceptions = loadDateExceptions();
  const allMdFiles = findMdFiles(DOCS_DIR);
  const results = [];
  let processedCount = 0;
  let skippedCount = 0;

  for (const filePath of allMdFiles) {
    const doc = readDocFile(filePath);
    if (!doc.data.sourceUrl) {
      skippedCount += 1;
      continue;
    }
    if (!matchesSectionFilter(doc.relativePath, doc.data, section)) {
      skippedCount += 1;
      continue;
    }

    processedCount += 1;
    console.log(`🔍 ${doc.relativePath}`);

    const localDate = toIsoDate(doc.data.updated);
    const exception = getDateException(exceptions, doc.relativePath);
    const source = await fetchSourcePageInfo(doc.data.sourceUrl, {
      fetchImpl,
      now,
      exception,
    });

    const classified = classifyDateStatus({ localDate, source });

    if (classified.status === 'missing-date') {
      console.log('  ⚠️  日本語版に updated フィールドがありません\n');
    } else if (classified.status === 'fetch-error') {
      console.log(`  ⚠️  英語版の更新日を取得できませんでした (${source.fetchError})\n`);
    } else if (classified.status === 'missing-source-date') {
      console.log('  ⚠️  英語版の更新日を解決できませんでした\n');
    } else {
      if (classified.status === 'ignored-exception') {
        console.log(
          `  ⏭️  例外適用: 日本語 ${localDate} / 原文 ${
            source.comparisonSourceDate ?? source.resolvedSourceDate
          }\n`
        );
      } else if (classified.status === 'source-date-divergence') {
        const verb = classified.needsUpdate ? '更新候補' : '差分レビュー';
        const divergenceKind = source.documentDisplayDivergence
          ? 'document/display'
          : 'metadata/display fallback';
        console.log(
          `  ⚠️  原文日付が乖離しています: document ${
            source.documentUpdatedAt ?? 'なし'
          } / metadata ${source.metadataUpdatedAt ?? 'なし'} / display ${
            source.displayRelativeDate ?? 'なし'
          } / 判定 ${source.comparisonSourceDate ?? '不明'} (${divergenceKind}, ${verb})\n`
        );
      } else if (classified.status === 'outdated') {
        console.log(
          `  ❌ 更新が必要: 日本語 ${localDate} → 英語 ${
            source.comparisonSourceDate ?? source.resolvedSourceDate
          } (${classified.daysBehind}日遅れ)\n`
        );
      } else if (classified.status === 'newer') {
        console.log(
          `  ⚠️  日本語版が新しい: 日本語 ${localDate} > 英語 ${
            source.comparisonSourceDate ?? source.resolvedSourceDate
          }\n`
        );
      } else {
        console.log(`  ✅ 最新: ${localDate}\n`);
      }
    }

    results.push({
      file: doc.relativePath,
      sourceUrl: doc.data.sourceUrl,
      japaneseUpdated: localDate ?? 'なし',
      englishUpdated: source.comparisonSourceDate ?? source.resolvedSourceDate ?? '不明',
      needsUpdate: classified.needsUpdate,
      daysBehind: classified.daysBehind,
      status: classified.status,
      comparisonStatus: classified.comparisonStatus,
      resolvedSourceDate: source.resolvedSourceDate,
      comparisonSourceDate: source.comparisonSourceDate,
      sourceDateKind: source.sourceDateKind,
      comparisonSourceKind: source.comparisonSourceKind,
      documentUpdatedAt: source.documentUpdatedAt,
      metadataUpdatedAt: source.metadataUpdatedAt,
      displayRelativeDate: source.displayRelativeDate,
      metadataDisplayDivergence: source.metadataDisplayDivergence,
      documentDisplayDivergence: source.documentDisplayDivergence,
      exceptionApplied: source.exceptionApplied,
      contentRootExtractable: source.contentRootExtractable,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const statusCounts = {};
  const comparisonStatusCounts = {};
  for (const result of results) {
    statusCounts[result.status] = (statusCounts[result.status] || 0) + 1;
    if (result.comparisonStatus) {
      comparisonStatusCounts[result.comparisonStatus] =
        (comparisonStatusCounts[result.comparisonStatus] || 0) + 1;
    }
  }

  const outdated = results.filter((result) => result.needsUpdate);
  const upToDate = results.filter((result) => result.comparisonStatus === 'up-to-date');
  const newer = results.filter((result) => result.comparisonStatus === 'newer');
  const errors = results.filter((result) =>
    ['fetch-error', 'missing-date', 'missing-source-date'].includes(result.status)
  );

  console.log(`${'='.repeat(80)}\n📊 チェック結果サマリー\n`);
  console.log(`✅ 最新: ${upToDate.length}件`);
  console.log(`❌ 更新必要: ${outdated.length}件`);
  console.log(`⚠️  日本語版が新しい: ${newer.length}件`);
  console.log(`⏭️  例外適用: ${statusCounts['ignored-exception'] || 0}件`);
  console.log(`⚠️  原文日付乖離: ${statusCounts['source-date-divergence'] || 0}件`);
  console.log(`⚠️  エラー: ${errors.length}件`);
  console.log(`⏭️  スキップ: ${skippedCount}件`);
  console.log(`📝 処理済み: ${processedCount}件 / 全${allMdFiles.length}件\n`);

  const payload = {
    checkedAt: new Date().toISOString(),
    summary: {
      total: allMdFiles.length,
      processed: processedCount,
      skipped: skippedCount,
      upToDate: upToDate.length,
      outdated: outdated.length,
      newer: newer.length,
      errors: errors.length,
      statusCounts,
      comparisonStatusCounts,
    },
    files: results,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));
  console.log(`💾 詳細結果を ${path.relative(ROOT_DIR, OUTPUT_PATH)} に保存しました\n`);

  if (outdated.length > 0) {
    console.log('❌ 更新が必要なドキュメントが見つかりました');
    return 1;
  }

  console.log('✅ アクションが必要な日付差分はありません');
  return 0;
}

async function main() {
  const code = await checkOutdatedDocs(parseArgs());
  process.exit(code);
}

const isDirectRun = isDirectCliRun(import.meta.url);

if (isDirectRun) {
  main().catch((error) => {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  });
}
