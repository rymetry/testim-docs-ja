import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  fingerprint,
  computeFreshnessState,
  buildSourceSyncStatus,
  validateRunLinkage,
  SOURCE_SYNC_STATUS_SCHEMA_VERSION,
} from '../lib/source_sync_health.mjs';

// ---------------------------------------------------------------------------
// fingerprint
// ---------------------------------------------------------------------------

describe('fingerprint', () => {
  it('returns sha256:<hex> for sorted input strings', () => {
    const result = fingerprint(['b', 'a', 'c']);
    assert.match(result, /^sha256:[0-9a-f]{64}$/);
  });

  it('is order-independent (sorts internally)', () => {
    assert.equal(fingerprint(['b', 'a']), fingerprint(['a', 'b']));
  });

  it('returns different hashes for different inputs', () => {
    assert.notEqual(fingerprint(['a']), fingerprint(['b']));
  });

  it('handles empty array', () => {
    assert.match(fingerprint([]), /^sha256:[0-9a-f]{64}$/);
  });
});

// ---------------------------------------------------------------------------
// computeFreshnessState
// ---------------------------------------------------------------------------

describe('computeFreshnessState', () => {
  it('returns "fresh" when all pages ok and sidebar verified', () => {
    const pages = [
      { slug: 'a', fetchStatus: 'ok' },
      { slug: 'b', fetchStatus: 'ok' },
    ];
    assert.equal(computeFreshnessState(pages, true), 'fresh');
  });

  it('returns "partial" when some pages failed but sidebar ok', () => {
    const pages = [
      { slug: 'a', fetchStatus: 'ok' },
      { slug: 'b', fetchStatus: 'error' },
    ];
    assert.equal(computeFreshnessState(pages, true), 'partial');
  });

  it('returns "partial" when some pages are 404 but others ok', () => {
    const pages = [
      { slug: 'a', fetchStatus: 'ok' },
      { slug: 'b', fetchStatus: 'not-found' },
    ];
    assert.equal(computeFreshnessState(pages, true), 'partial');
  });

  it('returns "broken" when sidebar verification failed', () => {
    const pages = [{ slug: 'a', fetchStatus: 'ok' }];
    assert.equal(computeFreshnessState(pages, false), 'broken');
  });

  it('returns "broken" when no pages exist', () => {
    assert.equal(computeFreshnessState([], true), 'broken');
  });

  it('returns "broken" when all pages failed', () => {
    const pages = [
      { slug: 'a', fetchStatus: 'error' },
      { slug: 'b', fetchStatus: 'error' },
    ];
    assert.equal(computeFreshnessState(pages, true), 'broken');
  });
});

// ---------------------------------------------------------------------------
// buildSourceSyncStatus
// ---------------------------------------------------------------------------

