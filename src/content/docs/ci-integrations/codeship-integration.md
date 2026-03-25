---
title: Codeship 統合
description: Codeship で Testim テストを実行する方法について説明します。ローカルおよび外部 Selenium Grid の設定手順を提供します。
category: 統合
order: 12006
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/integrate-testim-to-your-ci/codeship-integration.htm'
keywords:
  - Codeship
  - CI 統合
  - CI パイプライン
  - Selenium Grid
  - WebDriver Manager
  - テスト自動実行
---

![Codeship ロゴ](/images/ci-integrations/codeship-integration/1328260-codeship1.png)

## プロジェクト設定

[Codeship](http://codeship.com/)と Testim を統合するには、Codeship プロジェクトの Project Settings の Test Settings に移動します:

![Codeship のプロジェクト設定画面](/images/ci-integrations/codeship-integration/4c258cb-codeship2.png)

## ローカル Selenium Grid で実行

CodeShip で現在ビルド中のアプリでテストを実行する場合は、ローカル Selenium Grid で実行する必要があります。setup commands セクションに以下の行を追加します:

```shell
nvm install <use latest version supported by Testim>
npm install -g webdriver-manager
npm install -g @testim/testim-cli
```

Test Commands セクションには、以下の行を追加します（値は適宜変更してください）:

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

![Codeship のテストコマンド設定画面](/images/ci-integrations/codeship-integration/2e37bfe-codeship3.png)

​## 外部 Selenium Grid で実行\
アプリが公開されている利用可能なサーバーにデプロイされている場合、外部 Selenium Grid でテストを実行できます。その場合、ローカル Selenium Server（webdriver-manager）は不要なので、setup commands セクションに以下の行のみを追加します:

```shell
nvm install <use latest version supported by Testim>
npm install -g @testim/testim-cli
```

​Test Commands セクションには、以下の行を追加します（値は適宜変更してください）:

```shell
testim --project "<PROJECT ID>" \
       --label "<LABEL>" \
       --grid "<Your grid name>" \
       --token "<TOKEN>"
```

**注記**: グリッド名については、[こちら](/docs/grid-management)でグリッドの設定方法をご確認ください。
