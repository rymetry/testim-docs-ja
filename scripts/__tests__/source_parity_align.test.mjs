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
    // Real-world JA segments are written in Japanese and therefore contain
    // CJK characters; the same-language ASCII-only penalty does not fire,
    // and the kind-only fallback in segmentLikelyMatches takes over when
    // there are no distinguishing tokens.
    const en = [
      makeHeading('A', 0, 'A'),
      makeSeg('A', 'paragraph', 0, 'A1 paragraph.'),
      makeSeg('A', 'paragraph', 1, 'A2 paragraph.'),
      makeHeading('B', 0, 'B'),
      makeSeg('B', 'paragraph', 0, 'B1 paragraph.'),
      makeSeg('B', 'paragraph', 1, 'B2 paragraph.'),
      makeHeading('C', 0, 'C'),
      makeSeg('C', 'paragraph', 0, 'C1 paragraph.'),
    ];
    const ja = [
      makeHeading('Aセクション', 0, 'Aセクション'),
      makeSeg('Aセクション', 'paragraph', 0, 'A1 段落です。'),
      // A2 missing
      makeHeading('Bセクション', 0, 'Bセクション'),
      makeSeg('Bセクション', 'paragraph', 0, 'B1 段落です。'),
      makeSeg('Bセクション', 'paragraph', 1, 'B2 段落です。'),
      makeHeading('Cセクション', 0, 'Cセクション'),
      makeSeg('Cセクション', 'paragraph', 0, 'C1 段落です。'),
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
// Position correctness — content-aware LCS must identify the *correct* gap
// ---------------------------------------------------------------------------

describe('alignSegments — position correctness on distinguishable content', () => {
  function makeDistinct(prefix, count) {
    return Array.from({ length: count }, (_, i) =>
      makeSeg('Setup', 'paragraph', i, `${prefix} ${i}: \`token-${prefix}-${i}\``),
    );
  }

  it('middle deletion identifies the middle EN segment, not the first', () => {
    const en = [makeHeading('Setup', 0, 'Setup'), ...makeDistinct('alpha', 3)];
    // JA keeps the first and last, drops the middle. Each JA paragraph
    // shares its invariant token with its EN counterpart so the
    // content-aware LCS pairs them correctly.
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'paragraph', 0, 'JA 0: `token-alpha-0`'),
      makeSeg('セットアップ', 'paragraph', 1, 'JA 2: `token-alpha-2`'),
    ];
    const result = alignSegments(en, ja);
    const missing = result.diffs.filter((d) => d.type === 'segment-missing');
    assert.equal(missing.length, 1, 'exactly one missing diff');
    // The deleted EN paragraph is the second one (segmentIndex=1).
    assert.equal(missing[0].enSegmentIndex, 1, 'enSegmentIndex must point at the middle paragraph');
    assert.equal(
      missing[0].enSourceFingerprint,
      en[2].sourceFingerprint,
      'enSourceFingerprint must match the deleted EN segment',
    );
  });

  it('end deletion identifies the trailing EN segment', () => {
    const en = [makeHeading('Setup', 0, 'Setup'), ...makeDistinct('beta', 3)];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'paragraph', 0, 'JA 0: `token-beta-0`'),
      makeSeg('セットアップ', 'paragraph', 1, 'JA 1: `token-beta-1`'),
    ];
    const result = alignSegments(en, ja);
    const missing = result.diffs.filter((d) => d.type === 'segment-missing');
    assert.equal(missing.length, 1);
    assert.equal(missing[0].enSegmentIndex, 2, 'enSegmentIndex must point at the trailing paragraph');
    assert.equal(missing[0].enSourceFingerprint, en[3].sourceFingerprint);
  });

  it('start deletion identifies the leading EN segment', () => {
    const en = [makeHeading('Setup', 0, 'Setup'), ...makeDistinct('gamma', 3)];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'paragraph', 0, 'JA 1: `token-gamma-1`'),
      makeSeg('セットアップ', 'paragraph', 1, 'JA 2: `token-gamma-2`'),
    ];
    const result = alignSegments(en, ja);
    const missing = result.diffs.filter((d) => d.type === 'segment-missing');
    assert.equal(missing.length, 1);
    assert.equal(missing[0].enSegmentIndex, 0, 'enSegmentIndex must point at the leading paragraph');
    assert.equal(missing[0].enSourceFingerprint, en[1].sourceFingerprint);
  });

  it('matches by exact textNorm equality even without invariant tokens', () => {
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'Alpha paragraph.'),
      makeSeg('Setup', 'paragraph', 1, 'Beta paragraph.'),
      makeSeg('Setup', 'paragraph', 2, 'Gamma paragraph.'),
    ];
    // Synthetic test: JA keeps the same English text on both sides (the
    // case the reviewer used). Without textNorm-aware equality, kind-only
    // LCS picks the leading paragraph as missing regardless of which one
    // was deleted. With textNorm equality, the middle deletion is
    // identified correctly.
    const jaMiddleMissing = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'Alpha paragraph.'),
      makeSeg('Setup', 'paragraph', 1, 'Gamma paragraph.'),
    ];
    const middle = alignSegments(en, jaMiddleMissing);
    const middleMissing = middle.diffs.filter((d) => d.type === 'segment-missing');
    assert.equal(middleMissing.length, 1);
    assert.equal(middleMissing[0].enSegmentIndex, 1);
  });
});

// ---------------------------------------------------------------------------
// Section-content validation — body swaps between sections
// ---------------------------------------------------------------------------

describe('alignSegments — section content validation', () => {
  it('emits segment-shifted when matched section bodies have disjoint token sets', () => {
    // EN has Setup (proxy/token tokens) and Run (browser/headless tokens).
    // JA preserves the heading order but the bodies are SWAPPED across the
    // two sections. Heading counts agree, kind sequences agree, but the
    // section-level token fingerprints are completely disjoint — the
    // section-content guard must catch this.
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'Configure with `--proxy` and `--token`.'),
      makeHeading('Run', 0, 'Run'),
      makeSeg('Run', 'paragraph', 0, 'Pick a `--browser` and `--headless` mode.'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      // body sourced from Run
      makeSeg('セットアップ', 'paragraph', 0, '`--browser` と `--headless` を選びます。'),
      makeHeading('実行', 0, '実行'),
      // body sourced from Setup
      makeSeg('実行', 'paragraph', 0, '`--proxy` と `--token` を設定します。'),
    ];
    const result = alignSegments(en, ja);
    const shifted = result.diffs.filter((d) => d.type === 'segment-shifted');
    // At least the Setup section must be flagged as mis-aligned.
    assert.ok(shifted.length >= 1, 'at least one segment-shifted diff expected');
    assert.ok(
      shifted.some((d) => d.sectionPath === 'Setup'),
      'Setup section must be reported as mis-aligned',
    );
  });

  it('does not emit segment-shifted when at least one shared invariant token survives', () => {
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'Use `--proxy` to configure.'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'paragraph', 0, '`--proxy` を使用して設定します。'),
    ];
    const result = alignSegments(en, ja);
    const shifted = result.diffs.filter((d) => d.type === 'segment-shifted');
    assert.equal(shifted.length, 0);
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
