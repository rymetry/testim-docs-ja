---
title: 'Bamboo統合'
description: 'BambooでTestimテストを実行する方法について説明します。プラン作成、Testim CLIのインストール、実行タスクの設定手順を提供します。'
category: 'CI統合'
order: 15
updated: '2025-02-10'
keywords:
  - testim
  - bamboo
  - ci統合
  - testim-cli
  - nodejs
---

![780](/images/ci-integrations/bamboo-integration/1c8410c-Bamboo0.png "Bamboo0.png")

Bambooとテストを統合するには、まずBambooサーバーまたはそのエージェントマシンの1つにNode.js(バージョン >= 6.0.0)がインストールされている必要があります。

## 次の手順に従ってください

### 1. Bambooで新しいプランを作成します

![661](/images/ci-integrations/bamboo-integration/0faedb6-Bamboo2.png "Bamboo2.png")

1.1. プラン名(例: "Testim Tests")を入力し、リポジトリホストで"None"を選択して"Configurate plan"をクリックします:

![1016](/images/ci-integrations/bamboo-integration/fa42a83-Bamboo3.png "Bamboo3.png")

 1.2. "Enable this plan?"セクションの下の"Yes please!"チェックボックスを選択します:

![643](/images/ci-integrations/bamboo-integration/73d02b0-Bamboo4.png "Bamboo4.png")

### 2. Testim CLIインストールタスクを追加します

​\
2.1. "Add task"をクリックします:\
2.2. "npm"タスクを選択します:

![903](/images/ci-integrations/bamboo-integration/71b903a-Bamboo5.png "Bamboo5.png")

2.3. タスクの説明を入力します(例: "Install Testim CLI")\
2.4. 既存のNode.Js実行可能ファイルを選択するか、Node.Jsパスを使用して新しいものを追加します

![552](/images/ci-integrations/bamboo-integration/2348387-Bamboo6.png "Bamboo6.png")

2.5. Commandを挿入します:

```javascript
install -g @testim/testim-cli
```

  2.6. "Save"をクリックします:

![611](/images/ci-integrations/bamboo-integration/663eab3-Bamboo7.png "Bamboo7.png")

### 3. Testim CLI実行タスクを追加します

​\
3.1. "Add task"をクリックします:\
3.2. "Command"タスクを選択します:

![879](/images/ci-integrations/bamboo-integration/e6c0d23-Bamboo8.png "​Bamboo8.png")

3.3. タスクの説明を入力します(例: "Run Testim CLI")\
3.4. 既存の"Testim CLI"実行可能ファイルを選択するか、新しい"Testim CLI"実行可能ファイルを追加します:

![555](/images/ci-integrations/bamboo-integration/5d5f0ba-Bamboo9.png "​Bamboo9.png")

3.5. 引数を挿入します:

```shell
--label "<YOUR LABEL>" --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>"  --grid "<Your grid name>" --report-file ${bamboo.build.working.directory}/testim-tests-${bamboo.buildNumber}-report.xml
```

**注記**: グリッド名については、[こちら](/docs/grid-management/grid-management)でグリッドの設定方法をご確認ください。

3.6. "Save"をクリックします:

![620](/images/ci-integrations/bamboo-integration/9ae3664-Bamboo10.png "​Bamboo10.png")

### 4. テスト結果収集タスクを追加します

4.1. "Add task"をクリックします:\
4.2. "JUnit Parser"タスクを選択します:

![885](/images/ci-integrations/bamboo-integration/7736c24-Bamboo11.png "​Bamboo11.png")

4.3. タスクの説明を入力します(例: "Collect Testim Results")\
4.4. "Specify custom results directories"を挿入します:

```shell
**/testim-tests-*-report.xml
```

4.5. "Save"をクリックします:

![607](/images/ci-integrations/bamboo-integration/88541f8-Bamboo12.png "​Bamboo12.png")

### 5. "Create"をクリックします​

![1006](/images/ci-integrations/bamboo-integration/8e543c5-Bamboo13.png "​Bamboo13.png")

![1304](/images/ci-integrations/bamboo-integration/f4235cf-Bamboo14.png "​Bamboo14.png")

### 6. プランを実行します

6.1. Runボタンをクリックします

![451](/images/ci-integrations/bamboo-integration/cde9d6d-Bamboo15.png "Bamboo15.png")

6.2. プランが完了するまで待ちます\
6.2. テスト結果を確認します

![488](/images/ci-integrations/bamboo-integration/6f346c1-Bamboo16.png "Bamboo16.png")
