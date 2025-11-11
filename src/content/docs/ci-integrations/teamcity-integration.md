---
title: 'TeamCity統合'
description: 'TeamCityでTestimテストを実行する方法について説明します。ビルドステップの設定手順とスクリプトテンプレートを提供します。'
category: 'CI統合'
order: 9
updated: '2025-02-10'
keywords:
  - testim
  - teamcity
  - ci統合
  - ビルドステップ
  - nodejs
---

![455](/images/ci-integrations/teamcity-integration/6a3c92e-4pro3hwiQxCVNwY6QQXg_teamcity-logo.png "4pro3hwiQxCVNwY6QQXg_teamcity-logo.png")

TeamCityとテストを統合するには、まずTeamCityマシンまたはそのスレーブマシンの1つにnode.js(12.13+、14.15+、16.13+)がインストールされている必要があります。

## 次の手順に従ってください

1. プロジェクトに新しいビルドステップを作成します:

![1242](/images/ci-integrations/teamcity-integration/6bdc599-irViLY05QOSHdya5bXqR_06-add-build-step.png "irViLY05QOSHdya5bXqR_06-add-build-step.png")

2. "Command Line"ランナータイプを選択します:

![887](/images/ci-integrations/teamcity-integration/6e50ad2-gUJV3NuQS3mxZyjN9mM9_08-new-build-step-type.png "gUJV3NuQS3mxZyjN9mM9_08-new-build-step-type.png")

3. [CLIページ](/docs/running-tests/the-command-line-cli)で説明されているように、適切なパラメータを使用してCustom Scriptを設定します。\
   以下は、最新のnpmパッケージがあることを確認する最初の部分と、CLIコマンド自体を含む基本的なスクリプトテンプレートです:

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

![1010](/images/ci-integrations/teamcity-integration/8360a86-xkywkbTDRDiv6XSRI8zk_09-new-build-step-form-full.png "xkywkbTDRDiv6XSRI8zk_09-new-build-step-form-full.png")

TeamCityが結果を保存、分析、表示するために、Testimは自動的に認識される独自のTeamCityレポート形式を生成します:

![1042](/images/ci-integrations/teamcity-integration/947a4f9-byvxlS1TKuodnownVWwg_10-build-results.png "byvxlS1TKuodnownVWwg_10-build-results.png")

**注記:**

1. 実行されるテストの進行状況をテストごとに確認できます!
2. グリッド名については、[こちら](/docs/grid-management/grid-management)でグリッドの設定方法をご確認ください。
3. 引数**--reporters teamcity, console --retries**を組み合わせて使用する場合、リトライでテストが合格しても、teamcityは失敗と合格の両方の実行を記録し、スイートが合格してもビルドは失敗としてマークされます。
