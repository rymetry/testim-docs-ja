# 翻訳タスク (copado-integration)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

To automate testing from Copado, add the [URL Callout step](https://docs.copado.com/articles/#!copado-ci-cd-publication/deployment-step-url-callout) in Copado and use a single webhook call to the Testim/TTA for Salesforce REST API .

:fa-arrow-right: **To integrate Copado:**

1. In Testim/TTA for Salesforce, go to **Settings > API**.
2. Click **Generate API Key**.  

   ![](/images/ci-integrations/copado-integration/b650ac8-generate1.png)
3. Enter a name for the key and click **Generate**.

   ![](/images/ci-integrations/copado-integration/0aab69d-generateAPI.png)
4. Copy the API key that is displayed and click **Done**. The only time this key is visible is when it is generated, so copy it as soon as you can.

   ![](/images/ci-integrations/copado-integration/1b473ef-apikey.png)
5. Go to the [Testim REST API](https://editor.swagger.io/?url=https://raw.githubusercontent.com/testimio/public-openapi/main/api.yaml) in Swagger and select a type of remote execution API call, such as Test, Test Plan, Test Suite, or Test Label, and copy the JSON payload.

   ![](/images/ci-integrations/copado-integration/7c0621b-copado_swagger.png)
6. In the Copado Release Manager App, create a Deployment by adding a new step in the Steps section. To do so, follow these steps:

   1. In the **Type**, select **Perform callout and continue with deployment**.

   2. In the **Method**, select **POST**.

   3. Unselect the **Dynamic URL Parameters**.

   4. In the **URL**, enter the REST API call and append the Test, Test Plan, or Suite ID at the end of the URL. For example, `https://api.testim.io/tests/run/234`.

   5. Add the following headers:
      1. Authorization and enter the API key from step 4 in the format **Bearer YOUR-API-KEY**.
      2. **Content-Type** and enter **application/json**.

   6. In the **Body**, paste the JSON payload from Swagger (step 5).

      ![](/images/ci-integrations/copado-integration/b00424d-copado_steps.png)

   7. In the JSON payload, replace `"grid" : "string"` with the name of a grid from the **Grids** section of your profile in the top right of Testim/TTA for Salesforce.

      ![](/images/ci-integrations/copado-integration/4049e1e-copado_grid.png)

   8. To test, save the step and click **Deploy > Deploy All**.

      When the test is completed, click View Results in the Steps section. This deployment can also be done on Continuous Integration (CI).

## Pausing Copado deployment until test is complete or based on test result

You can pause the Copado deployment until a test or test plan is completed, passed, or failed.

:fa-arrow-right:**To pause Copado:**

1. In Copado, navigate to **Details > Type** and select **Perform callout and pause step** and copy the **Resume URL**.

   ![](/images/ci-integrations/copado-integration/a87ef04-copado_pause_step1.png)
2. In Testim/TTA for Salesforce, create an **Add API action** step in the editor and make it a shared step.
3. In the **Add API action** step, enter the **Resume URL** (step 1) and disable **Send via web page** in the properties.

   ![](/images/ci-integrations/copado-integration/612d721-copado_pause_step3.png)
4. Go to **Runs > Configuration** list, create a new configuration, select **After test handler**, and select the shared step (step 2).

   ![](/images/ci-integrations/copado-integration/e032878-copado_pause_step4.png)
5. In the test or test plan settings, select the newly created configuration (step 4).

   ![](/images/ci-integrations/copado-integration/70f00d2-copado_pause_step5.png)
