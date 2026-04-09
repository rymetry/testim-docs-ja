/**
 * structure regression guard。
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
 * 下の `PINNED_*` は historical data の参照値で、主アサーションは
 * `assertStructureClean()` が担当する。
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
// Historical pin 値。
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
// 3 代表ページは現在 structure issue 0 件を維持することを期待する。
// ---------------------------------------------------------------------------
describe('source_parity_structure_fixtures: running-tests/the-command-line-cli', () => {
  it('structure issue は 0 件を維持する', () => {
    assertStructureClean(PINNED_THE_CLI.slug);
  });
});

describe('source_parity_structure_fixtures: results/test-results/network-logs', () => {
  it('structure issue は 0 件を維持する', () => {
    assertStructureClean(PINNED_NETWORK_LOGS.slug);
  });
});

describe('source_parity_structure_fixtures: advanced-editing/validations/email-validation', () => {
  it('structure issue は 0 件を維持する', () => {
    assertStructureClean(PINNED_EMAIL_VALIDATION.slug);
  });
});

// ---------------------------------------------------------------------------
// artifact regression fixture
// ---------------------------------------------------------------------------
function assertStructureClean(slug) {
  const { structureIssues } = runStructureComparator(slug);
  assert.equal(
    structureIssues.length,
    0,
    `${slug}: clean page だが structure issue が ` +
      `${structureIssues.length} 件検出された。` +
      `最初の issue: ${JSON.stringify(structureIssues[0] ?? null)}`,
  );
}

describe('source_parity_structure_fixtures: custom-action-step-mobile (artifact)', () => {
  it('structure issue は 0 件を維持する', () => {
    assertStructureClean('advanced-editing/custom-action-step-mobile');
  });
});

describe('source_parity_structure_fixtures: test-runs (artifact)', () => {
  it('structure issue は 0 件を維持する', () => {
    assertStructureClean('results/test-runs');
  });
});
