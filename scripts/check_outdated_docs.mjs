#!/usr/bin/env node

/**
 * 英語原文と日本語翻訳の更新日を比較し、更新が必要なドキュメントを検出します
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * 相対時間テキストから日付を計算
 * 例: "Updated about 2 months ago" -> "2025-09-14"
 *      "Updated 16 days ago" -> "2025-10-29"
 */
function parseRelativeTime(text) {
  const now = new Date();
  
  // Remove HTML comments and extra spaces
  const cleanText = text.replace(/<!--.*?-->/g, '').replace(/\s+/g, ' ').trim();
  
  // Pattern: "about X days/weeks/months/years ago" or "X days/weeks/months/years ago"
  const patterns = [
    { regex: /(?:about )?(\d+) day(?:s)? ago/i, unit: 'days' },
    { regex: /(?:about )?(\d+) week(?:s)? ago/i, unit: 'weeks' },
    { regex: /(?:about )?(\d+) month(?:s)? ago/i, unit: 'months' },
    { regex: /(?:about )?(\d+) year(?:s)? ago/i, unit: 'years' }
  ];
  
  for (const { regex, unit} of patterns) {
    const match = cleanText.match(regex);
    if (match) {
      const amount = parseInt(match[1], 10);
      const date = new Date(now);
      
      switch (unit) {
        case 'days':
          date.setDate(date.getDate() - amount);
          break;
        case 'weeks':
          date.setDate(date.getDate() - (amount * 7));
          break;
        case 'months':
          date.setMonth(date.getMonth() - amount);
          break;
        case 'years':
          date.setFullYear(date.getFullYear() - amount);
          break;
      }
      
      return date;
    }
  }
  
  return null;
}

/**
 * 英語原文ページから更新日を取得
 * 表示される相対時間テキストをパースして更新日を推定します
 */
async function fetchEnglishUpdatedDate(sourceUrl) {
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract "Updated about X months ago" or "Updated X days ago" text from HTML
    // Pattern allows for HTML comments and multiple spaces, "about" is optional
    const relativeTimePattern = /Updated[\s\S]{0,50}?(?:about\s+)?(\d+)\s+(day|week|month|year)s?\s+ago/i;
    const match = html.match(relativeTimePattern);
    
    if (match) {
      const relativeText = match[0];
      const calculatedDate = parseRelativeTime(relativeText);
      if (calculatedDate) {
        return calculatedDate;
      }
    }
    
    // Fallback: try to extract from metadata
    return await fetchUpdatedDateFromHTML(sourceUrl);
  } catch (error) {
    console.error(`  ⚠️  エラー: ${sourceUrl} - ${error.message}`);
    return null;
  }
}

/**
 * HTMLから更新日を取得（フォールバック用）
 */
async function fetchUpdatedDateFromHTML(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const html = await response.text();
  
  // Extract slug from URL
  const slug = url.split('/').pop();
  
  // Try to find JSON data block
  const jsonBlockPattern = /<script[^>]*>window\.__REDUX_STATE__\s*=\s*({.*?})<\/script>/s;
  const jsonMatch = html.match(jsonBlockPattern);
  
  if (jsonMatch) {
    try {
      const jsonData = JSON.parse(jsonMatch[1]);
      const pageData = jsonData?.context?.page || jsonData?.page;
      if (pageData?.updatedAt) {
        return new Date(pageData.updatedAt);
      }
    } catch (e) {
      // Continue to regex extraction
    }
  }
  
  // Look for updatedAt near the slug in JSON data
  const slugPattern = new RegExp(
    `"slug":"${slug}"[^}]{0,500}"updatedAt":"([^"]+)"`,
    'i'
  );
  const slugMatch = html.match(slugPattern);
  if (slugMatch) {
    return new Date(slugMatch[1]);
  }
  
  return null;
}

/**
 * ディレクトリ内のすべての.mdファイルを再帰的に検索
 */
function findMdFiles(dir) {
  const files = fs.readdirSync(dir);
  let mdFiles = [];
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      mdFiles = mdFiles.concat(findMdFiles(fullPath));
    } else if (file.endsWith('.md')) {
      mdFiles.push(fullPath);
    }
  }
  
  return mdFiles;
}

/**
 * メイン処理
 */
