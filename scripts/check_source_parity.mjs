#!/usr/bin/env node

/**
 * check_source_parity.mjs — 日本語ドキュメントの source parity チェック
 *
 * ローカルチェック（デフォルト・高速）:
 *   - 未翻訳英語テキスト検出
 *   - レガシー callout 形式検出 (> 📘 等)
 *   - JSX/MDX 残留検出 (<Callout> 等)
 *   - 見出しレベル問題 (本文中の h1)
 *   - 孤立ページ検出 (SIDEBAR_URLS に未掲載)
 *
 * リモートチェック (--remote フラグ):
 *   - 英語原文の見出し数・画像数・コードブロック数を比較
 *
 * Usage:
 *   node scripts/check_source_parity.mjs              # ローカルチェックのみ
 *   node scripts/check_source_parity.mjs --remote      # リモート比較も実行
 *   node scripts/check_source_parity.mjs --section="Overview"  # セクション絞り込み
 *   node scripts/check_source_parity.mjs --json        # JSON 出力
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'src/content/docs');
const sidebarPath = path.join(rootDir, 'docs/SIDEBAR_URLS.md');

// --- CLI args ---
const args = process.argv.slice(2);
const remoteMode = args.includes('--remote');
const jsonMode = args.includes('--json');
const sectionFlag = args.find((a) => a.startsWith('--section='));
const sectionFilter = sectionFlag ? sectionFlag.split('=').slice(1).join('=') : null;

// --- Patterns ---

/** 未翻訳の英語テキストを検出するパターン */
const UNTRANSLATED_PATTERNS = [
  // 一般的な UI 操作の英語指示文
  /^(?:\d+\.\s*)?Hover over the\b/i,
  /^(?:\d+\.\s*)?Click on the\b/i,
  /^(?:\d+\.\s*)?Click on \*\*/i,
  /^(?:\d+\.\s*)?Scroll down through the menu/i,
  /^(?:\d+\.\s*)?Select the\b/i,
  /^(?:\d+\.\s*)?If you would like to\b/i,
  /^(?:\d+\.\s*)?The file is uploaded/i,
  /^(?:\d+\.\s*)?In the\b.*\bpanel\b/i,
  /^(?:\d+\.\s*)?From the\b.*\bdrop-?down\b/i,
];

/** レガシー callout パターン */
const LEGACY_CALLOUT_RE =
  /^>\s*(?:📘|❗️?|🚧|👍|⚠️|📝|✅|❌|💡|ℹ️|⛔|🔥|💥|🎯|📌|🏷️)\s/;

/** JSX/MDX コンポーネント残留 */
const JSX_CALLOUT_RE = /^<Callout\b/i;

/** 本文中の h1 (frontmatter 後) */
const H1_IN_BODY_RE = /^#\s+\S/;

/** 英語のみの行（日本語文字を含まない、かつ意味のあるテキスト行） */
function isEnglishOnlyLine(line) {
  const trimmed = line.trim();
  // 空行、Markdown 構文のみの行はスキップ
  if (!trimmed) return false;
  if (/^(?:#{1,6}\s|[-*>|]|```|:::|!\[|<!--|\[.*\]\()/.test(trimmed))
    return false;
  if (/^<\/?(?:table|thead|tbody|tr|td|th|details|summary|img|kbd|br|hr)\b/i.test(trimmed))
    return false;
  // 日本語文字を含むならスキップ
  if (/[\u3000-\u9FFF\uF900-\uFAFF]/.test(trimmed)) return false;

  // 番号付きリストのプレフィックスを除去して判定
  const textOnly = trimmed.replace(/^\d+\.\s*/, '');
  if (!textOnly || textOnly.length < 15) return false;

  // 未翻訳パターンに一致するか
  for (const pat of UNTRANSLATED_PATTERNS) {
    if (pat.test(textOnly)) return true;
  }
  return false;
}

// --- File discovery ---

function findMdFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...findMdFiles(full));
    else if (e.name.endsWith('.md')) files.push(full);
  }
  return files;
}

