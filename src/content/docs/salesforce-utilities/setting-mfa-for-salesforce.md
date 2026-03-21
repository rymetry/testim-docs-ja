---
title: Salesforce の MFA 設定
description: Salesforce の MFA（認証アプリ）を設定し、Testim for Salesforce の資格情報に認証キーを登録する手順を説明します。
category: Salesforceテスト
order: 16038
updated: '2025-12-02'
sourceUrl: 'https://help.testim.io/docs/setting-mfa-for-salesforce'
keywords:
  - MFA
  - 多要素認証
  - 認証アプリ
  - シークレットキー
  - ワンタイムパスワード
  - Verification Code
  - ペルソナ
  - 資格情報
---

セットアッププロセスでは、Salesforce からシークレットキーを取得し、ペルソナ/環境の組み合わせの資格情報を追加する際に関連フィールドにキーを入力する必要があります。最後に、Testim for Salesforce からの Verification Code を Salesforce の Verification Code フィールドに入力する必要があります。\
:fa-arrow-right: **MFA を設定するには:**

1. Salesforce にログインし、**設定 > ユーザー > ユーザー >** に移動し、MFA を設定するユーザーを選択します。

![Salesforce のユーザー詳細画面](/images/salesforce-utilities/setting-mfa-for-salesforce/bc293ae-image.png)

2. **アプリ登録: ワンタイムパスワード認証アプリ**で、サードパーティの認証アプリ（Google Authenticator、Microsoft Authenticator など）をすでに登録している場合は、シークレットキーを取得するために切断してから再接続する必要があります。
   - **ユーザー詳細**で、**アプリ登録 - ワンタイムパスワード認証アプリ**設定の**切断**をクリックします。
   - サードパーティの認証アプリを登録したことがない場合は、次のステップに進みます。

![アプリ登録（ワンタイムパスワード認証アプリ）の切断](/images/salesforce-utilities/setting-mfa-for-salesforce/e1f92f2-image_1.png)

3. **ユーザー詳細**で、**アプリ登録 - ワンタイムパスワード認証アプリ**設定の**接続**をクリックします。

![アプリ登録（ワンタイムパスワード認証アプリ）の接続](/images/salesforce-utilities/setting-mfa-for-salesforce/167397d-image_2.png)

4. ユーザー名とパスワードで Salesforce にログインし、次の通知が表示されたら、**別の検証方法を選択**を選択します。

![別の検証方法を選択](/images/salesforce-utilities/setting-mfa-for-salesforce/3eff270-pasted_image_0.png)

5. **検証方法を選択**画面で、**認証アプリから検証コードを使用**を選択し、**続行**をクリックします。

![認証アプリから検証コードを使用](/images/salesforce-utilities/setting-mfa-for-salesforce/522b354-pasted_image_0_1.png)

6. **認証アプリを接続**画面で、**QR コードをスキャンできません**をクリックします。

![QR コードをスキャンできません](/images/salesforce-utilities/setting-mfa-for-salesforce/71f0334-pasted_image_0_2.png)

7. シークレットキーが表示されます。シークレットキーをコピーします。

![シークレットキーの表示](/images/salesforce-utilities/setting-mfa-for-salesforce/7022745-pasted_image_0_4.png)

この時点で、Testim for Salesforce の目的のペルソナと環境の組み合わせに MFA を追加できます。

8. Testim for Salesforce で、**設定 > ペルソナ**に移動します。
9. 目的のペルソナと環境の組み合わせで**+**ボタンをクリックします。

   ![ペルソナの資格情報を追加（＋）](/images/salesforce-utilities/setting-mfa-for-salesforce/fa12927-plus.png)

10. **ユーザー名とパスワードでログイン**を選択します。\
    **資格情報の追加**ダイアログが表示されます。

    ![資格情報の追加ダイアログ](/images/salesforce-utilities/setting-mfa-for-salesforce/d6163b6-addcredentials.png)

11. 目的の**Salesforce プロファイル**と**Salesforce ユーザー**が選択されていることを確認します。
12. **Salesforce パスワード**を入力します。
13. **MFA 認証キー**に、上記のステップ 7 で保存したキーを貼り付け、**保存**をクリックします。\
    検証コードが表示されます:

![Testim for Salesforce の検証コード](/images/salesforce-utilities/setting-mfa-for-salesforce/76d0fe8-image_5.png)

10. Salesforce に戻り、表示された検証コードを**検証コード**に入力し、**接続**をクリックします。

    ![Salesforce の検証コード入力](/images/salesforce-utilities/setting-mfa-for-salesforce/f22ed82-7022745-pasted_image_0_4.png)
