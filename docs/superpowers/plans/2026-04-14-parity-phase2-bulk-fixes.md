# Parity Phase 2 — Bulk Fixes Plan

> **For agentic workers:** 推奨は superpowers:subagent-driven-development。ただし `parity-baseline.json` / `parity-check-status.json` / Phase report の更新は統合ブランチで直列実行すること。Steps は checkbox (`- [ ]`) で追跡する。

**Date:** 2026-04-14 (codex 提案を採用して再構築、実測ベース更新)

## Goal

Phase 1 完了後の parity 残件を、**実測ベース**で burn-down する。Phase 2 の責務は以下の 4 系統:

1. `segment-untranslated` の大規模削減 (Phase 2.0)
2. `segment-missing` の復元 (Phase 2.2)
3. `segment-token-gap` の解消 (Phase 2.3)
4. `callout-body` 以外の residual `segment-extra` / `section-structure-mismatch` の削減 (Phase 2.4)

高密度 slug (`editing-tests/steps`, `editing-a-steps-properties`) は Phase 2.1 として page 単位でまとめて直す。

## Current baseline (source of truth)

`parity-baseline.json` 実測 (Phase 1 完了直後 / 2026-04-14):

| issueType | count | notes |
| --- | ---: | --- |
| `segment-untranslated` | 1903 | 218 slug、Phase 0 mask が Top 2 には効かなかった残 |
| `segment-missing` | 127 | 66 slug |
| `segment-extra` | 102 | うち `callout-body` 17 は Phase 3 送り |
| `section-structure-mismatch` | 66 | 多くは同 slug の segment 差分の派生 |
| `segment-token-gap` | 49 | 43 slug |
| `segment-inconclusive` | 11 | Phase 4 送り |
| `segment-order-mismatch` | 1 | Phase 4 送り |
| **total** | **2259** | Phase 0 後 2337 → Phase 1 で -78 |

Top slug 参考 (Phase 2.0 優先候補):

- `advanced-editing/cookies`: 57 untranslated
- `advanced-editing/hooks`: 42 untranslated + 1 token-gap
- `recording-tests/recording-a-mobile-test/configure-tricentis-mobile-agent`: 42 untranslated
- `editing-tests/editing-your-tests/editing-a-steps-properties`: 39 untranslated
- `integrations/test-management-integrations/ttm-for-jira-integration`: 38 untranslated + 3 missing
- `editing-tests/steps`: 28 untranslated + 1 structure-mismatch + 1 extra + 1 missing = 31

## Non-goals

Phase 2 では以下は完了条件に含めない:

- `segment-extra` かつ `segmentKind=callout-body` の削除 (Phase 3)
- `segment-inconclusive` の最終判断 (Phase 4)
- `segment-order-mismatch` の最終解消 (Phase 4)
- baseline schema / parity schema の変更 (Phase 4)

## Core principles

- 固定件数を plan に埋め込まず、常に `parity-baseline.json` の**現物**で enumerate する
- `segment-untranslated` はまず glossary / invariant で吸収できる residue を減らし、その後に実翻訳する
- **content 修正は並列可、baseline 更新は直列**
- subagent の完了条件は「**対象 issueType の純減** + **他 issueType の純増なし**」
- `parity-check-status.json` は partial run で上書きされるため、`debug.maskCoverage` を根拠にする場合は**フル run 直後の artifact のみ**使う
- `section-structure-mismatch` は単独で潰しにいかず、対応する content 差分を直した結果として解消させる
- 1 slug に複数 issueType が密集している場合は lane を跨いでも **slug 単位でまとめて直す** 方を優先してよい

## Branch / PR strategy

**推奨:** Phase 2 は **1 統合 PR** で進める。

理由:
- `parity-baseline.json` がグローバル artifact のため、sub-phase ごとに別 PR / 別 baseline 更新をすると競合しやすい
- Phase 1 retrospective でも同理由で単一 worktree 運用へ寄せている
- `segment-untranslated` / `segment-missing` / residual structure は同じ slug 上で同時発生しやすい

**ブランチ構成:**
- 統合ブランチ: `claude/parity-phase2`
- 作業枝 (subagent 用): isolated worktree + 枝名は task ごと
  - content 修正だけ行う
  - `parity-baseline.json` は更新しない
  - 最終的に `claude/parity-phase2` へ集約してから baseline を 1 回だけ再生成する

