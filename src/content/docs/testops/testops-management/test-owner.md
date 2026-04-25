---
title: テストオーナー
description: テストにオーナーを割り当てて、作業負荷をスケーリングしながら冗長性を最小化します
category: TestOps
order: 15004
updated: '2025-11-02'
sourceUrl: 'https://docs.tricentis.com/testim/content/testops/testops-management/test-owner.htm'
keywords:
  - テストオーナー
  - TestOps 管理
  - 所有権管理
  - 作業負荷分散
  - テスト責任者
  - フィルタリング
  - テストライブラリ
  - スイート実行
  - テスト割り当て
  - チーム管理
---

テストオーナー機能により、各テストの「オーナー」を指定できます。これは、テストの責任者を識別したり、テストオーナーでテストライブラリやスイート実行結果をフィルタリングしたりするのに役立ちます。デフォルトでは、最初のテストオーナーはテストの作成者です。テストを新しいオーナーに再割り当てできます。

:::note{title="これはPRO機能です"}
この機能は、[Professional plan](https://www.testim.io/pricing/) のプロジェクトでのみ利用できます。
:::

:::note
テストオーナーを再割り当てすると、テストリビジョンが自動的に作成されます。詳細については、[リビジョン](/docs/test-management/revisions)をご覧ください。
:::

:::note
テストは異なるブランチで異なるオーナーを持つことができます。例: Sample_Test はマスターブランチでオーナー A を持ち、別のブランチでオーナー B を持つことができます。ブランチをマージする場合、新しくマージされたテストに割り当てるオーナーを決定する必要があります。詳細については、[バージョン管理（ブランチ）](/docs/testops/testops-version-control/version-control-branches)をご覧ください。
:::

## テストオーナーの変更

エディターで開いているテストを新しいテストオーナーに再割り当てでき、テストライブラリでは個別のテストまたは複数のテストを新しいオーナーに再割り当てできます。

### エディターでテストオーナーを変更

**エディターでテストオーナーを再割り当てするには:**

1. エディターでテストを開きます。詳細については、[テストを開く](/docs/test-management/test-list#テストを開く)をご覧ください。
2. **ステッププロパティを表示**アイコンをクリックして、**テスト構成プロパティ**パネルを開きます。

![ステッププロパティを表示アイコン](/images/testops-management/test-owner/7b99d23-Testim_196a.png)

:::note
または、テストの最初のステップにカーソルを合わせて、**プロパティを表示**アイコンをクリックします。
:::

3. **Test owner** フィールドをクリックします。

![Test owner フィールド](/images/testops-management/test-owner/c7347ec-Testim_197a_r.png)

**Replace Test Owner** ウィンドウが表示されます。

![Replace Test Owner ウィンドウ](/images/testops-management/test-owner/a0e5978-Testim_194_r.png)

4. 新しいオーナーを選択し、**Confirm** をクリックします。\
ウィンドウが閉じ、新しいオーナーがリストに表示されます。
5. **ステッププロパティを表示**アイコンをクリックして、**テスト構成プロパティ**パネルを閉じます。

### テストライブラリでテストオーナーを変更

**テストライブラリでテストオーナーを再割り当てするには:**

1. **テストライブラリ**（**Test List** > **Tests**）に移動します。

![テストライブラリ画面](/images/testops-management/test-owner/41cae47-Testim_192.png)

2. オーナーを変更したいテスト（または複数のテスト）を選択します。\
追加のオプションが**トップメニュー**に表示されます。

![トップメニューオプション](/images/testops-management/test-owner/9237d3f-Testim_193a.png)

3. **Replace owner** アイコンをクリックします（またはテストを右クリックして、表示されるリストから **Replace owner** を選択します）。

![Replace owner メニュー](/images/testops-management/test-owner/b3ad2fa-Testim_193b.png)

**Replace Test Owner** ウィンドウが表示されます。

![Replace Test Owner ウィンドウ](/images/testops-management/test-owner/3419b72-Testim_194_r.png)

4. 新しいオーナーを選択し、**Confirm** をクリックします。\
ウィンドウが閉じ、新しいオーナーがリストに表示されます。

![オーナー変更プロセス](/images/testops-management/test-owner/617e420-Feb-08-2021_08-56-14.gif)

## テストオーナーでテストライブラリとスイート実行をフィルタリング

テストライブラリのテストリストを 1 つ以上のテストオーナーでフィルタリングでき、スイート実行のテストリストを単一のテストオーナーでフィルタリングできます。

### テストライブラリのフィルタリング

**テストオーナーでテストライブラリをフィルタリングするには:**

1. **テストライブラリ**（**Test List** > **Tests**）に移動します。
2. **Advanced filters** アイコンをクリックします。

![Advanced filters アイコン](/images/testops-management/test-owner/2ccd6df-Testim_192a.png)

**Filter Test** ペインが右側に開きます。

![Filter Test ペイン](/images/testops-management/test-owner/ebac246-Testim_195_r.png)

3. **Filter Test** ペインの **Test Owner** セクションで、フィルタリングしたいオーナー（複数可）を選択します。

:::note
**Filter Test** ペインの **Test Owner** セクション内で、**検索**（虫眼鏡）アイコンをクリックし、開く検索ボックスに検索条件を入力することで、オーナーを検索することもできます。
:::

4. **Apply** をクリックします。\
フィルターが適用され、オーナー条件を満たすテストのみが表示されます。

:::note
**Filter Test** ペインの下部にある **Reset filters** をクリックしてから **Apply** をクリックすることで、フィルターを削除できます。
:::

5. **Filter Test** ペインの右上にある「**X**」をクリックして閉じます。

:::note
フィルターをリセットせずに **Filter Test** ペインを閉じてもフィルターはリセットされず、フィルター条件を満たすテストのみが表示されます。すべてのテストとフォルダーを再度表示するには、**Filter Test** ペインを再度開いて **Reset filters** をクリックしてから **Apply** をクリックする必要があります。
:::

### スイート実行のフィルタリング

**テストオーナーでスイート実行のテストリストをフィルタリングするには:**

1. **Suite Runs** リスト（**Runs** > **Suite Runs**）に移動します。

![Suite Runs リスト](/images/testops-management/test-owner/911a46f-Testim_198.png)

2. フィルタリングしたい **Test Suite** をクリックします。\
そのスイートのテストリストを含む新しい画面が表示されます。
3. **Advanced filters** アイコンをクリックします。

![Advanced filters アイコン](/images/testops-management/test-owner/a1519d8-Testim_199a.png)

高度なフィルターオプションが表示されます。\
**All owners** の横にあるドロップダウン矢印をクリックし、フィルタリングしたいテストオーナーを選択します。

![テストオーナー選択](/images/testops-management/test-owner/257c1eb-Testim_200a.png)

フィルタリングされたリストが表示されます。

![フィルター結果](/images/testops-management/test-owner/09fd471-Feb-09-2021_05-50-07.gif)
