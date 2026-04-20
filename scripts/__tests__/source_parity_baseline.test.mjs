/**
 * Tests for the frozen baseline mechanism (schema v2).
 *
 * Pure-function tests for schema validation, lookup key generation, and
 * page-level invalidation. The integration into check_source_parity.mjs
 * lives in source_parity_acknowledgements.test.mjs (summary accounting)
 * and the runtime tests.
 *
 * v2 変更点:
 * - `reviewAfter` 概念は撤去 (expired / expiringSoon も含む)
 * - BASELINE_ELIGIBLE_TYPES は JA-actionable 7 type のみ
 *   (segment-inconclusive / snapshot-incomplete / source-unusable を除外)
 * - `inconclusiveCategory` / `inconclusiveReason` / `usabilityReason` は entry schema から除去
 * - `priority` (high/medium/low, required, default 'medium') / `note` (任意, <=500) を追加
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateBaseline,
  buildBaselineKey,
  buildBaselineKeyFromEntry,
  tagIssuesWithBaseline,
  BASELINE_ELIGIBLE_TYPES,
  STRUCTURE_CATEGORIES,
  PRIORITY_VALUES,
  NOTE_MAX_LENGTH,
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
  priority: 'medium',
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
  priority: 'medium',
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
  priority: 'medium',
};

// ---------------------------------------------------------------------------
// constants
// ---------------------------------------------------------------------------

describe('BASELINE_ELIGIBLE_TYPES (v2 — JA-actionable 7 type)', () => {
  it('contains all JA-actionable segment types', () => {
    assert.ok(BASELINE_ELIGIBLE_TYPES.has('segment-missing'));
    assert.ok(BASELINE_ELIGIBLE_TYPES.has('segment-extra'));
    assert.ok(BASELINE_ELIGIBLE_TYPES.has('segment-shifted'));
    assert.ok(BASELINE_ELIGIBLE_TYPES.has('segment-untranslated'));
    assert.ok(BASELINE_ELIGIBLE_TYPES.has('segment-token-gap'));
  });

  it('contains structure mismatch types (2)', () => {
    assert.ok(BASELINE_ELIGIBLE_TYPES.has('section-structure-mismatch'));
    assert.ok(BASELINE_ELIGIBLE_TYPES.has('segment-order-mismatch'));
  });

  it('does NOT contain v1-only types (advisory / source debt)', () => {
    assert.ok(!BASELINE_ELIGIBLE_TYPES.has('segment-inconclusive'));
    assert.ok(!BASELINE_ELIGIBLE_TYPES.has('snapshot-incomplete'));
    assert.ok(!BASELINE_ELIGIBLE_TYPES.has('source-unusable'));
  });

  it('does NOT contain repo-local issue types', () => {
    assert.ok(!BASELINE_ELIGIBLE_TYPES.has('source-page-missing-local'));
    assert.ok(!BASELINE_ELIGIBLE_TYPES.has('paragraph-count-mismatch'));
    assert.ok(!BASELINE_ELIGIBLE_TYPES.has('untranslated'));
  });

  it('has exactly 7 eligible types in v2', () => {
    assert.equal(BASELINE_ELIGIBLE_TYPES.size, 7);
  });
});

describe('PRIORITY_VALUES', () => {
  it('lists high/medium/low in order', () => {
    assert.deepEqual([...PRIORITY_VALUES], ['high', 'medium', 'low']);
  });

  it('is frozen', () => {
    assert.equal(Object.isFrozen(PRIORITY_VALUES), true);
  });
});

describe('validateBaseline — structure mismatch entries', () => {
  const VALID_SNAPSHOT_FP = 'sha256:' + 'f'.repeat(64);
  const STRUCTURE_FP = 'sha256:' + '1'.repeat(64);

  function baseStructureEntry(overrides = {}) {
    return {
      slug: 'running-tests/the-command-line-cli',
      issueType: 'section-structure-mismatch',
      snapshotFingerprint: VALID_SNAPSHOT_FP,
      priority: 'medium',
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
      validateBaseline({ schemaVersion: 2, entries: [entry] }),
    );
  });

  it('accepts a valid segment-order-mismatch entry (content-order)', () => {
    const entry = baseStructureEntry({
      issueType: 'segment-order-mismatch',
      structureCategory: 'content-order',
    });
    assert.doesNotThrow(() =>
      validateBaseline({ schemaVersion: 2, entries: [entry] }),
    );
  });

  it('accepts a structure entry with empty string sectionPath (preface section)', () => {
    const entry = baseStructureEntry({ sectionPath: '' });
    assert.doesNotThrow(() =>
      validateBaseline({ schemaVersion: 2, entries: [entry] }),
    );
  });

  it('throws on missing sectionIndex (machine identity key must be present)', () => {
    const entry = baseStructureEntry();
    delete entry.sectionIndex;
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /sectionIndex/,
    );
  });

  it('throws on non-integer sectionIndex', () => {
    const entry = baseStructureEntry({ sectionIndex: 1.5 });
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /sectionIndex/,
    );
  });

  it('throws on negative sectionIndex', () => {
    const entry = baseStructureEntry({ sectionIndex: -1 });
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /sectionIndex/,
    );
  });

  it('throws on string sectionIndex', () => {
    const entry = baseStructureEntry({ sectionIndex: '7' });
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /sectionIndex/,
    );
  });

  it('throws on missing sectionPath (reviewer readability field is required)', () => {
    const entry = baseStructureEntry();
    delete entry.sectionPath;
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /sectionPath/,
    );
  });

  it('throws on invalid structureCategory enum', () => {
    const entry = baseStructureEntry({ structureCategory: 'unknown' });
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /structureCategory/,
    );
  });

  it('throws on malformed structureFingerprint (not sha256 hex)', () => {
    const entry = baseStructureEntry({ structureFingerprint: 'not-a-hash' });
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /structureFingerprint/,
    );
  });
});

// ---------------------------------------------------------------------------
// validateBaseline — schema invariants
// ---------------------------------------------------------------------------

describe('validateBaseline', () => {
  it('accepts a valid baseline with mixed entry types', () => {
    const parsed = {
      schemaVersion: 2,
      generatedAt: '2026-04-06T03:00:00Z',
      generatedFromRunId: '2026-04-06T03:00:00Z#abcd1234',
      rationale: 'preview baseline',
      entries: [validMissingEntry, validExtraEntry, validTokenGapEntry],
    };
    const result = validateBaseline(parsed);
    assert.equal(result, parsed);
  });

  it('throws on missing schemaVersion', () => {
    assert.throws(() => validateBaseline({ entries: [] }), /schemaVersion/);
  });

  it('throws on unsupported schemaVersion (v1 rejected after cutover)', () => {
    assert.throws(
      () => validateBaseline({ schemaVersion: 1, entries: [] }),
      /schemaVersion/,
    );
  });

  it('throws on missing entries array', () => {
    assert.throws(() => validateBaseline({ schemaVersion: 2 }), /entries/);
  });

  it('throws on unknown issueType (not in BASELINE_ELIGIBLE_TYPES)', () => {
    const entry = { ...validMissingEntry, issueType: 'paragraph-count-mismatch' };
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /issueType/,
    );
  });

  it('rejects segment-inconclusive (not baseline-able in v2)', () => {
    const entry = { ...validMissingEntry, issueType: 'segment-inconclusive' };
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /issueType/,
    );
  });

  it('rejects snapshot-incomplete (source debt — not baseline-able in v2)', () => {
    const entry = { ...validMissingEntry, issueType: 'snapshot-incomplete' };
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /issueType/,
    );
  });

  it('rejects source-unusable (source debt — not baseline-able in v2)', () => {
    const entry = { ...validMissingEntry, issueType: 'source-unusable' };
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /issueType/,
    );
  });

  it('throws on invalid snapshotFingerprint format', () => {
    const entry = { ...validMissingEntry, snapshotFingerprint: 'not-a-hash' };
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /snapshotFingerprint/,
    );
  });

  it('throws on segment-missing entry without enSegmentIndex', () => {
    const entry = { ...validMissingEntry, enSegmentIndex: null };
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /enSegmentIndex/,
    );
  });

  it('throws on segment-missing entry without enSourceFingerprint', () => {
    const entry = { ...validMissingEntry, enSourceFingerprint: null };
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /enSourceFingerprint/,
    );
  });

  it('throws on segment-extra entry without jaSegmentIndex', () => {
    const entry = { ...validExtraEntry, jaSegmentIndex: null };
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /jaSegmentIndex/,
    );
  });

  it('throws on segment-extra entry without jaSourceFingerprint', () => {
    const entry = { ...validExtraEntry, jaSourceFingerprint: null };
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
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
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
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
    const parsed = { schemaVersion: 2, entries: [entry] };
    assert.doesNotThrow(() => validateBaseline(parsed));
  });

  it('throws on segment-token-gap entry without missingTokens', () => {
    const entry = { ...validTokenGapEntry, missingTokens: null };
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /missingTokens/,
    );
  });

  // ------------------------------------------------------------------
  // v2: priority (required enum) / note (optional, <=500 chars)
  // ------------------------------------------------------------------

  it('throws on missing priority', () => {
    const entry = { ...validMissingEntry };
    delete entry.priority;
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /priority/,
    );
  });

  it('throws on invalid priority enum value', () => {
    const entry = { ...validMissingEntry, priority: 'urgent' };
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /priority/,
    );
  });

  it('accepts priority=high', () => {
    const entry = { ...validMissingEntry, priority: 'high' };
    assert.doesNotThrow(() =>
      validateBaseline({ schemaVersion: 2, entries: [entry] }),
    );
  });

  it('accepts priority=low', () => {
    const entry = { ...validMissingEntry, priority: 'low' };
    assert.doesNotThrow(() =>
      validateBaseline({ schemaVersion: 2, entries: [entry] }),
    );
  });

  it('accepts optional note (empty or short string)', () => {
    const entry = { ...validMissingEntry, note: 'awaiting upstream fix' };
    assert.doesNotThrow(() =>
      validateBaseline({ schemaVersion: 2, entries: [entry] }),
    );
  });

  it('accepts entry without note field (optional)', () => {
    assert.doesNotThrow(() =>
      validateBaseline({ schemaVersion: 2, entries: [validMissingEntry] }),
    );
  });

  it('throws on note that exceeds NOTE_MAX_LENGTH (500)', () => {
    const entry = { ...validMissingEntry, note: 'x'.repeat(NOTE_MAX_LENGTH + 1) };
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /note/,
    );
  });

  it('throws on non-string note', () => {
    const entry = { ...validMissingEntry, note: 123 };
    assert.throws(
      () => validateBaseline({ schemaVersion: 2, entries: [entry] }),
      /note/,
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
      priority: 'medium',
    };
    const issueKey = buildBaselineKey('overview/example', issue);
    const entryKey = buildBaselineKeyFromEntry(entry);
    assert.equal(issueKey, entryKey);
    assert.ok(issueKey.includes('|ja|'));
    assert.ok(!issueKey.includes('|en|'));
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
// buildBaselineKey / buildBaselineKeyFromEntry の対称性 (structure mismatch)
// ---------------------------------------------------------------------------

describe('buildBaselineKey / buildBaselineKeyFromEntry (structure mismatch)', () => {
  const PAGE_FP = 'sha256:' + 'f'.repeat(64);

  function makeStructureIssue(overrides = {}) {
    return {
      type: 'section-structure-mismatch',
      sectionPath: 'CLI Installation > Basic CLI command',
      sectionIndex: 7,
      structureCategory: 'kind-multiset',
      enKinds: ['paragraph', 'bullet-list', 'paragraph'],
      jaKinds: ['paragraph', 'paragraph'],
      ...overrides,
    };
  }

  function entryFromIssue(slug, issue, overrides = {}) {
    return {
      slug,
      issueType: issue.type,
      snapshotFingerprint: PAGE_FP,
      priority: 'medium',
      sectionIndex: issue.sectionIndex,
      sectionPath: issue.sectionPath,
      structureCategory: issue.structureCategory,
      structureFingerprint: computeStructureFingerprint({
        structureCategory: issue.structureCategory,
        enKinds: issue.enKinds,
        jaKinds: issue.jaKinds,
        contentPermutation: issue.contentPermutation,
      }),
      ...overrides,
    };
  }

  it('runtime key and entry key match (kind-multiset)', () => {
    const slug = 'running-tests/the-command-line-cli';
    const issue = makeStructureIssue();
    const entry = entryFromIssue(slug, issue);
    const issueKey = buildBaselineKey(slug, issue);
    const entryKey = buildBaselineKeyFromEntry(entry);
    assert.equal(issueKey, entryKey);
  });

  it('runtime key and entry key match (segment-order-mismatch / content-order)', () => {
    const slug = 'running-tests/the-command-line-cli';
    const issue = makeStructureIssue({
      type: 'segment-order-mismatch',
      structureCategory: 'content-order',
      enKinds: ['paragraph', 'bullet-list'],
      jaKinds: ['bullet-list', 'paragraph'],
      contentPermutation: [
        { enIndex: 0, jaIndex: 1, score: 0.9 },
        { enIndex: 1, jaIndex: 0, score: 0.9 },
      ],
    });
    const entry = entryFromIssue(slug, issue);
    assert.equal(buildBaselineKey(slug, issue), buildBaselineKeyFromEntry(entry));
  });

  it('distinguishes by sectionIndex even when sectionPath is identical', () => {
    const slug = 'some/page';
    const issueA = makeStructureIssue({ sectionIndex: 3 });
    const issueB = makeStructureIssue({ sectionIndex: 7 });
    assert.notEqual(
      buildBaselineKey(slug, issueA),
      buildBaselineKey(slug, issueB),
    );
  });

  it('distinguishes by structureCategory (same sectionIndex)', () => {
    const slug = 'some/page';
    const issueA = makeStructureIssue({ structureCategory: 'kind-multiset' });
    const issueB = makeStructureIssue({ structureCategory: 'kind-sequence' });
    assert.notEqual(
      buildBaselineKey(slug, issueA),
      buildBaselineKey(slug, issueB),
    );
  });

  it('distinguishes by enKinds (via structureFingerprint)', () => {
    const slug = 'some/page';
    const issueA = makeStructureIssue({
      enKinds: ['paragraph', 'bullet-list'],
    });
    const issueB = makeStructureIssue({
      enKinds: ['paragraph', 'heading'],
    });
    assert.notEqual(
      buildBaselineKey(slug, issueA),
      buildBaselineKey(slug, issueB),
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

  it('tagIssuesWithBaseline only adds baselined: true (no expiry tags in v2)', () => {
    const issues = [makeIssue()];
    const result = tagIssuesWithBaseline(
      'overview/example',
      issues,
      [validMissingEntry],
      VALID_FINGERPRINT,
    );
    assert.equal(result.tagged[0].baselined, true);
    // v2: baselineReviewAfter / baselineExpired / baselineExpiringSoon は付けない
    assert.equal(result.tagged[0].baselineReviewAfter, undefined);
    assert.equal(result.tagged[0].baselineExpired, undefined);
    assert.equal(result.tagged[0].baselineExpiringSoon, undefined);
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

// ---------------------------------------------------------------------------
// tagIssuesWithBaseline contract for structure mismatch
// ---------------------------------------------------------------------------

describe('tagIssuesWithBaseline (structure mismatch)', () => {
  const PAGE_FP = 'sha256:' + 'f'.repeat(64);

  function makeStructureIssue(overrides = {}) {
    return {
      type: 'section-structure-mismatch',
      severity: 'actionable',
      detail: '[CLI Installation > Basic CLI command] block kind multiset differs',
      sectionPath: 'CLI Installation > Basic CLI command',
      sectionIndex: 7,
      structureCategory: 'kind-multiset',
      enKinds: ['paragraph', 'bullet-list', 'paragraph'],
      jaKinds: ['paragraph', 'paragraph'],
      ...overrides,
    };
  }

  function makeStructureEntry(slug, issue, overrides = {}) {
    return {
      slug,
      issueType: issue.type,
      snapshotFingerprint: PAGE_FP,
      priority: 'medium',
      sectionIndex: issue.sectionIndex,
      sectionPath: issue.sectionPath,
      structureCategory: issue.structureCategory,
      structureFingerprint: computeStructureFingerprint({
        structureCategory: issue.structureCategory,
        enKinds: issue.enKinds,
        jaKinds: issue.jaKinds,
        contentPermutation: issue.contentPermutation,
      }),
      ...overrides,
    };
  }

  it('tags a matching structure issue with baselined: true', () => {
    const slug = 'running-tests/the-command-line-cli';
    const issue = makeStructureIssue();
    const entry = makeStructureEntry(slug, issue);
    const result = tagIssuesWithBaseline(slug, [issue], [entry], PAGE_FP);
    assert.equal(result.tagged[0].baselined, true);
    assert.equal(result.invalidated, false);
  });

  it('does NOT tag when structureFingerprint differs (same sectionIndex / category)', () => {
    const slug = 'running-tests/the-command-line-cli';
    const issue = makeStructureIssue({ enKinds: ['paragraph', 'heading'] });
    const otherIssue = makeStructureIssue({ enKinds: ['paragraph', 'table'] });
    const entry = makeStructureEntry(slug, otherIssue);
    const result = tagIssuesWithBaseline(slug, [issue], [entry], PAGE_FP);
    assert.equal(result.tagged[0].baselined, undefined);
  });

  it('invalidates page when snapshotFingerprint differs', () => {
    const slug = 'running-tests/the-command-line-cli';
    const issue = makeStructureIssue();
    const entry = makeStructureEntry(slug, issue);
    const otherFp = 'sha256:' + 'a'.repeat(64);
    const result = tagIssuesWithBaseline(slug, [issue], [entry], otherFp);
    assert.equal(result.tagged[0].baselined, undefined);
    assert.equal(result.invalidated, true);
  });

  it('two sections with identical path/fingerprint but different sectionIndex are tagged independently', () => {
    const slug = 'some/page';
    const sharedOverrides = {
      sectionPath: 'Shared heading',
      enKinds: ['paragraph'],
      jaKinds: ['paragraph', 'paragraph'],
    };
    const issueA = makeStructureIssue({ ...sharedOverrides, sectionIndex: 3 });
    const issueB = makeStructureIssue({ ...sharedOverrides, sectionIndex: 7 });
    const entryA = makeStructureEntry(slug, issueA);
    const result = tagIssuesWithBaseline(slug, [issueA, issueB], [entryA], PAGE_FP);
    assert.equal(result.tagged[0].baselined, true);
    assert.equal(result.tagged[1].baselined, undefined);
  });
});

// ---------------------------------------------------------------------------
// STRUCTURE_CATEGORIES
// ---------------------------------------------------------------------------

describe('STRUCTURE_CATEGORIES', () => {
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

// ---------------------------------------------------------------------------
// computeStructureFingerprint
// ---------------------------------------------------------------------------

describe('computeStructureFingerprint', () => {
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

// ---------------------------------------------------------------------------
// computeOrphanBaselineEntries helper
// ---------------------------------------------------------------------------

describe('computeOrphanBaselineEntries', () => {
  let computeOrphanBaselineEntries;
  let tagIssuesWithBaseline2;
  before(async () => {
    ({ computeOrphanBaselineEntries, tagIssuesWithBaseline: tagIssuesWithBaseline2 } =
      await import('../lib/source_parity_baseline.mjs'));
  });

  const SLUG = 'overview/orphan-example';
  const FP = 'sha256:' + '1'.repeat(64);
  const EN_FP = 'sha256:' + '2'.repeat(64);

  function segmentMissingEntry(idx) {
    return {
      slug: SLUG,
      issueType: 'segment-missing',
      sectionPath: 'Setup',
      segmentKind: 'paragraph',
      enSegmentIndex: idx,
      jaSegmentIndex: null,
      enSourceFingerprint: EN_FP,
      jaSourceFingerprint: null,
      missingTokens: null,
      snapshotFingerprint: FP,
      priority: 'medium',
    };
  }

  function segmentMissingIssue(idx) {
    return {
      type: 'segment-missing',
      severity: 'actionable',
      sectionPath: 'Setup',
      segmentKind: 'paragraph',
      enSegmentIndex: idx,
      enSourceFingerprint: EN_FP,
    };
  }

  it('returns [] when every entry matched a runtime issue', () => {
    const entries = [segmentMissingEntry(0), segmentMissingEntry(1)];
    const issues = [segmentMissingIssue(0), segmentMissingIssue(1)];
    const tagResult = tagIssuesWithBaseline2(SLUG, issues, entries, FP);
    const orphans = computeOrphanBaselineEntries(SLUG, entries, tagResult.matchedKeys);
    assert.deepEqual(orphans, []);
  });

  it('returns entries whose key did not appear in matchedKeys', () => {
    const entries = [segmentMissingEntry(0), segmentMissingEntry(1), segmentMissingEntry(2)];
    // runtime issue は idx=0 のみ
    const issues = [segmentMissingIssue(0)];
    const tagResult = tagIssuesWithBaseline2(SLUG, issues, entries, FP);
    const orphans = computeOrphanBaselineEntries(SLUG, entries, tagResult.matchedKeys);
    assert.equal(orphans.length, 2);
    assert.deepEqual(
      orphans.map((e) => e.enSegmentIndex).sort(),
      [1, 2],
    );
  });

  it('only considers entries for the given slug', () => {
    const entries = [
      segmentMissingEntry(0),
      { ...segmentMissingEntry(0), slug: 'other/page' },
    ];
    const issues = []; // nothing matches
    const tagResult = tagIssuesWithBaseline2(SLUG, issues, entries, FP);
    const orphans = computeOrphanBaselineEntries(SLUG, entries, tagResult.matchedKeys);
    assert.equal(orphans.length, 1);
    assert.equal(orphans[0].slug, SLUG);
  });

  it('returns all entries when every runtime issue failed to match (e.g., invalidated page)', () => {
    const entries = [segmentMissingEntry(0), segmentMissingEntry(1)];
    const issues = [segmentMissingIssue(0), segmentMissingIssue(1)];
    const OTHER_FP = 'sha256:' + '3'.repeat(64);
    const tagResult = tagIssuesWithBaseline2(SLUG, issues, entries, OTHER_FP);
    assert.equal(tagResult.invalidated, true);
    assert.equal(tagResult.matchedKeys.size, 0);
    const orphans = computeOrphanBaselineEntries(SLUG, entries, tagResult.matchedKeys);
    assert.equal(
      orphans.length,
      2,
      'invalidated 時は全 entry が "unmatched" になるが、呼び出し側が invalidated フラグで skip する契約',
    );
  });

  it('orphan entries retain their original fields (identity preserved)', () => {
    const entries = [segmentMissingEntry(0)];
    const issues = [];
    const tagResult = tagIssuesWithBaseline2(SLUG, issues, entries, FP);
    const orphans = computeOrphanBaselineEntries(SLUG, entries, tagResult.matchedKeys);
    assert.equal(orphans.length, 1);
    assert.equal(orphans[0].slug, SLUG);
    assert.equal(orphans[0].issueType, 'segment-missing');
    assert.equal(orphans[0].enSegmentIndex, 0);
  });

  it('returns [] defensively when matchedKeys is not a Set', () => {
    const entries = [segmentMissingEntry(0)];
    assert.deepEqual(computeOrphanBaselineEntries(SLUG, entries, null), []);
    assert.deepEqual(computeOrphanBaselineEntries(SLUG, entries, undefined), []);
    assert.deepEqual(computeOrphanBaselineEntries(SLUG, entries, []), []);
  });

  it('returns [] defensively when entries is not an array', () => {
    assert.deepEqual(computeOrphanBaselineEntries(SLUG, null, new Set()), []);
    assert.deepEqual(computeOrphanBaselineEntries(SLUG, undefined, new Set()), []);
  });
});

// ---------------------------------------------------------------------------
// summary orphanBaselineEntries counter
// ---------------------------------------------------------------------------

describe('summary orphanBaselineEntries counter', () => {
  let summarizeParityResults;
  before(async () => {
    ({ summarizeParityResults } = await import('../lib/source_parity_summary.mjs'));
  });

  it('exposes orphanBaselineEntries === 0 when no orphans are passed', () => {
    const summary = summarizeParityResults([], {
      orphanBaselineEntries: 0,
      orphanBaselineByType: {},
    });
    assert.equal(summary.orphanBaselineEntries, 0);
    assert.deepEqual(summary.orphanBaselineByType, {});
  });

  it('propagates a provided orphan count + byType breakdown', () => {
    const summary = summarizeParityResults([], {
      orphanBaselineEntries: 3,
      orphanBaselineByType: { 'segment-missing': 3 },
    });
    assert.equal(summary.orphanBaselineEntries, 3);
    assert.deepEqual(summary.orphanBaselineByType, { 'segment-missing': 3 });
  });

  it('defaults to 0 / {} when no orphan metadata is passed (backward compat)', () => {
    const summary = summarizeParityResults([]);
    assert.equal(summary.orphanBaselineEntries, 0);
    assert.deepEqual(summary.orphanBaselineByType, {});
  });
});
