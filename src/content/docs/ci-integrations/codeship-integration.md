---
title: 'Codeship統合'
description: 'CodeshipでTestimテストを実行する方法について説明します。ローカルおよび外部Selenium Gridの設定手順を提供します。'
category: 'CI統合'
order: 10
updated: '2025-02-10'
sourceUrl: 'https://help.testim.io/docs/codeship-integration'
keywords:
  - Codeship
  - CI統合
  - CIパイプライン
  - Selenium Grid
  - WebDriver Manager
  - テスト自動実行
---

![Codeshipロゴ](/images/ci-integrations/codeship-integration/1328260-codeship1.png)

## プロジェクト設定

[Codeship](http://codeship.com/)とTestimを統合するには、CodeshipプロジェクトのProject SettingsのTest Settingsに移動します:

![Codeshipのプロジェクト設定画面](/images/ci-integrations/codeship-integration/4c258cb-codeship2.png)

## ローカルSelenium Gridで実行

CodeShipで現在ビルド中のアプリでテストを実行する場合は、ローカルSelenium Gridで実行する必要があります。setup commandsセクションに以下の行を追加します:

```shell
nvm install <use latest version supported by Testim>
npm install -g webdriver-manager
npm install -g @testim/testim-cli
```

Test Commandsセクションには、以下の行を追加します(値は適宜変更してください):

```shell
webdriver-manager update
nohup bash -c "webdriver-manager start 2>&1 &" sleep 5
testim --project "<PROJECT ID>" \
       --label "<LABEL>" \
       --grid "<Your grid name>" \
       --base-url "<YOUR LOCAL WEB APP URL, e.g. http://localhost:3000>"
       --token "<TOKEN>"
​
```

![Codeshipのテストコマンド設定画面](/images/ci-integrations/codeship-integration/2e37bfe-codeship3.png)

​## 外部Selenium Gridで実行\
アプリが公開されている利用可能なサーバーにデプロイされている場合、外部Selenium Gridでテストを実行できます。その場合、ローカルSelenium Server(webdriver-manager)は不要なので、setup commandsセクションに以下の行のみを追加します:

```shell
nvm install <use latest version supported by Testim>
npm install -g @testim/testim-cli
```

​Test Commandsセクションには、以下の行を追加します(値は適宜変更してください):

```shell
testim --project "<PROJECT ID>" \
       --label "<LABEL>" \
       --grid "<Your grid name>" \
       --token "<TOKEN>"
```

**注記**: グリッド名については、[こちら](/docs/grid-management)でグリッドの設定方法をご確認ください。
