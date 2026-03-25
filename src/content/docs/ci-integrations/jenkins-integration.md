---
title: Jenkins 統合
description: Jenkins で Testim テストを実行する方法について説明します。Linux と Windows 環境でのビルドステップ設定手順を提供します。
category: 統合
order: 12007
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/integrate-testim-to-your-ci/jenkins-integration.htm'
keywords:
  - Jenkins
  - CI 統合
  - Jenkins パイプライン
  - フリースタイルジョブ
  - ビルドジョブ
  - Linux ビルド
  - Windows ビルド
  - Testim CLI
  - Node.js
---

![Jenkins ロゴ](/images/ci-integrations/jenkins-integration/74d3ef8-tCyedoSJRGO8AAGv6sqs_jenkins-logo.png)

Jenkins とテストを統合するには、まず\
Jenkins マシンまたはそのワーカーマシンの 1 つに node.js（Node.js の LTS/サポートされているバージョンのいずれか）がインストールされている必要があります。

## 次の手順に従ってください

1. Jenkins で新しいアイテムを作成します:

![Jenkins で新しいジョブを作成する画面](/images/ci-integrations/jenkins-integration/56a9e41-96INjt2YRViRwuogwLgW_jenkins_new_item.PNG)

2. ジョブ名（例: "Testim Tests"）を入力し、"Freestyle project"を選択して"OK"をクリックします:

![Jenkins の Freestyle プロジェクト作成画面](/images/ci-integrations/jenkins-integration/ba919cf-QCXXOsSWT4uYJqaRhEHR_jenkins_freestyle_job.PNG)

3. 実行ステップを追加します

### Linux

3. "Execute Shell"ステップを追加します:

![Jenkins で Execute Shell ビルドステップを追加する画面](/images/ci-integrations/jenkins-integration/5253260-ms0qPoJ5RymCKMlPFKTp_jenkins_execute_shell.PNG)

4. [CLI ページ](/docs/the-command-line-cli)で説明されているように、適切なパラメーターを使用してコマンドを設定します。\
   以下は、最新の npm パッケージがあることを確認する最初の部分と、CLI コマンド自体を含む基本的なスクリプトテンプレートです（sudo は不要）

```shell
mkdir -p "${WORKSPACE}/.npm-packages"
prefix=${WORKSPACE}/.npm-packages
NPM_PACKAGES="${WORKSPACE}/.npm-packages"
export PATH="$PATH:$NPM_PACKAGES/bin"
export NODE_PATH="$NODE_PATH:$NPM_PACKAGES/lib/node_modules"
npm config set prefix ${WORKSPACE}/.npm-packages
npm install -g @testim/testim-cli

testim --label "<YOUR LABEL>" \
--token "<YOUR ACCESS TOKEN>" \
--project "<YOUR PROJECT ID>" \
--grid "<Your grid name>"  \
--report-file test-results/testim-tests-$BUILD_NUMBER-report.xml
```

<Image title="File1488700845402.png" alt={899} align="center" src="/images/ci-integrations/jenkins-integration/ff81d47-File1488700845402.png">
  Jenkins Execute Shell Command
</Image>

**注記:** グリッド名については、[こちら](/docs/grid-management)でグリッドの設定方法をご確認ください。

### Windows

3. "Execute Windows batch command"ステップを追加します:

![Jenkins で Execute Windows batch command ステップを追加する画面](/images/ci-integrations/jenkins-integration/20a3651-File1488700749415.png)

4. [CLI ページ](/docs/the-command-line-cli)で説明されているように、適切なパラメーターを使用してコマンドを設定します。\
   以下は、最新の npm パッケージがあることを確認する最初の部分と、CLI コマンド自体を含む基本的なスクリプトテンプレートです:

```shell Batch
npm install -g @testim/testim-cli

testim --label "<YOUR LABEL>" ^
--token "<YOUR ACCESS TOKEN>" ^
--project "<YOUR PROJECT ID>" ^
--grid "<Your grid name>"  ^
--report-file test-results/testim-tests-$BUILD_NUMBER-report.xml
```

<Image title="jenkins.png" alt={1402} align="center" src="/images/ci-integrations/jenkins-integration/05fb4d0-jenkins.png">
  Jenkins Execute Windows Batch Command
</Image>

\--

5. Jenkins が結果を保存、分析、表示するために、標準の JUnitXMLReporter XML ファイルを生成します。Jenkins がファイルを使用するには、"Publish JUnit test result report"タイプのポストビルドアクションを追加する必要があります:

![Publish JUnit test result report ポストビルドアクションを追加する画面](/images/ci-integrations/jenkins-integration/0d9aac5-0h9FTPrwROu7qb7ae7hC_jenkins_post_build_action.PNG)

5. セクション 4 の"report-file"パラメーターに従って、xml ファイルの値を設定します:

![JUnit テスト結果の XML ファイルパスを設定する画面](/images/ci-integrations/jenkins-integration/3a10b08-AP4V4UjQj6mBgoCdhmoQ_jenkins_post_build_action_details.PNG)
