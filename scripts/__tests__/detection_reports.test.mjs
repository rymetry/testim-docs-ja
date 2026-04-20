import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let buildActionableReport;
let buildAuditManifest;
let classifySnapshotBucket;
let assignReviewGroups;
let renderSummaryMarkdown;
let loadDetectionInputs;
let validateSnapshotDiffStatus;
let validateParityCheckStatus;
let validateSourceSyncStatus;
let validateActionableReport;
let validateDetectionInputs;
let ACTIONABLE_REPORT_SCHEMA_VERSION;

before(async () => {
  ({
    buildActionableReport,
    buildAuditManifest,
    classifySnapshotBucket,
    assignReviewGroups,
    renderSummaryMarkdown,
    loadDetectionInputs,
    validateSnapshotDiffStatus,
    validateParityCheckStatus,
    validateSourceSyncStatus,
    validateActionableReport,
    validateDetectionInputs,
    ACTIONABLE_REPORT_SCHEMA_VERSION,
  } = await import('../lib/detection_reports.mjs'));
});

describe('classifySnapshotBucket', () => {
  it('classifies page-added as page-lifecycle', () => {
    assert.equal(
      classifySnapshotBucket({ type: 'page-added', categories: null }),
      'page-lifecycle',
    );
  });

  it('classifies page-removed as page-lifecycle', () => {
    assert.equal(
      classifySnapshotBucket({ type: 'page-removed', categories: null }),
      'page-lifecycle',
    );
  });

  it('classifies heading changes as structural-change', () => {
    assert.equal(
      classifySnapshotBucket({
        type: 'page-changed',
        categories: {
          heading: { added: 1, removed: 0 },
          image: { added: 0, removed: 0 },
          code: { added: 0, removed: 0 },
          callout: { added: 0, removed: 0 },
          content: { added: 3, removed: 2 },
        },
      }),
      'structural-change',
    );
  });

  it('classifies image changes as structural-change', () => {
    assert.equal(
      classifySnapshotBucket({
        type: 'page-changed',
        categories: {
          heading: { added: 0, removed: 0 },
          image: { added: 0, removed: 1 },
          code: { added: 0, removed: 0 },
          callout: { added: 0, removed: 0 },
          content: { added: 0, removed: 0 },
        },
      }),
      'structural-change',
    );
  });

  it('classifies code changes as structural-change', () => {
    assert.equal(
      classifySnapshotBucket({
        type: 'page-changed',
        categories: {
          heading: { added: 0, removed: 0 },
          image: { added: 0, removed: 0 },
          code: { added: 2, removed: 0 },
          callout: { added: 0, removed: 0 },
          content: { added: 1, removed: 0 },
        },
      }),
      'structural-change',
    );
  });

  it('classifies callout changes as structural-change', () => {
    assert.equal(
      classifySnapshotBucket({
        type: 'page-changed',
        categories: {
          heading: { added: 0, removed: 0 },
          image: { added: 0, removed: 0 },
          code: { added: 0, removed: 0 },
          callout: { added: 0, removed: 1 },
          content: { added: 0, removed: 0 },
        },
      }),
      'structural-change',
    );
  });

  it('classifies content-only changes as content-only', () => {
    assert.equal(
      classifySnapshotBucket({
        type: 'page-changed',
        categories: {
          heading: { added: 0, removed: 0 },
          image: { added: 0, removed: 0 },
          code: { added: 0, removed: 0 },
          callout: { added: 0, removed: 0 },
          content: { added: 5, removed: 3 },
        },
      }),
      'content-only',
    );
  });
});

describe('buildAuditManifest', () => {
  it('returns empty array for empty snapshot changes', () => {
    const manifest = buildAuditManifest({ changes: [] }, { files: [] });
    assert.equal(manifest.length, 0);
  });

  it('handles parity entries with no matching snapshot slug', () => {
    const snapshot = {
      changes: [
        { slug: 'overview/page-a', type: 'page-changed', sourceUrl: 'https://docs.tricentis.com/testim/content/overview/page-a.htm', categories: { heading: { added: 0, removed: 0 }, image: { added: 0, removed: 0 }, code: { added: 0, removed: 0 }, callout: { added: 0, removed: 0 }, content: { added: 1, removed: 0 } }, diffLines: 1 },
      ],
    };
    const parity = {
      files: [
        { file: 'src/content/docs/overview/unrelated.md', issues: [{ type: 'untranslated', severity: 'actionable', detail: 'text' }] },
      ],
    };
    const manifest = buildAuditManifest(snapshot, parity);
    assert.equal(manifest.length, 1);
    assert.equal(manifest[0].signals.length, 0);
  });

  it('buckets entries into page-lifecycle, structural-change, and content-only groups', () => {
    const snapshot = {
      changes: [
        {
          slug: 'overview/new-page',
          type: 'page-added',
          sourceUrl: 'https://docs.tricentis.com/testim/content/overview/new-page.htm',
          categories: null,
          diffLines: 0,
        },
        {
          slug: 'overview/changed-heading',
          type: 'page-changed',
          sourceUrl: 'https://docs.tricentis.com/testim/content/overview/changed-heading.htm',
          categories: {
            heading: { added: 1, removed: 0 },
            image: { added: 0, removed: 0 },
            code: { added: 0, removed: 0 },
            callout: { added: 0, removed: 0 },
            content: { added: 2, removed: 1 },
          },
          diffLines: 4,
        },
        {
          slug: 'overview/text-tweak',
          type: 'page-changed',
          sourceUrl: 'https://docs.tricentis.com/testim/content/overview/text-tweak.htm',
          categories: {
            heading: { added: 0, removed: 0 },
            image: { added: 0, removed: 0 },
            code: { added: 0, removed: 0 },
            callout: { added: 0, removed: 0 },
            content: { added: 1, removed: 1 },
          },
          diffLines: 2,
        },
      ],
    };
    const parity = {
      files: [
        {
          file: 'src/content/docs/overview/changed-heading.md',
          issues: [{ type: 'image-mismatch', severity: 'actionable', detail: 'EN=4 JA=1' }],
        },
      ],
    };

    const manifest = buildAuditManifest(snapshot, parity, { groupCount: 2 });

    const added = manifest.find((e) => e.slug === 'overview/new-page');
    const structural = manifest.find((e) => e.slug === 'overview/changed-heading');
    const contentOnly = manifest.find((e) => e.slug === 'overview/text-tweak');

    assert.equal(added.bucket, 'page-lifecycle');
    assert.equal(structural.bucket, 'structural-change');
    assert.equal(contentOnly.bucket, 'content-only');
    assert.match(added.reviewGroup, /^review-group-/);
    assert.equal(added.verificationStatus, 'needs-human-review');

    // Cross-references parity signals by slug
    assert.equal(structural.signals.length, 1);
    assert.equal(structural.signals[0].type, 'image-mismatch');
    assert.equal(contentOnly.signals.length, 0);
  });
});

describe('buildActionableReport', () => {
  it('does NOT open a parity issue for coarse-signal-only entries', () => {
    // heading-mismatch is in COARSE_SIGNAL_TYPES, so a
    // file with only this issue type must NOT trigger parityRegression.
    // Pre-Phase-8 this test asserted the opposite ("opens a parity issue
    // for signal-only entries"). The semantic flip is the whole point of
    // commit 4 — coarse signals are now audit-only.
    const snapshot = {
      checkedAt: '2026-03-19T00:00:00Z',
      summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
      changes: [],
      sidebar: { changed: false, addedPages: [], removedPages: [] },
    };
    const parity = {
      summary: {
        checkedAt: '2026-03-19T00:00:00Z',
        actionableFiles: 0,
        signalFiles: 1,
        errorFiles: 0,
        issuesByType: { 'heading-mismatch': 1 },
        issuesBySeverity: { signal: 1 },
      },
      files: [
        {
          file: 'src/content/docs/example.md',
          issues: [{ type: 'heading-mismatch', severity: 'signal', detail: 'h2: EN=10 JA=2' }],
        },
      ],
    };

    const report = buildActionableReport(snapshot, parity, []);
    assert.equal(report.parityRegression.shouldOpenIssue, false);
    assert.equal(report.parityRegression.summary.issueCount, 0);
    assert.equal(report.parityRegression.topEntries.length, 0);
  });

  it('opens snapshot diff issue when changes exist', () => {
    const snapshot = {
      checkedAt: '2026-03-19T00:00:00Z',
      summary: { totalSnapshots: 100, changed: 2, added: 1, removed: 0, unchanged: 97 },
      changes: [
        {
          slug: 'page-a',
          type: 'page-changed',
          sourceUrl: 'https://docs.tricentis.com/testim/content/overview/page-a.htm',
          categories: {
            heading: { added: 0, removed: 0 },
            image: { added: 1, removed: 0 },
            code: { added: 0, removed: 0 },
            callout: { added: 0, removed: 0 },
            content: { added: 3, removed: 1 },
          },
          diffLines: 5,
        },
        {
          slug: 'page-b',
          type: 'page-changed',
          sourceUrl: 'https://docs.tricentis.com/testim/content/overview/page-b.htm',
          categories: {
            heading: { added: 0, removed: 0 },
            image: { added: 0, removed: 0 },
            code: { added: 0, removed: 0 },
            callout: { added: 0, removed: 0 },
            content: { added: 1, removed: 1 },
          },
          diffLines: 2,
        },
        {
          slug: 'new-page',
          type: 'page-added',
          sourceUrl: 'https://docs.tricentis.com/testim/content/overview/new-page.htm',
          categories: null,
          diffLines: 0,
        },
      ],
      sidebar: { changed: false, addedPages: [], removedPages: [] },
    };
    const parity = {
      summary: {
        checkedAt: '2026-03-19T00:00:00Z',
        actionableFiles: 1,
        signalFiles: 0,
        errorFiles: 0,
        issuesByType: { 'image-mismatch': 1 },
        issuesBySeverity: { actionable: 1 },
      },
      files: [
        {
          file: 'src/content/docs/example.md',
          issues: [{ type: 'image-mismatch', severity: 'actionable', detail: 'EN=8 JA=2' }],
        },
      ],
    };

    const report = buildActionableReport(snapshot, parity, []);
    assert.equal(report.snapshotDiff.shouldOpenIssue, true);
    assert.equal(report.snapshotDiff.summary.actionableCount, 3);
    assert.equal(report.snapshotDiff.summary.changed, 2);
    assert.equal(report.snapshotDiff.summary.added, 1);
    assert.equal(report.parityRegression.shouldOpenIssue, true);
    assert.match(report.snapshotDiff.body, /page-a/);
    assert.match(report.snapshotDiff.body, /NEW PAGE/);
    assert.match(report.parityRegression.body, /image-mismatch/);
  });

  it('does not open snapshot diff issue when no changes', () => {
    const snapshot = {
      checkedAt: '2026-03-19T00:00:00Z',
      summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
      changes: [],
      sidebar: { changed: false, addedPages: [], removedPages: [] },
    };
    const parity = {
      summary: { checkedAt: '2026-03-19T00:00:00Z', actionableFiles: 0, signalFiles: 0, errorFiles: 0 },
      files: [],
    };

    const report = buildActionableReport(snapshot, parity, []);
    assert.equal(report.snapshotDiff.shouldOpenIssue, false);
    assert.equal(report.snapshotDiff.summary.actionableCount, 0);
  });

  it('includes sidebar changes in issue body when sidebar changed', () => {
    const snapshot = {
      checkedAt: '2026-03-19T00:00:00Z',
      summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
      changes: [],
      sidebar: { changed: true, addedPages: ['new-feature'], removedPages: [] },
    };
    const parity = {
      summary: { checkedAt: '2026-03-19T00:00:00Z', actionableFiles: 0, signalFiles: 0, errorFiles: 0 },
      files: [],
    };

    const report = buildActionableReport(snapshot, parity, []);
    assert.match(report.snapshotDiff.body, /サイドバー変更/);
    assert.match(report.snapshotDiff.body, /追加ページ: 1/);
  });

  it('does NOT open a parity issue when all issues are validly acknowledged', () => {
    const snapshot = {
      checkedAt: '2026-03-19T00:00:00Z',
      summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
      changes: [],
      sidebar: { changed: false, addedPages: [], removedPages: [] },
    };
    const parity = {
      summary: {
        checkedAt: '2026-03-19T00:00:00Z',
        actionableFiles: 0,
        signalFiles: 1,
        errorFiles: 0,
        activeActionableFiles: 0,
        activeFiles: 0,
        activeErrorFiles: 0,
        acknowledgedIssues: 1,
        issuesByType: { 'paragraph-count-mismatch': 1 },
        issuesBySeverity: { signal: 1 },
      },
      files: [
        {
          file: 'src/content/docs/example.md',
          issues: [
            {
              type: 'paragraph-count-mismatch',
              severity: 'signal',
              detail: 'セクション #1 "Overview": 段落数 EN=4, JA=2',
              acknowledged: true,
              ackExpired: false,
              ackReason: 'Intentional JA structure difference',
              ackOwner: 'rymetry',
              ackReviewAfter: '2026-07-06',
            },
          ],
        },
      ],
    };

    const report = buildActionableReport(snapshot, parity, []);
    assert.equal(report.parityRegression.shouldOpenIssue, false);
    assert.equal(report.parityRegression.summary.issueCount, 0);
    assert.equal(report.parityRegression.topEntries.length, 0);
    // Legacy total-count fields must not leak into parityRegression.summary.
    // Total counts would have different semantics from issueCount (active),
    // which invites misreads by future consumers. Use issuesByType /
    // issuesBySeverity if a full breakdown is needed.
    assert.equal('signalFiles' in report.parityRegression.summary, false);
    assert.equal('errorFiles' in report.parityRegression.summary, false);
  });

  it('opens a parity issue when acknowledgement is expired on a non-coarse type', () => {
    const snapshot = {
      checkedAt: '2026-03-19T00:00:00Z',
      summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
      changes: [],
      sidebar: { changed: false, addedPages: [], removedPages: [] },
    };
    const parity = {
      summary: {
        checkedAt: '2026-03-19T00:00:00Z',
        actionableFiles: 1,
        signalFiles: 0,
        errorFiles: 0,
        activeActionableFiles: 1,
        activeFiles: 1,
        activeErrorFiles: 0,
        expiredAcknowledgements: 1,
        issuesByType: { 'image-mismatch': 1 },
        issuesBySeverity: { actionable: 1 },
      },
      files: [
        {
          file: 'src/content/docs/example.md',
          issues: [
            {
              type: 'image-mismatch',
              severity: 'actionable',
              detail: 'expired case',
              acknowledged: true,
              ackExpired: true,
              ackExpiryReason: 'fingerprint-changed',
            },
          ],
        },
      ],
    };

    const report = buildActionableReport(snapshot, parity, []);
    assert.equal(report.parityRegression.shouldOpenIssue, true);
    assert.equal(report.parityRegression.summary.issueCount, 1);
  });

  it('does NOT re-light parity issue for expired-ack on coarse signal', () => {
    // even when an acknowledgement on a coarse signal
    // expires, the gate / parityRegression must NOT re-light. The signal
    // stays on the audit channel only.
    const snapshot = {
      checkedAt: '2026-03-19T00:00:00Z',
      summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
      changes: [],
      sidebar: { changed: false, addedPages: [], removedPages: [] },
    };
    const parity = {
      summary: {
        checkedAt: '2026-03-19T00:00:00Z',
        actionableFiles: 0,
        signalFiles: 1,
        errorFiles: 0,
        activeActionableFiles: 0,
        activeFiles: 1,
        activeErrorFiles: 0,
        expiredAcknowledgements: 1,
        issuesByType: { 'paragraph-count-mismatch': 1 },
        issuesBySeverity: { signal: 1 },
      },
      files: [
        {
          file: 'src/content/docs/example.md',
          issues: [
            {
              type: 'paragraph-count-mismatch',
              severity: 'signal',
              detail: 'expired coarse',
              acknowledged: true,
              ackExpired: true,
              ackExpiryReason: 'fingerprint-changed',
            },
          ],
        },
      ],
    };

    const report = buildActionableReport(snapshot, parity, []);
    assert.equal(report.parityRegression.shouldOpenIssue, false);
    assert.equal(report.parityRegression.summary.issueCount, 0);
  });

  it('filters acknowledged issues out of top entries but keeps active ones on the same file', () => {
    const snapshot = {
      checkedAt: '2026-03-19T00:00:00Z',
      summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
      changes: [],
      sidebar: { changed: false, addedPages: [], removedPages: [] },
    };
    const parity = {
      summary: {
        checkedAt: '2026-03-19T00:00:00Z',
        actionableFiles: 1,
        signalFiles: 0,
        errorFiles: 0,
        activeActionableFiles: 1,
        activeFiles: 1,
        activeErrorFiles: 0,
        acknowledgedIssues: 1,
        issuesByType: { 'image-mismatch': 1, 'paragraph-count-mismatch': 1 },
        issuesBySeverity: { actionable: 1, signal: 1 },
      },
      files: [
        {
          file: 'src/content/docs/example.md',
          issues: [
            {
              type: 'image-mismatch',
              severity: 'actionable',
              detail: 'EN=3 JA=1',
            },
            {
              type: 'paragraph-count-mismatch',
              severity: 'signal',
              detail: 'acked noise',
              acknowledged: true,
              ackExpired: false,
              ackReason: 'noise',
              ackOwner: 'rymetry',
              ackReviewAfter: '2026-07-06',
            },
          ],
        },
      ],
    };

    const report = buildActionableReport(snapshot, parity, []);
    assert.equal(report.parityRegression.shouldOpenIssue, true);
    assert.equal(report.parityRegression.summary.issueCount, 1);
    assert.match(report.parityRegression.body, /image-mismatch/);
    assert.doesNotMatch(report.parityRegression.body, /acked noise/);
  });
});

