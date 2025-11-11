---
title: 'OneLogin SSO統合'
description: '原文: https://help.testim.io/docs/onelogin-sso-integration'
category: 'セキュリティ・SSO'
order: 3
updated: '2025-11-02'
keywords:
  - testim
  - onelogin-sso-integration
  - security-sso
---
OneLogin, Inc.はクラウドベースのIDおよびアクセス管理プロバイダーで、企業や組織に統合アクセス管理プラットフォームを提供しています。TestimはOneLoginと統合されており、OneLoginのユーザーはOneLoginで一度認証すれば、再度認証することなくTestimにアクセスできます。

> 📘 SSOはプレミアム機能です。デプロイメントでSSO機能が有効になっていることを確認してください。有効になっていない場合は、TestimのCSMに連絡してください。

:fa-arrow-right: **Testim OneLogin統合をセットアップするには:**

1. **OneLogin**アカウントにログインします。
2. **Administration > Applications**に移動します。
3. **Add App**をクリックします。
4. 検索フィールドに*'SAML Test Connector'*と入力します。
5. **'SAML Test Connector (advanced)'**オプションをクリックします。

![840](/images/security-sso/onelogin-sso-integration/cc41ee8-sso3.png "sso3.png")

6. **Configuration**画面で、**Display Name**を*'Testim SSO'*などのわかりやすい名前に編集します。
7. Testimアイコンをアップロードして、コネクタのアイコンを変更することもできます（オプション）。こちらをクリックしてTestimアイコンをダウンロードしてください。
8. **Upload**をクリックして、正方形または長方形のアイコンプレースホルダーにアップロードします。
9. ユーザーがTestimについて詳しく知るのに役立つ**説明**を追加することもできます（オプション）。
10. **Save**をクリックします。\
    この時点でコネクタが作成されました。次にTestimに接続する必要があります。
11. 別のタブで**Testim Automate**を開き、右上隅にある**ユーザー**アイコンをクリックします。

![285](/images/security-sso/onelogin-sso-integration/713786e-sso1.png "sso1.png")

12. ドロップダウンメニューで、**Settings**をクリックし、**SSO**タブをクリックします。
13. **Testim Service Provider Details**の下の**Assertion Consumer Service URL**で、**Copy**ボタンをクリックします。

![558](/images/security-sso/onelogin-sso-integration/a45415b-sso4.png "sso4.png")

14. **OneLogin**を開いているタブに戻り、コネクタアプリの**Configuration**に移動します。
15. コピーした**Assertion Consumer Service URL**を**ACS (Consumer) URL Validator**フィールドと**ACS Consumer URL**フィールドに貼り付けます。

![1137](/images/security-sso/onelogin-sso-integration/142378a-sso5.png "sso5.png")

16. **Testim Automate**タブに戻り、**Logout URL**コードをコピーします。
17. **OneLogin**タブで、このコードを**Single Logout URL**フィールドに貼り付けます。
18. **Save**をクリックします。
19. **OneLogin**タブのまま、**Parameters**画面に移動します。
20. **+**ボタンをクリックしてパラメータを追加します。

![1272](/images/security-sso/onelogin-sso-integration/ab6ffb7-sso6.png "sso6.png")

21. **Field**名に*'email'*と入力します。
22. **Include in SAML assertion**チェックボックスを選択します。
23. **Save**をクリックします。**Value**ドロップダウンメニューが表示されます。
24. **Value**ドロップダウンメニューで、**Email**を選択します。これにより、TestimのemailフィールドがOneLoginのEmailフィールドにマッピングされます。

![440](/images/security-sso/onelogin-sso-integration/cba956e-sso7.PNG "sso7.PNG")

25. 再度**Save**をクリックします。
26. 以下のフィールドの組み合わせについて、ステップ**20 – 25**を繰り返します:

* `firstName`（`First Name`にマッピング）
* `lastName`（`Last Name`にマッピング）
* `profilePicture`（`Profile Picture`にマッピング） – これはオプションです

27. **OneLogin**のまま、Info画面に戻り、**More Actions**ドロップダウンメニューをクリックします。
28. **SAML Metadata**の横にある**download**アイコンをクリックし、ファイルをローカルフォルダに保存します。

![1496](/images/security-sso/onelogin-sso-integration/201fcf1-sso8.png "sso8.png")

29. **Testim**タブに戻り、**Upload File**ボタンをクリックして、保存したばかりの*metadata.xml*ファイルを選択します。

![614](/images/security-sso/onelogin-sso-integration/31cb870-sso9.png "sso9.png")

30. 同じ画面で、**Enable SSO**トグルを有効にします。

![1336](/images/security-sso/onelogin-sso-integration/e687b64-sso10.png "sso10.png")

31. すべてのユーザーがOneLoginを通じてのみログインでき、通常のTestimログインページを通じてログインできないようにするには、**Force users to login via idP**チェックボックスを選択します。

![619](/images/security-sso/onelogin-sso-integration/1a94a23-sso11.png "sso11.png")

32. **OneLogin**タブに戻り、新しく作成したTestim SSOコネクタアプリケーションを関連するユーザー、グループ、またはロールに関連付けます。この例ではユーザーを追加する方法を示しますが、グループやロールにも同様に適用されます。
33. **Users > Users**に移動します。
34. 目的のユーザーレコードをクリックします。ユーザーのUser Info画面が表示されます。
35. **Applications**に移動します。
36. **+**ボタンをクリックして新しいアプリケーションを追加します。
37. ドロップダウンメニューから新しく作成したアプリケーション（例: Testim SSO）を選択し、**Continue**をクリックします。\
    プロパティのリストが表示されます。これらはTestimとOneLogin間でマッピングされたフィールドです。
38. **Save**をクリックします。\
    新しく作成されたアプリが作成され、指定されたユーザー/グループ/ロールのOneLoginポータルに表示されます。これ以降、これらのユーザーはOneLogin SSOからTestimにログインできるようになります。
