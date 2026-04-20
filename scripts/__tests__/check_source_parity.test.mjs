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
let computeParityResult;
let buildRunScope;
let PARITY_CHECK_STATUS_SCHEMA_VERSION;

before(async () => {
  ({
    parseArgs,
    collectSnapshotSlugs,
    isValidAcknowledgedIssue,
    isNonBlockingIssue,
    getConsoleCoverageState,
    computeExitCode,
    computeParityResult,
    buildRunScope,
    PARITY_CHECK_STATUS_SCHEMA_VERSION,
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

  it('parses --include-audit-signals', () => {
    const args = parseArgs(['--include-audit-signals']);
    assert.equal(args.includeAuditSignals, true);
  });

  it('returns false includeAuditSignals when not specified', () => {
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

  it('treats baselined issues and valid acknowledgements as non-blocking', () => {
    assert.equal(isNonBlockingIssue({ baselined: true }), true);
    assert.equal(isNonBlockingIssue({ acknowledged: true, ackExpired: false }), true);
    // v2: baseline expiry is gone — baselined:true always freezes the issue.
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

  describe('coverage state with structure mismatch', () => {
    it('active structure-mismatch 単独 (no baseline/ack) → icon ❌, suffix ""', () => {
      const state = getConsoleCoverageState([
        { type: 'section-structure-mismatch', severity: 'actionable' },
      ]);
      assert.deepEqual(state, {
        allAcked: false,
        allCovered: false,
        icon: '❌',
        suffix: '',
      });
    });

    it('structure-mismatch × 2 + source-unusable × 2 mix → icon ❌ (structure は reportable)', () => {
      const state = getConsoleCoverageState([
        { type: 'section-structure-mismatch', severity: 'actionable' },
        { type: 'segment-order-mismatch', severity: 'actionable' },
        { type: 'snapshot-incomplete', severity: 'actionable' },
        { type: 'source-unusable', severity: 'actionable' },
      ]);
      assert.equal(state.icon, '❌');
      assert.equal(state.suffix, '');
    });

    it('source-unusable advisory + active segment-missing → icon ❌', () => {
      const state = getConsoleCoverageState([
        { type: 'source-unusable', severity: 'actionable' },
        { type: 'segment-missing', severity: 'actionable' },
      ]);
      assert.deepEqual(state, {
        allAcked: false,
        allCovered: false,
        icon: '❌',
        suffix: '',
      });
    });

    it('baselined structure-mismatch + active segment-missing → icon ❌', () => {
      const state = getConsoleCoverageState([
        {
          type: 'section-structure-mismatch',
          severity: 'actionable',
          baselined: true,
        },
        { type: 'segment-missing', severity: 'actionable' },
      ]);
      assert.deepEqual(state, {
        allAcked: false,
        allCovered: false,
        icon: '❌',
        suffix: '',
      });
    });

    it('baselined structure-mismatch 単独 → icon ⏸️, suffix " (covered by baseline/ack)"', () => {
      const state = getConsoleCoverageState([
        {
          type: 'section-structure-mismatch',
          severity: 'actionable',
          baselined: true,
        },
      ]);
      assert.deepEqual(state, {
        allAcked: false,
        allCovered: true,
        icon: '⏸️',
        suffix: ' (covered by baseline/ack)',
      });
    });

    it('acked structure-mismatch 単独 → icon ⏸️, suffix " (all acknowledged)"', () => {
      const state = getConsoleCoverageState([
        {
          type: 'section-structure-mismatch',
          severity: 'actionable',
          acknowledged: true,
          ackExpired: false,
        },
      ]);
      assert.deepEqual(state, {
        allAcked: true,
        allCovered: true,
        icon: '⏸️',
        suffix: ' (all acknowledged)',
      });
    });

    it('baselined structure-mismatch + source-unusable advisory → icon ⏸️, suffix " (advisory + baseline/ack)"', () => {
      const state = getConsoleCoverageState([
        {
          type: 'section-structure-mismatch',
          severity: 'actionable',
          baselined: true,
        },
        { type: 'source-unusable', severity: 'actionable' },
      ]);
      assert.deepEqual(state, {
        allAcked: false,
        allCovered: false,
        icon: '⏸️',
        suffix: ' (advisory + baseline/ack)',
      });
    });

    it('structure-mismatch + source-unusable both baselined → icon ⏸️, suffix " (covered by baseline/ack)"', () => {
      const state = getConsoleCoverageState([
        {
          type: 'section-structure-mismatch',
          severity: 'actionable',
          baselined: true,
        },
        {
          type: 'source-unusable',
          severity: 'actionable',
          baselined: true,
        },
      ]);
      assert.deepEqual(state, {
        allAcked: false,
        allCovered: true,
        icon: '⏸️',
        suffix: ' (covered by baseline/ack)',
      });
    });
  });

  describe('source-unusable 専用 CLI suffix', () => {
    it('source-unusable 単独 (advisory) → icon ⏸️, suffix " (source unusable)"', () => {
      const state = getConsoleCoverageState([
        { type: 'source-unusable', severity: 'actionable' },
      ]);
      assert.deepEqual(state, {
        allAcked: false,
        allCovered: false,
        icon: '⏸️',
        suffix: ' (source unusable)',
      });
    });

    it('snapshot-incomplete 単独 (advisory) → icon ⏸️, suffix " (source unusable)"', () => {
      const state = getConsoleCoverageState([
        { type: 'snapshot-incomplete', severity: 'actionable' },
      ]);
      assert.deepEqual(state, {
        allAcked: false,
        allCovered: false,
        icon: '⏸️',
        suffix: ' (source unusable)',
      });
    });

    it('snapshot-incomplete + source-unusable (両方 source-unusable 系) → " (source unusable)"', () => {
      const state = getConsoleCoverageState([
        { type: 'snapshot-incomplete', severity: 'actionable' },
        { type: 'source-unusable', severity: 'actionable' },
      ]);
      assert.deepEqual(state, {
        allAcked: false,
        allCovered: false,
        icon: '⏸️',
        suffix: ' (source unusable)',
      });
    });

    it('source-unusable + active section-structure-mismatch → icon ❌', () => {
      const state = getConsoleCoverageState([
        { type: 'source-unusable', severity: 'actionable' },
        { type: 'section-structure-mismatch', severity: 'actionable' },
      ]);
      assert.deepEqual(state, {
        allAcked: false,
        allCovered: false,
        icon: '❌',
        suffix: '',
      });
    });

    it('source-unusable + frozen baseline (segment-missing, baselined) → " (advisory + baseline/ack)"', () => {
      const state = getConsoleCoverageState([
        { type: 'source-unusable', severity: 'actionable' },
        { type: 'segment-missing', severity: 'actionable', baselined: true },
      ]);
      assert.deepEqual(state, {
        allAcked: false,
        allCovered: false,
        icon: '⏸️',
        suffix: ' (advisory + baseline/ack)',
      });
    });

    it('source-unusable + valid ack (segment-missing, acked) → " (advisory + baseline/ack)"', () => {
      const state = getConsoleCoverageState([
        { type: 'source-unusable', severity: 'actionable' },
        {
          type: 'segment-missing',
          severity: 'actionable',
          acknowledged: true,
          ackExpired: false,
        },
      ]);
      assert.deepEqual(state, {
        allAcked: false,
        allCovered: false,
        icon: '⏸️',
        suffix: ' (advisory + baseline/ack)',
      });
    });

    it('acked source-unusable 単独 → " (all acknowledged)"', () => {
      // ack 経路は advisory より優先。
      const state = getConsoleCoverageState([
        {
          type: 'source-unusable',
          severity: 'actionable',
          acknowledged: true,
          ackExpired: false,
        },
      ]);
      assert.deepEqual(state, {
        allAcked: true,
        allCovered: true,
        icon: '⏸️',
        suffix: ' (all acknowledged)',
      });
    });

    it('baselined snapshot-incomplete 単独 → " (covered by baseline/ack)"', () => {
      // baseline 経路も advisory より優先。
      // (schema v2 では baselineExpired/baselineReviewAfter は emit されないので
      //  fixture にも付けない — `baselined: true` のみが gate state を駆動する)
      const state = getConsoleCoverageState([
        {
          type: 'snapshot-incomplete',
          severity: 'actionable',
          baselined: true,
        },
      ]);
      assert.deepEqual(state, {
        allAcked: false,
        allCovered: true,
        icon: '⏸️',
        suffix: ' (covered by baseline/ack)',
      });
    });
  });
});

// ---------------------------------------------------------------------------
// computeExitCode uses reportableActive* counters
// ---------------------------------------------------------------------------

describe('computeExitCode (gate uses reportableActive counters)', () => {
  // gate exit-code logic を pure helper で検証する。

  it('failOn=actionable returns 0 when no reportable actionable + no error', () => {
    const summary = {
      reportableActiveActionableFiles: 0,
      activeErrorFiles: 0,
      // legacy field: helper はここを読まない
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
      activeFiles: 5,
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
    // coarse signal は activeFiles に出ても gate には載らない。
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

  it('returns 0 for coarse-only with expired ack', () => {
    const summary = {
      reportableActiveFiles: 0,
      reportableActiveActionableFiles: 0,
      auditSignalFiles: 1,
      auditSignalIssues: 1,
      activeFiles: 1,
      activeActionableFiles: 0,
      activeErrorFiles: 0,
      expiredAcknowledgements: 1,
    };
    assert.equal(computeExitCode(summary, 'actionable'), 0);
    assert.equal(computeExitCode(summary, 'any'), 0);
    assert.equal(computeExitCode(summary, null), 0);
  });

  it('returns 0 for coarse-only baselined run (baselined:true freezes the audit signal)', () => {
    const summary = {
      reportableActiveFiles: 0,
      reportableActiveActionableFiles: 0,
      auditSignalFiles: 1,
      auditSignalIssues: 1,
      activeFiles: 1,
      activeActionableFiles: 0,
      activeErrorFiles: 0,
      baselinedIssues: 1,
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
// runScope on parity-check-status summary
// ---------------------------------------------------------------------------

describe('§1 cleanup — schema version constant', () => {
  it('exports PARITY_CHECK_STATUS_SCHEMA_VERSION === 1', () => {
    assert.equal(PARITY_CHECK_STATUS_SCHEMA_VERSION, 1);
  });
});

describe('§1 cleanup — computeParityResult', () => {
  it('returns "pass" when freshness is fresh and counters are clean', () => {
    const summary = { reportableActiveFiles: 0, activeErrorFiles: 0 };
    assert.equal(computeParityResult(summary, 'fresh'), 'pass');
  });

  it('returns "fail" when reportableActiveFiles > 0 even with fresh source', () => {
    const summary = { reportableActiveFiles: 1, activeErrorFiles: 0 };
    assert.equal(computeParityResult(summary, 'fresh'), 'fail');
  });

  it('returns "fail" on error files even with fresh source', () => {
    const summary = { reportableActiveFiles: 0, activeErrorFiles: 1 };
    assert.equal(computeParityResult(summary, 'fresh'), 'fail');
  });

  it('returns "inconclusive" when freshness is partial and counters are clean', () => {
    const summary = { reportableActiveFiles: 0, activeErrorFiles: 0 };
    assert.equal(computeParityResult(summary, 'partial'), 'inconclusive');
  });

  it('returns "fail" on stale source with reportable issues (signal preserved)', () => {
    const summary = { reportableActiveFiles: 1, activeErrorFiles: 0 };
    assert.equal(computeParityResult(summary, 'stale'), 'fail');
  });

  it('returns "inconclusive" on broken source with clean counters', () => {
    assert.equal(
      computeParityResult({ reportableActiveFiles: 0, activeErrorFiles: 0 }, 'broken'),
      'inconclusive',
    );
  });

  it('returns "pass" with clean counters and unknown freshness (legacy / no source-sync)', () => {
    // Legacy / pre-§1 runs that have no source-sync-status.json must
    // not be retroactively forced into "inconclusive". computeParityResult
    // treats null freshnessState as "no info, do not block".
    const summary = { reportableActiveFiles: 0, activeErrorFiles: 0 };
    assert.equal(computeParityResult(summary, null), 'pass');
  });

  it('returns "inconclusive" for null summary (defensive)', () => {
    assert.equal(computeParityResult(null, 'fresh'), 'inconclusive');
  });
});

describe('buildRunScope', () => {
  // (resolvedSlug, section) を summary.runScope へ写す pure helper。

  it('returns full scope when neither slug nor section is set', () => {
    assert.deepEqual(buildRunScope({ slug: null, section: null }), {
      type: 'full',
      isComplete: true,
      filters: { slug: null, section: null },
    });
  });

  it('returns slug scope when --slug is set', () => {
    assert.deepEqual(
      buildRunScope({ slug: 'overview/testim-overview', section: null }),
      {
        type: 'slug',
        isComplete: false,
        filters: { slug: 'overview/testim-overview', section: null },
      },
    );
  });

  it('returns section scope when --section is set', () => {
    assert.deepEqual(
      buildRunScope({ slug: null, section: 'Overview' }),
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
      slug: 'overview/testim-overview',
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

// ---------------------------------------------------------------------------
// usability gate の gate 契約
//
// snapshot-incomplete / source-unusable は advisory として集計されるが、
// gate exit code は変えない。
// これを `computeExitCode` の pure helper で検証する。
// ---------------------------------------------------------------------------

describe('gate exit code contract (snapshotUnusable* は gate を変えない)', () => {
  it('snapshotUnusableIssues=1, reportableActiveFiles=0 のとき exit code は 0', () => {
    // snapshot-incomplete / source-unusable は reportableActiveFiles に乗らない。
    const summary = {
      reportableActiveFiles: 0,
      reportableActiveActionableFiles: 0,
      activeErrorFiles: 0,
      snapshotUnusableIssues: 1,
      snapshotUnusableFiles: 1,
      snapshotUnusableByType: { 'snapshot-incomplete': 1 },
    };
    assert.equal(computeExitCode(summary, null), 0, 'default failOn');
    assert.equal(computeExitCode(summary, 'actionable'), 0, 'failOn=actionable');
    assert.equal(computeExitCode(summary, 'any'), 0, 'failOn=any');
  });

  it('snapshotUnusableFiles=2 (両方とも unusable) で reportableActiveFiles=0 のとき exit code は 0', () => {
    const summary = {
      reportableActiveFiles: 0,
      reportableActiveActionableFiles: 0,
      activeErrorFiles: 0,
      snapshotUnusableIssues: 2,
      snapshotUnusableFiles: 2,
      snapshotUnusableByType: { 'snapshot-incomplete': 1, 'source-unusable': 1 },
    };
    assert.equal(computeExitCode(summary, null), 0);
    assert.equal(computeExitCode(summary, 'actionable'), 0);
    assert.equal(computeExitCode(summary, 'any'), 0);
  });

  it('snapshotUnusableFiles があっても reportableActiveFiles > 0 なら exit code は 1', () => {
    // 他の reportable issue が存在する場合は gate を変えない
    const summary = {
      reportableActiveFiles: 1,
      reportableActiveActionableFiles: 1,
      activeErrorFiles: 0,
      snapshotUnusableIssues: 1,
      snapshotUnusableFiles: 1,
    };
    assert.equal(computeExitCode(summary, null), 1);
  });
});

// ---------------------------------------------------------------------------
// Phase 4: parity-check-status.json の debug.artifactCoverage 出力契約
//
// alignSegments の slug-scope artifact 抑止 hit は runtime aggregator で
// 集計され、status.debug.artifactCoverage に snapshot として emit される。
// ---------------------------------------------------------------------------

describe('parity-check-status.json — debug.artifactCoverage emit (Phase 4)', () => {
  it('status.debug.artifactCoverage has runtime aggregate shape', async () => {
    const { default: main } = await import('../check_source_parity.mjs');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-artifact-'));
    const outputPath = path.join(tmp, 'parity-check-status.json');
    try {
      await main({ outputPath });
      const status = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      const ac = status.debug?.artifactCoverage;
      assert.ok(ac, 'debug.artifactCoverage should exist');
      assert.equal(typeof ac.registryEntries, 'number');
      assert.equal(typeof ac.matchedHits, 'number');
      assert.ok(typeof ac.bySlug === 'object' && ac.bySlug !== null);
      assert.ok(typeof ac.byToken === 'object' && ac.byToken !== null);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// v2 cutover: debug.baselineSchemaVersion must be 2
// ---------------------------------------------------------------------------

describe('parity-check-status.json — debug.baselineSchemaVersion is 2 (v2 cutover)', () => {
  it('status.debug.baselineSchemaVersion === 2 when baseline is loaded', async () => {
    const { default: main } = await import('../check_source_parity.mjs');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-baseline-schema-'));
    const outputPath = path.join(tmp, 'parity-check-status.json');
    try {
      await main({ outputPath });
      const status = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      assert.equal(
        status.debug?.baselineSchemaVersion,
        2,
        'debug.baselineSchemaVersion must reflect v2 after cutover',
      );
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
