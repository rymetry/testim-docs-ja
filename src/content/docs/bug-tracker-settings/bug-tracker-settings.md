---
title: 'バグトラッカー設定'
description: 'Testimで利用可能なバグトラッカー統合の概要を説明します。Jira、Trello、Slack、GitHubとの連携方法と、効率的なバグ管理のベストプラクティスを網羅しています。'
category: 'bug-tracker-settings'
order: 10
updated: '2025-11-11'
keywords:
  - testim
  - バグトラッカー
  - 統合設定
  - バグ管理
  - 課題追跡
---

# バグトラッカー設定

Testimは、主要なバグトラッカーおよびプロジェクト管理ツールと統合できます。テスト失敗時に自動的にバグレポートを作成し、開発チームとの連携を効率化できます。

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
