# 翻訳タスク (pull-requests)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Submit a pull request when merging to master

```mdx
Pull requests notify reviewers on changes introduced to a test. Once a pull request is opened, you can discuss and review the potential changes with collaborators before your changes are merged into the Master branch or to any other branch. You can add comments to pull requests. A pull request reviewer can also add their comments to the pull request. Pull requests are an essential part of the "code review" practice, which minimizes testers/devs breaking others’ work.

> 🚧 Before using pull requests you need to enable and configure the pull request settings in the **Project settings**. For more information, see [Project settings](doc:project-settings#pull-request-settings).

> 📘 This is a PRO feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, see [here](https://www.testim.io/pricing/).

## Creating a Pull Request

A pull request (PR) represents the (current) difference between a source branch and the target branch, so the change can be reviewed and approved by an authorized reviewer. Like in Github, the PR itself does not hold any state, and no changes/conflict resolutions can be performed as part of the PR itself. For this reason, it is important to resolve conflicts before submitting the PR.

The best practice for updating tests in the target branch is:
Create a source branch → make the required changes → merge the target branch to your source branch (to resolve conflicts) → issue a Pull Request.

### Resolving conflicts before PR

To resolve conflicts before submitting the PR, pull from target to your source branch, perform the changes on the branch, and then submit the pull request as instructed below. As part of the conflict resolution, you can view the comparison between the source and the target branches. The comparison will show you the current state of the merge for this test in read-only mode.
To learn more about resolving conflicts, see [Resolving Conflicts](doc:merging-branches#section-resolving-conflicts).

### Issuing a Pull Request

:fa-arrow-right: **To create a pull request:**

![640](/images/testops-version-control/pull-requests/99a18df-Open.gif "Open.gif")

1. After making the changes to your branch, select from the branches drop-down menu the branch that you would like to merge and click the **Merge** icon.
   The **Open Pull Request** dialog is displayed showing the tests and folders that would be merged into the target branch if approved.

2. Click **Next**.

3. Enter a **Title** and **Comment** for the pull request and click **Submit**.

## Reviewing a Pull Request

Reviewers are notified via email when there is a new PR with a direct link to the PR itself. Reviewers can also go directly to the PR list, and select the relevant PR from the list. When viewing the list, reviewers can click on the comments icon of a PR to view the comments history.

:fa-arrow-right: **To view all PRs for the project:**

![1920](/images/testops-version-control/pull-requests/be05e3d-prreview2.gif "prreview2.gif")

1. Click the **PR** button, which is located next to the branches drop-down menu.
   A list of open PRs is presented with the following information:

* **Source Branch** – the name of the source branch.
* **Target Branch** – the name of the target branch.
* **Details** - the name of the PR, who created it, and when.
* **Status** - the following statuses can be displayed:
  * **Review required** - the PR was submitted but has not been reviewed yet.
  * **Changes requested** - the reviewer asked for changes.
  * **Approved** - the PR was approved. It is possible to merge to target.
* **Comments** – click the comments icon to view the comment history. &lt;add screenshot of the PR list&gt;
  You can filter the results by clicking the **Filter** icon. The PRs can be filtered by *branch name*, *submitter*, and *status*.
  Closed PRs can be viewed directly in the [audit log](/docs/insights/audit-log). When deleting a branch, the PR will automatically be closed.

2. Open the PR you would like to review.
3. If the PR is marked as “Require approving reviewer” the following information is shown:

![429](/images/testops-version-control/pull-requests/876fb0e-Testim_621.png "Testim 621.png")

* Source branch name and pull request title
* Merge result – the number of conflicts (if any)
* Details of the changes

4. To view the changes click on the relevant drop-down menu.
5. Decide whether to approve the PR or ask for changes.
   * Click **Approve** to approve the PR. The status will be modified to **Approved**.
   * If there are changes in the PR that require additional changes or input by the requester, click **Request Changes**. You can add your comments to the PR and send it back to be resolved. &lt;add screenshot&gt;

## Resubmitting a Pull Request

If the reviewer sent back the PR, you can respond to the request and resubmit the PR. If the reviewer sent back the PR due to conflicts, you can review and resolve the conflicts as described in [Resolving Conflicts](doc:merging-branches#section-resolving-conflicts). When done, resubmit the pull request as described below.

:fa-arrow-right: **To resubmit a pull request:**

![640](/images/testops-version-control/pull-requests/7035af3-PR3.gif "PR3.gif")

1. After making the changes requested by the reviewer, open the pull request and click **Re-Submit**. (If you want to close the pull request click **Close PR**.)

![400](/images/testops-version-control/pull-requests/325f07e-Testim_613_r.png "Testim 613_r.png")

2. Enter a **Comment** for the resubmission and click **Re-Submit**.
```
