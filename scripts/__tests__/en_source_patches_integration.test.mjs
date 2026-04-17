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
const SNAPSHOT_ROOT = join(
  REPO_ROOT,
  'snapshots',
  'en',
  'content',
  'salesforce-testing',
);
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
