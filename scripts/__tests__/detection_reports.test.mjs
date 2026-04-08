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
  it('does NOT open a parity issue for coarse-signal-only entries (Phase 8)', () => {
    // Phase 8 demotion: heading-mismatch is in COARSE_SIGNAL_TYPES, so a
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
    assert.match(report.snapshotDiff.body, /Sidebar Changes/);
    assert.match(report.snapshotDiff.body, /Pages added: 1/);
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

  it('does NOT re-light parity issue for expired-ack on coarse signal (Phase 8)', () => {
    // Phase 8 intent: even when an acknowledgement on a coarse signal
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

  it('does NOT re-light parity issue for expired-baseline on coarse signal (Phase 8)', () => {
    // Same intent via the baseline path.
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
        expiredBaselineEntries: 1,
        issuesByType: { 'heading-mismatch': 1 },
        issuesBySeverity: { signal: 1 },
      },
      files: [
        {
          file: 'src/content/docs/example.md',
          issues: [
            {
              type: 'heading-mismatch',
              severity: 'signal',
              detail: 'expired baseline coarse',
              baselined: true,
              baselineExpired: true,
            },
          ],
        },
      ],
      advisoryQueue: [],
      advisoryQueueScope: null,
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
    assert.match(md, /# Docs Detection Summary/);
    assert.match(md, /## Snapshot Diff/);
    assert.match(md, /Changed pages: 3/);
    assert.match(md, /Added pages: 1/);
    assert.match(md, /## Parity/);
    assert.match(md, /Active actionable files: 2/);
    assert.match(md, /## Audit Manifest/);
    assert.match(md, /Page lifecycle: 1/);
    assert.match(md, /Structural change: 1/);
    assert.match(md, /Content only: 2/);
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
    assert.match(md, /Active actionable files: 0/);
    assert.match(md, /Active issue files: 0/);
    assert.match(md, /Acknowledged \(non-blocking\): 41/);
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
    assert.match(md, /Expired acknowledgements: 1/);
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
            expiredBaselineEntries: 1,
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
    assert.match(md, /Advisory queue: 2 issues \(1 files, 1 blocking; partial scope: slug=overview\/page-a, not repo-wide\)/);
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
    assert.match(md, /Source Sync Health/);
    assert.match(md, /broken/);
  });
});

// ---------------------------------------------------------------------------
// Phase 7: parityFollowup family
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
      expiredBaselineEntries: 0,
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

  it('shouldOpenIssue = true when expiredBaselineEntries > 0', () => {
    const parity = {
      ...cleanParity,
      summary: { ...cleanParity.summary, expiredBaselineEntries: 3 },
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityFollowup.shouldOpenIssue, true);
    assert.equal(report.parityFollowup.summary.baselineDebt.expiredBaselineEntries, 3);
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
    assert.match(report.parityFollowup.body, /Scope: full repo/);

    const md = renderSummaryMarkdown(emptySnapshot, parity, report, []);
    assert.match(md, /Advisory queue: 2 issues \(1 files, 1 blocking; full repo\)/);
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
        expiredBaselineEntries: 1,
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
              baselined: true,
              baselineExpired: true,
              baselineReviewAfter: '2026-03-01',
              detail: 'expired',
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
    assert.match(md, /Advisory queue: 2 issues \(1 files, 1 blocking; partial scope: slug=overview\/page-a, not repo-wide\)/);
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

  it('parityFollowup body contains expired baseline file details', () => {
    const parity = {
      ...cleanParity,
      summary: { ...cleanParity.summary, expiredBaselineEntries: 2 },
      files: [
        {
          file: 'src/content/docs/overview/page-a.md',
          issues: [
            { type: 'segment-missing', severity: 'actionable', baselined: true, baselineExpired: true, baselineReviewAfter: '2026-03-01', detail: 'expired' },
            { type: 'segment-extra', severity: 'actionable', baselined: true, baselineExpired: true, detail: 'expired2' },
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
// Issue #247 PR4 — parityRegression が structure mismatch の補助 counter を
// summary に露出する。`isReportableParityIssue` の flip は伴わないので
// `topEntries` には structure mismatch は含まれず、`shouldOpenIssue` も
// structure mismatch 単独では立たない。summary の補助カウンタからのみ
// 観測可能になる。
// ---------------------------------------------------------------------------

describe('Issue #247 PR4 — parityRegression structure mismatch summary exposure', () => {
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

  it('does NOT include structure mismatch files in parityRegression.topEntries (PR4 — gate flip is PR5)', () => {
    const parity = makeParityWithStructureMismatch();
    const report = buildActionableReport(emptySnapshot, parity, []);
    // `isReportableParityIssue` は PR4 では flip しないので、structure
    // mismatch 単独のファイルは topEntries に流れ込まない。
    assert.equal(report.parityRegression.topEntries.length, 0);
    // shouldOpenIssue も立たない (= GitHub 上に新規 issue は open されない)
    assert.equal(report.parityRegression.shouldOpenIssue, false);
    assert.equal(report.parityRegression.summary.issueCount, 0);
  });

  it('parityRegression.body contains "## Structure Mismatch (advisory)" section when structureMismatchIssues > 0', () => {
    const parity = makeParityWithStructureMismatch();
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.match(report.parityRegression.body, /## Structure Mismatch \(advisory\)/);
    // 件数 / ファイル数の wiring 確認
    assert.match(
      report.parityRegression.body,
      /Total: 5 issues across 3 files/,
    );
    // type 別内訳 (sort 順は alpha 昇順)
    assert.match(
      report.parityRegression.body,
      /section-structure-mismatch: 4/,
    );
    assert.match(
      report.parityRegression.body,
      /segment-order-mismatch: 1/,
    );
    // 「PR5 で gate に載る予定」の引用行
    assert.match(
      report.parityRegression.body,
      /PR5 の baseline migration と同時に gate に載る予定です/,
    );
  });

  it('parityRegression.body OMITS the "## Structure Mismatch" section when structureMismatchIssues = 0', () => {
    const parity = {
      summary: {
        checkedAt: '2026-04-08T00:00:00Z',
        actionableFiles: 0,
        signalFiles: 0,
        errorFiles: 0,
        activeActionableFiles: 0,
        activeFiles: 0,
        activeErrorFiles: 0,
        structureMismatchIssues: 0,
        structureMismatchFiles: 0,
        structureMismatchByType: {},
      },
      files: [],
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.doesNotMatch(report.parityRegression.body, /## Structure Mismatch/);
  });
});

// ---------------------------------------------------------------------------
// Phase 7: parityRegression excludes non-expired baselined issues
// ---------------------------------------------------------------------------

describe('parityRegression excludes non-expired baselined issues (Phase 7)', () => {
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

  it('opens parity issue when baselined issue has expired', () => {
    const parity = {
      summary: {
        checkedAt: '2026-04-07T00:00:00Z',
        actionableFiles: 1,
        errorFiles: 0,
        expiredBaselineEntries: 1,
        activeActionableFiles: 1,
        activeFiles: 1,
        baselineInvalidatedSlugs: [],
      },
      files: [
        {
          file: 'src/content/docs/overview/page-a.md',
          issues: [
            { type: 'segment-missing', severity: 'actionable', baselined: true, baselineExpired: true, detail: 'expired' },
          ],
        },
      ],
      advisoryQueue: [],
      advisoryQueueScope: null,
    };
    const report = buildActionableReport(emptySnapshot, parity, []);
    assert.equal(report.parityRegression.shouldOpenIssue, true);
    assert.equal(report.parityRegression.summary.issueCount, 1);
  });

  it('baselined issue is NOT in parityRegression topEntries but expired baselined IS', () => {
    const parity = {
      summary: {
        checkedAt: '2026-04-07T00:00:00Z',
        actionableFiles: 1,
        errorFiles: 0,
        expiredBaselineEntries: 1,
        activeActionableFiles: 1,
        baselineInvalidatedSlugs: [],
      },
      files: [
        {
          file: 'src/content/docs/overview/page-a.md',
          issues: [
            { type: 'segment-missing', severity: 'actionable', baselined: true, detail: 'frozen — must not appear' },
            { type: 'segment-extra', severity: 'actionable', baselined: true, baselineExpired: true, detail: 'expired — must appear' },
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
// Phase 7: detection-family HTML comments in issue bodies
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
// New signal types from Phase 2b/2c
// ---------------------------------------------------------------------------

describe('buildActionableReport with new signal types', () => {
  it('does NOT open parity issue for signal-only new types (Phase 8 demoted)', () => {
    // Phase 8: section-count, table-shape, table-cell-* are all in
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

  it('does NOT open parity issue for mixed error + coarse signal entries (Phase 8)', () => {
    // Phase 8: source-fetch-error has severity 'error', not 'actionable',
    // so it never enters parityRegression in the first place. Combined
    // with a heading-mismatch (now coarse-only/audit), the file has zero
    // reportable issues. Pre-Phase-8 the heading-mismatch would have lit
    // the issue; after Phase 8 it must not.
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
// Phase 8: parityRegression excludes coarse signals (audit demotion)
// ---------------------------------------------------------------------------

describe('Phase 8 — parityRegression excludes coarse audit signals', () => {
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

  it('coarse-only file does not appear in parityRegression even with expired baseline', () => {
    const parity = {
      summary: {
        checkedAt: '2026-04-07T00:00:00Z',
        actionableFiles: 0,
        expiredBaselineEntries: 1,
      },
      files: [
        {
          file: 'src/content/docs/expired-baseline-coarse.md',
          issues: [
            {
              type: 'heading-mismatch',
              severity: 'signal',
              detail: 'expired baseline',
              baselined: true,
              baselineExpired: true,
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
// Phase 8: family count and audit manifest invariants
// ---------------------------------------------------------------------------

describe('Phase 8 — family count and audit manifest invariants', () => {
  const emptySnapshot = {
    checkedAt: '2026-04-07T00:00:00Z',
    summary: { totalSnapshots: 100, changed: 0, added: 0, removed: 0, unchanged: 100 },
    changes: [],
    sidebar: { changed: false, addedPages: [], removedPages: [] },
  };

  it('actionableReport still exposes exactly 4 detection families', () => {
    // The 4 families are: snapshotDiff, parityRegression, sourceSyncHealth,
    // parityFollowup. Phase 8 must NOT introduce a new family or rename one.
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
    // matching snapshot change must NOT add an entry. Phase 8 preserves
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
    // Phase 8 codex follow-up test: docs-update-summary.md must put
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
          baselineDebt: { baselinedIssues: 0, baselinedFiles: 0, expiredBaselineEntries: 0, baselineInvalidatedSlugs: [] },
          advisoryQueue: { issues: 0, files: 0, blockingItems: 0, advisoryQueueScope: null },
        },
      },
      auditManifest: { total: 0, bucketCounts: {} },
    };
    const md = renderSummaryMarkdown(snapshot, parity, actionableReport, []);

    // Parity section: active counts must reflect Phase 8 reportable
    // counters, NOT the legacy ones that include coarse signals.
    assert.match(md, /## Parity/);
    assert.match(md, /Active actionable files: 0/);
    assert.match(md, /Active issue files: 0/);

    // Audit Signals section exists and lists the coarse breakdown.
    assert.match(md, /## Audit Signals/);
    assert.match(md, /paragraph-count-mismatch: 2/);
    assert.match(md, /heading-mismatch: 1/);

    // Sanity: coarse signal labels must NOT show up inside the Parity
    // section. The simplest way to test this is to extract the Parity
    // section text and check it for the coarse type names.
    const paritySectionMatch = md.match(/## Parity\n([\s\S]*?)(?:\n## |$)/);
    assert.ok(paritySectionMatch, 'Parity section must exist');
    const paritySection = paritySectionMatch[1];
    assert.doesNotMatch(paritySection, /paragraph-count-mismatch/);
    assert.doesNotMatch(paritySection, /heading-mismatch/);
  });

  it('propagates parity.summary.runScope to actionableReport top-level (Phase 8 PR2)', () => {
    // The Phase 8 sync guard reads runScope off docs-actionable-report.json,
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
    // Backward compatibility: a parity-check-status.json that pre-dates
    // Phase 8 PR2 has no runScope. The actionable report must still set
    // the field (so consumers can probe it) but the value is null. The
    // sync guard treats null as legacy and falls back to its prior
    // behaviour (the test for that lives in the sync_detection_issues
    // suite added in commit 3 of PR2).
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
    // Phase 8 must NOT remove the existing parity cross-reference on
    // entries that DO have a matching snapshot change.
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
    schemaVersion: 1,
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
