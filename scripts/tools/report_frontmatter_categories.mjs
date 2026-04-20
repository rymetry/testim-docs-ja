import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { DOCS_DIR, SIDEBAR_PATH, findMdFiles } from '../lib/project.mjs';
import { extractJapaneseLabel, loadSidebarSections } from '../lib/sidebar.mjs';

const docsRoot = DOCS_DIR;
const sidebarPath = SIDEBAR_PATH;

function readSidebarCategories() {
  if (!fs.existsSync(sidebarPath)) return new Set();
  const sections = loadSidebarSections(sidebarPath);
  const out = new Set();
  for (const section of sections) {
    out.add(extractJapaneseLabel(section.rawTitle));
  }
  return out;
}

const files = findMdFiles(docsRoot);
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
