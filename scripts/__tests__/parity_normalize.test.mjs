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
  it('rewrites docs.tricentis.com/testim/content/Topics/Help/X.htm to /docs/X', () => {
    assert.equal(
      canonicalizeDocsUrl(
        'https://docs.tricentis.com/testim/content/Topics/Help/loops.htm',
      ),
      '/docs/loops',
    );
  });

  it('handles nested path /Topics/Help/advanced-editing/loops.htm', () => {
    assert.equal(
      canonicalizeDocsUrl(
        'https://docs.tricentis.com/testim/content/Topics/Help/advanced-editing/loops.htm',
      ),
      '/docs/advanced-editing/loops',
    );
  });
});

describe('normalizeSegmentTokens — applies both rewrites', () => {
  it('returns token set with all URLs normalized', () => {
    const tokens = [
      'https://help.testim.io/docs/loops',
      'https://docs.tricentis.com/testim/content/Topics/Help/hooks.htm',
      '--project-id',
      'Ctrl+S',
    ];
    const result = normalizeSegmentTokens(tokens);
    assert.deepEqual(result.sort(), ['--project-id', '/docs/hooks', '/docs/loops', 'Ctrl+S']);
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
