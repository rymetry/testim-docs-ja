# ドキュメント更新日トラッキングについて

## 概要

このプロジェクトでは、英語原文の更新状況を追跡するために自動化スクリプトを使用しています。`updated` は原文追従を正とし、実質変更なしと判断したページだけを例外レジストリで管理します。

## 重要な注意事項

### HTML の `updatedAt` と表示される日付の乖離

英語原文サイト (help.testim.io) では、主に以下の 3 つの日付情報を扱います。

1. **`script#ssr-props` の `document.updated_at`**
   - page-specific な絶対日時
   - 例: `"updated_at":"2025-09-18T21:08:46.000Z"`
   - actionable 判定の primary source として使う
   - project timezone (`Asia/Tokyo`) で日付化する

2. **HTML メタデータの `updatedAt` フィールド**
   - HTML ソース内の JSON データに含まれる
   - 例: `"updatedAt":"2025-11-13T13:52:49.000Z"`
   - platform / version metadata を拾うことがある
   - signal として保持する

3. **ページに表示される相対日付**
   - ユーザーに表示される日付
   - 例: "Updated about 2 months ago"
   - `document.updated_at` が取れない場合の fallback として扱う

### 現在の実装

自動化スクリプトは `resolvedSourceDate` と `comparisonSourceDate` を分けて扱います。

- `resolvedSourceDate`
  - 生の source date として保持する値
  - 原則は `document.updated_at`
- `comparisonSourceDate`
  - `needsUpdate` / `daysBehind` / `updated` 自動更新に使う値
  - まず `document.updated_at` を使う
  - それが無い場合のみ `updatedAt` と表示日付の乖離を見て表示日付を優先する

HTML の metadata `updatedAt` は技術的に取得しやすい絶対日付ですが、以下の制限があります。

- ページ表示の相対日付と一致しない場合がある
- メタデータ更新とコンテンツ更新が別タイミングで行われる可能性がある
- 一部ページでは `updatedAt` が変わっても本文が変わっていないことがある

`check:updates` の出力ステータスは `outdated / up-to-date / newer / fetch-error / ignored-exception / source-date-divergence / missing-date / missing-source-date` を区別します。`ignored-exception` は例外レジストリの `ignoredSourceDate` と `comparisonSourceDate` が一致した場合だけ適用されます。`source-date-divergence` は `document.updated_at` が取れない場合のみ metadata/display の乖離を fallback signal として扱います。`document.updated_at` が取れるページでは authoritative とみなし、表示相対日付（"Updated X months ago"）との乖離は月単位丸め誤差として `sourceDateDivergence=false` にします（#117）。`documentDisplayDivergence` フラグは diagnostic-only としてスナップショットに保持します。`missing-date` と `missing-source-date` は error state であり、update candidate には含めません。

### 実運用での対応

#### ケース1: 日付が矛盾している場合

**症状:**

- HTML の `updatedAt`: 2025-11-13
- 表示: "Updated about 2 months ago" (約 2025-09-13)

**対応方法:**

1. 英語原文のコンテンツを実際に確認する
2. 前回の翻訳時から実質的な変更があるか判断する
3. 変更がない場合:
   - `comparisonSourceDate` を基準に日本語版の `updated` を維持するか、例外レジストリに登録する
4. 変更がある場合:
   - 翻訳を更新する
   - `updated` は `comparisonSourceDate` に合わせる

#### ケース2: 定期メンテナンス

定期（3 日ごと）の GitHub Actions チェックでは、まず更新差分を検出し、次に parity を確認します。

1. source date の差分で更新候補を検出する
2. ローカル parity で actionable な本文差分を確認する
3. `check:parity:remote:actionable` で actionable な remote parity を確認する
4. `check:summary` で summary と audit manifest を生成する
5. deep-audit で必要に応じて低信頼シグナルも確認する
6. 実質的な変更がある場合のみ翻訳更新する
7. 変更内容に応じて `updated` フィールドを調整する

#### 例外レジストリ

例外は [`scripts/config/date-exceptions.json`](../scripts/config/date-exceptions.json) で管理する。キーは相対パス、値は次の 3 項目を持つ。

- `ignoredSourceDate`
- `reason`
- `reviewedAt`

同じ source date の間だけ例外として扱い、英語原文の日付が進んだら再度 `outdated` として surfaced する。`ignoredSourceDate` には `comparisonSourceDate`、つまり通常は `document.updated_at` を `Asia/Tokyo` で日付化した値を入れる。

## スクリプト使用方法

### 全ファイルの日付確認

```bash
npm run check:dates
```

### 更新が必要なファイルの検出

```bash
npm run check:updates
```

### 日付の一括更新

```bash
# ドライラン（確認のみ）
npm run update:dates

# 実際に更新
npm run update:dates:apply

# 特定フォルダのみ
npm run update:dates:apply -- --pattern recording-tests
```

## ベストプラクティス

1. **自動検出を信頼しすぎない**
   - HTML の日付はあくまで参考値
   - 実際のコンテンツ変更を確認する

2. **段階的な更新**
   - 一度に全ファイルを更新せず、セクションごとに対応する
   - 各更新で実際の変更内容を記録する

3. **例外管理を明示する**
   - 実質変更なしで `updated` が動くページは例外レジストリに登録する
   - 例外は source date と一緒に見直し、次回更新時に再評価する

4. **ドキュメント履歴の維持**
   - Git コミットメッセージに変更内容を記載する
   - 必要に応じて CHANGELOG を作成する

5. **相対日付の活用**
   - 表示される "Updated X months ago" も参考にする
   - 大きな乖離がある場合は要注意

## トラブルシューティング

### `document.updated_at` が見つからない

**原因:**

- ページ構造の変更
- 新しいドキュメント形式

**対応:**

- `script#ssr-props` の抽出ロジックを更新する
- または手動で source date を確認する

### 日付が頻繁に変わる / 全ページ同じ metadata `updatedAt` になる

**原因:**

- 英語サイトで軽微なメタデータ更新が頻繁に発生する
- プラットフォーム側の一括メタデータ更新が走っている

**対応:**

- 実質的なコンテンツ変更がない場合は例外レジストリに登録する
- actionable 判定は `comparisonSourceDate` を優先して確認する
- `resolvedSourceDate` と `comparisonSourceDate` の乖離件数を summary で監視する

### GitHub Actions が失敗する

**原因:**

- ネットワークエラー
- help.testim.io のレート制限

**対応:**

- スクリプトにリトライロジックを追加する
- レート制限を考慮した待機時間を設定する

## 関連ファイル

- `scripts/check_outdated_docs.mjs` - 更新検出
- `scripts/fetch_all_updated_dates.mjs` - 日付一括取得
- `scripts/update_dates_from_english.mjs` - 日付自動更新
- `.github/workflows/scheduled-actionable.yml` - 3 日ごとの actionable チェック
- `.github/workflows/deep-audit.yml` - 手動 deep audit
- `DOCS_REVIEW.md` - レビューガイドライン

---

最終更新: 2026-03-19
