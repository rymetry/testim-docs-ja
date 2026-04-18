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

  it('applies UD-004A on legacy high-speed-mode href for scheduler', () => {
    const html =
      '<p>If you are on a pro plan, you are also able to set the scheduler to run in ' +
      '<a href="https://help.testim.io/docs/high-speed-mode">Turbo mode</a>.</p>';
    const cov = createEnSourcePatchCoverage();
    const out = applyEnSourcePatches(html, 'running-tests/scheduler', cov);
    assert.ok(out.includes('<a href="../testops/turbo-mode.htm">Turbo mode</a>'));
    assert.equal(out.includes('help.testim.io/docs/high-speed-mode'), false);
    const s = cov.snapshot();
    assert.equal(s.byPatchId['UD-004A-scheduler-high-speed-mode'], 1);
  });

  it('applies UD-004C on legacy Slack-integration anchor for scheduler AND scheduler-mobile', () => {
    const html =
      '<p>For details, see ' +
      '<a href="https://help.testim.io/v2.0/docs/scheduler#integrating-scheduler-with-slack">below</a>.</p>';
    for (const slug of ['running-tests/scheduler', 'running-tests/scheduler-mobile']) {
      const cov = createEnSourcePatchCoverage();
      const out = applyEnSourcePatches(html, slug, cov);
      assert.ok(
        out.includes(
          '<a href="scheduler.htm#integrating-scheduler-with-slack">below</a>',
        ),
        `slug ${slug} patch did not apply`,
      );
      assert.equal(out.includes('help.testim.io/v2.0'), false);
      assert.equal(
        cov.snapshot().byPatchId['UD-004C-scheduler-slack-integration-anchor'],
        1,
      );
    }
  });

  it('applies BOTH UD-004A and UD-004C when scheduler HTML contains both defects', () => {
    const html =
      '<p>See ' +
      '<a href="https://help.testim.io/v2.0/docs/scheduler#integrating-scheduler-with-slack">below</a>.</p>\n' +
      '<p>Run in ' +
      '<a href="https://help.testim.io/docs/high-speed-mode">Turbo mode</a>.</p>';
    const cov = createEnSourcePatchCoverage();
    const out = applyEnSourcePatches(html, 'running-tests/scheduler', cov);
    assert.ok(out.includes('scheduler.htm#integrating-scheduler-with-slack'));
    assert.ok(out.includes('../testops/turbo-mode.htm'));
    assert.equal(out.includes('help.testim.io'), false);
    const s = cov.snapshot();
    assert.equal(s.byPatchId['UD-004A-scheduler-high-speed-mode'], 1);
    assert.equal(s.byPatchId['UD-004C-scheduler-slack-integration-anchor'], 1);
    assert.equal(s.bySlug['running-tests/scheduler'], 2);
    assert.equal(s.mismatches.length, 0);
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

// ---------------------------------------------------------------------------
// T-2: slug uniqueness (order-independence structural guarantee)
// ---------------------------------------------------------------------------

describe('en_source_patches order-independence invariants', () => {
  // Multiple patches MAY share a slug (e.g. UD-004A + UD-004C both target
  // running-tests/scheduler) as long as their find strings do not interfere.
  //
  // Order-independence is enforced by TWO complementary layers:
  //   (1) structural substring checks (find-in-find, find-in-replace) —
  //       catches the common classes of collision quickly without running
  //       patches;
  //   (2) a permutation-commutativity test that applies every ordering of
  //       same-slug patches to a synthetic input containing all finds, and
  //       asserts all orderings produce the same output (catches partial-
  //       overlap corner cases like find1="abc" + find2="bcd" on "abcd",
  //       which the substring checks alone would let pass — see v4 plan
  //       §2.4 "permutation compare" requirement).
  it('for any shared slug, no patch find is a substring of another patch find (same slug)', () => {
    const slugToPatches = {};
    for (const patch of EN_SOURCE_PATCHES) {
      for (const s of patch.slugs) {
        if (!slugToPatches[s]) slugToPatches[s] = [];
        slugToPatches[s].push(patch);
      }
    }
    for (const [slug, patches] of Object.entries(slugToPatches)) {
      if (patches.length < 2) continue;
      for (const a of patches) {
        for (const b of patches) {
          if (a === b) continue;
          assert.ok(
            !a.find.includes(b.find),
            `slug ${slug}: patch ${a.id}.find contains patch ${b.id}.find — breaks order-independence`,
          );
        }
      }
    }
  });

  it('for any shared slug, no patch find is a substring of another patch replace (same slug)', () => {
    // If A.find ⊂ B.replace, applying B first could re-introduce A.find and
    // break idempotency / order-independence. Guard against that regression.
    const slugToPatches = {};
    for (const patch of EN_SOURCE_PATCHES) {
      for (const s of patch.slugs) {
        if (!slugToPatches[s]) slugToPatches[s] = [];
        slugToPatches[s].push(patch);
      }
    }
    for (const [slug, patches] of Object.entries(slugToPatches)) {
      if (patches.length < 2) continue;
      for (const a of patches) {
        for (const b of patches) {
          if (a === b) continue;
          assert.ok(
            !b.replace.includes(a.find),
            `slug ${slug}: patch ${b.id}.replace contains patch ${a.id}.find — breaks order-independence`,
          );
        }
      }
    }
  });

  // Permutation-commutativity: the ultimate order-independence check. For
  // each slug covered by ≥ 2 patches, build a synthetic input that embeds
  // every `find` (plus adjacent variants covering overlapping / adjacent /
  // separated placement), then apply patches in every permutation order
  // and assert all orderings produce byte-identical output. This catches
  // partial-overlap collisions (e.g. f1="abc" + f2="bcd" on "abcd") that
  // the substring checks alone would let pass — closing Codex review gap
  // for PR #338 (plan v4 §2.4 "permutation compare" requirement).
  it('for any shared slug, every permutation of same-slug patches yields the same output (permutation-commutativity)', () => {
    const slugToPatches = {};
    for (const patch of EN_SOURCE_PATCHES) {
      for (const s of patch.slugs) {
        if (!slugToPatches[s]) slugToPatches[s] = [];
        slugToPatches[s].push(patch);
      }
    }

    // Apply a permutation of patches in order (literal split/join each).
    function applyPermutation(input, patchOrder) {
      let out = input;
      for (const p of patchOrder) {
        out = out.split(p.find).join(p.replace);
      }
      return out;
    }

    // Generate all permutations of an array (small N — worst case 24 at N=4).
    function permutations(arr) {
      if (arr.length <= 1) return [arr.slice()];
      const result = [];
      for (let i = 0; i < arr.length; i += 1) {
        const rest = arr.slice(0, i).concat(arr.slice(i + 1));
        for (const sub of permutations(rest)) {
          result.push([arr[i], ...sub]);
        }
      }
      return result;
    }

    // Build test inputs exercising different placement patterns AND
    // overlap-boundary cases. The overlap-boundary inputs are critical —
    // they catch partial-overlap collisions like f1='abc' + f2='bcd' on
    // 'abcd', which simple concatenation/separation inputs do NOT expose
    // (see self-verification meta-test at the bottom of this suite).
    //
    // For every ordered pair (f1, f2) of distinct finds, enumerate all
    // overlap lengths k where f1's suffix of length k equals f2's prefix
    // of length k, and emit `prefix + (f1 concatenated to f2 via overlap
    // k) + suffix`. This exhaustively constructs every input shape in
    // which applying-then-replacing f1 could destroy or expose an f2
    // match position (and vice versa for all orderings).
    function buildSyntheticInputs(finds) {
      const sep1 = ' ';
      const sep2 = '</p>\n<p>';
      const inputs = new Set([
        finds.join(''),
        finds.join(sep1),
        finds.join(sep2),
        finds.slice().reverse().join(sep1),
        finds.concat(finds).join(sep1),
      ]);

      // Enumerate suffix(f1) ∩ prefix(f2) overlap merges for every pair.
      for (let i = 0; i < finds.length; i += 1) {
        for (let j = 0; j < finds.length; j += 1) {
          if (i === j) continue;
          const f1 = finds[i];
          const f2 = finds[j];
          const maxK = Math.min(f1.length, f2.length) - 1;
          for (let k = 1; k <= maxK; k += 1) {
            if (f1.slice(-k) === f2.slice(0, k)) {
              // Merged input: f1 + f2[k:] contains f1 (positions [0, f1.len))
              // and f2 (positions [f1.len - k, f1.len - k + f2.len)).
              const merged = f1 + f2.slice(k);
              inputs.add(`prefix ${merged} suffix`);
              inputs.add(merged); // also bare, no prefix/suffix
            }
          }
        }
      }
      return Array.from(inputs);
    }

    for (const [slug, patches] of Object.entries(slugToPatches)) {
      if (patches.length < 2) continue;
      const finds = patches.map((p) => p.find);
      const inputs = buildSyntheticInputs(finds);
      const perms = permutations(patches);
      for (const input of inputs) {
        const reference = applyPermutation(input, perms[0]);
        for (let i = 1; i < perms.length; i += 1) {
          const candidate = applyPermutation(input, perms[i]);
          assert.equal(
            candidate,
            reference,
            `slug ${slug}: permutation ${perms[i].map((p) => p.id).join(',')} ` +
              `differs from ${perms[0].map((p) => p.id).join(',')} on input[${inputs.indexOf(input)}]`,
          );
        }
      }
    }
  });

  // Meta-test: prove the permutation check has teeth by constructing a
  // deliberately-colliding fake patch pair and confirming (a) the
  // synthetic-input generator actually produces the overlap-boundary
  // input that exposes order-dependence, (b) applying permutations to
  // that input yields different outputs, and (c) the cheap substring
  // checks pass for this pair — so permutation-commutativity is the
  // load-bearing invariant that adds real value.
  it('permutation check detects the classic abc+bcd partial-overlap collision (self-verification)', () => {
    const fakeA = { id: 'FAKE-A', find: 'abc', replace: 'X' };
    const fakeB = { id: 'FAKE-B', find: 'bcd', replace: 'Y' };

    // (c) Both substring checks — find-in-find and find-in-replace —
    // MUST pass for this pair. Otherwise the cheap checks would already
    // catch it and permutation-commutativity would be redundant.
    assert.ok(!fakeA.find.includes(fakeB.find), 'abc does not contain bcd');
    assert.ok(!fakeB.find.includes(fakeA.find), 'bcd does not contain abc');
    assert.ok(!fakeA.replace.includes(fakeB.find), 'X does not contain bcd');
    assert.ok(!fakeB.replace.includes(fakeA.find), 'Y does not contain abc');

    // (a) Reconstruct the same generator logic used above to prove the
    // overlap-boundary case `abcd` IS produced. If this diverges from
    // the generator, update both to keep them in lockstep.
    const finds = [fakeA.find, fakeB.find];
    const overlapCandidates = [];
    for (let i = 0; i < finds.length; i += 1) {
      for (let j = 0; j < finds.length; j += 1) {
        if (i === j) continue;
        const f1 = finds[i];
        const f2 = finds[j];
        const maxK = Math.min(f1.length, f2.length) - 1;
        for (let k = 1; k <= maxK; k += 1) {
          if (f1.slice(-k) === f2.slice(0, k)) {
            overlapCandidates.push(f1 + f2.slice(k));
          }
        }
      }
    }
    assert.ok(
      overlapCandidates.includes('abcd'),
      `generator must produce 'abcd' for abc+bcd overlap; got ${JSON.stringify(overlapCandidates)}`,
    );

    // (b) On the overlap-boundary input, AB and BA permutations diverge.
    const input = 'prefix abcd suffix';
    const orderAB = input.split(fakeA.find).join(fakeA.replace)
                        .split(fakeB.find).join(fakeB.replace);
    const orderBA = input.split(fakeB.find).join(fakeB.replace)
                        .split(fakeA.find).join(fakeA.replace);
    assert.notEqual(
      orderAB,
      orderBA,
      'meta-test sanity: abc+bcd should be order-dependent on abcd — if these agree, the permutation check is vacuous',
    );
  });
});

// ---------------------------------------------------------------------------
// T-4: multi-occurrence find behavior
// ---------------------------------------------------------------------------

describe('applyEnSourcePatches (multi-occurrence find)', () => {
  it('replaces every occurrence of find when multiple hits exist on a single slug', () => {
    // Craft a multi-occurrence HTML using the UD-001A pattern; registry
    // entries normally produce a single hit per slug, but the applier
    // semantics must handle N occurrences correctly via split/join.
    const html =
      '<ul>\n' +
      '  <li><p>Verify -this action verifies thing A</p></li>\n' +
      '  <li><p>Verify -this action verifies thing B</p></li>\n' +
      '</ul>';
    const coverage = createEnSourcePatchCoverage();
    const out = applyEnSourcePatches(
      html,
      'salesforce-testing/salesforce-steps/sfdc-step-create',
      coverage,
    );
    const snap = coverage.snapshot();

    // Every occurrence of the original typo replaced.
    assert.equal((out.match(/- this action verifies/g) ?? []).length, 2);
    assert.equal((out.match(/-this action verifies/g) ?? []).length, 0);

    // Coverage semantics: `recordHit` records the literal occurrence count
    // (split().length - 1), so a 2-hit apply yields matchedHits = 2.
    assert.equal(snap.matchedHits, 2, 'matchedHits should equal total find occurrences');
    assert.equal(
      snap.byPatchId['UD-001A-dash-this-typo-plain'],
      2,
      'byPatchId should reflect 2 occurrences',
    );
    assert.equal(snap.mismatches.length, 0);
  });

  it('records a single hit entry per apply() even when multiple occurrences match', () => {
    // byPatchId counts occurrences, but the aggregator treats each apply()
    // call as a single recordHit entry (internal hits array, collapsed in
    // snapshot()). Verify that invariant by checking bySlug accumulation.
    const html = '<p>Verify -this action verifies A</p><p>Verify -this action verifies B</p>';
    const coverage = createEnSourcePatchCoverage();
    applyEnSourcePatches(
      html,
      'salesforce-testing/salesforce-steps/sfdc-step-create',
      coverage,
    );
    const snap = coverage.snapshot();
    assert.equal(snap.bySlug['salesforce-testing/salesforce-steps/sfdc-step-create'], 2);
  });
});

// ---------------------------------------------------------------------------
// B3: console.warn side-effect on find-not-found
// ---------------------------------------------------------------------------

describe('applyEnSourcePatches (console.warn on find-not-found)', () => {
  // Helper: capture console.warn calls produced during fn().
  function captureWarnings(fn) {
    const captured = [];
    const original = console.warn;
    console.warn = (...args) => {
      captured.push(args.join(' '));
    };
    try {
      fn();
    } finally {
      console.warn = original;
    }
    return captured;
  }

  it('emits exactly one console.warn per find-not-found mismatch', () => {
    const html = '<p>completely unrelated HTML</p>';
    const cov = createEnSourcePatchCoverage();
    const warnings = captureWarnings(() => {
      applyEnSourcePatches(
        html,
        'salesforce-testing/salesforce-steps/sfdc-step-create',
        cov,
      );
    });
    // One registered patch for this slug (UD-001A), not found → 1 warning.
    assert.equal(warnings.length, 1, `expected 1 warning, got ${warnings.length}: ${warnings.join(' | ')}`);
    const line = warnings[0];
    assert.ok(line.includes('find-not-found'), `warning missing find-not-found: ${line}`);
    assert.ok(line.includes('patch=UD-001A-dash-this-typo-plain'), `warning missing patchId: ${line}`);
    assert.ok(line.includes('slug=salesforce-testing/salesforce-steps/sfdc-step-create'), `warning missing slug: ${line}`);
    // Coverage must still record the mismatch (warning is additive, not a replacement).
    assert.equal(cov.snapshot().mismatches.length, 1);
  });

  it('does NOT emit console.warn when find is present and replacement occurs', () => {
    const html = '<p>Verify -this action verifies x</p>';
    const warnings = captureWarnings(() => {
      applyEnSourcePatches(
        html,
        'salesforce-testing/salesforce-steps/sfdc-step-create',
        createEnSourcePatchCoverage(),
      );
    });
    assert.equal(warnings.length, 0, `unexpected warnings on a successful apply: ${warnings.join(' | ')}`);
  });

  it('does NOT emit console.warn for slugs that have no registered patch', () => {
    const html = '<p>Verify -this action verifies x</p>';
    const warnings = captureWarnings(() => {
      applyEnSourcePatches(html, 'totally/unregistered/slug', createEnSourcePatchCoverage());
    });
    assert.equal(warnings.length, 0);
  });
});
