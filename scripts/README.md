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

| チェック項目               | 検出内容                                               |
| -------------------------- | ------------------------------------------------------ |
| `untranslated`             | 未翻訳の英語テキスト行                                 |
| `legacy-callout`           | レガシー callout（`> 📘` 等）                          |
| `jsx-callout`              | JSX `<Callout>` コンポーネント残留                     |
| `h1-in-body`               | 本文中の H1 見出し                                     |
| `orphan-page`              | SIDEBAR_URLS.md に未掲載のページ                       |
| `image-mismatch`           | 画像数の不一致                                         |
| `codeblock-mismatch`       | コードブロック数の不一致                               |
| `image-order-mismatch`     | 画像の配置順が原文と異なる                             |
| `callout-nesting-mismatch` | callout のネストレベルが原文と異なる                   |
| `sidebar-missing-file`     | SIDEBAR_URLS.md に掲載だがローカルファイルが存在しない |

**スナップショット構造比較（signal）:**

| チェック項目                  | 検出内容                                           |
| ----------------------------- | -------------------------------------------------- |
| `section-count-mismatch`      | H2-H4 セクション数の不一致                         |
| `step-count-mismatch`         | 番号付きステップ数の不一致                         |
| `bullet-count-mismatch`       | 箇条書き数の不一致                                 |
| `paragraph-count-mismatch`    | 段落数の不一致（diff >= 1）                        |
| `table-shape-mismatch`        | テーブル行数・列数の不一致                         |
| `table-cell-english-residual` | テーブルセルの英語残留                             |
| `table-cell-empty-mismatch`   | テーブルセルの空/非空不一致                        |
| `table-cell-token-mismatch`   | テーブルセルの invariant token 不一致              |
| `source-snapshot-missing`     | sourceUrl があるが EN スナップショットが存在しない |

**acknowledgements**: `parity-acknowledgements.json` で issue に acknowledgement を付与可能。slug + issueType + (detailIncludes or detailRegex) で一致。**issue を結果から削除せず**、`acknowledged: true` タグを付けて非 blocking 化する。`sourceFingerprint` と `reviewAfter` による自動失効あり。`source-page-missing-local` / `segment-*` は acknowledgement 不可。

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
| `lib/source_parity_acknowledgements.mjs` | parity acknowledgement モデル（Phase 3）                                      |
| `lib/source_parity_page_coverage.mjs`    | ページ単位の coverage gate（Phase 2）                                         |
| `lib/source_parity_segments_shared.mjs`  | canonical segment 型・正規化・fingerprint（Phase 4）                          |
| `lib/source_parity_segments_en.mjs`      | EN HTML 直接 canonical segment extractor（Phase 4, turndown 非依存）          |
| `lib/source_parity_segments_ja.mjs`      | JA markdown canonical segment extractor（Phase 4）                            |
| `lib/source_parity_align.mjs`            | section-anchored exact diff engine（Phase 5、segment-missing/extra/...）      |
| `lib/source_sync_health.mjs`             | source-sync freshness state（Phase 1）                                        |
| `lib/mutation_corpus.mjs`                | diff=1 mutation 生成（Phase 0、Phase 5 recall 測定用）                        |
| `lib/detection_reports.mjs`              | summary / issue body / audit manifest 生成                                    |
| `lib/cli.mjs`                            | 直実行判定などの CLI 補助                                                     |

##### Phase 4: canonical segment 抽出の位置づけ

`source_parity_segments_*.mjs` は Issue #225 Phase 4 で導入された canonical segment extractor。Phase 5 の exact diff engine が EN / JA を比較するための最小単位 (segment) を生成する。

