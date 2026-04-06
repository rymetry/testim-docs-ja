# Issue #225 Phase 6B Implementation Plan

> **Status**: Provider-free re-scope 完了。Phase 6B は semantic detector を作るのではなく、Phase 6A の `tokenless-near-tie` を review queue として surfacing する phase として実装する。

**Spec**: `docs/superpowers/specs/2026-04-06-issue-225-phase-6b-design.md`

**Goal**: 既存の `segment-inconclusive / tokenless-near-tie` を LLM / 人手で処理しやすい review queue として可視化する。gate には入れない。新 detector も作らない。

**Architecture**: `check_source_parity.mjs` 実行結果から provider-free の review queue を導出し、`parity-check-status.json` と CLI に載せる。翻訳・PR 作成の自動化は Issue #175 に委譲する。

**Tech Stack**: Node.js (ESM), `node:test`, 純粋関数 + CLI 表示。外部 provider / cache / benchmark なし。

---

## Prerequisites

- [x] Phase 6A PR2 (cutover) が merge 済み
- [x] Phase 6A baseline に `tokenless-near-tie` エントリが存在
- [x] 外部 provider を使わない前提が確定
- [x] 翻訳ワークフロー自動化は Issue #175 で別途検討中

---

## Phase 6B-1 — Review Queue Plumbing

**Scope**: 既存 issue から review queue を導出し、JSON / CLI に出す。exit code は不変。

### File structure

| File | 変更内容 |
|------|----------|
| `scripts/lib/source_parity_advisory_queue.mjs` (new) | `tokenless-near-tie` review queue 導出 |
| `scripts/lib/source_parity.mjs` (modify) | barrel export 追加 |
| `scripts/check_source_parity.mjs` (modify) | `--include-advisory` フラグ、queue summary / JSON / CLI 出力、scope metadata |
| `scripts/__tests__/source_parity_advisory_queue.test.mjs` (new) | queue helper / scope / stable key テスト |
| `scripts/__tests__/check_source_parity.test.mjs` (modify) | `--include-advisory` 引数テスト |
| `scripts/README.md` (modify) | Phase 6B review queue の説明追加 |

### Tasks

#### Task 6B-1.1: Pure helper を追加

- `segment-inconclusive` かつ `tokenless-near-tie` のみ抽出
- queue entry に `slug`, `file`, `sourceUrl`, `category`, `blocking`, `issues[]`, `queueKey` を持たせる
- summary 用に `advisoryQueueIssues`, `advisoryQueueFiles`, `advisoryQueueByCategory` を集計
- `advisoryQueueScope` で full / partial を明示する

#### Task 6B-1.2: `check_source_parity` に統合

- `parseArgs()` に `--include-advisory` を追加
- `parity-check-status.json` に `advisoryQueue` と `advisoryQueueScope` を追加
- summary に queue counts を追加
- `--include-advisory` の時だけ CLI に `[Phase 6B review queue]` セクションを出す
- exit code 判定ロジックは変更しない

#### Task 6B-1.3: テスト追加

- helper 単体テスト
- CLI 引数パーステスト
- Phase 6A recall / baseline-recall の非回帰確認

#### Task 6B-1.4: README 更新

- `--include-advisory` の意味
- review queue は derived data であり detector ではないこと
- gate / CI への影響がないこと

### Exit criteria

| ID | 条件 | 検証 |
|----|------|------|
| B1-C1 | 通常 `check:parity` の exit code が不変 | `npm run check:parity -- --fail-on=actionable` |
| B1-C2 | `--include-advisory` で review queue が表示される | `npm run check:parity -- --include-advisory` |
| B1-C3 | `parity-check-status.json` に queue が出力される | manual inspect |
| B1-C4 | Phase 6A recall 回帰なし | `node --test scripts/__tests__/source_parity_recall.test.mjs` |
| B1-C5 | Phase 6A baseline recall 回帰なし | `node --test scripts/__tests__/source_parity_baseline_recall.test.mjs` |

### Non-goals

- `suspected-section-swap` のような新 issue type
- provider / detector
- mutation corpus 拡張
- advisory benchmark
- detection reports / issue sync 統合

---

## Phase 6B-2 — Manual Triage Workflow

**Scope**: queue を実際の review 作業に接続する。自動化はしない。

### Tasks

#### Task 6B-2.1: Reviewer workflow docs

- `docs/OPS_DESIGN.md` に 6B review queue セクション追加
- 確認観点、修正方針、保留時の扱いを明記

#### Task 6B-2.2: 7 件の queue を triage

- `advanced-editing/validations/add-network-validation`
- `advanced-editing/validations/email-validation`
- `overview/changelog`
- `running-tests/scheduler`
- `running-tests/scheduler-mobile`
- `salesforce-testing/changelog`
- `test-management/revisions`

#### Task 6B-2.3: Cleanup / handoff

- true positive は翻訳修正 PR
- harmless ambiguity は rationale 記録
- 翻訳・PR 自動化の入口が必要なら Issue #175 側へ requirements を渡す

### Exit criteria

- 7 件を個別に判断済み
- reviewer workflow が documented
- 必要な follow-up が #175 または別 Issue に移送済み

---

## Risks and Rollback

| リスク | 対処 |
|-------|------|
| review queue が semantic detector と誤解される | docs / CLI で「existing issue derived」と明記 |
| 自動化要件が 6B に流入する | 翻訳実行系は #175 に寄せる |
| queue を増やしすぎる | Phase 6B は `tokenless-near-tie` のみに固定 |

rollback:

- helper module と CLI 出力を revert
- docs の 6B 記述を戻す

Phase 6A gate には一切触れないため、rollback は軽量。
