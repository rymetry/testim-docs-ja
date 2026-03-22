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
