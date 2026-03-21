# Gearset Integration

Automate testing from CI or deployment job in Gearset by adding a webhook in Gearset and using a single webhook call to the Testim/TTA for Salesforce REST API.

:fa-arrow-right: **To integrate Gearset:**

1. In Testim/TTA for Salesforce, go to **Settings > API**.
2. Click **Generate API Key**.

   <Image align="center" src="https://files.readme.io/b650ac8-generate1.png" />
3. Enter a name for the key and click **Generate**.

   <Image align="center" src="https://files.readme.io/e9d4a48-generateapi.png" />
4. Copy the API key that is displayed and click **Done**. The only time this key is visible is when it is generated, so copy it as soon as you can.

   <Image align="center" src="https://files.readme.io/7c2ad4a-copy.png" />
5. Go to the [Testim REST API](https://editor.swagger.io/?url=https://raw.githubusercontent.com/testimio/public-openapi/main/api.yaml) in Swagger and select a type of remote execution API call, such as Test, Test Plan, Test Suite, or Test Label, and copy the JSON payload.

   <Image align="center" src="https://files.readme.io/05e5bea-gearset_api.png" />
6. In the Gearset, Deployment or CI job in the webhook, by following these steps:

   1. In the **Outgoing webhook url**, enter the REST API call and append the Test, Test Plan, or Suite ID at the end of the URL. For example, `https://api.testim.io/tests/run/234`

   2. In the **Triggers** section, select **Success events**.

   3. In the **Payload** field, select **Custom**.

   4. In the **Authentication** field, select **Authorization**.

   5. In the **Credentials** field, add the API key from **step 4** in the format `Bearer YOUR-API-KEY`.

   6. In the **Content-Type** field, select **application/json**.

   7. In the **Payload** field, paste the **JSON payload** from Swagger **(step 5)**.

      <Image align="center" src="https://files.readme.io/5c1e754-gearset_webhook.png" />

   8. In the JSON payload, replace `"grid" : "string"` with the name of a grid from the **Grids** section of your profile in the top right of Testim/TTA for Salesforce.

      <Image align="center" src="https://files.readme.io/c970045-gearset_grid.png" />