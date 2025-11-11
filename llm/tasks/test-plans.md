# 翻訳タスク (test-plans)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Learn how to create a test plan for your web app which comprises all your tests, setup & teardown tests and a list of configuration to run with

A test plan is a container of tests, which include specific test labels and/or test suites that can be organized to run consecutively. The test plan can include tests/test suites that run before and/or after the list of tests/test suites. The test plan can include settings that override the tests' default settings.

Test plans are great If you need to do:

- Set up your environment before your tests execute.
- Clean up your environment after your tests execute.
- Run your tests on several browsers and operating systems.

## Create a New Web Test Plan

:fa-arrow-right: **To create a new test plan:**

1. Navigate to **Test List** in the main menu.
2. Select **Plans** from the top navigation.
3. Click the **New Plan** button.

![](/images/test-management/test-plans/fd4471d-new-test.png)

4. Enter the **Name** and **Description** for your new Test Plan.

![](/images/test-management/test-plans/73ab5c3-newwebtestplan.png)

5. Select the **Add Before All** checkbox if you want to run a set of tests prior to the Test Plan's main test list. Enter the name of one or more [Test Suites](https://help.testim.io/docs/test-suites) or [Test Labels](https://help.testim.io/docs/labels). Typically this would include setup steps, such as login, etc.

![](/images/test-management/test-plans/b29d06d-newwebtestplan.png)

6. Enter the name of one or more [Test Suites](https://help.testim.io/docs/test-suites) or [Test Labels](https://help.testim.io/docs/labels) in the **Test List** box.

![](/images/test-management/test-plans/30d2400-newwebtestplan.png)

7. Select the **Add After All** checkbox if you want to add "teardown" tests after the test list has run. Enter the name of one or more [Test Suites](https://help.testim.io/docs/test-suites) or [Test Labels](https://help.testim.io/docs/labels). It is a best practice to include "teardown" tests in your test plan. These are tests designed to clear the cache, clean up data, log out users, etc. once the tests are complete.

![](/images/test-management/test-plans/e34954a-newwebtestplan.png)

> 📘 Note:
>
> - The tests in "Before all" and "After all" will always run in parallel level `1`. Only the "Test List" can run at a higher parallelization level, if it is set in the CLI.
> - If any of the “before all” tests fail, the tests in the Test List WON’T run. As a result, the entire execution will be marked as ‘failed’ and all remaining queued test runs will be aborted.
> - The tests in "Add After All" will always run even if tests in Test list failed.

8. In the **Where to Run** field, select the **Grid** you would like to execute your tests on. See [Grid Management](https://help.testim.io/docs/grid-management) for more information.

![](/images/test-management/test-plans/d46f60c-newwebtestplan.png)

9. In the **What to run on** section, select the **Override default configurations** checkbox to manually set which Browsers, Operating Systems, and resolutions to run your tests on. Choose from your list of configurations or create a new one. See [Configurations Library](https://help.testim.io/docs/shared-configuration) for more information. This will override the default configurations of the tests. Selecting multiple configurations will result in multiple executions, respectively.  

![](/images/test-management/test-plans/d484c9d-newwebtestplan.png)

10. In the **What to run on** section, select the **Override Base URL** checkbox to set the start URL of your web app (e.g. production or staging environment). For more information, see [Base URL](/docs/running-tests/base-url).

![](/images/test-management/test-plans/b5e9303-baseurl.png)

11. Click the **Create** button to create your test plan.

## Running your Test Plan

In order to execute a test plan, you'll need to specify the plan name in your CLI command like this:

```shell
--test-plan "Test Plan Demo"
```

> 📘
>
> If you add a different grid name to the CLI, it will override the grid defined in the plan.

> 📘 CLI Steps
>
> If you have CLI steps in your tests make sure the CLI is running before executing.

## Share parameters between your test

When you use a plan you can share parameters between tests e.g. create an account in the setup and use those credentials throughout all tests. See [Parameters](https://help.testim.io/docs/parameters) for more information.

## Run test plan directly from the editor

**:fa-arrow-right:To run a test plan directly from the editor:**

1. Go to **Test List > Plans**
2. Select the plan/s you would like to run.
3. Click the **Play** button

![](/images/test-management/test-plans/88d404a-Mar-22-2021_11-38-54.gif "Mar-22-2021 11-38-54.gif")

> 📘
>
> If you have a CLI action in one of the tests, please make sure you have CLI running
