// scripts/__tests__/b1_segment_untranslated_small_cats.test.mjs
/**
 * B1 PR1 — segment-untranslated burn-down for 7 small categories.
 *
 * Verifies that planned INVARIANT_TOKENS / GLOSSARY / content-edit changes
 * resolve the 6 remaining segment-untranslated baseline entries across
 * debugging-tests, getting-started, guides categories.
 *
 * Resolution patterns:
 *   A. INVARIANT pattern fix/addition → classifySegment masks code tokens
 *   B. GLOSSARY compound term addition → classifySegment masks UI labels
 *   C. Content edit (JA text) → residue falls below RESIDUE_MIN_WORDS=3
 *
 * Tests use the exact textNorm that parity_glossary_mask.classifySegment
 * receives (lowercased, inline-formatting stripped by normalizeSegmentText).
 */

import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let loadGlossary;
let classifySegment;

before(async () => {
  ({ loadGlossary, classifySegment } = await import(
    '../lib/parity_glossary_mask.mjs'
  ));
});

// ---------------------------------------------------------------------------
// GLOSSARY registration
// ---------------------------------------------------------------------------

describe('B1 small-cats — GLOSSARY term registration', () => {
  it('Test Name and Test Description are registered in GLOSSARY', () => {
    const glossary = loadGlossary();
    const required = ['Test Name', 'Test Description'];
    const missing = required.filter((t) => !glossary.has(t));
    assert.equal(
      missing.length,
      0,
      `Missing GLOSSARY terms: ${missing.join(', ')}`,
    );
  });
});

// ---------------------------------------------------------------------------
// Segment resolution — INVARIANT pattern changes (entries 1, 5)
// ---------------------------------------------------------------------------

describe('B1 small-cats — INVARIANT pattern resolution', () => {
  it('entry #1: js-code-debugging keyboard shortcuts masked after lowercase fix', () => {
    // Given: textNorm of ordered-list-item[4] — keyboard shortcuts lowercased
    // AUT, Chrome DevTools, Windows, macOS already glossary-masked.
    // ctrl+shift+i and ctrl+option+i require keyboard-shortcut lowercase fix.
    // After fix: residue = "web", "f12" (2 words < 3) → passes.
    const cls = classifySegment(
      'aut の web ブラウザで、chrome devtools（windows: ctrl+shift+i または ' +
        'f12、ブラウザの右クリックから「検証」/ macos: ctrl+option+i、' +
        'ブラウザの右クリックから「検証」）を開きます。',
    );
    assert.equal(
      cls.isFullyMasked,
      true,
      'keyboard-shortcut lowercase fix should resolve this segment',
    );
  });

  it('entry #5: generate-random-data-with-js exports.xxx masked after pattern addition', () => {
    // Given: textNorm of unordered-list-item[1] — exports.myvar / exports.besttestingtool
    // JS and Testim already glossary-masked.
    // exports.myvar and exports.besttestingtool require js-exports-expression pattern.
    // After pattern: residue = "myvar" (1 word < 3) → passes.
    const cls = classifySegment(
      'カスタム js ステップから含まれるグループに値をエクスポートする。' +
        '例えば、js ステップに exports.myvar = "testim" を追加します。' +
        'これにより、親（含まれる）グループのスコープ内に myvar という' +
        '名前の変数が作成されます。エクスポートパラメータードキュメントの' +
        '例を参照できます（このリンクをたどって、' +
        'exports.besttestingtool = "testim" を検索してください）。',
    );
    assert.equal(
      cls.isFullyMasked,
      true,
      'js-exports-expression pattern should resolve this segment',
    );
  });
});

// ---------------------------------------------------------------------------
// Segment resolution — GLOSSARY term addition (entry 4)
// ---------------------------------------------------------------------------

