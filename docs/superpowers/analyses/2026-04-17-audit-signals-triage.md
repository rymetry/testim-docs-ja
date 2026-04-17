# M2 Wave 3 Infra — Audit Signals + Advisory Queue Triage

**Date:** 2026-04-17
**Branch:** `claude/m2-infra-audit-signals-triage`
**Scope:** Triage 38 audit signals (26 files) + 6 advisory queue entries (6 files)
**Parent plan:** [2026-04-16-m2-parity-burndown.md](../plans/2026-04-16-m2-parity-burndown.md) §P2-5 (inconclusive + audit-signal gate)
**Authority refs:** [PARITY_GUIDE.md](../../PARITY_GUIDE.md) §EN-only artifact 厳格条件 / §並列エージェント委任 §5.3.N marker protocol

> **Approval status (2026-04-17 post-merge):** Analysis approved 2026-04-17. §5.3.1.a implemented in PR #316, §5.3.4 implemented in PR #319. Numbering note: Proposal A is a scope extension of existing §5.3.1 (filed as §5.3.1.a, not a new §5.3.3 — the latter number was assigned to the JA omission registry in PR #318). Proposal B retained its proposed §5.3.4 number. 2 of 15 source-originating audit signals are now classified-as-artifact (suppressed via merged mechanism PRs); the remaining 13 flow into the Wave 4 content backlog (§3/§5.3).

## 0. Context — audit tier mechanics

`npm run check:parity` は 2 tier で diff を分類する:

- **Tier a (gate-blocking)**: `parity-baseline.json` entries + 新規 actionable drift（現状 201 entries / 84 files、P2-5 で 0 化目標）
- **Tier b (audit-only)**: `COARSE_SIGNAL_TYPES` = `{paragraph-count-mismatch, step-count-mismatch, table-shape-mismatch, heading-mismatch, ...}`（`scripts/lib/source_parity_types.mjs:61`）— gate exit code / `reportableActiveFiles` からは除外され、`summary.auditSignalIssues` counter にのみ集計される

**最終ゴール（`2026-04-16-m2-parity-burndown.md` §1）: auditSignalIssues を含む全 counter を 0 に**。本 triage は P2-5 "inconclusive + audit-signal gate" の前捌きとして、各 entry を (a)/(b)/(c) に分類し、Wave 4/5 の burn-down scope と reviewer-approval が必要な §5.3.N proposal を仕分ける。

## 1. 実測 — 2026-04-17 06:10 run

`parity-check-status.json` / `npm run check:parity` の実測値:

| 分類 | 件数 | ファイル数 |
|---|---:|---:|
| Audit signals (合計) | 38 | 26 |
| └ paragraph-count-mismatch | 29 | 20 |
| └ heading-mismatch | 2 | 2 |
| └ step-count-mismatch | 3 | 2 |
| └ table-shape-mismatch | 4 | 4 |
| Advisory queue (合計) | 6 | 6 |
| └ segment-inconclusive / tokenless-near-tie | 6 | 6 |

> NOTE: ユーザー仕様書の "~9 audit signals / 4 files" は古い実測値。本 run で検証した通り実数は **38 signals / 26 files**。この differential は本 triage deliverable の対象範囲に影響する（Wave 4/5 backlog size の見積もりに反映）。

## 2. 分類フレームワーク

| 分類 | 意味 | Wave 配属 |
|---|---|---|
| **(a) True positive** | 実構造 drift / 内容修正で解消可能 | Wave 4 / Wave 5 content batch |
| **(b) EN-source artifact** | EN 側の parser-level 不整合。JA mirror は policy 準拠。`§5.3.N` 経由で suppression 登録 | Reviewer L2 gate → §5.3.N registry extension |
| **(c) Heuristic noise** | 検知器自体が asymmetric / false positive を生む構造。audit-only policy 継続が正解 | PARITY_GUIDE §audit policy 明示化（content fix 不要） |

## 3. Per-entry 分類 — 38 audit signals

