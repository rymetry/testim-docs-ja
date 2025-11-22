#!/usr/bin/env node

/**
 * Test Management セクションの画像に日本語のaltテキストを付与します。
 * - 対象: src/content/docs/test-management 配下の .md
 * - 処理: `![](` -> `![スクリーンショット](` に置換
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const targetDir = path.join(rootDir, 'src/content/docs/test-management');

function main() {
  const files = fs
    .readdirSync(targetDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(targetDir, f));

  let changedCount = 0;

  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');
    if (!original.includes('![](')) continue;

    const updated = original.replace(/!\[\]\(/g, '![スクリーンショット](');
    if (updated !== original) {
      fs.writeFileSync(file, updated, 'utf8');
      changedCount++;
      console.log(`更新: ${path.relative(rootDir, file)}`);
    }
  }

  console.log(`\n✅ altテキストを更新したファイル数: ${changedCount} 件`);
}

main();

