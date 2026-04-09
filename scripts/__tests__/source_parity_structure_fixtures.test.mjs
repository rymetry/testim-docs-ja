/**
 * Issue #247 End-to-End 完全解消後の structure regression guard。
 *
 * representative 3 ページ:
 *   - running-tests/the-command-line-cli
 *   - results/test-results/network-logs
 *   - advanced-editing/validations/email-validation
 *
 * これらは post-resolution では canonical block sequence comparator 上
 * `section-structure-mismatch` / `segment-order-mismatch` ともに 0 件である
 * ことを維持し続ける必要がある。ここでは実 snapshot + 実 JA md を読み、
 * raw comparator 出力が空配列であることを pin する。
 *
 * なお、下の `PINNED_*` 定数は PR5 / post-merge review 時点の historical
 * pin 値を残した参照データであり、現在の assert 本体は `assertStructureClean()`
 * を使う。gate 側の summary counter や baseline tagging は
 * representative summary test が担当する。
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
// Historical pin 値 (PR5 / post-merge review 時点の実測)。
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
  // Phase D で preface の extra paragraph を削除したので 2 → 1 に減少。
  // 残る 1 件は nested heading 構造差 (Codeless Option セクション末尾の
  // extra paragraph) で、Phase G で baseline 保持する方針。
  structureIssueCount: 1,
  byType: { 'section-structure-mismatch': 1, 'segment-order-mismatch': 0 },
  byCategory: {
    'kind-multiset': 1,
    'kind-sequence': 0,
    'content-order': 0,
  },
  firstIssue: {
    type: 'section-structure-mismatch',
    structureCategory: 'kind-multiset',
    sectionPath: 'Creating a Validate Email Step > Creating a Validate Email Step using the Codeless Option',
    sectionIndex: 16,
    enKinds: [
      'paragraph', 'ordered-list', 'paragraph', 'ordered-list',
      'paragraph', 'ordered-list', 'paragraph', 'ordered-list',
      'callout-body', 'paragraph', 'ordered-list', 'paragraph',
      'ordered-list', 'callout-body', 'ordered-list', 'paragraph',
      'ordered-list', 'paragraph', 'ordered-list', 'paragraph',
      'paragraph', 'paragraph', 'ordered-list', 'paragraph',
    ],
    jaKinds: [
      'paragraph', 'ordered-list', 'paragraph', 'ordered-list',
      'paragraph', 'ordered-list', 'paragraph', 'ordered-list',
      'callout-body', 'paragraph', 'ordered-list', 'paragraph',
      'ordered-list', 'callout-body', 'ordered-list', 'paragraph',
      'ordered-list', 'paragraph', 'ordered-list', 'paragraph',
      'paragraph', 'ordered-list', 'paragraph',
    ],
    enSegmentCount: 24,
    jaSegmentCount: 23,
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
// Issue #247 End-to-End 完全解消後: 3 代表ページは Phase D.1/D.2/D.3 の JA
// 全面 rewrite で structure issue が 0 件に到達した。PR5 時点の PINNED_*
// 期待値は post-resolution 回帰 guard として assertStructureClean() 側へ
// 切り替える。将来 JA が再度 drift した場合に即座に検知する。
// ---------------------------------------------------------------------------
describe('source_parity_structure_fixtures: running-tests/the-command-line-cli', () => {
  it('Issue #247 End-to-End 解消以降、structure issue は 0 件を維持する', () => {
    assertStructureClean(PINNED_THE_CLI.slug);
  });
});

describe('source_parity_structure_fixtures: results/test-results/network-logs', () => {
  it('Issue #247 End-to-End 解消以降、structure issue は 0 件を維持する', () => {
    assertStructureClean(PINNED_NETWORK_LOGS.slug);
  });
});

describe('source_parity_structure_fixtures: advanced-editing/validations/email-validation', () => {
  it('Issue #247 End-to-End 解消以降、structure issue は 0 件を維持する', () => {
    assertStructureClean(PINNED_EMAIL_VALIDATION.slug);
  });
});

// ---------------------------------------------------------------------------
// Issue #247 post-merge — Phase H.3 — artifact regression fixture
//
// Phase E で JA 側を整えて完全に clean green に到達した 2 slug
// (custom-action-step-mobile と test-runs) について、structure mismatch が
// 0 件であることを pin する。将来の extractor / preprocessor 変更で再発した
// 場合にここで捕まえる regression guard。
// ---------------------------------------------------------------------------
function assertStructureClean(slug) {
  const { structureIssues } = runStructureComparator(slug);
  assert.equal(
    structureIssues.length,
    0,
    `${slug}: Phase E で clean 化済みだが structure issue が ` +
      `${structureIssues.length} 件検出された。` +
      `最初の issue: ${JSON.stringify(structureIssues[0] ?? null)}`,
  );
}

describe('source_parity_structure_fixtures: custom-action-step-mobile (Phase E artifact)', () => {
  it('Phase E 以降、structure issue は 0 件を維持する (artifact regression guard)', () => {
    assertStructureClean('advanced-editing/custom-action-step-mobile');
  });
});

describe('source_parity_structure_fixtures: test-runs (Phase E artifact)', () => {
  it('Phase E 以降、structure issue は 0 件を維持する (artifact regression guard)', () => {
    assertStructureClean('results/test-runs');
  });
});
