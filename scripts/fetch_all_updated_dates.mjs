#!/usr/bin/env node

/**
 * すべてのドキュメントの英語原文更新日を取得して一覧表示します
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
  
  for (const { regex, unit } of patterns) {
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
      
      return date.toISOString().split('T')[0];
    }
  }
  
  return null;
}

/**
 * 英語原文ページから更新日を取得
 * 表示される相対時間テキストをパースして更新日を推定します
 */
async function fetchUpdatedDate(url) {
  try {
    const response = await fetch(url);
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
    return await fetchUpdatedDateFromHTML(url);
  } catch (error) {
    console.error(`  ⚠️  エラー: ${url} - ${error.message}`);
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
        return pageData.updatedAt.split('T')[0];
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
    return slugMatch[1].split('T')[0];
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
async function fetchAllUpdatedDates() {
  console.log('📋 英語原文の更新日を一括取得\n');
  
  const docsDir = path.join(rootDir, 'src/content/docs');
  const allFiles = findMdFiles(docsDir);
  
  const filesWithSourceUrl = allFiles.filter(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(content);
    return data.sourceUrl;
  });
  
  console.log(`📄 ${filesWithSourceUrl.length}個のファイルを処理中...\n`);
  
  const results = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (const filePath of filesWithSourceUrl) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(content);
    const relativePath = path.relative(rootDir, filePath);
    const fileName = path.basename(filePath);
    
    process.stdout.write(`🔍 ${fileName}...`);
    
    const englishDate = await fetchUpdatedDate(data.sourceUrl);
    
    if (englishDate) {
      successCount++;
      const needsUpdate = englishDate && data.updated && new Date(englishDate) > new Date(data.updated);
      const status = needsUpdate ? '🔄' : '✅';
      console.log(` ${status} ${englishDate}`);
      
      results.push({
        file: relativePath,
        fileName,
        sourceUrl: data.sourceUrl,
        currentJapaneseDate: data.updated || 'なし',
        fetchedEnglishDate: englishDate,
        needsUpdate,
        status: needsUpdate ? 'outdated' : 'up-to-date'
      });
    } else {
      errorCount++;
      console.log(` ❌ 取得失敗`);
      
      results.push({
        file: relativePath,
        fileName,
        sourceUrl: data.sourceUrl,
        currentJapaneseDate: data.updated || 'なし',
        fetchedEnglishDate: null,
        needsUpdate: false,
        status: 'error'
      });
    }
    
    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // テーブル形式で結果を表示
  console.log('\n\n' + '='.repeat(100));
  console.log('📊 取得結果一覧\n');
  
  // ヘッダー
  console.log('状態 | ファイル名 | 日本語版 | 英語版');
  console.log('-----|-----------|---------|--------');
  
  // データ行
  results.forEach(item => {
    const status = item.status === 'outdated' ? '🔄 要更新' : 
                   item.status === 'up-to-date' ? '✅ 最新' : 
                   '❌ エラー';
    const jpDate = item.currentJapaneseDate || 'なし';
    const enDate = item.fetchedEnglishDate || 'N/A';
    
    console.log(`${status} | ${item.fileName} | ${jpDate} | ${enDate}`);
  });
  
  // サマリー
  console.log('\n📊 サマリー:');
  console.log(`  ✅ 取得成功: ${successCount}件`);
  console.log(`  ❌ 取得失敗: ${errorCount}件`);
  console.log(`  🔄 更新必要: ${results.filter(r => r.needsUpdate).length}件`);
  
  // JSON形式でも出力
  const outputPath = path.join(rootDir, 'docs-dates-snapshot.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify({
      fetchedAt: new Date().toISOString(),
      summary: {
        total: filesWithSourceUrl.length,
        success: successCount,
        error: errorCount,
        needsUpdate: results.filter(r => r.needsUpdate).length
      },
      files: results
    }, null, 2)
  );
  
  console.log(`\n💾 結果を ${path.relative(rootDir, outputPath)} に保存しました\n`);
}

// 実行
fetchAllUpdatedDates().catch(error => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
