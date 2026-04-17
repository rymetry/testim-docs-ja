/**
 * representative full-run summary contract test。
 *
 * 代表 7 ページに対して `checkSourceParity({ slug, baselinePath, outputPath })`
 * を in-process で順次呼び、temp status file から summary counter を
 * pin する。
 *
 * RESOLVED_PAGES (baseline 0 件 clean green):
 *   | slug                                               | 解消手段                                         |
 *   | -------------------------------------------------- | ------------------------------------------------ |
 *   | salesforce-testing/salesforce-testing-overview     | Phase G: shallow EN に合わせて JA trim           |
 *   | results/test-results/network-logs                  | Phase 4 burn-down で Testim UI 英語残留 解消     |
 *   | advanced-editing/custom-action-step-mobile         | Phase 4 B2+B3 burn-down (T11 / plan §3.2)        |
 *   | salesforce-testing/faq                             | Phase 4 B2+B3 burn-down (T11 / plan §3.2)        |
 *   | advanced-editing/validations/email-validation      | Phase 4 B2+B3 burn-down (T11 / plan §3.2)        |
 *   | results/test-runs                                  | §5.3.7: status-symbol 表現を Unicode ×/✓ に置換する content-level JA 翻訳で解消 |
 *
 * RESIDUAL_PAGES (segment-untranslated が baseline 凍結):
 *   Testim UI 名の英語残留が surface するページ。GLOSSARY 拡張での解消は
 *   Phase 0 scope を超えるため、baseline で凍結して Phase 1.x の GLOSSARY
 *   監査タスクとする。
 *
 *   | slug                                               | 残留理由                                         |
 *   | -------------------------------------------------- | ------------------------------------------------ |
 *   | results/test-runs                                  | Testim UI 名 英語残留 (segment-untranslated)     |
 *   | running-tests/the-command-line-cli                 | Testim UI 名 英語残留 (segment-untranslated, 4 件 / T11 pending) |
 *
 * pin する契約:
 *   RESOLVED: 全 slug で `reportableActiveFiles === 0` かつ `baselinedByType === {}`
 *   RESIDUAL: 全 slug で `reportableActiveActionableFiles === 0` かつ
 *             `baselinedByType[segment-untranslated] >= 1`
 *             T15: 加えて `section-structure-mismatch` / `segment-extra` も
 *             requiredBaselinedTypes として pin 可能 (plan §3.2)
 *
 * slug ごとに別 status file へ書き出し、repo root は触らない。
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

// slug ごとに別の temp status file を使う。
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
// RESOLVED_PAGES — baseline entry 0 で clean green を期待する代表ページ。
// 解消プロセス:
// - `salesforce-testing-overview`: EN 本文が `<h1>` + 1 paragraph のみで
//   source が shallow なため、JA も同構造に trim
// - 他 4 slug: Phase 4 burn-down で Testim UI 英語残留を解消 (T11 promotion)
// ---------------------------------------------------------------------------
const RESOLVED_PAGES = Object.freeze([
  'salesforce-testing/salesforce-testing-overview',
  'results/test-results/network-logs',
  'advanced-editing/custom-action-step-mobile',
  'salesforce-testing/faq',
  'advanced-editing/validations/email-validation',
  // §5.3.7 promotion: status-symbol cell を content-level JA 翻訳で書き直し
  // (赤い x / 緑の v → 赤い ×マーク / 緑の ✓マーク) し、classifier が
  // segment-untranslated を出さなくなった。既 baselined entry が削除され 0 件
  // clean green に復帰 (CJK_RE /g flag fix と併せて §5.3.7 で解消)。
  'results/test-runs',
  // M2 Tier B Wave 1: arrow-fusion burn-down で 4→0 (section-structure-mismatch ×2,
  //   segment-extra ×2) に clean 化 — RESIDUAL から移動
  'administration/project-and-user-management',
]);

// ---------------------------------------------------------------------------
// RESIDUAL_PAGES — segment-untranslated が baseline 凍結中のページ。
// T11: running-tests/the-command-line-cli は未解消 (4 件残) のため RESIDUAL に復帰。
// T15: section-structure-mismatch / segment-extra も requiredBaselinedTypes で pin 可能。
// ---------------------------------------------------------------------------
const RESIDUAL_PAGES = Object.freeze([
  // §5.3.7: results/test-runs は RESOLVED_PAGES へ昇格
  // (status-symbol 表現を Unicode ×/✓ に置換する content-level JA 翻訳で解消)
  { slug: 'running-tests/the-command-line-cli', requiredBaselinedTypes: ['segment-untranslated'] },
  // T15 pin は M2 Tier B Wave 1 で `administration/project-and-user-management`
  // を 4→0 に clean 化して解消。RESOLVED に移動済み。他の
  // section-structure-mismatch / segment-extra 代表 pin が必要になったら
  // 別 slug で再追加する。
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
        `${slug}: baselinedByType should be empty. actual=${JSON.stringify(byType)}`,
      );
    });

    it('signal-only drift も 0 件', () => {
      // signal-only drift も含めて 0 件であることを確認する。
      const { status } = cached;
      const jaRelativePath = `src/content/docs/${slug}.md`;
      const file = (status.files || []).find((f) => f.file === jaRelativePath);
      const issues = file ? file.issues : [];
      assert.equal(
        issues.length,
        0,
        `${slug}: representative page must have 0 issues of any severity (actionable/signal). ` +
          `actual=${JSON.stringify(issues.map((i) => ({ type: i.type, severity: i.severity, detail: (i.detail || '').slice(0, 80) })))}`,
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
