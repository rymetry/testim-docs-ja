/** summary counter を CLI 表示用の複数行テキストに変換する。 */

/**
 * `[source unusable]` セクションを生成する。snapshot / source sync 側 debt
 * のため翻訳 PR では修正できない旨を CLI で明示する。
 *
 * @param {object|null|undefined} summary  `summarizeParityResults()` の戻り値
 *   と同 shape のオブジェクト。`snapshotUnusableIssues` /
 *   `snapshotUnusableFiles` / `snapshotUnusableByType` を読む。
 * @returns {string|null}  非ゼロ時は複数行テキスト、0 / 欠損時は null。
 */
export function formatSourceUnusableSection(summary) {
  if (!summary || typeof summary !== 'object') return null;
  const issues = summary.snapshotUnusableIssues || 0;
  const files = summary.snapshotUnusableFiles || 0;
  if (issues === 0) return null;
  const byType =
    summary.snapshotUnusableByType && typeof summary.snapshotUnusableByType === 'object'
      ? summary.snapshotUnusableByType
      : {};
  const lines = [
    `[source unusable] snapshot 比較不能 (advisory / 翻訳者責任外): ${issues} 件 / ${files} ファイル`,
    '  snapshot 側 / source sync 側の debt です。翻訳 PR では修正できません。',
  ];
  const sortedTypes = Object.keys(byType).sort();
  if (sortedTypes.length > 0) {
    lines.push('  type 別内訳:');
    for (const type of sortedTypes) {
      lines.push(`    ${type}: ${byType[type]} 件`);
    }
  }
  return lines.join('\n');
}
