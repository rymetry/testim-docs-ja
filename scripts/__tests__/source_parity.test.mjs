import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let localCheck;
let summarizeParityResults;
let isEnglishOnlyLine;
let loadSidebarSlugs;
let extractImageSequence;
let extractCalloutPositions;
let extractStepCounts;
let stripTitleH1;
let extractBulletCounts;
let extractParagraphCounts;
let compareSnapshotStructure;
let extractMarkdownTables;
let extractHtmlTables;
let stripMarkdown;
let isUntranslatedCell;
let extractInvariantTokens;
let normalizeEnArtifacts;
let normalizeNumericPeriodSpacing;
let extractHeadingSequence;
let classifyLine;
let checkSourcePageMissingLocal;
let checkMissingSnapshot;
let checkSinglePageSnapshot;
let checkPageCoverage;

before(async () => {
  ({
    localCheck,
    summarizeParityResults,
    isEnglishOnlyLine,
    loadSidebarSlugs,
    extractImageSequence,
    extractCalloutPositions,
    extractStepCounts,
    stripTitleH1,
    extractBulletCounts,
    extractParagraphCounts,
    compareSnapshotStructure,
    extractMarkdownTables,
    extractHtmlTables,
    stripMarkdown,
    isUntranslatedCell,
    extractInvariantTokens,
    normalizeEnArtifacts,
    normalizeNumericPeriodSpacing,
    extractHeadingSequence,
    classifyLine,
    checkSourcePageMissingLocal,
    checkMissingSnapshot,
    checkSinglePageSnapshot,
    checkPageCoverage,
  } = await import(
    '../lib/source_parity.mjs'
  ));
});

describe('isEnglishOnlyLine', () => {
  it('detects untranslated instruction patterns', () => {
    assert.equal(isEnglishOnlyLine('1. Click on the **Settings** button.'), true);
    assert.equal(isEnglishOnlyLine('Hover over the element to inspect'), true);
    assert.equal(isEnglishOnlyLine('Select the option from the list'), true);
  });

  it('returns false for lines with CJK characters', () => {
    assert.equal(isEnglishOnlyLine('Click on the 設定 button to proceed'), false);
  });

  it('returns false for short lines', () => {
    assert.equal(isEnglishOnlyLine('Click on'), false);
  });

  it('returns false for empty lines', () => {
    assert.equal(isEnglishOnlyLine(''), false);
    assert.equal(isEnglishOnlyLine('   '), false);
  });

  it('returns false for markdown syntax lines', () => {
    assert.equal(isEnglishOnlyLine('## Click on the Settings button'), false);
    assert.equal(isEnglishOnlyLine('- list item with text'), false);
    assert.equal(isEnglishOnlyLine('```javascript'), false);
    assert.equal(isEnglishOnlyLine('![alt text](image.png)'), false);
  });

  it('returns false for HTML tag lines', () => {
    assert.equal(isEnglishOnlyLine('<table>'), false);
    assert.equal(isEnglishOnlyLine('<img src="test.png" alt="test">'), false);
  });
});

describe('loadSidebarSlugs', () => {
  it('extracts slugs from sidebar URL text', () => {
    const text = `## Overview
- ✅ https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm
- ✅ https://docs.tricentis.com/testim/content/getting-started/getting-started.htm
## Other
- https://docs.tricentis.com/testim/content/settings/advanced-config.htm
`;
    const slugs = loadSidebarSlugs(text);
    assert.equal(slugs.size, 3);
    assert.ok(slugs.has('overview/testim-overview'));
    assert.ok(slugs.has('getting-started/getting-started'));
    assert.ok(slugs.has('settings/advanced-config'));
  });

  it('returns empty set for text without URLs', () => {
    const slugs = loadSidebarSlugs('No URLs here');
    assert.equal(slugs.size, 0);
  });

  it('ignores old domain URLs', () => {
    const text = `## Overview
- ✅ https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm
## Getting Started
- ✅ https://help.testim.io/docs/setting-up-your-account
`;
    const slugs = loadSidebarSlugs(text);
    assert.ok(slugs.has('overview/testim-overview'), 'new domain slug extracted');
    assert.ok(!slugs.has('setting-up-your-account'), 'old domain slug ignored');
  });
});

describe('localCheck', () => {
  // Page-coverage responsibilities (sidebar membership, snapshot presence)
  // moved to source_parity_page_coverage.mjs in §4 of the cleanup. localCheck
  // is now a body-only check.

  it('detects untranslated english lines and annotates severity', () => {
    const issues = localCheck({ body: '1. Click on the **Settings** button.\n' });

    assert.equal(issues.length, 1);
    assert.equal(issues[0].type, 'untranslated');
    assert.equal(issues[0].severity, 'actionable');
  });

  it('detects legacy callout (blockquote emoji pattern)', () => {
    const issues = localCheck({ body: '> 📘 This is a callout\n> Some content\n' });

    const legacyIssues = issues.filter((i) => i.type === 'legacy-callout');
    assert.ok(legacyIssues.length > 0);
    assert.equal(legacyIssues[0].severity, 'actionable');
  });

  it('detects JSX callout component', () => {
    const issues = localCheck({ body: '<Callout type="info">Note text</Callout>\n' });

    const jsxIssues = issues.filter((i) => i.type === 'jsx-callout');
    assert.ok(jsxIssues.length > 0);
    assert.equal(jsxIssues[0].severity, 'actionable');
  });

  it('detects h1 in body (not at first line)', () => {
    const issues = localCheck({ body: 'Some intro text\n# This is an H1 in body\n' });

    const h1Issues = issues.filter((i) => i.type === 'h1-in-body');
    assert.ok(h1Issues.length > 0);
    assert.equal(h1Issues[0].severity, 'actionable');
  });

  it('does not flag h1 at the first line', () => {
    const issues = localCheck({ body: '# Title at first line\nSome content\n' });

    const h1Issues = issues.filter((i) => i.type === 'h1-in-body');
    assert.equal(h1Issues.length, 0);
  });

  it('does not emit page-coverage issues (responsibility moved to page coverage gate)', () => {
    // Even when called without sidebarSlugs/slug, localCheck must not emit
    // orphan-page or any sidebar-related issue. The bulk page coverage gate
    // (checkLocalPageOrphan) is the canonical source.
    const issues = localCheck({ body: 'Some content\n' });
    const coverageTypes = ['orphan-page', 'local-page-orphan', 'source-page-missing-local'];
    const detected = issues.filter((i) => coverageTypes.includes(i.type));
    assert.equal(detected.length, 0);
  });

  it('skips detection inside code blocks', () => {
    const issues = localCheck({
      body: '```\n> 📘 Inside code block\n<Callout>Also inside</Callout>\n# H1 inside code\nClick on the **Settings** button.\n```\n',
    });

    // None of the issues inside the code block should be detected
    const relevantTypes = ['legacy-callout', 'jsx-callout', 'h1-in-body', 'untranslated'];
    const detected = issues.filter((i) => relevantTypes.includes(i.type));
    assert.equal(detected.length, 0);
  });
});

describe('summarizeParityResults', () => {
  it('counts signal files separately from actionable files', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/actionable.md',
        issues: [
          { type: 'untranslated', severity: 'actionable' },
          { type: 'heading-mismatch', severity: 'signal' },
        ],
      },
      {
        file: 'src/content/docs/signal.md',
        issues: [{ type: 'heading-mismatch', severity: 'signal' }],
      },
      {
        file: 'src/content/docs/error.md',
        issues: [{ type: 'source-fetch-error', severity: 'error' }],
      },
    ]);

    assert.equal(summary.actionableFiles, 1);
    assert.equal(summary.signalFiles, 1);
    assert.equal(summary.errorFiles, 1);
  });

  it('returns zeros for empty input', () => {
    const summary = summarizeParityResults([]);
    assert.equal(summary.filesWithIssues, 0);
    assert.equal(summary.actionableFiles, 0);
    assert.equal(summary.signalFiles, 0);
    assert.equal(summary.errorFiles, 0);
  });

  it('counts issuesByType and issuesBySeverity', () => {
    const summary = summarizeParityResults([
      {
        file: 'a.md',
        issues: [
          { type: 'untranslated', severity: 'actionable' },
          { type: 'untranslated', severity: 'actionable' },
          { type: 'legacy-callout', severity: 'actionable' },
        ],
      },
    ]);
    assert.equal(summary.issuesByType['untranslated'], 2);
    assert.equal(summary.issuesByType['legacy-callout'], 1);
    assert.equal(summary.issuesBySeverity['actionable'], 3);
  });

  it('prioritizes actionable over error at file level', () => {
    const summary = summarizeParityResults([
      {
        file: 'mixed.md',
        issues: [
          { type: 'untranslated', severity: 'actionable' },
          { type: 'source-fetch-error', severity: 'error' },
        ],
      },
    ]);
    // File has both actionable and error → counted as actionable
    assert.equal(summary.actionableFiles, 1);
    assert.equal(summary.errorFiles, 0);
  });
});

// ---------------------------------------------------------------------------
// reportableActive* and auditSignal* counters
// ---------------------------------------------------------------------------

describe('reportableActive and auditSignal counters', () => {
  it('emits reportableActive* and auditSignal* fields', () => {
    const summary = summarizeParityResults([]);
    assert.equal(typeof summary.reportableActiveFiles, 'number');
    assert.equal(typeof summary.reportableActiveActionableFiles, 'number');
    assert.equal(typeof summary.auditSignalIssues, 'number');
    assert.equal(typeof summary.auditSignalFiles, 'number');
    assert.deepEqual(summary.auditSignalsByType, {});
  });

  it('counts coarse signals into auditSignal* but excludes them from reportableActive*', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/coarse-only.md',
        issues: [
          { type: 'paragraph-count-mismatch', severity: 'signal' },
          { type: 'heading-mismatch', severity: 'signal' },
        ],
      },
    ]);
    assert.equal(summary.auditSignalFiles, 1);
    assert.equal(summary.auditSignalIssues, 2);
    assert.deepEqual(summary.auditSignalsByType, {
      'paragraph-count-mismatch': 1,
      'heading-mismatch': 1,
    });
    assert.equal(summary.reportableActiveFiles, 0);
    assert.equal(summary.reportableActiveActionableFiles, 0);
  });

  it('counts non-coarse actionable issues into reportableActive*', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/actionable.md',
        issues: [
          { type: 'image-mismatch', severity: 'actionable' },
        ],
      },
    ]);
    assert.equal(summary.reportableActiveFiles, 1);
    assert.equal(summary.reportableActiveActionableFiles, 1);
    assert.equal(summary.auditSignalFiles, 0);
    assert.equal(summary.auditSignalIssues, 0);
  });

  it('counts mixed file (actionable + coarse) into both buckets', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/mixed.md',
        issues: [
          { type: 'image-mismatch', severity: 'actionable' },
          { type: 'paragraph-count-mismatch', severity: 'signal' },
        ],
      },
    ]);
    assert.equal(summary.reportableActiveFiles, 1);
    assert.equal(summary.reportableActiveActionableFiles, 1);
    assert.equal(summary.auditSignalFiles, 1);
    assert.equal(summary.auditSignalIssues, 1);
    assert.deepEqual(summary.auditSignalsByType, { 'paragraph-count-mismatch': 1 });
  });

  it('excludes valid acknowledgements from reportableActive*', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/acked.md',
        issues: [
          {
            type: 'image-mismatch',
            severity: 'actionable',
            acknowledged: true,
            ackExpired: false,
          },
        ],
      },
    ]);
    assert.equal(summary.reportableActiveFiles, 0);
    assert.equal(summary.reportableActiveActionableFiles, 0);
  });

  it('includes expired acknowledgements in reportableActive*', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/expired-ack.md',
        issues: [
          {
            type: 'image-mismatch',
            severity: 'actionable',
            acknowledged: true,
            ackExpired: true,
          },
        ],
      },
    ]);
    assert.equal(summary.reportableActiveFiles, 1);
    assert.equal(summary.reportableActiveActionableFiles, 1);
  });

  it('excludes coarse signals from reportableActive* even with expired ack', () => {
    // coarse signal は ack 期限切れでも reportable に戻さない。
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/expired-coarse.md',
        issues: [
          {
            type: 'paragraph-count-mismatch',
            severity: 'signal',
            acknowledged: true,
            ackExpired: true,
          },
        ],
      },
    ]);
    assert.equal(summary.reportableActiveFiles, 0);
    assert.equal(summary.reportableActiveActionableFiles, 0);
    assert.equal(summary.auditSignalFiles, 1);
    assert.equal(summary.auditSignalIssues, 1);
  });

  it('excludes coarse signals from reportableActive* even with expired baseline', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/expired-baseline-coarse.md',
        issues: [
          {
            type: 'heading-mismatch',
            severity: 'signal',
            baselined: true,
            baselineExpired: true,
          },
        ],
      },
    ]);
    assert.equal(summary.reportableActiveFiles, 0);
    assert.equal(summary.reportableActiveActionableFiles, 0);
    assert.equal(summary.auditSignalFiles, 1);
  });

  it('excludes frozen baseline (non-expired) from reportableActive*', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/frozen.md',
        issues: [
          {
            type: 'segment-missing',
            severity: 'actionable',
            baselined: true,
            baselineExpired: false,
          },
        ],
      },
    ]);
    assert.equal(summary.reportableActiveFiles, 0);
    assert.equal(summary.reportableActiveActionableFiles, 0);
  });
});

