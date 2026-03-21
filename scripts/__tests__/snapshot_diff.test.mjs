import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let classifyChanges;
let CHANGE_CLASSIFIERS;
let MARKER_404_RE;

before(async () => {
  ({ classifyChanges, CHANGE_CLASSIFIERS, MARKER_404_RE } = await import(
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
  it('classifies heading tags', () => {
    assert.equal(classifyLine('  <h2>New Section</h2>'), 'heading');
    assert.equal(classifyLine('  </h3>'), 'heading');
    assert.equal(classifyLine('  <h1>Title</h1>'), 'heading');
  });

  it('classifies image tags', () => {
    assert.equal(classifyLine('  <img src="test.png" alt="test">'), 'image');
  });

  it('classifies code block tags', () => {
    assert.equal(classifyLine('  <pre>'), 'code');
    assert.equal(classifyLine('  </pre>'), 'code');
  });

  it('classifies callout tags', () => {
    assert.equal(classifyLine('  <blockquote theme="📘">'), 'callout');
  });

  it('classifies other content', () => {
    assert.equal(classifyLine('  <p>Some text here</p>'), 'content');
    assert.equal(classifyLine('  <a href="url">Link</a>'), 'content');
    assert.equal(classifyLine('  Plain text'), 'content');
  });
});

// ---------------------------------------------------------------------------
// classifyChanges (imported from source)
// ---------------------------------------------------------------------------
describe('classifyChanges', () => {
  it('detects heading addition', () => {
    const head = '<article>\n<h2>Section 1</h2>\n<p>Text</p>\n</article>';
    const current = '<article>\n<h2>Section 1</h2>\n<h2>Section 2</h2>\n<p>Text</p>\n</article>';

    const result = classifyChanges(head, current);
    assert.equal(result.categories.heading.added, 1);
    assert.equal(result.categories.heading.removed, 0);
  });

  it('detects image removal', () => {
    const head = '<article>\n<img src="old.png" alt="old">\n<p>Text</p>\n</article>';
    const current = '<article>\n<p>Text</p>\n</article>';

    const result = classifyChanges(head, current);
    assert.equal(result.categories.image.removed, 1);
    assert.equal(result.categories.image.added, 0);
  });

  it('detects code block changes', () => {
    const head = '<article>\n<pre>old code</pre>\n</article>';
    const current = '<article>\n<pre>new code</pre>\n</article>';

    const result = classifyChanges(head, current);
    assert.ok(result.categories.code.added > 0 || result.categories.code.removed > 0);
  });

  it('counts total diff lines', () => {
    const head = '<p>Line 1</p>\n<p>Line 2</p>';
    const current = '<p>Line 1</p>\n<p>Line 3</p>\n<p>Line 4</p>';

    const result = classifyChanges(head, current);
    // Line 2 removed, Lines 3 and 4 added
    assert.equal(result.diffLines, 3);
  });

  it('returns zero changes for identical content', () => {
    const content = '<article>\n<h1>Title</h1>\n<p>Same</p>\n</article>';
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
    const head = '<li>Item</li>\n<li>Item</li>\n<li>Item</li>';
    const current = '<li>Item</li>';
    const result = classifyChanges(head, current);
    // Set sees "Item" in both → reports 0 diff instead of 2 removed
    assert.equal(result.diffLines, 0);
  });

  it('classifies callout changes', () => {
    const head = '<article>\n<p>Text</p>\n</article>';
    const current = '<article>\n<blockquote theme="📘"><p>Note</p></blockquote>\n<p>Text</p>\n</article>';

    const result = classifyChanges(head, current);
    assert.equal(result.categories.callout.added, 1);
  });
});

// ---------------------------------------------------------------------------
// MARKER_404_RE (imported from source)
// ---------------------------------------------------------------------------
describe('MARKER_404_RE', () => {
  it('detects 404 marker', () => {
    assert.ok(MARKER_404_RE.test('<!-- 404: page not found at https://help.testim.io/docs/foo -->'));
  });

  it('does not match normal content', () => {
    assert.ok(!MARKER_404_RE.test('<article><h1>Title</h1></article>'));
  });
});
