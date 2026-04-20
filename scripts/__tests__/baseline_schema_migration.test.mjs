import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  migrateEntry,
  migrateBaseline,
} from '../phase4/migrate_baseline_schema.mjs';

const VALID_FP = 'sha256:' + 'f'.repeat(64);

function v1SegmentMissingEntry(overrides = {}) {
  return {
    slug: 'overview/foo',
    issueType: 'segment-missing',
    snapshotFingerprint: VALID_FP,
    reviewAfter: '2026-10-09',
    sectionPath: 'header',
    segmentKind: 'paragraph',
    enSegmentIndex: 3,
    jaSegmentIndex: null,
    enSourceFingerprint: VALID_FP,
    jaSourceFingerprint: null,
    missingTokens: null,
    inconclusiveCategory: null,
    inconclusiveReason: null,
    sectionIndex: null,
    structureCategory: null,
    structureFingerprint: null,
    usabilityReason: null,
    ...overrides,
  };
}

describe('migrateEntry — v1 → v2 field migration', () => {
  it('drops the 4 removed fields (reviewAfter / inconclusiveReason / inconclusiveCategory / usabilityReason)', () => {
    const v1 = v1SegmentMissingEntry({
      reviewAfter: '2026-10-09',
      inconclusiveReason: 'some reason',
      inconclusiveCategory: 'align-exception',
      usabilityReason: 'shallow-snapshot',
    });

    const v2 = migrateEntry(v1);

    assert.ok(v2);
    assert.equal(Object.hasOwn(v2, 'reviewAfter'), false);
    assert.equal(Object.hasOwn(v2, 'inconclusiveReason'), false);
    assert.equal(Object.hasOwn(v2, 'inconclusiveCategory'), false);
    assert.equal(Object.hasOwn(v2, 'usabilityReason'), false);
  });

  it('drops entries of the 3 removed issueTypes (segment-inconclusive / snapshot-incomplete / source-unusable)', () => {
    for (const removedType of [
      'segment-inconclusive',
      'snapshot-incomplete',
      'source-unusable',
    ]) {
      const v1 = v1SegmentMissingEntry({ issueType: removedType });
      const v2 = migrateEntry(v1);
      assert.equal(v2, null, `issueType=${removedType} must be dropped`);
    }
  });

  it('defaults priority to "medium" when absent', () => {
    const v1 = v1SegmentMissingEntry();
    // Sanity: v1 entries never carry priority.
    assert.equal(Object.hasOwn(v1, 'priority'), false);

    const v2 = migrateEntry(v1);

    assert.equal(v2.priority, 'medium');
  });

  it('preserves an existing priority value (does not overwrite)', () => {
    const v1 = v1SegmentMissingEntry();
    v1.priority = 'high';

    const v2 = migrateEntry(v1);

    assert.equal(v2.priority, 'high');
  });

  it('treats null priority as missing and defaults to "medium"', () => {
    const v1 = v1SegmentMissingEntry();
    v1.priority = null;

    const v2 = migrateEntry(v1);

    assert.equal(v2.priority, 'medium');
  });

  it('preserves identity fields (slug / issueType / snapshotFingerprint / enSegmentIndex / enSourceFingerprint)', () => {
    const v1 = v1SegmentMissingEntry({ enSegmentIndex: 7 });

    const v2 = migrateEntry(v1);

    assert.equal(v2.slug, 'overview/foo');
    assert.equal(v2.issueType, 'segment-missing');
    assert.equal(v2.snapshotFingerprint, VALID_FP);
    assert.equal(v2.enSegmentIndex, 7);
    assert.equal(v2.enSourceFingerprint, VALID_FP);
  });

  it('returns null for non-object inputs (defensive)', () => {
    assert.equal(migrateEntry(null), null);
    assert.equal(migrateEntry(undefined), null);
    assert.equal(migrateEntry(42), null);
    assert.equal(migrateEntry('string'), null);
  });

  it('migrates structure-mismatch entries (identity preserved, priority defaulted)', () => {
    const v1 = {
      slug: 'overview/foo',
      issueType: 'section-structure-mismatch',
      snapshotFingerprint: VALID_FP,
      reviewAfter: '2026-10-09',
      sectionPath: 'h1',
      sectionIndex: 2,
      structureCategory: 'kind-multiset',
      structureFingerprint: VALID_FP,
    };

    const v2 = migrateEntry(v1);

    assert.ok(v2);
    assert.equal(v2.issueType, 'section-structure-mismatch');
    assert.equal(v2.sectionIndex, 2);
    assert.equal(v2.structureCategory, 'kind-multiset');
    assert.equal(v2.structureFingerprint, VALID_FP);
    assert.equal(v2.priority, 'medium');
    assert.equal(Object.hasOwn(v2, 'reviewAfter'), false);
  });
});

