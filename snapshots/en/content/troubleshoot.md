# Troubleshooting

<details>
  <summary> <b>Unable to connect to your Salesforce environment </b></summary>

  To connect to your Salesforce environment, ensure that the Salesforce environment meets the following requirements:

  * Support API access - This requires Enterprise, Performance, Unlimited, and Developer Edition orgs. Professional Edition orgs can add API access as an add-on. Salesforce Essentials Edition does not support API access.
  * REST API is enabled for the selected user to connect to the Salesforce environment in **Administration > Users > Profiles**.

  <Image align="center" src="https://files.readme.io/40062a4-profiles.png" />

  * The Salesforce account that is connecting to the Salesforce environment must have the **Approve Uninstalled Connected Apps** permission.

  * If this permission isn’t available in a Sandbox, run the **Match Production Licenses to Sandbox Without a Refresh** tool in the affected Sandbox environment.

  * Whitelist the following IP addresses in **Settings > Security > Network Access**.
    * 35.85.13.117
    * 44.228.217.52
    * 54.245.105.236
    * 54.214.4.125

  <Image align="center" src="https://files.readme.io/6f77e19-Picture1.png" />

  * Whitelist additional IP address being blocked. Check in the Login History for “Restricted IP” addresses that are being blocked for the application “Testim for Salesforce” under **Settings > Identity >Login History**.

    <Image align="center" src="https://files.readme.io/32799d4-Picture2.png" />
</details>