describe('buildSourceSyncStatus', () => {
  const baseSidebarResult = { ok: true, sectionCount: 5, pageCount: 100 };
  const fullScope = { type: 'full', isComplete: true, filters: { slug: null, section: null } };

  it('produces valid schema with all required fields', () => {
    const pages = [
      { slug: 'overview/testim-overview', fetchStatus: 'ok' },
      { slug: 'overview/changelog', fetchStatus: 'ok' },
    ];
    const result = buildSourceSyncStatus({
      pages,
      sidebarResult: baseSidebarResult,
      runScope: fullScope,
    });

    assert.equal(result.schemaVersion, 2);
    assert.equal(result.schemaVersion, SOURCE_SYNC_STATUS_SCHEMA_VERSION);
    assert.match(result.runId, /^\d{4}-\d{2}-\d{2}T.+#[0-9a-f]{8}$/);
    assert.equal(typeof result.checkedAt, 'string');
    assert.match(result.sourceInventoryFingerprint, /^sha256:/);
    assert.match(result.sidebarFingerprint, /^sha256:/);
    assert.equal(result.freshnessState, 'fresh');
    assert.deepEqual(result.runScope, fullScope);
    assert.deepEqual(result.summary, {
      targetPages: 2,
      fetchedPages: 2,
      notFoundPages: 0,
      errorPages: 0,
      excludedPages: 0,
      excludedBrokenPages: 0,
      excludedRecoveredPages: 0,
      sidebarVerified: true,
    });
    assert.equal(result.pages.length, 2);
    assert.deepEqual(result.errors, []);
  });

  it('records per-page errors in errors array', () => {
    const pages = [
      { slug: 'a', fetchStatus: 'ok' },
      { slug: 'b', fetchStatus: 'error', errorDetail: 'HTTP 500' },
    ];
    const result = buildSourceSyncStatus({
      pages,
      sidebarResult: baseSidebarResult,
      runScope: fullScope,
    });

    assert.equal(result.freshnessState, 'partial');
    assert.equal(result.summary.fetchedPages, 1);
    assert.equal(result.summary.errorPages, 1);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].slug, 'b');
    assert.equal(result.errors[0].detail, 'HTTP 500');
  });

  it('records not-found pages in summary', () => {
    const pages = [
      { slug: 'a', fetchStatus: 'ok' },
      { slug: 'b', fetchStatus: 'not-found' },
    ];
    const result = buildSourceSyncStatus({
      pages,
      sidebarResult: baseSidebarResult,
      runScope: fullScope,
    });

    assert.equal(result.summary.notFoundPages, 1);
    assert.equal(result.summary.fetchedPages, 1);
  });

  it('handles sidebar failure', () => {
    const pages = [{ slug: 'a', fetchStatus: 'ok' }];
    const sidebarResult = { ok: false, reason: 'TOC data returned 0 sections' };
    const result = buildSourceSyncStatus({ pages, sidebarResult, runScope: fullScope });

    assert.equal(result.freshnessState, 'broken');
    assert.equal(result.summary.sidebarVerified, false);
    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0].detail, /sidebar/i);
  });

  it('uses deterministic runId seed when provided', () => {
    const pages = [{ slug: 'a', fetchStatus: 'ok' }];
    const r1 = buildSourceSyncStatus({
      pages,
      sidebarResult: baseSidebarResult,
      runScope: fullScope,
      now: new Date('2026-04-06T03:00:00Z'),
      runSeed: 'test-seed',
    });
    const r2 = buildSourceSyncStatus({
      pages,
      sidebarResult: baseSidebarResult,
      runScope: fullScope,
      now: new Date('2026-04-06T03:00:00Z'),
      runSeed: 'test-seed',
    });
    assert.equal(r1.runId, r2.runId);
  });

  it('includes snapshotFingerprint in pages when provided', () => {
    const pages = [
      { slug: 'a', fetchStatus: 'ok', snapshotFingerprint: 'sha256:abc123' },
    ];
    const result = buildSourceSyncStatus({
      pages,
      sidebarResult: baseSidebarResult,
      runScope: fullScope,
    });
    assert.equal(result.pages[0].snapshotFingerprint, 'sha256:abc123');
  });

  it('omits snapshotFingerprint from pages when not provided', () => {
    const pages = [{ slug: 'a', fetchStatus: 'ok' }];
    const result = buildSourceSyncStatus({
      pages,
      sidebarResult: baseSidebarResult,
      runScope: fullScope,
    });
    assert.equal('snapshotFingerprint' in result.pages[0], false);
  });

  it('sidebarFingerprint changes when sidebar slugs change', () => {
    const pages = [{ slug: 'a', fetchStatus: 'ok' }];
    const r1 = buildSourceSyncStatus({
      pages,
      sidebarResult: { ...baseSidebarResult, sidebarSlugs: ['x', 'y'] },
      runScope: fullScope,
    });
    const r2 = buildSourceSyncStatus({
      pages,
      sidebarResult: { ...baseSidebarResult, sidebarSlugs: ['x', 'z'] },
      runScope: fullScope,
    });
    assert.notEqual(r1.sidebarFingerprint, r2.sidebarFingerprint);
  });

  it('sidebarFingerprint is stable for same slugs in different order', () => {
    const pages = [{ slug: 'a', fetchStatus: 'ok' }];
    const r1 = buildSourceSyncStatus({
      pages,
      sidebarResult: { ...baseSidebarResult, sidebarSlugs: ['y', 'x'] },
      runScope: fullScope,
    });
    const r2 = buildSourceSyncStatus({
      pages,
      sidebarResult: { ...baseSidebarResult, sidebarSlugs: ['x', 'y'] },
      runScope: fullScope,
    });
    assert.equal(r1.sidebarFingerprint, r2.sidebarFingerprint);
  });

  it('sidebarFingerprint detects reorder when counts are same', () => {
    const pages = [{ slug: 'a', fetchStatus: 'ok' }];
    // Same sectionCount/pageCount but different slug sets
    const r1 = buildSourceSyncStatus({
      pages,
      sidebarResult: { ok: true, sectionCount: 2, pageCount: 3, sidebarSlugs: ['a', 'b', 'c'] },
      runScope: fullScope,
    });
    const r2 = buildSourceSyncStatus({
      pages,
      sidebarResult: { ok: true, sectionCount: 2, pageCount: 3, sidebarSlugs: ['a', 'b', 'd'] },
      runScope: fullScope,
    });
    assert.notEqual(r1.sidebarFingerprint, r2.sidebarFingerprint);
  });
});