各 entry を pattern-recognition + 代表的 sampling により分類。`JA=+1` 大多数は Wave 2 既知 pattern (`**Xするには:**` split)、`heading-mismatch` は (a) structural、step-count の symmetric normalization bug は (c)、HTML table mismatch で turndown artifact が絡むものは (b)。

### 3.1 paragraph-count-mismatch (29 件)

| # | slug | section | Δ | 根拠 | 分類 |
|---|---|---|---|---|---|
| 1 | administration/project-and-user-management | #3 "Adding Company Teammates" | EN=2 JA=3 (+1) | JA-only 導入段落 or `**Xするには:**` split | **(a)** Wave 4 |
| 2 | administration/project-and-user-management | #6 "Changing/Adding Company Owner..." | EN=1 JA=2 (+1) | 同上 | **(a)** Wave 4 |
| 3 | advanced-editing/api-testing | #1 "Adding a Validate API Step" | EN=9 JA=8 (-1) | JA が merged paragraphs (手動確認必要) | **(a)** Wave 4 |
| 4 | advanced-editing/parameters/parameters-for-groups | #2 "Adding Parameters to a Group" | EN=1 JA=2 (+1) | Wave 2 split pattern（step-count と連動） | **(a)** Wave 4 |
| 5 | advanced-editing/salesforce-apex-action-step | #1 "Adding a Salesforce APEX Action Step" | EN=13 JA=12 (-1) | JA merged (要確認) | **(a)** Wave 4 |
| 6 | advanced-editing/validations/add-network-validation | #1 "Network Validation" | EN=11 JA=10 (-1) | JA merged (要確認) | **(a)** Wave 4 |
| 7 | advanced-editing/validations/mysql-validation | #2 "**Parameters - Packages and JavaScript used in this example:**" | EN=1 JA=2 (+1) | EN `<p>` inline の `1.name 2.name 3.name` (本来は段落) が、`normalizeEnArtifacts` 側で EN のみ `^\d+\.(\S)` → `\d+. $2` に正規化され、JA は未正規化。`**see screenshot:**` が別段落判定される asymmetric extraction | **(c)** heuristic noise（step-count #14 と同根） |
| 8 | advanced-editing/validations/validate-download | #9 "PDF files" | EN=5 JA=6 (+1) | PR #308 で関連 6 件を 0 化した直後の残。JA-only 補足段落が残存の可能性 | **(a)** Wave 4 |
| 9 | advanced-editing/validations/validate-element-text | #17 "Parameter only" | EN=10 JA=8 (-2) | JA が 2 段落分 merged/missing | **(a)** Wave 4 |
| 10 | debugging-tests/js-code-debugging | #2 "Debugging the JS Code in a supported step" | EN=7 JA=8 (+1) | JA-only 補足 or split | **(a)** Wave 4 |
| 11 | debugging-tests/recording-additional-steps-to-fix-bugs | #1 "Start recording" | EN=1 JA=2 (+1) | Wave 2 `**Xするには:**` split 高確度 | **(a)** Wave 4 |
| 12 | debugging-tests/recording-additional-steps-to-fix-bugs | #2 "Start recording at this position" | EN=1 JA=2 (+1) | 同上 | **(a)** Wave 4 |
| 13 | editing-tests/groups | #3 "Reusing a Group" | EN=8 JA=9 (+1) | JA-only 補足 or split | **(a)** Wave 4 |
| 14 | editing-tests/groups | #6 "Changing one instance of a Shared Group..." | EN=2 JA=3 (+1) | 同上 | **(a)** Wave 4 |
| 15 | editing-tests/steps | #5 "Automatically Recorded Steps" | EN=0 JA=1 (+1) | JA-only 段落追加（EN = 0 段落のセクション） | **(a)** Wave 4 |
| 16 | integrations/integrate-testim-to-your-ci/jenkins-integration | #2 "Linux:" | EN=3 JA=2 (-1) | JA merged or EN 独自段落 | **(a)** Wave 4 |
| 17 | integrations/test-management-integrations/xray-integration | #3 "Setting up Xray integration" | EN=4 JA=3 (-1) | JA merged (要確認) | **(a)** Wave 4 |
| 18 | recording-tests/recording-a-mobile-test/configure-tricentis-mobile-agent | #19 "WebDriverAgent (WDA) Errors" | EN=5 JA=4 (-1) | §5.3.1 FileOrFilePath kind-mismatch 対象 slug。code-fence 周辺で EN paragraph が code-block に吸収され JA に戻される asymmetry | **(b)** §5.3.1 既存 scope 拡張 |
| 19 | results/stop-pause-debug-tests | #3 "Run Step by Step" | EN=1 JA=2 (+1) | Wave 2 split 高確度 | **(a)** Wave 4 |
| 20 | results/stop-pause-debug-tests | #4 "Insert a Breakpoint" | EN=2 JA=3 (+1) | 同上 | **(a)** Wave 4 |
| 21 | results/tag-remote-runs-failures | #1 "Tagging a test failure from the test result screen" | EN=2 JA=3 (+1) | 同上 | **(a)** Wave 4 |
| 22 | running-tests/run-in-incognito | #1 "Allow Testim Chrome Extension to Run in Incognito Mode" | EN=2 JA=3 (+1) | EN `Before you can run...  → <strong>To allow...:</strong>` が 1 段落、JA では 2 段落分離（line 30 + 32 で実測確認済） | **(a)** Wave 4 (確定) |
| 23 | running-tests/run-in-incognito | #2 "How to Run Tests in Incognito Mode" | EN=3 JA=4 (+1) | 同パターン（line 50 + 52） | **(a)** Wave 4 (確定) |
| 24 | salesforce-testing/create-a-salesforce-test | #6 "Adding Manual Steps" | EN=4 JA=5 (+1) | Wave 2 split or JA-only | **(a)** Wave 4 |
| 25 | salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce | #3 "How to create prompts" | EN=1 JA=2 (+1) | 同 slug は §5.3.2 登録済（/docs/index self-link）。paragraph drift は別 pattern (Wave 2 split or JA-only) | **(a)** Wave 4 |
| 26 | test-management/locators-auto-improve | #4 "Filtering the Test Library" | EN=3 JA=4 (+1) | Wave 2 split or JA-only | **(a)** Wave 4 |
| 27 | test-management/locators-auto-improve | #5 "Allowing Auto Improve on a Master Read Only Branch" | EN=3 JA=4 (+1) | 同上 | **(a)** Wave 4 |
| 28 | testops/insights/dashboard | #4 "Selecting the Time Period" | EN=3 JA=4 (+1) | 同上 | **(a)** Wave 4 |
| 29 | testops/insights | #1 "Selecting a Branch" | EN=2 JA=3 (+1) | 同上。baseline `section-structure-mismatch + segment-extra` と連動して検知されている | **(a)** Wave 4 |