async function checkOutdatedDocs() {
  console.log('📋 ドキュメント更新状況チェック開始\n');
  
  const docsDir = path.join(rootDir, 'src/content/docs');
  const allMdFiles = findMdFiles(docsDir);
  
  console.log(`📄 ${allMdFiles.length}個のファイルをスキャン中...\n`);
  
  const results = [];
  let processedCount = 0;
  let skippedCount = 0;
  
  for (const filePath of allMdFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(content);
    
    if (!data.sourceUrl) {
      skippedCount++;
      continue;
    }
    
    processedCount++;
    const relativePath = path.relative(rootDir, filePath);
    
    console.log(`🔍 ${relativePath}`);
    
    const englishDate = await fetchEnglishUpdatedDate(data.sourceUrl);
    const japaneseDate = data.updated ? new Date(data.updated) : null;
    
    if (!japaneseDate) {
      console.log(`  ⚠️  日本語版にupdatedフィールドがありません\n`);
      results.push({
        file: relativePath,
        sourceUrl: data.sourceUrl,
        japaneseUpdated: 'なし',
        englishUpdated: englishDate ? englishDate.toISOString().split('T')[0] : '不明',
        needsUpdate: true,
        daysBehind: null,
        status: 'missing-date'
      });
      continue;
    }
    
    if (!englishDate) {
      console.log(`  ⚠️  英語版の更新日を取得できませんでした\n`);
      results.push({
        file: relativePath,
        sourceUrl: data.sourceUrl,
        japaneseUpdated: data.updated,
        englishUpdated: '不明',
        needsUpdate: false,
        daysBehind: null,
        status: 'fetch-error'
      });
      continue;
    }
    
    // 日付を YYYY-MM-DD 形式の文字列で比較（時刻部分を無視）
    const englishDateStr = englishDate.toISOString().split('T')[0];
    const japaneseDateStr = japaneseDate.toISOString().split('T')[0];
    const daysBehind = Math.floor((englishDate - japaneseDate) / (1000 * 60 * 60 * 24));
    const needsUpdate = englishDateStr > japaneseDateStr;
    
    if (needsUpdate) {
      console.log(`  ❌ 更新が必要: 日本語 ${japaneseDateStr} → 英語 ${englishDateStr} (${daysBehind}日遅れ)\n`);
    } else if (englishDateStr < japaneseDateStr) {
      console.log(`  ⚠️  日本語版が新しい: 日本語 ${japaneseDateStr} > 英語 ${englishDateStr}\n`);
    } else {
      console.log(`  ✅ 最新: ${japaneseDateStr}\n`);
    }
    
    results.push({
      file: relativePath,
      sourceUrl: data.sourceUrl,
      japaneseUpdated: japaneseDateStr,
      englishUpdated: englishDateStr,
      needsUpdate,
      daysBehind,
      status: needsUpdate ? 'outdated' : (englishDateStr < japaneseDateStr ? 'newer' : 'up-to-date')
    });
    
    // レート制限対策（100ms待機）
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // 結果サマリー
  console.log('\n' + '='.repeat(80));
  console.log('📊 チェック結果サマリー\n');
  
  const outdated = results.filter(r => r.needsUpdate);
  const upToDate = results.filter(r => r.status === 'up-to-date');
  const errors = results.filter(r => r.status === 'fetch-error' || r.status === 'missing-date');
  
  console.log(`✅ 最新: ${upToDate.length}件`);
  console.log(`❌ 更新必要: ${outdated.length}件`);
  console.log(`⚠️  エラー: ${errors.length}件`);
  console.log(`⏭️  スキップ (sourceUrlなし): ${skippedCount}件`);
  console.log(`📝 処理済み: ${processedCount}件 / 全${allMdFiles.length}件\n`);
  
  if (outdated.length > 0) {
    console.log('❌ 更新が必要なファイル:\n');
    outdated.forEach(item => {
      console.log(`  📄 ${item.file}`);
      console.log(`     日本語版: ${item.japaneseUpdated}`);
      console.log(`     英語原文: ${item.englishUpdated}`);
      console.log(`     遅延: ${item.daysBehind}日`);
      console.log(`     URL: ${item.sourceUrl}\n`);
    });
  }
  
  if (errors.length > 0) {
    console.log('⚠️  エラーが発生したファイル:\n');
    errors.forEach(item => {
      console.log(`  📄 ${item.file}`);
      console.log(`     状態: ${item.status}`);
      console.log(`     URL: ${item.sourceUrl}\n`);
    });
  }
  
  // 結果をJSONファイルに保存
  const outputPath = path.join(rootDir, 'docs-update-status.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify({
      checkedAt: new Date().toISOString(),
      summary: {
        total: allMdFiles.length,
        processed: processedCount,
        skipped: skippedCount,
        upToDate: upToDate.length,
        outdated: outdated.length,
        errors: errors.length
      },
      files: results
    }, null, 2)
  );
  
  console.log(`💾 詳細結果を ${path.relative(rootDir, outputPath)} に保存しました\n`);
  
  // CIで使用する場合、更新が必要なファイルがあればエラーコードで終了
  if (outdated.length > 0) {
    console.log('❌ 更新が必要なドキュメントが見つかりました');
    process.exit(1);
  } else {
    console.log('✅ すべてのドキュメントが最新です');
    process.exit(0);
  }
}

// 実行
checkOutdatedDocs().catch(error => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
