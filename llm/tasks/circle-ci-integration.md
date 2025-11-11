# 翻訳タスク (circle-ci-integration)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

![368](/images/ci-integrations/circle-ci-integration/3eecb4e-circleci.png "circleci.png")

#### YAML File

In order to integrate Testim with [Circle CI](https://circleci.com/), using Circle CI's local Selenium Grid, you need to add these lines to your circle.yaml file:

**YAML**

```yaml
version: 2
jobs:
  build:
    environment:
      CIRCLE_TEST_REPORTS: /tmp/circleci-test-results
    docker:
    - image: testim/docker-cli
    steps:
      - run: mkdir -p $CIRCLE_TEST_REPORTS/testim/
      - run: testim --project "<PROJECT ID>" --label "<LABEL>" --grid "<Your grid name>" --token "<TOKEN>" --report-file $CIRCLE_TEST_REPORTS/testim/results.xml
      - store_artifacts:
          path: /tmp/circleci-test-results
      - store_test_results:
          path: /tmp/circleci-test-results
```

**Note**: For the grid name, read [here](https://help.testim.io/docs/grid-management) how to set up your grid.
