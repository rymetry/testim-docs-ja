---
title: ページアクセシビリティ検証
description: Web ページ全体のアクセシビリティレベルをチェックし、アクセシビリティ違反を特定する方法を解説します。
category: 高度な編集
order: 5020
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/validations/accessibility-validations.htm'
keywords:
  - アクセシビリティ
  - WCAG
  - Axe Core
  - 検証
  - アクセシビリティ準拠
  - ページ検証
  - 影響レベル
  - アクセシビリティレポート
  - Deque
  - Chrome
---

**ページアクセシビリティ検証**ステップを使用すると、Web ページのアクセシビリティレベルをチェックし、アクセシブルにできたはずだが実装されていない要素を特定できます。アクセシビリティチェックは、以下のルールに基づいています: [https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)

:::info{title="これはPRO機能です"}
この機能は Professional plan のプロジェクトでのみ利用できます。
:::

:::note
ページアクセシビリティ検証ステップ機能は、Chrome ブラウザを使用している場合にのみ利用可能です。
:::

:::info{title="アクセシビリティ検証サポート"}
Testim のアクセシビリティステップは、業界をリードするアクセシビリティライブラリの 1 つである [Deque 社のライブラリ](https://www.deque.com/axe/) を使用しています。検出される違反はアプリケーションコードに起因することが多いため、個別問題への対処は Testim サポートの範囲外です。コード修正によるアクセシビリティ違反の是正で課題がある場合は、[上記ライブラリのイシューページ](https://www.deque.com/axe/) で相談することをお勧めします。アクセシビリティの専門家から、問題解決のためのガイダンスや解決策を得られます。
:::

## ページアクセシビリティ検証ステップの追加

ページアクセシビリティ検証ステップは、テスト対象のページが AUT（Application Under Test）で開かれている箇所に配置する必要があります。テストで複数のページに移動する場合は、対象ページが開かれているテストシーケンスにステップを配置してください。

:::note
2022 年 1 月以前に作成されたステップは共有されていません。共有するには、再度記録してください。
:::

**ページアクセシビリティ検証ステップを追加するには:**

1. ステップを追加したい場所の矢印記号にマウスオーバーします。

![矢印記号にマウスオーバー](/images/accessibility-validations/accessibility-validations/04ebd5b-Testim_340a.png)

アクションオプションが表示されます。

![アクションオプション](/images/accessibility-validations/accessibility-validations/4b0c617-Testim_283a_r_action_options.png)

2. **Toggle Breakpoint**ボタンをクリックします。

![Toggle Breakpoint ボタン](/images/accessibility-validations/accessibility-validations/96c08f9-Testim_341_r.png)

3. **Run test**ボタンをクリックして、ブレークポイントまでテストを実行します。

![Run test ボタン](/images/accessibility-validations/accessibility-validations/c1f821e-Testim_342a.png)

4. 再度矢印記号にマウスオーバーし、「M」（Testim 定義済みステップ）をクリックします。

定義済みステップメニューが開きます。

![定義済みステップメニュー](/images/accessibility-validations/accessibility-validations/ea60818-Testim_270_r2_predefined_steps.png)

5. **Validations**をクリックします。

検証メニューが展開されます。

![検証メニュー](/images/accessibility-validations/accessibility-validations/e0f49dc-Testim_271_r2_validations_menu.png)

6. メニューをスクロールして**Validate page accessibility**を選択します。

:::note
または、メニュー上部の検索ボックスを使用して「Validate page accessibility」を検索できます。
:::

エディターにページアクセシビリティ検証ステップが追加されます。

![ページアクセシビリティ検証ステップ](/images/accessibility-validations/accessibility-validations/e967a00-Testim_343a.png)

7. 新しく作成されたステップにマウスオーバーし、**プロパティを表示**（歯車アイコン）をクリックします。

![プロパティを表示アイコン](/images/accessibility-validations/accessibility-validations/170105b-Testim_344a.png)

右側にプロパティパネルが開きます。

![プロパティパネル](/images/accessibility-validations/accessibility-validations/04ae060-Screen_Shot_2021-12-16_at_9.42.42.png)

8. 以下の説明に従ってプロパティを設定します。

**Description** – ステップの説明。（デフォルト = Page accessibility validation）

**Fail test from impact level** – テストを失敗とする最小影響レベル。Critical / Serious / Moderate / Minor の 4 段階から選択します（それぞれ重大、深刻、中程度、軽微 に相当）。デフォルト値は Minor です。影響レベルの詳細は下記の表を参照してください。

- **Run only specific tags** – このフィールドをクリックして、テストしたいプロトコルをドロップダウンから選択します。下記の表を参照してください。デフォルトではすべてのタグが選択されています。
- **Exclude specific rule IDs** – 特定のルール ID を除外したい場合は、リストから選択します。また、特定のルール ID のみをチェックしたい場合は、すべてを選択してからテストしたいもののみを選択解除できます。
- **When this step fails** – ステップが失敗した場合の動作を指定します。
- **When to run step** – ステップを実行する条件を指定します。詳細は[条件分岐](/docs/editing-tests/conditions)を参照してください。
- **Override timeout** – Testim がテストステップの失敗を登録するデフォルトのタイムアウト設定を上書きし、異なるタイムアウト値（ミリ秒単位）を指定できます。

9. 検証ステップの後の**Toggle Breakpoint**ボタンをクリックして、ブレークポイントを解除します。

テストを実行すると、設定したパラメーターに基づいてページのアクセシビリティレベルがチェックされます。アクセシビリティ違反が見つかってステップが失敗した場合、アクセシビリティレポートを表示して詳細な結果を確認できます。

## ページアクセシビリティ結果の表示

ページアクセシビリティ検証ステップを含むテストを実行した後、アクセシビリティ違反が見つかった場合、「Step Failed: Accessibility violations were found」というエラーメッセージが表示され、詳細なアクセシビリティ違反結果を確認できます。
**ページアクセシビリティ結果を表示するには:**

1. 失敗したページアクセシビリティ検証ステップにマウスオーバーし、**プロパティを表示**（歯車アイコン）をクリックします。

![失敗したステップのプロパティ表示](/images/accessibility-validations/accessibility-validations/791f79c-Testim_345a.png)

右側にプロパティパネルが開きます。

2. プロパティパネルで、**Check here for more details**リンクをクリックします。

![Check here for more details リンク](/images/accessibility-validations/accessibility-validations/08c719f-Screen_Shot_2021-12-20_at_8.27.57.png)

:::note
または、エラーパネルで**Accessibility report**リンクをクリックすることもできます。
:::

![Accessibility report リンク](/images/accessibility-validations/accessibility-validations/2b2619c-Testim_345b.png)

アクセシビリティ結果ウィンドウが表示され（以前に選択した影響レベルに基づいて）、アクセシビリティ問題のリスト、検出された発生回数、影響レベルが表示されます。

![アクセシビリティ結果ウィンドウ](/images/accessibility-validations/accessibility-validations/f450ae7-Testim_348z_r.png)

すべての影響レベルに基づいて見つかったアクセシビリティ問題を表示したい場合は、**All impact level**トグルをクリックします。

![All impact level トグル](/images/accessibility-validations/accessibility-validations/7e6519c-Testim_349za_r.png)

3. 結果を CSV ファイルとしてダウンロードしたい場合は、ダウンロードアイコンをクリックします。（CSV ファイルには、合格したものを含むすべてのアクセシビリティテストの結果が含まれます。）

![ダウンロードアイコン](/images/accessibility-validations/accessibility-validations/f155939-Testim_349zb_r.png)

4. いずれかの結果の横にある下矢印をクリックすると、以下の詳細情報が表示されます: 説明、問題の修正方法、要素の CSS セレクター。

![アクセシビリティ問題の詳細](/images/accessibility-validations/accessibility-validations/47bcc8a-Testim_350a_r2.png)

5. アクセシビリティ問題の発生が複数見つかった場合は、要素の CSS セレクターセクションの矢印をクリックして、問題の異なるインスタンスを表示します。

![複数のインスタンス表示](/images/accessibility-validations/accessibility-validations/09ff7dd-Testim_350b_r2.png)

## ルールの説明

Testim は、要素のアクセシビリティレベルをチェックするために以下のライブラリを使用しています: [https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
各ルールには、関連する影響レベル（Critical / Serious / Moderate / Minor の 4 段階 — それぞれ重大、深刻、中程度、軽微 に相当）と関連するタグがあります。アクセシビリティチェックを設定する際、特定のタグや影響レベルに限定してチェックすることができます。
