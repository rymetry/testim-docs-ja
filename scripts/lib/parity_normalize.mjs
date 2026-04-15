// scripts/lib/parity_normalize.mjs
/**
 * URL rewrite rules for parity comparison.
 *
 * Normalizes URL tokens deterministically so that localized-link differences
 * between EN and JA do not generate false segment-token-gap issues.
 *
 * @module parity_normalize
 */

// help.testim.io の protocol + host prefix (path 以降は DOCS_PATH_RE で canonicalize)。
const HELP_TESTIM_PREFIX_RE = /^(?:https?:\/\/)?help\.testim\.io/;
// /docs/... path の canonical form を分解:
//   group 1: path (trailing slash / ?query / #fragment を含まない)
//   group 2: 任意の ?query (canonicalize で drop、保持しない)
//   group 3: 任意の #fragment (保持)
const DOCS_PATH_RE = /^(\/docs\/[^\s)?#]+?)\/?(\?[^\s)#]*)?(#[^\s)]*)?$/;
// Matches any path under /testim/content/ (canonical repo URL form: /{category}/{slug}.htm).
// Legacy /Topics/Help/ URLs are also matched by this broader regex and produce their literal
// path translation (e.g. Topics/Help/loops → /docs/Topics/Help/loops) since that URL form
// is not actually used in the repo.
const TRICENTIS_DOCS_RE =
  /^https?:\/\/docs\.tricentis\.com\/testim\/content\/(.+?)\.htm(#[^\s)]*)?$/;

export function normalizeUrlForParity(url) {
  if (typeof url !== 'string' || url.length === 0) return url;

  // tricentis.com/testim/content/*.htm → /docs/* は先に処理する (fragment 保持)。
  const tricentisMatch = url.match(TRICENTIS_DOCS_RE);
  if (tricentisMatch) {
    // Strip trailing /index so that /foo/index.htm → /docs/foo (directory root).
    const path = tricentisMatch[1].replace(/\/index$/, '');
    return `/docs/${path}${tricentisMatch[2] ?? ''}`;
  }

  // help.testim.io prefix を常に剥がし、/docs/... path で canonicalize を適用する
  // (query drop / trailing slash drop / fragment 保持)。help.testim.io 形式と
  // bare /docs/... 形式が同一 canonical form に揃う。
  const stripped = url.replace(HELP_TESTIM_PREFIX_RE, '');
  const docsMatch = stripped.match(DOCS_PATH_RE);
  if (docsMatch) {
    const [, path, , fragment] = docsMatch;
    return `${path}${fragment ?? ''}`;
  }

  // /docs/ 以外 (例: /v2.0/docs/...) は prefix strip のみ適用 (Stage B5 で別途処理)。
  return stripped;
}

export function canonicalizeDocsUrl(url) {
  return normalizeUrlForParity(url);
}

export function normalizeSegmentTokens(tokens) {
  if (!Array.isArray(tokens)) return [];
  const seen = new Set();
  const out = [];
  for (const t of tokens) {
    const normalized = normalizeUrlForParity(t);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      out.push(normalized);
    }
  }
  return out;
}
