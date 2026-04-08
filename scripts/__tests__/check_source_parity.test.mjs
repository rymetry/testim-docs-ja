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

  // Issue #247 PR2 — advisory only / mixed advisory + baseline 表示の契約
  describe('Issue #247 PR2 — advisory-only display path', () => {
    it('advisory-only file (1 structure-mismatch, no baseline/ack) gets "(advisory only)"', () => {
      const state = getConsoleCoverageState([
        { type: 'section-structure-mismatch', severity: 'actionable' },
      ]);
      assert.deepEqual(state, {
        allAcked: false,
        // すべての issue が advisory なので「ack/baseline で覆われている」
        // 状態ではない (allCovered=false) が、icon は ⏸️。
        allCovered: false,
        icon: '⏸️',
        suffix: ' (advisory only)',
      });
    });

    it('multiple advisory-only issues (no baseline/ack) get "(advisory only)"', () => {
      const state = getConsoleCoverageState([
        { type: 'section-structure-mismatch', severity: 'actionable' },
        { type: 'segment-order-mismatch', severity: 'actionable' },
        { type: 'snapshot-incomplete', severity: 'actionable' },
        { type: 'source-unusable', severity: 'actionable' },
      ]);
      assert.equal(state.icon, '⏸️');
      assert.equal(state.suffix, ' (advisory only)');
    });

    it('advisory + baseline mix gets "(advisory + baseline/ack)"', () => {
      // structure-mismatch (advisory) と既存 segment-* drift (baseline で
      // 覆われている) が同居するケース。CLI で「covered by baseline/ack」
      // と書くと advisory が ack/baseline で覆われているように誤読される
      // ので、この mixed state は専用 wording で表示する。
      const state = getConsoleCoverageState([
        { type: 'section-structure-mismatch', severity: 'actionable' },
        { type: 'segment-missing', severity: 'actionable', baselined: true },
      ]);
      assert.deepEqual(state, {
        allAcked: false,
        allCovered: false,
        icon: '⏸️',
        suffix: ' (advisory + baseline/ack)',
      });
    });

    it('advisory + ack mix gets "(advisory + baseline/ack)"', () => {
      const state = getConsoleCoverageState([
        { type: 'segment-order-mismatch', severity: 'actionable' },
        { type: 'segment-missing', severity: 'actionable', acknowledged: true, ackExpired: false },
      ]);
      assert.equal(state.icon, '⏸️');
      assert.equal(state.suffix, ' (advisory + baseline/ack)');
    });

    it('advisory + active reportable issue still blocks (❌)', () => {
      // active な segment-missing が混じっていれば、advisory があっても
      // ファイルはブロッキング扱い。
      const state = getConsoleCoverageState([
        { type: 'section-structure-mismatch', severity: 'actionable' },
        { type: 'segment-missing', severity: 'actionable' },
      ]);
      assert.deepEqual(state, {
        allAcked: false,
        allCovered: false,
        icon: '❌',
        suffix: '',
      });
    });

    it('acked structure-mismatch is treated as ack-covered, not advisory', () => {
      // ack 経路は advisory より優先 (より具体的なカバレッジ情報なので)。
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

    it('baselined structure-mismatch is treated as baseline-covered, not advisory', () => {
      // baseline 経路も advisory より優先。PR1 時点では新 type に baseline
      // は実運用上付かないが、述語の forward compatibility をここで pin。
      const state = getConsoleCoverageState([
        {
          type: 'section-structure-mismatch',
          severity: 'actionable',
          baselined: true,
          baselineExpired: false,
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

  // Issue #247 PR4 — source-unusable 単独 advisory 専用 CLI suffix
  // structure mismatch を含まない source-unusable 単独 advisory ファイルに
  // 対し、CLI で「翻訳者責任外の snapshot debt」であることを明示する
  // `(source unusable)` suffix を出す。advisory に structure mismatch が
  // 1 件でも混ざるなら既存の `(advisory only)` に落ちる。`isAdvisoryOnly
  // ParityIssue` の scope (= structure + source-unusable 両方) は変更
  // しない。
  describe('Issue #247 PR4 — source-unusable 専用 CLI suffix', () => {
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

    it('source-unusable + section-structure-mismatch (advisory mix) → " (advisory only)"', () => {
      // advisory に structure mismatch が含まれているので、CLI 上は
      // structure drift 側を優先する既存の "(advisory only)" に落ちる。
      const state = getConsoleCoverageState([
        { type: 'source-unusable', severity: 'actionable' },
        { type: 'section-structure-mismatch', severity: 'actionable' },
      ]);
      assert.deepEqual(state, {
        allAcked: false,
        allCovered: false,
        icon: '⏸️',
        suffix: ' (advisory only)',
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
      // ack 経路は advisory より優先 (PR2 契約と同じ)。
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
      // baseline 経路も advisory より優先 (PR1 時点では新 type に
      // baseline は付かないが forward compatibility のため pin)。
      const state = getConsoleCoverageState([
        {
          type: 'snapshot-incomplete',
          severity: 'actionable',
          baselined: true,
          baselineExpired: false,
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

describe('Phase 8 PR2 — buildRunScope', () => {
  // Pure helper that maps the (resolvedSlug, section) pair into the
  // runScope object embedded in summary.runScope. The downstream guard in
  // sync-detection-issues.cjs reads this to refuse to sync managed
  // issues from partial runs.

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
// Issue #247 PR3 — usability gate の gate 契約
//
// PR3 では snapshot-incomplete / source-unusable は advisory として集計されるが
// gate exit code を変えない (PR4 cutover の前)。
// これを `computeExitCode` の pure helper で検証する。
// ---------------------------------------------------------------------------

describe('Issue #247 PR3 — gate exit code contract (snapshotUnusable* は gate を変えない)', () => {
  it('snapshotUnusableIssues=1, reportableActiveFiles=0 のとき exit code は 0', () => {
    // PR3 での期待挙動: snapshot-incomplete / source-unusable は
    // isReportableParityIssue=false なので reportableActiveFiles に乗らない。
    // gate は PR4 cutover まで 0 のまま。
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