function loadSidebarSlugs() {
  if (!fs.existsSync(sidebarPath)) return new Set();
  const text = fs.readFileSync(sidebarPath, 'utf8');
  const urls = text.match(/https:\/\/help\.testim\.io\/docs\/([\w-]+)/g) || [];
  return new Set(urls.map((u) => u.split('/').pop()));
}

// --- Local checks ---

function localCheck(filePath, content, body, data) {
  const issues = [];
  const lines = body.split('\n');
  let inCodeBlock = false;
  let inFrontmatter = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // コードブロック内はスキップ
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // レガシー callout
    if (LEGACY_CALLOUT_RE.test(line)) {
      issues.push({
        type: 'legacy-callout',
        line: i + 1,
        text: line.trim().substring(0, 80),
      });
    }

    // JSX Callout
    if (JSX_CALLOUT_RE.test(line.trim())) {
      issues.push({
        type: 'jsx-callout',
        line: i + 1,
        text: line.trim().substring(0, 80),
      });
    }

    // 本文中の h1
    if (H1_IN_BODY_RE.test(line) && i > 0) {
      issues.push({
        type: 'h1-in-body',
        line: i + 1,
        text: line.trim().substring(0, 80),
      });
    }

    // 未翻訳英語テキスト
    if (isEnglishOnlyLine(line)) {
      issues.push({
        type: 'untranslated',
        line: i + 1,
        text: line.trim().substring(0, 100),
      });
    }
  }

  return issues;
}

// --- Remote check helpers ---

function extractFromHtml(html) {
  // 見出し数
  const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
  const h3Count = (html.match(/<h3[\s>]/gi) || []).length;
  // 画像数
  const imgCount = (html.match(/<img[\s>]/gi) || []).length;
  // コードブロック数
  const codeBlockCount = (html.match(/<pre[\s>]/gi) || []).length;
  // callout 数（ReadMe の callout は通常 blockquote + theme class）
  const calloutCount = (
    html.match(/class="[^"]*callout[^"]*"/gi) || []
  ).length;

  return { h2Count, h3Count, imgCount, codeBlockCount, calloutCount };
}

function extractFromMd(body) {
  const lines = body.split('\n');
  let h2Count = 0;
  let h3Count = 0;
  let imgCount = 0;
  let codeBlockCount = 0;
  let calloutCount = 0;
  let inCodeBlock = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      if (!inCodeBlock) codeBlockCount++;
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    if (/^##\s/.test(line)) h2Count++;
    if (/^###\s/.test(line)) h3Count++;
    if (/!\[/.test(line)) imgCount += (line.match(/!\[/g) || []).length;
    if (/^:::/.test(line.trim())) calloutCount++;
    if (LEGACY_CALLOUT_RE.test(line)) calloutCount++;
  }

  return { h2Count, h3Count, imgCount, codeBlockCount, calloutCount };
}

async function remoteCheck(sourceUrl, mdBody) {
  const issues = [];
  try {
    const res = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'testim-docs-ja-parity-check/1.0' },
    });
    if (!res.ok) {
      issues.push({
        type: 'source-fetch-error',
        detail: `HTTP ${res.status}`,
      });
      return issues;
    }
    const html = await res.text();
    const en = extractFromHtml(html);
    const ja = extractFromMd(mdBody);

    // 見出し数の差異（大きな差のみ報告）
    if (Math.abs(en.h2Count - ja.h2Count) >= 2) {
      issues.push({
        type: 'heading-mismatch',
        detail: `h2: EN=${en.h2Count} JA=${ja.h2Count}`,
      });
    }

    // 画像数の差異（大きな差のみ報告）
    const imgDiff = en.imgCount - ja.imgCount;
    if (imgDiff >= 3) {
      issues.push({
        type: 'image-mismatch',
        detail: `EN=${en.imgCount} JA=${ja.imgCount} (${imgDiff}枚不足)`,
      });
    }

    // コードブロック差異
    if (Math.abs(en.codeBlockCount - ja.codeBlockCount) >= 2) {
      issues.push({
        type: 'codeblock-mismatch',
        detail: `EN=${en.codeBlockCount} JA=${ja.codeBlockCount}`,
      });
    }
  } catch (err) {
    issues.push({
      type: 'source-fetch-error',
      detail: err.message,
    });
  }
  return issues;
}

