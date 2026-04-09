import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import matter from 'gray-matter';
import { getSectionSlugSet } from './sidebar.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '..', '..');
export const PROJECT_ROOT = ROOT_DIR;
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

// サイドバー解決のキャッシュ（成功時のみ保存。失敗はキャッシュせずリトライ可能）
const _sectionCache = new Map();
const DOCS_PREFIX = path.join('src', 'content', 'docs') + path.sep;

export function matchesSectionFilter(relativePath, data, sectionFilter) {
  if (!sectionFilter) return true;

  // サイドバーバックド解決（エイリアス対応・成功キャッシュ付き）
  let slugSet = _sectionCache.get(sectionFilter);
  if (!slugSet) {
    try {
      slugSet = getSectionSlugSet(sectionFilter);
      _sectionCache.set(sectionFilter, slugSet);
    } catch (e) {
      if (e.message?.startsWith('Unknown section')) {
        console.warn(`matchesSectionFilter: ${e.message} — falling back to heuristic match`);
      } else {
        console.warn(`matchesSectionFilter: unexpected error: ${e.message}`);
      }
    }
  }

  if (slugSet) {
    const rel = relativePath.startsWith(DOCS_PREFIX)
      ? relativePath.slice(DOCS_PREFIX.length).replace(/\.md$/, '')
      : path.basename(relativePath, '.md');
    return slugSet.has(rel);
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

/**
 * 絶対 `.md` path を path-based slug に変換する。
 * 例: `/.../src/content/docs/overview/testim-overview.md` → `overview/testim-overview`
 */
export function filePathToSlug(filePath, docsDir = DOCS_DIR) {
  return path.relative(docsDir, filePath).replace(/\.md$/, '');
}

/**
 * docs index から basename → path-slug の lookup を lazy-cache で組み立てる。
 * 複数 folder にまたがる basename は `null` にして曖昧さを残す。
 */
const _basenameMapCache = new Map();
export function buildBasenameToPathMap(docsDir = DOCS_DIR) {
  const cached = _basenameMapCache.get(docsDir);
  if (cached) return cached;
  const slugIndex = buildSlugIndex(docsDir);
  const map = new Map();
  for (const slug of Object.keys(slugIndex)) {
    const bn = slug.split('/').pop();
    if (map.has(bn)) {
      map.set(bn, null); // ambiguous
    } else {
      map.set(bn, slug);
    }
  }
  _basenameMapCache.set(docsDir, map);
  return map;
}

/**
 * truncated slug → full slug の解決結果を docsDir 単位で lazy-cache する。
 * temp docs tree を使う test からは `resetProjectCachesForTest()` でクリアする。
 */
const _resolveToFullSlugCache = new Map();

/** module-level cache を全消去する test 専用 API。 */
export function resetProjectCachesForTest() {
  _sectionCache.clear();
  _basenameMapCache.clear();
  _slugIndexCache.clear();
  _resolveToFullSlugCache.clear();
}

/**
 * full slug → `{ categoryFolder, filePath }` の index を lazy cache 付きで返す。
 *
 * `resolveToFullSlug` の呼び出し回数が多いため、docs 走査結果を再利用する。
 */
const _slugIndexCache = new Map();
export function buildSlugIndex(docsDir = DOCS_DIR) {
  const cached = _slugIndexCache.get(docsDir);
  if (cached) return cached;
  /** @type {Record<string, {categoryFolder:string, filePath:string}>} */
  const index = {};
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.isFile() && ent.name.endsWith('.md')) {
        const slug = filePathToSlug(full, docsDir);
        const categoryFolder = path.basename(path.dirname(full));
        index[slug] = { categoryFolder, filePath: full };
      }
    }
  };
  walk(docsDir);
  _slugIndexCache.set(docsDir, index);
  return index;
}

/**
 * 省略形 slug を docs tree 上の full slug に解決する。
 *
 * 解決順:
 *   1. full slug 完全一致
 *   2. basename が一意なら fallback
 *   3. 解決できなければ元の slug を返す
 */
export function resolveToFullSlug(slug, docsDir = DOCS_DIR) {
  let dirCache = _resolveToFullSlugCache.get(docsDir);
  if (!dirCache) {
    dirCache = new Map();
    _resolveToFullSlugCache.set(docsDir, dirCache);
  }

  const cached = dirCache.get(slug);
  if (cached !== undefined) return cached;

  const index = buildSlugIndex(docsDir);
  let resolved;
  if (Object.prototype.hasOwnProperty.call(index, slug)) {
    resolved = slug;
  } else {
    const basename = slug.split('/').pop();
    const basenameMap = buildBasenameToPathMap(docsDir);
    resolved = basenameMap.get(basename) ?? slug;
  }

  dirCache.set(slug, resolved);
  return resolved;
}

/**
 * CLI の `--slug` 値を path-based slug に解決する。
 * basename 入力も受けるが非推奨で、曖昧または未解決なら null を返す。
 */
export function resolveSlug(input, docsDir = DOCS_DIR) {
  if (!input) return null;
  const index = buildSlugIndex(docsDir);
  // すでに path-based ならそのまま返す。
  if (index[input]) return input;
  // basename fallback は非推奨だが後方互換のため残す。
  const basename = input.includes('/') ? null : input;
  if (!basename) return null;
  const matches = Object.keys(index).filter((slug) => slug.split('/').pop() === basename);
  if (matches.length === 1) {
    console.warn(
      `⚠️  Deprecated: basename slug "${input}" resolved to "${matches[0]}". Use the full path-based slug instead.`
    );
    return matches[0];
  }
  if (matches.length > 1) {
    console.warn(
      `⚠️  Ambiguous slug "${input}" matches multiple paths: ${matches.join(', ')}. Use full path.`
    );
    return null;
  }
  return null;
}

const SOURCE_URL_RE =
  /^https:\/\/docs\.tricentis\.com\/testim\/content\/([a-z0-9_-]+(?:\/[a-z0-9_-]+)*)\.htm$/;

/**
 * `sourceUrl` から EN 側の content path を抽出する。
 *
 * 例:
 *   ".../content/running-tests/play-from-here.htm"           → "running-tests/play-from-here"
 *   ".../content/running-tests/play-from-here/index.htm"     → "running-tests/play-from-here"
 *   ".../content/overview/testim-overview/use-ai/index.htm"  → "overview/testim-overview/use-ai"
 *
 * URL が pattern に合わない、または文字列でなければ `null` を返す。
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
 * frontmatter 由来の EN source content path も含めた docs index を組み立てる。
 * key は path-based slug (`overview/testim-overview` など)。
 * @param {string} [docsDir]
 * @returns {Record<string, {filePath:string, localFolder:string, sourceContentPath:string|null}>}
 */
export function buildDocsIndex(docsDir = DOCS_DIR) {
  /** @type {Record<string, {filePath:string, localFolder:string, sourceContentPath:string|null}>} */
  const index = {};
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full);
        continue;
      }
      if (!ent.isFile() || !ent.name.endsWith('.md')) continue;
      const slug = filePathToSlug(full, docsDir);
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
