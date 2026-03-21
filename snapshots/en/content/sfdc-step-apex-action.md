# Execute APEX

> 📘 Salesforce Step
>
> This is a Salesforce step.

The Salesforce APEX action step allows you to extend E2E tests beyond the UI, by running APEX code as a step inside the test. It allows you to run APEX code to programmatically insert, update, merge, delete, and restore Salesforce objects using Data Manipulation Language (DML) statements or to query your environment using Salesforce Object Query Language (SOQL) or Salesforce Object Search Language (SOSL) statements and exporting data to be used in subsequent steps.

## Adding an Execute APEX Action Step

:fa-arrow-right: **To add an Execute APEX action step:**

1. In the editor, add a step by clicking the **+** button.
2. Under the **Salesforce steps** tab, click **API operations** and select **Execute Apex** step.\
   The **function** editor opens, and the **Properties** panel opens on the right-hand side:

   <Image align="center" src="https://files.readme.io/c0c4dc9-Picture2.png" />
3. In the **Properties** panel, in the **Description** field, optionally edit the description of this step. The default description is “Salesforce - APEX Action”.
4. In the function text box, type in the desired APEX code. If you have defined parameters, you can refer to those parameters in your APEX code.
5. Click the back arrow to return to the main Editor window

## Passing parameters

You can use defined parameters to pass values defined in the test or suite level, in the config file, or in another step to your APEX function (currently only String values are supported).

:fa-arrow-right: **To add an Execute APEX action step:**

1. In the **Properties** panel add a parameter by clicking the **+** in the **PARAMS** section.

2. Enter the parameter name defined in test, suite, or config file in the text box.

3. Next to the **JS** indicator, give this parameter a name that will be used in the APEX script. This will automatically appear as an argument in the function declaration in the editor window.

   <Image align="center" src="https://files.readme.io/fbe2f4f-Picture3.png" />

## Exporting Values

Exporting values from an APEX script must meet the following requirements:

1. Use of the **Export** function to export the value, please refer to [https://help.testim.io/docs/exports-parameters#exporting-a-parameter](https://help.testim.io/docs/exports-parameters#exporting-a-parameter)
2. The value to be exported must be stored in an APEX variable.
3. The APEX variable name and the export variable name both must only consist of alphabet characters (A-z) and underscores.
4. Exporting of values is not possible when an APEX script contains a Salesforce DML function. Where DML functions are required, this needs to split over multiple test steps.

> 📘
>
> Since parameters are serialized between steps as JSON - only values that may be serialized as JSON may be safely used.

## Salesforce APEX Action Example

In this scenario we will use the Execute Apex step to:

1. Search for Opportunities using SOQL, where the name of the Opportunity matches the parameter opportunity passed in, and store all of these Opportunities in a list.
2. Take the first Opportunity in the list and assign the Amount value to the APEX variable `firstoppAmount`.
3. Export the value in `firstoppAmount` in the export variable `oppAmount`, so that can be used in subsequent test steps in the test.

### Code:

```javascript
function f(opportunity: any) {
List<Opportunity> firstOpportunity = [SELECT Id, Name FROM Opportunity WHERE Name LIKE :opportunity AND isDeleted = false];
int firstoppAmount = firstOpportunity[0].Amount;
exportsTest.oppAmount = firstoppAmount;
  }
```

<Image align="center" src="https://files.readme.io/da0a612-Picture4.png" />

## Viewing the APEX Action Result Log

After a test containing a *Execute Apex* step is run, a step log is available in the code editor with your test results from Salesforce.

:fa-arrow-right: **To view the APEX action result log:**

1. Double-click on the *Salesforce APEX action* step for which you wish to view the Result Log.

The **code editor** opens, and the **Step Log** is shown at the bottom of the screen.

If there is a log received from Salesforce, the details will be shown in the Step Log section.

<Image align="center" src="https://files.readme.io/825fff5-view_apex_action_2.png" />