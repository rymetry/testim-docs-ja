---
title: 'Jenkins統合 - Dockerを使用'
description: 'JenkinsでDockerコンテナを使用してTestimテストを実行する方法について説明します。Docker Engineのインストールとジョブ設定手順を提供します。'
category: 'CI統合'
order: 11
updated: '2025-02-10'
keywords:
  - testim
  - jenkins
  - docker
  - ci統合
  - testim-cli
---

![](/images/ci-integrations/jenkins-integration-using-docker/d69aa0d-Jenkins1.png)

**Dockerを使用することが、Testim CLIを使用するための最良の方法です。これにより、常に最新のnpmパッケージと必要なnode.jsバージョンで最新の状態に保つことができます。**

Dockerコンテナを使用してJenkinsとテストを統合するには、まずJenkinsマシンまたはそのスレーブマシンの1つに[docker engine](https://docs.docker.com/engine/installation/)をインストールする必要があります。

## 次の手順に従ってください

1. Jenkinsで新しいアイテムを作成します:\
   ​

![](/images/ci-integrations/jenkins-integration-using-docker/a2e99b5-Jenkins2.PNG)

2. ジョブ名(例: "Testim Tests")を入力し、"Freestyle project"を選択して"OK"をクリックします:

![](/images/ci-integrations/jenkins-integration-using-docker/1525473-Jenkins3.PNG)

3. "Execute Shell"ステップを追加します:

![](/images/ci-integrations/jenkins-integration-using-docker/0fcc8b2-Jenkins4.PNG)

4. CLIページで説明されているように、適切なパラメータを使用してコマンドを設定します。以下は、Dockerファイルをプルして使用し、CLIコマンド自体を実行するスクリプトテンプレートです:

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

![](/images/ci-integrations/jenkins-integration-using-docker/f0d35e2-Jenkins5.PNG)

​**注記**: グリッド名については、[こちら](/docs/grid-management/grid-management)でグリッドの設定方法をご確認ください。

5. Jenkinsが結果を保存、分析、表示するために、標準のJUnitXMLReporter XMLファイルを生成します。Jenkinsがファイルを使用するには、"Publish JUnit test result report"タイプのポストビルドアクションを追加する必要があります:

![](/images/ci-integrations/jenkins-integration-using-docker/8c119e0-Jenkins6.PNG)

6. セクション4の"report-file"パラメータに従って、xmlファイルの値を設定します:

![](/images/ci-integrations/jenkins-integration-using-docker/d2241d4-Jenkins7.PNG)

​

​
