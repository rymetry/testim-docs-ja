import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let parseArgs;
let collectSnapshotSlugs;
let isValidAcknowledgedIssue;
let isNonBlockingIssue;
let getConsoleCoverageState;
let computeExitCode;
let buildRunScope;

before(async () => {
  ({
    parseArgs,
    collectSnapshotSlugs,
    isValidAcknowledgedIssue,
    isNonBlockingIssue,
    getConsoleCoverageState,
    computeExitCode,
    buildRunScope,
  } = await import('../check_source_parity.mjs'));
});

describe('parseArgs', () => {
  it('parses --fail-on=actionable', () => {
    const args = parseArgs(['--fail-on=actionable']);
    assert.equal(args.failOn, 'actionable');
  });

  it('parses --fail-on=any', () => {
    const args = parseArgs(['--fail-on=any']);
    assert.equal(args.failOn, 'any');
  });

  it('returns null failOn when not specified', () => {
    const args = parseArgs(['--json']);
    assert.equal(args.failOn, null);
  });

  it('parses --section and --json together with --fail-on', () => {
    const args = parseArgs(['--section=Overview', '--json', '--fail-on=actionable']);
    assert.equal(args.section, 'Overview');
    assert.equal(args.json, true);
    assert.equal(args.failOn, 'actionable');
  });

  it('parses --slug=testim-overview', () => {
    const args = parseArgs(['--slug=testim-overview']);
    assert.equal(args.slug, 'testim-overview');
  });

  it('returns null slug when not specified', () => {
    const args = parseArgs(['--json']);
    assert.equal(args.slug, null);
  });

  it('parses --include-advisory', () => {
    const args = parseArgs(['--include-advisory']);
    assert.equal(args.includeAdvisory, true);
  });

  it('returns false includeAdvisory when not specified', () => {
    const args = parseArgs(['--json']);
    assert.equal(args.includeAdvisory, false);
  });

  it('parses --include-audit-signals (Phase 8)', () => {
    const args = parseArgs(['--include-audit-signals']);
    assert.equal(args.includeAuditSignals, true);
  });

  it('returns false includeAuditSignals when not specified (Phase 8)', () => {
    const args = parseArgs(['--json']);
    assert.equal(args.includeAuditSignals, false);
  });

  it('parses --include-audit-signals together with --include-advisory', () => {
    const args = parseArgs(['--include-advisory', '--include-audit-signals']);
    assert.equal(args.includeAdvisory, true);
    assert.equal(args.includeAuditSignals, true);
  });
});

