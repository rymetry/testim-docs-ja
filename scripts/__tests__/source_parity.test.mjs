import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let extractFromMd;
let localCheck;
let summarizeParityResults;

before(async () => {
  ({
    extractFromMd,
    localCheck,
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

  it('detects legacy callout (blockquote emoji pattern)', () => {
    const issues = localCheck({
      body: '> 📘 This is a callout\n> Some content\n',
      sidebarSlugs: new Set(['sample']),
      slug: 'sample',
    });

    const legacyIssues = issues.filter((i) => i.type === 'legacy-callout');
    assert.ok(legacyIssues.length > 0);
    assert.equal(legacyIssues[0].severity, 'actionable');
  });

  it('detects JSX callout component', () => {
    const issues = localCheck({
      body: '<Callout type="info">Note text</Callout>\n',
      sidebarSlugs: new Set(['sample']),
      slug: 'sample',
    });

    const jsxIssues = issues.filter((i) => i.type === 'jsx-callout');
    assert.ok(jsxIssues.length > 0);
    assert.equal(jsxIssues[0].severity, 'actionable');
  });

  it('detects h1 in body (not at first line)', () => {
    const issues = localCheck({
      body: 'Some intro text\n# This is an H1 in body\n',
      sidebarSlugs: new Set(['sample']),
      slug: 'sample',
    });

    const h1Issues = issues.filter((i) => i.type === 'h1-in-body');
    assert.ok(h1Issues.length > 0);
    assert.equal(h1Issues[0].severity, 'actionable');
  });

  it('does not flag h1 at the first line', () => {
    const issues = localCheck({
      body: '# Title at first line\nSome content\n',
      sidebarSlugs: new Set(['sample']),
      slug: 'sample',
    });

    const h1Issues = issues.filter((i) => i.type === 'h1-in-body');
    assert.equal(h1Issues.length, 0);
  });

  it('detects orphan page (not in sidebar)', () => {
    const issues = localCheck({
      body: 'Some content\n',
      sidebarSlugs: new Set(['other-page']),
      slug: 'missing-from-sidebar',
    });

    const orphanIssues = issues.filter((i) => i.type === 'orphan-page');
    assert.ok(orphanIssues.length > 0);
  });

  it('skips detection inside code blocks', () => {
    const issues = localCheck({
      body: '```\n> 📘 Inside code block\n<Callout>Also inside</Callout>\n# H1 inside code\nClick on the **Settings** button.\n```\n',
      sidebarSlugs: new Set(['sample']),
      slug: 'sample',
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
});
