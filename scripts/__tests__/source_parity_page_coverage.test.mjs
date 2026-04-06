import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  checkSourcePageMissingLocal,
  checkMissingFreshSnapshot,
} from '../lib/source_parity_page_coverage.mjs';

// ---------------------------------------------------------------------------
// checkSourcePageMissingLocal
// ---------------------------------------------------------------------------

describe('checkSourcePageMissingLocal', () => {
  it('returns empty array when all sidebar slugs have local files', () => {
    const sidebarSlugs = new Set(['overview/testim-overview', 'overview/changelog']);
    const localSlugs = new Set(['overview/testim-overview', 'overview/changelog']);
    const result = checkSourcePageMissingLocal(sidebarSlugs, localSlugs);
    assert.deepEqual(result, []);
  });

  it('returns issue for sidebar slug missing from local files', () => {
    const sidebarSlugs = new Set(['overview/testim-overview', 'overview/new-page']);
    const localSlugs = new Set(['overview/testim-overview']);
    const result = checkSourcePageMissingLocal(sidebarSlugs, localSlugs);
    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'source-page-missing-local');
    assert.equal(result[0].severity, 'actionable');
    assert.match(result[0].detail, /overview\/new-page/);
  });

  it('returns multiple issues for multiple missing pages', () => {
    const sidebarSlugs = new Set(['a', 'b', 'c']);
    const localSlugs = new Set(['a']);
    const result = checkSourcePageMissingLocal(sidebarSlugs, localSlugs);
    assert.equal(result.length, 2);
    const slugsInDetail = result.map((r) => r.detail);
    assert.ok(slugsInDetail.some((d) => d.includes('b')));
    assert.ok(slugsInDetail.some((d) => d.includes('c')));
  });

  it('returns empty array when sidebar is empty', () => {
    const result = checkSourcePageMissingLocal(new Set(), new Set(['a']));
    assert.deepEqual(result, []);
  });

  it('ignores extra local slugs not in sidebar', () => {
    const sidebarSlugs = new Set(['a']);
    const localSlugs = new Set(['a', 'b', 'c']);
    const result = checkSourcePageMissingLocal(sidebarSlugs, localSlugs);
    assert.deepEqual(result, []);
  });
});

// ---------------------------------------------------------------------------
// checkMissingFreshSnapshot
// ---------------------------------------------------------------------------

describe('checkMissingFreshSnapshot', () => {
  it('returns empty array when all slugs with sourceUrl have snapshots', () => {
    const localSourceUrls = new Map([['a', 'https://example.com/a']]);
    const snapshotSlugs = new Set(['a']);
    const result = checkMissingFreshSnapshot(localSourceUrls, snapshotSlugs, 'fresh');
    assert.deepEqual(result, []);
  });

  it('returns actionable issue when freshnessState is "fresh" and snapshot missing', () => {
    const localSourceUrls = new Map([['a', 'https://example.com/a']]);
    const snapshotSlugs = new Set();
    const result = checkMissingFreshSnapshot(localSourceUrls, snapshotSlugs, 'fresh');
    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'missing-fresh-snapshot');
    assert.equal(result[0].severity, 'actionable');
    assert.match(result[0].detail, /fresh/);
  });

  it('returns signal issue when freshnessState is "partial" and snapshot missing', () => {
    const localSourceUrls = new Map([['a', 'https://example.com/a']]);
    const snapshotSlugs = new Set();
    const result = checkMissingFreshSnapshot(localSourceUrls, snapshotSlugs, 'partial');
    assert.equal(result.length, 1);
    assert.equal(result[0].severity, 'signal');
  });

  it('returns signal issue when freshnessState is "broken"', () => {
    const localSourceUrls = new Map([['a', 'https://example.com/a']]);
    const snapshotSlugs = new Set();
    const result = checkMissingFreshSnapshot(localSourceUrls, snapshotSlugs, 'broken');
    assert.equal(result.length, 1);
    assert.equal(result[0].severity, 'signal');
  });

  it('returns signal issue when freshnessState is null (no source-sync data)', () => {
    const localSourceUrls = new Map([['a', 'https://example.com/a']]);
    const snapshotSlugs = new Set();
    const result = checkMissingFreshSnapshot(localSourceUrls, snapshotSlugs, null);
    assert.equal(result.length, 1);
    assert.equal(result[0].severity, 'signal');
  });

  it('skips slugs without sourceUrl (empty map)', () => {
    const localSourceUrls = new Map();
    const snapshotSlugs = new Set();
    const result = checkMissingFreshSnapshot(localSourceUrls, snapshotSlugs, 'fresh');
    assert.deepEqual(result, []);
  });

  it('reports multiple missing snapshots', () => {
    const localSourceUrls = new Map([
      ['a', 'https://example.com/a'],
      ['b', 'https://example.com/b'],
    ]);
    const snapshotSlugs = new Set();
    const result = checkMissingFreshSnapshot(localSourceUrls, snapshotSlugs, 'fresh');
    assert.equal(result.length, 2);
  });

  it('only reports slugs missing from snapshot set', () => {
    const localSourceUrls = new Map([
      ['a', 'https://example.com/a'],
      ['b', 'https://example.com/b'],
    ]);
    const snapshotSlugs = new Set(['a']);
    const result = checkMissingFreshSnapshot(localSourceUrls, snapshotSlugs, 'fresh');
    assert.equal(result.length, 1);
    assert.match(result[0].detail, /b/);
  });
});
