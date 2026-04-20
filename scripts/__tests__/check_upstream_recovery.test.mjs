import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  daysSince,
  daysUntil,
  computeEnPatchStatus,
  computeSyncExclusionStatus,
  buildUpstreamRecoveryStatus,
} from '../check_upstream_recovery.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-05-01T00:00:00Z').getTime();

describe('daysSince / daysUntil', () => {
  it('daysSince returns positive when the date is in the past', () => {
    assert.equal(daysSince('2026-04-01', NOW), 30);
  });

  it('daysSince returns 0 or negative when the date is in the future', () => {
    assert.equal(daysSince('2026-06-01', NOW), -31);
  });

  it('daysSince returns 0 for missing / invalid dates (fail-safe)', () => {
    assert.equal(daysSince(null, NOW), 0);
    assert.equal(daysSince('', NOW), 0);
    assert.equal(daysSince('not-a-date', NOW), 0);
  });

  it('daysUntil mirrors daysSince sign', () => {
    assert.equal(daysUntil('2026-06-01', NOW), 31);
    assert.equal(daysUntil('2026-04-01', NOW), -30);
  });

  it('daysUntil returns null for missing / invalid dates', () => {
    assert.equal(daysUntil(null, NOW), null);
    assert.equal(daysUntil('not-a-date', NOW), null);
  });
});

describe('computeEnPatchStatus — Axis A × Axis B matrix', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'upstream-recovery-en-'));
  const patch = Object.freeze({
    id: 'TEST-PATCH',
    slugs: Object.freeze(['fake/slug-a', 'fake/slug-b']),
    defectClass: 'typo',
    find: '<p>broken</p>',
    replace: '<p>fixed</p>',
    rationale: 'test',
    linkedDefect: 'test',
    addedAt: '2026-01-01',
    reviewAfter: '2026-07-01',
  });

  // Note: `preprocessEnHtml` internally consults the live `EN_SOURCE_PATCHES`
  // registry to decide which patches apply to a slug, so synthetic fixture
  // patches passed through `patches:` here are only used for the enumeration
  // output shape (not for actual hit detection). That means `statusA=active`
  // requires a real registered slug + real snapshot; we cover that in
  // `en_source_patches_integration.test.mjs` instead. Unit tests below cover
  // the `stale` and `unknown` branches where the synthetic fixture slug does
  // not match any registered patch.

  it('statusA=stale when a snapshot is readable but no registered patch hits it', () => {
    const root = mkdtempSync(join(tmpdir(), 'upstream-recovery-en-root-'));
    writeFileSync(join(root, 'fake-slug.html'), '<html><p>already fixed upstream</p></html>');
    const result = computeEnPatchStatus({
      nowMs: NOW,
      snapshotsRoot: root,
      patches: [
        Object.freeze({ ...patch, slugs: Object.freeze(['fake-slug']) }),
      ],
    });
    // The synthetic slug is readable but the live registry has no patches for
    // it, so byPatchIdStatus keeps matched=false → statusA=stale.
    assert.equal(result[0].statusA, 'stale');
    assert.equal(result[0].hits, 0);
  });

  it('statusA=unknown when no snapshot is readable for any registered slug', () => {
    const root = mkdtempSync(join(tmpdir(), 'upstream-recovery-en-root-'));
    // Empty snapshotsRoot — patch slugs point at nonexistent paths.
    const result = computeEnPatchStatus({
      nowMs: NOW,
      snapshotsRoot: root,
      patches: [
        Object.freeze({ ...patch, slugs: Object.freeze(['nonexistent/slug']) }),
      ],
    });
    assert.equal(result[0].statusA, 'unknown');
  });

  it('statusB=overdue when reviewAfter is in the past', () => {
    const root = mkdtempSync(join(tmpdir(), 'upstream-recovery-en-root-'));
    writeFileSync(join(root, 'fake-slug.html'), '<html><p>anything</p></html>');
    const overduePatch = Object.freeze({
      ...patch,
      slugs: Object.freeze(['fake-slug']),
      reviewAfter: '2026-01-01', // past
    });
    const result = computeEnPatchStatus({
      nowMs: NOW,
      snapshotsRoot: root,
      patches: [overduePatch],
    });
    assert.equal(result[0].statusB, 'overdue');
    assert.ok(result[0].daysUntilReview < 0);
  });
});

