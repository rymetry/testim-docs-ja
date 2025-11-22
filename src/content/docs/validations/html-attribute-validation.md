---
title: 'HTML属性の検証（Web）'
description: 'Web要素のHTML属性値を検証するステップ。id、class、data属性などの値が期待通りであることを確認し、動的なUI要素の状態を検証します。'
category: '検証'
order: 10
updated: '2025-09-14'
sourceUrl: 'https://help.testim.io/docs/html-attribute-validation'
keywords:
  - HTML属性
  - 属性検証
  - DOM
  - Web
  - 要素属性
  - タグ検証
  - HTML
  - UI検証
  - データ属性
  - Testim
---
アプリ内の任意のHTML属性を検証する

HTML属性検証では、要素の任意のHTML属性の値を検証できます（例：*href*、*src*、*alt*、*title* など）。また、以下に説明する通り「disabled」属性の検証も可能です。

## Adding a Validate HTML attribute step

:fa-arrow-right: **To add a Validate HTML attribute step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the validation.

![ステップ追加矢印](/images/validations/html-attribute-validation/a0c5a27-Testim_233a.png)

アクションのオプションが表示されます。

![CLI](/images/validations/html-attribute-validation/9ad04c9-Testim_234a_r.png)

2. **Toggle breakpoint** ボタンをクリックします。

![CLI](/images/validations/html-attribute-validation/3040109-Testim_235_r.png)

3. **Run test** ボタンをクリックし、ブレークポイントまでテストを実行します。

![ステップ追加矢印](/images/validations/html-attribute-validation/c3f0d75-Testim_236a.png)

4. 再び :fa-caret-right: **（矢印記号）** にカーソルを合わせ、"**M**"（Testim定義済みステップ）をクリックします。\
   **Predefined steps** メニューが開きます。

![ステップ追加矢印](/images/validations/html-attribute-validation/0bd37d9-Testim_237_r.png)

5. **Validations** をクリックします。\
   **Validations** メニューが展開されます。

![検証](/images/validations/html-attribute-validation/e3e4f2e-Testim_238_r.png)

6. メニューをスクロールし **Validate HTML attribute** を選択します。

:::info
メニュー上部の検索ボックスで **Validate HTML attribute** を検索することもできます。
:::

7. **AUT** ウィンドウで、HTML属性を検証したい対象要素を特定し、クリックして選択します。\
   **HTML Attribute Validation** フォームが表示されます。

![検証](/images/validations/html-attribute-validation/4a3f8b9-Testim_239_r.png)

8. **Attribute name** フィールドに、検証したい有効なHTML属性を入力します（例：*href*、*src*、*alt*、*title* など）。
9. **Expected value** フィールドに、その属性で検証したい値を入力します（例：*[https://www.testim.io](https://www.testim.io)*）。

> 📘
>
> Expected value では正規表現も使用できます。例えば、https で始まる 'href' を検証する場合は次の正規表現を使用します：/^https/

10. **OK** をクリックします。\
    **Editor** に「Validate HTML attribute」ステップが追加され、ステップ内に選択要素のサムネイルが表示されます。
11. 検証ステップの後にある **Toggle Breakpoint** ボタンをクリックしてブレークポイントを削除します。

### 「disabled」属性の検証

「disabled」HTML属性を検証することも可能です。

 :fa-arrow-right: **disabled 属性を検証するには:**

1. 上記の手順1～6を実行します。

2. **AUT** ウィンドウで、「disabled」HTML属性を検証したい対象要素を特定し、クリックして選択します。\
   **HTML Attribute Validation** フォームが表示されます。

3. **Attribute name** に `disabled` を入力します。

4. **Expected value** には値を入力しません。  
   ![HTML](/images/validations/html-attribute-validation/a78b8f5-image.png)

5. **OK** をクリックします。\
   **Editor** に「Validate HTML attribute」ステップが追加され、ステップ内に選択要素のサムネイルが表示されます。
   ![検証](/images/validations/html-attribute-validation/a1bbe4a-image_1.png)

6. Click on the **Toggle Breakpoint** button after the validation step to remove the breakpoint.

## Validate HTML attribute ステップの修正

選択要素を変更したい場合、ステップを削除して録り直す必要はありません。別の要素に再割り当てできます。あるいは、要素を選び直さずに **Attribute name** / **Expected value** の値を編集することも可能です。

:fa-arrow-right: **検証ステップで選択要素を再割り当てするには:**

1. 要素を再割り当てしたいステップの左側にカーソルを合わせ、**Toggle breakpoint** ボタンをクリックします。
2. **Run test** ボタンをクリックし、ブレークポイントまでテストを実行します。
3. 要素を再割り当てしたいステップにカーソルを合わせ、**Show Properties** (:fa-cog:) アイコンをクリックします。

![CLI](/images/validations/html-attribute-validation/330255f-Testim_240a.png)

右側に **Properties** パネルが表示されます。

4. **Target element** サムネイルにカーソルを合わせてオプションを表示し、**Reassign** をクリックします。

![CLI](/images/validations/html-attribute-validation/1272545-Testim_241a_r.png)

5. **AUT** ウィンドウで、新しく選択したい要素を特定し、クリックします。\
   選択された要素が **Properties** パネルの **Target element** ボックスに表示されます。
6. **Properties** パネルの **Attribute name** フィールドに、新しい要素の属性名を入力します。
7. **Properties** パネルの **Expected value** フィールドに、新しい属性の期待値を入力します。

> 📘
>
> **Properties** パネルで **Attribute name** と **Expected value** の値を変更する際は、必ずシングルクォートで囲んでください。例：'href' と '[https://www.testim.io'](https://www.testim.io')

8. 要素を再割り当てしたステップの左側にある **Toggle Breakpoint** ボタンをクリックしてブレークポイントを削除します。

:fa-arrow-right: ***元の***要素のプロパティを変更するには:**

1. 要素を再割り当てしたいステップにカーソルを合わせ、**Show Properties** (:fa-cog:) アイコンをクリックします。

![CLI](/images/validations/html-attribute-validation/8f90779-Testim_242a.png)

右側に **Properties** パネルが表示されます。

![属性](/images/validations/html-attribute-validation/aa817ce-Testim_241_r.png)

2. **Properties** パネルの **Attribute name** フィールドに、要素の新しい属性名を入力します。
3. **Properties** パネルの **Expected value** フィールドに、属性の新しい期待値を入力します。

> 📘
>
> **Properties** パネルで **Attribute name** と **Expected value** の値を変更する際は、必ずシングルクォートで囲んでください。例：'href' と '[https://www.testim.io'](https://www.testim.io')
