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

import { COARSE_SIGNAL_TYPES, ISSUE_SEVERITY } from './source_parity_types.mjs';

/**
 * Strict YYYY-MM-DD date format. Required for safe lexicographic comparison
 * in `isAcknowledgementExpired` — unpadded forms like `2026-7-6` would break
 * that comparison.
 */
const REVIEW_AFTER_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Issue types that cannot be acknowledged — they represent hard gaps that
 * must be resolved rather than suppressed.
 *
 * @type {ReadonlySet<string>}
 */
export const NON_ACKNOWLEDGEABLE_TYPES = Object.freeze(
  new Set([
    'source-page-missing-local',
    'segment-missing', // segment-level hard gap — 抑制してはならない
    'segment-untranslated', // segment-level hard gap — 抑制してはならない
    'segment-token-gap', // segment-level hard gap — 抑制してはならない
    'segment-inconclusive',
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
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
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

    // coarse audit signals は audit-only に降格されており gate に乗らない。
    // ack を付けても no-op になり、reviewer を「抑制した気にさせる」だけ
    // なので validation で reject する。
    if (COARSE_SIGNAL_TYPES.has(entry.issueType)) {
      throw new Error(
        `${prefix}: issueType "${entry.issueType}" は audit-only coarse signal — acknowledgement は受け付けない (no-op になるため)`,
      );
    }

    if (!(entry.issueType in ISSUE_SEVERITY)) {
      throw new Error(
        `${prefix}: unknown issueType "${entry.issueType}" (not in ISSUE_SEVERITY registry — check for typos)`,
      );
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

    if (!REVIEW_AFTER_RE.test(entry.reviewAfter)) {
      throw new Error(
        `${prefix}: reviewAfter must be strict YYYY-MM-DD format (got "${entry.reviewAfter}")`,
      );
    }
    // Round-trip validate the calendar date to reject impossible dates like
    // "2026-02-31" — Date.parse would silently normalize those to March 3.
    const [year, month, day] = entry.reviewAfter.split('-').map(Number);
    const roundTrip = new Date(Date.UTC(year, month - 1, day));
    if (
      roundTrip.getUTCFullYear() !== year ||
      roundTrip.getUTCMonth() + 1 !== month ||
      roundTrip.getUTCDate() !== day
    ) {
      throw new Error(
        `${prefix}: reviewAfter "${entry.reviewAfter}" is not a valid calendar date`,
      );
    }
  }

  return parsed;
}

/**
 * Check whether an acknowledgement entry has expired.
 *
 * Expiration is checked in priority order:
 * 1. No snapshot available (`currentSnapshotFingerprint === null`)
 * 2. Source content changed (`entry.sourceFingerprint !== currentSnapshotFingerprint`)
 * 3. Review date has passed (`today > entry.reviewAfter`, reviewAfter is inclusive)
 *
 * @param {{ sourceFingerprint: string, reviewAfter: string }} entry
 * @param {string | null} currentSnapshotFingerprint
 * @param {string} today — "YYYY-MM-DD"
 * @returns {{ expired: false } | { expired: true, reason: string }}
 */
export function isAcknowledgementExpired(entry, currentSnapshotFingerprint, today) {
  if (currentSnapshotFingerprint === null) {
    return { expired: true, reason: 'no-snapshot' };
  }
  if (entry.sourceFingerprint !== currentSnapshotFingerprint) {
    return { expired: true, reason: 'fingerprint-changed' };
  }
  if (today.slice(0, 10) > entry.reviewAfter.slice(0, 10)) {
    return { expired: true, reason: 'review-date-passed' };
  }
  return { expired: false };
}

/**
 * Find an acknowledgement entry that matches a specific issue for a given slug.
 * Returns the first matching entry, or null if none match.
 *
 * Match criteria (all must pass):
 * 1. `entry.slug === slug`
 * 2. `entry.issueType === issue.type`
 * 3. If `entry.detailIncludes`: detail must include the string
 * 4. If `entry.detailRegex`: detail must match the regex
 *
 * @param {string} slug
 * @param {{ type: string, detail?: string, text?: string }} issue
 * @param {Array<object>} entries
 * @param {string | null} currentSnapshotFingerprint
 * @param {string} today — "YYYY-MM-DD"
 * @returns {{ entry: object, expired: boolean, expiryReason: string | null } | null}
 */
export function findMatchingAcknowledgement(slug, issue, entries, currentSnapshotFingerprint, today) {
  const detail = issue.detail || issue.text || '';

  for (const entry of entries) {
    if (entry.slug !== slug) continue;
    if (entry.issueType !== issue.type) continue;
    if (entry.detailIncludes && !detail.includes(entry.detailIncludes)) continue;
    if (entry.detailRegex && !new RegExp(entry.detailRegex).test(detail)) continue;

    const expiry = isAcknowledgementExpired(entry, currentSnapshotFingerprint, today);
    return {
      entry,
      expired: expiry.expired,
      expiryReason: expiry.expired ? expiry.reason : null,
    };
  }

  return null;
}

/**
 * Tag issues with acknowledgement metadata. Does NOT filter — all issues are returned.
 * Matched issues receive additional `ack*` fields. Unmatched issues are returned unchanged.
 * Creates a new array (immutable — does not mutate inputs).
 *
 * @param {string} slug
 * @param {Array<object>} issues
 * @param {Array<object>} entries
 * @param {string | null} currentSnapshotFingerprint
 * @param {string} today — "YYYY-MM-DD"
 * @returns {Array<object>}
 */
export function tagIssuesWithAcknowledgements(slug, issues, entries, currentSnapshotFingerprint, today) {
  return issues.map((issue) => {
    const match = findMatchingAcknowledgement(slug, issue, entries, currentSnapshotFingerprint, today);
    if (match === null) {
      return issue;
    }

    const tagged = {
      ...issue,
      acknowledged: true,
      ackReason: match.entry.reason,
      ackOwner: match.entry.owner,
      ackReviewAfter: match.entry.reviewAfter,
      ackExpired: match.expired,
    };

    if (match.expired) {
      tagged.ackExpiryReason = match.expiryReason;
    }

    return tagged;
  });
}
