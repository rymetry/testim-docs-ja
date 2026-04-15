// scripts/__tests__/parity_normalize.test.mjs
/**
 * parity_normalize — URL rewrite rules for parity comparison.
 *
 * Normalizes URL tokens so that localized-link differences between EN and JA
 * do not generate segment-token-gap issues. Deterministic, bidirectional
 * mapping. No fuzzy logic.
 */

import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let normalizeUrlForParity;
let canonicalizeDocsUrl;
let normalizeSegmentTokens;

before(async () => {
  ({ normalizeUrlForParity, canonicalizeDocsUrl, normalizeSegmentTokens } =
    await import('../lib/parity_normalize.mjs'));
});

describe('normalizeUrlForParity — help.testim.io → canonical', () => {
  it('rewrites help.testim.io/docs/X to /docs/X', () => {
    assert.equal(
      normalizeUrlForParity('https://help.testim.io/docs/loops'),
      '/docs/loops',
    );
  });

  it('preserves hash fragment', () => {
    assert.equal(
      normalizeUrlForParity(
        'https://help.testim.io/docs/loops#using-the-loop-iterator-parameter',
      ),
      '/docs/loops#using-the-loop-iterator-parameter',
    );
  });

  it('handles help.testim.io without protocol', () => {
    assert.equal(
      normalizeUrlForParity('help.testim.io/docs/configuration-file'),
      '/docs/configuration-file',
    );
  });
});

describe('canonicalizeDocsUrl — docs.tricentis.com/testim/content/...', () => {
  // NOTE: /Topics/Help/ is a legacy URL form not used in the repo.
  // The canonical repo form is /{category}/{slug}.htm (no Topics/Help prefix).
  // These tests document the literal path translation behaviour for legacy URLs.
  it('rewrites docs.tricentis.com/testim/content/Topics/Help/X.htm (legacy form — literal path)', () => {
    assert.equal(
      canonicalizeDocsUrl(
        'https://docs.tricentis.com/testim/content/Topics/Help/loops.htm',
      ),
      '/docs/Topics/Help/loops',
    );
  });

  it('handles nested path /Topics/Help/advanced-editing/loops.htm (legacy form — literal path)', () => {
    assert.equal(
      canonicalizeDocsUrl(
        'https://docs.tricentis.com/testim/content/Topics/Help/advanced-editing/loops.htm',
      ),
      '/docs/Topics/Help/advanced-editing/loops',
    );
  });
});

describe('normalizeSegmentTokens — applies both rewrites', () => {
  it('returns token set with all URLs normalized', () => {
    const tokens = [
      'https://help.testim.io/docs/loops',
      // Legacy Topics/Help form — normalizes to literal path (not canonical repo form).
      'https://docs.tricentis.com/testim/content/Topics/Help/hooks.htm',
      '--project-id',
      'Ctrl+S',
    ];
    const result = normalizeSegmentTokens(tokens);
    assert.deepEqual(result.sort(), ['--project-id', '/docs/Topics/Help/hooks', '/docs/loops', 'Ctrl+S']);
  });

  it('preserves non-URL tokens unchanged', () => {
    const tokens = ['--token', 'package.json', 'Shift+K'];
    const result = normalizeSegmentTokens(tokens);
    assert.deepEqual(result.sort(), ['--token', 'Shift+K', 'package.json']);
  });

  it('deduplicates when EN and JA produce the same canonical form', () => {
    const enTokens = ['https://help.testim.io/docs/loops'];
    const jaTokens = ['/docs/loops'];
    assert.deepEqual(normalizeSegmentTokens(enTokens), normalizeSegmentTokens(jaTokens));
  });
});

