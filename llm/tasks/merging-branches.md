# 翻訳タスク (merging-branches)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Merging two branches will mix steps or add entire tests from the selected branch into the currently displayed branch, which can be the master branch or any other branch. After the merge the source branch will still exist until you specifically delete it. In the case of a conflict, you will be able to review the conflicted steps and decide which of the conflicting steps to take.

:fa-arrow-right: **To merge two branches:**

1. Open the target branch to which you want to merge. For example, if you want to merge to Master, select it from the Branches drop-down menu.
2. Click the **Branches** drop-down menu and hover your mouse over the source branch.
3. Click the **Merge** icon.

![](/images/testops-version-control/merging-branches/2a9c092-sourcemerge.PNG "sourcemerge.PNG")

The **Merge Branch** dialog displays a summary of all the changes that will be merged. At this point you should review the changes, see **Reviewing Changes** section below.

## Reviewing changes

Before merging branches, a pop-up will be displayed detailing the changes that are about to take place during the merge.\
The changes are divided into these categories:

- Tests
- Shared Steps (groups, custom actions, etc.)
- Suites
- Folders

At the top level, you will be able to see what changed in each category - how many new items were created, updated, or deleted. Expanding each item will display more details about the individual changes along with the ability to view the source branch and the target branch, and in case of conflicts compare between the two, while selecting the preferred change to merge, as explained in detail in the **Resolving Conflicts** section.

## Merge cherry-pick

You can cherry-pick which tests and suites (i.e. merge items) you would like to include in the merge. By default, all items are selected. Unchecked items will not be included in merge, however, unless the source branch is deleted, they will be available for merging if you merge again.

:fa-arrow-right: **To cherry-pick merge items:**

1. Click the summary drop-down to view the individual items.

![](/images/testops-version-control/merging-branches/f3e40eb-merge_dropdown.png "merge_dropdown.png")

