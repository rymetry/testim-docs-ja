/**
 * Acknowledgements — fingerprint computation and validation.
 *
 * Pure functions only. No filesystem I/O.
 * Provides SHA-256 fingerprinting for EN snapshots and schema validation
 * for parity-acknowledgements.json files.
 *
 * @module source_parity_acknowledgements
 */

import { createHash } from 'node:crypto';

/**
 * Issue types that cannot be acknowledged — they represent hard gaps that
 * must be resolved rather than suppressed.
 *
 * @type {ReadonlySet<string>}
 */
export const NON_ACKNOWLEDGEABLE_TYPES = Object.freeze(
  new Set([
    'source-page-missing-local',
    'segment-missing',
    'segment-untranslated',
    'segment-token-gap',
  ]),
);

/**
 * Compute a SHA-256 fingerprint of EN snapshot content.
 *
 * @param {string} content — raw snapshot HTML or text content
 * @returns {string} — `sha256:<64 lowercase hex digits>`
 */
export function computeSnapshotFingerprint(content) {
  const hash = createHash('sha256').update(content).digest('hex');
  return `sha256:${hash}`;
}

/**
 * Validate a parsed parity-acknowledgements.json object.
 * Throws a descriptive Error on any schema violation.
 *
 * @param {unknown} parsed — result of JSON.parse
 * @returns {object} — the validated parsed object (same reference)
 */
export function validateAcknowledgements(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Acknowledgements file must be a JSON object');
  }

  if (parsed.schemaVersion !== 1) {
    throw new Error(`Unsupported acknowledgements schemaVersion: ${parsed.schemaVersion}`);
  }

  if (!Array.isArray(parsed.entries)) {
    throw new Error('Acknowledgements must have an "entries" array');
  }

  const REQUIRED_FIELDS = [
    'slug',
    'issueType',
    'sourceFingerprint',
    'reason',
    'owner',
    'reviewAfter',
  ];

  for (let i = 0; i < parsed.entries.length; i += 1) {
    const entry = parsed.entries[i];
    const prefix = `Acknowledgement entry #${i + 1}`;

    for (const field of REQUIRED_FIELDS) {
      if (!entry[field] || typeof entry[field] !== 'string') {
        throw new Error(`${prefix}: missing or invalid "${field}"`);
      }
    }

    if (NON_ACKNOWLEDGEABLE_TYPES.has(entry.issueType)) {
      throw new Error(`${prefix}: issueType "${entry.issueType}" cannot be acknowledged`);
    }

    if (!entry.detailIncludes && !entry.detailRegex) {
      throw new Error(`${prefix}: must specify "detailIncludes" or "detailRegex"`);
    }

    if (entry.detailRegex) {
      try {
        new RegExp(entry.detailRegex); // eslint-disable-line no-new
      } catch {
        throw new Error(`${prefix}: invalid detailRegex: "${entry.detailRegex}"`);
      }
    }

    if (!/^sha256:[0-9a-f]{64}$/.test(entry.sourceFingerprint)) {
      throw new Error(`${prefix}: invalid sourceFingerprint format`);
    }

    if (Number.isNaN(Date.parse(entry.reviewAfter))) {
      throw new Error(`${prefix}: invalid reviewAfter date: "${entry.reviewAfter}"`);
    }
  }

  return parsed;
}
