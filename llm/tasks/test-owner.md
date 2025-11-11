# 翻訳タスク (test-owner)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Assign owners to tests to minimize redundancies while scaling the workload

The Test Owner feature enables you to designate the “owner” for each test. This is helpful for identifying the person responsible for the test, as well as for filtering the test library and suite run results by test owner(s). By default, the initial test owner is the author of the test. You can reassign the test to a new owner.

> 📘 This is a PRO feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, click [here](https://www.testim.io/pricing/).

> 📘 When you reassign the test owner a test revision is automatically created. For more information, see [Revisions](/docs/test-management/revisions).

> 📘 Tests can have different owners in different branches. For example: Sample\_Test can have Owner A in the master branch, and Owner B in a different branch. If you merge the branches, you will need to decide which owner to assign to the newly merged test. For more information, see [Version control (branches)](/docs/testops-version-control/version-control-branches).

## Changing the Test Owner

You can reassign a test that is open in the Editor to a new test owner, and in the Test Library you can reassign an individual test or multiple tests to a new owner.

### Changing the Test Owner in the Editor

:fa-arrow-right: **To reassign a test owner in the Editor:**

1. Open a test in the Editor. For more information see [Opening a test](doc:test-list#opening-a-test).
2. Click the **Show step properties** icon to open the **Test Configuration Properties** panel.

![3851](/images/testops-management/test-owner/7b99d23-Testim_196a.png "Testim 196a.png")

> 📘 Alternatively, hover over the initial step of the test, and click on the **Show properties (:fa-cog:)** icon.

3. Click in the **Test owner** field.

![200](/images/testops-management/test-owner/c7347ec-Testim_197a_r.png "Testim 197a_r.png")

The **Replace Test Owner** window is shown.

![300](/images/testops-management/test-owner/a0e5978-Testim_194_r.png "Testim 194_r.png")

4. Select the new owner and click **Confirm**.\
   The window is closed and the new owner is listed.
5. Click the **Show step properties** icon to close the **Test Configuration Properties** panel.

### Changing the Test Owner in the Test Library

:fa-arrow-right: **To reassign a test owner in the Test Library:**

1. Go to the **Test Library** (**Test List** > **Tests**).

![3851](/images/testops-management/test-owner/41cae47-Testim_192.png "Testim 192.png")

2. Select the test (or multiple tests) for which you wish to change the owner.\
   Additional options are shown in the **Top Menu**.

![3851](/images/testops-management/test-owner/9237d3f-Testim_193a.png "Testim 193a.png")

3. Click the **Replace owner** icon (or right-click on a test and from the list that is shown choose **Replace owner**).

![3851](/images/testops-management/test-owner/b3ad2fa-Testim_193b.png "Testim 193b.png")

The **Replace Test Owner** window is shown.

![300](/images/testops-management/test-owner/3419b72-Testim_194_r.png "Testim 194_r.png")

4. Select the new owner and click **Confirm**.\
   The window is closed and the new owner is listed.

![960](/images/testops-management/test-owner/617e420-Feb-08-2021_08-56-14.gif "Feb-08-2021 08-56-14.gif")

## Filtering Test Library and Suite Runs by Test Owner

You can filter your list of tests in the Test Library by one or more test owner(s), and your list of tests in a Suite Run by a single test owner.

### Filtering Test Library

:fa-arrow-right: **To filter the Test Library by test owner(s):**

1. Go to the **Test Library** (**Test List** > **Tests**).
2. Click the **Advanced filters** icon.

![3851](/images/testops-management/test-owner/2ccd6df-Testim_192a.png "Testim 192a.png")

The **Filter Test** pane opens on the right-hand side.

![200](/images/testops-management/test-owner/ebac246-Testim_195_r.png "Testim 195_r.png")

3. In the **Test Owner** section of the **Filter Test** pane, select the owner (or owners) you want to filter by.

> 📘 You can also search for an owner within the **Test Owner** section of the **Filter Test** pane by clicking on the **Search** (magnifying glass) icon and entering your search criteria in the search box that opens.

4. Click **Apply**.\
   The filter is applied, and only those tests that meet your owner criteria are shown.

> 📘 You can remove the filters by clicking on **Reset filters** and then **Apply** in the bottom of the **Filter Test** pane.

5. Click the “**X**” in the upper right of the **Filter Test** pane to close it.

> 📘 Closing the **Filter Test** pane without resetting the filters will not reset them, and only the tests that meet the filter criteria will be shown. To view all of your tests and folders again, you will need to reopen the **Filter Test** pane and click **Reset filters** and then **Apply**.

### Filtering Suite Runs

:fa-arrow-right: **To filter a list of tests in a Suite Run by test owner:**

1. Go to the **Suite Runs** list (**Runs** > **Suite Runs**).

![3832](/images/testops-management/test-owner/911a46f-Testim_198.png "Testim 198.png")

2. Click on the **Test Suite** which you wish to filter.\
   A new screen is shown with the list of tests from that suite.
3. Click the **Advanced filters** icon.

![3851](/images/testops-management/test-owner/a1519d8-Testim_199a.png "Testim 199a.png")

The advanced filter options are shown.\
Click the dropdown arrow next to **All owners**, and select the test owner you want to filter by.

![3851](/images/testops-management/test-owner/257c1eb-Testim_200a.png "Testim 200a.png")

The filtered list is shown.

![1210](/images/testops-management/test-owner/09fd471-Feb-09-2021_05-50-07.gif "Feb-09-2021 05-50-07.gif")
