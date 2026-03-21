# Project settings

Learn where to change your project settings (name, default URL, Personal CLI and more)

On the **Settings > Project** tab you can modify general settings for your project and also change your pull requests settings.

## General Settings

On the **General** tab you can modify general settings related to your project including its name, the default base URL, and the list of hidden parameters for the project. You can also toggle on/off the auto-complete suggestion feature.

### Project Name

The project name is the name applied to your overall project. Only the project owner or the company owner can edit the project name.

:fa-arrow-right: **To edit the project name:**

1. On the **Settings > Project** page, click **General**.

![533](https://files.readme.io/186b1b8-Picture1.png "Picture1.png")

2. In the **Project Name** section, click the **Edit** button (pencil).

![502](https://files.readme.io/f225cca-Picture2.png "Picture2.png")

The **Project Name** window opens.\
3\. In the **Enter a new name for this project** field, enter the new name.

![354](https://files.readme.io/ad8a31f-Picture3.png "Picture3.png")

4. Click **OK**.

![355](https://files.readme.io/e99b797-Picture4.png "Picture4.png")

The **Project Name** window closes, and the project name is updated.

### Default Base URL

The base URL is the default URL that is used when creating new tests.

:fa-arrow-right: **To edit the default base URL:**

1. On the **Settings > Project** page, click **General**.

![489](https://files.readme.io/e75b51b-Picture5.png "Picture5.png")

2. In the **Default Base URL** section, click the **Edit** button (pencil).

![458](https://files.readme.io/2c841e2-Picture6.png "Picture6.png")

The **Test Default URL** window opens.\
3\. In the **Your app URL** field, enter the URL of the app to be tested.

![344](https://files.readme.io/38fd0c6-Picture7.png "Picture7.png")

4. Click **OK**.

![344](https://files.readme.io/27396a6-Picture8.png "Picture8.png")

The **Test Default URL** window closes, and the base URL is updated.

### Default Test Configuration

The default test configuration is the configuration that is used when creating new tests. You can choose on of the test configurations available in the Configuration List. For more info, see [Configuration List](https://help.testim.io/docs/shared-configuration).

:fa-arrow-right: **To edit the default test configuration:**

1. On the **Settings > Project** page, click **General**.

![533](https://files.readme.io/4da3d58-Picture9.png "Picture9.png")

2. In the **Default Test Configuration** section, click the **Edit** button (pencil ).

![477](https://files.readme.io/3b78b90-Picture10.png "Picture10.png")

3. Choose your desired default configuration, and click **Select**.

![284](https://files.readme.io/a8bb9b9-Picture11.png "Picture11.png")

The default test configuration is updated. New tests in this project will run using the chosen configuration.

### Allow auto-complete suggestions

Testim’s auto-complete feature offers you the option to automatically use previously recorded shared group steps in the test you are currently recording, helping you expedite the test recording process. To read more about auto-complete, see [Auto complete](https://help.testim.io/docs/auto-complete).

> 📘 This feature is only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

:fa-arrow-right: **To turn off/on the auto-complete suggestions feature:**

1. On the **Settings > Project** page, click **General**.

![491](https://files.readme.io/afd5208-Picture12.png "Picture12.png")

2. Click the **Allow auto-complete suggestions** toggle. (Left = off; Right = on)

![487](https://files.readme.io/05d39e3-Picture13.png "Picture13.png")

### Hidden Parameters

This setting allows you to modify the list of the hidden parameters. When running a test via CLI, Testim allows you to hide parameter values sent to Testim so that their values will not be saved in Testim’s database or displayed in the UI test results. To read more about hidden parameters, see [Hidden parameters](https://help.testim.io/docs/hidden-parameters).

:fa-arrow-right: **To modify the hidden parameters list:**

1. On the **Settings > Project** page, click **General**.

![475](https://files.readme.io/7be7e39-Picture14.png "Picture14.png")

The current list of hidden parameters is shown in the **Hidden Parameters** section. If there are no parameters currently in the list, the **Add hidden params** link is shown.\
2\. Click on the **Add hidden params** link.

![487](https://files.readme.io/f841a78-Picture15.png "Picture15.png")

> 📘 Alternatively, if there are already parameters in the list, click on the parameter list.

The **Hidden Parameters** window is shown.

![784](https://files.readme.io/a25a3bb-Picture16.png "Picture16.png")

3. In the **The params you want to hide** field:

* For every hidden parameter you wish to add, type the name of the parameter, and press Enter. (The hidden parameter names are case-sensitive.)
* For every hidden parameter you wish to delete, click on the “**x**” to the right of the parameter name.

![315](https://files.readme.io/a0c01f0-Picture17.png "Picture17.png")

4. Click **Update**.

![313](https://files.readme.io/1e32984-Picture18.png "Picture18.png")

The updated list of hidden parameters is shown in the **Hidden Parameters** section.

## Pull Request Settings

The pull requests settings allow you to protect specific branches of your project from changes, and configure which branches require the approval of a reviewer and the users are allowed to review pull requests. The pull request settings are configured per project. Only the project owner or the company owner can modify these settings . To read more about pull requests, see [Pull Requests](https://help.testim.io/docs/pull-requests).

> 📘 This is a pro feature only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

![521](https://files.readme.io/cda9cf7-Picture19.png "Picture19.png")

### Protecting branches from changes

This setting prevents writing directly to the Master branch and/or to selected branch/es (read-only). If you have selected the Master branch, you can still allow the [Auto-improve](https://help.testim.io/docs/locators-auto-improve) changes to automatically improve the test locators in order to enhance the stability of the test.

:fa-arrow-right: **To lock/unlock the master branch of your project:**

1. Turn on the **Protect branches from changes** toggle.
2. Select the branches that you want to protect. You can use the search box to search for branches.
3. If you have selected the Master branch, turn on the **Allow Auto-improve on master** toggle to allow the Auto-improve feature to automatically improve the test locators in order to enhance the stability of the test.

### Requiring approval from reviewer

This setting specifies which branches require a reviewer to approve the pull request before it is merged into the target branch and who are the reviewers.

:fa-arrow-right: **To configure approval from reviewer branches:**

1. Turn on the **Require approving reviewer** toggle.
2. Under **Branches**, select the branches that you want to apply this setting on. You can use the search box to search for branches. You can select **All branches** to apply the setting on all branches.
3. Under **Reviewers**, select the users from the list to be the reviewers of the project. You can use the search box to search for users. You can select **All users** to set all the users in the list as reviewers.

### Allowing self approval

If you have enabled the Require approving reviewer feature you can optionally select users that can approve their own pull requests.

:fa-arrow-right: **To configure self approval:**

1. Turn on the **Allow self approval** toggle.
2. Select the users that you want to apply this setting on. You can use the search box to search for users.