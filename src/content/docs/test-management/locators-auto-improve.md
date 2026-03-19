---
title: 'ロケーター: 自動改善'
description: ロケータースコアが低下したときに自動的に改善される機能について説明します。
category: テスト管理
order: 9015
updated: '2025-09-19'
sourceUrl: 'https://help.testim.io/docs/locators-auto-improve'
keywords:
  - ロケーター自動改善
  - ロケータースコア
  - セルフヒーリング
  - テスト安定性
  - Revision History
  - Locators パネル
---

時間の経過とともに、アプリが変更されると、要素のロケータースコアが低下する可能性があります。ロケータースコアが 70% を下回ると、Testim はテストの安定性を向上させるために、そのロケーターを自動的に改善しようとします。ロケータースコアが正常に改善されると、Testim は劣化したロケーターを改善されたロケーターに置き換えます。この置き換えは、以下で説明するように、UI 内の 3 つの異なる場所（*Revision History*パネル、*Locators*パネル、*Test Library*画面）に表示されます。

テストライブラリで、自動改善されたテストでフィルタリングできます。また、テストエディターでは、どのステップが自動改善されたかを表示できます。

この機能は、マスターブランチ（マスター読み取り専用ブランチではない）で実行されたテストにのみ自動的に適用されます。ユーザーは、オプションでマスター読み取り専用ブランチに対してこの機能を有効にできます。他のブランチで実行されたテストのロケーターは自動改善されません。

## Revision History パネル

Testim はテストリビジョンを作成し、「Testim auto improve」というラベルを付けます。また、テスト内のどのステップが自動改善されたかを表示することもできます。

![ロケーター自動改善によって作成された Testim auto improve リビジョンを示す画面](/images/test-management/locators-auto-improve/96f61e6-Testim_478a.png)

:fa-arrow-right: **自動改善されたステップを表示するには:**

1. 自動改善されたテストを開きます。
2. **Show improved steps**スイッチを右にトグルします。

![Show improved steps を有効にして自動改善されたステップをハイライト表示している画面](/images/test-management/locators-auto-improve/ac0724b-Testim_585b.png)

自動改善されたステップが強調表示されます。

## Locators パネル

Testim は、自動改善されたロケーターの Locators パネルの上部に「Locator auto improved」メッセージを挿入します。

![Locators パネルで自動改善されたロケーターにメッセージが表示されている画面](/images/test-management/locators-auto-improve/1b05339-Testim_479a.png)

## Test Library 画面

Testim は、1 つ以上の劣化したロケーターが自動改善されたロケーターに置き換えられたテストの名前の後に「Ai」アイコンを挿入します。自動改善アイコンは約 2 週間表示されます。

![Test Library 画面で Ai アイコンが表示されたテスト一覧](/images/test-management/locators-auto-improve/9113b7b-Testim_481a.png)

## Test Library のフィルタリング

**Test Library** のテストリストを、自動改善されたテストでフィルタリングできます。**Test Library** のフィルタリングの詳細については、[テストリスト](/docs/test-list) を参照してください。

:fa-arrow-right: **自動改善されたテストで Test Library をフィルタリングするには:**

1. **Test Library**画面（**Test List** > **Tests**）で、**Advanced filters**アイコンをクリックします。

![自動改善されたロケーターの詳細情報が表示された画面](/images/test-management/locators-auto-improve/1599496-Testim_575a.png)

右側に**Filter Test**ペインが開きます。\
2. **Filter Test**ペインで、下にスクロールして**Auto Improved**トグルを選択します。

![自動改善対象のステップに Self healing アイコンが表示されている画面](/images/test-management/locators-auto-improve/bcd9e8a-Testim_583b_r.png)

3. **Apply**をクリックします。\
   フィルターが適用され、自動改善されたテストのみが表示されます。
4. **Filter Test**ペインの右上にある「**X**」をクリックして閉じます。

:::note
フィルターをリセットせずに**Filter Test**ペインを閉じても、フィルターはリセットされず、フィルター基準を満たすテストのみが表示されます。すべてのテストとフォルダーを再度表示するには、**Filter Test**ペインを再度開いて**Reset filters**をクリックする必要があります。
:::

## マスター読み取り専用ブランチでの自動改善の許可

デフォルトでは、自動改善機能は読み取り専用に設定されていないマスターブランチでのみ実行されます。設定を変更して、マスター読み取り専用ブランチで自動改善機能を実行できるようにすることができます。

:fa-arrow-right: **マスター読み取り専用ブランチで自動改善機能を実行するように設定するには:**

1. マスター読み取り専用ブランチの**Settings** > **Project**ページで、**Pull Requests**をクリックします。

![自動改善されたロケーターと元のロケーターの差分を比較する画面](/images/test-management/locators-auto-improve/5667d75-Testim_577a.png)

**Pull Requests**タブが表示されます。\
2. **Allow Auto-Improve on master**スイッチを右にトグルします。

![ロケーター自動改善の結果がテスト実行結果画面に表示されている様子](/images/test-management/locators-auto-improve/f1985b7-Testim_586a.png)

このマスター読み取り専用ブランチに対して、自動改善機能が有効になりました。
