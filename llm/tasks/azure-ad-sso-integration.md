# 翻訳タスク (azure-ad-sso-integration)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Azure Active Directory is Microsoft's cloud-based identity and access management service. With Azure AD Seamless Single Sign-On (Azure AD Seamless SSO) you can have access for all your users and apps.\
Testim integrates with Azure AD Seamless SSO, allowing Azure users to authenticate once in Azure and then access Testim without authenticating again.

> 📘 SSO is a premium feature. Make sure the SSO feature is enabled for your deployment. If it is not, contact your Testim CSM.

:fa-arrow-right: **To setup the Testim Azure AD integration:**

1. Login to the **Azure Portal Admin** account.
2. Go to **Enterprise application > New Application > Create your own application**.
3. Under **What's the name of your app?**, enter a name for the application (e.g., Testim Website SSO).  
4. Select the **Choose Integrate any other application you don’t find in the gallery (Non-gallery)** option.

![](/images/security-sso/azure-ad-sso-integration/ef57db2-createyourownapplication.png)

5. Click **Create**.
6. Click on **Single sign-on** on the left menu.

![371](/images/security-sso/azure-ad-sso-integration/0db1560-saml.png "saml.png")

7. Click on **SAML**.
8. In another tab open **Testim Automate** and click the user icon, located in the top-right corner.

![285](/images/security-sso/azure-ad-sso-integration/713786e-sso1.png "sso1.png")

9. In the drop-down menu, click **Settings** and click the **SSO** tab..
10. Under the **Testim Service Provider Details** section, click the **Service Provider Metadata** to download the XML file.
11. Go back to the **Azure** tab and click **Upload Metadata File**.

![1036](/images/security-sso/azure-ad-sso-integration/91619bd-uploadmetadatafile.png "uploadmetadatafile.png")

 The **Basic SAML Configuration** screen is displayed.\
12\. Go back to the **Testim** tab, and under **Testim Service Provider Details**, under **Assertion Consumer Service URL**, click the **Copy** button.

![1000](/images/security-sso/azure-ad-sso-integration/dc1324d-assertiontestim.png "assertiontestim.png")

13. Go back to the **Azure** tab and paste the copied **Assertion Consumer Service URL** into the \*Reply URL\*\* field and save.

![788](/images/security-sso/azure-ad-sso-integration/dbbfe28-basicsmlconfiguration.png "basicsmlconfiguration.png")

14. In the **Azure** tab, go to **User Attribute & Claims**.

![1545](/images/security-sso/azure-ad-sso-integration/c03a031-manageclaim.png "manageclaim.png")

15. Add a new claim with the following details:

- Email
  - Name: email
  - Source attribute: user.mail or user.userprincipaname. You can check which one by entering one of your organization’s users in Azure AD and then check which field you can see the email address.
- firstName
  - Name: firstName
  - Source attribute: user.givenname
- lastName
  - Name: lastName
- Source attribute: user.surname

16. Close the page and under **SAML Signing Certificate**, download the **Federation Metadata XML**.
17. In the **Testim** tab, under **IDENTITY PROVIDER (IDP) METADATA**, click **Upload File** and select the Federation Metadata XML file.
18. To ensure all users are only able to login through Azure, and not through the regular Testim login page, toggle the **Enable SSO** on and select the **Force users to login via idP** checkbox.

![1890](/images/security-sso/azure-ad-sso-integration/eda2ac8-ssoconfiguration3.png "ssoconfiguration3.png")

19. In the **Azure** tab, go to **Users and groups** screen and click **Add users/group**.
20. Still in **Azure**, go to the **Properties** screen in the **User assignment required** option turn it ON or OFF as required.

![985](/images/security-sso/azure-ad-sso-integration/8b155e0-testim_web_site_sso.png "testim web site sso.png")

21. Go back to **Single sign-on** on the left menu and test your configuration.
