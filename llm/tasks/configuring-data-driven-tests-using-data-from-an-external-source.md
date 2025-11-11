# 翻訳タスク (configuring-data-driven-tests-using-data-from-an-external-source)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

外部ソース(CSV、DBなど)からのテストデータは、[設定ファイル](/docs/configuration-file/configuration-file-run-hooks)を使用して1つまたは複数のテストに渡し、設定ファイルを使用するフラグを追加してCLIでテストを実行できます。

:fa-arrow-right: **外部テストデータを設定ファイルに追加するには:**

1. 設定ファイルを作成するか、既存のファイルを編集します。
2. この機能を使用するために、npmパッケージcsvtojsonをインストールします。詳細はこちらを参照してください: [https://www.npmjs.com/package/csvtojson](https://www.npmjs.com/package/csvtojson)。csvtojson npmパッケージは、以下のように設定ファイルに含める必要があります(`const csvtojson = require("csvtojson")`)。
3. 設定ファイルの冒頭に、外部ソースからJSONオブジェクトにデータをロードするJavaScript関数を追加します(`loadCsvFile(path)`)。

```javascript
// CSVからJsonオブジェクトにデータをロードするJS関数
const csvtojson = require("csvtojson");
function loadCsvFile(path) {
    return new Promise((resolve) => {
        return csvtojson()
            .fromFile(path)
            .then(resolve, err => {
                console.error("failed to read csv file", err.message);
                resolve([]);
            });
    });
}
```

4. 以下のように、`beforeSuite`内で`overrideTestData`を使用してテスト名とそのデータセットを渡します。

```javascript
beforeSuite: function () {
    return Promise.all([loadCsvFile('./data.csv'),
    loadCsvFile('./data2.csv'), loadCsvFile('./data3.csv')])
        .then(([jsonObj, jsonObj2, jsonObj3]) => {
            return {
                BEFORE_SUITE: "BEFORE_SUITE",
                overrideTestData: {
                "Test 3": jsonObj,
                "Test 4": jsonObj2,                        
                "Test 5": jsonObj3,                         
                // 静的なデータセットをテストに渡すこともできます
                "Test 6": {name: "ryan"}                    
            }
        }
    });
} //beforeSuiteの後に他の関数がある場合は、ここにカンマを追加します
```

> 📘 設定ファイルのbeforeSuite()フックで提供されるテストデータは、UIで提供されるテストデータを上書きします。

> 📘 CSVファイルでは、最初の行(ヘッダー行)にデータキーが含まれ、パラメータ名として使用されます。その後の各行には、値のデータセットが含まれます。
