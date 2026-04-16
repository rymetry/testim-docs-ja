---
title: Test Flow View
description: 'Test Flow View は、テストのグラフィカルなフローベースの可視化を提供する Testim Labs 機能です。テスト構造の理解、共通パターンの特定、ステップへの直接アクセスが可能です。'
category: Testim Labs
order: 20002
updated: '2025-11-02'
sourceUrl: 'https://docs.tricentis.com/testim/content/testim-labs/test-flow-view.htm'
keywords:
  - Test Flow View
  - ビジュアライゼーション
  - フローグラフ
  - テスト構造
  - Testim Labs 機能
---

:::info{title="Testim Labs 機能"}
Testim Labs に参加している場合は、**Settings > Labs** でこの機能が有効になっていることを確認してください。Testim Labs と参加方法の詳細については、[Testim Labs について](/docs/testim-labs/testim-labs)を参照してください。
:::

**Test Flow View**は、テストのグラフィカルなフローベースのビジュアライゼーションを提供します。

Test Flow View を使用すると、次のことができます:

- テストがどのように構築されているかを理解する
- サイズを評価する
- 共通のパターンと重複を特定する（テストの開始時の Shared Steps の共通パターンが統合されます）
- 特定のテストステップに直接アクセスする

Test Flow View にアクセスするには、**Test List > Tests** に移動し、右上隅のグラフビューを選択します。

![Test Flow View へのアクセス方法を示す画面。Test List から Tests を選択し、右上隅のグラフビューアイコンをクリック](/images/miscellaneous/test-flow-view/a73e9a6-Screen_Shot_2021-02-18_at_9.15.43.png)

- プロジェクトは最初に正方形のアイコンで表されます
- 各 Shared Step は六角形のアイコンで表されます
- 通常のステップは円で表されます
- フローの開始時に、同じ Shared Steps のシーケンスで始まるすべてのテストは、フローに分岐があるまで統合されます

![Test Flow View の要素表現を示す画面。プロジェクト（正方形）、Shared Step（六角形）、通常ステップ（円）がフローで表示](/images/miscellaneous/test-flow-view/0b73a63-Screen_Shot_2021-02-18_at_9.16.54.png)

## Test Flow View のコントロール

- **パン** - グラフをドラッグしてプロジェクトのさまざまな部分を表示します
- **ズームイン/アウト** - スクロールホイールを使用してズームイン/アウトします
- **詳細** - ステップにカーソルを合わせてテスト名を表示します

![Test Flow View のコントロール操作を示す画面。パン、ズーム、ホバーで詳細表示などの操作方法](/images/miscellaneous/test-flow-view/f4a5230-Untitled.png)

- **ステップアクセス** - ステップ（円）をクリックすると、そのステップが選択され、プロパティパネルが開いた状態で新しいタブに表示されます

![Test Flow View でステップ（円）をクリックして直接アクセスする手順を示す GIF アニメーション](/images/miscellaneous/test-flow-view/23a5cbe-Oct-29-2020_11-05-58.gif)

- **Shared Step アクセス** - Shared Step（六角形）をクリックすると、この Shared Step を使用するテストのみにフィルタリングされた状態で、新しいタブにテストライブラリが開きます

![Test Flow View で Shared Step（六角形）をクリックしてフィルタリングされたテストライブラリを開く手順を示す GIF アニメーション](/images/miscellaneous/test-flow-view/72371e7-Feb-18-2021_09-27-55.gif)
