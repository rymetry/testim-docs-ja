/**
 * detectSourceUsability の fixture integration テスト。
 *
 * 設計書 §4.5.2 に対応。実 snapshot ファイルを読み込んで detector を呼び、
 * type / reason を assert する。
 *
 * 現行契約:
 *   - `salesforce-testing/salesforce-testing-overview` → **usable** (detector returns null)
 *     (JA を EN shallow snapshot に合わせて trim したため、EN/JA 共に minimal で
 *      shallow-snapshot heuristic の発火条件を満たさない)
 *   - `salesforce-testing/faq`                        → **usable** (detector returns null)
 *     (Phase F.2.5 で `normalizeEscapedFaqDetails` が valid sibling `<h2>/<p>` block
 *      に再構成するため、broken details tree が消えて detector の Layer 2 が発火しない)
 *   - `advanced-editing/coding-assistant`             → **usable** (detector returns null)
 *     (balanced escaped `<details>` + enHeading≥1 では発火しない)
 *
 * shallow-snapshot の raw 検知契約そのものは
 * `source_parity_source_usability.test.mjs` 側の合成 HTML テストが担保する。
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let detectSourceUsability;
let extractSegmentsFromHtml;
let extractSegmentsFromMarkdown;
let alignSegments;
let parityDiffsToIssues;

before(async () => {
  ({ detectSourceUsability } = await import('../lib/source_parity_source_usability.mjs'));
  ({ extractSegmentsFromHtml } = await import('../lib/source_parity_segments_en.mjs'));
  ({ extractSegmentsFromMarkdown } = await import('../lib/source_parity_segments_ja.mjs'));
  ({ alignSegments, parityDiffsToIssues } = await import('../lib/source_parity_align.mjs'));
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
  it('JA を EN shallow snapshot に合わせて trim 済みのため usability issue は出ない', () => {
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

    assert.equal(
      result,
      null,
      `salesforce-testing-overview は post-resolution では usable と判定されるべき。actual: ${JSON.stringify(result)}`,
    );
  });
});

// ---------------------------------------------------------------------------
// advanced-editing/coding-assistant (リグレッション fixture — P1 fix §4.6.1)
//
// このページは <details> の使用例を本文中に含むため preprocessEnHtml 後も
// balanced な escaped marker が残るが、enHeading=1 のため Layer 2 は
// hasSectionAnchorFailure=false → detectSourceUsability は null を返すべき。
// ---------------------------------------------------------------------------

describe('detectSourceUsability fixture: advanced-editing/coding-assistant', () => {
  it('null を返す (Layer 2 は balanced escaped markers + enHeading≥1 では発火しない)', () => {
    const rawEnHtml = readFileSync(
      join(SNAPSHOTS_DIR, 'advanced-editing/coding-assistant.html'),
      'utf8',
    );
    const jaMd = readFileSync(
      join(JA_CONTENT_DIR, 'advanced-editing/coding-assistant.md'),
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

    assert.equal(
      result,
      null,
      `coding-assistant は usability issue を返すべきでない。` +
        `enSegments=${enSegments.length}, jaSegments=${jaSegments.length}`,
    );
  });

  it('coding-assistant は enHeadingSegmentCount >= 1 を持つ', () => {
    const rawEnHtml = readFileSync(
      join(SNAPSHOTS_DIR, 'advanced-editing/coding-assistant.html'),
      'utf8',
    );

    let enSegments = [];
    try {
      enSegments = extractSegmentsFromHtml(rawEnHtml);
    } catch (_) {
      // extractError ならこのテストは skip 相当
    }

    const enHeadingCount = enSegments.filter(s => s.segmentKind === 'heading').length;
    assert.ok(
      enHeadingCount >= 1,
      `enHeadingSegmentCount=${enHeadingCount} は 1 以上であるべき (hasSectionAnchorFailure=false の前提)`,
    );
  });

  it('extractError を強制しても null を返す (coding-assistant + extractError ライク)', () => {
    // balanced escaped markers (open=4, close=4) は hasImbalancedDetailsTree=false
    // → extractError 経路でも source-unusable に昇格しない (§4.6.1 リグレッション)
    const rawEnHtml = readFileSync(
      join(SNAPSHOTS_DIR, 'advanced-editing/coding-assistant.html'),
      'utf8',
    );
    const jaMd = readFileSync(
      join(JA_CONTENT_DIR, 'advanced-editing/coding-assistant.md'),
      'utf8',
    );
    const jaBody = extractJaBody(jaMd);
    const jaSegments = extractSegmentsFromMarkdown(jaBody);

    // extractError を強制して extractError 経路だけを評価する
    const simulatedError = new Error('simulated extractor failure');
    const result = detectSourceUsability({
      rawEnHtml,
      enSegments: [],
      jaSegments,
      extractError: simulatedError,
    });

    assert.equal(
      result,
      null,
      `coding-assistant + extractError は null を返すべき (balanced open=close は source-unusable 非発火)`,
    );
  });

  it('runtime: source-unusable を出さず segment-* issue が生成される', () => {
    // gate が null を返す → alignSegments が走り → 通常の segment-* diffs が出る。
    // ここでは alignSegments + parityDiffsToIssues を直接呼んで確認する。
    const rawEnHtml = readFileSync(
      join(SNAPSHOTS_DIR, 'advanced-editing/coding-assistant.html'),
      'utf8',
    );
    const jaMd = readFileSync(
      join(JA_CONTENT_DIR, 'advanced-editing/coding-assistant.md'),
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

    // gate は null のはず (上のテストで確認済み)
    const usabilityIssue = detectSourceUsability({ rawEnHtml, enSegments, jaSegments, extractError });
    assert.equal(usabilityIssue, null, 'gate は null を返すべき');

    // extractError がない場合のみ alignSegments を検証する
    if (!extractError) {
      const alignment = alignSegments(enSegments, jaSegments);
      const issues = parityDiffsToIssues(alignment.diffs);
      // source-unusable は出ない
      const sourceUnusable = issues.filter(i => i.type === 'source-unusable');
      assert.equal(sourceUnusable.length, 0, 'source-unusable は出るべきでない');
      // segment-* issue が 1 件以上ある (parity diffs が存在する)
      const segmentIssues = issues.filter(i => i.type.startsWith('segment-'));
      assert.ok(
        segmentIssues.length >= 1,
        `segment-* issue が少なくとも 1 件あるべき。実際: ${segmentIssues.map(i => i.type).join(', ')}`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// salesforce-testing/faq
// ---------------------------------------------------------------------------

describe('detectSourceUsability fixture: salesforce-testing/faq (Phase F.2.5 完了後)', () => {
  it('Phase F.2.5 で normalizeEscapedFaqDetails が発火し detector は null を返す', () => {
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

    assert.equal(
      result,
      null,
      `faq は Phase F.2.5 以降 usable と判定されるべき。` +
        `actual type=${result?.type}, reason=${result?.usabilitySignals?.reason}`,
    );
  });

  it('Phase F.2.5 後: faq は extractor で heading=5 / details-summary=0 を生成する', () => {
    const rawEnHtml = readFileSync(
      join(SNAPSHOTS_DIR, 'salesforce-testing/faq.html'),
      'utf8',
    );
    const enSegs = extractSegmentsFromHtml(rawEnHtml);
    const headings = enSegs.filter((s) => s.segmentKind === 'heading');
    const detailSummaries = enSegs.filter((s) => s.segmentKind === 'details-summary');
    // 5 つの FAQ 項目がすべて valid `<h2>` anchor に再構成されている
    assert.equal(headings.length, 5, `faq の heading 件数が 5 でない: ${headings.length}`);
    // details-summary kind は 0 件 — frozen vocabulary は既存のまま、faq は
    // preprocessor で既に `<h2>` に置き換わっているので emit されない
    assert.equal(
      detailSummaries.length,
      0,
      `faq に details-summary が残っている: ${detailSummaries.length}`,
    );
  });
});
