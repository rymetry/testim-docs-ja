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
- **classifier URL-before-mask 修正 (本 PR で同時適用)**: `parity_glossary_mask.classifySegment` は従来 glossary masking → URL/link strip の順で residue 判定していたが、`https`/`ios` が glossary term として先に consume されるため URL regex が URL 全体にマッチできず、callout-body 内 URL を含む JA 段落が segment-untranslated と誤判定される問題があった。**pilot で pre-strip (inline code / markdown link / GFM autolink / bare URL / `/docs` link) を glossary masking より前に実行する順序に変更** し、positive (URL 4 形式すべてで fully masked) + negative (URL 含み untranslated prose は依然検知) の regression test を追加。以降の phase では通常の markdown link `[url](url)` / bare URL 記法を使えばよい (autolink `<url>` 強制は不要)
- EN の flat `<ol>` に `<img>` / `<p>` / `<div class="note">` が混在する構造は、turndown の walker が非 `<li>` sibling を ol 外の block として走査するため、**JA 側も ol を複数に分割し ol 外部に block sibling を配置、番号は EN の `<li value="N">` 属性に合わせて手動指定する**。これは source-first policy の **mechanical exception** として扱う (kind-multiset fingerprint 基準では単一 ol と複数 ol の差は無視される仕様であり、検知器が「許容」しているため JA 独自構造の導入ではない。§5 "source-first mechanical exceptions" に正式登録)

### P2-2: Tier A bulk — 並列 agent × heavy slugs

**Target:** Tier A 20 slug (~200 entries)

**運用:**

- 1 slug / 1 agent / 1 worktree / 1 PR (§ `PARITY_GUIDE.md §並列エージェント委任チェックリスト`)
- 同時並列 **5 agent 上限** — 下記 3 制約の最小値に合わせて固定 (architect gate A1 文書化):
  - **PR review queue**: 5 並列超で reviewer 4 人 × 4 観点 gate が律速し、1 日 20 件以上の PR が待ち行列化する
  - **local disk**: 1 worktree あたり `node_modules` ≈ 500MB、20 並列で 10GB のディスク圧迫 (開発機の swap が始まる閾値)
  - **CI concurrency**: GitHub Actions free tier の並列 job 上限 20 (self-hosted なしの前提)、lint / build / test / parity / Vercel の 5 jobs × 5 agent = 25 で既に overflow
  - プレッシャー下でも緩和禁止 (plan 改訂提案 → §P2-2 改訂 + reviewer 承認が必要)
- 各 PR で baseline 再生成 → 次 agent の input 更新

**Mandatory pre-P2-2 steps:**

1. `scripts/__tests__/source_parity_clean_page_fixtures.test.mjs` の `CLEAN_PAGE_SLUGS` に、P2-1 で burn-down した pilot slug (`advanced-editing/deep-link-mobile`) を追加済であること (本 PR で実施済 / testing gate Sev 6)。Tier A slug 毎に burn-down 完了後、本 fixture array に追加することで sentinel 化する
2. P2-2 着手時点で `npm run check:snapshots:diff` / `npm run check:untranslated` をフル実行し、pilot slug が 0-drift であり untranslated 65 blocks (2026-04-17 baseline 実測) に pilot slug が含まれないことを宣言

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
- **baseline 再生成**: 各 **phase 完了 PR merge 後** に main で `node scripts/generate_parity_baseline.mjs --regenerate` (full 再生成 / slug-partial は非推奨) を実行し、`rationale` フィールドを固定文言 `"frozen baseline — M2 burn-down phase P2-X post-merge regen"` に統一する。phase 内の中間 PR では `--slug=<csv>` の partial 再生成を許容するが、最終 phase PR では必ず `--regenerate` で書き直す (M3 atomic cutover 時の "凍結日時" トレーサビリティ維持 / architect gate C2)
- **`reviewAfter` field の扱い** (architect gate A2 注記): schema v1 の各 entry に付与されている `reviewAfter: "<YYYY-MM-DD>"` は、M1 で設計された "期限切れ baseline を orphanBaselineEntries として検知する" 仕組みの input。M2 burn-down の文脈では baseline total を漸減させる運用が主であり、**実質的に未使用** (期限切れを待たずに entry を解消するため)。M3 (PR Z schema v2) では本 field は削除予定 (`migrate_baseline_schema.mjs` で strip)。phase PR の `--regenerate` で自動付与される value (6 ヶ月先) は harmless だが意味を持たないことに留意
- **PR description 必須**: before/after の baseline entries + byIssueType 表、対象 slug list、source-first 遵守宣言

## 5. Non-goals

- schema migration (M3 / PR Z で atomic cutover)
- mechanism 変更 (M1 PR #270 で完了済。追加必要時は別 PR)
- translation quality の general review (別 audit task)
- GLOSSARY 589 duplicate bulk merge (M2 と並行可の独立 PR)

### 5.1 Completed follow-ups (pilot 由来で本 plan 内で解決済)

- **classifier URL-before-mask**: P2-1 pilot で identified された `parity_glossary_mask.classifySegment` の masking 順序問題は同 PR (#293) で構造的に修正済 (pre-strip → mask 順に変更、regression test 追加)。Tier A bulk 以降で autolink workaround は不要

### 5.2 Source-first mechanical exceptions (M4 policy 補足)

M4 で確立した "JA 独自構造禁止" policy は **content-level** の独自構造追加を禁止する。以下は **mechanical / parser-level** の例外であり、検知器 (`source_parity_structure`) が kind-multiset fingerprint 上で許容している既知パターン。plan に明示登録することで、後続 agent が JA 独自構造との混同 / loophole 化するのを防ぐ:

1. **flat `<ol>` の複数分割**: EN の単一 `<ol>` に non-`<li>` sibling (`<img>`/`<p>`/`<div class="note">`) が混在する場合、JA は ol を複数に分割して sibling を ol 外に出してよい。`<li value="N">` 属性に対応する番号は手動指定。(P2-1 pilot で初実施、kind-multiset fingerprint で同値)
2. **`:fa-arrow-right:` 段落融合**: EN の矢印 `→` プレフィックス段落は JA で `→**...するには:**` に変換するだけで段落は分離しない (PARITY_GUIDE §頻出パターン 2 で既定義)

exception 追加は **reviewer 承認 + plan への明示登録** を条件とし、個別 PR の自由裁量では追加しない (security L2 gate)

## 6. Tracking

各 phase PR は本 plan に進捗追記 (before/after counter)、M2 完了時に M3 plan (Rev 7) §10 入力として summary commit。
