/**
 * MadCap Flare の TOC data を取得・解析する。
 *
 * WebHelp2 出力の TOC は主に `Main.js` の tree structure と、
 * `Main_ChunkN.js` の page detail で構成される。
 *
 * @module madcap_toc
 */

const DEFAULT_BASE_URL = 'https://docs.tricentis.com/testim';
const TOC_PATH = 'Data/Tocs';
const DEFAULT_USER_AGENT = 'testim-docs-ja-snapshot/1.0';
const FETCH_TIMEOUT_MS = 30_000;

/**
 * `docs.tricentis.com` の `.htm` content URL に一致する正規表現。
 * `/g` は付けず、反復取得は `matchAllTricentisUrls()` 側で行う。
 */
export const TRICENTIS_URL_RE = /https:\/\/docs\.tricentis\.com\/testim\/content\/[^\s]+\.htm/;

/** 与えられた text から Tricentis content URL をすべて返す。 */
export function matchAllTricentisUrls(text) {
  return text.matchAll(new RegExp(TRICENTIS_URL_RE, 'g'));
}

/**
 * MadCap Flare の AMD module (`define({...})`) を解析して内部 object を返す。
 */
export function parseAmdModule(jsText) {
  // `define(...)` wrapper を剥がす。
  const inner = jsText
    .replace(/^\s*define\s*\(\s*/, '')
    .replace(/\s*\)\s*;?\s*$/, '');

  // quote されていない property key を JSON 形式に寄せる。
  const quotedKeys = inner.replace(
    /([{,])\s*([a-zA-Z_]\w*)\s*:/g,
    '$1"$2":',
  );

  // single quote string を double quote に寄せる。
  const doubleQuoted = quotedKeys.replace(
    /'((?:[^'\\]|\\.)*)'/g,
    (_match, content) => `"${content.replace(/"/g, '\\"')}"`,
  );

  try {
    return JSON.parse(doubleQuoted);
  } catch (e) {
    const preview = doubleQuoted.slice(0, 200);
    throw new Error(`parseAmdModule: failed to parse as JSON. Preview: ${preview}... Original: ${e.message}`);
  }
}

/**
 * chunk data から `index → { url, title }` の逆引き表を作る。
 * section 専用見出しは `___` entry に複数要素で入るため、`i[]` と `t[]` を並行に展開する。
 */
export function buildIndexLookup(chunkDataList) {
  const lookup = new Map();
  for (const chunkData of chunkDataList) {
    for (const [urlPath, meta] of Object.entries(chunkData)) {
      if (!meta || !Array.isArray(meta.i) || !Array.isArray(meta.t)) {
        console.warn(`buildIndexLookup: skipping malformed entry for "${urlPath}" (missing i/t arrays)`);
        continue;
      }
      for (let k = 0; k < meta.i.length; k++) {
        lookup.set(meta.i[k], { url: urlPath, title: meta.t[k] ?? '' });
      }
    }
  }
  return lookup;
}

/**
 * TOC tree を走査し、section ごとの page 一覧へ平坦化する。
 *
 * @param {{ n: Array<{ i: number (index), c: number (chunk), n?: Array (children) }> }} tree
 * @param {Map<number, { url: string, title: string }>} lookup
 * @returns {Array<{ title: string, url: string, pages: Array<{ title: string, url: string, slug: string }> }>}
 */
// docs 本文ではなく site-level page に対応する slug。
const NON_DOC_SLUGS = new Set(['home']);

export function buildSections(tree, lookup) {
  // まず child page を集め、leaf promotion と競合する slug を控える。
  const rawSections = [];
  const childSlugs = new Set();

  for (const node of tree.n) {
    const sectionInfo = lookup.get(node.i);
    if (!sectionInfo) continue;

    const pages = collectPages(node.n ?? [], lookup);
    for (const page of pages) {
      if (page.slug) childSlugs.add(page.slug);
    }
    rawSections.push({ sectionInfo, pages });
  }

  // child と衝突しない leaf だけを section page として昇格させる。
  const promotedSlugs = new Set();
  const sections = [];

  for (const { sectionInfo, pages } of rawSections) {
    if (pages.length === 0 && sectionInfo.url) {
      const slug = extractSlug(sectionInfo.url);
      if (slug && !NON_DOC_SLUGS.has(slug) && !childSlugs.has(slug) && !promotedSlugs.has(slug)) {
        pages.push({ title: sectionInfo.title, url: sectionInfo.url, slug });
        promotedSlugs.add(slug);
      }
    }

    sections.push({
      title: sectionInfo.title,
      url: sectionInfo.url,
      pages,
    });
  }

  return sections;
}

