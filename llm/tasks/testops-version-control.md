# 翻訳タスク (testops-version-control)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Branches, merging, and pull requests (PRs) are commonly used concepts in version control systems like Git, which are used to manage code changes and collaborate on software development projects. Testim provides similar capabilities with some exceptions.

Here is a brief overview of the mechanism behind these concepts:

- [Branches](/docs/testops-version-control/version-control-branches): A branch is a parallel version of a project's tests. When you create a new branch, you're essentially creating a copy of the project's tests at that point in time. You can make changes to the test in that branch without affecting the main project's tests, you can switch between branches to work on changes or fixes and delete branches when branch merging is finished.
- [Merging](/docs/testops-version-control/merging-branches): Merging is the process of combining changes from one branch into another. When you merge a branch, you are taking the changes made in that branch and applying them to another branch (usually the main branch). Testim uses a three-way merge algorithm to combine the changes from both branches while preserving any changes that do not conflict with each other.

> 📘 Note:
>
> In Testim, some artifacts are shared between branches, and any changes made to an artifact in one branch will automatically modify the corresponding artifact across all other branches. See a list of [Shared Attributes Between Branches](https://help.testim.io/docs/version-control-branches#shared-attributes-between-branches). This mechanism is unique compared to Git-like branch/merge/PR mechanisms.

- [Pull Requests](/docs/testops-version-control/pull-requests): A pull request (PR) is a feature of Testim version control that allows test developers to propose changes to a main branch (usually 'master’).
  - The PR mechanism is active when merging to any [branch with a read only indication](/docs/testops-version-control/read-only).
  - If a branch is read only, it means that contributors (submitters) cannot make changes directly to that branch. Instead, they need to create a new branch based on the read only branch, make their changes, and then create a PR to merge their changes back into the read only branch.
  - When you create PR, you ask the project's maintainers (reviewers) to review your changes and thus to allow you to merge these changes into the main branch.
  - Testim PRs include a description of the changes including; list of affected tests, shared steps, folders and suites, and optional comments.
  - Testim enables project owner to manage a list of reviewers and to enable self-review if needed.
