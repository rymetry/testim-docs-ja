# Parity Oracle Contract — Phase 0 詳細設計

- **Date**: 2026-04-14
- **Author**: Claude (design — 実装はユーザ承認後、TDD plan に従う)
- **Worktree**: `worktree-kind-waddling-axolotl`
- **Related**: `parity-baseline.json` (622 entries 凍結中)、`docs/PARITY_GUIDE.md`、`docs/WRITING_GUIDE.md §160 Source-First 構造契約`

---

## 1. 背景

### 1.1 残存 baseline の実態

`parity-baseline.json` には cutover 時点で 622 件の issue が凍結されている:

| issueType | 件数 | segmentKind 内訳の要点 |
| --- | --- | --- |
| `segment-extra` | 193 | preface 45、section 148（JA 独自 callout / 番号リスト展開 / 手順導入文の分離） |
| `segment-untranslated` | 146 | **table-cell 102**、ul-item 26、paragraph 10、ol-item 8（UI 用語だけでなく翻訳抜けも含む） |
| `segment-missing` | 136 | EN 段落を JA が統合・省略 |
| `section-structure-mismatch` | 86 | 上記の派生 |
| `segment-token-gap` | 49 | localized `help.testim.io` link、CLI フラグ欠落等 |
| `segment-inconclusive` | 11 | 自動判定の曖昧ケース |
| `segment-order-mismatch` | 1 | |

132 ユニーク slug に分布。Top 2 (`editing-tests/steps` 34件、`editing-your-tests/editing-a-steps-properties` 28件) で 62 件、ロングテールで 1-3 件のファイルが 69 件。

### 1.2 根本問題: 責務の混在

現在の検知系は 3 つの責務を単一パイプラインで扱おうとしている:

1. **構造一致**: EN と JA の heading/list/callout/table 構造が一致するか
2. **内容カバレッジ**: EN の本文セグメントが全て JA に反映されているか
3. **翻訳品質**: JA が自然な日本語か / Testim 用語が英語維持か / URL が正しくローカライズされているか

(3) は本質的に主観的で、検知コード内に fuzzy heuristic (`looksUntranslated()`, `tokenless-near-tie`, `segment-inconclusive`) として表出している。結果として:

- baseline が「既知バグ」と「方針上許容される差分」を混在して保持してしまう
- 新規 issue が出るたびに「これは baseline すべきか、修正すべきか」の人間判断が必要
- LLM 翻訳者への指示も「構造は守るが補足追加はしてもよい」と曖昧になる

### 1.3 この Phase 0 の位置づけ

Phase 0 は **"EN を構造の oracle、JA をその鏡写しとして機械検知可能にする"** ための基盤整備。コンテンツ修正（Phase 1 以降の burn-down）には踏み込まない。ここで整備される契約が、後段で 600 件近いロングテールを機械的・並列的に返済するための前提となる。

---

## 2. Goal / Non-Goal

### 2.1 Goal

- **契約を single-policy に単純化**: JA は EN 構造の鏡写しのみを許容。content 差分は glossary / invariant pattern / URL normalize で説明可能に分解、残る英語 prose は全てバグ
- **検知の判定責務を分離**: 構造一致 = 決定論 boolean、内容カバレッジ = 決定論 diff、mask/normalize = 決定論マッピング。fuzzy は `segment-inconclusive` に局所化
- **baseline の責務を明確化**: "未解決 issue の凍結" のみ。mask/normalize で吸収される invariant は baseline の対象ですらない
- **callout 契約を 4 レイヤーで統一**: `{note, caution, warning, info, tip, danger}` 6 種で EN extractor / JA extractor / renderer / guide を揃える

### 2.2 Non-Goal (Phase 1 以降)

