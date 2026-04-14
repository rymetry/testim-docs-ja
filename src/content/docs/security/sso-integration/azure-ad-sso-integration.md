---
title: Azure AD SSO 統合
description: >-
  Azure Active Directory と Testim を SSO 統合する手順を説明します。Azure AD Seamless
  SSO により、ユーザーは一度の認証で Testim にアクセスできます。
category: セキュリティ
order: 18005
updated: '2025-11-02'
sourceUrl: 'https://docs.tricentis.com/testim/content/security/sso-integration/azure-ad-sso-integration.htm'
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

Azure はクラウドベースのアクセス管理サービスです。SSO 機能により、すべてのユーザーとアプリへのアクセスが可能になります。\
Testim はこのサービスと統合されており、一度認証すれば再認証なしで利用できます。

:::info
SSO はプレミアム機能です。デプロイメントで SSO 機能が有効になっていることを確認してください。有効になっていない場合は、Testim の CSM に連絡してください。
:::

**Testim Azure AD 統合をセットアップするには:**

1. **Azure Portal** の管理者アカウントにログインします。
2. エンタープライズ アプリケーション > 新しいアプリケーション > 独自のアプリを作成 の順に進みます。
3. アプリケーション名の入力フィールドに名前を入力します（例: Testim Website SSO）。
4. ギャラリー以外のアプリを統合するオプション（**Non-gallery**）を選択します。

![アプリケーション作成画面](/images/security-sso/azure-ad-sso-integration/ef57db2-createyourownapplication.png)

5. **Create**をクリックします。
6. 左側のメニューで**Single sign-on**をクリックします。

![SAML オプション](/images/security-sso/azure-ad-sso-integration/0db1560-saml.png)

7. **SAML**をクリックします。
8. 別のタブで**Testim Automate**を開き、右上隅にあるユーザーアイコンをクリックします。

![ユーザーアイコン](/images/security-sso/azure-ad-sso-integration/713786e-sso1.png)

9. ドロップダウンメニューで、**Settings**をクリックし、**SSO**タブをクリックします。
10. Testim のサービスプロバイダー設定からメタデータ XML をダウンロードします。
11. Azure タブに戻り、メタデータファイルをアップロードします。

![メタデータファイルアップロードボタン](/images/security-sso/azure-ad-sso-integration/91619bd-uploadmetadatafile.png)

SAML の基本設定画面が表示されます。

12. **Testim** タブに戻り、サービスプロバイダー詳細の **SP ACS URL** をコピーします。

![Assertion Consumer Service URL](/images/security-sso/azure-ad-sso-integration/dc1324d-assertiontestim.png)

13. **Azure** タブに戻り、コピーした内容を **Reply** フィールドに貼り付けて保存します。

![Basic SAML Configuration](/images/security-sso/azure-ad-sso-integration/dbbfe28-basicsmlconfiguration.png)

14. **Azure** タブでユーザー属性の設定画面に移動します。

![Manage Claim 設定](/images/security-sso/azure-ad-sso-integration/c03a031-manageclaim.png)

15. 以下の詳細で新しいクレームを追加します:

- Email
  - Name: `email`
  - ソース属性: `user.mail` または `user.userprincipaname`。組織のユーザーを確認し、どちらのフィールドにメールアドレスが表示されるかを確かめてください。
- firstName
  - Name: `firstName`
  - ソース属性: `user.givenname`
- lastName
  - Name: `lastName`
  - ソース属性: `user.surname`

16. ページを閉じて、SAML 署名証明書セクションのメタデータ XML ファイルをダウンロードします。
17. **Testim** タブで、ダウンロードしたメタデータファイルを選択してアップロードします。
18. 全ユーザーが SSO 経由でのみログインするよう設定するには、IdP 経由ログインを強制するオプションを有効にします。

![SSO 設定画面](/images/security-sso/azure-ad-sso-integration/eda2ac8-ssoconfiguration3.png)

19. **Azure** タブでユーザーとグループの設定画面を開き、対象ユーザーを追加します。
20. **Azure** のまま、プロパティ画面でユーザー割り当ての要否を設定します。

![Testim Website SSO 設定完了](/images/security-sso/azure-ad-sso-integration/8b155e0-testim_web_site_sso.png)

21. 左側のメニューで**Single sign-on**に戻り、設定をテストします。
