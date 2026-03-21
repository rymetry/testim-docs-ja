# Salesforce Auto-Login Step

The *Salesforce auto-login* step allows the test to login to the Salesforce environment (or sandbox) without the need to record login or logout steps. After you add the login step and enter the details of the environment you are testing, you can start recording your test.

> 📘
>
> If your Salesforce environment is protected with 2-factor authentication, you will need your organization’s Salesforce administrator to whitelist the IP for the machine from which you are running your tests in order for the auto login step to pass.

> 📘 Copying a shared login step
>
> If you copy and paste a login step, if this step is a shared step, editing the values of the "SF environment" will  cause a change in all the used instances of this shared step. However, if *its not a shared step* and its copied and pasted inside the test, it is possible to edit the step’s values and it will not affect the other copies of the login step.

### MFA Authentication

As of Feb 1 2022 Salesforce announced it will enforce multifactor authentication (MFA) when logging in to their environment. To support automatic login using MFA, Testim has implemented a software-based authenticator that will perform MFA when the Salesforce Auto-login step is executed. To enable this feature, follow the instructions in the [Setting up MFA](https://help.testim.io/docs/salesforce-auto-login-step#setting-up-mfa) section below.

## Adding a Salesforce Auto-Login Step

:fa-arrow-right: **To add a Salesforce auto-login step:**

1. Hover over the :fa-caret-right: **(arrow symbol)** where you want to add the step.

![](https://files.readme.io/3e1c90c-Testim_512a.png "Testim 512a.png")

The **action items** are displayed.

![](https://files.readme.io/9b114f6-Testim_566.png "Testim 566.png")

2. Click on the “**M**” (Testim predefined steps).\
   The **Predefined steps** menu opens.

![](https://files.readme.io/c70c927-Testim_544_r.png "Testim 544_r.png")

3. Click on **Salesforce**.\
   The **Salesforce** menu expands.

![](https://files.readme.io/cedf632-Testim_545_r.png "Testim 545_r.png")

4. Scroll down through the menu and select **Salesforce auto-login**.

> 📘
>
> Alternatively, you can use the search box at the top of the menu to search for **Salesforce auto-login**.

The **Add Step** window is shown.

![](https://files.readme.io/9bcc036-2d49d61-Testim_567_r.png "2d49d61-Testim_567_r.png")

5. In the **Name** the new step field, enter a (meaningful) name for this step.
6. If this is a shared step to be made available to reuse in this or other tests, keep the box next to **Shared step** selected (default), and choose a folder from the Select shared step folder list where you want this step stored. Otherwise, deselect the checkbox.\
   For more information about shared steps, see [Groups](https://help.testim.io/docs/groups).
7. Click **Create Step**.
8. Hover over the step and click on the Show Properties (:fa-cog:) icon. The step is added in the **Editor**, and the **Properties** panel opens on the right-hand side.

![](https://files.readme.io/2c50d67-newproperties.png "newproperties.png")

9. In the **Login URL** field, enter the login of your Salesforce environment.
10. In the **Username** and **Password** fields, enter your login credentials.
11. If you need to use MFA, follow the steps in the [Setting up MFA](https://help.testim.io/docs/salesforce-auto-login-step#setting-up-mfa) section).\
    The *Salesforce auto-login* step is configured.

### Using parameters

You can use parameters which were defined in the test or suite level, in the config file, or in another step to enter your connection properties for your Salesforce environment.

> 📘
>
> When using MFA, the value of the MFA secret key cannot be used as a parameter.

:fa-arrow-right: **To use parameters to enter your connection properties:**

1. Define parameters in one of the following ways:
   * **Add a parameter to the test data** – You can define a parameter by adding **Test Data** to the **Setup** step (the first step of the test). For detailed instructions, see [Configuring a data driven test from the visual editor](https://help.testim.io/docs/data-driven-testing#section-configuring-a-data-driven-test-from-the-visual-editor).
   * **Add a parameter to the config file** – You can add a parameter to the [Configuration file](https://help.testim.io/docs/configuration-file-run-hooks). For detailed instructions, see [Configuring Data Driven Tests using the Config file](https://help.testim.io/docs/data-driven-testing#section-configuring-data-driven-tests-using-the-config-file).
   * **Add a parameter to a Custom step** – You can create a Custom step and then add a parameter to this Custom Step. For detailed instructions, see [Parameters in custom JavaScript steps](https://help.testim.io/docs/parameters-in-custom-javascript-steps).\
     You then need to pass the parameter to the *Salesforce auto-login* step or to the test level, by exporting the parameter. For detailed instructions, see [Exports Parameters](https://help.testim.io/docs/exports-parameters).
2. In your *Salesforce auto-login* step, add the parameters to the **URL**, **Username**, and **Password** fields.

## Setting up MFA

The setup process requires obtaining the secret key from Salesforce and entering the key into the Secret Key field in the Properties panel in Testim.\
:fa-arrow-right: **To setup MFA:**

1. Login to Salesforce and Navigate to **Setup > Users > Users >** and select the user for which you want to set up MFA.

![](https://files.readme.io/bc293ae-image.png "image.png")

2. If you have already registered a 3rd party Authenticator app (Google Authenticator, Microsoft Authenticator etc.) under **App Registration: One-Time Password Authenticator**, you will need to disconnect it and then reconnect in order to obtain the secret key.
   * Under **User Details**, in the **App Registration - One-Time Password Authenticator** setting, click **Disconnect**.
   * If you have never registered a 3rd party Authenticator App, proceed to the next step.

![](https://files.readme.io/e1f92f2-image_1.png "image (1).png")

3. Under **User Details**, in the **App Registration - One-Time Password Authenticator** setting, click **Connect**.

![](https://files.readme.io/167397d-image_2.png "image (2).png")

4. Login into Salesforce with your user name and password, when prompted with the following notice, select **Choose another verification method**.

![](https://files.readme.io/3eff270-pasted_image_0.png "pasted image 0.png")

5. In the **Choose a verification method** screen, select **Use verification codes from an authenticator app** and click **Continue**.

![](https://files.readme.io/522b354-pasted_image_0_1.png "pasted image 0 (1).png")

6. In the **Connect an authenticator app screen**, click **I cant scan the QR code**.

![](https://files.readme.io/71f0334-pasted_image_0_2.png "pasted image 0 (2).png")

7. A secret key is displayed. Copy the secret key.

![](https://files.readme.io/7022745-pasted_image_0_4.png "pasted image 0 (4).png")

8. When adding the Salesforce Auto-Login step (see - [Adding a Salesforce Login Step](https://help.testim.io/docs/salesforce-auto-login-step#adding-a-salesforce-auto-login-step), in the step's **Properties Panel**, under **Login with MFA**, click the **ADD KEY** button.

![](https://files.readme.io/79bffd0-image_3.png "image (3).png")

9. Paste the key that you have copied from Salesforce into the **Your Key** field and click **Add**.

![](https://files.readme.io/33e9456-image_4.png "image (4).png")

A verification code is displayed:

![](https://files.readme.io/76d0fe8-image_5.png "image (5).png")

10. Go back to Salesforce and enter the verification code that was displayed into the **Verification Code** and click **Connect**.

![](https://files.readme.io/d783a5c-verification_code.png "verification_code.png")