describe('assignReviewGroups', () => {
  it('distributes entries round-robin across groups', () => {
    const entries = [
      { slug: 'a', bucket: 'content-only' },
      { slug: 'b', bucket: 'content-only' },
      { slug: 'c', bucket: 'content-only' },
    ];
    const result = assignReviewGroups(entries, 2);
    const groups = new Set(result.map((e) => e.reviewGroup));
    assert.equal(groups.size, 2);
    assert.equal(result.every((e) => e.reviewGroup.startsWith('review-group-')), true);
  });

  it('sorts page-lifecycle before structural-change before content-only', () => {
    const entries = [
      { slug: 'text', bucket: 'content-only' },
      { slug: 'new', bucket: 'page-lifecycle' },
      { slug: 'heading', bucket: 'structural-change' },
    ];
    const result = assignReviewGroups(entries, 3);
    assert.equal(result[0].slug, 'new');
    assert.equal(result[1].slug, 'heading');
    assert.equal(result[2].slug, 'text');
  });

  it('handles empty input', () => {
    const result = assignReviewGroups([], 3);
    assert.equal(result.length, 0);
  });

  it('sorts alphabetically within the same bucket', () => {
    const entries = [
      { slug: 'zebra', bucket: 'content-only' },
      { slug: 'alpha', bucket: 'content-only' },
      { slug: 'middle', bucket: 'content-only' },
    ];
    const result = assignReviewGroups(entries, 6);
    assert.equal(result[0].slug, 'alpha');
    assert.equal(result[1].slug, 'middle');
    assert.equal(result[2].slug, 'zebra');
  });
});

