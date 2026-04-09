# scripts/

Testim Docs JA の運用スクリプト群。英語原文の同期、翻訳パイプライン、品質チェックを自動化する。

## クイックリファレンス

```bash
# 変更検知
npm run check:snapshots        # 英語原文スナップショットの取得・比較
npm run check:snapshots:fetch  # スナップショット取得のみ
npm run check:snapshots:diff   # コミット済み vs 最新の差分比較

# 品質チェック
npm run lint:docs              # Markdown 構文・frontmatter 検証
npm run check:parity           # 未翻訳テキスト・レガシー callout 検出
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

#### snapshot_update.mjs / snapshot_diff.mjs

英語原文のスナップショットベースの変更検知。各ページの HTML コンテンツ（`#mc-main-content`）をローカルに保存し、MadCap Flare TOC データからサイドバー JSON を生成して、git diff で変更を検知する。

```bash
npm run check:snapshots                # 取得→比較を一括実行
npm run check:snapshots:fetch          # スナップショット取得のみ
npm run check:snapshots:diff           # コミット済み vs working tree を比較
npm run check:snapshots:diff -- --slug=overview/testim-overview   # 単一ページ
npm run check:snapshots:fetch -- --section="Overview"    # セクション絞り込み
npm run check:snapshots:fetch -- --slug=overview/testim-overview  # 単一ページ
npm run check:snapshots:fetch -- --dry-run               # フェッチ経路検証のみ（ファイルは書き込まない）
```

**出力**: `snapshot-diff-status.json`。変更は `page-changed`（内容変更）、`page-added`（新規）、`page-removed`（404化）に分類され、差分行は `heading` / `image` / `code` / `callout` / `content` に自動分類される。