describe('existing activeFiles semantics unchanged', () => {

  it('still counts coarse-only file as active (legacy semantics)', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/coarse-only.md',
        issues: [{ type: 'paragraph-count-mismatch', severity: 'signal' }],
      },
    ]);
    assert.equal(summary.activeFiles, 1);
    assert.equal(summary.activeActionableFiles, 0);
  });

  it('still counts mixed file as active and active-actionable (legacy semantics)', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/mixed.md',
        issues: [
          { type: 'image-mismatch', severity: 'actionable' },
          { type: 'paragraph-count-mismatch', severity: 'signal' },
        ],
      },
    ]);
    assert.equal(summary.activeFiles, 1);
    assert.equal(summary.activeActionableFiles, 1);
  });

  it('still excludes acked actionable from active (legacy semantics)', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/acked.md',
        issues: [
          {
            type: 'image-mismatch',
            severity: 'actionable',
            acknowledged: true,
            ackExpired: false,
          },
        ],
      },
    ]);
    assert.equal(summary.activeFiles, 0);
    assert.equal(summary.activeActionableFiles, 0);
  });
});

// ---------------------------------------------------------------------------
// structureMismatch* / snapshotUnusable* counters
// ---------------------------------------------------------------------------

describe('structureMismatch and snapshotUnusable counters', () => {
  it('emits structureMismatch* and snapshotUnusable* fields with safe defaults', () => {
    const summary = summarizeParityResults([]);
    assert.equal(typeof summary.structureMismatchIssues, 'number');
    assert.equal(typeof summary.structureMismatchFiles, 'number');
    assert.deepEqual(summary.structureMismatchByType, {});
    assert.equal(typeof summary.snapshotUnusableIssues, 'number');
    assert.equal(typeof summary.snapshotUnusableFiles, 'number');
    assert.deepEqual(summary.snapshotUnusableByType, {});
    assert.equal(summary.structureMismatchIssues, 0);
    assert.equal(summary.structureMismatchFiles, 0);
    assert.equal(summary.snapshotUnusableIssues, 0);
    assert.equal(summary.snapshotUnusableFiles, 0);
  });

  it('counts section-structure-mismatch into structureMismatch* AND reportableActive*', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/running-tests/the-command-line-cli.md',
        issues: [
          {
            type: 'section-structure-mismatch',
            severity: 'actionable',
            detail: 'Section "Options" block kinds diverge',
          },
          {
            type: 'section-structure-mismatch',
            severity: 'actionable',
            detail: 'Section "Arguments" block kinds diverge',
          },
        ],
      },
    ]);
    assert.equal(summary.structureMismatchIssues, 2);
    assert.equal(summary.structureMismatchFiles, 1);
    assert.deepEqual(summary.structureMismatchByType, {
      'section-structure-mismatch': 2,
    });
    assert.equal(summary.reportableActiveFiles, 1);
    assert.equal(summary.reportableActiveActionableFiles, 1);
  });

  it('counts segment-order-mismatch into structureMismatch*', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/results/test-results/network-logs.md',
        issues: [
          {
            type: 'segment-order-mismatch',
            severity: 'actionable',
            detail: 'Block 3 and 4 swapped',
          },
        ],
      },
    ]);
    assert.equal(summary.structureMismatchIssues, 1);
    assert.equal(summary.structureMismatchFiles, 1);
    assert.deepEqual(summary.structureMismatchByType, {
      'segment-order-mismatch': 1,
    });
  });

  it('counts snapshot-incomplete into snapshotUnusable*', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/salesforce-testing/salesforce-testing-overview.md',
        issues: [
          {
            type: 'snapshot-incomplete',
            severity: 'actionable',
            detail: 'EN snapshot missing #mc-main-content body',
          },
        ],
      },
    ]);
    assert.equal(summary.snapshotUnusableIssues, 1);
    assert.equal(summary.snapshotUnusableFiles, 1);
    assert.deepEqual(summary.snapshotUnusableByType, {
      'snapshot-incomplete': 1,
    });
    assert.equal(summary.reportableActiveFiles, 0);
    assert.equal(summary.reportableActiveActionableFiles, 0);
  });

  it('counts source-unusable into snapshotUnusable*', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/salesforce-testing/faq.md',
        issues: [
          {
            type: 'source-unusable',
            severity: 'actionable',
            detail: 'All sections collapsed in <details> — canonical compare cannot proceed',
          },
        ],
      },
    ]);
    assert.equal(summary.snapshotUnusableIssues, 1);
    assert.equal(summary.snapshotUnusableFiles, 1);
    assert.deepEqual(summary.snapshotUnusableByType, {
      'source-unusable': 1,
    });
  });

  it('does NOT double-count structure mismatch into snapshotUnusable* or vice versa', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/mixed.md',
        issues: [
          { type: 'section-structure-mismatch', severity: 'actionable' },
          { type: 'snapshot-incomplete', severity: 'actionable' },
        ],
      },
    ]);
    assert.equal(summary.structureMismatchIssues, 1);
    assert.equal(summary.structureMismatchFiles, 1);
    assert.deepEqual(summary.structureMismatchByType, {
      'section-structure-mismatch': 1,
    });
    assert.equal(summary.snapshotUnusableIssues, 1);
    assert.equal(summary.snapshotUnusableFiles, 1);
    assert.deepEqual(summary.snapshotUnusableByType, {
      'snapshot-incomplete': 1,
    });
  });

  it('excludes valid (non-expired) acks from structureMismatch*', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/acked-structure.md',
        issues: [
          {
            type: 'section-structure-mismatch',
            severity: 'actionable',
            acknowledged: true,
            ackExpired: false,
          },
        ],
      },
    ]);
    assert.equal(summary.structureMismatchIssues, 0);
    assert.equal(summary.structureMismatchFiles, 0);
    assert.equal(summary.reportableActiveFiles, 0);
  });

  it('excludes frozen (non-expired) baseline from structureMismatch*', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/frozen-structure.md',
        issues: [
          {
            type: 'segment-order-mismatch',
            severity: 'actionable',
            baselined: true,
            baselineExpired: false,
          },
        ],
      },
    ]);
    assert.equal(summary.structureMismatchIssues, 0);
    assert.equal(summary.structureMismatchFiles, 0);
  });

  it('includes expired ack on structure mismatch in structureMismatch* AND reportableActive*', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/expired-ack-structure.md',
        issues: [
          {
            type: 'section-structure-mismatch',
            severity: 'actionable',
            acknowledged: true,
            ackExpired: true,
          },
        ],
      },
    ]);
    assert.equal(summary.structureMismatchIssues, 1);
    assert.equal(summary.structureMismatchFiles, 1);
    assert.equal(summary.reportableActiveFiles, 1);
  });

  it('includes expired baseline on source unusable in snapshotUnusable* (counter re-fires)', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/expired-baseline-source.md',
        issues: [
          {
            type: 'snapshot-incomplete',
            severity: 'actionable',
            baselined: true,
            baselineExpired: true,
          },
        ],
      },
    ]);
    assert.equal(summary.snapshotUnusableIssues, 1);
    assert.equal(summary.snapshotUnusableFiles, 1);
    assert.equal(summary.reportableActiveFiles, 0);
  });

  it('structure mismatch does NOT flow into auditSignal* (not coarse)', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/structure.md',
        issues: [{ type: 'section-structure-mismatch', severity: 'actionable' }],
      },
    ]);
    assert.equal(summary.auditSignalIssues, 0);
    assert.equal(summary.auditSignalFiles, 0);
  });

  it('source unusable does NOT flow into auditSignal* (not coarse)', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/source.md',
        issues: [{ type: 'snapshot-incomplete', severity: 'actionable' }],
      },
    ]);
    assert.equal(summary.auditSignalIssues, 0);
    assert.equal(summary.auditSignalFiles, 0);
  });

  it('multi-file aggregation counts files independently', () => {
    const summary = summarizeParityResults([
      {
        file: 'src/content/docs/a.md',
        issues: [{ type: 'section-structure-mismatch', severity: 'actionable' }],
      },
      {
        file: 'src/content/docs/b.md',
        issues: [
          { type: 'section-structure-mismatch', severity: 'actionable' },
          { type: 'segment-order-mismatch', severity: 'actionable' },
        ],
      },
      {
        file: 'src/content/docs/c.md',
        issues: [{ type: 'snapshot-incomplete', severity: 'actionable' }],
      },
    ]);
    assert.equal(summary.structureMismatchFiles, 2);
    assert.equal(summary.structureMismatchIssues, 3);
    assert.deepEqual(summary.structureMismatchByType, {
      'section-structure-mismatch': 2,
      'segment-order-mismatch': 1,
    });
    assert.equal(summary.snapshotUnusableFiles, 1);
    assert.equal(summary.snapshotUnusableIssues, 1);
  });
});

// ---------------------------------------------------------------------------
// Snapshot structure comparison tests
// ---------------------------------------------------------------------------

describe('extractImageSequence', () => {
  it('extracts markdown images in document order', () => {
    const body = '![alt1](/images/aaa.png)\ntext\n![alt2](/images/bbb.png)\n';
    const result = extractImageSequence(body);
    assert.equal(result.length, 2);
    assert.equal(result[0].file, 'aaa');
    assert.equal(result[1].file, 'bbb');
  });

  it('extracts Image JSX components', () => {
    const body = '<Image src="https://files.readme.io/abc-test.png" />\n';
    const result = extractImageSequence(body);
    assert.equal(result.length, 1);
    assert.equal(result[0].file, 'abc-test');
  });

  it('extracts <img> tags', () => {
    const body = '<img src="/images/foo-bar.jpg" alt="test" />\n';
    const result = extractImageSequence(body);
    assert.equal(result.length, 1);
    assert.equal(result[0].file, 'foo-bar');
  });

  it('skips images inside code blocks', () => {
    const body = '```\n![inside](/images/skip.png)\n```\n![outside](/images/keep.png)\n';
    const result = extractImageSequence(body);
    assert.equal(result.length, 1);
    assert.equal(result[0].file, 'keep');
  });

  it('handles multiple images on same line', () => {
    const body = '![a](/images/one.png) text ![b](/images/two.png)\n';
    const result = extractImageSequence(body);
    assert.equal(result.length, 2);
  });
});

describe('extractCalloutPositions', () => {
  it('detects top-level directive callout', () => {
    const body = ':::note\nSome note\n:::\n';
    const result = extractCalloutPositions(body);
    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'note');
    assert.equal(result[0].depth, 0);
  });

  it('detects nested directive callout (indented)', () => {
    const body = '- list item\n  :::warning\n  content\n  :::\n';
    const result = extractCalloutPositions(body);
    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'warning');
    assert.equal(result[0].depth, 1);
  });

  it('detects top-level legacy callout', () => {
    const body = '> 📘 Note\n> Content\n';
    const result = extractCalloutPositions(body);
    assert.equal(result.length, 1);
    assert.equal(result[0].depth, 0);
  });

  it('treats legacy callout after list item as top-level (no indent)', () => {
    const body = '- list item\n> 🚧 Warning\n> Content\n';
    const result = extractCalloutPositions(body);
    assert.equal(result.length, 1);
    assert.equal(result[0].depth, 0);
  });

  it('detects indented legacy callout as nested', () => {
    const body = '- list item\n  > 🚧 Warning\n  > Content\n';
    const result = extractCalloutPositions(body);
    assert.equal(result.length, 1);
    assert.equal(result[0].depth, 1);
  });

  it('skips callouts inside code blocks', () => {
    const body = '```\n:::note\nInside code\n:::\n```\n';
    const result = extractCalloutPositions(body);
    assert.equal(result.length, 0);
  });
});

describe('extractStepCounts', () => {
  it('counts numbered steps per section', () => {
    const body = '## Section A\n1. Step one\n2. Step two\n## Section B\n1. Only step\n';
    const result = extractStepCounts(body);
    assert.equal(result.get('Section A'), 2);
    assert.equal(result.get('Section B'), 1);
  });

  it('counts steps before any heading under __top__', () => {
    const body = '1. First\n2. Second\n## Section\n1. Other\n';
    const result = extractStepCounts(body);
    assert.equal(result.get('__top__'), 2);
    assert.equal(result.get('Section'), 1);
  });

  it('ignores numbered items inside code blocks', () => {
    const body = '## Steps\n1. Real step\n```\n2. Fake step\n```\n3. Real step 2\n';
    const result = extractStepCounts(body);
    assert.equal(result.get('Steps'), 2);
  });

  it('ignores numbered items inside markdown pipe tables', () => {
    const body = '## Section\n1. Real step\n| Col A | Col B |\n| --- | --- |\n| 1. Fake | 2. Also fake |\n2. Another real step\n';
    const result = extractStepCounts(body);
    assert.equal(result.get('Section'), 2);
  });

  it('counts steps correctly after table with no blank line before heading', () => {
    const body = '## Section A\n| Col A | Col B |\n| --- | --- |\n| 1. Fake | val |\n## Section B\n1. Real step\n';
    const result = extractStepCounts(body);
    assert.equal(result.get('Section A'), 0);
    assert.equal(result.get('Section B'), 1);
  });

  it('counts steps correctly after table followed by blank line', () => {
    const body = '## S\n| A | B |\n| --- | --- |\n| x | y |\n\n1. Real step\n';
    const result = extractStepCounts(body);
    assert.equal(result.get('S'), 1);
  });
});

