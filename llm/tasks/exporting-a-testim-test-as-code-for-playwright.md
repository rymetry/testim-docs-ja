# 翻訳タスク (exporting-a-testim-test-as-code-for-playwright)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

You can export a Testim test as code that is adapted for Playwright. The export process involves adding a suffix to the URL of the test when it is open on the Editor.

> 📘
>
> Due to the technological differences, the code may require some additional manual adjustments, as instructed in the code comments. Some of the steps may not be supported.

:fa-arrow-right:**To export a Testim test as code for Playwright:**

1. Open the test in the Editor.
2. On the browser, add the following suffix to the end of the URL and press **Enter**.

   ```
   ?embedMode=true&exportPuppeteer=true&exportSelenium=true&exportPlaywright=true
   ```

The test's code is displayed in a code viewer. Make sure the **Playwright** tab is selected.  

![](/images/project-user-management/exporting-a-testim-test-as-code-for-playwright/5d19af1-playwright1.png)

3. Click **Copy code** to copy the displayed code.
