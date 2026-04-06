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