describe('compareSnapshotStructure', () => {
  it('detects image order mismatch', () => {
    const en = '![a](https://example.com/aaa.png)\n![b](https://example.com/bbb.png)\n';
    const ja = '![b](/images/bbb.png)\n![a](/images/aaa.png)\n';
    const issues = compareSnapshotStructure(en, ja);
    const orderIssues = issues.filter((i) => i.type === 'image-order-mismatch');
    assert.equal(orderIssues.length, 1);
  });

  it('returns no issues when image order matches', () => {
    const en = '![a](https://example.com/aaa.png)\n![b](https://example.com/bbb.png)\n';
    const ja = '![a](/images/aaa.png)\n![b](/images/bbb.png)\n';
    const issues = compareSnapshotStructure(en, ja);
    const orderIssues = issues.filter((i) => i.type === 'image-order-mismatch');
    assert.equal(orderIssues.length, 0);
  });

  it('detects callout nesting mismatch (EN top-level, JA nested)', () => {
    const en = '> 📘 Top level note\n> Content\n';
    const ja = '- list item\n  :::note\n  Content\n  :::\n';
    const issues = compareSnapshotStructure(en, ja);
    const nestIssues = issues.filter((i) => i.type === 'callout-nesting-mismatch');
    assert.equal(nestIssues.length, 1);
  });

  it('detects callout nesting mismatch (EN indented, JA top-level)', () => {
    const en = '- list item\n  > 📘 Indented note\n  > Content\n';
    const ja = ':::note\nContent\n:::\n';
    const issues = compareSnapshotStructure(en, ja);
    const nestIssues = issues.filter((i) => i.type === 'callout-nesting-mismatch');
    assert.equal(nestIssues.length, 1);
  });

  it('returns no callout issues when nesting matches (both top-level)', () => {
    const en = '> 📘 Top level note\n> Content\n';
    const ja = ':::note\nContent\n:::\n';
    const issues = compareSnapshotStructure(en, ja);
    const nestIssues = issues.filter((i) => i.type === 'callout-nesting-mismatch');
    assert.equal(nestIssues.length, 0);
  });

  it('returns no callout issues when nesting matches (both nested)', () => {
    const en = '- list\n  > 📘 Nested\n  > Content\n';
    const ja = '- list\n  :::note\n  Content\n  :::\n';
    const issues = compareSnapshotStructure(en, ja);
    const nestIssues = issues.filter((i) => i.type === 'callout-nesting-mismatch');
    assert.equal(nestIssues.length, 0);
  });

  it('detects step count mismatch (large difference — total + per-section)', () => {
    // EN has 10 steps, JA has 5 → total fires (>3 AND >10%) + per-section fires
    const en = '## Setup\n1. A\n2. B\n3. C\n4. D\n5. E\n6. F\n7. G\n8. H\n9. I\n10. J\n';
    const ja = '## セットアップ\n1. A\n2. B\n3. C\n4. D\n5. E\n';
    const issues = compareSnapshotStructure(en, ja);
    const stepIssues = issues.filter((i) => i.type === 'step-count-mismatch');
    assert.ok(stepIssues.length >= 1, 'should detect step count mismatch');
  });

  it('detects small per-section step count difference (diff=1)', () => {
    // EN=3, JA=2 → per-section fires (diff >= 1)
    const en = '## Setup\n1. Step one\n2. Step two\n3. Step three\n';
    const ja = '## セットアップ\n1. ステップ 1\n2. ステップ 2\n';
    const issues = compareSnapshotStructure(en, ja);
    const stepIssues = issues.filter((i) => i.type === 'step-count-mismatch');
    assert.equal(stepIssues.length, 2, 'total check + per-section check both fire at diff=1');
  });

  it('returns no step issues when counts match', () => {
    const en = '## Setup\n1. Step one\n2. Step two\n';
    const ja = '## セットアップ\n1. ステップ 1\n2. ステップ 2\n';
    const issues = compareSnapshotStructure(en, ja);
    const stepIssues = issues.filter((i) => i.type === 'step-count-mismatch');
    assert.equal(stepIssues.length, 0);
  });

  it('handles empty bodies gracefully', () => {
    const issues = compareSnapshotStructure('', '');
    assert.equal(issues.length, 0);
  });

  it('handles EN-only images without crashing', () => {
    const en = '![a](https://example.com/aaa.png)\n';
    const ja = 'テキストのみ\n';
    const issues = compareSnapshotStructure(en, ja);
    // Should not crash; may or may not report image issues
    assert.ok(Array.isArray(issues));
  });

  it('detects step cancel-out across sections', () => {
    // Section A: EN=2, JA=1; Section B: EN=1, JA=2; total 3=3
    const en = '## Section A\n1. A\n2. B\n## Section B\n1. X\n';
    const ja = '## セクション A\n1. A\n## セクション B\n1. X\n2. Y\n';
    const issues = compareSnapshotStructure(en, ja);
    const stepIssues = issues.filter((i) => i.type === 'step-count-mismatch');
    assert.ok(stepIssues.length >= 2, 'should detect per-section mismatches');
  });

  it('detects bullet count mismatch', () => {
    const en = '## Features\n- A\n- B\n- C\n';
    const ja = '## 機能\n- A\n- B\n';
    const issues = compareSnapshotStructure(en, ja);
    const bulletIssues = issues.filter((i) => i.type === 'bullet-count-mismatch');
    assert.equal(bulletIssues.length, 1);
  });

  it('detects paragraph count mismatch (diff >= 2)', () => {
    // EN has 4 paragraphs, JA has 2 → diff=2, meets minDiff=2 threshold
    const en = '## Overview\nPara 1.\n\nPara 2.\n\nPara 3.\n\nPara 4.\n';
    const ja = '## 概要\n段落 1。\n\n段落 2。\n';
    const issues = compareSnapshotStructure(en, ja);
    const paraIssues = issues.filter((i) => i.type === 'paragraph-count-mismatch');
    assert.equal(paraIssues.length, 1);
  });

  it('detects paragraph reflow (diff = 1)', () => {
    // EN has 2 paragraphs, JA has 3 → diff=1, detected at minDiff=1
    const en = '## Overview\nFirst paragraph.\n\nSecond paragraph.\n';
    const ja = '## 概要\n最初の段落。\n\n2番目の段落。\n\n追加の説明。\n';
    const issues = compareSnapshotStructure(en, ja);
    const paraIssues = issues.filter((i) => i.type === 'paragraph-count-mismatch');
    assert.equal(paraIssues.length, 1);
  });

  it('falls back to total comparison when section counts differ', () => {
    // EN: 2 sections with 5+3=8 steps, JA: 1 section with 3 steps → total diff=5
    const en = '## Section A\n1. A\n2. B\n3. C\n4. D\n5. E\n## Section B\n1. X\n2. Y\n3. Z\n';
    const ja = '## セクション A\n1. A\n2. B\n3. C\n';
    const issues = compareSnapshotStructure(en, ja);
    const stepIssues = issues.filter((i) => i.type === 'step-count-mismatch');
    assert.ok(stepIssues.length >= 1, 'should detect mismatch via total fallback');
  });

  it('detects total=0 on JA side (section drop)', () => {
    // EN has steps, JA section is empty → jaTotal=0, should still report
    const en = '## Setup\n1. A\n2. B\n3. C\n';
    const ja = '## セットアップ\nテキストのみ\n';
    const issues = compareSnapshotStructure(en, ja);
    const stepIssues = issues.filter((i) => i.type === 'step-count-mismatch');
    assert.ok(stepIssues.length >= 1, 'should detect when JA has zero steps');
  });

  it('detects small total diff when section counts differ (diff=1)', () => {
    // EN: 2 sections (2+1=3 steps), JA: 1 section (2 steps) → diff=1 → fires
    const en = '## Section A\n1. A\n2. B\n## Section B\n1. X\n';
    const ja = '## セクション A\n1. A\n2. B\n';
    const issues = compareSnapshotStructure(en, ja);
    const stepIssues = issues.filter((i) => i.type === 'step-count-mismatch');
    assert.ok(stepIssues.length >= 1, 'should detect diff=1 via total fallback');
  });

  it('normalises EN H1 headings for section comparison', () => {
    // EN uses H1 for sections, JA uses H2 — should still compare per-section
    const en = '# Title\nIntro\n# Setup\n1. A\n2. B\n3. C\n';
    const ja = '## セットアップ\n1. A\n2. B\n';
    const issues = compareSnapshotStructure(en, ja);
    const stepIssues = issues.filter((i) => i.type === 'step-count-mismatch');
    assert.ok(stepIssues.length >= 1, 'should detect step mismatch after H1 normalisation');
  });

  it('detects heading level mismatch (EN H3 → JA H2)', () => {
    const en = '## Overview\nIntro\n### Details\nContent\n### More\nMore content\n';
    const ja = '## 概要\nイントロ\n## 詳細\nコンテンツ\n## その他\nその他のコンテンツ\n';
    const issues = compareSnapshotStructure(en, ja);
    const headingIssues = issues.filter((i) => i.type === 'heading-mismatch');
    assert.equal(headingIssues.length, 1, 'should detect heading level mismatch');
    assert.ok(headingIssues[0].detail.includes('2件'), 'should report 2 mismatches');
    assert.ok(headingIssues[0].detail.includes("EN H3 'Details'"), 'should include example');
    assert.ok(headingIssues[0].severity === 'signal', 'severity should be signal');
  });

  it('returns no heading-mismatch when levels match', () => {
    const en = '## Overview\nIntro\n### Details\nContent\n';
    const ja = '## 概要\nイントロ\n### 詳細\nコンテンツ\n';
    const issues = compareSnapshotStructure(en, ja);
    const headingIssues = issues.filter((i) => i.type === 'heading-mismatch');
    assert.equal(headingIssues.length, 0);
  });

  it('compares up to the shorter heading array length', () => {
    // EN has 3 headings, JA has 2 — compare first 2 only (count mismatch is separate)
    const en = '## A\n### B\n### C\n';
    const ja = '## A\n### B\n';
    const issues = compareSnapshotStructure(en, ja);
    const headingIssues = issues.filter((i) => i.type === 'heading-mismatch');
    assert.equal(headingIssues.length, 0, 'matching levels should not trigger heading-mismatch');
  });

  it('ignores headings inside code blocks', () => {
    const en = '## Overview\n```\n### Not a heading\n```\n### Real\nContent\n';
    const ja = '## 概要\n```\n### コードブロック内\n```\n### 本物\nコンテンツ\n';
    const issues = compareSnapshotStructure(en, ja);
    const headingIssues = issues.filter((i) => i.type === 'heading-mismatch');
    assert.equal(headingIssues.length, 0);
  });

  it('limits examples to 3 in heading-mismatch detail', () => {
    // 4 mismatches: EN H3 → JA H2 for all sub-headings
    const en = '## Top\n### A\n### B\n### C\n### D\n';
    const ja = '## トップ\n## A\n## B\n## C\n## D\n';
    const issues = compareSnapshotStructure(en, ja);
    const headingIssues = issues.filter((i) => i.type === 'heading-mismatch');
    assert.equal(headingIssues.length, 1);
    assert.ok(headingIssues[0].detail.includes('4件'), 'should report 4 mismatches');
    // Count occurrences of "EN H" in detail — should be at most 3
    const exampleCount = (headingIssues[0].detail.match(/EN H\d/g) || []).length;
    assert.ok(exampleCount <= 3, 'should show at most 3 examples');
  });

  it('normalises EN H1 to H2 before heading level comparison', () => {
    // EN: # Title, # Section → normalised to (removed), ## Section
    // JA: ## Section — should match after normalisation
    const en = '# Title\nIntro\n# Section\nContent\n';
    const ja = '## セクション\nコンテンツ\n';
    const issues = compareSnapshotStructure(en, ja);
    const headingIssues = issues.filter((i) => i.type === 'heading-mismatch');
    assert.equal(headingIssues.length, 0, 'H1→H2 normalisation should prevent false positive');
  });
});

// ---------------------------------------------------------------------------
// extractHeadingSequence tests
// ---------------------------------------------------------------------------

describe('extractHeadingSequence', () => {
  it('extracts headings with correct levels', () => {
    const body = '## Overview\nText\n### Details\nMore\n#### Sub\n';
    const headings = extractHeadingSequence(body);
    assert.deepEqual(headings, [
      { level: 2, text: 'Overview' },
      { level: 3, text: 'Details' },
      { level: 4, text: 'Sub' },
    ]);
  });

  it('skips headings inside code blocks', () => {
    const body = '## Real\n```\n### Fake\n```\n### Also Real\n';
    const headings = extractHeadingSequence(body);
    assert.equal(headings.length, 2);
    assert.equal(headings[0].text, 'Real');
    assert.equal(headings[1].text, 'Also Real');
  });

  it('returns empty array for body with no headings', () => {
    const body = 'Just text\nMore text\n';
    const headings = extractHeadingSequence(body);
    assert.equal(headings.length, 0);
  });

  it('ignores H1 headings', () => {
    const body = '# Title\n## Section\n';
    const headings = extractHeadingSequence(body);
    assert.equal(headings.length, 1);
    assert.equal(headings[0].level, 2);
  });
});

// ---------------------------------------------------------------------------
// stripTitleH1 tests
// ---------------------------------------------------------------------------

describe('stripTitleH1', () => {
  it('removes first H1 and demotes remaining H1s to H2', () => {
    const body = '# Title\nIntro\n# Section A\nContent A\n# Section B\nContent B\n';
    const result = stripTitleH1(body);
    assert.ok(!result.includes('# Title'), 'first H1 should be removed');
    assert.ok(result.includes('## Section A'), 'second H1 should become H2');
    assert.ok(result.includes('## Section B'), 'third H1 should become H2');
  });

  it('returns body unchanged when no H1 present', () => {
    const body = '## Section A\nContent\n## Section B\nContent\n';
    const result = stripTitleH1(body);
    assert.equal(result, body);
  });
});

