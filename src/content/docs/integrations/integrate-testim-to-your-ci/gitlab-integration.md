---
title: GitLab 統合
description: GitLab CI/CD で Testim テストを実行する方法について説明します。YAML ファイルの設定手順とサンプルコードを提供します。
category: 統合
order: 12011
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/integrate-testim-to-your-ci/gitlab-integration.htm'
keywords:
  - GitLab
  - GitLab CI
  - CI 統合
  - CI パイプライン
  - YAML 設定
  - Testim CLI
---

![GitLab ロゴ](/images/ci-integrations/gitlab-integration/6744632-gitlab-logo-gray-rgb.png)

**YAML ファイル**\
GitLab と Testim を統合するには、YAML ファイルに以下の行を追加する必要があります:

```yaml
image: node:16.13.0
stages:
  - e2e
testim:
  stage: e2e
  image: docker:git
  variables:
    TESTIM_DOCKER: testim/docker-cli
    TESTIM_TOKEN: <TESTIM_TOKEN>
    TESTIM_PROJECT: <TESTIM_PROJECT>
    TESTIM_LABEL: <TESTIM_LABEL>
    GRID_NAME: <GRID_NAME>
  services:
    - docker:stable-dind
  script:
    - docker pull $TESTIM_DOCKER
    - docker run --rm -v "$(pwd)":/opt/testim-runner $TESTIM_DOCKER --token $TESTIM_TOKEN --project $TESTIM_PROJECT --label "$TESTIM_LABEL" --grid $GRID_NAME -r /opt/testim-runner/testim-report.xml
  artifacts:
    paths:
      - testim-report.xml
    reports:
      junit: testim-report.xml
```

:::info
グリッド名については、[こちら](/docs/integrations/grid-management)でグリッドの設定方法をご確認ください。
:::

:::info
Testim は、Node.js のすべての[LTS/サポートされているバージョン](https://github.com/nodejs/Release/blob/main/README.md)をサポートしています。
:::
