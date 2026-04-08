/**
 * Issue #247 PR6 — 代表ページに対する canonical block sequence comparator
 * の実 snapshot + 実 JA md 回帰 fixture テスト。
 *
 * 対象 3 ページ (Issue #247 本文で structure mismatch として明示されたもの):
 *   - running-tests/the-command-line-cli
 *   - results/test-results/network-logs
 *   - advanced-editing/validations/email-validation
 *
 * pin する契約:
 *   1. alignSegments → parityDiffsToIssues 経由で section-structure-mismatch /
 *      segment-order-mismatch が **少なくとも 1 件** emit される (false red
 *      回帰の防止)
 *   2. 各 page で emit される structure issue の件数が PR5 baseline と一致する
 *      (drift 発生時のシグナル)
 *   3. 先頭 issue の structureCategory / sectionPath / enKinds / jaKinds が
 *      固定の期待値と一致する (comparator の出力契約の固定)
 *
 * このテストは gate 側の挙動 (baseline tagging / acknowledgement tagging /
 * exit code) には触れない — それは §Task 3 の representative summary test が
 * 担当する。ここは **comparator の raw 出力** だけを pin する。
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
// ヘルパ: 代表ページを読み込んで structure issue だけを返す。
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
// pin 値 (Step 3 の実測で確定)
// ---------------------------------------------------------------------------

const PINNED_THE_CLI = Object.freeze({
  slug: 'running-tests/the-command-line-cli',
  structureIssueCount: 10,
  byType: { 'section-structure-mismatch': 10, 'segment-order-mismatch': 0 },
  byCategory: {
    'kind-multiset': 10,
    'kind-sequence': 0,
    'content-order': 0,
  },
  firstIssue: {
    type: 'section-structure-mismatch',
    structureCategory: 'kind-multiset',
    sectionPath: 'CLI Installation > Basic CLI command',
    sectionIndex: 3,
    enKinds: [
      'paragraph', 'ordered-list', 'paragraph', 'paragraph', 'paragraph',
      'paragraph', 'paragraph', 'paragraph', 'paragraph', 'paragraph',
      'paragraph', 'paragraph', 'ordered-list',
    ],
    jaKinds: [
      'paragraph', 'paragraph', 'ordered-list', 'paragraph', 'paragraph', 'ordered-list',
    ],
    enSegmentCount: 13,
    jaSegmentCount: 6,
  },
});

const PINNED_NETWORK_LOGS = Object.freeze({
  slug: 'results/test-results/network-logs',
  structureIssueCount: 2,
  byType: { 'section-structure-mismatch': 2, 'segment-order-mismatch': 0 },
  byCategory: {
    'kind-multiset': 2,
    'kind-sequence': 0,
    'content-order': 0,
  },
  firstIssue: {
    type: 'section-structure-mismatch',
    structureCategory: 'kind-multiset',
    sectionPath: 'Viewing the network logs at the step level > Filtering request results',
    sectionIndex: 2,
    enKinds: [
      'paragraph', 'ordered-list', 'paragraph', 'paragraph', 'paragraph',
      'paragraph', 'paragraph', 'paragraph', 'ordered-list', 'paragraph',
      'callout-body', 'paragraph', 'ordered-list', 'paragraph',
    ],
    jaKinds: [
      'paragraph', 'ordered-list', 'paragraph', 'paragraph',
      'ordered-list', 'paragraph', 'callout-body', 'paragraph', 'ordered-list', 'paragraph',
    ],
    enSegmentCount: 14,
    jaSegmentCount: 10,
  },
});

const PINNED_EMAIL_VALIDATION = Object.freeze({
  slug: 'advanced-editing/validations/email-validation',
  structureIssueCount: 2,
  byType: { 'section-structure-mismatch': 2, 'segment-order-mismatch': 0 },
  byCategory: {
    'kind-multiset': 2,
    'kind-sequence': 0,
    'content-order': 0,
  },
  firstIssue: {
    type: 'section-structure-mismatch',
    structureCategory: 'kind-multiset',
    sectionPath: '',
    sectionIndex: 0,
    enKinds: [
      'paragraph', 'callout-body', 'paragraph', 'table',
      'paragraph', 'unordered-list', 'paragraph', 'callout-body',
    ],
    jaKinds: [
      'paragraph', 'paragraph', 'callout-body', 'paragraph', 'table',
      'paragraph', 'unordered-list', 'paragraph', 'callout-body',
    ],
    enSegmentCount: 8,
    jaSegmentCount: 9,
  },
});

// ---------------------------------------------------------------------------
// 共通アサーションヘルパ。3 page で同じ構造の pin を assert するので 1 つに集約する。
// ---------------------------------------------------------------------------
function assertStructurePin(slug, pinned) {
  const { structureIssues } = runStructureComparator(slug);

  // 件数 contract
  assert.equal(
    structureIssues.length,
    pinned.structureIssueCount,
    `${slug}: structure issue 件数 drift (pin=${pinned.structureIssueCount}, actual=${structureIssues.length})`,
  );

  // 少なくとも 1 件は出るはず (false red 回帰ガード)
  assert.ok(
    structureIssues.length >= 1,
    `${slug}: structure issue が 0 件になった — PR5 baseline では active であるべき`,
  );

  // type 別内訳
  const byType = structureIssues.reduce((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + 1;
    return acc;
  }, {});
  for (const [type, expected] of Object.entries(pinned.byType)) {
    assert.equal(
      byType[type] || 0,
      expected,
      `${slug}: ${type} の件数 drift (pin=${expected}, actual=${byType[type] || 0})`,
    );
  }

  // category 別内訳
  const byCategory = structureIssues.reduce((acc, i) => {
    acc[i.structureCategory] = (acc[i.structureCategory] || 0) + 1;
    return acc;
  }, {});
  for (const [cat, expected] of Object.entries(pinned.byCategory)) {
    assert.equal(
      byCategory[cat] || 0,
      expected,
      `${slug}: structureCategory=${cat} の件数 drift (pin=${expected}, actual=${byCategory[cat] || 0})`,
    );
  }

  // 先頭 issue の payload contract
  const first = structureIssues[0];
  assert.equal(first.type, pinned.firstIssue.type, `${slug}: firstIssue.type drift`);
  assert.equal(
    first.structureCategory,
    pinned.firstIssue.structureCategory,
    `${slug}: firstIssue.structureCategory drift`,
  );
  assert.equal(first.sectionPath, pinned.firstIssue.sectionPath, `${slug}: firstIssue.sectionPath drift`);
  assert.equal(first.sectionIndex, pinned.firstIssue.sectionIndex, `${slug}: firstIssue.sectionIndex drift`);
  assert.deepEqual(first.enKinds, pinned.firstIssue.enKinds, `${slug}: firstIssue.enKinds drift`);
  assert.deepEqual(first.jaKinds, pinned.firstIssue.jaKinds, `${slug}: firstIssue.jaKinds drift`);
  assert.equal(
    first.enSegmentCount,
    pinned.firstIssue.enSegmentCount,
    `${slug}: firstIssue.enSegmentCount drift`,
  );
  assert.equal(
    first.jaSegmentCount,
    pinned.firstIssue.jaSegmentCount,
    `${slug}: firstIssue.jaSegmentCount drift`,
  );
}

// ---------------------------------------------------------------------------
// 代表ページ 1: running-tests/the-command-line-cli
// ---------------------------------------------------------------------------
describe('source_parity_structure_fixtures: running-tests/the-command-line-cli', () => {
  it('structure issue 件数 / category / 先頭 issue の payload が PR5 baseline と一致する', () => {
    assertStructurePin(PINNED_THE_CLI.slug, PINNED_THE_CLI);
  });
});

// ---------------------------------------------------------------------------
// 代表ページ 2: results/test-results/network-logs
// ---------------------------------------------------------------------------
describe('source_parity_structure_fixtures: results/test-results/network-logs', () => {
  it('structure issue 件数 / category / 先頭 issue の payload が PR5 baseline と一致する', () => {
    assertStructurePin(PINNED_NETWORK_LOGS.slug, PINNED_NETWORK_LOGS);
  });
});

// ---------------------------------------------------------------------------
// 代表ページ 3: advanced-editing/validations/email-validation
// ---------------------------------------------------------------------------
describe('source_parity_structure_fixtures: advanced-editing/validations/email-validation', () => {
  it('structure issue 件数 / category / 先頭 issue の payload が PR5 baseline と一致する', () => {
    assertStructurePin(PINNED_EMAIL_VALIDATION.slug, PINNED_EMAIL_VALIDATION);
  });
});
