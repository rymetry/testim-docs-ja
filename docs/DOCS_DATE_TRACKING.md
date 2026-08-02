# スナップショットベースの変更検知

## 概要

このプロジェクトでは、英語原文の更新状況をスナップショットベースで追跡しています。英語ページの HTML コンテンツ（`#mc-main-content`）をローカルに保存し、git diff で変更を検知します。

## 仕組み

### スナップショットの構造

```text
snapshots/en/
  content/{slug}.html  # 各ページの HTML コンテンツ（#mc-main-content の innerHTML）
  sidebar.json         # サイドバーナビゲーション（MadCap Flare TOC データから生成）
```

コンテンツスナップショットは各ページの HTML を取得し、`<div id="mc-main-content">` の内部 HTML を抽出してそのまま保存します。

サイドバーは MadCap Flare の TOC データファイル（`Data/Tocs/Main.js` + チャンクファイル）を解析し、セクション構造をJSON形式で保存します。

### コミット済みスナップショット = 「翻訳済みの英語原文」

```text
snapshots/en/content/{slug}.html (committed) = この英語版を元に翻訳した
snapshots/en/content/{slug}.html (working tree) = 最新の英語版
差分 = まだ翻訳に反映していない英語側の変更
```

### 変更の分類

差分行を自動分類します:

| カテゴリ | 検出パターン |
| --- | --- |
| `heading` | `<h1>`〜`<h6>` タグ |
| `image` | `<img>` タグ |
| `code` | `<pre>`, `<code>` タグ |
| `callout` | `<blockquote>` + テーマ属性 |
| `content` | その他のテキスト変更 |

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

`check:snapshots` は fetch が一部失敗しても diff を実行し、`source-sync-status.json` と
`snapshot-diff-status.json` の両方を残します。終了コードは fetch または diff の
どちらかが失敗すれば非0となるため、観測できた差分を報告しつつ同期劣化も隠しません。

### オプション

```bash
# セクション絞り込み
npm run check:snapshots:fetch -- --section="Overview"
npm run check:snapshots:diff -- --section="Overview"

# 単一ページ
npm run check:snapshots:fetch -- --slug=overview/testim-overview

# ドライラン
npm run check:snapshots:fetch -- --dry-run
```

`--dry-run` でもHTML取得とTOCデータ取得の経路は検証されますが、ファイルは書き込みません。

## 運用フロー

### CI 定期チェック（3日ごと）

1. clean な作業ツリーで開始 → snapshots = コミット済み（翻訳済みベースライン）
2. `npm run check:snapshots` → snapshots を最新英語で上書きし、fetch が部分失敗しても committed vs working tree の diff を実行
3. `source-sync-status.json` と `snapshot-diff-status.json` を常に生成し、どちらかの stage が失敗した場合は非0で終了
4. 差分あり → レポート生成 → GitHub Issue 作成/更新
5. CI は snapshots をコミットしない → 翻訳するまで毎回同じ差分が検出され続ける

### 翻訳作業時

1. `npm run check:snapshots:fetch` — 最新スナップショット取得
2. `npm run check:snapshots:diff` — 変更内容を確認
3. 日本語ドキュメントを翻訳・更新
4. `git add snapshots/en/content/{slug}.html src/content/docs/.../{slug}.md`
5. `git commit` — スナップショットと翻訳を同時コミット → 次回は差分 0

### スナップショットから翻訳入力に再利用

`testim_parity.pipeline.fetch_translate_images` はスナップショットから自動的に読み込みます（HTML → Markdown 変換）:

```bash
npm run docs:fetch -- --mode=full
```

### 新規ページ追加時

1. サイドバー diff で新ページ検出
2. 日本語ドキュメントを新規作成
3. スナップショットと翻訳を同時コミット

### ページ削除時

1. `snapshot_update` が HTTP 404、または
   `/secure/testim/alert?type=PageNotFound` へのリダイレクトを論理404として判定し、
   404マーカー（`<!-- 404: ... -->`）を書き込む
