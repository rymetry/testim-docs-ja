# scripts/

Testim Docs JA の運用スクリプト群。英語原文の同期、翻訳パイプライン、品質チェックを自動化する。

## ディレクトリ構成（責務分離）

| ディレクトリ | 責務                                                                       | 書き込み対象                                                                                | 呼び出し契機                                  |
| ------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `detection/` | **観測**: EN/JA の状態を測定し、差分・乖離・異常を検知する                 | status JSON, snapshots/en/ HTML, parity-baseline.json, report MD                            | `check:*` npm scripts, CI scheduled           |
| `pipeline/`  | **変換**: EN ソースを取得し、翻訳物を生成・適用する                        | `src/content/docs/`, `llm/tasks/`, `public/images/`, `docs/SIDEBAR_URLS.md`                 | `docs:*` npm scripts (pipeline, fetch, apply) |
| `tools/`     | **保全**: lint・正規化・修正ユーティリティ。既存コンテンツの品質を維持する | repo 内 `.md` (fix_alt_all), `src/content/docs/` (normalize/notation), stdout (lint/report) | `lint:*` npm scripts, 手動実行                |
| `lib/`       | **共有基盤**: 上記 3 層から共通的に使われるライブラリ。直接実行されない    | なし (pure library)                                                                         | import のみ                                   |

**分離の核心**:

- `detection/` は `src/content/docs/` (JA コンテンツ) に一切触れない。測定 artifact のみ書き込む
- `pipeline/` は JA コンテンツの生成・更新を行う唯一の層
- `tools/` は既存コンテンツの修正・検証を行う (lint は read-only、fix/normalize は write)
- `lib/` は純粋なライブラリ層（CLI 実行不可、ファイル I/O は呼び出し側の責務）

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

#### snapshot_update / snapshot_diff (`testim_parity.detection`)

英語原文のスナップショットベースの変更検知。各ページの HTML コンテンツ（`#mc-main-content`）をローカルに保存し、MadCap Flare TOC データからサイドバー JSON を生成して、git diff で変更を検知する。

Phase 6b cutover 以降の実体: `testim_parity.detection.snapshot_update` / `testim_parity.detection.snapshot_diff` (Python)。

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

**Source-side debt の除外運用**: `testim_parity.sync_exclusions` (旧 `scripts/lib/source_sync_exclusions.mjs`) の registry に登録された slug は fetch は継続するが、以下の特別処理を受ける:

- snapshot HTML file を上書きしない (hand-authored snapshot を凍結参照として温存)
- fetch 成功時は recovery probe を実行 (`detectSourceUsability()` を再利用し、`extractor-empty` / `shallow-snapshot` / `escaped-details-residue` をそのまま判定。JA 非依存 — synthetic segments を使用)
- probe が issue を返す → `fetchStatus: "excluded-broken"` (既知 debt 継続)
- probe が null を返す → `fetchStatus: "excluded-recovered"` (upstream 復旧候補)
- fetch 失敗 (HTTP error / 404 / mc-main-content missing / throw) → `fetchStatus: "excluded-fetch-error"` (errors に計上、freshness 劣化として可視化)
- `excluded-broken` / `excluded-recovered` は `excludedPages` counter に流れ、freshness 計算から除外される
- `excluded-fetch-error` は `errorPages` counter に流れ、freshness を劣化させる (live EN を観測できないため)
- debt slug への新規追加は **人間が upstream broken と確認した場合のみ** — 自動除外はしない

復旧候補 (`excluded-recovered`) が出ても自動では registry から削除せず、人間が確認の上 `SOURCE_SYNC_EXCLUSIONS` から該当 entry を削除する。

**managed issue への可視化**: `excludedPages > 0` のとき、freshness が `fresh` であっても `source-sync-health` managed issue が open され、ソース側 debt セクションが issue body に載る。これにより step summary だけでなく GitHub Issue フローでも debt 状態が追跡可能。body 内容が前回と変わらなければ issue は更新されない (sync-detection-issues の body 比較ガード)。

**recovery probe の expected 照合**: `recoveryProbe` には `expectedMatch: boolean` が付与される。registry の `expectedIssueType` / `expectedReason` と実際の detector 出力が一致すれば `true` (想定どおり broken)、不一致なら `false` (broken 理由が変わった — registry 更新を検討)。

---

#### check_source_parity (`testim_parity.detection.check_source_parity`)

日本語ドキュメントの翻訳品質をローカルチェックする。Phase 6b cutover で mjs → Python に移行済。

```bash
npm run check:parity                                          # ローカルチェック
npm run check:parity -- --slug=overview/testim-overview       # 単一ページ
npm run check:parity -- --section="概要"                      # セクション絞り込み
npm run check:parity -- --json                                # JSON 出力
npm run check:parity -- --fail-on=actionable                  # actionable + error で exit 1
npm run check:parity -- --fail-on=any                         # acknowledgement を除いた active issue > 0 で exit 1
# 直接実行する場合:
uv run python -m testim_parity.detection.check_source_parity --slug=overview/testim-overview
```

**ローカルチェック（actionable）:**

`local_check()` は body のみを見るため、sidebar 関係の検査は **page coverage gate** に集約されている (`testim_parity.detection.source_parity_page_coverage`)。

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

