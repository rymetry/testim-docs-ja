# 翻訳タスク (onelogin-sso-integration)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

OneLogin, Inc. is a cloud-based identity and access management provider that provides unified access management platform to businesses and organizations. Testim integrates with OneLogin, allowing users of OneLogin to authenticate once in OneLogin and then access Testim without authenticating again.

> 📘 SSO is a premium feature. Make sure the SSO feature is enabled for your deployment. If it is not, contact your Testim CSM.

:fa-arrow-right: **To setup the Testim OneLogin integration:**

1. Login to your **OneLogin** account.
2. Go to **Administration > Applications**.
3. Click **Add App**.
4. In the search field, enter *'SAML Test Connector'*.
5. Click the **'SAML Test Connector (advanced)'** option.

![840](/images/security-sso/onelogin-sso-integration/cc41ee8-sso3.png "sso3.png")

6. In the **Configuration** screen, edit the **Display Name** to a more friendly name, such as *'Testim SSO'*.
7. You can optionally change the connector's icon by uploading the Testim icon. Click here to download the Testim icon.
8. Click **Upload** to upload it to the square or rectangular icon placeholder.
9. You can optionally add a **description** that will help your users know more about Testim.
10. Click **Save**.\
    At this point the connector has been created. Now you need to connect it to Testim.
11. In another tab open **Testim Automate**, and click the **user** icon, located in the top-right corner.

![285](/images/security-sso/onelogin-sso-integration/713786e-sso1.png "sso1.png")

12. In the drop-down menu, click **Settings** and click the **SSO** tab.
13. Under T**estim Service Provider Details**, under **Assertion Consumer Service URL**, click the **Copy** button.

![558](/images/security-sso/onelogin-sso-integration/a45415b-sso4.png "sso4.png")

14. Go back to the tab where you have **OneLogin** open and go to the **Configuration** of the connector app.  
15. Paste the copied **Assertion Consumer Service URL** into the **ACS (Consumer) URL Validator** field and into the **ACS Consumer URL** field.

![1137](/images/security-sso/onelogin-sso-integration/142378a-sso5.png "sso5.png")

16. Go back to the **Testim Automate** tab and copy the **Logout URL** code.
17. In the **OneLogin** tab, paste this code into the **Single Logout URL** field.
18. Click **Save**.
19. Still in the **OneLogin** tab, go to the **Parameters** screen.
20. Click the **+** button to add a parameter.

![1272](/images/security-sso/onelogin-sso-integration/ab6ffb7-sso6.png "sso6.png")

21. In **Field** name, enter *'email'*.
22. Select the **Include in SAML assertion** checkbox.
23. Click **Save**. A **Value** drop-down menu appears.  
24. In the **Value** drop-down menu, select **Email**. This maps the email field in Testim to the Email field in OneLogin.

![440](/images/security-sso/onelogin-sso-integration/cba956e-sso7.PNG "sso7.PNG")

25. Click **Save** again.
26. Repeat steps **20 – 25** for the following field combinations:

- `firstName` (mapped to `First Name`)
- `lastName` (mapped to `Last Name`)
- `profilePicture` (mapped to `Profile Picture`) – this is optional

27. Still in **OneLogin**, go back to the Info screen and click the **More Actions** drop down menu.
28. Click the **download** icon next to **SAML Metadata** and save the file to a local folder.

![1496](/images/security-sso/onelogin-sso-integration/201fcf1-sso8.png "sso8.png")

29. Go back to the **Testim** tab, click the **Upload File** button and select the *metadata.xml* file that you have just saved.

![614](/images/security-sso/onelogin-sso-integration/31cb870-sso9.png "sso9.png")

30. In the same screen, enable the **Enable SSO** toggle.

![1336](/images/security-sso/onelogin-sso-integration/e687b64-sso10.png "sso10.png")

31. To ensure all users are only able to login through OneLogin, and not through the regular Testim login page, select the **Force users to login via idP** checkbox.

![619](/images/security-sso/onelogin-sso-integration/1a94a23-sso11.png "sso11.png")

32. Go back to the **OneLogin** tab and associate the newly created Testim SSO connector application to the relevant Users, Groups, or Roles. In this example we will show how to add a User, but the same applies to Groups and Roles.
33. Navigate to **Users > Users**.
34. Click on the desired user record. The user's User Info screen is displayed.
35. Go to **Applications**.
36. Click the **+** button to add a new application.
37. Select the newly created application (e.g. Testim SSO) from the drop-down menu and click **Continue**.\
    A list of the properties is displayed. These are the fields that were mapped between Testim and OneLogin.
38. Click **Save**.\
    The newly created app is created and will appear in the OneLogin portal of the specified users/groups/roles. From now these user(s) will be able to login to Testim from OneLogin SSO.
