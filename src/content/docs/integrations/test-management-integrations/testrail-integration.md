---
title: TestRail 統合
description: Testim と TestRail を統合してテスト実行結果を TestRail プロジェクトに自動的に表示する方法を説明します。統合設定、テストの接続、カスタムパラメーターの送信方法を網羅しています。
category: 統合
order: 12040
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/test-management-integrations/testrail-integration.htm'
keywords:
  - TestRail
  - テスト管理ツール
  - テストケース管理
  - テスト結果同期
  - テストラン
  - API 連携
  - リモートグリッド
---

TestRail 統合により、TestRail のテストを Testim のテストにリンクできます。テスト実行結果が TestRail に自動的に表示され、手動テスト結果と自動テスト結果を一元的に表示できます。

:::info
統合を切断すると、すべてのリンクが失われます。
:::

### TestRail 統合の設定

このプロセスは一度だけ必要です。

1. **Settings（設定）** に移動し、**Integration（統合）** タブに移動します。
2. TestRail リンクの **login** をクリックします。

![TestRail 統合のログインボタン](/images/test-management-integrations/testrail-integration/cbf1548-Untitled.png)

3. TestRail を開き、URL からドメインをコピーして（ログイン済みであることを確認してください）、URL フィールドに貼り付けます。URL 構造は `https://<プロジェクト名>.testrail.io/` で、プロジェクト名は TestRail の URL で確認できます。

![TestRail の URL 入力例](/images/test-management-integrations/testrail-integration/ea0ada5-image-20210523-052818.png)

4. TestRail のユーザー名を入力します。
5. Admin ユーザーとして TestRail にログインし、**My Settings** に移動して **API Keys** タブに移動します。**Generate Key** をクリックし、任意のキー名を入力して、生成された文字列をコピーし、**Save settings** をクリックします。このキーを Testim の ApiKey フィールドに貼り付けます。

![TestRail で API キーを生成する操作](/images/test-management-integrations/testrail-integration/b291ef8-TR.gif)

6. **Connect** をクリックします。

![TestRail 統合の接続操作](/images/test-management-integrations/testrail-integration/25995c4-Integrate.gif)

7. 接続する TestRail プロジェクトを選択します。

![TestRail プロジェクトの選択画面](/images/test-management-integrations/testrail-integration/1e8d54a-Screen_Shot_2021-10-14_at_12.54.26.png)

この時点で、Testim は TestRail のプロジェクトに関連付けられましたが、特定のテストにはマッピングされていません。

:::info{title="重要事項"}
一度に 1 つの TMS（テスト管理システム）のみ接続できます。Testim システムが既に別の TMS に接続されている場合は、まずその TMS を切断してから TestRail に接続する必要があります。TMS を切断すると、テスト間の接続が削除されることに注意してください。そのため、以前の TMS に再度接続する場合は、接続も再作成する必要があります。
:::

### Testim のテストを TestRail のテストに接続する

1. TestRail のテストに接続したいテストを開きます。
2. Setup ステップの **Properties（プロパティ）** パネルで、TestRail プロジェクトと接続するテストを選択します。
3. テストを保存します。

テストを実行すると、結果は関連する TestRail プロジェクトの **Test run and results** タブに表示されます。

![Testim のテストを TestRail に接続する操作](/images/test-management-integrations/testrail-integration/7ad9ed6-Oct-14-2021_13-09-56.gif)

### 特定の実行に TestRail のカスタムパラメーターを渡す

[CLI 実行](/docs/running-tests/the-command-line-cli)の一部として、TestRail で使用できるカスタムパラメーターを追加できます。例:

- version
- executed_by

JSON は以下の形式にする必要があります:

```json
{
  "executed_by": "rannn505",
  "version": "v1"
}
```

これらのパラメーターを渡すには、[CLI](/docs/running-tests/the-command-line-cli)コマンドの一部として `--tms-field-file` フラグを使用します。フラグの後にパラメーターとその値を含む JSON ファイルパスを指定します。例:

```shell
--tms-field-file [tms-field-file.json]
```

### 注意事項

1. Testim の実行名は常に以下の規則に従います:

"Report from Testim.io - _Suite\Test name_"
2. リモート実行の結果のみが TestRail に表示されます（ローカル実行は表示されません）。
3. スイート実行は TestRail で 1 つの実行として表示されます。特定の実行をクリックして、スイート内のすべてのテストの結果を確認してください。
4. TestRail の必須カスタムフィールドはサポートされていません。TestRail でカスタムフィールドを必須にすると、統合が機能しなくなる可能性があります。
