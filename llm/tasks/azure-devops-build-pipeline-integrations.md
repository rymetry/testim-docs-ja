# 翻訳タスク (azure-devops-build-pipeline-integrations)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

![](/images/ci-integrations/azure-devops-build-pipeline-integrations/5ac760e-Azure-Pipelines.png "Azure-Pipelines.png")

In order to integrate Testim with [Azure pipelines](https://azure.microsoft.com/en-us/services/devops/pipelines/), you need to add these lines to your YAML file:

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

**Note**:  For the grid name, read [here](/docs/grid-management/grid-management) how to set up your grid.
