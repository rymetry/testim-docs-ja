# パリティ維持ガイド

パリティチェック（`npm run check:parity`）で検出される EN/JA 構造差分の維持・管理手順と頻出パターンをまとめたガイドです。

## 本ガイドの位置づけ

`parity-baseline.json` の entries = 0 を達成済み。本ガイドは burn-down 完了後の **steady-state maintenance** モードで運用される。

- **上位契約**: [WRITING_GUIDE.md §Source-First 構造契約](./WRITING_GUIDE.md) / [TRANSLATION_GUIDE.md §翻訳の構造契約](./TRANSLATION_GUIDE.md)
- **本ガイドの責務**: baseline = 0 を維持するための **maintenance recipe**、新規 issue 対応フロー、並列エージェント運用手順
- **不変量**: baseline は **単調非増加** (新規追加は厳格条件下のみ)。`docs/SYSTEM_SPEC.md` §システム不変量 参照

## パリティチェックの実行

```bash
# フルラン (全 slug)
npm run check:parity

# 単一 slug
npm run check:parity -- --slug=advanced-editing/loops

# セクション指定
npm run check:parity -- --section=advanced-editing
```

出力の読み方:

- **active issues**: 現在検出されている構造差分 (= 要対応)
- **baselined issues**: baseline に登録済みの既知 issue (= 0 であるべき)
- **patchCoverage**: `en_source_patches` の hit/mismatch 状態

## 新規 issue の対応フロー

パリティチェックで新規 issue が検出された場合の判断フロー:

```text
新規 issue を検出
  |
  +-- JA 側の構造修正で解消可能か？
  |     |-- Yes --> JA content を修正 (source-first 原則に従う)
  |     +-- No  --> 次へ
  |
  +-- EN upstream が壊れているか？
  |     |-- Yes --> 適切な許容機構で退避 (下記 §許容機構 参照)
  |     +-- No  --> 次へ
  |
  +-- 検知器の false-positive か？
        |-- Yes --> mechanism fix (検知コード修正、別 PR で)
        +-- No  --> STOP して coordinator に相談
```

### baseline 追加の厳格条件

以下に該当する場合のみ baseline 追加を許容する（それ以外は必ず修正する）:

| 状況 | baseline 許容 | 理由 |
| --- | --- | --- |
| EN upstream 自体が壊れている (`source-unusable` / `snapshot-incomplete`) | ✅ | upstream 修正待ち、`scripts/lib/source_sync_exclusions.mjs` が canonical |
| EN-only の小 artifact (具体 EN HTML anomaly に traceable) | △ **厳格条件下のみ** | 下記 §EN-only artifact の厳格条件 参照 |
| JA 側の構造修正で簡単に解消可能 | ❌ | content 修正で解消 |
| Testim UI 用語で GLOSSARY 未登録 | ❌ | GLOSSARY Tier A/B に追加 |
| 一般 IT 用語で INVARIANT 未登録 | ❌ | INVARIANT narrow pattern に追加 |
| `segment-inconclusive` (tokenless-near-tie / heading-count-mismatch) | ❌ (自動判断禁止) | agent は触らず残し、完了報告で人手 review 依頼 |

#### EN-only artifact の厳格条件

baseline 追加には **以下を全て満たす** 必要がある:

1. **具体 EN HTML anomaly への traceability**: `snapshots/en/content/<slug>.html` 内の具体的な EN 側不整合に 1:1 対応すること。抽象理由は不可
2. **1 slug あたり最大 1 件**: 同一 slug で 2 件以上発生した場合は baseline せず、page 単位で `source_sync_exclusions` への登録を判断する
3. **Baseline entry への justification 必須**: `parity-baseline.json` の該当 entry に `rationale` フィールドで具体 anomaly を 1 文で記述する
4. **schema v2 契約**: `priority` (`high`/`medium`/`low`、default `medium`) を必ず設定し、`note` フィールドに具体 anomaly の 1 文記述を書く