| チェック項目                  | 検出内容                                           | gate 分類   |
| ----------------------------- | -------------------------------------------------- | ----------- |
| `section-count-mismatch`      | H2-H4 セクション数の不一致                         | audit-only  |
| `step-count-mismatch`         | 番号付きステップ数の不一致                         | audit-only  |
| `bullet-count-mismatch`       | 箇条書き数の不一致                                 | audit-only  |
| `paragraph-count-mismatch`    | 段落数の不一致（diff >= 1）                        | audit-only  |
| `heading-mismatch`            | 見出しレベル / テキストの不一致                    | audit-only  |
| `table-shape-mismatch`        | テーブル行数・列数の不一致                         | audit-only  |
| `table-cell-english-residual` | テーブルセルの英語残留                             | audit-only  |
| `table-cell-empty-mismatch`   | テーブルセルの空/非空不一致                        | audit-only  |
| `table-cell-token-mismatch`   | テーブルセルの invariant token 不一致              | audit-only  |
| `missing-snapshot`            | EN snapshot が存在しないページ                     | gate signal |
| `section-structure-mismatch`  | EN/JA の section body で block kind 多重集合が違う | reportable  |
| `segment-order-mismatch`      | section 内 block 種別の並びまたは content 順が違う | reportable  |
| `snapshot-incomplete`         | EN snapshot が shallow/extractor-empty で比較不能  | advisory    |
| `source-unusable`             | EN snapshot が malformed details で復元不能        | advisory    |

**audit-only signals**: 上記の `audit-only` 印が付いた 9 種は coarse counting / shape / table-cell heuristics で、`segment-*` exact diff engine と重複した noise になりがちなため `parity-regression` issue body と gate exit code から除外される。`parity-check-status.json` には引き続き出力され、`deep-audit` workflow と `npm run check:parity -- --include-audit-signals` でのみ詳細を確認できる。`gate signal` 印は新規 / 欠落ページ検知のために gate にとどめる。allowlist は `testim_parity.detection.source_parity_types` の `COARSE_SIGNAL_TYPES` に集約されており、新 issue type を追加するときは review で「audit-only か gate-eligible か」を必ず判断する。

**structure comparator**: `alignSegments` が weighted LCS を走らせる前に、heading path が一致する section ごとに canonical block sequence を比較する。block 単位の語彙は `paragraph` / `ordered-list` / `unordered-list` / `callout-body` / `table` / `details-summary` の 6 種に凍結されており、segment 単位の list item / table cell は比較前に対応する list / table block に畳まれる。

3 段階の fall-through で section あたり最大 1 件の diff を emit する:

1. **kind-multiset** (`section-structure-mismatch`) — block 種別の多重集合が違う
2. **kind-sequence** (`segment-order-mismatch`) — 多重集合は一致するが並び順が違う
3. **content-order** (`segment-order-mismatch`) — kind 列は同じだが content bijection が monotonic でない

いずれかが発火すると後続 stage は short-circuit され、alignSegments の weighted LCS も呼ばれない (section body に対して structure issue と segment diff が二重発火しないため)。

**baseline identity**: structure 系 entry の machine identity は **`sectionIndex` + `structureCategory` + `structureFingerprint`** の 3 つ組 (`buildBaselineKey` / `buildBaselineKeyFromEntry`)。`structureFingerprint` は `structureCategory` + `enKinds` + `jaKinds` (content-order では `contentPermutation`) を sha256 に畳み込む。`sectionPath` は entry に保存するが identity key には含めない。これは、同一ページ内で同じ heading text が複数現れる場合に `sectionPath` だけでは一意にならないため。

**source unusability gate**: `detectSourceUsability()` は alignSegments 呼び出し前に EN snapshot の比較可能性を判定する。判定条件は以下:

- `shallow-snapshot` (`snapshot-incomplete`) — raw EN HTML が 800 bytes 以下かつ EN body ≤ 2 かつ JA body ≥ 5 かつ JA/EN ratio ≥ 4
- `extractor-empty` (`snapshot-incomplete`) — clean HTML なのに EN body が 0 で JA body ≥ 3
- `escaped-details-residue` (`source-unusable`) — (通常経路) `&lt;/details&gt;` 残存 **または** open/close 不均衡 **かつ** `enHeadingSegmentCount === 0 && jaHeadingSegmentCount >= 2` を **両方** 満たす / (extractError 経路) `open !== close` の不均衡のみで判定

`escaped-details-residue` は **狭く** narrowing されており、`<details>` 例を本文に含む合法ページ (`advanced-editing/coding-assistant` 等) は false positive にならない。発火したページでは alignSegments が呼ばれない (translation drift と snapshot debt を混ぜないため)。両者とも **advisory のみ** で gate exit code には寄与しないが、`summary.snapshotUnusable*` の独立 counter に集計される。

**acknowledgements**: `parity-acknowledgements.json` で issue に acknowledgement を付与可能。slug + issueType + (detailIncludes or detailRegex) で一致。**issue を結果から削除せず**、`acknowledged: true` タグを付けて非 blocking 化する。`sourceFingerprint` と `reviewAfter` による自動失効あり。

`source-unusable` / `snapshot-incomplete` を ack する場合は `detailIncludes: "[reason=<token>]"` 形式を使う(`token` は `escaped-details-residue` / `shallow-snapshot` / `extractor-empty`)。emitter が `detail` 末尾に埋め込む reason token で狙い撃つ契約で、`scripts/python/tests/test_source_parity_usability_ack_integration.py` が detector→matcher round-trip を保証する。

