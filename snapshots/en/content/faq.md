# FAQ

<details>
  <summary><b>How do you ensure that Testim for Salesforce will work with future Salesforce releases?</b></summary>

  We get early access to pre-release orgs, so we thoroughly test well ahead of any Salesforce release.\
  This ensures that you don’t have to spend time maintaining tests when a new Salesforce release is introduced.
</details>

<details>
  <summary><b>Does Testim for Salesforce allow end-to-end testing across websites and other applications?</b></summary>

  You can test across other websites, other applications, and external APIs, as long as the test case includes Salesforce testing.\
  For more information, see\
  <a href="https://help.testim.io/docs/create-a-salesforce-test">Creating a Salesforce test</a>.
</details>

<details>
  <summary><b>Is there an additional Salesforce license cost when using Testim for Salesforce?</b></summary>

  No, there is no additional Salesforce license cost.
</details>

<details>
  <summary><b>Is this a new tool or an add-on for Tricentis Tosca?</b></summary>

  This is a new, standalone tool, dedicated to the testing of Salesforce workflows.
</details>

<details>
  <summary><b>How can I clean-up/delete the records created during a test?</b></summary>

  To automate the deletion of records created during the execution of a testcase or suite, it is necessary to run an <a href="https://help.testim.io/docs/sfdc-step-apex-action">Execute APEX </a> step, which includes a code that finds the records that were created during a test and deletes them. However, to be able to identify the records, as a best practice, it is recommended to use a variable for the record names with a fixed prefix (e.g., `TestAccount`) and a random suffix appended. For more information, see [Best Practice - Variable Naming Convention for Easy Cleanup](https://help.testim.io/docs/best-practice-variable-naming-convention-for-easy-cleanup).

  In the Execute Apex step, for each sObject, the code finds all records starting with the fixed prefix record name, and then deletes them from Salesforce. To ensure all records are deleted, we recommend first deleting all related records.

  The following code example uses an Apex script for **Case** and **Account** sObjects:

  ```java
  //Delete all Cases related to Test Accounts  
  List<Case> lstCase =  [SELECT Id FROM Case WHERE AccountId IN (SELECT Id FROM Account WHERE Name LIKE 'TestAccount_%') AND isDeleted = false];  
  Database.delete(lstCase, false);  
  //Delete all Test Accounts  
  List<Account> lstAccount = [SELECT Id FROM Account WHERE Name LIKE 'TestAccount_%' AND isDeleted = false];  
  Database.delete(lstAccount, false);
  ```
</details>