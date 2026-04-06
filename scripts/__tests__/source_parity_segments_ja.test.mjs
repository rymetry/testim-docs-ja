/**
 * Tests for the JA markdown canonical segment extractor (Issue #225 Phase 4).
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let extractSegmentsFromMarkdown;

before(async () => {
  ({ extractSegmentsFromMarkdown } = await import('../lib/source_parity_segments_ja.mjs'));
});

function sectionPaths(segments) {
  return segments.map((segment) => segment.sectionPath);
}

function byKind(segments, kind) {
  return segments.filter((segment) => segment.segmentKind === kind);
}

// ---------------------------------------------------------------------------
// Headings and section path tracking
// ---------------------------------------------------------------------------

describe('extractSegmentsFromMarkdown — headings and section paths', () => {
  it('emits a heading segment for each H2/H3/H4 and builds nested paths', () => {
    const md = [
      '## Setup',
      '',
      'Intro paragraph.',
      '',
      '### Install',
      '',
      'Install paragraph.',
      '',
      '#### Windows',
      '',
      'Windows paragraph.',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const headings = byKind(segments, 'heading');
    assert.deepEqual(
      headings.map((h) => h.sectionPath),
      ['Setup', 'Setup > Install', 'Setup > Install > Windows'],
    );
    const paragraphs = byKind(segments, 'paragraph');
    assert.equal(paragraphs.length, 3);
    assert.deepEqual(sectionPaths(paragraphs), [
      'Setup',
      'Setup > Install',
      'Setup > Install > Windows',
    ]);
  });

  it('skips the first H1 (treated as page title)', () => {
    const md = [
      '# Page Title',
      '',
      'Intro paragraph.',
      '',
      '## Section',
      '',
      'Section paragraph.',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    // No heading segment for the H1
    const headings = byKind(segments, 'heading');
    assert.equal(headings.length, 1);
    assert.equal(headings[0].sectionPath, 'Section');
  });

  it('ignores frontmatter completely', () => {
    const md = [
      '---',
      'title: Test',
      'category: foo',
      '---',
      '',
      'Body paragraph.',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const paragraphs = byKind(segments, 'paragraph');
    assert.equal(paragraphs.length, 1);
    assert.equal(paragraphs[0].textNorm, 'body paragraph.');
  });

  it('truncates deeper heading levels when a shallower heading arrives', () => {
    const md = [
      '## A',
      '',
      '### A1',
      '',
      'Deep paragraph.',
      '',
      '## B',
      '',
      'B paragraph.',
      '',
    ].join('\n');
    const paragraphs = byKind(extractSegmentsFromMarkdown(md), 'paragraph');
    assert.deepEqual(sectionPaths(paragraphs), ['A > A1', 'B']);
  });

  it('strips Astro {#anchor-id} suffix from heading text and section path', () => {
    // Regression: without stripping, the sectionPath of every segment in the
    // section would include "{#using-parameters}" and never align with EN.
    const md = [
      '## Using Parameters {#using-parameters}',
      '',
      'Parameter intro.',
      '',
      '### Sub {#sub-heading}',
      '',
      'Sub paragraph.',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const headings = byKind(segments, 'heading');
    assert.deepEqual(
      headings.map((h) => h.textNorm),
      ['using parameters', 'sub'],
    );
    const paragraphs = byKind(segments, 'paragraph');
    assert.deepEqual(
      paragraphs.map((p) => p.sectionPath),
      ['Using Parameters', 'Using Parameters > Sub'],
    );
  });
});

// ---------------------------------------------------------------------------
// Paragraphs
// ---------------------------------------------------------------------------

describe('extractSegmentsFromMarkdown — paragraphs', () => {
  it('merges consecutive text lines into a single paragraph segment', () => {
    const md = [
      '## Section',
      '',
      'First line.',
      'Second line.',
      'Third line.',
      '',
    ].join('\n');
    const paragraphs = byKind(extractSegmentsFromMarkdown(md), 'paragraph');
    assert.equal(paragraphs.length, 1);
    assert.equal(paragraphs[0].textNorm, 'first line. second line. third line.');
  });

  it('separates paragraphs split by a blank line', () => {
    const md = [
      '## Section',
      '',
      'First paragraph.',
      '',
      'Second paragraph.',
      '',
    ].join('\n');
    const paragraphs = byKind(extractSegmentsFromMarkdown(md), 'paragraph');
    assert.equal(paragraphs.length, 2);
    assert.equal(paragraphs[0].segmentIndex, 0);
    assert.equal(paragraphs[1].segmentIndex, 1);
  });

  it('skips code fence bodies entirely', () => {
    const md = [
      '## Section',
      '',
      'Before code.',
      '',
      '```bash',
      'npm install',
      'echo hello',
      '```',
      '',
      'After code.',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const paragraphs = byKind(segments, 'paragraph');
    assert.equal(paragraphs.length, 2);
    assert.deepEqual(
      paragraphs.map((p) => p.textNorm),
      ['before code.', 'after code.'],
    );
    const codeSegments = byKind(segments, 'code-block');
    assert.equal(codeSegments.length, 1);
  });

  it('treats a markdown horizontal rule as structural, not as a paragraph', () => {
    const md = [
      '## S',
      '',
      'Before rule.',
      '',
      '---',
      '',
      'After rule.',
      '',
    ].join('\n');
    const paragraphs = byKind(extractSegmentsFromMarkdown(md), 'paragraph');
    assert.equal(paragraphs.length, 2);
    assert.deepEqual(
      paragraphs.map((p) => p.textNorm),
      ['before rule.', 'after rule.'],
    );
  });

  it('assigns incrementing segmentIndex within a section and resets across sections', () => {
    const md = [
      '## A',
      '',
      'A1.',
      '',
      'A2.',
      '',
      '## B',
      '',
      'B1.',
      '',
    ].join('\n');
    const paragraphs = byKind(extractSegmentsFromMarkdown(md), 'paragraph');
    assert.equal(paragraphs.length, 3);
    assert.deepEqual(
      paragraphs.map((p) => ({ path: p.sectionPath, i: p.segmentIndex })),
      [
        { path: 'A', i: 0 },
        { path: 'A', i: 1 },
        { path: 'B', i: 0 },
      ],
    );
  });
});

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

describe('extractSegmentsFromMarkdown — lists', () => {
  it('emits one ordered-list-item segment per numbered step', () => {
    const md = [
      '## Steps',
      '',
      '1. First step.',
      '2. Second step.',
      '3. Third step.',
      '',
    ].join('\n');
    const items = byKind(extractSegmentsFromMarkdown(md), 'ordered-list-item');
    assert.equal(items.length, 3);
    assert.deepEqual(
      items.map((i) => i.textNorm),
      ['first step.', 'second step.', 'third step.'],
    );
  });

  it('emits one unordered-list-item segment per bullet', () => {
    const md = [
      '## Bullets',
      '',
      '- Alpha',
      '- Beta',
      '- Gamma',
      '',
    ].join('\n');
    const items = byKind(extractSegmentsFromMarkdown(md), 'unordered-list-item');
    assert.equal(items.length, 3);
  });

  it('supports nested bullets as separate segments', () => {
    const md = [
      '## Section',
      '',
      '- Top 1',
      '  - Nested 1a',
      '  - Nested 1b',
      '- Top 2',
      '',
    ].join('\n');
    const items = byKind(extractSegmentsFromMarkdown(md), 'unordered-list-item');
    assert.equal(items.length, 4);
  });
});

// ---------------------------------------------------------------------------
// Callouts
// ---------------------------------------------------------------------------

describe('extractSegmentsFromMarkdown — callouts', () => {
  it('emits callout-body for paragraphs inside :::note / :::caution blocks', () => {
    const md = [
      '## Info',
      '',
      ':::note',
      'First note paragraph.',
      '',
      'Second note paragraph.',
      ':::',
      '',
    ].join('\n');
    const bodies = byKind(extractSegmentsFromMarkdown(md), 'callout-body');
    assert.equal(bodies.length, 2);
    assert.deepEqual(
      bodies.map((b) => b.textNorm),
      ['first note paragraph.', 'second note paragraph.'],
    );
  });

  it('does not count callout-body content as regular paragraphs', () => {
    const md = [
      '## Info',
      '',
      'Regular paragraph.',
      '',
      ':::note',
      'Note text.',
      ':::',
      '',
      'Another regular paragraph.',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    assert.equal(byKind(segments, 'paragraph').length, 2);
    assert.equal(byKind(segments, 'callout-body').length, 1);
  });

  it('handles :::note{title="X"} directive syntax', () => {
    const md = [
      '## Info',
      '',
      ':::note{title="Hint"}',
      'Body text.',
      ':::',
      '',
    ].join('\n');
    const bodies = byKind(extractSegmentsFromMarkdown(md), 'callout-body');
    assert.equal(bodies.length, 1);
  });

  it('classifies unordered-list items inside a callout as unordered-list-item, not callout-body', () => {
    // Regression: previously, lines inside :::note were all swallowed as
    // callout-body, so list markers never reached the normal list handler.
    // EN walkCalloutBody emits unordered-list-item for <ul><li> inside a
    // callout; JA must match so Phase 5 segment kinds align.
    const md = [
      '## S',
      '',
      ':::note',
      'Intro paragraph.',
      '',
      '- Step A',
      '- Step B',
      ':::',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const bodies = byKind(segments, 'callout-body');
    const items = byKind(segments, 'unordered-list-item');
    assert.equal(bodies.length, 1);
    assert.equal(bodies[0].textNorm, 'intro paragraph.');
    assert.equal(items.length, 2);
    assert.deepEqual(items.map((i) => i.textNorm), ['step a', 'step b']);
  });

  it('classifies ordered-list items inside a callout as ordered-list-item', () => {
    const md = [
      '## S',
      '',
      ':::note',
      '1. First',
      '2. Second',
      ':::',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    assert.equal(byKind(segments, 'ordered-list-item').length, 2);
    assert.equal(byKind(segments, 'callout-body').length, 0);
  });

  it('restores paragraphKind across <details> nested inside a callout', () => {
    // Regression: paragraphKind previously stayed 'callout-body' across
    // <details> boundaries, so paragraphs inside a details-in-callout were
    // emitted as callout-body. EN walkCalloutBody → walkDetails → walkBlock
    // emits them as regular paragraphs. Tracking must re-enter 'callout-body'
    // after the </details> so subsequent callout text still classifies
    // correctly.
    const md = [
      '## S',
      '',
      ':::note',
      'Intro callout text.',
      '',
      '<details>',
      '<summary>Question?</summary>',
      '',
      'Details answer body.',
      '',
      '</details>',
      '',
      'Trailing callout text.',
      ':::',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const summaries = byKind(segments, 'details-summary');
    assert.equal(summaries.length, 1);
    assert.equal(summaries[0].textNorm, 'question?');
    // The details-internal paragraph is a regular paragraph (not callout-body).
    const paragraphs = byKind(segments, 'paragraph');
    assert.equal(paragraphs.length, 1);
    assert.equal(paragraphs[0].textNorm, 'details answer body.');
    // The callout text outside the details stays callout-body.
    const bodies = byKind(segments, 'callout-body');
    assert.deepEqual(
      bodies.map((b) => b.textNorm),
      ['intro callout text.', 'trailing callout text.'],
    );
  });
});

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

describe('extractSegmentsFromMarkdown — tables', () => {
  it('emits one table-cell segment per non-separator, non-header cell', () => {
    const md = [
      '## Data',
      '',
      '| Name  | Value |',
      '| ----- | ----- |',
      '| Alpha | 1     |',
      '| Beta  | 2     |',
      '',
    ].join('\n');
    const cells = byKind(extractSegmentsFromMarkdown(md), 'table-cell');
    // 2 data rows × 2 cols = 4 cells
    assert.equal(cells.length, 4);
    assert.deepEqual(
      cells.map((c) => c.textNorm),
      ['alpha', '1', 'beta', '2'],
    );
  });

  it('skips the separator row (|---|---|)', () => {
    const md = [
      '## Data',
      '',
      '| A | B |',
      '| - | - |',
      '| 1 | 2 |',
      '',
    ].join('\n');
    const cells = byKind(extractSegmentsFromMarkdown(md), 'table-cell');
    assert.equal(cells.length, 2);
  });

  it('respects escaped pipe delimiters (\\|) inside cell content', () => {
    // Regression: `| a \| b | c |` should produce two cells ("a | b", "c"),
    // not three. Common in code-heavy docs where cell content includes
    // literal pipes (e.g. regex alternation, shell pipelines).
    const md = [
      '## Data',
      '',
      '| Code | Meaning |',
      '| ---- | ------- |',
      '| a \\| b | either a or b |',
      '',
    ].join('\n');
    const cells = byKind(extractSegmentsFromMarkdown(md), 'table-cell');
    assert.equal(cells.length, 2);
    assert.equal(cells[0].textNorm, 'a | b');
    assert.equal(cells[1].textNorm, 'either a or b');
  });
});

// ---------------------------------------------------------------------------
// Details / summary
// ---------------------------------------------------------------------------

describe('extractSegmentsFromMarkdown — details/summary', () => {
  it('emits a details-summary segment for each <summary> line', () => {
    const md = [
      '## FAQ',
      '',
      '<details>',
      '<summary>First question?</summary>',
      '',
      'First answer.',
      '',
      '</details>',
      '',
      '<details>',
      '<summary>Second question?</summary>',
      '',
      'Second answer.',
      '',
      '</details>',
      '',
    ].join('\n');
    const summaries = byKind(extractSegmentsFromMarkdown(md), 'details-summary');
    assert.equal(summaries.length, 2);
    assert.deepEqual(
      summaries.map((s) => s.textNorm),
      ['first question?', 'second question?'],
    );
  });

  it('classifies block-level content inside <details> via the normal flow', () => {
    // Regression: previously the JA extractor flattened everything inside
    // <details> into the paragraph buffer. EN walkDetails recurses into
    // walkBlock for non-summary children, so lists/tables/images keep their
    // proper segment kinds. JA must match for Phase 5 alignment on FAQ pages
    // with structured answers.
    const md = [
      '## FAQ',
      '',
      '<details>',
      '<summary>Question?</summary>',
      '',
      '- Answer bullet A',
      '- Answer bullet B',
      '',
      '</details>',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    assert.equal(byKind(segments, 'details-summary').length, 1);
    assert.equal(byKind(segments, 'unordered-list-item').length, 2);
    assert.equal(byKind(segments, 'paragraph').length, 0);
  });

  it('classifies paragraphs inside <details> as regular paragraph (not callout-body)', () => {
    const md = [
      '## FAQ',
      '',
      '<details>',
      '<summary>Q</summary>',
      '',
      'Regular answer paragraph.',
      '',
      '</details>',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    assert.equal(byKind(segments, 'details-summary').length, 1);
    const paragraphs = byKind(segments, 'paragraph');
    assert.equal(paragraphs.length, 1);
    assert.equal(paragraphs[0].textNorm, 'regular answer paragraph.');
  });

  it('preserves link tokens inside <summary> so invariant tokens match EN', () => {
    // Regression: summary extraction previously stripped nested HTML tags
    // before passing to createSegment, dropping href targets and leaving
    // entities undecoded. EN renderInlineText converts <a> to markdown link
    // so the URL survives as an invariant token.
    const md = [
      '## FAQ',
      '',
      '<details>',
      '<summary>Run <a href="/docs/advanced-editing/loops">the loops guide</a> &amp; verify</summary>',
      '',
      'Answer.',
      '',
      '</details>',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const summaries = byKind(segments, 'details-summary');
    assert.equal(summaries.length, 1);
    const summary = summaries[0];
    // Visible text has HTML tags stripped and entities decoded.
    assert.equal(summary.textNorm, 'run the loops guide & verify');
    // The href is captured as an invariant token.
    assert.ok(
      summary.tokensInvariant.includes('/docs/advanced-editing/loops'),
      `expected token /docs/advanced-editing/loops, got ${JSON.stringify(summary.tokensInvariant)}`,
    );
  });

  it('preserves inline code backticks inside <summary>', () => {
    const md = [
      '## FAQ',
      '',
      '<details>',
      '<summary>How to use <code>--proxy</code>?</summary>',
      '',
      'Answer.',
      '',
      '</details>',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const summaries = byKind(segments, 'details-summary');
    assert.ok(summaries[0].tokensInvariant.includes('--proxy'));
  });

  it('preserves BOTH the link and inline-code tokens for <a><code>…</code></a> in <summary>', () => {
    // Regression: previously <a> was processed before <code>, and the <a>
    // branch stripped inner tags, turning <code>--proxy</code> into plain
    // text "--proxy" (without backticks). The resulting markdown
    // "[--proxy](/docs/...)" loses the code token on JA while EN keeps
    // both via recursive renderInlineText.
    const md = [
      '## FAQ',
      '',
      '<details>',
      '<summary>See <a href="/docs/running-tests/the-command-line-cli"><code>--proxy</code></a> docs</summary>',
      '',
      'Answer.',
      '',
      '</details>',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const summaries = byKind(segments, 'details-summary');
    assert.equal(summaries.length, 1);
    const tokens = summaries[0].tokensInvariant;
    assert.ok(
      tokens.includes('--proxy'),
      `expected --proxy token, got ${JSON.stringify(tokens)}`,
    );
    assert.ok(
      tokens.includes('/docs/running-tests/the-command-line-cli'),
      `expected URL token, got ${JSON.stringify(tokens)}`,
    );
  });

  it('extracts summary from a condensed single-line <details><summary>…</summary></details>', () => {
    // Regression: DETAILS_OPEN_RE matched first and `continue`d, so the
    // summary inside a one-line details block was never extracted.
    const md = [
      '## FAQ',
      '',
      '<details><summary>Condensed question?</summary></details>',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const summaries = byKind(segments, 'details-summary');
    assert.equal(summaries.length, 1);
    assert.equal(summaries[0].textNorm, 'condensed question?');
  });

  it('balances the details-depth stack after a condensed single-line details block', () => {
    // Ensure open/close on the same line correctly push+pop the stack so
    // subsequent content outside the details is not misclassified.
    const md = [
      '## S',
      '',
      ':::note',
      '<details><summary>Q</summary></details>',
      '',
      'Trailing callout text.',
      ':::',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    assert.equal(byKind(segments, 'details-summary').length, 1);
    const bodies = byKind(segments, 'callout-body');
    assert.equal(bodies.length, 1);
    assert.equal(bodies[0].textNorm, 'trailing callout text.');
  });

  it('preserves text surrounding a condensed <details> block on the same line', () => {
    // Regression: the single-line details handler used to `continue` after
    // processing any token, dropping plain text before or after the block.
    // EN's walkBlockContainer emits such text as paragraph segments.
    const md = [
      '## S',
      '',
      'Lead <details><summary>Condensed?</summary></details> tail',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    assert.equal(byKind(segments, 'details-summary').length, 1);
    const paragraphs = byKind(segments, 'paragraph');
    // Expect "Lead" and "tail" emitted as separate paragraph spans around
    // the condensed details block (EN parses "Lead" and "tail" as text
    // nodes adjacent to the block-level <details>).
    assert.equal(paragraphs.length, 2);
    assert.deepEqual(
      paragraphs.map((p) => p.textNorm),
      ['lead', 'tail'],
    );
  });

  it('preserves surrounding text inside a :::note as callout-body (not paragraph)', () => {
    // Same pattern but inside a callout — surrounding text must stay
    // classified as callout-body because paragraphKind is 'callout-body'
    // when the text is emitted (paragraphKind only flips to 'paragraph'
    // between the details-open and details-close boundary).
    const md = [
      '## S',
      '',
      ':::note',
      'Lead <details><summary>Q</summary></details> tail',
      ':::',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    assert.equal(byKind(segments, 'details-summary').length, 1);
    const bodies = byKind(segments, 'callout-body');
    assert.equal(bodies.length, 2);
    assert.deepEqual(
      bodies.map((b) => b.textNorm),
      ['lead', 'tail'],
    );
    assert.equal(byKind(segments, 'paragraph').length, 0);
  });

  it('handles multiple condensed <details> blocks on a single line', () => {
    const md = [
      '## S',
      '',
      'A <details><summary>Q1</summary></details> B <details><summary>Q2</summary></details> C',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    assert.equal(byKind(segments, 'details-summary').length, 2);
    const paragraphs = byKind(segments, 'paragraph');
    assert.deepEqual(
      paragraphs.map((p) => p.textNorm),
      ['a', 'b', 'c'],
    );
  });

  it('details tokenizer respects ">" inside quoted attribute values', () => {
    // Regression: the previous regex-based tokenizer used [^>]* for the
    // details/summary opening tags, so an attribute value containing ">"
    // split the tag mid-attribute and produced stray paragraph fragments
    // like "0\">" or "1\">q". EN uses a quote-aware findTagEnd scanner and
    // stayed correct — JA must match.
    const md = [
      '## S',
      '',
      '<details data-x="1>0"><summary data-y="2>1">Q</summary></details>',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const summaries = byKind(segments, 'details-summary');
    assert.equal(summaries.length, 1);
    assert.equal(summaries[0].textNorm, 'q');
    // No stray paragraph / callout-body segments from the broken split.
    assert.equal(byKind(segments, 'paragraph').length, 0);
    assert.equal(byKind(segments, 'callout-body').length, 0);
  });

  it('details tokenizer respects single-quoted attribute values with ">"', () => {
    const md = [
      "## S",
      "",
      "<details data-x='a>b'><summary>Quoted</summary></details>",
      "",
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const summaries = byKind(segments, 'details-summary');
    assert.equal(summaries.length, 1);
    assert.equal(summaries[0].textNorm, 'quoted');
    assert.equal(byKind(segments, 'paragraph').length, 0);
  });

  it('standalone <summary> at top level emits a paragraph (not details-summary)', () => {
    // Regression: the event walker previously emitted details-summary for
    // any <summary>…</summary> token regardless of detailsDepth. EN only
    // emits details-summary from inside walkDetails; a loose <summary>
    // falls through walkBlock → walkBlockContainer which emits the text
    // child as 'paragraph'. Verified against EN extractor output.
    const md = [
      '## S',
      '',
      '<summary>Loose</summary>',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    assert.equal(byKind(segments, 'details-summary').length, 0);
    const paragraphs = byKind(segments, 'paragraph');
    assert.equal(paragraphs.length, 1);
    assert.equal(paragraphs[0].textNorm, 'loose');
  });

  it('standalone <summary> inside a :::note also emits as paragraph (matching EN)', () => {
    // EN walkCalloutBody routes non-<p> children to walkBlock → fallback
    // walkBlockContainer, which hardcodes the 'paragraph' kind for text
    // children even inside a callout context. JA must match.
    const md = [
      '## S',
      '',
      ':::note',
      '<summary>Loose</summary>',
      ':::',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    assert.equal(byKind(segments, 'details-summary').length, 0);
    assert.equal(byKind(segments, 'callout-body').length, 0);
    const paragraphs = byKind(segments, 'paragraph');
    assert.equal(paragraphs.length, 1);
    assert.equal(paragraphs[0].textNorm, 'loose');
  });

  // -------------------------------------------------------------------------
  // Multi-line <summary> support (P2)
  // -------------------------------------------------------------------------

  it('supports a multi-line <summary> inside <details>', () => {
    // Regression: the previous line-based tokenizer only matched summaries
    // with the close tag on the same line. Content on subsequent lines
    // leaked out as paragraphs and the standalone </summary> became
    // literal text.
    const md = [
      '## FAQ',
      '',
      '<details>',
      '<summary>',
      'Line 1',
      'Line 2',
      '</summary>',
      '',
      'Tail paragraph.',
      '',
      '</details>',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const summaries = byKind(segments, 'details-summary');
    assert.equal(summaries.length, 1);
    assert.equal(summaries[0].textNorm, 'line 1 line 2');
    const paragraphs = byKind(segments, 'paragraph');
    assert.equal(paragraphs.length, 1);
    assert.equal(paragraphs[0].textNorm, 'tail paragraph.');
  });

  it('supports the split-line variant <details><summary>\\nQ\\n</summary></details>', () => {
    const md = [
      '## FAQ',
      '',
      '<details><summary>',
      'Q',
      '</summary></details>',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const summaries = byKind(segments, 'details-summary');
    assert.equal(summaries.length, 1);
    assert.equal(summaries[0].textNorm, 'q');
    assert.equal(byKind(segments, 'paragraph').length, 0);
  });

  it('processes trailing content after </summary> on the close line', () => {
    const md = [
      '## FAQ',
      '',
      '<details>',
      '<summary>',
      'Multi',
      '</summary> trailing inline text',
      '',
      '</details>',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const summaries = byKind(segments, 'details-summary');
    assert.equal(summaries.length, 1);
    assert.equal(summaries[0].textNorm, 'multi');
    const paragraphs = byKind(segments, 'paragraph');
    assert.equal(paragraphs.length, 1);
    assert.equal(paragraphs[0].textNorm, 'trailing inline text');
  });

  // -------------------------------------------------------------------------
  // Loose <summary> boundary parity with EN (P3)
  // -------------------------------------------------------------------------

  it('loose <summary> with inline <code> emits one paragraph per text node (matching EN)', () => {
    // Verified against EN extractor: loose <summary>Run <code>--proxy</code></summary>
    // produces two paragraphs "run" and "--proxy" because EN's
    // walkBlockContainer recurses through unknown blocks and emits each
    // text node via its text-child branch.
    const md = [
      '## S',
      '',
      '<summary>Run <code>--proxy</code></summary>',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    assert.equal(byKind(segments, 'details-summary').length, 0);
    const paragraphs = byKind(segments, 'paragraph');
    assert.deepEqual(
      paragraphs.map((p) => p.textNorm),
      ['run', '--proxy'],
    );
  });

  it('loose <summary> with <strong> emits three paragraphs matching EN', () => {
    const md = [
      '## S',
      '',
      '<summary>A <strong>bold</strong> B</summary>',
      '',
    ].join('\n');
    const paragraphs = byKind(extractSegmentsFromMarkdown(md), 'paragraph');
    assert.deepEqual(
      paragraphs.map((p) => p.textNorm),
      ['a', 'bold', 'b'],
    );
  });

  it('loose <summary> with an anchor emits three paragraphs matching EN', () => {
    const md = [
      '## S',
      '',
      '<summary>See <a href="/docs/x">link</a> text</summary>',
      '',
    ].join('\n');
    const paragraphs = byKind(extractSegmentsFromMarkdown(md), 'paragraph');
    assert.deepEqual(
      paragraphs.map((p) => p.textNorm),
      ['see', 'link', 'text'],
    );
  });

  it('loose <summary> with plain text stays as a single paragraph', () => {
    const md = [
      '## S',
      '',
      '<summary>Plain text here</summary>',
      '',
    ].join('\n');
    const paragraphs = byKind(extractSegmentsFromMarkdown(md), 'paragraph');
    assert.equal(paragraphs.length, 1);
    assert.equal(paragraphs[0].textNorm, 'plain text here');
  });

  it('loose <summary> with <img> emits image segment between text paragraphs', () => {
    // Verified against EN: <summary>See <img src="x.png"/> now</summary>
    // yields paragraph "see" + image "x.png" + paragraph "now".
    const md = [
      '## S',
      '',
      '<summary>See <img src="x.png"/> now</summary>',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const nonHeading = segments.filter((s) => s.segmentKind !== 'heading');
    assert.deepEqual(
      nonHeading.map((s) => s.segmentKind),
      ['paragraph', 'image', 'paragraph'],
    );
    assert.equal(nonHeading[0].textNorm, 'see');
    assert.equal(nonHeading[2].textNorm, 'now');
  });

  it('loose <summary> with <ul><li> keeps list-item kind', () => {
    // Verified against EN: <summary>Intro<ul><li>Step</li></ul>Tail</summary>
    // yields paragraph "intro" + unordered-list-item "step" + paragraph "tail".
    const md = [
      '## S',
      '',
      '<summary>Intro<ul><li>Step</li></ul>Tail</summary>',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const nonHeading = segments.filter((s) => s.segmentKind !== 'heading');
    assert.deepEqual(
      nonHeading.map((s) => s.segmentKind),
      ['paragraph', 'unordered-list-item', 'paragraph'],
    );
    assert.deepEqual(
      nonHeading.map((s) => s.textNorm),
      ['intro', 'step', 'tail'],
    );
  });

  it('loose <summary> quote-aware: <img alt="1>0" src="x.png"/>', () => {
    // Regression: the previous extractTextNodes helper used a naive
    // `<[^>]+>` split which broke on ">" inside quoted attribute values.
    const md = [
      '## S',
      '',
      '<summary>See <img alt="1>0" src="x.png"/> now</summary>',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const nonHeading = segments.filter((s) => s.segmentKind !== 'heading');
    assert.deepEqual(
      nonHeading.map((s) => s.segmentKind),
      ['paragraph', 'image', 'paragraph'],
    );
    assert.equal(nonHeading[0].textNorm, 'see');
    assert.equal(nonHeading[2].textNorm, 'now');
  });

  it('loose <summary> quote-aware: <a data-x="1>0" href="/docs/y">', () => {
    // Verified against EN: <a> is treated as an unknown block and its
    // child text becomes a paragraph, but the tokenizer must still
    // respect quoted attribute values containing ">".
    const md = [
      '## S',
      '',
      '<summary>Text <a data-x="1>0" href="/docs/y">link</a> end</summary>',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const nonHeading = segments.filter((s) => s.segmentKind !== 'heading');
    assert.deepEqual(
      nonHeading.map((s) => s.textNorm),
      ['text', 'link', 'end'],
    );
  });

  it('loose <summary> closes on the matching outer </summary>, not a nested one', () => {
    // Regression: the previous naive `match(/<\/summary>/)` grabbed the
    // first close tag, so the outer summary was truncated at the nested
    // inner close and the real outer </summary> leaked into trailing text.
    // Verified against EN: the correct output is paragraph + details-summary
    // + paragraph, with no stray </summary> fragment.
    const md = [
      '## S',
      '',
      '<summary>Lead <details><summary>Q</summary></details> tail</summary>',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const nonHeading = segments.filter((s) => s.segmentKind !== 'heading');
    assert.deepEqual(
      nonHeading.map((s) => ({ k: s.segmentKind, t: s.textNorm })),
      [
        { k: 'paragraph', t: 'lead' },
        { k: 'details-summary', t: 'q' },
        { k: 'paragraph', t: 'tail' },
      ],
    );
  });

  it('multi-line loose <summary> tracks nesting depth across lines', () => {
    // Multi-line variant of the previous test: inner close appears on a
    // different line than the outer close. The multi-line handler must
    // track summary depth across lines so the inner pair does not
    // prematurely terminate the outer buffer.
    const md = [
      '## S',
      '',
      '<summary>',
      'Lead',
      '<details><summary>Q</summary></details>',
      'tail',
      '</summary>',
      '',
    ].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    const nonHeading = segments.filter((s) => s.segmentKind !== 'heading');
    // The outer loose summary delegates to EN; the inner <details>/<summary>
    // pair becomes a details-summary, surrounded by paragraph text-node
    // chunks from the outer summary's body.
    const kinds = nonHeading.map((s) => s.segmentKind);
    assert.ok(
      kinds.includes('details-summary'),
      `expected details-summary, got ${JSON.stringify(kinds)}`,
    );
    assert.ok(
      nonHeading.some((s) => s.segmentKind === 'details-summary' && s.textNorm === 'q'),
    );
    // No stray "</summary>" text should appear in any segment.
    for (const seg of nonHeading) {
      assert.ok(
        !seg.textNorm.includes('</summary>'),
        `stray close tag in ${JSON.stringify(seg)}`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Image captions
// ---------------------------------------------------------------------------

describe('extractSegmentsFromMarkdown — images', () => {
  it('emits an image segment (non-gate) for each standalone image line', () => {
    const md = [
      '## Visual',
      '',
      '![screenshot](./images/foo.png)',
      '',
      '![diagram](./images/bar.png)',
      '',
    ].join('\n');
    const images = byKind(extractSegmentsFromMarkdown(md), 'image');
    assert.equal(images.length, 2);
  });
});

// ---------------------------------------------------------------------------
// Shape invariants
// ---------------------------------------------------------------------------

describe('extractSegmentsFromMarkdown — shape invariants', () => {
  it('every segment has required fields', () => {
    const md = ['## A', '', 'Text.', '', '- bullet', '', '1. step', ''].join('\n');
    const segments = extractSegmentsFromMarkdown(md);
    for (const segment of segments) {
      assert.ok(typeof segment.sectionPath === 'string', 'sectionPath');
      assert.ok(typeof segment.segmentKind === 'string', 'segmentKind');
      assert.ok(typeof segment.segmentIndex === 'number', 'segmentIndex');
      assert.ok(typeof segment.textNorm === 'string', 'textNorm');
      assert.ok(Array.isArray(segment.tokensInvariant), 'tokensInvariant');
      assert.match(segment.sourceFingerprint, /^sha256:[0-9a-f]{64}$/);
    }
  });

  it('is deterministic: same input yields identical segments', () => {
    const md = '## A\n\nText one.\n\nText two.\n';
    const a = extractSegmentsFromMarkdown(md);
    const b = extractSegmentsFromMarkdown(md);
    assert.deepEqual(a, b);
  });
});
