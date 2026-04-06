import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  checkSourcePageMissingLocal,
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
