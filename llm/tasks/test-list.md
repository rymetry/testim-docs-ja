# 翻訳タスク (test-list)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Keep track of your tests

The **Test Library** screen (**Test List -> Tests**) is where you will manage your tests. Tests can be arranged in folders. All folders and tests within the current project are listed on this screen and you can perform a variety of actions on each of these tests, as described below.

# Viewing the Test Library

<Image title="Testim 481.png" alt={2452} align="center" src="/images/test-management/test-list/e75e02c-2024-11-24_16-39-18.png">
  Web Test Library
</Image>

<Image title="mobiletestlibrary.png" alt={1187} align="center" src="/images/test-management/test-list/20dd7c7-mobiletestlibrary.png">
  Mobile Test Library
</Image>

The Test Library screen displays a list of tests and folders with the following information:

- **Name** - the name of the test or folder. If Testim replaced a degraded locator for one or more of the elements in the test with an auto-improved locator, an “Ai” icon is shown after the test name for approximately two weeks. For more information, see [Locators: Auto Improve](/docs/test-management/locators-auto-improve).
- **Owner** - the owner of the test or folder.
- **App Name (mobile)** - name of the mobile app used to record the test.
- **App Version (mobile)** - version of the mobile app used to record the test.
- **Updated** - displays the time, indicating the last update made to the test.
- **Kind** - indicates whether the item is a *test\_or \_folder*.
- **Label** - a list of labels that were added to the test. For more information, see [Labels](/docs/test-management/labels).
- **Status** - the status of the test. For more information see [Test Statuses](doc:test-status#section-test-statuses).
- **Last Runs** - indicates the status of the last 10 remote runs. Each vertical line represents a test run. Green lines indicate passed tests. Red lines indicate failed tests. Yellow lines indicate passed tests that only passed after a retry. If less than ten tests have been run, the remaining lines will be grey. The :fa-close: or :fa-check:  icon indicates the status of the most recent test. :fa-close: indicates failed; :fa-check: indicates passed. Click the indicator to access the *Test runs* screen. For more information, see [Test runs](/docs/results/test-runs).

## Filtering the Test Library

You can filter your tests by status, label, owner, the shared steps that they contain, and tests that have been auto-improved. Tests in accounts integrated with Applitools can also filter by tests which contain Visual Validation steps.

:fa-arrow-right: **To filter the Test Library:**

1. Click the **Advanced filters** icon.

![](/images/test-management/test-list/8492bf1-2024-11-24_17-00-17.png)

The **Filter Tests** pane opens on the right hand side.

![](/images/test-management/test-list/31e9bf4-filtertests.png)

2. In the **Filter Test** pane select one or more filter criteria:
   1. **Show Flaky Tests** - enable this toggle to display flaky tests only. A test is considered flaky if it passed after a retry. For more information, see [Flaky tests](/docs/testops-management/flaky-tests).
   2. **Test Status** - Statuses are manually added to help manage which test needs to be worked on. For more information, see [Test Status](/docs/testops-management/test-status). Select one or more of the following statuses:
      1. Draft - Test is still in-progress
      2. Evaluating - Test ready, but its stability should be validated
      3. Active - Test is ready and stable
      4. Quarantine - The test doesn’t conform to the definition of a stable test and is waiting to be fixed
   3. **Label** - Labels are used to associate tests with one or more characteristics without the need to place them in a specific Suite or Test Plan. For more information, see [Labels](/docs/test-management/labels). Select one or more of the following labels and then select one of the following operands:
      1. OR - will return tests that include one or more of the selected labels.
      2. AND - will only return tests that include ALL the selected labels.
   4. **Test Owner** -  Test Owners are users that have been selected as the “owner” for each test. For more information, see [Test Owner](/docs/testops-management/test-owner). Select one or more of the test owners in the list.

> 📘
>
> You can also search for criteria within each section of the Filter Test pane by clicking on the **Search** (magnifying glass) icon and entering your search criteria in the search box that opens.

3. Click **Apply**.\
   The filter is applied, and only those tests that meet the criteria are shown. To learn more about saving this filtered view, see [Saving a Filtered View](/docs/test-management/saving-a-filtered-view).

> 📘
>
> You can remove the filters by clicking on **Reset filters** and then **Apply** in the bottom of the Filter Test pane.

4. Click the **"X"** in the upper right of the Filter Test pane to close it.

> 📘
>
> Closing the Filter Test pane without resetting the filters will not reset them, and only the tests that meet the filter criteria will be shown. To view all of your tests and folders again, you will need to reopen the Filter Test pane and click **Reset filters**.

## Search text box

You can use the search text box to find tests or folders based on their names, descriptions, and labels. The process for searching based on labels is slightly different than searching based on names and descriptions. In both cases, you enter your search criteria in the **Search library** box.

**Examples of Special Syntax:**

- **AND Searches:** Adding a second search term (separated by a space) will act as an **AND** search. In the case of labels, your second term needs to be preceded by the term **label:**.
- **Exclusion Searches:** Preceding a search term with a minus sign (without a space) will act a **NOT** search. If you have more than one term, be sure to add a space between the terms. In the case of labels, your second term needs to be preceded by the term **label**.

![](/images/test-management/test-list/f9e60e3-search.png)

:fa-arrow-right: **To search by names and descriptions:**

1. In the Search library text box, enter any text from the name or description of the tests or folders you want to find.\
   The resulting list is filtered immediately as you type each character.

:fa-arrow-right: **To search by labels:**

1. In the Search library text box, enter the text **label:** followed by the complete name of the label (without a space between them).\
   The filtered list is shown after you enter the complete name of the label.

**Label search example:**\
If you've labeled all the tests that still fail with the "Failed" label, you can filter as follows:

```text
label:Failed
```

- **Exclusion** - use the `-` modifier to exclude a specific label or name/string. For example, if you want to get all the tests in the label "sanity" that didn't fail:

```text
label:sanity -label:failed
```

> 📘
>
> Whether you search by names/descriptions or labels, the resulting list includes results in a flat view, so all tests or folders that are nested within folders that match the search criteria will also be shown. To view the location of any of the results, click on its row. The location is shown on the bottom of the screen.

## Opening a test

You can open a test in the Editor by **double-clicking** on the desired test. If the test is inside a folder or sub-folder, you need to drill-down by double clicking on each folder and sub-folder until you reach the desired test and then double-click on the test to open it.

> 📘
>
> When you open a folder, a breadcrumbs navigation appears at the top of the page, enabling you to navigate back to the root folder.

## Running Tests (Web)

You can run a test or multiple tests directly from the Test Library.\
:fa-arrow-right: **To run tests:**

1. Click on the test name to select it.

> 📘
>
> You can select multiple tests by holding down the ctrl/cmd key and then clicking on each of the desired tests.\
> If there are no folders in your Test Library, you can also select all of your tests by holding down the ctrl/cmd key + A on the keyboard.

2. Click the **Play** icon (or right-click on the test name and choose **Play** from the right-click menu).

![](/images/test-management/test-list/dd0e0f1-play.png)

The **Run Test Locally** window opens.

![](/images/test-management/test-list/54f8563-confirm.png)

3. If you would like to run the test in *Incognito mode*, select **Run in Incognito mode**.
4. If you would like the test to use a different base URL than the one originally configured in the test, select **Override Base URL** and enter the URL in the field that is shown.  For more information, see [Base URL](/docs/running-tests/base-url).
5. Click **OK**.

> 🚧
>
> Avoid touching your mouse and keyboard while the test is running.

The *Suite Runs* tab of the *Runs\_screen opens at the same time as the \_AUT* (application under test) browser. The test is run in the *AUT\_browser, and you can view the results in the \_Suite Runs* tab.

## Exporting to CSV

You can export a list of your tests to a csv file. The following information is included for each test: *name, description, labels, last run status, author, app name (mobile), app version (mobile), and path*.\
:fa-arrow-right: **To export test information to csv:**

1. Click on the **Export to CSV** icon.

![](/images/test-management/test-list/5426c49-export.png)

The csv file is downloaded to your local machine.\
**Note:** when searching/filtering the CSV will only contain the matching items.

## Changing Tests' Configuration (Web)

You can change tests' configuration directly from the test library.\
:fa-arrow-right: **To edit tests' configuration:**

1. Select the test/s you would like to change their configuration
2. Click on the "Edit test config" either from the top menu, or from the context menu

![](/images/test-management/test-list/62c4e7f-Screen_Shot_2021-12-06_at_16.51.38.png "Screen Shot 2021-12-06 at 16.51.38.png")

3. Select the configuration to apply
4. Click "OK"

![](/images/test-management/test-list/93790fb-Screen_Shot_2021-12-06_at_16.52.54.png "Screen Shot 2021-12-06 at 16.52.54.png")
