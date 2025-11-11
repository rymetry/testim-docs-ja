# 翻訳タスク (sfdc-step-delete)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

> 📘 Salesforce Step
>
> This is a Salesforce step.

The delete step deletes the Salesforce record.

> 📘 Record display requirement
>
> The step itself does not navigate to the record, so you will need the system to navigate to the specific record during the execution of a test, so that the designated step will be performed when the record is displayed on Salesforce. To learn more, see [Find and display a specific Salesforce record during test execution](https://help.testim.io/docs/methods-for-displaying-a-specific-record-during-test-execution).

# Creating a Delete step

:fa-arrow-right:**To create a Delete step:**

1. In your test, add a step before the Delete step that will navigate to the desired record. To learn more, see [Find and display a specific Salesforce record during test execution](https://help.testim.io/docs/methods-for-displaying-a-specific-record-during-test-execution).
2. Add a step by clicking the **+** button.
3. Under the **Salesforce steps** tab, click **Record Operations** and select the Delete step.\
   The **Delete** step is added and the following **Object properties** is displayed.

   ![](/images/salesforce-steps/sfdc-step-delete/f1f2053-deletestep.png)
4. When finished, click **Save**.