acknowledgement の対象外:

- `NON_ACKNOWLEDGEABLE_TYPES` (`source-page-missing-local`, `segment-missing`, `segment-untranslated`, `segment-token-gap`, `segment-inconclusive`) — gate を suppress すべきでない hard gap
- `COARSE_SIGNAL_TYPES` (audit-only 9 種) — そもそも gate に乗らないため、ack をつけても no-op になる。validation は `validateAcknowledgements` で reject する

→ どちらも `validateAcknowledgements()` がロード時にエラーで弾く。

**`--types` 契約**: `uv run python -m testim_parity.detection.generate_parity_baseline --types=<csv>` は structure/source-unusable 系の partial migration 用で、`TYPES_ARG_ALLOWLIST` (`section-structure-mismatch` / `segment-order-mismatch` / `snapshot-incomplete` / `source-unusable` の 4 type) のみを受理する。空文字 (`--types=`) や typo、既存 `segment-*` type を渡すと `validate_types_arg` が fail-fast する。`scripts/python/tests/test_generate_parity_baseline.py` の `validate_types_arg` suite が契約を固定している。

**Orphan baseline entry の検出**: detector / extractor / preprocessor の仕様変更で runtime が emit しなくなった baseline entry は `check:parity` の summary (`orphanBaselineEntries` / `orphanBaselineByType`) に集計され、CLI と followup report で可視化される。`--slug=<slug>` で該当 slug を再生成すると orphan は purge される。E2E は `scripts/python/tests/test_source_parity_orphan_integration.py` が固定している (temp dir 上の copy を使った isolated test)。

**出力**: `parity-check-status.json`。

---

### Parity detection — glossary mask と URL normalize (Phase 0, 2026-04-14 以降)

- `testim_parity.glossary_mask` (旧 `scripts/lib/parity_glossary_mask.mjs`): `docs/GLOSSARY.md` と `docs/INVARIANT_TOKENS.md` を読み、segment text を Testim 用語 + invariant pattern でマスクする
- `testim_parity.normalize` (旧 `scripts/lib/parity_normalize.mjs`): URL rewrite (`help.testim.io/docs/X` ↔ `/docs/X`, `docs.tricentis.com/testim/content/...htm` → `/docs/...`) を適用する
- `testim_parity.detection.check_source_parity` は mask 結果を `parity-check-status.json` の `debug.maskCoverage` に出力する（**gate / baseline / ack は debug.\* を読まない**契約）
- 新しい Testim 用語を追加する場合は `docs/GLOSSARY.md`、新しい invariant pattern を追加する場合は `docs/INVARIANT_TOKENS.md` を編集し、対応する test を `scripts/python/tests/test_glossary_mask.py` に追加する

---

### EN source patches (Route W, 2026-04-17 以降)

- `testim_parity.en_source_patches` (旧 `scripts/lib/en_source_patches.mjs`): broken EN HTML snapshot を `preprocess_en_html` 境界で修復する slug-scope literal find→replace patch 層。定義データは `scripts/python/src/testim_parity/_en_source_patches_data.json` に JSON で authoritative に保持
- `preprocess_en_html(html, slug=..., patch_coverage=...)` が optional 引数で patch application + coverage 集計を driver。slug 未指定時は no-op (backward-compat)
- `testim_parity.detection.check_source_parity` は run 単位で `create_en_source_patch_coverage()` を集計し、`parity-check-status.json.debug.patchCoverage` に `{ registryEntries, matchedHits, byPatchId, bySlug, mismatches }` を出力 (debug なので gate は読まない)
- 4 enum (`typo` / `href-miswire` / `madcap-artifact` / `stale-reference`) 以外は登録不可、各 entry は `docs/UPSTREAM_DEFECTS.md#UD-NNN` の anchor へ結線必須
- registry の schema / business rule 検証は `uv run python -m testim_parity.tools.validate_en_source_patches`
- 運用 SOP: `docs/UPSTREAM_DEFECTS.md`

---

### find_untranslated — baseline 残債の個別スキャン (`testim_parity.detection.find_untranslated`)

baseline に `segment-untranslated` として凍結された各ページを開いて、未翻訳ブロック単位で行番号と residue (英語残差) を報告する診断ツール。Phase 6b で Python 移植済。

```bash
npm run check:untranslated                                          # baseline の全 untranslated slug をスキャン
npm run check:untranslated -- --slug=overview/testim-overview       # 単一ページ
npm run check:untranslated -- --limit=5                             # 先頭 N ファイルのみ
```

**引数**:

- `--slug=<slug>` — 個別ページ指定。対象ファイル不在で exit code 2 (fail-fast / T8 / plan §3.2)
- `--limit=<N>` — 出力ファイル数上限

**Exit code**:

- `0` — 正常終了（0 件も含む）
- `2` — `--slug` 明示指定で対象ファイル不在 / path-traversal 違反 (T8 / T17 / plan §3.2)

**内部構造**: `split_markdown_blocks(markdown)` → `find_untranslated_blocks(blocks)` → `print_findings(slug, file_path, findings)` の 3 関数。test は `scripts/python/tests/test_find_untranslated.py` を参照。

---

#### lint_docs (`testim_parity.tools.lint_docs`)

