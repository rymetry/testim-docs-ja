# 翻訳タスク (github-integration)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Manage your GitHub branches in Testim and publish bugs with Git Issues

Branches created in GitHub will automatically be created (same name) in Testim.\
Merging branches in GitHub will automatically merge in tests in Testim.\
Read more Testim branches [here](/docs/testops-version-control/version-control-branches).

GitHub integration also allows you to report bugs in Git Issues straight from your browser. All the relevant bug info will automatically be populated.\
Read more about capture bugs [here](/docs/test-management/bug-reporting) .

### Setting GitHub integration

This process is required only once.

1. Navigate to "**Settings**", and then to "**Integration**" tab.
2. Click "**login**" to GitHub link.
3. Click "**Install**" button.
4. Choose "**All repositories**" or select a specific repository.
5. Click "**Install**" again.

![1511](/images/other-integrations/github-integration/307ac62-gitHub2.gif "gitHub2.gif")

Define the repository to connect to and allow the desired actions.

**Create**: Whenever a branch is created in GitHub, a branch will also be created at Testim.

**Merge**: Each time GitHub branches are merged, Testim will automatically merge your tests.

### Note

1. When a branch is created in Testim, the base will always be the Master and not the branch from which created in GitHub. This can affect when branch merges.
2. Merge will be performed on pull requests action only and be merged to Master in Testim.
3. To select repositories the user should have admin access to them.
