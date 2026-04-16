---
title: パラメーターの上書きルール
description: パラメーター使用時に発生する上書き（オーバーライド）ルールの整理
category: 高度な編集
order: 5046
updated: '2025-09-22'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/parameters/parameter-override-rules.htm'
keywords:
  - Testim
  - パラメーター
  - 上書きルール
  - スコープ
  - 設定ファイル
  - オーバーライド
  - 優先順位
  - CLI
---

[Testim.io](http://testim.io) でパラメーターを使う方法はいくつかあります。例: [データ駆動テスト](/docs/advanced-editing/data-driven-testing)、[グループ](/docs/editing-tests/groups)、[Exports Parameters](/docs/advanced-editing/parameters/exports-parameters)、[設定ファイルと実行フック](/docs/running-tests/configuration-file-run-hooks)、[Params file](/docs/advanced-editing/parameters)。それぞれ適用タイミングや目的が異なり、上書きの優先関係が発生します。

## 上書きの基本

多くのプログラミング言語と同様、同名の値は後から代入したものが有効になります。Testim でも同様に上書きが発生します。

#### テスト開始前

- [Config-file のパラメーター](/docs/running-tests/configuration-file-run-hooks) は [params-file のパラメーター](/docs/advanced-editing/parameters/json-parameters-file-parameters) を上書きします。設定ファイル内では `beforeTest` が `beforeSuite` を上書きします。
- [Params-file のパラメーター](/docs/running-tests/configuration-file-run-hooks) は [既定のテストデータ／ランデータ](/docs/advanced-editing/data-driven-testing) を上書きします。

Note: テストに渡されるすべてのパラメーターは**ローカルレベル**の可視性（テスト全体を大きな 1 つのグループとみなす）を持ちます。

#### 実行中

可視性スコープは次の 3 種類です。

- Local — 値はグループ内に存在し、グループを抜けるとアクセスできません
- Test — テストの間有効です
- Test Suite — 複数テスト実行をまたいで受け渡されます

#### 上書きの優先

スコープが狭い（よりローカルな）値ほど優先されます。ローカルが最強で、必ずローカルが使われます。例：

```javascript
exports.x = "local"
exportsTest.x = "test"
exportsGlobal.x = "global"
...
console.log(x); // prints "local"
```

:::note{title="スコープの考え方"}
グループで作成したパラメーターは「ローカルスコープ」です。同スコープまたはより狭いスコープの同名パラメーターで上書きできます。
:::

#### 用途の整理

**データ駆動テストのパラメーター:**

既定値の定義に使います（設定ファイルやフックで上書きされ得る）。配列（オブジェクトの配列）を与えると同一テストを複数回実行できます。

**パラメーターファイル:**

テスト固有ではなく、すべてのテストへ共通値（例: 共通認証情報）を渡します。

**設定ファイル:**

動的にパラメーター群を読み込みます。Node.js で実行されるカスタム JS が使えるため、DB や CSV など任意のソースから読み込めます。サンプルは[こちら](/docs/advanced-editing/data-driven-testing)。Notes:

1. `beforeTest` と `beforeSuite` は配列（複数データセット）の返却をサポートしません。配列を返すとオブジェクトに準じて扱われます。
2. `beforeSuite` と `overrideTestData` の両方で同名パラメーターを指定した場合は `beforeSuite` が優先されます。

`beforeSuite` でテストデータを上書きする例：

```javascript
beforeSuite() {
  return {
       y: 5,
       overrideTestData: {
           "testname1": [{x: 6}, {x:7}] , // runs testname1 twice
           "testname2": {y:7}          // y will be 5 because the beforeSuite object wins
    }
}
```
