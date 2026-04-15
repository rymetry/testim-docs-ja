# Parity Baseline Burn-down — Phase 1-4 Roadmap

- **Date**: 2026-04-14
- **Author**: Claude (design)
- **Phase 0 Spec**: `docs/superpowers/specs/2026-04-14-parity-oracle-contract-design.md`
- **Phase 0 Plan**: `docs/superpowers/plans/2026-04-14-parity-oracle-contract-phase0.md`

---

## 1. 目的

Phase 0 で整備した **EN = 構造 oracle、JA = 鏡写し、mask/normalize で説明可能に除外** という契約の上で、残存する **未解決 bug backlog (baseline)** を Phase 1-4 で burn-down する。最終状態:

- baseline = 曖昧な自動判定限界 (`segment-inconclusive`) のみ ~10 件前後
- 全ての structural mismatch (extra / missing / structure) が解消
- `parity_baseline.json` schema から "allowlist" 的フィールド (`reviewAfter`, `inconclusiveCategory`, `usabilityReason`) が削除され、純粋な bug backlog 形式に統一

## 2. Phase 0 後の想定状態 (入力)

Phase 0 の glossary_mask + URL normalize + 契約整合が完了した時点で、以下の削減が自動的に発生する想定:

| 種別 | Phase 0 前 | Phase 0 吸収 | Phase 0 後残 (推定) |
| --- | --- | --- | --- |
| segment-extra | 193 | 0 (構造差分、吸収対象外) | 193 |
| segment-missing | 136 | 0 | 136 |
| segment-untranslated | 146 | ~120 (Testim 用語 + invariant pattern) | ~26 |
| section-structure-mismatch | 86 | 0 (派生なので Phase 1 の修正で連鎖解消) | 86 |
| segment-token-gap | 49 | ~15 (localized link) | ~34 |
| segment-inconclusive | 11 | 0 | 11 |
| segment-order-mismatch | 1 | 0 | 1 |
| **合計** | **622** | **~135** | **~487** |

**注意**: 実値は Phase 0 完了後のレポート (`2026-04-14-parity-oracle-phase0-report.md`) で確定する。本 roadmap は想定値で計画を立て、各 Phase 実行前にレポートを反映して再確認する。

## 3. Phase 構成

### Phase 1: 頻出パターンのバッチ修正

**対象**: `segment-extra` 193 件のうち機械的に修正可能な 3 パターン
- **Pattern 1** (preface 重複): 45 件、27 slug — frontmatter description と同内容の段落が JA preface にだけ存在
- **Pattern 2** (手順導入文の段落分離): 約 25 件 (segment-extra section 内の paragraph 25 件のうち pattern 該当分) — `:fa-arrow-right:` が JA で別段落に分離
- **Pattern 3** (callout 内番号リスト展開): 約 80-100 件 (ul-item 58 + ol-item 23 のうち pattern 該当分) — callout 内のインライン番号列が Markdown リストに展開

**派生解消**: `section-structure-mismatch` の大半 (~60-80 件) がこれらの修正で連鎖解消する想定

**構成**: 3 PR、並列可、各 PR 後に baseline 再生成

**Plan**: `docs/superpowers/plans/2026-04-14-parity-phase1-pattern-burndown.md`

### Phase 2: 手動修正 (Phase 1 完了後の実測で再構築)

**対象** (2026-04-14 実測、Phase 1 完了後):
- **Phase 2.0** (glossary 監査 + untranslated 翻訳、次 round): `segment-untranslated` 1903 件 / 218 slug — 最大残件
- **Phase 2.1** (Top 2 files): `editing-tests/steps` 31 件、`editing-a-steps-properties` 39 件。glossary mask が Top 2 には効かなかった実績を踏まえ、**翻訳作業として実行**
- **Phase 2.2** (segment-missing 翻訳復元): **127 件、66 slug** — EN 段落を JA が統合・省略
- **Phase 2.3** (residual token-gap): **49 件、43 slug** — CLI フラグ、内部リンク、数値単位欠落
- **Phase 2.4** (residual structure、次 round): `segment-extra=102 − callout-body 17 = 85 件` と `section-structure-mismatch=66` の派生整理

