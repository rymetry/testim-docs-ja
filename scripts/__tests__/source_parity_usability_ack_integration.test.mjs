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
  it('faq (escaped-details-residue) は detailIncludes で ack 可能', () => {
    const rawEnHtml = readFileSync(
      join(SNAPSHOTS_DIR, 'salesforce-testing/faq.html'),
      'utf8',
    );
    const jaBody = extractJaBody(
      readFileSync(join(JA_CONTENT_DIR, 'salesforce-testing/faq.md'), 'utf8'),
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
    assert.ok(issue, 'detector は issue を返すべき');
    assert.equal(issue.type, 'source-unusable');

    const fingerprint = computeSnapshotFingerprint(rawEnHtml);
    const entry = buildAckEntry({
      slug: 'salesforce-testing/faq',
      issueType: 'source-unusable',
      detailIncludes: '[reason=escaped-details-residue]',
      fingerprint,
    });

    const match = findMatchingAcknowledgement(
      'salesforce-testing/faq',
      issue,
      [entry],
      fingerprint,
      '2026-04-09',
    );
    assert.ok(
      match,
      '[reason=escaped-details-residue] は実 emitter 出力の detail 末尾に含まれるべき ' +
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
