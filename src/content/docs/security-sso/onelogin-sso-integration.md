---
title: OneLogin SSO 統合
description: >-
  OneLogin と Testim を SSO 統合する手順を説明します。OneLogin で一度認証すれば、再度認証することなく Testim にアクセスできます。
category: セキュリティ
order: 18003
updated: '2025-11-02'
sourceUrl: 'https://help.testim.io/docs/onelogin-sso-integration'
keywords:
  - OneLogin
  - SSO 統合
  - SAML
  - シングルサインオン
  - ID 管理
  - 認証
  - アクセス管理
---

OneLogin, Inc.はクラウドベースの ID およびアクセス管理プロバイダーで、企業や組織に統合アクセス管理プラットフォームを提供しています。Testim は OneLogin と統合されており、OneLogin のユーザーは OneLogin で一度認証すれば、再度認証することなく Testim にアクセスできます。

:::info
SSO はプレミアム機能です。デプロイメントで SSO 機能が有効になっていることを確認してください。有効になっていない場合は、Testim の CSM に連絡してください。
:::

**Testim OneLogin 統合をセットアップするには:**

1. **OneLogin**アカウントにログインします。
2. **Administration > Applications**に移動します。
3. **Add App**をクリックします。
4. 検索フィールドに*'SAML Test Connector'*と入力します。
5. **'SAML Test Connector (advanced)'** オプションをクリックします。

![SAML Test Connector 選択画面](/images/security-sso/onelogin-sso-integration/cc41ee8-sso3.png)

6. **Configuration**画面で、**Display Name**を*'Testim SSO'*などのわかりやすい名前に編集します。
7. Testim アイコンをアップロードして、コネクタのアイコンを変更することもできます（オプション）。こちらをクリックして Testim アイコンをダウンロードしてください。
8. **Upload**をクリックして、正方形または長方形のアイコンプレースホルダーにアップロードします。
9. ユーザーが Testim について詳しく知るのに役立つ**説明**を追加することもできます（オプション）。
10. **Save**をクリックします。\
    この時点でコネクタが作成されました。次に Testim に接続する必要があります。
11. 別のタブで**Testim Automate**を開き、右上隅にある**ユーザー**アイコンをクリックします。

![ユーザーアイコン](/images/security-sso/onelogin-sso-integration/713786e-sso1.png)

12. ドロップダウンメニューで、**Settings**をクリックし、**SSO**タブをクリックします。
13. **Testim Service Provider Details**の下の**Assertion Consumer Service URL**で、**Copy**ボタンをクリックします。

![Assertion Consumer Service URL](/images/security-sso/onelogin-sso-integration/a45415b-sso4.png)

14. **OneLogin**を開いているタブに戻り、コネクタアプリの**Configuration**に移動します。
15. コピーした**Assertion Consumer Service URL**を**ACS (Consumer) URL Validator**フィールドと**ACS Consumer URL**フィールドに貼り付けます。

![OneLogin Configuration 設定](/images/security-sso/onelogin-sso-integration/142378a-sso5.png)

16. **Testim Automate**タブに戻り、**Logout URL**コードをコピーします。
17. **OneLogin**タブで、このコードを**Single Logout URL**フィールドに貼り付けます。
18. **Save**をクリックします。
19. **OneLogin**タブのまま、**Parameters**画面に移動します。
20. **+** ボタンをクリックしてパラメーターを追加します。

![パラメーター追加フォーム](/images/security-sso/onelogin-sso-integration/ab6ffb7-sso6.png)

21. **Field**名に*'email'*と入力します。
22. **Include in SAML assertion**チェックボックスを選択します。
23. **Save**をクリックします。**Value**ドロップダウンメニューが表示されます。
24. **Value**ドロップダウンメニューで、**Email**を選択します。これにより、Testim の email フィールドが OneLogin の Email フィールドにマッピングされます。

![フィールド選択ドロップダウン](/images/security-sso/onelogin-sso-integration/cba956e-sso7.PNG)

25. 再度**Save**をクリックします。
26. 以下のフィールドの組み合わせについて、ステップ**20 – 25**を繰り返します:

- `firstName`（`First Name`にマッピング）
- `lastName`（`Last Name`にマッピング）
- `profilePicture`（`Profile Picture`にマッピング） – これはオプションです

27. **OneLogin**のまま、Info 画面に戻り、**More Actions**ドロップダウンメニューをクリックします。
28. **SAML Metadata**の横にある**download**アイコンをクリックし、ファイルをローカルフォルダーに保存します。

![SSO 設定ファイルアップロード](/images/security-sso/onelogin-sso-integration/201fcf1-sso8.png)

29. **Testim**タブに戻り、**Upload File**ボタンをクリックして、保存したばかりの*metadata.xml*ファイルを選択します。

![メタデータファイルアップロードボタン](/images/security-sso/onelogin-sso-integration/31cb870-sso9.png)

30. 同じ画面で、**Enable SSO**トグルを有効にします。

![SSO 有効化トグル](/images/security-sso/onelogin-sso-integration/e687b64-sso10.png)

31. すべてのユーザーが OneLogin を通じてのみログインでき、通常の Testim ログインページを通じてログインできないようにするには、**Force users to login via idP**チェックボックスを選択します。

![IdP 経由ログイン強制チェックボックス](/images/security-sso/onelogin-sso-integration/1a94a23-sso11.png)

32. **OneLogin**タブに戻り、新しく作成した Testim SSO コネクタアプリケーションを関連するユーザー、グループ、またはロールに関連付けます。この例ではユーザーを追加する方法を示しますが、グループやロールにも同様に適用されます。
33. **Users > Users**に移動します。
34. 目的のユーザーレコードをクリックします。ユーザーの User Info 画面が表示されます。
35. **Applications**に移動します。
36. **+** ボタンをクリックして新しいアプリケーションを追加します。
37. ドロップダウンメニューから新しく作成したアプリケーション（例: Testim SSO）を選択し、**Continue**をクリックします。\
    プロパティのリストが表示されます。これらは Testim と OneLogin 間でマッピングされたフィールドです。
38. **Save**をクリックします。\
    新しく作成されたアプリが作成され、指定されたユーザー/グループ/ロールの OneLogin ポータルに表示されます。これ以降、これらのユーザーは OneLogin SSO から Testim にログインできるようになります。
