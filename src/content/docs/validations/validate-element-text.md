---
title: 要素テキストの検証
description: 要素に表示されているテキストが期待値と一致するかを検証するステップ。部分一致、完全一致、正規表現など柔軟な検証条件を設定できます。
category: 高度な編集
order: 5005
updated: '2025-09-14'
sourceUrl: 'https://help.testim.io/docs/validate-element-text'
keywords:
  - テキスト検証
  - 要素テキスト
  - 文字列確認
  - UI検証
  - コンテンツ検証
  - テスト
  - 自動化
  - Testim
  - テキストマッチング
  - DOM検証
---

期待するテキストが表示されていることを検証する

Element Text 検証は、指定した要素の存在を前提にする点で Element Visible 検証と似ていますが、Element Text 検証ではその要素に表示される「特定のテキスト値」も指定して検証します。複数のテキスト要素をまとめて検証することもできます。\
検証対象のテキストは、固定文字列のほか、正規表現（Regex）、短い JS 式、パラメーターなどで表せます。詳細は [Advanced text validation](/docs/validate-element-text#advanced-text-validation) を参照してください。

:::note
（Web のみの補足）記録中に、アプリ上のテキストをキーボードショートカットで直接検証として記録できます。Ctrl + 'v' を押して検証したいテキストを選択します。
:::

## Validate element text ステップの追加（Web）

:fa-arrow-right: **Element Text 検証を追加するには:**

1. 検証を追加したい位置の **>（矢印）** にカーソルを合わせます。

![スクリーンショット](/images/validations/validate-element-text/c2ef26f-Screen_Shot_2021-04-18_at_6.37.44.png)

   アクションのオプションが表示されます。

![ステップ追加](/images/validations/validate-element-text/f9aa3c6-Testim_083a_r.png)

2. **Toggle Breakpoint** をクリックします。

![ステップ選択](/images/validations/validate-element-text/388d9b8-Testim_085_r.png)

3. **Play Scenario** をクリックして、ブレークポイントまでテストを実行します。

![スクリーンショット](/images/validations/validate-element-text/b22feac-Screen_Shot_2021-04-18_at_6.39.03.png)

4. もう一度同じ位置にカーソルを合わせ、**"M"**（Testim の事前定義ステップ）をクリックします。\
   Predefined steps メニューが開きます。

![検証](/images/validations/validate-element-text/46a723c-Testim_034_r.png)

5. **Validations** をクリックします。\
   Validations セクションが展開されます。

![検証](/images/validations/validate-element-text/9d4b608-Testim_035_r.png)

6. **Validate element text** を選択します。

:::info
メニュー上部の検索ボックスで **Validate element text** を検索することもできます。
:::

7. AUT ウィンドウで検証したい要素をクリックして選択します。\
   ステップが作成され、選択した要素のサムネイルがステップに表示されます。

![検証オプション](/images/validations/validate-element-text/1915d47-Testim_090.png)

:::info
Ctrl キーを押しながら複数の要素をクリックして、複数テキストの検証をまとめて作成することもできます。この場合、すべての検証を含む再利用可能なグループが作成されます。
:::

8. 検証ステップの後にある **Toggle Breakpoint** をクリックしてブレークポイントを解除します。

## Validate element text ステップの追加（Mobile）

:fa-arrow-right: **Element Text 検証を追加するには:**

1. 検証を追加したい位置の **>（矢印）** にカーソルを合わせ、**Testim predefined steps** ボタンをクリックします。

![定義済みステップ](/images/validations/validate-element-text/c16fd83-predefined-steps.png)

2. **Validations** 内の **Validate element text** を選択します。

![要素テキスト検証](/images/validations/validate-element-text/e3ba3d9-validateelementtext.png)

:::note
メニュー上部の検索ボックスで **Validate element text** を検索することもできます。
:::

3. AUT が開きます。検証したい画面上のテキスト要素を選択します。

![要素選択](/images/validations/validate-element-text/90346f6-selectelement.png)

4. **Text Validation** ステップが作成され、選択要素のサムネイルがステップに表示されます。

![検証](/images/validations/validate-element-text/2665c9c-textvalidationstep.png)

## Validate element text ステップの修正（Mobile & Web）

選択した要素やテキストを変更したい場合、ステップを削除して録り直す必要はありません。別の要素へ再割り当てするか、検証対象のテキストを編集できます。

### 選択要素の再割り当て

:fa-arrow-right: **Validate element text ステップで選択要素を再割り当てするには:**

1. 再割り当てしたいステップの左側の位置にカーソルを合わせ、**Toggle Breakpoint** をクリックします。
2. **Play Scenario** をクリックして、ブレークポイントまでテストを実行します。
3. 対象ステップにカーソルを合わせ、**Show Properties**（:fa-cog:）をクリックします。

![スクリーンショット](/images/validations/validate-element-text/705a94f-Screen_Shot_2021-04-18_at_6.40.55.png)

   右側に Properties パネルが表示されます。

4. **Target element** のサムネイルにカーソルを合わせます。

![テキスト設定](/images/validations/validate-element-text/5934637-Testim_015a_r.png)

   **Target element** のオプションが表示されます。

![要素設定](/images/validations/validate-element-text/79b44a7-Testim_010_r.png)

5. **Reassign** をクリックします。

![要素設定](/images/validations/validate-element-text/17dc6a7-Testim_010a_r.png)

6. AUT 上で新しい要素を特定し、クリックして選択します。\
   選択した要素が Properties パネルの **Target element** に表示されます。
7. 先ほどと同じステップ左の **Toggle Breakpoint** をクリックして、ブレークポイントを解除します。

### 検証テキストの編集

:fa-arrow-right: **Validate element text ステップで検証するテキストを編集するには:**

1. 対象ステップにカーソルを合わせ、**Show Properties**（:fa-cog:）をクリックします。

![スクリーンショット](/images/validations/validate-element-text/705a94f-Screen_Shot_2021-04-18_at_6.40.55.png)

   右側に Properties パネルが表示されます。

2. **Expected value** フィールドに、検証対象のテキスト（文字列 / 正規表現 / JS 式 / パラメーター）を設定します。

![テキスト設定](/images/validations/validate-element-text/d8459d3-Testim_015b_r.png)

> 例: 固定文字列や正規表現 `new RegExp('^Hello')`、`'Hello ' + userName` のようにパラメーターと結合した式などを指定できます。

## パラメーターを使った検証

### 概要

パラメーターで検証値を指定する構成は、次のいずれかです。

* **テストレベルのパラメーター** — データ駆動設定（Config / 外部ソース）で渡す方法。
* **ステップレベルのパラメーター** — エクスポートして検証ステップに受け渡す方法。

### テストレベルでのパラメーター指定（Web）

1. データ駆動テストの設定でパラメーターを渡します。
   * **外部ソースからのデータ** → [Configuring data-driven tests using data from an external source](/docs/configuring-data-driven-tests-using-data-from-an-external-source)
   * **Config ファイル** → [Configuration file](/docs/configuration-file-run-hooks), [Config file でのデータ駆動設定](/docs/configuring-data-driven-tests-using-the-config-file)

<Image title="Untitled_Project.gif" alt={1920} align="center" src="/images/validations/validate-element-text/fbf2f95-Untitled_Project.gif">
  **画像をクリックで拡大**
</Image>

2. パラメーターのスコープが「ステップ」の場合は、[Exports Parameters](/docs/exports-parameters) を使って Element Text 検証ステップ（またはテストレベル）へエクスポートしてください。\
   例）`username` というパラメーターに `Hello, John` を渡す場合、カスタムアクションを追加してエディターに以下を入力します。

```javascript
exportsTest.usename = "Hello, John"
```

<Image title="export_param.gif" alt={1920} align="center" src="/images/validations/validate-element-text/91597d2-export_param.gif">
  **画像をクリックで拡大**
</Image>

3. **Element text validation** ステップを作成し、**Expected value** にパラメーターを指定します。

<Image title="textvalidation3.gif" alt={1920} align="center" src="/images/validations/validate-element-text/ec83fac-textvalidation3.gif">
  **画像をクリックで拡大**
</Image>

テスト実行後、**Element text validation** ステップが期待するパラメーター値と一致することを確認できます。

<Image title="validation2.png" alt={1842} align="center" src="/images/validations/validate-element-text/6a9b523-validation2.png">
  **画像をクリックで拡大**
</Image>

パラメーターと固定文字列を結合することも可能です。`'Hello ' + userName` のように、`+` で結合してください。

### パラメーターと正規表現の組み合わせ

**Expected value** フィールドで正規表現を返す関数を使うと、パラメーターと Regex を組み合わせられます。

先頭一致（パラメーターで始まる）

```javascript
new RegExp('^' + userName)
```

末尾一致（パラメーターで終わる）

```javascript
new RegExp(userName + '$')
```
