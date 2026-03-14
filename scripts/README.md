# ドキュメント運用スクリプト

このディレクトリには、order.md で定義している継続メンテナンス基盤を支えるスクリプトだけを残しています。

現在の方針は次の通りです。
- `docs/SIDEBAR_URLS.md` を seed 兼 正本として扱う
- 初回は full モード相当で全ページを整備する
- 継続運用では差分検知と更新確認を自動化する
- セクション限定の一時修正スクリプトは残さない

## スクリプト分類

### 1. URL・サイドバー同期

#### `update_sidebar_urls_from_live.mjs`

help.testim.io のサイドバーを取得し、`docs/SIDEBAR_URLS.md` を更新します。

用途:
- seed URL の最新化
- セクション単位の作業範囲更新
- 翻訳対象URL一覧の再生成

実行:

```bash
npm run docs:sync-sidebar
```

注意:
- 現在は live HTML から直接抽出します
- order.md の要件に合わせて、今後は sitemap 優先 + フォールバック + 0件 fail-fast に強化予定です

#### `sync_frontmatter_from_sidebar.mjs`

`docs/SIDEBAR_URLS.md` を基準に、各ページの `category` と `order` を同期します。

用途:
- サイドバー順との整合維持
- frontmatter のカテゴリ揺れ防止

実行:

```bash
npm run docs:sync-frontmatter
npm run docs:sync-frontmatter:apply
```

### 2. 翻訳パイプライン

#### `generate_untranslated_placeholders.mjs`

`docs/SIDEBAR_URLS.md` を読み、未翻訳ページのプレースホルダ Markdown を生成します。

用途:
- 初回 full 整備の足場作成
- 未翻訳スラッグのスキャフォールド生成

実行:

```bash
npm run docs:placeholders
```

#### `prepare_llm_tasks.mjs`

既存 Markdown の本文を抽出して、LLM に渡す翻訳タスクファイルを `llm/tasks/` に生成します。

用途:
- LLM 翻訳の前処理
- frontmatter を壊さず本文だけ翻訳対象に切り出す

実行:

```bash
npm run docs:prepare-llm
```

#### `apply_llm_translations.mjs`

`llm/translations/` 内の翻訳結果を既存ドキュメントに反映します。frontmatter は既存ファイルのものを維持します。

用途:
- LLM 翻訳結果の反映
- 本文のみの差し替え

実行:

```bash
npm run docs:apply-llm
```

### 3. 本文・画像整備

#### `fetch_translate_images.mjs`

英語本文から画像を取得し、ドキュメント本文中の画像参照も整備します。

用途:
- 初回 full 整備時の画像ミラー
- `public/images/` と本文参照の同期

実行:

```bash
npm run docs:fetch
```

#### `fix_alt_all.mjs`

Markdown 内の空 alt 画像を補正します。レポジトリ全体を対象にする汎用スクリプトです。

用途:
- Markdown lint の MD045 対策
- 画像 alt の最低限の正規化

実行:

```bash
npm run docs:fix-alt
```

備考:
- セクション限定版は削除済みです
- 将来的には WRITING_GUIDE 準拠チェックへ統合する想定です

### 4. 更新日・差分検知

#### `check_outdated_docs.mjs`

英語原文と日本語ドキュメントの更新日を比較し、更新が必要なページを検出します。

用途:
- 継続メンテナンスの差分検知
- CI / GitHub Actions での定期チェック

実行:

```bash
npm run check:updates
```

出力:
- `docs-update-status.json`

#### `fetch_all_updated_dates.mjs`

全ページの英語原文更新日をまとめて取得し、スナップショットを保存します。

用途:
- 更新日の棚卸し
- 追跡データのスナップショット取得

実行:

```bash
npm run check:dates
```

出力:
- `docs-dates-snapshot.json`

#### `update_dates_from_english.mjs`

英語原文の更新日を日本語ドキュメントの `updated` に反映します。

用途:
- frontmatter の更新日同期

実行:

```bash
npm run update:dates
npm run update:dates:apply
```

### 5. 診断・補助

#### `report_frontmatter_categories.mjs`

frontmatter の `category` 分布と `docs/SIDEBAR_URLS.md` のカテゴリを比較する診断スクリプトです。

用途:
- カテゴリ揺れの可視化
- frontmatter 整合性確認

実行:

```bash
npm run docs:report-categories
```

## 残しているスクリプト

- `update_sidebar_urls_from_live.mjs`
- `sync_frontmatter_from_sidebar.mjs`
- `generate_untranslated_placeholders.mjs`
- `prepare_llm_tasks.mjs`
- `apply_llm_translations.mjs`
- `fetch_translate_images.mjs`
- `fix_alt_all.mjs`
- `check_outdated_docs.mjs`
- `fetch_all_updated_dates.mjs`
- `update_dates_from_english.mjs`
- `report_frontmatter_categories.mjs`

## 削除したスクリプト

- `fix_alt_test_management.mjs`
  - `fix_alt_all.mjs` と役割が重複しており、対象が Test Management セクションに限定されていたため削除
- `fix_links_test_management.mjs`
  - セクション限定の一時修正で、今後は汎用リンク正規化または品質チェックへ統合すべきため削除

## 基本ワークフロー

### 初回 full 整備

```bash
npm run docs:sync-sidebar
npm run docs:placeholders
npm run docs:prepare-llm
# 翻訳結果を llm/translations/ に配置
npm run docs:apply-llm
npm run docs:fetch
npm run docs:sync-frontmatter:apply
npm run update:dates:apply
npm run docs:fix-alt
npm run lint
```

### 継続メンテナンス

```bash
npm run docs:sync-sidebar
npm run check:updates
npm run check:dates
```

## 今後の統合候補

- URL 収集の fail-fast と sitemap フォールバック実装
- WRITING_GUIDE 準拠の機械チェック追加
- full / diff モードを 1 つの入口コマンドへ統合
- 日付取得ロジックの共通化
