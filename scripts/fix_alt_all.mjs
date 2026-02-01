#!/usr/bin/env node

/**
 * リポジトリ内Markdownの画像にaltテキストを付与します（MD045対策）。
 * - 対象: リポジトリ配下の .md（node_modules/.git などは除外）
 * - 処理: コードフェンス外の `![](...)` を `![スクリーンショット](...)` に置換
 *   - `.gif` を含む場合は `![操作手順アニメーション](...)`
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const IGNORE_DIR_NAMES = new Set(['node_modules', '.git', 'dist', '.astro']);

function listMarkdownFilesRecursively(dirPath) {
  /** @type {string[]} */
  const results = [];

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.DS_Store')) continue;

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (IGNORE_DIR_NAMES.has(entry.name)) continue;
      results.push(...listMarkdownFilesRecursively(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }

  return results;
}

function isFenceLine(line) {
  const trimmed = line.trimStart();
  const match = /^(?<fence>`{3,}|~{3,})/.exec(trimmed);
  if (!match) return null;
  return { fence: match.groups.fence, char: match.groups.fence[0], len: match.groups.fence.length };
}

function applyAltFixOutsideFences(markdown) {
  const lines = markdown.split('\n');

  /** @type {{char: string, len: number} | null} */
  let openFence = null;

  const out = lines.map((line) => {
    const fence = isFenceLine(line);
    if (fence) {
      if (!openFence) {
        openFence = { char: fence.char, len: fence.len };
      } else if (openFence.char === fence.char && fence.len >= openFence.len) {
        openFence = null;
      }
      return line;
    }

    if (openFence) return line;

    if (!line.includes('![](')) return line;

    return line.replace(/!\[\]\(([^)]+)\)/g, (_m, inside) => {
      const lowered = String(inside).toLowerCase();
      const alt = lowered.includes('.gif') ? '操作手順アニメーション' : 'スクリーンショット';
      return `![${alt}](${inside})`;
    });
  });

  return out.join('\n');
}

function main() {
  const files = listMarkdownFilesRecursively(rootDir);

  let changedCount = 0;
  let changedImageCount = 0;

  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');
    if (!original.includes('![](')) continue;

    const updated = applyAltFixOutsideFences(original);
    if (updated !== original) {
      const before = (original.match(/!\[\]\(/g) || []).length;
      const after = (updated.match(/!\[\]\(/g) || []).length;

      fs.writeFileSync(file, updated, 'utf8');
      changedCount++;
      changedImageCount += Math.max(0, before - after);
      console.log(`更新: ${path.relative(rootDir, file)} (images fixed: ${Math.max(0, before - after)})`);
    }
  }

  console.log(`\n✅ altテキストを更新したファイル数: ${changedCount} 件`);
  console.log(`✅ 修正した画像（空alt）数: ${changedImageCount} 件`);
}

main();
