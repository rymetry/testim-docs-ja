# CLAUDE.md

本ファイルは Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供する。

## プロジェクト概要

Testim ヘルプドキュメント (docs.tricentis.com/testim) の日本語ローカライゼーション。Astro 6、Tailwind CSS v4、TypeScript、React（検索 UI のみ）で構築。Vercel にデプロイ。全レスポンス・コンテンツは日本語で記述する。

## コマンド一覧

| コマンド | 用途 |
| -------- | ---- |
| `npm run dev` | 開発サーバー (http://localhost:4321) |
| `npm run build` | プロダクションビルド (`astro check` + build) |
| `npm run check` | TypeScript/Astro 型チェックのみ |
| `npm run lint` | 全 lint (`lint:md` + `lint:docs`) |
| `npm run lint:docs` | WRITING_GUIDE 準拠チェック（frontmatter、リンク、callout、機能名、画像存在、EN/JA structure signature） |
| `npm run lint:fix` | Markdown lint の自動修正 |
| `npm run format` | Prettier フォーマット (Astro, TS, MD) |
| `npm run test` | mjs bridge tests と Python pytest の実行 |
| `npm run check:parity` | ソースパリティチェック（構造、テーブル、acknowledgement、EN 正規化） |
| `npm run check:snapshots` | EN HTML スナップショット取得 + diff（変更検出） |
| `npm run check:snapshots:fetch` | EN HTML スナップショット取得のみ |
| `npm run check:snapshots:diff` | コミット済み vs ワーキングツリーのスナップショット diff のみ |
| `npm run docs:sync-sidebar` | MadCap Flare TOC データから SIDEBAR_URLS.md を更新 |
| `npm run docs:pipeline` | フルドキュメント同期パイプライン実行（取得、翻訳等） |

**単一ページコマンド:**

```bash
npm run check:parity -- --slug=overview/testim-overview
npm run check:snapshots:diff -- --slug=overview/testim-overview
npm run lint:docs -- --path=src/content/docs/overview/testim-overview.md
```

全コマンドリファレンス: `scripts/README.md`

## アーキテクチャ

- **コンテンツ**: `src/content/docs/` にカテゴリフォルダで整理された Markdown ファイル。スキーマは `src/content.config.ts`（Zod バリデーション）で定義。
- **ルーティング**: 単一動的ルート `src/pages/docs/[...slug].astro` — slug は `src/content/docs/` からの相対パス（例: `overview/testim-overview.md` → `/docs/overview/testim-overview`）。レガシー basename URL は `astro.config.mjs` の `buildRedirectMap()` でリダイレクト。
- **ナビゲーション**: `src/lib/docs.ts` の `buildNavigation()` で構築 — `category` frontmatter でグループ化、`docs/SIDEBAR_URLS.md` で順序決定。
- **検索**: `src/components/SearchModal.tsx`（React）でクライアントサイド MiniSearch を実装。データは `/api/search.json` から。
- **レイアウト**: `src/layouts/DocsLayout.astro` が全ドキュメントページをサイドバー（`src/components/navigation/NavSidebar.astro`）と目次（`TableOfContents.astro`）で包む。
- **認証モード**: 環境変数 `BASIC_AUTH_ENABLED` で SSR+認証（レビュー用）と静的（本番）を切り替え。`src/middleware.ts` 参照。
- **ドキュメントパイプライン**: `npm run docs:pipeline` (`testim_parity.pipeline.pipeline`) が翻訳ワークフロー全体をオーケストレーション: EN ソース取得 → プレースホルダー生成 (`testim_parity.pipeline.generate_untranslated_placeholders`) → LLM タスク準備 (`testim_parity.pipeline.prepare_llm_tasks`) → LLM 翻訳適用 (`testim_parity.pipeline.apply_llm_translations`)。checkpoint ベースのレジューム対応。
- **スナップショットパイプライン**:
  - **Content**: 各 EN ページ HTML から `#mc-main-content` を抽出、`snapshots/en/content/{folder}/{basename}.html` に保存。
  - **Sidebar**: MadCap Flare TOC データを `testim_parity.madcap_toc` / `testim_parity.sidebar` でパースし、`snapshots/en/sidebar.json` に保存。
  - **パリティ比較**: HTML スナップショットを `turndown` で Markdown 変換し、JA 翻訳と構造比較。
  - **ソース側負債**: 壊れた上流 EN ソースは `testim_parity.sync_exclusions` の registry で隔離し、スナップショット上書きを抑止して `source-sync-status.json` の exclusion counters で可視化する（詳細は `docs/DOCS_DATE_TRACKING.md`）。

## 権威ソース

- **`docs/SYSTEM_SPEC.md`** — プロジェクト仕様サマリ: アーキテクチャ、検出システム、不変量、ドキュメントインデックス。
- **`docs/WRITING_GUIDE.md`** — コンテンツフォーマットの権威ルール: frontmatter、リンク、callout、source-first 構造契約（見出しマッピング、`:fa-arrow-right:` 処理、`<details>` 保持、JA 独自セクション除去）、Testim 用語の英語保持。
- **`docs/TRANSLATION_GUIDE.md`** — 翻訳ワークフロー、自然な日本語ガイドライン、NG/OK パターン、用語テーブル。
- **`docs/OPS_DESIGN.md`** — 運用設計: sync/diff/translate/QA フロー、レビューポリシー、フィードバックループ、レビューチェックリスト。
- **`docs/PARITY_GUIDE.md`** — パリティ維持: 2-mechanism suppression 設計、gate マトリクス、並列エージェント委譲。
- **`docs/DOCS_DATE_TRACKING.md`** — スナップショットベース変更検出: HTML スナップショット形式、サイドバー JSON 構造、diff 分類、CI ワークフロー、翻訳同期プロセス。
- **`docs/SIDEBAR_URLS.md`** — 全ドキュメント URL、カテゴリ、ページ順序のマスターリスト。ページの存在と構造の単一真実源。
- **`docs/UPSTREAM_DEFECTS.md`** — アクティブな上流 EN 欠陥レジストリ（UD-001..UD-022）、割当プロトコル、除去 SOP。
- **`scripts/README.md`** — 全スクリプト、コマンド、パリティチェック種別、npm スクリプトマッピングの完全リファレンス。

## コンテンツルール

コンテンツルールは権威ソースで定義されている。ここでルールを重複させない — 以下を参照:

- **`docs/WRITING_GUIDE.md`**: frontmatter、内部リンク (`/docs/{slug}`)、callout (`:::`)、source-first 構造契約（見出しマッピング、`:fa-arrow-right:` → 太字、`<details>` 保持、JA 独自セクション除去）、Testim 用語の英語保持
- **`docs/TRANSLATION_GUIDE.md`**: 自然な日本語、NG/OK パターン、用語テーブル、メディア処理

## 開発スタイル

- TDD で開発する（探索 → Red → Green → Refactoring）
- KPI やカバレッジ目標が与えられたら、達成するまで試行する
- 不明瞭な指示は質問して明確にする

## コード設計

- 関心の分離を保つ
- 状態とロジックを分離する
- 可読性と保守性を重視する
- コントラクト層（API/型）を厳密に定義し、実装層は再生成可能に保つ
- 静的検査可能なルールはプロンプトではなく、その環境の linter か ast-grep で記述する

## 言語

- 公開リポジトリではドキュメントやコミットメッセージを英語で記述する

## スキル作成

新規 skill を作るとき、配置先を次の指針で決める:

- **project 固有** (`.claude/skills/` に配置): 特定リポのドメイン知識・規約・ファイルレイアウトに依存し、他リポで使う見込みがない
- **グローバル** (`~/.claude/skills/` に配置): 言語・ツール横断、複数リポで再利用可能、運用ノウハウ
- **判断不能なとき**: ユーザーに質問してから作成（後から移動するとパス参照が壊れやすい）

## レビュー & フィードバック

レビューワークフローとフィードバックループは **`docs/OPS_DESIGN.md`** で定義。要約:

1. セルフチェック → Codex CLI レビュー → 修正 → `npm run lint && npm run test && npm run build`
2. 新しいパターンが見つかったら、影響ファイルだけでなく関連ガイドを更新する

## コア不変量 (`docs/SYSTEM_SPEC.md` より)

本プロジェクトのコア仕様。全作業はこれらの不変量を維持する方向で行う。

**仕様変更ポリシー**: 以下に該当する変更は、必ずユーザーに提案し承認を得てから実施すること。提案自体は歓迎する。

- 不変量の値や条件を変更する（例: counter の期待値を 0 以外にする、gate predicate を緩和する）
- suppression mechanism を追加・廃止する（2-mechanism 契約の変更）
- baseline 運用ルールを変更する（例: entries > 0 を許容する方針転換）
- `docs/SYSTEM_SPEC.md` または `docs/PARITY_GUIDE.md` の仕様記述を書き換える

以下は承認不要（通常の運用作業）: GLOSSARY/INVARIANT_TOKENS への用語・パターン追加、content 修正による parity issue 解消、EN source patch の追加・削除。

**5-counter = 0 DoD**: 以下の 5 counter は全て 0 を維持する。

1. `parity-baseline.json` `entries.length` === 0
2. `parity-check-status.json` `summary.reportableActiveFiles` === 0
3. `parity-check-status.json` `summary.baselinedIssues` === 0
4. `parity-check-status.json` `summary.advisoryQueueIssues` === 0
5. `parity-check-status.json` `summary.auditSignalIssues` === 0

**2-mechanism suppression**: EN 上流欠陥の抑制は以下の 2 mechanism のみ。第三の mechanism は禁止。

- Mechanism 1: page-level freeze (`testim_parity.sync_exclusions`)
- Mechanism 2: segment-level patch (`testim_parity.en_source_patches` + `_en_source_patches_data.json`) → `docs/UPSTREAM_DEFECTS.md` に結線

**Baseline 運用**: Schema v2, `entries.length === 0` を維持。新規 issue は baseline に逃がさず修正で解消する。

詳細は **`docs/SYSTEM_SPEC.md`**、パリティ維持の運用手順は **`docs/PARITY_GUIDE.md`** を参照。

## コミットスタイル

Prefix: `docs:`, `feat:`, `fix:`, etc. ブランチ命名: `claude/{topic}`.
