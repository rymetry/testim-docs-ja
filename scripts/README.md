# scripts/

Testim Docs JA の運用スクリプト群。英語原文の同期、翻訳パイプライン、品質チェックを自動化する。

## クイックリファレンス

```bash
# 品質チェック
npm run lint:docs              # Markdown 構文・frontmatter 検証
npm run check:parity           # 未翻訳テキスト・レガシー callout 検出
npm run check:updates          # 英語原文との日付比較
npm run check:summary          # summary / audit manifest 生成

# 同期・更新
npm run docs:sync-sidebar      # SIDEBAR_URLS.md を英語サイトから最新化
npm run docs:pipeline          # 全パイプライン実行（diff モード）

# テスト
npm test                       # 全テスト実行
```

---

## スクリプト一覧

### 品質チェック系

#### check_source_parity.mjs

日本語ドキュメントの翻訳品質を検査する。ローカルチェック（即時）とリモートチェック（英語原文フェッチ）の 2 モードを持つ。

```bash
npm run check:parity                # ローカルチェックのみ（高速）
npm run check:parity:remote         # 英語原文との構造比較も実行
npm run check:parity:remote:actionable  # actionable-only 終了コード
node scripts/check_source_parity.mjs --section="概要"   # セクション絞り込み
node scripts/check_source_parity.mjs --json              # JSON 出力
```

| チェック項目         | モード   | 検出内容                                       |
| -------------------- | -------- | ---------------------------------------------- |
| `untranslated`       | ローカル | 未翻訳の英語テキスト行                         |
| `legacy-callout`     | ローカル | レガシー callout（`> 📘` 等）                  |
| `jsx-callout`        | ローカル | JSX `<Callout>` コンポーネント残留             |
| `h1-in-body`         | ローカル | 本文中の H1 見出し                             |
| `orphan-page`        | ローカル | SIDEBAR_URLS.md に未掲載のページ               |
| `heading-mismatch`   | リモート | 英語原文との見出し数の差異。signal/report-only |
| `image-mismatch`     | リモート | 英語原文との画像数の差異。actionable           |
| `codeblock-mismatch` | リモート | 英語原文とのコードブロック数の差異。actionable |

**出力**: `parity-check-status.json`。`--actionable-only` では actionable 差分がある場合だけ終了コード `1`。summary / audit manifest は `npm run check:summary` で別生成する。

---

#### lint-docs.mjs

WRITING_GUIDE.md に基づく Markdown 構文・frontmatter の検証。

```bash
npm run lint:docs
node scripts/lint-docs.mjs --path="src/content/docs/overview/*.md"
node scripts/lint-docs.mjs --section="概要"
```

**検証項目**: sourceUrl 形式、必須 frontmatter（title, category, updated）、description プレースホルダー残留、内部リンク形式（`/docs/{slug}` のみ）、Testim 機能名の英語保持、コードブロック言語指定、callout タイプ、画像ファイル存在確認

**終了コード**: エラーあり → `1`

---

#### check_outdated_docs.mjs

日本語版の `updated` フィールドと英語原文の更新日を比較し、古くなったドキュメントを検出する。

```bash
npm run check:updates
```

各ファイルの `sourceUrl` にアクセスし、まず `script#ssr-props` 内の `document.updated_at` を page-specific な source date として解決する。`document.updated_at` が取れない場合は既存の metadata / 表示相対日付へ fallback する。同時に actionable 判定用の `comparisonSourceDate` を計算し、`document.updated_at` が無い場合のみ `updatedAt` と表示相対日付の乖離を見て表示相対日付を優先する。

