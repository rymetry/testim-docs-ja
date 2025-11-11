# 翻訳タスク (methods-for-displaying-a-specific-record-during-test-execution)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Some Salesforce steps require the system to navigate to a specific record during the execution of a test, so that the designated step will be performed when the desired record is displayed on Salesforce. There are multiple ways to achieve this:

- **Navigate action step** - adding an, [Add navigation action](/docs/handling-ui-actions/navigation) step before the designated step, which contains the URL of the desired record. For example, if you want to use the **Validate step**, in Salesforce, find the desired record, copy the URL from the browser, and add an **Add navigation action** step with the URL before the **Validate step**.
- **Find and go to record step** - adding a **[Find and go to record](/docs/sfdc-step-find)** step before the designated step. So for example, before a **Validate step** you will create a **Find and go to record** step that will find the desired record and display it on the AUT.
- **Create record step** - If, as part of the test, you have created the designated record using the Create step, it will be displayed on the AUT. So placing the designated step right after the [Create](/docs/salesforce-steps/sfdc-step-create) step, will ensure that the designated record is displayed on Salesforce.
- **Recording steps to navigate to the record** - [recorded steps](/docs/salesforce-utilities/record-tests-with-salesforce) can be added anywhere in the test. So right before the designated step, enable the breakpoint, run the test until point in the test, and then click Start recording at this position and on the AUT/Salesforce record the steps required to navigate to the designated record.

<br />