### 3.2 heading-mismatch (2 件)

| # | slug | detail | 分類 |
|---|---|---|---|
| 30 | advanced-editing/auto-grouping2 | EN H2 'Editing the auto-grouping suggestion' → JA H3（line 75 で実測確認） | **(a)** Wave 4 — JA heading level 昇格 |
| 31 | advanced-editing/hooks | 9 件: EN H2 → JA H3 / EN H3 → JA H4 等（line 169/290/322 等で実測確認） | **(a)** Wave 4 — JA heading hierarchy 全体の再構成 |

### 3.3 step-count-mismatch (3 件)

| # | slug | section | Δ | 分類 |
|---|---|---|---|---|
| 32 | advanced-editing/parameters/parameters-for-groups | (全体) EN=18 JA=17 (-1) | **(a)** Wave 4 — #4 と同根 |
| 33 | advanced-editing/parameters/parameters-for-groups | #2 "Adding Parameters to a Group" | EN=7 JA=6 (-1) | **(a)** Wave 4 |
| 34 | advanced-editing/validations/mysql-validation | #2 "**Parameters - Packages...**" | EN=3 JA=0 (-3) | **(c)** heuristic noise — `normalizeEnArtifacts` (`source_parity_extract.mjs:156`) の `^\d+\.(\S)` → `$1. $2` space insertion が EN のみに適用される asymmetric normalization。EN は `1.name:` → `1. name:` 変換後にステップ 3 件検知、JA は未変換で 0 件検知。同 content (`1.name:` inline pattern) なのに 3 step 差が生じる |

