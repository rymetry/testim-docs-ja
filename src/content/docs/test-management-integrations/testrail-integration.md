---
title: 'TestRail統合'
description: 'TestimとTestRailを統合してテスト結果を自動的に同期する方法を説明します。統合設定、テストケースのマッピング、結果の送信方法を網羅しています。'
category: '統合'
order: 12040
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/testrail-integration'
keywords:
  - TestRail
  - テスト管理ツール
  - テストケース管理
  - テスト結果同期
  - テストラン
  - API連携
---

# TestRail統合

[TestRail](https://www.gurock.com/testrail/)は、Gurock社が提供するテスト管理プラットフォームです。TestimとTestRailを統合することで、Testimのテスト実行結果を自動的にTestRailに送信できます。

## 前提条件

- 有効なTestRailアカウント
- TestRailプロジェクトへのアクセス権限
- TestRail APIキー

## TestRail統合の設定

### 1. TestRail APIキーの取得

1. TestRailにログインします
2. 右上のユーザーアイコンをクリックし、**My Settings（マイ設定）** を選択します
3. **API Keys** タブに移動します
4. **Add Key（キーを追加）** をクリックしてAPIキーを生成します
5. 生成されたAPIキーをコピーして保存します

### 2. Testimでの統合設定

1. Testimにログインします
2. **Settings（設定）** > **Integration（統合）** に移動します
3. **TestRail** セクションを見つけます
4. 以下の情報を入力します：
   - **TestRail URL**: TestRailインスタンスのURL（例：`https://your-company.testrail.io`）
   - **Email**: TestRailアカウントのメールアドレス
   - **API Key**: 生成したAPIキー
5. **Connect（接続）** をクリックします

## テストのマッピング

TestimのテストとTestRailのテストケースをマッピングするには、Testimのテスト設定でTestRailのテストケースIDを指定します。

### 方法1: テスト設定でマッピング

1. Testimのテストエディタを開きます
2. **Settings（設定）** タブをクリックします
3. **TestRail** セクションで以下を設定します：
   - **Project ID**: TestRailプロジェクトID
   - **Suite ID**: TestRailスイートID（オプション）
   - **Test Case ID**: TestRailテストケースID（例：`C123`）

### 方法2: テスト名を使用したマッピング

テスト名に TestRail テストケースIDを含めることで自動的にマッピングできます。

例：

```text
C123 - Login Test
```

この場合、Testimは自動的にテストケース `C123` に結果を送信します。

## テスト結果の送信

### 自動送信

統合を設定すると、テスト実行後に自動的にTestRailに結果が送信されます。送信される情報：

- テストステータス（Passed/Failed/Blocked）
- 実行時間
- エラーメッセージ（失敗の場合）
- テスト実行へのリンク

### 手動送信

特定のテスト結果を手動でTestRailに送信するには：

1. テスト結果画面を開きます
2. **Send to TestRail（TestRailに送信）** ボタンをクリックします
3. 送信先のTestRailテストケースを選択します

## TestRailでの結果確認

1. TestRailにログインします
2. 対象のプロジェクトを開きます
3. **Test Runs & Results（テスト実行と結果）** セクションに移動します
4. Testimから送信された結果を確認できます

各結果には以下の情報が含まれます：

- テストステータス
- 実行日時
- 実行時間
- エラーメッセージとスタックトレース（失敗の場合）
- Testimテスト結果へのリンク

## 高度な設定

### テストランの作成

Testimのテストスイート実行時に、TestRailで新しいテストランを自動作成できます：

1. **Settings（設定）** > **Integration（統合）** > **TestRail** に移動します
2. **Auto-create Test Runs（テストランを自動作成）** を有効にします
3. テストラン名のテンプレートを設定します（例：`Testim Run - {date}`）

### カスタムフィールドのマッピング

TestRailのカスタムフィールドにデータを送信するには：

1. Testimのテストパラメータでカスタムフィールドの値を設定します
2. **Settings（設定）** > **Integration（統合）** > **TestRail** でフィールドマッピングを設定します

## トラブルシューティング

### 結果が送信されない

- TestRail APIキーが有効か確認してください
- Testimテストに正しいTestRailテストケースIDが設定されているか確認してください
- TestRailプロジェクトとスイートが存在するか確認してください

### 認証エラー

- TestRail URLが正しいか確認してください（`https://`を含む）
- メールアドレスとAPIキーが正しいか確認してください
- TestRailアカウントに必要な権限があるか確認してください

### テストケースが見つからない

- TestRailテストケースIDが正しいか確認してください（`C`プレフィックスを含む）
- テストケースが存在するプロジェクトとスイートを確認してください
