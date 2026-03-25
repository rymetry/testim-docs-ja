import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let buildActionableReport;
let buildAuditManifest;
let classifySnapshotBucket;
let assignReviewGroups;
let renderSummaryMarkdown;
let loadDetectionInputs;

before(async () => {
  ({
    buildActionableReport,
    buildAuditManifest,
    classifySnapshotBucket,
    assignReviewGroups,
    renderSummaryMarkdown,
    loadDetectionInputs,
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
        { slug: 'page-a', type: 'page-changed', sourceUrl: 'https://docs.tricentis.com/testim/content/overview/page-a.htm', categories: { heading: { added: 0, removed: 0 }, image: { added: 0, removed: 0 }, code: { added: 0, removed: 0 }, callout: { added: 0, removed: 0 }, content: { added: 1, removed: 0 } }, diffLines: 1 },
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
          slug: 'new-page',
          type: 'page-added',
          sourceUrl: 'https://docs.tricentis.com/testim/content/overview/new-page.htm',
          categories: null,
          diffLines: 0,
        },
        {
          slug: 'changed-heading',
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
          slug: 'text-tweak',
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

    const added = manifest.find((e) => e.slug === 'new-page');
    const structural = manifest.find((e) => e.slug === 'changed-heading');
    const contentOnly = manifest.find((e) => e.slug === 'text-tweak');

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
  it('does not open a parity issue for heading-only signal entries', () => {
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
      summary: { actionableFiles: 2, signalFiles: 1, errorFiles: 0 },
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
    assert.match(md, /Actionable files: 2/);
    assert.match(md, /## Audit Manifest/);
    assert.match(md, /Page lifecycle: 1/);
    assert.match(md, /Structural change: 1/);
    assert.match(md, /Content only: 2/);
    assert.match(md, /snapshot-diff-status\.json/);
  });
});

describe('loadDetectionInputs', () => {
  it('returns empty objects when files do not exist', () => {
    const result = loadDetectionInputs({
      snapshotPath: '/nonexistent/snapshot.json',
      parityPath: '/nonexistent/parity.json',
    });
    assert.deepEqual(result.snapshot, {});
    assert.deepEqual(result.parity, {});
  });
});

// ---------------------------------------------------------------------------
// New signal types from Phase 2b/2c
// ---------------------------------------------------------------------------

describe('buildActionableReport with new signal types', () => {
  it('does not open parity issue for signal-only new types', () => {
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
  });
});
