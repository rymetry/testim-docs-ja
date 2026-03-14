---
title: GitHub Actions統合
description: GitHub ActionsでTestimテストを実行する方法について説明します。ワークフロー作成手順とYAMLファイルのサンプルコードを提供します。
category: 統合
order: 12012
updated: '2025-02-10'
sourceUrl: 'https://help.testim.io/docs/github-action-integration'
keywords:
  - GitHub Actions
  - GitHub Action
  - GitHub
  - CI統合
  - CIパイプライン
  - ワークフロー
  - YAML設定
---

![GitHub Actionsの継続的デプロイ図](/images/ci-integrations/github-action-integration/28e7267-Continuous-Deployment-con-GitHub-Actions.png)

TestimとGitHub Actionsを統合するには、新しいGitHub-Actionワークフローを作成する必要があります:

以下の手順に従ってください: [https://docs.github.com/en/actions/quickstart](https://docs.github.com/en/actions/quickstart)

### YAMLファイル

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
> 機密データ(プロジェクトトークンなど)を扱うベストプラクティスは、[暗号化されたシークレット](https://docs.github.com/en/actions/security-guides/encrypted-secrets)を使用することです