WRITING_GUIDE.md に基づく Markdown 構文・frontmatter の検証。Phase 6b cutover で Python 実装に昇格。

```bash
npm run lint:docs
npm run lint:docs -- --path="src/content/docs/overview/*.md"
npm run lint:docs -- --section="概要"
# 直接実行する場合:
uv run python -m testim_parity.tools.lint_docs --path="src/content/docs/overview/testim-overview.md"
```

**検証項目**: sourceUrl 形式、必須 frontmatter（title, category, updated）、description プレースホルダー残留、内部リンクターゲット存在確認（パスベース `/docs/{folder}/{slug}` 形式のみ）、Testim 機能名の英語保持、コードブロック言語指定、callout タイプ、画像ファイル存在確認

**終了コード**: エラーあり → `1`

---

#### generate_detection_reports (`testim_parity.detection.generate_detection_reports`)

`check:snapshots` と `check:parity` の JSON を読み込み、人間向け summary と監査台帳を生成する。

```bash
npm run check:summary
# 直接実行する場合:
uv run python -m testim_parity.detection.generate_detection_reports
```

**出力**:

- `docs-actionable-report.json`
- `docs-update-summary.md`
- `docs-audit-manifest.json`

---

### 同期・パイプライン系

#### pipeline (`testim_parity.pipeline.pipeline`)

翻訳パイプラインのオーケストレーター。5 ステップを順番に実行し、チェックポイントで途中再開が可能。Phase 6b cutover で Python 実装に昇格。

```bash
npm run docs:pipeline                              # diff モード（変更分のみ）
npm run docs:pipeline:full                         # full モード（全件）
npm run docs:pipeline -- --section="Overview"      # セクション絞り込み
npm run docs:pipeline -- --no-resume               # 最初から実行
# 直接実行する場合:
uv run python -m testim_parity.pipeline.pipeline --mode=full --section="Overview"
```

**実行ステップ**:

| #   | ステップ       | Python module                                               | 内容                                    |
| --- | -------------- | ----------------------------------------------------------- | --------------------------------------- |
| 1   | `url_collect`  | `testim_parity.pipeline.update_sidebar_urls_from_live`      | サイドバー URL 収集                     |
| 2   | `placeholders` | `testim_parity.pipeline.generate_untranslated_placeholders` | 未翻訳プレースホルダー作成（full のみ） |
| 3   | `fetch`        | `testim_parity.pipeline.fetch_translate_images`             | 英語原文・画像取得                      |
| 4   | `prepare_llm`  | `testim_parity.pipeline.prepare_llm_tasks`                  | LLM 翻訳タスク準備                      |
| 5   | `apply_llm`    | `testim_parity.pipeline.apply_llm_translations`             | 翻訳結果反映                            |

**チェックポイント**: `scripts/.checkpoint` に進捗を保存。同じ `mode`/`section` なら途中ステップから再開する。`--no-resume` で強制リセット。

---

#### update_sidebar_urls_from_live (`testim_parity.pipeline.update_sidebar_urls_from_live`)

英語サイト（docs.tricentis.com/testim）のサイドバーをスクレイピングし、`docs/SIDEBAR_URLS.md` を更新する。

```bash
npm run docs:sync-sidebar
# 直接実行する場合:
uv run python -m testim_parity.pipeline.update_sidebar_urls_from_live
```

サイトマップ XML → ナビゲーション HTML の順でフォールバックしながら URL を収集。既存の翻訳ステータス（✅🔍 / ✅ / ⏳）を保持する。収集 0 件なら即停止。

---

#### fetch_translate_images (`testim_parity.pipeline.fetch_translate_images`)

英語原文ページから HTML を取得し、Markdown に変換。画像をダウンロードしてローカルパスに書き換える。

```bash
npm run docs:fetch
npm run docs:fetch -- --mode=full
npm run docs:fetch -- --slug=overview/testim-overview
npm run docs:fetch -- --section="Overview" --limit=5
# 直接実行する場合:
uv run python -m testim_parity.pipeline.fetch_translate_images --mode=full
```

**キャッシュ**: `scripts/.cache/docs-state.json` にコンテンツハッシュを保存し、diff モードで変更検出に利用。

---

#### generate_untranslated_placeholders (`testim_parity.pipeline.generate_untranslated_placeholders`)

SIDEBAR_URLS.md で ⏳（未翻訳）のページに対して、frontmatter 付きのプレースホルダー Markdown を作成する。

```bash
npm run docs:placeholders
npm run docs:placeholders -- --section="Overview"
# 直接実行する場合:
uv run python -m testim_parity.pipeline.generate_untranslated_placeholders --section="Overview"
```

---

#### prepare_llm_tasks (`testim_parity.pipeline.prepare_llm_tasks`)

翻訳対象ドキュメントの本文を抽出し、LLM 翻訳用タスクファイルを `llm/tasks/` に生成する。

```bash
npm run docs:prepare-llm
npm run docs:prepare-llm -- --slug=overview/testim-overview
npm run docs:prepare-llm -- --section="Overview"
# 直接実行する場合:
uv run python -m testim_parity.pipeline.prepare_llm_tasks --slug=overview/testim-overview
```

---

#### apply_llm_translations (`testim_parity.pipeline.apply_llm_translations`)

`llm/translations/` の翻訳結果を、既存 frontmatter を保持したまま doc ファイルに適用する。

