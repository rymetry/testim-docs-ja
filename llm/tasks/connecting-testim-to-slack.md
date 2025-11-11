# 翻訳タスク (connecting-testim-to-slack)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Testim can publish a bug description in a designated Slack channel, which includes detailed description of the bug, including the steps to reproduce the bug, screen resolution and browser, and a screenshot of the bug. To connect Testim to Slack you will have to provide Testim with access permissions as described below.

Before you proceed, make sure you check our [privacy policy](https://www.testim.io/privacy) to learn how we work with your data.

> 📘 This is a pro feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

 :fa-arrow-right: **To Connect Testim to Slack:**

1. Go to **Settings > Bug Tracker**.
2. Make sure you are logged in to Slack and click on the **Slack** logo.
3. Click **Add to Slack**.\
   The following notice is presented:

![](/images/bug-tracker-settings/connecting-testim-to-slack/04ae870-f6257bf-Screen_Shot_2019-11-21_at_21.48.45.png "f6257bf-Screen_Shot_2019-11-21_at_21.48.45.png")

4. Select the designated channel from the drop-down menu and click **Allow**.
5. On the Testim screen, click **Select**.

![](/images/bug-tracker-settings/connecting-testim-to-slack/b42f2d6-slack1.PNG "slack1.PNG")

The Select button will be replaced by **Selected**.  

![](/images/bug-tracker-settings/connecting-testim-to-slack/9781336-slack3.PNG "slack3.PNG")

Setup the bug capture by following the instructions in the [Bug Reporting](/docs/test-management/bug-reporting) guide.
