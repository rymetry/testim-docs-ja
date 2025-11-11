# 翻訳タスク (link-directly-to-a-shared-step)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

> 📘 This is a Testim Labs feature
>
> If you have joined Testim Labs, make sure this feature has been enabled in **Settings > Labs**. To learn more about Testim Labs and how to join, see [here](https://help.testim.io/docs/testim-labs)

The Link Directly to a Shared Step feature provides access to a shared step/group directly from the [Shared Steps Library](/docs/test-management/shared-steps-library). By accessing a test in the Shared Steps Library, the requested test is shown with the shared step/group selected.

## Directly Accessing Shared Steps/Groups

:fa-arrow-right: **To access a shared step/group:**

1. In the main navigation, click the **Test List** icon.

![3853](/images/miscellaneous/link-directly-to-a-shared-step/10c510a-Testim_432a.png "Testim 432a.png")

2. Click **Shared Steps** to open the Shared Steps tab.

![3853](/images/miscellaneous/link-directly-to-a-shared-step/d701b25-Testim_432b.png "Testim 432b.png")

3. Click the **down arrow** to the right of the shared step/group that you would like to view.

> 📘 The “used by” icon must contain a number larger than zero. If the shared step/group has zero tests using it, you will first need to add it to a test before being able to view/edit it.

![3658](/images/miscellaneous/link-directly-to-a-shared-step/0dde977-Testim_433a.png "Testim 433a.png")

The item expands, showing the list of all of the tests which contain the shared step/group.

![3655](/images/miscellaneous/link-directly-to-a-shared-step/ad912d7-Testim_434.png "Testim 434.png")

4. Double-click the test for which you want to view the shared step/group.

> 📘 Alternatively, you can right-click the test, and select **Open in new tab**.

The test opens with the shared step/group selected.

![3853](/images/miscellaneous/link-directly-to-a-shared-step/fc31f7c-Testim_435.png "Testim 435.png")

> 📘 If the opened test contains multiple appearances of the shared step/group, only the first appearance will be selected.

![1016](/images/miscellaneous/link-directly-to-a-shared-step/3107af4-Jul-26-2021_12-46-44.gif "Jul-26-2021 12-46-44.gif")
