import { afterEach, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let main;
let extractMainContent;

const originalFetch = global.fetch;
const originalLog = console.log;

function createResponse({ ok = true, status = 200, text = '' } = {}) {
  return {
    ok,
    status,
    text: async () => text,
  };
}

before(async () => {
  ({ main, extractMainContent } = await import('../snapshot_update.mjs'));
});

afterEach(() => {
  global.fetch = originalFetch;
  console.log = originalLog;
});

describe('extractMainContent', () => {
  it('extracts inner HTML from mc-main-content div', () => {
    const html = '<html><body><div id="mc-main-content" role="main"><h1>Title</h1><p>Body</p></div></body></html>';
    const result = extractMainContent(html);
    assert.equal(result, '<h1>Title</h1><p>Body</p>');
  });

  it('returns null when mc-main-content is absent', () => {
    const html = '<html><body><div>No main content</div></body></html>';
    assert.equal(extractMainContent(html), null);
  });

  it('handles nested divs inside mc-main-content', () => {
    const html = '<div id="mc-main-content"><div class="inner"><div>Deep</div></div></div>';
    const result = extractMainContent(html);
    assert.equal(result, '<div class="inner"><div>Deep</div></div>');
  });
});

describe('snapshot_update main', () => {
  it('fetches HTML content in dry-run mode', async () => {
    const tocMainJs = "define({numchunks:1,prefix:'Mock_Chunk',tree:{n:[{i:0,c:0}]}});";
    const tocChunkJs = "define({'/content/overview/testim-overview/index.htm':{i:[0],t:['Overview'],b:['']}});";
    const pageHtml = '<html><body><div id="mc-main-content" role="main"><h1>Testim overview</h1><p>Content</p></div></body></html>';

    global.fetch = async (url) => {
      const href = String(url);
      if (href.includes('Main.js')) return createResponse({ text: tocMainJs });
      if (href.includes('Mock_Chunk0.js')) return createResponse({ text: tocChunkJs });
      return createResponse({ text: pageHtml });
    };
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=testim-overview']);

    assert.equal(result.fetched, 1);
    assert.equal(result.errors, 0);
    assert.equal(result.sidebarVerified, true);
  });

  it('reports sidebar verification failure when TOC fetch fails', async () => {
    const pageHtml = '<html><body><div id="mc-main-content" role="main"><h1>Title</h1></div></body></html>';

    global.fetch = async (url) => {
      const href = String(url);
      if (href.includes('Data/Tocs')) return createResponse({ ok: false, status: 500 });
      return createResponse({ text: pageHtml });
    };
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=testim-overview']);

    assert.equal(result.fetched, 1);
    assert.equal(result.errors, 1, 'sidebar failure should count as an error');
    assert.equal(result.sidebarVerified, false);
  });

  it('handles 404 response', async () => {
    const tocMainJs = "define({numchunks:1,prefix:'Mock_Chunk',tree:{n:[{i:0,c:0}]}});";
    const tocChunkJs = "define({'/content/overview/testim-overview/index.htm':{i:[0],t:['Overview'],b:['']}});";

    global.fetch = async (url) => {
      const href = String(url);
      if (href.includes('Main.js')) return createResponse({ text: tocMainJs });
      if (href.includes('Mock_Chunk0.js')) return createResponse({ text: tocChunkJs });
      return createResponse({ ok: false, status: 404 });
    };
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=testim-overview']);

    assert.equal(result.fetched, 0);
    assert.equal(result.notFound, 1);
  });
});
