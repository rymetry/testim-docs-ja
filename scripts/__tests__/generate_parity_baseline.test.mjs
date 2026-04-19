/**
 * Tests for the baseline generation script.
 *
 * Validates pure helpers (buildBaselineFromStatus, serializeBaseline,
 * mergePartialBaseline, defaultReviewAfter) and verifies determinism.
 * The CLI invocation is exercised by an end-to-end smoke test.
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  assertFullParityStatus,
  assertPreRegenGate,
  buildBaselineFromStatus,
  buildGenerationMeta,
  serializeBaseline,
  mergePartialBaseline,
  defaultReviewAfter,
  parseArgs,
  mergePartialBaselineByType,
  loadSnapshotDiffStatus,
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
          detail: 'alignment inconclusive: heading count mismatch',
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
// buildBaselineFromStatus: structure mismatch / source unusable 対応
// ---------------------------------------------------------------------------

describe('buildBaselineFromStatus: structure mismatch entry', () => {
  const VALID_SNAPSHOT_FP = 'sha256:' + 'f'.repeat(64);
  const fpMap = new Map([
    ['running-tests/the-command-line-cli', VALID_SNAPSHOT_FP],
    ['salesforce-testing/faq', VALID_SNAPSHOT_FP],
  ]);
  const baselineMeta = {
    runId: 'baseline-run',
    generatedAt: '2026-04-06T03:00:00Z',
    reviewAfterOverride: '2026-10-06',
    rationale: 'baseline',
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
    const baseline = buildBaselineFromStatus(status, fpMap, baselineMeta);
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
    const baseline = buildBaselineFromStatus(status, fpMap, baselineMeta);
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
    const baseline = buildBaselineFromStatus(status, fpMap, baselineMeta);
    assert.equal(baseline.entries.length, 0);
  });
});

describe('buildBaselineFromStatus: source unusable entry', () => {
  const VALID_SNAPSHOT_FP = 'sha256:' + 'f'.repeat(64);
  const fpMap = new Map([['salesforce-testing/faq', VALID_SNAPSHOT_FP]]);
  const baselineMeta = {
    runId: 'baseline-run',
    generatedAt: '2026-04-06T03:00:00Z',
    reviewAfterOverride: '2026-10-06',
    rationale: 'baseline',
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
    const baseline = buildBaselineFromStatus(status, fpMap, baselineMeta);
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
    const baseline = buildBaselineFromStatus(status, fpMap, baselineMeta);
    assert.equal(baseline.entries.length, 0);
  });
});

describe('sortEntries: structure / source unusable types', () => {
  const VALID_SNAPSHOT_FP = 'sha256:' + 'f'.repeat(64);
  const fpMap = new Map([
    ['some/page', VALID_SNAPSHOT_FP],
  ]);
  const baselineMeta = {
    runId: 'baseline-run',
    generatedAt: '2026-04-06T03:00:00Z',
    reviewAfterOverride: '2026-10-06',
    rationale: 'baseline',
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
    const baseline = buildBaselineFromStatus(status, fpMap, baselineMeta);
    const out = serializeBaseline(baseline);
    // sectionIndex=1 が先に来る
    const idx1 = out.indexOf('"sectionIndex": 1');
    const idx5 = out.indexOf('"sectionIndex": 5');
    assert.ok(idx1 > -1 && idx5 > -1);
    assert.ok(idx1 < idx5, 'sectionIndex=1 must appear before sectionIndex=5');
  });
});

// ---------------------------------------------------------------------------
// parseArgs: --types partial mode
// ---------------------------------------------------------------------------

describe('parseArgs: --types partial mode', () => {
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

describe('mergePartialBaselineByType', () => {
  const VALID_SNAPSHOT_FP = 'sha256:' + 'f'.repeat(64);
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
        snapshotFingerprint: VALID_SNAPSHOT_FP,
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
      snapshotFingerprint: VALID_SNAPSHOT_FP,
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
        generatedFromRunId: 'baseline-run',
        rationale: 'partial baseline',
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
          snapshotFingerprint: VALID_SNAPSHOT_FP,
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
        generatedFromRunId: 'baseline-run',
        rationale: 'partial baseline',
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
        generatedFromRunId: 'baseline-run',
        rationale: 'partial baseline',
      },
    );
    assert.equal(merged.entries.length, 1);
    assert.equal(merged.entries[0].issueType, 'segment-missing');
    assert.equal(merged.entries[0].reviewAfter, '2026-09-01');
  });
});

// ---------------------------------------------------------------------------
// validateTypesArg helper contract
// ---------------------------------------------------------------------------

describe('validateTypesArg', () => {
  let validateTypesArg;
  before(async () => {
    ({ validateTypesArg } = await import('../lib/source_parity_baseline.mjs'));
  });

  it('returns { ok: true } when types is null (--types not specified)', () => {
    assert.deepEqual(validateTypesArg(null), { ok: true });
  });

  it('returns { ok: false } for empty array (empty --types=)', () => {
    const result = validateTypesArg([]);
    assert.equal(result.ok, false);
    assert.match(result.error, /empty|空/);
  });

  it('returns { ok: false } for unknown types (typo guard)', () => {
    const result = validateTypesArg(['section-structure-misatch']);
    assert.equal(result.ok, false);
    assert.match(result.error, /unsupported|unknown|未知/);
    assert.match(result.error, /section-structure-misatch/);
  });

  it('returns { ok: false } when ANY element is unknown (mixed input)', () => {
    const result = validateTypesArg(['section-structure-mismatch', 'foo-bar']);
    assert.equal(result.ok, false);
    assert.match(result.error, /foo-bar/);
  });

  it('returns { ok: true } for the 4 allowlisted types', () => {
    for (const t of [
      'section-structure-mismatch',
      'segment-order-mismatch',
      'snapshot-incomplete',
      'source-unusable',
    ]) {
      assert.deepEqual(
        validateTypesArg([t]),
        { ok: true },
        `${t} should be accepted`,
      );
    }
  });

  it('returns { ok: true } for a combination of allowlisted types', () => {
    const result = validateTypesArg([
      'section-structure-mismatch',
      'snapshot-incomplete',
    ]);
    assert.deepEqual(result, { ok: true });
  });

  it('rejects legacy segment-* types (tightest allowlist)', () => {
    // segment-missing / segment-extra / segment-shifted / segment-untranslated /
    // segment-token-gap / segment-inconclusive は --types 経路では扱わない。
    // これらを書き換えたいときは --regenerate か --slug で処理する。
    for (const t of [
      'segment-missing',
      'segment-extra',
      'segment-shifted',
      'segment-untranslated',
      'segment-token-gap',
      'segment-inconclusive',
    ]) {
      const result = validateTypesArg([t]);
      assert.equal(
        result.ok,
        false,
        `${t} should NOT be accepted by --types (use --regenerate instead)`,
      );
    }
  });

  it('rejects non-array input defensively', () => {
    const result = validateTypesArg('section-structure-mismatch');
    assert.equal(result.ok, false);
  });
});

describe('parseArgs + validateTypesArg integration', () => {
  let validateTypesArg;
  before(async () => {
    ({ validateTypesArg } = await import('../lib/source_parity_baseline.mjs'));
  });

  it('parseArgs(["--types="]) produces an empty array which validateTypesArg rejects', () => {
    const args = parseArgs(['--types=']);
    // filter(Boolean) が空要素を落として [] になる
    assert.deepEqual(args.types, []);
    // その [] を validateTypesArg に渡すと reject される
    const v = validateTypesArg(args.types);
    assert.equal(v.ok, false);
  });

  it('parseArgs(["--types=typo"]) produces ["typo"] which validateTypesArg rejects', () => {
    const args = parseArgs(['--types=section-structure-misatch']);
    assert.deepEqual(args.types, ['section-structure-misatch']);
    const v = validateTypesArg(args.types);
    assert.equal(v.ok, false);
    assert.match(v.error, /section-structure-misatch/);
  });

  it('parseArgs(["--types=source-unusable"]) round-trips as valid', () => {
    const args = parseArgs(['--types=source-unusable']);
    assert.deepEqual(args.types, ['source-unusable']);
    const v = validateTypesArg(args.types);
    assert.equal(v.ok, true);
  });
});

// ---------------------------------------------------------------------------
// Pre-regen fail-closed gate (proposal I, Codex Round-3 approved)
//
// Source contract:
//   - docs/superpowers/specs/2026-04-14-parity-phase4-final-goal.md §2
//     (PR Z entry fail-closed invariants)
//   - docs/superpowers/plans/2026-04-16-m2-parity-burndown.md §4
//     (baseline 再生成, pre-regen fail-closed gate)
// ---------------------------------------------------------------------------

function makePassingStatus() {
  return {
    summary: {
      runScope: { isComplete: true },
      freshnessState: 'fresh',
      linkageState: 'linked',
      result: 'pass',
      orphanBaselineEntries: 0,
      checkedFiles: 288,
      totalFiles: 288,
      checkedAt: '2026-04-20T00:00:00.000Z',
    },
    debug: {
      patchCoverage: { mismatches: [] },
    },
    files: [],
  };
}

function makePassingSnapshotDiff() {
  return {
    summary: { changed: 0, added: 0, removed: 0, unchanged: 288, totalSnapshots: 288 },
  };
}

describe('assertPreRegenGate — full --regenerate fail-closed invariants', () => {
  it('passes when all invariants hold', () => {
    assert.doesNotThrow(() =>
      assertPreRegenGate(makePassingStatus(), makePassingSnapshotDiff()),
    );
  });

  it('throws when summary.runScope.isComplete is not true', () => {
    const s = makePassingStatus();
    s.summary.runScope = { isComplete: false };
    assert.throws(() => assertPreRegenGate(s, makePassingSnapshotDiff()), /runScope\.isComplete/);
  });

  it('throws when summary.freshnessState is not "fresh"', () => {
    const s = makePassingStatus();
    s.summary.freshnessState = 'stale';
    assert.throws(() => assertPreRegenGate(s, makePassingSnapshotDiff()), /freshnessState/);
  });

  it('throws when summary.linkageState is not "linked"', () => {
    const s = makePassingStatus();
    s.summary.linkageState = 'missing';
    assert.throws(() => assertPreRegenGate(s, makePassingSnapshotDiff()), /linkageState/);
  });

  it('throws when summary.result is not "pass"', () => {
    const s = makePassingStatus();
    s.summary.result = 'inconclusive';
    assert.throws(() => assertPreRegenGate(s, makePassingSnapshotDiff()), /summary\.result/);
  });

  it('throws when summary.orphanBaselineEntries is non-zero', () => {
    const s = makePassingStatus();
    s.summary.orphanBaselineEntries = 3;
    assert.throws(() => assertPreRegenGate(s, makePassingSnapshotDiff()), /orphanBaselineEntries/);
  });

  it('throws when debug.patchCoverage.mismatches is non-empty', () => {
    const s = makePassingStatus();
    s.debug.patchCoverage.mismatches = [{ patchId: 'UD-001A', slug: 'x/y' }];
    assert.throws(() => assertPreRegenGate(s, makePassingSnapshotDiff()), /patchCoverage\.mismatches/);
  });

  it('throws when debug.patchCoverage.mismatches is missing (not an array)', () => {
    const s = makePassingStatus();
    s.debug = {};
    assert.throws(() => assertPreRegenGate(s, makePassingSnapshotDiff()), /patchCoverage\.mismatches/);
  });

  it('throws when snapshotDiff.summary.changed is non-zero', () => {
    const d = makePassingSnapshotDiff();
    d.summary.changed = 1;
    assert.throws(() => assertPreRegenGate(makePassingStatus(), d), /snapshotDiff\.summary\.changed/);
  });

  it('throws when snapshotDiff.summary.added is non-zero', () => {
    const d = makePassingSnapshotDiff();
    d.summary.added = 2;
    assert.throws(() => assertPreRegenGate(makePassingStatus(), d), /snapshotDiff\.summary\.added/);
  });

  it('throws when snapshotDiff.summary.removed is non-zero', () => {
    const d = makePassingSnapshotDiff();
    d.summary.removed = 4;
    assert.throws(
      () => assertPreRegenGate(makePassingStatus(), d),
      /snapshotDiff\.summary\.removed/,
    );
  });

  it('throws when snapshotDiff.summary is missing', () => {
    assert.throws(
      () => assertPreRegenGate(makePassingStatus(), {}),
      /snapshot-diff-status\.json: summary/,
    );
  });

  it('throws when status.summary is missing', () => {
    assert.throws(
      () => assertPreRegenGate({}, makePassingSnapshotDiff()),
      /summary missing or not an object/,
    );
  });

  it('aggregates multiple failures in a single error message', () => {
    const s = makePassingStatus();
    s.summary.freshnessState = 'stale';
    s.summary.linkageState = 'missing';
    s.summary.result = 'inconclusive';
    const d = makePassingSnapshotDiff();
    d.summary.changed = 2;
    let err;
    try {
      assertPreRegenGate(s, d);
    } catch (e) {
      err = e;
    }
    assert.ok(err, 'expected throw');
    assert.match(err.message, /freshnessState/);
    assert.match(err.message, /linkageState/);
    assert.match(err.message, /summary\.result/);
    assert.match(err.message, /snapshotDiff\.summary\.changed/);
  });
});

describe('loadSnapshotDiffStatus — missing / unparseable is gate failure', () => {
  it('throws when file is missing', () => {
    const missing = path.join(os.tmpdir(), `non-existent-${Date.now()}-${Math.random()}.json`);
    assert.throws(() => loadSnapshotDiffStatus(missing), /not found/);
  });

  it('throws when file is unparseable JSON', () => {
    const tmp = path.join(os.tmpdir(), `bad-json-${Date.now()}-${Math.random()}.json`);
    fs.writeFileSync(tmp, '{not json}');
    try {
      assert.throws(() => loadSnapshotDiffStatus(tmp), /parse failure/);
    } finally {
      fs.unlinkSync(tmp);
    }
  });

  it('returns parsed object when file is valid JSON', () => {
    const tmp = path.join(os.tmpdir(), `ok-json-${Date.now()}-${Math.random()}.json`);
    fs.writeFileSync(tmp, JSON.stringify({ summary: { changed: 0 } }));
    try {
      const parsed = loadSnapshotDiffStatus(tmp);
      assert.deepEqual(parsed, { summary: { changed: 0 } });
    } finally {
      fs.unlinkSync(tmp);
    }
  });
});