```bash
npm run docs:apply-llm
npm run docs:apply-llm -- --section="Overview"
# 直接実行する場合:
uv run python -m testim_parity.pipeline.apply_llm_translations --section="Overview"
```

---

### 修正・正規化系

#### notation helpers (`testim_parity.tools.notation`)

旧 `scripts/tools/fix_notation.py` / `verify_notation.py` の表記処理は
`testim_parity.tools.notation` に統合した。通常運用では `docs:normalize` と
`lint:docs` を gate とし、notation helper は既知の表記 debt をまとめて解消する
個別作業で直接実行する。

**対象カテゴリ**: カタカナ長音、たとえば、PRO機能、英日スペース、半角括弧、
レガシー callout、callout 書式、英語 callout タイトル。

---

#### normalize_docs (`testim_parity.tools.normalize_docs`)

ドキュメントの内容と frontmatter を正規化する。

```bash
npm run docs:normalize
npm run docs:normalize -- --section="概要"
# 直接実行する場合:
uv run python -m testim_parity.tools.normalize_docs --section="概要"
```

**主な変換**: 機能名の日本語→英語置換（`Testim拡張機能` → `Testim Extension`）、frontmatter フィールド順序統一

---

## 運用メモ

- `scheduled-actionable` では `check:snapshots` と `check:parity` を主信号にする
- `deep-audit` ではセクション単位のスナップショット diff を実行する
- 監査台帳や summary artifact は人間向け要約と機械可読 JSON を分けて扱う

---

### fix_alt_all (`testim_parity.tools.fix_alt_all`)

alt テキストが空の画像にデフォルトの代替テキストを一括挿入する（markdownlint MD045 対応）。

```bash
npm run docs:fix-alt
```

**ルール**: `.gif` → `操作手順アニメーション`、その他 → `スクリーンショット`

---

### sync_frontmatter_from_sidebar (`testim_parity.tools.sync_frontmatter_from_sidebar`)

SIDEBAR_URLS.md のセクション構造に基づいて、各ドキュメントの `category` と `order` を同期する。

```bash
npm run docs:sync-frontmatter           # ドライラン
npm run docs:sync-frontmatter:apply     # 実際にファイルを更新
# 直接実行 (unmatched 列挙):
uv run python -m testim_parity.tools.sync_frontmatter_from_sidebar --list-unmatched
```

---

### report_frontmatter_categories (`testim_parity.tools.report_frontmatter_categories`)

frontmatter の `category` フィールドの分布を集計し、SIDEBAR_URLS.md との不整合を報告する。

```bash
npm run docs:report-categories
```

---

### 共有ライブラリ (Phase 6b cutover 後: Python modules)

Phase 6b cutover で mjs library 一式は `testim_parity` Python package に移行済。以下は主要モジュールの対応表 (旧 mjs → 現 Python)。

#### testim_parity.sidebar / testim_parity.project

複数のスクリプトから利用される SIDEBAR_URLS.md パーサーと repo root / slug index 抽象層。

| エクスポート関数 (Python snake_case)      | 用途                                      |
| ----------------------------------------- | ----------------------------------------- |
| `parse_sidebar_sections(text)`            | Markdown テキストをセクション配列にパース |
| `load_sidebar_sections()`                 | ファイルから読み込んでパース              |
| `find_sidebar_section(sections, name)`    | セクション名で検索                        |
| `get_section_slug_set(section)`           | セクション内のスラグを Set で返す         |
| `filter_items_by_section(items, section)` | アイテムをセクションでフィルタ            |
| `extract_japanese_label(section_title)`   | セクション見出しから日本語ラベルを抽出    |

**利用モジュール**: `lint_docs`, `fetch_translate_images`, `prepare_llm_tasks`, `apply_llm_translations`, `normalize_docs`, `generate_untranslated_placeholders`, `report_frontmatter_categories`, `sync_frontmatter_from_sidebar`

#### そのほかの共有ライブラリ

| Python module (現行)                                     | 旧 mjs ファイル                          | 用途                                                               |
| -------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| `testim_parity.project`                                  | `lib/project.mjs`                        | repo ルート、docs 探索、slug index、FM 読出し                      |
| `testim_parity.markdown_utils`                           | `lib/markdown_utils.mjs`                 | Markdown 除去、description 自動生成                                |
| `testim_parity.madcap_toc`                               | `lib/madcap_toc.mjs`                     | MadCap Flare TOC データ解析、slug 抽出                             |
| `testim_parity.turndown`                                 | `lib/turndown.mjs`                       | EN HTML → Markdown 変換 (markdownify + MadCap rules)               |
| `testim_parity.detection.source_parity_types`            | `lib/source_parity_types.mjs`            | parity issue type 定義・検出パターン                               |
| `testim_parity.detection.source_parity_summary`          | `lib/source_parity_summary.mjs`          | parity 集計・要約生成                                              |
| `testim_parity.detection.source_parity_acknowledgements` | `lib/source_parity_acknowledgements.mjs` | parity acknowledgement モデル                                      |
| `testim_parity.detection.source_parity_page_coverage`    | `lib/source_parity_page_coverage.mjs`    | ページ単位の coverage gate                                         |
| `testim_parity.segments_shared`                          | `lib/source_parity_segments_shared.mjs`  | canonical segment 型・正規化・fingerprint                          |
| `testim_parity.segments_en`                              | `lib/source_parity_segments_en.mjs`      | EN HTML 直接 canonical segment extractor (turndown 非依存)         |
| `testim_parity.segments_ja`                              | `lib/source_parity_segments_ja.mjs`      | JA markdown canonical segment extractor                            |
| `testim_parity.align`                                    | `lib/source_parity_align.mjs`            | section-anchored exact diff engine (segment-missing / extra / ...) |
| `testim_parity.sync_exclusions`                          | `lib/source_sync_exclusions.mjs`         | Source-side debt registry                                          |
| `testim_parity.en_source_patches`                        | `lib/en_source_patches.mjs`              | EN HTML slug-scope patch (`_en_source_patches_data.json` 駆動)     |
| `testim_parity.mutation_corpus`                          | `lib/mutation_corpus.mjs`                | diff=1 mutation 生成 (recall 測定用)                               |
| `testim_parity.detection.detection_reports`              | `lib/detection_reports.mjs`              | summary / issue body / audit manifest 生成                         |

