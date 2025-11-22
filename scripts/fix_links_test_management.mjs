#!/usr/bin/env node

/**
 * Test Management セクションの記事内リンクを修正します
 * - https://help.testim.io/docs/{slug}[#anchor] -> /docs/{slug}[#anchor] （対応mdがある場合）
 * - /docs/{category}/{slug}[#anchor]          -> /docs/{slug}[#anchor]   （対応mdがある場合）
 *
 * 対象: src/content/docs/test-management 配下の .md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const docsRoot = path.join(rootDir, 'src/content/docs');
const targetDir = path.join(docsRoot, 'test-management');

function collectSlugs(dir) {
  const slugs = new Set();
  const stack = [dir];

  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        slugs.add(path.basename(entry.name, '.md'));
      }
    }
  }

  return slugs;
}

const allSlugs = collectSlugs(docsRoot);

function replaceLinks(content, filePath) {
  let changed = false;
  const changes = [];

  // https://help.testim.io/docs/{path}
  const externalPattern =
    /\[(?<text>[^\]]*?)\]\((?<url>https:\/\/help\.testim\.io\/docs\/(?<path>[^)#\s]+)(?<anchor>#[^)"]*)?)\)/g;

  content = content.replace(externalPattern, (match, _text, url, pathPart, anchor) => {
    const slug = pathPart.split('/').pop();
    if (!slug || !allSlugs.has(slug)) {
      return match;
    }
    const newUrl = `/docs/${slug}${anchor || ''}`;
    changes.push({ type: 'external', before: url, after: newUrl });
    changed = true;
    return match.replace(url, newUrl);
  });

  // /docs/{category}/{slug}
  const internalPattern =
    /\[(?<text>[^\]]*?)\]\((?<url>\/docs\/(?<rest>[^)#\s]+))\)/g;

  content = content.replace(internalPattern, (match, _text, url, rest) => {
    const [firstSegment, ...others] = rest.split('/');
    if (!others.length) {
      // /docs/slug 形式はそのまま
      return match;
    }
    const slugWithAnchor = others.join('/');
    const [slug, anchorPart] = slugWithAnchor.split('#');
    if (!slug || !allSlugs.has(slug)) {
      return match;
    }
    const newUrl = `/docs/${slug}${anchorPart ? `#${anchorPart}` : ''}`;
    changes.push({ type: 'internal', before: url, after: newUrl });
    changed = true;
    return match.replace(url, newUrl);
  });

  if (changed) {
    console.log(`\n📄 ${path.relative(rootDir, filePath)}`);
    for (const c of changes) {
      console.log(`  - ${c.type} link: ${c.before} -> ${c.after}`);
    }
  }

  return { content, changed };
}

function main() {
  const files = fs
    .readdirSync(targetDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(targetDir, f));

  let totalChanged = 0;

  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');
    const { content, changed } = replaceLinks(original, file);
    if (changed) {
      fs.writeFileSync(file, content, 'utf8');
      totalChanged++;
    }
  }

  console.log(`\n✅ リンクを更新したファイル数: ${totalChanged} 件`);
}

main();

