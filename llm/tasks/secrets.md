# 翻訳タスク (secrets)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Sometimes sensitive information, such as admin credentials for a production environment, a phone number, or an ID number is used in testing. In such cases, you don't want the secret information to be exposed in version history or stored in plain text.

Testim features a **Secrets Manager** that allows you to centrally manage sensitive values. Structured secrets are encrypted using AES-256 with customer-managed keys. Test artifacts are encrypted at rest using AES-256 via AWS default server-side encryption (SSE-S3). A secret can be assigned to a step and reused across tests, including as a [Shared step](https://help.testim.io/docs/shareable-steps).

It's important to note that during the test execution, Testim uses HTTPS (TLS) to encrypt values in transit. However, secrets are hidden only when the field type is password. That means secrets appear as asterisks in screenshots only when they're in a password field.

> 📘
>
> As a general practice, we recommend adhering to the best practice of avoiding testing on a production environment with sensitive data. Instead, it is advisable to utilize dedicated environments with non-sensitive information. However, if this is necessary, we recommend using the **Secrets Manager** feature.

## Secrets Manager

To access the **Secrets Manager**, select **Resources** from the main menu. Here you can see and manage all your secrets. You can also see:

- The user who created the secrets.
- When they were created.
- When they were last updated.

You can also access the secrets manager from the test editor. Select the test with the secret, select the step that uses the secret, select **Properties**, then select **Go to secrets manager**.

![](/images/project-user-management/secrets/6791efd-4.jpg)

## Create a Secret

<Callout icon="💡" theme="default">
  ### Note that the **Secrets Manager** is now accessible under a new tab called **Resources**, where you'll find the **Secrets Manager and Hidden Parameters** section.
</Callout>

To create a new secret, follow these steps:

1. Go to **Resources > Secrets Manager**.
2. Click **New Secret**.

   ![](/images/project-user-management/secrets/6876945-image.png)
3. In the **Name** field, enter a name for the secret. Make sure you follow the correct syntax described below.
4. In the **Value** field, enter the value that is being kept secret (e.g. phone number, password, etc.).
5. In the **Description** field, optionally enter a description for the secret.
6. Click **Create**.

## Edit or Delete a Secret

To edit or delete a **Secret**, follow these steps:

1. Open the **Secrets Manager** by selecting **Resources** from the side menu.
2. Right-click on the secret you want to edit and select **Edit**. To delete the secret, select **Delete** instead.

> ❗️
>
> If your secret is used in tests, you have to delete it from there first.
>
> If you delete a secret, it affects any tests using that secret. This includes steps, test data, and CLI usage.
>
> Update or remove secrets from associated tests before you delete secrets.

![](/images/project-user-management/secrets/97b8fca-image.png)

<br />

## Use Secrets in Tests

When recording a test, you can enter text into a field in the AUT, which creates a **Set Text** step. In the **Set Text** step properties instead of entering a value that will be entered into the field, you can assign one of the previously created secrets.

To add a secret to a test, follow these steps:

1. Open the test editor and select the step you want to add the secret to.
2. Select the **Show Properties** button on the **Set Text** step.\
   The step's Properties pane is displayed.
3. Under **Assign**, select the **Secret** option.
4. Select the secret you want to use from the list.

![](/images/project-user-management/secrets/0c8cfb3-image_16.png)

### Test Data

You can also use secrets as part of your **Test Data** by referencing them in data-driven steps. Simply configure predefined secret parameter in the test data editor so that these secrets are used when the test is run:

`parameterName: SECRETS.parameterValue.<value>`

Example:

![](/images/project-user-management/secrets/82ec572-SCR-20250624-nzsi.png)

## Add Secrets to Config File

The [configuration file](https://help.testim.io/docs/configuration-file-run-hooks) is a common JS containing all the required parameters to run your test and/or test suite. It includes run hooks which can be used to setup the application backend and define parameters before/after a single test or all tests. The configuration file needs to export all properties in a JSON named config. The definition of secrets in the Config File will follow the same overriding rules as any other parameter.

### Secrets syntax

Secrets must include the following syntax:

```javascript
SECRETS.<keyName>
```

- `<keyName>`- replace this with the name of the Secret, as configured in the **Name** field.

For example:

![](/images/project-user-management/secrets/1b55334-image_13.png)

## Add Secrets to Param File

Using a [JSON Parameters File](/docs/parameters/json-parameters-file-parameters), you can pass parameters to test runs. This method allows you to define dynamic values inside your test which vary by your test environment. For example, you can set different login credentials (username and password) when you test locally and when testing in your CI. The JSON Parameters File, which defines parameters, is created and then when running the test you can add an argument to the command that calls the JSON Parameters Files. The CLI command will pass the parameters to the tests that are included in the run.

### Secrets syntax

Secrets must include the following syntax:

```javascript
SECRETS.<keyName>
```

- `<keyName>`- replace this with the name of the Secret, as configured in the **Name** field.

### Making the Param File compatible with Secrets

Currently, Param files are defined in JSON file format, however this type of static file does not support using Secrets.

:fa-arrow-right: **To make the Param File compatible with Secrets:**

1. Rename the file with a `.JS` extension (instead of `.json`). For example - `<file name>.js`
2. Add `module.exports=` as the first line:

   ```json
   module.exports = {
     username: SECRETS.<keyName>,
     password: SECRETS.<keyName>,
   }
   ```

For example:

![](/images/project-user-management/secrets/f68b69a-image_14.png)

## View Test runs with Secrets

Test runs with Secrets are marked with an icon (see below).

![](/images/project-user-management/secrets/7ea630b-testruns2.png)
