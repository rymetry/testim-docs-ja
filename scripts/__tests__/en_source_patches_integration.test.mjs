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

// Target slugs per plan Bundle 1 (UD-001 / UD-002) + Category B (UD-004A/C).
// Each entry lists the slug, its snapshot path, and the minimum number of
// patch hits expected when the snapshot is processed. The hit counts are
// the current upstream reality — they rise if a snapshot gains another
// occurrence of the same defect, so the assertion is `>=` rather than `==`
// to keep the test robust to benign upstream additions.
const TARGET_SLUG_SNAPSHOTS = [
  // --- Bundle 1: UD-001 / UD-002 --------------------------------------------
  {
    slug: 'salesforce-testing/salesforce-steps/sfdc-step-create',
    path: join(SNAPSHOT_ROOT, 'salesforce-steps', 'sfdc-step-create.html'),
    minHits: 1,
  },
  {
    slug: 'salesforce-testing/salesforce-steps/sfdc-step-edit',
    path: join(SNAPSHOT_ROOT, 'salesforce-steps', 'sfdc-step-edit.html'),
    minHits: 1,
  },
  {
    slug: 'salesforce-testing/salesforce-steps/sfdc-step-quickactions',
    path: join(SNAPSHOT_ROOT, 'salesforce-steps', 'sfdc-step-quickactions.html'),
    minHits: 1,
  },
  {
    slug: 'salesforce-testing/salesforce-steps/sfdc-step-relatedlistaction',
    path: join(SNAPSHOT_ROOT, 'salesforce-steps', 'sfdc-step-relatedlistaction.html'),
    minHits: 1,
  },
  {
    slug: 'salesforce-testing/salesforce-steps/sfdc-step-validate',
    path: join(SNAPSHOT_ROOT, 'salesforce-steps', 'sfdc-step-validate.html'),
    minHits: 1,
  },
  {
    slug: 'salesforce-testing/salesforce-steps',
    path: join(SNAPSHOT_ROOT, 'salesforce-steps.html'),
    minHits: 1,
  },
  // --- Category B: UD-004A / UD-004C (PR #338) ------------------------------
  {
    slug: 'running-tests/scheduler',
    path: join(SNAPSHOTS_ROOT, 'running-tests', 'scheduler.html'),
    // UD-004A ×1 (high-speed-mode) + UD-004C ×1 (Slack anchor) = 2
    minHits: 2,
  },
  {
    slug: 'running-tests/scheduler-mobile',
    path: join(SNAPSHOTS_ROOT, 'running-tests', 'scheduler-mobile.html'),
    // UD-004C ×1 (Slack anchor only; no high-speed-mode reference)
    minHits: 1,
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

describe('en_source_patches integration (Bundle 1 + Category B real snapshots)', () => {
  it('all target snapshot files exist (sanity)', () => {
    for (const { path } of TARGET_SLUG_SNAPSHOTS) {
      assert.ok(existsSync(path), `missing snapshot: ${path}`);
    }
  });

  it('processing all target slugs produces the expected per-slug matchedHits with zero mismatches', () => {
    const coverage = createEnSourcePatchCoverage();
    for (const { slug, path } of TARGET_SLUG_SNAPSHOTS) {
      const raw = readFileSync(path, 'utf8');
      preprocessEnHtml(raw, { slug, patchCoverage: coverage });
    }
    const snap = coverage.snapshot();

    // Gate #7 (total): matchedHits >= sum of minHits.
    const expectedTotal = TARGET_SLUG_SNAPSHOTS.reduce((s, t) => s + t.minHits, 0);
    assert.ok(
      snap.matchedHits >= expectedTotal,
      `gate #7 (total) violated: matchedHits=${snap.matchedHits}, expected >= ${expectedTotal}. bySlug=${JSON.stringify(snap.bySlug)}`,
    );

    // Gate #7 (per-slug): each target slug contributes >= its expected minHits.
    // This catches upstream snapshot drift where the `find` literal may have
    // changed shape (fail-open produces matchedHits=0 instead of throwing).
    for (const { slug, minHits } of TARGET_SLUG_SNAPSHOTS) {
      const actual = snap.bySlug[slug] ?? 0;
      assert.ok(
        actual >= minHits,
        `gate #7 (per-slug) violated for ${slug}: bySlug=${actual}, expected >= ${minHits}. Upstream HTML shape may have drifted.`,
      );
    }

    // Gate #6: no mismatches in target slugs. Filter to target slugs in case
    // additional patches are registered for slugs outside the target set.
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
  'integrations/grid-management/tricentis-device-cloud',
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

// ---------------------------------------------------------------------------
// Phase A / Task 2 — stale detection across all 34 patches (slug-driven)
// ---------------------------------------------------------------------------
//
// Preconditions: the Bundle-1 integration block above has already imported
// `preprocessEnHtml`, `createEnSourcePatchCoverage`, and `EN_SOURCE_PATCHES`.
// This block reuses them to run a full registry-wide stale scan.
//
// Non-gating: warnings only. Gate enforcement happens through
// `upstream-recovery-status.json` + sticky PR comment (Phase B).

describe('en_source_patches stale detection (全 34 patch IDs / slug-driven / non-gating)', () => {
  it('enumerates every registered patch ID through byPatchIdStatus even with zero hits', () => {
    const coverage = createEnSourcePatchCoverage();
    const snap = coverage.snapshot();
    for (const patch of EN_SOURCE_PATCHES) {
      const status = snap.byPatchIdStatus[patch.id];
      assert.ok(
        status,
        `byPatchIdStatus must seed every registry entry (missing ${patch.id})`,
      );
      assert.equal(status.matched, false);
      assert.equal(status.hits, 0);
    }
    assert.equal(
      Object.keys(snap.byPatchIdStatus).length,
      EN_SOURCE_PATCHES.length,
      'byPatchIdStatus enumerates exactly the registry size when no hits recorded',
    );
  });

  it('reports patches whose find string is missing from every registered snapshot', () => {
    const coverage = createEnSourcePatchCoverage();
    const uniqueSlugs = new Set(EN_SOURCE_PATCHES.flatMap((p) => [...p.slugs]));
    const sawSnapshot = new Set();
    for (const slug of uniqueSlugs) {
      const snapshotPath = join(SNAPSHOTS_ROOT, `${slug}.html`);
      if (!existsSync(snapshotPath)) continue;
      sawSnapshot.add(slug);
      const raw = readFileSync(snapshotPath, 'utf8');
      preprocessEnHtml(raw, { slug, patchCoverage: coverage });
    }

    const snap = coverage.snapshot();
    const stale = EN_SOURCE_PATCHES
      .filter((p) => !snap.byPatchIdStatus[p.id]?.matched)
      // Only flag as stale when at least one of the patch's slugs had a
      // readable snapshot — otherwise we cannot distinguish stale from
      // 'snapshot-not-fetched-in-this-env'.
      .filter((p) => p.slugs.some((s) => sawSnapshot.has(s)))
      .map((p) => ({ id: p.id, slugs: [...p.slugs], reviewAfter: p.reviewAfter }));

    // Non-gating: warn only. Enforcement is via upstream-recovery-status.json +
    // sticky PR comment (Phase B). Test always passes — do NOT assert length.
    if (stale.length > 0) {
      console.warn(
        `[stale en_source_patches] ${stale.length} of ${EN_SOURCE_PATCHES.length} patches — ` +
          `EN may be fixed upstream:\n${JSON.stringify(stale, null, 2)}\n` +
          'Action: verify JA source-first correctness, remove entry, update upstream-defect-tracker.md',
      );
    }
    // Sanity: the surface of the check grew beyond the original Bundle 1
    // set. Pin the minimum slug coverage so the loop cannot silently
    // regress to the old 8-slug scope.
    assert.ok(
      uniqueSlugs.size >= 30,
      `expected slug-driven scan to cover >=30 unique slugs (got ${uniqueSlugs.size})`,
    );
  });

  it('every registry entry carries a valid reviewAfter (YYYY-MM-DD)', () => {
    const RE = /^\d{4}-\d{2}-\d{2}$/;
    for (const patch of EN_SOURCE_PATCHES) {
      assert.ok(
        typeof patch.reviewAfter === 'string' && RE.test(patch.reviewAfter),
        `patch ${patch.id} must have reviewAfter in YYYY-MM-DD format`,
      );
    }
  });
});

describe('source_sync_exclusions recovery status (Task 2 Phase A / non-gating)', () => {
  it('surfaces stale entries via source-sync-status.json when artifact is present (CI-only)', async () => {
    const sourceSyncStatusPath = join(REPO_ROOT, 'source-sync-status.json');
    if (!existsSync(sourceSyncStatusPath)) {
      // Local dev / PR-triggered CI runs without source-sync-status.json
      // cannot evaluate sync_exclusions recovery — the probe is weekly
      // only. Skip silently rather than fail-close on a local env.
      return;
    }
    const { SOURCE_SYNC_EXCLUSIONS } = await import(
      '../lib/source_sync_exclusions.mjs'
    );
    const status = JSON.parse(readFileSync(sourceSyncStatusPath, 'utf8'));
    const stale = (status.pages ?? []).filter(
      (p) => p.fetchStatus === 'excluded-recovered' && SOURCE_SYNC_EXCLUSIONS[p.slug],
    );
    if (stale.length > 0) {
      console.warn(
        `[stale source_sync_exclusions] ${stale.length} entr(ies) — upstream may be fixed:\n` +
          `${stale.map((s) => `  - ${s.slug}`).join('\n')}\n` +
          'Action: verify EN snapshot manually, then remove registry entry + upstream-defect-tracker archive.',
      );
    }
    // Non-gating: weekly workflow (scheduled-actionable.yml) is primary
    // surfacing channel via sourceSyncHealth managed issue.
  });

  it('every SOURCE_SYNC_EXCLUSIONS entry carries a valid reviewAfter (YYYY-MM-DD) — Task 6 pin', async () => {
    const { SOURCE_SYNC_EXCLUSIONS } = await import(
      '../lib/source_sync_exclusions.mjs'
    );
    const RE = /^\d{4}-\d{2}-\d{2}$/;
    for (const [slug, entry] of Object.entries(SOURCE_SYNC_EXCLUSIONS)) {
      assert.ok(
        typeof entry.reviewAfter === 'string' && RE.test(entry.reviewAfter),
        `exclusion ${slug} must have reviewAfter in YYYY-MM-DD format`,
      );
    }
  });
});