唯一残存する Node tooling は `.github/scripts/sync-detection-issues.cjs` (GitHub Actions 側 issue 同期)。詳細は本文書末尾の「残存 mjs テスト」節を参照。

##### canonical segment 抽出の位置づけ

`testim_parity.segments_*` は exact diff engine が EN / JA を比較するための最小単位 (segment) を生成する canonical segment extractor。

- **EN extractor**: `testim_parity.segments_en` — MadCap Flare HTML を直接 tokenize → tree → walk して segment を生成する。turndown の markdown 変換層を経由しない。
- **JA extractor**: `testim_parity.segments_ja` — JA markdown を line-by-line で分類し、pipe table / HTML table / callout / details / image / list を segment にマップする。
- **共通**: `testim_parity.segments_shared` — `Segment` 型、`normalize_segment_text`, `compute_segment_fingerprint`, `push_heading` / `build_section_path`, `create_segment` factory。
- **境界安定性ベンチマーク**: `scripts/python/tests/test_segments_boundary.py` が代表 10 ページで EN / JA の segment 数を突き合わせ、平均 stability score ≥ 0.95 / 最小 ≥ 0.85 を保証する。headings / ordered-list-item / unordered-list-item は完全一致が必須。

##### Section-anchored exact diff engine

`testim_parity.align` は canonical segments を入力として EN / JA を最小単位で比較し、5 種の diff issue type を出力する section-anchored exact diff engine。

- **入力**: `extract_segments_from_html(en)` と `extract_segments_from_markdown(ja)` の出力 (gate-eligible kinds + heading)
- **出力**: `{ diffs, sections_aligned, inconclusive, inconclusive_reason }`

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
>
> - **token-bearing section swap** (`section-body-swap` mutation type): symmetric destination evidence を満たすので `segment-shifted` (`confidence: 'high'`) として recall 100%。
> - **tokenless free-form section swap**: exact gate では `segment-shifted` を出さない。長さシグナルだけで swap を推定すると正常翻訳を false inconclusive にしやすいため、`inconclusive` に落とすのは current/swap が **ほぼ区別できない near-tie** の場合に限定する。つまり tokenless prose-only swap は基本的に exact scope 外であり、後続の `tokenless-near-tie` review queue で surfacing する。
> - **tokenless cross-language の head/tail 段落削除**: 位置スコアが対称になるため `segment-missing` 1 件は出るが、どの段落が gap か (`enSegmentIndex`) は best-effort。中央削除は位置非対称性で正しく特定できる。
> - **正常翻訳された tokenless free-form section**: `segment-shifted` は出ない。near-tie だけを `inconclusive` にするので、広範囲な false inconclusive は起こさない。

各 ParityDiff は構造化メタデータ (`enSegmentIndex`, `jaSegmentIndex`, `enSourceFingerprint`, `jaSourceFingerprint`, `missingTokens`) を持ち、4-family detection report と issue sync が drilldown できる。

**gate issue type と severity**:

| type                   | severity   | acknowledgement                                 | confidence variants                     |
| ---------------------- | ---------- | ----------------------------------------------- | --------------------------------------- |
| `segment-missing`      | actionable | non-acknowledgeable                             | —                                       |
| `segment-extra`        | actionable | acknowledgeable（翻訳側の意図的拡張がありうる） | —                                       |
| `segment-shifted`      | actionable | acknowledgeable                                 | `high` (symmetric destination evidence) |
| `segment-untranslated` | actionable | non-acknowledgeable                             | —                                       |
| `segment-token-gap`    | actionable | non-acknowledgeable                             | —                                       |

**Runtime wiring (primary gate)**:

`testim_parity.detection.check_source_parity` は `align_segments()` を直接呼ぶ。`inconclusive` 時は、alignment がすでに見つけた exact diff を保持したまま `segment-inconclusive` issue を追加し、既存の `compare_snapshot_structure()` にフォールバックする。これは heading count mismatch だけでなく、tokenless free-form section が **near-tie で clean か swap かを判定しきれない** ケースも含む。segment-\* issue は primary gate の actionable / active 集計に入り、cutover 時点の既知 drift は `parity-baseline.json` で `baselined: true` にタグ付けされ active 集計から除外される。

