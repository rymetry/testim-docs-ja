import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

let turndown;
let preprocessEnHtml;

before(async () => {
  ({ default: turndown, preprocessEnHtml } = await import('../lib/turndown.mjs'));
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

// ---------------------------------------------------------------------------
// preprocessEnHtml: MadCap escaped callout normalization
// ---------------------------------------------------------------------------
describe('preprocessEnHtml', () => {
  it('converts standalone escaped callout to note div', () => {
    const html = '<p>&gt;  Auto Recovery &gt; &gt; Save your test before closing the browser.</p>';
    const result = preprocessEnHtml(html);
    assert.ok(result.includes('<div class="note">'), `Expected note div in: ${result}`);
    assert.ok(result.includes('Save your test before closing the browser.'), 'Should preserve content');
    assert.ok(!result.includes('&gt;'), `Should not contain escaped >: ${result}`);
  });

  it('converts triple-gt callout (no title) to note div', () => {
    const html = '<p>&gt; &gt; &gt; 3rd party apps might support only URL-based schemes.</p>';
    const result = preprocessEnHtml(html);
    assert.ok(result.includes('<div class="note">'), `Expected note div in: ${result}`);
    assert.ok(result.includes('3rd party apps'), 'Should preserve content');
  });

  it('does not convert mid-paragraph &gt; patterns (false-positive guard)', () => {
    const html = '<p>Normal text here. &gt;  Warning &gt; &gt; Do not proceed without saving.</p>';
    const result = preprocessEnHtml(html);
    assert.equal(result, html, 'Mid-paragraph callout pattern should be left unchanged');
  });

  it('does not modify paragraphs without escaped callout pattern', () => {
    const html = '<p>This is a normal paragraph with no callout.</p>';
    const result = preprocessEnHtml(html);
    assert.equal(result, html);
  });

  it('does not match single gt that is not a callout', () => {
    const html = '<p>Use the &gt; operator for comparison.</p>';
    const result = preprocessEnHtml(html);
    assert.equal(result, html);
  });

  it('produces :::note directive after turndown conversion', () => {
    const html = '<p>&gt;  Final screen &gt; &gt; The final screen may not have fields.</p>';
    const processed = preprocessEnHtml(html);
    const md = turndown.turndown(processed);
    assert.ok(md.includes(':::note'), `Expected :::note in: ${md}`);
    assert.ok(md.includes('The final screen may not have fields.'), `Expected content in: ${md}`);
  });

  it('handles <p> with class attribute', () => {
    const html = '<p class="tableBody">&gt; Warning &gt; &gt; Check your config.</p>';
    const result = preprocessEnHtml(html);
    assert.ok(result.includes('<div class="note">'), `Expected note div in: ${result}`);
    assert.ok(result.includes('Check your config.'), 'Should preserve content');
  });

  it('returns original when escaped callout has empty body', () => {
    const html = '<p>&gt; Title &gt; &gt; </p>';
    const processed = preprocessEnHtml(html);
    assert.equal(processed, html);
  });

  it('returns original when escaped callout has empty body (no trailing space)', () => {
    const html = '<p>&gt; Title &gt; &gt;</p>';
    const processed = preprocessEnHtml(html);
    assert.equal(processed, html);
  });

  it('preserves &amp; entities in callout body', () => {
    const html = '<p>&gt; Note &gt; &gt; Use &amp;amp; for escaping.</p>';
    const processed = preprocessEnHtml(html);
    assert.ok(processed.includes('<div class="note">'), `Expected note div in: ${processed}`);
    assert.ok(processed.includes('&amp;amp;'), `Expected entity preserved in: ${processed}`);
  });

  it('handles multiple escaped callouts in separate <p> elements', () => {
    const html = '<p>&gt; A &gt; &gt; First note.</p><p>&gt; B &gt; &gt; Second note.</p>';
    const processed = preprocessEnHtml(html);
    const noteDivs = (processed.match(/<div class="note">/g) || []).length;
    assert.equal(noteDivs, 2, `Expected 2 note divs, got ${noteDivs}: ${processed}`);
  });

  it('throws TypeError for non-string input', () => {
    assert.throws(() => preprocessEnHtml(null), /expected string/i);
    assert.throws(() => preprocessEnHtml(undefined), /expected string/i);
    assert.throws(() => preprocessEnHtml(42), /expected string/i);
  });

  it('skips <p> with attribute containing > (safety guard)', () => {
    const html = '<p data-val="a>b">Content &gt; T &gt; &gt; Body</p>';
    const result = preprocessEnHtml(html);
    // The regex may not match correctly; at minimum it should not corrupt
    assert.ok(!result.includes('<div class="note">') || result === html,
      `Should not produce note div from p with truncated attribute: ${result}`);
  });
});

// ---------------------------------------------------------------------------
// preprocessEnHtml: escaped <details> unescaping
// ---------------------------------------------------------------------------
describe('preprocessEnHtml escaped details', () => {
  it('unescapes details/summary inside <p> elements', () => {
    const html = '<p>&lt;details&gt; &lt;summary&gt;&lt;b&gt;Question?&lt;/b&gt;&lt;/summary&gt; Answer text. &lt;/details&gt;</p>';
    const processed = preprocessEnHtml(html);
    assert.ok(!processed.includes('&lt;details'), `Should not contain escaped details: ${processed}`);
    assert.ok(processed.includes('<details>'), `Expected real <details>: ${processed}`);
  });

  it('converts unescaped details/summary to H2 after turndown', () => {
    const html = '<p>&lt;details&gt; &lt;summary&gt;&lt;b&gt;Is this a new tool?&lt;/b&gt;&lt;/summary&gt; Yes, standalone. &lt;/details&gt;</p>';
    const processed = preprocessEnHtml(html);
    const md = turndown.turndown(processed);
    assert.ok(md.includes('## '), `Expected H2 heading in: ${md}`);
    assert.ok(md.includes('standalone'), `Expected answer content in: ${md}`);
  });

  it('does not modify p elements without escaped details', () => {
    const html = '<p>Normal paragraph text.</p>';
    assert.equal(preprocessEnHtml(html), html);
  });

  it('handles &lt;/details&gt; followed by &lt;details&gt; in same <p>', () => {
    const html = '<p>&lt;/details&gt; &lt;details&gt; &lt;summary&gt;&lt;b&gt;Next Q?&lt;/b&gt;&lt;/summary&gt; Next A. &lt;/details&gt;</p>';
    const processed = preprocessEnHtml(html);
    assert.ok(processed.includes('<details>'), `Expected real <details>: ${processed}`);
    assert.ok(!processed.includes('&lt;details'), `Should not contain escaped details: ${processed}`);
  });

  it('does not unescape &lt;/details&gt; without &lt;details&gt; in same <p>', () => {
    const html = '<p>&lt;/details&gt; is the closing tag for the details element.</p>';
    assert.equal(preprocessEnHtml(html), html);
  });

  it('restores &amp; entities inside escaped details', () => {
    const html = '<p>&lt;details&gt;&lt;summary&gt;Q &amp;amp; A&lt;/summary&gt; Answer.&lt;/details&gt;</p>';
    const processed = preprocessEnHtml(html);
    assert.ok(processed.includes('Q &amp; A') || processed.includes('Q & A'), `Expected restored entity: ${processed}`);
  });

  it('handles <p> with class attribute for details', () => {
    const html = '<p class="body">&lt;details&gt;&lt;summary&gt;Q&lt;/summary&gt;A&lt;/details&gt;</p>';
    const processed = preprocessEnHtml(html);
    assert.ok(processed.includes('<details>'), `Expected real <details>: ${processed}`);
  });
});

// ---------------------------------------------------------------------------
// preprocessEnHtml composition: unescapeDetails + normalizeEscapedCallouts
// ---------------------------------------------------------------------------
describe('preprocessEnHtml composition', () => {
  it('handles document with both escaped details and escaped callouts', () => {
    const html = '<p>&lt;details&gt;&lt;summary&gt;FAQ&lt;/summary&gt; Answer.&lt;/details&gt;</p><p>&gt; Note &gt; &gt; Important info.</p>';
    const processed = preprocessEnHtml(html);
    assert.ok(processed.includes('<details>'), `Expected real <details>: ${processed}`);
    assert.ok(processed.includes('<div class="note">'), `Expected note div: ${processed}`);
  });
});

// ---------------------------------------------------------------------------
// T-1: preprocessEnHtml with options (en_source_patches integration)
// ---------------------------------------------------------------------------
describe('preprocessEnHtml with options (en_source_patches integration)', () => {
  it('applies UD-001A patch when slug is provided', () => {
    const html = '<p>Verify -this action verifies x</p>';
    const out = preprocessEnHtml(html, {
      slug: 'salesforce-testing/salesforce-steps/sfdc-step-create',
    });
    assert.ok(
      out.includes('Verify - this action verifies x'),
      `expected patched output, got: ${out}`,
    );
  });

  it('does NOT apply patches when slug is absent (backward compat)', () => {
    const html = '<p>Verify -this action verifies x</p>';
    const out = preprocessEnHtml(html);
    assert.ok(
      out.includes('Verify -this action verifies'),
      `expected original typo preserved when slug is omitted, got: ${out}`,
    );
  });

  it('records hits in patchCoverage when provided', async () => {
    const { createEnSourcePatchCoverage } = await import('../lib/en_source_patches.mjs');
    const cov = createEnSourcePatchCoverage();
    preprocessEnHtml('<p>Verify -this action verifies x</p>', {
      slug: 'salesforce-testing/salesforce-steps/sfdc-step-create',
      patchCoverage: cov,
    });
    assert.equal(cov.snapshot().matchedHits, 1);
  });

  it('slug-less call produces identical output to {slug: ""} / null / empty options', () => {
    const samples = [
      '<p>Normal paragraph</p>',
      '<p>Verify -this action verifies x</p>',
      '<div class="note"><p>Note body</p></div>',
    ];
    for (const html of samples) {
      const baseline = preprocessEnHtml(html);
      assert.equal(preprocessEnHtml(html, {}), baseline, 'empty options should match baseline');
      assert.equal(preprocessEnHtml(html, { slug: '' }), baseline, 'empty slug should match baseline');
      assert.equal(preprocessEnHtml(html, { slug: null }), baseline, 'null slug should match baseline');
    }
  });
});

// ---------------------------------------------------------------------------
// HTML details/summary conversion
// ---------------------------------------------------------------------------
describe('HTML details/summary rules', () => {
  it('converts <summary> to H2 heading', () => {
    const html = '<details><summary><b>Question text?</b></summary> Answer here.</details>';
    const md = turndown.turndown(html);
    assert.ok(md.includes('## '), `Expected H2 in: ${md}`);
    assert.ok(md.includes('Question text?'), `Expected question in: ${md}`);
    assert.ok(md.includes('Answer here.'), `Expected answer in: ${md}`);
  });

  it('handles multiple details sections', () => {
    const html = '<details><summary>Q1</summary>A1</details><details><summary>Q2</summary>A2</details>';
    const md = turndown.turndown(html);
    const headings = md.split('\n').filter(l => l.startsWith('## '));
    assert.equal(headings.length, 2, `Expected 2 headings, got ${headings.length}: ${md}`);
  });

  it('handles <details> without <summary>', () => {
    const html = '<details>Just content without a summary.</details>';
    const md = turndown.turndown(html);
    assert.ok(md.includes('Just content without a summary.'), `Expected content in: ${md}`);
    assert.ok(!md.includes('## '), `Should not produce H2 without summary: ${md}`);
  });

  it('handles <details> with nested list elements', () => {
    const html = '<details><summary>How?</summary><ol><li value="1">Step 1</li><li value="2">Step 2</li></ol></details>';
    const md = turndown.turndown(html);
    assert.ok(md.includes('## '), `Expected H2 in: ${md}`);
    assert.ok(md.includes('1.') && md.includes('2.'), `Expected ordered list in: ${md}`);
  });
});

// ---------------------------------------------------------------------------
// preprocessEnHtml: real snapshot fixture tests
// ---------------------------------------------------------------------------
describe('preprocessEnHtml real snapshot fixtures', () => {
  it('normalizes deep-link-mobile escaped callout into :::note', async (t) => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const snapshotPath = path.join(process.cwd(), 'snapshots/en/content/advanced-editing/deep-link-mobile.html');
    if (!fs.existsSync(snapshotPath)) {
      t.skip('Snapshot file not available');
      return;
    }
    const html = fs.readFileSync(snapshotPath, 'utf8');
    const md = turndown.turndown(preprocessEnHtml(html));
    assert.ok(md.includes(':::note'), `Expected :::note from escaped callout in deep-link-mobile: not found in output`);
    assert.ok(!md.includes('\\> > >'), `Should not contain escaped > pattern after preprocessing`);
  });

  it('normalizes salesforce faq escaped details into H2 sections', async (t) => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const snapshotPath = path.join(process.cwd(), 'snapshots/en/content/salesforce-testing/faq.html');
    if (!fs.existsSync(snapshotPath)) {
      t.skip('Snapshot file not available');
      return;
    }
    const html = fs.readFileSync(snapshotPath, 'utf8');
    const md = turndown.turndown(preprocessEnHtml(html));
    const headings = md.split('\n').filter(l => /^## /.test(l));
    assert.ok(headings.length >= 4, `Expected at least 4 H2 headings from FAQ details, got ${headings.length}`);
    assert.ok(!md.includes('&lt;details'), `Should not contain escaped <details> after preprocessing`);
  });

  it('normalizes salesforce troubleshoot escaped details', async (t) => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const snapshotPath = path.join(process.cwd(), 'snapshots/en/content/salesforce-testing/troubleshoot.html');
    if (!fs.existsSync(snapshotPath)) {
      t.skip('Snapshot file not available');
      return;
    }
    const html = fs.readFileSync(snapshotPath, 'utf8');
    const md = turndown.turndown(preprocessEnHtml(html));
    const headings = md.split('\n').filter(l => /^## /.test(l));
    assert.ok(headings.length >= 1, `Expected H2 headings from troubleshoot details, got ${headings.length}`);
    assert.ok(!md.includes('&lt;details'), `Should not contain escaped <details> after preprocessing`);
  });
});

// ---------------------------------------------------------------------------
// normalizeEscapedFaqDetails
//
// MadCap が `<details><summary>Q</summary>body</details>` を複数 <p> に跨って
// escape 出力する FAQ アコーディオンを、preprocessor 段階で valid sibling
// `<h2>/<p>` block へ再構成する変換を pin する。
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('normalizeEscapedFaqDetails', () => {
  let extractSegmentsFromHtml;
  before(async () => {
    ({ extractSegmentsFromHtml } = await import('../lib/source_parity_segments_en.mjs'));
  });

  const ROOT_DIR = join(import.meta.dirname, '../../');
  const SNAPSHOTS_DIR = join(ROOT_DIR, 'snapshots/en/content');

  // ---------------------------------------------------------------------
  // narrow fixture (実 faq 構造の抜粋。escaped <b> が残るケースの回帰防止)。
  // ---------------------------------------------------------------------

  it('narrow fixture: valid sibling <h2>/<p> block を生成し、extractor でも heading を拾える', () => {
    // 実 faq.html と同じ multi-paragraph broken tree 構造 (first <p> が
    // details open を含むが同じ <p> 内で close していない — 次の <p> に
    // 跨っている)。この不均衡が「legacy single-<p> ではない」判定を起動し、
    // paragraph-aware rewrite が発火する。
    const html = [
      '<h1>FAQ</h1>',
      '<p>&lt;details&gt; &lt;summary&gt;&lt;b&gt;Q1?&lt;/b&gt;&lt;/summary&gt; Answer 1 continues.<br /></p>',
      '<p>&lt;/details&gt; &lt;details&gt; &lt;summary&gt;&lt;b&gt;Q2?&lt;/b&gt;&lt;/summary&gt; Answer 2. &lt;/details&gt;</p>',
    ].join('\n');

    const out = preprocessEnHtml(html);
    // escaped markers (details / summary / b) は残らないこと
    assert.equal(out.includes('&lt;details&gt;'), false);
    assert.equal(out.includes('&lt;/details&gt;'), false);
    assert.equal(out.includes('&lt;summary&gt;'), false);
    assert.equal(out.includes('&lt;/summary&gt;'), false);
    assert.equal(out.includes('&lt;b&gt;'), false);
    // invalid `<p><h2>` ネストを作らないこと
    assert.equal(/<p\b[^>]*>\s*<h2\b/i.test(out), false);

    // narrow fixture には extractor が h1 を skip した状態で h2 を 2 件生成する
    // (h1 は h1Consumed フラグで skip されるため heading 数は h2 のみで 2 件)
    const segs = extractSegmentsFromHtml(html);
    const headings = segs.filter((s) => s.segmentKind === 'heading');
    assert.equal(headings.length, 2);
  });

  // ---------------------------------------------------------------------
  // 実 snapshot を使った contract pin。narrow fixture だけに依存しない。
  // ---------------------------------------------------------------------

  it('real faq.html: invalid <p><h2> なし + extractor heading=5 + details-summary=0', () => {
    const raw = readFileSync(
      join(SNAPSHOTS_DIR, 'salesforce-testing/faq.html'),
      'utf8',
    );
    const out = preprocessEnHtml(raw);
    // escaped details / summary / b が残らない
    assert.equal(out.includes('&lt;details&gt;'), false);
    assert.equal(out.includes('&lt;/details&gt;'), false);
    assert.equal(out.includes('&lt;summary&gt;'), false);
    assert.equal(out.includes('&lt;b&gt;'), false);
    // invalid nesting を明示的に禁止
    assert.equal(/<p\b[^>]*>\s*<h2\b/i.test(out), false);
    // real <details> tag も残らない (faq は h2/p block に再構成されているので不要)
    assert.equal(/<details\b/i.test(out), false);

    const segs = extractSegmentsFromHtml(raw);
    const headings = segs.filter((s) => s.segmentKind === 'heading');
    const detailSummaries = segs.filter((s) => s.segmentKind === 'details-summary');
    assert.equal(headings.length, 5, `faq の heading 件数が不正: ${headings.length}`);
    assert.equal(detailSummaries.length, 0, 'faq に details-summary は残ってはいけない');
  });

  // ---------------------------------------------------------------------
  // coding-assistant は normalize 対象外
  // ---------------------------------------------------------------------

  it('real coding-assistant.html: normalization は発火せず <h2> 注入ゼロ', () => {
    const raw = readFileSync(
      join(SNAPSHOTS_DIR, 'advanced-editing/coding-assistant.html'),
      'utf8',
    );
    // preprocess 前後の <h2> 件数が同じであること = 正規化未発火
    const h2Before = (raw.match(/<h2[^>]*>/gi) || []).length;
    const out = preprocessEnHtml(raw);
    const h2After = (out.match(/<h2[^>]*>/gi) || []).length;
    assert.equal(
      h2After,
      h2Before,
      `coding-assistant に <h2> が注入された (before=${h2Before}, after=${h2After})。` +
        `faq 正規化が誤発火している可能性`,
    );
    // invalid nesting も発生しない
    assert.equal(/<p\b[^>]*>\s*<h2\b/i.test(out), false);

    // 本文の prose ("generate code to validate page URL" 等) が <h2> に
    // 昇格していないことを追加で確認
    assert.equal(
      /<h2[^>]*>[^<]*generate code/i.test(out),
      false,
      'coding-assistant の sample prompt が <h2> に昇格してはいけない',
    );
  });
});
