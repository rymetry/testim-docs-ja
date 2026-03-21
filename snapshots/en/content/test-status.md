# Test Status

Add statuses to your tests to help manage which test needs to be worked on

You can add a status to your tests to help manage which test needs to be worked on. The statuses are displayed as one of the columns in the Test Library list and in the Test Editor.

By default all statuses are labeled as "Draft". After the feature is enabled, Testim automatically identifies tests that were run in the last 30 days and labels them as "Active".  All other statuses are applied manually, as described below.

By manually managing the tests' statuses you can enjoy the following benefits:

* Manually quarantine flaky/failing tests without taking them out of the CI/suite.
* Easily notice tests that are not connected to the CI (not active).
* Gradually add tests to the CI without failing the entire run.
* Improve project visibility by filtering tests by status.

> 📘 This is a PRO feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, see [here](https://www.testim.io/pricing/).

> 🚧 Note
>
> In order to use this feature, you'll need to upgrade your CLI version to be at least v3.135.0, read [here](https://help.testim.io/docs/the-command-line-cli#cli-installation) about CLI installation

## Test Statuses

Each test can have one of the following statuses:

| Status     | Definition                                                                             | Running as part of the CI/Scheduler | Failing scheduler/CI |
| :--------- | :------------------------------------------------------------------------------------- | :---------------------------------- | :------------------- |
| Draft      | Test is still in-progress                                                              | Yes\*                               | Yes                  |
| Evaluating | Test ready, but its stability should be validated                                      | Yes                                 | No                   |
| Active     | Test is ready and stable                                                               | Yes                                 | Yes                  |
| Quarantine | The test doesn’t conform to the definition of a stable test and is waiting to be fixed | No                                  | No                   |

\*The best practice is to add a test to the CI/Scheduler only after the test is ready, and not in Draft status

## Viewing the test status

The tests' statuses are displayed in the following screens:\
**Test Library screen** - Test Lists -> Tests

![](https://files.readme.io/ebf3e27-teststatuses1.png "teststatuses1.png")

**Test Editor**

![](https://files.readme.io/a56ee9d-teststatuses2.png "teststatuses2.png")

## Filtering tests by status

:fa-arrow-right: **To filter test by status:**

1. Go to **Test List --> Tests**
2. Click the **Filter** button.

![](https://files.readme.io/615dd27-filter.png "filter.png")

3. In the **Filter Test** pane, select the checkboxes of the relevant statuses.

![](https://files.readme.io/ac7f5bd-teststatuses3.png "teststatuses3.png")

## Modifying the status of a test

Statuses can be modified manually. All changes to the test status will appear In the [revision history](https://help.testim.io/docs/revisions).

:fa-arrow-right: **To change the test status through the Test Library:**

1. Go to Test List --> Tests
2. In the **Status** column, select the relevant status.

![](https://files.readme.io/3eaae69-Jan-28-2021_09-43-29.gif "Jan-28-2021 09-43-29.gif")

\**Note:* it is possible to bulk edit tests status, by selecting all the tests you would like to edit, and then clicking on change status from the top menu.

> 📘
>
> As part of the test status, we also added an option to view your flaky tests and decide how to manage their status. To read more about the flaky tests, see [here](https://help.testim.io/docs/flaky-tests).

:fa-arrow-right: **To change the test status through the Testim's Editor:**

1. Open the test in the editor.
2. Change the status from the top left corner

![](https://files.readme.io/65da094-Screen_Shot_2021-01-10_at_7.41.32.png "Screen Shot 2021-01-10 at 7.41.32.png")

> 📘
>
> When changing the status the test is saved as a revision. If you want to merge it back to Master, you will have to resolve it as a 3 way merge conflict, to read more see [here](https://help.testim.io/docs/version-control-branches)

## Using the test status

### On test runs

After running the tests, the statuses will be reflected in the following way:

* **Draft tests** that run will appear as before. It is recommended to change these tests' status to Active.
* **Evaluating tests** will appear in the test runs, but in a case of failure there will be an indication that the failure was ignored.

![](https://files.readme.io/2effede-Screen_Shot_2021-01-28_at_8.56.41.png "Screen Shot 2021-01-28 at 8.56.41.png")

* **Active tests** will appear as before.
* **Quarantine tests** will not run (they will not appear in the test runs).

### On suite runs

On suite runs, the statuses will be reflected in the following way:

* **Draft tests** that run will appear as before. It is recommended to change these tests' status to Active.
* **Evaluating tests** will appear in the test runs, but in a case of failure, there will be an indication that they did not fail the CI.
* **Active tests** will appear as before.
* **Quarantine tests** will not run (they will appear in the suite run with a quarantine indication)

![](https://files.readme.io/87013d7-Screen_Shot_2021-01-10_at_8.02.34.png "Screen Shot 2021-01-10 at 8.02.34.png")

### CLI runs

* **Evaluating failed tests** will appear in the CLI run summary as FAILED-EVALUATING
* **Evaluating failed tests** will be added to the run XML report with a new status "failure-evaluating", to read more about the CLI XML report, see [here](https://help.testim.io/docs/the-command-line-cli#the-common-parameters)
* **Quarantine tests** will be added to the run XML with a "Skipped" flag.

> 📘
>
> Quarantine tests can be run in the CLI by using the bypassed   “--run-quarantined-tests” flag