### 3.4 table-shape-mismatch (4 件)

| # | slug | detail | 分類 |
|---|---|---|---|
| 35 | advanced-editing/validations/validate-download | EN=7 JA=6 | **(a)** Wave 4 — PR #308 後の残。1 table 差が残存 |
| 36 | editing-tests/steps | EN=5 JA=4 | **(a)** Wave 4 — EN 4 HTML table + 1 turndown-markdown table = 5 vs JA 4 table。1 table 欠落 or 分割差 |
| 37 | guides/keyboard-shortcuts | EN=2 JA=1 | **(a)** Wave 4 — EN 1 HTML table + 1 turndown-generated markdown table。JA 側で片方を段落化 or 欠落 |
| 38 | salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce | EN=2 JA=1 | **(b)** §5.3.2-adjacent — 同 slug は WRITING_GUIDE "Broken-table-row paragraph mirror" pattern 登録済（pattern #5）。EN MadCap が吐く broken-row `<p>&#124;...&#124;</p>` artifact を `extractTableStructure` が EN 側でのみ GFM table と誤検出する asymmetric parsing。JA は backslash-escaped `\|...\|` paragraph mirror (line 121 実測) で policy 準拠。`extractTableStructure` の table 検出 regex が `\\|` 行 (バックスラッシュエスケープ) を検出しないため、JA 側カウントが 1 少ない |

## 4. Per-entry 分類 — 6 advisory queue

全 6 件は baseline 登録済の `segment-inconclusive / tokenless-near-tie`。CLI 出力では `[audit signals]` counter には**含まれない**が、`advisoryQueueIssues` counter として独立に 0 化目標に入る。PARITY_GUIDE §baseline 追加判断 表で "segment-inconclusive は agent 判断禁止 / 人手 review" と明示されている。

| # | slug | pair | curr/swap score | review-after | 分類 |
|---|---|---|---|---|---|
| 39 | advanced-editing/validations/add-network-validation | "Validate all the image requests" ↔ "Validate a single request" | 2.00 / 2.00 | 2026-10-30 | **(a-inconclusive)** tokenless adjacent example section。手動で body-swap リスクを評価した上で ack か content 修正判断。P2-5 expected reduction ≤ 3 に収める枠内 |
| 40 | overview/changelog | "Enhanced Merge Control" ↔ "Fasten Your Seatbelts!..." | 2.15 / 2.16 | 2026-12-13 | **(a-inconclusive)** changelog の tokenless headline 近接エントリ。swap score が current をわずかに上回る（0.01 差）が意味的に独立 section のため swap 現実性 0。baseline 延長 or 手動 ack 候補 |
| 41 | running-tests/scheduler-mobile | "Activate or Pause" ↔ "Edit" | 1.34 / 1.35 | 2026-11-27 | **(a-inconclusive)** UI 操作 section の tokenless ペア。手動 review |
| 42 | running-tests/scheduler | "Activate or Pause" ↔ "Edit" | 1.34 / 1.35 | 2026-12-22 | **(a-inconclusive)** 上記と同構造（desktop/mobile で同 section 名）。同じ修正方針 |
| 43 | salesforce-testing/changelog | "Switch between users..." ↔ "Permission validation step May 2023" | 1.18 / 1.17 | 2026-12-15 | **(a-inconclusive)** changelog 内 May 2023 タグの連続 2 エントリ。swap score が curr 未満 = swap リスク低、baseline 延長で十分 |
| 44 | test-management/revisions | "Accessing a previous revision" ↔ "Reverting to a previous revision" | 1.26 / 1.26 | 2026-11-28 | **(a-inconclusive)** revision 操作の一対。swap リスクあり得るが手動確認で順序正しさを検証 |