運用上は原文追従を基本にし、実質変更なしのページは [`scripts/config/date-exceptions.json`](./config/date-exceptions.json) で管理する。`outdated` と `newer` は別々に扱い、`newer` は warning review に回す。`source-date-divergence` は `document.updated_at` が取れない場合のみ metadata/display の fallback divergence を signal として報告する。`document.updated_at` が取れるページでは authoritative とみなし、表示相対日付との乖離は月単位丸め誤差として `sourceDateDivergence=false` にする（#117）。`documentDisplayDivergence` は diagnostic-only としてスナップショットに保持する。`metadataDisplayDivergence` は diagnostic-only とし、`needsUpdate` 判定自体は `comparisonSourceDate` に従う。`ignored-exception` も `comparisonSourceDate` 基準で適用する。`missing-date` と `missing-source-date` は error state であり、update candidate には含めない。

**出力**: `docs-update-status.json`。更新必要ありの場合は終了コード `1`

---

#### fetch_all_updated_dates.mjs

全ファイルの英語原文更新日を一括取得してスナップショットを保存する。

```bash
npm run check:dates
```

**出力**: 日付スナップショット + コンソールテーブル。`resolvedSourceDate` / `comparisonSourceDate` / divergence 情報を含み、監査用の初期台帳や比較の種データとして使う

---

#### generate_detection_reports.mjs

`check:updates` と `check:parity` 系の JSON を読み込み、人間向け summary と監査台帳を生成する。

```bash
npm run check:summary
```

**出力**:

- `docs-actionable-report.json`
- `docs-update-summary.md`
- `docs-audit-manifest.json`

---

### 同期・パイプライン系

#### pipeline.mjs

翻訳パイプラインのオーケストレーター。5 ステップを順番に実行し、チェックポイントで途中再開が可能。

```bash
npm run docs:pipeline                              # diff モード（変更分のみ）
npm run docs:pipeline:full                         # full モード（全件）
npm run docs:pipeline -- --section="Overview"      # セクション絞り込み
npm run docs:pipeline -- --no-resume               # 最初から実行
```

**実行ステップ**:

| #   | ステップ       | スクリプト                             | 内容                                    |
| --- | -------------- | -------------------------------------- | --------------------------------------- |
| 1   | `url_collect`  | update_sidebar_urls_from_live.mjs      | サイドバー URL 収集                     |
| 2   | `placeholders` | generate_untranslated_placeholders.mjs | 未翻訳プレースホルダー作成（full のみ） |
| 3   | `fetch`        | fetch_translate_images.mjs             | 英語原文・画像取得                      |
| 4   | `prepare_llm`  | prepare_llm_tasks.mjs                  | LLM 翻訳タスク準備                      |
| 5   | `apply_llm`    | apply_llm_translations.mjs             | 翻訳結果反映                            |

**チェックポイント**: `scripts/.checkpoint` に進捗を保存。同じ `mode`/`section` なら途中ステップから再開する。`--no-resume` で強制リセット。

---

#### update_sidebar_urls_from_live.mjs

英語サイト（help.testim.io）のサイドバーをスクレイピングし、`docs/SIDEBAR_URLS.md` を更新する。

```bash
npm run docs:sync-sidebar
```

サイトマップ XML → ナビゲーション HTML の順でフォールバックしながら URL を収集。既存の翻訳ステータス（✅🔍 / ✅ / ⏳）を保持する。収集 0 件なら即停止。

---

#### fetch_translate_images.mjs

英語原文ページから HTML を取得し、Markdown に変換。画像をダウンロードしてローカルパスに書き換える。

```bash
npm run docs:fetch
node scripts/fetch_translate_images.mjs --mode=full
node scripts/fetch_translate_images.mjs --slug=testim-overview
node scripts/fetch_translate_images.mjs --section="Overview" --limit=5
```

**キャッシュ**: `scripts/.cache/docs-state.json` にコンテンツハッシュを保存し、diff モードで変更検出に利用。

---

#### generate_untranslated_placeholders.mjs

SIDEBAR_URLS.md で ⏳（未翻訳）のページに対して、frontmatter 付きのプレースホルダー Markdown を作成する。

