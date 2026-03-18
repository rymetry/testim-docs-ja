---
title: SSO統合
description: シングルサインオンサービスをTestimと統合する
category: セキュリティ
order: 18002
updated: '2025-11-02'
sourceUrl: 'https://help.testim.io/docs/sso-integration'
keywords:
  - SSO
  - シングルサインオン
  - IDプロバイダー
  - Okta
  - OneLogin
  - Azure AD
  - 認証
  - PRO機能
---

シングルサインオンサービスをTestimと統合する

TestimはOkta、OneLogin、AzureADを通じたSSO（シングルサインオン）をサポートしています。SSO機能により、ユーザーがTestimにログインする際に、会社のIDプロバイダーを通じて認証できるようになります。ユーザーはSSOプロバイダー（IDプロバイダー（IDP）としても知られる）で一度認証すれば、セッション中にTestimや他のアプリケーションにアクセスでき、各アプリケーションで認証する必要がありません。

:::info{title="Pro機能"}
この機能はProfessional planのプロジェクトでのみ利用できます。
:::

:::info
SSOを使用してTestimにアクセスするには、ユーザーは特定のTestimプロジェクトに招待される必要があります。プロジェクトに招待されたユーザーのメールアドレスが有効で最新であることを確認してください（メールアドレスの変更には、その新しいメールアドレスへの新しい招待が必要です）。詳細については、[プロジェクトユーザー管理](/docs/project-user-management)を参照してください。
:::

## SSOが有効になっていることを確認する

SSOはプレミアム機能であり、統合前に有効にする必要があります。

**SSOが有効になっているか確認するには:**

1. **Testim Automate**で、右上隅にある**ユーザー**アイコンをクリックします。

![ユーザーアイコン](/images/security-sso/sso-integration/1add547-sso1.png)

2. ドロップダウンメニューで、**Settings**をクリックします。
3. 画面上部にSSOタブが表示されます。SSOメニューの横にロックアイコンが表示される場合、SSO機能は有効になっていません。この場合、TestimのCSMに連絡してSSO機能を有効にするよう依頼してください。

![SSO設定画面](/images/security-sso/sso-integration/b377d5e-sso2.png)

## デプロイメント用のSSOを設定する

デプロイメント用のSSOを設定するには、以下のガイドの手順に従ってください:

* [OneLogin SSO統合](/docs/onelogin-sso-integration)
* [Okta SSO統合](/docs/okta-sso-integration)
* [Azure AD SSO統合](/docs/azure-ad-sso-integration)