// ---------------------------------------------------------------------------
// validateRunLinkage (§3 cleanup)
// ---------------------------------------------------------------------------

describe('validateRunLinkage', () => {
  const FP_A = 'sha256:' + 'a'.repeat(64);
  const FP_B = 'sha256:' + 'b'.repeat(64);
  const RUN_A = '2026-04-07T00:00:00Z#run-a';
  const RUN_B = '2026-04-07T00:05:00Z#run-b';
  const fullScope = { type: 'full', isComplete: true, filters: { slug: null, section: null } };
  const slugScope = {
    type: 'slug',
    isComplete: false,
    filters: { slug: 'overview/x', section: null },
  };

  it('returns "linked" when fingerprints match and scopes match', () => {
    const result = validateRunLinkage(
      { runId: RUN_A, sourceInventoryFingerprint: FP_A, runScope: fullScope },
      { sourceSyncRunId: RUN_A, sourceInventoryFingerprint: FP_A, runScope: fullScope },
      fullScope,
    );
    assert.equal(result, 'linked');
  });

  it('returns "missing" when sourceSync is null', () => {
    const result = validateRunLinkage(null, { sourceInventoryFingerprint: FP_A }, fullScope);
    assert.equal(result, 'missing');
  });

  it('returns "missing" when sourceSync has no fingerprint', () => {
    const result = validateRunLinkage(
      { freshnessState: 'fresh' },
      { sourceSyncRunId: RUN_A, sourceInventoryFingerprint: FP_A, runScope: fullScope },
      fullScope,
    );
    assert.equal(result, 'missing');
  });

  it('returns "missing" when snapshotDiff is null', () => {
    const result = validateRunLinkage(
      { runId: RUN_A, sourceInventoryFingerprint: FP_A, runScope: fullScope },
      null,
      fullScope,
    );
    assert.equal(result, 'missing');
  });

  it('returns "missing" when snapshotDiff has no fingerprint (legacy)', () => {
    const result = validateRunLinkage(
      { runId: RUN_A, sourceInventoryFingerprint: FP_A, runScope: fullScope },
      { runScope: fullScope }, // pre-§1 snapshot diff
      fullScope,
    );
    assert.equal(result, 'missing');
  });

  it('returns "stale" when fingerprints disagree', () => {
    const result = validateRunLinkage(
      { runId: RUN_A, sourceInventoryFingerprint: FP_A, runScope: fullScope },
      { sourceSyncRunId: RUN_A, sourceInventoryFingerprint: FP_B, runScope: fullScope },
      fullScope,
    );
    assert.equal(result, 'stale');
  });

  it('returns "run-mismatch" when snapshotDiff references a different source-sync run', () => {
    const result = validateRunLinkage(
      { runId: RUN_A, sourceInventoryFingerprint: FP_A, runScope: fullScope },
      { sourceSyncRunId: RUN_B, sourceInventoryFingerprint: FP_A, runScope: fullScope },
      fullScope,
    );
    assert.equal(result, 'run-mismatch');
  });

  it('returns "scope-mismatch" when parity is full but snapshotDiff is partial', () => {
    const result = validateRunLinkage(
      { runId: RUN_A, sourceInventoryFingerprint: FP_A, runScope: fullScope },
      { sourceSyncRunId: RUN_A, sourceInventoryFingerprint: FP_A, runScope: slugScope },
      fullScope,
    );
    assert.equal(result, 'scope-mismatch');
  });

  it('returns "scope-mismatch" when parity is partial but snapshotDiff is full', () => {
    const result = validateRunLinkage(
      { runId: RUN_A, sourceInventoryFingerprint: FP_A, runScope: slugScope },
      { sourceSyncRunId: RUN_A, sourceInventoryFingerprint: FP_A, runScope: fullScope },
      slugScope,
    );
    assert.equal(result, 'scope-mismatch');
  });

  it('returns "linked" when both runs are partial in the same way', () => {
    const result = validateRunLinkage(
      { runId: RUN_A, sourceInventoryFingerprint: FP_A, runScope: slugScope },
      { sourceSyncRunId: RUN_A, sourceInventoryFingerprint: FP_A, runScope: slugScope },
      slugScope,
    );
    assert.equal(result, 'linked');
  });

  it('returns "scope-mismatch" when sourceSync and parity are different partial scopes', () => {
    const sectionScope = {
      type: 'section',
      isComplete: false,
      filters: { slug: null, section: 'Overview' },
    };
    const result = validateRunLinkage(
      { runId: RUN_A, sourceInventoryFingerprint: FP_A, runScope: slugScope },
      { sourceSyncRunId: RUN_A, sourceInventoryFingerprint: FP_A, runScope: slugScope },
      sectionScope,
    );
    assert.equal(result, 'scope-mismatch');
  });
});