```bash
npm run docs:placeholders
node scripts/generate_untranslated_placeholders.mjs --section="Overview"
```

---

#### prepare_llm_tasks.mjs

翻訳対象ドキュメントの本文を抽出し、LLM 翻訳用タスクファイルを `llm/tasks/` に生成する。

```bash
npm run docs:prepare-llm
node scripts/prepare_llm_tasks.mjs --slug=testim-overview
node scripts/prepare_llm_tasks.mjs --section="Overview"
```

---

#### apply_llm_translations.mjs

`llm/translations/` の翻訳結果を、既存 frontmatter を保持したまま doc ファイルに適用する。

```bash
npm run docs:apply-llm
node scripts/apply_llm_translations.mjs --section="Overview"
```

---

### 修正・正規化系

#### fix-notation.py

ドキュメント全体の表記揺れを一括修正する Python スクリプト。`verify-notation.py` とセットで使用する。

```bash
python3 scripts/fix-notation.py
```

**修正項目**:

| カテゴリ         | 修正内容                                                                               |
| ---------------- | -------------------------------------------------------------------------------------- |
| カタカナ長音     | パラメータ→パラメーター、ブラウザー→ブラウザ、エディタ→エディター、フォルダ→フォルダー |
| 漢字統一         | たとえば→例えば                                                                        |
| PRO機能          | Pro機能/プロ機能/PRO 機能 → PRO機能                                                    |
| 英日スペース     | 英単語・数字と日本語の間に半角スペース挿入                                             |
| 括弧             | 日本語テキスト中の半角 () → 全角（）                                                   |
| レガシー callout | `> 📘`/`> 🚧` → `:::note`/`:::warning`                                                 |
| callout 書式     | `::: note` → `:::note`、英語タイトル翻訳                                               |

**処理対象**: `src/content/docs/**/*.md`（frontmatter の keywords/title/description 含む）

**安全性**: コードブロック・インラインコード・URL・HTML タグ内は全変換でトークン化ベースの自動スキップ。冪等性あり（再実行しても二重変換されない）。スペース挿入はひらがな・カタカナ・漢字のみが対象（日本語句読点の周囲にはスペースは入らない）。

---

#### verify-notation.py

`fix-notation.py` の修正結果を検証するスクリプト。残存する表記揺れを検出する。

```bash
python3 scripts/verify-notation.py
```

**検証項目**: カタカナ長音、たとえば、PRO機能、レガシー callout、callout スペース、英日スペース、半角カッコ

**終了コード**: 問題あり → `1`、問題なし → `0`

---

#### normalize_docs.mjs

ドキュメントの内容と frontmatter を正規化する。

```bash
npm run docs:normalize
node scripts/normalize_docs.mjs --section="概要"
```

**主な変換**: 機能名の日本語→英語置換（`Testim拡張機能` → `Testim Extension`）、リンク形式修正（`/docs/folder/slug` → `/docs/slug`）、frontmatter フィールド順序統一

---

#### update_dates_from_english.mjs

英語原文の更新日を取得し、日本語版の `updated` フィールドを一括更新する。

```bash
npm run update:dates                # ドライラン（変更内容の表示のみ）
npm run update:dates:apply          # 実際にファイルを更新
node scripts/update_dates_from_english.mjs --pattern="overview"
```

`updated` は原文追従を正とし、実質変更なしと判断したページは例外レジストリに寄せる。自動更新で書き込む日付は `comparisonSourceDate` を使い、通常は `document.updated_at` を `Asia/Tokyo` で日付化した値を採用する。`metadataUpdatedAt` の乖離は diagnostic として保持するが、`document.updated_at` と表示日付が一致している限り top-level signal には昇格しない。

---

## 運用メモ

