---
title: Circle CI統合
description: >-
  Circle CIのローカルSelenium
  GridでTestimテストを実行する方法について説明します。YAMLファイルの設定手順とサンプルコードを提供します。
category: 統合
order: 12005
updated: '2025-02-10'
sourceUrl: 'https://help.testim.io/docs/circle-ci-integration'
keywords:
  - CircleCI
  - Circle CI
  - CI統合
  - CIパイプライン
  - Selenium Grid
  - ローカルSelenium Grid
  - YAML設定
  - テスト自動実行
---

![CircleCIロゴ](/images/ci-integrations/circle-ci-integration/3eecb4e-circleci.png)

### YAMLファイル

[Circle CI](https://circleci.com/)のローカルSelenium Gridを使用してTestimと統合するには、circle.yamlファイルに以下の行を追加する必要があります:

#### YAML

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

**注記**: グリッド名については、[こちら](/docs/grid-management)でグリッドの設定方法をご確認ください。