- `parity-baseline.json` 622 件の individual fix（content 修正）
- `micro-exclusion` 層（token-level exclusion registry）— 本 Phase 0 後の残 baseline を見て必要性判断
- visual な callout 差別化（caution と warning の色分け等）
- translation quality の自動検証（自然さ・丁寧語レベル等）
- 既存 Phase A-I (Issue #247 の post-merge followup) の再設計

---

## 3. Spec Invariants（契約として確定）

以下 5 点を Phase 0 実装の不変条件として確定する。テストとドキュメントでハードコードされる。

### Invariant 1: Baseline の責務

**Baseline は未解決 issue の凍結のみを保持する。** mask/normalize で説明可能に除外される invariant は baseline の対象ですらない。baseline schema は変更しない。

### Invariant 2: Mask の責務

**Mask は "issue ではない invariant の説明可能な除外" である。** 各除外は (a) `docs/GLOSSARY.md` の entry、または (b) `docs/INVARIANT_TOKENS.md` の正規表現パターンに紐づく。どちらにも当てはまらない英語 prose は issue として上がる。

### Invariant 3: Debug artifact の責務

**Mask coverage は `parity-check-status.json` の `debug.*` namespace にのみ出力する。** gate logic / baseline 生成 / ack sync / CI 判定は `debug.*` を**一切読まない**。`debug.*` は human-readable な診断のみで、機械的な下流判断に使われないことをテストで保証する。

### Invariant 4: Callout 契約

**Callout type 集合は 4 レイヤー（EN extractor / JA extractor / renderer / WRITING_GUIDE mapping）で `{note, caution, warning, info, tip, danger}` 6 種に統一する。** `caution` は renderer に新規追加し、CSS は `warning` と selector group を共有する alias 方式とする（visual 差別化は後続 Phase）。`success` は dead type として削除する。この契約は contract test で 4 レイヤーの一致を静的検証する。

### Invariant 5: Residue = バグ

**Glossary にも invariant pattern にも当てはまらない英語 prose は全てバグである。** blanket な "方針だから無視" allowlist は禁止。あらゆる allowlist は明示的な glossary entry または invariant pattern に紐づき、その帰属を `debug.maskCoverage` で追跡できなければならない。

---

## 4. Architecture

### 4.1 データフロー

```
EN snapshot (oracle)
  │
  ├─ Page broken?
  │   YES → source_sync_exclusions.mjs (page-level lock + 復旧 probe) [既存、不変更]
  │   NO  → 続行
  │
  ▼
EN extract ──────▶ {headings, body segments with invariant tokens}
                           │
                           ▼
                  [NEW] parity_normalize.mjs
                    - help.testim.io/docs/X ↔ /docs/X
                    - docs.tricentis.com/testim/content/... → canonical
                           │
                           ▼
JA extract ──────▶ {headings, body segments with invariant tokens}
                           │
                           ▼
                  [NEW] parity_normalize.mjs (同 URL 正規化)
                           │
                           ▼
align.mjs (fuzzy を glossary_mask に置換)
  - structure diff（決定論 boolean）
  - segment match via LCS
  - for unmatched JA body:
      [NEW] parity_glossary_mask.mjs を呼ぶ
         → masked? → record in debug.maskCoverage, NO issue
         → residue? → diffUntranslated (bug)
      else → diffExtra
  - for token-gap:
      normalize 後に比較、残 gap は issue
                           │
                           ▼
check_source_parity.mjs
  - summary.* → gate が読む [既存]
  - debug.maskCoverage → 診断のみ [NEW]
                           │
                           ▼
parity-check-status.json
  - summary.* (gate 依存) + debug.* (診断専用)
```

### 4.2 Module 責務（新規 / 変更）

| Module | 種別 | 責務 |
| --- | --- | --- |
| `docs/GLOSSARY.md` | 新規 | Testim 固有名詞・UI ラベル・機能名の canonical list（人間 + masker が参照） |
| `docs/INVARIANT_TOKENS.md` | 新規 | キーボードショートカット・CLI フラグ・コード等の invariant pattern 定義 |
| `scripts/lib/parity_glossary_mask.mjs` | 新規 | GLOSSARY + INVARIANT_TOKENS を読み、segment text をマスク。mask record を返す |
| `scripts/lib/parity_normalize.mjs` | 新規 | URL rewrite ルール（`help.testim.io`、`docs.tricentis.com/testim`）を適用 |
| `scripts/lib/source_parity_align.mjs` | 改変 | `looksUntranslated()` を glossary_mask 呼び出しに置き換える。segment-token-gap 比較前に normalize 適用 |
| `scripts/check_source_parity.mjs` | 改変 | mask coverage を集約、`parity-check-status.json` の `debug.maskCoverage` として出力 |
| `astro.config.mjs` | 改変 | `caution` callout を追加、`success` を削除 |
| `src/styles/global.css` | 改変 | `.callout-caution` を `.callout-warning` と selector group で alias、`.callout-success` を削除 |
| `scripts/lib/source_parity_segments_en.mjs` / `_ja.mjs` | 確認のみ | 既存で `{note, caution, warning, info, tip, danger}` を受理しており変更不要。contract test で pin |
| `docs/WRITING_GUIDE.md` | 改変 | line 164 の逃げ道削除、§133 callout mapping 表に `caution` 行追加、Source-First 契約を absolute 化 |
| `docs/TRANSLATION_GUIDE.md` | 改変 | reader-helpful addition の示唆を削除 |
| `docs/PARITY_GUIDE.md` | 改変 | §60 "EN artifact は baseline 管理" を撤回、baseline = bug backlog に reframe |
| `docs/OPS_DESIGN.md` | 改変 | review cadence を bug burn-down に書き換え |

### 4.3 ファイル間依存

```
GLOSSARY.md ──┐
              ├─▶ parity_glossary_mask.mjs ──┐
INVARIANT_TOKENS.md ──┘                     │
                                            ├─▶ source_parity_align.mjs
parity_normalize.mjs ───────────────────────┘           │
                                                        ▼
                                         check_source_parity.mjs
                                                        │
                                                        ▼
                                           parity-check-status.json
                                             ├─ summary.* (gate)
                                             └─ debug.maskCoverage (診断)

astro.config.mjs ───┐
global.css ─────────┤
source_parity_segments_en.mjs ──── [CONTRACT TEST] callout type 集合一致
source_parity_segments_ja.mjs ──┘
WRITING_GUIDE.md §133 ──────────┘
```

---

## 5. Success Criteria

Phase 0 完了条件は以下全てを満たすこと:

1. `docs/WRITING_GUIDE.md`、`TRANSLATION_GUIDE.md`、`PARITY_GUIDE.md`、`OPS_DESIGN.md` が Invariant 1-5 に準拠した記述になっている
2. `docs/GLOSSARY.md` と `docs/INVARIANT_TOKENS.md` が新設され、既存の Testim 用語表が昇格されている
3. `scripts/lib/parity_glossary_mask.mjs` が実装され、単体テストが通る
4. `scripts/lib/parity_normalize.mjs` が実装され、単体テストが通る
5. `scripts/lib/source_parity_align.mjs` の `looksUntranslated()` 呼び出しが glossary_mask 経由に置換され、既存テストが通る
6. `scripts/check_source_parity.mjs` が `parity-check-status.json` に `debug.maskCoverage` を出力する
7. Contract test により gate / baseline / ack 系の code path が `debug.*` を参照しないことが静的保証される
8. Contract test により callout type 集合が 4 レイヤーで `{note, caution, warning, info, tip, danger}` に一致する
9. `astro.config.mjs` から `success` が削除され、`caution` が追加されている。`src/styles/global.css` も整合
10. `parity-baseline.json` を Phase 0 後に再生成し、削減件数を記録したレポート (`docs/superpowers/specs/2026-04-14-parity-oracle-phase0-report.md`) が存在する
11. `npm run test`、`npm run lint`、`npm run build`、`npm run check:parity` が全て通る

**定量目標（期待値、厳密な gate ではない）**: Phase 0 完了時点で baseline 件数が 622 → 450 〜 500 に減少（glossary mask で吸収される `segment-untranslated` の invariant 部分 + URL normalize で吸収される `segment-token-gap` localized link 部分）。実際の削減件数は baseline 再生成で確定し、レポートに記載する。

---

## 6. Test Strategy

### 6.1 単体テスト (TDD)

- `parity_glossary_mask.mjs`: glossary entry match / invariant pattern match / residue detection / mask record 形式を個別に pin
- `parity_normalize.mjs`: URL rewrite の双方向性 / canonical 化 / 非対象 URL のスルーを pin
- 各 pattern は既知 baseline entry に対する RED → GREEN を踏んで導入する

### 6.2 Contract Test

- **Callout type 集合の一致**: 4 レイヤーから type 集合を抽出し `assert.deepStrictEqual()` で `{note, caution, warning, info, tip, danger}` と一致することを検証
- **Debug artifact の独立性**: gate logic (`check_source_parity.mjs` の `summary.result` 決定コード、`source_parity_baseline.mjs` の BASELINE_ELIGIBLE_TYPES 参照、`source_parity_acknowledgements.mjs` の match 判定) が `debug.*` namespace を import / 参照していないことを grep-based static test で検証

### 6.3 Regression Test

- 既存の `source_parity_align_runtime.test.mjs` / `source_parity_baseline.test.mjs` が新コードベースで全て通ること
- `parity-check-status.json` の schema version を上げ（既存 consumer が壊れないことを確認）、新規 `debug.*` フィールドは optional として扱う

### 6.4 Integration Test

- glossary mask を有効にした状態で、代表 slug (`editing-tests/steps`、`advanced-editing/coding-assistant`) に対する baseline 再生成が想定通り減少することを確認
- URL normalize が代表 slug (`advanced-editing/hooks`、`advanced-editing/parameters`) で localized link の token-gap を吸収することを確認

---

## 7. Risk & Mitigation

| リスク | 影響 | 緩和 |
| --- | --- | --- |
| `looksUntranslated()` を mask に置き換えると table-cell 102 件の本物のバグが炙り出される → 一時的に issue 件数が見かけ上増える可能性 | baseline diff レポートが混乱 | Phase 0 では baseline 再生成時に **diff の内訳** を `issueType × segmentKind × maskRecord 理由` で集計したレポートを出す。Phase 1 で本物バグとして burn-down |
| callout `caution` 追加で既存 `:::warning` マッピングの翻訳者習慣が変わる | 既存 JA content で `:::warning{title="注意"}` と書いているものが移行必要? | 移行は Phase 1 以降。Phase 0 では **renderer に受け口を用意するのみ**で、既存 `:::warning` は警告無く動き続ける。WRITING_GUIDE にも「将来は `:::caution` へ移行、当面は `:::warning` のままで良い」と記載 |
| `success` 削除で誰かが `:::success` を書いていた場合、表示崩壊 | visual bug | 事前 grep で JA content / EN snapshot 両方に `success` が 0 件であることを verify 済み (2026-04-14 時点) |
| mask record の `debug.maskCoverage` のサイズが大きくなり status file が肥大化 | CI artifact サイズ、読み込み時間 | page 単位で `summary` に集計し、詳細は optional として debug mode でのみ fully emit する実装にする（Task E で詳細） |
| `parity_normalize.mjs` の URL rewrite が既存 `EXCLUDED_INVARIANT_URL_TOKENS` と衝突 | token-gap の挙動変化 | 既存 token 除外は `extractInvariantTokens()` 内で行われており、normalize は align 側の pair comparison でのみ適用。順序を明確に分離 |
| WRITING_GUIDE 改訂が既存 lint ルールと衝突 | `npm run lint:docs` 失敗 | `scripts/lint_docs.mjs` が参照する rule set を先に検証、必要なら同 PR 内で lint 側も更新 |

---

## 8. Out-of-Scope（明示的な除外）

- **Content fixes (Phase 1 以降)**: 132 slug の individual 修正は Phase 0 では行わない
- **Micro-exclusion layer**: `parity_token_exclusions.mjs` の新設は Phase 0 後の残 baseline を見て判断。現時点では `source_sync_exclusions.mjs` (page-level) + glossary/normalize で足りるかを実測で確認する
- **Translation quality 自動評価**: 自然さ・丁寧語・カタカナ表記等の自動検証は既存 `lint_docs.mjs` の範囲内のまま
- **Visual callout redesign**: `caution` と `warning` の色分け等は UX 必然性が出てから
- **baseline schema 簡素化**: `reviewAfter` / `inconclusiveCategory` / `usabilityReason` の削除は Phase 4 以降

---

## 9. Follow-ups（Phase 0 後）

- **Phase 0 後レポート**: baseline 再生成結果を分析し、残 entry の issueType × segmentKind × 具体的 token/pattern で分類。これが Phase 1 の計画根拠になる
- **Phase 1**: 頻出パターン (preface 重複、手順導入文分離、callout 番号リスト inline 化) の機械的バッチ修正
- **Phase 2**: Top 2 大物ファイル手動修正 + segment-missing 翻訳復元
- **Phase 3**: JA 独自 callout の個別削除
- **Phase 4**: baseline schema 簡素化、`reviewAfter` 削除、残 `segment-inconclusive` 個別判断
