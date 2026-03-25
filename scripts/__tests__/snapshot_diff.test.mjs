import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let classifyChanges;
let CHANGE_CLASSIFIERS;
let MARKER_404_RE;
let parseArgs;

before(async () => {
  ({ classifyChanges, CHANGE_CLASSIFIERS, MARKER_404_RE, parseArgs } = await import(
    '../snapshot_diff.mjs'
  ));
});

// ---------------------------------------------------------------------------
// classifyLine (via CHANGE_CLASSIFIERS)
// ---------------------------------------------------------------------------
function classifyLine(line) {
  for (const { type, pattern } of CHANGE_CLASSIFIERS) {
    if (pattern.test(line)) return type;
  }
  return 'content';
}

describe('classifyLine (via CHANGE_CLASSIFIERS)', () => {
  it('classifies heading lines', () => {
    assert.equal(classifyLine('## New Section'), 'heading');
    assert.equal(classifyLine('### Sub heading'), 'heading');
    assert.equal(classifyLine('# Title'), 'heading');
    assert.equal(classifyLine('   ## Indented heading'), 'heading');
    assert.equal(classifyLine('<h2>HTML Section</h2>'), 'heading');
    assert.equal(classifyLine('  </h3>'), 'heading');
  });

  it('classifies image syntax', () => {
    assert.equal(classifyLine('![test](test.png)'), 'image');
    assert.equal(classifyLine('<Image align="center" src="test.png" />'), 'image');
    assert.equal(classifyLine('<img src="test.png" alt="test">'), 'image');
  });

  it('classifies code fence lines', () => {
    assert.equal(classifyLine('```javascript'), 'code');
    assert.equal(classifyLine('```'), 'code');
    assert.equal(classifyLine('  ```python'), 'code');
    assert.equal(classifyLine('<pre>'), 'code');
    assert.equal(classifyLine('  </pre>'), 'code');
  });

  it('classifies callout lines', () => {
    assert.equal(classifyLine('> 📘 Note title'), 'callout');
    assert.equal(classifyLine('> 👍 Success'), 'callout');
    assert.equal(classifyLine('> ⚠️ Warning message'), 'callout');
    assert.equal(classifyLine('<Callout icon="📘" theme="info">'), 'callout');
    assert.equal(classifyLine('  <Callout icon="💡" theme="default">'), 'callout');
    assert.equal(classifyLine('  <blockquote theme="📘">'), 'callout');
  });

  it('classifies other content', () => {
    assert.equal(classifyLine('Some text here'), 'content');
    assert.equal(classifyLine('[Link](/docs/foo)'), 'content');
    assert.equal(classifyLine('> quoted text without emoji'), 'content');
    assert.equal(classifyLine('    ## Too much indent (4 spaces)'), 'content');
  });
});

// ---------------------------------------------------------------------------
// classifyChanges (imported from source)
// ---------------------------------------------------------------------------
describe('classifyChanges', () => {
  it('detects heading addition', () => {
    const head = '## Section 1\n\nText';
    const current = '## Section 1\n\n## Section 2\n\nText';

    const result = classifyChanges(head, current);
    assert.equal(result.categories.heading.added, 1);
    assert.equal(result.categories.heading.removed, 0);
  });

  it('detects image removal', () => {
    const head = '![old](old.png)\n\nText';
    const current = 'Text';

    const result = classifyChanges(head, current);
    assert.equal(result.categories.image.removed, 1);
    assert.equal(result.categories.image.added, 0);
  });

  it('detects HTML structural changes', () => {
    const head = '<img src="old.png" alt="old">\n<h2>Section 1</h2>\nText';
    const current = '<Image align="center" src="new.png" />\n<h2>Section 2</h2>\nText';

    const result = classifyChanges(head, current);
    assert.ok(result.categories.image.added > 0 || result.categories.image.removed > 0);
    assert.ok(result.categories.heading.added > 0 || result.categories.heading.removed > 0);
  });

  it('detects code block changes', () => {
    const head = '```\nold code\n```';
    const current = '```\nnew code\n```';

    const result = classifyChanges(head, current);
    assert.ok(result.categories.code.added > 0 || result.categories.code.removed > 0 || result.categories.content.added > 0);
  });

  it('counts total diff lines', () => {
    const head = 'Line 1\nLine 2';
    const current = 'Line 1\nLine 3\nLine 4';

    const result = classifyChanges(head, current);
    // Line 2 removed, Lines 3 and 4 added
    assert.equal(result.diffLines, 3);
  });

  it('returns zero changes for identical content', () => {
    const content = '# Title\n\nSame';
    const result = classifyChanges(content, content);
    assert.equal(result.diffLines, 0);
    assert.equal(result.categories.heading.added, 0);
    assert.equal(result.categories.content.added, 0);
  });

  it('handles empty strings', () => {
    const result = classifyChanges('', '');
    assert.equal(result.diffLines, 0);
    assert.equal(result.categories.heading.added, 0);
  });

  it('undercounts duplicate identical lines (Set-based limitation)', () => {
    // Set collapses duplicate lines — this is a known, documented limitation.
    // Page-level detection (changed/added/removed) is unaffected.
    const head = '- Item\n- Item\n- Item';
    const current = '- Item';
    const result = classifyChanges(head, current);
    // Set sees "- Item" in both → reports 0 diff instead of 2 removed
    assert.equal(result.diffLines, 0);
  });

  it('classifies callout changes', () => {
    const head = 'Text';
    const current = '> 📘 Note\n>\n> Note content\n\nText';

    const result = classifyChanges(head, current);
    assert.equal(result.categories.callout.added, 1);
  });

  it('classifies legacy HTML callout changes', () => {
    const head = 'Text';
    const current = '<blockquote theme="📘">\n<p>Note</p>\n</blockquote>\nText';

    const result = classifyChanges(head, current);
    assert.equal(result.categories.callout.added, 1);
  });
});

// ---------------------------------------------------------------------------
// MARKER_404_RE (imported from source)
// ---------------------------------------------------------------------------
describe('MARKER_404_RE', () => {
  it('detects 404 marker', () => {
    assert.ok(MARKER_404_RE.test('<!-- 404: page not found at https://docs.tricentis.com/testim/content/overview/foo.htm -->'));
  });

  it('does not match normal content', () => {
    assert.ok(!MARKER_404_RE.test('# Title\n\nSome content'));
  });
});

describe('parseArgs', () => {
  it('parses --slug=testim-overview', () => {
    const args = parseArgs(['--slug=testim-overview']);
    assert.equal(args.slug, 'testim-overview');
  });

  it('returns null slug when not specified', () => {
    const args = parseArgs(['--json']);
    assert.equal(args.slug, null);
  });

  it('parses --section and --slug together', () => {
    const args = parseArgs(['--section=Overview', '--slug=testim-overview', '--json']);
    assert.equal(args.section, 'Overview');
    assert.equal(args.slug, 'testim-overview');
    assert.equal(args.json, true);
  });
});

// ---------------------------------------------------------------------------
// fallbackSourceUrl — not exported from snapshot_diff.mjs (private function).
// Unit test は追加不可。Phase C (#160) でリファクタリング時にエクスポートを検討。
// ---------------------------------------------------------------------------
