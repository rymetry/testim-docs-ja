// scripts/__tests__/en_source_patches.test.mjs
/**
 * en_source_patches の registry schema、applier の idempotency /
 * order-independence / fail-open、coverage aggregator shape を検証する。
 *
 * Registry は EN HTML 境界で broken upstream を修復する literal find→replace
 * patch を slug-scope で管理する。`applyEnSourcePatches(html, slug, coverage)`
 * は preprocessEnHtml から呼ばれる (Phase 3)。
 *
 * Plan: docs/superpowers/plans/2026-04-17-en-source-patches-layer.md
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let EN_SOURCE_PATCHES;
let DEFECT_CLASSES;
let applyEnSourcePatches;
let createEnSourcePatchCoverage;
let NOOP_PATCH_COVERAGE;
let countOccurrences;
let registryEntries;

before(async () => {
  ({
    EN_SOURCE_PATCHES,
    DEFECT_CLASSES,
    applyEnSourcePatches,
    createEnSourcePatchCoverage,
    NOOP_PATCH_COVERAGE,
    countOccurrences,
    registryEntries,
  } = await import('../lib/en_source_patches.mjs'));
});

// ---------------------------------------------------------------------------
// registry schema
// ---------------------------------------------------------------------------

describe('en_source_patches registry schema', () => {
  it('exports a frozen, non-empty array of entries', () => {
    assert.ok(Array.isArray(EN_SOURCE_PATCHES), 'registry must be an array');
    assert.ok(EN_SOURCE_PATCHES.length > 0, 'registry must have at least 1 entry');
    assert.ok(Object.isFrozen(EN_SOURCE_PATCHES), 'registry must be frozen');
  });

  it('each entry has required fields with correct shape', () => {
    for (const e of EN_SOURCE_PATCHES) {
      assert.ok(Object.isFrozen(e), `entry ${e.id} must be frozen`);
      assert.ok(typeof e.id === 'string' && e.id.length > 0, 'id non-empty string');
      assert.ok(Array.isArray(e.slugs) && e.slugs.length > 0, `${e.id}: slugs non-empty array`);
      assert.ok(Object.isFrozen(e.slugs), `${e.id}: slugs array must be frozen`);
      for (const s of e.slugs) {
        assert.ok(typeof s === 'string' && s.length > 0, `${e.id}: each slug must be non-empty string`);
      }
      assert.ok(typeof e.find === 'string' && e.find.length > 0, `${e.id}: find non-empty string`);
      assert.ok(typeof e.replace === 'string', `${e.id}: replace is string`);
      assert.ok(typeof e.rationale === 'string' && e.rationale.length > 0, `${e.id}: rationale non-empty`);
      assert.ok(
        typeof e.linkedDefect === 'string' && e.linkedDefect.includes('upstream-defect-tracker.md#'),
        `${e.id}: linkedDefect must reference upstream-defect-tracker.md#<anchor>`,
      );
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(e.addedAt), `${e.id}: addedAt YYYY-MM-DD`);
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(e.reviewAfter), `${e.id}: reviewAfter YYYY-MM-DD`);
    }
  });

  it('defectClass is one of the 4 allowed enum values', () => {
    assert.deepEqual(
      [...DEFECT_CLASSES].sort(),
      ['href-miswire', 'madcap-artifact', 'stale-reference', 'typo'],
      'DEFECT_CLASSES must be exactly these 4',
    );
    for (const e of EN_SOURCE_PATCHES) {
      assert.ok(
        DEFECT_CLASSES.includes(e.defectClass),
        `${e.id}: defectClass "${e.defectClass}" not in enum`,
      );
    }
  });

  it('find is not a substring of replace (prevents infinite-loop-style non-idempotency)', () => {
    for (const e of EN_SOURCE_PATCHES) {
      assert.ok(
        !e.replace.includes(e.find),
        `${e.id}: replace must not contain find (idempotency requirement)`,
      );
    }
  });

  it('ids are globally unique', () => {
    const ids = EN_SOURCE_PATCHES.map(e => e.id);
    assert.equal(new Set(ids).size, ids.length, 'duplicate patch id detected');
  });

  it('registryEntries() returns a shallow copy (independent of mutation)', () => {
    const copy = registryEntries();
    assert.equal(copy.length, EN_SOURCE_PATCHES.length);
    // Push should not affect registry length (shallow copy, array itself is not the frozen one).
    copy.push({ bogus: true });
    assert.equal(EN_SOURCE_PATCHES.length, copy.length - 1, 'registry not mutated');
  });
});

// ---------------------------------------------------------------------------
// countOccurrences (literal, non-overlapping)
// ---------------------------------------------------------------------------

describe('countOccurrences', () => {
  it('counts non-overlapping literal occurrences', () => {
    assert.equal(countOccurrences('aaa', 'a'), 3);
    assert.equal(countOccurrences('ababab', 'ab'), 3);
    assert.equal(countOccurrences('<p>x</p><p>y</p>', '<p>'), 2);
    assert.equal(countOccurrences('nothing-here', 'missing'), 0);
  });

  it('returns 0 for empty / non-string inputs', () => {
    assert.equal(countOccurrences('', 'x'), 0);
    assert.equal(countOccurrences('x', ''), 0);
    assert.equal(countOccurrences(null, 'x'), 0);
    assert.equal(countOccurrences('x', null), 0);
  });
});

// ---------------------------------------------------------------------------
// applier — no-op paths
// ---------------------------------------------------------------------------

describe('applyEnSourcePatches (no-op paths)', () => {
  it('returns input unchanged when slug is empty', () => {
    const html = '<p>whatever</p>';
    const cov = createEnSourcePatchCoverage();
    assert.equal(applyEnSourcePatches(html, '', cov), html);
    assert.equal(applyEnSourcePatches(html, null, cov), html);
    assert.equal(cov.snapshot().matchedHits, 0);
    assert.equal(cov.snapshot().mismatches.length, 0);
  });

  it('returns input unchanged and records no coverage for unregistered slug', () => {
    const html = '<p>Verify -this action verifies</p>';
    const cov = createEnSourcePatchCoverage();
    const out = applyEnSourcePatches(html, 'totally/unregistered/slug', cov);
    assert.equal(out, html);
    const s = cov.snapshot();
    assert.equal(s.matchedHits, 0);
    assert.equal(s.mismatches.length, 0);
  });

  it('throws TypeError when html is not a string', () => {
    assert.throws(
      () => applyEnSourcePatches(123, 'x/y', NOOP_PATCH_COVERAGE),
      TypeError,
    );
  });

  it('works with default NOOP coverage (no-op record)', () => {
    const html = '<p>Verify -this action verifies</p>';
    const out = applyEnSourcePatches(
      html,
      'salesforce-testing/salesforce-steps/sfdc-step-create',
    );
    // Should still apply patch even with default NOOP coverage.
    assert.ok(out.includes('Verify - this action verifies'));
  });
});

// ---------------------------------------------------------------------------
// applier — UD-001A/B/UD-002 application
// ---------------------------------------------------------------------------

describe('applyEnSourcePatches (UD-001 / UD-002 application)', () => {
  it('applies UD-001A on plain-leading Verify for sfdc-step-create', () => {
    const html = '<p>Verify -this action verifies that the value matches.</p>';
    const cov = createEnSourcePatchCoverage();
    const out = applyEnSourcePatches(
      html,
      'salesforce-testing/salesforce-steps/sfdc-step-create',
      cov,
    );
    assert.equal(
      out,
      '<p>Verify - this action verifies that the value matches.</p>',
    );
    const s = cov.snapshot();
    assert.equal(s.matchedHits, 1);
    assert.equal(s.byPatchId['UD-001A-dash-this-typo-plain'], 1);
  });

  it('applies UD-001B on strong-leading Verify for sfdc-step-edit', () => {
    const html = '<p><strong>Verify</strong> -this action verifies the value.</p>';
    const cov = createEnSourcePatchCoverage();
    const out = applyEnSourcePatches(
      html,
      'salesforce-testing/salesforce-steps/sfdc-step-edit',
      cov,
    );
    assert.equal(
      out,
      '<p><strong>Verify</strong> - this action verifies the value.</p>',
    );
    assert.equal(cov.snapshot().matchedHits, 1);
  });

  it('applies UD-002 on Log out href for salesforce-steps parent', () => {
    const html = '<p><a href="sfdc-step-launchapp.htm">Log out</a> - Logs out of Salesforce.</p>';
    const cov = createEnSourcePatchCoverage();
    const out = applyEnSourcePatches(html, 'salesforce-testing/salesforce-steps', cov);
    assert.equal(
      out,
      '<p><a href="sfdc-step-logout.htm">Log out</a> - Logs out of Salesforce.</p>',
    );
    assert.equal(cov.snapshot().matchedHits, 1);
  });

  it('does NOT apply UD-001A on sfdc-step-edit (slug mismatch)', () => {
    const html = '<p>Verify -this action verifies x</p>';
    const cov = createEnSourcePatchCoverage();
    const out = applyEnSourcePatches(
      html,
      'salesforce-testing/salesforce-steps/sfdc-step-edit',
      cov,
    );
    // Unchanged: patch UD-001A targets plain-leading + sfdc-step-create/validate.
    // UD-001B's find does not match here either.
    assert.equal(out, html);
    // Mismatch recorded for UD-001B (registered for sfdc-step-edit but find absent).
    const s = cov.snapshot();
    assert.equal(s.matchedHits, 0);
    assert.equal(s.mismatches.length, 1);
    assert.equal(s.mismatches[0].patchId, 'UD-001B-dash-this-typo-strong');
    assert.equal(s.mismatches[0].reason, 'find-not-found');
  });

  it('records mismatch (fail-open) when find is absent in registered slug', () => {
    const html = '<p>completely unrelated HTML</p>';
    const cov = createEnSourcePatchCoverage();
    const out = applyEnSourcePatches(
      html,
      'salesforce-testing/salesforce-steps/sfdc-step-create',
      cov,
    );
    assert.equal(out, html); // fail-open: no replacement, raw returned
    const s = cov.snapshot();
    assert.equal(s.matchedHits, 0);
    assert.equal(s.mismatches.length, 1);
    assert.equal(s.mismatches[0].patchId, 'UD-001A-dash-this-typo-plain');
    assert.equal(s.mismatches[0].slug, 'salesforce-testing/salesforce-steps/sfdc-step-create');
  });
});

// ---------------------------------------------------------------------------
// idempotency
// ---------------------------------------------------------------------------

describe('applyEnSourcePatches (idempotency)', () => {
  it('apply(apply(html)) === apply(html) for every registered (slug, matching-find)', () => {
    for (const patch of EN_SOURCE_PATCHES) {
      for (const slug of patch.slugs) {
        const html = `<div>prefix ${patch.find} suffix</div>`;
        const once = applyEnSourcePatches(html, slug, createEnSourcePatchCoverage());
        const twice = applyEnSourcePatches(once, slug, createEnSourcePatchCoverage());
        assert.equal(twice, once, `${patch.id} not idempotent for ${slug}`);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// order-independence
// ---------------------------------------------------------------------------

describe('applyEnSourcePatches (order-independence)', () => {
  it('all 3 patches applied to a multi-fragment HTML yield the same result regardless of internal order', () => {
    // Build a synthetic HTML containing all 3 distinct find fragments, applied
    // to a slug that covers only the relevant patch. Since each patch targets
    // disjoint slugs, for any single slug at most one find is relevant.
    // Verify slug-scope disjointness is preserved.
    const slugSample = 'salesforce-testing/salesforce-steps/sfdc-step-create';
    const html =
      '<p>Verify -this action verifies a</p>' +
      '<p><strong>Verify</strong> -this action verifies b</p>' +
      '<p><a href="sfdc-step-launchapp.htm">Log out</a> c</p>';
    const out = applyEnSourcePatches(html, slugSample, createEnSourcePatchCoverage());
    // Only UD-001A applies (plain-leading, sfdc-step-create allow-list).
    assert.ok(out.includes('Verify - this action verifies a'));
    // UD-001B unchanged because slug is not in its allow-list.
    assert.ok(out.includes('<strong>Verify</strong> -this action verifies b'));
    // UD-002 unchanged because slug mismatch.
    assert.ok(out.includes('<a href="sfdc-step-launchapp.htm">Log out</a>'));
  });
});

// ---------------------------------------------------------------------------
// coverage aggregator shape
// ---------------------------------------------------------------------------

describe('createEnSourcePatchCoverage', () => {
  it('starts empty', () => {
    const c = createEnSourcePatchCoverage();
    const s = c.snapshot();
    assert.equal(s.matchedHits, 0);
    assert.deepEqual(s.byPatchId, {});
    assert.deepEqual(s.bySlug, {});
    assert.deepEqual(s.mismatches, []);
    assert.equal(typeof s.registryEntries, 'number');
    assert.equal(s.registryEntries, EN_SOURCE_PATCHES.length);
  });

  it('aggregates hits across (slug, patchId) and tracks mismatches', () => {
    const c = createEnSourcePatchCoverage();
    c.recordHit({ slug: 'x/a', patchId: 'UD-001A-dash-this-typo-plain', hits: 2 });
    c.recordHit({ slug: 'x/a', patchId: 'UD-001A-dash-this-typo-plain', hits: 1 });
    c.recordHit({ slug: 'x/b', patchId: 'UD-002-logout-href-miswire', hits: 1 });
    c.recordMismatch({ slug: 'x/c', patchId: 'UD-001B-dash-this-typo-strong', reason: 'find-not-found' });
    const s = c.snapshot();
    assert.equal(s.matchedHits, 4);
    assert.equal(s.byPatchId['UD-001A-dash-this-typo-plain'], 3);
    assert.equal(s.byPatchId['UD-002-logout-href-miswire'], 1);
    assert.equal(s.bySlug['x/a'], 3);
    assert.equal(s.bySlug['x/b'], 1);
    assert.equal(s.mismatches.length, 1);
    assert.equal(s.mismatches[0].reason, 'find-not-found');
  });

  it('NOOP_PATCH_COVERAGE is frozen, record is no-op, snapshot stable', () => {
    NOOP_PATCH_COVERAGE.recordHit({ slug: 'x', patchId: 'y', hits: 99 });
    NOOP_PATCH_COVERAGE.recordMismatch({ slug: 'x', patchId: 'y', reason: 'z' });
    const s = NOOP_PATCH_COVERAGE.snapshot();
    assert.equal(s.matchedHits, 0);
    assert.deepEqual(s.byPatchId, {});
    assert.deepEqual(s.mismatches, []);
    assert.ok(Object.isFrozen(NOOP_PATCH_COVERAGE));
  });
});
