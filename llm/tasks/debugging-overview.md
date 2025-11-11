# 翻訳タスク (debugging-overview)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Debugging tests is an iterative process. It may take several rounds of debugging to identify and fix the problem that causes a test to fail or to add new elements that are missing from the test. Testim offers a variety of tools to quickly debug your tests during runtime, without the need to wait until your test fully runs.

Using these tools you will be able to isolate the exact steps that lead to the error, to recreate the issue consistently; You can use tools like “break points” and “step-by-step execution” to identify the source of the issue; And then analyze the test results to verify that the test is passing or repeat the steps until the issue is resolved.
