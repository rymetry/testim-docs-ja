# 翻訳タスク (html-attribute-validation)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Validate any HTML attribute in your app

The HTML attribute validation allows you to validate the value of any HTML attribute of an element (e.g. *href*, *src*, *alt*, *title*, etc.). It is also possible to validate a "disabled" attribute, as explained below.

## Adding a Validate HTML attribute step

:fa-arrow-right: **To add a Validate HTML attribute step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the validation.

![](/images/validations/html-attribute-validation/a0c5a27-Testim_233a.png "Testim 233a.png")

アクションのオプションが表示されます。

![](/images/validations/html-attribute-validation/9ad04c9-Testim_234a_r.png "Testim 234a_r.png")

2. Click on the **Toggle breakpoint** button.

![](/images/validations/html-attribute-validation/3040109-Testim_235_r.png "Testim 235_r.png")

3. Click on the **Run test** button, to run the test until the breakpoint.

![](/images/validations/html-attribute-validation/c3f0d75-Testim_236a.png "Testim 236a.png")

4. Hover over the :fa-caret-right: **(arrow symbol)** again and click on the “**M**” (Testim predefined steps).\
   **Predefined steps** メニューが開きます。

![](/images/validations/html-attribute-validation/0bd37d9-Testim_237_r.png "Testim 237_r.png")

5. **Validations** をクリックします。\
   **Validations** メニューが展開されます。

![](/images/validations/html-attribute-validation/e3e4f2e-Testim_238_r.png "Testim 238_r.png")

6. メニューをスクロールし **Validate HTML attribute** を選択します。

:::info
メニュー上部の検索ボックスで **Validate HTML attribute** を検索することもできます。
:::

7. In the **AUT** window, identify the relevant element for which you wish to validate an HTML attribute, and click on it to select it.\
   The **HTML Attribute Validation** form is shown.

![](/images/validations/html-attribute-validation/4a3f8b9-Testim_239_r.png "Testim 239_r.png")

8. In the **Attribute name** field, enter a valid HTML attribute that you wish to validate (e.g. *href*, *src*, *alt*, *title*, etc.).
9. In the **Expected value** field, enter the value you wish to validate for the attribute (e.g. *[https://www.testim.io](https://www.testim.io)*).

> 📘
>
> For the expected value you can use regex. For example, 'href' that starts with https will have the following regex:/^https/

10. Click **OK**.\
    The “Validate HTML attribute” step is added in the **Editor**, and a thumbnail of the selected element is shown in the step.
11. Click on the **Toggle Breakpoint** button after the validation step to remove the breakpoint.

### Validating a "disabled" attribute

It is also possible to validate a "disabled" HTML attribute.

 :fa-arrow-right: **disabled 属性を検証するには:**

1. Perform steps 1-6 above.

2. In the **AUT** window, identify the relevant element for which you wish to validate the "disabled" HTML attribute, and click on it to select it.\
   The **HTML Attribute Validation** form is shown.

3. **Attribute name** に `disabled` を入力します。

4. **Expected value** には値を入力しません。  
   ![](/images/validations/html-attribute-validation/a78b8f5-image.png)

5. Click **OK**.\
   The “Validate HTML attribute” step is added in the **Editor**, and a thumbnail of the selected element is shown in the step.  
   ![](/images/validations/html-attribute-validation/a1bbe4a-image_1.png)

6. Click on the **Toggle Breakpoint** button after the validation step to remove the breakpoint.

## Validate HTML attribute ステップの修正

選択要素を変更したい場合、ステップを削除して録り直す必要はありません。別の要素に再割り当てできます。あるいは、要素を選び直さずに **Attribute name** / **Expected value** の値を編集することも可能です。

:fa-arrow-right: **検証ステップで選択要素を再割り当てするには:**

1. Hover over the position to the left of the step for which you want to reassign the element and click on the **Toggle breakpoint** button.
2. Click on the **Run test** button to run the test until the breakpoint.
3. Hover over the step for which you want to reassign the element and click on the **Show Properties** (:fa-cog:) icon.

![](/images/validations/html-attribute-validation/330255f-Testim_240a.png "Testim 240a.png")

右側に **Properties** パネルが表示されます。

4. Hover over the **Target element** thumbnail to show options, and click **Reassign**.

![](/images/validations/html-attribute-validation/1272545-Testim_241a_r.png "Testim 241a_r.png")

5. In the **AUT** window, identify the new element that you would like to select and click on it.\
   The selected element is shown in the **Target element** box in the **Properties** panel.
6. In the **Properties** panel **Attribute name** field enter the attribute name for the new element.
7. In the **Properties** panel **Expected value** field enter the expected value of the new attribute.

> 📘
>
> When modifying the value of the **Attribute name** and **Expected value** in the **Properties** panel, make sure they are enclosed in single quotes: e.g. ‘href’ and ‘[https://www.testim.io’](https://www.testim.io’).

8. Click on the same **Toggle Breakpoint** button to the left of the step for which you reassigned the element to remove the breakpoint.

:fa-arrow-right: **To modify the properties of the*original* element:**

1. Hover over the step for which you want to reassign the element and click on the **Show Properties** (:fa-cog:) icon.

![](/images/validations/html-attribute-validation/8f90779-Testim_242a.png "Testim 242a.png")

右側に **Properties** パネルが表示されます。

![](/images/validations/html-attribute-validation/aa817ce-Testim_241_r.png "Testim 241_r.png")

2. In the **Properties** panel **Attribute name** field enter the new attribute name for the element.
3. In the **Properties** panel **Expected value** field enter the new expected value of the attribute.

> 📘
>
> When modifying the value of the **Attribute name** and **Expected value** in the **Properties** panel, make sure they are enclosed in single quotes: e.g. ‘href’ and ‘[https://www.testim.io’](https://www.testim.io’).