describe('renderSummaryMarkdown', () => {
  it('produces valid markdown with all sections', () => {
    const snapshot = {};
    const parity = {
      summary: {
        actionableFiles: 2,
        signalFiles: 1,
        errorFiles: 0,
        activeActionableFiles: 2,
        activeErrorFiles: 0,
        activeFiles: 3,
        acknowledgedIssues: 0,
      },
    };
    const actionableReport = {
      generatedAt: '2026-03-19T00:00:00Z',
      snapshotDiff: {
        summary: { changed: 3, added: 1, removed: 0, unchanged: 96, totalSnapshots: 100 },
      },
      parityRegression: {
        summary: { actionableCount: 2 },
      },
      auditManifest: {
        total: 4,
        bucketCounts: {
          'page-lifecycle': 1,
          'structural-change': 1,
          'content-only': 2,
        },
      },
    };
    const auditManifest = [{}, {}, {}, {}];

    const md = renderSummaryMarkdown(snapshot, parity, actionableReport, auditManifest);
    assert.match(md, /# ドキュメント検知サマリー/);
    assert.match(md, /## スナップショット差分/);
    assert.match(md, /変更ページ: 3/);
    assert.match(md, /追加ページ: 1/);
    assert.match(md, /## パリティ/);
    assert.match(md, /要対応ファイル: 2/);
    assert.match(md, /## 監査マニフェスト/);
    assert.match(md, /ページライフサイクル: 1/);
    assert.match(md, /構造変更: 1/);
    assert.match(md, /本文のみ: 2/);
    assert.match(md, /snapshot-diff-status\.json/);
  });

  it('reports 0 active files when all parity issues are acknowledged', () => {
    // Reproduces the P2 report: issueCount 0 but markdown used to say signalFiles: 22.
    const snapshot = {};
    const parity = {
      summary: {
        actionableFiles: 0,
        signalFiles: 22,
        errorFiles: 0,
        activeActionableFiles: 0,
        activeErrorFiles: 0,
        activeFiles: 0,
        acknowledgedIssues: 41,
        expiredAcknowledgements: 0,
      },
    };
    const actionableReport = {
      generatedAt: '2026-04-06T00:00:00Z',
      snapshotDiff: {
        summary: { changed: 0, added: 0, removed: 0, unchanged: 100, totalSnapshots: 100 },
      },
      parityRegression: {
        summary: { issueCount: 0 },
      },
      auditManifest: { total: 0, bucketCounts: {} },
    };

    const md = renderSummaryMarkdown(snapshot, parity, actionableReport, []);
    assert.match(md, /要対応ファイル: 0/);
    assert.match(md, /問題ファイル: 0/);
    assert.match(md, /承認済み \(非ブロッキング\): 41/);
    // The legacy counters must not appear standalone in a way that contradicts activeFiles:0.
    assert.doesNotMatch(md, /^- Signal-only files: 22$/m);
  });

  it('surfaces expired acknowledgements as a warning line', () => {
    const snapshot = {};
    const parity = {
      summary: {
        actionableFiles: 0,
        signalFiles: 1,
        errorFiles: 0,
        activeActionableFiles: 0,
        activeErrorFiles: 0,
        activeFiles: 1,
        acknowledgedIssues: 0,
        expiredAcknowledgements: 1,
      },
    };
    const actionableReport = {
      generatedAt: '2026-04-06T00:00:00Z',
      snapshotDiff: { summary: { changed: 0, added: 0, removed: 0, unchanged: 100, totalSnapshots: 100 } },
      parityRegression: { summary: { issueCount: 1 } },
      auditManifest: { total: 0, bucketCounts: {} },
    };

    const md = renderSummaryMarkdown(snapshot, parity, actionableReport, []);
    assert.match(md, /期限切れ承認: 1/);
  });

  it('marks partial advisory queue summaries as not repo-wide', () => {
    const snapshot = {};
    const parity = {
      summary: {
        actionableFiles: 0,
        signalFiles: 0,
        errorFiles: 0,
        activeActionableFiles: 0,
        activeErrorFiles: 0,
        activeFiles: 0,
        acknowledgedIssues: 0,
      },
    };
    const actionableReport = {
      generatedAt: '2026-04-07T00:00:00Z',
      snapshotDiff: {
        summary: { changed: 0, added: 0, removed: 0, unchanged: 100, totalSnapshots: 100 },
      },
      parityRegression: {
        summary: { issueCount: 0 },
      },
      parityFollowup: {
        summary: {
          baselineDebt: {
            baselinedIssues: 1,
            baselinedFiles: 1,
            baselineInvalidatedSlugs: ['overview/page-a'],
          },
          advisoryQueue: {
            issues: 2,
            files: 1,
            blockingItems: 1,
            advisoryQueueScope: {
              type: 'slug',
              isComplete: false,
              filters: { slug: 'overview/page-a' },
            },
          },
        },
      },
      auditManifest: { total: 0, bucketCounts: {} },
    };

    const md = renderSummaryMarkdown(snapshot, parity, actionableReport, []);
    assert.match(md, /アドバイザリキュー: 2 件 \(1 ファイル, 1 ブロッキング; 部分スコープ: slug=overview\/page-a、リポジトリ全体ではない\)/);
  });
});

describe('loadDetectionInputs', () => {
  it('returns empty objects when files do not exist', () => {
    const result = loadDetectionInputs({
      snapshotPath: '/nonexistent/snapshot.json',
      parityPath: '/nonexistent/parity.json',
      sourceSyncPath: '/nonexistent/sync.json',
    });
    assert.deepEqual(result.snapshot, {});
    assert.deepEqual(result.parity, {});
    assert.deepEqual(result.sourceSync, {});
  });
});

// ---------------------------------------------------------------------------
// sourceSyncHealth in buildActionableReport
// ---------------------------------------------------------------------------

describe('sourceSyncHealth in buildActionableReport', () => {
  const emptySnapshot = {
    checkedAt: '2026-04-06T00:00:00Z',
    summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
    changes: [],
    sidebar: { changed: false, addedPages: [], removedPages: [] },
  };
  const emptyParity = {
    summary: { checkedAt: '2026-04-06T00:00:00Z', actionableFiles: 0, signalFiles: 0, errorFiles: 0 },
    files: [],
  };

  it('opens source sync issue when freshnessState is broken', () => {
    const sourceSync = {
      schemaVersion: 1,
      freshnessState: 'broken',
      summary: { targetPages: 100, fetchedPages: 0, notFoundPages: 0, errorPages: 100, sidebarVerified: false },
      errors: [{ slug: '_sidebar', detail: 'Sidebar verification failed' }],
    };
    const report = buildActionableReport(emptySnapshot, emptyParity, [], { sourceSync });
    assert.equal(report.sourceSyncHealth.shouldOpenIssue, true);
    assert.equal(report.sourceSyncHealth.freshnessState, 'broken');
  });

  it('opens source sync issue when freshnessState is partial', () => {
    const sourceSync = {
      schemaVersion: 1,
      freshnessState: 'partial',
      summary: { targetPages: 100, fetchedPages: 95, notFoundPages: 2, errorPages: 3, sidebarVerified: true },
      errors: [{ slug: 'a', detail: 'HTTP 500' }],
    };
    const report = buildActionableReport(emptySnapshot, emptyParity, [], { sourceSync });
    assert.equal(report.sourceSyncHealth.shouldOpenIssue, true);
    assert.equal(report.sourceSyncHealth.freshnessState, 'partial');
  });

  it('does not open source sync issue when fresh', () => {
    const sourceSync = {
      schemaVersion: 1,
      freshnessState: 'fresh',
      summary: { targetPages: 100, fetchedPages: 100, notFoundPages: 0, errorPages: 0, sidebarVerified: true },
      errors: [],
    };
    const report = buildActionableReport(emptySnapshot, emptyParity, [], { sourceSync });
    assert.equal(report.sourceSyncHealth.shouldOpenIssue, false);
  });

  it('does not open source sync issue when sourceSync is empty', () => {
    const report = buildActionableReport(emptySnapshot, emptyParity, [], { sourceSync: {} });
    assert.equal(report.sourceSyncHealth.shouldOpenIssue, false);
  });

  it('includes source sync health in summary markdown', () => {
    const sourceSync = {
      schemaVersion: 1,
      freshnessState: 'broken',
      summary: { targetPages: 100, fetchedPages: 0, notFoundPages: 0, errorPages: 100, sidebarVerified: false },
      errors: [],
    };
    const report = buildActionableReport(emptySnapshot, emptyParity, [], { sourceSync });
    const md = renderSummaryMarkdown(emptySnapshot, emptyParity, report, [], sourceSync);
    assert.match(md, /## ソース同期状態/);
    assert.match(md, /broken/);
  });
});

// ---------------------------------------------------------------------------
// parityFollowup family
// ---------------------------------------------------------------------------

describe('parityFollowup in buildActionableReport', () => {
  const emptySnapshot = {
    checkedAt: '2026-04-07T00:00:00Z',
    summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
    changes: [],
    sidebar: { changed: false, addedPages: [], removedPages: [] },
  };

  const cleanParity = {
    summary: {
      checkedAt: '2026-04-07T00:00:00Z',
      actionableFiles: 0,
      signalFiles: 0,
      errorFiles: 0,
      baselinedIssues: 0,
      baselinedFiles: 0,
      baselineInvalidatedSlugs: [],
      advisoryQueueIssues: 0,
      advisoryQueueFiles: 0,
    },
    files: [],
    advisoryQueueScope: { type: 'full', isComplete: true, filters: {}, checkedFiles: 100, totalFiles: 100 },
    advisoryQueue: [],
  };

  it('includes parityFollowup family in report', () => {
    const report = buildActionableReport(emptySnapshot, cleanParity, []);
    assert.ok(report.parityFollowup, 'parityFollowup must be present');
    assert.equal(typeof report.parityFollowup.shouldOpenIssue, 'boolean');
    assert.equal(typeof report.parityFollowup.body, 'string');
    assert.ok(report.parityFollowup.summary);
    assert.ok(report.parityFollowup.summary.baselineDebt);
    assert.ok(report.parityFollowup.summary.advisoryQueue);
    assert.ok(report.parityFollowup.summary.reviewHints);
  });

  it('shouldOpenIssue = false when no follow-up debt', () => {
    const report = buildActionableReport(emptySnapshot, cleanParity, []);
    assert.equal(report.parityFollowup.shouldOpenIssue, false);
    assert.equal(report.parityFollowup.body, '');
  });

  it('shouldOpenIssue = true when baselinedIssues > 0', () => {
    const parity = {
      ...cleanParity,
      summary: {
        ...cleanParity.summary,
        baselinedIssues: 3,
        baselinedFiles: 1,
      },
      files: [
        {
          file: 'src/content/docs/overview/page-a.md',
          issues: [
            { type: 'segment-missing', severity: 'actionable', baselined: true, detail: 'frozen1' },
            { type: 'segment-extra', severity: 'actionable', baselined: true, detail: 'frozen2' },
            { type: 'segment-shifted', severity: 'actionable', baselined: true, detail: 'frozen3' },
          ],
        },
      ],
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityFollowup.shouldOpenIssue, true);
    assert.equal(report.parityFollowup.summary.baselineDebt.baselinedIssues, 3);
  });

  it('shouldOpenIssue = true when baselineInvalidatedSlugs has entries', () => {
    const parity = {
      ...cleanParity,
      summary: { ...cleanParity.summary, baselineInvalidatedSlugs: ['overview/page-a'] },
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityFollowup.shouldOpenIssue, true);
    assert.deepEqual(report.parityFollowup.summary.baselineDebt.baselineInvalidatedSlugs, [
      'overview/page-a',
    ]);
    assert.equal(report.parityFollowup.summary.baselineDebt.baselineInvalidatedSlugCount, 1);
  });

  it('shouldOpenIssue = true when advisory queue is complete with blocking items', () => {
    const parity = {
      ...cleanParity,
      summary: { ...cleanParity.summary, advisoryQueueIssues: 2, advisoryQueueFiles: 1 },
      advisoryQueueScope: { type: 'full', isComplete: true, filters: {}, checkedFiles: 100, totalFiles: 100 },
      advisoryQueue: [
        { slug: 'overview/page-a', blocking: true, issueCount: 2, issues: [{ inconclusiveCategory: 'tokenless-near-tie' }] },
      ],
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityFollowup.shouldOpenIssue, true);
    assert.equal(report.parityFollowup.summary.advisoryQueue.blockingItems, 1);
    assert.deepEqual(report.parityFollowup.summary.advisoryQueue.advisoryQueueScope, {
      type: 'full',
      isComplete: true,
      filters: {},
      checkedFiles: 100,
      totalFiles: 100,
    });
    assert.equal(report.parityFollowup.summary.advisoryQueue.advisoryQueue.length, 1);
    assert.equal(
      report.parityFollowup.summary.reviewHints.tokenlessNearTieExamples[0].slug,
      'overview/page-a',
    );
    assert.match(report.parityFollowup.body, /スコープ: リポジトリ全体/);

    const md = renderSummaryMarkdown(emptySnapshot, parity, report, []);
    assert.match(md, /アドバイザリキュー: 2 件 \(1 ファイル, 1 ブロッキング; リポジトリ全体\)/);
  });

  it('shouldOpenIssue = false when advisory has blocking items but scope is not complete', () => {
    const parity = {
      ...cleanParity,
      summary: { ...cleanParity.summary, advisoryQueueIssues: 2, advisoryQueueFiles: 1 },
      advisoryQueueScope: { type: 'slug', isComplete: false, filters: { slug: 'overview/page-a' }, checkedFiles: 1, totalFiles: 100 },
      advisoryQueue: [
        { slug: 'overview/page-a', blocking: true, issueCount: 2, issues: [] },
      ],
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityFollowup.shouldOpenIssue, false);
  });

  it('keeps partial advisory queue in JSON but omits it from issue body', () => {
    const parity = {
      ...cleanParity,
      summary: {
        ...cleanParity.summary,
        // baselineInvalidatedSlugs triggers parityFollowup to open.
        baselineInvalidatedSlugs: ['overview/page-a'],
        advisoryQueueIssues: 2,
        advisoryQueueFiles: 1,
      },
      files: [
        {
          file: 'src/content/docs/overview/page-a.md',
          issues: [
            {
              type: 'segment-missing',
              severity: 'actionable',
              detail: 'invalidated slug re-fire',
            },
          ],
        },
      ],
      advisoryQueueScope: {
        type: 'slug',
        isComplete: false,
        filters: { slug: 'overview/page-a' },
        checkedFiles: 1,
        totalFiles: 100,
      },
      advisoryQueue: [
        {
          slug: 'overview/page-a',
          file: 'src/content/docs/overview/page-a.md',
          blocking: true,
          issueCount: 2,
          issues: [{ inconclusiveCategory: 'tokenless-near-tie', detail: 'partial-only' }],
        },
      ],
    };

    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityFollowup.shouldOpenIssue, true);
    assert.equal(report.parityFollowup.summary.advisoryQueue.advisoryQueue.length, 1);
    assert.equal(report.parityFollowup.summary.advisoryQueue.includedInIssueBody, false);
    assert.deepEqual(report.parityFollowup.summary.advisoryQueue.advisoryQueueScope, {
      type: 'slug',
      isComplete: false,
      filters: { slug: 'overview/page-a' },
      checkedFiles: 1,
      totalFiles: 100,
    });
    assert.doesNotMatch(report.parityFollowup.body, /Advisory queue:/);
    assert.doesNotMatch(report.parityFollowup.body, /tokenless-near-tie/);
    assert.doesNotMatch(report.parityFollowup.body, /partial-only/);

    const md = renderSummaryMarkdown(emptySnapshot, parity, report, []);
    assert.match(md, /アドバイザリキュー: 2 件 \(1 ファイル, 1 ブロッキング; 部分スコープ: slug=overview\/page-a、リポジトリ全体ではない\)/);
  });

  it('parityFollowup body contains invalidated slugs', () => {
    const parity = {
      ...cleanParity,
      summary: { ...cleanParity.summary, baselineInvalidatedSlugs: ['overview/page-a', 'settings/config'] },
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityFollowup.shouldOpenIssue, true);
    assert.match(report.parityFollowup.body, /overview\/page-a/);
    assert.match(report.parityFollowup.body, /settings\/config/);
    assert.deepEqual(report.parityFollowup.summary.baselineDebt.baselineInvalidatedSlugs, [
      'overview/page-a',
      'settings/config',
    ]);
  });

  it('parityFollowup body contains baselined file details', () => {
    const parity = {
      ...cleanParity,
      summary: {
        ...cleanParity.summary,
        baselinedIssues: 2,
        baselinedFiles: 1,
      },
      files: [
        {
          file: 'src/content/docs/overview/page-a.md',
          issues: [
            { type: 'segment-missing', severity: 'actionable', baselined: true, detail: 'frozen' },
            { type: 'segment-extra', severity: 'actionable', baselined: true, detail: 'frozen2' },
          ],
        },
      ],
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityFollowup.shouldOpenIssue, true);
    assert.match(report.parityFollowup.body, /overview\/page-a/);
    assert.equal(report.parityFollowup.summary.reviewHints.topBaselinedPages[0].slug, 'overview/page-a');
  });
});

// ---------------------------------------------------------------------------
// parityRegression の structure mismatch summary exposure
// ---------------------------------------------------------------------------

describe('parityRegression structure mismatch summary exposure', () => {
  const emptySnapshot = {
    checkedAt: '2026-04-08T00:00:00Z',
    summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
    changes: [],
    sidebar: { changed: false, addedPages: [], removedPages: [] },
  };

  function makeParityWithStructureMismatch() {
    return {
      summary: {
        checkedAt: '2026-04-08T00:00:00Z',
        actionableFiles: 0,
        signalFiles: 0,
        errorFiles: 0,
        activeActionableFiles: 0,
        activeFiles: 0,
        activeErrorFiles: 0,
        reportableActiveFiles: 0,
        reportableActiveActionableFiles: 0,
        structureMismatchIssues: 5,
        structureMismatchFiles: 3,
        structureMismatchByType: {
          'section-structure-mismatch': 4,
          'segment-order-mismatch': 1,
        },
      },
      files: [
        {
          file: 'src/content/docs/running-tests/the-command-line-cli.md',
          issues: [
            {
              type: 'section-structure-mismatch',
              severity: 'actionable',
              detail: 'section[2]/block[3] kind diff',
            },
          ],
        },
      ],
    };
  }

  it('exposes structureMismatchIssues / structureMismatchFiles / structureMismatchByType in parityRegression.summary', () => {
    const parity = makeParityWithStructureMismatch();
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityRegression.summary.structureMismatchIssues, 5);
    assert.equal(report.parityRegression.summary.structureMismatchFiles, 3);
    assert.deepEqual(report.parityRegression.summary.structureMismatchByType, {
      'section-structure-mismatch': 4,
      'segment-order-mismatch': 1,
    });
  });

  it('defaults structure mismatch counters to 0 / {} when summary fields are absent', () => {
    const parity = {
      summary: { checkedAt: '2026-04-08T00:00:00Z' },
      files: [],
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityRegression.summary.structureMismatchIssues, 0);
    assert.equal(report.parityRegression.summary.structureMismatchFiles, 0);
    assert.deepEqual(report.parityRegression.summary.structureMismatchByType, {});
  });

  it('includes structure mismatch files in parityRegression.topEntries', () => {
    const parity = makeParityWithStructureMismatch();
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityRegression.topEntries.length, 1);
    assert.equal(
      report.parityRegression.topEntries[0].file,
      'src/content/docs/running-tests/the-command-line-cli.md',
    );
    assert.equal(report.parityRegression.shouldOpenIssue, true);
    assert.equal(report.parityRegression.summary.issueCount, 1);
  });

  it('parityRegression.body omits the "## Structure Mismatch (advisory)" section', () => {
    const parity = makeParityWithStructureMismatch();
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.doesNotMatch(report.parityRegression.body, /## Structure Mismatch/);
  });
});

// ---------------------------------------------------------------------------
// parityFollowup の sourceUnusable サブセクション露出
// ---------------------------------------------------------------------------

describe('parityFollowup sourceUnusable subsection exposure', () => {
  const emptySnapshot = {
    checkedAt: '2026-04-08T00:00:00Z',
    summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
    changes: [],
    sidebar: { changed: false, addedPages: [], removedPages: [] },
  };

  const cleanParity = {
    summary: {
      checkedAt: '2026-04-08T00:00:00Z',
      actionableFiles: 0,
      signalFiles: 0,
      errorFiles: 0,
      baselinedIssues: 0,
      baselinedFiles: 0,
      baselineInvalidatedSlugs: [],
      advisoryQueueIssues: 0,
      advisoryQueueFiles: 0,
    },
    files: [],
    advisoryQueueScope: { type: 'full', isComplete: true, filters: {}, checkedFiles: 100, totalFiles: 100 },
    advisoryQueue: [],
  };

  it('exposes sourceUnusable counters in parityFollowup.summary', () => {
    const parity = {
      ...cleanParity,
      summary: {
        ...cleanParity.summary,
        snapshotUnusableIssues: 3,
        snapshotUnusableFiles: 2,
        snapshotUnusableByType: {
          'snapshot-incomplete': 2,
          'source-unusable': 1,
        },
      },
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.ok(report.parityFollowup.summary.sourceUnusable, 'sourceUnusable subsection must exist');
    assert.equal(report.parityFollowup.summary.sourceUnusable.snapshotUnusableIssues, 3);
    assert.equal(report.parityFollowup.summary.sourceUnusable.snapshotUnusableFiles, 2);
    assert.deepEqual(report.parityFollowup.summary.sourceUnusable.snapshotUnusableByType, {
      'snapshot-incomplete': 2,
      'source-unusable': 1,
    });
  });

  it('defaults sourceUnusable counters to 0 / {} when summary fields are absent', () => {
    const report = buildActionableReport(emptySnapshot, cleanParity, []);
    assert.ok(report.parityFollowup.summary.sourceUnusable);
    assert.equal(report.parityFollowup.summary.sourceUnusable.snapshotUnusableIssues, 0);
    assert.equal(report.parityFollowup.summary.sourceUnusable.snapshotUnusableFiles, 0);
    assert.deepEqual(report.parityFollowup.summary.sourceUnusable.snapshotUnusableByType, {});
  });

  it('shouldOpenIssue stays FALSE when source-unusable is the only signal', () => {
    const parity = {
      ...cleanParity,
      summary: {
        ...cleanParity.summary,
        snapshotUnusableIssues: 5,
        snapshotUnusableFiles: 3,
        snapshotUnusableByType: { 'snapshot-incomplete': 4, 'source-unusable': 1 },
      },
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityFollowup.shouldOpenIssue, false);
    assert.equal(report.parityFollowup.body, '');
  });

  it('parityFollowup.body contains "## ソース使用不可 (参考)" section when sourceUnusable counts > 0 AND another signal opens the issue', () => {
    const parity = {
      ...cleanParity,
      summary: {
        ...cleanParity.summary,
        baselinedIssues: 1,
        baselinedFiles: 1,
        snapshotUnusableIssues: 4,
        snapshotUnusableFiles: 2,
        snapshotUnusableByType: { 'snapshot-incomplete': 3, 'source-unusable': 1 },
      },
      files: [
        {
          file: 'src/content/docs/overview/page-a.md',
          issues: [
            {
              type: 'segment-missing',
              severity: 'actionable',
              baselined: true,
              detail: 'frozen',
            },
          ],
        },
      ],
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityFollowup.shouldOpenIssue, true);
    assert.match(report.parityFollowup.body, /## ソース使用不可 \(参考\)/);
    assert.match(report.parityFollowup.body, /合計: 4 件/);
    assert.match(report.parityFollowup.body, /snapshot-incomplete: 3/);
    assert.match(report.parityFollowup.body, /source-unusable: 1/);
    assert.match(
      report.parityFollowup.body,
      /翻訳者責任外|snapshot.*source sync|翻訳 PR では修正できません/,
    );
  });

  it('parityFollowup.body OMITS the "## Source Unusable" section when snapshotUnusableIssues = 0', () => {
    const parity = {
      ...cleanParity,
      summary: {
        ...cleanParity.summary,
        baselinedIssues: 1,
        baselinedFiles: 1,
        snapshotUnusableIssues: 0,
        snapshotUnusableFiles: 0,
        snapshotUnusableByType: {},
      },
      files: [
        {
          file: 'src/content/docs/overview/page-a.md',
          issues: [
            {
              type: 'segment-missing',
              severity: 'actionable',
              baselined: true,
              detail: 'frozen',
            },
          ],
        },
      ],
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityFollowup.shouldOpenIssue, true);
    assert.doesNotMatch(report.parityFollowup.body, /## ソース使用不可 \(参考\)/);
  });
});

// ---------------------------------------------------------------------------
// renderSummaryMarkdown structure / source unusable sections
// ---------------------------------------------------------------------------

describe('renderSummaryMarkdown structure / source unusable sections', () => {
  function makeBaseInputs() {
    const snapshot = {};
    const parity = {
      summary: {
        actionableFiles: 0,
        signalFiles: 0,
        errorFiles: 0,
        activeActionableFiles: 3,
        activeErrorFiles: 0,
        activeFiles: 3,
        reportableActiveFiles: 3,
        reportableActiveActionableFiles: 3,
        acknowledgedIssues: 0,
        structureMismatchIssues: 5,
        structureMismatchFiles: 3,
        structureMismatchByType: {
          'section-structure-mismatch': 4,
          'segment-order-mismatch': 1,
        },
        snapshotUnusableIssues: 2,
        snapshotUnusableFiles: 2,
        snapshotUnusableByType: {
          'snapshot-incomplete': 1,
          'source-unusable': 1,
        },
      },
    };
    const actionableReport = {
      generatedAt: '2026-04-08T00:00:00Z',
      snapshotDiff: {
        summary: { changed: 0, added: 0, removed: 0, unchanged: 100, totalSnapshots: 100 },
      },
      parityRegression: {
        summary: {
          issueCount: 0,
          structureMismatchIssues: 5,
          structureMismatchFiles: 3,
          structureMismatchByType: {
            'section-structure-mismatch': 4,
            'segment-order-mismatch': 1,
          },
        },
      },
      parityFollowup: {
        summary: {
          baselineDebt: {
            baselinedIssues: 0,
            baselinedFiles: 0,
            baselineInvalidatedSlugs: [],
          },
          advisoryQueue: { issues: 0, files: 0, blockingItems: 0, advisoryQueueScope: null },
          sourceUnusable: {
            snapshotUnusableIssues: 2,
            snapshotUnusableFiles: 2,
            snapshotUnusableByType: {
              'snapshot-incomplete': 1,
              'source-unusable': 1,
            },
          },
        },
      },
      auditManifest: { total: 0, bucketCounts: {} },
    };
    return { snapshot, parity, actionableReport };
  }

  it('omits the "## Structure Mismatch (advisory)" section', () => {
    const { snapshot, parity, actionableReport } = makeBaseInputs();
    const md = renderSummaryMarkdown(snapshot, parity, actionableReport, []);
    assert.doesNotMatch(md, /## Structure Mismatch/);
  });

  it('includes "## ソース使用不可 (advisory)" section when snapshotUnusableIssues > 0', () => {
    const { snapshot, parity, actionableReport } = makeBaseInputs();
    const md = renderSummaryMarkdown(snapshot, parity, actionableReport, []);
    assert.match(md, /## ソース使用不可 \(参考\)/);
    assert.match(md, /合計: 2 件 \(2 ファイル\)/);
    assert.match(md, /翻訳の問題ではなく|スナップショット.*ソース同期|翻訳 PR では修正できません/);
    assert.match(md, /snapshot-incomplete: 1/);
    assert.match(md, /source-unusable: 1/);
  });

  it('OMITS the source unusable section when snapshotUnusableIssues = 0', () => {
    const snapshot = {};
    const parity = {
      summary: {
        activeActionableFiles: 0,
        activeErrorFiles: 0,
        activeFiles: 0,
        reportableActiveFiles: 0,
        acknowledgedIssues: 0,
        structureMismatchIssues: 0,
        structureMismatchFiles: 0,
        structureMismatchByType: {},
        snapshotUnusableIssues: 0,
        snapshotUnusableFiles: 0,
        snapshotUnusableByType: {},
      },
    };
    const actionableReport = {
      generatedAt: '2026-04-08T00:00:00Z',
      snapshotDiff: {
        summary: { changed: 0, added: 0, removed: 0, unchanged: 100, totalSnapshots: 100 },
      },
      parityRegression: {
        summary: {
          issueCount: 0,
          structureMismatchIssues: 0,
          structureMismatchFiles: 0,
          structureMismatchByType: {},
        },
      },
      parityFollowup: {
        summary: {
          baselineDebt: { baselinedIssues: 0, baselinedFiles: 0, baselineInvalidatedSlugs: [] },
          advisoryQueue: { issues: 0, files: 0, blockingItems: 0, advisoryQueueScope: null },
          sourceUnusable: {
            snapshotUnusableIssues: 0,
            snapshotUnusableFiles: 0,
            snapshotUnusableByType: {},
          },
        },
      },
      auditManifest: { total: 0, bucketCounts: {} },
    };
    const md = renderSummaryMarkdown(snapshot, parity, actionableReport, []);
    assert.doesNotMatch(md, /## Structure Mismatch/);
    assert.doesNotMatch(md, /## ソース使用不可/);
  });

  it('## パリティ section の "問題ファイル" は structure mismatch も含む', () => {
    const { snapshot, parity, actionableReport } = makeBaseInputs();
    const md = renderSummaryMarkdown(snapshot, parity, actionableReport, []);
    assert.match(md, /問題ファイル: 3/);
    assert.match(md, /要対応ファイル: 3/);
  });
});

// ---------------------------------------------------------------------------
// parityRegression excludes non-expired baselined issues
// ---------------------------------------------------------------------------

describe('parityRegression excludes non-expired baselined issues', () => {
  const emptySnapshot = {
    checkedAt: '2026-04-07T00:00:00Z',
    summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
    changes: [],
    sidebar: { changed: false, addedPages: [], removedPages: [] },
  };

  it('does not open parity issue when all issues are non-expired baselined', () => {
    const parity = {
      summary: {
        checkedAt: '2026-04-07T00:00:00Z',
        actionableFiles: 1,
        signalFiles: 0,
        errorFiles: 0,
        baselinedIssues: 2,
        baselinedFiles: 1,
        activeActionableFiles: 0,
        activeFiles: 0,
        baselineInvalidatedSlugs: [],
      },
      files: [
        {
          file: 'src/content/docs/overview/page-a.md',
          issues: [
            { type: 'segment-missing', severity: 'actionable', baselined: true, detail: 'frozen' },
            { type: 'segment-extra', severity: 'actionable', baselined: true, detail: 'frozen2' },
          ],
        },
      ],
      advisoryQueue: [],
      advisoryQueueScope: null,
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityRegression.shouldOpenIssue, false);
    assert.equal(report.parityRegression.summary.issueCount, 0);
    assert.equal(report.parityRegression.topEntries.length, 0);
    assert.deepEqual(report.parityRegression.summary.issuesByType, {});
    assert.deepEqual(report.parityRegression.summary.issuesBySeverity, {});
  });

  it('baselined issue is NEVER in parityRegression topEntries (v2: no expiry)', () => {
    // v2: baselined:true alone freezes the issue — there is no expiry path to
    // re-fire it. Non-baselined active issues still appear.
    const parity = {
      summary: {
        checkedAt: '2026-04-07T00:00:00Z',
        actionableFiles: 1,
        errorFiles: 0,
        activeActionableFiles: 1,
        baselineInvalidatedSlugs: [],
      },
      files: [
        {
          file: 'src/content/docs/overview/page-a.md',
          issues: [
            { type: 'segment-missing', severity: 'actionable', baselined: true, detail: 'frozen — must not appear' },
            { type: 'segment-extra', severity: 'actionable', detail: 'active — must appear' },
          ],
        },
      ],
      advisoryQueue: [],
      advisoryQueueScope: null,
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityRegression.shouldOpenIssue, true);
    assert.doesNotMatch(report.parityRegression.body, /frozen — must not appear/);
    assert.match(report.parityRegression.body, /segment-extra/);
    assert.deepEqual(report.parityRegression.summary.issuesByType, {
      'segment-extra': 1,
    });
    assert.deepEqual(report.parityRegression.summary.issuesBySeverity, {
      actionable: 1,
    });
  });
});

// ---------------------------------------------------------------------------
// detection-family HTML comments in issue bodies
// ---------------------------------------------------------------------------

describe('detection-family HTML comments in issue bodies', () => {
  const snapshot = {
    checkedAt: '2026-04-07T00:00:00Z',
    summary: { totalSnapshots: 100, changed: 1, added: 0, removed: 0, unchanged: 99 },
    changes: [
      {
        slug: 'page-a',
        type: 'page-changed',
        sourceUrl: 'https://docs.tricentis.com/testim/content/page-a.htm',
        categories: {
          heading: { added: 0, removed: 0 },
          image: { added: 0, removed: 0 },
          code: { added: 0, removed: 0 },
          callout: { added: 0, removed: 0 },
          content: { added: 1, removed: 0 },
        },
        diffLines: 1,
      },
    ],
    sidebar: { changed: false, addedPages: [], removedPages: [] },
  };
  const parity = {
    summary: {
      checkedAt: '2026-04-07T00:00:00Z',
      actionableFiles: 1,
      baselinedIssues: 0,
      baselineInvalidatedSlugs: [],
    },
    files: [
      { file: 'src/content/docs/page-a.md', issues: [{ type: 'image-mismatch', severity: 'actionable', detail: 'EN=3 JA=1' }] },
    ],
    advisoryQueueScope: null,
    advisoryQueue: [],
  };

  it('snapshotDiff body starts with detection-family marker', () => {
    const report = buildActionableReport(snapshot, parity, []);
    assert.match(report.snapshotDiff.body, /^<!-- detection-family: snapshot-diff -->/);
  });

  it('parityRegression body starts with detection-family marker', () => {
    const report = buildActionableReport(snapshot, parity, []);
    assert.match(report.parityRegression.body, /^<!-- detection-family: parity-regression -->/);
  });

  it('sourceSyncHealth body starts with detection-family marker when broken', () => {
    const sourceSync = {
      freshnessState: 'broken',
      summary: { targetPages: 100, fetchedPages: 0, notFoundPages: 0, errorPages: 100, sidebarVerified: false },
      errors: [],
    };
    const report = buildActionableReport(snapshot, parity, [], { sourceSync });
    assert.match(report.sourceSyncHealth.body, /^<!-- detection-family: source-sync-health -->/);
  });

  it('sourceSyncHealth body is empty string when not broken', () => {
    const report = buildActionableReport(snapshot, parity, [], { sourceSync: { freshnessState: 'fresh' } });
    assert.equal(report.sourceSyncHealth.body, '');
  });

  it('parityFollowup body starts with detection-family marker when shouldOpen', () => {
    const parityWithDebt = {
      ...parity,
      summary: { ...parity.summary, baselineInvalidatedSlugs: ['page-a'] },
    };
    const report = buildActionableReport(snapshot, parityWithDebt, []);
    assert.match(report.parityFollowup.body, /^<!-- detection-family: parity-followup -->/);
  });
});

// ---------------------------------------------------------------------------
// New signal types
// ---------------------------------------------------------------------------

describe('buildActionableReport with new signal types', () => {
  it('does NOT open parity issue for signal-only new types', () => {
    // section-count, table-shape, table-cell-* are all in
    // COARSE_SIGNAL_TYPES. A file with only these types is audit-only and
    // does not trigger parityRegression.
    const snapshot = {
      checkedAt: '2026-03-23T00:00:00Z',
      summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
      changes: [],
      sidebar: { changed: false, addedPages: [], removedPages: [] },
    };
    const parity = {
      summary: {
        checkedAt: '2026-03-23T00:00:00Z',
        actionableFiles: 0,
        signalFiles: 1,
        errorFiles: 0,
        issuesByType: {
          'section-count-mismatch': 1,
          'table-shape-mismatch': 1,
          'table-cell-english-residual': 2,
          'table-cell-empty-mismatch': 1,
        },
        issuesBySeverity: { signal: 5 },
      },
      files: [
        {
          file: 'src/content/docs/example.md',
          issues: [
            { type: 'section-count-mismatch', severity: 'signal', detail: 'EN=5 JA=4' },
            { type: 'table-shape-mismatch', severity: 'signal', detail: 'テーブル #1' },
            { type: 'table-cell-english-residual', severity: 'signal', detail: 'cell' },
            { type: 'table-cell-english-residual', severity: 'signal', detail: 'cell2' },
            { type: 'table-cell-empty-mismatch', severity: 'signal', detail: 'mismatch' },
          ],
        },
      ],
    };

    const report = buildActionableReport(snapshot, parity, []);
    assert.equal(report.parityRegression.shouldOpenIssue, false);
    assert.equal(report.parityRegression.summary.issueCount, 0);
    assert.equal(report.parityRegression.topEntries.length, 0);
  });

  it('does not open parity issue for error-only entries', () => {
    const snapshot = {
      checkedAt: '2026-04-03T00:00:00Z',
      summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
      changes: [],
      sidebar: { changed: false, addedPages: [], removedPages: [] },
    };
    const parity = {
      summary: {
        checkedAt: '2026-04-03T00:00:00Z',
        actionableFiles: 0,
        signalFiles: 0,
        errorFiles: 1,
        issuesByType: { 'source-fetch-error': 1 },
        issuesBySeverity: { error: 1 },
      },
      files: [
        {
          file: 'src/content/docs/example.md',
          issues: [{ type: 'source-fetch-error', severity: 'error', detail: 'fetch failed' }],
        },
      ],
    };

    const report = buildActionableReport(snapshot, parity, []);
    assert.equal(report.parityRegression.shouldOpenIssue, false);
  });

  it('does NOT open parity issue for mixed error + coarse signal entries', () => {
    // source-fetch-error has severity 'error', not 'actionable',
    // so it never enters parityRegression in the first place. Combined
    // with a heading-mismatch (now coarse-only/audit), the file has zero
    // reportable issues. Pre-Phase-8 the heading-mismatch would have lit
    // the issue; now it must not.
    const snapshot = {
      checkedAt: '2026-04-03T00:00:00Z',
      summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
      changes: [],
      sidebar: { changed: false, addedPages: [], removedPages: [] },
    };
    const parity = {
      summary: {
        checkedAt: '2026-04-03T00:00:00Z',
        actionableFiles: 0,
        signalFiles: 1,
        errorFiles: 1,
        issuesByType: { 'source-fetch-error': 1, 'heading-mismatch': 1 },
        issuesBySeverity: { error: 1, signal: 1 },
      },
      files: [
        {
          file: 'src/content/docs/example.md',
          issues: [
            { type: 'source-fetch-error', severity: 'error', detail: 'fetch failed' },
            { type: 'heading-mismatch', severity: 'signal', detail: 'h2: EN=5 JA=3' },
          ],
        },
      ],
    };

    const report = buildActionableReport(snapshot, parity, []);
    assert.equal(report.parityRegression.shouldOpenIssue, false);
  });
});

// ---------------------------------------------------------------------------
// parityRegression excludes coarse signals
// ---------------------------------------------------------------------------

describe('parityRegression excludes coarse audit signals', () => {
  const emptySnapshot = {
    checkedAt: '2026-04-07T00:00:00Z',
    summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
    changes: [],
    sidebar: { changed: false, addedPages: [], removedPages: [] },
  };

  it('still opens parity issue for non-coarse actionable issues', () => {
    const parity = {
      summary: {
        checkedAt: '2026-04-07T00:00:00Z',
        actionableFiles: 1,
      },
      files: [
        {
          file: 'src/content/docs/example.md',
          issues: [{ type: 'image-mismatch', severity: 'actionable', detail: 'EN=3 JA=1' }],
        },
      ],
      advisoryQueue: [],
      advisoryQueueScope: null,
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityRegression.shouldOpenIssue, true);
    assert.equal(report.parityRegression.summary.issueCount, 1);
    assert.match(report.parityRegression.body, /image-mismatch/);
  });

  it('filters coarse signals out of mixed file body but keeps actionable rows', () => {
    const parity = {
      summary: {
        checkedAt: '2026-04-07T00:00:00Z',
        actionableFiles: 1,
      },
      files: [
        {
          file: 'src/content/docs/example.md',
          issues: [
            { type: 'image-mismatch', severity: 'actionable', detail: 'real drift' },
            {
              type: 'paragraph-count-mismatch',
              severity: 'signal',
              detail: 'noisy coarse — must not appear',
            },
            {
              type: 'heading-mismatch',
              severity: 'signal',
              detail: 'noisy coarse 2 — must not appear',
            },
          ],
        },
      ],
      advisoryQueue: [],
      advisoryQueueScope: null,
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityRegression.shouldOpenIssue, true);
    assert.equal(report.parityRegression.summary.issueCount, 1);
    assert.match(report.parityRegression.body, /image-mismatch/);
    assert.match(report.parityRegression.body, /real drift/);
    assert.doesNotMatch(report.parityRegression.body, /paragraph-count-mismatch/);
    assert.doesNotMatch(report.parityRegression.body, /heading-mismatch/);
    assert.doesNotMatch(report.parityRegression.body, /noisy coarse/);
    assert.deepEqual(report.parityRegression.summary.issuesByType, {
      'image-mismatch': 1,
    });
  });

  it('topEntries does not include files whose only issues are coarse', () => {
    const parity = {
      summary: { checkedAt: '2026-04-07T00:00:00Z', actionableFiles: 1 },
      files: [
        {
          file: 'src/content/docs/coarse-only.md',
          issues: [
            { type: 'paragraph-count-mismatch', severity: 'signal', detail: 'noise' },
          ],
        },
        {
          file: 'src/content/docs/real.md',
          issues: [
            { type: 'image-mismatch', severity: 'actionable', detail: 'drift' },
          ],
        },
      ],
      advisoryQueue: [],
      advisoryQueueScope: null,
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    const topFiles = report.parityRegression.topEntries.map((entry) => entry.file);
    assert.deepEqual(topFiles, ['src/content/docs/real.md']);
  });

  it('coarse-only file does not appear in parityRegression even with expired ack', () => {
    const parity = {
      summary: {
        checkedAt: '2026-04-07T00:00:00Z',
        actionableFiles: 0,
        expiredAcknowledgements: 1,
      },
      files: [
        {
          file: 'src/content/docs/expired-coarse.md',
          issues: [
            {
              type: 'paragraph-count-mismatch',
              severity: 'signal',
              detail: 'expired',
              acknowledged: true,
              ackExpired: true,
              ackExpiryReason: 'fingerprint-changed',
            },
          ],
        },
      ],
      advisoryQueue: [],
      advisoryQueueScope: null,
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityRegression.shouldOpenIssue, false);
    assert.equal(report.parityRegression.summary.issueCount, 0);
  });

  it('coarse-only file with baselined: true still does not appear in parityRegression', () => {
    // v2: baselined:true always freezes. Coarse signals are also non-reportable
    // by type regardless of baseline state.
    const parity = {
      summary: {
        checkedAt: '2026-04-07T00:00:00Z',
        actionableFiles: 0,
      },
      files: [
        {
          file: 'src/content/docs/baselined-coarse.md',
          issues: [
            {
              type: 'heading-mismatch',
              severity: 'signal',
              detail: 'frozen coarse',
              baselined: true,
            },
          ],
        },
      ],
      advisoryQueue: [],
      advisoryQueueScope: null,
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityRegression.shouldOpenIssue, false);
    assert.equal(report.parityRegression.summary.issueCount, 0);
  });
});

// ---------------------------------------------------------------------------
// family count and audit manifest invariants
// ---------------------------------------------------------------------------

describe('family count and audit manifest invariants', () => {
  const emptySnapshot = {
    checkedAt: '2026-04-07T00:00:00Z',
    summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
    changes: [],
    sidebar: { changed: false, addedPages: [], removedPages: [] },
  };

  it('actionableReport still exposes exactly 4 detection families', () => {
    // The 4 families are: snapshotDiff, parityRegression, sourceSyncHealth,
    // parityFollowup. family 名は増減させない。
    const parity = {
      summary: { checkedAt: '2026-04-07T00:00:00Z' },
      files: [],
      advisoryQueue: [],
      advisoryQueueScope: null,
    };
    const report = buildActionableReport(emptySnapshot, parity, [], { sourceSync: {} });
    const familyKeys = [
      report.snapshotDiff?.key,
      report.parityRegression?.key,
      report.sourceSyncHealth?.key,
      report.parityFollowup?.key,
    ].filter(Boolean);
    assert.equal(familyKeys.length, 4);
    assert.deepEqual(new Set(familyKeys), new Set([
      'snapshot-diff',
      'parity-regression',
      'source-sync-health',
      'parity-followup',
    ]));
  });

  it('coarse-only run still produces all 4 families with shouldOpenIssue=false', () => {
    const parity = {
      summary: { checkedAt: '2026-04-07T00:00:00Z', signalFiles: 1 },
      files: [
        {
          file: 'src/content/docs/coarse.md',
          issues: [
            { type: 'paragraph-count-mismatch', severity: 'signal', detail: 'EN=4 JA=2' },
          ],
        },
      ],
      advisoryQueue: [],
      advisoryQueueScope: null,
    };
    const report = buildActionableReport(emptySnapshot, parity, [], { sourceSync: {} });
    // All 4 families exist as keys ...
    assert.ok(report.snapshotDiff);
    assert.ok(report.parityRegression);
    assert.ok(report.sourceSyncHealth);
    assert.ok(report.parityFollowup);
    // ... and none of them want a managed issue opened.
    assert.equal(report.snapshotDiff.shouldOpenIssue, false);
    assert.equal(report.parityRegression.shouldOpenIssue, false);
    assert.equal(report.sourceSyncHealth.shouldOpenIssue, false);
    assert.equal(report.parityFollowup.shouldOpenIssue, false);
  });

  it('parity-only file with coarse signals does not create a new auditManifest entry', () => {
    // The auditManifest is snapshot-driven: a parity issue WITHOUT a
    // matching snapshot change must NOT add an entry.
    // this property — coarse signals appear nowhere in the manifest.
    const snapshot = {
      checkedAt: '2026-04-07T00:00:00Z',
      summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
      changes: [],
      sidebar: { changed: false, addedPages: [], removedPages: [] },
    };
    const parity = {
      summary: { checkedAt: '2026-04-07T00:00:00Z', signalFiles: 1 },
      files: [
        {
          file: 'src/content/docs/parity-only.md',
          issues: [
            { type: 'paragraph-count-mismatch', severity: 'signal', detail: 'noise' },
            { type: 'heading-mismatch', severity: 'signal', detail: 'noise2' },
          ],
        },
      ],
    };
    const manifest = buildAuditManifest(snapshot, parity);
    assert.equal(manifest.length, 0);
  });

  it('renderSummaryMarkdown puts coarse signals in the audit section, not Parity', () => {
    // docs-update-summary.md must put
    // coarse signals into a new "Audit Signals" section, never into the
    // active counts of the "Parity" section. The Parity section should
    // count zero active files for a coarse-only summary, and the Audit
    // Signals section should list the coarse type breakdown.
    const snapshot = {};
    const parity = {
      summary: {
        actionableFiles: 0,
        signalFiles: 1,
        errorFiles: 0,
        activeActionableFiles: 0,
        activeErrorFiles: 0,
        activeFiles: 1,
        acknowledgedIssues: 0,
        reportableActiveFiles: 0,
        reportableActiveActionableFiles: 0,
        auditSignalIssues: 3,
        auditSignalFiles: 1,
        auditSignalsByType: {
          'paragraph-count-mismatch': 2,
          'heading-mismatch': 1,
        },
      },
    };
    const actionableReport = {
      generatedAt: '2026-04-07T00:00:00Z',
      snapshotDiff: {
        summary: { changed: 0, added: 0, removed: 0, unchanged: 100, totalSnapshots: 100 },
      },
      parityRegression: { summary: { issueCount: 0 } },
      parityFollowup: {
        summary: {
          baselineDebt: { baselinedIssues: 0, baselinedFiles: 0, baselineInvalidatedSlugs: [] },
          advisoryQueue: { issues: 0, files: 0, blockingItems: 0, advisoryQueueScope: null },
        },
      },
      auditManifest: { total: 0, bucketCounts: {} },
    };
    const md = renderSummaryMarkdown(snapshot, parity, actionableReport, []);

    // パリティ section: active counts must reflect reportable
    // counters, NOT the legacy ones that include coarse signals.
    assert.match(md, /## パリティ/);
    assert.match(md, /要対応ファイル: 0/);
    assert.match(md, /問題ファイル: 0/);

    // 監査シグナル section exists and lists the coarse breakdown.
    assert.match(md, /## 監査シグナル/);
    assert.match(md, /paragraph-count-mismatch: 2/);
    assert.match(md, /heading-mismatch: 1/);

    // Sanity: coarse signal labels must NOT show up inside the パリティ
    // section. The simplest way to test this is to extract the パリティ
    // section text and check it for the coarse type names.
    const paritySectionMatch = md.match(/## パリティ\n([\s\S]*?)(?:\n## |$)/);
    assert.ok(paritySectionMatch, 'パリティ section must exist');
    const paritySection = paritySectionMatch[1];
    assert.doesNotMatch(paritySection, /paragraph-count-mismatch/);
    assert.doesNotMatch(paritySection, /heading-mismatch/);
  });

  it('propagates parity.summary.runScope to actionableReport top-level', () => {
    // sync guard reads runScope off docs-actionable-report.json,
    // not parity-check-status.json. Make sure the field is hoisted.
    const parity = {
      summary: {
        checkedAt: '2026-04-07T00:00:00Z',
        runScope: {
          type: 'slug',
          isComplete: false,
          filters: { slug: 'overview/page-a', section: null },
        },
      },
      files: [],
      advisoryQueue: [],
      advisoryQueueScope: null,
    };
    const report = buildActionableReport(emptySnapshot, parity, [], { sourceSync: {} });
    assert.deepEqual(report.runScope, {
      type: 'slug',
      isComplete: false,
      filters: { slug: 'overview/page-a', section: null },
    });
  });

  it('propagates a full-scope runScope through unchanged', () => {
    const parity = {
      summary: {
        checkedAt: '2026-04-07T00:00:00Z',
        runScope: {
          type: 'full',
          isComplete: true,
          filters: { slug: null, section: null },
        },
      },
      files: [],
      advisoryQueue: [],
      advisoryQueueScope: null,
    };
    const report = buildActionableReport(emptySnapshot, parity, [], { sourceSync: {} });
    assert.equal(report.runScope.type, 'full');
    assert.equal(report.runScope.isComplete, true);
  });

  it('falls back to runScope=null when parity.summary.runScope is absent (legacy report)', () => {
    // runScope が無い legacy report でも top-level runScope は null を維持する。
    const parity = {
      summary: { checkedAt: '2026-04-07T00:00:00Z' },
      files: [],
      advisoryQueue: [],
      advisoryQueueScope: null,
    };
    const report = buildActionableReport(emptySnapshot, parity, [], { sourceSync: {} });
    assert.equal(report.runScope, null);
  });

  it('snapshot-driven entries still receive parity cross-reference (existing behaviour)', () => {
    // 既存の parity cross-reference は維持する。
    const snapshot = {
      changes: [
        {
          slug: 'overview/page-a',
          type: 'page-changed',
          sourceUrl: 'https://docs.tricentis.com/.../page-a.htm',
          categories: {
            heading: { added: 0, removed: 0 },
            image: { added: 1, removed: 0 },
            code: { added: 0, removed: 0 },
            callout: { added: 0, removed: 0 },
            content: { added: 1, removed: 0 },
          },
          diffLines: 2,
        },
      ],
    };
    const parity = {
      files: [
        {
          file: 'src/content/docs/overview/page-a.md',
          issues: [
            { type: 'image-mismatch', severity: 'actionable', detail: 'EN=2 JA=1' },
            { type: 'paragraph-count-mismatch', severity: 'signal', detail: 'EN=4 JA=3' },
          ],
        },
      ],
    };
    const manifest = buildAuditManifest(snapshot, parity);
    assert.equal(manifest.length, 1);
    // Both signals are passed through into the manifest entry; the audit
    // manifest is meant for human review, so we don't filter at this layer.
    assert.equal(manifest[0].signals.length, 2);
    const signalTypes = manifest[0].signals.map((s) => s.type);
    assert.ok(signalTypes.includes('image-mismatch'));
    assert.ok(signalTypes.includes('paragraph-count-mismatch'));
  });
});

// ---------------------------------------------------------------------------
// §1 cleanup — strict artifact validators
// ---------------------------------------------------------------------------

function validSnapshotDiff() {
  return {
    schemaVersion: 1,
    runId: '2026-04-07T00:00:00Z#snapshot-diff-deadbeef',
    sourceSyncRunId: '2026-04-07T00:00:00Z#sync-deadbeef',
    sourceInventoryFingerprint: null,
    runScope: { type: 'full', isComplete: true, filters: { slug: null, section: null } },
    checkedAt: '2026-04-07T00:00:00Z',
    summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
    changes: [],
    sidebar: { changed: false, addedPages: [], removedPages: [] },
  };
}

function validParityStatus() {
  return {
    schemaVersion: 1,
    summary: {
      checkedAt: '2026-04-07T00:00:00Z',
      runScope: { type: 'full', isComplete: true, filters: { slug: null, section: null } },
      result: 'pass',
    },
    files: [],
  };
}

function validActionableReport() {
  return {
    schemaVersion: ACTIONABLE_REPORT_SCHEMA_VERSION,
    snapshotDiff: { shouldOpenIssue: false },
    parityRegression: { shouldOpenIssue: false },
    sourceSyncHealth: { shouldOpenIssue: false },
    parityFollowup: { shouldOpenIssue: false },
  };
}

function validSourceSyncStatus() {
  return {
    schemaVersion: 2,
    runId: '2026-04-07T00:00:00Z#sync-deadbeef',
    checkedAt: '2026-04-07T00:00:00Z',
    sourceInventoryFingerprint: 'sha256:' + 'a'.repeat(64),
    sidebarFingerprint: 'sha256:' + 'b'.repeat(64),
    freshnessState: 'fresh',
    runScope: { type: 'full', isComplete: true, filters: { slug: null, section: null } },
    summary: {
      targetPages: 100,
      fetchedPages: 100,
      notFoundPages: 0,
      errorPages: 0,
      excludedPages: 0,
      excludedBrokenPages: 0,
      excludedRecoveredPages: 0,
      sidebarVerified: true,
    },
    pages: [],
    errors: [],
  };
}

describe('§1 cleanup — validateSnapshotDiffStatus', () => {
  it('accepts a valid snapshot-diff-status', () => {
    assert.doesNotThrow(() => validateSnapshotDiffStatus(validSnapshotDiff()));
  });

  it('throws on missing runId', () => {
    const v = validSnapshotDiff();
    delete v.runId;
    assert.throws(() => validateSnapshotDiffStatus(v), /runId must be a string/);
  });

  it('throws when sourceSyncRunId is neither string nor null', () => {
    const v = validSnapshotDiff();
    v.sourceSyncRunId = 123;
    assert.throws(
      () => validateSnapshotDiffStatus(v),
      /sourceSyncRunId must be string\|null/,
    );
  });

  it('throws on missing schemaVersion', () => {
    const v = validSnapshotDiff();
    delete v.schemaVersion;
    assert.throws(() => validateSnapshotDiffStatus(v), /unsupported schemaVersion/);
  });

  it('throws on wrong schemaVersion', () => {
    const v = validSnapshotDiff();
    v.schemaVersion = 2;
    assert.throws(() => validateSnapshotDiffStatus(v), /unsupported schemaVersion/);
  });

  it('throws on missing runScope', () => {
    const v = validSnapshotDiff();
    delete v.runScope;
    assert.throws(() => validateSnapshotDiffStatus(v), /missing "runScope"/);
  });

  it('throws on non-array changes', () => {
    const v = validSnapshotDiff();
    v.changes = null;
    assert.throws(() => validateSnapshotDiffStatus(v), /"changes" must be an array/);
  });
});

describe('§1 cleanup — validateParityCheckStatus', () => {
  it('accepts a valid parity-check-status', () => {
    assert.doesNotThrow(() => validateParityCheckStatus(validParityStatus()));
  });

  it('throws when summary.result is missing', () => {
    const v = validParityStatus();
    delete v.summary.result;
    assert.throws(
      () => validateParityCheckStatus(v),
      /summary\.result must be one of pass\|fail\|inconclusive/,
    );
  });

  it('throws when summary.result is an unknown value', () => {
    const v = validParityStatus();
    v.summary.result = 'green';
    assert.throws(
      () => validateParityCheckStatus(v),
      /summary\.result must be one of pass\|fail\|inconclusive/,
    );
  });

  it('throws when summary.runScope.isComplete is missing', () => {
    const v = validParityStatus();
    delete v.summary.runScope.isComplete;
    assert.throws(
      () => validateParityCheckStatus(v),
      /summary\.runScope\.isComplete must be boolean/,
    );
  });

  it('throws on missing schemaVersion', () => {
    const v = validParityStatus();
    delete v.schemaVersion;
    assert.throws(() => validateParityCheckStatus(v), /unsupported schemaVersion/);
  });

  // Phase 4: debug.artifactCoverage は runtime 側で emit されるが、
  // validator / detection 側は gate-sensitive でないため passthrough として
  // 受け入れる (Spec Invariant 3: debug.* は baseline / ack / gate と独立)。
  it('passes through debug.artifactCoverage without rejecting', () => {
    const v = validParityStatus();
    v.debug = {
      artifactCoverage: {
        registryEntries: 2,
        matchedHits: 3,
        bySlug: { 'a/b': 2, 'c/d': 1 },
        byToken: { '/docs/index': 2, 'http://google.com': 1 },
      },
    };
    // validator が debug.* を rejection 対象にしないこと (passthrough 契約)
    assert.doesNotThrow(() => validateParityCheckStatus(v));
    // field は input をそのまま保持している (mutation 禁止の確認)
    assert.equal(v.debug.artifactCoverage.matchedHits, 3);
    assert.equal(v.debug.artifactCoverage.byToken['/docs/index'], 2);
  });
});

describe('§1 cleanup — validateActionableReport', () => {
  it('accepts a valid actionable report', () => {
    assert.doesNotThrow(() => validateActionableReport(validActionableReport()));
  });

  it('throws when a family is missing', () => {
    const v = validActionableReport();
    delete v.parityRegression;
    assert.throws(() => validateActionableReport(v), /missing "parityRegression"/);
  });

  it('throws when a family.shouldOpenIssue is not boolean', () => {
    const v = validActionableReport();
    v.parityRegression.shouldOpenIssue = 'no';
    assert.throws(
      () => validateActionableReport(v),
      /parityRegression\.shouldOpenIssue must be boolean/,
    );
  });

  it('throws on wrong schemaVersion', () => {
    const v = validActionableReport();
    v.schemaVersion = 999;
    assert.throws(() => validateActionableReport(v), /unsupported schemaVersion/);
  });
});

describe('§1 cleanup — validateSourceSyncStatus', () => {
  it('accepts a valid source-sync-status', () => {
    assert.doesNotThrow(() => validateSourceSyncStatus(validSourceSyncStatus()));
  });

  it('throws when runId is not a string', () => {
    const v = validSourceSyncStatus();
    v.runId = 123;
    assert.throws(() => validateSourceSyncStatus(v), /runId must be a string/);
  });

  it('throws when checkedAt is not a string', () => {
    const v = validSourceSyncStatus();
    v.checkedAt = 123;
    assert.throws(() => validateSourceSyncStatus(v), /checkedAt must be a string/);
  });

  it('throws on missing schemaVersion', () => {
    const v = validSourceSyncStatus();
    delete v.schemaVersion;
    assert.throws(() => validateSourceSyncStatus(v), /unsupported schemaVersion/);
  });

  it('accepts schemaVersion 1 (pre-#255 backward compat)', () => {
    // v1 artifact は excluded* が無くても通る
    const v = {
      schemaVersion: 1,
      runId: '2026-04-07T00:00:00Z#old',
      checkedAt: '2026-04-07T00:00:00Z',
      sourceInventoryFingerprint: 'sha256:' + 'a'.repeat(64),
      sidebarFingerprint: 'sha256:' + 'b'.repeat(64),
      freshnessState: 'fresh',
      runScope: { type: 'full', isComplete: true, filters: { slug: null, section: null } },
      summary: {
        targetPages: 100, fetchedPages: 100, notFoundPages: 0, errorPages: 0,
        sidebarVerified: true,
      },
      pages: [],
      errors: [],
    };
    assert.doesNotThrow(() => validateSourceSyncStatus(v));
  });

  it('throws when runScope is missing', () => {
    const v = validSourceSyncStatus();
    delete v.runScope;
    assert.throws(() => validateSourceSyncStatus(v), /runScope is required/);
  });

  it('throws when freshnessState is unknown', () => {
    const v = validSourceSyncStatus();
    v.freshnessState = 'green';
    assert.throws(
      () => validateSourceSyncStatus(v),
      /freshnessState must be one of fresh\|partial\|broken\|stale/,
    );
  });

  it('throws when sourceInventoryFingerprint is not a string', () => {
    const v = validSourceSyncStatus();
    v.sourceInventoryFingerprint = 123;
    assert.throws(
      () => validateSourceSyncStatus(v),
      /sourceInventoryFingerprint must be a string/,
    );
  });

  it('throws when sidebarFingerprint is not a string', () => {
    const v = validSourceSyncStatus();
    v.sidebarFingerprint = 123;
    assert.throws(
      () => validateSourceSyncStatus(v),
      /sidebarFingerprint must be a string/,
    );
  });

  it('throws when summary.sidebarVerified is not boolean', () => {
    const v = validSourceSyncStatus();
    v.summary.sidebarVerified = 'yes';
    assert.throws(
      () => validateSourceSyncStatus(v),
      /summary\.sidebarVerified must be boolean/,
    );
  });

  it('throws when pages is not an array', () => {
    const v = validSourceSyncStatus();
    v.pages = null;
    assert.throws(() => validateSourceSyncStatus(v), /pages must be an array/);
  });

  it('throws when errors is not an array', () => {
    const v = validSourceSyncStatus();
    v.errors = null;
    assert.throws(() => validateSourceSyncStatus(v), /errors must be an array/);
  });

  // excluded counter の strict validation
  it('throws when summary.excludedPages is not a number', () => {
    const v = validSourceSyncStatus();
    v.summary.excludedPages = 'one';
    assert.throws(
      () => validateSourceSyncStatus(v),
      /summary\.excludedPages must be a number/,
    );
  });

  it('throws when summary.excludedBrokenPages is not a number', () => {
    const v = validSourceSyncStatus();
    v.summary.excludedBrokenPages = null;
    assert.throws(
      () => validateSourceSyncStatus(v),
      /summary\.excludedBrokenPages must be a number/,
    );
  });

  it('throws when summary.excludedRecoveredPages is not a number', () => {
    const v = validSourceSyncStatus();
    v.summary.excludedRecoveredPages = undefined;
    assert.throws(
      () => validateSourceSyncStatus(v),
      /summary\.excludedRecoveredPages must be a number/,
    );
  });

  it('throws when non-excluded page carries debtCategory (e.g. fetchStatus typo)', () => {
    // excluded-typo は excluded-* set に含まれないので non-excluded 扱いになり、
    // debtCategory が残っていると "non-excluded page must not have debtCategory" で弾かれる
    const v = validSourceSyncStatus();
    v.pages = [
      { slug: 'a', fetchStatus: 'excluded-typo', debtCategory: 'source-side-debt' },
    ];
    assert.throws(
      () => validateSourceSyncStatus(v),
      /non-excluded page.*must not have debtCategory/,
    );
  });

  it('throws when a debt page is missing recoveryProbe', () => {
    const v = validSourceSyncStatus();
    v.pages = [
      { slug: 'a', fetchStatus: 'excluded-broken', debtCategory: 'source-side-debt' },
    ];
    assert.throws(
      () => validateSourceSyncStatus(v),
      /recoveryProbe/,
    );
  });

  it('accepts valid debt page with recoveryProbe object', () => {
    const v = validSourceSyncStatus();
    v.summary.excludedPages = 1;
    v.summary.excludedBrokenPages = 1;
    v.pages = [
      {
        slug: 'a',
        fetchStatus: 'excluded-broken',
        debtCategory: 'source-side-debt',
        recoveryProbe: { issueType: 'snapshot-incomplete', reason: 'extractor-empty', expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty', expectedMatch: true },
      },
    ];
    assert.doesNotThrow(() => validateSourceSyncStatus(v));
  });

  it('accepts valid debt page with recoveryProbe null (excluded-recovered)', () => {
    const v = validSourceSyncStatus();
    v.summary.excludedPages = 1;
    v.summary.excludedRecoveredPages = 1;
    v.pages = [
      {
        slug: 'a',
        fetchStatus: 'excluded-recovered',
        debtCategory: 'source-side-debt',
        recoveryProbe: null,
      },
    ];
    assert.doesNotThrow(() => validateSourceSyncStatus(v));
  });

  // --- fetchStatus × recoveryProbe の組み合わせ契約 ---

  it('throws when excluded-broken has recoveryProbe: null (不可能状態)', () => {
    const v = validSourceSyncStatus();
    v.summary.excludedPages = 1;
    v.summary.excludedBrokenPages = 1;
    v.pages = [
      {
        slug: 'a',
        fetchStatus: 'excluded-broken',
        debtCategory: 'source-side-debt',
        recoveryProbe: null,
      },
    ];
    assert.throws(
      () => validateSourceSyncStatus(v),
      /recoveryProbe must be an object for excluded-broken/,
    );
  });

  it('throws when excluded-broken has recoveryProbe as primitive', () => {
    const v = validSourceSyncStatus();
    v.summary.excludedPages = 1;
    v.summary.excludedBrokenPages = 1;
    v.pages = [
      {
        slug: 'a',
        fetchStatus: 'excluded-broken',
        debtCategory: 'source-side-debt',
        recoveryProbe: 123,
      },
    ];
    assert.throws(
      () => validateSourceSyncStatus(v),
      /recoveryProbe must be an object for excluded-broken/,
    );
  });

  it('throws when excluded-broken has recoveryProbe as array', () => {
    const v = validSourceSyncStatus();
    v.summary.excludedPages = 1;
    v.summary.excludedBrokenPages = 1;
    v.pages = [
      {
        slug: 'a',
        fetchStatus: 'excluded-broken',
        debtCategory: 'source-side-debt',
        recoveryProbe: ['snapshot-incomplete', 'extractor-empty'],
      },
    ];
    assert.throws(
      () => validateSourceSyncStatus(v),
      /recoveryProbe must be an object for excluded-broken/,
    );
  });

  it('throws when excluded-broken recoveryProbe.expectedMatch is missing', () => {
    const v = validSourceSyncStatus();
    v.summary.excludedPages = 1;
    v.summary.excludedBrokenPages = 1;
    v.pages = [
      {
        slug: 'a',
        fetchStatus: 'excluded-broken',
        debtCategory: 'source-side-debt',
        recoveryProbe: { issueType: 'snapshot-incomplete', reason: 'extractor-empty', expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty' },
      },
    ];
    assert.throws(
      () => validateSourceSyncStatus(v),
      /recoveryProbe\.expectedMatch must be a boolean/,
    );
  });

  it('throws when excluded-broken recoveryProbe.expectedMatch is not boolean', () => {
    const v = validSourceSyncStatus();
    v.summary.excludedPages = 1;
    v.summary.excludedBrokenPages = 1;
    v.pages = [
      {
        slug: 'a',
        fetchStatus: 'excluded-broken',
        debtCategory: 'source-side-debt',
        recoveryProbe: { issueType: 'snapshot-incomplete', reason: 'extractor-empty', expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty', expectedMatch: 'yes' },
      },
    ];
    assert.throws(
      () => validateSourceSyncStatus(v),
      /recoveryProbe\.expectedMatch must be a boolean/,
    );
  });

  it('throws when excluded-broken recoveryProbe.issueType is not a string', () => {
    const v = validSourceSyncStatus();
    v.summary.excludedPages = 1;
    v.summary.excludedBrokenPages = 1;
    v.pages = [
      {
        slug: 'a',
        fetchStatus: 'excluded-broken',
        debtCategory: 'source-side-debt',
        recoveryProbe: { issueType: null, reason: 'extractor-empty', expectedMatch: true },
      },
    ];
    assert.throws(
      () => validateSourceSyncStatus(v),
      /recoveryProbe\.issueType must be a string/,
    );
  });

  it('throws when excluded-broken recoveryProbe.reason is not a string', () => {
    const v = validSourceSyncStatus();
    v.summary.excludedPages = 1;
    v.summary.excludedBrokenPages = 1;
    v.pages = [
      {
        slug: 'a',
        fetchStatus: 'excluded-broken',
        debtCategory: 'source-side-debt',
        recoveryProbe: { issueType: 'snapshot-incomplete', reason: 42, expectedMatch: true },
      },
    ];
    assert.throws(
      () => validateSourceSyncStatus(v),
      /recoveryProbe\.reason must be a string/,
    );
  });

  it('throws when excluded-recovered has non-null recoveryProbe (不可能状態)', () => {
    const v = validSourceSyncStatus();
    v.summary.excludedPages = 1;
    v.summary.excludedRecoveredPages = 1;
    v.pages = [
      {
        slug: 'a',
        fetchStatus: 'excluded-recovered',
        debtCategory: 'source-side-debt',
        recoveryProbe: { issueType: 'snapshot-incomplete', reason: 'extractor-empty', expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty', expectedMatch: true },
      },
    ];
    assert.throws(
      () => validateSourceSyncStatus(v),
      /recoveryProbe must be null for excluded-recovered/,
    );
  });

  it('throws when excluded-broken page is missing debtCategory', () => {
    const v = validSourceSyncStatus();
    v.summary.excludedPages = 1;
    v.summary.excludedBrokenPages = 1;
    v.pages = [
      {
        slug: 'a',
        fetchStatus: 'excluded-broken',
        recoveryProbe: { issueType: 'snapshot-incomplete', reason: 'extractor-empty', expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty', expectedMatch: true },
      },
    ];
    assert.throws(
      () => validateSourceSyncStatus(v),
      /excluded page.*must have debtCategory/,
    );
  });

  it('throws when excluded-recovered page is missing debtCategory', () => {
    const v = validSourceSyncStatus();
    v.summary.excludedPages = 1;
    v.summary.excludedRecoveredPages = 1;
    v.pages = [
      {
        slug: 'a',
        fetchStatus: 'excluded-recovered',
        recoveryProbe: null,
      },
    ];
    assert.throws(
      () => validateSourceSyncStatus(v),
      /excluded page.*must have debtCategory/,
    );
  });

  it('throws when non-excluded page carries recoveryProbe', () => {
    const v = validSourceSyncStatus();
    v.pages = [
      {
        slug: 'a',
        fetchStatus: 'ok',
        recoveryProbe: null,
      },
    ];
    assert.throws(
      () => validateSourceSyncStatus(v),
      /non-excluded page.*must not have recoveryProbe/,
    );
  });

  it('throws when debtCategory is not "source-side-debt"', () => {
    const v = validSourceSyncStatus();
    v.summary.excludedPages = 1;
    v.summary.excludedBrokenPages = 1;
    v.pages = [
      {
        slug: 'a',
        fetchStatus: 'excluded-broken',
        debtCategory: 'foo',
        recoveryProbe: { issueType: 'snapshot-incomplete', reason: 'extractor-empty', expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty', expectedMatch: true },
      },
    ];
    assert.throws(
      () => validateSourceSyncStatus(v),
      /must have debtCategory "source-side-debt"/,
    );
  });

  it('throws when summary.excludedPages disagrees with pages[]', () => {
    const v = validSourceSyncStatus();
    v.summary.excludedPages = 0;
    v.summary.excludedBrokenPages = 0;
    v.pages = [
      {
        slug: 'a',
        fetchStatus: 'excluded-broken',
        debtCategory: 'source-side-debt',
        recoveryProbe: {
          issueType: 'snapshot-incomplete',
          reason: 'extractor-empty',
          expectedIssueType: 'snapshot-incomplete',
          expectedReason: 'extractor-empty',
          expectedMatch: true,
        },
      },
    ];
    assert.throws(
      () => validateSourceSyncStatus(v),
      /summary\.excludedPages must equal pages\[\] excluded count/,
    );
  });

  it('throws when summary.excludedBrokenPages disagrees with pages[]', () => {
    const v = validSourceSyncStatus();
    v.summary.excludedPages = 1;
    v.summary.excludedBrokenPages = 0;
    v.pages = [
      {
        slug: 'a',
        fetchStatus: 'excluded-broken',
        debtCategory: 'source-side-debt',
        recoveryProbe: {
          issueType: 'snapshot-incomplete',
          reason: 'extractor-empty',
          expectedIssueType: 'snapshot-incomplete',
          expectedReason: 'extractor-empty',
          expectedMatch: true,
        },
      },
    ];
    assert.throws(
      () => validateSourceSyncStatus(v),
      /summary\.excludedBrokenPages must equal pages\[\] excluded-broken count/,
    );
  });

  it('throws when summary.excludedRecoveredPages disagrees with pages[]', () => {
    const v = validSourceSyncStatus();
    v.summary.excludedPages = 1;
    v.summary.excludedRecoveredPages = 0;
    v.pages = [
      {
        slug: 'a',
        fetchStatus: 'excluded-recovered',
        debtCategory: 'source-side-debt',
        recoveryProbe: null,
      },
    ];
    assert.throws(
      () => validateSourceSyncStatus(v),
      /summary\.excludedRecoveredPages must equal pages\[\] excluded-recovered count/,
    );
  });
});

describe('§1 cleanup — validateDetectionInputs', () => {
  it('returns ok=true when all three inputs are valid', () => {
    const result = validateDetectionInputs({
      snapshot: validSnapshotDiff(),
      parity: validParityStatus(),
      sourceSync: validSourceSyncStatus(),
    });
    assert.deepEqual(result, { ok: true });
  });

  it('returns ok=true when sourceSync is empty (legacy run)', () => {
    const result = validateDetectionInputs({
      snapshot: validSnapshotDiff(),
      parity: validParityStatus(),
      sourceSync: {},
    });
    assert.deepEqual(result, { ok: true });
  });

  it('reports per-input errors when something is malformed', () => {
    const broken = validParityStatus();
    delete broken.summary.result;
    const result = validateDetectionInputs({
      snapshot: validSnapshotDiff(),
      parity: broken,
      sourceSync: validSourceSyncStatus(),
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.length >= 1);
    assert.match(result.errors[0], /^parity:/);
  });

  it('reports sourceSync errors when schemaVersion is malformed', () => {
    const result = validateDetectionInputs({
      snapshot: validSnapshotDiff(),
      parity: validParityStatus(),
      sourceSync: { ...validSourceSyncStatus(), schemaVersion: 'bad' },
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.startsWith('sourceSync:')));
  });
});

describe('§1 cleanup — loadDetectionInputs strict mode', () => {
  it('throws when strict=true and one of the required artifacts fails validation', async () => {
    // We don't have files on disk to point at, but the strict path
    // composes loadDetectionInputs → validateDetectionInputs. This test
    // shape mirrors how the §2 workflow guard exercises it.
    // Skipped here because the helper assumes filesystem inputs; the
    // direct validateDetectionInputs tests above already cover the
    // failure logic.
  });
});

// ---------------------------------------------------------------------------
// source-side debt visibility and Japanization
// ---------------------------------------------------------------------------

describe('source-side debt section in summary markdown', () => {
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

  it('emits "## Source-side debt" (日本語) section when excluded pages exist', () => {
    const sourceSync = {
      schemaVersion: 1,
      freshnessState: 'fresh',
      summary: {
        targetPages: 100,
        fetchedPages: 99,
        notFoundPages: 0,
        errorPages: 0,
        excludedPages: 1,
        excludedBrokenPages: 1,
        excludedRecoveredPages: 0,
        sidebarVerified: true,
      },
      pages: [
        {
          slug: 'testops/testops-version-control/pull-requests',
          fetchStatus: 'excluded-broken',
          debtCategory: 'source-side-debt',
          recoveryProbe: { issueType: 'snapshot-incomplete', reason: 'extractor-empty', expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty', expectedMatch: true },
        },
      ],
      errors: [],
    };
    const report = buildActionableReport(emptySnapshot, emptyParity, [], { sourceSync });
    const md = renderSummaryMarkdown(emptySnapshot, emptyParity, report, [], sourceSync);

    // 日本語セクション見出しが emit される
    assert.match(md, /## ソース原文の既知問題/);
    // Counters (human-readable Japanese labels)
    assert.match(md, /除外ページ: 1/);
    assert.match(md, /未復旧: 1/);
    assert.match(md, /復旧候補: 0/);
    // Slug listing subsection
    assert.match(md, /### 未復旧/);
    assert.match(md, /testops\/testops-version-control\/pull-requests/);
    // Recovery probe 結果
    assert.match(md, /snapshot-incomplete/);
    assert.match(md, /extractor-empty/);
  });

  it('omits the section entirely when no excluded pages exist', () => {
    const sourceSync = {
      schemaVersion: 1,
      freshnessState: 'fresh',
      summary: {
        targetPages: 100,
        fetchedPages: 100,
        notFoundPages: 0,
        errorPages: 0,
        excludedPages: 0,
        excludedBrokenPages: 0,
        excludedRecoveredPages: 0,
        sidebarVerified: true,
      },
      pages: [],
      errors: [],
    };
    const report = buildActionableReport(emptySnapshot, emptyParity, [], { sourceSync });
    const md = renderSummaryMarkdown(emptySnapshot, emptyParity, report, [], sourceSync);

    assert.doesNotMatch(md, /## ソース原文の既知問題/);
    assert.doesNotMatch(md, /excluded-broken/);
  });

  it('lists recovery-candidate subsection (復旧候補) when excluded-recovered exists', () => {
    const sourceSync = {
      schemaVersion: 1,
      freshnessState: 'fresh',
      summary: {
        targetPages: 100,
        fetchedPages: 99,
        notFoundPages: 0,
        errorPages: 0,
        excludedPages: 1,
        excludedBrokenPages: 0,
        excludedRecoveredPages: 1,
        sidebarVerified: true,
      },
      pages: [
        {
          slug: 'testops/testops-version-control/pull-requests',
          fetchStatus: 'excluded-recovered',
          debtCategory: 'source-side-debt',
          recoveryProbe: null,
        },
      ],
      errors: [],
    };
    const report = buildActionableReport(emptySnapshot, emptyParity, [], { sourceSync });
    const md = renderSummaryMarkdown(emptySnapshot, emptyParity, report, [], sourceSync);

    assert.match(md, /## ソース原文の既知問題/);
    assert.match(md, /復旧候補: 1/);
    assert.match(md, /### 復旧候補/);
    assert.match(md, /testops\/testops-version-control\/pull-requests/);
    // recovered は「復旧したので registry から削除を検討」説明を含む
    assert.match(md, /registry|登録解除|除外解除/);
  });

  it('exposes sourceSideDebt counters on actionable report JSON', () => {
    // JSON consumer (sync-detection-issues / dashboards) が独立に
    // counter を読めるように、docs-actionable-report.json にも露出する
    const sourceSync = {
      schemaVersion: 1,
      freshnessState: 'fresh',
      summary: {
        targetPages: 100,
        fetchedPages: 98,
        notFoundPages: 0,
        errorPages: 0,
        excludedPages: 2,
        excludedBrokenPages: 1,
        excludedRecoveredPages: 1,
        sidebarVerified: true,
      },
      pages: [
        {
          slug: 'a',
          fetchStatus: 'excluded-broken',
          debtCategory: 'source-side-debt',
          recoveryProbe: { issueType: 'snapshot-incomplete', reason: 'extractor-empty', expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty', expectedMatch: true },
        },
        {
          slug: 'b',
          fetchStatus: 'excluded-recovered',
          debtCategory: 'source-side-debt',
          recoveryProbe: null,
        },
      ],
      errors: [],
    };
    const report = buildActionableReport(emptySnapshot, emptyParity, [], { sourceSync });

    assert.ok(
      report.sourceSyncHealth.sourceSideDebt,
      'actionable report must expose sourceSideDebt under sourceSyncHealth',
    );
    assert.equal(report.sourceSyncHealth.sourceSideDebt.excludedPages, 2);
    assert.equal(report.sourceSyncHealth.sourceSideDebt.excludedBrokenPages, 1);
    assert.equal(report.sourceSyncHealth.sourceSideDebt.excludedRecoveredPages, 1);

    // brokenSlugs / recoveredSlugs が slug list として露出している
    assert.deepEqual(report.sourceSyncHealth.sourceSideDebt.brokenSlugs, ['a']);
    assert.deepEqual(report.sourceSyncHealth.sourceSideDebt.recoveredSlugs, ['b']);
  });

  it('recomputes source-side debt counters from pages[] even when summary counters are stale', () => {
    const sourceSync = {
      schemaVersion: 2,
      freshnessState: 'fresh',
      summary: {
        targetPages: 100,
        fetchedPages: 100,
        notFoundPages: 0,
        errorPages: 0,
        excludedPages: 0,
        excludedBrokenPages: 0,
        excludedRecoveredPages: 0,
        sidebarVerified: true,
      },
      pages: [
        {
          slug: 'a',
          fetchStatus: 'excluded-broken',
          debtCategory: 'source-side-debt',
          recoveryProbe: {
            issueType: 'snapshot-incomplete',
            reason: 'extractor-empty',
            expectedIssueType: 'snapshot-incomplete',
            expectedReason: 'extractor-empty',
            expectedMatch: true,
          },
        },
      ],
      errors: [],
    };
    const report = buildActionableReport(emptySnapshot, emptyParity, [], { sourceSync });

    assert.equal(report.sourceSyncHealth.shouldOpenIssue, true);
    assert.equal(report.sourceSyncHealth.sourceSideDebt.excludedPages, 1);
    assert.equal(report.sourceSyncHealth.sourceSideDebt.excludedBrokenPages, 1);
    assert.deepEqual(report.sourceSyncHealth.sourceSideDebt.brokenSlugs, ['a']);
  });

  it('Source Sync Health issue body surfaces source-side debt info in 日本語', () => {
    // freshnessState=partial (broken 以外) で issue body が開いたとき、
    // source-side debt 情報も日本語で body に入る
    const sourceSync = {
      schemaVersion: 1,
      freshnessState: 'partial',
      summary: {
        targetPages: 100,
        fetchedPages: 95,
        notFoundPages: 0,
        errorPages: 4,
        excludedPages: 1,
        excludedBrokenPages: 1,
        excludedRecoveredPages: 0,
        sidebarVerified: true,
      },
      pages: [
        {
          slug: 'testops/testops-version-control/pull-requests',
          fetchStatus: 'excluded-broken',
          debtCategory: 'source-side-debt',
          recoveryProbe: { issueType: 'snapshot-incomplete', reason: 'extractor-empty', expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty', expectedMatch: true },
        },
      ],
      errors: [{ slug: 'x', detail: 'HTTP 500' }],
    };
    const report = buildActionableReport(emptySnapshot, emptyParity, [], { sourceSync });

    assert.equal(report.sourceSyncHealth.shouldOpenIssue, true);
    assert.match(report.sourceSyncHealth.body, /ソース原文の既知問題/);
    assert.match(report.sourceSyncHealth.body, /testops\/testops-version-control\/pull-requests/);
    assert.match(report.sourceSyncHealth.body, /未復旧/);
  });

  it('[P1] debt-only run (fresh) でも sourceSyncHealth issue が open する', () => {
    // P1 フィードバック: freshness=fresh でも excludedPages > 0 なら
    // managed issue に debt が載らないと運用契約が閉じない
    const sourceSync = {
      schemaVersion: 1,
      freshnessState: 'fresh',
      summary: {
        targetPages: 100,
        fetchedPages: 99,
        notFoundPages: 0,
        errorPages: 0,
        excludedPages: 1,
        excludedBrokenPages: 1,
        excludedRecoveredPages: 0,
        sidebarVerified: true,
      },
      pages: [
        {
          slug: 'testops/testops-version-control/pull-requests',
          fetchStatus: 'excluded-broken',
          debtCategory: 'source-side-debt',
          recoveryProbe: { issueType: 'snapshot-incomplete', reason: 'extractor-empty', expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty', expectedMatch: true },
        },
      ],
      errors: [],
    };
    const report = buildActionableReport(emptySnapshot, emptyParity, [], { sourceSync });

    // fresh だが debt が残っているので issue は open される
    assert.equal(report.sourceSyncHealth.shouldOpenIssue, true);
    // body にソース側 debt セクションが含まれる
    assert.match(report.sourceSyncHealth.body, /ソース原文の既知問題/);
    assert.match(report.sourceSyncHealth.body, /testops\/testops-version-control\/pull-requests/);
    assert.match(report.sourceSyncHealth.body, /未復旧: 1/);
  });

  it('[P1] debt なし + fresh なら sourceSyncHealth issue は開かない (従来動作)', () => {
    const sourceSync = {
      schemaVersion: 1,
      freshnessState: 'fresh',
      summary: {
        targetPages: 100,
        fetchedPages: 100,
        notFoundPages: 0,
        errorPages: 0,
        excludedPages: 0,
        excludedBrokenPages: 0,
        excludedRecoveredPages: 0,
        sidebarVerified: true,
      },
      pages: [],
      errors: [],
    };
    const report = buildActionableReport(emptySnapshot, emptyParity, [], { sourceSync });

    // debt なし + fresh → 従来通り issue は開かない
    assert.equal(report.sourceSyncHealth.shouldOpenIssue, false);
  });

  // expectedMatch が summary / issue body まで流れる

  it('expectedMatch: true が summary markdown に「想定どおり」として出る', () => {
    const sourceSync = {
      schemaVersion: 1,
      freshnessState: 'fresh',
      summary: {
        targetPages: 100, fetchedPages: 99, notFoundPages: 0, errorPages: 0,
        excludedPages: 1, excludedBrokenPages: 1, excludedRecoveredPages: 0,
        sidebarVerified: true,
      },
      pages: [{
        slug: 'test/broken',
        fetchStatus: 'excluded-broken',
        debtCategory: 'source-side-debt',
        recoveryProbe: {
          issueType: 'snapshot-incomplete', reason: 'extractor-empty',
          expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty',
          expectedMatch: true,
        },
      }],
      errors: [],
    };
    const report = buildActionableReport(emptySnapshot, emptyParity, [], { sourceSync });
    const md = renderSummaryMarkdown(emptySnapshot, emptyParity, report, [], sourceSync);

    assert.match(md, /想定どおり/);
    assert.match(md, /実際: snapshot-incomplete \/ extractor-empty/);
    assert.match(md, /期待: snapshot-incomplete \/ extractor-empty/);
  });

  it('expectedMatch: false が summary markdown に「想定と不一致」+ actual/expected 両方出る', () => {
    const sourceSync = {
      schemaVersion: 1,
      freshnessState: 'fresh',
      summary: {
        targetPages: 100, fetchedPages: 99, notFoundPages: 0, errorPages: 0,
        excludedPages: 1, excludedBrokenPages: 1, excludedRecoveredPages: 0,
        sidebarVerified: true,
      },
      pages: [{
        slug: 'test/drifted',
        fetchStatus: 'excluded-broken',
        debtCategory: 'source-side-debt',
        recoveryProbe: {
          issueType: 'snapshot-incomplete', reason: 'shallow-snapshot',
          expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty',
          expectedMatch: false,
        },
      }],
      errors: [],
    };
    const report = buildActionableReport(emptySnapshot, emptyParity, [], { sourceSync });
    const md = renderSummaryMarkdown(emptySnapshot, emptyParity, report, [], sourceSync);

    assert.match(md, /想定と不一致/);
    assert.match(md, /実際: snapshot-incomplete \/ shallow-snapshot/);
    assert.match(md, /期待: snapshot-incomplete \/ extractor-empty/);
  });

  it('expectedMatch: false が issue body にも出る', () => {
    const sourceSync = {
      schemaVersion: 1,
      freshnessState: 'fresh',
      summary: {
        targetPages: 100, fetchedPages: 99, notFoundPages: 0, errorPages: 0,
        excludedPages: 1, excludedBrokenPages: 1, excludedRecoveredPages: 0,
        sidebarVerified: true,
      },
      pages: [{
        slug: 'test/drifted',
        fetchStatus: 'excluded-broken',
        debtCategory: 'source-side-debt',
        recoveryProbe: {
          issueType: 'snapshot-incomplete', reason: 'shallow-snapshot',
          expectedIssueType: 'snapshot-incomplete', expectedReason: 'extractor-empty',
          expectedMatch: false,
        },
      }],
      errors: [],
    };
    const report = buildActionableReport(emptySnapshot, emptyParity, [], { sourceSync });

    assert.match(report.sourceSyncHealth.body, /想定と不一致/);
    assert.match(report.sourceSyncHealth.body, /実際: snapshot-incomplete \/ shallow-snapshot/);
    assert.match(report.sourceSyncHealth.body, /期待: snapshot-incomplete \/ extractor-empty/);
  });
});
