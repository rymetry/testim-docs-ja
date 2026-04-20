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
  ({ normalizeUrl, parseExistingStatusMap, buildOutput, extractUrls, fetchSitemap, main } =
    await import('../pipeline/update_sidebar_urls_from_live.mjs'));
});

// ---------------------------------------------------------------------------
// normalizeUrl
// ---------------------------------------------------------------------------
describe('normalizeUrl', () => {
  it('returns null for non-testim absolute URL', () => {
    assert.equal(normalizeUrl('https://example.com/docs/foo'), null);
  });

  it('returns null for old domain URL', () => {
    assert.equal(normalizeUrl('https://help.testim.io/docs/testim-overview'), null);
  });

  it('returns null for null input', () => {
    assert.equal(normalizeUrl(null), null);
  });

  it('returns null for empty string', () => {
    assert.equal(normalizeUrl(''), null);
  });

  it('returns null for relative path', () => {
    assert.equal(normalizeUrl('/docs/testim-overview'), null);
  });

  it('returns docs.tricentis.com URL as-is', () => {
    assert.equal(
      normalizeUrl('https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm'),
      'https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm'
    );
  });
});

// ---------------------------------------------------------------------------
// parseExistingStatusMap
// ---------------------------------------------------------------------------
describe('parseExistingStatusMap', () => {
  it('parses ✅🔍 status lines with new URL', () => {
    const text = '- ✅🔍 https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm\n';
    const map = parseExistingStatusMap(text);
    assert.equal(map.get('https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm'), '✅🔍');
  });

  it('parses ✅ status lines with new URL', () => {
    const text = '- ✅ https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm\n';
    const map = parseExistingStatusMap(text);
    assert.equal(map.get('https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm'), '✅');
  });

  it('ignores non-matching lines', () => {
    const text = '## Overview（概要）\n- ⏳ https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm\n';
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
  it('extracts docs.tricentis.com URLs from anchor tags', () => {
    const html =
      '<section><a href="https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm">OV</a></section>';
    const urls = extractUrls(html);
    assert.deepEqual(urls, ['https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm']);
  });

  it('deduplicates URLs', () => {
    const html =
      '<a href="https://docs.tricentis.com/testim/content/overview/foo.htm">1</a><a href="https://docs.tricentis.com/testim/content/overview/foo.htm">2</a>';
    const urls = extractUrls(html);
    assert.equal(urls.length, 1);
  });

  it('ignores non-docs URLs', () => {
    const urls = extractUrls('<a href="https://example.com/page">X</a>');
    assert.equal(urls.length, 0);
  });

  it('ignores old domain URLs', () => {
    const urls = extractUrls('<a href="https://help.testim.io/docs/testim-overview">O</a>');
    assert.equal(urls.length, 0);
  });
});

// ---------------------------------------------------------------------------
// buildOutput
// ---------------------------------------------------------------------------
describe('buildOutput', () => {
  const sections = [
    {
      title: 'Overview',
      urls: ['https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm'],
    },
  ];

  it('includes each URL in the output', () => {
    const out = buildOutput({ sections, statusByUrl: new Map(), existingHeader: '' });
    assert.match(out, /https:\/\/docs\.tricentis\.com\/testim\/content\/overview\/testim-overview\/index\.htm/);
  });

  it('uses ✅🔍 as default status when URL is not in statusByUrl', () => {
    const out = buildOutput({ sections, statusByUrl: new Map(), existingHeader: '' });
    assert.match(out, /✅🔍\s+https:\/\/docs\.tricentis\.com\/testim\/content\/overview\/testim-overview\/index\.htm/);
  });

  it('uses existing ✅ status when URL is already in statusByUrl', () => {
    const statusByUrl = new Map([
      ['https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm', '✅'],
    ]);
    const out = buildOutput({ sections, statusByUrl, existingHeader: '' });
    assert.match(out, /✅\s+https:\/\/docs\.tricentis\.com\/testim\/content\/overview\/testim-overview\/index\.htm/);
    assert.doesNotMatch(out, /✅🔍\s+https:\/\/docs\.tricentis\.com\/testim\/content\/overview\/testim-overview\/index\.htm/);
  });

  it('includes section heading', () => {
    const out = buildOutput({ sections, statusByUrl: new Map(), existingHeader: '' });
    assert.match(out, /##\s+Overview/);
  });

  it('global deduplication: URL in two sections appears once', () => {
    const dup = [
      { title: 'A', urls: ['https://docs.tricentis.com/testim/content/overview/foo.htm'] },
      { title: 'B', urls: ['https://docs.tricentis.com/testim/content/overview/foo.htm'] },
    ];
    const out = buildOutput({ sections: dup, statusByUrl: new Map(), existingHeader: '' });
    const count = (out.match(/https:\/\/docs\.tricentis\.com\/testim\/content\/overview\/foo\.htm/g) || []).length;
    assert.equal(count, 1);
  });
});

// ---------------------------------------------------------------------------
// fetchSitemap (new function — will fail until implemented)
// ---------------------------------------------------------------------------
describe('fetchSitemap', () => {
  it('parses <loc> entries for docs.tricentis.com/testim/content/', async () => {
    const xml = `<?xml version="1.0"?>
<urlset>
  <url><loc>https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm</loc></url>
  <url><loc>https://docs.tricentis.com/testim/content/getting-started/getting-started.htm</loc></url>
  <url><loc>https://docs.tricentis.com/testim/</loc></url>
</urlset>`;
    // fetchSitemap(fetchFn) — implementation accepts injectable fetch for testability
    const fakeFetch = async () => ({ ok: true, text: async () => xml });
    const urls = await fetchSitemap(fakeFetch);
    assert.deepEqual(urls, [
      'https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm',
      'https://docs.tricentis.com/testim/content/getting-started/getting-started.htm',
    ]);
  });

  it('returns empty array when fetch fails', async () => {
    const fakeFetch = async () => { throw new Error('network error'); };
    const logger = createTestLogger();
    const urls = await fetchSitemap(fakeFetch, { logger });
    assert.deepEqual(urls, []);
    assert.equal(logger.warnings.length, 1);
    assert.match(logger.warnings[0], /fetchSitemap: failed/);
  });

  it('returns empty array when HTTP response is not ok', async () => {
    const fakeFetch = async () => ({ ok: false, status: 404 });
    const logger = createTestLogger();
    const urls = await fetchSitemap(fakeFetch, { logger });
    assert.deepEqual(urls, []);
    assert.equal(logger.warnings.length, 1);
    assert.match(logger.warnings[0], /fetchSitemap: HTTP 404/);
  });

  it('ignores non-content URLs in sitemap', async () => {
    const xml = `<urlset><url><loc>https://docs.tricentis.com/testim/changelog</loc></url></urlset>`;
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
    // Mock fetch: TOC and sitemap both return empty data
    const mockFetch = async () => ({
      ok: true,
      text: async () => '<urlset></urlset>',
    });

    const logger = createTestLogger();
    let exitCode;
    const fakeExit = (code) => {
      exitCode = code;
      throw new Error('process.exit called');
    };
    try {
      await main(mockFetch, { logger, exit: fakeExit });
      assert.fail('Expected process.exit to be called');
    } catch (e) {
      if (!e.message.includes('process.exit')) throw e;
    }

    assert.equal(exitCode, 1, 'Must exit with code 1 when 0 URLs are collected');
    assert.equal(logger.errors.length, 1);
    assert.match(logger.errors[0], /Fatal: 0 URLs collected/);
  });
});

// ---------------------------------------------------------------------------
// TOC-based main() integration
// ---------------------------------------------------------------------------
describe('main() with TOC data', () => {
  it('uses TOC data to build sections and writes output', async () => {
    // Mock TOC JS files
    const mainJs = "define({numchunks:1,prefix:'Mock_Chunk',tree:{n:[{i:0,c:0,n:[{i:1,c:0}]}]}});";
    const chunkJs = "define({'/content/overview/index.htm':{i:[0],t:['Overview'],b:['']},'/content/overview/testim-overview/index.htm':{i:[1],t:['Testim overview'],b:['']}});";

    const mockFetch = async (url) => {
      if (url.includes('Main.js')) return { ok: true, text: async () => mainJs };
      if (url.includes('Mock_Chunk0.js')) return { ok: true, text: async () => chunkJs };
      if (url.includes('sitemap')) return { ok: false, status: 404 };
      return { ok: false, status: 404 };
    };

    let writtenContent = '';
    const fs = await import('node:fs');
    const origWriteFileSync = fs.default.writeFileSync;
    const origMkdirSync = fs.default.mkdirSync;
    const logger = createTestLogger();
    fs.default.mkdirSync = () => {};
    fs.default.writeFileSync = (_p, content) => { writtenContent = content; };
    try {
      await main(mockFetch, { logger });
    } finally {
      fs.default.writeFileSync = origWriteFileSync;
      fs.default.mkdirSync = origMkdirSync;
    }

    assert.ok(writtenContent.includes('https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm'), 'page URL must be in output');
    assert.ok(writtenContent.includes('## Overview'), 'section heading must be in output');
    assert.ok(logger.logs.some((line) => line.includes('Updated ')));
  });

  it('falls back to sitemap when TOC fetch fails and no existing file', async () => {
    const sitemapXml = `<urlset>
      <url><loc>https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm</loc></url>
    </urlset>`;

    const mockFetch = async (url) => {
      if (url.includes('Data/Tocs')) throw new Error('TOC unavailable');
      if (url.includes('sitemap')) return { ok: true, text: async () => sitemapXml };
      return { ok: false, status: 404 };
    };

    let writtenContent = '';
    const fs = await import('node:fs');
    const origWriteFileSync = fs.default.writeFileSync;
    const origMkdirSync = fs.default.mkdirSync;
    const origExistsSync = fs.default.existsSync;
    const logger = createTestLogger();
    fs.default.mkdirSync = () => {};
    fs.default.writeFileSync = (_p, content) => { writtenContent = content; };
    // Simulate no existing SIDEBAR_URLS.md so sitemap fallback is allowed
    fs.default.existsSync = (p) => {
      if (String(p).includes('SIDEBAR_URLS.md')) return false;
      return origExistsSync(p);
    };
    try {
      await main(mockFetch, { logger });
    } finally {
      fs.default.writeFileSync = origWriteFileSync;
      fs.default.mkdirSync = origMkdirSync;
      fs.default.existsSync = origExistsSync;
    }

    assert.ok(writtenContent.includes('https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm'), 'sitemap URL must be in output');
    assert.equal(logger.warnings.length, 1);
    assert.match(logger.warnings[0], /TOC fetch failed/);
  });
});
