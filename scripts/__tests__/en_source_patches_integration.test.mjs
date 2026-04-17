// scripts/__tests__/en_source_patches_integration.test.mjs
/**
 * Integration-style assertions for the Bundle 1 acceptance gates (#6/#7/#10).
 *
 * This test exercises the patch layer against the real EN snapshot files
 * for the 6 target slugs and verifies:
 *   - gate #6: `patchCoverage.mismatches.length === 0` for target slugs
 *   - gate #7: `patchCoverage.matchedHits >= 6` after all target slugs processed
 *   - gate #10: Bundle 1 JA markdown contains zero `<!-- parity:` comments
 *
 * The real-snapshot driven assertions let us catch upstream drift without
 * running a full `npm run check:parity` pass (which is slow and touches the
 * whole repo).
 *
 * Plan: docs/superpowers/plans/2026-04-17-en-source-patches-layer.md §5
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

let preprocessEnHtml;
let createEnSourcePatchCoverage;
let EN_SOURCE_PATCHES;

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const SNAPSHOTS_ROOT = join(REPO_ROOT, 'snapshots', 'en', 'content');
const SNAPSHOT_ROOT = join(SNAPSHOTS_ROOT, 'salesforce-testing');
const JA_BUNDLE_DIR = join(
  REPO_ROOT,
  'src',
  'content',
  'docs',
  'salesforce-testing',
  'salesforce-steps',
);

// Target slugs per plan Bundle 1 (UD-001 / UD-002).
const TARGET_SLUG_SNAPSHOTS = [
  {
    slug: 'salesforce-testing/salesforce-steps/sfdc-step-create',
    path: join(SNAPSHOT_ROOT, 'salesforce-steps', 'sfdc-step-create.html'),
  },
  {
    slug: 'salesforce-testing/salesforce-steps/sfdc-step-edit',
    path: join(SNAPSHOT_ROOT, 'salesforce-steps', 'sfdc-step-edit.html'),
  },
  {
    slug: 'salesforce-testing/salesforce-steps/sfdc-step-quickactions',
    path: join(SNAPSHOT_ROOT, 'salesforce-steps', 'sfdc-step-quickactions.html'),
  },
  {
    slug: 'salesforce-testing/salesforce-steps/sfdc-step-relatedlistaction',
    path: join(SNAPSHOT_ROOT, 'salesforce-steps', 'sfdc-step-relatedlistaction.html'),
  },
  {
    slug: 'salesforce-testing/salesforce-steps/sfdc-step-validate',
    path: join(SNAPSHOT_ROOT, 'salesforce-steps', 'sfdc-step-validate.html'),
  },
  {
    slug: 'salesforce-testing/salesforce-steps',
    path: join(SNAPSHOT_ROOT, 'salesforce-steps.html'),
  },
];

before(async () => {
  ({ preprocessEnHtml } = await import('../lib/turndown.mjs'));
  ({ createEnSourcePatchCoverage, EN_SOURCE_PATCHES } = await import(
    '../lib/en_source_patches.mjs'
  ));
});

// ---------------------------------------------------------------------------
// Acceptance gates #6/#7: patchCoverage invariants against real snapshots
// ---------------------------------------------------------------------------

describe('en_source_patches integration (Bundle 1 real snapshots)', () => {
  it('all 6 target snapshot files exist (sanity)', () => {
    for (const { path } of TARGET_SLUG_SNAPSHOTS) {
      assert.ok(existsSync(path), `missing snapshot: ${path}`);
    }
  });

  it('processing all target slugs produces matchedHits >= 6 and zero mismatches', () => {
    const coverage = createEnSourcePatchCoverage();
    for (const { slug, path } of TARGET_SLUG_SNAPSHOTS) {
      const raw = readFileSync(path, 'utf8');
      preprocessEnHtml(raw, { slug, patchCoverage: coverage });
    }
    const snap = coverage.snapshot();
    // Gate #7: matchedHits >= 6 (each of the 6 target slugs contributes ≥1).
    assert.ok(
      snap.matchedHits >= 6,
      `gate #7 violated: matchedHits=${snap.matchedHits}, expected >= 6. bySlug=${JSON.stringify(snap.bySlug)}`,
    );
    // Gate #6: no mismatches in target slugs. Filter to target slugs in case
    // additional patches are registered for slugs outside the Bundle 1 set.
    const targetSlugSet = new Set(TARGET_SLUG_SNAPSHOTS.map((t) => t.slug));
    const targetMismatches = snap.mismatches.filter((m) => targetSlugSet.has(m.slug));
    assert.equal(
      targetMismatches.length,
      0,
      `gate #6 violated: ${targetMismatches.length} mismatches on target slugs: ${JSON.stringify(targetMismatches)}`,
    );
  });

  it('post-patch HTML no longer contains the registered find string for each target slug', () => {
    // After preprocessEnHtml with slug, none of the registered patches'
    // `find` strings should remain in the HTML (they have been replaced).
    for (const { slug, path } of TARGET_SLUG_SNAPSHOTS) {
      const raw = readFileSync(path, 'utf8');
      const out = preprocessEnHtml(raw, { slug, patchCoverage: createEnSourcePatchCoverage() });
      const applicablePatches = EN_SOURCE_PATCHES.filter((p) => p.slugs.includes(slug));
      for (const patch of applicablePatches) {
        assert.equal(
          out.includes(patch.find),
          false,
          `${slug}: patch ${patch.id} 'find' string still present after preprocessEnHtml`,
        );
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Acceptance gate #10: no `<!-- parity:` comments in Bundle 1 JA markdown
// ---------------------------------------------------------------------------

describe('Bundle 1 JA markdown hygiene', () => {
  it('src/content/docs/salesforce-testing/salesforce-steps/*.md contains zero `<!-- parity:` comments', () => {
    assert.ok(existsSync(JA_BUNDLE_DIR), `bundle directory missing: ${JA_BUNDLE_DIR}`);
    const files = readdirSync(JA_BUNDLE_DIR).filter((f) => f.endsWith('.md'));
    assert.ok(files.length > 0, `no markdown files found in ${JA_BUNDLE_DIR}`);

    const offenders = [];
    for (const name of files) {
      const body = readFileSync(join(JA_BUNDLE_DIR, name), 'utf8');
      if (body.includes('<!-- parity:')) {
        offenders.push(name);
      }
    }
    assert.equal(
      offenders.length,
      0,
      `gate #10 violated: ${offenders.length} file(s) contain '<!-- parity:' comments: ${offenders.join(', ')}`,
    );
  });
});

// ---------------------------------------------------------------------------
// Gap 3 (Testing reviewer round-2): byte-identical regression for non-patched
// slugs. If a future patch's `find` string accidentally broadens or the
// slug-dispatch has a bug, this guard catches silent corruption across the
// 282 clean-page slugs by sampling representatives from diverse categories.
// ---------------------------------------------------------------------------

const NON_PATCHED_SAMPLE_SLUGS = [
  'overview/testim-overview',
  'running-tests/base-url',
  'integrations/grid-management/custom-grid',
  'testops/insights',
  'salesforce-testing/salesforce-testing-overview',
  'advanced-editing/validations/email-validation',
];

describe('preprocessEnHtml byte-identical for non-patched slugs (regression guard for 282-slug invariant)', () => {
  it('sample slugs are not in any patch allow-list', () => {
    for (const slug of NON_PATCHED_SAMPLE_SLUGS) {
      for (const patch of EN_SOURCE_PATCHES) {
        assert.ok(
          !patch.slugs.includes(slug),
          `${slug} should not be patched but is in ${patch.id}`,
        );
      }
    }
  });

  it('preprocessEnHtml output is byte-identical with or without slug for all sample non-patched slugs', () => {
    const verified = [];
    const skipped = [];
    for (const slug of NON_PATCHED_SAMPLE_SLUGS) {
      const filepath = join(SNAPSHOTS_ROOT, `${slug}.html`);
      if (!existsSync(filepath)) {
        // Missing sample snapshot is not a gate failure — the contract is
        // "the sample set we _did_ read is byte-identical", not "all
        // hard-coded filenames must exist".
        skipped.push(slug);
        continue;
      }
      const html = readFileSync(filepath, 'utf8');
      const baseline = preprocessEnHtml(html);
      const withSlug = preprocessEnHtml(html, { slug });
      assert.equal(
        withSlug,
        baseline,
        `byte-identical regression for ${slug}`,
      );
      verified.push(slug);
    }
    assert.ok(
      verified.length >= 1,
      `expected >=1 verified sample, got 0. skipped=${JSON.stringify(skipped)}`,
    );
    if (skipped.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `byte-identical regression guard skipped ${skipped.length} missing sample(s): ${skipped.join(', ')}`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Gap 5 remainder (Testing reviewer round-2): codify gates #12/#13/#14
// — "no new mechanism" invariants for the patch-layer PR.
// ---------------------------------------------------------------------------

describe('gates #12-14: no-new-mechanism invariant', () => {
  it('gate #12: parity_artifact_registry has exactly 2 entries covering 8 slugs', async () => {
    const { ARTIFACT_REGISTRY } = await import(
      '../lib/parity_artifact_registry.mjs'
    );
    assert.equal(
      ARTIFACT_REGISTRY.length,
      2,
      'new artifact registry entries are forbidden by the ONE-purpose principle',
    );
    const totalSlugs = ARTIFACT_REGISTRY.reduce(
      (sum, e) => sum + e.slugs.length,
      0,
    );
    assert.equal(totalSlugs, 8, 'slug count drift in artifact registry');
  });

  it('gate #13: SOURCE_SYNC_EXCLUSIONS has exactly 1 entry', async () => {
    const { SOURCE_SYNC_EXCLUSIONS } = await import(
      '../lib/source_sync_exclusions.mjs'
    );
    assert.equal(
      Object.keys(SOURCE_SYNC_EXCLUSIONS).length,
      1,
      'new source sync exclusions are forbidden',
    );
  });

  it('gate #14: source_parity.mjs barrel does NOT re-export patch-layer symbols (plan §3.2)', async () => {
    const barrel = await import('../lib/source_parity.mjs');
    assert.equal(
      barrel.applyEnSourcePatches,
      undefined,
      'applyEnSourcePatches should not leak through barrel',
    );
    assert.equal(
      barrel.EN_SOURCE_PATCHES,
      undefined,
      'EN_SOURCE_PATCHES should not leak through barrel',
    );
    assert.equal(
      barrel.createEnSourcePatchCoverage,
      undefined,
      'createEnSourcePatchCoverage should not leak through barrel',
    );
  });
});
