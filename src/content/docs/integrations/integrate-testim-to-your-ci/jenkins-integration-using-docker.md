---
title: Jenkins 統合 - Docker を使用
description: >-
  Jenkins で Docker コンテナを使用して Testim テストを実行する方法について説明します。Docker
  Engine のインストールとジョブ設定手順を提供します。
category: 統合
order: 12008
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/integrate-testim-to-your-ci/jenkins-integration-using-docker.htm'
keywords:
  - Jenkins
  - Docker
  - Docker コンテナ
  - コンテナ実行
  - コンテナテスト
  - CI 統合
  - CI パイプライン
  - Testim CLI
  - docker-cli
---

![Jenkins と Docker を使用する構成図](/images/ci-integrations/jenkins-integration-using-docker/d69aa0d-Jenkins1.png)

**Docker を使用することが、Testim CLI を使用するための最良の方法です。これにより、常に最新の npm パッケージと必要な node.js バージョンで最新の状態に保つことができます。**

Docker コンテナを使用して Jenkins とテストを統合するには、まず Jenkins マシンまたはそのスレーブマシンの 1 つに[docker engine](https://docs.docker.com/engine/installation/)をインストールする必要があります。

## 次の手順に従ってください

1. Jenkins で新しいアイテムを作成します:\
   ​

![Jenkins で新しいジョブを作成する画面](/images/ci-integrations/jenkins-integration-using-docker/a2e99b5-Jenkins2.PNG)

2. ジョブ名（例: "Testim Tests"）を入力し、"Freestyle project"を選択して"OK"をクリックします:

![Freestyle プロジェクトを選択してジョブを作成する画面](/images/ci-integrations/jenkins-integration-using-docker/1525473-Jenkins3.PNG)

3. "Execute Shell"ステップを追加します:

![Execute Shell ステップを追加する Jenkins の設定画面](/images/ci-integrations/jenkins-integration-using-docker/0fcc8b2-Jenkins4.PNG)

4. [CLI ページ](/docs/running-tests/the-command-line-cli)で説明されているように、適切なパラメーターを使用してコマンドを設定します。以下は、Docker ファイルをプルして使用し、CLI コマンド自体を実行するスクリプトテンプレートです:

```shell
TESTIM_DOCKER=testimio/docker-cli
TESTIM_TOKEN="<YOUR ACCESS TOKEN>"
TESTIM_PROJECT="<YOUR TESTIM PROJECT ID>"
TESTIM_LABEL="<YOUR LABEL>"
SELENIUM_GRID_NAME="<YOUR SELENIUM GRID NAME>"

echo "Pulling latest version"
docker pull ${TESTIM_DOCKER}

echo "Run testim-cli"
docker run --rm -v "${WORKSPACE}":/opt/testim-runner \
  ${TESTIM_DOCKER} \
  --token ${TESTIM_TOKEN} \
  --project "${TESTIM_PROJECT}" \
  --label "${TESTIM_LABEL}" \
  --grid ${SELENIUM_GRID_NAME} \
  -r /opt/testim-runner/testim-sanity-$BUILD_NUMBER-report.xml
echo "Testim finished"\
```

![Jenkins ジョブのビルド設定画面](/images/ci-integrations/jenkins-integration-using-docker/f0d35e2-Jenkins5.PNG)

​**注記**: グリッド名については、[こちら](/docs/integrations/grid-management)でグリッドの設定方法をご確認ください。

5. Jenkins が結果を保存、分析、表示するために、標準の JUnitXMLReporter XML ファイルを生成します。Jenkins がファイルを使用するには、"Publish JUnit test result report"タイプのポストビルドアクションを追加する必要があります:

![Jenkins で Publish JUnit test result report を追加する画面](/images/ci-integrations/jenkins-integration-using-docker/8c119e0-Jenkins6.PNG)

6. セクション 4 の"report-file"パラメーターに従って、xml ファイルの値を設定します:

![JUnit テスト結果レポートの XML ファイルパスを設定する画面](/images/ci-integrations/jenkins-integration-using-docker/d2241d4-Jenkins7.PNG)
