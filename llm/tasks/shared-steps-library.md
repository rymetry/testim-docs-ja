# 翻訳タスク (shared-steps-library)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Keep track of your shared steps

The **Shared Steps Library** screen (**Test List -> Shared Steps**) is where you will manage your [Shared Steps](/docs/groups/shareable-steps) . Shared steps can be arranged in folders. All shared steps within the current project are listed on this screen and you can perform a variety of actions on each of these shared steps, as described below.

# Viewing the Shared Steps Library

![](/images/test-management/shared-steps-library/45778d1-Testim_055.png "Testim 055.png")

The Shared Steps Library screen displays a list of shared steps and folders with the following information:

- **Name** - the name of the shared step or folder.
- **Date Modified** - the last date the shared step/folder was modified.
- **Kind** - indicates whether the item is a shared step, group, or folder. If it is a shared step, the type of step will be listed (i.e. custom action, custom validation, etc.).
- **Used by** - the number of tests using the shared step. (Clicking on the number will take you to the Test Library, filtered by this shared step.)

## Filtering the Shared Steps Library

You can filter your shared steps by the step category (i.e. Groups, Actions, Validations, and Wait for).\
:fa-arrow-right: **To filter the Shared Steps Library:**

1. Click the **Advanced filters** icon.

![](/images/test-management/shared-steps-library/923bb65-Testim_056a.png "Testim 056a.png")

The Filter Shared Steps pane opens on the right hand side.

![](/images/test-management/shared-steps-library/7ff70ce-Testim_057_r.png)

2. In the Filter Shared Steps pane select one or more filter criteria.
3. Click **Apply**. The filter is applied, and only those shared steps that meet the criteria are shown. To learn more about saving this filtered view, see [Saving a Filtered View](/docs/test-management/saving-a-filtered-view).

> 📘
>
> You can remove the filters by clicking on **Reset filters** and then **Apply** in the bottom of the Filter Shared Steps pane.

4. Click the **"X"** in the upper right of the Filter Shared Steps pane to close it.

> 📘
>
> Closing the Filter Shared Steps pane without resetting the filters will not reset them, and only the shared steps that meet the filter criteria will be shown. To view all of your tests and folders again, you will need to reopen the Filter Shared Steps pane and click **Reset filters** and **Apply**.

![](/images/test-management/shared-steps-library/d44b4d2-Jan-28-2021_14-00-05.gif "Jan-28-2021 14-00-05.gif")

## Search text box

You can use the search text box to find shared steps or folders based on their names. You enter your search criteria in the **Search library** box.

> 🚧
>
> - Unlike searching for tests in the Test Library, using the minus sign does **NOT** work to add an exclusion term to your list.* The search criteria are case sensitive, so be sure to use proper capitalization in your search terms.

:fa-arrow-right: **To search by names:**

1. In the Search library text box, using proper capitalization, enter any text from the name of the tests or folders you want to find.\
   The resulting list is filtered immediately as you type each character.

> 📘
>
> The resulting list includes results in a flat view, so all shared steps or folders that are nested within folders that match the search criteria will also be shown. To view the location of any of the results, click on its row. The location is shown on the bottom of the screen.

![](/images/test-management/shared-steps-library/ba0156b-Jan-31-2021_10-37-29.gif "Jan-31-2021 10-37-29.gif")

## Opening a folder

You can open a folder by double-clicking on the desired folder. If the shared step you are looking for is inside another folder or sub-folder, you need to drill-down by double clicking on each folder and sub-folder until you reach the desired shared step.

> 📘
>
> When you open a folder, a breadcrumbs navigation appears at the top of the page, enabling you to navigate back to the root folder.

## Exporting to CSV

You can export the details of all the selected shared steps, by selecting the shared steps and clicking the **Export to CSV** icon.

![](/images/test-management/shared-steps-library/5360b78-Screen_Shot_2021-01-31_at_10.46.43.png "Screen Shot 2021-01-31 at 10.46.43.png")

**Note:** when searching/filtering the CSV will only contain the matching items.

## Hiding shared steps from the list

You can hide shared steps from the list. Hiding them will remove them from the list, and from the add step menu in the editor.

> 📘
>
> Hiding shared steps will also hide these steps on all branches, even without explicit merging.

:fa-arrow-right: **To hide shared step(s):**

1. Select the steps you would like to hide from the list
2. From the top menu or the context menu click on the hide option
3. Approve the warning

![](/images/test-management/shared-steps-library/78b6959-Feb-23-2021_12-40-11.gif "Feb-23-2021 12-40-11.gif")

> 🚧
>
> Hidden steps are still shared between the tests that are using them

:fa-arrow-right: **To unhide hidden steps:**

1. Open the filter
2. Select "show hidden steps"
3. Select the steps you would like to unhide
4. Click the un-hide option

![](/images/test-management/shared-steps-library/ac73aaa-Feb-23-2021_12-51-21.gif "Feb-23-2021 12-51-21.gif")
