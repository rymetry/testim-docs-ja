---
title: Circle CI 統合
description: >-
  Circle CI のローカル Selenium
  Grid で Testim テストを実行する方法について説明します。YAML ファイルの設定手順とサンプルコードを提供します。
category: 統合
order: 12005
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/integrate-testim-to-your-ci/circle-ci-integration.htm'
keywords:
  - CircleCI
  - Circle CI
  - CI 統合
  - CI パイプライン
  - Selenium Grid
  - ローカル Selenium Grid
  - YAML 設定
  - テスト自動実行
---

![CircleCI ロゴ](/images/ci-integrations/circle-ci-integration/3eecb4e-circleci.png)

#### YAML File

[Circle CI](https://circleci.com/)のローカル Selenium Grid を使用して Testim と統合するには、circle.yaml ファイルに以下の行を追加する必要があります:

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

**注記**: グリッド名については、[こちら](/docs/integrations/grid-management)でグリッドの設定方法をご確認ください。
