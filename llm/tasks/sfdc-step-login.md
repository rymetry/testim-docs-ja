# 翻訳タスク (sfdc-step-login)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

> 📘 Salesforce Step
>
> This is a Salesforce step.

The Log in step logs into Salesforce using the selected [Persona](/docs/salesforce-testing/create-a-persona-and-add-users). All [Salesforce Steps](/docs/salesforce-steps/salesforce-steps), except the steps under the API Operations category, require you to be logged in to the Salesforce environment.

:fa-arrow-right: **To add a Log in step:**

1. In the editor, add a step by clicking the **+** button.
2. Under the **Salesforce steps** tab, click **Common operations** and select Log in step.\
   The **Log in** step is added and the following **Object** properties is displayed.

   ![](/images/salesforce-steps/sfdc-step-login/793c6ea-2024-05-05_16-19-27.png)
3. Under **Select login persona**, select the desired persona from the drop-down menu.
4. If you cannot find the desired persona, create a new one by following the instructions in [Creating a persona](/docs/salesforce-testing/create-a-persona-and-add-users).
5. When finished, click **Save**.
