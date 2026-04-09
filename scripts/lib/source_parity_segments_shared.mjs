/**
 * Shared canonical segment types and helpers.
 *
 * Defines the Segment schema used by the EN HTML and JA markdown extractors,
 * along with text normalization, source fingerprinting, section path tracking,
 * and a createSegment factory.
 *
 * A Segment is the smallest unit that the exact diff engine compares across
 * EN and JA. Gate-eligible kinds are the ones that an exact diff regression
 * (missing / extra / shifted) should fail on. Non-gate kinds (code-block,
 * image) are emitted for reference only.
 *
 * @module source_parity_segments_shared
 */

import { createHash } from 'node:crypto';

import { extractInvariantTokens } from './source_parity_extract.mjs';

// ---------------------------------------------------------------------------
// Segment kind registry
// ---------------------------------------------------------------------------

/** All canonical segment kinds emitted by the extractors. */
export const SEGMENT_KINDS = Object.freeze([
  'heading',
  'paragraph',
  'ordered-list-item',
  'unordered-list-item',
  'callout-body',
  'table-cell',
  'details-summary',
  'image-caption',
  'code-block',
  'image',
]);

const SEGMENT_KIND_SET = new Set(SEGMENT_KINDS);

/**
 * Kinds that participate in the exact diff gate. Code blocks and raw image
 * segments are emitted for reference only and must be filtered out of gate
 * comparisons (invariant tokens capture the essential content instead).
 *
 * `image-caption` is declared in SEGMENT_KINDS for future expansion but is
 * not yet emitted by either extractor, so it stays out of the gate set to
 * avoid "phantom" kind mismatches during boundary benchmarking.
 */
export const GATE_ELIGIBLE_KINDS = Object.freeze([
  'heading',
  'paragraph',
  'ordered-list-item',
  'unordered-list-item',
  'callout-body',
  'table-cell',
  'details-summary',
]);

const GATE_ELIGIBLE_SET = new Set(GATE_ELIGIBLE_KINDS);

/** Return true when a segment of the given kind is gate-eligible. */
export function isGateEligible(kind) {
  return GATE_ELIGIBLE_SET.has(kind);
}

// ---------------------------------------------------------------------------
// Text normalization
// ---------------------------------------------------------------------------

const ZERO_WIDTH_RE = /[\u200B\u200C\u200D\uFEFF]/g;

/**
 * Normalize raw segment text for stable comparison and fingerprinting of the
 * user-visible content (invariant tokens are captured separately).
 *
 * The normalization strips markdown inline formatting, collapses whitespace,
 * removes zero-width characters, and lowercases ASCII letters so that minor
 * formatting differences do not create spurious mismatches.
 *
 * @param {string} raw
 * @returns {string}
 */
export function normalizeSegmentText(raw) {
  if (typeof raw !== 'string' || raw.length === 0) return '';

  let text = raw.replace(ZERO_WIDTH_RE, '');

  // Strip markdown inline formatting while preserving inner text.
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ''); // images (file refs captured elsewhere)
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // links — keep label
  text = text.replace(/`([^`]*)`/g, '$1'); // inline code — keep text
  text = text.replace(/\*\*([^*]*)\*\*/g, '$1'); // bold
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1'); // italic
  text = text.replace(/(?<![a-zA-Z0-9])_([^_\n]+)_(?![a-zA-Z0-9])/g, '$1'); // italic underscore
  text = text.replace(/~~([^~]*)~~/g, '$1'); // strikethrough

  text = text.replace(/\s+/g, ' ').trim();
  return text.toLowerCase();
}

// ---------------------------------------------------------------------------
// Source fingerprint
// ---------------------------------------------------------------------------

/**
 * Compute a deterministic sha256 fingerprint for a raw segment source snippet.
 * CRLF is normalized to LF so cross-platform input produces the same hash.
 *
 * @param {string} raw
 * @returns {string} `sha256:<hex>`
 */
export function computeSegmentFingerprint(raw) {
  const text = typeof raw === 'string' ? raw.replace(/\r\n/g, '\n') : '';
  const hex = createHash('sha256').update(text).digest('hex');
  return `sha256:${hex}`;
}

// ---------------------------------------------------------------------------
// Section path (heading stack)
// ---------------------------------------------------------------------------

/**
 * Push a heading onto an existing stack, returning a NEW stack. The resulting
 * stack truncates any deeper levels and replaces any equal-level entry so the
 * current section path reflects the heading hierarchy.
 *
 * @param {Array<{level: number, text: string}>} stack
 * @param {number} level  1–6
 * @param {string} text
 * @returns {Array<{level: number, text: string}>}
 */
export function pushHeading(stack, level, text) {
  const trimmed = typeof text === 'string' ? text.trim() : '';
  const kept = stack.filter((entry) => entry.level < level);
  return [...kept, { level, text: trimmed }];
}

/**
 * Build the ` > ` joined section path from a heading stack.
 * @param {Array<{level: number, text: string}>} stack
 * @returns {string}
 */
export function buildSectionPath(stack) {
  return stack.map((entry) => entry.text).filter(Boolean).join(' > ');
}

// ---------------------------------------------------------------------------
// Segment factory
// ---------------------------------------------------------------------------

/**
 * @typedef {object} Segment
 * @property {string} sectionPath
 * @property {string} segmentKind
 * @property {number} segmentIndex
 * @property {string} textNorm
 * @property {string[]} tokensInvariant
 * @property {string} sourceFingerprint
 * @property {number | null} line
 */

/**
 * Build a Segment record from raw text. Runs normalization, extracts invariant
 * tokens, and computes a source fingerprint in one place so both extractors
 * produce identically-shaped records.
 *
 * @param {object} args
 * @param {string} args.sectionPath
 * @param {string} args.kind             one of SEGMENT_KINDS
 * @param {number} args.segmentIndex     0-based index within (sectionPath, kind)
 * @param {string} args.rawText          raw segment source text (pre-normalization)
 * @param {number} [args.line]           optional 1-based source line
 * @returns {Segment}
 */
export function createSegment({ sectionPath, kind, segmentIndex, rawText, line = null }) {
  if (!SEGMENT_KIND_SET.has(kind)) {
    throw new Error(`createSegment: unknown segment kind "${kind}"`);
  }
  const raw = typeof rawText === 'string' ? rawText : '';
  return {
    sectionPath: sectionPath ?? '',
    segmentKind: kind,
    segmentIndex,
    textNorm: normalizeSegmentText(raw),
    tokensInvariant: extractInvariantTokens(raw),
    sourceFingerprint: computeSegmentFingerprint(raw),
    line,
  };
}
