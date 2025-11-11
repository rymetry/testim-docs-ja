# 翻訳タスク (log-screenshots)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

When you execute a test, you can log a screenshot of each step. The screenshots are stored in the Salesforce logs  as a small image under each user action description. The stored screenshots helps in debugging and for visual evidence of the test execution.

> 📘
>
> To save data cloud storage, the **Log screenshots** option is disabled by default.

## Enabling log screenshots

:fa-arrow-right:**To enable Log screenshots at the test level:**

1. In the test, click **Properties** button.

   ![](/images/salesforce-utilities/log-screenshots/b82e3e1-logscreenshots1.png)
2. In the **Properties** panel, under **Salesforce Options**, select the **Log screenshots** checkbox.

   ![](/images/salesforce-utilities/log-screenshots/6bc5c9e-logscreenshots2.png)
