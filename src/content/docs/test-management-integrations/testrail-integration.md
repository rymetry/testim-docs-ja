---
title: TestRail統合
description: TestimとTestRailを統合してテスト実行結果をTestRailプロジェクトに自動的に表示する方法を説明します。統合設定、テストの接続、カスタムパラメータの送信方法を網羅しています。
category: 統合
order: 12040
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/testrail-integration'
keywords:
  - TestRail
  - テスト管理ツール
  - テストケース管理
  - テスト結果同期
  - テストラン
  - API連携
  - リモートグリッド
---

TestRailプロジェクトでTestimのテスト実行結果を表示します。

TestRail統合により、TestRailのテストをTestimのテストにリンクできます。テスト実行結果がTestRailに自動的に表示され、手動テスト結果と自動テスト結果を一元的に表示できます。

:::info
統合を切断すると、すべてのリンクが失われます。
:::

## TestRail統合の設定

このプロセスは一度だけ必要です。

1. **Settings（設定）** に移動し、**Integration（統合）** タブに移動します。
2. TestRailリンクの **login** をクリックします。

![TestRail統合のログインボタン](/images/test-management-integrations/testrail-integration/cbf1548-Untitled.png)

3. TestRailを開き、URLからドメインをコピーして（ログイン済みであることを確認してください）、URLフィールドに貼り付けます。URL構造は `https://<プロジェクト名>.testrail.io/` で、プロジェクト名はTestRailのURLで確認できます。

![TestRailのURL入力例](/images/test-management-integrations/testrail-integration/ea0ada5-image-20210523-052818.png)

4. TestRailのユーザー名を入力します。
5. AdminユーザーとしてTestRailにログインし、**My Settings** に移動して **API Keys** タブに移動します。**Generate Key** をクリックし、任意のキー名を入力して、生成された文字列をコピーし、**Save settings** をクリックします。このキーをTestimのApiKeyフィールドに貼り付けます。

![TestRailでAPIキーを生成する操作](/images/test-management-integrations/testrail-integration/b291ef8-TR.gif)

6. **Connect** をクリックします。

![TestRail統合の接続操作](/images/test-management-integrations/testrail-integration/25995c4-Integrate.gif)

7. 接続するTestRailプロジェクトを選択します。

![TestRailプロジェクトの選択画面](/images/test-management-integrations/testrail-integration/1e8d54a-Screen_Shot_2021-10-14_at_12.54.26.png)

この時点で、TestimはTestRailのプロジェクトに関連付けられましたが、特定のテストにはマッピングされていません。

:::info{title="重要事項"}
一度に1つのTMS（テスト管理システム）のみ接続できます。Testimシステムが既に別のTMSに接続されている場合は、まずそのTMSを切断してからTestRailに接続する必要があります。TMSを切断すると、テスト間の接続が削除されることに注意してください。そのため、以前のTMSに再度接続する場合は、接続も再作成する必要があります。
:::

## TestimのテストをTestRailのテストに接続する

1. TestRailのテストに接続したいテストを開きます。
2. Setupステップの **Properties（プロパティ）** パネルで、TestRailプロジェクトと接続するテストを選択します。
3. テストを保存します。

テストを実行すると、結果は関連するTestRailプロジェクトの **Test run and results** タブに表示されます。

![TestimのテストをTestRailに接続する操作](/images/test-management-integrations/testrail-integration/7ad9ed6-Oct-14-2021_13-09-56.gif)

## 特定の実行にTestRailのカスタムパラメータを渡す

CLI実行の一部として、TestRailで使用できるカスタムパラメータを追加できます。例:

- version
- executed_by

JSONは以下の形式にする必要があります:

```json
{
  "executed_by": "rannn505",
  "version": "v1"
}
```

これらのパラメータを渡すには、CLIコマンドの一部として `--tms-field-file` フラグを使用します。フラグの後にパラメータとその値を含むJSONファイルパスを指定します。例:

```shell
--tms-field-file [tms-field-file.json]
```

## 注意事項

1. Testimの実行名は常に以下の規則に従います: "Report from Testim.io - *Suite\Test name*"
2. リモート実行の結果のみがTestRailに表示されます（ローカル実行は表示されません）。
3. スイート実行はTestRailで1つの実行として表示されます。特定の実行をクリックして、スイート内のすべてのテストの結果を確認してください。
4. TestRailの必須カスタムフィールドはサポートされていません。TestRailでカスタムフィールドを必須にすると、統合が機能しなくなる可能性があります。
