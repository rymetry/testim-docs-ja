// scripts/__tests__/parity_glossary_mask.test.mjs
/**
 * parity_glossary_mask — Testim 用語 / invariant pattern のマスキング。
 *
 * GLOSSARY.md + INVARIANT_TOKENS.md を参照し、segment text をマスクする。
 * マスクされた token は issue として上がらない。残る英語 prose は residue = バグ。
 */

import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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

  it('masks Test Name and Test Description as glossary terms', () => {
    // Given: text containing Testim property names (compound terms ≥2 words)
    const result = maskSegmentText('enter the test name and test description');

    // Then: both terms are masked as glossary entries
    const entries = result.masks.map((m) => m.entry);
    assert.ok(entries.includes('Test Name'), 'Test Name must be a glossary term');
    assert.ok(
      entries.includes('Test Description'),
      'Test Description must be a glossary term',
    );
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

  it('masks lowercase keyboard shortcut (textNorm lowercased input)', () => {
    // Given: textNorm lowercases all input, so Ctrl+Shift+I becomes ctrl+shift+i
    const result = maskSegmentText('press ctrl+shift+i to open devtools');

    // Then: keyboard-shortcut pattern matches lowercased modifier keys
    const patterns = result.masks.map((m) => m.pattern);
    assert.ok(
      patterns.includes('keyboard-shortcut'),
      'keyboard-shortcut must match lowercased modifier keys (textNorm lowercases all input)',
    );
  });

  it('masks js-exports-expression via invariant pattern', () => {
    // Given: JS code token exports.xxx in normalized text
    const result = maskSegmentText('add exports.myvar to the scope');

    // Then: matched by js-exports-expression invariant pattern
    const patterns = result.masks.map((m) => m.pattern);
    assert.ok(
      patterns.includes('js-exports-expression'),
      'js-exports-expression should mask exports.xxx tokens',
    );
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

describe('classifySegment — URL/link stripping order (M2-P2-1 pilot regression)', () => {
  // Ordering contract: inline code / markdown links / autolinks / bare URLs
  // must be stripped BEFORE glossary masking. Glossary terms embedded in
  // URLs (e.g. "https", "ios") would otherwise be consumed first, defeating
  // the URL regex applied afterwards and leaving English fragments
  // (byby.dev, spotify.com 等) in the residue — a deterministic
  // false-positive pattern for callout-body segments that reference
  // external URLs.

  it('masks JA callout-body containing bare external URL', () => {
    const cls = classifySegment(
      'サードパーティアプリは url ベースのスキームのみサポートする場合があります。例: https://byby.dev/ios-deep-linking 参照。',
    );
    assert.equal(cls.isFullyMasked, true, `residue: ${cls.residue}`);
  });

  it('masks JA callout-body containing markdown link [url](url)', () => {
    const cls = classifySegment(
      'spotify は次の種類の deep link のみサポートします: [https://open.spotify.com/artist/abc](https://open.spotify.com/artist/abc)',
    );
    assert.equal(cls.isFullyMasked, true, `residue: ${cls.residue}`);
  });

  it('masks JA callout-body containing GFM autolink <url>', () => {
    const cls = classifySegment(
      'サードパーティアプリは url ベースのスキームのみサポートする場合があります。例: <https://byby.dev/ios-deep-linking>',
    );
    assert.equal(cls.isFullyMasked, true, `residue: ${cls.residue}`);
  });

  it('masks JA text with backtick-wrapped URL', () => {
    const cls = classifySegment(
      '例として `https://byby.dev/ios-deep-linking` を参照してください。',
    );
    assert.equal(cls.isFullyMasked, true, `residue: ${cls.residue}`);
  });

  it('masks JA text referencing internal /docs link', () => {
    const cls = classifySegment(
      '詳細は [Conditions](/docs/editing-tests/conditions) を参照してください。',
    );
    assert.equal(cls.isFullyMasked, true, `residue: ${cls.residue}`);
  });

  it('still flags untranslated EN prose even when URLs are present', () => {
    // Negative boundary: URL stripping must not mask genuine untranslated prose.
    const cls = classifySegment(
      'This is an untranslated description referring to https://byby.dev/ios-deep-linking for more details.',
    );
    assert.equal(cls.isFullyMasked, false);
    assert.ok(cls.residue.length > 10, `expected residue, got: "${cls.residue}"`);
  });

  it('still flags untranslated EN prose inside markdown link context', () => {
    const cls = classifySegment(
      'The [documentation](https://example.com) describes advanced features in detail.',
    );
    assert.equal(cls.isFullyMasked, false);
  });

  it('handles URL with percent-encoded non-ASCII path (boundary)', () => {
    // URLs may contain percent-encoded bytes for non-ASCII paths (e.g. Japanese
    // page slugs). \S+ pre-strip must consume the entire URL without leaving
    // percent-encoded fragments in the residue.
    const cls = classifySegment(
      '詳細は https://example.com/docs/%E6%97%A5%E6%9C%AC%E8%AA%9E を参照してください。',
    );
    assert.equal(cls.isFullyMasked, true, `residue: ${cls.residue}`);
  });

  it('handles bare URL followed by Japanese punctuation (boundary)', () => {
    // Japanese "。" is treated as non-whitespace by \S+, so the period must
    // not terminate URL stripping in a way that leaves residue behind. The
    // ideographic period itself is CJK-stripped later; what matters is the
    // URL body gets fully consumed.
    const cls = classifySegment(
      'リポジトリは https://github.com/example/repo にあります。続きは後述します。',
    );
    assert.equal(cls.isFullyMasked, true, `residue: ${cls.residue}`);
  });

  it('leaves malformed URL scheme as residue (negative boundary)', () => {
    // "https:/" (single slash) does not match the pre-strip regex. The
    // English prose around it must still be classified as untranslated so
    // that genuinely broken content is not masked away silently.
    const cls = classifySegment(
      'This page mentions a malformed link https:/example.com that is broken.',
    );
    assert.equal(cls.isFullyMasked, false);
  });

  it('accepts multiple backtick-wrapped URLs in sequence (boundary)', () => {
    // Non-greedy `[^`]*` handles consecutive backtick pairs without crossing
    // each other. Two CLI-style tokens side by side should both be stripped.
    const cls = classifySegment(
      '例として `https://byby.dev/ios-deep-linking` および `https://open.spotify.com/artist/abc` を参照してください。',
    );
    assert.equal(cls.isFullyMasked, true, `residue: ${cls.residue}`);
  });
});

describe('classifySegment — §5.3.6 preStrip backtick fix (GFM double-backtick)', () => {
  /**
   * PR #309 reviewer agent 73 が検出した classifier `preStrip` backtick no-op
   * bug への regression guard。旧 `/`[^`]*`/g` は **GFM double-backtick pair**
   * (``code``) に対して先頭の空 single-pair `` にマッチを譲り、2 個目以降の
   * content が residue に残って strip が実質 no-op になる edge case があった。
   *
   * 新 regex `` /``[^`]*``|`[^`]*`/g `` は alternation で double-pair を先に
   * 消費するため、single と double の両方を確実に strip する。
   *
   * PR #293 の URL-before-mask ordering (inline code を glossary masking より
   * 前に strip する契約) は完全保全。
   */

  it('strips single-backtick inline code before glossary masking', () => {
    // Pre-fix: `cmd` → glossary masker sees "cmd をテスト実行"
    // Post-fix: `cmd` is stripped → only " をテスト実行" reaches masker.
    // 3-word English threshold not triggered in either case, but post-fix
    // ensures inline code content never leaks into residue word-count.
    const cls = classifySegment('`verylongunknownidentifier` をテスト実行');
    assert.equal(cls.isFullyMasked, true, `residue: ${cls.residue}`);
  });

  it('strips GFM double-backtick inline code (bug 1 regression guard)', () => {
    // Pre-fix: `` ``code`` `` パターンで先頭 `` が空 pair にマッチし、
    // content ("code containing `backticks` here" 等) が residue に残る。
    // 3 word 以上の英単語があれば isFullyMasked=false 誤判定。
    const cls = classifySegment(
      '``code containing `backticks` here`` のような GFM double-backtick pattern',
    );
    assert.equal(
      cls.isFullyMasked,
      true,
      `GFM double-backtick content must be fully stripped. residue: ${cls.residue}`,
    );
  });

  it('strips adjacent double-backtick pairs without leaving content', () => {
    // Edge case: 複数の double-backtick pair が続く場合も全 content を strip
    const cls = classifySegment(
      '``foo bar baz`` and ``qux quux corge`` technical content here テストです',
    );
    // "and" / "technical content here" の 4 word 英文が残るため、
    // double-backtick strip が effective かどうかの boundary test:
    // - effective (期待): residue = " and technical content here " → 4 words → isFullyMasked=false
    // - no-op (bug): residue = " foo bar baz and qux quux corge technical content here " → 10 words → isFullyMasked=false
    // 両方とも isFullyMasked=false だが、residue の内容が異なる。
    assert.equal(cls.isFullyMasked, false);
    // content inside double-backticks must NOT appear in residue
    assert.ok(
      !cls.residue.includes('foo bar baz'),
      `content inside \`\`...\`\` must be stripped. residue: ${cls.residue}`,
    );
    assert.ok(
      !cls.residue.includes('qux quux corge'),
      `content inside \`\`...\`\` must be stripped. residue: ${cls.residue}`,
    );
  });

  it('PR #293 regression guard: URL classification unchanged (bare URL)', () => {
    // URL-before-mask ordering (PR #293) が preserve されていることを確認。
    // backtick regex 変更が URL strip pass の挙動に干渉しないこと。
    const cls = classifySegment(
      'サードパーティアプリは url ベースのスキームのみサポートする場合があります。例: https://byby.dev/ios-deep-linking 参照。',
    );
    assert.equal(cls.isFullyMasked, true, `residue: ${cls.residue}`);
  });

  it('PR #293 regression guard: URL classification unchanged (GFM autolink)', () => {
    const cls = classifySegment(
      'リポジトリは <https://github.com/example/repo> にあります。',
    );
    assert.equal(cls.isFullyMasked, true, `residue: ${cls.residue}`);
  });

  it('PR #293 regression guard: untranslated EN prose with URL still flagged', () => {
    // Negative boundary: URL strip が genuine untranslated prose を mask しない。
    const cls = classifySegment(
      'This is an untranslated description referring to https://byby.dev/ios-deep-linking for more details.',
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

describe('GLOSSARY compound general-word removal regression (T4 / plan §3.2)', () => {
  /**
   * T4 で削除した 4 一般語 (browser version / major version / Add action / Add validation)
   * が再登録されても、一般 IT 英文の 3+ 語 segment が silent false-negative にならないこと。
   */
  it('does not include compound general words (browser version / major version / Add action / Add validation) in GLOSSARY', () => {
    const glossary = loadGlossary();
    for (const forbidden of ['browser version', 'major version', 'Add action', 'Add validation']) {
      assert.ok(
        !glossary.has(forbidden),
        `GLOSSARY に "${forbidden}" を登録してはいけない: T4 で削除 (plan §3.2)`,
      );
    }
  });

  it('English regression: "Click Add action button" is flagged as untranslated', () => {
    const cls = classifySegment('Click Add action button');
    assert.equal(
      cls.isFullyMasked,
      false,
      '4-word all-English segment は mask で bypass されてはならない',
    );
  });

  it('English regression: "Please Add validation now" is flagged', () => {
    const cls = classifySegment('Please Add validation now');
    assert.equal(cls.isFullyMasked, false);
  });

  it('English regression: "Select browser version carefully" is flagged', () => {
    const cls = classifySegment('Select browser version carefully');
    assert.equal(cls.isFullyMasked, false);
  });

  it('English regression: "Choose major version now" is flagged', () => {
    const cls = classifySegment('Choose major version now');
    assert.equal(cls.isFullyMasked, false);
  });
});

describe('INVARIANT_TOKENS.md contract completeness (ARCH-001 regression)', () => {
  it('header documents all fields that the parser reads: id, regex, flags, example, note', () => {
    const md = readFileSync('docs/INVARIANT_TOKENS.md', 'utf8');
    // Header section is between the first "各 pattern には:" and the next "---"
    const headerMatch = md.match(/各 pattern には:\n([\s\S]*?)(?=\n登録基準:)/);
    assert.ok(headerMatch, 'Header section "各 pattern には:" must exist');
    const header = headerMatch[1];
    for (const field of ['id', 'regex', 'flags', 'example', 'note']) {
      assert.ok(
        header.includes(`\`${field}\``),
        `Header must document the "${field}" field`,
      );
    }
  });

  it('registration procedure mentions the flags field', () => {
    const md = readFileSync('docs/INVARIANT_TOKENS.md', 'utf8');
    const procedureMatch = md.match(/## 登録手順\n([\s\S]*?)$/);
    assert.ok(procedureMatch, 'Registration procedure section must exist');
    assert.ok(
      procedureMatch[1].includes('flags'),
      'Registration procedure must mention flags',
    );
  });
});

describe('INVARIANT_TOKENS inventory guard (T1 silent-drop prevention / plan §7 R2)', () => {
  // frozen canonical set: PR #286-#291 stack で復元された pattern + M4 narrow split の新 ID
  // silent drop 検知のため、loadInvariantPatterns の ID 集合がこの set を ⊇ で含むこと
  const FROZEN_CANONICAL_IDS = [
    'inline-js-throw-return',
    'table-header-pattern',
    'sfdc-ui-name-with-parens',
    'keyboard-shortcut-spaced',
    // M4 T19 narrow split (2026-04-16): 旧 common-it-loanword / technical-concept-term を置換
    'common-it-loanword-device',
    'common-it-loanword-network',
    'common-it-loanword-ops',
    'technical-concept-repo',
    'technical-concept-auth',
    'technical-concept-validation',
  ];

  it('loadInvariantPatterns() returns superset of frozen canonical IDs', () => {
    const patterns = loadInvariantPatterns();
    const ids = new Set(patterns.map((p) => p.id));
    for (const id of FROZEN_CANONICAL_IDS) {
      assert.ok(
        ids.has(id),
        `frozen canonical pattern "${id}" must remain in INVARIANT_TOKENS.md (silent drop regression guard)`,
      );
    }
  });

  it('M4 T19 narrow split: 旧広 alternation pattern が削除されている', () => {
    const patterns = loadInvariantPatterns();
    const ids = new Set(patterns.map((p) => p.id));
    // 旧 wide pattern は narrow 分割後に削除されているべき
    for (const removedId of ['common-it-loanword', 'technical-concept-term']) {
      assert.ok(
        !ids.has(removedId),
        `旧 wide pattern "${removedId}" は M4 T19 で narrow 分割されたため削除済みのはず`,
      );
    }
  });
});

describe('maskSegmentText — restored PR #286-#291 patterns (T1 / T3 regression)', () => {
  // Each pattern: (a) masks expected example, (b) does not falsely mask out-of-context text

  it('sfdc-ui-name-with-parens: masks "Filter (Where)" but not "Filter the list carefully"', () => {
    const hit = maskSegmentText('Use Filter (Where) to narrow the scope.');
    const hitPatterns = hit.masks.map((m) => m.pattern);
    assert.ok(
      hitPatterns.includes('sfdc-ui-name-with-parens'),
      'sfdc-ui-name-with-parens must mask "Filter (Where)"',
    );

    const miss = maskSegmentText('Please filter the list carefully before submit.');
    const missPatterns = miss.masks.map((m) => m.pattern);
    assert.ok(
      !missPatterns.includes('sfdc-ui-name-with-parens'),
      'sfdc-ui-name-with-parens must NOT mask generic "filter" prose',
    );
  });

  it('inline-js-throw-return: masks "throw new Error(" but not "error message"', () => {
    const hit = maskSegmentText('The handler will throw new Error(msg) on failure.');
    const hitPatterns = hit.masks.map((m) => m.pattern);
    assert.ok(
      hitPatterns.includes('inline-js-throw-return'),
      'inline-js-throw-return must mask "throw new Error("',
    );

    const miss = maskSegmentText('Review the error message before retry.');
    const missPatterns = miss.masks.map((m) => m.pattern);
    assert.ok(
      !missPatterns.includes('inline-js-throw-return'),
      'inline-js-throw-return must NOT mask generic "error" prose',
    );
  });

  it('table-header-pattern: regex matches documented examples (Name/Type/Value/Package)', () => {
    // GLOSSARY pre-empts single-word matches via maskSegmentText pipeline;
    // verify via regex directly that documented examples are covered by the pattern.
    const patterns = loadInvariantPatterns();
    const p = patterns.find((x) => x.id === 'table-header-pattern');
    assert.ok(p, 'table-header-pattern must be loaded');
    for (const word of ['Name', 'Type', 'Value', 'Package']) {
      assert.ok(
        new RegExp(p.regex.source, p.regex.flags).test(word),
        `table-header-pattern regex must match documented example "${word}"`,
      );
    }
    // Does NOT match unrelated word (negative case — ensures alternation is bounded)
    assert.ok(
      !new RegExp(p.regex.source, p.regex.flags).test('unrelated'),
      'table-header-pattern regex must NOT match unrelated prose token',
    );
  });

  it('common-it-loanword-device: regex matches documented examples (simulator/emulator/mobile)', () => {
    const patterns = loadInvariantPatterns();
    const p = patterns.find((x) => x.id === 'common-it-loanword-device');
    assert.ok(p, 'common-it-loanword-device must be loaded');
    for (const word of ['simulator', 'emulator', 'mobile', 'device', 'compile']) {
      assert.ok(
        new RegExp(p.regex.source, p.regex.flags).test(word),
        `common-it-loanword-device regex must match documented example "${word}"`,
      );
    }
    assert.ok(
      !new RegExp(p.regex.source, p.regex.flags).test('totallydifferentword'),
      'common-it-loanword-device regex must NOT match out-of-alternation token',
    );
  });

  it('common-it-loanword-network: regex matches network/auth tokens (web/plugin/proxy/token)', () => {
    const patterns = loadInvariantPatterns();
    const p = patterns.find((x) => x.id === 'common-it-loanword-network');
    assert.ok(p, 'common-it-loanword-network must be loaded');
    for (const word of ['web', 'plugin', 'proxy', 'token', 'webhook', 'server']) {
      assert.ok(
        new RegExp(p.regex.source, p.regex.flags).test(word),
        `common-it-loanword-network regex must match documented example "${word}"`,
      );
    }
    // boundary integrity — out-of-alternation token must NOT match
    assert.ok(
      !new RegExp(p.regex.source, p.regex.flags).test('unrelatednetworkword'),
      'common-it-loanword-network regex must NOT match out-of-alternation token',
    );
  });

  it('common-it-loanword-ops: regex matches ops/debug tokens (dashboard/breakpoint/localhost)', () => {
    const patterns = loadInvariantPatterns();
    const p = patterns.find((x) => x.id === 'common-it-loanword-ops');
    assert.ok(p, 'common-it-loanword-ops must be loaded');
    // corpus 拡張: 13 entries の過半数 (8 token) をカバー (test evidence 強化)
    for (const word of [
      'dashboard',
      'execution',
      'breakpoint',
      'localhost',
      'debugger',
      'screenshot',
      'timeout',
      'override',
    ]) {
      assert.ok(
        new RegExp(p.regex.source, p.regex.flags).test(word),
        `common-it-loanword-ops regex must match documented example "${word}"`,
      );
    }
    // boundary integrity — out-of-alternation token must NOT match
    assert.ok(
      !new RegExp(p.regex.source, p.regex.flags).test('unrelatedopsword'),
      'common-it-loanword-ops regex must NOT match out-of-alternation token',
    );
  });

  it('technical-concept-repo: regex matches repo/pipeline tokens', () => {
    const patterns = loadInvariantPatterns();
    const p = patterns.find((x) => x.id === 'technical-concept-repo');
    assert.ok(p, 'technical-concept-repo must be loaded');
    for (const word of ['repository', 'pipeline', 'credentials']) {
      assert.ok(
        new RegExp(p.regex.source, p.regex.flags).test(word),
        `technical-concept-repo regex must match documented example "${word}"`,
      );
    }
    assert.ok(
      !new RegExp(p.regex.source, p.regex.flags).test('unrelatedword'),
      'technical-concept-repo regex must NOT match unrelated prose token',
    );
  });

  it('technical-concept-auth: regex matches auth/API tokens', () => {
    const patterns = loadInvariantPatterns();
    const p = patterns.find((x) => x.id === 'technical-concept-auth');
    assert.ok(p, 'technical-concept-auth must be loaded');
    for (const word of ['authentication', 'authorization', 'endpoint', 'middleware', 'callback']) {
      assert.ok(
        new RegExp(p.regex.source, p.regex.flags).test(word),
        `technical-concept-auth regex must match documented example "${word}"`,
      );
    }
    // boundary integrity — out-of-alternation token must NOT match
    assert.ok(
      !new RegExp(p.regex.source, p.regex.flags).test('unrelatedauthword'),
      'technical-concept-auth regex must NOT match out-of-alternation token',
    );
  });

  it('technical-concept-validation: regex matches validation tokens and rejects near-neighbors', () => {
    const patterns = loadInvariantPatterns();
    const p = patterns.find((x) => x.id === 'technical-concept-validation');
    assert.ok(p, 'technical-concept-validation must be loaded');
    // positive: 2 entry の full corpus + word-boundary 境界 check
    for (const word of ['assertion', 'validation']) {
      assert.ok(
        new RegExp(p.regex.source, p.regex.flags).test(word),
        `technical-concept-validation regex must match documented example "${word}"`,
      );
    }
    // boundary integrity — near-neighbor / out-of-alternation token must NOT match
    // (validations/validator/validated 等の語幹派生は別扱い、厳密一致のみ)
    for (const nonMatch of ['schema', 'constraint', 'unrelatedvalidationword']) {
      assert.ok(
        !new RegExp(p.regex.source, p.regex.flags).test(nonMatch),
        `technical-concept-validation regex must NOT match "${nonMatch}" (out-of-alternation boundary)`,
      );
    }
  });

  it('keyboard-shortcut-spaced: masks "Ctrl + S" with spaced modifier', () => {
    const hit = maskSegmentText('Press Ctrl + S to save the file.');
    const hitPatterns = hit.masks.map((m) => m.pattern);
    assert.ok(
      hitPatterns.includes('keyboard-shortcut-spaced') ||
        hitPatterns.includes('keyboard-shortcut'),
      'keyboard-shortcut-spaced must mask "Ctrl + S" with spaces around +',
    );

    const miss = maskSegmentText('Plain prose without shortcut reference.');
    const missPatterns = miss.masks.map((m) => m.pattern);
    assert.ok(
      !missPatterns.includes('keyboard-shortcut-spaced'),
      'keyboard-shortcut-spaced must NOT mask plain prose',
    );
  });
});
