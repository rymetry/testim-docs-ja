# Copilot Instructions for Testim Help Docs (Japanese)

## プロジェクト概要

Testim ヘルプドキュメント (docs.tricentis.com/testim) の日本語ローカライゼーション。英語原文との構造的パリティを維持しつつ、日本人ユーザーが理解しやすい表現で提供する。Vercel にデプロイ。

## 技術スタック

- **フレームワーク**: Astro 6 + TypeScript（静的サイト生成。Basic 認証有効時は SSR）
- **スタイリング**: Tailwind CSS v4
- **フォント**: Noto Sans JP（Astro 組み込みフォントシステム経由で `fontsource` から読み込み）
- **React**: 検索 UI のみ (`src/components/SearchModal.tsx`, `src/components/search/`)
- **Markdown 処理**: remark-gfm, remark-directive, remark-callout-directives, Shiki (`github-dark-dimmed`)
- **デプロイ**: Vercel（`@astrojs/vercel` アダプター）

## アーキテクチャ

- **コンテンツ**: `src/content/docs/` にカテゴリフォルダで整理された Markdown。スキーマは `src/content.config.ts`（Zod）で定義。
- **ルーティング**: 単一動的ルート `src/pages/docs/[...slug].astro`。レガシー basename URL は `astro.config.mjs` の `redirects` 設定でリダイレクト。
- **ナビゲーション**: `src/lib/docs.ts` の `buildNavigation()` で構築 — `category` frontmatter でグループ化、`docs/SIDEBAR_URLS.md` で順序決定。
- **検索**: `src/components/SearchModal.tsx`（React）でクライアントサイド MiniSearch を実装。データは `/api/search.json` エンドポイントから。
- **レイアウト**: `src/layouts/DocsLayout.astro` が全ドキュメントページをサイドバー（`NavSidebar.astro`）と目次（`TableOfContents.astro`）で包む。
- **認証モード**: 環境変数 `BASIC_AUTH_ENABLED` で SSR+認証（レビュー用）と静的（本番）を切り替え。`src/middleware.ts` 参照。

## スクリプト構成

`scripts/` の運用コードは Python package `scripts/python/src/testim_parity/` が canonical:

| ディレクトリ                     | 責務                                                                       |
| -------------------------------- | -------------------------------------------------------------------------- |
| `testim_parity.detection`        | パリティチェック、スナップショット取得/差分、変更検出                      |
| `testim_parity.pipeline`         | 翻訳パイプライン: EN ソース取得 → プレースホルダー → LLM タスク → 翻訳適用 |
| `testim_parity.tools`            | lint、正規化、frontmatter 同期などのユーティリティ                         |
| `testim_parity.*` shared modules | パリティ解析、turndown、MadCap TOC パーサー等                              |

## コマンド一覧

| コマンド                        | 用途                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`                   | 開発サーバー (http://localhost:4321)                                         |
| `npm run build`                 | プロダクションビルド (`astro check` + build)                                 |
| `npm run check`                 | TypeScript/Astro 型チェックのみ                                              |
| `npm run check:quality`         | 正規品質ゲート（Markdown・docs・Ruff・Python format・mypy）                  |
| `npm run lint`                  | `check:quality` の後方互換エイリアス                                         |
| `npm run lint:docs`             | WRITING_GUIDE 準拠チェック（frontmatter、リンク、callout、機能名、画像存在） |
| `npm run lint:py`               | Python Ruff lint                                                             |
| `npm run format:py:check`       | Python Ruff format check                                                     |
| `npm run typecheck:py`          | Python mypy                                                                  |
| `npm run lint:fix`              | Markdown lint の自動修正                                                     |
| `npm run format`                | Prettier フォーマット (Astro, TS, MD)                                        |
| `npm run format:py`             | Python Ruff formatter                                                        |
| `npm run test`                  | `scripts/__tests__/` のテスト実行                                            |
| `npm run check:parity`          | ソースパリティチェック（構造、テーブル、acknowledgement、EN 正規化）         |
| `npm run check:snapshots`       | EN HTML スナップショット取得 + diff（変更検出）                              |
| `npm run check:snapshots:fetch` | EN HTML スナップショット取得のみ                                             |
| `npm run check:snapshots:diff`  | コミット済み vs ワーキングツリーのスナップショット diff のみ                 |
| `npm run docs:sync-sidebar`     | MadCap Flare TOC データから SIDEBAR_URLS.md を更新                           |
| `npm run docs:pipeline`         | フルドキュメント同期パイプライン実行（取得、翻訳等）                         |

**単一ページコマンド:**

```bash
npm run check:parity -- --slug=overview/testim-overview
npm run check:snapshots:diff -- --slug=overview/testim-overview
npm run lint:docs -- --path=src/content/docs/overview/testim-overview.md
```

全コマンドリファレンス: `scripts/README.md`

## コンテンツ管理

### Frontmatter スキーマ

`src/content.config.ts` で定義。必須フィールド: `title`, `description`, `category`, `updated`, `sourceUrl`。オプション: `order`, `keywords`, `hero`, `hideToc`。

- `description`: 日本語の要約を記載（原文 URL や仮置き文言は不可）
- `sourceUrl`: 英語原文 URL。必須。追跡に使用
- `updated`: 英語原文の更新日に合わせる（編集日に変更しない）
- 内部リンクは `/docs/{slug}` 形式（slug は `src/content/docs/` からの相対パス）

### 正本

- 翻訳対象 URL、カテゴリ順、ページ順は `docs/SIDEBAR_URLS.md` をマスターリストとして扱う

## ドキュメントパイプライン

`testim_parity.pipeline.pipeline` が翻訳ワークフロー全体をオーケストレーション:

1. EN ソース取得
2. プレースホルダー生成 (`testim_parity.pipeline.generate_untranslated_placeholders`)
3. LLM タスク準備 (`testim_parity.pipeline.prepare_llm_tasks`)
4. LLM 翻訳適用 (`testim_parity.pipeline.apply_llm_translations`)

`scripts/.checkpoint` によるチェックポイントベースのレジューム対応。

## スナップショット & パリティ

- **Content スナップショット**: 各 EN ページ HTML から `#mc-main-content` を抽出、`snapshots/en/content/{folder}/{basename}.html` に保存
- **Sidebar スナップショット**: MadCap Flare TOC データをパース、`snapshots/en/sidebar.json` に保存
- **パリティ比較**: EN HTML と JA Markdown を Python extractor で canonical segment 化し、構造比較
- **上流欠陥管理**: 壊れた EN ソースは `testim_parity.sync_exclusions`（page-level freeze）と `testim_parity.en_source_patches` + `_en_source_patches_data.json`（segment-level patch）で隔離。詳細は `docs/UPSTREAM_DEFECTS.md`

