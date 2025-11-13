# ドキュメント更新管理スクリプト

このディレクトリには、英語原文と日本語翻訳の更新状況を追跡・管理するためのスクリプトが含まれています。

## スクリプト一覧

### 1. `check_outdated_docs.mjs`

英語原文と日本語翻訳の更新日を比較し、更新が必要なドキュメントを検出します。

**使用方法:**

```bash
npm run check:updates
# または
node scripts/check_outdated_docs.mjs
```

**機能:**
- すべての`.md`ファイルをスキャン
- `sourceUrl`が設定されているファイルの英語原文から更新日を取得
- 日本語版の`updated`フィールドと比較
- 更新が必要なファイルをリスト表示
- 結果を`docs-update-status.json`に保存
- CIで実行時、更新が必要な場合はエラーコードで終了

**出力例:**

```
📋 ドキュメント更新状況チェック開始

📄 150個のファイルをスキャン中...

🔍 src/content/docs/recording-tests/recording-a-mobile-test.md
  ✅ 最新: 2025-09-18

🔍 src/content/docs/getting-started/overview.md
  ❌ 更新が必要: 日本語 2025-08-15 → 英語 2025-10-20 (66日遅れ)

========================================
📊 チェック結果サマリー

✅ 最新: 140件
❌ 更新必要: 8件
⚠️  エラー: 2件
```

### 2. `fetch_all_updated_dates.mjs`

すべてのドキュメントの英語原文更新日を一括取得して一覧表示します。

**使用方法:**

```bash
npm run check:dates
# または
node scripts/fetch_all_updated_dates.mjs
```

**機能:**
- すべての`sourceUrl`から更新日を一括取得
- テーブル形式で見やすく表示
- 結果を`docs-dates-snapshot.json`に保存
- 現在の状況を素早く確認

**出力例:**

```
📋 英語原文の更新日を一括取得

📄 150個のファイルを処理中...

🔍 recording-a-mobile-test.md... ✅ 2025-09-18
🔍 overview.md... 🔄 2025-10-20

========================================
📊 取得結果一覧

状態      | ファイル名                    | 日本語版   | 英語版
----------|------------------------------|-----------|----------
✅ 最新   | recording-a-mobile-test.md   | 2025-09-18| 2025-09-18
🔄 要更新 | overview.md                  | 2025-08-15| 2025-10-20
```

### 3. `update_dates_from_english.mjs`

英語原文から取得した更新日で、日本語ファイルの`updated`フィールドを自動更新します。

**使用方法:**

**ドライラン（変更内容の確認のみ）:**

```bash
npm run update:dates
# または
node scripts/update_dates_from_english.mjs
```

**実際に更新:**

```bash
npm run update:dates:apply
# または
node scripts/update_dates_from_english.mjs --apply
```

**特定フォルダのみ更新:**

```bash
node scripts/update_dates_from_english.mjs --apply --pattern recording-tests
```

**機能:**
- 英語原文から最新の更新日を取得
- 日本語ファイルの`updated`フィールドを自動更新
- デフォルトはドライラン（`--apply`で実際に更新）
- `--pattern`オプションで特定のファイル/フォルダのみ処理

**出力例:**

```
📋 英語原文の更新日で日本語ファイルを更新

🔍 ドライランモード: ファイルは変更されません

🔍 src/content/docs/recording-tests/recording-a-mobile-test.md
  ✅ 既に最新です: 2025-09-18

🔍 src/content/docs/getting-started/overview.md
  🔄 更新: 2025-08-15 → 2025-10-20
  💡 [ドライラン] ファイルは更新されません

========================================
📊 更新結果サマリー

✅ 更新完了: 8件
⏭️  変更なし: 140件
```

## GitHub Actions

### `check-docs-updates.yml`

週次で自動的にドキュメントの更新状況をチェックします。

**トリガー:**
- 毎週月曜日の午前9時（JST）
- 手動実行（workflow_dispatch）
- Pull Request作成時（情報提供のため）

**動作:**
1. `check_outdated_docs.mjs`を実行
2. 更新が必要なドキュメントが見つかった場合:
   - GitHub Issueを作成または更新
   - ラベル: `documentation`, `update-needed`, `automated`
3. 結果をArtifactとして保存（30日間保持）
4. PR作成時はコメントで状況を通知

## ワークフロー例

### 定期的な確認

```bash
# 週に1回程度、更新状況を確認
npm run check:updates

# 更新が必要な場合、内容を確認
npm run check:dates

# 問題なければ一括更新（ドライラン）
npm run update:dates

# 確認後、実際に更新
npm run update:dates:apply

# 変更をコミット
git add src/content/docs/
git commit -m "docs: 英語原文の更新日を反映"
```

### 特定フォルダの更新

```bash
# recording-testsフォルダのみ更新
node scripts/update_dates_from_english.mjs --apply --pattern recording-tests
```

## 必要な環境

- Node.js 18以上
- インターネット接続（英語原文の取得のため）

## トラブルシューティング

### エラー: `Cannot find package 'gray-matter'`

```bash
npm install
```

### レート制限エラー

スクリプトは各リクエスト間に100msの待機時間を設けていますが、大量のファイルを処理する場合は時間がかかります。

### 更新日が取得できない

- `sourceUrl`が正しく設定されているか確認
- 英語原文のURLが変更されていないか確認
- ネットワーク接続を確認

## 注意事項

- `updated`フィールドは英語原文の最終更新日を記録します
- 実際の翻訳作業の完了日とは異なる場合があります
- 重要な更新の場合は、内容を確認してから翻訳を更新してください
