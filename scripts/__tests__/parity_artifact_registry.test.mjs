// scripts/__tests__/parity_artifact_registry.test.mjs
/**
 * parity_artifact_registry の shape / empty-safe / inventory-driven exclusion /
 * runtime coverage aggregator を検証する。
 *
 * registry は EN-side artifact を (slug, token) で管理する slug-scope token
 * 抑止機構で、Phase 4 の alignSegments({slug, coverage}) から呼び出される。
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let isArtifactExcluded;
let registryEntries;
let createArtifactCoverage;

before(async () => {
  ({
    isArtifactExcluded,
    registryEntries,
    createArtifactCoverage,
  } = await import('../lib/parity_artifact_registry.mjs'));
});

// ---------------------------------------------------------------------------
// shape / empty-safe
// ---------------------------------------------------------------------------

describe('parity_artifact_registry (shape / empty-safe)', () => {
  it('isArtifactExcluded returns false for unregistered (slug, token)', () => {
    assert.equal(
      isArtifactExcluded({ slug: 'nonexistent/slug', token: 'nonexistent-token' }),
      false,
    );
  });

  it('registry entries have required shape (slugs non-empty, token string, dated)', () => {
    for (const e of registryEntries()) {
      assert.ok(Array.isArray(e.slugs) && e.slugs.length > 0, 'slugs must be non-empty array');
      assert.ok(typeof e.token === 'string' && e.token.length > 0, 'token must be non-empty string');
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(e.addedAt), 'addedAt must be YYYY-MM-DD');
    }
  });
});

// ---------------------------------------------------------------------------
// runtime coverage aggregator
// ---------------------------------------------------------------------------

describe('createArtifactCoverage', () => {
  it('starts empty and records hits per (slug, token)', () => {
    const c = createArtifactCoverage();
    const s0 = c.snapshot();
    assert.equal(s0.matchedHits, 0);
    c.record({ slug: 'a', token: '/docs/index', reason: 'en-unresolvable' });
    c.record({ slug: 'a', token: '/docs/index', reason: 'en-unresolvable' });
    c.record({ slug: 'b', token: 'http://google.com', reason: 'en-demo' });
    const s = c.snapshot();
    assert.equal(s.matchedHits, 3);
    assert.equal(s.bySlug.a, 2);
    assert.equal(s.bySlug.b, 1);
    assert.equal(s.byToken['/docs/index'], 2);
    assert.equal(s.byToken['http://google.com'], 1);
    assert.equal(typeof s.registryEntries, 'number');
  });
});

// ---------------------------------------------------------------------------
// inventory-driven exclusion (Task 4.1 inventory 2026-04-15 時点)
// ---------------------------------------------------------------------------

describe('parity_artifact_registry (inventory-driven exclusion)', () => {
  it('excludes http://google.com for creating-your-first-codeless-test (EN demo link artifact)', () => {
    assert.equal(
      isArtifactExcluded({
        slug: 'getting-started/creating-your-first-codeless-test',
        token: 'http://google.com',
      }),
      true,
    );
    assert.equal(
      isArtifactExcluded({ slug: 'editing-tests/steps', token: 'http://google.com' }),
      false,
    );
  });

  it('excludes /docs/index for registered slugs (5 slugs in inventory)', () => {
    const registered = [
      'editing-tests/conditions/advanced-conditions-settings',
      'integrations/visual-validation/visual_validation_index',
      'recording-tests/recording-a-mobile-test/recording-a-local-mobile-test',
      'salesforce-testing/salesforce-steps/sfdc-step-login',
      'testops/insights/dashboard',
    ];
    for (const slug of registered) {
      assert.equal(
        isArtifactExcluded({ slug, token: '/docs/index' }),
        true,
        `expected ${slug} to be excluded for /docs/index`,
      );
    }
    assert.equal(
      isArtifactExcluded({ slug: 'unregistered/slug', token: '/docs/index' }),
      false,
    );
  });
});
