---
title: 'ビジュアルエディターでのデータ駆動テストの設定'
description: 'ビジュアルエディターでテストデータを追加し、複数のデータセットで同じテストを実行する方法を解説します。'
category: 'データ駆動テスト'
order: 2
updated: '2025-11-02'
keywords:
  - データ駆動テスト
  - テストデータ
  - CSV
  - Excel
  - パラメータ
---

UIでSetupステップのプロパティパネルから「**テストデータ**」を選択することで、特定のテストにテストデータを追加できます。

**テストにテストデータを追加するには:**

1. テストの**Setup**ステップ（最初のステップ）で、**プロパティを表示**ボタン（歯車アイコン）をクリックします。
2. **テストデータ**をクリックします。
3. JSエディターでデータセットを定義します。

   単一のデータセットの簡単な例:

   ```javascript title="単一データセット"
   return {
       "username" : "Matan",
       "password" : "123"
   }
   ```

   以下は、例で定義したデータセットです:

   ```javascript title="複数データセット"
   return [{
     "username": "tomsmith",
     "password": "SuperSecretPassword!"
   },{
     "username": "david",
     "password": "SecretPassword?"
   }];
   ```

:::note
return行の括弧は残しておく必要があります。
:::

:::info
[Testim CLI](/docs/the-command-line-cli)、スケジューラー、またはローカルスイート実行からテストを実行した場合にのみ、テストは複数回実行され、毎回異なるデータセットが使用されます。
:::

![データ駆動テストの設定](/images/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor/c35c945-Data_Driven_Tests.gif)

4. データセットを追加したいステップで**プロパティを表示**ボタン（歯車アイコン）をクリックします。たとえば、「ユーザー名の設定」と「パスワードの設定」ステップです。
5. **割り当てるテキスト**フィールドで、既存のテキストをパラメータ名に置き換えます。たとえば、**ユーザー名の設定**ステップでは、`username` パラメータを入力します。

![ユーザー名パラメータ](/images/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor/e5d7747-username_param.png)

6. テストを実行します。

   テストは最初のデータセットで実行されます:

![テスト実行結果](/images/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor/ca3d466-Capture1.png)

"username": "tomsmith", "password": "SuperSecretPassword!"

エディターからテストを実行すると、**最初のデータセット**のみが実行されます。追加のデータセットを実行する場合は、UIで提供されたテストデータを上書きする `beforeSuite` フックを含む **CLI**、または [スケジューラー](/docs/running-tests/scheduler) を使用する必要があります。

## CSV/Excelファイルをアップロードしてテストデータを追加

CSV or Excelファイルをアップロードしてテストデータを追加することも可能です。ファイルがアップロードされると、そのデータは以下の構造に従ってテストデータとして追加されます:

* 1行目 - パラメータ名（キー名）
* 2行目以降 - 各行が単一のデータセットに変換されます（キー値）。最大1200行。

:::note
この方法では、ファイルが変更されてもアップロードされたデータは更新されません。更新するたびにファイルを再度アップロードする必要があります。一方、設定ファイル方式（[外部ソースからのデータを使用したデータ駆動テスト](/docs/data-driven-testing/configuring-data-driven-tests-using-data-from-an-external-source)を参照）を使用すると、ファイルは実行ごとに自動的に解析されます。
:::

**ファイルをアップロードしてテストデータを追加するには:**

1. 上記の構造に従ってExcel/CSVファイルを準備します。

![Excelデータの例](/images/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor/4299366-exceldata.PNG)

2. テストの**Setup**ステップ（最初のステップ）で、**プロパティを表示**ボタン（歯車アイコン）をクリックします。
3. **テストデータ**をクリックします。
4. **ファイルをアップロード**をクリックし、作成したファイルを選択します。

![ファイルアップロード](/images/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor/236cb27-uploadfile.png)

5. アップロードされたデータが表示されます。必要に応じてこのデータを変更できます。

![テストデータ](/images/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor/2f94059-test_data.PNG)

6. 上記で説明したように、テストステップでパラメータを使用します。

:::info
[Testim CLI](/docs/the-command-line-cli)、スケジューラー、またはローカルスイート実行からテストを実行した場合にのみ、テストは複数回実行され、毎回異なるデータセットが使用されます。
:::

:::tip{title="リビジョン履歴"}
エディターでテストデータを更新する際、リビジョン履歴から以前に保存したテストデータに戻すことができます。ブランチでテストデータを変更した場合、マージ時にその変更をマージにも適用するかどうかを決定する必要があります。
:::
