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

describe('maskSegmentText — case-insensitive (Phase 0 fix for textNorm lowercased input)', () => {
  it('masks glossary term in lowercased text (textNorm context)', () => {
    const result = maskSegmentText('the visual editor opens here');
    const entries = result.masks.map((m) => m.entry);
    assert.ok(
      entries.includes('Visual Editor'),
      'Glossary should match case-insensitively because textNorm lowercases input',
    );
  });

  it('masks lowercased Testim term', () => {
    const result = maskSegmentText('open testim to start');
    const entries = result.masks.map((m) => m.entry);
    assert.ok(entries.includes('Testim'));
  });

  it('classifySegment returns isFullyMasked=true for English-only UI label (table cell case)', () => {
    const cls = classifySegment('test editor');
    assert.equal(
      cls.isFullyMasked,
      true,
      'English-only UI label should be masked, not flagged as untranslated',
    );
  });
});

describe('createMaskCoverage — run-level collector', () => {
  it('records masks and returns summary counters', async () => {
    const { createMaskCoverage } = await import('../lib/parity_glossary_mask.mjs');
    const cov = createMaskCoverage();
    cov.record({
      slug: 'test/slug',
      segmentKind: 'paragraph',
      sectionPath: 'Overview',
      masks: [
        { source: 'glossary', entry: 'Visual Editor', span: { start: 0, end: 13 } },
        { source: 'invariant-pattern', pattern: 'cli-flag', span: { start: 20, end: 32 } },
      ],
    });
    const json = cov.toJSON();
    assert.equal(json.summary.segmentsMasked, 1);
    assert.equal(json.summary.byGlossaryEntry['Visual Editor'], 1);
    assert.equal(json.summary.byInvariantPattern['cli-flag'], 1);
    assert.equal(json.maskedSegments.length, 1);
  });

  it('returns empty summary when no masks recorded', async () => {
    const { createMaskCoverage } = await import('../lib/parity_glossary_mask.mjs');
    const cov = createMaskCoverage();
    const json = cov.toJSON();
    assert.equal(json.summary.segmentsMasked, 0);
  });
});

describe('classifySegment — Spec Invariant 5: Residue = バグ (mixed JA/EN must not bypass residue check)', () => {
  it('detects English prose residue in mixed JA/EN segment (CJK does not bypass)', () => {
    // textNorm 経由 (lowercased) を想定。Visual Editor は glossary 経由でマスクされるが、
    // 残りの "click the save button" は英語 prose 残留 = バグとして検知すべき。
    const cls = classifySegment('visual editor で click the save button');
    assert.equal(
      cls.isFullyMasked,
      false,
      'CJK 文字 1 つで早期 return すると Spec Invariant 5 (Residue = バグ) を破る',
    );
    assert.ok(cls.residue.length > 0);
  });

  it('still passes pure CJK text (handled by hasAscii early-return, not CJK fallback)', () => {
    const cls = classifySegment('これは完全に翻訳された段落です。');
    assert.equal(cls.isFullyMasked, true);
  });

  it('still passes glossary + CJK with no English residue', () => {
    // glossary がマスクされ、残りが全て CJK なら residue は空になる
    const cls = classifySegment('test editor を開いて開始します。');
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('GLOSSARY common-word false-negative regression (PR#267 round 2 review)', () => {
  /**
   * 一般的な英単語 (Enter / Tab / Approve / Page Up / Page Down) を GLOSSARY に
   * 登録すると、`\b` word-boundary マッチで他文脈の短い英文 segment も mask され、
   * `classifySegment` の RESIDUE_MIN_WORDS=3 防護層を silent に bypass する。
   *
   * このスイートは以下を pin する:
   *   1. これら 5 語が GLOSSARY に**登録されていない**こと
   *   2. 「英単語 + common word + 英単語」の 3-word all-English segment が
   *      fully-masked と誤判定されないこと (= 未翻訳検知の false-negative 防止)
   */
  it('does not include common English words (Enter/Tab/Approve/Page Up/Page Down) in GLOSSARY', () => {
    const glossary = loadGlossary();
    for (const forbidden of ['Enter', 'Tab', 'Approve', 'Page Up', 'Page Down']) {
      assert.ok(
        !glossary.has(forbidden),
        `GLOSSARY に "${forbidden}" を登録してはいけない: ` +
          `\\b word-boundary マッチで意図しない文脈も mask し、3-word 以下の全英文 segment を silent false-negative にする。` +
          `docs/GLOSSARY.md の「キーボードキー名」コメントを参照。`,
      );
    }
  });

  it('3-word all-English segment containing "Approve" is flagged as untranslated (not silent-passed)', () => {
    // "Click Approve now" は 3 words / 17 chars の全英文。
    // "Approve" を GLOSSARY に登録すると mask されて "Click now" (2 words) が
    // residue となり、RESIDUE_MIN_WORDS=3 未満で isFullyMasked=true に落ちる (false negative)。
    const cls = classifySegment('Click Approve now');
    assert.equal(
      cls.isFullyMasked,
      false,
      '3-word all-English segment は mask で bypass されてはならない',
    );
  });

  it('3-word all-English segment containing "Enter" is flagged', () => {
    const cls = classifySegment('Press Enter key');
    assert.equal(cls.isFullyMasked, false);
  });

  it('3-word all-English segment containing "Tab" is flagged', () => {
    const cls = classifySegment('Select Tab here');
    assert.equal(cls.isFullyMasked, false);
  });
});
