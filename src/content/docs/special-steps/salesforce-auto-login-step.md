---
title: 'Salesforce 自動ログインステップ'
description: '原文: https://help.testim.io/docs/salesforce-auto-login-step'
category: '特殊ステップ'
order: 1
updated: '2025-11-02'
keywords:
  - testim
  - salesforce-auto-login-step
  - special-steps
---
Salesforce 環境（本番/サンドボックス）にログイン・ログアウトの記録無しで認証できるステップです。ログインステップを追加し、接続先の情報を入力するだけで、すぐにテストの記録を開始できます。

> 📘
>
> Salesforce 側で二要素認証（2FA/MFA）が有効な場合、テストを実行するマシンのIPを許可リストに追加するよう組織のSalesforce管理者へ依頼してください。

> 📘 共有ステップのコピー
>
> ログインステップが共有ステップの場合、「SF environment」の値を編集すると、使用中のすべてのインスタンスに反映されます。共有でないステップを同一テスト内でコピーした場合は、そのコピーに対する編集は他のコピーへ影響しません。

### MFA 認証

2022年2月1日以降、Salesforce はログイン時の多要素認証（MFA）を必須化しました。Testim では、Salesforce 自動ログイン実行時にMFAを行うソフトウェア型オーセンティケータを実装しています。有効化手順は[Setting up MFA](doc:salesforce-auto-login-step#setting-up-mfa) を参照してください。

## Salesforce 自動ログインステップを追加する

:fa-arrow-right: **追加手順:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the step.

![](/images/special-steps/salesforce-auto-login-step/3e1c90c-Testim_512a.png "Testim 512a.png")

The **action items** are displayed.

![](/images/special-steps/salesforce-auto-login-step/9b114f6-Testim_566.png "Testim 566.png")

2. Click on the “**M**” (Testim predefined steps).\
   The **Predefined steps** menu opens.

![](/images/special-steps/salesforce-auto-login-step/c70c927-Testim_544_r.png "Testim 544_r.png")

3. Click on **Salesforce**.\
   The **Salesforce** menu expands.

![](/images/special-steps/salesforce-auto-login-step/cedf632-Testim_545_r.png "Testim 545_r.png")

4. Scroll down through the menu and select **Salesforce auto-login**.

> 📘
>
> Alternatively, you can use the search box at the top of the menu to search for **Salesforce auto-login**.

The **Add Step** window is shown.

![](/images/special-steps/salesforce-auto-login-step/9bcc036-2d49d61-Testim_567_r.png "2d49d61-Testim_567_r.png")

5. **Name** にわかりやすい名前を入力します。
6. 他テストでも再利用したい場合は **Shared step** をオンのまま、保存先フォルダを選択します（詳細は[グループ](/docs/groups/groups)）。
7. Click **Create Step**.
8. Hover over the step and click on the Show Properties (:fa-cog:) icon. The step is added in the **Editor**, and the **Properties** panel opens on the right-hand side.

![](/images/special-steps/salesforce-auto-login-step/2c50d67-newproperties.png "newproperties.png")

9. **Login URL** に環境のログインURLを入力します。
10. **Username** と **Password** に認証情報を入力します。
11. MFA を使う場合は [Setting up MFA](doc:salesforce-auto-login-step#setting-up-mfa) に従います。\
    これで設定は完了です。

### パラメータの使用

テスト／スイート／設定ファイル／他ステップで定義したパラメータを用いて接続情報を渡せます。

> 📘
>
> MFA のシークレットキーはパラメータとして扱えません。

:fa-arrow-right: **接続情報にパラメータを使う:**

1. Define parameters in one of the following ways:
   * **Add a parameter to the test data** – You can define a parameter by adding **Test Data** to the **Setup** step (the first step of the test). For detailed instructions, see [Configuring a data driven test from the visual editor](doc:data-driven-testing#section-configuring-a-data-driven-test-from-the-visual-editor).
   * **Add a parameter to the config file** – You can add a parameter to the [Configuration file](/docs/configuration-file/configuration-file-run-hooks). For detailed instructions, see [Configuring Data Driven Tests using the Config file](doc:data-driven-testing#section-configuring-data-driven-tests-using-the-config-file).
   * **Add a parameter to a Custom step** – You can create a Custom step and then add a parameter to this Custom Step. For detailed instructions, see [Parameters in custom JavaScript steps](/docs/parameters/parameters-in-custom-javascript-steps).\
     You then need to pass the parameter to the *Salesforce auto-login* step or to the test level, by exporting the parameter. For detailed instructions, see [Exports Parameters](/docs/parameters/exports-parameters).
2. In your *Salesforce auto-login* step, add the parameters to the **URL**, **Username**, and **Password** fields.

## MFA のセットアップ

Salesforce 側でシークレットキーを取得し、Testim のプロパティパネルにある Secret Key に登録します。\
:fa-arrow-right: **手順:**

1. Login to Salesforce and Navigate to **Setup > Users > Users >** and select the user for which you want to set up MFA.

![](/images/special-steps/salesforce-auto-login-step/bc293ae-image.png "image.png")

2. If you have already registered a 3rd party Authenticator app (Google Authenticator, Microsoft Authenticator etc.) under **App Registration: One-Time Password Authenticator**, you will need to disconnect it and then reconnect in order to obtain the secret key.  
   * Under **User Details**, in the **App Registration - One-Time Password Authenticator** setting, click **Disconnect**.
   * If you have never registered a 3rd party Authenticator App, proceed to the next step.

![](/images/special-steps/salesforce-auto-login-step/e1f92f2-image_1.png "image (1).png")

3. Under **User Details**, in the **App Registration - One-Time Password Authenticator** setting, click **Connect**.

![](/images/special-steps/salesforce-auto-login-step/167397d-image_2.png "image (2).png")

4. Login into Salesforce with your user name and password, when prompted with the following notice, select **Choose another verification method**.

![](/images/special-steps/salesforce-auto-login-step/3eff270-pasted_image_0.png "pasted image 0.png")

5. In the **Choose a verification method** screen, select **Use verification codes from an authenticator app** and click **Continue**.

![](/images/special-steps/salesforce-auto-login-step/522b354-pasted_image_0_1.png "pasted image 0 (1).png")

6. In the **Connect an authenticator app screen**, click **I cant scan the QR code**.

![](/images/special-steps/salesforce-auto-login-step/71f0334-pasted_image_0_2.png "pasted image 0 (2).png")

7. A secret key is displayed. Copy the secret key.

![](/images/special-steps/salesforce-auto-login-step/7022745-pasted_image_0_4.png "pasted image 0 (4).png")

8. When adding the Salesforce Auto-Login step (see - [Adding a Salesforce Login Step](doc:salesforce-auto-login-step#adding-a-salesforce-auto-login-step), in the step's **Properties Panel**, under **Login with MFA**, click the **ADD KEY** button.

![](/images/special-steps/salesforce-auto-login-step/79bffd0-image_3.png "image (3).png")

9. Paste the key that you have copied from Salesforce into the **Your Key** field and click **Add**.

![](/images/special-steps/salesforce-auto-login-step/33e9456-image_4.png "image (4).png")

A verification code is displayed:

![](/images/special-steps/salesforce-auto-login-step/76d0fe8-image_5.png "image (5).png")

10. Go back to Salesforce and enter the verification code that was displayed into the **Verification Code** and click **Connect**.  

![](/images/special-steps/salesforce-auto-login-step/d783a5c-verification_code.png "verification_code.png")
