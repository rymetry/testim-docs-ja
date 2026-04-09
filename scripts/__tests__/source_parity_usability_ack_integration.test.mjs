/**
 * detectSourceUsability → findMatchingAcknowledgement の結合テスト。
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

describe('detector→matcher round-trip (source-unusable)', () => {
  // 実ファイル依存を避けるため、合成 HTML で detector を直接発火させる。
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

  it('shallow-snapshot (合成 HTML) は detailIncludes で ack 可能', () => {
    // 実ファイル依存を避けるため、shallow-snapshot も合成入力で再現する。
    const rawEnHtml = '<h1>Stub</h1><p>single short paragraph.</p>';
    const enSegments = [
      { segmentKind: 'heading', sectionPath: 'Top', textNorm: 'stub' },
      { segmentKind: 'paragraph', sectionPath: 'Top', textNorm: 'single short paragraph.' },
    ];
    // jaSegments is much larger → 5× ratio triggers shallow-snapshot Layer 3
    const jaSegments = Array.from({ length: 12 }, (_, i) => ({
      segmentKind: 'paragraph',
      sectionPath: `セクション ${i + 1}`,
      textNorm: `日本語本文 ${i + 1}`,
    }));

    const issue = detectSourceUsability({ rawEnHtml, enSegments, jaSegments });
    assert.ok(issue, 'detector は shallow-snapshot issue を返すべき');
    assert.equal(issue.type, 'snapshot-incomplete');
    assert.equal(issue.usabilitySignals.reason, 'shallow-snapshot');

    const fingerprint = computeSnapshotFingerprint(rawEnHtml);
    const entry = buildAckEntry({
      slug: 'synthetic/shallow-snapshot',
      issueType: 'snapshot-incomplete',
      detailIncludes: '[reason=shallow-snapshot]',
      fingerprint,
    });

    const match = findMatchingAcknowledgement(
      'synthetic/shallow-snapshot',
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