describe('migrateBaseline — top-level payload migration', () => {
  it('bumps schemaVersion to 2 and annotates rationale with "Phase 4 v2"', () => {
    const v1 = {
      schemaVersion: 1,
      generatedAt: '2026-04-09T00:00:00Z',
      generatedFromRunId: 'run-1',
      rationale: 'frozen baseline',
      entries: [],
    };

    const v2 = migrateBaseline(v1);

    assert.equal(v2.schemaVersion, 2);
    assert.match(v2.rationale, /Phase 4 v2/);
  });

  it('does not double-annotate rationale on already-migrated input', () => {
    const existing = {
      schemaVersion: 1,
      rationale: 'frozen baseline / Phase 4 v2',
      entries: [],
    };

    const v2 = migrateBaseline(existing);

    // Only one occurrence of "Phase 4 v2" should appear in the rationale.
    const matches = v2.rationale.match(/Phase 4 v2/g) ?? [];
    assert.equal(matches.length, 1);
  });

  it('filters out dropped-type entries from the migrated payload', () => {
    const v1 = {
      schemaVersion: 1,
      rationale: 'frozen baseline',
      entries: [
        v1SegmentMissingEntry({ slug: 'a' }),
        v1SegmentMissingEntry({ slug: 'b', issueType: 'segment-inconclusive' }),
        v1SegmentMissingEntry({ slug: 'c', issueType: 'source-unusable' }),
        v1SegmentMissingEntry({ slug: 'd' }),
      ],
    };

    const v2 = migrateBaseline(v1);

    assert.equal(v2.entries.length, 2);
    assert.deepEqual(
      v2.entries.map((e) => e.slug),
      ['a', 'd'],
    );
  });

  it('defaults every migrated entry priority to "medium" when absent', () => {
    const v1 = {
      schemaVersion: 1,
      rationale: 'frozen baseline',
      entries: [v1SegmentMissingEntry(), v1SegmentMissingEntry({ slug: 'other' })],
    };

    const v2 = migrateBaseline(v1);

    for (const entry of v2.entries) {
      assert.equal(entry.priority, 'medium');
    }
  });

  it('sets a fresh generatedAt timestamp (ISO 8601 UTC)', () => {
    const v1 = {
      schemaVersion: 1,
      generatedAt: '2023-01-01T00:00:00Z',
      rationale: 'frozen baseline',
      entries: [],
    };

    const before = Date.now();
    const v2 = migrateBaseline(v1);
    const after = Date.now();

    assert.ok(typeof v2.generatedAt === 'string');
    const generatedAtMs = Date.parse(v2.generatedAt);
    assert.ok(Number.isFinite(generatedAtMs));
    assert.ok(generatedAtMs >= before && generatedAtMs <= after);
  });

  it('throws when input is not an object', () => {
    assert.throws(() => migrateBaseline(null), /must be a baseline object/);
    assert.throws(() => migrateBaseline([]), /must be a baseline object/);
    assert.throws(() => migrateBaseline('string'), /must be a baseline object/);
  });

  it('throws when entries is not an array (fail-closed on corrupt input)', () => {
    // Regression pin for Codex C1 / reviewer R1: silent coercion of a non-array
    // entries field to [] would mask corrupted input behind a technically-valid
    // empty v2 baseline. Fail-closed is the only safe behavior for a migration.
    assert.throws(
      () => migrateBaseline({ schemaVersion: 1, entries: 'oops' }),
      /entries must be an array/,
    );
    assert.throws(
      () => migrateBaseline({ schemaVersion: 1, entries: null }),
      /entries must be an array/,
    );
    assert.throws(
      () => migrateBaseline({ schemaVersion: 1, entries: { not: 'array' } }),
      /entries must be an array/,
    );
  });

  it('handles empty entries array cleanly (round-trip test)', () => {
    const v1 = {
      schemaVersion: 1,
      rationale: 'frozen baseline',
      entries: [],
    };

    const v2 = migrateBaseline(v1);

    assert.deepEqual(v2.entries, []);
    assert.equal(v2.schemaVersion, 2);
  });
});
