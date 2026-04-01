---
title: 要素のビジュアライゼーション待機
description: 要素のビジュアライゼーションが条件を満たすまで待機する方法。Applitools との連携により、ビジュアルマッチングを実現します。
category: 高度な編集
order: 5025
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/validations/wait-for-element-visualization.htm'
keywords:
  - ビジュアル検証
  - applitools
  - 要素待機
  - wait for
  - visual validation
  - ビジュアルマッチング
  - レンダリング待機
  - DOM 検証
  - ベースライン
  - Applitools Eyes
---

ピクセルレベルでビジュアルの詳細を検証

**要素のビジュアライゼーション待機**ステップを使用すると、テストは次のステップに進む前に特定のイベントが発生するまで一時停止して待機します。要素のビジュアライゼーション待機ステップの場合、Testim は要素がページ上に表示されるまで待機し、その後ビジュアルレベルで要素を検証します。

ビジュアル検証および待機ステップを使用すると、ベースラインと現在のテスト実行のビジュアルの差異を高精度で比較できます。比較方法をカスタマイズするためにいくつかのパラメーターを変更できます。この機能は [Applitools](https://applitools.com) のサービスとして提供されており、Applitools Eyes アプリとの連携が必要です。

**ビジュアル検証タイプ：**

- **Element Visualization** — 特定の要素に対するビジュアル検証。
- **Viewport Visualization** — ビューポートに対するビジュアル検証。
- **Full-page Visualization** — ページ全体に対するビジュアル検証。

:::warning{title="Applitools ライセンスについて"}
RCA および Ultrafast Test Cloud（追加環境の追加）機能は、適切なライセンスなしでは Applitools によって拒否されます。詳細については、Applitools の担当者にお問い合わせください。
:::

:::info{title="PRO機能"}
この機能は Professional plan のプロジェクトでのみ利用できます。
:::

:::note{title="テスト設定の変更について"}
テストの設定を変更すると、Applitools では Testim では新しいベースラインが作成されますが、Testim では作成されません。各設定ごとに新しいベースラインが必要な場合は、それぞれ個別のテストを作成する必要があります。
:::

## 要素のビジュアライゼーション待機ステップの追加

**要素のビジュアライゼーション待機ステップを追加するには:**

1. 検証を追加したい位置の **（矢印記号）** にカーソルを合わせます。

![ステップ追加矢印](/images/visual-validations/wait-for-element-visualization/e9b93ef-Testim_276b.png)

**アクションオプション**が表示されます。

![アクションオプション](/images/visual-validations/wait-for-element-visualization/abc8595-Testim_267a_r.png)

2. **Toggle breakpoint** ボタンをクリックします。

![Toggle breakpoint ボタン](/images/visual-validations/wait-for-element-visualization/e46753b-Testim_268_r.png)

3. **Run test** ボタンをクリックして、ブレークポイントまでテストを実行します。

![Run test ボタン](/images/visual-validations/wait-for-element-visualization/25f5431-Testim_277b.png)

4. 再び **（矢印記号）** にカーソルを合わせ、「**M**」（Testim 定義済みステップ）をクリックします。\
   **Predefined steps** メニューが開きます。

![Predefined steps メニュー](/images/visual-validations/wait-for-element-visualization/2ab8794-Testim_270_r.png)

5. **Wait For** をクリックします。\
   **Wait For** メニューが展開されます。

![Wait For メニュー](/images/visual-validations/wait-for-element-visualization/1140ec5-Testim_278_r.png)

6. メニューをスクロールして **Wait for element visualization** を選択します。

:::info
メニュー上部の検索ボックスから **Wait for element visualization** を検索することもできます。
:::

7. **AUT** ウィンドウで、待機したい要素を特定し、クリックして選択します。\
   「Wait for element visualization」ステップが**エディター**に追加され、選択した要素のサムネイルがステップに表示されます。

![エディターに追加されたステップ](/images/visual-validations/wait-for-element-visualization/974471e-Testim_279a.png)

8. 待機ステップの後にある **Toggle Breakpoint** ボタンをクリックしてブレークポイントを削除します。\
   テストを実行すると、要素のビジュアルがベースラインと比較されます。ビジュアル検証の失敗でステップが失敗した場合は、失敗した Wait for element visualization ステップをダブルクリックして Applitools Eyes で詳細を確認してください。
