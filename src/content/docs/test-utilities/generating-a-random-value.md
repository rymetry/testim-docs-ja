---
title: ランダム値の生成
description: 動的データテスト用に乱数を生成するステップの作成方法を学びます。毎回異なるランダム文字列を入力してテストカバレッジを拡張します。
category: テスト編集
order: 4012
updated: '2026-03-17'
sourceUrl: 'https://help.testim.io/docs/generating-a-random-value'
keywords:
  - ランダム値生成
  - Generate random value
  - 動的データテスト
  - テキスト入力
  - 変数スコープ
  - パラメーター
  - データカバレッジ
  - ランダム文字列
  - テストユーティリティ
  - Set textステップ
---

動的データテスト用に乱数（ランダム値）を生成するステップの作成

テキスト入力用の **Set text** ステップを含むテストを記録した後、そのステップの入力に毎回異なるランダム文字列を使用するよう、テスト構成を編集できます。ランダム文字列は **Generate random value** ステップで生成され、変数に格納されます（このステップは **Set text** ステップの直前に挿入します）。その後、**Set text** ステップで、**Generate random value** ステップで作成した変数を参照するように編集します。\
ランダムなデータを生成してテストできるようにすることで、追加のテストを作成せずにカバレッジを拡張し、仕様内での失敗ケースの発見、データセットの分散、同じデータを繰り返し使ってしまうことの回避が可能になります。

**「Generate random value」ステップで乱数を生成するには:**

1. ステップを追加したい位置の **>（矢印）** にカーソルを合わせます。

![3849](/images/test-utilities/generating-a-random-value/4924b93-Testim_223a.png)

   アクションのオプションが表示されます。

![アクションオプションメニュー](/images/test-utilities/generating-a-random-value/077856e-Testim_224a_r.png)

2. **"M"**（Testim の事前定義ステップ）をクリックします。\
   **Predefined steps** メニューが開きます。

![事前定義ステップメニュー](/images/test-utilities/generating-a-random-value/509a4e6-Testim_034_r.png)

3. **Actions** をクリックします。\
   Actions メニューが展開されます。

![Actionsメニュー](/images/test-utilities/generating-a-random-value/987804d-Testim_079_r.png)

4. メニューをスクロールし **Generate random value** を選択します。

:::info
代替手順: メニュー上部の検索ボックスで **Generate random value** を検索しても構いません。
:::

「Generate random value」ステップが **Editor** に追加されます。\
5\. 作成したステップにカーソルを合わせ、**Show Properties**アイコンをクリックします。

![3848](/images/test-utilities/generating-a-random-value/a6856ec-Testim_225a.png)

   右側に **Properties** パネルが表示されます。

![200](/images/test-utilities/generating-a-random-value/caec929-Testim_226_r.png)

6. 以下の説明に従ってプロパティを設定します。

* **Description** – ステップの説明。（既定値 = *Generate Random Value*）
* **Variable name** – ランダムデータを格納する変数名。（既定値 = *randomValue*）
* **String type** – 乱数を構成する文字の種類：
  * **Letters Only**: 大文字・小文字の英字のみを使用します。
  * **Numbers Only**: 数字のみを使用します。
  * **Mixed**: 数字と大文字・小文字の英字を混在させます。*既定値*
* **Length** – 生成する文字数。（最大 = *256*、既定値 = *12*）
* **Add prefix** – 生成した文字列の先頭に接頭辞を追加します。接頭辞には、文字列（シングルまたはダブルクォートで囲む）、既存の変数、またはそれらの組み合わせ（プラス記号で連結）を使用できます。
* **Add suffix** – 生成した文字列の末尾に接尾辞を追加します。構成は **Add prefix** と同様です。
* **Variable scope** – 変数を受け渡しできるスコープ：
  * **Local**: 同一スコープ内のステップ間でパラメーターを受け渡しできます。
  * **Test**: 同一テスト内のステップやグループ間で受け渡しできます。*既定値*
  * **Suite**: 同一テストスイート内のテスト間で受け渡しできます。
* **When this step fails** – ステップが失敗した場合の動作を指定します。
* **When to run step** – ステップの実行条件を指定します。詳細は [Conditions](/docs/conditions) を参照してください。
* **Override timeout** – Testim がテストステップの失敗と見なすまでの規定待機時間を上書きし、別の時間（ミリ秒）を指定できます。

テストを実行すると、生成されたランダム値（任意のプレフィックス／サフィックスを含む）が指定した変数に格納されます。

**「Set text」ステップでランダム文字列を入力するよう変更するには:**

1. 変更したい **Set text** ステップにカーソルを合わせ、**Show Properties**アイコンをクリックします。

![3849](/images/test-utilities/generating-a-random-value/4a5bd98-Testim_227a.png)

   右側に **Properties** パネルが表示されます。

![200](/images/test-utilities/generating-a-random-value/7a35bba-Testim_228_r.png)

2. **Text to assign** フィールドに、**Generate random value** ステップで使用した **Variable Name** を入力します。

:::info
**Text to assign** フィールドには、文字列（シングルまたはダブルクォートで囲む）、JavaScript 式、既存の変数、またはその組み合わせ（プラス記号で連結）を指定できます。\
変数や JavaScript 式はクォートで囲まないでください。
:::

テスト実行時、画面に入力されるテキストには **Generate random value** ステップで作成した変数に格納されたランダム値が含まれます。

## 自分で試してみましょう

[こちら](https://app.testim.io/#/project/GYXR2qZC/branch/master/test/uLiH9r9jPk) をクリックすると、複数の **Generate random value** ステップを含むサンプルテストが開きます。テストを実行し、設定の調整を試してみてください。

![894](/images/test-utilities/generating-a-random-value/0c1762d-Jan-31-2021_06-20-28.gif)
