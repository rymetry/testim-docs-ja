# Best Practice - Variable Naming Convention for Easy Cleanup

To automate the deletion of Records created during the execution of a testcase or suite, you will need to to create and run an [Execute APEX](https://help.testim.io/docs/sfdc-step-apex-action) step, which includes a code that finds the records that were created during a test and deletes them. However, to be able to identify the records, as a best practice, it is recommended to use a variable for the record names with a fixed prefix (e.g., `TestAccount`) and a random suffix appended.

This ensures there are no duplicate Records in Salesforce and the fixed prefix can be used by the “Execute Apex” step to find records to delete at the end of the testcase or suite.

**For example:**

The following test includes a **Create Account** step and the **Account Name** field includes the prefix "Test Account" followed by a Random Value suffix.

<Image align="center" src="https://files.readme.io/db4e504-testaccount.png" />