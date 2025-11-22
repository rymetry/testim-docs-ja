---
title: 'TestimとJiraの連携'
description: 'TestimとJiraを連携してバグレポートを自動化する方法を説明します。統合設定、課題の作成、テスト結果とJiraチケットの連携方法を網羅しています。'
category: 'bug-tracker-settings'
order: 20
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/connecting-testim-to-jira'
keywords:
  - testim
  - jira
  - バグトラッカー
  - 課題管理
  - 統合設定
---

# TestimとJiraの連携

Jiraは、プロジェクト管理と課題追跡のための強力なツールです。TestimとJiraを連携することで、テスト失敗時に自動的にJiraの課題を作成し、効率的にバグを追跡できます。

## Jira連携の設定

1. Testimにログインします
2. **Settings（設定）** > **Integration（統合）** に移動します
3. **Jira**セクションを見つけます
4. **Connect（接続）** をクリックします
5. Jiraの認証情報を入力します：
   - **Jira URL**: JiraインスタンスのURL（例：`https://your-company.atlassian.net`）
   - **Email**: Jiraアカウントのメールアドレス
   - **API Token**: JiraのAPIトークン（[Atlassianアカウント設定](https://id.atlassian.com/manage-profile/security/api-tokens)で生成）
6. **Connect（接続）** をクリックして接続を完了します

## Jira課題の作成

テスト失敗時にJira課題を作成するには：

1. テスト結果画面を開きます
2. 失敗したステップを選択します
3. **Create Bug（バグを作成）** ボタンをクリックします
4. **Jira**を選択します
5. 課題の詳細を入力します：
   - **Project（プロジェクト）**: Jiraプロジェクトを選択
   - **Issue Type（課題タイプ）**: バグ、タスクなどを選択
   - **Summary（要約）**: 課題のタイトル
   - **Description（説明）**: 詳細な説明（自動的にテスト情報が含まれます）
6. **Create（作成）** をクリックします

作成されたJira課題には、以下の情報が自動的に含まれます：
- テスト名
- 失敗したステップ
- スクリーンショット
- エラーメッセージ
- テスト実行へのリンク

## トラブルシューティング

接続に問題がある場合は、以下を確認してください：

- Jira URLが正しいか（`https://`を含む完全なURL）
- APIトークンが有効か
- Jiraアカウントに課題を作成する権限があるか