## File ownership map

- `docs/GLOSSARY.md` — Phase 2.0
- `docs/INVARIANT_TOKENS.md` — Phase 2.0
- `src/content/docs/**/*.md` — Phase 2.0-2.4 (slug ごとに lane を決める)
- `scripts/phase2/enumerate_untranslated_residuals.mjs` — Phase 2.0
- `scripts/phase2/enumerate_missing_segments.mjs` — Phase 2.2
- `scripts/phase2/enumerate_token_gaps.mjs` — Phase 2.3
- `scripts/phase2/enumerate_residual_structure.mjs` — Phase 2.4
- `docs/superpowers/specs/2026-04-14-parity-phase2-report.md` — Phase 2.5

## Execution scope for this round

本 plan は Phase 2.0-2.5 全体を定義するが、本 round (2026-04-14 セッション) では以下を実行:

- **Phase 2.1**: Top 2 files の複合修正 (subagent A)
- **Phase 2.2**: `segment-missing` 復元 (subagent B, 66 slug)
- **Phase 2.3**: `segment-token-gap` 修正 (subagent C, 43 slug)
- **Phase 2.5**: 統合 + baseline 再生成 + report (controller)

次 round 以降で追加実行:

- **Phase 2.0**: glossary 監査 + untranslated 大規模翻訳 (1903 件 → 数 round に分割)
- **Phase 2.4**: residual structure (85 件、callout-body を除く)

---

## Phase 2.0: Glossary audit + segment-untranslated burn-down (次 round)

**Why first:** 最大残件は `segment-untranslated=1903`。ここを先に崩さない限り、Phase 2 の全体成果が薄くなる。ただし 1 セッションでは完走不可能なので、次 round 以降で着手。

### Task 2.0.1: untranslated 残件の enumerate

**Files:**
- Create: `scripts/phase2/enumerate_untranslated_residuals.mjs`

- [ ] **Step 1: enumerate スクリプト作成** (`parity-baseline.json` から `segment-untranslated` を抽出、slug/segmentKind/Top 20 集計)
- [ ] **Step 2: enumerate 実行** (`node scripts/phase2/enumerate_untranslated_residuals.mjs > /tmp/phase2-0-untranslated.md`)
- [ ] **Step 3: 初期優先 slug を確認** (Top 6: cookies / hooks / configure-tricentis-mobile-agent / editing-a-steps-properties / ttm-for-jira / steps)

### Task 2.0.2: glossary / invariant 監査

**Decision rule:** product 名 / UI 名 / feature 名 / 略語 / URL / file path / CLI flag は、まず translation ではなく glossary / invariant を疑う。

- [ ] **Step 1: フル parity run** (`npm run check:parity && cp parity-check-status.json /tmp/phase2-full-parity-status.before-untranslated.json`)
- [ ] **Step 2: `debug.maskCoverage` と untranslated Top slug を照合**
- [ ] **Step 3: `docs/GLOSSARY.md` / `docs/INVARIANT_TOKENS.md` を更新**
- [ ] **Step 4: 効果確認** (再度フル parity、差分測定)

**Exit criteria:** glossary/invariant 追加で吸収できる residue が一段落し、以降は content translation が費用対効果で上回る状態。

### Task 2.0.3: untranslated 実翻訳

- [ ] **Step 1: Top slug から順に修正** (entry 数 + section 集中度 + 他 issueType との同居 + 高密度ページを優先)
- [ ] **Step 2: slug ごとの修正手順** (EN snapshot 参照 → JA 該当 section → 自然な日本語 → glossary/UI/CLI/URL/path 維持 → 不要なリフォーマットしない)
- [ ] **Step 3: slug 単位で parity 確認** (`npm run check:parity -- --slug=<slug>`)
- [ ] **Step 4: 逐次 commit**

**DoD per slug:** `segment-untranslated` が 0 または大きく純減、他 issueType 純増なし、構造保持。

---

## Phase 2.1: Top residual slug の複合修正 (本 round 実行)

**Why separate lane:** 高密度 slug は issueType ごとに割ると破綻しやすい。page 単位でまとめて直す。

