# AutoRabit Integration

To automate testing from AutoRabit, in a CI Job you can add a Callout URL that calls the Testim REST API to trigger test execution of a Test, Test Plan, Test Suite, or Test Label. This is done seamlessly with a single webhook call, there is no need for intermediary VMs or CI tools.

> 📘
>
> This is only available on Pro accounts

:fa-arrow-right:**To integrate Testim with AutoRabit:**

1. In Testim, go to **Settings > API**.
2. Click **Generate Key**.
3. Immediately copy this key, it is only visible when it is generated.

   <Image align="center" src="https://files.readme.io/671408ce8d1625fa3c507eb95402e2719e61f02b6edb4af7dbe297a92a8b5133-2025-02-10_11-11-43.png" />
4. Go to the Testim.io Public API in Swagger and choose the type of remote execution API call for test execution; Test, Test Plan, Test Suite, or Test Label. Copy the JSON payload.

   <Image align="center" src="https://files.readme.io/648e98193cf400d76b4fbc0a63b055bc8f74d40e638dde4ee4c5ea84916b5c32-2025-02-10_11-15-58.png" />
5. In AutoRabit, when creating a new CI Job, create a Callout URL to automate test execution in Testim . You can choose the Callout URL to run Pre-Deployment or Post-Deployment (On Success or On Failure of the Deployment). In the Callout URL screen, configure the following settings:

   1. Method - set as POST 
   2. URL - use the REST API call from Step 2.,and append at the end of the URL the Test, Plan, or Suite ID, or Label, e.g. [https://api.testim.io/tests/run/234](https://api.testim.io/tests/run/234) 
   3. Authorization-  Select “Custom” and add in “Bearer YOUR-API-KEY” where YOUR-API-KEY is from Step 3. 
   4. Content - Type - Select “JSON (application/json)” 
   5. Content - Paste the JSON payload from Swagger from Step 4. In the JSON payload for the key:value pair:

      * “grid” : “string” replace “string” with the name of one of your grids, found in the Grids section of your profile in the top right of Testim Salesforce.
      * “branch” : “master” replace “master” with the name of the branch that points to the Salesforce environment that the tests will be executed against.

        <Image align="center" src="https://files.readme.io/da52470c66a4a53c6309338ab8c9d00d09f6a7ae7c24b7c61004e953d0dbb1c6-2025-02-10_11-21-25.png" />
6. Save the CI Job.\
   Whenever the CI Job runs, the Callout URL will trigger the execution of tests in Testim. Login to Testim to view the results.