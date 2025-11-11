# 翻訳タスク (tta-for-salesforce-branch-management)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Testim for Salesforce branch management feature is similar to the general Testim branch management feature, except for some key differences. For more information about about the general Testim branch management, see [Branch Management](/docs/testops-version-control/version-control-branches).

# Using Testim for Salesforce Branches

- As a starting point, each project is composed of a single "main" branch.
- You can create additional branches and switch between branches at any time and modify tests within a branch as you like. Modifications in one branch will not affect other branches. To create a new branch, see [Creating a branch](https://help.testim.io/docs/tta-for-salesforce-branch-management#creating-a-branch). To switch between branches, see [Switching Branches](https://help.testim.io/docs/version-control-branches#switching-branches).
- Each branch can be associated with a single [Salesforce environment](https://help.testim.io/docs/create-and-manage-test-environments). This means that as part of the development of the test, you can associate the same branch to different environment, moving it from one environment to another (e.g. from QA environment, to Staging environment, to Production environment). To change environment in a branch, see [Changing the Salesforce Environment of a branch](https://help.testim.io/docs/tta-for-salesforce-branch-management#changing-the-salesforce-environment-of-a-branch).  Although it is not mandatory to associate the branch with a Salesforce environment, to use Salesforce related steps (e.g., Login step), you will need to perform this association.
- Each Salesforce environment is associated with one or more branches. The association is done through the configuration of the branch itself. To create a Salesforce environment, see [Connecting a Salesforce environment](https://help.testim.io/docs/create-and-manage-test-environments#connecting-a-salesforce-environment).
- At a certain point you may want to merge between branches (e.g. merging a feature branch into the Main branch). To merge branches, follow the instructions in the [Merging Branches](https://help.testim.io/docs/create-and-merge-branches-from-different-test-environments#merging-a-branch) section.

## Creating a branch

:fa-arrow-right:**To create a new branch:**

1. Click the **Create New Branch (fork icon)** button in the menu.

   ![](/images/salesforce-utilities/tta-for-salesforce-branch-management/35b00be-fork.png)
2. In the **Name** field, enter a name for the branch.
3. In the **Salesforce environment** field, associate the relevant Salesforce environment to the branch. Although it is not mandatory to associate the branch with a Salesforce environment, to use Salesforce related steps (e.g., Login step), you will need to perform this association.  

   ![](/images/salesforce-utilities/tta-for-salesforce-branch-management/f57b3fa-newbranch2.png)
4. Click **OK**.

## Changing the Salesforce Environment of a branch

:fa-arrow-right:**To change the Salesforce environment of a branch:**

1. Click the **Branches** drop-down menu at the top to see the list of branches.
2. Click the **Change environment** button on the desired branch.

   ![](/images/salesforce-utilities/tta-for-salesforce-branch-management/a0b3049-2023-12-12_17-36-35.png)
3. In the Change Environment dialog, under New Environment, select the desired environment from the drop down menu.

   ![](/images/salesforce-utilities/tta-for-salesforce-branch-management/16ed4e9-2023-12-12_17-40-40.png)
4. Click **Save**.