describe('collectSnapshotSlugs', () => {
  it('returns empty set for non-existent directory', () => {
    const result = collectSnapshotSlugs('/nonexistent/path');
    assert.equal(result.size, 0);
  });

  it('collects slugs from nested HTML files', () => {
    const tmpDir = path.join(os.tmpdir(), `test-snapshots-${Date.now()}`);
    const subDir = path.join(tmpDir, 'overview');
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(path.join(subDir, 'testim-overview.html'), '<div>test</div>');
    fs.writeFileSync(path.join(subDir, 'changelog.html'), '<div>test</div>');

    try {
      const result = collectSnapshotSlugs(tmpDir);
      assert.equal(result.size, 2);
      assert.ok(result.has('overview/testim-overview'));
      assert.ok(result.has('overview/changelog'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  it('ignores non-HTML files', () => {
    const tmpDir = path.join(os.tmpdir(), `test-snapshots-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'readme.md'), '# test');
    fs.writeFileSync(path.join(tmpDir, 'test.html'), '<div>test</div>');

    try {
      const result = collectSnapshotSlugs(tmpDir);
      assert.equal(result.size, 1);
      assert.ok(result.has('test'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });
});

describe('CLI coverage helpers', () => {
  it('treats only unexpired acknowledgements as valid acknowledgements', () => {
    assert.equal(isValidAcknowledgedIssue({ acknowledged: true, ackExpired: false }), true);
    assert.equal(isValidAcknowledgedIssue({ acknowledged: true, ackExpired: true }), false);
    assert.equal(isValidAcknowledgedIssue({ acknowledged: false, ackExpired: false }), false);
  });

  it('treats non-expired baselines and valid acknowledgements as non-blocking', () => {
    assert.equal(isNonBlockingIssue({ baselined: true }), true);
    assert.equal(isNonBlockingIssue({ acknowledged: true, ackExpired: false }), true);
    // Phase 7: expired baselines re-enter the gate and are blocking
    assert.equal(isNonBlockingIssue({ baselined: true, baselineExpired: true }), false);
    assert.equal(isNonBlockingIssue({ acknowledged: true, ackExpired: true }), false);
    assert.equal(isNonBlockingIssue({ severity: 'actionable' }), false);
  });

  it('reports all-acknowledged files with the acknowledged suffix', () => {
    const state = getConsoleCoverageState([
      { acknowledged: true, ackExpired: false },
      { acknowledged: true, ackExpired: false },
    ]);
    assert.deepEqual(state, {
      allAcked: true,
      allCovered: true,
      icon: '⏸️',
      suffix: ' (all acknowledged)',
    });
  });

  it('reports baseline plus acknowledgement mix as covered by baseline/ack', () => {
    const state = getConsoleCoverageState([
      { baselined: true },
      { acknowledged: true, ackExpired: false },
    ]);
    assert.deepEqual(state, {
      allAcked: false,
      allCovered: true,
      icon: '⏸️',
      suffix: ' (covered by baseline/ack)',
    });
  });

  it('treats expired baselines as blocking for console coverage (Phase 7)', () => {
    // Phase 7: expired baselines re-enter the gate, so the console icon
    // should be ❌ to match the parity regression gate behavior.
    const state = getConsoleCoverageState([{ baselined: true, baselineExpired: true }]);
    assert.deepEqual(state, {
      allAcked: false,
      allCovered: false,
      icon: '❌',
      suffix: '',
    });
  });

  it('keeps expired acknowledgements and active issues blocking', () => {
    const expiredAck = getConsoleCoverageState([{ acknowledged: true, ackExpired: true }]);
    assert.deepEqual(expiredAck, {
      allAcked: false,
      allCovered: false,
      icon: '❌',
      suffix: '',
    });

    const mixed = getConsoleCoverageState([
      { baselined: true },
      { severity: 'actionable' },
    ]);
    assert.deepEqual(mixed, {
      allAcked: false,
      allCovered: false,
      icon: '❌',
      suffix: '',
    });
  });
});

// ---------------------------------------------------------------------------
// Phase 8: computeExitCode uses reportableActive* counters
// ---------------------------------------------------------------------------

describe('Phase 8 — computeExitCode (gate uses reportableActive counters)', () => {
  // Pure helper extracted in Phase 8 PR1 commit 5 so the gate exit-code
  // logic can be unit-tested without spinning up the full
  // checkSourceParity pipeline. The legacy activeFiles fields are kept
  // alongside the new reportableActive* fields to make sure the helper
  // really is reading the new ones.

  it('failOn=actionable returns 0 when no reportable actionable + no error', () => {
    const summary = {
      reportableActiveActionableFiles: 0,
      activeErrorFiles: 0,
      // legacy: should be IGNORED by Phase 8 helper even though set
      activeActionableFiles: 5,
      activeFiles: 5,
    };
    assert.equal(computeExitCode(summary, 'actionable'), 0);
  });

  it('failOn=actionable returns 1 when reportableActiveActionableFiles > 0', () => {
    const summary = {
      reportableActiveActionableFiles: 1,
      activeErrorFiles: 0,
      reportableActiveFiles: 1,
      activeActionableFiles: 1,
      activeFiles: 1,
    };
    assert.equal(computeExitCode(summary, 'actionable'), 1);
  });

  it('failOn=actionable returns 1 on error files even with no reportable issues', () => {
    const summary = {
      reportableActiveActionableFiles: 0,
      activeErrorFiles: 1,
      reportableActiveFiles: 0,
      activeFiles: 1,
    };
    assert.equal(computeExitCode(summary, 'actionable'), 1);
  });

  it('failOn=any returns 0 when reportableActiveFiles is 0', () => {
    const summary = {
      reportableActiveFiles: 0,
      activeFiles: 5, // legacy: must be ignored
    };
    assert.equal(computeExitCode(summary, 'any'), 0);
  });

  it('failOn=any returns 1 when reportableActiveFiles > 0', () => {
    const summary = {
      reportableActiveFiles: 2,
      activeFiles: 2,
    };
    assert.equal(computeExitCode(summary, 'any'), 1);
  });

  it('failOn=any returns 1 on error-only summary', () => {
    const summary = {
      reportableActiveFiles: 0,
      activeErrorFiles: 1,
      activeFiles: 1,
    };
    assert.equal(computeExitCode(summary, 'any'), 1);
  });

  it('default failOn (null) returns 0 for coarse-only summary', () => {
    // Coarse-only: legacy activeFiles is 1 because the file has an
    // unacknowledged signal, but reportableActiveFiles is 0 because the
    // signal is in COARSE_SIGNAL_TYPES. Phase 8 must return exit 0 here.
    const summary = {
      reportableActiveFiles: 0,
      auditSignalFiles: 1,
      activeFiles: 1,
    };
    assert.equal(computeExitCode(summary, null), 0);
  });

  it('default failOn (null) returns 1 when reportableActiveFiles > 0', () => {
    const summary = {
      reportableActiveFiles: 1,
      activeFiles: 1,
    };
    assert.equal(computeExitCode(summary, null), 1);
  });

  it('default failOn (null) returns 1 on error-only summary', () => {
    const summary = {
      reportableActiveFiles: 0,
      activeErrorFiles: 1,
      activeFiles: 1,
    };
    assert.equal(computeExitCode(summary, null), 1);
  });

  it('returns 0 for coarse-only with expired ack (Phase 8 audit only)', () => {
    // The summary that summarizeParityResults() would emit for a file
    // with a single expired-ack coarse signal:
    const summary = {
      reportableActiveFiles: 0,
      reportableActiveActionableFiles: 0,
      auditSignalFiles: 1,
      auditSignalIssues: 1,
      activeFiles: 1, // legacy
      activeActionableFiles: 0,
      activeErrorFiles: 0,
      expiredAcknowledgements: 1,
    };
    assert.equal(computeExitCode(summary, 'actionable'), 0);
    assert.equal(computeExitCode(summary, 'any'), 0);
    assert.equal(computeExitCode(summary, null), 0);
  });

  it('returns 0 for coarse-only with expired baseline (Phase 8 audit only)', () => {
    const summary = {
      reportableActiveFiles: 0,
      reportableActiveActionableFiles: 0,
      auditSignalFiles: 1,
      auditSignalIssues: 1,
      activeFiles: 1, // legacy: includes the expired-baseline coarse
      activeActionableFiles: 0,
      activeErrorFiles: 0,
      expiredBaselineEntries: 1,
    };
    assert.equal(computeExitCode(summary, 'actionable'), 0);
    assert.equal(computeExitCode(summary, 'any'), 0);
    assert.equal(computeExitCode(summary, null), 0);
  });

  it('returns 1 for actionable-only file even when there are also coarse signals', () => {
    const summary = {
      reportableActiveFiles: 1,
      reportableActiveActionableFiles: 1,
      auditSignalFiles: 1,
      activeFiles: 1,
      activeActionableFiles: 1,
      activeErrorFiles: 0,
    };
    assert.equal(computeExitCode(summary, 'actionable'), 1);
    assert.equal(computeExitCode(summary, 'any'), 1);
  });

  it('handles missing fields by defaulting to 0', () => {
    assert.equal(computeExitCode({}, 'actionable'), 0);
    assert.equal(computeExitCode({}, 'any'), 0);
    assert.equal(computeExitCode({}, null), 0);
  });
});

// ---------------------------------------------------------------------------
// Phase 8 PR2: runScope on parity-check-status summary
// ---------------------------------------------------------------------------

describe('Phase 8 PR2 — buildRunScope', () => {
  // Pure helper that maps the (resolvedSlug, section) pair into the
  // runScope object embedded in summary.runScope. The downstream guard in
  // sync-detection-issues.cjs reads this to refuse to sync managed
  // issues from partial runs.

  it('returns full scope when neither slug nor section is set', () => {
    assert.deepEqual(buildRunScope({ resolvedSlug: null, section: null }), {
      type: 'full',
      isComplete: true,
      filters: { slug: null, section: null },
    });
  });

  it('returns slug scope when --slug is set', () => {
    assert.deepEqual(
      buildRunScope({ resolvedSlug: 'overview/testim-overview', section: null }),
      {
        type: 'slug',
        isComplete: false,
        filters: { slug: 'overview/testim-overview', section: null },
      },
    );
  });

  it('returns section scope when --section is set', () => {
    assert.deepEqual(
      buildRunScope({ resolvedSlug: null, section: 'Overview' }),
      {
        type: 'section',
        isComplete: false,
        filters: { slug: null, section: 'Overview' },
      },
    );
  });

  it('prefers slug when both slug and section are set (defensive)', () => {
    // --slug already wins in checkSourceParity (the section filter is
    // skipped when resolvedSlug is set), so the runScope should record
    // the actual scope (slug) and surface the section filter as
    // diagnostic only. Either way, isComplete stays false.
    const result = buildRunScope({
      resolvedSlug: 'overview/testim-overview',
      section: 'Overview',
    });
    assert.equal(result.type, 'slug');
    assert.equal(result.isComplete, false);
    assert.equal(result.filters.slug, 'overview/testim-overview');
  });

  it('uses null filter values when arguments are undefined', () => {
    assert.deepEqual(buildRunScope({}), {
      type: 'full',
      isComplete: true,
      filters: { slug: null, section: null },
    });
  });
});
