# Parity Phase 3 — JA 独自 callout 削除 Report

- **Date**: 2026-04-15
- **Branch**: `worktree-lovely-wandering-sundae`
- **Plan**: `docs/superpowers/plans/2026-04-14-parity-phase3-ja-only-removal.md`
- **Base**: Phase 2 Round 2 post-review baseline = 1873
- **Dispatch mode**: 3 subagents (sonnet 4.6, background, automode)

## Baseline delta

| issueType | Phase 2 Round 2 | Phase 3 完了 | 差 |
| --- | ---: | ---: | ---: |
| segment-untranslated | 1571 | 1543 | **-28** |
| segment-missing | 107 | 117 | +10 |
| segment-extra (total) | 87 | 97 | +10 |
| segment-extra (callout-body) | 17 | 8 | **-9** |
| section-structure-mismatch | 56 | 61 | +5 |
| segment-token-gap | 40 | 41 | +1 |
| segment-inconclusive | 11 | 11 | 0 |
| segment-order-mismatch | 1 | 2 | +1 |
| **total** | **1873** | **1872** | **-1** |

累計差 (Phase 1 終了時 2259 → Phase 3 完了時 1872): **-387 / -17.1%**

### 差分の解釈

- **segment-untranslated -28**: 主に `TTM for Jira` glossary mask と、分類2 で callout → 段落に変換したことで untranslated 判定対象外になった分
- **callout-body segment-extra -9 (17→8)**: 当初対象 17 件はすべて content から削除済み (分類1/2/3)。新たに 8 件の callout-body extras が baseline に出現したのは、「削除した callout の次のセクション内 callout が jaSegmentIndex=0 に繰り上がった」ため。既存の別 callout が再カテゴライズされた副作用で、Phase 3 スコープ外の後続課題
- **missing / extra 他 +10**: parity regen で fingerprint が変動した entry の再生成による差。actionable gate は pass

## Sub-phase summary

### Task 3.1: enumerate (1 subagent)

- `scripts/phase3/enumerate_ja_only_callouts.mjs` を作成 (464 行)
- baseline から `segment-extra && callout-body` 17 entries を抽出し、slug / sectionPath / jaSegmentIndex / 行番号 / callout type / body preview / context を決定的に出力
- `administration/api-access` に `[UX-PROTECTED: 分類3必須]` マーカー付与 (Phase 2 Round 1 の UX 保護方針を明示化)
- 出力: 279 行、17 entries / 13 slugs、`⚠` mismatch 0 件

### Task 3.2: 3 分類適用 (2 subagents、13 slug / 17 entries)

#### Group A (4 slug / 8 entries)

| slug | entries | 分類 | 処理 |
| --- | ---: | --- | --- |
| `administration/api-access` | 1 | 3 (UX-PROTECTED) | `:::tip` → `**ヒント:** …` inline 強調。Swagger リンク保持 |
| `administration/secrets` | 3 | 2+2+2 | `:::note` / `:::tip` / `:::danger` のマーカーのみ除去 |
| `recording-tests/recording-a-mobile-test/recording-a-vmg-mobile-test` | 3 | 2+2+2 | `:::warning` / `:::info` / `:::warning` のマーカーのみ除去 |
| `recording-tests/recording-a-mobile-test` | 1 | 2 | `:::warning` (multi-screen 警告) のマーカーのみ除去 |

#### Group B (9 slug / 9 entries、全て 分類2)

| slug | callout type | EN 対応 |
| --- | --- | --- |
| `advanced-editing/auto-grouping2` | `:::note` | `<div class="note">` |
| `advanced-editing/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor` | `:::note` | `<div class="note">` |
| `advanced-editing/extract-text` | `:::warning` | `<div class="note">` |
| `advanced-editing/validations/wait-for-element-visualization` | `:::info` | `<div class="note">` |
| `editing-tests/conditions/advanced-conditions-settings` | `:::note` | `<div class="note">` |
| `getting-started/creating-your-first-mobile-test-in-testim-visual-editor` | `:::warning` | `<div class="caution">` |
| `integrations/test-management-integrations/xray-integration` | `:::info` | `<div class="note">` |
| `overview/testim-overview` | `:::info` | `<div class="note">` |
| `salesforce-testing/salesforce-steps/sfdc-step-salesforce-flows` | `:::note` | `<div class="note">` |

