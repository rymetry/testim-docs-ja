import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let applySuppressions;
let buildStructuralIssues;
let extractFromMd;
let localCheck;
let remoteCheck;
let summarizeParityResults;

before(async () => {
  ({
    applySuppressions,
    buildStructuralIssues,
    extractFromMd,
    localCheck,
    remoteCheck,
    summarizeParityResults,
  } = await import(
    '../lib/source_parity.mjs'
  ));
});

describe('extractFromMd', () => {
  it('counts markdown, Image, img, and list-item fenced code blocks', () => {
    const body = `
## Section

![Screenshot](/images/one.png)
<Image src="/images/two.png" alt={123} />
<img src="/images/three.png" alt="inline" />

1. Step
-   \`\`\`js
   const value = 1;
   \`\`\`

![Screenshot](/images/four.png)
`;

    const result = extractFromMd(body);
    assert.equal(result.h2Count, 1);
    assert.equal(result.imgCount, 4);
    assert.equal(result.codeBlockCount, 1);
  });
});

describe('buildStructuralIssues', () => {
  it('marks heading mismatch as signal and missing image/code blocks as actionable', () => {
    const issues = buildStructuralIssues(
      { h2Count: 8, imgCount: 10, codeBlockCount: 4 },
      { h2Count: 4, imgCount: 5, codeBlockCount: 1 },
    );

    const heading = issues.find((issue) => issue.type === 'heading-mismatch');
    const image = issues.find((issue) => issue.type === 'image-mismatch');
    const code = issues.find((issue) => issue.type === 'codeblock-mismatch');

    assert.equal(heading.severity, 'signal');
    assert.equal(image.severity, 'actionable');
    assert.equal(code.severity, 'actionable');
  });

  it('includes delta on structural issues', () => {
    const issues = buildStructuralIssues(
      { h2Count: 9, imgCount: 9, codeBlockCount: 5 },
      { h2Count: 1, imgCount: 0, codeBlockCount: 2 },
    );

    const heading = issues.find((issue) => issue.type === 'heading-mismatch');
    const image = issues.find((issue) => issue.type === 'image-mismatch');
    const code = issues.find((issue) => issue.type === 'codeblock-mismatch');

    assert.equal(heading.delta, 8);
    assert.equal(image.delta, 9);
    assert.equal(code.delta, 3);
  });

  it('does not flag extra local code examples as a mismatch', () => {
    const issues = buildStructuralIssues(
      { h2Count: 2, imgCount: 4, codeBlockCount: 1 },
      { h2Count: 2, imgCount: 4, codeBlockCount: 5 },
    );

    assert.equal(
      issues.some((issue) => issue.type === 'codeblock-mismatch'),
      false,
    );
  });
});

describe('applySuppressions', () => {
  it('suppresses issues when delta matches expected value', () => {
    const issues = buildStructuralIssues(
      { h2Count: 9, imgCount: 9, codeBlockCount: 0 },
      { h2Count: 1, imgCount: 0, codeBlockCount: 0 },
    );

    const filtered = applySuppressions(issues, 'salesforce-testing-overview');
    assert.equal(filtered.length, 0);
  });

  it('lifts suppression when delta drifts from expected value', () => {
    const issues = buildStructuralIssues(
      { h2Count: 11, imgCount: 11, codeBlockCount: 0 },
      { h2Count: 1, imgCount: 0, codeBlockCount: 0 },
    );

    const filtered = applySuppressions(issues, 'salesforce-testing-overview');
    assert.equal(filtered.length, 2);
    assert.ok(filtered.some((i) => i.type === 'heading-mismatch'));
    assert.ok(filtered.some((i) => i.type === 'image-mismatch'));
  });

  it('passes through non-suppressed issue types on a suppressed slug', () => {
    const issues = buildStructuralIssues(
      { h2Count: 9, imgCount: 9, codeBlockCount: 5 },
      { h2Count: 1, imgCount: 0, codeBlockCount: 2 },
    );

    const filtered = applySuppressions(issues, 'salesforce-testing-overview');
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].type, 'codeblock-mismatch');
  });

  it('passes through issues for unsuppressed slugs', () => {
    const issues = buildStructuralIssues(
      { h2Count: 8, imgCount: 10, codeBlockCount: 0 },
      { h2Count: 2, imgCount: 3, codeBlockCount: 0 },
    );

    const filtered = applySuppressions(issues, 'some-other-page');
    assert.equal(filtered.length, issues.length);
  });
});

describe('localCheck', () => {
  it('detects untranslated english lines and annotates severity', () => {
    const issues = localCheck({
      body: '1. Click on the **Settings** button.\n',
      sidebarSlugs: new Set(['sample']),
      slug: 'sample',
    });

    assert.equal(issues.length, 1);
    assert.equal(issues[0].type, 'untranslated');
    assert.equal(issues[0].severity, 'actionable');
  });
});

describe('remoteCheck', () => {
  it('returns a signal when article extraction fails', async () => {
    const issues = await remoteCheck('https://help.testim.io/docs/example', '## Local', {
      fetchImpl: async () => ({
        ok: true,
        async text() {
          return '<main><p>Updated 6 months ago</p></main>';
        },
      }),
      now: new Date('2026-03-19T00:00:00Z'),
    });

    assert.equal(issues.length, 1);
    assert.equal(issues[0].type, 'content-root-missing');
    assert.equal(issues[0].severity, 'signal');
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
});