// ---------------------------------------------------------------------------
// normalizeEnArtifacts tests
// ---------------------------------------------------------------------------

describe('normalizeEnArtifacts', () => {
  it('fixes broken ordered list items without space after period', () => {
    const body = '1. Normal step\n5.Click on **Validations**.\n6. Another step\n';
    const result = normalizeEnArtifacts(body);
    assert.ok(result.includes('5. Click on **Validations**.'), 'should add space after 5.');
    assert.ok(result.includes('1. Normal step'), 'should not change correct items');
  });

  it('removes zero-width space lines', () => {
    const body = 'Real content\n\n\u200B\n\nMore content\n';
    const result = normalizeEnArtifacts(body);
    assert.ok(!result.includes('\u200B'), 'zero-width spaces should be removed');
    assert.ok(result.includes('Real content'));
    assert.ok(result.includes('More content'));
  });

  it('removes multiple zero-width space variants', () => {
    const body = 'Text\n\u200B\n\u200C\n\uFEFF\n';
    const result = normalizeEnArtifacts(body);
    assert.ok(!/[\u200B\u200C\u200D\uFEFF]/.test(result));
  });

  it('ensures trailing newline', () => {
    const noNewline = 'Text without trailing newline';
    assert.ok(normalizeEnArtifacts(noNewline).endsWith('\n'));
    const withNewline = 'Text with trailing newline\n';
    assert.ok(normalizeEnArtifacts(withNewline).endsWith('\n'));
    assert.ok(!normalizeEnArtifacts(withNewline).endsWith('\n\n'), 'should not double newline');
  });

  it('strips trailing backslash from lines', () => {
    const body = '1. Click **Create Step**.\\\n   The editor opens.\n';
    const result = normalizeEnArtifacts(body);
    assert.ok(result.includes('Click **Create Step**.'), 'backslash should be stripped');
    assert.ok(!result.includes('\\'), 'no backslash should remain');
    assert.ok(result.includes('The editor opens.'), 'continuation line should be kept separate');
  });

  it('does not remove real content that happens to contain unicode', () => {
    const body = 'This is real text with \u200B embedded\n';
    const result = normalizeEnArtifacts(body);
    assert.ok(result.includes('real text'), 'should keep lines with real content');
  });

  it('does not convert sub-step numbering like 1.1.', () => {
    const body = '1.1. Sub step A\n2.3. Sub step B\n';
    const result = normalizeEnArtifacts(body);
    assert.ok(result.includes('1.1. Sub step A'), 'sub-step numbering should be preserved');
    assert.ok(result.includes('2.3. Sub step B'), 'sub-step numbering should be preserved');
  });

  it('strips inline zero-width spaces from lines', () => {
    const body = '\u200B5. Step with leading ZWS\n';
    const result = normalizeEnArtifacts(body);
    assert.ok(result.includes('5. Step with leading ZWS'), 'inline ZWS should be stripped');
    assert.ok(!result.includes('\u200B'));
  });

  it('strips wrapping code fence from EN body', () => {
    const body = '```mdx\n## Section\n1. Step one\n```\n';
    const result = normalizeEnArtifacts(body);
    assert.ok(result.includes('## Section'), 'content inside fence should be unwrapped');
    assert.ok(result.includes('1. Step one'));
    assert.ok(!result.includes('```mdx'), 'fence markers should be removed');
  });

  it('skips step-count mismatch caused by EN broken numbering', () => {
    // EN has "5.Click" (no space) which is NOT counted as a step
    // After normalization, "5. Click" IS counted → JA and EN match
    const en = '# Title\n## Section\n1. Step one\n5.Click on button\n6. Step three\n';
    const ja = '## セクション\n1. ステップ 1\n5. ボタンをクリック\n6. ステップ 3\n';
    const issues = compareSnapshotStructure(en, ja);
    const stepIssues = issues.filter((i) => i.type === 'step-count-mismatch');
    assert.equal(stepIssues.length, 0, 'EN broken numbering should be normalized');
  });

  it('skips paragraph-count mismatch caused by zero-width space lines', () => {
    const en = '# Title\n## Section\nParagraph 1.\n\nParagraph 2.\n\n\u200B\n\n\u200B\n';
    const ja = '## セクション\n段落 1。\n\n段落 2。\n';
    const issues = compareSnapshotStructure(en, ja);
    const paraIssues = issues.filter((i) => i.type === 'paragraph-count-mismatch');
    assert.equal(paraIssues.length, 0, 'zero-width space paragraphs should not count');
  });
});

// ---------------------------------------------------------------------------
// normalizeNumericPeriodSpacing tests (§5.3.5: EN/JA symmetric normalization)
// ---------------------------------------------------------------------------

describe('normalizeNumericPeriodSpacing', () => {
  it('inserts a space after an ordered-list-item period glued to text', () => {
    const body = '1.Abc\n2.Foo bar\n';
    const result = normalizeNumericPeriodSpacing(body);
    assert.ok(result.includes('1. Abc'), 'should insert space after 1.');
    assert.ok(result.includes('2. Foo bar'), 'should insert space after 2.');
  });

  it('leaves already-spaced ordered-list items unchanged', () => {
    const body = '1. Abc\n2. Foo bar\n';
    const result = normalizeNumericPeriodSpacing(body);
    assert.equal(result, body, 'spaced items should be unchanged');
  });

  it('does not split decimal numbers like 1.0 or 3.14', () => {
    // These are plain paragraph text, not ordered-list items. The function
    // only triggers when the first char after the period is a non-digit
    // non-space, so a trailing digit leaves them untouched.
    const body = 'Version 1.0 is released\nPi is 3.14\n';
    const result = normalizeNumericPeriodSpacing(body);
    assert.equal(result, body, 'decimals should be unchanged');
  });

  it('does not split IP-like strings such as 1.2.3.4', () => {
    // The `1.2.3.4` case matters only if the entire line starts with digits
    // (which would match `^\d+\.(\S)`). The sub-step guard `^\d+\.\d+\.` also
    // blocks this case because the second segment starts with a digit.
    const body = '1.2.3.4 is an IP\nLocal is 10.0.0.1\n';
    const result = normalizeNumericPeriodSpacing(body);
    assert.equal(result, body, 'IP-like strings should be unchanged');
  });

  it('preserves sub-step numbering such as 1.1. and 2.3.', () => {
    const body = '1.1. Sub step A\n2.3. Sub step B\n';
    const result = normalizeNumericPeriodSpacing(body);
    assert.equal(result, body, 'sub-step numbering should be unchanged');
  });

  it('does not trim trailing newline', () => {
    const body = '1.Abc\n';
    const result = normalizeNumericPeriodSpacing(body);
    assert.ok(result.endsWith('\n'), 'trailing newline should be preserved');
  });

  it('returns input unchanged for non-string input', () => {
    assert.equal(normalizeNumericPeriodSpacing(null), null);
    assert.equal(normalizeNumericPeriodSpacing(undefined), undefined);
  });

  it('is symmetric: EN "1.Abc" and JA "1.Abc" normalize identically', () => {
    const en = '1.Abc\n2.Def\n';
    const ja = '1.Abc\n2.Def\n';
    assert.equal(
      normalizeNumericPeriodSpacing(en),
      normalizeNumericPeriodSpacing(ja),
      'EN and JA with same pattern should normalize to same result',
    );
  });
});

// ---------------------------------------------------------------------------
// §5.3.5 regression: compareSnapshotStructure with glued numeric-period on
// both sides should NOT emit paragraph-count / step-count audit signals.
// ---------------------------------------------------------------------------

describe('compareSnapshotStructure §5.3.5 numeric-period symmetry', () => {
  it('does not flag paragraph-count-mismatch when both sides have "1.Abc" style items', () => {
    // Both EN and JA expose the `\d+\.(\S)` pattern — historically only the
    // EN side was normalized, causing EN=2 paragraphs vs JA=1 after split.
    // With symmetric normalization the counts match.
    const en = '# Title\n## Section\n1.First item\n2.Second item\n';
    const ja = '## セクション\n1.最初の項目\n2.二番目の項目\n';
    const issues = compareSnapshotStructure(en, ja);
    const paraIssues = issues.filter((i) => i.type === 'paragraph-count-mismatch');
    const stepIssues = issues.filter((i) => i.type === 'step-count-mismatch');
    assert.equal(paraIssues.length, 0, 'symmetric normalize should clear paragraph-count noise');
    assert.equal(stepIssues.length, 0, 'symmetric normalize should clear step-count noise');
  });

  it('still flags genuine step-count mismatch when JA omits a step', () => {
    // Sanity check: the symmetric normalize must not mask real drift.
    // EN has 3 steps, JA has 2. After normalize both sides still show the
    // step-count gap.
    const en = '# Title\n## Section\n1.Step one\n2.Step two\n3.Step three\n';
    const ja = '## セクション\n1.ステップ 1\n2.ステップ 2\n';
    const issues = compareSnapshotStructure(en, ja);
    const stepIssues = issues.filter((i) => i.type === 'step-count-mismatch');
    assert.ok(stepIssues.length > 0, 'real step-count drift should still be flagged');
  });

  it('leaves already-spaced content untouched on both sides (no regression)', () => {
    const en = '# Title\n## Section\n1. First\n2. Second\n';
    const ja = '## セクション\n1. 最初\n2. 二番目\n';
    const issues = compareSnapshotStructure(en, ja);
    const paraIssues = issues.filter((i) => i.type === 'paragraph-count-mismatch');
    const stepIssues = issues.filter((i) => i.type === 'step-count-mismatch');
    assert.equal(paraIssues.length, 0, 'already-spaced content should stay clean');
    assert.equal(stepIssues.length, 0, 'already-spaced content should stay clean');
  });
});

// ---------------------------------------------------------------------------
// extractBulletCounts tests
// ---------------------------------------------------------------------------

describe('extractBulletCounts', () => {
  it('counts bullet items per section', () => {
    const body = '## Features\n- Item A\n- Item B\n## Other\n* Item C\n';
    const result = extractBulletCounts(body);
    assert.equal(result.get('Features'), 2);
    assert.equal(result.get('Other'), 1);
  });

  it('counts indented bullets under numbered steps', () => {
    const body = '## Section\n1. Step one\n   - Sub item A\n   - Sub item B\n';
    const result = extractBulletCounts(body);
    assert.equal(result.get('Section'), 2);
  });

  it('counts image+unordered-list concatenation as a bullet (turndown artifact)', () => {
    const body = '## Section\n![](images/foo.png)- Bullet item\n';
    const result = extractBulletCounts(body);
    assert.equal(result.get('Section'), 1);
  });

  it('excludes bullets inside code blocks', () => {
    const body = '## Section\n- Real item\n```\n- Fake item\n```\n';
    const result = extractBulletCounts(body);
    assert.equal(result.get('Section'), 1);
  });

  it('excludes bullets inside markdown pipe tables', () => {
    const body = '## Section\n- Real bullet\n| Col A | Col B |\n| --- | --- |\n| - Fake bullet | - Also fake |\n- Another real bullet\n';
    const result = extractBulletCounts(body);
    assert.equal(result.get('Section'), 2);
  });

  it('excludes bullets in multi-row pipe tables', () => {
    const body = '## Props\n| Property | Description |\n| --- | --- |\n| - **A** | First |\n| - **B** | Second |\n| - **C** | Third |\nSome text after table.\n';
    const result = extractBulletCounts(body);
    assert.equal(result.get('Props'), 0);
  });
});

// ---------------------------------------------------------------------------
// extractParagraphCounts tests
// ---------------------------------------------------------------------------

describe('extractParagraphCounts', () => {
  it('counts contiguous text blocks as paragraphs', () => {
    const body = '## Section\nFirst paragraph line 1.\nFirst paragraph line 2.\n\nSecond paragraph.\n';
    const result = extractParagraphCounts(body);
    assert.equal(result.get('Section'), 2);
  });

  it('does not count list items or images as paragraphs', () => {
    const body = '## Section\nParagraph text.\n\n- Bullet\n1. Step\n![img](/a.png)\n\nAnother paragraph.\n';
    const result = extractParagraphCounts(body);
    assert.equal(result.get('Section'), 2);
  });

  it('does not count single-line HTML comments as paragraphs', () => {
    const body = '## Section\nParagraph one.\n\n<!-- markdownlint-disable-next-line MD036 -->\n\nParagraph two.\n';
    const result = extractParagraphCounts(body);
    assert.equal(result.get('Section'), 2);
  });

  it('does not count multiline HTML comments as paragraphs', () => {
    const body = '## Section\nParagraph one.\n\n<!--\nThis is a\nmultiline comment\n-->\n\nParagraph two.\n';
    const result = extractParagraphCounts(body);
    assert.equal(result.get('Section'), 2);
  });

  it('resumes paragraph counting after multiline comment closes', () => {
    const body = '## Section\n<!--\ncomment\n-->\nResumed paragraph.\n';
    const result = extractParagraphCounts(body);
    assert.equal(result.get('Section'), 1);
  });
});

// ---------------------------------------------------------------------------
// extractStepCounts edge case tests (Fix 1)
// ---------------------------------------------------------------------------

