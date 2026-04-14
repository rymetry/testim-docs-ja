// scripts/__tests__/parity_glossary_mask.test.mjs
/**
 * parity_glossary_mask — Testim 用語 / invariant pattern のマスキング。
 *
 * GLOSSARY.md + INVARIANT_TOKENS.md を参照し、segment text をマスクする。
 * マスクされた token は issue として上がらない。残る英語 prose は residue = バグ。
 */

import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let loadGlossary;
let loadInvariantPatterns;
let maskSegmentText;
let classifySegment;

before(async () => {
  ({ loadGlossary, loadInvariantPatterns, maskSegmentText, classifySegment } =
    await import('../lib/parity_glossary_mask.mjs'));
});

describe('loadGlossary — reads docs/GLOSSARY.md', () => {
  it('returns a Set of canonical terms including Testim and Visual Editor', () => {
    const glossary = loadGlossary();
    assert.ok(glossary instanceof Set);
    assert.ok(glossary.has('Testim'));
    assert.ok(glossary.has('Visual Editor'));
    assert.ok(glossary.has('Test Editor'));
  });
});

describe('loadInvariantPatterns — reads docs/INVARIANT_TOKENS.md', () => {
  it('returns an array of { id, regex } entries', () => {
    const patterns = loadInvariantPatterns();
    assert.ok(Array.isArray(patterns));
    const ids = patterns.map((p) => p.id);
    assert.ok(ids.includes('keyboard-shortcut'));
    assert.ok(ids.includes('cli-flag'));
    for (const p of patterns) {
      assert.ok(p.regex instanceof RegExp);
    }
  });
});

describe('maskSegmentText — glossary match', () => {
  it('masks multi-word glossary term correctly', () => {
    const result = maskSegmentText('The Visual Editor shows step properties.');
    assert.ok(result.maskedText.includes('__GLOSSARY__'));
    const entries = result.masks.map((m) => m.entry);
    assert.ok(entries.includes('Visual Editor'));
  });

  it('masks Testim term at start of sentence', () => {
    const result = maskSegmentText('Testim helps you build tests.');
    const entries = result.masks.map((m) => m.entry);
    assert.ok(entries.includes('Testim'));
  });
});

describe('maskSegmentText — invariant pattern match', () => {
  it('masks keyboard shortcut via invariant pattern', () => {
    const result = maskSegmentText('Press Ctrl+S to save.');
    assert.ok(result.maskedText.includes('__INVARIANT__'));
    const patterns = result.masks.map((m) => m.pattern);
    assert.ok(patterns.includes('keyboard-shortcut'));
  });

  it('masks CLI flag', () => {
    const result = maskSegmentText('Run with --project-id option.');
    const patterns = result.masks.map((m) => m.pattern);
    assert.ok(patterns.includes('cli-flag'));
  });
});

describe('classifySegment — residue detection', () => {
  it('returns isFullyMasked=true when no residue English remains', () => {
    const cls = classifySegment('Testim Visual Editor');
    assert.equal(cls.isFullyMasked, true);
  });

  it('returns isFullyMasked=false when untranslated English prose remains', () => {
    const cls = classifySegment('This is an untranslated description of the feature.');
    assert.equal(cls.isFullyMasked, false);
    assert.ok(typeof cls.residue === 'string');
    assert.ok(cls.residue.length > 0);
  });

  it('returns isFullyMasked=true for pure invariant content', () => {
    const cls = classifySegment('--project-id abc Ctrl+S');
    assert.equal(cls.isFullyMasked, true);
  });

  it('returns isFullyMasked=true for Japanese-only text (no English at all)', () => {
    const cls = classifySegment('これは日本語の段落です。');
    assert.equal(cls.isFullyMasked, true);
  });

  it('detects bug: English prose mixed with glossary term', () => {
    const cls = classifySegment(
      'The Visual Editor is a powerful tool for recording tests.',
    );
    assert.equal(cls.isFullyMasked, false);
    assert.ok(cls.residue.length > 10);
  });
});

describe('maskSegmentText — mask record shape', () => {
  it('mask record includes source, entry OR pattern, span (start/end)', () => {
    const result = maskSegmentText('Use the Visual Editor to edit.');
    assert.ok(result.masks.length > 0);
    for (const m of result.masks) {
      assert.ok(['glossary', 'invariant-pattern'].includes(m.source));
      assert.ok(typeof m.span === 'object');
      assert.ok(typeof m.span.start === 'number');
      assert.ok(typeof m.span.end === 'number');
      assert.ok(m.span.end > m.span.start);
    }
  });
});
