# プロジェクト仕様 --- Testim Docs JA

## 概要

Testim Help Documentation (docs.tricentis.com/testim) の日本語ローカライズサイト。全 287 ページを翻訳済み。

| 項目 | 値 |
| --- | --- |
| フレームワーク | Astro 6, Tailwind CSS v4, TypeScript, React (検索 UI のみ) |
| デプロイ | Vercel (static / SSR+auth 切替: `BASIC_AUTH_ENABLED`) |
| コンテンツ | `src/content/docs/` 配下の Markdown (20 カテゴリフォルダー) |
| スキーマ | `src/content.config.ts` (Zod validation) |
| ルーティング | `src/pages/docs/[...slug].astro` (単一動的ルート) |
| 検索 | MiniSearch (`src/components/SearchModal.tsx`) + `/api/search.json` |
| レイアウト | `src/layouts/DocsLayout.astro` + NavSidebar + TableOfContents |

## アーキテクチャ

### コンテンツパイプライン

```text
EN snapshot (docs.tricentis.com)
  |
  v
testim_parity.detection.snapshot_update ── fetch EN HTML (#mc-main-content)
  |
  v
testim_parity.detection.snapshot_diff ── git diff で変更検知
  |
  v
testim_parity.detection.check_source_parity ── EN/JA 構造比較 (exact diff engine)
  |
  v
testim_parity.pipeline.pipeline ── 翻訳ワークフロー (fetch -> placeholders -> LLM tasks -> apply)
  |
  v
testim_parity.tools.lint_docs + build ── QA gate
  |
  v
Vercel deploy
```

### 検出 artifact (4 JSON)

| artifact | schemaVersion | 生成スクリプト |
| --- | --- | --- |
| `snapshot-diff-status.json` | 1 | `testim_parity.detection.snapshot_diff` |
| `source-sync-status.json` | 2 | `testim_parity.detection.snapshot_update` |
| `parity-check-status.json` | 1 | `testim_parity.detection.check_source_parity` |
| `docs-actionable-report.json` | 1 | `testim_parity.detection.generate_detection_reports` |

全 artifact は `schemaVersion` を持ち、`testim_parity.detection.generate_detection_reports --strict` が schema validation を実行する。

### ランタイムデータファイル

| ファイル | 用途 |
| --- | --- |
| `docs/GLOSSARY.md` | 3-tier 用語集 (Tier A: 固有名詞, B: UI label, C: 一般 IT 用語)。`testim_parity.glossary_mask` が参照 |
| `docs/INVARIANT_TOKENS.md` | 23 種の invariant token pattern 定義。正規表現で英語維持 token をマスク |
| `docs/SIDEBAR_URLS.md` | 全 287 URL のマスターリスト。カテゴリ・ページ順序の single source of truth |

## 検出システム仕様

### パリティチェック (`testim_parity.detection.check_source_parity`)

Section-anchored exact diff engine。EN snapshot と JA Markdown を canonical segment に分解し、weighted LCS で比較する。

**segment kind**: `paragraph` / `ordered-list` / `unordered-list` / `callout-body` / `table` / `details-summary` の 6 種 (凍結)。

**issue type (5+1)**:

| type | 説明 |
| --- | --- |
| `segment-missing` | EN に存在するが JA に無い |
| `segment-extra` | JA に存在するが EN に無い |
| `segment-untranslated` | JA に英語が残留 |
| `segment-token-gap` | invariant token の不一致 |
| `segment-shifted` | section body swap (symmetric destination evidence 必須) |
| `segment-inconclusive` | 自動判定の限界ケース (advisory) |

**補助検出**: `section-structure-mismatch` / `segment-order-mismatch` (structure comparator, 3 段階 fall-through)。

**baseline**: `parity-baseline.json` (schema v2)。`entries[]` で既知 drift を凍結し、active 集計から除外する。

### スナップショット diff (`testim_parity.detection.snapshot_diff`)

EN HTML snapshot (`snapshots/en/content/`) の git diff で変更を検知する。

**diff 分類**: `page-changed` (内容変更) / `page-added` (新規) / `page-removed` (404 化)。差分行は `heading` / `image` / `code` / `callout` / `content` に自動分類される。

**出力**: `snapshot-diff-status.json`。

### ソース同期健全性 (`testim_parity.detection.snapshot_update`)

EN snapshot fetch の健全性を freshness state で表す。

**freshness state**: `fresh` / `partial` / `broken`。source-sync-status.json の `freshnessState` に記録。

**除外 registry**: `testim_parity.sync_exclusions` で壊れた EN page を隔離。`excludedPages` counter で可視化。除外 slug は fetch を継続するが snapshot を上書きしない。recovery probe で `excluded-broken` / `excluded-recovered` を判定する。現在 active entry はないが、page-level freeze 機構は維持する。

