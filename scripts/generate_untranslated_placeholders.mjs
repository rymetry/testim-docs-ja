import fs from 'fs';
import path from 'path';

// Paths
const ROOT = process.cwd();
const SIDEBAR_FILE = path.join(ROOT, 'docs', 'SIDEBAR_URLS.md');
const DOCS_ROOT = path.join(ROOT, 'src', 'content', 'docs');

// Helpers
const toKebab = (str) => {
  return String(str)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/&/g, ' ') // treat & as separator
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

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

// Read sidebar file
if (!fs.existsSync(SIDEBAR_FILE)) {
  console.error(`Missing file: ${SIDEBAR_FILE}`);
  process.exit(1);
}

const raw = fs.readFileSync(SIDEBAR_FILE, 'utf8');
const lines = raw.split(/\r?\n/);

// Parse categories and items
/** @type {Array<{ english: string, japanese: string | null, items: Array<{status: string, url: string, slug: string}> }>} */
const categories = [];

let current = null;
for (const line of lines) {
  // Heading line: ## Name（日本語）
  const h = line.match(/^##\s+(.+?)(?:（(.+?)）)?\s*$/);
  if (h) {
    const english = h[1].trim();
    const japanese = h[2] ? h[2].trim() : null;
    current = { english, japanese, items: [] };
    categories.push(current);
    continue;
  }

  // Item line: - ⏳ or ✅ plus URL
  const m = line.match(/^\-\s*([✅⏳])\s+(https?:\/\/help\.testim\.io\/docs\/([a-z0-9\-]+))\s*$/);
  if (m && current) {
    const status = m[1];
    const url = m[2];
    const slug = m[3];
    current.items.push({ status, url, slug });
  }
}

// Ensure docs root exists
fs.mkdirSync(DOCS_ROOT, { recursive: true });

let created = 0;
/** @type {Array<string>} */
const createdPaths = [];

for (const cat of categories) {
  if (!cat || !cat.items.length) continue;
  const english = cat.english;
  const japanese = cat.japanese || english; // fallback to English if JP missing
  const categoryFolder = toKebab(english);
  const categoryDir = path.join(DOCS_ROOT, categoryFolder);
  fs.mkdirSync(categoryDir, { recursive: true });

  // Build order by appearance across all items
  let order = 0;
  for (const item of cat.items) {
    order += 1;
    if (item.status === '✅') continue; // skip already translated

    const slug = item.slug;
    const filePath = path.join(categoryDir, `${slug}.md`);
    if (fs.existsSync(filePath)) {
      // Do not overwrite existing content
      continue;
    }

    const title = `【翻訳中】${titleCaseFromSlug(slug)}`;
    const description = `このページは翻訳作業中です。原文: ${item.url}`;
    const keywords = [slug, toKebab(english), 'testim'];

    const fm = [
      '---',
      `title: '${title}'`,
      `description: '${description}'`,
      `category: '${japanese}'`,
      `order: ${order}`,
      `updated: '${todayStr}'`,
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

    const content = fm + body;
    fs.writeFileSync(filePath, content, 'utf8');
    created += 1;
    createdPaths.push(path.relative(ROOT, filePath));
  }
}

console.log(`Created ${created} placeholder files.`);
// Print up to first 30 created paths for quick inspection
for (const p of createdPaths.slice(0, 30)) {
  console.log(`- ${p}`);
}
if (createdPaths.length > 30) {
  console.log(`...and ${createdPaths.length - 30} more`);
}

