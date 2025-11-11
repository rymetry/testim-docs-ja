# 翻訳タスク (salesforce-steps)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Salesforce steps can be manually added to the test. These steps cover common actions in Salesforce that are pre-populated with the records and fields from your connected Salesforce environments. The steps consist of common operations, record operations, and API operations.

![](/images/salesforce-steps/salesforce-steps/488aa39-rework_salesforce_steps.gif)

## Common operations

Salesforce common operations include the following Salesforce operations:

- [Log in](/docs/salesforce-steps/sfdc-step-login) - Logs in to your Salesforce environment. Select a persona to log in or create a new persona.
- [Log In As Another User](/docs/log-in-as-salesforce-step) - Logs in to test with different users within a single testcase.
- [Launch App](/docs/salesforce-steps/sfdc-step-launchapp) - Selects the available app to launch.
- [Log out](docs/sfdc-step-launchapp) - Logs out of Salesforce.
- [Find and go to record](/docs/sfdc-step-find) - Text search for a record. Uses the global search to return the first matching record.
- [Wait for page load](/docs/salesforce-steps/sfdc-step-waitforpageload) - waits for Salesforce to completely load the page before proceeding to the next step.
- [Close console tabs](/docs/salesforce-steps/sfdc-step-closeconsoletabs) - Closes the console tabs on Salesforce.
- [Document validation](https://help.testim.io/docs/sfdc-document-validation) - validates and/or extracts the contents of the PDF document using a variety of conditions that can be configured without coding.

## Record operations

Salesforce record operations include the following Salesforce operations:

- [Create](/docs/salesforce-steps/sfdc-step-create) - Creates a new record with the values in the fields.
- [Edit](/docs/salesforce-steps/sfdc-step-edit) - Edits the current record with the values in the fields
- [Validate](/docs/salesforce-steps/sfdc-step-validate) - Validates that the current record matches the fields. The test step passes only if all the fields match exactly.
- [Quick actions](docs/sfdc-step-quickactions) - Runs an available quick action on the current record. Quick actions include options such as create a new task, log a call, new event, and email. The actions will be run using the values specified in the fields.
- [Related list actions](/docs/salesforce-steps/sfdc-step-relatedlistaction) - For the current record, runs actions on the record types in the related lists. You can run actions on the current record, such as:
  - Create - Creates a new record of the type in the related list.
  - Verify - Validate the values or the count of records of the type in the related list. Filters can be applied to the fields of the Record(s) returned.
  - View - View a record of the type in the related list. Filters can be applied to the fields of the record returned.
- [Delete](/docs/salesforce-steps/sfdc-step-delete) - Deletes the current record.
- [Verify picklist options](/docs/salesforce-steps/sfdc-step-verifypicklistoptions) - verifies that, when creating a record, a specific options are or aren't displayed in a drop-down menu (pick list) of a specific field.

For a Salesforce step that performs an action on a record, each field has an Action and Value pair.

> 📘 Tooltip
>
> Hovering your mouse over the name of the field will display the following information:
>
> - Data type - the supported data type of the field's value (e.g., date)
> - API name - the actual Field Name of the field. This may be different than the Field Label name that is displayed.

Each field consists of **Actions**, such as:

- Input - Input the value into the field.
- Verify - Verify that the value in the field matches that in the record.
- Store - Stores the value in the record into the value, which will be a Javascript variable.
- Ignore - Performs no action on the field.

Each **Value** can be set into the following mode:

- T. Text mode. The value is treated as a literal string.
- \{JS}. JavaScript mode. The value is evaluated as a JavaScipt expression. The field will evaluate JavaSrcipt variables and functions.

## API Operations

The following steps interact with Salesforce using API (not through the UI):

- [Execute Apex](https://help.testim.io/docs/sfdc-step-apex-action)- allows you to extend E2E tests beyond the UI, by running APEX code as a step inside the test.
- [Permission validation](https://help.testim.io/docs/sfdc-step-permission-validation) - allows you to capture, set, and continuously validate user permissions on Salesforce objects and their fields.

## CPQ Operations

Configure Price Quote Software is sales tool that allows sales reps to create quotes with customized product and pricing configurations based on the buyer's needs, and then sync all interactions with a deal's documents, within the Salesforce CRM. The CPQ Operations category includes the following steps:

- [Convert lead to opportunity](/docs/salesforce-steps/sfdc-step-convertleadtoopportunity) - converts a record from being classified as a Lead to an Opportunity.
- [Quote line editor action](https://help.testim.io/docs/sfdc-step-quotelineeditor) - The Quote Line Editor Action step can be used to test the product pricing calculations in the Quote Line Editor of the CPQ application for specific line items on a quote and/or for the entire quote.
