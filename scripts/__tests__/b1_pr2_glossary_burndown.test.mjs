// scripts/__tests__/b1_pr2_glossary_burndown.test.mjs
/**
 * B1 PR2 — segment-untranslated burn-down regression tests (GLOSSARY).
 *
 * Verifies that planned GLOSSARY additions resolve segment-untranslated
 * baseline entries for 4 medium categories: administration, security,
 * results, running-tests. Tests are written RED-first (fail until
 * GLOSSARY terms are added and text edits are applied).
 *
 * Resolution patterns:
 *   1. GLOSSARY compound term addition -> classifySegment returns isFullyMasked=true
 *   2. SSO UI label GLOSSARY addition -> masks Azure AD / Okta / OneLogin labels
 *   3. Execution screen UI label GLOSSARY -> masks results category labels
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

// -- Planned GLOSSARY additions from B1 PR2 plan --

const PLANNED_TERMS_ADMIN = [
  'Encrypted Credentials',
  'User Access Key',
  'Secrets Manager',
  'Config File',
  'Param File',
  'Test Data',
  'Protect branches from changes',
  'Require approving reviewer',
  'Allow self approval',
  'Pull Request Settings',
  'General Settings',
  'Copilot License Management',
];

const PLANNED_TERMS_SECURITY_AZURE = [
  'Enterprise application',
  'Single sign-on',
  'Basic SAML Configuration',
  'User Attributes & Claims',
  'SAML Signing Certificate',
  'Federation Metadata XML',
  'Upload metadata file',
  'Users and groups',
];

const PLANNED_TERMS_SECURITY_SAML = [
  'Identifier (Entity ID)',
  'Reply URL',
  'Sign on URL',
  'Application ID',
  'Assertion Consumer Service URL',
  'Service Provider Metadata',
  'Service Provider Details',
  'Identity Provider',
];

const PLANNED_TERMS_SECURITY_OKTA = [
  'Create App Integration',
  'Upload Logo',
  'Audience URI',
];

const PLANNED_TERMS_SECURITY_ONELOGIN = [
  'SAML Test Connector',
  'Display Name',
];

const PLANNED_TERMS_RESULTS = [
  'Execution Runs',
  'Execution Details Screen',
  'Execution Test List',
  'Counted Runs',
  'Local Editor Runs',
  'Advanced Filters',
  'Filter by Run Date',
  'Export Execution List',
  'Reset filters',
  'Abort Run',
  'Rerun with same params',
  'Tag failure type',
  'Test History',
];

const PLANNED_TERMS_RUNNING = [
  'Test Plans',
];

const ALL_PLANNED_TERMS = [
  ...PLANNED_TERMS_ADMIN,
  ...PLANNED_TERMS_SECURITY_AZURE,
  ...PLANNED_TERMS_SECURITY_SAML,
  ...PLANNED_TERMS_SECURITY_OKTA,
  ...PLANNED_TERMS_SECURITY_ONELOGIN,
  ...PLANNED_TERMS_RESULTS,
  ...PLANNED_TERMS_RUNNING,
];

// =========================================================================
// GLOSSARY registration tests
// =========================================================================

describe('B1 PR2 — GLOSSARY term registration', () => {
  it('all planned compound terms are registered in GLOSSARY', () => {
    const glossary = loadGlossary();
    // Test Plans is already registered; filter it out from the check
    const newTerms = ALL_PLANNED_TERMS.filter((t) => t !== 'Test Plans');
    const missing = newTerms.filter((term) => !glossary.has(term));
    assert.equal(
      missing.length,
      0,
      `Missing GLOSSARY terms: ${missing.join(', ')}`,
    );
  });

  it('administration terms are registered as compound entries', () => {
    const glossary = loadGlossary();
    const missing = PLANNED_TERMS_ADMIN.filter((t) => !glossary.has(t));
    assert.equal(
      missing.length,
      0,
      `Missing administration GLOSSARY terms: ${missing.join(', ')}`,
    );
  });

  it('Azure AD SSO terms are registered', () => {
    const glossary = loadGlossary();
    const missing = PLANNED_TERMS_SECURITY_AZURE.filter(
      (t) => !glossary.has(t),
    );
    assert.equal(
      missing.length,
      0,
      `Missing Azure AD GLOSSARY terms: ${missing.join(', ')}`,
    );
  });

  it('SAML protocol terms are registered', () => {
    const glossary = loadGlossary();
    const missing = PLANNED_TERMS_SECURITY_SAML.filter(
      (t) => !glossary.has(t),
    );
    assert.equal(
      missing.length,
      0,
      `Missing SAML GLOSSARY terms: ${missing.join(', ')}`,
    );
  });

  it('results UI terms are registered', () => {
    const glossary = loadGlossary();
    const missing = PLANNED_TERMS_RESULTS.filter((t) => !glossary.has(t));
    assert.equal(
      missing.length,
      0,
      `Missing results GLOSSARY terms: ${missing.join(', ')}`,
    );
  });
});

// =========================================================================
// administration segment resolution (GLOSSARY)
// =========================================================================

describe('B1 PR2 — administration/encrypted-credentials (GLOSSARY)', () => {
  it('intro paragraph: "encrypted credentials" feature name is masked', () => {
    const cls = classifySegment(
      'testim の encrypted credentials 機能を使用すると、' +
        '機密性の高いログイン情報を一元的に管理し、' +
        '暗号化して安全に保護できます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"test data" and "config file" references are masked', () => {
    const cls = classifySegment(
      '暗号化された認証情報は test data に含めることができます。' +
        'config file や param file に暗号化された認証情報を追加すると、' +
        'これらのファイルのデータがテスト実行時に適用されます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"user access key" references in CLI section are masked', () => {
    const cls = classifySegment(
      '暗号化された認証情報を含むテストを実行するには、' +
        'cli コマンドに特別な user access key フラグを追加する必要があります。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"user access key" tab instruction is masked', () => {
    const cls = classifySegment('user access key タブをクリックします。');
    assert.equal(cls.isFullyMasked, true);
  });

  it('API runs paragraph with user access key is masked', () => {
    const cls = classifySegment(
      'testim rest api を使用して、暗号化された認証情報を含むテストを' +
        '実行できます。api コールに user access key の値を追加する' +
        '必要があります。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR2 — administration/secrets (GLOSSARY)', () => {
  it('"secrets manager" section reference is masked', () => {
    const cls = classifySegment(
      'secrets manager にアクセスするには、メインメニューから' +
        ' resources を選択します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"secrets manager and hidden parameters" combined label is masked', () => {
    const cls = classifySegment(
      'secrets manager は現在、resources という新しいタブから' +
        'アクセスできるようになりました。ここには secrets manager and' +
        ' hidden parameters セクションがあります。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"resources > secrets manager" navigation is masked', () => {
    const cls = classifySegment(
      'resources > secrets manager に移動します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR2 — administration/copilot-license-management (GLOSSARY)', () => {
  it('"copilot license management" page references are masked', () => {
    const cls = classifySegment(
      'copilot user licenses の下で、assign seats をクリックします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"assign copilot seats to teammates" dialog text is masked', () => {
    const cls = classifySegment(
      'assign copilot seats to teammates が表示されます:',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR2 — administration/project-settings (GLOSSARY)', () => {
  it('"protect branches from changes" toggle name is masked', () => {
    const cls = classifySegment(
      'protect branches from changes トグルをオンにします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"require approving reviewer" toggle name is masked', () => {
    const cls = classifySegment(
      'require approving reviewer トグルをオンにします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"allow self approval" toggle name is masked', () => {
    const cls = classifySegment(
      'allow self approval トグルをオンにします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"general settings" section with "hidden parameters" is masked', () => {
    const cls = classifySegment(
      '現在の非表示パラメーターのリストが hidden parameters セクションに' +
        '表示されます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"pull request settings" section is masked', () => {
    const cls = classifySegment(
      'pull request settings セクションの設定を有効にします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

// =========================================================================
// security segment resolution (GLOSSARY)
// =========================================================================

describe('B1 PR2 — security/azure-ad-sso-integration (GLOSSARY)', () => {
  it('"enterprise application" Azure navigation is masked', () => {
    const cls = classifySegment(
      'enterprise application > new application > ' +
        'create your own applicationに移動します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"upload metadata file" Azure UI action is masked', () => {
    const cls = classifySegment(
      'azureタブに戻り、upload metadata fileをクリックします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"assertion consumer service url" and "reply url" are masked', () => {
    const cls = classifySegment(
      'コピーした assertion consumer service url を' +
        ' reply url フィールドに貼り付けて保存します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"user attributes & claims" section is masked', () => {
    const cls = classifySegment(
      'azureタブで、user attributes & claimsに移動します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"saml signing certificate" and "federation metadata xml" are masked', () => {
    const cls = classifySegment(
      'ページを閉じて、saml signing certificateの下で' +
        'federation metadata xmlをダウンロードします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"users and groups" Azure section is masked', () => {
    const cls = classifySegment(
      'azureタブで、users and groups画面に移動し、' +
        'add users/groupをクリックします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"service provider details" and "service provider metadata" are masked', () => {
    const cls = classifySegment(
      'testim service provider detailsセクションの下で、' +
        'service provider metadataをクリックして xml ファイルを' +
        'ダウンロードします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR2 — security/okta-sso-integration (GLOSSARY)', () => {
  it('"create app integration" button is masked', () => {
    const cls = classifySegment(
      'create app integrationをクリックします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"assertion consumer service url" and "single sign on url" are masked', () => {
    const cls = classifySegment(
      'コピーした assertion consumer service url を' +
        'single sign on urlフィールドに貼り付けます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"audience uri" Okta field is masked', () => {
    const cls = classifySegment(
      'このコードを audience uri (sp entity id) フィールドに' +
        '貼り付けます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"upload logo" button is masked', () => {
    const cls = classifySegment(
      'browseをクリックして testim ロゴを選択し、' +
        'upload logoをクリックしてアップロードします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR2 — security/onelogin-sso-integration (GLOSSARY)', () => {
  it('"saml test connector (advanced)" option is masked', () => {
    // "SAML Test Connector" is the glossary term; "(advanced)" is residue
    // but short enough to pass the 3-word / 15-char threshold.
    const cls = classifySegment(
      "'saml test connector (advanced)' オプションをクリックします。",
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"display name" field reference is masked', () => {
    const cls = classifySegment(
      "configuration画面で、display nameを'testim sso'" +
        'などのわかりやすい名前に編集します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"assertion consumer service url" in OneLogin context is masked', () => {
    const cls = classifySegment(
      'コピーした assertion consumer service url を' +
        'acs (consumer) url validatorフィールドと' +
        'acs consumer urlフィールドに貼り付けます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

// =========================================================================
// results segment resolution (GLOSSARY)
// =========================================================================

describe('B1 PR2 — results/execution-runs-screen (GLOSSARY)', () => {
  it('"execution runs" screen reference is masked', () => {
    const cls = classifySegment(
      'execution runs 画面には、以前の実行に関する情報が表示されます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"filter by run date" operation is masked', () => {
    const cls = classifySegment(
      'filter by run date: 指定された期間中に実行された実行のみを表示します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"export execution list" button is masked', () => {
    const cls = classifySegment(
      '操作パネルの export execution list ボタンをクリックします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"rerun with same params" button is masked', () => {
    const cls = classifySegment(
      'アクションパネルの rerun with same params ボタンをクリックします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"tag failure type" action is masked', () => {
    const cls = classifySegment(
      'テストリスト内の失敗したテストを右クリックし、' +
        'tag failure typeを選択します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR2 — results/tag-remote-runs-failures (GLOSSARY)', () => {
  it('"tag test failure" link is masked', () => {
    const cls = classifySegment(
      'テストが失敗した場合は、tag test failureリンクをクリックします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR2 — results/test-runs (GLOSSARY)', () => {
  it('"counted runs" and "local editor runs" tabs are masked', () => {
    const cls = classifySegment(
      '過去のテスト実行の統計を表示する test runs 画面。' +
        'counted runs と local editor runs のタブがあります。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"advanced filters" button is masked', () => {
    const cls = classifySegment(
      'advanced filtersボタンをクリックして、' +
        'filter test runsペインを開きます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"test history" option is masked', () => {
    const cls = classifySegment(
      'execution runs画面から、実行を選択し、テストを右クリックして、' +
        'test historyオプションを選択します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

// =========================================================================
// running-tests segment resolution (GLOSSARY)
// =========================================================================

describe('B1 PR2 — running-tests/the-command-line-cli (GLOSSARY)', () => {
  it('"test plan" CLI parameter description is masked', () => {
    const cls = classifySegment(
      '--test-plan、実行するテスト計画名を指定します。' +
        '複数の計画を実行できます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

// =========================================================================
// false-negative safety guards
// =========================================================================

describe('B1 PR2 — false-negative safety guards', () => {
  it('common single words remain excluded from GLOSSARY', () => {
    const glossary = loadGlossary();
    // Single common words that appear in target segments but must NOT be
    // added to GLOSSARY because they cause silent false-negatives via
    // RESIDUE_MIN_WORDS bypass.
    const forbidden = [
      'Run',
      'Test',
      'File',
      'Data',
      'Key',
      'Name',
      'User',
      'Group',
      'Upload',
      'Filter',
      'Date',
      'Grid',
      'New',
      'Copy',
      'Save',
      'Tab',
      'Labs',
    ];
    for (const word of forbidden) {
      assert.ok(
        !glossary.has(word),
        `"${word}" must NOT be in GLOSSARY (false-negative risk)`,
      );
    }
  });

  it('genuinely untranslated English prose is still detected', () => {
    const cls = classifySegment(
      'This is a completely untranslated paragraph about Encrypted Credentials.',
    );
    assert.equal(
      cls.isFullyMasked,
      false,
      'Full English prose must not be silently passed',
    );
  });

  it('short English residue with new terms still triggers for all-English segments', () => {
    const cls = classifySegment(
      'Use the Encrypted Credentials to manage sensitive test data securely.',
    );
    assert.equal(
      cls.isFullyMasked,
      false,
      'All-English segment must not pass just because it contains glossary terms',
    );
  });

  it('Azure SSO glossary terms do not mask unrelated English prose', () => {
    const cls = classifySegment(
      'Go to Enterprise application and create a new single sign-on configuration manually.',
    );
    assert.equal(
      cls.isFullyMasked,
      false,
      'All-English segment with Azure terms must still be flagged',
    );
  });
});
