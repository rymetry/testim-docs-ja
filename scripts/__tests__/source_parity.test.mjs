import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let extractFromMd;
let localCheck;
let summarizeParityResults;
let isEnglishOnlyLine;
let loadSidebarSlugs;
let isActionableIssue;

before(async () => {
  ({
    extractFromMd,
    localCheck,
    summarizeParityResults,
    isEnglishOnlyLine,
    loadSidebarSlugs,
    isActionableIssue,
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
- ✅ https://help.testim.io/docs/testim-overview
- ✅ https://help.testim.io/docs/getting-started
## Other
- https://help.testim.io/docs/advanced-config
`;
    const slugs = loadSidebarSlugs(text);
    assert.equal(slugs.size, 3);
    assert.ok(slugs.has('testim-overview'));
    assert.ok(slugs.has('getting-started'));
    assert.ok(slugs.has('advanced-config'));
  });

  it('returns empty set for text without URLs', () => {
    const slugs = loadSidebarSlugs('No URLs here');
    assert.equal(slugs.size, 0);
  });
});

describe('isActionableIssue', () => {
  it('returns true for actionable severity', () => {
    assert.equal(isActionableIssue({ severity: 'actionable' }), true);
  });

  it('returns false for signal or error severity', () => {
    assert.equal(isActionableIssue({ severity: 'signal' }), false);
    assert.equal(isActionableIssue({ severity: 'error' }), false);
  });
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

  it('counts h3 headings', () => {
    const body = '## H2\n### H3 one\n### H3 two\n';
    const result = extractFromMd(body);
    assert.equal(result.h2Count, 1);
    assert.equal(result.h3Count, 2);
  });

  it('counts ::: callouts and legacy callouts', () => {
    const body = ':::note\nSome note\n:::\n\n> 📘 Legacy callout\n';
    const result = extractFromMd(body);
    // ::: open + ::: close = 2 matches, plus 1 legacy
    assert.ok(result.calloutCount >= 2);
  });

  it('returns zeros for empty body', () => {
    const result = extractFromMd('');
    assert.equal(result.h2Count, 0);
    assert.equal(result.imgCount, 0);
    assert.equal(result.codeBlockCount, 0);
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
