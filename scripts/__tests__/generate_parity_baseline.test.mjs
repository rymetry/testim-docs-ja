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
  parseArgs,
  mergePartialBaselineByType,
} from '../generate_parity_baseline.mjs';
import { computeStructureFingerprint } from '../lib/source_parity_baseline.mjs';

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
  // Locks every entry to 2026-10-06 by overriding the staggered default,
  // so legacy assertions that expect a single reviewAfter date keep working.
  reviewAfterOverride: '2026-10-06',
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
    // No reviewAfter on meta — per-entry stagger lives in
    // buildBaselineFromStatus. The override slot defaults to null.
    assert.equal(metaFromEarlyCall.reviewAfterOverride, null);
  });

  it('honors explicit rationale and reviewAfter overrides', () => {
    const metaOverride = buildGenerationMeta(sampleStatus, {
      regenerate: false,
      slugs: ['overview/example'],
      rationale: 'custom rationale',
      reviewAfter: '2026-12-31',
    });
    assert.equal(metaOverride.rationale, 'custom rationale');
    assert.equal(metaOverride.reviewAfterOverride, '2026-12-31');
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

  it('staggers reviewAfter per slug when no override is set (§5)', () => {
    // Two slugs from a sample status with no reviewAfterOverride. Their
    // reviewAfter values must each be 6 months out from generatedAt plus
    // a deterministic per-slug offset in [0, 90) days.
    const status = {
      summary: { checkedAt: '2026-04-06T00:00:00Z', checkedFiles: 2, totalFiles: 2 },
      files: [
        {
          file: 'src/content/docs/section/page-a.md',
          issues: [
            {
              type: 'segment-missing',
              sectionPath: 'Setup',
              segmentKind: 'paragraph',
              enSegmentIndex: 0,
              enSourceFingerprint: EN_SEGMENT_FINGERPRINT,
            },
          ],
        },
        {
          file: 'src/content/docs/section/page-b.md',
          issues: [
            {
              type: 'segment-missing',
              sectionPath: 'Setup',
              segmentKind: 'paragraph',
              enSegmentIndex: 0,
              enSourceFingerprint: EN_SEGMENT_FINGERPRINT,
            },
          ],
        },
      ],
    };
    const fpMap = new Map([
      ['section/page-a', VALID_FINGERPRINT],
      ['section/page-b', VALID_FINGERPRINT],
    ]);
    const baseline = buildBaselineFromStatus(status, fpMap, {
      runId: 'r',
      generatedAt: '2026-04-06T00:00:00Z',
      reviewAfterOverride: null,
      rationale: 'r',
    });
    const a = baseline.entries.find((e) => e.slug === 'section/page-a');
    const b = baseline.entries.find((e) => e.slug === 'section/page-b');
    assert.match(a.reviewAfter, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(b.reviewAfter, /^\d{4}-\d{2}-\d{2}$/);
    // Different slugs MUST hit different cells of the stagger window
    // (deterministic per-slug hash). If this ever flakes, recheck
    // staggeredOffsetDays.
    assert.notEqual(a.reviewAfter, b.reviewAfter);
    // Both must be at least 6 months past generatedAt (the base date).
    assert.ok(a.reviewAfter >= '2026-10-06');
    assert.ok(b.reviewAfter >= '2026-10-06');
    // And both must be within base + 90 days (stagger window).
    assert.ok(a.reviewAfter < '2027-01-04');
    assert.ok(b.reviewAfter < '2027-01-04');
  });

  it('staggered reviewAfter is deterministic across runs (§5)', () => {
    const status = {
      summary: { checkedAt: '2026-04-06T00:00:00Z', checkedFiles: 1, totalFiles: 1 },
      files: [
        {
          file: 'src/content/docs/section/page-a.md',
          issues: [
            {
              type: 'segment-missing',
              sectionPath: 'Setup',
              segmentKind: 'paragraph',
              enSegmentIndex: 0,
              enSourceFingerprint: EN_SEGMENT_FINGERPRINT,
            },
          ],
        },
      ],
    };
    const fpMap = new Map([['section/page-a', VALID_FINGERPRINT]]);
    const metaNoOverride = {
      runId: 'r',
      generatedAt: '2026-04-06T00:00:00Z',
      reviewAfterOverride: null,
      rationale: 'r',
    };
    const a = buildBaselineFromStatus(status, fpMap, metaNoOverride);
    const b = buildBaselineFromStatus(status, fpMap, metaNoOverride);
    assert.equal(a.entries[0].reviewAfter, b.entries[0].reviewAfter);
  });

  it('reviewAfterOverride disables stagger and locks every entry to one date (§5)', () => {
    const status = {
      summary: { checkedAt: '2026-04-06T00:00:00Z', checkedFiles: 2, totalFiles: 2 },
      files: [
        {
          file: 'src/content/docs/section/page-a.md',
          issues: [
            {
              type: 'segment-missing',
              sectionPath: 'Setup',
              segmentKind: 'paragraph',
              enSegmentIndex: 0,
              enSourceFingerprint: EN_SEGMENT_FINGERPRINT,
            },
          ],
        },
        {
          file: 'src/content/docs/section/page-b.md',
          issues: [
            {
              type: 'segment-missing',
              sectionPath: 'Setup',
              segmentKind: 'paragraph',
              enSegmentIndex: 0,
              enSourceFingerprint: EN_SEGMENT_FINGERPRINT,
            },
          ],
        },
      ],
    };
    const fpMap = new Map([
      ['section/page-a', VALID_FINGERPRINT],
      ['section/page-b', VALID_FINGERPRINT],
    ]);
    const baseline = buildBaselineFromStatus(status, fpMap, {
      runId: 'r',
      generatedAt: '2026-04-06T00:00:00Z',
      reviewAfterOverride: '2027-01-15',
      rationale: 'r',
    });
    for (const entry of baseline.entries) {
      assert.equal(entry.reviewAfter, '2027-01-15');
    }
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

// ---------------------------------------------------------------------------
// Issue #247 PR5 — buildBaselineFromStatus 新 type 対応
//
// structure mismatch / source unusable を baseline 可能にする (§3.9)。
// entry 形は §3.2 / §3.3 に従い、structureFingerprint を helper で derive する。
// ---------------------------------------------------------------------------

describe('Issue #247 PR5 — buildBaselineFromStatus structure mismatch entry', () => {
  const PR5_FP = 'sha256:' + 'f'.repeat(64);
  const fpMap = new Map([
    ['running-tests/the-command-line-cli', PR5_FP],
    ['salesforce-testing/faq', PR5_FP],
  ]);
  const pr5Meta = {
    runId: 'pr5',
    generatedAt: '2026-04-06T03:00:00Z',
    reviewAfterOverride: '2026-10-06',
    rationale: 'pr5',
  };

  function statusWithStructureMismatch() {
    return {
      summary: { checkedAt: '2026-04-06T03:00:00Z', checkedFiles: 1, totalFiles: 1 },
      files: [
        {
          file: 'src/content/docs/running-tests/the-command-line-cli.md',
          issues: [
            {
              type: 'section-structure-mismatch',
              severity: 'actionable',
              detail: '[CLI Installation > Basic CLI command] block kind multiset differs',
              sectionPath: 'CLI Installation > Basic CLI command',
              sectionIndex: 7,
              structureCategory: 'kind-multiset',
              enKinds: ['paragraph', 'bullet-list', 'paragraph'],
              jaKinds: ['paragraph', 'paragraph'],
            },
          ],
        },
      ],
    };
  }

  it('emits a structure mismatch entry with sectionIndex / sectionPath / structureCategory / structureFingerprint', () => {
    const status = statusWithStructureMismatch();
    const baseline = buildBaselineFromStatus(status, fpMap, pr5Meta);
    assert.equal(baseline.entries.length, 1);
    const entry = baseline.entries[0];
    assert.equal(entry.issueType, 'section-structure-mismatch');
    assert.equal(entry.slug, 'running-tests/the-command-line-cli');
    assert.equal(entry.sectionIndex, 7);
    assert.equal(entry.sectionPath, 'CLI Installation > Basic CLI command');
    assert.equal(entry.structureCategory, 'kind-multiset');
    assert.match(entry.structureFingerprint, /^sha256:[0-9a-f]{64}$/);
  });

  it('structureFingerprint matches computeStructureFingerprint helper', () => {
    const status = statusWithStructureMismatch();
    const baseline = buildBaselineFromStatus(status, fpMap, pr5Meta);
    const entry = baseline.entries[0];
    const expected = computeStructureFingerprint({
      structureCategory: 'kind-multiset',
      enKinds: ['paragraph', 'bullet-list', 'paragraph'],
      jaKinds: ['paragraph', 'paragraph'],
    });
    assert.equal(entry.structureFingerprint, expected);
  });

  it('skips a structure mismatch issue with malformed sectionIndex', () => {
    const status = {
      summary: { checkedAt: '2026-04-06T03:00:00Z', checkedFiles: 1, totalFiles: 1 },
      files: [
        {
          file: 'src/content/docs/running-tests/the-command-line-cli.md',
          issues: [
            {
              type: 'section-structure-mismatch',
              severity: 'actionable',
              sectionPath: 'CLI',
              sectionIndex: 'not-a-number',
              structureCategory: 'kind-multiset',
              enKinds: ['paragraph'],
              jaKinds: ['paragraph'],
            },
          ],
        },
      ],
    };
    const baseline = buildBaselineFromStatus(status, fpMap, pr5Meta);
    assert.equal(baseline.entries.length, 0);
  });
});

describe('Issue #247 PR5 — buildBaselineFromStatus source unusable entry', () => {
  const PR5_FP = 'sha256:' + 'f'.repeat(64);
  const fpMap = new Map([['salesforce-testing/faq', PR5_FP]]);
  const pr5Meta = {
    runId: 'pr5',
    generatedAt: '2026-04-06T03:00:00Z',
    reviewAfterOverride: '2026-10-06',
    rationale: 'pr5',
  };

  it('emits a source unusable entry with usabilityReason from issue.usabilitySignals.reason', () => {
    const status = {
      summary: { checkedAt: '2026-04-06T03:00:00Z', checkedFiles: 1, totalFiles: 1 },
      files: [
        {
          file: 'src/content/docs/salesforce-testing/faq.md',
          issues: [
            {
              type: 'source-unusable',
              severity: 'actionable',
              detail: 'source snapshot is unusable (escaped-details-residue)',
              usabilitySignals: { reason: 'escaped-details-residue' },
            },
          ],
        },
      ],
    };
    const baseline = buildBaselineFromStatus(status, fpMap, pr5Meta);
    assert.equal(baseline.entries.length, 1);
    const entry = baseline.entries[0];
    assert.equal(entry.issueType, 'source-unusable');
    assert.equal(entry.slug, 'salesforce-testing/faq');
    assert.equal(entry.usabilityReason, 'escaped-details-residue');
  });

  it('skips a source unusable issue with unknown reason', () => {
    const status = {
      summary: { checkedAt: '2026-04-06T03:00:00Z', checkedFiles: 1, totalFiles: 1 },
      files: [
        {
          file: 'src/content/docs/salesforce-testing/faq.md',
          issues: [
            {
              type: 'source-unusable',
              severity: 'actionable',
              usabilitySignals: { reason: 'unknown-reason' },
            },
          ],
        },
      ],
    };
    const baseline = buildBaselineFromStatus(status, fpMap, pr5Meta);
    assert.equal(baseline.entries.length, 0);
  });
});

describe('Issue #247 PR5 — sortEntries with structure / source unusable types', () => {
  const PR5_FP = 'sha256:' + 'f'.repeat(64);
  const fpMap = new Map([
    ['some/page', PR5_FP],
  ]);
  const pr5Meta = {
    runId: 'pr5',
    generatedAt: '2026-04-06T03:00:00Z',
    reviewAfterOverride: '2026-10-06',
    rationale: 'pr5',
  };

  it('sorts structure mismatch entries by sectionIndex within slug', () => {
    const status = {
      summary: { checkedAt: '2026-04-06T03:00:00Z', checkedFiles: 1, totalFiles: 1 },
      files: [
        {
          file: 'src/content/docs/some/page.md',
          issues: [
            {
              type: 'section-structure-mismatch',
              severity: 'actionable',
              sectionPath: 'A',
              sectionIndex: 5,
              structureCategory: 'kind-multiset',
              enKinds: ['paragraph'],
              jaKinds: ['paragraph', 'paragraph'],
            },
            {
              type: 'section-structure-mismatch',
              severity: 'actionable',
              sectionPath: 'B',
              sectionIndex: 1,
              structureCategory: 'kind-multiset',
              enKinds: ['paragraph'],
              jaKinds: ['paragraph', 'paragraph'],
            },
          ],
        },
      ],
    };
    const baseline = buildBaselineFromStatus(status, fpMap, pr5Meta);
    const out = serializeBaseline(baseline);
    // sectionIndex=1 が先に来る
    const idx1 = out.indexOf('"sectionIndex": 1');
    const idx5 = out.indexOf('"sectionIndex": 5');
    assert.ok(idx1 > -1 && idx5 > -1);
    assert.ok(idx1 < idx5, 'sectionIndex=1 must appear before sectionIndex=5');
  });
});

// ---------------------------------------------------------------------------
// Issue #247 PR5 — parseArgs / --types partial mode
//
// 既存 segment-* エントリの reviewAfter を意図せず shift させずに、
// 新 4 type 向けの entry だけを再生成するモード (§7.4)。
// ---------------------------------------------------------------------------

describe('Issue #247 PR5 — parseArgs --types partial mode', () => {
  it('parses --types=<csv> into a string[] of issue types', () => {
    const args = parseArgs([
      '--types=section-structure-mismatch,segment-order-mismatch',
    ]);
    assert.deepEqual(args.types, [
      'section-structure-mismatch',
      'segment-order-mismatch',
    ]);
  });

  it('returns null types when not specified', () => {
    const args = parseArgs(['--regenerate']);
    assert.equal(args.types, null);
  });

  it('treats --types as mutually exclusive with --regenerate (parsing returns both)', () => {
    // CLI validation that this combination is invalid lives in main();
    // here we only check that parseArgs surfaces both flags so main can
    // detect the conflict.
    const args = parseArgs(['--regenerate', '--types=source-unusable']);
    assert.equal(args.regenerate, true);
    assert.deepEqual(args.types, ['source-unusable']);
  });

  it('treats --types as mutually exclusive with --slug (parsing returns both)', () => {
    const args = parseArgs(['--slug=overview/foo', '--types=source-unusable']);
    assert.deepEqual(args.slugs, ['overview/foo']);
    assert.deepEqual(args.types, ['source-unusable']);
  });
});

describe('Issue #247 PR5 — mergePartialBaselineByType', () => {
  const PR5_FP = 'sha256:' + 'f'.repeat(64);
  const SEG_FP = 'sha256:' + 'c'.repeat(64);

  const existing = {
    schemaVersion: 1,
    generatedAt: '2026-03-01T00:00:00Z',
    generatedFromRunId: 'old-run',
    rationale: 'existing baseline',
    entries: [
      {
        slug: 'overview/example',
        issueType: 'segment-missing',
        sectionPath: 'Setup',
        segmentKind: 'paragraph',
        enSegmentIndex: 0,
        jaSegmentIndex: null,
        enSourceFingerprint: SEG_FP,
        jaSourceFingerprint: null,
        missingTokens: null,
        snapshotFingerprint: PR5_FP,
        inconclusiveCategory: null,
        inconclusiveReason: null,
        // 重要: 既存 segment-* エントリの reviewAfter は touch 禁止 (§7.4)
        reviewAfter: '2026-09-01',
      },
    ],
  };

  it('replaces only entries whose issueType is in typesToReplace', () => {
    const newStructureEntry = {
      slug: 'running-tests/the-command-line-cli',
      issueType: 'section-structure-mismatch',
      snapshotFingerprint: PR5_FP,
      reviewAfter: '2026-10-06',
      sectionIndex: 7,
      sectionPath: 'CLI Installation > Basic CLI command',
      structureCategory: 'kind-multiset',
      structureFingerprint: 'sha256:' + '1'.repeat(64),
    };
    const merged = mergePartialBaselineByType(
      existing,
      ['section-structure-mismatch', 'segment-order-mismatch'],
      [newStructureEntry],
      {
        generatedAt: '2026-04-06T03:00:00Z',
        generatedFromRunId: 'pr5-run',
        rationale: 'pr5 partial',
      },
    );
    assert.equal(merged.entries.length, 2);
    // 既存 segment-* は bit-identical で残る (reviewAfter 含む)
    const segEntry = merged.entries.find((e) => e.issueType === 'segment-missing');
    assert.equal(segEntry.reviewAfter, '2026-09-01');
    // 新 type の entry が追加されている
    const structEntry = merged.entries.find(
      (e) => e.issueType === 'section-structure-mismatch',
    );
    assert.ok(structEntry);
    assert.equal(structEntry.sectionIndex, 7);
  });

  it('removes existing entries of the targeted types when no new entries are provided', () => {
    const existingWithStructure = {
      ...existing,
      entries: [
        ...existing.entries,
        {
          slug: 'running-tests/the-command-line-cli',
          issueType: 'section-structure-mismatch',
          snapshotFingerprint: PR5_FP,
          reviewAfter: '2026-10-06',
          sectionIndex: 7,
          sectionPath: 'CLI',
          structureCategory: 'kind-multiset',
          structureFingerprint: 'sha256:' + '1'.repeat(64),
        },
      ],
    };
    const merged = mergePartialBaselineByType(
      existingWithStructure,
      ['section-structure-mismatch'],
      [],
      {
        generatedAt: '2026-04-06T03:00:00Z',
        generatedFromRunId: 'pr5-run',
        rationale: 'pr5 partial',
      },
    );
    assert.equal(merged.entries.length, 1);
    assert.equal(merged.entries[0].issueType, 'segment-missing');
  });

  it('preserves entries whose issueType is NOT in typesToReplace', () => {
    const merged = mergePartialBaselineByType(
      existing,
      ['section-structure-mismatch'],
      [],
      {
        generatedAt: '2026-04-06T03:00:00Z',
        generatedFromRunId: 'pr5-run',
        rationale: 'pr5 partial',
      },
    );
    assert.equal(merged.entries.length, 1);
    assert.equal(merged.entries[0].issueType, 'segment-missing');
    assert.equal(merged.entries[0].reviewAfter, '2026-09-01');
  });
});