runtime gate は `active*` 集計だけを使い、baseline / advisory queue は follow-up reporting 用に保持する。`scripts/python/tests/test_align.py`、`scripts/python/tests/test_check_source_parity.py`、`scripts/python/tests/test_detection_reports.py` が facade re-export、`parity_diffs_to_issues` の shape、`summarize_parity_results` の primary-gate / baseline 集計、`npm run check:parity -- --slug=...` 経由の JSON / CLI 出力を end-to-end で検証する。

**Recall ベンチマーク**: `scripts/python/tests/test_recall.py` が代表 10 ページに対し、`mutation_corpus` の 10 種の mutation を全部適用し、検出率を測る (Phase 6b cutover で `recall` marker が required step に昇格)。

検出は **section-scoped + signature-aware**:

- (A) 影響を受けた section の mutated 側に新しい diff があり、その `type` / `segmentKind` が mutation の期待 signature にマッチする
- (B) baseline 側に「削除された JA 段落の `jaSourceFingerprint` を指す」diff があり、それが mutated で消えている

(A) は「正しい場所で正しい種類の新規 diff が出た」、(B) は「baseline で既に flag されていた segment-extra が削除によって解消された」を捕捉する。どちらも alignment が当該 segment を正しく追跡している証拠なので detection と判定する。

**Recall / cascade / precision の運用基準**:

| 判定軸                                                         | 閾値 | 現状                                                                                                                                                                         |
| -------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| diff=1 mutation の recall（strict, **conclusive exact diff**） | 100% | **9/9 strict mutation type で 100%** (paragraph / bullet / step / callout / table-cell / html-table-cell / **section-body-swap** (token-bearing) / en-residual / token-drop) |
| cascade（diff=1 mutation あたりの新規 diff 数）                | ≤ 6  | 最大 2                                                                                                                                                                       |
| precision baseline（1 ページあたりの baseline diff 数）        | ≤ 60 | 最大 35                                                                                                                                                                      |

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

- `testim_parity.detection.source_parity_baseline` — schema validation, key 生成,
  page-level invalidation を含む tagging（純粋関数のみ）
- `testim_parity.detection.generate_parity_baseline` — baseline 生成 CLI (schema v2)
  - `--regenerate` で full、`--slug=<csv>` で partial 再生成、`--types=<csv>` で
    structure family のみ部分再生成 (`section-structure-mismatch` /
    `segment-order-mismatch` の 2 種のみ許可)
  - 入力の `parity-check-status.json` は full `npm run check:parity` 実行結果が必須
  - `--rationale=<text>` で provenance を明示化
  - **v2 で `--review-after` option は削除された**。stale 指定時は exit 1 で reject
  - 出力は deterministic (`parity-check-status.json` の
    `summary.checkedAt` を `generatedAt` / `generatedFromRunId` の seed に使い、
    安定ソート + 2-space indent + LF 終端)
- `parity-baseline.json` — frozen baseline file (schema v2)。各 entry は
  `priority` (`high`/`medium`/`low`, default `medium`) と任意 `note` を持つ。
  Phase 4 cutover 後は `entries.length === 0` を維持する

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
- baseline は v2 schema で期限管理を撤廃済。entry が載ったままになる抑止は
  `priority='high'` + 明示 PR による paydown schedule で行う。新規 issue を
  baseline に逃がすのではなく、artifact registry / normalizer / extractor /
  翻訳追従で解消する (Phase 4 完了後は `entries.length === 0` 維持)
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

**counter contract** (`testim_parity.detection.source_parity_summary`):

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
`schemaVersion` を持ち、`npm run check:summary -- --strict` (= `uv run python -m testim_parity.detection.generate_detection_reports --strict`、CI で
使用) は `load_detection_inputs(strict=True)` 経由で
`validate_detection_inputs` を必ず通過させる。

- **`snapshot-diff-status.json`** (`schemaVersion: 1`) —
  必須 top-level: `runId`, `sourceSyncRunId`, `sourceInventoryFingerprint`,
  `runScope`, `checkedAt`, `summary`, `changes`, `sidebar`
