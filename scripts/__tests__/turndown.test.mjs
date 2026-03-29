import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

let turndown;

before(async () => {
  ({ default: turndown } = await import('../lib/turndown.mjs'));
});

// ---------------------------------------------------------------------------
// MadCap callout conversion
// ---------------------------------------------------------------------------
describe('MadCap callout rules', () => {
  it('converts <div class="note"> to :::note directive', () => {
    const html = '<div class="note"><p>This is a note.</p></div>';
    const md = turndown.turndown(html);
    assert.ok(md.includes(':::note'), `Expected :::note in: ${md}`);
    assert.ok(md.includes('This is a note.'), `Expected note content in: ${md}`);
    assert.ok(md.includes(':::'), 'Expected closing :::');
  });

  it('converts <div class="caution"> to :::caution directive', () => {
    const html = '<div class="caution"><p>Be careful here.</p></div>';
    const md = turndown.turndown(html);
    assert.ok(md.includes(':::caution'), `Expected :::caution in: ${md}`);
    assert.ok(md.includes('Be careful here.'), `Expected caution content in: ${md}`);
  });

  it('preserves inline formatting inside callout', () => {
    const html = '<div class="note"><p>Use the <em>Validate</em> step with <strong>Chrome</strong>.</p></div>';
    const md = turndown.turndown(html);
    assert.ok(md.includes(':::note'));
    assert.ok(md.includes('*Validate*') || md.includes('_Validate_'), `Expected emphasis in: ${md}`);
    assert.ok(md.includes('**Chrome**'), `Expected bold in: ${md}`);
  });

  it('preserves links inside callout', () => {
    const html = '<div class="note"><p>See <a href="https://example.com">docs</a> for details.</p></div>';
    const md = turndown.turndown(html);
    assert.ok(md.includes(':::note'));
    assert.ok(md.includes('[docs](https://example.com)'), `Expected link in: ${md}`);
  });

  it('does not convert div with unrelated class', () => {
    const html = '<div class="codeSnippet"><p>Some code context.</p></div>';
    const md = turndown.turndown(html);
    assert.ok(!md.includes(':::note'), 'Should not produce :::note');
    assert.ok(!md.includes(':::caution'), 'Should not produce :::caution');
  });

  it('does not convert div without class', () => {
    const html = '<div><p>Plain div content.</p></div>';
    const md = turndown.turndown(html);
    assert.ok(!md.includes(':::'), 'Should not produce ::: directive');
  });

  it('produces correct directive structure', () => {
    const html = '<div class="note"><p>Content here.</p></div>';
    const md = turndown.turndown(html);
    const lines = md.trim().split('\n');
    assert.equal(lines[0], ':::note', 'First line should be :::note');
    assert.equal(lines[lines.length - 1], ':::', 'Last line should be :::');
    assert.ok(lines.length >= 3, 'Should have at least 3 lines (open, content, close)');
  });

  it('handles callout within surrounding content', () => {
    const html = `
      <p>Before the callout.</p>
      <div class="note"><p>Note content.</p></div>
      <p>After the callout.</p>
    `;
    const md = turndown.turndown(html);
    assert.ok(md.includes('Before the callout.'));
    assert.ok(md.includes(':::note'));
    assert.ok(md.includes('Note content.'));
    assert.ok(md.includes('After the callout.'));
  });
});

