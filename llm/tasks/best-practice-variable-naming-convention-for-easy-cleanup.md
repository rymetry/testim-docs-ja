# 翻訳タスク (best-practice-variable-naming-convention-for-easy-cleanup)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

To automate the deletion of Records created during the execution of a testcase or suite, you will need to to create and run an [Execute APEX](/docs/salesforce-steps/sfdc-step-apex-action) step, which includes a code that finds the records that were created during a test and deletes them. However, to be able to identify the records, as a best practice, it is recommended to use a variable for the record names with a fixed prefix (e.g., `TestAccount`) and a random suffix appended.

This ensures there are no duplicate Records in Salesforce and the fixed prefix can be used by the “Execute Apex” step to find records to delete at the end of the testcase or suite.

**For example:**

The following test includes a **Create Account** step and the **Account Name** field includes the prefix "Test Account" followed by a Random Value suffix.

![](/images/salesforce-utilities/best-practice-variable-naming-convention-for-easy-cleanup/db4e504-testaccount.png)