## 許容機構 (2-mechanism design)

EN upstream の欠陥を JA side に mirror させず吸収するため、本 repo は **2 機構のみ**を採用する。どちらも **"broken-EN retreat" という ONE purpose** に属し、粒度が異なるだけ (第 3 の許容機構追加は禁止。`docs/SYSTEM_SPEC.md` §2-mechanism suppression design 参照)。

### Mechanism 1: page-level freeze (`scripts/lib/source_sync_exclusions.mjs`)

ページ全体が MadCap 出力で使い物にならない slug を snapshot 凍結対象として登録。snapshot fetch は行うが実際の file は上書きせず、`source-sync-status.json.pages[].fetchStatus` に `excluded-broken` / `excluded-recovered` を出力する。

### Mechanism 2: segment-level patch (`scripts/lib/en_source_patches.mjs`)

ページの一部に限定した MadCap authoring artifact (ZWSP 段落、broken pipe row、href-miswire 等) を抽出前に literal replace する。粒度を保ちつつ JA を source-first mirror させられる。

### Lifecycle (entry 追加 → 上流修正 → 削除)

1. **登録**: upstream 欠陥を人手で検証後、適切な mechanism に entry 追加 (`reviewAfter` を `addedAt` + 6 ヶ月で必ず設定)
2. **自動検知**:
   - `scripts/detection/check_upstream_recovery.mjs` が毎 run で `upstream-recovery-status.json` を derive
   - 各 entry に `statusA` (`active` / `stale` / `unknown`) と `statusB` (`current` / `overdue`) が付与される
   - `en_source_patches_integration.test.mjs` は全 patches を slug-driven で scan (非 gating warning)
3. **上流修正後の surfacing** (non-blocking):
   - PR trigger: `.github/workflows/ci.yml` の sticky comment が hidden marker `<!-- upstream-recovery: sticky -->` で idempotent upsert
   - Weekly trigger: `.github/workflows/scheduled-actionable.yml` が `upstream-recovery-status.json` を artifact upload し、`detection_reports.mjs` が `sourceSyncHealth` family 内の `enPatchRecovery` / `sourceSyncRecovery` section で managed issue に surface
4. **人手削除**:
   - registry entry を削除 (seeded pin test があれば併せて解除)
   - `docs/UPSTREAM_DEFECTS.md` の対応 entry を archive 状態に更新
   - 該当 JA file の parity check (`npm run check:parity`) が引き続き 0 issues であることを確認

### 禁止事項

- 第 3 の許容機構 (新 registry / 新 ack 経路) を追加すること
- `reviewAfter` を将来の日付に延期して実質的な長期凍結にすること (`priority='high'` + PR paydown schedule で代替)
- entry 削除前に upstream 修正を目視確認しないこと (`statusA: 'stale'` は signal であって confirmation ではない)

### Status 判定と graceful degradation

- `statusA`: `preprocessEnHtml` (en_patches) と `source-sync-status.json.fetchStatus` (exclusions) で決定
- `statusB`: `reviewAfter` が UTC 00:00 を過ぎた瞬間に `overdue`
- `source-sync-status.json` 不在時 (local dev / PR CI) は全 exclusion entry が `statusA: 'unknown'` になり、stale 判定には使われない (fail-safe)

### 絶対原則: 許容機構は broken EN snapshot 退避にのみ正当化される

検知システムの purpose は EN(t) vs EN(t-1) (diff1) と EN(t) vs JA(t) (diff2) を両方 0 に収束させることである。

- **許容機構 (allowlist / registry / exclusion) は、壊れた EN snapshot を退避する用途にのみ正当化される**
- それ以外の「技術用語は英語維持でよい」等の allowance は **検知精度の dilute であり、設計違反**
- JA 側で英語 term 周囲を JA context で囲めば classifier は segment-dominant-JA と判定して silent になる (natural translation path)

## EN source patches layer