## 権威ソース

コンテンツルールやプロジェクト仕様はここでは重複させない。以下を参照:

| ドキュメント                 | 内容                                                                        |
| ---------------------------- | --------------------------------------------------------------------------- |
| `docs/SYSTEM_SPEC.md`        | プロジェクト仕様: アーキテクチャ、検出システム、不変量                      |
| `docs/WRITING_GUIDE.md`      | コンテンツフォーマット: frontmatter、リンク、callout、source-first 構造契約 |
| `docs/TRANSLATION_GUIDE.md`  | 翻訳ワークフロー、自然な日本語ガイドライン、NG/OK パターン、用語テーブル    |
| `docs/OPS_DESIGN.md`         | 運用設計: sync/diff/translate/QA フロー                                     |
| `docs/PARITY_GUIDE.md`       | パリティ維持: 2-mechanism suppression 設計、gate マトリクス                 |
| `docs/DOCS_DATE_TRACKING.md` | スナップショットベース変更検出                                              |
| `docs/SIDEBAR_URLS.md`       | 全ドキュメント URL・カテゴリ・順序のマスターリスト                          |
| `docs/UPSTREAM_DEFECTS.md`   | 上流 EN 欠陥レジストリ                                                      |
| `scripts/README.md`          | 全スクリプト・コマンドの完全リファレンス                                    |

## UI / UX 制約

- レイアウト、カラースキーム、主要コンポーネント配置は公式サイトに準拠する
- ナビゲーションやメニュー文言は日本語で自然かつ直感的な表現に調整する
- Callout は `:::note`, `:::tip`, `:::warning`, `:::caution`, `:::danger`, `:::info` ディレクティブ構文を使用する

## ローカライズ指針

- Testim の機能名、製品名、画面名、固有機能ラベルは原則として英語のまま維持する
- 機能名を日本語へ意訳せず、必要な場合のみ本文で日本語説明を補う
- 直訳で不自然な箇所は意訳も許容するが、原文の意図を損なわないこと
- 詳細なルールとパターンは `docs/TRANSLATION_GUIDE.md` と `docs/WRITING_GUIDE.md` を参照

## 開発ワークフロー

1. 初回セットアップ: `npm install`
2. 開発サーバー: `npm run dev`
3. 本番ビルド: `npm run build`
4. Lint: markdownlint（Markdown）+ `lint:docs`（WRITING_GUIDE 準拠）
5. フォーマット: Prettier（Astro/TypeScript/Markdown）
6. テスト: `npm run test`（`scripts/__tests__/`）
7. パリティ検証: `npm run check:parity && npm run check:snapshots:diff`

## AI アシスタント出力ポリシー

- 常に日本語で応答し、適切な技術用語を用いる
- Testim の機能名や製品固有名詞は英語表記を維持する
- ドキュメント向けに丁寧かつ簡潔な文体を心掛ける
- 仕様が不明瞭な場合は推測で進めず、ユーザーへ確認を促す
- コンテンツルールの重複定義を避け、権威ソースを参照する