<details>
  <summary> <b>Scheduled test executions on the Grid are failing </b></summary>

  If your tests are successfully executing locally, but failing on the Grid we suggest the following:

  * Identity and Access Management (IAM) services such as Azure Active Directory or Okta may be interfering with the test execution. **Possible solution** - We recommend disabling IAM service for test accounts. Execute the test locally in incognito mode to emulate running a test on the Grid.
  * IP addresses may be blocked. **Possible solution** -  Check in the Login History for “Restricted IP” addresses from the application "TTA for Salesforce" under **Settings > Identity >Login History**.
  * ![](https://files.readme.io/bbf8513-image.png)

    Remove the following restrictions that maybe preventing outside access from the Grid:

    * IP address range (Company level) - under **Settings > Security > Network Access**.

      <Image align="center" src="https://files.readme.io/622ae9f-Picture3.png" />

    * IP address range (Profile level)- under **Settings > Users > Profile > Login IP Ranges**.

      <Image align="center" src="https://files.readme.io/d10a2bb-Picture4.png" />

    * Login Hours (Profile level) - under **Users > Profile > Login Hours**.

      <Image align="center" src="https://files.readme.io/e4526ac-Picture5.png" />

    > 📘
    >
    > If IP address restrictions are required, please Contact Support ([https://www.testim.io/contact-us/](https://www.testim.io/contact-us/))  for the required IP addresses to whitelist.
</details>

<details>
  <summary> <b>Scheduled test executions on the Grid are failing due to need for verification code </b></summary>

  Verification codes are part of the device activation process and are not related to multi-factor authentication.

  Device activation happens when you log in and Salesforce asks you to enter a verification code that it sent via email.

  Device activation is triggered when one of the following occurs:

  * The IP address isn't whitelisted in Network Access settings.
  * The Whitelisted IP range exceeds 16 million addresses.
  * The organization is a free Salesforce edition (Developer edition, for example).

  To stop device activation for paid organizations, take the following steps:

  * Go to **Settings > Security > Network Access** and Update the IP address range (Company level) to include all the IP addresses of the **[Grids](https://help.testim.io/docs/testim-grid-ips#/)**.

  * Go to **Settings > Users > Profile > Login IP Ranges** and ensure that the IP address range (Profile level) does not exceed 16 million addresses.
</details>

<details>
  <summary> <b>Test execution fails in the first test step </b></summary>

  Test execution may fail in the first test step when there is a conflict with other Chrome extensions. We recommend you to isolate the test execution to have only the Tricentis Testim extension enabled. To do so, follow these steps:

  1. Configure the Tricentis Testim extension to run in Incognito mode.

     <Image align="center" src="https://files.readme.io/06d7fe3-troubleshoot_site_setting.png" />
  2. Run the test in Incognito mode.

     <Image align="center" src="https://files.readme.io/909b048-troubleshoot_run_incognito_mode.png" />
</details>

<details>
  <summary> <b>Cannot find a record in Salesforce (by using the Find step) that was created in a previous step using the Create step </b></summary>

  When creating a record in Salesforce using the **Create** step, there may be a time delay until the record is actually created in Salesforce and can be found using the **Find** step.  The solution is to add a step that includes a **[Custom condition](https://help.testim.io/docs/conditions#configuring-a-custom-condition)** that repeatedly searches (in a loop) for a Record until it is found or until it has retried for a set number of times and only then it will proceed to the next step.

  The step that is added with the custom condition can be found as a Shared Step in the demo project here -  [https://tta-crm.tricentis.com/#/project/WPZPXX3rnCpFZOSFPzYi/branch/master/test/FXeyB01zXmzQmAfs](https://tta-crm.tricentis.com/#/project/WPZPXX3rnCpFZOSFPzYi/branch/master/test/FXeyB01zXmzQmAfs)

  All you have to do is to add this shared step to your test.

  In the demo test the **Create** step is followed by the shared **Find** step.

  <Image align="center" src="https://files.readme.io/210f6e5-troubleshootfind.png" />

  The **Find** step includes a Custom condition to repeat the step until the record is found or up to four times:

  <Image align="center" src="https://files.readme.io/f96d08f-customcondition.png" />

  This is the custom condition code (click the **Edit** link next to **Custom** to view):

  <Image align="center" src="https://files.readme.io/58bdc93-code.png" />

  The custom code is set to repeat this Shared Group until the Record is found or it has tried searching for the Record four times.

  The Find Account shared steps includes two inner steps (double click the step to access):

  * Find step - a find step to find the record:

    <Image align="center" src="https://files.readme.io/b20c5ec-find.png" />
  * Sleep step - a sleep step to wait for the next iteration.

    <Image align="center" src="https://files.readme.io/46c1a28-sleep.png" />
</details>

<details>
  <summary> <b>Automation using the Salesforce Recorder is not selecting a value from a Salesforce pick-list </b></summary>

  Salesforce pick-lists are challenging to automate. When recording a selection you need to select the text in the pick-list, avoiding any blank space.
</details>

<details>
  <summary> <b>Test is failing to find a field but it is in the Salesforce Step </b></summary>

  This maybe due to the following reasons:

  * Salesforce account you are executing the test with may not have read permission to view this field.\
    **Possible solution** - to view the field permissions for this account, add a [Permission Validation](https://help.testim.io/docs/sfdc-step-permission-validation) test step and view the permissions.
  * Page Layout for the Salesforce account you are executing the test with maybe configured without this field.\
    **Possible solution** - to validate the Page Layout check your Settings in Salesforce.

  <br />
</details>

<details>
  <summary> <b>Salesforce test execution fails on the Grid with “Element not found” but the test passes Locally </b></summary>

  There are 2 possible reasons for this:

  1. Salesforce page load times maybe different between Grid and Local execution. Unexpected additional page load times can cause this timeout error.\
     **Possible solution** - Prior to the failing test step, add the Salesforce step [Wait for Page Load](https://help.testim.io/docs/sfdc-step-waitforpageload). This step  pauses test execution until the Salesforce page has completed loading.

  2. Browser window size was changed by the user during the Local recording or Local execution of the test.\
     **Possible solution** - We recommend not to re-size the browser window so that it remains the same size as when the test is executed on the Grid.
</details>

<details>
  <summary> <b>Concurrent Salesforce test executions are failing because a user gets logged out </b></summary>

  Salesforce only allows concurrent logins from an account that has been authenticated with username/password, not with Sign-in with Salesforce (OAuth).

  **Possible solution -** For concurrent test executions, use a Persona that has been authenticated with username/password. For more information, see [Creating a persona](https://help.testim.io/docs/create-a-persona-and-add-users).
</details>

<details>
  <summary> <b>When recording a test a step is missing </b></summary>

  The recorder offers two modes of operation:

  * **Salesforce mode** - in this mode, which is indicated by a cloud icon on the recorder , the recorder performs Salesforce steps, which enable the performance of multiple actions within a single step. The steps created using this mode are marked with a cloud icon.
  * **Web mode** - this is the regular mode of the recorder, which is indicated by a crossed out cloud icon on the recorder. In this mode every interaction (e.g., click, scroll, add text, etc.) is represented by a separate step.

  **Possible solution -** If you notice that the recorded steps are not appearing in the editor, you should turn off Salesforce mode by clicking on the cloud icon. For more details, see [Recording Steps](https://help.testim.io/docs/create-a-salesforce-test#recording-steps).
</details>

<details>
  <summary> <b>Fields are not present in a Salesforce Step</b></summary>

  There are 2 possible reasons for this:

  * Salesforce Steps only contain those fields in the sObject's Page Layout (for both Classic and Lightning). It does not include fields that have only been added using the Lighting App Builder. Your Salesforce admin may have excluded a field in the Page Layout, but added it when creating a [Dynamic Form](https://help.salesforce.com/s/articleView?id=sf.dynamic_forms_overview.htm\&type=5) using the Lightning App Builder. To use the Salesforce steps, in your Salesforce Setup add the field to the Page Layout, or use the Salesforce Recorder when authoring your tests.
  * Salesforce Steps only contain fields for which the Salesforce account that is used to connect your Salesforce environment, has `read` permission to. To check if the desired field has the required permissions within the logged-in account, add a [Permission Validation](https://help.testim.io/docs/sfdc-step-permission-validation) test step and view the permissions. You may need to reconnect your Salesforce environment with another Salesforce account that has the relevant `read` permission to see the missing field.
</details>