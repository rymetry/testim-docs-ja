# 翻訳タスク (sso-integration)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Integrate Single Sign-On services with Testim

Testim supports SSO (Single Sign-on) through Okta, OneLogin, and AzureAD. The SSO feature makes it possible for your users to authenticate through your company's identity provider when they log in to Testim. The user will authenticate once with the SSO provider, also known as the Identity Provider (IDP) and then access Testim and other applications during their session, without the need to authenticate with each application.

> 📘 This is a PRO feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, see [here](https://www.testim.io/pricing/).

> 📘 To use SSO to access Testim, users have to be invited to a specific Testim project. Make sure that the email addresses of the users that were invited to the project are valid and up to date (a change in email address requires a new invitation to that new email address). To learn more, see [Project user management](/docs/project-user-management/project-user-management).

# Ensuring SSO is enabled

SSO is a premium feature and should be enabled before the integration.\
:fa-arrow-right: **To verify if SSO is enabled:**

1. In **Testim Automate**, click the **user** icon, located in the top-right corner.

![285](/images/security-sso/sso-integration/1add547-sso1.png "sso1.png")

2. In the drop-down menu, click **Settings**.
3. The SSO tab is displayed at the top of the screen. If the lock icon appears next to the SSO menu, the SSO feature is not enabled. In this case, contact your Testim CSM and ask to enable the SSO feature.

![809](/images/security-sso/sso-integration/b377d5e-sso2.png "sso2.png")

# Configuring SSO for your deployment

To configure SSO for your deployment, follow the instructions in the following guides:

- [OneLogin SSO Integration](/docs/security-sso/onelogin-sso-integration)
- [Okta SSO Integration](/docs/security-sso/okta-sso-integration)
- [Azure AD SSO Integration](/docs/security-sso/azure-ad-sso-integration)