`scripts/lib/en_source_patches.mjs` は **broken upstream defect の HTML 境界 patch 層**。`preprocessEnHtml(html, { slug, patchCoverage })` が canonical EN HTML を生成する際に slug-scope で literal `find → replace` を適用する。JA markdown 側で workaround を埋め込むことは禁止。

**特徴**:

- 4 enum `defectClass` (`typo` / `href-miswire` / `madcap-artifact` / `stale-reference`) 以外は登録不可
- 各 entry は `docs/UPSTREAM_DEFECTS.md` の UD-NNN で upstream tracker へ結線される
- Idempotent (`replace` は `find` を含まない)、Order-independent (slug-scope disjoint)
- `parity-check-status.json.debug.patchCoverage` で hit / mismatch を可視化
- `reviewAfter` 日付 (通常 addedAt + 6mo) で upstream 修正確認サイクルを回す

**entry 追加手順**: `docs/UPSTREAM_DEFECTS.md` を参照。

### Baseline regen PR 説明 template

patch layer / allowlist に変更を入れた PR の description には必ず以下を明記する (baseline net delta の透明化):

```text
Baseline delta: {before} → {after} ({net})
  - orphan 除去: {removed} entries
  - 新規追加:   {added} entries  (binary gate: must be 0)
  - 正味:       {net}

patchCoverage snapshot:
  - matchedHits: {N}
  - mismatches:  {M}  (should be 0; 非ゼロなら diagnose)
```

新規追加 `> 0` は即 PR block。

## 頻出パターン (reference)

### 1. preface に frontmatter description の重複段落（segment-extra）

多くのファイルで、frontmatter の `description` と同内容の短い要約段落が JA の preface にだけ存在する。EN は 1 段落のみ。

```text
修正前 (JA):
---
description: テスト実行の概要を説明します。
---
テスト実行の概要を説明します。        ← この行が余分

テストは CLI またはスケジューラーから...

修正後 (JA):
---
description: テスト実行の概要を説明します。
---
テストは CLI またはスケジューラーから...
```

### 2. 手順導入文の段落分離（segment-extra + section-structure-mismatch）

EN の `:fa-arrow-right:` パターン（手順の導入文）が JA で別段落に分かれている。

```text
修正前 (JA):
ループを使用すると、同じアクションを繰り返せます。

**ループを設定するには:**

修正後 (JA):
ループを使用すると、同じアクションを繰り返せます。→ **ループを設定するには:**
```

### 3. callout 内の番号付きリスト（segment-extra）

EN が `<p>` 内にインラインで書く callout を、JA が Markdown 番号付きリストに展開している。

```text
修正前 (JA):
:::warning
以下の制限があります:
1. 制限 A
2. 制限 B
3. 制限 C
:::

修正後 (JA):
:::warning
以下の制限があります: 1. 制限 A 2. 制限 B 3. 制限 C
:::
```

### Wave 2 実績 pattern catalog

P2-2 で burn-down 済の source-first pattern 一覧。各 pattern は `scripts/__tests__/source_parity_clean_page_fixtures.test.mjs` の `CLEAN_PAGE_SLUGS` 内 sentinel slug で zero-drift として pin 済。

