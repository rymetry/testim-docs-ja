/**
 * source-side debt exclusion registry の契約。
 *
 * `scripts/lib/source_sync_exclusions.mjs` は "既知 broken upstream source"
 * を明示 registry で管理する。自動除外はしない。
 *
 * このテストが pin する契約:
 *   1. registry は slug → metadata object の plain object
 *   2. metadata に必須フィールドが全て揃っている
 *   3. lookup helper (`isSourceSideDebt` / `getExclusion` /
 *      `listSourceSideDebtSlugs`) が registry を安全に露出する
 *   4. `pull-requests` slug が初回 entry として登録済み
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  SOURCE_SYNC_EXCLUSIONS,
  isSourceSideDebt,
  getExclusion,
  listSourceSideDebtSlugs,
} from '../lib/source_sync_exclusions.mjs';

// ---------------------------------------------------------------------------
// registry shape
// ---------------------------------------------------------------------------

describe('SOURCE_SYNC_EXCLUSIONS registry', () => {
  it('is a plain object keyed by slug', () => {
    assert.equal(typeof SOURCE_SYNC_EXCLUSIONS, 'object');
    assert.notEqual(SOURCE_SYNC_EXCLUSIONS, null);
    assert.equal(Array.isArray(SOURCE_SYNC_EXCLUSIONS), false);
  });

  it('has pull-requests as the initial source-side debt entry', () => {
    const slug = 'testops/testops-version-control/pull-requests';
    assert.ok(
      SOURCE_SYNC_EXCLUSIONS[slug],
      `registry must seed ${slug} as the first known source-side debt entry`,
    );
  });

  it('each entry has all required metadata fields', () => {
    const requiredFields = [
      'reason',
      'note',
      'expectedIssueType',
      'expectedReason',
      'addedAt',
      'linkedIssue',
    ];
    for (const [slug, entry] of Object.entries(SOURCE_SYNC_EXCLUSIONS)) {
      for (const field of requiredFields) {
        assert.ok(
          Object.prototype.hasOwnProperty.call(entry, field),
          `registry[${slug}] missing required field "${field}"`,
        );
      }
    }
  });

  it('pull-requests entry documents the broken upstream symptom', () => {
    const entry = SOURCE_SYNC_EXCLUSIONS['testops/testops-version-control/pull-requests'];
    // reason は固定の "broken-upstream-source" token を使う (downstream
    // consumer が string match しやすいように)
    assert.equal(entry.reason, 'broken-upstream-source');
    // expectedIssueType / expectedReason は detectSourceUsability の
    // 出力 shape と合致させる — recovery probe が detectSourceUsability を
    // 再利用するため、upstream が直ったとき detector が null を返し
    // "excluded-recovered" 判定が正しく到達する。
    assert.equal(entry.expectedIssueType, 'snapshot-incomplete');
    assert.equal(entry.expectedReason, 'extractor-empty');
    assert.match(entry.addedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(entry.linkedIssue, 247);
    assert.equal(typeof entry.note, 'string');
    assert.ok(entry.note.length > 0, 'note must be a non-empty human description');
  });
});

// ---------------------------------------------------------------------------
// lookup helpers
// ---------------------------------------------------------------------------

describe('isSourceSideDebt', () => {
  it('returns true for registered slugs', () => {
    assert.equal(
      isSourceSideDebt('testops/testops-version-control/pull-requests'),
      true,
    );
  });

  it('returns false for unregistered slugs', () => {
    assert.equal(isSourceSideDebt('overview/testim-overview'), false);
    assert.equal(isSourceSideDebt('not-a-real-slug'), false);
  });

  it('returns false for null/undefined/empty input', () => {
    assert.equal(isSourceSideDebt(null), false);
    assert.equal(isSourceSideDebt(undefined), false);
    assert.equal(isSourceSideDebt(''), false);
  });
});

describe('getExclusion', () => {
  it('returns metadata for registered slugs', () => {
    const entry = getExclusion('testops/testops-version-control/pull-requests');
    assert.ok(entry);
    assert.equal(entry.reason, 'broken-upstream-source');
  });

  it('returns null for unregistered slugs', () => {
    assert.equal(getExclusion('overview/testim-overview'), null);
  });

  it('returns null for null/undefined input', () => {
    assert.equal(getExclusion(null), null);
    assert.equal(getExclusion(undefined), null);
  });

  it('returned metadata is a shallow copy (caller cannot mutate registry)', () => {
    const entry = getExclusion('testops/testops-version-control/pull-requests');
    entry.reason = 'mutated';
    const fresh = getExclusion('testops/testops-version-control/pull-requests');
    assert.equal(fresh.reason, 'broken-upstream-source');
  });
});

describe('listSourceSideDebtSlugs', () => {
  it('returns all registered slugs as a sorted array', () => {
    const slugs = listSourceSideDebtSlugs();
    assert.ok(Array.isArray(slugs));
    assert.ok(slugs.includes('testops/testops-version-control/pull-requests'));
    // sorted — downstream consumer は順序に依存できる
    const sorted = [...slugs].sort();
    assert.deepEqual(slugs, sorted);
  });

  it('returns a fresh array on each call (caller cannot mutate registry state)', () => {
    const first = listSourceSideDebtSlugs();
    first.push('fake/slug');
    const second = listSourceSideDebtSlugs();
    assert.equal(second.includes('fake/slug'), false);
  });
});
