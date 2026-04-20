import fs from 'node:fs';
import path from 'node:path';
import { isDirectRun } from '../lib/cli.mjs';
import { parseSidebarSections, getSectionSlugSet } from '../lib/sidebar.mjs';
import { ROOT_DIR, DOCS_DIR, toKebab } from '../lib/project.mjs';

const ROOT = ROOT_DIR;
const SIDEBAR_FILE = path.join(ROOT, 'docs', 'SIDEBAR_URLS.md');
const DOCS_ROOT = DOCS_DIR;

const titleCaseFromSlug = (slug) => {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const todayStr = `${yyyy}-${mm}-${dd}`;

async function main() {
  const args = process.argv.slice(2);
  const section = args
    .find((a) => a.startsWith('--section='))
    ?.split('=')
    .slice(1)
    .join('=');

  if (!fs.existsSync(SIDEBAR_FILE)) {
    console.error(`Missing file: ${SIDEBAR_FILE}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(SIDEBAR_FILE, 'utf8');
  const categories = parseSidebarSections(raw);
  const sectionSlugs = section ? getSectionSlugSet(section, categories) : null;

  fs.mkdirSync(DOCS_ROOT, { recursive: true });

  let created = 0;
  /** @type {Array<string>} */
  const createdPaths = [];

  for (const cat of categories) {
    if (!cat || !cat.items.length) continue;
    const english = cat.english;
    const japanese = cat.japanese || english;
    const categoryFolder = toKebab(english);
    const categoryDir = path.join(DOCS_ROOT, categoryFolder);
    fs.mkdirSync(categoryDir, { recursive: true });

    let order = 0;
    for (const item of cat.items) {
      order += 1;
      if (item.status !== '⏳') continue;
      if (sectionSlugs && !sectionSlugs.has(item.slug)) continue;

      const slug = item.slug;
      const basenameSlug = slug.includes('/') ? slug.split('/').pop() : slug;
      const filePath = path.join(categoryDir, `${basenameSlug}.md`);
      if (fs.existsSync(filePath)) continue;

      const title = `【翻訳中】${titleCaseFromSlug(basenameSlug)}`;
      const description = `${titleCaseFromSlug(basenameSlug)} の日本語ドキュメントを準備しています。`;
      const keywords = [basenameSlug, toKebab(english), 'testim'];

      const fm = [
        '---',
        `title: '${title}'`,
        `description: '${description}'`,
        `category: '${japanese}'`,
        `order: ${order}`,
        `updated: '${todayStr}'`,
        `sourceUrl: '${item.url}'`,
        'keywords:',
        ...keywords.map((k) => `  - ${k}`),
        '---',
        '',
      ].join('\n');

      const body = [
        ':::note{title="翻訳ステータス"}',
        'このページの日本語翻訳は準備中です。原文をご参照ください。',
        '',
        `[原文ページ](${item.url})`,
        ':::',
        '',
        '## 概要',
        '本文の翻訳は今後追加されます。翻訳の優先度や疑問点があれば Issue でお知らせください。',
        '',
      ].join('\n');

      fs.writeFileSync(filePath, fm + body, 'utf8');
      created += 1;
      createdPaths.push(path.relative(ROOT, filePath));
    }
  }

  console.log(`Created ${created} placeholder files.`);
  for (const createdPath of createdPaths.slice(0, 30)) {
    console.log(`- ${createdPath}`);
  }
  if (createdPaths.length > 30) {
    console.log(`...and ${createdPaths.length - 30} more`);
  }
}

if (isDirectRun(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
