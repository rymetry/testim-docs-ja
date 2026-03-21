# Command line interface (CLI)

Run all your tests from the command line and integrate with your CI

## Prerequisites

Running via CLI requires Node.js installed. Testim supports all [LTS/supported](https://github.com/nodejs/Release/blob/main/README.md) versions of Node.js.

## CLI Installation

Install Testim package.

```shell
npm install -g @testim/testim-cli
```

That’s it!

#### Basic CLI command

The Basic CLI command example for web and mobile is displayed in the **Settings >CLI** tab and includes your Token and Project ID.

:fa-arrow-right: **To view your basic CLI command:**

1. Go to **Settings > CLI** tab.
2. Click **CI** to run the test remotely on your CI or **Local** to run the test locally (this will open a local browser on your machine) (web only)
3. Under **CI Platform**, select the desired CI platform (optional)
4. Under **Grid**, select the desired grid on which to run the test. For web testing, Selenium grids will be displayed and for mobile testing, the following grids canl be displayed:\
   [Virtual Mobile Grid](https://help.testim.io/docs/virtual-mobile-grid)\
   [Tricentis Device Cloud](https://help.testim.io/docs/tricentis-device-cloud)\
   [Testim Headspin Mobile](https://help.testim.io/docs/headspin-integration)\
   [Browserstack](https://help.testim.io/docs/browserstack-integration-1)\
   [LambdaTest](https://help.testim.io/docs/browserstack-integration-copy)\
   The basic CLI command is displayed at the bottom under **Example**.

![](https://files.readme.io/af52b8a-cli_command.png "cli_command.png")

The basic command includes the following elements:\
`--token`: the authentication token\
`--project`: the project ID\
`--grid`: the name of the grid to run the tests on. For web testing, Selenium grids will be displayed and for mobile testing, Appium grids will be displayed.

5. Copy the CLI, edit and add parameters according to your needs. You can run a specific test, label, configuration, etc., as explained in the following section.

#### Additional common parameters

Here is an example of a basic command with the most common options (see below detailed description for all the available options):

`--project`: see above\
`--token`: see above\
`--label:` use this to run specific tests that include the specified labels\
`--grid`: see above\
`--report-file`: specifies where to store the test results (so the CI server can read them)

```shell
testim --label "<YOUR LABEL>" --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>" --grid "<Your grid name>" --report-file test-results/testim-tests-report.xml
```

> 📘 Web-only note
>
> Instead of running on a grid, it is possible to use **--use-local-chrome-driver**. That way you can see the run in action on a clean, extension-free, Chrome browser. if `--use-local-chrome-driver` is used in combination with `--headless`, it is required to add the `--mode selenium` flag as well.

## All CLI Parameters

#### Project:

`--project`  the project ID.\
To select a different project, go to the Company screen (see [https://help.testim.io/docs/project-and-user-management](https://help.testim.io/docs/project-and-user-management)), select the relevant project, go to **Settings > CLI** tab and extract the project ID from the basic CLI command example.

```shell
--project AOL-12323-a4b2-4762-df380
```

#### Access token

`--token` The access token. The access token can be obtained from the basic CLI command example, which is displayed in the **Settings > CLI** tab screen.

```shell
--token aaaaa-1234-1234-bbbb-1234qwer1234qwer
```

#### Label

`--label` or `-l` Run all tests that include one of the mentioned labels.

> 📘 Note
>
> If the specified label does not point to a test, an error will be returned.

Note that you can also run more than one label, by adding more `--label` arguments

```shell
-l sanity -l custom-label2
```

#### Test Name

`--name` or `-n`, the name of the test to run.

> 📘
>
> You can also run more than one test by name, by adding more `--name` arguments

```shell
--name "login_to_app"
```

#### Test id

`--testId` or `-t` or `--test-id`, the ID of the test to run. Enter the command followed by the ID if the test.

> 📘
>
> You can also run more than one test by id, by adding more `--testId` arguments

```shell
--testId "5e1c62b2-7c30-635b-6441-dd804126118b"
```

#### Grid Name

`--grid`, the Selenium Grid name to use. You can use "Testim-Grid"/ your local selenium grid/ Saucelabs / Browserstack

`--grid` `<grid-name>`
Note: Read [here](https://help.testim.io/docs/grid-management) how to configure your grid.

#### Host

`-h` or `--host <host-name>`, the host name or IP containing the selenium grid. This command overrides the `--grid` command.

```shell
--host seleniumhost
```

#### Grid ID

#### Report File

` --report-file` or `-r`,  where to print the report (by default to the output stream). The file is in the format of JUnitXMLReporter. This is used to integrate Testim results with the CI display. Usually, you'll need to set the build config in the CI to look for that file so make sure the CLI param value and the build config are set to the same location.

```shell
-r ~/report.xml
```

To override the classname in the report file, add this parameter :

`--override-report-file-classname com.someName`

#### Base URL (web only)

`--base-url`, starting URL after browser opens

```shell
--base-url staging.example.com
```

#### Test Config

`test-config` specifies configuration parameters (e.g. browser, operating system, resolution, device name, OS version, visual validation parameters, etc.) that will override the configuration defined for all tests in this run. For mobile testing, the test will run on the first available device within the pool of devices configured in the test configuration.\
Read more [Configuration Library - Web](https://help.testim.io/docs/shared-configuration) and [Configuration Library - Mobile](https://help.testim.io/docs/configuration-library-mobile).

```shell
--test-config "1280x1024_SXGA_chrome" --test-config "1366x768_WXGA_firefox"
```

#### Params File

`--params-file` uses a JSON Parameters File that can be used to pass parameters to test runs. This method allows you to define dynamic values inside your test which vary by your test environment. For example, you can set different login credentials (username and password) when you test locally and when testing in your CI. After defining the JSON Parameters File, you can pass it to Testim CLI as an argument: `--params-file` followed by the file name. Read more - [https://help.testim.io/docs/json-parameters-file-parameters](https://help.testim.io/docs/json-parameters-file-parameters).

> 📘
>
> The string path that is set in the `params-file` path must be a relative path, and not a full path.

```shell
--params-file [params-file.json]
```

#### Test Suite (by name)

`--suite`, the test suite name to run. You can run more than one suite.

```shell
--suite "suite_name" --suite "suite_name2"
```

#### Test Suite (by ID)

`suite-id`, specifies the test suite ID to run. You can run more than one suite.

```shell
--suite-id "suite1ID" --suite-id "suite2ID"
```

#### Test Plan (by name)

`--test-plan`, specifies the test plan name to run. You can run more than one plan.  Since you define in the test plan the grid, test list, configuration, etc., you cannot override it from the CLI. Therefore when using `--test-plan` you cannot use these flags: `--testId`, `--label`, `--name`, `--browser`, `--test-config`, `--test-config-id` or `--suite`.

```shell
--test-plan "Test Plan Demo"
```

#### Execution Name

`--override-execution-name`, the name of the execution in Testim suite runs.

```shell
--override-execution-name "Dev Sanity"
```

#### Class Name

`--override-report-file-classname` The class name in the JUnitXML report file is Testim.io by default. To have the suite name in the class name instead, add the parameter below with no value. If you are looking to override the class name with a specific name, add it to the parameter.

```shell
--override-report-file-classname
--override-report-file-classname "Regression"
```

#### Result Labels

`--result-label`, the result Labels option allows you to add textual labels to your remote runs. These labels will be shown in the runs page.

```shell
--result-label "V1.40"
```

#### Test timeout

`--timeout`, timeout period in milliseconds to abort the test run if a timeout has elapsed. The default is set to 10 minutes. The max is 3 hours.

```shell
--timeout 120000
```

#### Branches

`--branch`, to run on a specific branch (by name).

```shell
--branch <branch-name>
```

> 📘
>
> Executing on an archived branch will cause the CLI to fail.

#### Parallel

`--parallel`, how many tests should run in parallel.

```shell
--parallel <parallel-count>
```

#### Config file (web only)

`--config-file` or `-c`, specifies all the configuration options from external configuration File.\
Place the config file in a path accessible by the shell, specify in the command the path to the file.

```shell
--config-file [config-file.js]
```

Read more about configuration file [here](configuration-file-run-hooks).

#### Failed test retries

`--retries`, When this flag is used, a failed test will be executed repeatedly until either the test passes or the max number of retries has been reached - in which case the test will fail.

When a test passes after one or more retries, it will be indicated in the UI as follows:

```shell
--retries <max_num_of_retries>
```

Tests that only passed using retries, can be easily filtered under the testim library. To read more about that, see [here](https://help.testim.io/docs/flaky-tests).

#### Disable TestRail reporting (web only)

`--suppress-tms-reporting` To suppress sending suite run results to TestRail.

```shell
--suppress-tms-reporting
```

#### Dedicated Run Tunnel (web only)

`--tunnel` `--tunnel-port`, Tunnels let you run your app from an internal server/localhost and view it in an external browser.\
\--tunnel  #default application port 80

```shell
testim --tunnel --tunnel-port <APP PORT default 80>
```

For more info check out: [This Article](https://help.testim.io/docs/dedicated-run-tunnel)

#### Rerun failed tests

`--rerun-failed-by-run-id`, The rerun failed tests option allows you to rerun all test which failed in a suite run.\
Copy the suite run id from the suite's page :

Add the --rerun-failed-by-run-id flag with the suite's run id to the CLI :

```shell
--rerun-failed-by-run-id <run-id>
```

#### Disable timeout retry

`--disable-timeout-retry`, by default, when a test fails due to "test reached timeout",  Testim will try to execute it once again and up to 3 times before failing it. This default behavior can be disabled when executing test using this CLI flag.

```Text shell
--disable-timeout-retry
```

<br />

#### Set data retention

`--set-retention` When you add the parameter --set-retention \[whole number between 1 to 10] to a CLI run, all the test results of this execution will be marked for deletion (retention period) after the number of days specified in the parameter.

> 📘
>
> Our plan includes 30 days retention by default, for longer retention time, please reach out to support.

```shell
--set-retention <number-between-1-10>
```

#### Abort CLI run

It is possible to abort a CLI run, by using the CTRL+c shortcut in your terminal. The run will have "Aborted" status under the run-list

![](https://files.readme.io/a78e858-Screen_Shot_2020-10-15_at_11.49.37.png "Screen Shot 2020-10-15 at 11.49.37.png")

The CLI can also be forced to quit by pressing CTRL+C multiple times or closing the terminal window (a.k.a, ungraceful abort).\
This will cause the run to stop executing but the status will remain "Running" in the editor. The run status will change to “Timeout” after 90 minutes.

#### Add Chrome extra arguments (web only)

To add Chrome extra arguments, use the *--chrome-extra-args* which receives a comma-separated string with the needed flags (no spaces between the flags). For example:

```shell
testim --token "TOKEN" --project "PROJECT" --grid "Testim-Grid" --chrome-extra-args "enable-heavy-ad-intervention,heavy-ad-privacy-mitigations"
```

#### Run CLI command with custom extensions

You are able to run a CLI command on a chrome browser with specific extension/s installed on it by using *--install-custom-extension*. For example:

```shell
testim --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>" --use-local-chrome-driver --install-custom-extension <chrome extension zipped file url or local path>
```

#### intersect-with flag

The `intersect-with` flag can be used to run a subset of the specified tests (e.g. a test plan, a test suite, a label) that are intersected with a given label or suite. When running test plans the intersection is performed on the tests in the plan’s body (not the before or after tests).\
The following `intersect-with` flags are available:

```shell
--intersect-with-label <labelName>
--intersect-with-suite <suiteName>
--intersect-with-suite-id <suiteId>
```

The following command example specifies a suite called "SuiteName" to run if they intersect with a label called "test":

```shell
testim --token “7jdSDFGbsdfrGsdrgsdrg” --project “EIPPYFgkS7oTesyRCnlj” --suite “SuiteName” --grid “Testim-Grid” --intersect-with-label “test”
```

The following command example specifies that tests with label "test" run if they intersect with suite "test1":

```shell
testim --token “7jyBS1mzOb5f6wOGE3o8ybE2tSRuWAY5rZteT1jwd4FAAJ2mPn” --project “EIPPYFgkS7oCnlOfNtOj” --label “test” --grid “Testim-Grid” --intersect-with-suite “test1”
```

The `intersect-with` flag defines that from all the tests that were included in the original run command, Testim should only run the tests that are common (i.e., intersecting) with the specified label or suite.

**For example:**\
Label A - contains tests: 1,2,3,4\
Label B - contains tests: 5,6,7\
Label C - contains tests: 3,4,5\
Label D - contains tests: 8,9

Test Plan P contains Labels A and B\
So if we run test plan P with --intersect-with-label C ==> tests 3,4,5 should run\
If we run test plan P with --intersect-with-label D ==> no tests should run

It is possible to add multiple intersect flags.\
For example, to run test plan P with --intersect-with-label C --intersect-with-label A\
Testim will establish which tests are in the original run command and then calculate the intersect flags one after the other.

> 📘
>
> The intersection is performed between the tests in the flag and the requested, not between the flags themselves.  So if you have --intersect-with-label A, and --intersect-with-label B, Testim will run all the tests in A OR B, that intersect with the tests requested.

#### intersect-with-operand

Accepts a string. Value can be one of `AND` | `OR`. By default (meaning when this parameter is not defined), `OR` is used. This only works with the `--intersect-with-label` flag.

### Sealights Integration

When running a test with the [Sealights Integration](https://help.testim.io/docs/sealights-integration) using the CLI, you need to add one of the following IDs from Sealights as options in the Testim CLI execution command:

* **Sealights buildSessionId** - this ID relates to the specific build that was executed. Typically this is related to a specific component in an application. This means that this option is recommended if you want to test a specific component.
* **Sealights labId** - typically multiple components that are hosted on the same environment may share the same LabId. So if you want to test multiple components, it is recommended to use the LabId instead of the buildSessionId.

#### **Sealights buildSessionId**

`--sealights-build-session-id`, runs the test with the Sealights Integration using the ID that relates to the specific build that was executed. To obtain the `buildSessionId`, follow the instructions in the [buildSessionID option section](https://help.testim.io/docs/sealights-integration#buildsessionid-option).

```shell
--sealights-build-session-id [sealights-suid-session-id]
```

#### **Sealights labId**

`--sealights-lab-id`, runs the test with the Sealights Integration using the Lab ID. To obtain the `labId`, follow the instructions in the [labId option section](https://help.testim.io/docs/sealights-integration#labid-option).

```shell
--sealights-lab-id [sealights-lab-id]
```

<br />

### Mobile only flags

#### Device name

`--device-name`, select a specific device model to run the test. If the flag is not used, Testim will select the first available device model.

```shell
--device-name "Samsung S22"
```

#### Device UDID

`--device-udid`, select a specific device to run the test, based on its Unique Device ID. If the flag is not used, Testim will select the first available device.

```shell
--device-udid "udid123456"
```

#### OS Version

`--os-version`, select a specific operating system version to run the test. If the flag is not used, Testim will select the first available device.

```shell
--os-version "9"
```

#### App ID

`--app-id`, select a specific app ID of an mobile app in the Mobile Apps library to run the test. This is used if you want to override the current app that was used during the recording. To obtain the APP ID, go to the Mobile Apps screen, right-click on one of the apps listed and select **Copy ID**.

![](https://files.readme.io/097f1f4-2023-02-06_13-00-18.png "2023-02-06_13-00-18.png")

```shell
--app-id "appID123"
```