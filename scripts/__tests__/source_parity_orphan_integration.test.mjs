/**
 * Issue #247 post-merge — Phase C orphan detection の E2E 結合テスト。
 *
 * 設計:
 *   - 架空 slug では orphan 検知が走らない (Finding 3 — runtime が対象 slug
 *     を check しないため) ので、存在する clean sentinel slug
 *     (settings/cli-prerequisites) に runtime が emit しない stale な
 *     segment-missing entry を仕込む
 *   - Finding 15: repo-global な `parity-baseline.json` /
 *     `parity-check-status.json` を奪い合わないよう、checkSourceParity の
 *     baselinePath / outputPath 注入 hook を使って `mkdtemp` 上の
 *     temp copy だけを操作する。repo root のファイルは touch しない
 *
 * 流れ:
 *   1. temp dir を作成し、repo baseline を temp にコピー
 *   2. temp baseline に存在しない enSegmentIndex (9999) を持つ synthetic
 *      `segment-missing` entry を注入
 *   3. checkSourceParity({ slug, baselinePath, outputPath }) を in-process で呼ぶ
 *   4. `summary.orphanBaselineEntries >= 1` を assert
 *   5. temp dir を削除 (after hook)
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let checkSourceParity;

before(async () => {
  ({ checkSourceParity } = await import('../check_source_parity.mjs'));
});

// sha256 フィンガープリントを同期的に計算する小さなユーティリティ。
// 本体 (source_parity_acknowledgements.mjs の computeSnapshotFingerprint) を
// import する代わりにここで直接計算することで、before() フックの実行順序
// (async import が先に走らないと値が undefined になる) を気にせず、
// baseline entry 準備の before() で即座に使える。
function fingerprintFor(content) {
  const hex = createHash('sha256').update(content).digest('hex');
  return `sha256:${hex}`;
}

const ROOT = join(import.meta.dirname, '../../');
const REAL_BASELINE_PATH = join(ROOT, 'parity-baseline.json');
const TARGET_SLUG = 'settings/cli-prerequisites';
const SNAPSHOT_PATH = join(
  ROOT,
  'snapshots/en/content/settings/cli-prerequisites.html',
);

// temp dir と temp baseline/status path。isolation の要 (Finding 15)。
const TMP_DIR = mkdtempSync(join(tmpdir(), 'parity-orphan-e2e-'));
const BASELINE_TMP = join(TMP_DIR, 'parity-baseline.json');
const STATUS_TMP = join(TMP_DIR, 'parity-check-status.json');

before(() => {
  // 1. repo baseline を temp にコピー
  copyFileSync(REAL_BASELINE_PATH, BASELINE_TMP);

  // 2. synthetic な stale segment-missing entry を注入する。
  //    enSegmentIndex=9999 は実 snapshot に存在しないので runtime は
  //    これを emit せず、orphan として浮かび上がるはず。
  const baseline = JSON.parse(readFileSync(BASELINE_TMP, 'utf8'));
  const snapshotContent = readFileSync(SNAPSHOT_PATH, 'utf8');
  const fp = fingerprintFor(snapshotContent);

  baseline.entries.push({
    slug: TARGET_SLUG,
    issueType: 'segment-missing',
    sectionPath: '__synthetic_orphan__',
    segmentKind: 'paragraph',
    enSegmentIndex: 9999,
    jaSegmentIndex: null,
    enSourceFingerprint: 'sha256:' + '9'.repeat(64),
    jaSourceFingerprint: null,
    missingTokens: null,
    inconclusiveCategory: null,
    inconclusiveReason: null,
    sectionIndex: null,
    structureCategory: null,
    structureFingerprint: null,
    usabilityReason: null,
    snapshotFingerprint: fp,
    reviewAfter: '2027-01-01',
  });
  writeFileSync(BASELINE_TMP, JSON.stringify(baseline, null, 2) + '\n');
});

after(() => {
  // temp dir を丸ごと削除。repo root のファイルは一切触っていないので
  // 後片付けは不要。
  rmSync(TMP_DIR, { recursive: true, force: true });
});

describe('Issue #247 post-merge — orphan baseline detection E2E', () => {
  it('temp baseline 上の synthetic stale entry を orphan として集計する', async () => {
    await checkSourceParity({
      slug: TARGET_SLUG,
      json: true,
      baselinePath: BASELINE_TMP,
      outputPath: STATUS_TMP,
    });

    const status = JSON.parse(readFileSync(STATUS_TMP, 'utf8'));
    const orphanCount = status.summary.orphanBaselineEntries || 0;
    const byType = status.summary.orphanBaselineByType || {};

    assert.ok(
      orphanCount >= 1,
      `orphan counter should be >= 1 (actual: ${orphanCount}, ` +
        `byType=${JSON.stringify(byType)})`,
    );
    assert.ok(
      (byType['segment-missing'] || 0) >= 1,
      `segment-missing orphan should be present: ${JSON.stringify(byType)}`,
    );
  });
});