- `scheduled-actionable` では `check:updates` と `check:parity` を主信号にする
- `scheduled-actionable` では最終的に `check:parity:remote:actionable` の結果を `parity-check-status.json` に残す
- `deep-audit` では `check:parity:remote` を使い、`heading-mismatch` は report-only とする
- 監査台帳や summary artifact は人間向け要約と機械可読 JSON を分けて扱う

---

### fix_alt_all.mjs

alt テキストが空の画像にデフォルトの代替テキストを一括挿入する（markdownlint MD045 対応）。

```bash
npm run docs:fix-alt
```

**ルール**: `.gif` → `操作手順アニメーション`、その他 → `スクリーンショット`

---

### sync_frontmatter_from_sidebar.mjs

SIDEBAR_URLS.md のセクション構造に基づいて、各ドキュメントの `category` と `order` を同期する。

```bash
npm run docs:sync-frontmatter           # ドライラン
npm run docs:sync-frontmatter:apply     # 実際にファイルを更新
node scripts/sync_frontmatter_from_sidebar.mjs --list-unmatched
```

---

### report_frontmatter_categories.mjs

frontmatter の `category` フィールドの分布を集計し、SIDEBAR_URLS.md との不整合を報告する。

```bash
npm run docs:report-categories
```

---

### 共有ライブラリ

#### lib/sidebar.mjs

複数のスクリプトから利用される SIDEBAR_URLS.md パーサー。

| エクスポート関数                           | 用途                                      |
| ------------------------------------------ | ----------------------------------------- |
| `parseSidebarSections(text)`               | Markdown テキストをセクション配列にパース |
| `loadSidebarSections()`                    | ファイルから読み込んでパース              |
| `findSidebarSection(sections, name)`       | セクション名で検索                        |
| `getSectionSlugSet(section)`               | セクション内のスラグを Set で返す         |
| `filterItemsBySection(items, sectionName)` | アイテムをセクションでフィルタ            |
| `extractJapaneseLabel(sectionTitle)`       | セクション見出しから日本語ラベルを抽出    |

**利用スクリプト**: lint-docs, fetch_translate_images, prepare_llm_tasks, apply_llm_translations, normalize_docs, generate_untranslated_placeholders, report_frontmatter_categories, sync_frontmatter_from_sidebar

#### そのほかの共有ライブラリ

| ファイル                    | 用途                                         |
| --------------------------- | -------------------------------------------- |
| `lib/project.mjs`           | repo ルート、docs 探索、slug index、FM 読出し|
| `lib/markdown-utils.mjs`    | Markdown 除去、description 自動生成          |
| `lib/source_pages.mjs`      | source date 解決、article 本文抽出           |
| `lib/source_parity.mjs`     | parity issue 生成、severity 付与、要約集計   |
| `lib/detection_reports.mjs` | summary / issue body / audit manifest 生成   |
| `lib/date_exceptions.mjs`   | 例外レジストリ読み込み                       |
| `lib/cli.mjs`               | 直実行判定などの CLI 補助                    |

---

## テスト

```bash
npm test    # node --test scripts/__tests__/*.mjs
```

| テストファイル                                 | 対象スクリプト                    |
| ---------------------------------------------- | --------------------------------- |
| `__tests__/lint_docs.test.mjs`                 | lint-docs.mjs                     |
| `__tests__/fetch_translate_images.test.mjs`    | fetch_translate_images.mjs        |
| `__tests__/update_sidebar_urls.test.mjs`       | update_sidebar_urls_from_live.mjs |
| `__tests__/pipeline.test.mjs`                  | pipeline.mjs                      |
| `__tests__/check_outdated_docs.test.mjs`       | check_outdated_docs.mjs           |
| `__tests__/source_pages.test.mjs`              | lib/source_pages.mjs              |
| `__tests__/source_parity.test.mjs`             | lib/source_parity.mjs             |
| `__tests__/detection_reports.test.mjs`         | lib/detection_reports.mjs         |
| `__tests__/update_dates_from_english.test.mjs` | update_dates_from_english.mjs     |
| `__tests__/lib_project.test.mjs`               | lib/project.mjs                   |
| `__tests__/lib_markdown_utils.test.mjs`        | lib/markdown-utils.mjs            |
| `__tests__/lib_sidebar_label.test.mjs`         | lib/sidebar.mjs                   |

