# 翻訳タスク (gitlab-integration)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

![](/images/ci-integrations/gitlab-integration/6744632-gitlab-logo-gray-rgb.png "gitlab-logo-gray-rgb.png")

**YAML File**\
In order to integrate Testim with GitLab, you need to add these lines to your YAML file:

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

> 📘
>
> For the grid name, [read here](/docs/grid-management/grid-management) how to set up your grid.

> 📘
>
> Testim supports all [LTS/supported versions](https://github.com/nodejs/Release/blob/main/README.md) of Node.js.
