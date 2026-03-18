---
title: 設定ファイルを使用したデータ駆動テストの構成
description: 設定ファイルを使用してデータ駆動テストを構成する方法を説明します。
category: 高度な編集
order: 5028
updated: '2025-09-15'
sourceUrl: >-
  https://help.testim.io/docs/configuring-data-driven-tests-using-the-config-file
keywords:
  - testim
  - configuring-data-driven-tests-using-the-config-file
  - data-driven-testing
  - 設定ファイル
  - データ駆動テスト
  - Configuration File
  - 複数データセット
  - beforeSuite
  - overrideTestData
  - テストデータ管理
---

[設定ファイル](/docs/configuration-file-run-hooks)を編集し、設定ファイルを使用するフラグを追加して CLI でテストを実行することで、1 つまたは複数のテストにテストデータを渡すことができます。設定ファイルは、設定ファイルフックを実行しながら、テストを実行するために必要なすべてのパラメーターを含む一般的な JS ファイルです。これらのフック（例:`beforeSuite`）の 1 つを通じて、実行全体または特定のテストにテストデータを追加できます。このデータセットは、Visual Editor で定義されたデータセットを上書きできます。

:::note
設定ファイルのコードは、Testim グリッド上でテストを実行する CLI によって処理されるため、ブラウザではなく Node でサポートされている JS を実行できます。
:::

設定ファイルオプションは、データが使用されるスコープに対して広範な汎用性と細かい制御を提供します:

## 実行レベル - `return`セクションへのパラメーター配置

設定フック（`beforeSuite`フックまたは`beforeTest`フック）内の`return`セクションの後にデータパラメーターを配置すると、実行に含まれるすべてのテストで同じデータが実行されます。

**実行レベルで実行する設定ファイルにテストデータを追加するには:**

1. 設定ファイルを作成するか、既存のファイルを編集します。
2. 設定フック（`beforeSuite`フックまたは`beforeTest`フック）内の`return`セクションの後にパラメーターとその値を追加します。

以下は、`beforeSuite`フックに追加されたテストデータの例です。このテストデータは、実行に含まれるすべてのテストで同じになります:

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

以下は、`beforeTest`フックに追加されたテストデータの例です。このテストデータは、実行に含まれるすべてのテストで同じになります:

```javascript
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

<br />

## テストレベル - `overrideTestData`オブジェクトの追加

`return`セクション内に`overrideTestData`オブジェクトを追加できます。これにより、テスト名で指定されたテストにデータを追加でき、同じ実行内で 1 つのテストに 1 つのパラメーター、別のテストに別のパラメーターを指定することができます。

**テストレベルで実行する設定ファイルにテストデータを追加するには:**

1. 設定ファイルを作成するか、既存のファイルを編集します。
2. `beforeSuite`フック下の`overrideTestData`にテスト名とデータセット（データセットは JSON 形式である必要があります）を追加します。設定ファイルの他のすべての部分は残す/含める必要があります。\
   以下は、設定ファイルの beforeSuite フックの例です:

```javascript
beforeSuite: function () {
    return {
       overrideTestData: {                 
          "Test 1": {user: "dave", password : "123"},
          "Test 2": {name: "ryan"}                    
        }
    }    
} //beforeSuiteの後に他の関数がある場合は、ここにカンマを追加します
```

:::note
"Test 1"と"Test 2"はテストの名前です。
:::

以下は、最初のテストに 2 つのデータセットがある同じ例です:

```javascript
beforeSuite: function () {
    return {
       overrideTestData: {                 
          "Test 1": [{user: "michelle", password : "belle"},
                     {user: "paul", password : "walrus"}]
          "Test 2": {name: "john"}                    
        }
    }    
} //beforeSuiteの後に他の関数がある場合は、ここにカンマを追加します
```

後続のデータセットからデータセットパラメーターの 1 つが欠落している場合、例えば、2 番目のデータセットにパスワードが含まれていない場合（つまり`password: walrus`が含まれていない場合）、Testim は最初のデータセットからのパラメーターデータ（つまり`belle`）を使用します。

**設定ファイルを使用してテストを実行するには:**\
設定ファイルを作成した後、必要に応じてファイルへのパスを指定しながら、設定ファイルをコマンドライン（CLI）ランナーにパラメーターとして渡します。[Testim CLI](/docs/the-command-line-cli)からテストを実行すると、テストは順番に複数回実行され、毎回異なるデータセットで実行されます。

```shell
testim -c "testimConfig.js"
```

テストに既にデータが含まれている場合（例:Visual Editor で指定されたデータ）、設定ファイルに特定のテストを指定するオーバーライド関数が含まれている場合、このデータは元のテストデータを上書きします。
