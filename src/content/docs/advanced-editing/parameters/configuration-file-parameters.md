---
title: 設定ファイルのパラメーター
description: 設定ファイルの beforeSuite / beforeTest フックでテストにパラメーターを渡す
category: 高度な編集
order: 5044
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/parameters/configuration-file-parameters.htm'
keywords:
  - Testim
  - 設定ファイル
  - パラメーター
  - beforeSuite
  - beforeTest
  - config file
  - フック
  - テストデータ
---

設定ファイルの beforeSuite / beforeTest フックでテストにパラメーターを渡す

[_設定ファイル_](/docs/running-tests/configuration-file-run-hooks) は、テスト／スイート実行に必要なパラメーターを定義する共通 JS です。単一テスト／全テストの前後に実行されるフックで、バックエンドの準備やパラメーター定義を行えます。**設定ファイル**を使うと、CLI 実行時にパラメーターを各テストへ渡せます。

## パラメーターのスコープ

定義したパラメーターは、単一の実行（ラン）に含まれるすべてのテストに適用されます。

## 設定ファイルでの定義

[設定ファイル](/docs/running-tests/configuration-file-run-hooks) の `beforeSuite` / `beforeTest` の戻り値で、スイート／テスト単位のパラメーターを定義できます。例：

```javascript
exports.config = {
  .....
  .....

  beforeSuite: function (suite) {
    console.log("beforeSuite", suite);

    return {
      "username": "David",
      "password": 123
    }
  },

  beforeTest: function (test) {
    console.log("beforeTest", test);

    return {
      "username": "David",
      "password": 123
    }
  }

  .....
  .....
};
```

## テストレベル: `overrideTestData` の追加

`return` セクションに `overrideTestData` を追加すると、テスト名ごとにデータを割り当てられます。実行内でテストごとに異なる値を指定できます。

**テストごとのデータを追加するには:**

1. 設定ファイルを作成／編集します。
2. `beforeSuite` の戻り値に `overrideTestData` を追加し、テスト名とデータセット（JSON）を記述します。他の設定はそのまま保持します。例：

```javascript
beforeSuite: function () {
    return {
       overrideTestData: {
          "Test 1": {user: "dave", password : "123"},
          "Test 2": {name: "ryan"}
        }
    }
} //add comma here if there are more functions after beforeSuite
```

:::note
"Test 1" と "Test 2" はテスト名です。
:::

同じ例で、最初のテストに 2 つのデータセットを与える場合：

```javascript
beforeSuite: function () {
    return {
       overrideTestData: {
          "Test 1": [{user: "michelle", password : "belle"},
                     {user: "paul", password : "walrus"}]
          "Test 2": {name: "john"}
        }
    }
} //add comma here if there are more functions after beforeSuite
```

後続のデータセットで一部のパラメーターが欠けている場合（例: 2 つ目に `password` が無い）、前のデータセットの値が引き継がれます。

## 実行レベル: `return` で一括指定

設定フック（`beforeSuite` / `beforeTest`）の `return` に値を置くと、実行に含まれる全テストで同一データが使われます。

**実行レベルで指定するには:**

1. 設定ファイルを作成／編集します。
2. `beforeSuite` または `beforeTest` の `return` にパラメーターと値を記述します。

例（beforeSuite に追加）：

```javascript javascript
exports.config = {
  beforeSuite: function (suite) {
    console.log('beforeSuite', suite);
    return {
      username: 'David',
      password: 123,
    };
  },
};
```

例（beforeTest に追加）：

```javascript javasc
exports.config = {
  .....
  .....

  beforeTest: function (test) {
    console.log("beforeTest", test);

    return {
      "username": "David",
      "password": 123
    }
  }

  .....
  .....
};
```

## グローバルエクスポートパラメーター

`afterSuite` では、その実行でエクスポートされたグローバルパラメーターを参照できます。構文: `suite.exportsGlobal.<param_name>`

## CLI での指定

設定ファイルは [Testim CLI](/docs/running-tests/the-command-line-cli) の **-c** 引数で指定します。

```shell
testim -c "testimConfig.js"
```

以降は、[ステッププロパティパネルのパラメーター](/docs/advanced-editing/parameters/parameters-in-custom-javascript-steps) として各テストから参照できます。