**Current scope:**
- `editing-tests/steps` (31 entries: 28 untranslated + 1 structure-mismatch + 1 extra + 1 missing)
- `editing-tests/editing-your-tests/editing-a-steps-properties` (39 entries: 全て `Properties Configuration` セクションの table-cell untranslated)

### Task 2.1.1: 対象 slug を確定

- [ ] **Step 1: 現時点の複合残件 slug を確認**

```bash
node -e "
const b=require('./parity-baseline.json');
for (const slug of ['editing-tests/steps', 'editing-tests/editing-your-tests/editing-a-steps-properties']) {
  const arr=b.entries.filter(e=>e.slug===slug);
  const byType={};
  for (const e of arr) byType[e.issueType]=(byType[e.issueType]||0)+1;
  console.log(slug + ':', arr.length, byType);
}
"
```

- [ ] **Step 2: 必要なら対象追加** (単一 slug に多 issueType 密集、1 section 内で table/list/paragraph が絡む場合)

### Task 2.1.2: `editing-tests/steps` の修正

- [ ] **Step 1: `Automatically Recorded Steps` を EN snapshot と 1:1 で比較**
- [ ] **Step 2: paragraph missing / table-cell untranslated / table-cell extra / structure-mismatch をまとめて解消**
- [ ] **Step 3: slug parity 確認** (`npm run check:parity -- --slug=editing-tests/steps`)

**DoD:** 既存 `segment-missing` / `segment-extra` / `segment-untranslated` が純減、`section-structure-mismatch` が解消または純減、表の row/cell 対応が崩れていない。

### Task 2.1.3: `editing-a-steps-properties` の修正

- [ ] **Step 1: `Properties Configuration` セクションの table 全体を EN に合わせる**
- [ ] **Step 2: table-cell untranslated を row 単位で翻訳**
- [ ] **Step 3: slug parity 確認** (`npm run check:parity -- --slug=editing-tests/editing-your-tests/editing-a-steps-properties`)

**DoD:** `segment-untranslated` 大幅純減、table 構造保持、新規 `segment-extra` / `segment-missing` なし。

- [ ] **Step 4: commit** (両 md を 1 commit で)

```bash
git add src/content/docs/editing-tests/steps.md src/content/docs/editing-tests/editing-your-tests/editing-a-steps-properties.md
git commit -m "fix: Phase 2.1 Top 2 residual slug の複合修正 (steps + editing-a-steps-properties)"
```

---

## Phase 2.2: segment-missing 翻訳復元 (本 round 実行)

**Current scope:** `127 entries / 66 slug`

### Task 2.2.1: enumerate

**Files:**
- Create: `scripts/phase2/enumerate_missing_segments.mjs`

- [ ] **Step 1: enumerate スクリプト作成**

要件:
- `issueType === 'segment-missing'` を抽出
- slug ごと件数降順
- 各 entry: `slug` / `sectionPath` / `segmentKind` / `enSegmentIndex` / `detail` を出力
- `segmentKind` 集計

- [ ] **Step 2: 実行**

```bash
node scripts/phase2/enumerate_missing_segments.mjs > /tmp/phase2-2-missing.md
head -120 /tmp/phase2-2-missing.md
```

### Task 2.2.2: 修正

- [ ] **Step 1: Top 10 slug を優先** (advanced-editing/keyboard-shortcut-step 8、ttm-qtest 7、generating-a-random-value 6、validate-element-attribute 5、validate-download 4、validate-element-text 4、vsts-and-tfs-integration 4、lambdatest_integration 4、project-settings 3、pixel-validation 3)

- [ ] **Step 2: 必要なら subagent 委任** (Top 10 以降の slug を複数並列処理)

**Subagent prompt template:**

```text
Phase 2.2: <slug> の segment-missing 復元

対象:
- JA file: src/content/docs/<slug>.md
- EN snapshot: snapshots/en/content/<slug>.html
- issueType: segment-missing
- entries: section "<sectionPath>" segmentKind=<kind> enSegmentIndex=<idx> …

必須参照: docs/WRITING_GUIDE.md, docs/GLOSSARY.md, docs/INVARIANT_TOKENS.md, docs/TRANSLATION_GUIDE.md

手順:
1. EN snapshot の該当 section で対象 segment を特定
2. JA 側で欠落位置を確認
3. EN segment を自然な日本語で復元
4. glossary 対象語と invariant token は保持
5. npm run check:parity -- --slug=<slug> で再確認

完了条件:
- 該当 slug の segment-missing が 0
- 他 issueType を純増させていない
```