2. `snapshot_diff` が `page-removed` として検出
3. 対応: 日本語ドキュメントの扱いを判断（削除 or アーカイブ）

通常のHTTP 200ページで `#mc-main-content` が見つからない場合は404へ読み替えず、
ページ構造変更または取得異常として `errorPages` に計上します。

### Source-side debt（broken upstream）の隔離

upstream 英語原文自体が broken で parity comparator の前提を満たさないページは、`testim_parity.sync_exclusions` の **明示 registry** で管理し、通常の翻訳同期レーンから分離します。現在 active entry はありません。

**運用契約:**

- snapshot fetch は毎回実行する（復旧監視のため）
- snapshot file は上書きしない（hand-authored snapshot を凍結参照として温存）
- fetch 成功時は recovery probe を実行する (`detectSourceUsability()` を再利用し、`extractor-empty` / `shallow-snapshot` / `escaped-details-residue` をそのまま判定。JA 非依存 — synthetic segments を使用)
- probe 結果は `source-sync-status.json` の `fetchStatus` に反映される:
  - `excluded-broken` — 依然 broken（未復旧）
  - `excluded-recovered` — upstream 復旧候補（人間が確認の上、registry から削除）
  - `excluded-fetch-error` — fetch 失敗（live EN を観測できなかった。`errorPages` に計上し freshness を劣化させる）
- `excluded-broken` / `excluded-recovered` は `excludedPages` counter に集計され、`freshnessState` の計算から除外される
- `excluded-fetch-error` は `errorPages` に計上され、freshness を劣化させる（観測能力の欠如は source-sync 劣化）
- `docs-update-summary.md` の `## ソース側 debt` セクションで日本語可視化される

**新規 entry 追加のルール:**

- **自動除外はしない**（false negative を避けるため）
- 人間が upstream broken と目視確認した slug のみ `SOURCE_SYNC_EXCLUSIONS` に追加する
- `expectedIssueType` / `expectedReason` は recovery probe の `detectSourceUsability()` 出力との照合に使用される
- 復旧候補は人間判断で registry から削除する（自動解除はしない）

## 出力ファイル

| ファイル | 内容 |
| --- | --- |
| `snapshot-diff-status.json` | 変更検知結果（ページごとの差分分類） |
| `source-sync-status.json` | fetch metadata + freshness + source-side debt カウンタ (`excludedPages` など) |
| `parity-check-status.json` | ローカル parity チェック結果 |
| `upstream-recovery-status.json` | `en_source_patches` + `source_sync_exclusions` の per-entry status (Axis A: `active` / `stale` / `unknown` / Axis B: `current` / `overdue`)。`npm run check:upstream-recovery` で生成。`.gitignore` 対象で CI artifact として保存される。Schema は `docs/SYSTEM_SPEC.md §上流回復検出` |
| `docs-actionable-report.json` | Issue 作成用レポート (`sourceSyncHealth.enPatchRecovery` / `sourceSyncRecovery` subsection に上記 upstream-recovery-status の派生データを含む) |
| `docs-update-summary.md` | 人間向けサマリー（`## ソース側 debt` セクションを含む） |
| `docs-audit-manifest.json` | レビュー計画用マニフェスト |

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

- `testim_parity.madcap_toc` — MadCap Flare TOC データ解析
- `testim_parity.sync_exclusions` — Source-side debt registry
- `testim_parity.sync_health` — `source-sync-status.json` 生成と freshness 判定
- `testim_parity.detection.snapshot_update` — HTML フェッチ & 保存（コンテンツ HTML + サイドバー JSON + exclusion 分岐）
- `testim_parity.detection.snapshot_diff` — 比較 & レポート
- `.github/workflows/scheduled-actionable.yml` — 3 日ごとの定期チェック（日本語 warning/error メッセージ）
- `.github/workflows/deep-audit.yml` — 手動 deep audit

---

最終確認: 2026-08-03（現行スクリプトと CI ワークフローに照合）
