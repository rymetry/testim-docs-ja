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

function createTestLogger() {
  return {
    logs: [],
    warnings: [],
    errors: [],
    log(...args) {
      this.logs.push(args.join(' '));
    },
    warn(...args) {
      this.warnings.push(args.join(' '));
    },
    error(...args) {
      this.errors.push(args.join(' '));
    },
  };
}

before(async () => {
  ({
    rewriteDocLinks,
    getUntranslatedList,
    getAllPagesList,
    getDiffPagesList,
    parseMode,
  } = await import('../pipeline/fetch_translate_images.mjs'));
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

  // Stage 2 edge cases: external Markdown .htm links should NOT be rewritten
  it('does not rewrite Markdown https://*.htm link', () => {
    const md = '[link](https://example.com/page.htm)';
    assert.equal(rewriteDocLinks(md), md);
  });

  it('does not rewrite Markdown protocol-relative //*.htm link', () => {
    const md = '[link](//example.com/page.htm)';
    assert.equal(rewriteDocLinks(md), md);
  });

  // Stage 3: HTML <a href="doc:slug">
  it('rewrites HTML <a href="doc:slug"> to /docs/ path', () => {
    const result = rewriteDocLinks('<a href="doc:testim-overview">overview</a>');
    assert.equal(result, '<a href="/docs/overview/testim-overview">overview</a>');
  });

  it('rewrites HTML doc: link preserving fragment', () => {
    const result = rewriteDocLinks('<a href="doc:testim-overview#section">link</a>');
    assert.equal(result, '<a href="/docs/overview/testim-overview#section">link</a>');
  });

  it('does not rewrite doc:https:// (malformed legacy link)', () => {
    const md = '<a href="doc:https://help.testim.io/docs/exports-parameters">link</a>';
    assert.equal(rewriteDocLinks(md), md);
  });

  it('rewrites HTML doc: link with pre-href attributes', () => {
    const result = rewriteDocLinks('<a class="foo" href="doc:testim-overview">link</a>');
    assert.equal(result, '<a class="foo" href="/docs/overview/testim-overview">link</a>');
  });

  // Stage 4: HTML <a href="path.htm">
  it('rewrites HTML <a href="slug.htm"> to /docs/ path', () => {
    const result = rewriteDocLinks('<a href="testim-automate.htm">link</a>');
    assert.equal(result, '<a href="/docs/overview/testim-overview/testim-automate">link</a>');
  });

  it('rewrites HTML <a href="../path/slug.htm"> with relative path', () => {
    const result = rewriteDocLinks('<a href="../editing-tests/conditions/index.htm">link</a>');
    assert.equal(result, '<a href="/docs/editing-tests/conditions">link</a>');
  });

  it('rewrites HTML .htm link preserving fragment', () => {
    const result = rewriteDocLinks('<a href="why-did-my-test-fail.htm#13-api-step-failed">link</a>');
    assert.equal(result, '<a href="/docs/results/test-results/why-did-my-test-fail#13-api-step-failed">link</a>');
  });

  it('does not rewrite external https://*.htm link', () => {
    const md = '<a href="https://example.com/page.htm">link</a>';
    assert.equal(rewriteDocLinks(md), md);
  });

  it('does not rewrite already-converted /docs/ HTML link', () => {
    const md = '<a href="/docs/overview/testim-overview">link</a>';
    assert.equal(rewriteDocLinks(md), md);
  });

  it('rewrites multiple HTML anchors in same line', () => {
    const md = '<a href="doc:testim-overview">a</a> and <a href="testim-automate.htm">b</a>';
    const result = rewriteDocLinks(md);
    assert.equal(result, '<a href="/docs/overview/testim-overview">a</a> and <a href="/docs/overview/testim-overview/testim-automate">b</a>');
  });

  // Edge cases identified in Codex review
  it('does not rewrite protocol-relative //example.com/*.htm link', () => {
    const md = '<a href="//example.com/page.htm">link</a>';
    assert.equal(rewriteDocLinks(md), md);
  });

  it('does not rewrite ftp://*.htm link', () => {
    const md = '<a href="ftp://example.com/file.htm">link</a>';
    assert.equal(rewriteDocLinks(md), md);
  });

  it('rewrites HTML .htm link with ./ prefix', () => {
    const result = rewriteDocLinks('<a href="./testim-automate.htm">link</a>');
    assert.equal(result, '<a href="/docs/overview/testim-overview/testim-automate">link</a>');
  });

  it('rewrites Markdown .htm link with ./ prefix', () => {
    const result = rewriteDocLinks('[link](./testim-automate.htm)');
    assert.equal(result, '[link](/docs/overview/testim-overview/testim-automate)');
  });

  // SPA hash route (.htm/#/) — strip /#/ and resolve
  it('rewrites HTML .htm/#/ SPA link', () => {
    const result = rewriteDocLinks('<a href="../salesforce-testing/salesforce-testing-overview.htm/#/">link</a>');
    assert.equal(result, '<a href="/docs/salesforce-testing/salesforce-testing-overview">link</a>');
  });

  it('rewrites Markdown .htm/#/ SPA link', () => {
    const result = rewriteDocLinks('[link](../salesforce-testing/salesforce-testing-overview.htm/#/)');
    assert.equal(result, '[link](/docs/salesforce-testing/salesforce-testing-overview)');
  });

  // Bare index.htm — cannot resolve without page context, leave unchanged
  it('leaves bare index.htm unchanged (no page context)', () => {
    const md = '[link](index.htm#section)';
    assert.equal(rewriteDocLinks(md), md);
  });

  it('leaves bare HTML index.htm unchanged', () => {
    const md = '<a href="index.htm#adding-a-grid">link</a>';
    assert.equal(rewriteDocLinks(md), md);
  });

  it('resolves directory-prefixed index.htm normally', () => {
    const result = rewriteDocLinks('[link](../editing-tests/conditions/index.htm)');
    assert.equal(result, '[link](/docs/editing-tests/conditions)');
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
      JSON.stringify({ 'zzz-diff-warning-page': 'old-hash-value' }),
      'utf8'
    );

    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅ https://docs.tricentis.com/testim/content/overview/zzz-diff-warning-page.htm',
      '',
    ].join('\n');

    const logger = createTestLogger();
    const list = await getDiffPagesList(sidebarText, hashesPath, { logger });
    assert.equal(list.length, 1);
    assert.equal(list[0].slug, 'overview/zzz-diff-warning-page');
    assert.equal(logger.warnings.length, 1);
    assert.match(logger.warnings[0], /no snapshot for overview\/zzz-diff-warning-page/);
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

    const logger = createTestLogger();
    const list = await getDiffPagesList(sidebarText, hashesPath, { logger });
    assert.equal(list.length, 2);
    assert.equal(logger.warnings.length, 2);
  });

  it('treats missing HTML snapshot as changed', async () => {
    const hashesPath = path.join(tmpDir, 'page-hashes-missing-snap.json');

    const sidebarText = [
      '## Overview（概要）',
      '',
      '- ✅ https://docs.tricentis.com/testim/content/overview/zzz-nonexistent-test-page.htm',
      '',
    ].join('\n');

    const logger = createTestLogger();
    const list = await getDiffPagesList(sidebarText, hashesPath, { logger });
    assert.equal(list.length, 1, 'Missing HTML snapshot should be treated as changed');
    assert.equal(list[0].slug, 'overview/zzz-nonexistent-test-page');
    assert.equal(logger.warnings.length, 1);
    assert.match(logger.warnings[0], /no snapshot for overview\/zzz-nonexistent-test-page/);
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
