import { afterEach, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let main;

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
  ({ main } = await import('../snapshot_update.mjs'));
});

afterEach(() => {
  global.fetch = originalFetch;
  console.log = originalLog;
});

describe('snapshot_update main', () => {
  it('verifies sidebar in dry-run mode without writing files', async () => {
    const calls = [];
    global.fetch = async (url) => {
      const href = String(url);
      calls.push(href);

      if (href.endsWith('.md')) {
        return createResponse({ text: '# Testim overview\n' });
      }

      return createResponse({
        text: '<html><nav id="hub-sidebar"><a href="/docs/testim-overview">Overview</a></nav></html>',
      });
    };
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=testim-overview']);

    assert.equal(result.fetched, 1);
    assert.equal(result.errors, 0);
    assert.equal(result.sidebarVerified, true);
    assert.equal(calls.length, 2);
    assert.ok(calls.some((href) => href.endsWith('.md')));
    assert.ok(calls.some((href) => href === 'https://help.testim.io/docs/testim-overview'));
  });

  it('returns an error when no sidebar can be verified from fetched pages', async () => {
    global.fetch = async (url) => {
      const href = String(url);
      if (href.endsWith('.md')) {
        return createResponse({ text: '# Testim overview\n' });
      }

      return createResponse({ text: '<html><body>Missing sidebar</body></html>' });
    };
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=testim-overview']);

    assert.equal(result.fetched, 1);
    assert.equal(result.errors, 1);
    assert.equal(result.sidebarVerified, false);
  });
});
