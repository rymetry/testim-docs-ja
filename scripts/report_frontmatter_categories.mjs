import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const docsRoot = path.resolve('src/content/docs');
const sidebarPath = path.resolve('docs/SIDEBAR_URLS.md');

function extractJapaneseLabel(sectionTitle) {
  const m = sectionTitle.match(/[（(]([^）)]+)[）)]/);
  return (m ? m[1] : sectionTitle).trim();
}

function readSidebarCategories() {
  if (!fs.existsSync(sidebarPath)) return new Set();
  const text = fs.readFileSync(sidebarPath, 'utf8');
  const lines = text.split(/\r?\n/);

  const out = new Set();
  const sectionRe = /^##\s+(.+?)\s*$/;

  for (const line of lines) {
    const m = line.match(sectionRe);
    if (!m) continue;
    const raw = m[1].trim();
    if (raw === '翻訳ステータス' || raw === '検証ステータス' || raw === 'URL抽出方法') continue;
    out.add(extractJapaneseLabel(raw));
  }

  return out;
}

function walkMarkdownFiles(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkMarkdownFiles(p));
    else if (ent.isFile() && ent.name.endsWith('.md')) out.push(p);
  }
  return out;
}

const files = walkMarkdownFiles(docsRoot);
const categoryCounts = new Map();
const missingCategory = [];

for (const filePath of files) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const fm = matter(raw).data;

  const rel = path.relative(docsRoot, filePath);

  if (!fm.category || typeof fm.category !== 'string') {
    missingCategory.push(rel);
    continue;
  }

  categoryCounts.set(fm.category, (categoryCounts.get(fm.category) ?? 0) + 1);
}

console.log(`md files: ${files.length}`);
console.log(`unique categories: ${categoryCounts.size}`);
console.log(`missing category: ${missingCategory.length}`);

const sidebarCategories = readSidebarCategories();
console.log(`sidebar categories (docs/SIDEBAR_URLS.md): ${sidebarCategories.size}`);

const sorted = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]);

console.log('\nTop categories (count, label):');
for (const [cat, count] of sorted.slice(0, 50)) {
  console.log(String(count).padStart(3, ' '), cat);
}

if (missingCategory.length) {
  console.log('\nMissing category examples:');
  for (const rel of missingCategory.slice(0, 30)) {
    console.log('-', rel);
  }
}

if (sidebarCategories.size) {
  const mdCats = new Set(categoryCounts.keys());
  const onlyInMd = [...mdCats].filter((c) => !sidebarCategories.has(c)).sort();
  const onlyInSidebar = [...sidebarCategories].filter((c) => !mdCats.has(c)).sort();

  console.log('\nCategories only in Markdown frontmatter:');
  for (const c of onlyInMd) console.log('-', c);

  console.log('\nCategories only in SIDEBAR_URLS:');
  for (const c of onlyInSidebar) console.log('-', c);
}
