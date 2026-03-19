import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { stripMarkdown, generateDescription } from '../lib/markdown-utils.mjs';

describe('stripMarkdown', () => {
  it('removes image syntax', () => {
    assert.equal(stripMarkdown('See ![alt](img.png) here'), 'See here');
  });

  it('extracts link text', () => {
    assert.equal(stripMarkdown('Click [here](https://example.com) now'), 'Click here now');
  });

  it('removes inline code backticks', () => {
    assert.equal(stripMarkdown('Use `foo` function'), 'Use foo function');
  });

  it('removes markdown emphasis characters and hyphens', () => {
    assert.equal(stripMarkdown('**bold** and *italic*'), 'bold and italic');
    assert.equal(stripMarkdown('a - b - c'), 'a b c');
  });

  it('handles null/undefined input', () => {
    assert.equal(stripMarkdown(null), '');
    assert.equal(stripMarkdown(undefined), '');
  });

  it('trims and collapses whitespace', () => {
    assert.equal(stripMarkdown('  a   b   c  '), 'a b c');
  });
});

describe('generateDescription', () => {
  it('returns first paragraph as description', () => {
    const content = 'This is the first paragraph.\n\nThis is the second.';
    const result = generateDescription('Title', content);
    assert.equal(result, 'This is the first paragraph.');
  });

  it('skips headings and callout delimiters', () => {
    const content = '# Heading\n\n:::note\n:::\n\nActual paragraph.';
    const result = generateDescription('Title', content);
    assert.equal(result, 'Actual paragraph.');
  });

  it('skips code fence delimiters and image lines', () => {
    const content = '```js\n```\n\n![img](foo.png)\n\nReal text here.';
    const result = generateDescription('Title', content);
    assert.equal(result, 'Real text here.');
  });

  it('skips list items', () => {
    const content = '- item one\n- item two\n\nParagraph text.';
    const result = generateDescription('Title', content);
    assert.equal(result, 'Paragraph text.');
  });

  it('truncates at 120 characters', () => {
    const longLine = 'A'.repeat(200);
    const result = generateDescription('Title', longLine);
    assert.equal(result.length, 120);
  });

  it('returns fallback when no paragraph found', () => {
    const content = '# Only heading\n\n- list\n- items';
    const result = generateDescription('MyTitle', content);
    assert.equal(result, 'MyTitle に関する日本語ドキュメントです。');
  });
});
