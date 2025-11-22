---
title: 'TestimをCIに統合する'
description: 'Testim CLIを使用してCI環境にテストを統合する方法について説明します。テストスイートの実行追跡とCI固有の統合ガイドのリンクを提供します。'
category: 'CI統合'
order: 5
updated: '2025-02-21'
keywords:
  - testim
  - ci統合
  - testim-cli
  - テストスイート
  - ビルド追跡
---

## 仕組み

テストをCIに統合するために、[Testim CLI](/docs/running-tests/the-command-line-cli)を構築しました。npmを使用して簡単にインストールでき、これを使用することで、単純なシェルコマンドを実行できる主要なCIすべてに統合できます。

## すべてのテストスイート実行を確認する

どのビルドが成功または失敗したかを簡単に追跡し、ワンクリックで関連するテスト結果を開いて、失敗の理由をより深く理解できます。\
また、テスト結果の履歴を全体的に把握できるチャートも追加しました。これは、関連する期間に応じてフィルタリングすることもできます:

![](/images/ci-integrations/integrate-testim-to-your-ci/eac37a2-Screen_Shot_2021-02-21_at_10.21.49.png)

## 今すぐ始める

1. Settings --> CLI --> CIに移動します
2. ドロップダウンリストからCIプラットフォームを選択します
3. 生成されたコマンドをコピーします

![](/images/ci-integrations/integrate-testim-to-your-ci/78fd262-Feb-21-2021_10-25-31.gif)

**特定のCIへの統合に関するガイドのリスト:**

- [Azure Pipeline Integration](/docs/ci-integrations/azure-devops-build-pipeline-integrations)
- [Bamboo integration](/docs/ci-integrations/bamboo-integration)
- [Circle CI integration](/docs/ci-integrations/circle-ci-integration)
- [Codeship integration](/docs/ci-integrations/codeship-integration)
- [Jenkins Integration](/docs/ci-integrations/jenkins-integration)
- [Jenkins Integration - Using Docker](/docs/ci-integrations/jenkins-integration-using-docker)
- [TeamCity Integration](/docs/ci-integrations/teamcity-integration)
- [Visual Studio integration](/docs/ci-integrations/vsts-and-tfs-integration)
- [GitLab integration](/docs/ci-integrations/gitlab-integration)