The list includes details of the differences between the source and the target branches (e.g. number of new steps, number of changed steps, or deleted steps.

![](/images/testops-version-control/merging-branches/6b13a35-c9cef4f-Screen_Shot_2020-06-23_at_15.45.46.png "c9cef4f-Screen_Shot_2020-06-23_at_15.45.46.png")

2. If you don't want to include a test or a suite in the merge, unselect it and this will remove it from the merge.
3. When finished, click **Merge**.\
   All the steps from the selected branch will be merged into the currently displayed branch, which can be the master branch or any other branch.

> 📘
>
> If the [Pull Requests](/docs/testops-version-control/pull-requests) feature is enabled, cherry-picking will only become available once the PR is approved.

> 📘 Note
>
> If you are unsure about selecting/deselecting an item, you can view the item in the source/target by expanding the changes summary and clicking **View Source/View Target**.

## Resolving Conflicts

When merging two branches there can be conflicts between specific steps of a test and between shared steps. For example, a step that was changed in the source, but meanwhile was deleted in the target. You will not be able to proceed with the merge process before resolving all the conflicts.\
As part of the **Reviewing Merge Changes** process, if there are conflicts, the number of conflicts will be indicated at the top of the **Merge Branch** screen and by the specific item that has the conflicts.

![](/images/testops-version-control/merging-branches/ffa92c7-mergewithconflicts.png "mergewithconflicts.png")

## Resolving conflicts between shared steps

Groups and shared steps (e.g. CLI Action, API Action, etc.) are merged separately not in a specific test, because these items can be used by several tests.

- In shared groups all the properties, except *parameter values* and *group context*, are shared between tests, and therefore if conflicts arise, they should be resolved at the Shared Step level, which is a separate list of conflicts for shared steps.  
- In \_CLI/API Action \_all the properties, except parameter values, are shared between tests, and therefore if conflicts arise, they should be resolved at the Shared Step level.

To resolve the conflict between shared steps, click **Compare** next to the shared step that includes conflicts:

![](/images/testops-version-control/merging-branches/8a021ca-compareshared.png "compareshared.png")

The **Compare** shared steps screen is displayed:

![](/images/testops-version-control/merging-branches/6a292c3-shared_compare_screen_callouts.PNG)

The part of the shared step that has the conflict is highlighted.\
The **Compare Shared Step** screen features three columns:

- Source (right) – the shared step in the Source branch. If the shared step is a group, the group properties are displayed followed by all the steps within this group.
- Target (left) – the shared step in the Target branch. If the shared step is a group, the group properties are displayed followed by all the steps within this group.
- Merge (center) – the shared step in the final merged branch.

At the top of the list are the shared step properties. If it is a group, a conflicted step (in the Source or Target) within the group includes the following elements:

- Step object – the same object that appears in the test.
- Conflict reason – the action that was performed on this step for which the conflict was created. For example, in the source this step was deleted and in the target this step was edited.
- Recommended version indicator – indicates that this action was performed later than the opposite version.

A CLI/API Action shared step compare screen will look like this:

![](/images/testops-version-control/merging-branches/b08a1d1-compare_custom_step.PNG "compare_custom_step.PNG")

:fa-arrow-right: **To resolve the shared step conflict:**

> 📘 Note
>
> If you do not want to manually select which version to merge for this test, you can click the **Resolve all button** at the top and then click Confirm. To learn more, see [Resolving all conflicts automatically](doc:merging-branches#section-resolving-all-conflicts-automatically-without-comparing)

1. Place the chosen version in the **Merge** (center) column by clicking the relevant arrow (left/right).
2. If the **Jump to the next conflict** is selected (default), the next conflict will be highlighted. If it is not selected, click the **Next conflict** button.
3. When done resolving all the conflicts in the test, click **Confirm**.
4. Repeat steps 1-4 for each shared step that includes conflicts.
5. Do one of the following:
   - If there are no conflicts at the test level, when done resolving all the remaining conflicts on all the shared steps, click **Merge**. All the shared steps from the selected branch will be merged into the currently displayed branch, which can be the master branch or any other branch.
   - If there are conflicts at the test level, resolve these conflicts by following the instructions in the next section.

## Resolving conflicts between tests

To resolve the conflicts between tests, click **Compare** next to the test that includes conflicts.

![](/images/testops-version-control/merging-branches/e1888e3-testconflict_comparelink.png "testconflict_comparelink.png")

The **Compare** screen is displayed:

![](/images/testops-version-control/merging-branches/1cc4137-Screen_Shot_2021-02-09_at_6.28.59.png "Screen Shot 2021-02-09 at 6.28.59.png")

The **Compare** screen features three columns:

- **Source (right)** – the test in the Source branch.
- **Target (left)** – the test in the Target branch.
- **Merge (center)** – the test final merged branch.

The first step contains the test properties which are revisioned:

- Test data
- Base URL
- Recorded HAR when applicable
- Test status
- Capture request/response body configuration when applicable
- Test owner

You will need to decide whether to use the properties from the source or the target (by default the latest is selected)

Each step that includes a conflict is highlighted. The conflicted step (in the Source or Target) includes the following elements:

- **Step object** – the same object that appears in the test.
- **Conflict reason** – the action that was performed on this step for which the conflict was created. For example, in the source this step was deleted and in the target this step was edited.
- **Recommended version indicator** – indicates that this action was performed later than the opposite version.

A test can include a shared step, such as a shared group, that has conflicts that relate to parameter values and/or group context, which should be resolved in the specific test context. For this reason the shared group may appear in the test conflict resolution screen, while displaying the specific reason for the conflict (e.g. the specific parameter value that was changed).

![](/images/testops-version-control/merging-branches/844f324-step_compare_callouts.PNG "step_compare_callouts.PNG")

:fa-arrow-right: **To resolve the conflict:**

> 📘 Note
>
> Note: if you do not want to manually select which version to merge for this test, you can click the **Resolve all** button at the top and then click **Confirm**.

1. Place the chosen version in the Merge (center) column by clicking the relevant arrow (left/right).

![](/images/testops-version-control/merging-branches/62021e4-beforeafter.PNG "beforeafter.PNG")

> 📘 Note
>
> If you are not sure which of the two versions to select, you can view each of the versions in context, by clicking **View in Editor**, which is located at the top of the column. The branch will open on the specific test in a new tab.

> 📘 Note
>
> In some cases the **Recommended version indicator** will indicate that this action was performed later than the opposite version. This may help in deciding which version to choose.

2. If the **Jump to the next conflict** is selected (default), the next conflict will be highlighted. If it is not selected, click the **Next conflict** button.
3. When done resolving all the conflicts in the test click **Confirm**.
4. Repeat steps 1-4 for each test that includes conflicts.
5. When done solving all the remaining conflicts on all the tests, click **Merge**.\
   All the steps from the selected branch will be merged into the currently displayed branch, which can be the master branch or any other branch.

> 📘 Tip
>
> The merging process will not begin until you have resolved all the conflicts in all tests. However, if you want to resolve conflicts in some tests and leave the other conflicts for a later time, you can deselect the tests that you want to leave them for a later time, see [Merge Cherry-pick](doc:merging-branches#section-merge-cherry-pick) section above. The deselected tests will not be part of the merge process at this time.

## Resolving all conflicts automatically without comparing

There is an option to resolve all conflicts at once without comparing specific conflicts and without selecting a specific version manually. In this case, Testim will automatically select the version that was changed later in time.

:fa-arrow-right: **To resolve all conflicts automatically:**

1. From the **Merge Branch** screen, click **Resolve all** .

![](/images/testops-version-control/merging-branches/6df160f-resolveall2.png "resolveall2.png")

The following message appears confirming that all conflicts were resolved.

![](/images/testops-version-control/merging-branches/58d49c3-resolved2.png "resolved2.png")

2. Click **Merge**.\
   All the steps from the selected branch will be merged into the currently displayed branch, which can be the master branch or any other branch.

## Deleting the source branch when merging

When merging the branches it is possible to automatically delete the source branch after the merge occurs. This can be done when merging following a pull request and also without a pull request.

 :fa-arrow-right: **To automatically delete the source branch:**

- On the **Merge Branch** or Pull Request screen, select the "Delete branch x upon merge".\
  ![](/images/testops-version-control/merging-branches/6a86a0c-small-image_1.png)

![](/images/testops-version-control/merging-branches/984c0e3-small-image.png)
