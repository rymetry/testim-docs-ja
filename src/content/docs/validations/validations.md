---
title: '検証'
description: '原文: https://help.testim.io/docs/validations'
category: '検証'
order: 1
updated: '2025-11-02'
keywords:
  - testim
  - validations
  - validations
---
期待どおりの結果が得られたことを検証する

アプリのテストでは、手順が正しく実行されたかどうかだけでは不十分な場合が多くあります。多くのケースで、テストステップの結果として期待した状態になっているかを検証したいでしょう。例えばログイン後、ページヘッダーに正しいユーザー名が表示されているかを確認する、などです。\
Testim では次の種類の検証を利用できます。

* **[Page Accessibility Validation](/docs/accessibility-validations/accessibility-validations)** — ページのアクセシビリティを検証します。
* **[Element Accessibility Validation](/docs/accessibility-validations/element-accessibility-validation)** — ページ要素のアクセシビリティを検証します。
* **[Validate Element Visualization](/docs/visual-validations/validate-element-visualization)** — 要素のビジュアルを検証します。
* **[Validate Viewport Visualization](/docs/visual-validations/validate-viewport-visualization)** — ビューポートのビジュアルを検証します。
* **[Validate Full Page Visualization](/docs/visual-validations/validate-full-page-visualization)** — ページ全体のビジュアルを検証します。
* **[Wait for Element Visualization](/docs/visual-validations/wait-for-element-visualization)** — 要素のビジュアルが条件を満たすまで待機します。
* **[Validate element visible](/docs/validations/validate-element-visible)** — 期待する要素が可視であることを検証します。
* **[Validate element not visible](/docs/validations/validate-element-not-visible)** — 要素が不可視であることを検証します。
* **[Validate element text](/docs/validations/validate-element-text)** — 期待するテキストが表示されていることを検証します。
* **[Add custom validation](/docs/validations/custom-code)** — カスタムスクリプトで高度な検証を作成します。
* **[Validate using custom code](/docs/validations/custom-code-1)** — カスタムコードのテストステップを作成します。
* **[Validate download](/docs/validations/validate-download)** — ダウンロード内容が期待どおりであることを検証します。
* **[Validate email](/docs/validations/email-validation)** — サインアップやログインのフローでメールを検証します。
* **[Validate CSS property](/docs/validations/css-property-validation)** — 要素の任意の CSS プロパティを検証します。
* **[Validate HTML attribute](/docs/validations/html-attribute-validation)** — アプリ内の任意の HTML 属性を検証します。
* **[Validate checkbox](/docs/validations/checkbox-and-radio-button-validation)** — チェックボックスがオン/オフであることを検証します。
* **[Validate radio button](/docs/validations/checkbox-and-radio-button-validation)** — ラジオボタンがオン/オフであることを検証します。
* **[Validate API](/docs/advanced-features/api-testing#api-validation)** — UI の要素と API レスポンス値を突き合わせて検証します。
* **[Visual validation (element, viewport, full-page)](/docs/validations/pixel-validation-and-pixel-wait-for)** — ピクセルレベルでビジュアル差異を検証します。
* **[Add network validation](/docs/validations/add-network-validation)** — ネットワークリクエストが期待どおりに実行されたかを検証します。
* **[Add CLI validations and actions](/docs/validations/add-cli-validations-and-actions)** — テスト内から Node.js スクリプトを実行します。
* **[File upload step validation](/docs/validations/file-upload-step)** — ファイルアップロード操作を検証します。
* **[MonboDB validation](/docs/validations/mongodb-validation)** — CLI アクションステップで MongoDB を検証します。
* **[My SQL validation](/docs/validations/mysql-validation)** — CLI アクションステップと SQL で MySQL を検証します。

## 検証ステップの表示

検証ステップを追加すると、エディター上で新しいステップとして表示され、ステップ左上のアイコンで種別が示されます。検証タイプごとに異なるアイコンが使用されます。以下は一部の例です。

**Validate element visible**

![](/images/validations/validations/9dc088f-Testim_019_r.png "Testim 019_r.png")

**Validate element text**

![](/images/validations/validations/f7cbcdc-Testim_021_r.png)

**Custom validation**

![](/images/validations/validations/3260e0d-Testim_018_r.png)

## 検証のテスト結果

テスト実行時、各検証ステップは検証条件の一致有無に応じて pass/fail になります。

検証がパスすると、ステップ左上のアイコンが緑になり、Properties パネルにパスした旨のメッセージが表示されます。

![](/images/validations/validations/9373384-3280147-Screen_Shot_2021.jpg)

検証が失敗すると、ステップ左上のアイコンが赤になり、Properties パネルには失敗メッセージが表示されます。加えて、エディター上部に赤いバーが表示され、失敗したステップの期待値と実際値が示されます。**See error** リンクをクリックすると、完全なエラーメッセージを確認できます。

![](/images/validations/validations/ecfa22f-Screen_Shot_2021-04-18_at_6.35.08.png "Screen Shot 2021-04-18 at 6.35.08.png")

詳細は [Test results](/docs/results/test-results) を参照してください。
