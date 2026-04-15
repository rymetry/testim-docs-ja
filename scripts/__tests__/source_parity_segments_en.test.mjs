/**
 * Tests for the EN HTML direct canonical segment extractor.
 *
 * The extractor walks MadCap Flare HTML WITHOUT routing through turndown so
 * segment boundaries stay stable across turndown version changes.
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let extractSegmentsFromHtml;
let preprocessHtml;
let CALLOUT_NORMALIZATION_SLUGS;

before(async () => {
  ({ extractSegmentsFromHtml, preprocessHtml, CALLOUT_NORMALIZATION_SLUGS } =
    await import('../lib/source_parity_segments_en.mjs'));
});

function byKind(segments, kind) {
  return segments.filter((segment) => segment.segmentKind === kind);
}

// ---------------------------------------------------------------------------
// Headings and section paths
// ---------------------------------------------------------------------------

describe('extractSegmentsFromHtml — headings and section paths', () => {
  it('skips the first <h1> (page title) and emits H2/H3/H4 headings', () => {
    const html = [
      '<h1>Page Title</h1>',
      '<h2>Setup</h2>',
      '<p>Intro paragraph.</p>',
      '<h3>Install</h3>',
      '<p>Install paragraph.</p>',
      '<h4>Windows</h4>',
      '<p>Windows paragraph.</p>',
    ].join('\n');
    const segments = extractSegmentsFromHtml(html);
    const headings = byKind(segments, 'heading');
    assert.deepEqual(
      headings.map((h) => h.sectionPath),
      ['Setup', 'Setup > Install', 'Setup > Install > Windows'],
    );
    const paragraphs = byKind(segments, 'paragraph');
    assert.deepEqual(
      paragraphs.map((p) => p.sectionPath),
      ['Setup', 'Setup > Install', 'Setup > Install > Windows'],
    );
  });

  it('ignores <a name="anchor"> anchor-only links inside headings', () => {
    const html = [
      '<h2><a name="setup"></a>Setup</h2>',
      '<p>Intro.</p>',
    ].join('\n');
    const segments = extractSegmentsFromHtml(html);
    const headings = byKind(segments, 'heading');
    assert.equal(headings.length, 1);
    assert.equal(headings[0].textNorm, 'setup');
  });

  it('truncates deeper heading levels when a shallower heading arrives', () => {
    const html = [
      '<h2>A</h2>',
      '<h3>A1</h3>',
      '<p>A1 para.</p>',
      '<h2>B</h2>',
      '<p>B para.</p>',
    ].join('\n');
    const paragraphs = byKind(extractSegmentsFromHtml(html), 'paragraph');
    assert.deepEqual(
      paragraphs.map((p) => p.sectionPath),
      ['A > A1', 'B'],
    );
  });
});

// ---------------------------------------------------------------------------
// Paragraphs and inline tags
// ---------------------------------------------------------------------------

describe('extractSegmentsFromHtml — paragraphs', () => {
  it('emits a paragraph segment per top-level <p>', () => {
    const html = '<h2>S</h2><p>First paragraph.</p><p>Second paragraph.</p>';
    const paragraphs = byKind(extractSegmentsFromHtml(html), 'paragraph');
    assert.equal(paragraphs.length, 2);
    assert.deepEqual(
      paragraphs.map((p) => p.textNorm),
      ['first paragraph.', 'second paragraph.'],
    );
  });

  it('merges inline children (<strong>, <em>, <a>, <span>, <code>) into the paragraph text', () => {
    const html = [
      '<h2>S</h2>',
      '<p>Use <strong>bold</strong> and <em>italic</em> and <a href="#">a link</a>',
      ' and <code>code</code> and <span>span</span>.</p>',
    ].join('');
    const paragraphs = byKind(extractSegmentsFromHtml(html), 'paragraph');
    assert.equal(paragraphs.length, 1);
    assert.equal(paragraphs[0].textNorm, 'use bold and italic and a link and code and span.');
  });

  it('captures invariant tokens from inline code and links', () => {
    const html = [
      '<h2>S</h2>',
      '<p>Use <code>--proxy</code> to connect to',
      ' <a href="https://example.com/docs">https://example.com/docs</a>.</p>',
    ].join('');
    const paragraphs = byKind(extractSegmentsFromHtml(html), 'paragraph');
    assert.equal(paragraphs.length, 1);
    assert.ok(paragraphs[0].tokensInvariant.includes('--proxy'));
    assert.ok(
      paragraphs[0].tokensInvariant.some((token) => token.includes('example.com/docs')),
    );
  });
});

// ---------------------------------------------------------------------------
// Code snippets — must be stripped entirely
// ---------------------------------------------------------------------------

describe('extractSegmentsFromHtml — codeSnippet blocks', () => {
  it('strips <div class="codeSnippet">...</div> completely, no segments emitted', () => {
    const html = [
      '<h2>S</h2>',
      '<p>Before.</p>',
      '<div class="codeSnippet">',
      '  <a class="codeSnippetCopyButton" href="#">Copy</a>',
      '  <div class="codeSnippetBody"><pre><code>npm install -g @testim/testim-cli</code></pre></div>',
      '</div>',
      '<p>After.</p>',
    ].join('\n');
    const segments = extractSegmentsFromHtml(html);
    // No code-block segment (code is stripped, not emitted)
    assert.equal(byKind(segments, 'code-block').length, 0);
    assert.equal(byKind(segments, 'paragraph').length, 2);
  });

  it('does not emit a stray paragraph from the Copy button link text', () => {
    const html = [
      '<h2>S</h2>',
      '<div class="codeSnippet"><a class="codeSnippetCopyButton">Copy</a><div class="codeSnippetBody"><pre><code>x</code></pre></div></div>',
      '<p>Only real paragraph.</p>',
    ].join('\n');
    const paragraphs = byKind(extractSegmentsFromHtml(html), 'paragraph');
    assert.equal(paragraphs.length, 1);
    assert.equal(paragraphs[0].textNorm, 'only real paragraph.');
  });

  it('handles a codeSnippet nested inside a callout without corrupting the callout', () => {
    // Regression: a nested <div class="codeSnippetBody"> inside <div class="codeSnippet">
    // previously tripped a non-greedy regex that stopped at the inner </div>,
    // leaving an orphan </div> that closed the outer <div class="note"> early.
    // The <p> after the code block was then classified as a regular paragraph
    // instead of a callout-body.
    const html = [
      '<h2>S</h2>',
      '<div class="note">',
      '  <p>First note paragraph.</p>',
      '  <div class="codeSnippet">',
      '    <a class="codeSnippetCopyButton" href="#">Copy</a>',
      '    <div class="codeSnippetBody"><pre><code>npm install</code></pre></div>',
      '  </div>',
      '  <p>Note paragraph after code.</p>',
      '</div>',
    ].join('\n');
    const segments = extractSegmentsFromHtml(html);
    const bodies = byKind(segments, 'callout-body');
    assert.equal(bodies.length, 2);
    assert.deepEqual(
      bodies.map((b) => b.textNorm),
      ['first note paragraph.', 'note paragraph after code.'],
    );
    // Regular paragraph count should be 0 — both are inside the callout.
    assert.equal(byKind(segments, 'paragraph').length, 0);
  });
});

// ---------------------------------------------------------------------------
// Tokenizer edge cases
// ---------------------------------------------------------------------------

describe('extractSegmentsFromHtml — tokenizer edge cases', () => {
  it('respects quoted attribute values containing ">"', () => {
    // A literal ">" inside a quoted attribute value should not terminate the
    // tag early. Previously produced stray text "3\">text".
    const html = '<h2>S</h2><p data-value="5>3">keep me intact</p>';
    const paragraphs = byKind(extractSegmentsFromHtml(html), 'paragraph');
    assert.equal(paragraphs.length, 1);
    assert.equal(paragraphs[0].textNorm, 'keep me intact');
  });

  it('handles single-quoted attribute values containing ">"', () => {
    const html = "<h2>S</h2><p data-value='a>b'>intact</p>";
    const paragraphs = byKind(extractSegmentsFromHtml(html), 'paragraph');
    assert.equal(paragraphs.length, 1);
    assert.equal(paragraphs[0].textNorm, 'intact');
  });
});

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

describe('extractSegmentsFromHtml — lists', () => {
  it('emits one unordered-list-item per <li> inside <ul>', () => {
    const html = [
      '<h2>S</h2>',
      '<ul>',
      '  <li><p>Alpha</p></li>',
      '  <li><p>Beta</p></li>',
      '  <li><p>Gamma</p></li>',
      '</ul>',
    ].join('\n');
    const items = byKind(extractSegmentsFromHtml(html), 'unordered-list-item');
    assert.equal(items.length, 3);
    assert.deepEqual(
      items.map((i) => i.textNorm),
      ['alpha', 'beta', 'gamma'],
    );
  });

  it('emits one ordered-list-item per <li> inside <ol>', () => {
    const html = [
      '<h2>S</h2>',
      '<ol>',
      '  <li value="1"><p>First step.</p></li>',
      '  <li value="2"><p>Second step.</p></li>',
      '</ol>',
    ].join('\n');
    const items = byKind(extractSegmentsFromHtml(html), 'ordered-list-item');
    assert.equal(items.length, 2);
  });

  it('emits paragraphs and images for MadCap <ol> siblings (fragmented list)', () => {
    // MadCap Flare produces <ol> blocks with <p>/<img> siblings alongside <li>
    const html = [
      '<h2>Steps</h2>',
      '<ol>',
      '  <li value="1"><p>Go to Settings.</p></li>',
      '  <li value="2"><p>Click Run.</p></li>',
      '  <p>Extra commentary about the previous step.</p>',
      '  <img src="images/foo.png" alt="screenshot" />',
      '  <li value="3"><p>Copy the command.</p></li>',
      '</ol>',
    ].join('\n');
    const segments = extractSegmentsFromHtml(html);
    const ordered = byKind(segments, 'ordered-list-item');
    assert.equal(ordered.length, 3);
    const extraParas = byKind(segments, 'paragraph');
    assert.equal(extraParas.length, 1);
    assert.equal(extraParas[0].textNorm, 'extra commentary about the previous step.');
    const images = byKind(segments, 'image');
    assert.equal(images.length, 1);
  });
});

// ---------------------------------------------------------------------------
// Callouts (MadCap <div class="note"|"caution">)
// ---------------------------------------------------------------------------

describe('extractSegmentsFromHtml — callouts', () => {
  it('emits callout-body for <p> inside <div class="note">', () => {
    const html = [
      '<h2>Info</h2>',
      '<p>Regular paragraph.</p>',
      '<div class="note">',
      '  <p>First note paragraph.</p>',
      '  <p>Second note paragraph.</p>',
      '</div>',
      '<p>Another regular paragraph.</p>',
    ].join('\n');
    const segments = extractSegmentsFromHtml(html);
    const bodies = byKind(segments, 'callout-body');
    assert.equal(bodies.length, 2);
    assert.deepEqual(
      bodies.map((b) => b.textNorm),
      ['first note paragraph.', 'second note paragraph.'],
    );
    assert.equal(byKind(segments, 'paragraph').length, 2);
  });

  it('emits callout-body for <p> inside <div class="caution"> as well', () => {
    const html = '<h2>S</h2><div class="caution"><p>Warning text.</p></div>';
    const bodies = byKind(extractSegmentsFromHtml(html), 'callout-body');
    assert.equal(bodies.length, 1);
  });
});

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

describe('extractSegmentsFromHtml — tables', () => {
  it('emits one table-cell per <td>, skipping <thead>', () => {
    const html = [
      '<h2>Data</h2>',
      '<table>',
      '  <thead><tr>',
      '    <th><p>Name</p></th>',
      '    <th><p>Value</p></th>',
      '  </tr></thead>',
      '  <tbody>',
      '    <tr><td><p>Alpha</p></td><td><p>1</p></td></tr>',
      '    <tr><td><p>Beta</p></td><td><p>2</p></td></tr>',
      '  </tbody>',
      '</table>',
    ].join('\n');
    const cells = byKind(extractSegmentsFromHtml(html), 'table-cell');
    assert.equal(cells.length, 4);
    assert.deepEqual(
      cells.map((c) => c.textNorm),
      ['alpha', '1', 'beta', '2'],
    );
  });

  it('falls back to tr><td when no <thead>/<tbody> wrappers exist', () => {
    const html = [
      '<h2>Data</h2>',
      '<table>',
      '  <tr><th>H1</th><th>H2</th></tr>',
      '  <tr><td>A</td><td>B</td></tr>',
      '</table>',
    ].join('\n');
    const cells = byKind(extractSegmentsFromHtml(html), 'table-cell');
    // At minimum, the data row td cells are emitted
    assert.ok(cells.length >= 2);
    assert.ok(cells.some((c) => c.textNorm === 'a'));
    assert.ok(cells.some((c) => c.textNorm === 'b'));
  });
});

// ---------------------------------------------------------------------------
// Details / summary
// ---------------------------------------------------------------------------

describe('extractSegmentsFromHtml — details/summary', () => {
  it('emits details-summary for each <summary> inside <details>', () => {
    const html = [
      '<h2>FAQ</h2>',
      '<details><summary>First question?</summary><p>First answer.</p></details>',
      '<details><summary>Second question?</summary><p>Second answer.</p></details>',
    ].join('\n');
    const summaries = byKind(extractSegmentsFromHtml(html), 'details-summary');
    assert.equal(summaries.length, 2);
    assert.deepEqual(
      summaries.map((s) => s.textNorm),
      ['first question?', 'second question?'],
    );
  });
});

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

describe('extractSegmentsFromHtml — images', () => {
  it('emits a non-gate image segment for <img src="...">', () => {
    const html = [
      '<h2>S</h2>',
      '<p>Before image.</p>',
      '<img src="images/foo.png" alt="foo screenshot" />',
      '<p>After image.</p>',
    ].join('\n');
    const segments = extractSegmentsFromHtml(html);
    const images = byKind(segments, 'image');
    assert.equal(images.length, 1);
  });
});

// ---------------------------------------------------------------------------
// HTML entities
// ---------------------------------------------------------------------------

describe('extractSegmentsFromHtml — HTML entities', () => {
  it('decodes common HTML entities in paragraph text', () => {
    const html = '<h2>S</h2><p>Use &amp; &lt;tag&gt; &quot;quoted&quot; &#39;apos&#39;.</p>';
    const paragraphs = byKind(extractSegmentsFromHtml(html), 'paragraph');
    assert.equal(paragraphs[0].textNorm, 'use & <tag> "quoted" \'apos\'.');
  });
});

// ---------------------------------------------------------------------------
// Shape invariants
// ---------------------------------------------------------------------------

describe('extractSegmentsFromHtml — shape invariants', () => {
  it('every segment has required fields', () => {
    const html = '<h2>A</h2><p>text</p><ul><li><p>x</p></li></ul>';
    const segments = extractSegmentsFromHtml(html);
    for (const segment of segments) {
      assert.ok(typeof segment.sectionPath === 'string');
      assert.ok(typeof segment.segmentKind === 'string');
      assert.ok(typeof segment.segmentIndex === 'number');
      assert.match(segment.sourceFingerprint, /^sha256:[0-9a-f]{64}$/);
    }
  });

  it('is deterministic: same input yields identical segments', () => {
    const html = '<h2>A</h2><p>text</p><p>more</p>';
    assert.deepEqual(
      extractSegmentsFromHtml(html),
      extractSegmentsFromHtml(html),
    );
  });

  it('handles empty input', () => {
    assert.deepEqual(extractSegmentsFromHtml(''), []);
    assert.deepEqual(extractSegmentsFromHtml('   \n\t  '), []);
  });
});

// ---------------------------------------------------------------------------
// preprocessHtml — slug-scoped <blockquote> → callout-note 正規化
// ---------------------------------------------------------------------------

describe('preprocessHtml callout normalization', () => {
  it('exports CALLOUT_NORMALIZATION_SLUGS as a Set containing administration/api-access', () => {
    // NOTE: Object.freeze(new Set(...)) は内部 slot (add/delete/clear) を
    // 防がないため Object.isFrozen では「単一 truth」を保証できない。allow list
    // の書き換えを検知したい場合は下記 size assertion を更新すること。
    assert.ok(CALLOUT_NORMALIZATION_SLUGS instanceof Set);
    assert.ok(CALLOUT_NORMALIZATION_SLUGS.has('administration/api-access'));
    assert.equal(CALLOUT_NORMALIZATION_SLUGS.size, 1);
  });

  it('rewrites short warning-like <blockquote> to <div class="callout-note"> for allowed slug', () => {
    const html =
      '<blockquote><p><strong>Note</strong>: Keep your API key safe.</p></blockquote>';
    const out = preprocessHtml(html, {
      slug: 'administration/api-access',
      calloutAllowSlugs: CALLOUT_NORMALIZATION_SLUGS,
    });
    assert.match(out, /<div class="callout-note">/);
    assert.doesNotMatch(out, /<blockquote>/);
  });

  it('does NOT rewrite when slug is not allowed', () => {
    const html = '<blockquote><p><strong>Note</strong>: Keep.</p></blockquote>';
    const out = preprocessHtml(html, {
      slug: 'editing-tests/steps',
      calloutAllowSlugs: CALLOUT_NORMALIZATION_SLUGS,
    });
    assert.match(out, /<blockquote>/);
  });

  it('does NOT rewrite when options omitted (backward compat)', () => {
    const html = '<blockquote><p><strong>Note</strong>: Keep.</p></blockquote>';
    const out = preprocessHtml(html);
    assert.match(out, /<blockquote>/);
  });

  it('does NOT rewrite long (>3 paragraph) blockquote', () => {
    const html = [
      '<blockquote>',
      '<p>Note: a</p>',
      '<p>b</p>',
      '<p>c</p>',
      '<p>d</p>',
      '</blockquote>',
    ].join('');
    const out = preprocessHtml(html, {
      slug: 'administration/api-access',
      calloutAllowSlugs: CALLOUT_NORMALIZATION_SLUGS,
    });
    assert.match(out, /<blockquote>/);
  });

  it('does NOT rewrite blockquote without warning-like leading token', () => {
    const html = '<blockquote><p>This is a quotation.</p></blockquote>';
    const out = preprocessHtml(html, {
      slug: 'administration/api-access',
      calloutAllowSlugs: CALLOUT_NORMALIZATION_SLUGS,
    });
    assert.match(out, /<blockquote>/);
  });

  it('rewrites blockquote starting with Warning (no delimiter) as api-access-style', () => {
    const html =
      '<blockquote><p>Warning This action cannot be undone.</p></blockquote>';
    const out = preprocessHtml(html, {
      slug: 'administration/api-access',
      calloutAllowSlugs: CALLOUT_NORMALIZATION_SLUGS,
    });
    assert.match(out, /<div class="callout-note">/);
    assert.doesNotMatch(out, /<blockquote>/);
  });
});

describe('extractSegmentsFromHtml emits callout-body after normalization', () => {
  it('emits segmentKind=callout-body for allowed slug + warning-like short blockquote', () => {
    const html =
      '<h2>Heading</h2><blockquote><p><strong>Warning</strong>: drop zone</p></blockquote>';
    const segments = extractSegmentsFromHtml(html, {
      slug: 'administration/api-access',
      calloutAllowSlugs: CALLOUT_NORMALIZATION_SLUGS,
    });
    const kinds = segments.map((s) => s.segmentKind);
    assert.ok(kinds.includes('callout-body'));
    assert.ok(!kinds.includes('paragraph') || kinds.indexOf('callout-body') !== -1);
  });

  it('does NOT emit callout-body for disallowed slug (stays paragraph fallback)', () => {
    const html =
      '<h2>Heading</h2><blockquote><p><strong>Warning</strong>: drop zone</p></blockquote>';
    const segments = extractSegmentsFromHtml(html, {
      slug: 'editing-tests/steps',
      calloutAllowSlugs: CALLOUT_NORMALIZATION_SLUGS,
    });
    const kinds = segments.map((s) => s.segmentKind);
    assert.ok(!kinds.includes('callout-body'));
  });

  it('legacy 1-arg call still works (backward compat, no normalization)', () => {
    const html = '<h2>H</h2><blockquote><p>Warning: x</p></blockquote>';
    const segments = extractSegmentsFromHtml(html);
    assert.ok(Array.isArray(segments));
    const kinds = segments.map((s) => s.segmentKind);
    assert.ok(!kinds.includes('callout-body'));
  });
});
