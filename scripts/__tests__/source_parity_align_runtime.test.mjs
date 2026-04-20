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
 * ## Pin strategy (T12 / T13 / plan §3.2)
 *
 * Primary pin: `advanced-editing/parameters/hidden-parameters`
 * (2 baseline entries, multi-type: segment-extra / segment-missing;
 * no audit-signal issues, so CLI emits the `⏸️ (covered by baseline/ack)`
 * suffix cleanly — required by the baseline-covered-CLI-output test).
 * Not a Tier A/B immediate target so less likely to churn in M2 Tier B waves.
 * Fallback pin: `administration/encrypted-credentials` (2 baseline entries,
 * multi-type: segment-extra / segment-missing). Administration-scoped and
 * outside Bundle 2/3/4 scope, so less likely to churn during M2 Tier B waves.
 *
 * Pin swap history:
 *   test-management/shared-configuration → editing-tests/generating-a-random-value
 *   → running-tests/configuration-file-run-hooks/predefined-properties-in-config-file-hooks
 *     (swapped 2026-04-17 when P2-2 Wave 1 burned down generating-a-random-value 14→0;
 *     condition (b) of re-pin threshold triggered)
 *   → advanced-editing/validations/add-network-validation
 *     (swapped 2026-04-17 when Tier B Wave 3 Bundle 3 burned down predefined-properties
 *     3→0; condition (b) of re-pin threshold triggered.
 *     New target is validation-scoped, outside Bundle 2/3/4 scope,
 *     multi-type 3 entry baseline with segment-extra / segment-missing / segment-token-gap.)
 *   → advanced-editing/parameters/hidden-parameters
 *     (swapped 2026-04-18 by PR C Stage B5 when pixel-validation-and-pixel-wait-for was
 *     burned down 3→0. Initial re-pin to add-network-validation failed the
 *     baseline-covered-CLI-output test because add-network-validation has an
 *     audit-signal paragraph-count-mismatch that prevents the ⏸️ suffix. Switched
 *     to hidden-parameters which has 2 baseline entries and no audit signals.)
 *   fallback: administration/project-and-user-management → editing-tests/groups
 *     (swapped 2026-04-17 when Tier B Wave 1 burned down project-and-user-management
 *     4→0; condition (b) of re-pin threshold triggered)
 *   fallback: editing-tests/groups → debugging-tests/recording-additional-steps-to-fix-bugs
 *     (swapped 2026-04-17 when PR #328 burned down editing-tests/groups 4→0;
 *     condition (b) of re-pin threshold triggered)
 *   fallback: debugging-tests/recording-additional-steps-to-fix-bugs →
 *     integrations/grid-management/virtual-mobile-grid
 *     (swapped 2026-04-17 when Tier B Wave 2.5 burned down recording-additional-
 *     steps 4→0 via arrow-fusion; condition (b) of re-pin threshold triggered.
 *     新 target は grid-management 配下で Tier A/B 即時計画対象外かつ
 *     multi-type 3 entry を保持)
 *   fallback: integrations/grid-management/virtual-mobile-grid →
 *     administration/encrypted-credentials
 *     (swapped 2026-04-17 when Tier B Wave 3 Bundle 2 burned down virtual-mobile-grid
 *     3→0; condition (b) of re-pin threshold triggered.
 *     New target is administration-scoped, outside Bundle 2/3/4 scope,
 *     multi-type 2 entry baseline.)
 *
 * ## Deferred baseline note: browserstack-integration-copy (2026-04-17)
 *
 * NOTE (2026-04-17): browserstack-integration-copy retains 2 baseline entries
 * (segment-missing + segment-extra on "How to add a LambdaTest grid" section) due to
 * EN <a href="index.htm#adding-a-grid"> self-link producing disjoint tokens between
 * EN and JA. The entries cannot be suppressed by parity_artifact_registry because
 * isArtifactExcluded only runs in the matched-pair token-gap path; here the pair
 * fails to form (scoreSegmentMatch = 0 on disjoint tokens). Resolution deferred to
 * M3 PR Z via Route W §3.2 (en_source_patches new UD entry for href-miswire class,
 * same pattern as UD-002).
 *
 * ## Numeric re-pin threshold (T13 fragility-2 / plan §3.2)
 *
 * 以下の 2 条件のいずれかが真なら fixture 化へ再 swap を検討:
 *   (a) pin 対象 slug の baseline entry 数 drift が ≥ 3 件/週
 *   (b) pin 対象 slug の削除により test fail が 1 回以上発生
 *
 * 条件 (a) の監視: `git log --oneline -- parity-baseline.json` と本 pin の
 * entry 件数を対比。条件 (b) の検知: CI 失敗ログから本 test の pin slug
 * ミスマッチを拾う。どちらも自動化は M4 以降。
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
          '--slug=advanced-editing/parameters/hidden-parameters',
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
        (f) => f.file === 'src/content/docs/advanced-editing/parameters/hidden-parameters.md',
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
          '--slug=advanced-editing/parameters/hidden-parameters',
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
          '⏸️ src/content/docs/advanced-editing/parameters/hidden-parameters.md (covered by baseline/ack)',
        ),
        `stdout did not mark the file as covered by baseline/ack:\n${result.stdout}`,
      );
      assert.ok(
        result.stdout.includes('🧊baseline'),
        `stdout did not annotate baselined issues:\n${result.stdout}`,
      );
      assert.ok(
        !result.stdout.includes('❌ src/content/docs/advanced-editing/parameters/hidden-parameters.md'),
        `stdout still marked the file as blocking:\n${result.stdout}`,
      );
    } finally {
      if (existsSync(STATUS_BACKUP_PATH)) {
        copyFileSync(STATUS_BACKUP_PATH, STATUS_PATH);
        unlinkSync(STATUS_BACKUP_PATH);
      }
    }
  });

  it('writes empty advisory queue metadata for distinct-heading tokenless slug runs (heading-distinctness prior)', () => {
    // §5.3.N mechanism refinement (2026-04-20): `add-network-validation` has
    // adjacent tokenless sections with DISTINCT leaf headings
    // ("Validate all the image requests" vs "Validate a single request"),
    // so the heading-distinctness prior in
    // detectAmbiguousAdjacentTokenlessSwap suppresses the former
    // tokenless-near-tie inconclusive. Advisory queue is empty but the
    // slug-scope metadata (filters, isComplete, totals) still writes
    // correctly — that scope plumbing is what this integration test
    // primarily asserts end-to-end.
    if (existsSync(STATUS_PATH)) copyFileSync(STATUS_PATH, STATUS_BACKUP_PATH);

    try {
      const result = spawnSync(
        process.execPath,
        [
          join(ROOT, 'scripts/check_source_parity.mjs'),
          '--slug=advanced-editing/validations/add-network-validation',
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

      assert.equal(data.summary.advisoryQueueIssues, 0);
      assert.equal(data.summary.advisoryQueueFiles, 0);
      assert.equal(data.summary.advisoryQueueComplete, false);
      assert.equal(data.summary.advisoryQueueScopeType, 'slug');
      assert.deepEqual(data.advisoryQueueScope.filters, {
        slug: 'advanced-editing/validations/add-network-validation',
        section: null,
      });
      assert.equal(data.advisoryQueueScope.isComplete, false);
      assert.equal(data.advisoryQueueScope.checkedFiles, 1);
      assert.ok(data.advisoryQueueScope.totalFiles >= 1);
      assert.deepEqual(data.advisoryQueue, []);
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
          '--slug=advanced-editing/validations/add-network-validation',
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
        result.stdout.includes(
          'partial scope: slug=advanced-editing/validations/add-network-validation',
        ),
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

// ---------------------------------------------------------------------------
// 5. Pin content-correctness + fallback (T12 fragility-1 / plan §3.2)
// ---------------------------------------------------------------------------

describe('pin slug content-correctness + fallback (T12)', () => {
  it('primary pin slug file has extractable segments (fixture non-empty guard)', () => {
    const pinSlug = 'advanced-editing/parameters/hidden-parameters';
    const jaPath = join(ROOT, `src/content/docs/${pinSlug}.md`);
    assert.ok(existsSync(jaPath), `primary pin JA file must exist at ${jaPath}`);
    const content = readFileSync(jaPath, 'utf8');
    const segs = extractSegmentsFromMarkdown(content);
    assert.ok(
      segs.length >= 3,
      `primary pin must yield ≥ 3 segments to guard against empty-fixture drift (actual: ${segs.length})`,
    );
  });

  it('fallback pin slug is still baseline-covered (fixture 2-page pin / fragility fallback)', () => {
    // 1 ページ破綻時に fallback として検証可能な 2nd pin。baseline 上に entry が
    // 存在することを jq で 1 度だけ確認する (実測再評価は T11 側で別途 pin 済)。
    // NOTE: 2026-04-17 に旧 fallback `editing-tests/groups` が PR #328 で burn-down
    //       され 0 entry になったため、より安定した `debugging-tests/recording-
    //       additional-steps-to-fix-bugs` (4 baseline entry / 恒常残留) へ移行。
    // NOTE: 2026-04-17 に `debugging-tests/recording-additional-steps-to-fix-bugs`
    //       も Tier B Wave 2.5 で arrow-fusion burn-down され 0 entry になった
    //       ため、grid-management 配下で Tier A/B 即時計画対象外かつ multi-type
    //       (section-structure-mismatch / segment-extra / segment-token-gap) を
    //       持つ `integrations/grid-management/virtual-mobile-grid` (3 baseline
    //       entry) へ再 pin。
    // NOTE: 2026-04-17 に `integrations/grid-management/virtual-mobile-grid` も
    //       Tier B Wave 3 Bundle 2 (Integrations) で burn-down 対象となり 0
    //       entry になる見込みのため、Bundle 2/3/4 即時計画対象外かつ multi-type
    //       (segment-extra / segment-missing) を持つ
    //       `administration/encrypted-credentials` (2 baseline entry) へ再 pin。
    // NOTE: 2026-04-18 に `administration/encrypted-credentials` が PR F (misc
    //       areas) の token-alignment 修正で 0 entry になったため、EN tokenizer
    //       の `index.htm` 相対リンク処理制限由来で content-level 解決不能 (M3
    //       PR Z 候補) かつ multi-type (segment-extra / segment-missing) を
    //       持つ `editing-tests/groups/auto-grouping` (2 baseline entry) へ再 pin。
    const fallbackSlug = 'editing-tests/groups/auto-grouping';
    const baselinePath = join(ROOT, 'parity-baseline.json');
    const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
    const count = baseline.entries.filter((e) => e.slug === fallbackSlug).length;
    assert.ok(
      count >= 1,
      `fallback pin "${fallbackSlug}" must have ≥ 1 baseline entry (actual: ${count}). ` +
        `もし fallback が解消されたら docstring の再 pin 指針に従って別 slug を選ぶ。`,
    );
  });
});
