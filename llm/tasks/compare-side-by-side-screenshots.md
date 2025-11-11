# 翻訳タスク (compare-side-by-side-screenshots)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

The Screenshot screen lets you  compare the original baseline screenshot taken when the step was created with the screenshot from the recent test run. The screenshots can be viewed at the step level only.

:fa-arrow-right: **To view the screenshots side by side comparison of a step:**

1. Run the test.
2. On the main menu, click **Runs**.
3. Click the relevant execution.
4. On the **Execution** screen, click the relevant test.\
   The test is displayed with the executed steps marked as passed or failed.
5. Click the **View Screenshot** button on the relevant step.\
   The Screenshot screen is displayed showing a side-by-side comparison of the baseline and test results screenshot. Review the Baseline screenshot, which was taken when the test was last recorded, and compare it with the Result screenshot, which was taken when the test was last ran and failed. Testim highlights the target element that caused the error.
6. If you want the result screenshot to become the baseline screenshot, click **Set as baseline image**.
7. Click **Baseline** to view the baseline screenshot only. Click the **Last successful run** tab to view the screenshot of the last time that the step has passed.
8. Click **Result** to view the Result screenshot, which was taken when the test was last ran and failed.

![](/images/results/compare-side-by-side-screenshots/a0637b7-screenshot.gif)