**全 6 件とも人手 review 必須（agent の自動翻訳・ack 追加禁止 / PARITY_GUIDE §並列エージェント委任チェックリスト）**。P2-5 Exit では "segment-inconclusive ≤ 3" となっており、3 件以上の延命は plan 改訂が必要。

## 5. 集計 — 分類別件数

### 5.1 Audit signals (38 件)

| 分類 | 件数 | 比率 |
|---|---:|---:|
| **(a)** True positive → Wave 4 content fix | **34** | 89% |
| **(b)** EN-source artifact → §5.3.N proposal | **2** | 5% |
| **(c)** Heuristic noise → audit-only policy 維持 + extractor fix 別 PR | **2** | 5% |

### 5.2 Advisory queue (6 件)

| 分類 | 件数 |
|---|---:|
| **(a-inconclusive)** 人手 review (baseline 延長 or content 修正判断) | 6 |

### 5.3 (a) Wave 4/5 backlog 内訳

| pattern | 件数 | 推奨対処 |
|---|---:|---|
| Wave 2 `**Xするには:**` split (JA=+1) | ~15 | 既存 recipe で機械的修正 |
| JA-only 補足段落 (JA=+1) | ~6 | JA 段落削除 |
| JA 段落 merged (JA=-1) | ~7 | EN 構造に合わせて分割 |
| heading-mismatch | 2 | JA heading level 昇格 |
| step-count (mysql 除く) | 2 | parameters-for-groups 内 step 追加 |
| table-shape | 3 | JA 側 missing table 翻訳追加 |

### 5.4 §5.3.N proposal 候補 2 件

#### Proposal A: §5.3.1.a `FileOrFilePath inline-code paragraph-count asymmetry` [APPROVED via PR #316 (§5.3.1.a)]

**対象 entry**: #18 `configure-tricentis-mobile-agent.md` §19 WebDriverAgent Errors (EN=5 JA=4)

**症状**: §5.3.1 既存 "FileOrFilePath paragraph vs code-fence kind-mismatch" と同根の asymmetric extraction。EN `<p><span class="FileOrFilePath">...</span></p>` は paragraph kind で extract され、JA code-fence 変換後に `extractParagraphCounts` で 1 段落 miss する。

**Proposed scope extension**: §5.3.1 "FileOrFilePath" carve-out を **paragraph-count mismatch** にも適用する scope lock 追記（`extractParagraphCounts` の code-fence 除外ロジックが mechanism-level に解消されるまで）。

**per-slug cap**: ≤ 1 件/slug（現状 1 件のみ / 既存 §5.3.1 entry と合算でも ≤ 3）。

**Recommended mechanism**: 本 scope 拡張は既存 §5.3.1 entry に `affectedIssueTypes: ['section-structure-mismatch', 'paragraph-count-mismatch']` を明示追記する plan revision のみ。新規 registry 不要。

#### Proposal B: §5.3.4 `Broken-table-row paragraph mirror table-shape asymmetry` [APPROVED via PR #319 (§5.3.4)]

**対象 entry**: #38 `use-agentic-test-automation-for-salesforce.md` EN=2 JA=1

**症状**: EN MadCap が吐く broken-row `<p>&#124;...&#124;</p>` (bare ASCII pipe) を `extractTableStructure` の `extractMarkdownTables` が GFM table として検知する。JA は WRITING_GUIDE pattern #5 "Broken-table-row paragraph mirror" に従い backslash-escaped `\|...\|` 段落で mirror するが、`extractMarkdownTables` regex は `\\|` 行を認識しないため JA table count が 1 少ない。

**Proposed mechanism**: 以下 2 オプションの lesser-evil 判断は reviewer に委ねる:

