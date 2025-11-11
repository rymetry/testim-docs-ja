---
title: 'Azure DevOpsビルドパイプライン統合'
description: 'Azure PipelinesでTestimテストを実行する方法について説明します。YAMLファイルの設定手順とサンプルコードを提供します。'
category: 'CI統合'
order: 3
updated: '2025-02-10'
keywords:
  - testim
  - azure-devops
  - azure-pipelines
  - ci統合
  - yaml設定
---

![](/images/ci-integrations/azure-devops-build-pipeline-integrations/5ac760e-Azure-Pipelines.png "Azure-Pipelines.png")

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

**注記**: グリッド名については、[こちら](/docs/grid-management/grid-management)でグリッドの設定方法をご確認ください。
