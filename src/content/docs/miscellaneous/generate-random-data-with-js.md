---
title: JS でランダムデータを生成
description: ランダムデータ（ユーザー名、パスワード、メールなど）をテキストフィールドに動的に割り当てる方法を学ぶ
category: ガイド
order: 19003
updated: '2025-11-02'
sourceUrl: 'https://help.testim.io/docs/generate-random-data-with-js'
keywords:
  - ランダムデータ生成
  - JavaScript
  - パラメーター化
  - 動的データ
  - テストデータ生成
---

ランダムデータ（ユーザー名、パスワード、メールなど）をテキストフィールドに動的に割り当てる方法を学ぶ

Testim のすべてのステップはパラメーター化できます。これは、set-text ステップが記録されたリテラル値（例: "[john@yourapp.io](mailto:john@yourapp.io)", "passw0rd!"）だけでなく、任意の JS 式を持つことができることを意味します。

![set-text ステップで JS 式を使用してパラメーター化する方法を示す Testim エディターの画面](/images/miscellaneous/generate-random-data-with-js/0ad0468-Untitled.png)

## ステップにランダムデータを割り当てる方法は？

記録された値を JS 式で置き換えるだけです。以下にいくつかの例を示します:

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

### パラメーターとして定義した場合（変数の割り当て）

[パラメーター](/docs/parameters)として定義した場合、変数を割り当てることもできます:

```javascript
myVar + "sdf"
```

**ヒント:** 同じランダム文字列を複数回使用する必要がある場合（例: ランダムメールが後で別のページに表示されることを検証する）は、変数の使用を検討してください。テスト内で変数を作成する（例: "myVar"）には:

* 共有ステップ（グループ/カスタム JS）にパラメーターを渡す
* カスタム JS ステップから含まれるグループに値をエクスポートする。例えば、JS ステップに exports.myVar = "testim"; を追加します。これにより、親（含まれる）グループのスコープ内に"myVar"という名前の変数が作成されます。[エクスポートパラメータードキュメント](/docs/exports-parameters)の例を参照できます（このリンクをたどって、exports.bestTestingTool = "Testim"を検索してください）。

## 詳細を学ぶ

* [パラメーター](/docs/parameters)
* [データ駆動テスト](/docs/data-driven-testing)
