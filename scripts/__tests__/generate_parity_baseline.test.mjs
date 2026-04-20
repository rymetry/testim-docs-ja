/**
 * Tests for the baseline generation script (schema v2).
 *
 * Validates pure helpers (buildBaselineFromStatus, serializeBaseline,
 * mergePartialBaseline) and verifies determinism.
 * The CLI invocation is exercised by an end-to-end smoke test.
 *
 * v2 変更点:
 *   - `--review-after` フラグ撤去 (渡すと exit 1)
 *   - baseline entry から reviewAfter / inconclusiveCategory /
 *     inconclusiveReason / usabilityReason を削除
 *   - 出力 schemaVersion=2、priority='medium' default
 *   - BASELINE_ELIGIBLE_TYPES から segment-inconclusive / snapshot-incomplete /
 *     source-unusable を除外 (7 type のみ baseline-able)
 *   - TYPES_ARG_ALLOWLIST も 2 type だけ: section-structure-mismatch /
 *     segment-order-mismatch
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  assertFullParityStatus,
  assertPreRegenGate,
  buildBaselineFromStatus,
  buildGenerationMeta,
  serializeBaseline,
  mergePartialBaseline,
  parseArgs,
  mergePartialBaselineByType,
  loadSnapshotDiffStatus,
} from '../detection/generate_parity_baseline.mjs';
import { computeStructureFingerprint } from '../lib/source_parity_baseline.mjs';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..', '..');
const GENERATE_SCRIPT = path.join(
  REPO_ROOT,
  'scripts',
  'detection',
  'generate_parity_baseline.mjs',
);

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
          // segment-inconclusive is NOT baseline-eligible in v2 — must be skipped
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
  rationale: 'test',
};

// ---------------------------------------------------------------------------
// buildGenerationMeta
// ---------------------------------------------------------------------------

describe('buildGenerationMeta', () => {
  it('derives deterministic metadata from status.summary.checkedAt', () => {
    const metaFromEarlyCall = buildGenerationMeta(sampleStatus, {
      regenerate: true,
      slugs: null,
      rationale: null,
    });
    const metaFromLaterCall = buildGenerationMeta(sampleStatus, {
      regenerate: true,
      slugs: null,
      rationale: null,
    });
    assert.deepEqual(metaFromEarlyCall, metaFromLaterCall);
    assert.equal(metaFromEarlyCall.generatedAt, '2026-04-06T03:00:00Z');
    assert.equal(
      metaFromEarlyCall.runId,
      '2026-04-06T03:00:00Z#parity-check-status',
    );
  });

  it('honors explicit rationale override', () => {
    const metaOverride = buildGenerationMeta(sampleStatus, {
      regenerate: false,
      slugs: ['overview/example'],
      rationale: 'custom rationale',
    });
    assert.equal(metaOverride.rationale, 'custom rationale');
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
  it('extracts only BASELINE_ELIGIBLE_TYPES issues (v2: 3 of 5 here; inconclusive is not eligible)', () => {
    const baseline = buildBaselineFromStatus(sampleStatus, fingerprintMap, meta);
    assert.equal(baseline.entries.length, 3);
    const types = baseline.entries.map((e) => e.issueType).sort();
    assert.deepEqual(types, [
      'segment-extra',
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

  it('does NOT emit segment-inconclusive entries (not baseline-able in v2)', () => {
    const baseline = buildBaselineFromStatus(sampleStatus, fingerprintMap, meta);
    const inc = baseline.entries.find((e) => e.issueType === 'segment-inconclusive');
    assert.equal(inc, undefined);
  });

  it('emits schemaVersion=2 on the output baseline', () => {
    const baseline = buildBaselineFromStatus(sampleStatus, fingerprintMap, meta);
    assert.equal(baseline.schemaVersion, 2);
  });

  it('emits priority=medium on every entry by default', () => {
    const baseline = buildBaselineFromStatus(sampleStatus, fingerprintMap, meta);
    for (const entry of baseline.entries) {
      assert.equal(entry.priority, 'medium');
    }
  });

  it('does NOT emit reviewAfter / inconclusiveCategory / usabilityReason on entries (v2 schema)', () => {
    const baseline = buildBaselineFromStatus(sampleStatus, fingerprintMap, meta);
    for (const entry of baseline.entries) {
      assert.ok(!('reviewAfter' in entry), `entry for ${entry.issueType} must not have reviewAfter`);
      assert.ok(
        !('inconclusiveCategory' in entry),
        `entry for ${entry.issueType} must not have inconclusiveCategory`,
      );
      assert.ok(
        !('usabilityReason' in entry),
        `entry for ${entry.issueType} must not have usabilityReason`,
      );
    }
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
    assert.equal(baseline.entries.length, 3);
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
      schemaVersion: 2,
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
          priority: 'medium',
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
          priority: 'medium',
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
    schemaVersion: 2,
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
        priority: 'medium',
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
        priority: 'medium',
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
        priority: 'medium',
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
// buildBaselineFromStatus: structure mismatch 対応
// ---------------------------------------------------------------------------

describe('buildBaselineFromStatus: structure mismatch entry', () => {
  const VALID_SNAPSHOT_FP = 'sha256:' + 'f'.repeat(64);
  const fpMap = new Map([
    ['running-tests/the-command-line-cli', VALID_SNAPSHOT_FP],
  ]);
  const baselineMeta = {
    runId: 'baseline-run',
    generatedAt: '2026-04-06T03:00:00Z',
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
    // v2: priority field is always populated (default medium)
    assert.equal(entry.priority, 'medium');
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

describe('buildBaselineFromStatus: source-unusable / snapshot-incomplete (NOT baseline-able in v2)', () => {
  const VALID_SNAPSHOT_FP = 'sha256:' + 'f'.repeat(64);
  const fpMap = new Map([['salesforce-testing/faq', VALID_SNAPSHOT_FP]]);
  const baselineMeta = {
    runId: 'baseline-run',
    generatedAt: '2026-04-06T03:00:00Z',
    rationale: 'baseline',
  };

  it('does NOT emit a baseline entry for source-unusable (source debt, not baseline-able)', () => {
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
    assert.equal(baseline.entries.length, 0);
  });

  it('does NOT emit a baseline entry for snapshot-incomplete', () => {
    const status = {
      summary: { checkedAt: '2026-04-06T03:00:00Z', checkedFiles: 1, totalFiles: 1 },
      files: [
        {
          file: 'src/content/docs/salesforce-testing/faq.md',
          issues: [
            {
              type: 'snapshot-incomplete',
              severity: 'actionable',
              usabilitySignals: { reason: 'shallow-snapshot' },
            },
          ],
        },
      ],
    };
    const baseline = buildBaselineFromStatus(status, fpMap, baselineMeta);
    assert.equal(baseline.entries.length, 0);
  });
});

describe('sortEntries: structure types within slug', () => {
  const VALID_SNAPSHOT_FP = 'sha256:' + 'f'.repeat(64);
  const fpMap = new Map([
    ['some/page', VALID_SNAPSHOT_FP],
  ]);
  const baselineMeta = {
    runId: 'baseline-run',
    generatedAt: '2026-04-06T03:00:00Z',
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
    const args = parseArgs(['--regenerate', '--types=section-structure-mismatch']);
    assert.equal(args.regenerate, true);
    assert.deepEqual(args.types, ['section-structure-mismatch']);
  });

  it('treats --types as mutually exclusive with --slug (parsing returns both)', () => {
    const args = parseArgs(['--slug=overview/foo', '--types=section-structure-mismatch']);
    assert.deepEqual(args.slugs, ['overview/foo']);
    assert.deepEqual(args.types, ['section-structure-mismatch']);
  });
});

describe('mergePartialBaselineByType', () => {
  const VALID_SNAPSHOT_FP = 'sha256:' + 'f'.repeat(64);
  const SEG_FP = 'sha256:' + 'c'.repeat(64);

  const existing = {
    schemaVersion: 2,
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
        priority: 'medium',
      },
    ],
  };

  it('replaces only entries whose issueType is in typesToReplace', () => {
    const newStructureEntry = {
      slug: 'running-tests/the-command-line-cli',
      issueType: 'section-structure-mismatch',
      snapshotFingerprint: VALID_SNAPSHOT_FP,
      priority: 'medium',
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
    // 既存 segment-* は bit-identical で残る (v2: priority も保持)
    const segEntry = merged.entries.find((e) => e.issueType === 'segment-missing');
    assert.equal(segEntry.priority, 'medium');
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
          priority: 'medium',
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
    assert.equal(merged.entries[0].priority, 'medium');
  });
});

// ---------------------------------------------------------------------------
// validateTypesArg helper contract (v2: 2-type allowlist)
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

  it('returns { ok: true } for the 2 v2-allowlisted types (structure mismatch family)', () => {
    for (const t of [
      'section-structure-mismatch',
      'segment-order-mismatch',
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
      'segment-order-mismatch',
    ]);
    assert.deepEqual(result, { ok: true });
  });

  it('rejects snapshot-incomplete and source-unusable (no longer in --types allowlist in v2)', () => {
    for (const t of ['snapshot-incomplete', 'source-unusable']) {
      const result = validateTypesArg([t]);
      assert.equal(result.ok, false, `${t} must not be accepted by --types in v2`);
    }
  });

  it('rejects legacy segment-* types (tightest allowlist)', () => {
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

  it('parseArgs(["--types=section-structure-mismatch"]) round-trips as valid', () => {
    const args = parseArgs(['--types=section-structure-mismatch']);
    assert.deepEqual(args.types, ['section-structure-mismatch']);
    const v = validateTypesArg(args.types);
    assert.equal(v.ok, true);
  });
});

// ---------------------------------------------------------------------------
// CLI: --review-after is rejected in v2
// ---------------------------------------------------------------------------

describe('CLI: --review-after flag is removed in v2', () => {
  it('exits non-zero when --review-after is passed', () => {
    const result = spawnSync(
      process.execPath,
      [GENERATE_SCRIPT, '--regenerate', '--review-after=2026-12-31'],
      {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      },
    );
    assert.notEqual(result.status, 0, 'must exit non-zero when --review-after is passed');
    const combined = (result.stderr ?? '') + (result.stdout ?? '');
    assert.match(combined, /--review-after/);
    assert.match(combined, /removed|撤去|v2/i);
  });

  it('exits non-zero when --review-after=<date> is passed with --slug', () => {
    const result = spawnSync(
      process.execPath,
      [GENERATE_SCRIPT, '--slug=overview/example', '--review-after=2026-12-31'],
      {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      },
    );
    assert.notEqual(result.status, 0);
    const combined = (result.stderr ?? '') + (result.stdout ?? '');
    assert.match(combined, /--review-after/);
  });
});

// ---------------------------------------------------------------------------
// Pre-regen fail-closed gate (proposal I, Codex Round-3 approved)
//
// Source contract:
//   - docs/SYSTEM_SPEC.md §システム不変量
//     (PR Z entry fail-closed invariants)
//   - docs/SYSTEM_SPEC.md §システム不変量
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
