/**
 * detectSourceUsability の fixture integration テスト (Issue #247 PR3)。
 *
 * 設計書 §4.5.2 に対応。実 snapshot ファイルを読み込んで detector を呼び、
 * type / reason を assert する。
 *
 * 対象 2 ページ:
 *   - salesforce-testing/salesforce-testing-overview → snapshot-incomplete / shallow-snapshot
 *   - salesforce-testing/faq                        → source-unusable   / escaped-details-residue
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let detectSourceUsability;
let extractSegmentsFromHtml;
let extractSegmentsFromMarkdown;

before(async () => {
  ({ detectSourceUsability } = await import('../lib/source_parity_source_usability.mjs'));
  ({ extractSegmentsFromHtml } = await import('../lib/source_parity_segments_en.mjs'));
  ({ extractSegmentsFromMarkdown } = await import('../lib/source_parity_segments_ja.mjs'));
});

const ROOT = join(import.meta.dirname, '../../');
const SNAPSHOTS_DIR = join(ROOT, 'snapshots/en/content');
const JA_CONTENT_DIR = join(ROOT, 'src/content/docs');

// ---------------------------------------------------------------------------
// Helper: JA の doc.body 部分 (frontmatter を除いた本文) を抽出する。
// source_parity_checks.mjs の gray-matter 相当を最小実装する。
// ---------------------------------------------------------------------------
function extractJaBody(mdContent) {
  // frontmatter (--- ... ---) を除去
  const withoutFm = mdContent.replace(/^---[\s\S]*?---\n/m, '');
  return withoutFm.trim();
}

// ---------------------------------------------------------------------------
// salesforce-testing/salesforce-testing-overview
// ---------------------------------------------------------------------------

describe('detectSourceUsability fixture: salesforce-testing/salesforce-testing-overview', () => {
  it('shallow-snapshot を検出する (snapshot-incomplete / reason=shallow-snapshot)', () => {
    const rawEnHtml = readFileSync(
      join(SNAPSHOTS_DIR, 'salesforce-testing/salesforce-testing-overview.html'),
      'utf8',
    );
    const jaMd = readFileSync(
      join(JA_CONTENT_DIR, 'salesforce-testing/salesforce-testing-overview.md'),
      'utf8',
    );
    const jaBody = extractJaBody(jaMd);

    let enSegments = [];
    let extractError = null;
    try {
      enSegments = extractSegmentsFromHtml(rawEnHtml);
    } catch (e) {
      extractError = e;
    }
    const jaSegments = extractSegmentsFromMarkdown(jaBody);

    const result = detectSourceUsability({ rawEnHtml, enSegments, jaSegments, extractError });

    assert.ok(
      result !== null,
      `salesforce-testing-overview は usability issue を返すべき。rawEnHtml.length=${rawEnHtml.length}, enSegments=${enSegments.length}, jaSegments=${jaSegments.length}`,
    );
    assert.equal(result.type, 'snapshot-incomplete');
    assert.equal(result.usabilitySignals.reason, 'shallow-snapshot');
  });
});

// ---------------------------------------------------------------------------
// salesforce-testing/faq
// ---------------------------------------------------------------------------

describe('detectSourceUsability fixture: salesforce-testing/faq', () => {
  it('escaped-details-residue を検出する (source-unusable / reason=escaped-details-residue)', () => {
    const rawEnHtml = readFileSync(
      join(SNAPSHOTS_DIR, 'salesforce-testing/faq.html'),
      'utf8',
    );
    const jaMd = readFileSync(
      join(JA_CONTENT_DIR, 'salesforce-testing/faq.md'),
      'utf8',
    );
    const jaBody = extractJaBody(jaMd);

    let enSegments = [];
    let extractError = null;
    try {
      enSegments = extractSegmentsFromHtml(rawEnHtml);
    } catch (e) {
      extractError = e;
    }
    const jaSegments = extractSegmentsFromMarkdown(jaBody);

    const result = detectSourceUsability({ rawEnHtml, enSegments, jaSegments, extractError });

    assert.ok(
      result !== null,
      `faq は usability issue を返すべき。rawEnHtml.length=${rawEnHtml.length}, enSegments=${enSegments.length}, jaSegments=${jaSegments.length}`,
    );
    assert.equal(result.type, 'source-unusable');
    assert.equal(result.usabilitySignals.reason, 'escaped-details-residue');
  });

  it('faq は residualEscapedDetailsClose >= 1 を持つ', () => {
    const rawEnHtml = readFileSync(
      join(SNAPSHOTS_DIR, 'salesforce-testing/faq.html'),
      'utf8',
    );
    const jaMd = readFileSync(
      join(JA_CONTENT_DIR, 'salesforce-testing/faq.md'),
      'utf8',
    );
    const jaBody = extractJaBody(jaMd);

    let enSegments = [];
    let extractError = null;
    try {
      enSegments = extractSegmentsFromHtml(rawEnHtml);
    } catch (e) {
      extractError = e;
    }
    const jaSegments = extractSegmentsFromMarkdown(jaBody);

    const result = detectSourceUsability({ rawEnHtml, enSegments, jaSegments, extractError });

    assert.ok(result !== null);
    assert.ok(
      result.usabilitySignals.residualEscapedDetailsClose >= 1,
      `residualEscapedDetailsClose=${result.usabilitySignals.residualEscapedDetailsClose} は 1 以上であるべき`,
    );
  });
});
