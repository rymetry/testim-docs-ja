# Issue #225 Phase 6B Implementation Plan (Roadmap Skeleton)

> **Status**: DRAFT — Phase 6B-1 着手前に `superpowers:brainstorming` で spec の open questions (§6) を解消すること。本 plan は roadmap であり、直接実行可能な bite-sized TDD plan ではない。brainstorming 完了後に本 plan を更新するか、Phase 6B-1 専用の execution plan を別途起こす。

**Spec**: `docs/superpowers/specs/2026-04-06-issue-225-phase-6b-design.md`

**Goal**: Phase 6A exact gate が捕捉できない tokenless prose-only section body swap を **advisory signal** として検出する。primary gate には入れない。

**Architecture**: cross-lingual embedding provider + assignment-based mismatch detector + `parity-check-status.json` への advisory accounting 追加。Phase 6A とは別コードパスで、`--include-advisory` フラグで opt-in。

**Tech Stack**: Node.js (ESM), `node:test`, SHA-256 / hash-based stub provider, 実 provider は Phase 6B-2 で選定。

---

## Prerequisites (before execution)

- [ ] Phase 6A PR2 (cutover) が merge 済み
- [ ] Phase 6A baseline に `tokenless-near-tie` エントリが存在（Phase 6B の初期ターゲット）
- [ ] Phase 6B spec の §6 open questions がすべて解消
  - Q1: Real embedding provider
  - Q2: Cache strategy
  - Q3: Advisory scope default
  - Q4: Hungarian vs 2-swap
  - Q5: Output persistence
  - Q6: Reviewer workflow automation
  - Q7: CI integration

---

## Phase 6B-1 — Infrastructure (stub provider)

**Scope**: advisory channel + detector をすべて接続するが、実 provider は stub のみ。CI exit code は一切変わらない。

**File structure**:

| File | 責務 |
|------|------|
| `scripts/lib/semantic_providers/stub_deterministic.mjs` (new) | deterministic stub provider（hash-based 疑似 embedding） |
| `scripts/lib/advisory_section_swap.mjs` (new) | detector 本体（section body vector + 類似度行列 + assignment） |
| `scripts/lib/source_parity_types.mjs` (modify) | `suspected-section-swap` を `ISSUE_SEVERITY` に追加 (`signal`) |
| `scripts/lib/source_parity_acknowledgements.mjs` (modify) | `NON_ACKNOWLEDGEABLE_TYPES` に追加 |
| `scripts/lib/source_parity_summary.mjs` (modify) | advisory accounting (`advisoryIssues` / `advisoryFiles` / `advisoriesByType` / `advisoryProvider`) |
| `scripts/check_source_parity.mjs` (modify) | `--include-advisory` フラグ、detector 呼び出し、CLI 出力セクション |
| `scripts/lib/mutation_corpus.mjs` (modify) | `tokenless-section-body-swap` mutation 追加 |
| `scripts/__tests__/semantic_provider_stub.test.mjs` (new) | stub provider の determinism / dimension テスト |
| `scripts/__tests__/advisory_section_swap.test.mjs` (new) | detector 単体テスト |
| `scripts/__tests__/source_parity_advisory_recall.test.mjs` (new) | mutation corpus benchmark（stub で動作、数値 Go なし） |
| `scripts/__tests__/check_source_parity.test.mjs` (modify) | `--include-advisory` 統合テスト |
| `scripts/README.md` (modify) | Phase 6B-1 セクション追加 |

**Task outline (bite-sized に展開するのは brainstorming 後)**:

### Task 6B-1.1: `suspected-section-swap` type 登録

- `source_parity_types.mjs` に `'suspected-section-swap': 'signal'` を追加
- `source_parity_acknowledgements.mjs` の `NON_ACKNOWLEDGEABLE_TYPES` に追加
- 既存の ISSUE_SEVERITY / NON_ACKNOWLEDGEABLE_TYPES テストを拡張
- TDD: test first, then implement

### Task 6B-1.2: summarizeParityResults の advisory accounting

- `phase: 'advisory'` tag を識別
- `advisoryIssues` / `advisoryFiles` / `advisoriesByType` / `advisoryProvider` フィールド追加
- advisory は `activeFiles` / `activeActionableFiles` / `activeErrorFiles` に**含めない**
- Phase 6A の shadow accounting と同じパターン
- 単体テスト: advisory の分離集計を検証

### Task 6B-1.3: SemanticProvider interface と stub 実装

- `scripts/lib/semantic_providers/stub_deterministic.mjs` 新設
- interface: `{ name, version, dimension, embed(texts, language?) }`
- stub 実装: byte-hash projection で deterministic pseudo-embedding
- テスト:
  - 同じ入力 → 同じ出力（determinism）
  - dimension が固定
  - 空配列対応
  - 異なる text → 異なる vector（衝突しない）

### Task 6B-1.4: Advisory detector core

