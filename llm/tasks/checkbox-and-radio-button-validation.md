# 翻訳タスク (checkbox-and-radio-button-validation)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

チェックボックス／ラジオボタンがオンかオフかを検証する

チェックボックス／ラジオボタン検証では、対象のオン（checked）／オフ（unchecked）状態を確認します。テスト実行時、検証条件の一致に応じてステップは pass/fail となります。

:::note
本検証はネイティブの input 要素（checkbox/radio）のみ対象です。カスタム実装で基盤となる input を持たない場合はサポートされません。
:::

## Adding a Validate checkbox/radio button step

:fa-arrow-right: **Validate checkbox / Validate radio button を追加するには:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the validation.

![3659](/images/validations/checkbox-and-radio-button-validation/0d8957c-Testim_130a.png "Testim 130a.png")

アクションのオプションが表示されます。

![](/images/validations/checkbox-and-radio-button-validation/d0c62d2-Testim_131a_r.png)

2. Click on the **Toggle Breakpoint** button.

![](/images/validations/checkbox-and-radio-button-validation/d6e78f5-Testim_132_r.png)

3. Click on the **Play Scenario** button to run the test until the breakpoint.

![3665](/images/validations/checkbox-and-radio-button-validation/784405c-Testim_133a.png "Testim 133a.png")

4. Hover over the :fa-caret-right: **(arrow symbol)** again and click on the **“M”** (Testim predefined steps).\
   **Predefined steps** メニューが開きます。

![](/images/validations/checkbox-and-radio-button-validation/9c03152-Testim_134_r.png)

5. Click on **Validations**.\
   Validations メニューが展開されます。

![](/images/validations/checkbox-and-radio-button-validation/7b3d72a-Testim_135_r.png)

6. Scroll down through the menu and select **Validate checkbox** or **Validate radio button**.

> 📘 メニュー上部の検索ボックスで検索することもできます。

7. In the AUT window, identify the relevant checkbox or radio button that you wish to validate, and click on it to select it.\
   The step is created, and a thumbnail of the selected element is shown in the step.

![3654](/images/validations/checkbox-and-radio-button-validation/e16e50e-Testim_136.png "Testim 136.png")

8. Hover over the step you just created and click on the **Show Properties** (:fa-cog:) icon.

![3633](/images/validations/checkbox-and-radio-button-validation/ee0c7a1-Testim_137a.png "Testim 137a.png")

The **Properties panel** opens on the right-hand side.\
9\. In the **Expected status** section, click either **Checked** (default) or **Unchecked**, depending on which status you want to validate.

![](/images/validations/checkbox-and-radio-button-validation/5ed3749-Testim_138a_r.png)

10. Click on the **Toggle Breakpoint** button after the Validation step to remove the breakpoint.

## Modifying a Validate checkbox/radio button step

If you want to change the checkbox/radio button you selected, you don’t need to delete and re-record the step. Instead, you can reassign the checkbox/radio button with a different checkbox/radio button.

:fa-arrow-right: **To reassign the selected checkbox/radio button in a Validation step:**

1. Hover over the position to the left of the step for which you want to reassign the checkbox/radio button and click on the **Toggle Breakpoint** button.
2. Click on the **Play Scenario** button to run the test until the breakpoint.
3. Hover over the step for which you want to reassign the checkbox/radio button and click on the **Show Properties** (:fa-cog:) icon.

![3667](/images/validations/checkbox-and-radio-button-validation/d39aec2-Testim_139a.png "Testim 139a.png")

右側に **Properties** パネルが表示されます。\
4\. Hover over the **Target checkbox/radio button** thumbnail to show options, and click **Reassign**.

![](/images/validations/checkbox-and-radio-button-validation/db9dd10-Testim_141a_r.png)

5. In the AUT window, identify the new checkbox/radio button that you would like to select and click on it.\
   The selected checkbox/radio button is shown in the Target box in the Properties panel.
6. Click on the same **Toggle Breakpoint** button to the left of the step for which you reassigned the checkbox/radio button to remove the breakpoint.