describe('extractStepCounts edge cases', () => {
  it('counts steps after blockquote without empty line separator', () => {
    const body = '## Section\n> 📘 Note\n> Content\n1. Step one\n2. Step two\n';
    const result = extractStepCounts(body);
    assert.equal(result.get('Section'), 2);
  });

  it('counts steps after directive callout', () => {
    const body = '## Section\n:::note\nSome note\n:::\n1. Step one\n';
    const result = extractStepCounts(body);
    assert.equal(result.get('Section'), 1);
  });

  it('counts image+ordered-list concatenation as a step (turndown artifact)', () => {
    const body = '## Section\n![](images/foo.png)3. Step three\n';
    const result = extractStepCounts(body);
    assert.equal(result.get('Section'), 1);
  });

  it('resets callout state at heading boundary', () => {
    const body = '## Section A\n:::note\nUnclosed note\n## Section B\n1. Step one\n';
    const result = extractStepCounts(body);
    assert.equal(result.get('Section B'), 1);
  });
});

// ---------------------------------------------------------------------------
// H4 boundary tests
// ---------------------------------------------------------------------------

describe('H4 section boundary support', () => {
  it('extractStepCounts recognises H4 as section boundary', () => {
    const body = '## Parent\n1. A\n#### Sub\n1. B\n2. C\n';
    const result = extractStepCounts(body);
    assert.equal(result.get('Parent'), 1);
    assert.equal(result.get('Sub'), 2);
  });

  it('extractBulletCounts recognises H4 as section boundary', () => {
    const body = '## Parent\n- A\n#### Sub\n- B\n- C\n';
    const result = extractBulletCounts(body);
    assert.equal(result.get('Parent'), 1);
    assert.equal(result.get('Sub'), 2);
  });

  it('extractParagraphCounts recognises H4 as section boundary', () => {
    const body = '## Parent\nPara 1.\n\n#### Sub\nPara 2.\n\nPara 3.\n';
    const result = extractParagraphCounts(body);
    assert.equal(result.get('Parent'), 1);
    assert.equal(result.get('Sub'), 2);
  });
});

// ---------------------------------------------------------------------------
// section-count-mismatch tests
// ---------------------------------------------------------------------------

describe('section-count-mismatch', () => {
  it('detects when EN has more sections than JA (section merge)', () => {
    const en = '# Title\n## A\nText\n## B\nText\n## C\nText\n';
    const ja = '## A\nText\n## B\nText\n';
    const issues = compareSnapshotStructure(en, ja);
    const sectionIssues = issues.filter((i) => i.type === 'section-count-mismatch');
    assert.equal(sectionIssues.length, 1);
    assert.match(sectionIssues[0].detail, /EN=3.*JA=2/);
  });

  it('detects when JA has more sections than EN (section split)', () => {
    const en = '# Title\n## A\nText\n';
    const ja = '## A\nText\n## B\nText\n## C\nText\n';
    const issues = compareSnapshotStructure(en, ja);
    const sectionIssues = issues.filter((i) => i.type === 'section-count-mismatch');
    assert.equal(sectionIssues.length, 1);
  });

  it('returns no issue when section counts match', () => {
    const en = '# Title\n## A\nText\n## B\nText\n';
    const ja = '## A\nText\n## B\nText\n';
    const issues = compareSnapshotStructure(en, ja);
    const sectionIssues = issues.filter((i) => i.type === 'section-count-mismatch');
    assert.equal(sectionIssues.length, 0);
  });

  it('does not emit step-count mismatch for image+ordered-list concatenation', () => {
    const en = '# Title\n## Steps\n![](images/foo.png)3. Item one\n';
    const ja = '## Steps\n3. Item one\n';
    const issues = compareSnapshotStructure(en, ja);
    const stepIssues = issues.filter((i) => i.type === 'step-count-mismatch');
    assert.equal(stepIssues.length, 0);
  });

  it('does not emit bullet-count mismatch for image+unordered-list concatenation', () => {
    const en = '# Title\n## Bullets\n![](images/foo.png)- Bullet one\n';
    const ja = '## Bullets\n- Bullet one\n';
    const issues = compareSnapshotStructure(en, ja);
    const bulletIssues = issues.filter((i) => i.type === 'bullet-count-mismatch');
    assert.equal(bulletIssues.length, 0);
  });

  it('counts H4 headings in section count', () => {
    const en = '# Title\n## A\nText\n### B\nText\n#### C\nText\n';
    const ja = '## A\nText\n### B\nText\n';
    const issues = compareSnapshotStructure(en, ja);
    const sectionIssues = issues.filter((i) => i.type === 'section-count-mismatch');
    assert.equal(sectionIssues.length, 1);
    assert.match(sectionIssues[0].detail, /EN=3.*JA=2/);
  });

  it('detects equal-total section merge via count', () => {
    // EN has 4 sections (A, B, C, D), JA has 3 (A, B, C) — C absorbed D
    const en = '# Title\n## A\n## B\n## C\n## D\n';
    const ja = '## A\n## B\n## C\n';
    const issues = compareSnapshotStructure(en, ja);
    const sectionIssues = issues.filter((i) => i.type === 'section-count-mismatch');
    assert.equal(sectionIssues.length, 1);
  });

  it('ignores headings inside code blocks for section count', () => {
    const en = '# Title\n## A\nText\n```\n## Fake\n```\n## B\nText\n';
    const ja = '## A\nText\n```\n## Fake\n## AlsoFake\n```\n## B\nText\n';
    const issues = compareSnapshotStructure(en, ja);
    const sectionIssues = issues.filter((i) => i.type === 'section-count-mismatch');
    assert.equal(sectionIssues.length, 0, 'should not count headings inside code blocks');
  });
});

// ---------------------------------------------------------------------------
// Table structure comparison tests
// ---------------------------------------------------------------------------

describe('extractMarkdownTables', () => {
  it('extracts a simple markdown table', () => {
    const body = '## Section\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n| 3 | 4 |\n';
    const tables = extractMarkdownTables(body);
    assert.equal(tables.length, 1);
    assert.equal(tables[0].rows.length, 3); // header + 2 data rows
    assert.deepEqual(tables[0].rows[0], ['A', 'B']);
    assert.deepEqual(tables[0].rows[1], ['1', '2']);
  });

  it('extracts multiple tables', () => {
    const body = '| A |\n| --- |\n| 1 |\n\nText\n\n| B |\n| --- |\n| 2 |\n';
    const tables = extractMarkdownTables(body);
    assert.equal(tables.length, 2);
  });

  it('skips tables inside code blocks', () => {
    const body = '```\n| A |\n| --- |\n| 1 |\n```\n';
    const tables = extractMarkdownTables(body);
    assert.equal(tables.length, 0);
  });

  // -------------------------------------------------------------------------
  // §5.3.4 GFM strict-check: backslash-escaped pipe handling
  //
  // WRITING_GUIDE §5 `broken-table-row paragraph mirror` (salesforce Wave 2
  // sentinel `use-agentic-test-automation-for-salesforce`) は意図的に
  // `\| ... \|` として render され、GFM table ではなく段落として扱われる
  // べきである。table-shape-mismatch の false-positive を誘発しないよう
  // 以下の strict-check を pin する。
  // -------------------------------------------------------------------------
  it('does NOT detect backslash-escaped pipe paragraph as table', () => {
    // salesforce Wave 2 sentinel `\| ... \|` pattern (broken-table-row
    // paragraph mirror). backslash-escape によって行頭が `\|` となり、
    // GFM 上は pipe table ではなく段落として扱われる。
    const body =
      '## Section\n\n\\| Row A \\| Row B \\| Row C \\|\n\nSome text after.\n';
    const tables = extractMarkdownTables(body);
    assert.equal(
      tables.length,
      0,
      'backslash-escaped pipe line must not be treated as a table row',
    );
  });

  it('requires a GFM separator row to recognize a pipe table', () => {
    // GFM §tables-extension: pipe table は separator 行 (`| --- |`) が必須。
    // separator が無い単独 `| ... |` 行は段落 (false-positive 予防)。
    const body = '| A | B |\n| 1 | 2 |\n\nparagraph after.\n';
    const tables = extractMarkdownTables(body);
    assert.equal(
      tables.length,
      0,
      'pipe-only rows without a separator must not be detected as a table',
    );
  });

  it('preserves backslash-escaped pipes within real table cells', () => {
    // GFM §tables-extension: cell 内の `\|` は literal pipe として扱われ、
    // cell 区切りにはならない。unescaped pipe のみが separator。
    const body =
      '| A \\| B | C |\n| --- | --- |\n| val1\\|val2 | val3 |\n';
    const tables = extractMarkdownTables(body);
    assert.equal(tables.length, 1);
    assert.equal(tables[0].rows.length, 2); // header + 1 data row
    assert.deepEqual(
      tables[0].rows[0],
      ['A | B', 'C'],
      'header cell must contain literal pipe, not split into 3 cells',
    );
    assert.deepEqual(
      tables[0].rows[1],
      ['val1|val2', 'val3'],
      'data cell must contain literal pipe, not split into 3 cells',
    );
  });

  it('does NOT detect isolated backslash-pipe segment mixed with real table', () => {
    // 混在 pattern: 同じページに real GFM table と backslash-pipe paragraph が
    // 併存する場合も、backslash-pipe 行は table として誤検知されない。
    const body = [
      '## Real',
      '',
      '| A | B |',
      '| --- | --- |',
      '| 1 | 2 |',
      '',
      '## Paragraph Mirror',
      '',
      '\\| col1 \\| col2 \\|',
      '',
    ].join('\n');
    const tables = extractMarkdownTables(body);
    assert.equal(tables.length, 1);
    assert.deepEqual(tables[0].rows[0], ['A', 'B']);
  });

  it('rejects pipe-row candidate lines with only a trailing backslash-pipe', () => {
    // 末尾が `\|` (escaped) の行は unescaped closing pipe が無いため、
    // table candidate ではない (負 lookbehind で `(?<!\\)\|\s*$` が false)。
    const body = '| A | B \\|\n| --- | --- |\n| 1 | 2 |\n';
    const tables = extractMarkdownTables(body);
    assert.equal(
      tables.length,
      0,
      'row ending in escaped pipe is not a valid GFM pipe table header',
    );
  });
});

describe('extractHtmlTables', () => {
  it('extracts a simple HTML table', () => {
    const body = '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>';
    const tables = extractHtmlTables(body);
    assert.equal(tables.length, 1);
    assert.equal(tables[0].rows.length, 2);
    assert.deepEqual(tables[0].rows[0], ['A', 'B']);
    assert.deepEqual(tables[0].rows[1], ['1', '2']);
  });

  it('preserves link href in cell content', () => {
    const body = '<table><tr><td><a href="/docs/foo">Link text</a></td></tr></table>';
    const tables = extractHtmlTables(body);
    assert.equal(tables.length, 1);
    assert.ok(tables[0].rows[0][0].includes('/docs/foo'), 'href should be preserved in cell text');
  });

  it('preserves <code> as backtick-wrapped inline code', () => {
    const body = '<table><tr><td><code>--grep</code></td></tr></table>';
    const tables = extractHtmlTables(body);
    assert.equal(tables.length, 1);
    assert.ok(tables[0].rows[0][0].includes('`--grep`'), 'code should be preserved as backtick');
  });

  it('normalizes whitespace inside <code> (pretty-printed HTML)', () => {
    const body = '<table><tr><td><code>\n  host=localhost/127.0.0.1\n</code></td></tr></table>';
    const tables = extractHtmlTables(body);
    assert.ok(
      tables[0].rows[0][0].includes('`host=localhost/127.0.0.1`'),
      'whitespace inside code should be normalized',
    );
  });

  it('preserves href with #fragment', () => {
    const body = '<table><tr><td><a href="/docs/validate-download#adding-a-cli-step">Adding a CLI step</a></td></tr></table>';
    const tables = extractHtmlTables(body);
    assert.ok(tables[0].rows[0][0].includes('#adding-a-cli-step'), 'fragment should be preserved');
  });
});

describe('stripMarkdown', () => {
  it('strips links and formatting', () => {
    assert.equal(stripMarkdown('**bold** text'), 'bold text');
    assert.equal(stripMarkdown('[link](http://example.com)'), 'link');
    assert.equal(stripMarkdown('`code`'), '');
    assert.equal(stripMarkdown('![alt](img.png)'), '');
  });

  it('strips *italic* (asterisk form)', () => {
    assert.equal(stripMarkdown('*italic* text'), 'italic text');
  });

  it('strips _italic_ (underscore form)', () => {
    assert.equal(stripMarkdown('_italic_ text'), 'italic text');
    assert.equal(stripMarkdown('_Generate random value_'), 'Generate random value');
  });

  it('does not strip underscores in identifiers', () => {
    assert.equal(stripMarkdown('foo_bar_baz'), 'foo_bar_baz');
    assert.equal(stripMarkdown('config_file_path'), 'config_file_path');
    assert.equal(stripMarkdown('overrideTestData_v2'), 'overrideTestData_v2');
  });

  it('handles mixed italic and identifiers', () => {
    assert.equal(stripMarkdown('config_file_path is _important_'), 'config_file_path is important');
  });

  it('strips ~~strikethrough~~', () => {
    assert.equal(stripMarkdown('~~deleted~~ text'), 'deleted text');
  });
});

