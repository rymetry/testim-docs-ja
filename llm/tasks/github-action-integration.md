# 翻訳タスク (github-action-integration)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

![](/images/ci-integrations/github-action-integration/28e7267-Continuous-Deployment-con-GitHub-Actions.png "Continuous-Deployment-con-GitHub-Actions.png")

In order to integrate Testim with GitHub Actions, you need to create a new GitHub-Action workflow:

Follow these instructions: [https://docs.github.com/en/actions/quickstart](https://docs.github.com/en/actions/quickstart)

**YAML File**

```yaml
name: Testim E2E
on: [push]

jobs:
    run-testimio-cli:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v2
            - uses: actions/setup-node@v2
              with:
                node-version: '18.17.0'
            - run: npm install -g @testim/testim-cli
            - run: testim --token <TESTIM_TOKEN> --project <PROJECT_ID> --grid <GRID_NAME>
```

> 📘
>
> Best practice to work with sensitive data (e.g project token) is to use [encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
