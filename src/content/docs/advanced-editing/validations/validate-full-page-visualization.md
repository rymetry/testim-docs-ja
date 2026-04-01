---
title: フルページのビジュアル検証
description: ページ全体のピクセルレベルでのビジュアル差異を検証する方法。Applitools との連携により、ベースラインと現在のテスト実行を比較します。
category: 高度な編集
order: 5024
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/validations/validate-full-page-visualization.htm'
keywords:
  - ビジュアル検証
  - applitools
  - フルページ検証
  - ピクセル検証
  - full page validation
  - ページ全体検証
  - ベースライン比較
  - ビジュアルテスト
  - UI 検証
  - Applitools Eyes
---

ピクセルレベルでビジュアルの詳細を検証

**フルページのビジュアル検証**ステップを使用すると、ベースラインと現在のテスト実行の間で、特定の要素のビジュアル差異を比較できます。この機能は [Applitools](https://applitools.com) のサービスとして提供されており、Applitools Eyes アプリとの連携が必要です。詳細については、[ビジュアル検証（要素、ビューポート、フルページ）](/docs/pixel-validation-and-pixel-wait-for) をご覧ください。

:::warning{title="Applitools ライセンスについて"}
RCA および Ultrafast Test Cloud（追加環境の追加）機能は、適切なライセンスなしでは Applitools によって拒否されます。詳細については、Applitools の担当者にお問い合わせください。
:::

:::info{title="PRO機能"}
この機能は Professional plan のプロジェクトでのみ利用できます。
:::

:::note{title="テスト設定の変更について"}
テストの設定を変更すると、Applitools では Testim では新しいベースラインが作成されますが、Testim では作成されません。各設定ごとに新しいベースラインが必要な場合は、それぞれ個別のテストを作成する必要があります。
:::

## フルページのビジュアル検証ステップの追加

この 2 つのステップを使うと、ビューポートまたはページ全体について、ベースラインと現在のテスト実行のビジュアル差異を比較できます。→ **フルページのビジュアル検証ステップを追加するには:**

1. 検証を追加したい位置の矢印記号にマウスを合わせます。

   ![矢印記号](/images/visual-validations/validate-full-page-visualization/2760163-Testim_275b.png)

   **アクションオプション**が表示されます。

   ![アクションオプション](/images/visual-validations/validate-full-page-visualization/3bc96ed-Testim_267a_r.png)

2. 「**M**」（Testim 定義済みステップ）をクリックします。

   **定義済みステップ**メニューが開きます。

   ![定義済みステップメニュー](/images/visual-validations/validate-full-page-visualization/8957b3e-Testim_270_r.png)

3. **検証**をクリックします。

   **検証**メニューが展開されます。

   ![検証メニュー](/images/visual-validations/validate-full-page-visualization/d74c896-Testim_271_r.png)

4. メニューをスクロールして、**フルページのビジュアル検証**を選択します。

:::info
メニュー上部の検索ボックスから**フルページのビジュアル検証**を検索することもできます。
:::

5. ビジュアル検証ステップが**エディター**に追加され、選択した要素のサムネイルがステップに表示されます。

テストを実行すると、ベースラインのビジュアライゼーションがテスト実行時のものと比較されます。ビジュアル検証の失敗によりステップが失敗した場合は、失敗したビジュアル検証ステップをダブルクリックして、Applitools Eyes で詳細を開いてください。

:::tip
**ビューポートのビジュアル検証**ステップまたは**フルページのビジュアル検証**ステップの追加には、キーボードショートカットも使用できます。詳細は [キーボードショートカット](/docs/keyboard-shortcuts) をご覧ください。
:::