describe('computeSyncExclusionStatus — fetchStatus mapping', () => {
  const exclusion = Object.freeze({
    'test/slug': Object.freeze({
      reason: 'broken-upstream-source',
      note: '',
      expectedIssueType: 'snapshot-incomplete',
      expectedReason: 'extractor-empty',
      addedAt: '2026-01-01',
      reviewAfter: '2026-07-01',
      linkedIssue: 999,
    }),
  });

  it('fetchStatus=excluded-broken → statusA=active', () => {
    const result = computeSyncExclusionStatus({
      nowMs: NOW,
      exclusions: exclusion,
      sourceSyncStatus: { pages: [{ slug: 'test/slug', fetchStatus: 'excluded-broken' }] },
    });
    assert.equal(result[0].statusA, 'active');
    assert.equal(result[0].fetchStatus, 'excluded-broken');
  });

  it('fetchStatus=excluded-recovered → statusA=stale', () => {
    const result = computeSyncExclusionStatus({
      nowMs: NOW,
      exclusions: exclusion,
      sourceSyncStatus: { pages: [{ slug: 'test/slug', fetchStatus: 'excluded-recovered' }] },
    });
    assert.equal(result[0].statusA, 'stale');
  });

  it('missing source-sync-status → statusA=unknown (graceful degradation)', () => {
    const result = computeSyncExclusionStatus({
      nowMs: NOW,
      exclusions: exclusion,
      sourceSyncStatus: null,
    });
    assert.equal(result[0].statusA, 'unknown');
    assert.equal(result[0].fetchStatus, 'unknown');
  });

  it('missing entry in source-sync-status.pages → statusA=unknown', () => {
    const result = computeSyncExclusionStatus({
      nowMs: NOW,
      exclusions: exclusion,
      sourceSyncStatus: { pages: [{ slug: 'other/slug', fetchStatus: 'excluded-broken' }] },
    });
    assert.equal(result[0].statusA, 'unknown');
  });

  it('statusB=overdue when reviewAfter is in the past', () => {
    const overdueExclusion = {
      'test/slug': { ...exclusion['test/slug'], reviewAfter: '2026-01-01' },
    };
    const result = computeSyncExclusionStatus({
      nowMs: NOW,
      exclusions: overdueExclusion,
      sourceSyncStatus: { pages: [{ slug: 'test/slug', fetchStatus: 'excluded-broken' }] },
    });
    assert.equal(result[0].statusB, 'overdue');
  });
});

describe('buildUpstreamRecoveryStatus — aggregate shape', () => {
  it('produces schemaVersion=1 payload with summary counters and mechanism breakdowns', () => {
    const root = mkdtempSync(join(tmpdir(), 'upstream-recovery-full-'));
    const payload = buildUpstreamRecoveryStatus({
      nowMs: NOW,
      snapshotsRoot: root,
      patches: [
        Object.freeze({
          id: 'TEST',
          slugs: Object.freeze(['absent/slug']),
          defectClass: 'typo',
          find: '<p>broken</p>',
          replace: '<p>fixed</p>',
          rationale: '',
          linkedDefect: '',
          addedAt: '2026-01-01',
          reviewAfter: '2026-07-01',
        }),
      ],
      exclusions: {
        'test/slug': {
          reason: 'broken-upstream-source',
          note: '',
          expectedIssueType: 'snapshot-incomplete',
          expectedReason: 'extractor-empty',
          addedAt: '2026-01-01',
          reviewAfter: '2026-07-01',
          linkedIssue: 1,
        },
      },
      sourceSyncStatus: null,
    });
    assert.equal(payload.schemaVersion, 1);
    assert.equal(payload.summary.totalEntries, 2);
    // 1 unknown en_patch + 1 unknown exclusion
    assert.equal(payload.summary.unknownEntries, 2);
    assert.equal(payload.summary.staleEntries, 0);
    assert.equal(payload.summary.overdueEntries, 0);
    assert.ok(Array.isArray(payload.mechanisms.en_source_patches));
    assert.ok(Array.isArray(payload.mechanisms.source_sync_exclusions));
    assert.match(payload.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
  });
});
