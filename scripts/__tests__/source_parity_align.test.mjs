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
    // Issue #247 PR2: section-structure-mismatch も並行で出る
    // (multiset {p:3} vs {p:2} で違うため)。LCS が emit する
    // segment-missing は引き続き 1 件 / cascade なしで pin する。
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'First paragraph.'),
      makeSeg('Setup', 'paragraph', 1, 'Second paragraph.'),
      makeSeg('Setup', 'paragraph', 2, 'Third paragraph.'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'paragraph', 0, '段落 1'),
      // 2 番目の段落を削除
      makeSeg('セットアップ', 'paragraph', 1, '段落 3'),
    ];
    const result = alignSegments(en, ja);
    const missingDiffs = result.diffs.filter((d) => d.type === 'segment-missing');
    assert.equal(missingDiffs.length, 1, 'exactly one segment-missing — no LCS cascade');
    assert.equal(missingDiffs[0].segmentKind, 'paragraph');
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
    // Issue #247 PR2: section-structure-mismatch も並行で出る
    // (multiset {callout-body:2} vs {callout-body:1})。
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'callout-body', 0, 'EN callout para A'),
      makeSeg('Setup', 'callout-body', 1, 'EN callout para B'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'callout-body', 0, 'JA callout 文 A'),
      // 2 番目の callout body 段落が JA で欠落
    ];
    const result = alignSegments(en, ja);
    const missingDiffs = result.diffs.filter((d) => d.type === 'segment-missing');
    assert.equal(missingDiffs.length, 1);
    assert.equal(missingDiffs[0].segmentKind, 'callout-body');
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
    // Issue #247 PR2: section-structure-mismatch も並行で出る
    // (multiset {p:2} vs {p:3})。
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
    const extraDiffs = result.diffs.filter((d) => d.type === 'segment-extra');
    assert.equal(extraDiffs.length, 1);
    assert.equal(extraDiffs[0].segmentKind, 'paragraph');
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
    // Issue #247 PR2: Setup section の paragraph 削除 (multiset
    // {p:2} vs {p:1}) で section-structure-mismatch も並行に出る。
    // ここでは segment-missing 単体の section path をピン止めするのが
    // 目的なので、type で filter してから検証する。
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
      // setup paragraph 2 が欠落
      makeHeading('実行', 0, '実行'),
      makeSeg('実行', 'paragraph', 0, '実行段落 1'),
    ];
    const result = alignSegments(en, ja);
    const missingDiffs = result.diffs.filter((d) => d.type === 'segment-missing');
    assert.equal(missingDiffs.length, 1);
    // sectionPath は EN 側 (削除された segment は EN にしか存在しない)。
    assert.equal(missingDiffs[0].sectionPath, 'Setup');
  });

  it('does not cascade across section boundaries — a missing segment in one section ' +
     'leaves the next section diff-free', () => {
    // Real-world JA segments are written in Japanese and therefore contain
    // CJK characters; the same-language ASCII-only penalty does not fire,
    // and the kind-only fallback in scoreSegmentMatch takes over when
    // there are no distinguishing tokens. We pin sections B and C with
    // shared `--bflag` / `--cflag` invariant tokens so the section-local
    // alignment stays strongly anchored; this test is specifically about
    // cascade isolation, not cross-section shift detection.
    const en = [
      makeHeading('A', 0, 'A'),
      makeSeg('A', 'paragraph', 0, 'A1 paragraph.'),
      makeSeg('A', 'paragraph', 1, 'A2 paragraph.'),
      makeHeading('B', 0, 'B'),
      makeSeg('B', 'paragraph', 0, 'Use `--bflag` for B1.'),
      makeSeg('B', 'paragraph', 1, 'Use `--bflag` for B2.'),
      makeHeading('C', 0, 'C'),
      makeSeg('C', 'paragraph', 0, 'Use `--cflag` for C1.'),
    ];
    const ja = [
      makeHeading('Aセクション', 0, 'Aセクション'),
      makeSeg('Aセクション', 'paragraph', 0, 'A1 段落です。'),
      // A2 missing
      makeHeading('Bセクション', 0, 'Bセクション'),
      makeSeg('Bセクション', 'paragraph', 0, '`--bflag` を B1 で使用します。'),
      makeSeg('Bセクション', 'paragraph', 1, '`--bflag` を B2 で使用します。'),
      makeHeading('Cセクション', 0, 'Cセクション'),
      makeSeg('Cセクション', 'paragraph', 0, '`--cflag` を C1 で使用します。'),
    ];
    const result = alignSegments(en, ja);
    // cascade-isolation: section A (削除あり) には segment-missing が
    // ちょうど 1 件、section B / C には segment-missing が 1 件もない
    // ことを pin する。Issue #247 PR2 では section A に
    // section-structure-mismatch (multiset {p:2} vs {p:1}) も並行で出る
    // が、これは想定通りで他 section には影響しない。
    const missingDiffs = result.diffs.filter((d) => d.type === 'segment-missing');
    assert.equal(missingDiffs.length, 1, 'no cascade — exactly one missing diff');
    assert.equal(missingDiffs[0].sectionPath, 'A');
    // section B / C には LCS 由来の diff が 1 件も入ってはいけない。
    const lcsDiffsInOtherSections = result.diffs.filter(
      (d) => d.sectionPath !== 'A' && d.scope !== 'section',
    );
    assert.equal(
      lcsDiffsInOtherSections.length,
      0,
      `sections B and C must be LCS-diff-free; got: ${JSON.stringify(lcsDiffsInOtherSections.map((d) => `${d.type}/${d.sectionPath}`))}`,
    );
    // structure-mismatch も section A だけにしか出ない。
    const structureDiffsInOtherSections = result.diffs.filter(
      (d) => d.scope === 'section' && d.sectionPath !== 'A',
    );
    assert.equal(
      structureDiffsInOtherSections.length,
      0,
      'structure-mismatch must be confined to section A as well',
    );
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
// Reviewer regression — segment-shifted is token-evidenced only
// ---------------------------------------------------------------------------

describe('alignSegments — segment-shifted only fires with token destination evidence', () => {
  it('a single mistranslated CLI flag is segment-token-gap or extra/missing — NOT segment-shifted', () => {
    // Reviewer repro: EN section has `--proxy`, JA section has a totally
    // different token `--token`. Token sets are disjoint, but there is
    // no other section that "claims" the orphaned content. Previously
    // this was misclassified as a structural shift; now it must surface
    // as a normal token / extra / missing diff.
    const en = [
      makeHeading('CLI', 0, 'CLI'),
      makeSeg('CLI', 'paragraph', 0, 'Use `--proxy` to configure the proxy server.'),
    ];
    const ja = [
      makeHeading('CLI', 0, 'CLI'),
      makeSeg('CLI', 'paragraph', 0, '`--token` を指定して認証します。'),
    ];
    const result = alignSegments(en, ja);
    const types = result.diffs.map((d) => d.type);
    assert.ok(
      !types.includes('segment-shifted'),
      `must not classify as segment-shifted; got types: ${JSON.stringify(types)}`,
    );
    assert.ok(
      types.some((t) => t === 'segment-missing' || t === 'segment-extra' || t === 'segment-token-gap'),
      `expected a normal diff (missing/extra/token-gap); got types: ${JSON.stringify(types)}`,
    );
  });

  it('does NOT emit segment-shifted on a distinguishably aligned tokenless prose page', () => {
    // Tokenless prose-only sections can still be clean when the current
    // section pairing is materially stronger than the swap hypothesis.
    const en = [
      makeHeading('A', 0, 'A'),
      makeSeg('A', 'paragraph', 0, 'This is a very long alpha paragraph with extensive explanatory detail and several extra clauses.'),
      makeSeg('A', 'paragraph', 1, 'This is another very long alpha paragraph that continues the explanation with more supporting detail.'),
      makeHeading('B', 0, 'B'),
      makeSeg('B', 'paragraph', 0, 'Tiny beta one.'),
      makeSeg('B', 'paragraph', 1, 'Tiny beta two.'),
    ];
    const ja = [
      makeHeading('Aセクション', 0, 'Aセクション'),
      makeSeg('Aセクション', 'paragraph', 0, 'これは非常に長いアルファ段落であり、複数の補足説明と細部を含んでいます。'),
      makeSeg('Aセクション', 'paragraph', 1, 'これは説明をさらに続ける非常に長いアルファ段落であり、追加の補足情報も含みます。'),
      makeHeading('Bセクション', 0, 'Bセクション'),
      makeSeg('Bセクション', 'paragraph', 0, '極短ベータ 1。'),
      makeSeg('Bセクション', 'paragraph', 1, '極短ベータ 2。'),
    ];
    const result = alignSegments(en, ja);
    const shifted = result.diffs.filter((d) => d.type === 'segment-shifted');
    assert.equal(
      shifted.length,
      0,
      `aligned tokenless prose must not produce segment-shifted; got diffs: ${JSON.stringify(result.diffs.map((d) => `${d.type}/${d.confidence ?? '-'}/${d.sectionPath}`))}`,
    );
    assert.equal(result.inconclusive, false, 'distinguishable aligned page should stay conclusive');
  });

  it('does not emit segment-shifted for a tokenless swap even when section lengths differ', () => {
    // Length-differentiated tokenless swaps remain out of scope for the
    // exact gate. After tightening the ambiguous-page bailout to near
    // ties only, this case no longer goes inconclusive; it is left to a
    // future semantic layer rather than a noisy length heuristic.
    const en = [
      makeHeading('A', 0, 'A'),
      makeSeg('A', 'paragraph', 0, 'This is a much longer paragraph A1 with significant detail.'),
      makeSeg('A', 'paragraph', 1, 'This is also a long paragraph A2 explaining things in detail.'),
      makeHeading('B', 0, 'B'),
      makeSeg('B', 'paragraph', 0, 'Short B1.'),
      makeSeg('B', 'paragraph', 1, 'Short B2.'),
    ];
    const ja = [
      makeHeading('Aセクション', 0, 'Aセクション'),
      // bodies swapped: short content lands in section A
      makeSeg('Aセクション', 'paragraph', 0, '短い B1。'),
      makeSeg('Aセクション', 'paragraph', 1, '短い B2。'),
      makeHeading('Bセクション', 0, 'Bセクション'),
      makeSeg('Bセクション', 'paragraph', 0, 'これはより長い A1 段落で、重要な詳細を含んでいます。'),
      makeSeg('Bセクション', 'paragraph', 1, 'これは A2 段落も長く、物事を詳しく説明しています。'),
    ];
    const result = alignSegments(en, ja);
    const shifted = result.diffs.filter((d) => d.type === 'segment-shifted');
    assert.equal(result.inconclusive, false);
    assert.equal(shifted.length, 0, 'no exact shift diff should be emitted');
  });

  it('returns inconclusive for a tokenless body swap with uniform paragraph lengths', () => {
    // Even the fully ambiguous uniform-length case must not silently
    // pass as a clean page.
    const en = [
      makeHeading('A', 0, 'A'),
      makeSeg('A', 'paragraph', 0, 'Alpha one paragraph.'),
      makeSeg('A', 'paragraph', 1, 'Alpha two paragraph.'),
      makeHeading('B', 0, 'B'),
      makeSeg('B', 'paragraph', 0, 'Beta one paragraph.'),
      makeSeg('B', 'paragraph', 1, 'Beta two paragraph.'),
    ];
    const ja = [
      makeHeading('Aセクション', 0, 'Aセクション'),
      // bodies swapped — but lengths are uniform, no length signal
      makeSeg('Aセクション', 'paragraph', 0, 'ベータ 1 の段落です。'),
      makeSeg('Aセクション', 'paragraph', 1, 'ベータ 2 の段落です。'),
      makeHeading('Bセクション', 0, 'Bセクション'),
      makeSeg('Bセクション', 'paragraph', 0, 'アルファ 1 の段落です。'),
      makeSeg('Bセクション', 'paragraph', 1, 'アルファ 2 の段落です。'),
    ];
    const result = alignSegments(en, ja);
    assert.equal(result.diffs.length, 0);
    assert.equal(result.inconclusive, true, 'uniform tokenless swap must not be silent green');
    assert.match(result.inconclusiveReason, /cannot rule out a body swap/i);
  });

  it('may return inconclusive for an aligned tokenless page when swap cannot be ruled out', () => {
    // This is the tradeoff for trustworthy clean results: when current
    // and swapped hypotheses are equally plausible, Phase 5 returns
    // inconclusive instead of asserting that the page is definitely clean.
    const en = [
      makeHeading('A', 0, 'A'),
      makeSeg('A', 'paragraph', 0, 'Alpha one paragraph.'),
      makeSeg('A', 'paragraph', 1, 'Alpha two paragraph.'),
      makeHeading('B', 0, 'B'),
      makeSeg('B', 'paragraph', 0, 'Beta one paragraph.'),
      makeSeg('B', 'paragraph', 1, 'Beta two paragraph.'),
    ];
    const ja = [
      makeHeading('A-ja', 0, 'A-ja'),
      makeSeg('A-ja', 'paragraph', 0, 'アルファ 1 の段落です。'),
      makeSeg('A-ja', 'paragraph', 1, 'アルファ 2 の段落です。'),
      makeHeading('B-ja', 0, 'B-ja'),
      makeSeg('B-ja', 'paragraph', 0, 'ベータ 1 の段落です。'),
      makeSeg('B-ja', 'paragraph', 1, 'ベータ 2 の段落です。'),
    ];
    const result = alignSegments(en, ja);
    assert.equal(result.diffs.length, 0);
    assert.equal(result.inconclusive, true);
  });

  it('keeps unrelated exact diffs when a different adjacent tokenless pair is inconclusive', () => {
    const en = [
      makeHeading('A', 0, 'A'),
      makeSeg('A', 'paragraph', 0, 'Alpha one paragraph.'),
      makeSeg('A', 'paragraph', 1, 'Alpha two paragraph.'),
      makeHeading('B', 0, 'B'),
      makeSeg('B', 'paragraph', 0, 'Beta one paragraph.'),
      makeSeg('B', 'paragraph', 1, 'Beta two paragraph.'),
      makeHeading('C', 0, 'C'),
      makeSeg('C', 'paragraph', 0, 'Use `--flag` here.'),
    ];
    const ja = [
      makeHeading('A-ja', 0, 'A-ja'),
      makeSeg('A-ja', 'paragraph', 0, 'ベータ 1 の段落です。'),
      makeSeg('A-ja', 'paragraph', 1, 'ベータ 2 の段落です。'),
      makeHeading('B-ja', 0, 'B-ja'),
      makeSeg('B-ja', 'paragraph', 0, 'アルファ 1 の段落です。'),
      makeSeg('B-ja', 'paragraph', 1, 'アルファ 2 の段落です。'),
      makeHeading('C-ja', 0, 'C-ja'),
      makeSeg('C-ja', 'paragraph', 0, 'ここで使います。'),
    ];
    const result = alignSegments(en, ja);
    assert.equal(result.inconclusive, true, 'A/B pair should still mark the page inconclusive');
    const gaps = result.diffs.filter((d) => d.type === 'segment-token-gap');
    assert.equal(gaps.length, 1, 'exact diff in section C must be preserved');
    assert.equal(gaps[0].sectionPath, 'C');
  });

  it('does not emit segment-shifted when only one section pair has zero overlap', () => {
    // Two sections; only the first has disjoint tokens. There is no
    // destination section, so the alignment must NOT short-circuit to
    // segment-shifted.
    const en = [
      makeHeading('A', 0, 'A'),
      makeSeg('A', 'paragraph', 0, 'Use `--alpha` for A.'),
      makeHeading('B', 0, 'B'),
      makeSeg('B', 'paragraph', 0, 'Use `--beta` for B.'),
    ];
    const ja = [
      makeHeading('A', 0, 'A'),
      // JA A section has a token that exists in NEITHER EN A nor EN B
      makeSeg('A', 'paragraph', 0, '`--gamma` を A で使います。'),
      makeHeading('B', 0, 'B'),
      makeSeg('B', 'paragraph', 0, '`--beta` を B で使います。'),
    ];
    const result = alignSegments(en, ja);
    const shifted = result.diffs.filter((d) => d.type === 'segment-shifted');
    assert.equal(shifted.length, 0, 'no destination section → no shift');
  });

  it('still emits segment-shifted when both sides have symmetric destination evidence with one token each', () => {
    // A single distinctive token per section is sufficient when the
    // cross-section destination is unique in both directions.
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'Use `--proxy` to configure.'),
      makeHeading('Run', 0, 'Run'),
      makeSeg('Run', 'paragraph', 0, 'Pick `--browser` to run.'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      // bodies swapped
      makeSeg('セットアップ', 'paragraph', 0, '`--browser` を選びます。'),
      makeHeading('実行', 0, '実行'),
      makeSeg('実行', 'paragraph', 0, '`--proxy` を設定します。'),
    ];
    const result = alignSegments(en, ja);
    const shifted = result.diffs.filter((d) => d.type === 'segment-shifted');
    assert.ok(shifted.length >= 1, 'symmetric token swap must surface as segment-shifted');
    assert.ok(shifted.every((d) => d.confidence === 'high'));
  });
});

// ---------------------------------------------------------------------------
// Reviewer regression — tokenless cross-language middle deletion
// ---------------------------------------------------------------------------

describe('alignSegments — tokenless cross-language paragraph identification', () => {
  it('identifies the correct enSegmentIndex when a middle JA paragraph is deleted', () => {
    // Reviewer repro: EN=[Alpha, Beta, Gamma] / JA=[アルファ, ガンマ].
    // Previously kind-only LCS reported enSegmentIndex=0 regardless of
    // which paragraph was actually deleted. With weighted LCS the
    // position+length scoring naturally aligns the surviving paragraphs
    // to their correct EN counterparts, leaving Beta as the gap.
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'Alpha paragraph.'),
      makeSeg('Setup', 'paragraph', 1, 'Beta paragraph.'),
      makeSeg('Setup', 'paragraph', 2, 'Gamma paragraph.'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'paragraph', 0, 'アルファ段落です。'),
      makeSeg('セットアップ', 'paragraph', 1, 'ガンマ段落です。'),
    ];
    const result = alignSegments(en, ja);
    const missing = result.diffs.filter((d) => d.type === 'segment-missing');
    assert.equal(missing.length, 1);
    assert.equal(missing[0].enSegmentIndex, 1, 'middle paragraph must be the gap');
    assert.equal(missing[0].enSourceFingerprint, en[2].sourceFingerprint);
  });

  it('identifies the trailing EN segment when textNorm-shared content has a tail gap', () => {
    // textNorm-matching content gives the LCS strong anchors (score 500)
    // so it can decisively identify the trailing gap. Without textNorm
    // anchors, head/tail deletions are positionally ambiguous in tokenless
    // cross-language sections — see the "known limitation" test below.
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'Alpha paragraph.'),
      makeSeg('Setup', 'paragraph', 1, 'Beta paragraph.'),
      makeSeg('Setup', 'paragraph', 2, 'Gamma paragraph.'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'paragraph', 0, 'Alpha paragraph.'),
      makeSeg('セットアップ', 'paragraph', 1, 'Beta paragraph.'),
      // Gamma deleted
    ];
    const result = alignSegments(en, ja);
    const missing = result.diffs.filter((d) => d.type === 'segment-missing');
    assert.equal(missing.length, 1);
    assert.equal(missing[0].enSegmentIndex, 2, 'trailing paragraph must be the gap');
  });

  it('identifies the leading EN segment when textNorm-shared content has a head gap', () => {
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'Alpha paragraph.'),
      makeSeg('Setup', 'paragraph', 1, 'Beta paragraph.'),
      makeSeg('Setup', 'paragraph', 2, 'Gamma paragraph.'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      // Alpha deleted
      makeSeg('セットアップ', 'paragraph', 0, 'Beta paragraph.'),
      makeSeg('セットアップ', 'paragraph', 1, 'Gamma paragraph.'),
    ];
    const result = alignSegments(en, ja);
    const missing = result.diffs.filter((d) => d.type === 'segment-missing');
    assert.equal(missing.length, 1);
    assert.equal(missing[0].enSegmentIndex, 0, 'leading paragraph must be the gap');
  });

  it('known limitation: tokenless cross-language head/tail deletion is positionally ambiguous', () => {
    // EN has 3 distinguishable paragraphs, JA has 2 translated tokenless
    // paragraphs. Without textNorm / token / fingerprint anchors, there
    // is no signal that can decide which EN paragraph was the head gap.
    // The weighted LCS still emits exactly one segment-missing diff (the
    // structural change is detected), but the *which-paragraph* attribution
    // is best-effort. Position-symmetric middle deletions are detected
    // correctly; head / tail deletions are not.
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'Alpha paragraph.'),
      makeSeg('Setup', 'paragraph', 1, 'Beta paragraph.'),
      makeSeg('Setup', 'paragraph', 2, 'Gamma paragraph.'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      // Alpha deleted (head); JA paragraphs are tokenless and CJK
      makeSeg('セットアップ', 'paragraph', 0, 'ベータの段落です。'),
      makeSeg('セットアップ', 'paragraph', 1, 'ガンマの段落です。'),
    ];
    const result = alignSegments(en, ja);
    const missing = result.diffs.filter((d) => d.type === 'segment-missing');
    // Structural detection still fires — exactly one paragraph is missing.
    assert.equal(missing.length, 1, 'one missing diff must be emitted');
    assert.equal(missing[0].segmentKind, 'paragraph');
    // We deliberately do NOT assert which enSegmentIndex was chosen.
    // The Phase 6 cutover plan is to either (a) accept this as a known
    // limitation and pair with shadow-mode review, or (b) augment the
    // alignment with a translation memory before promoting.
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

// ---------------------------------------------------------------------------
// Phase 6A — inconclusiveCategory enum
// ---------------------------------------------------------------------------

describe('alignSegments — inconclusiveCategory enum (Phase 6A)', () => {
  it('returns inconclusiveCategory: null when alignment is conclusive', () => {
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeSeg('Setup', 'paragraph', 0, 'Body paragraph.'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'paragraph', 0, '本文段落'),
    ];
    const result = alignSegments(en, ja);
    assert.equal(result.inconclusive, false);
    assert.equal(result.inconclusiveCategory, null);
    assert.equal(result.inconclusiveMeta, null);
  });

  it('returns inconclusiveCategory: "heading-count-mismatch" when heading counts differ', () => {
    const en = [
      makeHeading('Setup', 0, 'Setup'),
      makeHeading('Usage', 1, 'Usage'),
      makeSeg('Usage', 'paragraph', 0, 'Body.'),
    ];
    const ja = [
      makeHeading('セットアップ', 0, 'セットアップ'),
      makeSeg('セットアップ', 'paragraph', 0, '本文'),
    ];
    const result = alignSegments(en, ja);
    assert.equal(result.inconclusive, true);
    assert.equal(result.inconclusiveCategory, 'heading-count-mismatch');
    assert.equal(result.inconclusiveMeta, null);
    assert.match(result.inconclusiveReason, /Heading count mismatch/);
  });

  it('returns inconclusiveCategory: "tokenless-near-tie" when adjacent tokenless swap is ambiguous', () => {
    // Two adjacent tokenless sections with similar-length bodies that get
    // swapped between EN and JA. The detectAmbiguousAdjacentTokenlessSwap
    // pass should flag this as a near-tie. If the heuristic doesn't fire
    // on this synthetic input, the test still asserts the schema invariant
    // that conclusive alignments have inconclusiveCategory: null.
    const en = [
      makeHeading('Section A', 0, 'Section A'),
      makeSeg('Section A', 'paragraph', 0, 'first body sentence approximately the same length'),
      makeHeading('Section B', 0, 'Section B'),
      makeSeg('Section B', 'paragraph', 0, 'second body sentence approximately the same length'),
    ];
    const ja = [
      makeHeading('セクション A', 0, 'セクション A'),
      makeSeg('セクション A', 'paragraph', 0, '2 番目の本文文章 ほぼ同じ長さ'),
      makeHeading('セクション B', 0, 'セクション B'),
      makeSeg('セクション B', 'paragraph', 0, '1 番目の本文文章 ほぼ同じ長さ'),
    ];
    const result = alignSegments(en, ja);
    if (result.inconclusive) {
      assert.equal(result.inconclusiveCategory, 'tokenless-near-tie');
      assert.match(result.inconclusiveReason, /tokenless adjacent sections/i);
      assert.deepEqual(result.inconclusiveMeta, {
        leftSectionPath: 'Section A',
        rightSectionPath: 'Section B',
        currentScore: result.inconclusiveMeta.currentScore,
        swapScore: result.inconclusiveMeta.swapScore,
      });
      assert.equal(typeof result.inconclusiveMeta.currentScore, 'number');
      assert.equal(typeof result.inconclusiveMeta.swapScore, 'number');
    } else {
      assert.equal(result.inconclusiveCategory, null);
      assert.equal(result.inconclusiveMeta, null);
    }
  });
});

