---
title: 'qTest統合'
description: 'TestimとqTestを統合してテスト結果を自動的に同期する方法を説明します。統合設定、テストケースのマッピング、結果の送信、CLIでの使用方法を網羅しています。'
category: 'test-management-integrations'
order: 20
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/qtest-integration'
keywords:
  - qTest
  - Tricentis Test Management
  - テスト管理ツール
  - テストケース管理
  - テスト結果同期
  - テスト実行
  - API連携
  - リモートグリッド
---

# qTest統合

[qTest](https://www.tricentis.com/products/unified-test-management-qtest/test-case-manager/)は、Tricentisが提供するエンタープライズ向けテスト管理プラットフォームです。TestimとqTestを統合することで、Testimのテスト実行結果を自動的にqTestに送信できます。

## 前提条件

- 有効なqTestアカウント
- qTestプロジェクトへのアクセス権限
- qTest APIトークン

## qTest統合の設定

### 1. qTest APIトークンの取得

1. qTestにログインします
2. 右上のユーザーアイコンをクリックし、**Resources（リソース）** を選択します
3. **API & SDK** をクリックします
4. **Generate New Token（新しいトークンを生成）** をクリックします
5. トークン名を入力し、必要な権限を選択します
6. 生成されたAPIトークンをコピーして保存します

### 2. Testimでの統合設定

1. Testimにログインします
2. **Settings（設定）** > **Integration（統合）** に移動します
3. **qTest** セクションを見つけます
4. 以下の情報を入力します：
   - **qTest URL**: qTestインスタンスのURL（例：`https://your-company.qtestnet.com`）
   - **API Token**: 生成したAPIトークン
5. **Connect（接続）** をクリックします

## テストのマッピング

TestimのテストとqTestのテストケースをマッピングするには、複数の方法があります。

### 方法1: テスト設定でマッピング

1. Testimのテストエディタを開きます
2. **Settings（設定）** タブをクリックします
3. **qTest** セクションで以下を設定します：
   - **Project ID**: qTestプロジェクトID
   - **Test Cycle ID**: qTestテストサイクルID（オプション）
   - **Test Case ID**: qTestテストケースID

### 方法2: ラベルを使用したマッピング

Testimのテストにラベルを追加してqTestテストケースIDを指定できます：

```text
qtest:TC-12345
```

### 方法3: テスト名を使用したマッピング

テスト名にqTestテストケースIDを含めることで自動的にマッピングできます：

```text
[TC-12345] Login Test
```

## テスト結果の送信

### CLIからの送信

Testim CLIを使用してテストを実行し、結果をqTestに送信するには：

```bash
testim --token <your-token> \
  --project <project-id> \
  --grid "Testim Grid" \
  --qtest-project-id <qtest-project-id> \
  --qtest-test-cycle <qtest-cycle-id>
```

### 自動送信

統合を設定すると、テスト実行後に自動的にqTestに結果が送信されます。送信される情報：

- テストステータス（Passed/Failed/Skipped）
- 実行時間
- 開始・終了日時
- エラーメッセージ（失敗の場合）
- テスト実行へのリンク
- スクリーンショット（失敗の場合）

### スケジューラからの送信

スケジューラでqTest統合を有効にするには：

1. **Scheduler（スケジューラ）** に移動します
2. スケジュールを作成または編集します
3. **Advanced（詳細）** セクションで **qTest Integration** を有効にします
4. qTestプロジェクトとテストサイクルを選択します

## qTestでの結果確認

1. qTestにログインします
2. 対象のプロジェクトを開きます
3. **Test Execution（テスト実行）** タブに移動します
4. Testimから送信された結果を確認できます

各結果には以下の情報が含まれます：

- テストステータス
- 実行日時
- 実行時間
- ログとエラーメッセージ
- Testimテスト結果へのリンク
- 添付ファイル（スクリーンショット）

## 高度な設定

### テストサイクルの自動作成

Testimのテスト実行時に、qTestで新しいテストサイクルを自動作成できます：

1. **Settings（設定）** > **Integration（統合）** > **qTest** に移動します
2. **Auto-create Test Cycles（テストサイクルを自動作成）** を有効にします
3. テストサイクル名のテンプレートを設定します（例：`Testim Run - {date}`）

### カスタムフィールドのマッピング

qTestのカスタムフィールドにデータを送信するには：

1. Testimのテストパラメータでカスタムフィールドの値を設定します
2. **Settings（設定）** > **Integration（統合）** > **qTest** でフィールドマッピングを設定します

### 結果のフィルタリング

特定のテストのみqTestに送信するには、ラベルを使用してフィルタリングできます：

```bash
testim --token <your-token> \
  --label "qtest-sync" \
  --qtest-project-id <qtest-project-id>
```

## トラブルシューティング

### 結果が送信されない

- qTest APIトークンが有効か確認してください
- Testimテストに正しいqTestテストケースIDが設定されているか確認してください
- qTestプロジェクトとテストサイクルが存在するか確認してください
- ネットワーク接続を確認してください

### 認証エラー

- qTest URLが正しいか確認してください（`https://`を含む）
- APIトークンが有効で、必要な権限があるか確認してください
- qTestアカウントがアクティブか確認してください

### テストケースが見つからない

- qTestテストケースIDが正しいか確認してください
- テストケースが存在するプロジェクトを確認してください
- テストケースがアクティブか確認してください

### パフォーマンスの問題

多数のテストを実行する場合、バッチ処理を使用して送信を最適化できます：

```bash
testim --token <your-token> \
  --qtest-batch-size 50
```

## ベストプラクティス

- **一貫したマッピング**: すべてのTestimテストに明確なqTestテストケースIDを設定します
- **テストサイクルの整理**: 定期的にテストサイクルを作成して、実行結果を整理します
- **カスタムフィールドの活用**: 追加のメタデータをqTestに送信して、詳細なレポートを作成します
- **自動化の監視**: qTest統合が正しく動作しているか定期的に確認します
