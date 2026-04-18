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

| issueType                  |    件数 | 主戦略                              |
| -------------------------- | ------: | ----------------------------------- |
| segment-extra              |     120 | JA 独自段落を削除し EN 構造に戻す   |
| segment-missing            |      76 | EN 段落を翻訳追加                   |
| section-structure-mismatch |      66 | 見出し/リスト形式を EN 構造に揃える |
| segment-untranslated       |      47 | 翻訳。Testim UI 用語は英語維持      |
| segment-token-gap          |      20 | URL/CLI flag/数値 token 復元        |
| segment-inconclusive       |      11 | 人手 review (PR Z entry は ≤ 3)     |
| **合計**                   | **340** |                                     |

### Slug 分布 (top-heavy)

| tier         | 件数/slug | slug 数 | 合計 entries |
| ------------ | --------: | ------: | -----------: |
| A: Heavy     |       ≥ 5 |     ~20 |         ~200 |
| B: Medium    |       2-4 |     ~54 |         ~129 |
| C: Long-tail |         1 |      26 |           26 |

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

1. `scripts/__tests__/source_parity_clean_page_fixtures.test.mjs` の `CLEAN_PAGE_SLUGS` に、P2-1 で burn-down した pilot slug (`advanced-editing/deep-link-mobile`) を追加済であること (本 PR で実施済 / testing gate Sev 6)。Tier A slug 毎に burn-down 完了後、本 fixture array に追加することで sentinel 化する。ただし §5.3 mechanism-pending 残存 (per-slug ≤ 2 件) がある slug は **fixture から除外** (`totalIssues = 0` の assertion を満たさないため)
2. P2-2 着手時点で `npm run check:snapshots:diff` / `npm run check:untranslated` をフル実行し、pilot slug が 0-drift であり untranslated 65 blocks (2026-04-17 baseline 実測) に pilot slug が含まれないことを宣言

**Wave 2 briefing for parallel agents (2026-04-17 P2-2-1 pilot 実測):**

Tier A 全 slug で recurring する 2 つの主要 pattern を agent input に明示すること (architect gate P2-2 D3):

