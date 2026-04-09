/**
 * Issue #247 post-merge — representative full-run summary contract test。
 *
 * 代表 8 ページに対して `checkSourceParity({ slug, baselinePath, outputPath })`
 * を in-process で順次呼び、temp status file から summary counter を
 * pin する。Phase D/E/F/G の post-resolution state を固定する fixture。
 *
 * 2 群に分類:
 *
 *   RESOLVED_PAGES — baseline entry 0 で clean green に到達したページ
 *     | slug                                               | 期待状態               |
 *     | -------------------------------------------------- | ---------------------- |
 *     | advanced-editing/custom-action-step-mobile         | 全 baseline 消えて 0   |
 *     | results/test-runs                                  | 全 baseline 消えて 0   |
 *
 *   RESIDUAL_PAGES — baseline に partial drift や upstream debt が残るページ
 *     | slug                                               | 最低 baseline 必須 type         |
 *     | -------------------------------------------------- | ------------------------------- |
 *     | running-tests/the-command-line-cli                 | section-structure-mismatch      |
 *     | results/test-results/network-logs                  | section-structure-mismatch      |
 *     | advanced-editing/validations/email-validation      | section-structure-mismatch      |
 *     | salesforce-testing/faq                             | segment-token-gap (extractor bug)|
 *     | salesforce-testing/salesforce-testing-overview     | snapshot-incomplete             |
 *     | testops/testops-version-control/pull-requests      | snapshot-incomplete             |
 *
 * pin する契約:
 *   1. 全 slug で `reportableActiveFiles === 0`
 *      (active reportable は 0 件、drift は baselined で吸収)
 *   2. 全 slug で `structureMismatchIssues === 0` / `snapshotUnusableIssues === 0`
 *      (active structure / snapshot unusable counter は 0)
 *   3. RESOLVED_PAGES は `baselinedByType === {}` (完全に clean)
 *   4. RESIDUAL_PAGES は `baselinedByType[requiredType] >= 1`
 *      (指定の issue type が最低 1 件 baseline 保持)
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
// RESOLVED_PAGES — Phase E で完全に clean green 化した 2 slug。
// baseline entry を一切持たないことを pin する。
// ---------------------------------------------------------------------------
const RESOLVED_PAGES = Object.freeze([
  'advanced-editing/custom-action-step-mobile',
  'results/test-runs',
]);

// ---------------------------------------------------------------------------
// RESIDUAL_PAGES — Phase D/E/F 完了後も baseline に残る debt 種別を
// 最低 1 件持つことを pin する slug。
// ---------------------------------------------------------------------------
const RESIDUAL_PAGES = Object.freeze([
  {
    slug: 'running-tests/the-command-line-cli',
    // Phase D で JA 全面書き換えが膨大なため後続 Issue 送り。
    // section-structure-mismatch を最低 1 件は保持する前提で reseed 済み
    requiredBaselinedTypes: ['section-structure-mismatch'],
  },
  {
    slug: 'results/test-results/network-logs',
    // section-structure-mismatch × 2 を reseed 保持
    requiredBaselinedTypes: ['section-structure-mismatch'],
  },
  {
    slug: 'advanced-editing/validations/email-validation',
    // Phase D で preface は clean に。nested section は residual を reseed 保持
    requiredBaselinedTypes: ['section-structure-mismatch'],
  },
  {
    slug: 'salesforce-testing/faq',
    // Phase F.2.5 で structure は clean。source_parity_extract.mjs の
    // normalizeUrlToken 既知バグによる segment-token-gap のみ baseline 保持
    // (別ページ best-practice-variable-naming-convention-for-easy-cleanup
    //  と対称)。
    requiredBaselinedTypes: ['segment-token-gap'],
  },
  {
    slug: 'salesforce-testing/salesforce-testing-overview',
    // upstream snapshot 側 debt (shallow-snapshot) を保持
    requiredBaselinedTypes: ['snapshot-incomplete'],
  },
  {
    slug: 'testops/testops-version-control/pull-requests',
    // 同じく upstream snapshot 側 debt (extractor-empty) を保持
    requiredBaselinedTypes: ['snapshot-incomplete'],
  },
]);

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