// ---------------------------------------------------------------------------
// MadCap code snippet copy button stripping
// ---------------------------------------------------------------------------
describe('MadCap code snippet copy button rule', () => {
  it('strips codeSnippetCopyButton anchor from code snippets', () => {
    const html = '<div class="codeSnippet"><a class="codeSnippetCopyButton" role="button" href="javascript:void(0);">Copy</a><div class="codeSnippetBody"><pre><code>const x = 1;</code></pre></div></div>';
    const md = turndown.turndown(html);
    assert.ok(!md.includes('Copy'), `Should not contain "Copy" text: ${md}`);
    assert.ok(!md.includes('javascript:void'), `Should not contain javascript:void: ${md}`);
    assert.ok(md.includes('const x = 1'), `Should preserve code content: ${md}`);
  });

  it('preserves normal anchors that are not copy buttons', () => {
    const html = '<a href="https://example.com">Click here</a>';
    const md = turndown.turndown(html);
    assert.ok(md.includes('Click here'), `Should preserve link text: ${md}`);
    assert.ok(md.includes('example.com'), `Should preserve link URL: ${md}`);
  });

  it('does not match anchors with similar but different class names', () => {
    const html = '<a class="codeSnippetCopyButtonExtended" href="#">Extended</a>';
    const md = turndown.turndown(html);
    assert.ok(md.includes('Extended'), `Should preserve non-matching class: ${md}`);
  });
});

// ---------------------------------------------------------------------------
// MadCap ordered list conversion
// ---------------------------------------------------------------------------
describe('MadCap ordered list rules', () => {
  it('preserves step numbering from li value attributes', () => {
    const html = `<ol>
      <li value="1"><p>First step.</p></li>
      <li value="2"><p>Second step.</p></li>
      <li value="3"><p>Third step.</p></li>
    </ol>`;
    const md = turndown.turndown(html);
    assert.ok(md.includes('1. First step.'));
    assert.ok(md.includes('2. Second step.'));
    assert.ok(md.includes('3. Third step.'));
  });

  it('places img siblings between steps as block content', () => {
    const html = `<ol>
      <li value="1"><p>Click the button.</p></li>
      <img src="images/button.png" />
      <li value="2"><p>Select the option.</p></li>
    </ol>`;
    const md = turndown.turndown(html);
    const lines = md.trim().split('\n').filter(l => l.trim());
    const step1idx = lines.findIndex(l => l.startsWith('1.'));
    const imgIdx = lines.findIndex(l => l.includes('!['));
    const step2idx = lines.findIndex(l => l.startsWith('2.'));
    assert.ok(step1idx < imgIdx, 'Image should appear after step 1');
    assert.ok(imgIdx < step2idx, 'Image should appear before step 2');
  });

  it('places p siblings between steps as block content', () => {
    const html = `<ol>
      <li value="1"><p>Do something.</p></li>
      <p>The result is displayed.</p>
      <li value="2"><p>Continue.</p></li>
    </ol>`;
    const md = turndown.turndown(html);
    assert.ok(md.includes('1. Do something.'));
    assert.ok(md.includes('The result is displayed.'));
    assert.ok(md.includes('2. Continue.'));
  });

  it('handles callout div inside ol', () => {
    const html = `<ol>
      <li value="1"><p>Select an option.</p></li>
      <div class="note"><p>This is important.</p></div>
      <li value="2"><p>Click Save.</p></li>
    </ol>`;
    const md = turndown.turndown(html);
    assert.ok(md.includes('1. Select an option.'));
    assert.ok(md.includes(':::note'));
    assert.ok(md.includes('This is important.'));
    assert.ok(md.includes('2. Click Save.'));
  });

  it('handles ul sibling inside ol', () => {
    const html = `<ol>
      <li value="1"><p>Configure:</p></li>
      <ul>
        <li><p><strong>A</strong> – First.</p></li>
        <li><p><strong>B</strong> – Second.</p></li>
      </ul>
      <li value="2"><p>Done.</p></li>
    </ol>`;
    const md = turndown.turndown(html);
    assert.ok(md.includes('1. Configure:'));
    assert.ok(md.includes('**A**'));
    assert.ok(md.includes('**B**'));
    assert.ok(md.includes('2. Done.'));
  });

  it('converts li without value as unordered list item', () => {
    const html = `<ol>
      <li value="1"><p>Main step.</p></li>
      <li><p>Sub-item without value.</p></li>
      <li value="2"><p>Next step.</p></li>
    </ol>`;
    const md = turndown.turndown(html);
    assert.ok(md.includes('1. Main step.'));
    assert.ok(md.includes('- Sub-item without value.'));
    assert.ok(md.includes('2. Next step.'));
  });

  it('produces correct step count for complex MadCap structure', () => {
    const html = `<ol>
      <li value="1"><p>Step one.</p></li>
      <img src="images/a.png" />
      <p>Description.</p>
      <img src="images/b.png" />
      <li value="2"><p>Step two.</p></li>
      <img src="images/c.png" />
      <div class="note"><p>A note.</p></div>
      <li value="3"><p>Step three.</p></li>
    </ol>`;
    const md = turndown.turndown(html);
    const steps = md.split('\n').filter(l => /^\d+\.\s/.test(l));
    assert.equal(steps.length, 3, `Expected 3 steps, got ${steps.length}: ${steps.join(', ')}`);
  });
});

