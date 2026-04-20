---
title: JSON パラメーターファイル
description: JSON パラメーターファイルでテストに値を渡す
category: 高度な編集
order: 5043
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/parameters/json-parameters-file-parameters.htm'
keywords:
  - Testim
  - パラメーター
  - JSON ファイル
  - CLI
  - 実行時引数
  - 設定ファイル
  - テスト実行
  - 動的値
---

**JSON パラメーターファイル**を使うと、実行時にパラメーターを渡せます。環境ごとに異なる値を定義でき、例えばローカルと CI で認証情報を切り替える、といった用途に向いています。パラメーターを定義した JSON ファイルを用意し、テスト実行時に CLI 引数で指定します。

## パラメーターのスコープ

定義したパラメーターは、単一の実行（ラン）に含まれるすべてのテストに適用されます。

## JSON ファイルに定義する

次のような JSON で必要なパラメーターを定義します。

```json
{
  "username": "david",
  "password": "123"
}
```

## CLI で指定する

作成した JSON ファイルは、[Testim CLI](/docs/running-tests/the-command-line-cli) の `--params-file` 引数で指定します。

:::note
`params-file` パスに設定する文字列パスは、フルパスではなく相対パスである必要があります。
:::

```shell
testim --label "<YOUR LABEL>" --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>" --grid "<Your grid name>"
--params-file <PARAM FILE NAME e.g. params-file.json>
```

## JavaScript（JS）形式のパラメーターファイル

JSON の代わりに、JS ファイルで値をエクスポートすることも可能です。テスト設定内でより動的に管理できます。次のような JS ファイル（例: param-file.js）を作成します。

```javascript
module.exports = {
  username: 'admin',
};
```

この構文でエクスポートした値を、そのままパラメーターとして利用できます。テスト実行時は次のように JS ファイルを指定します。

```javascript
testim --label "<YOUR LABEL>" --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>" --grid "<Your grid name>"
--params-file <PARAM FILE NAME e.g. params-file.js>
```

以降は、[ステッププロパティパネルのパラメーター](/docs/advanced-editing/parameters/parameters-in-custom-javascript-steps) として各テストから参照できます。
