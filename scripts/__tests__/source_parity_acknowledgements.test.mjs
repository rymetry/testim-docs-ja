import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  computeSnapshotFingerprint,
  NON_ACKNOWLEDGEABLE_TYPES,
  validateAcknowledgements,
} from '../lib/source_parity_acknowledgements.mjs';

// ---------------------------------------------------------------------------
// computeSnapshotFingerprint
// ---------------------------------------------------------------------------

describe('computeSnapshotFingerprint', () => {
  it('returns a sha256:<64 hex> string for content', () => {
    const result = computeSnapshotFingerprint('hello world');
    assert.match(result, /^sha256:[0-9a-f]{64}$/);
  });

  it('returns the same hash for the same content', () => {
    const a = computeSnapshotFingerprint('same content');
    const b = computeSnapshotFingerprint('same content');
    assert.equal(a, b);
  });

  it('returns different hashes for different content', () => {
    const a = computeSnapshotFingerprint('content A');
    const b = computeSnapshotFingerprint('content B');
    assert.notEqual(a, b);
  });

  it('handles empty string without throwing', () => {
    const result = computeSnapshotFingerprint('');
    assert.match(result, /^sha256:[0-9a-f]{64}$/);
  });
});

// ---------------------------------------------------------------------------
// NON_ACKNOWLEDGEABLE_TYPES
// ---------------------------------------------------------------------------

describe('NON_ACKNOWLEDGEABLE_TYPES', () => {
  it('contains source-page-missing-local', () => {
    assert.ok(NON_ACKNOWLEDGEABLE_TYPES.has('source-page-missing-local'));
  });

  it('contains segment-missing', () => {
    assert.ok(NON_ACKNOWLEDGEABLE_TYPES.has('segment-missing'));
  });

  it('contains segment-untranslated', () => {
    assert.ok(NON_ACKNOWLEDGEABLE_TYPES.has('segment-untranslated'));
  });

  it('contains segment-token-gap', () => {
    assert.ok(NON_ACKNOWLEDGEABLE_TYPES.has('segment-token-gap'));
  });

  it('does NOT contain paragraph-count-mismatch', () => {
    assert.ok(!NON_ACKNOWLEDGEABLE_TYPES.has('paragraph-count-mismatch'));
  });
});

// ---------------------------------------------------------------------------
// validateAcknowledgements
// ---------------------------------------------------------------------------

const VALID_FINGERPRINT = 'sha256:' + 'a'.repeat(64);

const validEntry = {
  slug: 'overview/testim-overview',
  issueType: 'paragraph-count-mismatch',
  detailIncludes: 'セクション #1',
  sourceFingerprint: VALID_FINGERPRINT,
  reason: 'EN/JA structure difference',
  owner: 'rymetry',
  reviewAfter: '2026-07-06',
};

describe('validateAcknowledgements', () => {
  it('accepts a valid acknowledgements object', () => {
    const parsed = { schemaVersion: 1, entries: [validEntry] };
    const result = validateAcknowledgements(parsed);
    assert.equal(result, parsed);
  });

  it('throws on missing schemaVersion', () => {
    assert.throws(
      () => validateAcknowledgements({ entries: [] }),
      /schemaVersion/,
    );
  });

  it('throws on unsupported schemaVersion', () => {
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 2, entries: [] }),
      /schemaVersion/,
    );
  });

  it('throws on missing entries array', () => {
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1 }),
      /entries/,
    );
  });

  it('throws on non-acknowledgeable issueType (source-page-missing-local)', () => {
    const entry = { ...validEntry, issueType: 'source-page-missing-local' };
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /cannot be acknowledged/,
    );
  });

  it('throws when neither detailIncludes nor detailRegex is specified', () => {
    const { detailIncludes: _removed, ...entry } = validEntry;
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /detailIncludes.*detailRegex|detailRegex.*detailIncludes/,
    );
  });

  it('throws on invalid detailRegex', () => {
    const entry = { ...validEntry, detailRegex: '[invalid(regex' };
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /detailRegex/,
    );
  });

  it('throws on invalid sourceFingerprint format', () => {
    const entry = { ...validEntry, sourceFingerprint: 'notafingerprint' };
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /sourceFingerprint/,
    );
  });

  it('throws on invalid reviewAfter date', () => {
    const entry = { ...validEntry, reviewAfter: 'not-a-date' };
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /reviewAfter/,
    );
  });

  it('throws on missing slug', () => {
    const { slug: _removed, ...entry } = validEntry;
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /slug/,
    );
  });

  it('throws on missing issueType', () => {
    const { issueType: _removed, ...entry } = validEntry;
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /issueType/,
    );
  });

  it('throws on missing sourceFingerprint', () => {
    const { sourceFingerprint: _removed, ...entry } = validEntry;
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /sourceFingerprint/,
    );
  });

  it('throws on missing reason', () => {
    const { reason: _removed, ...entry } = validEntry;
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /reason/,
    );
  });

  it('throws on missing owner', () => {
    const { owner: _removed, ...entry } = validEntry;
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /owner/,
    );
  });

  it('throws on missing reviewAfter', () => {
    const { reviewAfter: _removed, ...entry } = validEntry;
    assert.throws(
      () => validateAcknowledgements({ schemaVersion: 1, entries: [entry] }),
      /reviewAfter/,
    );
  });

  it('accepts entry with detailRegex instead of detailIncludes', () => {
    const { detailIncludes: _removed, ...entry } = validEntry;
    const entryWithRegex = { ...entry, detailRegex: 'セクション #\\d+' };
    const result = validateAcknowledgements({ schemaVersion: 1, entries: [entryWithRegex] });
    assert.ok(result.entries[0].detailRegex);
  });

  it('accepts empty entries array', () => {
    const result = validateAcknowledgements({ schemaVersion: 1, entries: [] });
    assert.deepEqual(result.entries, []);
  });
});
