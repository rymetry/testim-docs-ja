// scripts/lib/parity_normalize.mjs
/**
 * URL rewrite rules for parity comparison.
 *
 * Normalizes URL tokens deterministically so that localized-link differences
 * between EN and JA do not generate false segment-token-gap issues.
 *
 * @module parity_normalize
 */

// Matches help.testim.io URL (protocol optional), capturing:
//   group 1: path starting with /docs/ (no fragment, no trailing slash preserved)
//   group 2: optional #fragment
const HELP_TESTIM_RE =
  /^(?:https?:\/\/)?help\.testim\.io(\/docs\/[^\s)#]+?)\/?(#[^\s)]*)?$/;
// Matches any path under /testim/content/ (canonical repo URL form: /{category}/{slug}.htm).
// Legacy /Topics/Help/ URLs are also matched by this broader regex and produce their literal
// path translation (e.g. Topics/Help/loops → /docs/Topics/Help/loops) since that URL form
// is not actually used in the repo.
const TRICENTIS_DOCS_RE =
  /^https?:\/\/docs\.tricentis\.com\/testim\/content\/(.+?)\.htm(#[^\s)]*)?$/;

export function normalizeUrlForParity(url) {
  if (typeof url !== 'string' || url.length === 0) return url;

  const helpMatch = url.match(HELP_TESTIM_RE);
  if (helpMatch) return `${helpMatch[1]}${helpMatch[2] ?? ''}`;

  const tricentisMatch = url.match(TRICENTIS_DOCS_RE);
  if (tricentisMatch) {
    // Strip trailing /index so that /foo/index.htm → /docs/foo (directory root).
    const path = tricentisMatch[1].replace(/\/index$/, '');
    return `/docs/${path}${tricentisMatch[2] ?? ''}`;
  }

  return url;
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
