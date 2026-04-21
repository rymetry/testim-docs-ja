#!/usr/bin/env node
/**
 * EN source patch registry の JSON 再生成ツール。
 *
 * ``scripts/lib/en_source_patches.mjs`` が patch の唯一の定義ソース。Python
 * モジュール ``testim_parity.en_source_patches`` はこの JSON 経由で同じデータを
 * 読み込むため、mjs を編集したら JSON を再生成する必要がある。
 *
 * 使い方:
 *   node scripts/py/tools/regen_en_source_patches.mjs           # 書き出し
 *   node scripts/py/tools/regen_en_source_patches.mjs --check   # drift 検査のみ
 *
 * ``--check`` モードでは、書き出そうとする内容と既存 JSON が異なっていたら
 * exit 1 で CI を落とす (作業者に ``regen:py-patches`` を走らせるよう促す)。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  EN_SOURCE_PATCHES,
  DEFECT_CLASSES,
} from '../../lib/en_source_patches.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// repo-root = scripts/py/tools から 3 階層上
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const TARGET = path.join(
  REPO_ROOT,
  'scripts',
  'py',
  'src',
  'testim_parity',
  '_en_source_patches_data.json',
);

function serialize() {
  const payload = {
    defectClasses: [...DEFECT_CLASSES],
    patches: EN_SOURCE_PATCHES.map((p) => ({
      id: p.id,
      slugs: [...p.slugs],
      defectClass: p.defectClass,
      find: p.find,
      replace: p.replace,
      rationale: p.rationale,
      linkedDefect: p.linkedDefect,
      addedAt: p.addedAt,
      reviewAfter: p.reviewAfter,
    })),
  };
  // 2-space pretty JSON + 末尾改行 (git diff を安定させる)
  return JSON.stringify(payload, null, 2) + '\n';
}

const nextContent = serialize();
const checkOnly = process.argv.includes('--check');

if (checkOnly) {
  let current = '';
  try {
    current = readFileSync(TARGET, 'utf8');
  } catch (e) {
    console.error(`regen_en_source_patches --check: target missing (${TARGET})`);
    process.exit(1);
  }
  if (current !== nextContent) {
    console.error(
      'regen_en_source_patches --check: drift detected. ' +
        'Run `npm run regen:py-patches` to re-sync ' +
        `${path.relative(REPO_ROOT, TARGET)}.`,
    );
    process.exit(1);
  }
  console.log(`regen_en_source_patches: ${path.relative(REPO_ROOT, TARGET)} is up to date`);
  process.exit(0);
}

writeFileSync(TARGET, nextContent);
console.log(
  `regen_en_source_patches: wrote ${EN_SOURCE_PATCHES.length} patches to ${path.relative(REPO_ROOT, TARGET)}`,
);
