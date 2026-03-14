---
title: TestimとGitHub（Issues）の連携
description: >-
  TestimとGitHub
  Issuesを連携してバグレポートをGitHubで管理する方法を説明します。統合設定、Issue作成、テスト結果とGitHubリポジトリの連携方法を網羅しています。
category: 統合
order: 12037
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/connecting-testim-to-github'
keywords:
  - GitHub Issues
  - GitHub連携
  - Issue連携
  - Issue自動作成
  - バグレポート
  - バグ管理
  - テスト失敗
  - 課題管理
  - テストレポート
---

# TestimとGitHub（Issues）の連携

GitHub Issuesは、GitHubリポジトリに統合されたバグトラッカーおよび課題管理ツールです。TestimとGitHub Issuesを連携することで、テスト失敗時に自動的にGitHub Issueを作成し、コードとバグ管理を一元化できます。

> **注意**: この連携は、[GitHub統合](/docs/github-integration)（ブランチ管理）とは異なります。こちらはIssue作成に特化した連携です。

## GitHub Issues連携の設定

1. Testimにログインします
2. **Settings（設定）** > **Integration（統合）** に移動します
3. **GitHub Issues**セクションを見つけます
4. **Connect（接続）** をクリックします
5. GitHubの認証画面が表示されます
6. **Authorize（認証）** をクリックしてTestimにアクセスを許可します
7. Issueを作成するリポジトリへのアクセスを許可します
8. 接続が完了します

## GitHub Issueの作成

テスト失敗時にGitHub Issueを作成するには：

1. テスト結果画面を開きます
2. 失敗したステップを選択します
3. **Create Bug（バグを作成）** ボタンをクリックします
4. **GitHub**を選択します
5. Issueの詳細を入力します：
   - **Repository（リポジトリ）**: GitHubリポジトリを選択
   - **Title（タイトル）**: Issueのタイトル
   - **Description（説明）**: 詳細な説明（自動的にテスト情報が含まれます）
   - **Labels（ラベル）**: オプションでラベルを追加（例：bug、test-failure）
   - **Assignees（担当者）**: オプションで担当者を割り当て
6. **Create（作成）** をクリックします

作成されたGitHub Issueには、以下の情報が自動的に含まれます：
- テスト名
- 失敗したステップ
- スクリーンショット（画像として添付）
- エラーメッセージ
- テスト実行へのリンク
- ブラウザとOS情報

## GitHubでのIssue管理

作成されたIssueは、GitHub上で通常のIssueと同様に管理できます：

- ラベルの追加・編集
- マイルストーンへの割り当て
- プルリクエストとのリンク
- コメントの追加
- ステータスの更新（Open/Closed）

## トラブルシューティング

接続に問題がある場合は、以下を確認してください：

- GitHubアカウントが有効か
- Testimに必要な権限が付与されているか（repo権限）
- 選択したリポジトリへのアクセス権限があるか
- Issueを作成する権限があるか

## 関連ドキュメント

- [GitHub統合（ブランチ管理）](/docs/github-integration)
- [バグトラッカー設定](/docs/bug-tracker-settings)
