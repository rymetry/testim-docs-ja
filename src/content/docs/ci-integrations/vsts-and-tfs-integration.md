---
title: 'VSTS / TFS統合'
description: 'Visual Studio Team Services(VSTS)およびTeam Foundation Server(TFS)でTestimテストを実行する方法について説明します。Dockerタスクの設定手順を提供します。'
category: 'CI統合'
order: 13
updated: '2025-02-10'
keywords:
  - testim
  - vsts
  - tfs
  - visual-studio
  - ci統合
  - docker
---

​

![404](/images/ci-integrations/vsts-and-tfs-integration/d30e448-tfs1.png)

​VSTS/TFSとテストを統合するには、まずVSTS/TFSエージェントにDockerがインストールされている必要があります。

### 次の手順に従ってください

1. Buildページに移動します

![600](/images/ci-integrations/vsts-and-tfs-integration/e8e8d07-tfs2.png)

​2. 新しいビルドを作成します

![591](/images/ci-integrations/vsts-and-tfs-integration/c4affba-tfs3.png)

​3. リポジトリを選択します

![961](/images/ci-integrations/vsts-and-tfs-integration/3f92a44-tfs4.png)

4. 空のジョブを選択します

![961](/images/ci-integrations/vsts-and-tfs-integration/a3f06a9-tfs5.png)

5. タスクを追加します

![429](/images/ci-integrations/vsts-and-tfs-integration/6175fc6-tfs6.png)

6. Dockerタスクを追加します

![758](/images/ci-integrations/vsts-and-tfs-integration/c4e0e7a-tfs7.png)

7. Action: Run a Docker commandを選択します

![759](/images/ci-integrations/vsts-and-tfs-integration/93a38c4-tfs8.png)

8. [CLIページ](/docs/running-tests/the-command-line-cli)で説明されているように、適切なパラメータを使用してCommandを設定します。以下は基本的なコマンドテンプレートです。

```shell
run --rm -v $(Build.BinariesDirectory):/opt/testim-runner testim/docker-cli --token <TOKEN> --project <PROJECT-ID> --grid <GRID-NAME> --report-file /opt/testim-runner/testim-sanity-$(Build.BuildId)-report.xml
```

![708](/images/ci-integrations/vsts-and-tfs-integration/76b5b0e-tfs9.png)

​ **注記**: グリッド名については、[こちら](/docs/grid-management/grid-management)でグリッドの設定方法をご確認ください。

9. VSTS/TFSが結果を保存、分析、表示するために、標準のJUnitXMLReporter XMLファイルを生成します。\
   VSTS/TFSがファイルを使用するには、Publish Test Resultsタスクを追加する必要があります

![753](/images/ci-integrations/vsts-and-tfs-integration/a99d051-tfs10.png)

10. Test result format: JUnitを選択します

![659](/images/ci-integrations/vsts-and-tfs-integration/c8ae6c1-tfs11.png)

11. セクション8の"report-file"パラメータに従って、Test results filesの値を設定します

![654](/images/ci-integrations/vsts-and-tfs-integration/83f530c-tfs12.png)

12. Search folderを**$(Build.BinariesDirectory)**に設定します

![654](/images/ci-integrations/vsts-and-tfs-integration/254a96d-tfs13.png)

13. ビルド設定を保存します

![221](/images/ci-integrations/vsts-and-tfs-integration/5d80b20-tfs14.png)

​

​\
​
