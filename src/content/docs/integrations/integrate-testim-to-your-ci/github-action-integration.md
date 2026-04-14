---
title: GitHub Actions 統合
description: GitHub Actions で Testim テストを実行する方法について説明します。ワークフロー作成手順と YAML ファイルのサンプルコードを提供します。
category: 統合
order: 12012
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/integrate-testim-to-your-ci/github-action-integration.htm'
keywords:
  - GitHub Actions
  - GitHub Action
  - GitHub
  - CI 統合
  - CI パイプライン
  - ワークフロー
  - YAML 設定
---

![GitHub Actions の継続的デプロイ図](/images/ci-integrations/github-action-integration/28e7267-Continuous-Deployment-con-GitHub-Actions.png)

Testim と GitHub Actions を統合するには、新しい GitHub-Action ワークフローを作成する必要があります。以下の手順に従ってください: [https://docs.github.com/en/actions/quickstart](https://docs.github.com/en/actions/quickstart)

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

:::note
機密データ（プロジェクトトークンなど）を扱うベストプラクティスは、[encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)を使用することです。
:::
