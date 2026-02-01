---
title: 'TestimとTrelloの連携'
description: 'TestimとTrelloを連携してバグレポートをTrelloカードとして管理する方法を説明します。統合設定、カード作成、テスト結果の追跡方法を網羅しています。'
category: '統合'
order: 12035
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/connecting-testim-to-trello'
keywords:
  - trello
  - バグトラッカー
  - カード管理
  - 統合設定
---

# TestimとTrelloの連携

Trelloは、カンバンボードを使用したプロジェクト管理ツールです。TestimとTrelloを連携することで、テスト失敗時に自動的にTrelloカードを作成し、視覚的にバグを管理できます。

## Trello連携の設定

1. Testimにログインします
2. **Settings（設定）** > **Integration（統合）** に移動します
3. **Trello**セクションを見つけます
4. **Connect（接続）** をクリックします
5. Trelloの認証画面が表示されます
6. **Allow（許可）** をクリックしてTestimにアクセスを許可します
7. 接続が完了します

## Trelloカードの作成

テスト失敗時にTrelloカードを作成するには：

1. テスト結果画面を開きます
2. 失敗したステップを選択します
3. **Create Bug（バグを作成）** ボタンをクリックします
4. **Trello**を選択します
5. カードの詳細を入力します：
   - **Board（ボード）**: Trelloボードを選択
   - **List（リスト）**: リストを選択（例：To Do、Bugs）
   - **Title（タイトル）**: カードのタイトル
   - **Description（説明）**: 詳細な説明（自動的にテスト情報が含まれます）
6. **Create（作成）** をクリックします

作成されたTrelloカードには、以下の情報が自動的に含まれます：
- テスト名
- 失敗したステップ
- スクリーンショット
- エラーメッセージ
- テスト実行へのリンク

## トラブルシューティング

接続に問題がある場合は、以下を確認してください：

- Trelloアカウントが有効か
- Testimに必要な権限が付与されているか
- 選択したボードへのアクセス権限があるか
