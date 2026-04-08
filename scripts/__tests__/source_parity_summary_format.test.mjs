import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Issue #247 PR5 — `scripts/lib/source_parity_summary_format.mjs` の純粋
// formatter ヘルパー (`formatSourceUnusableSection`) の挙動を pin する。
//
// PR4 で導入した `formatStructureMismatchSection` は PR5 cutover で削除した
// (structure mismatch が reportable に昇格し、件数は通常の `Active issue
// files` 経由で表示されるため、独立 section を残すと重複表示になる)。
//
// `formatSourceUnusableSection` は引き続き advisory section として残す:
//   - 0 件 / 欠損時の omit-zero 挙動
//   - 非ゼロ時のヘッダー文言と注意文
//   - type 別内訳の sort 順とソースフィールド名の wiring
// を固定する。`check_source_parity.mjs` 側はこの helper を呼んで結果を
// `console.log` するだけなので、stdout を直接テストする基盤を新設する
// 必要がない。

let formatSourceUnusableSection;

before(async () => {
  ({ formatSourceUnusableSection } = await import(
    '../lib/source_parity_summary_format.mjs'
  ));
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
