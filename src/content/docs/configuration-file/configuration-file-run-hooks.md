---
title: 設定ファイル
description: >-
  Testim の CLI で使用する設定ファイル（config）で、プロジェクトやテスト実行のパラメータ、実行フック（before/after
  test・suite）を定義する方法を説明します。
category: テスト実行
order: 6011
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/configuration-file-run-hooks'
keywords:
  - 設定ファイル
  - config ファイル
  - run hooks
  - Before Suite
  - Before Test
  - After Test
  - After Suite
  - CLI 設定
  - Testim
  - 実行フック
---

設定ファイルについて

設定ファイルは、テストやテストスイートを実行するために必要な各種パラメータを含む共通のJSファイルです。単一テスト／全テストの前後でバックエンドのセットアップやパラメータ定義を行うための実行フックも含まれます。

設定ファイルでは、すべてのプロパティを ***config*** というJSONとしてエクスポートします。

以下は設定ファイルの例です。

```javascript
exports.config = {

    project: "<your project ID>",
    token: "<Your token>",
    
    // 実行したいラベルを指定します。
    // 指定したラベルが付いたすべてのテストが実行されます
    label: "sanity",
    
    // 使用するSeleniumグリッド
    grid: "<Your grid name>",
    
    // テストで定義されたベースURLを上書きし、別の環境で再実行します。
    baseUrl: 'http://staging.example.com',

    // =====
    // Hooks（フック）
    // =====
    // テスト実行の前後で処理を差し込むための複数のフックを提供します。
   
    // スイート開始前に実行されるフック
    beforeSuite: function (suite) {
        console.log("beforeSuite", suite);
    },
    
    // テスト開始前に実行される関数
    beforeTest: function (test) {
        console.log("beforeTest", test);
    },
    
    // テスト終了後に実行される関数
    afterTest: function (test) {
        console.log("afterTest", test);
    },
    
    // スイート終了後に実行されるフック
    afterSuite: function (suite) {
        console.log("afterSuite", suite);
    }
};
```

:::note
グリッド名の設定方法は [グリッド管理](/docs/grid-management) を参照してください。
:::

# 構文

設定ファイルには次の要素が含まれます。

- CLIフラグ: テストの実行方法を指示します。設定ファイルで使えるフラグは、[CLIフラグ](/docs/the-command-line-cli)に記載のプロパティをすべてサポートします。\
  プロパティ名の書式はCLIとは少し異なり、ハイフン（-）をキャメルケースに置き換えます。\
  例: `--base-url` → `baseUrl`

:::note
ひとつのパラメータに複数値を渡したい場合は配列を使用します。\
例: `label: ["a", "b"]`
:::

- 設定フック（Config Hooks）: アプリのバックエンド準備や、単一テスト／全テストの前後でパラメータを定義するためのフックです（詳細は後述）。

# 設定フック（Config Hooks）

設定ファイルには、単一テスト／全テストの前後でアプリのバックエンドをセットアップしたりパラメータを定義できる実行フックが含まれます。設定可能なフックは次の通りです。

- Before Test: テストの前に実行
- After Test: テストの後に実行
- Before Suite: スイートの前に実行
- After Suite: スイートの後に実行

フックの詳細は [Hooks](/docs/hooks#creating-hooks-via-the-test-configuration) を参照してください。

以下は `beforeSuite` フックにテストデータを追加する例です。実行に含まれるすべてのテストで同じデータが使われます。

```javascript
exports.config = {
 
  beforeSuite: function (suite) {
    console.log("beforeSuite", suite);
    return {
      "username": "David",
      "password": 123
    }
  },
  };
```

## 設定フックの事前定義プロパティ

各種設定フックには、テスト／スイートに関する追加情報を取得するための事前定義プロパティが用意されています。例えば、Before Suite フックで `projectId` の値を出力できます。詳細は[設定ファイルフックの事前定義プロパティ](/docs/predefined-properties-in-config-file-hooks)を参照してください。

### beforeTest フックで実行時のラベル一覧を取得する

設定ファイルの `beforeTest` フック内で、テストに定義されたラベル一覧でパラメータを埋めることができます。\
次の例では `labels` というパラメータを定義しています。このパラメータには事前定義パラメータ `allLabels` を用いて、そのテストに付与されたラベルの一覧が入ります。以降、パラメータが使える場所で参照できます。例えば **カスタムステップ** で、ラベルに `Games` が含まれる場合はステップをスキップする、といったコードを記述できます。

パラメータの利用については[設定ファイルのパラメータ](/docs/configuration-file-parameters)も参照してください。

<br />

```javascript
beforeTest: function(test) {
    return {
        labels: test.allLabels
    }
}
```

### beforeTest フックで base-url を更新する

設定ファイルの `beforeTest` フック内で、テストのベースURLを取得し、変数を任意の値に更新できます。\
次の例では、現在のベースURLを取得して、任意の文字列を付与したURLに更新しています。\
パラメータの利用については[設定ファイルのパラメータ](/docs/configuration-file-parameters)も参照してください。

```javascript
exports.config = {
    // Function to be executed before a test starts.
    async beforeTest(test) {
        const baseUrl = test.config.baseUrl; // Get the current test base URL.
        const randomAddress = await getRandomAddress();
        test.config.baseUrl = `${baseUrl}${randomAddress}`; // Update the test base URL using a manipulation on the existing base URL.
    }
};
```

## グローバルエクスポートパラメータ

afterSuite 関数内では、その実行でエクスポートされたグローバルパラメータを参照できます。\
構文: `suite.exportsGlobal.<param_name>`\
グローバルエクスポートの詳細は[パラメータのエクスポート](/docs/exports-parameters)を参照してください。

```javascript
exports.config = {
    afterSuite: function (suite) {
        console.log("Global export value:", suite.exportsGlobal.<param_name>);
    }
};
```

# 設定ファイルを使ってテストを実行する

1. 設定ファイルを作成します（例: `testimConfig.js`）。
2. [コマンドライン（CLI）](/docs/the-command-line-cli) にパラメータとして渡します。
3. 必要に応じて、ファイルへのパスを指定してください。

```shell
testim -c "testimConfig.js"
```

4. 設定ファイル内の値を一時的に上書きしたい場合は、CLIで明示的に指定します。

```shell
testim -c "testimConfig.js" --label "nightly"
```
