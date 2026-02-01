---
title: 'Azure DevOpsビルドパイプライン統合'
description: 'Azure PipelinesでTestimテストを実行する方法について説明します。YAMLファイルの設定手順とサンプルコードを提供します。'
category: '統合'
order: 12003
updated: '2025-02-10'
sourceUrl: 'https://help.testim.io/docs/azure-devops-build-pipeline-integrations'
keywords:
  - Azure DevOps
  - Azure Pipelines
  - CI統合
  - CIパイプライン
  - YAML設定
  - YAMLテンプレート
  - ビルドパイプライン
  - パイプラインタスク
  - テスト自動実行
---

![Azure Pipelinesロゴ](/images/ci-integrations/azure-devops-build-pipeline-integrations/5ac760e-Azure-Pipelines.png)

[Azure pipelines](https://azure.microsoft.com/en-us/services/devops/pipelines/)とTestimを統合するには、YAMLファイルに以下の行を追加する必要があります:

```yaml
steps:
- task: NodeTool@0
  inputs:
    versionSpec: '10.x'
  displayName: 'Install Node.js'

- script: |
    npm install -g @testim/testim-cli
    testim --label "<LABEL>" \
    --token "<TOKEN>" \
    --project "<PROJECT ID>" \
    --grid "<Your grid name>" \
    --report-file testim-tests-report.xml
  displayName: 'npm install testim-cli and run tests'

- task: PublishTestResults@2
  displayName: 'publish testim test results'
  inputs:
    testResultsFormat: 'JUnit'
    testResultsFiles: '**/testim-tests-report.xml'
```

**注記**: グリッド名については、[こちら](/docs/grid-management)でグリッドの設定方法をご確認ください。
