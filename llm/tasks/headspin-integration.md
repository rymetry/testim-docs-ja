# 翻訳タスク (headspin-integration)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Run mobile tests you create with Testim on HeadSpin

This article will review how to set your Headspin grid on Testim and how to run your tests.

## How to add a HeadSpin grid

:fa-arrow-right: **To add a HeadSpin Grid:**

1. Follow the instructions in the [Adding a grid](https://help.testim.io/docs/grid-management#adding-a-grid) section, while selecting the **Testim HeadSpin Mobile** option as the **Grid Type**.
2. Click **Next**.
3. Update the following fields:

- **Name**: The grid name to use at run time.
- **API Token**: The API Token generated through HeadSpin. See below more details.  

![1280](/images/grid-management/headspin-integration/29244fe-2023-01-29_17-51-47.gif "2023-01-29_17-51-47.gif")

## How to obtain the HeadSpin API Token

:fa-arrow-right: **To obtain the HeadSpin API Token:**

1. Login to your HeadSpin account.
2. On the top-right of the screen, click on your user name.

![1318](/images/grid-management/headspin-integration/689ab5c-2023-01-29_18-01-05.png "2023-01-29_18-01-05.png")

3. Click the **Settings** button.  
4. Under **User Settings** in the API Token section, copy an existing token or create a new token by clicking the **+New Token** button.
5. Copy the API Token and paste it into the API Token field in Testim.
