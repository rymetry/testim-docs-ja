# 翻訳タスク (okta-sso-integration)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Okta is an identity and access management service provider. Testim integrates with Okta, allowing users of Okta to authenticate once in Okta and then access Testim without authenticating again.

> 📘 SSO is a premium feature. Make sure the SSO feature is enabled for your deployment. If it is not, contact your Testim CSM.

:fa-arrow-right: **To setup the Testim Okta integration:**

1. Login to the **Okta Admin** account.
2. Go to **Applications > Applications**.
3. Click **Create App Integration**.

![1897](/images/security-sso/okta-sso-integration/cc7a2ac-image.png "image.png")

4. Select the **'SAML 2.0** option.

![955](/images/security-sso/okta-sso-integration/f4ab0a3-Capture1.PNG "Capture1.PNG")

5. Click **Next**.\
   The **General Settings** screen is displayed.

![1152](/images/security-sso/okta-sso-integration/cf9a206-Capture2.PNG "Capture2.PNG")

6. In the **App Name** field, enter a name for the connector app, such as 'Testim SSO'..
7. Click **Browse** to select the Testim logo and then **Upload Logo** to upload it (optional).
8. You can optionally add a **description** that will help your users know more about Testim.
9. Click **Next**.\
   The **Configure SAML** screen is displayed. At this point the connector has been created. Now you need to connect it to Testim.
10. In another tab open **Testim Automate**, and click the **user** icon, located in the top-right corner.

![285](/images/security-sso/okta-sso-integration/713786e-sso1.png "sso1.png")

11. In the drop-down menu, click **Settings** and click the **SSO** tab.
12. Under **Testim Service Provider Details**, under **Assertion Consumer Service URL**, click the **Copy** button.

![558](/images/security-sso/okta-sso-integration/f75d3f1-sso4.png "sso4.png")

13. Go back to the tab where you have **Okta** open and paste the copied **Assertion Consumer Service URL** into the **Single sign on URL** field.

![1128](/images/security-sso/okta-sso-integration/7ecca0b-okta5.png "okta5.png")

14. Go back to the **Testim Automate** tab and copy the **SERVICE PROVIDER ENTITY ID/AUDIENCE** code.
15. In the **Okta** tab, paste this code into the **Audience URI (SP Entity ID)** field.
16. Still in Okta, in the **Name ID format** field, select **EmailAddress**.
17. In the **Application username** field, select **Email**.
18. Under the the **Name** field, enter **email**.
19. Under **Value** , select **user.email**. This maps the `email` field in Testim to the `user.email` field in Okta.

![762](/images/security-sso/okta-sso-integration/5dae2c9-okta6.PNG "okta6.PNG")

20. Click **Add Another**.
21. Repeat steps **20 – 22** for the following field combinations:

- `firstName` (mapped to `user.firstName`)
- `lastName` (mapped to `user.lastName`)
- `profilePicture` is not mapped – this is optional.

![1200](/images/security-sso/okta-sso-integration/4bb986b-okta7.PNG "okta7.PNG")

22. Click **Next**.
23. Complete the feedback and click **Finish**.
24. In the newly created application's page, scroll down to **SAML Signing Certificates** section.
25. Click on **Actions > View IdP metadata**.

![1042](/images/security-sso/okta-sso-integration/8b9736c-image_1.png "image (1).png")

26. Right-click and choose "Save As".
27. Go back to the **Testim** tab, click the **Upload File** button and select the *metadata.xml* file that you have just saved.

![614](/images/security-sso/okta-sso-integration/31cb870-sso9.png "sso9.png")

28. In the same screen, enable the **Enable SSO** toggle.

![1336](/images/security-sso/okta-sso-integration/e687b64-sso10.png "sso10.png")

29. To ensure all users are only able to login through Okta, and not through the regular Testim login page, select the **Force users to login via idP** checkbox.

![619](/images/security-sso/okta-sso-integration/1a94a23-sso11.png "sso11.png")

30. Go back to the **Okta** tab and associate the newly created Testim SSO connector application to the relevant Users, Groups, or Roles. In this example we will show how to add a User, but the same applies to Groups and Roles.
31. Navigate to **Applications > Applications**. The new Testim SSO connector will be displayed.

![1253](/images/security-sso/okta-sso-integration/508e2c1-tempsnip1.png "tempsnip1.png")

32. Click the **Settings** (:fa-cog:) drop-down and select **Assign to Users**.
33. Assign it to the relevant user(s).\
    The newly created app is created and will appear in the Okta portal of the specified users/groups/roles. From now these user(s) will be able to login to Testim from Okta SSO.
