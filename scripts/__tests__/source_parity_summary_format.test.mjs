import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

// `formatSourceUnusableSection` の挙動を固定する。

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