**構成:** **単一統合 PR** (baseline 直列更新、content 修正は subagent 並列 isolated worktree)
**本 round 実行:** Phase 2.1 / 2.2 / 2.3 / 2.5
**次 round 実行:** Phase 2.0 / 2.4

**Plan**: `docs/superpowers/plans/2026-04-14-parity-phase2-bulk-fixes.md`

### Phase 3: JA 独自 callout の削除

**対象**: `segment-extra` かつ `segmentKind = callout-body` の 29 件、20 slug
- JA が読者向けに追加した callout (EN 原文にない) の個別削除
- 翻訳ニュアンスを本文に edge-case で吸収する場合あり (翻訳者判断)

**構成**: 1-2 PR、並列エージェント委任可、**翻訳ニュアンス判断を含むため LLM 委任の品質 gate が重要**

**Plan**: `docs/superpowers/plans/2026-04-14-parity-phase3-ja-only-removal.md`

### Phase 4: schema 簡素化 + 残存整理

**対象**:
- `segment-inconclusive` 11 件の個別判断 (翻訳 or baseline 保持 or micro-exclusion)
- `segment-order-mismatch` 1 件
- baseline schema から `reviewAfter` / `inconclusiveCategory` / `inconclusiveReason` / `usabilityReason` を削除
- `source_parity_baseline.mjs` の allowlist 前提コードを bug backlog 前提に書き換え
- micro-exclusion 層 (`parity_token_exclusions.mjs`) の必要性判断 — 残 EN-side artifact が 3-5 件なら page-level で吸収、10 件以上で汎用化

**構成**: 1 PR、code refactor + schema migration

**Plan**: `docs/superpowers/plans/2026-04-14-parity-phase4-schema-cleanup.md`

## 4. Phase 間依存

```
Phase 0 (契約整備 + baseline 再生成) ───┐
                                        │
                                        ▼
        ┌───── Phase 1.1 (preface) ─────┐
        │                               │
        ├───── Phase 1.2 (手順導入文) ──┤
        │                               │
        ├───── Phase 1.3 (callout 番号) ┤
        │                               │  ← baseline 再生成 (派生解消確認)
        ▼                               ▼
        Phase 2.1 (Top 2 残件)  ←────────┐
                                         │
        Phase 2.2 (segment-missing) ─────┤
                                         │
        Phase 2.3 (token-gap 残) ────────┤  ← baseline 再生成
                                         │
        Phase 3 (JA 独自 callout) ──────┐│
                                        ▼▼
                              Phase 4 (schema + 残整理)
                                        │
                                        ▼
                                  ★ burn-down 完了
```

**並列可能性**:
- Phase 1.1 / 1.2 / 1.3 は相互独立 → 3 並列可能
- Phase 2.1 / 2.2 / 2.3 は相互独立 → 3 並列可能
- Phase 3 は Phase 2.2 (segment-missing) と間接依存 (同じ slug で両方発生するケースあり) — 同じ slug に触る場合は順次、そうでなければ並列可

## 5. 完了判定基準 (Final DoD — 5 counter 0)

Phase 1-4 全体の完了条件は、以下 **5 つの counter がすべて 0** であること。測定は JSON artifact (`parity-baseline.json` / `parity-check-status.json` / `snapshot-diff-status.json`) に対する機械的判定で行う。詳細と runtime 検出 3 枠 (actionable-baseline / parity-artifact-registry / advisory-residual) の責務分離は `docs/superpowers/specs/2026-04-14-parity-phase4-final-goal.md` を参照。

### baseline

```
parity-baseline.json.entries.length === 0
parity-baseline.json.schemaVersion  === 2
```

### parity-check-status.json (summary counters)

```
summary.reportableActiveFiles === 0
summary.baselinedIssues       === 0
summary.advisoryQueueIssues   === 0
summary.auditSignalIssues     === 0
debug.artifactCoverage exists with keys { registryEntries, matchedHits, bySlug, byToken }
```

### snapshot-diff-status.json

```
summary.changed === 0 && summary.added === 0 && summary.removed === 0
```

### schema / runtime invariants

