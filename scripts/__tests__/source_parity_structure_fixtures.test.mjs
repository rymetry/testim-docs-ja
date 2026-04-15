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
  const alignment = alignSegments(enSegments, jaSegments, { slug });
  const issues = parityDiffsToIssues(alignment.diffs);
  const structureIssues = issues.filter(
    (i) => i.type === 'section-structure-mismatch' || i.type === 'segment-order-mismatch',
  );
  return { alignment, issues, structureIssues };
}

// ---------------------------------------------------------------------------
// 代表ページの slug。
// ---------------------------------------------------------------------------

const SLUG_THE_CLI = 'running-tests/the-command-line-cli';
const SLUG_NETWORK_LOGS = 'results/test-results/network-logs';
const SLUG_EMAIL_VALIDATION = 'advanced-editing/validations/email-validation';

// ---------------------------------------------------------------------------
// 3 代表ページは現在 structure issue 0 件を維持することを期待する。
// ---------------------------------------------------------------------------
describe('source_parity_structure_fixtures: running-tests/the-command-line-cli', () => {
  it('structure issue は 0 件を維持する', () => {
    assertStructureClean(SLUG_THE_CLI);
  });
});

describe('source_parity_structure_fixtures: results/test-results/network-logs', () => {
  it('structure issue は 0 件を維持する', () => {
    assertStructureClean(SLUG_NETWORK_LOGS);
  });
});

describe('source_parity_structure_fixtures: advanced-editing/validations/email-validation', () => {
  it('structure issue は 0 件を維持する', () => {
    assertStructureClean(SLUG_EMAIL_VALIDATION);
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
