import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import matter from 'gray-matter';
import { getSectionSlugSet } from './sidebar.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '..', '..');
export const DOCS_DIR = path.join(ROOT_DIR, 'src', 'content', 'docs');
export const SIDEBAR_PATH = path.join(ROOT_DIR, 'docs', 'SIDEBAR_URLS.md');

function normalizeMatchValue(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function findMdFiles(dir = DOCS_DIR) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findMdFiles(fullPath));
      continue;
    }
    if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

export function toRelativeDocPath(filePath) {
  return path.relative(ROOT_DIR, filePath);
}

export function getDocSection(relativePath) {
  const parts = relativePath.split(path.sep);
  return parts[3] ?? '';
}

// サイドバー解決のキャッシュ（同一セクションフィルタの再解決を避ける）
let _cachedFilter = null;
let _cachedSlugSet = null;

export function matchesSectionFilter(relativePath, data, sectionFilter) {
  if (!sectionFilter) return true;

  // サイドバーバックド解決（エイリアス対応・キャッシュ付き）
  if (sectionFilter !== _cachedFilter) {
    _cachedFilter = sectionFilter;
    try {
      _cachedSlugSet = getSectionSlugSet(sectionFilter);
    } catch {
      _cachedSlugSet = null;
    }
  }

  if (_cachedSlugSet) {
    return _cachedSlugSet.has(path.basename(relativePath, '.md'));
  }

  // サイドバーに未登録のセクション名 — ヒューリスティックフォールバック
  const target = normalizeMatchValue(sectionFilter);
  if (!target) return true;

  const candidates = [
    relativePath,
    getDocSection(relativePath),
    data?.category,
    path.basename(relativePath, '.md'),
  ]
    .filter(Boolean)
    .map(normalizeMatchValue);

  return candidates.some((candidate) => candidate.includes(target));
}

export function buildSlugIndex(docsDir = DOCS_DIR) {
  /** @type {Record<string, {categoryFolder:string, filePath:string}>} */
  const index = {};
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.isFile() && ent.name.endsWith('.md')) {
        const slug = ent.name.replace(/\.md$/, '');
        const categoryFolder = path.basename(path.dirname(full));
        index[slug] = { categoryFolder, filePath: full };
      }
    }
  };
  walk(docsDir);
  return index;
}

export function splitFrontmatter(md) {
  if (!md.startsWith('---\n')) return { fm: '', body: md };
  const end = md.indexOf('\n---', 4);
  if (end === -1) return { fm: '', body: md };
  const fm = md.slice(0, end + 4);
  const body = md.slice(end + 4).replace(/^\n+/, '');
  return { fm, body };
}

export function toKebab(str) {
  return String(str)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function readDocFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(content);
  return {
    content,
    body: parsed.content,
    data: parsed.data,
    relativePath: toRelativeDocPath(filePath),
    section: getDocSection(toRelativeDocPath(filePath)),
  };
}

