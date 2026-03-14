---
title: Jenkins統合
description: JenkinsでTestimテストを実行する方法について説明します。LinuxとWindows環境でのビルドステップ設定手順を提供します。
category: 統合
order: 12007
updated: '2025-02-10'
sourceUrl: 'https://help.testim.io/docs/jenkins-integration'
keywords:
  - Jenkins
  - CI統合
  - Jenkinsパイプライン
  - フリースタイルジョブ
  - ビルドジョブ
  - Linuxビルド
  - Windowsビルド
  - Testim CLI
  - Node.js
---

![Jenkinsロゴ](/images/ci-integrations/jenkins-integration/74d3ef8-tCyedoSJRGO8AAGv6sqs_jenkins-logo.png)

Jenkinsとテストを統合するには、まず\
Jenkinsマシンまたはそのワーカーマシンの1つにnode.js(Node.jsのLTS/サポートされているバージョンのいずれか)がインストールされている必要があります。

## 次の手順に従ってください

1. Jenkinsで新しいアイテムを作成します:

![Jenkinsで新しいジョブを作成する画面](/images/ci-integrations/jenkins-integration/56a9e41-96INjt2YRViRwuogwLgW_jenkins_new_item.PNG)

2. ジョブ名(例: "Testim Tests")を入力し、"Freestyle project"を選択して"OK"をクリックします:

![JenkinsのFreestyleプロジェクト作成画面](/images/ci-integrations/jenkins-integration/ba919cf-QCXXOsSWT4uYJqaRhEHR_jenkins_freestyle_job.PNG)

3. 実行ステップを追加します

### Linux

3. "Execute Shell"ステップを追加します:

![JenkinsでExecute Shellビルドステップを追加する画面](/images/ci-integrations/jenkins-integration/5253260-ms0qPoJ5RymCKMlPFKTp_jenkins_execute_shell.PNG)

4. [CLIページ](/docs/the-command-line-cli)で説明されているように、適切なパラメータを使用してコマンドを設定します。\
   以下は、最新のnpmパッケージがあることを確認する最初の部分と、CLIコマンド自体を含む基本的なスクリプトテンプレートです(sudoは不要)

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

![JenkinsでExecute Windows batch commandステップを追加する画面](/images/ci-integrations/jenkins-integration/20a3651-File1488700749415.png)

4. [CLIページ](/docs/the-command-line-cli)で説明されているように、適切なパラメータを使用してコマンドを設定します。\
   以下は、最新のnpmパッケージがあることを確認する最初の部分と、CLIコマンド自体を含む基本的なスクリプトテンプレートです:

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

5. Jenkinsが結果を保存、分析、表示するために、標準のJUnitXMLReporter XMLファイルを生成します。Jenkinsがファイルを使用するには、"Publish JUnit test result report"タイプのポストビルドアクションを追加する必要があります:

![Publish JUnit test result reportポストビルドアクションを追加する画面](/images/ci-integrations/jenkins-integration/0d9aac5-0h9FTPrwROu7qb7ae7hC_jenkins_post_build_action.PNG)

5. セクション4の"report-file"パラメータに従って、xmlファイルの値を設定します:

![JUnitテスト結果のXMLファイルパスを設定する画面](/images/ci-integrations/jenkins-integration/3a10b08-AP4V4UjQj6mBgoCdhmoQ_jenkins_post_build_action_details.PNG)
