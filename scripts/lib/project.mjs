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
const DOCS_PREFIX = path.join('src', 'content', 'docs') + path.sep;

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
    const rel = relativePath.startsWith(DOCS_PREFIX)
      ? relativePath.slice(DOCS_PREFIX.length).replace(/\.md$/, '')
      : path.basename(relativePath, '.md');
    return _cachedSlugSet.has(rel);
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
        const slug = path.relative(docsDir, full).replace(/\.md$/, '');
        const categoryFolder = path.basename(path.dirname(full));
        index[slug] = { categoryFolder, filePath: full };
      }
    }
  };
  walk(docsDir);
  return index;
}

/**
 * Resolve a CLI --slug value to a path-based slug.
 * Accepts both basename ("testim-overview") and path-based ("overview/testim-overview").
 * Returns null if the slug is not found or is ambiguous (logs a warning for ambiguity).
 *
 * @param {string | null | undefined} input
 * @param {string} [docsDir]
 * @returns {string | null}
 */
export function resolveSlug(input, docsDir = DOCS_DIR) {
  if (!input) return null;
  const index = buildSlugIndex(docsDir);
  // Exact match (already path-based)
  if (index[input]) return input;
  // Basename resolution: find all entries whose basename matches
  const basename = input.includes('/') ? null : input;
  if (!basename) return null;
  const matches = Object.keys(index).filter(
    (slug) => slug.split('/').pop() === basename
  );
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    console.warn(
      `⚠️  Ambiguous slug "${input}" matches multiple paths: ${matches.join(', ')}. Use full path.`
    );
    return null;
  }
  return null;
}

const SOURCE_URL_RE = /^https:\/\/docs\.tricentis\.com\/testim\/content\/([a-z0-9_-]+(?:\/[a-z0-9_-]+)*)\.htm$/;

/**
 * Extract the EN content path from a sourceUrl.
 *
 * Examples:
 *   ".../content/running-tests/play-from-here.htm"          → "running-tests/play-from-here"
 *   ".../content/running-tests/play-from-here/index.htm"    → "running-tests/play-from-here"
 *   ".../content/overview/testim-overview/use-ai/index.htm"  → "overview/testim-overview/use-ai"
 *
 * Returns null for non-matching URLs or non-string input.
 * @param {string | undefined | null} sourceUrl
 * @returns {string | null}
 */
export function extractSourceContentPath(sourceUrl) {
  if (typeof sourceUrl !== 'string') return null;
  const m = SOURCE_URL_RE.exec(sourceUrl);
  if (!m) return null;
  const raw = m[1];
  return raw.endsWith('/index') ? raw.slice(0, -'/index'.length) : raw;
}

/**
 * Richer doc index that includes the EN source content path from frontmatter.
 * Keys are path-based slugs (e.g., "overview/testim-overview").
 * @param {string} [docsDir]
 * @returns {Record<string, {filePath:string, localFolder:string, sourceContentPath:string|null}>}
 */
export function buildDocsIndex(docsDir = DOCS_DIR) {
  /** @type {Record<string, {filePath:string, localFolder:string, sourceContentPath:string|null}>} */
  const index = {};
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) { walk(full); continue; }
      if (!ent.isFile() || !ent.name.endsWith('.md')) continue;
      const slug = path.relative(docsDir, full).replace(/\.md$/, '');
      const localFolder = path.basename(path.dirname(full));
      const raw = fs.readFileSync(full, 'utf8');
      const { data } = matter(raw);
      const sourceContentPath = extractSourceContentPath(data.sourceUrl);
      index[slug] = { filePath: full, localFolder, sourceContentPath };
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

