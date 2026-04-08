/**
 * Issue #247 PR6 — representative full-run summary contract test.
 *
 * 代表 6 ページに対して checkSourceParity({ slug }) を in-process で順次呼び、
 * 生成された parity-check-status.json を読み取って各 page の summary
 * counter を pin する。
 *
 * 対象 slug と期待分類:
 *
 *   | slug                                               | expected counters             |
 *   | -------------------------------------------------- | ----------------------------- |
 *   | running-tests/the-command-line-cli                 | structure baselined           |
 *   | results/test-results/network-logs                  | structure baselined           |
 *   | advanced-editing/validations/email-validation      | structure baselined           |
 *   | salesforce-testing/faq                             | source-unusable baselined     |
 *   | salesforce-testing/salesforce-testing-overview     | snapshot-incomplete baselined |
 *   | advanced-editing/custom-action-step-mobile         | structure baselined (3 件) + segment-* baselined |
 *
 * pin する契約:
 *   1. 全 slug で reportableActiveFiles === 0 (PR5 gate cutover が live
 *      かつ baseline が有効)
 *   2. structure 系 4 slug (the-command-line-cli / network-logs /
 *      email-validation / custom-action-step-mobile) で structureMismatchIssues
 *      === 0 (全件 baselined。active counter なので baseline 化されたものは
 *      含まれず 0)
 *   3. source-unusable 系 2 slug で snapshotUnusableIssues === 0 (全件
 *      baselined) かつ reportableActiveFiles === 0
 *   4. 全 slug で baselinedByType に「期待される type」が 1 件以上含まれている
 *      ことを確認 (structure 系 4 slug は section-structure-mismatch、
 *      source-unusable 系 2 slug は source-unusable / snapshot-incomplete)
 *
 * 手法:
 *   既存 source_parity_align_runtime.test.mjs のバックアップパターンを使って
 *   parity-check-status.json を退避し、slug ごとに checkSourceParity() を
 *   呼んで read → assert → 次の slug に進む。
 */
import { before, after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, copyFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

let checkSourceParity;

before(async () => {
  ({ checkSourceParity } = await import('../check_source_parity.mjs'));
});

const ROOT = join(import.meta.dirname, '../../');
const STATUS_PATH = join(ROOT, 'parity-check-status.json');
const STATUS_BACKUP_PATH = join(ROOT, 'parity-check-status.pr6-test-backup.json');

before(() => {
  if (existsSync(STATUS_PATH)) {
    copyFileSync(STATUS_PATH, STATUS_BACKUP_PATH);
  }
});

after(() => {
  if (existsSync(STATUS_BACKUP_PATH)) {
    copyFileSync(STATUS_BACKUP_PATH, STATUS_PATH);
    unlinkSync(STATUS_BACKUP_PATH);
  }
});

// ---------------------------------------------------------------------------
// ヘルパ: slug 絞りで checkSourceParity を呼び、status JSON を読み取って返す。
// ---------------------------------------------------------------------------
async function runForSlug(slug) {
  const exitCode = await checkSourceParity({ slug, json: true });
  if (!existsSync(STATUS_PATH)) {
    throw new Error(
      `checkSourceParity({ slug: ${JSON.stringify(slug)} }) が status file を書かなかった`,
    );
  }
  const status = JSON.parse(readFileSync(STATUS_PATH, 'utf8'));
  return { exitCode, status };
}

// ---------------------------------------------------------------------------
// 代表 slug の共通契約 (全 slug で 0 になる counter)
// ---------------------------------------------------------------------------
const COMMON_ZERO_COUNTERS = Object.freeze({
  reportableActiveFiles: 0,
  structureMismatchIssues: 0,
  snapshotUnusableIssues: 0,
  reportableActiveActionableFiles: 0,
});

// ---------------------------------------------------------------------------
// slug ごとの baselinedByType 下限。
// 「少なくともこの type が baseline に含まれていること」を pin する。
// 個別件数の drift は Task 1 (structure fixture) が捕まえるため、
// ここでは type の存在だけを確認する。
// ---------------------------------------------------------------------------
const PINNED_PAGES = Object.freeze([
  {
    slug: 'running-tests/the-command-line-cli',
    // section-structure-mismatch × 10 が baselined
    requiredBaselinedTypes: ['section-structure-mismatch'],
  },
  {
    slug: 'results/test-results/network-logs',
    // section-structure-mismatch × 2 が baselined
    requiredBaselinedTypes: ['section-structure-mismatch'],
  },
  {
    slug: 'advanced-editing/validations/email-validation',
    // section-structure-mismatch × 2 が baselined
    requiredBaselinedTypes: ['section-structure-mismatch'],
  },
  {
    slug: 'salesforce-testing/faq',
    // source-unusable × 1 が baselined
    requiredBaselinedTypes: ['source-unusable'],
  },
  {
    slug: 'salesforce-testing/salesforce-testing-overview',
    // snapshot-incomplete × 1 が baselined
    requiredBaselinedTypes: ['snapshot-incomplete'],
  },
  {
    slug: 'advanced-editing/custom-action-step-mobile',
    // PR5 base で section-structure-mismatch × 3 + segment-* × 7 が全件 baseline 化。
    // representative summary 上は active counter が全て 0。
    // 「baseline で structure mismatch を吸収しているページ」として
    // section-structure-mismatch を必須型に含める。
    requiredBaselinedTypes: ['section-structure-mismatch'],
  },
]);

// ---------------------------------------------------------------------------
// slug ごとに describe を分け、before() で 1 度だけ checkSourceParity を呼ぶ。
// 同一 describe 内の 2 it() で結果を使い回す (in-process 呼び出しの回数を半減)。
// ---------------------------------------------------------------------------
for (const pin of PINNED_PAGES) {
  describe(`source_parity_representative_summary: ${pin.slug}`, () => {
    let cached = null;
    before(async () => {
      cached = await runForSlug(pin.slug);
    });

    it('gate exit code が 0 かつ reportable*/structure/unusable counter が 0', () => {
      const { exitCode, status } = cached;
      const s = status.summary;
      assert.equal(exitCode, 0, `${pin.slug}: exitCode drift (pin=0, actual=${exitCode})`);
      for (const [key, expected] of Object.entries(COMMON_ZERO_COUNTERS)) {
        assert.equal(
          s[key] || 0,
          expected,
          `${pin.slug}: summary.${key} drift (pin=${expected}, actual=${s[key] || 0})`,
        );
      }
    });

    it('baseline に必要な issue type が含まれている (advisory ではなく baselined で吸収)', () => {
      const byType = cached.status.summary.baselinedByType || {};
      for (const requiredType of pin.requiredBaselinedTypes) {
        assert.ok(
          (byType[requiredType] || 0) >= 1,
          `${pin.slug}: baselinedByType[${requiredType}] が 0 — PR5 baseline で吸収されるべき ` +
            `(actual: ${JSON.stringify(byType)})`,
        );
      }
    });
  });
}
