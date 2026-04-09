/**
 * Issue #247 post-merge — detectSourceUsability → findMatchingAcknowledgement の
 * round-trip 結合テスト。実 emitter の出力に対して ack matcher が機能することを
 * 保証する。fabricated detail string で通るテストの再発を防ぐセーフティネット。
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let detectSourceUsability;
let extractSegmentsFromHtml;
let extractSegmentsFromMarkdown;
let findMatchingAcknowledgement;
let computeSnapshotFingerprint;

before(async () => {
  ({ detectSourceUsability } = await import('../lib/source_parity_source_usability.mjs'));
  ({ extractSegmentsFromHtml } = await import('../lib/source_parity_segments_en.mjs'));
  ({ extractSegmentsFromMarkdown } = await import('../lib/source_parity_segments_ja.mjs'));
  ({ findMatchingAcknowledgement, computeSnapshotFingerprint } = await import(
    '../lib/source_parity_acknowledgements.mjs'
  ));
});

const ROOT = join(import.meta.dirname, '../../');
const SNAPSHOTS_DIR = join(ROOT, 'snapshots/en/content');
const JA_CONTENT_DIR = join(ROOT, 'src/content/docs');

function extractJaBody(md) {
  return md.replace(/^---[\s\S]*?---\n/m, '').trim();
}

function buildAckEntry({ slug, issueType, detailIncludes, fingerprint }) {
  return {
    slug,
    issueType,
    sourceFingerprint: fingerprint,
    reason: 'known source-side debt, tracked in ops queue',
    owner: 'snapshot-ops',
    reviewAfter: '2027-01-01',
    detailIncludes,
  };
}

describe('Issue #247 post-merge — detector→matcher round-trip (source-unusable)', () => {
  // Phase F.2.5 で `faq` は preprocessor 段階で正規化され、もはや
  // `source-unusable (escaped-details-residue)` を emit しない。そのため
  // 本 contract の round-trip 検証は合成 HTML で Layer 2 を直接トリガする。
  // JA 側の segments も手作りすれば実ファイル依存を持たず、将来 faq の
  // JA が変更されても本 test は壊れない。
  it('escaped-details-residue (合成 HTML) は detailIncludes で ack 可能', () => {
    // orphan な `&lt;/details&gt;` close を持つだけの <p> — faq 正規化は
    // firstOpens !== firstCloses 条件で発火しないため preprocess 後も
    // escaped marker が残り、detector の Layer 2 が発火する。
    const rawEnHtml = '<p>Some legacy body text &lt;/details&gt;</p>';
    const enSegments = []; // body も heading も 0
    const jaSegments = [
      { segmentKind: 'heading', sectionPath: 'Top', text: 'トップ' },
      { segmentKind: 'heading', sectionPath: 'Q1', text: 'セクション 1' },
      { segmentKind: 'heading', sectionPath: 'Q2', text: 'セクション 2' },
      { segmentKind: 'paragraph', sectionPath: 'Q1', text: '本文' },
    ];

    const issue = detectSourceUsability({ rawEnHtml, enSegments, jaSegments });
    assert.ok(issue, 'detector は source-unusable issue を返すべき');
    assert.equal(issue.type, 'source-unusable');
    assert.equal(issue.usabilitySignals.reason, 'escaped-details-residue');

    const fingerprint = computeSnapshotFingerprint(rawEnHtml);
    const entry = buildAckEntry({
      slug: 'synthetic/escaped-details-residue',
      issueType: 'source-unusable',
      detailIncludes: '[reason=escaped-details-residue]',
      fingerprint,
    });

    const match = findMatchingAcknowledgement(
      'synthetic/escaped-details-residue',
      issue,
      [entry],
      fingerprint,
      '2026-04-09',
    );
    assert.ok(
      match,
      '[reason=escaped-details-residue] は detail 末尾に含まれるべき ' +
        `(actual detail=${JSON.stringify(issue.detail)})`,
    );
    assert.equal(match.expired, false);
  });

  it('salesforce-testing-overview (shallow-snapshot) は detailIncludes で ack 可能', () => {
    const rawEnHtml = readFileSync(
      join(SNAPSHOTS_DIR, 'salesforce-testing/salesforce-testing-overview.html'),
      'utf8',
    );
    const jaBody = extractJaBody(
      readFileSync(
        join(JA_CONTENT_DIR, 'salesforce-testing/salesforce-testing-overview.md'),
        'utf8',
      ),
    );
    let enSegments = [];
    let extractError = null;
    try {
      enSegments = extractSegmentsFromHtml(rawEnHtml);
    } catch (e) {
      extractError = e;
    }
    const jaSegments = extractSegmentsFromMarkdown(jaBody);

    const issue = detectSourceUsability({ rawEnHtml, enSegments, jaSegments, extractError });
    assert.ok(issue);
    assert.equal(issue.type, 'snapshot-incomplete');

    const fingerprint = computeSnapshotFingerprint(rawEnHtml);
    const entry = buildAckEntry({
      slug: 'salesforce-testing/salesforce-testing-overview',
      issueType: 'snapshot-incomplete',
      detailIncludes: '[reason=shallow-snapshot]',
      fingerprint,
    });

    const match = findMatchingAcknowledgement(
      'salesforce-testing/salesforce-testing-overview',
      issue,
      [entry],
      fingerprint,
      '2026-04-09',
    );
    assert.ok(
      match,
      '[reason=shallow-snapshot] は実 emitter 出力の detail 末尾に含まれるべき ' +
        `(actual detail=${JSON.stringify(issue.detail)})`,
    );
  });
});
