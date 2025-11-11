# 翻訳タスク (network-logs-copy)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Console logs include information system confirmations, errors and notifications. During the test execution, console logs are displayed as part of the test results. The console logs can be viewed at the step level or at the test level.

## Viewing the console logs at the step level

:fa-arrow-right: **To view the console logs of a step:**

1. Run the test.
2. On the main menu, click **Runs**.
3. Click the relevant execution.
4. On the **Execution** screen, click the relevant test.\
   The test is displayed with the executed steps marked as passed or failed.
5. Click the **View Screenshot** button on the relevant step.
6. Click the **Console Log** tab.
7. You can also filter by the level of the log detail that you want to retrieve for each step (verbose, error, warning, or info) and/or by entering a string that matches the log text.

> 📘
>
> You can view the request results for previous and next steps by clicking on the arrows on the left and right sides of the screen.

![](/images/results/network-logs-copy/63aeaeb-consoletest.gif)

## Viewing the console logs at the test level

You can view aggregated console logs for the entire test in one place. The console log displays the logs that were generated during the test execution.

:fa-arrow-right: **To view the console log of a test:**

1. Run the test from the editor or from the CLI.
2. On the main menu, click **Runs**.
3. Click the relevant execution.
4. On the **Execution** screen, click the relevant test.
5. Click the horizontal three-dot menu and click **View console log**.
6. You can also filter by the level of the log detail that you want to retrieve for each step (verbose, error, warning, or info) or by entering a string that matches the log text.

![](/images/results/network-logs-copy/2c4ec40-consollog.gif)
