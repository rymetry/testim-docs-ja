---
title: 'SalesforceのMFA設定'
description: '原文: https://help.testim.io/docs/setting-mfa-for-salesforce'
category: 'Salesforceユーティリティ'
order: 8
updated: '2025-11-02'
keywords:
  - testim
  - setting-mfa-for-salesforce
  - salesforce-utilities
---

セットアッププロセスでは、Salesforceからシークレットキーを取得し、ペルソナ/環境の組み合わせの資格情報を追加する際に関連フィールドにキーを入力する必要があります。最後に、Testim for SalesforceからのVerification CodeをSalesforceのVerification Codeフィールドに入力する必要があります。\
:fa-arrow-right: **MFAを設定するには:**

1. Salesforceにログインし、**設定 > ユーザー > ユーザー >** に移動し、MFAを設定するユーザーを選択します。

![](/images/salesforce-utilities/setting-mfa-for-salesforce/bc293ae-image.png "image.png")

2. **アプリ登録: ワンタイムパスワード認証アプリ**で、サードパーティの認証アプリ（Google Authenticator、Microsoft Authenticatorなど）をすでに登録している場合は、シークレットキーを取得するために切断してから再接続する必要があります。
   * **ユーザー詳細**で、**アプリ登録 - ワンタイムパスワード認証アプリ**設定の**切断**をクリックします。
   * サードパーティの認証アプリを登録したことがない場合は、次のステップに進みます。

![](/images/salesforce-utilities/setting-mfa-for-salesforce/e1f92f2-image_1.png "image (1).png")

3. **ユーザー詳細**で、**アプリ登録 - ワンタイムパスワード認証アプリ**設定の**接続**をクリックします。

![](/images/salesforce-utilities/setting-mfa-for-salesforce/167397d-image_2.png "image (2).png")

4. ユーザー名とパスワードでSalesforceにログインし、次の通知が表示されたら、**別の検証方法を選択**を選択します。

![](/images/salesforce-utilities/setting-mfa-for-salesforce/3eff270-pasted_image_0.png "pasted image 0.png")

5. **検証方法を選択**画面で、**認証アプリから検証コードを使用**を選択し、**続行**をクリックします。

![](/images/salesforce-utilities/setting-mfa-for-salesforce/522b354-pasted_image_0_1.png "pasted image 0 (1).png")

6. **認証アプリを接続**画面で、**QRコードをスキャンできません**をクリックします。

![](/images/salesforce-utilities/setting-mfa-for-salesforce/71f0334-pasted_image_0_2.png "pasted image 0 (2).png")

7. シークレットキーが表示されます。シークレットキーをコピーします。

![](/images/salesforce-utilities/setting-mfa-for-salesforce/7022745-pasted_image_0_4.png "pasted image 0 (4).png")

この時点で、Testim for Salesforceの目的のペルソナと環境の組み合わせにMFAを追加できます。

8. Testim for Salesforceで、**設定 > ペルソナ**に移動します。
9. 目的のペルソナと環境の組み合わせで**+**ボタンをクリックします。

   ![](/images/salesforce-utilities/setting-mfa-for-salesforce/fa12927-plus.png)
10. **ユーザー名とパスワードでログイン**を選択します。\
    **資格情報の追加**ダイアログが表示されます。

    ![](/images/salesforce-utilities/setting-mfa-for-salesforce/d6163b6-addcredentials.png)
11. 目的の**Salesforceプロファイル**と**Salesforceユーザー**が選択されていることを確認します。
12. **Salesforceパスワード**を入力します。
13. **MFA認証キー**に、上記のステップ7で保存したキーを貼り付け、**保存**をクリックします。\
    検証コードが表示されます:

![](/images/salesforce-utilities/setting-mfa-for-salesforce/76d0fe8-image_5.png "image (5).png")

10. Salesforceに戻り、表示された検証コードを**検証コード**に入力し、**接続**をクリックします。

    ![](/images/salesforce-utilities/setting-mfa-for-salesforce/f22ed82-7022745-pasted_image_0_4.png)
