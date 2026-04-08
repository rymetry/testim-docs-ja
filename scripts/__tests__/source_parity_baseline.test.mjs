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
  isBaselineExpired,
  BASELINE_ELIGIBLE_TYPES,
  INCONCLUSIVE_CATEGORIES,
  STRUCTURE_CATEGORIES,
  USABILITY_REASONS,
  computeStructureFingerprint,
} from '../lib/source_parity_baseline.mjs';

const VALID_FINGERPRINT = 'sha256:' + 'a'.repeat(64);
const OTHER_FINGERPRINT = 'sha256:' + 'b'.repeat(64);
const EN_SEGMENT_FINGERPRINT = 'sha256:' + 'c'.repeat(64);
const JA_SEGMENT_FINGERPRINT = 'sha256:' + 'd'.repeat(64);
const SHIFTED_JA_FINGERPRINT = 'sha256:' + 'e'.repeat(64);

const validMissingEntry = {
  slug: 'overview/example',
  issueType: 'segment-missing',
  sectionPath: 'Setup',
  segmentKind: 'paragraph',
  enSegmentIndex: 2,
  jaSegmentIndex: null,
  enSourceFingerprint: EN_SEGMENT_FINGERPRINT,
  jaSourceFingerprint: null,
  missingTokens: null,
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
  enSourceFingerprint: null,
  jaSourceFingerprint: JA_SEGMENT_FINGERPRINT,
  missingTokens: null,
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
  enSourceFingerprint: null,
  jaSourceFingerprint: null,
  missingTokens: null,
  snapshotFingerprint: VALID_FINGERPRINT,
  inconclusiveCategory: 'heading-count-mismatch',
  inconclusiveReason: 'Heading count mismatch: EN has 0 headings, JA has 5',
  reviewAfter: '2026-10-06',
};

const validTokenGapEntry = {
  slug: 'overview/example',
  issueType: 'segment-token-gap',
  sectionPath: 'CLI',
  segmentKind: 'paragraph',
  enSegmentIndex: 1,
  jaSegmentIndex: null,
  enSourceFingerprint: EN_SEGMENT_FINGERPRINT,
  jaSourceFingerprint: null,
  missingTokens: ['--proxy'],
  snapshotFingerprint: VALID_FINGERPRINT,
  inconclusiveCategory: null,
  inconclusiveReason: null,
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

  // Issue #247 PR5 — gate cutover で structure mismatch / source unusable を
  // baseline allowlist に追加した。§3.1 参照。emitter / validator / key
  // builder / generator が足並みを揃えて新 type を扱えるようにする必要
  // があるため、allowlist 拡張だけで済まない点に注意。
  it('contains Issue #247 structure-mismatch / source-unusable types (PR5 cutover)', () => {
    for (const type of [
      'section-structure-mismatch',
      'segment-order-mismatch',
      'snapshot-incomplete',
      'source-unusable',
    ]) {
      assert.equal(
        BASELINE_ELIGIBLE_TYPES.has(type),
        true,
        `${type} must be in BASELINE_ELIGIBLE_TYPES after PR5 cutover`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Issue #247 PR5 — validateBaseline — structure mismatch entries
//
// PR5 cutover で structure mismatch を baseline 可能にした。identity surface
// は §3.2 に従い sectionIndex + structureCategory + structureFingerprint。
// sectionPath は reviewer 可読性のための必須フィールドだが identity key
// には含めない (同一ページ内で一意の保証が無いため — Finding 2)。
// ---------------------------------------------------------------------------

describe('Issue #247 PR5 — validateBaseline — structure mismatch entries', () => {
  const VALID_PR5_FP = 'sha256:' + 'f'.repeat(64);
  const STRUCTURE_FP = 'sha256:' + '1'.repeat(64);

  function baseStructureEntry(overrides = {}) {
    return {
      slug: 'running-tests/the-command-line-cli',
      issueType: 'section-structure-mismatch',
      snapshotFingerprint: VALID_PR5_FP,
      reviewAfter: '2026-10-06',
      sectionIndex: 7,
      sectionPath: 'CLI Installation > Basic CLI command',
      structureCategory: 'kind-multiset',
      structureFingerprint: STRUCTURE_FP,
      ...overrides,
    };
  }

  it('accepts a valid section-structure-mismatch entry (kind-multiset)', () => {
    const entry = baseStructureEntry();
    assert.doesNotThrow(() =>
      validateBaseline({ schemaVersion: 1, entries: [entry] }),
    );
  });

  it('accepts a valid segment-order-mismatch entry (content-order)', () => {
    const entry = baseStructureEntry({
      issueType: 'segment-order-mismatch',
      structureCategory: 'content-order',
    });
    assert.doesNotThrow(() =>
      validateBaseline({ schemaVersion: 1, entries: [entry] }),
    );
  });

  it('accepts a structure entry with empty string sectionPath (preface section)', () => {
    const entry = baseStructureEntry({ sectionPath: '' });
    assert.doesNotThrow(() =>
      validateBaseline({ schemaVersion: 1, entries: [entry] }),
    );
  });

  it('throws on missing sectionIndex (machine identity key must be present)', () => {
    const entry = baseStructureEntry();
    delete entry.sectionIndex;
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /sectionIndex/,
    );
  });

  it('throws on non-integer sectionIndex', () => {
    const entry = baseStructureEntry({ sectionIndex: 1.5 });
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /sectionIndex/,
    );
  });

  it('throws on negative sectionIndex', () => {
    const entry = baseStructureEntry({ sectionIndex: -1 });
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /sectionIndex/,
    );
  });

  it('throws on string sectionIndex', () => {
    const entry = baseStructureEntry({ sectionIndex: '7' });
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /sectionIndex/,
    );
  });

  it('throws on missing sectionPath (reviewer readability field is required)', () => {
    const entry = baseStructureEntry();
    delete entry.sectionPath;
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /sectionPath/,
    );
  });

  it('throws on invalid structureCategory enum', () => {
    const entry = baseStructureEntry({ structureCategory: 'unknown' });
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /structureCategory/,
    );
  });

  it('throws on malformed structureFingerprint (not sha256 hex)', () => {
    const entry = baseStructureEntry({ structureFingerprint: 'not-a-hash' });
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /structureFingerprint/,
    );
  });
});

