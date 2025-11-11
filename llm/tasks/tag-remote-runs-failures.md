# 翻訳タスク (tag-remote-runs-failures)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Add failure types to failed runs to capture data and provide reporting insights

On remote runs, you can tag the failed tests with failure types tags. Tagging helps provide a historical record of why tests failed to identify trends and provide insights that aid process improvement.

## Tagging a test failure from the test result screen

You can tag the failed test that ran remotely, add a description, and link it to a previously reported issue or create a new issue for it. If you want to publish new issues to your bug/issue tracking system, you will have to first configure the connection between Testim and your issue tracking system (a.k.a Bug Tracker). To learn more, see [Bug Tracker Settings](/docs/bug-tracker-settings/bug-tracker-settings).  

:fa-arrow-right: **To add a test failure tag:**

1. After running a remote run test, if the test has failed, click the **Tag Test Failure** link.

> ❗️ Make sure you run the test using the "Run on grid" option (not "Run locally")

![1155](/images/results/tag-remote-runs-failures/3ee72ad-tag6.png "tag6.png")

The following dialog is displayed:

![](/images/results/tag-remote-runs-failures/49d2321-Screen_Shot_2021-08-21_at_7.47.29.png)

2. In the **Failure type** field, select one of the following options:

- Bug in app
- Environment issue
- Invalid test data
- Test design
- Other

3. In the **Description** field, enter a specific reason or context for the failure (optional).
4. In the **Link to issue** field, submit a bug report by following the instructions in [Creating a bug report for the failed test run](docs:tag-remote-runs-failures#creating-a-bug-report-for-the-failed-test-run)
5. Click **Add** to save.

## Creating a bug report for the failed test run

As part of the tagging failed runs process, you can create a bug report, by either linking to an existing issue in your bug tracking system (e.g. Jira, Slack, Trello, etc.) or creating a new issue/bug report that will be added to the bug tracking system.

:fa-arrow-right: **To link to an existing issue in your bug tracking system:**

1. Make sure your bug tracking system is integrated with Testim. For more information and detailed instructions, see - [Bug Tracker Settings](/docs/bug-tracker-settings/bug-tracker-settings).
2. In the **Tag Test Failure** dialog, in the **Link to issue** field, add the URL of the existing issue.
3. Complete the tagging a test failure process.

:fa-arrow-right: **To create a new bug report:**

1. Make sure your bug tracking system is integrated with Testim. For more information and detailed instructions, see - [Bug Tracker Settings](/docs/bug-tracker-settings/bug-tracker-settings).
2. In the **Tag Test Failure** dialog, click **Create issue** to create a new issue in your bug tracking system.\
   The bug details are automatically created and the **Publish Bug** screen is displayed:

![3145](/images/results/tag-remote-runs-failures/60c8974-jiraaftercreateissue.PNG "jiraaftercreateissue.PNG")

3. In the **Summary** field, fill in a descriptive summary.
4. You can modify the Project and Type selection and edit the suggested texts.
5. When finished, click **Publish** to publish the issue.\
   The **Link to issue** field will include the URL of the newly created issue or the existing issue.  

![](/images/results/tag-remote-runs-failures/c4ab431-linktoissue.png)

6. Click **Add** to save.

## Editing an existing test failure tag

After tagging a test failure, you can edit an existing test failure tag.

1. From the **Test List** screen, click the relevant test.\
   On the test editor screen you will see your previously selected test failure tag.

![](/images/results/tag-remote-runs-failures/84be8ad-previoustag.png)

2. Hover your mouse over the tag and click the **Edit Tag** icon

![398](/images/results/tag-remote-runs-failures/5f62567-edit_tasg_icon.png "edit_tasg_icon.png")

3. Edit the existing test failure tag.

![](/images/results/tag-remote-runs-failures/d60af77-newtag.PNG)

4. Click **ADD** to save

## Tagging multiple test failures from the Test Runs screen

:fa-arrow-right: **To tag multiple tests on the Test Runs screen:**

1. Go to **Runs -> Test Runs**.
2. Use the time-frame drop-down menu to set the relevant time-frame.\
   A list of test runs will appear at the bottom.

![1901](/images/results/tag-remote-runs-failures/8031cf7-tag3.png "tag3.png")

3. Click the bug icon at the top of the list.  

![364](/images/results/tag-remote-runs-failures/c5fe49c-tag5.png "tag5.png")

The following dialog is displayed:

![](/images/results/tag-remote-runs-failures/95196a8-tag4.PNG)

4. Select the **Failure Type**, add a description (optional) and Link to issue in your issue tracking system (e.g. Jira), by entering a URL of the issue.
5. Click **Add**.

## Suggested failure tags

After tagging multiple failed tests, if Testim recognizes a reoccurring issue, it will suggest a failure tag based on your previous selections. The suggested failure tag appears at the top of the test result screen.\
:fa-arrow-right: **To use the suggested failure tag from the test result screen:**

1. At the top of the test result screen, hover your mouse on the suggested failure tag.\
   The following dialog is displayed:

![990](/images/results/tag-remote-runs-failures/bac5964-tag7.PNG "tag7.PNG")

2. Do one of the following:

- Click Confirm to accept the suggestion. Following the confirmation, the test will be tagged based on the suggest selection and will include the description and the link to the issue of the previous failure tags (the failure tags that were used as a basis for the suggestion).  
- Click Edit to select another tag. The tagging screen is displayed. Follow the instructions in the  **Tagging a test failure from the test result screen** section above.

:fa-arrow-right: **To use the suggested failure tag from the Test Runs screen:**

1. Go to **Runs -> Test Runs**.
2. Use the time-frame drop-down menu to set the relevant time-frame.\
   A list of test runs will appear at the bottom.  
3. Tests that include a suggested failure tag will be labeled as "Suggested".
4. Hover your mouse on the suggested failure tag.

![1231](/images/results/tag-remote-runs-failures/c10c05c-tag8.png "tag8.png")

5. Do one of the following:

- Click **Confirm** to accept the suggestion. Following the confirmation, the test will be tagged based on the suggest selection and will include the description and the link to the issue of the previous failure tags (the failure tags that were used as a basis for the suggestion).  
- Click **Edit** to select another tag. The tagging screen is displayed. Follow the instructions in the **Tagging a test failure from the test result screen** section.

## Viewing Failure Reports

You can view statistics about failures by failure type in the reports view. As you build up data about your failures, you can identify trends, helping you target remediation or process improvement.\
:fa-arrow-right: **To view failure report:**

1. Go to **Insights -> Reports**.\
   The failure report is the third report from the top.
2. Click the drop-down menu to select the time-frame of the report.

![451](/images/results/tag-remote-runs-failures/65b3172-timeframe.PNG "timeframe.PNG")

3. The report has two views – **donut chart** and **line graph**. Click the view modes to toggle between the views.

![363](/images/results/tag-remote-runs-failures/3167d19-views.png "views.png")

### Failure by Type – Donut Chart

![1380](/images/results/tag-remote-runs-failures/6817b4d-report1.png "report1.png")

The donut chart displays the distribution of failure types by tag. Each tag includes the occurrence percentage out of the total number of runs and its percentage in the previous period. Clicking the failure tag takes you to the **Test Runs** screen, while listing all the runs that were tagged with this type.

### Failure by Type – Line Graph

![1380](/images/results/tag-remote-runs-failures/205bbec-report2.png "report2.png")

The line graph displays the number of occurrences of each type of failure throughout the specified period of time. Each tag is color coded according to the legend on the left. You can hover your mouse to see additional info.
