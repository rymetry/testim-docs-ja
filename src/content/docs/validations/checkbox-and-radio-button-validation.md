---
title: チェックボックス／ラジオボタンの検証
description: チェックボックスやラジオボタンの選択状態を検証するステップ。フォーム要素の状態確認に特化した検証機能を提供します。
category: 高度な編集
order: 5013
updated: '2025-09-14'
sourceUrl: 'https://help.testim.io/docs/checkbox-and-radio-button-validation'
keywords:
  - チェックボックス
  - ラジオボタン
  - フォーム検証
  - 選択状態
  - UI検証
  - インプット
  - フォーム要素
  - Testim
  - 選択検証
  - ボタン状態
---

チェックボックス／ラジオボタンがオンかオフかを検証する

チェックボックス／ラジオボタン検証では、対象のオン（checked）／オフ（unchecked）状態を確認します。テスト実行時、検証条件の一致に応じてステップは pass/fail となります。

:::note
本検証はネイティブの input 要素（checkbox/radio）のみ対象です。カスタム実装で基盤となる input を持たない場合はサポートされません。
:::

## Validate checkbox/radio button ステップの追加

**Validate checkbox / Validate radio button を追加するには:**

1. 検証を追加したい位置の **（矢印記号）** にカーソルを合わせます。

![ステップ追加位置の矢印記号](/images/validations/checkbox-and-radio-button-validation/0d8957c-Testim_130a.png)

アクションのオプションが表示されます。

![CLI](/images/validations/checkbox-and-radio-button-validation/d0c62d2-Testim_131a_r.png)

2. **Toggle Breakpoint** ボタンをクリックします。

![CLI](/images/validations/checkbox-and-radio-button-validation/d6e78f5-Testim_132_r.png)

3. **Play Scenario** ボタンをクリックして、ブレークポイントまでテストを実行します。

![Play Scenario ボタン](/images/validations/checkbox-and-radio-button-validation/784405c-Testim_133a.png)

4. もう一度 **（矢印記号）** にカーソルを合わせ、**"M"**（Testim の事前定義ステップ）をクリックします。\
   **Predefined steps** メニューが開きます。

![ステップ追加矢印](/images/validations/checkbox-and-radio-button-validation/9c03152-Testim_134_r.png)

5. **Validations** をクリックします。\
   Validations メニューが展開されます。

![検証](/images/validations/checkbox-and-radio-button-validation/7b3d72a-Testim_135_r.png)

6. メニューをスクロールして **Validate checkbox** または **Validate radio button** を選択します。

:::note
メニュー上部の検索ボックスで検索することもできます。
:::

7. AUT ウィンドウで、検証したいチェックボックスまたはラジオボタンを特定し、クリックして選択します。\
   ステップが作成され、選択した要素のサムネイルがステップに表示されます。

![作成されたチェックボックス検証ステップ](/images/validations/checkbox-and-radio-button-validation/e16e50e-Testim_136.png)

8. 作成したステップにカーソルを合わせ、**Show Properties**  アイコンをクリックします。

![Show Properties アイコン](/images/validations/checkbox-and-radio-button-validation/ee0c7a1-Testim_137a.png)

右側に **Properties パネル** が開きます。\
9\. **Expected status** セクションで、検証したいステータスに応じて **Checked**（デフォルト）または **Unchecked** をクリックします。

![検証](/images/validations/checkbox-and-radio-button-validation/5ed3749-Testim_138a_r.png)

10. 検証ステップの後の **Toggle Breakpoint** ボタンをクリックして、ブレークポイントを削除します。

## Validate checkbox/radio button ステップの変更

選択したチェックボックス/ラジオボタンを変更したい場合、ステップを削除して再記録する必要はありません。代わりに、別のチェックボックス/ラジオボタンに再割り当てできます。

**検証ステップで選択したチェックボックス/ラジオボタンを再割り当てするには:**

1. チェックボックス/ラジオボタンを再割り当てしたいステップの左側の位置にカーソルを合わせ、**Toggle Breakpoint** ボタンをクリックします。
2. **Play Scenario** ボタンをクリックして、ブレークポイントまでテストを実行します。
3. チェックボックス/ラジオボタンを再割り当てしたいステップにカーソルを合わせ、**Show Properties**  アイコンをクリックします。

![ステップの Show Properties アイコン](/images/validations/checkbox-and-radio-button-validation/d39aec2-Testim_139a.png)

右側に **Properties** パネルが表示されます。\
4\. **Target checkbox/radio button** のサムネイルにカーソルを合わせてオプションを表示し、**Reassign** をクリックします。

![チェックボックス](/images/validations/checkbox-and-radio-button-validation/db9dd10-Testim_141a_r.png)

5. AUT ウィンドウで、選択したい新しいチェックボックス/ラジオボタンを特定し、クリックします。\
   選択したチェックボックス/ラジオボタンが Properties パネルの Target ボックスに表示されます。
6. チェックボックス/ラジオボタンを再割り当てしたステップの左側にある同じ **Toggle Breakpoint** ボタンをクリックして、ブレークポイントを削除します。