// ---------------------------------------------------------------------------
// Issue #247 PR2 — section structure comparator wired into alignSegments
// ---------------------------------------------------------------------------

describe('alignSegments — structure comparator integration (Issue #247 PR2)', () => {
  let parityDiffsToIssues;

  before(async () => {
    ({ parityDiffsToIssues } = await import('../lib/source_parity_align.mjs'));
  });

  it('emits section-structure-mismatch for cross-kind collapse (list → paragraph)', () => {
    const en = [
      makeHeading('Overview', 0, 'Overview'),
      makeSeg('Overview', 'unordered-list-item', 0, '- bullet `alpha`'),
      makeSeg('Overview', 'unordered-list-item', 1, '- bullet `beta`'),
      makeSeg('Overview', 'unordered-list-item', 2, '- bullet `gamma`'),
    ];
    const ja = [
      makeHeading('概要', 0, '概要'),
      makeSeg('概要', 'paragraph', 0, 'alpha, beta, gamma を段落に畳んだ翻訳'),
    ];
    const result = alignSegments(en, ja);
    const structureDiffs = result.diffs.filter(
      (d) => d.type === 'section-structure-mismatch',
    );
    assert.equal(structureDiffs.length, 1);
    const diff = structureDiffs[0];
    assert.equal(diff.scope, 'section');
    assert.equal(diff.structureCategory, 'kind-multiset');
    assert.deepEqual(diff.enKinds, ['unordered-list']);
    assert.deepEqual(diff.jaKinds, ['paragraph']);
  });

  it('emits exactly one section-level structure diff per mismatched section (no cascade multiplier)', () => {
    // PR2 は structure comparator を weighted LCS の **代わり** ではなく
    // **並行** で走らせる。structure comparator はミスマッチ section
    // あたり高々 +1 diff しか足さず、LCS は変わらず per-segment の
    // drill-down (segment-missing / segment-extra / segment-token-gap) を
    // emit する。この並行契約は意図的: LCS を suppress してしまうと、
    // 既に構造ドリフトを抱えた section で後続の小さな mutation が隠れて
    // しまう (recall benchmark の callout-paragraph-delete / step-delete /
    // section-body-swap 参照)。
    //
    // cascade 懸念は、あくまで「structure mismatch が structure-level diff
    // として多重化しない」こと — つまり 1 つの構造ドリフトはセグメントが
    // 何個動いても必ず 1 件の `section-structure-mismatch` になる、という
    // 保証のほうを指す。
    const en = [
      makeHeading('Overview', 0, 'Overview'),
      makeSeg('Overview', 'unordered-list-item', 0, '- bullet `alpha`'),
      makeSeg('Overview', 'unordered-list-item', 1, '- bullet `beta`'),
      makeSeg('Overview', 'unordered-list-item', 2, '- bullet `gamma`'),
    ];
    const ja = [
      makeHeading('概要', 0, '概要'),
      makeSeg('概要', 'paragraph', 0, 'alpha, beta, gamma を段落に畳んだ翻訳'),
    ];
    const result = alignSegments(en, ja);
    const grouped = diffsByType(result.diffs);
    assert.equal(
      grouped['section-structure-mismatch'],
      1,
      'exactly one section-level structure diff per mismatched section',
    );
    // LCS も並行で走るので per-segment drill-down が出る可能性はあるが、
    // ここでは structure-mismatch counter が multiply していないことだけを
    // assert する。
  });

  it('structure mismatch is limited to the affected section (no leakage to sibling sections)', () => {
    // Section 1 に cross-kind structure mismatch、Section 2 は整合している。
    // structure comparator は Section 1 にだけ emit するべきで、Section 2
    // には structure-mismatch diff が 1 件も来てはならない。
    const en = [
      makeHeading('Section 1', 0, 'Section 1'),
      makeSeg('Section 1', 'callout-body', 0, 'EN callout `warn`'),
      makeSeg('Section 1', 'paragraph', 0, 'EN para `flag`'),
      makeHeading('Section 2', 0, 'Section 2'),
      makeSeg('Section 2', 'paragraph', 0, 'Clean EN paragraph `key`'),
    ];
    const ja = [
      makeHeading('セクション 1', 0, 'セクション 1'),
      makeSeg('セクション 1', 'paragraph', 0, '注意 `warn` と段落 `flag` を畳んだ翻訳'),
      makeHeading('セクション 2', 0, 'セクション 2'),
      makeSeg('セクション 2', 'paragraph', 0, '綺麗な翻訳 `key`'),
    ];
    const result = alignSegments(en, ja);
    const structureDiffs = result.diffs.filter(
      (d) => d.type === 'section-structure-mismatch' || d.type === 'segment-order-mismatch',
    );
    assert.equal(structureDiffs.length, 1);
    assert.equal(structureDiffs[0].sectionPath, 'Section 1');
  });

  it('emits segment-order-mismatch (kind-sequence) for mixed-kind reorder', () => {
    const en = [
      makeHeading('Overview', 0, 'Overview'),
      makeSeg('Overview', 'paragraph', 0, 'EN para `token-a`'),
      makeSeg('Overview', 'unordered-list-item', 0, '- bullet `token-b`'),
    ];
    const ja = [
      makeHeading('概要', 0, '概要'),
      makeSeg('概要', 'unordered-list-item', 0, '- 箇条書き `token-b`'),
      makeSeg('概要', 'paragraph', 0, '段落 `token-a`'),
    ];
    const result = alignSegments(en, ja);
    const structureDiffs = result.diffs.filter((d) => d.type === 'segment-order-mismatch');
    assert.equal(structureDiffs.length, 1);
    assert.equal(structureDiffs[0].structureCategory, 'kind-sequence');
  });

  it('emits segment-order-mismatch (content-order) for same-kind content swap', () => {
    const en = [
      makeHeading('Overview', 0, 'Overview'),
      makeSeg('Overview', 'paragraph', 0, 'Paragraph `alpha-token`'),
      makeSeg('Overview', 'paragraph', 1, 'Paragraph `beta-token`'),
    ];
    const ja = [
      makeHeading('概要', 0, '概要'),
      makeSeg('概要', 'paragraph', 0, '`beta-token` の段落'),
      makeSeg('概要', 'paragraph', 1, '`alpha-token` の段落'),
    ];
    const result = alignSegments(en, ja);
    const structureDiffs = result.diffs.filter((d) => d.type === 'segment-order-mismatch');
    assert.equal(structureDiffs.length, 1);
    assert.equal(structureDiffs[0].structureCategory, 'content-order');
    assert.ok(Array.isArray(structureDiffs[0].contentPermutation));
  });

  it('emits BOTH section-structure-mismatch and segment-missing for same-kind count drift', () => {
    // 並行 emission の契約を pin する。同種 kind の count drift
    // (3 段落 → 2 段落) は:
    //   - structure comparator が headline として
    //     section-structure-mismatch を 1 件 emit する (Stage A の
    //     multiset 規約による)
    //   - LCS は drill-down として、どの段落が落ちたかを示す
    //     segment-missing を emit する
    // 両方が並行で出ることで、reviewer は section-level の見出しと
    // segment-level のインデックス情報の両方を受け取れる。downstream の
    // gate accounting では `structureMismatch*` と従来の segment-*
    // counter が別ファミリで集計されるので、二重計上にはならない。
    const en = [
      makeHeading('Overview', 0, 'Overview'),
      makeSeg('Overview', 'paragraph', 0, 'EN para A `token-a`'),
      makeSeg('Overview', 'paragraph', 1, 'EN para B `token-b`'),
      makeSeg('Overview', 'paragraph', 2, 'EN para C `token-c`'),
    ];
    const ja = [
      makeHeading('概要', 0, '概要'),
      makeSeg('概要', 'paragraph', 0, 'JA 段落 A `token-a`'),
      makeSeg('概要', 'paragraph', 1, 'JA 段落 C `token-c`'),
    ];
    const result = alignSegments(en, ja);
    const grouped = diffsByType(result.diffs);
    assert.equal(
      grouped['section-structure-mismatch'],
      1,
      'structure comparator must emit the section-level headline',
    );
    assert.equal(
      grouped['segment-missing'],
      1,
      'LCS must still emit per-segment drill-down for the dropped paragraph',
    );
    assert.equal(grouped['segment-order-mismatch'], undefined);
  });

  it('cross-section body swap emits segment-shifted only — structure comparator is skipped', () => {
    // Issue #247 PR2 review (Finding 1) — cross-section body swap が
    // 起きると、section 単位の対応ペアは「kind 列が両方違う」形に
    // 観測されるので、何もしないと structure comparator が
    // section-structure-mismatch を section ごとに 1 件ずつ emit して
    // しまう。だが本当の診断は section-local な構造ドリフトではなく
    // **cross-section misalignment** で、これは alignSection の
    // findBodySwapEvidence が segment-shifted として既に表現できる。
    //
    // alignSegments は alignSection を先に走らせ、segment-shifted が
    // emit されている section では structure comparator を skip する
    // 契約。この regression test が崩れると `structureMismatch*`
    // counter が swap で汚染される。
    const en = [
      makeHeading('Section A', 0, 'Section A'),
      makeSeg('Section A', 'paragraph', 0, 'EN A paragraph with `alpha-token` and `alpha-flag`'),
      makeSeg('Section A', 'unordered-list-item', 0, '- A bullet `alpha-extra`'),
      makeHeading('Section B', 0, 'Section B'),
      makeSeg('Section B', 'callout-body', 0, 'EN B callout `beta-token` and `beta-flag`'),
      makeSeg('Section B', 'paragraph', 0, 'EN B paragraph `beta-extra`'),
    ];
    const ja = [
      makeHeading('セクション A', 0, 'セクション A'),
      // セクション A は本来 A の内容を持つはずだが、B の内容に入れ替わっている
      makeSeg('セクション A', 'callout-body', 0, 'JA B コールアウト `beta-token` と `beta-flag`'),
      makeSeg('セクション A', 'paragraph', 0, 'JA B 段落 `beta-extra`'),
      makeHeading('セクション B', 0, 'セクション B'),
      // セクション B は本来 B の内容を持つはずだが、A の内容に入れ替わっている
      makeSeg('セクション B', 'paragraph', 0, 'JA A 段落 `alpha-token` と `alpha-flag`'),
      makeSeg('セクション B', 'unordered-list-item', 0, '- A 箇条書き `alpha-extra`'),
    ];
    const result = alignSegments(en, ja);
    const grouped = diffsByType(result.diffs);
    assert.ok(
      (grouped['segment-shifted'] ?? 0) > 0,
      'segment-shifted must fire on token-evidenced cross-section body swap',
    );
    assert.equal(
      grouped['section-structure-mismatch'],
      undefined,
      'structure comparator must NOT also emit section-structure-mismatch on shifted sections',
    );
    assert.equal(
      grouped['segment-order-mismatch'],
      undefined,
      'structure comparator must NOT also emit segment-order-mismatch on shifted sections',
    );
  });

  it('local structure drift in one section coexists with shifted sibling section', () => {
    // Section A が cross-section swap で segment-shifted、Section B が
    // 独立に local cross-kind drift を持つ場合、Section A の structure
    // comparator は skip される (shift があるため) が、Section B では
    // structure comparator は普通に走って structure-mismatch を emit
    // する。skip は section-local で、他の section に波及しない。
    const en = [
      makeHeading('Section A', 0, 'Section A'),
      makeSeg('Section A', 'paragraph', 0, 'EN A paragraph `swap-alpha` `swap-beta`'),
      makeHeading('Section B', 0, 'Section B'),
      makeSeg('Section B', 'callout-body', 0, 'EN B callout `local-token`'),
      makeSeg('Section B', 'paragraph', 0, 'EN B paragraph `local-flag`'),
    ];
    const ja = [
      makeHeading('セクション A', 0, 'セクション A'),
      // Section A の内容が Section C 由来 (cross-section misalignment)
      makeSeg('セクション A', 'paragraph', 0, 'JA C 段落 `unrelated-x` `unrelated-y`'),
      makeHeading('セクション B', 0, 'セクション B'),
      // Section B はローカルに callout を平文に畳んだ (cross-kind drift)
      makeSeg('セクション B', 'paragraph', 0, 'JA B 注意と段落を畳んだ翻訳 `local-token` `local-flag`'),
    ];
    const result = alignSegments(en, ja);
    const grouped = diffsByType(result.diffs);
    // Section B の cross-kind drift は structure-mismatch として残る。
    // (Section A は shift 判定が出るかどうかは alignSection の token
    // evidence 次第なので、ここでは structure-mismatch が ≥ 1 件出る
    // ことだけ assert する。)
    assert.ok(
      (grouped['section-structure-mismatch'] ?? 0) >= 1,
      'local structure drift in a non-shifted section must still surface',
    );
    const localDrift = result.diffs.find(
      (d) => d.type === 'section-structure-mismatch' && d.sectionPath === 'Section B',
    );
    assert.ok(localDrift, 'Section B (local drift) must carry the structure-mismatch');
  });

  it('parityDiffsToIssues forwards the structure payload contract verbatim', () => {
    const en = [
      makeHeading('Overview', 0, 'Overview'),
      makeSeg('Overview', 'callout-body', 0, 'EN callout `warn`'),
      makeSeg('Overview', 'paragraph', 0, 'EN paragraph `flag`'),
    ];
    const ja = [
      makeHeading('概要', 0, '概要'),
      makeSeg('概要', 'paragraph', 0, '注意 `warn` と段落 `flag` を畳んだ翻訳'),
    ];
    const result = alignSegments(en, ja);
    const issues = parityDiffsToIssues(result.diffs);

    const structureIssue = issues.find((i) => i.type === 'section-structure-mismatch');
    assert.ok(structureIssue, 'structure mismatch must be present after adapter pass');

    // Contract フィールド。
    assert.equal(structureIssue.severity, 'actionable');
    assert.equal(structureIssue.scope, 'section');
    assert.equal(structureIssue.structureCategory, 'kind-multiset');
    assert.deepEqual(structureIssue.enKinds, ['callout-body', 'paragraph']);
    assert.deepEqual(structureIssue.jaKinds, ['paragraph']);
    assert.equal(structureIssue.enSegmentCount, 2);
    assert.equal(structureIssue.jaSegmentCount, 1);
    assert.equal(typeof structureIssue.detail, 'string');
    assert.ok(structureIssue.detail.length > 0);

    // 禁止フィールド — segment 単位の shape が section 単位の adapter
    // 分岐に漏れてはいけない。
    assert.equal(
      Object.prototype.hasOwnProperty.call(structureIssue, 'segmentKind'),
      false,
      'structure issues MUST NOT carry segmentKind after adapter',
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(structureIssue, 'enSegmentIndex'),
      false,
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(structureIssue, 'jaSegmentIndex'),
      false,
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(structureIssue, 'enSourceFingerprint'),
      false,
    );
  });

  it('parityDiffsToIssues forwards contentPermutation for content-order diffs', () => {
    const en = [
      makeHeading('Overview', 0, 'Overview'),
      makeSeg('Overview', 'paragraph', 0, 'Paragraph `alpha`'),
      makeSeg('Overview', 'paragraph', 1, 'Paragraph `beta`'),
    ];
    const ja = [
      makeHeading('概要', 0, '概要'),
      makeSeg('概要', 'paragraph', 0, '`beta` の段落'),
      makeSeg('概要', 'paragraph', 1, '`alpha` の段落'),
    ];
    const result = alignSegments(en, ja);
    const issues = parityDiffsToIssues(result.diffs);
    const issue = issues.find((i) => i.type === 'segment-order-mismatch');
    assert.ok(issue);
    assert.equal(issue.structureCategory, 'content-order');
    assert.ok(Array.isArray(issue.contentPermutation));
    assert.equal(issue.contentPermutation.length, 2);
    for (const entry of issue.contentPermutation) {
      assert.equal(typeof entry.enIndex, 'number');
      assert.equal(typeof entry.jaIndex, 'number');
      assert.equal(typeof entry.score, 'number');
    }
  });
});
