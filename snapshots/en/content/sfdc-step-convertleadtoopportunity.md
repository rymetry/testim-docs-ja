# Convert lead to opportunity

> 📘 Salesforce Step
>
> This is a Salesforce step.

The **Convert lead to opportunity** step converts a record from being classified as a Lead to an Opportunity. Leads represent any potential marketable individual or business inside Salesforce that is not currently qualified. Opportunities represent leads that are qualified and have the potential to complete a purchase/sale. So typically Leads that perform certain qualifying actions are converted into an Opportunity.

As part of the conversion process, it is possible to change the values of the **Account**, **Contact**, and **Opportunity** attributes of the record or use its default values.

> 📘 Record display requirement
>
> The step itself does not navigate to the record, so you will need the system to navigate to the specific record during the execution of a test, so that the designated step will be performed when the record is displayed on Salesforce. To learn more, see [Find and display a specific Salesforce record during test execution](https://help.testim.io/docs/methods-for-displaying-a-specific-record-during-test-execution)1..

:fa-arrow-right:**To add a Convert lead to opportunity step:**

1. In your test, add a step before the **Convert lead to opportunity** step that will navigate to the desired Lead record. To learn more, see [Find and display a specific Salesforce record during test execution](https://help.testim.io/docs/methods-for-displaying-a-specific-record-during-test-execution).
2. Add a step by clicking the **+** button.
3. Under the **Salesforce steps** tab, click **CPQ Operations** and select the **Convert lead to opportunity** step.\
   The **Convert lead to opportunity** step is added and the following **Object** properties is displayed.

   <Image align="center" src="https://files.readme.io/f408a44-2024-05-05_19-30-37.png" />
4. It is possible to customize the Account Contact and Opportunity information or use the default values that were configured in Salesforce:
   1. To customize the values, deselect the Use default checkbox, open the relevant category and enter the desired value into the filed.
   2. To use the default values, select the Use default checkbox.
5. When finished, click **Save**.