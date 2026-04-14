---
title: Okta SSO 統合
description: >-
  Okta は ID およびアクセス管理サービスプロバイダーです。Testim は Okta と統合されており、Okta ユーザーは Okta で一度認証すれば、再度認証することなく Testim にアクセスできます。
category: セキュリティ
order: 18004
updated: '2025-11-02'
sourceUrl: 'https://docs.tricentis.com/testim/content/security/sso-integration/okta-sso-integration.htm'
keywords:
  - Okta
  - SSO 統合
  - SAML2.0
  - シングルサインオン
  - ID 管理
  - 認証
  - アクセス管理
---

Okta はアクセス管理サービスプロバイダーです。Testim はこのサービスと統合されており、一度認証すれば再認証なしで利用できます。

:::info
SSO はプレミアム機能です。デプロイメントで有効になっていることを確認してください。有効になっていない場合は、Testim のサポートチームに連絡してください。
:::

**Testim Okta 統合をセットアップするには:**

1. **Okta Admin**アカウントにログインします。
2. **Applications > Applications**に移動します。
3. アプリ統合の作成ボタンをクリックします。

![Create App Integration ボタン](/images/security-sso/okta-sso-integration/cc7a2ac-image.png)

4. **'SAML 2.0**オプションを選択します。

![SAML2.0 オプション](/images/security-sso/okta-sso-integration/f4ab0a3-Capture1.PNG)

5. **Next**をクリックします。\
   **General Settings**画面が表示されます。

![General Settings 画面](/images/security-sso/okta-sso-integration/cf9a206-Capture2.PNG)

6. アプリ名フィールドに「Testim SSO」などのコネクタアプリ名を入力します。
7. **Browse** をクリックして Testim ロゴを選択し、アップロードします（オプション）。
8. ユーザーが Testim について詳しく知るのに役立つ**説明**を追加することもできます（オプション）。
9. **Next**をクリックします。\
   **Configure SAML**画面が表示されます。この時点でコネクタが作成されました。次に Testim に接続する必要があります。
10. 別のタブで**Testim Automate**を開き、右上隅にある**ユーザー**アイコンをクリックします。

![ユーザーアイコン](/images/security-sso/okta-sso-integration/713786e-sso1.png)

11. ドロップダウンメニューで、**Settings**をクリックし、**SSO**タブをクリックします。
12. Testim のサービスプロバイダー詳細から **ACS URL** をコピーします。

![Assertion Consumer Service URL](/images/security-sso/okta-sso-integration/f75d3f1-sso4.png)

13. Okta タブに戻り、コピーした URL を対応フィールドに貼り付けます。

![Okta SAML 設定](/images/security-sso/okta-sso-integration/7ecca0b-okta5.png)

14. Testim Automate タブに戻り、SP エンティティ ID をコピーします。
15. Okta タブで、このコードを対応フィールドに貼り付けます。
16. 引き続き Okta で、名前 ID フォーマットとして **EmailAddress** を選択します。
17. アプリケーションのユーザー名フィールドで **Email** を選択します。
18. **Name**フィールドの下に**email**と入力します。
19. **user.email** を選択します。これで両サービス間の email がマッピングされます。

![属性マッピング設定](/images/security-sso/okta-sso-integration/5dae2c9-okta6.PNG)

20. **Add Another**をクリックします。
21. 以下のフィールドの組み合わせについて、ステップ**20 – 22**を繰り返します:

- `firstName`（`user.firstName`にマッピング）
- `lastName`（`user.lastName`にマッピング）
- `profilePicture`はマッピングされません – これはオプションです。

![追加属性マッピング](/images/security-sso/okta-sso-integration/4bb986b-okta7.PNG)

22. **Next**をクリックします。
23. フィードバックを完了し、**Finish**をクリックします。
24. 新しく作成されたアプリケーションのページで、SAML 署名証明書セクションまでスクロールします。
25. **Actions** メニューから IdP メタデータを表示します。

![IdP メタデータ表示メニュー](/images/security-sso/okta-sso-integration/8b9736c-image_1.png)

26. 右クリックして「名前を付けて保存」を選択します。
27. **Testim**タブに戻り、**Upload File**ボタンをクリックして、保存したばかりの*metadata.xml*ファイルを選択します。

![メタデータファイルアップロードボタン](/images/security-sso/okta-sso-integration/31cb870-sso9.png)

28. 同じ画面で、**Enable SSO**トグルを有効にします。

![SSO 有効化トグル](/images/security-sso/okta-sso-integration/e687b64-sso10.png)

29. 全ユーザーが SSO 経由でのみログインするよう設定するには、IdP 経由ログインを強制するチェックボックスを選択します。

![IdP 経由ログイン強制チェックボックス](/images/security-sso/okta-sso-integration/1a94a23-sso11.png)

30. **Okta**タブに戻り、新しく作成した Testim SSO コネクタアプリケーションを関連するユーザー、グループ、またはロールに関連付けます。この例ではユーザーを追加する方法を示しますが、グループやロールにも同様に適用されます。
31. アプリケーション一覧に移動します。新しい Testim SSO コネクタが表示されます。

![Testim SSO アプリケーション](/images/security-sso/okta-sso-integration/508e2c1-tempsnip1.png)

32. 設定ドロップダウンをクリックし、ユーザーへの割り当てを選択します。
33. 関連するユーザーに割り当てます。\
    新しく作成されたアプリが、指定されたユーザー/グループ/ロールのポータルに表示されます。これ以降、ユーザーは SSO 経由で Testim にログインできるようになります。
