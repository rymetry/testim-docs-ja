---
title: 'TestimをCIに統合する'
description: 'Testim CLIを使用してCI環境にテストを統合する方法について説明します。テストスイートの実行追跡とCI固有の統合ガイドのリンクを提供します。'
category: 'CI統合'
order: 5
updated: '2025-02-21'
sourceUrl: 'https://help.testim.io/docs/integrate-testim-to-your-ci'
keywords:
  - CI統合
  - 継続的インテグレーション
  - CIツール
  - CIパイプライン
  - Testim CLI
  - テストスイート
  - テスト結果
  - ビルド結果
  - ビルド追跡
  - テストレポート
---

## 仕組み

テストをCIに統合するために、[Testim CLI](/docs/the-command-line-cli)を構築しました。npmを使用して簡単にインストールでき、これを使用することで、単純なシェルコマンドを実行できる主要なCIすべてに統合できます。

## すべてのテストスイート実行を確認する

どのビルドが成功または失敗したかを簡単に追跡し、ワンクリックで関連するテスト結果を開いて、失敗の理由をより深く理解できます。\
また、テスト結果の履歴を全体的に把握できるチャートも追加しました。これは、関連する期間に応じてフィルタリングすることもできます:

![テストスイート実行履歴とチャートを表示するTestim画面](/images/ci-integrations/integrate-testim-to-your-ci/eac37a2-Screen_Shot_2021-02-21_at_10.21.49.png)

## 今すぐ始める

1. Settings --> CLI --> CIに移動します
2. ドロップダウンリストからCIプラットフォームを選択します
3. 生成されたコマンドをコピーします

![CLI設定画面でCIプラットフォームを選択しコマンドを生成する様子](/images/ci-integrations/integrate-testim-to-your-ci/78fd262-Feb-21-2021_10-25-31.gif)

**特定のCIへの統合に関するガイドのリスト:**

- [Azure Pipeline Integration](/docs/azure-devops-build-pipeline-integrations)
- [Bamboo integration](/docs/bamboo-integration)
- [Circle CI integration](/docs/circle-ci-integration)
- [Codeship integration](/docs/codeship-integration)
- [Jenkins Integration](/docs/jenkins-integration)
- [Jenkins Integration - Using Docker](/docs/jenkins-integration-using-docker)
- [TeamCity Integration](/docs/teamcity-integration)
- [Visual Studio integration](/docs/vsts-and-tfs-integration)
- [GitLab integration](/docs/gitlab-integration)
