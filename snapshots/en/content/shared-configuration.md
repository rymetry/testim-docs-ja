# Configuration Library - Web

Use the same test configuration in multiple/all tests

The **Configuration List** page shows all of the test configurations that were created and available to use for your tests, whether you run them locally or with your CLI. A test’s configuration determines the system specifications used to run the test. If you intend to run a test locally then the configuration should match your local environment. If you intend to run a test on the Testim Grid, then Testim simulates the environment that you specified. You can include a test configuration when running tests with your CLI by using the `--test-config` flag. For more information, see [Test Config](https://help.testim.io/docs/the-command-line-cli#section-test-config). The test configurations in this list can be created and modified in the *Configuration Library* or in the Setup step in the *Test Editor*.

## View Existing Configurations

Within a web project, all configuration sets are stored within the Configuration Library. The following information is displayed for each configuration:

* **Name** - name given to identify the configuration
* **OS**- the operating system used for the configuration
* **Resolution**- the screen resolution used for the configuration
* **Browser**- the browser used for the configuration
* **Step Timeout** - the amount of time in milliseconds the test will timeout
* **Step Delay** - the amount of time Testim will automatically pause between each step in the test

![](https://files.readme.io/6d34e75-webconfiglibrary.png)

* **Configuration Library** – You can create a new configuration in your configuration library. This configuration will apply to all steps run in a test that is set with that configuration (including tests run via CLI or Scheduler). For more information on test configuration, see [Setting the Test Configuration](https://help.testim.io/docs/how-to-record-a-test#section-step-3-setting-the-test-configuration). For more information about the CLI, see [Command line interface: Test Config](https://help.testim.io/docs/the-command-line-cli#section-test-config). For more information about the Scheduler, see [Scheduler](https://help.testim.io/docs/scheduler).
* **Setup Step in the Test Editor** – Every test has its own default configuration accessible from the property panel of the test’s Setup step. The configuration parameters that are set in the test’s default configuration will apply unless the test is run from the CLI or a scheduler with a different configuration.

> 📘
>
> When the test is run in the CLI, you can override the default configuration by specifying a new test configuration in the run command, see [Command line interface](https://help.testim.io/docs/the-command-line-cli).

> 🚧
>
> If you run a test locally on a system that doesn’t correspond with the test configuration, then the test will run with the available configuration and a warning message will be shown.

## Creating and modifying test configurations in the Configuration Library

In the **Configuration Library** you can create new test configurations. You can also clone, modify, rename, and delete current configurations.

### Creating a new test configuration

:fa-arrow-right: **To create a new test configuration:**

1. In the left menu, navigate to **Runs > Configuration List**.

![](https://files.readme.io/bde6165-Testim_502b.png "Testim 502b.png")

The **Configuration Library** is shown.

2. Click the **+ Create New** button.

![](https://files.readme.io/bc7aa0f-Testim_503a.png "Testim 503a.png")

The **Add New Config** settings are shown.

![](https://files.readme.io/b2d6d80-Testim_504_r.png "Testim 504_r.png")

3. Enter the basic options as follows:

* In the **Name** field, enter a name for this new configuration.
* In the **Browser** section, click the dropdown arrow and select your desired browser.
* In the **OS** section, click the dropdown arrow and select your desired operating system.
* In the **Resolution** section, click the dropdown arrow and select your desired resolution.

4. Click **Advanced**.\
   The advanced configuration options are shown.\
   ![](https://files.readme.io/eac30c0-advancednative.jpg)

5. In the **General** section, modify the **Step timeout**, **Step delay**, and **Setup step timeout** settings as desired. For more information, see [Test Configuration Parameters](https://help.testim.io/docs/how-to-record-a-test#section-test-configuration-parameters).

6. In the **Native Events** section, you can overwrite the default setting of how a click step will be handled with another setting just for this test configuration. By default, at the project level, the Click steps are configured to use either native or non-native events. Sometimes a test will fail because even though the “click step” passed, the click wasn’t actually executed. A possible solution is to try to configure the click steps in the test with the opposite configuration (i.e., instead of native, non-native and vice versa). Instead of changing the configuration for every click step individually, you can create a test configuration that overwrites the default native/non-native configuration and then simply run the test with this configuration to check if the opposite setting has fixed the problem. To overwrite the default Native events setting, select the **Apply to click steps** checkbox.

7. Under **Click event type**,   the current default setting is displayed. To overwrite the default setting for this test configuration, click the drop-down menu and select the other value (e.g., if it was **Native click event**, select **Non-native click event**).

   <Image align="center" src="https://files.readme.io/93bbedb-3845ef1-image_1.png" />

   After running a test with the native override, you will see an indication in the test running summary, stating whether the native or non-native override was applied, as shown in the example below in which the **Native click event** option was selected.

   <Image align="center" src="https://files.readme.io/1a9eceb-028f074-image.png" />

8. In the **Before/After hooks** section, modify the settings as desired. For more information, see [Before & after hooks](https://help.testim.io/docs/before-after-hooks).

9. Click **Add**.\
   The configuration is created and added to the **Configuration Library**.

### Cloning a test configuration

:fa-arrow-right: **To clone a test configuration:**

1. In the left menu, navigate to **Runs > Configuration List**.

![](https://files.readme.io/9a234a1-Testim_502b.png "Testim 502b.png")

The **Configuration Library** is shown.

2. Click on the row of the test configuration you wish to clone.\
   Context tools are shown.

![](https://files.readme.io/b2ffc88-Testim_590a.png "Testim 590a.png")

3. Click the **Clone** icon.

![](https://files.readme.io/c9eac99-Testim_590b.png "Testim 590b.png")

> 📘
>
> Alternatively, you can right-click the row, and select **Clone**.

The **Clone Configuration** options are shown.

![](https://files.readme.io/53958a2-Testim_591_r.png "Testim 591_r.png")

4. In the **Name** field, enter a name for the cloned configuration.
5. Click **Clone**.\
   The configuration is cloned and is shown in the **Configuration Library**.

### Modifying a test configuration

:fa-arrow-right: **To modify a test configuration:**

1. In the left menu, navigate to **Runs > Configuration List**.

![](https://files.readme.io/15c8c6f-Testim_502b.png "Testim 502b.png")

The **Configuration Library** is shown.

2. Double-click on the row of the test configuration you wish to modify.\
   The **Edit Config** settings are shown.

![](https://files.readme.io/7ef3c8f-editconfig.jpg)

3. Modify the basic options as follows:

* In the **Name** field, enter a name for this new configuration.
* In the **Browser** section, click the dropdown arrow and select your desired browser.
* In the **OS** section, click the dropdown arrow and select your desired operating system.
* In the **Resolution** section, click the dropdown arrow and select your desired resolution.

4. Click **Advanced**.\
   The advanced configuration options are shown.

![](https://files.readme.io/6780665-editconfig2.jpg)

5. In the **General** section, modify the **Step timeout**, **Step delay**, and **Setup step timeout** settings as desired. For more information, see [Test Configuration Parameters](https://help.testim.io/docs/how-to-record-a-test#section-test-configuration-parameters).
6. In the **Native Events** section, you can overwrite the default setting of how a click step will be handled with another setting just for this test configuration. By default, at the project level, the Click steps are configured to use either native or non-native events by default. Sometimes a test will fail because even though the “click step” passed, the click wasn’t actually executed. A possible solution is to try to configure the click steps in the test with the opposite configuration (i.e., instead of native, non-native and vice versa). Instead of changing the configuration for every click step individually, you can create a test configuration that overwrites the default native/non-native configuration and then simply run the test with this configuration to check if the opposite setting has fixed the problem. To overwrite the default Native events setting, select the **Apply to click steps** checkbox.
7. Under **Click event type**,   the current default setting is displayed. To overwrite the default setting for this test configuration, click the drop-down menu and select the other value (e.g., if it was **Native click event**, select **Non-native click event**).
8. In the **Before/After hooks** section, modify the settings as desired. For more information, see [Before & after hooks](https://help.testim.io/docs/before-after-hooks).
9. Click **Change**.\
   The configuration is modified.

### Renaming a test configuration

:fa-arrow-right: **To rename a test configuration:**

1. In the left menu, navigate to **Runs > Configuration List**.

![](https://files.readme.io/efa52dd-Testim_502b.png "Testim 502b.png")

The **Configuration Library** is shown.

2. Click on the row of the test configuration you wish to rename.\
   Context tools are shown.

![](https://files.readme.io/815c253-Testim_590a.png "Testim 590a.png")

3. Click the **Rename** icon.

![](https://files.readme.io/cd437c4-Testim_590d.png "Testim 590d.png")

> 📘
>
> Alternatively, you can right-click the row, and select **Rename**.

The **Edit Name** settings are shown.

![](https://files.readme.io/3519685-Testim_593_r.png "Testim 593_r.png")

4. In the **New name** field, enter a new name for this configuration.
5. Click **OK**.\
   The configuration is renamed.

### Deleting a test configuration

:fa-arrow-right: **To delete a test configuration:**

1. In the left menu, navigate to **Runs > Configuration List**.

![](https://files.readme.io/3dcbaab-Testim_502b.png "Testim 502b.png")

The **Configuration Library** is shown.

2. Click on the row of the test configuration you wish to delete.\
   Context tools are shown.

![](https://files.readme.io/2917eb3-Testim_590a.png "Testim 590a.png")

3. Click the **Delete** icon.

![](https://files.readme.io/ee65ecc-Testim_590c.png "Testim 590c.png")

> 📘
>
> Alternatively, you can right-click the row, and select **Delete**.

A confirmation dialogue is shown.

![](https://files.readme.io/ac8e414-Testim_592_r.png "Testim 592_r.png")

4. Click **Delete**.\
   The configuration is removed from the **Configuration Library**.

## Filtering the Configuration Library

You can apply filters to the Configuration Library to only display items that meet a specific criteria.

:fa-arrow-right: **To filter the Configuration Library:**

1. Navigate to Runs > Configuration List.
2. Click the **Advanced Filters** button in the action menu.

![](https://files.readme.io/8b46862-configadvancedfilters.png "configadvancedfilters.png")

3. Select the desired filters from the **Filter Configuration** panel and click the **Apply** button.

![](https://files.readme.io/cd53734-configapplyfilters.png "configapplyfilters.png")

The list of scheduled runs is now filtered based on your filter selections. To learn more about saving this filtered view, see [Saving a Filtered View](https://help.testim.io/docs/saving-a-filtered-view).

## Creating and modifying test configurations in the Test Editor

Test configurations that are modified in the **Test Editor** are added to the **Configuration Library** if the configuration includes a name and the test is saved. The newly added test configuration can be used for future tests.

:fa-arrow-right: **To modify a test configuration within a test:**

1. Hover over a test's **Setup** step (the first step) and click the **Show properties** (:fa-cog:) icon.

![](https://files.readme.io/9bdfe00-Testim_594a.png "Testim 594a.png")

The **Properties** panel opens on the right hand side.

![](https://files.readme.io/db2fc84-Testim_595_r.png "Testim 595_r.png")

2. In the **Configuration** section, click on the **Edit Configuration** icon.

![](https://files.readme.io/21b9d84-Testim_596a_r.png "Testim 596a_r.png")

The **Edit Configuration** settings are shown.

![](https://files.readme.io/9ebae2c-editconfig3.jpg)

3. Modify the options as follows:

* In the **Name** field, enter a name for this configuration. (If you don’t enter a name, the test configuration will NOT be saved in the **Configuration Library**.)
* In the **Browser** section, click the dropdown arrow and select your desired browser.
* In the **OS** section, click the dropdown arrow and select your desired operating system.
* In the **Resolution** section, select your desired resolution.
* Modify the **Step timeout**, **Step delay**, and **Setup step timeout** settings as desired. For more information, see [Test Configuration Parameters](https://help.testim.io/docs/how-to-record-a-test#section-test-configuration-parameters).
* In the **Native Events** section, you can overwrite the default setting of how a click step will be handled with another setting just for this test configuration. By default, at the project level, the Click steps are configured to use either native or non-native events by default. Sometimes a test will fail because even though the “click step” passed, the click wasn’t actually executed. A possible solution is to try to configure the click steps in the test with the opposite configuration (i.e., instead of native, non-native and vice versa). Instead of changing the configuration for every click step individually, you can create a test configuration that overwrites the default native/non-native configuration and then simply run the test with this configuration to check if the opposite setting has fixed the problem. To overwrite the default Native events setting, select the **Apply to click steps** checkbox. Under **Click event type**,   the current default setting is displayed. To overwrite the default setting for this test configuration, click the drop-down menu and select the other value (e.g., if it was **Native click event**, select **Non-native click event**).
* In the **Before/After hooks** section, modify the settings as desired. For more information, see [Before & after hooks](https://help.testim.io/docs/before-after-hooks).

4. Click the back arrow to close the **Edit Configuration** settings.

![](https://files.readme.io/8e94901-Testim_600a_r.png "Testim 600a_r.png")

5. Click **Save**.

![](https://files.readme.io/d7f9a8b-Testim_594b.png "Testim 594b.png")

The **Change Message** window opens.

![](https://files.readme.io/990d848-Testim_601_r.png "Testim 601_r.png")

6. In the **Message** field, optionally enter a description of the changes made in this version.
7. Click **OK**.\
   The test is saved. If you entered a name in the **Name** field in the **Configuration** settings, the configuration will be listed in the **Configuration Library**.