// ---------------------------------------------------------------------------
// Issue #255 Phase 3a — source-side debt (excluded-broken / excluded-recovered)
//
// "既知 broken upstream" page は freshness 計算から除外し、独立 counter で
// 見せる。excluded は `fresh` 判定を壊さない。
// ---------------------------------------------------------------------------

describe('computeFreshnessState — source-side debt handling', () => {
  it('ignores excluded-broken pages (debt-only run is still fresh)', () => {
    const pages = [
      { slug: 'overview/a', fetchStatus: 'ok' },
      { slug: 'overview/b', fetchStatus: 'excluded-broken' },
    ];
    assert.equal(computeFreshnessState(pages, true), 'fresh');
  });

  it('ignores excluded-recovered pages (debt-only run is still fresh)', () => {
    const pages = [
      { slug: 'overview/a', fetchStatus: 'ok' },
      { slug: 'overview/b', fetchStatus: 'excluded-recovered' },
    ];
    assert.equal(computeFreshnessState(pages, true), 'fresh');
  });

  it('returns "fresh" when the entire run is excluded (no real fetch targets)', () => {
    // エッジケース: registry 上の slug しか fetch 対象がないとき、それだけで
    // broken 扱いしない。既知 debt のみ残っても "fresh" を維持する。
    const pages = [
      { slug: 'a', fetchStatus: 'excluded-broken' },
      { slug: 'b', fetchStatus: 'excluded-recovered' },
    ];
    assert.equal(computeFreshnessState(pages, true), 'fresh');
  });

  it('still returns "broken" when sidebar fails even if all pages are excluded', () => {
    const pages = [{ slug: 'a', fetchStatus: 'excluded-broken' }];
    assert.equal(computeFreshnessState(pages, false), 'broken');
  });

  it('returns "partial" when excluded + mixed ok/error non-excluded pages', () => {
    const pages = [
      { slug: 'a', fetchStatus: 'ok' },
      { slug: 'b', fetchStatus: 'error' },
      { slug: 'c', fetchStatus: 'excluded-broken' },
    ];
    assert.equal(computeFreshnessState(pages, true), 'partial');
  });
});

