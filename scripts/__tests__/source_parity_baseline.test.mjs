/**
 * Tests for the Phase 6A frozen baseline mechanism.
 *
 * Pure-function tests for schema validation, lookup key generation, and
 * page-level invalidation. The integration into check_source_parity.mjs
 * lives in source_parity_acknowledgements.test.mjs (summary accounting)
 * and the runtime tests.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateBaseline,
  buildBaselineKey,
  buildBaselineKeyFromEntry,
  tagIssuesWithBaseline,
  BASELINE_ELIGIBLE_TYPES,
  INCONCLUSIVE_CATEGORIES,
} from '../lib/source_parity_baseline.mjs';

const VALID_FINGERPRINT = 'sha256:' + 'a'.repeat(64);
const OTHER_FINGERPRINT = 'sha256:' + 'b'.repeat(64);

const validMissingEntry = {
  slug: 'overview/example',
  issueType: 'segment-missing',
  sectionPath: 'Setup',
  segmentKind: 'paragraph',
  enSegmentIndex: 2,
  jaSegmentIndex: null,
  snapshotFingerprint: VALID_FINGERPRINT,
  inconclusiveCategory: null,
  inconclusiveReason: null,
  reviewAfter: '2026-10-06',
};

const validExtraEntry = {
  slug: 'overview/example',
  issueType: 'segment-extra',
  sectionPath: 'Setup',
  segmentKind: 'paragraph',
  enSegmentIndex: null,
  jaSegmentIndex: 3,
  snapshotFingerprint: VALID_FINGERPRINT,
  inconclusiveCategory: null,
  inconclusiveReason: null,
  reviewAfter: '2026-10-06',
};

const validInconclusiveEntry = {
  slug: 'testops/pull-requests',
  issueType: 'segment-inconclusive',
  sectionPath: null,
  segmentKind: null,
  enSegmentIndex: null,
  jaSegmentIndex: null,
  snapshotFingerprint: VALID_FINGERPRINT,
  inconclusiveCategory: 'heading-count-mismatch',
  inconclusiveReason: 'Heading count mismatch: EN has 0 headings, JA has 5',
  reviewAfter: '2026-10-06',
};

// ---------------------------------------------------------------------------
// constants
// ---------------------------------------------------------------------------

describe('BASELINE_ELIGIBLE_TYPES', () => {
  it('contains all 6 Phase 6A baseline-eligible types', () => {
    assert.ok(BASELINE_ELIGIBLE_TYPES.has('segment-missing'));
    assert.ok(BASELINE_ELIGIBLE_TYPES.has('segment-extra'));
    assert.ok(BASELINE_ELIGIBLE_TYPES.has('segment-shifted'));
    assert.ok(BASELINE_ELIGIBLE_TYPES.has('segment-untranslated'));
    assert.ok(BASELINE_ELIGIBLE_TYPES.has('segment-token-gap'));
    assert.ok(BASELINE_ELIGIBLE_TYPES.has('segment-inconclusive'));
  });

  it('does NOT contain repo-local issue types', () => {
    assert.ok(!BASELINE_ELIGIBLE_TYPES.has('source-page-missing-local'));
    assert.ok(!BASELINE_ELIGIBLE_TYPES.has('paragraph-count-mismatch'));
    assert.ok(!BASELINE_ELIGIBLE_TYPES.has('untranslated'));
  });
});

describe('INCONCLUSIVE_CATEGORIES', () => {
  it('contains the three valid categories', () => {
    assert.ok(INCONCLUSIVE_CATEGORIES.has('heading-count-mismatch'));
    assert.ok(INCONCLUSIVE_CATEGORIES.has('align-exception'));
    assert.ok(INCONCLUSIVE_CATEGORIES.has('tokenless-near-tie'));
  });

  it('does NOT contain unknown categories', () => {
    assert.ok(!INCONCLUSIVE_CATEGORIES.has('unknown'));
    assert.ok(!INCONCLUSIVE_CATEGORIES.has('null'));
  });
});

// ---------------------------------------------------------------------------
// validateBaseline — schema invariants
// ---------------------------------------------------------------------------

describe('validateBaseline', () => {
  it('accepts a valid baseline with mixed entry types', () => {
    const parsed = {
      schemaVersion: 1,
      generatedAt: '2026-04-06T03:00:00Z',
      generatedFromRunId: '2026-04-06T03:00:00Z#abcd1234',
      rationale: 'preview baseline',
      entries: [validMissingEntry, validExtraEntry, validInconclusiveEntry],
    };
    const result = validateBaseline(parsed);
    assert.equal(result, parsed);
  });

  it('throws on missing schemaVersion', () => {
    assert.throws(() => validateBaseline({ entries: [] }), /schemaVersion/);
  });

  it('throws on unsupported schemaVersion', () => {
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [] }),
      /schemaVersion/,
    );
  });

  it('throws on missing entries array', () => {
    assert.throws(() => validateBaseline({ schemaVersion: 1 }), /entries/);
  });

  it('throws on unknown issueType (not in BASELINE_ELIGIBLE_TYPES)', () => {
    const entry = { ...validMissingEntry, issueType: 'paragraph-count-mismatch' };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /issueType/,
    );
  });

  it('throws on invalid snapshotFingerprint format', () => {
    const entry = { ...validMissingEntry, snapshotFingerprint: 'not-a-hash' };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /snapshotFingerprint/,
    );
  });

  it('throws on segment-missing entry without enSegmentIndex', () => {
    const entry = { ...validMissingEntry, enSegmentIndex: null };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /enSegmentIndex/,
    );
  });

  it('throws on segment-extra entry without jaSegmentIndex', () => {
    const entry = { ...validExtraEntry, jaSegmentIndex: null };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /jaSegmentIndex/,
    );
  });

  it('throws on segment-untranslated entry without jaSegmentIndex (JA-owned)', () => {
    const entry = {
      ...validMissingEntry,
      issueType: 'segment-untranslated',
      enSegmentIndex: null,
      jaSegmentIndex: null,
    };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /jaSegmentIndex/,
    );
  });

  it('accepts a valid segment-untranslated entry with jaSegmentIndex only', () => {
    const entry = {
      ...validMissingEntry,
      issueType: 'segment-untranslated',
      enSegmentIndex: null,
      jaSegmentIndex: 4,
    };
    const parsed = { schemaVersion: 1, entries: [entry] };
    assert.doesNotThrow(() => validateBaseline(parsed));
  });

  it('throws on segment-inconclusive entry with unknown inconclusiveCategory', () => {
    const entry = { ...validInconclusiveEntry, inconclusiveCategory: 'unknown' };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /inconclusiveCategory/,
    );
  });

  it('throws on segment-inconclusive entry with null inconclusiveCategory', () => {
    const entry = { ...validInconclusiveEntry, inconclusiveCategory: null };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /inconclusiveCategory/,
    );
  });

  it('throws on reviewAfter that is not strict YYYY-MM-DD', () => {
    const entry = { ...validMissingEntry, reviewAfter: '2026-10-6' };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /reviewAfter/,
    );
  });

  it('throws on reviewAfter that is an impossible calendar date', () => {
    const entry = { ...validMissingEntry, reviewAfter: '2026-02-31' };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /reviewAfter/,
    );
  });
});

// ---------------------------------------------------------------------------
// buildBaselineKey / buildBaselineKeyFromEntry — lookup key generation
// ---------------------------------------------------------------------------

describe('buildBaselineKey / buildBaselineKeyFromEntry', () => {
  it('produces the same key from an issue and its corresponding baseline entry (segment-missing)', () => {
    const issue = {
      type: 'segment-missing',
      sectionPath: 'Setup',
      segmentKind: 'paragraph',
      enSegmentIndex: 2,
      jaSegmentIndex: null,
    };
    const issueKey = buildBaselineKey('overview/example', issue);
    const entryKey = buildBaselineKeyFromEntry(validMissingEntry);
    assert.equal(issueKey, entryKey);
  });

  it('uses jaSegmentIndex (not enSegmentIndex) for segment-extra', () => {
    const issue = {
      type: 'segment-extra',
      sectionPath: 'Setup',
      segmentKind: 'paragraph',
      enSegmentIndex: null,
      jaSegmentIndex: 3,
    };
    const issueKey = buildBaselineKey('overview/example', issue);
    const entryKey = buildBaselineKeyFromEntry(validExtraEntry);
    assert.equal(issueKey, entryKey);
    assert.match(issueKey, /segment-extra/);
    assert.ok(!issueKey.includes('|en|'));
  });

  it('uses jaSegmentIndex for segment-untranslated (JA-owned diff)', () => {
    const issue = {
      type: 'segment-untranslated',
      sectionPath: 'Setup',
      segmentKind: 'paragraph',
      enSegmentIndex: null,
      jaSegmentIndex: 4,
    };
    const entry = {
      slug: 'overview/example',
      issueType: 'segment-untranslated',
      sectionPath: 'Setup',
      segmentKind: 'paragraph',
      enSegmentIndex: null,
      jaSegmentIndex: 4,
      snapshotFingerprint: VALID_FINGERPRINT,
      inconclusiveCategory: null,
      inconclusiveReason: null,
      reviewAfter: '2026-10-06',
    };
    const issueKey = buildBaselineKey('overview/example', issue);
    const entryKey = buildBaselineKeyFromEntry(entry);
    assert.equal(issueKey, entryKey);
    assert.ok(issueKey.includes('|ja|'));
    assert.ok(!issueKey.includes('|en|'));
  });

  it('uses inconclusiveCategory only for segment-inconclusive', () => {
    const issue = {
      type: 'segment-inconclusive',
      sectionPath: null,
      segmentKind: null,
      enSegmentIndex: null,
      jaSegmentIndex: null,
      inconclusiveCategory: 'heading-count-mismatch',
    };
    const issueKey = buildBaselineKey('testops/pull-requests', issue);
    const entryKey = buildBaselineKeyFromEntry(validInconclusiveEntry);
    assert.equal(issueKey, entryKey);
    assert.match(issueKey, /heading-count-mismatch/);
  });

  it('uses enSegmentIndex (NOT jaSegmentIndex) for segment-shifted', () => {
    const shiftedEntry = {
      ...validMissingEntry,
      issueType: 'segment-shifted',
      enSegmentIndex: 5,
      jaSegmentIndex: 8,
    };
    const issue = {
      type: 'segment-shifted',
      sectionPath: 'Setup',
      segmentKind: 'paragraph',
      enSegmentIndex: 5,
      jaSegmentIndex: 8,
    };
    const issueKey = buildBaselineKey('overview/example', issue);
    const entryKey = buildBaselineKeyFromEntry(shiftedEntry);
    assert.equal(issueKey, entryKey);
    // Changing JA index alone must NOT change the key
    const issueShiftedJa = { ...issue, jaSegmentIndex: 9 };
    const issueKeyShiftedJa = buildBaselineKey('overview/example', issueShiftedJa);
    assert.equal(issueKeyShiftedJa, issueKey);
  });
});

// ---------------------------------------------------------------------------
// tagIssuesWithBaseline — match + page-level invalidation
// ---------------------------------------------------------------------------

describe('tagIssuesWithBaseline', () => {
  function makeIssue(overrides = {}) {
    return {
      type: 'segment-missing',
      severity: 'actionable',
      detail: '[Setup] EN paragraph not found',
      sectionPath: 'Setup',
      segmentKind: 'paragraph',
      enSegmentIndex: 2,
      jaSegmentIndex: null,
      ...overrides,
    };
  }

  it('tags a matching issue with baselined: true when fingerprint matches', () => {
    const issues = [makeIssue()];
    const result = tagIssuesWithBaseline(
      'overview/example',
      issues,
      [validMissingEntry],
      VALID_FINGERPRINT,
    );
    assert.equal(result.tagged.length, 1);
    assert.equal(result.tagged[0].baselined, true);
    assert.equal(result.invalidated, false);
  });

  it('does NOT tag and reports invalidated when fingerprint differs', () => {
    const issues = [makeIssue()];
    const result = tagIssuesWithBaseline(
      'overview/example',
      issues,
      [validMissingEntry],
      OTHER_FINGERPRINT,
    );
    assert.equal(result.tagged[0].baselined, undefined);
    assert.equal(result.invalidated, true);
  });

  it('invalidates ALL entries on a page when fingerprint differs (page-level invalidation)', () => {
    const issue1 = makeIssue();
    const issue2 = makeIssue({ enSegmentIndex: 5 });
    const entry2 = { ...validMissingEntry, enSegmentIndex: 5 };
    const result = tagIssuesWithBaseline(
      'overview/example',
      [issue1, issue2],
      [validMissingEntry, entry2],
      OTHER_FINGERPRINT,
    );
    assert.equal(result.tagged[0].baselined, undefined);
    assert.equal(result.tagged[1].baselined, undefined);
    assert.equal(result.invalidated, true);
  });

  it('does not tag entries from other slugs', () => {
    const issues = [makeIssue()];
    const otherEntry = { ...validMissingEntry, slug: 'other/page' };
    const result = tagIssuesWithBaseline(
      'overview/example',
      issues,
      [otherEntry],
      VALID_FINGERPRINT,
    );
    assert.equal(result.tagged[0].baselined, undefined);
    assert.equal(result.invalidated, false);
  });

  it('preserves all original issue fields when tagging', () => {
    const issues = [makeIssue({ extra: 'field', missingTokens: ['--proxy'] })];
    const result = tagIssuesWithBaseline(
      'overview/example',
      issues,
      [validMissingEntry],
      VALID_FINGERPRINT,
    );
    assert.equal(result.tagged[0].extra, 'field');
    assert.deepEqual(result.tagged[0].missingTokens, ['--proxy']);
    assert.equal(result.tagged[0].baselined, true);
  });

  it('does not mutate input arrays (immutable)', () => {
    const issues = [makeIssue()];
    const issuesBefore = JSON.stringify(issues);
    tagIssuesWithBaseline('overview/example', issues, [validMissingEntry], VALID_FINGERPRINT);
    assert.equal(JSON.stringify(issues), issuesBefore);
  });

  it('returns matchedKeys that can be used for paydown reporting', () => {
    const issues = [makeIssue()];
    const result = tagIssuesWithBaseline(
      'overview/example',
      issues,
      [validMissingEntry],
      VALID_FINGERPRINT,
    );
    assert.ok(result.matchedKeys instanceof Set);
    assert.equal(result.matchedKeys.size, 1);
  });

  it('handles empty issues array gracefully', () => {
    const result = tagIssuesWithBaseline(
      'overview/example',
      [],
      [validMissingEntry],
      VALID_FINGERPRINT,
    );
    assert.deepEqual(result.tagged, []);
    assert.equal(result.invalidated, false);
  });

  it('handles slug with no baseline entries (no invalidation, no tagging)', () => {
    const issues = [makeIssue()];
    const result = tagIssuesWithBaseline(
      'overview/example',
      issues,
      [],
      VALID_FINGERPRINT,
    );
    assert.equal(result.tagged[0].baselined, undefined);
    assert.equal(result.invalidated, false);
  });
});