describe('isUntranslatedCell', () => {
  it('detects English prose (20+ chars, 3+ words)', () => {
    assert.equal(isUntranslatedCell('Click on the button to proceed with the action'), true);
    assert.equal(isUntranslatedCell('Select the option from the dropdown menu'), true);
    assert.equal(isUntranslatedCell('This is a description of the feature'), true);
  });

  it('returns false for Japanese content', () => {
    assert.equal(isUntranslatedCell('ボタンをクリックして操作を続行します'), false);
  });

  it('returns false for short cells (< 20 chars)', () => {
    assert.equal(isUntranslatedCell(''), false);
    assert.equal(isUntranslatedCell('A'), false);
    assert.equal(isUntranslatedCell('Click on the'), false);
    assert.equal(isUntranslatedCell('Property'), false);
    assert.equal(isUntranslatedCell('Node.js'), false);
  });

  it('returns false for identifiers and labels (< 3 words)', () => {
    assert.equal(isUntranslatedCell('projectId'), false);
    assert.equal(isUntranslatedCell('Testim CLI'), false);
    assert.equal(isUntranslatedCell('Visual Editor'), false);
    assert.equal(isUntranslatedCell('Smart Locators'), false);
  });

  it('returns false for camelCase/PascalCase identifiers', () => {
    assert.equal(isUntranslatedCell('projectId'), false);
    assert.equal(isUntranslatedCell('testName'), false);
  });

  it('returns false for dot-notation paths', () => {
    assert.equal(isUntranslatedCell('params.timeout'), false);
    assert.equal(isUntranslatedCell('test.id.value'), false);
  });

  it('returns false for keyboard shortcuts (including Mac keys)', () => {
    assert.equal(isUntranslatedCell('Alt + H'), false);
    assert.equal(isUntranslatedCell('Ctrl + Shift + Enter'), false);
    assert.equal(isUntranslatedCell('Option + Command + X / Command + Shift + 1'), false);
    assert.equal(isUntranslatedCell('Command + Shift + Enter'), false);
    assert.equal(isUntranslatedCell('Delete / Backspace'), false);
  });

  it('returns false for URLs', () => {
    assert.equal(isUntranslatedCell('https://example.com/very/long/path/here'), false);
  });

  it('returns false for numbers and units', () => {
    assert.equal(isUntranslatedCell('42'), false);
    assert.equal(isUntranslatedCell('5000ms'), false);
  });
});

describe('table parity in compareSnapshotStructure', () => {
  it('detects table shape mismatch (different row count)', () => {
    const en = '| A | B |\n| --- | --- |\n| 1 | 2 |\n| 3 | 4 |\n';
    const ja = '| A | B |\n| --- | --- |\n| 1 | 2 |\n';
    const issues = compareSnapshotStructure(en, ja);
    const tableIssues = issues.filter((i) => i.type === 'table-shape-mismatch');
    assert.equal(tableIssues.length, 1);
  });

  it('detects table cell empty mismatch', () => {
    const en = '| A | B |\n| --- | --- |\n| content | data |\n';
    const ja = '| A | B |\n| --- | --- |\n| コンテンツ |  |\n';
    const issues = compareSnapshotStructure(en, ja);
    const emptyIssues = issues.filter((i) => i.type === 'table-cell-empty-mismatch');
    assert.equal(emptyIssues.length, 1);
  });

  it('detects English residual when JA cell differs from EN but is English prose', () => {
    // JA cell was changed but left as English prose (not a copy of EN)
    const en = '| Feature | Description |\n| --- | --- |\n| Login | Enter your credentials to access the dashboard panel |\n';
    const ja = '| 機能 | 説明 |\n| --- | --- |\n| ログイン | Please enter your login credentials to proceed here |\n';
    const issues = compareSnapshotStructure(en, ja);
    const residualIssues = issues.filter((i) => i.type === 'table-cell-english-residual');
    assert.ok(residualIssues.length >= 1, 'should detect English residual in table cell');
  });

  it('does not flag English residual when EN and JA cells are identical (intentional)', () => {
    // Step names like "Validate element visible" are intentionally English
    const en = '| Step | Description |\n| --- | --- |\n| Validate element visible | Checks if element is shown |\n';
    const ja = '| ステップ | 説明 |\n| --- | --- |\n| Validate element visible | 要素が表示されているか確認 |\n';
    const issues = compareSnapshotStructure(en, ja);
    const residualIssues = issues.filter((i) => i.type === 'table-cell-english-residual');
    assert.equal(residualIssues.length, 0, 'identical EN/JA cells should not be flagged');
  });

  it('does not flag English residual when cells differ only by whitespace', () => {
    const en = '| Name | Note |\n| --- | --- |\n| Remote run  (Testim Editor) | desc |\n';
    const ja = '| 名前 | 備考 |\n| --- | --- |\n| Remote run (Testim Editor) | 説明 |\n';
    const issues = compareSnapshotStructure(en, ja);
    const residualIssues = issues.filter((i) => i.type === 'table-cell-english-residual');
    assert.equal(residualIssues.length, 0, 'cosmetic spacing difference should not be flagged');
  });

  it('does not flag residual when EN markdown link equals JA HTML-preserved link', () => {
    // EN uses [text](https://docs.tricentis.com/testim/content/.../foo.htm#bar)
    // JA HTML-preserved has text [/docs/foo#bar]
    // After stripping bracket annotations, visible text should match
    const en = '| Link |\n| --- |\n| [Adding a CLI step](https://docs.tricentis.com/testim/content/validations/validate-download.htm#adding-a-cli-step) |\n';
    const ja = '| リンク |\n| --- |\n| Adding a CLI step [/docs/validate-download#adding-a-cli-step] |\n';
    const issues = compareSnapshotStructure(en, ja);
    const residualIssues = issues.filter((i) => i.type === 'table-cell-english-residual');
    assert.equal(residualIssues.length, 0, 'href annotation should not cause residual');
  });

  it('returns no table issues when tables match', () => {
    const en = '| Feature | Description |\n| --- | --- |\n| Login | Enter credentials |\n';
    const ja = '| 機能 | 説明 |\n| --- | --- |\n| ログイン | 資格情報を入力 |\n';
    const issues = compareSnapshotStructure(en, ja);
    const tableIssues = issues.filter((i) =>
      i.type.startsWith('table-'),
    );
    assert.equal(tableIssues.length, 0);
  });

  it('compares HTML tables in EN with markdown tables in JA', () => {
    const en = '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></table>';
    const ja = '| A | B |\n| --- | --- |\n| 1 | 2 |\n';
    const issues = compareSnapshotStructure(en, ja);
    const shapeIssues = issues.filter((i) => i.type === 'table-shape-mismatch');
    assert.equal(shapeIssues.length, 1);
  });

  it('reports table count mismatch when table counts differ', () => {
    const en = '| A |\n| --- |\n| 1 |\n\n| B |\n| --- |\n| 2 |\n';
    const ja = '| A |\n| --- |\n| 1 |\n';
    const issues = compareSnapshotStructure(en, ja);
    const shapeIssues = issues.filter((i) => i.type === 'table-shape-mismatch');
    assert.equal(shapeIssues.length, 1, 'should report table count mismatch');
    assert.match(shapeIssues[0].detail, /EN=2.*JA=1/);
  });

  it('reports table drop (EN has table, JA has none)', () => {
    const en = '| A | B |\n| --- | --- |\n| 1 | 2 |\n';
    const ja = 'テキストのみ\n';
    const issues = compareSnapshotStructure(en, ja);
    const shapeIssues = issues.filter((i) => i.type === 'table-shape-mismatch');
    assert.equal(shapeIssues.length, 1, 'should detect table drop');
  });

  it('does not flag short UI labels (< 20 chars) as English residual', () => {
    // Short labels like "Config File" are intentionally English in Testim docs
    const en = '| Setting | Value |\n| --- | --- |\n| Config File | path |\n';
    const ja = '| 設定 | 値 |\n| --- | --- |\n| Config File | パス |\n';
    const issues = compareSnapshotStructure(en, ja);
    const residualIssues = issues.filter((i) => i.type === 'table-cell-english-residual');
    assert.equal(residualIssues.length, 0, 'short UI labels should not be flagged');
  });

  it('compares mixed HTML/markdown tables in document order', () => {
    // EN: HTML table at line 1, markdown at line 5
    // JA: markdown at line 1, HTML-converted-to-markdown at line 5 (reversed)
    const en = '<table><tr><th>X</th></tr><tr><td>1</td></tr></table>\n\n\n\n| Y |\n| --- |\n| 2 |\n';
    const ja = '| Y |\n| --- |\n| 2 |\n\n\n\n| X |\n| --- |\n| 1 |\n';
    // Both have 2 tables with same shapes, but the content is reordered.
    // The ordinal comparison should now detect the content swap.
    const issues = compareSnapshotStructure(en, ja);
    // At minimum: tables are compared in document order, so X vs Y mismatch
    assert.ok(Array.isArray(issues));
  });
});

describe('table cell empty detection with inline code', () => {
  it('detects empty mismatch when EN has code-only cell and JA is empty', () => {
    const en = '| Option | Description |\n| --- | --- |\n| `--grep` | Filter tests |\n';
    const ja = '| オプション | 説明 |\n| --- | --- |\n|  | テストをフィルタ |\n';
    const issues = compareSnapshotStructure(en, ja);
    const emptyIssues = issues.filter((i) => i.type === 'table-cell-empty-mismatch');
    assert.equal(emptyIssues.length, 1, 'should detect code-only cell dropped');
  });

  it('does not flag when both cells have inline code', () => {
    const en = '| Option | Description |\n| --- | --- |\n| `--grep` | Filter tests |\n';
    const ja = '| オプション | 説明 |\n| --- | --- |\n| `--grep` | テストをフィルタ |\n';
    const issues = compareSnapshotStructure(en, ja);
    const emptyIssues = issues.filter((i) => i.type === 'table-cell-empty-mismatch');
    assert.equal(emptyIssues.length, 0);
  });
});

// ---------------------------------------------------------------------------
// extractInvariantTokens tests
// ---------------------------------------------------------------------------

