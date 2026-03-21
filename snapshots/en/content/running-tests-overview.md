# Running Tests Overview

Learn how to run tests

There are multiple ways to run tests on Testim:\
**Local runs**

* [Test Editor](https://help.testim.io/docs/running-tests-overview#running-a-single-test-through-the-test-screen-on-testim-automate-ui-web--mobile) (Web & Mobile)
* [Test List](https://help.testim.io/docs/running-tests-overview#running-a-single-or-multiple-tests-through-the-test-list-on-testim-ui-web-only) (Web only)
* [Suite List](https://help.testim.io/docs/running-tests-overview#running-tests-through-the-suites-screen-on-testim-ui-web-only) (Web only)
* [Plans List](https://help.testim.io/docs/running-tests-overview#running-tests-through-the-plans-screen-on-testim-ui-web-only) (Web only)
* [CLI](https://help.testim.io/docs/running-tests-overview#running-tests-through-the-plans-screen-on-testim-ui-web-only) (Web & Mobile)

**Remote Runs**

* [Test Editor](https://help.testim.io/docs/running-tests-overview#running-a-remote-web-test) (Web \&Mobile)
* [Scheduler](https://help.testim.io/docs/running-tests-overview#running-tests-through-scheduler-on-testim-ui-web-only) (Web only)
* [CLI](https://help.testim.io/docs/running-tests-overview#running-tests-through-the-cli-web--mobile) (Web & Mobile)

# How are test runs counted towards a Test Runs model plan

Test runs model subscription come with a maximal number of test runs. Local editor runs are exempt from this count, while other run types are included, as described in the table below.

| Run type                  | Illustration                                                                                                 | Run location | Counted towards run quota | Notes                                                                                                             |
| :------------------------ | :----------------------------------------------------------------------------------------------------------- | :----------- | :------------------------ | :---------------------------------------------------------------------------------------------------------------- |
| Local editor runs         | ![test](https://res.cloudinary.com/dl74xtazm/image/upload/v1692528288/New%20images/obwoaogsvcsoy09mlx2q.png) | Local        | No                        | This includes the two types of local editor runs: ‘run locally’ and ‘run locally without debug’                   |
| Local test execution      | ![test](https://res.cloudinary.com/dl74xtazm/image/upload/v1692528288/New%20images/xqzcvrixxh7klhttxcvv.png) | Local        | Yes                       | It is recommended to run stable tests via grid.                                                                   |
| Local suite execution     | ![suites](https://res.cloudinary.com/dl74xtazm/image/upload/v1692609814/zkherwmreutdvdcaxxmw.png)            | Local        | Yes                       | It is recommended to run stable tests via grid.                                                                   |
| Local test plan execution | ![test](https://res.cloudinary.com/dl74xtazm/image/upload/v1692528287/New%20images/tasdwyoeqgku3dgbb4yl.png) | Local        | Yes                       | It is recommended to run stable tests via grid.                                                                   |
| Local CI run              | ![test](https://res.cloudinary.com/dl74xtazm/image/upload/v1692528288/New%20images/etuuumjl8mnaf6yi8swg.png) | Local        | Yes                       | Need to run the CLI command via CI tool /local terminal/Shell                                                     |
| Run test on grid          | ![test](https://res.cloudinary.com/dl74xtazm/image/upload/v1692528288/New%20images/aliqt4hzl7exfzihlyhr.png) | Remote       | Yes                       |                                                                                                                   |
| Scheduler (automatic)     | ![test](https://res.cloudinary.com/dl74xtazm/image/upload/v1692528287/New%20images/butca7hm2m9ynmildilk.png) | Remote       | Yes                       | Once scheduler is created and active, the relevant tests will run automatically at the configured time.           |
| Scheduler (manual)        | ![test](https://res.cloudinary.com/dl74xtazm/image/upload/v1692528288/New%20images/jjslea2li1v9c3dfg9yn.png) | Remote       | Yes                       | Will run immediately, regardless of the scheduler active status                                                   |
| Remote CI run             | ![test](https://res.cloudinary.com/dl74xtazm/image/upload/v1692528288/New%20images/tt27za73qdynpxbl58o8.png) | Remote       | Yes                       | - Need to run the CLI command - Can be run from your terminal/shell - Azure pipeline is one of several CI options |

# Running a single test through the test screen on Testim UI (web & mobile)

You can run a single test locally or remotely on the Grid using the Testim Automate UI. You can also run the test locally or remotely in Incognito mode.

## Running a local web test

:fa-arrow-right: **To run a web test locally:**\
In the Editor screen, click the **Run test** button.

![](https://files.readme.io/d35670c-run.png "run.png")

## Running a local mobile test

:fa-arrow-right: **To run a mobile test locally:**

1. Click the **Run** button in the action menu.

![](https://files.readme.io/c7c7791-image_8.png "image (8).png")

> 📘
>
> If a **Target device** setting for the test is not present (e.g., when you run the test from Test Library), you will be asked to select a device. Select the relevant  physical or virtual device and then click **Done**.  The selected device will be saved as the Target Device for the current session.

The device viewer window opens and runs the test actions. When the test is completed, a pop-up window indicates whether the test was successful.

![](https://files.readme.io/c09003f-image_9.png "image (9).png")

## Running a remote web test

You can run a single test remotely on a grid using the test editor.\
:fa-arrow-right: **To run a web test remotely:**

1. In the Editor screen, click the drop-down menu next to the **Run test** button.
2. Click the **Run on a grid**.

![](https://files.readme.io/f9349a4-2023-02-05_17-39-19.png "2023-02-05_17-39-19.png")

If you want to change the grid settings, click **Edit**.\
For more information on grid management, see [Grid management](https://help.testim.io/docs/grid-management).

## Running a remote mobile test

Running a mobile test remotely requires a grid connection and [Mobile Configuration](https://help.testim.io/docs/configuration-library-mobile). The mobile configuration will determine specific mobile devices to use in the run, however if a mobile configuration is not provided, Testim will use the first available mobile device from the selected grid. You can run a single test remotely on a grid using the test editor. For more information on grid management, see [Grid management](https://help.testim.io/docs/grid-management).

:fa-arrow-right: **To run a mobile test remotely:**

1. In the Editor screen, click the drop-down menu next to the **Run test** button.
2. Click on the **Run on a grid** option to run the test with the default grid and configuration.

![](https://files.readme.io/b0306b9-runongrid.png)

3. Click the **Edit** link to select a grid to run on and a different device and mobile app that will override the original test settings.

![](https://files.readme.io/e89ec9f-choosegrid.png)

4. Click the **Run** button to run the test remotely.

![](https://files.readme.io/fee31b2-choosegrid.png)

# Running a single or multiple tests through the Test List on Testim UI (web only)

You can run one or more tests from Testim’s Test List. Tests run in this way will only run locally.\
:fa-arrow-right: **To run a test from the Test List:**

1. On the Test List screen select the test or tests you wish to run. Select multiple tests by holding the Ctrl (windows) or Command (mac) key while left-clicking on the tests.

![](https://files.readme.io/834e475-run2.png "run2.png")

The selected tests are highlighted.

2. Click the **Play** button.

![](https://files.readme.io/4e677da-run3.png "run3.png")

A confirmation window is shown.

![](https://files.readme.io/eb4fc34-run4.png "run4.png")

3. Select the appropriate check boxes and click **OK**.\
   A browser opens and runs the test/s. You can view the run status during the run. When the run is completed, the Runs screen is shown with information about the run. For more information, see [Execution Runs Screen](https://help.testim.io/docs/execution-runs-screen).

![](https://files.readme.io/69ffd79-run5.png "run5.png")

# Running tests through Scheduler on Testim UI (web only)

You can schedule tests to run on a predefined schedule. In order to schedule a test run, the test must have a Label or be part of a Test Suite.\
Tests run in this way will only run remotely on the grid. For more information, see [Scheduler](https://help.testim.io/docs/scheduler).

# Running tests through the Suites screen on Testim UI (web only)

Using the Test Suites feature, you have the flexibility to group your tests and manage the order in which they will run. Tests run in this way will only run locally. For more information, see [Test suites](https://help.testim.io/docs/test-suites).

# Running tests through the Plans screen on Testim UI (web only)

Using the Test Plans feature, you can run multiple tests, while configuring the environment on which they will run. Tests in the test plans can run locally and/or remotely through the CLI. For more information, see [Test plans](https://help.testim.io/docs/test-plans).

# Running Tests through the CLI (web & mobile)

You can run your tests through the command line interface and integrate with your CI platform. Testim offers a CLI command generator that creates the basic command based on the selected configuration. The command can be then copied to the CLI and additional flags can be then added.  For more information, see [Command line interface (CLI)](https://help.testim.io/docs/the-command-line-cli).

## Running web tests through the CLI

You can run the test locally or remotely through a Grid.

### Running web tests remotely through the CLI

If you want to run it through a Grid, you will have to configure the grid in advance by following the instruction in [Grid management](https://help.testim.io/docs/grid-management). <br />\
The following grids are available for web testing:

* **Testim cloud grid** - Testim can set up a grid with the required number of browsers and browser type. If you don't already have it, contact us to find out which option fits you.
* **Local grids** - If you have a selenium grid, we can integrate with it.
* **Third party grids** - Testim can integrate with third party grids like [Saucelabs](https://help.testim.io/docs/saucelabs-integration) and [Browserstack](https://help.testim.io/docs/browserstack-integration-1).

:fa-arrow-right:**To run a remote web test through the CLI:**

1. If you want to run through a Grid, you will have to configure the grid in advance by following the instruction [Grid Management](https://help.testim.io/docs/grid-management).
2. Go to **Settings > CLI** tab.
3. Make sure the **CI** option is selected (default).
4. Under **Grid**, select the desired grid on which to run the test.\
   The basic CLI command is displayed at the bottom under **Example**.\
   The basic command includes the following elements:\
   \--token: the authentication token\
   \--project: the project ID\
   \--grid: the name of the grid to run the tests on.
5. Copy the CLI command, edit and add parameters according to your needs.

### Running web tests locally through the CLI

:fa-arrow-right:**To run a local web test through the CLI:**

1. Go to **Settings > CLI** tab.
2. Click **Local**.

![](https://files.readme.io/9a52dff-local.jpg)

The basic CLI command is displayed at the bottom under **Example**.\
The basic command includes the following elements:\
`--token`: the authentication token\
`--project`: the project ID\
`--use-local-chrome-driver:` - runs the test on a local, clean, extension-free Chrome browser.\
`--user` - your user ID. The user ID is generated automatically by the system. Specifying this User ID will trigger the execution under your user. If this tag is not included in the CLI command, the execution will run under a general CI user.

3. Copy the CLI command, edit and add parameters according to your needs.

## Running mobile tests through the CLI

You can run the test locally or remotely through a third party Grid.

### Running mobile tests remotely through the CLI

:fa-arrow-right: **To run a mobile test remotely through the CLI:**

1. If you want to run the through a Grid, you will have to configure the grid in advance by following the instruction in [Grid management](https://help.testim.io/docs/grid-management).
2. Go to **Settings > CLI** tab.
3. Make sure the **CI** option is selected (default).
4. Under **Grid**, select the desired grid on which to run the test.\
   The basic CLI command is displayed at the bottom under **Example**.\
   The basic command includes the following elements:\
   `--token`: the authentication token\
   `--project`: the project ID\
   `--grid`: the name of the grid to run the tests on.\
   `--mode`: For mobile testing, `appium` grids will be displayed.
5. Copy the CLI, edit and add parameters according to your needs.

You can run a specific test, label, configuration, and other labels, as explained in [Command line interface (CLI)](https://help.testim.io/docs/the-command-line-cli).

### Running mobile tests locally through the CLI

The locally run mobile tests can be executed on a single device only (no parallel executions). It is possible to run serially with one device, which is connected locally or a virtual device.

:fa-arrow-right: **To run a mobile test locally through the CLI:**

1. Go to **Settings > CLI** tab.
2. Click **Local**.

![](https://files.readme.io/628e67d-localmobile.png)

The basic CLI command is displayed at the bottom under **Example**.\
The basic command includes the following elements:\
`--token`: the authentication token\
`--project`: the project ID\
`local-tma-url`: the URL of the local TMA (Tricentis Mobile Agent) on your machine. This URL can be obtained by opening [TMA](https://help.testim.io/docs/configure-tricentis-mobile-agent) and copying the URL from the address bar.\
`--user`:  your user ID. The user ID is generated automatically by the system. Specifying this User ID will trigger the execution under your user. If this tag is not included in the CLI command, the execution will run under a general CI user.\
`--mode`: the mode of the run. For mobile tests, the mode is always `appium`.\
`--device-udid`:  (mandatory) enter the local device UDID. This can be a physical device that is connected to the computer or a virtual device that is provided by Xcode or Android Studio. This ID can be obtained by opening **TMA > Device Management**, clicking **Device Management** on the top menu, and copying the UDID of the device.

> 📘
>
> It is possible to select only a single UDID for the execution (no parallel executions).

![](https://files.readme.io/1f8899d-udid.png)

3. Copy the CLI command, edit and add parameters according to your needs.

You can run a specific test, label, configuration, and other labels, as explained in [Command line interface (CLI)](https://help.testim.io/docs/the-command-line-cli).

# Tests' Timeouts

By default, all tests will timeout after 10 minutes. However in the following cases, you can set a different timeout setting:

* **When using the Scheduler** - as part of the scheduler Advanced Options configuration, it is possible to set the **Test timeout (seconds)** setting. In any case, the maximal test timeout period is 3 hours. For more information, see [Scheduler](https://help.testim.io/docs/scheduler#advanced-scheduler-options)
* **When running through the CLI** - when running the test through the CLI, it is possible to add a `--timeout` flag that defines a timeout period in milliseconds to abort the test run if a timeout has elapsed. For more information, see [Command line interface (CLI)](https://help.testim.io/docs/the-command-line-cli#test-timeout).
* **When running web test remotely via the test editor** - when running the test remotely on grid through the test editor, it is possible to set test timeout in seconds to abort the test run if a timeout has elapsed. For more information, see [Running a remote web test](https://help.testim.io/docs/running-tests-overview#running-a-remote-web-test)