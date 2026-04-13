---
title: 要素テキストの検証
description: 要素に表示されているテキストが期待値と一致するかを検証するステップ。部分一致、完全一致、正規表現など柔軟な検証条件を設定できます。
category: 高度な編集
order: 5005
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/validations/validate-element-text.htm'
keywords:
  - テキスト検証
  - 要素テキスト
  - 文字列確認
  - UI 検証
  - コンテンツ検証
  - テスト
  - 自動化
  - Testim
  - テキストマッチング
  - DOM 検証
---

Element Text 検証は、指定した要素の存在を前提にする点で Element Visible 検証と似ていますが、Element Text 検証ではその要素に表示される「特定のテキスト値」も指定して検証します。複数のテキスト要素をまとめて検証することもできます。\
検証対象のテキストは、固定文字列のほか、正規表現（Regex）、短い JS 式、パラメーターなどで表せます。詳細は [Advanced text validation](/docs/advanced-editing/validations/validate-element-text#advanced-text-validation) を参照してください。

:::note
（Web のみの補足）記録中に、アプリ上のテキストをキーボードショートカットで直接検証として記録できます。Ctrl + 'v' を押して検証したいテキストを選択します。
:::

## Validate element text ステップの追加（Web）

**Element Text 検証を追加するには:**

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

**Element Text 検証を追加するには:**

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

**Validate element text ステップで選択要素を再割り当てするには:**

1. 再割り当てしたいステップの左側の位置にカーソルを合わせ、**Toggle Breakpoint** をクリックします。
2. **Play Scenario** をクリックして、ブレークポイントまでテストを実行します。
3. 対象ステップにカーソルを合わせ、**Show Properties**をクリックします。

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

**Validate element text ステップで検証するテキストを編集するには:**

1. 対象ステップにカーソルを合わせ、**Show Properties**をクリックします。

![スクリーンショット](/images/validations/validate-element-text/4ddc295-screen_shot_2021-04-18_at_6.40.55.png)

右側に Properties パネルが表示されます。

2. **Expected value** フィールドに新しい検証テキストを入力します。

![テキスト設定](/images/validations/validate-element-text/d8459d3-Testim_015b_r.png)

## Advanced text validation

テキスト文字列全体を完全一致で指定するのが難しい場合があります。**Expected Value** フィールドでは、次の組み合わせでテキスト検証を作成できます：

- 正規表現（部分文字列）
- JavaScript 式
- パラメーター

## 正規表現（Regex）を使った検証

Testim は Expected Value 入力フィールドでの Regex をサポートしています。よく使われるケースを以下に示します：

### 前方一致（Starts with）

特定の単語で*始まる*テキストを検証します。残りのテキストが動的であっても検証をパスします：

`/^My text/`

![Regex を使ったテキスト検証](/images/validations/validate-element-text/6ce7739-Ijhqz8PAQMODiuaQYwVv_text-validation-regex.png)

### 後方一致（Ends with）

特定の単語で*終わる*テキストを検証します。残りのテキストが動的であっても検証をパスします：

`/my text$/`

### 部分一致（Contains）

特定の単語を*含む*テキストを検証します。残りのテキストが動的であっても検証をパスします：

`/my text/`

### 複数の選択肢（OR）とパラメーター

2 つの値のいずれかに一致するかを検証します。例えば param1 = "Hello"、param2 = "World" の場合、"Hello" または "World" でパスします：

`new RegExp('^' + '(?:' + param1 + '_' + '|' + param2 + '_' + ')' + '$');`

### 不一致の検証（Not Equal Validation）

テキストが param1 と一致しないことを検証します。例えば param1 = "Example1" の場合、テキストが "Example1" であれば検証は失敗し、それ以外の値はパスします：

`new RegExp("^" + "((?!" + param1 + ").)*$")`

### 数値の検証（正の整数のみ）

テキストが正の整数（数字 0〜9）のみで構成されていることを検証します。例えば "12345" はパスしますが、"12a34" や "-123" は失敗します：

`/^\d+$/`

### 数値の検証（正・負・小数）

正の数、負の数、小数のみで構成されていることを検証します。例えば "123"、"-123"、"3.14"、"-0.5" はパスしますが、"12a" や "." は失敗します：

`/^-?\d+(\.\d+)?$/`

もちろん、必要に応じてその他の有効な Regex も使用できます。

:::note{title="Tips"}
[RegexOne](http://regexone.com/) は正規表現の学習と練習に最適なサイトです。[RegularExpressions 101](https://regex101.com/) は正規表現の作成とテストに役立つツールです。
:::

## JavaScript 式を使った検証

テキストが JavaScript 式の計算結果と等しいことを検証したい場合があります。例えば、テキストに現在の日付が表示されていることを確認するには、**Expected Value** に次の式を設定します：`new Date().toDateString()`。Testim はこの式の計算結果と要素のテキストを比較します。検証が失敗した場合の例を以下に示します：

![JavaScript 式を使った検証](/images/validations/validate-element-text/b1662ca-Screen_Shot_2021-04-18_at_7.06.47.png)

## パラメーターを使った検証

テストまたはスイートレベルで定義されたパラメーター、あるいは設定ファイルで定義されたパラメーターを使用してテキスト要素を検証できます。別のステップで作成したパラメーターを使用する場合は、テストレベルにエクスポートする必要があります（[パラメーターのエクスポートの詳細](/docs/advanced-editing/parameters/exports-parameters)）。

### パラメーターのみ

パラメーターには 2 種類あります:\
HTML: アプリ内の HTML 要素を参照できます。\
JS（JavaScript）: 任意の JS 式を定義できます。**Expected Value フィールドでパラメーターを使用するには:**

1. 以下のいずれかの方法でパラメーターを定義します。

   - **カスタムステップにパラメーターを追加する（Web のみ）** - カスタムステップを作成し、そのカスタムステップにパラメーターを追加できます。詳細な手順については、[カスタム JavaScript ステップのパラメーター](/docs/advanced-editing/parameters/parameters-in-custom-javascript-steps)を参照してください。

   - **テストデータにパラメーターを追加する** - テストの最初のステップである **Setup** ステップに**テストデータ**を追加してパラメーターを定義することもできます。詳細な手順については、[Visual Editor からのデータ駆動テストの設定](/docs/advanced-editing/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor)を参照してください。

   - **設定ファイルにパラメーターを追加する（Web のみ）** - [設定ファイル](/docs/running-tests/configuration-file-run-hooks)にパラメーターを追加できます。詳細な手順については、[設定ファイルを使用したデータ駆動テストの設定](/docs/advanced-editing/data-driven-testing/configuring-data-driven-tests-using-the-config-file)を参照してください。

![Untitled_Project.gif](/images/validations/validate-element-text/fbf2f95-Untitled_Project.gif)

**gif をクリックで拡大**

2. パラメーターのスコープがステップレベルで定義されている場合は、Element Text 検証ステップまたはテストレベルにパラメーターをエクスポートする必要があります。詳細な手順については、[パラメーターのエクスポート](/docs/advanced-editing/parameters/exports-parameters)を参照してください。

例えば、`username` パラメーターに `Hello, John` という値をエクスポートするには、新しいカスタムアクションステップを追加し、エディターに以下を入力します：

```javascript
exportsTest.usename = 'Hello, John';
```

![export_param.gif](/images/validations/validate-element-text/91597d2-export_param.gif)

**gif をクリックで拡大**

3. **Element text validation** ステップを作成し、**Expected value** にパラメーターを指定します。

![textvalidation3.gif](/images/validations/validate-element-text/ec83fac-textvalidation3.gif)

**gif をクリックで拡大**

テスト実行後、**Element text validation** ステップが期待するパラメーター値と一致することを確認できます。

![validation2.png](/images/validations/validate-element-text/6a9b523-validation2.png)

**画像をクリックで拡大**

パラメーターと固定文字列を `+` で結合することも可能です。例えば、`username` パラメーターの値を `Hello, John` ではなく `John` として定義し、Expected Value を `'Hello ' + userName` と指定できます。

### パラメーターと正規表現の組み合わせ

**Expected value** フィールドで正規表現を返す関数を定義することで、パラメーターと Regex を組み合わせられます。\
例えば、パラメーターで**始まる**組み合わせは次のようになります：

```javascript
new RegExp("^" +userName)
```

パラメーターで**終わる**組み合わせは次のようになります：

```javascript
new RegExp(userName+"$")
```