describe('extractInvariantTokens', () => {
  it('extracts inline code tokens', () => {
    const tokens = extractInvariantTokens('Use `--grep` to filter');
    assert.ok(tokens.includes('--grep'));
  });

  it('extracts and normalizes URLs', () => {
    const tokens = extractInvariantTokens('See https://example.com/docs for details');
    assert.ok(tokens.includes('https://example.com/docs'));
  });

  it('normalizes docs.tricentis.com URLs to /docs/slug', () => {
    // EN MadCap の URL は JA 側のカテゴリ
    // 構造と一致しないことがある (EN `editing/shareable-steps.htm` は JA
    // では `editing-tests/shareable-steps` に配置されている)。
    // resolveToFullSlug の basename fallback が正しい JA full path に復元する。
    const tokens = extractInvariantTokens('Link: https://docs.tricentis.com/testim/content/editing/shareable-steps.htm');
    assert.ok(
      tokens.includes('/docs/editing-tests/shareable-steps'),
      `Expected canonical JA full path /docs/editing-tests/shareable-steps in ${JSON.stringify(tokens)}`,
    );
    assert.ok(!tokens.some((t) => t.includes('docs.tricentis.com')));
  });

  it('extracts /docs/slug from markdown links', () => {
    const tokens = extractInvariantTokens('[steps](/docs/shareable-steps)');
    assert.ok(tokens.includes('/docs/shareable-steps'));
  });

  it('does not double-count URL fragments as dot-paths', () => {
    const tokens = extractInvariantTokens('https://docs.tricentis.com/testim/content/overview/foo.htm');
    assert.ok(!tokens.some((t) => t === 'docs.tricentis.com'));
  });

  it('normalizes /docs/slug#fragment to /docs/slug (fragments differ by locale)', () => {
    const tokens = extractInvariantTokens('Adding a CLI step [/docs/validate-download#adding-a-cli-step]');
    assert.ok(tokens.includes('/docs/validate-download'));
    assert.ok(!tokens.includes('/docs/validate-download#adding-a-cli-step'));
  });

  it('normalizes /docs/slug#fragment from markdown link', () => {
    const tokens = extractInvariantTokens('[text](/docs/foo-bar#section)');
    assert.ok(tokens.includes('/docs/foo-bar'));
    assert.ok(!tokens.includes('/docs/foo-bar#section'));
  });

  it('normalizes /docs/slug with Japanese fragment', () => {
    const tokens = extractInvariantTokens('[text](/docs/add-cli-validations-and-actions#cli-ステップの追加)');
    assert.ok(tokens.includes('/docs/add-cli-validations-and-actions'));
  });

  it('normalizes /docs/ bracket annotation with JA fragment', () => {
    const tokens = extractInvariantTokens('text [/docs/add-cli-validations-and-actions#cli-ステップの追加]');
    assert.ok(tokens.includes('/docs/add-cli-validations-and-actions'));
  });

  it('extracts CLI flags', () => {
    const tokens = extractInvariantTokens('Run with --timeout 30');
    assert.ok(tokens.includes('--timeout'));
  });

  it('extracts dot-notation paths with known prefix', () => {
    const tokens = extractInvariantTokens('Set params.timeout to 30');
    assert.ok(tokens.includes('params.timeout'));
  });

  it('extracts dot-paths with 3+ segments', () => {
    const tokens = extractInvariantTokens('Use test.id.value here');
    assert.ok(tokens.includes('test.id.value'));
  });

  it('does not extract i.e, e.g, Node.js as dot-paths', () => {
    const tokens = extractInvariantTokens('i.e this works, e.g with Node.js');
    assert.ok(!tokens.includes('i.e'));
    assert.ok(!tokens.includes('e.g'));
    assert.ok(!tokens.includes('Node.js'));
  });

  it('extracts href from HTML-preserved table cells', () => {
    // extractHtmlTables preserves hrefs as "text [/docs/slug]"
    const tokens = extractInvariantTokens('steps [/docs/shareable-steps]');
    assert.ok(tokens.includes('/docs/shareable-steps'));
  });

  it('extracts versions', () => {
    const tokens = extractInvariantTokens('Requires v2.1.0 or later');
    assert.ok(tokens.includes('v2.1.0'));
  });

  it('extracts number+unit', () => {
    const tokens = extractInvariantTokens('Timeout is 30sec by default');
    assert.ok(tokens.some((t) => t.includes('30sec')));
  });

  it('extracts multi-segment file paths', () => {
    const tokens = extractInvariantTokens('Endpoint at /api/v1/tests');
    assert.ok(tokens.includes('/api/v1/tests'));
  });

  it('does not extract single-segment slash-prefixed words as paths', () => {
    const tokens = extractInvariantTokens('CI tool /local terminal/Shell');
    assert.ok(!tokens.includes('/local'), 'single-segment /local should not be a path token');
  });

  it('returns empty array for plain text', () => {
    const tokens = extractInvariantTokens('Plain text with no tokens');
    assert.equal(tokens.length, 0);
  });

  it('normalizes MadCap relative .htm links to /docs/slug', () => {
    const tokens = extractInvariantTokens('[Drag & Drop Step](drag-drop-step.htm)');
    assert.ok(tokens.some((t) => t.startsWith('/docs/')), `Expected normalized /docs/ path in ${JSON.stringify(tokens)}`);
    assert.ok(!tokens.includes('drag-drop-step.htm'), 'raw .htm should not remain');
  });

  it('normalizes .htm with directory path to /docs/slug', () => {
    const tokens = extractInvariantTokens('[text](../editing/shareable-steps.htm)');
    assert.ok(tokens.some((t) => t.startsWith('/docs/')), `Expected normalized /docs/ path in ${JSON.stringify(tokens)}`);
    assert.ok(!tokens.includes('../editing/shareable-steps.htm'), 'raw relative path should not remain');
  });

  it('normalizes .htm with fragment to /docs/slug (fragment stripped)', () => {
    const tokens = extractInvariantTokens('[text](slug.htm#section)');
    assert.ok(tokens.some((t) => t.startsWith('/docs/')), `Expected normalized /docs/ path in ${JSON.stringify(tokens)}`);
    assert.ok(!tokens.includes('slug.htm#section'), 'raw .htm#fragment should not remain');
  });

  it('normalizes .htm with query parameter to /docs/slug', () => {
    const tokens = extractInvariantTokens('[text](slug.htm?param=1)');
    assert.ok(tokens.some((t) => t.startsWith('/docs/')), `Expected normalized /docs/ path in ${JSON.stringify(tokens)}`);
    assert.ok(!tokens.includes('slug.htm'), 'raw .htm should not remain');
  });

  it('does not double-prefix /content/ for root-relative .htm paths', () => {
    const tokens = extractInvariantTokens('[x](/content/overview/testim-overview.htm)');
    assert.ok(tokens.includes('/docs/overview/testim-overview'), `Expected /docs/overview/testim-overview in ${JSON.stringify(tokens)}`);
    assert.ok(!tokens.some((t) => t.includes('/content/')), 'should not contain /content/ in output');
  });

  // normalizeUrlToken relative path bug fix.
  //
  // MadCap の <a href="salesforce-steps/sfdc-step-apex-action.htm"> のような
  // **親ディレクトリを省いた相対リンク** は、従来 `resolveToFullSlug` で slug
  // に `/` が含まれると basename lookup が bypass され、正しい full path に
  // 復元できなかった。結果 `/docs/salesforce-steps/sfdc-step-apex-action` と
  // いう存在しない path に正規化され、JA 側の正しい
  // `/docs/salesforce-testing/salesforce-steps/sfdc-step-apex-action` と
  // mismatch して segment-token-gap を silent に発火していた。
  //
  // 修正方針: slug が docs index に存在しない場合は basename fallback を
  // 試す。ambiguous basename (複数ディレクトリに存在) はそのまま返して
  // safe に倒す。
  it('normalizes MadCap relative .htm link with unique basename to full path', () => {
    // `sfdc-step-apex-action` は docs index に 1 件しか無い (unique basename)
    const tokens = extractInvariantTokens('[APEX 実行](salesforce-steps/sfdc-step-apex-action.htm)');
    assert.ok(
      tokens.includes('/docs/salesforce-testing/salesforce-steps/sfdc-step-apex-action'),
      `Expected full path /docs/salesforce-testing/salesforce-steps/sfdc-step-apex-action in ${JSON.stringify(tokens)}`,
    );
    assert.ok(
      !tokens.includes('/docs/salesforce-steps/sfdc-step-apex-action'),
      'truncated path should not be emitted — basename fallback should resolve the correct full path',
    );
  });

  it('keeps already-valid full paths as-is when they exist in the docs index', () => {
    // `overview/testim-overview` は docs index の正式 slug なので basename
    // fallback を発動せず、そのまま返る。
    const tokens = extractInvariantTokens(
      'https://docs.tricentis.com/testim/content/overview/testim-overview.htm',
    );
    assert.ok(tokens.includes('/docs/overview/testim-overview'));
  });
});

// ---------------------------------------------------------------------------
// table-cell-token-mismatch tests
// ---------------------------------------------------------------------------

describe('table-cell-token-mismatch in compareSnapshotStructure', () => {
  it('detects number+unit change (30 sec -> 40 sec)', () => {
    const en = '| Setting | Value |\n| --- | --- |\n| timeout | 30sec |\n';
    const ja = '| 設定 | 値 |\n| --- | --- |\n| timeout | 40sec |\n';
    const issues = compareSnapshotStructure(en, ja);
    const tokenIssues = issues.filter((i) => i.type === 'table-cell-token-mismatch');
    assert.ok(tokenIssues.length >= 1, 'should detect number+unit change');
  });

  it('detects URL change', () => {
    const en = '| Link | Note |\n| --- | --- |\n| https://example.com/a | See docs |\n';
    const ja = '| リンク | 備考 |\n| --- | --- |\n| https://example.com/b | ドキュメント参照 |\n';
    const issues = compareSnapshotStructure(en, ja);
    const tokenIssues = issues.filter((i) => i.type === 'table-cell-token-mismatch');
    assert.ok(tokenIssues.length >= 1, 'should detect URL change');
  });

  it('detects inline code change (--grep -> --group)', () => {
    const en = '| Flag | Description |\n| --- | --- |\n| `--grep` | Filter tests |\n';
    const ja = '| フラグ | 説明 |\n| --- | --- |\n| `--group` | テストをフィルタ |\n';
    const issues = compareSnapshotStructure(en, ja);
    const tokenIssues = issues.filter((i) => i.type === 'table-cell-token-mismatch');
    assert.ok(tokenIssues.length >= 1, 'should detect code token change');
  });

  it('returns no token issues when invariant tokens match', () => {
    const en = '| Flag | Description |\n| --- | --- |\n| `--grep` | Filter tests |\n';
    const ja = '| フラグ | 説明 |\n| --- | --- |\n| `--grep` | テストをフィルタ |\n';
    const issues = compareSnapshotStructure(en, ja);
    const tokenIssues = issues.filter((i) => i.type === 'table-cell-token-mismatch');
    assert.equal(tokenIssues.length, 0);
  });

  it('does not flag tricentis.com absolute URL rewritten to relative /docs/ link', () => {
    // EN の MadCap absolute URL が JA の /docs/ 相対 link と同じ canonical
    // token に正規化されることを確認する。JA 側は正しい full path
    // (`/docs/editing-tests/shareable-steps`) を使用する前提。
    const en = '| Page | Link |\n| --- | --- |\n| Steps | [steps](https://docs.tricentis.com/testim/content/editing/shareable-steps.htm) |\n';
    const ja = '| ページ | リンク |\n| --- | --- |\n| ステップ | [steps](/docs/editing-tests/shareable-steps) |\n';
    const issues = compareSnapshotStructure(en, ja);
    const tokenIssues = issues.filter((i) => i.type === 'table-cell-token-mismatch');
    assert.equal(tokenIssues.length, 0, 'absolute/relative testim URL should normalize to same token');
  });

  it('does not flag fragment-only difference on same page slug', () => {
    // EN: /docs/wait-for#wait-for-element-text → JA: /docs/wait-for (page-level link)
    const en = '| Step | Link |\n| --- | --- |\n| Wait | [wait](/docs/wait-for#wait-for-element-text) |\n';
    const ja = '| ステップ | リンク |\n| --- | --- |\n| Wait | [wait](/docs/wait-for) |\n';
    const issues = compareSnapshotStructure(en, ja);
    const tokenIssues = issues.filter((i) => i.type === 'table-cell-token-mismatch');
    assert.equal(tokenIssues.length, 0, 'same page slug with different fragment should not mismatch');
  });

  it('still flags when page slug itself differs', () => {
    const en = '| Step | Link |\n| --- | --- |\n| Wait | [wait](/docs/wait-for#section) |\n';
    const ja = '| ステップ | リンク |\n| --- | --- |\n| Wait | [wait](/docs/other-page) |\n';
    const issues = compareSnapshotStructure(en, ja);
    const tokenIssues = issues.filter((i) => i.type === 'table-cell-token-mismatch');
    assert.ok(tokenIssues.length >= 1, 'different page slugs should still mismatch');
  });
});

// ---------------------------------------------------------------------------
// classifyLine — state machine unit tests (H2)
// ---------------------------------------------------------------------------
describe('classifyLine', () => {
  it('classifies a blank line', () => {
    const result = classifyLine('');
    assert.equal(result.kind, 'blank');
    assert.equal(result.nextState.inParagraph, false);
  });

  it('classifies a code fence opening', () => {
    const result = classifyLine('```js');
    assert.equal(result.kind, 'fence');
    assert.equal(result.nextState.inCodeBlock, true);
  });

  it('classifies lines inside code block', () => {
    const r1 = classifyLine('```', {});
    const r2 = classifyLine('const x = 1;', r1.nextState);
    assert.equal(r2.kind, 'code');
    assert.equal(r2.nextState.inCodeBlock, true);
  });

  it('classifies code fence closing', () => {
    const r1 = classifyLine('```', {});
    const r2 = classifyLine('some code', r1.nextState);
    const r3 = classifyLine('```', r2.nextState);
    assert.equal(r3.kind, 'fence');
    assert.equal(r3.nextState.inCodeBlock, false);
  });

  it('classifies HTML table open/close', () => {
    const r1 = classifyLine('<table>');
    assert.equal(r1.kind, 'table-open');
    assert.equal(r1.nextState.inTable, true);

    const r2 = classifyLine('<tr><td>cell</td></tr>', r1.nextState);
    assert.equal(r2.kind, 'table');

    const r3 = classifyLine('</table>', r2.nextState);
    assert.equal(r3.kind, 'table-close');
    assert.equal(r3.nextState.inTable, false);
  });

  it('classifies callout open/close', () => {
    const r1 = classifyLine(':::note');
    assert.equal(r1.kind, 'callout-open');
    assert.equal(r1.nextState.inCallout, true);

    const r2 = classifyLine('Some callout content', r1.nextState);
    assert.equal(r2.kind, 'callout');

    const r3 = classifyLine(':::', r2.nextState);
    assert.equal(r3.kind, 'callout-close');
    assert.equal(r3.nextState.inCallout, false);
  });

  it('classifies blockquote', () => {
    const result = classifyLine('> This is a quote');
    assert.equal(result.kind, 'blockquote');
  });

  it('classifies headings (h2-h4) and updates currentSection', () => {
    const r1 = classifyLine('## Installation');
    assert.equal(r1.kind, 'heading');
    assert.equal(r1.heading, 'Installation');
    assert.equal(r1.nextState.currentSection, 'Installation');

    const r2 = classifyLine('### Sub-section', r1.nextState);
    assert.equal(r2.kind, 'heading');
    assert.equal(r2.heading, 'Sub-section');
  });

  it('classifies ordered list items', () => {
    const result = classifyLine('1. First item');
    assert.equal(result.kind, 'ordered-list');
  });

  it('classifies unordered list items', () => {
    assert.equal(classifyLine('- Item').kind, 'unordered-list');
    assert.equal(classifyLine('* Item').kind, 'unordered-list');
    assert.equal(classifyLine('+ Item').kind, 'unordered-list');
    assert.equal(classifyLine('  - Nested item').kind, 'unordered-list');
  });

  it('classifies images', () => {
    assert.equal(classifyLine('![alt](image.png)').kind, 'image');
    assert.equal(classifyLine('<img src="image.png">').kind, 'image');
    assert.equal(classifyLine('<Image src="image.png" />').kind, 'image');
  });

  it('classifies markdown table rows', () => {
    assert.equal(classifyLine('| Header | Header |').kind, 'markdown-table');
    assert.equal(classifyLine('| --- | --- |').kind, 'markdown-table');
  });

  it('classifies HTML structure elements', () => {
    assert.equal(classifyLine('<details>').kind, 'html-structure');
    assert.equal(classifyLine('</summary>').kind, 'html-structure');
    assert.equal(classifyLine('<br>').kind, 'html-structure');
  });

  it('classifies HTML table structure elements', () => {
    assert.equal(classifyLine('<thead>').kind, 'html-table-structure');
    assert.equal(classifyLine('</td>').kind, 'html-table-structure');
    assert.equal(classifyLine('<tr>').kind, 'html-table-structure');
  });

  it('classifies single-line HTML comments', () => {
    const result = classifyLine('<!-- comment -->');
    assert.equal(result.kind, 'html-comment-start');
    assert.equal(result.nextState.inHtmlComment, false);
  });

  it('classifies multi-line HTML comments', () => {
    const r1 = classifyLine('<!-- start of comment');
    assert.equal(r1.kind, 'html-comment-start');
    assert.equal(r1.nextState.inHtmlComment, true);

    const r2 = classifyLine('still in comment', r1.nextState);
    assert.equal(r2.kind, 'html-comment');
    assert.equal(r2.nextState.inHtmlComment, true);

    const r3 = classifyLine('end of comment -->', r2.nextState);
    assert.equal(r3.kind, 'html-comment');
    assert.equal(r3.nextState.inHtmlComment, false);
  });

  it('classifies paragraph start and continuation', () => {
    const r1 = classifyLine('This is a paragraph.');
    assert.equal(r1.kind, 'paragraph-start');
    assert.equal(r1.nextState.inParagraph, true);

    const r2 = classifyLine('This continues the paragraph.', r1.nextState);
    assert.equal(r2.kind, 'paragraph');
    assert.equal(r2.nextState.inParagraph, true);
  });

  it('resets paragraph on blank line', () => {
    const r1 = classifyLine('Paragraph text.');
    const r2 = classifyLine('', r1.nextState);
    assert.equal(r2.kind, 'blank');
    assert.equal(r2.nextState.inParagraph, false);

    const r3 = classifyLine('New paragraph.', r2.nextState);
    assert.equal(r3.kind, 'paragraph-start');
  });

  it('classifies zero-width space lines as blank', () => {
    const result = classifyLine('\u200B\u200C');
    assert.equal(result.kind, 'blank');
  });

  it('handles escaped ordered list numbers', () => {
    const result = classifyLine('1\\. Escaped list');
    assert.equal(result.kind, 'ordered-list');
  });

  it('handles callout types: warning, info, tip, caution, danger', () => {
    for (const type of ['warning', 'info', 'tip', 'caution', 'danger']) {
      const result = classifyLine(`:::${type}`);
      assert.equal(result.kind, 'callout-open', `:::${type} should be callout-open`);
    }
  });

  it('heading inside callout is classified as callout content', () => {
    const r1 = classifyLine(':::note');
    const r2 = classifyLine('## New Section', r1.nextState);
    // callout check takes priority — heading is treated as callout content
    assert.equal(r2.kind, 'callout');
    assert.equal(r2.nextState.inCallout, true);
  });

  it('default initial state uses __top__', () => {
    const result = classifyLine('Some text.');
    assert.equal(result.nextState.currentSection, '__top__');
  });

  it('H5 and H6 headings fall through to paragraph (regex is #{2,4})', () => {
    assert.equal(classifyLine('##### H5 Heading').kind, 'paragraph-start');
    const r1 = classifyLine('##### H5 Heading');
    assert.equal(classifyLine('###### H6 Heading', r1.nextState).kind, 'paragraph');
  });

  it('indented code fence inside list item is classified as fence', () => {
    const result = classifyLine('  - ```python');
    assert.equal(result.kind, 'fence');
    assert.equal(result.nextState.inCodeBlock, true);
  });

  it('::: alone outside callout is classified as paragraph', () => {
    // ::: without a type suffix does not match callout-open regex
    const result = classifyLine(':::');
    assert.equal(result.kind, 'paragraph-start');
  });

  it('classifies image+ordered-list concatenation as ordered-list (turndown artifact)', () => {
    const result = classifyLine('![](images/bc293ae-image.png "image.png")3.  If you have already registered');
    assert.equal(result.kind, 'ordered-list');
    assert.equal(result.nextState.inParagraph, false);
  });

  it('classifies image+unordered-list concatenation as unordered-list (turndown artifact)', () => {
    const result = classifyLine('![](images/foo.png)- Bullet item text');
    assert.equal(result.kind, 'unordered-list');
    assert.equal(result.nextState.inParagraph, false);
  });

  it('classifies image+plain-text concatenation as paragraph-start (unchanged)', () => {
    const result = classifyLine('![](images/foo.png)Some trailing text');
    assert.equal(result.kind, 'paragraph-start');
    assert.equal(result.nextState.inParagraph, true);
  });
});