// --- Main ---

async function main() {
  const sidebarSlugs = loadSidebarSlugs();
  const allFiles = findMdFiles(docsDir);

  if (!jsonMode) {
    console.log('🔍 Source parity チェック開始\n');
    console.log(`📄 ${allFiles.length} ファイル対象`);
    if (remoteMode) console.log('🌐 リモート比較モード有効');
    if (sectionFilter) console.log(`📂 セクション絞り込み: ${sectionFilter}`);
    console.log('');
  }

  const results = [];
  let checkedCount = 0;

  for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const { data, content: body } = matter(content);

    // セクション絞り込み
    if (sectionFilter && data.category && !data.category.includes(sectionFilter)) {
      continue;
    }

    const relPath = path.relative(rootDir, filePath);
    const slug = path.basename(filePath, '.md');
    const issues = [];

    // 孤立ページチェック
    if (!sidebarSlugs.has(slug)) {
      issues.push({ type: 'orphan-page', detail: 'SIDEBAR_URLS.md に未掲載' });
    }

    // ローカルチェック
    issues.push(...localCheck(filePath, content, body, data));

    // リモートチェック
    if (remoteMode && data.sourceUrl) {
      const remoteIssues = await remoteCheck(data.sourceUrl, body);
      issues.push(...remoteIssues);
      // レート制限対策
      await new Promise((r) => setTimeout(r, 150));
    }

    checkedCount++;

    if (issues.length > 0) {
      results.push({
        file: relPath,
        sourceUrl: data.sourceUrl || '',
        category: data.category || '',
        issues,
      });

      if (!jsonMode) {
        console.log(`❌ ${relPath}`);
        for (const issue of issues) {
          const loc = issue.line ? `:${issue.line}` : '';
          const detail = issue.detail || issue.text || '';
          console.log(`   [${issue.type}]${loc} ${detail}`);
        }
        console.log('');
      }
    }
  }

  // --- サマリー ---
  const byType = {};
  for (const r of results) {
    for (const issue of r.issues) {
      byType[issue.type] = (byType[issue.type] || 0) + 1;
    }
  }

  const summary = {
    checkedAt: new Date().toISOString(),
    mode: remoteMode ? 'remote' : 'local',
    totalFiles: allFiles.length,
    checkedFiles: checkedCount,
    filesWithIssues: results.length,
    issuesByType: byType,
  };

  if (jsonMode) {
    const output = { summary, files: results };
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log('='.repeat(60));
    console.log('📊 チェック結果サマリー\n');
    console.log(`チェック済み: ${checkedCount} / ${allFiles.length} ファイル`);
    console.log(`問題あり: ${results.length} ファイル`);
    console.log('');
    console.log('問題種別:');
    for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
      const label = {
        'legacy-callout': 'レガシー callout (> 📘)',
        untranslated: '未翻訳英語テキスト',
        'jsx-callout': 'JSX Callout 残留',
        'h1-in-body': '本文中の H1',
        'orphan-page': '孤立ページ',
        'heading-mismatch': '見出し数の差異',
        'image-mismatch': '画像数の差異',
        'codeblock-mismatch': 'コードブロック数の差異',
        'source-fetch-error': '原文フェッチエラー',
      }[type] || type;
      console.log(`  ${label}: ${count} 件`);
    }
  }

  // JSON ファイルに保存
  const outputPath = path.join(rootDir, 'parity-check-status.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify({ summary, files: results }, null, 2),
  );
  if (!jsonMode) {
    console.log(`\n💾 詳細結果を ${path.relative(rootDir, outputPath)} に保存しました`);
  }

  // 問題があれば exit 1
  if (results.length > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('❌ エラー:', e);
  process.exit(1);
});
