---
title: TeamCity 統合
description: TeamCity で Testim テストを実行する方法について説明します。ビルドステップの設定手順とスクリプトテンプレートを提供します。
category: 統合
order: 12009
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/integrate-testim-to-your-ci/teamcity-integration.htm'
keywords:
  - TeamCity
  - CI 統合
  - ビルドステップ
  - ビルドパイプライン
  - CI パイプライン
  - ビルドエージェント
  - Node.js
  - Testim CLI
  - Testim テスト
---

![TeamCity ロゴ](/images/ci-integrations/teamcity-integration/6a3c92e-4pro3hwiQxCVNwY6QQXg_teamcity-logo.png)

TeamCity とテストを統合するには、まず TeamCity マシンまたはそのスレーブマシンの 1 つに node.js（12.13+、14.15+、16.13+）がインストールされている必要があります。

## 次の手順に従ってください

1. プロジェクトに新しいビルドステップを作成します:

![TeamCity で新しいビルドステップを追加する画面](/images/ci-integrations/teamcity-integration/6bdc599-irViLY05QOSHdya5bXqR_06-add-build-step.png)

2. "Command Line"ランナータイプを選択します:

![Command Line ランナータイプを選択する TeamCity の画面](/images/ci-integrations/teamcity-integration/6e50ad2-gUJV3NuQS3mxZyjN9mM9_08-new-build-step-type.png)

3. [CLI ページ](/docs/running-tests/the-command-line-cli)で説明されているように、適切なパラメーターを使用して Custom Script を設定します。\
   以下は、最新の npm パッケージがあることを確認する最初の部分と、CLI コマンド自体を含む基本的なスクリプトテンプレートです:

```shell
set -x
mkdir -p "%system.teamcity.build.workingDir%/.npm-packages"
prefix=%system.teamcity.build.workingDir%/.npm-packages
NPM_PACKAGES="%system.teamcity.build.workingDir%/.npm-packages"
export PATH="$PATH:$NPM_PACKAGES/bin"
export NODE_PATH="$NODE_PATH:$NPM_PACKAGES/lib/node_modules"
npm config set prefix %system.teamcity.build.workingDir%/.npm-packages
npm install -g @testim/testim-cli
set +x
%system.teamcity.build.workingDir%/.npm-packages/bin/testim \
 --label "<YOUR LABEL>" \
 --token "<YOUR ACCESS TOKEN>" \
 --project "<YOUR PROJECT ID>" \
 --grid "<Your grid name>" \
 --reporters teamcity,console
```

![TeamCity で Custom Script ビルドステップを設定する画面](/images/ci-integrations/teamcity-integration/8360a86-xkywkbTDRDiv6XSRI8zk_09-new-build-step-form-full.png)

TeamCity が結果を保存、分析、表示するために、Testim は自動的に認識される独自の TeamCity レポート形式を生成します:

![Testim の TeamCity レポート形式でテスト結果が表示されたビルド結果画面](/images/ci-integrations/teamcity-integration/947a4f9-byvxlS1TKuodnownVWwg_10-build-results.png)

**注記:**

1. 実行されるテストの進行状況をテストごとに確認できます!
2. グリッド名については、[こちら](/docs/integrations/grid-management)でグリッドの設定方法をご確認ください。
3. 引数 `--reporters` `teamcity,console` と `--retries` を組み合わせて使用する場合、リトライでテストが合格しても、TeamCity は失敗と合格の両方の実行を記録し、スイートが合格してもビルドは失敗としてマークされます。
