---
title: 'JSON パラメータファイル'
description: '原文: https://help.testim.io/docs/json-parameters-file-parameters'
category: '高度な編集'
order: 5043
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/json-parameters-file-parameters'
keywords:
  - Testim
  - パラメータ
  - JSONファイル
  - CLI
  - 実行時引数
  - 設定ファイル
  - テスト実行
  - 動的値
---

JSON パラメータファイルでテストに値を渡す

**JSON パラメータファイル**を使うと、実行時にパラメータを渡せます。環境ごとに異なる値を定義でき、たとえばローカルとCIで認証情報を切り替える、といった用途に向いています。パラメータを定義したJSONファイルを用意し、テスト実行時にCLI引数で指定します。

## パラメータのスコープ

定義したパラメータは、単一の実行（ラン）に含まれるすべてのテストに適用されます。

## JSON ファイルに定義する

次のようなJSONで必要なパラメータを定義します。

```json
{
  "username": "david",
  "password": "123"
}
```

## CLI で指定する

作成したJSONファイルは、[Testim CLI](/docs/the-command-line-cli) の **--params-file** 引数で指定します。

> 📘
>
> `--params-file` に指定するパスはフルパスではなく相対パスである必要があります。

```shell
testim --label "<YOUR LABEL>" --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>" --grid "<Your grid name>" 
--params-file <PARAM FILE NAME e.g. params-file.json>
```

## JavaScript（JS）形式のパラメータファイル

JSONの代わりに、JSファイルで値をエクスポートすることも可能です。テスト設定内でより動的に管理できます。

次のようなJSファイル（例: param-file.js）を作成します。

```javascript
module.exports = {
    username: "admin"
};
```

この構文でエクスポートした値を、そのままパラメータとして利用できます。テスト実行時は次のようにJSファイルを指定します。

```javascript
testim --label "<YOUR LABEL>" --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>" --grid "<Your grid name>" 
--params-file <PARAM FILE NAME e.g. params-file.js>
```

以降は、[ステッププロパティパネルのパラメータ](/docs/parameters-in-custom-javascript-steps) として各テストから参照できます。
