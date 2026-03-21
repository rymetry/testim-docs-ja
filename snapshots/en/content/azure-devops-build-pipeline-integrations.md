# Azure Pipelines Integration

![](https://files.readme.io/5ac760e-Azure-Pipelines.png "Azure-Pipelines.png")

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

**Note**:  For the grid name, read [here](https://help.testim.io/docs/grid-management) how to set up your grid.