# 翻訳タスク (sfdc-step-quotelineeditor)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

> 📘 Salesforce Step
>
> This is a Salesforce step.

The **Quote Line Editor Action** step can be used to test the product pricing calculations in the Quote Line Editor of the CPQ application for specific line items on a quote and/or for the entire quote. As part of the testing, the step can be configured to input values into the CPQ quote and also to validate that a certain value is displayed as expected. For example, the step can be used to *input* the quantity `40` into the `quantity` field and then validate that the value `EUR 720,000` is displayed in the calculated `Net Total` field.  As in any step, any value can also be a [parameter](https://help.testim.io/docs/parameters) and it is possible to store the value found in the quote line/record into a parameter in Testim for Salesforce, which can be used in later steps in the test.

Each step can include multiple validations/actions/inputs in a single step, which will be executed consecutively by order. So, for example, one action includes a validation that the **Net Total** is 720 Euros and then the next action inputs the value 30 in the **Additional discount** field. This discount will change the Net Total value, so we can add another action to validate the Net Total field again with the new value (after the discount) of 560 Euros.  

![](/images/salesforce-steps/sfdc-step-quotelineeditor/f9d6097-example.png)

:fa-arrow-right:**To add a Quote Line Editor Action step:**

1. In the editor, add a step by clicking the **+** button.
2. Under the **Salesforce** steps tab, click **CPQ Operations** and select **Quote Line Editor Action** step.\
   The following **Properties Tab** is displayed:

   ![](/images/salesforce-steps/sfdc-step-quotelineeditor/f434ecd-cpq1.png)
3. Under the **Group Name** section, in the **Group Name** field, optionally specify the name of the relevant Table/Section in the quote. If a Group Name is not specified, the action will apply on the first table that appears on the screen.
4. Under the **Select Row** section, select the relevant row in the table by doing one of the following:

   1. **Row number** - enter the number of the row. For example, for the first line, enter the value `1`.
   2. **By filter** - this option selects the row by matching a specified value to one or more values in the specified column. For example, filtering by the value found in the *Product Code* column.

      ![](/images/salesforce-steps/sfdc-step-quotelineeditor/e573302-cpq2.png)

      Click **Add** and specify the following:

      1. **Column** - select the name of the column from the drop-down menu.
      2. **Operator** - select the operator that will apply on the condition. The following operators are available:
         1. `==` - for the value to be equal to value in the **Value** field.
         2. `!=` - for the value to NOT be equal to value in the **Value** field.
      3. **Value** - the value in the filter. This can be also a parameter.
      4. Click **Add** again to add another condition to the filter.  
5. Under the **Actions** section, add the actions that you would like to apply on the quote (i.e., validations, inputs, and storing of values from the CPQ).

   ![](/images/salesforce-steps/sfdc-step-quotelineeditor/6079c5d-cpq3.png)

   Click **Add** and specify the following:

   1. **Column** - select the name of the column from the drop-down menu.
   2. **Action** - select one of the following actions:
      1. Input - select this option to input a value to the selected field. For example, if you want the CPQ to calculate a discount you can use this action to input the discount value (e.g., 30) in the Discount field.
      2. Verify - select this option to verify that a field in the CPQ includes a value that matches the specified value. For example, if you want to verify that the total price, including the discount, was properly calculated.
      3. Store - select this option to  store the value found in the quote line/record into a parameter in Testim for Salesforce, which can be used in later steps in the test.
      4. Reset -  resets the configuration of the Action.
   3. **Value** - enter the value or use a parameter.
      1. **Input option** - the value that will be inputted into the specified field.
      2. **Verify option** - the value that will be used to verify against the current value in the field.
      3. **Store option** - the name of the variable in Testim for Salesforce in which the value from the specified field will be stored.
      4. **Reset option** - not applicable.
6. Repeat **step 5** to add additional Actions. It is possible to add multiple actions relating to a single field in CPQ. For example to verify its value before making an Input action and after the Input action.
