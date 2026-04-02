---
title: 外部ソースのデータを使用したデータ駆動テストの構成
description: 外部ソース（CSV、データベースなど）からのデータを使用してデータ駆動テストを構成する方法を説明します。
category: 高度な編集
order: 5029
updated: '2025-09-19'
sourceUrl: >-
  https://docs.tricentis.com/testim/content/advanced-editing/data-driven-testing/configuring-data-driven-tests-using-data-from-an-external-source.htm
keywords:
  - testim
  - configuring-data-driven-tests-using-data-from-an-external-source
  - data-driven-testing
  - 外部ソース
  - CSV
  - データベース
  - csvtojson
  - loadCsvFile
  - beforeSuite
  - 設定ファイル
---

外部ソース（CSV、DB など）からのテストデータは、[設定ファイル](/docs/running-tests/configuration-file-run-hooks)を使用して 1 つまたは複数のテストに渡し、設定ファイルを使用するフラグを追加して CLI でテストを実行できます。

**外部テストデータを設定ファイルに追加するには:**

1. 設定ファイルを作成するか、既存のファイルを編集します。
2. この機能を使用するために、npm パッケージ csvtojson をインストールします。詳細はこちらを参照してください: [https://www.npmjs.com/package/csvtojson](https://www.npmjs.com/package/csvtojson)。csvtojson npm パッケージは、以下のように設定ファイルに含める必要があります（`const csvtojson = require("csvtojson")`）。
3. 設定ファイルの冒頭に、外部ソースから JSON オブジェクトにデータをロードする JavaScript 関数を追加します（`loadCsvFile(path)`）。

```javascript
// CSVからJsonオブジェクトにデータをロードするJS関数
const csvtojson = require('csvtojson');
function loadCsvFile(path) {
  return new Promise((resolve) => {
    return csvtojson()
      .fromFile(path)
      .then(resolve, (err) => {
        console.error('failed to read csv file', err.message);
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

:::note
設定ファイルの beforeSuite() フックで提供されるテストデータは、UI で提供されるテストデータを上書きします。
:::

:::note
CSV ファイルでは、最初の行（ヘッダー行）にデータキーが含まれ、パラメーター名として使用されます。その後の各行には、値のデータセットが含まれます。
:::
