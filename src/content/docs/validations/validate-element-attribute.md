---
title: 要素属性の検証（モバイル）
description: 要素の属性値が期待通りであることを検証するステップ。HTML 属性や DOM プロパティの値を確認し、要素の状態を詳細に検証できます。
category: 高度な編集
order: 5012
updated: '2025-09-15'
sourceUrl: 'https://help.testim.io/docs/validate-element-attribute'
keywords:
  - 属性検証
  - 要素属性
  - DOM 属性
  - HTML
  - プロパティ
  - 属性値
  - UI 検証
  - Web 要素
  - Testim
  - 動的検証
---

モバイルアプリ内の任意の要素属性を検証する

要素属性検証では、画面上の要素が持つ属性値を検証できます。

## Validate Element Attribute ステップの追加

**Validate Element Attribute を追加するには:**

1. 検証を追加したい位置の **（矢印記号）** にカーソルを合わせます。

![ステップ追加矢印](/images/validations/validate-element-attribute/a45b667-small-screen1.png)

アクションのオプションが表示されます。

2. **Toggle breakpoint** ボタンをクリックします。

![CLI](/images/validations/validate-element-attribute/2d940f9-small-screen2.png)

3. **Run test** ボタンをクリックし、ブレークポイントまでテストを実行します。

![ステップ追加矢印](/images/validations/validate-element-attribute/3f42de6-small-screen3.png)

4. 再び **（矢印記号）** にカーソルを合わせ、「**M**」（Testim 定義済みステップ）をクリックします。\
   **Predefined steps** メニューが開きます。

![ステップ追加矢印](/images/validations/validate-element-attribute/0bd37d9-Testim_237_r.png)

5. **Validations** をクリックします。**Validations** メニューが展開されます。メニューをスクロールして **Validate element attribute** を選択します。

![検証](/images/validations/validate-element-attribute/ee0bd01-elementattribute.png)

:::info
メニュー上部の検索ボックスで **Validate element attribute** を検索することもできます。
:::

7. **AUT** ウィンドウで検証対象の要素を選択します。検証の設定には要素の属性名が必要です。

![検証](/images/validations/validate-element-attribute/d65e7f9-image_7.png)

7. **Element Attribute Validation** フォームが表示されます。

![検証](/images/validations/validate-element-attribute/6a2c9cd-elementattvalidation.png)

8. **Attribute name** に検証したい属性名（例: checkable, checked, className, clickable）を入力します。利用可能な属性一覧は [List of possible attributes](/docs/validate-element-attribute#list-of-possible-attributes) を参照。
9. **Expected value** に期待値を入力します（例: `true`）。

:::note
**Attribute name** と **Expected value** を編集する際は、値をクォートで囲んでください（例: `'enabled'` / `'true'`）。
:::

:::info
期待値には正規表現を使用できます。
:::

Testim はテスト実行時に、選択した要素の属性が期待値を持つかどうかを検証します。

10. **OK** をクリックします。**Editor** に「Validate element attribute」ステップが追加され、ステップ内に選択要素のサムネイルが表示されます。
11. 検証ステップの後にある **Toggle Breakpoint** ボタンをクリックしてブレークポイントを削除します。

## Validate element attribute ステップの修正

選択要素を変更したい場合は、ステップを削除して録り直す必要はありません。別の要素に再割り当てできます。あるいは、要素を選び直さずに **Attribute name** / **Expected value** の値だけを編集することも可能です。

**検証ステップで選択要素を再割り当てするには:**

1. 要素を再割り当てしたいステップの左側にカーソルを合わせ、**Toggle breakpoint** ボタンをクリックします。
2. **Run test** ボタンをクリックし、ブレークポイントまでテストを実行します。
3. 要素を再割り当てしたいステップにカーソルを合わせ、**Show Properties**  アイコンをクリックします。

![CLI](/images/validations/validate-element-attribute/7495290-updatedsteps.png)

右側に **Properties** パネルが表示されます。

4. **Target element** サムネイルにカーソルを合わせてオプションを表示し、**Reassign** をクリックします。

![CLI](/images/validations/validate-element-attribute/61bac26-reassign.png)

5. **AUT** ウィンドウで、新しく選択したい要素を特定しクリックします。\
   選択された要素が **Properties** パネルの **Target element** ボックスに表示されます。
6. **Attribute name** に新しい要素の属性名を入力します。
7. **Expected value** に新しい属性の期待値を入力します。

:::note
**Attribute name** と **Expected value** を編集する際は、値をクォートで囲んでください（例: `'enabled'` / `'true'`）。
:::

8. 要素を再割り当てしたステップの左側にある **Toggle Breakpoint** ボタンをクリックしてブレークポイントを削除します。

**元の要素のプロパティを編集するには:**

1. 要素を再割り当てしたいステップにカーソルを合わせ、**Show Properties**  アイコンをクリックします。

![CLI](/images/validations/validate-element-attribute/240621e-properties.png)

右側に **Properties** パネルが表示されます。

2. **Properties** パネルの **Attribute name** フィールドに、要素の新しい属性名を入力します。
3. **Properties** パネルの **Expected value** フィールドに、属性の新しい期待値を入力します。

![属性](/images/validations/validate-element-attribute/4865d83-propertiespanel.png)

:::note
**Properties** パネルで **Attribute name** と **Expected value** の値を変更する際は、必ずシングルクォートで囲んでください。例：'clickable' と 'true'。
:::

## 利用可能な属性一覧

### iOS 属性（Appium 使用時）

* checkable
* checked
* \{class,className}
* clickable \{content-desc,contentDescription}
* enabled
* focusable
* focused
* \{long-clickable,longClickable}
* package
* password
* \{resource-id,resourceId}
* scrollable
* selection-start
* selection-end
* selected
* \{text,name}
* hint
* extras
* bounds
* displayed
* contentSize

### Android 属性

* UID
* accessibilityContainer
* accessible
* enabled
* frame
* index
* label
* name
* rect
* selected
* type
* value
* visible
* wdAccessibilityContainer
* wdAccessible
* wdEnabled
* wdFrame
* wdIndex
* wdLabel
* wdName
* wdRect
* wdSelected
* wdType
* wdUID
* wdValue
* wdVisible
