// scripts/lib/parity_normalize.mjs
/**
 * URL rewrite rules for parity comparison.
 *
 * Normalizes URL tokens deterministically so that localized-link differences
 * between EN and JA do not generate false segment-token-gap issues.
 *
 * @module parity_normalize
 */

const HELP_TESTIM_RE = /^(?:https?:\/\/)?help\.testim\.io(\/docs\/[^\s)]+)/;
const TRICENTIS_DOCS_RE =
  /^https?:\/\/docs\.tricentis\.com\/testim\/content\/Topics\/Help\/(.+?)\.htm(#[^\s)]*)?$/;

export function normalizeUrlForParity(url) {
  if (typeof url !== 'string' || url.length === 0) return url;

  const helpMatch = url.match(HELP_TESTIM_RE);
  if (helpMatch) return helpMatch[1];

  const tricentisMatch = url.match(TRICENTIS_DOCS_RE);
  if (tricentisMatch) return `/docs/${tricentisMatch[1]}${tricentisMatch[2] ?? ''}`;

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
