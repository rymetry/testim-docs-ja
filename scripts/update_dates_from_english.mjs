#!/usr/bin/env node

/**
 * 英語原文から取得した更新日で日本語ファイルのupdatedフィールドを自動更新します
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
    console.error(`  ⚠️  エラー: ${error.message}`);
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
async function updateDatesFromEnglish(filePattern = null, dryRun = false) {
  console.log('📋 英語原文の更新日で日本語ファイルを更新\n');
  
  if (dryRun) {
    console.log('🔍 ドライランモード: ファイルは変更されません\n');
  }
  
  const docsDir = path.join(rootDir, 'src/content/docs');
  const allFiles = findMdFiles(docsDir);
  
  // パターンでフィルタ
  const filesToUpdate = filePattern 
    ? allFiles.filter(f => f.includes(filePattern))
    : allFiles;
  
  console.log(`📄 ${filesToUpdate.length}個のファイルを処理中...\n`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let noChangeCount = 0;
  
  for (const filePath of filesToUpdate) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(content);
    const { data } = parsed;
    const relativePath = path.relative(rootDir, filePath);
    
    if (!data.sourceUrl) {
      skippedCount++;
      continue;
    }
    
    console.log(`🔍 ${relativePath}`);
    
    const englishDate = await fetchUpdatedDate(data.sourceUrl);
    
    if (!englishDate) {
      console.log(`  ❌ 英語版の更新日を取得できませんでした\n`);
      errorCount++;
      continue;
    }
    
    if (data.updated === englishDate) {
      console.log(`  ✅ 既に最新です: ${englishDate}\n`);
      noChangeCount++;
      continue;
    }
    
    console.log(`  🔄 更新: ${data.updated || 'なし'} → ${englishDate}`);
    
    if (!dryRun) {
      // updatedフィールドのみを正規表現で置換（フォーマットを保持）
      const updatedRegex = /^updated:\s*.*$/m;
      const newUpdatedLine = `updated: '${englishDate}'`;
      
      let newContent;
      if (updatedRegex.test(content)) {
        // 既存のupdatedフィールドを置換
        newContent = content.replace(updatedRegex, newUpdatedLine);
      } else {
        // updatedフィールドが存在しない場合は追加（frontmatterの最後に）
        newContent = content.replace(/^---$/m, (match, offset, string) => {
          // 最初の---の後に見つかった場合はスキップ
          const firstDash = string.indexOf('---');
          if (offset === firstDash) return match;
          // 2番目の---の前に追加
          return `${newUpdatedLine}\n${match}`;
        });
      }
      
      fs.writeFileSync(filePath, newContent, 'utf-8');
      
      console.log(`  ✅ ファイルを更新しました\n`);
      updatedCount++;
    } else {
      console.log(`  💡 [ドライラン] ファイルは更新されません\n`);
      updatedCount++;
    }
    
    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // サマリー
  console.log('\n' + '='.repeat(80));
  console.log('📊 更新結果サマリー\n');
  
  console.log(`✅ 更新完了: ${updatedCount}件`);
  console.log(`⏭️  変更なし: ${noChangeCount}件`);
  console.log(`⚠️  エラー: ${errorCount}件`);
  console.log(`⏭️  スキップ (sourceUrlなし): ${skippedCount}件`);
  console.log(`📝 処理対象: ${filesToUpdate.length}件\n`);
  
  if (dryRun && updatedCount > 0) {
    console.log('💡 実際に更新するには --apply オプションを付けて実行してください\n');
  }
}

// コマンドライン引数を解析
const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');
const patternIndex = args.indexOf('--pattern');
const filePattern = patternIndex >= 0 && args[patternIndex + 1] 
  ? args[patternIndex + 1] 
  : null;

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
使用方法:
  node scripts/update_dates_from_english.mjs [オプション]

オプション:
  --apply                   実際にファイルを更新（デフォルトはドライラン）
  --pattern <パターン>      特定のパターンに一致するファイルのみ処理
  --help, -h                このヘルプを表示

例:
  # ドライラン（変更内容を確認）
  node scripts/update_dates_from_english.mjs

  # 実際に更新
  node scripts/update_dates_from_english.mjs --apply

  # 特定フォルダのみ更新
  node scripts/update_dates_from_english.mjs --apply --pattern recording-tests
`);
  process.exit(0);
}

// 実行
updateDatesFromEnglish(filePattern, dryRun).catch(error => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
