# 翻訳タスク (managing-tests-and-folders)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

You can keep your tests organized by saving them in folders and using labels. This guide also covers cloning tests and changing the test's base URL.

## Creating a new folder

:fa-arrow-right: **To create a new folder:**

1. In the Test Library screen, click the **+** button and select **New Folder**.

![](/images/test-management/managing-tests-and-folders/43e2f2e-new-folder.png "new-folder.png")

2. Give your folder a **New Name** and click the **OK** button.

![](/images/test-management/managing-tests-and-folders/3b2a89b-folder-name.png)

The new folder is added to the Test Library.

![](/images/test-management/managing-tests-and-folders/704b426-folder-added.png "folder-added.png")

> 📘
>
> The name of the new folder must not be the same as any other folders that already exist in this project.

## Moving tests/folders to folders

By default, new tests are placed in the root folder. You can move tests and folders into other folders.

:fa-arrow-right: **To move an item to a  folder:**

1. Click on the test or folder name to select.
2. Click the **Move to Folder** button.

![](/images/test-management/managing-tests-and-folders/b9c5a31-move-to-folder.png "move-to-folder.png")

You can also right click the test and select the **Move to Folder** option.

![](/images/test-management/managing-tests-and-folders/fcdaa0c-move-to-folder-rightclick.png "move-to-folder-rightclick.png")

> 📘
>
> - You can select multiple tests and/or folders by holding down the CTRL/CMD key and then clicking on each of the desired tests and folders.*To select a sequence of items select the first item in the sequence and then hold the tab key + right-click on the last item in the sequence.* You can also select all of your tests or folders by holding down the CTRL/CMD key + A on the keyboard.

3. The **Move To** window opens. Select the folder you want to move the test to and click the **Select** button.

![](/images/test-management/managing-tests-and-folders/290064c-select-folder.png)

> 📘
>
> If the target folder doesn't yet exist, you can create it now by clicking on the **New Folder** icon (bottom left of the window), entering the new folder's name, and clicking OK.

## Applying labels to tests

You can apply or remove an existing label to a test or tests. You can also create new labels to apply to your tests.

:fa-arrow-right: **To apply/remove a label:**

1. Click on the test name to select it.
2. Click the **Edit Labels** button.

![](/images/test-management/managing-tests-and-folders/ec0956e-edit-labels.png "edit-labels.png")

You can also right click the test and select the **Edit Labels** option.

![](/images/test-management/managing-tests-and-folders/0a03342-editlabelsrightclick.png "editlabelsrightclick.png")

3. Select or deselect existing labels to apply to the test.

![](/images/test-management/managing-tests-and-folders/0bb369c-selectdeselectlabels.png "selectdeselectlabels.png")

4. To add a new label, type your new label, click the **Create New** link, and then click **Apply.**

![](/images/test-management/managing-tests-and-folders/6737516-newlabel.png "newlabel.png")

> 📘
>
> - You can select multiple tests by holding down the CTRL/CMD key and then clicking on each of the desired tests.* If there are no folders in your Test Library, you can also select all of your tests by holding down the CTRL/CMD key + A on the keyboard.

> 🚧
>
> Label names should not contain any spaces.

A success message is shown.

![](/images/test-management/managing-tests-and-folders/0f7531e-Testim_051.png)

## Changing the test's base URL

You can specify a different Base URL than the default base URL that was configured for the test, for a specific test or multiple tests.

:fa-arrow-right: **To change the base URL:**

1. Click on the test name to select it. You can use the CTL/cmd button to select multiple tests.
2. Click the **Change Base URL** button.

![](/images/test-management/managing-tests-and-folders/23df7a9-2023-11-05_13-11-49.png)

3. Enter the desired base URL and click **Change**.\
   ![](/images/test-management/managing-tests-and-folders/9f47ff5-2023-11-05_13-26-59.png)

## Cloning tests

You can clone tests within the same project or clone them to another project to which you are a member, even if the project is not in the currently selected Company. See [Cloning tests](/docs/test-management/cloning-tests) for more details.

## Renaming tests/folders

You can rename tests and folders in the Test Library screen.

:fa-arrow-right: **To rename a test or folder:**

1. Right-click on the test or folder.
2. Click **Rename**.

![](/images/test-management/managing-tests-and-folders/0b4c5dd-rename.png)

The **Edit Name** window opens.

![](/images/test-management/managing-tests-and-folders/0af2d80-Testim_054_r.png)

3. In the **New name** field, enter the new name of the file or folder.
4. Click **OK**.\
   The renamed file or folder can be viewed in the Test Library.

## Deleting tests/folders

You can delete a test or folder or multiple tests or folders through the Test Library screen.

:fa-arrow-right: **To delete tests or folders:**

1. Click on the test or folder name to select it.
2. Click the **Delete** icon

![](/images/test-management/managing-tests-and-folders/fd32693-delete-test.png "delete-test.png")

You can also right-click on the test or folder name and choose **Delete** from the right-click menu.

![](/images/test-management/managing-tests-and-folders/f8f3e24-delete-right-click.png "delete-right-click.png")

> 📘
>
> - You can select multiple tests by holding down the ctrl/cmd key and then clicking on each of the desired tests.* You can also select all of your tests and folders by holding down the ctrl/cmd key + A on the keyboard.

The **Delete** confirmation window opens.

![](/images/test-management/managing-tests-and-folders/f254b04-delete-confirmation.png)

3. Click the **Delete** button.

The file/s and/or folder/s are deleted.
