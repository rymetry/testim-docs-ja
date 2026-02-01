---
title: 'JSでランダムデータを生成'
description: '原文: https://help.testim.io/docs/generate-random-data-with-js'
category: 'ガイド'
order: 19003
updated: '2025-11-02'
keywords:
  - ランダムデータ生成
  - JavaScript
  - パラメータ化
  - 動的データ
  - テストデータ生成
---

ランダムデータ（ユーザー名、パスワード、メールなど）をテキストフィールドに動的に割り当てる方法を学ぶ

Testimのすべてのステップはパラメータ化できます。これは、set-textステップが記録されたリテラル値（例: "[john@yourapp.io](mailto:john@yourapp.io)", "passw0rd!"）だけでなく、任意のJS式を持つことができることを意味します。

![set-textステップでJS式を使用してパラメータ化する方法を示すTestimエディターの画面](/images/miscellaneous/generate-random-data-with-js/0ad0468-Untitled.png)

## ステップにランダムデータを割り当てる方法は？

記録された値をJS式で置き換えるだけです。以下にいくつかの例を示します:\
### ランダムメール

```javascript
Math.round(Math.random()*100000)+"@email.com"
```

### ランダムパスワード

```javascript
Math.random().toString(36).slice(-8)
```

### その他のランダム値

```javascript
Date.now()+5
```

### パラメータとして定義した場合（変数の割り当て）

[パラメータ](/docs/parameters)として定義した場合、変数を割り当てることもできます:

```javascript
myVar + "sdf"
```

**ヒント:** 同じランダム文字列を複数回使用する必要がある場合（例: ランダムメールが後で別のページに表示されることを検証する）は、変数の使用を検討してください。テスト内で変数を作成する（例: "myVar"）には:

* 共有ステップ（グループ/カスタムJS）にパラメータを渡す
* カスタムJSステップから含まれるグループに値をエクスポートする。例えば、JSステップに exports.myVar = "testim"; を追加します。これにより、親（含まれる）グループのスコープ内に"myVar"という名前の変数が作成されます。[エクスポートパラメータドキュメント](/docs/exports-parameters)の例を参照できます（このリンクをたどって、exports.bestTestingTool = "Testim"を検索してください）。

## 詳細を学ぶ

* [パラメータ](/docs/parameters)
* [データ駆動テスト](/docs/data-driven-testing)
