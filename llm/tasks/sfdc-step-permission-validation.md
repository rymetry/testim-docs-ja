# 翻訳タスク (sfdc-step-permission-validation)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

> 📘 Salesforce Step
>
> This is a Salesforce step.

Permission Validation is a Salesforce step that allows you to capture, set, and continuously validate user permissions on Salesforce objects and their fields. The step is used to provide enhanced security for your Testim for Salesforce account, by reading each object and its fields validate any change compared to the user selected when you connected your Salesforce instance.

To perform permission validation, go to your Salesforce editor and navigate to **Salesforce steps > API operations > Permission validation**. Permission validation validates the list of permissions at the API level.

![](/images/salesforce-steps/sfdc-step-permission-validation/0039077-permission_validation.png)

In each test step, when you select a Salesforce Persona or a profile, and add an object you want to validate, Testim for Salesforce automatically displays the list of permissions in the connected Salesforce instance. These permissions are based on the user's Permission Set and its associated Object and Field permissions.  This step validates permissions only, to update permissions, you must go to your Salesforce instance and to update permissions.

You can select multiple objects in a single permission validation step and run the test.

When the test is executing, it will validate the permissions in the test step with the permissions configured in the connected Salesforce environment. In case the permissions don't match, an error occurs. You can check the Salesforce log to find the details related to the permissions.
