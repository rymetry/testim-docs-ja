---
title: qTest 統合
description: >-
  Testim と qTest を統合してテスト実行結果を qTest プロジェクトに自動的に表示する方法を説明します。統合設定、テストケースの接続、結果の表示方法を網羅しています。
category: 統合
order: 12039
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/test-management-integrations/qtest-integration.htm'
keywords:
  - qTest
  - Tricentis Test Management
  - テスト管理ツール
  - テストケース管理
  - テスト結果同期
  - テスト実行
  - リモートグリッド
---

## qTest とは？

Tricentis の[qTest テスト管理プラットフォーム](https://www.tricentis.com/products/unified-test-management-qtest/)は、アジャイルチームに「ソフトウェアテストライフサイクル全体を通じてスピード、効率性、コラボレーションを向上させるために設計されたソフトウェアテストツールスイート」を提供します。プラットフォームには、テストケース管理のための qTest Manager と、テストメトリクスに関するビジネスインテリジェンスのための qTest Insights が含まれています。

## qTest 統合が必要な理由

qTest 統合により、qTest のテストを Testim のテストにリンクできます。Testim でテストを実行すると、テスト結果が自動的に qTest の実行結果に表示され、Testim と qTest で実行されたテストを一元的に表示できます。

## qTest 統合の設定

統合を使用する前に、Testim を qTest プロジェクトに接続する必要があります（一度だけ必要なプロセスです）。→ **Testim を qTest に接続するには:**

1. **Settings（設定）** > **Integration（統合）** タブに移動します。**General** の下に様々な統合モジュールがあります。
2. qTest 統合モジュールで、**Login** をクリックします。

![qTest 統合モジュールのログインボタン](/images/test-management-integrations/qtest-integration/dbe2722-image_3.png)

3. qTest を開き、URL からドメインをコピーして（ログイン済みであることを確認してください）、Testim の **URL** フィールドに貼り付けます。URL 構造は `https://<projectName>.qtestnet.com/` の形式です。`projectName` の部分をプロジェクト名に置き換えてください。例: 下のアカウントの `projectName` は `myProject` です。

![qTest の URL 入力例](/images/test-management-integrations/qtest-integration/761db53-image_4.png)

4. Testim の **Username** フィールドに、qTest のユーザー名を入力します。
5. **Admin** ユーザーとして **qTest** にログインし、**Resources**（下矢印）をクリックします。

![qTest の Resources メニュー](/images/test-management-integrations/qtest-integration/64df5b6-image_5.png)

6. **Resources** 画面で、**API & SDK** メニューを開きます。

![qTest の API & SDK メニュー](/images/test-management-integrations/qtest-integration/9721b13-image_6.png)

7. qTest から **Bearer Token** をコピーし、Testim の **ApiKey** フィールドに貼り付けます。
8. Testim で **Connect** をクリックします。
9. Testim で、接続する qTest プロジェクトをリストから選択します。

![qTest プロジェクトの選択画面](/images/test-management-integrations/qtest-integration/dfaf629-image_7.png)

この時点で、Testim は qTest のプロジェクトに接続されましたが、特定のテストには接続されていません。

:::info
一度に 1 つの TMS（テスト管理システム）のみ接続できます。Testim システムが既に別の TMS に接続されている場合は、まずその TMS を切断してから qTest に接続する必要があります。TMS を切断すると、テスト間の接続が削除されることに注意してください。そのため、以前の TMS に再度接続する場合は、接続も再作成する必要があります。
:::

## Testim のテストを qTest のテストに接続する

統合を設定した後、Testim の特定のテストを qTest のテストに接続します。→ **Testim のテストを qTest のテストに接続するには:**

1. Testim で、接続したいテストを開きます。
2. テスト内で、**Setup** ステップ（最初のステップ）の **Properties（プロパティ）** アイコンをクリックします。
3. Setup ステップの **Properties（プロパティ）** パネルで、**Test in qTest** の下から、最初のドロップダウンメニューで qTest プロジェクトを選択し、次に 2 番目のドロップダウンメニューで特定のテストを選択します。

![Setup ステップの Properties パネルで qTest テストを選択する画面](/images/test-management-integrations/qtest-integration/103f85c-image_2.png)

4. **Save** をクリックします。

:::info
qTest のテストケースは、最初の接続時に「approved」ステータスである必要があります。
:::

![qTest テストケースの承認ステータス](/images/test-management-integrations/qtest-integration/3a5c5d0-Screenshot_at_Jun_01_13-36-04.png)

## テストの実行と qTest での Testim テスト結果の表示

qTest でテスト実行の結果を表示するには、リモートグリッドのみを使用して Testim で接続されたテストを実行する必要があります。Testim で接続されたテストを実行すると、テスト結果が関連する qTest プロジェクトの **Test Execution** タブに表示されます。Testim 発の実行の名前は、以下の命名規則を使用します: `"<Testim.ioブランチ名> - <実行名>"`。

:::info
qTest でテストが変更された場合（新しいバージョン番号）、承認されたバージョンのテストのみが Testim で実行されます。つまり、**Save** のみをクリックした場合、以前の承認済みバージョンが実行され、qTest では実行レポートから「unexecuted」ステータスとして反映されます。**Save** してから **Approve** をクリックした場合、新しい承認済みバージョンが実行されます。
:::

**qTest でテスト実行を表示するには:**

1. qTest Manager で、**Test Executions** に移動します。

2. ナビゲーションペインで、関連する実行をクリックします。

以下の画面が表示されます:

![qTest Manager の Test Executions 画面](/images/test-management-integrations/qtest-integration/4758c86-image.png)

右下のペインに、実行のリストが表示されます。`ID` 列は qTest のテスト ID を表します。`Status` 列は Testim からのテスト実行結果を表示します。

3. **ID** をクリックしてテストの詳細を表示します。

以下の画面が表示されます:

![qTest でのテスト実行詳細画面](/images/test-management-integrations/qtest-integration/cee1498-image_1.png)

以下の詳細が Testim から qTest にプッシュされます:

- **Name** - Testim のテスト名
- **Status** - 実行のステータス。表示されるステータスは qTest ステータスで、Testim ステータスから以下のように変換されます（Testim → qTest）:
  - ABORTED - Unexecuted
  - SKIPPED (quarantine status in Testim) - Blocked
  - TIMEOUT - Failed
  - PASSED - Passed
  - FAILED - Failed

4. **Execution History** 内には、以下の情報を含む **Test Log Details** ペインがあります:
   - Result URL - Testim のテスト結果を開きます
   - Console Logs URL - Testim のコンソールログを開きます
   - Network Logs URL - Testim のネットワークログを開きます

:::info
スイート実行は qTest で 1 つの実行として表示されます。特定の実行をクリックして、スイート内のすべてのテストの結果を確認してください。
:::

:::info
qTest の必須カスタムフィールドはサポートされていません。qTest でカスタムフィールドを必須にすると、統合が機能しなくなる可能性があります。
:::