describe('canonicalizeDocsUrl — actual repo canonical URL forms', () => {
  it('rewrites docs.tricentis.com/testim/content/{category}/{slug}.htm (no Topics/Help prefix)', () => {
    assert.equal(
      canonicalizeDocsUrl('https://docs.tricentis.com/testim/content/administration/api-access.htm'),
      '/docs/administration/api-access',
    );
  });

  it('rewrites nested category path', () => {
    assert.equal(
      canonicalizeDocsUrl('https://docs.tricentis.com/testim/content/advanced-editing/data-driven-testing/configuring-data-driven-tests-using-the-config-file.htm'),
      '/docs/advanced-editing/data-driven-testing/configuring-data-driven-tests-using-the-config-file',
    );
  });

  it('strips /index.htm to directory root', () => {
    assert.equal(
      canonicalizeDocsUrl('https://docs.tricentis.com/testim/content/advanced-editing/data-driven-testing/index.htm'),
      '/docs/advanced-editing/data-driven-testing',
    );
  });

  it('strips top-level /index.htm to /docs/{category}', () => {
    assert.equal(
      canonicalizeDocsUrl('https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm'),
      '/docs/overview/testim-overview',
    );
  });

  it('preserves hash fragment after canonical conversion', () => {
    assert.equal(
      canonicalizeDocsUrl('https://docs.tricentis.com/testim/content/administration/api-access.htm#api-access'),
      '/docs/administration/api-access#api-access',
    );
  });
});

describe('normalizeUrlForParity — passthrough cases', () => {
  it('passes through external URLs unchanged', () => {
    assert.equal(
      normalizeUrlForParity('https://applitools.com/'),
      'https://applitools.com/',
    );
  });

  it('passes through non-URL strings unchanged', () => {
    assert.equal(normalizeUrlForParity('--project-id'), '--project-id');
  });
});

describe('normalizeUrlForParity — help.testim.io symmetry (Phase 4 Task 4.3)', () => {
  it('normalizes help.testim.io URL with fragment symmetrically', () => {
    assert.equal(
      normalizeUrlForParity('https://help.testim.io/docs/api-access#api-access'),
      normalizeUrlForParity('/docs/api-access#api-access'),
    );
  });

  it('preserves fragment on /docs path', () => {
    assert.equal(
      normalizeUrlForParity('https://help.testim.io/docs/index#top'),
      '/docs/index#top',
    );
  });

  it('drops trailing slash differences', () => {
    assert.equal(
      normalizeUrlForParity('https://help.testim.io/docs/api-access/'),
      normalizeUrlForParity('/docs/api-access'),
    );
  });
});

describe('normalizeUrlForParity — /docs canonical form (PR A feedback P2)', () => {
  it('drops trailing slash on bare /docs path', () => {
    assert.equal(
      normalizeUrlForParity('/docs/api-access/'),
      '/docs/api-access',
    );
  });

  it('drops query string on bare /docs path', () => {
    assert.equal(
      normalizeUrlForParity('/docs/api-access?x=1'),
      '/docs/api-access',
    );
  });

  it('drops query string on help.testim.io URL', () => {
    assert.equal(
      normalizeUrlForParity('https://help.testim.io/docs/api-access?x=1'),
      '/docs/api-access',
    );
  });

  it('drops query while preserving fragment', () => {
    assert.equal(
      normalizeUrlForParity('https://help.testim.io/docs/api-access?x=1#frag'),
      '/docs/api-access#frag',
    );
  });

  it('help.testim.io + query + trailing slash ↔ bare /docs symmetric', () => {
    assert.equal(
      normalizeUrlForParity('https://help.testim.io/docs/api-access/?ref=x#top'),
      normalizeUrlForParity('/docs/api-access#top'),
    );
  });

  it('strips help.testim.io prefix even for non-/docs paths (e.g. /v2.0/docs/...)', () => {
    // Stage B5 で別途処理する想定。ここでは少なくとも prefix strip の対称性を確保する。
    assert.equal(
      normalizeUrlForParity('https://help.testim.io/v2.0/docs/scheduler#x'),
      '/v2.0/docs/scheduler#x',
    );
  });
});
