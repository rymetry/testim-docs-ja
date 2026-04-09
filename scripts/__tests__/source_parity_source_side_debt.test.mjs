/**
 * source-side debt の契約テスト。
 *
 * `source_sync_exclusions.mjs` に登録された broken upstream source page の
 * 運用契約を pin する。representative test から分離することで、
 * "解消済み代表" の契約と "既知 debt" の契約を混ぜない。
 *
 * pin する契約:
 *
 *   1. registry に最低 1 entry (`pull-requests`) が seeding されている
 *   2. 各 debt slug には対応する JA file が存在する
 *   3. 各 debt slug の hand-authored EN snapshot file が存在する
 *      (Q1=A の決定: 凍結参照として残す)
 *   4. 各 debt slug の metadata は "upstream recovery を検知できる shape"
 *      を備えている (expectedIssueType / expectedReason / addedAt /
 *      linkedIssue が実際の detectSourceUsability 出力と合致可能)
 *   5. end-to-end: exclusion registry → buildSourceSyncStatus →
 *      buildActionableReport → renderSummaryMarkdown の流れで、
 *      debt slug が日本語 summary section と JSON counter に現れる
 *
 * `snapshot_update.test.mjs` では excluded-broken / excluded-recovered の
 * 書き込み側挙動を別途確認する。
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { ROOT_DIR, DOCS_DIR } from '../lib/project.mjs';
import {
  SOURCE_SYNC_EXCLUSIONS,
  listSourceSideDebtSlugs,
  getExclusion,
} from '../lib/source_sync_exclusions.mjs';
import {
  buildSourceSyncStatus,
  computeFreshnessState,
} from '../lib/source_sync_health.mjs';
import {
  buildActionableReport,
  renderSummaryMarkdown,
} from '../lib/detection_reports.mjs';

const SNAPSHOTS_CONTENT_DIR = path.join(ROOT_DIR, 'snapshots', 'en', 'content');

describe('source-side debt registry seeding', () => {
  it('contains at least one debt slug (pull-requests as initial seed)', () => {
    const slugs = listSourceSideDebtSlugs();
    assert.ok(
      slugs.length >= 1,
      `expected at least one source-side debt entry, got ${slugs.length}`,
    );
    assert.ok(
      slugs.includes('testops/testops-version-control/pull-requests'),
      `pull-requests must be seeded as the first known debt entry. ` +
        `Actual slugs: ${JSON.stringify(slugs)}`,
    );
  });

  it('only contains upstream-broken entries (no debug / placeholder slugs)', () => {
    for (const [slug, entry] of Object.entries(SOURCE_SYNC_EXCLUSIONS)) {
      assert.equal(
        entry.reason,
        'broken-upstream-source',
        `registry[${slug}] must declare reason="broken-upstream-source" ` +
          `(auto-exclusion is forbidden — only hand-confirmed upstream debt)`,
      );
    }
  });
});

describe('source-side debt registry / repository integrity', () => {
  const debtSlugs = listSourceSideDebtSlugs();

  for (const slug of debtSlugs) {
    describe(`debt slug: ${slug}`, () => {
      it('has a matching JA file in src/content/docs/', () => {
        const jaPath = path.join(DOCS_DIR, `${slug}.md`);
        assert.ok(
          existsSync(jaPath),
          `debt slug ${slug} must have a JA file at ${jaPath}`,
        );
      });

      it('has a frozen hand-authored EN snapshot', () => {
        const snapshotPath = path.join(SNAPSHOTS_CONTENT_DIR, `${slug}.html`);
        assert.ok(
          existsSync(snapshotPath),
          `debt slug ${slug} must keep its hand-authored snapshot at ${snapshotPath}`,
        );
      });

      it('metadata carries a probe-compatible shape for recovery detection', () => {
        const entry = getExclusion(slug);
        assert.ok(entry, `registry entry must exist`);

        // expectedIssueType / expectedReason は
        // detectSourceUsability().usabilitySignals.reason と
        // detectSourceUsability().type の実値に合致させる。
        // これにより upstream が recovered したとき registry を再訪する
        // 意思決定の材料になる。
        const validIssueTypes = new Set(['snapshot-incomplete', 'source-unusable']);
        const validReasons = new Set([
          'extractor-empty',
          'shallow-snapshot',
          'escaped-details-residue',
          'fetch-failed',
        ]);
        assert.ok(
          validIssueTypes.has(entry.expectedIssueType),
          `${slug}: expectedIssueType must be a known detectSourceUsability type. ` +
            `Got: ${entry.expectedIssueType}`,
        );
        assert.ok(
          validReasons.has(entry.expectedReason),
          `${slug}: expectedReason must be a known detectSourceUsability reason. ` +
            `Got: ${entry.expectedReason}`,
        );
        assert.match(
          entry.addedAt,
          /^\d{4}-\d{2}-\d{2}$/,
          `${slug}: addedAt must be ISO date (YYYY-MM-DD)`,
        );
        assert.equal(
          typeof entry.linkedIssue,
          'number',
          `${slug}: linkedIssue must be a number (GitHub issue number)`,
        );
      });
    });
  }
});

// registry に登録された debt slug が、pipeline 全体を一貫して流れることを確認する。

describe('source-side debt pipeline integration', () => {
  const debtSlug = 'testops/testops-version-control/pull-requests';
  const normalSlug = 'overview/testim-overview';
  const baseSidebarResult = {
    ok: true,
    sectionCount: 20,
    pageCount: 200,
    sidebarSlugs: ['a', 'b', 'c'],
  };
  const fullScope = { type: 'full', isComplete: true, filters: { slug: null, section: null } };

  function buildMixedRun() {
    // 1 debt slug (excluded-broken) + 1 normal slug (ok) — realistic shape
    const pages = [
      { slug: normalSlug, fetchStatus: 'ok' },
      {
        slug: debtSlug,
        fetchStatus: 'excluded-broken',
        debtCategory: 'source-side-debt',
        recoveryProbe: { issueType: 'snapshot-incomplete', reason: 'extractor-empty', expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty', expectedMatch: true },
      },
    ];
    return buildSourceSyncStatus({
      pages,
      sidebarResult: baseSidebarResult,
      runScope: fullScope,
    });
  }

  it('source-sync-status exposes debt page without polluting fetch counters', () => {
    const status = buildMixedRun();
    // debt slug は fetchedPages に数えない
    assert.equal(status.summary.fetchedPages, 1);
    assert.equal(status.summary.errorPages, 0);
    assert.equal(status.summary.excludedPages, 1);
    assert.equal(status.summary.excludedBrokenPages, 1);
    // freshness は fresh のまま (debt だけでは壊れない)
    assert.equal(status.freshnessState, 'fresh');
  });

  it('actionable report exposes sourceSideDebt summary field', () => {
    const sourceSync = buildMixedRun();
    const emptySnapshot = {
      checkedAt: '2026-04-09T00:00:00Z',
      summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
      changes: [],
      sidebar: { changed: false, addedPages: [], removedPages: [] },
    };
    const emptyParity = {
      summary: {
        checkedAt: '2026-04-09T00:00:00Z',
        actionableFiles: 0,
        signalFiles: 0,
        errorFiles: 0,
      },
      files: [],
    };
    const report = buildActionableReport(emptySnapshot, emptyParity, [], { sourceSync });

    // source-sync-health family に sourceSideDebt が露出している
    assert.ok(report.sourceSyncHealth.sourceSideDebt);
    assert.equal(report.sourceSyncHealth.sourceSideDebt.excludedPages, 1);
    assert.equal(report.sourceSyncHealth.sourceSideDebt.excludedBrokenPages, 1);
    assert.deepEqual(report.sourceSyncHealth.sourceSideDebt.brokenSlugs, [debtSlug]);
    assert.deepEqual(report.sourceSyncHealth.sourceSideDebt.brokenDetails, [
      {
        slug: debtSlug,
        actualIssueType: 'snapshot-incomplete',
        actualReason: 'extractor-empty',
        expectedIssueType: 'snapshot-incomplete',
        expectedReason: 'extractor-empty',
        expectedMatch: true,
      },
    ]);
    // P1 修正: fresh でも debt があれば managed issue に可視化する
    assert.equal(report.sourceSyncHealth.shouldOpenIssue, true);
  });

  it('summary markdown emits the 日本語 debt section with the slug', () => {
    const sourceSync = buildMixedRun();
    const emptySnapshot = {
      checkedAt: '2026-04-09T00:00:00Z',
      summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
      changes: [],
      sidebar: { changed: false, addedPages: [], removedPages: [] },
    };
    const emptyParity = {
      summary: {
        checkedAt: '2026-04-09T00:00:00Z',
        actionableFiles: 0,
        signalFiles: 0,
        errorFiles: 0,
      },
      files: [],
    };
    const report = buildActionableReport(emptySnapshot, emptyParity, [], { sourceSync });
    const md = renderSummaryMarkdown(emptySnapshot, emptyParity, report, [], sourceSync);

    // 日本語 debt セクション
    assert.match(md, /## ソース原文の既知問題/);
    assert.match(md, /除外ページ: 1/);
    assert.match(md, /未復旧: 1/);
    // slug が listing に現れる
    assert.match(md, new RegExp(debtSlug.replace(/\//g, '\\/')));
    // probe 結果
    assert.match(md, /snapshot-incomplete/);
    assert.match(md, /extractor-empty/);
  });

  it('debt-only run (no real fetch targets) keeps freshness fresh', () => {
    const debtOnly = buildSourceSyncStatus({
      pages: [
        {
          slug: debtSlug,
          fetchStatus: 'excluded-broken',
          debtCategory: 'source-side-debt',
          recoveryProbe: { issueType: 'snapshot-incomplete', reason: 'extractor-empty', expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty', expectedMatch: true },
        },
      ],
      sidebarResult: baseSidebarResult,
      runScope: fullScope,
    });
    assert.equal(debtOnly.freshnessState, 'fresh');
  });

  it('computeFreshnessState ignores debt pages when mixed with errors', () => {
    // debt + 1 error: partial (error pulls it down, debt is ignored)
    const pages = [
      { slug: 'n', fetchStatus: 'ok' },
      { slug: 'e', fetchStatus: 'error' },
      {
        slug: debtSlug,
        fetchStatus: 'excluded-broken',
        debtCategory: 'source-side-debt',
        recoveryProbe: { issueType: 'snapshot-incomplete', reason: 'extractor-empty', expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty', expectedMatch: true },
      },
    ];
    assert.equal(computeFreshnessState(pages, true), 'partial');
  });

  it('excluded-fetch-error は freshness 劣化として扱う (excluded-broken とは違う)', () => {
    // excluded-fetch-error は EXCLUDED_FETCH_STATUSES に含まれないため
    // freshness 計算で non-excluded として扱われる。
    const pages = [
      {
        slug: debtSlug,
        fetchStatus: 'excluded-fetch-error',
        debtCategory: 'source-side-debt',
        errorDetail: 'HTTP 500',
        recoveryProbe: null,
      },
    ];
    assert.equal(computeFreshnessState(pages, true), 'broken');
  });

  it('ok + excluded-fetch-error → partial', () => {
    const pages = [
      { slug: 'n', fetchStatus: 'ok' },
      {
        slug: debtSlug,
        fetchStatus: 'excluded-fetch-error',
        debtCategory: 'source-side-debt',
        errorDetail: 'HTTP 500',
        recoveryProbe: null,
      },
    ];
    assert.equal(computeFreshnessState(pages, true), 'partial');
  });
});
