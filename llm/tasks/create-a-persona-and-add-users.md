# 翻訳タスク (create-a-persona-and-add-users)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Personas in Testim for Salesforce are user types, such as admin, sales, or customer. Personas are used to access your Salesforce environment when running tests. After creating a Persona, you will associate it with the credentials of existing Salesforce users in your connected Salesforce environment. This way you can switch between various environments (e.g., Dev, QA, Production, etc.) without the need to re-write the test.

This process assumes that you have connected your Salesforce environment to Testim for Salesforce. For more information see, [Connecting your Salesforce environment](/docs/salesforce-testing/create-and-manage-test-environments)

> 📘
>
> By default, after connecting your Salesforce environment, the system creates an Admin persona on this environment, while using the credentials used to log in to your environment.

# Creating a persona and associating it with a Salesforce user

After creating a Persona you can associate a Salesforce user by using one of the following methods:

- **Sign in with Salesforce** - a pop-up with the Salesforce sign-in screen is displayed.
- **Log in with username and password** - configure your login credentials in Testim for Salesforce.

:fa-arrow-right: **To create a Testim for Salesforce persona:**

1. In Testim for Salesforce, go to **Settings** > **Salesforce** > **Personas** and click the **Add Persona** button.

   ![](/images/salesforce-testing/create-a-persona-and-add-users/29532af-addpersona4.png)
2. Enter a persona name and click **Add**.\
   ![](/images/salesforce-testing/create-a-persona-and-add-users/1019250-addpersona2.png)\
   The persona is added to the list.\
   ![](/images/salesforce-testing/create-a-persona-and-add-users/cbf8b38-persona5.png)
3. From the list of personas, click the **+** button next to the relevant persona.\
   ![](/images/salesforce-testing/create-a-persona-and-add-users/7e2cd64-persona6.png)
4. Select one of the following:
   1. **Sign in with Salesforce** - in this method you will sign in to Salesforce and Testim for Salesforce will receive a token from Salesforce once it has been authenticated. A pop-up with the Salesforce sign-in screen is displayed. Login to the relevant Salesforce account to associate it with the persona and click **Allow** to allow access.\
      ![](/images/salesforce-testing/create-a-persona-and-add-users/37d29b1-login.png)
   2. **Log in with username and password** - configure your login credentials in Testim for Salesforce, by following the steps below.\
      ![](/images/salesforce-testing/create-a-persona-and-add-users/7277fad-addcredentials.png)
5. In the **Salesforce user** field, select the relevant user from the drop-down menu.
6. In the **Salesforce Password** field, enter the relevant password.
7. If the login requires MFA, enter the MFA authenticator key. To learn about how to find the MFA key, see [Setting MFA for Salesforce](/docs/salesforce-utilities/setting-mfa-for-salesforce).
8. Click **Save**.\
   The credentials will be displayed in the table on the Persona Name row and under the relevant environment column. When running the test you will be able to select the relevant environment for the test, which includes all the personas that were configured.
