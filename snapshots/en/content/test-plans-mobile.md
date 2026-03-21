# Test Plans - Mobile

Learn how to create a test plan for your mobile app which comprises all your tests, setup & teardown tests and a list of configuration to run with

A test plan is a container of tests, which include specific test labels and/or test suites that can be organized to run consecutively. The test plan can include tests/test suites that run before and/or after the list of tests/test suites. The test plan can include settings that override the tests' default settings.

Test plans are great If you need to do:

* Set up your environment before your tests execute.
* Clean up your environment after your tests execute.
* Run your tests on several devices and operating systems.

## Create a New Mobile Test Plan

:fa-arrow-right: **To create a new test plan:**

1. Navigate to **Test List** in the main menu.
2. Select **Plans** from the top navigation.
3. Click the **New Plan** button.

<Image align="center" src="https://files.readme.io/fd4471d-new-test.png" />

4. Enter the **Name** and **Description** for your new Test Plan.

<Image align="center" src="https://files.readme.io/37d604b-newmobiletestplan.png" />

5. Select the **Add Before All** checkbox if you want to run a set of tests prior to Test Plan's main test list. Enter the name of one or more [Test Suites](https://help.testim.io/docs/test-suites) or [Test Labels](https://help.testim.io/docs/labels). Typically this would include setup steps, such as login, etc.

<Image align="center" src="https://files.readme.io/1aeb540-newmobiletestplan.png" />

6. Enter the name of one or more [Test Suites](https://help.testim.io/docs/test-suites) or [Test Labels](https://help.testim.io/docs/labels) in the **Test List** box

<Image align="center" src="https://files.readme.io/d77b93b-newmobiletestplan.png" />

7. Select the **Add After All** checkbox if you want to add "teardown" tests after the test list has run. Enter hte name of one or more [Test Suites](https://help.testim.io/docs/test-suites) or [Test Labels](https://help.testim.io/docs/labels). It is a best practice to include "teardown" tests in your test plan. These are tests designed to clear the cache, clean up data, log out users, etc. once the tests are complete.

<Image align="center" src="https://files.readme.io/7cf9f5b-newmobiletestplan.png" />

> 📘 Note:
>
> * The tests in "Before all" and "After all" will always run in parallel level `1`. Only the "Test List" can run at a higher parallelization level, if it is set in the CLI.
> * The tests in Test list WON'T be executed if one of the "before all" tests failed.
> * The tests in "Add After All" will always run even if tests in Test list failed.

8. In the **Where to Run** field, select the **Mobile Grid** you would like to execute your tests on. See [Grid Management](https://help.testim.io/docs/grid-management) for more information.

<Image align="center" src="https://files.readme.io/103e4f6-newmobiletestplan.png" />

> 📘
>
> When selecting **Override default configurations**, only configurations associated with the selected grid will be displayed.

9. In the **What to run on** section, select the **Override default configurations** checkbox to override the default configurations of the tests with the selected configurations. Only configurations that are supported by the selected grid will be displayed. Choose from your list of configurations or create a new one. See [Configurations Library](https://help.testim.io/docs/configuration-library-mobile) for more information. Selecting multiple configurations will result in multiple executions, respectively. Each configuration will trigger an execution that will run a on a single device that is automatically selected from the grid.

<Image align="center" src="https://files.readme.io/5093526-newmobiletestplan.png" />

10. In the **What to run on** section, select the **Override Application** checkbox to override the default mobile app that was configured in the tests by a different application for your test plan.

<Image align="center" src="https://files.readme.io/072107c-newmobiletestplan.png" />

11. Click the **Create** button to create your test plan.

## Running your Test Plan

In order to execute a test plan, you'll need to specify the plan name in your CLI command like this:

`--test-plan "Test Plan Demo"`

> 📘
>
> If you add a different grid name to the CLI, it overrides the grid defined in the plan.

> 📘 CLI steps
>
> If you have CLI steps in your tests make sure the CLI is running before executing.

## Share parameters between your test

When you use a plan you can share parameters between tests e.g. create an account in the setup and use those credentials throughout all tests. See [Parameters](https://help.testim.io/docs/parameters) for more information.