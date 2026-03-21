---
title: Azure AD SSO 統合
description: >-
  Azure Active Directory と Testim を SSO 統合する手順を説明します。Azure AD Seamless
  SSO により、ユーザーは一度の認証で Testim にアクセスできます。
category: セキュリティ
order: 18005
updated: '2025-11-02'
sourceUrl: 'https://help.testim.io/docs/azure-ad-sso-integration'
keywords:
  - Azure AD
  - Azure Active Directory
  - SSO 統合
  - SAML
  - シングルサインオン
  - Microsoft
  - 認証
  - アクセス管理
---

Azure Active Directory は Microsoft のクラウドベースの ID およびアクセス管理サービスです。Azure AD シームレスシングルサインオン（Azure AD Seamless SSO）を使用すると、すべてのユーザーとアプリにアクセスできます。\
Testim は Azure AD Seamless SSO と統合されており、Azure ユーザーは Azure で一度認証すれば、再度認証することなく Testim にアクセスできます。

:::info
SSO はプレミアム機能です。デプロイメントで SSO 機能が有効になっていることを確認してください。有効になっていない場合は、Testim の CSM に連絡してください。
:::

**Testim Azure AD 統合をセットアップするには:**

1. **Azure Portal Admin**アカウントにログインします。
2. **Enterprise application > New Application > Create your own application**に移動します。
3. **What's the name of your app?**の下に、アプリケーションの名前を入力します（例: Testim Website SSO）。
4. **Choose Integrate any other application you don't find in the gallery (Non-gallery)**オプションを選択します。

![アプリケーション作成画面](/images/security-sso/azure-ad-sso-integration/ef57db2-createyourownapplication.png)

5. **Create**をクリックします。
6. 左側のメニューで**Single sign-on**をクリックします。

![SAML オプション](/images/security-sso/azure-ad-sso-integration/0db1560-saml.png)

7. **SAML**をクリックします。
8. 別のタブで**Testim Automate**を開き、右上隅にあるユーザーアイコンをクリックします。

![ユーザーアイコン](/images/security-sso/azure-ad-sso-integration/713786e-sso1.png)

9. ドロップダウンメニューで、**Settings**をクリックし、**SSO**タブをクリックします。
10. **Testim Service Provider Details**セクションの下で、**Service Provider Metadata**をクリックして XML ファイルをダウンロードします。
11. **Azure**タブに戻り、**Upload Metadata File**をクリックします。

![メタデータファイルアップロードボタン](/images/security-sso/azure-ad-sso-integration/91619bd-uploadmetadatafile.png)

    **Basic SAML Configuration**画面が表示されます。

12. **Testim**タブに戻り、**Testim Service Provider Details**の下の**Assertion Consumer Service URL**で、**Copy**ボタンをクリックします。

![Assertion Consumer Service URL](/images/security-sso/azure-ad-sso-integration/dc1324d-assertiontestim.png)

13. **Azure**タブに戻り、コピーした**Assertion Consumer Service URL**を**Reply URL**フィールドに貼り付けて保存します。

![Basic SAML Configuration](/images/security-sso/azure-ad-sso-integration/dbbfe28-basicsmlconfiguration.png)

14. **Azure**タブで、**User Attribute & Claims**に移動します。

![Manage Claim 設定](/images/security-sso/azure-ad-sso-integration/c03a031-manageclaim.png)

15. 以下の詳細で新しいクレームを追加します:

- Email
  - Name: email
  - Source attribute: user.mail または user.userprincipaname。組織のユーザーの 1 人を Azure AD に入力し、どのフィールドでメールアドレスが表示されるかを確認することで、どちらを使用するかを確認できます。
- firstName
  - Name: firstName
  - Source attribute: user.givenname
- lastName
  - Name: lastName
- Source attribute: user.surname

16. ページを閉じて、**SAML Signing Certificate**の下で**Federation Metadata XML**をダウンロードします。
17. **Testim**タブで、**IDENTITY PROVIDER (IDP) METADATA**の下の**Upload File**をクリックし、Federation Metadata XML ファイルを選択します。
18. すべてのユーザーが Azure を通じてのみログインでき、通常の Testim ログインページを通じてログインできないようにするには、**Enable SSO**をオンにし、**Force users to login via idP**チェックボックスを選択します。

![SSO 設定画面](/images/security-sso/azure-ad-sso-integration/eda2ac8-ssoconfiguration3.png)

19. **Azure**タブで、**Users and groups**画面に移動し、**Add users/group**をクリックします。
20. **Azure**のまま、**Properties**画面に移動し、**User assignment required**オプションを必要に応じてオンまたはオフにします。

![Testim Website SSO 設定完了](/images/security-sso/azure-ad-sso-integration/8b155e0-testim_web_site_sso.png)

21. 左側のメニューで**Single sign-on**に戻り、設定をテストします。