- `scripts/lib/advisory_section_swap.mjs` 新設
- 関数: `detectSectionSwaps({ enSegments, jaSegments, provider, options })`
- アルゴリズム:
  1. section 分割（Phase 6A の `splitIntoSections` を reuse）
  2. 各 section の body text を concatenate
  3. provider.embed で EN / JA 両側を batch embed
  4. 2-swap simple version: 隣接 2 section の swap score を計算
  5. delta > `DELTA_THRESHOLD` なら advisory を emit
- Hungarian は Phase 6C（spec Q4 推奨 B）
- テスト:
  - 完全一致 → advisory 0 件
  - 既知 swap fixture → advisory 1 件
  - 短すぎる body → skip
  - provider が同じ vector を返す edge case → 0 件

### Task 6B-1.5: Mutation corpus extension

- `mutation_corpus.mjs` に `tokenless-section-body-swap` mutation を追加
- 既存の `section-body-swap` は token 付き、新規は tokenless
- 隣接 2 section の body を swap する
- mutation metadata に `swappedSectionIndices` を含める
- テスト: mutation 適用後に section body が実際に swap されることを検証

### Task 6B-1.6: check_source_parity 統合

- `--include-advisory` フラグを追加
- フラグが指定されたら:
  - default scope: `parity-baseline.json` 内の `segment-inconclusive` entries で `inconclusiveCategory: 'tokenless-near-tie'` のページのみ
  - stub provider を instantiate
  - 各ページで `detectSectionSwaps` を呼ぶ
  - emit された advisory を issues に追加
- CLI summary に `[Phase 6B advisory]` セクション
- stub を使っている旨の注意書き（`⚠ stub provider — not meaningful for correctness review`）

### Task 6B-1.7: Advisory benchmark scaffold

- `source_parity_advisory_recall.test.mjs` 新設
- `mutation_corpus` の `tokenless-section-body-swap` を各 representative page に適用
- stub provider で detector を実行
- 結果を `advisory-benchmark-report.json` に出力（Phase 6B-2 で実 provider の結果と比較可能にする）
- 数値 Go 条件は**設定しない**（stub の結果は意味なし）
- 単に pipeline が動くことを assertion

### Task 6B-1.8: README + spec 更新

- `scripts/README.md` に Phase 6B-1 セクション追加
- Phase 6B-1 完了を spec に反映

**Phase 6B-1 Exit criteria**:

| ID | 条件 | 検証 |
|----|------|-----|
| B1-C1 | CI exit code が変わらない | `npm run check:parity --fail-on=actionable; echo $?` = 0 |
| B1-C2 | Phase 6A recall benchmark 回帰なし | `node --test scripts/__tests__/source_parity_recall.test.mjs` |
| B1-C3 | Phase 6A baseline recall (C4) 回帰なし | `node --test scripts/__tests__/source_parity_baseline_recall.test.mjs` |
| B1-C4 | `--include-advisory` で advisory が出力される | `npm run check:parity -- --include-advisory` |
| B1-C5 | advisory は gate fail させない | `npm run check:parity -- --include-advisory --fail-on=actionable; echo $?` = 0 |
| B1-C6 | stub provider determinism | `source_parity_advisory.test.mjs` |
| B1-C7 | mutation corpus 拡張テスト pass | `source_parity_advisory_recall.test.mjs` |
| B1-C8 | README / spec 更新済 | manual review |

**Non-goals of Phase 6B-1**:
- 意味的に正しい detection（stub の結果は pipeline テスト専用）
- real provider 選定・integration
- threshold tuning
- 実際の tokenless-near-tie page の triage
- disk cache
- reviewer workflow の documented 化

---

## Phase 6B-2 — Real provider integration

**Scope**: 実 embedding provider を接続して precision / recall を測定。

**Prerequisites**:
- Phase 6B-1 merge 済み
- Spec Q1 の provider 選定が確定（recommended: OpenAI `text-embedding-3-small`）
- API key / cost budget の確認

**Task outline (high-level)**:

### Task 6B-2.1: Real provider 実装

- `scripts/lib/semantic_providers/<provider_name>.mjs` 新設
- API client with timeout / retry / rate limit
- 環境変数による API key 設定（`.env` 経由）
- batching (最大 batch size を respect)
- エラー時は stub にフォールバックしない（silently 動作は禁止）

### Task 6B-2.2: Embedding cache (in-memory)

- 同一 run 内での重複 embed を回避
- key: `sha256(provider_name + provider_version + text)`
- 複数ページ / 複数 section で同じ text が出現した場合に reuse

### Task 6B-2.3: Threshold tuning

- synthetic mutation benchmark で `DELTA_THRESHOLD` を決定
- un-mutated pages での false positive rate を測定
- 閾値を `advisory_section_swap.mjs` の定数に反映

### Task 6B-2.4: Real benchmark

