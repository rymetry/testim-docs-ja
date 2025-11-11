# 翻訳タスク (labels)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Learn how to add labels to your tests

Labels are used to associate tests with one or more characteristics without the need to place them in a specific Suite or Test Plan. Tests can have multiple labels. For example, a "sanity" label to tag tests that will run on each code-change, "nightly" label to tag tests that will run in your integration/staging environment after each deploy, and "monitor" label to tag tests that will run each 15 minutes to make sure your production application is working properly.

Labels are great for two main purposes:

- **Filter by label** - organizing your tests list, and then easily finding them by filtering the list by label.
- **Creating test suites by label** – you can use the labels to quickly find relevant tests when creating a test suite.
- **Creating test plans by label** – when configuring a test plan, you can define certain labels will be included in the test plan.

## Add/Remove a Label to a Test

You can easily add or remove labels to each test in the test list.

:fa-arrow-right: **To add/remove labels from a test:**

1. On the Test List screen, click on the test name to select it.
2. Click the **Edit Labels** button.

![](/images/test-management/labels/96cd0e5-edit-labels.png "edit-labels.png")

You can also **right click the test** and select the **Edit Labels** option.

![](/images/test-management/labels/ed79e05-editlabelsrightclick.png "editlabelsrightclick.png")

3. Select or deselect existing labels to apply to the test.

![](/images/test-management/labels/64cba32-selectdeselectlabels.png "selectdeselectlabels.png")

4. To add a new label, type your new label, click the **Create New** link, and then click **Apply**.

![](/images/test-management/labels/18b0282-newlabel.png "newlabel.png")

> 🚧
>
> Label names should not contain any spaces.

## Filter Tests by Labels

You can use labels to filter tests in your test list that contain the selected label(s).

:fa-arrow-right: **To filter the test list by label:**

1. Navigate to **Test List > Tests**.
2. Click the **Advanced Filters** button in the action menu.

![](/images/test-management/labels/dbf0508-advancedfilters.png "advancedfilters.png")

The **Advanced Filters** panel will display.

![](/images/test-management/labels/e740633-advancedfilterspanel.png "advancedfilterspanel.png")

3. In the **Label** section of the panel, select/deselect the labels for the filter and click **Apply**.

![](/images/test-management/labels/95aaa61-selectlabels.png "selectlabels.png")

The test list will only display tests that contain the selected labels.

![](/images/test-management/labels/12ab199-filteredlist.png "filteredlist.png")

## Using labels in CLI-based runs

When running the CLI, you can select which label to run using the --label parameter:

```shell
testim --label "<YOUR LABEL>" --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>" --grid "<Your grid name>" --report-file test-results/testim-tests-report.xml
```
