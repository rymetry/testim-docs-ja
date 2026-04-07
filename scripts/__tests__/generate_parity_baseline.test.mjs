/**
 * Tests for the Phase 6A baseline generation script.
 *
 * Validates pure helpers (buildBaselineFromStatus, serializeBaseline,
 * mergePartialBaseline, defaultReviewAfter) and verifies determinism.
 * The CLI invocation is exercised by an end-to-end smoke test.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  assertFullParityStatus,
  buildBaselineFromStatus,
  buildGenerationMeta,
  serializeBaseline,
  mergePartialBaseline,
  defaultReviewAfter,
} from '../generate_parity_baseline.mjs';

const VALID_FINGERPRINT = 'sha256:' + 'a'.repeat(64);
const OTHER_FINGERPRINT = 'sha256:' + 'b'.repeat(64);
const EN_SEGMENT_FINGERPRINT = 'sha256:' + 'c'.repeat(64);
const JA_SEGMENT_FINGERPRINT = 'sha256:' + 'd'.repeat(64);
const TOKEN_GAP_FINGERPRINT = 'sha256:' + 'e'.repeat(64);

const sampleStatus = {
  summary: {
    checkedAt: '2026-04-06T03:00:00Z',
  },
  files: [
    {
      file: 'src/content/docs/overview/example.md',
      sourceUrl: '',
      category: '',
      issues: [
        {
          type: 'segment-missing',
          severity: 'actionable',

          sectionPath: 'Setup',
          segmentKind: 'paragraph',
          enSegmentIndex: 2,
          jaSegmentIndex: null,
          enSourceFingerprint: EN_SEGMENT_FINGERPRINT,
          detail: '[Setup] EN paragraph not found',
        },
        {
          type: 'segment-extra',
          severity: 'actionable',

          sectionPath: 'Setup',
          segmentKind: 'paragraph',
          enSegmentIndex: null,
          jaSegmentIndex: 5,
          jaSourceFingerprint: JA_SEGMENT_FINGERPRINT,
          detail: '[Setup] JA paragraph has no EN counterpart',
        },
        {
          type: 'segment-token-gap',
          severity: 'actionable',

          sectionPath: 'CLI',
          segmentKind: 'paragraph',
          enSegmentIndex: 1,
          jaSegmentIndex: 1,
          enSourceFingerprint: TOKEN_GAP_FINGERPRINT,
          missingTokens: ['TESTIM_KEY', '--proxy'],
          detail: '[CLI] JA paragraph drops EN invariant tokens: --proxy, TESTIM_KEY',
        },
        {
          type: 'segment-inconclusive',
          severity: 'actionable',

          sectionPath: null,
          segmentKind: null,
          inconclusiveCategory: 'heading-count-mismatch',
          inconclusiveReason: 'Heading count mismatch: EN has 0, JA has 5',
          detail: 'Phase 5 alignment inconclusive: heading count mismatch',
        },
        {
          // Non-eligible — must be skipped
          type: 'paragraph-count-mismatch',
          severity: 'signal',
          detail: '段落数 EN=2 JA=3',
        },
      ],
    },
  ],
};

const fingerprintMap = new Map([['overview/example', VALID_FINGERPRINT]]);

const meta = {
  runId: 'test-run',
  generatedAt: '2026-04-06T03:00:00Z',
  reviewAfter: '2026-10-06',
  rationale: 'test',
};

// ---------------------------------------------------------------------------
// defaultReviewAfter
// ---------------------------------------------------------------------------

describe('defaultReviewAfter', () => {
  it('returns YYYY-MM-DD 6 months after the given UTC date', () => {
    const result = defaultReviewAfter(new Date('2026-04-06T00:00:00Z'));
    assert.equal(result, '2026-10-06');
  });

  it('respects custom monthsAhead', () => {
    const result = defaultReviewAfter(new Date('2026-04-06T00:00:00Z'), 3);
    assert.equal(result, '2026-07-06');
  });

  it('formats single-digit month and day with leading zeros', () => {
    const result = defaultReviewAfter(new Date('2026-01-05T00:00:00Z'));
    assert.equal(result, '2026-07-05');
  });
});

// ---------------------------------------------------------------------------
// buildGenerationMeta
// ---------------------------------------------------------------------------

describe('buildGenerationMeta', () => {
  it('derives deterministic metadata from status.summary.checkedAt', () => {
    const metaFromEarlyCall = buildGenerationMeta(sampleStatus, {
      regenerate: true,
      slugs: null,
      rationale: null,
      reviewAfter: null,
    });
    const metaFromLaterCall = buildGenerationMeta(sampleStatus, {
      regenerate: true,
      slugs: null,
      rationale: null,
      reviewAfter: null,
    });
    assert.deepEqual(metaFromEarlyCall, metaFromLaterCall);
    assert.equal(metaFromEarlyCall.generatedAt, '2026-04-06T03:00:00Z');
    assert.equal(
      metaFromEarlyCall.runId,
      '2026-04-06T03:00:00Z#parity-check-status',
    );
    assert.equal(metaFromEarlyCall.reviewAfter, '2026-10-06');
  });

  it('honors explicit rationale and reviewAfter overrides', () => {
    const metaOverride = buildGenerationMeta(sampleStatus, {
      regenerate: false,
      slugs: ['overview/example'],
      rationale: 'custom rationale',
      reviewAfter: '2026-12-31',
    });
    assert.equal(metaOverride.rationale, 'custom rationale');
    assert.equal(metaOverride.reviewAfter, '2026-12-31');
  });
});

// ---------------------------------------------------------------------------
// assertFullParityStatus
// ---------------------------------------------------------------------------

describe('assertFullParityStatus', () => {
  it('accepts a full-repo parity status', () => {
    const status = {
      summary: {
        checkedAt: '2026-04-06T03:00:00Z',
        checkedFiles: 288,
        totalFiles: 288,
      },
    };
    assert.doesNotThrow(() => assertFullParityStatus(status));
  });

  it('rejects a slug-scoped parity status', () => {
    const status = {
      summary: {
        checkedAt: '2026-04-06T03:00:00Z',
        checkedFiles: 1,
        totalFiles: 288,
      },
    };
    assert.throws(() => assertFullParityStatus(status), /full-repo run/);
  });
});

// ---------------------------------------------------------------------------
// buildBaselineFromStatus
// ---------------------------------------------------------------------------

describe('buildBaselineFromStatus', () => {
  it('extracts only BASELINE_ELIGIBLE_TYPES issues', () => {
    const baseline = buildBaselineFromStatus(sampleStatus, fingerprintMap, meta);
    assert.equal(baseline.entries.length, 4);
    const types = baseline.entries.map((e) => e.issueType).sort();
    assert.deepEqual(types, [
      'segment-extra',
      'segment-inconclusive',
      'segment-missing',
      'segment-token-gap',
    ]);
  });

  it('uses jaSegmentIndex (not enSegmentIndex) for segment-extra entries', () => {
    const baseline = buildBaselineFromStatus(sampleStatus, fingerprintMap, meta);
    const extra = baseline.entries.find((e) => e.issueType === 'segment-extra');
    assert.equal(extra.jaSegmentIndex, 5);
    assert.equal(extra.enSegmentIndex, null);
  });

  it('preserves inconclusiveCategory and inconclusiveReason for segment-inconclusive', () => {
    const baseline = buildBaselineFromStatus(sampleStatus, fingerprintMap, meta);
    const inc = baseline.entries.find((e) => e.issueType === 'segment-inconclusive');
    assert.equal(inc.inconclusiveCategory, 'heading-count-mismatch');
    assert.match(inc.inconclusiveReason, /Heading count mismatch/);
  });

  it('skips files whose slug has no fingerprint mapping (defensive)', () => {
    const fpMap = new Map();
    const baseline = buildBaselineFromStatus(sampleStatus, fpMap, meta);
    assert.equal(baseline.entries.length, 0);
  });

  it('includes already-baselined issues so full regeneration from tagged status is lossless', () => {
    const status = JSON.parse(JSON.stringify(sampleStatus));
    status.files[0].issues[0].baselined = true;
    const baseline = buildBaselineFromStatus(status, fingerprintMap, meta);
    assert.equal(baseline.entries.length, 4);
  });

  it('attaches the page-level snapshotFingerprint to every entry', () => {
    const baseline = buildBaselineFromStatus(sampleStatus, fingerprintMap, meta);
    for (const entry of baseline.entries) {
      assert.equal(entry.snapshotFingerprint, VALID_FINGERPRINT);
    }
  });

  it('copies owner-side source fingerprints and token signatures into entries', () => {
    const baseline = buildBaselineFromStatus(sampleStatus, fingerprintMap, meta);
    const missing = baseline.entries.find((e) => e.issueType === 'segment-missing');
    const extra = baseline.entries.find((e) => e.issueType === 'segment-extra');
    const tokenGap = baseline.entries.find((e) => e.issueType === 'segment-token-gap');
    assert.equal(missing.enSourceFingerprint, EN_SEGMENT_FINGERPRINT);
    assert.equal(extra.jaSourceFingerprint, JA_SEGMENT_FINGERPRINT);
    assert.deepEqual(tokenGap.missingTokens, ['--proxy', 'TESTIM_KEY']);
  });
});

// ---------------------------------------------------------------------------
// serializeBaseline — deterministic output
// ---------------------------------------------------------------------------

describe('serializeBaseline', () => {
  it('produces deterministic, bit-identical output for the same input', () => {
    const baseline = buildBaselineFromStatus(sampleStatus, fingerprintMap, meta);
    const a = serializeBaseline(baseline);
    const b = serializeBaseline(baseline);
    assert.equal(a, b);
  });

  it('emits 2-space indent and LF terminator', () => {
    const baseline = buildBaselineFromStatus(sampleStatus, fingerprintMap, meta);
    const out = serializeBaseline(baseline);
    assert.ok(out.endsWith('\n'));
    assert.match(out, /\n {2}"schemaVersion"/);
  });

  it('sorts entries by slug → issueType → sectionPath → segmentKind → index', () => {
    const baseline = {
      schemaVersion: 1,
      generatedAt: '2026-04-06T03:00:00Z',
      generatedFromRunId: 'test',
      rationale: 'test',
      entries: [
        {
          slug: 'b/page',
          issueType: 'segment-missing',
          sectionPath: 'A',
          segmentKind: 'paragraph',
          enSegmentIndex: 0,
          jaSegmentIndex: null,
          enSourceFingerprint: EN_SEGMENT_FINGERPRINT,
          jaSourceFingerprint: null,
          missingTokens: null,
          snapshotFingerprint: VALID_FINGERPRINT,
          inconclusiveCategory: null,
          inconclusiveReason: null,
          reviewAfter: '2026-10-06',
        },
        {
          slug: 'a/page',
          issueType: 'segment-missing',
          sectionPath: 'A',
          segmentKind: 'paragraph',
          enSegmentIndex: 0,
          jaSegmentIndex: null,
          enSourceFingerprint: OTHER_FINGERPRINT,
          jaSourceFingerprint: null,
          missingTokens: null,
          snapshotFingerprint: VALID_FINGERPRINT,
          inconclusiveCategory: null,
          inconclusiveReason: null,
          reviewAfter: '2026-10-06',
        },
      ],
    };
    const out = serializeBaseline(baseline);
    const aIdx = out.indexOf('"slug": "a/page"');
    const bIdx = out.indexOf('"slug": "b/page"');
    assert.ok(aIdx < bIdx, 'a/page must appear before b/page');
  });

  it('produces bit-identical output across two independent buildBaselineFromStatus calls (C5)', () => {
    const out1 = serializeBaseline(buildBaselineFromStatus(sampleStatus, fingerprintMap, meta));
    const out2 = serializeBaseline(buildBaselineFromStatus(sampleStatus, fingerprintMap, meta));
    assert.equal(out1, out2);
  });
});

// ---------------------------------------------------------------------------
// mergePartialBaseline — partial regeneration
// ---------------------------------------------------------------------------

describe('mergePartialBaseline', () => {
  const existing = {
    schemaVersion: 1,
    generatedAt: '2026-04-01T00:00:00Z',
    generatedFromRunId: 'old-run',
    rationale: 'existing',
    entries: [
      {
        slug: 'overview/example',
        issueType: 'segment-missing',
        sectionPath: 'Setup',
        segmentKind: 'paragraph',
        enSegmentIndex: 0,
        jaSegmentIndex: null,
        enSourceFingerprint: EN_SEGMENT_FINGERPRINT,
        jaSourceFingerprint: null,
        missingTokens: null,
        snapshotFingerprint: OTHER_FINGERPRINT,
        inconclusiveCategory: null,
        inconclusiveReason: null,
        reviewAfter: '2026-09-01',
      },
      {
        slug: 'other/page',
        issueType: 'segment-missing',
        sectionPath: 'Other',
        segmentKind: 'paragraph',
        enSegmentIndex: 1,
        jaSegmentIndex: null,
        enSourceFingerprint: OTHER_FINGERPRINT,
        jaSourceFingerprint: null,
        missingTokens: null,
        snapshotFingerprint: VALID_FINGERPRINT,
        inconclusiveCategory: null,
        inconclusiveReason: null,
        reviewAfter: '2026-09-01',
      },
    ],
  };

  it('removes only entries for the targeted slug and adds new ones', () => {
    const newEntriesForSlug = [
      {
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
      },
    ];
    const merged = mergePartialBaseline(existing, ['overview/example'], newEntriesForSlug, {
      generatedAt: '2026-04-06T03:00:00Z',
      generatedFromRunId: 'new-run',
      rationale: 'partial',
    });
    assert.equal(merged.entries.length, 2);
    const otherEntry = merged.entries.find((e) => e.slug === 'other/page');
    assert.ok(otherEntry, 'other/page entry must be preserved');
    const overviewEntry = merged.entries.find((e) => e.slug === 'overview/example');
    assert.equal(overviewEntry.snapshotFingerprint, VALID_FINGERPRINT);
    assert.equal(overviewEntry.enSegmentIndex, 2);
  });

  it('removes targeted slug entirely if no new entries provided', () => {
    const merged = mergePartialBaseline(existing, ['overview/example'], [], {
      generatedAt: '2026-04-06T03:00:00Z',
      generatedFromRunId: 'new-run',
      rationale: 'partial',
    });
    assert.equal(merged.entries.length, 1);
    assert.equal(merged.entries[0].slug, 'other/page');
  });

  it('updates meta fields (generatedAt, runId, rationale)', () => {
    const merged = mergePartialBaseline(existing, ['overview/example'], [], {
      generatedAt: '2026-04-06T03:00:00Z',
      generatedFromRunId: 'new-run',
      rationale: 'partial',
    });
    assert.equal(merged.generatedAt, '2026-04-06T03:00:00Z');
    assert.equal(merged.generatedFromRunId, 'new-run');
    assert.equal(merged.rationale, 'partial');
  });
});
