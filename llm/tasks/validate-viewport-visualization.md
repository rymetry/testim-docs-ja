# 翻訳タスク (validate-viewport-visualization)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

ピクセルレベルでビジュアルの詳細を検証

**ビューポートのビジュアル検証**を使用すると、ビューポートのベースラインと現在のテスト実行の間でビジュアル差異を比較できます。この機能は [Applitools](https://applitools.com) のサービスとして提供されており、Applitools Eyesアプリとの連携が必要です。詳細については、[ビジュアル検証（要素、ビューポート、フルページ）](/docs/validations/pixel-validation-and-pixel-wait-for) をご覧ください。

:::warning{title="Applitoolsライセンスについて"}
RCAおよびUltrafast Test Cloud（追加環境の追加）機能は、適切なライセンスなしではApplitoolsによって拒否されます。詳細については、Applitoolsの担当者にお問い合わせください。
:::

:::info{title="PRO機能"}
この機能はプロフェッショナルプランでのみ利用できます。プロフェッショナルプランの詳細については、[こちら](https://www.testim.io/pricing/) をご覧ください。
:::

## ビューポートのビジュアル検証ステップの追加

**ビューポートのビジュアル検証またはフルページのビジュアル検証ステップを追加するには:**

1. 検証を追加したい位置の矢印記号にマウスを合わせます。

   ![矢印記号](/images/visual-validations/validate-viewport-visualization/2760163-Testim_275b.png)

   **アクションオプション**が表示されます。

   ![アクションオプション](/images/visual-validations/validate-viewport-visualization/3bc96ed-Testim_267a_r.png)

2. 「**M**」（Testim定義済みステップ）をクリックします。

   **定義済みステップ**メニューが開きます。

   ![定義済みステップメニュー](/images/visual-validations/validate-viewport-visualization/8957b3e-Testim_270_r.png)

3. **検証**をクリックします。

   **検証**メニューが展開されます。

   ![検証メニュー](/images/visual-validations/validate-viewport-visualization/d74c896-Testim_271_r.png)

4. メニューをスクロールして、**ビューポートのビジュアル検証**を選択します。

:::info
メニュー上部の検索ボックスから**ビューポートのビジュアル検証**または**フルページのビジュアル検証**を検索することもできます。
:::

5. ビジュアル検証ステップが**エディター**に追加され、選択した要素のサムネイルがステップに表示されます。

テストを実行すると、ベースラインのビジュアライゼーションがテスト実行時のものと比較されます。ビジュアル検証の失敗によりステップが失敗した場合は、失敗したビジュアル検証ステップをダブルクリックして、Applitools Eyesで詳細を開いてください。

:::tip
**ビューポートのビジュアル検証**ステップの追加には、キーボードショートカットも使用できます。詳細は [キーボードショートカット](/docs/miscellaneous/keyboard-shortcuts) をご覧ください。
:::