### 上流回復検出 (`testim_parity.detection.check_upstream_recovery`)

`en_source_patches` (segment-level) と `source_sync_exclusions` (page-level) の 2-mechanism を横断して、上流修正の自動検知と登録解除忘れの persistent reminder を提供する。

**2-axis 状態モデル**:

| Axis | 値 | 判定 |
| --- | --- | --- |
| **Axis A** (upstream 修正検知) | `active` / `stale` / `unknown` | patch の find が EN に存在するか / exclusion の fetchStatus |
| **Axis B** (登録解除忘れ) | `current` / `overdue` | `reviewAfter` 日付が過去かどうか |

**出力**: `upstream-recovery-status.json` (schemaVersion 1)。non-blocking (常に exit 0)。

## Python tooling 契約

### 現在の方針

- `scripts/python/` は `uv` 管理の Python package として運用する。
- Python runtime は `.python-version` で 3.14.4 に固定し、依存関係は `scripts/python/pyproject.toml` と `scripts/python/uv.lock` を正とする。
- ローカル仮想環境 `scripts/python/.venv/` は生成物であり、リポジトリには保持しない。
- npm scripts は Node/Astro の入口を残しつつ、ドキュメント同期、検出、正規化、パリティ確認は `uv run python -m testim_parity...` で実行する。
- 旧実装との差分を抑制するための一時 allowlist は追加しない。検出された drift は実装またはコンテンツで解消する。

### Required gates

以下を現行の主要 gate とする。

```bash
npm run lint
npm run test:mjs
npm run test:py:quick
cd scripts/python && uv run pytest -o addopts= -m 'recall or boundary or real_repo' --tb=short
npm run test:py:corpus
npm run check:parity
npm run build
```

`npm run check:parity` は 5-counter = 0 を維持する。5-counter の定義と suppression 契約は本ファイルと `docs/PARITY_GUIDE.md` を正とする。

### Self-enforcing cutover gate

`scripts/python/tests/test_cutover_gate.py` は、この表と `_EXCLUSION_REGISTRY` が一致することを検証する。以下の temporary drift registry はすべて空でなければならない。

| File                                | Exclusion symbol            | 処理                                                                   |
| ----------------------------------- | --------------------------- | ---------------------------------------------------------------------- |
| `tests/test_clean_page_fixtures.py` | `_PY_XFAIL_SLUGS`           | Python extractor / align drift を解消し、空集合を維持する              |
| `tests/test_structure_fixtures.py`  | `_PY_XFAIL_SLUGS`           | structure fixtures に現れる extractor drift を解消し、空集合を維持する |
| `tests/test_recall.py`              | `_PY_EXTRACTOR_DRIFT_SLUGS` | recall drift を実装修正で解消し、空集合を維持する                      |
| `tests/test_baseline_recall.py`     | `_PY_EXTRACTOR_DRIFT_SLUGS` | baseline recall drift を実装修正で解消し、空集合を維持する             |
| `tests/test_segments_boundary.py`   | `_PY_EXTRACTOR_DRIFT_SLUGS` | boundary stability drift を実装修正で解消し、空集合を維持する          |

新しい `_PY_*_SLUGS` を追加する場合は、同じ PR でこの表と `test_cutover_gate.py` の registry を更新する。ただし、追加は原則として禁止し、drift は修正で解消する。

### Python environment

初回セットアップ:

```bash
cd scripts/python
uv sync --all-extras
```

通常の実行:

```bash
uv run pytest
uv run ruff check src tests
uv run ruff format --check src tests
uv run mypy src
```

`uv` が作る `.venv/`、pytest/ruff/mypy の cache、coverage artifact はローカル生成物として扱う。

## システム不変量

### 5-counter = 0 DoD

以下の 5 counter は全て 0 を維持する。測定は機械判定。

| # | counter | JSON field | 期待値 |
| --- | --- | --- | --- |
| 1 | baseline entries | `parity-baseline.json` `entries.length` | `0` |
| 2 | reportable active files | `parity-check-status.json` `summary.reportableActiveFiles` | `0` |
| 3 | baselined issues | `parity-check-status.json` `summary.baselinedIssues` | `0` |
| 4 | advisory queue issues | `parity-check-status.json` `summary.advisoryQueueIssues` | `0` |
| 5 | audit signal issues | `parity-check-status.json` `summary.auditSignalIssues` | `0` |

**補助不変量**: baseline schemaVersion === 2、snapshot-diff-status の changed/added/removed === 0、artifact coverage shape の 4 field 存在。

