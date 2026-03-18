---
title: テストプラン
description: すべてのテスト、セットアップ・ティアダウンテスト、および実行する構成のリストを含む Web アプリ用テストプランの作成方法を学びます
category: テスト管理
order: 9012
updated: '2025-09-15'
sourceUrl: 'https://help.testim.io/docs/test-plans'
keywords:
  - テストプラン
  - セットアップテスト
  - ティアダウンテスト
  - Web テストプラン
  - テスト実行順序
  - グリッド実行
  - 構成上書き
---

すべてのテスト、セットアップ・ティアダウンテスト、および実行する構成のリストを含む Web アプリ用テストプランの作成方法を学びます

テストプランは、連続して実行するように整理できる特定のテストラベルやテストスイートを含むテストのコンテナです。テストプランには、テスト/テストスイートのリストの前後に実行されるテスト/テストスイートを含めることができます。テストプランには、テストのデフォルト設定を上書きする設定を含めることができます。

テストプランは以下のような場合に最適です:

* テスト実行前に環境をセットアップする必要がある場合
* テスト実行後に環境をクリーンアップする必要がある場合
* 複数のブラウザやオペレーティングシステムでテストを実行する場合

## 新しい Web テストプランを作成する

:fa-arrow-right: **新しいテストプランを作成するには:**

1. メインメニューで **Test List** に移動します。
2. 上部ナビゲーションから **Plans** を選択します。
3. **New Plan** ボタンをクリックします。

![Test List 画面の Plans タブで New Plan ボタンをクリックする画面](/images/test-management/test-plans/fd4471d-new-test.png)

4. 新しいテストプランの **Name**（名前）と **Description**（説明）を入力します。

![Web テストプランの Name と Description を入力する新規プランダイアログ](/images/test-management/test-plans/73ab5c3-newwebtestplan.png)

5. テストプランのメインテストリストの前に一連のテストを実行したい場合は、**Add Before All** チェックボックスを選択します。1 つ以上の[テストスイート](/docs/test-suites)または[テストラベル](/docs/labels)の名前を入力します。通常、これにはログインなどのセットアップ手順が含まれます。

![Add Before All セクションでセットアップ用テストスイートやラベルを設定する画面](/images/test-management/test-plans/b29d06d-newwebtestplan.png)

6. **Test List** ボックスに、1 つ以上の[テストスイート](/docs/test-suites)または[テストラベル](/docs/labels)の名前を入力します。

![Test List セクションでプラン本体として実行するテストスイートやラベルを指定する画面](/images/test-management/test-plans/30d2400-newwebtestplan.png)

7. テストリストの実行後に「ティアダウン」テストを追加したい場合は、**Add After All** チェックボックスを選択します。1 つ以上の[テストスイート](/docs/test-suites)または[テストラベル](/docs/labels)の名前を入力します。テストプランに「ティアダウン」テストを含めることはベストプラクティスです。これらは、テストの完了後にキャッシュのクリア、データのクリーンアップ、ユーザーのログアウトなどを行うように設計されたテストです。

![Add After All セクションでティアダウン用テストスイートやラベルを設定する画面](/images/test-management/test-plans/e34954a-newwebtestplan.png)

:::warning{title="注意"}
* "Before all" と "After all" のテストは、常に並列レベル `1` で実行されます。"Test List" のみが、CLI で設定されている場合、より高い並列化レベルで実行できます。
* "before all" のテストのいずれかが失敗した場合、テストリストのテストは実行されません。その結果、実行全体が「失敗」としてマークされ、残りのキューイングされたすべてのテスト実行が中止されます。
* "Add After All" のテストは、テストリストのテストが失敗した場合でも常に実行されます。
:::

8. **Where to Run** フィールドで、テストを実行したい **Grid** を選択します。詳細については、[Grid Management](/docs/grid-management) を参照してください。

![Where to Run フィールドでテストプランの実行先グリッドを選択する画面](/images/test-management/test-plans/d46f60c-newwebtestplan.png)

9. **What to run on** セクションで、**Override default configurations** チェックボックスを選択して、テストを実行するブラウザ、オペレーティングシステム、解像度を手動で設定します。構成のリストから選択するか、新しい構成を作成します。詳細については、[Configurations Library](/docs/shared-configuration) を参照してください。これにより、テストのデフォルト構成が上書きされます。複数の構成を選択すると、それぞれに対して複数の実行が行われます。

![What to run on セクションで Override default configurations を使ってブラウザ構成を選択する画面](/images/test-management/test-plans/d484c9d-newwebtestplan.png)

10. **What to run on** セクションで、**Override Base URL** チェックボックスを選択して、Web アプリの開始 URL（例: 本番環境またはステージング環境）を設定します。詳細については、[Base URL](/docs/base-url) を参照してください。

![Override Base URL オプションで開始 URL を指定する画面](/images/test-management/test-plans/b5e9303-baseurl.png)

11. **Create** ボタンをクリックして、テストプランを作成します。

## テストプランを実行する

テストプランを実行するには、次のように CLI コマンドでプラン名を指定する必要があります:

```shell
--test-plan "Test Plan Demo"
```

:::note
CLI に異なるグリッド名を追加すると、プランで定義されたグリッドが上書きされます。
:::

:::note{title="CLI ステップ"}
テストに CLI ステップがある場合は、実行前に CLI が実行されていることを確認してください。
:::

## テスト間でパラメーターを共有する

プランを使用すると、テスト間でパラメーターを共有できます。例えば、セットアップでアカウントを作成し、すべてのテストでその資格情報を使用できます。詳細については、[Parameters](/docs/parameters) を参照してください。

## エディターから直接テストプランを実行する

**:fa-arrow-right: エディターから直接テストプランを実行するには:**

1. **Test List > Plans** に移動します。
2. 実行したいプランを選択します。
3. **Play** ボタンをクリックします。

![Plans タブからプランを選択して Play ボタンで実行する画面](/images/test-management/test-plans/88d404a-Mar-22-2021_11-38-54.gif)

:::note
テストの 1 つに CLI アクションがある場合は、CLI が実行されていることを確認してください。
:::
