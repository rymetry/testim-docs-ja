import fs from 'node:fs';
import path from 'node:path';
import { DOCS_DIR, SIDEBAR_PATH, findMdFiles } from './lib/project.mjs';
import { extractJapaneseLabel } from './lib/sidebar.mjs';
import { extractSlug } from './lib/madcap_toc.mjs';

const docsRoot = DOCS_DIR;
const sidebarPath = SIDEBAR_PATH;

function parseSidebarOrdering(text) {
  const sectionRe = /^##\s+(.+?)\s*$/;
  // ✅🔍 must precede ✅ — regex alternation is order-dependent
  const urlLineRe =
    /^-\s+(?:✅🔍|✅|⏳)\s+(https:\/\/docs\.tricentis\.com\/testim\/content\/[^\s]+\.htm)\s*$/;

  /** @type {Map<string, { category: string; categoryIndex: number; itemIndex: number; order: number }>} */
  const bySlug = new Map();

  let currentCategory = null;
  let categoryIndex = -1;
  let itemIndex = 0;

  for (const line of text.split(/\r?\n/)) {
    const sm = line.match(sectionRe);
    if (sm) {
      const raw = sm[1].trim();
      if (raw === '翻訳ステータス' || raw === '検証ステータス' || raw === 'URL抽出方法') {
        currentCategory = null;
        continue;
      }
      const label = extractJapaneseLabel(raw);
      // コンテンツを持たないセクション（Home, Changelog）をスキップ
      // — categoryIndex に含めると全ページの order 値がずれる
      if (label === 'Home' || label === 'Changelog') {
        currentCategory = null;
        continue;
      }
      currentCategory = label;
      categoryIndex += 1;
      itemIndex = 0;
      continue;
    }

    const um = line.match(urlLineRe);
    if (um && currentCategory) {
      const slug = extractSlug(um[1]);
      if (!slug) {
        console.warn(`parseSidebarOrdering: could not extract slug from URL: ${um[1]}`);
        continue;
      }
      const order = (categoryIndex + 1) * 1000 + (itemIndex + 1);
      if (!bySlug.has(slug)) {
        bySlug.set(slug, { category: currentCategory, categoryIndex, itemIndex, order });
      }
      itemIndex += 1;
    }
  }

  return bySlug;
}

function escapeSingleQuotes(s) {
  return s.replace(/'/g, "''");
}

function updateFrontmatterBlock(fm, updates) {
  const lines = fm.split(/\r?\n/);

  let foundCategory = false;
  let foundOrder = false;

  const out = lines.map((line) => {
    if (line.match(/^category:\s*/)) {
      foundCategory = true;
      return `category: '${escapeSingleQuotes(updates.category)}'`;
    }
    if (line.match(/^order:\s*/)) {
      foundOrder = true;
      return `order: ${updates.order}`;
    }
    return line;
  });

  // category/order がなければ適切な場所へ挿入
  if (!foundCategory) {
    // description の直後に入れる（なければ title の直後）
    const descIndex = out.findIndex((l) => l.startsWith('description:'));
    const titleIndex = out.findIndex((l) => l.startsWith('title:'));
    const insertAt = descIndex >= 0 ? descIndex + 1 : titleIndex >= 0 ? titleIndex + 1 : 0;
    out.splice(insertAt, 0, `category: '${escapeSingleQuotes(updates.category)}'`);
  }

  if (!foundOrder) {
    const catIndex = out.findIndex((l) => l.startsWith('category:'));
    const insertAt = catIndex >= 0 ? catIndex + 1 : 0;
    out.splice(insertAt, 0, `order: ${updates.order}`);
  }

  return out.join('\n');
}

function updateMarkdownFile(filePath, updates) {
  const raw = fs.readFileSync(filePath, 'utf8');
  if (!raw.startsWith('---')) return { changed: false, reason: 'no-frontmatter' };

  const end = raw.indexOf('\n---', 3);
  if (end < 0) return { changed: false, reason: 'no-frontmatter-end' };

  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { changed: false, reason: 'frontmatter-parse-failed' };

  const fm = match[1];
  const body = match[2];

  const newFm = updateFrontmatterBlock(fm, updates);
  const out = `---\n${newFm}\n---\n\n${body.replace(/^\n+/, '')}`;

  if (out === raw) return { changed: false };
  fs.writeFileSync(filePath, out, 'utf8');
  return { changed: true };
}

function main() {
  const args = new Set(process.argv.slice(2));
  const apply = args.has('--apply');
  const listUnmatched = args.has('--list-unmatched');

  if (!fs.existsSync(sidebarPath)) {
    console.error(`Not found: ${sidebarPath}`);
    process.exit(1);
  }

  const sidebarText = fs.readFileSync(sidebarPath, 'utf8');
  const bySlug = parseSidebarOrdering(sidebarText);

  const files = findMdFiles(docsRoot);

  let matched = 0;
  let changed = 0;
  const unmatched = [];
  const changedExamples = [];

  for (const filePath of files) {
    const slug = path.basename(filePath, '.md');
    const entry = bySlug.get(slug);
    if (!entry) {
      unmatched.push(path.relative(docsRoot, filePath));
      continue;
    }

    matched += 1;

    if (apply) {
      const res = updateMarkdownFile(filePath, { category: entry.category, order: entry.order });
      if (res.changed) {
        changed += 1;
        if (changedExamples.length < 20) changedExamples.push(path.relative(docsRoot, filePath));
      }
    }
  }

  console.log(`md files: ${files.length}`);
  console.log(`sidebar slugs: ${bySlug.size}`);
  console.log(`matched by slug: ${matched}`);

  if (apply) {
    console.log(`changed files: ${changed}`);
    if (changedExamples.length) {
      console.log('changed examples:');
      for (const p of changedExamples) console.log('-', p);
    }
  } else {
    console.log('dry-run only (use --apply to write changes)');
  }

  // 追加のMD（サイドバー外）があるのは正常（執筆ガイド等）
  console.log(`unmatched markdown files (not in sidebar): ${unmatched.length}`);

  if (listUnmatched && unmatched.length) {
    console.log('unmatched files:');
    for (const p of unmatched) console.log('-', p);
  }
}

main();
