# Setting the Test Configuration

Every test has its own default configuration accessible from the **property panel** of the test's **Setup step**. The configuration parameters that are set in the test's default configuration will apply unless the test is run from the CLI or a scheduler with a different test configuration.

By default an **Untitled** configuration is created for every new test. This default configuration includes a rule  to run the test on any available device with any OS version. These settings (Device Name and OS version settings) cannot be modified, however it is possible to modify additional setting, as explained below.  The modified configuration will be saved in the test itself, which means that it will not be available in the configuration library (See [Configuration Library - Mobile](https://help.testim.io/docs/configuration-library-mobile)) for use in other tests.

> 📘
>
> When the test is run in the CLI, you can override the default configuration by specifying a new Test Configuration in the run command, see [Command line interface](https://help.testim.io/docs/the-command-line-cli).

:fa-arrow-right: **To override the default test configuration settings:**

1. Click the **Setup Step' Show Properties** icon.
2. On the **Properties** panel, under **Configuratio**n, click the **Edit** icon.\
   ![](https://files.readme.io/e4593c6-editicon.jpg)\
   The **Edit Configuration** Panel is displayed\
   ![](https://files.readme.io/5192691-edittestconfiguration.png)
3. Optionally edit the following settings:
   1. **Step timeout (ms)** - specify the time laps in milliseconds which causes Testim to register a fail for a test step.
   2. **Step delay (ms)** - specify the delay in milliseconds between running test steps.
   3. **Setup step timeout (ms)** - specify the time laps in milliseconds which causes Testim to register a fail for a test's setup step.
   4. **Before/After hooks** - specify before/after hooks, as explained in [Hooks](https://help.testim.io/docs/hooks)
4. When finished close the pane or go back the **Properties** pane.