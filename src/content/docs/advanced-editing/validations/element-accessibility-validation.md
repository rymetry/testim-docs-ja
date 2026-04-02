---
title: 要素アクセシビリティ検証
description: Web ページ上の特定の要素がアクセシブルかどうかをチェックし、アクセシビリティ違反を特定する方法を解説します。
category: 高度な編集
order: 5021
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/validations/element-accessibility-validation.htm'
keywords:
  - アクセシビリティ
  - 要素検証
  - WCAG
  - Axe Core
  - アクセシビリティ準拠
  - 要素レベル検証
  - 影響レベル
  - アクセシビリティレポート
  - Chrome
  - Edge Chromium
---

アクセシブルな Web ページとは、障害や機能制限を持つ人々が利用できるように設計された Web ページのことです。米国や欧州のほとんどの組織では、アクセシビリティ準拠が求められています。

**要素アクセシビリティ検証**ステップを使用すると、Web ページ上の特定の要素がアクセシブルにできたはずだが実装されていないかどうかをチェックできます。アクセシビリティチェックは、以下のルールに基づいています: [https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)

:::info{title="これはPRO機能です"}
この機能は Professional plan のプロジェクトでのみ利用できます。
:::

:::note
このステップは Chrome または Edge Chromium でのみ実行できます。
:::

