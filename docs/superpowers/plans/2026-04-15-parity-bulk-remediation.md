# Parity Bulk Remediation — Pre-Cutover Burn-Down Plan

**Date:** 2026-04-15
**Status:** Draft (per-Stage で複数 PR に分割して実行)
**Parent plan:** [docs/superpowers/plans/2026-04-14-parity-phase4-schema-cleanup.md](./2026-04-14-parity-phase4-schema-cleanup.md) Rev 7 (PR Z の contract 定義 / 最終 DoD 機械判定版)

## 1. Context

Phase 4 plan (Rev 7) は `parity-baseline.json.entries.length === 0` / `parity-check-status.summary.{reportableActiveFiles, baselinedIssues, advisoryQueueIssues, auditSignalIssues} === 0` / `snapshot-diff-status.summary.{changed, added, removed} === 0` の atomic cutover を最終目標とする。そのうち **PR A** (Task 4.0–4.4) は pre-cutover mechanism 層 (artifact registry / URL normalizer / HTML extractor 正規化) のみを投入し、schema v1 を維持する (PR #270 merged 2026-04-15)。

本 plan はその後 **PR Z** (Task 4.5–4.8 final cutover) に着手できる水準まで baseline / advisory / audit-signal を burn down するための multi-session / multi-PR 計画である。

## 2. Baseline snapshot (post-PR A anchor / 2026-04-15)

**authoritative source:** [`docs/superpowers/specs/2026-04-15-post-pr-a-baseline-snapshot.md`](../specs/2026-04-15-post-pr-a-baseline-snapshot.md)
**inventory JSON:** [`docs/superpowers/specs/2026-04-15-post-pr-a-residual-inventory.json`](../specs/2026-04-15-post-pr-a-residual-inventory.json)
**pre-PR A 参考 (historical):** [`docs/superpowers/specs/2026-04-14-parity-phase4-residual-inventory.json`](../specs/2026-04-14-parity-phase4-residual-inventory.json) (1873 entries)

合計 **1863 entries** (post-regen)。PR A mechanism 吸収で 1873 → 1863 (artifact 7 + intentional 3 = 10 件 orphan 化)。

| bucket (inventory 分類) | 件数 | byIssueType 内訳 | burn-down 手段 |
|---|---|---|---|
| actionable | 1851 | segment-untranslated 1571 / segment-missing 106 / segment-extra 86 / section-structure-mismatch 55 / segment-token-gap 32 / segment-order-mismatch 1 | Stage B1–B4 / B6 |
| normalizerCandidates | 1 | segment-token-gap 1 (`/v2.0/docs/scheduler#integrating-scheduler-with-slack`) | Stage B5 |
| intentionalDivergenceCandidates | 0 | (PR A Task 4.4 extractor で 3 件吸収済) | 完了 |
| artifactCandidates | 0 | (PR A Task 4.2 artifact registry で 7 件吸収済) | 完了 |
| advisoryResidual | 11 | segment-inconclusive 11 (tokenless-near-tie 6 / heading-count-mismatch 5) | Stage B6 |

### DoD 非含有の audit-signal (参考 / Stage B1–B6 scope 外)

`parity-check-status.summary.auditSignalIssues === 9` は上記 1863 baseline とは別 tier で、Stage B1–B6 では直接 burn-down しない。§10.5 の再評価 gate で扱う:

| audit-signal issueType | count |
|---|---:|
| paragraph-count-mismatch | 6 |
| step-count-mismatch | 2 |
| table-shape-mismatch | 1 |

## 3. PR cadence / worktree hygiene

- 各 Stage は **1 PR 以上** (bulk 内容に応じて複数 PR に分割)
- 新 worktree を per-Stage で切る (例: `claude/parity-burndown-B1-untranslated`, `claude/parity-burndown-B2-missing`)
- PR マージごとに baseline 再生成 (`node scripts/generate_parity_baseline.mjs --regenerate`) → 次 Stage の入力 inventory を更新
- 各 PR で必須:
  - 対象 slug list / 件数 (before / after)
  - LLM 翻訳使用時は prompt / glossary / INVARIANT_TOKENS 記載
  - `npm run test` / `npm run lint` / `npm run build` green
  - `npm run check:parity` で対象 slug の runtime 0 化確認

## 4. Stage B1: segment-untranslated (1571 件)

**優先度:** 最高 (volume 最大、mechanism 層では解消不能)

**手段:** 既存 LLM pipeline (`scripts/pipeline.mjs` / `scripts/apply_llm_translations.mjs` / checkpoint 再開可能) を使用。`docs/TRANSLATION_GUIDE.md` の terminology / NG-OK パターンに従う。glossary は `scripts/lib/glossary.mjs` (存在すれば)、INVARIANT_TOKENS も baseline 側と一致させる。

**分割:**
- slug 単位に集約 → ~100–200 件 (slug 単位) / PR を目安
- 優先 order: 1) `overview/` / `getting-started/` (認知度高) → 2) 頻出 feature (editing-tests / recording-tests / testops) → 3) 残 area

