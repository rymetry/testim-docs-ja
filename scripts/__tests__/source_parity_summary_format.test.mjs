import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Issue #247 PR4 — `scripts/lib/source_parity_summary_format.mjs` の純粋
// formatter ヘルパー (`formatStructureMismatchSection` /
// `formatSourceUnusableSection`) の挙動を pin する。
//
// PR4 の主要 deliverable である CLI 末尾セクション (`[structure mismatch]` /
// `[source unusable]`) を inline `console.log` で書くと regression を
// テストできないため、純粋 formatter として切り出してここで:
//   - 0 件 / 欠損時の omit-zero 挙動
//   - 非ゼロ時のヘッダー文言と注意文
//   - type 別内訳の sort 順とソースフィールド名の wiring
// を固定する。`check_source_parity.mjs` 側はこの helper を呼んで結果を
// `console.log` するだけなので、stdout を直接テストする基盤を新設する
// 必要がない。

let formatStructureMismatchSection;
let formatSourceUnusableSection;

before(async () => {
  ({
    formatStructureMismatchSection,
    formatSourceUnusableSection,
  } = await import('../lib/source_parity_summary_format.mjs'));
});

describe('formatStructureMismatchSection', () => {
  it('returns null when structureMismatchIssues is 0 (omit-zero contract)', () => {
    const result = formatStructureMismatchSection({
      structureMismatchIssues: 0,
      structureMismatchFiles: 0,
      structureMismatchByType: {},
    });
    assert.equal(result, null);
  });

  it('returns null when structureMismatchIssues is undefined (defensive nullish)', () => {
    const result = formatStructureMismatchSection({});
    assert.equal(result, null);
  });

  it('returns null when summary is null (defensive)', () => {
    assert.equal(formatStructureMismatchSection(null), null);
  });

  it('returns null when summary is undefined (defensive)', () => {
    assert.equal(formatStructureMismatchSection(undefined), null);
  });

  it('non-zero summary returns header + advisory note + sorted type breakdown', () => {
    const result = formatStructureMismatchSection({
      structureMismatchIssues: 5,
      structureMismatchFiles: 3,
      structureMismatchByType: {
        'segment-order-mismatch': 2,
        'section-structure-mismatch': 3,
      },
    });
    assert.notEqual(result, null);
    const lines = result.split('\n');
    // ヘッダーの文言固定 (件数 / ファイル数の wiring 含む)
    assert.equal(
      lines[0],
      '[structure mismatch] 全文構造保持違反 (advisory / PR5 で gate に移行予定): 5 件 / 3 ファイル',
    );
    // 注意文の固定
    assert.equal(
      lines[1],
      '  現時点では gate には載りません。reviewer が drift を把握するための独立 counter として出力しています。',
    );
    // type 別内訳ヘッダー
    assert.equal(lines[2], '  type 別内訳:');
    // ソート順 (アルファ昇順) 固定: section-structure-mismatch → segment-order-mismatch
    assert.equal(lines[3], '    section-structure-mismatch: 3 件');
    assert.equal(lines[4], '    segment-order-mismatch: 2 件');
  });

  it('omits the type breakdown section when structureMismatchByType is empty', () => {
    const result = formatStructureMismatchSection({
      structureMismatchIssues: 2,
      structureMismatchFiles: 1,
      structureMismatchByType: {},
    });
    assert.notEqual(result, null);
    const lines = result.split('\n');
    // ヘッダー + 注意文の 2 行のみ
    assert.equal(lines.length, 2);
    assert.ok(lines[0].includes('[structure mismatch]'));
    assert.ok(lines[1].startsWith('  現時点では gate には載りません'));
  });

  it('omits the type breakdown section when structureMismatchByType is missing', () => {
    const result = formatStructureMismatchSection({
      structureMismatchIssues: 2,
      structureMismatchFiles: 1,
    });
    assert.notEqual(result, null);
    const lines = result.split('\n');
    assert.equal(lines.length, 2);
  });

  it('uses the structureMismatch* fields, not the snapshotUnusable* fields (regression guard)', () => {
    // counter フィールド名の typo / 取り違えを防ぐ regression guard。
    // snapshotUnusable* を渡しても 0 とみなして null を返す。
    const result = formatStructureMismatchSection({
      snapshotUnusableIssues: 9,
      snapshotUnusableFiles: 9,
      snapshotUnusableByType: { 'snapshot-incomplete': 9 },
    });
    assert.equal(result, null);
  });
});

