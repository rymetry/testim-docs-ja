# 翻訳タスク (read-only)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Don't allow writing directly to a branch (only by using branches and merges)

Testim features the ability to lock the branch, so that writing directly to the branch is not allowed.\
In order to write to the branch, all users will need to first fork to another branch and then perform a merge to the branch. The merge to a branch can be done through a [Pull Request](https://help.testim.io/docs/pull-requests).

> 📘 This is a pro feature
>
> This feature is only open to projects on our professional plan. To learn more about our professional plan, see [here](https://www.testim.io/pricing/).

> 📘
>
> Only the **project owner** or the **company owner** can configure the branch to be read-only.

## Enabling the branch read-only mode

The branch read-only mode is located under the **Pull Requests** settings, in the **Settings -> General** screen and is configured per project. To enable it, switch on the **Protect branch from changes** toggle. The branch will be labeled as "read-only".

![](/images/testops-version-control/read-only/77cbaf9-project_settings.png "project settings.png")

## Branch as read-only behavior

When enabling the branch to be read-only, the current activities will be affected.

### Testim Editor

- When performing a save to a test directly under the branch, we will ask you to perform a fork to another branch, and save the changes on the new branch

![](/images/testops-version-control/read-only/ef453c8-Screen_Shot_2021-01-18_at_6.21.37.png "Screen Shot 2021-01-18 at 6.21.37.png")

### Test List

#### Tests

The following actions will be disabled:

- Create a new test
- Delete test
- Clone test
- Create a new folder
- Move to another folder
- Delete folder
- Change test's status
- Rename

![](/images/testops-version-control/read-only/a5dab70-Untitled_2.png "Untitled 2.png")

#### Suites

The following actions will be disabled:

- Create suite
- Copy suite
- Delete suite
- Edit suite

![](/images/testops-version-control/read-only/1f237b2-Untitled_3.png "Untitled 3.png")

### Auto-Improve feature on read-only branches

By default, the auto-improve feature only runs on branches that are not set as read-only. However, if the branch is a master branch, it is possible to set the **Allow Auto-Improve on master** on, which will apply the auto improve feature on a master read-only branch. For more information see [Allowing Auto Improve on a Read Only Branch](doc:locators-auto-improve#section-allowing-auto-improve-on-a-master-read-only-branch).

![](/images/testops-version-control/read-only/05bf593-autoimprove.png "autoimprove.png")