:::info{title="アクセシビリティ検証サポート"}
Testim のアクセシビリティステップは、業界をリードするアクセシビリティライブラリの 1 つである[Deque 社の Axe Core](https://www.deque.com/axe/)を使用しています。アクセシビリティステップ内で検出される純粋なアクセシビリティ違反は、主にアプリケーションコードに関連するものです。そのため、これらの特定の問題への対処は、Testim サポートの範囲外となります。コード修正によるアクセシビリティ違反の是正に課題がある場合は、[Deque Axe-Core](https://www.deque.com/axe/)の issues ページにサポートを求めることをお勧めします。アクセシビリティの専門家として、これらの問題に効果的に対処するための専門的なガイダンスとソリューションを提供できます。
:::

## 要素アクセシビリティ検証ステップの追加

:::note
2022 年 1 月以前に作成されたステップは共有されていません。共有するには、再度記録してください。
:::

**要素アクセシビリティ検証ステップを追加するには:**

1. ステップを追加したい場所の矢印記号にマウスオーバーします。

![矢印記号にマウスオーバー](/images/accessibility-validations/element-accessibility-validation/4a5271a-Testim_357a.png)

アクションオプションが表示されます。

![アクションオプション](/images/accessibility-validations/element-accessibility-validation/e69c262-Testim_358a_r.png)

2. **Toggle Breakpoint**ボタンをクリックします。

![Toggle Breakpoint ボタン](/images/accessibility-validations/element-accessibility-validation/848348d-Testim_359_r.png)

3. **Run test**ボタンをクリックして、ブレークポイントまでテストを実行します。

![Run test ボタン](/images/accessibility-validations/element-accessibility-validation/6ce633c-Testim_360a.png)

4. 再度矢印記号にマウスオーバーし、「M」（Testim 定義済みステップ）をクリックします。

定義済みステップメニューが開きます。

![定義済みステップメニュー](/images/accessibility-validations/element-accessibility-validation/238c2a5-Testim_270_r2_predefined_steps.png)

5. **Validations**をクリックします。

検証メニューが展開されます。

![検証メニュー](/images/accessibility-validations/element-accessibility-validation/e797323-Testim_271_r2_validations_menu.png)

6. メニューをスクロールして**Validate element accessibility**を選択します。

:::note
または、メニュー上部の検索ボックスを使用して「Validate element accessibility」を検索できます。
:::

7. AUT ウィンドウで、アクセシビリティを検証したい関連要素を特定し、クリックして選択します。

エディターに要素アクセシビリティ検証ステップが追加されます。

![要素アクセシビリティ検証ステップ](/images/accessibility-validations/element-accessibility-validation/2d66ca3-Testim_361a.png)

8. 新しく作成されたステップにマウスオーバーし、**プロパティを表示**（歯車アイコン）をクリックします。

![プロパティを表示アイコン](/images/accessibility-validations/element-accessibility-validation/3095c4a-Testim_362a.png)

右側にプロパティパネルが開きます。

![プロパティパネル](/images/accessibility-validations/element-accessibility-validation/2b9a324-Screen_Shot_2021-12-22_at_6.15.33.png)

9. 以下の説明に従ってプロパティを設定します。

**Description** – ステップの説明。（デフォルト = Accessibility validation）

**Fail test from impact level** – テストを失敗とする最小影響レベル。オプション: Critical、Serious、Moderate、Minor。（デフォルト = Minor）

- **Run only specific tags** – このフィールドをクリックして、テストしたいプロトコルをドロップダウンから選択します。[下記の表](/docs/advanced-editing/validations/accessibility-validations#ルールの説明)を参照してください。デフォルトではすべてのタグが選択されています。
- **Exclude specific rule IDs** – 特定のルール ID を除外したい場合は、リストから選択します。また、特定のルール ID のみをチェックしたい場合は、すべてを選択してからテストしたいもののみを選択解除できます。
- **When this step fails** – ステップが失敗した場合の動作を指定します。
- **When to run step** – ステップを実行する条件を指定します。詳細は[条件分岐](/docs/editing-tests/conditions)を参照してください。
- **Override timeout** – Testim がテストステップの失敗を登録するデフォルトのタイムアウト設定を上書きし、異なるタイムアウト値（ミリ秒単位）を指定できます。
- **Disable auto-scroll** – ビューポート外に存在する要素への自動スクロールを無効にします。

![要素アクセシビリティ検証の設定](/images/accessibility-validations/element-accessibility-validation/48398ce-element_accessibility_validation.gif)

10. 検証ステップの後の**Toggle Breakpoint**ボタンをクリックして、ブレークポイントを解除します。

テストを実行すると、選択した要素のアクセシビリティレベルが設定したパラメーターに基づいてチェックされます。アクセシビリティ違反が見つかってステップが失敗した場合、アクセシビリティレポートを表示して詳細な結果を確認できます。

## 要素アクセシビリティ結果の表示

要素アクセシビリティ検証ステップを含むテストを実行した後、アクセシビリティ違反が見つかった場合、「Step Failed: Accessibility violations were found」というエラーメッセージが表示され、詳細なアクセシビリティ違反結果を確認できます。
**要素アクセシビリティ結果を表示するには:**

1. 失敗した要素アクセシビリティ検証ステップにマウスオーバーし、**プロパティを表示**（歯車アイコン）をクリックします。

![失敗したステップのプロパティ表示](/images/accessibility-validations/element-accessibility-validation/b3cc849-Testim_364a.png)

右側にプロパティパネルが開きます。

2. プロパティパネルで、**Check here for more details**リンクをクリックします。

![Check here for more details リンク](/images/accessibility-validations/element-accessibility-validation/fe90831-Testim_365a_r.png)

:::note
または、エラーパネルで**Accessibility report**リンクをクリックすることもできます。
:::

![Accessibility report リンク](/images/accessibility-validations/element-accessibility-validation/b5fd0af-Testim_364b.png)

アクセシビリティ結果ウィンドウが表示され（以前に選択した影響レベルに基づいて）、アクセシビリティ問題のリスト、検出された発生回数、影響レベルが表示されます。

![アクセシビリティ結果ウィンドウ](/images/accessibility-validations/element-accessibility-validation/2d4772e-Testim_366_r.png)

すべての影響レベルに基づいて見つかったアクセシビリティ問題を表示したい場合は、**All impact levels**トグルをクリックします。

![All impact levels トグル](/images/accessibility-validations/element-accessibility-validation/136f7ef-Testim_366a_r.png)

3. 結果を CSV ファイルとしてダウンロードしたい場合は、ダウンロードアイコンをクリックします。（CSV ファイルには、合格したものを含むすべてのアクセシビリティテストの結果が含まれます。）

![ダウンロードアイコン](/images/accessibility-validations/element-accessibility-validation/ecca0de-Testim_366b_r.png)

4. いずれかの結果の横にある下矢印をクリックすると、以下の詳細情報が表示されます: 説明、問題の修正方法、要素の CSS セレクター。

![アクセシビリティ問題の詳細](/images/accessibility-validations/element-accessibility-validation/b81df21-Testim_367a_r.png)

5. アクセシビリティ問題の発生が複数見つかった場合は、要素の CSS セレクターセクションの矢印をクリックして、問題の異なるインスタンスを表示します。

![複数のインスタンス表示](/images/accessibility-validations/element-accessibility-validation/edadefa-Testim_350b_r2.png)

## ルールの説明

Testim は、要素のアクセシビリティレベルをチェックするために以下のライブラリを使用しています: [https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
各ルールには、関連する影響レベル（Critical、Serious、Moderate、Minor など）と関連するタグがあります。アクセシビリティチェックを設定する際、特定のタグや影響レベルに限定してチェックすることができます。