### Task 3.6: TTM for Jira alignment + glossary (1 subagent)

- `docs/GLOSSARY.md` に `TTM for Jira | Tricentis Test Management for Jira` を追加
- `ttm-for-jira-integration.md` の alignment 修正:
  - `Setting up TTM for Jira Integration` セクション: intro paragraph + bold header を 1 段落に統合
  - `Bulk Create & Map Test Cases to TTM for Jira` セクション: JA 独自 unordered-list 2 行を callout-body 段落に統合 (EN の `<div class="note">` 対応)
  - `Upon Testim test run execution end` セクション: 1 つ目 `:::warning` を plain paragraph に、2 つ目 `:::warning` を `:::info` に修正
- ttm-for-jira-integration active non-untranslated issues: 3 → 1 (残り 1 件は EN `<br>` バグによる ordered-list 2 分割、DoD ≤1 達成)
- 他 slug への glossary mask collateral なし

### Task 3.4: baseline regen + gate

- `npm run check:parity --fail-on=actionable` exit 0
- `npm run lint:docs` 0 error / 0 warning
- `npm run test` 1726 pass / 0 fail
- `npm run build` 290 page(s) built / success
- baseline 再生成: 1873 → 1872 entries

## 分類別修正件数

- 分類 1 (純粋削除): 0 件
- 分類 2 (callout 解除のみ): 15 件 (12 slug)
- 分類 3 (本文統合): 2 件 (`administration/api-access` UX 保護 + `ttm-for-jira-integration` Bulk Create section)

### codex review feedback (2026-04-15) への対応

- **P1 order**: Task 3.6 (TTM for Jira) を Task 3.4 (baseline regen) の前に移動、baseline 再生成を 1 回に統合
- **P1 DoD**: per-slug parity exit code 単独では判定せず、entry-level 差分 + `--fail-on=actionable` gate に変更
- **P2 enumerate**: entry ごとに sectionPath / jaSegmentIndex / 行番号 / preview / context を出力する決定的スクリプトに刷新
- **P2 scope**: Top 5 等の件数を post-review baseline (secrets 3 / vmg-mobile-test 3 / 他 1) に刷新、`html-attribute-validation` を scope から除去
- **Open Q (api-access)**: 分類 3 必須 (UX 保護) を plan に明文化、subagent に強制
- **Open Q (gate)**: `npm run lint:docs` / `npm run build` を Task 3.4 gate に追加

## Phase 4 へのインプット

- **残 baseline (全種類合計)**: 1872 件
- **callout-body 残 8 件 (segment-extra)**: Phase 3 副作用で新たに jaSegmentIndex=0 に繰り上がった別 callout。Phase 4 または Phase 3.5 round で対応候補
- **segment-inconclusive**: 11 件 (Phase 4 対象)
- **segment-order-mismatch**: 2 件 (+1、`ttm-for-jira-integration` の修正副作用含む、Phase 4 対象)
- **segment-untranslated 1543 件**: Phase 2.0 続行対象、Top slug 再枚挙が必要
- **schema 簡素化**: Phase 4 で reviewAfter / snapshotFingerprint 運用含めて整理予定

## Gates (Phase 3 完了時)

- [x] `npm run check:parity --fail-on=actionable` exit 0
- [x] `npm run lint:docs` 0 error / 0 warning
- [x] `npm run test` 1726 pass / 0 fail
- [x] `npm run build` success
- [x] baseline 再生成済み (1873 → 1872)
- [x] Phase 3 対象 callout 17 件すべて content から削除
- [x] `TTM for Jira` glossary 登録
- [x] `ttm-for-jira-integration` non-untranslated active ≤1
- [x] 他 slug への collateral なし
