---
title: 'GitLab統合'
description: 'GitLab CI/CDでTestimテストを実行する方法について説明します。YAMLファイルの設定手順とサンプルコードを提供します。'
category: 'CI統合'
order: 6
updated: '2025-02-10'
sourceUrl: 'https://help.testim.io/docs/gitlab-integration'
keywords:
  - GitLab
  - GitLab CI
  - CI統合
  - CIパイプライン
  - YAML設定
  - Testim CLI
---

![GitLabロゴ](/images/ci-integrations/gitlab-integration/6744632-gitlab-logo-gray-rgb.png)

**YAMLファイル**\
GitLabとTestimを統合するには、YAMLファイルに以下の行を追加する必要があります:

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

> 📘 グリッド名については、[こちら](/docs/grid-management)でグリッドの設定方法をご確認ください。
> 📘 Testimは、Node.jsのすべての[LTS/サポートされているバージョン](https://github.com/nodejs/Release/blob/main/README.md)をサポートしています。
