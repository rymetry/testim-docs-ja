/**
 * Tests for the shared canonical segment types and helpers.
 *
 * The shared module defines the Segment schema, text normalization, fingerprinting,
 * section path construction, and a createSegment factory used by both the EN HTML
 * and JA markdown extractors.
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let SEGMENT_KINDS;
let GATE_ELIGIBLE_KINDS;
let normalizeSegmentText;
let computeSegmentFingerprint;
let pushHeading;
let buildSectionPath;
let createSegment;
let isGateEligible;

before(async () => {
  ({
    SEGMENT_KINDS,
    GATE_ELIGIBLE_KINDS,
    normalizeSegmentText,
    computeSegmentFingerprint,
    pushHeading,
    buildSectionPath,
    createSegment,
    isGateEligible,
  } = await import('../lib/source_parity_segments_shared.mjs'));
});

// ---------------------------------------------------------------------------
// SEGMENT_KINDS
// ---------------------------------------------------------------------------

describe('SEGMENT_KINDS', () => {
  it('exposes the canonical segment kinds used by extractors', () => {
    const expected = [
      'heading',
      'paragraph',
      'ordered-list-item',
      'unordered-list-item',
      'callout-body',
      'table-cell',
      'details-summary',
      'image-caption',
      'code-block',
      'image',
    ];
    for (const kind of expected) {
      assert.ok(SEGMENT_KINDS.includes(kind), `missing kind: ${kind}`);
    }
  });

  it('GATE_ELIGIBLE_KINDS excludes code-block and image (raw), includes text kinds', () => {
    assert.ok(!GATE_ELIGIBLE_KINDS.includes('code-block'));
    assert.ok(!GATE_ELIGIBLE_KINDS.includes('image'));
    assert.ok(GATE_ELIGIBLE_KINDS.includes('heading'));
    assert.ok(GATE_ELIGIBLE_KINDS.includes('paragraph'));
    assert.ok(GATE_ELIGIBLE_KINDS.includes('ordered-list-item'));
    assert.ok(GATE_ELIGIBLE_KINDS.includes('callout-body'));
    assert.ok(GATE_ELIGIBLE_KINDS.includes('table-cell'));
  });

  it('GATE_ELIGIBLE_KINDS excludes image-caption (declared but unemitted)', () => {
    assert.ok(!GATE_ELIGIBLE_KINDS.includes('image-caption'));
  });

  it('isGateEligible() reflects GATE_ELIGIBLE_KINDS membership', () => {
    assert.equal(isGateEligible('paragraph'), true);
    assert.equal(isGateEligible('code-block'), false);
    assert.equal(isGateEligible('image'), false);
    assert.equal(isGateEligible('unknown-kind'), false);
  });
});

// ---------------------------------------------------------------------------
// normalizeSegmentText
// ---------------------------------------------------------------------------

describe('normalizeSegmentText', () => {
  it('collapses runs of whitespace to a single space', () => {
    assert.equal(normalizeSegmentText('hello   world\n\tfoo'), 'hello world foo');
  });

  it('trims leading and trailing whitespace', () => {
    assert.equal(normalizeSegmentText('  padded  '), 'padded');
  });

  it('strips zero-width and BOM characters', () => {
    assert.equal(normalizeSegmentText('a\u200Bb\u200Cc\u200Dd\uFEFFe'), 'abcde');
  });

  it('strips markdown bold/italic markers but keeps inner text', () => {
    assert.equal(normalizeSegmentText('**bold** and *italic* text'), 'bold and italic text');
  });

  it('strips inline code fences but keeps inner text (tokens captured elsewhere)', () => {
    assert.equal(normalizeSegmentText('use `--proxy` to set it'), 'use --proxy to set it');
  });

  it('strips markdown links and keeps link text', () => {
    assert.equal(
      normalizeSegmentText('see [the docs](https://example.com) for more'),
      'see the docs for more',
    );
  });

  it('lowercases ASCII letters (for case-insensitive alignment)', () => {
    assert.equal(normalizeSegmentText('CLI Prerequisites'), 'cli prerequisites');
  });

  it('preserves Japanese characters without casing changes', () => {
    assert.equal(normalizeSegmentText('  テスト  実行  '), 'テスト 実行');
  });

  it('returns empty string for empty or whitespace-only input', () => {
    assert.equal(normalizeSegmentText(''), '');
    assert.equal(normalizeSegmentText('   \n\t  '), '');
  });
});

// ---------------------------------------------------------------------------
// computeSegmentFingerprint
// ---------------------------------------------------------------------------

describe('computeSegmentFingerprint', () => {
  it('produces a stable sha256: prefixed hex string', () => {
    const fp = computeSegmentFingerprint('hello world');
    assert.match(fp, /^sha256:[0-9a-f]{64}$/);
  });

  it('is deterministic for identical input', () => {
    assert.equal(
      computeSegmentFingerprint('same text'),
      computeSegmentFingerprint('same text'),
    );
  });

  it('differs for distinct input (no collision on simple strings)', () => {
    assert.notEqual(
      computeSegmentFingerprint('foo'),
      computeSegmentFingerprint('bar'),
    );
  });

  it('normalizes CRLF to LF before hashing so cross-platform input is stable', () => {
    assert.equal(
      computeSegmentFingerprint('line1\nline2'),
      computeSegmentFingerprint('line1\r\nline2'),
    );
  });
});

// ---------------------------------------------------------------------------
// Heading stack + sectionPath
// ---------------------------------------------------------------------------

describe('pushHeading + buildSectionPath', () => {
  it('builds an empty path when no headings have been pushed', () => {
    assert.equal(buildSectionPath([]), '');
  });

  it('pushes a single H2 and produces its text as the path', () => {
    const stack = pushHeading([], 2, 'Overview');
    assert.equal(buildSectionPath(stack), 'Overview');
  });

  it('nests H2 > H3 > H4 with " > " separator', () => {
    let stack = pushHeading([], 2, 'Setup');
    stack = pushHeading(stack, 3, 'Install');
    stack = pushHeading(stack, 4, 'Windows');
    assert.equal(buildSectionPath(stack), 'Setup > Install > Windows');
  });

  it('truncates deeper levels when a shallower heading arrives', () => {
    let stack = pushHeading([], 2, 'A');
    stack = pushHeading(stack, 3, 'A1');
    stack = pushHeading(stack, 4, 'A1a');
    stack = pushHeading(stack, 3, 'A2');
    assert.equal(buildSectionPath(stack), 'A > A2');
  });

  it('replaces same-level heading in place', () => {
    let stack = pushHeading([], 2, 'First');
    stack = pushHeading(stack, 2, 'Second');
    assert.equal(buildSectionPath(stack), 'Second');
  });

  it('does not mutate the input stack (immutability)', () => {
    const stack = pushHeading([], 2, 'Root');
    const next = pushHeading(stack, 3, 'Child');
    assert.equal(buildSectionPath(stack), 'Root');
    assert.equal(buildSectionPath(next), 'Root > Child');
  });

  it('trims whitespace from heading text', () => {
    const stack = pushHeading([], 2, '  Padded Title  ');
    assert.equal(buildSectionPath(stack), 'Padded Title');
  });
});

// ---------------------------------------------------------------------------
// createSegment
// ---------------------------------------------------------------------------

describe('createSegment', () => {
  it('produces a Segment with all required fields from raw text', () => {
    const segment = createSegment({
      sectionPath: 'Setup > Install',
      kind: 'paragraph',
      segmentIndex: 2,
      rawText: 'Use `--proxy` to connect via https://example.com/foo.',
      line: 42,
    });
    assert.equal(segment.sectionPath, 'Setup > Install');
    assert.equal(segment.segmentKind, 'paragraph');
    assert.equal(segment.segmentIndex, 2);
    assert.equal(segment.textNorm, 'use --proxy to connect via https://example.com/foo.');
    assert.ok(Array.isArray(segment.tokensInvariant));
    assert.ok(segment.tokensInvariant.includes('--proxy'));
    assert.match(segment.sourceFingerprint, /^sha256:[0-9a-f]{64}$/);
    assert.equal(segment.line, 42);
  });

  it('defaults line to null when not provided', () => {
    const segment = createSegment({
      sectionPath: 'A',
      kind: 'heading',
      segmentIndex: 0,
      rawText: 'Hello',
    });
    assert.equal(segment.line, null);
  });

  it('rejects unknown segment kinds', () => {
    assert.throws(
      () =>
        createSegment({
          sectionPath: 'A',
          kind: 'not-a-kind',
          segmentIndex: 0,
          rawText: 'x',
        }),
      /unknown segment kind/i,
    );
  });

  it('sorts tokensInvariant deterministically', () => {
    const segment = createSegment({
      sectionPath: 'A',
      kind: 'paragraph',
      segmentIndex: 0,
      rawText: 'use `--zebra` and `--alpha` flags',
    });
    const { tokensInvariant } = segment;
    const sorted = [...tokensInvariant].sort();
    assert.deepEqual(tokensInvariant, sorted);
  });
});
