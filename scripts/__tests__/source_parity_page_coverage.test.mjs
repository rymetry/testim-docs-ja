import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  checkSourcePageMissingLocal,
  checkLocalPageOrphan,
  checkMissingSnapshot,
  checkSinglePageSnapshot,
  checkPageCoverage,
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
// checkLocalPageOrphan
// ---------------------------------------------------------------------------

describe('checkLocalPageOrphan', () => {
  it('returns empty when all local slugs are in the sidebar', () => {
    const localSlugs = new Set(['overview/a', 'overview/b']);
    const sidebarSlugs = new Set(['overview/a', 'overview/b', 'overview/c']);
    const result = checkLocalPageOrphan(localSlugs, sidebarSlugs);
    assert.deepEqual(result, []);
  });

  it('emits local-page-orphan for slugs not in sidebar', () => {
    const localSlugs = new Set(['overview/a', 'overview/orphan']);
    const sidebarSlugs = new Set(['overview/a']);
    const result = checkLocalPageOrphan(localSlugs, sidebarSlugs);
    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'local-page-orphan');
    assert.equal(result[0].severity, 'actionable');
    assert.match(result[0].detail, /overview\/orphan/);
  });

  it('emits multiple orphans in stable iteration order', () => {
    const localSlugs = new Set(['a', 'b', 'c']);
    const sidebarSlugs = new Set(['a']);
    const result = checkLocalPageOrphan(localSlugs, sidebarSlugs);
    assert.equal(result.length, 2);
    const slugs = result.map((r) => r.detail);
    assert.ok(slugs.some((d) => d.includes('b')));
    assert.ok(slugs.some((d) => d.includes('c')));
  });

  it('returns empty when sidebarSlugs is empty (cannot trust orphan signal without sidebar)', () => {
    // If the sidebar load failed, every local file would look orphaned.
    // The check guards against that by returning [] when sidebarSlugs
    // is empty, so that a missing sidebar does not flood the gate.
    const localSlugs = new Set(['a', 'b']);
    const result = checkLocalPageOrphan(localSlugs, new Set());
    assert.deepEqual(result, []);
  });

  it('returns empty when sidebarSlugs is null', () => {
    const localSlugs = new Set(['a']);
    const result = checkLocalPageOrphan(localSlugs, null);
    assert.deepEqual(result, []);
  });
});

// ---------------------------------------------------------------------------
// checkMissingSnapshot
// ---------------------------------------------------------------------------

describe('checkMissingSnapshot', () => {
  it('returns empty array when all slugs with sourceUrl have snapshots', () => {
    const localSourceUrls = new Map([['a', 'https://example.com/a']]);
    const snapshotSlugs = new Set(['a']);
    const result = checkMissingSnapshot(localSourceUrls, snapshotSlugs, 'fresh');
    assert.deepEqual(result, []);
  });

  it('returns missing-fresh-snapshot (actionable) when freshnessState is "fresh"', () => {
    const localSourceUrls = new Map([['a', 'https://example.com/a']]);
    const snapshotSlugs = new Set();
    const result = checkMissingSnapshot(localSourceUrls, snapshotSlugs, 'fresh');
    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'missing-fresh-snapshot');
    assert.equal(result[0].severity, 'actionable');
  });

  it('returns missing-snapshot (signal) when freshnessState is "partial"', () => {
    const localSourceUrls = new Map([['a', 'https://example.com/a']]);
    const snapshotSlugs = new Set();
    const result = checkMissingSnapshot(localSourceUrls, snapshotSlugs, 'partial');
    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'missing-snapshot');
    assert.equal(result[0].severity, 'signal');
  });

  it('returns missing-snapshot (signal) when freshnessState is "broken"', () => {
    const localSourceUrls = new Map([['a', 'https://example.com/a']]);
    const snapshotSlugs = new Set();
    const result = checkMissingSnapshot(localSourceUrls, snapshotSlugs, 'broken');
    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'missing-snapshot');
    assert.equal(result[0].severity, 'signal');
  });

  it('returns missing-snapshot (signal) when freshnessState is null', () => {
    const localSourceUrls = new Map([['a', 'https://example.com/a']]);
    const snapshotSlugs = new Set();
    const result = checkMissingSnapshot(localSourceUrls, snapshotSlugs, null);
    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'missing-snapshot');
    assert.equal(result[0].severity, 'signal');
  });

  it('skips slugs without sourceUrl (empty map)', () => {
    const localSourceUrls = new Map();
    const snapshotSlugs = new Set();
    const result = checkMissingSnapshot(localSourceUrls, snapshotSlugs, 'fresh');
    assert.deepEqual(result, []);
  });

  it('reports multiple missing snapshots', () => {
    const localSourceUrls = new Map([
      ['a', 'https://example.com/a'],
      ['b', 'https://example.com/b'],
    ]);
    const snapshotSlugs = new Set();
    const result = checkMissingSnapshot(localSourceUrls, snapshotSlugs, 'fresh');
    assert.equal(result.length, 2);
  });

  it('only reports slugs missing from snapshot set', () => {
    const localSourceUrls = new Map([
      ['a', 'https://example.com/a'],
      ['b', 'https://example.com/b'],
    ]);
    const snapshotSlugs = new Set(['a']);
    const result = checkMissingSnapshot(localSourceUrls, snapshotSlugs, 'fresh');
    assert.equal(result.length, 1);
    assert.match(result[0].detail, /b/);
  });
});

