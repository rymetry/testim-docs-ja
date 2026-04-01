/**
 * MadCap Flare TOC data parser.
 *
 * Fetches and parses the Table of Contents data files that MadCap Flare
 * generates for WebHelp2 output. The TOC consists of:
 *   - Main.js: tree structure (indices + chunk references)
 *   - Main_ChunkN.js: page details (URL → {index, title, breadcrumb})
 *
 * @module madcap_toc
 */

const DEFAULT_BASE_URL = 'https://docs.tricentis.com/testim';
const TOC_PATH = 'Data/Tocs';
const DEFAULT_USER_AGENT = 'testim-docs-ja-snapshot/1.0';
const FETCH_TIMEOUT_MS = 30_000;

/**
 * Regex matching docs.tricentis.com content URLs ending in .htm.
 * Intentionally omits /g to avoid shared lastIndex state across callers;
 * use `matchAllTricentisUrls()` for matchAll iteration.
 */
export const TRICENTIS_URL_RE = /https:\/\/docs\.tricentis\.com\/testim\/content\/[^\s]+\.htm/;

/** Return all Tricentis content URL matches from the given text. */
export function matchAllTricentisUrls(text) {
  return text.matchAll(new RegExp(TRICENTIS_URL_RE, 'g'));
}

/**
 * Parse a MadCap Flare AMD module (`define({...})`) and return the inner object.
 *
 * Normalizes the JS object literal to valid JSON by:
 * 1. Stripping the `define(...)` wrapper
 * 2. Quoting unquoted property keys
 * 3. Converting single-quoted strings to double-quoted
 */
export function parseAmdModule(jsText) {
  // Strip define(...) wrapper
  const inner = jsText
    .replace(/^\s*define\s*\(\s*/, '')
    .replace(/\s*\)\s*;?\s*$/, '');

  // Quote unquoted property keys: {key: → {"key":
  const quotedKeys = inner.replace(
    /([{,])\s*([a-zA-Z_]\w*)\s*:/g,
    '$1"$2":',
  );

  // Convert single-quoted strings to double-quoted
  // Handles escaped single quotes within strings
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
 * Build a reverse lookup: index → { url, title } from chunk data.
 *
 * Chunk data is keyed by URL path, with values { i: [index], t: [title], b: [breadcrumb] }.
 * MadCap Flare stores section-only headings (nodes with no own page) in a
 * special `___` entry whose `i` and `t` arrays contain multiple parallel
 * elements — one per heading.  Regular page entries have a single element.
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
 * Walk the TOC tree and build a flat list of sections with their pages.
 *
 * Top-level nodes in the tree correspond to sidebar sections (Overview, Getting Started, etc.).
 * Their children are the pages within each section.
 *
 * @param {{ n: Array<{ i: number (index), c: number (chunk), n?: Array (children) }> }} tree
 * @param {Map<number, { url: string, title: string }>} lookup
 * @returns {Array<{ title: string, url: string, pages: Array<{ title: string, url: string, slug: string }> }>}
 */
// Slugs that correspond to site-level pages, not documentation content.
const NON_DOC_SLUGS = new Set(['home']);

export function buildSections(tree, lookup) {
  // Pass 1: collect child pages for every section and gather all child slugs.
  // Child pages (from collectPages) always take priority over leaf promotions.
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

  // Pass 2: promote leaf nodes only if their slug doesn't collide with any
  // child page or a previously promoted leaf.
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

/**
 * Recursively collect all pages from a subtree (immutable).
 */
function collectPages(children, lookup) {
  return children.flatMap((child) => {
    const info = lookup.get(child.i);
    if (!info) return [];
    const slug = extractSlug(info.url);
    const self = { title: info.title, url: info.url, slug };
    return child.n ? [self, ...collectPages(child.n, lookup)] : [self];
  });
}

/**
 * Extract path-based slug from a MadCap Flare content URL path.
 * `/content/overview/testim-overview/index.htm` → `overview/testim-overview`
 * `/content/overview/testim-automate.htm`       → `overview/testim-automate`
 * `/content/integrations/visual-validation/lambdatest_integration.htm` → `integrations/visual-validation/lambdatest_integration`
 */
export function extractSlug(urlPath) {
  const match = urlPath.match(/\/content\/(.+?)(?:\/index)?\.htm$/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Resolve a relative TOC URL path to an absolute URL.
 * `/content/overview/testim-overview/index.htm`
 *   → `https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm`
 */
export function resolveUrl(urlPath, baseUrl = DEFAULT_BASE_URL) {
  if (urlPath.startsWith('/')) {
    return `${baseUrl}${urlPath}`;
  }
  return `${baseUrl}/${urlPath}`;
}

/**
 * Fetch a single TOC JS file and parse it.
 */
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
 * Fetch and parse the complete MadCap Flare TOC structure.
 *
 * @param {object} [options]
 * @param {string} [options.baseUrl] - Base URL of the help system
 * @param {Function} [options.fetchFn] - Injectable fetch function for testing
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
 * Build a sidebar JSON snapshot from TOC sections.
 * Used by snapshot_update.mjs for sidebar change detection.
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

/**
 * Extract all page slugs from a sidebar JSON snapshot.
 */
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
