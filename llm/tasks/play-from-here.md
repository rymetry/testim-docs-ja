# 翻訳タスク (play-from-here)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Learn how to run a test from a specific location

The Play from here feature allows you to execute your test from a specific point in your test, rather than from the beginning. This is useful when you want to examine a specific portion of your test without executing the entire test.

> 📘
>
> If you have steps in your test that are dependent on previous steps (e.g., logging into an application), starting a test in the middle may cause the test to fail.

:fa-arrow-right:**To use Play from here:**

1. Click the arrow where you want the run to begin.
2. Click the **Play from here** button.\
   ![](/images/test-execution/play-from-here/5039ce9-playfromhere.png)

The test will start running from this location after executing the setup step.
