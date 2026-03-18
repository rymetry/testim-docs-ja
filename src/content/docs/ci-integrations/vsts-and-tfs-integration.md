---
title: VSTS / TFS 統合
description: >-
  Visual Studio Team Services（VSTS）および Team Foundation
  Server（TFS）で Testim テストを実行する方法について説明します。Docker タスクの設定手順を提供します。
category: 統合
order: 12010
updated: '2025-02-10'
sourceUrl: 'https://help.testim.io/docs/vsts-and-tfs-integration'
keywords:
  - VSTS
  - TFS
  - Azure DevOps
  - Visual Studio
  - Visual Studio Team Services
  - CI 統合
  - CI パイプライン
  - ビルドパイプライン
  - Docker
  - Docker タスク
---

​

![VSTS と TFS のロゴ](/images/ci-integrations/vsts-and-tfs-integration/d30e448-tfs1.png)

​VSTS/TFS とテストを統合するには、まず VSTS/TFS エージェントに Docker がインストールされている必要があります。

### 次の手順に従ってください

1. Build ページに移動します

![VSTS ビルドページの画面](/images/ci-integrations/vsts-and-tfs-integration/e8e8d07-tfs2.png)

​2. 新しいビルドを作成します

![新しいビルド定義を作成する VSTS の画面](/images/ci-integrations/vsts-and-tfs-integration/c4affba-tfs3.png)

​3. リポジトリを選択します

![リポジトリを選択する VSTS の画面](/images/ci-integrations/vsts-and-tfs-integration/3f92a44-tfs4.png)

4. 空のジョブを選択します

![空のジョブを選択する VSTS の画面](/images/ci-integrations/vsts-and-tfs-integration/a3f06a9-tfs5.png)

5. タスクを追加します

![VSTS でタスクを追加する画面](/images/ci-integrations/vsts-and-tfs-integration/6175fc6-tfs6.png)

6. Docker タスクを追加します

![VSTS で Docker タスクを追加する画面](/images/ci-integrations/vsts-and-tfs-integration/c4e0e7a-tfs7.png)

7. Action: Run a Docker command を選択します

![VSTS のタスク設定で Action として Run a Docker command を選択する画面](/images/ci-integrations/vsts-and-tfs-integration/93a38c4-tfs8.png)

8. [CLI ページ](/docs/the-command-line-cli)で説明されているように、適切なパラメーターを使用して Command を設定します。以下は基本的なコマンドテンプレートです。

```shell
run --rm -v $(Build.BinariesDirectory):/opt/testim-runner testim/docker-cli --token <TOKEN> --project <PROJECT-ID> --grid <GRID-NAME> --report-file /opt/testim-runner/testim-sanity-$(Build.BuildId)-report.xml
```

![VSTS で Docker コマンドに Testim 用のパラメーターを設定する画面](/images/ci-integrations/vsts-and-tfs-integration/76b5b0e-tfs9.png)

​ **注記**: グリッド名については、[こちら](/docs/grid-management)でグリッドの設定方法をご確認ください。

9. VSTS/TFS が結果を保存、分析、表示するために、標準の JUnitXMLReporter XML ファイルを生成します。\
   VSTS/TFS がファイルを使用するには、Publish Test Results タスクを追加する必要があります

![VSTS の Publish Test Results タスクを追加する画面](/images/ci-integrations/vsts-and-tfs-integration/a99d051-tfs10.png)

10. Test result format: JUnit を選択します

![VSTS の Publish Test Results タスクで Test result format に JUnit を選択する画面](/images/ci-integrations/vsts-and-tfs-integration/c8ae6c1-tfs11.png)

11. セクション 8 の"report-file"パラメーターに従って、Test results files の値を設定します

![VSTS の Publish Test Results タスクで Test results files のパスを設定する画面](/images/ci-integrations/vsts-and-tfs-integration/83f530c-tfs12.png)

12. Search folder を**$(Build.BinariesDirectory)**に設定します

![VSTS の Publish Test Results タスクで Search folder に$（Build.BinariesDirectory）を指定する画面](/images/ci-integrations/vsts-and-tfs-integration/254a96d-tfs13.png)

13. ビルド設定を保存します

![VSTS でビルド定義を保存する画面](/images/ci-integrations/vsts-and-tfs-integration/5d80b20-tfs14.png)

​

​\
​