---

## npm スクリプト対応表

| npm コマンド                     | スクリプト                                         | 用途                             |
| -------------------------------- | -------------------------------------------------- | -------------------------------- |
| `lint:docs`                      | lint-docs.mjs                                      | 構文・frontmatter 検証           |
| `check:parity`                   | check_source_parity.mjs                            | 翻訳品質チェック（ローカル）     |
| `check:parity:remote`            | check_source_parity.mjs --remote                   | 翻訳品質チェック（リモート込み） |
| `check:parity:remote:actionable` | check_source_parity.mjs --remote --actionable-only | actionable-only parity           |
| `check:updates`                  | check_outdated_docs.mjs                            | 日付ベースの更新検出             |
| `check:dates`                    | fetch_all_updated_dates.mjs                        | 全日付スナップショット           |
| `check:summary`                  | generate_detection_reports.mjs                     | summary / audit manifest 生成    |
| `update:dates`                   | update_dates_from_english.mjs                      | 日付更新（ドライラン）           |
| `update:dates:apply`             | update_dates_from_english.mjs --apply              | 日付更新（実行）                 |
| `docs:sync-sidebar`              | update_sidebar_urls_from_live.mjs                  | サイドバー URL 同期              |
| `docs:sync-frontmatter`          | sync_frontmatter_from_sidebar.mjs                  | frontmatter 同期（ドライラン）   |
| `docs:sync-frontmatter:apply`    | sync_frontmatter_from_sidebar.mjs --apply          | frontmatter 同期（実行）         |
| `docs:pipeline`                  | pipeline.mjs                                       | パイプライン（diff）             |
| `docs:pipeline:full`             | pipeline.mjs --mode=full                           | パイプライン（full）             |
| `docs:fetch`                     | fetch_translate_images.mjs                         | 英語原文・画像取得               |
| `docs:normalize`                 | normalize_docs.mjs                                 | ドキュメント正規化               |
| `docs:fix-alt`                   | fix_alt_all.mjs                                    | alt テキスト一括挿入             |
| `docs:placeholders`              | generate_untranslated_placeholders.mjs             | プレースホルダー作成             |
| `docs:prepare-llm`               | prepare_llm_tasks.mjs                              | LLM タスク準備                   |
| `docs:apply-llm`                 | apply_llm_translations.mjs                         | LLM 翻訳適用                     |
| `docs:report-categories`         | report_frontmatter_categories.mjs                  | カテゴリ集計                     |

---

## 運用フロー

### 初回セクション整備

```bash
npm run docs:sync-sidebar
npm run docs:pipeline:full -- --section="Overview"
npm run lint:docs -- --section="Overview"
npm run check:parity
npm test && npm run build
```

### 継続メンテナンス（3日ごと）

```bash
npm run docs:sync-sidebar          # 1. URL 最新化
npm run check:updates              # 2. 日付差分検出
npm run check:parity               # 3. 翻訳品質チェック
npm run check:parity:remote:actionable  # 4. actionable remote parity
npm run check:summary              # 5. summary / audit manifest
npm run docs:pipeline              # 6. 変更分の翻訳パイプライン
npm run lint:docs && npm test && npm run build  # 7. QA
```

### CI 連携

自動検知系の workflow は 2 本に分かれる:

1. [`scheduled-actionable.yml`](../.github/workflows/scheduled-actionable.yml)
2. [`deep-audit.yml`](../.github/workflows/deep-audit.yml)

`scheduled-actionable` は issue を create/update/close し、`deep-audit` は artifact と summary のみ残す。

詳細は `docs/OPS_DESIGN.md` を参照。
