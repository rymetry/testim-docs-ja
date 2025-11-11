# 翻訳タスク (sfdc-step-create)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

> 📘 Salesforce Step
>
> This is a Salesforce step.

The Create step creates a record in Salesforce of the specified Object type. As part of the step, you will specify the values for each field in the record. In addition, as part of the creation process you can verify that a specified field includes a specified value. For example, in fields that are automatically populated with values. The Create step is a predefined step.

:fa-arrow-right: **To add a Create step:**

1. In the editor, add a step by clicking the + button.
2. Under the **Salesforce steps** tab, click **Record Operations** and select the **Create** step.\
   The **Create step** is added and the following **Object properties** is displayed.

   ![](/images/salesforce-steps/sfdc-step-create/a3e93cc-object_properties.png)
3. Click the **Select the Object** drop-down menu and select the desired object type. The object type determines the type of record that will be created.
4. In some cases you will be required to also select a **Record Type**. This is like a sub-type of the record.

   > 📘
   >
   > If at this point you want to select a different Object and Record Type, click **Change** and select it again.

   The list of fields for the record from the connected Salesforce environment is displayed. Fields that are indicated with (\*) are mandatory. Hovering you mouse over the field name displays the **data type** and **API name** of the field in Salesforce.

   ![](/images/salesforce-steps/sfdc-step-create/b692df3-objectfields.png)
5. For each field that you want to create, under **Action** select one of the following options:
   1. Input - inputs the specified value into the field. If the field is not editable this action will not be listed. The action  requires entering a value, as described below.
   2. Verify -this action verifies that the value in the field matches that in the record. The action  requires entering a value, as described below. The action requires entering a value, as described below.
   3. Verify not visible - this action verifies that the field is not visible to the connected user. The action does not require entering a value.
   4. Store - this action stores the existing value in the record field into a specified Javascript variable. This action requires entering a name for the variable into the value field.
   5. Ignore - this action performs no action on the field. The action does not require entering a value.
   6. Reset - resets the value in the field to a "no entry" state. Note that if the field is empty, it will try to enter  an empty string to the field, however if you select the Reset option, it will not try to enter an empty string.
6. Under **Value**, enter the value of the field. If the field is a "pick list" (drop down menu), select the relevant option.

   The value field has two modes, to switch between the modes click the filed and the click the sign to alternate between **T** and **\{JS}**:

   1. T. Text mode. The value is treated as a literal string.
   2. \{JS}. JavaScript mode. The value is evaluated as a JavaScipt expression. The field will evaluate JavaSrcipt variables and functions.

      ![](/images/salesforce-steps/sfdc-step-create/0059a45-switchgif.gif)

      > 📘
      >
      > It is not possible to put a variable in a multiple pick list.
7. When finished, click **Save**.