**Verification per PR:**
1. `npm run check:parity -- --slug=<target>` で対象 slug の untranslated = 0
2. `npm run lint:docs` で callout / 表記 / 記法 OK
3. `scripts/pipeline.mjs --dry` で次 checkpoint 想定通り

**Exit (Stage B1):** baseline の `segment-untranslated` 件数 = 0

## 5. Stage B2: segment-missing (106 件)

**手段:** JA 側に翻訳が「欠落」している segment の補完。per-slug に EN 原文と照合して該当 section / paragraph を追記。source-first 契約 (見出し対応 / 段落順 / リスト構造) を保つ。

**分割:** ~20–30 件 / PR。per-slug commit で review 粒度を保つ。

**Exit:** baseline の `segment-missing` 件数 = 0

## 6. Stage B3: segment-extra (86 件)

**手段:** JA 側に EN に存在しない segment が「余分」にある箇所の削除、または EN 側に無い情報を callout として統合する。Phase 3 で扱った JA 独自 callout の扱いに近い。`WRITING_GUIDE.md` の JA-only section 削除規約に沿う。

**分割:** ~20–30 件 / PR。

**Exit:** baseline の `segment-extra` 件数 = 0

## 7. Stage B4: section-structure-mismatch (55 件)

**手段:** 見出し階層 (H2/H3/H4) / section 区切りの EN/JA 不一致を是正。EN の section 構造を source-first 契約通りに複製する。

**分割:** ~15 件 / PR。構造変更は review 負荷が高いため小さめ。

**Exit:** baseline の `section-structure-mismatch` 件数 = 0

## 8. Stage B5: segment-token-gap 残 (32 + 1 件)

**対象:**
- actionable 側 32 件 (mechanism 未吸収の token gap)
- normalizerCandidates 1 件 (`/v2.0/docs/scheduler#integrating-scheduler-with-slack` — Task 4.3 の対称化 regex に未該当)

**手段 (優先順):**
1. Task 4.2 artifact registry に slug-scope 追加 (「EN 固有の link 痕跡で JA 側に対応 link 不要」と判断できる場合)
2. Task 4.3 URL normalizer に narrow rule 追加 (例: `/v2.0/docs/` → `/docs/` の正規化)
3. JA 側 link 追加 / 修正 (JA ドキュメントに対応 page がある場合)
4. EN 側 artifact 化 (Task 4.1 `artifactCandidates` bucket と同等に扱う)

**Exit:** baseline の `segment-token-gap` 件数 = 0 または registry / normalizer で runtime 抑止される水準

## 9. Stage B6: advisoryResidual + order-mismatch (segment-inconclusive 11 + segment-order-mismatch 1)

**対象:**
- segment-inconclusive 11 件 (inconclusiveCategory: tokenless-near-tie 6 / heading-count-mismatch 5)
- segment-order-mismatch 1 件 (順序整合)

**手段 (inconclusive):** 各 entry の `inconclusiveReason` (align score の tie-break 失敗等) を読み、以下のいずれかで解消:

- JA 側 wording 微調整で同点ブレーク (最も多い)
- alignment score 判定の narrow rule 改善 (score 計算に影響、最小限)
- 真に曖昧な case は artifact registry に昇格 (「EN 側の構造的不定性」と宣言)

**手段 (order-mismatch):** EN の段落順に JA 側を並び替え。source-first 契約 (§1) に沿う。

**Exit:** baseline の `segment-inconclusive` ≤ 3 (PR Z entry criteria §10 必須条件) かつ `segment-order-mismatch` = 0

## 10. PR Z Entry Criteria (Rev 7 / 2026-04-15 固定)

PR Z (Phase 4 final cutover, Task 4.5–4.8 / schema v2 atomic cutover) に**着手してよい**のは、以下をすべて満たすとき。**`entries.length` の数値閾値は廃止** — issueType 内訳ベースで判定する。

### 必須条件 (machine-checkable)

**(a) `parity-baseline.json.byIssueType` 集計:**

| issueType | 条件 |
|---|---|
| `segment-untranslated` | = 0 |
| `segment-missing` | = 0 |
| `segment-extra` | = 0 |
| `section-structure-mismatch` | = 0 |
| `segment-token-gap` | = 0 (artifact registry / URL normalizer で抑止されるか、content で解消) |
| `segment-order-mismatch` | = 0 |
| `segment-inconclusive` | ≤ 3 |

**(b) `parity-check-status.summary` カウンタ:**

