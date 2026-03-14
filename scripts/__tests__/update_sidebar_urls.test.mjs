/**
 * tests for scripts/update_sidebar_urls_from_live.mjs
 *
 * The implementation must:
 * - Export: normalizeUrl, parseExistingStatusMap, buildOutput, extractUrls, fetchSitemap, main
 * - Guard main() so importing does not trigger side effects
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

// --- dynamic import to avoid main() side effects (guard required in impl) ---
let normalizeUrl, parseExistingStatusMap, buildOutput, extractUrls, fetchSitemap, main;
before(async () => {
  ({ normalizeUrl, parseExistingStatusMap, buildOutput, extractUrls, fetchSitemap, main } =
    await import('../update_sidebar_urls_from_live.mjs'));
});

// ---------------------------------------------------------------------------
// normalizeUrl
// ---------------------------------------------------------------------------
describe('normalizeUrl', () => {
  it('returns null for non-testim absolute URL', () => {
    assert.equal(normalizeUrl('https://example.com/docs/foo'), null);
  });

  it('returns https URL for help.testim.io/docs/ absolute input', () => {
    assert.equal(
      normalizeUrl('https://help.testim.io/docs/testim-overview'),
      'https://help.testim.io/docs/testim-overview'
    );
  });

  it('normalizes http to https', () => {
    assert.equal(
      normalizeUrl('http://help.testim.io/docs/testim-overview'),
      'https://help.testim.io/docs/testim-overview'
    );
  });

  it('prepends base for /docs/ relative path', () => {
    assert.equal(
      normalizeUrl('/docs/testim-overview'),
      'https://help.testim.io/docs/testim-overview'
    );
  });

  it('returns null for null input', () => {
    assert.equal(normalizeUrl(null), null);
  });

  it('returns null for empty string', () => {
    assert.equal(normalizeUrl(''), null);
  });

  it('returns null for /other/ path', () => {
    assert.equal(normalizeUrl('/other/testim-overview'), null);
  });
});

// ---------------------------------------------------------------------------
// parseExistingStatusMap
// ---------------------------------------------------------------------------
describe('parseExistingStatusMap', () => {
  it('parses ✅🔍 status lines', () => {
    const text = '- ✅🔍 https://help.testim.io/docs/testim-overview\n';
    const map = parseExistingStatusMap(text);
    assert.equal(map.get('https://help.testim.io/docs/testim-overview'), '✅🔍');
  });

  it('parses ✅ status lines', () => {
    const text = '- ✅ https://help.testim.io/docs/testim-overview\n';
    const map = parseExistingStatusMap(text);
    assert.equal(map.get('https://help.testim.io/docs/testim-overview'), '✅');
  });

  it('ignores non-matching lines', () => {
    const text = '## Overview（概要）\n- ⏳ https://help.testim.io/docs/testim-overview\n';
    const map = parseExistingStatusMap(text);
    assert.equal(map.size, 0);
  });

  it('returns empty map for empty text', () => {
    assert.equal(parseExistingStatusMap('').size, 0);
  });
});

// ---------------------------------------------------------------------------
// extractUrls
// ---------------------------------------------------------------------------
describe('extractUrls', () => {
  it('extracts testim help doc URLs from anchor tags', () => {
    const html =
      '<section><a href="https://help.testim.io/docs/testim-overview">OV</a></section>';
    const urls = extractUrls(html);
    assert.deepEqual(urls, ['https://help.testim.io/docs/testim-overview']);
  });

  it('deduplicates URLs', () => {
    const html =
      '<a href="/docs/foo">1</a><a href="/docs/foo">2</a>';
    const urls = extractUrls(html);
    assert.equal(urls.length, 1);
  });

  it('ignores non-docs URLs', () => {
    const urls = extractUrls('<a href="https://example.com/page">X</a>');
    assert.equal(urls.length, 0);
  });

  it('normalizes relative /docs/ paths', () => {
    const urls = extractUrls('<a href="/docs/testim-overview">O</a>');
    assert.deepEqual(urls, ['https://help.testim.io/docs/testim-overview']);
  });
});

// ---------------------------------------------------------------------------
// buildOutput
// ---------------------------------------------------------------------------
describe('buildOutput', () => {
  const sections = [
    {
      title: 'Overview',
      urls: ['https://help.testim.io/docs/testim-overview'],
    },
  ];

  it('includes each URL in the output', () => {
    const out = buildOutput({ sections, statusByUrl: new Map(), existingHeader: '' });
    assert.match(out, /https:\/\/help\.testim\.io\/docs\/testim-overview/);
  });

  it('uses ✅🔍 as default status when URL is not in statusByUrl', () => {
    const out = buildOutput({ sections, statusByUrl: new Map(), existingHeader: '' });
    assert.match(out, /✅🔍\s+https:\/\/help\.testim\.io\/docs\/testim-overview/);
  });

  it('uses existing ✅ status when URL is already in statusByUrl', () => {
    const statusByUrl = new Map([
      ['https://help.testim.io/docs/testim-overview', '✅'],
    ]);
    const out = buildOutput({ sections, statusByUrl, existingHeader: '' });
    assert.match(out, /✅\s+https:\/\/help\.testim\.io\/docs\/testim-overview/);
    assert.doesNotMatch(out, /✅🔍\s+https:\/\/help\.testim\.io\/docs\/testim-overview/);
  });

  it('includes section heading', () => {
    const out = buildOutput({ sections, statusByUrl: new Map(), existingHeader: '' });
    assert.match(out, /##\s+Overview/);
  });

  it('global deduplication: URL in two sections appears once', () => {
    const dup = [
      { title: 'A', urls: ['https://help.testim.io/docs/foo'] },
      { title: 'B', urls: ['https://help.testim.io/docs/foo'] },
    ];
    const out = buildOutput({ sections: dup, statusByUrl: new Map(), existingHeader: '' });
    const count = (out.match(/https:\/\/help\.testim\.io\/docs\/foo/g) || []).length;
    assert.equal(count, 1);
  });
});

// ---------------------------------------------------------------------------
// fetchSitemap (new function — will fail until implemented)
// ---------------------------------------------------------------------------
describe('fetchSitemap', () => {
  it('parses <loc> entries for help.testim.io/docs/', async () => {
    const xml = `<?xml version="1.0"?>
<urlset>
  <url><loc>https://help.testim.io/docs/testim-overview</loc></url>
  <url><loc>https://help.testim.io/docs/getting-started</loc></url>
  <url><loc>https://help.testim.io/</loc></url>
</urlset>`;
    // fetchSitemap(fetchFn) — implementation accepts injectable fetch for testability
    const fakeFetch = async () => ({ ok: true, text: async () => xml });
    const urls = await fetchSitemap(fakeFetch);
    assert.deepEqual(urls, [
      'https://help.testim.io/docs/testim-overview',
      'https://help.testim.io/docs/getting-started',
    ]);
  });

  it('returns empty array when fetch fails', async () => {
    const fakeFetch = async () => { throw new Error('network error'); };
    const urls = await fetchSitemap(fakeFetch);
    assert.deepEqual(urls, []);
  });

  it('returns empty array when HTTP response is not ok', async () => {
    const fakeFetch = async () => ({ ok: false, status: 404 });
    const urls = await fetchSitemap(fakeFetch);
    assert.deepEqual(urls, []);
  });

  it('ignores non-docs URLs in sitemap', async () => {
    const xml = `<urlset><url><loc>https://help.testim.io/changelog</loc></url></urlset>`;
    const fakeFetch = async () => ({ ok: true, text: async () => xml });
    const urls = await fetchSitemap(fakeFetch);
    assert.deepEqual(urls, []);
  });
});

// ---------------------------------------------------------------------------
// CLI: fail-fast when 0 URLs collected (integration)
// ---------------------------------------------------------------------------
describe('CLI exit behavior', () => {
  it('exits with code 1 when totalUrls is 0', async () => {
    // Mock fetch: sitemap returns no /docs/ URLs, HTML has empty nav
    const mockFetch = async (url) => ({
      ok: true,
      text: async () => {
        if (url.includes('sitemap')) return '<urlset></urlset>';
        return '<html><nav id="hub-sidebar"></nav></html>';
      },
    });

    let exitCode;
    const origExit = process.exit;
    process.exit = (code) => {
      exitCode = code;
      throw new Error('process.exit called');
    };
    try {
      await main(mockFetch);
      assert.fail('Expected process.exit to be called');
    } catch (e) {
      if (!e.message.includes('process.exit')) throw e;
    } finally {
      process.exit = origExit;
    }

    assert.equal(exitCode, 1, 'Must exit with code 1 when 0 URLs are collected');
  });
});

// ---------------------------------------------------------------------------
// DRY: fetchNavSections unifies sitemap and no-sitemap branches (regression)
// ---------------------------------------------------------------------------
describe('fetchNavSections urlFilter unification', () => {
  it('no-sitemap path: all nav URLs are included (urlFilter = () => true)', async () => {
    const navHtml = `
      <nav id="hub-sidebar">
        <section>
          <h2>Getting Started</h2>
          <a href="https://help.testim.io/docs/intro">Intro</a>
          <a href="https://help.testim.io/docs/setup">Setup</a>
        </section>
      </nav>`;
    const mockFetch = async (url) => ({
      ok: true,
      text: async () => {
        if (url.includes('sitemap')) return '<urlset></urlset>';
        return `<html>${navHtml}</html>`;
      },
    });

    let writtenContent = '';
    const fs = await import('node:fs');
    const origWriteFileSync = fs.default.writeFileSync;
    const origMkdirSync = fs.default.mkdirSync;
    fs.default.mkdirSync = () => {};
    fs.default.writeFileSync = (_p, content) => { writtenContent = content; };
    try {
      await main(mockFetch);
    } finally {
      fs.default.writeFileSync = origWriteFileSync;
      fs.default.mkdirSync = origMkdirSync;
    }

    assert.ok(writtenContent.includes('https://help.testim.io/docs/intro'), 'intro URL must be in output');
    assert.ok(writtenContent.includes('https://help.testim.io/docs/setup'), 'setup URL must be in output');
  });

  it('sitemap path: only sitemap URLs are kept (urlFilter = sitemapSet.has)', async () => {
    const navHtml = `
      <nav id="hub-sidebar">
        <section>
          <h2>Getting Started</h2>
          <a href="https://help.testim.io/docs/intro">Intro</a>
          <a href="https://help.testim.io/docs/unlisted">Unlisted</a>
        </section>
      </nav>`;
    const sitemapXml = `<urlset>
      <url><loc>https://help.testim.io/docs/intro</loc></url>
    </urlset>`;
    const mockFetch = async (url) => ({
      ok: true,
      text: async () => {
        if (url.includes('sitemap')) return sitemapXml;
        return `<html>${navHtml}</html>`;
      },
    });

    let writtenContent = '';
    const fs = await import('node:fs');
    const origWriteFileSync = fs.default.writeFileSync;
    const origMkdirSync = fs.default.mkdirSync;
    fs.default.mkdirSync = () => {};
    fs.default.writeFileSync = (_p, content) => { writtenContent = content; };
    try {
      await main(mockFetch);
    } finally {
      fs.default.writeFileSync = origWriteFileSync;
      fs.default.mkdirSync = origMkdirSync;
    }

    assert.ok(writtenContent.includes('https://help.testim.io/docs/intro'), 'sitemap URL must be in output');
    assert.ok(!writtenContent.includes('https://help.testim.io/docs/unlisted'), 'non-sitemap URL must be excluded');
  });
});
