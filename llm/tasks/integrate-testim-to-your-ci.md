# 翻訳タスク (integrate-testim-to-your-ci)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

## How it works

In order to integrate your tests with your CI, we built our [Testim CLI](/docs/running-tests/the-command-line-cli). It is easily installed using npm, and using it you can integrate it to all the major CI's out there that can run a simple shell command.

## See all your test suites runs

Easily track which builds passed or failed and open the relevant test result with one click to better understand why it failed.\
We also added charts to give you overall look at your test results history, which you can also filter according to the relevant time-span:

![](/images/ci-integrations/integrate-testim-to-your-ci/eac37a2-Screen_Shot_2021-02-21_at_10.21.49.png "Screen Shot 2021-02-21 at 10.21.49.png")

## Start now

1. Go to Settings --> CLI --> CI
2. Select the CI platform from the dropdown list
3. Copy the command generated

![](/images/ci-integrations/integrate-testim-to-your-ci/78fd262-Feb-21-2021_10-25-31.gif "Feb-21-2021 10-25-31.gif")

**See our list of guides about integration to a specific CI:**

- [Azure Pipeline Integration](/docs/ci-integrations/azure-devops-build-pipeline-integrations)
- [Bamboo integration](/docs/ci-integrations/bamboo-integration)
- [Circle CI integration](/docs/ci-integrations/circle-ci-integration)
- [Codeship integration](/docs/ci-integrations/codeship-integration)
- [Jenkins Integration](/docs/ci-integrations/jenkins-integration)
- [Jenkins Integration - Using Docker](/docs/ci-integrations/jenkins-integration-using-docker)
- [TeamCity Integration](/docs/ci-integrations/teamcity-integration)
- [Visual Studio integration](/docs/ci-integrations/vsts-and-tfs-integration)
- [GitLab integration](/docs/ci-integrations/gitlab-integration)