/** subtree から page を再帰的に集める。 */
function collectPages(children, lookup) {
  return children.flatMap((child) => {
    const info = lookup.get(child.i);
    if (!info) return [];
    const slug = extractSlug(info.url);
    const self = { title: info.title, url: info.url, slug };
    return child.n ? [self, ...collectPages(child.n, lookup)] : [self];
  });
}

/** MadCap Flare の content URL path から path-based slug を抜き出す。 */
export function extractSlug(urlPath) {
  const match = urlPath.match(/\/content\/(.+?)(?:\/index)?\.htm$/i);
  return match ? match[1].toLowerCase() : null;
}

/** 相対 TOC path を絶対 URL に変換する。 */
export function resolveUrl(urlPath, baseUrl = DEFAULT_BASE_URL) {
  if (urlPath.startsWith('/')) {
    return `${baseUrl}${urlPath}`;
  }
  return `${baseUrl}/${urlPath}`;
}

/** TOC JS file を 1 件取得して解析する。 */
async function fetchTocFile(url, fetchFn) {
  const response = await fetchFn(url, {
    headers: { 'User-Agent': DEFAULT_USER_AGENT },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch TOC file ${url}: HTTP ${response.status}`);
  }
  const text = await response.text();
  return parseAmdModule(text);
}

/**
 * MadCap Flare TOC 全体を取得して解析する。
 *
 * @param {object} [options]
 * @param {string} [options.baseUrl] - help system の base URL
 * @param {Function} [options.fetchFn] - test 用に差し替え可能な fetch
 * @returns {Promise<{ sections: Array, lookup: Map, tree: object }>}
 */
export async function fetchTocData({
  baseUrl = DEFAULT_BASE_URL,
  fetchFn = fetch,
} = {}) {
  const mainUrl = `${baseUrl}/${TOC_PATH}/Main.js`;
  const mainData = await fetchTocFile(mainUrl, fetchFn);

  const { numchunks, prefix, tree } = mainData;

  const results = await Promise.allSettled(
    Array.from({ length: numchunks }, (_, i) =>
      fetchTocFile(`${baseUrl}/${TOC_PATH}/${prefix}${i}.js`, fetchFn),
    ),
  );

  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    const reasons = failed.map((r) => r.reason?.message ?? String(r.reason)).join('; ');
    throw new Error(`Failed to fetch ${failed.length}/${numchunks} TOC chunk(s): ${reasons}`);
  }

  const chunkDataList = results.map((r) => r.value);

  const lookup = buildIndexLookup(chunkDataList);
  const sections = buildSections(tree, lookup);

  return { sections, lookup, tree };
}

/**
 * TOC section から sidebar JSON snapshot を作る。
 *
 * @param {Array<{ title: string, pages: Array<{ slug: string, url: string, title: string }> }>} sections
 * @param {string} [baseUrl]
 * @returns {object} Serializable sidebar snapshot
 */
export function buildSidebarSnapshot(sections, baseUrl = DEFAULT_BASE_URL) {
  return {
    fetchedAt: new Date().toISOString(),
    baseUrl,
    sections: sections.map((section) => ({
      title: section.title,
      pages: section.pages.map((page) => ({
        slug: page.slug,
        url: resolveUrl(page.url, baseUrl),
        title: page.title,
      })),
    })),
  };
}

/** sidebar JSON snapshot から page slug をすべて抜き出す。 */
export function extractSlugsFromSnapshot(sidebarJson) {
  const slugs = new Set();
  if (!sidebarJson?.sections) return slugs;
  for (const section of sidebarJson.sections) {
    for (const page of section.pages ?? []) {
      if (page.slug) slugs.add(page.slug);
    }
  }
  return slugs;
}
