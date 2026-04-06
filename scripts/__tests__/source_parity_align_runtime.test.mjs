/**
 * End-to-end runtime integration test for the Phase 5 segment-level gate.
 *
 * Verifies that:
 *   1. `source_parity.mjs` re-exports the new alignment surface
 *      (`alignSegments`, `parityDiffsToIssues`, `extractSegmentsFromHtml`,
 *      `extractSegmentsFromMarkdown`).
 *   2. The runtime `checkSourceParity()` actually invokes the new engine
 *      and writes segment-level diffs into `parity-check-status.json` as
 *      shadow-tagged issues (`phase: 'segment-shadow'`).
 *   3. Shadow issues do NOT fail the runtime exit code (Phase 5 is wired
 *      in shadow mode; Phase 6 will promote to primary gate).
 *   4. `summarizeParityResults` reports shadow issues separately under
 *      `shadowIssues` / `shadowFiles` / `shadowIssuesByType`.
 *   5. The alignment + parityDiffsToIssues round trip produces issues
 *      that carry the structured metadata Phase 6 / Phase 7 reports
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

describe('source_parity.mjs facade — Phase 5 surface', () => {
  it('re-exports alignSegments, parityDiffsToIssues, and the segment extractors', () => {
    assert.equal(typeof alignSegments, 'function');
    assert.equal(typeof parityDiffsToIssues, 'function');
    assert.equal(typeof extractSegmentsFromHtml, 'function');
    assert.equal(typeof extractSegmentsFromMarkdown, 'function');
  });
});

// ---------------------------------------------------------------------------
// 2. parityDiffsToIssues — schema + shadow tagging
// ---------------------------------------------------------------------------

describe('parityDiffsToIssues', () => {
  it('tags every issue with phase=segment-shadow', () => {
    const enHtml = '<h2>Setup</h2><p>Configure with <code>--proxy</code>.</p>';
    const jaMd = '## セットアップ\n\nプロキシを設定します。\n';
    const enSegs = extractSegmentsFromHtml(enHtml);
    const jaSegs = extractSegmentsFromMarkdown(jaMd);
    const alignment = alignSegments(enSegs, jaSegs);
    const issues = parityDiffsToIssues(alignment.diffs);
    assert.ok(issues.length > 0, 'expected at least one diff (token-gap on --proxy)');
    for (const issue of issues) {
      assert.equal(issue.phase, 'segment-shadow');
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
    const alignment = alignSegments(enSegs, jaSegs);
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
// 3. summarizeParityResults — shadow accounting
// ---------------------------------------------------------------------------

describe('summarizeParityResults — shadow accounting', () => {
  it('counts shadow issues separately from actionable / signal totals', () => {
    const results = [
      {
        file: 'a.md',
        sourceUrl: '',
        category: '',
        issues: [
          { type: 'segment-missing', severity: 'actionable', phase: 'segment-shadow', detail: 'x' },
          { type: 'segment-extra', severity: 'actionable', phase: 'segment-shadow', detail: 'y' },
          { type: 'paragraph-count-mismatch', severity: 'signal', detail: 'count' },
        ],
      },
      {
        file: 'b.md',
        sourceUrl: '',
        category: '',
        issues: [
          { type: 'segment-token-gap', severity: 'actionable', phase: 'segment-shadow', detail: 'z' },
        ],
      },
    ];
    const summary = summarizeParityResults(results);
    assert.equal(summary.shadowIssues, 3);
    assert.equal(summary.shadowFiles, 2);
    assert.deepEqual(summary.shadowIssuesByType, {
      'segment-missing': 1,
      'segment-extra': 1,
      'segment-token-gap': 1,
    });
    // Shadow issues must NOT be folded into actionable / active.
    assert.equal(summary.actionableFiles, 0);
    assert.equal(summary.activeActionableFiles, 0);
    // The signal-only file b is not in the file count, but file a IS
    // because it has the paragraph-count-mismatch.
    assert.equal(summary.totalIssues, 1, 'only the non-shadow issue is counted in totalIssues');
    assert.equal(summary.issuesByType['paragraph-count-mismatch'], 1);
    assert.equal(summary.issuesByType['segment-missing'] ?? 0, 0);
  });
});

// ---------------------------------------------------------------------------
// 4. End-to-end CLI invocation against a real drifted page
// ---------------------------------------------------------------------------

describe('check_source_parity.mjs --slug — Phase 5 runtime integration', () => {
  it('emits shadow-tagged segment-* issues into parity-check-status.json', () => {
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

      // Shadow accounting populated by summarizeParityResults.
      const summary = data.summary;
      assert.ok(
        (summary.shadowIssues ?? 0) > 0,
        'expected at least one shadow issue on a known-drifted page',
      );
      assert.ok((summary.shadowFiles ?? 0) >= 1);
      assert.ok(summary.shadowIssuesByType);

      // Per-file shadow issues are present in the issues array with
      // phase=segment-shadow and structured metadata.
      const file = data.files.find(
        (f) => f.file === 'src/content/docs/test-management/shared-configuration.md',
      );
      assert.ok(file, 'drifted page must appear in the results');
      const shadowIssues = file.issues.filter((i) => i.phase === 'segment-shadow');
      assert.ok(shadowIssues.length > 0, 'drifted page must have segment-shadow issues');
      const sample = shadowIssues[0];
      assert.ok(
        ['segment-missing', 'segment-extra', 'segment-shifted', 'segment-untranslated', 'segment-token-gap']
          .includes(sample.type),
      );
      assert.equal(sample.severity, 'actionable');
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
});
