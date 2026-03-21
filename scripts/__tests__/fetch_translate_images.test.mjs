/**
 * tests for scripts/fetch_translate_images.mjs
 *
 * The implementation must:
 * - Export: rewriteDocLinks, getUntranslatedList, getAllPagesList, getDiffPagesList, parseMode
 * - Guard main() so importing does not trigger side effects
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let rewriteDocLinks, getUntranslatedList, getAllPagesList, getDiffPagesList, parseMode;
before(async () => {
  ({
    rewriteDocLinks,
    getUntranslatedList,
    getAllPagesList,
    getDiffPagesList,
    parseMode,
  } = await import('../fetch_translate_images.mjs'));
});

// ---------------------------------------------------------------------------
// rewriteDocLinks — BUG FIX: must NOT include categoryFolder in the path
// ---------------------------------------------------------------------------
describe('rewriteDocLinks', () => {
  it('rewrites (doc:slug) to /docs/{slug} — WITHOUT folder prefix', () => {
    const result = rewriteDocLinks('[link](doc:testim-overview)');
    assert.equal(result, '[link](/docs/testim-overview)');
  });

  it('preserves fragment in rewritten link', () => {
    const result = rewriteDocLinks('[link](doc:testim-overview#section)');
    assert.equal(result, '[link](/docs/testim-overview#section)');
  });

  it('still generates /docs/{slug} for unknown slug (no hit in index)', () => {
    const result = rewriteDocLinks('[link](doc:unknown-page)');
    assert.equal(result, '[link](/docs/unknown-page)');
  });

  it('does not modify already-rewritten /docs/ links', () => {
    const md = '[link](/docs/testim-overview)';
    const result = rewriteDocLinks(md);
    assert.equal(result, md);
  });

  it('rewrites multiple doc: links in same document', () => {
    const md = 'See [foo](doc:foo) and [bar](doc:bar).';
    const result = rewriteDocLinks(md);
    assert.equal(result, 'See [foo](/docs/foo) and [bar](/docs/bar).');
  });
});

// ---------------------------------------------------------------------------
// getUntranslatedList (existing) — parses ⏳ items only
// ---------------------------------------------------------------------------
describe('getUntranslatedList', () => {
  it('returns only ⏳ items', () => {
    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅ https://help.testim.io/docs/testim-overview',
      '- ⏳ https://help.testim.io/docs/getting-started',
      '',
    ].join('\n');

    const list = getUntranslatedList(sidebarText);
    assert.equal(list.length, 1);
    assert.equal(list[0].slug, 'getting-started');
    assert.equal(list[0].categoryEnglish, 'Overview');
  });

  it('returns empty array when all items are translated', () => {
    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅ https://help.testim.io/docs/testim-overview',
      '',
    ].join('\n');
    assert.deepEqual(getUntranslatedList(sidebarText), []);
  });

  it('assigns correct order within section', () => {
    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ⏳ https://help.testim.io/docs/page-a',
      '- ⏳ https://help.testim.io/docs/page-b',
      '',
    ].join('\n');
    const list = getUntranslatedList(sidebarText);
    assert.equal(list[0].order, 1);
    assert.equal(list[1].order, 2);
  });
});

// ---------------------------------------------------------------------------
// getAllPagesList (new) — returns all sidebar items (full mode source)
// ---------------------------------------------------------------------------
describe('getAllPagesList', () => {
  it('includes ✅ and ⏳ items', () => {
    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅ https://help.testim.io/docs/testim-overview',
      '- ⏳ https://help.testim.io/docs/getting-started',
      '',
    ].join('\n');
    const list = getAllPagesList(sidebarText);
    assert.equal(list.length, 2);
    assert.equal(list[0].slug, 'testim-overview');
    assert.equal(list[1].slug, 'getting-started');
  });

  it('returns ✅🔍 items', () => {
    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅🔍 https://help.testim.io/docs/testim-overview',
      '',
    ].join('\n');
    const list = getAllPagesList(sidebarText);
    assert.equal(list.length, 1);
    assert.equal(list[0].slug, 'testim-overview');
  });

  it('includes ⏳ items when they exist', () => {
    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ⏳ https://help.testim.io/docs/getting-started',
      '',
    ].join('\n');
    const list = getAllPagesList(sidebarText);
    assert.equal(list.length, 1);
    assert.equal(list[0].slug, 'getting-started');
  });
});

// ---------------------------------------------------------------------------
// getDiffPagesList (new) — returns only pages whose source hash has changed
// ---------------------------------------------------------------------------
describe('getDiffPagesList', () => {
  let tmpDir;
  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'takt-test-'));
  });

  it('returns page when hash differs from stored hash', async () => {
    const hashesPath = path.join(tmpDir, 'page-hashes.json');
    fs.writeFileSync(
      hashesPath,
      JSON.stringify({ 'testim-overview': 'old-hash-value' }),
      'utf8'
    );

    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅ https://help.testim.io/docs/testim-overview',
      '',
    ].join('\n');

    // fakeFetch returns different content → hash will differ
    const fakeFetch = async () => ({
      ok: true,
      text: async () => '# New Content\n\nChanged body.',
    });

    const list = await getDiffPagesList(sidebarText, hashesPath, fakeFetch);
    assert.equal(list.length, 1);
    assert.equal(list[0].slug, 'testim-overview');
  });

  it('excludes page when hash is unchanged', async () => {
    const hashesPath = path.join(tmpDir, 'page-hashes-same.json');

    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅ https://help.testim.io/docs/testim-overview',
      '',
    ].join('\n');

    const content = '# Stable Content\n\nNo changes.';

    // First call: compute hash and save
    const fakeFetch = async () => ({ ok: true, text: async () => content });
    await getDiffPagesList(sidebarText, hashesPath, fakeFetch);

    // Second call with same content: no diff
    const list2 = await getDiffPagesList(sidebarText, hashesPath, fakeFetch);
    assert.equal(list2.length, 0);
  });

  it('treats missing hash file as all-changed (first run)', async () => {
    const hashesPath = path.join(tmpDir, 'page-hashes-missing.json');
    // file does not exist
    assert.equal(fs.existsSync(hashesPath), false);

    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅ https://help.testim.io/docs/page-a',
      '- ✅ https://help.testim.io/docs/page-b',
      '',
    ].join('\n');

    const fakeFetch = async () => ({ ok: true, text: async () => '# Content' });
    const list = await getDiffPagesList(sidebarText, hashesPath, fakeFetch);
    assert.equal(list.length, 2);
  });

  it('updates hashes file after execution', async () => {
    const hashesPath = path.join(tmpDir, 'page-hashes-update.json');

    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅ https://help.testim.io/docs/my-page',
      '',
    ].join('\n');

    const fakeFetch = async () => ({ ok: true, text: async () => '# Body' });
    await getDiffPagesList(sidebarText, hashesPath, fakeFetch);

    const saved = JSON.parse(fs.readFileSync(hashesPath, 'utf8'));
    assert.ok('my-page' in saved, 'hash for my-page must be persisted');
    assert.equal(typeof saved['my-page'], 'object');
    assert.equal(saved['my-page'].sourceUrl, 'https://help.testim.io/docs/my-page');
    assert.equal(typeof saved['my-page'].hash, 'string');
  });

  it('treats fetch network error as changed', async () => {
    const hashesPath = path.join(tmpDir, 'page-hashes-network-error.json');
    fs.writeFileSync(
      hashesPath,
      JSON.stringify({ 'testim-overview': 'some-existing-hash' }),
      'utf8'
    );

    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅ https://help.testim.io/docs/testim-overview',
      '',
    ].join('\n');

    const fakeFetch = async () => { throw new Error('network error'); };
    const list = await getDiffPagesList(sidebarText, hashesPath, fakeFetch);
    assert.equal(list.length, 1);
    assert.equal(list[0].slug, 'testim-overview');
  });

  it('skips fetch when fromSnapshot is true and snapshot exists', async () => {
    const hashesPath = path.join(tmpDir, 'page-hashes-snapshot.json');

    // Use testim-overview which exists in real snapshots/en/content/
    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅ https://help.testim.io/docs/testim-overview',
      '',
    ].join('\n');

    let fetchCalled = false;
    const fakeFetch = async () => { fetchCalled = true; return { ok: true, text: async () => '# Network' }; };

    await getDiffPagesList(sidebarText, hashesPath, fakeFetch, { fromSnapshot: true });
    assert.equal(fetchCalled, false, 'fetch should NOT be called when snapshot file exists');

    // Verify hash was computed from the snapshot content
    const saved = JSON.parse(fs.readFileSync(hashesPath, 'utf8'));
    assert.ok(saved['testim-overview'], 'hash should be persisted');
    assert.equal(typeof saved['testim-overview'].hash, 'string');
    assert.ok(saved['testim-overview'].hash.length > 0, 'hash should not be empty');
  });

  it('falls back to fetch when fromSnapshot is true but snapshot does not exist', async () => {
    const hashesPath = path.join(tmpDir, 'page-hashes-fallback.json');

    // Use a slug that does NOT exist in snapshots/en/content/
    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅ https://help.testim.io/docs/zzz-nonexistent-test-page',
      '',
    ].join('\n');

    let fetchCalled = false;
    const fakeFetch = async () => {
      fetchCalled = true;
      return { ok: true, text: async () => '# Fallback Content' };
    };

    await getDiffPagesList(sidebarText, hashesPath, fakeFetch, { fromSnapshot: true });
    assert.equal(fetchCalled, true, 'fetch should be called when snapshot file does not exist');
  });

  it('always uses fetch when fromSnapshot is false', async () => {
    const hashesPath = path.join(tmpDir, 'page-hashes-no-snapshot.json');

    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅ https://help.testim.io/docs/testim-overview',
      '',
    ].join('\n');

    let fetchCalled = false;
    const fakeFetch = async () => { fetchCalled = true; return { ok: true, text: async () => '# Network' }; };

    await getDiffPagesList(sidebarText, hashesPath, fakeFetch, { fromSnapshot: false });
    assert.equal(fetchCalled, true, 'fetch should be called when fromSnapshot is false');
  });
});

// ---------------------------------------------------------------------------
// parseMode (new) — parse --mode flag from argv
// ---------------------------------------------------------------------------
describe('parseMode', () => {
  it('returns "full" for --mode=full', () => {
    assert.equal(parseMode(['--mode=full']), 'full');
  });

  it('returns "diff" for --mode=diff', () => {
    assert.equal(parseMode(['--mode=diff']), 'diff');
  });

  it('returns null when no --mode flag', () => {
    assert.equal(parseMode(['--slug=foo']), null);
  });

  it('returns null for empty args', () => {
    assert.equal(parseMode([]), null);
  });
});
