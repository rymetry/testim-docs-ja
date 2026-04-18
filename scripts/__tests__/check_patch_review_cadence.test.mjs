// scripts/__tests__/check_patch_review_cadence.test.mjs
/**
 * Unit tests for the patch review cadence monitor (B2 reviewer gate follow-up).
 *
 * Covers:
 *   - overdue detection (nowMs > reviewAfter)
 *   - future-date no-op (nowMs <= reviewAfter)
 *   - invalid date handling (missing / non-parseable)
 *   - warning formatter shape
 *   - main() exit code is always 0 (monitoring, not gate)
 *
 * Plan: docs/superpowers/plans/2026-04-17-en-source-patches-layer.md §B2
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let evaluatePatchReview;
let collectOverduePatches;
let formatWarning;
let main;

before(async () => {
  ({
    evaluatePatchReview,
    collectOverduePatches,
    formatWarning,
    main,
  } = await import('../check_patch_review_cadence.mjs'));
});

// ---------------------------------------------------------------------------
// evaluatePatchReview
// ---------------------------------------------------------------------------

describe('evaluatePatchReview', () => {
  it('flags an overdue patch and computes daysOverdue floor', () => {
    const patch = { reviewAfter: '2026-04-10' };
    // 2026-04-17 UTC midnight = 2026-04-17T00:00:00Z
    const nowMs = new Date('2026-04-17T00:00:00Z').getTime();
    const result = evaluatePatchReview(patch, nowMs);
    assert.equal(result.overdue, true);
    assert.equal(result.daysOverdue, 7);
    assert.equal(result.invalid, false);
  });

  it('does not flag a patch whose reviewAfter is in the future', () => {
    const patch = { reviewAfter: '2026-10-17' };
    const nowMs = new Date('2026-04-17T00:00:00Z').getTime();
    const result = evaluatePatchReview(patch, nowMs);
    assert.equal(result.overdue, false);
    assert.equal(result.daysOverdue, 0);
    assert.equal(result.invalid, false);
  });

  it('treats "today" as not-yet-overdue (inclusive boundary)', () => {
    const nowMs = new Date('2026-04-17T00:00:00Z').getTime();
    const patch = { reviewAfter: '2026-04-17' };
    const result = evaluatePatchReview(patch, nowMs);
    assert.equal(result.overdue, false);
  });

  it('returns invalid=true for missing reviewAfter', () => {
    assert.equal(evaluatePatchReview({}, Date.now()).invalid, true);
    assert.equal(evaluatePatchReview({ reviewAfter: '' }, Date.now()).invalid, true);
    assert.equal(evaluatePatchReview(null, Date.now()).invalid, true);
  });

  it('returns invalid=true for non-parseable reviewAfter', () => {
    const result = evaluatePatchReview({ reviewAfter: 'not-a-date' }, Date.now());
    assert.equal(result.invalid, true);
    assert.equal(result.overdue, false);
  });
});

// ---------------------------------------------------------------------------
// collectOverduePatches
// ---------------------------------------------------------------------------

describe('collectOverduePatches', () => {
  const FIXTURE_REGISTRY = Object.freeze([
    Object.freeze({ id: 'A-future', reviewAfter: '2027-01-01' }),
    Object.freeze({ id: 'B-past', reviewAfter: '2020-01-01' }),
    Object.freeze({ id: 'C-past', reviewAfter: '2025-06-01' }),
    Object.freeze({ id: 'D-invalid', reviewAfter: 'whatever' }),
  ]);

  it('returns only the overdue entries', () => {
    const nowMs = new Date('2026-04-17T00:00:00Z').getTime();
    const overdue = collectOverduePatches(FIXTURE_REGISTRY, nowMs);
    const ids = overdue.map((e) => e.id).sort();
    assert.deepEqual(ids, ['B-past', 'C-past']);
  });

  it('returns empty array when all entries are future-dated', () => {
    const nowMs = new Date('2020-01-01T00:00:00Z').getTime();
    const overdue = collectOverduePatches(FIXTURE_REGISTRY, nowMs);
    assert.equal(overdue.length, 0);
  });

  it('the actual EN_SOURCE_PATCHES registry is currently not-yet-overdue', async () => {
    const { EN_SOURCE_PATCHES } = await import('../lib/en_source_patches.mjs');
    // The current registry was added 2026-04-17 with reviewAfter 2026-10-17.
    const nowMs = new Date('2026-04-17T00:00:00Z').getTime();
    const overdue = collectOverduePatches(EN_SOURCE_PATCHES, nowMs);
    assert.equal(overdue.length, 0, `unexpected overdue entries today: ${overdue.map((e) => e.id).join(', ')}`);
  });
});

// ---------------------------------------------------------------------------
// formatWarning
// ---------------------------------------------------------------------------

describe('formatWarning', () => {
  it('includes patch id, reviewAfter, and daysOverdue', () => {
    const line = formatWarning({ id: 'UD-XXX', reviewAfter: '2020-01-01', daysOverdue: 42 });
    assert.ok(line.includes('UD-XXX'), `missing patch id: ${line}`);
    assert.ok(line.includes('2020-01-01'), `missing reviewAfter: ${line}`);
    assert.ok(line.includes('daysOverdue=42'), `missing daysOverdue: ${line}`);
    assert.ok(line.startsWith('[en_source_patches]'), `missing prefix: ${line}`);
  });
});

// ---------------------------------------------------------------------------
// main()
// ---------------------------------------------------------------------------

describe('main()', () => {
  it('exits 0 with "no overdue" stdout when registry is clean', () => {
    const stdoutLines = [];
    const stderrLines = [];
    const registry = [Object.freeze({ id: 'ok', reviewAfter: '2099-01-01' })];
    const result = main({
      registry,
      nowMs: new Date('2026-04-17T00:00:00Z').getTime(),
      stdout: (msg) => stdoutLines.push(msg),
      stderr: (msg) => stderrLines.push(msg),
    });
    assert.equal(result.exitCode, 0);
    assert.equal(result.overdueCount, 0);
    assert.equal(stderrLines.length, 0);
    assert.equal(stdoutLines.length, 1);
    assert.ok(stdoutLines[0].includes('0 overdue'));
  });

  it('still exits 0 when overdue entries exist (warning only, never a gate)', () => {
    const stdoutLines = [];
    const stderrLines = [];
    const registry = [
      Object.freeze({ id: 'overdue-1', reviewAfter: '2020-01-01' }),
      Object.freeze({ id: 'ok-1', reviewAfter: '2099-01-01' }),
    ];
    const result = main({
      registry,
      nowMs: new Date('2026-04-17T00:00:00Z').getTime(),
      stdout: (msg) => stdoutLines.push(msg),
      stderr: (msg) => stderrLines.push(msg),
    });
    assert.equal(result.exitCode, 0);
    assert.equal(result.overdueCount, 1);
    assert.equal(stderrLines.length, 1);
    assert.ok(stderrLines[0].includes('overdue-1'));
  });
});