- **EN extractor**: `source_parity_segments_en.mjs` — MadCap Flare HTML を直接 tokenize → tree → walk して segment を生成する。turndown の markdown 変換層を経由しない。
- **JA extractor**: `source_parity_segments_ja.mjs` — JA markdown を line-by-line で分類し、pipe table / HTML table / callout / details / image / list を segment にマップする。
- **共通**: `source_parity_segments_shared.mjs` — `Segment` 型、`normalizeSegmentText`, `computeSegmentFingerprint`, `pushHeading` / `buildSectionPath`, `createSegment` factory。
- **境界安定性ベンチマーク**: `__tests__/source_parity_segments_boundary.test.mjs` が Phase 0 manifest の 10 ページで EN / JA の segment 数を突き合わせ、平均 stability score ≥ 0.95 / 最小 ≥ 0.85 を保証する。headings / ordered-list-item / unordered-list-item は完全一致が必須。結果は `__tests__/fixtures/source-parity-goldens/segment-boundary-report.json` に書き出される（レビュー時に参照可）。

##### Phase 5: exact diff engine + shadow-mode runtime wiring

`source_parity_align.mjs` は Issue #225 Phase 5 で導入された section-anchored exact diff engine。Phase 4 の canonical segments を入力として、EN / JA を最小単位で比較し、5 種の diff issue type を出力する。

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
7. **Low-confidence section detection (low-confidence shift)**: section ペアが以下を **すべて満たす** 場合、tokenless な本文入れ替わりを否定できないので `segment-shifted` (`confidence: 'low'`) を 1 件発行する
   - 両 body に 2 セグメント以上
   - 全セグメントが free-form kind (paragraph または callout-body) のみ — list / table cell / heading のような structural kind が混じっていない
   - LCS が両 body をすべて pair した（segment-missing/extra のような実 diff がそもそも無い）
   - すべての matched ペアが weak fallback score (kind / position / length のみ、< 100) で結ばれた

> **Weighted LCS の効能**: boolean LCS は同 kind が連続する section で最後の matched index に偏り、tokenless な中央削除を `enSegmentIndex=0` に誤同定する欠陥があった。Weighted LCS は強い anchor（fingerprint / token）を最優先に配置し、anchor のない中央 segment は位置スコアで自然に揃うので、reviewer が指摘した `EN=[Alpha,Beta,Gamma] / JA=[アルファ,ガンマ]` の中央削除でも正しく `enSegmentIndex=1` を返す。
>
> **検出範囲の明確化**:
> - **token-bearing section swap** (`section-body-swap` mutation type): symmetric destination evidence を満たすので `segment-shifted` (`confidence: 'high'`) として recall 100%。
> - **tokenless free-form section swap**: 内容を区別できる anchor が全く無いので、symmetric destination evidence は成立せず、`confidence: 'high'` shift は出ない。代わりに `confidence: 'low'` shift を「section の整合性が検証できない」warning として 1 件出すので silent green にはならない（reviewer の P1 指摘に対応）。具体的にどの段落が swap されたかまでは attribute できない。本格的な区別には translation memory が必要で Phase 6 以降の課題。
> - **tokenless cross-language の head/tail 段落削除**: 位置スコアが対称になるため `segment-missing` 1 件は出るが、どの段落が gap か (`enSegmentIndex`) は best-effort。中央削除は位置非対称性で正しく特定できる。
> - **list / table 含みの section**: structural kind が anchor になるので low-confidence guard は発火しない（false positive 抑制）。

各 ParityDiff は構造化メタデータ (`enSegmentIndex`, `jaSegmentIndex`, `enSourceFingerprint`, `jaSourceFingerprint`, `missingTokens`) を持ち、Phase 6 / Phase 7 の report と issue sync が drilldown できる。

**gate issue type と severity**:

| type | severity | acknowledgement | confidence variants |
| ---- | -------- | --------------- | ------------------- |
| `segment-missing` | actionable | non-acknowledgeable | — |
| `segment-extra` | actionable | acknowledgeable（翻訳側の意図的拡張がありうる） | — |
| `segment-shifted` | actionable | acknowledgeable | `high` (symmetric destination evidence) / `low` (tokenless free-form section, body swap cannot be ruled out) |
| `segment-untranslated` | actionable | non-acknowledgeable | — |
| `segment-token-gap` | actionable | non-acknowledgeable | — |

