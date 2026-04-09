/**
 * Issue #247 post-merge — representative full-run summary contract test。
 *
 * 代表 8 ページに対して `checkSourceParity({ slug, baselinePath, outputPath })`
 * を in-process で順次呼び、temp status file から summary counter を
 * pin する。Phase D/E/F/G の post-resolution state を固定する fixture。
 *
 * 8 ページ全て RESOLVED_PAGES で baseline 0 件 clean green 完了:
 *
 *   | slug                                               | 解消手段                                         |
 *   | -------------------------------------------------- | ------------------------------------------------ |
 *   | advanced-editing/custom-action-step-mobile         | Phase E: JA を EN plain-text 構造に揃える        |
 *   | results/test-runs                                  | Phase E: preface extra paragraph 削除            |
 *   | salesforce-testing/faq                             | Phase F.2.5 + normalizeUrlToken bug fix          |
 *   | running-tests/the-command-line-cli                 | Phase D.1: 14 section を EN 構造に full rewrite  |
 *   | results/test-results/network-logs                  | Phase D.2: Filtering / test level の JA rewrite  |
 *   | advanced-editing/validations/email-validation      | Phase D.3: preface / Codeless Option / token 差別化 |
 *   | salesforce-testing/salesforce-testing-overview     | Phase G: shallow EN に合わせて JA trim           |
 *   | testops/testops-version-control/pull-requests      | Phase G: broken EN snapshot を手動で正しい HTML 化 |
 *
 * pin する契約:
 *   1. 全 slug で `reportableActiveFiles === 0`
 *   2. 全 slug で `structureMismatchIssues === 0` / `snapshotUnusableIssues === 0`
 *   3. 全 slug で `baselinedByType === {}` (完全に clean、End-to-End 解消)
 *
 * Finding 15: repo-global な `parity-check-status.json` を奪い合わない
 * ために、checkSourceParity の `outputPath` 注入 hook を使い、slug ごとに
 * temp dir 上の別 status file へ書き出す。repo root は一切触らない。
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let checkSourceParity;

before(async () => {
  ({ checkSourceParity } = await import('../check_source_parity.mjs'));
});

// Finding 15: slug ごとに別の temp status file を使う。repo root の
// parity-check-status.json は一切 touch しない。
const TMP_DIR = mkdtempSync(join(tmpdir(), 'parity-representative-'));

function statusPathForSlug(slug) {
  return join(TMP_DIR, `${slug.replaceAll('/', '__')}.status.json`);
}

after(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
});

async function runForSlug(slug) {
  const statusPath = statusPathForSlug(slug);
  const exitCode = await checkSourceParity({
    slug,
    json: true,
    outputPath: statusPath,
  });
  if (!existsSync(statusPath)) {
    throw new Error(
      `checkSourceParity({ slug: ${JSON.stringify(slug)} }) が status file を書かなかった`,
    );
  }
  return {
    exitCode,
    status: JSON.parse(readFileSync(statusPath, 'utf8')),
  };
}

// ---------------------------------------------------------------------------
// 共通契約 — 全ページで 0 が期待される counter
// ---------------------------------------------------------------------------
const COMMON_ZERO_COUNTERS = Object.freeze({
  reportableActiveFiles: 0,
  structureMismatchIssues: 0,
  snapshotUnusableIssues: 0,
  reportableActiveActionableFiles: 0,
});

// ---------------------------------------------------------------------------
// RESOLVED_PAGES — Issue #247 End-to-End 完全解消後、全 8 代表ページが
// baseline entry 0 で clean green に到達。
//
// 解消プロセス:
// - `custom-action-step-mobile` / `test-runs`: Phase E の JA 修正で解消
// - `faq`: Phase F.2.5 preprocessor 修正 + normalizeUrlToken basename fallback
// - `the-command-line-cli`: Phase D.1 JA 全面 rewrite (Basic CLI command /
//   Additional common parameters / Project / Grid Name / Host / Report File /
//   Test Config / Params File / Config file / Dedicated Run Tunnel / Disable
//   timeout retry / Abort CLI run / Chrome extra args / intersect-with flag /
//   Sealights labId — 14 section を EN の block sequence に合わせる)
// - `network-logs`: Phase D.2 JA 2 section rewrite (Filtering request results
//   の EN 分割構造に合わせる + Viewing the network logs at the test level の
//   `:::note` callout → plain paragraph 変換)
// - `email-validation`: Phase D.3 (preface callout link 追加 + Codeless Option
//   list item splitting + date (送信時刻) table cell 翻訳 + sign-up / links
//   body 例の `messages[0].subject` / `DOMParser` token 差別化)
// - `salesforce-testing-overview`: EN 本文が `<h1>` + 1 paragraph のみで
//   source が shallow なため、JA も同構造に trim
// - `pull-requests`: EN source が `<code>` ブロックで全文 wrap されていた
//   ため、正しい HTML snapshot を手動で書き起こし (Reviewing a Pull Request
//   section の nested list を flatten して JA と構造一致)
// ---------------------------------------------------------------------------
const RESOLVED_PAGES = Object.freeze([
  'advanced-editing/custom-action-step-mobile',
  'results/test-runs',
  'salesforce-testing/faq',
  'running-tests/the-command-line-cli',
  'results/test-results/network-logs',
  'advanced-editing/validations/email-validation',
  'salesforce-testing/salesforce-testing-overview',
  'testops/testops-version-control/pull-requests',
]);

// Issue #247 End-to-End 完全解消後、RESIDUAL_PAGES は空。
const RESIDUAL_PAGES = Object.freeze([]);

// ---------------------------------------------------------------------------
// slug ごとに describe を分け、before() で 1 度だけ checkSourceParity を呼ぶ。
// 同一 describe 内の 2 it() で結果を使い回す (in-process 呼び出し回数を半減)。
// ---------------------------------------------------------------------------

for (const slug of RESOLVED_PAGES) {
  describe(`source_parity_representative_summary (resolved): ${slug}`, () => {
    let cached = null;
    before(async () => {
      cached = await runForSlug(slug);
    });

    it('gate exit code が 0 かつ reportable/structure/unusable counter が 0', () => {
      const { exitCode, status } = cached;
      const s = status.summary;
      assert.equal(exitCode, 0, `${slug}: exitCode drift (pin=0, actual=${exitCode})`);
      for (const [key, expected] of Object.entries(COMMON_ZERO_COUNTERS)) {
        assert.equal(
          s[key] || 0,
          expected,
          `${slug}: summary.${key} drift (pin=${expected}, actual=${s[key] || 0})`,
        );
      }
    });

    it('post-resolution: baseline entry が 0 件 (clean 状態)', () => {
      const byType = cached.status.summary.baselinedByType || {};
      assert.equal(
        Object.keys(byType).length,
        0,
        `${slug}: baselinedByType should be empty after Phase E. actual=${JSON.stringify(byType)}`,
      );
    });
  });
}

for (const pin of RESIDUAL_PAGES) {
  describe(`source_parity_representative_summary (residual): ${pin.slug}`, () => {
    let cached = null;
    before(async () => {
      cached = await runForSlug(pin.slug);
    });

    it('gate exit code が 0 かつ reportable/structure/unusable counter が 0', () => {
      const { exitCode, status } = cached;
      const s = status.summary;
      assert.equal(
        exitCode,
        0,
        `${pin.slug}: exitCode drift (pin=0, actual=${exitCode})`,
      );
      for (const [key, expected] of Object.entries(COMMON_ZERO_COUNTERS)) {
        assert.equal(
          s[key] || 0,
          expected,
          `${pin.slug}: summary.${key} drift (pin=${expected}, actual=${s[key] || 0})`,
        );
      }
    });

    it('required baseline type が最低 1 件 baseline 保持されている', () => {
      const byType = cached.status.summary.baselinedByType || {};
      for (const requiredType of pin.requiredBaselinedTypes) {
        assert.ok(
          (byType[requiredType] || 0) >= 1,
          `${pin.slug}: baselinedByType[${requiredType}] が 0 — ` +
            `post-merge reseed で保持されるべき (actual: ${JSON.stringify(byType)})`,
        );
      }
    });
  });
}
