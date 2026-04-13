---
title: 値の抽出ステップ
description: Web またはモバイルアプリケーションからテキストや値を抽出し、後のステップで使用する方法を学びます。
category: 高度な編集
order: 5037
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/extract-text.htm'
keywords:
  - testim
  - extract-text
  - handling-ui-actions
  - 値の抽出
  - テキスト抽出
  - 要素抽出
  - パラメーター化
  - テスト自動化
  - UI 操作
  - データ抽出
---

Web またはモバイルアプリケーションから直接値をコピーして、後のステップで使用できるようにします

次のような状況を想像してください。アプリケーションにテキストがあり、それが別のページに表示されることを検証したい場合、または後のステップで何らかの計算に使用したい値がある場合。\
これらの質問のいずれかに「はい」と答えた場合、正しい場所に来ました。\
テキストを簡単に抽出して使用する方法を見てみましょう...

## テストに値の抽出ステップを追加する

**テストに値の抽出ステップを追加するには:**

1. 新しいステップを追加したい矢印メニューにカーソルを合わせて、**Testim 定義済みステップ**を選択します。

![定義済みステップ](/images/handling-ui-actions/extract-text/bc506cc-predefined-steps.png)

2. **値の抽出ステップを追加**を検索し、リストからステップを選択します。

![抽出ステップを追加](/images/handling-ui-actions/extract-text/80366ab-add-extract-step.png)

:::warning{title="注意"}
アプリがベース URL で開かれていない場合、上記のステップを実行する前に、最初にベース URL（Web）を開くか、アプリを開く（モバイル）ように指示される場合があります。
:::

![ベース URL を開く](/images/handling-ui-actions/extract-text/376956a-open-base-url.png)

![関連ステップ](/images/handling-ui-actions/extract-text/dcdf523-relevantstep.png)

3. アプリから値を抽出したい**要素**を選択します。Testim は**値の抽出ステップ**を作成し、選択した要素を割り当てます。

![要素を選択](/images/handling-ui-actions/extract-text/9136b57-select-element.png)

4. 値の抽出ステップの**プロパティパネル**を開きます。

![プロパティ](/images/handling-ui-actions/extract-text/1a34b50-properties.png)

5. 変数の**名前**を更新します。デフォルトの名前は「value」です。

![抽出名](/images/handling-ui-actions/extract-text/5ac725a-extract-name.png)

:::warning{title="注意"}
変数名は JavaScript の名前の制限に従います。例えば、スペースや特殊文字は使用できません。詳細は[こちら](https://developer.mozilla.org/ja/docs/Learn/JavaScript/First_steps/Variables)をご覧ください。
:::

## 抽出モードの設定

値の抽出ステップの抽出モードは、抽出変数の内容の値と形式を決定します。以下の抽出モードが利用可能です:

- **文字列全体（デフォルト）**

- **数値**

_最初の数値: 文字列に複数の数値が含まれる場合、リストの最初の数値を返します_

_最後の数値: 文字列に複数の数値が含まれる場合、リストの最後の数値を返します_

_すべての数値（配列）: 文字列に複数の数値が含まれる場合、すべての数値を配列として返します_

- **日付**

_最初の日付: 文字列に複数の日付が含まれる場合、リストの最初の日付を返します_

_最後の日付: 文字列に複数の日付が含まれる場合、リストの最後の日付を返します_

_すべての日付（配列）: 文字列に複数の日付が含まれる場合、すべての日付を配列として返します_

- **正規表現**

_最初の一致: 式に複数の一致が含まれる場合、リストの最初の一致を返します_

_最後の一致: 式に複数の一致が含まれる場合、リストの最後の一致を返します_

_すべての一致（配列）: 式に複数の一致が含まれる場合、すべての一致を配列として返します_

:::warning{title="注意"}

- テキストの一部のみを抽出したい場合は、数値/日付/正規表現に変更してください
- 数値/日付/正規表現を抽出する場合でも、値は文字列になることに注意してください
  :::

**ステップの抽出モードを更新するには:**

1. 値の抽出ステップの**プロパティパネル**を開きます。

![プロパティ](/images/handling-ui-actions/extract-text/f7c15b0-properties.png)

2. 使用したい**抽出モード**を選択します。

![抽出モード](/images/handling-ui-actions/extract-text/90befed-extract-mode.png)

3. **抽出モードの詳細**アイコンをクリックして、特定のタイプの抽出値を選択します。

![抽出モードの詳細](/images/handling-ui-actions/extract-text/05c57d3-extract-mode-details.png)

4. オプションのリストから**抽出モードタイプ**を選択します。

![抽出モードタイプ](/images/handling-ui-actions/extract-text/d38aeb8-extract-mode-type.png)

以下の例では、「Adults(18+)」という文字列が値の抽出ステップによってキャプチャされました。抽出モードを**数値**に設定すると、値「18」のみが抽出変数に返されます。

![数値の例](/images/handling-ui-actions/extract-text/5559177-number-example.png)

## 抽出変数のスコープを設定する

値の抽出ステップが実行されて抽出変数が保存されると、変数の値を使用できるようになります。

- **ローカル**: 変数は、Test Editorでローカルに実行する場合、現在のユーザーのみが使用できます
- **テスト**: 変数は、現在のテストのスコープ内で任意のユーザーが使用できます
- **スイート**: 変数は、テストが属するテストスイート内のすべてのテストで使用できます

**抽出変数のスコープを変更するには:**

1. 値の抽出ステップの**プロパティパネル**を開きます。

![プロパティ](/images/handling-ui-actions/extract-text/e0a2607-properties.png)

2. 抽出変数に適用したい**変数スコープ**を選択します。

![変数スコープ](/images/handling-ui-actions/extract-text/f45a71b-variable-scope.png)

:::warning{title="注意"}
スイートスコープの変数はスイート内のすべてのテスト間で共有されるため、値が別のテストの同じ名前の変数によって上書きされないように、変数に一意の名前を付けてください。
:::

## 抽出した値を使用する

新しいパラメーターは、検証、テキストの設定、カスタムステップなどで使用できます。以下の例では、別のページでテキストを検証するために使用します。
**抽出変数を使用するには:**

1. テキスト検証ステップを記録します。（テキスト検証の詳細は[こちら](/docs/advanced-editing/validations)をご覧ください）
2. テキスト検証ステップの**プロパティパネル**を開きます。

![テキストプロパティ](/images/handling-ui-actions/extract-text/e403d66-text-properties.png)

3. **期待値フィールド**に入力された定数値を、作成したパラメーターに置き換えます。

![変数を使用](/images/handling-ui-actions/extract-text/15ab428-use-variable.png)