**Runtime wiring (Phase 5 shadow mode)**:

`check_source_parity.mjs` は Phase 5 から `alignSegments()` を直接呼ぶようになった。`inconclusive` 時のみ既存の `compareSnapshotStructure()` にフォールバックする。発行された segment-* issue は `phase: 'segment-shadow'` でタグ付けされ、`parity-check-status.json` に書き出されるが、`actionable` / `signal` / `activeFiles` のカウントには加算されないので **既存の CI exit code は変わらない**。Phase 6 cutover で `segment-shadow` を主 gate に昇格させる。

shadow accounting は `summarizeParityResults()` の `shadowIssues` / `shadowFiles` / `shadowIssuesByType` で確認できる。`source_parity_align_runtime.test.mjs` が facade re-export、`parityDiffsToIssues` の shape、`summarizeParityResults` の shadow 集計、`check_source_parity --slug=...` 経由の CLI 出力を end-to-end で検証する。

**Recall ベンチマーク**: `__tests__/source_parity_recall.test.mjs` が Phase 0 manifest の 10 ページに対し、`mutation_corpus` の 10 種の mutation を全部適用し、検出率を測る。

検出は **section-scoped + signature-aware**:

- (A) 影響を受けた section の mutated 側に新しい diff があり、その `type` / `segmentKind` が mutation の期待 signature にマッチする
- (B) baseline 側に「削除された JA 段落の `jaSourceFingerprint` を指す」diff があり、それが mutated で消えている

(A) は「正しい場所で正しい種類の新規 diff が出た」、(B) は「baseline で既に flag されていた segment-extra が削除によって解消された」を捕捉する。どちらも alignment が当該 segment を正しく追跡している証拠なので detection と判定する。

**Go/No-Go の判定基準** と **Phase 5 の現状**:

| Go 条件 | 閾値 | 現状 |
| ------- | ---- | ---- |
| diff=1 mutation の recall（strict, **token-bearing**） | 100% | **9/9 strict mutation type で 100%** (paragraph / bullet / step / callout / table-cell / html-table-cell / **section-body-swap** (token-bearing) / en-residual / token-drop) |
| cascade（diff=1 mutation あたりの新規 diff 数） | ≤ 6 | 最大 2 |
| precision baseline（1 ページあたりの baseline diff 数） | ≤ 60 | 最大 35 |

`segment-move` は cross-language で content が swap されるケースの検出が token 依存になるので、strict-recall set からは除外して informational 扱い（現状 1/8）。`section-body-swap` の strict-recall は corpus 内の token 持ち swap を対象にしており、tokenless prose-only swap は 7. の low-confidence guard が `confidence: 'low'` の shift で warning を出すルートで担保している（synthetic 単体テストあり）。

> Phase 5 PoC は **Go**。runtime には shadow mode で接続済み。Phase 6 で `segment-shadow` を主 gate に昇格する（NON_ACKNOWLEDGEABLE_TYPES と既存の baseline drift / low-confidence shift をどう移行するかは Phase 6 の責務）。

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
| `__tests__/source_parity_segments_shared.test.mjs`   | lib/source_parity_segments_shared.mjs   |
| `__tests__/source_parity_segments_en.test.mjs`       | lib/source_parity_segments_en.mjs       |
| `__tests__/source_parity_segments_ja.test.mjs`       | lib/source_parity_segments_ja.mjs       |
| `__tests__/source_parity_segments_boundary.test.mjs` | Phase 4 境界安定性ベンチマーク          |
| `__tests__/source_parity_align.test.mjs`             | lib/source_parity_align.mjs             |
| `__tests__/source_parity_recall.test.mjs`            | Phase 5 diff=1 recall ベンチマーク      |
| `__tests__/source_parity_align_runtime.test.mjs`     | Phase 5 runtime wiring (shadow mode E2E)|

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

`scheduled-actionable` は issue を create/update/close し、`deep-audit` は artifact と summary のみ残す。

詳細は `docs/OPS_DESIGN.md` を参照。