**Source-side debt の除外運用 (Issue #255)**: `scripts/lib/source_sync_exclusions.mjs` の registry に登録された slug は fetch は継続するが、以下の特別処理を受ける:

- snapshot HTML file を上書きしない (hand-authored snapshot を凍結参照として温存)
- fetch 結果に対して EN-only recovery probe を実行 (現在 `extractor-empty` のみ自動判定対応、他は fail-close)
- probe が issue を返す → `fetchStatus: "excluded-broken"` (既知 debt 継続)
- probe が null を返す → `fetchStatus: "excluded-recovered"` (upstream 復旧候補)
- `source-sync-status.json` の `excludedPages` / `excludedBrokenPages` / `excludedRecoveredPages` counter に流れる
- freshness 計算 (`computeFreshnessState`) から除外される (既知 debt だけの run は `fresh`)
- debt slug への新規追加は **人間が upstream broken と確認した場合のみ** — 自動除外はしない

復旧候補 (`excluded-recovered`) が出ても自動では registry から削除せず、人間が確認の上 `SOURCE_SYNC_EXCLUSIONS` から該当 entry を削除する。

**managed issue への可視化**: `excludedPages > 0` のとき、freshness が `fresh` であっても `source-sync-health` managed issue が open され、ソース側 debt セクションが issue body に載る。これにより step summary だけでなく GitHub Issue フローでも debt 状態が追跡可能。body 内容が前回と変わらなければ issue は更新されない (sync-detection-issues の body 比較ガード)。

**recovery probe の expected 照合**: `recoveryProbe` には `expectedMatch: boolean` が付与される。registry の `expectedIssueType` / `expectedReason` と実際の detector 出力が一致すれば `true` (想定どおり broken)、不一致なら `false` (broken 理由が変わった — registry 更新を検討)。

---

#### check_source_parity.mjs

日本語ドキュメントの翻訳品質をローカルチェックする。

```bash
npm run check:parity                                      # ローカルチェック
npm run check:parity -- --slug=overview/testim-overview            # 単一ページ
node scripts/check_source_parity.mjs --section="概要"     # セクション絞り込み
node scripts/check_source_parity.mjs --json               # JSON 出力
npm run check:parity -- --fail-on=actionable              # actionable + error で exit 1
npm run check:parity -- --fail-on=any                     # acknowledgement を除いた active issue > 0 で exit 1
```

**ローカルチェック（actionable）:**

`localCheck()` は body のみを見るため、sidebar 関係の検査は **page coverage gate** に集約されている (`scripts/lib/source_parity_page_coverage.mjs`)。

| チェック項目                | 検出内容                                       | エミッタ           |
| --------------------------- | ---------------------------------------------- | ------------------ |
| `untranslated`              | 未翻訳の英語テキスト行                         | localCheck         |
| `legacy-callout`            | レガシー callout（`> 📘` 等）                  | localCheck         |
| `jsx-callout`               | JSX `<Callout>` コンポーネント残留             | localCheck         |
| `h1-in-body`                | 本文中の H1 見出し                             | localCheck         |
| `image-mismatch`            | 画像数の不一致                                 | snapshot 比較      |
| `codeblock-mismatch`        | コードブロック数の不一致                       | snapshot 比較      |
| `image-order-mismatch`      | 画像の配置順が原文と異なる                     | snapshot 比較      |
| `callout-nesting-mismatch`  | callout のネストレベルが原文と異なる           | snapshot 比較      |
| `source-page-missing-local` | EN sidebar にあるが local 未作成               | page coverage gate |
| `local-page-orphan`         | local file が EN sidebar に未掲載              | page coverage gate |
| `missing-fresh-snapshot`    | sourceUrl があるが fresh な EN snapshot が無い | page coverage gate |

**スナップショット構造比較（signal）:**

| チェック項目                  | 検出内容                                           | gate 分類    |
| ----------------------------- | -------------------------------------------------- | ------------ |
| `section-count-mismatch`      | H2-H4 セクション数の不一致                         | audit-only   |
| `step-count-mismatch`         | 番号付きステップ数の不一致                         | audit-only   |
| `bullet-count-mismatch`       | 箇条書き数の不一致                                 | audit-only   |
| `paragraph-count-mismatch`    | 段落数の不一致（diff >= 1）                        | audit-only   |
| `heading-mismatch`            | 見出しレベル / テキストの不一致                    | audit-only   |
| `table-shape-mismatch`        | テーブル行数・列数の不一致                         | audit-only   |
| `table-cell-english-residual` | テーブルセルの英語残留                             | audit-only   |
| `table-cell-empty-mismatch`   | テーブルセルの空/非空不一致                        | audit-only   |
| `table-cell-token-mismatch`   | テーブルセルの invariant token 不一致              | audit-only   |
| `missing-snapshot`            | EN snapshot が存在しないページ                     | gate signal  |
| `section-structure-mismatch`  | EN/JA の section body で block kind 多重集合が違う | reportable   |
| `segment-order-mismatch`      | section 内 block 種別の並びまたは content 順が違う | reportable   |
| `snapshot-incomplete`         | EN snapshot が shallow/extractor-empty で比較不能  | advisory     |
| `source-unusable`             | EN snapshot が malformed details で復元不能        | advisory     |

**audit-only signals**: 上記の `audit-only` 印が付いた 9 種は coarse counting / shape / table-cell heuristics で、`segment-*` exact diff engine と重複した noise になりがちなため `parity-regression` issue body と gate exit code から除外される。`parity-check-status.json` には引き続き出力され、`deep-audit` workflow と `npm run check:parity -- --include-audit-signals` でのみ詳細を確認できる。`gate signal` 印は新規 / 欠落ページ検知のために gate にとどめる。allowlist は `scripts/lib/source_parity_types.mjs` の `COARSE_SIGNAL_TYPES` に集約されており、新 issue type を追加するときは review で「audit-only か gate-eligible か」を必ず判断する。

**structure comparator (Issue #247)**: `alignSegments` が weighted LCS を走らせる前に、heading path が一致する section ごとに canonical block sequence を比較する。block 単位の語彙は `paragraph` / `ordered-list` / `unordered-list` / `callout-body` / `table` / `details-summary` の 6 種に凍結されており、segment 単位の list item / table cell は比較前に対応する list / table block に畳まれる。

3 段階の fall-through で section あたり最大 1 件の diff を emit する:

1. **kind-multiset** (`section-structure-mismatch`) — block 種別の多重集合が違う
2. **kind-sequence** (`segment-order-mismatch`) — 多重集合は一致するが並び順が違う
3. **content-order** (`segment-order-mismatch`) — kind 列は同じだが content bijection が monotonic でない

いずれかが発火すると後続 stage は short-circuit され、alignSegments の weighted LCS も呼ばれない (section body に対して structure issue と segment diff が二重発火しないため)。

**baseline identity**: structure 系 entry の machine identity は **`sectionIndex` + `structureCategory` + `structureFingerprint`** の 3 つ組 (`buildBaselineKey` / `buildBaselineKeyFromEntry`)。`structureFingerprint` は `structureCategory` + `enKinds` + `jaKinds` (content-order では `contentPermutation`) を sha256 に畳み込む。`sectionPath` は entry に保存するが identity key には含めない (同一ページ内で同じ heading text が複数現れる場合に sectionPath が一意にならないため、PR5 Finding 2)。

**source unusability gate**: `detectSourceUsability()` は alignSegments 呼び出し前に EN snapshot の比較可能性を判定する。判定条件は以下:

- `shallow-snapshot` (`snapshot-incomplete`) — raw EN HTML が 800 bytes 以下かつ EN body ≤ 2 かつ JA body ≥ 5 かつ JA/EN ratio ≥ 4
- `extractor-empty` (`snapshot-incomplete`) — clean HTML なのに EN body が 0 で JA body ≥ 3
- `escaped-details-residue` (`source-unusable`) — (通常経路) `&lt;/details&gt;` 残存 **または** open/close 不均衡 **かつ** `enHeadingSegmentCount === 0 && jaHeadingSegmentCount >= 2` を **両方** 満たす / (extractError 経路) `open !== close` の不均衡のみで判定

`escaped-details-residue` は **狭く** narrowing されており、`<details>` 例を本文に含む合法ページ (`advanced-editing/coding-assistant` 等) は false positive にならない。発火したページでは alignSegments が呼ばれない (translation drift と snapshot debt を混ぜないため)。両者とも **advisory のみ** で gate exit code には寄与しないが、`summary.snapshotUnusable*` の独立 counter に集計される。

**acknowledgements**: `parity-acknowledgements.json` で issue に acknowledgement を付与可能。slug + issueType + (detailIncludes or detailRegex) で一致。**issue を結果から削除せず**、`acknowledged: true` タグを付けて非 blocking 化する。`sourceFingerprint` と `reviewAfter` による自動失効あり。

`source-unusable` / `snapshot-incomplete` を ack する場合は `detailIncludes: "[reason=<token>]"` 形式を使う(`token` は `escaped-details-residue` / `shallow-snapshot` / `extractor-empty`)。emitter が `detail` 末尾に埋め込む reason token で狙い撃つ契約で、`source_parity_usability_ack_integration.test.mjs` が detector→matcher round-trip を保証する(Issue #247 post-merge)。

acknowledgement の対象外:

- `NON_ACKNOWLEDGEABLE_TYPES` (`source-page-missing-local`, `segment-missing`, `segment-untranslated`, `segment-token-gap`, `segment-inconclusive`) — gate を suppress すべきでない hard gap
- `COARSE_SIGNAL_TYPES` (audit-only 9 種) — そもそも gate に乗らないため、ack をつけても no-op になる。validation は `validateAcknowledgements` で reject する

→ どちらも `validateAcknowledgements()` がロード時にエラーで弾く。

**`--types` 契約 (Issue #247 post-merge 追加)**: `generate_parity_baseline.mjs --types=<csv>` は PR5 migration 専用で、`TYPES_ARG_ALLOWLIST` (`section-structure-mismatch` / `segment-order-mismatch` / `snapshot-incomplete` / `source-unusable` の 4 type) のみを受理する。空文字 (`--types=`) や typo、既存 `segment-*` type を渡すと `validateTypesArg` が fail-fast する。`scripts/__tests__/generate_parity_baseline.test.mjs` の `Issue #247 post-merge — validateTypesArg` suite が契約を pin。

**Orphan baseline entry の検出 (Issue #247 post-merge 追加)**: detector / extractor / preprocessor の仕様変更で runtime が emit しなくなった baseline entry は `check:parity` の summary (`orphanBaselineEntries` / `orphanBaselineByType`) に集計され、CLI と followup report で可視化される。`--slug=<slug>` で該当 slug を再生成すると orphan は purge される。E2E は `scripts/__tests__/source_parity_orphan_integration.test.mjs` が pin する (temp dir 上の copy を使った isolated test)。

**出力**: `parity-check-status.json`。

---

#### lint_docs.mjs

WRITING_GUIDE.md に基づく Markdown 構文・frontmatter の検証。

```bash
npm run lint:docs
node scripts/lint_docs.mjs --path="src/content/docs/overview/*.md"
node scripts/lint_docs.mjs --section="概要"
```

**検証項目**: sourceUrl 形式、必須 frontmatter（title, category, updated）、description プレースホルダー残留、内部リンクターゲット存在確認（パスベース `/docs/{folder}/{slug}` 形式のみ）、Testim 機能名の英語保持、コードブロック言語指定、callout タイプ、画像ファイル存在確認

**終了コード**: エラーあり → `1`

---

#### generate_detection_reports.mjs

`check:snapshots` と `check:parity` の JSON を読み込み、人間向け summary と監査台帳を生成する。

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

英語サイト（docs.tricentis.com/testim）のサイドバーをスクレイピングし、`docs/SIDEBAR_URLS.md` を更新する。

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
node scripts/fetch_translate_images.mjs --slug=overview/testim-overview
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
node scripts/prepare_llm_tasks.mjs --slug=overview/testim-overview
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

**主な変換**: 機能名の日本語→英語置換（`Testim拡張機能` → `Testim Extension`）、frontmatter フィールド順序統一

---

## 運用メモ

- `scheduled-actionable` では `check:snapshots` と `check:parity` を主信号にする
- `deep-audit` ではセクション単位のスナップショット diff を実行する
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

**利用スクリプト**: lint_docs, fetch_translate_images, prepare_llm_tasks, apply_llm_translations, normalize_docs, generate_untranslated_placeholders, report_frontmatter_categories, sync_frontmatter_from_sidebar

#### そのほかの共有ライブラリ

| ファイル                                 | 用途                                                                          |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| `lib/project.mjs`                        | repo ルート、docs 探索、slug index、FM 読出し                                 |
| `lib/markdown-utils.mjs`                 | Markdown 除去、description 自動生成                                           |
| `lib/madcap_toc.mjs`                     | MadCap Flare TOC データ解析、slug 抽出、サイドバー JSON 生成                  |
| `lib/turndown.mjs`                       | TurndownService + MadCap Flare カスタムルール（callout, ordered-list, table） |
| `lib/source_parity.mjs`                  | parity API の facade（checks / types / summary を再 export）                  |
| `lib/source_parity_checks.mjs`           | parity の個別チェックロジック                                                 |
| `lib/source_parity_types.mjs`            | parity issue type 定義・検出パターン                                          |
| `lib/source_parity_summary.mjs`          | parity 集計・要約生成                                                         |
| `lib/source_parity_acknowledgements.mjs` | parity acknowledgement モデル                                                 |
| `lib/source_parity_page_coverage.mjs`    | ページ単位の coverage gate                                                    |
| `lib/source_parity_segments_shared.mjs`  | canonical segment 型・正規化・fingerprint                                     |
| `lib/source_parity_segments_en.mjs`      | EN HTML 直接 canonical segment extractor (turndown 非依存)                    |
| `lib/source_parity_segments_ja.mjs`      | JA markdown canonical segment extractor                                       |
| `lib/source_parity_align.mjs`            | section-anchored exact diff engine (segment-missing / extra / ...)            |
| `lib/source_sync_health.mjs`             | source-sync freshness state                                                   |
| `lib/mutation_corpus.mjs`                | diff=1 mutation 生成 (recall 測定用)                                          |
| `lib/detection_reports.mjs`              | summary / issue body / audit manifest 生成                                    |
| `lib/cli.mjs`                            | 直実行判定などの CLI 補助                                                     |

##### canonical segment 抽出の位置づけ

`source_parity_segments_*.mjs` は exact diff engine が EN / JA を比較するための最小単位 (segment) を生成する canonical segment extractor。

- **EN extractor**: `source_parity_segments_en.mjs` — MadCap Flare HTML を直接 tokenize → tree → walk して segment を生成する。turndown の markdown 変換層を経由しない。
- **JA extractor**: `source_parity_segments_ja.mjs` — JA markdown を line-by-line で分類し、pipe table / HTML table / callout / details / image / list を segment にマップする。
- **共通**: `source_parity_segments_shared.mjs` — `Segment` 型、`normalizeSegmentText`, `computeSegmentFingerprint`, `pushHeading` / `buildSectionPath`, `createSegment` factory。
- **境界安定性ベンチマーク**: `__tests__/source_parity_segments_boundary.test.mjs` が代表 10 ページで EN / JA の segment 数を突き合わせ、平均 stability score ≥ 0.95 / 最小 ≥ 0.85 を保証する。headings / ordered-list-item / unordered-list-item は完全一致が必須。結果は `__tests__/fixtures/source-parity-goldens/segment-boundary-report.json` に書き出される（レビュー時に参照可）。

##### Section-anchored exact diff engine

`source_parity_align.mjs` は canonical segments を入力として EN / JA を最小単位で比較し、5 種の diff issue type を出力する section-anchored exact diff engine。

- **入力**: `extractSegmentsFromHtml(en)` と `extractSegmentsFromMarkdown(ja)` の出力 (gate-eligible kinds + heading)
- **出力**: `{ diffs, sectionsAligned, inconclusive, inconclusiveReason }`

**アルゴリズム**:

1. EN/JA を `heading` 単位で section に分割する（最初は preface = 見出し前の本文）
2. heading 数が一致しない場合は `inconclusive: true` を返してフォールバックさせる
3. **Section content validation (high-confidence shift)**: section ペアの invariant token 集合が disjoint で **かつ** 別の section ペアと cross overlap が成立する場合のみ body swap と判定し `segment-shifted` (`confidence: 'high'`) を 1 件発行する（symmetric destination evidence を要求）。zero overlap 単独では発火しないので、単発の token mismatch（`--proxy` → `--token` 誤訳など）が誤って structural shift に分類されない
4. section ペアごとに **weighted LCS** (`scoreSegmentMatch` + `weightedLcs`) を実行する。各候補ペアにスコアを付けて、累積スコアを最大化する monotonic alignment を選ぶ:
   - kind 一致が必須（不一致 → 0）
   - `sourceFingerprint` 一致 → 1000
   - `textNorm` 一致 → 500
   - 双方に invariant token があり overlap あり → 100 + 10/token
   - 双方に invariant token があり overlap なし → 0（強い非マッチ）
   - 双方が ASCII のみで textNorm 不一致 → 0（同言語ペナルティ）
   - それ以外（tokenless cross-language）→ 1〜15（**正規化位置の近さ + 文字列長の類似度** によるベストエフォート weak score）
5. EN-side unmatched → `segment-missing`、JA-side unmatched → `segment-extra` または `segment-untranslated`
6. Matched ペアごとに invariant token 集合を比較し、差分を `segment-token-gap` として出力。さらに JA 側が英文のままなら `segment-untranslated` を追加

> **Weighted LCS の効能**: boolean LCS は同 kind が連続する section で最後の matched index に偏り、tokenless な中央削除を `enSegmentIndex=0` に誤同定する欠陥があった。Weighted LCS は強い anchor（fingerprint / token）を最優先に配置し、anchor のない中央 segment は位置スコアで自然に揃うので、reviewer が指摘した `EN=[Alpha,Beta,Gamma] / JA=[アルファ,ガンマ]` の中央削除でも正しく `enSegmentIndex=1` を返す。
>
> **検出範囲の明確化**:
> - **token-bearing section swap** (`section-body-swap` mutation type): symmetric destination evidence を満たすので `segment-shifted` (`confidence: 'high'`) として recall 100%。
> - **tokenless free-form section swap**: exact gate では `segment-shifted` を出さない。長さシグナルだけで swap を推定すると正常翻訳を false inconclusive にしやすいため、`inconclusive` に落とすのは current/swap が **ほぼ区別できない near-tie** の場合に限定する。つまり tokenless prose-only swap は基本的に exact scope 外であり、後続の `tokenless-near-tie` review queue で surfacing する。
> - **tokenless cross-language の head/tail 段落削除**: 位置スコアが対称になるため `segment-missing` 1 件は出るが、どの段落が gap か (`enSegmentIndex`) は best-effort。中央削除は位置非対称性で正しく特定できる。
> - **正常翻訳された tokenless free-form section**: `segment-shifted` は出ない。near-tie だけを `inconclusive` にするので、広範囲な false inconclusive は起こさない。

各 ParityDiff は構造化メタデータ (`enSegmentIndex`, `jaSegmentIndex`, `enSourceFingerprint`, `jaSourceFingerprint`, `missingTokens`) を持ち、4-family detection report と issue sync が drilldown できる。

**gate issue type と severity**:

| type | severity | acknowledgement | confidence variants |
| ---- | -------- | --------------- | ------------------- |
| `segment-missing` | actionable | non-acknowledgeable | — |
| `segment-extra` | actionable | acknowledgeable（翻訳側の意図的拡張がありうる） | — |
| `segment-shifted` | actionable | acknowledgeable | `high` (symmetric destination evidence) |
| `segment-untranslated` | actionable | non-acknowledgeable | — |
| `segment-token-gap` | actionable | non-acknowledgeable | — |

**Runtime wiring (primary gate)**:

`check_source_parity.mjs` は `alignSegments()` を直接呼ぶ。`inconclusive` 時は、alignment がすでに見つけた exact diff を保持したまま `segment-inconclusive` issue を追加し、既存の `compareSnapshotStructure()` にフォールバックする。これは heading count mismatch だけでなく、tokenless free-form section が **near-tie で clean か swap かを判定しきれない** ケースも含む。segment-* issue は primary gate の actionable / active 集計に入り、cutover 時点の既知 drift は `parity-baseline.json` で `baselined: true` にタグ付けされ active 集計から除外される。

runtime gate は `active*` 集計だけを使い、baseline / advisory queue は follow-up reporting 用に保持する。`source_parity_align_runtime.test.mjs` が facade re-export、`parityDiffsToIssues` の shape、`summarizeParityResults` の primary-gate / baseline 集計、`check_source_parity --slug=...` 経由の JSON / CLI 出力を end-to-end で検証する。

**Recall ベンチマーク**: `__tests__/source_parity_recall.test.mjs` が代表 10 ページに対し、`mutation_corpus` の 10 種の mutation を全部適用し、検出率を測る。

検出は **section-scoped + signature-aware**:

- (A) 影響を受けた section の mutated 側に新しい diff があり、その `type` / `segmentKind` が mutation の期待 signature にマッチする
- (B) baseline 側に「削除された JA 段落の `jaSourceFingerprint` を指す」diff があり、それが mutated で消えている

(A) は「正しい場所で正しい種類の新規 diff が出た」、(B) は「baseline で既に flag されていた segment-extra が削除によって解消された」を捕捉する。どちらも alignment が当該 segment を正しく追跡している証拠なので detection と判定する。

**Recall / cascade / precision の運用基準**:

| 判定軸 | 閾値 | 現状 |
| ------- | ---- | ---- |
| diff=1 mutation の recall（strict, **conclusive exact diff**） | 100% | **9/9 strict mutation type で 100%** (paragraph / bullet / step / callout / table-cell / html-table-cell / **section-body-swap** (token-bearing) / en-residual / token-drop) |
| cascade（diff=1 mutation あたりの新規 diff 数） | ≤ 6 | 最大 2 |
| precision baseline（1 ページあたりの baseline diff 数） | ≤ 60 | 最大 35 |

`segment-move` は cross-language で content が swap されるケースの検出が token 依存になるので、strict-recall set からは除外して informational 扱い（現状 1/8）。`section-body-swap` の strict-recall は corpus 内の token 持ち swap を対象にしている。tokenless prose-only swap は exact gate で `segment-shifted` にせず、near-tie の曖昧ケースだけ `inconclusive` に落とし、`tokenless-near-tie` review queue で surfacing する（新しい semantic detector は導入しない）。

---

## Frozen Baseline + Gate Promotion

frozen baseline 機構は exact diff engine を deterministic に primary gate へ
昇格させるための運用契約。cutover 時点の既存 drift を `parity-baseline.json`
で凍結し、新規発生の `segment-*` issue だけ gate fail させる。

**設計原則**:

- baseline と acknowledgement は別ファイル（責務分離）
- baseline 同定キーは ownership ごとに分岐し、index に加えて
  owner-side fingerprint を含める:
  - **EN-owned** (`segment-missing`):
    `slug + issueType + sectionPath + segmentKind + enSegmentIndex + enSourceFingerprint`
  - **EN-owned (token gap)** (`segment-token-gap`):
    `slug + issueType + sectionPath + segmentKind + enSegmentIndex + enSourceFingerprint + missingTokens`
  - **EN+JA matched pair** (`segment-shifted`):
    `slug + issueType + sectionPath + segmentKind + enSegmentIndex + enSourceFingerprint + jaSourceFingerprint`
  - **JA-owned** (`segment-extra` / `segment-untranslated`):
    `slug + issueType + sectionPath + segmentKind + jaSegmentIndex + jaSourceFingerprint`
  - **page-level** (`segment-inconclusive`):
    `slug + issueType + inconclusiveCategory`
- page-level snapshotFingerprint で conservative に invalidate（EN snapshot
  が変わったら、そのページの baseline 全エントリを一括で剥がす）
- `segment-inconclusive` は actionable / non-acknowledgeable のまま、
  構造化 enum (`heading-count-mismatch` / `align-exception` /
  `tokenless-near-tie`) で同定

**ファイル**:

- `scripts/lib/source_parity_baseline.mjs` — schema validation, key 生成,
  page-level invalidation を含む tagging（純粋関数のみ）
- `scripts/generate_parity_baseline.mjs` — baseline 生成 CLI
  - `--regenerate` で full、`--slug=<csv>` で partial 再生成
  - 入力の `parity-check-status.json` は full `npm run check:parity` 実行結果が必須
  - `--rationale=<text>` / `--review-after=<YYYY-MM-DD>` で再現性を確保
  - 出力は deterministic（`parity-check-status.json` の
    `summary.checkedAt` を `generatedAt` / `generatedFromRunId` の seed に使い、
    安定ソート + 2-space indent + LF 終端）
- `parity-baseline.json` — frozen baseline file (entries は staggered reviewAfter で
  cliff failure を防ぐ)

**npm script**:

```bash
npm run check:parity                                    # baseline tagging を含む実行
npm run generate:parity-baseline -- --regenerate        # 完全再生成
npm run generate:parity-baseline -- --slug=overview/foo # 部分再生成
```

**運用契約**:

- gate: `segment-*` issue は primary gate の actionable 集計に乗り、frozen baseline
  で既存 drift を active 集計から除外する
- recall benchmark: 9/9 strict mutation type で 100% を維持する (Recall ベンチマークの節を参照)
- baseline 失効: `reviewAfter` を過ぎた entry は gate に refire する。
  paydown は明示的な PR で進め、期限切れの自動再点火に頼らない
- snapshot drift で baseline が invalidate された場合は translate-first を原則とし、
  rebaseline は justification 必須の例外として扱う

**rollback playbook**: `docs/OPS_DESIGN.md` の Frozen Baseline Rollback Playbook を参照。
false negative 疑い時は即 revert (Path 1)、snapshot drift による invalidation は
translate-first / rebaseline-as-last-resort (Path 2)。

---

## Tokenless near-tie review queue

provider-free な advisory レイヤー。`segment-inconclusive` のうち
`inconclusiveCategory === 'tokenless-near-tie'` を **review queue として
surfacing** する補助表示で、新 issue type / semantic provider / benchmark は
持たない。queue は人手だけでなく、LLM / workflow がそのまま読める補助データ
として扱う。

**CLI**:

```bash
npm run check:parity -- --include-advisory
```

このフラグは `[review queue]` セクションを追加するだけで、gate exit code は
変えない。`parity-check-status.json` には常に `advisoryQueue`、
`advisoryQueueScope`、`summary.advisoryQueue*` が出力される。`advisoryQueue`
の各 issue には `queueKey` と section pair 情報が入り、partial run かどうかは
`advisoryQueueScope.isComplete` で判定する。

**review queue の対象**:

- `type === 'segment-inconclusive'`
- `inconclusiveCategory === 'tokenless-near-tie'`

---

## Coarse signal audit demotion

`compareSnapshotStructure` が出していた **coarse counting / shape /
table-cell signals** は audit-only 経路に降格されている。`segment-*` exact
gate と重複した noise を `parity-regression` issue body と gate exit code
から取り除き、`deep-audit` workflow からのみ閲覧可能にする運用契約。

**降格対象 (9 種, allowlist)**: `paragraph-count-mismatch` /
`bullet-count-mismatch` / `step-count-mismatch` / `section-count-mismatch` /
`heading-mismatch` / `table-shape-mismatch` / `table-cell-english-residual` /
`table-cell-empty-mismatch` / `table-cell-token-mismatch`

**降格しない signal**: `missing-snapshot` / `source-snapshot-missing` は
新規 / 欠落ページの gate signal なので残す。`content-root-missing` は
emitter が存在しないため allowlist に入れない。

**counter contract** (`source_parity_summary.mjs`):

- `reportableActiveFiles` / `reportableActiveActionableFiles` — coarse
  signal を除いた active file 数。`gate exit code` と `parityRegression`
  はこれを参照する
- `auditSignalIssues` / `auditSignalFiles` / `auditSignalsByType` —
  coarse signal の集計

既存の `activeFiles` / `activeActionableFiles` は **意味を変更しない**。
downstream 消費者と既存テストが読み続けられるよう、これらの counter は
parallel に維持されている。

**CLI**:

```bash
npm run check:parity                          # exit 0 (coarse signal は無視)
npm run check:parity -- --fail-on=actionable  # 同上
npm run check:parity -- --include-audit-signals  # 詳細表示
```

`--include-audit-signals` は表示専用のフラグで、`--include-advisory` と
同じく gate exit code には影響しない。`docs-update-summary.md` には
`## Audit Signals` セクションが追加され、coarse signal の type 別件数を
別枠で報告する。`## Parity` セクションの active 数は coarse signal を
含まない `reportableActive*` 値を表示する。

**回帰防止** (テストで固定):

- `parityRegression` family の発火条件
- `parityFollowup` / `snapshotDiff` / `sourceSyncHealth` family の挙動
- `auditManifest` の構造（snapshot-driven のまま、`signals[]` への parity
  cross-reference は維持）
- 4-family schema（`buildIssueSpecs(report).length === 4`）
- expired ack / expired baseline 付き coarse signal が gate を再点火
  しないこと

---

## Detection artifact 契約

検知パイプラインが生成する 3 つの JSON artifact はすべて
`schemaVersion` を持ち、`generate_detection_reports.mjs --strict` (CI で
使用) は `loadDetectionInputs({ strict: true })` 経由で
`validateDetectionInputs` を必ず通過させる。

- **`snapshot-diff-status.json`** (`schemaVersion: 1`) —
  必須 top-level: `runId`, `sourceSyncRunId`, `sourceInventoryFingerprint`,
  `runScope`, `checkedAt`, `summary`, `changes`, `sidebar`
- **`source-sync-status.json`** (`schemaVersion: 2`) —
  必須 top-level: `runId`, `checkedAt`, `sourceInventoryFingerprint`,
  `sidebarFingerprint`, `freshnessState`, `runScope`, `summary`, `pages`,
  `errors`。
  `summary` に Issue #255 で追加された counter: `excludedPages` (= 既知
  source-side debt の合計) / `excludedBrokenPages` (未復旧) /
  `excludedRecoveredPages` (upstream 復旧候補)。`pages[n]` には debt slug に
  対してのみ `debtCategory: "source-side-debt"` と `recoveryProbe: {
  issueType, reason } | null` が emit される。excluded は `fetchedPages`
  / `notFoundPages` / `errorPages` のどれにも count されず、`freshnessState`
  計算からも除外される (= 既知 debt だけの run は `fresh` 扱い)
- **`parity-check-status.json`** (`schemaVersion: 1`) —
  必須 top-level: `summary` (含む `checkedAt` / `runScope` / `result` /
  `linkageState` / `freshnessState`), `files`
- **`docs-actionable-report.json`** (`schemaVersion: 1`) —
  必須 top-level: `runScope`, `result`, `freshnessState`, `linkageState`,
  4 family (`snapshotDiff` / `parityRegression` / `sourceSyncHealth` /
  `parityFollowup`)

`summary.result` は `pass` / `fail` / `inconclusive` のいずれか:

- `pass` — fresh source、reportable issue なし、linkage が `linked`
- `fail` — reportable parity issue あり、または error file あり
- `inconclusive` — `freshnessState !== fresh` (stale / partial / broken)、または run linkage が `stale` / `run-mismatch` / `scope-mismatch` / `missing`
  ただし `source-sync-status.json` 自体が存在しない legacy / PR CI run は例外で、linkage `missing` でも `pass` を妨げない

`source-sync-status.json.freshnessState` は source fetch そのものの状態を表し、
`fresh` / `partial` / `broken` を emit する。これに対して
`parity-check-status.json.summary.freshnessState` は parity gate から見た実効値で、
run linkage が `stale` の場合は source-sync の元値に関係なく `stale` に上書きされる。
混同を避けたいときは `linkageState` と対で読む。

`linkageState` は `validateRunLinkage` の戻り値:

- `linked` — `sourceSync.runId === snapshotDiff.sourceSyncRunId` かつ
  sourceInventoryFingerprint と runScope が source-sync / snapshot-diff / parity の 3 者で整合
- `missing` — linkage に必要な field か artifact が無い。source-sync が存在する run では `pass` を妨げる
- `stale` — fingerprints が不一致 (inventory drift)。`pass` を `inconclusive` に降格する
- `run-mismatch` — snapshot-diff が別の source-sync run を参照している。同上
- `scope-mismatch` — full vs partial、または slug/section filter の不一致。同上

これらは `scheduled-actionable.yml` の `--strict` step を通った時のみ
sync される。partial run / 壊れた artifact は `sync-detection-issues.cjs`
の §2 fail-closed step に到達する前に block される。

---

## テスト

```bash
npm test    # node --test scripts/__tests__/*.mjs
```

| テストファイル                                       | 対象スクリプト                          |
| ---------------------------------------------------- | --------------------------------------- |
| `__tests__/check_source_parity.test.mjs`             | check_source_parity.mjs                 |
| `__tests__/lint_docs.test.mjs`                       | lint_docs.mjs                           |
| `__tests__/fetch_translate_images.test.mjs`          | fetch_translate_images.mjs              |
| `__tests__/update_sidebar_urls.test.mjs`             | update_sidebar_urls_from_live.mjs       |
| `__tests__/pipeline.test.mjs`                        | pipeline.mjs                            |
| `__tests__/snapshot_diff.test.mjs`                   | snapshot_diff.mjs                       |
| `__tests__/source_parity.test.mjs`                   | lib/source_parity.mjs                   |
| `__tests__/detection_reports.test.mjs`               | lib/detection_reports.mjs               |
| `__tests__/lib_project.test.mjs`                     | lib/project.mjs                         |
| `__tests__/apply_llm_translations.test.mjs`          | apply_llm_translations.mjs              |
| `__tests__/lib_markdown_utils.test.mjs`              | lib/markdown-utils.mjs                  |
| `__tests__/lib_sidebar_label.test.mjs`               | lib/sidebar.mjs                         |
| `__tests__/turndown.test.mjs`                        | lib/turndown.mjs                        |
| `__tests__/snapshot_update.test.mjs`                 | snapshot_update.mjs                     |
| `__tests__/madcap_toc.test.mjs`                      | lib/madcap_toc.mjs                      |
| `__tests__/mutation_corpus.test.mjs`                 | lib/mutation_corpus.mjs                 |
| `__tests__/source_parity_acknowledgements.test.mjs`  | lib/source_parity_acknowledgements.mjs  |
| `__tests__/source_parity_page_coverage.test.mjs`     | lib/source_parity_page_coverage.mjs     |
| `__tests__/source_sync_health.test.mjs`              | lib/source_sync_health.mjs              |
| `__tests__/source_sync_exclusions.test.mjs`          | lib/source_sync_exclusions.mjs          |
| `__tests__/source_parity_source_side_debt.test.mjs`  | Issue #255 source-side debt 契約統合    |
| `__tests__/source_parity_segments_shared.test.mjs`   | lib/source_parity_segments_shared.mjs   |
| `__tests__/source_parity_segments_en.test.mjs`       | lib/source_parity_segments_en.mjs       |
| `__tests__/source_parity_segments_ja.test.mjs`       | lib/source_parity_segments_ja.mjs       |
| `__tests__/source_parity_segments_boundary.test.mjs` | canonical segment 境界安定性ベンチマーク|
| `__tests__/source_parity_align.test.mjs`             | lib/source_parity_align.mjs             |
| `__tests__/source_parity_recall.test.mjs`            | diff=1 mutation recall ベンチマーク     |
| `__tests__/source_parity_align_runtime.test.mjs`     | exact diff engine runtime integration   |
| `__tests__/source_parity_advisory_queue.test.mjs`    | tokenless-near-tie review queue helper  |
| `__tests__/sync_detection_issues.test.mjs`           | 4-family issue sync (family-key match)  |
| `__tests__/source_parity_issue_state.test.mjs`       | 共有 issue-state predicates             |

---

## npm スクリプト対応表

| npm コマンド                    | スクリプト                                | 用途                               |
| ------------------------------- | ----------------------------------------- | ---------------------------------- |
| `lint`                          | lint:md && lint:docs                      | 全 lint 実行                       |
| `lint:md`                       | lint:md:content && lint:md:repo           | markdownlint 実行                  |
| `lint:md:content`               | markdownlint (docs content)               | コンテンツ MD lint（MD001 無効）   |
| `lint:md:repo`                  | markdownlint (repo docs, .github)         | リポジトリ MD lint                 |
| `lint:docs`                     | lint_docs.mjs                             | 構文・frontmatter 検証             |
| `check:snapshots`               | snapshot_update.mjs && snapshot_diff.mjs  | スナップショット取得→比較          |
| `check:snapshots:fetch`         | snapshot_update.mjs                       | スナップショット取得               |
| `check:snapshots:fetch:dry-run` | snapshot_update.mjs --dry-run             | スナップショット取得（ドライラン） |
| `check:snapshots:diff`          | snapshot_diff.mjs                         | スナップショット差分比較           |
| `check:parity`                  | check_source_parity.mjs                   | 翻訳品質チェック（ローカル）       |
| `check:summary`                 | generate_detection_reports.mjs            | summary / audit manifest 生成      |
| `docs:sync-sidebar`             | update_sidebar_urls_from_live.mjs         | サイドバー URL 同期                |
| `docs:sync-frontmatter`         | sync_frontmatter_from_sidebar.mjs         | frontmatter 同期（ドライラン）     |
| `docs:sync-frontmatter:apply`   | sync_frontmatter_from_sidebar.mjs --apply | frontmatter 同期（実行）           |
| `docs:pipeline`                 | pipeline.mjs                              | パイプライン（デフォルト）         |
| `docs:pipeline:diff`            | pipeline.mjs --mode=diff                  | パイプライン（diff）               |
| `docs:pipeline:full`            | pipeline.mjs --mode=full                  | パイプライン（full）               |
| `docs:fetch`                    | fetch_translate_images.mjs                | 英語原文・画像取得                 |
| `docs:normalize`                | normalize_docs.mjs                        | ドキュメント正規化                 |
| `docs:fix-alt`                  | fix_alt_all.mjs                           | alt テキスト一括挿入               |
| `docs:placeholders`             | generate_untranslated_placeholders.mjs    | プレースホルダー作成               |
| `docs:prepare-llm`              | prepare_llm_tasks.mjs                     | LLM タスク準備                     |
| `docs:apply-llm`                | apply_llm_translations.mjs                | LLM 翻訳適用                       |
| `docs:report-categories`        | report_frontmatter_categories.mjs         | カテゴリ集計                       |
| `format`                        | prettier --write                          | コードフォーマット                 |
| `format:check`                  | prettier --check                          | フォーマットチェック（CI 用）      |

---

## 運用フロー

運用フローの詳細は **[`docs/OPS_DESIGN.md`](../docs/OPS_DESIGN.md)** を参照してください。以下はクイックリファレンスです。

```bash
# ページ単位チェック
npm run check:parity -- --slug=overview/testim-overview
npm run lint:docs -- --path=src/content/docs/overview/testim-overview.md

# 全文チェック
npm run lint:docs && npm run check:parity && npm test && npm run build
```

### CI 連携

自動検知系の workflow は 2 本に分かれる:

1. [`scheduled-actionable.yml`](../.github/workflows/scheduled-actionable.yml)
2. [`deep-audit.yml`](../.github/workflows/deep-audit.yml)

`scheduled-actionable` は 4 family (`source-sync-health` / `snapshot-diff` /
`parity-regression` / `parity-followup`) の issue を sync し、`deep-audit` は
artifact と summary のみ残す。

詳細は `docs/OPS_DESIGN.md` を参照。
