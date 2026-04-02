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
let ROOT;
before(async () => {
  ({
    rewriteDocLinks,
    getUntranslatedList,
    getAllPagesList,
    getDiffPagesList,
    parseMode,
  } = await import('../fetch_translate_images.mjs'));
  const project = await import('../lib/project.mjs');
  ROOT = project.ROOT_DIR;
});

// ---------------------------------------------------------------------------
// rewriteDocLinks — resolves doc: and .htm links to path-based /docs/ URLs
// ---------------------------------------------------------------------------
describe('rewriteDocLinks', () => {
  it('rewrites (doc:slug) to path-based /docs/{pathSlug}', () => {
    const result = rewriteDocLinks('[link](doc:testim-overview)');
    assert.equal(result, '[link](/docs/overview/testim-overview)');
  });

  it('preserves fragment in rewritten doc: link', () => {
    const result = rewriteDocLinks('[link](doc:testim-overview#section)');
    assert.equal(result, '[link](/docs/overview/testim-overview#section)');
  });

  it('falls back to basename for unknown slug (no hit in index)', () => {
    const result = rewriteDocLinks('[link](doc:unknown-page)');
    assert.equal(result, '[link](/docs/unknown-page)');
  });

  it('does not modify already-rewritten /docs/ links', () => {
    const md = '[link](/docs/overview/testim-overview)';
    const result = rewriteDocLinks(md);
    assert.equal(result, md);
  });

  it('rewrites multiple doc: links in same document', () => {
    // foo and bar are not in the index — fall back to basename
    const md = 'See [foo](doc:foo) and [bar](doc:bar).';
    const result = rewriteDocLinks(md);
    assert.equal(result, 'See [foo](/docs/foo) and [bar](/docs/bar).');
  });

  it('rewrites MadCap relative .htm link to path-based slug', () => {
    const result = rewriteDocLinks('[link](testim-automate.htm)');
    assert.equal(result, '[link](/docs/overview/testim-overview/testim-automate)');
  });

  it('rewrites MadCap relative .htm link with path prefix', () => {
    const result = rewriteDocLinks('[link](../editing-tests/conditions/index.htm)');
    assert.equal(result, '[link](/docs/editing-tests/conditions)');
  });

  it('rewrites MadCap .htm link preserving fragment', () => {
    const result = rewriteDocLinks('[link](why-did-my-test-fail.htm#13-api-step-failed)');
    assert.equal(result, '[link](/docs/results/test-results/why-did-my-test-fail#13-api-step-failed)');
  });

  it('rewrites MadCap /slug/index.htm to path-based slug', () => {
    const result = rewriteDocLinks('[link](validations/index.htm)');
    assert.equal(result, '[link](/docs/advanced-editing/validations)');
  });

  it('rewrites MadCap deeply nested relative .htm link', () => {
    const result = rewriteDocLinks('[link](../../salesforce-testing/salesforce-testing-overview.htm)');
    assert.equal(result, '[link](/docs/salesforce-testing/salesforce-testing-overview)');
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
      '- ✅ https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm',
      '- ⏳ https://docs.tricentis.com/testim/content/getting-started/getting-started.htm',
      '',
    ].join('\n');

    const list = getUntranslatedList(sidebarText);
    assert.equal(list.length, 1);
    assert.equal(list[0].slug, 'getting-started/getting-started');
    assert.equal(list[0].categoryEnglish, 'Overview');
  });

  it('returns empty array when all items are translated', () => {
    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅ https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm',
      '',
    ].join('\n');
    assert.deepEqual(getUntranslatedList(sidebarText), []);
  });

  it('assigns correct order within section', () => {
    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ⏳ https://docs.tricentis.com/testim/content/overview/page-a.htm',
      '- ⏳ https://docs.tricentis.com/testim/content/overview/page-b.htm',
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
      '- ✅ https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm',
      '- ⏳ https://docs.tricentis.com/testim/content/getting-started/getting-started.htm',
      '',
    ].join('\n');
    const list = getAllPagesList(sidebarText);
    assert.equal(list.length, 2);
    assert.equal(list[0].slug, 'overview/testim-overview');
    assert.equal(list[1].slug, 'getting-started/getting-started');
  });

  it('returns ✅🔍 items', () => {
    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅🔍 https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm',
      '',
    ].join('\n');
    const list = getAllPagesList(sidebarText);
    assert.equal(list.length, 1);
    assert.equal(list[0].slug, 'overview/testim-overview');
  });

  it('includes ⏳ items when they exist', () => {
    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ⏳ https://docs.tricentis.com/testim/content/getting-started/getting-started.htm',
      '',
    ].join('\n');
    const list = getAllPagesList(sidebarText);
    assert.equal(list.length, 1);
    assert.equal(list[0].slug, 'getting-started/getting-started');
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
      '- ✅ https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm',
      '',
    ].join('\n');

    const list = await getDiffPagesList(sidebarText, hashesPath);
    assert.equal(list.length, 1);
    assert.equal(list[0].slug, 'overview/testim-overview');
  });

  it('excludes page when hash is unchanged', async () => {
    const hashesPath = path.join(tmpDir, 'page-hashes-same.json');
    const snapshotDir = path.join(ROOT, 'snapshots', 'en', 'content');
    // Path-based slug: overview/test-hash-unchanged
    const pathSlug = 'overview/test-hash-unchanged';
    const snapshotPath = path.join(snapshotDir, pathSlug + '.html');

    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅ https://docs.tricentis.com/testim/content/overview/test-hash-unchanged.htm',
      '',
    ].join('\n');

    try {
      fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
      fs.writeFileSync(snapshotPath, '<h1>Stable Content</h1><p>No changes.</p>');

      // First call: compute hash and save
      await getDiffPagesList(sidebarText, hashesPath);

      // Second call with same content: no diff
      const list2 = await getDiffPagesList(sidebarText, hashesPath);
      assert.equal(list2.length, 0);
    } finally {
      if (fs.existsSync(snapshotPath)) fs.unlinkSync(snapshotPath);
    }
  });

  it('treats missing hash file as all-changed (first run)', async () => {
    const hashesPath = path.join(tmpDir, 'page-hashes-missing.json');
    // file does not exist
    assert.equal(fs.existsSync(hashesPath), false);

    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅ https://docs.tricentis.com/testim/content/overview/page-a.htm',
      '- ✅ https://docs.tricentis.com/testim/content/overview/page-b.htm',
      '',
    ].join('\n');

    const list = await getDiffPagesList(sidebarText, hashesPath);
    assert.equal(list.length, 2);
  });

  it('treats missing HTML snapshot as changed', async () => {
    const hashesPath = path.join(tmpDir, 'page-hashes-missing-snap.json');

    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅ https://docs.tricentis.com/testim/content/overview/zzz-nonexistent-test-page.htm',
      '',
    ].join('\n');

    const list = await getDiffPagesList(sidebarText, hashesPath);
    assert.equal(list.length, 1, 'Missing HTML snapshot should be treated as changed');
    assert.equal(list[0].slug, 'overview/zzz-nonexistent-test-page');
  });

  it('reads from HTML snapshot without network fetch', async () => {
    const hashesPath = path.join(tmpDir, 'page-hashes-html-read.json');
    const snapshotDir = path.join(ROOT, 'snapshots', 'en', 'content');
    // Path-based slug: overview/test-html-read-snapshot
    const pathSlug = 'overview/test-html-read-snapshot';
    const snapshotPath = path.join(snapshotDir, pathSlug + '.html');

    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅ https://docs.tricentis.com/testim/content/overview/test-html-read-snapshot.htm',
      '',
    ].join('\n');

    try {
      fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
      fs.writeFileSync(snapshotPath, '<h1>HTML Content</h1>');

      await getDiffPagesList(sidebarText, hashesPath);

      const saved = JSON.parse(fs.readFileSync(hashesPath, 'utf8'));
      assert.ok(saved[pathSlug], 'hash should be persisted');
      assert.equal(typeof saved[pathSlug].hash, 'string');
    } finally {
      if (fs.existsSync(snapshotPath)) fs.unlinkSync(snapshotPath);
    }
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
