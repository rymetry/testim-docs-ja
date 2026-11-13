import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createMarkdownProcessor } from '@astrojs/markdown-remark';

import remarkHeadingIds from '../../src/lib/remark-heading-ids.mjs';

async function render(markdown) {
  const processor = await createMarkdownProcessor({
    remarkPlugins: [remarkHeadingIds],
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
});
