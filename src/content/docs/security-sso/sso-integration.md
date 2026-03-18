---
title: SSO 統合
description: シングルサインオンサービスを Testim と統合する
category: セキュリティ
order: 18002
updated: '2025-11-02'
sourceUrl: 'https://help.testim.io/docs/sso-integration'
keywords:
  - SSO
  - シングルサインオン
  - ID プロバイダー
  - Okta
  - OneLogin
  - Azure AD
  - 認証
  - PRO機能
---

シングルサインオンサービスを Testim と統合する

Testim は Okta、OneLogin、AzureAD を通じた SSO（シングルサインオン）をサポートしています。SSO 機能により、ユーザーが Testim にログインする際に、会社の ID プロバイダーを通じて認証できるようになります。ユーザーは SSO プロバイダー（ID プロバイダー（IDP）としても知られる）で一度認証すれば、セッション中に Testim や他のアプリケーションにアクセスでき、各アプリケーションで認証する必要がありません。

:::info{title="PRO機能"}
この機能は Professional plan のプロジェクトでのみ利用できます。
:::

:::info
SSO を使用して Testim にアクセスするには、ユーザーは特定の Testim プロジェクトに招待される必要があります。プロジェクトに招待されたユーザーのメールアドレスが有効で最新であることを確認してください（メールアドレスの変更には、その新しいメールアドレスへの新しい招待が必要です）。詳細については、[プロジェクトユーザー管理](/docs/project-user-management)を参照してください。
:::

## SSO が有効になっていることを確認する

SSO はプレミアム機能であり、統合前に有効にする必要があります。

**SSO が有効になっているか確認するには:**

1. **Testim Automate**で、右上隅にある**ユーザー**アイコンをクリックします。

![ユーザーアイコン](/images/security-sso/sso-integration/1add547-sso1.png)

2. ドロップダウンメニューで、**Settings**をクリックします。
3. 画面上部に SSO タブが表示されます。SSO メニューの横にロックアイコンが表示される場合、SSO 機能は有効になっていません。この場合、Testim の CSM に連絡して SSO 機能を有効にするよう依頼してください。

![SSO 設定画面](/images/security-sso/sso-integration/b377d5e-sso2.png)

## デプロイメント用の SSO を設定する

デプロイメント用の SSO を設定するには、以下のガイドの手順に従ってください:

* [OneLogin SSO 統合](/docs/onelogin-sso-integration)
* [Okta SSO 統合](/docs/okta-sso-integration)
* [Azure AD SSO 統合](/docs/azure-ad-sso-integration)
