import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createMarkdownProcessor, rehypeHeadingIds } from '@astrojs/markdown-remark';

import remarkHeadingIds, { rehypeUniqueHeadingIds } from '../../src/lib/remark-heading-ids.mjs';

async function render(markdown) {
  const processor = await createMarkdownProcessor({
    remarkPlugins: [remarkHeadingIds],
    rehypePlugins: [rehypeHeadingIds, rehypeUniqueHeadingIds],
    syntaxHighlight: false,
  });
  const { code, metadata } = await processor.render(markdown);
  return { code, headings: metadata.headings };
}

describe('remarkHeadingIds', () => {
  it('uses a trailing {#id} as the heading id and removes it from the text', async () => {
    const { code, headings } = await render('## パラメーターの使用 {#using-parameters}\n');

    assert.match(code, /<h2 id="using-parameters">パラメーターの使用<\/h2>/);
    assert.deepEqual(headings, [
      { depth: 2, slug: 'using-parameters', text: 'パラメーターの使用' },
    ]);
  });

  it('keeps inline markup before the {#id}', async () => {
    const { code, headings } = await render('### `Get Cookie` ステップ {#get-cookie}\n');

    assert.match(code, /<h3 id="get-cookie"><code>Get Cookie<\/code> ステップ<\/h3>/);
    assert.equal(headings[0].slug, 'get-cookie');
  });

  it('leaves headings without {#id} to the automatic slug', async () => {
    const { code, headings } = await render('## 手動ステップ\n\n本文 {#not-a-heading}\n');

    assert.match(code, /<h2 id="手動ステップ">手動ステップ<\/h2>/);
    assert.match(code, /本文 \{#not-a-heading\}/);
    assert.equal(headings[0].slug, '手動ステップ');
  });

  it('does not treat {#id} in the middle of a heading as an id', async () => {
    const { headings } = await render('## 前 {#mid} 後\n');

    assert.notEqual(headings[0].slug, 'mid');
  });

  it('ignores a {#id} that contains whitespace', async () => {
    const { code } = await render('## 見出し {#a b}\n');

    assert.match(code, /<h2 id="見出し-a-b">見出し \{#a b\}<\/h2>/);
  });

  it('does not take a {#id} written as trailing inline code', async () => {
    const { code } = await render('## 記法 `{#x}`\n');

    assert.match(code, /<h2 id="記法-x">記法 <code>\{#x\}<\/code><\/h2>/);
  });
});

describe('rehypeUniqueHeadingIds', () => {
  it('fails when two headings share an explicit id', async () => {
    await assert.rejects(render('## A {#same}\n\n## B {#same}\n'), /Duplicate heading id "same"/);
  });

  it('fails when an explicit id collides with an automatic slug', async () => {
    await assert.rejects(render('## setup\n\n## 概要 {#setup}\n'), /Duplicate heading id "setup"/);
  });

  it('accepts repeated heading text, which gets distinct automatic slugs', async () => {
    const { headings } = await render('## 手順\n\n## 手順\n');

    assert.deepEqual(
      headings.map((heading) => heading.slug),
      ['手順', '手順-1']
    );
  });
});