- [ ] **Step 3: 親セッションで review** (`npm run check:parity -- --slug=<slug>`)
- [ ] **Step 4: slug 単位で commit**

```bash
git add src/content/docs/<slug>.md
git commit -m "fix: Phase 2.2 segment-missing 復元 (<slug>)"
```

---

## Phase 2.3: segment-token-gap 修正 (本 round 実行)

**Current scope:** `49 entries / 43 slug`

### Task 2.3.1: enumerate

**Files:**
- Create: `scripts/phase2/enumerate_token_gaps.mjs`

分類:
- `cliFlag` (`--`/`-` で始まる)
- `internalLink` (`/docs/` で始まる)
- `numericOrUnit` (`\d+(ms|sec|s|min|hr|px|em|rem|MB|GB|KB|%)`)
- `externalUrl` (`http` で始まる)
- `mixed` / `other`

出力: `slug` / `sectionPath` / `missingTokens` / `detail`

- [ ] **Step 2: 実行**

```bash
node scripts/phase2/enumerate_token_gaps.mjs > /tmp/phase2-3-token-gap.md
head -120 /tmp/phase2-3-token-gap.md
```

### Task 2.3.2: カテゴリ別修正

- [ ] **Step 1: `cliFlag`** — EN の CLI flag を JA に補う (dash 数 / spelling / inline code formatting を EN に合わせる)
- [ ] **Step 2: `internalLink`** — `/docs/...` の欠落を補う (表示文言は自然な JA、path は canonical)
- [ ] **Step 3: `numericOrUnit` / `externalUrl` / `mixed` / `other`** — token 脱落を個別修正。EN 側 artifact が疑わしいものは修正せず report に送る
- [ ] **Step 4: slug parity 確認**
- [ ] **Step 5: slug 単位で commit**

```bash
git add src/content/docs/<slug>.md
git commit -m "fix: Phase 2.3 token-gap 修正 (<slug>, <category>)"
```

**DoD per slug:** `segment-token-gap` が 0、他 issueType 純増なし。

---

## Phase 2.4: residual `segment-extra` / `section-structure-mismatch` (次 round)

**Current scope:** `segment-extra=102` のうち `callout-body=17` を除く 85 件。
内訳: `unordered-list-item=28` / `paragraph=25` / `table-cell=17` / `ordered-list-item=11` / `details-summary=4`。加えて `section-structure-mismatch=66` の派生整理。

### Task 2.4.1: enumerate

**Files:**
- Create: `scripts/phase2/enumerate_residual_structure.mjs`

- [ ] **Step 1: enumerate スクリプト作成** (`segment-extra` と `section-structure-mismatch` を抽出、`segmentKind` ごと分類、`callout-body` は別出力)
- [ ] **Step 2: 実行**

### Task 2.4.2: 修正方針

- [ ] **Step 1: `paragraph`** — EN 1 paragraph を JA が過分割/過統合している差分を調整、segment 契約一致を優先
- [ ] **Step 2: `unordered-list-item` / `ordered-list-item`** — callout 外 list の item 対応を EN に揃える
- [ ] **Step 3: `table-cell`** — cell 単位ではなく row 全体で確認、片側だけ追加削除しない
- [ ] **Step 4: `details-summary`** — details タイトルを EN 構造に揃える、details ブロックの粒度を変えない
- [ ] **Step 5: `section-structure-mismatch`** — 単独解消を目的にせず、対応する segment 修正の結果として落とす
- [ ] **Step 6: slug parity 確認**
- [ ] **Step 7: slug 単位で commit**

---

## Phase 2.5: 統合、gate、baseline 再生成、report (本 round 実行)

**Important:** ここで初めて baseline を更新する。sub-phase 途中では更新しない。

### Task 2.5.1: 統合ブランチで full gate

