# 翻訳タスク (sfdc-step-logout)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

> 📘 Salesforce Step
>
> This is a Salesforce step.

The **Log out** step logs out the logged in user in Salesforce Salesforce.

If you have used the **Log In As Another User** step and you would like to log out the user as well as the Admin user, you will need to add two **Log out** steps, one for the user and the other for the Admin user.

:fa-arrow-right: **To add a Log out step:**

1. In the editor, add a step by clicking the + button.
2. Under the **Salesforce steps** tab, click **Common operations** and select the **Log out** step. This step doesn't require any configuration.
3. When finished, click **Save**.