| # | pattern | 概要 | canonical sentinel slug |
| --- | --- | --- | --- |
| 1 | Arrow-fusion | EN 単一段落を JA が 2 段落に分離していた drift を soft-break 融合で zero-drift 化 | `editing-tests/editing-your-tests/editing-target-element-properties` |
| 2 | Flat-list split | EN 単一 `<ol>` / `<ul>` に orphan block が interleave する構造を、JA 側でリスト分割 + `<li value="N">` 手動指定で mirror | `advanced-editing/deep-link-mobile` |
| 3 | ASCII punctuation mirror | UI-term `<li>` 内の trailing `.` を JA で維持し、score 低下を防止 | `integrations/visual-validation/lambdatest_integration` |
| 4 | URL token verbatim mirror | EN URL が HTTP 200 OK で生きている限り verbatim mirror | `integrations/visual-validation/lambdatest_integration` |
| 5 | Broken-table-row paragraph mirror | EN MadCap Flare の `<table>` 外 orphan paragraph を backslash-escaped paragraph で mirror | `salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce` |
| 6 | HTML `<table>` cell `<br />` mirror | EN `<td>` の `<br />` をそのまま保持 | `advanced-editing/keyboard-shortcut-step` |
| 7 | JA navigation link removal | EN self-link MadCap artifact を JA 側でリンク除去して mirror | `salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce` |
| 8 | Generic-English-residue translation | 一般英語語は JA 化、Testim / vendor name は英語維持 (GLOSSARY 運用) | `integrations/grid-management` |

各 pattern の判定・対処の詳細は sentinel test の slug コメントを canonical reference とする。TRANSLATION_GUIDE §5.5 にも同 8 pattern の翻訳観点を codify している。

## Source-first 例外の canonical registry

Source-first 構造契約 ([WRITING_GUIDE.md](./WRITING_GUIDE.md)) の例外として認められた pattern の registry。

### Mechanical exceptions (parser-level)

kind-multiset fingerprint 上で検知器が許容する既知 pattern (flat-list split / arrow-fusion 段落融合 等)。個別 PR の自由裁量で追加禁止 (reviewer 承認 + 明示登録の security L2 gate)。

具体 pattern は上記 §Wave 2 実績 pattern catalog を参照。

### Mechanism-pending carve-outs

content 修正で 0 到達不能な mechanism-level 残存 (FileOrFilePath paragraph vs code-fence kind-mismatch / EN self-link artifact 等)。未登録の mechanism-pending を agent が自主宣言するのは禁止。新 pattern は `[PENDING REVIEWER APPROVAL]` マーカー経由で提案する (下記 §並列エージェント委任チェックリスト 参照)。

## 並列エージェント委任チェックリスト

各 agent 向けに送る情報:

- [ ] 対象 slug と issue の issueType 内訳
- [ ] EN snapshot path (`snapshots/en/content/<slug>.html`) と JA path (`src/content/docs/<slug>.md`)
- [ ] [WRITING_GUIDE §Source-First 構造契約](./WRITING_GUIDE.md) を必読指定
- [ ] [TRANSLATION_GUIDE §翻訳の構造契約](./TRANSLATION_GUIDE.md) を必読指定
- [ ] **禁止事項**: JA 独自段落追加 / callout タイプ変更 / 1 callout→2 callout 分割 / 番号リスト展開 / 読者向け親切補足
- [ ] **`segment-inconclusive` 取り扱い禁止**: 該当 entry が slug に含まれる場合は該当 entry のみ触らず、完了報告に「inconclusive 残留 N 件、人手 review 依頼」と明記する
- [ ] **完了条件**: `npm run check:parity -- --slug=<slug>` で該当 slug の active / baseline 両方が 0 件（inconclusive 除く）
- [ ] **PR scope**: 1 slug / 1 PR または関連 slug の小 batch。検知コード修正は別 PR

### 並列エージェント委任時の注意

- **翻訳ガイドライン**: `docs/TRANSLATION_GUIDE.md` のルール（Testim 用語英語維持、ですます調、NG/OK パターン）を必ずエージェントに送ること
- **PR 分離**: 検知コードの修正とドキュメント修正は別 PR にする
- **EN ゴミ混入禁止**: EN のアーティファクト（`</Image>` 等）を JA に含めない
- **テスト確認**: リスト項目数を変更したら `KNOWN_ORDERED_DRIFTS`（`source_parity_segments_boundary.test.mjs`）を確認
- **Prettier 注意**: `npm run format` はリポジトリ全体を変更する。PR 対象ファイルのみに限定する
- **新 pattern の提案手順**: エージェントが未知 pattern の mechanism-pending residual を発見した場合、PR description / コミット message に `[PENDING REVIEWER APPROVAL]` マーカーを付与して提案する。reviewer gate の承認を経て初めて登録する

