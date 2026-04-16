# M2 Parity Burn-Down — 340 → 0 (pre-PR Z)

**Date:** 2026-04-16
**Status:** Executing (Phase P2-1 pilot)
**Parent plan:** [2026-04-15-parity-bulk-remediation.md](./2026-04-15-parity-bulk-remediation.md) (Rev 1 / Stage B1-B7)
**Cutover plan:** [2026-04-14-parity-phase4-schema-cleanup.md](./2026-04-14-parity-phase4-schema-cleanup.md) (Rev 7 / PR Z final DoD)

## 1. Context

M1 (PR #286-#291) / M4 (PR #292) merge 完了時点で `parity-baseline.json.entries` = **340 entries / 100 files** (plan 策定時 1756 から 80% burn-down 済)。残件を PR Z entry criteria (§10) 満たす水準まで縮小する。

### 最終ゴール (unchanged from Phase 4 Rev 7)

以下 counter をすべて **0** に:

- `parity-baseline.json.entries.length`
- `parity-check-status.summary.{reportableActiveFiles, baselinedIssues, advisoryQueueIssues, auditSignalIssues}`
- `snapshot-diff-status.summary.{changed, added, removed}`

運用原則 (M4 で確立):

- **Source-first**: JA は EN 原文構造に 1:1 追従。JA 独自の段落追加 / callout タイプ変更 / nested 化 / 番号リスト展開は禁止
- **Callout**: EN の `<div class="note">` / `<div class="warning">` / blockquote をそのまま 1:1 mapping
- **Testim UI 用語**: 英語維持 (GLOSSARY Tier A/B)

## 2. Residual inventory (post-M1 / 2026-04-16)

| issueType | 件数 | 主戦略 |
|---|---:|---|
| segment-extra | 120 | JA 独自段落を削除し EN 構造に戻す |
| segment-missing | 76 | EN 段落を翻訳追加 |
| section-structure-mismatch | 66 | 見出し/リスト形式を EN 構造に揃える |
| segment-untranslated | 47 | 翻訳。Testim UI 用語は英語維持 |
| segment-token-gap | 20 | URL/CLI flag/数値 token 復元 |
| segment-inconclusive | 11 | 人手 review (PR Z entry は ≤ 3) |
| **合計** | **340** | |

### Slug 分布 (top-heavy)

| tier | 件数/slug | slug 数 | 合計 entries |
|---|---:|---:|---:|
| A: Heavy | ≥ 5 | ~20 | ~200 |
| B: Medium | 2-4 | ~54 | ~129 |
| C: Long-tail | 1 | 26 | 26 |

Top 5: `advanced-editing/deep-link-mobile` (18) / `recording-tests/.../configure-tricentis-mobile-agent` (16) / `editing-tests/generating-a-random-value` (14) / `salesforce-testing/salesforce-steps/sfdc-document-validation` (12) / `advanced-editing/keyboard-shortcut-step` (10)

## 3. 5-Phase execution

### P2-1: Pilot — single slug (current)

**Target:** `advanced-editing/deep-link-mobile` (18 entries: extra 8 / missing 8 / structure 1 / untranslated 1)

**狙い:**

- `PARITY_GUIDE.md §Burn-down workflow` の実地検証
- Agent 委任 template の finalize
- 結果を PARITY_GUIDE に反映

**Exit:** 対象 slug runtime 0 件 / baseline 再生成で同 slug entry = 0 / test + lint green / PR merge

**Findings (pilot 実測):**

- EN `<p>&gt; &gt; &gt; Content</p>` は `turndown.mjs:normalizeEscapedCallouts` で `<div class="note">` に正規化される → JA 側は同じ位置に `:::note` directive で対応させる (blockquote `> > >` では callout-body として認識されない)
- URL を含む callout-body の `segment-untranslated` 誤検知回避には **Markdown autolink `<https://...>`** を使う (`[label](url)` / `` `url` `` / 裸 URL は `parity_glossary_mask` が `https`/`ios` を glossary 優先で masking し URL 全体の strip が機能しないため residue に英字断片が残る)
- EN の flat `<ol>` に `<img>` / `<p>` / `<div class="note">` が混在する場合、JA は ol を複数に分割し **ol 外部に block sibling を配置**、番号は EN の value 属性に合わせて手動指定する

### P2-2: Tier A bulk — 並列 agent × heavy slugs

**Target:** Tier A 20 slug (~200 entries)

**運用:**

- 1 slug / 1 agent / 1 worktree / 1 PR (§ `PARITY_GUIDE.md §並列エージェント委任チェックリスト`)
- 同時並列 **5 agent 上限** (local disk / GitHub PR queue 圧迫回避)
- 各 PR で baseline 再生成 → 次 agent の input 更新

**Exit:** Tier A 全 slug で entry = 0、baseline total ≤ 140

### P2-3: Tier B batch — area 単位

**Target:** Tier B 54 slug (~129 entries)

**運用:**

- area 別 batch (salesforce / advanced-editing / integrations / testops / administration …)
- 5-10 slug / 1 PR、1 agent が area を担当

**Exit:** Tier B 全 slug で entry = 0、baseline total ≤ 40

### P2-4: Tier C sweep — long-tail

**Target:** Tier C 26 slug × 1 entry (inconclusive 除く)

**運用:**

- 1 agent / 1 PR で全件。issueType 別 mini-batch で commit 分け
- inconclusive 11 件は P2-5 に回す

**Exit:** Tier C actionable 全消化、baseline total ≤ 15 (inconclusive + audit-signal 残)

### P2-5: inconclusive + audit-signal gate

**Target:**

- segment-inconclusive 11 件 (tokenless-near-tie / heading-count-mismatch) → ≤ 3 に burn-down
- auditSignalIssues 9 件 (paragraph-count 6 / step-count 2 / table-shape 1) → = 0

**運用:**

- Stage B6 手段 (per-entry の JA wording 微調整 / alignment narrow rule / artifact 昇格)
- Stage B7 は Stage B4 完了後に再評価 (parent plan §10.5)

**Exit (= M2 完了):**

- byIssueType: untranslated/missing/extra/structure/token-gap/order **= 0**
- segment-inconclusive **≤ 3**
- auditSignalIssues **= 0**
- → PR Z (M3) entry 成立

## 4. PR cadence & branching

- **base branch**: 各 phase で `origin/main` から新 branch を切る (`claude/m2-p2-1-pilot`, `claude/m2-p2-2-*`, …)
- **worktree**: Tier A 並列時は per-slug worktree (`.claude/worktrees/m2-<slug-hash>`)
- **baseline 再生成タイミング**: 各 PR merge 後に main で `node scripts/generate_parity_baseline.mjs --regenerate` → 次 phase の input 更新
- **PR description 必須**: before/after の baseline entries + byIssueType 表、対象 slug list、source-first 遵守宣言

## 5. Non-goals

- schema migration (M3 / PR Z で atomic cutover)
- mechanism 変更 (M1 PR #270 で完了済。追加必要時は別 PR)
- translation quality の general review (別 audit task)
- GLOSSARY 589 duplicate bulk merge (M2 と並行可の独立 PR)

## 6. Tracking

各 phase PR は本 plan に進捗追記 (before/after counter)、M2 完了時に M3 plan (Rev 7) §10 入力として summary commit。
