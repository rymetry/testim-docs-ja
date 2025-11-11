---
title: '要素が不可視であることの検証'
description: '原文: https://help.testim.io/docs/validate-element-not-visible'
category: '検証'
order: 3
updated: '2025-11-02'
keywords:
  - testim
  - validate-element-not-visible
  - validations
---
要素が不可視であることを検証する

Element not visible 検証では、要素がページ上で表示されていない（不可視）ことを確認できます。画面から要素が消えたこと、あるいは最初から表示されていないことを確かめる用途に適しています。

:::note
このステップは Web のみで利用可能です。
:::

## Validate element not visible ステップの追加

:fa-arrow-right: **Element Not Visible 検証を追加するには:**

1. 検証を追加したい位置の **>（矢印）** にカーソルを合わせます。

![](/images/validations/validate-element-not-visible/effce9f-Screen_Shot_2021-04-18_at_6.37.44.png "Screen Shot 2021-04-18 at 6.37.44.png")

   アクションのオプションが表示されます。

![](/images/validations/validate-element-not-visible/5357ef7-Testim_083a_r.png)

2. **Toggle Breakpoint** をクリックします。

![](/images/validations/validate-element-not-visible/065d541-Testim_085_r.png)

3. **Play Scenario** をクリックして、ブレークポイントまでテストを実行します。

![](/images/validations/validate-element-not-visible/a073c5b-Screen_Shot_2021-04-18_at_6.39.03.png "Screen Shot 2021-04-18 at 6.39.03.png")

4. もう一度同じ位置にカーソルを合わせ、**"M"**（Testim の事前定義ステップ）をクリックします。\
   Predefined steps メニューが開きます。

![](/images/validations/validate-element-not-visible/33395a4-Testim_034_r.png)

5. **Validations** をクリックします。\
   Validations セクションが展開されます。

![](/images/validations/validate-element-not-visible/3cb61d5-Testim_035_r.png)

6. メニューをスクロールして **Validate element not visible** を選択します。

:::info
メニュー上部の検索ボックスで **Validate element not visible** を検索することもできます。
:::

7. AUT ウィンドウで検証したい要素を特定し、クリックして選択します。\
   ステップが作成され、選択した要素のサムネイルがステップに表示されます。

![](/images/validations/validate-element-not-visible/5680a81-Testim_089.png "Testim 089.png")

8. 要素が不可視かどうかを確認する前に遅延を入れたい場合は、ステップにカーソルを合わせて **Show Properties**（:fa-cog:）をクリックします。

![](/images/validations/validate-element-not-visible/bf63c08-Screen_Shot_2021-04-18_at_6.40.55.png "Screen Shot 2021-04-18 at 6.40.55.png")

   右側に Properties パネルが表示されます。

9. **Pre-step delay (ms)** をオンにします。

![](/images/validations/validate-element-not-visible/73e40b0-Testim_011b_r.png)

10. 表示されたフィールドに遅延時間（ミリ秒）を入力します。

![](/images/validations/validate-element-not-visible/670a2b2-Testim_012a_r.png)

   テスト実行時、このステップに到達すると指定時間だけ待機してから次のステップに進みます。

11. 検証ステップの後ろにある **Toggle Breakpoint** をクリックしてブレークポイントを解除します。

## Validate element not visible ステップの修正

選択した要素を変更したい場合、ステップを削除して録り直す必要はありません。別の要素に再割り当てできます。

:fa-arrow-right: **Validate element not visible ステップで選択要素を再割り当てするには:**

1. 再割り当てしたいステップの左側の位置にカーソルを合わせ、**Toggle Breakpoint** をクリックします。
2. **Play Scenario** をクリックして、ブレークポイントまでテストを実行します。
3. 対象ステップにカーソルを合わせ、**Show Properties**（:fa-cog:）をクリックします。

![](/images/validations/validate-element-not-visible/5ad089f-Screen_Shot_2021-04-18_at_6.40.55.png "Screen Shot 2021-04-18 at 6.40.55.png")

   右側に Properties パネルが表示されます。

4. **Target element** のサムネイルにカーソルを合わせます。

![](/images/validations/validate-element-not-visible/e427d93-Testim_011a_r.png)

   **Target element** のオプションが表示されます。

![](/images/validations/validate-element-not-visible/a16fb1c-Testim_010_r.png)

5. **Reassign** をクリックします。

![](/images/validations/validate-element-not-visible/756ba35-Testim_010a_r.png)

6. AUT 上で新しい要素を特定し、クリックして選択します。\
   選択した要素が Properties パネルの **Target element** に表示されます。
7. 先ほどと同じステップ左の **Toggle Breakpoint** をクリックして、ブレークポイントを解除します。