- [ ] **Step 1: フル parity** (`npm run check:parity && cp parity-check-status.json /tmp/phase2-full-parity-status.pre-baseline.json`)
- [ ] **Step 2: docs lint / tests / build**

```bash
npm run lint:docs
npm run test
npm run build
```

### Task 2.5.2: baseline 再生成

- [ ] **Step 1: baseline 更新**

```bash
node scripts/generate_parity_baseline.mjs --rationale="Phase 2: Top 2 translation + segment-missing restoration + token-gap fixes"
```

- [ ] **Step 2: 差分確認** — Phase 2 対象 issueType (untranslated / missing / token-gap / 非 callout-body の extra / structure-mismatch) が純減していることを確認

### Task 2.5.3: 完了レポート

**Files:**
- Create: `docs/superpowers/specs/2026-04-14-parity-phase2-report.md`

- [ ] **Step 1: レポート作成**

```markdown
# Parity Phase 2 — Bulk Fixes Report

- **Date**: 2026-04-14
- **Plan**: `docs/superpowers/plans/2026-04-14-parity-phase2-bulk-fixes.md`
- **Executed this round**: Phase 2.1 / 2.2 / 2.3
- **Deferred to next round**: Phase 2.0 / 2.4

## Baseline delta

| issueType | Phase 1後 | Phase 2後 | 差 |
| --- | ---: | ---: | ---: |
| segment-untranslated | 1903 | (実測) | (実測) |
| segment-missing | 127 | (実測) | (実測) |
| segment-token-gap | 49 | (実測) | (実測) |
| segment-extra | 102 | (実測) | (実測) |
| section-structure-mismatch | 66 | (実測) | (実測) |
| segment-inconclusive | 11 | (実測) | (実測) |
| segment-order-mismatch | 1 | (実測) | (実測) |

## Sub-phase summary

- **Phase 2.1**: Top 2 files 修正 (2 slug、~70 entries 削減見込み)
- **Phase 2.2**: missing 復元 (66 slug、127 entries)
- **Phase 2.3**: token-gap 修正 (43 slug、49 entries)

## Deferred to next round / Phase 3 / Phase 4

- Phase 2.0: glossary 監査 + untranslated 1903 件の burn-down
- Phase 2.4: residual structure (非 callout-body の 85 件)
- Phase 3: callout-body 17 件
- Phase 4: inconclusive 11 件、order-mismatch 1 件、schema cleanup
```

- [ ] **Step 2: 最終 commit + PR**

```bash
git add scripts/phase2/*.mjs src/content/docs/**/*.md parity-baseline.json docs/superpowers/specs/2026-04-14-parity-phase2-report.md docs/superpowers/plans/2026-04-14-parity-phase2-bulk-fixes.md
git commit -m "fix: Phase 2 Top 2 + segment-missing + token-gap 修正完了"
git push -u origin claude/parity-phase2
gh pr create --title "fix: Phase 2 Top 2 translation + missing restoration + token-gap" --body "Plan: docs/superpowers/plans/2026-04-14-parity-phase2-bulk-fixes.md"
```

---

## Quality gates

- [ ] `npm run check:parity` が完走する
- [ ] `npm run lint:docs` が通る
- [ ] `npm run test` が通る
- [ ] `npm run build` が通る
- [ ] Phase 2.1 / 2.2 / 2.3 対象 issueType がすべて純減している
- [ ] `callout-body` は残っていてよいが、件数を report に明記している
- [ ] partial run の `parity-check-status.json` を根拠に baseline 更新していない

## Completion criteria (本 round)

Phase 2 本 round 完了条件:

- Phase 2.1: Top 2 slug の複合 issueType が純減
- Phase 2.2: `segment-missing` が明確に減少
- Phase 2.3: `segment-token-gap` が明確に減少
- 次 round / Phase 3 / 4 へ送る残件が report に明文化

## Execution handoff

- **実行方式:** superpowers:subagent-driven-development, model=sonnet 4.6, isolated worktree, background, automode
- content 修正は並列可、baseline 更新と report は統合ブランチで直列実行
- subagent の完了条件は「対象 issueType の純減」であり、「slug の issue 全消し」ではない
- plan の数値は着手時点の実測であり、進行中の判断は常に最新 enumerate に基づく
