---
title: 'Okta SSO統合'
description: '原文: https://help.testim.io/docs/okta-sso-integration'
category: 'セキュリティ・SSO'
order: 4
updated: '2025-11-02'
keywords:
  - testim
  - okta-sso-integration
  - security-sso
---
OktaはIDおよびアクセス管理サービスプロバイダーです。TestimはOktaと統合されており、OktaユーザーはOktaで一度認証すれば、再度認証することなくTestimにアクセスできます。

> 📘 SSOはプレミアム機能です。デプロイメントでSSO機能が有効になっていることを確認してください。有効になっていない場合は、TestimのCSMに連絡してください。

:fa-arrow-right: **Testim Okta統合をセットアップするには:**

1. **Okta Admin**アカウントにログインします。
2. **Applications > Applications**に移動します。
3. **Create App Integration**をクリックします。

![1897](/images/security-sso/okta-sso-integration/cc7a2ac-image.png "image.png")

4. **'SAML 2.0**オプションを選択します。

![955](/images/security-sso/okta-sso-integration/f4ab0a3-Capture1.PNG "Capture1.PNG")

5. **Next**をクリックします。\
   **General Settings**画面が表示されます。

![1152](/images/security-sso/okta-sso-integration/cf9a206-Capture2.PNG "Capture2.PNG")

6. **App Name**フィールドに、'Testim SSO'などのコネクタアプリの名前を入力します。
7. **Browse**をクリックしてTestimロゴを選択し、**Upload Logo**をクリックしてアップロードします（オプション）。
8. ユーザーがTestimについて詳しく知るのに役立つ**説明**を追加することもできます（オプション）。
9. **Next**をクリックします。\
   **Configure SAML**画面が表示されます。この時点でコネクタが作成されました。次にTestimに接続する必要があります。
10. 別のタブで**Testim Automate**を開き、右上隅にある**ユーザー**アイコンをクリックします。

![285](/images/security-sso/okta-sso-integration/713786e-sso1.png "sso1.png")

11. ドロップダウンメニューで、**Settings**をクリックし、**SSO**タブをクリックします。
12. **Testim Service Provider Details**の下の**Assertion Consumer Service URL**で、**Copy**ボタンをクリックします。

![558](/images/security-sso/okta-sso-integration/f75d3f1-sso4.png "sso4.png")

13. **Okta**を開いているタブに戻り、コピーした**Assertion Consumer Service URL**を**Single sign on URL**フィールドに貼り付けます。

![1128](/images/security-sso/okta-sso-integration/7ecca0b-okta5.png "okta5.png")

14. **Testim Automate**タブに戻り、**SERVICE PROVIDER ENTITY ID/AUDIENCE**コードをコピーします。
15. **Okta**タブで、このコードを**Audience URI (SP Entity ID)**フィールドに貼り付けます。
16. Oktaのまま、**Name ID format**フィールドで**EmailAddress**を選択します。
17. **Application username**フィールドで**Email**を選択します。
18. **Name**フィールドの下に**email**と入力します。
19. **Value**の下で**user.email**を選択します。これにより、Testimの`email`フィールドがOktaの`user.email`フィールドにマッピングされます。

![762](/images/security-sso/okta-sso-integration/5dae2c9-okta6.PNG "okta6.PNG")

20. **Add Another**をクリックします。
21. 以下のフィールドの組み合わせについて、ステップ**20 – 22**を繰り返します:

* `firstName`（`user.firstName`にマッピング）
* `lastName`（`user.lastName`にマッピング）
* `profilePicture`はマッピングされません – これはオプションです。

![1200](/images/security-sso/okta-sso-integration/4bb986b-okta7.PNG "okta7.PNG")

22. **Next**をクリックします。
23. フィードバックを完了し、**Finish**をクリックします。
24. 新しく作成されたアプリケーションのページで、**SAML Signing Certificates**セクションまでスクロールダウンします。
25. **Actions > View IdP metadata**をクリックします。

![1042](/images/security-sso/okta-sso-integration/8b9736c-image_1.png "image (1).png")

26. 右クリックして「名前を付けて保存」を選択します。
27. **Testim**タブに戻り、**Upload File**ボタンをクリックして、保存したばかりの*metadata.xml*ファイルを選択します。

![614](/images/security-sso/okta-sso-integration/31cb870-sso9.png "sso9.png")

28. 同じ画面で、**Enable SSO**トグルを有効にします。

![1336](/images/security-sso/okta-sso-integration/e687b64-sso10.png "sso10.png")

29. すべてのユーザーがOktaを通じてのみログインでき、通常のTestimログインページを通じてログインできないようにするには、**Force users to login via idP**チェックボックスを選択します。

![619](/images/security-sso/okta-sso-integration/1a94a23-sso11.png "sso11.png")

30. **Okta**タブに戻り、新しく作成したTestim SSOコネクタアプリケーションを関連するユーザー、グループ、またはロールに関連付けます。この例ではユーザーを追加する方法を示しますが、グループやロールにも同様に適用されます。
31. **Applications > Applications**に移動します。新しいTestim SSOコネクタが表示されます。

![1253](/images/security-sso/okta-sso-integration/508e2c1-tempsnip1.png "tempsnip1.png")

32. **Settings**（:fa-cog:）ドロップダウンをクリックし、**Assign to Users**を選択します。
33. 関連するユーザーに割り当てます。\
    新しく作成されたアプリが作成され、指定されたユーザー/グループ/ロールのOktaポータルに表示されます。これ以降、これらのユーザーはOkta SSOからTestimにログインできるようになります。
