import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildSlugIndex, matchesSectionFilter, splitFrontmatter, toKebab } from '../lib/project.mjs';

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

describe('matchesSectionFilter', () => {
  it('returns true when no filter is provided', () => {
    assert.ok(matchesSectionFilter('src/content/docs/results/foo.md', {}, null));
    assert.ok(matchesSectionFilter('src/content/docs/results/foo.md', {}, ''));
  });

  it('resolves sidebar section by Japanese label and matches slug', () => {
    // '概要' → Overview section → includes testim-overview
    const rel = 'src/content/docs/overview/testim-overview.md';
    assert.ok(matchesSectionFilter(rel, { category: '概要' }, '概要'));
  });

  it('resolves sidebar section by English name', () => {
    const rel = 'src/content/docs/overview/testim-overview.md';
    assert.ok(matchesSectionFilter(rel, { category: '概要' }, 'Overview'));
  });

  it('resolves legacy alias テスト結果 → 結果', () => {
    // execution-runs-screen is in the Results（結果）section
    const rel = 'src/content/docs/results/execution-runs-screen.md';
    assert.ok(matchesSectionFilter(rel, { category: 'テスト結果' }, 'テスト結果'));
  });

  it('resolves legacy alias 管理者機能 → 管理', () => {
    const rel = 'src/content/docs/project-user-management/api-access.md';
    assert.ok(matchesSectionFilter(rel, { category: '管理者機能' }, '管理者機能'));
  });

  it('rejects slug not in the resolved section', () => {
    // testim-overview is in Overview, not Results
    const rel = 'src/content/docs/overview/testim-overview.md';
    assert.ok(!matchesSectionFilter(rel, { category: '概要' }, '結果'));
  });

  it('does not false-positive on substring matches like results-overview', () => {
    // --section=Overview should NOT match results-overview (it is in Results, not Overview)
    const rel = 'src/content/docs/results/results-overview.md';
    assert.ok(!matchesSectionFilter(rel, { category: '結果' }, 'Overview'));
  });

  it('falls back to heuristic for unknown section names', () => {
    const rel = 'src/content/docs/results/test-results.md';
    // Substring match against folder name
    assert.ok(matchesSectionFilter(rel, { category: '結果' }, 'results'));
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
