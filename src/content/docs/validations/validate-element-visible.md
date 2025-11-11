---
title: '要素の可視性の検証'
description: '原文: https://help.testim.io/docs/validate-element-visible'
category: '検証'
order: 2
updated: '2025-11-02'
keywords:
  - testim
  - validate-element-visible
  - validations
---
期待する要素が可視であることを検証する

Element visible 検証では、要素がページ（Web）やアプリ画面（モバイル）に存在し可視であるかを確認できます。要素に可変の画像やテキストが含まれていても検証は機能します。この検証は要素の存在と可視性のみを確認し、内容の具体値はチェックしません。

## Validate element visible ステップの追加（Web）

:fa-arrow-right: **Element Visible 検証を追加するには:**

1. 検証を追加したい位置の **>（矢印）** にカーソルを合わせます。

![2484](/images/validations/validate-element-visible/9718cce-Screen_Shot_2021-04-18_at_6.37.44.png "Screen Shot 2021-04-18 at 6.37.44.png")

   アクションのオプションが表示されます。

![](/images/validations/validate-element-visible/8ecea21-Testim_083a_r.png)

2. **Toggle Breakpoint** をクリックします。

![](/images/validations/validate-element-visible/43aff0e-Testim_085_r.png)

3. **Play Scenario** をクリックして、ブレークポイントまでテストを実行します。

![2466](/images/validations/validate-element-visible/a703f11-Screen_Shot_2021-04-18_at_6.39.03.png "Screen Shot 2021-04-18 at 6.39.03.png")

4. もう一度同じ位置にカーソルを合わせ、**"M"**（Testim の事前定義ステップ）をクリックします。\
   Predefined steps メニューが開きます。

![](/images/validations/validate-element-visible/4f77381-Testim_034_r.png)

5. **Validations** をクリックします。\
   Validations セクションが展開されます。

![](/images/validations/validate-element-visible/dcef564-Testim_035_r.png)

6. メニューをスクロールして **Validate element visible** を選択します。

:::info
メニュー上部の検索ボックスで **Validate element visible** を検索することもできます。
:::

7. AUT ウィンドウで検証したい要素を特定し、クリックして選択します。\
   ステップが作成され、選択した要素のサムネイルがステップに表示されます。

![3612](/images/validations/validate-element-visible/aa9d9b2-Testim_088.png "Testim 088.png")

8. 検証ステップの後ろにある **Toggle Breakpoint** をクリックしてブレークポイントを解除します（Web のみ）。

## Validate element visible ステップの追加（Mobile）

:fa-arrow-right: **モバイルテストに Element Visible 検証を追加するには:**

1. 検証を追加したい位置の **>（矢印）** にカーソルを合わせます。

![2484](/images/validations/validate-element-visible/542ad86-hover_arrow.png "hover arrow.png")

   アクションのオプションが表示されます。

![300](/images/validations/validate-element-visible/0baf831-1.1.png "1.1.png")

2. **Toggle Breakpoint** をクリックします。

![400](/images/validations/validate-element-visible/051ca7e-2.png "2.png")

3. **Play Scenario** をクリックして、ブレークポイントまでテストを実行します。

![2466](/images/validations/validate-element-visible/73e5022-3.png "3.png")

4. もう一度同じ位置にカーソルを合わせ、**"M"**（Testim の事前定義ステップ）をクリックします。Predefined steps メニューが開きます。

![300](/images/validations/validate-element-visible/ae3357c-4.png "4.png")

5. **Validations** をクリックします。Validations セクションが展開されます。

![300](/images/validations/validate-element-visible/a79a79c-5.png "5.png")

6. メニューをスクロールして **Validate element visible** を選択します。\

:::info
メニュー上部の検索ボックスで **Validate element visible** を検索することもできます。
:::

7. AUT ウィンドウで検証したい要素を特定し、クリックして選択します。\
   ステップが作成され、選択した要素のサムネイルがステップに表示されます。

![3612](/images/validations/validate-element-visible/604aa0a-7.png "7.png")

## Validate element visible ステップの修正（Web）

選択した要素を変更したい場合、ステップを削除して録り直す必要はありません。別の要素に再割り当てできます。

:fa-arrow-right: **Validate element visible ステップで選択要素を再割り当てするには:**

1. 再割り当てしたいステップの左側の位置にカーソルを合わせ、**Toggle Breakpoint** をクリックします。
2. **Play Scenario** をクリックして、ブレークポイントまでテストを実行します。
3. 対象ステップにカーソルを合わせ、**Show Properties**（:fa-cog:）をクリックします。

![2476](/images/validations/validate-element-visible/eaf41e7-Screen_Shot_2021-04-18_at_6.42.37.png "Screen Shot 2021-04-18 at 6.42.37.png")

   右側に Properties パネルが表示されます。\
4\. **Target element** のサムネイルにカーソルを合わせます。

![](/images/validations/validate-element-visible/0508833-Testim_009a_r.png)

   **Target element** のオプションが表示されます。

![300](/images/validations/validate-element-visible/694c31a-Testim_010_r.png "Testim 010_r.png")

5. **Reassign** をクリックします。

![300](/images/validations/validate-element-visible/db22251-Testim_010a_r.png "Testim 010a_r.png")

6. AUT ウィンドウで新しい要素を特定し、クリックして選択します。\
   選択した要素が Properties パネルの **Target element** に表示されます。
7. 再割り当てしたステップの左の **Toggle Breakpoint** をクリックして、ブレークポイントを解除します。

## Validate element visible ステップの修正（Mobile）

選択した要素を変更したい場合、ステップを削除して録り直す必要はありません。別の要素に再割り当てできます。

:fa-arrow-right: **Validate element visible ステップで選択要素を再割り当てするには:**

1. 対象ステップで **Show Properties** アイコンをクリックします。

![271](/images/validations/validate-element-visible/0d76f51-validationgear.png "validationgear.png")

   右側に Properties パネルが表示されます。

![231](/images/validations/validate-element-visible/1953a8a-elementchanged.png "elementchanged.png")

![326](/images/validations/validate-element-visible/fb5abe0-mobileproperties.png "mobileproperties.png")

2. **Target element** のサムネイルにカーソルを合わせ、**Reassign** をクリックします。

![324](/images/validations/validate-element-visible/623adff-reassignmobile.png "reassignmobile.png")

4. AUT ウィンドウで新しい要素を特定し、クリックして選択します。

![305](/images/validations/validate-element-visible/db6aef0-selectelement.png "selectelement.png")

   選択した要素が Properties パネルの **Target element** に表示されます。
