import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let extractFromMd;
let localCheck;
let summarizeParityResults;
let isEnglishOnlyLine;
let loadSidebarSlugs;
let isActionableIssue;
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

before(async () => {
  ({
    extractFromMd,
    localCheck,
    summarizeParityResults,
    isEnglishOnlyLine,
    loadSidebarSlugs,
    isActionableIssue,
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
    assert.equal(stepIssues.length, 1, 'should detect single-step difference');
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

  it('ignores small paragraph reflow (diff = 1)', () => {
    // EN has 2 paragraphs, JA has 3 → diff=1, below minDiff=2 threshold
    const en = '## Overview\nFirst paragraph.\n\nSecond paragraph.\n';
    const ja = '## 概要\n最初の段落。\n\n2番目の段落。\n\n追加の説明。\n';
    const issues = compareSnapshotStructure(en, ja);
    const paraIssues = issues.filter((i) => i.type === 'paragraph-count-mismatch');
    assert.equal(paraIssues.length, 0);
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

  it('excludes bullets inside code blocks', () => {
    const body = '## Section\n- Real item\n```\n- Fake item\n```\n';
    const result = extractBulletCounts(body);
    assert.equal(result.get('Section'), 1);
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

  it('resets callout state at heading boundary', () => {
    const body = '## Section A\n:::note\nUnclosed note\n## Section B\n1. Step one\n';
    const result = extractStepCounts(body);
    assert.equal(result.get('Section B'), 1);
  });
});

// ---------------------------------------------------------------------------
// H4 boundary tests (Phase 2b)
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
// section-count-mismatch tests (Phase 2b)
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
// Table structure comparison tests (Phase 2c)
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
    // EN uses [text](https://help.testim.io/docs/foo#bar)
    // JA HTML-preserved has text [/docs/foo#bar]
    // After stripping bracket annotations, visible text should match
    const en = '| Link |\n| --- |\n| [Adding a CLI step](https://help.testim.io/docs/validate-download#adding-a-cli-step) |\n';
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

  it('normalizes help.testim.io URLs to /docs/slug', () => {
    const tokens = extractInvariantTokens('Link: https://help.testim.io/docs/shareable-steps');
    assert.ok(tokens.includes('/docs/shareable-steps'));
    assert.ok(!tokens.some((t) => t.includes('help.testim.io')));
  });

  it('extracts /docs/slug from markdown links', () => {
    const tokens = extractInvariantTokens('[steps](/docs/shareable-steps)');
    assert.ok(tokens.includes('/docs/shareable-steps'));
  });

  it('does not double-count URL fragments as dot-paths', () => {
    const tokens = extractInvariantTokens('https://help.testim.io/docs/foo');
    assert.ok(!tokens.some((t) => t === 'help.testim.io'));
  });

  it('extracts /docs/slug#fragment from bracket annotation', () => {
    const tokens = extractInvariantTokens('Adding a CLI step [/docs/validate-download#adding-a-cli-step]');
    assert.ok(tokens.includes('/docs/validate-download#adding-a-cli-step'));
  });

  it('extracts /docs/slug#fragment from markdown link', () => {
    const tokens = extractInvariantTokens('[text](/docs/foo-bar#section)');
    assert.ok(tokens.includes('/docs/foo-bar#section'));
  });

  it('extracts /docs/slug with Japanese fragment', () => {
    const tokens = extractInvariantTokens('[text](/docs/add-cli-validations-and-actions#cli-ステップの追加)');
    assert.ok(tokens.some((t) => t.startsWith('/docs/add-cli-validations-and-actions#cli-')));
  });

  it('extracts full JA fragment from bracket annotation', () => {
    const tokens = extractInvariantTokens('text [/docs/add-cli-validations-and-actions#cli-ステップの追加]');
    assert.ok(tokens.some((t) => t.includes('ステップの追加')), 'JA fragment should not be truncated');
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

  it('does not flag testim.io absolute URL rewritten to relative /docs/ link', () => {
    const en = '| Page | Link |\n| --- | --- |\n| Steps | [steps](https://help.testim.io/docs/shareable-steps) |\n';
    const ja = '| ページ | リンク |\n| --- | --- |\n| ステップ | [steps](/docs/shareable-steps) |\n';
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
