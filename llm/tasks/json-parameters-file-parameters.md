# 翻訳タスク (json-parameters-file-parameters)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

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

作成したJSONファイルは、[Testim CLI](/docs/running-tests/the-command-line-cli) の **--params-file** 引数で指定します。

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

以降は、[ステッププロパティパネルのパラメータ](/docs/parameters/parameters-in-custom-javascript-steps) として各テストから参照できます。
