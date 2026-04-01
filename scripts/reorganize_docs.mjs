/**
 * reorganize_docs.mjs — EN パス構造に合わせてドキュメントフォルダを再編する
 *
 * Usage:
 *   node scripts/reorganize_docs.mjs              # dry-run (変更なし)
 *   node scripts/reorganize_docs.mjs --execute    # 実際に移動
 *
 * sourceUrl フロントマターから EN コンテンツパスを取得し、
 * ファイルを正しいフォルダに移動する。
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildDocsIndex, DOCS_DIR } from './lib/project.mjs';

const execute = process.argv.includes('--execute');

function computeMoves() {
  const index = buildDocsIndex();
  const moves = [];

  for (const [slug, { filePath, sourceContentPath }] of Object.entries(index)) {
    if (!sourceContentPath) {
      console.warn(`⚠ ${slug}: sourceContentPath が取得できません — スキップ`);
      continue;
    }

    const parts = sourceContentPath.split('/');
    const targetParent = parts.slice(0, -1).join('/');
    const basename = slug.split('/').pop();
    const targetPath = path.join(DOCS_DIR, targetParent, `${basename}.md`);

    if (filePath === targetPath) continue;

    moves.push({ slug, from: filePath, to: targetPath, targetDir: path.join(DOCS_DIR, targetParent) });
  }

  return moves;
}

function removeEmptyDirs(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) removeEmptyDirs(path.join(dir, ent.name));
  }
  if (dir === DOCS_DIR) return;
  const remaining = fs.readdirSync(dir);
  if (remaining.length === 0) {
    try {
      fs.rmdirSync(dir);
      console.log(`  🗑 空フォルダ削除: ${path.relative(DOCS_DIR, dir)}/`);
    } catch (err) {
      if (err.code !== 'ENOTEMPTY' && err.code !== 'ENOENT') {
        console.warn(`⚠ フォルダ削除エラー: ${path.relative(DOCS_DIR, dir)}/ — ${err.message}`);
      }
    }
  }
}

function main() {
  const moves = computeMoves();

  if (moves.length === 0) {
    console.log('✓ 全ファイルが正しい位置にあります。移動不要。');
    return;
  }

  console.log(`${execute ? '実行' : 'Dry-run'}: ${moves.length} ファイルを移動${execute ? 'します' : '予定'}`);
  console.log('');

  // Create target directories
  const targetDirs = new Set(moves.map((m) => m.targetDir));
  for (const dir of targetDirs) {
    if (execute) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Move files
  for (const { from, to } of moves) {
    const relFrom = path.relative(DOCS_DIR, from);
    const relTo = path.relative(DOCS_DIR, to);
    console.log(`  ${relFrom} → ${relTo}`);
    if (execute) {
      fs.renameSync(from, to);
    }
  }

  // Remove empty directories (recursive bottom-up)
  if (execute) {
    removeEmptyDirs(DOCS_DIR);
  }

  console.log('');
  console.log(`${execute ? '✓ 完了' : 'ℹ --execute フラグで実行してください'}: ${moves.length} ファイル, ${targetDirs.size} ターゲットフォルダ`);
}

main();
