---
title: 'ロケーター: 自動改善'
description: 'ロケータースコアが低下したときに自動的に改善される機能について説明します。'
category: 'テスト管理'
order: 15
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/locators-auto-improve'
keywords:
  - ロケーター自動改善
  - ロケータースコア
  - セルフヒーリング
  - テスト安定性
  - Revision History
  - Locatorsパネル
---

時間の経過とともに、アプリが変更されると、要素のロケータースコアが低下する可能性があります。ロケータースコアが70%を下回ると、Testimはテストの安定性を向上させるために、そのロケーターを自動的に改善しようとします。ロケータースコアが正常に改善されると、Testimは劣化したロケーターを改善されたロケーターに置き換えます。この置き換えは、以下で説明するように、UI内の3つの異なる場所（*Revision History*パネル、*Locators*パネル、*Test Library*画面）に表示されます。

テストライブラリで、自動改善されたテストでフィルタリングできます。また、テストエディターでは、どのステップが自動改善されたかを表示できます。

この機能は、マスターブランチ（マスター読み取り専用ブランチではない）で実行されたテストにのみ自動的に適用されます。ユーザーは、オプションでマスター読み取り専用ブランチに対してこの機能を有効にできます。他のブランチで実行されたテストのロケーターは自動改善されません。

## Revision Historyパネル

Testimはテストリビジョンを作成し、「Testim auto improve」というラベルを付けます。また、テスト内のどのステップが自動改善されたかを表示することもできます。

![2454](/images/test-management/locators-auto-improve/96f61e6-Testim_478a.png)

:fa-arrow-right: **自動改善されたステップを表示するには:**

1. 自動改善されたテストを開きます。
2. **Show improved steps**スイッチを右にトグルします。

![3807](/images/test-management/locators-auto-improve/ac0724b-Testim_585b.png)

自動改善されたステップが強調表示されます。

## Locatorsパネル

Testimは、自動改善されたロケーターのLocatorsパネルの上部に「Locator auto improved」メッセージを挿入します。

![2444](/images/test-management/locators-auto-improve/1b05339-Testim_479a.png)

## Test Library画面

Testimは、1つ以上の劣化したロケーターが自動改善されたロケーターに置き換えられたテストの名前の後に「Ai」アイコンを挿入します。自動改善アイコンは約2週間表示されます。

![2452](/images/test-management/locators-auto-improve/9113b7b-Testim_481a.png)

## Test Libraryのフィルタリング

**Test Library**のテストリストを、自動改善されたテストでフィルタリングできます。**Test Library**のフィルタリングの詳細については、[Test Libraryのフィルタリング](doc:test-list#section-filtering-the-test-library)を参照してください。

:fa-arrow-right: **自動改善されたテストでTest Libraryをフィルタリングするには:**

1. **Test Library**画面（**Test List** > **Tests**）で、**Advanced filters**アイコンをクリックします。

![3307](/images/test-management/locators-auto-improve/1599496-Testim_575a.png)

右側に**Filter Test**ペインが開きます。\
2. **Filter Test**ペインで、下にスクロールして**Auto Improved**トグルを選択します。

![250](/images/test-management/locators-auto-improve/bcd9e8a-Testim_583b_r.png)

3. **Apply**をクリックします。\
   フィルターが適用され、自動改善されたテストのみが表示されます。
4. **Filter Test**ペインの右上にある「**X**」をクリックして閉じます。

> 📘 フィルターをリセットせずに**Filter Test**ペインを閉じても、フィルターはリセットされず、フィルター基準を満たすテストのみが表示されます。すべてのテストとフォルダーを再度表示するには、**Filter Test**ペインを再度開いて**Reset filters**をクリックする必要があります。

## マスター読み取り専用ブランチでの自動改善の許可

デフォルトでは、自動改善機能は読み取り専用に設定されていないマスターブランチでのみ実行されます。設定を変更して、マスター読み取り専用ブランチで自動改善機能を実行できるようにすることができます。

:fa-arrow-right: **マスター読み取り専用ブランチで自動改善機能を実行するように設定するには:**

1. マスター読み取り専用ブランチの**Settings** > **Project**ページで、**Pull Requests**をクリックします。

![3832](/images/test-management/locators-auto-improve/5667d75-Testim_577a.png)

**Pull Requests**タブが表示されます。\
2. **Allow Auto-Improve on master**スイッチを右にトグルします。

![3435](/images/test-management/locators-auto-improve/f1985b7-Testim_586a.png)

このマスター読み取り専用ブランチに対して、自動改善機能が有効になりました。
