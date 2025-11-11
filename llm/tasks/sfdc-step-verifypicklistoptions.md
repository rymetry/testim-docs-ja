# 翻訳タスク (sfdc-step-verifypicklistoptions)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

> 📘 Salesforce Step
>
> This is a Salesforce step.

The Verify picklist options step verifies that, when creating a record, a specific options are or aren't displayed in a drop-down menu (pick list) of a specific field. This is typically used to check that certain users are not able to see options that are not part of their permissions when creating a record. For each picklist you can verify that specified options exist, do not exist, or that there is an exact match between the selected options and the options displayed in the field.

This step can be combined with the [Log In As Another User](/docs/salesforce-steps/sfdc-step-loginas) step to test the different picklist options that are available to the various user types.

# Creating a Verify Picklist Options Step

:fa-arrow-right: **To add a Verify Picklist Options step:**

1. In the editor, add a step by clicking the **+** button.
2. Under the **Salesforce steps** tab, click **Record operations** and select **Verify picklist options** step.\
   The **Verify picklist options** step is added and the following **Object** properties is displayed.

   ![](/images/salesforce-steps/sfdc-step-verifypicklistoptions/2694c63-2024-05-06_15-48-25.png)
3. Click the **Select the Object** drop-down menu and select the desired object type. The object type determines the type of object of the record for which you want to verify the picklist options.
4. Under **Select Record Type**, select the record type of the record for which you want to verify the picklist options.\
   The record type/object' list of fields is displayed.

   ![](/images/salesforce-steps/sfdc-step-verifypicklistoptions/5643048-2024-05-06_15-59-04.png)
5. For each field that you want to verify its picklist options, under **Action** select one of the following options:
   1. **Exact Match** - select this option if you want to verify that the options selected in the **Options** field match all the picklist options of this field. If there are more options or fewer options, the step will fail.
   2. **Includes** -  select this option if you want to verify that the options selected in the **Options** field are included in the picklist options of this field. If one or more of the options is not included, the step will fail.
   3. **Excludes** - select this option if you want to verify that the options selected in the **Options** field are excluded from the picklist options of this field. If any of the selected options appears in the field, the step will fail.
   4. **Reset** - resets the value in the field to a "no entry" state. Note that if the field is empty, it will try to enter an empty string to the field, however if you select the Reset option, it will not try to enter an empty string.
6. Under **Options**, click the field to select the picklist option.
7. Click again to select more picklist options.
8. When finished, click **Save**.