// ---------------------------------------------------------------------------
// Issue #247 PR5 — validateBaseline — source unusable entries
//
// source unusable は page 粒度の issue。identity surface は usabilityReason
// のみ (§3.3)。sectionPath / structureCategory / structureFingerprint は
// 持たない。
// ---------------------------------------------------------------------------

describe('Issue #247 PR5 — validateBaseline — source unusable entries', () => {
  const VALID_PR5_FP = 'sha256:' + 'f'.repeat(64);

  function baseSourceUnusableEntry(overrides = {}) {
    return {
      slug: 'salesforce-testing/faq',
      issueType: 'source-unusable',
      snapshotFingerprint: VALID_PR5_FP,
      reviewAfter: '2026-10-06',
      usabilityReason: 'escaped-details-residue',
      ...overrides,
    };
  }

  it('accepts a valid source-unusable entry (escaped-details-residue)', () => {
    const entry = baseSourceUnusableEntry();
    assert.doesNotThrow(() =>
      validateBaseline({ schemaVersion: 1, entries: [entry] }),
    );
  });

  it('accepts a valid snapshot-incomplete entry (shallow-snapshot)', () => {
    const entry = baseSourceUnusableEntry({
      issueType: 'snapshot-incomplete',
      usabilityReason: 'shallow-snapshot',
    });
    assert.doesNotThrow(() =>
      validateBaseline({ schemaVersion: 1, entries: [entry] }),
    );
  });

  it('throws on invalid usabilityReason enum', () => {
    const entry = baseSourceUnusableEntry({ usabilityReason: 'unknown' });
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /usabilityReason/,
    );
  });

  it('throws on missing usabilityReason', () => {
    const entry = baseSourceUnusableEntry();
    delete entry.usabilityReason;
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /usabilityReason/,
    );
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

  it('throws on segment-missing entry without enSourceFingerprint', () => {
    const entry = { ...validMissingEntry, enSourceFingerprint: null };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /enSourceFingerprint/,
    );
  });

  it('throws on segment-extra entry without jaSegmentIndex', () => {
    const entry = { ...validExtraEntry, jaSegmentIndex: null };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /jaSegmentIndex/,
    );
  });

  it('throws on segment-extra entry without jaSourceFingerprint', () => {
    const entry = { ...validExtraEntry, jaSourceFingerprint: null };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /jaSourceFingerprint/,
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
      enSourceFingerprint: null,
      jaSourceFingerprint: JA_SEGMENT_FINGERPRINT,
    };
    const parsed = { schemaVersion: 1, entries: [entry] };
    assert.doesNotThrow(() => validateBaseline(parsed));
  });

  it('throws on segment-token-gap entry without missingTokens', () => {
    const entry = { ...validTokenGapEntry, missingTokens: null };
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [entry] }),
      /missingTokens/,
    );
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
      enSourceFingerprint: EN_SEGMENT_FINGERPRINT,
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
      jaSourceFingerprint: JA_SEGMENT_FINGERPRINT,
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
      jaSourceFingerprint: JA_SEGMENT_FINGERPRINT,
    };
    const entry = {
      slug: 'overview/example',
      issueType: 'segment-untranslated',
      sectionPath: 'Setup',
      segmentKind: 'paragraph',
      enSegmentIndex: null,
      jaSegmentIndex: 4,
      enSourceFingerprint: null,
      jaSourceFingerprint: JA_SEGMENT_FINGERPRINT,
      missingTokens: null,
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
      jaSourceFingerprint: SHIFTED_JA_FINGERPRINT,
    };
    const issue = {
      type: 'segment-shifted',
      sectionPath: 'Setup',
      segmentKind: 'paragraph',
      enSegmentIndex: 5,
      jaSegmentIndex: 8,
      enSourceFingerprint: EN_SEGMENT_FINGERPRINT,
      jaSourceFingerprint: SHIFTED_JA_FINGERPRINT,
    };
    const issueKey = buildBaselineKey('overview/example', issue);
    const entryKey = buildBaselineKeyFromEntry(shiftedEntry);
    assert.equal(issueKey, entryKey);
    // Changing JA index alone must NOT change the key
    const issueShiftedJa = { ...issue, jaSegmentIndex: 9 };
    const issueKeyShiftedJa = buildBaselineKey('overview/example', issueShiftedJa);
    assert.equal(issueKeyShiftedJa, issueKey);
  });

  it('distinguishes segment-token-gap keys when missingTokens differ on the same anchor', () => {
    const issueA = {
      type: 'segment-token-gap',
      sectionPath: 'CLI',
      segmentKind: 'paragraph',
      enSegmentIndex: 1,
      enSourceFingerprint: EN_SEGMENT_FINGERPRINT,
      missingTokens: ['--proxy'],
    };
    const issueB = {
      ...issueA,
      missingTokens: ['TESTIM_KEY'],
    };
    assert.notEqual(
      buildBaselineKey('overview/example', issueA),
      buildBaselineKey('overview/example', issueB),
    );
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
      enSourceFingerprint: EN_SEGMENT_FINGERPRINT,
      jaSourceFingerprint: null,
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

  it('does not absorb a different token-gap mutation on the same anchor', () => {
    const issues = [
      makeIssue({
        type: 'segment-token-gap',
        sectionPath: 'CLI',
        segmentKind: 'paragraph',
        enSegmentIndex: 1,
        detail: '[CLI] token gap',
        missingTokens: ['TESTIM_KEY'],
      }),
    ];
    const result = tagIssuesWithBaseline(
      'overview/example',
      issues,
      [validTokenGapEntry],
      VALID_FINGERPRINT,
    );
    assert.equal(result.tagged[0].baselined, undefined);
  });

  it('retains baselined match but annotates expired reviewAfter', () => {
    const issues = [makeIssue()];
    const result = tagIssuesWithBaseline(
      'overview/example',
      issues,
      [validMissingEntry],
      VALID_FINGERPRINT,
      '2026-10-07',
    );
    assert.equal(result.tagged[0].baselined, true);
    assert.equal(result.tagged[0].baselineReviewAfter, '2026-10-06');
    assert.equal(result.tagged[0].baselineExpired, true);
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

describe('isBaselineExpired', () => {
  it('returns false on the reviewAfter date itself', () => {
    assert.equal(isBaselineExpired(validMissingEntry, '2026-10-06'), false);
  });

  it('returns true after reviewAfter passes', () => {
    assert.equal(isBaselineExpired(validMissingEntry, '2026-10-07'), true);
  });
});

// ---------------------------------------------------------------------------
// Issue #247 PR5 — STRUCTURE_CATEGORIES / USABILITY_REASONS
//
// 新 4 type (section-structure-mismatch / segment-order-mismatch /
// snapshot-incomplete / source-unusable) を baseline 可能にするため、
// structureCategory / usabilityReason の allowlist を frozen Set で pin する。
// emitter 側 (source_parity_structure.mjs / source_parity_source_usability.mjs)
// の出力と同一の enum を参照することで、validateBaseline / buildBaselineKey
// の identity 検証を decouple する。
// ---------------------------------------------------------------------------

describe('Issue #247 PR5 — STRUCTURE_CATEGORIES', () => {
  it('contains the 3 canonical structure categories (kind-multiset / kind-sequence / content-order)', () => {
    assert.ok(STRUCTURE_CATEGORIES.has('kind-multiset'));
    assert.ok(STRUCTURE_CATEGORIES.has('kind-sequence'));
    assert.ok(STRUCTURE_CATEGORIES.has('content-order'));
    assert.equal(STRUCTURE_CATEGORIES.size, 3);
  });

  it('is frozen (regression guard against accidental mutation)', () => {
    assert.equal(Object.isFrozen(STRUCTURE_CATEGORIES), true);
  });

  it('does NOT contain unrelated values (guards against typo drift)', () => {
    assert.ok(!STRUCTURE_CATEGORIES.has(''));
    assert.ok(!STRUCTURE_CATEGORIES.has('unknown'));
    assert.ok(!STRUCTURE_CATEGORIES.has('segment-missing'));
  });
});

describe('Issue #247 PR5 — USABILITY_REASONS', () => {
  it('contains the 3 known unusable reasons', () => {
    assert.ok(USABILITY_REASONS.has('shallow-snapshot'));
    assert.ok(USABILITY_REASONS.has('escaped-details-residue'));
    assert.ok(USABILITY_REASONS.has('extractor-empty'));
    assert.equal(USABILITY_REASONS.size, 3);
  });

  it('is frozen (regression guard against accidental mutation)', () => {
    assert.equal(Object.isFrozen(USABILITY_REASONS), true);
  });

  it('does NOT contain unrelated values', () => {
    assert.ok(!USABILITY_REASONS.has(''));
    assert.ok(!USABILITY_REASONS.has('unknown'));
  });
});

// ---------------------------------------------------------------------------
// Issue #247 PR5 — computeStructureFingerprint
//
// structure mismatch の baseline identity key 用に、enKinds / jaKinds /
// structureCategory / contentPermutation を sha256 hex に畳み込む helper。
// 生の配列を baseline entry に保存すると JSON が肥大化し、downstream の
// 生データアクセス手段が増えるため、derived fingerprint 1 本に集約する。
// ---------------------------------------------------------------------------

describe('Issue #247 PR5 — computeStructureFingerprint', () => {
  const FINGERPRINT_RE = /^sha256:[0-9a-f]{64}$/;

  it('produces a deterministic sha256:<64 hex> fingerprint for a given input', () => {
    const fp = computeStructureFingerprint({
      structureCategory: 'kind-multiset',
      enKinds: ['paragraph', 'bullet-list', 'paragraph'],
      jaKinds: ['paragraph', 'paragraph'],
    });
    assert.match(fp, FINGERPRINT_RE);
    const fp2 = computeStructureFingerprint({
      structureCategory: 'kind-multiset',
      enKinds: ['paragraph', 'bullet-list', 'paragraph'],
      jaKinds: ['paragraph', 'paragraph'],
    });
    assert.equal(fp, fp2);
  });

  it('differs when enKinds differ', () => {
    const a = computeStructureFingerprint({
      structureCategory: 'kind-multiset',
      enKinds: ['paragraph', 'bullet-list'],
      jaKinds: ['paragraph'],
    });
    const b = computeStructureFingerprint({
      structureCategory: 'kind-multiset',
      enKinds: ['paragraph', 'heading'],
      jaKinds: ['paragraph'],
    });
    assert.notEqual(a, b);
  });

  it('differs when jaKinds differ', () => {
    const a = computeStructureFingerprint({
      structureCategory: 'kind-multiset',
      enKinds: ['paragraph'],
      jaKinds: ['paragraph', 'bullet-list'],
    });
    const b = computeStructureFingerprint({
      structureCategory: 'kind-multiset',
      enKinds: ['paragraph'],
      jaKinds: ['paragraph', 'heading'],
    });
    assert.notEqual(a, b);
  });

  it('differs when structureCategory differs (same kinds)', () => {
    const shared = {
      enKinds: ['paragraph', 'bullet-list'],
      jaKinds: ['paragraph', 'bullet-list'],
    };
    const multiset = computeStructureFingerprint({
      ...shared,
      structureCategory: 'kind-multiset',
    });
    const sequence = computeStructureFingerprint({
      ...shared,
      structureCategory: 'kind-sequence',
    });
    assert.notEqual(multiset, sequence);
  });

  it('differs when contentPermutation differs (content-order only)', () => {
    const shared = {
      structureCategory: 'content-order',
      enKinds: ['paragraph', 'bullet-list'],
      jaKinds: ['bullet-list', 'paragraph'],
    };
    const a = computeStructureFingerprint({
      ...shared,
      contentPermutation: [
        { enIndex: 0, jaIndex: 1, score: 0.9 },
        { enIndex: 1, jaIndex: 0, score: 0.9 },
      ],
    });
    const b = computeStructureFingerprint({
      ...shared,
      contentPermutation: [
        { enIndex: 0, jaIndex: 0, score: 0.9 },
        { enIndex: 1, jaIndex: 1, score: 0.9 },
      ],
    });
    assert.notEqual(a, b);
  });

  it('is stable under contentPermutation reordering (sorted by enIndex internally)', () => {
    const shared = {
      structureCategory: 'content-order',
      enKinds: ['paragraph', 'bullet-list'],
      jaKinds: ['bullet-list', 'paragraph'],
    };
    const sorted = computeStructureFingerprint({
      ...shared,
      contentPermutation: [
        { enIndex: 0, jaIndex: 1, score: 0.9 },
        { enIndex: 1, jaIndex: 0, score: 0.9 },
      ],
    });
    const reversed = computeStructureFingerprint({
      ...shared,
      contentPermutation: [
        { enIndex: 1, jaIndex: 0, score: 0.9 },
        { enIndex: 0, jaIndex: 1, score: 0.9 },
      ],
    });
    assert.equal(sorted, reversed);
  });

  it('is stable for kind-multiset whether contentPermutation is null/undefined/missing', () => {
    const base = {
      structureCategory: 'kind-multiset',
      enKinds: ['paragraph'],
      jaKinds: ['paragraph'],
    };
    const noField = computeStructureFingerprint(base);
    const undef = computeStructureFingerprint({ ...base, contentPermutation: undefined });
    const nullFp = computeStructureFingerprint({ ...base, contentPermutation: null });
    assert.equal(noField, undef);
    assert.equal(noField, nullFp);
  });

  it('ignores permutation "score" field (score is not identity)', () => {
    const shared = {
      structureCategory: 'content-order',
      enKinds: ['paragraph', 'bullet-list'],
      jaKinds: ['bullet-list', 'paragraph'],
    };
    const low = computeStructureFingerprint({
      ...shared,
      contentPermutation: [
        { enIndex: 0, jaIndex: 1, score: 0.1 },
        { enIndex: 1, jaIndex: 0, score: 0.1 },
      ],
    });
    const high = computeStructureFingerprint({
      ...shared,
      contentPermutation: [
        { enIndex: 0, jaIndex: 1, score: 0.99 },
        { enIndex: 1, jaIndex: 0, score: 0.99 },
      ],
    });
    assert.equal(low, high);
  });
});
