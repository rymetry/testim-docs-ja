# 翻訳タスク (test-suites)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Learn how to organize your tests into test suites and manage their running sequence

Test Suites give you the flexibility to manage the order between tests. You group them in suites so that you can create different groups of tests. This capability makes it easy to select which tests will be included in your suite as well as determine the order in which they will run. Test suites are supported for both Web and Mobile.

## Create a new test suite

:fa-arrow-right: **To create a new test suite:**

1. Navigate to **Test List > Suites**.
2. Click the **New Suite** button or click **Create Suite** if there are currently no test suites.

![](/images/test-management/test-suites/0bfe227-newtestsuite.png "newtestsuite.png")

3. Give the Test Suite a **Name** and **Description**.

![](/images/test-management/test-suites/866a2f2-geninfo.png "geninfo.png")

4. Search for tests by name or label and/or select one or more tests to include in the suite.

![](/images/test-management/test-suites/85b039b-tests.png "tests.png")

5. Click the **OK** button to create the Test Suite. The new suite is created and displayed in the Suites Library.

![](/images/test-management/test-suites/b38b549-suitecreated.png "suitecreated.png")

### Adding Tests to a Test Suite by Label

You can add tests to a test suite with specific [Labels](/docs/test-management/labels).

![](/images/test-management/test-suites/9085a97-testlabels.png "testlabels.png")

:fa-arrow-right: **To add tests to a test suite by label:**

1. When adding tests to a test suite, search for the label by name.

![](/images/test-management/test-suites/37cd081-label.png "label.png")

2. Testim will display a list of tests with that label. Select one or more tests from the list with that label and save your test.

![](/images/test-management/test-suites/b982b26-labelfiltered.png "labelfiltered.png")

## Edit an existing test suite

:fa-arrow-right: **To edit an existing test suite:**

1. Select the test suite you want to edit and click the **Edit** button in the action panel.

![](/images/test-management/test-suites/17f71bf-editsuite.png "editsuite.png")

2. Update the suite information, add/remove tests from the suite, and click the **OK** button.

![](/images/test-management/test-suites/029def2-editsuite2.png "editsuite2.png")

## Re-Order tests in a test suite

By default tests are ordered in the suite based on the order in which they are selected. You can arrange and change the order of the tests in a suite once the suite has been created.

:fa-arrow-right: **To re-order the tests in a test suite:**

1. Double click the test suite you want to re-order.

![](/images/test-management/test-suites/425cccb-doubleclick.png "doubleclick.png")

2. Select a test and use the **Move Up** and **Move Down** buttons to change the order of the test in the list.

![](/images/test-management/test-suites/de91845-reorder.png "reorder.png")

## Running your Test Suite

#### Using CLI

In order to execute a test suite, you'll need to specify the test suite name in your CLI command like this:

```shell
--suite "Tutorial Demo"
```

Read more about running [CLI](/docs/cli-api/cli-settings) here.

#### Using Scheduler

You can run your suite from Testim scheduler.\
Read [here](https://help.testim.io/docs/scheduler) to see how.

> 📘 Note:
>
> If you use parallel in your command, the order of the run is no longer guaranteed.
