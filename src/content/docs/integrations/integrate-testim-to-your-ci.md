---
title: Testim を CI に統合する
description: Testim CLI を使用して CI 環境にテストを統合する方法について説明します。テストスイートの実行追跡と CI 固有の統合ガイドのリンクを提供します。
category: 統合
order: 12002
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/integrations/integrate-testim-to-your-ci/index.htm'
keywords:
  - CI 統合
  - 継続的インテグレーション
  - CI ツール
  - CI パイプライン
  - Testim CLI
  - テストスイート
  - テスト結果
  - ビルド結果
  - ビルド追跡
  - テストレポート
---

## 仕組み

テストを CI に統合するために、[Testim CLI](/docs/running-tests/the-command-line-cli)を構築しました。npm を使用して簡単にインストールでき、これを使用することで、単純なシェルコマンドを実行できる主要な CI すべてに統合できます。

## すべてのテストスイート実行を確認する

どのビルドが成功または失敗したかを簡単に追跡し、ワンクリックで関連するテスト結果を開いて、失敗の理由をより深く理解できます。\
また、テスト結果の履歴を全体的に把握できるチャートも追加しました。これは、関連する期間に応じてフィルタリングすることもできます:

![テストスイート実行履歴とチャートを表示する Testim 画面](/images/ci-integrations/integrate-testim-to-your-ci/eac37a2-Screen_Shot_2021-02-21_at_10.21.49.png)

## 今すぐ始める

1. Settings --> CLI --> CI に移動します
2. ドロップダウンリストから CI プラットフォームを選択します
3. 生成されたコマンドをコピーします

![CLI 設定画面で CI プラットフォームを選択しコマンドを生成する様子](/images/ci-integrations/integrate-testim-to-your-ci/78fd262-Feb-21-2021_10-25-31.gif)

**特定の CI への統合に関するガイドのリスト:**

- [Azure Pipeline との統合](/docs/integrations/integrate-testim-to-your-ci/azure-devops-build-pipeline-integrations)
- [Bamboo との統合](/docs/integrations/integrate-testim-to-your-ci/bamboo-integration)
- [Circle CI との統合](/docs/integrations/integrate-testim-to-your-ci/circle-ci-integration)
- [Codeship との統合](/docs/integrations/integrate-testim-to-your-ci/codeship-integration)
- [Jenkins との統合](/docs/integrations/integrate-testim-to-your-ci/jenkins-integration)
- [Jenkins との統合 - Docker を使用](/docs/integrations/integrate-testim-to-your-ci/jenkins-integration-using-docker)
- [TeamCity との統合](/docs/integrations/integrate-testim-to-your-ci/teamcity-integration)
- [Visual Studio との統合](/docs/integrations/integrate-testim-to-your-ci/vsts-and-tfs-integration)
- [GitLab との統合](/docs/integrations/integrate-testim-to-your-ci/gitlab-integration)