describe('buildSourceSyncStatus — source-side debt counters', () => {
  const baseSidebarResult = { ok: true, sectionCount: 5, pageCount: 100 };
  const fullScope = { type: 'full', isComplete: true, filters: { slug: null, section: null } };

  it('exposes excludedPages / excludedBrokenPages / excludedRecoveredPages in summary', () => {
    const pages = [
      { slug: 'overview/a', fetchStatus: 'ok' },
      {
        slug: 'testops/testops-version-control/pull-requests',
        fetchStatus: 'excluded-broken',
        recoveryProbe: { issueType: 'snapshot-incomplete', reason: 'extractor-empty', expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty', expectedMatch: true },
        debtCategory: 'source-side-debt',
      },
    ];
    const result = buildSourceSyncStatus({
      pages,
      sidebarResult: baseSidebarResult,
      runScope: fullScope,
    });

    assert.equal(result.summary.excludedPages, 1);
    assert.equal(result.summary.excludedBrokenPages, 1);
    assert.equal(result.summary.excludedRecoveredPages, 0);
  });

  it('counts excluded-recovered separately from excluded-broken', () => {
    const pages = [
      {
        slug: 'x',
        fetchStatus: 'excluded-broken',
        recoveryProbe: { issueType: 'snapshot-incomplete', reason: 'extractor-empty', expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty', expectedMatch: true },
        debtCategory: 'source-side-debt',
      },
      {
        slug: 'y',
        fetchStatus: 'excluded-recovered',
        recoveryProbe: null,
        debtCategory: 'source-side-debt',
      },
    ];
    const result = buildSourceSyncStatus({
      pages,
      sidebarResult: baseSidebarResult,
      runScope: fullScope,
    });

    assert.equal(result.summary.excludedPages, 2);
    assert.equal(result.summary.excludedBrokenPages, 1);
    assert.equal(result.summary.excludedRecoveredPages, 1);
  });

  it('excludes debt pages from fetchedPages / notFoundPages / errorPages', () => {
    const pages = [
      { slug: 'a', fetchStatus: 'ok' },
      {
        slug: 'b',
        fetchStatus: 'excluded-broken',
        recoveryProbe: { issueType: 'snapshot-incomplete', reason: 'extractor-empty', expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty', expectedMatch: true },
        debtCategory: 'source-side-debt',
      },
    ];
    const result = buildSourceSyncStatus({
      pages,
      sidebarResult: baseSidebarResult,
      runScope: fullScope,
    });

    // excluded は ok / not-found / error のどこにも count しない
    assert.equal(result.summary.fetchedPages, 1);
    assert.equal(result.summary.notFoundPages, 0);
    assert.equal(result.summary.errorPages, 0);
    // ただし targetPages には含まれる (fetch 対象という意味では依然 target)
    assert.equal(result.summary.targetPages, 2);
  });

  it('preserves recoveryProbe and debtCategory on each page entry', () => {
    const pages = [
      {
        slug: 'testops/testops-version-control/pull-requests',
        fetchStatus: 'excluded-broken',
        recoveryProbe: { issueType: 'snapshot-incomplete', reason: 'extractor-empty', expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty', expectedMatch: true },
        debtCategory: 'source-side-debt',
      },
    ];
    const result = buildSourceSyncStatus({
      pages,
      sidebarResult: baseSidebarResult,
      runScope: fullScope,
    });

    const page = result.pages.find(
      (p) => p.slug === 'testops/testops-version-control/pull-requests',
    );
    assert.ok(page);
    assert.equal(page.fetchStatus, 'excluded-broken');
    assert.deepEqual(page.recoveryProbe, {
      issueType: 'snapshot-incomplete',
      reason: 'extractor-empty',
      expectedIssueType: 'snapshot-incomplete',
      expectedReason: 'extractor-empty',
      expectedMatch: true,
    });
    assert.equal(page.debtCategory, 'source-side-debt');
  });

  it('sets freshnessState to fresh when only excluded pages remain', () => {
    // 既知 debt だけを fetch したとき (= `--slug=pull-requests` の実行)
    // freshness は broken ではなく fresh を返す
    const pages = [
      {
        slug: 'testops/testops-version-control/pull-requests',
        fetchStatus: 'excluded-broken',
        recoveryProbe: { issueType: 'snapshot-incomplete', reason: 'extractor-empty', expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty', expectedMatch: true },
        debtCategory: 'source-side-debt',
      },
    ];
    const result = buildSourceSyncStatus({
      pages,
      sidebarResult: baseSidebarResult,
      runScope: fullScope,
    });
    assert.equal(result.freshnessState, 'fresh');
  });

  it('does not add excluded pages to the top-level errors array', () => {
    // excluded は "既知" なので error として issue ルートに listup しない
    const pages = [
      {
        slug: 'a',
        fetchStatus: 'excluded-broken',
        recoveryProbe: { issueType: 'snapshot-incomplete', reason: 'extractor-empty', expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty', expectedMatch: true },
        debtCategory: 'source-side-debt',
      },
    ];
    const result = buildSourceSyncStatus({
      pages,
      sidebarResult: baseSidebarResult,
      runScope: fullScope,
    });
    assert.deepEqual(result.errors, []);
  });

  it('defaults counters to 0 when no excluded pages', () => {
    // backward-compatible: 普通の fetch では新 counter は 0 で出る
    const pages = [{ slug: 'a', fetchStatus: 'ok' }];
    const result = buildSourceSyncStatus({
      pages,
      sidebarResult: baseSidebarResult,
      runScope: fullScope,
    });

    assert.equal(result.summary.excludedPages, 0);
    assert.equal(result.summary.excludedBrokenPages, 0);
    assert.equal(result.summary.excludedRecoveredPages, 0);
  });
});
