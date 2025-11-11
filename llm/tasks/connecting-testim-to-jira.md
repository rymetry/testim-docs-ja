# 翻訳タスク (connecting-testim-to-jira)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Testim creates a new Bug ticket, which includes a detailed description of the bug, including the steps to reproduce the bug, screen resolution and browser, and a screenshot of the bug. The screenshot below shows an example of a Bug Ticket that was opened, including the description, screenshot, etc. For more information, see [Bug Reporting](/docs/test-management/bug-reporting).

![](/images/bug-tracker-settings/connecting-testim-to-jira/6290943-image.png)

To connect Testim to Jira you will have to first login to Jira. Once the initial handshake is established you will be able to create issues to Jira without configuring the connection again.\
 :fa-arrow-right: **To Connect Testim to Jira:**

1. Go to **Settings > Bug Tracker**.
2. Make sure **Jira** is selected and you are already logged-in to Jira.
3. In the **Host** field, enter the URL of your Jira site. For example, https\://`<yourcompany>`.atlassian.net.

![](/images/bug-tracker-settings/connecting-testim-to-jira/f26f1c9-jira1.PNG "jira1.PNG")

If you are not logged in, click the Log in link and log in to Jira.

4. Click **Select**.\
   The **Select** button will be replaced by **Selected**.

![](/images/bug-tracker-settings/connecting-testim-to-jira/ac0f29a-jira2.png "jira2.png")
