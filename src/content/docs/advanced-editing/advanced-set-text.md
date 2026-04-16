---
title: 動的なテキスト入力
description: JavaScript 式やパラメーターを組み合わせて Set text ステップに動的な値を設定する方法を学びます。
category: 高度な編集
order: 5001
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/advanced-set-text.htm'
keywords:
  - 動的テキスト
  - Set text ステップ
  - JavaScript 式
  - パラメーター
  - テキスト入力
  - 動的文字列
  - データ駆動テスト
  - 変数
  - テストユーティリティ
  - 文字列連結
---

**Set text** ステップ（テキスト入力）のあるテストを記録した後、記録時に入力した固定テキストを動的文字列に置き換えられます。動的文字列には JavaScript 式や、あらかじめ作成済みのパラメーターを含めることができます。より高度な活用例については [Data-driven testing](/docs/advanced-editing/data-driven-testing) を参照してください。

## JavaScript 式でテキストを設定する

**JavaScript 式でテキストを設定するには:**

1. 変更したい **Set text** ステップ（例: Set username）にカーソルを合わせ、**Show Properties**（歯車アイコン）をクリックします。

![3851](/images/test-utilities/advanced-set-text/29a0765-Testim_229a.png)

右側に **Properties** パネルが表示されます。

![200](/images/test-utilities/advanced-set-text/dab7248-Testim_230_r.png)

2. **Text to assign** フィールドの固定テキストを JavaScript 式に置き換えます。\
   例として、一意なユーザー名を設定するには `'user' + Date.now()` と指定します。この式は、文字列 `'user'` にエポック（1970 年 1 月 1 日 0 時 0 分 0 秒 UTC）からの経過ミリ秒を連結した値を返します。\
   **Text to assign** には、文字列（シングル／ダブルクォート）、JavaScript 式、既存の変数、またはそれらを `+` 記号でつないだ組み合わせを指定できます。

:::info
変数や JavaScript 式はクォートで囲まないでください。
:::

テスト実行時、画面の入力欄には式の評価結果（例: `user1619013809723`）が入力されます。

![1920](/images/test-utilities/advanced-set-text/b3181bc-set_text.gif)

## パラメーターでテキストを設定する

パラメーターをテキストとして使用するには、事前に別ステップや別テストで作成されている必要があります。詳細は [Parameters](/docs/advanced-editing/parameters) を参照してください。
**パラメーターでテキストを設定するには:**

1. 変更したい **Set text** ステップ（例: Set username）にカーソルを合わせ、**Show Properties**（歯車アイコン）をクリックします。

![3838](/images/test-utilities/advanced-set-text/f4b65c5-Testim_231a.png)

右側に **Properties** パネルが表示されます。

![200](/images/test-utilities/advanced-set-text/6dc9ca3-Testim_232_r.png)

2. **Text to assign** フィールドの固定テキストを、作成済みのパラメーターに置き換えます。\
   **Text to assign** には、文字列（シングルまたはダブルクォート）、JavaScript 式、既存の変数、またはそれらの組み合わせ（プラス記号で連結）を指定できます。

:::info
変数や JavaScript 式はクォートで囲まないでください。
:::

テスト実行時、画面の入力欄には指定したパラメーターの値が入力されます。