- `source_parity_advisory_recall.test.mjs` を real provider で実行
- `advisory-benchmark-report.json` に結果を出力
- spec §5.2 の informational targets (recall ≥ 50%, precision ≥ 90%) を確認
- 数値 hard gate ではない

### Task 6B-2.5: Disk cache (optional)

- Spec Q2 で disk cache が approved された場合のみ
- `.cache/semantic-embeddings/<provider_name>-<version>/<hash>.json`
- `.gitignore` に追加
- cache hit / miss の metric を CLI に表示

### Task 6B-2.6: Provider docs

- `scripts/README.md` で provider 設定方法を documented
- cost estimation / rate limit / fallback behavior を記載

**Phase 6B-2 Exit criteria (informational)**:

| ID | 条件 |
|----|------|
| B2-C1 | real provider で benchmark 実行 pass |
| B2-C2 | 7 件の tokenless-near-tie page に対して detector が動作 |
| B2-C3 | synthetic mutation に対して recall ≥ 50%（informational） |
| B2-C4 | un-mutated page での false positive rate ≤ 10%（informational） |
| B2-C5 | API cost 推定が spec に記載 |
| B2-C6 | CI 追加時間が許容範囲内（< 5 min for full advisory run） |

---

## Phase 6B-3 — Rollout and reviewer workflow

**Scope**: 現状の tokenless-near-tie baseline entries をレビュー可能状態にし、workflow を確立する。

**Prerequisites**: Phase 6B-2 merge 済み、real provider が動作。

**Task outline (high-level)**:

### Task 6B-3.1: Reviewer workflow documentation

- `docs/OPS_DESIGN.md` に advisory reviewer section
- advisory が出た場合の判定手順
- false positive を記録する方法
- 翻訳修正 PR のテンプレート

### Task 6B-3.2: Triage the 7 tokenless-near-tie pages

- 各 page を手動 review
- advisory detector が何を flag したか確認
- true positive → 翻訳修正 PR
- false positive → detector 誤発火の原因記録、spec の threshold 再調整の input

### Task 6B-3.3: Baseline cleanup

- 修正済 tokenless-near-tie entry を baseline から削除
- false positive と判定した entry は `rationale` に理由を追記

### Task 6B-3.4: Phase 6C / Phase 7 への引き継ぎ

- 学びを Phase 6C の brainstorming 材料として記録
- Phase 7 reporting 4 family 化で advisory を独立 family として扱う設計メモ

**Phase 6B-3 Exit criteria**:
- 7 件の tokenless-near-tie に対して個別処理完了
- reviewer workflow が documented
- Phase 6A baseline から tokenless-near-tie エントリが削減（部分または全部）

---

## Risks and Rollback

### Common risks across 6B-1/6B-2/6B-3

| リスク | 対処 |
|-------|------|
| advisory detector が Phase 6A recall を regression させる | 別コードパス、Phase 6A test を回帰防止として常時実行 |
| stub provider の結果を reviewer が真に受ける | CLI に注意書き、default off、Phase 6B-1 では real としての integration を禁止 |
| real provider の cost 暴走 | monthly budget 設定、rate limit、batch |
| threshold tuning が悪くて false positive 多数 | advisory は gate に入らないので CI は壊れない、手動 triage で対応 |
| 7 page を triage した結果、Phase 6B approach が使えないと判明 | Phase 6B-3 で方針転換 → Phase 6C で alternative（LLM verification 等） |

### Rollback

Phase 6B はすべて advisory なので、rollback は単純:

- **Phase 6B-1 rollback**: revert PR → `--include-advisory` フラグが無くなる、既存動作に戻る
- **Phase 6B-2 rollback**: real provider を削除、stub に戻す → advisory は stub 出力に戻る
- **Phase 6B-3 rollback**: 翻訳修正 PR は revert、baseline 変更は partial regeneration で復元

Phase 6A のような deterministic cutover ではないので、rollback playbook も軽量。

---

## Notes on execution ordering

- Phase 6A PR2 が完了するまで Phase 6B には着手しない
- Phase 6A baseline が安定してから Phase 6B の対象ページ数が確定する
- Phase 6B-1 / 6B-2 / 6B-3 は直列実行（並行しない）
- Phase 6B-1 merge 後、`tokenless-near-tie` count が 0 になっていたら Phase 6B-2 / 6B-3 は不要になる可能性（運用中に自然解消された場合）

---

## Document lifecycle

本 plan は Phase 6B-1 着手前の brainstorming で細分化される想定。brainstorming 後に:
1. spec §6 open questions を解消
2. Phase 6B-1 専用の execution plan を別途起こす（または本 plan を上書き）
3. subagent-driven-development で Phase 6B-1 を実行

Phase 6B-1 以降は段階的に plan を拡張する。

Phase 6 全体（6A + 6B）完了時に、本 plan と Phase 6A plan の両方を削除する（一時的な記録）。
