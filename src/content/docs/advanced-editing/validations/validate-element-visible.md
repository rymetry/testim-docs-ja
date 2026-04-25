---
title: 要素の可視性の検証
description: 要素が画面上に表示されているかを検証するステップ。ページ上の特定要素の可視性を確認し、期待通りの UI 状態であることを保証します。
category: 高度な編集
order: 5003
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/validations/validate-element-visible.htm'
keywords:
  - 要素検証
  - 表示確認
  - 可視性
  - UI 検証
  - DOM 要素
  - テスト
  - 自動化
  - Testim
  - ビジュアル検証
  - ページ検証
---

要素の可視性（Element visible）検証では、対象要素がページ（Web）やアプリ画面（モバイル）に存在し、表示されているかを確認できます。要素内に動的な画像やテキストが含まれていても正しく動作します。本検証では要素の存在と可視性のみを確認し、内容の具体的な値はチェックしません。

## Validate element visible ステップの追加（Web）

**Element Visible 検証を追加するには:**

1. 検証を追加したい位置の **>（矢印）** にカーソルを合わせます。

![ステップ追加位置の矢印](/images/validations/validate-element-visible/9718cce-Screen_Shot_2021-04-18_at_6.37.44.png)

アクションのオプションが表示されます。

![ステップ追加](/images/validations/validate-element-visible/8ecea21-Testim_083a_r.png)

2. **Toggle Breakpoint** をクリックします。

![ステップ選択](/images/validations/validate-element-visible/43aff0e-Testim_085_r.png)

3. **Play Scenario** をクリックして、ブレークポイントまでテストを実行します。

![Play Scenario ボタン](/images/validations/validate-element-visible/a703f11-Screen_Shot_2021-04-18_at_6.39.03.png)

4. もう一度同じ位置にカーソルを合わせ、**"M"**（Testim の事前定義ステップ）をクリックします。\
Predefined steps メニューが開きます。

![検証](/images/validations/validate-element-visible/4f77381-Testim_034_r.png)

5. **Validations** をクリックします。\
Validations セクションが展開されます。

![検証](/images/validations/validate-element-visible/dcef564-Testim_035_r.png)

6. メニューをスクロールして **Validate element visible** を選択します。

:::info
メニュー上部の検索ボックスで **Validate element visible** を検索することもできます。
:::

7. AUT ウィンドウで検証したい要素を特定し、クリックして選択します。\
ステップが作成され、選択した要素のサムネイルがステップに表示されます。

![作成された検証ステップ](/images/validations/validate-element-visible/aa9d9b2-Testim_088.png)

8. 検証ステップの後ろにある **Toggle Breakpoint** をクリックしてブレークポイントを解除します（Web のみ）。

## Validate element visible ステップの追加（Mobile）

**モバイルテストに Element Visible 検証を追加するには:**

1. 検証を追加したい位置の **>（矢印）** にカーソルを合わせます。

![ステップ追加位置の矢印](/images/validations/validate-element-visible/542ad86-hover_arrow.png)

アクションのオプションが表示されます。

![アクションオプションメニュー](/images/validations/validate-element-visible/0baf831-1.1.png)

2. **Toggle Breakpoint** をクリックします。

![Toggle Breakpoint ボタン](/images/validations/validate-element-visible/051ca7e-2.png)

3. **Play Scenario** をクリックして、ブレークポイントまでテストを実行します。

![Play Scenario ボタン](/images/validations/validate-element-visible/73e5022-3.png)

4. もう一度同じ位置にカーソルを合わせ、**"M"**（Testim の事前定義ステップ）をクリックします。Predefined steps メニューが開きます。

![Predefined steps メニュー](/images/validations/validate-element-visible/ae3357c-4.png)

5. **Validations** をクリックします。Validations セクションが展開されます。

![Validations メニュー展開](/images/validations/validate-element-visible/a79a79c-5.png)

6. メニューをスクロールして **Validate element visible** を選択します。\

:::info
メニュー上部の検索ボックスで **Validate element visible** を検索することもできます。
:::

7. AUT ウィンドウで検証したい要素を特定し、クリックして選択します。\
ステップが作成され、選択した要素のサムネイルがステップに表示されます。

![作成された検証ステップ](/images/validations/validate-element-visible/604aa0a-7.png)

## Validate element visible ステップの修正（Web）

選択した要素を変更したい場合、ステップを削除して録り直す必要はありません。別の要素に再割り当てできます。**Validate element visible ステップで選択要素を再割り当てするには:**

1. 再割り当てしたいステップの左側の位置にカーソルを合わせ、**Toggle Breakpoint** をクリックします。
2. **Play Scenario** をクリックして、ブレークポイントまでテストを実行します。
3. 対象ステップにカーソルを合わせ、**Show Properties**をクリックします。

![Show Properties アイコン](/images/validations/validate-element-visible/eaf41e7-Screen_Shot_2021-04-18_at_6.42.37.png)

右側に Properties パネルが表示されます。

4. **Target element** のサムネイルにカーソルを合わせます。

![Testim インターフェース](/images/validations/validate-element-visible/0508833-Testim_009a_r.png)

**Target element** のオプションが表示されます。

![Target element のオプション](/images/validations/validate-element-visible/694c31a-Testim_010_r.png)

5. **Reassign** をクリックします。

![Reassign ボタン](/images/validations/validate-element-visible/db22251-Testim_010a_r.png)

6. AUT ウィンドウで新しい要素を特定し、クリックして選択します。

選択した要素が Properties パネルの **Target element** に表示されます。

7. 再割り当てしたステップの左の **Toggle Breakpoint** をクリックして、ブレークポイントを解除します。

## Validate element visible ステップの修正（Mobile）

選択した要素を変更したい場合、ステップを削除して録り直す必要はありません。別の要素に再割り当てできます。**Validate element visible ステップで選択要素を再割り当てするには:**

1. 対象ステップで **Show Properties** アイコンをクリックします。

![Show Properties アイコン](/images/validations/validate-element-visible/0d76f51-validationgear.png)

右側に Properties パネルが表示されます。

![要素変更の通知](/images/validations/validate-element-visible/1953a8a-elementchanged.png)

![モバイル Properties パネル](/images/validations/validate-element-visible/fb5abe0-mobileproperties.png)

2. **Target element** のサムネイルにカーソルを合わせ、**Reassign** をクリックします。

![Reassign ボタン](/images/validations/validate-element-visible/623adff-reassignmobile.png)

4. AUT ウィンドウで新しい要素を特定し、クリックして選択します。

![要素の選択](/images/validations/validate-element-visible/db6aef0-selectelement.png)

選択した要素が Properties パネルの **Target element** に表示されます。
