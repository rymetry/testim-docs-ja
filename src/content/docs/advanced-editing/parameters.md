---
title: パラメーター
description: パラメーターの使い方をまとめて解説します。
category: 高度な編集
order: 5040
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/parameters/index.htm'
keywords:
  - Testim
  - パラメーター
  - 変数
  - データ駆動テスト
  - 設定
  - スコープ
  - 定義方法
  - 変数
  - データ駆動テスト
  - 設定ファイル
---

パラメーターは、テストステップ／テスト／テストスイートへ情報を受け渡すための変数です。事前に値を固定せずに、異なるシナリオを切り替えて検証できます。定義方法には複数あり、方法ごとに有効範囲（スコープ）が異なります。

## パラメーターの定義方法

- [ステッププロパティパネルのパラメーター](/docs/advanced-editing/parameters/parameters-in-custom-javascript-steps) - 一部のステップでは、プロパティパネルの PARAMS 欄でパラメーターを定義できます。
- [グループのパラメーター](/docs/advanced-editing/parameters/parameters-for-groups) - グループにパラメーターを定義し、他テストでも再利用できます。
- [パラメーターのエクスポート](/docs/advanced-editing/parameters/exports-parameters) - カスタム/CLI/ネットワーク/ダウンロードの各検証・アクションステップ内の関数エディターで定義したパラメーターを、定義したスコープに応じて同一グループ／テスト／実行内の他ステップで利用できます。
- [JSON パラメーターファイル](/docs/advanced-editing/parameters/json-parameters-file-parameters) - JSON ファイルで定義し、実行時に受け渡します。
- [設定ファイルのパラメーター](/docs/advanced-editing/parameters/configuration-file-parameters) - 設定ファイルで定義し、実行時に受け渡します。
- [テストデータ](/docs/advanced-editing/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor) - テストデータ内で定義し、各ステップから参照します。
- 値生成ステップ - [日付の生成](/docs/editing-tests/generating-a-date#生成日付ステップを追加する)、[メールアドレスの生成](/docs/advanced-editing/validations/email-validation#テストの関連ステップで恒久的メールを使用する)、[値の抽出](/docs/advanced-editing/extract-text)、[乱数の生成](/docs/editing-tests/generating-a-random-value) などでは、既定の変数名（例: Generate Date の `dateValue`）が用意されます。必要に応じてプロパティパネルの「変数名」で変更できます。

## 事前定義（標準）パラメーター

`BASE_URL`、`TESTIM_ITERATOR`、`networkRequests` は標準で利用できる特別なパラメーターです。通常のパラメーターと異なり、事前の定義は不要でそのまま参照できます。

### Base URL パラメーター

テスト実行のベース URL（テスト定義の値、または上書き値）が入ります。パラメーターが使える場所ならどこでも利用可能です。

:::note
URL 文字列の前後に単一引用符が付く場合があります（例: 'BASE_URL + '/Extension''）。その場合は引用符を削除して利用してください（例: BASE_URL + '/Extension'）。
:::

データ駆動テストでの動的なベース URL としても有用です。例えば複数サイトに同一テストを流す場合、与えるデータに応じて BASE_URL を切り替えられます。\
詳細は [Base URL](/docs/running-tests/base-url) を参照してください。

### Testim Iterator パラメーター

TESTIM_ITERATOR はグループのループ内でのみ利用でき、現在の反復回数を示します。ループのたびに 1 ずつ増加します。

:::note
このパラメーターのスコープはグループのループ内に限定されます。
:::

詳細は [ループイテレーターパラメーターの使用](/docs/loops#using-the-loop-iterator-parameter) を参照してください。

### Network Requests パラメーター

`networkRequests` は、実行中に発生したネットワークリクエストをオブジェクト配列として収集します。ネットワーク検証ステップ内でのみ利用できます。詳細は [ネットワーク検証の追加](/docs/advanced-editing/validations/add-network-validation) を参照してください。

## パラメーターの使用方法

定義したパラメーターは、名前をそのまま（引用符なし）で記述して参照します。

![myParam が定義済みパラメーターです](/images/parameters/parameters/3f139cf-image.png)

myParam が定義済みパラメーターです。定義したパラメーターは、次の場所で使用できます。

- **プロパティパネルの任意のテキスト入力欄** - プロパティパネルの任意のテキスト入力欄で利用できます。例: テキスト検証の「期待値」、ステップの実行条件（要素テキスト）の「期待値」など。以下の入力欄はパラメーターの使用に非対応です:
  - Variable Name
  - Description
  - Date Format
- **プロパティパネルの Param セクションにある式入力欄** - パラメーターを定義すると式入力欄が表示され、そこに別の定義済みパラメーターを設定して値を連鎖させることもできます。
- **任意の関数エディターパネル** - 一部のステップ（例: カスタム検証）やカスタム条件には関数エディターパネルがあります。定義済みパラメーターをこのエディター内で参照可能です。詳細は [高度な JS エディター](/docs/advanced-editing/advanced-js-editor) を参照してください。
- **[API ステップ](/docs/advanced-editing/api-testing#using-parameters)** - API ステップには、定義済みパラメーターの使用をサポートする以下のテキストセクションがあります:
  - Request URL - このセクションでは二重または三重ブラケットでパラメーターを参照します（例: \{\{\{param}}}）。
  - Header - このセクションでは二重または三重ブラケットでパラメーターを参照します（例: \{\{\{param}}}）。
  - Body - このセクションでは二重または三重ブラケットでパラメーターを参照します（例: \{\{\{param}}}）。
  - Assertion
  - Function editor

## パラメーターを非表示にする

パラメーターに機微情報を含む場合は、[非表示パラメーター](/docs/advanced-editing/parameters/hidden-parameters) の手順で値の保存・表示を抑制できます。
