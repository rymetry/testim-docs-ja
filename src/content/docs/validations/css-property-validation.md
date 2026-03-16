---
title: CSS プロパティの検証
description: 要素のCSSプロパティ値を検証するステップ。color、font-size、displayなどのスタイル属性を確認し、UIの見た目や表示状態を検証します。
category: 高度な編集
order: 5019
updated: '2026-03-17'
sourceUrl: 'https://help.testim.io/docs/css-property-validation'
keywords:
  - CSSプロパティ
  - CSS検証
  - スタイル検証
  - UI検証
  - ビジュアル
  - レイアウト
  - 見た目
  - Testim
  - CSS
  - スタイルシート
---

要素の任意の CSS プロパティを検証する

CSS プロパティ検証では、色・背景色・フォントなど任意の CSS プロパティを検証できます。

## Validate CSS property ステップの追加

**Validate CSS property を追加するには:**

1. 検証を追加したい位置の **（矢印記号）** にカーソルを合わせます。

![ステップ追加矢印](/images/validations/css-property-validation/cd930ed-Testim_142a.png)

アクションのオプションが表示されます。

![CLI](/images/validations/css-property-validation/ed11e56-Testim_143a_r.png)

2. **Toggle Breakpoint** ボタンをクリックします。

![CLI](/images/validations/css-property-validation/c4168b0-Testim_144_r.png)

3. **Play Scenario** ボタンをクリックして、ブレークポイントまでテストを実行します。

![ステップ追加矢印](/images/validations/css-property-validation/87450ab-Testim_145a.png)

4. もう一度 **（矢印記号）** にカーソルを合わせ、**"M"**（Testim の事前定義ステップ）をクリックします。\
   **Predefined steps** メニューが開きます。

![ステップ追加矢印](/images/validations/css-property-validation/b552e53-Testim_134_r.png)

5. **Validations** をクリックします。\
   **Validations** メニューが展開されます。

![検証](/images/validations/css-property-validation/dc8c30a-Testim_135_r.png)

6. メニューをスクロールして **Validate CSS property** を選択します。

:::note
メニュー上部の検索ボックスで検索することもできます。
:::

7. **AUT** ウィンドウで、CSS プロパティを検証したい関連要素を特定し、クリックして選択します。\
   **CSS Property Validation** フォームが表示されます。

![検証](/images/validations/css-property-validation/1399203-cssvalidation2.png)

8. **Property name** フィールドに、要素の有効な CSS プロパティを入力します。
9. **Expected value** フィールドに、プロパティに対して検証したい値を入力します。値は次のいずれかになります:
   1. **ハードコードされた値** - ハードコードされた値を使用するには、値を引用符で囲みます（例: 'x'）
   2. **パラメーター値** - パラメーターを使用するには、定義されたパラメーターの名前を引用符なしで入力します。
10. **OK** をクリックします。\
    ステップが作成され、選択した要素のサムネイルがステップに表示されます。

![検証](/images/validations/css-property-validation/efe9aec-Testim_147.png)

11. 検証ステップの後の **Toggle Breakpoint** ボタンをクリックして、ブレークポイントを削除します。

## Validate CSS property ステップの変更

選択した要素を変更したい場合、ステップを削除して再記録する必要はありません。代わりに、別の要素に再割り当てできます。さらに、新しい要素を選択せずに、選択した元の要素のプロパティ名や期待値を変更することもできます。\
**検証ステップで選択した要素を再割り当てするには:**

1. 要素を再割り当てしたいステップの左側の位置にカーソルを合わせ、**Toggle Breakpoint** ボタンをクリックします。
2. **Play Scenario** ボタンをクリックして、ブレークポイントまでテストを実行します。
3. 要素を再割り当てしたいステップにカーソルを合わせ、**Show Properties**  アイコンをクリックします。

![CLI](/images/validations/css-property-validation/00517ed-Testim_148a.png)

右側に **Properties** パネルが表示されます。

4. Hover over the **Target element** thumbnail to show options, and click **Reassign**.
右側に **Properties** パネルが表示されます。

4. **Target element** のサムネイルにカーソルを合わせてオプションを表示し、**Reassign** をクリックします。

![CLI](/images/validations/css-property-validation/d15fcbd-Testim_150a_r.png)

5. **AUT** ウィンドウで、選択したい新しい要素を特定し、クリックします。\
   選択した要素が **Properties** パネルの **Target element** ボックスに表示されます。
6. **Properties** パネルの **Property name** フィールドに、新しい要素のプロパティ名を入力します。
7. **Properties** パネルの **Expected value** フィールドに、新しいプロパティの期待値を入力します。

:::note
**Properties** パネルで **Property name** と **Expected value** の値を変更する際は、それらがシングルクォートで囲まれていることを確認してください。例: 'background' と '#ffea64'。
:::

8. 要素を再割り当てしたステップの左側にある同じ **Toggle Breakpoint** ボタンをクリックして、ブレークポイントを削除します。
9. 新しい要素を選択せずに、選択した*元の*要素のプロパティ名や期待値を変更したい場合は、上記の手順3、6、7に従ってください。