1. **(Preferred) `extractMarkdownTables` symmetric fix**: `\\|...\\|` (backslash-escaped bare-pipe paragraph) を EN / JA 双方で table として検知しないよう regex を strict 化。これにより EN=1 JA=1 に揃い、broken-row artifact が heuristic で偽陽性を出さなくなる。既存 CLEAN_PAGE_SLUGS に影響しない（pattern #5 sentinel slug 自身が本件）。
2. **(Fallback) slug-scope carve-out**: `parity_artifact_registry.mjs` に table-shape 用 registry を新規追加し、`broken-row-paragraph-mirror` reason で scope-locked suppression。EN 構造を mutate しない点は preferred と同じだが、registry mechanism の duplication cost あり。

**Recommended route**: option 1（mechanism-level fix）— security-reviewer は symmetric extractor 修正を要求する可能性が高く、registry 拡張より lasting。

**per-slug cap**: ≤ 1 件（本案件のみ。他の WRITING_GUIDE pattern #5 該当 slug は `salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce` 1 件）。

### 5.5 (c) Heuristic noise 対処方針

#### #7 (paragraph) + #34 (step): `normalizeEnArtifacts` 非対称適用

**Finding**: `source_parity_extract.mjs:156` の `^\d+\.(\S)` → `$1. $2` space insertion は `normalizeEnArtifacts()` 内で呼ばれ、**EN body のみ** に適用される（`source_parity_checks.mjs:370-377` の `normalizedEnBody` 経路）。JA body は未正規化で `extractStepCounts` / `extractParagraphCounts` に渡るため、EN `1.name:` (inline) は normalization 後に 3 step として抽出され、JA `1.name:` (同 content) は 0 step として抽出される。この非対称が `mysql-validation.md` #2 の `EN=3 JA=0 (-3)` step-count と `EN=1 JA=2 (+1)` paragraph-count を同時発火させている（content は完全一致にもかかわらず）。

**判定**: (c) **heuristic noise**（false positive）。content 修正で解消不能。

**Recommended fix options**:

1. **Symmetric normalization**: `normalizeEnArtifacts` を JA body にも適用 → EN=3 JA=3 で一致。ただし `normalizeEnArtifacts` は元来 "EN のみの artifact" 除去目的で導入されたため、JA 適用は副作用 review 必須。
2. **Narrow the step-count regex**: `^\d+\.\s` (space required) 現行のまま維持し、EN 側の `normalizeEnArtifacts` の space insertion を skip（JA との対称性優先）。EN body の他所で `1.step` patterns が step-count に載っているかの regression 確認必要。
3. **Audit-only policy 継続**: 現 gate-exclusion 仕様のまま据え置き、docs で "known false positive" として PARITY_GUIDE に文書化。P2-5 Exit の `auditSignalIssues = 0` goal と矛盾するため、最終的には #1 or #2 の mechanism fix が必要。

**Proposed action**: 本 triage scope 外（extractor fix は別 PR）。本 deliverable では "known false positive として M3 前に extractor 修正を要する" 旨を PARITY_GUIDE update proposal として残す。

## 6. 提案 — PARITY_GUIDE update [PENDING REVIEWER APPROVAL]

以下の追加 section を `docs/PARITY_GUIDE.md` に reviewer 承認後に差し込む提案（本 PR では draft marker 付きで提案のみ、自動適用しない）:

