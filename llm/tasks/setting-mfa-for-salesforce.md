# 翻訳タスク (setting-mfa-for-salesforce)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

The setup process requires obtaining the secret key from Salesforce and entering the key into the relevant field when adding the credentials for Persona/Environment combination. Finally the Verification Code from Testim for Salesforce should be entered back into the Verification Code field in Salesforce.\
:fa-arrow-right: **To setup MFA:**

1. Login to Salesforce and Navigate to **Setup > Users > Users >** and select the user for which you want to set up MFA.

![](/images/salesforce-utilities/setting-mfa-for-salesforce/bc293ae-image.png "image.png")

2. If you have already registered a 3rd party Authenticator app (Google Authenticator, Microsoft Authenticator etc.) under **App Registration: One-Time Password Authenticator**, you will need to disconnect it and then reconnect in order to obtain the secret key.  
   - Under **User Details**, in the **App Registration - One-Time Password Authenticator** setting, click **Disconnect**.
   - If you have never registered a 3rd party Authenticator App, proceed to the next step.

![](/images/salesforce-utilities/setting-mfa-for-salesforce/e1f92f2-image_1.png "image (1).png")

3. Under **User Details**, in the **App Registration - One-Time Password Authenticator** setting, click **Connect**.

![](/images/salesforce-utilities/setting-mfa-for-salesforce/167397d-image_2.png "image (2).png")

4. Login into Salesforce with your user name and password, when prompted with the following notice, select **Choose another verification method**.

![](/images/salesforce-utilities/setting-mfa-for-salesforce/3eff270-pasted_image_0.png "pasted image 0.png")

5. In the **Choose a verification method** screen, select **Use verification codes from an authenticator app** and click **Continue**.

![](/images/salesforce-utilities/setting-mfa-for-salesforce/522b354-pasted_image_0_1.png "pasted image 0 (1).png")

6. In the **Connect an authenticator app screen**, click **I cant scan the QR code**.

![](/images/salesforce-utilities/setting-mfa-for-salesforce/71f0334-pasted_image_0_2.png "pasted image 0 (2).png")

7. A secret key is displayed. Copy the secret key.

![](/images/salesforce-utilities/setting-mfa-for-salesforce/7022745-pasted_image_0_4.png "pasted image 0 (4).png")

At this point, you can add the MFA to the desired Persona and Environment combination on Testim for Salesforce.

8. In Testim for Salesforce, go to **Settings > Personas**.
9. Click the **+** button on the desired Persona and Environment combination.

   ![](/images/salesforce-utilities/setting-mfa-for-salesforce/fa12927-plus.png)
10. Select **Login with Username and Password**.\
    The **Add Credentials** dialog is displayed.

    ![](/images/salesforce-utilities/setting-mfa-for-salesforce/d6163b6-addcredentials.png)
11. Make sure the desired **Salesforce Profile** and **Salesforce User** are selected.
12. Enter the **Salesforce Password**.
13. In the **MFA Authenticator Key**, paste the key that you have saved in step 7 above and click **Save**.\
    A verification code is displayed:

![](/images/salesforce-utilities/setting-mfa-for-salesforce/76d0fe8-image_5.png "image (5).png")

10. Go back to Salesforce and enter the verification code that was displayed into the **Verification Code** and click **Connect**.

    ![](/images/salesforce-utilities/setting-mfa-for-salesforce/f22ed82-7022745-pasted_image_0_4.png)
