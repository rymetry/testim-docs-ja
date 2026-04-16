// scripts/__tests__/b1_pr2_segment_untranslated_medium_cats.test.mjs
/**
 * B1 PR2 — segment-untranslated burn-down for 4 medium categories.
 *
 * Verifies that planned GLOSSARY / INVARIANT / content-edit changes
 * resolve segment-untranslated baseline entries across administration,
 * security, results, and running-tests categories.
 *
 * Resolution patterns:
 *   A. GLOSSARY compound term addition -> classifySegment masks UI labels
 *   B. Content edit (JA text) -> residue falls below RESIDUE_MIN_WORDS=3
 *   C. GLOSSARY + content edit combined -> resolves dense-English segments
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

// =========================================================================
// Additional GLOSSARY terms needed for combined resolution
// (beyond those in b1_pr2_glossary_burndown.test.mjs)
// =========================================================================

describe('B1 PR2 medium-cats — additional GLOSSARY registration', () => {
  it('SSO-specific UI terms are registered', () => {
    const glossary = loadGlossary();
    const required = [
      'Force users to login via IDP',
      'Enable SSO',
      'Service Provider Entity ID',
    ];
    const missing = required.filter((t) => !glossary.has(t));
    assert.equal(
      missing.length,
      0,
      `Missing SSO GLOSSARY terms: ${missing.join(', ')}`,
    );
  });

  it('administration UI action terms are registered', () => {
    const glossary = loadGlossary();
    const required = [
      'Assign Seats',
      'Add Project Owner',
      'Remove Project Owner',
      'Delete User',
      'Add Company Owner',
      'Remove Company Owner',
    ];
    const missing = required.filter((t) => !glossary.has(t));
    assert.equal(
      missing.length,
      0,
      `Missing admin action GLOSSARY terms: ${missing.join(', ')}`,
    );
  });

  it('results screen action terms are registered', () => {
    const glossary = loadGlossary();
    const required = [
      'Tag Test Failure',
      'Create Issue',
      'Link to Issue',
      'Show Section',
      'CSV Download',
    ];
    const missing = required.filter((t) => !glossary.has(t));
    assert.equal(
      missing.length,
      0,
      `Missing results action GLOSSARY terms: ${missing.join(', ')}`,
    );
  });
});

// =========================================================================
// administration — content edit + GLOSSARY resolution
// =========================================================================

describe('B1 PR2 medium-cats — administration/encrypted-credentials edits', () => {
  it('credentials syntax description is masked after edit', () => {
    // Post-edit: technical description with TST_CREDS syntax
    // "username" and "password" are inline-code in source, stripped by normalizeSegmentText
    const cls = classifySegment(
      "username を指定すると暗号化されたユーザー名を使用し、" +
        "password を指定すると暗号化されたパスワードを使用します。",
    );
    assert.equal(
      cls.isFullyMasked,
      true,
      'After edit, "username"/"password" are short residue below threshold',
    );
  });

  it('CLI command with user-access-key flag is masked', () => {
    // CLI command lines contain testim CLI flags (masked by cli-flag INVARIANT)
    // and glossary terms. Post-masking residue should be below threshold.
    const cls = classifySegment(
      'npm i -g @testim/testim-cli && testim --token <token id> ' +
        '--project <project id> --grid "testim-grid" --label "label #2" ' +
        '--user-access-key <key id>',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('summary paragraph with editor/cli/api references is masked', () => {
    const cls = classifySegment(
      '権限のあるユーザーは、editor、cli、rest api を通じて ' +
        'test data の暗号化された認証情報を含むテストを実行できます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR2 medium-cats — administration/secrets edits', () => {
  it('"go to secrets manager" navigation instruction is masked', () => {
    const cls = classifySegment(
      'test editorからシークレットマネージャーにアクセスすることも' +
        'できます。シークレットを含むテストを選択し、properties を' +
        '選択してから、go to secrets manager を選択します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('set text step with secrets is masked', () => {
    const cls = classifySegment(
      'テストを記録する際、aut のフィールドにテキストを入力すると、' +
        'set text ステップが作成されます。set text ステップの' +
        'プロパティで、以前に作成したシークレットの 1 つを' +
        '割り当てることができます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR2 medium-cats — administration/project-settings edits', () => {
  it('"project name" edit instruction is masked', () => {
    const cls = classifySegment(
      'project name セクションで、edit ボタンをクリックします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"default test configuration" edit instruction is masked', () => {
    const cls = classifySegment(
      'default test configuration セクションで、edit ボタンを' +
        'クリックします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"allow auto-improve on master" toggle in branch protection is masked', () => {
    // Post-edit: contains auto-improve (compound) + master branch references
    const cls = classifySegment(
      'master ブランチを選択した場合は、allow auto-improve on master ' +
        'トグルをオンにして、auto-improve 機能がテストの安定性を高める' +
        'ためにテストロケータを自動的に改善できるようにします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('reviewer selection instruction with "all branches"/"all users" is masked', () => {
    // Post-edit: "branches", "all branches", "all users" are short residue
    const cls = classifySegment(
      'branches の下で、この設定を適用したいブランチを選択します。' +
        'all branches を選択すると、すべてのブランチに設定を適用できます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR2 medium-cats — administration/project-user-management edits', () => {
  it('"delete user" button instruction is masked', () => {
    const cls = classifySegment(
      'delete user ボタンをクリックします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"add project owner" context menu is masked', () => {
    const cls = classifySegment(
      'プロジェクトオーナーとして追加したいチームメイトを右クリックし、' +
        'add project owner を選択します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"remove project owner" action is masked', () => {
    const cls = classifySegment(
      'プロジェクトオーナーから削除したいチームメイトにカーソルを合わせ、' +
        'remove project owner をクリックします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"pending" status label is masked after edit', () => {
    // "pending" is a single English word — too short for RESIDUE_MIN_WORDS
    const cls = classifySegment(
      '入力したアドレスにプロジェクトへの招待が送信されます。' +
        'まだ招待を受け入れていないユーザーは pending と表示されます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

// =========================================================================
// security — content edit + GLOSSARY resolution
// =========================================================================

describe('B1 PR2 medium-cats — security/azure-ad-sso edits', () => {
  it('Azure AD intro paragraph is masked', () => {
    const cls = classifySegment(
      'azure active directory は microsoft のクラウドベースの ' +
        'id およびアクセス管理サービスです。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"source attribute: user.mail" field mapping is masked', () => {
    // source attribute field values contain dots (user.mail, user.userprincipalname)
    // These are technical identifiers masked by short residue after glossary masking
    const cls = classifySegment(
      'source attribute: user.mail または user.userprincipalname。' +
        '組織のユーザーの 1 人を azure ad に入力し、' +
        'どのフィールドでメールアドレスが表示されるかを確認できます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"enable sso" and "force users to login via idp" are masked', () => {
    const cls = classifySegment(
      'すべてのユーザーが azure を通じてのみログインできるようにするには、' +
        'enable ssoをオンにし、force users to login via idp' +
        'チェックボックスを選択します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"identity provider (idp) metadata" upload instruction is masked', () => {
    const cls = classifySegment(
      'testimタブで、identity provider (idp) metadataの下の' +
        'upload fileをクリックし、federation metadata xml ' +
        'ファイルを選択します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR2 medium-cats — security/okta-sso edits', () => {
  it('"application username" and "user.email" field mapping is masked', () => {
    const cls = classifySegment(
      'application usernameフィールドでemailを選択します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"service provider entity id" code copy instruction is masked', () => {
    const cls = classifySegment(
      'testim automateタブに戻り、' +
        'service provider entity id/audienceコードをコピーします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"force users to login via idp" in Okta context is masked', () => {
    const cls = classifySegment(
      'すべてのユーザーが okta を通じてのみログインできるようにするには、' +
        'force users to login via idp' +
        'チェックボックスを選択します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR2 medium-cats — security/onelogin-sso edits', () => {
  it('"include in saml assertion" checkbox is masked', () => {
    const cls = classifySegment(
      'include in saml assertionチェックボックスを選択します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('field mapping labels (firstname/lastname/email) are masked', () => {
    // Post-edit: these are short technical labels — below RESIDUE_MIN_WORDS
    const cls = classifySegment(
      'firstname（first nameにマッピング）',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"force users to login via idp" in OneLogin context is masked', () => {
    const cls = classifySegment(
      'すべてのユーザーが onelogin を通じてのみログインできるようにするには、' +
        'force users to login via idpチェックボックスを選択します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR2 medium-cats — security/testim-grid-ips edits', () => {
  it('"lambdatest grid" IP reference is masked', () => {
    const cls = classifySegment(
      'lambdatest grid 用にこれらの ip をホワイトリストに登録してください:',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

// =========================================================================
// results — content edit + GLOSSARY resolution
// =========================================================================

describe('B1 PR2 medium-cats — results/execution-runs-screen edits', () => {
  it('execution overview paragraph is masked', () => {
    const cls = classifySegment(
      '実行（execution）は、単一の実行として実行される 1 つまたは' +
        '複数のテストのセットです。execution runs 画面には、' +
        '以前の実行に関する情報が表示されます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"show section" button with "execution runs" title is masked', () => {
    const cls = classifySegment(
      'グラフを再度表示するには、execution runs タイトルの下にある' +
        'show sectionボタンをクリックします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"execution test list" callout with timeout info is masked', () => {
    // Contains "90min" (numeric-unit INVARIANT) and "running"/"timeout" status labels
    const cls = classifySegment(
      '実行の全体時間が 90min を超える場合、そのステータスは' +
        '「running」から「timeout」に変わります。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"abort run" operation is masked', () => {
    const cls = classifySegment(
      'abort run ボタンをクリックして実行を中断します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"invalid test data" failure tag is masked', () => {
    // After GLOSSARY: "Test Data" masked, "invalid" is short residue (1 word)
    const cls = classifySegment(
      'invalid test data（無効なテストデータ）',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"device info (mobile)" column description is masked', () => {
    const cls = classifySegment(
      'device info (mobile): テストの記録に使用された物理または' +
        '仮想デバイスのデバイス名とオペレーティングシステムを含む',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR2 medium-cats — results/tag-remote-runs-failures edits', () => {
  it('"tag test failure" dialog with "create issue" is masked', () => {
    const cls = classifySegment(
      'tag test failureダイアログで、create issueをクリックして、' +
        'バグトラッキングシステムに新しい課題を作成します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"link to issue" field reference is masked', () => {
    const cls = classifySegment(
      'link to issueフィールドには、新しく作成された課題または' +
        '既存の課題の url が含まれます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"bug in app" failure tag is masked', () => {
    const cls = classifySegment(
      'bug in app（アプリケーションのバグ）',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR2 medium-cats — results/test-runs edits', () => {
  it('"csv download" button reference is masked', () => {
    const cls = classifySegment(
      'csv をダウンロードするには、csv downloadボタンを' +
        'クリックして、保存先を選択します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"tag test failure" button in test runs is masked', () => {
    const cls = classifySegment(
      'tag test failureボタンをクリックして、すべての失敗した実行に' +
        '失敗タイプをタグ付けします。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"local editor runs" tab description is masked', () => {
    const cls = classifySegment(
      'local editor runs - このタブには、エディターから直接実行された' +
        '過去の実行の統計が表示されます。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

// =========================================================================
// running-tests — content edit + GLOSSARY resolution
// =========================================================================

describe('B1 PR2 medium-cats — running-tests/scheduler edits', () => {
  it('Slack integration instruction is masked', () => {
    // Contains "slack" (3 occurrences) — below word threshold after masking
    const cls = classifySegment(
      'slack - slack 経由で通知を送信するには、「slack」' +
        'チェックボックスを選択します。slack に通知を送信するには、' +
        '初期統合を設定する必要があります。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR2 medium-cats — running-tests/running-tests-overview edits', () => {
  it('test list selection with Ctrl/Command instruction is masked', () => {
    const cls = classifySegment(
      'テストリスト画面で、実行するテストを選択します。' +
        '複数のテストを選択するには、テストを左クリックしながら ' +
        'ctrl (windows) または command (mac) キーを押します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"device udid" CLI parameter is masked', () => {
    const cls = classifySegment(
      '--device-udid: ローカル device udid を入力します。' +
        'これは、コンピューターに接続されている物理デバイスである' +
        '可能性があります。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR2 medium-cats — running-tests/base-url edits', () => {
  it('base URL override explanation is masked', () => {
    const cls = classifySegment(
      '開発/テスト環境でテストを記録してから、他の環境でもテストを' +
        '実行したいと考えます。これは、テスト実行中にベース url と' +
        'すべての相対 url が変更されるべきことを意味します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR2 medium-cats — running-tests/mock-network-responses edits', () => {
  it('HAR file mock description is masked', () => {
    const cls = classifySegment(
      'har ファイルを使用したネットワークトラフィックのモック - ' +
        'モックネットワークレスポンスは har ファイルに基づくことが' +
        'できます。har ファイルは、web ブラウザとサイトの間の' +
        'やり取りをログに記録するための json 形式のアーカイブ' +
        'ファイルフォーマットです。',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

describe('B1 PR2 medium-cats — running-tests/the-command-line-cli edits', () => {
  it('Sealights integration CLI flag description is masked', () => {
    // Contains --sealights-build-session-id (cli-flag INVARIANT)
    // and Sealights (GLOSSARY)
    const cls = classifySegment(
      'sealights 統合には、cli で --sealights-build-session-id ' +
        'フラグを使用してビルドセッション id を指定します。',
    );
    assert.equal(cls.isFullyMasked, true);
  });

  it('"intersect-with" flag description is masked', () => {
    // --intersect-with-label and --intersect-with-suite are cli-flags
    const cls = classifySegment(
      'testim --token "token" --project "project" --suite "suitename" ' +
        '--grid "testim-grid" --intersect-with-label "test"',
    );
    assert.equal(cls.isFullyMasked, true);
  });
});

// =========================================================================
// false-negative safety guards (content edit context)
// =========================================================================

describe('B1 PR2 medium-cats — false-negative safety guards', () => {
  it('single common words must NOT be in GLOSSARY', () => {
    const glossary = loadGlossary();
    // Words appearing in target segments that must NOT be individually registered
    const forbidden = [
      'Name',
      'Pending',
      'Email',
      'Browse',
      'Assigned',
      'Properties',
      'Resources',
      'Configuration',
      'Integration',
    ];
    for (const word of forbidden) {
      assert.ok(
        !glossary.has(word),
        `"${word}" must NOT be in GLOSSARY (single common word -> false-negative risk)`,
      );
    }
  });

  it('genuinely untranslated English prose is still detected', () => {
    const cls = classifySegment(
      'This is a completely untranslated paragraph about secrets manager and user access key.',
    );
    assert.equal(
      cls.isFullyMasked,
      false,
      'Full English prose must not be silently passed',
    );
  });

  it('mixed-language segment with excessive English is still caught', () => {
    // Even with GLOSSARY terms, if the surrounding text is English, it should fail
    const cls = classifySegment(
      'Click on the Encrypted Credentials tab and then select User Access Key to proceed with the configuration.',
    );
    assert.equal(
      cls.isFullyMasked,
      false,
      'Mostly-English segment should still be detected',
    );
  });
});