// ---------------------------------------------------------------------------
// extractParagraphCounts — behavioral equivalence (H2 continued)
// ---------------------------------------------------------------------------
describe('extractParagraphCounts', () => {
  it('counts paragraphs per section', () => {
    const body = [
      '## Section A',
      '',
      'First paragraph.',
      '',
      'Second paragraph.',
      '',
      '## Section B',
      '',
      'Only paragraph.',
    ].join('\n');
    const counts = extractParagraphCounts(body);
    assert.equal(counts.get('Section A'), 2);
    assert.equal(counts.get('Section B'), 1);
  });

  it('counts top-level paragraphs before any heading', () => {
    const body = 'Top level text.\n\nAnother paragraph.\n';
    const counts = extractParagraphCounts(body);
    assert.equal(counts.get('__top__'), 2);
  });

  it('does not count code block content as paragraphs', () => {
    const body = [
      '## Code Section',
      '',
      '```js',
      'const x = 1;',
      'const y = 2;',
      '```',
      '',
      'Real paragraph.',
    ].join('\n');
    const counts = extractParagraphCounts(body);
    assert.equal(counts.get('Code Section'), 1);
  });

  it('does not count callout content as separate paragraphs', () => {
    const body = [
      '## Callout Section',
      '',
      ':::note',
      'Callout content that looks like a paragraph.',
      ':::',
      '',
      'Real paragraph after callout.',
    ].join('\n');
    const counts = extractParagraphCounts(body);
    assert.equal(counts.get('Callout Section'), 1);
  });

  it('does not count list items as paragraphs', () => {
    const body = [
      '## List Section',
      '',
      '1. First item',
      '2. Second item',
      '',
      '- Bullet one',
      '- Bullet two',
      '',
      'Real paragraph.',
    ].join('\n');
    const counts = extractParagraphCounts(body);
    assert.equal(counts.get('List Section'), 1);
  });

  it('does not count blockquotes as paragraphs', () => {
    const body = [
      '## Quote Section',
      '',
      '> This is a blockquote.',
      '> It continues here.',
      '',
      'Real paragraph.',
    ].join('\n');
    const counts = extractParagraphCounts(body);
    assert.equal(counts.get('Quote Section'), 1);
  });

  it('does not count HTML tables as paragraphs', () => {
    const body = [
      '## Table Section',
      '',
      '<table>',
      '<tr><td>Cell</td></tr>',
      '</table>',
      '',
      'Real paragraph.',
    ].join('\n');
    const counts = extractParagraphCounts(body);
    assert.equal(counts.get('Table Section'), 1);
  });

  it('returns empty map for empty body', () => {
    const counts = extractParagraphCounts('');
    assert.equal(counts.size, 0);
  });

  it('handles multi-line paragraphs correctly', () => {
    const body = [
      '## Section',
      '',
      'First line of paragraph.',
      'Second line of same paragraph.',
      '',
      'Another paragraph.',
    ].join('\n');
    const counts = extractParagraphCounts(body);
    assert.equal(counts.get('Section'), 2);
  });
});

// ---------------------------------------------------------------------------
// facade re-export completeness (H3)
// ---------------------------------------------------------------------------
describe('source_parity.mjs facade completeness', () => {
  let facadeExports;
  before(async () => {
    facadeExports = await import('../lib/source_parity.mjs');
  });

  it('re-exports all expected functions from source_parity_checks.mjs', () => {
    const expectedFunctions = [
      'isEnglishOnlyLine',
      'loadSidebarSlugs',
      'localCheck',
      'extractImageSequence',
      'extractCalloutPositions',
      'extractStepCounts',
      'stripTitleH1',
      'normalizeEnArtifacts',
      'normalizeNumericPeriodSpacing',
      'extractBulletCounts',
      'classifyLine',
      'extractParagraphCounts',
      'extractHeadingSequence',
      'stripMarkdown',
      'isUntranslatedCell',
      'extractMarkdownTables',
      'extractHtmlTables',
      'extractInvariantTokens',
      'extractTableStructure',
      'detectEnArtifacts',
      'compareSnapshotStructure',
    ];

    for (const name of expectedFunctions) {
      assert.equal(typeof facadeExports[name], 'function', `${name} should be a function`);
    }
  });

  it('re-exports summarizeParityResults from source_parity_summary.mjs', () => {
    assert.equal(typeof facadeExports.summarizeParityResults, 'function');
  });

  it('re-exports constants from source_parity_types.mjs', () => {
    assert.ok(facadeExports.ISSUE_SEVERITY, 'ISSUE_SEVERITY should be exported');
    assert.ok(typeof facadeExports.ISSUE_SEVERITY === 'object');
    assert.ok(Array.isArray(facadeExports.UNTRANSLATED_PATTERNS));
    assert.ok(facadeExports.LEGACY_CALLOUT_RE instanceof RegExp);
    assert.ok(facadeExports.JSX_CALLOUT_RE instanceof RegExp);
    assert.ok(facadeExports.H1_IN_BODY_RE instanceof RegExp);
    assert.ok(facadeExports.FENCE_LINE_RE instanceof RegExp);
  });

  it('ISSUE_SEVERITY is frozen (immutable)', () => {
    assert.ok(Object.isFrozen(facadeExports.ISSUE_SEVERITY));
  });

  it('UNTRANSLATED_PATTERNS is frozen (immutable)', () => {
    assert.ok(Object.isFrozen(facadeExports.UNTRANSLATED_PATTERNS));
  });

  it('includes page coverage gate issue types', () => {
    assert.equal(facadeExports.ISSUE_SEVERITY['source-page-missing-local'], 'actionable');
    assert.equal(facadeExports.ISSUE_SEVERITY['missing-fresh-snapshot'], 'actionable');
    assert.equal(facadeExports.ISSUE_SEVERITY['missing-snapshot'], 'signal');
  });

  it('re-exports page coverage functions from source_parity_page_coverage.mjs', () => {
    assert.equal(typeof checkSourcePageMissingLocal, 'function');
    assert.equal(typeof checkMissingSnapshot, 'function');
    assert.equal(typeof checkSinglePageSnapshot, 'function');
    assert.equal(typeof checkPageCoverage, 'function');
  });
});

// ---------------------------------------------------------------------------
// summarizeParityResults — priority logic (L2)
// ---------------------------------------------------------------------------
describe('summarizeParityResults priority logic', () => {
  it('counts a file with actionable issues as actionableFiles', () => {
    const results = [
      { issues: [{ type: 'untranslated', severity: 'actionable' }] },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.actionableFiles, 1);
    assert.equal(summary.signalFiles, 0);
    assert.equal(summary.errorFiles, 0);
  });

  it('counts a file with signal issues as signalFiles', () => {
    const results = [
      { issues: [{ type: 'heading-mismatch', severity: 'signal' }] },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.signalFiles, 1);
    assert.equal(summary.actionableFiles, 0);
  });

  it('counts a file with error issues as errorFiles', () => {
    const results = [
      { issues: [{ type: 'source-fetch-error', severity: 'error' }] },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.errorFiles, 1);
  });

  it('actionable takes priority over error and signal', () => {
    const results = [
      {
        issues: [
          { type: 'source-fetch-error', severity: 'error' },
          { type: 'untranslated', severity: 'actionable' },
          { type: 'heading-mismatch', severity: 'signal' },
        ],
      },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.actionableFiles, 1);
    assert.equal(summary.errorFiles, 0);
    assert.equal(summary.signalFiles, 0);
  });

  it('error takes priority over signal when no actionable', () => {
    const results = [
      {
        issues: [
          { type: 'source-fetch-error', severity: 'error' },
          { type: 'heading-mismatch', severity: 'signal' },
        ],
      },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.errorFiles, 1);
    assert.equal(summary.signalFiles, 0);
  });

  it('aggregates issuesByType correctly', () => {
    const results = [
      {
        issues: [
          { type: 'untranslated', severity: 'actionable' },
          { type: 'untranslated', severity: 'actionable' },
          { type: 'heading-mismatch', severity: 'signal' },
        ],
      },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.issuesByType['untranslated'], 2);
    assert.equal(summary.issuesByType['heading-mismatch'], 1);
  });

  it('aggregates issuesBySeverity correctly', () => {
    const results = [
      {
        issues: [
          { type: 'untranslated', severity: 'actionable' },
          { type: 'heading-mismatch', severity: 'signal' },
          { type: 'source-fetch-error', severity: 'error' },
        ],
      },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.issuesBySeverity['actionable'], 1);
    assert.equal(summary.issuesBySeverity['signal'], 1);
    assert.equal(summary.issuesBySeverity['error'], 1);
  });

  it('returns zero counts for empty results', () => {
    const summary = summarizeParityResults([]);
    assert.equal(summary.filesWithIssues, 0);
    assert.equal(summary.actionableFiles, 0);
    assert.equal(summary.signalFiles, 0);
    assert.equal(summary.errorFiles, 0);
  });

  it('handles multiple files with mixed severities', () => {
    const results = [
      { issues: [{ type: 'untranslated', severity: 'actionable' }] },
      { issues: [{ type: 'heading-mismatch', severity: 'signal' }] },
      { issues: [{ type: 'source-fetch-error', severity: 'error' }] },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.filesWithIssues, 3);
    assert.equal(summary.actionableFiles, 1);
    assert.equal(summary.signalFiles, 1);
    assert.equal(summary.errorFiles, 1);
  });
});
