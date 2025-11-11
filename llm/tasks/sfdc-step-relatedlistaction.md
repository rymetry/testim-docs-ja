# 翻訳タスク (sfdc-step-relatedlistaction)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

> 📘 Salesforce Step
>
> This is a Salesforce step.

Some Salesforce objects, such as Contacts can display related objects under the **Related** tab, such as Opportunities, Cases, etc. (see example below).

![](/images/salesforce-steps/sfdc-step-relatedlistaction/8bb9014-related.png)

<br />

The **Related List Action** step can be used to perform the following actions on a record (e.g., a contact record):

- **Create** a new related list object. For example, create a related Opportunity.
- **Verify** that an existing related object matches the expected values in the specified fields. The test step passes only if all the fields match exactly.
- **View** the details of the related object.

To help understand the various objects used in the configuration, we will use the objects displayed in the screenshot example above:

- The **object** for which you are adding a related list item is the **Contact** (Mr. John Brown)
- The **related list item** is the **Opportunity** (Test Opp and Test Opp 2)

> 📘 Record display requirement
>
> The step itself does not navigate to the record, so you will need the system to navigate to the specific record during the execution of a test, so that the designated step will be performed when the record is displayed on Salesforce. To learn more, see [Find and display a specific Salesforce record during test execution](https://help.testim.io/docs/methods-for-displaying-a-specific-record-during-test-execution).

## Creating a new related list object (Create)

:fa-arrow-right:**To create a new related list object to a record:**

1. In your test, add a step before the Related List Action step that will navigate to the desired record. To learn more, see [Find and display a specific Salesforce record during test execution](https://help.testim.io/docs/methods-for-displaying-a-specific-record-during-test-execution).
2. Add a step by clicking the **+** button.
3. Under the **Salesforce steps** tab, click **Record Operations** and select the **Related List Actions** step.
4. Click the **Select the Object** drop-down menu and select the desired object type. The object type determines the type of object of the record for which you want to add a related list object (primary object). In the example above, this object would be the **Contact**.
5. Under **Select Related List**, select the related object that you want to create. In the example above, this would be an **Opportunity**.
6. If you have created a new tab (i.e., other than the default Related tab), in the **Tab Name** field, specify the tab name of the tab that you have created.
7. In the **Select Action** field, select **Create**.
8. Under **Select Record Type**, select the record type of the record for which you want to add a related list object. In the example above, the type would be either an **External or Internal Contact**.\
   The related list object's fields are displayed. Fields that are indicated with (\*) are mandatory.

<br />

![](/images/salesforce-steps/sfdc-step-relatedlistaction/0c6f260-fieldlistcreate.png)

9. For each field that you want to create, under **Action** select one of the following options:
   1. **Input** - inputs the specified value into the field. If the field is not editable, this action will not be listed. The action requires entering a value, as described below.
   2. **Verify** -this action verifies that the value in the field matches that in the record. The action requires entering a value, as described below. The action requires entering a value, as described below.
   3. **Verify not visible** - this action verifies that the field is not visible to the connected user. The action does not require entering a value.
   4. **Store** - this action stores the existing value in the record field into a specified Javascript variable. This action requires entering a name for the variable into the value field.
   5. **Ignore** - this action performs no action on the field. The action does not require entering a value.
   6. **Reset** - resets the value in the field to a "no entry" state. Note that if the field is empty, it will try to enter an empty string to the field, however if you select the Reset option, it will not try to enter an empty string.\ <br />
10. Under **Value**, enter the value of the field. If the field is a "pick list" (drop down menu), select the relevant option.\
    The value field has two modes, to switch between the modes click the filed and the click the sign to alternate between **T** and **\{JS}**:
    1. **T**. Text mode. The value is treated as a literal string.
    2. **\{JS}**. JavaScript mode. The value is evaluated as a JavaScipt expression. The field will evaluate JavaSrcipt variables and functions.
11. When finished, click **Save**.

## Verifying a related list object (Verify)

:fa-arrow-right:**To verify a related list object:**

1. In your test, add a step before the Related List Action step that will navigate to the desired record. To learn more, see [Find and display a specific Salesforce record during test execution](https://help.testim.io/docs/methods-for-displaying-a-specific-record-during-test-execution).
2. Add a step by clicking the **+** button.
3. Under the **Salesforce steps** tab, click **Record Operations** and select the **Related List Actions** step.
4. Click the **Select the Object** drop-down menu and select the desired object type. The object type determines the type of object of the record for which you want to add a related list object to (primary object). In the example above, this object would be the **Contact**.
5. Under **Select Record Type**, select the record type of the record for which you want to verify a related list object. In the example above, the type would be either an **External or Internal Contact**.
6. Under **Select Related List**, select the related object that you want to verify. In the example above, this would be an **Opportunity**.
7. If you have created a new tab (i.e., other than the default Related tab), in the **Tab Name** field, specify the tab name of the tab that you have created.
8. In the **Select Action** field, select **Verify**.
9. Under the **Filter (Where)** section, click **Add** to add a filter. The filter selects the rows in the related items list by matching the filter criteria. Specify the following:

   ![](/images/salesforce-steps/sfdc-step-relatedlistaction/23ac824-filterwhere.png)

   1. **Column** - select the name of the column from the drop-down menu.
   2. **Operator**- select the operator that will apply on the condition. The following operators are available:
      1. `==` - for the value to be equal to value in the **Value** field.
      2. `!=` - for the value to NOT be equal to value in the **Value** field.
   3. **Value** - the value in the filter.
   4. Click **Add** again to add another filter.
10. Under **Select Record**, select one of the following options:

    1. **First** - If the Filter yields more than one result, the system will verify the first related list item that meets the filter criteria defined in the **Expect** section below.
    2. **Last** - If the Filter yields more that one result, the system will verify the last related list item meets the filter criteria defined in the **Expect** section below.
    3. **All** - If the Filter yields more that one result, the system will verify all related list items meet the filter criteria defined in the Expect section below.
11. Under the **Expect** section, click **Add** to define the validation that you want to perform on the related list item as follows:

    1. **Column** - select the name of the column from the drop-down menu. The **Count()** option counts the number of related items. For example, if you set the Column to `Count ()`, the operator to `==`, and the value to `2`, it will verify that there are exactly two related items.  
    2. **Operator** - select one of the following operators:
       1. `==` - for the value in the column to be equal to value in the **Value** field.
       2. `!=` - for the value in the column to NOT be equal to value in the **Value** field.
       3. **Contains** - for the value in the Column to contain the value in the **Value** field.
    3. **Value** - the value in the validation. Parameters are NOT supported in this field.
    4. Click **Add** again to add another validation.
12. When finished, click **Save**.

<br />

## Viewing a related list object (View)

:fa-arrow-right:**To view a related list object:**

1. In your test, add a step before the Related List Action step that will navigate to the desired record. To learn more, see [Find and display a specific Salesforce record during test execution](https://help.testim.io/docs/methods-for-displaying-a-specific-record-during-test-execution).
2. Add a step by clicking the **+** button.
3. Under the **Salesforce steps** tab, click **Record Operations** and select the **Related List Actions** step.
4. Click the **Select the Object** drop-down menu and select the desired object type. The object type determines the type of object of the record for which you want to view a related list object (primary object). In the example above, this object would be the **Contact**.
5. Under **Select Record Type**, select the record type of the record for which you want to verify a related list object. In the example above, the type would be either an **External or Internal Contact**.
6. Under **Select Related List**, select the related object that you want to view. In the example above, this would be an **Opportunity**.
7. If you have created a new tab (i.e., other than the default Related tab), in the **Tab Name** field, specify the tab name of the tab that you have created.
8. In the **Select Action** field, select **View Record**.
9. Under the **Filter (Where)** section, click **Add** to add a filter. The filter selects the rows in the related items list by matching the filter criteria. Specify the following:
   1. **Column** - select the name of the column from the drop-down menu.
   2. **Operator**- select the operator that will apply on the condition. The following operators are available:
      1. `==` - for the value to be equal to value in the **Value** field.
      2. `!=` - for the value to NOT be equal to value in the **Value** field.
      3. **Contains**- for the value to contain the value in the **Value** field.
   3. **Value** - the value in the filter. This can be also a parameter.
10. Under **Select Record**, select one of the following options:
    1. **First** - If the Filter yields more than one result, the system will show the first record.
    2. **Last** - If the Filter yields more that one result, the system will show the last record.
11. When finished, click **Save**.