// ---------------------------------------------------------------------------
// checkSinglePageSnapshot
// ---------------------------------------------------------------------------

describe('checkSinglePageSnapshot', () => {
  it('returns empty when sourceUrl is empty', () => {
    const result = checkSinglePageSnapshot('a', '', new Set(), 'fresh');
    assert.deepEqual(result, []);
  });

  it('returns empty when snapshot exists', () => {
    const result = checkSinglePageSnapshot('a', 'https://example.com/a', new Set(['a']), 'fresh');
    assert.deepEqual(result, []);
  });

  it('returns missing-fresh-snapshot (actionable) when fresh and no snapshot', () => {
    const result = checkSinglePageSnapshot('a', 'https://example.com/a', new Set(), 'fresh');
    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'missing-fresh-snapshot');
    assert.equal(result[0].severity, 'actionable');
  });

  it('returns missing-snapshot (signal) when not fresh and no snapshot', () => {
    const result = checkSinglePageSnapshot('a', 'https://example.com/a', new Set(), null);
    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'missing-snapshot');
    assert.equal(result[0].severity, 'signal');
  });

  it('returns missing-snapshot (signal) when broken and no snapshot', () => {
    const result = checkSinglePageSnapshot('a', 'https://example.com/a', new Set(), 'broken');
    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'missing-snapshot');
    assert.equal(result[0].severity, 'signal');
  });
});

// ---------------------------------------------------------------------------
// checkPageCoverage (aggregate)
// ---------------------------------------------------------------------------

describe('checkPageCoverage', () => {
  it('returns combined issues from all sub-checks', () => {
    const result = checkPageCoverage({
      sidebarSlugs: new Set(['a', 'b']),
      localSlugs: new Set(['a']),
      localSourceUrls: new Map([['a', 'https://example.com/a']]),
      snapshotSlugs: new Set(),
      freshnessState: 'fresh',
    });
    // b missing local + a missing snapshot
    assert.equal(result.length, 2);
    const types = result.map((r) => r.type);
    assert.ok(types.includes('source-page-missing-local'));
    assert.ok(types.includes('missing-fresh-snapshot'));
  });

  it('emits local-page-orphan for local files not in sidebar', () => {
    const result = checkPageCoverage({
      sidebarSlugs: new Set(['a']),
      localSlugs: new Set(['a', 'orphan-z']),
      localSourceUrls: new Map([
        ['a', 'https://example.com/a'],
        ['orphan-z', 'https://example.com/orphan-z'],
      ]),
      snapshotSlugs: new Set(['a', 'orphan-z']),
      freshnessState: 'fresh',
    });
    const orphan = result.find((r) => r.type === 'local-page-orphan');
    assert.ok(orphan, 'local-page-orphan must fire');
    assert.match(orphan.detail, /orphan-z/);
  });

  it('returns empty array when everything is covered', () => {
    const result = checkPageCoverage({
      sidebarSlugs: new Set(['a']),
      localSlugs: new Set(['a']),
      localSourceUrls: new Map([['a', 'https://example.com/a']]),
      snapshotSlugs: new Set(['a']),
      freshnessState: 'fresh',
    });
    assert.deepEqual(result, []);
  });

  it('works with empty inputs', () => {
    const result = checkPageCoverage({
      sidebarSlugs: new Set(),
      localSlugs: new Set(),
      localSourceUrls: new Map(),
      snapshotSlugs: new Set(),
      freshnessState: null,
    });
    assert.deepEqual(result, []);
  });

  it('passes freshnessState through to snapshot check', () => {
    const result = checkPageCoverage({
      sidebarSlugs: new Set(['a']),
      localSlugs: new Set(['a']),
      localSourceUrls: new Map([['a', 'https://example.com/a']]),
      snapshotSlugs: new Set(),
      freshnessState: 'broken',
    });
    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'missing-snapshot');
    assert.equal(result[0].severity, 'signal');
  });
});
