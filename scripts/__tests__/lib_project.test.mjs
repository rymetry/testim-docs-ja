import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildSlugIndex, splitFrontmatter, toKebab } from '../lib/project.mjs';

describe('buildSlugIndex', () => {
  it('returns an object with slug keys mapping to categoryFolder and filePath', () => {
    const index = buildSlugIndex();
    const slugs = Object.keys(index);
    assert.ok(slugs.length > 0, 'should find at least one doc');

    const first = index[slugs[0]];
    assert.ok(typeof first.categoryFolder === 'string');
    assert.ok(typeof first.filePath === 'string');
    assert.ok(first.filePath.endsWith('.md'));
  });

  it('slug does not contain .md extension', () => {
    const index = buildSlugIndex();
    for (const slug of Object.keys(index)) {
      assert.ok(!slug.endsWith('.md'), `slug "${slug}" should not end with .md`);
    }
  });
});

describe('splitFrontmatter', () => {
  it('splits standard frontmatter from body', () => {
    const md = '---\ntitle: Test\n---\nBody text here';
    const result = splitFrontmatter(md);
    assert.equal(result.fm, '---\ntitle: Test\n---');
    assert.equal(result.body, 'Body text here');
  });

  it('returns empty fm when no frontmatter present', () => {
    const md = 'Just body text';
    const result = splitFrontmatter(md);
    assert.equal(result.fm, '');
    assert.equal(result.body, 'Just body text');
  });

  it('returns empty fm when opening delimiter is missing', () => {
    const md = 'title: Test\n---\nBody';
    const result = splitFrontmatter(md);
    assert.equal(result.fm, '');
    assert.equal(result.body, md);
  });

  it('returns empty fm when closing delimiter is missing', () => {
    const md = '---\ntitle: Test\nBody text';
    const result = splitFrontmatter(md);
    assert.equal(result.fm, '');
    assert.equal(result.body, md);
  });

  it('strips leading newlines from body', () => {
    const md = '---\ntitle: Test\n---\n\n\nBody';
    const result = splitFrontmatter(md);
    assert.equal(result.body, 'Body');
  });
});

describe('toKebab', () => {
  it('converts a simple string to kebab case', () => {
    assert.equal(toKebab('Hello World'), 'hello-world');
  });

  it('handles ampersands', () => {
    assert.equal(toKebab('Q&A'), 'q-a');
  });

  it('removes leading and trailing hyphens', () => {
    assert.equal(toKebab('  Hello  '), 'hello');
  });

  it('collapses multiple hyphens', () => {
    assert.equal(toKebab('a   b   c'), 'a-b-c');
  });

  it('handles non-ASCII via NFKC normalization', () => {
    const result = toKebab('Ｔｅｓｔ');
    assert.equal(result, 'test');
  });

  it('returns empty string for empty input', () => {
    assert.equal(toKebab(''), '');
  });
});
