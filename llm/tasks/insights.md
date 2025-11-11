# 翻訳タスク (insights)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

The **Insights** screen allows you to gain insights from your testing data to understand the current state of quality, build competency, team progress, and process improvement areas. The screen centralizes important information and statistics about your tests and provides access to detailed reports. This allows you to view and analyze information about the health of your project and focus your efforts on tests that may require your attention. You can choose the branch of your project for which you want the information displayed.

There are two tabs available on the Insights screen: *TestOps Dashboard* and *Reports*.

- **TestOps Dashboard** – The **TestOps Dashboard** provides important statistics with quick access to tests, remote execution runs, and other activities in your project. For more information, see [TestOps Dashboard](/docs/insights/dashboard).

- **Reports** – The **Reports** tab on the **Insights** screen shows detailed information about the quality of your project over a selected time period, including information about successful and failed test runs, the activity of your team, and information about which tests have failed the most. Company owners and project owners receive a weekly summary via email. For more information, see [Reports](/docs/managerial-reports).

![1932](/images/insights/insights/317734a-Testim_466a.png "Testim 466a.png")

## Selecting a Branch

The **Insights** section displays the information that is relevant to the specific branch that is currently selected. You can select any branch of your project, and the information shown is adjusted to reflect the data specific to that branch. You can also pin a branch so it becomes the default branch. This means that every time you log into Testim (until you remove the pin), the selected branch will be the pinned branch, and the data shown in the **Insights** section will be the data stored in this branch. For more information, see [Pinning a Branch](doc:version-control-branches#pinning-a-branch).

:fa-arrow-right: **To select a branch of your project:**

1. Click on the branch dropdown menu, and then select a branch.

![3663](/images/insights/insights/42c0ba8-Testim_467a.png "Testim 467a.png")

The data is automatically updated based on the branch specified.

> 📘 You can also search for a branch entering your search criteria in the search box.