describe('formatSourceUnusableSection', () => {
  it('returns null when snapshotUnusableIssues is 0 (omit-zero contract)', () => {
    const result = formatSourceUnusableSection({
      snapshotUnusableIssues: 0,
      snapshotUnusableFiles: 0,
      snapshotUnusableByType: {},
    });
    assert.equal(result, null);
  });

  it('returns null when snapshotUnusableIssues is undefined (defensive nullish)', () => {
    const result = formatSourceUnusableSection({});
    assert.equal(result, null);
  });

  it('returns null when summary is null (defensive)', () => {
    assert.equal(formatSourceUnusableSection(null), null);
  });

  it('returns null when summary is undefined (defensive)', () => {
    assert.equal(formatSourceUnusableSection(undefined), null);
  });

  it('non-zero summary returns header + advisory note + sorted type breakdown', () => {
    const result = formatSourceUnusableSection({
      snapshotUnusableIssues: 3,
      snapshotUnusableFiles: 2,
      snapshotUnusableByType: {
        'source-unusable': 2,
        'snapshot-incomplete': 1,
      },
    });
    assert.notEqual(result, null);
    const lines = result.split('\n');
    assert.equal(
      lines[0],
      '[source unusable] snapshot 比較不能 (advisory / 翻訳者責任外): 3 件 / 2 ファイル',
    );
    assert.equal(
      lines[1],
      '  snapshot 側 / source sync 側の debt です。翻訳 PR では修正できません。',
    );
    assert.equal(lines[2], '  type 別内訳:');
    // ソート順固定: snapshot-incomplete → source-unusable
    assert.equal(lines[3], '    snapshot-incomplete: 1 件');
    assert.equal(lines[4], '    source-unusable: 2 件');
  });

  it('omits the type breakdown section when snapshotUnusableByType is empty', () => {
    const result = formatSourceUnusableSection({
      snapshotUnusableIssues: 1,
      snapshotUnusableFiles: 1,
      snapshotUnusableByType: {},
    });
    assert.notEqual(result, null);
    const lines = result.split('\n');
    assert.equal(lines.length, 2);
    assert.ok(lines[0].includes('[source unusable]'));
    assert.ok(lines[1].startsWith('  snapshot 側 / source sync 側の debt'));
  });

  it('omits the type breakdown section when snapshotUnusableByType is missing', () => {
    const result = formatSourceUnusableSection({
      snapshotUnusableIssues: 1,
      snapshotUnusableFiles: 1,
    });
    assert.notEqual(result, null);
    const lines = result.split('\n');
    assert.equal(lines.length, 2);
  });

  it('uses the snapshotUnusable* fields, not the structureMismatch* fields (regression guard)', () => {
    const result = formatSourceUnusableSection({
      structureMismatchIssues: 9,
      structureMismatchFiles: 9,
      structureMismatchByType: { 'section-structure-mismatch': 9 },
    });
    assert.equal(result, null);
  });
});

describe('両 formatter の独立性 (regression guard)', () => {
  it('only structure mismatch is non-zero → only structure section is returned', () => {
    const summary = {
      structureMismatchIssues: 5,
      structureMismatchFiles: 3,
      structureMismatchByType: { 'section-structure-mismatch': 5 },
      snapshotUnusableIssues: 0,
      snapshotUnusableFiles: 0,
      snapshotUnusableByType: {},
    };
    assert.notEqual(formatStructureMismatchSection(summary), null);
    assert.equal(formatSourceUnusableSection(summary), null);
  });

  it('only source unusable is non-zero → only source unusable section is returned', () => {
    const summary = {
      structureMismatchIssues: 0,
      structureMismatchFiles: 0,
      structureMismatchByType: {},
      snapshotUnusableIssues: 2,
      snapshotUnusableFiles: 2,
      snapshotUnusableByType: { 'snapshot-incomplete': 2 },
    };
    assert.equal(formatStructureMismatchSection(summary), null);
    assert.notEqual(formatSourceUnusableSection(summary), null);
  });

  it('both non-zero → both sections are returned independently', () => {
    const summary = {
      structureMismatchIssues: 5,
      structureMismatchFiles: 3,
      structureMismatchByType: { 'section-structure-mismatch': 5 },
      snapshotUnusableIssues: 2,
      snapshotUnusableFiles: 2,
      snapshotUnusableByType: {
        'snapshot-incomplete': 1,
        'source-unusable': 1,
      },
    };
    const structureSection = formatStructureMismatchSection(summary);
    const sourceSection = formatSourceUnusableSection(summary);
    assert.notEqual(structureSection, null);
    assert.notEqual(sourceSection, null);
    // 文言の最初の行が衝突していないこと
    assert.ok(structureSection.startsWith('[structure mismatch]'));
    assert.ok(sourceSection.startsWith('[source unusable]'));
  });
});