describe('B1 small-cats — GLOSSARY term resolution', () => {
  it('entry #4: creating-your-first-mobile-test Test Name/Test Description masked', () => {
    // Given: textNorm of ordered-list-item[6] — "test name", "test description"
    // After GLOSSARY addition: both masked, residue = "setup" (1 word < 3) → passes.
    const cls = classifySegment(
      'setup ステップをクリックし、test name と test description を入力します。',
    );
    assert.equal(
      cls.isFullyMasked,
      true,
      'Test Name/Test Description glossary addition should resolve this segment',
    );
  });
});

// ---------------------------------------------------------------------------
// Segment resolution — content edits (entries 2, 3, 6)
// These use POST-EDIT textNorm: the JA markdown text after planned edits,
// passed through normalizeSegmentText (strip formatting, lowercase).
// ---------------------------------------------------------------------------

describe('B1 small-cats — content edit resolution', () => {
  it('entry #2: creating-your-first-codeless-test Name→名前 resolves ordered-list-item[6]', () => {
    // Given: post-edit textNorm — **Name** → **名前** (bold stripped, lowercased)
    // Space & Beyond already glossary-masked.
    // Residue = "demo", "01", "ok" — "01" has no letter → 2 words < 3.
    const cls = classifySegment(
      '名前 フィールドに space & beyond demo 01 と入力し、ok をクリック' +
        'します。テストが保存され、最初のテストが完成しました！',
    );
    assert.equal(
      cls.isFullyMasked,
      true,
      'After Name→名前 edit, English residue falls below threshold',
    );
  });

  it('entry #3: creating-your-first-codeless-test Login→ログイン, John→ジョン resolves paragraph[0]', () => {
    // Given: post-edit textNorm — **Login** → **ログイン**, 2nd John → ジョン
    // Residue = "hello", "john" (from quoted "HELLO, JOHN") — 2 words < 3.
    const cls = classifySegment(
      'このチュートリアルでは、ユーザーがログインした後にヘッダーバーの ' +
        'ログイン ボタンが「hello, john」というテキストに置き換わることを確認する' +
        '検証を追加します（このデモサイトでは入力したユーザー名に関係なく常に ' +
        'ジョン が表示されます）。',
    );
    assert.equal(
      cls.isFullyMasked,
      true,
      'After Login→ログイン + John→ジョン edit, residue falls below threshold',
    );
  });

  it('entry #6: mobile-web-testing Web→ウェブ resolves paragraph[0]', () => {
    // Given: post-edit textNorm — Web → ウェブ (3 occurrences)
    // Chromium and Chrome already glossary-masked.
    // No English residue remains.
    const cls = classifySegment(
      '現在、モバイル ウェブ テストには別のプロジェクトが必要です。' +
        'モバイル ウェブ テストは chromium エミュレーターに基づいています。' +
        'つまり、すべてのモバイル ウェブ プロジェクトのすべての設定で、' +
        'chrome のみがサポートされています。',
    );
    assert.equal(
      cls.isFullyMasked,
      true,
      'After Web→ウェブ edit, no English residue remains',
    );
  });
});

// ---------------------------------------------------------------------------
// False-negative safety guards
// ---------------------------------------------------------------------------

describe('B1 small-cats — false-negative safety guards', () => {
  it('single common words must NOT be in GLOSSARY', () => {
    // These words appear in the target segments but must NOT be added to
    // GLOSSARY because they would cause false-negatives in other segments
    // (GLOSSARY.md L256-279 registration prohibition).
    const glossary = loadGlossary();
    const forbidden = ['Name', 'OK', 'Web', 'Login', 'Setup'];
    for (const word of forbidden) {
      assert.ok(
        !glossary.has(word),
        `"${word}" must NOT be in GLOSSARY (single common word → false-negative risk)`,
      );
    }
  });

  it('genuinely untranslated English prose is still detected', () => {
    // Ensure the GLOSSARY/INVARIANT additions do not mask real English prose.
    const cls = classifySegment(
      'This is a completely untranslated paragraph about test name and exports.',
    );
    assert.equal(
      cls.isFullyMasked,
      false,
      'Full English prose must not be silently passed',
    );
  });
});