### 2-mechanism suppression design

EN 上流欠陥を JA 側に伝搬させない抑制は以下の 2 mechanism のみ許容される。第三の mechanism は契約違反。

| mechanism | scope | 用途 | truth source |
| --- | --- | --- | --- |
| **Mechanism 1**: page-level freeze | ページ全体 | 壊れた EN page を snapshot 同期から隔離 | `testim_parity.sync_exclusions` |
| **Mechanism 2**: segment-level patch | slug-scope literal find/replace | EN HTML の typo / href-miswire / madcap-artifact / stale-reference を修復 | `testim_parity.en_source_patches` + `_en_source_patches_data.json` |

**禁止される suppression**: intentional-divergence allowlist、callout-normalization allowlist、JA-side policy suppression、およびparity 時に EN/JA drift を隠す一切の suppression lane。

各 patch entry は `docs/UPSTREAM_DEFECTS.md#UD-NNN` の anchor へ結線必須。UD-NNN ID は同ファイルの Reserved IDs table で中央管理する。

### baseline 運用ルール

- **Schema v2**: `reviewAfter` / `inconclusiveCategory` / `inconclusiveReason` / `usabilityReason` は削除済。`priority` (`high`/`medium`/`low`) + optional `note` のみ保持
- **Empty maintenance**: `entries.length === 0` を維持する。新規 issue を baseline に逃がさず、content fix / extractor fix / normalizer fix で解消する
- **Gate behavior**: `summary.result` は `pass` / `fail` / `inconclusive`。`pass` には fresh source + reportable issue 0 + linkage `linked` が必要
- **Baseline 再生成 gate**: `orphanBaselineEntries === 0` / `patchCoverage.mismatches === 0` / `runScope.isComplete === true` / `freshnessState === "fresh"` / `linkageState === "linked"` / `result === "pass"` の 6 predicate が全て成立しなければ再生成は invalid

## ドキュメント一覧

| # | ファイル | 説明 | 分類 |
| --- | --- | --- | --- |
| 1 | `SYSTEM_SPEC.md` | プロジェクト仕様サマリ (本ファイル) | 仕様 |
| 2 | `WRITING_GUIDE.md` | コンテンツ書式ルール、source-first 構造契約 | 規約 |
| 3 | `TRANSLATION_GUIDE.md` | 翻訳ルール、用語テーブル、NG/OK パターン | 規約 |
| 4 | `OPS_DESIGN.md` | 運用マニュアル、レビュー手順、CI ワークフロー | 運用 |
| 5 | `PARITY_GUIDE.md` | パリティ保全、2-mechanism 設計、gate matrix | 運用 |
| 6 | `GLOSSARY.md` | 3-tier 用語分類 (runtime データ) | データ |
| 7 | `INVARIANT_TOKENS.md` | 23 種 invariant token pattern (runtime データ) | データ |
| 8 | `SIDEBAR_URLS.md` | マスターページリスト、287 URL | データ |
| 9 | `DOCS_DATE_TRACKING.md` | snapshot ベース変更検知、diff 分類、CI フロー | 仕様 |
| 10 | `WRITING_FEATURES.md` | Markdown 拡張機能リファレンス | 参照 |
| 11 | `UPSTREAM_DEFECTS.md` | 上流欠陥レジストリ (UD-001..UD-010+) | 運用 |

## スクリプトリファレンス

詳細は [`scripts/README.md`](../scripts/README.md) を参照。

### 主要 npm コマンド

| コマンド | 用途 |
| --- | --- |
| `npm run dev` | 開発サーバー (localhost:4321) |
| `npm run build` | 本番ビルド (`astro check` + build) |
| `npm run check` | TypeScript/Astro 型チェック |
| `npm run lint` | 全 lint (`lint:md` + `lint:docs`) |
| `npm run lint:docs` | WRITING_GUIDE 準拠チェック |
| `npm run test` | テスト実行 (`scripts/__tests__/`) |
| `npm run check:parity` | パリティチェック (構造・token・baseline) |
| `npm run check:snapshots` | EN スナップショット取得 + diff |
| `npm run check:snapshots:diff` | スナップショット差分のみ |
| `npm run check:summary` | summary / audit manifest 生成 |
| `npm run docs:pipeline` | 翻訳パイプライン実行 |
| `npm run docs:sync-sidebar` | SIDEBAR_URLS.md 更新 |
| `npm run format` | Prettier フォーマット |

**単一ページ指定**:

```bash
npm run check:parity -- --slug=overview/testim-overview
npm run check:snapshots:diff -- --slug=overview/testim-overview
npm run lint:docs -- --path=src/content/docs/overview/testim-overview.md
```