- **`source-sync-status.json`** (`schemaVersion: 2`) —
  必須 top-level: `runId`, `checkedAt`, `sourceInventoryFingerprint`,
  `sidebarFingerprint`, `freshnessState`, `runScope`, `summary`, `pages`,
  `errors`。
  `summary` に追加された counter: `excludedPages` (= 既知
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

Phase 6b atomic cutover (2026-04-24/25) で detection / pipeline / lib / tools の
実装を Python に統合済み。mjs テストは GitHub Actions 側 `sync-detection-issues.cjs` の 1 本だけ。

```bash
npm run test:mjs                                      # 残存 2 mjs tests
npm run test:py                                       # Python 全 test (default addopts)
npm run test:py:quick                                 # fast gate only
(cd scripts/python && uv run pytest -m corpus -n auto)    # 864 corpus matrix (20s)
(cd scripts/python && uv run pytest -m 'recall or boundary or real_repo' -o addopts=)
```

### Python テスト構成 (`scripts/python/tests/`)

| ファイル                                                                             | 対象                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `conformance/test_segments_en_288_matrix.py`                                         | segments_en vs committed golden                |
| `conformance/test_turndown_288_matrix.py`                                            | turndown vs committed golden                   |
| `conformance/test_align_288_matrix.py`                                               | align vs committed golden                      |
| `test_segments_en.py` / `test_segments_ja.py`                                        | segment extractor unit                         |
| `test_align.py` / `test_align_scoring.py`                                            | align weighted LCS                             |
| `test_checks.py`                                                                     | coarse audit (section / callout / image order) |
| `test_check_source_parity.py` / `test_check_source_parity_smoke.py`                  | parity gate                                    |
| `test_snapshot_diff.py` / `test_snapshot_update.py`                                  | snapshot pipeline                              |
| `test_pipeline.py` / `test_pipeline_cli_smoke.py` / `test_apply_llm_translations.py` | translation pipeline                           |
| `test_lint_docs.py` / `test_lint_docs_main_smoke.py`                                 | lint rules + CLI                               |
| `test_tools_cli_smoke.py`                                                            | tools CLI smoke                                |
| `test_emit_corpus_oracle.py`                                                         | corpus oracle emitter                          |
| `test_validate_en_source_patches.py`                                                 | JSON patch registry schema                     |
| `test_recall.py` / `test_baseline_recall.py` / `test_segments_boundary.py`           | quality regression                             |

### 残存 mjs テスト (`scripts/__tests__/`)

| ファイル                         | 対象                                        | 維持理由                                     |
| -------------------------------- | ------------------------------------------- | -------------------------------------------- |
| `sync_detection_issues.test.mjs` | `.github/scripts/sync-detection-issues.cjs` | GitHub Actions 側 tooling (Phase 6.1 で扱う) |

---

## npm スクリプト対応表 (Phase 6b 以降)

| npm コマンド                  | 実体                                                                  | 用途                             |
| ----------------------------- | --------------------------------------------------------------------- | -------------------------------- |
| `lint`                        | `lint:md && lint:docs`                                                | 全 lint 実行                     |
| `lint:md`                     | `lint:md:content && lint:md:repo`                                     | markdownlint 実行                |
| `lint:md:content`             | markdownlint (docs content)                                           | コンテンツ MD lint (MD001 無効)  |
| `lint:md:repo`                | markdownlint (repo docs, .github)                                     | リポジトリ MD lint               |
| `lint:docs`                   | `uv run python -m testim_parity.tools.lint_docs`                      | 構文・frontmatter 検証           |
| `lint:glossary`               | `uv run python -m testim_parity.tools.check_glossary_duplicates`      | glossary 重複検知                |
| `check:snapshots`             | snapshot fetch + diff (Python)                                        | スナップショット取得→比較        |
| `check:snapshots:fetch`       | `uv run python -m testim_parity.detection.snapshot_update`            | スナップショット取得             |
| `check:snapshots:diff`        | `uv run python -m testim_parity.detection.snapshot_diff`              | スナップショット差分比較         |
| `check:parity`                | `uv run python -m testim_parity.detection.check_source_parity`        | 翻訳品質チェック (local)         |
| `check:summary`               | `uv run python -m testim_parity.detection.generate_detection_reports` | summary / audit manifest         |
| `check:untranslated`          | `uv run python -m testim_parity.detection.find_untranslated`          | 未翻訳 page 検出                 |
| `docs:sync-sidebar`           | `python -m testim_parity.pipeline.update_sidebar_urls_from_live`      | サイドバー URL 同期              |
| `docs:sync-frontmatter`       | `python -m testim_parity.tools.sync_frontmatter_from_sidebar`         | frontmatter 同期 (dry-run)       |
| `docs:sync-frontmatter:apply` | `... --apply`                                                         | frontmatter 同期 (実行)          |
| `docs:pipeline`               | `python -m testim_parity.pipeline.pipeline`                           | パイプライン (diff default)      |
| `docs:pipeline:full`          | `python -m testim_parity.pipeline.pipeline --mode=full`               | パイプライン (full)              |
| `docs:fetch`                  | `python -m testim_parity.pipeline.fetch_translate_images`             | 英語原文・画像取得               |
| `docs:normalize`              | `python -m testim_parity.tools.normalize_docs`                        | ドキュメント正規化               |
| `docs:fix-alt`                | `python -m testim_parity.tools.fix_alt_all`                           | alt テキスト一括挿入             |
| `docs:placeholders`           | `python -m testim_parity.pipeline.generate_untranslated_placeholders` | プレースホルダー作成             |
| `docs:prepare-llm`            | `python -m testim_parity.pipeline.prepare_llm_tasks`                  | LLM タスク準備                   |
| `docs:apply-llm`              | `python -m testim_parity.pipeline.apply_llm_translations`             | LLM 翻訳適用                     |
| `docs:report-categories`      | `python -m testim_parity.tools.report_frontmatter_categories`         | カテゴリ集計                     |
| `test:py`                     | `cd scripts/python && uv run pytest`                                  | Python 全 test (default addopts) |
| `test:py:quick`               | marker filter 付き fast gate                                          | CI fast 相当                     |
| `test:py:corpus`              | `pytest -m corpus -n auto --dist load`                                | 288×3 matrix 並列                |
| `test:py:corpus:regen`        | `uv run python -m testim_parity.tools.emit_corpus_oracle`             | committed golden 再生成          |
| `test:py:corpus:drift`        | drift check (committed vs live Python)                                | 暫定 drift gate                  |
| `test:mjs`                    | `node --test sync_detection_issues.test.mjs`                          | 残存 mjs test                    |
| `format`                      | `prettier --write`                                                    | コードフォーマット               |
| `format:check`                | `prettier --check`                                                    | フォーマットチェック (CI 用)     |

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