1. **JA-only 導入段落 + `**Xするには:**` 段落分割** (repo 全体で 347 occurrences / `grep -rE '^\*\*[^*]+するには:\*\*$' src/content/docs/` で計測): EN は `<p>Context. → <strong>To X:</strong></p>` (1 paragraph) なのに JA は `Context。\n\n**X するには:**` (2 paragraph) に分割。Pilot #1 で単一 slug に 6 件。修正手法:
   - EN に `<br />` がある場合 (pilot #1 Connect section のみ): `。  \n→ **X するには:**` (trailing 2-space + newline で hard break 保持)
   - EN に `<br />` がない場合 (大多数): `。\n→ **X するには:**` (soft-break / 単一改行) — markdown は space に render
   - **確認手順**: EN snapshot `grep -oE '<br /> →|\. →' <file>` で `<br />` 有無を判別
2. **FileOrFilePath inline-code の不整合** (per-slug 1-3 件): EN の `<span class="FileOrFilePath">./path</span>` / `<span class="FileOrFilePath">yes</span>` を JA が backticks で wrap すると `tokensInvariant` が不一致となり segment-token-gap が発火。修正: JA 側も backticks 外す (EN 抽出側も backtick wrap しないため揃う)

Tier A agent は上記 2 pattern を優先 scan し、3 件目以降の未知 pattern が出たら pilot #1 と同様に reviewer gate + plan §5.3 登録を経由すること。

**Tier A 20 slug × `**Xするには:**` 出現数** (2026-04-17 実測 / 残 19 slug — pilot #1 は 0 化済み):

| slug (entries)                                                                             | `**Xするには:**` count |
| ------------------------------------------------------------------------------------------ | ---------------------: |
| editing-tests/generating-a-random-value (14)                                               |                      2 |
| salesforce-testing/salesforce-steps/sfdc-document-validation (12)                          |                      8 |
| advanced-editing/keyboard-shortcut-step (10)                                               |                      0 |
| integrations/test-management-integrations/ttm-for-jira-integration (9)                     |                      1 |
| salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce (9) |                      1 |
| editing-tests/editing-your-tests/editing-target-element-properties (8)                     |                      0 |
| integrations/visual-validation/lambdatest_integration (8)                                  |                      0 |
| integrations/grid-management (7)                                                           |                      1 |
| administration/secrets (6)                                                                 |                      1 |
| advanced-editing/parameters/passing-parameters-from-excel-file (6)                         |                      0 |
| advanced-editing/validations/validate-download (6)                                         |                      1 |
| advanced-editing/validations/validate-element-text (6)                                     |                      4 |
| integrations/grid-management/saucelabs-browserstack-options (6)                            |                      0 |
| integrations/integrate-testim-to-your-ci/vsts-and-tfs-integration (6)                      |                      0 |
| administration/subscription-plans (5)                                                      |                      1 |
| advanced-editing/coding-assistant (5)                                                      |                      0 |
| integrations/test-management-integrations/xray-integration (5)                             |                      1 |
| overview/testim-overview (5)                                                               |                      0 |
| testops/insights/reports (5)                                                               |                      3 |

Tier A 合計 24 occurrences (pilot #1 の 6 occurrences 除く)。pattern 1 高密度 slug (`sfdc-document-validation` 8 / `validate-element-text` 4 / `testops/insights/reports` 3) は baseline entry の大半が同 pattern 由来の可能性が高く、expected effort は中程度。pattern 0 slug (8 slug: `keyboard-shortcut-step` 10 entries / `editing-target-element-properties` 8 entries / `lambdatest_integration` 8 entries 等) は異なる構造起因の drift を主因とするため、pilot #1 の recipe が即適用できず agent 側で別 pattern 識別が必要。

**Exit:** Tier A 全 slug で entry = 0、baseline total ≤ 140

### P2-3: Tier B batch — area 単位

**Target:** Tier B 54 slug (~129 entries)

**運用:**

- area 別 batch (salesforce / advanced-editing / integrations / testops / administration …)
- 5-10 slug / 1 PR、1 agent が area を担当

**Exit:** Tier B 全 slug で entry = 0、baseline total ≤ 40

**Progress log:**

- 2026-04-18: Tier B Wave 3 完結 (PR #337):
  - Bundle 3 (Running Tests): predefined-properties 1 slug を UD-003 broken-row-mirror で burn-down (3→0)、残 3 slug (scheduler / scheduler-mobile / the-command-line-cli) は WRITING_GUIDE §91-109/§192 + TRANSLATION_GUIDE §28 準拠で principled revert → UD-003 + UD-004A/B/C deferral (upstream-defect-tracker.md 登録済)
  - Bundle 4 (mobile-test-editor): 3→0 eliminated (EN MadCap broken callout の JA mirror 採用、UD candidate 候補)
  - Net baseline: 97 → 93 (-4)

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

### P2-6: 退避 registry 最終検証 (final phase evacuation audit)

**System 原則** (2026-04-17 user 確認): 許容機構 (registry / exclusion) は **「壊れている EN snapshot の退避」の ONE purpose ONLY**。それ以外の「許容」は classifier 検知精度を dilute する設計違反。

M2 exit 直前の本 phase で、既存 **全退避 entry を再検証**する。各 entry について以下 3 点を確認し、「解決できないか？」を審査する:

1. **broken EN の実在確認**: EN upstream (docs.tricentis.com/testim) で当該 symptom が依然発生しているか? 既に upstream が修正した場合 → registry から entry 削除、通常 parity check に復帰
2. **代替解決手段の有無**: parser / extractor 側の mechanism 改善 (§5.3.N 相当) で EN broken pattern を吸収できないか? 可能なら mechanism PR 優先で registry entry を段階的に削除
3. **退避の必要性**: 退避無しだと detection が本当に動かないのか? false-negative 容認ではなく genuine 不可能ケースか?

**対象 registry**:

| registry                                                                   | 現行 entry 数 | 対象 slug                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------- | ------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/lib/source_sync_exclusions.mjs` (`SOURCE_SYNC_EXCLUSIONS`)        |             1 | `testops/testops-version-control/pull-requests`                                                                                                                                                                                                                                                                                                                                                       |
| `scripts/lib/parity_artifact_registry.mjs` — `/docs/index` self-link       |             7 | `editing-tests/conditions/advanced-conditions-settings`, `integrations/visual-validation/visual_validation_index`, `recording-tests/recording-a-mobile-test/recording-a-local-mobile-test`, `salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce`, `salesforce-testing/salesforce-steps/sfdc-step-login`, `testops/insights/dashboard`, `testops/insights/reports` |
| `scripts/lib/parity_artifact_registry.mjs` — `http://google.com` demo link |             1 | `getting-started/creating-your-first-codeless-test`                                                                                                                                                                                                                                                                                                                                                   |
| `scripts/lib/ja_omission_policy_registry.mjs` (§5.3.3)                     |   4 (quota=5) | `overview/testim-overview`                                                                                                                                                                                                                                                                                                                                                                            |

**運用 (P2-6)**:

- 各 entry × 3 審査項目 = 全 13 entry × 3 項目 = 39 チェック
- 1 agent が audit、reviewer (architect) が approve/reject per-entry
- 解決可能な entry → 対応する mechanism PR or content PR を起票 → registry から段階削除
- 真に解決不能な entry → plan に「永続退避根拠」を明記 (upstream 本体修正待ちの broken-EN など)
- `ja_omission_policy_registry` は broken EN ではなく Tricentis legal policy (pricing/changelog/testim.io 除外) のため、**別枠の policy-driven registry** として継続するか、legal 確認して段階的に解除するか、user と協議

**Route W — EN source patches layer (2026-04-17 追加)**:

broken upstream EN defect を segment-level で検出した場合、従来の **allowlist / registry / page-level exclusion** 3 路線だけでは対応しきれないケース (例: 単純 typo、href miswire) が発生する。これらは JA 側に workaround を置く選択肢 (HTML コメント等) が **`§5.3 Scope preamble` によって禁止** されているため、新たに **HTML-boundary patch 層** を導入した:

- 設計計画: [`docs/superpowers/plans/2026-04-17-en-source-patches-layer.md`](./2026-04-17-en-source-patches-layer.md) (v4, Codex APPROVED 4 rounds)
- 実装: `scripts/lib/en_source_patches.mjs` (literal `find → replace` at `preprocessEnHtml` 境界、slug-scope、defectClass 4-enum 限定)
- Upstream tracker: `docs/superpowers/specs/upstream-defect-tracker.md` (UD-001 / UD-002 初期登録)
- 初期 delta: baseline 131 → 114 (-17)、新規追加 0、patchCoverage matchedHits=6 / mismatches=0

Route W は既存 3 mechanism と排他ではなく **補完**的に動作する (§5.3.2 / §5.3.3 registry と独立)。「どの層で対処するか」の判断基準は:

1. **page-level 全体が broken** → `SOURCE_SYNC_EXCLUSIONS` (source_sync_exclusions.mjs)
2. **slug-scope token-level invariant** (EN 固有 artifact として token 単位で抑止) → `parity_artifact_registry`
3. **slug-scope segment-level 具体 defect** (typo / href miswire 等、HTML 修正で fix できる) → **`en_source_patches`**
4. **JA-side intentional omission** (Tricentis legal removal) → `ja_omission_policy_registry` (§5.3.3、abolition PR で将来撤廃)

本 Route W の追加により、plan §5.3 の「ONE purpose = broken-EN 退避」原則は維持したまま、broken-EN への対応 precision が slug × token から **slug × segment × literal pattern** へ格上げされる。

**Exit (P2-6 = 真の M2 完了)**:

- 各 registry の entry について「upstream broken 確認済 ∧ mechanism 解決不能」が全 entry で成立
- 解決可能な entry は全て PR 化済 (P2-5 / P2-6 並行で段階的 burn-down)
- plan に各 entry の「退避根拠」sub-section が存在
- → 本 P2-6 完了を以て PR Z (M3) entry の **pre-condition** とする

## 4. PR cadence & branching

- **base branch**: 各 phase で `origin/main` から新 branch を切る (`claude/m2-p2-1-pilot`, `claude/m2-p2-2-*`, …)
- **worktree**: Tier A 並列時は per-slug worktree (`.claude/worktrees/m2-<slug-hash>`)
- **baseline 再生成**: 各 **phase 完了 PR merge 後** に main で `node scripts/generate_parity_baseline.mjs --regenerate` (full 再生成 / slug-partial は非推奨) を実行し、`rationale` フィールドを固定文言 `"frozen baseline — M2 burn-down phase P2-X post-merge regen"` に統一する。phase 内の中間 PR では `--slug=<csv>` の partial 再生成を許容するが、最終 phase PR では必ず `--regenerate` で書き直す (M3 atomic cutover 時の "凍結日時" トレーサビリティ維持 / architect gate C2)
  - **中間 PR partial regen rationale (canonical format)** (architect gate P2-2 D1, 2026-04-17): `generate_parity_baseline.mjs --slug=<csv>` が自動生成する `"frozen baseline — partial regeneration for <slug>"` はそのまま使用してよい (script 出力準拠 / 人手編集不要)。複数 slug を一括 regen する場合は script が slug csv を連結するため、trail 情報は `generatedFromRunId` + commit SHA から追跡する。phase 最終 PR で full `--regenerate` に書き直すので中間 rationale は使い捨て前提
- **`reviewAfter` field の扱い** (architect gate A2 注記): schema v1 の各 entry に付与されている `reviewAfter: "<YYYY-MM-DD>"` は、M1 で設計された "期限切れ baseline を orphanBaselineEntries として検知する" 仕組みの input。M2 burn-down の文脈では baseline total を漸減させる運用が主であり、**実質的に未使用** (期限切れを待たずに entry を解消するため)。M3 (PR Z schema v2) では本 field は削除予定 (`migrate_baseline_schema.mjs` で strip)。phase PR の `--regenerate` で自動付与される value (6 ヶ月先) は harmless だが意味を持たないことに留意
- **PR description 必須**: before/after の baseline entries + byIssueType 表、対象 slug list、source-first 遵守宣言

## 5. Non-goals

- schema migration (M3 / PR Z で atomic cutover)
- mechanism 変更 (M1 PR #270 で完了済。追加必要時は別 PR)
- translation quality の general review (別 audit task)
- GLOSSARY 589 duplicate bulk merge (M2 と並行可の独立 PR)

### 5.1 Completed follow-ups (pilot 由来で本 plan 内で解決済)

- **classifier URL-before-mask**: P2-1 pilot で identified された `parity_glossary_mask.classifySegment` の masking 順序問題は同 PR (#293) で構造的に修正済 (pre-strip → mask 順に変更、regression test 追加)。Tier A bulk 以降で autolink workaround は不要

### 5.3 Mechanism-pending carve-outs (Tier A 全 slug で entry = 0 の例外)

§P2-2 Exit の `Tier A 全 slug で entry = 0` は **content-level で解消可能な entry** に適用する。以下の mechanism-pending カテゴリは content 修正で 0 に到達不能なため、per-slug ≤ 2 件の残存を許容し、M3 PR Z 前の別 mechanism PR で一括解消する (architect gate P2-2 D2, 2026-04-17):

**Scope (architect gate P2-2 round 2)**: 本 carve-out は下記 §5.3.1 に列挙する **具体的 mechanism pattern のみ** に適用する。Wave 2 以降の agent が未知の残存 entry を一般的な "mechanism-pending" として自主宣言するのは禁止。新規 mechanism-level 課題を発見した場合は §5.2 と同じ security L2 gate (reviewer 承認 + §5.3.N 追加登録) を経由すること。§P2-2 Exit は実質的に **"Tier A 全 slug で content-level entry = 0 ∧ §5.3 登録済 mechanism-pending ≤ 2"** として読み替える。

#### 5.3.1 FileOrFilePath paragraph vs code-fence kind-mismatch

P2-2-1 pilot `configure-tricentis-mobile-agent` で初検知。EN の `<p><span class="FileOrFilePath">...Java stack trace...</span></p>` は `source_parity_segments_en.mjs` の INLINE_JOIN_TAGS 透過経路で paragraph kind に extract される。JA は code-fence (`text / ` ) で `code-block` kind になる。paragraph 一致には backtick inline が不可欠だが textNorm が backticks を strip するため classifier で segment-untranslated が再発火。構造的修正は EN 抽出側で FileOrFilePath を inline-code として wrap する mechanism change が必要 (= M2 範囲外)

- **symptom pattern**: WDA section / CLI prerequisites / error log example ページ
- **per-slug cap**: ≤ 2 件 (`section-structure-mismatch` + `segment-missing` / `segment-extra` の対)
- **mitigation**: 該当 slug の baseline entry には commit message に `mechanism-pending: FileOrFilePath` ラベルを記載

##### 5.3.1.a paragraph-count-mismatch audit signal coverage (2026-04-17 scope extension)

PR #312 `audit-signals-triage` が `configure-tricentis-mobile-agent.md` §19 "WebDriverAgent (WDA) Errors" で `paragraph-count-mismatch` (EN=5 / JA=4) を追加検知。これは §5.3.1 既存 "FileOrFilePath paragraph vs code-fence kind-mismatch" の**同根**の副作用であり、新規 mechanism pattern ではない:

- EN `<p><span class="FileOrFilePath">...Java stack trace...</span></p>` は paragraph kind で `extractParagraphCounts` に 1 件として乗る
- JA は code-fence (`text / `) で `code-block` kind に正規化されるため `extractParagraphCounts` でカウントされない
- 結果: 同 section で segment-level の `section-structure-mismatch` / `segment-missing` (既存 §5.3.1 scope) と audit-signal の `paragraph-count-mismatch` が**同一 root cause から併発**する

**Affected issue types** (scope extension):

- `section-structure-mismatch` (既存 / baseline 対象 / gate-blocking)
- `segment-missing` (既存 / baseline 対象 / gate-blocking)
- `segment-extra` (既存 / baseline 対象 / gate-blocking)
- `paragraph-count-mismatch` (**本 scope 拡張で追加 / `COARSE_SIGNAL_TYPES` 所属 / audit-only / gate-non-blocking**)

**分類 rationale**: `paragraph-count-mismatch` は `scripts/lib/source_parity_types.mjs` §`COARSE_SIGNAL_TYPES` allowlist で既に gate 除外 (audit-only) され、`summary.auditSignalIssues` counter にのみ集計される。baseline への追加対象ではなく content 修正でも解消不能 (EN 側 extract mechanism 未改修の限り再発火)。本 scope 拡張は **classification-only** (plan 文書レベルでの既知 FileOrFilePath artifact への分類昇格) であり code / registry / baseline / test のいずれも変更不要。

**対象 slug/entry (2026-04-17 実測)**:

- slug: `recording-tests/recording-a-mobile-test/configure-tricentis-mobile-agent`
- section: §19 "WebDriverAgent (WDA) Errors"
- signal: `paragraph-count-mismatch`, EN=5 / JA=4 (-1)
- 1 entry / 1 slug (per-slug cap は本 audit signal について ≤ 1 件、総合 §5.3.1 cap は ≤ 3 件に引き上げ — 既存 ≤ 2 gate-blocking + ≤ 1 audit-only)

**M3 PR Z entry condition への影響**: `2026-04-16-m2-parity-burndown.md` §1 最終ゴールの `auditSignalIssues = 0` は**本 entry を §5.3.1 carve-out 由来として別枠で tracking** する (§P2-5 Exit の `auditSignalIssues = 0` 判定から除外)。M3 cutover 前に EN 抽出側 FileOrFilePath mechanism fix が入れば同時に解消される見込み。

**Mitigation**: 該当 slug の baseline entry には commit message に `mechanism-pending: FileOrFilePath (audit-signal scope)` ラベルを追記。baseline 追加はしない (audit-only counter の定義上 baseline-ineligible)。

**Non-goals of this scope extension**:

- 新規 registry 追加なし (§5.3.2 と違い runtime 側の登録は存在しない)
- `COARSE_SIGNAL_TYPES` の変更なし
- `extractParagraphCounts` の code-fence 扱いの変更なし
- 他 slug への scope 拡張なし (他 slug で同 pattern が再発した場合は本 §5.3.1.a entry の slug リストへの追記で L2 gate 再通過)

#### 5.3.2 EN `index.htm/#/` self-link artifact (slug-scope registry extension)

P2-2 Wave 2 `use-agentic-test-automation-for-salesforce` で初検知。EN MadCap Flare が出力する self-link `<a href="index.htm/#/">` / `<a href="index.htm">` は `normalizeUrlToken` (`scripts/lib/source_parity_extract.mjs`) が `/docs/index` token に変換する。この token は **既存 `ARTIFACT_REGISTRY` entry (`reason: en-side-self-index-link-artifact`)** として 5 slug で登録済み。`salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce` は 6 番目の slug として同 entry の `slugs[]` に追加する slug-scope extension。新規 mechanism pattern ではなく、既存 mechanism の scope 拡張。

- **symptom pattern**: EN ページ内 self-link `<a href="index.htm[/#/]">` が含まれる salesforce / integration / conditions / mobile recording / testops ページ
- **per-slug cap**: ≤ 2 件 (`segment-token-gap` with `missingTokens: ["/docs/index"]`)
- **mitigation**: 該当 slug の baseline entry には commit message に `mechanism-pending: docs-index-self-link-artifact` ラベルを記載
- **follow-up mechanism PR**: `scripts/lib/parity_artifact_registry.mjs` `/docs/index` entry の `slugs[]` に新 slug を追加 (2026-04-17 PR #304 で処理)、同時に `scripts/__tests__/parity_artifact_registry.test.mjs` の hardcoded 件数 (5 slugs → 6 slugs) を更新。**registry + test の 2 files 更新**が必要 (架空の "1-line diff" ではない)。
  - 2026-04-17: +1 slug (`testops/insights/reports`) via mechanism PR (6 → 7 slugs, PR #314 content-side の前置き)
- **scope lock**: 本 §5.3.2 entry は **`/docs/index` token の既存 artifact entry 再利用のみ** 対象。別 token (`http://google.com`、`http://example.com` 等) に対する新規 registry 登録は独立 §5.3.N として別途 security L2 gate を経由する。

#### 5.3.3 JA-side intentional-omission policy (Tricentis removal-request registry)

`[PENDING REVIEWER APPROVAL — §5.3.3 L2 gate]`

M2 Wave 3 Batch 2 `overview/testim-overview` (PR #309) で初検知。`docs/WRITING_GUIDE.md §「原文から意図的に除外するコンテンツ」` で規定された **Tricentis 削除依頼 policy** により、EN 原文の特定 segment (pricing callout / changelog callout / `http://testim.io` intro URL) を JA 側で意図的に削除している。再追加は policy 違反 (commits `bf40dad`, `e5d9f88` で legal reasoning 記録済)。

この JA-side 意図的除外は既存 3 mechanism のどれにも該当しない:

- `scripts/lib/source_sync_exclusions.mjs` は EN-broken page を対象 (本 slug の EN は正常)
- `scripts/lib/parity_artifact_registry.mjs` は EN-side artifact token のみ対象 (§5.3.2 の `/docs/index` self-link 等)
- §5.3.1 FileOrFilePath は EN 抽出側 kind-mismatch を対象

新 mechanism `scripts/lib/ja_omission_policy_registry.mjs` を追加し、alignSegments の post-filter で quota-based suppression を適用する。

- **symptom pattern**: Tricentis 削除依頼対象の segment 群。具体的には (a) pricing callout、(b) changelog callout の派生 offset、(c) `http://testim.io` / `https://www.testim.io/pricing/` の intro URL 削除
- **per-slug cap**: ≤ 4 件 (`segment-missing`/`segment-extra`/`segment-token-gap`/`section-structure-mismatch` の 4 drift type を合計。`testim-overview` は現状 4 entries に集約)
- **disambiguator**: **quota-based** を採用。1 registry entry は `{slugs[], issueTypes[], segmentKinds, missingToken?, quota}` を持ち、alignSegments の post-filter で `(slug, issueType, segmentKind, missingTokens)` に match する diff を quota 範囲で 1 件ずつ drop する。fingerprint-based は EN 文面更新で sha-256 が変化しやすく、WRITING_GUIDE 除外が「EN 文面がどう変わっても JA は出さない」意思表示と相性が悪いため不採用。content-prefix は brittle で却下
- **mitigation**: 新 registry module + runtime integration (`scripts/lib/source_parity_align.mjs` 末尾の `suppressJaOmissionDiffs`) + coverage aggregator (`createOmissionCoverage` / `NOOP_OMISSION_COVERAGE`) + full test coverage (`scripts/__tests__/ja_omission_policy_registry.test.mjs` 20 tests)
- **registry scope lock**: 本 §5.3.3 entry は `docs/WRITING_GUIDE.md §「原文から意図的に除外するコンテンツ」` 対象 slug のみ。「翻訳省略したい」という agent 側要望で別 slug を追加するのは禁止。WRITING_GUIDE 除外表の更新が先行条件
- **runtime integration**: `alignSegments({slug, omissionCoverage})` が diffs 生成後に `suppressJaOmissionDiffs` を呼ぶ。coverage snapshot (`snapshot().quotaUsage` / `exhaustedEntries`) は `parity-check-status.json` の `debug.omissionCoverage` に含まれ、後続 monitoring で quota 尽きに気付けるようにする
- **initial inventory (2026-04-17)**: `overview/testim-overview` に 4 entries を登録。合計 quota = 5 で `parity-baseline.json` の該当 5 件を全て抑止する
- **follow-up**: 本 PR merge 後、PR #309 側で baseline 再生成 (5 → 0) を実施

#### 5.3.4 `extractMarkdownTables` GFM strict-check (backslash-pipe paragraph false-positive)

PR #312 audit-signals-triage で initially 検知、本 mechanism PR で解消。`scripts/lib/source_parity_extract.mjs` の `extractMarkdownTables` は従来、`^\|(.+)\|$` / `^\|[\s:|-]+\|$` の緩い regex + naïve `.split('|')` によって以下の 2 種 false-positive を誘発していた:

1. **Separator-less pipe block**: GFM §tables-extension は pipe table に separator 行 (`| --- |` / `| :---: |`) を必須とするが、現行実装はこの要件を満たさない連続した `| cell |` 行列も table として認識していた。turndown が EN HTML の `<p>|...|</p>` orphan broken-table-row を「separator-less pipe row」として吐くため、EN 側 table count が実態より過剰にカウントされ `table-shape-mismatch` (signal) が誤発火していた (EN=2 / JA=1 等)。
2. **Escaped-pipe cell split**: cell split が `.split('|')` で行われていたため、WRITING_GUIDE §5 「broken-table-row paragraph mirror」で採用する `\|` (backslash-escape) が cell 区切りとして解釈され、`| A \| B | C |` のような正当な GFM row でも 3 cell (`["A \\", "B", "C"]`) に誤分解される。salesforce Wave 2 sentinel `use-agentic-test-automation-for-salesforce` で定義された backslash-pipe paragraph pattern は、JA 側では既に `\|` 行頭で paragraph に落ちるため直接の false-positive は避けられていたが、EN turndown 側の broken-table-row 誤認知と組み合わさって per-slug 1 件ずつの `table-shape-mismatch` を誘発していた (4 slug × 1 件 = 4 signal)。

**修正方針 (Option A: regex strict-check)**:

- 行頭が `\|` で始まる行は candidate から除外 (`isGfmTableCandidateLine` で `trimmed.startsWith('|')` を要求、かつ末尾が unescaped `|` であることを `(?<!\\)\|\s*$` で要求)。
- cell split は `UNESCAPED_PIPE_SPLIT_RE = /(?<!\\)\|/` で負 lookbehind により unescaped pipe のみを区切りとし、cell 内の `\|` は literal `|` に復元する (`cell.replace(/\\\|/g, '|')`)。
- separator 行 (`GFM_TABLE_SEPARATOR_RE = /^\|(?:\s*:?-{1,}:?\s*\|)+$/`) を明示的に要求し、separator に到達しない pending row 列は全て破棄 (pipe-row-only の segment は GFM 上 table ではなく段落として扱う)。

**scope lock (§5.3.4)**: 本修正は `extractMarkdownTables` のみを対象とし、`extractHtmlTables` / `extractTableStructure` / `classifyLine` / `compareTableStructure` には手を入れない。`classifyLine` は `/^\|/` (trimmed) で `markdown-table` kind を返すが、これは structure fingerprint 用途で既に backslash-pipe paragraph を `paragraph-start` に分類する挙動を持つため変更不要。

**regression ガード**:

- `scripts/__tests__/source_parity.test.mjs` の `extractMarkdownTables` describe block に 5 テストを追加 (backslash paragraph rejection / separator 要求 / escaped-pipe cell preservation / 混在 pattern / trailing escaped-pipe rejection)。
- salesforce sentinel `use-agentic-test-automation-for-salesforce` は `source_parity_clean_page_fixtures.test.mjs` の canonical regression gate として既存 (本 PR でも totalIssues=0 を維持)。

**parity diff (BEFORE / AFTER)**:

| metric                              | BEFORE | AFTER | delta |
| ----------------------------------- | ------ | ----- | ----- |
| `totalIssues`                       | 223    | 219   | -4    |
| `baselinedIssues` (frozen)          | 183    | 183   | ±0    |
| `issuesByType.table-shape-mismatch` | 4      | 0     | -4    |
| `signalFiles`                       | 7      | 6     | -1    |
| `activeFiles`                       | 26     | 25    | -1    |

baseline は完全不変 (183 固定)、active/signal 側で false-positive 4 件が消滅、他の issue type は全て同値。

exception 追加は §5.2 と同じ security L2 gate (reviewer 承認 + plan への明示登録) を要求する。

#### 5.3.5 `normalizeEnArtifacts` EN/JA symmetric `\d+\.(\S)` normalization

§5.4 item 1 (2026-04-17 PR #312 agent 77 reviewer discovery) を §5.3.N mechanism として昇格 (PR #322)。`scripts/lib/source_parity_extract.mjs` の `normalizeEnArtifacts` は `\d+\.(\S)` (番号+ピリオド+非空白 non-digit) パターンに対してスペースを挿入する正規化を行うが、`compareSnapshotStructure` 内で **EN 側のみ** 呼ばれており、JA 側は未正規化の素で比較されていた。結果、EN=「1.foo」→「1. foo」(ordered-list + 後続段落に分割)、JA=「1.foo」(単一行) という非対称な paragraph 分割が発生し、turndown 出力 / 直書き markdown で両言語に同形パターンが存在する場合に `paragraph-count-mismatch` / `step-count-mismatch` の audit noise が誤発火していた。

**修正方針 (Option A: 対称適用)**:

- `scripts/lib/source_parity_extract.mjs` に `normalizeNumericPeriodSpacing(body)` helper を新設。`^\d+\.\D` かつ `^\d+\.\d+\.` でない行に対して `^(\d+)\.(\S)` → `$1. $2` の単一 pass を適用する最小実装 (wrapping fence unwrap / zero-width space strip / trailing backslash strip などの EN-only artifact は含まない)。
- `normalizeEnArtifacts` は従来通り全 EN artifact pass を保持し、`compareSnapshotStructure` から呼び出される既存 EN 側正規化は挙動不変。
- `compareSnapshotStructure` 内で JA 側に対しても `normalizeNumericPeriodSpacing(jaBody)` を適用し、`extractStepCounts` / `extractBulletCounts` / `extractParagraphCounts` / `extractHeadingSequence` / `countSectionHeadings` の全 count 比較で対称化する。
- decimal (`1.0`) / IP (`1.2.3.4`) / sub-step (`1.1.`) は既存 guard (`^\d+\.\D` と `^\d+\.\d+\.` 除外) で引き続き対象外。

**scope lock (§5.3.5)**: 本修正は `\d+\.(\S)` asymmetry のみを対象とし、`normalizeEnArtifacts` 内の他の normalize pass (wrapping fence / zero-width space / trailing backslash) や `COARSE_SIGNAL_TYPES` allowlist には手を入れない。EN side で既に実施されている zero-width space 行削除 / wrapping fence unwrap 等は turndown 出力の EN 固有 artifact であり、JA 側に同じ処理を適用すると content regression のリスクがある。

**regression ガード**:

- `scripts/__tests__/source_parity.test.mjs` の `normalizeNumericPeriodSpacing` describe block に 8 unit tests (positive glue / already-spaced no-op / decimal negative / IP negative / sub-step guard / trailing newline preservation / non-string input / EN-JA symmetry) と `compareSnapshotStructure §5.3.5 numeric-period symmetry` describe block に 3 integration tests (両側 glued で audit signal clear / genuine drift は引き続き検出 / already-spaced no-op) を追加。
- surface-API barrel re-export assertion (`source_parity.mjs` re-exports all expected functions) に `normalizeNumericPeriodSpacing` を追加し、将来の refactor で export が外れた場合に fail-fast する。

**期待効果**: `paragraph-count-mismatch` / `step-count-mismatch` が purely normalization 非対称起因で発火していた audit signal の除去。PR #322 testing reviewer の実測で audit signals **36 → 34 (-2)** 削減 (mysql-validation.md step-count / paragraph-count 解消) を confirm。baseline / gate-blocking path は完全不変 (§5.3.N scope lock 遵守)。

#### 5.3.6 classifier preStrip backtick GFM double-pair fix (§5.4 item 2 からの昇格)

PR #309 agent 73 reviewer 検出の classifier latent bug。本 §5.3.6 は §5.4 item 2 の 2 件のうち、**preStrip backtick no-op** のみを scope-locked 解消した mechanism PR。2 件目の `CJK_RE` missing `g` flag については本 PR の調査で **scope-lock を超える副作用を確認した** ため、本 mechanism PR から除外した (詳細は §5.4 item 2 参照)。

**bug 実体**: `classifySegment` の pre-strip pass にある inline-code strip regex `/`[^`]_`/g` は GFM double-backtick code-span (` ``code`` `) に対して先頭の空 single-pair (` `` `) にマッチを譲るため、2 個目以降の content が strip されずに残り、backtick strip が実質 no-op になる edge case があった。GFM §code-spans では double-backtick pair は内部に single backtick を含めるため (例: ``` ``use `backtick` here`` ```)、純粋な alternation `/`` [^`]_``|`[^`]\*`/g` だけでは不十分で、内部の single backtick を許容する negative-lookahead (`` `(?!`) ``) が必須。

**修正方針**: preStrip regex を `/` ` ` `(?:[^`]|`(?!`))_` `` `` `|` `` ` `` `[^`]_` `` ` `` `/g` に拡張。

- double-backtick pair を alternation の左側に置き **先に消費** する
- double-pair 内部では `[^`]` (非 backtick) または `` ` ``(?!`) (次が backtick でない single backtick) を受容
- alternation の右側 (single-pair) は旧来どおり `/` `` ` `` `[^`]\*` `` ` `` `/` で fallback

標準 single-backtick code-span (`` `foo` ``) は post-fix も byte-identical に strip される。adjacent double-backtick pair / nested single-inside-double のいずれも全 content が strip される。

**scope lock (§5.3.6)**: 本修正は `classifySegment` 内の inline-code pre-strip regex 1 行のみを対象とし、

- `maskSegmentText` (glossary + invariant masking 本体) には手を入れない
- URL strip pass (bare URL / GFM autolink / markdown link / `/docs` link) の順序・regex は PR #293 の URL-before-mask ordering 契約どおり完全保全
- `RESIDUE_MIN_WORDS=3` / `RESIDUE_MIN_LENGTH=15` の threshold 定数は変更なし

**regression ガード**:

- `scripts/__tests__/parity_glossary_mask.test.mjs` に `classifySegment — §5.3.6 preStrip backtick fix (GFM double-backtick)` describe block を追加し 6 test (single-pair effectiveness / GFM double-pair effectiveness / adjacent double-pair interaction / PR #293 bare URL 保全 / GFM autolink 保全 / 未翻訳 EN prose 検知保全) を pin。
- 既存 `classifySegment — URL/link stripping order (M2-P2-1 pilot regression)` describe block (11 test) は全て byte-identical に pass、PR #293 ordering 契約の完全保全を confirm。

**parity diff (BEFORE / AFTER)**:

| metric                              | BEFORE | AFTER | delta |
| ----------------------------------- | ------ | ----- | ----- |
| `totalIssues`                       | 229    | 229   | ±0    |
| `baselinedIssues` (frozen)          | 173    | 173   | ±0    |
| `issuesByType.segment-untranslated` | 18     | 18    | ±0    |
| `activeFiles`                       | 39     | 39    | ±0    |

repo 内に GFM double-backtick content (` ``...`` `) が実在しないため本修正の production impact は **0 件** (latent bug fix)。

#### 5.3.7 CJK_RE global flag fix (classifier multi-match bug) — cascade は content-level JA 翻訳で吸収

§5.4 item 2 Bug 2 (`CJK_RE.replace(...)` missing `g` flag) の mechanism 完了 PR。§5.3.6 では scope lock のため除外していたが、本 §5.3.7 で **CJK_RE g-flag fix のみ** を mechanism-level で施し、それによって surface する 38 件の cascade は全て **content-level JA 翻訳** で吸収する。

**bug 実体 (Bug 2)**: `classifySegment` 内の `residue.replace(CJK_RE, ' ')` は CJK_RE が `g` flag なしで宣言されていたため、**最初の 1 match のみ** を置換していた。複数 CJK 文字を含む長文 paragraph では JA 文字が englishPortion に混入し、`/\s+/.split()` で単一ノイズ word に collapse して RESIDUE_MIN_WORDS=3 threshold を silent に bypass していた (false negative)。

**g-flag 単独 fix の副作用**: 上記 bug の修正 (CJK_RE に `g` flag 追加) は、JA segments で CJK 句読点 (`、` / `。`) 区切りの enum / 技術トークン列挙が可視化され、**38 件の segment-untranslated issues を 22 slug に surface** する (うち 22 件は既存 baseline entry と fingerprint 一致、16 件が active、5 件が新 Category A 候補だが今回全て content-level で解消)。主なパターン:

- HTTP request type enum (`xhr、js、css、img、media、font、doc、ws、manifest`)
- accessibility severity enum (`critical、serious、moderate、minor`)
- visual match level enum (`exact、strict、content、layout`)
- log level enum (`verbose、error、warning、info`)
- file format token enum (`csv、jpg、ppt、pdf、xls、image、doc`)
- release channel enum (`beta、dev、canary、stable`)
- salesforce edition enum (`enterprise、performance、unlimited、developer、professional、essentials`)
- HTML attribute name (`src、alt、href、title、disabled`)
- status symbol (`— x — x — v`)
- 例値 / ブランド名 / UI nav (`user47 user65 user32` / `youtube twitter linkedin facebook` / `personas add persona` / `sanity nightly monitor`)

**設計思想 (critical)**: 検知システムの design principle に照らし、**許容機構 (allowlist / registry / exclusion) は壊れた EN snapshot の退避のみ**が正当化される用途であり、「技術用語は英語維持でよい」という類の allowance は本 PR では一切追加しない。Testim UI 用語 / 技術トークンの英語維持は **content-level policy** (docs/WRITING_GUIDE.md, docs/TRANSLATION_GUIDE.md) の領域であり、JA 側で英語 term の周囲を JA で囲めば classifier は segment-dominant-JA と判定して silent になる。allowlist を足すと将来の真の untranslated 見逃しを生み、EN(t) vs JA(t) (diff2) の検知精度を dilute するため、**baseline への追加と同じく禁止**。

**§5.3.7 mechanism 変更点** (1 箇所のみ):

- `scripts/lib/parity_glossary_mask.mjs` 155 行目: `const CJK_RE = /[...]/` → `const CJK_RE = /[...]/g` (1 文字追加)

以下は完全保全:

- `maskSegmentText` (glossary + invariant masking 本体) 無変更
- URL strip pass (bare URL / GFM autolink / markdown link / `/docs` link) の順序・regex 完全保全 (PR #293 URL-before-mask ordering 契約)
- §5.3.6 preStrip backtick regex 完全保全
- `RESIDUE_MIN_WORDS=3` / `RESIDUE_MIN_LENGTH=15` threshold 定数 無変更
- classifier flow: `normalizeSegmentText → preStrip → maskSegmentText → residue → englishPortion (CJK strip) → words → threshold`
- **新たな allowlist / tech-token filter / hasCjk gate は一切追加しない**

**cascade 解消結果** (38 件 × 22 slug):

- **22 件**: 既存 baseline entry に fingerprint 一致 (sectionPath + jaSourceFingerprint で frozen 済、gate blocking 無し)
- **16 件**: runtime surface する新 active で **全 content-level JA 翻訳** で吸収 (16 slug across 11 files: accessibility × 2 slug, element-accessibility × 2 slug, html-attribute × 1, pixel-validation × 4, validate-download, debug-helper, how-to-record, network-logs, test-runs, salesforce-troubleshoot, version-control-branches)
- **新規 baseline 追加**: **0 件** (Category A 相当の 5 件も全て content-level 翻訳で吸収)

**content-level 翻訳戦略**: 英語 term の 3 件以上の連続列挙を JA word / フレーズで wrap し、classifier の residue word-count を `< RESIDUE_MIN_WORDS=3` に抑え込む。典型パターン:

- 4 tech token 列挙 → JA 対訳 4 つ + UI label 英語表記を括弧注記に集約 (例: `Critical、Serious、Moderate、Minor` → `重大、深刻、中程度、軽微 の 4 段階から選択します（UI 上は英語表記）`)
- status symbol `x` / `v` → Unicode ×マーク / ✓マーク で置換 (test-runs)
- 例値の enumeration → 単一代表値 + "例:" 表現に短縮 (user47 等)
- UI ブランド名 enumeration → "YouTube や Twitter などの各種 SNS" 等に圧縮

**副次効果 — RESIDUAL → RESOLVED 昇格**: `results/test-runs` は content-level Unicode 置換で status-symbol residue が消え、classifier が fully-masked 判定する。既存 baselined segment-untranslated entry が runtime で不要となり、baseline 1 件を削除。`scripts/__tests__/source_parity_representative_summary.test.mjs` の RESIDUAL_PAGES から RESOLVED_PAGES へ昇格。

**regression ガード**:

- `scripts/__tests__/parity_glossary_mask.test.mjs` の `classifySegment — §5.3.7 CJK_RE g-flag fix` describe block に **6 test** (primary CJK g-flag × 2 / pure-EN segment flagged 1 / mixed JA/EN prose flagged 1 / PR #293 URL 規制 1 / §5.3.6 GFM double-backtick 1) を pin。
- 既存 `§5.3.6 preStrip backtick fix` describe block (7 test) + `URL/link stripping order (M2-P2-1 pilot regression)` describe block (11 test) は全て byte-identical に pass、PR #293 / §5.3.6 contract の完全保全を confirm。
- Spec Invariant 5 `GLOSSARY common-word false-negative regression` guard (`Press Enter key` など) は **allowlist を導入していないため自動的に保全** (hasCjk gate は不要)。

**parity delta (vs origin/main)**:

| metric                             | BEFORE (origin/main) | AFTER (§5.3.7 rework)        | delta                   |
| ---------------------------------- | -------------------- | ---------------------------- | ----------------------- |
| baseline entries                   | 150                  | 149                          | **-1** (test-runs 解消) |
| baseline additions                 | —                    | 0                            | **0**                   |
| `segment-untranslated` in baseline | 17                   | 16                           | -1                      |
| active actionable files            | 0                    | 0                            | ±0                      |
| content translations applied       | —                    | 16 active + 5 would-be-Cat-A | 21 slugs                |

**goal alignment**: baseline → 0 の M2 ゴールに整合。**baseline 追加 = 0、allowlist 追加 = 0** を両立し、cascade は全て content-level JA 翻訳で吸収。検知精度 (EN(t) vs JA(t) diff2) は dilute なし。

### 5.2 Source-first mechanical exceptions (M4 policy 補足)

M4 で確立した "JA 独自構造禁止" policy は **content-level** の独自構造追加を禁止する。以下は **mechanical / parser-level** の例外であり、検知器 (`source_parity_structure`) が kind-multiset fingerprint 上で許容している既知パターン。plan に明示登録することで、後続 agent が JA 独自構造との混同 / loophole 化するのを防ぐ:

1. **flat リスト (`<ol>` / `<ul>` / 両者 interleave) の複数分割**: EN の単一 `<ol>` / `<ul>`、もしくは `<ol>` / `<ul>` + orphan `<p>` の interleave に non-`<li>` sibling (`<img>`/`<p>`/`<div class="note">`) が混在する場合、JA はリストを複数に分割して sibling をリスト外に出してよい。`<li value="N">` 属性に対応する番号は手動指定。(P2-1 pilot `deep-link-mobile` で `<ol>` pattern を pin、P2-2 Wave 1 `generating-a-random-value` で `<ul>` + `<ol>`/`<ul>` interleave pattern を pin。いずれも kind-multiset fingerprint で同値)
2. **`:fa-arrow-right:` 段落融合**: EN の矢印 `→` プレフィックス段落は JA で `**...するには:**` に変換するだけで段落は分離しない (PARITY_GUIDE §頻出パターン 2 / WRITING_GUIDE §313 で既定義。WRITING_GUIDE が authoritative: JA 側には先頭 `→` glyph を付けない)

exception 追加は **reviewer 承認 + plan への明示登録** を条件とし、個別 PR の自由裁量では追加しない (security L2 gate)

### 5.4 Tier 2 Sev 3 follow-ups (2026-04-17, non-blocking backlog)

Wave 3 Batch 2 (PR #309 testim-overview / #312 audit-signals-triage / #314 reports) 4-reviewer gate で発見された高温度 Sev 3。M2 cutover をブロックしないが将来 mechanism PR で個別解消すべき 3 件。

**(1) `normalizeEnArtifacts` EN-only `\d+\.(\S)` space-insertion asymmetry** (audit noise root cause) — **[Resolved via §5.3.5 (PR #322)]**

- **発見**: PR #312 agent 77 reviewer
- **所在**: `scripts/lib/source_parity_extract.mjs` (EN-side normalize pass), `scripts/lib/source_parity_checks.mjs` (`compareSnapshotStructure` call site)
- **症状**: EN 側でのみ `\d+\.(\S)` (番号+ピリオド+非空白) パターンにスペースを挿入する正規化が走り、JA 側では同等処理が走らない。結果、EN=「1.foo」→「1. foo」、JA=「1.foo」のまま。turndown 出力や直書き markdown で両言語に同形パターンが存在する場合に非対称な paragraph 分割差が発生し、`paragraph-count-mismatch` / `step-count-mismatch` の audit noise を誘発する
- **影響範囲**: audit-signal 系 (`COARSE_SIGNAL_TYPES` allowlist 内) のみ。baseline / gate-blocking path には及ばない
- **対応**: §5.3.5 で Option A (対称適用) で解消。`normalizeNumericPeriodSpacing` helper を新設して `compareSnapshotStructure` 内で EN/JA 両側に同じ pass を適用する。詳細は §5.3.5 参照
- **Sev**: 3 (noise suppression / signal hygiene)

**(2) classifier `preStrip` backtick no-op + `CJK_RE.replace` missing global flag**

- **発見**: PR #309 agent 73 reviewer
- **所在**: `scripts/lib/parity_glossary_mask.mjs` `classifySegment` 周辺
- **症状**:
  - `preStrip` pass で backtick (`` ` ``) 除去を試みているが実際には no-op になっており、backtick inline が masking 前に strip されないケースがある
  - `CJK_RE.replace(...)` 呼出で global flag (`g`) が欠落。最初の 1 match のみが置換される設計バグ。複数 CJK segment を含む長文 paragraph の classification 精度に影響
- **影響範囲**: classifier 精度低下による false-positive / false-negative の僅かな揺れ。現状 PR #293 で導入した "URL-before-mask ordering" の regression は無く、Tier 2 merge までの counter には悪影響なし
- **対応 (全完了)**:
  - **Bug 1 (preStrip backtick no-op)** → `[Resolved via §5.3.6 (PR #324)]` GFM double-backtick code-span に対する pre-strip regex の拡張で解消。§5.3.6 参照
  - **Bug 2 (`CJK_RE` missing `g` flag)** → `[Resolved via §5.3.7 (PR #325)]` CJK_RE `/g` flag 追加の **mechanism 1 文字 fix** のみで Bug 2 を完了。surface する cascade 38 件 (22 slug) は allowlist / baseline を一切追加せず、**全て content-level JA 翻訳で吸収** (16 active + 5 Category A would-be + 22 既存 baseline match)。RESIDUAL_PAGES `results/test-runs` は Unicode ×/✓ への content-level 置換で RESOLVED 昇格 (baseline -1)。§5.3.7 参照
- **Sev**: 3 (accuracy / hidden latent bug) — **両 Bug 解消済**

**(3) EN upstream: Smart Locators anchor broken at `salesforce-testing/core-concepts#smart-locators`**

- **発見**: PR #314 QA reviewer (reports slug)
- **所在**: `docs.tricentis.com/testim` 上流 EN page `salesforce-testing/core-concepts` の `#smart-locators` anchor
- **症状**: EN ソース側で `#smart-locators` が該当 section に出力されておらず、内部リンクが 404 / empty-anchor となる。JA 側 PR #314 でも anchor リンクを一旦削除する措置済 (PR-introduced の不具合ではない)
- **影響範囲**: EN 原文の broken link。`check:snapshots` diff には現れない (anchor は fragment で HTML body 変化なし)。JA 翻訳側では代替として「スマートロケーター」テキストを bold 強調で残す運用を継続
- **対応**: Tricentis 本家 docs 上流チームへ issue report。本リポ側で直接修正不可。運用回避は PR #314 で対応済
- **Sev**: 3 (external / upstream-owned)

**scope lock (§5.4)**: 本 section は **discovery record** であり、個別 mechanism PR が起票される時点で §5.3.N として mechanism-pending registry に昇格する (その際は本 §5.4 entry を "Resolved via §5.3.N (PR #XXX)" に書き換える)。追加 Sev 3 項目の登録は **L2 gate (reviewer 承認 + 本 plan への明示登録)** を経由する。

## 6. Tracking

各 phase PR は本 plan に進捗追記 (before/after counter)、M2 完了時に M3 plan (Rev 7) §10 入力として summary commit。
