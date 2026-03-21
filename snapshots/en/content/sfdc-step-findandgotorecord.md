# Find and go to record

> 📘 Salesforce Step
>
> This is a Salesforce step.

The **Find and go to record** step is used to perform a text search for the record. The system goes into the matching record that appears as the first result of the search.

:fa-arrow-right:**To add a Find and go to record step:**

1. In the editor, add a step by clicking the + button.
2. Under the Salesforce steps tab, click **Common Operations** and select the **Find and go to record** step.
3. In the **Select the Object** field, select the type of object that you would like to search on.
4. In the **Search for** field, enter a text string that matches the record that you are looking for.

   <Image align="center" src="https://files.readme.io/ef0246d-acme.png" />
5. If you want to use a variable as the search query, click the **Search for** field and then click the **T** sign.\
   The field becomes a **JS** parameter field.
6. Enter the variable name in the field.

   <Image align="center" src="https://files.readme.io/28f5b3c-companyname.png" />
7. Click **Save**.\
   When running the test, the Find step will search for a matching record and if multiple results are returned, it will go into the first result. If no results are found, the step will fail.