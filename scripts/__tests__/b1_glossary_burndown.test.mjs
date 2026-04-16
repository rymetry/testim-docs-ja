// scripts/__tests__/b1_glossary_burndown.test.mjs
/**
 * B1 PR1 — segment-untranslated burn-down regression tests.
 *
 * Verifies that planned GLOSSARY additions resolve segment-untranslated
 * baseline entries for 7 small categories. Tests are written RED-first
 * (fail until GLOSSARY terms are added and text edits are applied).
 *
 * Resolution patterns:
 *   1. GLOSSARY compound term addition → classifySegment returns isFullyMasked=true
 *   2. Text edit ("Labs" → "Testim Labs") + GLOSSARY → combined resolution
 *   3. Product name GLOSSARY addition (Sealights, Scheduler)
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

// -- Planned GLOSSARY additions from B1 PR1 plan --

const PLANNED_TERMS_FEATURE = [
  'Custom Action',
  'Chrome DevTools',
  'Go To AUT',
  'Code Debugging',
  'Result Script Execution',
  'Start recording at this position',
  'Test Flow View',
  'Shared Step',
];

const PLANNED_TERMS_UI = [
  'Go to location',
  'Filter entries by log text',
  'Delete all breakpoints',
  'Start A New Test',
  'Your app URL',
  'Login To Start',
  'Create Automated Test',
  'Open in new tab',
  'Local Devices',
  'Device UDID',
];

const PLANNED_TERMS_TUTORIAL = [
  'Space & Beyond',
  'Demo App',
  'Set Custom Text',
  'OS Version',
];

const PLANNED_TERMS_EXTERNAL = ['Sealights', 'Scheduler'];

const PLANNED_TERMS_PRODUCT = ['Testim Labs'];

const PLANNED_TERMS_SPECIAL = ["I'm not a robot"];

const ALL_PLANNED_TERMS = [
  ...PLANNED_TERMS_FEATURE,
  ...PLANNED_TERMS_UI,
  ...PLANNED_TERMS_TUTORIAL,
  ...PLANNED_TERMS_EXTERNAL,
  ...PLANNED_TERMS_PRODUCT,
  ...PLANNED_TERMS_SPECIAL,
];

describe('B1 PR1 — GLOSSARY term registration', () => {
  it('all planned compound terms are registered in GLOSSARY', () => {
    const glossary = loadGlossary();
    const missing = ALL_PLANNED_TERMS.filter((term) => !glossary.has(term));
    assert.equal(
      missing.length,
      0,
      `Missing GLOSSARY terms: ${missing.join(', ')}`,
    );
  });

  it('Testim Labs is registered as compound term (not just Testim + Labs)', () => {
    // "Testim Labs" must be a compound glossary entry so that both words
    // are consumed in a single match. Without it, "Testim" masks only
    // the first word and "Labs" remains as residue in segments with
    // multiple occurrences (exceeding RESIDUE_MIN_WORDS=3).
    const glossary = loadGlossary();
    assert.ok(
      glossary.has('Testim Labs'),
      'Testim Labs must be a compound glossary term to resolve testim-labs category',
    );
  });
});

describe('B1 PR1 — debugging-tests segment resolution (GLOSSARY only)', () => {
  it('debug-helper-panels: "go to location" button label is masked', () => {
    const cls = classifySegment(
      'ブレークポイントの右側にあるgo to locationボタンをクリックします。' +
        'test editorでブレークポイントの場所が強調表示されます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('debug-helper-panels: "filter entries by log text" field is masked', () => {
    const cls = classifySegment(
      'filter entries by log textフィールドにテキスト（部分テキストも可）を入力して、' +
        'フィルター文字列に一致するコンソールエントリのみを表示します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('debug-helper-panels: "delete all breakpoints" button is masked', () => {
    const cls = classifySegment(
      '省略記号が表示されるまでlocationセクションにカーソルを合わせ、' +
        'delete all breakpointsボタンをクリックします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('js-code-debugging: "custom action" step type is masked', () => {
    const cls = classifySegment(
      '以下の手順は、既存のテストで以前に作成された custom action ステップ内の ' +
        'js コードをデバッグする方法を示していますが、サポートされるすべてのステップに' +
        '同じことが当てはまります。→ js コードをデバッグするには:',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('js-code-debugging: "chrome devtools" tool name is masked', () => {
    const cls = classifySegment(
      'この時点で、chrome devtools のデバッグ機能を使用して js コードをデバッグできます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('recording-additional-steps: "start recording at this position" is masked', () => {
    const cls = classifySegment(
      '追加の記録ステップを追加する 2 つのステップ間の矢印にカーソルを合わせ、' +
        'start recording at this positionボタンをクリックします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR1 — device-management segment resolution (GLOSSARY only)', () => {
  it('"local devices" section label is masked', () => {
    const cls = classifySegment(
      'local devices セクションでは、tricentis mobile agent（tma）に接続されている' +
        'すべての物理および仮想モバイルデバイスを表示できます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"device udid" field name is masked', () => {
    const cls = classifySegment(
      'device udid は簡単にコピーでき、例えば cli を通じて特定のデバイスで' +
        'テストを実行するために使用できます。デバイス udid をコピーするには:',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR1 — getting-started segment resolution (GLOSSARY only)', () => {
  it('setting-up-your-account: "i\'m not a robot" is masked', () => {
    const cls = classifySegment("i'm not a robotチャレンジを選択します。");
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR1 — overview/changelog segment resolution (GLOSSARY only)', () => {
  it('"sealights" and "scheduler" product names are masked', () => {
    const cls = classifySegment(
      'sealights 統合に、cli と scheduler の両方でカスタムチームステージ名の' +
        'サポートを追加しました。コマンドで --sealights-test-stage ' +
        '[sealights-test-stage-name] を使用してカスタムテストステージ名を指定できます。' +
        'または、scheduler 設定画面でカスタムテストステージ名を入力するだけです。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR1 — testim-extension segment resolution (GLOSSARY only)', () => {
  it('"login to start" button is masked', () => {
    const cls = classifySegment(
      'testim にログインしていない場合は、login to startをクリックします。' +
        'すでにログインしている場合は、ステップ 5 に進みます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"create automated test" button is masked', () => {
    const cls = classifySegment('create automated testをクリックします。');
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR1 — testim-labs segment resolution (text edit + GLOSSARY)', () => {
  // These tests use POST-EDIT text: standalone "Labs" → "Testim Labs".
  // Requires "Testim Labs" as compound glossary term.

  it('testim-labs.md: segment with multiple "Testim Labs" is fully masked', () => {
    // Original has standalone "labs" (5+ occurrences) → fails RESIDUE_MIN_WORDS.
    // After text edit + GLOSSARY compound "Testim Labs": all consumed.
    const cls = classifySegment(
      'testim labs が有効になったら、settings > testim labs に移動して、' +
        '有効にして体験したい機能を選択できます。 定期的に testim labs に新機能が' +
        '追加されます。追加時には通知が届きます。 testim labs 機能を無効にすると、' +
        'その機能は testim automate 内のオプションから非表示になります。' +
        'testim labs に関する質問やフィードバックがある場合は、' +
        'testim support までお問い合わせください。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('test-flow-view.md: "test flow view" compound term is masked', () => {
    const cls = classifySegment(
      'test flow viewは、テストのグラフィカルなフローベースのビジュアライゼーションを' +
        '提供します。 test flow view を使用すると、次のことができます:',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('link-directly-to-a-shared-step.md: "shared step" and "open in new tab" are masked', () => {
    const cls = classifySegment(
      'または、テストを右クリックして open in new tab を選択することもできます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('testim-labs callout: "Testim Labs" in Labs intro callout is masked', () => {
    // Common callout text shared by test-flow-view and link-directly-to-a-shared-step.
    // After text edit: "labs" → "testim labs" throughout.
    const cls = classifySegment(
      'testim labs に参加している場合は、settings > testim labs でこの機能が' +
        '有効になっていることを確認してください。testim labs と参加方法の詳細については、' +
        'testim labs についてを参照してください。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR1 — false-negative safety guards', () => {
  it('common single words remain excluded from GLOSSARY', () => {
    // Pinned by PR#267 round 2 review. Single common words cause silent
    // false-negatives via RESIDUE_MIN_WORDS bypass.
    const glossary = loadGlossary();
    const forbidden = ['Enter', 'Tab', 'Approve', 'Page Up', 'Page Down', 'Labs'];
    for (const word of forbidden) {
      assert.ok(
        !glossary.has(word),
        `"${word}" must NOT be in GLOSSARY (false-negative risk)`,
      );
    }
  });

  it('genuinely untranslated English prose is still detected', () => {
    // Ensure the GLOSSARY additions do not accidentally mask real English prose.
    const cls = classifySegment(
      'This is a completely untranslated paragraph about Custom Actions.',
    );
    assert.equal(
      cls.isFullyMasked,
      false,
      'Full English prose must not be silently passed',
    );
  });

  it('short English residue with new terms still triggers for all-English segments', () => {
    // 3+ English words after masking should still fail.
    const cls = classifySegment('Use the Custom Action to create test steps.');
    assert.equal(
      cls.isFullyMasked,
      false,
      'All-English segment must not pass just because it contains a glossary term',
    );
  });
});
