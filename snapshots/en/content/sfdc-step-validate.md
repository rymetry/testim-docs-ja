# Validate

> 📘 Salesforce Step
>
> This is a Salesforce step.

The Validate step validates that an existing record in Salesforce matches the expected values in the specified fields. The test step passes only if all the fields match exactly. The Validate step is a predefined step.

> 📘 Record display requirement
>
> The step itself does not navigate to the record, so you will need the system to navigate to the specific record during the execution of a test, so that the designated step will be performed when the record is displayed on Salesforce. To learn more, see [Find and display a specific Salesforce record during test execution](https://help.testim.io/docs/methods-for-displaying-a-specific-record-during-test-execution).

<br />

:fa-arrow-right:**To add a Validate step:**

1. In your test, add a step before the validate step that will navigate to the desired record. To learn more, see [Find and display a specific Salesforce record during test execution](https://help.testim.io/docs/methods-for-displaying-a-specific-record-during-test-execution).
2. Add a step by clicking the + button.
3. Under the **Salesforce steps** tab, click **Record Operations** and select the **Validate** step.\
   The Validate step is added and the following Object properties is displayed.

   <Image align="center" src="https://files.readme.io/77f2be9-validate1.png" />
4. Click the **Select the Object** drop-down menu and select the desired object type. The object type determines the type of record that will be validated.
5. In some cases you will be required to also select a **Record Type**. This is like a sub-type of the record.
6. For each field that you want to validate, under Action select one of the following options:
   1. Verify -this action verifies that the value in the field matches that in the record. The action requires entering a value, as described below. The action requires entering a value, as described below.
   2. Verify not visible - this action verifies that the field is not visible to the connected user. The action does not require entering a value.
   3. Store - this action stores the existing value in the record field into a specified Javascript variable. This action requires entering a name for the variable into the value field.
   4. Ignore - this action performs no action on the field. The action does not require entering a value.
   5. Reset - resets the value in the field to a "no entry" state. Note that if the field is empty, it will try to enter an empty string to the field, however if you select the Reset option, it will not try to enter an empty string.
7. Under Value, enter the value of the field. If the field is a "pick list" (drop down menu), select the relevant option. The value field has two modes, to switch between the modes click the filed and the click the sign to alternate between **T** and **\{JS}**:

   1. T. Text mode. The value is treated as a literal string.
   2. \{JS}. JavaScript mode. The value is evaluated as a JavaScipt expression. The field will evaluate JavaSrcipt variables and functions.

      <Image align="center" src="https://files.readme.io/97e5e6d-switchgif.gif" />

> 📘
>
> It is not possible to put a variable in a multiple pick list.

8. Click **Save**.