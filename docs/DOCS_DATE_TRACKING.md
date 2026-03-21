# スナップショットベースの変更検知

## 概要

このプロジェクトでは、英語原文の更新状況をスナップショットベースで追跡しています。英語ページの生 Markdown（`.md` エンドポイント）をローカルに保存し、git diff で変更を検知します。

## 仕組み

### スナップショットの構造

```text
snapshots/en/
  content/{slug}.md    # 各ページの生 Markdown（.md エンドポイントから取得）
  sidebar.html          # サイドバーナビゲーション（HTML、.md エンドポイントなし）
```

コンテンツスナップショットは `{sourceUrl}.md`（例: `https://help.testim.io/docs/test-status.md`）から取得した生 Markdown をそのまま保存します。正規化処理は不要です。

サイドバーは `.md` エンドポイントがないため、HTML ページから抽出して正規化しています。

### コミット済みスナップショット = 「翻訳済みの英語原文」

```text
snapshots/en/content/{slug}.md (committed) = この英語版を元に翻訳した
snapshots/en/content/{slug}.md (working tree) = 最新の英語版
差分 = まだ翻訳に反映していない英語側の変更
```

### 変更の分類

差分行を自動分類します:

| カテゴリ  | 検出パターン                                                 |
| --------- | ------------------------------------------------------------ |
| `heading` | `^#{1,6}\s`（Markdown 見出し）                               |
| `image`   | `!\[`（Markdown 画像構文）                                   |
| `code`    | ` ^``` `（コードフェンス）                                   |
| `callout` | `^>\s*` + 絵文字（📘📙🚧❗✅👍⚠️）、または `^<Callout\b`（JSX） |
| `content` | その他のテキスト変更                                         |

ページレベルでは `page-added`（新規）、`page-removed`（404化）、`page-changed`（内容変更）に分類されます。

## スクリプト

```bash
# スナップショットの取得
npm run check:snapshots:fetch

# 差分の確認
npm run check:snapshots:diff

# 取得 → 差分を一括実行
npm run check:snapshots
```

### オプション

```bash
# セクション絞り込み
npm run check:snapshots:fetch -- --section="Overview"
npm run check:snapshots:diff -- --section="Overview"

# 単一ページ
npm run check:snapshots:fetch -- --slug=testim-overview

# ドライラン
npm run check:snapshots:fetch -- --dry-run
```

## 運用フロー

### CI 定期チェック（3日ごと）

1. `git checkout`（clean）→ snapshots = コミット済み（翻訳済みベースライン）
2. `npm run check:snapshots:fetch` → snapshots を最新英語で上書き
3. `npm run check:snapshots:diff` → committed vs working tree を比較
4. 差分あり → レポート生成 → GitHub Issue 作成/更新
5. CI は snapshots をコミットしない → 翻訳するまで毎回同じ差分が検出され続ける

### 翻訳作業時

1. `npm run check:snapshots:fetch` — 最新スナップショット取得
2. `npm run check:snapshots:diff` — 変更内容を確認
3. 日本語ドキュメントを翻訳・更新
4. `git add snapshots/en/content/{slug}.md src/content/docs/.../{slug}.md`
5. `git commit` — スナップショットと翻訳を同時コミット → 次回は差分 0

### スナップショットから翻訳入力に再利用

`fetch_translate_images.mjs` は `--from-snapshot` フラグで、ネットワークフェッチの代わりにスナップショットから読み込めます:

```bash
node scripts/fetch_translate_images.mjs --mode=full --from-snapshot
```

### 新規ページ追加時

1. サイドバー diff で新ページ検出
2. 日本語ドキュメントを新規作成
3. スナップショットと翻訳を同時コミット

### ページ削除時

1. `snapshot_update` が 404 マーカー（`<!-- 404: ... -->`）を書き込む
2. `snapshot_diff` が `page-removed` として検出
3. 対応: 日本語ドキュメントの扱いを判断（削除 or アーカイブ）

## 出力ファイル

| ファイル                      | 内容                                 |
| ----------------------------- | ------------------------------------ |
| `snapshot-diff-status.json`   | 変更検知結果（ページごとの差分分類） |
| `parity-check-status.json`    | ローカル parity チェック結果         |
| `docs-actionable-report.json` | Issue 作成用レポート                 |
| `docs-update-summary.md`      | 人間向けサマリー                     |
| `docs-audit-manifest.json`    | レビュー計画用マニフェスト           |

## 初回セットアップ

新しくプロジェクトをクローンした場合、またはスナップショットが存在しない場合のベースライン構築手順:

```bash
# 1. 全ページのスナップショットを取得
npm run check:snapshots:fetch

# 2. snapshots/en/ 以下のファイルをコミット（= 翻訳済みベースライン）
git add snapshots/
git commit -m "feat: 初回英語原文スナップショット"
```

これ以降、`npm run check:snapshots:diff` は committed vs working tree を比較するため、翻訳に反映していない英語側の変更のみが差分として表示されます。

## 関連ファイル

- `scripts/lib/snapshot_normalize.mjs` — サイドバー HTML 正規化
- `scripts/snapshot_update.mjs` — フェッチ & 保存（Markdown + サイドバー HTML）
- `scripts/snapshot_diff.mjs` — 比較 & レポート
- `.github/workflows/scheduled-actionable.yml` — 3 日ごとの定期チェック
- `.github/workflows/deep-audit.yml` — 手動 deep audit

---

最終更新: 2026-03-21
