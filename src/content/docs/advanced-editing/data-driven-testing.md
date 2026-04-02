---
title: データ駆動テスト
description: 異なるデータで同じテストを実行する方法を学びます。テストデータの追加方法と複数のデータセットでの実行方法を解説します。
category: 高度な編集
order: 5026
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/data-driven-testing/index.htm'
keywords:
  - データ駆動テスト
  - テストデータ
  - データセット
  - パラメーター
  - 設定ファイル
  - CLI
  - Visual Editor
  - 外部データソース
  - Cookie 設定
  - 複数実行
---

異なるデータで同じテストを実行する方法を学びます。

データ駆動テストでは、テスト内でパラメーターを定義し、任意のステップで使用できます。複数の順序付きデータセットを定義し、Testim CLI を使用して各セットに対して個別にテストを実行できます。

:::note
データセットを使用する場合、明示的に削除されるまで、以前のデータはテストから自動的に削除されません。
:::

## データ駆動テストの一般的な用途

- **異なるデータでサインアップテストを実行** - 異なるユーザー名とパスワードでサインアップページをテストしたい場合、テストデータと[条件分岐](/docs/editing-tests/conditions)を使用して、Testim で 1 つのテストを作成し、異なるユーザー名とパスワード（ポジティブまたはネガティブ）で複数回実行できます。
- **データベースからデータを読み取り/注入** - データベースにデータを注入し、テストで生成されたデータを渡したい場合。データの生成には[Testim CLI フック](/docs/running-tests/configuration-file-run-hooks)を使用でき、データの注入が正常に完了した後、そのデータをテストに渡すことができます。

## テストにテストデータを追加する

テストデータは 3 つの方法でテストに追加できます:

- **Visual Editor（UI）経由** - テストデータは**セットアップ**ステップの**テストデータ**プロパティを通じて追加されます。データセットは JavaScript で定義され、複数の順序付きデータセットはオブジェクトの JS 配列リテラルで定義されます。詳細は[Visual Editor からのデータ駆動テストの設定](/docs/advanced-editing/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor)を参照してください。
- **[設定ファイル経由](/docs/advanced-editing/data-driven-testing/configuring-data-driven-tests-using-the-config-file)** - 設定ファイルは、設定ファイルフックを実行しながら、テストを実行するために必要なすべてのパラメーターを含む一般的な JS ファイルです。これらのフック（例:`beforeSuite`）の 1 つを通じて、実行全体または特定のテストにテストデータを追加できます。このデータセットは、Visual Editor で定義されたデータセットを上書きできます。テストは CLI を使用して実行でき、この実行で設定ファイルを使用するフラグを追加します。設定ファイルオプションは、データが使用されるスコープに対して広範な汎用性と細かい制御を提供します:
  - **実行レベル** - 設定フック内の`return`セクションの後にデータパラメーターを配置すると、実行に含まれるすべてのテストで同じデータが実行されます。

    ![実行レベルのデータ設定例](/images/data-driven-testing/data-driven-testing/44a22c0-image_1.png)

  - **テストレベル** - `return`セクション内に`overrideTestData`オブジェクトを追加できます。これにより、テスト名で指定されたテストにデータを追加でき、同じ実行内で 1 つのテストに 1 つのパラメーター、別のテストに別のパラメーターを指定することができます。

    ![テストレベルのデータ設定例](/images/data-driven-testing/data-driven-testing/9037352-2024-01-24_16-13-40.png)

  - **[外部ファイルにリンクされたデータオブジェクトの使用](/docs/advanced-editing/data-driven-testing/configuring-data-driven-tests-using-data-from-an-external-source)** - 外部ソース（CSV、DB など）からのテストデータは、設定ファイルを使用して 1 つまたは複数のテストに渡すことができます。パラメーターは`return`セクション内（つまり**実行レベル**）または`overrideTestData`オブジェクト内（つまり**テストレベル**）のいずれかに配置できます。テストは CLI を使用して実行でき、この実行で設定ファイルを使用するフラグを追加します。

- **[パラメーターファイル経由](/docs/advanced-editing/parameters/json-parameters-file-parameters)** - パラメーターファイルは、パラメーターとその値を含む JSON ファイルです。これは、Visual Editor で定義されたデータセットを上書きするより簡単な方法です。ただし、**_実行レベルのスコープのみ_**を提供します。つまり、すべてのパラメーターとその値は、実行に含まれるすべてのテストで使用されます。テストは CLI を使用して実行でき、この実行でパラメーターファイルを使用するフラグを追加します。CLI コマンドは、実行に含まれるテストにパラメーターを渡します。

:::note
テストデータのサイズは 2MB を超えてはいけません。
:::

## 異なるデータセットでのテスト実行の表示

テスト結果は各データセットごとに個別に表示され、実行で使用されたデータセットが表示されます。

1. [スイート実行ビュー](/docs/results/execution-runs-screen)に移動し、実行したスイートに移動します。
2. テストの右側にある「i」アイコンにカーソルを合わせ、**データセットを表示**ボタンをクリックすると、テストごとのデータセットを含む実行結果を確認できます。

![データセットを含むテスト実行結果の表示](/images/data-driven-testing/data-driven-testing/5f1708f-datadriven.gif)

## Cookie の設定

システムが読み込まれる前に Cookie を読み込む必要がある場合、または特定のテストで Cookie が必要な場合、予約された`cookies`パラメーターを使用して Cookie を定義することもできます。cookies パラメーターは、Visual Editor および設定ファイルを通じて追加できます。

![Cookie の設定例](/images/data-driven-testing/data-driven-testing/5550483-SetData6.png)

Cookie の設定オプションについての詳細は[こちら](/docs/advanced-editing/cookies)をご覧ください。