```
BASELINE_ELIGIBLE_TYPES ⊆ { segment-missing, segment-extra, segment-shifted,
                             segment-untranslated, segment-token-gap,
                             section-structure-mismatch, segment-order-mismatch }
(reviewAfter は baseline schema / runtime tagging / summary / queue どこにも存在しない)
(baselineReviewAfter / baselineExpired は issue / queue / issue_state どこにも存在しない)
(inconclusiveReason は runtime issue 側にのみ存在。baseline entry schema には存在しない)
isFrozenByBaseline(issue) ≡ issue.baselined === true
alignSegments は必ず { slug } option 付きで呼ばれる (grep 検証)
```

### gates

```
npm run test && npm run lint && npm run build が green
npm run check:parity && npm run check:snapshots:diff が green
```

### 運用ドキュメント

- `docs/OPS_DESIGN.md` / `docs/PARITY_GUIDE.md` が burn-down 完了後の定常運用 (バグ検知 ≡ 失敗 gate) を反映している
- `docs/superpowers/specs/2026-04-14-parity-phase4-final-goal.md` が 5 counter 0 DoD の根拠・測定方法・runtime 検出 3 枠・`debug.artifactCoverage` 契約・callout-normalization の single source of truth を記述している

## 6. リスク・緩和

| リスク | 影響 | 緩和 |
| --- | --- | --- |
| Phase 1 のパターン修正で意図せず他の意味を壊す | 翻訳品質低下 | 各 PR で既存 lint (`npm run lint:docs`) + 翻訳レビュー (codex 併用) |
| Phase 2.2 の segment-missing 翻訳復元で LLM 精度不足 | 再度 segment-missing か segment-untranslated を emit | 並列エージェント委任時に glossary + INVARIANT_TOKENS を送り、完了後に baseline diff で検証 |
| Phase 3 の JA 独自 callout 削除で読者体験が悪化 | ユーザー苦情 | 削除対象 29 件を事前に分類し、「本当に EN にない必須情報」を含む callout は本文内に統合（構造保存、情報保存） |
| Phase 4 の schema migration で既存 baseline entry を誤って破棄 | 調査困難な回帰 | migration は pure function として実装し、入出力の entry 数 / 内容を test で pin |
| 並列エージェント委任時の branch / worktree 衝突 | 手戻り | 各 phase で worktree を分離、`PARITY_GUIDE.md §並列エージェント委任の注意` に従う |

## 7. タイムライン想定

| Phase | 所要 | 並列度 |
| --- | --- | --- |
| 0 | 2-3 日 | 単独 |
| 1 | 2-3 日 | 3 並列 |
| 2 | 3-5 日 | 3 並列 + 翻訳 LLM 委任 |
| 3 | 1-2 日 | 1-2 並列 |
| 4 | 1 日 | 単独 |
| **合計** | **9-14 日** | |

現実的にはレビュー待ち・LLM 翻訳待ち・他タスク挿入で **2-3 週間** が目安。

## 8. 成果物

完了時点で以下が揃う:

- ✅ `parity-baseline.json`: 10-20 件の真に曖昧な inconclusive のみ
- ✅ 132 slug の content fix (Phase 1-3 で触る)
- ✅ `scripts/lib/source_parity_baseline.mjs`: bug backlog 前提にリファクタ、schema 簡素化
- ✅ `docs/OPS_DESIGN.md` / `docs/PARITY_GUIDE.md`: 定常運用の記述更新
- ✅ Phase 0 → 1 → 2 → 3 → 4 の cutover report (各 Phase 完了後に `docs/superpowers/specs/*-report.md` として保存)
- ✅ 今後の新規コンテンツ追加で parity 検知が green を維持できることを test + 実運用で確認

## 9. Phase 0 後の再計画

本 roadmap は Phase 0 完了前の想定値で立てている。Phase 0 完了後、`2026-04-14-parity-oracle-phase0-report.md` の実測値に基づいて以下を再確認する:

1. 各 Phase の対象件数
2. Phase 間の依存 (特に Phase 2.1 は Phase 0 吸収で不要になる可能性あり)
3. 所要時間見積もり
4. 並列度の再判定

再計画後、本 roadmap を update し、各 Phase plan の対象 slug リストを refresh する。