| field | 条件 |
|---|---|
| `auditSignalIssues` | = 0 (§10.5 再評価 gate で確認。非ゼロなら Stage B7 完了を要求) |
| `advisoryQueueIssues` | ≤ 3 (segment-inconclusive 消化に連動) |

### 運用条件 (human judgement)

- 残 residual は通常 review で捌ける小さい件数に収まっている (目安: baseline entries ≤ 5)
- PR Z の中で `entries === 0` まで持ち切れる現実的見込みがある (`segment-inconclusive` を JA 側 wording / alignment score narrow rule / artifact registry 昇格のいずれかで 0 化できる)
- bulk remediation / mechanism 変更 / schema migration の 3 トラックが独立 rollback 可能な状態で分離されている (PR #270 済 / Stage B 済 / PR Z 未着手)

### PR Z 着手禁止条件

以下のいずれかに該当する場合は PR Z 着手不可:

- 上記 6 issueType の 0 化未達 (`segment-untranslated=1` 等でも禁止 — bulk burn-down を Stage B で完遂してから移る)
- `segment-inconclusive` 4 件以上
- `auditSignalIssues` 非ゼロ (§10.5 gate 未通過)
- mechanism 側 (artifact registry / URL normalizer / extractor) に未修正の gap が残っており、追加 mechanism 変更が必要 — この場合は別 PR で mechanism 層を先に更新する

### 根拠

- 最終 DoD (Phase 4 plan Rev 7 §最終 DoD 参照) は `entries === 0` かつ 4 parity-check-status counter = 0 を要求する。PR Z 着手時点で `inconclusive ≤ 3` / `auditSignalIssues = 0` まで絞り込まれている必要がある (3 件なら PR Z 内で alignment narrow rule 1 本 / artifact registry 3 件追加等で吸収可能)
- `entries.length` 数値閾値は「残件の種類」を見ない粗い gate で、bulk 種別の未消化を許容してしまう。issueType ベースに変えることで「bulk は Stage B で完遂、PR Z は最後の alignment 残を消化」という責任分界を守る。
- PR Z を「final cutover 専用」に保つため、audit-signal 9 件のような Stage B scope 外の DoD 未達項目を PR Z に持ち込まない。Stage B7 (§10.5) で事前に処理する。

## 10.5. auditSignalIssues 再評価 gate (B4 完了時点)

`auditSignalIssues` (paragraph-count-mismatch / step-count-mismatch / table-shape-mismatch) は Stage B1–B6 の直接 scope **外**だが、Rev 7 DoD で `=== 0` を要求される。missing/extra/structure 修正 (B2-B4) の副次効果で減る可能性があるため、**Stage B4 完了直後**に再評価 checkpoint を置く。

### 実施手順

1. Stage B4 完了コミット後に `npm run check:parity` を再実行
2. `jq '.summary.auditSignalIssues' parity-check-status.json` で値を取得
3. 値が **0** → gate 通過、Stage B5 / B6 へ進み、B6 完了後に PR Z entry criteria §10 を評価
4. 値が **非ゼロ** → **Stage B7 (audit-signal 残) を起票**:

### Stage B7: audit-signal 残 (条件付き起票)

**起票条件:** §10.5 の再評価で `auditSignalIssues > 0`

**対象 issueType:**
- `paragraph-count-mismatch` — EN/JA 段落数の不一致 (通常は `segment-missing/extra` 修正で副次解消)
- `step-count-mismatch` — 手順 step 数の不一致
- `table-shape-mismatch` — table 行列数の不一致

**手段:**
1. per-slug で該当 section の EN 構造に JA を揃える (segment 追加 / 削除 / 分割 / 結合)
2. source-first 契約 (§1) 厳守
3. heuristic 判定のエッジケースで誤検知の場合は EN 側 artifact 化を検討 (ただし最終手段)

**分割:** 件数が少ない (~数件〜10 件台想定) ため 1 PR で完遂を目指す

**Exit (Stage B7):** `parity-check-status.summary.auditSignalIssues === 0`。PR Z 着手可。

## 11. Non-goals

- schema migration (PR Z で atomic cutover)
- mechanism 変更 (PR A 済。追加が必要なら別 PR に切り出す)
- runtime code の大幅 refactor (最小限、必要時のみ narrow 修正)
- 翻訳品質の general review (別 audit task)
- Phase 5 (定常運用 check gate 追加等) は PR Z 後に別 plan

## 12. Tracking

- 各 Stage PR description で before / after baseline entries / byIssueType 表を掲載
- 全 Stage PR merge 後、`node scripts/phase4/classify_residual.mjs | node scripts/phase4/render_residual_inventory.mjs` で最終 inventory を出力し、PR Z の入力に流す
