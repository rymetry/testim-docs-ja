# 翻訳タスク (validate-element-attribute)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

モバイルアプリ内の任意の要素属性を検証する

要素属性検証では、画面上の要素が持つ属性値を検証できます。

## Adding a Validate Element Attribute step

:fa-arrow-right: **Validate Element Attribute を追加するには:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the validation.

![](/images/validations/validate-element-attribute/a45b667-small-screen1.png)

アクションのオプションが表示されます。

2. Click on the **Toggle breakpoint** button.

![](/images/validations/validate-element-attribute/2d940f9-small-screen2.png)

3. Click on the **Run test** button, to run the test until the breakpoint.

![](/images/validations/validate-element-attribute/3f42de6-small-screen3.png)

4. Hover over the :fa-caret-right: **(arrow symbol)** again and click on the “**M**” (Testim predefined steps).\
   **Predefined steps** メニューが開きます。

![](/images/validations/validate-element-attribute/0bd37d9-Testim_237_r.png "Testim 237_r.png")

5. **Validations** をクリックします。**Validations** メニューが展開されます。メニューをスクロールして **Validate element attribute** を選択します。

![](/images/validations/validate-element-attribute/ee0bd01-elementattribute.png)

:::info
メニュー上部の検索ボックスで **Validate element attribute** を検索することもできます。
:::

7. **AUT** ウィンドウで検証対象の要素を選択します。検証の設定には要素の属性名が必要です。

![](/images/validations/validate-element-attribute/d65e7f9-image_7.png)

7. The **Element Attribute Validation** form is shown.

![](/images/validations/validate-element-attribute/6a2c9cd-elementattvalidation.png)

8. **Attribute name** に検証したい属性名（例: checkable, checked, className, clickable）を入力します。利用可能な属性一覧は [List of possible attributes](https://help.testim.io/docs/validate-element-attribute#list-of-possible-attributes) を参照。
9. **Expected value** に期待値を入力します（例: `true`）。

:::note
**Attribute name** と **Expected value** を編集する際は、値をクォートで囲んでください（例: `'enabled'` / `'true'`）。
:::

:::info
期待値には正規表現を使用できます。
:::

Testim will validate whether the selected element attribute's expected value is present when running your test.

10. Click **OK**. The “Validate element attribute” step is added in the **Editor**, and a thumbnail of the selected element is shown in the step.
11. Click on the **Toggle Breakpoint** button after the validation step to remove the breakpoint.

## Validate element attribute ステップの修正

選択要素を変更したい場合は、ステップを削除して録り直す必要はありません。別の要素に再割り当てできます。あるいは、要素を選び直さずに **Attribute name** / **Expected value** の値だけを編集することも可能です。

:fa-arrow-right: **検証ステップで選択要素を再割り当てするには:**

1. Hover over the position to the left of the step for which you want to reassign the element and click on the **Toggle breakpoint** button.
2. Click on the **Run test** button to run the test until the breakpoint.
3. Hover over the step for which you want to reassign the element and click on the **Show Properties** (:fa-cog:) icon.

![](/images/validations/validate-element-attribute/7495290-updatedsteps.png)

右側に **Properties** パネルが表示されます。

4. Hover over the **Target element** thumbnail to show options, and click **Reassign**.

![](/images/validations/validate-element-attribute/61bac26-reassign.png)

5. In the **AUT** window, identify the new element that you would like to select and click on it.\
   The selected element is shown in the **Target element** box in the **Properties** panel.
6. **Attribute name** に新しい要素の属性名を入力します。
7. **Expected value** に新しい属性の期待値を入力します。

:::note
**Attribute name** と **Expected value** を編集する際は、値をクォートで囲んでください（例: `'enabled'` / `'true'`）。
:::

8. Click on the same **Toggle Breakpoint** button to the left of the step for which you reassigned the element to remove the breakpoint.

:fa-arrow-right: **元の要素のプロパティを編集するには:**

1. Hover over the step for which you want to reassign the element and click on the **Show Properties** (:fa-cog:) icon.

![](/images/validations/validate-element-attribute/240621e-properties.png)

右側に **Properties** パネルが表示されます。

2. In the **Properties** panel **Attribute name** field enter the new attribute name for the element.
3. In the **Properties** panel **Expected value** field enter the new expected value of the attribute.

![](/images/validations/validate-element-attribute/4865d83-propertiespanel.png)

> 📘
>
> When modifying the value of the **Attribute name** and **Expected value** in the **Properties** panel, make sure they are enclosed in single quotes: e.g. ‘clickable’ and 'true'.

## List of possible attributes

### iOS attributes (using Appium)

- checkable
- checked
- \{class,className}
- clickable \{content-desc,contentDescription}
- enabled
- focusable
- focused
- \{long-clickable,longClickable}
- package
- password
- \{resource-id,resourceId}
- scrollable
- selection-start
- selection-end
- selected
- \{text,name}
- hint
- extras
- bounds
- displayed
- contentSize

### Android attributes

- UID
- accessibilityContainer
- accessible
- enabled
- frame
- index
- label
- name
- rect
- selected
- type
- value
- visible
- wdAccessibilityContainer
- wdAccessible
- wdEnabled
- wdFrame
- wdIndex
- wdLabel
- wdName
- wdRect
- wdSelected
- wdType
- wdUID
- wdValue
- wdVisible