// ---------------------------------------------------------------------------
// MadCap table conversion
// ---------------------------------------------------------------------------
describe('MadCap table rules', () => {
  it('converts MadCap table to markdown pipe table', () => {
    const html = `<table class="TableStyle-Table_new">
      <thead><tr><th><p class="tableHeading">Name</p></th><th><p class="tableHeading">Value</p></th></tr></thead>
      <tbody><tr><td><p class="tableBody">foo</p></td><td><p class="tableBody">bar</p></td></tr></tbody>
    </table>`;
    const md = turndown.turndown(html);
    assert.ok(md.includes('| Name | Value |'), `Expected header row in: ${md}`);
    assert.ok(md.includes('| --- | --- |'), `Expected separator in: ${md}`);
    assert.ok(md.includes('| foo | bar |'), `Expected data row in: ${md}`);
  });

  it('handles empty cells', () => {
    const html = `<table>
      <thead><tr><th>A</th><th>B</th></tr></thead>
      <tbody><tr><td>1</td><td></td></tr></tbody>
    </table>`;
    const md = turndown.turndown(html);
    assert.ok(md.includes('| 1 |  |'), `Expected empty cell in: ${md}`);
  });

  it('escapes pipe characters in cell content', () => {
    const html = `<table>
      <thead><tr><th>Command</th></tr></thead>
      <tbody><tr><td>a | b</td></tr></tbody>
    </table>`;
    const md = turndown.turndown(html);
    assert.ok(md.includes('a \\| b'), `Expected escaped pipe in: ${md}`);
  });

  it('preserves inline formatting in cells', () => {
    const html = `<table>
      <thead><tr><th>Field</th><th>Description</th></tr></thead>
      <tbody><tr><td><p><strong>timeout</strong></p></td><td><p>Max wait in <em>milliseconds</em></p></td></tr></tbody>
    </table>`;
    const md = turndown.turndown(html);
    assert.ok(md.includes('**timeout**'), `Expected bold in: ${md}`);
    assert.ok(md.includes('*milliseconds*') || md.includes('_milliseconds_'), `Expected italic in: ${md}`);
  });

  it('produces correct row count for multi-row table', () => {
    const html = `<table>
      <thead><tr><th>H1</th><th>H2</th></tr></thead>
      <tbody>
        <tr><td>A</td><td>B</td></tr>
        <tr><td>C</td><td>D</td></tr>
        <tr><td>E</td><td>F</td></tr>
      </tbody>
    </table>`;
    const md = turndown.turndown(html);
    const dataRows = md.trim().split('\n').filter(l => l.startsWith('|') && !l.includes('---'));
    assert.equal(dataRows.length, 4, `Expected 4 rows (1 header + 3 data), got ${dataRows.length}`);
  });

  it('handles table without <thead> (first tbody row becomes header)', () => {
    const html = `<table>
      <tbody>
        <tr><td>Name</td><td>Value</td></tr>
        <tr><td>foo</td><td>bar</td></tr>
      </tbody>
    </table>`;
    const md = turndown.turndown(html);
    assert.ok(md.includes('| Name | Value |'), `Expected first row as header in: ${md}`);
    assert.ok(md.includes('| --- | --- |'), `Expected separator in: ${md}`);
    assert.ok(md.includes('| foo | bar |'), `Expected data row in: ${md}`);
  });
});
