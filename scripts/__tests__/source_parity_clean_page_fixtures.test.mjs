/**
 * Issue #247 PR6 — Confirmed zero-drift ページの false-positive sentinel。
 *
 * 対象ページ (plan 作成時に実測で確定):
 *   - settings/cli-prerequisites
 *     (enSegments=10, jaSegments=10, structureIssues=0, totalIssues=0)
 *   - salesforce-testing/salesforce-testing-getting-started
 *     (enSegments=79, jaSegments=79, structureIssues=0, totalIssues=0)
 *
 * 両ページとも EN/JA が完全整合している clean page で、PR5 base で
 * parity-baseline.json / parity-acknowledgements.json のどちらにも
 * エントリが無い。comparator が正しく動いている限り、structure issue は
 * 0 件かつ segment-* diff も 0 件のはず。
 *
 * pin する契約:
 *   1. section-structure-mismatch / segment-order-mismatch が 0 件
 *      (false positive の主たるガード)
 *   2. 総 issue 数も 0 件 (clean page なので drift が無い — より強い不変条件)
 *   3. alignment が inconclusive にならない (健全ページで解析不能になる
 *      のは regress のサイン)
 *
 * 当初検討された `advanced-editing/custom-action-step-mobile` と
 * `results/test-runs` は両方とも実測で structure issue が 0 件ではない
 * ため本 fixture からは除外。前者は Task 3 (representative summary) で
 * 「baseline 吸収済み structure mismatch ページ」として扱う。
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let alignSegments;
let parityDiffsToIssues;
let extractSegmentsFromHtml;
let extractSegmentsFromMarkdown;

before(async () => {
  ({
    alignSegments,
    parityDiffsToIssues,
    extractSegmentsFromHtml,
    extractSegmentsFromMarkdown,
  } = await import('../lib/source_parity.mjs'));
});

const ROOT = join(import.meta.dirname, '../../');
const SNAPSHOTS_DIR = join(ROOT, 'snapshots/en/content');
const JA_CONTENT_DIR = join(ROOT, 'src/content/docs');

// ---------------------------------------------------------------------------
// ヘルパ: JA md の frontmatter を除去し本文だけを返す。
// source_parity_source_usability_fixtures.test.mjs (PR3) と同じ実装を
// 複製する。lib への切り出しは production code change を伴うため PR6 では
// 行わない。
// ---------------------------------------------------------------------------
function extractJaBody(mdContent) {
  const withoutFm = mdContent.replace(/^---[\s\S]*?---\n/m, '');
  return withoutFm.trim();
}

// ---------------------------------------------------------------------------
// ヘルパ: Task 1 と同じ shape を返す。alignment を含めていないと
// `const { alignment } = runStructureComparator(slug)` で TypeError になる。
// ---------------------------------------------------------------------------
function runStructureComparator(slug) {
  const rawEnHtml = readFileSync(join(SNAPSHOTS_DIR, `${slug}.html`), 'utf8');
  const jaMd = readFileSync(join(JA_CONTENT_DIR, `${slug}.md`), 'utf8');
  const jaBody = extractJaBody(jaMd);
  const enSegments = extractSegmentsFromHtml(rawEnHtml);
  const jaSegments = extractSegmentsFromMarkdown(jaBody);
  const alignment = alignSegments(enSegments, jaSegments);
  const issues = parityDiffsToIssues(alignment.diffs);
  const structureIssues = issues.filter(
    (i) => i.type === 'section-structure-mismatch' || i.type === 'segment-order-mismatch',
  );
  return { alignment, issues, structureIssues };
}

// ---------------------------------------------------------------------------
// plan 作成時に実測で zero-drift を確定した 2 ページ。配列の順序と要素は
// PR6 実装時の回帰確認で前提が成立していることを確認済み。
// ---------------------------------------------------------------------------
const CLEAN_PAGE_SLUGS = Object.freeze([
  'settings/cli-prerequisites',
  'salesforce-testing/salesforce-testing-getting-started',
]);

for (const slug of CLEAN_PAGE_SLUGS) {
  describe(`source_parity_clean_page_fixtures: ${slug}`, () => {
    it('alignment が inconclusive にならない (健全 page の最低保証)', () => {
      const { alignment } = runStructureComparator(slug);
      assert.equal(
        alignment.inconclusive ?? false,
        false,
        `${slug}: alignment.inconclusive === true になった — PR5 base では解析成功していたはず`,
      );
    });

    it('section-structure-mismatch / segment-order-mismatch が 0 件 (false positive sentinel)', () => {
      const { structureIssues } = runStructureComparator(slug);
      assert.equal(
        structureIssues.length,
        0,
        `${slug}: structure issue が ${structureIssues.length} 件検出された — ` +
          `plan 前提 (zero-drift clean page) が崩れている。` +
          `最初の issue: ${JSON.stringify(structureIssues[0] ?? null)}`,
      );
    });

    it('総 issue 数も 0 件 (clean page の強い不変条件)', () => {
      const { issues } = runStructureComparator(slug);
      assert.equal(
        issues.length,
        0,
        `${slug}: 総 issue 数が ${issues.length} 件 — ` +
          `plan 前提では EN/JA が完全整合しており 0 件のはず。` +
          `最初の issue: ${JSON.stringify(issues[0] ?? null)}`,
      );
    });
  });
}
