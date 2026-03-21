# Applitools integration

How to integrate with Applitools to enable AI-Powered Visual Testing.

In order to use Testim’s visual validation and wait-for steps, you first need to integrate your Testim account with the Applitools Eyes app provided by [Applitools](https://applitools.com/).

> 📘 This is a pro feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

## Prerequisites

* This is a pro feature only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).
* You need to have admin privileges both in Applitools Eyes and in Testim.

## Setting up Applitools integration

You will need to exchange information between your Applitools Eyes account and your Testim account, so it is recommended to keep both consoles open in parallel.

### Step 1: Create an API key in Applitools Eyes

:fa-arrow-right: **To create an API key in Applitools Eyes:**

1. Log in to the **Applitools Eyes** console using an admin account.
2. On the Applitools Eyes home page, click on the **main menu** in the top right.

![](https://files.readme.io/b92e716-Testim_243a.png "Testim 243a.png")

The menu options are shown.

![](https://files.readme.io/528d244-Testim_244_r.png "Testim 244_r.png")

3. Click on **Admin**.\
   The **Admin panel** opens.

![](https://files.readme.io/ef5d9c2-Testim_245.png "Testim 245.png")

4. Click on **API keys**.\
   The **API keys** screen opens.

![](https://files.readme.io/bd902b4-Testim_246.png "Testim 246.png")

5. Click the **Add a new API key** button.

![](https://files.readme.io/4539ae9-Testim_246a.png "Testim 246a.png")

The **Add API key** options are shown.

![](https://files.readme.io/c62aa9e-Testim_247_r.png "Testim 247_r.png")

6. Enter the options as follows:
   * In the **Team** field choose a team from the dropdown list.
   * In the **User** field, choose the appropriate user.
   * In the **Permissions** section, toggle the **Execute** and **Merge** switches to the right.
   * In the **Expiry** field, optionally enter an expiration date for the API.
   * In the **Purpose** field, optionally enter the purpose of this API.
7. Click the **Add** button.\
   The key is created and shown on your **API keys** screen.

![](https://files.readme.io/fbfd882-Testim_248.png "Testim 248.png")

8. Copy this key for use below.

### Step 2: Configure Applitools settings in Testim

1. Log in to **Testim** using an admin account.
2. In **Testim**, in the left menu click on the **Settings** icon.

![](https://files.readme.io/1ee8f1c-Testim_258a.png "Testim 258a.png")

The **Settings** page opens.

3. Click the **Integration** tab.

![](https://files.readme.io/d8b3082-Testim_259a_r.png "Testim 259a_r.png")

The **Integrations** tab opens.

![](https://files.readme.io/564e0cb-Testim_260.png "Testim 260.png")

4. In the Applitools section, click **login**.

![](https://files.readme.io/6706450-Testim_261a_r.png "Testim 261a_r.png")

The **Applitools integration configuration options** are shown.

![](https://files.readme.io/968fe5b-Testim_262_r.png "Testim 262_r.png")

5. In the **Cloud URL** field, enter the Applitools application base URL (e.g. [https://eyes.applitools.com/](https://eyes.applitools.com/)).
6. In the **Run Key** and **Merge Key** fields, enter the key you previously created in Applitools.
7. In the **App Name** field, optionally enter a name for the app.\
   The default app name is the Project ID.
8. Click **Connect**.\
   A success icon is shown, and Applitools is integrated with Testim. You can now start using the visual validation and wait-for steps. See [Visual Validation](https://help.testim.io/docs/pixel-validation-and-pixel-wait-for).

![](https://files.readme.io/446380f-Testim_265_r.png "Testim 265_r.png")

> 📘
>
> You may need to log out of Testim and log back in in order to activate the visual validation steps.