## PR merge gate matrix

全ての PR が `parity-baseline.json`、`scripts/lib/source_parity_*`、`scripts/lib/en_source_patches.mjs` を touch する場合、以下の gate を通過しない限り merge 不可。

### 必須不変量

1. **Baseline delta is monotonic non-increasing** (`Δ entries ≤ 0`)
   - PR description に before/after entries count を明示必須
   - `Δ > 0` は契約違反。architect + plan-fidelity reviewer の明示的 override 署名が PR description に必要
   - cascade / mechanism PR でも例外なし

2. **No new suppression lane**
   - 許容される suppression lane は **`SOURCE_SYNC_EXCLUSIONS` + `en_source_patches` のみ**、いずれも broken-EN 退避用途に限定
   - 新規 allowlist / carve-out / acknowledgement の導入は不可
   - 検知 false-positive は silent suppression ではなく mechanism fix で解消する

3. **6-reviewer signoff matrix (parallel, all required)**:

   | Reviewer | 観点 |
   | --- | --- |
   | architect | design integrity / spec 契約整合 / layer boundary |
   | QA | behavior correctness / regression risk |
   | testing | test coverage + regression pins (80%+ coverage) |
   | security | L2 gate for exception additions / 設計違反スコープ逸脱検知 |
   | Codex (external model) | independent second-opinion review |
   | plan-fidelity | plan/spec 文言整合 / marker protocol 遵守 / 未登録 carve-out 検知 |

4. **Test pins (must pass)**:
   - `scripts/__tests__/source_parity_clean_page_fixtures.test.mjs` (sentinel slugs の totalIssues=0)
   - `scripts/__tests__/en_source_patches.test.mjs` / `_integration.test.mjs` (patch-registry invariants)
   - `scripts/__tests__/generate_parity_baseline.test.mjs` (pre-regen gate)
   - 各 regression guard

5. **Baseline regen cycle**: PR merge 後の full `--regenerate` は必ず pre-regen fail-closed gate を pass。CI run log に `baseline-regen-gate: pass` を明示。

### 違反時の運用

- gate 違反 PR は `REQUEST_CHANGES` で返却。gate override は architect + plan-fidelity reviewer の **両者明示署名** が必須 (single-reviewer override 不可)
- Codex review は review-ordering 上 **最終 reviewer** (他 5 reviewer が揃った後に発火)
- ad-hoc carve-out の導入禁止 (marker protocol を経由)

### Source contract

- `docs/SYSTEM_SPEC.md` §システム不変量 (suppression-lane contract, baseline 単調非増加原則)
- `.claude/CLAUDE.md` §Core Invariants (仕様変更ポリシー、5-counter DoD、2-mechanism 契約)

## EN ソース side の既知 artifact

EN upstream に由来する artifact の扱い:

| artifact 種別 | 対応層 | 例 |
| ------ | -------- | ------ |
| Page 全体が壊れている | `scripts/lib/source_sync_exclusions.mjs` (page-level update-lock + 復旧 probe) | `testops/testops-version-control/pull-requests` |
| URL / link token の差異 | `scripts/lib/parity_normalize.mjs` (URL rewrite ルール) | `help.testim.io/docs/X` ↔ `/docs/X` |
| 英語 UI 用語・機能名 | `docs/GLOSSARY.md` + `parity_glossary_mask.mjs` | `Visual Editor`, `Pre-run hook` |
| 英語 invariant pattern | `docs/INVARIANT_TOKENS.md` + `parity_glossary_mask.mjs` | `--project-id`, `Shift+S` |
| EN HTML 内の segment-level 具体 defect | `scripts/lib/en_source_patches.mjs` (slug-scope literal find→replace) | `docs/UPSTREAM_DEFECTS.md` 参照 |
