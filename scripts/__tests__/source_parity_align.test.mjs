/**
 * Tests for the section-anchored exact diff engine (Issue #225 Phase 5).
 *
 * The alignment module groups EN and JA canonical segments by heading-bounded
 * sections, runs an LCS-based local diff over the body of each section, and
 * emits one of the gate-eligible parity diff types per unmatched / mismatched
 * segment:
 *
 *   - segment-missing      EN has a segment, JA does not
 *   - segment-extra        JA has a segment, EN does not
 *   - segment-untranslated JA has an English-only segment that should be JA
 *   - segment-token-gap    matched JA segment is missing an EN invariant token
 *   - segment-shifted      same kind exists on both sides but in different
 *                          positions within the section (best-effort,
 *                          token-anchored where possible)
 *
 * The tests use synthetic Segment records constructed with createSegment so
 * that schema invariants (sectionPath / segmentKind / segmentIndex / tokens)
 * stay in sync with the production extractors.
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let alignSegments;
let createSegment;

before(async () => {
  ({ alignSegments } = await import('../lib/source_parity_align.mjs'));
  ({ createSegment } = await import('../lib/source_parity_segments_shared.mjs'));
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSeg(sectionPath, kind, segmentIndex, rawText) {
  return createSegment({ sectionPath, kind, segmentIndex, rawText });
}

function makeHeading(sectionPath, segmentIndex, rawText) {
  return makeSeg(sectionPath, 'heading', segmentIndex, rawText);
}

function diffsByType(diffs) {
  const grouped = {};
  for (const d of diffs) {
    grouped[d.type] = (grouped[d.type] ?? 0) + 1;
  }
  return grouped;
}

// ---------------------------------------------------------------------------
// alignSegments — empty / identical
// ---------------------------------------------------------------------------

describe('alignSegments — empty / identical inputs', () => {
  it('returns no diffs for two empty sequences', () => {
    const result = alignSegments([], []);
    assert.deepEqual(result.diffs, []);
    assert.equal(result.sectionsAligned, 1); // preface only
  });

  it('returns no diffs when EN and JA segment kind sequences are identical', () => {
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'EN intro paragraph.'),
      makeSeg('Setup', 'unordered-list-item', 0, 'EN bullet one'),
      makeSeg('Setup', 'unordered-list-item', 1, 'EN bullet two'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'paragraph', 0, 'JA 紹介段落'),
      makeSeg('セットアップ', 'unordered-list-item', 0, 'JA 箇条書き 1'),
      makeSeg('セットアップ', 'unordered-list-item', 1, 'JA 箇条書き 2'),
    ];
    const result = alignSegments(en, ja);
    assert.deepEqual(result.diffs, []);
  });

  it('preface (segments before any heading) is aligned as a section', () => {
    const en = [
      makeSeg('', 'paragraph', 0, 'Intro paragraph in preface.'),
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'Body paragraph.'),
    ];
    const ja = [
      // JA missing the preface paragraph
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'paragraph', 0, '本文段落'),
    ];
    const result = alignSegments(en, ja);
    const grouped = diffsByType(result.diffs);
    assert.equal(grouped['segment-missing'], 1, 'preface paragraph missing');
    const missing = result.diffs.find((d) => d.type === 'segment-missing');
    assert.equal(missing.segmentKind, 'paragraph');
  });
});

// ---------------------------------------------------------------------------
// segment-missing — diff=1 paragraph deletion
// ---------------------------------------------------------------------------

describe('alignSegments — segment-missing', () => {
  it('detects a single missing paragraph as exactly one segment-missing diff', () => {
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'First paragraph.'),
      makeSeg('Setup', 'paragraph', 1, 'Second paragraph.'),
      makeSeg('Setup', 'paragraph', 2, 'Third paragraph.'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'paragraph', 0, '段落 1'),
      // Second paragraph deleted
      makeSeg('セットアップ', 'paragraph', 1, '段落 3'),
    ];
    const result = alignSegments(en, ja);
    const grouped = diffsByType(result.diffs);
    assert.equal(grouped['segment-missing'], 1);
    assert.equal(result.diffs.length, 1, 'exactly one diff — no cascade');
    assert.equal(result.diffs[0].segmentKind, 'paragraph');
  });

  it('detects a single missing bullet as exactly one segment-missing diff', () => {
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'unordered-list-item', 0, 'Bullet one'),
      makeSeg('Setup', 'unordered-list-item', 1, 'Bullet two'),
      makeSeg('Setup', 'unordered-list-item', 2, 'Bullet three'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'unordered-list-item', 0, '箇条 1'),
      makeSeg('セットアップ', 'unordered-list-item', 1, '箇条 3'),
    ];
    const result = alignSegments(en, ja);
    assert.equal(result.diffs.length, 1);
    assert.equal(result.diffs[0].type, 'segment-missing');
    assert.equal(result.diffs[0].segmentKind, 'unordered-list-item');
  });

  it('detects a missing ordered-list-item as one diff', () => {
    const en = [
      makeHeading('Steps', 0, 'Steps'),
      makeSeg('Steps', 'ordered-list-item', 0, 'Step 1'),
      makeSeg('Steps', 'ordered-list-item', 1, 'Step 2'),
      makeSeg('Steps', 'ordered-list-item', 2, 'Step 3'),
    ];
    const ja = [
      makeHeading('手順', 0, '手順'),
      makeSeg('手順', 'ordered-list-item', 0, '手順 1'),
      makeSeg('手順', 'ordered-list-item', 1, '手順 3'),
    ];
    const result = alignSegments(en, ja);
    assert.equal(result.diffs.length, 1);
    assert.equal(result.diffs[0].type, 'segment-missing');
  });

  it('detects a missing callout-body as one diff', () => {
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'callout-body', 0, 'EN callout para A'),
      makeSeg('Setup', 'callout-body', 1, 'EN callout para B'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'callout-body', 0, 'JA callout 文 A'),
      // JA missing the second callout body paragraph
    ];
    const result = alignSegments(en, ja);
    assert.equal(result.diffs.length, 1);
    assert.equal(result.diffs[0].type, 'segment-missing');
    assert.equal(result.diffs[0].segmentKind, 'callout-body');
  });

  it('detects a missing table-cell as one diff', () => {
    const en = [
      makeHeading('Args', 0, 'Args'),
      makeSeg('Args', 'table-cell', 0, '`--proxy`'),
      makeSeg('Args', 'table-cell', 1, 'The HTTP proxy URL.'),
      makeSeg('Args', 'table-cell', 2, '`--token`'),
      makeSeg('Args', 'table-cell', 3, 'The API token.'),
    ];
    const ja = [
      makeHeading('引数', 0, '引数'),
      makeSeg('引数', 'table-cell', 0, '`--proxy`'),
      makeSeg('引数', 'table-cell', 1, 'HTTP プロキシ URL'),
      makeSeg('引数', 'table-cell', 2, '`--token`'),
      // 4th cell deleted
    ];
    const result = alignSegments(en, ja);
    const missingDiffs = result.diffs.filter((d) => d.type === 'segment-missing');
    assert.ok(missingDiffs.length >= 1, 'at least one segment-missing emitted');
    assert.equal(missingDiffs[0].segmentKind, 'table-cell');
  });
});

// ---------------------------------------------------------------------------
// segment-extra
// ---------------------------------------------------------------------------

describe('alignSegments — segment-extra', () => {
  it('detects a single extra JA paragraph as one segment-extra diff', () => {
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'Paragraph one.'),
      makeSeg('Setup', 'paragraph', 1, 'Paragraph two.'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'paragraph', 0, '段落 1'),
      makeSeg('セットアップ', 'paragraph', 1, '余分な段落'),
      makeSeg('セットアップ', 'paragraph', 2, '段落 2'),
    ];
    const result = alignSegments(en, ja);
    assert.equal(result.diffs.length, 1);
    assert.equal(result.diffs[0].type, 'segment-extra');
    assert.equal(result.diffs[0].segmentKind, 'paragraph');
  });
});

// ---------------------------------------------------------------------------
// segment-untranslated
// ---------------------------------------------------------------------------

describe('alignSegments — segment-untranslated', () => {
  it('flags a JA paragraph that is entirely English as segment-untranslated', () => {
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'Click on the Settings button to begin.'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'paragraph', 0, 'Click on the Settings button to begin.'),
    ];
    const result = alignSegments(en, ja);
    const untranslated = result.diffs.filter((d) => d.type === 'segment-untranslated');
    assert.equal(untranslated.length, 1);
    assert.equal(untranslated[0].segmentKind, 'paragraph');
  });

  it('does not flag a properly translated JA paragraph', () => {
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'Click on the Settings button to begin.'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'paragraph', 0, '設定ボタンをクリックして開始します。'),
    ];
    const result = alignSegments(en, ja);
    const untranslated = result.diffs.filter((d) => d.type === 'segment-untranslated');
    assert.equal(untranslated.length, 0);
  });

  it('does not flag a JA paragraph whose only ASCII content is an invariant token', () => {
    const en = [
      makeHeading('CLI', 0, 'CLI'),
      makeSeg('CLI', 'paragraph', 0, '`--proxy` flag accepts a URL.'),
    ];
    const ja = [
      makeHeading('CLI', 0, 'CLI'),
      makeSeg('CLI', 'paragraph', 0, '`--proxy` フラグは URL を受け取ります。'),
    ];
    const result = alignSegments(en, ja);
    const untranslated = result.diffs.filter((d) => d.type === 'segment-untranslated');
    assert.equal(untranslated.length, 0);
  });
});

// ---------------------------------------------------------------------------
// segment-token-gap
// ---------------------------------------------------------------------------

describe('alignSegments — segment-token-gap', () => {
  it('emits segment-token-gap when a matched JA paragraph drops an EN invariant token', () => {
    const en = [
      makeHeading('CLI', 0, 'CLI'),
      makeSeg('CLI', 'paragraph', 0, 'Run with `--proxy` to use an HTTP proxy.'),
    ];
    const ja = [
      makeHeading('CLI', 0, 'CLI'),
      // The token `--proxy` was dropped from the JA paragraph
      makeSeg('CLI', 'paragraph', 0, 'HTTP プロキシを使うには起動します。'),
    ];
    const result = alignSegments(en, ja);
    const gaps = result.diffs.filter((d) => d.type === 'segment-token-gap');
    assert.equal(gaps.length, 1);
    assert.ok(Array.isArray(gaps[0].missingTokens));
    assert.ok(gaps[0].missingTokens.includes('--proxy'));
  });

  it('does not emit token-gap when the JA paragraph contains the same token', () => {
    const en = [
      makeHeading('CLI', 0, 'CLI'),
      makeSeg('CLI', 'paragraph', 0, 'Run with `--proxy` to use an HTTP proxy.'),
    ];
    const ja = [
      makeHeading('CLI', 0, 'CLI'),
      makeSeg('CLI', 'paragraph', 0, '`--proxy` を指定して HTTP プロキシを使用します。'),
    ];
    const result = alignSegments(en, ja);
    const gaps = result.diffs.filter((d) => d.type === 'segment-token-gap');
    assert.equal(gaps.length, 0);
  });
});

// ---------------------------------------------------------------------------
// section anchoring
// ---------------------------------------------------------------------------

describe('alignSegments — section anchoring', () => {
  it('groups diffs by their section path', () => {
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'Setup paragraph one.'),
      makeSeg('Setup', 'paragraph', 1, 'Setup paragraph two.'),
      makeHeading('Run', 0, 'Run'),
      makeSeg('Run', 'paragraph', 0, 'Run paragraph one.'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'paragraph', 0, 'セットアップ段落 1'),
      // setup paragraph 2 missing
      makeHeading('実行', 0, '実行'),
      makeSeg('実行', 'paragraph', 0, '実行段落 1'),
    ];
    const result = alignSegments(en, ja);
    assert.equal(result.diffs.length, 1);
    const diff = result.diffs[0];
    assert.equal(diff.type, 'segment-missing');
    // sectionPath comes from the EN side because EN owns the missing segment
    assert.equal(diff.sectionPath, 'Setup');
  });

  it('does not cascade across section boundaries — a missing segment in one section ' +
     'leaves the next section diff-free', () => {
    const en = [
      makeHeading('A', 0, 'A'),
      makeSeg('A', 'paragraph', 0, 'A1'),
      makeSeg('A', 'paragraph', 1, 'A2'),
      makeHeading('B', 0, 'B'),
      makeSeg('B', 'paragraph', 0, 'B1'),
      makeSeg('B', 'paragraph', 1, 'B2'),
      makeHeading('C', 0, 'C'),
      makeSeg('C', 'paragraph', 0, 'C1'),
    ];
    const ja = [
      makeHeading('A-ja', 0, 'A-ja'),
      makeSeg('A-ja', 'paragraph', 0, 'A1-ja'),
      // A2 missing
      makeHeading('B-ja', 0, 'B-ja'),
      makeSeg('B-ja', 'paragraph', 0, 'B1-ja'),
      makeSeg('B-ja', 'paragraph', 1, 'B2-ja'),
      makeHeading('C-ja', 0, 'C-ja'),
      makeSeg('C-ja', 'paragraph', 0, 'C1-ja'),
    ];
    const result = alignSegments(en, ja);
    assert.equal(result.diffs.length, 1, 'no cascade — exactly one diff');
    assert.equal(result.diffs[0].sectionPath, 'A');
  });
});

// ---------------------------------------------------------------------------
// heading count mismatch
// ---------------------------------------------------------------------------

describe('alignSegments — heading count mismatch', () => {
  it('returns inconclusive=true when EN and JA have different heading counts', () => {
    const en = [
      makeHeading('A', 0, 'A'),
      makeSeg('A', 'paragraph', 0, 'a'),
      makeHeading('B', 0, 'B'),
      makeSeg('B', 'paragraph', 0, 'b'),
    ];
    const ja = [
      makeHeading('A-ja', 0, 'A-ja'),
      makeSeg('A-ja', 'paragraph', 0, 'a-ja'),
      // B heading + body missing entirely
    ];
    const result = alignSegments(en, ja);
    assert.equal(result.inconclusive, true);
    assert.match(result.inconclusiveReason, /heading/i);
  });
});

// ---------------------------------------------------------------------------
// Determinism / immutability
// ---------------------------------------------------------------------------

describe('alignSegments — determinism', () => {
  it('returns the same result for repeated calls on identical input', () => {
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'p1'),
      makeSeg('Setup', 'paragraph', 1, 'p2'),
      makeSeg('Setup', 'paragraph', 2, 'p3'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'paragraph', 0, 'p1-ja'),
      makeSeg('セットアップ', 'paragraph', 1, 'p3-ja'),
    ];
    const a = alignSegments(en, ja);
    const b = alignSegments(en, ja);
    assert.deepEqual(a, b);
  });

  it('does not mutate its inputs', () => {
    const en = [makeHeading('A', 0, 'A'), makeSeg('A', 'paragraph', 0, 'p')];
    const ja = [makeHeading('A-ja', 0, 'A-ja')];
    const enClone = JSON.parse(JSON.stringify(en));
    const jaClone = JSON.parse(JSON.stringify(ja));
    alignSegments(en, ja);
    assert.deepEqual(en, enClone);
    assert.deepEqual(ja, jaClone);
  });
});
