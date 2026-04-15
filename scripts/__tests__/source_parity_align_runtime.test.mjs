/**
 * End-to-end runtime integration test for the segment-level gate.
 *
 * Verifies that:
 *   1. `source_parity.mjs` re-exports the new alignment surface
 *      (`alignSegments`, `parityDiffsToIssues`, `extractSegmentsFromHtml`,
 *      `extractSegmentsFromMarkdown`).
 *   2. The runtime `checkSourceParity()` actually invokes the new engine
 *      and writes segment-level diffs into `parity-check-status.json` as
 *      primary-gate issues with baseline metadata when the page is part
 *      of the frozen cutover baseline.
 *   3. Baselined issues do NOT fail the runtime exit code.
 *   4. `summarizeParityResults` reports primary-gate issues in the
 *      actionable totals.
 *   5. The alignment + parityDiffsToIssues round trip produces issues
 *      that carry the structured metadata downstream reports
 *      will rely on (sectionIndex, segmentKind, fingerprints).
 *
 * The test runs `check_source_parity.mjs` end-to-end via `node` against
 * a single representative page (`--slug=test-management/shared-configuration`,
 * which has a small but non-zero baseline drift) and parses the resulting
 * JSON output. This is the closest-to-production verification we can do
 * without spinning up the full corpus.
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, copyFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

let alignSegments;
let parityDiffsToIssues;
let extractSegmentsFromHtml;
let extractSegmentsFromMarkdown;
let summarizeParityResults;

before(async () => {
  ({
    alignSegments,
    parityDiffsToIssues,
    extractSegmentsFromHtml,
    extractSegmentsFromMarkdown,
    summarizeParityResults,
  } = await import('../lib/source_parity.mjs'));
});

const ROOT = join(import.meta.dirname, '../../');
const STATUS_PATH = join(ROOT, 'parity-check-status.json');
const STATUS_BACKUP_PATH = join(ROOT, 'parity-check-status.test-backup.json');

// ---------------------------------------------------------------------------
// 1. Facade re-exports
// ---------------------------------------------------------------------------

describe('source_parity.mjs facade', () => {
  it('re-exports alignSegments, parityDiffsToIssues, and the segment extractors', () => {
    assert.equal(typeof alignSegments, 'function');
    assert.equal(typeof parityDiffsToIssues, 'function');
    assert.equal(typeof extractSegmentsFromHtml, 'function');
    assert.equal(typeof extractSegmentsFromMarkdown, 'function');
  });
});

// ---------------------------------------------------------------------------
// 2. parityDiffsToIssues — schema
// ---------------------------------------------------------------------------

describe('parityDiffsToIssues', () => {
  it('emits primary-gate actionable issues without shadow phase tagging', () => {
    const enHtml = '<h2>Setup</h2><p>Configure with <code>--proxy</code>.</p>';
    const jaMd = '## セットアップ\n\nプロキシを設定します。\n';
    const enSegs = extractSegmentsFromHtml(enHtml);
    const jaSegs = extractSegmentsFromMarkdown(jaMd);
    const alignment = alignSegments(enSegs, jaSegs, { slug: 'test/fixture' });
    const issues = parityDiffsToIssues(alignment.diffs);
    assert.ok(issues.length > 0, 'expected at least one diff (token-gap on --proxy)');
    for (const issue of issues) {
      // shadow phase tagging は廃止され、segment-* issue は primary gate に流れる。
      assert.equal(issue.phase, undefined);
      assert.equal(issue.severity, 'actionable');
      assert.ok(issue.detail.startsWith('['), 'detail must include section label prefix');
      assert.ok(typeof issue.sectionIndex === 'number');
      assert.ok(typeof issue.segmentKind === 'string');
    }
  });

  it('forwards missingTokens on segment-token-gap', () => {
    const enHtml = '<h2>CLI</h2><p>Use <code>--proxy</code> for HTTP proxy.</p>';
    const jaMd = '## CLI\n\nHTTP プロキシを使うときに指定します。\n';
    const enSegs = extractSegmentsFromHtml(enHtml);
    const jaSegs = extractSegmentsFromMarkdown(jaMd);
    const alignment = alignSegments(enSegs, jaSegs, { slug: 'test/fixture' });
    const issues = parityDiffsToIssues(alignment.diffs);
    const tokenGap = issues.find((i) => i.type === 'segment-token-gap');
    assert.ok(tokenGap, 'expected a segment-token-gap diff');
    assert.ok(Array.isArray(tokenGap.missingTokens));
    assert.ok(tokenGap.missingTokens.includes('--proxy'));
  });

  it('returns empty array for empty input and does not throw on null', () => {
    assert.deepEqual(parityDiffsToIssues([]), []);
    assert.deepEqual(parityDiffsToIssues(null), []);
  });
});

// ---------------------------------------------------------------------------
// 3. summarizeParityResults — accounting
// ---------------------------------------------------------------------------

describe('summarizeParityResults', () => {
  it('counts un-baselined segment-* as primary gate actionable', () => {
    // un-baselined segment-* issues は primary gate accounting に流れる。
    const results = [
      {
        file: 'a.md',
        sourceUrl: '',
        category: '',
        issues: [
          { type: 'segment-missing', severity: 'actionable', detail: 'x' },
          { type: 'segment-extra', severity: 'actionable', detail: 'y' },
          { type: 'segment-inconclusive', severity: 'actionable', detail: 'z' },
          { type: 'paragraph-count-mismatch', severity: 'signal', detail: 'count' },
        ],
      },
      {
        file: 'b.md',
        sourceUrl: '',
        category: '',
        issues: [
          { type: 'segment-token-gap', severity: 'actionable', detail: 'w' },
        ],
      },
    ];
    const summary = summarizeParityResults(results);
    // segment-* are now counted in primary totals
    assert.equal(summary.totalIssues, 5);
    assert.equal(summary.issuesByType['segment-missing'], 1);
    assert.equal(summary.issuesByType['segment-extra'], 1);
    assert.equal(summary.issuesByType['segment-inconclusive'], 1);
    assert.equal(summary.issuesByType['segment-token-gap'], 1);
    assert.equal(summary.issuesByType['paragraph-count-mismatch'], 1);
    // Both files have actionable segment issues, so actionableFiles = 2
    assert.equal(summary.actionableFiles, 2);
    // Without baseline, they are also active
    assert.equal(summary.activeActionableFiles, 2);
  });

  it('excludes baseline-tagged segment-* from active counts', () => {
    const results = [
      {
        file: 'a.md',
        sourceUrl: '',
        category: '',
        issues: [
          {
            type: 'segment-missing',
            severity: 'actionable',
            baselined: true,
            detail: 'x',
          },
          {
            type: 'segment-inconclusive',
            severity: 'actionable',
            baselined: true,
            inconclusiveCategory: 'heading-count-mismatch',
            detail: 'z',
          },
        ],
      },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.actionableFiles, 1);
    // baselined issues do not count as active
    assert.equal(summary.activeActionableFiles, 0);
    assert.equal(summary.activeFiles, 0);
    assert.equal(summary.baselinedIssues, 2);
    assert.equal(summary.baselinedFiles, 1);
    assert.deepEqual(summary.baselinedByInconclusiveCategory, {
      'heading-count-mismatch': 1,
    });
  });

});

// ---------------------------------------------------------------------------
// 4. End-to-end CLI invocation against a real drifted page
// ---------------------------------------------------------------------------

describe('check_source_parity.mjs --slug — runtime integration', () => {
  it('emits baseline-tagged segment-* issues into parity-check-status.json', () => {
    // Backup any existing status file so the test does not destroy
    // local CI state. Restored in the `after` step below.
    if (existsSync(STATUS_PATH)) copyFileSync(STATUS_PATH, STATUS_BACKUP_PATH);

    try {
      const result = spawnSync(
        process.execPath,
        [
          join(ROOT, 'scripts/check_source_parity.mjs'),
          '--slug=test-management/shared-configuration',
          '--json',
        ],
        { cwd: ROOT, encoding: 'utf8' },
      );
      assert.equal(
        result.status,
        0,
        `check_source_parity exited ${result.status}. stderr:\n${result.stderr}`,
      );
      assert.ok(existsSync(STATUS_PATH), 'parity-check-status.json must exist');
      const data = JSON.parse(readFileSync(STATUS_PATH, 'utf8'));

      // known drift is frozen via parity-baseline.json so the runtime exit code remains 0.
      const summary = data.summary;
      assert.ok(
        (summary.baselinedIssues ?? 0) > 0,
        'expected at least one baseline-tagged issue on a known-drifted page',
      );
      assert.ok((summary.baselinedFiles ?? 0) >= 1);
      assert.ok(summary.baselinedByType);

      // segment-* issues は primary gate shape のまま baselined: true になる。
      const file = data.files.find(
        (f) => f.file === 'src/content/docs/test-management/shared-configuration.md',
      );
      assert.ok(file, 'drifted page must appear in the results');
      const segmentIssues = file.issues.filter((i) =>
        ['segment-missing', 'segment-extra', 'segment-shifted', 'segment-untranslated', 'segment-token-gap', 'segment-inconclusive']
          .includes(i.type),
      );
      assert.ok(segmentIssues.length > 0, 'drifted page must have segment-* issues');
      for (const issue of segmentIssues) {
        assert.equal(issue.phase, undefined, 'shadow phase tag must be gone');
        assert.equal(issue.severity, 'actionable');
        assert.equal(issue.baselined, true, 'existing drift must be baseline-tagged');
      }
      const sample = segmentIssues[0];
      assert.equal(typeof sample.sectionIndex, 'number');
      assert.equal(typeof sample.segmentKind, 'string');
      assert.ok('enSourceFingerprint' in sample);
      assert.ok('jaSourceFingerprint' in sample);
    } finally {
      if (existsSync(STATUS_BACKUP_PATH)) {
        copyFileSync(STATUS_BACKUP_PATH, STATUS_PATH);
        unlinkSync(STATUS_BACKUP_PATH);
      }
    }
  });

  it('prints baseline-covered files as non-blocking in the CLI output', () => {
    if (existsSync(STATUS_PATH)) copyFileSync(STATUS_PATH, STATUS_BACKUP_PATH);

    try {
      const result = spawnSync(
        process.execPath,
        [
          join(ROOT, 'scripts/check_source_parity.mjs'),
          '--slug=test-management/shared-configuration',
          '--fail-on=actionable',
        ],
        { cwd: ROOT, encoding: 'utf8' },
      );
      assert.equal(
        result.status,
        0,
        `check_source_parity exited ${result.status}. stderr:\n${result.stderr}`,
      );
      // 既存 drift は baseline で覆われているため CLI suffix は covered 扱いになる。
      assert.ok(
        result.stdout.includes(
          '⏸️ src/content/docs/test-management/shared-configuration.md (covered by baseline/ack)',
        ),
        `stdout did not mark the file as covered by baseline/ack:\n${result.stdout}`,
      );
      assert.ok(
        result.stdout.includes('🧊baseline'),
        `stdout did not annotate baselined issues:\n${result.stdout}`,
      );
      assert.ok(
        !result.stdout.includes('❌ src/content/docs/test-management/shared-configuration.md'),
        `stdout still marked the file as blocking:\n${result.stdout}`,
      );
    } finally {
      if (existsSync(STATUS_BACKUP_PATH)) {
        copyFileSync(STATUS_BACKUP_PATH, STATUS_PATH);
        unlinkSync(STATUS_BACKUP_PATH);
      }
    }
  });

  it('writes structured advisory queue metadata for tokenless-near-tie slug runs', () => {
    if (existsSync(STATUS_PATH)) copyFileSync(STATUS_PATH, STATUS_BACKUP_PATH);

    try {
      const result = spawnSync(
        process.execPath,
        [
          join(ROOT, 'scripts/check_source_parity.mjs'),
          '--slug=running-tests/scheduler',
          '--json',
          '--include-advisory',
        ],
        { cwd: ROOT, encoding: 'utf8' },
      );
      assert.equal(
        result.status,
        0,
        `check_source_parity exited ${result.status}. stderr:\n${result.stderr}`,
      );
      const data = JSON.parse(readFileSync(STATUS_PATH, 'utf8'));

      assert.equal(data.summary.advisoryQueueIssues, 1);
      assert.equal(data.summary.advisoryQueueFiles, 1);
      assert.equal(data.summary.advisoryQueueComplete, false);
      assert.equal(data.summary.advisoryQueueScopeType, 'slug');
      assert.deepEqual(data.advisoryQueueScope.filters, {
        slug: 'running-tests/scheduler',
        section: null,
      });
      assert.equal(data.advisoryQueueScope.isComplete, false);
      assert.equal(data.advisoryQueueScope.checkedFiles, 1);
      assert.ok(data.advisoryQueueScope.totalFiles >= 1);

      const entry = data.advisoryQueue.find((item) => item.slug === 'running-tests/scheduler');
      assert.ok(entry, 'expected scheduler page in advisory queue');
      assert.equal(entry.issueCount, 1);
      const issue = entry.issues[0];
      assert.equal(
        issue.queueKey,
        'running-tests/scheduler|segment-inconclusive|category=tokenless-near-tie|pair=Modify your scheduled test suites > Activate or Pause=>Modify your scheduled test suites > Edit',
      );
      assert.equal(
        issue.leftSectionPath,
        'Modify your scheduled test suites > Activate or Pause',
      );
      assert.equal(issue.rightSectionPath, 'Modify your scheduled test suites > Edit');
      assert.equal(typeof issue.currentScore, 'number');
      assert.equal(typeof issue.swapScore, 'number');
      assert.ok(issue.currentScore > 0);
      assert.ok(issue.swapScore > 0);
    } finally {
      if (existsSync(STATUS_BACKUP_PATH)) {
        copyFileSync(STATUS_BACKUP_PATH, STATUS_PATH);
        unlinkSync(STATUS_BACKUP_PATH);
      }
    }
  });

  it('prints advisory queue scope notes for slug-scoped runs', () => {
    if (existsSync(STATUS_PATH)) copyFileSync(STATUS_PATH, STATUS_BACKUP_PATH);

    try {
      const result = spawnSync(
        process.execPath,
        [
          join(ROOT, 'scripts/check_source_parity.mjs'),
          '--slug=running-tests/scheduler',
          '--include-advisory',
          '--fail-on=actionable',
        ],
        { cwd: ROOT, encoding: 'utf8' },
      );
      assert.equal(
        result.status,
        0,
        `check_source_parity exited ${result.status}. stderr:\n${result.stderr}`,
      );
      assert.ok(
        result.stdout.includes('partial scope: slug=running-tests/scheduler'),
        `stdout did not describe partial advisory queue scope:\n${result.stdout}`,
      );
      assert.ok(
        result.stdout.includes(
          'partial queue only; use a full-repo run before workflow automation or queue-wide triage',
        ),
        `stdout did not warn about partial advisory queue scope:\n${result.stdout}`,
      );
    } finally {
      if (existsSync(STATUS_BACKUP_PATH)) {
        copyFileSync(STATUS_BACKUP_PATH, STATUS_PATH);
        unlinkSync(STATUS_BACKUP_PATH);
      }
    }
  });
});
