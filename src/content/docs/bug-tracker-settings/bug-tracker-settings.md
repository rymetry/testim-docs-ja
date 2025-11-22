---
title: 'バグトラッカー設定'
description: 'Testimで利用可能なバグトラッカー統合の概要を説明します。Jira、Trello、Slack、GitHubとの連携方法と、効率的なバグ管理のベストプラクティスを網羅しています。'
category: 'bug-tracker-settings'
order: 10
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/bug-tracker-settings'
keywords:
  - バグトラッカー
  - 統合設定
  - バグ管理
  - 課題追跡
---

# バグトラッカー設定

Testimは、主要なバグトラッカーおよびプロジェクト管理ツールと統合できます。テスト失敗時に自動的にバグレポートを作成し、開発チームとの連携を効率化できます。

失敗したテストや発見したバグは、バグ／課題管理システムに簡単に報告できます。Testimは一般的なバグトラッカーと連携し、再現手順や画面解像度、ブラウザ情報、スクリーンショットなどを含む詳細なバグレポートを、ワンクリックで作成できます。

> 📘 プロ機能
>
> この機能はProfessionalプラン以上で利用できます。プランの詳細については [Testimの料金プラン](https://www.testim.io/pricing/) を参照してください。

## バグの報告方法

バグ／課題をバグトラッカーに報告する主な方法は次のとおりです。

- **失敗した実行への失敗タイプのタグ付けから報告**  
  失敗したテスト実行に失敗タイプをタグ付けするフローの中で、**Create issue** リンクをクリックしてバグを作成できます。詳細な手順については、[失敗した実行への失敗タイプのタグ付け](/docs/tag-remote-runs-failures) を参照してください。

- **Testim拡張機能からのバグキャプチャ**  
  [Testim拡張機能 - 概要](/docs/testim-extension-overview) を使用すると、以下の方法でブラウザ上の問題をキャプチャし、そのままバグトラッカーに送信できます：
  - [スクリーンショットのキャプチャ](/docs/testim-extension-capture-screenshot)
  - [ビデオとバグシナリオのキャプチャ](/docs/testim-extension-capture-video-bug-scenario)

## 利用可能なバグトラッカー統合

Testimは、以下のバグトラッカーと統合できます：

### Jira

Atlassianの課題追跡およびプロジェクト管理ツール。エンタープライズ環境で広く使用されています。

- **用途**: バグ、タスク、ストーリーの管理
- **詳細**: [TestimとJiraの連携](connecting-testim-to-jira)

### Trello

カンバンボードを使用した視覚的なプロジェクト管理ツール。

- **用途**: シンプルなバグ管理とタスク追跡
- **詳細**: [TestimとTrelloの連携](connecting-testim-to-trello)

### Slack

チームコミュニケーションツール。テスト結果をリアルタイムで通知できます。

- **用途**: テスト失敗の即時通知
- **詳細**: [TestimとSlackの連携](connecting-testim-to-slack)

### GitHub

コード管理とプロジェクト管理のプラットフォーム。

- **用途**: GitHub Issuesへのバグレポート作成
- **詳細**: [TestimとGitHubの連携](connecting-testim-to-github)

## バグレポート機能

各統合で、以下の情報を自動的に含むバグレポートを作成できます：

- テスト名と説明
- 失敗したステップの詳細
- エラーメッセージとスタックトレース
- スクリーンショット
- テスト実行へのリンク
- ブラウザとOS情報

## ベストプラクティス

### 適切なバグトラッカーの選択

- **大規模チーム**: Jira（高度なワークフローとカスタマイズ）
- **小規模チーム**: Trello（シンプルで直感的）
- **即時通知**: Slack（リアルタイムアラート）
- **開発者中心**: GitHub（コードと課題の一元管理）

### 効率的なバグ管理

- テスト失敗時には、すぐにバグレポートを作成する
- 重複するバグを避けるため、既存の課題を確認する
- スクリーンショットとエラーメッセージを必ず含める
- 再現手順を明確に記述する

## 関連ドキュメント

- [TestimとJiraの連携](connecting-testim-to-jira)
- [TestimとTrelloの連携](connecting-testim-to-trello)
- [TestimとSlackの連携](connecting-testim-to-slack)
- [TestimとGitHubの連携](connecting-testim-to-github)
