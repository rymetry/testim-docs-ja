# Edit

> 📘 Salesforce Step
>
> This is a Salesforce step.

The Edit step edits an existing record in Salesforce. The Edit step is a predefined step.

> 📘 Record display requirement
>
> The step itself does not navigate to the record, so you will need the system to navigate to the specific record during the execution of a test, so that the designated step will be performed when the record is displayed on Salesforce. To learn more, see [Find and display a specific Salesforce record during test execution](https://help.testim.io/docs/methods-for-displaying-a-specific-record-during-test-execution).

<br />

:fa-arrow-right:**To add an Edit step:**

1. In your test, add a step before the **Edit** step that will navigate to the desired record. To learn more, see [Find and display a specific Salesforce record during test execution](https://help.testim.io/docs/methods-for-displaying-a-specific-record-during-test-execution).

2. Add a step by clicking the **+** button.

3. Under the **Salesforce steps** tab, click **Record Operations** and select the **Edit** step.

4. Click the **Select the Object** drop-down menu and select the desired object type. The object type determines the type of record that will be created.

5. In some cases you will be required to also select a Record Type. This is like a sub-type of the record.\
   The list of fields for the record from the connected Salesforce environment is displayed. Fields that are indicated with (\*) are mandatory.

   <Image align="center" src="https://files.readme.io/8db8c0b-editstep.png" />

6. For each field that you want to create, under **Action** select one of the following options:

   1. **Input** - inputs the specified value into the field. If the field is not editable this action will not be listed. The action requires entering a value, as described below.
   2. **Verify** -this action verifies that the value in the field matches that in the record. The action requires entering a value, as described below. The action requires entering a value, as described below.
   3. **Verify not visible** - this action verifies that the field is not visible to the connected user. The action does not require entering a value.
   4. **Store** - this action stores the existing value in the record field into a specified Javascript variable. This action requires entering a name for the variable into the value field.
   5. **Ignore** - this action performs no action on the field. The action does not require entering a value.
   6. **Reset** - resets the value in the field to a "no entry" state. Note that if the field is empty, it will try to enter an empty string to the field, however if you select the Reset option, it will not try to enter an empty string.\
      Under Value, enter the value of the field. If the field is a "pick list" (drop down menu), select the relevant option.

7. The **Value** field has two modes, to switch between the modes click the filed and the click the sign to alternate between **T** and **\{JS}**:

   T. Text mode. The value is treated as a literal string.\
   \{JS}. JavaScript mode. The value is evaluated as a JavaScipt expression. The field will evaluate JavaSrcipt variables and functions.

   <Image align="center" src="https://files.readme.io/d6ba8eb-switchgif.gif" />

8. Click **Save**.