```markdown
## Audit signal gate policy — P2-5 前捌き結果 (2026-04-17)

`COARSE_SIGNAL_TYPES` (= `{paragraph-count-mismatch, step-count-mismatch, table-shape-mismatch, heading-mismatch, ...}`) は `scripts/lib/source_parity_types.mjs:61` で明示的 allowlist として gate 除外している。M2 P2-5 段階で 38 signals / 26 files が残存し、以下の 3 カテゴリに triage 済:

- **(a) True positive (34 件)**: Wave 4 content batch で `**Xするには:**` split、JA-only 補足段落削除、JA heading level 昇格等で burn-down する
- **(b) EN-source artifact (2 件)**: §5.3.1.a FileOrFilePath paragraph-count scope extension (PR #316 merged) / §5.3.4 broken-row table-shape extractor fix (PR #319 merged) を reviewer 承認経由で登録済（本 guide §EN-only artifact 厳格条件 4 条件 + §5.3.N marker protocol 準拠）
- **(c) Heuristic noise (2 件)**: `normalizeEnArtifacts` の EN-only space insertion による step/paragraph asymmetric extraction。`source_parity_extract.mjs:156` の規則を JA にも対称適用するか、EN 側の space insertion を撤去するかの mechanism-level fix が M3 前に必要。

各カテゴリの詳細は [docs/superpowers/analyses/2026-04-17-audit-signals-triage.md](./superpowers/analyses/2026-04-17-audit-signals-triage.md) 参照。

### Advisory queue (segment-inconclusive) 人手 review protocol

`advisoryQueueIssues` counter の 6 件は全て `tokenless-near-tie` で、PARITY_GUIDE §並列エージェント委任チェックリストに従い **agent 判断禁止**。手動 review で以下を判断:

1. `current ≈ swap` score（0.01 差等）の場合、body swap が実際に起きていないことを human-eyeball で確認 → baseline 延長 ack
2. UI 操作 section pair（"Activate or Pause" vs "Edit" 等）で swap リスクがゼロと確認できれば ack 継続
3. changelog 内の連続エントリは独立意味のため swap リスク低 / ack 継続
```

## 7. Action items

### 7.1 本 PR (Wave 3 infra triage)

- [x] 本 analysis deliverable を `docs/superpowers/analyses/2026-04-17-audit-signals-triage.md` にコミット
- [x] 38 audit signals + 6 advisory queue entries の分類確定
- [x] §5.3.1.a / §5.3.4 proposal を `[APPROVED via PR #316 / PR #319]` marker で post-merge reconcile（初稿は `[PENDING REVIEWER APPROVAL]`、本 rebase で解消）
- [x] `npm run lint && npm run test && npm run build` で gate 緑確認

### 7.2 Reviewer L2 gate 後（本 PR 範囲外）

- [x] §5.3.1.a FileOrFilePath scope extension を `2026-04-16-m2-parity-burndown.md` §5.3.1.a として登録（merged PR #316）
- [x] §5.3.4 broken-row table-shape extractor fix を `source_parity_extract.mjs::extractMarkdownTables` の regex 修正 PR として提出（merged PR #319）
- [ ] `normalizeEnArtifacts` symmetric fix を M3 PR Z entry criteria に入れる判断（reviewer / architect gate）

### 7.3 Wave 4/5 (P2-5 content batch)

- [ ] (a) 34 件を pattern 別 mini-batch で burn-down
  - Batch 1: Wave 2 `**Xするには:**` split (~15 件、既存 recipe で mechanical)
  - Batch 2: JA-only 補足段落削除 (~6 件)
  - Batch 3: JA 段落 merged 分割復元 (~7 件)
  - Batch 4: heading-mismatch 2 件（hooks.md は 9 箇所の一括修正）
  - Batch 5: step-count (parameters-for-groups)、table-shape (validate-download / editing-tests/steps / keyboard-shortcuts) 各 1-3 件
- [ ] Advisory queue 6 件を human review（segment-inconclusive 禁則ルールに従い agent 自動判断回避）

## 8. Constraints 準拠確認

- [x] `src/content/docs/**` 一切未編集
- [x] `snapshots/en/**` 一切未編集
- [x] `parity-baseline.json` 一切未編集
- [x] `docs/superpowers/analyses/` 新規追加のみ
- [x] §5.3.N proposal は analysis 内で管理。初稿は `[PENDING REVIEWER APPROVAL]` marker、post-merge rebase (2026-04-17) で §5.3.1.a (PR #316) / §5.3.4 (PR #319) の `[APPROVED]` marker へ reconcile 済
- [x] PARITY_GUIDE update proposal も analysis §6 の draft として格納、本 PR で直接適用しない
