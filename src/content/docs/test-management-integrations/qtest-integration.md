---
title: qTest統合
description: >-
  TestimとqTestを統合してテスト実行結果をqTestプロジェクトに自動的に表示する方法を説明します。統合設定、テストケースの接続、結果の表示方法を網羅しています。
category: 統合
order: 12039
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/qtest-integration'
keywords:
  - qTest
  - Tricentis Test Management
  - テスト管理ツール
  - テストケース管理
  - テスト結果同期
  - テスト実行
  - リモートグリッド
---

qTestプロジェクトでTestimのテスト実行結果を表示します。

## qTestとは？

Tricentisの[qTestテスト管理プラットフォーム](https://www.tricentis.com/products/unified-test-management-qtest/)は、アジャイルチームに「ソフトウェアテストライフサイクル全体を通じてスピード、効率性、コラボレーションを向上させるために設計されたソフトウェアテストツールスイート」を提供します。プラットフォームには、テストケース管理のためのqTest Managerと、テストメトリクスに関するビジネスインテリジェンスのためのqTest Insightsが含まれています。

## qTest統合が必要な理由

qTest統合により、qTestのテストをTestimのテストにリンクできます。Testimでテストを実行すると、テスト結果が自動的にqTestの実行結果に表示され、TestimとqTestで実行されたテストを一元的に表示できます。

## qTest統合の設定

統合を使用する前に、TestimをqTestプロジェクトに接続する必要があります（一度だけ必要なプロセスです）。

**TestimをqTestに接続するには:**

1. **Settings（設定）** > **Integration（統合）** タブに移動します。**General** の下に様々な統合モジュールがあります。
2. qTest統合モジュールで、**Login** をクリックします。

![qTest統合モジュールのログインボタン](/images/test-management-integrations/qtest-integration/4758c86-image.png)

3. qTestを開き、URLからドメインをコピーして（ログイン済みであることを確認してください）、Testimの **URL** フィールドに貼り付けます。URL構造: `https://<プロジェクト名>.qtestnet.com/`。`プロジェクト名` はqTestのURLで確認できます。例: `myProject`。

![qTestのURL入力例](/images/test-management-integrations/qtest-integration/cee1498-image_1.png)

4. Testimの **Username** フィールドに、qTestのユーザー名を入力します。
5. **Admin** ユーザーとして **qTest** にログインし、**Resources**（下矢印）をクリックします。

![qTestのResourcesメニュー](/images/test-management-integrations/qtest-integration/103f85c-image_2.png)

6. **Resources** 画面で、**API & SDK** メニューを開きます。

![qTestのAPI & SDKメニュー](/images/test-management-integrations/qtest-integration/dbe2722-image_3.png)

7. qTestから **Bearer Token** をコピーし、Testimの **ApiKey** フィールドに貼り付けます。
8. Testimで **Connect** をクリックします。
9. Testimで、接続するqTestプロジェクトをリストから選択します。

![qTestプロジェクトの選択画面](/images/test-management-integrations/qtest-integration/761db53-image_4.png)

この時点で、TestimはqTestのプロジェクトに接続されましたが、特定のテストには接続されていません。

:::info
一度に1つのTMS（テスト管理システム）のみ接続できます。Testimシステムが既に別のTMSに接続されている場合は、まずそのTMSを切断してからqTestに接続する必要があります。TMSを切断すると、テスト間の接続が削除されることに注意してください。そのため、以前のTMSに再度接続する場合は、接続も再作成する必要があります。
:::

## TestimのテストをqTestのテストに接続する

統合を設定した後、Testimの特定のテストをqTestのテストに接続します。

**TestimのテストをqTestのテストに接続するには:**

1. Testimで、接続したいテストを開きます。
2. テスト内で、**Setup** ステップ（最初のステップ）の **Properties（プロパティ）** アイコンをクリックします。
3. Setupステップの **Properties（プロパティ）** パネルで、**Test in qTest** の下から、最初のドロップダウンメニューでqTestプロジェクトを選択し、次に2番目のドロップダウンメニューで特定のテストを選択します。

![SetupステップのPropertiesパネルでqTestテストを選択する画面](/images/test-management-integrations/qtest-integration/64df5b6-image_5.png)

4. **Save** をクリックします。

:::info
qTestのテストケースは、最初の接続時に「approved」ステータスである必要があります。
:::

![qTestテストケースの承認ステータス](/images/test-management-integrations/qtest-integration/9721b13-image_6.png)

## テストの実行とqTestでのTestimテスト結果の表示

qTestでテスト実行の結果を表示するには、リモートグリッドのみを使用してTestimで接続されたテストを実行する必要があります。Testimで接続されたテストを実行すると、テスト結果が関連するqTestプロジェクトの **Test Execution** タブに表示されます。Testim発の実行の名前は、以下の命名規則を使用します: `"<Testim.ioブランチ名> - <実行名>"`。

:::info
qTestでテストが変更された場合（新しいバージョン番号）、承認されたバージョンのテストのみがTestimで実行されます。つまり、**Save** のみをクリックした場合、以前の承認済みバージョンが実行され、qTestでは実行レポートから「unexecuted」ステータスとして反映されます。**Save** してから **Approve** をクリックした場合、新しい承認済みバージョンが実行されます。
:::

**qTestでテスト実行を表示するには:**

1. qTest Managerで、**Test Executions** に移動します。
2. ナビゲーションペインで、関連する実行をクリックします。以下の画面が表示されます:

![qTest ManagerのTest Executions画面](/images/test-management-integrations/qtest-integration/dfaf629-image_7.png)

右下のペインに、実行のリストが表示されます。`ID` 列はqTestのテストIDを表します。`Status` 列はTestimからのテスト実行結果を表示します。

3. **ID** をクリックしてテストの詳細を表示します。以下の画面が表示されます:

![qTestでのテスト実行詳細画面](/images/test-management-integrations/qtest-integration/3a5c5d0-Screenshot_at_Jun_01_13-36-04.png)

以下の詳細がTestimからqTestにプッシュされます:

- **Name** - Testimのテスト名
- **Status** - 実行のステータス。表示されるステータスはqTestステータスで、Testimステータスから以下のように変換されます（Testim → qTest）:
  - ABORTED → Unexecuted
  - SKIPPED（Testimでのquarantineステータス） → Blocked
  - TIMEOUT → Failed
  - PASSED → Passed
  - FAILED → Failed

4. **Execution History** 内には、以下の情報を含む **Test Log Details** ペインがあります:
   - Result URL - Testimのテスト結果を開きます
   - Console Logs URL - Testimのコンソールログを開きます
   - Network Logs URL - Testimのネットワークログを開きます

:::info
スイート実行はqTestで1つの実行として表示されます。特定の実行をクリックして、スイート内のすべてのテストの結果を確認してください。
:::

:::warning
qTestの必須カスタムフィールドはサポートされていません。qTestでカスタムフィールドを必須にすると、統合が機能しなくなる可能性があります。
:::
